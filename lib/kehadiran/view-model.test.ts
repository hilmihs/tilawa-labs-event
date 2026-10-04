import { describe, expect, it } from "vitest";
import { emberLimaMenit, formatJam, formatTanggalIso } from "@/lib/waktu";
import { ambangTiketDibuka, lajuKedatangan } from "./view-model";

// Test 6 of the six: a dashboard reading zero while the queue is around the block.
describe("emberLimaMenit", () => {
  it("buckets in WIB, not UTC", () => {
    // 23:47 UTC on 19 Sep is 06:47 WIB on 20 Sep.
    const d = new Date("2026-09-19T23:47:31Z");
    expect(emberLimaMenit(d)).toBe("2026-09-20T06:45");
  });

  it("does not drift when the process runs in UTC", () => {
    const d = new Date("2026-09-20T00:03:00Z"); // 07:03 WIB
    expect(emberLimaMenit(d)).toBe("2026-09-20T07:00");
  });

  it("floors to the five-minute mark", () => {
    expect(emberLimaMenit(new Date("2026-09-19T23:59:59Z"))).toBe("2026-09-20T06:55");
    expect(emberLimaMenit(new Date("2026-09-19T23:00:00Z"))).toBe("2026-09-20T06:00");
  });

  it("formats the clock in WIB too", () => {
    expect(formatJam(new Date("2026-09-19T23:47:31Z"))).toBe("06:47");
  });

  it("names the day in WIB", () => {
    expect(formatTanggalIso("2026-09-20", "en")).toBe("Sunday, 20 September 2026");
  });
});

describe("lajuKedatangan", () => {
  it("counts per bucket and fills the gaps", () => {
    const t = (s: string) => new Date(s);
    const batang = lajuKedatangan([
      t("2026-09-19T23:00:10Z"), // 06:00
      t("2026-09-19T23:02:00Z"), // 06:00
      t("2026-09-19T23:12:00Z"), // 06:10
    ]);
    expect(batang.map((b) => b.label)).toEqual(["06:00", "06:05", "06:10"]);
    expect(batang.map((b) => b.jumlah)).toEqual([2, 0, 1]);
    expect(batang.find((b) => b.puncak)?.label).toBe("06:00");
  });

  it("returns nothing when nobody has arrived", () => {
    expect(lajuKedatangan([])).toEqual([]);
  });

  it("keeps four hours of buckets so the early morning stays on screen", () => {
    // 07:30 and 10:50 WIB on the same day: 41 buckets, all inside the window.
    const batang = lajuKedatangan([
      new Date("2026-09-20T00:30:00Z"),
      new Date("2026-09-20T03:50:00Z"),
    ]);
    expect(batang[0].label).toBe("07:30");
    expect(batang[batang.length - 1].label).toBe("10:50");
  });

  it("drops the oldest buckets once the span passes the window", () => {
    const batang = lajuKedatangan([
      new Date("2026-09-20T00:00:00Z"), // 07:00 WIB
      new Date("2026-09-20T05:00:00Z"), // 12:00 WIB, five hours later
    ]);
    expect(batang).toHaveLength(48);
    expect(batang[batang.length - 1].label).toBe("12:00");
    expect(batang[0].label).toBe("08:05");
  });

  it("crosses midnight without losing a bucket", () => {
    const batang = lajuKedatangan([
      new Date("2026-09-20T16:57:00Z"), // 23:57 WIB
      new Date("2026-09-20T17:02:00Z"), // 00:02 WIB next day
    ]);
    expect(batang.map((b) => b.label)).toEqual(["23:55", "00:00"]);
  });
});

describe("ambangTiketDibuka", () => {
  it("flags the three bands the committee acts on", () => {
    expect(ambangTiketDibuka(900, 1000).tingkat).toBe("aman");
    expect(ambangTiketDibuka(600, 1000).tingkat).toBe("waspada");
    expect(ambangTiketDibuka(400, 1000).tingkat).toBe("bahaya");
  });

  it("does not divide by zero before anyone registers", () => {
    expect(ambangTiketDibuka(0, 0).persen).toBe(0);
  });
});
