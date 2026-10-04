"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { Lang } from "@/lib/i18n/dict";

/*
 * While a language change is on screen, <html> carries this class and the page
 * crossfade in globals.css slows down to match the whole layout mirroring. The
 * click puts it on; the switch that mounts with the new page takes it off once the
 * animation has had its time, and a fallback timer clears it if the route stalls.
 */
const KELAS_GANTI = "ganti-bahasa";
const LAMA_ANIMASI_MS = 800;
const BATAS_TUNGGU_MS = 3000;

function tandaiGantiBahasa() {
  const html = document.documentElement;
  html.classList.add(KELAS_GANTI);
  window.setTimeout(() => html.classList.remove(KELAS_GANTI), BATAS_TUNGGU_MS);
}

/**
 * Swaps only the first path segment, so the switch keeps you on the page you are
 * reading — including a ticket URL with a token in it.
 *
 * The change of language mirrors the whole page. The crossfade comes from the
 * <ViewTransition> boundary in app/layout.tsx; the link only marks <html> so that
 * boundary's animation runs as the slower, fuller language crossfade.
 */
export function LangSwitch({ lang, tone = "light" }: { lang: Lang; tone?: "light" | "dark" }) {
  const pathname = usePathname() ?? `/${lang}`;
  const search = useSearchParams();
  const qs = search?.toString();

  // Mounted with the new page: the crossfade is under way, clear the mark after it.
  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains(KELAS_GANTI)) return;
    const id = window.setTimeout(() => html.classList.remove(KELAS_GANTI), LAMA_ANIMASI_MS);
    return () => window.clearTimeout(id);
  }, []);

  const swap = (target: Lang) => {
    const parts = pathname.split("/");
    if (parts[1] === "en" || parts[1] === "ar") parts[1] = target;
    else parts.splice(1, 0, target);
    return parts.join("/") + (qs ? `?${qs}` : "");
  };

  // "light" sits on cream paper, "dark" on the forest green or on ink.
  const base =
    tone === "dark"
      ? "border-[1.5px] border-[var(--color-butter)]"
      : "border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)]";
  const activeCls =
    tone === "dark"
      ? "bg-[var(--color-butter)] text-[var(--color-ink)]"
      : "bg-[var(--color-ink)] text-[var(--color-butter)]";
  const idleCls = tone === "dark" ? "text-[var(--color-butter)]" : "text-[var(--color-ink-2)]";

  return (
    <div className={`flex rounded-[6px] p-[2px] ${base}`} dir="ltr">
      {(["en", "ar"] as Lang[]).map((l) => (
        <Link
          key={l}
          href={swap(l)}
          hrefLang={l}
          aria-current={l === lang ? "true" : undefined}
          onClick={l === lang ? undefined : tandaiGantiBahasa}
          className={`rounded-[4px] px-3 py-1.5 text-xs font-bold leading-none lg:px-3.5 lg:py-2 lg:text-[14px] ${
            l === lang ? activeCls : idleCls
          } ${l === "ar" ? "font-arabic text-[13px] font-semibold lg:text-[15px]" : ""}`}
          style={l === "ar" ? { fontFamily: "var(--font-arabic)" } : undefined}
        >
          {l === "en" ? "EN" : "العربية"}
        </Link>
      ))}
    </div>
  );
}
