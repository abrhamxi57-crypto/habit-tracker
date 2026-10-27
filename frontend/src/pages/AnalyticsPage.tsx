import React from 'react';
import { Flame, CheckCircle2, TrendingUp, Layers } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { ConsistencyHeatmap } from '../components/analytics/ConsistencyHeatmap';
import { WeeklyBarChart } from '../components/analytics/WeeklyBarChart';
import { CategoryDonut } from '../components/analytics/CategoryDonut';

export const AnalyticsPage: React.FC = () => {
  const { heatmapData, weeklyMetrics, categoryBreakdown, globalStats } = useAnalytics();

  const statCards = [
    {
      label: 'Peak Streak',
      value: globalStats.bestStreak,
      unit: 'days',
      icon: <Flame size={16} />,
      iconBg: 'rgba(183,138,247,0.12)',
      iconColor: '#b78af7',
      valueColor: '#f4f4f5',
    },
    {
      label: '30-Day Consistency',
      value: `${globalStats.averageConsistency}%`,
      unit: '',
      icon: <TrendingUp size={16} />,
      iconBg: 'rgba(126,200,106,0.12)',
      iconColor: '#7ec86a',
      valueColor: '#7ec86a',
    },
    {
      label: 'Total Completions',
      value: globalStats.totalCompletions,
      unit: 'total',
      icon: <CheckCircle2 size={16} />,
      iconBg: 'rgba(183,138,247,0.12)',
      iconColor: '#b78af7',
      valueColor: '#f4f4f5',
    },
    {
      label: 'Active Habits',
      value: globalStats.activeHabitCount,
      unit: 'systems',
      icon: <Layers size={16} />,
      iconBg: 'rgba(183,138,247,0.12)',
      iconColor: '#b78af7',
      valueColor: '#f4f4f5',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em' }}>
          Analytics
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#a0a4aa' }}>
          Consistency metrics, streak history &amp; category breakdown
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }} className="sm:grid-cols-4">
        {statCards.map(c => (
          <div key={c.label} className="hf-panel" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a0a4aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {c.label}
              </span>
              <div style={{ padding: '0.3rem', borderRadius: '0.4rem', background: c.iconBg, color: c.iconColor }}>
                {c.icon}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: c.valueColor, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>
                {c.value}
              </span>
              {c.unit && (
                <span style={{ fontSize: '0.7rem', color: '#a0a4aa' }}>{c.unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <ConsistencyHeatmap data={heatmapData} />

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '1rem' }} className="lg:grid-cols-2">
        <WeeklyBarChart data={weeklyMetrics} />
        <CategoryDonut data={categoryBreakdown} />
      </div>
    </div>
  );
};
