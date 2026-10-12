// Supabase Edge Function: ai-coach
// Handles CARD, CHECK_SENTENCE, CHECK_REPLY, REVIEW modes with JWT auth,
// rate limiting, forced JSON LLM output, Zod validation, retry, and CARD caching.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { z } from 'https://esm.sh/zod@3.22.4';
import { SYSTEM_PROMPT } from './prompt.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiter: Map<userId, number[]> (sliding window: 30 requests / 60 seconds)
const userRequestTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = userRequestTimestamps.get(userId) || [];
  const validTimestamps = timestamps.filter((t) => t > windowStart);

  if (validTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    userRequestTimestamps.set(userId, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  userRequestTimestamps.set(userId, validTimestamps);
  return true;
}

// Schemas
const SoundMnemonicSchema = z.object({
  type: z.literal('sound'),
  uz_hook: z.string().nullable().optional(),
  scene_uz: z.string(),
});

const ImageMnemonicSchema = z.object({
  type: z.literal('image'),
  scene_uz: z.string(),
});

const RootMnemonicSchema = z.object({
  type: z.literal('root'),
  explanation_uz: z.string(),
  related_words: z.array(z.string()),
});

const MnemonicItemSchema = z.union([
  SoundMnemonicSchema,
  ImageMnemonicSchema,
  RootMnemonicSchema,
]);

const CardOutputSchema = z.object({
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
});

const CheckSentenceOutputSchema = z.object({
  uses_word_correctly: z.boolean(),
  grammar_ok: z.boolean(),
  natural_score: z.number().min(0).max(100),
  corrected: z.string(),
  feedback_uz: z.string(),
  follow_up_question: z.string(),
});

const CheckReplyOutputSchema = CheckSentenceOutputSchema.extend({
  used_target_word: z.boolean(),
});

const ReviewOutputSchema = z.object({
  type: z.enum(['choose', 'dictation', 'uz_to_en', 'gap_fill', 'conversation']),
  prompt: z.string(),
  audio_text: z.string().optional().default(''),
  answer: z.string(),
  accept_also: z.array(z.string()).default([]),
  options: z.array(z.string()).optional(),
  new_mnemonic: MnemonicItemSchema.nullable().optional(),
});

async function callGemini(promptText: string, retryPrompt?: string): Promise<string> {
  const apiKey = Deno.env.get('LLM_API_KEY') || Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('LLM_API_KEY is not configured in Supabase secrets.');
  }

  const model = Deno.env.get('LLM_MODEL') || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: promptText }],
    },
  ];

  if (retryPrompt) {
    contents.push({
      role: 'user',
      parts: [{ text: retryPrompt }],
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
      contents,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM provider error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from LLM');
  }

  return text;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // 1. JWT verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Avtorizatsiya talab qilinadi' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: "Noto'g'ri yoki eskirgan sessiya" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Rate limit per user
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({
          error: 'rate_limited',
          message: "Juda ko'p so'rov yuborildi. Iltimos, bir oz kuting.",
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse input
    const body = await req.json();
    const { mode, word, learner_level = 'B1', known_words = [], interests = [] } = body;

    if (!mode) {
      return new Response(
        JSON.stringify({ error: 'missing_field', field: 'mode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!word) {
      return new Response(
        JSON.stringify({ error: 'missing_field', field: 'word' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Mode-specific handling & CARD caching
    if (mode === 'CARD') {
      const normalizedWord = String(word).trim().toLowerCase();

      // Check cache in words & word_cards
      const { data: existingWord } = await serviceClient
        .from('words')
        .select('id')
        .ilike('word', normalizedWord)
        .maybeSingle();

      if (existingWord) {
        const { data: cachedCard } = await serviceClient
          .from('word_cards')
          .select('content')
          .eq('word_id', existingWord.id)
          .maybeSingle();

        if (cachedCard && cachedCard.content) {
          return new Response(JSON.stringify(cachedCard.content), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
          });
        }
      }

      // Generate via LLM
      const prompt = JSON.stringify({
        mode: 'CARD',
        word,
        learner_level,
        known_words,
        interests,
      });

      let rawJson = await callGemini(prompt);
      let parsed = CardOutputSchema.safeParse(JSON.parse(rawJson));

      // Retry once if invalid
      if (!parsed.success) {
        const retryPrompt = `Previous response had schema validation errors: ${JSON.stringify(
          parsed.error.errors
        )}. Fix and return ONLY valid JSON matching MODE: CARD exactly.`;
        rawJson = await callGemini(prompt, retryPrompt);
        parsed = CardOutputSchema.safeParse(JSON.parse(rawJson));
      }

      if (!parsed.success) {
        throw new Error('LLM output failed schema validation after retry');
      }

      const cardResult = parsed.data;

      // Cache into words and word_cards
      let wordId = existingWord?.id;
      if (!wordId) {
        const { data: newWord } = await serviceClient
          .from('words')
          .insert({
            word: cardResult.word,
            pos: cardResult.pos,
            ipa: cardResult.ipa,
            uz_meaning: cardResult.uz_meaning,
            created_by: user.id,
          })
          .select('id')
          .single();
        wordId = newWord?.id;
      }

      if (wordId) {
        await serviceClient.from('word_cards').upsert({
          word_id: wordId,
          content: cardResult,
        });
      }

      return new Response(JSON.stringify(cardResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
      });
    }

    if (mode === 'CHECK_SENTENCE') {
      const { user_sentence } = body;
      if (!user_sentence) {
        return new Response(
          JSON.stringify({ error: 'missing_field', field: 'user_sentence' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const prompt = JSON.stringify({
        mode: 'CHECK_SENTENCE',
        word,
        learner_level,
        known_words,
        interests,
        user_sentence,
      });

      let rawJson = await callGemini(prompt);
      let parsed = CheckSentenceOutputSchema.safeParse(JSON.parse(rawJson));

      if (!parsed.success) {
        const retryPrompt = `Fix schema errors: ${JSON.stringify(
          parsed.error.errors
        )}. Return ONLY valid JSON matching MODE: CHECK_SENTENCE.`;
        rawJson = await callGemini(prompt, retryPrompt);
        parsed = CheckSentenceOutputSchema.safeParse(JSON.parse(rawJson));
      }

      if (!parsed.success) {
        throw new Error('LLM output failed schema validation after retry');
      }

      return new Response(JSON.stringify(parsed.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'CHECK_REPLY') {
      const { question, user_reply } = body;
      if (!question) {
        return new Response(
          JSON.stringify({ error: 'missing_field', field: 'question' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!user_reply) {
        return new Response(
          JSON.stringify({ error: 'missing_field', field: 'user_reply' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const prompt = JSON.stringify({
        mode: 'CHECK_REPLY',
        word,
        learner_level,
        known_words,
        interests,
        question,
        user_reply,
      });

      let rawJson = await callGemini(prompt);
      let parsed = CheckReplyOutputSchema.safeParse(JSON.parse(rawJson));

      if (!parsed.success) {
        const retryPrompt = `Fix schema errors: ${JSON.stringify(
          parsed.error.errors
        )}. Return ONLY valid JSON matching MODE: CHECK_REPLY.`;
        rawJson = await callGemini(prompt, retryPrompt);
        parsed = CheckReplyOutputSchema.safeParse(JSON.parse(rawJson));
      }

      if (!parsed.success) {
        throw new Error('LLM output failed schema validation after retry');
      }

      return new Response(JSON.stringify(parsed.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'REVIEW') {
      const { stage = 1, lapses = 0, previous_sentences = [] } = body;

      const prompt = JSON.stringify({
        mode: 'REVIEW',
        word,
        learner_level,
        known_words,
        interests,
        stage,
        lapses,
        previous_sentences,
      });

      let rawJson = await callGemini(prompt);
      let parsed = ReviewOutputSchema.safeParse(JSON.parse(rawJson));

      if (!parsed.success) {
        const retryPrompt = `Fix schema errors: ${JSON.stringify(
          parsed.error.errors
        )}. Return ONLY valid JSON matching MODE: REVIEW.`;
        rawJson = await callGemini(prompt, retryPrompt);
        parsed = ReviewOutputSchema.safeParse(JSON.parse(rawJson));
      }

      if (!parsed.success) {
        throw new Error('LLM output failed schema validation after retry');
      }

      return new Response(JSON.stringify(parsed.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'invalid_mode', message: `Noma'lum rejim: ${mode}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(
      JSON.stringify({ error: 'internal_error', message: error.message || 'Ichki server xatoligi' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
