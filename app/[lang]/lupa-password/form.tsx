"use client";

import Link from "next/link";
import { useActionState } from "react";
import { kirimLupa, type StatusLupa } from "./actions";
import { t, type Lang } from "@/lib/i18n/dict";
import { latinkanKetikan } from "@/lib/wa";

const AWAL: StatusLupa = {};

export function FormLupa({ lang }: { lang: Lang }) {
  const d = t(lang);
  const [state, action, pending] = useActionState(kirimLupa, AWAL);
  return (
    <form action={action} className="card flex flex-col gap-4 p-6" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <div>
        <h1 className="text-xl font-semibold">{d.akun.judulLupa}</h1>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">{d.akun.introLupa}</p>
      </div>
      {state.error === "laju" ? (
        <p role="alert" className="rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] text-[var(--color-danger)]">
          {d.akun.errors.laju}
        </p>
      ) : null}
      {state.terkirim ? (
        <p role="status" className="rounded-[8px] bg-brand-100 px-4 py-3 text-[14px] leading-[1.5]">{d.akun.terkirimLupa}</p>
      ) : null}
      <div>
        <label className="label" htmlFor="wa">{d.akun.wa}</label>
        <input id="wa" name="wa" required inputMode="tel" autoComplete="username" dir="ltr" defaultValue={state.wa} onInput={latinkanKetikan} className="field" />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? d.form.submitting : d.akun.kirimLupa}
      </button>
      <Link
        href={`/${lang}/reset-password${state.wa ? `?wa=${encodeURIComponent(state.wa)}` : ""}`}
        className="text-center text-[14px] font-semibold underline"
      >
        {d.akun.punyaKode}
      </Link>
    </form>
  );
}
