import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { WeeklyChartData } from '../../services/analyticsService';

interface WeeklyBarChartProps {
  data: WeeklyChartData[];
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data }) => (
  <div className="hf-panel" style={{ padding: '1.25rem' }}>
    <p style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>
      This Week's Completion Rate
    </p>
    <p style={{ margin: '0 0 1rem', fontSize: '0.7rem', color: '#a0a4aa' }}>
      Daily percentage of scheduled habits achieved
    </p>
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis dataKey="dayName" stroke="#a0a4aa" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#a0a4aa" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <Tooltip
            cursor={{ fill: 'rgba(183,138,247,0.06)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as WeeklyChartData;
              return (
                <div style={{ background: '#21252d', border: '1px solid #2a2f38', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: 12 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#f4f4f5' }}>{d.dayName}</p>
                  <p style={{ margin: 0, color: '#b78af7', fontWeight: 600 }}>{d.rate}% — {d.completed}/{d.scheduled}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="rate" radius={[5, 5, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.rate >= 80 ? '#b78af7' : entry.rate >= 50 ? '#7b5ea7' : '#2a2f38'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
