/*
 * Programme Hub: the three clubs and the Tilawa Labs Fest competitions, as the public site shows
 * them.
 *
 * Written here rather than stored in the database: none of it changes between events,
 * the committee sent it as proposals, and there is no WhatsApp group to manage yet.
 * The proposals are long; the site deliberately says much less. Each layer only
 * carries what a reader needs to decide whether to go one step deeper:
 *
 *   teaser (home page)  →  hook + two chips
 *   /hub/[club]         →  benefits, how a session runs, a few activities
 *   "Read more"         →  the longer background, folded away
 *
 * Participants see English or Arabic only (see lib/i18n/dict.ts).
 */
import type { Lang } from "@/lib/i18n/dict";

export type Teks = Record<Lang, string>;

export const CLUB_KEYS = ["english", "arabic", "mabit"] as const;
export type ClubKey = (typeof CLUB_KEYS)[number];

export function isClub(v: unknown): v is ClubKey {
  return typeof v === "string" && (CLUB_KEYS as readonly string[]).includes(v);
}

/** The Tilawa Labs Fest competitions, each with its own interest key `fest-<key>`. */
export const LOMBA_KEYS = ["fest-olimpiade", "fest-karya", "fest-mhq"] as const;
export type LombaKey = (typeof LOMBA_KEYS)[number];

/**
 * Everything someone can ask to be kept posted on: the three clubs, Tilawa Labs Fest as a
 * whole, and each Fest competition. Stored in `minat_club.club`.
 *
 * Two buttons record a group rather than one key: "semua" records every key, and
 * "fest" records Tilawa Labs Fest together with all three competitions — someone who wants
 * news of the Fest wants news of each part of it.
 */
export const MINAT_KEYS = [...CLUB_KEYS, "fest", ...LOMBA_KEYS] as const;
export type MinatKey = (typeof MINAT_KEYS)[number];

/** The four cards: each club, and Tilawa Labs Fest. */
export const PINTU_KEYS = [...CLUB_KEYS, "fest"] as const;
export type PintuKey = (typeof PINTU_KEYS)[number];

export function isMinat(v: unknown): v is MinatKey {
  return typeof v === "string" && (MINAT_KEYS as readonly string[]).includes(v);
}

export type KunciTombol = MinatKey | "semua";

export function isKunciTombol(v: unknown): v is KunciTombol {
  return v === "semua" || isMinat(v);
}

/** The keys one button records. */
export function kunciDari(k: KunciTombol): MinatKey[] {
  if (k === "semua") return [...MINAT_KEYS];
  if (k === "fest") return ["fest", ...LOMBA_KEYS];
  return [k];
}

export function isLomba(v: unknown): v is LombaKey {
  return typeof v === "string" && (LOMBA_KEYS as readonly string[]).includes(v);
}

/** Where a club or Tilawa Labs Fest lives on the site, so the button can come back to it. */
export function halamanMinat(lang: Lang, k: MinatKey): string {
  return isLomba(k) ? `/${lang}/hub/fest#${k}` : `/${lang}/hub/${k}`;
}

/** Below this, "N people are interested" reads as "almost nobody" and is left out. */
export const AMBANG_JUMLAH_MINAT = 10;

/**
 * The short questionnaire a club asks the moment someone says they are interested,
 * so the committee can group people before the first session. Only Majma' al-Lughah
 * asks for now; a club with no entry records interest in one tap, as before. Answers
 * are stored on `minat_club.jawaban` keyed by `id`; a `pilihan` question stores the
 * option's `value`, a free-text one the trimmed text.
 */
export type Pertanyaan = {
  id: string;
  teks: { en: string; ar: string };
  /** With `pilihan`: one option must be picked. Without: a free-text answer. */
  pilihan?: Array<{ value: string; label: { en: string; ar: string } }>;
};

export const MAKS_JAWABAN = 1000;

export const PERTANYAAN_CLUB: Partial<Record<ClubKey, Pertanyaan[]>> = {
  arabic: [
    {
      id: "lama_belajar",
      teks: { en: "How many years have you studied Arabic?", ar: "كم سنة درست اللغة العربية؟" },
      pilihan: [
        { value: "kurang_setahun", label: { en: "Less than a year", ar: "أقل من سنة" } },
        { value: "setahun", label: { en: "One year", ar: "سنة واحدة" } },
        { value: "lebih_setahun", label: { en: "More than a year", ar: "أكثر من سنة" } },
      ],
    },
    {
      id: "tantangan",
      teks: {
        en: "Write down the challenges you face while studying Arabic.",
        ar: "اكتب التحديات التي تواجهها أثناء دراسة اللغة العربية.",
      },
    },
    {
      id: "tujuan",
      teks: {
        en: "What is your goal in joining Majma' al-Lughah al-'Arabiyyah?",
        ar: "ما الهدف من انضمامك إلى مجمع اللغة العربية؟",
      },
    },
  ],
};

/**
 * The same questions addressed to a sister, where Arabic conjugates for her. English
 * needs no change. Keyed by question id; anything not listed keeps the default wording.
 */
export const PERTANYAAN_AKHWAT: Record<string, string> = {
  lama_belajar: "كم سنة درستِ اللغة العربية؟",
  tantangan: "اكتبي التحديات التي تواجهينها أثناء دراسة اللغة العربية.",
  tujuan: "ما الهدف من انضمامكِ إلى مجمع اللغة العربية؟",
};

export function pertanyaanClub(club: ClubKey): Pertanyaan[] {
  return PERTANYAAN_CLUB[club] ?? [];
}

export function teksPertanyaan(q: Pertanyaan, lang: Lang, gender?: string | null): string {
  if (lang === "ar" && gender === "akhwat") return PERTANYAAN_AKHWAT[q.id] ?? q.teks.ar;
  return q.teks[lang];
}

/** A stored answer as the committee reads it: the option's English label, or the text itself. */
export function bacaJawaban(club: string, jawaban: Record<string, string> | null | undefined): Array<{ q: Pertanyaan; a: string }> {
  if (!isClub(club) || !jawaban) return [];
  return pertanyaanClub(club).flatMap((q) => {
    const v = jawaban[q.id];
    if (typeof v !== "string" || !v) return [];
    const opsi = q.pilihan?.find((o) => o.value === v);
    return [{ q, a: opsi ? opsi.label.en : v }];
  });
}

export type Club = {
  key: ClubKey;
  nama: Teks;
  /** One line. The only sentence on the home page. */
  hook: Teks;
  chips: Teks[];
  /** Two sentences at most, under the hook on the club page. */
  ringkas: Teks;
  manfaat: { judul: Teks; teks: Teks }[];
  sesi: { judul: Teks; langkah: { label: Teks; waktu?: Teks; teks: Teks }[] };
  aktivitas: { nama: Teks; teks: Teks }[];
  selengkapnya: { judul: Teks; teks: Teks }[];
};

export const CLUB: Record<ClubKey, Club> = {
  english: {
    key: "english",
    nama: { en: "Tilawa Labs English Club", ar: "نادي نَوَى للغة الإنجليزية" },
    hook: {
      en: "Your sharia knowledge, in the language the world listens in.",
      ar: "علمك الشرعي، باللغة التي يُصغي إليها العالم.",
    },
    chips: [
      { en: "Weekly · 60 minutes", ar: "أسبوعيًا · ٦٠ دقيقة" },
      { en: "Games & da'wah role play", ar: "ألعاب ومحاكاة دعوية" },
    ],
    ringkas: {
      en: "An informal club for the institute students who already have a good base in English. Learning by doing: you speak, play and practise da'wah, without the fear of getting the grammar wrong.",
      ar: "نادٍ غير رسمي لطلاب جامعة الإمام بجاكرتا ممن لديهم أساس جيد في الإنجليزية. نتعلّم بالممارسة: تتكلّم وتلعب وتتدرّب على الدعوة دون خوف من أخطاء القواعد.",
    },
    manfaat: [
      {
        judul: { en: "Confidence to speak", ar: "ثقة في الكلام" },
        teks: {
          en: "Warm-up games that take the nerves out of speaking English.",
          ar: "ألعاب تمهيدية تزيل رهبة الحديث بالإنجليزية.",
        },
      },
      {
        judul: { en: "Da'wah for a global audience", ar: "دعوة لجمهور عالمي" },
        teks: {
          en: "Practise explaining worship, fiqh and akhlaq to new Muslims from abroad.",
          ar: "تدرّب على شرح العبادات والفقه والأخلاق للمسلمين الجدد من غير العرب.",
        },
      },
      {
        judul: { en: "Dual-trained", ar: "تأهيل مزدوج" },
        teks: {
          en: "Classical 'ilm and fluent English: the two tracks today's da'i needs.",
          ar: "العلم الشرعي الأصيل مع الطلاقة في الإنجليزية: مساران يحتاجهما الداعية اليوم.",
        },
      },
    ],
    sesi: {
      judul: { en: "One session, 60 minutes", ar: "جلسة واحدة، ٦٠ دقيقة" },
      langkah: [
        {
          label: { en: "Warmer", ar: "تمهيد" },
          waktu: { en: "5–10 min", ar: "٥–١٠ د" },
          teks: { en: "A quick vocabulary game to break the ice.", ar: "لعبة مفردات سريعة لكسر الجمود." },
        },
        {
          label: { en: "Main activity", ar: "النشاط الرئيس" },
          waktu: { en: "20–30 min", ar: "٢٠–٣٠ د" },
          teks: {
            en: "Pair or group work: conversations and debates on da'wah, society and Islamic history.",
            ar: "عمل ثنائي أو جماعي: حوارات ومناظرات في الدعوة والمجتمع والتاريخ الإسلامي.",
          },
        },
        {
          label: { en: "Feedback", ar: "التقويم" },
          waktu: { en: "10 min", ar: "١٠ د" },
          teks: {
            en: "Good sentences praised, mistakes corrected together, never by name.",
            ar: "إشادة بالجمل الجيدة وتصحيح جماعي للأخطاء دون تسمية أحد.",
          },
        },
        {
          label: { en: "Closing", ar: "الختام" },
          waktu: { en: "5–10 min", ar: "٥–١٠ د" },
          teks: { en: "A game or mime to test the new words.", ar: "لعبة أو تمثيل صامت لاختبار المفردات الجديدة." },
        },
      ],
    },
    aktivitas: [
      {
        nama: { en: "Hot Seat", ar: "الكرسي الساخن" },
        teks: {
          en: "Guess the da'wah keyword (charity, fasting…) your team describes, in one minute.",
          ar: "خمّن الكلمة الدعوية (الصدقة، الصيام…) التي يصفها فريقك خلال دقيقة.",
        },
      },
      {
        nama: { en: "Whispering Hadith", ar: "الحديث الهامس" },
        teks: {
          en: "Pass a short hadith in English down the line, keeping its pronunciation intact.",
          ar: "مرّر حديثًا قصيرًا بالإنجليزية همسًا مع الحفاظ على نطقه.",
        },
      },
      {
        nama: { en: "Da'wah role play", ar: "محاكاة دعوية" },
        teks: {
          en: "One of you is the da'i, the other a new Muslim with real questions.",
          ar: "أحدكما داعية والآخر مسلم جديد يسأل أسئلة حقيقية.",
        },
      },
      {
        nama: { en: "Storytelling & podcast", ar: "القصص والبودكاست" },
        teks: {
          en: "Short scripts on the Companions and Islamic civilisation, told the way today's audience listens.",
          ar: "نصوص قصيرة عن الصحابة والحضارة الإسلامية بأسلوب يناسب جمهور اليوم.",
        },
      },
    ],
    selengkapnya: [
      {
        judul: { en: "Why an English club at a sharia campus", ar: "لماذا نادٍ للإنجليزية في جامعة شرعية" },
        teks: {
          en: "What holds most non-native speakers back is not written English but nerves and too little relaxed practice. Studies of language clubs show a strong correlation between taking part and speaking skill. And English-speaking new Muslims need guidance straight from graduates of sharia, without meaning lost in translation.",
          ar: "أكثر ما يعيق غير الناطقين بالإنجليزية ليس الكتابة بل رهبة الحديث وقلة الممارسة المريحة. وتُظهر دراسات أندية اللغة ارتباطًا قويًا بين المشاركة ومهارة الكلام. والمسلمون الجدد الناطقون بالإنجليزية يحتاجون إلى توجيه مباشر من خريجي العلوم الشرعية دون أن يضيع المعنى في الترجمة.",
        },
      },
      {
        judul: { en: "How the club grows", ar: "مراحل النادي" },
        teks: {
          en: "First, a light interview to find members who can become peer tutors. Then the weekly sessions. Later, a short English da'wah podcast and work with local English-speaking communities.",
          ar: "أولًا مقابلة خفيفة لاختيار أعضاء يصلحون مدرّسين للأقران، ثم الجلسات الأسبوعية، ثم بودكاست دعوي قصير بالإنجليزية وتعاون مع مجتمعات ناطقة بالإنجليزية.",
        },
      },
    ],
  },

  arabic: {
    key: "arabic",
    nama: { en: "Majma' al-Lughah al-'Arabiyyah", ar: "مجمع اللغة العربية" },
    hook: {
      en: "Bring Arabic to life outside the lecture hall.",
      ar: "أحيِ العربية خارج قاعة المحاضرة.",
    },
    chips: [
      { en: "Weekly hiwar", ar: "حوار أسبوعي" },
      { en: "Trips & meals in Arabic", ar: "رحلات ووجبات بالعربية" },
    ],
    ringkas: {
      en: "A gathering for students who want to sharpen their speaking and listening and build an Arabic-speaking environment, through activities that are actually fun.",
      ar: "ملتقى للطلاب الراغبين في تنمية مهارتي الكلام والاستماع وبناء بيئة عربية، من خلال أنشطة ممتعة.",
    },
    manfaat: [
      {
        judul: { en: "Speak every week", ar: "تكلّم كل أسبوع" },
        teks: {
          en: "Small groups of 3–4, each with a mudabbir, and 5–10 minutes that are yours to speak.",
          ar: "مجموعات صغيرة من ٣–٤ مع مدبّر لكل مجموعة، ولك ٥–١٠ دقائق للحديث.",
        },
      },
      {
        judul: { en: "Listen and collect", ar: "استمع ودوّن" },
        teks: {
          en: "Watch a short talk or film together and write down the new vocabulary and phrases.",
          ar: "شاهد محاضرة أو مقطعًا قصيرًا مع الجميع ودوّن المفردات والتراكيب الجديدة.",
        },
      },
      {
        judul: { en: "Arabic for real life", ar: "عربية للحياة" },
        teks: {
          en: "Sport, meals and trips where Arabic is the only language allowed.",
          ar: "رياضة ووجبات ورحلات لا يُتكلَّم فيها إلا بالعربية.",
        },
      },
    ],
    sesi: {
      judul: { en: "Through the year", ar: "على مدار العام" },
      langkah: [
        {
          label: { en: "Weekly", ar: "أسبوعيًا" },
          teks: {
            en: "Jalsat al-hiwar: a theme set five days ahead, your talk, then questions and a correction from the mudabbir. Followed by watching a talk or film together.",
            ar: "جلسة الحوار: موضوع يُعلن قبل خمسة أيام، ثم كلمتك، ثم نقاش وتصويب من المدبّر. تليها مشاهدة محاضرة أو مقطع معًا.",
          },
        },
        {
          label: { en: "Monthly", ar: "شهريًا" },
          teks: {
            en: "Sport together, a shared meal, a trip, all in Arabic. A dawrah with an expert at least every six months.",
            ar: "رياضة جماعية، ومجلس الطعام والشراب، ورحلة عربية، وكلها بالعربية. ودورة لغوية مع متخصص كل ستة أشهر على الأقل.",
          },
        },
        {
          label: { en: "Yearly", ar: "سنويًا" },
          teks: {
            en: "Yawm at-Tasawwuq: an Arabic-speaking market with discounts and vouchers for students.",
            ar: "يوم التسوّق: سوق بالعربية بأسعار مخفّضة وقسائم لطلاب العلم.",
          },
        },
      ],
    },
    aktivitas: [
      {
        nama: { en: "Jalsat al-Hiwar", ar: "جلسة الحوار والمحادثة" },
        teks: { en: "Prepare a theme, present it, discuss it.", ar: "حضّر موضوعًا، واعرضه، وناقشه." },
      },
      {
        nama: { en: "Riyadah Jama'iyyah", ar: "رياضة جماعية" },
        teks: {
          en: "The sport is announced a week ahead, so you learn its vocabulary first.",
          ar: "يُعلن نوع الرياضة قبل أسبوع لتستعد بمفرداتها.",
        },
      },
      {
        nama: { en: "Majlis at-Ta'am", ar: "مجلس الطعام والشراب" },
        teks: {
          en: "Order, pay, ask for change, all in Arabic.",
          ar: "اطلب وادفع واسأل عن الباقي، كل ذلك بالعربية.",
        },
      },
      {
        nama: { en: "Rihlah 'Arabiyyah", ar: "رحلة عربية" },
        teks: { en: "A trip to a nearby spot, speaking only Arabic.", ar: "رحلة إلى مكان قريب لا نتكلم فيها إلا بالعربية." },
      },
    ],
    selengkapnya: [
      {
        judul: { en: "How a hiwar session runs", ar: "كيف تسير جلسة الحوار" },
        teks: {
          en: "The theme is announced at most five days before. Members write their talk in a dedicated notebook. On the day, groups of 3–4 each sit with a mudabbir; everyone speaks for 5–10 minutes, followed by five minutes of questions, and the session ends with each member's correction.",
          ar: "يُعلن الموضوع قبل خمسة أيام على الأكثر، ويكتب كل مشارك كلمته في دفتر خاص. وفي اللقاء يُقسَّم المشاركون إلى مجموعات من ٣–٤ مع مدبّر لكل مجموعة، يتكلم كل واحد ٥–١٠ دقائق، يليها خمس دقائق للنقاش، وتُختم الجلسة بتصويب لكل مشارك.",
        },
      },
      {
        judul: { en: "Who the mudabbirs are", ar: "من هم المدبّرون" },
        teks: {
          en: "People who love Arabic, have taught or run an Arabic programme, speak it fluently and work well with others.",
          ar: "محبّون للعربية، لهم تجربة في تعليمها أو إدارة برامجها، يتحدثونها بطلاقة، ومستعدون للتعاون.",
        },
      },
    ],
  },

  mabit: {
    key: "mabit",
    nama: { en: "Overnight Dawrah", ar: "دورة المبيت" },
    hook: {
      en: "Three days, two nights, one book read to the end.",
      ar: "ثلاثة أيام وليلتان، وكتاب يُختم.",
    },
    chips: [
      { en: "Monthly · Friday–Sunday", ar: "شهريًا · من الجمعة إلى الأحد" },
    ],
    ringkas: {
      en: "An intensive overnight programme for the institute students, from Friday afternoon to Sunday midday, every month with a different theme. Tazkiyat an-nafs and sharia knowledge, together.",
      ar: "برنامج مبيت مكثّف لطلاب جامعة الإمام بجاكرتا، من عصر الجمعة إلى ظهر الأحد، كل شهر بموضوع مختلف. تزكية النفس والعلم الشرعي معًا.",
    },
    manfaat: [
      {
        judul: { en: "A sense of crisis", ar: "الإحساس بالمسؤولية" },
        teks: {
          en: "Not instant character building, but room to reflect on the adab and responsibility of a student of knowledge today.",
          ar: "ليست تربية فورية للشخصية، بل مساحة لمحاسبة النفس في أدب طالب العلم ومسؤوليته تجاه قضايا الأمة اليوم.",
        },
      },
      {
        judul: { en: "Finish a book", ar: "اختم كتابًا" },
        teks: {
          en: "Read one concise sharia text, or a chosen chapter, to the end in three days.",
          ar: "قراءة متن شرعي مختصر أو باب مختار حتى نهايته في ثلاثة أيام.",
        },
      },
      {
        judul: { en: "Sit with the ustadz", ar: "مجالسة الشيخ" },
        teks: {
          en: "A majlis with Dr. Sample Speaker, with time to ask and talk.",
          ar: "مجلس مع الدكتور متحدث تجريبي حفظه الله، مع فرصة للسؤال والتفاعل.",
        },
      },
    ],
    sesi: {
      judul: { en: "What the weekend holds", ar: "برنامج الدورة" },
      langkah: [
        {
          label: { en: "Main majlis", ar: "المجلس الرئيس" },
          teks: {
            en: "The big-picture session with Dr. Sample Speaker hafizhahullah.",
            ar: "جلسة التوعية الكبرى مع الدكتور متحدث تجريبي حفظه الله.",
          },
        },
        {
          label: { en: "Qira'ah of the book", ar: "مجلس قراءة الكتاب" },
          teks: {
            en: "Reading and unpacking the text together, so it is understood as a whole.",
            ar: "قراءة النص ودراسته معًا لضمان فهمه كاملًا.",
          },
        },
        {
          label: { en: "Small groups", ar: "حلقات صغيرة" },
          teks: {
            en: "Warm discussions with peers on putting what was learned into practice, gently and on target.",
            ar: "نقاش ودّي مع الأقران حول تطبيق ما تعلّمناه برفق وفي موضعه.",
          },
        },
      ],
    },
    aktivitas: [],
    selengkapnya: [],
  },
};

export const FEST = {
  nama: { en: "Tilawa Labs Fest", ar: "مهرجان نَوَى" },
  hook: {
    en: "Three stages for the institute's best: knowledge, creativity and the Qur'an.",
    ar: "ثلاث ساحات لتميّز طلاب الجامعة: العلم والإبداع والقرآن.",
  },
  chips: [
    { en: "3 competitions", ar: "٣ مسابقات" },
    { en: "Olympiad · Creative works · MHQ", ar: "العلوم الشرعية · الإبداع · حفظ القرآن" },
  ],
  status: { en: "Details coming soon", ar: "التفاصيل قريبًا" },
  ringkas: {
    en: "Three competitions for the institute students. Registration opens later, in shaa Allah.",
    ar: "ثلاث مسابقات لطلاب جامعة الإمام بجاكرتا. يُفتح التسجيل لاحقًا إن شاء الله.",
  },
  lomba: [
    {
      key: "fest-olimpiade",
      nama: { en: "Sharia Knowledge Olympiad", ar: "مسابقة العلوم الشرعية" },
      teks: {
        en: "A written competition to find students with an outstanding grasp of the basics of sharia.",
        ar: "مسابقة علمية تحريرية لاكتشاف الطلاب المتميزين في فهم أساسيات العلوم الشرعية.",
      },
      catatan: {
        en: "Aqidah · Fiqh · Usul al-Fiqh. One branch only: all three run at the same time.",
        ar: "العقيدة · الفقه · أصول الفقه. فرع واحد فقط لأن الفروع كلها في وقت واحد.",
      },
    },
    {
      key: "fest-karya",
      nama: { en: "Creative Works Contest", ar: "مسابقة الأعمال الإبداعية" },
      teks: {
        en: "Ideas, creativity and skill in digital da'wah, on set categories and themes.",
        ar: "أفكار وإبداع ومهارة في الدعوة الرقمية ضمن فئات وموضوعات محددة.",
      },
      catatan: null,
    },
    {
      key: "fest-mhq",
      nama: { en: "Qur'an Memorisation (MHQ)", ar: "مسابقة حفظ القرآن الكريم" },
      teks: {
        en: "Tests the strength of memorisation, tajwid, adab and stage presence, judged on national standards.",
        ar: "تختبر قوة الحفظ وإتقان التجويد والأدب وحسن الأداء، بتحكيم وفق معايير وطنية.",
      },
      catatan: null,
    },
  ],
} as const;

export function namaMinat(k: MinatKey, lang: Lang): string {
  if (k === "fest") return FEST.nama[lang];
  if (isLomba(k)) {
    const l = FEST.lomba.find((x) => x.key === k);
    return `${FEST.nama[lang]} · ${l ? l.nama[lang] : k}`;
  }
  return CLUB[k].nama[lang];
}

/** Whether this account is on the list for Tilawa Labs Fest or any of its competitions. */
export function adaMinatFest(minat: Set<MinatKey>): boolean {
  return minat.has("fest") || LOMBA_KEYS.some((k) => minat.has(k));
}
