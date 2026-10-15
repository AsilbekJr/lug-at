import { afterEach, expect, it, vi } from 'vitest';
import { SpeechCaptureController, type SpeechCaptureDependencies, type RecorderLike, type RecognitionLike } from './speech-capture';
import { SpeechAudioError } from './speech-audio';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function setup() {
  const stopped: number[] = [];
  const recorders: RecorderLike[] = [];
  const recognition = deferred<string>();
  const correction = deferred<{ suggestion: string | null; status: 'available' }>();
  const accepted: string[] = [];
  let streamIndex = 0;
  const dependencies: SpeechCaptureDependencies = {
    canRecord: () => true,
    getUserMedia: async () => {
      const index = ++streamIndex;
      return { getTracks: () => [{ stop: () => stopped.push(index) }] };
    },
    createRecorder: () => {
      const recorder: RecorderLike = {
        state: 'inactive', mimeType: 'audio/webm', onstart: null, onstop: null,
        ondataavailable: null, onerror: null,
        start() { this.state = 'recording'; this.onstart?.(); },
        stop() {
          this.state = 'inactive';
          this.ondataavailable?.({ data: new Blob(['recorded speech']) });
          this.onstop?.();
        },
      };
      recorders.push(recorder);
      return recorder;
    },
    createRecognition: () => null,
    transcribe: () => recognition.promise,
    suggest: () => correction.promise,
  };
  const controller = new SpeechCaptureController(dependencies, text => accepted.push(text));
  return { controller, dependencies, recognition, correction, accepted, stopped, recorders };
}

async function flush() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
afterEach(() => vi.restoreAllMocks());

it('keeps raw words separate from correction and accepts only explicitly chosen text', async () => {
  const f = setup();
  await f.controller.start('uz-UZ');
  f.controller.stop();
  f.recognition.resolve('torsli ko‘cha');
  await flush();
  expect(f.controller.getSnapshot().draft?.raw).toBe('torsli ko‘cha');
  expect(f.accepted).toEqual([]);
  f.correction.resolve({ suggestion: 'toshli ko‘cha', status: 'available' });
  await flush();
  expect(f.controller.getSnapshot().draft).toMatchObject({ raw: 'torsli ko‘cha', suggestion: 'toshli ko‘cha', lang: 'uz-UZ', provider: 'whisper' });
  f.controller.confirm('torsli ko‘cha');
  expect(f.accepted).toEqual(['torsli ko‘cha']);
  expect(f.controller.getSnapshot().draft).toBeNull();
});

it('does not resurrect a draft after a manual edit cancels transcription', async () => {
  const f = setup();
  await f.controller.start('uz-UZ'); f.controller.stop(); f.controller.cancel();
  f.recognition.resolve('old recording'); await flush();
  expect(f.controller.getSnapshot().draft).toBeNull();
  expect(f.controller.getSnapshot().status).toBe('idle');
  expect(f.accepted).toEqual([]);
});

it('can confirm edited raw text before correction finishes without a late overwrite', async () => {
  const f = setup();
  await f.controller.start('uz-UZ'); f.controller.stop();
  f.recognition.resolve('torsli ko‘cha'); await flush();
  f.controller.confirm('Toshli ko‘cha!');
  f.correction.resolve({ suggestion: 'wrong late answer', status: 'available' }); await flush();
  expect(f.accepted).toEqual(['Toshli ko‘cha!']);
  expect(f.controller.getSnapshot().draft).toBeNull();
});

it('releases a stream granted after cancellation and never starts its recorder', async () => {
  const f = setup(); const permission = deferred<{ getTracks: () => { stop: () => void }[] }>();
  f.dependencies.getUserMedia = () => permission.promise;
  const pending = f.controller.start('uz-UZ'); f.controller.cancel();
  permission.resolve({ getTracks: () => [{ stop: () => f.stopped.push(99) }] }); await pending;
  expect(f.stopped).toEqual([99]); expect(f.recorders).toHaveLength(0);
  expect(f.controller.getSnapshot().status).toBe('idle');
});

it('ignores old recorder callbacks and old results while a new session is listening', async () => {
  const f = setup();
  await f.controller.start('uz-UZ'); f.controller.stop();
  await f.controller.start('en-US');
  f.recorders[0].onstop?.(); f.recognition.resolve('old recording'); await flush();
  expect(f.recorders[1].state).toBe('recording');
  expect(f.controller.getSnapshot().status).toBe('listening');
  expect(f.controller.getSnapshot().draft).toBeNull();
  f.controller.cancel(); expect(f.stopped).toEqual([1, 2]);
});

it('keeps raw text usable when correction fails', async () => {
  const f = setup();
  f.dependencies.suggest = async () => { throw new Error('offline'); };
  await f.controller.start('en-US'); f.controller.stop();
  f.recognition.resolve('English original'); await flush();
  expect(f.controller.getSnapshot().draft).toMatchObject({ raw: 'English original', correctionStatus: 'unavailable', suggestion: null });
  f.controller.confirm('English original'); expect(f.accepted).toEqual(['English original']);
});

it('reports empty speech and never permits confirmation without a draft', async () => {
  const f = setup();
  await f.controller.start('uz-UZ'); f.controller.stop(); f.recognition.resolve('   '); await flush();
  expect(f.controller.getSnapshot().error).toBeTruthy();
  expect(f.controller.getSnapshot().status).toBe('idle');
  f.controller.confirm('injected'); expect(f.accepted).toEqual([]);
});

it('aborts work and ignores completions after disposal', async () => {
  const f = setup(); let signal!: AbortSignal;
  f.dependencies.transcribe = (_blob, _lang, incoming) => { signal = incoming; return f.recognition.promise; };
  await f.controller.start('uz-UZ'); f.controller.stop(); f.controller.dispose();
  expect(signal.aborted).toBe(true);
  f.recognition.resolve('late'); await flush(); expect(f.accepted).toEqual([]);
  expect(f.controller.getSnapshot().draft).toBeNull();
});

it('collects final browser results without auto-accepting or publishing interim words', async () => {
  const f = setup();
  const browser: RecognitionLike = {
    continuous: false, interimResults: true, lang: '', maxAlternatives: 1,
    onstart: null, onend: null, onresult: null, onerror: null,
    start() { this.onstart?.(); }, stop() { this.onend?.(); }, abort() {},
  };
  f.dependencies.canRecord = () => false;
  f.dependencies.createRecognition = () => browser;
  await f.controller.start('uz-UZ');
  browser.onresult?.({ results: [{ isFinal: true, 0: { transcript: 'toshli' } }, { isFinal: false, 0: { transcript: 'wrong interim' } }] });
  expect(f.controller.getSnapshot().draft).toBeNull();
  browser.onresult?.({ results: [{ isFinal: true, 0: { transcript: 'toshli' } }, { isFinal: true, 0: { transcript: 'ko‘cha' } }] });
  f.controller.stop(); await flush();
  expect(f.controller.getSnapshot().draft?.raw).toBe('toshli ko‘cha');
  expect(f.accepted).toEqual([]);
  f.controller.cancel(); browser.onend?.();
  expect(f.controller.getSnapshot().status).toBe('idle');
});

it('does not silently fall back after microphone permission is denied', async () => {
  const f = setup();
  f.dependencies.getUserMedia = async () => { throw Object.assign(new Error('denied'), { name: 'NotAllowedError' }); };
  await f.controller.start('uz-UZ');
  expect(f.controller.getSnapshot().error).toContain('ruxsati');
  expect(f.controller.getSnapshot().status).toBe('idle');
});

it('shows the audio-quality fallback warning alongside unchanged raw text', async () => {
  const f = setup();
  f.dependencies.transcribe = async () => ({ text: 'torsli ko‘cha', audioWarning: 'Nutq filtri ishlamadi.' });
  await f.controller.start('uz-UZ'); f.controller.stop(); await flush();
  expect(f.controller.getSnapshot().draft).toMatchObject({ raw: 'torsli ko‘cha', audioWarning: 'Nutq filtri ishlamadi.' });
});

it('shows a no-speech preparation error instead of misleading API-key advice', async () => {
  const f = setup();
  f.dependencies.transcribe = async () => { throw new SpeechAudioError('Ovozda nutq aniqlanmadi.'); };
  await f.controller.start('uz-UZ'); f.controller.stop(); await flush();
  expect(f.controller.getSnapshot().error).toBe('Ovozda nutq aniqlanmadi.');
  expect(f.controller.getSnapshot().draft).toBeNull();
});
