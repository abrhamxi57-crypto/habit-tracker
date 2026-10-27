import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Habit, HabitCategory } from '../types/habit';
import { HabitListRow } from '../components/dashboard/HabitListRow';
import { format, startOfWeek, addDays } from 'date-fns';

interface HabitsPageProps {
  habitWithStats: Array<{
    habit: Habit;
    stats: any;
    isCompleted: boolean;
    currentValue: number;
  }>;
  onToggle: (habit: Habit, val?: number) => void;
  onOpenCreateModal: () => void;
  onEditHabit: (habit: Habit) => void;
}

const CATEGORIES: Array<{ key: HabitCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'health', label: 'Health' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'mind', label: 'Mind' },
  { key: 'learning', label: 'Learning' },
  { key: 'personal', label: 'Personal' },
];

export const HabitsPage: React.FC<HabitsPageProps> = ({
  habitWithStats,
  onToggle,
  onOpenCreateModal,
  onEditHabit,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<HabitCategory | 'all'>('all');

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filtered = habitWithStats.filter(item => {
    const matchSearch = item.habit.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || item.habit.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em' }}>
            All Habits
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#a0a4aa' }}>
            Manage, search, and filter your habit systems
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.4rem 0.875rem',
            borderRadius: '0.4rem', border: 'none',
            background: '#b78af7', color: '#0f1115',
            fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
          }}
        >
          <Plus size={14} />New Habit
        </button>
      </div>

      {/* Search + Category filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative', maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a0a4aa' }} />
          <input
            type="text"
            placeholder="Search habits…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '0.5rem', border: '1px solid #2a2f38',
              background: '#1a1d22', color: '#f4f4f5',
              fontSize: '0.8125rem', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: 999,
                border: `1px solid ${category === c.key ? '#b78af7' : '#2a2f38'}`,
                background: category === c.key ? 'rgba(183,138,247,0.15)' : '#1a1d22',
                color: category === c.key ? '#d7c2ff' : '#a0a4aa',
                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Habit table */}
      <div className="hf-panel" style={{ overflow: 'hidden' }}>
        {/* Column header */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #2a2f38', padding: '0.625rem 0.75rem' }}>
          <div style={{ flex: 1, fontSize: '0.65rem', fontWeight: 700, color: '#a0a4aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Habit
          </div>
          <div style={{ display: 'flex', gap: 4, paddingRight: 12 }}>
            {weekDays.map(d => (
              <div key={d.toISOString()} style={{ width: 22, textAlign: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#a0a4aa', letterSpacing: '0.04em' }}>
                {format(d, 'EEE').slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#a0a4aa', fontSize: '0.8125rem' }}>
            No habits found.
          </div>
        ) : (
          filtered.map(item => (
            <HabitListRow
              key={item.habit.id}
              habit={item.habit}
              stats={item.stats}
              logs={[]}
              weekDays={weekDays}
              onToggle={(h, dateStr) => onToggle(h)}
              onEdit={onEditHabit}
            />
          ))
        )}
      </div>
    </div>
  );
};
