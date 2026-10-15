import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { transcribeAudioWithGroq } from './groq-whisper-service';
beforeEach(() => {
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', { getItem: () => 'test-key' });
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it('uploads MP4 with the right extension and does not bias English with Uzbek example sentences', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response('{"text":"  original!  "}', { status: 200 }));
  expect(await transcribeAudioWithGroq({ audioBlob: new Blob(['audio'], { type: 'audio/mp4' }), language: 'en' })).toBe('original!');
  const data = vi.mocked(fetch).mock.calls[0][1]?.body as FormData;
  expect((data.get('file') as File).name).toBe('audio.mp4');
  expect(data.get('language')).toBe('en');
  expect(data.has('prompt')).toBe(false);
});
it('rejects malformed transcription responses rather than treating them as speech', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response('{"text":42}', { status: 200 }));
  await expect(transcribeAudioWithGroq({ audioBlob: new Blob(['audio']) })).rejects.toThrow('INVALID_TRANSCRIPTION');
});
it('times out a hung transcription instead of leaving the capture busy forever', async () => {
  vi.useFakeTimers();
  vi.mocked(fetch).mockImplementation((_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  }));
  const result = transcribeAudioWithGroq({ audioBlob: new Blob(['audio']) });
  const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' });
  await vi.advanceTimersByTimeAsync(31000); await assertion;
});
