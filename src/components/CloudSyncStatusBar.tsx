import React from 'react';
import { WifiOff, Cloud } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const OfflineIndicator: React.FC = () => {
  const { cloudSync, lang } = useShop();

  if (cloudSync.isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-xl bg-amber-600/95 border border-amber-300/50 px-3.5 py-2 text-xs font-semibold text-stone-950 shadow-2xl backdrop-blur-md"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {lang === 'ur'
          ? 'آف لائن موڈ: مقامی کیش استعمال ہو رہا ہے — انٹرنیٹ آتے ہی خودکار سنک ہوگا۔'
          : 'Offline Mode — Changes saved locally & auto-sync when online.'}
      </span>
    </div>
  );
};

export const CloudSyncBadge: React.FC = () => {
  const { cloudSync, lang } = useShop();

  return (
    <div
      className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
        !cloudSync.isOnline
          ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
          : cloudSync.hasPendingWrites
          ? 'bg-sky-950/60 border-sky-500/40 text-sky-300'
          : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
      }`}
      title={cloudSync.lastSyncedAt ? `Last synced: ${cloudSync.lastSyncedAt}` : 'Cloud database ready'}
    >
      {!cloudSync.isOnline ? (
        <WifiOff className="w-3 h-3" />
      ) : (
        <Cloud className="w-3 h-3" />
      )}
      <span>
        {!cloudSync.isOnline
          ? lang === 'ur'
            ? 'آف لائن کیش'
            : 'Offline Cache'
          : cloudSync.hasPendingWrites
          ? lang === 'ur'
            ? 'سنک جاری...'
            : 'Syncing...'
          : lang === 'ur'
          ? 'کلاؤڈ سنک'
          : 'Cloud Synced'}
      </span>
    </div>
  );
};
