import { describe, expect, it } from "vitest";
import { rekapAbsen, type BarisRekap } from "./rekap";

const t = new Date("2026-09-26T10:00:00Z");
const baris = (p: Partial<BarisRekap>): BarisRekap => ({
  alasan: null,
  waktuCocok: null,
  pengingat: null,
  mauOnline: null,
  kabari: false,
  emailAt: null,
  diisiAt: null,
  ...p,
});

describe("rekapAbsen", () => {
  const rows = [
    baris({}), // never emailed
    baris({ emailAt: t }), // emailed, not answered
    baris({ emailAt: t }), // emailed, not answered
    baris({ emailAt: t, diisiAt: t, alasan: ["lupa", "info_terlambat", "sakit"], pengingat: ["wa_h1"], kabari: true }),
    // Answered from the WhatsApp link without ever being emailed.
    baris({ diisiAt: t, alasan: ["jam_kurang_pas", "jauh"], waktuCocok: ["pagi", "akhir_pekan"], mauOnline: true }),
  ];
  const r = rekapAbsen(rows);

  it("counts the funnel", () => {
    expect(r.funnel).toEqual({ absen: 5, diemail: 3, mengisi: 2 });
  });

  it("counts people per group once, however many of its reasons they ticked", () => {
    const info = r.kelompok.find((k) => k.kelompok === "info")!;
    expect(info.orang).toBe(1);
    expect(info.alasan.find((a) => a.kunci === "lupa")!.jumlah).toBe(1);
    expect(info.alasan.find((a) => a.kunci === "info_terlambat")!.jumlah).toBe(1);
    expect(r.kelompok.find((k) => k.kelompok === "waktu")!.orang).toBe(1);
    expect(r.kelompok.find((k) => k.kelompok === "minat")!.orang).toBe(0);
  });

  it("sorts groups by people, busiest first, and keeps every group", () => {
    expect(r.kelompok).toHaveLength(6);
    for (let i = 1; i < r.kelompok.length; i++) {
      expect(r.kelompok[i - 1].orang).toBeGreaterThanOrEqual(r.kelompok[i].orang);
    }
  });

  it("tallies follow-ups and opt-ins", () => {
    expect(r.waktu.pagi).toBe(1);
    expect(r.waktu.malam).toBe(0);
    expect(r.pengingat.wa_h1).toBe(1);
    expect(r.online).toEqual({ ya: 1, tidak: 0 });
    expect(r.kabari).toBe(1);
  });

  it("ignores answers from rows that were never submitted", () => {
    const x = rekapAbsen([baris({ alasan: ["sakit"] })]);
    expect(x.kelompok.find((k) => k.kelompok === "halangan")!.orang).toBe(0);
  });
});
