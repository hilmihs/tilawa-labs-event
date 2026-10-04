import { describe, expect, it } from "vitest";
import { ALASAN, KELOMPOK, MAKS_LAIN, MAKS_SARAN, kelompokDipilih, parseJawabanAbsen } from "./alasan";

const kosong = { alasan: [], alasanLain: "", waktu: [], pengingat: [], online: "", saran: "", kabari: false };

describe("ALASAN", () => {
  it("puts every reason in a known group", () => {
    for (const k of Object.values(ALASAN)) expect(KELOMPOK).toContain(k);
  });
});

describe("kelompokDipilih", () => {
  it("collects the groups of the chosen reasons", () => {
    expect([...kelompokDipilih(["lupa", "sakit", "info_terlambat"])].sort()).toEqual(["halangan", "info"]);
  });
});

describe("parseJawabanAbsen", () => {
  it("needs at least one known reason", () => {
    expect(parseJawabanAbsen(kosong)).toEqual({ ok: false, error: "alasan" });
    expect(parseJawabanAbsen({ ...kosong, alasan: ["bukan_kunci"] })).toEqual({ ok: false, error: "alasan" });
  });

  it("needs the text when 'something else' is picked", () => {
    expect(parseJawabanAbsen({ ...kosong, alasan: ["lain"], alasanLain: "   " })).toEqual({ ok: false, error: "lain" });
  });

  it("keeps known keys once and drops unknown ones", () => {
    const r = parseJawabanAbsen({ ...kosong, alasan: ["sakit", "sakit", "x", "lupa"] });
    expect(r.ok && r.data.alasan).toEqual(["sakit", "lupa"]);
  });

  it("keeps follow-ups only for the groups that were picked", () => {
    const r = parseJawabanAbsen({
      ...kosong,
      alasan: ["sakit"],
      waktu: ["pagi"],
      pengingat: ["email"],
      online: "ya",
    });
    expect(r.ok && r.data).toMatchObject({ waktuCocok: [], pengingat: [], mauOnline: null });

    const s = parseJawabanAbsen({
      ...kosong,
      alasan: ["jam_kurang_pas", "lupa", "jauh"],
      waktu: ["pagi", "zzz"],
      pengingat: ["wa_h1"],
      online: "tidak",
    });
    expect(s.ok && s.data).toMatchObject({ waktuCocok: ["pagi"], pengingat: ["wa_h1"], mauOnline: false });
  });

  it("trims and caps free text, and stores empty as null", () => {
    const r = parseJawabanAbsen({
      ...kosong,
      alasan: ["lain"],
      alasanLain: "x".repeat(MAKS_LAIN + 50),
      saran: "  ",
      kabari: true,
    });
    expect(r.ok && r.data.alasanLain?.length).toBe(MAKS_LAIN);
    expect(r.ok && r.data.saran).toBeNull();
    expect(r.ok && r.data.kabari).toBe(true);
    const s = parseJawabanAbsen({ ...kosong, alasan: ["tema"], saran: "y".repeat(MAKS_SARAN + 1) });
    expect(s.ok && s.data.saran?.length).toBe(MAKS_SARAN);
  });

  it("drops the other-reason text when 'something else' is not picked", () => {
    const r = parseJawabanAbsen({ ...kosong, alasan: ["tema"], alasanLain: "stale" });
    expect(r.ok && r.data.alasanLain).toBeNull();
  });
});
