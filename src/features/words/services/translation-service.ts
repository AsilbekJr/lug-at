import curriculumRaw from '@/data/curriculum/curriculum.json';
import type { CuratedContentDatabase, CuratedWord } from '@/features/words/types/curriculum';

const database = curriculumRaw as unknown as CuratedContentDatabase;

export interface TranslationResult {
  detectedLang: 'uz' | 'en';
  englishText: string;
  uzbekText: string;
  itemType: 'word' | 'sentence';
  matchedCuratedWord?: CuratedWord;
  exampleSentence?: string;
  exampleSentenceUz?: string;
  collocations?: string[];
  ipa?: string;
  pos?: string;
}

// Build fast lookup dictionary from 4713 curated words
const enToUzMap = new Map<string, CuratedWord>();
const uzToEnMap = new Map<string, CuratedWord>();

// Populate dictionary on load
function initCuratedDictionary() {
  const allDays = database.curriculum || [];
  for (const day of allDays) {
    for (const w of day.words || []) {
      const en = w.word.toLowerCase().trim();
      const uz = w.translation.toLowerCase().trim();
      if (!enToUzMap.has(en)) enToUzMap.set(en, w);
      if (!uzToEnMap.has(uz)) uzToEnMap.set(uz, w);
    }
  }

  const allTopics = database.vocabTopics || [];
  for (const topic of allTopics) {
    for (const w of topic.words || []) {
      const en = w.word.toLowerCase().trim();
      const uz = w.translation.toLowerCase().trim();
      if (!enToUzMap.has(en)) enToUzMap.set(en, w);
      if (!uzToEnMap.has(uz)) uzToEnMap.set(uz, w);
    }
  }
}

initCuratedDictionary();

/**
 * Common Uzbek words and markers to detect Uzbek vs English
 */
const UZBEK_MARKERS = new Set([
  'va', 'ham', 'bilan', 'uchun', 'bu', 'shu', 'men', 'sen', 'u', 'biz', 'siz', 'ular',
  'kerak', 'mumkin', 'emas', 'yoq', 'ha', 'bormi', 'yoqmi', 'qanday', 'nima', 'qachon',
  'qayerda', 'boladi', 'bolsa', 'qilish', 'gapirmoq', 'yozmoq', 'organish', 'kun', 'yaxshi',
  'katta', 'kichik', 'yangi', 'eski', 'chiroyli', 'tez', 'sekin', 'har', 'hamma', 'barcha',
  'ozim', 'ozi', 'ozbek', 'ingliz', 'kitob', 'maktab', 'ish', 'dars', 'dost', 'oilam',
  'uy', 'ota', 'ona', 'bola', 'suv', 'non', 'vaqt', 'soat', 'joy', 'shahar', 'xush',
  'salom', 'rahmat', 'iltimos', 'xayr', 'kelyapti', 'ketdi', 'boraman', 'qilaman'
]);

/**
 * Checks if input is likely Uzbek
 */
export function isLikelyUzbek(text: string): boolean {
  const clean = text.toLowerCase().trim();
  // Contains Uzbek specific characters
  if (/[‘ʼʻ']/.test(clean) || /o['‘`ʻ]/.test(clean) || /g['‘`ʻ]/.test(clean)) {
    return true;
  }

  const tokens = clean.split(/[\s,.;:!?]+/).filter(Boolean);
  let uzbekMatches = 0;
  for (const t of tokens) {
    if (UZBEK_MARKERS.has(t) || uzToEnMap.has(t)) {
      uzbekMatches++;
    }
  }

  if (uzbekMatches > 0 && uzbekMatches >= tokens.length * 0.3) {
    return true;
  }

  // If text is single word and found in Uzbek curated definitions
  if (tokens.length === 1 && uzToEnMap.has(clean)) {
    return true;
  }

  return false;
}

/**
 * Detects whether the input is a single word or full sentence
 */
export function detectItemType(text: string): 'word' | 'sentence' {
  const clean = text.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 3 || /[.!?]$/.test(clean)) {
    return 'sentence';
  }
  return 'word';
}

import { cleanSpokenTranscript } from './phonetic-corrections';
import { translateWithGeminiFlash } from './gemini-flash-service';

/**
 * Common phrase dictionary for high-frequency Uzbek to English sentences
 */
const COMMON_SENTENCES: Record<string, string> = {
  'salom': 'Hello',
  'qalaysiz': 'How are you?',
  'xayr': 'Goodbye',
  'rahmat': 'Thank you',
  'arziydi': "You're welcome",
  'havo issiq': 'The weather is hot',
  'havo sovuq': 'The weather is cold',
  'havo judayam sovuq': 'The weather is very cold',
  'havo juda sovuq': 'The weather is very cold',
  'bugun havo judayam sovuq': 'The weather is very cold today',
  'bugun havo juda sovuq': 'The weather is very cold today',
  'bugun havo issiq': 'The weather is hot today',
  'bugun havo juda yaxshi': 'The weather is very nice today',
  'bugun ob-havo juda yaxshi': 'The weather is very nice today',
  'men talabaman': 'I am a student',
  'men ingliz tilini organmoqdaman': 'I am learning English',
  'men kitob oqishni yaxshi koraman': 'I like reading books',
  'men har kuni ertalab yuguraman': 'I run every morning',
  'men kelajakda katta loyihalar ustida ishlamoqchiman': 'I want to work on large projects in the future',
  'vaqt kutib turmaydi': 'Time waits for no one',
  'bilim bu kuch': 'Knowledge is power',
};

/**
 * Translates input using local curated dictionary or fallback
 */
export async function translateInput(
  rawText: string,
  forcedItemType?: 'word' | 'sentence'
): Promise<TranslationResult> {
  const cleanedText = cleanSpokenTranscript(rawText);
  const text = cleanedText.trim();
  const itemType = forcedItemType || detectItemType(text);
  const isUz = isLikelyUzbek(text);
  const lower = text.toLowerCase();

  // 1. Try Gemini Flash / Groq Qwen
  const geminiResult = await translateWithGeminiFlash(text, forcedItemType);
  if (geminiResult) {
    // If exact curated match exists, use its extra details if AI omitted them
    const curatedMatch = isUz ? uzToEnMap.get(lower) : enToUzMap.get(lower);

    return {
      detectedLang: isUz ? 'uz' : 'en',
      englishText: geminiResult.englishText,
      uzbekText: geminiResult.uzbekText,
      itemType: geminiResult.itemType,
      matchedCuratedWord: curatedMatch,
      exampleSentence: geminiResult.exampleSentence || curatedMatch?.example,
      exampleSentenceUz: geminiResult.exampleSentenceUz || curatedMatch?.exampleUz,
      collocations: (geminiResult.collocations && geminiResult.collocations.length > 0)
        ? geminiResult.collocations
        : curatedMatch?.collocations,
      ipa: geminiResult.ipa || curatedMatch?.phonetic,
      pos: geminiResult.pos || curatedMatch?.partOfSpeech,
    };
  }

  if (isUz) {
    // Check exact curated match
    const curated = uzToEnMap.get(lower);
    if (curated) {
      return {
        detectedLang: 'uz',
        englishText: curated.word,
        uzbekText: curated.translation,
        itemType: 'word',
        matchedCuratedWord: curated,
        exampleSentence: curated.example,
        exampleSentenceUz: curated.exampleUz,
        collocations: curated.collocations,
        ipa: curated.phonetic,
        pos: curated.partOfSpeech,
      };
    }

    // Check common sentences
    const normalizedKey = lower.replace(/['`ʻ’]/g, '').trim();
    if (COMMON_SENTENCES[normalizedKey]) {
      return {
        detectedLang: 'uz',
        englishText: COMMON_SENTENCES[normalizedKey],
        uzbekText: text,
        itemType: 'sentence',
        exampleSentence: COMMON_SENTENCES[normalizedKey],
        exampleSentenceUz: text,
      };
    }

    // Single word heuristic or sentence heuristic
    if (itemType === 'word') {
      // Find partial or best match in curated database
      for (const [uzKey, curatedWord] of uzToEnMap.entries()) {
        if (uzKey.includes(lower) || lower.includes(uzKey)) {
          return {
            detectedLang: 'uz',
            englishText: curatedWord.word,
            uzbekText: text,
            itemType: 'word',
            matchedCuratedWord: curatedWord,
            exampleSentence: curatedWord.example,
            exampleSentenceUz: curatedWord.exampleUz,
            collocations: curatedWord.collocations,
            ipa: curatedWord.phonetic,
            pos: curatedWord.partOfSpeech,
          };
        }
      }

      // If unknown Uzbek word, keep transliterated/English candidate
      return {
        detectedLang: 'uz',
        englishText: text,
        uzbekText: text,
        itemType: 'word',
        exampleSentence: `I practice the word "${text}" every day.`,
        collocations: [`learn ${text}`],
      };
    } else {
      // Sentence in Uzbek
      return {
        detectedLang: 'uz',
        englishText: text,
        uzbekText: text,
        itemType: 'sentence',
        exampleSentence: text,
        exampleSentenceUz: text,
      };
    }
  } else {
    // Already in English
    const curated = enToUzMap.get(lower);
    if (curated) {
      return {
        detectedLang: 'en',
        englishText: curated.word,
        uzbekText: curated.translation,
        itemType: 'word',
        matchedCuratedWord: curated,
        exampleSentence: curated.example,
        exampleSentenceUz: curated.exampleUz,
        collocations: curated.collocations,
        ipa: curated.phonetic,
        pos: curated.partOfSpeech,
      };
    }

    return {
      detectedLang: 'en',
      englishText: text,
      uzbekText: `${text} (inglizcha)`,
      itemType,
      exampleSentence: itemType === 'sentence' ? text : `She uses the word "${text}" correctly.`,
      collocations: [`practice ${text}`],
    };
  }
}
