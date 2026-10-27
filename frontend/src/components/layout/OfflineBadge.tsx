import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBadgeProps {
  isOnline: boolean;
  isSyncing: boolean;
  onSyncClick?: () => void;
}

export const OfflineBadge: React.FC<OfflineBadgeProps> = ({ isOnline, isSyncing, onSyncClick }) => {
  if (isOnline && !isSyncing) {
    return (
      <button
        onClick={onSyncClick}
        title="Online & Synced. Click to sync now."
        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <Wifi className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Online</span>
      </button>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <div
      title="Working offline. Changes are saved locally to IndexedDB and will sync when reconnected."
      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode</span>
    </div>
  );
};
