"use client";

import { useState } from "react";
import { ubahKehadiranRencana } from "./edit/actions";
import { t, type Lang } from "@/lib/i18n/dict";

/**
 * Releasing a seat asks for the last four digits of the registered number first.
 *
 * Two reasons, and both matter. The ticket link is recoverable from a WhatsApp
 * number and the first letters of a name — both semi-public inside a class group —
 * so without a second step a leaked link could cancel someone else's registration
 * silently, and they would only find out at the door. And it stops a mis-tap on a
 * phone from throwing away a seat that cannot be un-thrown if someone else has
 * already registered into it.
 *
 * Four digits is not a secret. It is a deliberate speed bump: enough that it cannot
 * happen by accident or by holding the link alone, cheap enough that the person
 * whose seat it is never has to look anything up.
 */
export function LepasKursi({
  lang,
  token,
  wa4,
  gender,
}: {
  lang: Lang;
  token: string;
  wa4: string;
  gender?: string | null;
}) {
  const d = t(lang, gender);
  const [buka, setBuka] = useState(false);
  const [ketik, setKetik] = useState("");
  const cocok = ketik.trim() === wa4;

  if (!buka) {
    return (
      <div className="mt-3">
        {/*
          Plain and visible, not a grey underline. It was styled down to keep the
          ticket from suggesting cancellation; in practice people who genuinely
          could not come did not find it, and told the committee by WhatsApp
          instead — which leaves the seat booked while someone else is turned away.
        */}
        <button type="button" onClick={() => setBuka(true)} className="btn btn-bahaya w-full">
            {d.edit.tidakBisaHadir}
          </button>
      </div>
    );
  }

  return (
    <form action={ubahKehadiranRencana} className="mt-3 rounded-[8px] bg-brand-100 p-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="datang" value="false" />

      <div className="text-[15px] font-semibold">{d.edit.konfirmasiBatal}</div>
      <label className="label mt-3" htmlFor="wa4">
        {d.edit.mintaWa4}
      </label>
      {/*
        `name` is not decoration here: the server checks these four digits again, and
        a field without a name is never submitted. Without it the action always saw
        an empty value and refused every release, however correctly it was typed.
      */}
      <input
        id="wa4"
        name="wa4"
        value={ketik}
        onChange={(e) => setKetik(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        maxLength={4}
        autoComplete="off"
        className="field tracking-[0.4em]"
      />

      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={!cocok} className="btn btn-bahaya flex-1">
          {d.edit.yaLepas}
        </button>
        <button
          type="button"
          onClick={() => {
            setBuka(false);
            setKetik("");
          }}
          className="btn btn-ghost flex-1"
        >
          {d.edit.batal}
        </button>
      </div>
    </form>
  );
}
