# LINGUISTMN yaxshilash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task in the current session. Steps use checkbox (`- [ ]`) syntax for tracking. Delegation is optional only if the user explicitly chooses it.

**Goal:** So‘z qo‘shish, takrorlash va statistika natijalarini ishonchli qilish; AI kalitlarini serverda himoyalash; mobil UI’ni izchil va tushunarli qilish.

**Architecture:** Mavjud React/Query/Zustand tuzilmasi saqlanadi. Demo va Supabase saqlashi umumiy repository shartnomasi ostida ajratiladi; cloud yozuvlari atomar va idempotent bo‘ladi. Statistik hisoblar sof funksiyaga, AI chaqiruvlari autentifikatsiyalangan server endpoint’lariga ko‘chadi.

**Tech Stack:** React, TypeScript, Vite, Tailwind, React Query, Zustand, Zod, ts-fsrs, Supabase, Vitest; brauzerda responsive va keyboard tekshiruvi.

**Spec:** [Tanqidiy audit va taklif etilgan UI/UX yo‘nalishi](../../audit-2026-10-13/critical-review.md).

**Status:** 1- va 2-vazifalar 2026-10-14 da bajarildi: build, 34 ta test, brauzer tekshiruvi va mustaqil kod ko‘rigi bilan tasdiqlandi. [Ijro dalillari va qarorlar](../../audit-2026-10-13/execution-progress.md). 3–8-vazifalar hali bajarilmagan. Bulut sxemasi tegishli bosqichda avval read-only tekshiruv bilan aniqlanadi.

## Global Constraints

- Mavjud yorug‘/tungi ranglar, serif sarlavhalar va terrakota aksent saqlanadi.
- Mobil bosish maydoni kamida 44×44 px; amallar orasida kamida 8 px.
- Oddiy matn uchun kontrast maqsadi 4.5:1; o‘lchov bilan tekshiriladi.
- 320/390/640/768/1024/1280 px ekranlar, uzun matn va 200% zoom tekshiriladi.
- Demo ma’lumoti haqiqiy foydalanuvchi natijalari bilan aralashmaydi.
- Saqlash tugamaguncha muvaffaqiyat ko‘rsatilmaydi; xatoda foydalanuvchi matni va javobi saqlanadi.
- Faqat tekshirilgan mashq ko‘nikma natijasini yangilaydi; matnli javob talaffuz isboti hisoblanmaydi.
- Provayderning loyiha kalitlari frontend env, bundle yoki localStorage’da bo‘lmaydi.
- Tashqi bazaga destructive SQL ishlatilmaydi. Migration amaldagi sxema tekshirilgandan keyin yoziladi.
- Feature scope kengaytirilmaydi: yangi gamification, chat yoki boshqa subsystem qurilmaydi.

## Review Focus

- Tarmoq uzilishi yoki storage quota: saqlanmagan natija muvaffaqiyat deb ko‘rsatilmasin (2/4/5-vazifalar).
- Ketma-ket tez bosish/retry: bitta foydalanuvchi amali bitta review yoki user_word yaratsin (2/4-vazifalar).
- Toshkent yarim tuni: UTC kun almashishi mahalliy streak’ni buzmasin (3-vazifa).
- Akkaunt almashishi: oldingi foydalanuvchi Query/store ma’lumotlari ko‘rinmasin (4-vazifa).
- Noma’lum tarjima va AI 401/429/timeout: grammatika yoki tarjima tekshirilgan deb ko‘rsatilmasin (5-vazifa).

## 1-vazifa · Global modal va mobil navigatsiya regressiyalari

**Files:** `src/app/App.tsx`, `src/app/routes/WordsPage.tsx`, `src/components/layout/header.tsx`, `src/components/layout/MobileBottomNav.tsx`, `src/components/ui/button.tsx`, `src/index.css`, `src/app/routes/TodayPage.tsx`, `src/features/words/components/WordFilters.tsx`.

**Interfaces:** Modal mavjud `useAddWordStepperStore.openStepper()` bilan ochiladi. App yagona `AddWordStepperModal` instance egasi. Header/bottom nav bitta 1024 px almashish chegarasidan foydalanadi.

- [x] WordsPage’dagi takroriy modal render/import’ini olib tashlash.
- [x] `xs:inline` o‘rniga mavjud breakpoint’dan foydalanish; header add tugmasiga `aria-label="Yangi so‘z qo‘shish"` berish.
- [x] Desktop navigatsiyasini 1024 px’dan yoqish; pastki navigatsiyani shu chegaragacha ko‘rsatish; asosiy kontent padding’ini moslashtirish.
- [x] Mobil sm tugmalar, audio, CEFR, til, quota va tab hit area’larini 44 px qilish; input action’larini kichik ekranlarda alohida qatorga joylash.
- [x] `env(safe-area-inset-bottom)` uchun haqiqiy CSS va mos nav balandligini qo‘shish.
- [x] Brauzerda bir click → aynan 1 dialog; Escape → 0 dialog. Har bir kenglikda asosiy sahifada gorizontal overflow bo‘lmasin; barcha nav amallari ko‘rinsin. Mahsulotda brauzer E2E mavjud bo‘lsa modal regression’ini unga qo‘shish.
- [x] `npm run build`.

**Qabul:** 640 px’da controls tashqariga chiqmaydi, mobil amallar 44×44 px, double modal yo‘q.

## 2-vazifa · Review saqlashi va mashq to‘g‘riligi

**Files:** `src/features/review/store/useReviewSessionStore.ts`, `src/app/routes/ReviewPage.tsx`, `src/features/review/components/RatingBar.tsx`, `src/features/words/api/words-api.ts`, `src/features/words/components/stepper/AddWordStepperModal.tsx`, `src/lib/supabase.ts`; test: `src/features/review/store/useReviewSessionStore.test.ts`.

**Interfaces:** Store’ga `isSavingReview: boolean`, `saveError: string | null` qo‘shiladi. Mavjud `rateCard(rating, saveReview): Promise<void>` saqlashni kutadi va reject’ni UI uchun boshqaradi. Muvaffaqiyatda words/dueCards/stats cache’lari yangilanadi.

- [x] Regression test: reject bo‘lgan save’dan so‘ng currentIndex/totalReviewed o‘zgarmaydi, javob qoladi, xato ko‘rinadi; ikkinchi click pending paytida ikkinchi write yaratmaydi.
- [x] Regression test: noto‘g‘ri javob mastery true qilmaydi; yangi tez qo‘shilgan so‘z ko‘nikmalari false; `listenConfirmed=false` aynan false saqlanadi.
- [x] Store testlarini ishga tushirib eski xatti-harakat uchun failure’ni ko‘rish.
- [x] Saqlashni await qilish, rating bloklash, retry va cache invalidation; final save uchun ko‘rinadigan xato. F05’dagi default/always-true holatlarni tuzatish. “Bilaman” o‘zini baholash holati ajratiladi.
- [x] Review’da javobgacha diktant audio matni va target’ni oshkor qilmaslik; kontekstni javobdan keyin ko‘rsatish. To‘g‘ri javobni yashirish mashq turiga bog‘lanadi.
- [x] Restart’da yangilangan due ro‘yxatidan foydalanish; empty CTA `/words` ga yo‘nalsin.
- [x] Testlar PASS; brauzerda diktant javobi oldindan ko‘rinmasin va muvaffaqiyat faqat save’dan keyin chiqsin; build.

**Qabul:** yozilmagan review sessiya yakuni sifatida hisoblanmaydi; statistik cache yangilanadi; javob oshkor bo‘lmaydi.

## 3-vazifa · Haqiqiy statistika va FSRS holati

**Files:** `src/features/stats/api/stats-api.ts`, create `src/features/stats/utils/compute-stats.ts`, test `compute-stats.test.ts`, `src/features/stats/components/RetentionAndStreakCard.tsx`, `src/app/routes/StatsPage.tsx`, `src/lib/fsrs.ts`, `src/features/words/types/index.ts`, review store va repository; test `src/lib/fsrs.test.ts`.

**Interfaces:** `computeStats(items: EnrichedUserWord[], logs: ReviewLog[], now: Date, timeZone: string): StatsSummary`. `retentionRate: number | null` — tekshirilgan review dalili yetmasa null. FSRS modeliga `elapsed_days`, `scheduled_days`, `learning_steps` qo‘shiladi. Eski local yozuvlar 0 default bilan o‘qiladi; mavjud bo‘lmagan tarix taxmin qilinmaydi.

- [ ] Testlar: bo‘sh log → streak/bestStreak=0, barcha kun count=0; faol tarix → haqiqiy eng uzun streak; review’siz lug‘at → retention null.
- [ ] Timezone testi: `2026-10-12T19:30:00Z` Asia/Tashkent uchun 13-oktabrga kiradi. Log kunlari, today va forecast bitta day-key qoidasi bilan hisoblansin.
- [ ] FSRS testi: save → load round-trip’da barcha scheduling maydonlari bir xil; learning/relearning qadamlari saqlanadi.
- [ ] Testlarni FAIL holatida ko‘rish, hisoblashni hook’dan sof funksiyaga ajratish va demo to‘ldirish raqamlarini olib tashlash.
- [ ] Retention uchun mavjud `fsrsScheduler.get_retrievability(toFSRSCard(item.userWord), now, false)` ishlatish; natija UI’da baho sifatida nomlanadi. Sun’iy 40%/92.5% olib tashlanadi.
- [ ] Nullable retention UI’da “Hali ma’lumot yo‘q”; dalilsiz “3 barobarga” va’da olib tashlanadi.
- [ ] Unit testlar PASS, yangi demo va haqiqiy log fixture’lari bilan browser tekshiruvi, build.

**Qabul:** hech qanday o‘ylab topilgan kun/review/rekord yo‘q; sana va FSRS field’lari izchil.

## 4-vazifa · Demo/cloud chegarasi va atomar saqlash

**Files:** `src/lib/supabase.ts`, create `src/features/words/repository/types.ts`, `local-repository.ts`, `supabase-repository.ts`, `demo-data.ts`, test `local-repository.test.ts`; `src/lib/query-client.ts`, `src/app/App.tsx`; SQL migration va `supabase/tests/` egalik/rollback testlari.

**Interfaces:** `WordRepository` joriy get/create/review/delete metodlarini saqlaydi. `createWord(input: CreateWordInput): Promise<EnrichedUserWord>` va `updateUserWordReview(...)` signature’lari o‘zgarmaydi. Cloud session yo‘q bo‘lsa `AuthRequiredError`; demo UUID bulut so‘roviga ishlatilmaydi.

- [ ] Amaldagi Supabase schema, grants, policies va frontend env konfiguratsiyasini read-only tekshirish; ikki repo schema’sidan migration modeli kanonik deb olinadi, lekin real eski ma’lumot o‘chirilmaydi.
- [ ] Sessiya provider’i va kirish/chiqish yo‘lini qo‘shish; demo rejimini UI’da aniq belgilash. Query keys’ni account/mode bo‘yicha ajratish; sign-out/account almashishda review/stepper store reset.
- [ ] `item_type` va FSRS maydonlarini migration orqali moslashtirish; migration filename Supabase CLI orqali yaratiladi. Frontend typed database shartnomasini generatsiya qilish.
- [ ] Cloud create’da normalized dictionary word qayta ishlatiladi, unique user_word idempotent; word/card/user_word yozish bitta transaction’da. Mavjud service-only card siyosati saqlanadi.
- [ ] Review schedule va log bitta transaction’da; user_word haqiqiy egasini tekshirish; retry idempotency key bilan duplicate log’dan himoya.
- [ ] Local storage’ni bitta versiyalangan yozuvga yig‘ish; v2 kalitlarni xavfsiz o‘qish/migrate. `setItem` reject bo‘lsa Promise reject va UI’da error; eski ma’lumot yo‘qotilmaydi.
- [ ] Testlar: quota error, buzilgan JSON, bir so‘zni ikki marta qo‘shish, ikki account, word_card xatosi rollback, review_log xatosi rollback, boshqa user_word uchun write rad etilishi.
- [ ] Alohida test bazasida migration/RLS/transaction testlari; frontend unit testlar va build. Live RLS sinovidan oldin production ma’lumotiga yozmaslik.

**Qabul:** guest cloud write bajarmaydi; save qisman qolmaydi; boshqa akkaunt ma’lumotlari ochilmaydi; retry dublikat bermaydi.

## 5-vazifa · AI’ni serverga ko‘chirish va tekshirilmagan natijani ajratish

**Files:** `supabase/functions/ai-coach/index.ts`, `enrich-word/index.ts`, serverda translate/transcribe endpoint’lari; `src/features/words/services/gemini-flash-service.ts`, `groq-whisper-service.ts`, `speech-normalizer.ts`, `translation-service.ts`, `src/features/words/api/ai-coach-api.ts`, `src/lib/schemas/ai-coach.ts`, `.env.example`, Today/stepper feedback; test `translation-service.test.ts`.

**Interfaces:** `TranslationResult.source: 'curated' | 'ai' | 'unverified'`; tasdiqlanmagan natija avtomatik saqlashga kirmaydi. Server so‘rovi authenticated session bilan, input Zod orqali bounded. Endpoint’lar server secrets’dan foydalanadi.

- [ ] Aniq curated match birinchi ishlaydi; unknown va inglizcha contraction holatlari uchun regression test. Apostrof yakka o‘zi language dalili bo‘lmasin.
- [ ] Translation/transcription/normalization’ni serverga ko‘chirish; loyiha kalitlari `VITE_*` va localStorage’dan olib tashlanadi. Client’da Supabase publishable/anon kaliti qolishi mumkin.
- [ ] Endpoint input chegarasi, provider timeout, umumiy user rate/quota, 401/429/502 feedback. Bir instance Map’ini global rate limit deb qabul qilmaslik.
- [ ] Server/client AI output schema’larini moslashtirish; JSON parse xatosi ham retry doirasiga kirsin; ichki provider xatosi foydalanuvchiga xom chiqmasin.
- [ ] AI ishlamasa yoki fallback ishlasa grammatika/natural score uydirilmaydi; “Tekshirib bo‘lmadi” va matnni saqlagan retry. Unknown tarjima uchun tahrir qilinadigan preview.
- [ ] `interval`, `active_sentence`, `uz_meaning` kabi review kontekstlarini server payload/schema’da izchil tashish.
- [ ] Testlar: 401, 429, timeout, yaroqsiz JSON, unknown so‘z/gap, contraction; katalog offline ishlasin.
- [ ] Production bundle’da provider key mexanizmi yo‘qligi qiymatlarni chiqarmasdan tekshiriladi. Haqiqiy endpoint integratsiya testi test environment’da; build.

**Qabul:** project provider kaliti klientga chiqmaydi; local heuristic “AI tekshirdi” deb ko‘rsatilmaydi; offline katalog mavjud.

## 6-vazifa · Dialog, formalar va xato holatlari

**Files:** `src/components/ui/dialog.tsx`, `input.tsx`, `src/features/words/components/WordCard.tsx`, `WordDetailDialog.tsx`, `WordFilters.tsx`, `src/app/routes/WordsPage.tsx`, Today/stepper error UI.

**Interfaces:** Dialog’ning mavjud open/onOpenChange API saqlanadi; title/description IDs va focus lifecycle qo‘shiladi. Delete handler `Promise<void>` qaytaradi va success’dan keyin modalni yopadi.

- [ ] Focus trap/restore va fon inertligi uchun tekshirilgan dialog primitive tanlash; yangi dependency zarur bo‘lsa aynan shu vazifa doirasida kiritish.
- [ ] Dialog accessible name/description, Input aria-invalid/describedby, search aria-label, tab/selected holatlarini qo‘shish.
- [ ] WordCard ichidagi audio va details alohida boshqaruv bo‘lsin; keyboard audio Enter details modalini ham ochmasin.
- [ ] Delete pending/xato; CEFR/search empty state’da filter reset; Today query loading/error’ni “0 ta” bilan almashtirmaslik.
- [ ] Tab/Shift+Tab, Escape, focus return, screen reader name; uzun matn va virtual keyboard; build.

**Qabul:** keyboard bilan asosiy oqimlar to‘liq bajariladi, modal focus tashqariga chiqmaydi, xato tuzatish yo‘li bor.

## 7-vazifa · Bugun sahifasini soddalashtirish va bundle’ni kamaytirish

**Files:** `src/app/routes/TodayPage.tsx`, `src/app/App.tsx`, `src/features/words/hooks/use-curriculum.ts`, `translation-service.ts`, `src/features/words/components/curriculum/CuratedCatalogView.tsx`, `scripts/build_curriculum_data.cjs`; kerakli kichik Today komponentlari va katalog loader.

**Interfaces:** Due > 0 bo‘lsa asosiy CTA “Takrorlashni boshlash”; aks holda “Yangi so‘z qo‘shish”. Katalog loader birinchi foydalanishda katalogni yuklaydi; Today uchun kichik spotlight/lookup manbasi. Lazy yuklanishda pending/error/retry mavjud.

- [ ] Today’ni primary action, quick input va bitta daily-goal blokiga ajratish; quota’ni ikki joyda takrorlamaslik.
- [ ] Oddiy o‘zbekcha matn; “Qo‘shildi” va “O‘zlashtirildi” ajratilsin; FSRS izohi ixtiyoriy yordamda.
- [ ] Route/catalog lazy import; barcha ko‘p megabaytli kontentga boshqa eager import yo‘li qolmaganini tekshirish.
- [ ] Yangi initial JS jami <500 kB minified maqsadi; bazaviy 1,939.05 kB bilan solishtirish. Natijaga yetilmasa sabab va keyingi bo‘linish nuqtasi o‘lchov bilan beriladi.
- [ ] Brauzerda birinchi loading, katalog ochish, qidiruv va offline xatti-harakat; barcha kengliklar/ikkala tema; build.

**Qabul:** Today’da aniq navbatdagi amal va bitta maqsad bloki; katalog asosiy ekran ochilishi uchun to‘liq yuklanmaydi.

## 8-vazifa · Kontent va tekshiruv pipeline’i

**Files:** `package.json`, `content/validate.js`, `content/schema.js`, `scripts/build_curriculum_data.cjs`, screenshot/verification skriptlari, `README.md`, `.github/workflows/ci.yml`.

**Interfaces:** `npm test` → vitest run; `npm run content:build` → joriy curriculum build; `npm run content:validate` → aynan UI ishlatadigan kontentni tekshirish. Kontent formati eski `topics.json` bilan aralashtirilmaydi.

- [ ] UI curriculum/vocabTopics uchun schema-validatsiya va source → output shartnomasini ulash; yaroqsiz kontent output’ga yozilmasin.
- [ ] Hardcoded 4,713 ko‘rsatkichini haqiqiy hisobdan chiqarish; takror so‘z uchun unique va slot soni aniq nomlansin.
- [ ] Skriptlardan boshqa foydalanuvchiga xos absolute output yo‘llarini olib tashlash; screenshot’lar loyiha artifact papkasiga yozilsin.
- [ ] Test/content scripts va CI; frontend bilan Edge Function tekshiruvini alohida yuritish.
- [ ] README’da setup, demo/cloud farqi, env/secrets, migration va verifikatsiya yo‘li.
- [ ] `npm test`, `npm run content:validate`, `npm run build` hammasi exit 0; test environment’da cloud RLS/rollback regressiyalari; qolgan limitation’lar yoziladi.

**Qabul:** yangi clone’da ko‘rsatmalarga amal qilib loyiha va tekshiruvlar ishga tushadi; build kontent xatosini yashirmaydi.

## Bajarish tartibi va tanlovlar

Tavsiya qilingan bosqichli yo‘l: 1 → 2 → 3, keyin cloud/security 4 → 5, so‘ng 6 → 7 → 8. Ommaviy deploy uchun 4–5-vazifalar release gate: frontend loyiha AI kaliti bilan chiqarilmaydi.

Faqat UI’ni qayta bo‘yash tezroq, lekin ma’lumot ishonchliligini hal qilmaydi. To‘liq qayta yozish eng katta regressiya va migratsiya xarajatini keltiradi. Bosqichli yo‘l joriy asosni saqlab, har bir muammoning natijasini alohida tekshirishga imkon beradi.

Ijro tavsiyasi: shu suhbatda ketma-ket bajarish. Har bir o‘zgarishdan keyin tegishli test/brauzer dalili bilan natija beriladi. Reja ko‘rib chiqilib, birinchi bosqich tasdiqlangach mahsulot kodi o‘zgartiriladi.
