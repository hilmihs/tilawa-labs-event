"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Counts a page view for the traffic tab, once per page the visitor lands on —
 * including moves inside the app, which never reload the document.
 *
 * sendBeacon so it never holds up the page or survives as a pending request on a slow
 * connection; the server does the classifying, the page only says where it is.
 */
export function CatatKunjungan() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    try {
      const q = new URLSearchParams(window.location.search);
      const body = JSON.stringify({
        path: pathname,
        ref: document.referrer || null,
        utm: q.get("utm_source") ?? q.get("src") ?? null,
      });
      const blob = new Blob([body], { type: "text/plain" });
      if (!navigator.sendBeacon?.("/api/kunjungan", blob)) {
        void fetch("/api/kunjungan", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    } catch {
      // Counting is a courtesy; a page must never break because of it.
    }
  }, [pathname]);
  return null;
}
