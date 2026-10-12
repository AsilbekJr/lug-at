import * as React from 'react';
import type { Word, WordCard } from '@/features/words/types';
import { Badge } from '@/components/ui/badge';
import { Volume2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FlashcardProps {
  word: Word;
  card?: WordCard;
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
}

export function Flashcard({ word, card, isFlipped, onFlip, className }: FlashcardProps) {
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const cefr = card?.content?.cefr_level;
  const sentence = card?.content?.model_sentences?.present;
  const chunks = card?.content?.chunks;
  const mnemonics = card?.content?.mnemonics?.filter(Boolean);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFlip();
        }
      }}
      className={cn(
        'w-full min-h-[340px] p-6 sm:p-8 rounded-[8px] border border-border bg-paper transition-all duration-150 cursor-pointer select-none text-left flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent hover:border-ink/30',
        className
      )}
    >
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            {cefr && (
              <Badge variant="cefr" cefr={cefr}>
                {cefr}
              </Badge>
            )}
            {word.pos && (
              <span className="text-xs italic text-ink-muted">
                {word.pos}
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label={`Talaffuz: ${word.word}`}
            onClick={handleSpeak}
            className={cn(
              'p-2 rounded-[6px] text-ink-muted hover:text-ink hover:bg-paper-subtle min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors',
              isPlayingAudio && 'text-accent'
            )}
          >
            <Volume2 className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Word Display (Serif, strong contrast) */}
        <div className="text-center sm:text-left my-4">
          <h2 className="font-serif font-bold text-4xl sm:text-5xl text-ink tracking-tight mb-2">
            {word.word}
          </h2>
          {word.ipa && (
            <p className="font-sans text-sm sm:text-base text-ink-muted">
              {word.ipa}
            </p>
          )}
        </div>
      </div>

      {/* Answer / Context Body */}
      {isFlipped ? (
        <div className="mt-6 pt-6 border-t border-border animate-in fade-in-0 duration-150 space-y-4">
          <div>
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-ink-muted block mb-1">
              O'zbekcha ma'nosi
            </span>
            <p className="font-sans text-base font-medium text-ink leading-relaxed reading-measure">
              {word.uz_meaning}
            </p>
          </div>

          {sentence && (
            <div className="p-3.5 rounded-[6px] bg-paper-subtle border-l-2 border-l-accent border-y border-r border-border-subtle">
              <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-ink-muted block mb-1">
                Adabiy misol
              </span>
              <p className="font-serif italic text-sm sm:text-base text-ink leading-relaxed reading-measure">
                "{sentence}"
              </p>
            </div>
          )}

          {mnemonics && mnemonics.length > 0 && mnemonics[0] && (
            <div className="p-3 rounded-[6px] bg-paper border border-border-subtle text-xs">
              <span className="font-semibold text-accent block mb-0.5">
                Mnemonic eslatma:
              </span>
              <p className="text-ink-muted leading-relaxed">
                {mnemonics[0].scene_uz}
              </p>
            </div>
          )}

          {chunks && chunks.length > 0 && (
            <div className="pt-1">
              <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-ink-muted block mb-1">
                Birikmalar (Collocations)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {chunks.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-[4px] bg-paper-subtle border border-border-subtle text-xs text-ink-muted"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 pt-4 border-t border-border-subtle flex items-center justify-between text-ink-muted text-xs">
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-ink-muted" strokeWidth={1.5} />
            Javobni ko'rish uchun bosing
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 font-mono text-[11px] rounded bg-paper-subtle border border-border text-ink-muted">
            Space
          </kbd>
        </div>
      )}
    </div>
  );
}
