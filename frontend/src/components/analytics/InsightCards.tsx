import React from 'react';
import { Award, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import { HabitInsight } from '../../types/habit';

interface InsightCardsProps {
  insights: HabitInsight[];
}

export const InsightCards: React.FC<InsightCardsProps> = ({ insights }) => {
  if (insights.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-6 border border-white/10 text-center text-slate-400 text-sm">
        <Lightbulb className="w-8 h-8 text-amber-400/60 mx-auto mb-2 animate-pulse" />
        <p className="font-semibold text-slate-300">Habit Insights Engine Gathering Momentum</p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Complete your daily habits for a few days to let HabitFlow identify your peak performance days, optimal timing, and risk alerts.
        </p>
      </div>
    );
  }

  const getInsightIcon = (type: HabitInsight['type']) => {
    switch (type) {
      case 'praise':
        return <Award className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'pattern':
        return <TrendingUp className="w-5 h-5 text-cyan-400" />;
      case 'recommendation':
      default:
        return <Lightbulb className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getInsightBorder = (type: HabitInsight['type']) => {
    switch (type) {
      case 'praise':
        return 'border-emerald-500/30 bg-emerald-950/15';
      case 'warning':
        return 'border-amber-500/30 bg-amber-950/15';
      case 'pattern':
        return 'border-cyan-500/30 bg-cyan-950/15';
      case 'recommendation':
      default:
        return 'border-indigo-500/30 bg-indigo-950/15';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map(item => (
        <div
          key={item.id}
          className={`glass-panel rounded-3xl p-5 border transition-all ${getInsightBorder(item.type)}`}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                {getInsightIcon(item.type)}
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-white">
                {item.title}
              </h4>
            </div>

            {item.metric && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10 shrink-0">
                {item.metric}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-1">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
};
