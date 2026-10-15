import { create } from 'zustand';
import { Rating, type RecordLogItem } from 'ts-fsrs';
import type { EnrichedUserWord, UserWord } from '@/features/words/types';
import type { ReviewOutput, MnemonicItemOutput } from '@/lib/schemas/ai-coach';
import { aiCoachApi } from '@/features/words/api/ai-coach-api';
import { fsrsScheduler, toFSRSCard } from '@/lib/fsrs';
import { getWordIntervalSentence, type IntervalSentenceInfo } from '@/features/review/utils/interval-sentences';

export interface SessionStats {
  totalReviewed: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
}

export interface ReviewSessionState {
  cards: EnrichedUserWord[];
  currentIndex: number;
  currentExercise: ReviewOutput | null;
  activeIntervalSentence: IntervalSentenceInfo | null;
  isLoadingExercise: boolean;
  isSavingReview: boolean;
  saveError: string | null;
  userAnswer: string;
  selectedOptionIndex: number | null;
  isAnswerSubmitted: boolean;
  isCorrect: boolean | null;
  showNewMnemonic: boolean;
  activeRescueMnemonic: MnemonicItemOutput | null;
  isCompleted: boolean;
  sessionStats: SessionStats;

  // Actions
  initSession: (cards: EnrichedUserWord[]) => void;
  loadExercise: () => Promise<void>;
  setUserAnswer: (answer: string) => void;
  selectOption: (index: number) => void;
  submitAnswer: () => void;
  rateCard: (
    rating: Rating,
    saveReview: (
      userWordId: string,
      updatedFields: Partial<UserWord>,
      log: { task_type: string; rating: Rating }
    ) => Promise<void>
  ) => Promise<void>;
  dismissRescueMnemonic: () => void;
  resetSession: () => void;
}

const initialStats: SessionStats = {
  totalReviewed: 0,
  againCount: 0,
  hardCount: 0,
  goodCount: 0,
  easyCount: 0,
};

export const useReviewSessionStore = create<ReviewSessionState>((set, get) => ({
  cards: [],
  currentIndex: 0,
  currentExercise: null,
  activeIntervalSentence: null,
  isLoadingExercise: false,
  isSavingReview: false,
  saveError: null,
  userAnswer: '',
  selectedOptionIndex: null,
  isAnswerSubmitted: false,
  isCorrect: null,
  showNewMnemonic: false,
  activeRescueMnemonic: null,
  isCompleted: false,
  sessionStats: initialStats,

  initSession: (cards: EnrichedUserWord[]) => {
    set({
      cards,
      currentIndex: 0,
      currentExercise: null,
      activeIntervalSentence: null,
      isLoadingExercise: false,
      isSavingReview: false,
      saveError: null,
      userAnswer: '',
      selectedOptionIndex: null,
      isAnswerSubmitted: false,
      isCorrect: null,
      showNewMnemonic: false,
      activeRescueMnemonic: null,
      isCompleted: cards.length === 0,
      sessionStats: initialStats,
    });

    if (cards.length > 0) {
      get().loadExercise();
    }
  },

  loadExercise: async () => {
    const { cards, currentIndex } = get();
    const currentItem = cards[currentIndex];
    if (!currentItem) {
      set({ isCompleted: true, currentExercise: null, activeIntervalSentence: null });
      return;
    }

    set({
      isLoadingExercise: true,
      currentExercise: null,
      userAnswer: '',
      selectedOptionIndex: null,
      isAnswerSubmitted: false,
      isCorrect: null,
      showNewMnemonic: false,
      activeRescueMnemonic: null,
    });

    // Determine stage: 1 to 5 based on reps
    const reps = currentItem.userWord.reps || 0;
    const computedStage = Math.min(5, Math.max(1, reps + 1)) as 1 | 2 | 3 | 4 | 5;

    // Determine rotating example sentence for this specific review interval
    const intervalSentence = getWordIntervalSentence(currentItem);

    try {
      const exercise = await aiCoachApi.fetchReviewExercise({
        word: currentItem.word.word,
        stage: computedStage,
        lapses: currentItem.userWord.lapses || 0,
        interval: intervalSentence.interval,
        active_sentence: intervalSentence.text,
        active_sentence_label: intervalSentence.label,
        previous_mnemonic_type: currentItem.userWord.chosen_mnemonic?.type,
        uz_meaning: currentItem.word.uz_meaning,
      });

      // A late response must not replace a restarted/reset session.
      if (get().cards !== cards || get().currentIndex !== currentIndex) return;

      set({
        currentExercise: exercise,
        activeIntervalSentence: intervalSentence,
        isLoadingExercise: false,
        activeRescueMnemonic: exercise.new_mnemonic || null,
        showNewMnemonic: (currentItem.userWord.lapses || 0) >= 2 && Boolean(exercise.new_mnemonic),
      });
    } catch (err) {
      if (get().cards !== cards || get().currentIndex !== currentIndex) return;
      console.error('Failed to load review exercise:', err);
      set({ isLoadingExercise: false });
    }
  },

  setUserAnswer: (answer: string) => {
    set({ userAnswer: answer });
  },

  selectOption: (index: number) => {
    const { currentExercise, isAnswerSubmitted } = get();
    if (isAnswerSubmitted || !currentExercise?.options) return;

    set({ selectedOptionIndex: index, userAnswer: currentExercise.options[index] || '' });
  },

  submitAnswer: () => {
    const { currentExercise, userAnswer, selectedOptionIndex } = get();
    if (!currentExercise) return;

    let correct = false;

    if (currentExercise.type === 'choose') {
      const selectedText =
        selectedOptionIndex !== null && currentExercise.options
          ? currentExercise.options[selectedOptionIndex]
          : userAnswer;
      correct =
        selectedText?.trim().toLowerCase() === currentExercise.answer.trim().toLowerCase();
    } else if (currentExercise.type === 'gap_fill') {
      const cleanUser = userAnswer.trim().toLowerCase();
      const cleanAnswer = currentExercise.answer.trim().toLowerCase();
      const accepted = (currentExercise.accept_also || []).map((a) => a.trim().toLowerCase());
      correct = cleanUser === cleanAnswer || accepted.includes(cleanUser);
    } else if (currentExercise.type === 'dictation') {
      const cleanUser = userAnswer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
      const cleanAnswer = currentExercise.answer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
      const accepted = (currentExercise.accept_also || []).map((a) =>
        a.trim().toLowerCase().replace(/[.,!?;:]/g, '')
      );
      correct = cleanUser === cleanAnswer || accepted.includes(cleanUser);
    } else if (currentExercise.type === 'uz_to_en') {
      const cleanUser = userAnswer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
      const cleanAnswer = currentExercise.answer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
      const accepted = (currentExercise.accept_also || []).map((a) =>
        a.trim().toLowerCase().replace(/[.,!?;:]/g, '')
      );
      correct = cleanUser === cleanAnswer || accepted.includes(cleanUser);
    } else if (currentExercise.type === 'conversation') {
      // Must contain target word
      const cleanUser = userAnswer.trim().toLowerCase();
      const cleanTarget = currentExercise.answer.trim().toLowerCase();
      correct = cleanUser.includes(cleanTarget);
    }

    set({ isAnswerSubmitted: true, isCorrect: correct });
  },

  rateCard: async (rating: Rating, saveReview) => {
    const {
      cards, currentIndex, currentExercise, sessionStats, activeRescueMnemonic,
      isSavingReview, isAnswerSubmitted, isCorrect,
    } = get();
    const currentItem = cards[currentIndex];
    if (!currentItem || !currentExercise || !isAnswerSubmitted || isSavingReview) return;

    // 1. Calculate next FSRS scheduling
    const now = new Date();
    const currentFsrsCard = toFSRSCard(currentItem.userWord);
    const repeats = fsrsScheduler.repeat(currentFsrsCard, now) as unknown as Record<Rating, RecordLogItem>;
    const scheduledItem = repeats[rating];

    if (!scheduledItem) return;

    const nextCard = scheduledItem.card;

    // 2. Update mastery indicators according to task type
    const taskType = currentExercise.type;
    const masteryUpdates: Partial<UserWord> = {};
    const mastered = isCorrect === true && rating !== Rating.Again;

    if (taskType === 'choose') masteryUpdates.recog_ok = mastered;
    if (taskType === 'dictation') masteryUpdates.listen_ok = mastered;
    if (taskType === 'uz_to_en') masteryUpdates.write_ok = mastered;
    if (taskType === 'gap_fill') {
      masteryUpdates.write_ok = mastered;
      masteryUpdates.recog_ok = mastered;
    }
    // A text reply demonstrates writing, not verified pronunciation.
    if (taskType === 'conversation') masteryUpdates.write_ok = mastered;

    // If again or lapses >= 2 and rescue mnemonic chosen, save it
    if (rating === Rating.Again && activeRescueMnemonic) {
      masteryUpdates.chosen_mnemonic = activeRescueMnemonic;
    }

    const updatedFields: Partial<UserWord> = {
      stability: nextCard.stability,
      difficulty: nextCard.difficulty,
      due_at: nextCard.due.toISOString(),
      state: nextCard.state,
      reps: nextCard.reps,
      lapses: nextCard.lapses,
      last_review: now.toISOString(),
      ...masteryUpdates,
    };

    // 3. Update stats
    const newStats: SessionStats = {
      totalReviewed: sessionStats.totalReviewed + 1,
      againCount: sessionStats.againCount + (rating === Rating.Again ? 1 : 0),
      hardCount: sessionStats.hardCount + (rating === Rating.Hard ? 1 : 0),
      goodCount: sessionStats.goodCount + (rating === Rating.Good ? 1 : 0),
      easyCount: sessionStats.easyCount + (rating === Rating.Easy ? 1 : 0),
    };

    // Keep the answer and card until persistence has succeeded.
    set({ isSavingReview: true, saveError: null });
    try {
      await saveReview(currentItem.userWord.id, updatedFields, { task_type: taskType, rating });
    } catch (err) {
      if (get().cards === cards && get().currentIndex === currentIndex) {
        set({
          isSavingReview: false,
          saveError: err instanceof Error ? err.message : 'Takrorlash saqlanmadi. Qaytadan urinib ko‘ring.',
        });
      }
      return;
    }
    if (get().cards !== cards || get().currentIndex !== currentIndex) return;

    const nextIndex = currentIndex + 1;
    const isCompleted = nextIndex >= cards.length;

    set({
      cards: cards.map((item, index) => index === currentIndex
        ? { ...item, userWord: { ...item.userWord, ...updatedFields } }
        : item),
      currentIndex: nextIndex,
      isCompleted,
      isSavingReview: false,
      saveError: null,
      sessionStats: newStats,
      currentExercise: null,
      activeIntervalSentence: null,
      userAnswer: '',
      selectedOptionIndex: null,
      isAnswerSubmitted: false,
      isCorrect: null,
    });

    // If more cards exist, load next exercise
    if (!isCompleted) {
      get().loadExercise();
    }
  },

  dismissRescueMnemonic: () => {
    set({ showNewMnemonic: false });
  },

  resetSession: () => {
    set({
      cards: [],
      currentIndex: 0,
      currentExercise: null,
      activeIntervalSentence: null,
      isLoadingExercise: false,
      isSavingReview: false,
      saveError: null,
      userAnswer: '',
      selectedOptionIndex: null,
      isAnswerSubmitted: false,
      isCorrect: null,
      showNewMnemonic: false,
      activeRescueMnemonic: null,
      isCompleted: false,
      sessionStats: initialStats,
    });
  },
}));
