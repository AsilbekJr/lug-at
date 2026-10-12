import * as React from 'react';
import curriculumRaw from '@/data/curriculum/curriculum.json';
import type {
  CuratedContentDatabase,
  CuratedCurriculumDay,
  CuratedThematicUnit,
} from '@/features/words/types/curriculum';
import { useUserWordsQuery } from '@/features/words/api/words-api';

const database = curriculumRaw as unknown as CuratedContentDatabase;

export type CuratedFilterType = 'all' | 'curriculum' | 'topics';
export type CuratedLevelFilter = 'ALL' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export function useCurriculum() {
  const { data: userWords } = useUserWordsQuery();

  // Set of lowercase words already saved by the user
  const learnedWordsSet = React.useMemo(() => {
    const set = new Set<string>();
    if (userWords) {
      for (const uw of userWords) {
        if (uw.word?.word) {
          set.add(uw.word.word.toLowerCase().trim());
        }
      }
    }
    return set;
  }, [userWords]);

  const isWordLearned = React.useCallback(
    (word: string) => {
      return learnedWordsSet.has(word.toLowerCase().trim());
    },
    [learnedWordsSet]
  );

  const curriculumDays: CuratedCurriculumDay[] = database.curriculum || [];
  const thematicUnits: CuratedThematicUnit[] = database.vocabTopics || [];

  // Total word counts
  const totalCurriculumWords = React.useMemo(() => {
    return curriculumDays.reduce((acc, day) => acc + (day.words?.length || 0), 0);
  }, [curriculumDays]);

  const totalTopicWords = React.useMemo(() => {
    return thematicUnits.reduce((acc, unit) => acc + (unit.words?.length || 0), 0);
  }, [thematicUnits]);

  return {
    curriculumDays,
    thematicUnits,
    totalCurriculumWords,
    totalTopicWords,
    isWordLearned,
    learnedCount: learnedWordsSet.size,
  };
}
