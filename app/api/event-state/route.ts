import { NextResponse } from "next/server";
import { acaraUntukApi } from "@/lib/acara/pilih";
import { punyaAkses } from "@/lib/auth/sesi";

export const dynamic = "force-dynamic";

/**
 * Tiny endpoint so a scanner can learn the event is over without pulling the whole
 * manifest again. That is what triggers the phone to erase its offline copy.
 */
export async function GET(req: Request) {
  if (!(await punyaAkses("petugas"))) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const ev = await acaraUntukApi(req);
  if (!ev) return NextResponse.json({ error: "no event" }, { status: 404 });
  return NextResponse.json(
    { status: ev.status, slug: ev.slug },
    { headers: { "cache-control": "no-store" } },
  );
}
