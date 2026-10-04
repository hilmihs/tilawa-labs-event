import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { loadEnvFile } from "@/db/env";
import { getDb } from "@/db";
import { acara, aduan } from "@/db/schema";
import { daftarAduan, hitungAduanDariIp, simpanAduan, ubahAduan } from "./queries";

loadEnvFile();

const SLUG = `test-${Math.random().toString(36).slice(2, 10)}`;
// Every report made here carries this marker, so searches see only this run's rows
// even when the local database holds real reports.
const PENANDA = `uji${Math.random().toString(36).slice(2, 10)}`;
const IP = `ip-${PENANDA}`;
const idDibuat: string[] = [];
let acaraId = "";

beforeAll(async () => {
  const db = getDb();
  const [ev] = await db
    .insert(acara)
    .values({ slug: SLUG, nama: "Test Aduan", tanggal: "2026-09-20", prefiksNomor: "TSA", status: "pendaftaran" })
    .returning();
  acaraId = ev.id;
});

afterAll(async () => {
  const db = getDb();
  if (idDibuat.length) await db.delete(aduan).where(inArray(aduan.id, idDibuat));
  await db.delete(acara).where(eq(acara.slug, SLUG));
});

async function buat(i: number) {
  const r = await simpanAduan({
    acaraId,
    slug: SLUG,
    halaman: "Registration form",
    pesan: `Form cannot be submitted ${PENANDA} #${i}`,
    nama: `Peserta ${i}`,
    kontak: `08123${i}`,
    ipHash: IP,
    lang: "en",
  });
  idDibuat.push(r.id);
  return r;
}

describe("aduan", () => {
  it("assigns distinct sequential numbers, even when sent at once", async () => {
    const satu = await buat(0);
    const dua = await buat(1);
    expect(satu.nomor).toMatch(/^ADU-\d{4,}$/);
    expect(Number(dua.nomor.slice(4))).toBe(Number(satu.nomor.slice(4)) + 1);

    const serentak = await Promise.all([2, 3, 4].map(buat));
    const semua = [satu, dua, ...serentak].map((r) => r.nomor);
    expect(new Set(semua).size).toBe(5);

    expect(await hitungAduanDariIp(IP, new Date(Date.now() - 60 * 60 * 1000))).toBe(5);
    expect(await hitungAduanDariIp(IP, new Date(Date.now() + 60 * 1000))).toBe(0);
  });

  it("updates status and note, and reports a missing id", async () => {
    const hasil = await daftarAduan({ q: PENANDA });
    const [a, b] = hasil.baris;
    expect(await ubahAduan(a.id, { status: "diproses", catatanAdmin: "Checking with IT" })).toBe(true);
    expect(await ubahAduan(b.id, { status: "selesai" })).toBe(true);
    expect(await ubahAduan("00000000-0000-0000-0000-000000000000", { status: "selesai" })).toBe(false);

    const db = getDb();
    const [baru] = await db.select().from(aduan).where(eq(aduan.id, a.id));
    expect(baru.status).toBe("diproses");
    expect(baru.catatanAdmin).toBe("Checking with IT");
    expect(baru.updatedAt.getTime()).toBeGreaterThanOrEqual(baru.createdAt.getTime());

    expect(await ubahAduan(a.id, { catatanAdmin: null })).toBe(true);
    const [kosong] = await db.select().from(aduan).where(eq(aduan.id, a.id));
    expect(kosong.catatanAdmin).toBeNull();
    expect(kosong.status).toBe("diproses");
  });

  it("lists newest first, filters by status and search, and counts per status", async () => {
    const semua = await daftarAduan({ q: PENANDA });
    expect(semua.total).toBe(5);
    expect(semua.hitung).toEqual({ baru: 3, diproses: 1, selesai: 1 });
    expect(semua.baris[0].acaraNama).toBe("Test Aduan");
    const waktu = semua.baris.map((r) => r.createdAt.getTime());
    expect([...waktu].sort((x, y) => y - x)).toEqual(waktu);

    const baru = await daftarAduan({ q: PENANDA, status: "baru" });
    expect(baru.total).toBe(3);
    expect(baru.baris.every((r) => r.status === "baru")).toBe(true);
    // Badges stay whole while a tab is filtered.
    expect(baru.hitung).toEqual({ baru: 3, diproses: 1, selesai: 1 });

    const perNomor = await daftarAduan({ q: semua.baris[0].nomor });
    expect(perNomor.baris.map((r) => r.id)).toContain(semua.baris[0].id);

    const perKontak = await daftarAduan({ q: `${PENANDA}`, limit: 2, offset: 0 });
    expect(perKontak.baris).toHaveLength(2);
    expect(perKontak.total).toBe(5);

    const tidakAda = await daftarAduan({ q: `${PENANDA}-tidak-ada` });
    expect(tidakAda.total).toBe(0);
    expect(tidakAda.hitung).toEqual({ baru: 0, diproses: 0, selesai: 0 });

    // A `%` typed into the search matches literally, not as a wildcard.
    expect((await daftarAduan({ q: `${PENANDA}%` })).total).toBe(0);
  });
});
