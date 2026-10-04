"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { kirimReset, type StatusReset } from "./actions";
import { t, type Lang } from "@/lib/i18n/dict";
import { latinkanKetikan } from "@/lib/wa";

const AWAL: StatusReset = {};

export function FormReset({ lang, wa }: { lang: Lang; wa: string }) {
  const d = t(lang);
  const [state, action, pending] = useActionState(kirimReset, AWAL);
  const [takSama, setTakSama] = useState(false);
  const e = d.akun.errors;
  const pesanServer = state.error
    ? { kode_salah: e.kodeSalah, kode_kadaluarsa: e.kodeKadaluarsa, password_pendek: e.passwordPendek, laju: e.laju }[state.error]
    : null;
  // A typo here would lock the participant out again right after the reset, and a new code
  // costs another round trip, so refuse the submit while the two fields differ.
  const pesan = takSama ? d.akun.passwordTidakSama : pesanServer;

  function periksaSama(ev: FormEvent<HTMLFormElement>) {
    const data = new FormData(ev.currentTarget);
    if (data.get("password") === data.get("password_ulang")) return;
    ev.preventDefault();
    setTakSama(true);
  }

  // Drop the warning as soon as the two fields agree again, without waiting for another submit.
  function cocokkan(ev: FormEvent<HTMLInputElement>) {
    const form = ev.currentTarget.form;
    if (!takSama || !form) return;
    const data = new FormData(form);
    if (data.get("password") === data.get("password_ulang")) setTakSama(false);
  }

  return (
    <form action={action} onSubmit={periksaSama} className="card flex flex-col gap-4 p-6" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <h1 className="text-xl font-semibold">{d.akun.judulReset}</h1>
      {pesan ? (
        <p role="alert" className="rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] text-[var(--color-danger)]">
          {pesan}
          {!takSama && state.error === "kode_kadaluarsa" ? (
            <Link href={`/${lang}/lupa-password`} className="ms-2 font-semibold underline">{d.akun.mintaKodeBaru}</Link>
          ) : null}
        </p>
      ) : null}
      <div>
        <label className="label" htmlFor="wa">{d.akun.wa}</label>
        <input id="wa" name="wa" required inputMode="tel" autoComplete="username" dir="ltr" defaultValue={state.wa ?? wa} onInput={latinkanKetikan} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="kode">{d.akun.kode}</label>
        <input id="kode" name="kode" required inputMode="numeric" autoComplete="one-time-code" maxLength={6} dir="ltr" onInput={latinkanKetikan} className="field tracking-[0.3em]" />
      </div>
      <div>
        <label className="label" htmlFor="password">{d.akun.passwordBaru}</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" dir="ltr" onInput={cocokkan} className="field" />
        <p className="mt-1.5 text-[13px] text-[var(--color-ink-3)]">{d.akun.passwordHint}</p>
      </div>
      <div>
        <label className="label" htmlFor="password_ulang">{d.akun.passwordUlang}</label>
        <input id="password_ulang" name="password_ulang" type="password" required minLength={8} autoComplete="new-password" dir="ltr" onInput={cocokkan} className="field" />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? d.form.submitting : d.akun.kirimReset}
      </button>
    </form>
  );
}
