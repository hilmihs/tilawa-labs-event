import { describe, expect, it } from "vitest";
import { pesanKunciSesi, pesanRilis, pesanSesi, rentangSesi, tanggalWa } from "./wa";
import { JUMLAH_SESI, soalSesi } from "./jadwal";
import { SOAL, soalKe } from "./soal";

const BASIS = "https://nawa.room";
const MULAI = "2026-09-22";
const arg = { mulai: MULAI, basis: BASIS, slug: "student-lecture" } as const;

describe("tanggalWa", () => {
  it("writes the short Indonesian date the groups use", () => {
    expect(tanggalWa("2026-09-28")).toBe("Senin, 28 Sep");
    expect(tanggalWa("2026-10-01")).toBe("Kamis, 1 Okt");
  });
});

describe("rentangSesi", () => {
  it("spells out the release, short first one included", () => {
    expect(rentangSesi(MULAI, 1)).toBe("Selasa, 22 Sep – Rabu, 23 Sep");
    expect(rentangSesi(MULAI, 2)).toBe("Kamis, 24 Sep – Ahad, 27 Sep");
    expect(rentangSesi(MULAI, 8)).toBe("Kamis, 15 Okt – Ahad, 18 Okt");
  });
});

describe("pesan sesi", () => {
  const pesan = pesanSesi({
    ...arg,
    sesi: 2,
    gender: "akhwat",
    lalu: { menjawab: 214, peserta: 312, persenBenar: 81 },
  });

  it("greets the group it is addressed to", () => {
    expect(pesan).toContain("akhwat 🌿");
    expect(pesan).toContain("Barakallahu fikunna.");
    expect(pesanSesi({ ...arg, sesi: 2, gender: "ikhwan" })).toContain("ikhwan 🌿");
  });

  it("names the release, the questions it opens and the deadline", () => {
    expect(pesan).toContain("Sesi ke-2 / 8");
    expect(pesan).toContain("Soal 5–8 dari 30");
    for (const n of soalSesi(2)) expect(pesan).toContain(`\n${n}. `);
    expect(pesan).toContain("Ahad, 27 Sep");
  });

  it("links to the quiz on a path the site actually serves", () => {
    expect(pesan).toContain(`${BASIS}/en/p/student-lecture/quiz`);
  });

  it("carries the previous batch's numbers only when there are some", () => {
    expect(pesan).toContain("214 dari 312");
    expect(pesanSesi({ ...arg, sesi: 1, gender: "ikhwan" })).not.toContain("Sesi lalu");
  });

  it("never gives an answer away", () => {
    for (let p = 1; p <= JUMLAH_SESI; p++) {
      const m = pesanSesi({ ...arg, sesi: p, gender: "ikhwan" });
      for (const n of soalSesi(p)) {
        const s = soalKe(n)!;
        const jawaban = s.varian.id.o[s.jawab];
        // A one- or two-character option ("7") appears inside dates and question
        // numbers, so a substring check on it says nothing. The long ones are the
        // ones that could actually be leaked by the summary line.
        if (jawaban.length < 4) continue;
        expect(m, `question ${n} leaks its answer`).not.toContain(jawaban);
      }
    }
  });

  it("is empty for a release that does not exist", () => {
    expect(pesanSesi({ ...arg, sesi: 9, gender: "ikhwan" })).toBe("");
  });
});

describe("pesan kunci sesi", () => {
  it("states every answer of the batch and links to the notes", () => {
    const m = pesanKunciSesi({ sesi: 2, basis: BASIS, slug: "student-lecture" });
    expect(m).toContain("Sesi ke-2 — kunci jawaban");
    for (const n of soalSesi(2)) {
      const s = soalKe(n)!;
      expect(m).toContain(`${n}. ${"ABCD"[s.jawab]}. ${s.varian.id.o[s.jawab]}`);
    }
    expect(m).toContain(`${BASIS}/en/p/student-lecture/notes`);
  });
});

describe("pesan rilis", () => {
  it("sends no answer key in the first release", () => {
    const h = pesanRilis({ ...arg, sesi: 1, gender: "ikhwan" });
    expect(h.rentang).toBe("Selasa, 22 Sep – Rabu, 23 Sep");
    expect(h.kunci).toBeNull();
  });

  it("pairs this batch's questions with the previous key after that", () => {
    const h = pesanRilis({ ...arg, sesi: 2, gender: "ikhwan" });
    expect(h.kunci).toContain("Sesi ke-1");
  });
});

describe("bank", () => {
  it("still has thirty questions for the eight releases to draw on", () => {
    expect(SOAL).toHaveLength(30);
  });
});
