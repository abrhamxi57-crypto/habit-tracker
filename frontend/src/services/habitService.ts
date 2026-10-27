import { format, subDays, parseISO, isSameDay, getDay } from 'date-fns';
import { db } from '../db';
import { Habit, HabitLog, StreakStats, FrequencyType, SyncAuditRecord } from '../types/habit';

/**
 * Checks if a habit is scheduled on a given Date
 */
export function isHabitScheduledOnDate(habit: Habit, date: Date): boolean {
  if (habit.archived) return false;
  const dayOfWeek = getDay(date); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  switch (habit.frequency_type) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom':
      return habit.custom_days?.includes(dayOfWeek) ?? false;
    case 'weekly_target':
      return true; // Scheduled generally, checked per week
    default:
      return true;
  }
}

/**
 * Accurately calculate current streak, longest streak, and consistency metrics
 */
export function calculateStreakStats(
  habit: Habit,
  logs: HabitLog[],
  targetDate: Date = new Date()
): StreakStats {
  const targetDateStr = format(targetDate, 'yyyy-MM-dd');
  const isScheduledToday = isHabitScheduledOnDate(habit, targetDate);

  // Map of date string -> HabitLog
  const logMap = new Map<string, HabitLog>();
  logs.forEach(log => {
    if (log.habit_id === habit.id) {
      logMap.set(log.date, log);
    }
  });

  const todayLog = logMap.get(targetDateStr);
  const completedToday = Boolean(todayLog?.completed);

  // Total completions count
  let totalCompletions = 0;
  logMap.forEach(log => {
    if (log.completed) totalCompletions++;
  });

  // Calculate Current Streak
  let currentStreak = 0;
  let checkDate = targetDate;
  
  // If scheduled today and already completed today, start counting from today
  // If scheduled today but not completed yet, start inspecting from yesterday (streak is not broken yet!)
  // If not scheduled today, also inspect backwards from yesterday
  if (isScheduledToday && completedToday) {
    currentStreak++;
    checkDate = subDays(checkDate, 1);
  } else if (!isScheduledToday) {
    // If today is an off day, check backwards from yesterday
    checkDate = subDays(checkDate, 1);
  } else {
    // Scheduled today, but not completed yet:
    // User still has time today, so evaluate streak through yesterday
    checkDate = subDays(checkDate, 1);
  }

  // Traverse backwards day by day to count consecutive scheduled completions
  let maxLookback = 365;
  let streakBroken = false;

  while (maxLookback > 0 && !streakBroken) {
    maxLookback--;
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    const isScheduled = isHabitScheduledOnDate(habit, checkDate);

    if (isScheduled) {
      const log = logMap.get(dateStr);
      if (log && log.completed) {
        currentStreak++;
      } else {
        // Missed scheduled day: streak ends
        streakBroken = true;
      }
    }
    // If not scheduled (e.g. rest day for weekend/custom schedule), streak passes through without breaking!
    checkDate = subDays(checkDate, 1);
  }

  // Calculate Longest Streak historically (look back up to 180 days)
  let longestStreak = 0;
  let runningStreak = 0;
  const historyDays = 180;
  
  for (let i = historyDays; i >= 0; i--) {
    const d = subDays(targetDate, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const isScheduled = isHabitScheduledOnDate(habit, d);

    if (isScheduled) {
      const log = logMap.get(dateStr);
      if (log && log.completed) {
        runningStreak++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Consistency rates (7d, 30d, 90d)
  const calcRate = (days: number) => {
    let scheduledCount = 0;
    let completedCount = 0;
    for (let i = 0; i < days; i++) {
      const d = subDays(targetDate, i);
      const isSched = isHabitScheduledOnDate(habit, d);
      if (isSched) {
        scheduledCount++;
        const log = logMap.get(format(d, 'yyyy-MM-dd'));
        if (log && log.completed) completedCount++;
      }
    }
    return scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;
  };

  const consistencyRate7d = calcRate(7);
  const consistencyRate30d = calcRate(30);
  const consistencyRate90d = calcRate(90);

  // Determine streak status tier
  let streakStatus: StreakStats['streak_status'] = 'idle';
  if (currentStreak >= 30) streakStatus = 'supernova';
  else if (currentStreak >= 14) streakStatus = 'inferno';
  else if (currentStreak >= 7) streakStatus = 'blaze';
  else if (currentStreak >= 3) streakStatus = 'flame';
  else if (currentStreak >= 1) streakStatus = 'spark';

  return {
    habit_id: habit.id,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_completions: totalCompletions,
    completed_today: completedToday,
    is_scheduled_today: isScheduledToday,
    consistency_rate_7d: consistencyRate7d,
    consistency_rate_30d: consistencyRate30d,
    consistency_rate_90d: consistencyRate90d,
    streak_status: streakStatus
  };
}

/**
 * Toggle or update a habit's completion log in Dexie & queue offline sync
 */
export async function toggleHabitCompletion(
  habit: Habit,
  date: string,
  targetValue?: number
): Promise<HabitLog> {
  const existingLog = await db.logs.where({ habit_id: habit.id, date }).first();
  const now = new Date().toISOString();

  let isCompleted: boolean;
  let newValue: number;

  if (habit.target_type === 'numeric') {
    if (targetValue !== undefined) {
      newValue = targetValue;
    } else {
      newValue = (existingLog?.current_value || 0) + 1;
    }
    isCompleted = newValue >= habit.target_value;
  } else {
    // Boolean toggle
    isCompleted = existingLog ? !existingLog.completed : true;
    newValue = isCompleted ? 1 : 0;
  }

  const logId = existingLog ? existingLog.id : `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const logRecord: HabitLog = {
    id: logId,
    habit_id: habit.id,
    date,
    completed: isCompleted,
    current_value: newValue,
    completed_at: isCompleted ? now : undefined,
    updated_at: now,
    sync_status: 'pending'
  };

  await db.logs.put(logRecord);

  // Queue sync audit record for offline replication
  const audit: SyncAuditRecord = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entity_type: 'log',
    entity_id: logId,
    action: existingLog ? 'update' : 'create',
    payload: JSON.stringify(logRecord),
    timestamp: now
  };
  await db.syncQueue.put(audit);

  return logRecord;
}

/**
 * Create or update a Habit record in Dexie and queue sync
 */
export async function saveHabit(habitData: Partial<Habit>): Promise<Habit> {
  const now = new Date().toISOString();
  const isNew = !habitData.id;
  const habitId = habitData.id || `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const habit: Habit = {
    id: habitId,
    title: habitData.title || 'New Habit',
    description: habitData.description || '',
    category: habitData.category || 'productivity',
    color: habitData.color || '#6366f1',
    icon: habitData.icon || 'Sparkles',
    frequency_type: habitData.frequency_type || 'daily',
    custom_days: habitData.custom_days || [1, 2, 3, 4, 5],
    weekly_target_days: habitData.weekly_target_days || 5,
    target_type: habitData.target_type || 'boolean',
    target_value: habitData.target_value || 1,
    unit: habitData.unit || '',
    time_of_day: habitData.time_of_day || 'anytime',
    reminder_time: habitData.reminder_time || null,
    archived: habitData.archived || false,
    streak_freeze_count: habitData.streak_freeze_count ?? 1,
    created_at: habitData.created_at || now,
    updated_at: now,
    sync_status: 'pending'
  };

  await db.habits.put(habit);

  const audit: SyncAuditRecord = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entity_type: 'habit',
    entity_id: habitId,
    action: isNew ? 'create' : 'update',
    payload: JSON.stringify(habit),
    timestamp: now
  };
  await db.syncQueue.put(audit);

  return habit;
}

/**
 * Archive or Delete a Habit
 */
export async function deleteHabit(habitId: string): Promise<void> {
  await db.habits.delete(habitId);
  await db.logs.where('habit_id').equals(habitId).delete();

  const audit: SyncAuditRecord = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entity_type: 'habit',
    entity_id: habitId,
    action: 'delete',
    payload: JSON.stringify({ id: habitId }),
    timestamp: new Date().toISOString()
  };
  await db.syncQueue.put(audit);
}
