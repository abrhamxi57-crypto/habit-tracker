import { format } from 'date-fns';
import { Habit } from '../types/habit';
import { soundService } from './soundService';

class ReminderService {
  private checkedReminders: Set<string> = new Set();
  private intervalId: number | null = null;
  private onInAppReminderCallback: ((habit: Habit) => void) | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }

  public registerInAppListener(cb: (habit: Habit) => void) {
    this.onInAppReminderCallback = cb;
  }

  /**
   * Start checking scheduled reminders periodically (every 30 seconds)
   */
  public startReminderWatcher(getHabits: () => Habit[]) {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      this.checkDueReminders(getHabits());
    }, 30000);

    // Run first check immediately
    this.checkDueReminders(getHabits());
  }

  public stopReminderWatcher() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkDueReminders(habits: Habit[]) {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const todayStr = format(now, 'yyyy-MM-dd');

    habits.forEach(habit => {
      if (!habit.archived && habit.reminder_time) {
        // Compare HH:mm
        if (habit.reminder_time === currentTime) {
          const reminderKey = `${todayStr}_${habit.id}_${currentTime}`;
          if (!this.checkedReminders.has(reminderKey)) {
            this.checkedReminders.add(reminderKey);
            this.triggerReminder(habit);
          }
        }
      }
    });
  }

  /**
   * Trigger both browser system notification and in-app fallback
   */
  public triggerReminder(habit: Habit) {
    soundService.playCheckmarkSound();

    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const title = `HabitFlow: Time for ${habit.title}!`;
        const options: NotificationOptions = {
          body: `Keep your streak alive! ${habit.description || 'Take a moment to complete your habit now.'}`,
          icon: '/icon-192.svg',
          badge: '/favicon.svg',
          tag: `habit_${habit.id}`,
        };

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, options);
          });
        } else {
          new Notification(title, options);
        }
      } catch (err) {
        console.warn('System notification failed, falling back to in-app notification', err);
      }
    }

    // Always notify the in-app listener as well
    if (this.onInAppReminderCallback) {
      this.onInAppReminderCallback(habit);
    }
  }
}

export const reminderService = new ReminderService();
