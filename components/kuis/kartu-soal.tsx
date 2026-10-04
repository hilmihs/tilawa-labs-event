"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

/*
 * Today's question, and the one tap that commits to an answer.
 *
 * Two steps on purpose: choosing an option only highlights it, and a second,
 * separate press locks it in. There is one attempt per day and no way back, so a
 * mis-tap on a phone must not be able to spend it.
 */

const HURUF = ["A", "B", "C", "D"];

function Tombol({ label, belum }: { label: string; belum: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? belum : label}
    </button>
  );
}

export function KartuSoal({
  opsi,
  aksi,
  tersembunyi,
  label,
  labelMenyimpan,
  catatan,
  pilihDulu,
  dir,
}: {
  opsi: string[];
  aksi: (form: FormData) => void | Promise<void>;
  /** Hidden fields the action needs: language, day, the page to come back to. */
  tersembunyi: Record<string, string>;
  label: string;
  labelMenyimpan: string;
  catatan: string;
  pilihDulu: string;
  dir: "ltr" | "rtl";
}) {
  const [pilih, setPilih] = useState<number | null>(null);

  return (
    <form action={aksi} className="flex flex-1 flex-col">
      {Object.entries(tersembunyi).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="pilih" value={pilih ?? ""} />

      <div className="flex flex-col gap-2.5 px-4" dir={dir}>
        {opsi.map((teks, i) => {
          const aktif = pilih === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setPilih(i)}
              aria-pressed={aktif}
              className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[6px] border-[1.5px] border-[var(--color-ink)] px-3.5 py-3 text-start ${
                aktif
                  ? "bg-brand-100 shadow-[3px_3px_0_var(--color-ink)]"
                  : "bg-[var(--color-paper)]"
              }`}
            >
              <span
                className={`flex size-7 flex-none items-center justify-center rounded-[6px] border-[1.5px] border-[var(--color-ink)] text-[13px] font-bold ${
                  aktif ? "bg-[var(--color-ink)] text-[var(--color-butter)]" : ""
                }`}
              >
                {HURUF[i]}
              </span>
              <span className={`text-[16px] leading-[1.4] ${aktif ? "font-semibold" : ""}`}>
                {teks}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto border-t-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] px-4 pb-5 pt-4">
        {pilih === null ? (
          <span className="btn btn-primary w-full cursor-not-allowed opacity-55" aria-disabled="true">
            {label}
          </span>
        ) : (
          <Tombol label={label} belum={labelMenyimpan} />
        )}
        <p className="mt-3 text-center text-[13px] leading-[1.4] text-[var(--color-ink-3)]">
          {pilih === null ? pilihDulu : catatan}
        </p>
      </div>
    </form>
  );
}
