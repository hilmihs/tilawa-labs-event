import { NextResponse } from "next/server";
import { punyaAkses } from "@/lib/auth/sesi";
import { PERTANYAAN_CLUB, bacaJawaban, isMinat, namaMinat } from "@/lib/hub/konten";
import { semuaMinat } from "@/lib/hub/queries";

export const dynamic = "force-dynamic";

/** Club interest as a spreadsheet, for the committee session only (the /panel/club button). */
export async function GET() {
  if (!(await punyaAkses("panitia"))) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const rows = await semuaMinat();
  // One column per question any club asks, so the sheet can be filtered on them.
  const pertanyaan = Object.values(PERTANYAAN_CLUB).flat();
  const kolom = [
    "club",
    "nama",
    "gender",
    "wa",
    "email",
    "status_lipia",
    "prodi",
    "semester",
    "domisili",
    "minat_at",
    "batal_at",
    ...pertanyaan.map((q) => q.id),
  ];
  const baris = rows.map((r) => {
    const jawab = new Map(bacaJawaban(r.club, r.jawaban).map(({ q, a }) => [q.id, a]));
    return [
    isMinat(r.club) ? namaMinat(r.club, "en") : r.club,
    r.nama,
    r.gender,
    r.wa,
    r.email,
    r.statusLipia ?? "",
    r.prodi ?? "",
    r.semester ?? "",
    r.domisili ?? "",
    r.createdAt.toISOString(),
    r.batalAt?.toISOString() ?? "",
    ...pertanyaan.map((q) => jawab.get(q.id) ?? ""),
  ];
  });
  // Same guard as /api/export: free-text cells must not turn into Excel formulas.
  const sel = (c: unknown) => {
    const v = String(c);
    const bahaya = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${bahaya.replace(/"/g, '""')}"`;
  };
  const csvText = [kolom, ...baris].map((r) => r.map(sel).join(",")).join("\n");
  return new NextResponse("﻿" + csvText, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="minat-club-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
