export type HabitCategory = 
  | 'health' 
  | 'fitness' 
  | 'mind' 
  | 'productivity' 
  | 'learning' 
  | 'personal';

export type FrequencyType = 
  | 'daily' 
  | 'weekdays' 
  | 'weekends' 
  | 'custom'
  | 'weekly_target';

export type TimeOfDay = 
  | 'anytime' 
  | 'morning' 
  | 'afternoon' 
  | 'evening';

export type TargetType = 'boolean' | 'numeric';

export type SyncStatus = 'synced' | 'pending';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: HabitCategory;
  color: string;
  icon: string;
  frequency_type: FrequencyType;
  custom_days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  weekly_target_days?: number; // e.g., 3 days a week
  target_type: TargetType;
  target_value: number; // 1 for boolean, N for numeric
  unit?: string; // 'pages', 'mins', 'ml', 'reps'
  time_of_day: TimeOfDay;
  reminder_time?: string | null; // "08:30"
  archived: boolean;
  streak_freeze_count: number; // Emergency streak freeze shields
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  current_value: number;
  notes?: string;
  completed_at?: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface StreakStats {
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  completed_today: boolean;
  is_scheduled_today: boolean;
  consistency_rate_7d: number;
  consistency_rate_30d: number;
  consistency_rate_90d: number;
  streak_status: 'spark' | 'flame' | 'blaze' | 'inferno' | 'supernova' | 'idle';
}

export interface DailySummary {
  date: string;
  total_scheduled: number;
  total_completed: number;
  percentage: number;
}

export interface HabitInsight {
  id: string;
  type: 'praise' | 'warning' | 'recommendation' | 'pattern';
  habit_id?: string;
  habit_title?: string;
  title: string;
  description: string;
  metric?: string;
  importance: 'high' | 'medium' | 'low';
}

export interface SyncAuditRecord {
  id: string;
  entity_type: 'habit' | 'log';
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  payload: string;
  timestamp: string;
}
