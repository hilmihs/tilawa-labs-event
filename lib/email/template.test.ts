import { describe, expect, it } from "vitest";
import { templateAbsen, templateOtp, templatePasswordDiubah } from "./template";

const tautan = "https://nawaroom.id/ar/reset-password?wa=62812";

describe("templateOtp", () => {
  for (const lang of ["en", "ar"] as const) {
    for (const jenis of ["reset", "verifikasi_email"] as const) {
      it(`${jenis}/${lang} carries the code in text and html, and no empty placeholders`, () => {
        const t = templateOtp(jenis, "042917", lang, tautan);
        expect(t.subjek.length).toBeGreaterThan(5);
        expect(t.teks).toContain("042917");
        expect(t.html).toContain("042917");
        expect(t.teks + t.html).not.toMatch(/\{[a-z]+\}|undefined|null/);
      });
    }
  }
  it("links to the reset page only for a reset", () => {
    expect(templateOtp("reset", "111111", "en", tautan).teks).toContain(tautan);
  });
  it("sets the Arabic HTML right-to-left", () => {
    expect(templateOtp("reset", "111111", "ar", tautan).html).toContain('dir="rtl"');
  });
  it("escapes HTML in the link", () => {
    expect(templateOtp("reset", "111111", "en", 'https://x/"><script>').html).not.toContain("<script>");
  });
});

describe("templatePasswordDiubah", () => {
  it("has both languages filled", () => {
    for (const lang of ["en", "ar"] as const) {
      const t = templatePasswordDiubah(lang, "https://nawaroom.id/en/lupa-password");
      expect(t.teks).toContain("https://nawaroom.id/en/lupa-password");
      expect(t.teks + t.html).not.toMatch(/\{[a-z]+\}|undefined/);
    }
  });
});

describe("templateAbsen", () => {
  const arg = {
    nama: "Ahmad Fauzi",
    gender: "ikhwan",
    judulEn: "Student Lecture",
    judulAr: "المحاضرة الطلابية",
    linkEn: "https://nawaroom.id/en/p/s/absen",
    linkAr: "https://nawaroom.id/ar/p/s/absen",
    adaCatatan: true,
    pengingat: false,
  };
  const tanpa = { ...arg, adaCatatan: false };

  it("carries both languages, both links and the first name, with no empty placeholder", () => {
    const t = templateAbsen(arg);
    for (const s of [t.teks, t.html]) {
      expect(s).toContain(arg.linkEn);
      expect(s).toContain(arg.linkAr);
      expect(s).toContain("Ahmad");
      expect(s).not.toMatch(/\{[a-z]+\}|undefined|null/);
    }
    expect(t.html).toContain('dir="rtl"');
    expect(t.subjek).toMatch(/Tilawa Labs/);
  });

  it("has exactly one button per language, to the form — the notes open at the end of it", () => {
    for (const a of [arg, tanpa]) {
      const t = templateAbsen(a);
      expect(t.html.match(/<a /g)).toHaveLength(2);
      expect(t.html).not.toContain("/notes");
      expect(t.teks).not.toContain("/notes");
    }
    const t = templateAbsen(arg);
    expect(t.html).toContain("🎁 Open my gift — 30 seconds");
    expect(t.html).toContain("🎁 افتح هديتك — 30 ثانية");
    expect(t.teks).toContain("It opens after 30 seconds");
  });

  it("drops the gift when there are no notes", () => {
    const t = templateAbsen(tanpa);
    expect(t.html).not.toContain("🎁");
    expect(t.html).toContain("Help us — 30 seconds");
    expect(t.html).toContain("ساعدنا — 30 ثانية");
    // No gift, so no subject promising one.
    expect(t.subjek).toBe("شكرًا على تسجيلك · Thank you for signing up — Tilawa Labs");
    expect(templateAbsen({ ...tanpa, pengingat: true }).subjek).toBe("دقيقة من وقتك؟ · 30 seconds? — Tilawa Labs");
  });

  it("promises the gift in the subject only when there are notes", () => {
    expect(templateAbsen(arg).subjek).toContain("🎁");
    expect(templateAbsen({ ...arg, pengingat: true }).subjek).toContain("🎁");
  });

  it("reads as the language review asked", () => {
    const t = templateAbsen(arg);
    expect(t.teks).toContain("put together just for those who couldn't make it");
    expect(t.teks).not.toContain("packed");
    expect(t.teks).toContain("حتى يسهل عليك حضور اللقاء القادم.");
    expect(templateAbsen(tanpa).teks).toContain("حتى يسهل عليك حضور اللقاء القادم.");
  });

  it("uses the feminine Arabic for a sister", () => {
    const t = templateAbsen({ ...arg, gender: "akhwat" });
    expect(t.html).toContain("لكِ");
    expect(t.html).toContain("افتحي هديتكِ");
    expect(templateAbsen({ ...tanpa, gender: "akhwat" }).html).toContain("ساعدينا — 30 ثانية");
  });

  it("has its own subject for the reminder", () => {
    expect(templateAbsen({ ...arg, pengingat: true }).subjek).not.toBe(templateAbsen(arg).subjek);
  });

  it("escapes the name", () => {
    expect(templateAbsen({ ...arg, nama: "<script>x" }).html).not.toContain("<script>");
  });
});
