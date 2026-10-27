import React from 'react';
import { Check, Clock, Calendar, Sparkles, Brain, Droplet, BookOpen, Dumbbell, PenTool, Flame } from 'lucide-react';
import { Habit, StreakStats } from '../../types/habit';
import { StreakFlame } from './StreakFlame';
import { NumericStepper } from './NumericStepper';

interface HabitCardProps {
  habit: Habit;
  stats: StreakStats;
  isCompleted: boolean;
  currentValue: number;
  onToggle: (habit: Habit, val?: number) => void;
  onEdit: (habit: Habit) => void;
}

// Icon mapper
const renderHabitIcon = (iconName: string, className = 'w-4 h-4') => {
  switch (iconName.toLowerCase()) {
    case 'brain':
      return <Brain className={className} />;
    case 'droplet':
      return <Droplet className={className} />;
    case 'bookopen':
    case 'book':
      return <BookOpen className={className} />;
    case 'dumbbell':
      return <Dumbbell className={className} />;
    case 'pentool':
    case 'pen':
      return <PenTool className={className} />;
    case 'flame':
      return <Flame className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  stats,
  isCompleted,
  currentValue,
  onToggle,
  onEdit
}) => {
  const getFrequencyLabel = () => {
    switch (habit.frequency_type) {
      case 'daily':
        return 'Daily';
      case 'weekdays':
        return 'Weekdays';
      case 'weekends':
        return 'Weekends';
      case 'custom':
        return 'Custom';
      default:
        return 'Every day';
    }
  };

  return (
    <div
      onClick={() => onEdit(habit)}
      className={`glass-panel glass-panel-hover rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden ${
        isCompleted
          ? 'border-emerald-500/30 bg-emerald-950/10'
          : 'border-white/[0.08]'
      }`}
    >
      {/* Top Accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ backgroundColor: habit.color || '#6366f1' }}
      ></div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3 min-w-0">
          {/* Habit Icon Circle */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
            style={{
              backgroundColor: `${habit.color}20`,
              color: habit.color || '#818cf8'
            }}
          >
            {renderHabitIcon(habit.icon)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className={`font-bold text-sm sm:text-base leading-tight truncate ${
                isCompleted ? 'text-slate-300 line-through opacity-80' : 'text-white'
              }`}>
                {habit.title}
              </h3>
              <StreakFlame stats={stats} />
            </div>

            {habit.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {habit.description}
              </p>
            )}

            {/* Badges / Schedule */}
            <div className="flex items-center space-x-2 mt-2 flex-wrap gap-y-1">
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-400 border border-white/5">
                {habit.category}
              </span>

              <span className="flex items-center space-x-1 text-[10px] text-slate-400">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{getFrequencyLabel()}</span>
              </span>

              {habit.reminder_time && (
                <span className="flex items-center space-x-1 text-[10px] text-indigo-300 font-mono">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>{habit.reminder_time}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Toggle Action for Boolean Habits */}
        {habit.target_type === 'boolean' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(habit);
            }}
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 shrink-0 ${
              isCompleted
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-glow-emerald'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-transparent hover:text-slate-400 border-white/10'
            }`}
          >
            <Check className={`w-5 h-5 transition-transform ${isCompleted ? 'scale-100' : 'scale-75'}`} />
          </button>
        )}
      </div>

      {/* Numeric Stepper for Quantifiable Habits */}
      {habit.target_type === 'numeric' && (
        <NumericStepper
          habit={habit}
          currentValue={currentValue}
          onUpdate={(val) => onToggle(habit, val)}
        />
      )}
    </div>
  );
};
