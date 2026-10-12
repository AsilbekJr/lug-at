import * as React from 'react';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
}

export interface UseSpeechReturn {
  speak: (text: string, options?: SpeechOptions) => void;
  speakSlow: (text: string, options?: SpeechOptions) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useSpeech(): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const stop = React.useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = React.useCallback(
    (text: string, options?: SpeechOptions) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.lang || 'en-US';
      utterance.rate = options?.rate !== undefined ? options.rate : 0.9;
      utterance.pitch = options?.pitch ?? 1.0;

      // Select natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const englishVoice =
        voices.find((v) => v.lang === 'en-US' && v.name.includes('Natural')) ||
        voices.find((v) => v.lang === 'en-US') ||
        voices.find((v) => v.lang.startsWith('en'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
          console.warn('SpeechSynthesis error:', e.error);
        }
        setIsSpeaking(false);
      };

      // Slight timeout prevents Chrome from discarding utterance right after cancel()
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          setIsSpeaking(false);
        }
      }, 15);
    },
    []
  );

  const speakSlow = React.useCallback(
    (text: string, options?: SpeechOptions) => {
      speak(text, { ...options, rate: options?.rate ?? 0.65 });
    },
    [speak]
  );

  React.useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    speakSlow,
    stop,
    isSpeaking,
    isSupported,
  };
}
