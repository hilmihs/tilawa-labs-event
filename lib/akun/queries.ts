import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { acara, acaraKehadiran, acaraPeserta, otp, pengguna, type Pengguna } from "@/db/schema";
import { PANJANG_MIN_PASSWORD, cocokPassword, hashPassword } from "@/lib/auth/password";
import {
  OTP_MAKS_PERCOBAAN,
  OTP_MENIT,
  buatKodeOtp,
  hashKodeOtp,
  nilaiOtp,
  type JenisOtp,
  type KeadaanOtp,
} from "@/lib/auth/otp";
import { normalizePhone } from "@/lib/wa";

export type Gender = "ikhwan" | "akhwat";

/** Lower-cased, trimmed, shaped like an address, or null. */
export function normalEmail(masukan: string | null | undefined): string | null {
  const v = String(masukan ?? "").trim().toLowerCase();
  return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

export async function ambilPenggunaById(id: string): Promise<Pengguna | null> {
  const [row] = await getDb().select().from(pengguna).where(eq(pengguna.id, id)).limit(1);
  return row ?? null;
}

export async function ambilPenggunaByWa(wa: string): Promise<Pengguna | null> {
  const [row] = await getDb().select().from(pengguna).where(eq(pengguna.wa, wa)).limit(1);
  return row ?? null;
}

async function ambilPenggunaByEmail(email: string): Promise<Pengguna | null> {
  const [row] = await getDb().select().from(pengguna).where(eq(pengguna.email, email)).limit(1);
  return row ?? null;
}

export type AlasanDaftarAkun =
  | "nama_pendek"
  | "wa_tidak_valid"
  | "email_tidak_valid"
  | "password_pendek"
  | "wa_terpakai"
  | "email_terpakai";

export type HasilDaftarAkun = { ok: true; pengguna: Pengguna } | { ok: false; alasan: AlasanDaftarAkun };

export async function daftarAkun(input: {
  nama: string;
  gender: Gender;
  wa: string;
  email: string;
  password: string;
  /*
   * The rest of the profile, when the account is created by the programme
   * registration form — it asks everything in one go, so there is no reason to make
   * the person fill the same fields again under /akun/profil afterwards.
   */
  profil?: Partial<ProfilInput>;
}): Promise<HasilDaftarAkun> {
  const nama = input.nama.trim().replace(/\s+/g, " ");
  if (nama.length < 3) return { ok: false, alasan: "nama_pendek" };
  const wa = normalizePhone(input.wa);
  if (!wa) return { ok: false, alasan: "wa_tidak_valid" };
  const email = normalEmail(input.email);
  if (!email) return { ok: false, alasan: "email_tidak_valid" };
  if (input.password.length < PANJANG_MIN_PASSWORD) return { ok: false, alasan: "password_pendek" };

  const tabrakan = async (): Promise<HasilDaftarAkun | null> => {
    if (await ambilPenggunaByWa(wa)) return { ok: false, alasan: "wa_terpakai" };
    if (await ambilPenggunaByEmail(email)) return { ok: false, alasan: "email_terpakai" };
    return null;
  };
  const sudah = await tabrakan();
  if (sudah) return sudah;

  const passwordHash = await hashPassword(input.password);
  try {
    const [row] = await getDb()
      .insert(pengguna)
      .values({ ...(input.profil ?? {}), nama, gender: input.gender, wa, email, passwordHash })
      .returning();
    return { ok: true, pengguna: row };
  } catch (e) {
    // Lost a race with a concurrent sign-up of the same number or email: the unique
    // indexes refused the row. Re-read to say which, instead of a generic error.
    const kalah = await tabrakan();
    if (kalah) return kalah;
    throw e;
  }
}

// Compared against when the number has no account, so a miss costs the same time
// as a wrong password and response timing does not reveal which numbers exist.
let hashPalsu: Promise<string> | null = null;

export async function periksaMasuk(waMentah: string, password: string): Promise<Pengguna | null> {
  const wa = normalizePhone(waMentah);
  const p = wa ? await ambilPenggunaByWa(wa) : null;
  if (!p || !p.aktif) {
    hashPalsu ??= hashPassword("nawa-tidak-ada-akun");
    await cocokPassword(password, await hashPalsu);
    return null;
  }
  return (await cocokPassword(password, p.passwordHash)) ? p : null;
}

/** Replaces the password and bumps sesiVersi, which signs out every other session. */
export async function gantiPassword(penggunaId: string, passwordBaru: string): Promise<Pengguna> {
  const passwordHash = await hashPassword(passwordBaru);
  const [row] = await getDb()
    .update(pengguna)
    .set({ passwordHash, sesiVersi: sql`${pengguna.sesiVersi} + 1`, updatedAt: new Date() })
    .where(eq(pengguna.id, penggunaId))
    .returning();
  if (!row) throw new Error("Account not found");
  return row;
}

/** Creates a code and burns any earlier unused code of the same kind. Returns the raw code. */
export async function buatOtp(penggunaId: string, jenis: JenisOtp): Promise<string> {
  const kode = buatKodeOtp();
  await getDb().transaction(async (tx) => {
    await tx
      .update(otp)
      .set({ percobaan: OTP_MAKS_PERCOBAAN })
      .where(and(eq(otp.penggunaId, penggunaId), eq(otp.jenis, jenis), isNull(otp.dipakaiAt)));
    await tx.insert(otp).values({
      penggunaId,
      jenis,
      kodeHash: hashKodeOtp(kode),
      kadaluarsaAt: new Date(Date.now() + OTP_MENIT * 60_000),
    });
  });
  return kode;
}

/**
 * Checks a code against the newest unused one. A wrong code costs an attempt; a right
 * one is consumed in the same statement that checks it is still unused, so two
 * submissions racing with the same code cannot both succeed.
 */
export async function periksaOtp(penggunaId: string, jenis: JenisOtp, kode: string): Promise<KeadaanOtp> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(otp)
    .where(and(eq(otp.penggunaId, penggunaId), eq(otp.jenis, jenis), isNull(otp.dipakaiAt)))
    .orderBy(desc(otp.createdAt))
    .limit(1);
  if (!row) return "kadaluarsa";

  const keadaan = nilaiOtp(row, kode);
  if (keadaan === "salah") {
    await db.update(otp).set({ percobaan: sql`${otp.percobaan} + 1` }).where(eq(otp.id, row.id));
    return "salah";
  }
  if (keadaan !== "cocok") return keadaan;

  const [dipakai] = await db
    .update(otp)
    .set({ dipakaiAt: new Date() })
    .where(and(eq(otp.id, row.id), isNull(otp.dipakaiAt)))
    .returning({ id: otp.id });
  return dipakai ? "cocok" : "dipakai";
}

export type ProfilInput = Pick<
  Pengguna,
  | "nama"
  | "gender"
  | "statusLipia"
  | "prodi"
  | "sesi"
  | "semester"
  | "tahunLulus"
  | "domisili"
  | "asalDaerah"
  | "asalSekolah"
  | "minat"
  | "kebutuhanKhusus"
>;

export async function ubahProfil(penggunaId: string, data: ProfilInput): Promise<void> {
  await getDb()
    .update(pengguna)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pengguna.id, penggunaId));
}

export async function ubahEmail(
  penggunaId: string,
  emailBaru: string,
): Promise<{ ok: true } | { ok: false; alasan: "email_tidak_valid" | "email_terpakai" }> {
  const email = normalEmail(emailBaru);
  if (!email) return { ok: false, alasan: "email_tidak_valid" };
  const pemilik = await ambilPenggunaByEmail(email);
  if (pemilik && pemilik.id !== penggunaId) return { ok: false, alasan: "email_terpakai" };
  try {
    await getDb()
      .update(pengguna)
      .set({ email, emailTerverifikasiAt: null, updatedAt: new Date() })
      .where(eq(pengguna.id, penggunaId));
  } catch (e) {
    if (await ambilPenggunaByEmail(email)) return { ok: false, alasan: "email_terpakai" };
    throw e;
  }
  return { ok: true };
}

export async function tandaiEmailTerverifikasi(penggunaId: string): Promise<void> {
  await getDb()
    .update(pengguna)
    .set({ emailTerverifikasiAt: new Date(), updatedAt: new Date() })
    .where(eq(pengguna.id, penggunaId));
}

/**
 * Every programme this account registered for, newest first, with what the
 * participant needs to act on it: where they stand and whether they came.
 */
export async function pendaftaranAkun(penggunaId: string) {
  const db = getDb();
  return db
    .select({
      pesertaId: acaraPeserta.id,
      nomor: acaraPeserta.nomor,
      jenis: acaraPeserta.jenis,
      izinOtsAt: acaraPeserta.izinOtsAt,
      konfirmasi: acaraPeserta.konfirmasi,
      aktif: acaraPeserta.aktif,
      slug: acara.slug,
      nama: acara.nama,
      namaAr: acara.namaAr,
      tanggal: acara.tanggal,
      pakaiTiket: acara.pakaiTiket,
      status: acara.status,
      gender: acaraPeserta.gender,
      waGrupIkhwan: acara.waGrupIkhwan,
      waGrupAkhwat: acara.waGrupAkhwat,
      hadirAt: acaraKehadiran.scannedAt,
    })
    .from(acaraPeserta)
    .innerJoin(acara, eq(acara.id, acaraPeserta.acaraId))
    .leftJoin(acaraKehadiran, eq(acaraKehadiran.pesertaId, acaraPeserta.id))
    .where(and(eq(acaraPeserta.penggunaId, penggunaId), eq(acaraPeserta.aktif, true)))
    .orderBy(desc(acara.tanggal));
}
