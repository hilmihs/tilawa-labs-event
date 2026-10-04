import type { Acara, Peserta } from "@/db/schema";
import { formatJamKolom, formatJamTampil, formatTanggalIso, type Lang } from "@/lib/waktu";
import { t } from "@/lib/i18n/dict";

export type StatusAcara =
  | "draft"
  | "pendaftaran"
  | "ditutup"
  | "berlangsung"
  | "selesai"
  | "batal";

/**
 * The size of the hall. When either side has its own quota the two sides ARE the
 * hall and the single total is ignored; it only still counts for a programme whose
 * quota was never split.
 */
export function kuotaEfektif(
  ev: Pick<Acara, "kuota" | "kuotaIkhwan" | "kuotaAkhwat">,
): number | null {
  if (ev.kuotaIkhwan === null && ev.kuotaAkhwat === null) return ev.kuota;
  return (ev.kuotaIkhwan ?? 0) + (ev.kuotaAkhwat ?? 0);
}

/** The registration door. Read from status, never from comparing dates. */
export function pintuPendaftaranTerbuka(status: string): boolean {
  return status === "pendaftaran";
}

export function acaraSudahSelesai(status: string): boolean {
  return status === "selesai" || status === "batal";
}

export function labelGender(gender: string, lang: Lang): string {
  const d = t(lang);
  return gender === "akhwat" ? d.gender.akhwat : d.gender.ikhwan;
}

export function labelGate(ev: Acara | null, gender: string, lang: Lang): string {
  const d = t(lang);
  const kunci = gender === "akhwat" ? "akhwat" : "ikhwan";
  const dariDb = (gender === "akhwat" ? ev?.gateAkhwat : ev?.gateIkhwan)?.trim();
  /*
   * The admin field holds one language. When it still says the English default (the
   * seed writes "north gate"), it is the default, and the Arabic page gets the Arabic
   * default — not "north gate" on a ticket that is otherwise all Arabic.
   */
  if (dariDb && dariDb.toLowerCase() !== t("en").gate[kunci].toLowerCase()) return dariDb;
  return d.gate[kunci];
}

export function labelPintu(ev: Acara | null, gender: string, lang: Lang): string {
  return `${labelGender(gender, lang)} — ${labelGate(ev, gender, lang)}`;
}

export function labelStatusLipia(p: Peserta, lang: Lang): string {
  const d = t(lang);
  if (p.statusLipia === "mahasiswa") {
    const bagian: string[] = [d.form.statusMahasiswa];
    if (p.prodi) bagian.push(p.prodi);
    if (p.semester) bagian.push(`${d.form.semester} ${p.semester}`);
    return bagian.join(" · ");
  }
  if (p.statusLipia === "khirrij") {
    return p.tahunLulus ? `${d.form.statusKhirrij} ${p.tahunLulus}` : d.form.statusKhirrij;
  }
  if (p.statusLipia === "mutarabbish") return d.form.statusMutarabbish;
  return "";
}

export type TampilanAcara = {
  nama: string;
  judul: string | null;
  pemateri: string | null;
  lokasi: string | null;
  alamat: string | null;
  tanggal: string;
  waktu: string;
  petaUrl: string | null;
  tatibUrl: string | null;
  kuota: number | null;
  status: string;
  terbuka: boolean;
};

/** Picks the language-specific columns and formats everything for display. */
export function tampilanAcara(ev: Acara, lang: Lang): TampilanAcara {
  const mulai = formatJamTampil(ev.waktuMulai, lang);
  const selesai = formatJamTampil(ev.waktuSelesai, lang);
  return {
    nama: (lang === "ar" ? ev.namaAr : ev.nama) || ev.nama,
    judul: (lang === "ar" ? ev.judulAr : ev.judul) || ev.judul,
    pemateri: (lang === "ar" ? ev.pemateriAr : ev.pemateri) || ev.pemateri,
    lokasi: (lang === "ar" ? ev.lokasiAr : ev.lokasi) || ev.lokasi,
    alamat: (lang === "ar" ? ev.alamatAr : ev.alamat) || ev.alamat,
    tanggal: formatTanggalIso(ev.tanggal, lang),
    waktu: selesai ? `${mulai} – ${selesai}` : mulai,
    petaUrl: ev.petaUrl,
    tatibUrl: ev.tatibUrl,
    kuota: kuotaEfektif(ev),
    status: ev.status,
    terbuka: pintuPendaftaranTerbuka(ev.status),
  };
}

/** Seat counter shown on the landing page. Never above 100%. */
export function bilahKuota(terisi: number, kuota: number | null): { persen: number; teks: string } {
  if (!kuota || kuota <= 0) return { persen: 0, teks: String(terisi) };
  const persen = Math.min(100, (terisi / kuota) * 100);
  return { persen, teks: `${terisi} / ${kuota}` };
}

/**
 * The status column keeps its Indonesian values (they are the data model and are
 * written all over the code and the DB), but nothing Indonesian reaches a screen.
 */
const LABEL_STATUS: Record<string, string> = {
  draft: "Draft",
  pendaftaran: "Registration open",
  ditutup: "Registration closed",
  berlangsung: "Event day",
  selesai: "Finished",
  batal: "Cancelled",
};

/**
 * Contact details, from the event row first and the environment second.
 *
 * The env fallback is what keeps an unedited deployment working; once the committee
 * sets a value in /admin it wins, and no redeploy is involved.
 */
export type TautanGrup = { label: string | null; url: string };

/**
 * Every group for one gender, in the order the committee wrote them.
 *
 * A WhatsApp group caps at 1,024 members, so one event needs several: the field
 * holds one link per line, optionally named — `Akhwat 2 | https://chat.whatsapp…`.
 * The participant is shown all of them and picks one; nothing here decides which,
 * because only the committee knows which group is still open.
 */
export function daftarWaGrup(
  ev: Pick<Acara, "waGrupIkhwan" | "waGrupAkhwat"> | null,
  gender: string,
): TautanGrup[] {
  const dariDb = gender === "akhwat" ? ev?.waGrupAkhwat : ev?.waGrupIkhwan;
  const dariEnv =
    gender === "akhwat"
      ? process.env.NEXT_PUBLIC_WA_GRUP_AKHWAT
      : process.env.NEXT_PUBLIC_WA_GRUP_IKHWAN;
  const mentah = dariDb?.trim() || dariEnv?.trim() || "";
  return mentah
    .split(/[\n,]+/)
    .map((baris) => baris.trim())
    .filter(Boolean)
    .map((baris) => {
      const pisah = baris.split("|");
      const url = (pisah.length > 1 ? pisah.slice(1).join("|") : pisah[0]).trim();
      const label = pisah.length > 1 ? pisah[0].trim() : null;
      return { label: label || null, url };
    })
    .filter((g) => /^https?:\/\//i.test(g.url));
}

/** The first group, for the single link at the foot of the ticket. */
export function waGrup(ev: Acara | null, gender: string): string | null {
  return daftarWaGrup(ev, gender)[0]?.url ?? null;
}

/**
 * The committee's admin number. Kept in code as the last fallback so a fresh
 * database never shows a placeholder to participants; a value set in /admin or in
 * the environment still wins.
 */
const WA_ADMIN_BAWAAN = "085286270278";

/*
 * The admin WhatsApp number was banned. While it is, no page shows it or links to it:
 * a participant sending a report to a dead number waits for an answer that never
 * comes. Flip back to true once the committee has a working number.
 */
export const KONTAK_ADMIN_AKTIF = false;

export function waAdmin(ev: Acara | null): string {
  return ev?.waAdmin?.trim() || process.env.NEXT_PUBLIC_WA_ADMIN?.trim() || WA_ADMIN_BAWAAN;
}

export function labelStatusAcara(status: string): string {
  return LABEL_STATUS[status] ?? status;
}

const LABEL_SUMBER: Record<string, string> = {
  web: "Web form",
  impor: "Imported",
};

export function labelSumber(sumber: string): string {
  return LABEL_SUMBER[sumber] ?? sumber;
}

const LABEL_METODE: Record<string, string> = {
  qr: "QR",
  manual: "Manual",
  nama: "By name",
};

export function labelMetode(metode: string): string {
  return LABEL_METODE[metode] ?? metode;
}

/*
 * The programmes the institute actually runs, taken from the previous event's registration
 * form (docs/nawa) rather than invented. The earlier list here had "Bahasa" and
 * "Takmili", which are not what students are asked to pick between.
 */
export const PRODI = ["Syariah", "Lughah Arabiyyah", "Idary", "I'dad"] as const;
/*
 * Kept from the previous event's form. It is the one question there that is not
 * about getting through the door: it is how the committee finds the people who can
 * teach, write or help run the next one.
 */
// "pengajar" keeps its old key so rows saved before the list grew still read correctly.
export const KEAHLIAN = [
  "quran",
  "arab",
  "syari",
  "dakwah",
  "pengajar",
  "anak",
  "literasi",
  "inggris",
  "teknologi",
  "media",
  "bisnis",
  "lain",
] as const;
export const MAKS_KEAHLIAN = 3;

/*
 * "Something else" is the one box that asks a question back, so it carries a free
 * text answer. It rides in the same comma-joined column as one extra entry,
 * `lain:<text>`, placed after the codes — every existing reader (the CSV export, the
 * profile checkboxes) keeps seeing the codes it already understood and simply does
 * not recognise the extra entry, instead of a new column nothing knows to read.
 */
export const PREFIKS_LAIN = "lain:";
/** Long enough for a field of study, short enough that the column stays a column. */
export const MAKS_KEAHLIAN_LAIN = 60;

/**
 * The free text, made safe for the column: a comma would split it into an entry of
 * its own and the readers would never put it back together.
 */
export function rapikanKeahlianLain(teks: string | null | undefined): string {
  return (teks ?? "")
    .replace(/[,\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAKS_KEAHLIAN_LAIN)
    .trim();
}

/** Checked boxes → "quran,arab". Unknown keys and anything past the limit are dropped. */
export function rapikanKeahlian(nilai: string[], lain?: string | null): string | null {
  const sah = new Set<string>(KEAHLIAN);
  const hasil = [...new Set(nilai.map((v) => v.trim()))]
    .filter((v) => sah.has(v))
    .slice(0, MAKS_KEAHLIAN);
  // The text only means anything next to the box it belongs to; without the tick it
  // is an answer to a question that was not asked.
  const teks = hasil.includes("lain") ? rapikanKeahlianLain(lain) : "";
  if (teks) hasil.push(`${PREFIKS_LAIN}${teks}`);
  return hasil.length ? hasil.join(",") : null;
}

/** The ticked codes only. The `lain:<text>` entry is an answer, not a checkbox. */
export function kodeKeahlian(tersimpan: string | null | undefined): string[] {
  const sah = new Set<string>(KEAHLIAN);
  return (tersimpan ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter((v) => sah.has(v))
    .slice(0, MAKS_KEAHLIAN);
}

/** What was typed behind "Something else", or "" when nothing was. */
export function teksKeahlianLain(tersimpan: string | null | undefined): string {
  const entri = (tersimpan ?? "")
    .split(",")
    .map((v) => v.trim())
    .find((v) => v.startsWith(PREFIKS_LAIN));
  return entri ? entri.slice(PREFIKS_LAIN.length).trim() : "";
}

export const SEMESTER = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
export const TRANSPORT = ["motor", "mobil", "umum", "jalan", "lain"] as const;
/*
 * Ten brothers' stations and fifteen sisters' — the sisters' side has the larger
 * quota — plus the help desk. Generated, not listed, so the count is changed in one
 * place; every existing row keeps its gate name.
 */
const IKH = Array.from({ length: 10 }, (_, i) => `IKH-${i + 1}`);
const AKH = Array.from({ length: 15 }, (_, i) => `AKH-${i + 1}`);
export const GATES: readonly string[] = [...IKH, ...AKH, "BANTUAN"];
/** The same stations, in the groups the gate picker shows them in. */
export const KELOMPOK_GATE: ReadonlyArray<{ label: string; gates: readonly string[] }> = [
  { label: "Brothers", gates: IKH },
  { label: "Sisters", gates: AKH },
  { label: "Desk", gates: ["BANTUAN"] },
];

export const JENIS_PROGRAM = ["acara", "kelas", "seleksi"] as const;
export type JenisProgram = (typeof JENIS_PROGRAM)[number];

export function labelJenis(jenis: string, lang: Lang): string {
  const d = t(lang);
  const k = (JENIS_PROGRAM as readonly string[]).includes(jenis) ? (jenis as JenisProgram) : "acara";
  return d.program.jenis[k];
}

const SLUG_RE = /^[a-z0-9-]{1,60}$/;

/**
 * The one place a slug is judged. The picker's action validates what it is handed
 * and the resolver validates the query string and the cookie; a second copy of the
 * pattern is a second thing to forget when it changes.
 */
export function slugSah(v: string): boolean {
  return SLUG_RE.test(v);
}

/**
 * Which programme a member of staff means. The query string wins so a link can be
 * shared ("open the dashboard for kajian-2"); the cookie remembers the last choice.
 * Anything that is not a slug is ignored rather than passed to a query.
 */
export function resolusiSlug(query: string | undefined, cookie: string | undefined): string | null {
  for (const v of [query, cookie]) {
    if (v && slugSah(v)) return v;
  }
  return null;
}

const STATUS_HIDUP = new Set(["pendaftaran", "berlangsung", "ditutup"]);

/**
 * The programme staff most likely mean when they have not chosen one: the nearest
 * live programme on or after today, else the most recent live one, else whatever is
 * newest. Never null while at least one programme exists — a scanner with no
 * programme is a scanner that refuses everyone.
 */
export function pilihBawaan<T extends { tanggal: string; status: string }>(
  daftar: T[],
  hariIni: string,
): T | null {
  const hidup = daftar.filter((a) => STATUS_HIDUP.has(a.status));
  const mendatang = hidup
    .filter((a) => a.tanggal >= hariIni)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  if (mendatang[0]) return mendatang[0];
  const lewat = [...hidup].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  if (lewat[0]) return lewat[0];
  return [...daftar].sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0] ?? null;
}
