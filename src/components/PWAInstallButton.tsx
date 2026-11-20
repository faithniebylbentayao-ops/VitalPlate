import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  if (variant === 'compact') {
    if (!isInstallable && !isIOS) {
      return null;
    }

    return (
      <>
        <button
          type="button"
          onClick={handleAction}
          className="min-h-[36px] px-3 rounded-lg bg-[#F5B800] hover:bg-[#FFCA28] text-[#091428] text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>

        {showGuide && <InstallGuideSheet isIOS={isIOS} onClose={() => setShowGuide(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="bg-[#10203E] rounded-3xl border border-[#1E355E] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#172B52] border border-[#2B487B] flex items-center justify-center text-[#FCD34D] shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Install VitalPlate Mobile App</p>
            <p className="text-xs text-[#A5B6D4] mt-0.5 leading-relaxed">
              Add VitalPlate to your phone home screen for full-screen launch and offline meal access.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAction}
          className="min-h-[44px] px-4 rounded-xl bg-[#F5B800] hover:bg-[#FFCA28] text-[#091428] text-xs font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          {isInstallable ? 'Install App' : isIOS ? 'Install on iOS' : 'How to Install'}
        </button>
      </div>

      {showGuide && <InstallGuideSheet isIOS={isIOS} onClose={() => setShowGuide(false)} />}
    </>
  );
};

const InstallGuideSheet: React.FC<{ isIOS: boolean; onClose: () => void }> = ({ isIOS, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#040A17]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-guide-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#10203E] rounded-t-3xl sm:rounded-3xl border border-[#233D6B] p-5 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pb-3">
          <div className="w-10 h-1.5 bg-[#2B487B] rounded-full" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <h3 id="pwa-guide-title" className="text-lg font-bold text-white">
            {isIOS ? 'Install on iPhone or iPad' : 'Add VitalPlate to Home Screen'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close installation guide"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#A5B6D4] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ol className="mt-3 space-y-2.5 text-sm text-[#DCE4F2]">
          {isIOS ? (
            <>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#FCD34D] mt-0.5">01.</span>
                <span>
                  Tap the <strong className="text-white inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5" /></strong> button in Safari&apos;s toolbar.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#FCD34D] mt-0.5">02.</span>
                <span>
                  Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#FCD34D] mt-0.5">03.</span>
                <span>Open VitalPlate directly from your home screen in standalone app mode.</span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#FCD34D] mt-0.5">01.</span>
                <span>Open your mobile browser menu (Chrome, Edge, or Samsung Internet).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#FCD34D] mt-0.5">02.</span>
                <span>
                  Select <strong className="text-white">Install App</strong> or <strong className="text-white">Add to Home screen</strong>.
                </span>
              </li>
            </>
          )}
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full min-h-[48px] rounded-xl bg-[#F5B800] hover:bg-[#FFCA28] text-[#091428] text-sm font-semibold"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
