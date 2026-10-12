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
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  Volume2,
  Plus,
  SlidersHorizontal,
  Mic,
  MicOff,
  Search,
  BookOpen,
  KeyRound,
} from 'lucide-react';
import { useSpeech } from '@/features/words/hooks/use-speech';
import { useSpeechRecognition } from '@/features/words/hooks/use-speech-recognition';
import { CuratedVocabModal } from '@/features/words/components/curriculum/CuratedVocabModal';
import { getGroqApiKey, setGroqApiKey } from '@/features/words/services/groq-whisper-service';

export function TodayPage() {
  const navigate = useNavigate();
  const { startFlowWithWord, openStepper, openWithCuratedWord } = useAddWordStepperStore();
  const { speak } = useSpeech();
  const { curriculumDays, isWordLearned } = useCurriculum();

  // Quick Add Input + Voice State + Item Type Toggle
  const [quickWord, setQuickWord] = React.useState('');
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
  } = useSpeechRecognition({
    lang: 'uz-UZ',
    onResult: (spokenWord) => {
      setQuickWord(spokenWord);
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

  const handleQuickAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (quickWord.trim()) {
      if (isListening) stopListening();
      await startFlowWithWord(quickWord.trim(), undefined, inputItemType);
      setQuickWord('');
    }
  };

  // 1. Due items
  const { data: dueWords } = useQuery({
    queryKey: queryKeys.review.dueCards(),
    queryFn: () => dataRepository.getDueUserWords(),
  });
  const dueCount = dueWords?.length ?? 0;
  const dueWordsCount = dueWords?.filter((w) => w.word.item_type !== 'sentence').length ?? 0;
  const dueSentencesCount = dueWords?.filter((w) => w.word.item_type === 'sentence').length ?? 0;

  // 2. All user words
  const { data: userWords } = useQuery({
    queryKey: queryKeys.words.all,
    queryFn: () => dataRepository.getUserWords(),
  });
  const totalUserWords = userWords?.length ?? 0;

  // 3. New words quota (words vs sentences)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const itemsAddedToday = React.useMemo(() => {
    if (!userWords) return [];
    return userWords.filter((w) => new Date(w.userWord.created_at) >= todayStart);
  }, [userWords, todayStart]);

  const wordsAddedToday = itemsAddedToday.filter((w) => w.word.item_type !== 'sentence').length;
  const sentencesAddedToday = itemsAddedToday.filter((w) => w.word.item_type === 'sentence').length;
  const totalAddedToday = itemsAddedToday.length;

  // 3. New words quota (minimum 8, customizable by user, persisted to localStorage)
  const [dailyQuota, setDailyQuotaState] = React.useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('linguist_daily_quota');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 8) return parsed;
      }
    }
    return 8; // Standart minimum 8 tadan boshlanadi
  });

  // Calculate target breakdown: ~80% words, ~20% sentences (at least 2 sentences if quota >= 8)
  const targetSentencesQuota = Math.max(2, Math.round(dailyQuota * 0.2));
  const targetWordsQuota = dailyQuota - targetSentencesQuota;

  const [isEditingQuota, setIsEditingQuota] = React.useState(false);
  const [customQuotaInput, setCustomQuotaInput] = React.useState('');

  const handleUpdateQuota = (newQuota: number) => {
    const clamped = Math.max(8, newQuota);
    setDailyQuotaState(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem('linguist_daily_quota', String(clamped));
    }
    setIsEditingQuota(false);
  };

  const quotaProgress = Math.min(100, Math.round((totalAddedToday / dailyQuota) * 100));

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
      {/* Editorial Greeting Header */}
      <div className="pb-5 border-b border-border space-y-1">
        <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
          <span>{formattedDate}</span>
          <span className="flex items-center gap-1 text-accent">
            <Flame className="w-3.5 h-3.5" strokeWidth={1.5} />
            Faol o‘quvchi
          </span>
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-ink tracking-tight">
          Bugungi mashg‘ulot
        </h1>
        <p className="font-sans text-sm text-ink-muted leading-relaxed max-w-[55ch]">
          Xotirani yangilash va yangi so‘zlar bilan lug‘at boyligini mustahkamlash markazi.
        </p>
      </div>

      {/* BOSQICH 1: TEZKOR LUG‘AT VA GAP KIRITISH (STAGE 1) */}
      <Card variant="editorial" className="p-5 sm:p-7 relative overflow-hidden border-accent/30 shadow-xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              1-bosqich · Tezkor kiritish
            </span>
            <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
              <span>{wordsAddedToday}/{targetWordsQuota} so‘z</span>
              <span>·</span>
              <span>{sentencesAddedToday}/{targetSentencesQuota} gap</span>
            </div>
          </div>

          <div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-ink tracking-tight">
              Yangi so‘z yoki gapni kiritish
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed mt-1">
              O‘zbekcha yoki inglizcha yozing/ayting — tizim avtomatik tarjima qilib saqlaydi.
            </p>
          </div>

          {/* TOGGLE: SO'Z / GAP SELECTOR */}
          <div className="flex items-center gap-2 pt-1">
            <div className="inline-flex p-0.5 rounded-[6px] bg-surface-subtle border border-border text-xs font-medium">
              <button
                type="button"
                onClick={() => setInputItemType('word')}
                className={`px-3 py-1 rounded-[4px] transition-all ${
                  inputItemType === 'word'
                    ? 'bg-paper text-ink font-semibold shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                So‘z (Word)
              </button>
              <button
                type="button"
                onClick={() => setInputItemType('sentence')}
                className={`px-3 py-1 rounded-[4px] transition-all ${
                  inputItemType === 'sentence'
                    ? 'bg-paper text-ink font-semibold shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Gap (Sentence)
              </button>
            </div>

            {/* Language indicator / switcher for microphone */}
            {isMicSupported && (
              <button
                type="button"
                onClick={toggleMicLang}
                title="Mikrofon tili (bosib o‘zgartiring)"
                className="px-2.5 py-1 rounded-[6px] border border-border bg-paper hover:border-accent text-xs font-mono text-ink transition-colors flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>Ovoz: {micLang === 'uz-UZ' ? '🇺🇿 O‘zbekcha' : '🇬🇧 English'}</span>
              </button>
            )}

            {/* Groq Whisper AI button */}
            <button
              type="button"
              onClick={() => setIsGroqModalOpen(true)}
              title="Groq Whisper sozlamalari (100% bepul va aniq)"
              className={`px-2.5 py-1 rounded-[6px] border text-xs font-mono transition-colors flex items-center gap-1 ml-auto ${
                hasGroqKey
                  ? 'border-emerald-600/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300'
                  : 'border-border bg-paper text-ink-muted hover:text-ink hover:border-accent'
              }`}
            >
              <KeyRound className="w-3 h-3 text-accent" strokeWidth={1.5} />
              <span>{hasGroqKey ? '⚡ Groq Whisper (Faol)' : 'Groq Whisper STT'}</span>
            </button>
          </div>

          {/* ELEMENT 1: TEZKOR INPUT + MIKROFON TUGMASI */}
          <form onSubmit={handleQuickAdd} className="space-y-2">
            <div className="relative flex items-center w-full">
              <div className="absolute left-3.5 text-ink-muted pointer-events-none">
                <Search className="w-4 h-4" strokeWidth={1.5} />
              </div>
              
              <input
                type="text"
                value={quickWord}
                onChange={(e) => setQuickWord(e.target.value)}
                placeholder={
                  inputItemType === 'word'
                    ? 'So‘zni yozing... (masalan, sabr-toqat yoki resilience)'
                    : 'Gapni yozing... (masalan, Men har kuni ertalab yuguraman)'
                }
                className="w-full h-13 pl-10 pr-36 sm:pr-36 rounded-[6px] bg-paper border border-border text-ink text-sm sm:text-base placeholder:text-ink-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-2xs truncate"
              />

              {/* Action buttons inside input right side */}
              <div className="absolute right-1.5 flex items-center gap-1">
                {/* Voice Input Button */}
                {isMicSupported && (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    aria-label={isListening ? 'Ovoz yozishni to‘xtatish' : 'Ovoz orqali kiritish'}
                    title={
                      isPreparing
                        ? 'Mikrofon faollashmoqda...'
                        : isListening
                        ? 'Tinglanmoqda... To‘xtatish uchun bosing'
                        : `Ovoz orqali aytish (${micLang === 'uz-UZ' ? 'O‘zbekcha' : 'English'})`
                    }
                    className={`h-10 w-10 rounded-[5px] flex items-center justify-center transition-all ${
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
                  variant="accent"
                  size="sm"
                  disabled={!quickWord.trim()}
                  className="h-10 px-3.5 text-xs sm:text-sm font-semibold justify-center"
                >
                  <Plus className="w-4 h-4 mr-1 sm:mr-1.5" strokeWidth={1.5} />
                  <span>Qo‘shish</span>
                </Button>
              </div>
            </div>

            {/* Preparing indicator */}
            {isPreparing && (
              <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 animate-pulse px-1 pt-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>🎙️ Mikrofon faollashmoqda, tayyorlaning...</span>
              </div>
            )}

            {/* Listening indicator */}
            {isListening && (
              <div className="flex items-center gap-2 text-xs font-mono text-rose-600 dark:text-rose-400 font-semibold px-1 pt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>
                  🔴 {hasGroqKey ? 'Groq Whisper yozmoqda' : 'Tinglanmoqda'} ({micLang === 'uz-UZ' ? 'O‘zbekcha' : 'Inglizcha'}): Hozir gapiring! Tugatgach yana bosing
                </span>
              </div>
            )}

            {/* Transcribing indicator */}
            {isTranscribing && (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 px-1 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-spin" />
                <span>⚡ Nutq aniqlanmoqda va o‘zbek adabiy tiliga tekshirilmoqda...</span>
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
              variant="outline"
              size="lg"
              onClick={() => setIsCatalogOpen(true)}
              className="w-full h-11 px-4 text-xs sm:text-sm font-medium justify-center border-border hover:border-accent hover:text-accent hover:bg-accent/5 transition-all"
            >
              <BookOpen className="w-4 h-4 mr-2 text-accent" strokeWidth={1.5} />
              Mavzular to‘plamidan tanlash (A1–C1, 4,713 ta so‘z)
              <ArrowRight className="w-3.5 h-3.5 ml-auto text-ink-muted" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </Card>

      {/* BOSQICH 2: QO‘SHILGAN SO‘ZLAR VA GAPLARNI TAKRORLASH (STAGE 2) */}
      <Card variant="default" className="p-5 sm:p-6 relative overflow-hidden">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-muted">
                2-bosqich · Xotirani yangilash (Spaced Repetition)
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
                {dueCount > 0
                  ? `${dueCount} ta element (${dueWordsCount} so‘z, ${dueSentencesCount} gap) takrorlashni kutmoqda`
                  : 'Barcha so‘z va gaplar takrorlandi!'}
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-[52ch]">
                {dueCount > 0
                  ? 'FSRS unutilish egri chizig‘iga ko‘ra navbatdagi so‘z va kundalik gaplarni xotirada mustahkamlang.'
                  : 'Ajoyib natija! Bugungi takrorlash navbati toza.'}
              </p>
            </div>

            {dueCount > 0 ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-accent/10 border border-accent/20 text-accent font-mono text-sm shrink-0">
                <Clock className="w-4 h-4" strokeWidth={1.5} />
                <span>{dueCount} ta ({dueWordsCount} so‘z / {dueSentencesCount} gap)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-mono text-sm shrink-0">
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                <span>Hammasi joyida</span>
              </div>
            )}
          </div>

          {dueCount > 0 && (
            <div className="pt-1">
              <Button
                variant="accent"
                size="lg"
                onClick={() => navigate('/review')}
                className="w-full sm:w-auto h-11 px-6 text-sm font-semibold shadow-xs justify-center"
              >
                <Layers className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Takrorlashni boshlash ({dueCount} ta)
                <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Two Column Grid: Quota Progress & Daily Spotlight Word */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: New-word Quota */}
        <Card variant="default" className="p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Target className="w-4 h-4 text-accent" strokeWidth={1.5} />
                Kunlik kvota (So‘z va Gaplar)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-ink-muted">
                  {totalAddedToday} / {dailyQuota} ta ({wordsAddedToday} so‘z, {sentencesAddedToday} gap)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingQuota(!isEditingQuota);
                    setCustomQuotaInput(String(dailyQuota));
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-mono border border-border text-ink-muted hover:text-accent hover:border-accent transition-colors flex items-center gap-1"
                  title="Kvotani sozlash (minimum 8 ta)"
                >
                  <SlidersHorizontal className="w-3 h-3" strokeWidth={1.5} />
                  <span>Sozlash</span>
                </button>
              </div>
            </div>

            {/* Quota customization panel */}
            {isEditingQuota && (
              <div className="p-3 rounded-md bg-paper-subtle border border-border space-y-2.5 animate-in fade-in-0 duration-150">
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span className="font-medium text-ink">Kunlik reja miqdorini tanlang (min. 8 ta):</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingQuota(false)}
                    className="hover:text-ink text-[11px] underline"
                  >
                    Yopish
                  </button>
                </div>

                {/* Presets: 8, 15, 25, 40, 50, 80 */}
                <div className="flex flex-wrap gap-1.5">
                  {[8, 15, 25, 40, 50, 80].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleUpdateQuota(preset)}
                      className={`px-2 py-1 rounded text-xs font-mono transition-colors border ${
                        dailyQuota === preset
                          ? 'bg-accent text-white border-accent'
                          : 'bg-paper text-ink border-border hover:border-accent/60'
                      }`}
                    >
                      {preset} ta
                    </button>
                  ))}
                </div>

                {/* Custom numeric input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = parseInt(customQuotaInput, 10);
                    if (!isNaN(val) && val >= 8) {
                      handleUpdateQuota(val);
                    }
                  }}
                  className="flex items-center gap-2 pt-1 text-xs"
                >
                  <span className="text-ink-muted text-[11px]">Boshqa son:</span>
                  <input
                    type="number"
                    min="8"
                    max="500"
                    value={customQuotaInput}
                    onChange={(e) => setCustomQuotaInput(e.target.value)}
                    placeholder="Masalan: 45"
                    className="w-24 px-2 py-1 text-xs font-mono bg-paper text-ink border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <span className="text-ink-muted text-[11px]">ta</span>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2.5"
                    disabled={!customQuotaInput || parseInt(customQuotaInput, 10) < 8}
                  >
                    Saqlash
                  </Button>
                </form>
              </div>
            )}

            <div className="h-2 w-full rounded-full bg-paper-subtle border border-border overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${quotaProgress}%` }}
              />
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              {totalAddedToday >= dailyQuota
                ? `Bugungi reja to‘liq bajarildi! (${wordsAddedToday} so‘z va ${sentencesAddedToday} ta gap o‘rganildi).`
                : `Tavsiya: ${targetWordsQuota} ta so‘z va ${targetSentencesQuota} ta gap (jami ${dailyQuota} ta). Yana ${Math.max(0, dailyQuota - totalAddedToday)} ta element kutilmoqda.`}
            </p>
          </div>

          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
            <span className="text-[11px] text-ink-muted">
              Jami lug‘atingiz: <strong className="text-ink">{totalUserWords} ta</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openStepper()}
              className="text-xs h-7 px-2.5"
            >
              <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
              So‘z qo‘shish
            </Button>
          </div>
        </Card>

        {/* Card 2: Spotlight Word of the Day */}
        {spotlightWord && (
          <Card variant="default" className="p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Kun tavsiyasi (Kun {spotlightWord.dayNumber})
                </span>
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                  {spotlightWord.cefr}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-2xl text-ink tracking-tight">
                  {spotlightWord.word}
                </h3>
                {spotlightWord.phonetic && (
                  <span className="font-mono text-xs text-ink-muted">
                    {spotlightWord.phonetic}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => speak(spotlightWord.word)}
                  aria-label="Talaffuz qilish"
                  className="text-ink-muted hover:text-accent p-0.5 rounded transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>

              <p className="text-sm text-ink font-medium">
                {spotlightWord.translation}
              </p>

              {spotlightWord.example && (
                <p className="text-xs text-ink-muted italic font-serif line-clamp-2">
                  "{spotlightWord.example}"
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
              <span className="text-[11px] text-ink-muted truncate max-w-[180px]">
                Mavzu: {spotlightWord.topicUz}
              </span>
              <Button
                variant="accent"
                size="sm"
                onClick={() => openWithCuratedWord(spotlightWord)}
                className="text-xs h-7 px-2.5"
              >
                <Sparkles className="w-3 h-3 mr-1" strokeWidth={1.5} />
                O‘rganish
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Mavzular to‘plami modal (A1-C1 Curated Vocab) */}
      <CuratedVocabModal
        open={isCatalogOpen}
        onOpenChange={setIsCatalogOpen}
      />

      {/* Groq Whisper Sozlamalari Dialog */}
      {isGroqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-paper border border-border rounded-xl p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-accent">
                  <KeyRound className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                    Groq Whisper (100% Bepul)
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-ink">
                  Ovozni 99.5% aniqlikda tanish (STT)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGroqModalOpen(false)}
                className="text-ink-muted hover:text-ink text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Groq buluti dunyodagi eng tezkor va aniq <strong>Whisper-large-v3</strong> modelini mutlaqo bepul (kuniga minglab so'rovlar) taqdim etadi. U o'zbek tilidagi "havo issiq" kabi gaplarni nuqul toza va adashmasdan yozib beradi.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-medium text-ink block">
                Groq API kaliti (gsk_...):
              </label>
              <input
                type="password"
                value={groqKeyInput}
                onChange={(e) => setGroqKeyInput(e.target.value)}
                placeholder="gsk_..."
                className="w-full px-3 py-2 text-xs font-mono bg-paper-subtle border border-border rounded-md text-ink focus:outline-none focus:border-accent"
              />
              <p className="text-[11px] text-ink-muted">
                Bepul API kalitini{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline font-medium"
                >
                  console.groq.com/keys
                </a>{' '}
                orqali 30 soniyada olishingiz mumkin.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              {hasGroqKey && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setGroqApiKey('');
                    setGroqKeyInput('');
                    setHasGroqKey(false);
                    setIsGroqModalOpen(false);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700"
                >
                  O‘chirish
                </Button>
              )}
              <Button
                type="button"
                variant="accent"
                size="sm"
                onClick={() => {
                  setGroqApiKey(groqKeyInput);
                  setHasGroqKey(Boolean(groqKeyInput.trim()));
                  setIsGroqModalOpen(false);
                }}
                className="text-xs"
              >
                Saqlash
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
