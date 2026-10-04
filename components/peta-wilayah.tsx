"use client";

import { useMemo, useRef, useState } from "react";
import type { Distribusi } from "@/lib/acara/statistik";
import { BENTUK_PROVINSI, PETA_LEBAR, PETA_TINGGI } from "@/lib/wilayah/peta";
import { TANPA_KAB, type KabPeta, type ProvPeta } from "@/lib/wilayah/rekap";
import { PROVINSI, type KodePulau } from "@/lib/wilayah/data";
import { persen } from "@/components/grafik";
import { JENIS_SEKOLAH } from "@/lib/acara/jenis-sekolah";
import { formatAngka } from "@/lib/waktu";

/*
 * "Where they live" / "Home region" as a map: provinces shaded by how many people,
 * one green from pale to the poster's forest. Click a province for its regencies and
 * cities, click one of those (in Jabodetabek) for its districts. The list beside the
 * map is the same numbers as text, so nothing is read from colour alone.
 *
 * Shading uses steps of the share of the busiest province rather than a straight
 * line: one province usually holds most answers, and a linear scale would paint
 * every other province the same pale.
 */

const ANAK_TANGGA = [
  { batas: 0.05, warna: "#dfe5c6" },
  { batas: 0.15, warna: "#bfcd98" },
  { batas: 0.35, warna: "#93aa68" },
  { batas: 0.7, warna: "#63803f" },
  { batas: 1, warna: "#3c542f" },
];
const WARNA_NOL = "#ece2bd";
const NAMA_PROVINSI = new Map(PROVINSI.map((p) => [p.kode, p.simpan]));

/**
 * The part of the map to show for a chosen province: its outline with a margin, never
 * smaller than a window that keeps neighbours in view — Jakarta alone is a few pixels.
 */
function jendela(kode: string | undefined): string {
  const semua = `0 0 ${PETA_LEBAR} ${PETA_TINGGI}`;
  const b = kode ? BENTUK_PROVINSI[kode] : undefined;
  if (!b) return semua;
  const angka = b.d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const xs = angka.filter((_, i) => i % 2 === 0);
  const ys = angka.filter((_, i) => i % 2 === 1);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const rasio = PETA_LEBAR / PETA_TINGGI;
  let w = Math.max(x1 - x0, 160) * 1.5;
  let h = Math.max(y1 - y0, 160 / rasio) * 1.5;
  if (w / h > rasio) h = w / rasio;
  else w = h * rasio;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const x = Math.min(Math.max(cx - w / 2, 0), PETA_LEBAR - w);
  const y = Math.min(Math.max(cy - h / 2, 0), PETA_TINGGI - h);
  return `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}

function warna(n: number, puncak: number): string {
  if (!n || !puncak) return WARNA_NOL;
  const r = n / puncak;
  return (ANAK_TANGGA.find((s) => r <= s.batas) ?? ANAK_TANGGA[ANAK_TANGGA.length - 1]).warna;
}

type Tingkat = { prov: ProvPeta | null; kab: KabPeta | null };

export function KartuPeta({ d }: { d: Distribusi }) {
  const peta = d.peta!;
  const [pulau, setPulau] = useState<KodePulau | null>(null);
  const [pilih, setPilih] = useState<Tingkat>({ prov: null, kab: null });
  const [arah, setArah] = useState<{ x: number; y: number; kode: string } | null>(null);
  const bingkai = useRef<HTMLDivElement>(null);

  const perKode = useMemo(() => new Map(peta.provinsi.map((p) => [p.kode, p])), [peta]);
  const puncak = Math.max(0, ...peta.provinsi.map((p) => p.n));
  const tampilProv = pulau ? peta.provinsi.filter((p) => p.pulau === pulau) : peta.provinsi;

  const pilihProv = (p: ProvPeta | null) => {
    setPilih({ prov: p, kab: null });
    if (p && pulau && p.pulau !== pulau) setPulau(null);
  };

  // What the list shows: provinces, one province's regencies, or one regency's districts.
  const daftar =
    pilih.kab && pilih.kab.kec.length
      ? { judul: pilih.kab.nama, total: pilih.kab.n, baris: pilih.kab.kec.map((k) => ({ ...k, klik: undefined })) }
      : pilih.prov
        ? {
            judul: pilih.prov.nama,
            total: pilih.prov.n,
            baris: pilih.prov.kab.map((k) => ({
              ...k,
              klik: k.kec.length ? () => setPilih({ prov: pilih.prov, kab: k }) : undefined,
            })),
          }
        : {
            judul: pulau ? (peta.pulau.find((x) => x.kode === pulau)?.nama ?? "") : "All provinces",
            total: tampilProv.reduce((a, p) => a + p.n, 0),
            baris: tampilProv.map((p) => ({ nama: p.nama, n: p.n, klik: () => pilihProv(p) })),
          };
  const puncakDaftar = Math.max(1, ...daftar.baris.map((b) => b.n));
  const tunjuk = arah ? perKode.get(arah.kode) : undefined;
  const namaTunjuk = arah ? (tunjuk?.nama ?? NAMA_PROVINSI.get(arah.kode) ?? "") : "";

  return (
    <section className="card flex flex-col gap-4 p-5 md:col-span-2 xl:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold leading-[1.3]">{d.judul}</h3>
          <p className="mt-0.5 text-[12px] text-[var(--color-ink-3)]">
            {formatAngka(d.menjawab, "en")} answered · {formatAngka(peta.cocok, "en")} placed on the map (
            {persen(peta.cocok, d.menjawab)}){d.kosong ? ` · ${formatAngka(d.kosong, "en")} left blank` : ""} · click a
            province to see its regencies and cities
          </p>
        </div>
        {/* Islands: a quick way to narrow the list; the map keeps every province visible. */}
        <div className="flex flex-wrap gap-1.5">
          <Chip on={!pulau && !pilih.prov} onClick={() => (setPulau(null), pilihProv(null))}>
            Indonesia {formatAngka(peta.cocok, "en")}
          </Chip>
          {peta.pulau.map((pl) => (
            <Chip
              key={pl.kode}
              on={pulau === pl.kode && !pilih.prov}
              onClick={() => (setPulau(pl.kode), pilihProv(null))}
            >
              {pl.nama} {formatAngka(pl.n, "en")}
              <span className="text-[var(--color-ink-3)]"> · {persen(pl.n, peta.cocok)}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <div>
          <div ref={bingkai} className="relative" onMouseLeave={() => setArah(null)}>
            <svg
              viewBox={jendela(pilih.prov?.kode)}
              className="block h-auto w-full"
              role="img"
              aria-label={`${d.judul}: map of Indonesia by province`}
            >
              {Object.entries(BENTUK_PROVINSI).map(([kode, b]) => {
                const p = perKode.get(kode);
                const redup = pulau && p?.pulau !== pulau;
                const dipilih = pilih.prov?.kode === kode;
                return (
                  <path
                    key={kode}
                    d={b.d}
                    fill={warna(p?.n ?? 0, puncak)}
                    fillOpacity={redup ? 0.35 : 1}
                    stroke={dipilih ? "var(--color-ink)" : "#fbf6e4"}
                    strokeWidth={dipilih ? 1.6 : 0.6}
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    className={p ? "cursor-pointer" : undefined}
                    onClick={() => p && pilihProv(dipilih ? null : p)}
                    onMouseMove={(e) => {
                      const r = bingkai.current?.getBoundingClientRect();
                      if (r) setArah({ x: e.clientX - r.left, y: e.clientY - r.top, kode });
                    }}
                  />
                );
              })}
            </svg>
            {arah ? (
              <div
                className="pointer-events-none absolute z-10 whitespace-nowrap rounded-[6px] border border-[var(--color-ink)] bg-white px-2.5 py-1.5 text-[12px] shadow-sm"
                style={{
                  left: Math.min(arah.x + 12, (bingkai.current?.clientWidth ?? 0) - 170),
                  top: arah.y + 12,
                }}
              >
                <div className="font-semibold">{namaTunjuk}</div>
                <div className="tabular-nums text-[var(--color-ink-2)]">
                  {tunjuk ? `${formatAngka(tunjuk.n, "en")} · ${persen(tunjuk.n, peta.cocok)}` : "nobody"}
                </div>
              </div>
            ) : null}
          </div>
          {pilih.prov ? (
            <button
              type="button"
              onClick={() => pilihProv(null)}
              className="mt-2 text-[12px] font-medium text-brand underline underline-offset-2"
            >
              Zoom out to Indonesia
            </button>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-ink-3)]">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-4 rounded-[2px] border border-[var(--color-line)]" style={{ background: WARNA_NOL }} />0
            </span>
            {ANAK_TANGGA.map((s, i) => {
              const bawah = i === 0 ? 1 : Math.floor(ANAK_TANGGA[i - 1].batas * puncak) + 1;
              const atas = Math.floor(s.batas * puncak);
              if (atas < bawah) return null;
              return (
                <span key={s.warna} className="flex items-center gap-1 tabular-nums">
                  <span className="h-2.5 w-4 rounded-[2px]" style={{ background: s.warna }} />
                  {bawah === atas ? bawah : `${bawah}–${atas}`}
                </span>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <nav className="flex flex-wrap items-center gap-1 text-[13px]" aria-label="Level">
            <button type="button" className="font-medium text-brand underline-offset-2 hover:underline" onClick={() => pilihProv(null)}>
              Indonesia
            </button>
            {pilih.prov ? (
              <>
                <span className="text-[var(--color-ink-3)]">›</span>
                <button
                  type="button"
                  className="font-medium text-brand underline-offset-2 hover:underline"
                  onClick={() => setPilih({ prov: pilih.prov, kab: null })}
                >
                  {pilih.prov.nama}
                </button>
              </>
            ) : null}
            {pilih.kab ? (
              <>
                <span className="text-[var(--color-ink-3)]">›</span>
                <span className="font-medium">{pilih.kab.nama}</span>
              </>
            ) : null}
          </nav>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <div className="text-[15px] font-semibold">{daftar.judul}</div>
            <div className="text-[13px] tabular-nums text-[var(--color-ink-2)]">
              {formatAngka(daftar.total, "en")} people
            </div>
          </div>
          {pilih.kab ? (
            <p className="mt-0.5 text-[12px] text-[var(--color-ink-3)]">
              {formatAngka(pilih.kab.n - pilih.kab.kec.reduce((a, k) => a + k.n, 0), "en")} named only the city
            </p>
          ) : null}
          <ul className="mt-3 flex max-h-[360px] flex-col gap-1 overflow-y-auto pe-1 text-[14px]">
            {daftar.baris.map((b) => {
              const isi = (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={`min-w-0 truncate pe-0.5 ${b.nama === TANPA_KAB ? "italic text-[var(--color-ink-3)]" : ""}`}>
                      {b.nama}
                      {b.klik ? <span className="text-[var(--color-ink-3)]"> ›</span> : null}
                    </span>
                    <span className="flex-none tabular-nums">
                      <span className="font-semibold">{formatAngka(b.n, "en")}</span>{" "}
                      <span className="text-[var(--color-ink-3)]">{persen(b.n, daftar.total)}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-[3px] bg-[var(--color-canvas)]">
                    <div className="h-full rounded-[3px] bg-brand" style={{ width: `${(b.n / puncakDaftar) * 100}%` }} />
                  </div>
                </>
              );
              return (
                <li key={b.nama}>
                  {b.klik ? (
                    <button type="button" onClick={b.klik} className="block w-full rounded-[6px] px-1.5 py-1 text-start hover:bg-white">
                      {isi}
                    </button>
                  ) : (
                    <div className="px-1.5 py-1">{isi}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {peta.tidakCocok.length ? (
        <details className="text-[13px]">
          <summary className="cursor-pointer font-medium text-brand">
            {formatAngka(d.menjawab - peta.cocok, "en")} answers could not be placed on the map
          </summary>
          <ul className="mt-2 flex max-h-[220px] flex-col gap-1 overflow-y-auto pe-1 text-[var(--color-ink-2)]">
            {peta.tidakCocok.map((x) => (
              <li key={x.label} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0">{x.label}</span>
                <span className="flex-none font-semibold tabular-nums">{formatAngka(x.n, "en")}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-[8px] border px-2.5 py-1 text-[12px] font-medium tabular-nums ${
        on ? "border-brand bg-brand-100 font-semibold text-brand" : "border-[var(--color-line)] bg-white text-[var(--color-ink-2)]"
      }`}
    >
      {children}
    </button>
  );
}

/** "School or pesantren": by type first, then the schools of the chosen type. */
export function KartuSekolah({ d }: { d: Distribusi }) {
  const jenis = d.jenis!;
  const [pilih, setPilih] = useState(jenis[0]?.kunci ?? null);
  const aktif = jenis.find((j) => j.kunci === pilih) ?? jenis[0];
  const puncak = Math.max(1, ...(aktif?.sekolah ?? []).map((s) => s.n));
  return (
    <section className="card flex flex-col gap-4 p-5 md:col-span-2 xl:col-span-3">
      <div>
        <h3 className="text-[16px] font-semibold leading-[1.3]">{d.judul}</h3>
        <p className="mt-0.5 text-[12px] text-[var(--color-ink-3)]">
          {formatAngka(d.menjawab, "en")} answered{d.kosong ? ` · ${formatAngka(d.kosong, "en")} left blank` : ""} · type read
          from the school&apos;s name; click a type to list its schools
        </p>
      </div>

      {/* One bar split by type: the overall picture before any list. */}
      <div className="flex h-5 w-full gap-[2px] overflow-hidden rounded-[4px]" aria-hidden>
        {jenis.map((j) => (
          <button
            key={j.kunci}
            type="button"
            tabIndex={-1}
            title={`${j.label}: ${j.n}`}
            onClick={() => setPilih(j.kunci)}
            style={{ width: `${(j.n / Math.max(1, d.menjawab)) * 100}%`, background: WARNA_JENIS[JENIS_SEKOLAH.indexOf(j.kunci)] }}
            className={pilih === j.kunci ? "outline outline-2 outline-offset-[-2px] outline-[var(--color-ink)]" : ""}
          />
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,1fr)_minmax(0,1.7fr)]">
        <ul className="flex flex-col gap-1 text-[14px]">
          {jenis.map((j) => (
            <li key={j.kunci}>
              <button
                type="button"
                onClick={() => setPilih(j.kunci)}
                aria-pressed={pilih === j.kunci}
                className={`flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-start ${
                  pilih === j.kunci ? "bg-brand-100 font-semibold" : "hover:bg-white"
                }`}
              >
                <span className="h-3 w-3 flex-none rounded-[3px]" style={{ background: WARNA_JENIS[JENIS_SEKOLAH.indexOf(j.kunci)] }} />
                <span className="min-w-0 flex-1">{j.label}</span>
                <span className="font-semibold tabular-nums">{formatAngka(j.n, "en")}</span>
                <span className="w-12 text-end tabular-nums text-[var(--color-ink-3)]">{persen(j.n, d.menjawab)}</span>
              </button>
            </li>
          ))}
        </ul>

        {aktif ? (
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-[15px] font-semibold">{aktif.label}</div>
              <div className="text-[13px] tabular-nums text-[var(--color-ink-2)]">
                {formatAngka(aktif.sekolah.length, "en")} schools · {formatAngka(aktif.n, "en")} people
              </div>
            </div>
            <ul className="mt-3 flex max-h-[360px] flex-col gap-2 overflow-y-auto pe-1 text-[14px]">
              {aktif.sekolah.map((s) => (
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
                      <span className="text-[var(--color-ink-3)]">{persen(s.n, aktif.n)}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-[3px] bg-[var(--color-canvas)]">
                    <div className="h-full rounded-[3px] bg-brand" style={{ width: `${(s.n / puncak) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// In JENIS_SEKOLAH order, so a type keeps its colour whatever the counts.
const WARNA_JENIS = ["#3c542f", "#d9a21b", "#8fb33a", "#a8361e", "#b9ad8a"];
