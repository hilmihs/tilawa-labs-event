/**
 * The only place dates are formatted or bucketed.
 *
 * The server almost certainly runs in UTC. Every timestamp column is timestamptz,
 * which is correct — what goes wrong is the *grouping*. Arrival-rate buckets, the
 * attendance list, and "arrived today" must be computed in Asia/Jakarta. Seven hours
 * of drift shows an empty dashboard while the queue is already around the block.
 */
export const ZONA = "Asia/Jakarta";

const HARI_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HARI_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const BULAN_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const BULAN_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export type Lang = "en" | "ar";

/** Wall-clock parts of an instant, as seen in Jakarta. */
export function bagianWib(d: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === "24" ? "0" : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: wdMap[parts.weekday as string] ?? 0,
  };
}

/** Today's date in Jakarta as YYYY-MM-DD — the form the `tanggal` column uses. */
export function tanggalIsoWib(d = new Date()): string {
  const { year, month, day } = bagianWib(d);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Arabic-Indic digits. The Arabic mockups use them everywhere, including times. */
export function angkaArab(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

export function formatTanggal(d: Date, lang: Lang = "en"): string {
  const p = bagianWib(d);
  if (lang === "ar") {
    return `${HARI_AR[p.weekday]}، ${angkaArab(p.day)} ${BULAN_AR[p.month - 1]} ${angkaArab(p.year)}`;
  }
  return `${HARI_EN[p.weekday]}, ${p.day} ${BULAN_EN[p.month - 1]} ${p.year}`;
}

/** Date-only (a `date` column comes back as "2026-09-20" and has no timezone). */
/**
 * "22 Sep 2026" — no weekday, short month. For a range printed in one line, where
 * the full form ("Tuesday, 22 September 2026 – Wednesday, 21 October 2026") wraps
 * to three lines on a phone and says nothing the reader needed.
 */
export function formatTanggalRingkas(iso: string, lang: Lang = "en"): string {
  const d = new Date(`${iso}T05:00:00+07:00`);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    timeZone: ZONA,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatTanggalIso(iso: string, lang: Lang = "en"): string {
  const p = bagianTanggalIso(iso, lang);
  return lang === "ar" ? `${p.hari}، ${p.tanggal}` : `${p.hari}, ${p.tanggal}`;
}

/**
 * Day name and date as separate values.
 *
 * Callers that need the two apart must use this rather than splitting the
 * formatted string: Arabic joins them with U+060C (،), not an ASCII comma, so a
 * `split(", ")` silently returns the whole string as the weekday and nothing as
 * the date.
 */
export function bagianTanggalIso(
  iso: string,
  lang: Lang = "en",
): { hari: string; tanggal: string } {
  const [y, m, dd] = iso.split("-").map(Number);
  // Noon UTC keeps the calendar day stable in every timezone we care about.
  const d = new Date(Date.UTC(y, m - 1, dd, 12));
  const p = bagianWib(d);
  if (lang === "ar") {
    return {
      hari: HARI_AR[p.weekday],
      tanggal: `${angkaArab(p.day)} ${BULAN_AR[p.month - 1]} ${angkaArab(p.year)}`,
    };
  }
  return {
    hari: HARI_EN[p.weekday],
    tanggal: `${p.day} ${BULAN_EN[p.month - 1]} ${p.year}`,
  };
}

export function formatJam(d: Date, lang: Lang = "en"): string {
  const p = bagianWib(d);
  const s = `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
  return lang === "ar" ? angkaArab(s) : s;
}

export function formatJamDetik(d: Date, lang: Lang = "en"): string {
  const p = bagianWib(d);
  const s =
    `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}` +
    `:${String(p.second).padStart(2, "0")}`;
  return lang === "ar" ? angkaArab(s) : s;
}

/**
 * "07:30:00" (a `time` column) → "07.30 AM" in English, "٠٧:٣٠" in Arabic.
 *
 * The committee reads the English page the way a poster reads: a twelve-hour clock
 * with a dot, which is also how the times are written in the broadcast messages.
 * Arabic keeps the twenty-four hour clock in Arabic-Indic digits, where AM and PM
 * would be two Latin letters in the middle of the line.
 */
export function formatJamTampil(t: string | null | undefined, lang: Lang = "en"): string {
  if (!t) return "";
  const [jamRaw, menit = "00"] = t.slice(0, 5).split(":");
  const jam = Number(jamRaw);
  if (!Number.isFinite(jam)) return "";
  if (lang === "ar") {
    const angka = angkaArab(`${String(jam).padStart(2, "0")}:${menit}`);
    // Noon is said, not just written: "١٢:٠٠ ظهرًا", as on the committee's copy.
    return jam === 12 ? `${angka} ظهرًا` : angka;
  }
  const akhiran = jam >= 12 ? "PM" : "AM";
  const jam12 = jam % 12 === 0 ? 12 : jam % 12;
  return `${String(jam12).padStart(2, "0")}.${menit} ${akhiran}`;
}

/** "07:30:00" (a `time` column) → "07:30" or Arabic-Indic. */
export function formatJamKolom(t: string | null | undefined, lang: Lang = "en"): string {
  if (!t) return "";
  const s = t.slice(0, 5);
  return lang === "ar" ? angkaArab(s) : s;
}

/**
 * Bucket key for the arrival-rate chart: five-minute buckets in WIB, never UTC.
 * Returns "YYYY-MM-DDTHH:MM" so keys sort lexicographically.
 */
export function emberLimaMenit(d: Date): string {
  const p = bagianWib(d);
  const m = Math.floor(p.minute / 5) * 5;
  return (
    `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}` +
    `T${String(p.hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  );
}

/** Label for a bucket key, e.g. "06:45". */
export function labelEmber(kunci: string, lang: Lang = "en"): string {
  const s = kunci.slice(11);
  return lang === "ar" ? angkaArab(s) : s;
}

export function formatAngka(n: number, lang: Lang = "en"): string {
  const s = new Intl.NumberFormat("en-US").format(n);
  return lang === "ar" ? angkaArab(s) : s;
}

export function formatPersen(n: number, lang: Lang = "en"): string {
  const s = `${n.toFixed(1)}%`;
  return lang === "ar" ? angkaArab(s) : s;
}
