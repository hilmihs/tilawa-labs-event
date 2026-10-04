import { cache } from "react";
import { and, asc, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { keAngkaLatin } from "@/lib/wa";
import { getDb } from "@/db";
import { acara, acaraAkses, acaraKehadiran, acaraPeserta } from "@/db/schema";
import type { Acara, Peserta } from "@/db/schema";
import { kuotaEfektif, pilihBawaan } from "@/lib/acara/view-model";
import { tanggalIsoWib } from "@/lib/waktu";

/** One programme by slug. The slug always comes from the caller now — the URL, the
 *  ticket token, or the staff cookie — never from the environment. */
export async function ambilAcara(slug: string): Promise<Acara | null> {
  if (!slug) return null;
  const db = getDb();
  const [row] = await db.select().from(acara).where(eq(acara.slug, slug)).limit(1);
  return row ?? null;
}

/**
 * Programmes the public may see, in the committee's order then newest first.
 *
 * Ascending by date puts whatever finished longest ago at the top as soon as nobody
 * sets `urutan` — which is the normal case. The landing page must lead with what is
 * still ahead.
 */
export async function daftarProgramPublik(): Promise<Acara[]> {
  const db = getDb();
  return db
    .select()
    .from(acara)
    .where(eq(acara.tampil, true))
    .orderBy(asc(acara.urutan), desc(acara.tanggal));
}

/**
 * Every programme, newest first. Staff pages and the picker.
 *
 * Request-scoped: the header's picker and `acaraBawaan` both want the whole list on
 * the same render, and without this that is two full reads of `acara` per page.
 */
export const semuaProgram = cache(async (): Promise<Acara[]> => {
  const db = getDb();
  return db.select().from(acara).orderBy(desc(acara.tanggal), asc(acara.nama));
});

/** See `pilihBawaan`: the programme staff most likely mean when they have not chosen. */
export async function acaraBawaan(): Promise<Acara | null> {
  return pilihBawaan(await semuaProgram(), tanggalIsoWib());
}

/**
 * The same choice, but only among programmes the public may see.
 *
 * The legacy `/[lang]/register` and `/[lang]/ticket` URLs redirect into a
 * programme, and a draft's slug must not leak through a Location header — the
 * landing page hides drafts and the programme page 404s for them, so a redirect is
 * the one door left open.
 */
export async function acaraBawaanPublik(): Promise<Acara | null> {
  return pilihBawaan(await daftarProgramPublik(), tanggalIsoWib());
}

export async function ambilPesertaById(id: string): Promise<Peserta | null> {
  const db = getDb();
  const [row] = await db.select().from(acaraPeserta).where(eq(acaraPeserta.id, id)).limit(1);
  return row ?? null;
}

export async function ambilPesertaByKode(
  acaraId: string,
  kode: string,
): Promise<Peserta | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(acaraPeserta)
    .where(and(eq(acaraPeserta.acaraId, acaraId), eq(acaraPeserta.kode, kode)))
    .limit(1);
  return row ?? null;
}

/**
 * The participant registered with this number, active or not. `wa` must already be
 * normalised (lib/wa.ts `normalizePhone`) — that is the form registration stores, and
 * the number is unique per programme.
 */
export async function pesertaDenganWa(acaraId: string, wa: string): Promise<Peserta | null> {
  const [row] = await getDb()
    .select()
    .from(acaraPeserta)
    .where(and(eq(acaraPeserta.acaraId, acaraId), eq(acaraPeserta.wa, wa)))
    .limit(1);
  return row ?? null;
}

/**
 * Self-service lookup key: WhatsApp number AND the first four letters of the name.
 * The number alone is not enough — anyone holding a list of student numbers could
 * pull every e-ticket with its owner's name. Four letters closes that for the cost
 * of three seconds.
 */
export async function cariPeserta(
  acaraId: string,
  wa: string,
  empatHuruf: string,
): Promise<Peserta | null> {
  const row = await pesertaDenganWa(acaraId, wa);
  if (!row || !row.aktif) return null;
  // Compare on however many letters the name actually has. Someone registered as
  // "Ali" has a three-letter prefix, and demanding four would shut them out of the
  // only self-service path there is.
  const nama = row.nama.trim();
  const n = Math.min(4, nama.length);
  const awal = nama.slice(0, n).toLowerCase();
  return awal === empatHuruf.trim().slice(0, n).toLowerCase() ? row : null;
}

/** Written once, only while still NULL. Never on every page load. */
export async function tandaiTiketDibuka(pesertaId: string): Promise<void> {
  const db = getDb();
  await db
    .update(acaraPeserta)
    .set({ tiketDibukaAt: new Date() })
    .where(and(eq(acaraPeserta.id, pesertaId), sql`${acaraPeserta.tiketDibukaAt} is null`));
}

export async function kehadiranPeserta(pesertaId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(acaraKehadiran)
    .where(eq(acaraKehadiran.pesertaId, pesertaId))
    .limit(1);
  return row ?? null;
}

export type BarisAkses = { jenis: "daftar" | "tiket"; wa4: string | null; ipHash: string | null; berhasil: boolean };

export async function catatAkses(acaraId: string | null, b: BarisAkses): Promise<void> {
  const db = getDb();
  await db.insert(acaraAkses).values({
    acaraId: acaraId ?? null,
    jenis: b.jenis,
    wa4: b.wa4,
    ipHash: b.ipHash,
    berhasil: b.berhasil,
  });
}

/**
 * Records a failure only if this IP has not already failed on the same last-four
 * digits recently.
 *
 * The ticket page retries every five seconds for a minute while it waits for a
 * registration to land. Logging each of those twelve polls as a distinct failure
 * would trip the five-per-ten-minutes limiter on the participant's own lookup and
 * lock them out for ten minutes — the exact person the retry loop exists to help.
 *
 * Deduplicating on (ip, wa4) keeps the limiter meaningful: someone walking a list
 * of different numbers still accumulates a failure per number, which is the pattern
 * the limit is there to stop. It is not client-controlled.
 */
export async function catatGagalSekali(
  acaraId: string | null,
  b: BarisAkses,
  jendelaDetik = 120,
): Promise<void> {
  const db = getDb();
  const sejak = new Date(Date.now() - jendelaDetik * 1000);
  const [ada] = await db
    .select({ id: acaraAkses.id })
    .from(acaraAkses)
    .where(
      and(
        eq(acaraAkses.jenis, b.jenis),
        eq(acaraAkses.berhasil, false),
        gte(acaraAkses.createdAt, sejak),
        b.ipHash ? eq(acaraAkses.ipHash, b.ipHash) : sql`true`,
        b.wa4 ? eq(acaraAkses.wa4, b.wa4) : sql`${acaraAkses.wa4} is null`,
      ),
    )
    .limit(1);
  if (ada) return;
  await catatAkses(acaraId, b);
}

/**
 * Rate limiting is counted from acara_akses because this application has none
 * anywhere else, and /daftar and /tiket are the only public endpoints touching the
 * data of a thousand people.
 */
export async function hitungAkses(
  ipHash: string,
  jenis: "daftar" | "tiket",
  sejak: Date,
  hanyaGagal = false,
): Promise<number> {
  const db = getDb();
  const kondisi = [
    eq(acaraAkses.ipHash, ipHash),
    eq(acaraAkses.jenis, jenis),
    gte(acaraAkses.createdAt, sejak),
  ];
  if (hanyaGagal) kondisi.push(eq(acaraAkses.berhasil, false));
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(acaraAkses)
    .where(and(...kondisi));
  return row?.n ?? 0;
}

export async function ringkasanAcara(acaraId: string) {
  const db = getDb();
  const [total] = await db
    .select({
      pendaftar: sql<number>`count(*) filter (where ${acaraPeserta.aktif} and ${acaraPeserta.konfirmasi} is distinct from false)::int`,
      // Same rule as the total beside it, or brothers + sisters would not add up to it.
      ikhwan: sql<number>`count(*) filter (where ${acaraPeserta.aktif} and ${acaraPeserta.konfirmasi} is distinct from false and ${acaraPeserta.gender} = 'ikhwan')::int`,
      akhwat: sql<number>`count(*) filter (where ${acaraPeserta.aktif} and ${acaraPeserta.konfirmasi} is distinct from false and ${acaraPeserta.gender} = 'akhwat')::int`,
      dibuka: sql<number>`count(*) filter (where ${acaraPeserta.aktif} and ${acaraPeserta.tiketDibukaAt} is not null)::int`,
    })
    .from(acaraPeserta)
    .where(eq(acaraPeserta.acaraId, acaraId));

  const [hadir] = await db
    .select({
      total: sql<number>`count(*)::int`,
      ikhwan: sql<number>`count(*) filter (where ${acaraPeserta.gender} = 'ikhwan')::int`,
      akhwat: sql<number>`count(*) filter (where ${acaraPeserta.gender} = 'akhwat')::int`,
      terakhir: sql<Date | null>`max(coalesce(${acaraKehadiran.clientScannedAt}, ${acaraKehadiran.scannedAt}))`,
    })
    .from(acaraKehadiran)
    .innerJoin(acaraPeserta, eq(acaraPeserta.id, acaraKehadiran.pesertaId))
    .where(eq(acaraKehadiran.acaraId, acaraId));

  return {
    pendaftar: total?.pendaftar ?? 0,
    ikhwan: total?.ikhwan ?? 0,
    akhwat: total?.akhwat ?? 0,
    tiketDibuka: total?.dibuka ?? 0,
    hadir: hadir?.total ?? 0,
    hadirIkhwan: hadir?.ikhwan ?? 0,
    hadirAkhwat: hadir?.akhwat ?? 0,
    hadirTerakhir: hadir?.terakhir ? new Date(hadir.terakhir) : null,
  };
}

/**
 * Raw scan instants for the arrival-rate chart. Bucketing happens in
 * lib/kehadiran/view-model.ts so it can be unit tested without a database, and it
 * uses coalesce(client_scanned_at, scanned_at) so an offline stretch does not pile
 * every late sync onto one bar.
 */
export async function waktuKedatangan(acaraId: string): Promise<Date[]> {
  const db = getDb();
  const rows = await db
    .select({
      at: sql<Date>`coalesce(${acaraKehadiran.clientScannedAt}, ${acaraKehadiran.scannedAt})`,
    })
    .from(acaraKehadiran)
    .where(eq(acaraKehadiran.acaraId, acaraId))
    .orderBy(asc(sql`coalesce(${acaraKehadiran.clientScannedAt}, ${acaraKehadiran.scannedAt})`));
  return rows.map((r) => new Date(r.at));
}

export async function pemindaianTerakhir(acaraId: string, limit = 20, gate?: string | null) {
  const db = getDb();
  return db
    .select({
      at: sql<Date>`coalesce(${acaraKehadiran.clientScannedAt}, ${acaraKehadiran.scannedAt})`,
      nomor: acaraPeserta.nomor,
      nama: acaraPeserta.nama,
      gender: acaraPeserta.gender,
      statusLipia: acaraPeserta.statusLipia,
      semester: acaraPeserta.semester,
      tahunLulus: acaraPeserta.tahunLulus,
      gate: acaraKehadiran.gate,
      metode: acaraKehadiran.metode,
      offline: acaraKehadiran.offline,
      petugas: acaraKehadiran.petugas,
    })
    .from(acaraKehadiran)
    .innerJoin(acaraPeserta, eq(acaraPeserta.id, acaraKehadiran.pesertaId))
    .where(
      gate
        ? and(eq(acaraKehadiran.acaraId, acaraId), eq(acaraKehadiran.gate, gate))
        : eq(acaraKehadiran.acaraId, acaraId),
    )
    .orderBy(desc(sql`coalesce(${acaraKehadiran.clientScannedAt}, ${acaraKehadiran.scannedAt})`))
    .limit(limit);
}

/**
 * The running totals one station's log shows above its table: how many this gate has
 * let in, how many in the last five minutes (is the queue moving?), and the last scan.
 * `gate` null counts every gate, for a coordinator watching the whole door.
 */
export async function ringkasGate(acaraId: string, gate?: string | null) {
  const db = getDb();
  const saat = sql`coalesce(${acaraKehadiran.clientScannedAt}, ${acaraKehadiran.scannedAt})`;
  const [r] = await db
    .select({
      total: sql<number>`count(*)::int`,
      limaMenit: sql<number>`count(*) filter (where ${saat} >= now() - interval '5 minutes')::int`,
      terakhir: sql<Date | null>`max(${saat})`,
    })
    .from(acaraKehadiran)
    .where(
      gate
        ? and(eq(acaraKehadiran.acaraId, acaraId), eq(acaraKehadiran.gate, gate))
        : eq(acaraKehadiran.acaraId, acaraId),
    );
  return {
    total: r?.total ?? 0,
    limaMenit: r?.limaMenit ?? 0,
    terakhir: r?.terakhir ? new Date(r.terakhir) : null,
  };
}

/** How many people the help desk has let in by name, for its running total. */
export async function ringkasBantuan(acaraId: string) {
  const db = getDb();
  const [r] = await db
    .select({
      total: sql<number>`count(*) filter (where ${acaraKehadiran.gate} = 'BANTUAN' and ${acaraKehadiran.metode} = 'nama')::int`,
    })
    .from(acaraKehadiran)
    .where(eq(acaraKehadiran.acaraId, acaraId));
  return { total: r?.total ?? 0 };
}

/**
 * The offline manifest. Four columns only: code, number, first name, gender.
 * Enough to decide whether someone may enter — and a lost phone does not carry a
 * directory of the institute student numbers.
 */
export async function manifesOffline(acaraId: string) {
  const db = getDb();
  const rows = await db
    .select({
      kode: acaraPeserta.kode,
      nomor: acaraPeserta.nomor,
      nama: acaraPeserta.nama,
      gender: acaraPeserta.gender,
      jenis: acaraPeserta.jenis,
      izinOtsAt: acaraPeserta.izinOtsAt,
      urutOts: acaraPeserta.urutOts,
      hadir: sql<boolean>`${acaraKehadiran.pesertaId} is not null`,
    })
    .from(acaraPeserta)
    .leftJoin(acaraKehadiran, eq(acaraKehadiran.pesertaId, acaraPeserta.id))
    .where(
      and(
        eq(acaraPeserta.acaraId, acaraId),
        eq(acaraPeserta.aktif, true),
        // A released seat is a void ticket online; offline it must be too, or a dead
        // network would wave in someone who gave their seat up.
        sql`${acaraPeserta.konfirmasi} is distinct from false`,
      ),
    );
  return rows.map((r) => ({
    k: r.kode,
    n: r.nomor,
    d: r.nama.trim().split(" ")[0],
    g: r.gender === "akhwat" ? "a" : "i",
    // One flag, not the whole status: a phone that goes home must not carry more
    // than the door needs. Without it an offline scanner would wave the whole
    // walk-in queue straight in, which is exactly what the permit exists to prevent.
    w: r.jenis === "ots" && !r.izinOtsAt ? 1 : 0,
    // The queue number, so the refusal card can say which walk-in this is.
    u: r.urutOts ?? undefined,
    // Already through a gate when the list was downloaded: offline, a second scan of
    // that ticket reads "already scanned" instead of a second green.
    h: r.hadir ? 1 : 0,
  }));
}

export async function daftarCetak(acaraId: string) {
  const db = getDb();
  return db
    .select({
      nomor: acaraPeserta.nomor,
      nama: acaraPeserta.nama,
      gender: acaraPeserta.gender,
      statusLipia: acaraPeserta.statusLipia,
      prodi: acaraPeserta.prodi,
      sesi: acaraPeserta.sesi,
      tahunLulus: acaraPeserta.tahunLulus,
      // Someone who released their seat may still turn up. They stay on the paper
      // list so an usher can find them, but must be visibly marked.
      konfirmasi: acaraPeserta.konfirmasi,
    })
    .from(acaraPeserta)
    .where(and(eq(acaraPeserta.acaraId, acaraId), eq(acaraPeserta.aktif, true)))
    .orderBy(asc(acaraPeserta.gender), asc(acaraPeserta.nama));
}

export async function cariUntukBantuan(acaraId: string, q: string) {
  const db = getDb();
  const bersih = q.trim();
  if (bersih.length < 2) return [];
  // Stored as 628…; the desk types 0812… or just the last digits.
  const angka = keAngkaLatin(bersih).replace(/\D/g, "").replace(/^(62|0)/, "");
  const cond =
    angka.length >= 3
      ? sql`(${acaraPeserta.wa} like ${"%" + angka + "%"} or ${acaraPeserta.nomor} ilike ${"%" + bersih + "%"})`
      : sql`${acaraPeserta.nama} ilike ${"%" + bersih + "%"}`;
  return db
    .select({
      id: acaraPeserta.id,
      nomor: acaraPeserta.nomor,
      nama: acaraPeserta.nama,
      gender: acaraPeserta.gender,
      statusLipia: acaraPeserta.statusLipia,
      aktif: acaraPeserta.aktif,
      jenis: acaraPeserta.jenis,
      konfirmasi: acaraPeserta.konfirmasi,
      urutOts: acaraPeserta.urutOts,
      izinOtsAt: acaraPeserta.izinOtsAt,
      scannedAt: acaraKehadiran.scannedAt,
      gate: acaraKehadiran.gate,
    })
    .from(acaraPeserta)
    .leftJoin(acaraKehadiran, eq(acaraKehadiran.pesertaId, acaraPeserta.id))
    .where(and(eq(acaraPeserta.acaraId, acaraId), cond))
    // The number typed in full comes first: "LAT-B-0034" also matches 0340–0349
    // and, by its digits, a dozen WhatsApp numbers, and alphabetical order buried
    // the one person the desk was looking for in the middle of them.
    .orderBy(desc(sql`${acaraPeserta.nomor} ilike ${bersih}`), asc(acaraPeserta.nama))
    .limit(25);
}

/**
 * Every column EXCEPT `kode`.
 *
 * kode is the QR payload. `select()` used to return it, which meant anyone holding
 * EXPORT_TOKEN could mint a working ticket for every participant — while the CSV
 * next to it deliberately left the column out. The nightly pg_dump still has it, so
 * nothing is lost for disaster recovery; it just does not travel over an API.
 */
const KOLOM_PESERTA_EKSPOR = {
  id: acaraPeserta.id,
  acaraId: acaraPeserta.acaraId,
  nomor: acaraPeserta.nomor,
  nama: acaraPeserta.nama,
  gender: acaraPeserta.gender,
  wa: acaraPeserta.wa,
  email: acaraPeserta.email,
  statusLipia: acaraPeserta.statusLipia,
  nim: acaraPeserta.nim,
  prodi: acaraPeserta.prodi,
  sesi: acaraPeserta.sesi,
  semester: acaraPeserta.semester,
  tahunLulus: acaraPeserta.tahunLulus,
  domisili: acaraPeserta.domisili,
  asalDaerah: acaraPeserta.asalDaerah,
  asalSekolah: acaraPeserta.asalSekolah,
  keahlian: acaraPeserta.keahlian,
  transportasi: acaraPeserta.transportasi,
  kebutuhanKhusus: acaraPeserta.kebutuhanKhusus,
  jenis: acaraPeserta.jenis,
  sumber: acaraPeserta.sumber,
  aktif: acaraPeserta.aktif,
  konfirmasi: acaraPeserta.konfirmasi,
  konfirmasiAt: acaraPeserta.konfirmasiAt,
  tiketDibukaAt: acaraPeserta.tiketDibukaAt,
  grupWaAt: acaraPeserta.grupWaAt,
  urutOts: acaraPeserta.urutOts,
  izinOtsAt: acaraPeserta.izinOtsAt,
  catatan: acaraPeserta.catatan,
  createdAt: acaraPeserta.createdAt,
  updatedAt: acaraPeserta.updatedAt,
};

export async function semuaPesertaExport(acaraId: string) {
  return pesertaExportUntuk([acaraId]);
}

export async function semuaKehadiranExport(acaraId: string) {
  return kehadiranExportUntuk([acaraId]);
}

/** The same columns for several programmes in one read — /api/export/semua. */
export async function pesertaExportUntuk(acaraIds: string[]) {
  if (acaraIds.length === 0) return [];
  const db = getDb();
  return db
    .select(KOLOM_PESERTA_EKSPOR)
    .from(acaraPeserta)
    .where(inArray(acaraPeserta.acaraId, acaraIds));
}

export async function kehadiranExportUntuk(acaraIds: string[]) {
  if (acaraIds.length === 0) return [];
  const db = getDb();
  return db.select().from(acaraKehadiran).where(inArray(acaraKehadiran.acaraId, acaraIds));
}

export async function jumlahHadir(acaraId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(acaraKehadiran)
    .where(eq(acaraKehadiran.acaraId, acaraId));
  return row?.n ?? 0;
}

/**
 * Seats taken. Someone who said they cannot come is not occupying one — that is the
 * whole point of letting them say so, and counting them would keep the hall
 * "full" while the room has space.
 */
export async function jumlahPendaftarAktif(acaraId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(acaraPeserta)
    .where(
      and(
        eq(acaraPeserta.acaraId, acaraId),
        eq(acaraPeserta.aktif, true),
        sql`${acaraPeserta.konfirmasi} is distinct from false`,
      ),
    );
  return row?.n ?? 0;
}

/** Active registrations per programme, one query for the admin list. */
export async function jumlahPendaftarPerAcara(): Promise<Map<string, number>> {
  const db = getDb();
  const rows = await db
    .select({ acaraId: acaraPeserta.acaraId, n: sql<number>`count(*)::int` })
    .from(acaraPeserta)
    .where(
      and(
        eq(acaraPeserta.aktif, true),
        sql`${acaraPeserta.konfirmasi} is distinct from false`,
      ),
    )
    .groupBy(acaraPeserta.acaraId);
  return new Map(rows.map((r) => [r.acaraId, r.n]));
}

/** How many released their seat. Shown to the committee next to the waiting list. */
export async function jumlahBatal(acaraId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(acaraPeserta)
    .where(
      and(
        eq(acaraPeserta.acaraId, acaraId),
        eq(acaraPeserta.aktif, true),
        eq(acaraPeserta.konfirmasi, false),
      ),
    );
  return row?.n ?? 0;
}

export async function pesertaDenganTiketDibuka(acaraId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(acaraPeserta)
    .where(and(eq(acaraPeserta.acaraId, acaraId), isNotNull(acaraPeserta.tiketDibukaAt)));
  return row?.n ?? 0;
}

export type FilterPeserta = {
  hadir?: "sudah" | "belum";
  gender?: "ikhwan" | "akhwat";
  jenis?: string;
  batal?: boolean;
  /** true: has not confirmed joining the WhatsApp group. */
  tanpaGrup?: boolean;
  statusLipia?: string;
  prodi?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

function kondisiPeserta(acaraId: string, f: FilterPeserta) {
  const kondisi = [eq(acaraPeserta.acaraId, acaraId), eq(acaraPeserta.aktif, true)];
  if (f.gender) kondisi.push(eq(acaraPeserta.gender, f.gender));
  if (f.jenis) kondisi.push(eq(acaraPeserta.jenis, f.jenis));
  if (f.statusLipia) kondisi.push(eq(acaraPeserta.statusLipia, f.statusLipia));
  if (f.prodi) kondisi.push(eq(acaraPeserta.prodi, f.prodi));
  if (f.q && f.q.trim().length >= 2) {
    const q = f.q.trim();
    // Numbers are stored as 628…; someone types 0812… or +62 812…
    const angka = keAngkaLatin(q).replace(/\D/g, "").replace(/^(62|0)/, "");
    kondisi.push(
      angka.length >= 3
        ? sql`(${acaraPeserta.wa} like ${"%" + angka + "%"} or ${acaraPeserta.nomor} ilike ${"%" + q + "%"})`
        : sql`(${acaraPeserta.nama} ilike ${"%" + q + "%"} or ${acaraPeserta.nomor} ilike ${"%" + q + "%"} or ${acaraPeserta.email} ilike ${"%" + q + "%"})`,
    );
  }
  if (f.batal === true) kondisi.push(eq(acaraPeserta.konfirmasi, false));
  if (f.tanpaGrup === true) kondisi.push(sql`${acaraPeserta.grupWaAt} is null`);
  if (f.hadir === "sudah") kondisi.push(sql`${acaraKehadiran.pesertaId} is not null`);
  if (f.hadir === "belum") kondisi.push(sql`${acaraKehadiran.pesertaId} is null`);
  return and(...kondisi);
}

/**
 * The committee's list view. "Who has not arrived yet" is the question asked at
 * 08:00 with the hall half full, and until now the only answer available was a
 * number on a card — you could see that 300 were missing, but not who.
 *
 * Every answer from the form is in the row, and the list pages instead of stopping at
 * a fixed number: the dashboard is where the data is read, the CSV is for keeping.
 */
export async function daftarPesertaPanel(acaraId: string, f: FilterPeserta = {}) {
  const db = getDb();
  const where = kondisiPeserta(acaraId, f);

  const [hitung] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(acaraPeserta)
    .leftJoin(acaraKehadiran, eq(acaraKehadiran.pesertaId, acaraPeserta.id))
    .where(where);

  const baris = await db
    .select({
      id: acaraPeserta.id,
      nomor: acaraPeserta.nomor,
      nama: acaraPeserta.nama,
      gender: acaraPeserta.gender,
      wa: acaraPeserta.wa,
      email: acaraPeserta.email,
      statusLipia: acaraPeserta.statusLipia,
      prodi: acaraPeserta.prodi,
      semester: acaraPeserta.semester,
      sesi: acaraPeserta.sesi,
      tahunLulus: acaraPeserta.tahunLulus,
      domisili: acaraPeserta.domisili,
      asalDaerah: acaraPeserta.asalDaerah,
      asalSekolah: acaraPeserta.asalSekolah,
      keahlian: acaraPeserta.keahlian,
      transportasi: acaraPeserta.transportasi,
      kebutuhanKhusus: acaraPeserta.kebutuhanKhusus,
      jenis: acaraPeserta.jenis,
      sumber: acaraPeserta.sumber,
      konfirmasi: acaraPeserta.konfirmasi,
      urutOts: acaraPeserta.urutOts,
      izinOtsAt: acaraPeserta.izinOtsAt,
      grupWaAt: acaraPeserta.grupWaAt,
      createdAt: acaraPeserta.createdAt,
      tiketDibukaAt: acaraPeserta.tiketDibukaAt,
      catatan: acaraPeserta.catatan,
      scannedAt: sql<Date | null>`coalesce(${acaraKehadiran.clientScannedAt}, ${acaraKehadiran.scannedAt})`,
      gate: acaraKehadiran.gate,
    })
    .from(acaraPeserta)
    .leftJoin(acaraKehadiran, eq(acaraKehadiran.pesertaId, acaraPeserta.id))
    .where(where)
    /*
     * Walk-ins are shown in queue order, everything else by name. Sorting the queue
     * alphabetically hides the only thing about it that matters — who is next.
     */
    .orderBy(
      f.jenis === "ots" ? asc(acaraPeserta.urutOts) : asc(acaraPeserta.nama),
      asc(acaraPeserta.id),
    )
    .limit(f.limit ?? 100)
    .offset(f.offset ?? 0);

  return { baris, total: hitung?.n ?? 0 };
}

/** One participant with everything recorded about them, for the detail view. */
export async function detailPesertaPanel(acaraId: string, pesertaId: string) {
  const db = getDb();
  const [row] = await db
    .select({ p: acaraPeserta, k: acaraKehadiran })
    .from(acaraPeserta)
    .leftJoin(acaraKehadiran, eq(acaraKehadiran.pesertaId, acaraPeserta.id))
    .where(and(eq(acaraPeserta.acaraId, acaraId), eq(acaraPeserta.id, pesertaId)))
    .limit(1);
  return row ?? null;
}

/** Arrivals per gate — the cheapest way to spot one door jamming. */
export async function hadirPerGate(acaraId: string) {
  const db = getDb();
  return db
    .select({ gate: acaraKehadiran.gate, n: sql<number>`count(*)::int` })
    .from(acaraKehadiran)
    .where(eq(acaraKehadiran.acaraId, acaraId))
    .groupBy(acaraKehadiran.gate)
    .orderBy(asc(acaraKehadiran.gate));
}

/** Rows for lib/acara/statistik.ts: every registration of a programme, answers included. */
export async function barisStatistik(acaraId: string) {
  const db = getDb();
  const rows = await db
    .select({
      gender: acaraPeserta.gender,
      jenis: acaraPeserta.jenis,
      izinOts: sql<boolean>`${acaraPeserta.izinOtsAt} is not null`,
      konfirmasi: acaraPeserta.konfirmasi,
      sumber: acaraPeserta.sumber,
      statusLipia: acaraPeserta.statusLipia,
      prodi: acaraPeserta.prodi,
      semester: acaraPeserta.semester,
      sesi: acaraPeserta.sesi,
      tahunLulus: acaraPeserta.tahunLulus,
      domisili: acaraPeserta.domisili,
      asalDaerah: acaraPeserta.asalDaerah,
      asalSekolah: acaraPeserta.asalSekolah,
      keahlian: acaraPeserta.keahlian,
      transportasi: acaraPeserta.transportasi,
      kebutuhanKhusus: acaraPeserta.kebutuhanKhusus,
      punyaAkun: sql<boolean>`${acaraPeserta.penggunaId} is not null`,
      grupWa: sql<boolean>`${acaraPeserta.grupWaAt} is not null`,
      tiketDibuka: sql<boolean>`${acaraPeserta.tiketDibukaAt} is not null`,
      hadir: sql<boolean>`${acaraKehadiran.pesertaId} is not null`,
      createdAt: acaraPeserta.createdAt,
    })
    .from(acaraPeserta)
    .leftJoin(acaraKehadiran, eq(acaraKehadiran.pesertaId, acaraPeserta.id))
    .where(and(eq(acaraPeserta.acaraId, acaraId), eq(acaraPeserta.aktif, true)));
  return rows;
}
