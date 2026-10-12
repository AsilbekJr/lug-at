import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataRepository } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';
import type { UserWord } from '@/features/words/types';
import type { RecordLogItem } from 'ts-fsrs';

export interface CommitReviewInput {
  userWordId: string;
  nextItem: RecordLogItem;
  taskType?: string;
}

export function useSubmitReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userWordId, nextItem, taskType = 'recog' }: CommitReviewInput) => {
      const nextCard = nextItem.card;
      const nextLog = nextItem.log;

      const updatedFields: Partial<UserWord> = {
        due_at: nextCard.due.toISOString(),
        stability: nextCard.stability,
        difficulty: nextCard.difficulty,
        reps: nextCard.reps,
        lapses: nextCard.lapses,
        state: nextCard.state,
        last_review: (nextCard.last_review ?? new Date()).toISOString(),
      };

      await dataRepository.updateUserWordReview(userWordId, updatedFields, {
        task_type: taskType,
        rating: nextLog.rating,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.words.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.review.dueCards() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary() });
    },
  });
}
