import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { transcribeRecordedSpeech } from './recorded-speech';
import { prepareSpeechPcm, SpeechAudioError } from './speech-audio';

const fixture = vi.hoisted(() => ({ prepare: vi.fn() }));
// Browser decoding/VAD require WebAudio and WASM. The real WAV encoder and HTTP
// upload boundary remain in this test; real browser VAD has its own local fixture.
vi.mock('./speech-audio-browser', () => ({ prepareRecordedAudio: fixture.prepare }));
beforeEach(() => {
  fixture.prepare.mockReset();
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', { getItem: () => 'test-key' });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"text":"toshli ko‘cha"}', { status: 200 })));
});
afterEach(() => vi.unstubAllGlobals());

it('uploads the prepared mono WAV to the multilingual model with Uzbek language fixed', async () => {
  const prepared = prepareSpeechPcm(new Float32Array(1600).fill(.1), [{ start: 0, end: 100 }]);
  fixture.prepare.mockResolvedValue(prepared);
  const result = await transcribeRecordedSpeech(new Blob(['recording'], { type: 'audio/webm' }), 'uz-UZ', new AbortController().signal);
  const form = vi.mocked(fetch).mock.calls[0][1]?.body as FormData;
  const audio = form.get('file') as File;
  expect(audio.type).toBe('audio/wav'); expect(audio.name).toBe('audio.wav');
  expect(await audio.arrayBuffer()).toEqual(await prepared.blob.arrayBuffer());
  expect(form.get('language')).toBe('uz'); expect(form.get('model')).toBe('whisper-large-v3');
  expect(result.text).toBe('toshli ko‘cha');
});
it('does not upload audio when preparation detected no speech', async () => {
  fixture.prepare.mockRejectedValue(new SpeechAudioError('Ovozda nutq aniqlanmadi.'));
  await expect(transcribeRecordedSpeech(new Blob(['recording']), 'uz-UZ', new AbortController().signal)).rejects.toThrow('nutq');
  expect(fetch).not.toHaveBeenCalled();
});
it('does not upload an old recording cancelled while audio preparation was pending', async () => {
  const abort = new AbortController();
  fixture.prepare.mockImplementation(async () => { abort.abort(); return prepareSpeechPcm(new Float32Array(1600).fill(.1), null); });
  await expect(transcribeRecordedSpeech(new Blob(['recording']), 'en-US', abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled();
});
it('preserves the filter fallback warning with the original recognizer output', async () => {
  fixture.prepare.mockResolvedValue(prepareSpeechPcm(new Float32Array(1600).fill(.1), null));
  const result = await transcribeRecordedSpeech(new Blob(['recording']), 'en-US', new AbortController().signal);
  expect(result.text).toBe('toshli ko‘cha'); expect(result.audioWarning).toContain('filtri');
});
