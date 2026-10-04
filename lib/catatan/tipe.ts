/**
 * Lecture notes: the shapes the content is written in.
 *
 * The notes carry a language of their own. The site itself is English or Arabic
 * (lib/i18n/dict.ts), but the lecture was given in Indonesian and the committee's
 * summary is Indonesian too — so the notes and the quiz are shown in Indonesian on
 * both sites, whatever the interface around them is set to.
 *
 * The English and Arabic renderings are still written and still kept here. They are
 * simply not shown: the committee has not read them yet, and an unreviewed
 * translation of a scholar's words is worse than no translation. `BAHASA_TAMPIL` is
 * the single place that decides, so turning the ID · EN · ع switch back on once they
 * are approved is a change to this file and a control put back on the page, not a
 * rewrite.
 *
 * Every piece of prose is therefore a `Teks`: the same sentence in all three. The
 * Arabic of a verse or a hadith is not a `Teks` — it is one string, the wording of
 * its source, identical whichever language the page is being read in.
 */

export type BahasaTeks = "id" | "en" | "ar";

export const BAHASA_TEKS: BahasaTeks[] = ["id", "en", "ar"];

export const LABEL_BAHASA_TEKS: Record<BahasaTeks, string> = {
  id: "ID",
  en: "EN",
  ar: "ع",
};

export function isBahasaTeks(v: string | undefined | null): v is BahasaTeks {
  return v === "id" || v === "en" || v === "ar";
}

export function dirTeks(b: BahasaTeks): "ltr" | "rtl" {
  return b === "ar" ? "rtl" : "ltr";
}

/**
 * The one language the notes and the quiz are shown in. Indonesian, because that is
 * the language the lecture was given in and the only one the committee has read.
 */
export const BAHASA_TAMPIL: BahasaTeks = "id";

/** The same sentence in each of the three. */
export type Teks = Record<BahasaTeks, string>;

/**
 * A verse, a hadith or a maxim. `arab` is the wording of the source and does not
 * translate; `terjemah` and `sumber` do.
 */
export type Dalil = {
  arab: string;
  terjemah: Teks;
  sumber: Teks;
};

/**
 * The panel that closes a card. Most sections end on their evidence; one or two
 * rest on a line of the lecture itself, which is a quotation and not a proof, so it
 * is labelled as one rather than dressed up as scripture.
 */
export type Penutup =
  | ({ jenis: "dalil" } & Dalil)
  /**
   * `sumber` is optional here: a line taken from the lecture the card is summarising
   * needs no attribution — it is already on the page it came from.
   */
  | { jenis: "kutip"; teks: Teks; sumber?: Teks };

/** One block of the full-read article. */
export type Blok =
  | { jenis: "p"; teks: Teks }
  /**
   * The question a section answers, set apart in a box. Five of the seven parts are
   * answers to questions from the floor, and running the question on as an ordinary
   * paragraph made it easy to read past — which left the answer looking like the
   * Ustadz simply raising a topic.
   */
  | { jenis: "tanya"; teks: Teks }
  | { jenis: "h3"; teks: Teks }
  | { jenis: "ul"; butir: Teks[] }
  | ({ jenis: "dalil" } & Dalil);

/**
 * One numbered part of the lecture: a card on the programme page and a section of
 * the full-read page, written once and used by both. `poin` is what fits on the
 * card; `isi` is the whole thing.
 */
export type Bagian = {
  /** "01" … "08". Printed as the card's big numeral and in the contents list. */
  no: string;
  /** Anchor on the full-read page, and the fragment the quiz links back to. */
  id: string;
  /** Small caps line above the title: "Introduction", "Question 1". */
  kicker: Teks;
  /** The card's heading and the section's heading. */
  judul: Teks;
  /** The shorter wording used in the contents list, where the column is 280px. */
  ringkas: Teks;
  /** One or two lines on the card. Never three: the card has a fixed height. */
  poin: Teks[];
  penutup: Penutup;
  isi: Blok[];
};

/** Everything the notes page and the card shelf need for one lecture. */
export type Catatan = {
  /** The event this belongs to, by slug. */
  slug: string;
  judul: Teks;
  /** The Arabic title as it is set on the poster; never translated. */
  judulArab: string;
  pemateri: Teks;
  doa: Teks;
  acara: Teks;
  tempat: Teks;
  /** Date of the lecture, ISO, same field the event row uses. */
  tanggal: string;
  durasi: Teks;
  sumber: Teks;
  /** The summary points at the top of the full-read page. */
  ringkasan: Teks[];
  bagian: Bagian[];
};
