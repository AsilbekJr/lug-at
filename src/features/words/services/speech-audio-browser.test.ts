import { afterEach, expect, it, vi } from 'vitest';
import { prepareRecordedAudio } from './speech-audio-browser';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
function stalledDecoder() {
  const close = vi.fn(async () => {});
  vi.stubGlobal('AudioContext', class {
    close = close;
    decodeAudioData() { return new Promise(() => {}); }
  });
  return close;
}

it('closes a stalled audio context on cancellation instead of retaining native resources', async () => {
  const close = stalledDecoder();
  const abort = new AbortController();
  const result = prepareRecordedAudio(new Blob(['audio']), abort.signal);
  abort.abort();
  await expect(result).rejects.toMatchObject({ name: 'AbortError' });
  expect(close).toHaveBeenCalledOnce();
});

it('bounds a stalled decoder and visibly falls back to the original recording', async () => {
  vi.useFakeTimers(); const close = stalledDecoder();
  const blob = new Blob(['audio'], { type: 'audio/webm' });
  const task = prepareRecordedAudio(blob, new AbortController().signal);
  await vi.advanceTimersByTimeAsync(20001);
  const result = await task;
  expect(result.blob).toBe(blob); expect(result.warning).toContain('Asl yozuv');
  expect(close).toHaveBeenCalledOnce();
});

it('rejects empty input before allocating a decoder or loading a model', async () => {
  const close = stalledDecoder();
  await expect(prepareRecordedAudio(new Blob([]), new AbortController().signal)).rejects.toThrow('Ovoz');
  expect(close).not.toHaveBeenCalled();
});
