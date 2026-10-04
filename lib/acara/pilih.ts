import { cookies } from "next/headers";
import type { Acara } from "@/db/schema";
import { COOKIE_ACARA } from "./konstanta";
import { acaraBawaan, ambilAcara } from "./queries";
import { resolusiSlug, slugSah } from "./view-model";

// Re-exported so callers keep importing the cookie name from here.
export { COOKIE_ACARA } from "./konstanta";

/**
 * The programme a staff page or API call is about: `?acara=` in the URL, then the
 * cookie set by the picker, then the best guess. Never throws and never returns a
 * programme that does not exist — a stale cookie falls through to the guess.
 */
export async function acaraUntukStaf(query?: string): Promise<Acara | null> {
  const jar = await cookies();
  const slug = resolusiSlug(query, jar.get(COOKIE_ACARA)?.value);
  if (slug) {
    const ev = await ambilAcara(slug);
    if (ev) return ev;
  }
  return acaraBawaan();
}

/**
 * Route-handler flavour: reads `?acara=` off the request URL.
 *
 * An explicit `?acara=` is never second-guessed. The scanner names the programme it
 * is scanning for, so a slug that is malformed or unknown must fail — falling back
 * to the cookie or the default here would write a queue of scans into whichever
 * programme this phone's cookie happens to point at. Returning null makes the routes
 * answer 404 "no event", which the scanner already treats as unreachable and keeps
 * the scans queued. Only an absent param defers to the staff's own choice.
 */
export async function acaraUntukApi(req: Request): Promise<Acara | null> {
  const q = new URL(req.url).searchParams.get("acara");
  if (q !== null) {
    if (!slugSah(q)) return null;
    return ambilAcara(q);
  }
  return acaraUntukStaf();
}
