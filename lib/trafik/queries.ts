import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { HALAMAN_KETUK_MINAT } from "./klasifikasi";

/*
 * Traffic figures for the dashboard. All days and hours are WIB. A "visitor" is one
 * browser on one day (see the `kunjungan` table), so a range of several days counts
 * a returning student once per day they came back — said on the page.
 */

const WIB = sql.raw(`'Asia/Jakarta'`);

// Taps on an interest button share the table but are not page views.
const BUKAN_KETUK = sql.raw(`halaman <> '${HALAMAN_KETUK_MINAT}'`);

type Baris<T> = T & Record<string, unknown>;

async function jalankan<T>(q: ReturnType<typeof sql>): Promise<Baris<T>[]> {
  const hasil = await getDb().execute(q);
  return hasil.rows as Baris<T>[];
}

export async function ringkasanTrafik(sejak: Date) {
  const [angka] = await jalankan<{ tayang: number; pengunjung: number }>(sql`
    select count(*)::int as tayang, count(distinct pengunjung)::int as pengunjung
      from kunjungan where ${BUKAN_KETUK} and created_at >= ${sejak}
  `);
  const [aktif] = await jalankan<{ n: number }>(sql`
    select count(distinct pengunjung)::int as n
      from kunjungan where ${BUKAN_KETUK} and created_at >= now() - interval '5 minutes'
  `);
  const [hariIni] = await jalankan<{ tayang: number; pengunjung: number }>(sql`
    select count(*)::int as tayang, count(distinct pengunjung)::int as pengunjung
      from kunjungan
     where ${BUKAN_KETUK} and (created_at at time zone ${WIB})::date = (now() at time zone ${WIB})::date
  `);
  return {
    tayang: angka?.tayang ?? 0,
    pengunjung: angka?.pengunjung ?? 0,
    aktif: aktif?.n ?? 0,
    tayangHariIni: hariIni?.tayang ?? 0,
    pengunjungHariIni: hariIni?.pengunjung ?? 0,
  };
}

export async function trafikPerHari(sejak: Date) {
  return jalankan<{ tanggal: string; tayang: number; pengunjung: number }>(sql`
    select to_char((created_at at time zone ${WIB})::date, 'YYYY-MM-DD') as tanggal,
           count(*)::int as tayang,
           count(distinct pengunjung)::int as pengunjung
      from kunjungan where ${BUKAN_KETUK} and created_at >= ${sejak}
     group by 1 order by 1
  `);
}

/** Today by hour — when to post the next broadcast. */
export async function trafikPerJamHariIni() {
  return jalankan<{ jam: number; tayang: number; pengunjung: number }>(sql`
    select extract(hour from created_at at time zone ${WIB})::int as jam,
           count(*)::int as tayang,
           count(distinct pengunjung)::int as pengunjung
      from kunjungan
     where ${BUKAN_KETUK} and (created_at at time zone ${WIB})::date = (now() at time zone ${WIB})::date
     group by 1 order by 1
  `);
}

/** Grouped by one column, counting visitors (not views) so a reload does not inflate it. */
export async function trafikMenurut(kolom: "halaman" | "perangkat" | "lang", sejak: Date) {
  const k = sql.raw(kolom);
  return jalankan<{ kunci: string | null; pengunjung: number; tayang: number }>(sql`
    select ${k} as kunci, count(distinct pengunjung)::int as pengunjung, count(*)::int as tayang
      from kunjungan where ${BUKAN_KETUK} and created_at >= ${sejak}
     group by 1 order by pengunjung desc
  `);
}

/**
 * Where visitors came from, by the first page each of them opened that day. Later
 * pages keep the original referrer in the browser, and counting them again would
 * credit WhatsApp with every click inside the site.
 */
export async function trafikSumber(sejak: Date) {
  return jalankan<{ kunci: string; pengunjung: number }>(sql`
    select sumber as kunci, count(*)::int as pengunjung
      from (
        select distinct on (pengunjung) pengunjung, sumber
          from kunjungan where ${BUKAN_KETUK} and created_at >= ${sejak}
         order by pengunjung, created_at
      ) pertama
     group by 1 order by 2 desc
  `);
}

/**
 * The registration funnel for one programme: people who saw it, opened the form,
 * and actually registered. The home page counts as seeing it — it shows the current
 * programme in full.
 */
export async function corongPendaftaran(acaraId: string, slug: string, sejakDiminta: Date) {
  // Visits are only counted from the day this was switched on. Registrations before
  // that would make "registered" outnumber "saw the programme" for no real reason.
  const [mulai] = await jalankan<{ awal: Date | string | null }>(sql`select min(created_at) as awal from kunjungan`);
  const awalCatat = mulai?.awal ? new Date(mulai.awal) : null;
  const sejak = awalCatat && awalCatat > sejakDiminta ? awalCatat : sejakDiminta;
  const [lihat] = await jalankan<{ n: number }>(sql`
    select count(distinct pengunjung)::int as n from kunjungan
     where ${BUKAN_KETUK} and created_at >= ${sejak}
       and (halaman = 'beranda' or (halaman = 'program' and slug = ${slug}))
  `);
  const [formulir] = await jalankan<{ n: number }>(sql`
    select count(distinct pengunjung)::int as n from kunjungan
     where ${BUKAN_KETUK} and created_at >= ${sejak} and halaman = 'formulir' and (slug = ${slug} or slug is null)
  `);
  const [daftar] = await jalankan<{ n: number }>(sql`
    select count(*)::int as n from acara_peserta
     where acara_id = ${acaraId} and sumber = 'web' and created_at >= ${sejak}
  `);
  const [tiket] = await jalankan<{ n: number }>(sql`
    select count(distinct pengunjung)::int as n from kunjungan
     where ${BUKAN_KETUK} and created_at >= ${sejak} and halaman in ('tiket', 'cari-tiket')
  `);
  return { lihat: lihat?.n ?? 0, formulir: formulir?.n ?? 0, daftar: daftar?.n ?? 0, tiket: tiket?.n ?? 0, sejak };
}

/**
 * The Programme Hub funnel per button key: distinct visitors who opened the page it lives
 * on, who tapped it (guests included — their tap ends on the sign-in page), and the
 * accounts actually recorded. "semua" lives on the /hub index. Visitors
 * are per day, like every figure here.
 */
export async function corongHub(sejak: Date) {
  const lihat = await jalankan<{ kunci: string | null; n: number }>(sql`
    select slug as kunci, count(distinct pengunjung)::int as n from kunjungan
     where created_at >= ${sejak} and halaman = 'hub'
     group by 1
  `);
  const ketuk = await jalankan<{ kunci: string; n: number }>(sql`
    select slug as kunci, count(distinct pengunjung)::int as n from kunjungan
     where created_at >= ${sejak} and halaman = ${HALAMAN_KETUK_MINAT}
     group by 1
  `);
  const [beranda] = await jalankan<{ n: number }>(sql`
    select count(distinct pengunjung)::int as n from kunjungan
     where created_at >= ${sejak} and halaman = 'beranda'
  `);
  const [sumber] = await jalankan<{ rows: { kunci: string; n: number }[] | null }>(sql`
    select json_agg(x order by x.n desc) as rows from (
      select sumber as kunci, count(distinct pengunjung)::int as n from kunjungan
       where created_at >= ${sejak} and halaman = 'hub'
       group by 1
    ) x
  `);
  return {
    beranda: beranda?.n ?? 0,
    lihat: Object.fromEntries(lihat.map((r) => [r.kunci ?? "index", r.n])) as Record<string, number>,
    ketuk: Object.fromEntries(ketuk.map((r) => [r.kunci, r.n])) as Record<string, number>,
    sumber: sumber?.rows ?? [],
  };
}

/**
 * The lecture notes and the quiz of one programme: who read, who opened which
 * question, and who actually answered. Views come from `kunjungan`, answers from
 * `kuis_jawaban` — a visitor is a browser per day, an answer is an account, so the
 * two are shown side by side rather than as one funnel.
 */
export async function trafikCatatanKuis(slug: string, sejak: Date) {
  const [bagian, perSoal, perSesi, jawab, sumber, perHari, [kuis]] = await Promise.all([
    jalankan<{ kunci: string; pengunjung: number; tayang: number }>(sql`
      select case
               when halaman = 'artikel' then 'artikel'
               when path ~ '/quiz/papan$' then 'papan'
               when path ~ '/quiz/sertifikat$' then 'sertifikat'
               when path ~ '/quiz/([0-9]+|sesi/[0-9]+)$' then 'soal'
               else 'kuis'
             end as kunci,
             count(distinct pengunjung)::int as pengunjung, count(*)::int as tayang
        from kunjungan
       where created_at >= ${sejak} and slug = ${slug} and halaman in ('artikel', 'kuis')
       group by 1
    `),
    jalankan<{ nomor: number; pengunjung: number }>(sql`
      select substring(path from '/quiz/([0-9]+)$')::int as nomor, count(distinct pengunjung)::int as pengunjung
        from kunjungan
       where created_at >= ${sejak} and slug = ${slug} and halaman = 'kuis' and path ~ '/quiz/[0-9]+$'
       group by 1
    `),
    // A batch's page carries all of its questions; counted per batch, not per question.
    jalankan<{ sesi: number; pengunjung: number }>(sql`
      select substring(path from '/quiz/sesi/([0-9]+)$')::int as sesi, count(distinct pengunjung)::int as pengunjung
        from kunjungan
       where created_at >= ${sejak} and slug = ${slug} and halaman = 'kuis' and path ~ '/quiz/sesi/[0-9]+$'
       group by 1
    `),
    jalankan<{ nomor: number | null; jawaban: number; akun: number }>(sql`
      select nomor, count(*)::int as jawaban, count(distinct pengguna_id)::int as akun
        from kuis_jawaban where slug = ${slug} and created_at >= ${sejak}
       group by grouping sets ((nomor), ())
    `),
    jalankan<{ kunci: string; pengunjung: number }>(sql`
      select sumber as kunci, count(distinct pengunjung)::int as pengunjung
        from kunjungan
       where created_at >= ${sejak} and slug = ${slug} and halaman in ('artikel', 'kuis')
       group by 1 order by 2 desc
    `),
    jalankan<{ tanggal: string; artikel: number; kuis: number }>(sql`
      select to_char((created_at at time zone ${WIB})::date, 'YYYY-MM-DD') as tanggal,
             count(distinct pengunjung) filter (where halaman = 'artikel')::int as artikel,
             count(distinct pengunjung) filter (where halaman = 'kuis')::int as kuis
        from kunjungan
       where created_at >= ${sejak} and slug = ${slug} and halaman in ('artikel', 'kuis')
       group by 1 order by 1
    `),
    jalankan<{ n: number }>(sql`
      select count(distinct pengunjung)::int as n
        from kunjungan where created_at >= ${sejak} and slug = ${slug} and halaman = 'kuis'
    `),
  ]);
  const semua = jawab.find((j) => j.nomor === null);
  return {
    bagian: Object.fromEntries(bagian.map((b) => [b.kunci, b])) as Record<string, { pengunjung: number; tayang: number }>,
    pengunjungSoal: new Map(perSoal.map((s) => [Number(s.nomor), s.pengunjung])),
    pengunjungSesi: new Map(perSesi.map((s) => [Number(s.sesi), s.pengunjung])),
    jawabanSoal: new Map(jawab.filter((j) => j.nomor !== null).map((j) => [Number(j.nomor), j.jawaban])),
    // Any quiz page, each visitor once — the per-page figures above overlap.
    pengunjungKuis: kuis?.n ?? 0,
    penjawab: semua?.akun ?? 0,
    jawaban: semua?.jawaban ?? 0,
    sumber,
    perHari,
  };
}
