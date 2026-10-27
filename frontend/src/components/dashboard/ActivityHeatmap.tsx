import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { HeatmapDay } from '../../services/analyticsService';

interface ActivityHeatmapProps {
  data: HeatmapDay[];
  totalTasks: number;
  consistencyRate: number;
  longestStreak: number;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  totalTasks,
  consistencyRate,
  longestStreak,
}) => {
  const [hovered, setHovered] = useState<HeatmapDay | null>(null);

  // Group into columns of 7 (one column = one week, rows = Mon..Sun)
  const weeks = useMemo<HeatmapDay[][]>(() => {
    const result: HeatmapDay[][] = [];
    let week: HeatmapDay[] = [];

    // Pad first week so col 0 = Monday
    if (data.length > 0) {
      const firstDow = data[0].dayOfWeek; // 0 = Sun
      // Convert to Mon-first index: Mon=0 … Sun=6
      const monFirst = (firstDow + 6) % 7;
      for (let i = 0; i < monFirst; i++) week.push({ date: '', dayOfWeek: -1, completedCount: 0, scheduledCount: 0, percentage: 0, level: 0, habitsCompleted: [] });
    }

    data.forEach((day) => {
      week.push(day);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    });
    if (week.length > 0) result.push(week);
    return result;
  }, [data]);

  const rowLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const yearLabel = data.length > 0 ? format(parseISO(data[0].date || new Date().toISOString().slice(0, 10)), 'yyyy') : new Date().getFullYear();

  return (
    <div
      className="hf-panel p-5 flex flex-col gap-4"
      style={{ background: '#1a1d22' }}
    >
      {/* Top Header: Title on left, Legend on right */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#f4f4f5', margin: 0, letterSpacing: '-0.01em' }}>
            Activity ({yearLabel})
          </h2>
          {hovered && hovered.date ? (
            <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#d7c2ff', fontWeight: 500 }}>
              {format(parseISO(hovered.date), 'MMMM d, yyyy')} —{' '}
              <span style={{ color: '#b78af7' }}>
                {hovered.completedCount}/{hovered.scheduledCount} habits
              </span>
            </p>
          ) : (
            <p style={{ margin: '3px 0 0', fontSize: '0.6875rem', color: '#717680' }}>
              Hover any cell for daily habit details
            </p>
          )}
        </div>

        {/* Legend scale: 0  1  2-3  4-5  6+ */}
        <div className="flex items-center gap-3 text-[0.65rem] text-[#8e939e]">
          <div className="flex items-center gap-1.5">
            <span>0</span>
            <div className="hm-cell hm-cell-0" style={{ width: 13, height: 13 }} />
          </div>
          <div className="flex items-center gap-1.5">
            <span>1</span>
            <div className="hm-cell hm-cell-1" style={{ width: 13, height: 13 }} />
          </div>
          <div className="flex items-center gap-1.5">
            <span>2-3</span>
            <div className="hm-cell hm-cell-2" style={{ width: 13, height: 13 }} />
          </div>
          <div className="flex items-center gap-1.5">
            <span>4-5</span>
            <div className="hm-cell hm-cell-3" style={{ width: 13, height: 13 }} />
          </div>
          <div className="flex items-center gap-1.5">
            <span>6+</span>
            <div className="hm-cell hm-cell-4" style={{ width: 13, height: 13 }} />
          </div>
        </div>
      </div>

      {/* Main content: Heatmap on left, Stat cards on right */}
      <div className="flex flex-col lg:flex-row items-stretch gap-5">
        {/* Heatmap grid */}
        <div className="flex-1 flex gap-2 overflow-x-auto pb-1 items-center">
          {/* Row day labels (Mon, Wed, Fri, Sun) */}
          <div className="flex flex-col gap-[3px] pt-0 shrink-0" style={{ marginTop: 0 }}>
            {rowLabels.map((lbl, i) => {
              const showLabel = i === 0 || i === 2 || i === 4 || i === 6; // Mon, Wed, Fri, Sun
              return (
                <div
                  key={lbl}
                  style={{
                    height: 14,
                    fontSize: '0.55rem',
                    color: showLabel ? '#8e939e' : 'transparent',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    paddingRight: 4,
                  }}
                >
                  {lbl}
                </div>
              );
            })}
          </div>

          {/* Week columns */}
          <div className="flex gap-[3px] overflow-x-auto">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => {
                  if (!day.date) {
                    return <div key={di} style={{ width: 14, height: 14 }} />;
                  }
                  return (
                    <div
                      key={di}
                      className={`hm-cell hm-cell-${day.level}`}
                      onMouseEnter={() => setHovered(day)}
                      onMouseLeave={() => setHovered(null)}
                      title={`${day.date}: ${day.completedCount}/${day.scheduledCount} (${day.percentage}%)`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right side stat cards matching the screenshot */}
        <div className="flex items-center justify-center gap-3 shrink-0">
          <div
            className="flex flex-col items-center justify-center rounded-2xl px-5 py-4"
            style={{
              background: '#13161a',
              border: '1px solid #232730',
              minWidth: 104,
              minHeight: 110,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <span
              style={{
                fontSize: '1.875rem',
                fontWeight: 900,
                color: '#e8b95c',
                lineHeight: 1,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '-0.02em',
              }}
            >
              {consistencyRate}%
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                color: '#8e939e',
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginTop: 8,
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              Consistency<br />Rate
            </span>
          </div>

          <div
            className="flex flex-col items-center justify-center rounded-2xl px-5 py-4"
            style={{
              background: '#13161a',
              border: '1px solid #232730',
              minWidth: 104,
              minHeight: 110,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <span
              style={{
                fontSize: '1.875rem',
                fontWeight: 900,
                color: '#e8b95c',
                lineHeight: 1,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '-0.02em',
              }}
            >
              {totalTasks}
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                color: '#8e939e',
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginTop: 8,
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              Total<br />Tasks
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
