import * as React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Target } from 'lucide-react';
import type { StatsSummary } from '@/features/stats/api/stats-api';

interface RetentionAndStreakCardProps {
  retentionRate: number;
  streakDays: number;
  bestStreakDays: number;
  activityCalendar: StatsSummary['activityCalendar'];
}

export const RetentionAndStreakCard: React.FC<RetentionAndStreakCardProps> = ({
  retentionRate,
  streakDays,
  bestStreakDays,
  activityCalendar,
}) => {
  return (
    <Card variant="editorial" className="p-4 sm:p-5 text-left flex flex-col justify-between">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-serif font-bold text-ink">
              Xotira saqlanishi va Davomiylik
            </CardTitle>
            <p className="text-xs text-ink-muted mt-0.5">
              FSRS unutilish egri chizig‘i (Forgetting Curve) va kunlik odat intizomi.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-[4px]">
            <Flame className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{streakDays} kunlik streak</span>
          </div>
        </CardHeader>

        {/* Retention Meter */}
        <div className="space-y-2 pt-1 pb-4 border-b border-border">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-ink flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
              O‘rtacha Retention (Eslab qolish darajasi):
            </span>
            <span className="font-serif font-bold text-xl text-ink">
              {retentionRate}%
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-paper-subtle border border-border overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(10, retentionRate))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted pt-0.5">
            <span>Minimum: 80%</span>
            <span>Maqsadli me’yor: 90%</span>
            <span>Optimal: 95%</span>
          </div>
        </div>

        {/* 14-Day Activity Streak Dots */}
        <div className="pt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink">Oxirgi 14 kunlik faollik:</span>
            <span className="text-[11px] font-mono text-ink-muted">
              Rekord: {bestStreakDays} kun
            </span>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 pt-1">
            {activityCalendar.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-[4px] border text-[10px] font-mono flex items-center justify-center transition-colors ${
                    item.active
                      ? 'bg-accent text-white border-accent font-semibold'
                      : 'bg-paper-subtle border-border text-ink-muted'
                  }`}
                  title={`${item.date}: ${item.count} ta takrorlash`}
                >
                  {item.active ? item.count : ''}
                </div>
                <span className="text-[9px] font-mono text-ink-muted">
                  {item.dayLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-ink-muted pt-3 mt-3 border-t border-border leading-relaxed">
        Har kuni kamida 1 marta mashg‘ulot o‘tash FSRS barqarorligini 3 barobarga oshiradi.
      </p>
    </Card>
  );
};
