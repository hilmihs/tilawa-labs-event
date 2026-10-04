import { BAGIAN } from "./bagian";
import type { Catatan } from "./tipe";

export * from "./tipe";
export { BAGIAN } from "./bagian";

/**
 * The lecture notes, keyed by the event they belong to.
 *
 * A programme has notes only once it has been given, so this is a record and not a
 * field on the event row: an event with no entry here simply shows no notes section
 * and has no /notes page. Adding the next lecture's notes is a new key, not a
 * migration — the same rule the rest of the copy in this app follows.
 */

const KAJIAN_LIPIA_3: Catatan = {
  slug: "student-lecture",
  judul: {
    id: "How to Learn and Grow at the institute",
    en: "How to Learn and Grow at the institute",
    ar: "كيف نتعلّم وننمو في المعهد",
  },
  judulArab: "طُرُقُ التَّعَلُّمِ وَالنُّمُوِّ فِي مَعْهَدِ الْعُلُومِ الْإِسْلَامِيَّةِ وَالْعَرَبِيَّةِ",
  pemateri: {
    id: "Dr. Sample Speaker",
    en: "Dr. Sample Speaker",
    ar: "الدكتور متحدث تجريبي",
  },
  doa: {
    id: "hafizhahullah",
    en: "– may Allah protect him –",
    ar: "حفظه الله",
  },
  acara: {
    id: "Tilawa Labs",
    en: "Tilawa Labs",
    ar: "تلاوة لابز",
  },
  tempat: {
    id: "Darsyafii Islamic School, Pejaten Barat, Jakarta Selatan",
    en: "Dar Syafi’i Islamic School, Pejaten Barat, South Jakarta",
    ar: "القاعة التجريبية، جاكرتا",
  },
  tanggal: "2026-09-21",
  durasi: {
    id: "2 jam 27 menit",
    en: "2 h 27 m",
    ar: "ساعتان و٢٧ دقيقة",
  },
  sumber: {
    id: "Disusun dari transkrip rekaman (± 2 jam 27 menit) dan ringkasan panitia. Teks Arab mengikuti lafaz baku sumbernya.",
    en: "Compiled from the recording (± 2 h 27 m) and the committee’s summary. Arabic texts follow the standard wording of their sources.",
    ar: "أُعدّت من تفريغ التسجيل (نحو ساعتين و٢٧ دقيقة) ومن ملخّص اللجنة. والنصوص العربية على اللفظ المعتمد في مصادرها.",
  },

  ringkasan: [
    {
      id: "Menuntut ilmu syar‘i itu berat. Wahyu seharusnya mengubah karakter, sifat, dan sikap penuntutnya.",
      en: "Seeking religious knowledge is heavy. Revelation ought to change the character, disposition and conduct of the one who seeks it.",
      ar: "طلب العلم الشرعي ثقيل. والوحي ينبغي أن يغيّر خُلق طالبه وطبعه وسلوكه.",
    },
    {
      id: "Mahasiswa the institute memikul amanah besar. Biaya seorang mahasiswa hingga lulus sangat besar, dan semuanya akan ditanya pada hari kiamat.",
      en: "A the institute student carries a heavy trust. Carrying one student to graduation costs a very great deal, and all of it will be asked about.",
      ar: "طالب المعهد يحمل أمانة عظيمة. وتكلفة الطالب حتى تخرجه كبيرة جدًا، وسيُسأل عن ذلك كله.",
    },
    {
      id: "Di Indonesia (± 280 juta penduduk, umat Islam ± 87%), semua takhashshush adalah fardhu kifayah yang sangat dibutuhkan dan masih kekurangan SDM.",
      en: "In Indonesia — some 280 million people, about 87% Muslim — every specialisation is a fard kifayah that is badly needed and still short of people.",
      ar: "في إندونيسيا — نحو ٢٨٠ مليون نسمة، والمسلمون نحو ٨٧٪ — كل تخصص فرض كفاية تشتد الحاجة إليه ولا يزال أهله قليلًا.",
    },
    {
      id: "Dakwah harus di atas tiga bashirah: ilmu yang sahih, pemahaman kondisi mad‘u, dan cara penyampaian yang tepat.",
      en: "Da’wah must stand upon three basirah: sound knowledge, an understanding of the audience, and the right manner of delivery.",
      ar: "الدعوة تقوم على ثلاث بصائر: علم صحيح، وفهم لحال المدعو، وحسن أداء.",
    },
    {
      id: "Bangun tiga waktu: belajar sendiri, belajar bersama teman, dan merapat kepada guru atau senior.",
      en: "Build three times: studying alone, studying with peers, and drawing close to a teacher or a senior.",
      ar: "ابنِ ثلاثة أوقات: الدرس وحدك، والدرس مع إخوانك، والقرب من شيخ أو كبير.",
    },
    {
      id: "Idarah, iqtishad, lughah, dan syariah saling membutuhkan dan saling bahu-membahu. Jadilah ahli di bidangmu, di atas ta’shil yang kuat.",
      en: "Idarah, iqtisad, lughah and shari’ah need one another and work shoulder to shoulder. Be an expert in your own field, upon strong grounding.",
      ar: "الإدارة والاقتصاد واللغة والشريعة يحتاج بعضها بعضًا ويتعاون أهلها. فكن متقنًا في تخصصك على تأصيل قوي.",
    },
    {
      id: "Pelajari hal-hal yang kamu butuhkan untuk berdakwah, baik di dalam maupun di luar kampus, dengan proporsi waktu yang tepat dan tetap menjaga amanah.",
      en: "Learn what you need in order to preach, inside the campus and outside it, in the right proportion of time and without letting the trust slip.",
      ar: "تعلّم ما تحتاجه للدعوة داخل المعهد وخارجه، بقسمة عادلة من وقتك، ومن غير إخلال بالأمانة.",
    },
    {
      id: "Mulai dari diri sendiri: muhasabah dan tazkiyatun nufus. Kesiapan mental dan jiwa sama pentingnya dengan kesiapan ilmiah.",
      en: "Begin with yourself: self-accounting and purification of the soul. Readiness of mind and soul matters as much as scholarly readiness.",
      ar: "ابدأ بنفسك: محاسبةً وتزكيةً. والاستعداد النفسي كالاستعداد العلمي في الأهمية.",
    },
    {
      id: "Bagi akhwat, di antara medan yang paling strategis adalah pendidikan usia dini (TK dan SD).",
      en: "For sisters, among the most strategic fields is early childhood education — kindergarten and primary school.",
      ar: "ومن أهم ميادين الأخوات التعليم في الطفولة المبكرة: الروضة والابتدائية.",
    },
  ],

  bagian: BAGIAN

};

const CATATAN: Record<string, Catatan> = {
  [KAJIAN_LIPIA_3.slug]: KAJIAN_LIPIA_3,
};

/** The notes for one programme, or null if that programme has none. */
export function catatanUntuk(slug: string): Catatan | null {
  return CATATAN[slug] ?? null;
}

/** Whether a programme has notes at all — cheaper to read at a call site than a null check. */
export function adaCatatan(slug: string): boolean {
  return slug in CATATAN;
}
