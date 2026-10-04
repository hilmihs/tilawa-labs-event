import Link from "next/link";
import { Logo } from "./logo";

import type { Peran } from "@/lib/auth/sesi";

// `panitia`: the link only works with the committee code. An usher who taps it is
// bounced to the sign-in page, so with the usher code those links are not shown.
const TAUTAN = [
  { key: "scan", href: "/scan", label: "Scanner", panitia: false },
  { key: "assist", href: "/assist", label: "Help desk", panitia: false },
  { key: "panel", href: "/panel", label: "Dashboard", panitia: true },
  { key: "ots", href: "/panel/ots", label: "Walk-in", panitia: true },
  { key: "club", href: "/panel/club", label: "Clubs", panitia: true },
  { key: "kuis", href: "/panel/kuis", label: "Quiz", panitia: true },
  { key: "absen", href: "/panel/absen", label: "No-shows", panitia: true },
  { key: "print", href: "/print", label: "Print list", panitia: true },
  { key: "aduan", href: "/admin/aduan", label: "Complaints", panitia: true },
] as const;

/**
 * `acara` is the programme the page is currently showing. Carried on every link so
 * that moving from the dashboard to the help desk does not silently drop back to
 * the default programme — staff pages read `?acara=` before the cookie.
 */
export function StaffNav({
  current,
  nama,
  pilih,
  acara,
  peran,
}: {
  current: string;
  nama?: string;
  pilih?: React.ReactNode;
  acara?: string | null;
  /** The signed-in role. Pages only the committee can open may leave it out. */
  peran?: Peran;
}) {
  const qs = acara ? `?acara=${encodeURIComponent(acara)}` : "";
  const tautan = TAUTAN.filter((t) => !t.panitia || peran !== "petugas");
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] bg-white px-5 py-3">
      <div className="flex items-center gap-5">
        <Logo kind="lockup" height={24} />
        <nav className="flex flex-wrap gap-1">
          {tautan.map((t) => (
            <Link
              key={t.key}
              href={`${t.href}${qs}`}
              className={`rounded-[8px] px-3 py-1.5 text-[14px] font-medium ${
                t.key === current
                  ? "bg-brand-100 font-semibold text-brand"
                  : "text-[var(--color-ink-2)]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[13px] text-[var(--color-ink-3)]">
        {pilih}
        {nama ? <span>{nama}</span> : null}
        <Link href="/gate" className="underline">
          Switch code
        </Link>
      </div>
    </header>
  );
}
