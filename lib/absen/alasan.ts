/**
 * The reasons a registrant can give for not coming, and the follow-up questions some
 * of them unlock.
 *
 * Keys are what the database stores; labels live in the dictionary. Grouping is part
 * of the key's definition rather than of the recap, so the page, the parser and the
 * panel can never disagree about which group a reason belongs to.
 */

export const KELOMPOK = ["waktu", "halangan", "akses", "info", "minat", "lain"] as const;
export type Kelompok = (typeof KELOMPOK)[number];

export const ALASAN = {
  bentrok_kuliah: "waktu",
  bentrok_lain: "waktu",
  jam_kurang_pas: "waktu",
  sakit: "halangan",
  keluarga: "halangan",
  jauh: "akses",
  cuaca: "akses",
  lupa: "info",
  info_kurang_jelas: "info",
  info_terlambat: "info",
  tema: "minat",
  ikut_teman: "minat",
  lain: "lain",
} as const satisfies Record<string, Kelompok>;
export type KunciAlasan = keyof typeof ALASAN;
export const KUNCI_ALASAN = Object.keys(ALASAN) as KunciAlasan[];

/** Asked only when a timing reason was picked. */
export const WAKTU = ["hari_kerja", "akhir_pekan", "pagi", "siang", "sore", "malam"] as const;
export type KunciWaktu = (typeof WAKTU)[number];

/** Asked only when an information reason was picked. */
export const PENGINGAT = ["wa_h1", "wa_h0", "email", "grup"] as const;
export type KunciPengingat = (typeof PENGINGAT)[number];

export const MAKS_LAIN = 200;
export const MAKS_SARAN = 300;

export type JawabanAbsen = {
  alasan: KunciAlasan[];
  alasanLain: string | null;
  waktuCocok: KunciWaktu[];
  pengingat: KunciPengingat[];
  mauOnline: boolean | null;
  saran: string | null;
  kabari: boolean;
};

export type MasukanAbsen = {
  alasan: string[];
  alasanLain: string;
  waktu: string[];
  pengingat: string[];
  online: string;
  saran: string;
  kabari: boolean;
};

const isAlasan = (k: string): k is KunciAlasan => Object.hasOwn(ALASAN, k);

export function kelompokDipilih(alasan: readonly string[]): Set<Kelompok> {
  return new Set(alasan.filter(isAlasan).map((k) => ALASAN[k]));
}

function teksAtauNull(v: string, maks: number): string | null {
  const s = v.trim().replace(/\s+/g, " ");
  return s ? s.slice(0, maks) : null;
}

/**
 * Turns the raw form into what gets stored.
 *
 * A follow-up whose group was not picked is dropped even if the browser sent it: the
 * participant may pick "timing", answer the time question, then untick "timing". The
 * recap counts follow-ups against the people who were actually asked them.
 */
export function parseJawabanAbsen(
  m: MasukanAbsen,
): { ok: true; data: JawabanAbsen } | { ok: false; error: "alasan" | "lain" } {
  const alasan = [...new Set(m.alasan.filter(isAlasan))];
  if (alasan.length === 0) return { ok: false, error: "alasan" };

  const alasanLain = alasan.includes("lain") ? teksAtauNull(m.alasanLain, MAKS_LAIN) : null;
  if (alasan.includes("lain") && !alasanLain) return { ok: false, error: "lain" };

  const grup = kelompokDipilih(alasan);
  const waktuCocok = grup.has("waktu")
    ? [...new Set(m.waktu)].filter((k): k is KunciWaktu => (WAKTU as readonly string[]).includes(k))
    : [];
  const pengingat = grup.has("info")
    ? [...new Set(m.pengingat)].filter((k): k is KunciPengingat => (PENGINGAT as readonly string[]).includes(k))
    : [];
  const mauOnline = grup.has("akses") ? (m.online === "ya" ? true : m.online === "tidak" ? false : null) : null;

  return {
    ok: true,
    data: {
      alasan,
      alasanLain,
      waktuCocok,
      pengingat,
      mauOnline,
      saran: teksAtauNull(m.saran, MAKS_SARAN),
      kabari: m.kabari,
    },
  };
}
