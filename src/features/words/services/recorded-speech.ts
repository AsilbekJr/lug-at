import { prepareRecordedAudio } from './speech-audio-browser';
import { transcribeAudioWithGroq } from './groq-whisper-service';
import type { CapturedTranscript, SpeechLang } from './speech-capture';

export async function transcribeRecordedSpeech(blob: Blob, lang: SpeechLang, signal: AbortSignal): Promise<CapturedTranscript> {
  const prepared = await prepareRecordedAudio(blob, signal);
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  const text = await transcribeAudioWithGroq({ audioBlob: prepared.blob, language: lang === 'uz-UZ' ? 'uz' : 'en', signal });
  return { text, audioWarning: prepared.warning };
}
