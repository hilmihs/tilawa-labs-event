"use client";

import { useActionState } from "react";
import { kirimEmailUji, type StatusUjiEmail } from "./email-actions";

const AWAL: StatusUjiEmail = {};

export function UjiEmail({ driver, dari }: { driver: string; dari: string }) {
  const [state, action, pending] = useActionState(kirimEmailUji, AWAL);
  return (
    <form action={action} className="card flex flex-col gap-3 p-5">
      <div>
        <h2 className="text-[17px] font-semibold">Email</h2>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
          Password-reset codes go out through <b>{driver}</b> from <b>{dari}</b>. Send yourself a test after
          changing the keys or the domain settings.
        </p>
      </div>
      {state.error ? (
        <p role="alert" className="break-words rounded-[8px] bg-[var(--color-danger)]/10 px-4 py-3 text-[13px] text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="rounded-[8px] bg-brand-100 px-4 py-3 text-[13px] font-semibold text-brand">{state.ok}</p> : null}
      <div className="flex flex-wrap gap-2">
        <input name="ke" type="email" required placeholder="you@example.com" className="field min-w-0 flex-1" />
        <button type="submit" disabled={pending} className="btn btn-ghost">
          {pending ? "Sending…" : "Send test email"}
        </button>
      </div>
    </form>
  );
}
