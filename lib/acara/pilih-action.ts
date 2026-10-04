"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { punyaAkses } from "@/lib/auth/sesi";
import { COOKIE_ACARA } from "./konstanta";
import { slugSah } from "./view-model";

const UMUR_DETIK = 60 * 60 * 24 * 30;

/** The picker in the staff header. Remembers the choice for a month. */
export async function pilihAcaraStaf(form: FormData): Promise<void> {
  const slug = String(form.get("slug") ?? "").trim();
  const next = String(form.get("next") ?? "/panel");

  // Same rule as /gate: one leading slash only, or the redirect can leave the site.
  const aman = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
  const tujuan = aman ? next : "/panel";

  // Judged before the cookie is written, and carrying `next` the way the rest of the
  // codebase does, so signing in lands back on the page the switch started from.
  if (!(await punyaAkses("petugas"))) {
    redirect(`/gate?next=${encodeURIComponent(tujuan)}`);
  }

  if (!slugSah(slug)) redirect(tujuan);

  const jar = await cookies();
  jar.set(COOKIE_ACARA, slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UMUR_DETIK,
  });

  // `?acara=` outranks the cookie wherever it appears, so returning to a URL that
  // still carries the old slug would silently undo the switch just made. The base is
  // a throwaway origin: only the path and the query are used.
  const url = new URL(tujuan, "http://x");
  url.searchParams.set("acara", slug);
  redirect(`${url.pathname}${url.search}`);
}
