"use client";

import type { KunciTombol } from "@/lib/hub/konten";

/**
 * Counts a tap on an interest button, guest or signed in, for the funnel on
 * /panel/club. A guest's tap ends on the sign-in page, and without this the committee
 * could not tell "nobody wanted it" from "they wanted it but never signed in".
 *
 * Same channel and same rules as page views (components/catat-kunjungan.tsx): a beacon,
 * no personal data, and never allowed to get in the way of the tap itself.
 */
export function kirimKetuk(kunci: KunciTombol): void {
  try {
    const body = JSON.stringify({ path: window.location.pathname, aksi: "minat", kunci });
    const blob = new Blob([body], { type: "text/plain" });
    if (!navigator.sendBeacon?.("/api/kunjungan", blob)) {
      void fetch("/api/kunjungan", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    // Counting is a courtesy.
  }
}
