import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'rating-again' | 'rating-hard' | 'rating-good' | 'rating-easy';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-sans font-medium transition-colors duration-150 rounded-[6px] select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-[0.5px]';

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs gap-1.5 min-h-[36px]',
      md: 'h-10 px-4 text-sm gap-2 min-h-[44px]',
      lg: 'h-12 px-6 text-base gap-2.5 min-h-[44px]',
      icon: 'h-10 w-10 min-h-[44px] min-w-[44px] p-0',
    };

    // Strict editorial styling: 1px crisp borders, zero blur/glow, no gradients
    const variantStyles = {
      primary:
        'bg-ink text-paper border border-ink hover:bg-ink/90 active:bg-ink',
      secondary:
        'bg-paper-subtle text-ink border border-border hover:bg-paper-muted active:bg-paper-subtle',
      outline:
        'bg-transparent text-ink border border-border hover:bg-paper-subtle active:bg-paper-muted',
      ghost:
        'bg-transparent text-ink border border-transparent hover:bg-paper-subtle active:bg-paper-muted',
      accent:
        'bg-accent text-white border border-accent hover:bg-accent-hover active:bg-accent',
      'rating-again':
        'bg-transparent text-rating-again border border-rating-again/40 hover:bg-rating-again/10 active:bg-rating-again/20',
      'rating-hard':
        'bg-transparent text-rating-hard border border-rating-hard/40 hover:bg-rating-hard/10 active:bg-rating-hard/20',
      'rating-good':
        'bg-transparent text-rating-good border border-rating-good/40 hover:bg-rating-good/10 active:bg-rating-good/20',
      'rating-easy':
        'bg-transparent text-rating-easy border border-rating-easy/40 hover:bg-rating-easy/10 active:bg-rating-easy/20',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
