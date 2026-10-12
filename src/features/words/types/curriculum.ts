export interface CuratedWord {
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition?: string;
  example?: string;
  exampleUz?: string;
  cefr: string;
  collocations?: string[];
}

export interface CuratedCurriculumDay {
  id: string;
  day: number;
  cefr: string;
  emoji?: string;
  topic: string;
  topicUz: string;
  description?: string;
  grammarFocus?: string;
  words: CuratedWord[];
}

export interface CuratedThematicUnit {
  id: string;
  levelKey: string;
  levelTitleUz: string;
  cefr: string;
  unit: number;
  title: string;
  titleUz: string;
  emoji?: string;
  words: CuratedWord[];
}

export interface CuratedContentDatabase {
  curriculum: CuratedCurriculumDay[];
  vocabTopics: CuratedThematicUnit[];
}
