import * as React from 'react';
import { useCurriculum, type CuratedLevelFilter, type CuratedFilterType } from '@/features/words/hooks/use-curriculum';
import type { CuratedWord } from '@/features/words/types/curriculum';
import { CuratedWordCard } from './CuratedWordCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Layers, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

interface CuratedCatalogViewProps {
  onSelectWord: (word: CuratedWord) => void;
  compact?: boolean;
}

const CEFR_LEVELS: { id: CuratedLevelFilter; label: string }[] = [
  { id: 'ALL', label: 'Barchasi' },
  { id: 'A1', label: 'A1 Boshlang‘ich' },
  { id: 'A2', label: 'A2 Elementar' },
  { id: 'B1', label: 'B1 O‘rta' },
  { id: 'B2', label: 'B2 Yuqori o‘rta' },
  { id: 'C1', label: 'C1 Ilg‘or' },
];

export const CuratedCatalogView: React.FC<CuratedCatalogViewProps> = ({
  onSelectWord,
  compact = false,
}) => {
  const {
    curriculumDays,
    thematicUnits,
    totalCurriculumWords,
    totalTopicWords,
    isWordLearned,
    learnedCount,
  } = useCurriculum();

  const [search, setSearch] = React.useState('');
  const [selectedLevel, setSelectedLevel] = React.useState<CuratedLevelFilter>('ALL');
  const [sourceType, setSourceType] = React.useState<CuratedFilterType>('all');
  const [onlyUnlearned, setOnlyUnlearned] = React.useState(false);
  const [activeUnit, setActiveUnit] = React.useState<{
    title: string;
    cefr: string;
    words: CuratedWord[];
  } | null>(null);

  // Filtered curriculum days
  const filteredDays = React.useMemo(() => {
    if (sourceType === 'topics') return [];
    return curriculumDays.filter((day) => {
      if (selectedLevel !== 'ALL' && day.cefr !== selectedLevel) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesTopic = day.topic.toLowerCase().includes(q) || day.topicUz.toLowerCase().includes(q);
        const matchesWord = day.words.some(
          (w) => w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q)
        );
        return matchesTopic || matchesWord;
      }
      return true;
    });
  }, [curriculumDays, selectedLevel, sourceType, search]);

  // Filtered thematic units
  const filteredUnits = React.useMemo(() => {
    if (sourceType === 'curriculum') return [];
    return thematicUnits.filter((unit) => {
      if (selectedLevel !== 'ALL' && unit.cefr !== selectedLevel) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesTitle = unit.title.toLowerCase().includes(q) || unit.titleUz.toLowerCase().includes(q);
        const matchesWord = unit.words.some(
          (w) => w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q)
        );
        return matchesTitle || matchesWord;
      }
      return true;
    });
  }, [thematicUnits, selectedLevel, sourceType, search]);

  // Direct word search results when search is typed
  const searchResults = React.useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase().trim();
    const results: CuratedWord[] = [];
    const seen = new Set<string>();

    const checkAndAdd = (words: CuratedWord[]) => {
      for (const w of words) {
        if (selectedLevel !== 'ALL' && w.cefr !== selectedLevel) continue;
        if (onlyUnlearned && isWordLearned(w.word)) continue;

        if (w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q)) {
          if (!seen.has(w.word.toLowerCase())) {
            seen.add(w.word.toLowerCase());
            results.push(w);
            if (results.length >= 60) return; // limit for fast DOM render
          }
        }
      }
    };

    if (sourceType !== 'topics') {
      for (const d of curriculumDays) {
        checkAndAdd(d.words);
        if (results.length >= 60) break;
      }
    }
    if (sourceType !== 'curriculum' && results.length < 60) {
      for (const u of thematicUnits) {
        checkAndAdd(u.words);
        if (results.length >= 60) break;
      }
    }

    return results;
  }, [search, selectedLevel, sourceType, onlyUnlearned, curriculumDays, thematicUnits, isWordLearned]);

  const totalCatalogWords = totalCurriculumWords + totalTopicWords;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header and Summary stats */}
      <div className="space-y-3 pb-3 border-b border-[var(--color-border)] pr-12 sm:pr-14">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[var(--color-text)]">
              Tayyor lug'at to'plamlari
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              CEFR darajalari (A1–C1) bo‘yicha 90 kunlik darslik va 250 ta mavzuli lug‘at.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] bg-[var(--color-surface-subtle)] px-2.5 py-1 rounded-[6px] border border-[var(--color-border)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{learnedCount} o‘rganilgan / {totalCatalogWords} jami</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveUnit(null);
            }}
            placeholder="So‘z, tarjima yoki mavzuni qidiring (masalan: achieve, oila, sayohat)..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-1"
            >
              Tozalash
            </button>
          )}
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
          {CEFR_LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => {
                setSelectedLevel(lvl.id);
                setActiveUnit(null);
              }}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors shrink-0 min-h-[36px] ${
                selectedLevel === lvl.id
                  ? 'bg-[var(--color-accent)] text-white shadow-xs'
                  : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        {/* Source Toggle & Unlearned Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1">
          <div className="flex items-center gap-1 bg-[var(--color-surface-subtle)] p-0.5 rounded-[6px] border border-[var(--color-border)] overflow-x-auto max-w-full no-scrollbar">
            <button
              onClick={() => {
                setSourceType('all');
                setActiveUnit(null);
              }}
              className={`px-2.5 py-1 min-h-[32px] rounded-[4px] font-medium transition-colors shrink-0 whitespace-nowrap ${
                sourceType === 'all'
                  ? 'bg-[var(--color-paper)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Hammasi
            </button>
            <button
              onClick={() => {
                setSourceType('curriculum');
                setActiveUnit(null);
              }}
              className={`px-2.5 py-1 min-h-[32px] rounded-[4px] font-medium transition-colors shrink-0 whitespace-nowrap ${
                sourceType === 'curriculum'
                  ? 'bg-[var(--color-paper)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Kundalik darslik ({filteredDays.length})
            </button>
            <button
              onClick={() => {
                setSourceType('topics');
                setActiveUnit(null);
              }}
              className={`px-2.5 py-1 min-h-[32px] rounded-[4px] font-medium transition-colors shrink-0 whitespace-nowrap ${
                sourceType === 'topics'
                  ? 'bg-[var(--color-paper)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Mavzuli lug‘at ({filteredUnits.length})
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[var(--color-text-muted)] hover:text-[var(--color-text)] py-1 min-h-[36px]">
            <input
              type="checkbox"
              checked={onlyUnlearned}
              onChange={(e) => setOnlyUnlearned(e.target.checked)}
              className="rounded-[4px] border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] w-4 h-4"
            />
            <span>Faqat o‘rganilmagan so‘zlar</span>
          </label>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* Mode A: Direct Search Results */}
        {searchResults !== null ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <span>Topilgan so‘zlar ({searchResults.length} ta):</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-[6px]">
                Qidiruvingiz bo‘yicha hech qanday so‘z topilmadi.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map((w, idx) => (
                  <CuratedWordCard
                    key={`${w.word}-${idx}`}
                    wordItem={w}
                    isLearned={isWordLearned(w.word)}
                    onSelectWord={onSelectWord}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeUnit ? (
          /* Mode B: Inside a Selected Topic / Day */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveUnit(null)}
                className="text-xs h-9 min-h-[36px] px-2 text-[var(--color-text-muted)] w-fit"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Mavzular ro‘yxatiga qaytish
              </Button>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="font-serif font-bold text-sm text-[var(--color-text)] truncate max-w-[220px] sm:max-w-none">
                  {activeUnit.title}
                </span>
                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                  {activeUnit.cefr}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeUnit.words
                .filter((w) => (onlyUnlearned ? !isWordLearned(w.word) : true))
                .map((w, idx) => (
                  <CuratedWordCard
                    key={`${w.word}-${idx}`}
                    wordItem={w}
                    isLearned={isWordLearned(w.word)}
                    onSelectWord={onSelectWord}
                  />
                ))}
            </div>
          </div>
        ) : (
          /* Mode C: Topics / Days Grid */
          <div className="space-y-6">
            {/* 1. Curriculum Days Section */}
            {sourceType !== 'topics' && filteredDays.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Kundalik Darslik ({filteredDays.length} kun)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredDays.slice(0, compact ? 10 : 40).map((day) => {
                    const unlearnedInDay = day.words.filter((w) => !isWordLearned(w.word)).length;
                    return (
                      <div
                        key={day.id}
                        onClick={() =>
                          setActiveUnit({
                            title: `Kun ${day.day}: ${day.topicUz}`,
                            cefr: day.cefr,
                            words: day.words,
                          })
                        }
                        className="p-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-paper)] hover:border-[var(--color-border-strong)] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[var(--color-accent)]">
                              Kun {day.day}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                              {day.cefr}
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm font-medium text-[var(--color-text)] truncate">
                            {day.topicUz}
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                            {day.topic}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right text-[11px] font-mono text-[var(--color-text-muted)]">
                            <div>{day.words.length} so‘z</div>
                            {unlearnedInDay > 0 && (
                              <div className="text-[var(--color-accent)]">{unlearnedInDay} yangi</div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Thematic Units Section */}
            {sourceType !== 'curriculum' && filteredUnits.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Mavzuli Lug‘at ({filteredUnits.length} mavzu)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredUnits.slice(0, compact ? 10 : 40).map((unit) => {
                    const unlearnedInUnit = unit.words.filter((w) => !isWordLearned(w.word)).length;
                    return (
                      <div
                        key={unit.id}
                        onClick={() =>
                          setActiveUnit({
                            title: unit.titleUz,
                            cefr: unit.cefr,
                            words: unit.words,
                          })
                        }
                        className="p-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-paper)] hover:border-[var(--color-border-strong)] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium text-[var(--color-text-muted)]">
                              Mavzu {unit.unit}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                              {unit.cefr}
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm font-medium text-[var(--color-text)] truncate">
                            {unit.titleUz}
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                            {unit.title}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right text-[11px] font-mono text-[var(--color-text-muted)]">
                            <div>{unit.words.length} so‘z</div>
                            {unlearnedInUnit > 0 && (
                              <div className="text-[var(--color-accent)]">{unlearnedInUnit} yangi</div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
