import { format, subDays } from 'date-fns';
import { db } from '../db';
import { Habit, HabitLog } from '../types/habit';
import { isHabitScheduledOnDate } from './habitService';

export async function populateDemoData(): Promise<void> {
  // Clear existing to avoid duplicate conflicts
  await db.habits.clear();
  await db.logs.clear();
  await db.syncQueue.clear();

  const now = new Date();
  const created60DaysAgo = subDays(now, 60).toISOString();

  const demoHabits: Habit[] = [
    {
      id: 'demo_habit_deepwork',
      title: 'Morning Deep Work',
      description: 'Focus for 90 minutes without distraction or social media.',
      category: 'productivity',
      color: '#6366f1',
      icon: 'Brain',
      frequency_type: 'weekdays',
      custom_days: [1, 2, 3, 4, 5],
      target_type: 'numeric',
      target_value: 90,
      unit: 'mins',
      time_of_day: 'morning',
      reminder_time: '08:30',
      archived: false,
      streak_freeze_count: 2,
      created_at: created60DaysAgo,
      updated_at: now.toISOString(),
      sync_status: 'pending'
    },
    {
      id: 'demo_habit_hydration',
      title: 'Hydration Target',
      description: 'Drink at least 8 glasses (2.5L) of water throughout the day.',
      category: 'health',
      color: '#06b6d4',
      icon: 'Droplet',
      frequency_type: 'daily',
      custom_days: [0, 1, 2, 3, 4, 5, 6],
      target_type: 'numeric',
      target_value: 8,
      unit: 'glasses',
      time_of_day: 'anytime',
      reminder_time: '11:00',
      archived: false,
      streak_freeze_count: 3,
      created_at: created60DaysAgo,
      updated_at: now.toISOString(),
      sync_status: 'pending'
    },
    {
      id: 'demo_habit_reading',
      title: 'Read Non-Fiction',
      description: 'Expand knowledge through reading 20 pages of books.',
      category: 'learning',
      color: '#f59e0b',
      icon: 'BookOpen',
      frequency_type: 'daily',
      custom_days: [0, 1, 2, 3, 4, 5, 6],
      target_type: 'numeric',
      target_value: 20,
      unit: 'pages',
      time_of_day: 'evening',
      reminder_time: '20:00',
      archived: false,
      streak_freeze_count: 1,
      created_at: created60DaysAgo,
      updated_at: now.toISOString(),
      sync_status: 'pending'
    },
    {
      id: 'demo_habit_meditation',
      title: 'Mindfulness Meditation',
      description: '10-minute breath awareness meditation session.',
      category: 'mind',
      color: '#8b5cf6',
      icon: 'Sparkles',
      frequency_type: 'daily',
      custom_days: [0, 1, 2, 3, 4, 5, 6],
      target_type: 'boolean',
      target_value: 1,
      unit: '',
      time_of_day: 'morning',
      reminder_time: '07:15',
      archived: false,
      streak_freeze_count: 2,
      created_at: created60DaysAgo,
      updated_at: now.toISOString(),
      sync_status: 'pending'
    },
    {
      id: 'demo_habit_workout',
      title: 'Strength & Conditioning',
      description: 'Full-body resistance training or cardio session.',
      category: 'fitness',
      color: '#10b981',
      icon: 'Dumbbell',
      frequency_type: 'custom',
      custom_days: [1, 3, 5], // Mon, Wed, Fri
      target_type: 'boolean',
      target_value: 1,
      unit: '',
      time_of_day: 'afternoon',
      reminder_time: '17:30',
      archived: false,
      streak_freeze_count: 2,
      created_at: created60DaysAgo,
      updated_at: now.toISOString(),
      sync_status: 'pending'
    },
    {
      id: 'demo_habit_journal',
      title: 'Evening Reflection',
      description: 'Review the day wins, lessons, and top 3 priorities for tomorrow.',
      category: 'personal',
      color: '#ec4899',
      icon: 'PenTool',
      frequency_type: 'daily',
      custom_days: [0, 1, 2, 3, 4, 5, 6],
      target_type: 'boolean',
      target_value: 1,
      unit: '',
      time_of_day: 'evening',
      reminder_time: '21:30',
      archived: false,
      streak_freeze_count: 1,
      created_at: created60DaysAgo,
      updated_at: now.toISOString(),
      sync_status: 'pending'
    }
  ];

  await db.habits.bulkPut(demoHabits);

  // Generate realistic 60-day historical logs with strong recent streaks
  const demoLogs: HabitLog[] = [];

  for (let i = 59; i >= 0; i--) {
    const d = subDays(now, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const isRecent = i <= 14; // Past 2 weeks are especially strong for fire streaks!

    demoHabits.forEach(habit => {
      if (isHabitScheduledOnDate(habit, d)) {
        // High probability of completion for realistic consistency (approx 85% recent, 75% older)
        const randomFactor = Math.random();
        const threshold = isRecent ? 0.90 : 0.78;
        const isDone = randomFactor < threshold;

        // Today is completed for some, pending for others to demonstrate interactive UI
        const isCompleted = i === 0 ? (habit.id === 'demo_habit_meditation' || habit.id === 'demo_habit_hydration') : isDone;
        const curVal = isCompleted 
          ? habit.target_value 
          : (habit.target_type === 'numeric' ? Math.floor(habit.target_value * 0.4) : 0);

        demoLogs.push({
          id: `log_${habit.id}_${dateStr}`,
          habit_id: habit.id,
          date: dateStr,
          completed: isCompleted,
          current_value: curVal,
          completed_at: isCompleted ? d.toISOString() : undefined,
          updated_at: d.toISOString(),
          sync_status: 'pending'
        });
      }
    });
  }

  await db.logs.bulkPut(demoLogs);
}
