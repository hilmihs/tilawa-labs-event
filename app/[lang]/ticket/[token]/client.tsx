"use client";

import { useEffect, useState } from "react";
import { hapusDraf } from "@/app/[lang]/p/[slug]/register/form";
import { t, type Lang } from "@/lib/i18n/dict";

const KUNCI = "nawa.tiket";

export type TiketTersimpan = {
  kode: string;
  nomor: string;
  nama: string;
  gender: string;
};

/**
 * Caches the four fields the participant needs into localStorage. On the day, a
 * thousand people fight over one cell tower; a page that only renders when the
 * network answers is a page that does not render.
 */
export function TiketKlien({
  lang,
  slug,
  data,
  children,
}: {
  lang: Lang;
  slug: string;
  data: TiketTersimpan;
  children: React.ReactNode;
}) {
  // The cached row already carries it, so the offline banner reads right too.
  const d = t(lang, data.gender);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // The registration exists now, so the half-finished form kept for the language
    // switch is dead weight holding a name and a number. Drop it.
    hapusDraf(slug);
    try {
      localStorage.setItem(KUNCI, JSON.stringify({ ...data, at: Date.now() }));
    } catch {
      // Private mode or a full quota. The page still works; the cache is a bonus.
    }
  }, [data]);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <>
      {offline ? (
        <div className="bg-[var(--color-warn)] px-4 py-2 text-center text-[13px] font-semibold text-[var(--color-ink)]">
          {d.tiket.offlineNote}{" "}
          <a href={`/${lang}/ticket/saved`} className="underline">
            {d.tiket.label}
          </a>
        </div>
      ) : null}
      {children}
    </>
  );
}

export function bacaTiketTersimpan(): TiketTersimpan | null {
  try {
    const raw = localStorage.getItem(KUNCI);
    if (!raw) return null;
    const p = JSON.parse(raw) as TiketTersimpan;
    return p?.kode && p?.nomor ? p : null;
  } catch {
    return null;
  }
}
