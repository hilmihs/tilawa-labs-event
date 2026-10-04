import { redirect } from "next/navigation";
import { Scanner } from "./scanner";
import { PilihAcara } from "@/components/pilih-acara";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { punyaAkses } from "@/lib/auth/sesi";
import { keGate } from "@/lib/auth/tujuan";

export const dynamic = "force-dynamic";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ acara?: string }>;
}) {
  const sp = await searchParams;
  const sesi = await punyaAkses("petugas");
  if (!sesi) redirect(keGate("/scan", sp.acara));
  const ev = await acaraUntukStaf(sp.acara);
  /*
   * The picker bar and the scanner share one viewport height instead of stacking
   * past it: a scanner that scrolls means the usher's thumb moves the screen while
   * they are aiming the camera, and the full-bleed result screens slide half out of
   * view. The bar takes what it needs, the scanner takes the rest.
   */
  return (
    <div className="flex h-dvh flex-col">
      <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--color-line)] bg-white px-4 py-2">
        <span className="min-w-0 truncate text-[13px] text-[var(--color-ink-3)]">{ev ? ev.nama : "No programme"}</span>
        <PilihAcara sekarang={ev} next="/scan" />
      </div>
      <div className="min-h-0 flex-1">
        <Scanner namaSesi={sesi.nama} slugPilihan={ev?.slug ?? null} />
      </div>
    </div>
  );
}
