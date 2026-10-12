/**
 * Client for Groq Whisper Cloud API (whisper-large-v3)
 * Groq offers free tier API keys with ultra-fast Whisper speech-to-text inference (< 300ms).
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_STORAGE_KEY = 'linguist_groq_api_key';

export function getGroqApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    import.meta.env.VITE_GROQ_API_KEY ||
    localStorage.getItem(GROQ_STORAGE_KEY) ||
    null
  );
}

export function setGroqApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(GROQ_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(GROQ_STORAGE_KEY);
  }
}

export interface TranscribeAudioOptions {
  audioBlob: Blob;
  language?: 'uz' | 'en';
  prompt?: string;
}

export async function transcribeAudioWithGroq(
  options: TranscribeAudioOptions
): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY_MISSING');
  }

  const formData = new FormData();
  formData.append('file', options.audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  
  if (options.language) {
    formData.append('language', options.language);
  }

  // Provide initial vocabulary prompt to hint Uzbek names and terms
  const prompt =
    options.prompt ||
    'O‘zbek adabiy tili (lotin alifbosi): Maktabdan uyga ketaman. Havo judayam sovuq. Kitob o‘qiyapman. Uyga boraman. Dars qilaman. Bugun ob-havo yaxshi. Salom, rahmat. Ingliz tilini o‘rganmoqdaman.';
  formData.append('prompt', prompt);

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Groq Whisper xatoligi (${response.status}): ${errorData}`);
  }

  const data = await response.json();
  return (data.text || '').trim();
}
