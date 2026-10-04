import { loadEnvFile } from "./env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { acara, acaraCounter } from "./schema";
import { konfigurasiSsl, tanpaSslmode } from "./index";

loadEnvFile();

/**
 * Seeds one event row and its two counter rows. Idempotent: running it twice
 * updates the copy and never resets a counter, because resetting a counter would
 * hand out numbers that are already printed on someone's screenshot.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const slug = process.env.ACARA_SLUG ?? "student-lecture";

  const ssl = konfigurasiSsl();
  const pool = new Pool({
    connectionString: ssl ? tanpaSslmode(url) : url,
    max: 1,
    ...(ssl ? { ssl } : {}),
  });
  const db = drizzle(pool);

  const isian = {
    slug,
    nama: "Open Lecture",
    namaAr: "لقاء مفتوح",
    judul: "How to Learn and Grow at the institute",
    judulAr: "طرق النجاح في الدراسة بالمعهد",
    jenis: "acara",
    pakaiTiket: true,
    tampil: true,
    urutan: 0,
    deskripsi: null,
    deskripsiAr: null,
    pemateri: "Dr. Sample Speaker (may Allah protect him)",
    pemateriAr: "الدكتور متحدث تجريبي – حفظه الله تعالى –",
    tanggal: "2026-09-20",
    waktuMulai: "07:30:00",
    waktuWajibTiba: "07:30:00",
    waktuSelesai: "12:00:00",
    lokasi: "Masjid Darsyafii",
    lokasiAr: "مسجد دار الشافعي",
    alamat:
      "Jl. Buncit Raya No. Kav. 100, RT.1/RW.7, Pejaten Barat, Pasar Minggu, South Jakarta 12510",
    alamatAr:
      "جالان بونتشيت رايا رقم ١٠٠، بيجاتين بارات، باسار مينجو، جاكرتا الجنوبية ١٢٥١٠",
    // Google Maps place "Darsyafii Islamic School" (Jl. Buncit Raya Kav. 100,
    // -6.2780794, 106.8291513). The cid link opens that exact listing in the app;
    // the embed is the keyless "output=embed" form, centred on the same pin.
    petaUrl: "https://maps.google.com/?cid=1521128374685893743",
    petaEmbedUrl:
      "https://maps.google.com/maps?q=Darsyafii+Islamic+School,+Jl.+Buncit+Raya+No.Kav.+100,+Pejaten+Barat,+Jakarta&ll=-6.2780794,106.8291513&z=16&output=embed",
    tatibUrl: null,
    agenda: [
      { jam: "07:30", en: "Gate opens", ar: "فتح البوابة" },
      { jam: "09:00", en: "'Ilm session", ar: "الجلسة العلمية" },
    ],
    gateIkhwan: "north gate",
    gateAkhwat: "south gate",
    kuota: 1000,
    kuotaIkhwan: 400,
    kuotaAkhwat: 600,
    prefiksNomor: "the institute",
    status: "pendaftaran",
  };

  const [ada] = await db.select().from(acara).where(eq(acara.slug, slug)).limit(1);

  /*
   * `--jika-kosong`: the deploy pipeline's mode. It only ever creates the event on
   * an empty database; once the row exists the committee edits it from /admin, and
   * a deploy must not quietly put the seed copy back over their changes.
   */
  const hanyaJikaKosong = process.argv.includes("--jika-kosong");
  if (ada && hanyaJikaKosong) {
    console.log(`event exists: ${slug} (left untouched)`);
    await pool.end();
    return;
  }

  let id: string;
  if (ada) {
    /*
     * Copy is refreshed; status, visibility and ordering are NOT.
     *
     * If the committee closed registration because the hall filled up, anyone
     * re-running the seed would put the public form back online without meaning to.
     * The same goes for a programme the committee hid from the public list, and for
     * the position they dragged it to on the landing page — with several programmes
     * listed, resetting `urutan` to 0 quietly reorders all of them. `posterUrl` is
     * not in the seed at all for the same reason: a poster set from /admin must
     * survive a re-run. All of these are changed from /admin, deliberately, and
     * nowhere else.
     */
    const { status: _abaikan, tampil: _abaikanJuga, urutan: _abaikanPula, ...tanpaStatus } = isian;
    const [row] = await db
      .update(acara)
      .set({ ...tanpaStatus, updatedAt: new Date() })
      .where(eq(acara.id, ada.id))
      .returning({ id: acara.id });
    id = row.id;
    console.log(`event updated: ${slug} (status left at "${ada.status}")`);
  } else {
    const [row] = await db.insert(acara).values(isian).returning({ id: acara.id });
    id = row.id;
    console.log(`event created: ${slug}`);
  }

  await db
    .insert(acaraCounter)
    .values([
      { acaraId: id, gender: "ikhwan", terakhir: 0 },
      { acaraId: id, gender: "akhwat", terakhir: 0 },
    ])
    .onConflictDoNothing();

  await pool.end();
  console.log("seed done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
