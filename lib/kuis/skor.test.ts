import { describe, expect, it } from "vitest";
import { soalSesi } from "./jadwal";
import {
  papanSesi,
  peringkat,
  ringkasan,
  skor,
  streak,
  streakTerpanjang,
  type Jawaban,
} from "./skor";

const j = (nomor: number, benar: boolean, tepatWaktu = true): Jawaban => ({
  nomor,
  pilih: benar ? 1 : 0,
  benar,
  tepatWaktu,
});

/** Every question of one release, answered on time. Releases are uneven: 4-4-4-3-4-4-4-3. */
const sesiPenuh = (sesi: number, benar = true, tepatWaktu = true) =>
  soalSesi(sesi).map((n) => j(n, benar, tepatWaktu));

describe("skor", () => {
  it("counts correct answers, late ones included", () => {
    expect(skor([j(1, true), j(2, false), j(3, true, false)])).toBe(2);
  });
});

describe("streak", () => {
  it("counts complete releases back from the one that is open", () => {
    expect(streak([...sesiPenuh(1), ...sesiPenuh(2)], 2)).toBe(2);
  });

  it("does not break because this release is not finished yet", () => {
    expect(streak([...sesiPenuh(1), j(5, true)], 2)).toBe(1);
  });

  it("counts a release where every answer was wrong, as long as they all came in", () => {
    // The streak measures turning up; the score measures knowing.
    expect(streak(sesiPenuh(1, false), 1)).toBe(1);
  });

  it("breaks on a release with a question left unanswered", () => {
    const kurangSatu = sesiPenuh(1).slice(0, -1);
    expect(streak([...kurangSatu, ...sesiPenuh(2)], 2)).toBe(1);
  });

  it("breaks on a release answered late, and answering later does not restore it", () => {
    expect(streak([...sesiPenuh(1, true, false), ...sesiPenuh(2)], 2)).toBe(1);
  });

  it("is zero before anything has opened", () => {
    expect(streak([], 0)).toBe(0);
  });
});

describe("streakTerpanjang", () => {
  it("finds the best run anywhere in the eight, not the one still alive", () => {
    const jawaban = [
      ...sesiPenuh(1),
      ...sesiPenuh(2),
      ...sesiPenuh(3).slice(0, 3),
      ...sesiPenuh(4),
    ];
    expect(streakTerpanjang(jawaban)).toBe(2);
    expect(streak(jawaban, 4)).toBe(1);
  });

  it("is zero with nothing complete", () => {
    expect(streakTerpanjang([])).toBe(0);
    expect(streakTerpanjang([j(1, true), j(2, true)])).toBe(0);
  });
});

describe("papanSesi", () => {
  it("lays out eight uneven releases and marks each square", () => {
    const p = papanSesi([j(1, true), j(2, false)], 2);
    expect(p).toHaveLength(8);
    expect(p.map((x) => x.kotak.length)).toEqual([4, 4, 4, 3, 4, 4, 4, 3]);
    expect(p[0].kotak[0].status).toBe("benar");
    expect(p[0].kotak[1].status).toBe("salah");
    // Release one has closed and questions 3–4 were never answered.
    expect(p[0].kotak[2].status).toBe("lewat");
    // Release two is the open one.
    expect(p[1].kotak[0].status).toBe("terbuka");
    expect(p[2].kotak[0].status).toBe("terkunci");
  });

  it("locks everything before the quiz starts", () => {
    expect(papanSesi([], 0).every((p) => p.kotak.every((k) => k.status === "terkunci"))).toBe(
      true,
    );
  });
});

describe("ringkasan", () => {
  it("puts score, streak and what is still answerable together", () => {
    const r = ringkasan(
      [...sesiPenuh(1), j(5, false)],
      "2026-09-22",
      Date.parse("2026-09-24T09:00:00+07:00"),
    );
    expect(r.sesi).toBe(2);
    expect(r.terbuka).toBe(8);
    expect(r.skor).toBe(4);
    expect(r.streak).toBe(1);
    // Questions 6–8 are open and unanswered.
    expect(r.tertinggal).toBe(3);
  });
});

describe("peringkat", () => {
  it("orders by score, then streak, then number", () => {
    const p = peringkat([
      { nomor: "#0031", skor: 7, streak: 1 },
      { nomor: "#0117", skor: 8, streak: 2 },
      { nomor: "#0289", skor: 8, streak: 2 },
    ]);
    expect(p.map((b) => b.nomor)).toEqual(["#0117", "#0289", "#0031"]);
  });

  it("gives a tie the same place and skips the one after", () => {
    const p = peringkat([
      { nomor: "#0001", skor: 8, streak: 2 },
      { nomor: "#0002", skor: 8, streak: 2 },
      { nomor: "#0003", skor: 5, streak: 1 },
    ]);
    expect(p.map((b) => b.rank)).toEqual([1, 1, 3]);
  });

  it("leaves the caller's array alone", () => {
    const asal = [
      { nomor: "#0002", skor: 1, streak: 1 },
      { nomor: "#0001", skor: 9, streak: 2 },
    ];
    peringkat(asal);
    expect(asal[0].nomor).toBe("#0002");
  });
});
