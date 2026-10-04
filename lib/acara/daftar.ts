import { and, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { acara, acaraCounter, acaraPeserta, type Peserta } from "@/db/schema";
import { normalizePhone } from "@/lib/wa";
import { generateKodeTiket } from "@/lib/tiket/kode";

export type Gender = "ikhwan" | "akhwat";

export type InputPendaftaran = {
  nama: string;
  gender: Gender;
  wa: string;
  /** The account that registered. Null for CSV imports. */
  penggunaId?: string | null;
  email?: string | null;
  lipia?: boolean;
  statusLipia?: string | null;
  nim?: string | null;
  prodi?: string | null;
  sesi?: string | null;
  semester?: string | null;
  tahunLulus?: string | null;
  domisili?: string | null;
  asalDaerah?: string | null;
  asalSekolah?: string | null;
  keahlian?: string | null;
  transportasi?: string | null;
  kebutuhanKhusus?: string | null;
  catatan?: string | null;
};

/** "pra" — a seat booked online; "ots" — a walk-in, in the queue until permitted. */
export type JenisPeserta = "pra" | "ots";

export type KonteksPendaftaran = {
  /** "web" is any form on the site, the walk-in link included. */
  sumber: "web" | "impor";
  jenis?: JenisPeserta;
  ipHash?: string | null;
};

export type HasilDaftar =
  | { ok: true; peserta: Peserta; baru: boolean }
  | {
      ok: false;
      alasan: "tutup" | "penuh" | "wa_tidak_valid" | "sudah_terdaftar" | "laju";
      peserta?: Peserta;
    };

const HURUF_GENDER: Record<Gender, string> = { ikhwan: "B", akhwat: "S" };

function nomorPeserta(prefiks: string, gender: Gender, urut: number): string {
  return `${prefiks}-${HURUF_GENDER[gender]}-${String(urut).padStart(4, "0")}`;
}

type Acara = typeof acara.$inferSelect;
type Transaksi = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/*
 * The quota is the quota: online registration fills it and then the form says
 * "full". There is no reserve held back for the door and no waiting list — walk-ins
 * register through their own link on the day and the committee lets them in against
 * whatever seats are actually free (lib/acara/ots.ts).
 *
 * Counted per gender when the event sets a per-gender quota. The two sides of the
 * hall are separate rooms with separate doors, so a single total can be satisfied
 * while one side overflows and the other has empty rows. Falling back to the overall
 * number keeps older events working.
 */
export function batasKursi(
  ev: Pick<Acara, "kuota" | "kuotaIkhwan" | "kuotaAkhwat">,
  gender: Gender,
): { batas: number; perGender: boolean } | null {
  const adaKuota = ev.kuotaIkhwan !== null || ev.kuotaAkhwat !== null || ev.kuota !== null;
  if (!adaKuota) return null;
  const kuotaGender = gender === "akhwat" ? ev.kuotaAkhwat : ev.kuotaIkhwan;
  const perGender = kuotaGender !== null && kuotaGender !== undefined;
  // One side limited and this side with neither its own number nor a total: this
  // side has no limit. Reading it as zero would refuse every registration there.
  if (!perGender && ev.kuota === null) return null;
  return { batas: (perGender ? kuotaGender : ev.kuota) ?? 0, perGender };
}

/**
 * Seats taken on one side (or the whole hall): online seats still held, plus
 * walk-ins the committee has let in. Released seats are free seats; a walk-in still
 * in the queue holds nothing yet.
 */
export function syaratKursiTerpakai(acaraId: string, gender: Gender | null) {
  const syarat = [
    eq(acaraPeserta.acaraId, acaraId),
    eq(acaraPeserta.aktif, true),
    sql`${acaraPeserta.konfirmasi} is distinct from false`,
    sql`(${acaraPeserta.jenis} = 'pra' or ${acaraPeserta.izinOtsAt} is not null)`,
  ];
  if (gender) syarat.push(eq(acaraPeserta.gender, gender));
  return and(...syarat);
}

/** Is there a seat free right now? Called inside the transaction that takes it. */
async function adaKursi(tx: Transaksi, ev: Acara, gender: Gender): Promise<boolean> {
  const b = batasKursi(ev, gender);
  if (!b) return true;
  const [t] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(acaraPeserta)
    .where(syaratKursiTerpakai(ev.id, b.perGender ? gender : null));
  return (t?.n ?? 0) < b.batas;
}

export type HasilKembali = { ok: true; peserta: Peserta } | { ok: false; alasan: "penuh" | "tidak_ada" };

/**
 * "I can come after all" — from the ticket, or by filling the form in again.
 *
 * The same ticket comes back (number and QR unchanged), but NOT necessarily the same
 * seat: someone else may have registered into it since. If a seat is free the
 * participant takes it back; if the hall has filled meanwhile they are told so and
 * their registration stays released — the walk-in link is their way in on the day.
 *
 * The gender's counter row is locked first — the same lock a new registration takes —
 * so a reclaim and a registration can never both see the last free seat.
 */
export async function ambilKembaliKursi(pesertaId: string): Promise<HasilKembali> {
  const db = getDb();
  const [p] = await db.select().from(acaraPeserta).where(eq(acaraPeserta.id, pesertaId)).limit(1);
  if (!p || !p.aktif) return { ok: false, alasan: "tidak_ada" };
  if (p.konfirmasi !== false) return { ok: true, peserta: p };
  const [ev] = await db.select().from(acara).where(eq(acara.id, p.acaraId)).limit(1);
  if (!ev) return { ok: false, alasan: "tidak_ada" };
  const gender: Gender = p.gender === "akhwat" ? "akhwat" : "ikhwan";

  return db.transaction(async (tx) => {
    // With one shared quota the other side can take the same seat, so both rows.
    const bersama = batasKursi(ev, gender)?.perGender === false;
    await tx.execute(
      bersama
        ? sql`select 1 from ${acaraCounter} where ${acaraCounter.acaraId} = ${ev.id} order by ${acaraCounter.gender} for update`
        : sql`select 1 from ${acaraCounter} where ${acaraCounter.acaraId} = ${ev.id} and ${acaraCounter.gender} = ${gender} for update`,
    );
    // A walk-in's place is in the queue, not in the quota: taking it back costs no seat.
    const dapatKursi = p.jenis === "ots" || (await adaKursi(tx, ev, gender));
    if (!dapatKursi) return { ok: false, alasan: "penuh" } as const;
    const [row] = await tx
      .update(acaraPeserta)
      .set({ konfirmasi: true, konfirmasiAt: new Date(), updatedAt: new Date() })
      .where(eq(acaraPeserta.id, p.id))
      .returning();
    return row ? ({ ok: true, peserta: row } as const) : ({ ok: false, alasan: "tidak_ada" } as const);
  });
}

/**
 * The only path that writes a participant row. Called from the public form, from
 * the walk-in link, and from the CSV import — one function, three triggers. Writing
 * a second path is how the three drift apart.
 */
export async function daftarPeserta(
  slug: string,
  input: InputPendaftaran,
  konteks: KonteksPendaftaran,
): Promise<HasilDaftar> {
  const db = getDb();

  const [ev] = await db.select().from(acara).where(eq(acara.slug, slug)).limit(1);
  if (!ev) return { ok: false, alasan: "tutup" };

  const jenisDiminta: JenisPeserta = konteks.jenis ?? "pra";

  // The door is read from status, never from comparing dates. The import runs
  // regardless — it exists precisely to catch up after the door has closed.
  if (konteks.sumber === "web" && jenisDiminta === "pra" && ev.status !== "pendaftaran") {
    return { ok: false, alasan: "tutup" };
  }
  /*
   * The walk-in link has its own switch, and works while the online form is closed:
   * that is the whole point of it. It is not a way round a cancelled or finished
   * programme.
   */
  const hariH = ev.status === "pendaftaran" || ev.status === "ditutup" || ev.status === "berlangsung";
  if (konteks.sumber === "web" && jenisDiminta === "ots" && !(ev.otsBuka && hariH)) {
    return { ok: false, alasan: "tutup" };
  }

  const wa = normalizePhone(input.wa);
  if (!wa) return { ok: false, alasan: "wa_tidak_valid" };

  const nama = input.nama.trim().replace(/\s+/g, " ");

  // Identity key is the normalised WhatsApp number. An existing row is answered
  // kindly, not as an error — and it makes import idempotent for free.
  // The account is a second key: a signed-in participant who types a different number
  // is still the same person, and one account holds one registration per programme
  // (peserta_pengguna_unik). Missing it here made that insert fail with a crash page.
  const [sudah] = await db
    .select()
    .from(acaraPeserta)
    .where(
      and(
        eq(acaraPeserta.acaraId, ev.id),
        input.penggunaId
          ? or(eq(acaraPeserta.wa, wa), eq(acaraPeserta.penggunaId, input.penggunaId))
          : eq(acaraPeserta.wa, wa),
      ),
    )
    .orderBy(sql`(${acaraPeserta.wa} = ${wa}) desc`)
    .limit(1);

  if (sudah) {
    /*
     * Registering again after saying "I cannot come" is changing their mind, not a
     * duplicate. They get their ticket back through the same rule as the button on
     * the ticket: a free seat if there is one, otherwise "full".
     */
    if (konteks.sumber === "web" && sudah.aktif && sudah.konfirmasi === false) {
      const kembali = await ambilKembaliKursi(sudah.id);
      if (kembali.ok) return { ok: true, peserta: kembali.peserta, baru: false };
      if (kembali.alasan === "penuh") return { ok: false, alasan: "penuh", peserta: sudah };
    }
    if (konteks.sumber === "impor") {
      // Update the soft fields only. nomor and kode are never rewritten: the
      // participant may already have a screenshot of their QR.
      const [upd] = await db
        .update(acaraPeserta)
        .set({
          nama: nama || sudah.nama,
          email: input.email ?? sudah.email,
          penggunaId: input.penggunaId ?? sudah.penggunaId,
          lipia: input.lipia ?? sudah.lipia,
          statusLipia: input.statusLipia ?? sudah.statusLipia,
          nim: input.nim ?? sudah.nim,
          prodi: input.prodi ?? sudah.prodi,
          sesi: input.sesi ?? sudah.sesi,
          semester: input.semester ?? sudah.semester,
          tahunLulus: input.tahunLulus ?? sudah.tahunLulus,
          domisili: input.domisili ?? sudah.domisili,
          asalDaerah: input.asalDaerah ?? sudah.asalDaerah,
          asalSekolah: input.asalSekolah ?? sudah.asalSekolah,
          keahlian: input.keahlian ?? sudah.keahlian,
          transportasi: input.transportasi ?? sudah.transportasi,
          kebutuhanKhusus: input.kebutuhanKhusus ?? sudah.kebutuhanKhusus,
          updatedAt: new Date(),
        })
        .where(eq(acaraPeserta.id, sudah.id))
        .returning();
      return { ok: true, peserta: upd, baru: false };
    }
    return { ok: false, alasan: "sudah_terdaftar", peserta: sudah };
  }

  // A NIM already used by a different number: keep both rows and flag for a human.
  // It can be a typo, or it can be two people. The machine must not decide.
  let catatan = input.catatan ?? null;
  if (input.nim) {
    const [bentrok] = await db
      .select({ nomor: acaraPeserta.nomor })
      .from(acaraPeserta)
      .where(and(eq(acaraPeserta.acaraId, ev.id), eq(acaraPeserta.nim, input.nim)))
      .limit(1);
    if (bentrok) {
      catatan = [catatan, `NIM clash with ${bentrok.nomor} — needs review`]
        .filter(Boolean)
        .join(" · ");
    }
  }

  const nimDipakai = catatan?.includes("NIM clash") ? null : (input.nim ?? null);

  /*
   * Quota. Past it the online form says "full" and issues nothing — silently issuing
   * seat 1,200 for a 1,000-seat hall is how a thousand people arrive to find no
   * room. A walk-in takes no seat here: they get a queue number and wait for the
   * committee's permit, which is where the free seats are counted.
   *
   * Counted under the gender's counter lock, inside the insert's transaction, so two
   * simultaneous registrations cannot both read "999 taken".
   */
  const PENUH = "nawa:penuh";

  // Up to five attempts: the odds of a code collision are negligible, but the
  // database is what guarantees uniqueness, not the generator.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const peserta = await db.transaction(async (tx) => {
        /*
         * One shared quota for both sides: a brother and a sister registering at once
         * lock different counter rows and could both take the hall's last seat. Both
         * rows are locked first, in a fixed order, so the two cannot deadlock each
         * other either.
         */
        const batas = jenisDiminta === "pra" ? batasKursi(ev, input.gender) : null;
        if (batas && !batas.perGender) {
          await tx.execute(
            sql`select 1 from ${acaraCounter} where ${acaraCounter.acaraId} = ${ev.id} order by ${acaraCounter.gender} for update`,
          );
        }

        // UPDATE locks the counter row; a concurrent registration waits here.
        // This is the whole reason there is no SELECT max(nomor) + 1 anywhere.
        // A walk-in also draws the next number in their side's queue, on the same row.
        const [ctr] = await tx
          .update(acaraCounter)
          .set({
            terakhir: sql`${acaraCounter.terakhir} + 1`,
            ...(jenisDiminta === "ots" ? { terakhirOts: sql`${acaraCounter.terakhirOts} + 1` } : {}),
          })
          .where(
            and(eq(acaraCounter.acaraId, ev.id), eq(acaraCounter.gender, input.gender)),
          )
          .returning({ terakhir: acaraCounter.terakhir, terakhirOts: acaraCounter.terakhirOts });
        if (!ctr) throw new Error(`counter row missing for ${slug}/${input.gender}`);

        // Counted only now, under the counter lock. Counting first let two registrations
        // at the moment the hall filled both see the last seat free and both take it:
        // the transaction alone does not stop that, the lock does. Throwing rolls the
        // counter back too, so a refused registration burns no number.
        if (jenisDiminta === "pra" && !(await adaKursi(tx, ev, input.gender))) {
          throw new Error(PENUH);
        }
        const jenis: JenisPeserta = jenisDiminta;

        const [row] = await tx
          .insert(acaraPeserta)
          .values({
            acaraId: ev.id,
            penggunaId: input.penggunaId ?? null,
            nomor: nomorPeserta(ev.prefiksNomor, input.gender, ctr.terakhir),
            kode: generateKodeTiket(),
            nama,
            gender: input.gender,
            wa,
            email: input.email ?? null,
            lipia: input.lipia ?? true,
            statusLipia: input.statusLipia ?? null,
            nim: nimDipakai,
            prodi: input.prodi ?? null,
            sesi: input.sesi ?? null,
            semester: input.semester ?? null,
            tahunLulus: input.tahunLulus ?? null,
            domisili: input.domisili ?? null,
            asalDaerah: input.asalDaerah ?? null,
            asalSekolah: input.asalSekolah ?? null,
            keahlian: input.keahlian ?? null,
            transportasi: input.transportasi ?? null,
            kebutuhanKhusus: input.kebutuhanKhusus ?? null,
            jenis,
            urutOts: jenis === "ots" ? ctr.terakhirOts : null,
            sumber: konteks.sumber,
            catatan,
          })
          .returning();
        return row;
      });
      return { ok: true, peserta, baru: true };
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      if (msg.includes(PENUH)) return { ok: false, alasan: "penuh" };
      if (msg.includes("peserta_kode_unik")) continue; // regenerate and retry
      if (msg.includes("peserta_wa_unik") || msg.includes("peserta_pengguna_unik")) {
        // Lost a race with a concurrent submit of the same number or account.
        const [row] = await db
          .select()
          .from(acaraPeserta)
          .where(
            and(
              eq(acaraPeserta.acaraId, ev.id),
              msg.includes("peserta_pengguna_unik") && input.penggunaId
                ? eq(acaraPeserta.penggunaId, input.penggunaId)
                : eq(acaraPeserta.wa, wa),
            ),
          )
          .limit(1);
        if (row) {
          return konteks.sumber === "impor"
            ? { ok: true, peserta: row, baru: false }
            : { ok: false, alasan: "sudah_terdaftar", peserta: row };
        }
      }
      throw e;
    }
  }

  throw new Error("could not allocate a unique ticket code after 5 attempts");
}
