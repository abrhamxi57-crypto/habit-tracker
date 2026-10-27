import React from 'react';
import { format } from 'date-fns';
import { Plus, Bell, BellOff, Download, Sparkles } from 'lucide-react';
import { OfflineBadge } from './OfflineBadge';

interface HeaderProps {
  isOnline: boolean;
  isSyncing: boolean;
  canInstall: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  onInstallClick: () => void;
  onNewHabitClick: () => void;
  onSyncClick: () => void;
  onRequestNotifications: () => void;
  completionPercentage?: number;
  completedCount?: number;
  totalCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  isSyncing,
  canInstall,
  notificationPermission,
  onInstallClick,
  onNewHabitClick,
  onSyncClick,
  onRequestNotifications,
  completionPercentage = 0,
  completedCount = 0,
  totalCount = 0
}) => {
  const todayStr = format(new Date(), 'EEEE, MMMM d');

  return (
    <header className="sticky top-0 z-30 bg-[#0a0d14]/85 backdrop-blur-md border-b border-white/[0.07] px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Date */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 p-[1.5px] shadow-glow-sm">
            <div className="w-full h-full bg-[#0d121f] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                HabitFlow
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{todayStr}</p>
          </div>
        </div>

        {/* Center / Stats (desktop) */}
        {totalCount > 0 && (
          <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10">
            <div className="text-xs text-slate-300 font-medium">
              Today: <span className="font-bold text-white">{completedCount}/{totalCount}</span> completed
            </div>
            <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-emerald-400">{completionPercentage}%</span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <OfflineBadge isOnline={isOnline} isSyncing={isSyncing} onSyncClick={onSyncClick} />

          {/* Notification Button */}
          <button
            onClick={onRequestNotifications}
            title={
              notificationPermission === 'granted'
                ? 'Habit reminders enabled'
                : 'Click to enable browser habit reminders'
            }
            className={`p-2 rounded-lg border transition-all ${
              notificationPermission === 'granted'
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
                : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            {notificationPermission === 'granted' ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>

          {/* Install Button (if eligible) */}
          {canInstall && (
            <button
              onClick={onInstallClick}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          {/* New Habit Button */}
          <button
            onClick={onNewHabitClick}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-sm hover:shadow-glow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Habit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
