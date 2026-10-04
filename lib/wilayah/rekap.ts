import { kelompokkanTeks } from "@/lib/acara/rapikan-teks";
import { cocokTempat } from "./cocok";
import { PROVINSI, PULAU, type KodePulau } from "./data";

/*
 * People per province → regency/city → Jabodetabek district, for the map on
 * /panel/ringkasan. Pure, so it is tested without a database.
 */

export type Hitung = { nama: string; n: number };
export type KabPeta = Hitung & { kec: Hitung[] };
export type ProvPeta = { kode: string; nama: string; pulau: KodePulau; n: number; kab: KabPeta[] };

export type PetaWilayah = {
  /** Answers placed in a province. */
  cocok: number;
  provinsi: ProvPeta[];
  pulau: { kode: KodePulau; nama: string; n: number }[];
  /** Answers that name no recognisable place, grouped like any free text. */
  tidakCocok: { label: string; n: number }[];
};

/** Shown when an answer names the province but not the regency or city. */
export const TANPA_KAB = "Regency/city not stated";

function urut<T extends { n: number; nama: string }>(xs: T[]): T[] {
  return xs.sort((a, b) => b.n - a.n || a.nama.localeCompare(b.nama));
}

export function hitungPeta(nilai: Array<string | null | undefined>): PetaWilayah {
  const prov = new Map<string, Map<string, Map<string, number>>>();
  const gagal: string[] = [];
  let cocok = 0;
  for (const v of nilai) {
    const teks = (v ?? "").trim();
    if (!teks) continue;
    const t = cocokTempat(teks);
    if (!t) {
      gagal.push(teks);
      continue;
    }
    cocok++;
    const kabs = prov.get(t.prov) ?? new Map<string, Map<string, number>>();
    prov.set(t.prov, kabs);
    const kab = t.kab ?? TANPA_KAB;
    const kecs = kabs.get(kab) ?? new Map<string, number>();
    kabs.set(kab, kecs);
    const kec = t.kec ?? "";
    kecs.set(kec, (kecs.get(kec) ?? 0) + 1);
  }

  const provinsi: ProvPeta[] = urut(
    PROVINSI.filter((p) => prov.has(p.kode)).map((p) => {
      const kab = urut(
        [...prov.get(p.kode)!].map(([nama, kecs]) => ({
          nama,
          n: [...kecs.values()].reduce((a, b) => a + b, 0),
          // Only named districts; people who gave just the city are the difference.
          kec: urut([...kecs].filter(([k]) => k).map(([k, n]) => ({ nama: k, n }))),
        })),
      );
      return { kode: p.kode, nama: p.simpan, pulau: p.pulau, n: kab.reduce((a, k) => a + k.n, 0), kab };
    }),
  );

  const pulau = PULAU.map((pl) => ({
    kode: pl.kode,
    nama: pl.en,
    n: provinsi.filter((p) => p.pulau === pl.kode).reduce((a, p) => a + p.n, 0),
  }))
    .filter((pl) => pl.n > 0)
    .sort((a, b) => b.n - a.n);

  return {
    cocok,
    provinsi,
    pulau,
    tidakCocok: kelompokkanTeks(gagal).grup.map((g) => ({ label: g.label, n: g.n })),
  };
}
