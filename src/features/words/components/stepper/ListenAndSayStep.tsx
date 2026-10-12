import * as React from 'react';
import { useAddWordStepperStore } from '@/features/words/store/useAddWordStepper';
import { useSpeech } from '@/features/words/hooks/use-speech';
import { Button } from '@/components/ui/button';
import { Volume2, Mic, CheckCircle2 } from 'lucide-react';

export const ListenAndSayStep: React.FC = () => {
  const { cardData, listenConfirmed, confirmListen, speakConfirmed, confirmSpeak } =
    useAddWordStepperStore();
  const { speak, isSpeaking } = useSpeech();
  const [playingItem, setPlayingItem] = React.useState<string | null>(null);

  if (!cardData) return null;

  const handlePlayWord = () => {
    setPlayingItem(cardData.word);
    speak(cardData.word);
    confirmListen();
    setTimeout(() => setPlayingItem(null), 1200);
  };

  const handlePlayChunk = (chunkText: string) => {
    const englishPart = chunkText.split('—')[0].split('-')[0].trim();
    setPlayingItem(chunkText);
    speak(englishPart);
    confirmListen();
    setTimeout(() => setPlayingItem(null), 1500);
  };

  return (
    <div className="space-y-5 text-left animate-fadeIn">
      {/* Target Word Audio Hero */}
      <div className="p-5 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-center space-y-3">
        <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-mono flex items-center justify-center gap-2">
          Asosiy talaffuz
          {listenConfirmed && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans normal-case">
              (tinglandi ✓)
            </span>
          )}
        </span>
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-3xl font-serif font-bold text-[var(--color-text)]">
            {cardData.word}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePlayWord}
            className={`rounded-full w-10 h-10 p-0 border transition-all ${
              playingItem === cardData.word
                ? 'border-[var(--color-accent)] text-[var(--color-accent)] scale-105'
                : 'border-[var(--color-border)] text-[var(--color-text)]'
            }`}
            title="Tinglash (Play audio)"
          >
            <Volume2 className={`w-5 h-5 ${isSpeaking && playingItem === cardData.word ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
          </Button>
        </div>
        {cardData.ipa && (
          <p className="font-mono text-sm text-[var(--color-text-muted)]">
            {cardData.ipa}
          </p>
        )}
      </div>

      {/* 3 Collocations (Chunks) */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">
            2-qadam: So‘z birikmalarini tinglang va qaytaring
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            So‘zni yolg‘iz emas, nutqda eng ko‘p uchraydigan 3 birikmasi bilan o‘rganing:
          </p>
        </div>

        <div className="space-y-2">
          {cardData.chunks.map((chunk, idx) => {
            const isPlaying = playingItem === chunk;
            const parts = chunk.includes('—')
              ? chunk.split('—')
              : chunk.includes('-')
              ? chunk.split('-')
              : [chunk, ''];
            const enPart = parts[0]?.trim();
            const uzPart = parts[1]?.trim();

            return (
              <div
                key={idx}
                className="p-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between gap-3 hover:border-[var(--color-text-muted)] transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="font-serif text-sm font-medium text-[var(--color-text)]">
                    {enPart}
                  </p>
                  {uzPart && (
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {uzPart}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePlayChunk(chunk)}
                  className={`h-8 px-2.5 shrink-0 ${
                    isPlaying ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  <Volume2 className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                  <span className="text-xs font-mono">Tinglash</span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Articulation Self-Check */}
      <div className="pt-2 border-t border-[var(--color-border)]">
        <div
          onClick={confirmSpeak}
          className={`p-3.5 rounded-md border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            speakConfirmed
              ? 'border-emerald-600/40 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200'
              : 'border-[var(--color-border)] bg-[var(--color-surface-subtle)] hover:border-[var(--color-accent)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${speakConfirmed ? 'bg-emerald-600/10 text-emerald-600' : 'bg-[var(--color-surface)] text-[var(--color-text)]'}`}>
              <Mic className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium">
                {speakConfirmed ? "Ovoz chiqarib talaffuz qilindi!" : "O‘zingiz ovoz chiqarib aytdingizmi?"}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Og‘iz mushaklari so‘zni eslab qolishi uchun 2-3 marta baland ovozda takrorlang.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant={speakConfirmed ? 'accent' : 'outline'}
            className="shrink-0 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              confirmSpeak();
            }}
          >
            {speakConfirmed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                Tasdiqlandi
              </>
            ) : (
              'Aytdim'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
