import * as React from 'react';
import type { EnrichedUserWord } from '@/features/words/types';
import { Badge } from '@/components/ui/badge';
import { Volume2, ChevronRight, Eye, Headphones, PenLine, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { State } from 'ts-fsrs';

export interface WordCardProps {
  item: EnrichedUserWord;
  onClick?: () => void;
  className?: string;
}

export function WordCard({ item, onClick, className }: WordCardProps) {
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const { word, card, userWord } = item;

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

  const stateLabels: Record<number, { label: string; style: string }> = {
    [State.New]: { label: 'Yangi', style: 'bg-paper-muted text-ink-muted' },
    [State.Learning]: { label: 'O\'rganilmoqda', style: 'bg-accent-subtle text-accent-text' },
    [State.Review]: { label: 'Takrorlashda', style: 'bg-rating-good/10 text-rating-good' },
    [State.Relearning]: { label: 'Qayta eslash', style: 'bg-rating-hard/10 text-rating-hard' },
  };

  const srsInfo = stateLabels[userWord.state];
  const cefr = card?.content?.cefr_level;
  const rawSentence = card?.content?.model_sentences?.present || userWord.own_sentence;
  const isInvalid = !rawSentence ||
    rawSentence.trim().toLowerCase() === word.word.trim().toLowerCase() ||
    rawSentence.includes('She knows how to use');

  const sentence = isInvalid
    ? (card?.content?.model_sentences?.past && !card.content.model_sentences.past.includes('learned how to use') && card.content.model_sentences.past.trim().toLowerCase() !== word.word.trim().toLowerCase()
        ? card.content.model_sentences.past
        : undefined)
    : rawSentence;

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        'group text-left p-5 sm:p-6 rounded-[8px] border border-border bg-paper hover:bg-paper-subtle/60 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex flex-wrap items-baseline gap-2.5">
          {/* Target Word in Large Editorial Serif */}
          <h3 className="font-serif font-bold text-2xl sm:text-3xl text-ink tracking-tight group-hover:text-accent transition-colors">
            {word.word}
          </h3>

          {word.ipa && (
            <span className="font-sans text-xs text-ink-muted tracking-normal">
              {word.ipa}
            </span>
          )}

          {word.pos && (
            <span className="font-sans text-xs italic text-ink-subtle">
              {word.pos}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            aria-label={`Talaffuz: ${word.word}`}
            onClick={handleSpeak}
            className={cn(
              'p-2 rounded-[6px] text-ink-muted hover:text-ink hover:bg-paper-subtle min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors',
              isPlayingAudio && 'text-accent'
            )}
          >
            <Volume2 className="w-4 h-4" strokeWidth={1.5} />
          </button>

          {cefr && (
            <Badge variant="cefr" cefr={cefr}>
              {cefr}
            </Badge>
          )}
        </div>
      </div>

      {/* Primary Uzbek Meaning */}
      <p className="font-sans text-sm sm:text-base text-ink leading-relaxed mb-3 reading-measure">
        {word.uz_meaning}
      </p>

      {/* Context Reading Sentence */}
      {sentence && (
        <div className="p-3.5 rounded-[6px] bg-paper-subtle/70 border border-border-subtle my-3">
          <p className="font-serif italic text-sm text-ink/90 leading-relaxed reading-measure">
            "{sentence}"
          </p>
        </div>
      )}

      {/* Chunks & Mastery Badges Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-2 border-t border-border-subtle text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {card?.content?.chunks && card.content.chunks.length > 0 ? (
            card.content.chunks.slice(0, 2).map((chunk, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-[4px] bg-paper-subtle border border-border-subtle text-ink-muted text-[11px]"
              >
                {chunk}
              </span>
            ))
          ) : (
            <span className="text-ink-subtle text-[11px]">Birikmalar mavjud emas</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-ink-muted">
          {/* 4 Multi-Modal Mastery Indicators */}
          <div className="flex items-center gap-1 text-[11px]">
            <span title="O'qish / Tanish" className={userWord.recog_ok ? 'text-accent font-semibold' : 'text-ink-subtle opacity-40'}>
              <Eye className="w-3.5 h-3.5 inline" strokeWidth={1.5} />
            </span>
            <span title="Eshitish" className={userWord.listen_ok ? 'text-accent font-semibold' : 'text-ink-subtle opacity-40'}>
              <Headphones className="w-3.5 h-3.5 inline" strokeWidth={1.5} />
            </span>
            <span title="Yozish" className={userWord.write_ok ? 'text-accent font-semibold' : 'text-ink-subtle opacity-40'}>
              <PenLine className="w-3.5 h-3.5 inline" strokeWidth={1.5} />
            </span>
            <span title="Gapirish" className={userWord.speak_ok ? 'text-accent font-semibold' : 'text-ink-subtle opacity-40'}>
              <Mic className="w-3.5 h-3.5 inline" strokeWidth={1.5} />
            </span>
          </div>

          {srsInfo && (
            <span className={cn('px-2 py-0.5 rounded-[4px] text-[11px] font-medium border border-border-subtle', srsInfo.style)}>
              {srsInfo.label}
            </span>
          )}

          <span className="flex items-center text-xs group-hover:text-ink transition-colors">
            Tafsilotlar
            <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </article>
  );
}
