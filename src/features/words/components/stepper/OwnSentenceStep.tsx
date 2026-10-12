import * as React from 'react';
import { useAddWordStepperStore } from '@/features/words/store/useAddWordStepper';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Send, CheckCircle2, AlertCircle, Quote } from 'lucide-react';

export const OwnSentenceStep: React.FC = () => {
  const {
    cardData,
    ownSentence,
    setOwnSentence,
    isCheckingSentence,
    sentenceFeedback,
    submitSentenceForCheck,
    error,
  } = useAddWordStepperStore();

  if (!cardData) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isCheckingSentence && ownSentence.trim()) {
        submitSentenceForCheck();
      }
    }
  };

  return (
    <div className="space-y-5 text-left animate-fadeIn">
      {/* Editorial Life Prompt */}
      <div className="p-4 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-border)] space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] font-medium">
          <Quote className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Shaxsiy hayotiy savol</span>
        </div>
        <p className="font-serif italic text-sm sm:text-base text-[var(--color-text)] leading-relaxed">
          "{cardData.personal_prompt_uz}"
        </p>
      </div>

      {/* Input section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[var(--color-text)]">
            3-qadam: So‘z ishtirokida o‘z hayotingizdan bitta jumla yozing
          </label>
          <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
            [Ctrl+Enter] yuborish
          </span>
        </div>

        <Textarea
          value={ownSentence}
          onChange={(e) => setOwnSentence(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder={`Masalan: In my experience, ${cardData.word}...`}
          className="font-serif text-sm sm:text-base leading-relaxed"
          autoFocus
        />

        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
            {error}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={submitSentenceForCheck}
            disabled={isCheckingSentence || !ownSentence.trim()}
          >
            {isCheckingSentence ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" strokeWidth={1.5} />
                Murabbiy tekshirmoqda...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
                Jumlani tekshirish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Feedback Card */}
      {sentenceFeedback && (
        <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3.5 animate-fadeIn">
          {/* Natural Score bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--color-text)]">
                Tabiiylik darajasi (Natural Score)
              </span>
              <span className="font-mono font-semibold text-[var(--color-accent)]">
                {sentenceFeedback.natural_score} / 100
              </span>
            </div>
            <Progress value={sentenceFeedback.natural_score} />
          </div>

          {/* Corrected version */}
          <div className="space-y-1">
            <span className="text-xs text-[var(--color-text-muted)]">
              Eng tabiiy shakli:
            </span>
            <div className="p-2.5 rounded bg-[var(--color-surface-subtle)] border border-[var(--color-border)] font-serif text-sm text-[var(--color-text)]">
              {sentenceFeedback.corrected}
            </div>
          </div>

          {/* Warm Uzbek feedback */}
          <div className="p-2.5 rounded bg-[var(--color-surface-subtle)] border-l-2 border-l-[var(--color-accent)] text-xs text-[var(--color-text)] leading-relaxed space-y-1">
            <div className="flex items-center gap-1 font-semibold text-[var(--color-accent)]">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Murabbiy xulosasi:</span>
            </div>
            <p>{sentenceFeedback.feedback_uz}</p>
          </div>
        </div>
      )}
    </div>
  );
};
