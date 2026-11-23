export type ThreatType =
  | 'sqli'
  | 'xss'
  | 'path_traversal'
  | 'prototype_pollution'
  | 'ddos_rate_limit'
  | 'brute_force'
  | 'malware_upload'
  | 'blocked_ip'
  | 'suspicious_login'
  | 'otp_failure'
  | 'unauthorized_admin'
  | 'policy_change';

export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SecurityAction = 'blocked' | 'flagged' | 'locked' | 'allowed';

export interface SecurityWallConfig {
  firewallEnabled: boolean;
  emergencyMode: boolean;
  require2faEmailOtp: boolean;
  ddosProtectionEnabled: boolean;
  rateLimitRpm: number;
  authRateLimitPerMin: number;
  bruteForceMaxAttempts: number;
  bruteForceLockMinutes: number;
  maxUploadSizeMb: number;
  autoBlockAfterThreats: number;
  suspiciousLoginAlerts: boolean;
  updatedAt: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  ip: string;
  method: string;
  path: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  action: SecurityAction;
  details: string;
  userAgent?: string;
}

export interface BlockedIpEntry {
  ip: string;
  reason: string;
  blockedBy: string;
  blockedAt: string;
  threatCount: number;
  autoBlocked: boolean;
}

export interface ActiveSecuritySession {
  sessionId: string;
  actorEmail: string;
  actorName: string;
  authMethod: 'passcode+otp' | 'passcode' | 'google+otp' | 'google';
  ip: string;
  userAgent: string;
  twoFactorVerified: boolean;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  revoked: boolean;
}

export interface ThreatInspectionResult {
  safe: boolean;
  threatType: ThreatType | null;
  severity: ThreatSeverity;
  matchedRule: string | null;
  fieldPath: string | null;
}

export interface UploadScanResult {
  safe: boolean;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  detectedType: string;
  threats: string[];
  severity: ThreatSeverity;
}

export interface AiSecurityAnalysisResult {
  riskLevel: 'low' | 'elevated' | 'high' | 'critical';
  executiveSummary: string;
  detectedPatterns: string[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    action: string;
  }[];
  shouldEnableEmergencyMode: boolean;
  model: string;
  generatedAt: string;
  disclaimer: string;
}

export const DEFAULT_SECURITY_CONFIG: SecurityWallConfig = {
  firewallEnabled: true,
  emergencyMode: false,
  require2faEmailOtp: true,
  ddosProtectionEnabled: true,
  rateLimitRpm: 90,
  authRateLimitPerMin: 12,
  bruteForceMaxAttempts: 5,
  bruteForceLockMinutes: 5,
  maxUploadSizeMb: 5,
  autoBlockAfterThreats: 5,
  suspiciousLoginAlerts: true,
  updatedAt: new Date(0).toISOString(),
};

const SQLI_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'SQL Boolean Tautology', regex: /(['"`]\s*(?:or|and)\s+['"`]?\w+['"`]?\s*=\s*['"`]?\w+)/i },
  { name: 'SQL Numeric Tautology', regex: /\b(?:or|and)\s+\d+\s*=\s*\d+\b/i },
  { name: 'SQL UNION SELECT', regex: /\bunion\s+(?:all\s+)?select\b/i },
  { name: 'SQL Destructive DDL/DML', regex: /;\s*(?:drop|delete|truncate|alter|exec|execute|insert|update)\s+(?:table|database|from|into)\b/i },
  { name: 'SQL Time-Based Blind', regex: /\b(?:sleep|benchmark|waitfor\s+delay)\s*\(/i },
  { name: 'SQL System Stored Proc', regex: /\bxp_cmdshell\b|\binformation_schema\b/i },
  { name: 'SQL Comment Terminated Injection', regex: /['"]\s*(?:--|#|\/\*)/ },
];

const XSS_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'HTML Script Tag', regex: /<\s*script\b[^>]*>/i },
  { name: 'HTML Closing Script Tag', regex: /<\s*\/\s*script\s*>/i },
  { name: 'Inline DOM Event Handler', regex: /\bon(?:error|load|click|mouseover|focus|submit|toggle|animationstart)\s*=/i },
  { name: 'JavaScript URI Scheme', regex: /javascript\s*:/i },
  { name: 'VBScript / Data HTML URI', regex: /(?:vbscript:|data:text\/html)/i },
  { name: 'Injected Iframe / Object / Embed', regex: /<\s*(?:iframe|object|embed|applet|meta)\b[^>]*>/i },
  { name: 'DOM Cookie / Eval Sink', regex: /\b(?:document\.cookie|window\.location\s*=|eval\s*\()/i },
];

const PATH_TRAVERSAL_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'Dot-Dot Path Traversal', regex: /(?:\.\.[\/\\]){2,}|(?:^|[\/\\])\.\.[\/\\](?:etc|proc|var|usr|windows|boot)/i },
  { name: 'Encoded Path Traversal', regex: /(?:%2e%2e%2f|%2e%2e\/|\.\.%2f|%2e%2e%5c)/i },
  { name: 'Sensitive System File Probe', regex: /\/etc\/(?:passwd|shadow|hosts)|\\windows\\system32/i },
];

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'dll', 'bat', 'cmd', 'sh', 'bash', 'ps1', 'vbs', 'js', 'mjs', 'cjs',
  'php', 'phtml', 'asp', 'aspx', 'jsp', 'py', 'rb', 'pl', 'cgi', 'jar', 'msi',
  'scr', 'com', 'html', 'htm',
]);

const ALLOWED_UPLOAD_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'json']);
const ALLOWED_UPLOAD_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/json',
]);

export function detectSqlInjection(input: string): string | null {
  if (!input || input.length < 3) return null;
  for (const rule of SQLI_PATTERNS) {
    if (rule.regex.test(input)) {
      return rule.name;
    }
  }
  return null;
}

export function detectXssPayload(input: string): string | null {
  if (!input || input.length < 4) return null;
  for (const rule of XSS_PATTERNS) {
    if (rule.regex.test(input)) {
      return rule.name;
    }
  }
  return null;
}

export function detectPathTraversal(input: string): string | null {
  if (!input || input.length < 3) return null;
  for (const rule of PATH_TRAVERSAL_PATTERNS) {
    if (rule.regex.test(input)) {
      return rule.name;
    }
  }
  return null;
}

export function detectPrototypePollutionKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

export function inspectStringForThreats(
  input: string,
  fieldPath = 'input'
): ThreatInspectionResult {
  // Skip large base64 data URLs from SQL/URL regexes unless raw SVG HTML scripts exist;
  // binary uploads are scanned explicitly by scanFileUploadPayload.
  if (input.startsWith('data:image/') && input.includes(';base64,')) {
    return { safe: true, threatType: null, severity: 'low', matchedRule: null, fieldPath: null };
  }

  const xss = detectXssPayload(input);
  if (xss) {
    return {
      safe: false,
      threatType: 'xss',
      severity: 'high',
      matchedRule: xss,
      fieldPath,
    };
  }

  const sqli = detectSqlInjection(input);
  if (sqli) {
    return {
      safe: false,
      threatType: 'sqli',
      severity: 'critical',
      matchedRule: sqli,
      fieldPath,
    };
  }

  const traversal = detectPathTraversal(input);
  if (traversal) {
    return {
      safe: false,
      threatType: 'path_traversal',
      severity: 'high',
      matchedRule: traversal,
      fieldPath,
    };
  }

  return { safe: true, threatType: null, severity: 'low', matchedRule: null, fieldPath: null };
}

export function inspectValueForThreats(
  value: unknown,
  fieldPath = 'body',
  depth = 0
): ThreatInspectionResult {
  if (depth > 8 || value === null || value === undefined) {
    return { safe: true, threatType: null, severity: 'low', matchedRule: null, fieldPath: null };
  }

  if (typeof value === 'string') {
    return inspectStringForThreats(value, fieldPath);
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < Math.min(value.length, 100); i++) {
      const res = inspectValueForThreats(value[i], `${fieldPath}[${i}]`, depth + 1);
      if (!res.safe) return res;
    }
    return { safe: true, threatType: null, severity: 'low', matchedRule: null, fieldPath: null };
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      if (detectPrototypePollutionKey(key)) {
        return {
          safe: false,
          threatType: 'prototype_pollution',
          severity: 'critical',
          matchedRule: `Blocked prototype key "${key}"`,
          fieldPath: `${fieldPath}.${key}`,
        };
      }
      const res = inspectValueForThreats(obj[key], `${fieldPath}.${key}`, depth + 1);
      if (!res.safe) return res;
    }
  }

  return { safe: true, threatType: null, severity: 'low', matchedRule: null, fieldPath: null };
}

export function normalizeClientIp(raw: string): string {
  const first = (raw || '').split(',')[0].trim();
  if (!first) return 'unknown';
  if (first.startsWith('::ffff:')) {
    return first.slice(7);
  }
  return first;
}

export function validateIpAddress(ip: string): boolean {
  const clean = ip.trim();
  if (!clean) return false;
  // IPv4 check
  const ipv4Parts = clean.split('.');
  if (ipv4Parts.length === 4) {
    return ipv4Parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
  }
  // Simplified IPv6 check
  if (clean.includes(':')) {
    return /^[0-9a-fA-F:]{2,45}$/.test(clean) && !clean.includes(':::');
  }
  return false;
}

export function isLoopbackOrPrivateIp(ip: string): boolean {
  const clean = normalizeClientIp(ip);
  return (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === 'localhost' ||
    clean.startsWith('10.') ||
    clean.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(clean)
  );
}

export function maskEmailAddress(email: string): string {
  const clean = (email || '').trim();
  const at = clean.indexOf('@');
  if (at <= 1) return '***';
  const local = clean.slice(0, at);
  const domain = clean.slice(at + 1);
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`;
}

export function validateStrongPassword(password: string): {
  valid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 25;
  else issues.push('Must be at least 8 characters long');

  if (/[A-Za-z]/.test(password)) score += 20;
  else issues.push('Include at least one letter');

  if (/\d/.test(password)) score += 20;
  else issues.push('Include at least one number');

  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  else issues.push('Include at least one symbol (e.g. @, #, $, !)');

  if (password.length >= 12) score += 15;

  const weakDefaults = new Set(['admin', '123456', 'password', 'qwerty', '12345678', 'letmein']);
  if (weakDefaults.has(password.toLowerCase())) {
    score = 5;
    issues.push('Common weak passcodes are prohibited');
  }

  return {
    valid: issues.length === 0 && password.length >= 8,
    score: Math.min(100, score),
    issues,
  };
}

export function evaluateBruteForceState(
  failedAttempts: number,
  maxAttempts: number,
  lockUntilMs: number | null,
  nowMs: number
): { isLocked: boolean; remainingSeconds: number; attemptsRemaining: number } {
  if (lockUntilMs && lockUntilMs > nowMs) {
    return {
      isLocked: true,
      remainingSeconds: Math.ceil((lockUntilMs - nowMs) / 1000),
      attemptsRemaining: 0,
    };
  }
  const remaining = Math.max(0, maxAttempts - failedAttempts);
  return {
    isLocked: false,
    remainingSeconds: 0,
    attemptsRemaining: remaining,
  };
}

function decodeBase64ToBytes(base64Input: string, maxInspectBytes = 4096): Uint8Array {
  const stripped = base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
  const clean = stripped.replace(/\s+/g, '').slice(0, Math.ceil((maxInspectBytes * 4) / 3) + 4);
  if (!clean) return new Uint8Array(0);
  if (typeof atob === 'function') {
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }
  return Uint8Array.from(Buffer.from(clean, 'base64'));
}

function bytesToAscii(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    out += c >= 32 && c <= 126 ? String.fromCharCode(c) : ' ';
  }
  return out;
}

const EICAR_SIGNATURE = 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE';

export function scanFileUploadPayload(params: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64Content?: string;
  maxUploadSizeMb?: number;
}): UploadScanResult {
  const { fileName, mimeType, sizeBytes, base64Content = '', maxUploadSizeMb = 5 } = params;
  const threats: string[] = [];
  let detectedType = mimeType || 'unknown';
  let severity: ThreatSeverity = 'low';

  const cleanName = (fileName || '').trim();
  const maxBytes = maxUploadSizeMb * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    threats.push(`File size (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds ${maxUploadSizeMb} MB limit`);
    severity = 'medium';
  }

  const nameSegments = cleanName.toLowerCase().split('.').filter(Boolean);
  const finalExt = nameSegments.length > 1 ? nameSegments[nameSegments.length - 1] : '';
  const intermediateExts = nameSegments.slice(1, -1);

  for (const ext of intermediateExts) {
    if (DANGEROUS_EXTENSIONS.has(ext)) {
      threats.push(`Suspicious double file extension detected (.${ext}.${finalExt})`);
      severity = 'critical';
    }
  }

  if (!finalExt || DANGEROUS_EXTENSIONS.has(finalExt) || !ALLOWED_UPLOAD_EXTENSIONS.has(finalExt)) {
    threats.push(`Disallowed or executable file extension: .${finalExt || 'none'}`);
    severity = 'critical';
  }

  const normalizedMime = (mimeType || '').toLowerCase();
  if (normalizedMime && !ALLOWED_UPLOAD_MIMES.has(normalizedMime)) {
    threats.push(`Unapproved MIME type: ${mimeType}`);
    if (severity !== 'critical') severity = 'high';
  }

  if (base64Content) {
    const bytes = decodeBase64ToBytes(base64Content, 16384);
    const ascii = bytesToAscii(bytes);

    // EICAR standard antivirus test string or embedded script check
    if (ascii.includes(EICAR_SIGNATURE)) {
      threats.push('Malware test signature detected (EICAR-STANDARD-ANTIVIRUS-TEST-FILE)');
      severity = 'critical';
    }

    // Windows PE executable (MZ) or Linux ELF (\x7FELF) or Unix script shebang (#!)
    if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) {
      detectedType = 'application/x-msdownload (PE/MZ Executable)';
      threats.push('Disguised Windows executable binary (MZ magic header)');
      severity = 'critical';
    } else if (
      bytes.length >= 4 &&
      bytes[0] === 0x7f &&
      bytes[1] === 0x45 &&
      bytes[2] === 0x4c &&
      bytes[3] === 0x46
    ) {
      detectedType = 'application/x-elf (Linux Binary)';
      threats.push('Disguised ELF executable binary');
      severity = 'critical';
    } else if (ascii.startsWith('#!') || ascii.includes('<?php')) {
      threats.push('Embedded server script / PHP code detected inside file');
      severity = 'critical';
    }

    // Magic-byte verification for common raster formats
    if (finalExt === 'png' && bytes.length >= 4) {
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
      if (isPng) {
        detectedType = 'image/png (verified magic header)';
      } else if (threats.length === 0) {
        threats.push('File extension is .png but magic bytes do not match PNG format');
        severity = 'high';
      }
    } else if ((finalExt === 'jpg' || finalExt === 'jpeg') && bytes.length >= 3) {
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      if (isJpeg) {
        detectedType = 'image/jpeg (verified magic header)';
      } else if (threats.length === 0) {
        threats.push('File extension is .jpg/.jpeg but magic bytes do not match JPEG format');
        severity = 'high';
      }
    }

    // SVG / XML active XSS script check
    if (finalExt === 'svg' || normalizedMime === 'image/svg+xml' || ascii.toLowerCase().includes('<svg')) {
      const xssHit = detectXssPayload(ascii);
      if (xssHit) {
        threats.push(`SVG contains active script/XSS vector (${xssHit})`);
        severity = 'critical';
      }
    }
  }

  return {
    safe: threats.length === 0,
    fileName: cleanName,
    mimeType: normalizedMime || 'application/octet-stream',
    sizeBytes,
    detectedType,
    threats,
    severity: threats.length === 0 ? 'low' : severity,
  };
}

export function buildSecurityAuditReportText(params: {
  config: SecurityWallConfig;
  blockedIps: BlockedIpEntry[];
  events: SecurityEvent[];
  sessions: ActiveSecuritySession[];
  aiAnalysis?: AiSecurityAnalysisResult | null;
}): string {
  const { config, blockedIps, events, sessions, aiAnalysis } = params;
  const blockedCount = events.filter((e) => e.action === 'blocked' || e.action === 'locked').length;
  const activeSessions = sessions.filter((s) => !s.revoked).length;

  const lines = [
    '====================================================================',
    'SITARA CLOTH HOUSE (sitarakotli.com) — SECURITY WALL AUDIT REPORT',
    `Generated: ${new Date().toISOString()}`,
    'Showroom: Khudadad Market, Main Bazaar, Kotli, Azad Kashmir',
    'Notice: Multi-layer WAF, rate limiting, 2FA, and Firestore RBAC rules',
    'mitigate common web attacks; no security system guarantees 100% immunity.',
    '====================================================================',
    '',
    '1. ACTIVE SECURITY POLICY',
    `- AI WAF Firewall: ${config.firewallEnabled ? 'ENABLED' : 'DISABLED'}`,
    `- Emergency Lockdown Mode: ${config.emergencyMode ? 'ACTIVE' : 'STANDBY'}`,
    `- Admin 2FA Email OTP: ${config.require2faEmailOtp ? 'REQUIRED' : 'DISABLED'}`,
    `- DDoS Sliding-Window Rate Limit: ${config.rateLimitRpm} req/min (Auth: ${config.authRateLimitPerMin}/min)`,
    `- Brute-Force Lockout: ${config.bruteForceMaxAttempts} failed attempts -> ${config.bruteForceLockMinutes}m lock`,
    `- Auto-Block Threshold: ${config.autoBlockAfterThreats} high/critical threat hits`,
    '',
    '2. TELEMETRY SUMMARY',
    `- Recorded Security Events: ${events.length}`,
    `- Blocked / Locked Requests: ${blockedCount}`,
    `- Blocked IP Addresses: ${blockedIps.length}`,
    `- Active Admin Sessions: ${activeSessions}`,
    '',
    '3. BLOCKED IP ADDRESSES',
    ...(blockedIps.length === 0
      ? ['- None currently blocked.']
      : blockedIps.map(
          (b) => `- ${b.ip} | Reason: ${b.reason} | Threats: ${b.threatCount} | At: ${b.blockedAt}`
        )),
    '',
    '4. RECENT SECURITY EVENTS (LATEST 25)',
    ...(events.length === 0
      ? ['- No threat events logged yet.']
      : events
          .slice(0, 25)
          .map(
            (e) =>
              `- [${e.timestamp}] [${e.severity.toUpperCase()}] [${e.action.toUpperCase()}] ${e.threatType} from ${e.ip} (${e.method} ${e.path}) — ${e.details}`
          )),
  ];

  if (aiAnalysis) {
    lines.push(
      '',
      '5. AI SECURITY MANAGER ASSESSMENT',
      `- Risk Level: ${aiAnalysis.riskLevel.toUpperCase()}`,
      `- Model: ${aiAnalysis.model}`,
      `- Summary: ${aiAnalysis.executiveSummary}`,
      '- Recommendations:',
      ...aiAnalysis.recommendations.map(
        (r, i) => `  ${i + 1}. [${r.priority.toUpperCase()}] ${r.title}: ${r.action}`
      )
    );
  }

  return lines.join('\n');
}
