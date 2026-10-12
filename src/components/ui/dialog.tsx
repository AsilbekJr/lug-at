import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    }
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error('DialogContent must be used within Dialog');

  if (!context.open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Editorial backdrop: clean warm tint, no heavy blur/glassmorphism */}
      <div
        className="fixed inset-0 bg-ink/40 transition-opacity duration-150"
        onClick={() => context.onOpenChange(false)}
      />

      {/* Dialog Frame: 1px border, 8px radius */}
      <div
        className={cn(
          'relative z-50 w-full max-w-lg bg-paper border border-border rounded-[8px] p-5 sm:p-6 shadow-none max-h-[88vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150',
          className
        )}
      >
        <button
          type="button"
          aria-label="Yopish"
          onClick={() => context.onOpenChange(false)}
          className="absolute right-3.5 top-3.5 p-2 text-ink-muted hover:text-ink rounded-[4px] min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 mb-4 text-left pr-8', className)}>{children}</div>;
}

export function DialogTitle({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-xl sm:text-2xl font-serif font-bold text-ink tracking-tight', className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs sm:text-sm text-ink-muted leading-relaxed', className)}>
      {children}
    </p>
  );
}

export function DialogFooter({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 mt-4 border-t border-border', className)}>
      {children}
    </div>
  );
}
