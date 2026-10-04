/**
 * The committee's Instagram, in the footer of every public page.
 *
 * The account is the one place a visitor can check that this site is really Tilawa Labs's,
 * and the place announcements keep appearing after the event. The handle is written
 * out rather than hidden behind an icon, and it is always left to right — a handle
 * is not translated, and on the Arabic page a bare glyph would read as decoration.
 */
export const INSTAGRAM_URL = "https://example.org/";
export const INSTAGRAM_HANDLE = "@tilawalabs";

export function Instagram({ className }: { className?: string }) {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noreferrer noopener me"
      dir="ltr"
      className={`inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-ink)] ${className ?? ""}`.trim()}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden fill="currentColor">
        <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.4-3.1a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
      </svg>
      {INSTAGRAM_HANDLE}
    </a>
  );
}
