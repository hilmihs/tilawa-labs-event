/**
 * Turning a raw page view into the few things the traffic tab groups by. Pure, so it
 * is tested without a browser or a database.
 */

export type JenisHalaman =
  | "beranda"
  | "daftar-program"
  | "program"
  | "formulir"
  | "cari-tiket"
  | "tiket"
  | "artikel"
  | "kuis"
  | "akun"
  | "hub"
  | "lain";

export const LABEL_HALAMAN: Record<JenisHalaman, string> = {
  beranda: "Home (current programme)",
  "daftar-program": "Programme list",
  program: "Programme page",
  formulir: "Registration form",
  "cari-tiket": "Find my ticket",
  tiket: "E-ticket",
  artikel: "Lecture notes (article)",
  kuis: "Quiz",
  akun: "Account & sign-in",
  hub: "Programme Hub (clubs)",
  lain: "Other",
};

/**
 * Rows in `kunjungan` that are taps on an interest button, not page views (see
 * app/api/kunjungan). Every traffic query excludes this kind.
 */
export const HALAMAN_KETUK_MINAT = "ketuk-minat";

/** Paths nobody outside the committee opens; they are never counted as traffic. */
const STAF = /^\/(scan|panel|admin|assist|print|gate|api)(\/|$)/;

export function halamanStaf(path: string): boolean {
  return STAF.test(path);
}

/**
 * The path as it is stored: no query string, and no ticket token. A token is a
 * working credential for someone's ticket; a traffic table is not where it belongs.
 */
export function rapikanPath(path: string): string {
  const tanpaQuery = path.split(/[?#]/)[0] || "/";
  return tanpaQuery
    .replace(/^\/(en|ar)\/ticket\/(?!saved(\/|$))[^/]+/, "/$1/ticket/…")
    .replace(/^\/(en|ar)\/reset-password\/[^/]+/, "/$1/reset-password/…")
    .slice(0, 200);
}

export function jenisHalaman(path: string): { halaman: JenisHalaman; slug: string | null; lang: string | null } {
  const bagian = path.split(/[?#]/)[0].split("/").filter(Boolean);
  const lang = bagian[0] === "ar" || bagian[0] === "en" ? bagian[0] : null;
  const sisa = lang ? bagian.slice(1) : bagian;

  if (sisa.length === 0) return { halaman: "beranda", slug: null, lang };
  if (sisa[0] === "program") return { halaman: "daftar-program", slug: null, lang };
  if (sisa[0] === "p" && sisa[1]) {
    const slug = sisa[1].slice(0, 60);
    if (sisa[2] === "register") return { halaman: "formulir", slug, lang };
    if (sisa[2] === "ticket") return { halaman: "cari-tiket", slug, lang };
    // Read after the lecture, not on the way to registering: kept out of "program" so
    // the funnel's first step only counts people looking at the programme itself.
    if (sisa[2] === "notes") return { halaman: "artikel", slug, lang };
    if (sisa[2] === "quiz") return { halaman: "kuis", slug, lang };
    return { halaman: "program", slug, lang };
  }
  if (sisa[0] === "register") return { halaman: "formulir", slug: null, lang };
  if (sisa[0] === "ticket") return { halaman: sisa[1] && sisa[1] !== "saved" ? "tiket" : "cari-tiket", slug: null, lang };
  // The club (or null for the /hub index, where Tilawa Labs Fest lives) goes in `slug`; the
  // programme funnel only reads `slug` together with its own page kinds.
  if (sisa[0] === "hub") return { halaman: "hub", slug: sisa[1] ? sisa[1].slice(0, 60) : null, lang };
  if (["masuk", "daftar-akun", "lupa-password", "reset-password", "akun"].includes(sisa[0])) {
    return { halaman: "akun", slug: null, lang };
  }
  return { halaman: "lain", slug: null, lang };
}

/**
 * Where the visit came from. A campaign tag wins; then the referring site, named when
 * it is one the committee posts on. No referrer is "Direct" — which includes the
 * WhatsApp app, because WhatsApp opens links without saying where they came from.
 */
export function sumberKunjungan(perujuk: string | null | undefined, utm: string | null | undefined, hostSendiri: string): {
  sumber: string;
  perujuk: string | null;
} {
  const tag = (utm ?? "").trim().toLowerCase().slice(0, 40);
  let host: string | null = null;
  try {
    host = perujuk ? new URL(perujuk).hostname.toLowerCase().replace(/^www\./, "") : null;
  } catch {
    host = null;
  }
  if (host && host === hostSendiri.toLowerCase().replace(/^www\./, "")) host = null;

  const dikenal = (h: string): string | null => {
    if (/(^|\.)whatsapp\.(com|net)$|^wa\.me$/.test(h)) return "WhatsApp";
    if (/(^|\.)instagram\.com$/.test(h)) return "Instagram";
    if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(h)) return "Facebook";
    if (/^t\.co$|(^|\.)(twitter|x)\.com$/.test(h)) return "X / Twitter";
    if (/^t\.me$|(^|\.)telegram\.(org|me)$/.test(h)) return "Telegram";
    if (/(^|\.)tiktok\.com$/.test(h)) return "TikTok";
    if (/(^|\.)youtube\.com$|^youtu\.be$/.test(h)) return "YouTube";
    if (/(^|\.)google\.[a-z.]+$/.test(h)) return "Google";
    if (/(^|\.)bing\.com$/.test(h)) return "Bing";
    return null;
  };

  if (tag) {
    const nama = dikenal(tag.includes(".") ? tag : `${tag}.com`) ?? (tag === "wa" ? "WhatsApp" : tag);
    return { sumber: nama, perujuk: host };
  }
  if (!host) return { sumber: "Direct", perujuk: null };
  return { sumber: dikenal(host) ?? host, perujuk: host };
}

export function jenisPerangkat(ua: string): "mobile" | "tablet" | "desktop" {
  const u = ua.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(u)) return "tablet";
  if (/mobi|iphone|ipod|android|windows phone/.test(u)) return "mobile";
  return "desktop";
}

/** Crawlers and link-preview fetchers that run scripts. Real browsers only. */
export function bukanManusia(ua: string): boolean {
  return !ua || /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|facebookexternalhit|embedly|curl|wget|python-requests/i.test(ua);
}
