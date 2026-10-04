import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { kodeCocok } from "@/lib/keamanan";

/**
 * Three separate codes, never one. The usher code will leak into the committee
 * WhatsApp group — it always does. If that same code opened the dashboard, the
 * whole participant list would leak with it.
 */
export type Peran = "petugas" | "panitia" | "admin";

const COOKIE = "nawa_sesi";
const DURASI_DETIK = 60 * 60 * 20; // one long event day

const ENV_KODE: Record<Peran, string> = {
  petugas: "KODE_PETUGAS",
  panitia: "KODE_PANITIA",
  admin: "KODE_ADMIN",
};

// admin implies panitia implies petugas; the reverse never holds.
const TERMASUK: Record<Peran, Peran[]> = {
  petugas: ["petugas"],
  panitia: ["panitia", "petugas"],
  admin: ["admin", "panitia", "petugas"],
};

export type Sesi = { peran: Peran; nama: string };

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

/** Returns the role a code opens, or null. Codes are never stored client-side. */
export function peranUntukKode(kode: string): Peran | null {
  for (const peran of ["admin", "panitia", "petugas"] as Peran[]) {
    if (kodeCocok(kode, process.env[ENV_KODE[peran]])) return peran;
  }
  return null;
}

export async function buatSesi(peran: Peran, nama: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ peran, nama, scope: "sesi" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + DURASI_DETIK)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURASI_DETIK,
  });
}

export async function hapusSesi(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function sesiSekarang(): Promise<Sesi | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secret(), { algorithms: ["HS256"] });
    if (payload.scope !== "sesi") return null;
    const peran = payload.peran;
    if (peran !== "petugas" && peran !== "panitia" && peran !== "admin") return null;
    return { peran, nama: typeof payload.nama === "string" ? payload.nama : "" };
  } catch {
    return null;
  }
}

export async function punyaAkses(minimal: Peran): Promise<Sesi | null> {
  const s = await sesiSekarang();
  if (!s) return null;
  return TERMASUK[s.peran].includes(minimal) ? s : null;
}
