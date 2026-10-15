import { SpeechAudioError } from './speech-audio';
export type SpeechLang = 'uz-UZ' | 'en-US';
export interface CapturedTranscript { text: string; audioWarning?: string }
export type CorrectionStatus = 'pending' | 'available' | 'unchanged' | 'unavailable';
export interface SpeechDraft {
  raw: string;
  suggestion: string | null;
  correctionStatus: CorrectionStatus;
  provider: 'whisper' | 'browser';
  lang: SpeechLang;
  audioWarning?: string;
}
export interface SpeechCaptureState {
  status: 'idle' | 'preparing' | 'listening' | 'transcribing' | 'review';
  draft: SpeechDraft | null;
  error: string | null;
}
export interface StreamLike { getTracks: () => { stop: () => void }[] }
export interface RecorderLike {
  state: string;
  mimeType: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onstop: (() => void) | null;
  ondataavailable: ((event: { data: Blob }) => void) | null;
  onerror: (() => void) | null;
}
export interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: { results: ArrayLike<{ isFinal?: boolean; [index: number]: { transcript: string } }> }) => void) | null;
}
export interface SpeechCaptureDependencies {
  canRecord: () => boolean;
  getUserMedia: () => Promise<StreamLike>;
  createRecorder: (stream: StreamLike) => RecorderLike;
  createRecognition: () => RecognitionLike | null;
  transcribe: (blob: Blob, lang: SpeechLang, signal: AbortSignal) => Promise<string | CapturedTranscript>;
  suggest: (raw: string, lang: SpeechLang, signal: AbortSignal) => Promise<{ suggestion: string | null; status: Exclude<CorrectionStatus, 'pending'> }>;
}
interface Session {
  abort: AbortController;
  lang: SpeechLang;
  recorder?: RecorderLike;
  stream?: StreamLike;
  recognition?: RecognitionLike;
  chunks: Blob[];
  finalText: string;
  stopped: boolean;
}

/** Each capture owns its resources; old callbacks cannot publish into a new session. */
export class SpeechCaptureController {
  private state: SpeechCaptureState = { status: 'idle', draft: null, error: null };
  private session: Session | null = null;
  private listeners = new Set<() => void>();
  constructor(private dependencies: SpeechCaptureDependencies, private onConfirm: (text: string) => void) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(state: SpeechCaptureState) { this.state = state; this.listeners.forEach(listener => listener()); }
  private current(session: Session) { return this.session === session && !session.abort.signal.aborted; }
  private releaseStream(session: Session) {
    session.stream?.getTracks().forEach(track => track.stop());
    session.stream = undefined;
  }
  cancel = () => {
    const session = this.session;
    this.session = null; // Invalidate before stop/abort can synchronously deliver callbacks.
    if (session) {
      session.abort.abort();
      if (session.recorder && session.recorder.state !== 'inactive') {
        try { session.recorder.stop(); } catch { /* already stopped */ }
      }
      this.releaseStream(session);
      try { session.recognition?.abort(); } catch { /* already ended */ }
      session.chunks = [];
    }
    this.publish({ status: 'idle', draft: null, error: null });
  };
  dispose = () => { this.listeners.clear(); this.cancel(); };
  confirm = (text: string) => {
    if (!this.state.draft || !text.trim()) return;
    this.cancel();
    this.onConfirm(text.trim());
  };
  private fail(session: Session, error: string) {
    if (!this.current(session)) return;
    this.cancel();
    this.publish({ status: 'idle', draft: null, error });
  }
  private async review(session: Session, raw: string, provider: SpeechDraft['provider'], audioWarning?: string) {
    if (!this.current(session)) return;
    const text = raw.trim();
    if (!text) { this.fail(session, 'Ovoz eshitilmadi. Qaytadan ayting yoki matnni yozing.'); return; }
    const draft: SpeechDraft = { raw: text, suggestion: null, correctionStatus: 'pending', provider, lang: session.lang, audioWarning };
    this.publish({ status: 'transcribing', draft, error: null });
    try {
      const result = await this.dependencies.suggest(text, session.lang, session.abort.signal);
      if (!this.current(session)) return;
      this.publish({ status: 'review', error: null, draft: { ...draft, suggestion: result.suggestion, correctionStatus: result.status } });
    } catch {
      if (this.current(session)) this.publish({ status: 'review', error: null, draft: { ...draft, correctionStatus: 'unavailable' } });
    }
  }
  start = async (lang: SpeechLang) => {
    this.cancel();
    const session: Session = { abort: new AbortController(), lang, chunks: [], finalText: '', stopped: false };
    this.session = session;
    this.publish({ status: 'preparing', draft: null, error: null });
    if (this.dependencies.canRecord()) {
      try {
        const stream = await this.dependencies.getUserMedia();
        if (!this.current(session)) { stream.getTracks().forEach(track => track.stop()); return; }
        session.stream = stream;
        const recorder = this.dependencies.createRecorder(stream);
        session.recorder = recorder;
        recorder.onstart = () => {
          if (this.current(session)) this.publish({ status: 'listening', draft: null, error: null });
        };
        recorder.ondataavailable = event => {
          if (this.current(session) && event.data.size) session.chunks.push(event.data);
        };
        recorder.onerror = () => this.fail(session, 'Ovoz yozilmadi. Qaytadan urinib ko‘ring.');
        recorder.onstop = () => {
          this.releaseStream(session);
          if (!this.current(session) || session.stopped) return;
          session.stopped = true;
          const blob = new Blob(session.chunks, { type: recorder.mimeType });
          session.chunks = [];
          if (!blob.size) { this.fail(session, 'Ovoz yozilmadi. Qaytadan ayting.'); return; }
          this.publish({ status: 'transcribing', draft: null, error: null });
          void this.dependencies.transcribe(blob, lang, session.abort.signal)
            .then(result => this.review(session, typeof result === 'string' ? result : result.text, 'whisper', typeof result === 'string' ? undefined : result.audioWarning))
            .catch(error => this.fail(session, error instanceof SpeechAudioError ? error.message : 'Nutqni aniqlab bo‘lmadi. Internet va Groq kalitini tekshiring, keyin qaytadan urinib ko‘ring.'));
        };
        recorder.start();
        return;
      } catch (error) {
        this.releaseStream(session);
        if (!this.current(session)) return;
        if (error instanceof Error && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
          this.fail(session, 'Mikrofon ruxsati berilmagan. Brauzerda mikrofonga ruxsat bering.'); return;
        }
      }
    }
    if (!this.current(session)) return;
    try {
      const recognition = this.dependencies.createRecognition();
      if (!recognition) { this.fail(session, 'Brauzeringiz ovozli kiritishni qo‘llab-quvvatlamaydi. Matnni yozing.'); return; }
      session.recognition = recognition;
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        if (this.current(session)) this.publish({ status: 'listening', draft: null, error: null });
      };
      recognition.onresult = event => {
        if (!this.current(session)) return;
        session.finalText = Array.from(event.results).filter(result => result.isFinal).map(result => result[0]?.transcript || '').join(' ').trim();
      };
      recognition.onend = () => {
        if (!this.current(session) || session.stopped) return;
        session.stopped = true;
        void this.review(session, session.finalText, 'browser');
      };
      recognition.onerror = event => this.fail(session, event.error === 'not-allowed'
        ? 'Mikrofon ruxsati berilmagan. Brauzerda mikrofonga ruxsat bering.'
        : 'Ovoz aniqlanmadi. Qaytadan ayting yoki matnni yozing.');
      recognition.start();
    } catch { this.fail(session, 'Mikrofon ishga tushmadi. Qaytadan urinib ko‘ring.'); }
  };
  stop = () => {
    const session = this.session;
    if (!session) return;
    if (this.state.status === 'preparing') { this.cancel(); return; }
    if (this.state.status !== 'listening') return;
    this.publish({ status: 'transcribing', draft: null, error: null });
    try {
      // stop emits the last audio chunk before onstop; no timer targets a later recorder.
      if (session.recorder?.state === 'recording') session.recorder.stop();
      else session.recognition?.stop();
    } catch { this.fail(session, 'Ovoz yozishni to‘xtatib bo‘lmadi. Qaytadan urinib ko‘ring.'); }
  };
}
