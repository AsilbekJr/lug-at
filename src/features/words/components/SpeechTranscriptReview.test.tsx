import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpeechTranscriptReview } from './SpeechTranscriptReview';
import type { SpeechDraft } from '../services/speech-capture';
const draft: SpeechDraft = { raw: 'torsli ko‘cha', suggestion: 'toshli ko‘cha', correctionStatus: 'available', lang: 'uz-UZ', provider: 'whisper' };
it('shows original and suggestion separately and defaults the editable selection to original speech', () => {
  const html = renderToStaticMarkup(<SpeechTranscriptReview draft={draft} onConfirm={() => {}} onCancel={() => {}} onRetry={() => {}} />);
  expect(html).toContain('torsli ko‘cha');
  expect(html).toContain('toshli ko‘cha');
  expect(html).toContain('aria-label="Tasdiqlanadigan matn"');
  expect(html).toContain('>torsli ko‘cha</textarea>');
  expect(html).toContain('Tasdiqlash');
  expect(html).toContain('Tuzatish taklifi —');
  expect(html).not.toContain('AI tuzatish');
});
it('keeps raw speech editable and confirmable when correction is unavailable', () => {
  const html = renderToStaticMarkup(<SpeechTranscriptReview draft={{ ...draft, suggestion: null, correctionStatus: 'unavailable' }} onConfirm={() => {}} onCancel={() => {}} onRetry={() => {}} />);
  expect(html).toContain('Tuzatish taklifi olinmadi');
  expect(html).toContain('>torsli ko‘cha</textarea>');
  expect(html).not.toContain('toshli ko‘cha');
});

it('makes a failed audio filter visible while still allowing manual confirmation', () => {
  const html = renderToStaticMarkup(<SpeechTranscriptReview draft={{ ...draft, audioWarning: 'Nutq filtri ishlamadi.' }} onConfirm={() => {}} onCancel={() => {}} onRetry={() => {}} />);
  expect(html).toContain('Nutq filtri ishlamadi.');
  expect(html).toContain('Tasdiqlash');
});
