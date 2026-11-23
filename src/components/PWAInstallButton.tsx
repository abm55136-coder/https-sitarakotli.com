import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useShop } from '../context/ShopContext';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { lang } = useShop();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-stone-950 font-semibold transition-all cursor-pointer ${
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
        }`}
        aria-label={lang === 'ur' ? 'ایپ انسٹال کریں' : 'Install Sitara App'}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{lang === 'ur' ? 'ایپ انسٹال کریں' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className={`inline-flex items-center gap-1.5 rounded-full bg-stone-900 border border-amber-500/30 text-amber-300 hover:bg-amber-500/15 font-semibold transition-all cursor-pointer ${
            compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
          }`}
          aria-label="Install Sitara App on iOS"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{lang === 'ur' ? 'آئی فون ایپ' : 'Install on iOS'}</span>
        </button>

        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-amber-500/40 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-100">
                  {lang === 'ur' ? 'آئی فون / آئی پیڈ پر انسٹال کریں' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="p-1 text-stone-400 hover:text-white rounded-full"
                  aria-label="Close iOS install instructions"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {lang === 'ur'
                  ? '1. سفاری براؤزر میں Share بٹن دبائیں۔ 2. نیچے سکرول کر کے Add to Home Screen پر کلک کریں۔'
                  : '1. Tap the Share button in Safari toolbar. 2. Scroll down and tap Add to Home Screen to run Sitara Cloth House as an offline-capable app.'}
              </p>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer"
              >
                {lang === 'ur' ? 'بند کریں' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
