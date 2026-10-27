import React, { useState } from 'react';
import { format } from 'date-fns';
import { Sparkles, Trophy, Plus, CheckCircle, Flame, Sun, Sunset, Moon, Clock } from 'lucide-react';
import { Habit, TimeOfDay } from '../types/habit';
import { HabitCard } from '../components/habits/HabitCard';
import { fireCelebrationConfetti } from '../components/ui/Confetti';
import { soundService } from '../services/soundService';
import { populateDemoData } from '../services/demoDataService';

interface TodayPageProps {
  scheduledHabits: Array<{
    habit: Habit;
    stats: any;
    isCompleted: boolean;
    currentValue: number;
  }>;
  totalCount: number;
  completedCount: number;
  completionPercentage: number;
  onToggle: (habit: Habit, val?: number) => void;
  onOpenCreateModal: () => void;
  onEditHabit: (habit: Habit) => void;
}

export const TodayPage: React.FC<TodayPageProps> = ({
  scheduledHabits,
  totalCount,
  completedCount,
  completionPercentage,
  onToggle,
  onOpenCreateModal,
  onEditHabit
}) => {
  const [filterTime, setFilterTime] = useState<TimeOfDay | 'all'>('all');
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Filter habits by time of day
  const filteredHabits = scheduledHabits.filter(item => {
    if (filterTime === 'all') return true;
    return item.habit.time_of_day === filterTime || item.habit.time_of_day === 'anytime';
  });

  // Check if 100% complete today
  if (totalCount > 0 && completedCount === totalCount && !hasCelebrated) {
    setHasCelebrated(true);
    fireCelebrationConfetti();
    soundService.playStreakMilestoneSound();
  } else if (completedCount < totalCount && hasCelebrated) {
    setHasCelebrated(false);
  }

  const handleLoadDemo = async () => {
    await populateDemoData();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Daily Progress Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-[#0a0d14]">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Today's Daily Ritual</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {completionPercentage === 100 && totalCount > 0
                ? 'All Done for Today! Spectacular Flow!'
                : 'Focus on your daily momentum'}
            </h1>
            <p className="text-sm text-slate-400">
              {completionPercentage === 100 && totalCount > 0
                ? 'You have completed every scheduled habit for today. Your consistency streak is growing stronger.'
                : `You've checked off ${completedCount} of ${totalCount} scheduled habits today. Keep the fire burning!`}
            </p>
          </div>

          {/* Progress Circular Meter */}
          <div className="flex items-center space-x-4 shrink-0">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-indigo-500 transition-all duration-700 ease-out"
                  strokeWidth="8"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * completionPercentage) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-white">
                  {completionPercentage}%
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Done
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs by Time of Day */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-900/80 border border-white/5">
          {[
            { id: 'all', label: 'All', icon: Clock },
            { id: 'morning', label: 'Morning', icon: Sun },
            { id: 'afternoon', label: 'Afternoon', icon: Sunset },
            { id: 'evening', label: 'Evening', icon: Moon }
          ].map(tab => {
            const Icon = tab.icon;
            const active = filterTime === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTime(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-indigo-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Habit</span>
        </button>
      </div>

      {/* Habits List */}
      {filteredHabits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredHabits.map(item => (
            <HabitCard
              key={item.habit.id}
              habit={item.habit}
              stats={item.stats}
              isCompleted={item.isCompleted}
              currentValue={item.currentValue}
              onToggle={onToggle}
              onEdit={onEditHabit}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-10 border border-white/10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-white">No habits scheduled for this view</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create a new habit or load our 60-day realistic demo dataset to test all streaks, charts, and notifications instantly.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={onOpenCreateModal}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Habit</span>
            </button>
            <button
              onClick={handleLoadDemo}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Load Demo Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
