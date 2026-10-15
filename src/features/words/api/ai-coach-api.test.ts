import { expect, it, vi } from 'vitest';
import { aiCoachApi } from './ai-coach-api';

vi.mock('@/lib/supabase', () => ({ supabase: null, isSupabaseConfigured: false }));

it('provides an Uzbek translation cue without requiring the hidden English sentence', async () => {
  const exercise = await aiCoachApi.fetchReviewExercise({
    word: 'resilience', stage: 3, uz_meaning: 'Matonat, chidamlilik',
    active_sentence: 'She shows great resilience in difficult negotiations.',
    active_sentence_label: 'Hozirgi zamon', interval: 3,
  });
  expect(exercise.type).toBe('uz_to_en');
  expect(exercise.prompt).toContain('Matonat, chidamlilik');
  expect(exercise.prompt).not.toContain('resilience');
  expect(exercise.answer).toBe('resilience');
});

it('does not accept only the target word for a full-sentence dictation', async () => {
  const exercise = await aiCoachApi.fetchReviewExercise({
    word: 'resilience', stage: 2, uz_meaning: 'Matonat',
    active_sentence: 'She shows great resilience in difficult negotiations.', interval: 2,
  });
  expect(exercise.answer).toBe('She shows great resilience in difficult negotiations.');
  expect(exercise.accept_also).not.toContain('resilience');
});
