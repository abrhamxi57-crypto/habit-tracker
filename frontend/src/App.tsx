import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { HabitFormModal } from './components/habits/HabitFormModal';
import { DashboardPage } from './pages/DashboardPage';
import { HabitsPage } from './pages/HabitsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useHabits } from './hooks/useHabits';
import { usePWA } from './hooks/usePWA';
import { reminderService } from './services/reminderService';
import { authService, User } from './services/authService';
import { AuthModal } from './components/auth/AuthModal';
import { Habit } from './types/habit';
import { format } from 'date-fns';
import { db } from './db';
import { toggleHabitCompletion } from './services/habitService';
import { soundService } from './services/soundService';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsub = authService.onUserChange(u => setUser(u));
    authService.fetchMe();
    return unsub;
  }, []);
  const {
    habits,
    logs,
    habitWithStats,
    scheduledHabits,
    totalCount,
    completedCount,
    completionPercentage,
    saveHabit,
    deleteHabit,
  } = useHabits();

  const {
    isOnline,
    isSyncing,
    isInstalled,
    canInstall,
    promptInstall,
    notificationPermission,
    requestNotifications,
    triggerManualSync,
  } = usePWA();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [inAppReminder, setInAppReminder] = useState<Habit | null>(null);

  useEffect(() => {
    reminderService.registerInAppListener(habit => {
      setInAppReminder(habit);
      setTimeout(() => setInAppReminder(null), 6000);
    });
    reminderService.startReminderWatcher(() => habits);
    return () => reminderService.stopReminderWatcher();
  }, [habits]);

  const handleOpenCreate = () => {
    setHabitToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setHabitToEdit(habit);
    setIsModalOpen(true);
  };

  // Universal toggle: works for any date string
  const handleToggle = async (habit: Habit, dateStr: string) => {
    const res = await toggleHabitCompletion(habit, dateStr);
    if (res.completed) soundService.playCheckmarkSound();
    else soundService.playClickSound();
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        background: '#0f1115',
      }}
    >
      {/* Sidebar (desktop) */}
      <Sidebar user={user} onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Main content area */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 1.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                habits={habits}
                logs={logs}
                onToggle={handleToggle}
                onNewHabit={handleOpenCreate}
                onEditHabit={handleEditHabit}
              />
            }
          />
          <Route
            path="/habits"
            element={
              <HabitsPage
                habitWithStats={habitWithStats}
                onToggle={(habit, val) => handleToggle(habit, format(new Date(), 'yyyy-MM-dd'))}
                onOpenCreateModal={handleOpenCreate}
                onEditHabit={handleEditHabit}
              />
            }
          />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route
            path="/settings"
            element={
              <SettingsPage
                isInstalled={isInstalled}
                canInstall={canInstall}
                onInstall={promptInstall}
                notificationPermission={notificationPermission}
                onRequestNotifications={requestNotifications}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            }
          />
        </Routes>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Modal */}
      <HabitFormModal
        isOpen={isModalOpen}
        habitToEdit={habitToEdit}
        onClose={() => setIsModalOpen(false)}
        onSave={saveHabit}
        onDelete={deleteHabit}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          triggerManualSync();
        }}
      />

      {/* In-app reminder toast */}
      {inAppReminder && (
        <div
          style={{
            position: 'fixed',
            bottom: '5.5rem',
            right: '1rem',
            zIndex: 60,
            maxWidth: 300,
            background: '#21252d',
            border: '1px solid rgba(183,138,247,0.4)',
            borderRadius: '0.875rem',
            padding: '0.875rem 1rem',
            boxShadow: '0 0 20px rgba(183,138,247,0.2)',
            animation: 'slideUp 0.3s ease',
          }}
        >
          <p style={{ margin: '0 0 2px', fontSize: '0.65rem', fontWeight: 700, color: '#b78af7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Reminder
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#f4f4f5' }}>
            {inAppReminder.title}
          </p>
          <button
            onClick={() => setInAppReminder(null)}
            style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', color: '#a0a4aa', cursor: 'pointer', fontSize: 14, padding: 2 }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
