import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-border rounded-[8px] bg-paper-subtle/40 max-w-lg mx-auto my-6',
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-[6px] border border-border bg-paper flex items-center justify-center text-ink-muted mb-4">
          <Icon className="w-6 h-6" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="font-serif font-bold text-lg text-ink mb-1.5">{title}</h3>
      <p className="font-sans text-sm text-ink-muted leading-relaxed max-w-[42ch] mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="accent" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
