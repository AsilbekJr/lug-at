import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { detectSpeechSpans, prepareRecordedAudio } from '../../src/features/words/services/speech-audio-browser';
import { prepareSpeechPcm, SpeechAudioError } from '../../src/features/words/services/speech-audio';
import '../../src/index.css';

function Fixture() {
  const [result, setResult] = React.useState('Tekshiruv boshlanmadi.');
  const [busy, setBusy] = React.useState(false);
  const run = async (kind: 'silence' | 'tone' | 'cancel') => {
    setBusy(true); setResult('Model va WASM tekshirilmoqda...');
    const abort = new AbortController();
    try {
      if (kind === 'tone') {
        const samples = Float32Array.from({ length: 32000 }, (_, i) => Math.sin(i * 2 * Math.PI * 440 / 16000) * .1);
        const encoded = prepareSpeechPcm(samples, null);
        const prepared = await prepareRecordedAudio(encoded.blob, abort.signal);
        setResult(`WAV tayyor: ${prepared.blob.type}, ${prepared.blob.size} bayt. ${prepared.warning || 'Model ishladi.'}`);
      } else {
        const task = detectSpeechSpans(new Float32Array(16000), abort.signal);
        if (kind === 'cancel') abort.abort();
        const spans = await task;
        setResult(`VAD tayyor. Jimlikdagi nutq bo‘laklari: ${spans.length}.`);
      }
    } catch (error) {
      setResult(error instanceof SpeechAudioError ? `Nutqsiz signal rad etildi: ${error.message}`
        : error instanceof DOMException && error.name === 'AbortError' ? 'Bekor qilindi.'
        : `SINOV XATOSI: ${String(error)}`);
    } finally { setBusy(false); }
  };
  return <main className="max-w-xl mx-auto p-4 space-y-4 text-ink">
    <h1 className="text-xl font-semibold">Audio tayyorlash — mahalliy sinov</h1>
    <p className="text-sm text-ink-muted">Mikrofon yozilmaydi. Audio tashqi xizmatga yuborilmaydi. Faqat sun’iy jimlik va 440 Hz signal ishlatiladi.</p>
    <div className="flex flex-wrap gap-2">{([
      ['silence', 'VAD va WASMni tekshirish'], ['tone', 'WAV tayyorlashni tekshirish'], ['cancel', 'Bekor qilishni tekshirish'],
    ] as const).map(([kind, label]) => <button key={kind} disabled={busy} onClick={() => run(kind)} className="min-h-11 border border-border rounded-md px-3">{label}</button>)}</div>
    <output aria-live="polite" className="block rounded-md border border-border p-4 text-sm break-words">{result}</output>
  </main>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
