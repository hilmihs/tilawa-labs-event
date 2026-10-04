import { afterEach, describe, expect, it } from "vitest";
import { bacaFilterStatus, bearerCocok, kelompokkanPerProgram } from "./ekspor";

describe("bearerCocok", () => {
  const asli = process.env.EXPORT_TOKEN;
  afterEach(() => {
    process.env.EXPORT_TOKEN = asli;
  });

  it("accepts the configured token", () => {
    process.env.EXPORT_TOKEN = "rahasia-123";
    expect(bearerCocok("Bearer rahasia-123")).toBe(true);
  });

  it("rejects a wrong token, a missing header and a non-Bearer scheme", () => {
    process.env.EXPORT_TOKEN = "rahasia-123";
    expect(bearerCocok("Bearer rahasia-124")).toBe(false);
    expect(bearerCocok(null)).toBe(false);
    expect(bearerCocok("Basic rahasia-123")).toBe(false);
  });

  it("is closed when the server has no token, even for an empty Bearer", () => {
    delete process.env.EXPORT_TOKEN;
    expect(bearerCocok("Bearer ")).toBe(false);
    expect(bearerCocok("Bearer undefined")).toBe(false);
  });
});

describe("bacaFilterStatus", () => {
  it("means every programme when absent or blank", () => {
    expect(bacaFilterStatus(null)).toEqual({ ok: true, status: null });
    expect(bacaFilterStatus("")).toEqual({ ok: true, status: null });
  });

  it("reads a comma-separated list, trimmed and deduplicated", () => {
    expect(bacaFilterStatus("pendaftaran, berlangsung,pendaftaran")).toEqual({
      ok: true,
      status: ["pendaftaran", "berlangsung"],
    });
  });

  it("refuses an unknown status instead of silently returning nothing", () => {
    expect(bacaFilterStatus("pendaftaran,berjalan")).toEqual({ ok: false, salah: ["berjalan"] });
  });
});

describe("kelompokkanPerProgram", () => {
  const program = [
    { id: "a1", slug: "kajian-2", nama: "Kajian 2", tanggal: "2026-10-04", status: "pendaftaran", kuota: 500, jenis: "acara" },
    { id: "a2", slug: "kajian-1", nama: "Kajian 1", tanggal: "2026-09-20", status: "selesai", kuota: null, jenis: "acara" },
  ];

  it("puts each row under its own programme and keeps the programme order", () => {
    const hasil = kelompokkanPerProgram(
      program,
      [
        { id: "p1", acaraId: "a2" },
        { id: "p2", acaraId: "a1" },
        { id: "p3", acaraId: "a1" },
      ],
      [{ pesertaId: "p1", acaraId: "a2" }],
    );
    expect(hasil.map((h) => h.acara.slug)).toEqual(["kajian-2", "kajian-1"]);
    expect(hasil[0].peserta.map((p) => p.id)).toEqual(["p2", "p3"]);
    expect(hasil[0].kehadiran).toEqual([]);
    expect(hasil[1].peserta.map((p) => p.id)).toEqual(["p1"]);
    expect(hasil[1].kehadiran.map((k) => k.pesertaId)).toEqual(["p1"]);
  });

  it("exposes the same programme fields as the single-programme export, without the id", () => {
    const [satu] = kelompokkanPerProgram([program[0]], [], []);
    expect(satu.acara).toEqual({
      slug: "kajian-2",
      nama: "Kajian 2",
      tanggal: "2026-10-04",
      status: "pendaftaran",
      kuota: 500,
      jenis: "acara",
    });
  });

  it("keeps a programme with nobody registered yet", () => {
    const hasil = kelompokkanPerProgram(program, [], []);
    expect(hasil).toHaveLength(2);
    expect(hasil.every((h) => h.peserta.length === 0 && h.kehadiran.length === 0)).toBe(true);
  });
});
