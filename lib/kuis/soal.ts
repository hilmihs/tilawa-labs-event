import type { BahasaTeks, Teks } from "@/lib/catatan/tipe";

/**
 * The quiz bank: thirty questions, five of which open each week, every one of them
 * answerable from the lecture notes in lib/catatan.
 *
 * The bank is content, not state. Nothing here knows who is answering, which day it
 * is, or whether anyone got it right — that belongs to the quiz itself when it is
 * built. What this file guarantees is that question N exists, that it has exactly
 * four options in each of the three languages, that exactly one of them is correct,
 * and that it points back at the part of the notes it was drawn from.
 *
 * The order is the order of the notes, so a reader who works through the notes once
 * meets the questions in the same sequence.
 */

export type TipeSoal = "kaidah" | "siapa" | "ayat" | "kasus" | "urutan" | "data";

export const LABEL_TIPE: Record<TipeSoal, Teks> = {
  kaidah: { id: "Isi kaidah", en: "Complete the maxim", ar: "أتمّ القاعدة" },
  siapa: { id: "Siapa yang mengatakan", en: "Who said it", ar: "من القائل" },
  ayat: { id: "Tebak ayat / hadits", en: "Name the verse or hadith", ar: "عيّن الآية أو الحديث" },
  kasus: { id: "Kasus", en: "Case", ar: "نازلة" },
  urutan: { id: "Urutan / klasifikasi", en: "Order or classification", ar: "ترتيب أو تصنيف" },
  data: { id: "Angka dari kajian", en: "A figure from the lecture", ar: "رقم من اللقاء" },
};

/** The question, its four options and the explanation, in one language. */
export type Varian = {
  q: string;
  /** Exactly four, in the order A B C D. */
  o: [string, string, string, string];
  e: string;
};

export type Soal = {
  /** 1…30. The day it opens, and its number in the bank. */
  nomor: number;
  tipe: TipeSoal;
  /** The `id` of the part of the notes this came from — the anchor on /notes. */
  bagian: string;
  /** Where in that part, printed on the card: "Muqaddimah §1", "Question 1 (a)". */
  rujuk: Teks;
  varian: Record<BahasaTeks, Varian>;
  /** Index into `o` of the correct option. */
  jawab: 0 | 1 | 2 | 3;
};

export const SOAL: Soal[] = [
  {
    nomor: 1,
    tipe: "ayat",
    bagian: "muqaddimah",
    rujuk: { id: "Muqaddimah §1", en: "Introduction §1", ar: "المقدمة §١" },
    jawab: 1,
    varian: {
      id: {
        q: "Kata yang Allah pakai untuk menyifati wahyu dalam QS. Al-Muzzammil: 5 adalah…",
        o: ["Layyin (lembut)", "Tsaqil (berat)", "Yasir (mudah)", "Sahl (gampang)"],
        e: "إِنَّا سَنُلْقِي عَلَيْكَ قَوْلًا ثَقِيلًا — wahyu disifati berat, bukan ringan. Sifat ini muncul saat Allah bicara tentang ilmu, dakwah, Al-Qur’an, dan Sunnah.",
      },
      en: {
        q: "The word Allah uses to describe revelation in Al-Muzzammil: 5 is…",
        o: ["Layyin (soft)", "Thaqil (heavy)", "Yasir (easy)", "Sahl (simple)"],
        e: "Revelation is described as heavy, never light — the same tone appears whenever Allah speaks of knowledge, da’wah, the Qur’an and the Sunnah.",
      },
      ar: {
        q: "الكلمة التي وصف الله بها الوحي في سورة المزمل: ٥ هي…",
        o: ["ليّن", "ثقيل", "يسير", "سهل"],
        e: "﴿إِنَّا سَنُلْقِي عَلَيْكَ قَوْلًا ثَقِيلًا﴾ — وُصف الوحي بالثِّقَل لا بالخِفّة، وهذا الوصف يتكرر كلما ذُكر العلم والدعوة والقرآن والسنة.",
      },
    },
  },
  {
    nomor: 2,
    tipe: "ayat",
    bagian: "muqaddimah",
    rujuk: { id: "Muqaddimah §2", en: "Introduction §2", ar: "المقدمة §٢" },
    jawab: 2,
    varian: {
      id: {
        q: "Lima ayat pertama yang diterima Nabi ﷺ berasal dari surah…",
        o: ["Al-Muddatstsir", "Al-Muzzammil", "Al-‘Alaq", "Al-Fatihah"],
        e: "Iqra’ bismi Rabbikalladzi khalaq… (QS. Al-‘Alaq: 1–5). Lima ayat itu mengubah hidup Nabi ﷺ secara total — sementara kita masih bersantai.",
      },
      en: {
        q: "The first five verses received by the Prophet ﷺ are from Surah…",
        o: ["Al-Muddaththir", "Al-Muzzammil", "Al-‘Alaq", "Al-Fatihah"],
        e: "Iqra’ bismi Rabbik… (Al-‘Alaq 1–5) changed the Prophet’s life entirely — while we are still taking our ease.",
      },
      ar: {
        q: "الآيات الخمس الأولى التي نزلت على النبي ﷺ من سورة…",
        o: ["المدثر", "المزمل", "العلق", "الفاتحة"],
        e: "﴿اقرأ باسم ربك الذي خلق﴾ (العلق ١–٥). غيّرت هذه الآيات حياته ﷺ كلها — ونحن لا نزال في دَعَة.",
      },
    },
  },
  {
    nomor: 3,
    tipe: "siapa",
    bagian: "muqaddimah",
    rujuk: { id: "Muqaddimah §2", en: "Introduction §2", ar: "المقدمة §٢" },
    jawab: 1,
    varian: {
      id: {
        q: "Setelah wahyu pertama, Khadijah radhiyallahu ‘anha mengantar Nabi ﷺ menemui…",
        o: ["Abu Thalib", "Waraqah bin Naufal", "Abu Bakar", "Zaid bin ‘Amr"],
        e: "Nabi ﷺ pulang pucat, meminta diselimuti (زملوني), lalu diantar Khadijah kepada Waraqah bin Naufal (HR. Al-Bukhari no. 3).",
      },
      en: {
        q: "After the first revelation, Khadijah took the Prophet ﷺ to…",
        o: ["Abu Talib", "Waraqah ibn Nawfal", "Abu Bakr", "Zayd ibn ‘Amr"],
        e: "He came home pale, asked to be covered (زملوني), then Khadijah took him to Waraqah ibn Nawfal (Bukhari no. 3).",
      },
      ar: {
        q: "بعد نزول الوحي الأول انطلقت خديجة رضي الله عنها بالنبي ﷺ إلى…",
        o: ["أبي طالب", "ورقة بن نوفل", "أبي بكر", "زيد بن عمرو"],
        e: "رجع ﷺ وقد تغيّر لونه فقال: ”زمّلوني“، ثم انطلقت به خديجة إلى ورقة بن نوفل (رواه البخاري ٣).",
      },
    },
  },
  {
    nomor: 4,
    tipe: "kasus",
    bagian: "muqaddimah",
    rujuk: { id: "Muqaddimah §3", en: "Introduction §3", ar: "المقدمة §٣" },
    jawab: 1,
    varian: {
      id: {
        q: "Mengapa pertanyaan tentang ilmu di hari kiamat lebih berat bagi penuntut ilmu daripada orang awam?",
        o: [
          "Karena usianya lebih tua",
          "Karena ia mempelajari khilaf, Alfiyah Ibnu Malik, Qawa‘id Fiqhiyyah, dan Bidayatul Mujtahid — sementara orang awam tidak",
          "Karena ia wajib mengajar setelah lulus",
          "Karena ia tinggal di asrama",
        ],
        e: "وَعَنْ عِلْمِهِ فِيمَا فَعَلَ — potongan hadits riwayat At-Tirmidzi no. 2417. Masuk institut berarti memperkuat قولًا ثقيلًا dalam hidup, dan cara berpikir harus berubah.",
      },
      en: {
        q: "Why does the question about knowledge weigh more on a student of knowledge than on a layman?",
        o: [
          "Because he is older",
          "Because he studies juristic disagreement, the Alfiyya, the Qawa‘id Fiqhiyyah and Bidayat al-Mujtahid — a layman does not",
          "Because he must teach after graduating",
          "Because he lives in the dormitory",
        ],
        e: "“And about his knowledge, what he did with it” — part of a hadith narrated by At-Tirmidhi no. 2417. Entering the institute means taking on more of that heavy word, and the way one thinks has to change.",
      },
      ar: {
        q: "لم كان السؤال عن العلم يوم القيامة على طالب العلم أثقل منه على العامي؟",
        o: [
          "لأنه أكبر سنًا",
          "لأنه يدرس الخلاف وألفية ابن مالك والقواعد الفقهية وبداية المجتهد، والعامي لا يدرسها",
          "لأنه يلزمه التدريس بعد التخرج",
          "لأنه يسكن القسم الداخلي",
        ],
        e: "﴿وعن علمه فيما فعل﴾ — جزء من حديث رواه الترمذي برقم ٢٤١٧. والالتحاق بالمعهد زيادة في القول الثقيل، فلا بد أن تتغيّر طريقة التفكير.",
      },
    },
  },
  {
    nomor: 5,
    tipe: "kaidah",
    bagian: "muqaddimah",
    rujuk: { id: "Muqaddimah §4", en: "Introduction §4", ar: "المقدمة §٤" },
    jawab: 1,
    varian: {
      id: {
        q: "Makna “fardhu kifayah rasa fardhu ‘ain” dalam kajian adalah…",
        o: [
          "Semua ilmu wajib dipelajari setiap orang",
          "Karena kebutuhan umat belum tertutupi, tiap takhashshush terasa wajib bagi individu",
          "Fardhu kifayah lebih ringan dari fardhu ‘ain",
          "Hanya syariah yang fardhu ‘ain",
        ],
        e: "Indonesia ± 280 juta jiwa, ± 87% muslim. Kebutuhan dai belum terpenuhi, sehingga tiap takhashshush naik derajatnya.",
      },
      en: {
        q: "“Fard kifayah that feels like fard ‘ayn” means…",
        o: [
          "Everyone must learn every science",
          "Because the ummah’s need is unmet, every specialisation feels obligatory on each individual",
          "Fard kifayah is lighter than fard ‘ayn",
          "Only Shari’ah is fard ‘ayn",
        ],
        e: "Indonesia: ± 280 million people, ± 87% Muslim. The need is unmet, so every specialisation rises in weight.",
      },
      ar: {
        q: "معنى ”فرض كفاية بطعم فرض العين“ في اللقاء…",
        o: [
          "يجب على كل أحد أن يتعلم كل العلوم",
          "لمّا لم تُسدّ حاجة الأمة صار كل تخصص كالواجب على المعيّن",
          "فرض الكفاية أخف من فرض العين",
          "الشريعة وحدها فرض عين",
        ],
        e: "إندونيسيا نحو ٢٨٠ مليون نسمة، والمسلمون ٨٧٪. والحاجة إلى الدعاة لم تُسدّ، فارتفعت مرتبة كل تخصص.",
      },
    },
  },
  {
    nomor: 6,
    tipe: "siapa",
    bagian: "muqaddimah",
    rujuk: { id: "Muqaddimah §5", en: "Introduction §5", ar: "المقدمة §٥" },
    jawab: 2,
    varian: {
      id: {
        q: "Tahapan pertama dalam Madarijus Salikin karya Ibnul Qayyim adalah…",
        o: ["Taubah", "Muhasabah", "Yaqazhah (sadar)", "Tawakkal"],
        e: "Yaqazhah: sadar siapa diri kita, sadar tanggung jawab, lalu tetapkan apa yang harus dikerjakan hari ini.",
      },
      en: {
        q: "The first station in Ibn al-Qayyim’s Madarijus Salikin is…",
        o: ["Tawbah", "Muhasabah", "Yaqazhah (awakening)", "Tawakkul"],
        e: "Yaqazhah: know who you are, know your responsibility, then decide what must be done today.",
      },
      ar: {
        q: "أول المنازل في مدارج السالكين لابن القيم هو…",
        o: ["التوبة", "المحاسبة", "اليقظة", "التوكل"],
        e: "اليقظة: أن تعرف من أنت، وأن تعرف مسؤوليتك، ثم تحدد ما يجب عمله اليوم.",
      },
    },
  },
  {
    nomor: 7,
    tipe: "ayat",
    bagian: "muqaddimah",
    rujuk: { id: "Muqaddimah §5", en: "Introduction §5", ar: "المقدمة §٥" },
    jawab: 1,
    varian: {
      id: {
        q: "“…dan hendaklah setiap jiwa memperhatikan apa yang telah ia persiapkan untuk hari esok” adalah…",
        o: ["QS. Al-Baqarah: 286", "QS. Al-Hasyr: 18", "QS. At-Taghabun: 16", "QS. Adh-Dhuha: 11"],
        e: "QS. Al-Hasyr: 18 — kerangka berpikir hari akhir: tentukan dahulu apa yang ingin dipersembahkan di hadapan Maliki Yaumiddin, lalu persiapkan dari sekarang.",
      },
      en: {
        q: "“…and let every soul look to what it has put forth for tomorrow” is…",
        o: ["Al-Baqarah: 286", "Al-Hashr: 18", "At-Taghabun: 16", "Ad-Duha: 11"],
        e: "Al-Hashr: 18 — decide first what you want to present before the King of the Day of Judgement, then prepare from now.",
      },
      ar: {
        q: "﴿ولتنظر نفس ما قدمت لغد﴾ من سورة…",
        o: ["البقرة: ٢٨٦", "الحشر: ١٨", "التغابن: ١٦", "الضحى: ١١"],
        e: "الحشر: ١٨ — حدّد أولًا ما تريد تقديمه بين يدي مالك يوم الدين، ثم استعدّ له من الآن.",
      },
    },
  },
  {
    nomor: 8,
    tipe: "siapa",
    bagian: "pertanyaan-1",
    rujuk: { id: "Pertanyaan 1", en: "Question 1", ar: "السؤال الأول" },
    jawab: 3,
    varian: {
      id: {
        q: "Pembagian tiga bashirah dalam dakwah dinisbatkan Ustadz kepada…",
        o: ["Ibnul Qayyim", "Asy-Syathibi", "Syaikh Al-Albani", "Syaikh Ibnul ‘Utsaimin"],
        e: "Syaikh Ibnul ‘Utsaimin rahimahullah: bashirah terhadap ilmu, kondisi mad‘u, dan cara penyampaian.",
      },
      en: {
        q: "The threefold division of basirah in da’wah is attributed to…",
        o: ["Ibn al-Qayyim", "Ash-Shatibi", "Shaykh Al-Albani", "Shaykh Ibn al-‘Uthaymin"],
        e: "Shaykh Ibn al-‘Uthaymin, may Allah have mercy on him: basirah in knowledge, in the audience’s condition, and in the manner of delivery.",
      },
      ar: {
        q: "نسب الأستاذ تقسيم البصيرة في الدعوة إلى ثلاث إلى…",
        o: ["ابن القيم", "الشاطبي", "الشيخ الألباني", "الشيخ ابن عثيمين"],
        e: "الشيخ ابن عثيمين: بصيرة بما يدعو إليه، وبحال المدعو، وبكيفية الدعوة.",
      },
    },
  },
  {
    nomor: 9,
    tipe: "kaidah",
    bagian: "pertanyaan-1",
    rujuk: { id: "Pertanyaan 1 (a)", en: "Question 1 (a)", ar: "السؤال الأول (أ)" },
    jawab: 1,
    varian: {
      id: {
        q: "Lengkapi kaidah: “Tsabbitil ‘arsya tsumma ___”",
        o: ["ubni", "unqusy", "ta‘allam", "udrus"],
        e: "Tsummunqusy — tegakkan singgasana dahulu, baru diukir. Pastikan dalil valid sebelum membangun penjelasan.",
      },
      en: {
        q: "Complete the maxim: “Thabbit al-‘arsh thumma ___”",
        o: ["ubni", "unqush", "ta‘allam", "udrus"],
        e: "Thummunqush — set the throne first, then carve it. Verify the evidence before building the explanation.",
      },
      ar: {
        q: "أتمّ القاعدة: ”ثبّت العرش ثم ___“",
        o: ["ابنِ", "انقش", "تعلّم", "ادرس"],
        e: "”ثم انقش“ — أثبت العرش أولًا ثم انقشه. فتأكّد من صحة الدليل قبل أن تبني عليه الشرح.",
      },
    },
  },
  {
    nomor: 10,
    tipe: "kaidah",
    bagian: "pertanyaan-1",
    rujuk: { id: "Pertanyaan 1 (b)", en: "Question 1 (b)", ar: "السؤال الأول (ب)" },
    jawab: 1,
    varian: {
      id: {
        q: "Kaidah “Ahlu Makkah adra bisyi‘abiha” dipakai untuk menegaskan bashirah terhadap…",
        o: ["Ilmu yang disampaikan", "Kondisi mad‘u", "Cara penyampaian", "Niat dai"],
        e: "Penduduk Makkah paling tahu jalan-jalannya: dai harus memahami masyarakat dan daerahnya sendiri.",
      },
      en: {
        q: "“The people of Makkah know its valleys best” is used for basirah regarding…",
        o: [
          "The knowledge conveyed",
          "The audience’s condition",
          "The manner of delivery",
          "The preacher’s intention",
        ],
        e: "A preacher must know his own society and region.",
      },
      ar: {
        q: "قاعدة ”أهل مكة أدرى بشعابها“ سيقت لتقرير البصيرة بـ…",
        o: ["ما يُدعى إليه", "حال المدعو", "كيفية الدعوة", "نية الداعية"],
        e: "أهل مكة أعرف بطرقها: فعلى الداعية أن يعرف مجتمعه وبلده.",
      },
    },
  },
  {
    nomor: 11,
    tipe: "kasus",
    bagian: "pertanyaan-1",
    rujuk: { id: "Pertanyaan 1, nasihat 2", en: "Question 1, counsel 2", ar: "السؤال الأول، الوصية ٢" },
    jawab: 1,
    varian: {
      id: {
        q: "Ingin berdakwah di sebuah kota tertentu. Menurut kajian, kepada siapa sebaiknya mendekat?",
        o: [
          "Masyayikh yang paling terkenal namanya",
          "Guru yang memahami peta kota itu — atau dai yang berhasil di daerah berkarakter serupa",
          "Siapa saja, asalkan satu fakultas",
          "Tidak perlu guru; cukup belajar sendiri",
        ],
        e: "Ambil ilmu sesuai keunggulan guru: masyayikh dimaksimalkan untuk bashirah pertama, sedangkan untuk bashirah kedua dekatilah asatidzah yang berdakwah di Indonesia.",
      },
      en: {
        q: "You mean to preach in one particular city. Whom does the lecture say to draw close to?",
        o: [
          "The best-known shaykhs",
          "A teacher who knows that city’s map — or a preacher who has succeeded somewhere of similar character",
          "Anyone, as long as they are in your faculty",
          "No teacher is needed; study alone",
        ],
        e: "Take from each teacher what he is strongest in: the shaykhs for the first basirah, and for the second, the teachers working in Indonesia.",
      },
      ar: {
        q: "أردتَ الدعوة في مدينة بعينها. فبمن توصي الكلمةُ أن تلتصق؟",
        o: [
          "أشهر المشايخ اسمًا",
          "شيخ يعرف خريطة تلك المدينة — أو داعية نجح في بلد يشبهها طبعًا",
          "أيّ أحد ما دام من كليتك",
          "لا حاجة إلى شيخ؛ يكفي أن تتعلم وحدك",
        ],
        e: "خذ من كل شيخ ما برع فيه: المشايخ للبصيرة الأولى، وللثانية من يعمل في الدعوة داخل إندونيسيا.",
      },
    },
  },
  {
    nomor: 12,
    tipe: "urutan",
    bagian: "pertanyaan-1",
    rujuk: { id: "Pertanyaan 1, nasihat 1", en: "Question 1, counsel 1", ar: "السؤال الأول، الوصية ١" },
    jawab: 3,
    varian: {
      id: {
        q: "Manakah yang BUKAN bagian dari “tiga waktu” yang harus dibangun penuntut ilmu?",
        o: [
          "Belajar sendiri",
          "Belajar bersama teman",
          "Merapat kepada guru",
          "Aktif di media sosial",
        ],
        e: "Tiga waktu: sendiri, bersama teman, dan bersama guru/senior. Siapa yang memilikinya akan solid dalam jangka panjang.",
      },
      en: {
        q: "Which is NOT one of the “three times” a student must build?",
        o: [
          "Studying alone",
          "Studying with peers",
          "Drawing close to teachers",
          "Being active on social media",
        ],
        e: "Alone, with peers, with teachers or seniors — whoever has all three stays solid long-term.",
      },
      ar: {
        q: "أيّ هذه ليس من ”الأوقات الثلاثة“ التي يبنيها طالب العلم؟",
        o: [
          "الدرس وحده",
          "الدرس مع إخوانه",
          "القرب من شيخه",
          "النشاط في وسائل التواصل",
        ],
        e: "الأوقات الثلاثة: وحدك، ومع إخوانك، ومع شيخك أو من هو أكبر منك. ومن جمعها ثبت على المدى الطويل.",
      },
    },
  },
  {
    nomor: 13,
    tipe: "siapa",
    bagian: "pertanyaan-1",
    rujuk: { id: "Pertanyaan 1, nasihat 3", en: "Question 1, counsel 3", ar: "السؤال الأول، الوصية ٣" },
    jawab: 2,
    varian: {
      id: {
        q: "Hadits “Al-barakatu ma‘a akabirikum” (keberkahan bersama para senior) diriwayatkan oleh…",
        o: ["Al-Bukhari", "Muslim", "Ibnu Hibban", "At-Tirmidzi"],
        e: "HR. Ibnu Hibban no. 559, dinilai shahih oleh Syaikh Al-Albani. Lanjutkan estafet, jangan mulai dari nol.",
      },
      en: {
        q: "“Blessing is with your elders” is narrated by…",
        o: ["Al-Bukhari", "Muslim", "Ibn Hibban", "At-Tirmidhi"],
        e: "Ibn Hibban no. 559, graded sahih by Al-Albani. Continue the relay — don’t start from zero.",
      },
      ar: {
        q: "حديث ”البركة مع أكابركم“ رواه…",
        o: ["البخاري", "مسلم", "ابن حبان", "الترمذي"],
        e: "رواه ابن حبان رقم ٥٥٩، وصححه الألباني (الصحيحة ١٧٧٨). فواصل السباق ولا تبدأ من الصفر.",
      },
    },
  },
  {
    nomor: 14,
    tipe: "siapa",
    bagian: "pertanyaan-1",
    rujuk: { id: "Pertanyaan 1, nasihat 3", en: "Question 1, counsel 3", ar: "السؤال الأول، الوصية ٣" },
    jawab: 1,
    varian: {
      id: {
        q: "“Mulailah dari titik orang lain berhenti, jangan mulai dari titik orang lain memulai” adalah nasihat…",
        o: [
          "Imam Malik",
          "Salah seorang murid Syaikh Al-Albani",
          "Ibnul Qayyim",
          "Syaikh Ibnul ‘Utsaimin",
        ],
        e: "Ibda’ min haitsu intahan-nas. Sebagian hal harus dirintis, sebagian cukup melanjutkan apa yang sudah dilakukan oleh senior.",
      },
      en: {
        q: "“Begin where others ended, not where others began” is advice from…",
        o: [
          "Imam Malik",
          "A student of Shaykh Al-Albani",
          "Ibn al-Qayyim",
          "Shaykh Ibn al-‘Uthaymin",
        ],
        e: "Some things must be built from scratch; others only continue what seniors have already done.",
      },
      ar: {
        q: "”ابدأ من حيث انتهى الناس، ولا تبدأ من حيث بدأ الناس“ وصيةُ…",
        o: [
          "الإمام مالك",
          "أحد تلاميذ الشيخ الألباني",
          "ابن القيم",
          "الشيخ ابن عثيمين",
        ],
        e: "بعض الأمور لا بد من تأسيسها، وبعضها يكفي أن يُواصِل ما فعله من سبق.",
      },
    },
  },
  {
    nomor: 15,
    tipe: "kasus",
    bagian: "pertanyaan-1",
    rujuk: { id: "Pertanyaan 1, nasihat 5", en: "Question 1, counsel 5", ar: "السؤال الأول، الوصية ٥" },
    jawab: 2,
    varian: {
      id: {
        q: "Menurut kajian, Indonesia menjadi negeri muslim terbesar terutama karena…",
        o: ["Perang", "Perdebatan", "Akhlak para dai", "Kekuatan ekonomi"],
        e: "Sejarawan sepakat Islam masuk lewat akhlak; yang diperselisihkan hanya waktunya. Masyarakat lebih menyukai orang ramah daripada pandai berdebat.",
      },
      en: {
        q: "According to the lecture, Indonesia became the largest Muslim nation mainly through…",
        o: ["War", "Debate", "The preachers’ character", "Economic power"],
        e: "Historians agree Islam spread through good character; only the timing is disputed.",
      },
      ar: {
        q: "صارت إندونيسيا أكبر بلد مسلم — بحسب اللقاء — بسبب…",
        o: ["الحرب", "الجدال", "أخلاق الدعاة", "القوة الاقتصادية"],
        e: "اتفق المؤرخون أن الإسلام دخلها بالأخلاق، وإنما اختلفوا في الزمن. والناس يحبون اللطيف أكثر من المجادل.",
      },
    },
  },
  {
    nomor: 16,
    tipe: "kaidah",
    bagian: "pertanyaan-1",
    rujuk: { id: "Pertanyaan 1", en: "Question 1", ar: "السؤال الأول" },
    jawab: 1,
    varian: {
      id: {
        q: "Kaidah “al-jam‘u aula minat tarjih in amkana” bermakna…",
        o: [
          "Berjamaah lebih utama",
          "Menggabungkan keduanya lebih utama selama memungkinkan",
          "Mengumpulkan hadits lebih utama",
          "Yang banyak lebih utama",
        ],
        e: "Belajar bashirah di luar kampus, dikerjakan tanpa mengabaikan pelajaran kampus — gabungkan keduanya.",
      },
      en: {
        q: "The maxim “al-jam‘u awla min at-tarjih in amkana” means…",
        o: [
          "Congregation is better",
          "Combining both is better whenever possible",
          "Collecting hadith is better",
          "More is better",
        ],
        e: "Learn basirah outside campus without neglecting campus study — combine both.",
      },
      ar: {
        q: "معنى قاعدة ”الجمع أولى من الترجيح إن أمكن“…",
        o: [
          "صلاة الجماعة أفضل",
          "الجمع بين الأمرين أولى ما أمكن",
          "جمع الحديث أولى",
          "الأكثر أولى",
        ],
        e: "تعلّم البصيرة خارج المعهد من غير إهمال لدروسه — فاجمع بينهما.",
      },
    },
  },
  {
    nomor: 17,
    tipe: "kasus",
    bagian: "pertanyaan-1",
    rujuk: { id: "Pertanyaan 1 (b)", en: "Question 1 (b)", ar: "السؤال الأول (ب)" },
    jawab: 1,
    varian: {
      id: {
        q: "Untuk memahami kondisi mad‘u, selain ilmu syar‘i seorang dai perlu belajar…",
        o: [
          "Cukup ilmu syar‘i saja",
          "Sejarah, sosiologi, antropologi, adat, dan karakter masyarakat",
          "Public speaking saja",
          "Bahasa Inggris saja",
        ],
        e: "Fasih berbahasa Indonesia tidak otomatis membuat kita mampu berdakwah kepada orang Indonesia. Materi ini tidak diajarkan utuh di fakultas mana pun di institut, jadi harus dicari di luar kampus.",
      },
      en: {
        q: "To understand the condition of the audience, besides the religious sciences a preacher needs…",
        o: [
          "The religious sciences alone",
          "History, sociology, anthropology, custom and the character of a people",
          "Public speaking alone",
          "English alone",
        ],
        e: "Fluency in Indonesian does not by itself make one able to preach to Indonesians. None of this is taught whole in any faculty at the institute, so it must be sought outside.",
      },
      ar: {
        q: "لفهم حال المدعو، يحتاج الداعية إلى جانب العلم الشرعي أن يتعلّم…",
        o: [
          "العلم الشرعي وحده يكفي",
          "التاريخ وعلم الاجتماع والأنثروبولوجيا والعادات وطبائع الناس",
          "الخطابة وحدها",
          "الإنجليزية وحدها",
        ],
        e: "إتقان اللغة لا يجعل صاحبه قادرًا على دعوة أهلها. وهذا لا يُدرَّس كاملًا في أي كلية بالمعهد، فليُطلب خارجه.",
      },
    },
  },
  {
    nomor: 18,
    tipe: "kasus",
    bagian: "pertanyaan-1",
    rujuk: { id: "Pertanyaan 1, nasihat 4", en: "Question 1, counsel 4", ar: "السؤال الأول، الوصية ٤" },
    jawab: 1,
    varian: {
      id: {
        q: "Alasan berhati-hati dengan media sosial menurut kajian…",
        o: [
          "Kontennya cepat hilang",
          "Konten hari ini dapat dikorek habis 10–15 tahun lagi ketika seseorang sudah menjadi tokoh",
          "Media sosial tidak boleh dipakai berdakwah",
          "Tidak ada manfaatnya sama sekali",
        ],
        e: "Kepekaan seperti ini kebanyakan ada di level senior, bukan di level mahasiswa, secerdas apa pun ia. Ingin berdakwah di sana? Dekati tokoh yang terbukti kokoh di platform tersebut.",
      },
      en: {
        q: "Why the lecture urges caution on social media…",
        o: [
          "Posts disappear quickly",
          "What is posted today can be dug up in ten or fifteen years, once a person has become someone",
          "Social media may not be used for da’wah",
          "It has no benefit at all",
        ],
        e: "That sense mostly belongs to the senior level, not the student level, however bright the student. To preach there, draw close to someone proven on that platform.",
      },
      ar: {
        q: "سبب التحذير من وسائل التواصل في اللقاء…",
        o: [
          "لأن المنشور يزول سريعًا",
          "لأن ما يُنشر اليوم يُستخرج بعد عشر أو خمس عشرة سنة حين يصير صاحبه معروفًا",
          "لأن الدعوة فيها لا تجوز",
          "لأنه لا نفع فيها البتة",
        ],
        e: "وهذه الفطنة عند الكبار لا عند الطلاب مهما بلغ ذكاؤهم. فإن أردت الدعوة فيها فالزم من ثبتت قدمه في تلك المنصة.",
      },
    },
  },
  {
    nomor: 19,
    tipe: "kasus",
    bagian: "pertanyaan-3",
    rujuk: { id: "Pertanyaan 3 (e)", en: "Question 3 (e)", ar: "السؤال الثالث (هـ)" },
    jawab: 1,
    varian: {
      id: {
        q: "Menurut masyayikh, kegagalan melahirkan ulama berakar pada…",
        o: [
          "Kurangnya dana",
          "Lemahnya bahasa Arab",
          "Sedikitnya jumlah mahasiswa",
          "Kurangnya gedung dan fasilitas",
        ],
        e: "Bahasa adalah pintu peradaban. Kuncinya ada pada kekuatan kurikulum dan guru yang ahli — bukan pada keharusan mondok berasrama.",
      },
      en: {
        q: "According to the shaykhs, the failure to produce scholars is rooted in…",
        o: [
          "A shortage of funding",
          "Weak Arabic",
          "Too few students",
          "A shortage of buildings",
        ],
        e: "Language is the door to a civilisation. The key is a strong curriculum and expert teachers — not a residential school.",
      },
      ar: {
        q: "يرى المشايخ أن التقصير في تخريج العلماء أصله…",
        o: [
          "قلة التمويل",
          "ضعف اللغة العربية",
          "قلة عدد الطلاب",
          "قلة المباني والمرافق",
        ],
        e: "واللغة باب الحضارة. والمدار على قوة المنهج وكفاءة المعلم — لا على السكن الداخلي.",
      },
    },
  },
  {
    nomor: 20,
    tipe: "siapa",
    bagian: "pertanyaan-5",
    rujuk: { id: "Pertanyaan 5 (c)", en: "Question 5 (c)", ar: "السؤال الخامس (ج)" },
    jawab: 2,
    varian: {
      id: {
        q: "Menurut sebagian salaf yang dinukil Asy-Syathibi, sifat buruk terakhir yang keluar dari hati orang saleh adalah…",
        o: ["Riya’", "Hasad", "Cinta popularitas (hubbusy syuhrah)", "Kikir"],
        e: "Karena itu ilmu tentang hati dan tazkiyatun nufus adalah disiplin tersendiri — punya kitab dan talaqqi seperti fikih dan ushul — dan tidak diajarkan di ma‘had.",
      },
      en: {
        q: "Some of the early generations, as Ash-Shatibi quotes, held the last bad trait to leave a righteous heart is…",
        o: ["Showing off", "Envy", "Love of fame", "Miserliness"],
        e: "Which is why the science of the heart and the purification of the soul is a discipline in its own right — with its books and its transmission, like fiqh and usul — and it is not taught at the institute.",
      },
      ar: {
        q: "نقل الشاطبي عن بعض السلف أن آخر ما يخرج من قلوب الصالحين…",
        o: ["الرياء", "الحسد", "حب الشهرة", "البخل"],
        e: "ولذلك كان علم القلوب وتزكية النفوس فنًّا مستقلًا له كتبه وتلقّيه كالفقه والأصول، وهو لا يُدرَّس في المعهد.",
      },
    },
  },
  {
    nomor: 21,
    tipe: "kaidah",
    bagian: "pertanyaan-3",
    rujuk: { id: "Pertanyaan 3", en: "Question 3", ar: "السؤال الثالث" },
    jawab: 1,
    varian: {
      id: {
        q: "Kaidah yang Ustadz pakai membuka jawaban tentang Fakultas Idarah: “al-hukmu ‘alasy-syai’i far‘un ‘an ___”",
        o: ["dalilihi", "tashawwurihi", "maqashidihi", "‘illatihi"],
        e: "Menghukumi sesuatu bergantung pada pemahaman terhadap gambaran utuhnya, karena beliau tidak punya gambaran utuh maka nasihatnya bersifat umum.",
      },
      en: {
        q: "The maxim opening the Idarah answer: “judging a thing is a branch of ___ it”",
        o: ["proving", "conceiving", "intending", "causing"],
        e: "Judgement depends on one’s conception of the matter — hence his advice stayed general.",
      },
      ar: {
        q: "القاعدة التي افتتح بها جواب كلية الإدارة: ”الحكم على الشيء فرع عن ___“",
        o: ["دليله", "تصوره", "مقاصده", "علته"],
        e: "الحكم تابع للتصور — ولم يكن عنده تصور كامل عن الكلية، فجاءت النصيحة عامة.",
      },
    },
  },
  {
    nomor: 22,
    tipe: "siapa",
    bagian: "pertanyaan-3",
    rujuk: { id: "Pertanyaan 3, tambahan", en: "Question 3, addendum", ar: "السؤال الثالث، زيادة" },
    jawab: 0,
    varian: {
      id: {
        q: "Pesan “‘Alaikum bit-takhashshush” (tekuni spesialisasi) disampaikan oleh…",
        o: [
          "Syaikh Zaid Abdul Karim Zaid",
          "Syaikh Shalih Al-‘Ushaimi",
          "Syaikh Masyhur Hasan",
          "Ustadz Ibrahim Said",
        ],
        e: "Dosen Ustadz saat S2. Tidak ada lagi ulama mutafannin seperti Asy-Syafi‘i; mayoritas hanya mampu ahli di satu bidang.",
      },
      en: {
        q: "“Devote yourselves to specialisation” was advised by…",
        o: [
          "Shaykh Zayd ‘Abd al-Karim Zayd",
          "Shaykh Salih Al-‘Usaymi",
          "Shaykh Mashhur Hasan",
          "Ustadz Ibrahim Said",
        ],
        e: "His postgraduate lecturer. No more polymath scholars like Ash-Shafi‘i; most can master only one field.",
      },
      ar: {
        q: "”عليكم بالتخصص“ وصيةُ…",
        o: [
          "الشيخ زيد عبد الكريم زيد",
          "الشيخ صالح العصيمي",
          "الشيخ مشهور حسن",
          "الأستاذ إبراهيم سعيد",
        ],
        e: "أستاذ الأستاذ في الماجستير. ولم يبقَ عالم متفنن كالشافعي؛ وأكثر الناس لا يتقن إلا فنًا واحدًا.",
      },
    },
  },
  {
    nomor: 23,
    tipe: "kasus",
    bagian: "pertanyaan-3",
    rujuk: { id: "Pertanyaan 3 (d)", en: "Question 3 (d)", ar: "السؤال الثالث (د)" },
    jawab: 1,
    varian: {
      id: {
        q: "Kasus: mahasiswa Idarah minder terhadap mahasiswa Syariah. Sikap yang sesuai kajian…",
        o: [
          "Pindah ke Syariah",
          "Sadari semua fakultas saling membutuhkan; jadi ahli di bidangnya di atas ta’shil",
          "Berhenti kuliah",
          "Fokus hafalan saja",
        ],
        e: "Tidak ada kasta antarfakultas. Lulusan syariah tidak bisa membangun pondok tanpa manajemen. Ahli manajemen berakidah kuat + literasi Arab hampir tanpa pesaing.",
      },
      en: {
        q: "Case: an Idarah student feels inferior to Shari’ah students. The fitting attitude…",
        o: [
          "Transfer to Shari’ah",
          "Realise all faculties need each other; master your field on strong foundations",
          "Drop out",
          "Focus on memorising only",
        ],
        e: "No caste between faculties. A manager with sound creed and Arabic literacy has almost no competitor.",
      },
      ar: {
        q: "نازلة: طالب في الإدارة يستصغر نفسه أمام طلاب الشريعة. والموقف الموافق للقاء…",
        o: [
          "ينتقل إلى الشريعة",
          "يدرك أن الكليات يحتاج بعضها بعضًا، فيتقن تخصصه على تأصيل",
          "يترك الدراسة",
          "يقتصر على الحفظ",
        ],
        e: "لا طبقية بين الكليات. وخريج الشريعة لا يبني معهدًا بلا إدارة. ومن أتقن الإدارة مع عقيدة صحيحة وعربية فلا يكاد يُنازَع.",
      },
    },
  },
  {
    nomor: 24,
    tipe: "urutan",
    bagian: "pertanyaan-4",
    rujuk: { id: "Pertanyaan 4 (b)", en: "Question 4 (b)", ar: "السؤال الرابع (ب)" },
    jawab: 1,
    varian: {
      id: {
        q: "Dua bisikan setan pada setiap perintah Allah menurut Ibnul Qayyim adalah…",
        o: ["Riya’ dan sum‘ah", "Ifrath dan tafrith", "Syirik dan bid‘ah", "Malas dan sombong"],
        e: "Ifrath (berlebihan) dan tafrith (meremehkan) — Madarijus Salikin. Terlalu sibuk di luar kampus itu ifrath, tidak belajar bashirah dalam dakwah itu tafrith.",
      },
      en: {
        q: "The two whispers of Shaytan on every command, per Ibn al-Qayyim…",
        o: [
          "Showing off and seeking fame",
          "Excess and neglect",
          "Shirk and bid‘ah",
          "Laziness and pride",
        ],
        e: "Ifrat (excess) and tafrit (neglect). Being too busy outside campus is ifrat; not learning the basirah of da’wah is tafrit.",
      },
      ar: {
        q: "نزغتا الشيطان في كل أمر أمر الله به — عند ابن القيم — هما…",
        o: ["الرياء والسمعة", "الإفراط والتفريط", "الشرك والبدعة", "الكسل والكبر"],
        e: "الإفراط والتفريط — مدارج السالكين. فالانشغال الزائد خارجًا إفراط، وترك تعلّم البصيرة تفريط.",
      },
    },
  },
  {
    nomor: 25,
    tipe: "kasus",
    bagian: "pertanyaan-4",
    rujuk: { id: "Pertanyaan 4 (b)", en: "Question 4 (b)", ar: "السؤال الرابع (ب)" },
    jawab: 2,
    varian: {
      id: {
        q: "Kasus: terlalu sibuk kegiatan luar hingga sering izin kuliah. Solusi menurut kajian…",
        o: [
          "Berhenti total dari kegiatan luar",
          "Keluar dari kampus",
          "Kurangi porsi kesibukan di luar kampus hingga kembali seimbang (i‘tidal)",
          "Biarkan saja",
        ],
        e: "Solusinya bukan berhenti total tetapi mengurangi porsi kesibukan di luar kampus. Masyayikh mendukung belajar bermasyarakat selama tidak menyebabkan taqshir.",
      },
      en: {
        q: "Case: too busy outside campus, often skipping class. The lecture’s solution…",
        o: [
          "Quit all outside activity",
          "Leave campus",
          "Reduce the portion of outside activity until it balances (i‘tidal)",
          "Ignore it",
        ],
        e: "Not a full stop but a smaller portion of outside activity; the shaykhs support outside growth as long as it causes no negligence.",
      },
      ar: {
        q: "نازلة: كثُر انشغاله خارج المعهد حتى صار يتغيّب. والحل في اللقاء…",
        o: [
          "يترك كل نشاط خارجي",
          "يترك المعهد",
          "يقلل حصة انشغاله خارج المعهد حتى يعود الاعتدال",
          "يتركه على حاله",
        ],
        e: "ليس الحل الترك بالكلية بل تقليل حصة الانشغال خارج المعهد. والمشايخ يشجعون مخالطة الناس ما لم تُورث تقصيرًا.",
      },
    },
  },
  {
    nomor: 26,
    tipe: "kaidah",
    bagian: "pertanyaan-4",
    rujuk: { id: "Pertanyaan 4 (c)", en: "Question 4 (c)", ar: "السؤال الرابع (ج)" },
    jawab: 1,
    varian: {
      id: {
        q: "Implikasi “al-‘ibrah bil-ghalib la bin-nadir” terhadap nilai buruk di satu mata kuliah…",
        o: [
          "Menggugurkan amanah beasiswa",
          "Tidak menggugurkan amanah selama secara umum menunaikan amanah",
          "Harus mengulang tahun",
          "Tidak boleh mengajar selamanya",
        ],
        e: "Patokannya adalah yang dominan. Ibnul Qayyim dalam kitab Al-Wabil ash-Shayyib mengatakan orang saleh adalah yang kebaikannya lebih banyak daripada dosanya.",
      },
      en: {
        q: "The implication of “what counts is the predominant, not the rare” for one bad grade…",
        o: [
          "It voids the scholarship trust",
          "It does not void the trust as long as he is generally faithful",
          "He must repeat the year",
          "He may never teach",
        ],
        e: "The predominant state counts. The righteous is one whose good outweighs his sins.",
      },
      ar: {
        q: "أثر قاعدة ”العبرة بالغالب لا بالنادر“ في درجة ضعيفة في مادة واحدة…",
        o: [
          "تُسقط أمانة المنحة",
          "لا تُسقط الأمانة ما دام في الجملة حريصًا عليها",
          "يلزمه إعادة السنة",
          "لا يجوز له التعليم أبدًا",
        ],
        e: "المعتبر الغالب. قال ابن القيم في الوابل الصيب: الصالح من غلبت حسناته سيئاته.",
      },
    },
  },
  {
    nomor: 27,
    tipe: "siapa",
    bagian: "pertanyaan-5",
    rujuk: { id: "Pertanyaan 5 (a)", en: "Question 5 (a)", ar: "السؤال الخامس (أ)" },
    jawab: 0,
    varian: {
      id: {
        q: "“Iyyaka wat-ta‘mimat, ‘alaika bit-tafshil” (jangan mengeneralisir, tapi rincikanlah) adalah nasihat…",
        o: [
          "Syaikh Masyhur Hasan Alu Salman",
          "Ibnul Qayyim",
          "Imam Malik",
          "Syaikh Ibnul ‘Utsaimin",
        ],
        e: "Buah ta’shil adalah cara berpikir yang tidak menggeneralisasi; setiap pendapat mu‘tamad punya syarat dan batasan.",
      },
      en: {
        q: "“Beware of generalisations; be detailed” is advice from…",
        o: [
          "Shaykh Mashhur Hasan Al Salman",
          "Ibn al-Qayyim",
          "Imam Malik",
          "Shaykh Ibn al-‘Uthaymin",
        ],
        e: "The fruit of solid grounding is a mind that does not generalise.",
      },
      ar: {
        q: "”إياك والتعميمات، عليك بالتفصيل“ وصيةُ…",
        o: [
          "الشيخ مشهور حسن آل سلمان",
          "ابن القيم",
          "الإمام مالك",
          "الشيخ ابن عثيمين",
        ],
        e: "وثمرة التأصيل عقل لا يعمّم؛ فلكل قول معتمد شروطه وقيوده.",
      },
    },
  },
  {
    nomor: 28,
    tipe: "data",
    bagian: "pertanyaan-5",
    rujuk: { id: "Pertanyaan 5 (c)", en: "Question 5 (c)", ar: "السؤال الخامس (ج)" },
    jawab: 2,
    varian: {
      id: {
        q: "Imam Malik berkata beliau tidak berfatwa hingga berapa ulama bersaksi bahwa beliau layak?",
        o: ["7", "40", "70", "100"],
        e: "Ma aftaitu hatta syahida lii sab‘un — Hilyah al-Auliya’. Keraguan diri itu wajar; solusinya lingkungan, guru, dan senior.",
      },
      en: {
        q: "Imam Malik said he did not issue fatwa until how many scholars testified he was qualified?",
        o: ["7", "40", "70", "100"],
        e: "Seventy — Hilyat al-Awliya’. Self-doubt is natural; the cure is environment, teachers and seniors.",
      },
      ar: {
        q: "قال الإمام مالك: ما أفتيتُ حتى شهد لي كم من العلماء أني أهل لذلك؟",
        o: ["٧", "٤٠", "٧٠", "١٠٠"],
        e: "”ما أفتيت حتى شهد لي سبعون“ — حلية الأولياء. والشك في النفس طبيعي، وعلاجه صحبةٌ وشيخٌ وكبار.",
      },
    },
  },
  {
    nomor: 29,
    tipe: "kasus",
    bagian: "pertanyaan-5",
    rujuk: { id: "Pertanyaan 5 (c)", en: "Question 5 (c)", ar: "السؤال الخامس (ج)" },
    jawab: 1,
    varian: {
      id: {
        q: "Kalimat “faqad qil” dalam HR. Muslim no. 1905 menunjukkan bahwa orang tersebut…",
        o: [
          "Gagal dan tidak dikenal",
          "Berhasil populer di dunia, tetapi niatnya salah",
          "Tidak pernah belajar",
          "Bertaubat di akhir",
        ],
        e: "Hadits ini berbicara tentang orang yang terlihat sukses di dunia, bukan yang gagal — peringatan bagi yang merasa cukup dengan kapasitas ilmiah tanpa tazkiyatun nufus.",
      },
      en: {
        q: "“Fa-qad qil” in Muslim no. 1905 shows the person…",
        o: [
          "Failed and was unknown",
          "Succeeded in fame, but with a corrupt intention",
          "Never studied",
          "Repented at the end",
        ],
        e: "The hadith speaks of the one who looks successful in this world, not of the failed — a warning to those content with knowledge without purification.",
      },
      ar: {
        q: "قوله ”فقد قيل“ في حديث مسلم ١٩٠٥ يدل على أن صاحبه…",
        o: [
          "أخفق ولم يُعرف",
          "نال الشهرة فعلًا لكن نيته فاسدة",
          "لم يتعلم قط",
          "تاب في آخر عمره",
        ],
        e: "الحديث فيمن ظهر نجاحه في الدنيا لا في الفاشل — وهو تحذير لمن اكتفى بالأهلية العلمية دون تزكية النفس.",
      },
    },
  },
  {
    nomor: 30,
    tipe: "kasus",
    bagian: "pertanyaan-6",
    rujuk: { id: "Pertanyaan 6", en: "Question 6", ar: "السؤال السادس" },
    jawab: 2,
    varian: {
      id: {
        q: "Bidang dakwah paling strategis bagi akhwat menurut Ustadz adalah…",
        o: [
          "Pesantren putri",
          "Media sosial",
          "Pendidikan usia dini (TK & SD kelas awal)",
          "Kajian umum",
        ],
        e: "TK unggulan di Jakarta mayoritas sekolah internasional dan diadakan oleh negara luar.",
      },
      en: {
        q: "The most strategic field of da’wah for sisters, per the Ustadz…",
        o: [
          "Girls’ boarding schools",
          "Social media",
          "Early childhood education (kindergarten & early primary)",
          "Public lectures",
        ],
        e: "Most of the leading kindergartens in Jakarta are international schools, set up by other states.",
      },
      ar: {
        q: "أهم ميدان دعوي للأخوات عند الأستاذ…",
        o: [
          "معاهد البنات الداخلية",
          "وسائل التواصل",
          "التعليم في الطفولة المبكرة (الروضة والصفوف الأولى)",
          "الدروس العامة",
        ],
        e: "وأكثر رياض الأطفال المتميزة في جاكرتا مدارس دولية أنشأتها دول أخرى.",
      },
    },
  },
];

export const JUMLAH_SOAL = SOAL.length;

/** Question N, or null when N is outside 1…30. */
export function soalKe(nomor: number): Soal | null {
  return SOAL.find((s) => s.nomor === nomor) ?? null;
}
