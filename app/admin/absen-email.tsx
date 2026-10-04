"use client";

import { useActionState } from "react";
import { kirimEmailAbsen, type StatusEmailAbsen } from "./absen-email-actions";

const AWAL: StatusEmailAbsen = {};

export function EmailAbsen({
  slug,
  selesai,
  adaCatatan,
  hitung,
}: {
  slug: string;
  selesai: boolean;
  /** Without notes the email is a plain thank-you and the question — no gift. */
  adaCatatan: boolean;
  hitung: { absen: number; punyaEmail: number; belumUndangan: number; bisaDiingatkan: number };
}) {
  const [state, action, pending] = useActionState(kirimEmailAbsen, AWAL);
  return (
    <section className="card flex flex-col gap-3 p-5">
      <div>
        <h2 className="text-[17px] font-semibold">No-show email</h2>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
          {adaCatatan
            ? "The gift (lecture notes, unlocked after the 30-second question), to everyone who registered and did not come."
            : "A thank-you and the 30-second question, to everyone who registered and did not come."}{" "}
          {hitung.absen} no-shows · {hitung.punyaEmail} with an email · {hitung.belumUndangan} not yet invited ·{" "}
          {hitung.bisaDiingatkan} can get a reminder (12 hours after their invitation). Send yourself the sample first.
        </p>
        {!selesai ? (
          <p className="mt-2 text-[13px] font-semibold text-[var(--color-danger)]">
            Set the status to finished first.
          </p>
        ) : null}
      </div>
      {state.error ? (
        <p role="alert" className="break-words rounded-[8px] bg-[var(--color-danger)]/10 px-4 py-3 text-[13px] text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="rounded-[8px] bg-brand-100 px-4 py-3 text-[13px] font-semibold text-brand">{state.ok}</p> : null}
      <form action={action} className="flex flex-wrap gap-2">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="mode" value="uji" />
        <input name="ke" type="email" required placeholder="you@example.com" className="field min-w-0 flex-1" />
        <button type="submit" disabled={pending || !selesai} className="btn btn-ghost">Send sample</button>
      </form>
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="mode" value="undangan" />
          <button type="submit" disabled={pending || !selesai || hitung.belumUndangan === 0} className="btn btn-primary">
            {pending ? "Sending…" : "Send invitations to all"}
          </button>
        </form>
        <form action={action}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="mode" value="pengingat" />
          <button type="submit" disabled={pending || !selesai || hitung.bisaDiingatkan === 0} className="btn btn-ghost">
            Send reminder to all
          </button>
        </form>
      </div>
    </section>
  );
}
