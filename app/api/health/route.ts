import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { driverEmail } from "@/lib/email/kirim";

export const dynamic = "force-dynamic";

/*
 * Configuration the running process can see, by NAME only — never a value.
 *
 * Nobody on the committee can read the deploy pipeline's logs, so this is how they
 * find out whether the variable group actually reached the server. Only whether a
 * variable is set is reported; that tells an outsider nothing they could use.
 */
const RAHASIA = ["AUTH_SECRET", "IP_SALT", "KODE_PETUGAS", "KODE_PANITIA", "KODE_ADMIN", "EXPORT_TOKEN"];
// PROXY_HOPS and the BATAS_* limits are left out: each has a working default.
const BIASA = ["DATABASE_URL", "ACARA_SLUG", "NEXT_PUBLIC_BASE_URL", "NEXT_PUBLIC_WA_ADMIN"];

function terbaca(nama: string): boolean {
  // Looked up by a computed key on purpose: `process.env.NEXT_PUBLIC_X` written out
  // is replaced with its build-time value, and this has to see the running process.
  const env = process.env as Record<string, string | undefined>;
  return Boolean(env[nama]?.trim());
}

function dilihatPipeline(): string[] | null {
  const env = process.env as Record<string, string | undefined>;
  const daftar = env["NAWA_ENV_KEYS"];
  if (daftar === undefined) return null;
  return daftar.split(",").map((k) => k.trim()).filter(Boolean).sort();
}

function konfigurasi() {
  const semua = [...RAHASIA, ...BIASA];
  const kurang = semua.filter((n) => !terbaca(n));
  // Names still carrying the variable group's ENV_ prefix mean the server is reading
  // an env file written before the prefix was stripped.
  const masihBerawalanEnv = Object.keys(process.env).filter((k) => k.startsWith("ENV_")).sort();
  return {
    lengkap: kurang.length === 0,
    kurang,
    masihBerawalanEnv,
    // What the build baked into the pages, as opposed to what the process has now.
    waAdminSaatBuild: Boolean(process.env.NEXT_PUBLIC_WA_ADMIN?.trim()),
    // Variable names the deploy pipeline itself saw in the variable group, written
    // by the pipeline into nawa.env. null: that deploy predates the list. A short
    // list here means the group, not the server, is missing the values.
    dilihatPipeline: dilihatPipeline(),
    // Which mail transport is live and whether its key is present — never the key.
    email: {
      driver: driverEmail(),
      kunciSendgrid: terbaca("SENDGRID_API_KEY"),
    },
  };
}

/**
 * Must touch the database. An app that is up but cannot read participants is,
 * for this event, down — and a health check that skips the DB reports it healthy,
 * so the automatic rollback never fires.
 */
export async function GET() {
  const versi = process.env.APP_VERSION ?? "dev";
  try {
    const db = getDb();
    await db.execute(sql`select 1 from acara limit 1`);
    return NextResponse.json(
      { ok: true, db: "ok", versi, konfigurasi: konfigurasi() },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    // Drizzle wraps the driver error, and the useful part — a TLS or auth failure —
    // is only in the cause. Without unwrapping, every connection problem looks like
    // the same opaque "Failed query".
    const err = e as Error & { cause?: { message?: string; code?: string } };
    const sebab = err.cause?.code ?? err.cause?.message;
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        versi,
        pesan: err.message?.split("\n")[0],
        ...(sebab ? { sebab } : {}),
        konfigurasi: konfigurasi(),
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
