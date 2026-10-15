import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Word, WordCard, UserWord, ReviewLog, EnrichedUserWord, CreateWordInput } from '@/features/words/types';
import { State, Rating, createEmptyCard } from 'ts-fsrs';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial editorial seed data for offline / prototype resilience
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const INITIAL_WORDS: Word[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    word: 'resilience',
    pos: 'noun',
    ipa: '/rɪˈzɪl.jəns/',
    uz_meaning: 'Matonat, chidamlilik, qiyinchiliklardan tiklana olish qobiliyati',
    created_by: DEMO_USER_ID,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    word: 'meticulous',
    pos: 'adjective',
    ipa: '/məˈtɪk.jə.ləs/',
    uz_meaning: 'O\'ta sinchkov, mayda detallargacha qunt bilan e\'tibor beruvchi',
    created_by: DEMO_USER_ID,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    word: 'ephemeral',
    pos: 'adjective',
    ipa: '/ɪˈfem.ər.əl/',
    uz_meaning: 'O\'tkinchi, qisqa umr ko\'ruvchi, tez yo\'qoluvchi',
    created_by: DEMO_USER_ID,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    word: 'eloquent',
    pos: 'adjective',
    ipa: '/ˈel.ə.kwənt/',
    uz_meaning: 'Fasih, notiqona, ta\'sirchan so\'zlay oladigan',
    created_by: DEMO_USER_ID,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    word: 'serendipity',
    pos: 'noun',
    ipa: '/ˌser.ənˈdɪp.ə.ti/',
    uz_meaning: 'Kutilmagan baxtli tasodif, tasodifan yoqimli narsani kashf qilish',
    created_by: DEMO_USER_ID,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

const INITIAL_WORD_CARDS: WordCard[] = [
  {
    word_id: '10000000-0000-0000-0000-000000000001',
    content: {
      word: 'resilience',
      pos: 'noun',
      ipa: '/rɪˈzɪl.jəns/',
      uz_meaning: 'Matonat, chidamlilik, qiyinchiliklardan tiklana olish qobiliyati',
      chunks: [
        'emotional resilience — ruhiy matonat',
        'build resilience — chidamlilikni rivojlantirish',
        'remarkable resilience — hayratlanarli darajada matonat',
      ],
      mnemonics: [
        {
          type: 'sound',
          uz_hook: 'Rezin',
          scene_uz: 'Rezin koptok yerga qanchalik qattiq urilsa, shuncha baland sakraydi. Zarbalarga chidab tiklanish — bu resilience!',
        },
        {
          type: 'image',
          scene_uz: 'Qattiq shamol va bo\'ronda egilib, lekin sinmay tik qolgan yosh daraxt obrazi.',
        },
        {
          type: 'root',
          explanation_uz: 'Lotincha "resilire" (orqaga sakramoq, tiklanmoq) so\'zidan olingan.',
          related_words: ['resilient', 'resile'],
        },
      ],
      model_sentences: {
        present: 'She shows great resilience in difficult negotiations.',
        past: 'The community rebuilt the town with unbelievable resilience.',
        future: 'New habits will foster long-term mental resilience.',
      },
      personal_prompt_uz: 'Oxirgi marta qiyin vaziyatda qanday matonat (resilience) ko\'rsatgan edingiz?',
      cefr_level: 'B2',
    },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    word_id: '10000000-0000-0000-0000-000000000002',
    content: {
      word: 'meticulous',
      pos: 'adjective',
      ipa: '/məˈtɪk.jə.ləs/',
      uz_meaning: 'O\'ta sinchkov, mayda detallargacha qunt bilan e\'tibor beruvchi',
      chunks: [
        'meticulous planning — puxta va sinchkov rejalashtirish',
        'meticulous attention to detail — mayda tafsilotlarga o\'ta diqqatli bo\'lish',
        'meticulous research — chuqur va sinchkov izlanish',
      ],
      mnemonics: [
        {
          type: 'image',
          scene_uz: 'Zargar kattalashtiruvchi shisha bilan har bir nuqtani sinchiklab tekshirayotgan holat.',
        },
      ],
      model_sentences: {
        present: 'He is meticulous about keeping his laboratory equipment spotless.',
        past: 'The author conducted meticulous research before publishing the book.',
        future: 'Our team will take a meticulous approach to every audit.',
      },
      personal_prompt_uz: 'Qaysi ishingizda o\'ta sinchkov (meticulous) bo\'lishni yoqtirasiz?',
      cefr_level: 'B2',
    },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    word_id: '10000000-0000-0000-0000-000000000003',
    content: {
      word: 'ephemeral',
      pos: 'adjective',
      ipa: '/ɪˈfem.ər.əl/',
      uz_meaning: 'O\'tkinchi, qisqa umr ko\'ruvchi, tez yo\'qoluvchi',
      chunks: [
        'ephemeral beauty — o\'tkinchi go\'zallik',
        'ephemeral nature — tez o\'tib ketuvchi tabiat',
        'ephemeral pleasure — qisqa muddatli rohat',
      ],
      mnemonics: [
        {
          type: 'image',
          scene_uz: 'Ertalabki quyosh chiqqanda bir lahzada erib yo\'qoladigan tuman.',
        },
      ],
      model_sentences: {
        present: 'Social media fame is often completely ephemeral.',
        past: 'The blooming of that rare flower was beautiful yet ephemeral.',
        future: 'Digital trends will remain ephemeral as technology accelerates.',
      },
      personal_prompt_uz: 'Sizning hayotingizda qaysi go\'zal lahza o\'tkinchi (ephemeral) bo\'lgan?',
      cefr_level: 'C1',
    },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    word_id: '10000000-0000-0000-0000-000000000004',
    content: {
      word: 'eloquent',
      pos: 'adjective',
      ipa: '/ˈel.ə.kwənt/',
      uz_meaning: 'Fasih, notiqona, ta\'sirchan so\'zlay oladigan',
      chunks: [
        'eloquent speaker — fasih notiq',
        'eloquent silence — ko\'p ma\'noli jimlik',
        'eloquent defense — ta\'sirchan himoya nutqi',
      ],
      mnemonics: [
        {
          type: 'root',
          explanation_uz: 'Lotincha "loqui" (gapirmoq) ildizidan kelib chiqqan.',
          related_words: ['loquacious', 'elocution', 'colloquial'],
        },
      ],
      model_sentences: {
        present: 'She delivers eloquent speeches that move the entire crowd.',
        past: 'His eloquent argument swayed the skeptical jury.',
        future: 'You will become more eloquent through consistent reading.',
      },
      personal_prompt_uz: 'Kimning nutqi siz uchun hayratlanarli darajada fasih (eloquent)?',
      cefr_level: 'C1',
    },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    word_id: '10000000-0000-0000-0000-000000000005',
    content: {
      word: 'serendipity',
      pos: 'noun',
      ipa: '/ˌser.ənˈdɪp.ə.ti/',
      uz_meaning: 'Kutilmagan baxtli tasodif, tasodifan yoqimli narsani kashf qilish',
      chunks: [
        'pure serendipity — sof baxtli tasodif',
        'stroke of serendipity — kutilmagan omadli burilish',
        'scientific serendipity — ilmiy tasodifiy kashfiyot',
      ],
      mnemonics: [
        {
          type: 'image',
          scene_uz: 'Eski kitob orasidan tasodifan qimmatli xat yoki rasm topib olish quvonchi.',
        },
      ],
      model_sentences: {
        present: 'Finding your soulmate in a crowded airport is pure serendipity.',
        past: 'Penicillin was discovered through an incredible act of serendipity.',
        future: 'Travel often opens the door to unexpected serendipity.',
      },
      personal_prompt_uz: 'Oxirgi marta qanday kutilmagan baxtli tasodifga (serendipity) duch keldingiz?',
      cefr_level: 'C2',
    },
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

const INITIAL_USER_WORDS: UserWord[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    user_id: DEMO_USER_ID,
    word_id: '10000000-0000-0000-0000-000000000001',
    chosen_mnemonic: INITIAL_WORD_CARDS[0].content.mnemonics[0],
    own_sentence: 'I learned that mental resilience is built during the hardest seasons.',
    stability: 2.1,
    difficulty: 5.2,
    due_at: new Date(Date.now() - 3600000).toISOString(), // Due now
    state: State.Review,
    reps: 2,
    lapses: 0,
    last_review: new Date(Date.now() - 86400000 * 2).toISOString(),
    recog_ok: true,
    listen_ok: true,
    write_ok: true,
    speak_ok: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    user_id: DEMO_USER_ID,
    word_id: '10000000-0000-0000-0000-000000000002',
    chosen_mnemonic: INITIAL_WORD_CARDS[1].content.mnemonics[0],
    own_sentence: 'She was meticulous about keeping her research notes indexed.',
    stability: 0.8,
    difficulty: 6.0,
    due_at: new Date(Date.now() - 7200000).toISOString(), // Due now
    state: State.Learning,
    reps: 1,
    lapses: 0,
    last_review: new Date(Date.now() - 86400000).toISOString(),
    recog_ok: true,
    listen_ok: true,
    write_ok: false,
    speak_ok: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    user_id: DEMO_USER_ID,
    word_id: '10000000-0000-0000-0000-000000000003',
    chosen_mnemonic: INITIAL_WORD_CARDS[2].content.mnemonics[0],
    own_sentence: 'The morning mist over the valley was ephemeral.',
    stability: 4.5,
    difficulty: 4.2,
    due_at: new Date(Date.now() - 1800000).toISOString(), // Due now
    state: State.Review,
    reps: 3,
    lapses: 0,
    last_review: new Date(Date.now() - 86400000 * 4).toISOString(),
    recog_ok: true,
    listen_ok: true,
    write_ok: true,
    speak_ok: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    user_id: DEMO_USER_ID,
    word_id: '10000000-0000-0000-0000-000000000004',
    chosen_mnemonic: INITIAL_WORD_CARDS[3].content.mnemonics[0],
    own_sentence: 'Her eloquent defense of truth silenced the room.',
    stability: 5.8,
    difficulty: 3.5,
    due_at: new Date(Date.now() + 86400000 * 2).toISOString(), // Due in 2 days
    state: State.Review,
    reps: 2,
    lapses: 0,
    last_review: new Date(Date.now() - 86400000).toISOString(),
    recog_ok: true,
    listen_ok: true,
    write_ok: true,
    speak_ok: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000005',
    user_id: DEMO_USER_ID,
    word_id: '10000000-0000-0000-0000-000000000005',
    chosen_mnemonic: INITIAL_WORD_CARDS[4].content.mnemonics[0],
    own_sentence: 'Meeting my best friend in that small cafe was pure serendipity.',
    stability: 8.0,
    difficulty: 3.0,
    due_at: new Date(Date.now() + 86400000 * 5).toISOString(), // Due in 5 days
    state: State.Review,
    reps: 4,
    lapses: 0,
    last_review: new Date(Date.now() - 86400000 * 3).toISOString(),
    recog_ok: true,
    listen_ok: true,
    write_ok: true,
    speak_ok: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const STORAGE_KEYS = {
  WORDS: 'linguist_words_v2',
  WORD_CARDS: 'linguist_word_cards_v2',
  USER_WORDS: 'linguist_user_words_v2',
  REVIEW_LOG: 'linguist_review_log_v2',
};

function getLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    throw new Error('Qurilmaga saqlab bo‘lmadi. Xotira yoki brauzer ruxsatlarini tekshirib, qaytadan urinib ko‘ring.', { cause: err });
  }
}

// Seed local storage for offline preview
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.WORDS)) {
      setLocalData(STORAGE_KEYS.WORDS, INITIAL_WORDS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORD_CARDS)) {
      setLocalData(STORAGE_KEYS.WORD_CARDS, INITIAL_WORD_CARDS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER_WORDS)) {
      setLocalData(STORAGE_KEYS.USER_WORDS, INITIAL_USER_WORDS);
    }
  } catch {
    // Demo data remains readable from in-memory fallbacks. User saves still reject.
  }
}

export const dataRepository = {
  async getUserId(): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return user.id;
    }
    return DEMO_USER_ID;
  },

  async getWords(): Promise<Word[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(`Lug'at yuklanmadi: ${error.message}`);
      return data as Word[];
    }
    return getLocalData<Word[]>(STORAGE_KEYS.WORDS, INITIAL_WORDS);
  },

  async getUserWords(): Promise<EnrichedUserWord[]> {
    const userId = await this.getUserId();

    if (isSupabaseConfigured && supabase) {
      const { data: userWords, error: uwErr } = await supabase
        .from('user_words')
        .select('*, words(*, word_cards(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (uwErr) throw new Error(`So'zlar yuklanmadi: ${uwErr.message}`);

      return (userWords || [])
        .filter((row: any) => Boolean(row.words))
        .map((row: any) => ({
          userWord: row,
          word: row.words,
          card: Array.isArray(row.words?.word_cards)
            ? row.words.word_cards[0]
            : row.words?.word_cards,
        }));
    }

    const words = getLocalData<Word[]>(STORAGE_KEYS.WORDS, INITIAL_WORDS);
    const wordCards = getLocalData<WordCard[]>(STORAGE_KEYS.WORD_CARDS, INITIAL_WORD_CARDS);
    const userWords = getLocalData<UserWord[]>(STORAGE_KEYS.USER_WORDS, INITIAL_USER_WORDS);

    const wordsMap = new Map(words.map((w) => [w.id, w]));
    const cardsMap = new Map(wordCards.map((c) => [c.word_id, c]));

    return userWords
      .map((uw) => ({
        userWord: uw,
        word: wordsMap.get(uw.word_id)!,
        card: cardsMap.get(uw.word_id),
      }))
      .filter((e) => Boolean(e.word));
  },

  async getDueUserWords(): Promise<EnrichedUserWord[]> {
    const list = await this.getUserWords();
    const now = new Date().toISOString();
    return list
      .filter((item) => item.userWord.due_at <= now)
      .sort((a, b) => new Date(a.userWord.due_at).getTime() - new Date(b.userWord.due_at).getTime());
  },

  async createWord(input: CreateWordInput): Promise<EnrichedUserWord> {
    const userId = await this.getUserId();
    const wordId = crypto.randomUUID();
    const userWordId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newWord: Word = {
      id: wordId,
      word: input.word.trim(),
      pos: input.pos || input.cardContent?.pos || (input.item_type === 'sentence' ? 'sentence' : null),
      ipa: input.ipa || input.cardContent?.ipa || null,
      uz_meaning: input.uz_meaning.trim() || input.cardContent?.uz_meaning || '',
      item_type: input.item_type || 'word',
      created_by: userId,
      created_at: now,
    };

    const newWordCard: WordCard = {
      word_id: wordId,
      content: input.cardContent || {
        word: newWord.word,
        pos: newWord.pos || (input.item_type === 'sentence' ? 'sentence' : 'noun'),
        ipa: newWord.ipa || '',
        uz_meaning: newWord.uz_meaning,
        item_type: input.item_type || 'word',
        chunks: [
          `active ${newWord.word} — faol qo'llanish`,
          `strong ${newWord.word} — kuchli ifoda`,
          `daily ${newWord.word} — kundalik odat`,
        ],
        mnemonics: input.chosen_mnemonic ? [input.chosen_mnemonic] : [],
        model_sentences: {
          present: input.own_sentence || `I practice ${newWord.word} every day.`,
          past: `Yesterday we noticed their ${newWord.word}.`,
          future: `This will become part of our ${newWord.word}.`,
        },
        personal_prompt_uz: `O'z hayotingizda ${newWord.word} bilan bog'liq vaziyatni tasvirlang.`,
        cefr_level: 'B1',
      },
      created_at: now,
    };

    // Initialize FSRS state using ts-fsrs
    const initialFsrsCard = createEmptyCard(new Date());
    const isKnown = Boolean(input.is_known);

    const newUserWord: UserWord = {
      id: userWordId,
      user_id: userId,
      word_id: wordId,
      chosen_mnemonic: input.chosen_mnemonic || null,
      own_sentence: input.own_sentence || null,
      stability: isKnown ? 180 : initialFsrsCard.stability,
      difficulty: isKnown ? 1 : initialFsrsCard.difficulty,
      due_at: isKnown
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : initialFsrsCard.due.toISOString(),
      state: isKnown ? State.Review : initialFsrsCard.state,
      reps: isKnown ? 1 : 0,
      lapses: 0,
      last_review: isKnown ? now : null,
      recog_ok: input.recog_ok ?? false,
      listen_ok: input.listen_ok ?? false,
      write_ok: input.write_ok ?? false,
      speak_ok: input.speak_ok ?? false,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { error: wErr } = await supabase.from('words').insert(newWord);
      if (wErr) throw new Error(`So'z saqlanmadi: ${wErr.message}`);

      // word_cards is usually written by service role, fallback to direct insert if permitted
      await supabase.from('word_cards').insert(newWordCard);

      const { error: uwErr } = await supabase.from('user_words').insert(newUserWord);
      if (uwErr) throw new Error(`Foydalanuvchi so'zi saqlanmadi: ${uwErr.message}`);

      return { userWord: newUserWord, word: newWord, card: newWordCard };
    }

    const words = getLocalData<Word[]>(STORAGE_KEYS.WORDS, INITIAL_WORDS);
    const wordCards = getLocalData<WordCard[]>(STORAGE_KEYS.WORD_CARDS, INITIAL_WORD_CARDS);
    const userWords = getLocalData<UserWord[]>(STORAGE_KEYS.USER_WORDS, INITIAL_USER_WORDS);

    setLocalData(STORAGE_KEYS.WORDS, [newWord, ...words]);
    setLocalData(STORAGE_KEYS.WORD_CARDS, [newWordCard, ...wordCards]);
    setLocalData(STORAGE_KEYS.USER_WORDS, [newUserWord, ...userWords]);

    return { userWord: newUserWord, word: newWord, card: newWordCard };
  },

  async updateUserWordReview(
    userWordId: string,
    updatedFields: Partial<UserWord>,
    logData: { task_type: string; rating: Rating }
  ): Promise<void> {
    const userId = await this.getUserId();
    const logId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newLog: ReviewLog = {
      id: logId,
      user_id: userId,
      user_word_id: userWordId,
      task_type: logData.task_type,
      rating: logData.rating,
      ts: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { error: uwErr } = await supabase
        .from('user_words')
        .update({ ...updatedFields, updated_at: now })
        .eq('id', userWordId);
      if (uwErr) throw new Error(`Takrorlash saqlanmadi: ${uwErr.message}`);

      const { error: logErr } = await supabase.from('review_log').insert(newLog);
      if (logErr) throw new Error(`Hisobot saqlanmadi: ${logErr.message}`);
      return;
    }

    const userWords = getLocalData<UserWord[]>(STORAGE_KEYS.USER_WORDS, INITIAL_USER_WORDS);
    const updated = userWords.map((uw) =>
      uw.id === userWordId ? { ...uw, ...updatedFields, updated_at: now } : uw
    );
    setLocalData(STORAGE_KEYS.USER_WORDS, updated);

    const logs = getLocalData<ReviewLog[]>(STORAGE_KEYS.REVIEW_LOG, []);
    setLocalData(STORAGE_KEYS.REVIEW_LOG, [newLog, ...logs]);
  },

  async deleteUserWord(userWordId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('user_words').delete().eq('id', userWordId);
      if (error) throw new Error(`So'z o'chirilmadi: ${error.message}`);
      return;
    }

    const userWords = getLocalData<UserWord[]>(STORAGE_KEYS.USER_WORDS, INITIAL_USER_WORDS);
    setLocalData(STORAGE_KEYS.USER_WORDS, userWords.filter((uw) => uw.id !== userWordId));
  },

  async getReviewLogs(): Promise<ReviewLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('review_log')
        .select('*')
        .order('ts', { ascending: false });
      if (error) throw new Error(`Hisobotlar yuklanmadi: ${error.message}`);
      return data as ReviewLog[];
    }
    return getLocalData<ReviewLog[]>(STORAGE_KEYS.REVIEW_LOG, []);
  },
};
