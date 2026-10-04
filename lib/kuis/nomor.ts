/**
 * What a player is called on the leaderboard.
 *
 * Never a name. The board is public to everyone else playing, and a list of who is
 * getting the questions wrong is not something anyone signed up for. Someone who
 * came to the lecture already has a number printed on their ticket, so that is the
 * one they will recognise; someone playing without a registration gets a stable
 * four-digit code derived from their account id.
 *
 * The derived code can collide — four digits, a few hundred players — which is
 * tolerable for a label that identifies nobody, and impossible for the ticket
 * numbers themselves, which are unique per programme.
 */

/** FNV-1a, 32-bit. Small, stable across runtimes, and not a security boundary. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function nomorTampil(penggunaId: string, nomorPeserta?: string | null): string {
  const inti = nomorPeserta?.trim()
    ? nomorPeserta.trim()
    : String(fnv1a(penggunaId) % 10_000).padStart(4, "0");
  return `#${inti}`;
}

/**
 * The two characters on the leaderboard's little tile.
 *
 * The mockup put a name's initial here. It is not worth it: initial plus side of the
 * hall plus score is enough to pick someone out of a cohort this size, and nobody
 * answering a quiz question agreed to be identified on a public board. The last two
 * digits of the number they are already listed under say just as much about which
 * row is theirs, and nothing at all about who they are.
 */
export function tandaTile(nomorTampilan: string): string {
  return nomorTampilan.replace(/\D/g, "").slice(-2) || "··";
}
