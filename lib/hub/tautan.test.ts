import { describe, expect, it } from "vitest";
import { kembaliKe } from "./tautan";

describe("kembaliKe", () => {
  it("keeps a page of this site in the same language", () => {
    expect(kembaliKe("en", "/en/hub/english").polos).toBe("/en/hub/english");
    expect(kembaliKe("ar", "/ar").polos).toBe("/ar");
  });

  it("puts ?minat= before the section anchor", () => {
    expect(kembaliKe("en", "/en/hub#fest").denganMinat("fest")).toBe("/en/hub?minat=fest#fest");
    expect(kembaliKe("en", "/en").denganMinat("semua")).toBe("/en?minat=semua");
  });

  it("falls back to the hub for anything else", () => {
    for (const buruk of ["https://evil.test", "//evil.test", "/ar/hub", "/en/\\evil", "/en/hub?x=1", "/en/a\nb", ""]) {
      expect(kembaliKe("en", buruk).polos).toBe("/en/hub");
    }
  });
});
