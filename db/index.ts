import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __nawaPool: Pool | undefined;
}

/*
 * Pool size depends on how many copies of this process there are.
 *
 * On one container there is exactly one process, so a real pool is right. On a
 * serverless platform there can be dozens of instances at once, each opening its
 * own pool — twelve connections apiece exhausts a small Postgres long before the
 * traffic does. There, keep one connection per instance and let the provider's
 * pooler (Neon's -pooler host, pgbouncer, Supavisor) do the multiplexing.
 */
function ukuranPool(): number {
  const eksplisit = Number(process.env.DB_POOL_MAX);
  if (Number.isFinite(eksplisit) && eksplisit > 0) return Math.floor(eksplisit);
  const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  return serverless ? 1 : 12;
}

/*
 * TLS for the database connection.
 *
 * `pg` v8.16 treats `sslmode=require` as `verify-full`, so a provider that signs its
 * certificates with its own root — Supabase does — fails with
 * SELF_SIGNED_CERT_IN_CHAIN even though the connection string looks right.
 *
 * The fix is to give Node that root, not to stop checking. DB_SSL_CA takes the
 * provider's CA as PEM (or base64 of it) and verification stays on, so the
 * connection is both encrypted and authenticated.
 *
 * DB_SSL_NO_VERIFY exists as an escape hatch for a local Postgres with a throwaway
 * certificate. It keeps the traffic encrypted but stops checking who is on the other
 * end, so it must not be used against a database reachable over the internet.
 */
export function konfigurasiSsl(): { ca?: string; rejectUnauthorized: boolean } | undefined {
  const ca = process.env.DB_SSL_CA?.trim();
  if (ca) {
    const pem = ca.startsWith("-----BEGIN")
      ? ca
      : Buffer.from(ca, "base64").toString("utf8");
    return { ca: pem, rejectUnauthorized: true };
  }
  if (process.env.DB_SSL_NO_VERIFY === "1") return { rejectUnauthorized: false };
  return undefined; // Let the connection string decide.
}

/*
 * `pg` merges a parsed connection string OVER the explicit config object, so an
 * `sslmode` in the URL silently wins against the ssl settings above and the CA is
 * never used. When we are supplying TLS settings ourselves, take sslmode out of the
 * URL so the two cannot disagree.
 */
export function tanpaSslmode(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("ssl");
    return u.toString();
  } catch {
    return url;
  }
}

function pool(): Pool {
  if (!globalThis.__nawaPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const ssl = konfigurasiSsl();
    globalThis.__nawaPool = new Pool({
      connectionString: ssl ? tanpaSslmode(url) : url,
      max: ukuranPool(),
      // A pooled provider endpoint drops idle clients itself; holding them open
      // just burns the connection budget.
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      ...(ssl ? { ssl } : {}),
    });
  }
  return globalThis.__nawaPool;
}

// Lazy: the pool must not be built at module load, so tests can set DATABASE_URL first.
export function getDb() {
  return drizzle(pool(), { schema });
}

export type Db = ReturnType<typeof getDb>;
export { schema };
