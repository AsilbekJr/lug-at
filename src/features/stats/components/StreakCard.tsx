import { Card, CardContent } from '@/components/ui/card';
import { Flame, Layers, Clock, Target } from 'lucide-react';
import type { StatsSummary } from '@/features/stats/api/stats-api';

export function QuickStatsCards({ stats }: { stats: StatsSummary }) {
  const cards = [
    {
      title: "Jami lug‘at",
      value: stats.totalWords,
      subtext: "ta so‘z kiritilgan",
      icon: Layers,
    },
    {
      title: "Xotirada saqlanish",
      value: `${stats.retentionRate}%`,
      subtext: "o‘rtacha eslab qolish darajasi",
      icon: Target,
      highlight: stats.retentionRate >= 90,
    },
    {
      title: "Faollik davomiyligi",
      value: `${stats.streakDays} kun`,
      subtext: `rekord: ${stats.bestStreakDays} kun`,
      icon: Flame,
    },
    {
      title: "Kutilayotgan takrorlash",
      value: stats.dueTodayCount,
      subtext: "bugun takrorlash zarur",
      icon: Clock,
      highlight: stats.dueTodayCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} variant="default" className="text-left">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between text-ink-muted mb-2">
                <span className="text-xs font-sans font-medium">{item.title}</span>
                <Icon className="w-4 h-4 text-ink-muted" strokeWidth={1.5} />
              </div>
              <div className={`text-2xl sm:text-3xl font-serif font-bold tracking-tight ${item.highlight ? 'text-accent' : 'text-ink'}`}>
                {item.value}
              </div>
              <p className="text-[11px] text-ink-subtle mt-1">
                {item.subtext}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
