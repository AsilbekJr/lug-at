/**
 * AI Translation and memory card enrichment client
 * Primary engine: Groq Qwen (qwen/qwen3.8-27b) - High quota, ultra-fast (~200ms)
 * Fallback engine: Google Gemini 2.5 Flash
 */

import { getGroqApiKey } from './groq-whisper-service';

const GEMINI_STORAGE_KEY = 'linguist_gemini_api_key';

export function getGeminiApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    import.meta.env.VITE_GEMINI_API_KEY ||
    localStorage.getItem(GEMINI_STORAGE_KEY) ||
    null
  );
}

export function setGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
  }
}

export interface GeminiTranslateOutput {
  englishText: string;
  uzbekText: string;
  itemType: 'word' | 'sentence';
  pos?: string;
  ipa?: string;
  exampleSentence?: string;
  exampleSentenceUz?: string;
  collocations?: string[];
}

export async function translateWithGeminiFlash(
  inputText: string,
  targetType?: 'word' | 'sentence'
): Promise<GeminiTranslateOutput | null> {
  const prompt = `
Siz professional ingliz-o'zbek lug'at va til o'qituvchisisiz.
Quyidagi matn kiritildi: "${inputText}".
1. Agar matn o'zbekcha bo'lsa, uni tabiiy, chiroyli ingliz tiliga tarjima qiling (englishText).
2. Agar matn allaqachon inglizcha bo'lsa, o'zbekcha aniq ma'nosini bering (uzbekText).
3. Agar bu so'z yoki ibora bo'lsa (itemType: "word"):
   - Shu so'z qatnashgan qisqa, tabiiy va tushunarli inglizcha namunaviy gap tuzing (exampleSentence). Misol: "She said hello to her teacher." yoki "We stayed indoors because of the rainy weather."
   - Ushbu gapning o'zbekcha tarjimasi (exampleSentenceUz).
   - Shu so'z bilan bog'liq 2-3 ta foydali birikma/collocation (collocations). Misol: ["say hello", "wave hello"].
   - So'z turkumi (pos: noun, verb, adjective, adverb va h.k.) va IPA transkripsiyasi (ipa).
4. Agar bu butun gap bo'lsa (itemType: "sentence"):
   - exampleSentence ga shu inglizcha gapning o'zini qo'ying.
   - exampleSentenceUz ga uning o'zbekcha tarjimasini qo'ying.
   - collocations ga gapdagi asosiy 1-2 ta iborani qo'ying.

Faqat va faqat quyidagi toza JSON formatida javob bering:
{
  "englishText": "Inglizcha tarjima yoki asl inglizcha matn",
  "uzbekText": "O'zbekcha ma'nosi yoki asl o'zbekcha matn",
  "itemType": "${targetType || 'word'}",
  "pos": "so'z turkumi",
  "ipa": "IPA transkripsiyasi",
  "exampleSentence": "Shu so'z qatnashgan inglizcha namuna gap",
  "exampleSentenceUz": "Namuna gapning o'zbekcha tarjimasi",
  "collocations": ["birikma 1", "birikma 2"]
}
`;

  // 1. PRIMARY: GROQ QWEN 27B (Ultra-fast, no quota limit errors)
  const groqKey = getGroqApiKey();
  if (groqKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawJson = data?.choices?.[0]?.message?.content;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          return {
            englishText: parsed.englishText?.trim() || inputText,
            uzbekText: parsed.uzbekText?.trim() || inputText,
            itemType: targetType || parsed.itemType || 'word',
            pos: parsed.pos,
            ipa: parsed.ipa,
            exampleSentence: parsed.exampleSentence?.trim(),
            exampleSentenceUz: parsed.exampleSentenceUz?.trim(),
            collocations: Array.isArray(parsed.collocations) ? parsed.collocations : undefined,
          };
        }
      }
    } catch (groqErr) {
      console.warn('Groq Qwen translation failed, trying Gemini:', groqErr);
    }
  }

  // 2. FALLBACK: GEMINI FLASH 2.5
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          return {
            englishText: parsed.englishText?.trim() || inputText,
            uzbekText: parsed.uzbekText?.trim() || inputText,
            itemType: targetType || parsed.itemType || 'word',
            pos: parsed.pos,
            ipa: parsed.ipa,
            exampleSentence: parsed.exampleSentence?.trim(),
            exampleSentenceUz: parsed.exampleSentenceUz?.trim(),
            collocations: Array.isArray(parsed.collocations) ? parsed.collocations : undefined,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API fetch error:', err);
    }
  }

  return null;
}
