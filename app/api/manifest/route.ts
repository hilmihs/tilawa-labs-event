import { NextResponse } from "next/server";
import { manifesOffline } from "@/lib/acara/queries";
import { acaraUntukApi } from "@/lib/acara/pilih";
import { punyaAkses } from "@/lib/auth/sesi";

export const dynamic = "force-dynamic";

const BERLAKU_HARI = 3;

/**
 * The offline manifest, downloaded with the usher's code. Four columns only —
 * code, number, first name, gender. A lost phone must not carry a directory of
 * student numbers or WhatsApp numbers.
 */
export async function GET(req: Request) {
  const sesi = await punyaAkses("petugas");
  if (!sesi) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const ev = await acaraUntukApi(req);
  if (!ev) return NextResponse.json({ error: "no event" }, { status: 404 });

  const daftar = await manifesOffline(ev.id);
  const kedaluwarsa = new Date(Date.now() + BERLAKU_HARI * 24 * 60 * 60 * 1000).toISOString();

  return NextResponse.json(
    {
      slug: ev.slug,
      status: ev.status,
      diambilAt: new Date().toISOString(),
      kedaluwarsa,
      jumlah: daftar.length,
      daftar,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
