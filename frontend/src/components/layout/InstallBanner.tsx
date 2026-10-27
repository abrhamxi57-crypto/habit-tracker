import React from 'react';
import { Download, X, Sparkles } from 'lucide-react';

interface InstallBannerProps {
  canInstall: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export const InstallBanner: React.FC<InstallBannerProps> = ({ canInstall, onInstall, onDismiss }) => {
  if (!canInstall) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-slate-900/60 border-b border-indigo-500/30 px-4 py-2.5 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm text-slate-200 truncate">
            <span className="font-semibold text-white">Install HabitFlow</span> for instant offline launch, homescreen shortcuts & reminders.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onInstall}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white shadow-glow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
          <button
            onClick={onDismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
