import { describe, expect, it } from "vitest";
import {
  JUMLAH_SESI,
  SEBARAN_SESI,
  bukaSesi,
  isSoalSah,
  kuisSelesai,
  mulaiSetelah,
  sesiDari,
  sesiTerbuka,
  soalSesi,
  soalTerbuka,
  sudahTerbuka,
  tanggalSesi,
  tepatWaktu,
  tutupSesi,
} from "./jadwal";

/*
 * The lecture was on Monday 21 September 2026, so the quiz starts on Tuesday the
 * 22nd. That first release is off the Monday/Thursday rhythm — it lands the morning
 * after the lecture, whatever weekday that is — and every release after it is the
 * next Monday or Thursday: 24, 28 Sep, 1, 5, 8, 12, 15 Oct. Eight in all, the last
 * one closing when Sunday 18 October ends.
 */
const MULAI = "2026-09-22";
const wib = (s: string) => Date.parse(`${s}+07:00`);

describe("bentuk jadwal", () => {
  it("is eight uneven releases that still cover the whole bank", () => {
    expect(JUMLAH_SESI).toBe(8);
    expect(SEBARAN_SESI).toEqual([4, 4, 4, 3, 4, 4, 4, 3]);
    // Thirty does not divide by eight, so the sum is the thing worth guarding.
    expect(SEBARAN_SESI.reduce((a: number, b: number) => a + b, 0)).toBe(30);
    const semua = Array.from({ length: JUMLAH_SESI }, (_, i) => i + 1).flatMap((s) => soalSesi(s));
    expect(semua).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it("pairs the releases into eights and sevens by calendar week", () => {
    expect(SEBARAN_SESI[0] + SEBARAN_SESI[1]).toBe(8);
    expect(SEBARAN_SESI[2] + SEBARAN_SESI[3]).toBe(7);
    expect(SEBARAN_SESI[4] + SEBARAN_SESI[5]).toBe(8);
    expect(SEBARAN_SESI[6] + SEBARAN_SESI[7]).toBe(7);
  });

  it("puts each question in the release that holds it", () => {
    expect(soalSesi(1)).toEqual([1, 2, 3, 4]);
    expect(soalSesi(2)).toEqual([5, 6, 7, 8]);
    expect(soalSesi(4)).toEqual([13, 14, 15]);
    expect(soalSesi(8)).toEqual([28, 29, 30]);
    expect(soalSesi(9)).toEqual([]);
    expect(sesiDari(1)).toBe(1);
    expect(sesiDari(4)).toBe(1);
    expect(sesiDari(5)).toBe(2);
    expect(sesiDari(15)).toBe(4);
    expect(sesiDari(16)).toBe(5);
    expect(sesiDari(30)).toBe(8);
  });

  it("starts the day after the lecture", () => {
    expect(mulaiSetelah("2026-09-21")).toBe("2026-09-22");
    expect(mulaiSetelah("2026-09-30")).toBe("2026-10-01");
    expect(mulaiSetelah("2026-12-31")).toBe("2027-01-01");
  });
});

describe("pembukaan dan penutupan sesi", () => {
  it("opens the first release the morning after the lecture, the rest on Mondays and Thursdays", () => {
    expect(bukaSesi(MULAI, 1)).toBe(wib("2026-09-22T05:00:00"));
    expect(bukaSesi(MULAI, 2)).toBe(wib("2026-09-24T05:00:00"));
    expect(bukaSesi(MULAI, 3)).toBe(wib("2026-09-28T05:00:00"));
    expect(bukaSesi(MULAI, 8)).toBe(wib("2026-10-15T05:00:00"));
  });

  it("closes every release at the midnight before the next one", () => {
    // Exclusive: 00:00 on release day is already too late for the one before it.
    expect(tutupSesi(MULAI, 1)).toBe(wib("2026-09-24T00:00:00"));
    expect(tutupSesi(MULAI, 2)).toBe(wib("2026-09-28T00:00:00"));
    // The last one has no release after it, so it runs to the Monday that would be.
    expect(tutupSesi(MULAI, 8)).toBe(wib("2026-10-19T00:00:00"));
  });

  it("reports the calendar dates a release covers", () => {
    // A Monday batch is due by Wednesday night, a Thursday batch by Sunday night.
    expect(tanggalSesi(MULAI, 2)).toEqual({ dari: "2026-09-24", sampai: "2026-09-27" });
    expect(tanggalSesi(MULAI, 3)).toEqual({ dari: "2026-09-28", sampai: "2026-09-30" });
    expect(tanggalSesi(MULAI, 8)).toEqual({ dari: "2026-10-15", sampai: "2026-10-18" });
  });

  it("handles a quiz that begins on a Sunday, where the first release is one day long", () => {
    // Lecture on a Saturday: the quiz starts Sunday and Monday's release follows it.
    const ahad = "2026-09-27";
    expect(tanggalSesi(ahad, 1)).toEqual({ dari: "2026-09-27", sampai: "2026-09-27" });
    expect(tanggalSesi(ahad, 2)).toEqual({ dari: "2026-09-28", sampai: "2026-09-30" });
  });
});

describe("apa yang sudah terbuka", () => {
  it("counts nothing open before 05.00 on the first morning", () => {
    expect(sesiTerbuka(MULAI, wib("2026-09-22T04:59:59"))).toBe(0);
    expect(soalTerbuka(MULAI, wib("2026-09-22T04:59:59"))).toBe(0);
    expect(sesiTerbuka(MULAI, wib("2026-09-22T05:00:00"))).toBe(1);
    expect(soalTerbuka(MULAI, wib("2026-09-22T05:00:00"))).toBe(4);
  });

  it("does not open the next batch before its own morning", () => {
    expect(sesiTerbuka(MULAI, wib("2026-09-23T23:59:59"))).toBe(1);
    expect(sesiTerbuka(MULAI, wib("2026-09-24T04:59:59"))).toBe(1);
    expect(sesiTerbuka(MULAI, wib("2026-09-24T05:00:00"))).toBe(2);
    expect(soalTerbuka(MULAI, wib("2026-09-24T05:00:00"))).toBe(8);
  });

  it("stops at eight and stays there", () => {
    expect(sesiTerbuka(MULAI, wib("2026-10-15T05:00:00"))).toBe(8);
    expect(sesiTerbuka(MULAI, wib("2027-01-01T05:00:00"))).toBe(8);
    expect(soalTerbuka(MULAI, wib("2027-01-01T05:00:00"))).toBe(30);
  });

  it("keeps an opened question open for good", () => {
    expect(sudahTerbuka(MULAI, 5, wib("2026-09-23T23:00:00"))).toBe(false);
    expect(sudahTerbuka(MULAI, 5, wib("2026-09-24T05:00:00"))).toBe(true);
    expect(sudahTerbuka(MULAI, 5, wib("2026-11-30T05:00:00"))).toBe(true);
  });

  it("rejects a question number outside one to thirty", () => {
    expect(isSoalSah(0)).toBe(false);
    expect(isSoalSah(31)).toBe(false);
    expect(isSoalSah(1.5)).toBe(false);
    expect(sudahTerbuka(MULAI, 31, wib("2026-12-01T05:00:00"))).toBe(false);
  });
});

describe("tepat waktu", () => {
  it("is on time only before its own release closes", () => {
    expect(tepatWaktu(MULAI, 3, wib("2026-09-23T23:59:59"))).toBe(true);
    expect(tepatWaktu(MULAI, 3, wib("2026-09-24T00:00:01"))).toBe(false);
    // Answering before it opened is not "on time" either — it cannot happen.
    expect(tepatWaktu(MULAI, 5, wib("2026-09-23T12:00:00"))).toBe(false);
  });
});

describe("kuisSelesai", () => {
  it("is finished once the last Sunday has passed", () => {
    expect(kuisSelesai(MULAI, wib("2026-10-18T23:59:59"))).toBe(false);
    expect(kuisSelesai(MULAI, wib("2026-10-19T00:00:01"))).toBe(true);
  });
});
