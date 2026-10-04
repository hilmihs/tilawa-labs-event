import { describe, expect, it } from "vitest";
import { isClub, isKunciTombol, isMinat, kunciDari } from "./konten";
import { hitungRekap } from "./rekap";

describe("isClub", () => {
  it("accepts only the three club keys", () => {
    expect(isClub("english")).toBe(true);
    expect(isClub("arabic")).toBe(true);
    expect(isClub("mabit")).toBe(true);
    expect(isClub("English")).toBe(false);
    expect(isClub("")).toBe(false);
    expect(isClub(undefined)).toBe(false);
  });
});

describe("interest keys", () => {
  it("adds Tilawa Labs Fest to the clubs, and 'semua' records every key", () => {
    expect(isMinat("fest")).toBe(true);
    expect(isClub("fest")).toBe(false);
    expect(isMinat("semua")).toBe(false);
    expect(isKunciTombol("semua")).toBe(true);
    expect(isKunciTombol("all")).toBe(false);
    expect(kunciDari("semua")).toEqual(["english", "arabic", "mabit", "fest", "fest-olimpiade", "fest-karya", "fest-mhq"]);
    expect(kunciDari("fest")).toEqual(["fest", "fest-olimpiade", "fest-karya", "fest-mhq"]);
    expect(kunciDari("fest-mhq")).toEqual(["fest-mhq"]);
    expect(isKunciTombol("fest-mhq")).toBe(true);
  });
});

describe("hitungRekap", () => {
  it("splits active interest by gender and keeps withdrawals out of the total", () => {
    const r = hitungRekap([
      { club: "english", gender: "ikhwan", batalAt: null },
      { club: "english", gender: "akhwat", batalAt: null },
      { club: "english", gender: "akhwat", batalAt: new Date() },
      { club: "mabit", gender: "ikhwan", batalAt: null },
      { club: "fest", gender: "akhwat", batalAt: null },
      { club: "lama", gender: "ikhwan", batalAt: null },
    ]);
    expect(r.english).toEqual({ total: 2, ikhwan: 1, akhwat: 1, batal: 1 });
    expect(r.arabic).toEqual({ total: 0, ikhwan: 0, akhwat: 0, batal: 0 });
    expect(r.mabit).toEqual({ total: 1, ikhwan: 1, akhwat: 0, batal: 0 });
    expect(r.fest).toEqual({ total: 1, ikhwan: 0, akhwat: 1, batal: 0 });
  });
});
