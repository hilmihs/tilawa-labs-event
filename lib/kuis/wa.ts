import { JUMLAH_SOAL, soalKe } from "./soal";
import { JUMLAH_SESI, soalSesi, tanggalSesi } from "./jadwal";

/**
 * The two messages the committee sends into the WhatsApp groups on release mornings:
 * the questions that have just opened, and the answers to the batch before.
 *
 * Twice a week, not once a day. Someone has to read a message before four hundred
 * people do, and a send that happens every morning is a send that stops happening in
 * week two.
 *
 * Indonesian, always. The site is English and Arabic, but the groups are not — and a
 * reminder that reads like a translation gets skipped. The greeting and the group's
 * own numbers are the only difference between the brothers' and the sisters' copy.
 */

export type Gender = "ikhwan" | "akhwat";

export type StatistikSesi = {
  /** How many of the group answered at least one question of the batch before. */
  menjawab: number;
  /** How many people are in the group's tally. */
  peserta: number;
  /** Whole per cent of that batch's answers that were right. */
  persenBenar: number;
};

const SAPAAN: Record<Gender, string> = {
  ikhwan: "Assalamu'alaikum, ikhwan 🌿",
  akhwat: "Assalamu'alaikum, akhwat 🌿",
};

const BARAKALLAH: Record<Gender, string> = {
  ikhwan: "Barakallahu fikum.",
  akhwat: "Barakallahu fikunna.",
};

const HARI_ID = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "Senin, 29 Sep" — the short Indonesian form the groups use. */
export function tanggalWa(iso: string): string {
  const d = new Date(`${iso}T05:00:00+07:00`);
  const bagian = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const ambil = (t: string) => bagian.find((p) => p.type === t)?.value ?? "";
  const wd: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hari = HARI_ID[wd[ambil("weekday")] ?? 0];
  const bulan = BULAN_ID[Number(ambil("month")) - 1] ?? "";
  return `${hari}, ${Number(ambil("day"))} ${bulan}`;
}

/** "Kamis, 24 Sep – Ahad, 27 Sep" for one release of the quiz. */
export function rentangSesi(mulai: string, sesi: number): string {
  const { dari, sampai } = tanggalSesi(mulai, sesi);
  return `${tanggalWa(dari)} – ${tanggalWa(sampai)}`;
}

/**
 * The release morning's message: this batch is open.
 *
 * `basis` is the site's own address without a trailing slash. The path says `en`
 * because the site's interface has only English and Arabic; the questions behind it
 * are Indonesian either way.
 */
export function pesanSesi({
  sesi,
  mulai,
  gender,
  basis,
  slug,
  lalu,
}: {
  sesi: number;
  mulai: string;
  gender: Gender;
  basis: string;
  slug: string;
  lalu?: StatistikSesi;
}): string {
  const nomor = soalSesi(sesi);
  if (!nomor.length) return "";
  const { sampai } = tanggalSesi(mulai, sesi);
  const baris = [
    SAPAAN[gender],
    "",
    `*Kuis Sesi ke-${sesi} / ${JUMLAH_SESI}* sudah terbuka — ${nomor.length} soal.`,
    "",
    `Soal ${nomor[0]}–${nomor[nomor.length - 1]} dari ${JUMLAH_SOAL}, diambil dari catatan kajian Ustadz Nuzul:`,
    ...nomor.map((n) => {
      const s = soalKe(n);
      return s ? `${n}. ${judulSingkat(n)} (${s.rujuk.id})` : "";
    }),
    "",
    `Jawab sampai ${tanggalWa(sampai)} pukul 23.59 agar streak tetap jalan:`,
    // Tagged so the traffic tab can tell the groups' clicks apart: WhatsApp itself sends no referrer.
    `${basis}/en/p/${slug}/quiz?src=wa`,
  ];
  if (lalu && lalu.peserta > 0) {
    baris.push(
      "",
      `Sesi lalu ${lalu.menjawab} dari ${lalu.peserta} ${gender} ikut menjawab, ${lalu.persenBenar}% benar. ${BARAKALLAH[gender]}`,
    );
  }
  return baris.join("\n");
}

/** The second message: the previous batch's answers, and where to read more. */
export function pesanKunciSesi({
  sesi,
  basis,
  slug,
}: {
  sesi: number;
  basis: string;
  slug: string;
}): string {
  const nomor = soalSesi(sesi);
  if (!nomor.length) return "";
  const baris: string[] = [`*Sesi ke-${sesi} — kunci jawaban*`, ""];
  for (const n of nomor) {
    const s = soalKe(n);
    if (!s) continue;
    const v = s.varian.id;
    baris.push(`${n}. ${"ABCD"[s.jawab]}. ${v.o[s.jawab]}`, v.e, "");
  }
  baris.push(`Selengkapnya di catatan: ${basis}/en/p/${slug}/notes`);
  return baris.join("\n");
}

/**
 * A few words naming what a question is about, for the list in the release message.
 * Taken from the question itself rather than written twice: the bank is the only
 * place a question's subject is allowed to live.
 */
function judulSingkat(nomor: number): string {
  const s = soalKe(nomor);
  if (!s) return "";
  const q = s.varian.id.q.replace(/…$/, "").trim();
  const kata = q.split(/\s+/);
  return kata.length <= 8 ? q : `${kata.slice(0, 8).join(" ")}…`;
}

/** Both messages for one group, in the order they are sent. */
export function pesanRilis(arg: {
  sesi: number;
  mulai: string;
  gender: Gender;
  basis: string;
  slug: string;
  lalu?: StatistikSesi;
}): { rentang: string; soal: string; kunci: string | null } {
  return {
    rentang: rentangSesi(arg.mulai, arg.sesi),
    soal: pesanSesi(arg),
    kunci:
      arg.sesi > 1
        ? pesanKunciSesi({ sesi: arg.sesi - 1, basis: arg.basis, slug: arg.slug })
        : null,
  };
}
