"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { kirimJawabanMinat, type StatusJawaban } from "@/app/[lang]/hub/actions";
import { Pilihan } from "@/components/pilihan";
import { MAKS_JAWABAN, type ClubKey } from "@/lib/hub/konten";
import type { Lang } from "@/lib/i18n/dict";
import { angkaArab } from "@/lib/waktu";

const AWAL: StatusJawaban = {};

export type PertanyaanTampil = {
  id: string;
  teks: string;
  pilihan?: Array<{ value: string; label: string }>;
};

/**
 * The questionnaire itself. Everything is required; on a miss the server names the
 * blank questions, the form marks them and scrolls to the first. Choice questions use
 * the same button row as the registration form, so nothing new to learn.
 */
export function FormJawaban({
  lang,
  club,
  pertanyaan,
  teks,
}: {
  lang: Lang;
  club: ClubKey;
  pertanyaan: PertanyaanTampil[];
  teks: { placeholder: string; kirim: string; wajib: string; gagal: string };
}) {
  const [status, action] = useActionState(kirimJawabanMinat, AWAL);
  const kosong = new Set(status.kosong ?? []);
  const ref = useRef<HTMLFormElement>(null);
  // Controlled on purpose: React resets the form after an action, which would wipe
  // what was typed on a validation miss. The server hands the values back instead.
  const [teksJawab, setTeksJawab] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status.nilai) setTeksJawab(status.nilai);
    const pertama = status.kosong?.[0];
    if (!pertama) return;
    ref.current?.querySelector<HTMLElement>(`[data-q="${pertama}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [status]);

  const pesan = status.error === "wajib_diisi" ? teks.wajib : status.error === "umum" ? teks.gagal : null;
  const nomor = (i: number) => (lang === "ar" ? angkaArab(String(i + 1)) : String(i + 1));

  return (
    <form ref={ref} action={action} className="mt-6 flex flex-col gap-6">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="club" value={club} />
      {pesan ? (
        <p role="alert" className="rounded-[6px] border-[1.5px] border-[var(--color-danger)] bg-white px-3 py-2 text-[14px] font-medium text-[var(--color-danger)]">
          {pesan}
        </p>
      ) : null}
      {pertanyaan.map((q, i) => (
        <div key={q.id} data-q={q.id}>
          <label className={`label ${kosong.has(q.id) ? "text-[var(--color-danger)]" : ""}`} htmlFor={q.pilihan ? undefined : q.id}>
            {nomor(i)}. {q.teks}
          </label>
          {q.pilihan ? (
            <Pilihan key={status.nilai?.[q.id] ?? ""} name={q.id} value={status.nilai?.[q.id] ?? ""} options={q.pilihan} />
          ) : (
            <textarea
              id={q.id}
              name={q.id}
              required
              rows={4}
              maxLength={MAKS_JAWABAN}
              value={teksJawab[q.id] ?? ""}
              onChange={(e) => setTeksJawab((t) => ({ ...t, [q.id]: e.target.value }))}
              placeholder={teks.placeholder}
              className="field"
              aria-invalid={kosong.has(q.id) || undefined}
            />
          )}
        </div>
      ))}
      <Kirim>{teks.kirim}</Kirim>
    </form>
  );
}

function Kirim({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary w-full disabled:opacity-60 sm:w-auto">
      {children}
    </button>
  );
}
