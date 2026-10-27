import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  addDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Habit, HabitLog } from '../../types/habit';
import { isHabitScheduledOnDate } from '../../services/habitService';

interface CalendarSectionProps {
  habits: Habit[];
  logs: HabitLog[];
  onNewHabit: () => void;
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  habits,
  logs,
  onNewHabit,
}) => {
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const today = new Date();

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Padding: what day-of-week does month start on (Mon=0 … Sun=6)?
  const startDow = (getDay(monthStart) + 6) % 7; // convert Sun-first to Mon-first
  const leadingBlanks = Array.from({ length: startDow });

  // Log lookup: `habitId_dateStr`
  const logMap = new Map<string, HabitLog>();
  logs.forEach(l => logMap.set(`${l.habit_id}_${l.date}`, l));

  const activeHabits = habits.filter(h => !h.archived);

  return (
    <div className="hf-panel p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f4f4f5', margin: 0 }}>
            {format(viewDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              style={{
                padding: '0.3rem',
                borderRadius: '0.4rem',
                border: '1px solid #2a2f38',
                background: 'transparent',
                color: '#a0a4aa',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              style={{
                padding: '0.3rem',
                borderRadius: '0.4rem',
                border: '1px solid #2a2f38',
                background: 'transparent',
                color: '#a0a4aa',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <button
          onClick={onNewHabit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.375rem 0.875rem',
            borderRadius: '0.5rem',
            background: '#b78af7',
            border: 'none',
            color: '#0f1115',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={13} />
          New Habit
        </button>
      </div>

      {/* Day-of-week labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {DOW_LABELS.map(d => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#a0a4aa',
              padding: '0.25rem 0',
              letterSpacing: '0.05em',
            }}
          >
            {d.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {/* Leading blanks */}
        {leadingBlanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {/* Actual days */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isToday = isSameDay(day, today);
          const isFuture = day > today;

          // Per-habit completion for this day
          const scheduledHabits = activeHabits.filter(h => isHabitScheduledOnDate(h, day));
          const completedHabits = scheduledHabits.filter(h => {
            const log = logMap.get(`${h.id}_${dateStr}`);
            return log?.completed;
          });

          const allDone = scheduledHabits.length > 0 && completedHabits.length === scheduledHabits.length;
          const noneDone = completedHabits.length === 0;

          return (
            <div
              key={dateStr}
              style={{
                padding: '0.375rem 0.25rem 0.3rem',
                borderRadius: '0.5rem',
                background: isToday ? 'rgba(183,138,247,0.1)' : 'transparent',
                border: isToday ? '1px solid rgba(183,138,247,0.3)' : '1px solid transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                opacity: isFuture ? 0.45 : 1,
              }}
            >
              {/* Date number */}
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: isToday ? 800 : 500,
                  color: isToday ? '#b78af7' : '#f4f4f5',
                  lineHeight: 1,
                }}
              >
                {format(day, 'd')}
              </span>

              {/* Habit completion mini blocks */}
              {scheduledHabits.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    justifyContent: 'center',
                    maxWidth: 40,
                  }}
                >
                  {scheduledHabits.slice(0, 6).map(h => {
                    const log = logMap.get(`${h.id}_${dateStr}`);
                    const done = log?.completed;
                    return (
                      <div
                        key={h.id}
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 2,
                          background: done
                            ? '#b78af7'
                            : isFuture
                            ? 'transparent'
                            : '#2a2f38',
                          border: done ? 'none' : '1px solid #2a2f38',
                          boxShadow: done ? '0 0 4px rgba(183,138,247,0.5)' : 'none',
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
