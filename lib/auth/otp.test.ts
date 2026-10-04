import { beforeAll, describe, expect, it } from "vitest";
import { OTP_MAKS_PERCOBAAN, buatKodeOtp, hashKodeOtp, nilaiOtp } from "./otp";

beforeAll(() => {
  process.env.AUTH_SECRET ??= "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaa";
});

const baris = (over: Partial<Parameters<typeof nilaiOtp>[0]> = {}) => ({
  kodeHash: hashKodeOtp("123456"),
  kadaluarsaAt: new Date("2026-09-14T10:10:00Z"),
  dipakaiAt: null,
  percobaan: 0,
  ...over,
});
const sekarang = new Date("2026-09-14T10:05:00Z");

describe("buatKodeOtp", () => {
  it("is always six digits", () => {
    for (let i = 0; i < 200; i++) expect(buatKodeOtp()).toMatch(/^\d{6}$/);
  });
});

describe("nilaiOtp", () => {
  it("accepts the right code", () => expect(nilaiOtp(baris(), "123456", sekarang)).toBe("cocok"));
  it("ignores surrounding spaces", () => expect(nilaiOtp(baris(), " 123456 ", sekarang)).toBe("cocok"));
  it("rejects a wrong code", () => expect(nilaiOtp(baris(), "654321", sekarang)).toBe("salah"));
  it("expires at kadaluarsaAt", () =>
    expect(nilaiOtp(baris(), "123456", new Date("2026-09-14T10:10:00Z"))).toBe("kadaluarsa"));
  it("is burnt once the attempt limit is reached, even with the right code", () =>
    expect(nilaiOtp(baris({ percobaan: OTP_MAKS_PERCOBAAN }), "123456", sekarang)).toBe("hangus"));
  it("cannot be used twice", () =>
    expect(nilaiOtp(baris({ dipakaiAt: sekarang }), "123456", sekarang)).toBe("dipakai"));
  it("hashes differently from the raw code and depends on the secret", () => {
    const a = hashKodeOtp("123456");
    expect(a).not.toContain("123456");
    const lama = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "rahasia-lain-bbbbbbbbbbbbbbbbbbbbbbbbbb";
    expect(hashKodeOtp("123456")).not.toBe(a);
    process.env.AUTH_SECRET = lama;
  });
});
