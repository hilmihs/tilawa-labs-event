import { describe, expect, it } from "vitest";
import { TANPA_KAB, hitungPeta } from "./rekap";

describe("hitungPeta", () => {
  it("counts per province, regency and district, and keeps the unmatched apart", () => {
    const p = hitungPeta([
      "Pasar Minggu, Kota Jakarta Selatan",
      "Jati padang",
      "Kota Jakarta Selatan",
      "Kab. Garut, Jawa Barat",
      "Jawa Barat",
      "Kontrakan",
      "",
      null,
    ]);
    expect(p.cocok).toBe(5);
    expect(p.provinsi.map((x) => [x.kode, x.n])).toEqual([
      ["31", 3],
      ["32", 2],
    ]);
    const jaksel = p.provinsi[0].kab[0];
    expect(jaksel).toMatchObject({ nama: "Kota Jakarta Selatan", n: 3 });
    expect(jaksel.kec).toEqual([{ nama: "Pasar Minggu", n: 2 }]);
    expect(p.provinsi[1].kab.map((k) => k.nama).sort()).toEqual(["Kab. Garut", TANPA_KAB].sort());
    expect(p.pulau).toEqual([{ kode: "jawa", nama: "Java", n: 5 }]);
    expect(p.tidakCocok).toEqual([{ label: "Kontrakan", n: 1 }]);
  });
});
