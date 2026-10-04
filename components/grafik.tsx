import type { Distribusi, Irisan } from "@/lib/acara/statistik";
import { formatAngka } from "@/lib/waktu";

/*
 * Charts drawn as plain SVG on the server. No chart library: the dashboard is opened
 * on committee phones on the mosque's signal, and a pie chart does not need 60 KB of
 * JavaScript to be a pie chart.
 *
 * The palette is the posters' own greens and ochres, ordered so neighbouring slices
 * never share a tone.
 */
export const WARNA_GRAFIK = [
  "#3c542f",
  "#d9a21b",
  "#8fb33a",
  "#a8361e",
  "#6f6a57",
  "#cbd49b",
  "#2c3f22",
  "#e7c46a",
  "#4a4638",
  "#b9c98a",
  "#8a5a2b",
];

export function persen(n: number, dari: number): string {
  if (!dari) return "0%";
  const p = (n / dari) * 100;
  return `${p < 10 && p > 0 ? p.toFixed(1) : Math.round(p)}%`;
}

/** A donut with its legend beside it; percentages of the people who answered. */
export function Donat({ irisan, total }: { irisan: Irisan[]; total: number }) {
  const R = 42;
  const K = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 120 120" className="h-[112px] w-[112px] flex-none -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-canvas)" strokeWidth="20" />
        {total > 0
          ? irisan.map((s, i) => {
              const panjang = (s.n / total) * K;
              const el = (
                <circle
                  key={s.kunci}
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke={WARNA_GRAFIK[i % WARNA_GRAFIK.length]}
                  strokeWidth="20"
                  strokeDasharray={`${panjang} ${K - panjang}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += panjang;
              return el;
            })
          : null}
      </svg>
      <ul className="flex min-w-[200px] flex-1 flex-col gap-1.5 text-[14px]">
        {irisan.map((s, i) => (
          <li key={s.kunci} className="flex items-center gap-2">
            <span
              className="h-3 w-3 flex-none rounded-[3px]"
              style={{ background: WARNA_GRAFIK[i % WARNA_GRAFIK.length] }}
            />
            <span className="min-w-0 flex-1 leading-snug">{s.label}</span>
            <span className="font-semibold tabular-nums">{formatAngka(s.n, "en")}</span>
            <span className="w-12 text-end tabular-nums text-[var(--color-ink-3)]">{persen(s.n, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars, longest first as given. For many options and free text. */
export function BatangMendatar({ irisan, total }: { irisan: Irisan[]; total: number }) {
  const puncak = Math.max(1, ...irisan.map((s) => s.n));
  return (
    <ul className="flex flex-col gap-2 text-[14px]">
      {irisan.map((s) => (
        <li key={s.kunci}>
          <div className="flex items-baseline justify-between gap-3">
            <span
              className="min-w-0 truncate"
              title={s.ejaan?.length ? `${s.label}\nAlso written as: ${s.ejaan.slice(0, 12).join("; ")}` : s.label}
            >
              {s.label}
            </span>
            <span className="flex-none tabular-nums">
              <span className="font-semibold">{formatAngka(s.n, "en")}</span>{" "}
              <span className="text-[var(--color-ink-3)]">{persen(s.n, total)}</span>
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-[3px] bg-[var(--color-canvas)]">
            <div className="h-full rounded-[3px] bg-brand" style={{ width: `${(s.n / puncak) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** One question's card: title, how many answered, the chart, and any written answers. */
export function KartuDistribusi({ d }: { d: Distribusi }) {
  const kosongSemua = d.menjawab === 0 && !(d.catatan && d.catatan.length);
  return (
    <section className="card flex flex-col gap-3 p-5">
      <div>
        <h3 className="text-[16px] font-semibold leading-[1.3]">{d.judul}</h3>
        <p className="mt-0.5 text-[12px] text-[var(--color-ink-3)]">
          {formatAngka(d.menjawab, "en")} answered
          {d.kosong ? ` · ${formatAngka(d.kosong, "en")} left blank` : ""}
          {d.multi ? " · % of those who answered; one person can tick several" : ""}
        </p>
      </div>
      {kosongSemua ? (
        <p className="text-[14px] text-[var(--color-ink-3)]">No answers yet.</p>
      ) : d.irisan.length ? (
        d.bentuk === "donat" ? (
          <Donat irisan={d.irisan} total={d.menjawab} />
        ) : (
          <BatangMendatar irisan={d.irisan} total={d.menjawab} />
        )
      ) : null}
      {d.lainnya && d.lainnya.length ? (
        <details className="text-[13px]">
          <summary className="cursor-pointer font-medium text-brand">
            See the {formatAngka(d.lainnya.length, "en")} other answers
          </summary>
          <ul className="mt-2 flex max-h-[320px] flex-col gap-1 overflow-y-auto pe-1 text-[var(--color-ink-2)]">
            {d.lainnya.map((s) => (
              <li key={s.kunci} className="flex items-baseline justify-between gap-3">
                <span
                  className="min-w-0"
                  title={s.ejaan?.length ? `Also written as: ${s.ejaan.slice(0, 12).join("; ")}` : undefined}
                >
                  {s.label}
                  {s.ejaan?.length ? (
                    <span className="text-[var(--color-ink-3)]"> · +{s.ejaan.length} spelling{s.ejaan.length > 1 ? "s" : ""}</span>
                  ) : null}
                </span>
                <span className="flex-none font-semibold tabular-nums">{formatAngka(s.n, "en")}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {d.catatan && d.catatan.length ? (
        <details className="text-[13px]">
          <summary className="cursor-pointer font-medium text-brand">
            {d.irisan.length ? `Written answers (${d.catatan.length})` : `Show all ${d.catatan.length}`}
          </summary>
          <ul className="mt-2 flex max-h-[220px] list-disc flex-col gap-1 overflow-y-auto ps-5 text-[var(--color-ink-2)]">
            {d.catatan.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

/** Plain vertical bars with a label under each and the count over it. */
export function BatangVertikal({
  data,
  tinggi = 150,
}: {
  data: Array<{ kunci: string; label: string; n: number; judul?: string }>;
  tinggi?: number;
}) {
  const puncak = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[420px] items-end gap-1.5" style={{ height: tinggi + 20 }}>
        {data.map((d) => (
          <div key={d.kunci} className="flex h-full min-w-[16px] max-w-[56px] flex-1 flex-col justify-end">
            <div className="mb-1 text-center text-[10px] font-semibold tabular-nums">{d.n || ""}</div>
            <div
              className="rounded-t-[3px] bg-brand"
              style={{ height: `${Math.max(d.n ? 3 : 1, (d.n / puncak) * tinggi)}px`, opacity: d.n ? 1 : 0.25 }}
              title={d.judul ?? `${d.label} · ${d.n}`}
            />
          </div>
        ))}
      </div>
      <div className="flex min-w-[420px] gap-1.5 border-t border-[var(--color-line)] pt-1.5">
        {data.map((d) => (
          <div
            key={d.kunci}
            className="min-w-[16px] max-w-[56px] flex-1 text-center text-[10px] leading-tight text-[var(--color-ink-3)]"
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Registrations per day, with the running total over each bar. */
export function BatangHarian({ harian }: { harian: Array<{ tanggal: string; n: number; kumulatif: number }> }) {
  if (harian.length === 0) return <p className="text-[14px] text-[var(--color-ink-3)]">Nobody has registered yet.</p>;
  const tampil = harian.slice(-21);
  const puncak = Math.max(1, ...tampil.map((h) => h.n));
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[420px] items-end gap-2" style={{ height: 170 }}>
        {tampil.map((h) => (
          <div key={h.tanggal} className="flex h-full min-w-[28px] max-w-[64px] flex-1 flex-col justify-end">
            <div className="mb-1 text-center text-[11px] font-semibold tabular-nums">{h.n}</div>
            <div
              className="rounded-t-[3px] bg-brand"
              style={{ height: `${Math.max(2, (h.n / puncak) * 120)}px` }}
              title={`${h.tanggal} · ${h.n} registered · ${h.kumulatif} in total`}
            />
          </div>
        ))}
      </div>
      <div className="flex min-w-[420px] gap-2 border-t border-[var(--color-line)] pt-1.5">
        {tampil.map((h) => (
          <div
            key={h.tanggal}
            className="min-w-[28px] max-w-[64px] flex-1 text-center text-[10px] leading-tight text-[var(--color-ink-3)]"
          >
            {h.tanggal.slice(8, 10)}/{h.tanggal.slice(5, 7)}
            <div className="text-[var(--color-ink-2)]">Σ{h.kumulatif}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
