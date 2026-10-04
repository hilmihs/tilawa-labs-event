import { describe, expect, it } from "vitest";
import { bacaFormJawaban } from "./jawaban";
import { MAKS_JAWABAN, PERTANYAAN_CLUB, bacaJawaban } from "./konten";

const arabic = PERTANYAAN_CLUB.arabic!;
const form = (v: Record<string, unknown>) => (id: string) => v[id];

describe("bacaFormJawaban", () => {
  it("accepts a full set of answers, trimmed", () => {
    const r = bacaFormJawaban(arabic, form({ lama_belajar: "setahun", tantangan: "  المفردات ", tujuan: "الطلاقة" }));
    expect(r).toEqual({ ok: true, jawaban: { lama_belajar: "setahun", tantangan: "المفردات", tujuan: "الطلاقة" } });
  });

  it("names every blank or invalid question, in form order", () => {
    const r = bacaFormJawaban(arabic, form({ lama_belajar: "sepuluh_tahun", tantangan: "   ", tujuan: "x" }));
    expect(r).toEqual({ ok: false, kosong: ["lama_belajar", "tantangan"] });
  });

  it("cuts a pasted essay at the limit", () => {
    const r = bacaFormJawaban(arabic, form({ lama_belajar: "setahun", tantangan: "a".repeat(5000), tujuan: "x" }));
    expect(r.ok && r.jawaban.tantangan.length).toBe(MAKS_JAWABAN);
  });
});

describe("bacaJawaban", () => {
  it("reads a stored answer back with the option's English label", () => {
    const r = bacaJawaban("arabic", { lama_belajar: "lebih_setahun", tujuan: "الطلاقة" });
    expect(r.map((x) => [x.q.id, x.a])).toEqual([
      ["lama_belajar", "More than a year"],
      ["tujuan", "الطلاقة"],
    ]);
  });

  it("is empty for a club without questions or a row without answers", () => {
    expect(bacaJawaban("english", { a: "b" })).toEqual([]);
    expect(bacaJawaban("arabic", null)).toEqual([]);
  });
});
