import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { State } from 'ts-fsrs';
import { ReviewPage } from './ReviewPage';
import { queryKeys } from '@/lib/query-client';
import type { ReviewSessionState } from '@/features/review/store/useReviewSessionStore';
import type { ReviewOutput } from '@/lib/schemas/ai-coach';
import type { EnrichedUserWord } from '@/features/words/types';

const fixture = vi.hoisted(() => ({ state: {} as ReviewSessionState }));

// The store's persistence behavior has separate real-store tests. Supply phase
// snapshots here to exercise the actual page and its actual exercise/mnemonic UI.
vi.mock('@/features/review/store/useReviewSessionStore', () => ({
  useReviewSessionStore: Object.assign(() => fixture.state, { getState: () => fixture.state }),
}));

const item: EnrichedUserWord = {
  word: { id: 'word-1', word: 'test-target', ipa: '/target/', uz_meaning: 'maqsad', created_at: '2026-10-13T00:00:00Z' },
  userWord: {
    id: 'track-1', user_id: 'user-1', word_id: 'word-1', state: State.New,
    stability: 0, difficulty: 0, due_at: '2026-10-13T00:00:00Z', reps: 0, lapses: 2,
    last_review: null, recog_ok: false, listen_ok: false, write_ok: false, speak_ok: false,
    created_at: '2026-10-13T00:00:00Z', updated_at: '2026-10-13T00:00:00Z',
  },
};

beforeEach(() => {
  fixture.state = {
    cards: [item], currentIndex: 0,
    currentExercise: {
      type: 'dictation', prompt: 'Tinglab yozing', audio_text: 'test-target appears here.',
      answer: 'test-target appears here.', accept_also: [],
    },
    activeIntervalSentence: { interval: 2, label: 'Kontekst', text: 'test-target appears here.' },
    isLoadingExercise: false, isSavingReview: false, saveError: null,
    userAnswer: '', selectedOptionIndex: null, isAnswerSubmitted: false, isCorrect: null,
    showNewMnemonic: true,
    activeRescueMnemonic: { type: 'image', scene_uz: 'A special memory scene for test-target' },
    isCompleted: false,
    sessionStats: { totalReviewed: 0, againCount: 0, hardCount: 0, goodCount: 0, easyCount: 0 },
    initSession: () => {}, loadExercise: async () => {}, setUserAnswer: () => {},
    selectOption: () => {}, submitAnswer: () => {}, rateCard: async () => {},
    dismissRescueMnemonic: () => {}, resetSession: () => {},
  };
});

function renderPage() {
  const client = new QueryClient();
  client.setQueryData(queryKeys.review.dueCards(), [item]);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <MemoryRouter><ReviewPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

it.each(['dictation', 'uz_to_en', 'gap_fill'] as ReviewOutput['type'][])(
  'hides the target, context and rescue clue before answering %s', type => {
    fixture.state.currentExercise = { ...fixture.state.currentExercise!, type, prompt: 'To‘ldiring: ___' };
    expect(renderPage().includes('test-target')).toBe(false);
  },
);

it('shows the rescue clue after the answer is submitted', () => {
  fixture.state.isAnswerSubmitted = true;
  fixture.state.isCorrect = false;
  expect(renderPage()).toContain('A special memory scene for test-target');
});
