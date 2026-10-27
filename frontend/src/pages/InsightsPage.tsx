import React from 'react';
import { Award, AlertTriangle, TrendingUp, Lightbulb, ShieldCheck, Zap } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { HabitInsight } from '../types/habit';

export const InsightsPage: React.FC = () => {
  const { insights } = useAnalytics();

  const iconFor = (type: HabitInsight['type']) => {
    switch (type) {
      case 'praise':          return <Award size={16} />;
      case 'warning':         return <AlertTriangle size={16} />;
      case 'pattern':         return <TrendingUp size={16} />;
      case 'recommendation':  return <Lightbulb size={16} />;
    }
  };

  const colorFor = (type: HabitInsight['type']) => ({
    praise:         { bg: 'rgba(126,200,106,0.1)',  border: 'rgba(126,200,106,0.25)',  icon: '#7ec86a' },
    warning:        { bg: 'rgba(232,185,92,0.1)',   border: 'rgba(232,185,92,0.25)',   icon: '#e8b95c' },
    pattern:        { bg: 'rgba(183,138,247,0.1)',  border: 'rgba(183,138,247,0.25)', icon: '#b78af7' },
    recommendation: { bg: 'rgba(183,138,247,0.08)', border: 'rgba(183,138,247,0.2)',  icon: '#d7c2ff' },
  }[type]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em' }}>
          Insights
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#a0a4aa' }}>
          Explainable patterns derived from your consistency data
        </p>
      </div>

      {insights.length === 0 ? (
        <div className="hf-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <Lightbulb size={28} style={{ color: '#b78af7', opacity: 0.5, margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#a0a4aa' }}>
            Complete habits for a few days to unlock personalised insights.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '0.75rem' }} className="md:grid-cols-2">
          {insights.map(item => {
            const c = colorFor(item.type);
            return (
              <div
                key={item.id}
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: '0.875rem',
                  padding: '1.125rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ color: c.icon, background: 'rgba(0,0,0,0.25)', padding: '0.35rem', borderRadius: '0.4rem', display: 'flex' }}>
                      {iconFor(item.type)}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>
                      {item.title}
                    </p>
                  </div>
                  {item.metric && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 999, background: 'rgba(255,255,255,0.07)', color: '#d7c2ff', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace' }}>
                      {item.metric}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#a0a4aa', lineHeight: 1.55 }}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Habit science tips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '0.75rem' }} className="md:grid-cols-2">
        <div className="hf-panel" style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={15} style={{ color: '#b78af7' }} />
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>Streak Freeze Rule</p>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#a0a4aa', lineHeight: 1.6 }}>
            Research shows missing once rarely derails a habit — but missing twice breaks the pattern. Enable streak freezes as emergency shields for travel days.
          </p>
          <div style={{ background: 'rgba(183,138,247,0.08)', border: '1px solid rgba(183,138,247,0.2)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#d7c2ff', fontWeight: 600 }}>
            💡 Never miss twice.
          </div>
        </div>

        <div className="hf-panel" style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={15} style={{ color: '#b78af7' }} />
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>The 3 Laws of Habit</p>
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 1rem', fontSize: '0.8rem', color: '#a0a4aa', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <li><strong style={{ color: '#b78af7' }}>Make it obvious</strong> — set a specific reminder time</li>
            <li><strong style={{ color: '#b78af7' }}>Make it easy</strong> — track small steps with numeric goals</li>
            <li><strong style={{ color: '#b78af7' }}>Make it satisfying</strong> — celebrate with streak milestones</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
