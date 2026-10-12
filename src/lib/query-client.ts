import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const queryKeys = {
  words: {
    all: ['words'] as const,
    list: (filters?: Record<string, unknown>) => ['words', 'list', filters] as const,
    detail: (id: string) => ['words', 'detail', id] as const,
  },
  review: {
    dueCards: () => ['review', 'dueCards'] as const,
    allCards: () => ['review', 'allCards'] as const,
    logs: () => ['review', 'logs'] as const,
  },
  stats: {
    summary: () => ['stats', 'summary'] as const,
    forecast: () => ['stats', 'forecast'] as const,
    retention: () => ['stats', 'retention'] as const,
  },
};
