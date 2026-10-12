import { create } from 'zustand';
import type { CardOutput, CheckSentenceOutput, CheckReplyOutput, MnemonicItemOutput } from '@/lib/schemas/ai-coach';
import type { CuratedWord } from '@/features/words/types/curriculum';
import type { ItemType } from '@/features/words/types';
import { aiCoachApi } from '@/features/words/api/ai-coach-api';
import { translateInput } from '@/features/words/services/translation-service';

export type StepperStep = 1 | 2 | 3 | 4;

export interface AddWordStepperState {
  isOpen: boolean;
  step: StepperStep;
  wordInput: string;
  learnerLevel: 'A2' | 'B1' | 'B2' | 'C1';
  itemType: ItemType;

  // Step 1: Hook
  isLoadingCard: boolean;
  cardData: CardOutput | null;
  chosenMnemonicIndex: number | null;
  chosenMnemonic: MnemonicItemOutput | null;
  customMnemonicText: string;
  isEditingMnemonic: boolean;

  // Step 2: Listen & Say
  listenConfirmed: boolean;
  speakConfirmed: boolean;

  // Step 3: Own Sentence
  ownSentence: string;
  isCheckingSentence: boolean;
  sentenceFeedback: CheckSentenceOutput | null;

  // Step 4: Conversation Bridge
  conversationReply: string;
  isCheckingReply: boolean;
  replyFeedback: CheckReplyOutput | null;

  // Global error
  error: string | null;

  // Actions
  openStepper: (initialWord?: string, forcedType?: ItemType) => void;
  openWithCuratedWord: (curated: CuratedWord) => void;
  closeStepper: () => void;
  setWordInput: (val: string) => void;
  setItemType: (type: ItemType) => void;
  startFlowWithWord: (
    inputQuery: string,
    curatedInfo?: Partial<CuratedWord>,
    forcedType?: ItemType
  ) => Promise<void>;
  selectMnemonic: (index: number) => void;
  setCustomMnemonicText: (text: string) => void;
  toggleEditingMnemonic: () => void;
  confirmListen: () => void;
  confirmSpeak: () => void;
  setOwnSentence: (sentence: string) => void;
  submitSentenceForCheck: () => Promise<void>;
  setConversationReply: (reply: string) => void;
  submitReplyForCheck: () => Promise<void>;
  goToStep: (step: StepperStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const initialState = {
  isOpen: false,
  step: 1 as StepperStep,
  wordInput: '',
  learnerLevel: 'B1' as const,
  itemType: 'word' as ItemType,
  isLoadingCard: false,
  cardData: null,
  chosenMnemonicIndex: 0,
  chosenMnemonic: null,
  customMnemonicText: '',
  isEditingMnemonic: false,
  listenConfirmed: false,
  speakConfirmed: false,
  ownSentence: '',
  isCheckingSentence: false,
  sentenceFeedback: null,
  conversationReply: '',
  isCheckingReply: false,
  replyFeedback: null,
  error: null,
};

export const useAddWordStepperStore = create<AddWordStepperState>((set, get) => ({
  ...initialState,

  openStepper: (initialWord = '', forcedType?: ItemType) => {
    set({
      ...initialState,
      isOpen: true,
      wordInput: initialWord,
      itemType: forcedType || 'word',
    });
    if (initialWord.trim()) {
      get().startFlowWithWord(initialWord.trim(), undefined, forcedType);
    }
  },

  openWithCuratedWord: (curated: CuratedWord) => {
    const validLevels: ('A2' | 'B1' | 'B2' | 'C1')[] = ['A2', 'B1', 'B2', 'C1'];
    const cefr = validLevels.includes(curated.cefr as any)
      ? (curated.cefr as 'A2' | 'B1' | 'B2' | 'C1')
      : 'B1';

    set({
      ...initialState,
      isOpen: true,
      wordInput: curated.word,
      learnerLevel: cefr,
      itemType: 'word',
    });
    get().startFlowWithWord(curated.word, curated, 'word');
  },

  closeStepper: () => {
    set({ isOpen: false });
  },

  setWordInput: (val: string) => {
    set({ wordInput: val, error: null });
  },

  setItemType: (type: ItemType) => {
    set({ itemType: type });
  },

  startFlowWithWord: async (
    inputQuery: string,
    curatedInfo?: Partial<CuratedWord>,
    forcedType?: ItemType
  ) => {
    const cleanInput = inputQuery.trim();
    if (!cleanInput) {
      set({ error: "Iltimos, o'rganmoqchi bo'lgan so'z yoki gapingizni kiriting" });
      return;
    }

    set({
      isLoadingCard: true,
      error: null,
      wordInput: cleanInput,
      step: 1,
    });

    try {
      // 1. Resolve language and translation (Uzbek -> English / English -> Uzbek)
      const translation = await translateInput(cleanInput, forcedType);
      const effectiveType: ItemType = forcedType || translation.itemType;
      const targetEnglish = translation.englishText;
      const uzMeaning = translation.uzbekText;

      set({ itemType: effectiveType });

      // 2. If it's a Sentence
      if (effectiveType === 'sentence') {
        const sentenceCard: CardOutput = {
          word: targetEnglish,
          pos: 'sentence',
          ipa: '',
          uz_meaning: uzMeaning,
          chunks: [
            `${targetEnglish} — ${uzMeaning}`,
          ],
          mnemonics: [
            {
              type: 'image',
              scene_uz: `Bu gapni kundalik hayotingizda qayerda va kimga aytishingizni ko‘z oldingizga keltiring: "${uzMeaning}"`,
            },
          ],
          model_sentences: {
            present: targetEnglish,
            past: targetEnglish,
            future: targetEnglish,
          },
          personal_prompt_uz: `Bu gapni qaysi haqiqiy vaziyatda ishlatmoqchisiz?`,
        };

        const firstMnemonic = sentenceCard.mnemonics[0] || null;
        const initialText = firstMnemonic && 'scene_uz' in firstMnemonic ? (firstMnemonic.scene_uz as string) : '';
        set({
          cardData: sentenceCard,
          chosenMnemonicIndex: 0,
          chosenMnemonic: firstMnemonic,
          customMnemonicText: initialText,
          isLoadingCard: false,
        });
        return;
      }

      // 3. If it's a Word, generate AI memory card
      const card = await aiCoachApi.generateCard({
        word: targetEnglish.toLowerCase(),
        learner_level: get().learnerLevel,
      });

      // Enhance with curated data if available
      const mergedCard: CardOutput = {
        ...card,
        ipa: card.ipa || curatedInfo?.phonetic || translation.matchedCuratedWord?.phonetic || '',
        uz_meaning: curatedInfo?.translation || translation.matchedCuratedWord?.translation || uzMeaning || card.uz_meaning,
        chunks:
          curatedInfo?.collocations && curatedInfo.collocations.length > 0
            ? curatedInfo.collocations
            : card.chunks,
      };

      const availableMnemonics = (mergedCard.mnemonics || []).filter(
        (m): m is MnemonicItemOutput => m !== null
      );
      const defaultMnemonic = availableMnemonics[0] || null;

      const getMnemonicDescription = (m: MnemonicItemOutput | null): string => {
        if (!m) return '';
        if (m.type === 'root') return m.explanation_uz;
        return m.scene_uz;
      };

      set({
        cardData: mergedCard,
        chosenMnemonicIndex: 0,
        chosenMnemonic: defaultMnemonic,
        customMnemonicText: getMnemonicDescription(defaultMnemonic),
        isLoadingCard: false,
      });
    } catch (err: unknown) {
      const error = err as Error;
      set({
        isLoadingCard: false,
        error: error.message || "Kartochka yaratishda xatolik yuz berdi",
      });
    }
  },

  selectMnemonic: (index: number) => {
    const { cardData } = get();
    if (!cardData) return;

    const availableMnemonics = (cardData.mnemonics || []).filter(
      (m): m is MnemonicItemOutput => m !== null
    );

    const selected = availableMnemonics[index];
    if (selected) {
      const text = selected.type === 'root' ? selected.explanation_uz : selected.scene_uz;
      set({
        chosenMnemonicIndex: index,
        chosenMnemonic: selected,
        customMnemonicText: text,
        isEditingMnemonic: false,
      });
    }
  },

  setCustomMnemonicText: (text: string) => {
    set({ customMnemonicText: text });
  },

  toggleEditingMnemonic: () => {
    set((state) => ({ isEditingMnemonic: !state.isEditingMnemonic }));
  },

  confirmListen: () => {
    set({ listenConfirmed: true });
  },

  confirmSpeak: () => {
    set({ speakConfirmed: true });
  },

  setOwnSentence: (sentence: string) => {
    set({ ownSentence: sentence, sentenceFeedback: null });
  },

  submitSentenceForCheck: async () => {
    const { cardData, ownSentence, learnerLevel } = get();
    if (!cardData || !ownSentence.trim()) return;

    set({ isCheckingSentence: true });
    try {
      const feedback = await aiCoachApi.checkSentence({
        word: cardData.word,
        user_sentence: ownSentence,
        learner_level: learnerLevel,
      });
      set({ sentenceFeedback: feedback, isCheckingSentence: false });
    } catch {
      set({ isCheckingSentence: false });
    }
  },

  setConversationReply: (reply: string) => {
    set({ conversationReply: reply, replyFeedback: null });
  },

  submitReplyForCheck: async () => {
    const { cardData, conversationReply, learnerLevel } = get();
    if (!cardData || !conversationReply.trim()) return;

    set({ isCheckingReply: true });
    try {
      const feedback = await aiCoachApi.checkReply({
        word: cardData.word,
        question: cardData.personal_prompt_uz || 'Why is this word meaningful to you?',
        user_reply: conversationReply,
        learner_level: learnerLevel,
      });
      set({ replyFeedback: feedback, isCheckingReply: false });
    } catch {
      set({ isCheckingReply: false });
    }
  },

  goToStep: (step: StepperStep) => {
    set({ step });
  },

  nextStep: () => {
    const { step } = get();
    if (step < 4) {
      set({ step: (step + 1) as StepperStep });
    }
  },

  prevStep: () => {
    const { step } = get();
    if (step > 1) {
      set({ step: (step - 1) as StepperStep });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
