import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import type { StatsSummary } from '@/features/stats/api/stats-api';

interface WeakestSkillCardProps {
  skills: StatsSummary['skills'];
  weakestSkill: StatsSummary['weakestSkill'];
}

export const WeakestSkillCard: React.FC<WeakestSkillCardProps> = ({
  skills,
  weakestSkill,
}) => {
  const skillItems = [
    { ...skills.recog, iconKey: 'eye' },
    { ...skills.listen, iconKey: 'ear' },
    { ...skills.write, iconKey: 'pen' },
    { ...skills.speak, iconKey: 'mic' },
  ];

  return (
    <Card variant="editorial" className="p-4 sm:p-5 text-left flex flex-col justify-between">
      <div>
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-serif font-bold text-ink">
              4 Ko‘nikma holati va zaif nuqtalar
            </CardTitle>
            <p className="text-xs text-ink-muted mt-0.5">
              So‘zni to‘liq o‘zlashtirish uchun 4 ta asosiy qobiliyat balansi.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-paper-subtle border border-border text-ink-muted">
            Target: 85%+
          </span>
        </CardHeader>

        {/* 4 Skill progress bars */}
        <div className="space-y-3 pt-2">
          {skillItems.map((s) => {
            const isWeakest = s.key === weakestSkill.key;
            return (
              <div key={s.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {s.percentage >= 80 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className={`w-3.5 h-3.5 ${isWeakest ? 'text-accent' : 'text-ink-muted'}`} />
                    )}
                    <span className={`font-medium ${isWeakest ? 'text-ink font-semibold' : 'text-ink'}`}>
                      {s.labelUz}
                    </span>
                    {isWeakest && (
                      <span className="text-[10px] uppercase font-mono px-1 py-0 rounded bg-accent/10 text-accent">
                        Eng zaif
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-ink-muted">
                    {s.percentage}% ({s.okCount}/{s.total})
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-paper-subtle border border-border overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isWeakest ? 'bg-accent' : s.percentage >= 80 ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-ink-muted'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, s.percentage))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weakest skill editorial recommendation */}
      <div className="mt-4 p-3 rounded-[6px] bg-paper-subtle border border-border text-xs flex items-start gap-2.5">
        <TrendingUp className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
        <div className="space-y-0.5">
          <span className="font-semibold text-ink">
            Tavsiya: {weakestSkill.labelUz} ({weakestSkill.percentage}%)
          </span>
          <p className="text-ink-muted leading-relaxed">
            {weakestSkill.recommendationUz}
          </p>
        </div>
      </div>
    </Card>
  );
};
