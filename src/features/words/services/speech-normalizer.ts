import { getGeminiApiKey } from './gemini-flash-service';

/**
 * AI-powered Uzbek speech normalization.
 * Takes raw STT output (from Whisper or WebSpeech which may contain phonetic/dialect slips like "sobuq", "navo", "galdi")
 * and converts it into grammatically and semantically 100% correct Uzbek (or English).
 *
 * Runs via Gemini 2.5 Flash in ~150-250ms.
 */

export async function normalizeSpeechWithAI(
  rawTranscript: string,
  lang: 'uz-UZ' | 'en-US' = 'uz-UZ'
): Promise<string> {
  const text = rawTranscript.trim();
  if (!text) return '';

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    // If no Gemini key, return original text
    return text;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = lang === 'uz-UZ'
    ? `
Siz o'zbek adabiy tili va nutqni tahrirlash bo'yicha eng kuchli AI mutaxassisisiz.
Foydalanuvchi mikrofonga o'zbek tilida gapirdi, ammo brauzer yoki STT vositasi uni xato eshitib, fonetik xatolar qilgan yoki turkcha so'zlarga aylantirib yuborgan bo'lishi mumkin (masalan, Chrome Web Speech ba'zan o'zbekcha nutqni turkcha "eve gideceğim", "Te makmamı" kabi eshitadi).

Masalan:
- "Te makmamı eve gideceğim" -> "Maktabdan uyga ketaman"
- "eve gideceğim" -> "uyga ketaman"
- "sobuq" -> "sovuq"
- "navo issiq" -> "havo issiq"
- "ketvotti" -> "ketyapti"
- "bo'p qopti" -> "bo'lib qolibdi"
- "galdi" -> "keldi"
- "eshitiyomman" -> "eshityapman"
- "bir narsa yuvush kerak" -> "bir narsa yuvish kerak"

Kiritilgan xom matn: "${text}"

Vazifangiz:
Foydalanuvchi aslida nima demoqchi bo'lganini kontekst bo'yicha tiklab, faqat va faqat to'g'ri o'zbek adabiy tilidagi matnni qaytaring.
Hech qanday izoh, tushuntirish, qo'shtirnoq yoki qo'shimcha so'z qo'shmang. Faqat to'g'irlangan sof matnni chiqaring.
`
    : `
You are an expert English speech transcript post-editor.
Fix any minor STT phonetic slips or typos in the following spoken English phrase: "${text}".
Return only the corrected English text without quotes, explanations or markdown.
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 60,
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      return text;
    }

    const data = await response.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (result && !result.includes('\n') && result.length < text.length * 2) {
      return result.replace(/^["']|["']$/g, '').trim();
    }
    return text;
  } catch (err) {
    console.warn('AI speech normalization error, using raw transcript:', err);
    return text;
  }
}
