import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { acara, acaraCounter, acaraKehadiran, acaraPeserta } from "@/db/schema";
import {
  KUOTA_LATIHAN,
  PREFIKS_LATIHAN,
  SLUG_LATIHAN,
  TANGGAL_LATIHAN,
  pesertaLatihan,
} from "./data";

/**
 * Creates the practice programme if it is missing, then puts it back exactly where a
 * drill starts: the 1,000 participants in their scenarios, twenty already scanned,
 * the walk-in queue unpermitted, event-day status. Whatever the last drill did —
 * scans, permits, released seats — is wiped. Touches no other programme.
 */
export async function resetLatihan(): Promise<{ peserta: number }> {
  const db = getDb();
  const semua = pesertaLatihan();
  const sekarang = new Date();

  await db.transaction(async (tx) => {
    const nilaiAcara = {
      nama: "Latihan Scan (data dummy)",
      tanggal: TANGGAL_LATIHAN,
      waktuMulai: "07:30:00",
      waktuWajibTiba: "07:00:00",
      waktuSelesai: "12:00:00",
      lokasi: "Latihan",
      kuota: KUOTA_LATIHAN.ikhwan + KUOTA_LATIHAN.akhwat,
      kuotaIkhwan: KUOTA_LATIHAN.ikhwan,
      kuotaAkhwat: KUOTA_LATIHAN.akhwat,
      otsBuka: true,
      status: "berlangsung",
      tampil: false,
      waGrupIkhwan: null,
      waGrupAkhwat: null,
      updatedAt: sekarang,
    };
    let [ev] = await tx.select({ id: acara.id }).from(acara).where(eq(acara.slug, SLUG_LATIHAN)).limit(1);
    if (ev) {
      await tx.update(acara).set(nilaiAcara).where(eq(acara.id, ev.id));
    } else {
      [ev] = await tx
        .insert(acara)
        .values({ slug: SLUG_LATIHAN, prefiksNomor: PREFIKS_LATIHAN, ...nilaiAcara })
        .returning({ id: acara.id });
    }

    await tx.delete(acaraKehadiran).where(eq(acaraKehadiran.acaraId, ev.id));
    await tx.delete(acaraPeserta).where(eq(acaraPeserta.acaraId, ev.id));
    await tx.delete(acaraCounter).where(eq(acaraCounter.acaraId, ev.id));

    // Registered over the past two weeks, in number order, so the dashboard's
    // daily chart and the walk-in queue look like a real run.
    const awal = sekarang.getTime() - 14 * 24 * 60 * 60 * 1000;
    const langkah = (14 * 24 * 60 * 60 * 1000) / semua.length;
    const urutOts = { ikhwan: 0, akhwat: 0 };
    const baris = semua.map((p) => {
      const dibuat = new Date(awal + p.urut * langkah);
      return {
        acaraId: ev.id,
        nomor: p.nomor,
        kode: p.kode,
        nama: p.nama,
        gender: p.gender,
        wa: p.wa,
        statusLipia: p.statusLipia,
        jenis: p.skenario === "ots" ? "ots" : "pra",
        urutOts: p.skenario === "ots" ? ++urutOts[p.gender] : null,
        sumber: "impor",
        aktif: p.skenario !== "nonaktif",
        konfirmasi: p.skenario === "lepas" ? false : null,
        konfirmasiAt: p.skenario === "lepas" ? sekarang : null,
        grupWaAt: dibuat,
        // Most people open their ticket before the day; the dashboard warns when few do.
        tiketDibukaAt: p.urut % 10 === 0 ? null : dibuat,
        catatan: p.skenario === "nonaktif" ? "Latihan: dinonaktifkan panitia" : null,
        createdAt: dibuat,
        updatedAt: dibuat,
      };
    });
    const idPerKode = new Map<string, string>();
    for (let i = 0; i < baris.length; i += 250) {
      const masuk = await tx
        .insert(acaraPeserta)
        .values(baris.slice(i, i + 250))
        .returning({ id: acaraPeserta.id, kode: acaraPeserta.kode });
      for (const m of masuk) idPerKode.set(m.kode, m.id);
    }

    const sudah = semua.filter((p) => p.skenario === "sudah");
    await tx.insert(acaraKehadiran).values(
      sudah.map((p, i) => ({
        pesertaId: idPerKode.get(p.kode)!,
        acaraId: ev.id,
        scannedAt: new Date(sekarang.getTime() - (sudah.length - i) * 60 * 1000),
        gate: p.gender === "ikhwan" ? "IKH-1" : "AKH-1",
        petugas: "Latihan (sudah masuk)",
        metode: "qr",
      })),
    );

    await tx.insert(acaraCounter).values([
      { acaraId: ev.id, gender: "ikhwan", terakhir: semua.filter((p) => p.gender === "ikhwan").length, terakhirOts: urutOts.ikhwan },
      { acaraId: ev.id, gender: "akhwat", terakhir: semua.filter((p) => p.gender === "akhwat").length, terakhirOts: urutOts.akhwat },
    ]);
  });

  return { peserta: semua.length };
}

/** Removes the practice programme and everything in it. */
export async function hapusLatihan(): Promise<boolean> {
  const db = getDb();
  const hapus = await db.delete(acara).where(eq(acara.slug, SLUG_LATIHAN)).returning({ id: acara.id });
  return hapus.length > 0;
}
