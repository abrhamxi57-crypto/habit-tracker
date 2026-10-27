import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, getDay, isSameDay } from 'date-fns';
import { Habit, HabitLog, HabitInsight } from '../types/habit';
import { isHabitScheduledOnDate, calculateStreakStats } from './habitService';

export interface HeatmapDay {
  date: string;
  dayOfWeek: number;
  completedCount: number;
  scheduledCount: number;
  percentage: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = none, 1 = 1-25%, 2 = 26-50%, 3 = 51-75%, 4 = 76-100%
  habitsCompleted: string[];
}

export interface WeeklyChartData {
  dayName: string;
  date: string;
  completed: number;
  scheduled: number;
  rate: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  completions: number;
  rate: number;
  color: string;
}

/**
 * Generates an activity heatmap dataset for the past N days (e.g. 180 or 365 days)
 */
export function generateHeatmapData(
  habits: Habit[],
  logs: HabitLog[],
  totalDays: number = 180,
  referenceDate: Date = new Date()
): HeatmapDay[] {
  const result: HeatmapDay[] = [];
  const logMap = new Map<string, HabitLog[]>();

  logs.forEach(log => {
    const list = logMap.get(log.date) || [];
    list.push(log);
    logMap.set(log.date, list);
  });

  const habitMap = new Map<string, Habit>();
  habits.forEach(h => habitMap.set(h.id, h));

  for (let i = totalDays - 1; i >= 0; i--) {
    const date = subDays(referenceDate, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);

    let scheduledCount = 0;
    let completedCount = 0;
    const habitsCompleted: string[] = [];

    const dayLogs = logMap.get(dateStr) || [];
    const completedHabitIds = new Set(
      dayLogs.filter(l => l.completed).map(l => l.habit_id)
    );

    habits.forEach(habit => {
      if (isHabitScheduledOnDate(habit, date)) {
        scheduledCount++;
        if (completedHabitIds.has(habit.id)) {
          completedCount++;
          habitsCompleted.push(habit.title);
        }
      }
    });

    const percentage = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;
    
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (percentage > 75) level = 4;
    else if (percentage > 50) level = 3;
    else if (percentage > 25) level = 2;
    else if (percentage > 0) level = 1;

    result.push({
      date: dateStr,
      dayOfWeek,
      completedCount,
      scheduledCount,
      percentage,
      level,
      habitsCompleted
    });
  }

  return result;
}

/**
 * Computes weekly bar metrics for the current or specified week
 */
export function getWeeklyChartMetrics(
  habits: Habit[],
  logs: HabitLog[],
  referenceDate: Date = new Date()
): WeeklyChartData[] {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday start
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(referenceDate, { weekStartsOn: 1 }) });

  const logMap = new Map<string, HabitLog[]>();
  logs.forEach(log => {
    const list = logMap.get(log.date) || [];
    list.push(log);
    logMap.set(log.date, list);
  });

  return days.map(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayLogs = logMap.get(dateStr) || [];
    const completedSet = new Set(dayLogs.filter(l => l.completed).map(l => l.habit_id));

    let scheduled = 0;
    let completed = 0;

    habits.forEach(h => {
      if (isHabitScheduledOnDate(h, d)) {
        scheduled++;
        if (completedSet.has(h.id)) {
          completed++;
        }
      }
    });

    const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

    return {
      dayName: format(d, 'EEE'),
      date: dateStr,
      completed,
      scheduled,
      rate
    };
  });
}

/**
 * Computes Category breakdown metrics
 */
export function getCategoryBreakdown(
  habits: Habit[],
  logs: HabitLog[]
): CategoryBreakdown[] {
  const categoryColors: Record<string, string> = {
    health: '#10b981',
    fitness: '#06b6d4',
    mind: '#8b5cf6',
    productivity: '#6366f1',
    learning: '#f59e0b',
    personal: '#ec4899'
  };

  const activeHabits = habits.filter(h => !h.archived);
  const categories = Array.from(new Set(activeHabits.map(h => h.category)));

  return categories.map(cat => {
    const catHabits = activeHabits.filter(h => h.category === cat);
    const catHabitIds = new Set(catHabits.map(h => h.id));
    
    const catLogs = logs.filter(l => catHabitIds.has(l.habit_id));
    const completions = catLogs.filter(l => l.completed).length;

    // Estimate completion rate over past 30 days
    let scheduled = 0;
    let done = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = subDays(now, i);
      const dStr = format(d, 'yyyy-MM-dd');
      catHabits.forEach(h => {
        if (isHabitScheduledOnDate(h, d)) {
          scheduled++;
          const found = catLogs.find(l => l.habit_id === h.id && l.date === dStr && l.completed);
          if (found) done++;
        }
      });
    }

    const rate = scheduled > 0 ? Math.round((done / scheduled) * 100) : 0;

    return {
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: catHabits.length,
      completions,
      rate,
      color: categoryColors[cat] || '#6366f1'
    };
  });
}

/**
 * Explainable Habit Insights Engine
 * Formulates human-readable, actionable advice from patterns
 */
export function generateExplainableInsights(
  habits: Habit[],
  logs: HabitLog[]
): HabitInsight[] {
  const insights: HabitInsight[] = [];
  const activeHabits = habits.filter(h => !h.archived);
  if (activeHabits.length === 0) return insights;

  const now = new Date();
  const streakStats = activeHabits.map(h => ({
    habit: h,
    stats: calculateStreakStats(h, logs, now)
  }));

  // 1. Highlight Top Streak / Momentum
  const bestStreak = [...streakStats].sort((a, b) => b.stats.current_streak - a.stats.current_streak)[0];
  if (bestStreak && bestStreak.stats.current_streak >= 3) {
    insights.push({
      id: 'insight_streak_leader',
      type: 'praise',
      habit_id: bestStreak.habit.id,
      habit_title: bestStreak.habit.title,
      title: `${bestStreak.habit.title} is on fire!`,
      description: `You've maintained a ${bestStreak.stats.current_streak}-day streak with ${bestStreak.stats.consistency_rate_30d}% consistency over the past 30 days. Your habit loop is strongly established.`,
      metric: `${bestStreak.stats.current_streak} days`,
      importance: 'high'
    });
  }

  // 2. Identify Day-of-Week Sweet Spot
  // Count completions grouped by day of week
  const dayCompletions = [0, 0, 0, 0, 0, 0, 0];
  const dayScheduled = [0, 0, 0, 0, 0, 0, 0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let i = 0; i < 30; i++) {
    const d = subDays(now, i);
    const dayIndex = getDay(d);
    const dateStr = format(d, 'yyyy-MM-dd');

    activeHabits.forEach(h => {
      if (isHabitScheduledOnDate(h, d)) {
        dayScheduled[dayIndex]++;
        const hasCompleted = logs.some(l => l.habit_id === h.id && l.date === dateStr && l.completed);
        if (hasCompleted) dayCompletions[dayIndex]++;
      }
    });
  }

  let bestDayIdx = -1;
  let highestDayRate = -1;
  let worstDayIdx = -1;
  let lowestDayRate = 101;

  for (let i = 0; i < 7; i++) {
    if (dayScheduled[i] >= 3) {
      const rate = Math.round((dayCompletions[i] / dayScheduled[i]) * 100);
      if (rate > highestDayRate) {
        highestDayRate = rate;
        bestDayIdx = i;
      }
      if (rate < lowestDayRate) {
        lowestDayRate = rate;
        worstDayIdx = i;
      }
    }
  }

  if (bestDayIdx !== -1 && highestDayRate >= 60) {
    insights.push({
      id: 'insight_best_day',
      type: 'pattern',
      title: `${dayNames[bestDayIdx]} is your powerhouse day`,
      description: `You reach an impressive ${highestDayRate}% completion rate on ${dayNames[bestDayIdx]}s. Your energy and routines align best on this day.`,
      metric: `${highestDayRate}% rate`,
      importance: 'medium'
    });
  }

  if (worstDayIdx !== -1 && lowestDayRate < 50 && lowestDayRate >= 0) {
    insights.push({
      id: 'insight_challenging_day',
      type: 'recommendation',
      title: `${dayNames[worstDayIdx]}s tend to slip`,
      description: `Your completion rate drops to ${lowestDayRate}% on ${dayNames[worstDayIdx]}s. Try scheduling smaller habit doses or setting an earlier reminder for this day.`,
      metric: `${lowestDayRate}% rate`,
      importance: 'medium'
    });
  }

  // 3. At-risk habit check
  const atRisk = streakStats.find(item => 
    item.stats.is_scheduled_today && 
    !item.stats.completed_today && 
    item.stats.current_streak >= 5
  );

  if (atRisk) {
    insights.push({
      id: 'insight_at_risk',
      type: 'warning',
      habit_id: atRisk.habit.id,
      habit_title: atRisk.habit.title,
      title: `Protect your ${atRisk.stats.current_streak}-day streak on ${atRisk.habit.title}`,
      description: `Today's session is scheduled but not checked off yet. Complete it before midnight to maintain your momentum!`,
      metric: `${atRisk.stats.current_streak} streak at risk`,
      importance: 'high'
    });
  }

  return insights;
}
