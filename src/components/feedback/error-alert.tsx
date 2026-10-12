import { cn } from '@/lib/utils';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ErrorAlertProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorAlert({
  title = "Xatolik yuz berdi",
  message = "Ma'lumotlarni yuklashda kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
  onRetry,
  className,
}: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'p-4 rounded-[6px] border border-rating-again/30 bg-rating-again/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-1 text-rating-again shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="text-left">
          <h4 className="text-sm font-semibold text-ink leading-tight">{title}</h4>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-[50ch]">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-rating-again/40 text-rating-again hover:bg-rating-again/10 shrink-0 self-end sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
          Qayta urinish
        </Button>
      )}
    </div>
  );
}
