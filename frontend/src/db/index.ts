import Dexie, { Table } from 'dexie';
import { Habit, HabitLog, SyncAuditRecord } from '../types/habit';

export interface UserSettings {
  id: string;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  theme: string;
  last_sync_timestamp: string | null;
  grace_freezes_left: number;
}

export class HabitFlowDatabase extends Dexie {
  habits!: Table<Habit, string>;
  logs!: Table<HabitLog, string>;
  syncQueue!: Table<SyncAuditRecord, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('HabitFlowDB');

    this.version(1).stores({
      habits: 'id, category, frequency_type, time_of_day, archived, sync_status, updated_at',
      logs: 'id, habit_id, date, [habit_id+date], completed, sync_status, updated_at',
      syncQueue: 'id, entity_type, entity_id, action, timestamp',
      settings: 'id'
    });
  }
}

export const db = new HabitFlowDatabase();

// Initialize default settings if not exists
export async function getSettings(): Promise<UserSettings> {
  const settings = await db.settings.get('default');
  if (settings) return settings;

  const defaultSettings: UserSettings = {
    id: 'default',
    sound_enabled: true,
    notifications_enabled: false,
    theme: 'dark',
    last_sync_timestamp: null,
    grace_freezes_left: 3
  };

  await db.settings.put(defaultSettings);
  return defaultSettings;
}

export async function updateSettings(partial: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await db.settings.put(updated);
  return updated;
}
