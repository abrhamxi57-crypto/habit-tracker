import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CategoryBreakdown } from '../../services/analyticsService';

interface CategoryDonutProps {
  data: CategoryBreakdown[];
}

// Override colors with purple-accent palette
const COLORS = ['#b78af7', '#9b6df4', '#7b5ea7', '#d7c2ff', '#4a3570', '#c9a8ff'];

export const CategoryDonut: React.FC<CategoryDonutProps> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="hf-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220, color: '#a0a4aa', fontSize: 13 }}>
        No category data yet
      </div>
    );
  }

  return (
    <div className="hf-panel" style={{ padding: '1.25rem' }}>
      <p style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>
        Category Breakdown
      </p>
      <p style={{ margin: '0 0 1rem', fontSize: '0.7rem', color: '#a0a4aa' }}>
        Habit focus areas & 30-day consistency
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as CategoryBreakdown;
                  return (
                    <div style={{ background: '#21252d', border: '1px solid #2a2f38', borderRadius: 8, padding: '0.4rem 0.6rem', fontSize: 12 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: '#f4f4f5' }}>{d.category}</p>
                      <p style={{ margin: 0, color: '#b78af7' }}>{d.count} habits · {d.rate}%</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((item, i) => (
            <div key={item.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ color: '#f4f4f5', fontWeight: 500 }}>{item.category}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#a0a4aa' }}>{item.count}</span>
                <span style={{ color: '#b78af7', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{item.rate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
