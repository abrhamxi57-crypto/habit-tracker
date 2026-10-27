import React, { useState } from 'react';
import { format, addDays, subDays, startOfWeek, isSameDay } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, Plus, Sparkles, Brain, Droplet, BookOpen, Dumbbell, PenTool, Flame } from 'lucide-react';
import { Habit, HabitLog } from '../../types/habit';
import { isHabitScheduledOnDate } from '../../services/habitService';

interface HabitMatrixTableProps {
  habits: Habit[];
  logs: HabitLog[];
  onToggle: (habit: Habit, dateStr: string) => void;
  onEditHabit: (habit: Habit) => void;
  onNewHabit: () => void;
}

// Icon mapper
const renderHabitIcon = (iconName: string) => {
  const className = "w-4 h-4";
  switch (iconName.toLowerCase()) {
    case 'brain':
      return <Brain className={className} />;
    case 'droplet':
    case 'water':
      return <Droplet className={className} />;
    case 'bookopen':
    case 'book':
    case 'read':
      return <BookOpen className={className} />;
    case 'dumbbell':
    case 'pushups':
    case 'workout':
      return <Dumbbell className={className} />;
    case 'pentool':
    case 'journal':
      return <PenTool className={className} />;
    case 'flame':
      return <Flame className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

export const HabitMatrixTable: React.FC<HabitMatrixTableProps> = ({
  habits,
  logs,
  onToggle,
  onEditHabit,
  onNewHabit
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday start
  );

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const monthTitle = format(daysOfWeek[0], 'MMMM yyyy');
  const today = new Date();

  // Create fast lookup map for logs: `habitId_dateStr` -> HabitLog
  const logMap = new Map<string, HabitLog>();
  logs.forEach(l => {
    logMap.set(`${l.habit_id}_${l.date}`, l);
  });

  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
      {/* Month Header and Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {monthTitle}
          </h2>
          <div className="flex items-center space-x-1 bg-slate-900/80 rounded-xl p-1 border border-white/5">
            <button
              onClick={handlePrevWeek}
              aria-label="Previous week"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWeek}
              aria-label="Next week"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={onNewHabit}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-sm hover:shadow-glow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {/* Habit name column header */}
              <th className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-64">
                Habit
              </th>

              {/* 7 Days of week */}
              {daysOfWeek.map(day => {
                const isTodayDate = isSameDay(day, today);
                const dayName = format(day, 'EEE').toUpperCase();
                const dayNumber = format(day, 'd');

                return (
                  <th key={day.toISOString()} className="py-3 px-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono font-bold text-slate-400 mb-1">
                        {dayName}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isTodayDate
                            ? 'bg-indigo-600 text-white shadow-glow-sm ring-2 ring-indigo-400/40'
                            : 'text-slate-300'
                        }`}
                      >
                        {dayNumber}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.04]">
            {habits.map(habit => {
              // Calculate completions this week
              let completedThisWeek = 0;
              let scheduledThisWeek = 0;

              daysOfWeek.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isSched = isHabitScheduledOnDate(habit, day);
                if (isSched) scheduledThisWeek++;
                const log = logMap.get(`${habit.id}_${dateStr}`);
                if (log?.completed) completedThisWeek++;
              });

              return (
                <tr
                  key={habit.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Habit Info Cell */}
                  <td className="py-3.5 px-4">
                    <div
                      onClick={() => onEditHabit(habit)}
                      className="flex items-center space-x-3 cursor-pointer select-none"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                        style={{
                          backgroundColor: `${habit.color}25`,
                          color: habit.color || '#818cf8'
                        }}
                      >
                        {renderHabitIcon(habit.icon)}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate group-hover:text-indigo-300 transition-colors">
                          {habit.title}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {completedThisWeek}/{scheduledThisWeek || 7}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 7 Checkbox Days */}
                  {daysOfWeek.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSched = isHabitScheduledOnDate(habit, day);
                    const log = logMap.get(`${habit.id}_${dateStr}`);
                    const isCompleted = Boolean(log?.completed);

                    return (
                      <td key={dateStr} className="py-3.5 px-2 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => onToggle(habit, dateStr)}
                            title={`${habit.title} on ${format(day, 'EEE, MMM d')}: ${
                              isCompleted ? 'Completed' : 'Not completed'
                            }`}
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center border transition-all active:scale-90 ${
                              isCompleted
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-glow-sm'
                                : isSched
                                ? 'bg-slate-900/80 border-slate-700/60 hover:border-slate-500 text-transparent'
                                : 'bg-slate-950/40 border-white/[0.03] opacity-40 hover:opacity-80'
                            }`}
                          >
                            <Check
                              className={`w-4 h-4 transition-transform ${
                                isCompleted ? 'scale-100' : 'scale-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
