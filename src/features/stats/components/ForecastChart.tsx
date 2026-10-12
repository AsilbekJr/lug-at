import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface ForecastDay {
  date: string;
  dayLabel: string;
  count: number;
}

export function ForecastChart({ forecast }: { forecast: ForecastDay[] }) {
  const maxCount = Math.max(1, ...forecast.map((f) => f.count));

  return (
    <Card className="text-left">
      <CardHeader>
        <CardTitle>7 kunlik takrorlash yuki</CardTitle>
        <p className="text-xs text-ink-muted">
          FSRS algoritmi bo'yicha kelgusi kunlarda kutilayotgan so'zlar miqdori
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-col gap-2">
          {/* Chart area */}
          <div className="flex items-end justify-between gap-2 h-36 pt-4 border-b border-border pb-1">
            {forecast.map((day, idx) => {
              const heightPercent = Math.max(10, Math.round((day.count / maxCount) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                  <span className="font-mono text-xs font-semibold text-ink">
                    {day.count}
                  </span>

                  <div className="w-full max-w-[34px] bg-paper-subtle rounded-t-[4px] border border-b-0 border-border overflow-hidden h-full flex items-end">
                    <div
                      className="w-full bg-accent/80 hover:bg-accent transition-all duration-150 rounded-t-[3px]"
                      style={{ height: `${heightPercent}%` }}
                      title={`${day.dayLabel}: ${day.count} ta so'z`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day labels below baseline */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {forecast.map((day, idx) => (
              <div key={idx} className="flex-1 text-center">
                <span className="text-[11px] font-sans font-medium text-ink-muted block truncate">
                  {day.dayLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
