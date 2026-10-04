"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Logo } from "@/components/logo";
import { LangSwitch } from "@/components/lang-switch";
import { bacaTiketTersimpan, type TiketTersimpan as Simpanan } from "../[token]/client";
import { t, type Lang } from "@/lib/i18n/dict";

export function TiketTersimpan({ lang }: { lang: Lang }) {
  const [data, setData] = useState<Simpanan | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [siap, setSiap] = useState(false);
  // The cached row carries her gender, so the offline copy of the ticket reads the
  // same as the online one. With nothing cached there is nobody to address yet.
  const d = t(lang, data?.gender);

  useEffect(() => {
    const p = bacaTiketTersimpan();
    setData(p);
    setSiap(true);
    if (p) {
      // Drawn in the browser: the code came from localStorage, so no request is
      // needed to turn it back into a QR.
      void QRCode.toString(p.kode, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 1,
        color: { dark: "#2D2F2B", light: "#FFFFFF" },
      }).then(setQr);
    }
  }, []);

  if (!siap) return null;

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-14">
      <header className="flex h-14 items-center justify-between border-b border-[var(--color-line)] bg-white px-5">
        <Link href={`/${lang}`} className="text-[var(--color-ink)]">
          <Logo kind="lockup" height={22} />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--color-ink-3)]">{d.tiket.label}</span>
          <LangSwitch lang={lang} />
        </div>
      </header>

      {!data ? (
        <div className="mx-auto max-w-[440px] px-5 py-12 text-center">
          <h1 className="text-xl font-semibold">{d.tiket.savedNoneTitle}</h1>
          <p className="mt-2 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">
            {d.tiket.savedNoneBody}
          </p>
          <Link href={`/${lang}/ticket`} className="btn btn-primary mt-6 w-full">
            {d.tiket.findAgain}
          </Link>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[440px] px-5 py-5">
          <div className="mb-3 rounded-[8px] bg-[var(--color-warn)]/20 px-4 py-3 text-[13px] leading-[1.6]">
            {d.tiket.savedNote}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-[var(--color-line)] p-4 text-center">
              <div className="eyebrow">{d.tiket.nomor}</div>
              <div className="mt-1.5 text-[22px] font-bold leading-[1.2]">{data.nomor}</div>
            </div>
            <div className="flex flex-col items-center px-5 pb-4 pt-5">
              {qr ? (
                <div
                  className="w-[260px] max-w-full"
                  dangerouslySetInnerHTML={{ __html: qr }}
                  role="img"
                  aria-label={d.tiket.showAtGate}
                />
              ) : (
                <div className="h-[260px] w-[260px] max-w-full animate-pulse rounded bg-[var(--color-line)]" />
              )}
              <p className="mt-2.5 text-center text-[13px] leading-[1.5] text-[var(--color-ink-2)]">
                {d.tiket.showAtGate}
              </p>
            </div>
            <div className="flex gap-3.5 border-t border-[var(--color-line)] px-4 py-3">
              <span className="w-[88px] flex-none text-[13px] text-[var(--color-ink-3)]">
                {d.tiket.nama}
              </span>
              <span className="text-[15px] font-semibold">{data.nama}</span>
            </div>
            <div className="flex gap-3.5 border-t border-[var(--color-line)] px-4 py-3">
              <span className="w-[88px] flex-none text-[13px] text-[var(--color-ink-3)]">
                {d.tiket.entrance}
              </span>
              <span className="text-[15px]">
                {data.gender === "akhwat" ? d.gender.akhwat : d.gender.ikhwan} —{" "}
                {data.gender === "akhwat" ? d.gate.akhwat : d.gate.ikhwan}
              </span>
            </div>
          </div>

          <Link href={`/${lang}/ticket`} className="btn btn-ghost mt-3 w-full">
            {d.tiket.savedRefresh}
          </Link>
        </div>
      )}
    </main>
  );
}
