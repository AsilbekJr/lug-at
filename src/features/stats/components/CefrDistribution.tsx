import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CefrLevel } from '@/features/words/types';

export function CefrDistribution({
  breakdown,
  totalWords,
}: {
  breakdown: Record<CefrLevel, number>;
  totalWords: number;
}) {
  const levels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <Card className="text-left">
      <CardHeader>
        <CardTitle>CEFR Darajalari taqsimoti</CardTitle>
        <p className="text-xs text-ink-muted">
          Lug'atdagi so'zlarning til bilish darajalari bo'yicha ko'rsatkichi
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {levels.map((level) => {
          const count = breakdown[level] || 0;
          const percentage = totalWords > 0 ? Math.round((count / totalWords) * 100) : 0;

          return (
            <div key={level} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-ink">{level}</span>
                <span className="text-ink-muted">
                  {count} ta <span className="font-mono text-ink-subtle">({percentage}%)</span>
                </span>
              </div>
              <div className="h-2 w-full bg-paper-subtle border border-border-subtle rounded-[3px] overflow-hidden">
                <div
                  className="h-full bg-accent transition-[width] duration-200 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
