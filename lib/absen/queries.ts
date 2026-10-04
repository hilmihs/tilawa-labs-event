import { and, asc, eq, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { acaraKehadiran, acaraPeserta, feedbackAbsen, type FeedbackAbsen, type Peserta } from "@/db/schema";
import { pesertaDenganWa } from "@/lib/acara/queries";
import { normalizePhone } from "@/lib/wa";
import type { JawabanAbsen } from "./alasan";

/**
 * Every no-show of a programme with whatever we know about reaching them — the one
 * list the email blast, the recap and the CSV all read.
 *
 * "No-show" is the same rule as kelayakanAbsen, in SQL: active, never scanned, and a
 * walk-in only if the committee let them in.
 */
export async function daftarAbsen(acaraId: string) {
  return getDb()
    .select({
      pesertaId: acaraPeserta.id,
      nomor: acaraPeserta.nomor,
      nama: acaraPeserta.nama,
      gender: acaraPeserta.gender,
      wa: acaraPeserta.wa,
      email: acaraPeserta.email,
      alasan: feedbackAbsen.alasan,
      alasanLain: feedbackAbsen.alasanLain,
      waktuCocok: feedbackAbsen.waktuCocok,
      pengingat: feedbackAbsen.pengingat,
      mauOnline: feedbackAbsen.mauOnline,
      saran: feedbackAbsen.saran,
      kabari: sql<boolean>`coalesce(${feedbackAbsen.kabari}, false)`,
      emailAt: feedbackAbsen.emailAt,
      emailIngatAt: feedbackAbsen.emailIngatAt,
      waAt: feedbackAbsen.waAt,
      dibukaAt: feedbackAbsen.dibukaAt,
      diisiAt: feedbackAbsen.diisiAt,
    })
    .from(acaraPeserta)
    .leftJoin(acaraKehadiran, eq(acaraKehadiran.pesertaId, acaraPeserta.id))
    .leftJoin(feedbackAbsen, eq(feedbackAbsen.pesertaId, acaraPeserta.id))
    .where(
      and(
        eq(acaraPeserta.acaraId, acaraId),
        eq(acaraPeserta.aktif, true),
        isNull(acaraKehadiran.pesertaId),
        or(ne(acaraPeserta.jenis, "ots"), isNotNull(acaraPeserta.izinOtsAt)),
      ),
    )
    .orderBy(asc(acaraPeserta.nomor));
}

export type BarisAbsen = Awaited<ReturnType<typeof daftarAbsen>>[number];

/**
 * Who is answering, from the WhatsApp number they typed — the same normalisation and
 * match as the ticket lookup. No name check on top, unlike the ticket: nothing about
 * the participant is ever shown back, so a guessed number reveals nothing, and the
 * worst it can do is overwrite one no-show's answer.
 */
export async function cariPesertaAbsen(acaraId: string, waMentah: string): Promise<Peserta | null> {
  const wa = normalizePhone(waMentah);
  if (!wa) return null;
  const p = await pesertaDenganWa(acaraId, wa);
  return p?.aktif ? p : null;
}

/**
 * Who is answering, from the signed-in account: the programme's registration made
 * with that account, if it is still active. The caller reads the account from the
 * session itself — this never takes an id the browser sent.
 */
export async function pesertaDariAkun(acaraId: string, penggunaId: string): Promise<Peserta | null> {
  const [p] = await getDb()
    .select()
    .from(acaraPeserta)
    .where(and(eq(acaraPeserta.acaraId, acaraId), eq(acaraPeserta.penggunaId, penggunaId), eq(acaraPeserta.aktif, true)))
    .limit(1);
  return p ?? null;
}

export async function sudahHadir(pesertaId: string): Promise<boolean> {
  const [r] = await getDb()
    .select({ id: acaraKehadiran.pesertaId })
    .from(acaraKehadiran)
    .where(eq(acaraKehadiran.pesertaId, pesertaId))
    .limit(1);
  return Boolean(r);
}

export async function ambilFeedbackAbsen(pesertaId: string): Promise<FeedbackAbsen | null> {
  const [r] = await getDb().select().from(feedbackAbsen).where(eq(feedbackAbsen.pesertaId, pesertaId)).limit(1);
  return r ?? null;
}

type KolomWaktu = "emailAt" | "emailIngatAt" | "waAt" | "dibukaAt";

/**
 * Records the first time something happened. Creates the row if this is the first
 * touch; a timestamp already set is kept, so "opened" means first opened and a
 * repeated send does not look like a new one.
 */
export async function tandaiAbsen(pesertaId: string, acaraId: string, kolom: KolomWaktu): Promise<void> {
  const now = new Date();
  await getDb()
    .insert(feedbackAbsen)
    .values({ pesertaId, acaraId, [kolom]: now })
    .onConflictDoUpdate({
      target: feedbackAbsen.pesertaId,
      set: { [kolom]: sql`coalesce(${feedbackAbsen[kolom]}, ${now})`, updatedAt: now },
    });
}

/** Every submit replaces the answers; `diisiAt` is the latest submit. */
export async function simpanJawabanAbsen(pesertaId: string, acaraId: string, j: JawabanAbsen): Promise<void> {
  const now = new Date();
  const isi = {
    alasan: j.alasan,
    alasanLain: j.alasanLain,
    waktuCocok: j.waktuCocok,
    pengingat: j.pengingat,
    mauOnline: j.mauOnline,
    saran: j.saran,
    kabari: j.kabari,
    diisiAt: now,
    updatedAt: now,
  };
  await getDb()
    .insert(feedbackAbsen)
    .values({ pesertaId, acaraId, ...isi })
    .onConflictDoUpdate({ target: feedbackAbsen.pesertaId, set: isi });
}
