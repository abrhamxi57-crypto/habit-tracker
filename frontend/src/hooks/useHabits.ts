import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../db';
import { Habit, HabitLog, StreakStats } from '../types/habit';
import { calculateStreakStats, isHabitScheduledOnDate, toggleHabitCompletion, saveHabit, deleteHabit } from '../services/habitService';
import { soundService } from '../services/soundService';

export function useHabits(targetDate: Date = new Date()) {
  const targetDateStr = format(targetDate, 'yyyy-MM-dd');

  // Reactively query all non-archived habits
  const habits = useLiveQuery(
    () => db.habits.filter(h => !h.archived).toArray(),
    []
  ) || [];

  // Reactively query all logs
  const logs = useLiveQuery(
    () => db.logs.toArray(),
    []
  ) || [];

  // Map of logs for target date
  const todayLogs = useLiveQuery(
    () => db.logs.where('date').equals(targetDateStr).toArray(),
    [targetDateStr]
  ) || [];

  const todayLogMap = new Map<string, HabitLog>();
  todayLogs.forEach(l => todayLogMap.set(l.habit_id, l));

  // Compute stats for each habit
  const habitWithStats = habits.map(habit => {
    const stats = calculateStreakStats(habit, logs, targetDate);
    const todayLog = todayLogMap.get(habit.id);
    const isScheduled = isHabitScheduledOnDate(habit, targetDate);

    return {
      habit,
      stats,
      todayLog,
      isScheduled,
      isCompleted: Boolean(todayLog?.completed),
      currentValue: todayLog?.current_value || 0
    };
  });

  // Scheduled habits for the target date
  const scheduledHabits = habitWithStats.filter(item => item.isScheduled);
  const completedCount = scheduledHabits.filter(item => item.isCompleted).length;
  const totalCount = scheduledHabits.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Toggle action
  const handleToggle = async (habit: Habit, numericVal?: number) => {
    const res = await toggleHabitCompletion(habit, targetDateStr, numericVal);
    if (res.completed) {
      soundService.playCheckmarkSound();
    } else {
      soundService.playClickSound();
    }
    return res;
  };

  return {
    habits,
    logs,
    habitWithStats,
    scheduledHabits,
    completedCount,
    totalCount,
    completionPercentage,
    handleToggle,
    saveHabit,
    deleteHabit
  };
}
