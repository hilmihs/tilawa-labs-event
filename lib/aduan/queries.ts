import { and, count, desc, eq, gte, ilike, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { acara, aduan, type Aduan } from "@/db/schema";

export const STATUS_ADUAN = ["baru", "diproses", "selesai"] as const;
export type StatusAduan = (typeof STATUS_ADUAN)[number];

export type InputAduan = {
  acaraId?: string | null;
  slug?: string | null;
  halaman: string;
  pesan: string;
  nama?: string | null;
  kontak?: string | null;
  nomorPeserta?: string | null;
  penggunaId?: string | null;
  lang?: string | null;
  ipHash?: string | null;
};

const PREFIKS = "ADU-";
const PERCOBAAN_NOMOR = 5;

function formatNomor(n: number): string {
  return `${PREFIKS}${String(n).padStart(4, "0")}`;
}

// Drizzle wraps driver errors, so the Postgres code may sit on the error or its cause.
function pelanggaranUnik(e: unknown): boolean {
  const kode = (x: unknown) => (x && typeof x === "object" && "code" in x ? (x as { code: unknown }).code : undefined);
  return kode(e) === "23505" || kode((e as { cause?: unknown } | null)?.cause) === "23505";
}

/**
 * Saves a report and gives it the next ticket number.
 *
 * The next number is the highest existing suffix + 1 rather than a plain row count:
 * once any report is deleted a count lands on a number already taken, and every retry
 * would collide again. Two reports sent in the same instant can still pick the same
 * number; the unique constraint rejects one and it simply tries again.
 */
export async function simpanAduan(input: InputAduan): Promise<{ id: string; nomor: string }> {
  const db = getDb();
  let terakhirGagal: unknown;
  for (let i = 0; i < PERCOBAAN_NOMOR; i++) {
    const [{ maks }] = await db
      .select({
        maks: sql<number>`coalesce(max(nullif(regexp_replace(${aduan.nomor}, '\\D', '', 'g'), '')::int), 0)`,
      })
      .from(aduan);
    // On a retry, step past the number that just collided even if the row is not yet visible.
    const nomor = formatNomor(Number(maks) + 1 + i);
    try {
      const [row] = await db
        .insert(aduan)
        .values({
          nomor,
          acaraId: input.acaraId ?? null,
          slug: input.slug ?? null,
          halaman: input.halaman,
          pesan: input.pesan,
          nama: input.nama ?? null,
          kontak: input.kontak ?? null,
          nomorPeserta: input.nomorPeserta ?? null,
          penggunaId: input.penggunaId ?? null,
          lang: input.lang ?? null,
          ipHash: input.ipHash ?? null,
        })
        .returning({ id: aduan.id, nomor: aduan.nomor });
      return row;
    } catch (e) {
      if (!pelanggaranUnik(e)) throw e;
      terakhirGagal = e;
    }
  }
  throw terakhirGagal ?? new Error("could not assign a complaint number");
}

/** Reports from one hashed address since a moment, for the public rate limit. */
export async function hitungAduanDariIp(ipHash: string, sejak: Date): Promise<number> {
  const db = getDb();
  const [{ n }] = await db
    .select({ n: count() })
    .from(aduan)
    .where(and(eq(aduan.ipHash, ipHash), gte(aduan.createdAt, sejak)));
  return Number(n);
}

export type BarisAduan = Aduan & { acaraNama: string | null };

// A search box is text, not a pattern: `%` and `_` typed by staff must match literally.
function polaCari(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * The admin list, newest first.
 *
 * `hitung` honours the search but ignores the status filter, so the tab badges keep
 * showing how many reports sit in each status while one tab is open.
 */
export async function daftarAduan(f: {
  status?: StatusAduan;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ baris: BarisAduan[]; total: number; hitung: Record<StatusAduan, number> }> {
  const db = getDb();
  const limit = Math.min(Math.max(Math.trunc(f.limit ?? 50), 1), 500);
  const offset = Math.max(Math.trunc(f.offset ?? 0), 0);

  const q = f.q?.trim();
  const syaratCari: SQL | undefined = q
    ? or(
        ilike(aduan.nomor, polaCari(q)),
        ilike(aduan.pesan, polaCari(q)),
        ilike(aduan.nama, polaCari(q)),
        ilike(aduan.kontak, polaCari(q)),
        ilike(aduan.nomorPeserta, polaCari(q)),
      )
    : undefined;
  const syarat = and(syaratCari, f.status ? eq(aduan.status, f.status) : undefined);

  const [baris, [{ total }], perStatus] = await Promise.all([
    db
      .select({ aduan, acaraNama: acara.nama })
      .from(aduan)
      .leftJoin(acara, eq(aduan.acaraId, acara.id))
      .where(syarat)
      .orderBy(desc(aduan.createdAt), desc(aduan.nomor))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(aduan).where(syarat),
    db.select({ status: aduan.status, n: count() }).from(aduan).where(syaratCari).groupBy(aduan.status),
  ]);

  const hitung = { baru: 0, diproses: 0, selesai: 0 } as Record<StatusAduan, number>;
  for (const r of perStatus) {
    if ((STATUS_ADUAN as readonly string[]).includes(r.status)) hitung[r.status as StatusAduan] = Number(r.n);
  }

  return {
    baris: baris.map((r) => ({ ...r.aduan, acaraNama: r.acaraNama ?? null })),
    total: Number(total),
    hitung,
  };
}

/** Staff update of status and/or note. Returns false when the id does not exist. */
export async function ubahAduan(
  id: string,
  data: { status?: StatusAduan; catatanAdmin?: string | null },
): Promise<boolean> {
  const db = getDb();
  const set: Partial<typeof aduan.$inferInsert> = { updatedAt: new Date() };
  if (data.status !== undefined) {
    if (!(STATUS_ADUAN as readonly string[]).includes(data.status)) return false;
    set.status = data.status;
  }
  if (data.catatanAdmin !== undefined) set.catatanAdmin = data.catatanAdmin;
  const hasil = await db.update(aduan).set(set).where(eq(aduan.id, id)).returning({ id: aduan.id });
  return hasil.length > 0;
}
