// Local regression fixture: real spelling service and confirmation UI, no audio.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { SpeechTranscriptReview } from '../../src/features/words/components/SpeechTranscriptReview';
import { normalizeSpeechWithAI } from '../../src/features/words/services/speech-normalizer';
import type { SpeechDraft } from '../../src/features/words/services/speech-capture';
import '../../src/index.css';

function Fixture() {
  const [draft, setDraft] = React.useState<SpeechDraft | null>(null);
  const [accepted, setAccepted] = React.useState('');
  async function check() {
    const raw = 'Choy Khana';
    const result = await normalizeSpeechWithAI(raw, 'uz-UZ');
    setDraft({ raw, suggestion: result.suggestion, correctionStatus: result.status, lang: 'uz-UZ', provider: 'whisper' });
  }
  return <main className="max-w-2xl mx-auto p-4 space-y-4 text-ink">
    <h1 className="text-xl font-semibold">O‘zbekcha nutq imlosi — mahalliy sinov</h1>
    <p className="text-sm text-ink-muted">«Choy Khana» matni bilan tekshiruv. Bu sinov mikrofon yoki tashqi API ishlatmaydi.</p>
    <button type="button" className="min-h-11 px-3 border border-border rounded-md" onClick={check}>Imlo taklifini tekshirish</button>
    {draft && <SpeechTranscriptReview draft={draft} onConfirm={text => { setAccepted(text); setDraft(null); }} onCancel={() => setDraft(null)} onRetry={check} />}
    <output className="block text-sm">Tasdiqlangan matn: {accepted || 'Hali tasdiqlanmadi'}</output>
  </main>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
