import Link from "next/link";
import { LangSwitch } from "./lang-switch";
import { Logo } from "./logo";
import { penggunaSekarang } from "@/lib/auth/akun";
import { t, type Lang } from "@/lib/i18n/dict";

export async function PageHeader({
  lang,
  title,
  back,
  right,
  tautanAkun = true,
}: {
  lang: Lang;
  title?: string;
  back?: string;
  right?: string;
  tautanAkun?: boolean;
}) {
  const akun = tautanAkun ? await penggunaSekarang() : null;
  const d = t(lang);
  // The title is not leading-none: truncate clips at the line box, and Arabic letters
  // and their dots reach below it.
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b-[1.5px] border-[var(--color-ink)] bg-[var(--color-surface)] px-5">
      <div className="flex min-w-0 items-center gap-3">
        {back ? (
          <Link href={back} aria-label="Back" className="flex-none p-1 text-[var(--color-ink)]">
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="rtl:rotate-180">
              <path
                d="M6.5 1 2.5 5l4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ) : (
          <Link href={`/${lang}`} className="text-[var(--color-ink)]">
            <Logo kind="lockup" height={34} tone="dark" />
          </Link>
        )}
        {title ? (
          <span className="truncate py-1 text-[17px] font-semibold leading-[1.5] lg:text-[19px]">{title}</span>
        ) : null}
      </div>
      <div className="flex flex-none items-center gap-3">
        {/*
          The ticket page is the page people keep and come back to, so the way
          to the account must be reachable from it and every other inner page,
          not only from the landing header.
        */}
        {tautanAkun ? (
          <Link
            href={akun ? `/${lang}/akun` : `/${lang}/masuk`}
            className="text-[14px] font-semibold text-[var(--color-ink)] lg:text-[16px] underline-offset-4 hover:underline"
          >
            {akun ? d.akun.akunSaya : d.akun.masuk}
          </Link>
        ) : null}
        {right ? (
          <span className="text-xs font-medium text-[var(--color-ink-3)] lg:text-sm">{right}</span>
        ) : null}
        <LangSwitch lang={lang} />
      </div>
    </header>
  );
}
