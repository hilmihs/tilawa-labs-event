import { and, asc, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { minatClub, pengguna } from "@/db/schema";
import { MINAT_KEYS, isMinat, type MinatKey } from "./konten";

/** What this account currently wants news of (withdrawn ones excluded). */
export async function minatSaya(penggunaId: string): Promise<Set<MinatKey>> {
  const rows = await getDb()
    .select({ club: minatClub.club })
    .from(minatClub)
    .where(and(eq(minatClub.penggunaId, penggunaId), isNull(minatClub.batalAt)));
  return new Set(rows.map((r) => r.club).filter(isMinat));
}

/** This account's stored answers for one club, or null if it never answered (withdrawn or not). */
export async function jawabanSaya(penggunaId: string, club: MinatKey): Promise<Record<string, string> | null> {
  const [row] = await getDb()
    .select({ jawaban: minatClub.jawaban, batalAt: minatClub.batalAt })
    .from(minatClub)
    .where(and(eq(minatClub.penggunaId, penggunaId), eq(minatClub.club, club)))
    .limit(1);
  return row && !row.batalAt ? (row.jawaban ?? null) : null;
}

/** Active interest per club (and Tilawa Labs Fest), counting only accounts that are still active. */
export async function jumlahMinatPerClub(): Promise<Record<MinatKey, number>> {
  const rows = await getDb()
    .select({ club: minatClub.club, n: count() })
    .from(minatClub)
    .innerJoin(pengguna, eq(pengguna.id, minatClub.penggunaId))
    .where(and(isNull(minatClub.batalAt), eq(pengguna.aktif, true)))
    .groupBy(minatClub.club);
  const hasil = Object.fromEntries(MINAT_KEYS.map((k) => [k, 0])) as Record<MinatKey, number>;
  for (const r of rows) if (isMinat(r.club)) hasil[r.club] = Number(r.n);
  return hasil;
}

/**
 * Idempotent both ways: a second tap never makes a second row, and coming back after
 * withdrawing clears `batalAt` on the same row, keeping the first `createdAt` — the
 * committee cares when someone first raised a hand.
 */
export async function catatMinat(penggunaId: string, kunci: MinatKey[]): Promise<void> {
  if (!kunci.length) return;
  await getDb()
    .insert(minatClub)
    .values(kunci.map((club) => ({ penggunaId, club })))
    .onConflictDoUpdate({
      target: [minatClub.penggunaId, minatClub.club],
      set: { batalAt: null, updatedAt: sql`now()` },
    });
}

/**
 * One club with its questionnaire answered. Same idempotence as `catatMinat`; coming
 * back a second time overwrites the answers, since the newer ones are the ones meant.
 */
export async function catatMinatDenganJawaban(
  penggunaId: string,
  club: MinatKey,
  jawaban: Record<string, string>,
): Promise<void> {
  await getDb()
    .insert(minatClub)
    .values({ penggunaId, club, jawaban })
    .onConflictDoUpdate({
      target: [minatClub.penggunaId, minatClub.club],
      set: { jawaban, batalAt: null, updatedAt: sql`now()` },
    });
}

export async function batalkanMinat(penggunaId: string, kunci: MinatKey[]): Promise<void> {
  if (!kunci.length) return;
  await getDb()
    .update(minatClub)
    .set({ batalAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(minatClub.penggunaId, penggunaId), inArray(minatClub.club, kunci), isNull(minatClub.batalAt)));
}

export type BarisMinat = {
  club: string;
  nama: string;
  gender: string;
  wa: string;
  email: string;
  statusLipia: string | null;
  prodi: string | null;
  semester: string | null;
  domisili: string | null;
  jawaban: Record<string, string> | null;
  createdAt: Date;
  batalAt: Date | null;
};

/** Everyone who ever asked to be kept posted, withdrawn included, for /panel/club and its CSV. */
export async function semuaMinat(): Promise<BarisMinat[]> {
  return getDb()
    .select({
      club: minatClub.club,
      nama: pengguna.nama,
      gender: pengguna.gender,
      wa: pengguna.wa,
      email: pengguna.email,
      statusLipia: pengguna.statusLipia,
      prodi: pengguna.prodi,
      semester: pengguna.semester,
      domisili: pengguna.domisili,
      jawaban: minatClub.jawaban,
      createdAt: minatClub.createdAt,
      batalAt: minatClub.batalAt,
    })
    .from(minatClub)
    .innerJoin(pengguna, eq(pengguna.id, minatClub.penggunaId))
    .where(eq(pengguna.aktif, true))
    .orderBy(asc(minatClub.club), asc(minatClub.createdAt));
}
