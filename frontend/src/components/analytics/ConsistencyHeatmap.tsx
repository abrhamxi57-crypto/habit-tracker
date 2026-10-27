import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { HeatmapDay } from '../../services/analyticsService';

interface ConsistencyHeatmapProps {
  data: HeatmapDay[];
}

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({ data }) => {
  const [hovered, setHovered] = useState<HeatmapDay | null>(null);

  const weeks = useMemo<HeatmapDay[][]>(() => {
    const result: HeatmapDay[][] = [];
    let week: HeatmapDay[] = [];

    if (data.length > 0) {
      const firstDow = data[0].dayOfWeek;
      const monFirst = (firstDow + 6) % 7;
      for (let i = 0; i < monFirst; i++) {
        week.push({ date: '', dayOfWeek: -1, completedCount: 0, scheduledCount: 0, percentage: 0, level: 0, habitsCompleted: [] });
      }
    }

    data.forEach(day => {
      week.push(day);
      if (week.length === 7) { result.push(week); week = []; }
    });
    if (week.length > 0) result.push(week);
    return result;
  }, [data]);

  const rowLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="hf-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>Consistency Activity Matrix</p>
          <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#a0a4aa' }}>
            {hovered && hovered.date
              ? `${format(parseISO(hovered.date), 'MMMM d, yyyy')} — ${hovered.completedCount}/${hovered.scheduledCount} habits (${hovered.percentage}%)`
              : 'Daily completion intensity over past 20 weeks'}
          </p>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', color: '#a0a4aa' }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(l => (
            <div key={l} className={`hm-cell hm-cell-${l}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'inline-flex', gap: 6 }}>
          {/* Row labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 0 }}>
            {rowLabels.map((lbl, i) => (
              <div key={lbl} style={{ height: 14, fontSize: '0.55rem', color: i % 2 === 0 ? '#a0a4aa' : 'transparent', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                {lbl}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div style={{ display: 'flex', gap: 3 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((day, di) => {
                  if (!day.date) return <div key={di} style={{ width: 14, height: 14 }} />;
                  return (
                    <div
                      key={di}
                      className={`hm-cell hm-cell-${day.level}`}
                      onMouseEnter={() => setHovered(day)}
                      onMouseLeave={() => setHovered(null)}
                      title={`${day.date}: ${day.percentage}%`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
