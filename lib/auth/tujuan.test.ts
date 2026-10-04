import { describe, expect, it } from "vitest";
import { keGate, tujuanAman } from "./tujuan";

describe("tujuanAman", () => {
  it("keeps a same-site path", () => expect(tujuanAman("/ar/p/kajian/register", "ar")).toBe("/ar/p/kajian/register"));
  it("defaults to the account page", () => expect(tujuanAman(null, "en")).toBe("/en/akun"));
  it("refuses protocol-relative and backslash tricks", () => {
    expect(tujuanAman("//evil.example", "ar")).toBe("/ar/akun");
    expect(tujuanAman("/\\evil.example", "ar")).toBe("/ar/akun");
    expect(tujuanAman("https://evil.example", "ar")).toBe("/ar/akun");
  });
  it("refuses control characters", () => expect(tujuanAman("/ar/akun\n", "ar")).toBe("/ar/akun"));
});

/** A staff link that names a programme must come back to that programme after sign-in. */
describe("keGate", () => {
  it("carries the programme through the sign-in redirect", () => {
    expect(keGate("/scan", "latihan-scan")).toBe("/gate?next=%2Fscan%3Facara%3Dlatihan-scan");
  });
  it("is a plain path when no programme was named", () => {
    expect(keGate("/assist")).toBe("/gate?next=%2Fassist");
    expect(keGate("/assist", null)).toBe("/gate?next=%2Fassist");
  });
});
