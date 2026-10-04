import type { Lang } from "@/lib/i18n/dict";

/** Same rule as /gate: one leading slash, nothing that a browser reads as another host. */
export function tujuanAman(next: string | null | undefined, lang: Lang): string {
  const v = String(next ?? "");
  const aman =
    v.startsWith("/") &&
    !v.startsWith("//") &&
    !v.startsWith("/\\") &&
    // eslint-disable-next-line no-control-regex -- reject control chars (e.g. \n) used to smuggle a fake host
    !/[\x00-\x1f]/.test(v);
  return aman ? v : `/${lang}/akun`;
}

/**
 * Where to send staff who are not signed in, so that they come back to the page —
 * and the programme — they were opening. `/scan?acara=latihan-scan` used to bounce
 * through `/gate?next=/scan` and land on the default programme: a link to the
 * practice run that quietly opened the real event.
 */
export function keGate(path: string, acara?: string | null): string {
  const next = acara ? `${path}?acara=${encodeURIComponent(acara)}` : path;
  return `/gate?next=${encodeURIComponent(next)}`;
}
