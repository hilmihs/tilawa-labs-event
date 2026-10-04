import type { Lang } from "@/lib/i18n/dict";

/** The site's own address, no trailing slash — what every link sent outside is built on. */
export function basisSitus(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? "https://nawaroom.id").replace(/\/$/, "");
}

/**
 * One link for every no-show of a programme, not one per person: the WhatsApp message
 * goes out as a single approved template, which cannot carry a personal token. The
 * participant says who they are with their WhatsApp number on the last screen.
 */
export function linkAbsen(basis: string, lang: Lang, slug: string): string {
  return `${basis}/${lang}/p/${slug}/absen`;
}

export function linkCatatan(basis: string, lang: Lang, slug: string): string {
  return `${basis}/${lang}/p/${slug}/notes`;
}

export function namaDepan(nama: string): string {
  return nama.trim().split(/\s+/)[0] ?? "";
}
