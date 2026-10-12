// Follow Deno runtime conventions for Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichRequest {
  word: string;
  sourceContext?: string;
  targetCefr?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify User Authentication via Supabase JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Foydalanuvchi autentifikatsiyadan o'tmagan." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Foydalanuvchi sessiyasi yaroqsiz." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { word, sourceContext } = (await req.json()) as EnrichRequest;
    if (!word || typeof word !== 'string') {
      return new Response(
        JSON.stringify({ error: "So'z kiritilishi shart." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Access LLM API key strictly from Supabase Secret
    const apiKey = Deno.env.get('LLM_API_KEY');
    if (!apiKey) {
      // Graceful fallback for local development or unconfigured keys
      return new Response(
        JSON.stringify({
          error: "LLM_API_KEY Supabase sozlamalarida topilmadi. Iltimos, Supabase Secrets bo'limiga kalitni kiriting.",
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a professional lexicographer and editorial English tutor.
Analyze the word: "${word.trim()}"
${sourceContext ? `In the context of: "${sourceContext}"` : ''}

Return ONLY a valid JSON object with the following schema:
{
  "word": "${word.trim()}",
  "phonetic": "/.../",
  "part_of_speech": "noun | verb | adjective | adverb | idiom | preposition",
  "definition": "Precise, elegant, editorial definition in English",
  "definition_uz": "Exact Uzbek definition/translation with nuanced explanation",
  "context_sentence": "An evocative, natural, literary/editorial sample sentence demonstrating the word in genuine usage.",
  "context_sentence_uz": "Natural, accurate Uzbek translation of that sample sentence.",
  "cefr_level": "A1 | A2 | B1 | B2 | C1 | C2",
  "collocations": ["string", "string", "string"]
}`;

    // Call LLM provider (e.g. Gemini API or OpenAI API) using the secret key
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `LLM xatoligi: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedData = JSON.parse(candidateText);

    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Noma'lum xatolik yuz berdi",
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
