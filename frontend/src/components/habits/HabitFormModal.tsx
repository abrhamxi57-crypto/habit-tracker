import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Habit, HabitCategory, FrequencyType, TargetType, TimeOfDay } from '../../types/habit';

interface HabitFormModalProps {
  isOpen: boolean;
  habitToEdit?: Habit | null;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => Promise<Habit>;
  onDelete?: (habitId: string) => Promise<void>;
}

const CATEGORIES: Array<{ key: HabitCategory; label: string }> = [
  { key: 'productivity', label: 'Productivity' },
  { key: 'health', label: 'Health' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'mind', label: 'Mind' },
  { key: 'learning', label: 'Learning' },
  { key: 'personal', label: 'Personal' },
];

const COLORS = ['#b78af7', '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444'];
const ICONS = ['Sparkles', 'Brain', 'Droplet', 'BookOpen', 'Dumbbell', 'PenTool', 'Flame', 'Zap', 'Moon', 'Heart'];
const DAYS_OF_WEEK = [
  { day: 1, label: 'M' }, { day: 2, label: 'T' }, { day: 3, label: 'W' },
  { day: 4, label: 'T' }, { day: 5, label: 'F' }, { day: 6, label: 'S' }, { day: 0, label: 'S' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  borderRadius: '0.5rem',
  background: '#21252d',
  border: '1px solid #2a2f38',
  color: '#f4f4f5',
  fontSize: '0.8125rem',
  outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.65rem',
  fontWeight: 700,
  color: '#a0a4aa',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '0.375rem',
};

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  isOpen,
  habitToEdit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('productivity');
  const [color, setColor] = useState('#b78af7');
  const [icon, setIcon] = useState('Sparkles');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [targetType, setTargetType] = useState<TargetType>('boolean');
  const [targetValue, setTargetValue] = useState(1);
  const [unit, setUnit] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('anytime');
  const [reminderTime, setReminderTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title);
      setDescription(habitToEdit.description || '');
      setCategory(habitToEdit.category);
      setColor(habitToEdit.color);
      setIcon(habitToEdit.icon);
      setFrequencyType(habitToEdit.frequency_type);
      setCustomDays(habitToEdit.custom_days || [1, 2, 3, 4, 5]);
      setTargetType(habitToEdit.target_type);
      setTargetValue(habitToEdit.target_value);
      setUnit(habitToEdit.unit || '');
      setTimeOfDay(habitToEdit.time_of_day);
      setReminderTime(habitToEdit.reminder_time || '');
    } else {
      setTitle(''); setDescription(''); setCategory('productivity');
      setColor('#b78af7'); setIcon('Sparkles'); setFrequencyType('daily');
      setCustomDays([1, 2, 3, 4, 5]); setTargetType('boolean');
      setTargetValue(1); setUnit(''); setTimeOfDay('anytime'); setReminderTime('');
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    if (customDays.includes(day)) {
      if (customDays.length > 1) setCustomDays(customDays.filter(d => d !== day));
    } else {
      setCustomDays([...customDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        id: habitToEdit?.id,
        title: title.trim(),
        description: description.trim(),
        category, color, icon,
        frequency_type: frequencyType,
        custom_days: customDays,
        target_type: targetType,
        target_value: targetType === 'numeric' ? Number(targetValue) || 1 : 1,
        unit: targetType === 'numeric' ? unit.trim() : '',
        time_of_day: timeOfDay,
        reminder_time: reminderTime || null,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!habitToEdit || !onDelete) return;
    if (window.confirm(`Delete "${habitToEdit.title}"?`)) {
      await onDelete(habitToEdit.id);
      onClose();
    }
  };

  const freqOptions: FrequencyType[] = ['daily', 'weekdays', 'weekends', 'custom'];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 480,
          maxHeight: '90vh', overflowY: 'auto',
          background: '#1a1d22',
          border: '1px solid #2a2f38',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f4f4f5' }}>
            {habitToEdit ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#a0a4aa', cursor: 'pointer', padding: 4, borderRadius: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Habit Name *</label>
            <input
              style={inputStyle}
              type="text"
              required
              placeholder="e.g., Morning Meditation"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Why does this matter?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {CATEGORIES.map(c => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  style={{
                    padding: '0.4rem',
                    borderRadius: '0.4rem',
                    border: `1px solid ${category === c.key ? '#b78af7' : '#2a2f38'}`,
                    background: category === c.key ? 'rgba(183,138,247,0.15)' : '#21252d',
                    color: category === c.key ? '#d7c2ff' : '#a0a4aa',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color & Icon */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 22, height: 22,
                      borderRadius: '50%',
                      background: c,
                      border: color === c ? '2px solid #f4f4f5' : '2px solid transparent',
                      cursor: 'pointer',
                      outline: color === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Icon</label>
              <select
                value={icon}
                onChange={e => setIcon(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              >
                {ICONS.map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label style={labelStyle}>Schedule</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
              {freqOptions.map(freq => (
                <button
                  type="button"
                  key={freq}
                  onClick={() => setFrequencyType(freq)}
                  style={{
                    padding: '0.375rem 0.25rem',
                    borderRadius: '0.4rem',
                    border: `1px solid ${frequencyType === freq ? '#b78af7' : '#2a2f38'}`,
                    background: frequencyType === freq ? 'rgba(183,138,247,0.15)' : '#21252d',
                    color: frequencyType === freq ? '#d7c2ff' : '#a0a4aa',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {freq}
                </button>
              ))}
            </div>

            {frequencyType === 'custom' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#21252d', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', border: '1px solid #2a2f38' }}>
                {DAYS_OF_WEEK.map(({ day, label }) => {
                  const active = customDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      style={{
                        width: 32, height: 32,
                        borderRadius: '0.4rem',
                        border: 'none',
                        background: active ? '#b78af7' : '#2a2f38',
                        color: active ? '#0f1115' : '#a0a4aa',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Target */}
          <div>
            <label style={labelStyle}>Goal Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
              {(['boolean', 'numeric'] as TargetType[]).map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTargetType(t)}
                  style={{
                    padding: '0.4rem',
                    borderRadius: '0.4rem',
                    border: `1px solid ${targetType === t ? '#b78af7' : '#2a2f38'}`,
                    background: targetType === t ? 'rgba(183,138,247,0.15)' : '#21252d',
                    color: targetType === t ? '#d7c2ff' : '#a0a4aa',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t === 'boolean' ? 'Yes / No' : 'Numeric'}
                </button>
              ))}
            </div>

            {targetType === 'numeric' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <input
                  type="number"
                  min="1"
                  placeholder="Target (e.g. 8)"
                  value={targetValue}
                  onChange={e => setTargetValue(Number(e.target.value) || 1)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Unit (glasses, pages…)"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* Reminder */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Time of Day</label>
              <select
                value={timeOfDay}
                onChange={e => setTimeOfDay(e.target.value as TimeOfDay)}
                style={inputStyle}
              >
                {(['anytime', 'morning', 'afternoon', 'evening'] as TimeOfDay[]).map(t => (
                  <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Reminder</label>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #2a2f38' }}>
            {habitToEdit && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0.4rem',
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.08)',
                  color: '#f87171',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: '0.4rem',
                  border: '1px solid #2a2f38',
                  background: 'transparent',
                  color: '#a0a4aa',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '0.4rem',
                  border: 'none',
                  background: '#b78af7',
                  color: '#0f1115',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {habitToEdit ? 'Save Changes' : 'Create Habit'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
