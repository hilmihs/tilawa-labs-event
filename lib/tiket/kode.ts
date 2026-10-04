// Crockford base32 without I, L, O and U. Help-desk staff sometimes read a code
// out over a radio, and those four are the ones that get misheard.
const ALFABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const PANJANG = 10;

/**
 * QR payload. 32 divides 256 exactly, so `b % 32` introduces no modulo bias.
 * Collisions are handled by the unique index on `kode`, not by trusting this.
 */
export function generateKodeTiket(): string {
  const bytes = new Uint8Array(PANJANG);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALFABET[b % 32];
  return out;
}

/** Normalises a hand-typed or radio-relayed code: uppercase, map look-alikes. */
export function normalizeKode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[ILO]/g, (c) => (c === "O" ? "0" : "1"))
    .replace(/U/g, "V")
    .replace(/[^0-9A-Z]/g, "");
}

export function isKodeValid(input: string): boolean {
  const k = normalizeKode(input);
  return k.length === PANJANG && [...k].every((c) => ALFABET.includes(c));
}
