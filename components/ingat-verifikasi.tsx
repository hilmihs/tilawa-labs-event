import Link from "next/link";
import { t, type Lang } from "@/lib/i18n/dict";

/**
 * A gentle nudge to verify the account email. Never a gate: registration and the
 * ticket work without it. It exists because a mistyped address is only discovered
 * when the password is forgotten and the reset code never arrives — usually the
 * night before the event.
 *
 * The link goes through sign-in when needed: the ticket page is reachable without a
 * session, and verifying is an account action.
 */
export function IngatVerifikasi({
  lang,
  gender,
  email,
  sudahMasuk,
  className = "",
}: {
  lang: Lang;
  gender?: string | null;
  email: string;
  sudahMasuk: boolean;
  className?: string;
}) {
  const d = t(lang, gender);
  const tujuan = `/${lang}/akun/keamanan`;
  const href = sudahMasuk ? tujuan : `/${lang}/masuk?next=${encodeURIComponent(tujuan)}`;
  return (
    <div className={`rounded-[8px] border border-[var(--color-warn)]/50 bg-[var(--color-warn)]/12 p-4 ${className}`}>
      <div className="text-[15px] font-semibold">{d.akun.ingatVerifikasiJudul}</div>
      <p className="mt-1 text-[13px] leading-[1.55] text-[var(--color-ink-2)]">
        {d.akun.ingatVerifikasiIsi.split("{email}")[0]}
        <span dir="ltr" className="font-semibold text-[var(--color-ink)]">
          {email}
        </span>
        {d.akun.ingatVerifikasiIsi.split("{email}")[1] ?? ""}
      </p>
      <Link href={href} className="btn btn-ghost mt-3 h-10 text-[14px]">
        {d.akun.ingatVerifikasiTombol}
      </Link>
    </div>
  );
}
