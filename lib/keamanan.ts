import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";

/**
 * IPs are hashed, never stored raw. The hash is deterministic so it can still be
 * counted for rate limiting.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_SALT;
  if (!salt) throw new Error("IP_SALT is not set");
  return createHmac("sha256", salt).update(ip).digest("hex");
}

/**
 * The client-facing address, counted from the RIGHT of X-Forwarded-For.
 *
 * The leftmost value is whatever the client sent: nginx's usual
 * `proxy_add_x_forwarded_for` appends, it does not replace. Trusting the left end
 * lets anyone rotate a header and walk straight through both public rate limits —
 * including the one guarding ticket lookup, which is all that stands between a
 * list of phone numbers and the participant directory.
 *
 * PROXY_HOPS is how many proxies of our own sit in front of the app: 1 for a single
 * nginx or one Azure front end, 2 if a CDN sits in front of that. Set it to match
 * the deployment, or the limiter meters the proxy instead of the visitor.
 */
export async function ipHashPermintaan(): Promise<string> {
  const h = await headers();
  const hops = Math.max(1, Number(process.env.PROXY_HOPS ?? 1));
  const fwd = h.get("x-forwarded-for");

  let ip = "";
  if (fwd) {
    const rantai = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    // The hop we trust is `hops` from the right; anything further left is unverified.
    ip = rantai[Math.max(0, rantai.length - hops)] ?? "";
  }
  if (!ip) ip = (h.get("x-real-ip") ?? "").trim();

  return hashIp(ip || "unknown");
}

/** Constant-time compare. `===` on a secret leaks its length and prefix. */
export function kodeCocok(diberikan: string, benar: string | undefined): boolean {
  if (!benar) return false;
  const a = Buffer.from(diberikan, "utf8");
  const b = Buffer.from(benar, "utf8");
  if (a.length !== b.length) {
    // Still burn a compare of equal length so the timing does not reveal the length.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}
