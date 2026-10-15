import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataRepository } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';
import type { CreateWordInput } from '@/features/words/types';

export function useUserWordsQuery() {
  return useQuery({
    queryKey: queryKeys.words.all,
    queryFn: () => dataRepository.getUserWords(),
  });
}

export function useDueUserWordsQuery() {
  return useQuery({
    queryKey: queryKeys.review.dueCards(),
    queryFn: () => dataRepository.getDueUserWords(),
  });
}

export function useCreateWordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWordInput) => dataRepository.createWord(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.words.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.review.dueCards() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary() });
    },
  });
}

export function useDeleteUserWordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userWordId: string) => dataRepository.deleteUserWord(userWordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.words.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.review.dueCards() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary() });
    },
  });
}

export function useMarkWordAsKnownMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (curated: import('@/features/words/types/curriculum').CuratedWord) => {
      const cleanWord = curated.word.trim().toLowerCase();
      const input: CreateWordInput = {
        word: cleanWord,
        pos: curated.partOfSpeech || 'noun',
        ipa: curated.phonetic || '',
        uz_meaning: curated.translation,
        is_known: true,
        recog_ok: true,
        listen_ok: false,
        write_ok: false,
        speak_ok: false,
        cardContent: {
          word: cleanWord,
          pos: curated.partOfSpeech || 'noun',
          ipa: curated.phonetic || '',
          uz_meaning: curated.translation,
          chunks: curated.collocations || [],
          mnemonics: [],
          model_sentences: {
            present: curated.example || `I use ${cleanWord} frequently.`,
            past: `I understood ${cleanWord}.`,
            future: `I know ${cleanWord}.`,
          },
          personal_prompt_uz: 'O‘quvchi bu so‘zni bilishini o‘zi belgilagan. Boshqa ko‘nikmalar hali tekshirilmagan.',
          cefr_level: (curated.cefr as any) || 'A1',
        },
      };
      return dataRepository.createWord(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.words.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.review.dueCards() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary() });
    },
  });
}
