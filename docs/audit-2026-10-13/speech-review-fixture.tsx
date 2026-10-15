// Local visual/interaction fixture. No microphone, external API or database writes.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { SpeechTranscriptReview } from '../../src/features/words/components/SpeechTranscriptReview';
import type { SpeechDraft } from '../../src/features/words/services/speech-capture';
import '../../src/index.css';

const original: SpeechDraft = { raw: 'torsli ko‘cha', suggestion: null, correctionStatus: 'pending', lang: 'uz-UZ', provider: 'whisper' };
function Fixture() {
  const [draft, setDraft] = React.useState<SpeechDraft | null>(original);
  const [accepted, setAccepted] = React.useState('Oldingi qo‘lda yozilgan matn');
  return <main className="max-w-2xl mx-auto p-4 space-y-4 text-ink">
    <h1 className="text-xl font-semibold">Nutqni tasdiqlash — mahalliy sinov</h1>
    <p className="text-sm text-ink-muted">Bu namuna ovoz yozmaydi va hech qayerga ma’lumot yubormaydi.</p>
    <label className="block text-sm">Asosiy kiritish maydoni<input aria-label="Asosiy kiritish maydoni" className="block w-full mt-2 min-h-11 border border-border rounded-md px-3 bg-paper text-ink" value={accepted} onChange={event => { setDraft(null); setAccepted(event.target.value); }} /></label>
    <div className="flex flex-wrap gap-2">
      <button type="button" className="min-h-11 px-3 border border-border rounded-md" onClick={() => setDraft(original)}>Sinov matnini ko‘rsatish</button>
      <button type="button" className="min-h-11 px-3 border border-border rounded-md" disabled={!draft} onClick={() => setDraft(current => current ? { ...current, suggestion: 'toshli ko‘cha', correctionStatus: 'available' } : null)}>Kech kelgan AI taklifini ko‘rsatish</button>
      <button type="button" className="min-h-11 px-3 border border-border rounded-md" onClick={() => setDraft({ ...original, correctionStatus: 'unavailable' })}>AI xatosini ko‘rsatish</button>
    </div>
    {draft && <SpeechTranscriptReview draft={draft} onConfirm={text => { setAccepted(text); setDraft(null); }} onCancel={() => setDraft(null)} onRetry={() => { setDraft(null); setTimeout(() => setDraft(original), 0); }} />}
    <output className="block text-sm">Tanlangan matn: {accepted}</output>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
