import { NextResponse } from "next/server";
import { punyaAkses } from "@/lib/auth/sesi";
import { acaraUntukApi } from "@/lib/acara/pilih";
import { t } from "@/lib/i18n/dict";
import { daftarAbsen } from "@/lib/absen/queries";
import { basisSitus, linkAbsen } from "@/lib/absen/tautan";
import { barisWaAbsen } from "@/lib/absen/wa";
import { catatanUntuk } from "@/lib/catatan/kajian";

export const dynamic = "force-dynamic";

/** The /panel/absen table as a spreadsheet, committee session only. */
export async function GET(req: Request) {
  if (!(await punyaAkses("panitia"))) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const ev = await acaraUntukApi(req);
  if (!ev) return NextResponse.json({ error: "no event" }, { status: 404 });

  // Same guard as /api/export: free-text cells must not turn into Excel formulas.
  const sel = (c: unknown) => {
    const v = String(c);
    const bahaya = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${bahaya.replace(/"/g, '""')}"`;
  };
  const tanggal = new Date().toISOString().slice(0, 10);

  /*
   * ?format=wa — the list the committee's sender works through, one private message
   * per row: only no-shows who have not answered, the number in 62… form, and the
   * message already written with the link in it. The lecture's own title when it has
   * notes, since that is what people registered for.
   */
  if (new URL(req.url).searchParams.get("format") === "wa") {
    const judul = catatanUntuk(ev.slug)?.judul.en || ev.judul || ev.nama;
    const link = linkAbsen(basisSitus(), "ar", ev.slug);
    const wa = barisWaAbsen(await daftarAbsen(ev.id), { judul, link });
    const teks = [["wa", "nama", "gender", "pesan"], ...wa.map((r) => [r.wa, r.nama, r.gender, r.pesan])]
      .map((r) => r.map(sel).join(","))
      .join("\n");
    return new NextResponse("﻿" + teks, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="wa-tidak-hadir-${ev.slug}-${tanggal}.csv"`,
        "cache-control": "no-store",
      },
    });
  }

  const L = t("en").absen;
  const label = <T extends Record<string, string>>(m: T, xs: string[] | null) =>
    (xs ?? []).map((k) => m[k] ?? k).join("; ");
  const kolom = [
    "nomor", "nama", "gender", "wa", "email", "alasan", "alasan_lain", "waktu_cocok",
    "pengingat", "mau_online", "saran", "kabari", "email_at", "wa_at", "dibuka_at", "diisi_at",
  ];
  const rows = await daftarAbsen(ev.id);
  const baris = rows.map((r) => [
    r.nomor,
    r.nama,
    r.gender,
    r.wa,
    r.email ?? "",
    label(L.alasan, r.alasan),
    r.alasanLain ?? "",
    label(L.waktu, r.waktuCocok),
    label(L.pengingat, r.pengingat),
    r.mauOnline === null ? "" : r.mauOnline ? "yes" : "no",
    r.saran ?? "",
    r.kabari ? "yes" : "no",
    r.emailAt?.toISOString() ?? "",
    r.waAt?.toISOString() ?? "",
    r.dibukaAt?.toISOString() ?? "",
    r.diisiAt?.toISOString() ?? "",
  ]);
  const csvText = [kolom, ...baris].map((r) => r.map(sel).join(",")).join("\n");
  return new NextResponse("﻿" + csvText, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="tidak-hadir-${ev.slug}-${tanggal}.csv"`,
      "cache-control": "no-store",
    },
  });
}
