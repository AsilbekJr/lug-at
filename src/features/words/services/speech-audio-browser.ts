import { prepareSpeechPcm, SpeechAudioError, SPEECH_SAMPLE_RATE, type PreparedSpeechAudio, type SpeechSpan } from './speech-audio';
import type { FrameProcessorEvent } from '@ricky0123/vad-web/dist/frame-processor';

function cancelled(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
}
function abortable<T>(signal: AbortSignal, operation: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Cancelled', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    operation.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
    if (signal.aborted) abort();
  });
}

/** Lazy, local Silero detection. Own and release each inference session, including on cancellation. */
export async function detectSpeechSpans(samples: Float32Array, signal: AbortSignal): Promise<SpeechSpan[]> {
  cancelled(signal);
  const [{ FrameProcessor, Message }, { SileroLegacy }, ort] = await Promise.all([
    import('@ricky0123/vad-web'),
    import('@ricky0123/vad-web/dist/models/legacy'),
    import('onnxruntime-web/wasm'),
  ]);
  cancelled(signal);
  const base = new URL(`${import.meta.env.BASE_URL}speech-vad/`, window.location.origin).href;
  ort.env.wasm.numThreads = 1; // Works without cross-origin isolation, including mobile browsers.
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = {
    mjs: `${base}ort-wasm-simd-threaded.mjs`,
    wasm: `${base}ort-wasm-simd-threaded.wasm`,
  };
  const model = await SileroLegacy.new(ort, async () => {
    const response = await fetch(`${base}silero_vad_legacy.onnx`, { signal });
    if (!response.ok) throw new Error('VAD_MODEL_UNAVAILABLE');
    return response.arrayBuffer();
  });
  try {
    cancelled(signal);
    const processor = new FrameProcessor(model.process, model.reset_state, {
      positiveSpeechThreshold: .3, negativeSpeechThreshold: .2,
      minSpeechMs: 64, preSpeechPadMs: 800, redemptionMs: 300,
      submitUserSpeechOnPause: true,
    }, 96);
    processor.resume();
    const spans: SpeechSpan[] = [];
    let start = 0;
    let frameStart = 0;
    let frameEnd = 0;
    const handle = (event: FrameProcessorEvent) => {
      if (event.msg === Message.SpeechStart) start = frameStart;
      if (event.msg === Message.SpeechEnd && frameEnd > start) spans.push({ start, end: frameEnd });
    };
    for (let offset = 0; offset < samples.length; offset += 1536) {
      cancelled(signal);
      const frame = new Float32Array(1536);
      frame.set(samples.subarray(offset, Math.min(offset + 1536, samples.length)));
      frameStart = offset / 16;
      frameEnd = Math.min(offset + 1536, samples.length) / 16;
      await processor.process(frame, handle);
    }
    cancelled(signal);
    processor.endSegment(handle);
    return spans;
  } finally { await model.release(); }
}

async function decodeMono(blob: Blob, signal: AbortSignal): Promise<Float32Array> {
  cancelled(signal);
  const context = new AudioContext();
  let closing: Promise<void> | undefined;
  const close = () => { closing ??= context.close().catch(() => {}); return closing; };
  const abort = () => { void close(); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    const bytes = await blob.arrayBuffer();
    cancelled(signal);
    const decoded = await context.decodeAudioData(bytes);
    cancelled(signal);
    if (!decoded.length || decoded.duration > 60) throw new SpeechAudioError('Yozuv bo‘sh yoki 60 soniyadan uzun. Qisqaroq gap ayting.');
    const mono = context.createBuffer(1, decoded.length, decoded.sampleRate);
    const target = mono.getChannelData(0);
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const source = decoded.getChannelData(channel);
      for (let index = 0; index < target.length; index++) target[index] += source[index] / decoded.numberOfChannels;
    }
    const resampler = new OfflineAudioContext(1, Math.ceil(decoded.duration * SPEECH_SAMPLE_RATE), SPEECH_SAMPLE_RATE);
    const source = resampler.createBufferSource(); source.buffer = mono; source.connect(resampler.destination); source.start();
    const rendered = await resampler.startRendering();
    cancelled(signal);
    return rendered.getChannelData(0).slice();
  } finally { signal.removeEventListener('abort', abort); await close(); }
}

export async function prepareRecordedAudio(blob: Blob, signal: AbortSignal): Promise<PreparedSpeechAudio> {
  cancelled(signal);
  if (!blob.size) throw new SpeechAudioError('Ovoz yozilmadi. Qaytadan ayting.');
  if (blob.size > 10 * 1024 * 1024) throw new SpeechAudioError('Ovoz fayli juda katta. 60 soniyadan qisqaroq gap ayting.');
  const deadline = new AbortController();
  const abort = () => deadline.abort();
  signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 20000);
  let fallback: PreparedSpeechAudio | undefined;
  try {
    return await abortable(deadline.signal, (async () => {
      const samples = await decodeMono(blob, deadline.signal);
      // Validate even when the model fails; pure silence should never reach the cloud recognizer.
      fallback = prepareSpeechPcm(samples, null);
      const spans = await detectSpeechSpans(samples, deadline.signal);
      return prepareSpeechPcm(samples, spans);
    })());
  } catch (error) {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (error instanceof SpeechAudioError) throw error;
    return fallback || { blob, warning: 'Ovozni tayyorlash ishlamadi. Asl yozuv ishlatildi — eshitilgan matnni diqqat bilan tekshiring.' };
  } finally {
    clearTimeout(timer); signal.removeEventListener('abort', abort); deadline.abort();
  }
}
