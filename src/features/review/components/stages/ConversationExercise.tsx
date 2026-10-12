import * as React from 'react';
import { useReviewSessionStore } from '@/features/review/store/useReviewSessionStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { MessageSquare, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ConversationExercise: React.FC = () => {
  const {
    currentExercise,
    userAnswer,
    setUserAnswer,
    isAnswerSubmitted,
    submitAnswer,
    isCorrect,
  } = useReviewSessionStore();

  if (!currentExercise || currentExercise.type !== 'conversation') return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
        <MessageSquare className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={1.5} />
        <span>5-bosqich: Jonli muloqot savoli (Conversation)</span>
      </div>

      {/* Communicative Question */}
      <div className="p-6 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-border)] space-y-2">
        <p className="font-serif text-xl sm:text-2xl text-[var(--color-text)] leading-relaxed">
          "{currentExercise.prompt}"
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Eslatma: Javobingizda maqsadli <strong className="font-mono text-[var(--color-accent)]">"{currentExercise.answer}"</strong> so‘zini ishlatishga harakat qiling.
        </p>
      </div>

      {/* Answer textarea */}
      <div className="space-y-3">
        <Textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAnswerSubmitted}
          rows={3}
          placeholder="Ingliz tilida batafsil javob yozing..."
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
              Javobni yakunlash [Ctrl+Enter]
            </Button>
          </div>
        )}
      </div>

      {/* Feedback */}
      {isAnswerSubmitted && (
        <div
          className={`p-4 rounded-md border space-y-2 animate-fadeIn ${
            isCorrect
              ? 'border-emerald-600/40 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200'
              : 'border-amber-600/40 bg-amber-500/5 text-amber-950 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" strokeWidth={2} />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" strokeWidth={2} />
            )}
            <p className="text-sm font-semibold">
              {isCorrect ? "Zo‘r! Maqsadli so‘z nutqda muvaffaqiyatli qo‘llandi." : "Javob qabul qilindi, ammo maqsadli so‘z topilmadi."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
