import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { StreakStats } from '../../types/habit';

interface StreakFlameProps {
  stats: StreakStats;
  size?: 'sm' | 'md' | 'lg';
}

export const StreakFlame: React.FC<StreakFlameProps> = ({ stats, size = 'md' }) => {
  const { current_streak, streak_status } = stats;

  if (current_streak === 0) {
    return (
      <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium text-slate-500 bg-slate-800/40 border border-white/5">
        <Flame className="w-3.5 h-3.5 text-slate-600" />
        <span>0</span>
      </div>
    );
  }

  // Styles based on status tier
  let badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  let iconColor = 'text-amber-400';
  let glowStyle = '';

  if (streak_status === 'supernova') {
    badgeStyle = 'bg-gradient-to-r from-violet-600/30 to-cyan-500/30 text-cyan-200 border-cyan-400/40 shadow-glow-sm';
    iconColor = 'text-cyan-300 animate-spin';
    glowStyle = 'ring-glow-indigo';
  } else if (streak_status === 'inferno') {
    badgeStyle = 'bg-gradient-to-r from-red-600/20 to-orange-500/20 text-orange-300 border-orange-500/40 shadow-glow-fire';
    iconColor = 'text-orange-400 animate-flame';
  } else if (streak_status === 'blaze') {
    badgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-400/30';
    iconColor = 'text-amber-400 animate-flame';
  } else if (streak_status === 'flame') {
    badgeStyle = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    iconColor = 'text-orange-400';
  }

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all ${badgeStyle} ${glowStyle}`}
      title={`Current streak: ${current_streak} days. Longest streak: ${stats.longest_streak} days.`}
    >
      {streak_status === 'supernova' ? (
        <Sparkles className={`w-3.5 h-3.5 ${iconColor}`} />
      ) : (
        <Flame className={`w-3.5 h-3.5 ${iconColor}`} />
      )}
      <span className="font-mono tracking-tight">{current_streak}d</span>
    </div>
  );
};
