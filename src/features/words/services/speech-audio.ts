export const SPEECH_SAMPLE_RATE = 16000;
export interface SpeechSpan { start: number; end: number }
export interface PreparedSpeechAudio { blob: Blob; warning?: string }
export class SpeechAudioError extends Error {}

/** Encodes PCM without applying gain, removing inner pauses, or changing spoken content. */
export function prepareSpeechPcm(samples: Float32Array, spans: SpeechSpan[] | null): PreparedSpeechAudio {
  if (!samples.length) throw new SpeechAudioError('Ovoz yozilmadi. Qaytadan ayting.');
  if (samples.length > SPEECH_SAMPLE_RATE * 60) throw new SpeechAudioError('Yozuv 60 soniyadan oshdi. Qisqaroq gap ayting.');
  let peak = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample)) throw new SpeechAudioError('Ovoz fayli buzilgan. Qaytadan yozing.');
    peak = Math.max(peak, Math.abs(sample));
  }
  if (peak < .00001 || spans?.length === 0) throw new SpeechAudioError('Ovozda nutq aniqlanmadi. Mikrofonga yaqinroq, ravon ayting yoki matnni yozing.');
  let first = 0;
  let last = samples.length;
  if (spans) {
    if (spans.some(span => !Number.isFinite(span.start) || !Number.isFinite(span.end) || span.start < 0 || span.end <= span.start)) {
      throw new SpeechAudioError('Ovoz chegaralari aniqlanmadi. Qaytadan ayting.');
    }
    // Generous onset padding protects short initial consonants; only trim outer silence.
    first = Math.max(0, Math.floor((Math.min(...spans.map(span => span.start)) - 800) * 16));
    last = Math.min(samples.length, Math.ceil((Math.max(...spans.map(span => span.end)) + 300) * 16));
    if (last <= first) throw new SpeechAudioError('Ovoz chegaralari aniqlanmadi. Qaytadan ayting.');
  }
  const length = last - first;
  const bytes = new ArrayBuffer(44 + length * 2);
  const data = new DataView(bytes);
  const label = (offset: number, text: string) => Array.from(text).forEach((char, index) => data.setUint8(offset + index, char.charCodeAt(0)));
  label(0, 'RIFF'); data.setUint32(4, 36 + length * 2, true); label(8, 'WAVE'); label(12, 'fmt ');
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 1, true);
  data.setUint32(24, SPEECH_SAMPLE_RATE, true); data.setUint32(28, SPEECH_SAMPLE_RATE * 2, true);
  data.setUint16(32, 2, true); data.setUint16(34, 16, true); label(36, 'data'); data.setUint32(40, length * 2, true);
  for (let index = 0; index < length; index++) {
    const sample = Math.max(-1, Math.min(1, samples[first + index]));
    data.setInt16(44 + index * 2, sample * (sample < 0 ? 32768 : 32767), true);
  }
  return {
    blob: new Blob([bytes], { type: 'audio/wav' }),
    warning: spans === null ? 'Nutq filtri ishlamadi. To‘liq yozuv ishlatildi — eshitilgan matnni diqqat bilan tekshiring.' : undefined,
  };
}
