"use client";

import { useActionState, useState, type FormEvent } from "react";
import { gantiPasswordAkun, type StatusKeamanan } from "./actions";
import { t, type Lang } from "@/lib/i18n/dict";

const AWAL: StatusKeamanan = {};

/** One place for the error copy: the three security forms share the same states. */
export function petaGalat(d: ReturnType<typeof t>): Record<string, string> {
  return {
    password_lama_salah: d.akun.errors.passwordLamaSalah,
    password_pendek: d.akun.errors.passwordPendek,
    email_tidak_valid: d.akun.errors.emailTidakValid,
    email_terpakai: d.akun.errors.emailTerpakai,
    kode_salah: d.akun.errors.kodeSalah,
    kode_kadaluarsa: d.akun.errors.kodeKadaluarsa,
    laju: d.akun.errors.laju,
    umum: d.akun.errors.umum,
  };
}

export function Galat({ pesan }: { pesan: string | undefined }) {
  if (!pesan) return null;
  return (
    <p
      role="alert"
      className="rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] text-[var(--color-danger)]"
    >
      {pesan}
    </p>
  );
}

export function FormPassword({ lang, gender }: { lang: Lang; gender?: string | null }) {
  const d = t(lang, gender);
  const [state, action, pending] = useActionState(gantiPasswordAkun, AWAL);
  const [takSama, setTakSama] = useState(false);

  // A mistyped new password locks the owner out of an account they may only need on one
  // event day, so stop the submit while the confirmation does not match.
  function periksaSama(ev: FormEvent<HTMLFormElement>) {
    const data = new FormData(ev.currentTarget);
    if (data.get("password_baru") === data.get("password_baru_ulang")) return;
    ev.preventDefault();
    setTakSama(true);
  }

  // Drop the warning as soon as the two fields agree again, without waiting for another submit.
  function cocokkan(ev: FormEvent<HTMLInputElement>) {
    const form = ev.currentTarget.form;
    if (!takSama || !form) return;
    const data = new FormData(form);
    if (data.get("password_baru") === data.get("password_baru_ulang")) setTakSama(false);
  }

  return (
    <form action={action} onSubmit={periksaSama} className="card flex flex-col gap-4 p-6" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <h2 className="text-[17px] font-semibold">{d.akun.gantiPassword}</h2>
      <Galat pesan={takSama ? d.akun.passwordTidakSama : state.error ? petaGalat(d)[state.error] : undefined} />

      <div>
        <label className="label" htmlFor="password_lama">
          {d.akun.passwordLama}
        </label>
        <input
          id="password_lama"
          name="password_lama"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="password_baru">
          {d.akun.passwordBaru}
        </label>
        <input
          id="password_baru"
          name="password_baru"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          dir="ltr"
          onInput={cocokkan}
          className="field"
        />
        <p className="mt-1.5 text-[13px] text-[var(--color-ink-3)]">{d.akun.passwordHint}</p>
      </div>

      <div>
        <label className="label" htmlFor="password_baru_ulang">
          {d.akun.passwordUlang}
        </label>
        <input
          id="password_baru_ulang"
          name="password_baru_ulang"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          dir="ltr"
          onInput={cocokkan}
          className="field"
        />
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? d.form.submitting : d.akun.simpan}
      </button>
    </form>
  );
}
