import * as React from 'react';
import { useReviewSessionStore } from '@/features/review/store/useReviewSessionStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Languages, CheckCircle2, XCircle } from 'lucide-react';

export const UzToEnExercise: React.FC = () => {
  const {
    currentExercise,
    userAnswer,
    setUserAnswer,
    isAnswerSubmitted,
    submitAnswer,
    isCorrect,
  } = useReviewSessionStore();

  if (!currentExercise || currentExercise.type !== 'uz_to_en') return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      if (!isAnswerSubmitted && userAnswer.trim()) {
        submitAnswer();
      }
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Badge */}
      <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
        <Languages className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={1.5} />
        <span>3-bosqich: O‘zbekchadan inglizchaga tarjima (UZ → EN)</span>
      </div>

      {/* Uzbek prompt in editorial serif */}
      <div className="p-5 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-mono block mb-1">
          O‘zbekcha jumla:
        </span>
        <p className="font-serif text-xl sm:text-2xl text-[var(--color-text)] leading-relaxed">
          "{currentExercise.prompt}"
        </p>
      </div>

      {/* User English translation input */}
      <div className="space-y-3">
        <Textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAnswerSubmitted}
          rows={3}
          placeholder="Inglizcha tarjimani yozing..."
          className="font-serif text-base sm:text-lg leading-relaxed"
          autoFocus
        />

        {!isAnswerSubmitted && (
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="accent"
              size="md"
              disabled={!userAnswer.trim()}
              onClick={submitAnswer}
            >
              Tekshirish [Enter]
            </Button>
          </div>
        )}
      </div>

      {/* Instant Feedback */}
      {isAnswerSubmitted && (
        <div
          className={`p-4 rounded-md border space-y-2 animate-fadeIn ${
            isCorrect
              ? 'border-emerald-600/40 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200'
              : 'border-rose-600/40 bg-rose-500/5 text-rose-950 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2} />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" strokeWidth={2} />
            )}
            <p className={`text-sm font-semibold ${isCorrect ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'}`}>
              {isCorrect ? "Mukammal tarjima!" : "Tavsiya etilgan tarjima:"}
            </p>
          </div>

          <div className="pt-1 text-sm font-serif">
            <p className="text-[var(--color-text)] font-medium">"{currentExercise.answer}"</p>
            {currentExercise.accept_also && currentExercise.accept_also.length > 0 && (
              <p className="text-xs font-sans text-[var(--color-text-muted)] mt-1">
                Yoki: {currentExercise.accept_also.join(' / ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
