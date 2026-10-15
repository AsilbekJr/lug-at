import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Rating, State } from 'ts-fsrs';
import { useReviewSessionStore } from './useReviewSessionStore';
import type { EnrichedUserWord, UserWord } from '@/features/words/types';
import type { ReviewOutput } from '@/lib/schemas/ai-coach';

// Keep AI/network outside this test; scheduling and the session store are real.
vi.mock('@/features/words/api/ai-coach-api', () => ({
  aiCoachApi: { fetchReviewExercise: async () => ({
    type: 'choose', prompt: 'Tarjimani tanlang', audio_text: '', answer: 'kitob',
    options: ['kitob', 'uy'], accept_also: [],
  }) },
}));

const item: EnrichedUserWord = {
  word: { id: 'word-1', word: 'book', uz_meaning: 'kitob', created_at: '2026-10-12T00:00:00Z' },
  userWord: {
    id: 'track-1', user_id: 'user-1', word_id: 'word-1', state: State.New,
    stability: 0, difficulty: 0, due_at: '2026-10-12T00:00:00Z', reps: 0, lapses: 0,
    last_review: null, recog_ok: false, listen_ok: false, write_ok: false, speak_ok: false,
    created_at: '2026-10-12T00:00:00Z', updated_at: '2026-10-12T00:00:00Z',
  },
};
const exercise: ReviewOutput = {
  type: 'choose', prompt: 'Tarjimani tanlang', audio_text: '', answer: 'kitob',
  options: ['kitob', 'uy'], accept_also: [],
};

function answered(correct = true, type: ReviewOutput['type'] = 'choose') {
  useReviewSessionStore.setState({
    cards: [item], currentIndex: 0,
    currentExercise: { ...exercise, type },
    userAnswer: correct ? 'kitob' : 'uy', selectedOptionIndex: correct ? 0 : 1,
    isAnswerSubmitted: true, isCorrect: correct,
  });
}

beforeEach(() => useReviewSessionStore.getState().resetSession());

describe('review persistence', () => {
  it('keeps the answer and card when saving fails, then allows a successful retry', async () => {
    answered();
    await useReviewSessionStore.getState().rateCard(Rating.Good, async () => { throw new Error('Tarmoq uzildi'); });
    expect(useReviewSessionStore.getState()).toMatchObject({
      currentIndex: 0, isCompleted: false, userAnswer: 'kitob', isAnswerSubmitted: true,
      isSavingReview: false, saveError: 'Tarmoq uzildi', sessionStats: { totalReviewed: 0 },
    });
    await useReviewSessionStore.getState().rateCard(Rating.Good, async () => {});
    expect(useReviewSessionStore.getState()).toMatchObject({
      currentIndex: 1, isCompleted: true, saveError: null, sessionStats: { totalReviewed: 1 },
    });
  });

  it('does not advance or write twice while the original save is pending', async () => {
    answered();
    let finish!: () => void;
    const saved: string[] = [];
    const saving = useReviewSessionStore.getState().rateCard(Rating.Good, async (id) => {
      saved.push(id);
      await new Promise<void>(resolve => { finish = resolve; });
    });
    expect(useReviewSessionStore.getState()).toMatchObject({ currentIndex: 0, isSavingReview: true });
    await useReviewSessionStore.getState().rateCard(Rating.Easy, async id => { saved.push(id); });
    expect(saved).toEqual(['track-1']);
    finish();
    await saving;
    expect(useReviewSessionStore.getState()).toMatchObject({
      currentIndex: 1, isSavingReview: false, sessionStats: { totalReviewed: 1, goodCount: 1, easyCount: 0 },
    });
  });

  it('does not save a rating before an answer is submitted', async () => {
    answered();
    useReviewSessionStore.setState({ isAnswerSubmitted: false });
    const saved: string[] = [];
    await useReviewSessionStore.getState().rateCard(Rating.Good, async id => { saved.push(id); });
    expect(saved).toEqual([]);
    expect(useReviewSessionStore.getState().currentIndex).toBe(0);
  });

  it('does not let a completed write replace a reset session', async () => {
    answered();
    let finish!: () => void;
    const saving = useReviewSessionStore.getState().rateCard(Rating.Good, async () => {
      await new Promise<void>(resolve => { finish = resolve; });
    });
    useReviewSessionStore.getState().resetSession();
    finish();
    await saving;
    expect(useReviewSessionStore.getState()).toMatchObject({ cards: [], currentIndex: 0, isCompleted: false });
  });
});

describe('verified mastery', () => {
  it.each(['choose', 'dictation', 'uz_to_en', 'gap_fill'] as const)(
    'does not award mastery after an incorrect %s answer', async type => {
      answered(false, type);
      let fields: Partial<UserWord> = {};
      await useReviewSessionStore.getState().rateCard(Rating.Good, async (_id, update) => { fields = update; });
      expect(fields.recog_ok).not.toBe(true);
      expect(fields.listen_ok).not.toBe(true);
      expect(fields.write_ok).not.toBe(true);
      expect(fields.speak_ok).not.toBe(true);
    },
  );

  it('awards recognition for a correct answer that was remembered', async () => {
    answered();
    let fields: Partial<UserWord> = {};
    await useReviewSessionStore.getState().rateCard(Rating.Good, async (_id, update) => { fields = update; });
    expect(fields.recog_ok).toBe(true);
    expect(fields.listen_ok).toBeUndefined();
  });

  it('does not award recognition when the learner rates the answer Again', async () => {
    answered();
    let fields: Partial<UserWord> = {};
    await useReviewSessionStore.getState().rateCard(Rating.Again, async (_id, update) => { fields = update; });
    expect(fields.recog_ok).not.toBe(true);
  });

  it('does not treat a text conversation as verified pronunciation', async () => {
    answered(true, 'conversation');
    let fields: Partial<UserWord> = {};
    await useReviewSessionStore.getState().rateCard(Rating.Good, async (_id, update) => { fields = update; });
    expect(fields.speak_ok).not.toBe(true);
  });
});
