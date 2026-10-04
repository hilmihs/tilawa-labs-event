import { NextResponse } from "next/server";
import { acaraUntukApi } from "@/lib/acara/pilih";
import { ambilPesertaById } from "@/lib/acara/queries";
import { catatKehadiran } from "@/lib/kehadiran/catat";
import { punyaAkses } from "@/lib/auth/sesi";

export const dynamic = "force-dynamic";

type Body = { pesertaId?: string; gate?: string | null; petugas?: string | null; clientScannedAt?: string | null };

/**
 * Marks one participant present by id — the scanner's "Let in" after a search by
 * name. Goes through the same `catatKehadiran` as a QR scan, so an unpermitted
 * walk-in still comes back WALK-IN and a released seat NOT VALID: the box at the
 * gate must not be a way round the rules the camera applies.
 */
export async function POST(req: Request) {
  const sesi = await punyaAkses("petugas");
  if (!sesi) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const ev = await acaraUntukApi(req);
  if (!ev) return NextResponse.json({ error: "no event" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Body | null;
  const id = typeof body?.pesertaId === "string" ? body.pesertaId : "";
  const p = id ? await ambilPesertaById(id) : null;
  // Wrong programme reads the same as unknown — the scanner never learns the code.
  if (!p || p.acaraId !== ev.id) {
    return NextResponse.json({ hasil: { keadaan: "merah", kode: "" } });
  }

  const hasil = await catatKehadiran(ev.id, {
    kode: p.kode,
    gate: body?.gate ?? null,
    petugas: body?.petugas ?? (sesi.nama || null),
    metode: "nama",
    clientScannedAt: body?.clientScannedAt ?? null,
  });
  // Strip the code from the reply: a search must not hand out working QR payloads.
  const aman = hasil.keadaan === "merah" ? { keadaan: "merah" as const, kode: "" } : hasil;
  return NextResponse.json({ hasil: aman });
}
