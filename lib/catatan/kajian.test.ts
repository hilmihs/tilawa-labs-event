import { describe, expect, it } from "vitest";
import { adaCatatan, BAHASA_TEKS, catatanUntuk } from "./kajian";
import type { BahasaTeks, Blok, Teks } from "./tipe";
import { JUMLAH_SOAL, SOAL } from "@/lib/kuis/soal";

/*
 * These are content tests, not logic tests. The notes and the question bank are
 * written by hand in three languages, and the failure they guard against is a
 * missing or empty translation — which renders as a blank card rather than an
 * error, and would reach a reader before it reached us.
 */

const catatan = catatanUntuk("student-lecture");

function lengkap(t: Teks, jalur: string) {
  for (const b of BAHASA_TEKS) {
    expect(typeof t[b], `${jalur}.${b} is missing`).toBe("string");
    expect(t[b].trim(), `${jalur}.${b} is empty`).not.toBe("");
  }
}

function periksaBlok(blok: Blok, jalur: string) {
  if (blok.jenis === "ul") {
    expect(blok.butir.length, `${jalur} has no items`).toBeGreaterThan(0);
    blok.butir.forEach((butir, i) => lengkap(butir, `${jalur}.butir[${i}]`));
    return;
  }
  if (blok.jenis === "dalil") {
    expect(blok.arab.trim(), `${jalur}.arab is empty`).not.toBe("");
    lengkap(blok.terjemah, `${jalur}.terjemah`);
    lengkap(blok.sumber, `${jalur}.sumber`);
    return;
  }
  lengkap(blok.teks, `${jalur}.teks`);
}

describe("catatan kajian", () => {
  it("is registered for the programme it belongs to, and for nothing else", () => {
    expect(adaCatatan("student-lecture")).toBe(true);
    expect(adaCatatan("tidak-ada")).toBe(false);
    expect(catatanUntuk("tidak-ada")).toBeNull();
  });

  it("has six parts, numbered 01 to 06, with unique anchors", () => {
    expect(catatan).not.toBeNull();
    const bagian = catatan!.bagian;
    expect(bagian.map((b) => b.no)).toEqual(["01", "02", "03", "04", "05", "06"]);
    expect(new Set(bagian.map((b) => b.id)).size).toBe(bagian.length);
  });

  it("gives every part one or two card lines and a closing panel", () => {
    for (const b of catatan!.bagian) {
      lengkap(b.kicker, `${b.id}.kicker`);
      lengkap(b.judul, `${b.id}.judul`);
      lengkap(b.ringkas, `${b.id}.ringkas`);
      // The card is a fixed height: a third line would make it scroll.
      expect(b.poin.length, `${b.id} should carry one or two card lines`).toBeGreaterThan(0);
      expect(b.poin.length, `${b.id} should carry one or two card lines`).toBeLessThan(3);
      b.poin.forEach((p, i) => lengkap(p, `${b.id}.poin[${i}]`));
      if (b.penutup.jenis === "dalil") {
        expect(b.penutup.arab.trim(), `${b.id}.penutup.arab is empty`).not.toBe("");
        lengkap(b.penutup.terjemah, `${b.id}.penutup.terjemah`);
      } else {
        lengkap(b.penutup.teks, `${b.id}.penutup.teks`);
      }
      // A quotation from the lecture itself may stand without attribution.
      if (b.penutup.jenis === "dalil" || b.penutup.sumber) {
        lengkap(b.penutup.sumber!, `${b.id}.penutup.sumber`);
      }
      expect(b.isi.length, `${b.id} has no body`).toBeGreaterThan(0);
      b.isi.forEach((blok, i) => periksaBlok(blok, `${b.id}.isi[${i}]`));
    }
  });

  it("translates the heading matter and the summary points", () => {
    const c = catatan!;
    for (const [nama, t] of Object.entries({
      judul: c.judul,
      pemateri: c.pemateri,
      doa: c.doa,
      acara: c.acara,
      tempat: c.tempat,
      durasi: c.durasi,
      sumber: c.sumber,
    })) {
      lengkap(t, nama);
    }
    expect(c.ringkasan.length).toBe(9);
    c.ringkasan.forEach((r, i) => lengkap(r, `ringkasan[${i}]`));
  });
});

describe("bank soal kuis", () => {
  it("covers day 1 to day 30 exactly once", () => {
    expect(JUMLAH_SOAL).toBe(30);
    expect(SOAL.map((s) => s.nomor)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it("gives every question four options in each language and one correct answer", () => {
    for (const s of SOAL) {
      for (const b of BAHASA_TEKS as BahasaTeks[]) {
        const v = s.varian[b];
        expect(v, `day ${s.nomor} has no ${b}`).toBeTruthy();
        expect(v.q.trim(), `day ${s.nomor} ${b}.q is empty`).not.toBe("");
        expect(v.e.trim(), `day ${s.nomor} ${b}.e is empty`).not.toBe("");
        expect(v.o.length, `day ${s.nomor} ${b} needs four options`).toBe(4);
        v.o.forEach((o, i) =>
          expect(o.trim(), `day ${s.nomor} ${b}.o[${i}] is empty`).not.toBe(""),
        );
        expect(new Set(v.o).size, `day ${s.nomor} ${b} repeats an option`).toBe(4);
      }
      expect(s.jawab, `day ${s.nomor} answer index out of range`).toBeGreaterThanOrEqual(0);
      expect(s.jawab, `day ${s.nomor} answer index out of range`).toBeLessThan(4);
    }
  });

  it("points every question at a part of the notes that exists", () => {
    const anchor = new Set(catatan!.bagian.map((b) => b.id));
    for (const s of SOAL) {
      expect(anchor.has(s.bagian), `day ${s.nomor} points at ${s.bagian}, which is not a part`).toBe(
        true,
      );
      lengkap(s.rujuk, `day ${s.nomor} rujuk`);
    }
  });

  it("does not put the correct answer in the same slot every time", () => {
    // A quiz answerable by always tapping D is not a quiz.
    const sebaran = new Set(SOAL.map((s) => s.jawab));
    expect(sebaran.size).toBeGreaterThan(2);
  });
});
