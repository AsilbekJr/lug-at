import * as React from 'react';
import { useDueUserWordsQuery } from '@/features/words/api/words-api';
import { useReviewSessionStore } from '@/features/review/store/useReviewSessionStore';
import { dataRepository } from '@/lib/supabase';
import { getSchedulingPreviews } from '@/lib/fsrs';
import { ChooseExercise } from '@/features/review/components/stages/ChooseExercise';
import { DictationExercise } from '@/features/review/components/stages/DictationExercise';
import { UzToEnExercise } from '@/features/review/components/stages/UzToEnExercise';
import { GapFillExercise } from '@/features/review/components/stages/GapFillExercise';
import { ConversationExercise } from '@/features/review/components/stages/ConversationExercise';
import { NewMnemonicCard } from '@/features/review/components/NewMnemonicCard';
import { RatingBar } from '@/features/review/components/RatingBar';
import { ReviewSummary } from '@/features/review/components/ReviewSummary';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorAlert } from '@/components/feedback/error-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Eye, Headphones, PenLine, Mic, Sparkles } from 'lucide-react';
import type { Rating } from 'ts-fsrs';

export function ReviewPage() {
  const { data: dueItems, isLoading, isError, error, refetch } = useDueUserWordsQuery();

  const {
    cards,
    currentIndex,
    currentExercise,
    activeIntervalSentence,
    isLoadingExercise,
    isAnswerSubmitted,
    showNewMnemonic,
    activeRescueMnemonic,
    isCompleted,
    sessionStats,
    initSession,
    rateCard,
    dismissRescueMnemonic,
    resetSession,
  } = useReviewSessionStore();

  // Initialize session whenever due items are fetched and session is empty
  React.useEffect(() => {
    if (dueItems && dueItems.length > 0 && cards.length === 0 && !isCompleted) {
      initSession(dueItems);
    }
  }, [dueItems, cards.length, isCompleted, initSession]);

  const currentItem = cards[currentIndex];

  // Calculate FSRS previews for the current user word
  const previews = React.useMemo(() => {
    if (!currentItem) return null;
    return getSchedulingPreviews(currentItem.userWord);
  }, [currentItem]);

  // Handle rating submission
  const handleRate = async (rating: Rating) => {
    await rateCard(rating, async (userWordId, updatedFields, logData) => {
      await dataRepository.updateUserWordReview(userWordId, updatedFields, logData);
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
        <Skeleton className="h-4 w-40 mx-auto" />
        <Skeleton className="h-[280px] w-full rounded-lg" />
        <div className="grid grid-cols-4 gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <ErrorAlert
          title="Takrorlash ma'lumotlarini yuklashda xatolik"
          message={error instanceof Error ? error.message : "Iltimos, qaytadan urinib ko'ring."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Session Completed view
  if (isCompleted || (cards.length > 0 && currentIndex >= cards.length)) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <ReviewSummary
          totalReviewed={sessionStats.totalReviewed}
          sessionStats={sessionStats}
          onRestart={() => {
            if (dueItems && dueItems.length > 0) {
              initSession(dueItems);
            } else {
              resetSession();
              refetch();
            }
          }}
        />
      </div>
    );
  }

  // No due cards right now
  if (cards.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          icon={CheckCircle2}
          title="Barcha navbatdagi so'zlar takrorlandi"
          description="Ajoyib natija! Bugun uchun takrorlanishi kerak bo'lgan boshqa so'z qolmadi. FSRS algoritmi keyingi muddatni belgiladi."
          actionLabel="Lug'at bankiga o'tish"
          onAction={() => {
            window.location.href = '/';
          }}
        />
      </div>
    );
  }

  const userWord = currentItem.userWord;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Session Progress Header */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[var(--color-accent)] font-semibold">
              {currentIndex + 1} / {cards.length}
            </span>
            <span className="text-[var(--color-border)]">|</span>
            <span className="font-serif font-medium text-[var(--color-text)] text-sm">
              {currentItem.word.word}
            </span>
            {currentItem.word.ipa && (
              <span className="font-mono text-xs text-[var(--color-text-muted)] hidden sm:inline">
                {currentItem.word.ipa}
              </span>
            )}
          </div>

          {/* 4 Mastery Indicators (recog, listen, write, speak) */}
          <div className="flex items-center gap-1.5" title="O'zlashtirish ko'rsatkichlari (recog, listen, write, speak)">
            <span
              className={`p-1 rounded text-[10px] ${
                userWord.recog_ok
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-[var(--color-text-muted)] opacity-40'
              }`}
              title="Ko'rish orqali tanish (recog)"
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={userWord.recog_ok ? 2 : 1.5} />
            </span>
            <span
              className={`p-1 rounded text-[10px] ${
                userWord.listen_ok
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-[var(--color-text-muted)] opacity-40'
              }`}
              title="Tinglab tushunish (listen)"
            >
              <Headphones className="w-3.5 h-3.5" strokeWidth={userWord.listen_ok ? 2 : 1.5} />
            </span>
            <span
              className={`p-1 rounded text-[10px] ${
                userWord.write_ok
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-[var(--color-text-muted)] opacity-40'
              }`}
              title="Yozma qo'llash (write)"
            >
              <PenLine className="w-3.5 h-3.5" strokeWidth={userWord.write_ok ? 2 : 1.5} />
            </span>
            <span
              className={`p-1 rounded text-[10px] ${
                userWord.speak_ok
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-[var(--color-text-muted)] opacity-40'
              }`}
              title="Ovoz chiqarib so'zlash (speak)"
            >
              <Mic className="w-3.5 h-3.5" strokeWidth={userWord.speak_ok ? 2 : 1.5} />
            </span>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <Progress value={currentIndex + 1} max={cards.length} />
      </div>

      {/* Exercise Body */}
      <div className="p-5 sm:p-6 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] min-h-[280px] flex flex-col justify-center">
        {isLoadingExercise && (
          <div className="py-12 text-center space-y-3">
            <Sparkles className="w-6 h-6 animate-spin mx-auto text-[var(--color-accent)]" strokeWidth={1.5} />
            <p className="text-xs font-mono text-[var(--color-text-muted)]">
              Mashq tayyorlanmoqda...
            </p>
          </div>
        )}

        {!isLoadingExercise && currentExercise && (
          <div>
            {/* Interval & Context Sentence Tracker */}
            {activeIntervalSentence && (
              <div className="flex items-center justify-between gap-2 p-2.5 mb-5 rounded-md bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text-muted)] flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  <strong className="text-[var(--color-text)] font-semibold">
                    {activeIntervalSentence.interval}-interval takrorlashi:
                  </strong>
                  <span>{activeIntervalSentence.label}</span>
                </div>
                <span className="text-[var(--color-accent)] font-serif italic truncate max-w-[280px]">
                  "{activeIntervalSentence.text}"
                </span>
              </div>
            )}

            {currentExercise.type === 'choose' && <ChooseExercise />}
            {currentExercise.type === 'dictation' && <DictationExercise />}
            {currentExercise.type === 'uz_to_en' && <UzToEnExercise />}
            {currentExercise.type === 'gap_fill' && <GapFillExercise />}
            {currentExercise.type === 'conversation' && <ConversationExercise />}
          </div>
        )}
      </div>

      {/* Rescue Mnemonic (Lapses >= 2) */}
      {showNewMnemonic && activeRescueMnemonic && (
        <NewMnemonicCard
          mnemonic={activeRescueMnemonic}
          onDismiss={dismissRescueMnemonic}
        />
      )}

      {/* FSRS Rating Bar (Visible once user submits answer) */}
      <div className="min-h-[72px]">
        {isAnswerSubmitted ? (
          <div className="space-y-1.5 animate-fadeIn">
            <span className="text-xs font-mono text-[var(--color-text-muted)] block text-center">
              Eslab qolish darajangizni baholang [1..4]:
            </span>
            <RatingBar previews={previews} onRate={handleRate} />
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-2">
            Javobingizni tekshirgach, FSRS orqali xotira holatingizni baholaysiz.
          </p>
        )}
      </div>
    </div>
  );
}
