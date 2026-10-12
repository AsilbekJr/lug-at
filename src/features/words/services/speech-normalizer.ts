import { getGeminiApiKey } from './gemini-flash-service';
import { getGroqApiKey } from './groq-whisper-service';

/**
 * AI-powered Uzbek speech normalization.
 * Takes raw STT output (from Whisper or WebSpeech which may contain phonetic/dialect slips like "sobuq", "navo", "Te makmamı eve gideceğim")
 * and converts it into grammatically and semantically 100% correct Uzbek (or English).
 *
 * Primary engine: Groq Qwen (qwen/qwen3.8-27b) - Ultra-fast (~150ms), high quota, exceptional Turkic language understanding.
 * Fallback engine: Google Gemini 2.5 Flash.
 */

export async function normalizeSpeechWithAI(
  rawTranscript: string,
  lang: 'uz-UZ' | 'en-US' = 'uz-UZ'
): Promise<string> {
  const text = rawTranscript.trim();
  if (!text) return '';

  const groqKey = getGroqApiKey();
  const geminiKey = getGeminiApiKey();

  const uzbekSystemPrompt = `Siz professional o'zbek tili mutaxassisi va nutqni tahrirlovchi modelsiz.
Foydalanuvchi mikrofonga gapirganda STT vositasi uni xato eshitgan, fonetik xatolar qilgan yoki o'zbekcha nutqni turkcha so'zlarga aylantirib yuborgan bo'lishi mumkin.

Masalan:
- "Te makmamı eve gideceğim" -> "Maktabdan uyga ketaman"
- "eve gideceğim" -> "uyga ketaman"
- "havo judayam sobuq" -> "Havo judayam sovuq"
- "navo issiq" -> "Havo issiq"
- "navo juda isiq bo'votti" -> "Havo juda issiq bo'lyapti"
- "galdi" -> "keldi"
- "kitob oqiyoman" -> "Kitob o'qiyman"
- "mextabga borvomman" -> "Maktabga boryapman"
- "eshitiyomman" -> "eshityapman"
- "bir narsa yuvush kerak" -> "bir narsa yuvish kerak"

Vazifangiz: Berilgan xom matnni to'g'ri, adabiy o'zbek tiliga aylantiring.
Faqat yakuniy to'g'ri gapni qaytaring, hech qanday qo'shimcha so'z, izoh yoki qo'shtirnoqsiz.`;

  const englishSystemPrompt = `You are an expert English speech transcript editor.
Fix any minor STT phonetic slips or typos in the spoken English phrase: "${text}".
Return only the corrected English text without quotes, explanations or markdown.`;

  // 1. PRIMARY: GROQ QWEN (Fastest & No 429 quota exhaustion)
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
          max_tokens: 80,
          messages: [
            {
              role: 'system',
              content: lang === 'uz-UZ' ? uzbekSystemPrompt : englishSystemPrompt,
            },
            {
              role: 'user',
              content: text,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawResult = data?.choices?.[0]?.message?.content?.trim();
        if (rawResult) {
          const cleaned = rawResult.split('\n')[0].replace(/^["'«»]|["'«»]$/g, '').trim();
          if (cleaned) {
            return cleaned;
          }
        }
      }
    } catch (groqErr) {
      console.warn('Groq Qwen speech normalization failed, trying fallback:', groqErr);
    }
  }

  // 2. FALLBACK: GEMINI FLASH 2.5
  if (geminiKey) {
    try {
      const prompt = lang === 'uz-UZ'
        ? `${uzbekSystemPrompt}\n\nKiritilgan xom matn: "${text}"\nFaqat to'g'irlangan matnni yozing:`
        : `${englishSystemPrompt}\n\nInput: "${text}"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 80,
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawResult = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rawResult) {
          const cleaned = rawResult.split('\n')[0].replace(/^["'«»]|["'«»]$/g, '').trim();
          if (cleaned) {
            return cleaned;
          }
        }
      }
    } catch (geminiErr) {
      console.warn('Gemini speech normalization error:', geminiErr);
    }
  }

  // If no AI was reachable, return original text
  return text;
}
