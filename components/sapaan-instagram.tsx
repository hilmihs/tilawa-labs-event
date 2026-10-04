"use client";

import { useEffect, useState } from "react";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "./instagram";
import { t, type Lang } from "@/lib/i18n/dict";

const KUNCI_TUTUP = "nawa-sapaan-ig-tutup";

/**
 * "Follow us on Instagram", in the middle of the screen a moment after the programme
 * page settles — what greets visitors while Programme Hub & Fest are switched off
 * (lib/pengaturan/queries.ts). Closes on the ×, "later", the backdrop or Escape, and
 * stays closed for the rest of the visit. Like SapaanHub, nothing is rendered on the
 * server: whether it was closed lives in this browser only, and a flash would be worse
 * than a short wait.
 */
export function SapaanInstagram({ lang, gender }: { lang: Lang; gender?: string | null }) {
  const [tampil, setTampil] = useState(false);
  const d = t(lang, gender).instagram;

  useEffect(() => {
    /*
     * The demo has no social account to send anyone to, so the greeting is a
     * dead link and pure noise in front of the one thing a visitor came to see.
     * Suppressed here rather than at the call sites, so it stays suppressed
     * wherever the component is later used.
     */
    if (process.env.NEXT_PUBLIC_DEMO === "1") return;

    let tertutup = false;
    try {
      tertutup = sessionStorage.getItem(KUNCI_TUTUP) === "1";
    } catch {
      // Storage blocked: show it; closing still works for this page.
    }
    if (tertutup) return;
    const id = window.setTimeout(() => setTampil(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!tampil) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") tutup();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tutup only touches state and storage
  }, [tampil]);

  if (!tampil) return null;

  const tutup = () => {
    setTampil(false);
    try {
      sessionStorage.setItem(KUNCI_TUTUP, "1");
    } catch {}
  };

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(30,26,18,0.55)] p-5"
      onClick={tutup}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sapaan-ig-judul"
        onClick={(e) => e.stopPropagation()}
        className="sapaan-ig relative w-full max-w-[400px] rounded-[12px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-butter)] p-6 text-center shadow-[5px_5px_0_var(--color-ink)]"
      >
        <button
          type="button"
          onClick={tutup}
          aria-label={d.tutup}
          className="absolute end-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-[22px] leading-none text-[var(--color-ink-2)] hover:bg-white"
        >
          ×
        </button>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-[var(--color-butter)]">
          <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden fill="currentColor">
            <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.4-3.1a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
          </svg>
        </div>
        <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.08em] text-brand rtl:normal-case rtl:tracking-normal rtl:text-[13px]">
          {d.eyebrow}
        </p>
        <h2 id="sapaan-ig-judul" className="judul mt-1 text-[26px] leading-[1.15] text-[var(--color-ink)]">
          {d.judul}
        </h2>
        <p dir="ltr" className="mt-1 text-[18px] font-bold text-brand">
          {INSTAGRAM_HANDLE}
        </p>
        <p className="mt-2 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">{d.body}</p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer noopener"
          onClick={tutup}
          className="btn btn-primary mt-5 w-full gap-1.5"
        >
          {d.ikuti}
          {/* The handle is never translated and never flipped: its own direction. */}
          <span dir="ltr">{INSTAGRAM_HANDLE}</span>
        </a>
        <button type="button" onClick={tutup} className="mt-3 text-[14px] font-medium text-[var(--color-ink-3)] underline underline-offset-2">
          {d.nanti}
        </button>
      </div>
    </div>
  );
}
