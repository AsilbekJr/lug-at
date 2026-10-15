import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  type CardInput,
  type CardOutput,
  CardOutputSchema,
  type CheckSentenceInput,
  type CheckSentenceOutput,
  CheckSentenceOutputSchema,
  type CheckReplyInput,
  type CheckReplyOutput,
  CheckReplyOutputSchema,
  type ReviewInput,
  type ReviewOutput,
  ReviewOutputSchema,
  type MnemonicItemOutput,
} from '@/lib/schemas/ai-coach';

/**
 * Intelligent client for Linguist AI Coach Edge Function
 * Features automatic fallback for offline prototype preview with
 * editorial, warm Uzbek feedback conforming strictly to Zod schemas.
 */

export interface GenerateCardInput {
  word: string;
  learner_level?: 'A2' | 'B1' | 'B2' | 'C1';
  known_words?: string[];
  interests?: string[];
  word_id?: string;
}

export interface CheckSentenceParamInput {
  word: string;
  user_sentence: string;
  learner_level?: 'A2' | 'B1' | 'B2' | 'C1';
  known_words?: string[];
  interests?: string[];
}

export interface CheckReplyParamInput {
  word: string;
  question: string;
  user_reply: string;
  learner_level?: 'A2' | 'B1' | 'B2' | 'C1';
  known_words?: string[];
  interests?: string[];
}

export const aiCoachApi = {
  /**
   * MODE: CARD — Generate a rich memory card for target word
   */
  async generateCard(input: GenerateCardInput): Promise<CardOutput> {
    const payload: CardInput = {
      mode: 'CARD',
      word: input.word.trim().toLowerCase(),
      learner_level: input.learner_level || 'B1',
      known_words: input.known_words || [],
      interests: input.interests || [],
      word_id: input.word_id,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-coach', {
          body: payload,
        });

        if (!error && data) {
          const parsed = CardOutputSchema.safeParse(data);
          if (parsed.success) {
            return parsed.data;
          }
        }
      } catch (err) {
        console.warn('ai-coach edge function invocation failed, fallback to local engine:', err);
      }
    }

    // Local prototype generator for offline / preview resilience
    return generateFallbackCard(payload.word);
  },

  /**
   * MODE: CHECK_SENTENCE — Evaluate user's life sentence
   */
  async checkSentence(input: CheckSentenceParamInput): Promise<CheckSentenceOutput> {
    const payload: CheckSentenceInput = {
      mode: 'CHECK_SENTENCE',
      word: input.word.trim().toLowerCase(),
      learner_level: input.learner_level || 'B1',
      known_words: input.known_words || [],
      interests: input.interests || [],
      user_sentence: input.user_sentence.trim(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-coach', {
          body: payload,
        });

        if (!error && data) {
          const parsed = CheckSentenceOutputSchema.safeParse(data);
          if (parsed.success) {
            return parsed.data;
          }
        }
      } catch (err) {
        console.warn('ai-coach edge function checkSentence failed, using local engine:', err);
      }
    }

    return generateFallbackCheckSentence(payload.word, payload.user_sentence);
  },

  /**
   * MODE: CHECK_REPLY — Evaluate user's conversational reply reusing target word
   */
  async checkReply(input: CheckReplyParamInput): Promise<CheckReplyOutput> {

    const payload: CheckReplyInput = {
      mode: 'CHECK_REPLY',
      word: input.word.trim().toLowerCase(),
      learner_level: input.learner_level || 'B1',
      known_words: input.known_words || [],
      interests: input.interests || [],
      question: input.question,
      user_reply: input.user_reply.trim(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-coach', {
          body: payload,
        });

        if (!error && data) {
          const parsed = CheckReplyOutputSchema.safeParse(data);
          if (parsed.success) {
            return parsed.data;
          }
        }
      } catch (err) {
        console.warn('ai-coach edge function checkReply failed, using local engine:', err);
      }
    }

    return generateFallbackCheckReply(payload.word, payload.question, payload.user_reply);
  },

  /**
   * MODE: REVIEW — Generate stage-based exercise (1..5) with ts-fsrs alignment
   */
  async fetchReviewExercise(input: ReviewParamInput): Promise<ReviewOutput> {
    const payload: ReviewInput = {
      mode: 'REVIEW',
      word: input.word.trim().toLowerCase(),
      stage: input.stage,
      lapses: input.lapses ?? 0,
      learner_level: input.learner_level || 'B1',
      known_words: input.known_words || [],
      interests: input.interests || [],
      previous_sentences: input.previous_sentences || [],
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-coach', {
          body: payload,
        });

        if (!error && data) {
          const parsed = ReviewOutputSchema.safeParse(data);
          if (parsed.success) {
            return parsed.data;
          }
        }
      } catch (err) {
        console.warn('ai-coach edge function fetchReviewExercise failed, using local engine:', err);
      }
    }

    return generateFallbackReviewExercise(
      payload.word,
      payload.stage,
      payload.lapses,
      input.previous_mnemonic_type,
      input.active_sentence,
      input.active_sentence_label,
      input.interval,
      input.uz_meaning
    );
  },
};

export interface ReviewParamInput {
  word: string;
  stage: 1 | 2 | 3 | 4 | 5;
  uz_meaning?: string;
  lapses?: number;
  interval?: number;
  active_sentence?: string;
  active_sentence_label?: string;
  learner_level?: 'A2' | 'B1' | 'B2' | 'C1';
  known_words?: string[];
  interests?: string[];
  previous_sentences?: string[];
  previous_mnemonic_type?: 'sound' | 'image' | 'root';
}

// --- Fallback Generators for Offline / Development Mode ---

function generateFallbackCard(rawWord: string): CardOutput {
  const word = rawWord.toLowerCase();

  // Known dictionary presets
  if (word === 'candid') {
    return {
      word: 'candid',
      pos: 'adjective',
      ipa: '/ˈkæn.dɪd/',
      uz_meaning: 'Samimiy, ochiqko‘ngil, to‘g‘riso‘z',
      chunks: [
        'candid opinion — samimiy fikr',
        'candid conversation — ochiq suhbat',
        'candid photograph — tabiiy, bexosdan olingan rasm',
      ],
      mnemonics: [
        {
          type: 'sound',
          uz_hook: 'Qand',
          scene_uz: 'Choyga qand solgandek shirin va soxtalikdan xoli samimiy (candid) inson.',
        },
        {
          type: 'image',
          scene_uz: 'Hech qanday niqobsiz, toza ko‘zlar bilan to‘g‘ridan-to‘g‘ri qarab gapirayotgan do‘stingiz.',
        },
        {
          type: 'root',
          explanation_uz: 'Lotincha "candidus" (oppoq, sofdil) so‘zidan kelib chiqqan.',
          related_words: ['candidate', 'candor'],
        },
      ],
      model_sentences: {
        present: 'She is completely candid about her past mistakes.',
        past: 'They had a candid discussion about the project budget.',
        future: 'Being candid will build deeper trust with your teammates.',
      },
      personal_prompt_uz: 'Hayotingizda kim bilan eng samimiy (candid) suhbat qurganingizni eslang.',
    };
  }

  if (word === 'tenacious') {
    return {
      word: 'tenacious',
      pos: 'adjective',
      ipa: '/təˈneɪ.ʃəs/',
      uz_meaning: 'Qat’iyatli, mahkam ushlaydigan, taslim bo‘lmaydigan',
      chunks: [
        'tenacious effort — qat’iyatli harakat',
        'tenacious grip — mahkam ushlash',
        'tenacious defender — chidamli himoyachi',
      ],
      mnemonics: [
        {
          type: 'sound',
          uz_hook: 'Tana',
          scene_uz: 'Butun tanasi bilan toqqa osilib, hech bo‘shatmaydigan qat’iyatli (tenacious) alpinist.',
        },
        {
          type: 'image',
          scene_uz: 'Qoyatosh yorig‘ida ildiz otgan va bo‘ronga qaramay yashab qolgan daraxt.',
        },
        {
          type: 'root',
          explanation_uz: 'Lotincha "tenere" (ushlab turmoq) so‘zidan olingan.',
          related_words: ['tenant', 'contain', 'retain'],
        },
      ],
      model_sentences: {
        present: 'A tenacious student always finds a way to solve hard problems.',
        past: 'Her tenacious spirit helped the team win the championship.',
        future: 'You will achieve big goals if you stay tenacious.',
      },
      personal_prompt_uz: 'Qachon biron maqsad sari taslim bo‘lmay qat’iyat (tenacious) ko‘rsatgansiz?',
    };
  }

  // Dynamic generative fallback for any other word
  return {
    word: word,
    pos: 'noun',
    ipa: `/${word}/`,
    uz_meaning: `${word.charAt(0).toUpperCase() + word.slice(1)} ma'nosi va tushunchasi`,
    chunks: [
      `deep ${word} — chuqur ${word}`,
      `daily ${word} — kundalik ${word}`,
      `true ${word} — haqiqiy ${word}`,
    ],
    mnemonics: [
      {
        type: 'image',
        scene_uz: `Katta oq kitobda zarhal harflar bilan yozilgan "${word}" timsolini ko‘z oldingizga keltiring.`,
      },
      {
        type: 'root',
        explanation_uz: `Bu so‘zning asosiy ma’nosi xotirada mustahkam iz qoldirishga xizmat qiladi.`,
        related_words: [`${word}ly`, `${word}ness`],
      },
    ],
    model_sentences: {
      present: `I notice how important ${word} is in modern life.`,
      past: `Last year we learned a valuable lesson about ${word}.`,
      future: `Mastering ${word} will make our communication clearer.`,
    },
    personal_prompt_uz: `O‘z hayotingizda ${word} bilan bog‘liq bo‘lgan aniq bir voqeani yozing.`,
  };
}

function generateFallbackCheckSentence(
  word: string,
  userSentence: string
): CheckSentenceOutput {
  const lowerSentence = userSentence.toLowerCase();
  const lowerWord = word.toLowerCase();
  const containsWord = lowerSentence.includes(lowerWord);

  if (!containsWord) {
    return {
      uses_word_correctly: false,
      grammar_ok: true,
      natural_score: 45,
      corrected: userSentence,
      feedback_uz: `Jumlangizda maqsadli "${word}" so‘zi qatnashmadi. Iltimos, shu so‘zni jumlaga qo‘shing.`,
      follow_up_question: `Could you rewrite your sentence using the word "${word}"?`,
    };
  }

  // Good sentence
  const hasGoodLength = userSentence.split(' ').length >= 4;
  const naturalScore = hasGoodLength ? 92 : 78;

  // Capitalize first letter and ensure ending punctuation
  let corrected = userSentence.trim();
  corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
  if (!/[.!?]$/.test(corrected)) {
    corrected += '.';
  }

  return {
    uses_word_correctly: true,
    grammar_ok: true,
    natural_score: naturalScore,
    corrected,
    feedback_uz: `Juda samimiy va to‘g‘ri tuzilgan jumla! "${word}" so‘zi o‘z o‘rnida va tabiiy qo‘llandi.`,
    follow_up_question: `Why was this moment particularly memorable for you when using ${word}?`,
  };
}

function generateFallbackCheckReply(
  word: string,
  _question: string,
  userReply: string
): CheckReplyOutput {
  const lowerReply = userReply.toLowerCase();
  const lowerWord = word.toLowerCase();
  const usedTargetWord = lowerReply.includes(lowerWord);

  let corrected = userReply.trim();
  corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
  if (!/[.!?]$/.test(corrected)) {
    corrected += '.';
  }

  if (!usedTargetWord) {
    return {
      uses_word_correctly: true,
      grammar_ok: true,
      natural_score: 70,
      corrected,
      feedback_uz: `Javobingiz yaxshi, ammo unda maqsadli "${word}" so‘zini qayta qo‘llashga harakat qiling.`,
      follow_up_question: `Can you mention "${word}" directly in your answer?`,
      used_target_word: false,
    };
  }

  return {
    uses_word_correctly: true,
    grammar_ok: true,
    natural_score: 96,
    corrected,
    feedback_uz: `Qoyilmaqom! So‘z muloqotda jonli mustahkamlandi va xotirangizda muhrlandi.`,
    follow_up_question: `What is the most rewarding part of this experience?`,
    used_target_word: true,
  };
}

const UZ_DISTRACTORS_POOL: string[] = [
  'Quyoshli va ochiq havo',
  'Kuchli shamol va bo‘ron',
  'Qorli qish kuni',
  'Issiq yoz fasli',
  'Matonat va chidamlilik',
  'Mayda detallarga e’tiborli',
  'O‘tkinchi, qisqa umr ko‘ruvchi',
  'Ta’sirchan va fasih so‘zlay oladigan',
  'Kutilmagan baxtli tasodif',
  'Yangi do‘stlar orttirish',
  'Vaqtni unumli rejalashtirish',
  'Qiyin vaziyatdan chiqish yo‘li',
  'Kundalik odat va mashg‘ulot',
  'Ishonchli va sodiq hamkor',
  'Katta maqsadlarga erishish',
  'Oila davrasida hordiq chiqarish',
];

function generateFourOptions(correctUz: string): { answer: string; options: string[] } {
  const cleanCorrect = correctUz.trim();
  const distractors = UZ_DISTRACTORS_POOL.filter(
    (d) => d.toLowerCase() !== cleanCorrect.toLowerCase()
  );

  const picked = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
  const allFour = [cleanCorrect, ...picked].sort(() => 0.5 - Math.random());

  return {
    answer: cleanCorrect,
    options: allFour,
  };
}

function generateFallbackReviewExercise(
  rawWord: string,
  stage: 1 | 2 | 3 | 4 | 5,
  lapses: number,
  previousMnemonicType?: 'sound' | 'image' | 'root',
  activeSentence?: string,
  activeSentenceLabel?: string,
  interval?: number,
  uz_meaning?: string
): ReviewOutput {
  const word = rawWord.toLowerCase();

  // Fresh rescue mnemonic if lapses >= 2
  let new_mnemonic: MnemonicItemOutput | null = null;
  if (lapses >= 2) {
    if (previousMnemonicType === 'image') {
      new_mnemonic = {
        type: 'sound',
        uz_hook: word.slice(0, 4),
        scene_uz: `O‘xshash tovush bilan eslang: "${word.slice(0, 4)}" ohangi orqali tezkor esga olish.`,
      };
    } else if (previousMnemonicType === 'sound') {
      new_mnemonic = {
        type: 'image',
        scene_uz: `Yangi ko‘rgazmali obraz: "${word}" so‘zini katta zarhal yozuvda tasavvur qiling.`,
      };
    } else {
      new_mnemonic = {
        type: 'sound',
        uz_hook: word.slice(0, 4),
        scene_uz: `Yangi ovoz ilgagi bilan yangilangan xotira bog‘lami.`,
      };
    }
  }

  const interval_info = activeSentence
    ? {
        interval: interval || stage,
        sentence: activeSentence,
        label: activeSentenceLabel || `${interval || stage}-takrorlash misoli`,
      }
    : undefined;

  // If dynamic active interval sentence is provided, tailor the exercise directly to it!
  if (activeSentence) {
    const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const wordPattern = new RegExp(`\\b${escapeRegex(word)}[a-z]*\\b`, 'i');
    const gappedSentence = wordPattern.test(activeSentence)
      ? activeSentence.replace(wordPattern, '___')
      : activeSentence.replace(word, '___');

    switch (stage) {
      case 1: {
        const correctMeaning = uz_meaning?.trim() || `${word} so‘zi ma’nosi`;
        const { answer, options } = generateFourOptions(correctMeaning);
        return {
          type: 'choose',
          prompt: activeSentence,
          audio_text: activeSentence,
          answer,
          options,
          accept_also: [word, word.toLowerCase(), correctMeaning],
          new_mnemonic,
          interval_info,
        };
      }
      case 2:
        return {
          type: 'dictation',
          prompt: `Eshitgan jumlani ingliz tilida yozing (${activeSentenceLabel || 'interval misoli'}):`,
          audio_text: activeSentence,
          answer: activeSentence,
          accept_also: [
            activeSentence.replace(/[.,!?;:]/g, ''),
            activeSentence.trim(),
          ],
          new_mnemonic,
          interval_info,
        };
      case 3:
        // Without a verified Uzbek sentence, ask for the known Uzbek meaning.
        // The learner must be able to answer without seeing the English context.
        if (uz_meaning?.trim()) {
          return {
            type: 'uz_to_en',
            prompt: `Inglizchaga tarjima qiling: ${uz_meaning.trim()}`,
            audio_text: '',
            answer: word,
            accept_also: [],
            new_mnemonic,
            interval_info,
          };
        }
        return {
          type: 'uz_to_en',
          prompt: `Ushbu intervaldagi gapni ingliz tilida tiklang (${activeSentenceLabel || 'kontekst'}):`,
          audio_text: '',
          answer: activeSentence,
          accept_also: [
            activeSentence.replace(/[.,!?;:]/g, ''),
            activeSentence.trim(),
            word,
          ],
          new_mnemonic,
          interval_info,
        };
      case 4:
        return {
          type: 'gap_fill',
          prompt: gappedSentence,
          audio_text: '',
          answer: word,
          accept_also: [
            word.toLowerCase(),
            word.charAt(0).toUpperCase() + word.slice(1),
          ],
          new_mnemonic,
          interval_info,
        };
      case 5:
        return {
          type: 'conversation',
          prompt: `Misol: "${activeSentence}". Ushbu vaziyatda "${word}" so‘zidan foydalanib o‘z munosabatingizni bildiring:`,
          audio_text: '',
          answer: word,
          accept_also: [word.toLowerCase()],
          new_mnemonic,
          interval_info,
        };
    }
  }

  // Pre-configured rich exercises for target words
  if (word === 'resilience') {
    switch (stage) {
      case 1:
        return {
          type: 'choose',
          prompt: 'She showed extraordinary resilience after failing her initial exams.',
          audio_text: 'She showed extraordinary resilience after failing her initial exams.',
          answer: 'Matonat, chidamlilik',
          accept_also: ['chidamlilik'],
          options: [
            'Matonat, chidamlilik',
            'Beparvolik, loqaydlik',
            'Tezkor xulosa chiqarish',
            'Ortiqcha hayajonlanish',
          ],
          new_mnemonic,
        };
      case 2:
        return {
          type: 'dictation',
          prompt: 'Eshitgan jumlani ingliz tilida yozing:',
          audio_text: 'Building mental resilience takes daily practice.',
          answer: 'Building mental resilience takes daily practice.',
          accept_also: ['Building mental resilience takes daily practice'],
          new_mnemonic,
        };
      case 3:
        return {
          type: 'uz_to_en',
          prompt: 'Biz qiyin vaziyatlarda matonat (resilience) ko‘rsatishimiz kerak.',
          audio_text: '',
          answer: 'We need to show resilience in difficult situations.',
          accept_also: [
            'We must show resilience in difficult situations.',
            'We have to show resilience in difficult situations.',
          ],
          new_mnemonic,
        };
      case 4:
        return {
          type: 'gap_fill',
          prompt: 'True ___ means bouncing back from any defeat.',
          audio_text: '',
          answer: 'resilience',
          accept_also: ['Resilience'],
          new_mnemonic,
        };
      case 5:
        return {
          type: 'conversation',
          prompt: 'What was the toughest obstacle where resilience helped you succeed?',
          audio_text: '',
          answer: 'resilience',
          accept_also: ['resilient'],
          new_mnemonic,
        };
    }
  }

  if (word === 'meticulous') {
    switch (stage) {
      case 1:
        return {
          type: 'choose',
          prompt: 'He conducted meticulous research before publishing his discoveries.',
          audio_text: 'He conducted meticulous research before publishing his discoveries.',
          answer: 'O‘ta sinchkov, mayda detallargacha e’tiborli',
          options: [
            'O‘ta sinchkov, mayda detallargacha e’tiborli',
            'Shoshma-shosharlik bilan qilingan',
            'Tasodifiy va tartibsiz',
            'Qo‘pol va e’tiborsiz',
          ],
          accept_also: [],
          new_mnemonic,
        };
      case 2:
        return {
          type: 'dictation',
          prompt: 'Eshitgan jumlani ingliz tilida yozing:',
          audio_text: 'Her meticulous notes helped everyone pass the exam.',
          answer: 'Her meticulous notes helped everyone pass the exam.',
          accept_also: ['Her meticulous notes helped everyone pass the exam'],
          new_mnemonic,
        };
      case 3:
        return {
          type: 'uz_to_en',
          prompt: 'U har bir hisobotni o‘ta sinchkovlik (meticulous) bilan tekshiradi.',
          audio_text: '',
          answer: 'He checks every report in a meticulous way.',
          accept_also: [
            'She checks every report in a meticulous way.',
            'He is meticulous when checking every report.',
          ],
          new_mnemonic,
        };
      case 4:
        return {
          type: 'gap_fill',
          prompt: 'A ___ researcher checks every tiny detail twice.',
          audio_text: '',
          answer: 'meticulous',
          accept_also: ['Meticulous'],
          new_mnemonic,
        };
      case 5:
        return {
          type: 'conversation',
          prompt: 'Which part of your daily work requires a meticulous approach?',
          audio_text: '',
          answer: 'meticulous',
          accept_also: [],
          new_mnemonic,
        };
    }
  }

  // Generic fallback generator for any vocabulary word
  switch (stage) {
    case 1: {
      const correctMeaning = uz_meaning?.trim() || `${word} so‘zi ma’nosi`;
      const { answer, options } = generateFourOptions(correctMeaning);
      return {
        type: 'choose',
        prompt: `It is vital to understand the concept of ${word} in modern society.`,
        audio_text: `It is vital to understand the concept of ${word} in modern society.`,
        answer,
        options,
        accept_also: [word, word.toLowerCase(), correctMeaning],
        new_mnemonic,
      };
    }
    case 2:
      return {
        type: 'dictation',
        prompt: 'Eshitgan jumlani ingliz tilida yozing:',
        audio_text: `We always practice the word ${word} in context.`,
        answer: `We always practice the word ${word} in context.`,
        accept_also: [`We always practice the word ${word} in context`],
        new_mnemonic,
      };
    case 3:
      return {
        type: 'uz_to_en',
        prompt: `Biz har kuni "${word}" so‘zini qo‘llashga odatlandik.`,
        audio_text: '',
        answer: `We are used to using ${word} every day.`,
        accept_also: [`We practice ${word} every day.`],
        new_mnemonic,
      };
    case 4:
      return {
        type: 'gap_fill',
        prompt: `Regular practice makes our understanding of ___ much stronger.`,
        audio_text: '',
        answer: word,
        accept_also: [word.charAt(0).toUpperCase() + word.slice(1)],
        new_mnemonic,
      };
    case 5:
      return {
        type: 'conversation',
        prompt: `In what specific situation would you advise someone to use ${word}?`,
        audio_text: '',
        answer: word,
        accept_also: [],
        new_mnemonic,
      };
  }
}

