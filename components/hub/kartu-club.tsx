import Link from "next/link";
import { TandaClub } from "./tanda-club";
import { CLUB, FEST, type PintuKey } from "@/lib/hub/konten";
import { t, type Lang } from "@/lib/i18n/dict";

/**
 * A club, or Tilawa Labs Fest, as a door: mark, name, one hook and two chips. Nothing else —
 * the whole point of this card is that it can be read in the time it takes to scroll
 * past it. Tilawa Labs Fest is set on butter and carries "Coming soon", so it reads as an
 * event rather than a fourth club.
 */
export function KartuClub({
  lang,
  club,
  tercatat = false,
  gender,
}: {
  lang: Lang;
  club: PintuKey;
  tercatat?: boolean;
  gender?: string | null;
}) {
  const fest = club === "fest";
  const c = fest ? FEST : CLUB[club];
  const d = t(lang, gender);
  return (
    <Link
      href={`/${lang}/hub/${club}`}
      className={`card group flex h-full flex-col p-6 transition-colors hover:bg-white ${fest ? "bg-[var(--color-butter)]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <TandaClub club={club} className="h-11 w-11 text-brand" />
        {tercatat ? (
          <span className="rounded-[5px] bg-brand px-2 py-0.5 text-[12px] font-semibold text-[var(--color-butter)]">
            ✓ {d.hub.tercatat}
          </span>
        ) : fest ? (
          <span className="rounded-[5px] bg-[var(--color-ink)] px-2 py-0.5 text-[12px] font-semibold text-[var(--color-butter)]">
            {d.hub.festEyebrow}
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 text-[19px] font-semibold leading-[1.3] lg:text-[21px]">{c.nama[lang]}</h3>
      <p className="mt-2 flex-1 text-[15px] leading-[1.55] text-[var(--color-ink-2)] lg:text-[17px]">{c.hook[lang]}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {c.chips.map((chip) => (
          <li
            key={chip.en}
            className="rounded-[5px] bg-brand-100 px-2 py-1 text-[12px] font-medium text-brand lg:text-[13px]"
          >
            {chip[lang]}
          </li>
        ))}
      </ul>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-bold text-brand">
        {d.hub.lihat}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5">
          →
        </span>
      </span>
    </Link>
  );
}
