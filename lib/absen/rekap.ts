import {
  ALASAN,
  KELOMPOK,
  KUNCI_ALASAN,
  PENGINGAT,
  WAKTU,
  type Kelompok,
  type KunciAlasan,
  type KunciPengingat,
  type KunciWaktu,
} from "./alasan";

export type BarisRekap = {
  alasan: string[] | null;
  waktuCocok: string[] | null;
  pengingat: string[] | null;
  mauOnline: boolean | null;
  kabari: boolean;
  emailAt: Date | null;
  diisiAt: Date | null;
};

export type RekapAbsen = {
  funnel: { absen: number; diemail: number; mengisi: number };
  kelompok: { kelompok: Kelompok; orang: number; alasan: { kunci: KunciAlasan; jumlah: number }[] }[];
  waktu: Record<KunciWaktu, number>;
  pengingat: Record<KunciPengingat, number>;
  online: { ya: number; tidak: number };
  kabari: number;
};

const nol = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;

/**
 * `rows` is every no-show of the programme, answered or not, so the funnel's first
 * number is the whole target group. Answers count only from submitted rows.
 *
 * "Emailed" is the only reach we can see: the WhatsApp message goes out from Halo AI
 * and the link is one static page per programme, so neither a send nor an open
 * comes back to us. Someone who answers from WhatsApp is answered but not emailed.
 *
 * A group counts people, not ticks: someone who forgot AND heard late is one person
 * the information problem lost, and the group bar must say so. The reasons inside a
 * group still count ticks, which is why they can add up to more than the group.
 */
export function rekapAbsen(rows: BarisRekap[]): RekapAbsen {
  const perAlasan = nol(KUNCI_ALASAN);
  const perKelompok = nol(KELOMPOK);
  const waktu = nol(WAKTU);
  const pengingat = nol(PENGINGAT);
  const online = { ya: 0, tidak: 0 };
  let kabari = 0;
  const funnel = { absen: rows.length, diemail: 0, mengisi: 0 };

  for (const r of rows) {
    if (r.emailAt) funnel.diemail += 1;
    if (!r.diisiAt) continue;
    funnel.mengisi += 1;

    const grup = new Set<Kelompok>();
    for (const k of r.alasan ?? []) {
      if (!Object.hasOwn(ALASAN, k)) continue;
      perAlasan[k as KunciAlasan] += 1;
      grup.add(ALASAN[k as KunciAlasan]);
    }
    for (const g of grup) perKelompok[g] += 1;
    for (const k of r.waktuCocok ?? []) if (k in waktu) waktu[k as KunciWaktu] += 1;
    for (const k of r.pengingat ?? []) if (k in pengingat) pengingat[k as KunciPengingat] += 1;
    if (r.mauOnline === true) online.ya += 1;
    if (r.mauOnline === false) online.tidak += 1;
    if (r.kabari) kabari += 1;
  }

  const kelompok = KELOMPOK.map((g) => ({
    kelompok: g,
    orang: perKelompok[g],
    alasan: KUNCI_ALASAN.filter((k) => ALASAN[k] === g)
      .map((k) => ({ kunci: k, jumlah: perAlasan[k] }))
      .sort((a, b) => b.jumlah - a.jumlah),
  })).sort((a, b) => b.orang - a.orang);

  return { funnel, kelompok, waktu, pengingat, online, kabari };
}
