import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { dataRepository } from '@/lib/supabase';
import { useAddWordStepperStore } from '@/features/words/store/useAddWordStepper';
import { useCurriculum } from '@/features/words/hooks/use-curriculum';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  Volume2,
  Plus,
  SlidersHorizontal,
  Mic,
  MicOff,
  Search,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { useSpeech } from '@/features/words/hooks/use-speech';
import { useSpeechRecognition } from '@/features/words/hooks/use-speech-recognition';
import { SpeechTranscriptReview } from '@/features/words/components/SpeechTranscriptReview';
import { CuratedVocabModal } from '@/features/words/components/curriculum/CuratedVocabModal';
import { getGroqApiKey, setGroqApiKey } from '@/features/words/services/groq-whisper-service';
import { useCreateWordMutation } from '@/features/words/api/words-api';
import { translateInput } from '@/features/words/services/translation-service';
import { ErrorAlert } from '@/components/feedback/error-alert';
import { DailyGoal } from '@/features/words/components/DailyGoal';
import { VoiceSettingsDialog } from '@/features/words/components/VoiceSettingsDialog';

export function TodayPage() {
  const navigate = useNavigate();
  const { openWithCuratedWord } = useAddWordStepperStore();
  const { speak } = useSpeech();
  const { curriculumDays, isWordLearned } = useCurriculum();

  // Quick Add Input + Voice State + Item Type Toggle
  const [quickWord, setQuickWord] = React.useState('');
  const quickInputRef = React.useRef<HTMLInputElement>(null);
  const [isCatalogOpen, setIsCatalogOpen] = React.useState(false);
  const [inputItemType, setInputItemType] = React.useState<'word' | 'sentence'>('word');

  // Groq Whisper API modal state
  const [isGroqModalOpen, setIsGroqModalOpen] = React.useState(false);
  const [groqKeyInput, setGroqKeyInput] = React.useState(() => getGroqApiKey() || '');
  const [hasGroqKey, setHasGroqKey] = React.useState(() => Boolean(getGroqApiKey()));

  const {
    isListening,
    isPreparing,
    isTranscribing,
    isSupported: isMicSupported,
    lang: micLang,
    toggleLang: toggleMicLang,
    startListening,
    stopListening,
    errorMessage: micError,
    draft: speechDraft,
    cancelSpeech,
    confirmTranscript,
  } = useSpeechRecognition({
    lang: 'uz-UZ',
    onResult: (spokenWord) => {
      setQuickWord(spokenWord);
      quickInputRef.current?.focus();
    },
  });

  const handleMicClick = () => {
    if (isListening || isPreparing) {
      stopListening();
    } else {
      if (!hasGroqKey) {
        setIsGroqModalOpen(true);
        return;
      }
      startListening();
    }
  };

  const createWordMutation = useCreateWordMutation();
  const [isSaving, setIsSaving] = React.useState(false);
  const savingRef = React.useRef(false);
  const [quickSaveError, setQuickSaveError] = React.useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = React.useState<{
    text: string;
    en: string;
    uz: string;
    type: 'word' | 'sentence';
  } | null>(null);
  const speechBusy = isListening || isPreparing || isTranscribing;

  const handleQuickAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = quickWord.trim();
    if (!query || savingRef.current || speechBusy || speechDraft) return;

    savingRef.current = true;
    setIsSaving(true);
    setQuickSaveError(null);
    setSaveFeedback(null);

    try {
      // 1. Auto-translate with Groq Qwen / Curated dictionary
      const translation = await translateInput(query, inputItemType);
      const effectiveType = inputItemType || translation.itemType || 'word';
      const targetEnglish = translation.englishText;
      const uzMeaning = translation.uzbekText;

      // 2. Direct save to database (Supabase + localStorage + FSRS Spaced Repetition queue)
      const cefrValue = translation.matchedCuratedWord?.cefr;
      const validCefr = (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).find((lvl) => lvl === cefrValue) || 'B1';
      const posValue = effectiveType === 'sentence'
        ? 'sentence'
        : (translation.pos || translation.matchedCuratedWord?.partOfSpeech || 'noun');

      const curatedMatch = translation.matchedCuratedWord;
      const modelSentences = translation.model_sentences;

      // Real contextual sentences from AI or curated dictionary
      const examplePresent = effectiveType === 'sentence'
        ? targetEnglish
        : (modelSentences?.present || translation.exampleSentence || curatedMatch?.example || `${targetEnglish} plays an important role in daily life.`);
      const examplePast = effectiveType === 'sentence'
        ? targetEnglish
        : (modelSentences?.past || `We noticed ${targetEnglish} in this context.`);
      const exampleFuture = effectiveType === 'sentence'
        ? targetEnglish
        : (modelSentences?.future || `You will see ${targetEnglish} in future communications.`);

      const chunksList = (translation.collocations && translation.collocations.length > 0)
        ? translation.collocations
        : ((curatedMatch?.collocations && curatedMatch.collocations.length > 0)
          ? curatedMatch.collocations
          : [`${targetEnglish} — ${uzMeaning}`]);
      const ipaValue = translation.ipa || curatedMatch?.phonetic || '';

      await createWordMutation.mutateAsync({
        word: targetEnglish,
        pos: posValue,
        ipa: ipaValue,
        uz_meaning: uzMeaning,
        item_type: effectiveType,
        cardContent: {
          word: targetEnglish,
          pos: posValue,
          ipa: ipaValue,
          uz_meaning: uzMeaning,
          item_type: effectiveType,
          chunks: chunksList,
          mnemonics: [
            {
              type: 'image',
              scene_uz: translation.exampleSentenceUz
                ? `Namuna: "${examplePresent}" — ${translation.exampleSentenceUz}`
                : `Eslab qolish: "${targetEnglish}" — ${uzMeaning}`,
            },
          ],
          model_sentences: {
            present: examplePresent,
            past: examplePast,
            future: exampleFuture,
          },
          personal_prompt_uz: `${targetEnglish} bilan bog‘liq vaziyatni tasvirlang`,
          cefr_level: validCefr,
        },
        recog_ok: false,
        listen_ok: false,
        write_ok: false,
        speak_ok: false,
      });

      setSaveFeedback({
        text: query,
        en: targetEnglish,
        uz: uzMeaning,
        type: effectiveType,
      });
      setQuickWord('');
    } catch (err) {
      setQuickSaveError(err instanceof Error ? err.message : 'So‘z saqlanmadi. Qaytadan urinib ko‘ring.');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // 1. Due items
  const dueQuery = useQuery({
    queryKey: queryKeys.review.dueCards(),
    queryFn: () => dataRepository.getDueUserWords(),
  });
  const dueWords = dueQuery.data;
  const dueCount = dueWords?.length ?? 0;
  const dueWordsCount = dueWords?.filter((w) => w.word.item_type !== 'sentence').length ?? 0;
  const dueSentencesCount = dueWords?.filter((w) => w.word.item_type === 'sentence').length ?? 0;

  // 2. All user words
  const wordsQuery = useQuery({
    queryKey: queryKeys.words.all,
    queryFn: () => dataRepository.getUserWords(),
  });
  const userWords = wordsQuery.data;

  // 3. New words quota (words vs sentences)
  const todayStartAt = new Date().setHours(0, 0, 0, 0);
  const itemsAddedToday = React.useMemo(() => {
    if (!userWords) return [];
    return userWords.filter((w) => new Date(w.userWord.created_at).getTime() >= todayStartAt);
  }, [userWords, todayStartAt]);

  const wordsAddedToday = itemsAddedToday.filter((w) => w.word.item_type !== 'sentence').length;
  const sentencesAddedToday = itemsAddedToday.filter((w) => w.word.item_type === 'sentence').length;

  // 4. Spotlight Word of the Day (pick an unlearned word from curriculum)
  const spotlightWord = React.useMemo(() => {
    for (const day of curriculumDays) {
      for (const w of day.words) {
        if (!isWordLearned(w.word)) {
          return { ...w, dayNumber: day.day, topicUz: day.topicUz };
        }
      }
    }
    return curriculumDays[0]?.words[0]
      ? { ...curriculumDays[0].words[0], dayNumber: 1, topicUz: 'Tanishuv' }
      : null;
  }, [curriculumDays, isWordLearned]);

  // Current date formatted in Uzbek
  const formattedDate = React.useMemo(() => {
    const d = new Date();
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    const days = [
      'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'
    ];
    return `${days[d.getDay()]}, ${d.getDate()}-${months[d.getMonth()]}`;
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 text-left">
      <div className="space-y-1">
        <p className="text-xs text-ink-muted">{formattedDate}</p>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-ink tracking-tight">
          Bugun
        </h1>
      </div>

      {dueQuery.isPending ? <p role="status" className="text-sm text-ink-muted py-3">Takrorlash navbati yuklanmoqda…</p>
        : dueQuery.isError ? <ErrorAlert title="Takrorlash navbati yuklanmadi" message="Internetni tekshirib, qayta urinib ko‘ring." onRetry={() => { void dueQuery.refetch(); }} />
        : dueCount > 0 ? <Card variant="subtle" className="p-4 sm:p-6 border-accent/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-accent">Xotirani yangilang</p>
              <h2 className="font-serif text-2xl font-semibold text-ink">{dueCount} ta mashq tayyor</h2>
              <p className="text-sm text-ink-muted">{[dueWordsCount ? `${dueWordsCount} ta so‘z` : '', dueSentencesCount ? `${dueSentencesCount} ta gap` : ''].filter(Boolean).join(' · ')}</p>
            </div>
            <Button variant="accent" onClick={() => navigate('/review')} className="min-h-11 shrink-0">
              <Layers className="size-4" /> Takrorlashni boshlash <ArrowRight className="size-4" />
            </Button>
          </div>
        </Card> : <p className="flex items-center gap-2 text-sm text-ink-muted"><CheckCircle2 className="size-4 shrink-0" />Takrorlash navbati hozircha bo‘sh.</p>}

      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <h2 className="font-serif font-semibold text-xl sm:text-2xl text-ink tracking-tight">
              {inputItemType === 'word' ? 'Yangi so‘z qo‘shish' : 'Yangi gap qo‘shish'}
            </h2>
            <p className="text-sm text-ink-muted mt-1">
              O‘zbekcha yoki inglizcha yozing yoki ayting.
            </p>
          </div>

          {/* TOGGLE: SO'Z / GAP SELECTOR & MOBILE-AWARE SETTINGS */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="inline-flex gap-2 p-0.5 rounded-[6px] bg-surface-subtle border border-border text-xs font-medium shrink-0">
              <button
                type="button"
                onClick={() => setInputItemType('word')}
                aria-pressed={inputItemType === 'word'}
                disabled={isSaving || speechBusy || Boolean(speechDraft)}
                className={`min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-1 rounded-[4px] text-xs transition-all ${
                  inputItemType === 'word'
                    ? 'bg-paper text-ink font-semibold shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                So‘z
              </button>
              <button
                type="button"
                onClick={() => setInputItemType('sentence')}
                aria-pressed={inputItemType === 'sentence'}
                disabled={isSaving || speechBusy || Boolean(speechDraft)}
                className={`min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-1 rounded-[4px] text-xs transition-all ${
                  inputItemType === 'sentence'
                    ? 'bg-paper text-ink font-semibold shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Gap
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Language indicator / switcher for microphone */}
              {isMicSupported && (
                <button
                  type="button"
                  onClick={toggleMicLang}
                  disabled={isSaving || speechBusy || Boolean(speechDraft)}
                  title="Mikrofon tili (bosib o‘zgartiring)"
                  aria-label={`Mikrofon tili: ${micLang === 'uz-UZ' ? 'O‘zbekcha' : 'Inglizcha'}. O‘zgartirish`}
                  className="min-h-[44px] px-2 py-1 rounded-[6px] border border-border bg-paper hover:border-accent text-xs font-mono text-ink transition-colors flex items-center gap-1"
                >
                  <span>{micLang === 'uz-UZ' ? 'O‘zbekcha' : 'Inglizcha'}</span>
                </button>
              )}

            </div>
          </div>

          {/* ELEMENT 1: TEZKOR INPUT + MIKROFON TUGMASI */}
          <form onSubmit={handleQuickAdd} className="space-y-2">
            <div className="relative grid grid-cols-1 gap-2 w-full sm:block">
              <div className="absolute left-3 top-4 sm:top-1/2 sm:-translate-y-1/2 text-ink-muted pointer-events-none">
                <Search className="w-4 h-4" strokeWidth={1.5} />
              </div>
              
              <input
                ref={quickInputRef}
                type="text"
                value={quickWord}
                disabled={isSaving}
                aria-label={inputItemType === 'word' ? 'Yangi so‘z' : 'Yangi gap'}
                onChange={(e) => { cancelSpeech(); setQuickWord(e.target.value); }}
                placeholder={
                  inputItemType === 'word'
                    ? 'Masalan, kitob yoki book'
                    : 'Masalan, Men har kuni kitob o‘qiyman'
                }
                className="w-full min-w-0 h-12 sm:h-14 pl-9 sm:pl-10 pr-3 sm:pr-44 rounded-[6px] bg-paper border border-border text-ink text-base placeholder:text-ink-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-2xs"
              />

              {/* Action buttons inside input right side */}
              <div className="flex items-center justify-end gap-2 sm:absolute sm:right-1.5 sm:top-1/2 sm:-translate-y-1/2">
                {/* Voice Input Button */}
                {isMicSupported && (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isSaving || isTranscribing || Boolean(speechDraft)}
                    aria-label={isListening || isPreparing ? 'Ovoz yozishni to‘xtatish' : 'Ovoz orqali kiritish'}
                    title={
                      isPreparing
                        ? 'Mikrofon faollashmoqda...'
                        : isListening
                        ? 'Tinglanmoqda... To‘xtatish uchun bosing'
                        : `Ovoz orqali aytish (${micLang === 'uz-UZ' ? 'O‘zbekcha' : 'English'})`
                    }
                    className={`h-11 w-11 rounded-[5px] flex items-center justify-center transition-all shrink-0 ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-400'
                        : isPreparing
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'text-ink-muted hover:text-accent hover:bg-surface-elevated'
                    }`}
                  >
                    {isListening || isPreparing ? (
                      <MicOff className="w-4 h-4" strokeWidth={1.8} />
                    ) : (
                      <Mic className="w-4 h-4" strokeWidth={1.8} />
                    )}
                  </button>
                )}

                {/* Submit / Learn Button */}
                <Button
                  type="submit"
                  variant={dueCount > 0 ? 'primary' : 'accent'}
                  size="sm"
                  disabled={!quickWord.trim() || isSaving || speechBusy || Boolean(speechDraft)}
                  className="h-11 flex-1 sm:flex-none px-3.5 text-sm font-semibold justify-center shrink-0 min-w-[90px]"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.8} />
                      <span>Qo‘shish</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {speechDraft && <SpeechTranscriptReview
              key={`${speechDraft.lang}:${speechDraft.raw}`}
              draft={speechDraft}
              onConfirm={confirmTranscript}
              onCancel={cancelSpeech}
              onRetry={startListening}
            />}
            {isTranscribing && !speechDraft && <Button size="sm" variant="ghost" onClick={cancelSpeech}>Bekor qilish</Button>}

            {/* Save Success Banner */}
            {quickSaveError && <ErrorAlert title="So‘z saqlanmadi" message={quickSaveError} onRetry={() => handleQuickAdd()} />}
            {saveFeedback && (
              <div className="flex items-center justify-between p-3 rounded-[6px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/30 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm transition-all animate-fade-in shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-ink">"{saveFeedback.en}"</span>
                    <span className="text-ink-muted text-xs">({saveFeedback.uz})</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-mono">
                      {saveFeedback.type === 'sentence' ? 'Gap' : 'So‘z'} saqlandi!
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/words')}
                className="min-h-11 min-w-11 inline-flex items-center text-accent hover:underline text-xs font-semibold shrink-0 ml-3"
                >
                  Lug‘atda ko‘rish →
                </button>
              </div>
            )}

            {/* Preparing indicator */}
            {isPreparing && (
              <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 animate-pulse px-1 pt-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Mikrofon tayyorlanmoqda…</span>
              </div>
            )}

            {/* Listening indicator */}
            {isListening && (
              <div className="flex items-center gap-2 text-xs font-mono text-rose-600 dark:text-rose-400 font-semibold px-1 pt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>
                  Ovoz yozilmoqda. Tugatgach mikrofonni yana bosing.
                </span>
              </div>
            )}

            {/* Transcribing indicator */}
            {isTranscribing && !speechDraft && (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 px-1 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-spin" />
                <span>Nutq aniqlanmoqda. Natijani tekshirib tasdiqlaysiz.</span>
              </div>
            )}

            {micError && (
              <div className="text-xs text-rose-600 dark:text-rose-400 px-1 pt-0.5">
                {micError}
              </div>
            )}
          </form>

          {/* ELEMENT 2: MAVZULAR TO‘PLAMI TUGMASI */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCatalogOpen(true)}
              disabled={isSaving || speechBusy || Boolean(speechDraft)}
              className="min-h-11 px-2 text-sm justify-start"
            >
              <BookOpen className="size-4" strokeWidth={1.5} />
              Mavzulardan tanlash
            </Button>
            <Button variant="ghost" size="sm" className="min-h-11 px-2 text-sm justify-start text-ink-muted"
              disabled={isSaving || speechBusy || Boolean(speechDraft)} onClick={() => setIsGroqModalOpen(true)}>
              <SlidersHorizontal className="size-4" /> Ovoz sozlamalari
            </Button>
          </div>
        </div>
      </Card>


      {wordsQuery.isPending ? <p role="status" className="text-sm text-ink-muted">Kunlik natija yuklanmoqda…</p>
        : wordsQuery.isError ? <ErrorAlert title="Kunlik natija yuklanmadi" message="Maqsadingizni ko‘rish uchun ma’lumotlarni qayta yuklang." onRetry={() => { void wordsQuery.refetch(); }} />
        : <DailyGoal wordsAdded={wordsAddedToday} sentencesAdded={sentencesAddedToday} />}

      {spotlightWord && <Card variant="subtle" className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-xs font-medium text-ink-muted">Kun tavsiyasi</h2>
          <Badge variant="outline" className="text-xs">{spotlightWord.cefr}</Badge>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif font-semibold text-2xl break-words text-ink">{spotlightWord.word}</h3>
            <p className="mt-1 text-sm break-words text-ink-muted">{spotlightWord.translation}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => speak(spotlightWord.word)} aria-label="Talaffuz qilish"><Volume2 className="size-4" /></Button>
            <Button variant="outline" onClick={() => openWithCuratedWord(spotlightWord)}>O‘rganish</Button>
          </div>
        </div>
      </Card>}

      {/* Mavzular to‘plami modal (A1-C1 Curated Vocab) */}
      <CuratedVocabModal
        open={isCatalogOpen}
        onOpenChange={setIsCatalogOpen}
      />


      <VoiceSettingsDialog
        open={isGroqModalOpen}
        onOpenChange={setIsGroqModalOpen}
        apiKey={groqKeyInput}
        onKeyChange={setGroqKeyInput}
        hasKey={hasGroqKey}
        onSave={() => {
          setGroqApiKey(groqKeyInput);
          setHasGroqKey(Boolean(groqKeyInput.trim()));
          setIsGroqModalOpen(false);
        }}
        onRemove={() => {
          setGroqApiKey('');
          setGroqKeyInput('');
          setHasGroqKey(false);
          setIsGroqModalOpen(false);
        }}
      />
    </div>
  );
}
