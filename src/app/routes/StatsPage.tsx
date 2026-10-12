import { useStatsQuery } from '@/features/stats/api/stats-api';
import { QuickStatsCards } from '@/features/stats/components/StreakCard';
import { ForecastChart } from '@/features/stats/components/ForecastChart';
import { CefrDistribution } from '@/features/stats/components/CefrDistribution';
import { RetentionAndStreakCard } from '@/features/stats/components/RetentionAndStreakCard';
import { WeakestSkillCard } from '@/features/stats/components/WeakestSkillCard';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/feedback/error-alert';
import { Brain } from 'lucide-react';

export function StatsPage() {
  const { data: stats, isLoading, isError, error, refetch } = useStatsQuery();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[8px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-[8px]" />
          <Skeleton className="h-64 w-full rounded-[8px]" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <ErrorAlert
          title="Statistikani yuklashda xatolik"
          message={error instanceof Error ? error.message : "Iltimos, qaytadan urinib ko'ring."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 text-left">
      {/* Title */}
      <div className="pb-4 border-b border-border">
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-ink tracking-tight">
          O‘zlashtirish tahlili
        </h1>
        <p className="font-sans text-sm text-ink-muted mt-1 leading-relaxed max-w-[55ch]">
          Xotira barqarorligi, CEFR darajalari va FSRS algoritmi hisoblagan interval intervallari.
        </p>
      </div>

      {/* Quick Metric Cards */}
      <QuickStatsCards stats={stats} />

      {/* Phase 5: Retention & Streak + Weakest Skill Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RetentionAndStreakCard
          retentionRate={stats.retentionRate}
          streakDays={stats.streakDays}
          bestStreakDays={stats.bestStreakDays}
          activityCalendar={stats.activityCalendar}
        />
        <WeakestSkillCard
          skills={stats.skills}
          weakestSkill={stats.weakestSkill}
        />
      </div>

      {/* Two Column Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ForecastChart forecast={stats.forecastNext7Days} />
        <CefrDistribution breakdown={stats.cefrBreakdown} totalWords={stats.totalWords} />
      </div>

      {/* Editorial FSRS Explanation */}
      <Card variant="editorial" className="p-6">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="space-y-2">
            <h3 className="font-serif font-semibold text-lg text-ink">
              FSRS (Free Spaced Repetition Scheduler) qanday ishlaydi?
            </h3>
            <p className="font-sans text-sm text-ink-muted leading-relaxed reading-measure">
              FSRS inson miyasining unutilish egri chizig‘ini (Ebbinghaus Forgetting Curve) modellashtiruvchi zamonaviy algoritmdir.
              Har bir bahongiz (Qaytadan, Qiyin, Yaxshi, Oson) asosida so‘zning <strong>Barqarorlik (Stability)</strong> va <strong>Qiyinchilik (Difficulty)</strong> ko‘rsatkichlari qayta hisoblanadi.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-[4px] bg-paper-subtle border border-border-subtle">
                <span className="font-semibold text-ink block">Barqarorlik (S):</span>
                <span className="text-ink-muted">So‘zni 90% ehtimollik bilan eslab qolish mumkin bo‘lgan kunlar soni.</span>
              </div>
              <div className="p-2.5 rounded-[4px] bg-paper-subtle border border-border-subtle">
                <span className="font-semibold text-ink block">Qiyinchilik (D):</span>
                <span className="text-ink-muted">1 dan 10 gacha bo‘lgan shkala bo‘yicha so‘zning murakkablik darajasi.</span>
              </div>
              <div className="p-2.5 rounded-[4px] bg-paper-subtle border border-border-subtle">
                <span className="font-semibold text-ink block">Interval:</span>
                <span className="text-ink-muted">Xotirangiz zo‘riqmasdan, optimal vaqtda yangilanishi uchun belgilangan muddat.</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
