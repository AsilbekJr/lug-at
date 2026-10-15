import * as React from 'react';
import { Button } from '@/components/ui/button';
import type { SpeechDraft } from '../services/speech-capture';

export function SpeechTranscriptReview({ draft, onConfirm, onCancel, onRetry }: {
  draft: SpeechDraft;
  onConfirm: (text: string) => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const [selectedText, setSelectedText] = React.useState(draft.raw);
  const headingId = React.useId();
  const inputId = React.useId();
  return (
    <section aria-labelledby={headingId} className="rounded-[6px] border border-accent/30 bg-paper-subtle p-4 space-y-3 min-w-0">
      <h3 id={headingId} className="text-sm font-semibold text-ink">Eshitilgan matnni tekshiring</h3>
      {draft.audioWarning && <p role="status" className="text-xs text-amber-700 dark:text-amber-300 break-words">{draft.audioWarning}</p>}
      <div className="space-y-1">
        <p className="text-xs text-ink-muted">Eshitildi ({draft.lang === 'uz-UZ' ? 'O‘zbekcha' : 'Inglizcha'})</p>
        <p className="text-sm text-ink whitespace-pre-wrap break-words">{draft.raw}</p>
      </div>
      <div aria-live="polite" className="text-xs text-ink-muted">
        {draft.correctionStatus === 'pending' && 'Tuzatish taklifi tekshirilmoqda. Asl matnni hozir ham tasdiqlashingiz mumkin.'}
        {draft.correctionStatus === 'unavailable' && 'Tuzatish taklifi olinmadi. Asl matnni tekshiring yoki tahrirlang.'}
        {draft.correctionStatus === 'unchanged' && 'Qo‘shimcha tuzatish taklifi yo‘q. Eshitilgan matnni tekshiring.'}
        {draft.suggestion && (
          <div className="space-y-1">
            <p>Tuzatish taklifi — to‘g‘riligini tekshiring:</p>
            <p className="text-sm text-ink whitespace-pre-wrap break-words">{draft.suggestion}</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="min-h-11" onClick={() => setSelectedText(draft.raw)}>Asl matnni tanlash</Button>
        {draft.suggestion && <Button size="sm" variant="outline" className="min-h-11" onClick={() => setSelectedText(draft.suggestion!)}>Taklifni tanlash</Button>}
      </div>
      <div className="space-y-1">
        <label htmlFor={inputId} className="text-xs text-ink-muted">Tasdiqlanadigan matn — tahrirlashingiz mumkin</label>
        <textarea id={inputId} aria-label="Tasdiqlanadigan matn" rows={2} value={selectedText}
          onChange={event => setSelectedText(event.target.value)}
          className="w-full min-w-0 min-h-11 rounded-[6px] border border-border bg-paper p-3 text-base text-ink resize-y focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
      </div>
      <p className="text-xs text-ink-muted">Tasdiqlash matnni kiritish maydoniga o‘tkazadi. Keyin «Qo‘shish»ni bosing.</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="accent" className="min-h-11" disabled={!selectedText.trim()} onClick={() => onConfirm(selectedText)}>Tasdiqlash</Button>
        <Button size="sm" variant="outline" className="min-h-11" onClick={onRetry}>Qayta aytish</Button>
        <Button size="sm" variant="ghost" className="min-h-11" onClick={onCancel}>Bekor qilish</Button>
      </div>
    </section>
  );
}
