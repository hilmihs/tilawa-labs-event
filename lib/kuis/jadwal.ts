import { JUMLAH_SOAL } from "./soal";

/**
 * When each batch of questions opens.
 *
 * Two releases a week — Monday and Thursday morning — eight in all, thirty
 * questions. It began as one a day, then one a week; the committee has to write and
 * send the WhatsApp reminder by hand, and twice a week is often enough to keep the
 * quiz present without becoming a chore nobody does by the third week.
 *
 * The unit here is the release, not the calendar week. A release opens at 05.00 and
 * counts for the streak until the midnight before the next one — so a Monday batch
 * is due by Wednesday night and a Thursday batch by Sunday night.
 *
 * The batches are not equal on purpose — thirty does not divide by eight — so their
 * sizes are written out rather than computed, and a test checks they still add up to
 * the bank. They pair off into eights and sevens by calendar week: 4+4, 4+3, 4+4,
 * 4+3.
 *
 * Jakarta has had no daylight saving and a fixed +07:00 since 1988, so the offset is
 * written into the timestamps rather than computed.
 *
 * A release that has opened never closes: its questions can still be answered, and
 * they still score. What closing takes away is the streak.
 */

export const JAM_BUKA = 5;

/** Weekdays a release lands on, after the first: Monday and Thursday. */
const HARI_RILIS = [1, 4];

/** How many questions open in each release, in order. Must total JUMLAH_SOAL. */
export const SEBARAN_SESI: number[] = [4, 4, 4, 3, 4, 4, 4, 3];
export const JUMLAH_SESI = SEBARAN_SESI.length;

/** The question number each release starts at. */
const AWAL_SESI = SEBARAN_SESI.reduce<number[]>((awal, n, i) => [...awal, awal[i] + n], [1]);

const HARI_MS = 86_400_000;

/** 0 = Sunday … 6 = Saturday, read in Jakarta. */
function hariPekan(iso: string): number {
  const nama = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
  }).format(new Date(`${iso}T12:00:00+07:00`));
  const peta: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return peta[nama] ?? 0;
}

function tambahHari(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T12:00:00+07:00`) + n * HARI_MS).toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });
}

/**
 * The date each release falls on. The first is the day after the lecture, whatever
 * weekday that is; every one after it is the next Monday or Thursday.
 *
 * One more date than there are releases: the extra one is where the last release's
 * deadline comes from.
 */
function tanggalRilis(mulai: string): string[] {
  const tanggal = [mulai];
  for (let i = 0; i < JUMLAH_SESI; i++) {
    let d = tambahHari(tanggal[i], 1);
    while (!HARI_RILIS.includes(hariPekan(d))) d = tambahHari(d, 1);
    tanggal.push(d);
  }
  return tanggal;
}

/** Which release question `soal` belongs to: 1…8. */
export function sesiDari(soal: number): number {
  for (let s = JUMLAH_SESI; s >= 1; s--) {
    if (soal >= AWAL_SESI[s - 1]) return s;
  }
  return 1;
}

/** The question numbers in one release, in order. */
export function soalSesi(sesi: number): number[] {
  if (sesi < 1 || sesi > JUMLAH_SESI) return [];
  const awal = AWAL_SESI[sesi - 1];
  return Array.from({ length: SEBARAN_SESI[sesi - 1] }, (_, i) => awal + i).filter(
    (n) => n <= JUMLAH_SOAL,
  );
}

/** The instant a release's questions open: 05.00 on its own morning. */
export function bukaSesi(mulai: string, sesi: number): number {
  const tanggal = tanggalRilis(mulai)[Math.max(0, sesi - 1)];
  return Date.parse(`${tanggal}T${String(JAM_BUKA).padStart(2, "0")}:00:00+07:00`);
}

/**
 * The instant a release stops counting for the streak: midnight at the end of the
 * day before the next release. Exclusive — an answer at exactly this instant is late.
 */
export function tutupSesi(mulai: string, sesi: number): number {
  const tanggal = tanggalRilis(mulai)[sesi];
  return Date.parse(`${tanggal}T00:00:00+07:00`);
}

/** First and last calendar dates a release is open for the streak, YYYY-MM-DD. */
export function tanggalSesi(mulai: string, sesi: number): { dari: string; sampai: string } {
  const lokal = (ms: number) =>
    new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  return {
    dari: lokal(bukaSesi(mulai, sesi)),
    // One second before the midnight that closes it: the last whole day.
    sampai: lokal(tutupSesi(mulai, sesi) - 1000),
  };
}

/** The highest release that has opened: 0 before the quiz starts, 8 once all have. */
export function sesiTerbuka(mulai: string, sekarang: number = Date.now()): number {
  if (sekarang < bukaSesi(mulai, 1)) return 0;
  for (let s = JUMLAH_SESI; s >= 1; s--) {
    if (sekarang >= bukaSesi(mulai, s)) return s;
  }
  return 0;
}

/** The highest question number that has opened; 0 before the quiz starts. */
export function soalTerbuka(mulai: string, sekarang: number = Date.now()): number {
  const sesi = sesiTerbuka(mulai, sekarang);
  return sesi === 0 ? 0 : Math.min(JUMLAH_SOAL, AWAL_SESI[sesi] - 1);
}

export function sudahTerbuka(mulai: string, soal: number, sekarang: number = Date.now()): boolean {
  if (!isSoalSah(soal)) return false;
  return sekarang >= bukaSesi(mulai, sesiDari(soal));
}

/** Answered within its own release window, so the streak survives. */
export function tepatWaktu(mulai: string, soal: number, sekarang: number = Date.now()): boolean {
  if (!sudahTerbuka(mulai, soal, sekarang)) return false;
  return sekarang < tutupSesi(mulai, sesiDari(soal));
}

/** Every release has opened and the last one's window has closed. */
export function kuisSelesai(mulai: string, sekarang: number = Date.now()): boolean {
  return sekarang >= tutupSesi(mulai, JUMLAH_SESI);
}

export function isSoalSah(soal: number): boolean {
  return Number.isInteger(soal) && soal >= 1 && soal <= JUMLAH_SOAL;
}

/**
 * The quiz runs from the day after the lecture. Written as a derivation rather than
 * a second date to keep in step: moving the lecture moves the quiz with it.
 */
export function mulaiSetelah(tanggalKajian: string): string {
  return tambahHari(tanggalKajian, 1);
}
