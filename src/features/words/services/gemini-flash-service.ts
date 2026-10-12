/**
 * Direct Gemini Flash 2.5 client for translation and memory card enrichment
 * Works seamlessly both with VITE_GEMINI_API_KEY from .env or localStorage.
 */

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
}

export async function translateWithGeminiFlash(
  inputText: string,
  targetType?: 'word' | 'sentence'
): Promise<GeminiTranslateOutput | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
Siz professional ingliz-o'zbek lug'at va til o'qituvchisisiz.
Quyidagi matn kiritildi: "${inputText}".
Agar matn o'zbekcha bo'lsa, uni tabiiy, chiroyli ingliz tiliga tarjima qiling.
Agar matn allaqachon inglizcha bo'lsa, o'zbekcha aniq tarjimasini bering.
Agar bu so'z bo'lsa, itemType: "word" qiling. Agar butun gap bo'lsa, itemType: "sentence" qiling.

Faqat va faqat quyidagi toza JSON formatida javob bering, hech qanday markdown yoki qo'shimcha so'z qo'shmang:
{
  "englishText": "Inglizcha tarjima yoki asl inglizcha matn",
  "uzbekText": "O'zbekcha ma'nosi yoki asl o'zbekcha matn",
  "itemType": "${targetType || 'word'}",
  "pos": "so'z turkumi (noun, verb, adjective va h.k.)",
  "ipa": "inglizcha IPA transkripsiyasi (agar so'z bo'lsa)"
}
`;

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

    if (!response.ok) {
      console.warn('Gemini API call returned non-200:', response.status);
      return null;
    }

    const data = await response.json();
    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) return null;

    const parsed = JSON.parse(rawJson);
    return {
      englishText: parsed.englishText?.trim() || inputText,
      uzbekText: parsed.uzbekText?.trim() || inputText,
      itemType: targetType || parsed.itemType || 'word',
      pos: parsed.pos,
      ipa: parsed.ipa,
    };
  } catch (err) {
    console.warn('Gemini API fetch error:', err);
    return null;
  }
}
