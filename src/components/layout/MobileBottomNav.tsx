import { NavLink } from 'react-router-dom';
import { Sparkles, BookOpen, Layers, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { dataRepository } from '@/lib/supabase';

export function MobileBottomNav() {
  const { data: dueWords } = useQuery({
    queryKey: queryKeys.review.dueCards(),
    queryFn: () => dataRepository.getDueUserWords(),
    staleTime: 1000 * 30,
  });

  const dueCount = dueWords?.length ?? 0;

  const navItems = [
    {
      to: '/',
      label: 'Bugun',
      icon: Sparkles,
      end: true,
    },
    {
      to: '/words',
      label: 'Lug‘at',
      icon: BookOpen,
      end: false,
    },
    {
      to: '/review',
      label: 'Takrorlash',
      icon: Layers,
      badge: dueCount > 0 ? dueCount : undefined,
      end: false,
    },
    {
      to: '/stats',
      label: 'Statistika',
      icon: BarChart3,
      end: false,
    },
  ];

  return (
    <nav
      aria-label="Mobil navigatsiya"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-t border-border mobile-bottom-nav px-2 flex items-center justify-around gap-2 transition-colors shadow-xs"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors relative min-h-[44px]',
                isActive
                  ? 'text-accent font-semibold'
                  : 'text-ink-muted hover:text-ink'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon
                    className={cn('w-5 h-5 mb-0.5 transition-transform', isActive && 'scale-110')}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-accent text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
