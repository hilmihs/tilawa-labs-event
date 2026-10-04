import { describe, expect, it } from "vitest";
import { JEDA_PENGINGAT_MS, bisaDiingatkan } from "./pengingat";

describe("bisaDiingatkan", () => {
  const sekarang = Date.parse("2026-09-26T12:00:00Z");
  const lalu = (ms: number) => new Date(sekarang - ms);
  const dasar = { emailAt: lalu(JEDA_PENGINGAT_MS), emailIngatAt: null, diisiAt: null };

  it("waits twelve hours after the invitation", () => {
    expect(bisaDiingatkan(dasar, sekarang)).toBe(true);
    expect(bisaDiingatkan({ ...dasar, emailAt: lalu(JEDA_PENGINGAT_MS - 60_000) }, sekarang)).toBe(false);
  });
  it("never reminds the uninvited, the reminded or those who answered", () => {
    expect(bisaDiingatkan({ ...dasar, emailAt: null }, sekarang)).toBe(false);
    expect(bisaDiingatkan({ ...dasar, emailIngatAt: lalu(1000) }, sekarang)).toBe(false);
    expect(bisaDiingatkan({ ...dasar, diisiAt: lalu(1000) }, sekarang)).toBe(false);
  });
});
