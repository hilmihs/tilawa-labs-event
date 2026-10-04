import { describe, expect, it } from "vitest";
import { cocokTempat } from "./cocok";

describe("cocokTempat", () => {
  it("reads the picker's own answers exactly", () => {
    expect(cocokTempat("Kab. Garut, Jawa Barat")).toEqual({ prov: "32", kab: "Kab. Garut", kec: null });
    expect(cocokTempat("Pasar Minggu, Kota Jakarta Selatan")).toEqual({
      prov: "31",
      kab: "Kota Jakarta Selatan",
      kec: "Pasar Minggu",
    });
    expect(cocokTempat("Jawa Tengah")).toEqual({ prov: "33", kab: null, kec: null });
  });

  it("reads older free text", () => {
    expect(cocokTempat("Jaksel")).toMatchObject({ prov: "31", kab: "Kota Jakarta Selatan" });
    expect(cocokTempat("lombok timur NTB")).toMatchObject({ prov: "52", kab: "Kab. Lombok Timur" });
    expect(cocokTempat("Jati padang")).toMatchObject({ kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" });
    expect(cocokTempat("Pekanbaru")).toMatchObject({ prov: "14", kab: "Kota Pekanbaru" });
    expect(cocokTempat("Solo")).toMatchObject({ prov: "33", kab: "Kota Surakarta" });
    expect(cocokTempat("بوغور")).toMatchObject({ prov: "32" });
  });

  it("does not pick a regency when the answer does not say which", () => {
    expect(cocokTempat("Bogor")).toEqual({ prov: "32", kab: "Bogor (Kab./Kota)", kec: null });
  });

  it("settles a district that exists in two cities by the city next to it", () => {
    expect(cocokTempat("Cipayung, Kota Depok")).toMatchObject({ kab: "Kota Depok", kec: "Cipayung" });
    expect(cocokTempat("Cipayung, Kota Jakarta Timur")).toMatchObject({ kab: "Kota Jakarta Timur", kec: "Cipayung" });
  });

  it("reads the city in English and in Arabic, and written without the space", () => {
    expect(cocokTempat("South Jakarta")).toMatchObject({ prov: "31", kab: "Kota Jakarta Selatan" });
    expect(cocokTempat("East Jakarta")).toMatchObject({ prov: "31", kab: "Kota Jakarta Timur" });
    expect(cocokTempat("جاكرتا الجنوبية")).toMatchObject({ prov: "31", kab: "Kota Jakarta Selatan" });
    expect(cocokTempat("JakartaTimur")).toMatchObject({ prov: "31", kab: "Kota Jakarta Timur" });
  });

  it("takes the longer name when a street shares one with a regency elsewhere", () => {
    // Ketapang is a street here and a regency in West Kalimantan; two words beat one.
    expect(cocokTempat("jln ketapang jakarta selatan")).toMatchObject({
      prov: "31",
      kab: "Kota Jakarta Selatan",
    });
  });

  it("keeps the city when two of its districts are named and neither is the answer", () => {
    expect(cocokTempat("Cilandak, pasar Minggu")).toEqual({
      prov: "31",
      kab: "Kota Jakarta Selatan",
      kec: null,
    });
  });

  it("leaves what is not a place unmatched", () => {
    expect(cocokTempat("Kontrakan")).toBeNull();
    expect(cocokTempat("")).toBeNull();
  });
});
