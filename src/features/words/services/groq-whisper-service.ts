import { withSpeechRequest } from './speech-request';

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
  signal?: AbortSignal;
}

export async function transcribeAudioWithGroq(
  options: TranscribeAudioOptions
): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY_MISSING');
  }

  const formData = new FormData();
  const extension = options.audioBlob.type.includes('mp4') ? 'mp4'
    : options.audioBlob.type.includes('ogg') ? 'ogg'
    : options.audioBlob.type.includes('wav') ? 'wav' : 'webm';
  formData.append('file', options.audioBlob, `audio.${extension}`);
  formData.append('model', 'whisper-large-v3');
  
  if (options.language) {
    formData.append('language', options.language);
  }

  // Vocabulary hints must come from relevant context, not unrelated sample sentences.
  if (options.prompt?.trim()) formData.append('prompt', options.prompt.trim());

  return withSpeechRequest(options.signal, 30000, async signal => {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
      signal,
    });

    if (!response.ok) throw new Error(`Groq Whisper xatoligi (${response.status})`);

    const data = await response.json();
    if (typeof data?.text !== 'string') throw new Error('INVALID_TRANSCRIPTION');
    return data.text.trim();
  });
}
