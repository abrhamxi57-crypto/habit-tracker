import React from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { Habit } from '../../types/habit';

interface NumericStepperProps {
  habit: Habit;
  currentValue: number;
  onUpdate: (val: number) => void;
}

export const NumericStepper: React.FC<NumericStepperProps> = ({ habit, currentValue, onUpdate }) => {
  const target = habit.target_value;
  const isCompleted = currentValue >= target;
  const percentage = Math.min(100, Math.round((currentValue / target) * 100));

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentValue > 0) {
      onUpdate(currentValue - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(currentValue + 1);
  };

  return (
    <div className="flex flex-col space-y-2 mt-2 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline space-x-1.5">
          <span className="text-base font-extrabold font-mono text-white">
            {currentValue}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            / {target} {habit.unit}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleDecrement}
            disabled={currentValue <= 0}
            aria-label="Decrement value"
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none border border-white/5 transition-all active:scale-95"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={handleIncrement}
            aria-label="Increment value"
            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all active:scale-95 ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-indigo-600/80 hover:bg-indigo-500 text-white border-indigo-400/30'
            }`}
          >
            {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isCompleted
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-glow-emerald'
              : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
