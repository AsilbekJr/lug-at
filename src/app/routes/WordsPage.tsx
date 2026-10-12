import * as React from 'react';
import { useUserWordsQuery, useDeleteUserWordMutation } from '@/features/words/api/words-api';
import { WordCard } from '@/features/words/components/WordCard';
import { WordFilters } from '@/features/words/components/WordFilters';
import { WordDetailDialog } from '@/features/words/components/WordDetailDialog';
import { AddWordStepperModal } from '@/features/words/components/stepper/AddWordStepperModal';
import { CuratedVocabModal } from '@/features/words/components/curriculum/CuratedVocabModal';
import { useAddWordStepperStore } from '@/features/words/store/useAddWordStepper';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorAlert } from '@/components/feedback/error-alert';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Layers } from 'lucide-react';
import type { EnrichedUserWord, CefrLevel } from '@/features/words/types';

export function WordsPage() {
  const { data: userWords, isLoading, isError, error, refetch } = useUserWordsQuery();
  const deleteMutation = useDeleteUserWordMutation();
  const { openStepper } = useAddWordStepperStore();

  const [search, setSearch] = React.useState('');
  const [selectedCefr, setSelectedCefr] = React.useState<CefrLevel | 'all'>('all');
  const [sortBy, setSortBy] = React.useState<'latest' | 'alphabetical' | 'level'>('latest');

  const [selectedItem, setSelectedItem] = React.useState<EnrichedUserWord | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = React.useState(false);


  // Filter & sort user words
  const filteredWords = React.useMemo(() => {
    if (!userWords) return [];

    return userWords
      .filter((item) => {
        const cefr = item.card?.content?.cefr_level;
        // CEFR filter
        if (selectedCefr !== 'all' && cefr !== selectedCefr) {
          return false;
        }
        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchesWord = item.word.word.toLowerCase().includes(q);
          const matchesMeaning = item.word.uz_meaning.toLowerCase().includes(q);
          const matchesSentence = item.card?.content?.model_sentences?.present?.toLowerCase().includes(q) ?? false;
          if (!matchesWord && !matchesMeaning && !matchesSentence) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'alphabetical') {
          return a.word.word.localeCompare(b.word.word);
        }
        if (sortBy === 'level') {
          const order: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
          const aLevel = a.card?.content?.cefr_level ? order[a.card.content.cefr_level] : 0;
          const bLevel = b.card?.content?.cefr_level ? order[b.card.content.cefr_level] : 0;
          return aLevel - bLevel;
        }
        // latest
        return new Date(b.userWord.created_at).getTime() - new Date(a.userWord.created_at).getTime();
      });
  }, [userWords, search, selectedCefr, sortBy]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Editorial Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-ink tracking-tight">
            Lug'at banki
          </h1>
          <p className="font-sans text-sm text-ink-muted mt-1 leading-relaxed max-w-[50ch]">
            Haqiqiy kontekstli jumlalar, fonetika va FSRS algoritmi bilan boyitilgan so'zlar xazinasi.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsCatalogOpen(true)}
            className="w-full text-xs sm:text-sm px-2.5 sm:px-4 h-10 justify-center"
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-[var(--color-accent)] shrink-0" strokeWidth={1.5} />
            <span className="truncate">Mavzular to‘plami</span>
          </Button>

          <Button
            variant="accent"
            size="md"
            onClick={() => openStepper()}
            className="w-full text-xs sm:text-sm px-2.5 sm:px-4 h-10 justify-center"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" strokeWidth={1.8} />
            <span className="truncate">Yangi so‘z</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <WordFilters
        search={search}
        onSearchChange={setSearch}
        selectedCefr={selectedCefr}
        onCefrChange={setSelectedCefr}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalCount={filteredWords.length}
      />

      {/* Error state in plain Uzbek */}
      {isError && (
        <ErrorAlert
          title="Lug'atni yuklashda xatolik yuz berdi"
          message={error instanceof Error ? error.message : "Tarmoqqa ulanishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."}
          onRetry={() => refetch()}
        />
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-[8px] border border-border bg-paper space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-4 w-full max-w-[55ch]" />
              <Skeleton className="h-16 w-full rounded-[6px]" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredWords.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title={search ? "Mos keluvchi so'zlar topilmadi" : "Lug'atingiz hozircha bo'sh"}
          description={
            search
              ? "Qidiruv so'zini o'zgartirib ko'ring yoki filtrlarni tozalang."
              : "Yangi so'z qo'shish tugmasini bosib, birinchi so'zingizni kiritishni boshlang."
          }
          actionLabel={search ? "Qidiruvni tozalash" : "Birinchi so'zni qo'shish"}
          onAction={() => {
            if (search) {
              setSearch('');
              setSelectedCefr('all');
            } else {
              openStepper();
            }
          }}
        />
      )}

      {/* Words Grid / List */}
      {!isLoading && filteredWords.length > 0 && (
        <div className="space-y-4">
          {filteredWords.map((item) => (
            <WordCard
              key={item.userWord.id}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      )}

      {/* Word Detail Drawer/Modal */}
      <WordDetailDialog
        item={selectedItem}
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
        isDeleting={deleteMutation.isPending}
      />

      {/* 4-Step Single Column Add Word Stepper Modal */}
      <AddWordStepperModal />

      {/* Curated Vocabulary Catalog Modal */}
      <CuratedVocabModal
        open={isCatalogOpen}
        onOpenChange={setIsCatalogOpen}
      />
    </div>
  );
}
