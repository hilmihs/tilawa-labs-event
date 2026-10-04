"use client";

import { useLayoutEffect } from "react";

/**
 * Stamps the page's language and direction on <html>, so the scrollbar, text selection
 * and native form controls flip with the page.
 *
 * An effect, not an inline <script>: a script rendered by React runs on the first server
 * render only, so switching EN ↔ العربية by client navigation left <html> in the old
 * language, and React warned about the script on every such render.
 */
export function AturHtml({ lang, dir }: { lang: string; dir: "ltr" | "rtl" }) {
  useLayoutEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);
  return null;
}
