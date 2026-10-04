import { SignJWT, jwtVerify } from "jose";

const DURASI_DETIK = 60 * 60 * 24 * 60; // 60 days
const SCOPE = "etiket";

export type TiketTokenPayload = { pid: string; slug: string };

/**
 * Read at call time, not at module load, so tests can set AUTH_SECRET first.
 */
function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function signTiketToken(p: TiketTokenPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ pid: p.pid, slug: p.slug, scope: SCOPE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + DURASI_DETIK)
    .sign(await secret());
}

/**
 * Returns null for every rejection — bad signature, expired, wrong scope, malformed
 * claim. One "link is not valid" state, no branching, no telling the holder which
 * check failed.
 *
 * Sixty days is deliberately far past the event. The token only opens a read of the
 * holder's own row and writes nothing; shortening it buys no security, it only buys
 * participants whose link is dead on the morning of the event.
 */
export async function verifyTiketToken(t: string): Promise<TiketTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(t, await secret(), { algorithms: ["HS256"] });
    if (payload.scope !== SCOPE) return null;
    const pid = payload.pid;
    const slug = payload.slug;
    if (typeof pid !== "string" || typeof slug !== "string") return null;
    if (!pid || !slug) return null;
    return { pid, slug };
  } catch {
    return null;
  }
}
