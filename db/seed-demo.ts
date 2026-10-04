/**
 * Demo seed — the only data this deployment ever holds.
 *
 * Everything is invented: names are drawn from fixed lists, every WhatsApp number
 * sits in a reserved test range (62899…), and the organiser is a placeholder. No
 * row here comes from production, and nothing in this file should ever be pointed
 * at a database that does.
 *
 * It is deliberately deterministic — the same pseudo-random seed every run — so a
 * nightly reset reproduces the same screenshots, and anything a visitor changed
 * during the day disappears without the demo looking different tomorrow.
 *
 * Entry points: `pnpm tsx db/seed-demo.ts` locally, or POST /api/demo/reset.
 */
import { randomUUID, randomBytes } from "node:crypto";
import { getDb } from "./index";
import { sql } from "drizzle-orm";

const SLUG = "open-lecture";

const DEPAN_IKHWAN = ["Adam","Bilal","Dawud","Faris","Hakim","Idris","Jamil","Karim","Luqman","Munir","Nadir","Rafi","Sami","Tariq","Wasim","Yasin","Zahir","Amir","Basim","Hadi"];
const DEPAN_AKHWAT = ["Aisha","Buthayna","Dalia","Farida","Hana","Inas","Jamila","Karima","Layla","Maryam","Nadia","Rania","Salma","Thuraya","Wafa","Yusra","Zaynab","Amina","Bushra","Hiba"];
const BELAKANG = ["Abdallah","Haddad","Jabari","Khalidi","Mansour","Najjar","Qureshi","Rahmani","Siddiqui","Tamimi","Wahbi","Younes","Zaidan","Barakat","Fahmy"];
const PRODI = ["Arabic Language","Islamic Law","Qur'anic Studies","Preparatory"];
const SEMESTER = ["1","3","5","7"];
const KOTA = ["Jakarta","Bandung","Surabaya","Medan","Makassar","Yogyakarta","Semarang","Palembang"];

function pengacak(benih: number) {
  let s = benih;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export async function seedDemo(): Promise<{ peserta: number; hadir: number }> {
  const db = getDb();
  const acak = pengacak(20260101);
  const pilih = <T,>(xs: readonly T[]): T => xs[Math.floor(acak() * xs.length)];

  // Start clean. Cascades take the participants, counters and attendance with it.
  await db.execute(sql`delete from acara where slug = ${SLUG}`);

  const id = randomUUID();
  await db.execute(sql`
    insert into acara (
      id, slug, nama, nama_ar, judul, judul_ar, pemateri, pemateri_ar, penyelenggara,
      tanggal, waktu_mulai, waktu_wajib_tiba, waktu_selesai,
      lokasi, lokasi_ar, alamat, alamat_ar,
      jenis, pakai_tiket, tampil, urutan, agenda,
      gate_ikhwan, gate_akhwat, kuota, kuota_ikhwan, kuota_akhwat, prefiks_nomor, status
    ) values (
      ${id}, ${SLUG}, 'Open Lecture', 'لقاء مفتوح',
      'Learning Arabic as an Adult', 'تعلم العربية في سن الرشد',
      'Dr. Sample Speaker', 'الدكتور متحدث تجريبي',
      'Tilawa Labs',
      ${new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString().slice(0, 10)},
      '07:30:00', '07:30:00', '12:00:00',
      'Demo Hall', 'القاعة التجريبية',
      '123 Example Street, Jakarta', '١٢٣ شارع المثال، جاكرتا',
      'acara', true, true, 0,
      ${JSON.stringify([
        { jam: "07:30", en: "Gate opens", ar: "فتح البوابة" },
        { jam: "08:00", en: "Opening", ar: "الافتتاح" },
        { jam: "09:00", en: "Main session", ar: "الجلسة الرئيسية" },
        { jam: "11:00", en: "Questions", ar: "الأسئلة" },
      ])}::jsonb,
      'north gate', 'south gate', 400, 200, 200, 'DEMO', 'pendaftaran'
    )`);

  await db.execute(sql`
    insert into acara_counter (acara_id, gender, terakhir, terakhir_ots)
    values (${id}, 'ikhwan', 0, 0), (${id}, 'akhwat', 0, 0)`);

  /*
   * 148 registrations with roughly 62% already scanned in. The proportion matters:
   * a demo where everyone has arrived shows an empty gate screen, and one where
   * nobody has shows empty charts. This leaves both with something true to render.
   */
  const TOTAL = 148;
  let nIkhwan = 0;
  let nAkhwat = 0;

  for (let i = 0; i < TOTAL; i += 1) {
    const ikhwan = acak() < 0.46;
    const nama = `${pilih(ikhwan ? DEPAN_IKHWAN : DEPAN_AKHWAT)} ${pilih(BELAKANG)}`;
    const urut = ikhwan ? (nIkhwan += 1) : (nAkhwat += 1);
    const nomor = `DEMO-${ikhwan ? "I" : "A"}${String(urut).padStart(3, "0")}`;
    const wa = `6289900${String(100000 + i).slice(-6)}`;
    const pid = randomUUID();
    const jamLalu = String(Math.floor(acak() * 240));
    /*
     * Most registrants open their ticket; the dashboard turns that ratio red when
     * it is low, and an empty column made the demo open on a false alarm. Not all
     * of them, though — the "still to come" list is a real part of the screen.
     */
    const bukaTiket = acak() < 0.86;

    await db.execute(sql`
      insert into acara_peserta (
        id, acara_id, nomor, kode, nama, gender, wa, lipia,
        status_lipia, nim, prodi, semester, domisili,
        jenis, sumber, aktif, grup_wa_at, tiket_dibuka_at, created_at
      ) values (
        ${pid}, ${id}, ${nomor}, ${randomBytes(9).toString("base64url")},
        ${nama}, ${ikhwan ? "ikhwan" : "akhwat"}, ${wa}, true,
        'aktif', ${`2026${1000 + i}`}, ${pilih(PRODI)}, ${pilih(SEMESTER)}, ${pilih(KOTA)},
        'pra', 'web', true, now(),
        ${bukaTiket ? sql`now() - (${jamLalu} || ' hours')::interval` : sql`null`},
        now() - (${jamLalu} || ' hours')::interval
      )`);

    if (acak() < 0.62) {
      const menitLalu = String(Math.floor(acak() * 150));
      await db.execute(sql`
        insert into acara_kehadiran (peserta_id, acara_id, scanned_at, client_scanned_at, gate)
        values (
          ${pid}, ${id},
          now() - (${menitLalu} || ' minutes')::interval,
          now() - (${menitLalu} || ' minutes')::interval,
          ${ikhwan ? "north gate" : "south gate"}
        )`);
    }
  }

  await db.execute(sql`update acara_counter set terakhir = ${nIkhwan} where acara_id = ${id} and gender = 'ikhwan'`);
  await db.execute(sql`update acara_counter set terakhir = ${nAkhwat} where acara_id = ${id} and gender = 'akhwat'`);

  const hadir = await db.execute(sql`select count(*)::int as n from acara_kehadiran where acara_id = ${id}`);
  return { peserta: TOTAL, hadir: Number((hadir.rows[0] as { n: number }).n) };
}

// Running the file directly seeds once and exits.
if (process.argv[1]?.endsWith("seed-demo.ts")) {
  seedDemo()
    .then((r) => {
      console.log(`demo seeded: ${r.peserta} participants, ${r.hadir} scanned in`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
