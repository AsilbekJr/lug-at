import * as React from 'react';
import { getGroqApiKey } from '../services/groq-whisper-service';
import { transcribeRecordedSpeech } from '../services/recorded-speech';
import { normalizeSpeechWithAI } from '../services/speech-normalizer';
import { SpeechCaptureController, type RecognitionLike, type RecorderLike, type SpeechLang } from '../services/speech-capture';
export type { SpeechLang } from '../services/speech-capture';

function browserRecognition() {
  if (typeof window === 'undefined') return null;
  const browser = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return browser.SpeechRecognition || browser.webkitSpeechRecognition || null;
}
function canRecord() {
  return typeof MediaRecorder !== 'undefined' && typeof navigator !== 'undefined'
    && typeof navigator.mediaDevices?.getUserMedia === 'function' && Boolean(getGroqApiKey());
}

export function useSpeechRecognition(options: { lang?: SpeechLang; onResult?: (text: string) => void } = {}) {
  const [lang, updateLang] = React.useState<SpeechLang>(options.lang || 'uz-UZ');
  const [isSupported, setIsSupported] = React.useState(false);
  const onResult = React.useRef(options.onResult);
  onResult.current = options.onResult;
  const [controller] = React.useState(() => new SpeechCaptureController({
    canRecord,
    getUserMedia: () => navigator.mediaDevices.getUserMedia({ audio: { channelCount: { ideal: 1 }, echoCancellation: true, noiseSuppression: true, autoGainControl: true } }),
    createRecorder: stream => {
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      return new MediaRecorder(stream as MediaStream, mimeType ? { mimeType } : undefined) as unknown as RecorderLike;
    },
    createRecognition: () => { const Constructor = browserRecognition(); return Constructor ? new Constructor() : null; },
    transcribe: transcribeRecordedSpeech,
    suggest: normalizeSpeechWithAI,
  }, text => onResult.current?.(text)));
  const state = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  React.useEffect(() => {
    setIsSupported((typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)) || Boolean(browserRecognition()));
    return () => controller.dispose();
  }, [controller]);
  const setLang = (value: SpeechLang) => { controller.cancel(); updateLang(value); };
  return {
    isSupported,
    isPreparing: state.status === 'preparing',
    isListening: state.status === 'listening',
    isTranscribing: state.status === 'transcribing',
    draft: state.draft,
    errorMessage: state.error,
    lang,
    setLang,
    toggleLang: () => setLang(lang === 'uz-UZ' ? 'en-US' : 'uz-UZ'),
    startListening: () => controller.start(lang),
    stopListening: controller.stop,
    cancelSpeech: controller.cancel,
    confirmTranscript: controller.confirm,
  };
}
