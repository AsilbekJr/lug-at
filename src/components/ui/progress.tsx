import { cn } from '@/lib/utils';

export interface ProgressProps {
  value: number; // 0 - 100
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({ value, max = 100, className, indicatorClassName }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-[4px] bg-paper-subtle border border-border',
        className
      )}
    >
      <div
        className={cn(
          'h-full bg-accent transition-[width] duration-200 ease-out',
          indicatorClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
