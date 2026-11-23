import type {
  ActiveSecuritySession,
  AiSecurityAnalysisResult,
  BlockedIpEntry,
  SecurityEvent,
  SecurityWallConfig,
  UploadScanResult,
} from '../utils/securityCore';

const TOKEN_STORAGE_KEY = 'sitara_sec_token';

export interface SecurityOverviewResponse {
  config: SecurityWallConfig;
  metrics: {
    totalInspected: number;
    totalBlocked: number;
    rateLimitedCount: number;
    uploadsScanned: number;
    uploadsBlocked: number;
    failedLogins: number;
    blockedIpCount: number;
    activeSessionCount: number;
  };
  blockedIps: BlockedIpEntry[];
  sessions: ActiveSecuritySession[];
  events: SecurityEvent[];
  serverTime: string;
}

export interface PublicSecurityPosture {
  firewallEnabled: boolean;
  emergencyMode: boolean;
  require2faEmailOtp: boolean;
  ddosProtectionEnabled: boolean;
  blockedIpCount: number;
  updatedAt: string;
}

export interface LoginStepResponse {
  authenticated?: boolean;
  requires2fa?: boolean;
  challengeId?: string;
  maskedEmail?: string;
  expiresInSeconds?: number;
  deliveryMode?: 'email-relay' | 'local-secure-preview';
  sandboxOtpPreview?: string;
  sessionToken?: string;
  session?: ActiveSecuritySession;
  locked?: boolean;
  remainingSeconds?: number;
  attemptsRemaining?: number;
  message?: string;
}

export interface VerifyOtpResponse {
  verified?: boolean;
  authenticated?: boolean;
  expired?: boolean;
  exhausted?: boolean;
  attemptsRemaining?: number;
  sessionToken?: string;
  session?: ActiveSecuritySession;
  message?: string;
}

export function getStoredSecurityToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredSecurityToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage restriction in private browsing
  }
}

async function parseJsonSafe<T>(res: Response): Promise<T & { message?: string; error?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T & { message?: string; error?: string };
  } catch {
    return { message: text || `HTTP ${res.status}` } as T & { message?: string; error?: string };
  }
}

function authHeaders(tokenOverride?: string): Record<string, string> {
  const token = tokenOverride ?? getStoredSecurityToken();
  return token
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    : { 'Content-Type': 'application/json' };
}

export async function fetchPublicSecurityPosture(): Promise<PublicSecurityPosture> {
  const res = await fetch('/api/security/public-posture');
  const data = await parseJsonSafe<PublicSecurityPosture>(res);
  if (!res.ok) {
    throw new Error(data.message || 'Unable to load security posture');
  }
  return data;
}

export async function securityLogin(passcode: string): Promise<LoginStepResponse> {
  const res = await fetch('/api/security/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  const data = await parseJsonSafe<LoginStepResponse>(res);
  if (data.sessionToken) {
    setStoredSecurityToken(data.sessionToken);
  }
  return { ...data, ...(res.ok ? {} : { authenticated: false }) };
}

export async function verifySecurityOtp(challengeId: string, otp: string): Promise<VerifyOtpResponse> {
  const res = await fetch('/api/security/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, otp }),
  });
  const data = await parseJsonSafe<VerifyOtpResponse>(res);
  if (res.ok && data.sessionToken) {
    setStoredSecurityToken(data.sessionToken);
  }
  return data;
}

export async function resendSecurityOtp(challengeId: string): Promise<LoginStepResponse> {
  const res = await fetch('/api/security/auth/resend-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId }),
  });
  const data = await parseJsonSafe<LoginStepResponse>(res);
  if (!res.ok) {
    throw new Error(data.message || 'Failed to resend OTP');
  }
  return data;
}

export async function exchangeFirebaseTokenForSecuritySession(
  idToken: string
): Promise<{ authenticated: boolean; sessionToken?: string; session?: ActiveSecuritySession; message?: string }> {
  const res = await fetch('/api/security/auth/firebase-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await parseJsonSafe<{
    authenticated: boolean;
    sessionToken?: string;
    session?: ActiveSecuritySession;
  }>(res);
  if (res.ok && data.sessionToken) {
    setStoredSecurityToken(data.sessionToken);
  }
  return data;
}

export async function fetchSecurityOverview(tokenOverride?: string): Promise<SecurityOverviewResponse> {
  const res = await fetch('/api/security/admin/overview', {
    headers: authHeaders(tokenOverride),
  });
  const data = await parseJsonSafe<SecurityOverviewResponse>(res);
  if (res.status === 401) {
    setStoredSecurityToken(null);
    throw new Error(data.message || 'Security session expired or unauthorized.');
  }
  if (!res.ok) {
    throw new Error(data.message || 'Unable to load security overview');
  }
  return data;
}

export async function updateSecurityConfig(
  updates: Partial<SecurityWallConfig>
): Promise<{ config: SecurityWallConfig; overview: SecurityOverviewResponse }> {
  const res = await fetch('/api/security/admin/config', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await parseJsonSafe<{ config: SecurityWallConfig; overview: SecurityOverviewResponse }>(res);
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update security policy');
  }
  return data;
}

export async function blockIpAddress(
  ip: string,
  reason: string
): Promise<{ entry: BlockedIpEntry; overview: SecurityOverviewResponse }> {
  const res = await fetch('/api/security/admin/block-ip', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ip, reason }),
  });
  const data = await parseJsonSafe<{ entry: BlockedIpEntry; overview: SecurityOverviewResponse }>(res);
  if (!res.ok) {
    throw new Error(data.message || 'Failed to block IP address');
  }
  return data;
}

export async function unblockIpAddress(ip: string): Promise<{ unblocked: boolean; overview: SecurityOverviewResponse }> {
  const res = await fetch(`/api/security/admin/block-ip/${encodeURIComponent(ip)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await parseJsonSafe<{ unblocked: boolean; overview: SecurityOverviewResponse }>(res);
  if (!res.ok) {
    throw new Error(data.message || 'Failed to unblock IP address');
  }
  return data;
}

export async function revokeSecuritySession(
  sessionId: string
): Promise<{ revoked: boolean; overview: SecurityOverviewResponse }> {
  const res = await fetch(`/api/security/admin/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await parseJsonSafe<{ revoked: boolean; overview: SecurityOverviewResponse }>(res);
  if (!res.ok) {
    throw new Error(data.message || 'Failed to revoke session');
  }
  return data;
}

export async function rotateAdminPasscode(
  newPasscode: string
): Promise<{ updated: boolean; strength: { valid: boolean; score: number; issues: string[] } }> {
  const res = await fetch('/api/security/admin/change-passcode', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ newPasscode }),
  });
  const data = await parseJsonSafe<{
    updated: boolean;
    strength: { valid: boolean; score: number; issues: string[] };
  }>(res);
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update admin passcode');
  }
  return data;
}

export async function logoutSecuritySession(): Promise<void> {
  const token = getStoredSecurityToken();
  if (token) {
    await fetch('/api/security/admin/logout', {
      method: 'POST',
      headers: authHeaders(token),
    }).catch(() => {});
  }
  setStoredSecurityToken(null);
}

export async function runAiSecurityAnalysisRequest(lang: 'en' | 'ur'): Promise<AiSecurityAnalysisResult> {
  const res = await fetch('/api/ai/security-analysis', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ lang }),
  });
  const data = await parseJsonSafe<AiSecurityAnalysisResult>(res);
  if (!res.ok) {
    throw new Error(data.message || 'AI Security Manager could not complete analysis.');
  }
  return data;
}

export async function scanUploadPayloadOnServer(payload: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64Content: string;
}): Promise<UploadScanResult & { blocked: boolean }> {
  const res = await fetch('/api/security/scan-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe<UploadScanResult & { blocked: boolean }>(res);
  return {
    ...data,
    blocked: res.status === 422 || Boolean(data.blocked) || !data.safe,
  };
}

export async function scanFileWithSecurityWall(
  file: File,
  dataUrlOrBase64: string
): Promise<UploadScanResult & { blocked: boolean }> {
  return scanUploadPayloadOnServer({
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    base64Content: dataUrlOrBase64,
  });
}

export async function probeWafEndpoint(payload: Record<string, unknown>): Promise<{
  status: number;
  blocked: boolean;
  threatType?: string;
  matchedRule?: string;
  message: string;
}> {
  const res = await fetch('/api/security/waf-echo', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe<{
    passed?: boolean;
    blocked?: boolean;
    threatType?: string;
    matchedRule?: string;
    message?: string;
  }>(res);
  return {
    status: res.status,
    blocked: res.status === 403 || res.status === 429 || Boolean(data.blocked),
    threatType: data.threatType,
    matchedRule: data.matchedRule,
    message: data.message || `HTTP ${res.status}`,
  };
}
