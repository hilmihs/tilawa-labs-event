"use client";

import Link from "next/link";
import { useActionState } from "react";
import { kirimMasuk, type StatusMasuk } from "./actions";
import { t, type Lang } from "@/lib/i18n/dict";
import { latinkanKetikan } from "@/lib/wa";

const AWAL: StatusMasuk = {};

export function FormMasuk({ lang, next }: { lang: Lang; next: string }) {
  const d = t(lang);
  const [state, action, pending] = useActionState(kirimMasuk, AWAL);
  const pesan = state.error ? { gagal_masuk: d.akun.errors.gagalMasuk, laju: d.akun.errors.laju }[state.error] : null;
  const qsNext = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={action} className="card flex flex-col gap-4 p-6" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="next" value={next} />
      <div>
        <h1 className="text-xl font-semibold">{d.akun.judulMasuk}</h1>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">{d.akun.introMasuk}</p>
      </div>
      {pesan ? (
        <p role="alert" className="rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] text-[var(--color-danger)]">
          {pesan}
        </p>
      ) : null}
      <div>
        <label className="label" htmlFor="wa">{d.akun.wa}</label>
        <input id="wa" name="wa" required inputMode="tel" autoComplete="username" dir="ltr" defaultValue={state.wa} onInput={latinkanKetikan} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="password">{d.akun.password}</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" dir="ltr" className="field" />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? d.form.submitting : d.akun.kirimMasuk}
      </button>
      <div className="flex flex-wrap justify-between gap-3 text-[14px] font-semibold">
        <Link href={`/${lang}/lupa-password`} className="underline">{d.akun.lupa}</Link>
        <Link href={`/${lang}/daftar-akun${qsNext}`} className="underline">{d.akun.belumPunya}</Link>
      </div>
    </form>
  );
}
