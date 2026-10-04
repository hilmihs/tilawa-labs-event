import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { acara, acaraKehadiran, acaraPeserta } from "@/db/schema";
import { batasKursi, syaratKursiTerpakai, type Gender } from "./daftar";

/*
 * The walk-in queue.
 *
 * On the day the committee shares /[lang]/p/[slug]/ots at the venue. Whoever fills it
 * in gets a ticket with a queue number (urut_ots, per side of the hall) and no QR.
 * From /panel/ots the committee sees both queues in order and permits people —
 * one, a few ticked, or everyone still waiting — while watching the seats still
 * free. The permit stamps izin_ots_at; from then the ticket shows its QR and the
 * gate reads it green.
 */

export type BarisOts = {
  id: string;
  urut: number | null;
  nomor: string;
  nama: string;
  gender: string;
  wa: string;
  statusLipia: string | null;
  createdAt: Date;
  izinAt: Date | null;
  hadirAt: Date | null;
};

export type SisiOts = {
  gender: Gender;
  kuota: number | null;
  /** Online seats still held plus walk-ins permitted. */
  terpakai: number;
  sisa: number | null;
  menunggu: number;
  diizinkan: number;
  hadir: number;
};

/** Both queues of one programme, in queue order, with each side's free seats. */
export async function antreanOts(acaraId: string): Promise<{ baris: BarisOts[]; sisi: SisiOts[] }> {
  const db = getDb();
  const [ev] = await db.select().from(acara).where(eq(acara.id, acaraId)).limit(1);
  const baris = await db
    .select({
      id: acaraPeserta.id,
      urut: acaraPeserta.urutOts,
      nomor: acaraPeserta.nomor,
      nama: acaraPeserta.nama,
      gender: acaraPeserta.gender,
      wa: acaraPeserta.wa,
      statusLipia: acaraPeserta.statusLipia,
      createdAt: acaraPeserta.createdAt,
      izinAt: acaraPeserta.izinOtsAt,
      hadirAt: sql<Date | null>`coalesce(${acaraKehadiran.clientScannedAt}, ${acaraKehadiran.scannedAt})`,
    })
    .from(acaraPeserta)
    .leftJoin(acaraKehadiran, eq(acaraKehadiran.pesertaId, acaraPeserta.id))
    .where(
      and(
        eq(acaraPeserta.acaraId, acaraId),
        eq(acaraPeserta.aktif, true),
        eq(acaraPeserta.jenis, "ots"),
        sql`${acaraPeserta.konfirmasi} is distinct from false`,
      ),
    )
    .orderBy(asc(acaraPeserta.gender), asc(acaraPeserta.urutOts), asc(acaraPeserta.createdAt));

  const sisi: SisiOts[] = [];
  for (const g of ["ikhwan", "akhwat"] as const) {
    const b = ev ? batasKursi(ev, g) : null;
    // A shared total counts the whole hall on both cards; the number is the same.
    const [t] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(acaraPeserta)
      .where(syaratKursiTerpakai(acaraId, b?.perGender === false ? null : g));
    const milik = baris.filter((r) => r.gender === g);
    sisi.push({
      gender: g,
      kuota: b?.batas ?? null,
      terpakai: t?.n ?? 0,
      sisa: b ? Math.max(0, b.batas - (t?.n ?? 0)) : null,
      menunggu: milik.filter((r) => !r.izinAt).length,
      diizinkan: milik.filter((r) => r.izinAt).length,
      hadir: milik.filter((r) => r.hadirAt).length,
    });
  }
  return { baris: baris.map((r) => ({ ...r, hadirAt: r.hadirAt ? new Date(r.hadirAt) : null })), sisi };
}

/** Walk-ins still waiting, for the dashboard. `gender` narrows it to one side. */
export async function jumlahOtsMenunggu(acaraId: string, gender?: Gender): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(acaraPeserta)
    .where(
      and(
        eq(acaraPeserta.acaraId, acaraId),
        eq(acaraPeserta.aktif, true),
        eq(acaraPeserta.jenis, "ots"),
        isNull(acaraPeserta.izinOtsAt),
        sql`${acaraPeserta.konfirmasi} is distinct from false`,
        gender ? eq(acaraPeserta.gender, gender) : undefined,
      ),
    );
  return row?.n ?? 0;
}

/**
 * Permits the given walk-ins. Only rows of this programme still in the queue are
 * touched, so an id from another tab or another programme changes nothing.
 * Returns how many were permitted.
 */
export async function izinkanOts(acaraId: string, ids: string[]): Promise<number> {
  if (!ids.length) return 0;
  const db = getDb();
  const rows = await db
    .update(acaraPeserta)
    .set({ izinOtsAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(acaraPeserta.acaraId, acaraId),
        eq(acaraPeserta.jenis, "ots"),
        eq(acaraPeserta.aktif, true),
        isNull(acaraPeserta.izinOtsAt),
        inArray(acaraPeserta.id, ids),
      ),
    )
    .returning({ id: acaraPeserta.id });
  return rows.length;
}

/** Permits everyone still waiting — on one side, or on both. */
export async function izinkanSemuaOts(acaraId: string, gender?: Gender): Promise<number> {
  const db = getDb();
  const rows = await db
    .update(acaraPeserta)
    .set({ izinOtsAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(acaraPeserta.acaraId, acaraId),
        eq(acaraPeserta.jenis, "ots"),
        eq(acaraPeserta.aktif, true),
        isNull(acaraPeserta.izinOtsAt),
        sql`${acaraPeserta.konfirmasi} is distinct from false`,
        gender ? eq(acaraPeserta.gender, gender) : undefined,
      ),
    )
    .returning({ id: acaraPeserta.id });
  return rows.length;
}

/**
 * Takes a permit back — a slip of the finger, or a seat that turned out not to be
 * there. Not for someone already through the gate: the scan stands, and the help
 * desk's "undo scan" is the correction for that.
 */
export async function cabutIzinOts(acaraId: string, pesertaId: string): Promise<boolean> {
  const db = getDb();
  const [hadir] = await db
    .select({ id: acaraKehadiran.pesertaId })
    .from(acaraKehadiran)
    .where(eq(acaraKehadiran.pesertaId, pesertaId))
    .limit(1);
  if (hadir) return false;
  const rows = await db
    .update(acaraPeserta)
    .set({ izinOtsAt: null, updatedAt: new Date() })
    .where(and(eq(acaraPeserta.acaraId, acaraId), eq(acaraPeserta.id, pesertaId), eq(acaraPeserta.jenis, "ots")))
    .returning({ id: acaraPeserta.id });
  return rows.length > 0;
}
