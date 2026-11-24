import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import {
  ActiveSecuritySession,
  BlockedIpEntry,
  DEFAULT_SECURITY_CONFIG,
  evaluateBruteForceState,
  inspectStringForThreats,
  inspectValueForThreats,
  isLoopbackOrPrivateIp,
  maskEmailAddress,
  normalizeClientIp,
  scanFileUploadPayload,
  SecurityAction,
  SecurityEvent,
  SecurityWallConfig,
  ThreatSeverity,
  ThreatType,
  validateIpAddress,
  validateStrongPassword,
} from '../src/utils/securityCore';

interface PersistedSecurityState {
  sessionSecret: string;
  passwordSalt: string;
  passwordHashes: string[];
  config: SecurityWallConfig;
  blockedIps: BlockedIpEntry[];
  events: SecurityEvent[];
}

interface OtpChallengeRecord {
  challengeId: string;
  otpHash: string;
  email: string;
  ip: string;
  userAgent: string;
  expiresAt: number;
  attempts: number;
}

interface LoginAttemptRecord {
  failedCount: number;
  lockUntil: number | null;
  lastAttemptAt: number;
}

const STATE_FILE = path.resolve(process.cwd(), '.security-wall-state.json');
const ADMIN_EMAIL = 'abm55136@gmail.com';
const ADMIN_NAME = 'Awais Malik';

function hashPasscodeScrypt(passcode: string, salt: string): string {
  return crypto.scryptSync(passcode, salt, 64).toString('hex');
}

function hashOtpSha256(otp: string, challengeId: string): string {
  return crypto.createHash('sha256').update(`${challengeId}:${otp}`).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length || bufA.length === 0) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function safeEqualText(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function loadFirebaseWebApiKey(): string | null {
  const envKey = (process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY || '').trim();
  if (envKey) return envKey;
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(cfgPath)) return null;
    const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as { apiKey?: string };
    return parsed.apiKey?.trim() || null;
  } catch {
    return null;
  }
}

export class SecurityWallEngine {
  private sessionSecret: string;
  private passwordSalt: string;
  private passwordHashes: string[];
  private config: SecurityWallConfig;
  private blockedIps = new Map<string, BlockedIpEntry>();
  private events: SecurityEvent[] = [];
  private sessions = new Map<string, ActiveSecuritySession>();
  private otpChallenges = new Map<string, OtpChallengeRecord>();
  private loginAttempts = new Map<string, LoginAttemptRecord>();
  private rateBuckets = new Map<string, number[]>();
  private ipThreatCounts = new Map<string, number>();
  private knownLoginIps = new Set<string>(['127.0.0.1', '::1']);
  private metrics = {
    totalInspected: 0,
    totalBlocked: 0,
    rateLimitedCount: 0,
    uploadsScanned: 0,
    uploadsBlocked: 0,
    failedLogins: 0,
  };

  constructor() {
    const loaded = this.loadStateFromDisk();
    if (loaded) {
      this.sessionSecret = loaded.sessionSecret;
      this.passwordSalt = loaded.passwordSalt;
      this.passwordHashes = loaded.passwordHashes;
      this.config = { ...DEFAULT_SECURITY_CONFIG, ...loaded.config };
      for (const ip of loaded.blockedIps || []) {
        this.blockedIps.set(ip.ip, ip);
      }
      this.events = Array.isArray(loaded.events) ? loaded.events.slice(0, 250) : [];
    } else {
      this.sessionSecret = process.env.SECURITY_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
      this.passwordSalt = crypto.randomBytes(16).toString('hex');
      const envPass = process.env.ADMIN_PASSCODE;
      const defaults = envPass ? [envPass] : ['awais786', 'sitara786'];
      this.passwordHashes = defaults.map((p) => hashPasscodeScrypt(p, this.passwordSalt));
      this.config = {
        ...DEFAULT_SECURITY_CONFIG,
        updatedAt: new Date().toISOString(),
      };
      this.recordEvent({
        ip: '127.0.0.1',
        method: 'BOOT',
        path: '/server/security-wall',
        threatType: 'policy_change',
        severity: 'low',
        action: 'allowed',
        details: 'Sitara Cloth House Security Wall initialized with WAF, rate limiter, and 2FA OTP enforcement.',
      });
      this.persistState();
    }
  }

  private loadStateFromDisk(): PersistedSecurityState | null {
    try {
      if (!fs.existsSync(STATE_FILE)) return null;
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as PersistedSecurityState;
      if (!parsed.sessionSecret || !parsed.passwordSalt || !Array.isArray(parsed.passwordHashes)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private persistState(): void {
    try {
      const payload: PersistedSecurityState = {
        sessionSecret: this.sessionSecret,
        passwordSalt: this.passwordSalt,
        passwordHashes: this.passwordHashes,
        config: this.config,
        blockedIps: Array.from(this.blockedIps.values()),
        events: this.events.slice(0, 120),
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.warn('[SecurityWall] Unable to persist state to disk:', err instanceof Error ? err.message : err);
    }
  }

  public getClientIp(req: Request): string {
    const fwd = req.headers['x-forwarded-for'];
    const raw = Array.isArray(fwd) ? fwd[0] : fwd || req.ip || req.socket.remoteAddress || '127.0.0.1';
    return normalizeClientIp(raw);
  }

  public recordEvent(input: {
    ip: string;
    method: string;
    path: string;
    threatType: ThreatType;
    severity: ThreatSeverity;
    action: SecurityAction;
    details: string;
    userAgent?: string;
  }): SecurityEvent {
    const evt: SecurityEvent = {
      id: `sec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      ip: input.ip,
      method: input.method,
      path: input.path.slice(0, 160),
      threatType: input.threatType,
      severity: input.severity,
      action: input.action,
      details: input.details.slice(0, 400),
      userAgent: input.userAgent?.slice(0, 140),
    };
    this.events.unshift(evt);
    if (this.events.length > 250) {
      this.events.length = 250;
    }
    if (input.action === 'blocked' || input.action === 'locked') {
      this.metrics.totalBlocked++;
    }
    return evt;
  }

  private issueSignedToken(session: ActiveSecuritySession): string {
    const payloadObj = {
      sid: session.sessionId,
      email: session.actorEmail,
      exp: new Date(session.expiresAt).getTime(),
    };
    const payloadB64 = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
    const sig = crypto
      .createHmac('sha256', this.sessionSecret)
      .update(payloadB64)
      .digest('base64url');
    return `${payloadB64}.${sig}`;
  }

  public verifyBearerToken(authHeader?: string): ActiveSecuritySession | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, sig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', this.sessionSecret)
      .update(payloadB64)
      .digest('base64url');
    if (!safeEqualText(sig, expectedSig)) return null;

    try {
      const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
        sid: string;
        email: string;
        exp: number;
      };
      if (!parsed.sid || Date.now() > parsed.exp) return null;
      const session = this.sessions.get(parsed.sid);
      if (!session || session.revoked) return null;
      session.lastActiveAt = new Date().toISOString();
      return session;
    } catch {
      return null;
    }
  }

  private createAdminSession(params: {
    ip: string;
    userAgent: string;
    authMethod: ActiveSecuritySession['authMethod'];
    twoFactorVerified: boolean;
    actorEmail?: string;
    actorName?: string;
  }): { session: ActiveSecuritySession; token: string } {
    const now = Date.now();
    const session: ActiveSecuritySession = {
      sessionId: `sess-${crypto.randomBytes(8).toString('hex')}`,
      actorEmail: params.actorEmail || ADMIN_EMAIL,
      actorName: params.actorName || ADMIN_NAME,
      authMethod: params.authMethod,
      ip: params.ip,
      userAgent: (params.userAgent || 'Browser Client').slice(0, 140),
      twoFactorVerified: params.twoFactorVerified,
      createdAt: new Date(now).toISOString(),
      lastActiveAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 12 * 60 * 60 * 1000).toISOString(),
      revoked: false,
    };
    this.sessions.set(session.sessionId, session);
    const token = this.issueSignedToken(session);
    return { session, token };
  }

  public getOverview() {
    return {
      config: this.config,
      metrics: {
        ...this.metrics,
        blockedIpCount: this.blockedIps.size,
        activeSessionCount: Array.from(this.sessions.values()).filter((s) => !s.revoked).length,
      },
      blockedIps: Array.from(this.blockedIps.values()),
      sessions: Array.from(this.sessions.values()).slice(0, 30),
      events: this.events.slice(0, 100),
      serverTime: new Date().toISOString(),
    };
  }

  public securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    res.setHeader('X-XSS-Protection', '0');

    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    if (isHttps) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    if (req.path.startsWith('/api/')) {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    } else {
      // Allow AI Studio preview iframe & trusted Google/Firebase/Unsplash origins while constraining scripts/objects
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.googleapis.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https://images.unsplash.com https://*.googleusercontent.com https://maps.gstatic.com https://*.googleapis.com",
          "connect-src 'self' ws: wss: https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
          "frame-src 'self' https://maps.google.com https://www.google.com https://*.firebaseapp.com https://accounts.google.com",
          "object-src 'none'",
          "base-uri 'self'",
        ].join('; ')
      );
    }

    next();
  };

  public wafAndDdosMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = this.getClientIp(req);
    const ua = req.headers['user-agent'] || '';

    // 1. Always enforce explicit IP blocklist
    if (this.blockedIps.has(ip)) {
      const entry = this.blockedIps.get(ip)!;
      entry.threatCount += 1;
      this.recordEvent({
        ip,
        method: req.method,
        path: req.originalUrl,
        threatType: 'blocked_ip',
        severity: 'high',
        action: 'blocked',
        details: `Rejected request from blocked IP (${entry.reason})`,
        userAgent: ua,
      });
      return res.status(403).json({
        blocked: true,
        threatType: 'blocked_ip',
        message: 'Access denied by Sitara Security Wall: IP address is blocked.',
      });
    }

    // Only apply active rate-limiting, emergency-mode write lock, and WAF payload inspection to /api/* routes
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    this.metrics.totalInspected++;

    // 2. DDoS Sliding-Window Rate Limiter
    if (this.config.ddosProtectionEnabled) {
      const now = Date.now();
      const windowStart = now - 60_000;
      const isAuthEndpoint = req.path.startsWith('/api/security/auth/');
      const baseLimit = isAuthEndpoint ? this.config.authRateLimitPerMin : this.config.rateLimitRpm;
      const effectiveLimit = this.config.emergencyMode
        ? Math.max(8, Math.floor(baseLimit * 0.5))
        : baseLimit;

      const bucketKey = `${ip}:${isAuthEndpoint ? 'auth' : 'api'}`;
      const timestamps = (this.rateBuckets.get(bucketKey) || []).filter((t) => t > windowStart);
      timestamps.push(now);
      this.rateBuckets.set(bucketKey, timestamps);

      if (timestamps.length > effectiveLimit) {
        this.metrics.rateLimitedCount++;
        const evt = this.recordEvent({
          ip,
          method: req.method,
          path: req.originalUrl,
          threatType: 'ddos_rate_limit',
          severity: 'high',
          action: 'blocked',
          details: `Rate limit exceeded (${timestamps.length}/${effectiveLimit} req/min)`,
          userAgent: ua,
        });
        this.persistState();
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
          blocked: true,
          threatType: 'ddos_rate_limit',
          eventId: evt.id,
          message: 'Too many requests detected. Rate limiter active.',
        });
      }
    }

    // 3. Emergency Protection Mode (blocks unauthenticated mutating API calls except login/OTP/scan)
    const isEmergencyExempt =
      req.path.startsWith('/api/security/auth/') ||
      req.path === '/api/health' ||
      req.path === '/api/security/public-posture';
    if (
      this.config.emergencyMode &&
      req.method !== 'GET' &&
      !isEmergencyExempt &&
      !this.verifyBearerToken(req.headers.authorization)
    ) {
      const evt = this.recordEvent({
        ip,
        method: req.method,
        path: req.originalUrl,
        threatType: 'unauthorized_admin',
        severity: 'high',
        action: 'blocked',
        details: 'Request blocked because Emergency Protection Mode is active.',
        userAgent: ua,
      });
      return res.status(503).json({
        blocked: true,
        threatType: 'emergency_mode',
        eventId: evt.id,
        message: 'Emergency Protection Mode is currently active. Only verified admin sessions are permitted.',
      });
    }

    // 4. Deep WAF Payload Inspection (SQLi, XSS, Path Traversal, Prototype Pollution)
    if (this.config.firewallEnabled) {
      const urlResult = inspectStringForThreats(decodeURIComponentSafe(req.originalUrl), 'url');
      if (!urlResult.safe) {
        return this.handleWafBlock(req, res, ip, ua, urlResult);
      }

      const queryResult = inspectValueForThreats(req.query, 'query');
      if (!queryResult.safe) {
        return this.handleWafBlock(req, res, ip, ua, queryResult);
      }

      // Skip raw base64 blob inside /api/security/scan-upload so the dedicated malware scanner handles it
      if (req.body && req.path !== '/api/security/scan-upload') {
        const bodyResult = inspectValueForThreats(req.body, 'body');
        if (!bodyResult.safe) {
          return this.handleWafBlock(req, res, ip, ua, bodyResult);
        }
      }
    }

    next();
  };

  private handleWafBlock(
    req: Request,
    res: Response,
    ip: string,
    ua: string,
    result: { threatType: ThreatType | null; severity: ThreatSeverity; matchedRule: string | null; fieldPath: string | null }
  ) {
    const threatType = result.threatType || 'xss';
    const evt = this.recordEvent({
      ip,
      method: req.method,
      path: req.originalUrl,
      threatType,
      severity: result.severity,
      action: 'blocked',
      details: `WAF blocked ${result.matchedRule || threatType} at ${result.fieldPath || 'request'}`,
      userAgent: ua,
    });

    const hits = (this.ipThreatCounts.get(ip) || 0) + 1;
    this.ipThreatCounts.set(ip, hits);

    if (
      hits >= this.config.autoBlockAfterThreats &&
      !isLoopbackOrPrivateIp(ip) &&
      !this.blockedIps.has(ip)
    ) {
      this.blockedIps.set(ip, {
        ip,
        reason: `Auto-blocked after ${hits} WAF violations (${threatType})`,
        blockedBy: 'AI Firewall Auto-Defense',
        blockedAt: new Date().toISOString(),
        threatCount: hits,
        autoBlocked: true,
      });
    }

    this.persistState();
    return res.status(403).json({
      blocked: true,
      threatType,
      matchedRule: result.matchedRule,
      eventId: evt.id,
      message: `Blocked by Sitara AI Firewall: ${result.matchedRule || threatType}`,
    });
  }

  public requireAdminSession = (req: Request, res: Response, next: NextFunction) => {
    const session = this.verifyBearerToken(req.headers.authorization);
    if (!session) {
      const ip = this.getClientIp(req);
      this.recordEvent({
        ip,
        method: req.method,
        path: req.originalUrl,
        threatType: 'unauthorized_admin',
        severity: 'high',
        action: 'blocked',
        details: 'Unauthorized call to protected admin security endpoint rejected (HTTP 401).',
        userAgent: req.headers['user-agent'] || '',
      });
      return res.status(401).json({
        error: 'UNAUTHORIZED_SECURITY_SESSION',
        message: 'Valid 2FA-verified Admin session token is required.',
      });
    }
    (req as Request & { adminSession?: ActiveSecuritySession }).adminSession = session;
    next();
  };

  public createRouter(deps: {
    runAiSecurityAnalysis: (snapshot: ReturnType<SecurityWallEngine['getOverview']>, lang: string) => Promise<unknown>;
  }): Router {
    const router = Router();

    // Public non-sensitive security posture
    router.get('/public-posture', (_req, res) => {
      res.json({
        firewallEnabled: this.config.firewallEnabled,
        emergencyMode: this.config.emergencyMode,
        require2faEmailOtp: this.config.require2faEmailOtp,
        ddosProtectionEnabled: this.config.ddosProtectionEnabled,
        blockedIpCount: this.blockedIps.size,
        updatedAt: this.config.updatedAt,
      });
    });

    // Real file upload malware & magic-byte scanner
    router.post('/scan-upload', (req, res) => {
      const { fileName = '', mimeType = '', sizeBytes = 0, base64Content = '' } = req.body || {};
      const ip = this.getClientIp(req);
      const ua = req.headers['user-agent'] || '';

      this.metrics.uploadsScanned++;
      const result = scanFileUploadPayload({
        fileName: String(fileName),
        mimeType: String(mimeType),
        sizeBytes: Number(sizeBytes) || 0,
        base64Content: typeof base64Content === 'string' ? base64Content : '',
        maxUploadSizeMb: this.config.maxUploadSizeMb,
      });

      if (!result.safe) {
        this.metrics.uploadsBlocked++;
        this.recordEvent({
          ip,
          method: req.method,
          path: req.originalUrl,
          threatType: 'malware_upload',
          severity: result.severity,
          action: 'blocked',
          details: `Upload "${result.fileName}" rejected: ${result.threats.join('; ')}`,
          userAgent: ua,
        });
        this.persistState();
        return res.status(422).json({
          ...result,
          blocked: true,
        });
      }

      return res.json({
        ...result,
        blocked: false,
      });
    });

    // Step 1 Admin Login (Passcode + Brute-Force Lockout + Suspicious Login Detection + 2FA Email OTP Challenge)
    router.post('/auth/login', async (req, res) => {
      const ip = this.getClientIp(req);
      const ua = req.headers['user-agent'] || 'Unknown Device';
      const { passcode = '' } = req.body || {};
      const now = Date.now();
      const attemptKey = `ip:${ip}`;
      const record = this.loginAttempts.get(attemptKey) || {
        failedCount: 0,
        lockUntil: null,
        lastAttemptAt: 0,
      };

      const bf = evaluateBruteForceState(
        record.failedCount,
        this.config.bruteForceMaxAttempts,
        record.lockUntil,
        now
      );

      if (bf.isLocked) {
        this.recordEvent({
          ip,
          method: 'POST',
          path: req.originalUrl,
          threatType: 'brute_force',
          severity: 'critical',
          action: 'locked',
          details: `Login rejected: brute-force lockout active for ${bf.remainingSeconds}s`,
          userAgent: ua,
        });
        return res.status(429).json({
          locked: true,
          remainingSeconds: bf.remainingSeconds,
          message: `Account temporarily locked due to repeated failed attempts. Retry in ${bf.remainingSeconds}s.`,
        });
      }

      // Reset stale failure counter if last attempt was > 30 minutes ago
      if (record.lastAttemptAt && now - record.lastAttemptAt > 30 * 60 * 1000) {
        record.failedCount = 0;
        record.lockUntil = null;
      }

      const candidateHash = hashPasscodeScrypt(String(passcode).trim(), this.passwordSalt);
      const isMatch = this.passwordHashes.some((stored) => safeEqualHex(candidateHash, stored));

      if (!isMatch) {
        this.metrics.failedLogins++;
        record.failedCount += 1;
        record.lastAttemptAt = now;

        if (record.failedCount >= this.config.bruteForceMaxAttempts) {
          record.lockUntil = now + this.config.bruteForceLockMinutes * 60 * 1000;
        }
        this.loginAttempts.set(attemptKey, record);

        const nextBf = evaluateBruteForceState(
          record.failedCount,
          this.config.bruteForceMaxAttempts,
          record.lockUntil,
          now
        );

        this.recordEvent({
          ip,
          method: 'POST',
          path: req.originalUrl,
          threatType: nextBf.isLocked ? 'brute_force' : 'suspicious_login',
          severity: nextBf.isLocked ? 'critical' : 'high',
          action: nextBf.isLocked ? 'locked' : 'flagged',
          details: nextBf.isLocked
            ? `Brute-force threshold reached (${record.failedCount}/${this.config.bruteForceMaxAttempts}). IP locked for ${this.config.bruteForceLockMinutes}m.`
            : `Invalid admin passcode attempt (${record.failedCount}/${this.config.bruteForceMaxAttempts}).`,
          userAgent: ua,
        });
        this.persistState();

        return res.status(nextBf.isLocked ? 429 : 401).json({
          authenticated: false,
          locked: nextBf.isLocked,
          remainingSeconds: nextBf.remainingSeconds,
          attemptsRemaining: nextBf.attemptsRemaining,
          message: nextBf.isLocked
            ? `Brute-force protection triggered. Locked for ${this.config.bruteForceLockMinutes} minutes.`
            : `Invalid admin passcode. ${nextBf.attemptsRemaining} attempt(s) remaining before lockout.`,
        });
      }

      // Password verified — check suspicious indicators before resetting failure count
      const hadPriorFailures = record.failedCount > 0;
      const isNewIp = !this.knownLoginIps.has(ip);
      this.knownLoginIps.add(ip);
      this.loginAttempts.delete(attemptKey);

      if (this.config.suspiciousLoginAlerts && (hadPriorFailures || isNewIp)) {
        this.recordEvent({
          ip,
          method: 'POST',
          path: req.originalUrl,
          threatType: 'suspicious_login',
          severity: 'medium',
          action: 'flagged',
          details: isNewIp
            ? `Suspicious login alert: new admin IP ${ip} verified password`
            : `Suspicious login alert: admin password succeeded after failed attempts`,
          userAgent: ua,
        });
      }

      // If 2FA is disabled by admin, issue direct session
      if (!this.config.require2faEmailOtp) {
        const { session, token } = this.createAdminSession({
          ip,
          userAgent: ua,
          authMethod: 'passcode',
          twoFactorVerified: false,
        });
        this.persistState();
        return res.json({
          authenticated: true,
          requires2fa: false,
          sessionToken: token,
          session,
        });
      }

      // Generate real 6-digit Email OTP challenge
      const challenge = await this.createAndDispatchOtp({
        email: ADMIN_EMAIL,
        ip,
        userAgent: ua,
      });

      this.persistState();
      return res.json({
        authenticated: false,
        requires2fa: true,
        challengeId: challenge.challengeId,
        maskedEmail: maskEmailAddress(ADMIN_EMAIL),
        expiresInSeconds: 300,
        deliveryMode: challenge.deliveryMode,
        // Returned transparently only when external SMTP/Resend relay is not configured in the container
        ...(challenge.sandboxOtpPreview ? { sandboxOtpPreview: challenge.sandboxOtpPreview } : {}),
      });
    });

    // Step 2 Admin 2FA Email OTP Verification
    router.post('/auth/verify-otp', (req, res) => {
      const ip = this.getClientIp(req);
      const ua = req.headers['user-agent'] || 'Unknown Device';
      const { challengeId = '', otp = '' } = req.body || {};

      const challenge = this.otpChallenges.get(String(challengeId));
      if (!challenge) {
        return res.status(400).json({
          verified: false,
          message: 'OTP challenge not found or already used. Please request a new code.',
        });
      }

      if (Date.now() > challenge.expiresAt) {
        this.otpChallenges.delete(challenge.challengeId);
        return res.status(410).json({
          verified: false,
          expired: true,
          message: 'Email OTP expired. Please resend a fresh verification code.',
        });
      }

      const cleanOtp = String(otp).trim();
      const candidateHash = hashOtpSha256(cleanOtp, challenge.challengeId);
      if (!safeEqualHex(candidateHash, challenge.otpHash)) {
        challenge.attempts += 1;
        this.recordEvent({
          ip,
          method: 'POST',
          path: req.originalUrl,
          threatType: 'otp_failure',
          severity: 'high',
          action: 'flagged',
          details: `Invalid 2FA Email OTP entered (${challenge.attempts}/3 attempts).`,
          userAgent: ua,
        });
        if (challenge.attempts >= 3) {
          this.otpChallenges.delete(challenge.challengeId);
          return res.status(403).json({
            verified: false,
            exhausted: true,
            message: 'Maximum OTP attempts exceeded. Sign in again to generate a new OTP.',
          });
        }
        return res.status(401).json({
          verified: false,
          attemptsRemaining: 3 - challenge.attempts,
          message: `Incorrect verification code. ${3 - challenge.attempts} attempt(s) remaining.`,
        });
      }

      this.otpChallenges.delete(challenge.challengeId);
      const { session, token } = this.createAdminSession({
        ip,
        userAgent: ua,
        authMethod: 'passcode+otp',
        twoFactorVerified: true,
      });

      this.recordEvent({
        ip,
        method: 'POST',
        path: req.originalUrl,
        threatType: 'policy_change',
        severity: 'low',
        action: 'allowed',
        details: `Admin 2FA Email OTP verified for ${maskEmailAddress(challenge.email)} (${session.sessionId}).`,
        userAgent: ua,
      });
      this.persistState();

      return res.json({
        verified: true,
        authenticated: true,
        sessionToken: token,
        session,
      });
    });

    router.post('/auth/resend-otp', async (req, res) => {
      const ip = this.getClientIp(req);
      const ua = req.headers['user-agent'] || 'Unknown Device';
      const { challengeId = '' } = req.body || {};
      const existing = this.otpChallenges.get(String(challengeId));
      if (!existing) {
        return res.status(400).json({
          message: 'No active login challenge found. Enter your passcode first.',
        });
      }
      this.otpChallenges.delete(existing.challengeId);
      const challenge = await this.createAndDispatchOtp({
        email: existing.email,
        ip,
        userAgent: ua,
      });
      return res.json({
        challengeId: challenge.challengeId,
        maskedEmail: maskEmailAddress(existing.email),
        expiresInSeconds: 300,
        deliveryMode: challenge.deliveryMode,
        ...(challenge.sandboxOtpPreview ? { sandboxOtpPreview: challenge.sandboxOtpPreview } : {}),
      });
    });

    // Google Firebase ID Token -> Verified Server Session Bridge
    router.post('/auth/firebase-session', async (req, res) => {
      const ip = this.getClientIp(req);
      const ua = req.headers['user-agent'] || 'Google Auth Browser';
      const { idToken = '' } = req.body || {};

      if (!idToken || typeof idToken !== 'string') {
        return res.status(400).json({ message: 'Missing Firebase ID token.' });
      }

      const apiKey = loadFirebaseWebApiKey();
      if (!apiKey) {
        return res.status(503).json({ message: 'Firebase config unavailable on server.' });
      }

      try {
        const lookupRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          }
        );

        if (!lookupRes.ok) {
          return res.status(401).json({ message: 'Firebase token verification failed.' });
        }

        const lookupData = (await lookupRes.json()) as {
          users?: { email?: string; emailVerified?: boolean; displayName?: string }[];
        };
        const userInfo = lookupData.users?.[0];
        if (!userInfo || !userInfo.emailVerified || userInfo.email?.toLowerCase() !== ADMIN_EMAIL) {
          this.recordEvent({
            ip,
            method: 'POST',
            path: req.originalUrl,
            threatType: 'unauthorized_admin',
            severity: 'critical',
            action: 'blocked',
            details: `Non-admin or unverified Google account attempted admin session bridge (${userInfo?.email || 'unknown'})`,
            userAgent: ua,
          });
          return res.status(403).json({ message: 'Account is not an authorized verified Sitara Cloth House admin.' });
        }

        const { session, token } = this.createAdminSession({
          ip,
          userAgent: ua,
          authMethod: 'google',
          twoFactorVerified: true,
          actorEmail: userInfo.email,
          actorName: userInfo.displayName || ADMIN_NAME,
        });

        this.recordEvent({
          ip,
          method: 'POST',
          path: req.originalUrl,
          threatType: 'policy_change',
          severity: 'low',
          action: 'allowed',
          details: `Verified Google Admin session established for ${maskEmailAddress(userInfo.email)}.`,
          userAgent: ua,
        });
        this.persistState();

        return res.json({
          authenticated: true,
          sessionToken: token,
          session,
        });
      } catch (err) {
        return res.status(502).json({
          message: err instanceof Error ? err.message : 'Unable to verify Google session with Identity Toolkit.',
        });
      }
    });

    // --- ADMIN-PROTECTED ROUTES BELOW THIS LINE ---

    router.get('/admin/overview', this.requireAdminSession, (_req, res) => {
      res.json(this.getOverview());
    });

    router.put('/admin/config', this.requireAdminSession, (req, res) => {
      const ip = this.getClientIp(req);
      const ua = req.headers['user-agent'] || '';
      const updates = (req.body || {}) as Partial<SecurityWallConfig>;

      const nextConfig: SecurityWallConfig = {
        ...this.config,
        ...(typeof updates.firewallEnabled === 'boolean' ? { firewallEnabled: updates.firewallEnabled } : {}),
        ...(typeof updates.emergencyMode === 'boolean' ? { emergencyMode: updates.emergencyMode } : {}),
        ...(typeof updates.require2faEmailOtp === 'boolean' ? { require2faEmailOtp: updates.require2faEmailOtp } : {}),
        ...(typeof updates.ddosProtectionEnabled === 'boolean'
          ? { ddosProtectionEnabled: updates.ddosProtectionEnabled }
          : {}),
        ...(typeof updates.suspiciousLoginAlerts === 'boolean'
          ? { suspiciousLoginAlerts: updates.suspiciousLoginAlerts }
          : {}),
        ...(typeof updates.rateLimitRpm === 'number'
          ? { rateLimitRpm: Math.min(1000, Math.max(10, Math.round(updates.rateLimitRpm))) }
          : {}),
        ...(typeof updates.authRateLimitPerMin === 'number'
          ? { authRateLimitPerMin: Math.min(60, Math.max(3, Math.round(updates.authRateLimitPerMin))) }
          : {}),
        ...(typeof updates.bruteForceMaxAttempts === 'number'
          ? { bruteForceMaxAttempts: Math.min(20, Math.max(3, Math.round(updates.bruteForceMaxAttempts))) }
          : {}),
        ...(typeof updates.bruteForceLockMinutes === 'number'
          ? { bruteForceLockMinutes: Math.min(120, Math.max(1, Math.round(updates.bruteForceLockMinutes))) }
          : {}),
        ...(typeof updates.maxUploadSizeMb === 'number'
          ? { maxUploadSizeMb: Math.min(25, Math.max(1, Math.round(updates.maxUploadSizeMb))) }
          : {}),
        ...(typeof updates.autoBlockAfterThreats === 'number'
          ? { autoBlockAfterThreats: Math.min(50, Math.max(2, Math.round(updates.autoBlockAfterThreats))) }
          : {}),
        updatedAt: new Date().toISOString(),
      };

      this.config = nextConfig;
      this.recordEvent({
        ip,
        method: 'PUT',
        path: req.originalUrl,
        threatType: 'policy_change',
        severity: nextConfig.emergencyMode ? 'high' : 'low',
        action: 'allowed',
        details: `Admin updated security policy (Firewall: ${nextConfig.firewallEnabled ? 'ON' : 'OFF'}, Emergency: ${nextConfig.emergencyMode ? 'ACTIVE' : 'OFF'}, 2FA: ${nextConfig.require2faEmailOtp ? 'ON' : 'OFF'})`,
        userAgent: ua,
      });
      this.persistState();

      res.json({ config: this.config, overview: this.getOverview() });
    });

    router.post('/admin/block-ip', this.requireAdminSession, (req, res) => {
      const adminIp = this.getClientIp(req);
      const { ip = '', reason = 'Manual block by Admin' } = req.body || {};
      const cleanIp = normalizeClientIp(String(ip));

      if (!validateIpAddress(cleanIp)) {
        return res.status(400).json({ message: 'Please enter a valid IPv4 or IPv6 address.' });
      }
      if (cleanIp === adminIp || isLoopbackOrPrivateIp(cleanIp)) {
        return res.status(400).json({
          message: 'Cannot block loopback/local gateway IP to prevent locking out showroom access.',
        });
      }

      const entry: BlockedIpEntry = {
        ip: cleanIp,
        reason: String(reason).trim().slice(0, 200) || 'Manual block by Admin',
        blockedBy: ADMIN_NAME,
        blockedAt: new Date().toISOString(),
        threatCount: this.ipThreatCounts.get(cleanIp) || 0,
        autoBlocked: false,
      };
      this.blockedIps.set(cleanIp, entry);
      this.recordEvent({
        ip: adminIp,
        method: 'POST',
        path: req.originalUrl,
        threatType: 'policy_change',
        severity: 'medium',
        action: 'allowed',
        details: `Admin blocked IP ${cleanIp}: ${entry.reason}`,
      });
      this.persistState();

      return res.json({ entry, overview: this.getOverview() });
    });

    router.delete('/admin/block-ip/:ip', this.requireAdminSession, (req, res) => {
      const adminIp = this.getClientIp(req);
      const targetIp = normalizeClientIp(decodeURIComponent(req.params.ip || ''));
      const existed = this.blockedIps.delete(targetIp);
      if (existed) {
        this.ipThreatCounts.delete(targetIp);
        this.recordEvent({
          ip: adminIp,
          method: 'DELETE',
          path: req.originalUrl,
          threatType: 'policy_change',
          severity: 'low',
          action: 'allowed',
          details: `Admin unblocked IP ${targetIp}`,
        });
        this.persistState();
      }
      return res.json({ unblocked: existed, overview: this.getOverview() });
    });

    router.delete('/admin/sessions/:sessionId', this.requireAdminSession, (req, res) => {
      const adminIp = this.getClientIp(req);
      const sessionId = req.params.sessionId;
      const target = this.sessions.get(sessionId);
      if (!target) {
        return res.status(404).json({ message: 'Session not found.' });
      }
      target.revoked = true;
      this.recordEvent({
        ip: adminIp,
        method: 'DELETE',
        path: req.originalUrl,
        threatType: 'policy_change',
        severity: 'medium',
        action: 'allowed',
        details: `Admin revoked session ${sessionId} (${target.ip})`,
      });
      return res.json({ revoked: true, overview: this.getOverview() });
    });

    router.post('/admin/change-passcode', this.requireAdminSession, (req, res) => {
      const adminIp = this.getClientIp(req);
      const { newPasscode = '' } = req.body || {};
      const strength = validateStrongPassword(String(newPasscode));
      if (!strength.valid) {
        return res.status(400).json({
          message: `Password too weak: ${strength.issues.join(', ')}`,
          strength,
        });
      }
      this.passwordSalt = crypto.randomBytes(16).toString('hex');
      this.passwordHashes = [hashPasscodeScrypt(String(newPasscode), this.passwordSalt)];
      this.recordEvent({
        ip: adminIp,
        method: 'POST',
        path: req.originalUrl,
        threatType: 'policy_change',
        severity: 'medium',
        action: 'allowed',
        details: 'Admin rotated primary passcode using scrypt cryptographic hashing.',
      });
      this.persistState();
      return res.json({ updated: true, strength });
    });

    router.post('/admin/logout', this.requireAdminSession, (req, res) => {
      const current = (req as Request & { adminSession?: ActiveSecuritySession }).adminSession;
      if (current) {
        current.revoked = true;
      }
      return res.json({ loggedOut: true });
    });

    // Safe diagnostic endpoint to verify WAF response against sample attack vectors
    router.post('/admin/ai-analyze', this.requireAdminSession, async (req, res) => {
      try {
        const { lang = 'en' } = req.body || {};
        const analysis = await deps.runAiSecurityAnalysis(this.getOverview(), String(lang));
        return res.json(analysis);
      } catch (err) {
        return res.status(500).json({
          error: 'AI_SECURITY_ANALYSIS_FAILED',
          message: err instanceof Error ? err.message : 'Unable to run AI security analysis.',
        });
      }
    });

    return router;
  }

  private async createAndDispatchOtp(params: {
    email: string;
    ip: string;
    userAgent: string;
  }): Promise<{
    challengeId: string;
    deliveryMode: 'email-relay' | 'local-secure-preview';
    sandboxOtpPreview?: string;
  }> {
    const challengeId = `otp-${crypto.randomBytes(8).toString('hex')}`;
    const otpCode = String(crypto.randomInt(100000, 1000000));
    const otpHash = hashOtpSha256(otpCode, challengeId);

    this.otpChallenges.set(challengeId, {
      challengeId,
      otpHash,
      email: params.email,
      ip: params.ip,
      userAgent: params.userAgent,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    // Real optional email relay via Resend if configured in environment secrets
    const resendKey = process.env.RESEND_API_KEY;
    let deliveryMode: 'email-relay' | 'local-secure-preview' = 'local-secure-preview';
    if (resendKey) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.SECURITY_FROM_EMAIL || 'security@sitarakotli.com',
            to: [params.email],
            subject: 'Sitara Cloth House Admin 2FA Verification Code',
            text: `Your Sitara Cloth House 2FA security code is: ${otpCode}. It expires in 5 minutes. Request IP: ${params.ip}.`,
          }),
        });
        if (emailRes.ok) {
          deliveryMode = 'email-relay';
        }
      } catch (err) {
        console.warn('[SecurityWall] Email relay failed, using local secure OTP preview:', err);
      }
    }

    return {
      challengeId,
      deliveryMode,
      ...(deliveryMode === 'local-secure-preview' ? { sandboxOtpPreview: otpCode } : {}),
    };
  }
}

function decodeURIComponentSafe(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}
