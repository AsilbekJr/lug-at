import type { EnrichedUserWord } from '@/features/words/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Volume2,
  Trash2,
  CheckCircle2,
  Circle,
  Brain,
  Sparkles,
  BookOpen,
  Target,
} from 'lucide-react';
import { formatDate, formatInterval } from '@/lib/utils';
import { State } from 'ts-fsrs';
import { useSpeech } from '@/features/words/hooks/use-speech';
import { useAddWordStepperStore } from '@/features/words/store/useAddWordStepper';

export interface WordDetailDialogProps {
  item: EnrichedUserWord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (userWordId: string) => void;
  isDeleting?: boolean;
}

export function WordDetailDialog({
  item,
  open,
  onOpenChange,
  onDelete,
  isDeleting,
}: WordDetailDialogProps) {
  if (!item) return null;
  const { word, card, userWord } = item;
  const { speak, isSpeaking } = useSpeech();
  const { openStepper } = useAddWordStepperStore();

  const handleSpeak = () => {
    speak(word.word);
  };

  const handleRereview = () => {
    onOpenChange(false);
    openStepper(word.word);
  };

  const stateLabels: Record<number, string> = {
    [State.New]: 'Yangi so‘z',
    [State.Learning]: 'O‘rganish bosqichida',
    [State.Review]: 'Doimiy takrorlashda',
    [State.Relearning]: 'Qayta eslash bosqichida',
  };

  const daysToDue = (new Date(userWord.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const cefr = card?.content?.cefr_level;

  // Retention calculation: R = 0.9^(t / S)
  const now = Date.now();
  const lastDate = userWord.last_review
    ? new Date(userWord.last_review).getTime()
    : new Date(userWord.created_at).getTime();
  const elapsedDays = Math.max(0, (now - lastDate) / (1000 * 60 * 60 * 24));
  const retention = userWord.stability > 0
    ? Math.round(Math.pow(0.9, elapsedDays / userWord.stability) * 100)
    : 90;

  // Active mnemonic
  const activeMnemonic = userWord.chosen_mnemonic || card?.content?.mnemonics?.find(Boolean);
  const mnemonicText = activeMnemonic
    ? 'scene_uz' in activeMnemonic
      ? activeMnemonic.scene_uz
      : activeMnemonic.explanation_uz
    : null;

  const modelSentences = card?.content?.model_sentences;

  // 4 Mastery Indicators
  const indicators = [
    { key: 'recog', label: 'Tanish', ok: userWord.recog_ok },
    { key: 'listen', label: 'Eshitish', ok: userWord.listen_ok },
    { key: 'write', label: 'Yozish', ok: userWord.write_ok },
    { key: 'speak', label: 'Gapirish', ok: userWord.speak_ok },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col overflow-hidden p-4 sm:p-6">
        {/* Header */}
        <DialogHeader className="shrink-0 pb-3 border-b border-border">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <DialogTitle className="text-2xl sm:text-3xl font-serif font-bold text-ink tracking-tight">
                {word.word}
              </DialogTitle>
              {word.ipa && (
                <span className="font-mono text-xs sm:text-sm text-ink-muted">{word.ipa}</span>
              )}
              {word.pos && (
                <span className="font-sans text-xs px-1.5 py-0.5 rounded bg-paper-subtle border border-border text-ink-muted">
                  {word.pos}
                </span>
              )}
              <button
                type="button"
                onClick={handleSpeak}
                aria-label="Talaffuzni tinglash"
                className={`p-1 rounded text-ink-muted hover:text-accent transition-colors ${
                  isSpeaking ? 'text-accent' : ''
                }`}
              >
                <Volume2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {cefr && (
                <Badge variant="outline" className="font-mono text-xs uppercase px-2 py-0.5">
                  {cefr}
                </Badge>
              )}
              <Badge variant="accent" className="text-xs">
                {stateLabels[userWord.state] || 'O‘rganilmoqda'}
              </Badge>
            </div>
          </div>

          <DialogDescription className="text-xs text-ink-muted pt-0.5">
            {userWord.created_at && `${formatDate(userWord.created_at)} da lug‘atga kiritilgan`}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 text-left">
          {/* Meaning & Collocations */}
          <div className="p-3.5 rounded-[6px] bg-paper-subtle border border-border space-y-2">
            <div>
              <span className="text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wider block mb-0.5">
                O‘zbekcha ma’nosi
              </span>
              <p className="font-sans text-base font-medium text-ink leading-relaxed">
                {word.uz_meaning}
              </p>
            </div>

            {card?.content?.chunks && card.content.chunks.length > 0 && (
              <div className="pt-2 border-t border-border-subtle">
                <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                  Jonli birikmalar (Collocations)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {card.content.chunks.map((chunk, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-[4px] bg-paper border border-border text-xs text-ink font-mono"
                    >
                      {chunk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4 Mastery Indicators Bar */}
          <div className="p-3.5 rounded-[6px] border border-border bg-paper space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                4 Ko‘nikma holati (Mastery Indicators)
              </span>
              <span className="text-[11px] font-mono text-ink-muted">
                {indicators.filter((i) => i.ok).length} / 4 o‘zlashtirildi
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {indicators.map((ind) => (
                <div
                  key={ind.key}
                  className={`p-2 rounded-[6px] border flex items-center justify-between transition-colors ${
                    ind.ok
                      ? 'bg-paper-subtle border-emerald-600/30 dark:border-emerald-500/30'
                      : 'bg-paper border-border text-ink-muted'
                  }`}
                >
                  <span className="text-xs font-medium text-ink">{ind.label}</span>
                  {ind.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-ink-muted" strokeWidth={1.5} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Context Model Sentences */}
          {modelSentences && (
            <div className="p-3.5 rounded-[6px] bg-paper border border-border border-l-2 border-l-accent space-y-2.5">
              <span className="text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wider block">
                Model jumlalar (3 zamonda)
              </span>
              <div className="space-y-2 text-xs">
                {modelSentences.present && !modelSentences.present.includes('She knows how to use') && modelSentences.present.trim().toLowerCase() !== word.word.trim().toLowerCase() && (
                  <div>
                    <span className="font-semibold text-accent font-mono text-[10px] block">Hozirgi:</span>
                    <p className="font-serif italic text-sm text-ink leading-relaxed">
                      "{modelSentences.present}"
                    </p>
                  </div>
                )}
                {modelSentences.past && !modelSentences.past.includes('learned how to use') && modelSentences.past.trim().toLowerCase() !== word.word.trim().toLowerCase() && (
                  <div>
                    <span className="font-semibold text-ink-muted font-mono text-[10px] block">O‘tgan:</span>
                    <p className="font-serif italic text-sm text-ink leading-relaxed">
                      "{modelSentences.past}"
                    </p>
                  </div>
                )}
                {modelSentences.future && !modelSentences.future.includes('will remember') && modelSentences.future.trim().toLowerCase() !== word.word.trim().toLowerCase() && (
                  <div>
                    <span className="font-semibold text-ink-muted font-mono text-[10px] block">Kelasi:</span>
                    <p className="font-serif italic text-sm text-ink leading-relaxed">
                      "{modelSentences.future}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Learner's Own Personal Sentence */}
          {userWord.own_sentence && (
            <div className="p-3.5 rounded-[6px] bg-paper-subtle border border-border text-xs space-y-1">
              <span className="font-semibold text-ink block flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                Shaxsiy hayotiy jumla (Own Sentence):
              </span>
              <p className="font-serif italic text-sm text-ink leading-relaxed pl-2 border-l border-accent">
                "{userWord.own_sentence}"
              </p>
            </div>
          )}

          {/* Mnemonic Hook */}
          {mnemonicText && (
            <div className="p-3 rounded-[6px] bg-paper-subtle border border-border text-xs space-y-1">
              <span className="font-semibold text-accent block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                Xotira ilgagi (Mnemonic):
              </span>
              <p className="text-ink leading-relaxed">
                {mnemonicText}
              </p>
            </div>
          )}

          {/* Memory Strength & FSRS Telemetry */}
          <div className="p-3.5 rounded-[6px] border border-border bg-paper space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                Xotira quvvati (FSRS Telemetriya)
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs text-ink">
                <span>Retention:</span>
                <strong className="text-accent font-bold">{retention}%</strong>
              </div>
            </div>

            {/* Retention Bar */}
            <div className="h-1.5 w-full rounded-full bg-paper-subtle border border-border overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(10, retention))}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2 rounded-[4px] bg-paper-subtle border border-border">
                <div className="text-ink-subtle text-[10px]">Barqarorlik (S)</div>
                <div className="font-mono font-semibold text-ink text-xs mt-0.5">
                  {userWord.stability.toFixed(1)} kun
                </div>
              </div>

              <div className="p-2 rounded-[4px] bg-paper-subtle border border-border">
                <div className="text-ink-subtle text-[10px]">Qiyinchilik (D)</div>
                <div className="font-mono font-semibold text-ink text-xs mt-0.5">
                  {userWord.difficulty.toFixed(1)} / 10
                </div>
              </div>

              <div className="p-2 rounded-[4px] bg-paper-subtle border border-border">
                <div className="text-ink-subtle text-[10px]">Takrorlar soni</div>
                <div className="font-mono font-semibold text-ink text-xs mt-0.5">
                  {userWord.reps} marta
                </div>
              </div>

              <div className="p-2 rounded-[4px] bg-paper-subtle border border-border">
                <div className="text-ink-subtle text-[10px]">Keyingi muddat</div>
                <div className="font-mono font-semibold text-ink text-xs mt-0.5">
                  {daysToDue <= 0 ? 'Hozir kutilmoqda' : formatInterval(daysToDue)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="shrink-0 pt-3 border-t border-border flex items-center justify-between gap-2 mt-auto">
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => {
                if (window.confirm(`"${word.word}" so‘zini o‘chirishni tasdiqlaysizmi?`)) {
                  onDelete(userWord.id);
                  onOpenChange(false);
                }
              }}
              className="text-rating-again border-rating-again/30 hover:bg-rating-again/10 text-xs h-8"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
              O‘chirish
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRereview}
              className="text-xs h-8"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-accent" strokeWidth={1.5} />
              Qayta o‘rganish
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Yopish
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
