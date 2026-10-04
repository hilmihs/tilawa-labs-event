import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { PilihAcara } from "@/components/pilih-acara";
import { GateLog } from "./gate-log";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { punyaAkses } from "@/lib/auth/sesi";
import { keGate } from "@/lib/auth/tujuan";
import { pemindaianTerakhir, ringkasGate } from "@/lib/acara/queries";
import { GATES, labelGender, labelMetode } from "@/lib/acara/view-model";
import { formatAngka, formatJam } from "@/lib/waktu";

export const dynamic = "force-dynamic";

const BARIS = 200;

/**
 * One station's log: every ticket this gate has let in, newest first, refreshed every
 * five seconds.
 *
 * It is the second half of the scanner. The scanner is held up at arm's length and
 * shows one result at a time; this is the page left open on the desk beside it, so the
 * station can answer "did he already come through?" and "how many have we let in?"
 * without asking the dashboard — and it reads the same rows the dashboard does.
 */
export default async function LogScanPage({
  searchParams,
}: {
  searchParams: Promise<{ acara?: string; gate?: string }>;
}) {
  const sp = await searchParams;
  const sesi = await punyaAkses("petugas");
  if (!sesi) redirect(keGate("/scan/log", sp.acara));
  const ev = await acaraUntukStaf(sp.acara);
  // "semua" is the explicit choice of every gate; an unknown value is treated the same,
  // and no value at all lets the phone fill in the gate it already remembers.
  const gate = sp.gate && (GATES as readonly string[]).includes(sp.gate) ? sp.gate : null;

  if (!ev) {
    return <main className="p-10">No event configured.</main>;
  }

  const [baris, r] = await Promise.all([
    pemindaianTerakhir(ev.id, BARIS, gate),
    ringkasGate(ev.id, gate),
  ]);

  const qs = gate ? `?acara=${encodeURIComponent(ev.slug)}&gate=${gate}` : `?acara=${encodeURIComponent(ev.slug)}`;

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <AutoRefresh detik={5} />
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] bg-white px-5 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link href={`/scan${qs}`} className="btn btn-ghost h-9 px-3 text-[13px]">
            ← Scanner
          </Link>
          <span className="text-[15px] font-semibold">Scan log · {gate ?? "all gates"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-[var(--color-ink-3)]">
          <PilihAcara sekarang={ev} next="/scan/log" />
          <span>{sesi.nama}</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-5 pt-5">
        <GateLog gate={gate} acara={ev.slug} />

        <div className="grid gap-3 sm:grid-cols-3">
          <Angka label={gate ? `Let in at ${gate}` : "Let in, all gates"} nilai={formatAngka(r.total, "en")} />
          <Angka label="In the last 5 minutes" nilai={formatAngka(r.limaMenit, "en")} />
          <Angka
            label="Last scan"
            nilai={r.terakhir ? formatJam(r.terakhir, "en") : "—"}
            catatan={r.terakhir ? "WIB" : "nothing yet"}
          />
        </div>

        <section className="card overflow-hidden p-0">
          <div className="flex items-baseline justify-between px-5 py-4">
            <h2 className="text-[17px] font-semibold leading-[1.3]">Scans, newest first</h2>
            <span className="text-[13px] text-[var(--color-ink-3)]">
              {baris.length >= BARIS ? `last ${BARIS}` : `${baris.length} shown`} · refreshes every 5 s
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[15px]">
              <thead>
                <tr className="border-y border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs font-semibold tracking-[0.06em] text-[var(--color-ink-2)]">
                  <th className="px-5 py-2.5">TIME</th>
                  <th className="px-5 py-2.5">NUMBER</th>
                  <th className="px-5 py-2.5">NAME</th>
                  <th className="px-5 py-2.5">SIDE</th>
                  {gate ? null : <th className="px-5 py-2.5">GATE</th>}
                  <th className="px-5 py-2.5">METHOD</th>
                  <th className="px-5 py-2.5">BY</th>
                </tr>
              </thead>
              <tbody>
                {baris.map((t) => (
                  <tr key={`${t.nomor}-${String(t.at)}`} className="border-b border-[var(--color-line)]">
                    <td className="px-5 py-3 tabular-nums text-[var(--color-ink-2)]">{formatJam(new Date(t.at), "en")}</td>
                    <td className="px-5 py-3 tabular-nums">{t.nomor}</td>
                    <td className="px-5 py-3 font-medium">{t.nama}</td>
                    <td className="px-5 py-3 text-[var(--color-ink-2)]">{labelGender(t.gender, "en")}</td>
                    {gate ? null : <td className="px-5 py-3 text-[var(--color-ink-2)]">{t.gate ?? "—"}</td>}
                    <td className="px-5 py-3 text-[var(--color-ink-2)]">
                      {labelMetode(t.metode)}
                      {t.offline ? " · offline" : ""}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-ink-2)]">{t.petugas ?? "—"}</td>
                  </tr>
                ))}
                {baris.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[var(--color-ink-3)]">
                      No scans at this gate yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-[13px] text-[var(--color-ink-3)]">
          Offline scans appear here once the phone that took them syncs. A ticket that was already scanned does not add a
          row — its first scan is the one listed.
        </p>
      </div>
    </main>
  );
}

function Angka({ label, nilai, catatan }: { label: string; nilai: string; catatan?: string }) {
  return (
    <div className="card p-5">
      <div className="text-[13px] text-[var(--color-ink-3)]">{label}</div>
      <div className="mt-2 text-[32px] font-bold leading-none tabular-nums">{nilai}</div>
      {catatan ? <div className="mt-2 text-[13px] text-[var(--color-ink-2)]">{catatan}</div> : null}
    </div>
  );
}
