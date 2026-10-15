import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function DailyGoal({ wordsAdded, sentencesAdded }: { wordsAdded: number; sentencesAdded: number }) {
  const [goal, setGoal] = React.useState(() => {
    try {
      const saved = Number(localStorage.getItem('linguist_daily_quota'));
      if (Number.isInteger(saved) && saved >= 8 && saved <= 500) return saved;
    } catch { /* Default also supports SSR and unavailable storage. */ }
    return 8;
  });
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(String(goal));
  const [error, setError] = React.useState<string | null>(null);
  const inputId = React.useId();
  const total = wordsAdded + sentencesAdded;
  const save = (next: number) => {
    if (!Number.isInteger(next) || next < 8 || next > 500) return;
    try {
      localStorage.setItem('linguist_daily_quota', String(next));
      setGoal(next); setEditing(false); setError(null);
    } catch { setError('Maqsad saqlanmadi. Brauzer xotirasini tekshirib, qayta urinib ko‘ring.'); }
  };
  return <Card className="p-4 sm:p-5 space-y-3" aria-labelledby={`${inputId}-title`}>
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <h2 id={`${inputId}-title`} className="text-sm font-semibold">Kunlik maqsad</h2>
      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums text-ink-muted"><strong className="text-ink">{total}</strong> / {goal}</span>
        <Button variant="ghost" size="sm" className="min-h-11" aria-expanded={editing} aria-controls={`${inputId}-editor`}
          onClick={() => { setValue(String(goal)); setError(null); setEditing(!editing); }}>O‘zgartirish</Button>
      </div>
    </div>
    <div role="progressbar" aria-label="Kunlik maqsad" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(total, goal)}
      aria-valuetext={`${total} ta qo‘shildi, maqsad ${goal} ta`}
      className="h-1.5 rounded-full bg-paper-muted overflow-hidden">
      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.min(100, total / goal * 100)}%` }} />
    </div>
    <p className="text-xs text-ink-muted">{wordsAdded} ta so‘z va {sentencesAdded} ta gap qo‘shildi.{total >= goal ? ' Bugungi maqsad bajarildi.' : ''}</p>
    {editing && <div id={`${inputId}-editor`} className="pt-3 border-t border-border space-y-3">
      <div className="flex flex-wrap gap-2">{[8, 15, 25].map(preset => <Button key={preset} size="sm" variant={goal === preset ? 'secondary' : 'outline'} className="min-h-11" onClick={() => save(preset)}>{preset} ta</Button>)}</div>
      <form onSubmit={event => { event.preventDefault(); save(Number(value)); }} className="space-y-2">
        <label htmlFor={inputId} className="text-xs text-ink-muted">Kuniga qo‘shiladigan so‘z va gaplar soni (8–500)</label>
        <div className="flex flex-wrap gap-2">
          <input id={inputId} type="number" min={8} max={500} step={1} required value={value} onChange={event => setValue(event.target.value)} className="w-24 min-h-11 rounded-md border border-border bg-paper px-3 text-base text-ink" />
          <Button type="submit" variant="outline" disabled={!value || !Number.isInteger(Number(value)) || Number(value) < 8 || Number(value) > 500}>Saqlash</Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>Bekor qilish</Button>
        </div>
      </form>
      {error && <p role="alert" className="text-sm text-rating-again">{error}</p>}
    </div>}
  </Card>;
}
