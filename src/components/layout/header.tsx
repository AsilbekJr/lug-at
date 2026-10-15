import * as React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { BookOpen, Layers, BarChart3, Sun, Moon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { dataRepository } from '@/lib/supabase';

export interface HeaderProps {
  onOpenAddWord?: () => void;
}

export function Header({ onOpenAddWord }: HeaderProps) {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('linguist_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.removeAttribute('data-theme');
      root.classList.remove('dark');
    }
    localStorage.setItem('linguist_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Due user words count for navigation badge
  const { data: dueWords } = useQuery({
    queryKey: queryKeys.review.dueCards(),
    queryFn: () => dataRepository.getDueUserWords(),
    staleTime: 1000 * 30,
  });

  const dueCount = dueWords?.length ?? 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-paper/95 backdrop-blur-none transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          to="/"
          className="flex min-h-11 items-baseline gap-2 py-2 group text-ink"
        >
          <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-ink group-hover:text-accent transition-colors">
            Linguist
          </span>
          <span className="text-xs font-sans text-ink-muted uppercase tracking-widest hidden sm:inline">
            Vocabulary
          </span>
        </Link>

        {/* Navigation - Desktop */}
        <nav aria-label="Asosiy navigatsiya" className="hidden lg:flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-[6px] min-h-[44px] transition-colors',
                isActive
                  ? 'bg-paper-muted text-ink font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-paper-subtle'
              )
            }
          >
            <span>Bugun</span>
          </NavLink>

          <NavLink
            to="/words"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-[6px] min-h-[44px] transition-colors',
                isActive
                  ? 'bg-paper-muted text-ink font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-paper-subtle'
              )
            }
          >
            <BookOpen className="w-4 h-4" strokeWidth={1.5} />
            <span>Lug‘at</span>
          </NavLink>

          <NavLink
            to="/review"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-[6px] min-h-[44px] transition-colors relative',
                isActive
                  ? 'bg-paper-muted text-ink font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-paper-subtle'
              )
            }
          >
            <Layers className="w-4 h-4" strokeWidth={1.5} />
            <span>Takrorlash</span>
            {dueCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[11px] font-mono font-semibold rounded-full bg-accent text-white">
                {dueCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/stats"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-[6px] min-h-[44px] transition-colors',
                isActive
                  ? 'bg-paper-muted text-ink font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-paper-subtle'
              )
            }
          >
            <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
            <span>Statistika</span>
          </NavLink>
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onOpenAddWord && (
            <Button
              variant="accent"
              size="sm"
              onClick={onOpenAddWord}
              aria-label="Yangi so‘z qo‘shish"
              className="h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">Yangi so‘z</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? "Yorug' rejimga o'tish" : "Tungi rejimga o'tish"}
            title={theme === 'dark' ? "Yorug' rejim" : "Tungi rejim"}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-ink" strokeWidth={1.5} />
            ) : (
              <Moon className="w-4 h-4 text-ink" strokeWidth={1.5} />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
