import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-sans font-medium text-ink-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'w-full h-10 min-h-[44px] px-3.5 py-2 text-sm bg-paper text-ink border rounded-[6px] transition-colors',
            'placeholder:text-ink-subtle',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-rating-again focus-visible:ring-rating-again/30 focus-visible:border-rating-again' : 'border-border',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-rating-again">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 3, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-sans font-medium text-ink-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            'w-full p-3 text-sm bg-paper text-ink border rounded-[6px] transition-colors resize-y leading-relaxed',
            'placeholder:text-ink-subtle',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-rating-again focus-visible:ring-rating-again/30 focus-visible:border-rating-again' : 'border-border',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-rating-again">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
