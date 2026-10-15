import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { State } from 'ts-fsrs';
import { TodayPage } from './TodayPage';
import { queryKeys } from '@/lib/query-client';
import type { EnrichedUserWord } from '@/features/words/types';

const word: EnrichedUserWord = {
  word: { id: 'word', word: 'hello', uz_meaning: 'salom', ipa: '', created_at: '2026-10-01T00:00:00Z' },
  userWord: {
    id: 'track', user_id: 'user', word_id: 'word', state: State.New,
    stability: 0, difficulty: 0, due_at: '2026-10-01T00:00:00Z', reps: 0, lapses: 0,
    last_review: null, recog_ok: false, listen_ok: false, write_ok: false, speak_ok: false,
    created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
  },
};
function renderPage(due: EnrichedUserWord[] | 'loading' | 'error', words: EnrichedUserWord[] | 'error' = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
  if (Array.isArray(due)) client.setQueryData(queryKeys.review.dueCards(), due);
  else if (due === 'error') {
    client.getQueryCache().build(client, { queryKey: queryKeys.review.dueCards() })
      .setState({ status: 'error', error: new Error('offline') });
  }
  if (Array.isArray(words)) client.setQueryData(queryKeys.words.all, words);
  else client.getQueryCache().build(client, { queryKey: queryKeys.words.all })
    .setState({ status: 'error', error: new Error('offline') });
  return renderToStaticMarkup(<QueryClientProvider client={client}><MemoryRouter><TodayPage /></MemoryRouter></QueryClientProvider>);
}
it('puts a due review action before quick add so the next task is visible first', () => {
  const html = renderPage([word]);
  expect(html.indexOf('Takrorlashni boshlash')).toBeGreaterThan(0);
  expect(html.indexOf('Takrorlashni boshlash')).toBeLessThan(html.indexOf('aria-label="Yangi so‘z"'));
});
it('does not celebrate completed reviews while due items are loading', () => {
  const html = renderPage('loading');
  expect(html).toContain('Takrorlash navbati yuklanmoqda');
  expect(html).not.toContain('Barcha so‘z va gaplar takrorlandi');
});
it('shows a retry path when the review queue cannot load', () => {
  const html = renderPage('error');
  expect(html).toContain('Takrorlash navbati yuklanmadi');
  expect(html).toContain('Qayta urinish');
  expect(html).not.toContain('Barcha so‘z va gaplar takrorlandi');
});
it('does not show made-up zero progress when the words query fails', () => {
  const html = renderPage([], 'error');
  expect(html).toContain('Kunlik natija yuklanmadi');
  expect(html).not.toContain('aria-valuenow="0"');
});
it('exposes a single labelled daily goal with actual progress', () => {
  const todayWord = { ...word, userWord: { ...word.userWord, created_at: new Date().toISOString() } };
  const html = renderPage([], [todayWord]);
  expect(html).toContain('aria-label="Kunlik maqsad"');
  expect(html).toContain('aria-valuenow="1"');
  expect(html.match(/role="progressbar"/g)).toHaveLength(1);
});
