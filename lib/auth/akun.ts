import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import type { Pengguna } from "@/db/schema";
import { ambilPenggunaById } from "@/lib/akun/queries";
import type { Lang } from "@/lib/i18n/dict";

const COOKIE_AKUN = "nawa_akun";
/*
 * A year, not a month. Participants make an account for one event day, forget the
 * password, and come back months later for the next programme; the cookie should
 * still be there. A password change bumps sesiVersi and kills every older cookie,
 * so a long lifetime is safe.
 */
const UMUR_DETIK = 60 * 60 * 24 * 365;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

/*
 * Separate from the staff cookie (nawa_sesi) and scoped "akun", so a participant
 * token can never be replayed as a staff session or a ticket token. It carries the
 * account's sesiVersi; changing the password bumps that and every older cookie dies.
 */
export async function buatSesiAkun(p: Pick<Pengguna, "id" | "sesiVersi">): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ uid: p.id, versi: p.sesiVersi, scope: "akun" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + UMUR_DETIK)
    .sign(secret());
  (await cookies()).set(COOKIE_AKUN, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UMUR_DETIK,
  });
}

export async function hapusSesiAkun(): Promise<void> {
  (await cookies()).delete(COOKIE_AKUN);
}

export async function penggunaSekarang(): Promise<Pengguna | null> {
  const raw = (await cookies()).get(COOKIE_AKUN)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secret(), { algorithms: ["HS256"] });
    if (payload.scope !== "akun" || typeof payload.uid !== "string" || typeof payload.versi !== "number") {
      return null;
    }
    const p = await ambilPenggunaById(payload.uid);
    if (!p || !p.aktif || p.sesiVersi !== payload.versi) return null;
    return p;
  } catch {
    return null;
  }
}

/** For pages and actions that need an account: the account, or a redirect to sign in. */
export async function wajibMasuk(lang: Lang, next: string): Promise<Pengguna> {
  const p = await penggunaSekarang();
  if (!p) redirect(`/${lang}/masuk?next=${encodeURIComponent(next)}`);
  return p;
}
