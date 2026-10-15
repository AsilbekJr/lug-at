import { CheckCircle2, RotateCcw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Rating } from 'ts-fsrs';
import { Link } from 'react-router-dom';

export interface ReviewSummaryProps {
  totalReviewed: number;
  sessionStats?: {
    againCount: number;
    hardCount: number;
    goodCount: number;
    easyCount: number;
  };
  ratings?: { userWordId: string; rating: Rating }[];
  onRestart: () => void;
  isRestarting?: boolean;
}

export function ReviewSummary({ totalReviewed, ratings = [], sessionStats, onRestart, isRestarting }: ReviewSummaryProps) {
  const counts = sessionStats
    ? {
        [Rating.Again]: sessionStats.againCount,
        [Rating.Hard]: sessionStats.hardCount,
        [Rating.Good]: sessionStats.goodCount,
        [Rating.Easy]: sessionStats.easyCount,
      }
    : {
        [Rating.Again]: ratings.filter((r) => r.rating === Rating.Again).length,
        [Rating.Hard]: ratings.filter((r) => r.rating === Rating.Hard).length,
        [Rating.Good]: ratings.filter((r) => r.rating === Rating.Good).length,
        [Rating.Easy]: ratings.filter((r) => r.rating === Rating.Easy).length,
      };

  const successRate = totalReviewed > 0
    ? Math.round(((counts[Rating.Good] + counts[Rating.Easy]) / totalReviewed) * 100)
    : 100;

  return (
    <div className="max-w-lg mx-auto p-6 sm:p-8 rounded-[8px] border border-border bg-paper text-center my-6 space-y-6">
      <div className="w-12 h-12 rounded-[6px] border border-border bg-paper-subtle flex items-center justify-center text-accent mx-auto">
        <CheckCircle2 className="w-6 h-6 text-accent" strokeWidth={1.5} />
      </div>

      <div className="space-y-1.5">
        <h2 className="font-serif font-bold text-2xl text-ink">
          Takrorlash sessiyasi yakunlandi
        </h2>
        <p className="font-sans text-sm text-ink-muted max-w-[40ch] mx-auto leading-relaxed">
          Siz barcha navbatdagi so'zlarni muvaffaqiyatli takrorladingiz. FSRS algoritmi xotirangiz barqarorligini hisoblab chiqdi.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        <div className="p-3 rounded-[6px] bg-paper-subtle border border-border-subtle">
          <span className="text-[11px] text-ink-subtle block">Qaytadan</span>
          <span className="text-lg font-mono font-bold text-rating-again">
            {counts[Rating.Again]}
          </span>
        </div>
        <div className="p-3 rounded-[6px] bg-paper-subtle border border-border-subtle">
          <span className="text-[11px] text-ink-subtle block">Qiyin</span>
          <span className="text-lg font-mono font-bold text-rating-hard">
            {counts[Rating.Hard]}
          </span>
        </div>
        <div className="p-3 rounded-[6px] bg-paper-subtle border border-border-subtle">
          <span className="text-[11px] text-ink-subtle block">Yaxshi</span>
          <span className="text-lg font-mono font-bold text-rating-good">
            {counts[Rating.Good]}
          </span>
        </div>
        <div className="p-3 rounded-[6px] bg-paper-subtle border border-border-subtle">
          <span className="text-[11px] text-ink-subtle block">Oson</span>
          <span className="text-lg font-mono font-bold text-rating-easy">
            {counts[Rating.Easy]}
          </span>
        </div>
      </div>

      {/* Accuracy Indicator */}
      <div className="p-3 rounded-[6px] bg-paper-subtle/50 border border-border flex items-center justify-between text-xs">
        <span className="text-ink-muted">Muvaffaqiyatli eslash darajasi:</span>
        <span className="font-mono font-bold text-ink text-sm">{successRate}%</span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
        <Button variant="secondary" size="md" onClick={onRestart} disabled={isRestarting}>
          <RotateCcw className="w-4 h-4 mr-2" strokeWidth={1.5} />
          {isRestarting ? 'Navbat yangilanmoqda...' : 'Qayta takrorlash'}
        </Button>
        <Link to="/words" className="w-full sm:w-auto">
          <Button variant="accent" size="md" className="w-full">
            <BookOpen className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Lug'atga o'tish
          </Button>
        </Link>
      </div>
    </div>
  );
}
