"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TandaClub } from "./tanda-club";
import { t, type Lang } from "@/lib/i18n/dict";

const KUNCI_TUTUP = "nawa-sapaan-hub-tutup";

/**
 * The Programme Hub and Tilawa Labs Fest greeting on the programme page, one tap from either.
 *
 * On a wide screen it sits in the empty paper above the tree, top left in both
 * languages (the hero grid is pinned left-to-right). On a phone the hero is words
 * first and there is no empty corner, so it slides up from the bottom a moment after
 * the page settles. Either way it closes, and stays closed for the rest of the visit
 * — shown to everyone, but not again on every page load.
 *
 * Nothing is rendered on the server: whether it was closed lives in this browser only,
 * and drawing it first and removing it after would flash.
 */
export function SapaanHub({ lang }: { lang: Lang }) {
  const [tampil, setTampil] = useState(false);
  const d = t(lang);

  useEffect(() => {
    let tertutup = false;
    try {
      tertutup = sessionStorage.getItem(KUNCI_TUTUP) === "1";
    } catch {
      // Storage blocked: show it; closing still works for this page.
    }
    if (tertutup) return;
    const jeda = window.matchMedia("(min-width: 1024px)").matches ? 400 : 1500;
    const id = window.setTimeout(() => setTampil(true), jeda);
    return () => window.clearTimeout(id);
  }, []);

  if (!tampil) return null;

  const tutup = () => {
    setTampil(false);
    try {
      sessionStorage.setItem(KUNCI_TUTUP, "1");
    } catch {}
  };

  return (
    <aside
      dir={lang === "ar" ? "rtl" : "ltr"}
      aria-label={d.hub.popupJudul}
      className="sapaan-hub fixed inset-x-3 bottom-3 z-40 rounded-[10px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-butter)] p-4 shadow-[4px_4px_0_var(--color-ink)] sm:inset-x-auto sm:end-5 sm:w-[380px] lg:absolute lg:bottom-auto lg:end-auto lg:start-auto lg:left-12 lg:top-10 lg:w-[400px] lg:p-5"
    >
      <button
        type="button"
        onClick={tutup}
        aria-label={d.hub.tutup}
        className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-[20px] leading-none text-[var(--color-ink-2)] hover:bg-white"
      >
        ×
      </button>
      <div className="flex items-center gap-2 pe-8">
        <span className="relative flex h-2.5 w-2.5 flex-none" aria-hidden>
          <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
        </span>
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-brand rtl:normal-case rtl:tracking-normal rtl:text-[13px]">
          {d.hub.popupEyebrow}
        </span>
      </div>
      <p className="mt-2 text-[18px] font-bold leading-[1.3] text-[var(--color-ink)] lg:text-[20px]">{d.hub.popupJudul}</p>
      <p className="mt-1 hidden text-[14px] leading-[1.5] text-[var(--color-ink-2)] sm:block">{d.hub.popupBody}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={`/${lang}/hub?src=popup`}
          onClick={tutup}
          className="btn btn-primary h-11 gap-2 px-3 text-[14px]"
        >
          <TandaClub club="arabic" className="h-5 w-5 flex-none" />
          {d.hub.popupHub}
        </Link>
        <Link href={`/${lang}/hub/fest?src=popup`} onClick={tutup} className="btn btn-ghost h-11 gap-2 px-3 text-[14px]">
          <TandaClub club="fest" className="h-5 w-5 flex-none" />
          {d.hub.popupFest}
        </Link>
      </div>
    </aside>
  );
}
