import { z } from 'zod';

export const LearnerLevelSchema = z.enum(['A2', 'B1', 'B2', 'C1']);
export type LearnerLevel = z.infer<typeof LearnerLevelSchema>;

// Base request input required across all modes
export const BaseAiCoachInputSchema = z.object({
  word: z.string().min(1, "So'z ko'rsatilishi shart"),
  learner_level: LearnerLevelSchema.default('B1'),
  known_words: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
});

// Mode specific request schemas
export const CardInputSchema = BaseAiCoachInputSchema.extend({
  mode: z.literal('CARD'),
  word_id: z.string().uuid().optional(),
});
export type CardInput = z.infer<typeof CardInputSchema>;

export const CheckSentenceInputSchema = BaseAiCoachInputSchema.extend({
  mode: z.literal('CHECK_SENTENCE'),
  user_sentence: z.string().min(1, 'Jumla kiritilishi shart'),
});
export type CheckSentenceInput = z.infer<typeof CheckSentenceInputSchema>;

export const CheckReplyInputSchema = BaseAiCoachInputSchema.extend({
  mode: z.literal('CHECK_REPLY'),
  question: z.string().min(1, 'Savol kiritilishi shart'),
  user_reply: z.string().min(1, 'Javob kiritilishi shart'),
});
export type CheckReplyInput = z.infer<typeof CheckReplyInputSchema>;

export const ReviewStageSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type ReviewStage = z.infer<typeof ReviewStageSchema>;

export const ReviewInputSchema = BaseAiCoachInputSchema.extend({
  mode: z.literal('REVIEW'),
  stage: ReviewStageSchema,
  lapses: z.number().int().nonnegative().default(0),
  previous_sentences: z.array(z.string()).default([]),
});
export type ReviewInput = z.infer<typeof ReviewInputSchema>;

export const AiCoachRequestSchema = z.discriminatedUnion('mode', [
  CardInputSchema,
  CheckSentenceInputSchema,
  CheckReplyInputSchema,
  ReviewInputSchema,
]);
export type AiCoachRequest = z.infer<typeof AiCoachRequestSchema>;

// Mnemonics
export const SoundMnemonicOutputSchema = z.object({
  type: z.literal('sound'),
  uz_hook: z.string().nullable().optional(),
  scene_uz: z.string(),
});
export type SoundMnemonicOutput = z.infer<typeof SoundMnemonicOutputSchema>;

export const ImageMnemonicOutputSchema = z.object({
  type: z.literal('image'),
  scene_uz: z.string(),
});
export type ImageMnemonicOutput = z.infer<typeof ImageMnemonicOutputSchema>;

export const RootMnemonicOutputSchema = z.object({
  type: z.literal('root'),
  explanation_uz: z.string(),
  related_words: z.array(z.string()),
});
export type RootMnemonicOutput = z.infer<typeof RootMnemonicOutputSchema>;

export const MnemonicItemOutputSchema = z.union([
  SoundMnemonicOutputSchema,
  ImageMnemonicOutputSchema,
  RootMnemonicOutputSchema,
]);
export type MnemonicItemOutput = z.infer<typeof MnemonicItemOutputSchema>;

// CARD Output Schema
export const CardOutputSchema = z.object({
  word: z.string().min(1),
  pos: z.string(),
  ipa: z.string(),
  uz_meaning: z.string().min(1),
  chunks: z.array(z.string()).min(1),
  mnemonics: z.array(MnemonicItemOutputSchema.nullable()),
  model_sentences: z.object({
    present: z.string(),
    past: z.string(),
    future: z.string(),
  }),
  personal_prompt_uz: z.string().min(1),
});
export type CardOutput = z.infer<typeof CardOutputSchema>;

// CHECK_SENTENCE Output Schema
export const CheckSentenceOutputSchema = z.object({
  uses_word_correctly: z.boolean(),
  grammar_ok: z.boolean(),
  natural_score: z.number().min(0).max(100),
  corrected: z.string(),
  feedback_uz: z.string(),
  follow_up_question: z.string(),
});
export type CheckSentenceOutput = z.infer<typeof CheckSentenceOutputSchema>;

// CHECK_REPLY Output Schema
export const CheckReplyOutputSchema = CheckSentenceOutputSchema.extend({
  used_target_word: z.boolean(),
});
export type CheckReplyOutput = z.infer<typeof CheckReplyOutputSchema>;

// REVIEW Output Schema
export const ReviewTaskTypeSchema = z.enum([
  'choose',
  'dictation',
  'uz_to_en',
  'gap_fill',
  'conversation',
]);
export type ReviewTaskType = z.infer<typeof ReviewTaskTypeSchema>;

export const ReviewOutputSchema = z.object({
  type: ReviewTaskTypeSchema,
  prompt: z.string(),
  audio_text: z.string().optional().default(''),
  answer: z.string(),
  accept_also: z.array(z.string()).default([]),
  options: z.array(z.string()).optional(),
  new_mnemonic: MnemonicItemOutputSchema.nullable().optional(),
  interval_info: z
    .object({
      interval: z.number(),
      sentence: z.string(),
      label: z.string(),
    })
    .optional(),
});
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;

// Error Output Schema
export const AiCoachErrorSchema = z.object({
  error: z.string(),
  field: z.string().optional(),
  message: z.string().optional(),
});
export type AiCoachError = z.infer<typeof AiCoachErrorSchema>;
