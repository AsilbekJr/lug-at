import * as React from 'react';
import { cleanSpokenTranscript } from '@/features/words/services/phonetic-corrections';
import { transcribeAudioWithGroq, getGroqApiKey } from '@/features/words/services/groq-whisper-service';
import { normalizeSpeechWithAI } from '@/features/words/services/speech-normalizer';

export type SpeechLang = 'en-US' | 'uz-UZ';

// Web Speech API interface definitions
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal?: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
}

export interface UseSpeechRecognitionOptions {
  lang?: SpeechLang;
  onResult?: (transcript: string) => void;
  onError?: (errorMessage: string) => void;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  isPreparing: boolean;
  isTranscribing: boolean;
  transcript: string;
  errorMessage: string | null;
  lang: SpeechLang;
  setLang: (lang: SpeechLang) => void;
  toggleLang: () => void;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang: initialLang = 'uz-UZ', onResult, onError } = options;

  const [lang, setLang] = React.useState<SpeechLang>(initialLang);
  const [isListening, setIsListening] = React.useState(false);
  const [isPreparing, setIsPreparing] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSupported, setIsSupported] = React.useState(false);

  const onResultRef = React.useRef(onResult);
  onResultRef.current = onResult;

  const onErrorRef = React.useRef(onError);
  onErrorRef.current = onError;

  // MediaRecorder refs for Groq Whisper recording
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Web Speech API fallback ref
  const recognitionRef = React.useRef<SpeechRecognitionInstance | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasMediaDevices = Boolean(navigator?.mediaDevices?.getUserMedia);
    const SpeechRecognitionConstructor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    setIsSupported(hasMediaDevices || Boolean(SpeechRecognitionConstructor));
  }, []);

  const toggleLang = React.useCallback(() => {
    setLang((prev) => (prev === 'uz-UZ' ? 'en-US' : 'uz-UZ'));
  }, []);

  // Web Speech Fallback creator
  const createWebSpeech = React.useCallback((): SpeechRecognitionInstance | null => {
    if (typeof window === 'undefined') return null;

    const SpeechRecognitionConstructor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) return null;

    try {
      const instance = new SpeechRecognitionConstructor();
      instance.continuous = true;
      instance.interimResults = true;
      instance.maxAlternatives = 1;
      instance.lang = lang;

      instance.onstart = () => {
        setIsPreparing(false);
        setIsListening(true);
        setErrorMessage(null);
      };

      instance.onend = () => {
        setIsListening(false);
        setIsPreparing(false);
      };

      instance.onerror = (e) => {
        setIsListening(false);
        setIsPreparing(false);
        let userFriendlyError = 'Ovozni aniqlashda xatolik yuz berdi.';
        if (e.error === 'not-allowed') {
          userFriendlyError = 'Mikrofon ruxsati berilmagan. Brauzerda mikrofonga ruxsat bering.';
        } else if (e.error === 'no-speech') {
          userFriendlyError = 'Ovoz eshitilmadi. Iltimos, qaytadan urinib ko‘ring.';
        }
        setErrorMessage(userFriendlyError);
        onErrorRef.current?.(userFriendlyError);
      };

      instance.onresult = async (e: SpeechRecognitionEventLike) => {
        let fullAccumulated = '';
        for (let i = 0; i < e.results.length; ++i) {
          const chunk = e.results[i]?.[0]?.transcript || '';
          fullAccumulated += (fullAccumulated ? ' ' : '') + chunk;
        }

        const raw = fullAccumulated.trim();
        if (raw) {
          const cleaned = cleanSpokenTranscript(raw);
          setTranscript(cleaned);
          onResultRef.current?.(cleaned);

          // If speech is final, pass through Gemini to immediately fix any Turkish/phonetic errors
          const lastItem = e.results[e.results.length - 1];
          if (lastItem?.isFinal) {
            setIsTranscribing(true);
            try {
              const perfected = await normalizeSpeechWithAI(cleaned, lang);
              setTranscript(perfected);
              onResultRef.current?.(perfected);
            } finally {
              setIsTranscribing(false);
            }
          }
        }
      };

      return instance;
    } catch {
      return null;
    }
  }, [lang]);

  const startListening = React.useCallback(async () => {
    setErrorMessage(null);
    setTranscript('');
    setIsPreparing(true);

    const groqKey = getGroqApiKey();

    // MODE 1: GROQ WHISPER (Highest accuracy, zero word drops)
    if (groqKey && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        audioChunksRef.current = [];

        // Pick best supported mimeType
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstart = () => {
          setIsPreparing(false);
          setIsListening(true);
        };

        recorder.onstop = async () => {
          setIsListening(false);
          setIsPreparing(false);
          setIsTranscribing(true);

          // Stop all stream tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          if (audioBlob.size > 100) {
            try {
              const whisperResult = await transcribeAudioWithGroq({
                audioBlob,
                language: lang === 'uz-UZ' ? 'uz' : 'en',
              });

              if (whisperResult) {
                const cleaned = cleanSpokenTranscript(whisperResult);
                // AI-powered post-correction for 100% dialect and phonetic accuracy
                const finalPerfectText = await normalizeSpeechWithAI(cleaned, lang);
                setTranscript(finalPerfectText);
                onResultRef.current?.(finalPerfectText);
              }
            } catch (err) {
              console.warn('Groq Whisper transcribe failed, fallback to error message:', err);
              const errStr = (err as Error).message || 'Groq transkripsiyasida xatolik';
              setErrorMessage(errStr);
              onErrorRef.current?.(errStr);
            }
          }
          setIsTranscribing(false);
        };

        recorder.start(100); // collect chunks every 100ms for zero dropped words
        return;
      } catch (err) {
        setIsPreparing(false);
        console.warn('Failed to start MediaRecorder for Groq:', err);
        // Fall back to Web Speech
      }
    }

    // MODE 2: WEB SPEECH API (Fallback)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    const instance = createWebSpeech();
    if (!instance) {
      const errText = 'Brauzeringiz ovozli kiritishni qo‘llab-quvvatlamaydi.';
      setErrorMessage(errText);
      onErrorRef.current?.(errText);
      return;
    }

    recognitionRef.current = instance;
    try {
      instance.start();
    } catch {
      try {
        instance.stop();
        setTimeout(() => instance.start(), 150);
      } catch {
        // ignore
      }
    }
  }, [createWebSpeech, lang]);

  const stopListening = React.useCallback(() => {
    setIsListening(false);
    setIsPreparing(false);

    // Stop MediaRecorder if running, with 350ms cushion to capture trailing syllables
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.requestData();
      } catch {
        // ignore
      }
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          try {
            mediaRecorderRef.current.stop();
          } catch {
            // ignore
          }
        }
      }, 350);
      return;
    }

    // Stop Web Speech if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const resetTranscript = React.useCallback(() => {
    setTranscript('');
    setErrorMessage(null);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    isPreparing,
    isTranscribing,
    transcript,
    errorMessage,
    lang,
    setLang,
    toggleLang,
    startListening,
    stopListening,
    resetTranscript,
  };
}
