import { describe, expect, it } from "vitest";
import { labelJenis, pilihBawaan, resolusiSlug, slugSah } from "./view-model";
import { tanggalIsoWib } from "@/lib/waktu";

describe("resolusiSlug", () => {
  it("the query string beats the cookie", () => {
    expect(resolusiSlug("kajian-2", "kajian-1")).toBe("kajian-2");
  });
  it("falls back to the cookie", () => {
    expect(resolusiSlug(undefined, "kajian-1")).toBe("kajian-1");
  });
  it("treats empty strings as absent", () => {
    expect(resolusiSlug("", "")).toBeNull();
  });
  it("rejects anything that is not a slug", () => {
    expect(resolusiSlug("../etc", undefined)).toBeNull();
    expect(resolusiSlug(undefined, "Kajian 1")).toBeNull();
  });
  it("rejects a slug past the 60-character limit", () => {
    expect(resolusiSlug("a".repeat(61), undefined)).toBeNull();
  });
});

describe("slugSah", () => {
  it("accepts lowercase slugs and rejects everything else", () => {
    expect(slugSah("kajian-1")).toBe(true);
    expect(slugSah("Kajian")).toBe(false);
  });
});

describe("labelJenis", () => {
  it("translates the programme kind", () => {
    expect(labelJenis("kelas", "en")).toBe("Class");
  });
  it("falls back to 'acara' for an unknown kind", () => {
    expect(labelJenis("apa-saja", "ar")).toBe(labelJenis("acara", "ar"));
  });
});

describe("tanggalIsoWib", () => {
  // WIB is UTC+7, so the day turns over at 17:00 UTC. Getting this wrong shows an
  // empty dashboard for the first seven hours of the event day.
  it("rolls the date at 17:00 UTC", () => {
    expect(tanggalIsoWib(new Date("2026-09-14T17:30:00Z"))).toBe("2026-09-15");
    expect(tanggalIsoWib(new Date("2026-09-14T16:30:00Z"))).toBe("2026-09-14");
  });
});

const p = (slug: string, tanggal: string, status: string) => ({ slug, tanggal, status });

describe("pilihBawaan", () => {
  it("returns null for an empty list", () => {
    expect(pilihBawaan([], "2026-09-14")).toBeNull();
  });
  it("prefers the nearest upcoming programme that is live", () => {
    const daftar = [
      p("lama", "2026-01-01", "selesai"),
      p("jauh", "2026-12-01", "pendaftaran"),
      p("dekat", "2026-09-20", "pendaftaran"),
      p("draf", "2026-09-15", "draft"),
    ];
    expect(pilihBawaan(daftar, "2026-09-14")?.slug).toBe("dekat");
  });
  it("counts today as upcoming", () => {
    const daftar = [p("hari-ini", "2026-09-14", "berlangsung"), p("besok", "2026-09-15", "pendaftaran")];
    expect(pilihBawaan(daftar, "2026-09-14")?.slug).toBe("hari-ini");
  });
  it("falls back to the most recent live programme when nothing is upcoming", () => {
    const daftar = [p("a", "2026-01-01", "ditutup"), p("b", "2026-03-01", "ditutup")];
    expect(pilihBawaan(daftar, "2026-09-14")?.slug).toBe("b");
  });
  it("falls back to the newest programme of any status", () => {
    const daftar = [p("a", "2026-01-01", "selesai"), p("b", "2026-03-01", "draft")];
    expect(pilihBawaan(daftar, "2026-09-14")?.slug).toBe("b");
  });
});
