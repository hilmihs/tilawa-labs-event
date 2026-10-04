import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { acaraAkses } from "@/db/schema";
import { hashIp } from "@/lib/keamanan";
import { empatDigit } from "@/lib/wa";

export type JenisAksesAkun = "daftar_akun" | "login" | "otp";

/** Same salt as IPs, different prefix: a phone number never sits in this table in the clear. */
function hashWa(wa: string): string {
  return hashIp(`wa:${wa}`);
}

export async function catatAksesAkun(b: {
  jenis: JenisAksesAkun;
  wa: string | null;
  ipHash: string;
  berhasil: boolean;
}): Promise<void> {
  await getDb()
    .insert(acaraAkses)
    .values({
      acaraId: null,
      jenis: b.jenis,
      wa4: empatDigit(b.wa),
      waHash: b.wa ? hashWa(b.wa) : null,
      ipHash: b.ipHash,
      berhasil: b.berhasil,
    });
}

export async function hitungAksesAkun(f: {
  jenis: JenisAksesAkun;
  sejak: Date;
  ipHash?: string;
  wa?: string | null;
  hanyaGagal?: boolean;
}): Promise<number> {
  const kondisi = [eq(acaraAkses.jenis, f.jenis), gte(acaraAkses.createdAt, f.sejak)];
  if (f.ipHash) kondisi.push(eq(acaraAkses.ipHash, f.ipHash));
  if (f.wa) kondisi.push(eq(acaraAkses.waHash, hashWa(f.wa)));
  if (f.hanyaGagal) kondisi.push(eq(acaraAkses.berhasil, false));
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(acaraAkses)
    .where(and(...kondisi));
  return row?.n ?? 0;
}

const menitLalu = (m: number) => new Date(Date.now() - m * 60_000);

/*
 * The limits from the spec. A rejected attempt is NOT logged by the callers: the
 * windows are rolling, so logging refusals would push the release time forward on
 * every retry and lock a person out for good.
 */
/*
 * Per-address limits are in the thousands: hundreds of students share one campus or
 * carrier address, and the small per-address numbers locked real people out on the
 * busiest day. What stops abuse of one person is the per-number limit, which stays.
 */
export async function bolehDaftarAkun(ipHash: string): Promise<boolean> {
  return (await hitungAksesAkun({ jenis: "daftar_akun", sejak: menitLalu(60), ipHash })) < 5000;
}

export async function bolehMasuk(ipHash: string, wa: string | null): Promise<boolean> {
  const sejak = menitLalu(15);
  if ((await hitungAksesAkun({ jenis: "login", sejak, ipHash, hanyaGagal: true })) >= 2000) return false;
  if (wa && (await hitungAksesAkun({ jenis: "login", sejak, wa, hanyaGagal: true })) >= 10) return false;
  return true;
}

export async function bolehMintaOtp(ipHash: string, wa: string | null): Promise<boolean> {
  const sejak = menitLalu(60);
  if ((await hitungAksesAkun({ jenis: "otp", sejak, ipHash })) >= 1000) return false;
  if (wa && (await hitungAksesAkun({ jenis: "otp", sejak, wa })) >= 5) return false;
  return true;
}

/** Absolute links for email. NEXT_PUBLIC_BASE_URL is already set for every deployment. */
export function tautanAbsolut(path: string): string {
  const dasar = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
  return `${dasar}${path}`;
}
