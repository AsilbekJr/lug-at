import { expect, it, vi } from 'vitest';
import { translateInput } from './translation-service';
vi.mock('./gemini-flash-service', () => ({ translateWithGeminiFlash: async () => null }));

it('does not silently apply Uzbek speech correction to confirmed English or typed text', async () => {
  const result = await translateInput('navo isiq!', 'sentence');
  expect(result.englishText).toBe('navo isiq!');
});
