import { JUMLAH_SESI, isSoalSah, sesiDari, sesiTerbuka, soalSesi, soalTerbuka } from "./jadwal";
import { JUMLAH_SOAL } from "./soal";

/**
 * Score, streak and the four-week board, from the rows a participant has left behind.
 * Pure: the database hands over the answers, this decides what they mean.
 */

/** One stored answer. `tepatWaktu` was decided when it was written, not now. */
export type Jawaban = {
  nomor: number;
  pilih: number;
  benar: boolean;
  tepatWaktu: boolean;
};

export type StatusSoal = "benar" | "salah" | "lewat" | "terbuka" | "terkunci";

export type Kotak = {
  nomor: number;
  status: StatusSoal;
};

export type Sesi = {
  sesi: number;
  kotak: Kotak[];
  /** Every question of the week answered inside it — what keeps the streak alive. */
  penuh: boolean;
};

export function petaJawaban(jawaban: Jawaban[]): Map<number, Jawaban> {
  return new Map(jawaban.filter((j) => isSoalSah(j.nomor)).map((j) => [j.nomor, j]));
}

/** Correct answers. A late answer still counts — only the streak is lost. */
export function skor(jawaban: Jawaban[]): number {
  return jawaban.filter((j) => j.benar).length;
}

/** Whether every question of one week was answered inside that week. */
export function sesiPenuh(peta: Map<number, Jawaban>, sesi: number): boolean {
  const nomor = soalSesi(sesi);
  return nomor.length > 0 && nomor.every((n) => peta.get(n)?.tepatWaktu === true);
}

/**
 * The run of complete weeks ending at the week that is currently open.
 *
 * Complete means every question of the week answered before that Sunday — not all of them right. The
 * score already measures how much someone knows; the streak measures whether they
 * kept turning up, and punishing a wrong answer twice would only push the unsure
 * towards guessing late rather than answering at all.
 *
 * The open week being unfinished does not break the run: someone looking on Monday
 * morning should still see last week's streak, not a zero that reappears weekly.
 */
export function streak(jawaban: Jawaban[], sesiSekarang: number): number {
  const peta = petaJawaban(jawaban);
  let p = Math.min(sesiSekarang, JUMLAH_SESI);
  if (p >= 1 && !sesiPenuh(peta, p)) p -= 1;
  let n = 0;
  while (p >= 1 && sesiPenuh(peta, p)) {
    n += 1;
    p -= 1;
  }
  return n;
}

/**
 * The longest run of complete weeks anywhere in the four — what the certificate
 * prints. Different from `streak`, which is the run still alive this week.
 */
export function streakTerpanjang(jawaban: Jawaban[]): number {
  const peta = petaJawaban(jawaban);
  let terbaik = 0;
  let jalan = 0;
  for (let p = 1; p <= JUMLAH_SESI; p++) {
    if (sesiPenuh(peta, p)) {
      jalan += 1;
      if (jalan > terbaik) terbaik = jalan;
    } else {
      jalan = 0;
    }
  }
  return terbaik;
}

/**
 * The board, a row per week. "lewat" is a question whose week has closed and which
 * was never answered; it can still be answered, which is why it is not the same as
 * "salah".
 */
export function papanSesi(jawaban: Jawaban[], sesiSekarang: number): Sesi[] {
  const peta = petaJawaban(jawaban);
  return Array.from({ length: JUMLAH_SESI }, (_, i) => {
    const sesi = i + 1;
    const kotak: Kotak[] = soalSesi(sesi).map((nomor) => {
      const j = peta.get(nomor);
      if (j) return { nomor, status: j.benar ? "benar" : "salah" };
      if (sesi > sesiSekarang) return { nomor, status: "terkunci" };
      if (sesi === sesiSekarang) return { nomor, status: "terbuka" };
      return { nomor, status: "lewat" };
    });
    return { sesi, penuh: sesiPenuh(peta, sesi), kotak };
  });
}

export type Ringkasan = {
  /** The highest week that has opened; 0 before the quiz starts. */
  sesi: number;
  /** The highest question number that has opened. */
  terbuka: number;
  skor: number;
  streak: number;
  /** Opened questions with no answer yet — what the board invites them back to. */
  tertinggal: number;
  papan: Sesi[];
};

export function ringkasan(
  jawaban: Jawaban[],
  mulai: string,
  sekarang: number = Date.now(),
): Ringkasan {
  const sesi = sesiTerbuka(mulai, sekarang);
  const papan = papanSesi(jawaban, sesi);
  const kotak = papan.flatMap((p) => p.kotak);
  return {
    sesi,
    terbuka: soalTerbuka(mulai, sekarang),
    skor: skor(jawaban),
    streak: streak(jawaban, sesi),
    tertinggal: kotak.filter((k) => k.status === "lewat" || k.status === "terbuka").length,
    papan,
  };
}

/**
 * Leaderboard order: correct answers first, then the longer streak, then the
 * participant number so that the list does not shuffle between page loads.
 */
export type BarisPapan = {
  nomor: string;
  skor: number;
  streak: number;
};

export function urutkanPapan<T extends BarisPapan>(baris: T[]): T[] {
  return [...baris].sort(
    (a, b) => b.skor - a.skor || b.streak - a.streak || a.nomor.localeCompare(b.nomor),
  );
}

/**
 * Rank with ties sharing a place: two people on the same score and streak are both
 * 3rd, and the next is 5th. Anything else reads as the board making a distinction
 * the score does not.
 */
export function peringkat<T extends BarisPapan>(baris: T[]): (T & { rank: number })[] {
  const urut = urutkanPapan(baris);
  let rank = 0;
  let lalu: BarisPapan | null = null;
  return urut.map((b, i) => {
    if (!lalu || lalu.skor !== b.skor || lalu.streak !== b.streak) rank = i + 1;
    lalu = b;
    return { ...b, rank };
  });
}

/** Which week a question belongs to — re-exported so pages need one import fewer. */
export { sesiDari };
