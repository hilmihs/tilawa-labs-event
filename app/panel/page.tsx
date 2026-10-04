import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffNav } from "@/components/staff-nav";
import { TabPanel } from "@/components/tab-panel";
import { AutoRefresh } from "@/components/auto-refresh";
import { punyaAkses } from "@/lib/auth/sesi";
import { hadirPerGate, jumlahBatal, pemindaianTerakhir, ringkasanAcara, waktuKedatangan } from "@/lib/acara/queries";
import { jumlahOtsMenunggu } from "@/lib/acara/ots";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { PilihAcara } from "@/components/pilih-acara";
import { ambangTiketDibuka, lajuKedatangan, persenAman } from "@/lib/kehadiran/view-model";
import { kuotaEfektif, labelMetode, labelStatusAcara } from "@/lib/acara/view-model";
import { formatAngka, formatJam, formatTanggalIso } from "@/lib/waktu";

export const dynamic = "force-dynamic";

const WARNA_AMBANG = {
  aman: "text-brand",
  waspada: "text-[var(--color-warn)]",
  bahaya: "text-[var(--color-danger)]",
} as const;

export default async function Panel({
  searchParams,
}: {
  searchParams: Promise<{ acara?: string }>;
}) {
  const sesi = await punyaAkses("panitia");
  if (!sesi) redirect("/gate?next=%2Fpanel");

  const sp = await searchParams;
  const ev = await acaraUntukStaf(sp.acara);
  if (!ev) return <main className="p-10">No event configured.</main>;

  const [r, waktu, terakhir, perGate, otsMenunggu, batal] = await Promise.all([
    ringkasanAcara(ev.id),
    waktuKedatangan(ev.id),
    pemindaianTerakhir(ev.id, 20),
    hadirPerGate(ev.id),
    jumlahOtsMenunggu(ev.id),
    jumlahBatal(ev.id),
  ]);

  const batang = lajuKedatangan(waktu, "en");
  const puncak = Math.max(1, ...batang.map((b) => b.jumlah));
  const ambang = ambangTiketDibuka(r.tiketDibuka, r.pendaftar);
  const hadirPersen = persenAman(r.hadir, r.pendaftar);

  return (
    <main className="min-h-dvh bg-[var(--color-surface)]">
      {/* Numbers must move in under five seconds after a scan. */}
      <AutoRefresh detik={5} />

      <StaffNav
        current="panel"
        nama={sesi.nama}
        acara={ev.slug}
        pilih={<PilihAcara sekarang={ev} next="/panel" />}
      />
      <TabPanel aktif="live" acara={ev.slug} />

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
        <div>
          <div className="text-[19px] font-semibold leading-none">{ev.nama}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-[var(--color-ink-3)]">
            <span>
              {formatTanggalIso(ev.tanggal, "en")} · {ev.lokasi}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`h-[7px] w-[7px] rounded-full ${
                  ev.status === "berlangsung" ? "bg-brand" : "bg-[var(--color-ink-3)]"
                }`}
              />
              <span className="font-medium text-[var(--color-ink-2)]">{labelStatusAcara(ev.status)}</span>
            </span>
            {r.hadirTerakhir ? <span>· last scan {formatJam(r.hadirTerakhir, "en")}</span> : null}
            <span>· refreshes every 5 s</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/print?acara=${ev.slug}`} className="btn btn-ghost h-10 text-[13px]">
            Print list
          </Link>
          <a href={`/api/export?format=csv&acara=${ev.slug}`} className="btn btn-ghost h-10 text-[13px]">
            Download CSV
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kartu label="Registered" nilai={formatAngka(r.pendaftar, "en")}>
            {[
              kuotaEfektif(ev) ? `Quota ${formatAngka(kuotaEfektif(ev) ?? 0, "en")}` : null,
              otsMenunggu > 0 ? `${formatAngka(otsMenunggu, "en")} walk-ins waiting` : null,
              batal > 0 ? `${formatAngka(batal, "en")} released their seat` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Kartu>

          {/*
            The one number that warns before the problem happens, while there is
            still time to do something about it.
          */}
          <div className="card p-5">
            <div className="text-[13px] text-[var(--color-ink-3)]">Opened their ticket</div>
            <div className={`mt-2.5 text-[34px] font-bold leading-[1.1] ${WARNA_AMBANG[ambang.tingkat]}`}>
              {ambang.persen.toFixed(1)}%
            </div>
            <div className="mt-1.5 text-[13px] leading-[1.4] text-[var(--color-ink-2)]">
              {formatAngka(r.tiketDibuka, "en")} of {formatAngka(r.pendaftar, "en")} ·{" "}
              {ambang.pesan}
            </div>
          </div>

          <div className="card p-5">
            <div className="text-[13px] text-[var(--color-ink-3)]">Arrived</div>
            <div className="mt-2.5 text-[34px] font-bold leading-[1.1] text-brand">
              {formatAngka(r.hadir, "en")}
            </div>
            <div className="mt-1.5 text-[13px] leading-[1.4] text-[var(--color-ink-2)]">
              {hadirPersen.toFixed(1)}% ·{" "}
              {/* Not just how many are missing, but a way to see who. */}
              <Link href={`/panel/list?hadir=belum&acara=${ev.slug}`} className="font-medium text-brand underline">
                {formatAngka(Math.max(0, r.pendaftar - r.hadir), "en")} still to come
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <div className="text-[13px] text-[var(--color-ink-3)]">Brothers / Sisters</div>
            <div className="mt-2.5 text-[34px] font-bold leading-[1.1]">
              {formatAngka(r.ikhwan, "en")} / {formatAngka(r.akhwat, "en")}
            </div>
            <div className="mt-3 flex h-1.5 overflow-hidden rounded-[3px]">
              <div
                className="bg-brand"
                style={{ width: `${persenAman(r.ikhwan, Math.max(1, r.pendaftar))}%` }}
              />
              <div
                className="bg-brand-200"
                style={{ width: `${persenAman(r.akhwat, Math.max(1, r.pendaftar))}%` }}
              />
            </div>
            <div className="mt-2 text-[13px] text-[var(--color-ink-2)]">
              arrived {formatAngka(r.hadirIkhwan, "en")} / {formatAngka(r.hadirAkhwat, "en")}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-semibold leading-[1.3]">Arrival rate, per 5 minutes</h2>
            <span className="text-[13px] text-[var(--color-ink-3)]">
              {batang.length
                ? `${batang[0].label} – ${batang[batang.length - 1].label} WIB · peak ${puncak}`
                : "No arrivals yet"}
            </span>
          </div>

          {batang.length ? (
            <>
              {/* Bars keep a sane width: one arrival must not become a full-width slab. */}
              <div className="mt-4 flex h-[160px] items-end gap-2">
                {batang.map((b) => (
                  <div
                    key={b.kunci}
                    className="flex h-full max-w-[72px] flex-1 flex-col justify-end"
                  >
                    {/* Direct label on the tallest bar only. No legend, one colour. */}
                    {b.puncak ? (
                      <div className="mb-1.5 text-center text-xs font-semibold">{b.jumlah}</div>
                    ) : null}
                    <div
                      className="rounded-t-[3px] bg-brand"
                      style={{ height: `${Math.max(2, (b.jumlah / puncak) * 132)}px` }}
                      title={`${b.label} · ${b.jumlah}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-[var(--color-line)] pt-2">
                {batang.map((b, i) => (
                  <div
                    key={b.kunci}
                    className="max-w-[72px] flex-1 text-center text-[11px] text-[var(--color-ink-3)]"
                  >
                    {i % 2 === 0 ? b.label : ""}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {perGate.length > 0 ? (
          <div className="card p-5">
            <h2 className="text-[17px] font-semibold leading-[1.3]">Arrivals by gate</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {perGate.map((g) => (
                <span
                  key={g.gate ?? "none"}
                  className="rounded-[8px] border border-[var(--color-line)] bg-white px-3 py-1.5 text-[14px]"
                >
                  <span className="font-semibold">{g.gate ?? "—"}</span>{" "}
                  <span className="text-[var(--color-ink-2)]">{formatAngka(g.n, "en")}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="card overflow-hidden">
          <div className="flex items-baseline justify-between px-5 py-4">
            <h2 className="text-[17px] font-semibold leading-[1.3]">Last scanned</h2>
            <span className="text-[13px] text-[var(--color-ink-3)]">
              {terakhir.length} of {formatAngka(r.hadir, "en")}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[15px]">
              <thead>
                <tr className="border-y border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs font-semibold tracking-[0.06em] text-[var(--color-ink-2)]">
                  <th className="px-5 py-2.5">TIME</th>
                  <th className="px-5 py-2.5">NUMBER</th>
                  <th className="px-5 py-2.5">NAME</th>
                  <th className="px-5 py-2.5">GATE</th>
                  <th className="px-5 py-2.5">METHOD</th>
                </tr>
              </thead>
              <tbody>
                {terakhir.map((t) => (
                  <tr key={`${t.nomor}-${String(t.at)}`} className="border-b border-[var(--color-line)]">
                    <td className="px-5 py-3 text-[var(--color-ink-2)]">
                      {formatJam(new Date(t.at), "en")}
                    </td>
                    <td className="px-5 py-3">{t.nomor}</td>
                    <td className="px-5 py-3">{t.nama}</td>
                    <td className="px-5 py-3 text-[var(--color-ink-2)]">{t.gate ?? "—"}</td>
                    <td className="px-5 py-3 text-[var(--color-ink-2)]">
                      {labelMetode(t.metode)}
                      {t.offline ? " · offline" : ""}
                    </td>
                  </tr>
                ))}
                {terakhir.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-[var(--color-ink-3)]">
                      Nobody has been scanned yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function Kartu({
  label,
  nilai,
  hijau = false,
  children,
}: {
  label: string;
  nilai: string;
  hijau?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="text-[13px] text-[var(--color-ink-3)]">{label}</div>
      <div className={`mt-2.5 text-[34px] font-bold leading-[1.1] ${hijau ? "text-brand" : ""}`}>
        {nilai}
      </div>
      {children ? (
        <div className="mt-1.5 text-[13px] leading-[1.4] text-[var(--color-ink-2)]">{children}</div>
      ) : null}
    </div>
  );
}
