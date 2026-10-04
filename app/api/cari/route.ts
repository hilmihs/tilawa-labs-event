import { NextResponse } from "next/server";
import { acaraUntukApi } from "@/lib/acara/pilih";
import { cariUntukBantuan } from "@/lib/acara/queries";
import { punyaAkses } from "@/lib/auth/sesi";

export const dynamic = "force-dynamic";

/**
 * The help desk's search, for the scanner's own box: a name, a participant number
 * or the last digits of a WhatsApp number, typed at the gate when the QR will not
 * read. Same query as /assist; the WhatsApp number itself never comes back.
 */
export async function GET(req: Request) {
  if (!(await punyaAkses("petugas"))) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const ev = await acaraUntukApi(req);
  if (!ev) return NextResponse.json({ error: "no event" }, { status: 404 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  const baris = await cariUntukBantuan(ev.id, q);
  return NextResponse.json(
    {
      hasil: baris.slice(0, 8).map((p) => ({
        id: p.id,
        nomor: p.nomor,
        nama: p.nama,
        gender: p.gender,
        aktif: p.aktif,
        jenis: p.jenis,
        urutOts: p.urutOts,
        izinOts: p.izinOtsAt !== null,
        konfirmasi: p.konfirmasi,
        scannedAt: p.scannedAt ? new Date(p.scannedAt).toISOString() : null,
        gate: p.gate,
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
