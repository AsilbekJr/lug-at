import { create } from 'zustand';
import type { EnrichedUserWord } from '@/features/words/types';
import { Rating } from 'ts-fsrs';

interface ReviewState {
  items: EnrichedUserWord[];
  currentIndex: number;
  isFlipped: boolean;
  isFinished: boolean;
  sessionRatings: { userWordId: string; rating: Rating }[];
  startTime: number | null;

  initSession: (items: EnrichedUserWord[]) => void;
  flipCard: () => void;
  setFlipped: (flipped: boolean) => void;
  nextCard: (rating: Rating) => void;
  restartSession: () => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  items: [],
  currentIndex: 0,
  isFlipped: false,
  isFinished: false,
  sessionRatings: [],
  startTime: null,

  initSession: (items) => {
    set({
      items,
      currentIndex: 0,
      isFlipped: false,
      isFinished: items.length === 0,
      sessionRatings: [],
      startTime: Date.now(),
    });
  },

  flipCard: () => {
    set((state) => ({ isFlipped: !state.isFlipped }));
  },

  setFlipped: (flipped) => {
    set({ isFlipped: flipped });
  },

  nextCard: (rating) => {
    const { items, currentIndex, sessionRatings } = get();
    const currentItem = items[currentIndex];

    if (!currentItem) return;

    const updatedRatings = [...sessionRatings, { userWordId: currentItem.userWord.id, rating }];
    const nextIdx = currentIndex + 1;

    if (nextIdx >= items.length) {
      set({
        currentIndex: nextIdx,
        isFinished: true,
        isFlipped: false,
        sessionRatings: updatedRatings,
      });
    } else {
      set({
        currentIndex: nextIdx,
        isFlipped: false,
        sessionRatings: updatedRatings,
      });
    }
  },

  restartSession: () => {
    const { items } = get();
    set({
      currentIndex: 0,
      isFlipped: false,
      isFinished: items.length === 0,
      sessionRatings: [],
      startTime: Date.now(),
    });
  },
}));
