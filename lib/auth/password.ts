import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

type OpsiScrypt = { N: number; r: number; p: number; maxmem: number };
const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  opsi: OpsiScrypt,
) => Promise<Buffer>;

export const PANJANG_MIN_PASSWORD = 8;

const N = 32768;
const R = 8;
const P = 1;
const PANJANG_KUNCI = 64;
// scrypt needs ~128·N·r bytes; the Node default cap (32 MB) is exactly at that edge.
const MAXMEM = 64 * 1024 * 1024;

/*
 * scrypt from node:crypto, not bcrypt or argon2: no native module, so the same code
 * runs on the Azure server and in CI. NFKC first, so a password typed on an Arabic
 * or Indonesian phone keyboard matches the same password typed on a laptop.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const kunci = await scrypt(password.normalize("NFKC"), salt, PANJANG_KUNCI, {
    N,
    r: R,
    p: P,
    maxmem: MAXMEM,
  });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${kunci.toString("base64")}`;
}

/** Constant-time check. Parameters are read from the stored value, so they can be raised later. */
export async function cocokPassword(password: string, disimpan: string): Promise<boolean> {
  const bagian = disimpan.split("$");
  if (bagian.length !== 6 || bagian[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = bagian;
  const target = Buffer.from(hashB64, "base64");
  if (target.length === 0) return false;
  try {
    const kunci = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), target.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: MAXMEM,
    });
    return kunci.length === target.length && timingSafeEqual(kunci, target);
  } catch {
    return false;
  }
}
