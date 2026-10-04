import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { loadEnvFile } from "@/db/env";
import { getDb } from "@/db";
import { acara, acaraCounter, acaraKehadiran, acaraPeserta } from "@/db/schema";
import { ambilKembaliKursi, daftarPeserta, syaratKursiTerpakai } from "./daftar";
import { antreanOts, izinkanOts, izinkanSemuaOts, jumlahOtsMenunggu } from "./ots";
import { catatKehadiran, catatKehadiranLangsung } from "@/lib/kehadiran/catat";

loadEnvFile();

const SLUG = `test-${Math.random().toString(36).slice(2, 10)}`;

beforeAll(async () => {
  process.env.AUTH_SECRET ??= "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaa";
  const db = getDb();
  const [ev] = await db
    .insert(acara)
    .values({
      slug: SLUG,
      nama: "Test Event",
      tanggal: "2026-09-20",
      prefiksNomor: "TST",
      status: "pendaftaran",
      otsBuka: true,
    })
    .returning();
  await db.insert(acaraCounter).values([
    { acaraId: ev.id, gender: "ikhwan", terakhir: 0 },
    { acaraId: ev.id, gender: "akhwat", terakhir: 0 },
  ]);
});

afterAll(async () => {
  const db = getDb();
  await db.delete(acara).where(eq(acara.slug, SLUG));
});

async function idAcara(): Promise<string> {
  const db = getDb();
  const [ev] = await db.select().from(acara).where(eq(acara.slug, SLUG)).limit(1);
  return ev.id;
}

/** Seats taken the way registration counts them: online seats held, plus walk-ins let in. */
async function kursiTerpakai(gender: "ikhwan" | "akhwat" | null = null): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(acaraPeserta)
    .where(syaratKursiTerpakai(await idAcara(), gender));
  return row.n;
}

/**
 * Test 2 of the six, and the most important one. A broadcast to a thousand
 * students means dozens of simultaneous submissions in a single minute.
 */
describe("concurrent registration", () => {
  it("gives 200 simultaneous registrations 200 distinct numbers", async () => {
    const N = 200;
    const hasil = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        daftarPeserta(
          SLUG,
          {
            nama: `Peserta Serentak ${i}`,
            gender: i % 2 === 0 ? "ikhwan" : "akhwat",
            wa: `08${String(1_000_000_00 + i).padStart(10, "0")}`,
          },
          { sumber: "web" },
        ),
      ),
    );

    const sukses = hasil.filter((h) => h.ok);
    expect(sukses).toHaveLength(N);

    const nomor = sukses.map((h) => (h as { peserta: { nomor: string } }).peserta.nomor);
    expect(new Set(nomor).size).toBe(N);

    const kode = sukses.map((h) => (h as { peserta: { kode: string } }).peserta.kode);
    expect(new Set(kode).size).toBe(N);

    // No gaps either — a gap sends the committee looking for a lost registration.
    const db = getDb();
    const id = await idAcara();
    const [ctr] = await db
      .select()
      .from(acaraCounter)
      .where(and(eq(acaraCounter.acaraId, id), eq(acaraCounter.gender, "ikhwan")));
    expect(ctr.terakhir).toBe(N / 2);

    const angka = nomor
      .filter((n) => n.includes("-B-"))
      .map((n) => Number(n.split("-").pop()))
      .sort((a, b) => a - b);
    expect(angka).toEqual(Array.from({ length: N / 2 }, (_, i) => i + 1));
  });
});

describe("daftarPeserta rules", () => {
  it("answers an already-registered number kindly, not with an error row", async () => {
    const wa = "081299900001";
    const a = await daftarPeserta(SLUG, { nama: "Dua Kali", gender: "ikhwan", wa }, { sumber: "web" });
    expect(a.ok).toBe(true);

    const b = await daftarPeserta(SLUG, { nama: "Dua Kali", gender: "ikhwan", wa }, { sumber: "web" });
    expect(b.ok).toBe(false);
    if (!b.ok) {
      expect(b.alasan).toBe("sudah_terdaftar");
      expect(b.peserta?.nomor).toBe((a as { peserta: { nomor: string } }).peserta.nomor);
    }
  });

  it("rejects a number it cannot normalise", async () => {
    const r = await daftarPeserta(
      SLUG,
      { nama: "Salah Nomor", gender: "ikhwan", wa: "not-a-number" },
      { sumber: "web" },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.alasan).toBe("wa_tidak_valid");
  });

  it("keeps both rows when a NIM clashes with a different number, and flags it", async () => {
    await daftarPeserta(
      SLUG,
      { nama: "Nim Satu", gender: "ikhwan", wa: "081299900002", nim: "2231041" },
      { sumber: "web" },
    );
    const kedua = await daftarPeserta(
      SLUG,
      { nama: "Nim Dua", gender: "ikhwan", wa: "081299900003", nim: "2231041" },
      { sumber: "web" },
    );
    expect(kedua.ok).toBe(true);
    if (kedua.ok) expect(kedua.peserta.catatan).toContain("NIM clash");
  });

  it("closes the door from status, not from a date comparison", async () => {
    const db = getDb();
    const id = await idAcara();
    await db.update(acara).set({ status: "ditutup" }).where(eq(acara.id, id));
    const r = await daftarPeserta(
      SLUG,
      { nama: "Terlambat", gender: "ikhwan", wa: "081299900004" },
      { sumber: "web" },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.alasan).toBe("tutup");
    await db.update(acara).set({ status: "pendaftaran" }).where(eq(acara.id, id));
  });
});

/**
 * A thousand-seat hall must not silently issue seat 1,200. Nobody is turned away —
 * the committee decides who gets in — but past the quota the registration has to be
 * marked as a waiting-list place so the ticket can say so.
 */
describe("quota", () => {
  it("refuses a registration past the quota, and takes it again once the quota is raised", async () => {
    const db = getDb();
    const id = await idAcara();

    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(acaraPeserta)
      .where(and(eq(acaraPeserta.acaraId, id), eq(acaraPeserta.aktif, true)));

    // Quota set to exactly what is already there: the next one is refused.
    await db.update(acara).set({ kuota: n }).where(eq(acara.id, id));

    const lewat = await daftarPeserta(
      SLUG,
      { nama: "Kuota Lewat", gender: "ikhwan", wa: "081266600001" },
      { sumber: "web" },
    );
    expect(lewat.ok).toBe(false);
    if (!lewat.ok) expect(lewat.alasan).toBe("penuh");
    // Refused means no row at all, not a ticket that says "no".
    const tidakAda = await db
      .select({ id: acaraPeserta.id })
      .from(acaraPeserta)
      .where(and(eq(acaraPeserta.acaraId, id), eq(acaraPeserta.wa, "6281266600001")));
    expect(tidakAda).toHaveLength(0);

    // Raise the quota and the next one is an ordinary seat again.
    await db.update(acara).set({ kuota: n + 100 }).where(eq(acara.id, id));
    const muat = await daftarPeserta(
      SLUG,
      { nama: "Kuota Muat", gender: "ikhwan", wa: "081266600002" },
      { sumber: "web" },
    );
    expect(muat.ok).toBe(true);
    if (muat.ok) expect(muat.peserta.jenis).toBe("pra");

    // The walk-in link takes no seat, so a full hall does not stop it: a queue
    // number and no permit.
    await db.update(acara).set({ kuota: 1 }).where(eq(acara.id, id));
    const ots = await daftarPeserta(
      SLUG,
      { nama: "Kuota Ots", gender: "akhwat", wa: "081266600003" },
      { sumber: "web", jenis: "ots" },
    );
    expect(ots.ok).toBe(true);
    if (ots.ok) {
      expect(ots.peserta.jenis).toBe("ots");
      expect(ots.peserta.urutOts).toBeGreaterThan(0);
      expect(ots.peserta.izinOtsAt).toBeNull();
    }

    // The link closed: the same registration is refused as "closed".
    await db.update(acara).set({ otsBuka: false }).where(eq(acara.id, id));
    const tutup = await daftarPeserta(
      SLUG,
      { nama: "Ots Tutup", gender: "akhwat", wa: "081266600004" },
      { sumber: "web", jenis: "ots" },
    );
    expect(tutup.ok).toBe(false);
    if (!tutup.ok) expect(tutup.alasan).toBe("tutup");

    await db.update(acara).set({ kuota: null, otsBuka: true }).where(eq(acara.id, id));
  });
});

/**
 * Test 3 of the six: running the CSV import twice must not create a second row and
 * must not rewrite a single ticket code. Participants already hold screenshots.
 */
describe("import idempotency", () => {
  it("changes nothing on a second run of the same file", async () => {
    const baris = [
      { nama: "Impor Satu", gender: "ikhwan" as const, wa: "081288800001", nim: "9900001" },
      { nama: "Impor Dua", gender: "akhwat" as const, wa: "081288800002", nim: "9900002" },
      { nama: "Impor Tiga", gender: "ikhwan" as const, wa: "081288800003" },
    ];

    for (const b of baris) await daftarPeserta(SLUG, b, { sumber: "impor" });

    const db = getDb();
    const id = await idAcara();
    const snapshot = async () =>
      db
        .select({
          wa: acaraPeserta.wa,
          nomor: acaraPeserta.nomor,
          kode: acaraPeserta.kode,
        })
        .from(acaraPeserta)
        .where(
          and(
            eq(acaraPeserta.acaraId, id),
            sql`${acaraPeserta.wa} like '62812888%'`,
          ),
        )
        .orderBy(acaraPeserta.wa);

    const sebelum = await snapshot();
    expect(sebelum).toHaveLength(3);

    for (const b of baris) {
      const r = await daftarPeserta(SLUG, b, { sumber: "impor" });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.baru).toBe(false);
    }

    const sesudah = await snapshot();
    expect(sesudah).toEqual(sebelum);
  });
});

/**
 * Test 5 of the six: a second scan of the same person is "already scanned", not an
 * error and not a second row. A red screen on a legitimate participant is what makes
 * an usher panic.
 */
describe("second scan", () => {
  it("returns already-scanned and writes no second row", async () => {
    const r = await daftarPeserta(
      SLUG,
      { nama: "Pindai Dua Kali", gender: "ikhwan", wa: "081277700001" },
      { sumber: "web" },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const id = await idAcara();
    const kode = r.peserta.kode;

    const satu = await catatKehadiran(id, { kode, gate: "IKH-1", petugas: "Rifqi" });
    expect(satu.keadaan).toBe("hijau");

    const dua = await catatKehadiran(id, { kode, gate: "IKH-2", petugas: "Umar" });
    expect(dua.keadaan).toBe("kuning");
    if (dua.keadaan === "kuning") expect(dua.pertamaGate).toBe("IKH-1");

    const db = getDb();
    const rows = await db
      .select()
      .from(acaraKehadiran)
      .where(eq(acaraKehadiran.pesertaId, r.peserta.id));
    expect(rows).toHaveLength(1);
  });

  it("returns red for a code that is not in the list", async () => {
    const id = await idAcara();
    const hasil = await catatKehadiran(id, { kode: "ZZZZZZZZZZ" });
    expect(hasil.keadaan).toBe("merah");
  });

  it("keeps the offline client time so the arrival chart stays true", async () => {
    const r = await daftarPeserta(
      SLUG,
      { nama: "Offline Sync", gender: "akhwat", wa: "081277700002" },
      { sumber: "web" },
    );
    if (!r.ok) throw new Error("setup failed");
    const id = await idAcara();
    // Twenty minutes ago: what a queue flushed after a short outage really looks
    // like. A far-future stamp is rejected on purpose — see waktuKlienAman.
    const clientAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    await catatKehadiran(id, {
      kode: r.peserta.kode,
      gate: "AKH-1",
      offline: true,
      clientScannedAt: clientAt,
    });
    const db = getDb();
    const [row] = await db
      .select()
      .from(acaraKehadiran)
      .where(eq(acaraKehadiran.pesertaId, r.peserta.id));
    expect(row.offline).toBe(true);
    expect(row.clientScannedAt?.toISOString()).toBe(clientAt);
  });
});

/**
 * Editing must never touch the two fields a participant may already have on a
 * screenshot. Changing gender is the case that matters — it moves the gate and the
 * WhatsApp group — and the number's gender letter is allowed to drift rather than
 * a re-issued number disagreeing with a screenshot on the day the system is down.
 */
describe("participant self-edit", () => {
  it("keeps nomor and kode when the gender changes", async () => {
    const r = await daftarPeserta(
      SLUG,
      { nama: "Salah Gender", gender: "ikhwan", wa: "081255500001" },
      { sumber: "web" },
    );
    if (!r.ok) throw new Error("setup failed");
    const { nomor, kode, id } = r.peserta;

    const db = getDb();
    await db
      .update(acaraPeserta)
      .set({ gender: "akhwat", updatedAt: new Date() })
      .where(eq(acaraPeserta.id, id));

    const [sesudah] = await db.select().from(acaraPeserta).where(eq(acaraPeserta.id, id));
    expect(sesudah.gender).toBe("akhwat");
    expect(sesudah.nomor).toBe(nomor);
    expect(sesudah.kode).toBe(kode);
    // The letter is now out of step with the gender, on purpose.
    expect(sesudah.nomor).toContain("-B-");
  });

  it("releases a seat when someone says they cannot come", async () => {
    const db = getDb();
    const id = await idAcara();
    const hitung = async () => {
      const [row] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(acaraPeserta)
        .where(
          and(
            eq(acaraPeserta.acaraId, id),
            eq(acaraPeserta.aktif, true),
            sql`${acaraPeserta.konfirmasi} is distinct from false`,
          ),
        );
      return row.n;
    };

    const r = await daftarPeserta(
      SLUG,
      { nama: "Batal Datang", gender: "ikhwan", wa: "081255500002" },
      { sumber: "web" },
    );
    if (!r.ok) throw new Error("setup failed");

    const sebelum = await hitung();
    await db
      .update(acaraPeserta)
      .set({ konfirmasi: false, konfirmasiAt: new Date() })
      .where(eq(acaraPeserta.id, r.peserta.id));
    expect(await hitung()).toBe(sebelum - 1);

    // Changing their mind puts the seat back.
    await db
      .update(acaraPeserta)
      .set({ konfirmasi: true })
      .where(eq(acaraPeserta.id, r.peserta.id));
    expect(await hitung()).toBe(sebelum);
  });
});

/**
 * The walk-in queue only means something if the gate refuses it. The code exists
 * before the permit — it can be typed or relayed — so the gate has to say no until
 * the committee says yes.
 */
describe("walk-in at the gate", () => {
  it("is refused until permitted, and admitted after", async () => {
    const db = getDb();
    const id = await idAcara();

    const r = await daftarPeserta(
      SLUG,
      { nama: "Antre Gerbang", gender: "ikhwan", wa: "081233300001" },
      { sumber: "web", jenis: "ots" },
    );
    if (!r.ok) throw new Error("setup failed");

    // In the queue: registered, but not admitted, and no attendance row is written.
    const ditolak = await catatKehadiran(id, { kode: r.peserta.kode });
    expect(ditolak.keadaan).toBe("antre");
    if (ditolak.keadaan === "antre") expect(ditolak.posisi).toBe(r.peserta.urutOts);
    const kosong = await db
      .select()
      .from(acaraKehadiran)
      .where(eq(acaraKehadiran.pesertaId, r.peserta.id));
    expect(kosong).toHaveLength(0);

    // Permitted from the dashboard: the same ticket now reads green.
    expect(await izinkanOts(id, [r.peserta.id])).toBe(1);
    // Permitting again changes nothing.
    expect(await izinkanOts(id, [r.peserta.id])).toBe(0);
    const diterima = await catatKehadiran(id, { kode: r.peserta.kode });
    expect(diterima.keadaan).toBe("hijau");
  });

  it("is permitted by the help desk letting them in", async () => {
    const db = getDb();
    const id = await idAcara();
    const r = await daftarPeserta(
      SLUG,
      { nama: "Antre Meja", gender: "akhwat", wa: "081233300002" },
      { sumber: "web", jenis: "ots" },
    );
    if (!r.ok) throw new Error("setup failed");

    expect(await catatKehadiranLangsung(id, r.peserta.id, { gate: "BANTUAN", metode: "nama" })).toBe("hijau");
    const [row] = await db.select().from(acaraPeserta).where(eq(acaraPeserta.id, r.peserta.id));
    expect(row.izinOtsAt).not.toBeNull();
  });
});

/**
 * Each side of the hall has its own queue, numbered from 1 in the order people
 * registered — the number they see on their ticket and are called by.
 */
describe("walk-in queue numbers", () => {
  it("counts per side, in order, and permits all of one side at once", async () => {
    const db = getDb();
    const id = await idAcara();
    // Start from empty queues so the numbers below are exact.
    await db
      .update(acaraPeserta)
      .set({ aktif: false })
      .where(and(eq(acaraPeserta.acaraId, id), eq(acaraPeserta.jenis, "ots")));
    await db.update(acaraCounter).set({ terakhirOts: 0 }).where(eq(acaraCounter.acaraId, id));

    const daftar = async (nama: string, gender: "ikhwan" | "akhwat", wa: string) => {
      const r = await daftarPeserta(SLUG, { nama, gender, wa }, { sumber: "web", jenis: "ots" });
      if (!r.ok) throw new Error(`setup failed: ${JSON.stringify(r)}`);
      return r.peserta;
    };
    const i1 = await daftar("Antre Ikhwan 1", "ikhwan", "081292920001");
    const a1 = await daftar("Antre Akhwat 1", "akhwat", "081292920004");
    const i2 = await daftar("Antre Ikhwan 2", "ikhwan", "081292920002");
    const i3 = await daftar("Antre Ikhwan 3", "ikhwan", "081292920003");
    expect([i1.urutOts, i2.urutOts, i3.urutOts]).toEqual([1, 2, 3]);
    expect(a1.urutOts).toBe(1);

    const { baris, sisi } = await antreanOts(id);
    expect(baris.filter((r) => r.gender === "ikhwan").map((r) => r.urut)).toEqual([1, 2, 3]);
    expect(sisi.find((x) => x.gender === "ikhwan")?.menunggu).toBe(3);
    expect(await jumlahOtsMenunggu(id, "akhwat")).toBe(1);

    // Everyone on the brothers' side, and only that side.
    expect(await izinkanSemuaOts(id, "ikhwan")).toBe(3);
    expect(await jumlahOtsMenunggu(id, "ikhwan")).toBe(0);
    expect(await jumlahOtsMenunggu(id, "akhwat")).toBe(1);
  });
});

/**
 * The two sides of the hall are separate rooms with separate doors. One total can
 * be satisfied while the brothers' side overflows and the sisters' side has empty
 * rows, so the limit has to be counted per gender.
 */
describe("per-gender quota", () => {
  it("fills one side without touching the other", async () => {
    const db = getDb();
    const id = await idAcara();

    const ikh = await kursiTerpakai("ikhwan");
    const akh = await kursiTerpakai("akhwat");

    // Brothers exactly full, sisters with room to spare.
    await db
      .update(acara)
      .set({ kuotaIkhwan: ikh, kuotaAkhwat: akh + 50, kuota: null })
      .where(eq(acara.id, id));

    const penuh = await daftarPeserta(
      SLUG,
      { nama: "Sisi Penuh", gender: "ikhwan", wa: "081211100001" },
      { sumber: "web" },
    );
    expect(penuh.ok).toBe(false);
    if (!penuh.ok) expect(penuh.alasan).toBe("penuh");

    const lega = await daftarPeserta(
      SLUG,
      { nama: "Sisi Lega", gender: "akhwat", wa: "081211100002" },
      { sumber: "web" },
    );
    expect(lega.ok).toBe(true);
    if (lega.ok) expect(lega.peserta.jenis).toBe("pra");

    await db
      .update(acara)
      .set({ kuotaIkhwan: null, kuotaAkhwat: null })
      .where(eq(acara.id, id));
  });
});

/**
 * Someone who released their seat and then changes their mind keeps their ticket,
 * but not their place: someone else may have registered into it. If the hall is
 * still full they are told so and stay released.
 */
describe("coming back after releasing a seat", () => {
  it("takes a free seat back, or is told the hall is full", async () => {
    const db = getDb();
    const id = await idAcara();

    const lepas = async (pesertaId: string) =>
      db
        .update(acaraPeserta)
        .set({ konfirmasi: false, konfirmasiAt: new Date() })
        .where(eq(acaraPeserta.id, pesertaId));

    // Room in the hall: the same ticket simply becomes a seat again.
    const a = await daftarPeserta(
      SLUG,
      { nama: "Kembali Lega", gender: "akhwat", wa: "081291910001" },
      { sumber: "web" },
    );
    if (!a.ok) throw new Error(`setup failed: ${JSON.stringify(a)}`);
    await lepas(a.peserta.id);

    // A released ticket is void at the gate.
    const merah = await catatKehadiran(id, { kode: a.peserta.kode });
    expect(merah.keadaan).toBe("merah");

    const kembaliA = await ambilKembaliKursi(a.peserta.id);
    expect(kembaliA.ok).toBe(true);
    if (kembaliA.ok) {
      expect(kembaliA.peserta.jenis).toBe("pra");
      expect(kembaliA.peserta.konfirmasi).toBe(true);
      expect(kembaliA.peserta.kode).toBe(a.peserta.kode);
    }

    // Hall full: the seat is gone and the registration stays released.
    const b = await daftarPeserta(
      SLUG,
      { nama: "Kembali Penuh", gender: "ikhwan", wa: "081291910002" },
      { sumber: "web" },
    );
    if (!b.ok) throw new Error("setup failed");
    await lepas(b.peserta.id);

    const n = await kursiTerpakai("ikhwan");
    await db
      .update(acara)
      .set({ kuotaIkhwan: n, kuotaAkhwat: null, kuota: null })
      .where(eq(acara.id, id));

    const penuh = await ambilKembaliKursi(b.peserta.id);
    expect(penuh.ok).toBe(false);
    if (!penuh.ok) expect(penuh.alasan).toBe("penuh");

    // Registering again with the same number is the same as pressing "I can come".
    const ulang = await daftarPeserta(
      SLUG,
      { nama: "Kembali Penuh", gender: "ikhwan", wa: "081291910002" },
      { sumber: "web" },
    );
    expect(ulang.ok).toBe(false);
    if (!ulang.ok) {
      expect(ulang.alasan).toBe("penuh");
      expect(ulang.peserta?.id).toBe(b.peserta.id);
    }
    const [masihLepas] = await db.select().from(acaraPeserta).where(eq(acaraPeserta.id, b.peserta.id));
    expect(masihLepas.konfirmasi).toBe(false);

    // A seat frees up: back in.
    await db.update(acara).set({ kuotaIkhwan: n + 1 }).where(eq(acara.id, id));
    const lagi = await ambilKembaliKursi(b.peserta.id);
    expect(lagi.ok).toBe(true);

    // A walk-in who released and comes back costs no seat: they are in the queue, not the quota.
    const w = await daftarPeserta(
      SLUG,
      { nama: "Kembali Ots", gender: "ikhwan", wa: "081291910005" },
      { sumber: "web", jenis: "ots" },
    );
    if (!w.ok) throw new Error("setup failed");
    await lepas(w.peserta.id);
    await db.update(acara).set({ kuotaIkhwan: 0 }).where(eq(acara.id, id));
    expect((await ambilKembaliKursi(w.peserta.id)).ok).toBe(true);

    await db
      .update(acara)
      .set({ kuotaIkhwan: null, kuotaAkhwat: null, kuota: null })
      .where(eq(acara.id, id));
  });
});

/**
 * The rush at the moment the hall fills: a broadcast, and twenty people submit in the
 * same second for the last three seats. Exactly three may get one.
 */
describe("last seats under a rush", () => {
  it("never seats more than the quota when registrations arrive together", async () => {
    const db = getDb();
    const id = await idAcara();
    const n = await kursiTerpakai("ikhwan");
    await db
      .update(acara)
      .set({ kuotaIkhwan: n + 3, kuotaAkhwat: null, kuota: null })
      .where(eq(acara.id, id));

    const angkaCounter = async () => {
      const [ctr] = await db
        .select({ terakhir: acaraCounter.terakhir })
        .from(acaraCounter)
        .where(and(eq(acaraCounter.acaraId, id), eq(acaraCounter.gender, "ikhwan")));
      return ctr.terakhir;
    };
    const counterSebelum = await angkaCounter();

    const hasil = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        daftarPeserta(
          SLUG,
          {
            nama: `Rebutan ${i}`,
            gender: "ikhwan",
            wa: `0812939${String(i).padStart(5, "0")}`,
          },
          { sumber: "web" },
        ),
      ),
    );
    expect(hasil.filter((h) => h.ok)).toHaveLength(3);
    expect(hasil.filter((h) => !h.ok && h.alasan === "penuh")).toHaveLength(17);

    // A refused registration burns no number: the counter moved by exactly the
    // three that got in.
    expect((await angkaCounter()) - counterSebelum).toBe(3);

    await db.update(acara).set({ kuotaIkhwan: null }).where(eq(acara.id, id));
  });
});

describe("last seats under a rush, one shared quota", () => {
  it("never seats more than the hall when brothers and sisters arrive together", async () => {
    const db = getDb();
    const id = await idAcara();
    const n = await kursiTerpakai(null);
    await db
      .update(acara)
      .set({ kuota: n + 4, kuotaIkhwan: null, kuotaAkhwat: null })
      .where(eq(acara.id, id));

    const hasil = await Promise.all(
      Array.from({ length: 24 }, (_, i) =>
        daftarPeserta(
          SLUG,
          { nama: `Rebutan Gabung ${i}`, gender: i % 2 ? "akhwat" : "ikhwan", wa: `0812959${String(i).padStart(5, "0")}` },
          { sumber: "web" },
        ),
      ),
    );
    expect(hasil.filter((h) => h.ok)).toHaveLength(4);
    expect(hasil.filter((h) => !h.ok && h.alasan === "penuh")).toHaveLength(20);

    await db.update(acara).set({ kuota: null }).where(eq(acara.id, id));
  });
});

/**
 * An offline scan is an entry that already happened. If the ticket changed after the
 * list was downloaded — the seat released, or a walk-in permit withdrawn — the sync
 * must still record the person in the hall, not refuse and leave the scan stuck.
 */
describe("offline queue synced after the ticket changed", () => {
  it("records the attendance a live scan would refuse", async () => {
    const db = getDb();
    const id = await idAcara();
    const antre = await daftarPeserta(
      SLUG,
      { nama: "Offline Antre", gender: "ikhwan", wa: "081294940001" },
      { sumber: "web", jenis: "ots" },
    );
    const lepas = await daftarPeserta(
      SLUG,
      { nama: "Offline Lepas", gender: "akhwat", wa: "081294940002" },
      { sumber: "web" },
    );
    if (!antre.ok || !lepas.ok) throw new Error("setup failed");
    await db.update(acaraPeserta).set({ konfirmasi: false }).where(eq(acaraPeserta.id, lepas.peserta.id));

    // Live: refused, as before.
    expect((await catatKehadiran(id, { kode: antre.peserta.kode })).keadaan).toBe("antre");
    expect((await catatKehadiran(id, { kode: lepas.peserta.kode })).keadaan).toBe("merah");

    // From the offline queue: written.
    expect((await catatKehadiran(id, { kode: antre.peserta.kode, offline: true })).keadaan).toBe("hijau");
    expect((await catatKehadiran(id, { kode: lepas.peserta.kode, offline: true })).keadaan).toBe("hijau");

    // A code nobody holds is still refused, offline or not.
    expect((await catatKehadiran(id, { kode: "ZZZZZZZZZZ", offline: true })).keadaan).toBe("merah");
  });
});
