import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-40 rounded-xl bg-[#16294D] border border-[#F5B800]/50 px-3.5 py-2.5 text-xs font-medium text-[#FCD34D] shadow-lg flex items-center gap-2"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline Mode · Saved menu and food logs remain available</span>
    </div>
  );
};
