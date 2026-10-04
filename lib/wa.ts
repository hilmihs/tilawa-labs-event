/**
 * Arabic-Indic (٠–٩) and Eastern Arabic / Persian (۰–۹) digits → 0–9.
 *
 * An Arabic keyboard types these by default, and the Arabic page invites it. The
 * database keeps one spelling of a number, so every path that reads digits from a
 * person goes through here first. Anything that is not such a digit is untouched.
 */
export function keAngkaLatin(input: string): string {
  return input.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (c) => {
    const code = c.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/** keAngkaLatin for an optional form value; empty stays empty. */
export function latinAtauNull(v: string | null | undefined): string | null {
  return v ? keAngkaLatin(v) : null;
}

/**
 * `onInput` handler for numeric fields: rewrites Arabic digits as they are typed so
 * the person sees exactly what will be stored. The caret stays where it was — the
 * replacement never changes the length.
 */
export function latinkanKetikan(e: { currentTarget: HTMLInputElement }): void {
  const el = e.currentTarget;
  const latin = keAngkaLatin(el.value);
  if (latin === el.value) return;
  const pos = el.selectionStart;
  el.value = latin;
  if (pos !== null) el.setSelectionRange(pos, pos);
}

/**
 * Normalises a WhatsApp number to the 62… form used as the identity key.
 * Returns null when the input cannot be normalised — the caller must reject and
 * REPORT that row, never drop it quietly.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;

  // Arabic digits first, then strip spaces, hyphens, brackets, dots, non-breaking
  // spaces, and the invisible direction marks a number picks up when it is copied
  // out of right-to-left text.
  let s = keAngkaLatin(String(input)).replace(/[\s\u00A0().\-\u2010-\u2015_\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "");
  if (!s) return null;

  if (s.startsWith("+")) s = s.slice(1);
  // "0062…" and "62 0…" both show up in pasted spreadsheets.
  while (s.startsWith("00")) s = s.slice(2);

  if (/\D/.test(s)) return null;

  if (s.startsWith("62")) {
    // "620812…" — a leading zero kept after the country code.
    if (s.startsWith("620")) s = "62" + s.slice(3);
  } else if (s.startsWith("0")) {
    s = "62" + s.replace(/^0+/, "");
  } else if (s.startsWith("8")) {
    s = "62" + s;
  } else {
    return null;
  }

  return /^62[0-9]{8,13}$/.test(s) ? s : null;
}

/**
 * A wa.me link with the message already typed in, so someone reporting a problem
 * does not have to explain where they were — the page and the programme are in the
 * text before they start writing. Returns null when the admin number is unusable,
 * and the caller then shows nothing rather than a broken link.
 */
export function tautanWa(nomor: string | null | undefined, pesan: string): string | null {
  const wa = normalizePhone(nomor);
  if (!wa) return null;
  return `https://wa.me/${wa}?text=${encodeURIComponent(pesan)}`;
}

/** Last four digits — the only part of a number the access log is allowed to keep. */
export function empatDigit(wa: string | null | undefined): string | null {
  if (!wa) return null;
  const d = String(wa).replace(/\D/g, "");
  return d.length >= 4 ? d.slice(-4) : null;
}

/** "628123456789" → "+62 812 3456 789" for display only. */
export function formatWaTampil(wa: string): string {
  if (!wa.startsWith("62")) return wa;
  const rest = wa.slice(2);
  const a = rest.slice(0, 3);
  const b = rest.slice(3, 7);
  const c = rest.slice(7);
  return `+62 ${a}${b ? " " + b : ""}${c ? " " + c : ""}`.trim();
}
