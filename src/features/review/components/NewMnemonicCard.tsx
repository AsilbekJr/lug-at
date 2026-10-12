import * as React from 'react';
import type { MnemonicItemOutput } from '@/lib/schemas/ai-coach';
import { Lightbulb, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewMnemonicCardProps {
  mnemonic: MnemonicItemOutput;
  onDismiss: () => void;
}

export const NewMnemonicCard: React.FC<NewMnemonicCardProps> = ({ mnemonic, onDismiss }) => {
  const getTitle = () => {
    switch (mnemonic.type) {
      case 'sound':
        return `Yangi ovoz ilgagi (Sound Hook: ${mnemonic.uz_hook || ''})`;
      case 'image':
        return 'Yangi ko‘rgazmali obraz (Visual Scene)';
      case 'root':
        return 'Yangi o‘zak va etimologiya (Root Explanation)';
    }
  };

  const getContent = () => {
    if (mnemonic.type === 'root') {
      return mnemonic.explanation_uz;
    }
    return mnemonic.scene_uz;
  };

  return (
    <div className="p-4 rounded-lg bg-[var(--color-surface)] border-2 border-[var(--color-accent)] space-y-3 animate-fadeIn text-left shadow-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--color-accent)] font-semibold text-xs">
          <Lightbulb className="w-4 h-4" strokeWidth={1.5} />
          <span>Xotirani mustahkamlash: {getTitle()}</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
          Lapses ≥ 2
        </span>
      </div>

      <p className="font-serif text-sm sm:text-base text-[var(--color-text)] leading-relaxed italic">
        "{getContent()}"
      </p>

      {mnemonic.type === 'root' && mnemonic.related_words && mnemonic.related_words.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-[var(--color-text-muted)] pt-1">
          <span>Bog‘liq so‘zlar:</span>
          {mnemonic.related_words.map((w) => (
            <span key={w} className="font-mono text-xs px-1.5 py-0.5 bg-[var(--color-surface-subtle)] rounded text-[var(--color-text)]">
              {w}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDismiss}
          className="text-xs"
        >
          <Check className="w-3.5 h-3.5 mr-1 text-[var(--color-accent)]" strokeWidth={1.5} />
          Yangi ilgak bilan davom etish
        </Button>
      </div>
    </div>
  );
};
