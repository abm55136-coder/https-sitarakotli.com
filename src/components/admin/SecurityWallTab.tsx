import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Ban,
  Activity,
  Lock,
  Unlock,
  KeyRound,
  FileSearch,
  Sparkles,
  Download,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Laptop,
  Search,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import {
  AiSecurityAnalysisResult,
  SecurityWallConfig,
  ThreatType,
  UploadScanResult,
} from '../../types';
import {
  buildSecurityAuditReportText,
  validateIpAddress,
  validateStrongPassword,
} from '../../utils/securityCore';
import {
  blockIpAddress,
  fetchSecurityOverview,
  getStoredSecurityToken,
  probeWafEndpoint,
  revokeSecuritySession,
  rotateAdminPasscode,
  runAiSecurityAnalysisRequest,
  scanFileWithSecurityWall,
  scanUploadPayloadOnServer,
  SecurityOverviewResponse,
  unblockIpAddress,
  updateSecurityConfig,
} from '../../services/securityApi';
import {
  deleteBlockedIpFromCloud,
  syncBlockedIpToCloud,
  syncSecurityConfigToCloud,
  syncSecurityLogToCloud,
  syncSecuritySessionToCloud,
} from '../../services/cloudSync';

interface SecurityWallTabProps {
  onSessionInvalidated?: () => void;
}

export const SecurityWallTab: React.FC<SecurityWallTabProps> = ({ onSessionInvalidated }) => {
  const { lang, t, cloudSync, logActivity } = useShop();
  const isUrdu = lang === 'ur';

  const [overview, setOverview] = useState<SecurityOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Policy draft numbers
  const [policyDraft, setPolicyDraft] = useState<{
    rateLimitRpm: number;
    authRateLimitPerMin: number;
    bruteForceMaxAttempts: number;
    bruteForceLockMinutes: number;
    maxUploadSizeMb: number;
    autoBlockAfterThreats: number;
  }>({
    rateLimitRpm: 90,
    authRateLimitPerMin: 12,
    bruteForceMaxAttempts: 5,
    bruteForceLockMinutes: 5,
    maxUploadSizeMb: 5,
    autoBlockAfterThreats: 5,
  });

  // IP blocklist form
  const [newBlockIp, setNewBlockIp] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');

  // Log filters
  const [threatFilter, setThreatFilter] = useState<'all' | ThreatType>('all');
  const [logSearch, setLogSearch] = useState('');

  // Passcode rotation
  const [newPasscode, setNewPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);

  // Upload malware scanner
  const scanFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadScanResult, setUploadScanResult] = useState<(UploadScanResult & { blocked: boolean }) | null>(null);

  // Probe & AI Security Manager states
  const [probeSummary, setProbeSummary] = useState<{
    label: string;
    status: number;
    blocked: boolean;
    message: string;
  } | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiSecurityAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    const token = getStoredSecurityToken();
    if (!token) {
      setLoading(false);
      setErrorMsg(
        isUrdu
          ? 'سرور سیکیورٹی سیشن فعال نہیں ہے۔ براہ کرم لاک اسکرین سے دوبارہ 2FA تصدیق کریں۔'
          : 'No active 2FA-verified server security token found. Lock and sign in again to inspect live server controls.'
      );
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchSecurityOverview(token);
      setOverview(data);
      setPolicyDraft({
        rateLimitRpm: data.config.rateLimitRpm,
        authRateLimitPerMin: data.config.authRateLimitPerMin,
        bruteForceMaxAttempts: data.config.bruteForceMaxAttempts,
        bruteForceLockMinutes: data.config.bruteForceLockMinutes,
        maxUploadSizeMb: data.config.maxUploadSizeMb,
        autoBlockAfterThreats: data.config.autoBlockAfterThreats,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load Security Wall overview.';
      setErrorMsg(msg);
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('expired')) {
        onSessionInvalidated?.();
      }
    } finally {
      setLoading(false);
    }
  }, [isUrdu, onSessionInvalidated]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const showNotice = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => {
      setStatusMsg((curr) => (curr === msg ? null : curr));
    }, 5000);
  };

  const syncPolicyToFirestoreIfAdmin = async (cfg: SecurityWallConfig, details: string) => {
    if (!cloudSync.isCloudAdmin) return;
    await syncSecurityConfigToCloud(cfg).catch(() => {});
    await syncSecurityLogToCloud({
      id: `sec-cfg-${Date.now()}`,
      ip: 'admin-console',
      method: 'PUT',
      path: '/api/security/admin/config',
      threatType: 'policy_change',
      severity: cfg.emergencyMode ? 'high' : 'low',
      action: 'allowed',
      details,
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  };

  const handleToggleConfig = async (
    key: 'firewallEnabled' | 'emergencyMode' | 'require2faEmailOtp' | 'ddosProtectionEnabled' | 'suspiciousLoginAlerts',
    nextValue: boolean
  ) => {
    setBusyAction(`toggle-${key}`);
    setErrorMsg(null);
    try {
      const res = await updateSecurityConfig({ [key]: nextValue });
      setOverview(res.overview);
      const summary = `${key} set to ${nextValue ? 'ENABLED' : 'DISABLED'}`;
      showNotice(summary);
      logActivity('SECURITY_POLICY_UPDATED', 'Security Wall', summary, 'security');
      await syncPolicyToFirestoreIfAdmin(res.config, summary);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update security setting.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction('save-policy');
    setErrorMsg(null);
    try {
      const res = await updateSecurityConfig(policyDraft);
      setOverview(res.overview);
      showNotice(isUrdu ? 'سیکیورٹی پالیسی محفوظ کر دی گئی۔' : 'Security thresholds saved and enforced on server.');
      logActivity('SECURITY_THRESHOLDS_SAVED', 'Security Wall', `RPM=${policyDraft.rateLimitRpm}, MaxLoginFails=${policyDraft.bruteForceMaxAttempts}`, 'security');
      await syncPolicyToFirestoreIfAdmin(res.config, 'Updated rate-limit and brute-force thresholds');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save security thresholds.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBlockIp.trim();
    if (!validateIpAddress(clean)) {
      setErrorMsg(isUrdu ? 'درست IPv4 یا IPv6 ایڈریس درج کریں۔' : 'Enter a valid IPv4 (e.g. 203.0.113.45) or IPv6 address.');
      return;
    }
    setBusyAction('block-ip');
    setErrorMsg(null);
    try {
      const reason = newBlockReason.trim() || 'Blocked via Admin Security Wall';
      const res = await blockIpAddress(clean, reason);
      setOverview(res.overview);
      setNewBlockIp('');
      setNewBlockReason('');
      showNotice(`IP ${res.entry.ip} blocked across all website & API routes.`);
      logActivity('IP_BLOCKED', 'Security Wall', `Blocked IP ${res.entry.ip}: ${reason}`, 'security');
      if (cloudSync.isCloudAdmin) {
        await syncBlockedIpToCloud(res.entry).catch(() => {});
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to block IP.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    setBusyAction(`unblock-${ip}`);
    setErrorMsg(null);
    try {
      const res = await unblockIpAddress(ip);
      setOverview(res.overview);
      showNotice(`IP ${ip} unblocked.`);
      logActivity('IP_UNBLOCKED', 'Security Wall', `Unblocked IP ${ip}`, 'info');
      if (cloudSync.isCloudAdmin) {
        await deleteBlockedIpFromCloud(ip).catch(() => {});
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to unblock IP.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setBusyAction(`revoke-${sessionId}`);
    setErrorMsg(null);
    try {
      const res = await revokeSecuritySession(sessionId);
      setOverview(res.overview);
      showNotice(`Session ${sessionId} revoked.`);
      logActivity('SESSION_REVOKED', 'Security Wall', `Revoked session ${sessionId}`, 'security');
      const target = res.overview.sessions.find((s) => s.sessionId === sessionId);
      if (cloudSync.isCloudAdmin && target) {
        await syncSecuritySessionToCloud(target).catch(() => {});
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to revoke session.');
    } finally {
      setBusyAction(null);
    }
  };

  const passcodeStrength = useMemo(() => validateStrongPassword(newPasscode), [newPasscode]);

  const handleRotatePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeStrength.valid) {
      setErrorMsg(`Passcode requirements: ${passcodeStrength.issues.join(', ')}`);
      return;
    }
    setBusyAction('rotate-passcode');
    setErrorMsg(null);
    try {
      await rotateAdminPasscode(newPasscode);
      setNewPasscode('');
      showNotice('Admin passcode rotated with scrypt cryptographic hashing.');
      logActivity('PASSCODE_ROTATED', 'Security Wall', 'Primary admin passcode updated using scrypt.', 'security');
      await loadOverview();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to rotate passcode.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRunWafProbe = async (mode: 'sqli' | 'xss' | 'benign' | 'eicar') => {
    setBusyAction(`probe-${mode}`);
    setErrorMsg(null);
    try {
      if (mode === 'eicar') {
        const eicarPayload = btoa('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
        const scan = await scanUploadPayloadOnServer({
          fileName: 'eicar-probe.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 68,
          base64Content: eicarPayload,
        });
        setUploadScanResult(scan);
        setProbeSummary({
          label: 'Malware Upload Probe (EICAR)',
          status: scan.blocked ? 422 : 200,
          blocked: scan.blocked,
          message: scan.blocked
            ? `Rejected (${scan.threats.join('; ')})`
            : 'Allowed (Unexpected)',
        });
      } else {
        const payload =
          mode === 'sqli'
            ? { search: "' OR '1'='1 --" }
            : mode === 'xss'
            ? { comment: "<script>alert('xss')</script>" }
            : { inquiry: 'Pure 8-Pound Boski Suit for Sitara Cloth House Kotli' };
        const res = await probeWafEndpoint(payload);
        setProbeSummary({
          label:
            mode === 'sqli'
              ? 'SQL Injection Probe'
              : mode === 'xss'
              ? 'XSS Script Probe'
              : 'Clean Showroom Request',
          status: res.status,
          blocked: res.blocked,
          message: res.message,
        });
      }
      await loadOverview();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Probe request failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleScanUploadedFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusyAction('scan-file');
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const dataUrl = (ev.target?.result as string) || '';
        const scan = await scanFileWithSecurityWall(file, dataUrl);
        setUploadScanResult(scan);
        await loadOverview();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'File scan failed.');
      } finally {
        setBusyAction(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRunAiAnalysis = async () => {
    setBusyAction('ai-analyze');
    setAiError(null);
    try {
      const res = await runAiSecurityAnalysisRequest(lang === 'ur' ? 'ur' : 'en');
      setAiAnalysis(res);
      logActivity('AI_SECURITY_AUDIT', 'Security Wall', `AI risk level: ${res.riskLevel}`, 'security');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to complete AI threat assessment.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownloadAuditReport = () => {
    if (!overview) return;
    const report = buildSecurityAuditReportText({
      config: overview.config,
      blockedIps: overview.blockedIps,
      events: overview.events,
      sessions: overview.sessions,
      aiAnalysis,
    });
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sitara_security_audit_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice('Security audit report downloaded.');
  };

  const filteredEvents = useMemo(() => {
    if (!overview) return [];
    const q = logSearch.trim().toLowerCase();
    return overview.events.filter((evt) => {
      if (threatFilter !== 'all' && evt.threatType !== threatFilter) return false;
      if (!q) return true;
      return (
        evt.ip.toLowerCase().includes(q) ||
        evt.details.toLowerCase().includes(q) ||
        evt.path.toLowerCase().includes(q) ||
        evt.threatType.toLowerCase().includes(q)
      );
    });
  }, [overview, threatFilter, logSearch]);

  if (loading && !overview) {
    return (
      <div className="p-10 rounded-2xl bg-[#16161a] border border-white/10 flex flex-col items-center justify-center gap-3 text-xs text-gray-400">
        <Loader2 className="w-6 h-6 text-[#d4af37] animate-spin" />
        <span>Loading real-time Security Wall telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header & Realistic Defense-in-Depth Banner */}
      <div className="p-5 rounded-2xl bg-[#16161a] border border-[#d4af37]/30 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#d4af37]" />
              <span>{t.secWallTitle}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">{t.secWallDisclaimer}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadOverview}
              disabled={busyAction !== null}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isUrdu ? 'ریفریش' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadAuditReport}
              disabled={!overview}
              className="px-3.5 py-2 rounded-xl bg-[#d4af37] text-black font-bold text-xs flex items-center gap-1.5 hover:brightness-110 disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'سیکیورٹی رپورٹ ڈاؤن لوڈ' : 'Export Security Report'}</span>
            </button>
          </div>
        </div>

        {/* Metrics KPI Strip (Flat, Tabular-Nums) */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="p-3 rounded-xl bg-black/50 border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 block">AI Firewall</span>
              <span
                className={`text-sm font-bold font-mono ${
                  overview.config.firewallEnabled ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {overview.config.firewallEnabled ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 block">Emergency Mode</span>
              <span
                className={`text-sm font-bold font-mono ${
                  overview.config.emergencyMode ? 'text-rose-400' : 'text-sky-300'
                }`}
              >
                {overview.config.emergencyMode ? 'LOCKDOWN' : 'STANDBY'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 block">API Inspected</span>
              <span className="text-sm font-bold text-white font-mono tabular-nums">
                {overview.metrics.totalInspected}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 block">Threats Blocked</span>
              <span className="text-sm font-bold text-amber-400 font-mono tabular-nums">
                {overview.metrics.totalBlocked}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 block">Blocked IPs</span>
              <span className="text-sm font-bold text-rose-300 font-mono tabular-nums">
                {overview.metrics.blockedIpCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 block">Active Sessions</span>
              <span className="text-sm font-bold text-emerald-300 font-mono tabular-nums">
                {overview.metrics.activeSessionCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {overview && (
        <>
          {/* Section 1: Protection Toggles + Threshold Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Active Defense Switches */}
            <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                <span>{isUrdu ? 'لائیو فائر وال اور لاگ ان کنٹرولز' : 'Active Server Firewall & Auth Controls'}</span>
              </h4>

              <div className="space-y-2 text-xs">
                {[
                  {
                    key: 'firewallEnabled' as const,
                    label: isUrdu ? 'AI ویب فائر وال (SQLi / XSS / Traversal)' : 'AI Web Application Firewall (WAF)',
                    desc: 'Inspects API URLs, query parameters, and JSON payloads on the server.',
                    value: overview.config.firewallEnabled,
                    dangerWhenTrue: false,
                  },
                  {
                    key: 'ddosProtectionEnabled' as const,
                    label: isUrdu ? 'DDoS اور ریٹ لمٹنگ تحفظ' : 'DDoS Sliding-Window Rate Limiter',
                    desc: 'Enforces per-IP per-minute HTTP 429 throttling across API & login routes.',
                    value: overview.config.ddosProtectionEnabled,
                    dangerWhenTrue: false,
                  },
                  {
                    key: 'require2faEmailOtp' as const,
                    label: isUrdu ? 'ایڈمن 2FA ای میل OTP تصدیق' : 'Require 2FA Email OTP on Passcode Login',
                    desc: 'Generates SHA-256 hashed 6-digit single-use codes (5-min expiry).',
                    value: overview.config.require2faEmailOtp,
                    dangerWhenTrue: false,
                  },
                  {
                    key: 'suspiciousLoginAlerts' as const,
                    label: isUrdu ? 'مشکوک لاگ ان الرٹس' : 'Suspicious Login Alerts',
                    desc: 'Flags logins from unrecognized IPs or logins following failed passcode attempts.',
                    value: overview.config.suspiciousLoginAlerts,
                    dangerWhenTrue: false,
                  },
                  {
                    key: 'emergencyMode' as const,
                    label: isUrdu ? 'ایمرجنسی لاک ڈاؤن موڈ' : 'Emergency Protection Mode',
                    desc: 'Blocks unauthenticated non-GET API writes (HTTP 503) & halves rate caps.',
                    value: overview.config.emergencyMode,
                    dangerWhenTrue: true,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      item.dangerWhenTrue && item.value
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : 'bg-black/40 border-white/10'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-white">{item.label}</p>
                      <p className="text-[11px] text-gray-400">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busyAction === `toggle-${item.key}`}
                      onClick={() => handleToggleConfig(item.key, !item.value)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono shrink-0 cursor-pointer transition-colors ${
                        item.value
                          ? item.dangerWhenTrue
                            ? 'bg-rose-500 text-white'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-stone-800 text-gray-300 border border-white/10'
                      }`}
                    >
                      {busyAction === `toggle-${item.key}` ? '...' : item.value ? 'ON' : 'OFF'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Policy Thresholds + Passcode Rotation */}
            <div className="space-y-4">
              <form
                onSubmit={handleSaveThresholds}
                className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>{isUrdu ? 'ریٹ لمٹ اور بروٹ فورس پالیسی' : 'Rate Limit & Brute-Force Thresholds'}</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <label className="space-y-1">
                    <span className="text-[11px] text-gray-400 block">API Limit (req/min)</span>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={policyDraft.rateLimitRpm}
                      onChange={(e) =>
                        setPolicyDraft((p) => ({ ...p, rateLimitRpm: Number(e.target.value) || 10 }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono tabular-nums"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-gray-400 block">Auth Limit (/min)</span>
                    <input
                      type="number"
                      min={3}
                      max={60}
                      value={policyDraft.authRateLimitPerMin}
                      onChange={(e) =>
                        setPolicyDraft((p) => ({ ...p, authRateLimitPerMin: Number(e.target.value) || 3 }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono tabular-nums"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-gray-400 block">Max Login Fails</span>
                    <input
                      type="number"
                      min={3}
                      max={20}
                      value={policyDraft.bruteForceMaxAttempts}
                      onChange={(e) =>
                        setPolicyDraft((p) => ({ ...p, bruteForceMaxAttempts: Number(e.target.value) || 3 }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono tabular-nums"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-gray-400 block">Lock Duration (min)</span>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={policyDraft.bruteForceLockMinutes}
                      onChange={(e) =>
                        setPolicyDraft((p) => ({ ...p, bruteForceLockMinutes: Number(e.target.value) || 1 }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono tabular-nums"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-gray-400 block">Upload Cap (MB)</span>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={policyDraft.maxUploadSizeMb}
                      onChange={(e) =>
                        setPolicyDraft((p) => ({ ...p, maxUploadSizeMb: Number(e.target.value) || 1 }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono tabular-nums"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-gray-400 block">Auto-Block Hits</span>
                    <input
                      type="number"
                      min={2}
                      max={50}
                      value={policyDraft.autoBlockAfterThreats}
                      onChange={(e) =>
                        setPolicyDraft((p) => ({ ...p, autoBlockAfterThreats: Number(e.target.value) || 2 }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono tabular-nums"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={busyAction === 'save-policy'}
                  className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 font-bold text-xs cursor-pointer"
                >
                  {busyAction === 'save-policy' ? 'Saving...' : 'Save Security Policy'}
                </button>
              </form>

              {/* Admin Passcode Rotation */}
              <form
                onSubmit={handleRotatePasscode}
                className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  <span>{isUrdu ? 'ایڈمن پاس ورڈ تبدیل کریں (scrypt)' : 'Rotate Admin Passcode (scrypt Hashed)'}</span>
                </h4>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value)}
                      placeholder="Min 8 chars, letters + digits + symbol..."
                      className="w-full pl-3 pr-9 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode((v) => !v)}
                      aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={busyAction === 'rotate-passcode' || !passcodeStrength.valid}
                    className="px-3.5 py-2 rounded-xl bg-[#d4af37] text-black font-bold text-xs disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    Rotate
                  </button>
                </div>

                {newPasscode && (
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passcodeStrength.score >= 80
                            ? 'bg-emerald-400'
                            : passcodeStrength.score >= 50
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${passcodeStrength.score}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {passcodeStrength.valid
                        ? 'Strong passcode ready for scrypt hashing.'
                        : passcodeStrength.issues.join(' · ')}
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Section 2: Live Threat Monitor & Real WAF Self-Test Probes */}
          <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>{isUrdu ? 'لائیو سیکیورٹی مانیٹر اور WAF ٹیسٹ' : 'Live Threat Monitor & Real WAF Verification'}</span>
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Test live server WAF middleware & inspect chronological threat events.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => handleRunWafProbe('sqli')}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-semibold cursor-pointer"
                >
                  Test SQLi Block
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => handleRunWafProbe('xss')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-semibold cursor-pointer"
                >
                  Test XSS Block
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => handleRunWafProbe('eicar')}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-semibold cursor-pointer"
                >
                  Test EICAR Malware
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => handleRunWafProbe('benign')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold cursor-pointer"
                >
                  Test Clean Request
                </button>
              </div>
            </div>

            {probeSummary && (
              <div
                className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                  probeSummary.blocked
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{probeSummary.label}:</strong> {probeSummary.message}
                  </span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/50 border border-white/10 tabular-nums">
                  HTTP {probeSummary.status}
                </span>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter by IP, path, or threat detail..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
                />
              </div>
              <select
                value={threatFilter}
                onChange={(e) => setThreatFilter(e.target.value as 'all' | ThreatType)}
                className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
              >
                <option value="all">All Event Types ({overview.events.length})</option>
                <option value="sqli">SQL Injection</option>
                <option value="xss">XSS Attack</option>
                <option value="path_traversal">Path Traversal</option>
                <option value="prototype_pollution">Prototype Pollution</option>
                <option value="ddos_rate_limit">DDoS Rate Limit</option>
                <option value="brute_force">Brute Force</option>
                <option value="malware_upload">Malware Upload</option>
                <option value="blocked_ip">Blocked IP</option>
                <option value="suspicious_login">Suspicious Login</option>
                <option value="unauthorized_admin">Unauthorized Admin</option>
                <option value="policy_change">Policy Changes</option>
              </select>
            </div>

            {/* Events Table */}
            <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-black/40 divide-y divide-white/5">
              {filteredEvents.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">
                  No security events match your filter. Run a WAF probe or wait for live traffic.
                </p>
              ) : (
                filteredEvents.map((evt) => (
                  <div key={evt.id} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            evt.action === 'blocked' || evt.action === 'locked'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : evt.action === 'flagged'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {evt.action}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 font-mono text-[10px]">
                          {evt.threatType}
                        </span>
                        <span className="font-mono text-[#d4af37] text-[11px] tabular-nums">{evt.ip}</span>
                        <span className="text-gray-500 font-mono text-[10px] truncate">
                          {evt.method} {evt.path}
                        </span>
                      </div>
                      <p className="text-gray-300 text-[11px]">{evt.details}</p>
                    </div>
                    <div className="shrink-0 text-right font-mono text-[10px] text-gray-500 tabular-nums">
                      <div>{evt.timestamp.slice(0, 19).replace('T', ' ')}</div>
                      <div className="uppercase text-gray-400">sev: {evt.severity}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: IP Blocklist & Active Admin Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* IP Blocklist Manager */}
            <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Ban className="w-4 h-4" />
                <span>{isUrdu ? 'بلاک شدہ IP ایڈریسز کا انتظام' : 'Blocked IP Address Manager'}</span>
              </h4>

              <form onSubmit={handleBlockIp} className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                <input
                  type="text"
                  value={newBlockIp}
                  onChange={(e) => setNewBlockIp(e.target.value)}
                  placeholder="IP e.g. 203.0.113.45"
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
                />
                <input
                  type="text"
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
                />
                <button
                  type="submit"
                  disabled={busyAction === 'block-ip'}
                  className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold cursor-pointer"
                >
                  Block IP
                </button>
              </form>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {overview.blockedIps.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">
                    No IPs currently blocked. Repeat WAF attackers above threshold are added automatically.
                  </p>
                ) : (
                  overview.blockedIps.map((b) => (
                    <div
                      key={b.ip}
                      className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-300 tabular-nums">{b.ip}</span>
                          {b.autoBlocked && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              Auto
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">{b.reason}</p>
                      </div>
                      <button
                        type="button"
                        disabled={busyAction === `unblock-${b.ip}`}
                        onClick={() => handleUnblockIp(b.ip)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/15 hover:border-emerald-500/40 text-gray-200 hover:text-emerald-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Unblock</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Admin Sessions Manager */}
            <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Laptop className="w-4 h-4" />
                <span>{isUrdu ? 'فعال ایڈمن لاگ ان سیشنز' : 'Active Login Sessions'}</span>
              </h4>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {overview.sessions.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">No active sessions recorded.</p>
                ) : (
                  overview.sessions.map((s) => (
                    <div
                      key={s.sessionId}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                        s.revoked ? 'bg-black/30 border-white/5 opacity-60' : 'bg-black/50 border-white/10'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-white">{s.actorEmail}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px] text-amber-300">
                            {s.authMethod}
                          </span>
                          {s.twoFactorVerified && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                              2FA Verified
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono truncate tabular-nums">
                          {s.ip} · Active: {s.lastActiveAt.slice(11, 19)}
                        </p>
                      </div>

                      {!s.revoked ? (
                        <button
                          type="button"
                          disabled={busyAction === `revoke-${s.sessionId}`}
                          onClick={() => handleRevokeSession(s.sessionId)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono uppercase text-gray-500">Revoked</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Malware Upload Scanner & AI Security Manager */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* File Upload Security Scanner */}
            <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <FileSearch className="w-4 h-4" />
                    <span>{isUrdu ? 'فائل اپ لوڈ میلویئر اسکینر' : 'File Upload Malware & Magic-Byte Scanner'}</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Verifies image headers (PNG/JPEG), blocks PE/ELF binaries, double extensions, SVG scripts & EICAR.
                  </p>
                </div>

                <input
                  ref={scanFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleScanUploadedFile}
                />
                <button
                  type="button"
                  disabled={busyAction === 'scan-file'}
                  onClick={() => scanFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold text-xs cursor-pointer shrink-0"
                >
                  {busyAction === 'scan-file' ? 'Scanning...' : 'Scan File'}
                </button>
              </div>

              {uploadScanResult ? (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    uploadScanResult.safe
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {uploadScanResult.safe ? 'CLEAN & VERIFIED' : 'THREAT REJECTED'} — {uploadScanResult.fileName}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums">{uploadScanResult.sizeBytes} B</span>
                  </div>
                  <p className="text-[11px] opacity-90">Detected: {uploadScanResult.detectedType}</p>
                  {uploadScanResult.threats.length > 0 && (
                    <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                      {uploadScanResult.threats.map((th, i) => (
                        <li key={i}>{th}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-500 text-center">
                  Select any file to run server-side binary & signature inspection.
                </div>
              )}
            </div>

            {/* AI Security Manager */}
            <div className="p-4 rounded-2xl bg-[#16161a] border border-[#d4af37]/30 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>{isUrdu ? 'AI سیکیورٹی مینیجر اور تجزیہ' : 'AI Security Manager'}</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Analyzes live telemetry via server-side Gemini to recommend hardening actions.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busyAction === 'ai-analyze'}
                  onClick={handleRunAiAnalysis}
                  className="px-3.5 py-2 rounded-xl bg-[#d4af37] text-black font-bold text-xs flex items-center gap-1.5 hover:brightness-110 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {busyAction === 'ai-analyze' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{isUrdu ? 'AI سیکیورٹی تجزیہ چلائیں' : 'Run AI Threat Analysis'}</span>
                </button>
              </div>

              {aiError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                  {aiError}
                </div>
              )}

              {aiAnalysis ? (
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                        aiAnalysis.riskLevel === 'critical' || aiAnalysis.riskLevel === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : aiAnalysis.riskLevel === 'elevated'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      Risk: {aiAnalysis.riskLevel}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{aiAnalysis.model}</span>
                  </div>

                  <p className="text-gray-200 leading-relaxed">{aiAnalysis.executiveSummary}</p>

                  {aiAnalysis.recommendations.length > 0 && (
                    <div className="space-y-1.5">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-white">{rec.title}</span>
                            <span className="text-[10px] font-mono uppercase text-[#d4af37]">{rec.priority}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{rec.action}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {aiAnalysis.shouldEnableEmergencyMode && !overview.config.emergencyMode && (
                    <button
                      type="button"
                      onClick={() => handleToggleConfig('emergencyMode', true)}
                      className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>AI Recommends: Enable Emergency Protection Mode Now</span>
                    </button>
                  )}

                  <p className="text-[10px] text-gray-500 pt-1 border-t border-white/5">
                    {aiAnalysis.disclaimer}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-500 text-center">
                  Click "Run AI Threat Analysis" to evaluate telemetry and generate prioritized hardening advice.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
