/** A reminder only goes to someone whose invitation has had half a day to be read. */
export const JEDA_PENGINGAT_MS = 12 * 60 * 60 * 1000;

/**
 * Whether this no-show can be sent the reminder email: invited at least 12 hours
 * ago, not reminded yet, and not answered. The admin card's count and the send read
 * this same rule, so the card never offers reminders that would send nobody.
 */
export function bisaDiingatkan(
  r: { emailAt: Date | null; emailIngatAt: Date | null; diisiAt: Date | null },
  sekarang = Date.now(),
): boolean {
  return Boolean(r.emailAt && r.emailAt.getTime() <= sekarang - JEDA_PENGINGAT_MS && !r.emailIngatAt && !r.diisiAt);
}
