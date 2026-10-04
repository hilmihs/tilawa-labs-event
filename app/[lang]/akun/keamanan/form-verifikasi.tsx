"use client";

import { useActionState } from "react";
import { kirimKodeVerifikasi, verifikasiEmail, type StatusKeamanan } from "./actions";
import { Galat, petaGalat } from "./form-password";
import { t, type Lang } from "@/lib/i18n/dict";
import { latinkanKetikan } from "@/lib/wa";

const AWAL: StatusKeamanan = {};

export function FormVerifikasi({
  lang,
  terverifikasi,
  email,
  gender,
}: {
  lang: Lang;
  terverifikasi: boolean;
  email: string;
  gender?: string | null;
}) {
  const d = t(lang, gender);
  // Both hooks run on every render, including the verified case: hooks cannot sit
  // behind a condition.
  const [statusKirim, aksiKirim, sedangKirim] = useActionState(kirimKodeVerifikasi, AWAL);
  const [statusPeriksa, aksiPeriksa, sedangPeriksa] = useActionState(verifikasiEmail, AWAL);
  const peta = petaGalat(d);

  if (terverifikasi) {
    return (
      <section className="card p-6">
        <h2 className="text-[17px] font-semibold">{d.akun.email}</h2>
        <p className="mt-2 text-[15px] text-[var(--color-ink-2)]">
          <span dir="ltr" className="font-semibold text-[var(--color-ink)]">{email}</span> · {d.akun.emailSudah}
        </p>
      </section>
    );
  }

  return (
    <section className="card flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-[17px] font-semibold">{d.akun.email}</h2>
        {/* Which address the code goes to, so a typo shows before a code is waited for. */}
        <p className="mt-1.5 text-[14px] text-[var(--color-ink-2)]">
          <span dir="ltr" className="font-semibold text-[var(--color-ink)]">{email}</span> · {d.akun.emailBelum}
        </p>
      </div>
      <Galat pesan={statusKirim.error ? peta[statusKirim.error] : undefined} />

      <form action={aksiKirim}>
        <input type="hidden" name="lang" value={lang} />
        <button type="submit" className="btn btn-ghost w-full" disabled={sedangKirim}>
          {sedangKirim ? d.form.submitting : d.akun.kirimKodeVerifikasi}
        </button>
      </form>

      <form action={aksiPeriksa} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="lang" value={lang} />
        <Galat pesan={statusPeriksa.error ? peta[statusPeriksa.error] : undefined} />
        <div>
          <label className="label" htmlFor="kode">
            {d.akun.kode}
          </label>
          <input
            id="kode"
            name="kode"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            dir="ltr"
            onInput={latinkanKetikan}
            className="field tracking-[0.3em]"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={sedangPeriksa}>
          {sedangPeriksa ? d.form.submitting : d.akun.verifikasi}
        </button>
      </form>
    </section>
  );
}
