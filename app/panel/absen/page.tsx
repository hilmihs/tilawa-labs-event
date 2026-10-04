import { redirect } from "next/navigation";
import { keGate } from "@/lib/auth/tujuan";
import { StaffNav } from "@/components/staff-nav";
import { PilihAcara } from "@/components/pilih-acara";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { punyaAkses } from "@/lib/auth/sesi";
import { t } from "@/lib/i18n/dict";
import { PENGINGAT, WAKTU } from "@/lib/absen/alasan";
import { daftarAbsen } from "@/lib/absen/queries";
import { rekapAbsen } from "@/lib/absen/rekap";
import { basisSitus, linkAbsen } from "@/lib/absen/tautan";
import { formatTanggal } from "@/lib/waktu";

export const dynamic = "force-dynamic";

/*
 * Who registered and did not come, and what they told us. Names are visible on
 * purpose — the committee asked for them — and the recap above the table is grouped
 * so the answer to "why" reads at a glance.
 *
 * WhatsApp is not sent from here: it goes out from the committee number with an
 * approved template, outside this app. Sorted with the unanswered first, the people
 * still worth a reminder.
 */
const L = t("en").absen;

export default async function PanelAbsen({ searchParams }: { searchParams: Promise<{ acara?: string }> }) {
  const { acara } = await searchParams;
  const sesi = await punyaAkses("panitia");
  if (!sesi) redirect(keGate("/panel/absen", acara));
  const ev = await acaraUntukStaf(acara);
  if (!ev) return <main className="p-10">No event configured.</main>;

  const rows = await daftarAbsen(ev.id);
  const r = rekapAbsen(rows);
  const urut = [...rows].sort((a, b) => Number(Boolean(a.diisiAt)) - Number(Boolean(b.diisiAt)));
  const unduh = `/api/export/absen?acara=${encodeURIComponent(ev.slug)}`;
  const persen = (n: number) => (r.funnel.absen ? Math.round((n / r.funnel.absen) * 100) : 0);
  const maksKelompok = Math.max(1, ...r.kelompok.map((k) => k.orang));

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <StaffNav
        current="absen"
        nama={sesi.nama}
        acara={ev.slug}
        peran={sesi.peran}
        pilih={<PilihAcara sekarang={ev} next="/panel/absen" />}
      />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-5 pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight">No-shows · {ev.nama}</h1>
            <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">
              Registered, active, never scanned (walk-ins only if they were let in).
              {ev.status !== "selesai" ? " The programme is not marked finished yet, so the link still leads to the programme page." : ""}
            </p>
            {/* The one link the WhatsApp template carries — shown so nobody has to build it by hand. */}
            <p className="mt-1 break-all text-[13px] text-[var(--color-ink-2)]">
              Link: <span className="font-mono">{linkAbsen(basisSitus(), "ar", ev.slug)}</span> ·{" "}
              <span className="font-mono">{linkAbsen(basisSitus(), "en", ev.slug)}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={unduh} className="btn btn-ghost h-10 text-[13px]">
              Download CSV
            </a>
            <a href={`${unduh}&format=wa`} className="btn btn-ghost h-10 text-[13px]">
              Download WA list
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["No-shows", r.funnel.absen],
              ["Emailed", r.funnel.diemail],
              ["Answered", r.funnel.mengisi],
            ] as const
          ).map(([label, n]) => (
            <div key={label} className="card p-5">
              <div className="text-[13px] text-[var(--color-ink-3)]">{label}</div>
              <div className="mt-2 text-[32px] font-bold leading-none tabular-nums">{n}</div>
              <div className="mt-1 text-[13px] text-[var(--color-ink-2)]">{persen(n)}%</div>
            </div>
          ))}
        </div>

        <section className="card p-5">
          <h2 className="text-[17px] font-semibold">Why they did not come</h2>
          <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">
            Out of {r.funnel.mengisi} answers. A group counts people; the reasons inside it count ticks, so they can add
            up to more.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {r.kelompok.map((k) => (
              <div key={k.kelompok}>
                <div className="flex items-center gap-3">
                  <div className="w-[160px] text-[14px] font-semibold">{L.kelompok[k.kelompok]}</div>
                  <div className="h-3 flex-1 rounded-full bg-[var(--color-surface)]">
                    <div className="h-3 rounded-full bg-brand" style={{ width: `${(k.orang / maksKelompok) * 100}%` }} />
                  </div>
                  <div className="w-10 text-right tabular-nums">{k.orang}</div>
                </div>
                <div className="ml-[172px] mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--color-ink-2)]">
                  {k.alasan.filter((a) => a.jumlah > 0).map((a) => (
                    <span key={a.kunci}>
                      {L.alasan[a.kunci]} <b className="tabular-nums">{a.jumlah}</b>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card grid gap-5 p-5 sm:grid-cols-3">
          <div>
            <h3 className="text-[14px] font-semibold">{L.waktuJudul}</h3>
            <ul className="mt-2 text-[13px]">
              {WAKTU.map((k) => <li key={k}>{L.waktu[k]} <b className="tabular-nums">{r.waktu[k]}</b></li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold">{L.pengingatJudul}</h3>
            <ul className="mt-2 text-[13px]">
              {PENGINGAT.map((k) => <li key={k}>{L.pengingat[k]} <b className="tabular-nums">{r.pengingat[k]}</b></li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold">Recording / live stream</h3>
            <p className="mt-2 text-[13px]">Yes <b>{r.online.ya}</b> · No <b>{r.online.tidak}</b></p>
            <h3 className="mt-4 text-[14px] font-semibold">Want to hear about the next one</h3>
            <p className="mt-2 text-[13px]"><b>{r.kabari}</b></p>
          </div>
        </section>

        <section className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-[14px]">
            <thead className="bg-[var(--color-surface)] text-left text-[12px] uppercase text-[var(--color-ink-3)]">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Side</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Reasons</th>
                <th className="px-4 py-2">Suggestion</th>
              </tr>
            </thead>
            <tbody>
              {urut.map((row) => (
                <tr key={row.pesertaId} className="border-t border-[var(--color-line)] align-top">
                  <td className="px-4 py-2">
                    <div className="font-medium">{row.nama}</div>
                    <div className="text-[12px] text-[var(--color-ink-3)]">{row.nomor}</div>
                  </td>
                  <td className="px-4 py-2">{row.gender === "akhwat" ? "Sister" : "Brother"}</td>
                  <td className="px-4 py-2 text-[13px] text-[var(--color-ink-2)]">
                    {row.diisiAt ? `Answered ${formatTanggal(row.diisiAt, "en")}` : row.emailAt ? "Emailed" : "—"}
                  </td>
                  <td className="max-w-[280px] px-4 py-2 text-[13px]">
                    {(row.alasan ?? []).map((k) => L.alasan[k as keyof typeof L.alasan] ?? k).join(", ")}
                    {row.alasanLain ? <div dir="auto" className="text-[var(--color-ink-2)]">“{row.alasanLain}”</div> : null}
                  </td>
                  <td dir="auto" className="max-w-[280px] px-4 py-2 text-[13px] text-[var(--color-ink-2)]">{row.saran}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
