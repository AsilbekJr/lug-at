import * as React from 'react';
import { useAddWordStepperStore } from '@/features/words/store/useAddWordStepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Check, Edit3, Sparkles } from 'lucide-react';
import type { MnemonicItemOutput } from '@/lib/schemas/ai-coach';

export const HookStep: React.FC = () => {
  const {
    cardData,
    chosenMnemonicIndex,
    selectMnemonic,
    isEditingMnemonic,
    toggleEditingMnemonic,
    customMnemonicText,
    setCustomMnemonicText,
  } = useAddWordStepperStore();

  // Filter out null mnemonics as per requirement ("hide null ones")
  const availableMnemonics = (cardData?.mnemonics || []).filter(
    (m): m is MnemonicItemOutput => m !== null
  );

  // Keyboard shortcut for [1], [2], [3]
  React.useEffect(() => {
    if (!cardData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingMnemonic || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (['1', '2', '3'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (index < availableMnemonics.length) {
          selectMnemonic(index);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cardData, availableMnemonics.length, isEditingMnemonic, selectMnemonic]);

  if (!cardData) return null;

  const getMnemonicLabel = (m: MnemonicItemOutput) => {
    switch (m.type) {
      case 'sound':
        return `Ovoz ilgagi (Sound Hook: ${m.uz_hook || 'O‘xshash tovush'})`;
      case 'image':
        return 'Ko‘rgazmali obraz (Visual Scene)';
      case 'root':
        return `O‘zak va etimologiya (Root)`;
      default:
        return 'Mnemonic';
    }
  };

  return (
    <div className="space-y-5 text-left animate-fadeIn">
      {/* Target Word Overview */}
      <div className="p-4 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[var(--color-text)]">
              {cardData.word}
            </h2>
            {cardData.ipa && (
              <span className="font-mono text-sm text-[var(--color-text-muted)]">
                {cardData.ipa}
              </span>
            )}
          </div>
          {cardData.pos && (
            <Badge variant="outline" className="text-xs">
              {cardData.pos}
            </Badge>
          )}
        </div>
        <p className="mt-2 text-base text-[var(--color-text)] font-medium">
          {cardData.uz_meaning}
        </p>
      </div>

      {/* Instructions */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[var(--color-accent)]" strokeWidth={1.5} />
          1-qadam: Xotira ilgagini tanlang (Hook)
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          So‘z ongingizda tezroq muhrlanishi uchun eng ta’sirli assotsiatsiyani tanlang yoki o‘zgartiring.
        </p>
      </div>

      {/* Mnemonics Cards list */}
      <div className="space-y-3">
        {availableMnemonics.map((item, idx) => {
          const isSelected = chosenMnemonicIndex === idx;

          return (
            <div
              key={`${item.type}-${idx}`}
              onClick={() => selectMnemonic(idx)}
              className={`p-3.5 rounded-md border text-sm transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-[var(--color-accent)] bg-[var(--color-surface)] ring-1 ring-[var(--color-accent)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-muted)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                    [{idx + 1}]
                  </span>
                  <span className="font-medium text-xs text-[var(--color-text)]">
                    {getMnemonicLabel(item)}
                  </span>
                </div>
                {isSelected && (
                  <span className="text-xs text-[var(--color-accent)] flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5" strokeWidth={2} />
                    Tanlangan
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[var(--color-text)] leading-relaxed font-serif">
                {item.type === 'root' ? item.explanation_uz : item.scene_uz}
              </p>

              {item.type === 'root' && item.related_words && item.related_words.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[var(--color-text-muted)]">Bog‘liq so‘zlar:</span>
                  {item.related_words.map((w) => (
                    <span
                      key={w}
                      className="text-[11px] font-mono px-1 py-0.2 bg-[var(--color-surface-subtle)] rounded text-[var(--color-text)]"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom edit mode */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleEditingMnemonic}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
            {isEditingMnemonic ? 'Tahrirni yopish' : 'Ilgakni tahrirlash / O‘z variantim'}
          </Button>
        </div>

        {isEditingMnemonic && (
          <div className="space-y-2 p-3 rounded-md bg-[var(--color-surface-subtle)] border border-[var(--color-border)] animate-fadeIn">
            <Textarea
              label="Shaxsiy xotira sahnangiz:"
              value={customMnemonicText}
              onChange={(e) => setCustomMnemonicText(e.target.value)}
              rows={3}
              placeholder="O‘zingizga yoqqan jonli, hissiy yoki kulgili tasavvurni yozing..."
            />
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Kengash: Ilgak qanchalik g‘alati va hissiy bo‘lsa, miyangiz uni shunchalik uzoq saqlaydi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
