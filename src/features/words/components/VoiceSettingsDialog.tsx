import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VoiceSettingsDialog({ open, onOpenChange, apiKey, onKeyChange, hasKey, onSave, onRemove }: {
  open: boolean; onOpenChange: (open: boolean) => void;
  apiKey: string; onKeyChange: (key: string) => void;
  hasKey: boolean; onSave: () => void; onRemove: () => void;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const keyId = React.useId();
  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} onCancel={() => onOpenChange(false)} onClose={() => onOpenChange(false)}
    aria-labelledby={titleId} aria-describedby={descriptionId}
    className="m-auto w-[calc(100%_-_2rem)] max-w-md max-h-[90dvh] overflow-y-auto rounded-lg border border-border bg-paper p-5 sm:p-6 text-ink backdrop:bg-ink/40">
    <div className="flex items-start justify-between gap-3">
      <h2 id={titleId} className="font-serif text-xl font-semibold pt-2">Ovozli kiritish sozlamalari</h2>
      <Button variant="ghost" size="icon" aria-label="Ovoz sozlamalarini yopish" onClick={() => onOpenChange(false)}><X className="size-4" /></Button>
    </div>
    <p id={descriptionId} className="text-sm text-ink-muted mt-3">Ovozli kiritish uchun Groq kalitini ulang. Eshitilgan matnni qo‘shishdan oldin tekshirib tasdiqlaysiz.</p>
    <form className="mt-5 space-y-4" onSubmit={event => { event.preventDefault(); onSave(); }}>
      <div className="space-y-2">
        <label htmlFor={keyId} className="text-sm font-medium">Groq API kaliti</label>
        <input id={keyId} type="password" autoFocus autoComplete="off" value={apiKey} onChange={event => onKeyChange(event.target.value)}
          className="w-full min-h-11 rounded-md border border-border bg-paper-subtle px-3 text-base focus:outline-none focus:border-accent" />
        <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4">Groq kalitini olish</a>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        {hasKey && <Button variant="outline" onClick={onRemove}>Kalitni olib tashlash</Button>}
        <Button type="submit" variant="accent" disabled={!apiKey.trim()}>Saqlash</Button>
      </div>
    </form>
  </dialog>;
}
