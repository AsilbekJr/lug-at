import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CuratedCatalogView } from './CuratedCatalogView';
import { useAddWordStepperStore } from '@/features/words/store/useAddWordStepper';
import type { CuratedWord } from '@/features/words/types/curriculum';

interface CuratedVocabModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CuratedVocabModal: React.FC<CuratedVocabModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { openWithCuratedWord } = useAddWordStepperStore();

  const handleSelectWord = (word: CuratedWord) => {
    onOpenChange(false);
    openWithCuratedWord(word);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full p-4 sm:p-6 h-[90vh] flex flex-col overflow-hidden">
        <CuratedCatalogView onSelectWord={handleSelectWord} />
      </DialogContent>
    </Dialog>
  );
};
