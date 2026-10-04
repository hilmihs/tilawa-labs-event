"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BAHASA_TAMPIL, dirTeks, type Bagian } from "@/lib/catatan/tipe";

/*
 * The card shelf: the whole lecture in eight cards, cream and forest green in turn,
 * on the same sheet of paper as the poster above it.
 *
 * It scrolls rather than paginates. On a phone that is the gesture people already
 * use, and on a wide screen the half-visible next card is what says there is more —
 * a grid of eight would flatten the reading order the lecture actually had. The
 * arrows, the counter and the eight-segment bar underneath are the same position
 * expressed three ways, for the reader who is not going to swipe.
 *
 * The shelf itself is pinned to LTR in both site languages: the numbering runs 01
 * to 08 from the left the way it does on the printed page. The cards are Indonesian
 * — the language the lecture was given in — whichever language the site is set to.
 */

const KV: Record<number, { src: string; kelas: string }> = {
  // The leaf behind the green card and the speech bubble on the third are the poster's
  // own cut-outs, faded back so the type stays the first thing read.
  1: {
    src: "/kv/daun.webp",
    kelas: "pointer-events-none absolute -right-10 -bottom-8 h-[230px] w-auto select-none opacity-35",
  },
  2: {
    src: "/kv/balon.webp",
    kelas: "pointer-events-none absolute -right-8 top-[70px] h-[150px] w-auto select-none opacity-50",
  },
};

export type TeksRak = {
  eyebrow: string;
  judul: string;
  bacaPenuh: string;
  sebelumnya: string;
  berikutnya: string;
  keKartu: string;
  alur: string;
  geser: string;
};

export function RakKartu({
  lang,
  slug,
  bagian,
  teks,
}: {
  lang: "en" | "ar";
  slug: string;
  bagian: Bagian[];
  teks: TeksRak;
}) {
  const bahasa = BAHASA_TAMPIL;
  const [aktif, setAktif] = useState(0);
  const rak = useRef<HTMLDivElement>(null);

  // One card plus one gap: read off the DOM rather than hard-coded, because the card
  // is 352px on a wide screen and most of the viewport on a phone.
  const langkah = useCallback(() => {
    const el = rak.current;
    const kartu = el?.firstElementChild as HTMLElement | undefined;
    if (!el || !kartu) return 0;
    const berikut = kartu.nextElementSibling as HTMLElement | null;
    return berikut ? berikut.offsetLeft - kartu.offsetLeft : kartu.offsetWidth;
  }, []);

  const keKartu = useCallback(
    (i: number) => {
      const el = rak.current;
      if (!el) return;
      const batas = Math.min(Math.max(i, 0), bagian.length - 1);
      el.scrollTo({ left: batas * langkah(), behavior: "smooth" });
    },
    [bagian.length, langkah],
  );

  // The scroll position is the source of truth for which card is showing: a swipe and
  // an arrow press then cannot disagree about it.
  useEffect(() => {
    const el = rak.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const s = langkah();
        if (!s) return;
        setAktif(Math.min(bagian.length - 1, Math.max(0, Math.round(el.scrollLeft / s))));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, [bagian.length, langkah]);

  const dir = dirTeks(bahasa);
  const diAwal = aktif === 0;
  const diAkhir = aktif === bagian.length - 1;

  return (
    <section className="bg-[var(--color-surface)] px-5 pb-10 pt-12 md:px-10 md:pb-10 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="eyebrow">{teks.eyebrow}</div>
          <h2 className="judul mt-2.5 text-[clamp(32px,4.4vw,48px)]">{teks.judul}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[15px] font-semibold tabular-nums text-[var(--color-ink-3)]">
            {String(aktif + 1).padStart(2, "0")}{" "}
            <span className="text-[var(--color-line)]">/</span>{" "}
            {String(bagian.length).padStart(2, "0")}
          </span>
          <div className="flex gap-2" dir="ltr">
            <button
              type="button"
              onClick={() => keKartu(aktif - 1)}
              disabled={diAwal}
              aria-label={teks.sebelumnya}
              className="flex size-11 items-center justify-center rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] text-[var(--color-ink)] disabled:cursor-not-allowed disabled:text-[var(--color-line)]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => keKartu(aktif + 1)}
              disabled={diAkhir}
              aria-label={teks.berikutnya}
              className="flex size-11 items-center justify-center rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-brand text-[var(--color-butter)] shadow-[2px_2px_0_var(--color-ink)] disabled:cursor-not-allowed disabled:bg-[var(--color-paper)] disabled:text-[var(--color-line)] disabled:shadow-none"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div
        ref={rak}
        dir="ltr"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            keKartu(aktif + 1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            keKartu(aktif - 1);
          }
        }}
        className="mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 outline-none [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-brand [&::-webkit-scrollbar]:hidden"
      >
        {bagian.map((b, i) => {
          const hijau = i % 2 === 1;
          const kv = KV[i];
          return (
            <article
              key={b.id}
              dir={dir}
              className={`relative flex w-[84vw] max-w-[352px] flex-none snap-start flex-col overflow-hidden rounded-[6px] border-[1.5px] border-[var(--color-ink)] p-[26px] sm:w-[352px] ${
                hijau
                  ? "bg-brand text-[var(--color-butter)]"
                  : "bg-[var(--color-paper)] text-[var(--color-ink)]"
              } min-h-[540px]`}
            >
              {kv ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={kv.src} alt="" aria-hidden="true" className={kv.kelas} />
              ) : null}
              <div className="relative flex items-start justify-between gap-3">
                <span
                  className={`text-[72px] font-bold leading-[0.9] tracking-[-0.03em] ${
                    hijau ? "text-brand-200" : "text-brand-300"
                  }`}
                >
                  {b.no}
                </span>
                <span className={`eyebrow pt-2 ${hijau ? "text-brand-200" : ""}`}>
                  {b.kicker[bahasa]}
                </span>
              </div>
              <h3 className="relative mt-4 text-[25px] font-bold leading-[1.1] tracking-[-0.015em] text-pretty">
                {b.judul[bahasa]}
              </h3>
              <ul className="relative mt-3.5 flex list-none flex-col gap-2.5 p-0 text-[15px] leading-[1.5]">
                {b.poin.map((p, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="mt-[9px] size-1.5 flex-none rounded-[3px] bg-brand-300" />
                    <span className={hijau ? "text-brand-100" : "text-[var(--color-ink-2)]"}>
                      {p[bahasa]}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="relative mt-auto pt-4.5">
                <div
                  className={`rounded-[6px] border-[1.5px] border-[var(--color-ink)] px-4.5 py-4 ${
                    hijau ? "bg-brand-600" : "bg-[var(--color-canvas)]"
                  }`}
                >
                  {b.penutup.jenis === "dalil" ? (
                    <div dir="rtl" className="font-arabic text-[26px] leading-[1.6]">
                      {b.penutup.arab}
                    </div>
                  ) : null}
                  <div
                    className={`text-[14px] italic leading-[1.45] ${
                      b.penutup.jenis === "dalil" ? "mt-2" : ""
                    } ${hijau ? "text-brand-100" : "text-[var(--color-ink-2)]"}`}
                  >
                    {b.penutup.jenis === "dalil"
                      ? b.penutup.terjemah[bahasa]
                      : b.penutup.teks[bahasa]}
                  </div>
                  {b.penutup.sumber ? (
                    <div
                      className={`mt-1.5 text-[12px] font-semibold ${
                        hijau ? "text-brand-200" : "text-brand"
                      }`}
                    >
                      {b.penutup.sumber[bahasa]}
                    </div>
                  ) : null}
                </div>
                <Link
                  href={`/${lang}/p/${slug}/notes#${b.id}`}
                  className={`mt-3.5 inline-block border-b-[1.5px] pb-[3px] text-[14px] font-bold ${
                    hijau
                      ? "border-[var(--color-butter)] text-[var(--color-butter)]"
                      : "border-brand text-brand"
                  }`}
                >
                  {teks.bacaPenuh} →
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div
        dir="ltr"
        className="mt-5 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${bagian.length}, minmax(0,1fr))` }}
      >
        {bagian.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => keKartu(i)}
            aria-label={`${teks.keKartu} ${b.no}`}
            aria-current={i === aktif ? "true" : undefined}
            className={`h-1 rounded-[2px] ${
              i === aktif ? "bg-[var(--color-ink)]" : "bg-[var(--color-line)]"
            }`}
          />
        ))}
      </div>
      <div className="mt-2.5 flex justify-between gap-4 text-[13px] text-[var(--color-ink-3)]">
        <span>{teks.alur}</span>
        <span className="hidden sm:inline">{teks.geser}</span>
      </div>
    </section>
  );
}
