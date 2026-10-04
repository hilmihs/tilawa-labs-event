import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_MENIT = 10;
export const OTP_MAKS_PERCOBAAN = 5;
export type JenisOtp = "reset" | "verifikasi_email";
export type KeadaanOtp = "cocok" | "salah" | "kadaluarsa" | "hangus" | "dipakai";

/** Six digits from a CSPRNG; leading zeros kept. */
export function buatKodeOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Only this HMAC is stored. A leaked table does not hand out live codes. */
export function hashKodeOtp(kode: string): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", s).update(`otp:${kode}`).digest("hex");
}

/**
 * The whole decision about a submitted code, without touching the database.
 * Order matters: a used or burnt code says so even when the digits are right.
 */
export function nilaiOtp(
  row: { kodeHash: string; kadaluarsaAt: Date; dipakaiAt: Date | null; percobaan: number },
  kode: string,
  sekarang = new Date(),
): KeadaanOtp {
  if (row.dipakaiAt) return "dipakai";
  if (row.percobaan >= OTP_MAKS_PERCOBAAN) return "hangus";
  if (row.kadaluarsaAt.getTime() <= sekarang.getTime()) return "kadaluarsa";
  const a = Buffer.from(hashKodeOtp(kode.trim()));
  const b = Buffer.from(row.kodeHash);
  return a.length === b.length && timingSafeEqual(a, b) ? "cocok" : "salah";
}
