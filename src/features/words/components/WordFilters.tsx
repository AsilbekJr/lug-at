import { Search, SlidersHorizontal } from 'lucide-react';
import type { CefrLevel } from '@/features/words/types';
import { cn } from '@/lib/utils';

export interface WordFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCefr: CefrLevel | 'all';
  onCefrChange: (cefr: CefrLevel | 'all') => void;
  sortBy: 'latest' | 'alphabetical' | 'level';
  onSortChange: (sort: 'latest' | 'alphabetical' | 'level') => void;
  totalCount: number;
}

const CEFR_OPTIONS: (CefrLevel | 'all')[] = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function WordFilters({
  search,
  onSearchChange,
  selectedCefr,
  onCefrChange,
  sortBy,
  onSortChange,
  totalCount,
}: WordFiltersProps) {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="So'z, ta'rif yoki o'zbekcha tarjimani qidirish..."
            className="w-full h-10 min-h-[44px] pl-10 pr-4 text-sm bg-paper text-ink border border-border rounded-[6px] placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-colors"
          />
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <label htmlFor="sort-select" className="text-xs text-ink-muted flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Saralash:</span>
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'latest' | 'alphabetical' | 'level')}
            className="h-10 min-h-[44px] px-3 py-1.5 text-xs font-medium bg-paper border border-border rounded-[6px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
          >
            <option value="latest">So'nggi qo'shilganlar</option>
            <option value="alphabetical">Alifbo bo'yicha (A-Z)</option>
            <option value="level">CEFR darajasi bo'yicha</option>
          </select>
        </div>
      </div>

      {/* CEFR Level Pills */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          {CEFR_OPTIONS.map((lvl) => {
            const isSelected = selectedCefr === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onCefrChange(lvl)}
                className={cn(
                  'px-3 py-1 text-xs rounded-[4px] border min-h-[36px] font-sans transition-colors cursor-pointer select-none',
                  isSelected
                    ? 'border-ink bg-ink text-paper font-semibold'
                    : 'border-border bg-paper text-ink-muted hover:text-ink hover:border-ink-muted'
                )}
              >
                {lvl === 'all' ? 'Barcha darajalar' : lvl}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-ink-muted shrink-0 hidden sm:inline">
          Jami: <strong className="text-ink font-semibold">{totalCount}</strong> ta so'z
        </span>
      </div>
    </div>
  );
}
