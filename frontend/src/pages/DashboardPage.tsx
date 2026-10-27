import React, { useState } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  isSameDay,
} from 'date-fns';
import { Habit, HabitLog } from '../types/habit';
import { StreakStats } from '../types/habit';
import { calculateStreakStats } from '../services/habitService';
import { generateHeatmapData } from '../services/analyticsService';
import { ActivityHeatmap } from '../components/dashboard/ActivityHeatmap';
import { CalendarSection } from '../components/dashboard/CalendarSection';
import { HabitListRow } from '../components/dashboard/HabitListRow';
import { Sparkles, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Table } from 'lucide-react';
import { populateDemoData } from '../services/demoDataService';

interface DashboardPageProps {
  habits: Habit[];
  logs: HabitLog[];
  onToggle: (habit: Habit, dateStr: string) => void;
  onNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  habits,
  logs,
  onToggle,
  onNewHabit,
  onEditHabit,
}) => {
  const today = new Date();
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'matrix' | 'calendar'>('matrix');

  // Compute active week days Mon → Sun
  const currentBaseDate = weekOffset === 0 ? today : addWeeks(today, weekOffset);
  const weekStart = startOfWeek(currentBaseDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Compute global stats
  const activeHabits = habits.filter(h => !h.archived);
  const allStats = activeHabits.map(h => calculateStreakStats(h, logs, today));
  const totalCompletions = logs.filter(l => l.completed).length;
  const bestStreak = Math.max(0, ...allStats.map(s => s.longest_streak));
  const avgConsistency = allStats.length
    ? Math.round(allStats.reduce((s, x) => s + x.consistency_rate_30d, 0) / allStats.length)
    : 0;

  // Heatmap data
  const heatmapData = generateHeatmapData(activeHabits, logs, 365, today);

  const handleLoadDemo = async () => {
    await populateDemoData();
    window.location.reload();
  };

  const statsMap = new Map<string, StreakStats>();
  allStats.forEach(s => statsMap.set(s.habit_id, s));

  const monthYearLabel = format(weekDays[3] || currentBaseDate, 'MMMM yyyy');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        paddingBottom: '5rem',
      }}
    >
      {/* Page heading */}
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#f4f4f5',
            letterSpacing: '-0.02em',
          }}
        >
          Dashboard
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#8e939e' }}>
          {format(today, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* ── Activity heatmap panel (with 83% Consistency & 740 Total Tasks) ── */}
      <ActivityHeatmap
        data={heatmapData}
        consistencyRate={avgConsistency}
        totalTasks={totalCompletions}
        longestStreak={bestStreak}
      />

      {/* ── Main Habit Matrix / Calendar Section (matching screenshot) ── */}
      <div className="flex flex-col gap-3">
        {/* Section Header: Month/Year on left, Controls & + New Habit on right */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#f4f4f5',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {monthYearLabel}
            </h2>

            {/* Week navigation arrows */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                title="Previous Week"
                style={{
                  padding: '0.35rem',
                  borderRadius: '0.4rem',
                  border: '1px solid #232730',
                  background: '#13161a',
                  color: '#8e939e',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={14} />
              </button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.4rem',
                    border: '1px solid #232730',
                    background: '#13161a',
                    color: '#b78af7',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Today
                </button>
              )}
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                title="Next Week"
                style={{
                  padding: '0.35rem',
                  borderRadius: '0.4rem',
                  border: '1px solid #232730',
                  background: '#13161a',
                  color: '#8e939e',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div
              style={{
                display: 'flex',
                background: '#13161a',
                border: '1px solid #232730',
                borderRadius: '0.5rem',
                padding: '2px',
              }}
            >
              <button
                onClick={() => setViewMode('matrix')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '0.3rem 0.65rem',
                  borderRadius: '0.35rem',
                  border: 'none',
                  background: viewMode === 'matrix' ? '#1f232b' : 'transparent',
                  color: viewMode === 'matrix' ? '#f4f4f5' : '#8e939e',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Table size={13} />
                <span>Matrix</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '0.3rem 0.65rem',
                  borderRadius: '0.35rem',
                  border: 'none',
                  background: viewMode === 'calendar' ? '#1f232b' : 'transparent',
                  color: viewMode === 'calendar' ? '#f4f4f5' : '#8e939e',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <CalendarIcon size={13} />
                <span>Calendar</span>
              </button>
            </div>

            {/* + New Habit Pill Button (Matching Screenshot) */}
            <button
              onClick={onNewHabit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.45rem 1.1rem',
                borderRadius: '9999px',
                background: '#b78af7',
                border: 'none',
                color: '#0f1115',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(183,138,247,0.3)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Plus size={15} strokeWidth={2.6} />
              <span>New Habit</span>
            </button>
          </div>
        </div>

        {/* View Mode: Calendar View vs Full-width Weekly Matrix View */}
        {viewMode === 'calendar' ? (
          <CalendarSection habits={habits} logs={logs} onNewHabit={onNewHabit} />
        ) : (
          <div className="hf-panel" style={{ overflow: 'hidden', background: '#1a1d22' }}>
            {/* Table Header: Habit column + 7 Day Columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(200px, 1.4fr) repeat(7, minmax(44px, 1fr))',
                alignItems: 'center',
                borderBottom: '1px solid #232730',
                padding: '0.75rem 0.75rem',
                background: '#13161a',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8e939e', paddingLeft: 6 }}>
                HABIT
              </div>

              {/* 7 Day Headers (MON 29, TUE 30 ...) */}
              {weekDays.map(d => {
                const isToday = isSameDay(d, today);
                return (
                  <div
                    key={d.toISOString()}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: isToday ? '#b78af7' : '#8e939e',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {format(d, 'EEE').toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        color: isToday ? '#0f1115' : '#f4f4f5',
                        background: isToday ? '#b78af7' : 'transparent',
                        borderRadius: isToday ? '50%' : 0,
                        width: isToday ? 24 : 'auto',
                        height: isToday ? 24 : 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {format(d, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Table Body */}
            {activeHabits.length === 0 ? (
              <div
                style={{
                  padding: '3.5rem 1rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <Sparkles size={32} style={{ color: '#b78af7', opacity: 0.6 }} />
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#8e939e' }}>
                  No habits added yet. Click "+ New Habit" or load demo data to view habits!
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={onNewHabit}
                    style={{
                      padding: '0.45rem 1.1rem',
                      borderRadius: '9999px',
                      background: '#b78af7',
                      border: 'none',
                      color: '#0f1115',
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    + New Habit
                  </button>
                  <button
                    onClick={handleLoadDemo}
                    style={{
                      padding: '0.45rem 1.1rem',
                      borderRadius: '9999px',
                      background: '#21252d',
                      border: '1px solid #2a2f38',
                      color: '#f4f4f5',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    Load Demo Data
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {activeHabits.map(habit => {
                  const stats = statsMap.get(habit.id) || {
                    habit_id: habit.id,
                    current_streak: 0,
                    longest_streak: 0,
                    total_completions: 0,
                    completed_today: false,
                    is_scheduled_today: false,
                    consistency_rate_7d: 0,
                    consistency_rate_30d: 0,
                    consistency_rate_90d: 0,
                    streak_status: 'idle' as const,
                  };
                  return (
                    <HabitListRow
                      key={habit.id}
                      habit={habit}
                      stats={stats}
                      logs={logs}
                      weekDays={weekDays}
                      onToggle={(h, dateStr) => onToggle(h, dateStr)}
                      onEdit={onEditHabit}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

