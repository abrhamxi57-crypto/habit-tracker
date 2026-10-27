import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  generateHeatmapData,
  getWeeklyChartMetrics,
  getCategoryBreakdown,
  generateExplainableInsights
} from '../services/analyticsService';
import { calculateStreakStats } from '../services/habitService';

export function useAnalytics(referenceDate: Date = new Date()) {
  const habits = useLiveQuery(() => db.habits.filter(h => !h.archived).toArray(), []) || [];
  const logs = useLiveQuery(() => db.logs.toArray(), []) || [];

  const heatmapData = useMemo(() => {
    return generateHeatmapData(habits, logs, 140, referenceDate);
  }, [habits, logs, referenceDate]);

  const weeklyMetrics = useMemo(() => {
    return getWeeklyChartMetrics(habits, logs, referenceDate);
  }, [habits, logs, referenceDate]);

  const categoryBreakdown = useMemo(() => {
    return getCategoryBreakdown(habits, logs);
  }, [habits, logs]);

  const insights = useMemo(() => {
    return generateExplainableInsights(habits, logs);
  }, [habits, logs]);

  // Global summary stats
  const globalStats = useMemo(() => {
    if (habits.length === 0) {
      return {
        bestStreak: 0,
        averageConsistency: 0,
        totalCompletions: 0,
        activeHabitCount: 0
      };
    }

    const allStats = habits.map(h => calculateStreakStats(h, logs, referenceDate));
    const bestStreak = Math.max(0, ...allStats.map(s => s.longest_streak));
    const totalCompletions = allStats.reduce((sum, s) => sum + s.total_completions, 0);
    const avgConsistency = Math.round(
      allStats.reduce((sum, s) => sum + s.consistency_rate_30d, 0) / allStats.length
    );

    return {
      bestStreak,
      averageConsistency: avgConsistency || 0,
      totalCompletions,
      activeHabitCount: habits.length
    };
  }, [habits, logs, referenceDate]);

  return {
    heatmapData,
    weeklyMetrics,
    categoryBreakdown,
    insights,
    globalStats,
    habits,
    logs
  };
}
