import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'editorial' | 'bordered';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const variantStyles = {
    default: 'bg-paper border border-border rounded-[8px]',
    subtle: 'bg-paper-subtle border border-border-subtle rounded-[8px]',
    editorial: 'bg-paper border-l-2 border-l-accent border-y border-r border-border rounded-[6px]',
    bordered: 'bg-transparent border border-border rounded-[8px]',
  };

  return (
    <div
      className={cn(
        'transition-colors duration-150',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 pb-3 flex flex-col gap-1', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-sans font-semibold text-lg text-ink tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('font-sans text-sm text-ink-muted leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 pt-2', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 pt-3 border-t border-border flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}
