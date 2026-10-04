import { describe, expect, it } from "vitest";
import { bukanManusia, jenisHalaman, jenisPerangkat, rapikanPath, sumberKunjungan } from "./klasifikasi";

describe("rapikanPath", () => {
  it("never stores a ticket token or a query string", () => {
    expect(rapikanPath("/ar/ticket/eyJhbGciOi.abc.def?baru=1")).toBe("/ar/ticket/…");
    expect(rapikanPath("/en/ticket/eyJ.x.y/edit")).toBe("/en/ticket/…/edit");
    expect(rapikanPath("/ar/ticket/saved")).toBe("/ar/ticket/saved");
    expect(rapikanPath("/ar/p/student-lecture?utm_source=wa")).toBe("/ar/p/student-lecture");
  });
});

describe("jenisHalaman", () => {
  it("names the pages the funnel is made of", () => {
    expect(jenisHalaman("/ar")).toEqual({ halaman: "beranda", slug: null, lang: "ar" });
    expect(jenisHalaman("/en/p/student-lecture")).toMatchObject({ halaman: "program", slug: "student-lecture" });
    expect(jenisHalaman("/ar/p/student-lecture/register")).toMatchObject({ halaman: "formulir", slug: "student-lecture" });
    expect(jenisHalaman("/ar/p/student-lecture/ticket")).toMatchObject({ halaman: "cari-tiket" });
    expect(jenisHalaman("/ar/ticket/…")).toMatchObject({ halaman: "tiket" });
    expect(jenisHalaman("/ar/masuk")).toMatchObject({ halaman: "akun" });
  });

  it("keeps the lecture notes and the quiz out of the programme page", () => {
    expect(jenisHalaman("/en/p/student-lecture/notes")).toEqual({ halaman: "artikel", slug: "student-lecture", lang: "en" });
    expect(jenisHalaman("/ar/p/student-lecture/quiz")).toMatchObject({ halaman: "kuis", slug: "student-lecture" });
    expect(jenisHalaman("/ar/p/student-lecture/quiz/12")).toMatchObject({ halaman: "kuis", slug: "student-lecture" });
    expect(jenisHalaman("/en/p/student-lecture/quiz/papan")).toMatchObject({ halaman: "kuis" });
    expect(jenisHalaman("/en/p/student-lecture/quiz/sesi/2")).toMatchObject({ halaman: "kuis", slug: "student-lecture" });
  });

  it("keeps the Programme Hub club in slug, null for the index", () => {
    expect(jenisHalaman("/en/hub")).toEqual({ halaman: "hub", slug: null, lang: "en" });
    expect(jenisHalaman("/ar/hub/mabit")).toEqual({ halaman: "hub", slug: "mabit", lang: "ar" });
  });
});

describe("sumberKunjungan", () => {
  it("prefers the campaign tag, then a known referrer, else Direct", () => {
    expect(sumberKunjungan(null, "wa", "nawaroom.id").sumber).toBe("WhatsApp");
    expect(sumberKunjungan("https://l.instagram.com/?u=x", null, "nawaroom.id").sumber).toBe("Instagram");
    expect(sumberKunjungan("https://www.google.co.id/", null, "nawaroom.id").sumber).toBe("Google");
    expect(sumberKunjungan("https://nawaroom.id/ar", null, "nawaroom.id").sumber).toBe("Direct");
    expect(sumberKunjungan("", null, "nawaroom.id").sumber).toBe("Direct");
    expect(sumberKunjungan("https://lipia.ac.id/info", null, "nawaroom.id")).toEqual({
      sumber: "lipia.ac.id",
      perujuk: "lipia.ac.id",
    });
  });
});

describe("device and bots", () => {
  it("tells phones, tablets and crawlers apart", () => {
    expect(jenisPerangkat("Mozilla/5.0 (Linux; Android 13; SM-A135F) Mobile Safari/537.36")).toBe("mobile");
    expect(jenisPerangkat("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tablet");
    expect(jenisPerangkat("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126")).toBe("desktop");
    expect(bukanManusia("Googlebot/2.1")).toBe(true);
    expect(bukanManusia("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148")).toBe(false);
  });
});
