import * as React from 'react';
import { Rating, type RecordLogItem } from 'ts-fsrs';
import { getIntervalPreviewLabel } from '@/lib/fsrs';
import { Button } from '@/components/ui/button';

export interface RatingBarProps {
  previews: Record<Rating, RecordLogItem> | null;
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}

export function RatingBar({ previews, onRate, disabled }: RatingBarProps) {
  React.useEffect(() => {
    if (disabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '1') onRate(Rating.Again);
      if (e.key === '2') onRate(Rating.Hard);
      if (e.key === '3') onRate(Rating.Good);
      if (e.key === '4') onRate(Rating.Easy);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onRate]);
  const options = [
    {
      rating: Rating.Again,
      label: 'Qaytadan',
      shortcut: '1',
      variant: 'rating-again' as const,
      colorText: 'text-rating-again',
      hoverBg: 'hover:bg-rating-again/10',
      border: 'border-rating-again/40',
    },
    {
      rating: Rating.Hard,
      label: 'Qiyin',
      shortcut: '2',
      variant: 'rating-hard' as const,
      colorText: 'text-rating-hard',
      hoverBg: 'hover:bg-rating-hard/10',
      border: 'border-rating-hard/40',
    },
    {
      rating: Rating.Good,
      label: 'Yaxshi',
      shortcut: '3',
      variant: 'rating-good' as const,
      colorText: 'text-rating-good',
      hoverBg: 'hover:bg-rating-good/10',
      border: 'border-rating-good/40',
    },
    {
      rating: Rating.Easy,
      label: 'Oson',
      shortcut: '4',
      variant: 'rating-easy' as const,
      colorText: 'text-rating-easy',
      hoverBg: 'hover:bg-rating-easy/10',
      border: 'border-rating-easy/40',
    },
  ];

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
      {options.map((opt) => {
        const item = previews ? previews[opt.rating] : null;
        const intervalLabel = item ? getIntervalPreviewLabel(item) : '—';

        return (
          <Button
            key={opt.rating}
            type="button"
            variant={opt.variant}
            disabled={disabled}
            onClick={() => onRate(opt.rating)}
            className={`flex flex-col items-center justify-center p-3 h-auto min-h-[56px] transition-all duration-150 ${opt.border} ${opt.hoverBg}`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-semibold ${opt.colorText}`}>
                {opt.label}
              </span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 text-[10px] font-mono rounded bg-paper-subtle border border-border text-ink-muted">
                {opt.shortcut}
              </kbd>
            </div>
            <span className="text-[11px] font-mono text-ink-muted mt-0.5">
              {intervalLabel}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
