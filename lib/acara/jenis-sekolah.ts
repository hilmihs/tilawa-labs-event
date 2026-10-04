import { alihAksara } from "@/lib/acara/arab-latin";
import { kunciTeks } from "@/lib/acara/rapikan-teks";

/*
 * What kind of school an answer to "school or pesantren" names, read from the name
 * alone — there is no other data about the school. Checked in order, so a
 * "Pesantren ... SMA IT" counts as a pesantren (where the student lived and studied)
 * and "Ma'had" is never mistaken for the madrasah abbreviation "MA".
 */

export const JENIS_SEKOLAH = ["pesantren", "ma", "sma", "tinggi", "lain"] as const;
export type JenisSekolah = (typeof JENIS_SEKOLAH)[number];

export const LABEL_JENIS_SEKOLAH: Record<JenisSekolah, string> = {
  pesantren: "Pesantren / ma'had",
  ma: "Madrasah Aliyah (MA)",
  sma: "SMA / SMK / Islamic school",
  tinggi: "Institute / university",
  lain: "Name only (type not stated)",
};

// Word edges written as spaces: `\b` only knows ASCII letters, and some answers are Arabic.
const POLA: [JenisSekolah, RegExp][] = [
  // kunciTeks already turns "ponpes", "pp" and "pondok pesantren" into "pesantren".
  [
    "pesantren",
    /(?:^| )(pesantren|pondok|mahad|maahad|معهد|dayah|tahfidz|tahfiz|tahfizh|tahfidzul|takhassus|kulliyatul|kmi|tmi|rumah quran|markaz|boarding|ibs|pptq|ppmi|ppi|ppip|huffadz|huffadh)(?= |$)/,
  ],
  ["tinggi", /(?:^| )(lipia|universitas|university|univ|uin|iain|stai|stid|stiba|sekolah tinggi|institut|politeknik|akademi|kampus|kuliah|idad|iddad)(?= |$)/],
  ["ma", /(?:^| )(ma|man|mas|mapk|madrasah aliyah|aliyah|ulya)(?= |$)/],
  ["sma", /(?:^| )(sma|sman|smas|smk|smkn|smait|slta|sekolah menengah atas|sit|sekolah islam|islamic school|pkbm)(?= |$)/],
];

export function jenisSekolah(teks: string | null | undefined): JenisSekolah | null {
  const k = kunciTeks(teks);
  if (!k) return null;
  // An answer in Arabic says the kind too — "المدرسة الثانوية" is an aliyah, "جامعة" a
  // university — so the words are read in Latin letters as well as in the original.
  const latin = kunciTeks(alihAksara(k));
  for (const [jenis, pola] of POLA) if (pola.test(k) || pola.test(latin)) return jenis;
  return "lain";
}
