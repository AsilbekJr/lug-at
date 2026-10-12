import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateWordInputSchema, type CreateWordInput } from '@/features/words/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { ErrorAlert } from '@/components/feedback/error-alert';

export interface AddWordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitWord: (data: CreateWordInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddWordDialog({
  open,
  onOpenChange,
  onSubmitWord,
  isSubmitting,
}: AddWordDialogProps) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWordInput>({
    resolver: zodResolver(CreateWordInputSchema),
    defaultValues: {
      word: '',
      pos: '',
      ipa: '',
      uz_meaning: '',
      item_type: 'word',
      own_sentence: '',
    },
  });

  const handleFormSubmit: SubmitHandler<CreateWordInput> = async (data) => {
    setErrorMessage(null);
    try {
      await onSubmitWord(data);
      reset();
      onOpenChange(false);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "So'zni saqlashda xatolik yuz berdi."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Lug'atga yangi so'z qo'shish</DialogTitle>
          <DialogDescription>
            So'z, transkripsiya va o'zbekcha ma'nosini kiriting. FSRS takrorlash tizimi avtomatik faollashadi.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <ErrorAlert
            title="Xatolik"
            message={errorMessage}
            onRetry={() => setErrorMessage(null)}
          />
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left">
          <Input
            label="So'z (English)"
            placeholder="masalan: resilience, ephemeral..."
            {...register('word')}
            error={errors.word?.message}
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Fonetik transkripsiya (IPA)"
              placeholder="/rɪˈzɪl.jəns/"
              {...register('ipa')}
            />
            <Input
              label="Nutq qismi (pos)"
              placeholder="noun, verb, adjective..."
              {...register('pos')}
            />
          </div>

          <Input
            label="O'zbekcha ma'nosi (uz_meaning)"
            placeholder="Matonat, chidamlilik..."
            {...register('uz_meaning')}
            error={errors.uz_meaning?.message}
          />

          <Textarea
            label="Shaxsiy hayotiy jumlasi (ixtiyoriy)"
            placeholder="O'z hayotingizdan so'z ishtirok etgan bitta jumla..."
            rows={2}
            {...register('own_sentence')}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => onOpenChange(false)}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" strokeWidth={1.5} />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Lug'atga qo'shish
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
