import { cn } from '@/lib/utils';
import type { CefrLevel } from '@/features/words/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'subtle' | 'accent' | 'cefr';
  cefr?: CefrLevel | null;
}

export function Badge({ className, variant = 'default', cefr, children, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-paper-muted text-ink border border-border',
    outline: 'bg-transparent text-ink border border-border',
    subtle: 'bg-paper-subtle text-ink-muted border border-border-subtle',
    accent: 'bg-accent-subtle text-accent-text border border-accent/20 font-medium',
    cefr: 'border font-mono font-medium',
  };

  const cefrStyles: Record<string, string> = {
    A1: 'bg-paper-subtle text-ink-muted border-border',
    A2: 'bg-paper-subtle text-ink-muted border-border',
    B1: 'bg-paper-muted text-ink border-border font-semibold',
    B2: 'bg-paper-muted text-ink border-border font-semibold',
    C1: 'bg-accent-subtle text-accent-text border-accent/30 font-semibold',
    C2: 'bg-accent text-white border-accent font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs transition-colors select-none tracking-tight',
        variant === 'cefr' && cefr ? cefrStyles[cefr] : variantStyles[variant],
        className
      )}
      {...props}
    >
      {children || cefr}
    </span>
  );
}
