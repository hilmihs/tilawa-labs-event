import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { loadEnvFile } from "@/db/env";
import { getDb } from "@/db";
import { acara, acaraKehadiran, acaraPeserta } from "@/db/schema";
import { batalkanKehadiran, catatKehadiranLangsung, waktuKlienAman } from "./catat";

loadEnvFile();

/**
 * Regression cover for the scan timestamp the phone sends. A bad value used to do
 * two separate kinds of damage: an unparseable string made the INSERT throw, which
 * dropped the attendance entirely, and a skewed clock wrote a row far outside the
 * event, which pushed every real scan out of the arrival chart's window.
 */
describe("waktuKlienAman", () => {
  const now = Date.parse("2026-09-20T00:30:00Z");

  it("keeps a plausible timestamp", () => {
    const t = "2026-09-20T00:12:00.000Z";
    expect(waktuKlienAman(t, now)?.toISOString()).toBe(t);
  });

  it("keeps a late offline sync from earlier in the day", () => {
    const t = "2026-09-19T20:00:00.000Z";
    expect(waktuKlienAman(t, now)?.toISOString()).toBe(t);
  });

  it("drops unparseable input instead of throwing", () => {
    expect(waktuKlienAman("not a date", now)).toBeNull();
    expect(waktuKlienAman("", now)).toBeNull();
    expect(waktuKlienAman(undefined, now)).toBeNull();
    expect(waktuKlienAman(null, now)).toBeNull();
  });

  it("drops a clock set to the future", () => {
    expect(waktuKlienAman("2027-01-01T00:00:00.000Z", now)).toBeNull();
  });

  it("drops a clock stuck in the past", () => {
    expect(waktuKlienAman("2020-01-01T00:00:00.000Z", now)).toBeNull();
  });

  it("falls back to server time by returning null, never a wrong instant", () => {
    // The caller stores null, so scanned_at (server time) is what the chart uses.
    expect(waktuKlienAman("1970-01-01T00:00:00.000Z", now)).toBeNull();
  });
});

/**
 * One deployment serves many programmes, and both ids reach the help desk from a
 * staff form. A stale tab can hand the desk a participant of one programme while the
 * picker resolves another; the attendance must not be written against a programme the
 * person is not registered for.
 */
const SLUG_A = `test-a-${Math.random().toString(36).slice(2, 10)}`;
const SLUG_B = `test-b-${Math.random().toString(36).slice(2, 10)}`;

let acaraAId = "";
let acaraBId = "";
let pesertaAId = "";

beforeAll(async () => {
  const db = getDb();
  const [a, b] = await db
    .insert(acara)
    .values([
      {
        slug: SLUG_A,
        nama: "Test A",
        tanggal: "2026-09-20",
        prefiksNomor: "TSA",
        status: "pendaftaran",
      },
      {
        slug: SLUG_B,
        nama: "Test B",
        tanggal: "2026-09-21",
        prefiksNomor: "TSB",
        status: "pendaftaran",
      },
    ])
    .returning();
  acaraAId = a.id;
  acaraBId = b.id;

  const [p] = await db
    .insert(acaraPeserta)
    .values({
      acaraId: acaraAId,
      nomor: "TSA-0001",
      kode: `K${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      nama: "Peserta Acara A",
      gender: "ikhwan",
      wa: "081000000001",
    })
    .returning();
  pesertaAId = p.id;
});

afterAll(async () => {
  const db = getDb();
  await db.delete(acara).where(inArray(acara.slug, [SLUG_A, SLUG_B]));
});

describe("catatKehadiranLangsung across programmes", () => {
  it("does not mark a participant of event A present at event B", async () => {
    const hasil = await catatKehadiranLangsung(acaraBId, pesertaAId, {
      gate: "BANTUAN",
      petugas: "tester",
      metode: "manual",
    });
    expect(hasil).toBe("merah");

    const db = getDb();
    const baris = await db
      .select()
      .from(acaraKehadiran)
      .where(eq(acaraKehadiran.pesertaId, pesertaAId));
    expect(baris).toHaveLength(0);
  });

  it("still marks the participant present at their own event", async () => {
    const hasil = await catatKehadiranLangsung(acaraAId, pesertaAId, {
      gate: "BANTUAN",
      petugas: "tester",
      metode: "manual",
    });
    expect(hasil).toBe("hijau");

    const db = getDb();
    const [baris] = await db
      .select()
      .from(acaraKehadiran)
      .where(eq(acaraKehadiran.pesertaId, pesertaAId));
    expect(baris.acaraId).toBe(acaraAId);
  });
});

/**
 * Letting in a walk-in still in the queue IS the permit: the desk decided, and the
 * dashboard has to count the seat as taken from then on.
 */
describe("catatKehadiranLangsung and the walk-in queue", () => {
  it("stamps the permit on a queued walk-in it lets in", async () => {
    const db = getDb();
    const [w] = await db
      .insert(acaraPeserta)
      .values({
        acaraId: acaraAId,
        nomor: "TSA-0002",
        kode: `K${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        nama: "Peserta Antre",
        gender: "akhwat",
        wa: "081000000002",
        jenis: "ots",
        urutOts: 1,
      })
      .returning();
    expect(w.izinOtsAt).toBeNull();

    const hasil = await catatKehadiranLangsung(acaraAId, w.id, { gate: "BANTUAN", petugas: "desk", metode: "nama" });
    expect(hasil).toBe("hijau");
    const [baris] = await db.select().from(acaraPeserta).where(eq(acaraPeserta.id, w.id));
    expect(baris.izinOtsAt).not.toBeNull();

    // Undoing the scan keeps the permit: the decision stands, only the entry is reversed.
    expect(await batalkanKehadiran(acaraAId, w.id, "desk")).toBe(true);
    const [lagi] = await db.select().from(acaraPeserta).where(eq(acaraPeserta.id, w.id));
    expect(lagi.izinOtsAt).not.toBeNull();
  });

  it("touches no permit for an ordinary seat", async () => {
    const db = getDb();
    const [p] = await db
      .insert(acaraPeserta)
      .values({
        acaraId: acaraAId,
        nomor: "TSA-0003",
        kode: `K${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        nama: "Peserta Biasa",
        gender: "ikhwan",
        wa: "081000000003",
      })
      .returning();
    await catatKehadiranLangsung(acaraAId, p.id, { gate: "BANTUAN", metode: "nama" });
    const [baris] = await db.select().from(acaraPeserta).where(eq(acaraPeserta.id, p.id));
    expect(baris.izinOtsAt).toBeNull();
  });
});
