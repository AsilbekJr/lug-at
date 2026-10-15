import * as React from 'react';
import { useReviewSessionStore } from '@/features/review/store/useReviewSessionStore';
import { useSpeech } from '@/features/words/hooks/use-speech';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Volume2, CheckCircle2, XCircle, Headphones } from 'lucide-react';

export const DictationExercise: React.FC = () => {
  const {
    currentExercise,
    userAnswer,
    setUserAnswer,
    isAnswerSubmitted,
    submitAnswer,
    isCorrect,
  } = useReviewSessionStore();
  const { speak, isSpeaking } = useSpeech();

  const audioText = currentExercise?.type === 'dictation'
    ? currentExercise.audio_text || currentExercise.answer
    : '';

  const [speed, setSpeed] = React.useState<number>(1.0);
  const speedRef = React.useRef(speed);
  speedRef.current = speed;

  const playAudio = React.useCallback(
    (rateToUse?: number) => {
      const activeRate = rateToUse !== undefined ? rateToUse : speedRef.current;
      speak(audioText, { rate: activeRate });
    },
    [speak, audioText]
  );

  // Autoplay strictly once per audioText change
  const hasAutoplayedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (audioText && hasAutoplayedRef.current !== audioText) {
      hasAutoplayedRef.current = audioText;
      playAudio(speedRef.current);
    }
  }, [audioText, playAudio]);

  // Spacebar keydown listener
  React.useEffect(() => {
    if (!audioText) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        playAudio(speedRef.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioText, playAudio]);

  if (!currentExercise || currentExercise.type !== 'dictation') return null;

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
        <Headphones className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={1.5} />
        <span>2-bosqich: Diktant (Dictation)</span>
      </div>

      {/* Audio Play Centerpiece with Slowdown Controls */}
      <div className="p-6 sm:p-8 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          {/* Main Play Audio Button */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => playAudio(speed)}
            className="rounded-full w-14 h-14 p-0 border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all shadow-none"
            title={`Tinglash (${speed}x)`}
          >
            <Volume2 className={`w-7 h-7 ${isSpeaking ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
          </Button>

          {/* Quick Slowdown Button */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              setSpeed(0.6);
              playAudio(0.6);
            }}
            className={`rounded-full w-12 h-12 p-0 border transition-all shadow-none ${
              speed === 0.6
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] bg-[var(--color-paper)]'
            }`}
            title="Sekinlashtirilgan tezlikda tinglash (0.6x)"
          >
            <span className="font-mono text-xs font-bold">0.6x</span>
          </Button>
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">
            Eshitilgan jumlani yozing
          </p>

          {/* Speed Selector */}
          <div className="flex items-center justify-center gap-2 mt-2.5">
            <span className="text-xs text-[var(--color-text-muted)]">
              Tezlik:
            </span>
            <div className="inline-flex rounded border border-[var(--color-border)] bg-[var(--color-paper)] p-0.5 text-xs font-mono">
              {[
                { label: '1.0x', val: 1.0 },
                { label: '0.75x', val: 0.75 },
                { label: '0.6x (Sekin)', val: 0.6 },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => {
                    setSpeed(s.val);
                    playAudio(s.val);
                  }}
                  className={`px-2.5 py-1 rounded transition-colors text-xs font-mono font-medium ${
                    speed === s.val
                      ? 'bg-[var(--color-accent)] text-white font-semibold shadow-xs'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
            [Space] qayta eshitish
          </p>
        </div>
      </div>

      {/* Text Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={isAnswerSubmitted}
          placeholder="Eshitgan jumlani kiriting..."
          className="font-serif text-lg py-3"
          autoFocus
        />

        {!isAnswerSubmitted && (
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="accent"
              size="md"
              disabled={!userAnswer.trim()}
            >
              Tekshirish [Enter]
            </Button>
          </div>
        )}
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
              {isCorrect ? "To‘g‘ri eshitildi va yozildi!" : "Imloda tafovut mavjud:"}
            </p>
          </div>

          <div className="pt-1 text-sm font-serif">
            <span className="text-xs font-sans text-[var(--color-text-muted)] block">To‘g‘ri matn:</span>
            <p className="text-[var(--color-text)] font-medium">"{currentExercise.answer}"</p>
          </div>
        </div>
      )}
    </div>
  );
};
