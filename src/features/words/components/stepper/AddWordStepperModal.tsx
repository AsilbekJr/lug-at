import * as React from 'react';
import { useAddWordStepperStore } from '@/features/words/store/useAddWordStepper';
import { useCreateWordMutation } from '@/features/words/api/words-api';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StepperHeader } from './StepperHeader';
import { HookStep } from './HookStep';
import { ListenAndSayStep } from './ListenAndSayStep';
import { OwnSentenceStep } from './OwnSentenceStep';
import { ConversationBridgeStep } from './ConversationBridgeStep';
import { CuratedCatalogView } from '../curriculum/CuratedCatalogView';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, BookOpen, Layers, PenTool } from 'lucide-react';

export const AddWordStepperModal: React.FC = () => {
  const {
    isOpen,
    closeStepper,
    step,
    wordInput,
    setWordInput,
    learnerLevel,
    isLoadingCard,
    cardData,
    chosenMnemonic,
    listenConfirmed,
    speakConfirmed,
    ownSentence,
    sentenceFeedback,
    replyFeedback,
    error,
    startFlowWithWord,
    openWithCuratedWord,
    goToStep,
    nextStep,
    prevStep,
    reset,
  } = useAddWordStepperStore();

  const createWordMutation = useCreateWordMutation();
  const [submittingFinal, setSubmittingFinal] = React.useState(false);
  const [entryMode, setEntryMode] = React.useState<'manual' | 'curated'>('manual');

  const handleStartFlow = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (wordInput.trim()) {
      await startFlowWithWord(wordInput.trim());
    }
  };

  const handleFinalFinish = async () => {
    if (!cardData) return;
    setSubmittingFinal(true);

    try {
      await createWordMutation.mutateAsync({
        word: cardData.word,
        pos: cardData.pos,
        ipa: cardData.ipa,
        uz_meaning: cardData.uz_meaning,
        item_type: useAddWordStepperStore.getState().itemType,
        chosen_mnemonic: chosenMnemonic || undefined,
        own_sentence: ownSentence || undefined,
        cardContent: {
          ...cardData,
          item_type: useAddWordStepperStore.getState().itemType,
        },
        recog_ok: true,
        listen_ok: listenConfirmed || true,
        write_ok: Boolean(sentenceFeedback),
        speak_ok: speakConfirmed || true,
      });

      reset();
      closeStepper();
    } catch (err) {
      console.error('So‘zni saqlashda xatolik:', err);
    } finally {
      setSubmittingFinal(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeStepper()}>
      <DialogContent
        className={`w-full p-4 sm:p-6 max-h-[90vh] flex flex-col overflow-hidden transition-all duration-150 ${
          !cardData && entryMode === 'curated' ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        {/* State 1: Fresh Word Selection Screen */}
        {!cardData && !isLoadingCard && (
          <div className="flex flex-col h-full overflow-hidden space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-[var(--color-surface-subtle)] rounded-[6px] border border-[var(--color-border)] shrink-0 mr-10 sm:mr-12">
              <button
                type="button"
                onClick={() => setEntryMode('manual')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-[4px] transition-colors ${
                  entryMode === 'manual'
                    ? 'bg-[var(--color-paper)] text-[var(--color-text)] shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" strokeWidth={1.5} />
                O‘zim so‘z kiritaman
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('curated')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-[4px] transition-colors ${
                  entryMode === 'curated'
                    ? 'bg-[var(--color-paper)] text-[var(--color-text)] shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={1.5} />
                Tayyor to‘plam (A1–C1)
              </button>
            </div>

            {/* Mode 1: Manual Input */}
            {entryMode === 'manual' ? (
              <div className="space-y-4 text-left py-1.5 px-2 overflow-y-auto">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-[var(--color-accent)]">
                    <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                    <h2 className="text-xl font-serif font-bold text-[var(--color-text)]">
                      Yangi so‘zni o‘rganish oqimi
                    </h2>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                    Daraja: {learnerLevel}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Linguist AI 4 bosqichli xotira texnikasi orqali so‘zni shaxsiy tajribangiz va nutqingizga bog‘laydi:
                </p>

                <form onSubmit={handleStartFlow} className="space-y-4">
                  <Input
                    label="O‘rganmoqchi bo‘lgan so‘zingiz (English):"
                    placeholder="masalan: candid, tenacious, resilience..."
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    error={error || undefined}
                    autoFocus
                  />

                  <div className="p-3 rounded-md bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] space-y-1">
                    <span className="font-semibold text-[var(--color-text)]">4 bosqich tartibi:</span>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li><strong>Hook</strong> — Ovoz, obraz yoki o‘zak ilgagini tanlash</li>
                      <li><strong>Listen & Say</strong> — 3 ta jonli birikmani tinglash va talaffuz qilish</li>
                      <li><strong>Own Sentence</strong> — Hayotingizdan shaxsiy jumla va murabbiy tekshiruvi</li>
                      <li><strong>Conversation Bridge</strong> — Savolga javob berib, so‘zni muloqotda qo‘llash</li>
                    </ol>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEntryMode('curated')}
                      className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 justify-center sm:justify-start"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Yoki tayyor mavzular to‘plamini ko‘ring
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={closeStepper}
                        className="flex-1 sm:flex-initial"
                      >
                        Bekor qilish
                      </Button>
                      <Button
                        type="submit"
                        variant="accent"
                        size="md"
                        disabled={!wordInput.trim()}
                        className="flex-1 sm:flex-initial"
                      >
                        <BookOpen className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                        O‘rganishni boshlash
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              /* Mode 2: Curated Catalog Browser */
              <div className="flex-1 min-h-0 overflow-hidden">
                <CuratedCatalogView
                  onSelectWord={(word) => {
                    openWithCuratedWord(word);
                  }}
                  compact={false}
                />
              </div>
            )}
          </div>
        )}

        {/* State 2: AI Loading Card Skeleton */}
        {isLoadingCard && (
          <div className="py-12 px-4 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--color-accent)]" strokeWidth={1.5} />
            <div className="space-y-1.5">
              <h3 className="text-base font-serif font-medium text-[var(--color-text)]">
                Linguist Coach kartochka tayyorlamoqda...
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
                "{wordInput}" so‘zi uchun eng kuchli assotsiatsiyalar, fonetika va muloqot savoli tahlil qilinmoqda.
              </p>
            </div>
          </div>
        )}

        {/* State 3: Active Stepper Flow */}
        {cardData && !isLoadingCard && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header */}
            <StepperHeader currentStep={step} onStepClick={goToStep} />

            {/* Scrollable Step Body */}
            <div className="flex-1 overflow-y-auto py-4 px-2">
              {step === 1 && <HookStep />}
              {step === 2 && <ListenAndSayStep />}
              {step === 3 && <OwnSentenceStep />}
              {step === 4 && <ConversationBridgeStep />}
            </div>

            {/* Sticky Stepper Navigation Footer */}
            <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2 mt-auto shrink-0 bg-[var(--color-surface)]">
              <div>
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                    Ortga
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={closeStepper}
                    className="text-xs text-[var(--color-text-muted)]"
                  >
                    Bekor qilish
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {step < 4 ? (
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    onClick={nextStep}
                    className="text-xs font-medium"
                  >
                    Keyingisi
                    <ArrowRight className="w-3.5 h-3.5 ml-1" strokeWidth={1.5} />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    onClick={handleFinalFinish}
                    disabled={submittingFinal || (replyFeedback ? !replyFeedback.used_target_word : false)}
                    className="text-xs font-medium"
                  >
                    {submittingFinal ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" strokeWidth={1.5} />
                        Saqlanmoqda...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
                        <span className="hidden sm:inline">Lug‘atga saqlash va FSRSni boshlash</span>
                        <span className="sm:hidden">Lug‘atga saqlash</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
