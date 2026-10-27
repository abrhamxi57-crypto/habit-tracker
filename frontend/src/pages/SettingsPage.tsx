import React, { useState, useEffect } from 'react';
import { Download, Bell, Volume2, VolumeX, Database, RefreshCw, Sparkles, Trash2, Upload, FileDown, User as UserIcon, LogOut, LogIn, Shield } from 'lucide-react';
import { db, getSettings, updateSettings, UserSettings } from '../db';
import { soundService } from '../services/soundService';
import { reminderService } from '../services/reminderService';
import { populateDemoData } from '../services/demoDataService';
import { syncService } from '../services/syncService';
import { authService, User } from '../services/authService';

interface SettingsPageProps {
  isInstalled: boolean;
  canInstall: boolean;
  onInstall: () => void;
  notificationPermission: NotificationPermission | 'unsupported';
  onRequestNotifications: () => void;
  onOpenAuth: () => void;
}

const sectionStyle: React.CSSProperties = {
  background: '#1a1d22', border: '1px solid #2a2f38', borderRadius: '0.875rem', padding: '1.25rem',
  display: 'flex', flexDirection: 'column', gap: '1rem',
};

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0.75rem 0.875rem',
  background: '#21252d', border: '1px solid #2a2f38', borderRadius: '0.625rem',
};

const btnPrimary: React.CSSProperties = {
  padding: '0.375rem 0.875rem', borderRadius: '0.4rem', border: 'none',
  background: '#b78af7', color: '#0f1115', fontWeight: 700, fontSize: '0.75rem',
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '0.375rem 0.875rem', borderRadius: '0.4rem',
  border: '1px solid #2a2f38', background: '#21252d',
  color: '#f4f4f5', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
};

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isInstalled, canInstall, onInstall, notificationPermission, onRequestNotifications, onOpenAuth,
}) => {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [stats, setStats] = useState({ habits: 0, logs: 0 });

  useEffect(() => {
    load();
    const unsub = authService.onUserChange(u => setUser(u));
    authService.fetchMe();
    return unsub;
  }, []);

  const load = async () => {
    const s = await getSettings();
    setSettings(s);
    soundService.setEnabled(s.sound_enabled);
    setStats({ habits: await db.habits.count(), logs: await db.logs.count() });
  };

  const toggleSound = async () => {
    if (!settings) return;
    const updated = await updateSettings({ sound_enabled: !settings.sound_enabled });
    setSettings(updated);
    soundService.setEnabled(updated.sound_enabled);
    if (updated.sound_enabled) soundService.playCheckmarkSound();
  };

  const handleSync = async () => {
    setSyncMsg('Syncing…');
    const res = await syncService.syncNow();
    setSyncMsg(res?.success ? `Synced — ${res.applied_count} mutations applied` : 'Server unreachable. Local data preserved.');
    setTimeout(() => setSyncMsg(null), 4000);
  };

  const handleExport = async () => {
    const data = { app: 'HabitFlow', exported_at: new Date().toISOString(), habits: await db.habits.toArray(), logs: await db.logs.toArray() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HabitFlow_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.habits) await db.habits.bulkPut(parsed.habits);
      if (parsed.logs) await db.logs.bulkPut(parsed.logs);
      window.location.reload();
    } catch { alert('Invalid backup file.'); }
  };

  const handleDemo = async () => {
    if (window.confirm('Populate 60 days of realistic demo data?')) {
      await populateDemoData(); window.location.reload();
    }
  };

  const handleClear = async () => {
    if (window.confirm('Delete all local habits and logs?')) {
      await db.habits.clear(); await db.logs.clear(); await db.syncQueue.clear();
      window.location.reload();
    }
  };

  const heading = (text: string) => (
    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>{text}</p>
  );

  const subtext = (text: string) => (
    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#a0a4aa' }}>{text}</p>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '5rem', maxWidth: 640 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em' }}>Settings</h1>
        {subtext('PWA install, reminders, sync, and data management')}
      </div>

      {/* Account & Profile */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserIcon size={15} style={{ color: '#b78af7' }} />
          {heading('Account & Profile')}
        </div>
        <div style={rowStyle}>
          <div>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#f4f4f5' }}>
              {user ? user.display_name : 'Guest Workspace'}
            </p>
            {subtext(user ? `${user.email} · Timezone: ${user.timezone}` : 'Local offline data. Sign in to synchronize habits.')}
          </div>
          {user ? (
            <button
              onClick={() => authService.logout()}
              style={{ ...btnSecondary, display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <LogOut size={12} /> Sign Out
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LogIn size={12} /> Sign In
            </button>
          )}
        </div>
      </div>

      {/* PWA */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Download size={15} style={{ color: '#b78af7' }} />
          {heading('Progressive Web App')}
        </div>
        <div style={rowStyle}>
          <div>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#f4f4f5' }}>Installation Status</p>
            {subtext(isInstalled ? '✅ Installed (Standalone Mode)' : 'Running in browser')}
          </div>
          {canInstall && !isInstalled && (
            <button onClick={onInstall} style={btnPrimary}>Install App</button>
          )}
        </div>
      </div>

      {/* Reminders */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={15} style={{ color: '#b78af7' }} />
          {heading('Reminders & Audio')}
        </div>
        <div style={rowStyle}>
          <div>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#f4f4f5' }}>Browser Notifications</p>
            {subtext(`Status: ${notificationPermission}`)}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {notificationPermission !== 'granted' && (
              <button onClick={onRequestNotifications} style={btnPrimary}>Enable</button>
            )}
            <button
              onClick={() => reminderService.triggerReminder({ id: 'test', title: 'Test Reminder', description: 'Reminders are working!', category: 'productivity', color: '#b78af7', icon: 'Sparkles', frequency_type: 'daily', custom_days: [], target_type: 'boolean', target_value: 1, time_of_day: 'anytime', archived: false, streak_freeze_count: 0, created_at: '', updated_at: '', sync_status: 'synced' })}
              style={btnSecondary}
            >
              Test
            </button>
          </div>
        </div>
        <div style={rowStyle}>
          <div>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#f4f4f5' }}>Sound Effects</p>
            {subtext('Chimes on completion and milestone fanfares')}
          </div>
          <button
            onClick={toggleSound}
            style={{
              ...btnSecondary,
              border: `1px solid ${settings?.sound_enabled ? '#b78af7' : '#2a2f38'}`,
              color: settings?.sound_enabled ? '#b78af7' : '#a0a4aa',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {settings?.sound_enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {settings?.sound_enabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Sync */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={15} style={{ color: '#b78af7' }} />
          {heading('Offline Storage & Sync')}
        </div>
        <div style={rowStyle}>
          <div>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#f4f4f5' }}>IndexedDB Local Store</p>
            {subtext(`${stats.habits} habits · ${stats.logs} logs stored locally`)}
          </div>
          <button onClick={handleSync} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} />Sync
          </button>
        </div>
        {syncMsg && (
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#b78af7', background: 'rgba(183,138,247,0.08)', border: '1px solid rgba(183,138,247,0.2)', borderRadius: '0.4rem', padding: '0.5rem 0.75rem' }}>
            {syncMsg}
          </p>
        )}
      </div>

      {/* Data management */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={15} style={{ color: '#b78af7' }} />
          {heading('Data Management')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <button onClick={handleDemo} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.625rem' }}>
            <Sparkles size={13} style={{ color: '#b78af7' }} />Load Demo Data
          </button>
          <button onClick={handleExport} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.625rem' }}>
            <FileDown size={13} />Export JSON
          </button>
          <label style={{ ...btnSecondary as object, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.625rem', cursor: 'pointer' } as React.CSSProperties}>
            <Upload size={13} />Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={handleClear}
            style={{ ...btnSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.625rem', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            <Trash2 size={13} />Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
