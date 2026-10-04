import { NextResponse } from "next/server";
import { acaraUntukApi } from "@/lib/acara/pilih";
import { ambilPesertaById, kehadiranPeserta } from "@/lib/acara/queries";
import { catatKehadiranLangsung, keterangan } from "@/lib/kehadiran/catat";
import { punyaAkses } from "@/lib/auth/sesi";

export const dynamic = "force-dynamic";

type Body = { pesertaId?: string; gate?: string | null; petugas?: string | null };

/**
 * Lets a walk-in in from the gate itself, permit and all.
 *
 * The committee permits in bulk from /panel/ots, but the person is often already
 * standing at the gate when the decision is made — sending them round to the help
 * desk for a tap the usher could do is a queue for nothing. `catatKehadiranLangsung`
 * stamps `izin_ots_at` when it admits a walk-in still in the queue, so this is the
 * same decision the desk makes, recorded the same way.
 *
 * Deliberately a separate endpoint from /api/hadir: that one applies the gate's
 * rules and must keep refusing an unpermitted walk-in. Permitting is an explicit
 * act by a member of staff, never a side effect of a scan.
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
  if (!p || p.acaraId !== ev.id || !p.aktif) {
    return NextResponse.json({ hasil: { keadaan: "merah", kode: "" } });
  }

  const hasil = await catatKehadiranLangsung(ev.id, p.id, {
    gate: body?.gate ?? null,
    petugas: body?.petugas ?? (sesi.nama || null),
    metode: "manual",
  });

  if (hasil === "merah") return NextResponse.json({ hasil: { keadaan: "merah", kode: "" } });
  const umum = { nomor: p.nomor, nama: p.nama, gender: p.gender, keterangan: keterangan(p) };
  if (hasil === "hijau") return NextResponse.json({ hasil: { keadaan: "hijau", ...umum } });

  // Already through: the usher needs the same "already scanned" answer a second scan
  // gives, with the real first time — not a second green.
  const ada = await kehadiranPeserta(p.id);
  return NextResponse.json({
    hasil: {
      keadaan: "kuning",
      ...umum,
      pertamaAt: (ada?.clientScannedAt ?? ada?.scannedAt ?? new Date()).toISOString(),
      pertamaGate: ada?.gate ?? null,
    },
  });
}
