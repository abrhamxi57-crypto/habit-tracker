import { describe, it, expect } from 'vitest';
import { parseISO } from 'date-fns';
import { isHabitScheduledOnDate, calculateStreakStats } from '../services/habitService';
import { Habit, HabitLog } from '../types/habit';

describe('Habit Scheduling & Streak Logic', () => {
  const baseHabit: Habit = {
    id: 'habit_test_1',
    title: 'Test Habit',
    category: 'productivity',
    color: '#6366f1',
    icon: 'Sparkles',
    frequency_type: 'daily',
    custom_days: [1, 2, 3, 4, 5],
    target_type: 'boolean',
    target_value: 1,
    time_of_day: 'morning',
    archived: false,
    streak_freeze_count: 1,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    sync_status: 'synced'
  };

  it('correctly identifies scheduled days for daily habits', () => {
    const monday = parseISO('2026-10-19'); // Monday
    const sunday = parseISO('2026-10-18'); // Sunday
    expect(isHabitScheduledOnDate(baseHabit, monday)).toBe(true);
    expect(isHabitScheduledOnDate(baseHabit, sunday)).toBe(true);
  });

  it('correctly filters weekdays vs weekends', () => {
    const weekdayHabit: Habit = { ...baseHabit, frequency_type: 'weekdays' };
    const monday = parseISO('2026-10-19');
    const sunday = parseISO('2026-10-18');

    expect(isHabitScheduledOnDate(weekdayHabit, monday)).toBe(true);
    expect(isHabitScheduledOnDate(weekdayHabit, sunday)).toBe(false);
  });

  it('calculates current streak and longest streak accurately', () => {
    const today = parseISO('2026-10-23'); // Reference date
    const logs: HabitLog[] = [
      {
        id: 'l1',
        habit_id: 'habit_test_1',
        date: '2026-10-23',
        completed: true,
        current_value: 1,
        updated_at: '2026-10-23T08:00:00Z',
        sync_status: 'synced'
      },
      {
        id: 'l2',
        habit_id: 'habit_test_1',
        date: '2026-10-22',
        completed: true,
        current_value: 1,
        updated_at: '2026-10-22T08:00:00Z',
        sync_status: 'synced'
      },
      {
        id: 'l3',
        habit_id: 'habit_test_1',
        date: '2026-10-21',
        completed: true,
        current_value: 1,
        updated_at: '2026-10-21T08:00:00Z',
        sync_status: 'synced'
      }
    ];

    const stats = calculateStreakStats(baseHabit, logs, today);
    expect(stats.current_streak).toBe(3);
    expect(stats.longest_streak).toBe(3);
    expect(stats.completed_today).toBe(true);
  });

  it('does not break streaks on unscheduled rest days for custom schedules', () => {
    const mwfHabit: Habit = {
      ...baseHabit,
      frequency_type: 'custom',
      custom_days: [1, 3, 5] // Mon, Wed, Fri
    };

    // If today is Friday (Day 5) and Wed (Day 3) and Mon (Day 1) were done,
    // Tuesday and Thursday rest days must not break the streak!
    const friday = parseISO('2026-10-23');
    const logs: HabitLog[] = [
      {
        id: 'l1',
        habit_id: 'habit_test_1',
        date: '2026-10-23', // Friday
        completed: true,
        current_value: 1,
        updated_at: '2026-10-23T08:00:00Z',
        sync_status: 'synced'
      },
      {
        id: 'l2',
        habit_id: 'habit_test_1',
        date: '2026-10-21', // Wednesday
        completed: true,
        current_value: 1,
        updated_at: '2026-10-21T08:00:00Z',
        sync_status: 'synced'
      },
      {
        id: 'l3',
        habit_id: 'habit_test_1',
        date: '2026-10-19', // Monday
        completed: true,
        current_value: 1,
        updated_at: '2026-10-19T08:00:00Z',
        sync_status: 'synced'
      }
    ];

    const stats = calculateStreakStats(mwfHabit, logs, friday);
    expect(stats.current_streak).toBe(3);
  });
});
