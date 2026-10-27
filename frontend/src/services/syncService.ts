import { db, getSettings, updateSettings } from '../db';
import { Habit, HabitLog, SyncAuditRecord } from '../types/habit';
import { authService } from './authService';

export interface SyncResponse {
  success: boolean;
  server_timestamp: string;
  applied_count: number;
  server_habits: Habit[];
  server_logs: HabitLog[];
  conflicts_resolved?: number;
}

class SyncService {
  private isSyncing = false;
  private onlineStatus = typeof window !== 'undefined' ? navigator.onLine : true;
  private statusListeners: Array<(online: boolean, syncing: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.onlineStatus = true;
        this.notifyListeners();
        this.syncNow();
      });
      window.addEventListener('offline', () => {
        this.onlineStatus = false;
        this.notifyListeners();
      });
    }
  }

  public isOnline(): boolean {
    return this.onlineStatus;
  }

  public onStatusChange(fn: (online: boolean, syncing: boolean) => void) {
    this.statusListeners.push(fn);
    fn(this.onlineStatus, this.isSyncing);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== fn);
    };
  }

  private notifyListeners() {
    this.statusListeners.forEach(fn => fn(this.onlineStatus, this.isSyncing));
  }

  /**
   * Main synchronization routine
   */
  public async syncNow(): Promise<SyncResponse | null> {
    if (this.isSyncing) return null;
    if (!this.onlineStatus) {
      return null;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const settings = await getSettings();
      const queuedMutations = await db.syncQueue.toArray();

      // Collect all local habits and logs that have pending status
      const localHabits = await db.habits.where('sync_status').equals('pending').toArray();
      const localLogs = await db.logs.where('sync_status').equals('pending').toArray();

      const payload = {
        last_sync_timestamp: settings.last_sync_timestamp,
        mutations: queuedMutations,
        habits: localHabits,
        logs: localLogs
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader(),
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Sync server responded with status ${res.status}`);
      }

      const data: SyncResponse = await res.json();

      if (data.success) {
        // Apply server habits to Dexie
        if (data.server_habits && data.server_habits.length > 0) {
          for (const sHabit of data.server_habits) {
            const local = await db.habits.get(sHabit.id);
            // Last-Write-Wins: if local is older or doesn't exist, apply server
            if (!local || new Date(sHabit.updated_at) >= new Date(local.updated_at)) {
              await db.habits.put({ ...sHabit, sync_status: 'synced' });
            }
          }
        }

        // Apply server logs to Dexie
        if (data.server_logs && data.server_logs.length > 0) {
          for (const sLog of data.server_logs) {
            const local = await db.logs.get(sLog.id);
            if (!local || new Date(sLog.updated_at) >= new Date(local.updated_at)) {
              await db.logs.put({ ...sLog, sync_status: 'synced' });
            }
          }
        }

        // Mark local pending records as synced
        for (const h of localHabits) {
          await db.habits.update(h.id, { sync_status: 'synced' });
        }
        for (const l of localLogs) {
          await db.logs.update(l.id, { sync_status: 'synced' });
        }

        // Clear queued audits
        if (queuedMutations.length > 0) {
          const ids = queuedMutations.map(m => m.id);
          await db.syncQueue.bulkDelete(ids);
        }

        // Update last sync time
        await updateSettings({ last_sync_timestamp: data.server_timestamp });
      }

      return data;
    } catch (err) {
      // Safe offline fallback: Keep data in Dexie, no loss
      console.warn('Sync server offline or unreachable. Operating in local-first mode:', err);
      return null;
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }
}

export const syncService = new SyncService();
