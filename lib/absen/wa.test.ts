import { describe, expect, it } from "vitest";
import { barisWaAbsen, pesanWaAbsen } from "./wa";

const arg = {
  nama: "Ahmad Fauzi",
  judul: "How to Learn and Grow at the institute",
  link: "https://nawaroom.id/ar/p/student-lecture/absen",
};

describe("pesanWaAbsen", () => {
  it("greets by first name, in Arabic and English, with the link once", () => {
    const p = pesanWaAbsen({ ...arg, gender: "ikhwan" });
    expect(p).toContain("Ahmad");
    expect(p).not.toContain("Fauzi");
    expect(p).toContain("*How to Learn and Grow at the institute*");
    expect(p).toMatch(/[؀-ۿ]/);
    expect(p).toContain("Dear Ahmad, thank you for signing up");
    expect(p.split(arg.link)).toHaveLength(2);
    expect(p).not.toMatch(/\{[a-z]+\}|undefined|null/);
  });

  it("addresses a sister in the feminine", () => {
    const akhwat = pesanWaAbsen({ ...arg, nama: "Siti Aminah", gender: "akhwat" });
    expect(akhwat).toContain("تسجيلكِ");
    expect(akhwat).toContain("جزاكِ");
    expect(pesanWaAbsen({ ...arg, gender: "ikhwan" })).not.toContain("تسجيلكِ");
  });

  it("never says the reader did not come", () => {
    const p = pesanWaAbsen({ ...arg, gender: "ikhwan" }).toLowerCase();
    expect(p).not.toContain("you did not");
    expect(p).not.toContain("absent");
  });
});

describe("barisWaAbsen", () => {
  const baris = (p: Partial<Parameters<typeof barisWaAbsen>[0][number]>) => ({
    nama: "Ahmad Fauzi",
    gender: "ikhwan",
    wa: "081234567890",
    diisiAt: null,
    ...p,
  });

  it("keeps only people who have not answered and have a usable number", () => {
    const out = barisWaAbsen(
      [baris({}), baris({ diisiAt: new Date() }), baris({ wa: "12" })],
      { judul: arg.judul, link: arg.link },
    );
    expect(out).toHaveLength(1);
    expect(out[0].wa).toBe("6281234567890");
    expect(out[0].pesan).toContain(arg.link);
  });
});
