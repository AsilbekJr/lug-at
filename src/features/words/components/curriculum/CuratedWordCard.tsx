import * as React from 'react';
import type { CuratedWord } from '@/features/words/types/curriculum';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Volume2, Loader2 } from 'lucide-react';
import { useSpeech } from '@/features/words/hooks/use-speech';
import { useMarkWordAsKnownMutation } from '@/features/words/api/words-api';

interface CuratedWordCardProps {
  wordItem: CuratedWord;
  isLearned: boolean;
  onSelectWord: (word: CuratedWord) => void;
}

export const CuratedWordCard: React.FC<CuratedWordCardProps> = ({
  wordItem,
  isLearned,
  onSelectWord,
}) => {
  const { speak, isSpeaking } = useSpeech();
  const markAsKnownMutation = useMarkWordAsKnownMutation();

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(wordItem.word);
  };

  const handleMarkAsKnown = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsKnownMutation.mutate(wordItem);
  };

  return (
    <div className="group p-3 sm:p-4 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-paper)] hover:border-[var(--color-border-strong)] transition-colors flex flex-col justify-between gap-3">
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-serif font-bold text-lg sm:text-xl text-[var(--color-text)] tracking-tight">
              {wordItem.word}
            </span>
            {wordItem.phonetic && (
              <span className="font-mono text-xs text-[var(--color-text-muted)]">
                {wordItem.phonetic}
              </span>
            )}
            <button
              type="button"
              onClick={handleSpeak}
              aria-label="Talaffuz qilish"
              className="min-h-[44px] min-w-[44px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] p-2 rounded transition-colors inline-flex items-center justify-center"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-[var(--color-accent)]' : ''}`} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {wordItem.cefr && (
              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                {wordItem.cefr}
              </Badge>
            )}
            {wordItem.partOfSpeech && (
              <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                {wordItem.partOfSpeech}
              </span>
            )}
          </div>
        </div>

        <div className="text-sm font-sans text-[var(--color-text)]">
          {wordItem.translation}
        </div>

        {wordItem.example && (
          <p className="text-xs text-[var(--color-text-muted)] italic font-serif line-clamp-2 pt-0.5">
            "{wordItem.example}"
          </p>
        )}

        {wordItem.collocations && wordItem.collocations.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {wordItem.collocations.slice(0, 2).map((c, i) => (
              <span
                key={i}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-2 mt-auto flex-wrap">
        {isLearned ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
            Lug‘atda mavjud
          </span>
        ) : (
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Hali o‘rganilmagan
          </span>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {!isLearned && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleMarkAsKnown}
              disabled={markAsKnownMutation.isPending}
              className="text-xs h-7 px-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              title="So‘zni bilishingizni o‘zingiz belgilaysiz. Tinglash, yozish va talaffuz hali tekshirilmagan."
            >
              {markAsKnownMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Check className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                  O‘zim bilaman
                </>
              )}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant={isLearned ? "outline" : "accent"}
            onClick={() => onSelectWord(wordItem)}
            className="text-xs h-7 px-2.5"
          >
            <Sparkles className="w-3 h-3 mr-1" strokeWidth={1.5} />
            {isLearned ? "Qayta o‘rganish" : "O‘rganish"}
          </Button>
        </div>
      </div>
    </div>
  );
};
