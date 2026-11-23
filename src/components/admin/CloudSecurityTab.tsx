import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { BOOTSTRAPPED_ADMIN_EMAIL, firebaseConfig } from '../../firebase';
import { PWAInstallButton } from '../PWAInstallButton';
import {
  Cloud,
  Database,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  History,
  CheckCircle2,
  Wifi,
  WifiOff,
  Smartphone,
  Laptop,
  LogIn,
  LogOut,
  Loader2,
} from 'lucide-react';

export const CloudSecurityTab: React.FC = () => {
  const {
    lang,
    firebaseUser,
    cloudSync,
    signInWithGoogle,
    signOutCloud,
    syncCatalogToCloudNow,
    cloudBackups,
    createCloudBackupSnapshot,
    restoreFromCloudBackup,
    activityLogs,
    products,
    invoices,
    khataAccounts,
  } = useShop();

  const isUrdu = lang === 'ur';
  const [backupTitle, setBackupTitle] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFullSync = async () => {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await syncCatalogToCloudNow();
      setStatusMsg(
        isUrdu
          ? 'تمام پروڈکٹس، بینرز، بلز اور کھاتہ ڈیٹا کامیابی سے کلاؤڈ پر سنک ہو گیا!'
          : `All ${products.length} fabrics, ${invoices.length} invoices, and ${khataAccounts.length} Khata accounts synced to Cloud Firestore!`
      );
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      const snap = await createCloudBackupSnapshot(backupTitle);
      setBackupTitle('');
      setStatusMsg(
        isUrdu
          ? `کلاؤڈ بیک اپ "${snap.title}" محفوظ ہو گیا!`
          : `Cloud snapshot backup "${snap.title}" saved successfully.`
      );
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreSnapshot = async (bkp: typeof cloudBackups[number]) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await restoreFromCloudBackup(bkp);
      setStatusMsg(`Database restored to snapshot: "${bkp.title}".`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cloud Infrastructure Status Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#16161a] to-[#0f0f12] border border-[#d4af37]/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[#d4af37]" />
              <span>
                {isUrdu
                  ? 'کلاؤڈ ڈیٹابیس، سیکیورٹی اور ریکوری سینٹر'
                  : 'Cloud Firestore Security, Sync & Multi-Device Hub'}
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Project: <span className="font-mono text-[#d4af37]">{firebaseConfig.projectId}</span> · Database:{' '}
              <span className="font-mono text-gray-300">{firebaseConfig.firestoreDatabaseId}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {cloudSync.isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                <Wifi className="w-3.5 h-3.5" />
                <span>Online & Live</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Cache Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Google Cloud Admin Auth Box */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 text-xs">
            <p className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              <span>
                {cloudSync.isCloudAdmin
                  ? `Verified Cloud Admin: ${firebaseUser?.email}`
                  : 'Google Admin Cloud Authentication'}
              </span>
            </p>
            <p className="text-gray-400">
              {cloudSync.isCloudAdmin
                ? 'Real-time multi-device Firestore read/write synchronization & RBAC enabled.'
                : `Sign in with authorized Google Admin account (${BOOTSTRAPPED_ADMIN_EMAIL}) to synchronize ERP & backups across Android & PC.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {firebaseUser ? (
              <>
                <button
                  type="button"
                  disabled={busy || !cloudSync.isCloudAdmin}
                  onClick={handleFullSync}
                  className="px-3.5 py-2 rounded-xl bg-[#d4af37] text-black font-bold text-xs flex items-center gap-1.5 hover:brightness-110 disabled:opacity-40 cursor-pointer"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Sync Local Data to Cloud</span>
                </button>
                <button
                  type="button"
                  onClick={() => signOutCloud().catch(() => {})}
                  className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-gray-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle().catch(() => {})}
                className="px-4 py-2 rounded-xl bg-white text-stone-900 font-bold text-xs flex items-center gap-2 hover:bg-stone-100 shadow cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-600" />
                <span>Sign in with Google Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Device Android & PC Connection Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-[#d4af37]" />
              <div>
                <p className="font-bold text-white">Android App & Offline PWA</p>
                <p className="text-[11px] text-gray-400">
                  Install directly on Android & iOS with automatic offline IndexedDB queue.
                </p>
              </div>
            </div>
            <PWAInstallButton compact />
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">PC & Showroom Desktop ERP Sync</p>
              <p className="text-[11px] text-gray-400">
                Single shared Firebase Firestore database synced in real-time across Chrome, Edge, Firefox & Safari.
              </p>
            </div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {(errorMsg || cloudSync.lastError) && (
        <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
          {errorMsg || cloudSync.lastError}
        </div>
      )}

      {/* Automatic & Manual Cloud Backups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
            <Database className="w-4 h-4" />
            <span>{isUrdu ? 'کلاؤڈ بیک اپ اور ریسٹور' : 'Cloud Snapshot Backups & Recovery'}</span>
          </h4>

          <form onSubmit={handleCreateSnapshot} className="flex gap-2 text-xs">
            <input
              type="text"
              value={backupTitle}
              onChange={(e) => setBackupTitle(e.target.value)}
              placeholder="Snapshot label (e.g. Daily Closing Backup)"
              className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-[#d4af37] text-black font-bold hover:brightness-110 cursor-pointer shrink-0"
            >
              Create Snapshot
            </button>
          </form>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {cloudBackups.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">
                No cloud snapshots saved yet. Click "Create Snapshot" to save a recovery point.
              </p>
            ) : (
              cloudBackups.map((bkp) => (
                <div
                  key={bkp.id}
                  className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{bkp.title}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {bkp.createdAt.slice(0, 16).replace('T', ' ')} · {bkp.summaryCounts.products} items ·{' '}
                      {bkp.summaryCounts.invoices} bills · {bkp.summaryCounts.khataAccounts} khata
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleRestoreSnapshot(bkp)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Immutable Activity Security Audit Logs */}
        <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <History className="w-4 h-4" />
            <span>{isUrdu ? 'سیکیورٹی ایکٹیویٹی لاگز' : 'Security Activity Audit Trail'}</span>
          </h4>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {activityLogs.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">
                No activity events logged yet. All ERP changes & backups are recorded here.
              </p>
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <p className="font-semibold text-white">
                      <span className="text-[#d4af37]">[{log.module}]</span> {log.action}
                    </p>
                    <p className="text-[11px] text-gray-400">{log.details}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                        log.severity === 'security'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : log.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {log.severity}
                    </span>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {log.timestamp.slice(11, 19)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
