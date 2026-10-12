import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[4px] bg-paper-subtle border border-border-subtle/50',
        className
      )}
      {...props}
    />
  );
}
