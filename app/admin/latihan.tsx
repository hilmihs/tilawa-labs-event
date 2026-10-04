import Link from "next/link";
import { SLUG_LATIHAN } from "@/lib/latihan/data";
import { buangLatihan, siapkanLatihan } from "./latihan-actions";

const PESAN: Record<string, string> = {
  siap: "Practice programme ready: 1,000 dummy participants, 20 already scanned, waiting list closed.",
  hapus: "Practice programme deleted.",
  centang: "Tick the box first — resetting wipes every scan and walk-in permit from the last drill.",
  salah: "Type the slug exactly to delete.",
};

/** Admin card for the gate drill: create/reset or delete the dummy programme. */
export function KartuLatihan({ ada, pesan }: { ada: boolean; pesan?: string }) {
  return (
    <section className="card flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-[17px] font-semibold">Scanner practice (dummy data)</h2>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
          A hidden programme <code>{SLUG_LATIHAN}</code> with 1,000 fixed dummy participants matching the
          printed practice QR cards: normal seats, 20 already scanned, released seats, waiting list and
          deactivated tickets. Resetting puts it back to the start of a drill. No other programme is touched.
        </p>
      </div>
      {pesan && PESAN[pesan] ? (
        <p role="status" className="rounded-[8px] bg-[var(--color-surface)] px-4 py-3 text-[14px]">
          {PESAN[pesan]}
        </p>
      ) : null}
      {ada ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
          <Link className="font-medium text-brand underline" href={`/admin/${SLUG_LATIHAN}`}>Programme settings</Link>
          <Link className="font-medium text-brand underline" href={`/scan?acara=${SLUG_LATIHAN}`}>Scanner</Link>
          <Link className="font-medium text-brand underline" href={`/assist?acara=${SLUG_LATIHAN}`}>Help desk</Link>
          <Link className="font-medium text-brand underline" href={`/panel/ots?acara=${SLUG_LATIHAN}`}>Walk-in queue</Link>
          <Link className="font-medium text-brand underline" href={`/panel?acara=${SLUG_LATIHAN}`}>Dashboard</Link>
        </div>
      ) : null}
      <form action={siapkanLatihan} className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" name="yakin" />
          {ada ? "Wipe the last drill and start again" : "Create the practice programme"}
        </label>
        <button className="btn btn-primary">{ada ? "Reset practice" : "Create practice"}</button>
      </form>
      {ada ? (
        <form action={buangLatihan} className="flex flex-wrap items-center gap-3 border-t border-[var(--color-line)] pt-4">
          <input name="konfirmasi" className="field max-w-[220px]" placeholder={`type ${SLUG_LATIHAN}`} aria-label="Confirm slug" />
          <button className="btn btn-bahaya">Delete practice programme</button>
        </form>
      ) : null}
    </section>
  );
}
