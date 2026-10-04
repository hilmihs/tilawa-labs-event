import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { loadEnvFile } from "@/db/env";
import { getDb } from "@/db";
import { acara, acaraKehadiran, acaraPeserta, feedbackAbsen, pengguna } from "@/db/schema";
import {
  ambilFeedbackAbsen,
  cariPesertaAbsen,
  daftarAbsen,
  pesertaDariAkun,
  simpanJawabanAbsen,
  sudahHadir,
  tandaiAbsen,
} from "./queries";

loadEnvFile();

const SLUG = `test-absen-${Math.random().toString(36).slice(2, 10)}`;
const kode = () => `K${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
let acaraId = "";
const id: Record<string, string> = {};
const akun: Record<string, string> = {};

beforeAll(async () => {
  const db = getDb();
  const [ev] = await db
    .insert(acara)
    .values({ slug: SLUG, nama: "Test Absen", tanggal: "2026-09-20", prefiksNomor: "TAB", status: "selesai" })
    .returning();
  acaraId = ev.id;
  const buat = (nomor: string, extra: Partial<typeof acaraPeserta.$inferInsert> = {}) => ({
    acaraId,
    nomor,
    kode: kode(),
    nama: `Peserta ${nomor}`,
    gender: "ikhwan",
    // Stored the way registration stores it: already normalised.
    wa: `62810000${nomor.slice(-4)}`,
    ...extra,
  });
  const akunBaru = (k: string) => ({
    wa: `62899${Math.floor(Math.random() * 1e8)}`,
    email: `${SLUG}-${k}@example.test`,
    passwordHash: "x",
    nama: `Akun ${k}`,
    gender: "ikhwan",
  });
  for (const r of await db.insert(pengguna).values([akunBaru("a"), akunBaru("b"), akunBaru("c")]).returning()) {
    akun[r.nama.slice(-1)] = r.id;
  }
  const rows = await db
    .insert(acaraPeserta)
    .values([
      buat("TAB-0001"), // came
      buat("TAB-0002", { penggunaId: akun.a }), // no-show
      buat("TAB-0003", { aktif: false, penggunaId: akun.b }), // spam
      buat("TAB-0004", { jenis: "ots" }), // walk-in never let in
      buat("TAB-0005", { jenis: "ots", izinOtsAt: new Date() }), // walk-in let in, did not scan
    ])
    .returning();
  for (const r of rows) id[r.nomor] = r.id;
  await db.insert(acaraKehadiran).values({ pesertaId: id["TAB-0001"], acaraId });
});

afterAll(async () => {
  await getDb().delete(acara).where(eq(acara.slug, SLUG));
  for (const k of Object.values(akun)) await getDb().delete(pengguna).where(eq(pengguna.id, k));
});

describe("daftarAbsen", () => {
  it("lists active no-shows only, walk-ins only once they were let in", async () => {
    const rows = await daftarAbsen(acaraId);
    expect(rows.map((r) => r.nomor)).toEqual(["TAB-0002", "TAB-0005"]);
  });
});

describe("cariPesertaAbsen", () => {
  it("finds the participant by the number as people type it", async () => {
    expect((await cariPesertaAbsen(acaraId, "0810-000-0002"))?.id).toBe(id["TAB-0002"]);
    expect((await cariPesertaAbsen(acaraId, "+62 810 000 0005"))?.id).toBe(id["TAB-0005"]);
  });
  it("finds nobody for an unknown, malformed or deactivated number", async () => {
    expect(await cariPesertaAbsen(acaraId, "081299998888")).toBeNull();
    expect(await cariPesertaAbsen(acaraId, "12")).toBeNull();
    expect(await cariPesertaAbsen(acaraId, "08100000003")).toBeNull();
  });
});

describe("pesertaDariAkun", () => {
  it("finds the registration made with the signed-in account", async () => {
    expect((await pesertaDariAkun(acaraId, akun.a))?.id).toBe(id["TAB-0002"]);
  });
  it("finds nobody for a deactivated registration or an account that did not register", async () => {
    expect(await pesertaDariAkun(acaraId, akun.b)).toBeNull();
    expect(await pesertaDariAkun(acaraId, akun.c)).toBeNull();
  });
});

describe("sudahHadir", () => {
  it("reads the scan table", async () => {
    expect(await sudahHadir(id["TAB-0001"])).toBe(true);
    expect(await sudahHadir(id["TAB-0002"])).toBe(false);
  });
});

describe("tandaiAbsen", () => {
  it("creates the row on first touch and never moves a timestamp already set", async () => {
    await tandaiAbsen(id["TAB-0002"], acaraId, "dibukaAt");
    const a = await ambilFeedbackAbsen(id["TAB-0002"]);
    expect(a?.dibukaAt).toBeInstanceOf(Date);
    await new Promise((r) => setTimeout(r, 20));
    await tandaiAbsen(id["TAB-0002"], acaraId, "dibukaAt");
    await tandaiAbsen(id["TAB-0002"], acaraId, "emailAt");
    const b = await ambilFeedbackAbsen(id["TAB-0002"]);
    expect(b?.dibukaAt?.getTime()).toBe(a?.dibukaAt?.getTime());
    expect(b?.emailAt).toBeInstanceOf(Date);
  });
});

describe("simpanJawabanAbsen", () => {
  it("writes the answers and lets a second submit overwrite them", async () => {
    const jawab = {
      alasan: ["sakit" as const],
      alasanLain: null,
      waktuCocok: [],
      pengingat: [],
      mauOnline: null,
      saran: "pagi saja",
      kabari: true,
    };
    await simpanJawabanAbsen(id["TAB-0005"], acaraId, jawab);
    await simpanJawabanAbsen(id["TAB-0005"], acaraId, { ...jawab, alasan: ["lupa"], saran: null });
    const r = await ambilFeedbackAbsen(id["TAB-0005"]);
    expect(r?.alasan).toEqual(["lupa"]);
    expect(r?.saran).toBeNull();
    expect(r?.diisiAt).toBeInstanceOf(Date);
    const [n] = await getDb().select().from(feedbackAbsen).where(eq(feedbackAbsen.pesertaId, id["TAB-0005"]));
    expect(n.kabari).toBe(true);
  });

  it("shows up joined in daftarAbsen", async () => {
    const rows = await daftarAbsen(acaraId);
    expect(rows.find((r) => r.nomor === "TAB-0005")?.alasan).toEqual(["lupa"]);
    expect(rows.find((r) => r.nomor === "TAB-0002")?.emailAt).toBeInstanceOf(Date);
  });
});
