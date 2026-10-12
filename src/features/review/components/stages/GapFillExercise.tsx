import * as React from 'react';
import { useReviewSessionStore } from '@/features/review/store/useReviewSessionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit3, CheckCircle2, XCircle } from 'lucide-react';

export const GapFillExercise: React.FC = () => {
  const {
    currentExercise,
    userAnswer,
    setUserAnswer,
    isAnswerSubmitted,
    submitAnswer,
    isCorrect,
  } = useReviewSessionStore();

  if (!currentExercise || currentExercise.type !== 'gap_fill') return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isAnswerSubmitted && userAnswer.trim()) {
      submitAnswer();
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Badge */}
      <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
        <Edit3 className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={1.5} />
        <span>4-bosqich: Bo‘sh joyni to‘ldiring (Gap Fill)</span>
      </div>

      {/* Sentence with blank */}
      <div className="p-6 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
        <p className="font-serif text-2xl sm:text-3xl text-[var(--color-text)] leading-relaxed">
          "{currentExercise.prompt}"
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-3">
          <Input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={isAnswerSubmitted}
            placeholder="Tushirib qoldirilgan so‘zni yozing..."
            className="font-serif text-lg py-3 flex-1"
            autoFocus
          />
          {!isAnswerSubmitted && (
            <Button
              type="submit"
              variant="accent"
              size="md"
              disabled={!userAnswer.trim()}
              className="shrink-0"
            >
              Tekshirish [Enter]
            </Button>
          )}
        </div>
      </form>

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
              {isCorrect ? "To‘g‘ri to‘ldirildi!" : "Noto‘g‘ri so‘z:"}
            </p>
          </div>

          <div className="pt-1 text-sm font-serif">
            <span className="text-xs font-sans text-[var(--color-text-muted)] block">To‘g‘ri so‘z:</span>
            <p className="text-[var(--color-text)] font-medium font-mono text-base">
              {currentExercise.answer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
