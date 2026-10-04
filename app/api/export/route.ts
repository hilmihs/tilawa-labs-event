import { NextResponse } from "next/server";
import { semuaKehadiranExport, semuaPesertaExport } from "@/lib/acara/queries";
import { acaraUntukApi } from "@/lib/acara/pilih";
import { punyaAkses } from "@/lib/auth/sesi";
import { bearerCocok, kepalaAcara } from "@/lib/acara/ekspor";

export const dynamic = "force-dynamic";

/**
 * Pull endpoint for the other dashboard. If this site goes down, that dashboard
 * still shows the last data it managed to pull.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const csv = url.searchParams.get("format") === "csv";

  // Bearer for machines; a signed committee session for the CSV button in /panel.
  const lewatBearer = bearerCocok(req.headers.get("authorization"));
  const lewatSesi = csv ? Boolean(await punyaAkses("panitia")) : false;
  if (!lewatBearer && !lewatSesi) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const ev = await acaraUntukApi(req);
  if (!ev) return NextResponse.json({ error: "no event" }, { status: 404 });

  const [peserta, kehadiran] = await Promise.all([
    semuaPesertaExport(ev.id),
    semuaKehadiranExport(ev.id),
  ]);

  if (csv) {
    const hadirPeta = new Map(kehadiran.map((k) => [k.pesertaId, k]));
    const kolom = [
      "nomor",
      "nama",
      "gender",
      "wa",
      "status_lipia",
      "nim",
      "prodi",
      "sesi",
      "semester",
      "tahun_lulus",
      "domisili",
      "asal_daerah",
      "asal_sekolah",
      "keahlian",
      "transportasi",
      "kebutuhan_khusus",
      "email",
      "jenis",
      "sumber",
      "aktif",
      "batal_hadir",
      "terdaftar_at",
      "grup_wa_at",
      "urut_ots",
      "izin_ots_at",
      "tiket_dibuka_at",
      "scanned_at",
      "gate",
      "metode",
    ];
    const baris = peserta.map((p) => {
      const h = hadirPeta.get(p.id);
      return [
        p.nomor,
        p.nama,
        p.gender,
        p.wa,
        p.statusLipia ?? "",
        p.nim ?? "",
        p.prodi ?? "",
        p.sesi ?? "",
        p.semester ?? "",
        p.tahunLulus ?? "",
        p.domisili ?? "",
        p.asalDaerah ?? "",
        p.asalSekolah ?? "",
        p.keahlian ?? "",
        p.transportasi ?? "",
        p.kebutuhanKhusus ?? "",
        p.email ?? "",
        p.jenis,
        p.sumber,
        String(p.aktif),
        p.konfirmasi === false ? "ya" : "",
        p.createdAt.toISOString(),
        p.grupWaAt?.toISOString() ?? "",
        p.urutOts ?? "",
        p.izinOtsAt?.toISOString() ?? "",
        p.tiketDibukaAt?.toISOString() ?? "",
        (h?.clientScannedAt ?? h?.scannedAt)?.toISOString() ?? "",
        h?.gate ?? "",
        h?.metode ?? "",
      ];
    });
    // The ticket code is deliberately absent from the CSV: it is the QR payload,
    // and a spreadsheet in a WhatsApp group is not where it should live.
    // Names, districts and notes are free text from a public form. A cell that
    // starts with = + - @ (or a tab/CR) becomes a live formula when the committee
    // opens this in Excel, so it is neutralised with a leading apostrophe.
    const sel = (c: unknown) => {
      const v = String(c);
      const bahaya = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
      return `"${bahaya.replace(/"/g, '""')}"`;
    };
    const csvText = [kolom, ...baris].map((r) => r.map(sel).join(",")).join("\n");
    return new NextResponse("﻿" + csvText, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${ev.slug}-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
        "cache-control": "no-store",
      },
    });
  }

  return NextResponse.json(
    {
      acara: kepalaAcara(ev),
      diambilAt: new Date().toISOString(),
      peserta,
      kehadiran,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
