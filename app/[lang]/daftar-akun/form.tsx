"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { kirimDaftarAkun, type StatusDaftarAkun } from "./actions";
import { Pilihan } from "@/components/pilihan";
import { t, type Lang } from "@/lib/i18n/dict";
import { latinkanKetikan } from "@/lib/wa";

const AWAL: StatusDaftarAkun = {};

export function FormDaftarAkun({ lang, next }: { lang: Lang; next: string }) {
  const d = t(lang);
  const [state, action, pending] = useActionState(kirimDaftarAkun, AWAL);
  const [gender, setGender] = useState(state.nilai?.gender ?? "ikhwan");
  const [takSama, setTakSama] = useState(false);
  const v = state.nilai ?? {};
  const e = d.akun.errors;
  const pesanServer = state.error
    ? {
        nama_pendek: e.namaPendek,
        wa_tidak_valid: e.waTidakValid,
        email_tidak_valid: e.emailTidakValid,
        password_pendek: e.passwordPendek,
        wa_terpakai: e.waTerpakai,
        email_terpakai: e.emailTerpakai,
        wajib_setuju: e.wajibSetuju,
        laju: e.laju,
      }[state.error]
    : null;
  // A mistyped password on an account made for one event day means a locked-out
  // participant on the day itself, so block the submit while the two differ.
  const pesan = takSama ? d.akun.passwordTidakSama : pesanServer;
  const qsNext = next ? `?next=${encodeURIComponent(next)}` : "";

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
      <input type="hidden" name="next" value={next} />
      <div>
        <h1 className="text-xl font-semibold">{d.akun.judulDaftar}</h1>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">{d.akun.introDaftar}</p>
      </div>

      {pesan ? (
        <div role="alert" className="rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] leading-[1.5] text-[var(--color-danger)]">
          {pesan}
          {!takSama && state.error === "wa_terpakai" ? (
            <div className="mt-2 flex flex-wrap gap-4 font-semibold">
              <Link href={`/${lang}/masuk${qsNext}`} className="underline">{d.akun.masuk}</Link>
              <Link href={`/${lang}/lupa-password`} className="underline">{d.akun.lupa}</Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="nama">{d.form.name}</label>
        <input id="nama" name="nama" required autoComplete="name" defaultValue={v.nama} className="field" />
      </div>
      <div>
        <span className="label">{d.form.gender}</span>
        <Pilihan
          name="gender"
          value={gender}
          onChange={setGender}
          options={[
            { value: "ikhwan", label: d.gender.ikhwan },
            { value: "akhwat", label: d.gender.akhwat },
          ]}
        />
      </div>
      <div>
        <label className="label" htmlFor="wa">{d.akun.wa}</label>
        <input id="wa" name="wa" required inputMode="tel" autoComplete="tel" dir="ltr" defaultValue={v.wa} onInput={latinkanKetikan} className="field" />
        <p className="mt-1.5 text-[13px] text-[var(--color-ink-3)]">{d.akun.waHint}</p>
      </div>
      <div>
        <label className="label" htmlFor="email">{d.akun.email}</label>
        <input id="email" name="email" type="email" required autoComplete="email" dir="ltr" defaultValue={v.email} className="field" />
        <p className="mt-1.5 text-[13px] text-[var(--color-ink-3)]">{d.akun.emailHint}</p>
      </div>
      <div>
        <label className="label" htmlFor="password">{d.akun.password}</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" dir="ltr" onInput={cocokkan} className="field" />
        <p className="mt-1.5 text-[13px] text-[var(--color-ink-3)]">{d.akun.passwordHint}</p>
      </div>
      <div>
        <label className="label" htmlFor="password_ulang">{d.akun.passwordUlang}</label>
        <input id="password_ulang" name="password_ulang" type="password" required minLength={8} autoComplete="new-password" dir="ltr" onInput={cocokkan} className="field" />
      </div>
      <label className="flex items-start gap-3 text-[14px] leading-[1.5]">
        <input type="checkbox" name="setuju" className="mt-0.5 h-5 w-5 flex-none accent-[var(--color-brand)]" />
        <span>{d.akun.setuju}</span>
      </label>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? d.form.submitting : d.akun.kirimDaftar}
      </button>
      <Link href={`/${lang}/masuk${qsNext}`} className="text-center text-[14px] font-semibold underline">
        {d.akun.sudahPunya}
      </Link>
    </form>
  );
}
