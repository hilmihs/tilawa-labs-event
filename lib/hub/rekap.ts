import { MINAT_KEYS, isMinat, type MinatKey } from "./konten";

export type AngkaClub = { total: number; ikhwan: number; akhwat: number; batal: number };

/**
 * Interest per club and Tilawa Labs Fest, split by side of the hall — the groups will be separate for
 * brothers and sisters, so that is the number the committee plans with. Withdrawn
 * rows are counted apart, never in the total.
 */
export function hitungRekap(rows: { club: string; gender: string; batalAt: Date | null }[]): Record<MinatKey, AngkaClub> {
  const hasil = Object.fromEntries(
    MINAT_KEYS.map((k) => [k, { total: 0, ikhwan: 0, akhwat: 0, batal: 0 }]),
  ) as Record<MinatKey, AngkaClub>;
  for (const r of rows) {
    if (!isMinat(r.club)) continue;
    const a = hasil[r.club];
    if (r.batalAt) {
      a.batal += 1;
      continue;
    }
    a.total += 1;
    if (r.gender === "ikhwan") a.ikhwan += 1;
    else if (r.gender === "akhwat") a.akhwat += 1;
  }
  return hasil;
}
