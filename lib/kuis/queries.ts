import { and, count, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { acara, acaraPeserta, kuisJawaban, pengguna } from "@/db/schema";
import { isSoalSah, sudahTerbuka, tepatWaktu } from "./jadwal";
import { nomorTampil } from "./nomor";
import { soalKe } from "./soal";
import { skor, streak, type BarisPapan, type Jawaban } from "./skor";

/**
 * Reading and writing the quiz.
 *
 * Everything the leaderboard shows is anonymous by construction: the query selects
 * participant numbers and gender and never a name, so there is no page that could
 * accidentally print one.
 */

/** Every answer this account has given for one programme's quiz. */
export async function jawabanSaya(penggunaId: string, slug: string): Promise<Jawaban[]> {
  const rows = await getDb()
    .select({
      nomor: kuisJawaban.nomor,
      pilih: kuisJawaban.pilih,
      benar: kuisJawaban.benar,
      tepatWaktu: kuisJawaban.tepatWaktu,
    })
    .from(kuisJawaban)
    .where(and(eq(kuisJawaban.penggunaId, penggunaId), eq(kuisJawaban.slug, slug)));
  return rows;
}

export type HasilSimpan =
  | { status: "tersimpan"; benar: boolean }
  | { status: "sudah" }
  | { status: "belum_buka" }
  | { status: "tidak_sah" };

/**
 * One attempt, ever.
 *
 * The check for an existing row is not the guard — two taps a few milliseconds apart
 * would both pass it. `onConflictDoNothing` on the unique index is, and a zero-row
 * result is read back as "already answered" rather than as a failure.
 */
export async function simpanJawaban({
  penggunaId,
  slug,
  nomor,
  pilih,
  mulai,
  sekarang = Date.now(),
}: {
  penggunaId: string;
  slug: string;
  nomor: number;
  pilih: number;
  mulai: string;
  sekarang?: number;
}): Promise<HasilSimpan> {
  const soal = soalKe(nomor);
  if (!isSoalSah(nomor) || !soal) return { status: "tidak_sah" };
  if (!Number.isInteger(pilih) || pilih < 0 || pilih > 3) return { status: "tidak_sah" };
  // Answering a question that has not opened would be answering it before anyone
  // else could — the date is checked here, never taken from the form.
  if (!sudahTerbuka(mulai, nomor, sekarang)) return { status: "belum_buka" };

  const benar = pilih === soal.jawab;
  const rows = await getDb()
    .insert(kuisJawaban)
    .values({
      penggunaId,
      slug,
      nomor,
      pilih,
      benar,
      tepatWaktu: tepatWaktu(mulai, nomor, sekarang),
    })
    .onConflictDoNothing({
      target: [kuisJawaban.penggunaId, kuisJawaban.slug, kuisJawaban.nomor],
    })
    .returning({ id: kuisJawaban.id });

  return rows.length ? { status: "tersimpan", benar } : { status: "sudah" };
}

/**
 * The leaderboard for one side of the hall.
 *
 * The participant number comes from a registration for this same programme when
 * there is one — that is the number on their ticket, which they will recognise —
 * and otherwise from the account id (lib/kuis/nomor.ts). The join is left, so
 * someone who played without registering is still on the board.
 */
export async function papan(
  slug: string,
  gender: string,
  sesiSekarang: number,
): Promise<(BarisPapan & { penggunaId: string })[]> {
  const rows = await getDb()
    .select({
      penggunaId: kuisJawaban.penggunaId,
      nomorPeserta: acaraPeserta.nomor,
      nomor: kuisJawaban.nomor,
      pilih: kuisJawaban.pilih,
      benar: kuisJawaban.benar,
      tepatWaktu: kuisJawaban.tepatWaktu,
    })
    .from(kuisJawaban)
    .innerJoin(pengguna, eq(pengguna.id, kuisJawaban.penggunaId))
    .leftJoin(acara, eq(acara.slug, kuisJawaban.slug))
    .leftJoin(
      acaraPeserta,
      and(
        eq(acaraPeserta.acaraId, acara.id),
        eq(acaraPeserta.penggunaId, kuisJawaban.penggunaId),
      ),
    )
    .where(and(eq(kuisJawaban.slug, slug), eq(pengguna.aktif, true), eq(pengguna.gender, gender)));

  /*
   * A streak is a run, not a count, so it cannot be a GROUP BY. Thirty rows per
   * player and a few hundred players is small enough to fold here, and it means the
   * board and the player's own page are computing it with the same function rather
   * than with SQL that has to be kept in step with it.
   */
  const per = new Map<string, { tiket: string | null; jawaban: Jawaban[] }>();
  for (const r of rows) {
    const p = per.get(r.penggunaId) ?? { tiket: r.nomorPeserta, jawaban: [] };
    if (r.nomorPeserta) p.tiket = r.nomorPeserta;
    p.jawaban.push({ nomor: r.nomor, pilih: r.pilih, benar: r.benar, tepatWaktu: r.tepatWaktu });
    per.set(r.penggunaId, p);
  }

  return [...per.entries()].map(([penggunaId, p]) => ({
    penggunaId,
    nomor: nomorTampil(penggunaId, p.tiket),
    skor: skor(p.jawaban),
    streak: streak(p.jawaban, sesiSekarang),
  }));
}

/** How many accounts of one gender have answered at least one question. */
export async function jumlahPemain(slug: string, gender: string): Promise<number> {
  const [row] = await getDb()
    .select({ n: sql<number>`count(distinct ${kuisJawaban.penggunaId})` })
    .from(kuisJawaban)
    .innerJoin(pengguna, eq(pengguna.id, kuisJawaban.penggunaId))
    .where(and(eq(kuisJawaban.slug, slug), eq(pengguna.aktif, true), eq(pengguna.gender, gender)));
  return Number(row?.n ?? 0);
}

/**
 * One week's tally for one group, for the Monday WhatsApp message.
 *
 * `menjawab` counts people, not rows: "how many of the group joined in" is what the
 * groups care about, and each person leaves up to five rows in a week.
 */
export async function rekapSesi(
  slug: string,
  nomor: number[],
  gender: string,
): Promise<{ menjawab: number; jawaban: number; benar: number }> {
  if (!nomor.length) return { menjawab: 0, jawaban: 0, benar: 0 };
  const [row] = await getDb()
    .select({
      menjawab: sql<number>`count(distinct ${kuisJawaban.penggunaId})`,
      jawaban: count(),
      benar: sql<number>`count(*) filter (where ${kuisJawaban.benar})`,
    })
    .from(kuisJawaban)
    .innerJoin(pengguna, eq(pengguna.id, kuisJawaban.penggunaId))
    .where(
      and(
        eq(kuisJawaban.slug, slug),
        inArray(kuisJawaban.nomor, nomor),
        eq(pengguna.aktif, true),
        eq(pengguna.gender, gender),
      ),
    );
  return {
    menjawab: Number(row?.menjawab ?? 0),
    jawaban: Number(row?.jawaban ?? 0),
    benar: Number(row?.benar ?? 0),
  };
}

/** This account's participant number for the programme, when it registered for it. */
export async function nomorPeserta(penggunaId: string, slug: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ nomor: acaraPeserta.nomor })
    .from(acaraPeserta)
    .innerJoin(acara, eq(acara.id, acaraPeserta.acaraId))
    .where(and(eq(acara.slug, slug), eq(acaraPeserta.penggunaId, penggunaId)))
    .limit(1);
  return row?.nomor ?? null;
}
