import { describe, it, expect } from 'vitest';
import {
  AiCoachRequestSchema,
  CardOutputSchema,
  CheckSentenceOutputSchema,
  CheckReplyOutputSchema,
  ReviewOutputSchema,
  AiCoachErrorSchema,
} from './ai-coach';

describe('AI Coach Request Schemas', () => {
  it('validates a valid CARD request with defaults', () => {
    const input = {
      mode: 'CARD',
      word: 'resilience',
    };
    const parsed = AiCoachRequestSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mode).toBe('CARD');
      expect(parsed.data.learner_level).toBe('B1');
      expect(parsed.data.known_words).toEqual([]);
    }
  });

  it('validates a CHECK_SENTENCE request', () => {
    const input = {
      mode: 'CHECK_SENTENCE',
      word: 'resilience',
      learner_level: 'B2',
      user_sentence: 'She showed great resilience during difficult exams.',
      known_words: ['showed', 'great', 'during'],
      interests: ['education'],
    };
    const parsed = AiCoachRequestSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('fails if CHECK_SENTENCE is missing user_sentence', () => {
    const input = {
      mode: 'CHECK_SENTENCE',
      word: 'resilience',
    };
    const parsed = AiCoachRequestSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it('validates a CHECK_REPLY request with question and reply', () => {
    const input = {
      mode: 'CHECK_REPLY',
      word: 'resilience',
      question: 'When did you last need resilience in your life?',
      user_reply: 'I needed resilience when learning to code.',
    };
    const parsed = AiCoachRequestSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('validates a REVIEW request with stage and lapses', () => {
    const input = {
      mode: 'REVIEW',
      word: 'resilience',
      stage: 3,
      lapses: 2,
      previous_sentences: ['She is resilient.'],
    };
    const parsed = AiCoachRequestSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('fails REVIEW if stage is outside 1-5', () => {
    const input = {
      mode: 'REVIEW',
      word: 'resilience',
      stage: 6,
    };
    const parsed = AiCoachRequestSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });
});

describe('AI Coach Output Schemas', () => {
  it('validates valid CardOutput with null sound mnemonic', () => {
    const cardData = {
      word: 'ephemeral',
      pos: 'adjective',
      ipa: '/ɪˈfem.ər.əl/',
      uz_meaning: 'O‘tkinchi, qisqa umr ko‘radigan',
      chunks: [
        'ephemeral pleasure - o‘tkinchi rohat',
        'ephemeral nature - qisqa muddatli tabiat',
        'ephemeral beauty - o‘tkinchi go‘zallik',
      ],
      mnemonics: [
        null, // No honest sound hook
        {
          type: 'image',
          scene_uz: 'Ertalab gullab, kechqurun so‘ladigan mayin qizg‘aldoq gul tasavvur qiling.',
        },
        {
          type: 'root',
          explanation_uz: 'Yunoncha "ephemeros" (bir kunlik) so‘zidan kelib chiqqan.',
          related_words: ['ephemera'],
        },
      ],
      model_sentences: {
        present: 'Fashion trends are often ephemeral, changing every season.',
        past: 'Their joy was ephemeral, lasting only a few fleeting moments.',
        future: 'Online fame will likely be ephemeral for most internet creators.',
      },
      personal_prompt_uz: 'Hayotingizda qaysi quvonchli lahzalar o‘tkinchi bo‘lsa ham chuqur taassurot qoldirgan?',
    };

    const parsed = CardOutputSchema.safeParse(cardData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mnemonics[0]).toBeNull();
      expect(parsed.data.mnemonics[1]?.type).toBe('image');
    }
  });

  it('validates CheckSentenceOutput', () => {
    const checkData = {
      uses_word_correctly: true,
      grammar_ok: true,
      natural_score: 95,
      corrected: 'She showed great resilience during difficult exams.',
      feedback_uz: 'Ajoyib jumla! So‘zni o‘z o‘rnida va grammatik to‘g‘ri qo‘lladingiz.',
      follow_up_question: 'What helped you maintain your resilience the most?',
    };
    const parsed = CheckSentenceOutputSchema.safeParse(checkData);
    expect(parsed.success).toBe(true);
  });

  it('fails CheckSentenceOutput with invalid score range', () => {
    const checkData = {
      uses_word_correctly: true,
      grammar_ok: true,
      natural_score: 120, // out of bounds
      corrected: 'Test',
      feedback_uz: 'Yaxshi',
      follow_up_question: 'Why?',
    };
    const parsed = CheckSentenceOutputSchema.safeParse(checkData);
    expect(parsed.success).toBe(false);
  });

  it('validates CheckReplyOutput with used_target_word', () => {
    const replyData = {
      uses_word_correctly: true,
      grammar_ok: true,
      natural_score: 88,
      corrected: 'My family gave me resilience.',
      feedback_uz: 'Javobingiz samimiy va mazmunli.',
      follow_up_question: 'How do you support your family in return?',
      used_target_word: true,
    };
    const parsed = CheckReplyOutputSchema.safeParse(replyData);
    expect(parsed.success).toBe(true);
  });

  it('validates ReviewOutput for stage 1 choose with options', () => {
    const reviewData = {
      type: 'choose',
      prompt: 'He faced every setback with extraordinary resilience.',
      audio_text: 'He faced every setback with extraordinary resilience.',
      answer: 'bardoshlilik, matonat',
      accept_also: ['chidamlilik'],
      options: ['shijoat', 'bardoshlilik, matonat', 'ishonchsizlik', 'quvonch'],
    };
    const parsed = ReviewOutputSchema.safeParse(reviewData);
    expect(parsed.success).toBe(true);
  });

  it('validates ReviewOutput with new_mnemonic when lapses >= 2', () => {
    const reviewData = {
      type: 'gap_fill',
      prompt: 'True ___ means bouncing back from defeat.',
      audio_text: '',
      answer: 'resilience',
      accept_also: [],
      new_mnemonic: {
        type: 'sound',
        uz_hook: 'Rezina',
        scene_uz: 'Rezina koptok qattiq urilsa ham, darhol asl holiga qaytadi.',
      },
    };
    const parsed = ReviewOutputSchema.safeParse(reviewData);
    expect(parsed.success).toBe(true);
  });

  it('validates AiCoachErrorSchema', () => {
    const errorData = {
      error: 'missing_field',
      field: 'user_sentence',
      message: 'Foydalanuvchi jumlasi kiritilmagan.',
    };
    const parsed = AiCoachErrorSchema.safeParse(errorData);
    expect(parsed.success).toBe(true);
  });
});
