import type { EnrichedUserWord } from '@/features/words/types';

export interface IntervalSentenceInfo {
  text: string;
  label: string;
  interval: number;
}

/**
 * Extracts available context sentences for a word and returns
 * the designated rotating sentence for the current FSRS interval (reps).
 *
 * Interval 1 (reps 0) -> Present tense sentence
 * Interval 2 (reps 1) -> Past tense sentence
 * Interval 3 (reps 2) -> Future tense sentence
 * Interval 4 (reps 3) -> Learner's own personal sentence
 * Interval 5+ (reps 4+) -> Cyclical rotation / collocation context
 */
export function getWordIntervalSentence(item: EnrichedUserWord): IntervalSentenceInfo {
  const reps = item.userWord.reps || 0;
  const interval = reps + 1;
  const word = item.word.word;

  const pool: { text: string; label: string }[] = [];

  const ms = item.card?.content?.model_sentences;
  if (ms?.present && ms.present.trim()) {
    pool.push({
      text: ms.present.trim(),
      label: 'Hozirgi zamon misoli',
    });
  }

  if (ms?.past && ms.past.trim()) {
    pool.push({
      text: ms.past.trim(),
      label: 'O‘tgan zamon misoli',
    });
  }

  if (ms?.future && ms.future.trim()) {
    pool.push({
      text: ms.future.trim(),
      label: 'Kelasi zamon misoli',
    });
  }

  if (item.userWord.own_sentence && item.userWord.own_sentence.trim()) {
    pool.push({
      text: item.userWord.own_sentence.trim(),
      label: 'Shaxsiy hayotiy jumla',
    });
  }

  // If word has chunks/collocations, add as context
  const chunks = item.card?.content?.chunks;
  if (chunks && chunks.length > 0 && chunks[0]) {
    const chunkClean = chunks[0].split('—')[0]?.trim() || chunks[0].trim();
    if (chunkClean) {
      pool.push({
        text: `In daily communication, people frequently use the expression "${chunkClean}".`,
        label: 'Birikma misoli',
      });
    }
  }

  // Fallbacks if no sentences were found
  if (pool.length === 0) {
    pool.push(
      {
        text: `She regularly demonstrates great ${word} in her daily work.`,
        label: 'Hozirgi zamon misoli',
      },
      {
        text: `Last year, our team mastered how to apply ${word} effectively.`,
        label: 'O‘tgan zamon misoli',
      },
      {
        text: `Consistent practice with ${word} will accelerate your language fluency.`,
        label: 'Kelasi zamon misoli',
      }
    );
  }

  // Rotates cleanly by interval
  const selected = pool[reps % pool.length]!;

  return {
    text: selected.text,
    label: selected.label,
    interval,
  };
}
