import { describe, expect, it } from "vitest";
import { JABODETABEK, PROVINSI, PULAU } from "./data";

describe("region data", () => {
  it("has every province, regency and city in Indonesia", () => {
    expect(PROVINSI).toHaveLength(38);
    expect(PROVINSI.reduce((n, p) => n + p.kabkota.length, 0)).toBe(514);
  });

  it("puts every province on an island that exists", () => {
    const pulau = new Set(PULAU.map((p) => p.kode));
    for (const p of PROVINSI) expect(pulau.has(p.pulau)).toBe(true);
    // Java: Jakarta, West, Central, Yogyakarta, East, Banten.
    expect(PROVINSI.filter((p) => p.pulau === "jawa")).toHaveLength(6);
    // The four provinces carved out of Papua in 2022 are there.
    expect(PROVINSI.filter((p) => p.pulau === "papua")).toHaveLength(6);
  });

  it("lists Jabodetabek down to the district", () => {
    expect(JABODETABEK).toHaveLength(14);
    expect(JABODETABEK.reduce((n, k) => n + k.kecamatan.length, 0)).toBe(185);
    expect(JABODETABEK.find((k) => k.simpan === "Kota Jakarta Selatan")?.kecamatan).toContain("Pasar Minggu");
  });

  it("names every place once, with both labels filled in", () => {
    for (const p of PROVINSI) {
      expect(p.en && p.ar && p.simpan).toBeTruthy();
      expect(new Set(p.kabkota).size).toBe(p.kabkota.length);
    }
    for (const k of JABODETABEK) expect(k.en && k.ar && k.simpan).toBeTruthy();
  });
});
