import {
  fsrs,
  generatorParameters,
  Rating,
  State,
  createEmptyCard,
  type Card as FSRSCard,
  type RecordLogItem,
} from 'ts-fsrs';
import type { UserWord } from '@/features/words/types';

// Standard FSRS scheduler with 90% request retention target
export const fsrsScheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 36500,
    enable_fuzz: true,
  })
);

export { Rating, State, createEmptyCard };

/**
 * Convert user_words record to ts-fsrs Card object
 */
export function toFSRSCard(uw?: UserWord): FSRSCard {
  if (!uw) {
    return createEmptyCard(new Date());
  }

  return {
    due: new Date(uw.due_at),
    stability: uw.stability,
    difficulty: uw.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: uw.reps,
    lapses: uw.lapses,
    learning_steps: 0,
    state: uw.state as State,
    last_review: uw.last_review ? new Date(uw.last_review) : undefined,
  };
}

/**
 * Compute the 4 next possible scheduling states (Again, Hard, Good, Easy) for a card
 */
export function getSchedulingPreviews(
  uw?: UserWord,
  now: Date = new Date()
): Record<Rating, RecordLogItem> {
  const fsrsCard = toFSRSCard(uw);
  return fsrsScheduler.repeat(fsrsCard, now) as unknown as Record<Rating, RecordLogItem>;
}

/**
 * Format interval between now and next due date into human editorial label
 */
export function getIntervalPreviewLabel(item: RecordLogItem, now: Date = new Date()): string {
  const targetTime = item.card.due.getTime();
  const diffMs = targetTime - now.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  if (diffMinutes < 60) {
    return `${diffMinutes} daq`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} soat`;
  }
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} kun`;
  }
  if (diffDays < 365) {
    return `${Math.round(diffDays / 30)} oy`;
  }
  return `${(diffDays / 365).toFixed(1)} yil`;
}
