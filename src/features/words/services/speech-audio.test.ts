import { expect, it } from 'vitest';
import { prepareSpeechPcm } from './speech-audio';

async function decodeWav(blob: Blob) {
  const data = new DataView(await blob.arrayBuffer());
  return { data, samples: Array.from({ length: (data.byteLength - 44) / 2 }, (_, index) => data.getInt16(44 + index * 2, true)) };
}

it('encodes mono 16 kHz WAV without clipping peaks or inventing extra samples', async () => {
  const result = prepareSpeechPcm(new Float32Array([-1, -.5, 0, .5, 1]), null);
  const { data, samples } = await decodeWav(result.blob);
  expect(result.blob.type).toBe('audio/wav');
  expect(data.getUint16(22, true)).toBe(1);
  expect(data.getUint32(24, true)).toBe(16000);
  expect(data.getUint16(34, true)).toBe(16);
  expect(samples).toEqual([-32768, -16384, 0, 16383, 32767]);
});

it('trims only outside all speech spans and keeps padding plus pauses inside the phrase', async () => {
  const audio = new Float32Array(16000 * 5);
  audio.fill(.25, 16000, 24000); audio.fill(-.25, 48000, 56000);
  const result = prepareSpeechPcm(audio, [{ start: 1000, end: 1500 }, { start: 3000, end: 3500 }]);
  const { samples } = await decodeWav(result.blob);
  // First speech minus 800ms; last speech plus 300ms => 200..3800ms.
  expect(samples).toHaveLength(57600);
  expect(samples[12800]).toBe(8191);
  expect(samples[28800]).toBe(0); // The 2-second point remains a pause.
  expect(samples[44800]).toBe(-8192);
});

it('does not send detected silence or empty recordings to speech recognition', () => {
  expect(() => prepareSpeechPcm(new Float32Array(16000), [])).toThrow('Ovoz');
  expect(() => prepareSpeechPcm(new Float32Array(0), null)).toThrow('Ovoz');
});

it('keeps the full recording and returns a visible warning when VAD is unavailable', async () => {
  const audio = new Float32Array(16000).fill(.01);
  const result = prepareSpeechPcm(audio, null);
  expect((await decodeWav(result.blob)).samples).toHaveLength(16000);
  expect(result.warning).toBeTruthy();
});

it('rejects corrupted and excessively long audio instead of uploading it', () => {
  expect(() => prepareSpeechPcm(new Float32Array([NaN, .2]), null)).toThrow();
  expect(() => prepareSpeechPcm(new Float32Array(16000 * 61), null)).toThrow('60');
});

it('does not cut a very short word at either recording boundary', async () => {
  const audio = new Float32Array(1600).fill(.05);
  const result = prepareSpeechPcm(audio, [{ start: 0, end: 100 }]);
  expect((await decodeWav(result.blob)).samples).toHaveLength(1600);
});
