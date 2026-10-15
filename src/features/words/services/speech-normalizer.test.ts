import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { normalizeSpeechWithAI } from './speech-normalizer';
vi.mock('./groq-whisper-service', () => ({ getGroqApiKey: () => 'test-key' }));
vi.mock('./gemini-flash-service', () => ({ getGeminiApiKey: () => null }));

beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
function reply(content: string) {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 }));
}
it('returns a correction as a suggestion rather than an authoritative transcript', async () => {
  reply('{"suggestion":"toshli ko‘cha"}');
  expect(await normalizeSpeechWithAI('torsli ko‘cha', 'uz-UZ')).toEqual({ suggestion: 'toshli ko‘cha', status: 'available' });
});
it.each([
  ['Choy Khana', 'Choyxona'],
  ['choykhana', 'choyxona'],
  ['Men choy khanaga boraman.', 'Men choyxonaga boraman.'],
  ['osh xona va mehmon khonada', 'oshxona va mehmonxonada'],
  ['KUTUB XONA', 'KUTUBXONA'],
  ['Dori xonadan dori oldim.', 'Dorixonadan dori oldim.'],
])('offers local Uzbek compound spelling for %s even when AI has no suggestion', async (raw, suggestion) => {
  reply('{"suggestion":null}');
  expect(await normalizeSpeechWithAI(raw, 'uz-UZ')).toEqual({ suggestion, status: 'available' });
});
it('offers the known Uzbek spelling without waiting for a failed correction provider', async () => {
  vi.mocked(fetch).mockRejectedValue(new TypeError('offline'));
  expect(await normalizeSpeechWithAI('Choy Khana', 'uz-UZ')).toEqual({ suggestion: 'Choyxona', status: 'available' });
});
it.each(['Khan Academy', 'Ali Khana', 'Choy, xona', 'choy\nxona', 'choyxonada', 'choyxonachi', 'choyxonalarimizdan'])('preserves names, boundaries and already correct Uzbek: %s', async raw => {
  reply('{"suggestion":null}');
  expect(await normalizeSpeechWithAI(raw, 'uz-UZ')).toEqual({ suggestion: null, status: 'unchanged' });
});
it('does not apply Uzbek compound spelling to English capture', async () => {
  reply('{"suggestion":null}');
  expect(await normalizeSpeechWithAI('Choy Khana', 'en-US')).toEqual({ suggestion: null, status: 'unchanged' });
});
it('does not truncate a multiline phrase or accept unstructured model prose', async () => {
  reply('Corrected text: first line\nsecond line');
  expect(await normalizeSpeechWithAI('first line\nsecond line', 'en-US')).toEqual({ suggestion: null, status: 'unavailable' });
});
it.each(['{"suggestion":null}', '{"suggestion":"toshli ko‘cha"}'])(
  'does not invent a second candidate for unchanged text: %s', async content => {
    reply(content);
    expect(await normalizeSpeechWithAI('toshli ko‘cha', 'uz-UZ')).toEqual({ suggestion: null, status: 'unchanged' });
  },
);
it('never starts a correction for an already cancelled recording', async () => {
  const abort = new AbortController(); abort.abort();
  await expect(normalizeSpeechWithAI('old text', 'uz-UZ', abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled();
});
it('bounds a hung correction request and leaves the original usable', async () => {
  vi.useFakeTimers();
  vi.mocked(fetch).mockImplementation((_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  }));
  const result = normalizeSpeechWithAI('original', 'en-US');
  await vi.advanceTimersByTimeAsync(16000);
  expect(await result).toEqual({ suggestion: null, status: 'unavailable' });
});
