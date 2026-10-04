import type { TautanGrup } from "@/lib/acara/view-model";
import { t, type Lang } from "@/lib/i18n/dict";
import { formatAngka } from "@/lib/waktu";

/**
 * Every WhatsApp group for one side of the hall, as buttons.
 *
 * Read from the programme row on every render, so when a group is restricted or full
 * and the committee puts a new link in /admin, the participant sees the new one the
 * next time they open their ticket or account — nobody has to send it round by hand.
 */
export function TombolGrupWa({
  lang,
  gender,
  grup,
  judul = true,
  className = "",
}: {
  lang: Lang;
  gender?: string | null;
  grup: TautanGrup[];
  judul?: boolean;
  className?: string;
}) {
  if (grup.length === 0) return null;
  const d = t(lang, gender);
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {judul ? <div className="text-[13px] font-semibold text-[var(--color-ink-2)]">{d.tiket.joinGroup}</div> : null}
      {grup.map((g, i) => (
        <a
          key={g.url}
          href={g.url}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-ghost h-11 w-full text-[14px]"
        >
          {/* Unnamed links are numbered, or several groups would read the same. */}
          {g.label ?? (grup.length > 1 ? `${d.tiket.grupBuka} ${formatAngka(i + 1, lang)}` : d.tiket.grupBuka)}
        </a>
      ))}
    </div>
  );
}
