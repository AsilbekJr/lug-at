import * as React from 'react';
import type { StepperStep } from '@/features/words/store/useAddWordStepper';

interface StepperHeaderProps {
  currentStep: StepperStep;
  onStepClick?: (step: StepperStep) => void;
}

const STEPS = [
  { step: 1 as const, title: 'Hook', uz: 'Xotira ilgagi' },
  { step: 2 as const, title: 'Listen & Say', uz: 'Tinglash va talaffuz' },
  { step: 3 as const, title: 'Own Sentence', uz: 'Shaxsiy jumla' },
  { step: 4 as const, title: 'Bridge', uz: 'Muloqot ko‘prigi' },
];

export const StepperHeader: React.FC<StepperHeaderProps> = ({ currentStep, onStepClick }) => {
  const progressPercent = ((currentStep) / 4) * 100;

  return (
    <div className="w-full space-y-3 pb-3 border-b border-[var(--color-border)]">
      {/* Progress line */}
      <div className="w-full h-1 bg-[var(--color-surface-subtle)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-between gap-2 text-xs">
        {STEPS.map((s) => {
          const isActive = s.step === currentStep;
          const isDone = s.step < currentStep;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isDone && !isActive}
              onClick={() => isDone && onStepClick?.(s.step)}
              className={`min-h-[44px] min-w-[44px] flex-1 text-left px-1.5 py-1 rounded transition-colors ${
                isActive
                  ? 'text-[var(--color-accent)] font-semibold'
                  : isDone
                  ? 'text-[var(--color-text)] hover:text-[var(--color-accent)] cursor-pointer'
                  : 'text-[var(--color-text-muted)] cursor-default'
              }`}
            >
              <div className="flex items-center gap-1">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-white'
                      : isDone
                      ? 'bg-[var(--color-border)] text-[var(--color-text)]'
                      : 'border border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {isDone ? '✓' : s.step}
                </span>
                <span className="truncate hidden sm:inline">{s.title}</span>
                <span className="truncate sm:hidden">{s.step}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
