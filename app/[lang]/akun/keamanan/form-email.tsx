"use client";

import { useActionState } from "react";
import { gantiEmailAkun, type StatusKeamanan } from "./actions";
import { Galat, petaGalat } from "./form-password";
import { t, type Lang } from "@/lib/i18n/dict";

const AWAL: StatusKeamanan = {};

export function FormEmail({ lang, email, gender }: { lang: Lang; email: string; gender?: string | null }) {
  const d = t(lang, gender);
  const [state, action, pending] = useActionState(gantiEmailAkun, AWAL);

  return (
    <form action={action} className="card flex flex-col gap-4 p-6" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <h2 className="text-[17px] font-semibold">{d.akun.gantiEmail}</h2>
      <Galat pesan={state.error ? petaGalat(d)[state.error] : undefined} />

      <div>
        <label className="label" htmlFor="email">
          {d.akun.emailBaru}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          defaultValue={email}
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="password_email">
          {d.akun.password}
        </label>
        <input
          id="password_email"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
          className="field"
        />
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? d.form.submitting : d.akun.simpan}
      </button>
    </form>
  );
}
