import { describe, expect, it } from "vitest";
import { cocokPassword, hashPassword } from "./password";

describe("password", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const h = await hashPassword("rahasia-panjang");
    expect(await cocokPassword("rahasia-panjang", h)).toBe(true);
    expect(await cocokPassword("rahasia-panjanG", h)).toBe(false);
  });
  it("uses the scrypt$N$r$p$salt$hash format", async () => {
    const h = await hashPassword("abcdefgh");
    const bagian = h.split("$");
    expect(bagian).toHaveLength(6);
    expect(bagian.slice(0, 4)).toEqual(["scrypt", "32768", "8", "1"]);
  });
  it("salts every hash differently", async () => {
    expect(await hashPassword("sama-saja")).not.toBe(await hashPassword("sama-saja"));
  });
  it("rejects a malformed stored value instead of throwing", async () => {
    expect(await cocokPassword("apa", "bukan-hash")).toBe(false);
  });
  it("treats compatibility forms of the same characters as equal", async () => {
    const h = await hashPassword("ﬁle-password");
    expect(await cocokPassword("file-password", h)).toBe(true);
  });
});
