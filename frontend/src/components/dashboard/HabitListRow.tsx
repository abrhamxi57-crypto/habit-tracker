import React from 'react';
import {
  Brain,
  Droplet,
  BookOpen,
  Dumbbell,
  PenTool,
  Flame,
  Sparkles,
  Moon,
  Heart,
  Zap,
} from 'lucide-react';
import { Habit, HabitLog, StreakStats } from '../../types/habit';
import { isHabitScheduledOnDate } from '../../services/habitService';
import { format } from 'date-fns';

interface HabitListRowProps {
  habit: Habit;
  stats: StreakStats;
  logs: HabitLog[];
  /** Days to show as checkbox columns (last 7 days backwards or specific week) */
  weekDays: Date[];
  onToggle: (habit: Habit, dateStr: string) => void;
  onEdit: (habit: Habit) => void;
}

function habitIcon(name: string) {
  const cls = 'flex-shrink-0';
  const sz = 13;
  switch (name.toLowerCase()) {
    case 'brain':        return <Brain size={sz} className={cls} />;
    case 'droplet':      return <Droplet size={sz} className={cls} />;
    case 'bookopen':
    case 'book':         return <BookOpen size={sz} className={cls} />;
    case 'dumbbell':     return <Dumbbell size={sz} className={cls} />;
    case 'pentool':      return <PenTool size={sz} className={cls} />;
    case 'flame':        return <Flame size={sz} className={cls} />;
    case 'moon':         return <Moon size={sz} className={cls} />;
    case 'heart':        return <Heart size={sz} className={cls} />;
    case 'zap':          return <Zap size={sz} className={cls} />;
    default:             return <Sparkles size={sz} className={cls} />;
  }
}

export const HabitListRow: React.FC<HabitListRowProps> = ({
  habit,
  stats,
  logs,
  weekDays,
  onToggle,
  onEdit,
}) => {
  // Build log lookup
  const logMap = new Map<string, HabitLog>();
  logs.forEach(l => {
    if (l.habit_id === habit.id) logMap.set(l.date, l);
  });

  // Progress label (e.g. 5/5 or completions/target or streak)
  const scheduledCount = weekDays.filter(d => isHabitScheduledOnDate(habit, d)).length;
  const completedCount = weekDays.filter(d => {
    const l = logMap.get(format(d, 'yyyy-MM-dd'));
    return Boolean(l?.completed);
  }).length;
  const progressLabel = habit.target_type === 'numeric' && habit.target_value
    ? `${completedCount}/${scheduledCount || habit.target_value}`
    : `${completedCount}/${scheduledCount || 7}`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 1.4fr) repeat(7, minmax(44px, 1fr))',
        alignItems: 'center',
        minHeight: 52,
        borderBottom: '1px solid #232730',
        padding: '0.4rem 0.75rem',
        transition: 'background 0.15s',
      }}
      className="hover:bg-[#1f232b]/40"
    >
      {/* Habit identity */}
      <div
        onClick={() => onEdit(habit)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 0,
          cursor: 'pointer',
          paddingRight: 8,
        }}
      >
        {/* Color icon square */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: habit.color || '#9b6df4',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 2px 8px ${habit.color ? `${habit.color}40` : 'rgba(155,109,244,0.3)'}`,
          }}
        >
          {habitIcon(habit.icon)}
        </div>

        {/* Name and sub-target */}
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#f4f4f5',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {habit.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span
              style={{
                fontSize: '0.6875rem',
                color: '#8e939e',
                fontWeight: 600,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {progressLabel}
            </span>
            {stats.current_streak > 0 && (
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.35rem',
                  borderRadius: 4,
                  background: 'rgba(183,138,247,0.12)',
                  color: '#b78af7',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                🔥 {stats.current_streak}d
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 7 Weekly Day Checkbox Columns */}
      {weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const isScheduled = isHabitScheduledOnDate(habit, day);
        const log = logMap.get(dateStr);
        const isDone = Boolean(log?.completed);

        return (
          <div
            key={dateStr}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem 0',
            }}
          >
            <button
              onClick={() => isScheduled && onToggle(habit, dateStr)}
              title={format(day, 'EEE, MMM d')}
              className={`habit-check ${isDone ? 'done' : ''} ${!isScheduled ? 'not-scheduled' : ''}`}
              style={{
                cursor: isScheduled ? 'pointer' : 'default',
                width: 26,
                height: 26,
                borderRadius: 7,
              }}
            >
              {isDone && (
                <svg width="12" height="10" viewBox="0 0 11 9" fill="none">
                  <path
                    d="M1 4.5L4 7.5L10 1.5"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
