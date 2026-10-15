import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { dataRepository } from './supabase';
import { Rating } from 'ts-fsrs';

vi.hoisted(() => {
  vi.stubEnv('VITE_SUPABASE_URL', '');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
});

beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
  });
});
afterEach(() => vi.unstubAllGlobals());

it('starts a new word with no verified skills', async () => {
  const result = await dataRepository.createWord({ word: 'book', uz_meaning: 'kitob' });
  expect(result.userWord).toMatchObject({ recog_ok: false, listen_ok: false, write_ok: false, speak_ok: false });
});

it('preserves explicitly false learning confirmations', async () => {
  const result = await dataRepository.createWord({
    word: 'book', uz_meaning: 'kitob', recog_ok: true, listen_ok: false, write_ok: false, speak_ok: false,
  });
  expect(result.userWord).toMatchObject({ recog_ok: true, listen_ok: false, write_ok: false, speak_ok: false });
});

it('rejects saving when device storage is unavailable', async () => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => { throw new Error('Quota exceeded'); },
  });
  await expect(dataRepository.createWord({ word: 'book', uz_meaning: 'kitob' })).rejects.toThrow();
});

it('rejects a review when its log cannot be stored', async () => {
  const result = await dataRepository.createWord({ word: 'book', uz_meaning: 'kitob' });
  const getItem = localStorage.getItem.bind(localStorage);
  const setItem = localStorage.setItem.bind(localStorage);
  vi.stubGlobal('localStorage', {
    getItem,
    setItem: (key: string, value: string) => {
      if (key === 'linguist_review_log_v2') throw new Error('Quota exceeded');
      setItem(key, value);
    },
  });
  await expect(dataRepository.updateUserWordReview(result.userWord.id, { reps: 1 }, {
    task_type: 'choose', rating: Rating.Good,
  })).rejects.toThrow();
});
