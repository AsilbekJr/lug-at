import { z } from 'zod';
import { State, Rating } from 'ts-fsrs';

export const CefrLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export type CefrLevel = z.infer<typeof CefrLevelSchema>;

// Item type: single word or full sentence/phrase
export type ItemType = 'word' | 'sentence';

// 1. Words schema (words table)
export const WordSchema = z.object({
  id: z.string().uuid(),
  word: z.string().min(1, "So'z kiritilishi shart"),
  pos: z.string().nullable().optional(),
  ipa: z.string().nullable().optional(),
  uz_meaning: z.string().min(1, "O'zbekcha ma'no kiritilishi shart"),
  item_type: z.enum(['word', 'sentence']).optional(),
  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string(),
});
export type Word = z.infer<typeof WordSchema>;

// Mnemonic schemas matching exact specifications
export const SoundMnemonicSchema = z.object({
  type: z.literal('sound'),
  uz_hook: z.string().nullable().optional(),
  scene_uz: z.string(),
});

export const ImageMnemonicSchema = z.object({
  type: z.literal('image'),
  scene_uz: z.string(),
});

export const RootMnemonicSchema = z.object({
  type: z.literal('root'),
  explanation_uz: z.string(),
  related_words: z.array(z.string()),
  scene_uz: z.string().optional(),
});

export const MnemonicItemSchema = z.union([
  SoundMnemonicSchema,
  ImageMnemonicSchema,
  RootMnemonicSchema,
]);
export type MnemonicItem = z.infer<typeof MnemonicItemSchema>;

// 2. WordCard content schema (word_cards table)
export const WordCardContentSchema = z.object({
  word: z.string(),
  pos: z.string(),
  ipa: z.string(),
  uz_meaning: z.string(),
  chunks: z.array(z.string()),
  mnemonics: z.array(MnemonicItemSchema.nullable()),
  model_sentences: z.object({
    present: z.string(),
    past: z.string(),
    future: z.string(),
  }),
  personal_prompt_uz: z.string(),
  cefr_level: CefrLevelSchema.optional(),
  item_type: z.enum(['word', 'sentence']).optional(),
});
export type WordCardContent = z.infer<typeof WordCardContentSchema>;

export const WordCardSchema = z.object({
  word_id: z.string().uuid(),
  content: WordCardContentSchema,
  created_at: z.string(),
});
export type WordCard = z.infer<typeof WordCardSchema>;

// 3. UserWord schema (user_words table)
export const UserWordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  word_id: z.string().uuid(),
  chosen_mnemonic: MnemonicItemSchema.nullable().optional(),
  own_sentence: z.string().nullable().optional(),
  stability: z.number().default(0.0),
  difficulty: z.number().default(0.0),
  due_at: z.string(),
  state: z.nativeEnum(State).default(State.New),
  reps: z.number().default(0),
  lapses: z.number().default(0),
  last_review: z.string().nullable().optional(),
  recog_ok: z.boolean().default(false),
  listen_ok: z.boolean().default(false),
  write_ok: z.boolean().default(false),
  speak_ok: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});
export type UserWord = z.infer<typeof UserWordSchema>;

// 4. ReviewLog schema (review_log table)
export const ReviewLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  user_word_id: z.string().uuid(),
  task_type: z.string(),
  rating: z.nativeEnum(Rating),
  ts: z.string(),
});
export type ReviewLog = z.infer<typeof ReviewLogSchema>;

// Joined full user word with word definition and card content
export interface EnrichedUserWord {
  userWord: UserWord;
  word: Word;
  card?: WordCard;
}

export const CreateWordInputSchema = z.object({
  word: z.string().min(1, "So'z kiritilishi shart"),
  pos: z.string().optional(),
  ipa: z.string().optional(),
  uz_meaning: z.string().min(1, "O'zbekcha ma'nosi kiritilishi shart"),
  item_type: z.enum(['word', 'sentence']).optional(),
  own_sentence: z.string().optional(),
  chosen_mnemonic: MnemonicItemSchema.nullable().optional(),
  cardContent: WordCardContentSchema.optional(),
  recog_ok: z.boolean().optional(),
  listen_ok: z.boolean().optional(),
  write_ok: z.boolean().optional(),
  speak_ok: z.boolean().optional(),
  is_known: z.boolean().optional(),
});
export type CreateWordInput = z.infer<typeof CreateWordInputSchema>;
