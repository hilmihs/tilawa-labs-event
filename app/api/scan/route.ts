import { NextResponse } from "next/server";
import { acaraUntukApi } from "@/lib/acara/pilih";
import { catatKehadiran, type InputPindai } from "@/lib/kehadiran/catat";
import { punyaAkses } from "@/lib/auth/sesi";

export const dynamic = "force-dynamic";

type Body = { pindai: InputPindai[] };

/**
 * Accepts one scan or a whole offline queue in a single call. Duplicates are
 * harmless by construction: the attendance PK is peserta_id, so replaying a queue
 * can never double-count anyone.
 */
export async function POST(req: Request) {
  const sesi = await punyaAkses("petugas");
  if (!sesi) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const ev = await acaraUntukApi(req);
  if (!ev) return NextResponse.json({ error: "no event" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Body | null;
  const antrean = Array.isArray(body?.pindai) ? body.pindai.slice(0, 500) : [];
  if (antrean.length === 0) return NextResponse.json({ hasil: [] });

  const hasil = [];
  for (const p of antrean) {
    try {
      hasil.push(
        await catatKehadiran(ev.id, {
          ...p,
          petugas: p.petugas ?? (sesi.nama || null),
          // The one thing the phone decides is `offline`: a queued scan records an
          // entry already made at the door against the offline list (see
          // catatKehadiran). That list applies the same walk-in rule, and this
          // endpoint needs a staff session anyway.
        }),
      );
    } catch {
      hasil.push({ keadaan: "gagal" as const, kode: p.kode });
    }
  }

  return NextResponse.json({ hasil });
}
