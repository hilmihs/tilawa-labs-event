import { describe, expect, it } from "vitest";
import { nomorTampil, tandaTile } from "./nomor";

describe("nomorTampil", () => {
  it("uses the number printed on their ticket when there is one", () => {
    expect(nomorTampil("b0b0b0b0-0000-0000-0000-000000000000", "0412")).toBe("#0412");
    expect(nomorTampil("b0b0b0b0-0000-0000-0000-000000000000", " 0412 ")).toBe("#0412");
  });

  it("derives a stable four-digit code when there is none", () => {
    const a = nomorTampil("b0b0b0b0-0000-0000-0000-000000000000");
    const b = nomorTampil("b0b0b0b0-0000-0000-0000-000000000000", "   ");
    expect(a).toMatch(/^#\d{4}$/);
    expect(b).toBe(a);
    expect(nomorTampil("c1c1c1c1-0000-0000-0000-000000000000")).not.toBe(a);
  });
});

describe("tandaTile", () => {
  it("shows the last two digits, never a letter from a name", () => {
    expect(tandaTile("#0412")).toBe("12");
    expect(tandaTile("#7")).toBe("7");
    expect(tandaTile("#")).toBe("··");
  });
});
