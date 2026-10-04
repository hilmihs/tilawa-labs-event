import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { loadEnvFile } from "@/db/env";
import { getDb } from "@/db";
import { acaraAkses, pengguna } from "@/db/schema";
import { OTP_MAKS_PERCOBAAN } from "@/lib/auth/otp";
import {
  ambilPenggunaByWa,
  buatOtp,
  daftarAkun,
  gantiPassword,
  periksaMasuk,
  periksaOtp,
  ubahEmail,
} from "./queries";
import { catatAksesAkun, hitungAksesAkun } from "./batas";

loadEnvFile();

const acak = Math.floor(Math.random() * 1e7).toString().padStart(7, "0");
const WA1 = `0819${acak}1`;
const WA2 = `0819${acak}2`;
const EMAIL1 = `Uji.${acak}@Contoh.id`;

beforeAll(() => {
  process.env.AUTH_SECRET ??= "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaa";
  process.env.IP_SALT ??= "test-salt-aaaaaaaaaaaaaaaaaaaaaaaaaaaa";
});

afterAll(async () => {
  const db = getDb();
  await db.delete(pengguna).where(inArray(pengguna.wa, [`62819${acak}1`, `62819${acak}2`]));
  await db.delete(acaraAkses).where(eq(acaraAkses.ipHash, `ip-uji-${acak}`));
});

describe("daftarAkun", () => {
  it("creates an account with a lower-cased email", async () => {
    const h = await daftarAkun({ nama: "Uji Satu", gender: "ikhwan", wa: WA1, email: EMAIL1, password: "rahasia123" });
    expect(h.ok).toBe(true);
    if (h.ok) expect(h.pengguna.email).toBe(EMAIL1.toLowerCase());
  });
  it("refuses the same number", async () => {
    const h = await daftarAkun({ nama: "Uji Lain", gender: "ikhwan", wa: `+62 819 ${acak} 1`, email: `lain.${acak}@contoh.id`, password: "rahasia123" });
    expect(h).toEqual({ ok: false, alasan: "wa_terpakai" });
  });
  it("refuses the same email in another case", async () => {
    const h = await daftarAkun({ nama: "Uji Dua", gender: "akhwat", wa: WA2, email: EMAIL1.toUpperCase(), password: "rahasia123" });
    expect(h).toEqual({ ok: false, alasan: "email_terpakai" });
  });
  it("validates input", async () => {
    expect(await daftarAkun({ nama: "Uji", gender: "ikhwan", wa: "123", email: "x@y.id", password: "rahasia123" })).toEqual({ ok: false, alasan: "wa_tidak_valid" });
    expect(await daftarAkun({ nama: "Uji Dua", gender: "ikhwan", wa: WA2, email: "bukan-email", password: "rahasia123" })).toEqual({ ok: false, alasan: "email_tidak_valid" });
    expect(await daftarAkun({ nama: "Uji Dua", gender: "ikhwan", wa: WA2, email: `d.${acak}@contoh.id`, password: "pendek" })).toEqual({ ok: false, alasan: "password_pendek" });
  });
});

describe("periksaMasuk and gantiPassword", () => {
  it("signs in with the right password only", async () => {
    expect(await periksaMasuk(WA1, "rahasia123")).not.toBeNull();
    expect(await periksaMasuk(WA1, "salah-sekali")).toBeNull();
    expect(await periksaMasuk("0819000000000", "rahasia123")).toBeNull();
  });
  it("bumps sesiVersi and replaces the password", async () => {
    const lama = (await ambilPenggunaByWa(`62819${acak}1`))!;
    const baru = await gantiPassword(lama.id, "baru-sekali-1");
    expect(baru.sesiVersi).toBe(lama.sesiVersi + 1);
    expect(await periksaMasuk(WA1, "rahasia123")).toBeNull();
    expect(await periksaMasuk(WA1, "baru-sekali-1")).not.toBeNull();
  });
  it("refuses a deactivated account", async () => {
    const p = (await ambilPenggunaByWa(`62819${acak}1`))!;
    await getDb().update(pengguna).set({ aktif: false }).where(eq(pengguna.id, p.id));
    expect(await periksaMasuk(WA1, "baru-sekali-1")).toBeNull();
    await getDb().update(pengguna).set({ aktif: true }).where(eq(pengguna.id, p.id));
  });
});

describe("OTP", () => {
  it("accepts the right code once", async () => {
    const p = (await ambilPenggunaByWa(`62819${acak}1`))!;
    const kode = await buatOtp(p.id, "reset");
    expect(await periksaOtp(p.id, "reset", kode)).toBe("cocok");
    expect(await periksaOtp(p.id, "reset", kode)).toBe("kadaluarsa");
  });
  it("burns the code after the attempt limit", async () => {
    const p = (await ambilPenggunaByWa(`62819${acak}1`))!;
    const kode = await buatOtp(p.id, "reset");
    const salah = kode === "000000" ? "111111" : "000000";
    for (let i = 0; i < OTP_MAKS_PERCOBAAN; i++) expect(await periksaOtp(p.id, "reset", salah)).toBe("salah");
    expect(await periksaOtp(p.id, "reset", kode)).toBe("hangus");
  });
  it("a new code burns the previous one", async () => {
    const p = (await ambilPenggunaByWa(`62819${acak}1`))!;
    const pertama = await buatOtp(p.id, "verifikasi_email");
    const kedua = await buatOtp(p.id, "verifikasi_email");
    if (pertama !== kedua) expect(await periksaOtp(p.id, "verifikasi_email", pertama)).toBe("salah");
    expect(await periksaOtp(p.id, "verifikasi_email", kedua)).toBe("cocok");
  });
});

describe("ubahEmail", () => {
  it("changes the email and clears verification", async () => {
    const p = (await ambilPenggunaByWa(`62819${acak}1`))!;
    await getDb().update(pengguna).set({ emailTerverifikasiAt: new Date() }).where(eq(pengguna.id, p.id));
    expect(await ubahEmail(p.id, `Baru.${acak}@Contoh.id`)).toEqual({ ok: true });
    const q = (await ambilPenggunaByWa(`62819${acak}1`))!;
    expect(q.email).toBe(`baru.${acak}@contoh.id`);
    expect(q.emailTerverifikasiAt).toBeNull();
  });
});

describe("batas laju", () => {
  it("counts by ip and by number, failures only when asked", async () => {
    const ipHash = `ip-uji-${acak}`;
    const wa = `62819${acak}1`;
    const sejak = new Date(Date.now() - 60_000);
    await catatAksesAkun({ jenis: "login", wa, ipHash, berhasil: false });
    await catatAksesAkun({ jenis: "login", wa, ipHash, berhasil: true });
    expect(await hitungAksesAkun({ jenis: "login", sejak, ipHash })).toBe(2);
    expect(await hitungAksesAkun({ jenis: "login", sejak, ipHash, hanyaGagal: true })).toBe(1);
    expect(await hitungAksesAkun({ jenis: "login", sejak, wa, hanyaGagal: true })).toBeGreaterThanOrEqual(1);
  });
});
