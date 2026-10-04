import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { acaraKehadiran, acaraPeserta } from "@/db/schema";
import { normalizeKode } from "@/lib/tiket/kode";

export type HasilPindai =
  | {
      /*
       * A walk-in the committee has not permitted yet.
       *
       * Their ticket shows no QR until the permit, but the code exists and can be
       * typed or relayed, so the gate has to refuse it too or the queue is
       * decoration. Attendance is deliberately NOT recorded — the committee permits
       * from /panel/ots, or the help desk lets them in and that counts as the permit.
       */
      keadaan: "antre";
      nomor: string;
      nama: string;
      gender: string;
      keterangan: string | null;
      pesertaId: string;
      /** Their place in the walk-in queue of their side. */
      posisi: number | null;
    }
  | {
      keadaan: "hijau";
      nomor: string;
      nama: string;
      gender: string;
      keterangan: string | null;
      pesertaId: string;
    }
  | {
      keadaan: "kuning";
      nomor: string;
      nama: string;
      gender: string;
      keterangan: string | null;
      pesertaId: string;
      pertamaAt: string;
      pertamaGate: string | null;
    }
  | { keadaan: "merah"; kode: string };

export type InputPindai = {
  kode: string;
  gate?: string | null;
  petugas?: string | null;
  metode?: "qr" | "manual" | "nama";
  clientScannedAt?: string | null;
  offline?: boolean;
};

/** The one-line "who is this" the gate and the desk show under the name. */
export function keterangan(p: {
  statusLipia: string | null;
  semester: string | null;
  tahunLulus: string | null;
}): string | null {
  if (p.statusLipia === "mahasiswa") {
    return p.semester ? `Student · Semester ${p.semester}` : "Student";
  }
  if (p.statusLipia === "khirrij") {
    return p.tahunLulus ? `Graduate ${p.tahunLulus}` : "Graduate";
  }
  if (p.statusLipia === "mutarabbish") return "Mutarabbish";
  return null;
}

// A queued scan carries the phone's own clock, and phones are wrong. An unparseable
// string makes the INSERT throw (losing the attendance), and a wildly skewed clock
// lands one row hours away — enough on its own to push every real scan out of the
// arrival chart's window. Anything outside a sane band falls back to server time.
const SKEW_MUNDUR_MS = 36 * 60 * 60 * 1000; // a long event day plus a late sync
const SKEW_MAJU_MS = 10 * 60 * 1000;

export function waktuKlienAman(raw: string | null | undefined, now = Date.now()): Date | null {
  if (!raw) return null;
  const t = new Date(raw).getTime();
  if (!Number.isFinite(t)) return null;
  if (t < now - SKEW_MUNDUR_MS) return null;
  if (t > now + SKEW_MAJU_MS) return null;
  return new Date(t);
}

/**
 * A second scan never produces a second row — the attendance PK is peserta_id.
 * It comes back as "already scanned", which is the right answer for the usher, not
 * an error and not a red screen on a legitimate participant.
 */
export async function catatKehadiran(
  acaraId: string,
  input: InputPindai,
): Promise<HasilPindai> {
  const db = getDb();
  const kode = normalizeKode(input.kode);

  const [p] = await db
    .select()
    .from(acaraPeserta)
    .where(and(eq(acaraPeserta.acaraId, acaraId), eq(acaraPeserta.kode, kode)))
    .limit(1);

  if (!p || !p.aktif) return { keadaan: "merah", kode };

  /*
   * A scan synced from an offline queue is not asking whether to let someone in — the
   * usher already did, against the list on the phone. If the seat was released or
   * the permit withdrawn after that list was downloaded, refusing now records
   * nothing and leaves the scan stuck on the phone forever, while the person sits in
   * the hall. The attendance is written; the rules below are for live scans.
   */
  const sudahMasuk = input.offline === true;

  // A released seat is a void ticket. The QR stays in their gallery, so the gate is
  // where that has to be enforced.
  if (p.konfirmasi === false && !sudahMasuk) return { keadaan: "merah", kode };

  // A walk-in is not in until the committee says so.
  if (p.jenis === "ots" && !p.izinOtsAt && !sudahMasuk) {
    return {
      keadaan: "antre",
      nomor: p.nomor,
      nama: p.nama,
      gender: p.gender,
      keterangan: keterangan(p),
      pesertaId: p.id,
      posisi: p.urutOts,
    };
  }

  const clientAt = waktuKlienAman(input.clientScannedAt);

  const inserted = await db
    .insert(acaraKehadiran)
    .values({
      pesertaId: p.id,
      acaraId,
      clientScannedAt: clientAt,
      gate: input.gate ?? null,
      petugas: input.petugas ?? null,
      metode: input.metode ?? "qr",
      offline: input.offline ?? false,
    })
    .onConflictDoNothing({ target: acaraKehadiran.pesertaId })
    .returning();

  const ket = keterangan(p);

  if (inserted.length > 0) {
    return {
      keadaan: "hijau",
      nomor: p.nomor,
      nama: p.nama,
      gender: p.gender,
      keterangan: ket,
      pesertaId: p.id,
    };
  }

  const [ada] = await db
    .select()
    .from(acaraKehadiran)
    .where(eq(acaraKehadiran.pesertaId, p.id))
    .limit(1);

  return {
    keadaan: "kuning",
    nomor: p.nomor,
    nama: p.nama,
    gender: p.gender,
    keterangan: ket,
    pesertaId: p.id,
    pertamaAt: (ada?.clientScannedAt ?? ada?.scannedAt ?? new Date()).toISOString(),
    pertamaGate: ada?.gate ?? null,
  };
}

/**
 * Used by the help desk: the person is already standing at the table.
 *
 * Both ids come from a staff form — one deployment serves many programmes, so the
 * participant id in the POST body and the programme id resolved from the picker can
 * disagree (a stale tab, a back button, an edited field). Without this check the
 * insert would happily file a participant of one programme as present at another, and
 * attendance would be wrong in two places at once. No row means "not found" — the
 * same answer `catatKehadiran` gives an unknown code, not a thrown error at a desk
 * with a queue behind it.
 *
 * Letting in a walk-in who is still in the queue IS the permit: the desk decided, so
 * the row is stamped and the dashboard counts the seat.
 */
export async function catatKehadiranLangsung(
  acaraId: string,
  pesertaId: string,
  opts: {
    gate?: string | null;
    petugas?: string | null;
    metode: "manual" | "nama" | "qr";
  },
): Promise<"hijau" | "kuning" | "merah"> {
  const db = getDb();

  const [p] = await db
    .select({ id: acaraPeserta.id, jenis: acaraPeserta.jenis, izinOtsAt: acaraPeserta.izinOtsAt })
    .from(acaraPeserta)
    .where(and(eq(acaraPeserta.id, pesertaId), eq(acaraPeserta.acaraId, acaraId)))
    .limit(1);
  if (!p) return "merah";

  const rows = await db
    .insert(acaraKehadiran)
    .values({
      pesertaId,
      acaraId,
      gate: opts.gate ?? null,
      petugas: opts.petugas ?? null,
      metode: opts.metode,
    })
    .onConflictDoNothing({ target: acaraKehadiran.pesertaId })
    .returning();
  if (rows.length > 0 && p.jenis === "ots" && !p.izinOtsAt) {
    await db
      .update(acaraPeserta)
      .set({ izinOtsAt: new Date(), updatedAt: new Date() })
      .where(eq(acaraPeserta.id, pesertaId));
  }
  return rows.length > 0 ? "hijau" : "kuning";
}

/**
 * Reverses a scan. The one correction path that existed nowhere else: an usher who
 * scanned the phone of the person standing behind had no way to put it right, and
 * the participant was then permanently "already scanned".
 *
 * The row is deleted rather than flagged, because the attendance PK is peserta_id
 * and a soft-deleted row would still block the real entry. The reversal is written
 * into the participant's note instead, so the trail survives.
 */
export async function batalkanKehadiran(
  acaraId: string,
  pesertaId: string,
  oleh: string,
): Promise<boolean> {
  const db = getDb();
  const dihapus = await db
    .delete(acaraKehadiran)
    .where(and(eq(acaraKehadiran.acaraId, acaraId), eq(acaraKehadiran.pesertaId, pesertaId)))
    .returning({ id: acaraKehadiran.pesertaId });
  if (dihapus.length === 0) return false;

  const jejak = `scan reversed by ${oleh || "staff"} at ${new Date().toISOString()}`;
  await db
    .update(acaraPeserta)
    .set({
      catatan: sql`coalesce(${acaraPeserta.catatan} || ' · ', '') || ${jejak}`,
      updatedAt: new Date(),
    })
    .where(eq(acaraPeserta.id, pesertaId));
  return true;
}
