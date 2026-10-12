import * as React from 'react';
import { useReviewSessionStore } from '@/features/review/store/useReviewSessionStore';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export const ChooseExercise: React.FC = () => {
  const {
    currentExercise,
    selectedOptionIndex,
    selectOption,
    isAnswerSubmitted,
    submitAnswer,
    isCorrect,
  } = useReviewSessionStore();

  if (!currentExercise || currentExercise.type !== 'choose') return null;

  const options = currentExercise.options || [];

  // Hotkeys [1]..[4]
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswerSubmitted) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < options.length) {
          selectOption(idx);
        }
      }
      if (e.key === 'Enter' && selectedOptionIndex !== null) {
        submitAnswer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswerSubmitted, options.length, selectOption, selectedOptionIndex, submitAnswer]);

  return (
    <div className="space-y-6 text-left">
      {/* Exercise Instruction Badge */}
      <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
        <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={1.5} />
        <span>1-bosqich: To‘g‘ri ma’noni tanlang (Choose)</span>
      </div>

      {/* Target Sentence Hero (Large Fraunces) */}
      <div className="py-2">
        <p className="font-serif text-2xl sm:text-3xl text-[var(--color-text)] leading-relaxed">
          "{currentExercise.prompt}"
        </p>
      </div>

      {/* 4 Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {options.map((option, idx) => {
          const isSelected = selectedOptionIndex === idx;
          const isAnswer = option.trim().toLowerCase() === currentExercise.answer.trim().toLowerCase();

          let variantClasses = 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-muted)]';

          if (isAnswerSubmitted) {
            if (isAnswer) {
              variantClasses = 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-600';
            } else if (isSelected && !isCorrect) {
              variantClasses = 'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-200';
            } else {
              variantClasses = 'opacity-50 border-[var(--color-border)] bg-[var(--color-surface)]';
            }
          } else if (isSelected) {
            variantClasses = 'border-[var(--color-accent)] bg-[var(--color-surface)] ring-1 ring-[var(--color-accent)]';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswerSubmitted}
              onClick={() => selectOption(idx)}
              className={`p-4 rounded-md border text-left text-sm transition-all flex items-start gap-3 cursor-pointer ${variantClasses}`}
            >
              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)] shrink-0 mt-0.5">
                [{idx + 1}]
              </span>
              <span className="flex-1 font-medium leading-relaxed">
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {/* Submit button when not yet submitted */}
      {!isAnswerSubmitted && (
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="accent"
            size="md"
            disabled={selectedOptionIndex === null}
            onClick={submitAnswer}
          >
            Tekshirish [Enter]
          </Button>
        </div>
      )}

      {/* Instant Feedback Bar */}
      {isAnswerSubmitted && (
        <div
          className={`p-4 rounded-md border flex items-center justify-between gap-3 animate-fadeIn ${
            isCorrect
              ? 'border-emerald-600/40 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200'
              : 'border-rose-600/40 bg-rose-500/5 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" strokeWidth={2} />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" strokeWidth={2} />
            )}
            <div>
              <p className="text-sm font-semibold">
                {isCorrect ? "To‘g‘ri javob! Zo‘r natija." : "Xato javob."}
              </p>
              {!isCorrect && (
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  To‘g‘ri javob: <strong>{currentExercise.answer}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
