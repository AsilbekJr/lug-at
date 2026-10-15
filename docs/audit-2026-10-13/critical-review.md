# LINGUISTMN: kod, xavfsizlik va UI/UX auditi

Sana: 2026-10-13. Holat: joriy kod auditi va taklif etilgan o‘zgarishlar; mahsulot kodi hali o‘zgartirilmagan.

## Maqsad va tekshiruv doirasi

Talab: loyihani professional dasturchi va UI/UX dizayner nuqtayi nazaridan tanqidiy baholash, ustuvor muammolar va o‘zgartirish rejasini berish. Foydalanuvchi kod, xavfsizlik va UI/UX’ning barchasiga urg‘u berdi.

Loyiha o‘zbek tilida so‘zlashuvchi ingliz tili o‘rganuvchilari uchun lug‘at, tinglash, yozish va takrorlash vositasi sifatida baholandi. Asosiy muvaffaqiyat mezonlari: saqlangan ma’lumot yo‘qolmasligi, mashq natijalari rost bo‘lishi, mobil ekranda harakatlar tushunarli va bajariladigan bo‘lishi.

Tekshirildi: React marshrutlari, Zustand holatlari, React Query, repository, FSRS integratsiyasi, tarjima va ovoz servislar, SQL sxemalar, ikkala Edge Function, umumiy UI komponentlari, kontent ishlab chiqarish skriptlari. Mahalliy demo ilova desktop, 320, 390, 640 va 768 px kengliklarda ko‘rildi; 390 px ekranda yorug‘ va tungi rejim tekshirildi.

Chegara: amaldagi Supabase bazasi, deploy qilingan funksiyalar, real akkauntlar va pulli AI so‘rovlari tekshirilmadi. SQL haqidagi xulosalar repodagi fayllarga asoslangan; bulutdagi holat farq qilishi mumkin. Brauzer tekshiruvi tashqi API kalitlari va Supabase ulanishisiz bajarildi. To‘liq accessibility yoki penetratsiya auditi o‘tkazilmadi.

## Umumiy baho

Vizual asos yaxshi: iliq fon, serif sarlavha, yagona terrakota aksent va pastki mobil navigatsiya mahsulotga o‘ziga xoslik beradi. React/TypeScript, feature papkalari, Query, Zod va FSRS tanlovi asosli. Asosiy zaiflik — prototip/demo mantiqi haqiqiy foydalanish oqimiga aralashgan: muvaffaqiyat, o‘zlashtirish va statistika ba’zan dalilsiz ko‘rsatiladi.

Tavsiya: bosqichma-bosqich tuzatish. To‘liq qayta yozish yoki yangi dizayn tizimi kiritish hozir asosiy muammolarni hal qilmaydi. Avval ma’lumot va o‘quv natijalarining ishonchliligi, keyin interfeys tartibi va yuklanish tezligi.

## Topilmalar

P0 — ommaga chiqarishdan oldin hal qilinishi kerak. P1 — asosiy funksiyaning to‘g‘riligi yoki ishonchliligiga ta’sir qiladi. P2 — qulaylik, tezlik va xizmat ko‘rsatishga ta’sir qiladi.

### F01 · P0 · AI provayder kalitlari brauzerga beriladi

Dalil: `src/features/words/services/groq-whisper-service.ts:9`, `gemini-flash-service.ts:11`, `speech-normalizer.ts:48`, `.env.example:8`. Kalitlar `VITE_*` yoki localStorage’dan olinadi, Groq/Gemini so‘rovi to‘g‘ridan-to‘g‘ri brauzerdan yuboriladi.

Ta’sir: loyihaga tegishli kalit `VITE_*` orqali berilsa, klient kodidan yoki tarmoq so‘rovidan olinishi mumkin; chetdan sarflanish xavfi bor. Foydalanuvchining shaxsiy kalitini localStorage’da saqlash ham mahsulot uchun alohida xavfsizlik qarorini talab qiladi. Bu audit hech bir kalit qiymatini oshkor qilmaydi va faol kalit tarqalganini da’vo qilmaydi.

Taklif: provayder so‘rovlarini serverga ko‘chirish; server secrets, foydalanuvchi autentifikatsiyasi, umumiy kvota, cheklangan input va timeout. Agar loyiha kaliti oldin publik build’da bo‘lgan bo‘lsa, uning egasi uni almashtirishi kerak. Oddiy o‘quvchi oqimidan provayder kalitini kiritish talabini olib tashlash.

Manba: [Vite env qoidalari](https://vite.dev/guide/env-and-mode).

### F02 · P1 · Bulutli saqlash shartnomalari bir-biriga mos emas

Dalil: `supabase/schema.sql` `cards/review_logs` modelini, migration esa `word_cards/user_words/review_log` modelini beradi. `src/lib/supabase.ts:441` `words.item_type` yuboradi, mavjud migration’da bu ustun yo‘q. `getUserId()` sessiya bo‘lmasa demo UUID qaytaradi, lekin Query shu bilan Supabase’ga so‘rov yuborishda davom etadi. UI’da kirish/sessiya oqimi topilmadi.

Bundan tashqari, `ai-coach/index.ts:269` CARD yaratganda `words` yozuvini serverda saqlaydi. `createWord()` keyinchalik ayni so‘zni yangi UUID bilan qayta insert qiladi; migration’da `word unique`. Server CARD muvaffaqiyatli ishlagan bo‘lsa, keyingi insert unique chekloviga urilishi mumkin.

Taklif: bitta kanonik sxema, demo va autentifikatsiyalangan repository’ni aniq ajratish; bir xil normalizatsiyalangan so‘z uchun mavjud dictionary yozuvini qayta ishlatish; foydalanuvchiga bitta `user_words` yozuvi.

### F03 · P1 · Saqlash atomar emas va ayrim xatolar yo‘qoladi

Dalil: `src/lib/supabase.ts:499–505` uchta alohida insert bajaradi. `word_cards` insert natijasi tekshirilmaydi, migration esa authenticated klient uchun bu jadvalga insert ruxsatini bermaydi. Review update va log insert ham alohida. `setLocalData():340` xatoni faqat console’ga yozadi.

Ta’sir: so‘z qisman saqlanadi, UI mavjud bo‘lmagan kartochkani qaytarishi mumkin; review holati log’siz qoladi; localStorage to‘lganida saqlanmagan ma’lumot uchun muvaffaqiyat ko‘rsatilishi mumkin.

Taklif: bulutda transaction/RPC, foydalanuvchi va yozuv egaligini serverda tekshirish, idempotent so‘rov; mahalliy saqlashda bitta yaxlit holat yozuvi va ko‘rinadigan xato. RLS’ni keng ochib klient insert’ini “tuzatish” kerak emas.

### F04 · P1 · Review saqlanmasa ham sessiya muvaffaqiyatli davom etadi

Dalil: `useReviewSessionStore.ts:251–270` index va statistika avval yangilanadi, `saveReview()` kutilmaydi; xato faqat console’da qoladi. `ReviewPage` ishlatayotgan yo‘l `useSubmitReviewMutation()` emas, shu sababli uning Query invalidation’i ishlamaydi. Qayta boshlash eski `dueItems` bilan sessiya yaratishi mumkin.

Taklif: saqlash davomida rating’ni bloklash, muvaffaqiyatdan keyin keyingi kartaga o‘tish; xatoda javob va kartani saqlab, qayta urinish ko‘rsatish; Query cache’larini yangilash; eski sessiya kartalarini avtomatik qayta ishlatmaslik.

### F05 · P1 · Ko‘nikma holatlari haqiqiy bajarishga bog‘lanmagan

Dalil: `AddWordStepperModal.tsx:69` va `:71` dagi `listenConfirmed || true` / `speakConfirmed || true` doim true. `TodayPage` tez qo‘shishda to‘rt ko‘nikmani true beradi; repository ham default true beradi. Review `masteryUpdates` javobning `isCorrect` qiymatini tekshirmay true yozadi.

Ta’sir: tinglamagan, gapirmagan yoki noto‘g‘ri javob bergan odam “o‘zlashtirgan” deb ko‘rsatiladi; zaif ko‘nikma tavsiyalari ishonchsizlashadi.

Taklif: yangi elementda default false; tekshirilgan mashq natijasi asosida tegishli ko‘nikmani yangilash. “Bilaman” tugmasi o‘zini baholash ekanini aniq ko‘rsatishi kerak. Matnli suhbatni haqiqiy talaffuz tekshiruvi bilan tenglashtirmaslik.

### F06 · P1 · Statistika haqiqiy log o‘rniga raqam to‘ldiradi

Dalil: `stats-api.ts:141` faoliyat bo‘lmasa 3 kun streak, `:149` bo‘sh kunlarga 4 ta review, `:249` kamida 12 kun rekord beradi. Bo‘sh lug‘at uchun retention 92.5%; boshqa qiymatlar kamida 40% qilib kesiladi. UTC sanalar (`toISOString`) mahalliy kun hisoblari bilan aralashadi.

Brauzer: yangi demo sessiyada 3 kunlik streak va 12 kunlik rekord ko‘rindi. [Dalil](mobile-stats.jpg).

Taklif: faqat review log’laridan faollik va tarixiy eng uzun streak hisoblash; log yo‘q bo‘lsa 0; xotira bahosiga dalil yetmasa “Hali ma’lumot yo‘q”. FSRS bahosini o‘rnatilgan kutubxonaning `get_retrievability()` metodi bilan hisoblash. Vaqt zonasini barcha kunlik hisoblarda bir xil ishlatish. “3 barobarga oshiradi” kabi dalilsiz ta’limiy va’dani olib tashlash.

### F07 · P1 · Mashq javobi javob berishdan oldin ko‘rsatiladi

Dalil: `ReviewPage.tsx:140` target word’ni, `:222` active sentence’ni barcha mashqlarda ko‘rsatadi. Diktantda ekrandagi gap tinglash va yozish kerak bo‘lgan jumlaning o‘zi bo‘lib chiqdi. [Dalil](mobile-review-answer.jpg).

Taklif: diktantda audio matnini, uz→en/gap-fill’da kerakli javobni tekshirishgacha yashirish. Javobdan keyin kontekst, tarjima va tushuntirish ko‘rsatish. Mashq turi uchun alohida ma’lumot oshkor qilish qoidasi.

### F08 · P1 · FSRS holati to‘liq saqlanmaydi

Dalil: `src/lib/fsrs.ts:39` `elapsed_days`, `scheduled_days`, `learning_steps` qiymatlarini har safar 0 qilib tiklaydi. Model va review saqlashi bu maydonlarni tashimaydi; o‘rnatilgan ts-fsrs Card tipi esa ularni talab qiladi.

Taklif: FSRS holatini to‘liq aylantirish, eski yozuvlar uchun izohlangan default va migration. Xususan learning/relearning qadamlarini ikki ketma-ket review davomida saqlash. Amaldagi interval algoritmi natijalarini regression test bilan tekshirish.

### F09 · P1 · Lug‘at sahifasida ikkita qo‘shish modali ochiladi

Dalil: `App.tsx:50` va `WordsPage.tsx:190` bir xil global Zustand holatiga bog‘langan `AddWordStepperModal`’ni render qiladi. Brauzerda tugma bosilgach DOM’da 2 ta `[role="dialog"]` va 2 ta bir xil forma topildi. [Dalil](mobile-double-dialog.jpg).

Taklif: global modalni faqat App’da qoldirish; boshqa sahifalar store action orqali ochadi. Yopish, focus va body scroll bitta modal tomonidan boshqariladi.

### F10 · P2 · Mobil va planshet boshqaruvlari izchil emas

Dalil: 390 px’da So‘z/Gap tugmalari taxminan 24 px, til va Groq tugmalari 26 px, mikrofon 36 px, talaffuz 18 px. `Button.sm` minimumi 36 px. 640 px’da desktop header paydo bo‘ladi, lekin kontent kengligi taxminan 772 px: Statistika va o‘ng tugmalar ekrandan tashqarida. `xs:inline` ishlatilgan, lekin `xs` breakpoint ta’rifi topilmadi; yuqori “+” yorlig‘i desktop’da ham ko‘rinmaydi va aria-label yo‘q.

Taklif: mobil bosish maydoni kamida 44×44 px, amallar orasida 8 px; header va bottom nav almashishini bitta 1024 px breakpoint bilan boshqarish; ikonali tugmalarga aria-label. Mobil input’da mikrofon va submit’ni yozuv bilan to‘qnashmaydigan joyga ajratish. `safe-area-pb` uchun haqiqiy CSS va mos pastki kontent padding’i berish.

### F11 · P2 · Modal va input’larda accessibility to‘liq emas

Dalil: `dialog.tsx` focus trap, oldingi focus’ni tiklash va fonni inert qilishni bajarmaydi; dialog nomi ulanmagan. `Input` xatosi `aria-invalid/aria-describedby` bilan bog‘lanmagan. Qidiruv input’larida placeholder’dan tashqari accessible label yo‘q. `WordCard` button rolidagi parent ichida audio button beradi; parent keydown bubbling’i boshqa harakatni ham ishga tushirishi mumkin.

Taklif: keyboard va screen reader uchun to‘liq dialog primitive; title/description ID’lari, Tab/Shift+Tab focus chegarasi, Escape, trigger’ga focus qaytarish. Input va xato aloqasi; kartada alohida details va audio amallari.

### F12 · P1 · AI ishlamasa ham “tekshirildi” taassuroti beriladi

Dalil: `ai-coach-api.ts` Edge Function xatosini local generator bilan almashtiradi. Fallback sentence/reply tekshiruvi oddiy target so‘z mavjudligiga asoslanib `grammar_ok: true` va natural score beradi. `translation-service.ts:230` noma’lum o‘zbekcha matnni inglizcha maydonga aynan qaytarishi mumkin. UI uni avtomatik tarjima sifatida saqlaydi. `isLikelyUzbek()` oddiy inglizcha apostrofni ham o‘zbekcha belgisi deb oladi.

Taklif: natijada `source: 'curated' | 'ai' | 'unverified'` ajratish; noma’lum tarjima va grammatika uchun “Tekshirib bo‘lmadi” deyish; foydalanuvchi tuzatadigan preview. Lug‘atda aniq moslik bo‘lsa AI’dan oldin lokal javob. Fallback generik gaplardan haqiqiy zamon/grammatika namunalari yasagandek ko‘rsatmaslik.

### F13 · P2 · Yuklanish og‘ir va kod mas’uliyatlari aralashgan

Dalil: production build bitta 1,939.05 kB JS fayl beradi (gzip 519.89 kB). `curriculum.json` 1,661,041 byte va Today/translation/curriculum’dan boshlang‘ich import qilinadi. App barcha marshrutlarni statik import qiladi. `supabase.ts` demo seed, lokal storage va bulutli saqlashni bitta faylda saqlaydi; TodayPage katta UI va API workflow’ni birlashtiradi.

Taklif: o‘lchovga tayangan lazy route/catalog, kichik spotlight va zarur lookup indeksi; butun katalogni talab bo‘yicha yuklash. Repository’ni interfeys orqali demo va Supabase adapterlariga ajratish. Komponentlarni vazifaga ko‘ra ajratish; dekorativ refactor uchun yangi abstraksiya kiritmaslik.

### F14 · P2 · Tekshiruvlar muhim oqimlarni qamramaydi

Dalil: package scripts’da build/dev/preview bor, test/lint/content tekshiruvi yo‘q. Vitest’da 1 fayl va 13 schema testi o‘tdi; saqlash, review, statistika va modal regressiyalari uchun test topilmadi. `node content/validate.js` mavjud bo‘lmagan `data/topics.json`’ni qidirib exit 1 beradi; UI esa boshqa JSON ishlatadi. UI screenshot skriptlari boshqa kompyuterga xos `.gemini/...` yo‘llarga yozadi.

Taklif: test va kontent pipeline’ni joriy manba bilan ulash; ko‘chiriladigan output papkasi; CI’da build, unit test, kontent validatsiyasi. Alohida cloud integratsiya testida RLS, rollback va duplicate so‘z. `tsconfig` faqat src’ni qamraydi, shuning uchun frontend build Edge Function’lar tekshirilganini bildirmaydi.

### F15 · P2 · Xato va bo‘sh holatlar foydalanuvchini chalg‘itadi

Dalil: Today tez qo‘shish va stepper final save xatolari console’da qoladi. WordDetail o‘chirish muvaffaqiyatini kutmay yopiladi. WordsPage’da faqat CEFR filtri sabab bo‘sh natija bo‘lsa “Lug‘atingiz bo‘sh” va “Birinchi so‘z qo‘shish” chiqadi. Review’dagi “Lug‘at bankiga o‘tish” `/` ga yo‘naltiradi.

Taklif: xato yonida tushunarli feedback, yozilgan matnni saqlash, retry; o‘chirishni kutish; filter empty holatida filtrni tozalash; lug‘at CTA uchun `/words`.

## UI/UX yo‘nalishi

1. Bugun sahifasida bitta aniq navbatdagi amal: due > 0 bo‘lsa “Takrorlashni boshlash”, aks holda “Yangi so‘z qo‘shish”. Tez kiritish keyingi joyda; takrorlanayotgan quota va so‘z/gap sonlarini bitta ixcham blokka jamlash.
2. Qo‘shish entry’lari yagona bo‘lsin: “Tez saqlash” va “Mashq bilan o‘rganish”. Header, Bugun va Lug‘at bir xil controller’dan foydalansin. Texnik kalit/engine nomlari o‘quvchining asosiy ekranidan olib tashlansin.
3. Matnlar sodda o‘zbekcha: “Kunlik maqsad”, “Eslab qolish bahosi”, “Ketma-ket faol kunlar”. FSRS/telemetriya izohi ixtiyoriy yordam bo‘limida. “Qo‘shildi” bilan “O‘zlashtirildi” ma’nolari ajratilsin.
4. Review’da bir savol, javob, feedback, keyingi amal. Javobgacha yashirilishi kerak bo‘lgan ma’lumot ochilmasin. Saqlash tugamaguncha muvaffaqiyat e’lon qilinmasin.
5. Yorug‘/tungi palitra va serif uslub saqlansin. 320/390/640/768/1024/1280 px, uzun so‘z/gap, virtual keyboard va 200% zoom bo‘yicha tekshiruv kiritilsin. Oddiy matn uchun 4.5:1 kontrast maqsadi o‘lchab tekshirilsin; hozir bunday to‘liq o‘lchov bajarilmadi.

## Tekshiruv natijalari

| Tekshiruv | Natija |
| --- | --- |
| `npm run build` | Exit 0; yuqoridagi bundle ogohlantirishi bor |
| `node node_modules/vitest/vitest.mjs run` | 1 fayl, 13 test o‘tdi |
| `node content/validate.js` | Exit 1: `data/topics.json` mavjud emas |
| Mobil qo‘shish modali | 2 dialog tasdiqlandi |
| Diktant | Javob matni oldindan ko‘rindi |
| 640 px header | Navigatsiya o‘ngga taxminan 132 px chiqadi |
| 390 px tugmalar | Bir nechta 18–36 px bosish maydoni tasdiqlandi |
| Real Supabase/AI/deploy | Bajarilmadi |

## Keyingi qadam

[O‘zgarishlar rejasi](../superpowers/plans/2026-10-13-project-improvements.md) fayllar, bog‘liqliklar va qabul mezonlarini belgilaydi. Bu audit mahsulot kodidagi muammolar tuzatildi degan da’vo emas.
