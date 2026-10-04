"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

/*
 * A whole batch on one page: pick an option for every question, then one press locks
 * them all in.
 *
 * The button only arms once every question has a choice. Each question has one
 * attempt and no way back, so a batch sent with one question forgotten would spend
 * nothing but still leave the reader wondering whether it was saved.
 */

const HURUF = ["A", "B", "C", "D"];

export type SoalForm = {
  nomor: number;
  /** "Question 5" — already in the page's language. */
  judul: string;
  /** Type and the section of the notes it comes from. */
  label: string;
  pertanyaan: string;
  opsi: string[];
};

function Tombol({ label, belum }: { label: string; belum: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? belum : label}
    </button>
  );
}

export function FormSesi({
  soal,
  aksi,
  tersembunyi,
  label,
  labelMenyimpan,
  catatan,
  sisa,
  dir,
}: {
  soal: SoalForm[];
  aksi: (form: FormData) => void | Promise<void>;
  /** Hidden fields the action needs: language, programme, batch. */
  tersembunyi: Record<string, string>;
  label: string;
  labelMenyimpan: string;
  catatan: string;
  /** "{n} still without an answer." */
  sisa: string;
  dir: "ltr" | "rtl";
}) {
  const [pilih, setPilih] = useState<Record<number, number>>({});
  const kurang = soal.filter((s) => pilih[s.nomor] === undefined).length;

  return (
    <form action={aksi} className="flex flex-col">
      {Object.entries(tersembunyi).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {soal.map((s) => (
        <input key={s.nomor} type="hidden" name={`pilih_${s.nomor}`} value={pilih[s.nomor] ?? ""} />
      ))}

      <div className="flex flex-col gap-6 px-4">
        {soal.map((s) => (
          <fieldset key={s.nomor} id={`s${s.nomor}`} className="scroll-mt-20">
            <legend className="eyebrow">{s.judul}</legend>
            <div
              className="mt-2 rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] px-4 py-4"
              dir={dir}
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-3)] rtl:tracking-normal">
                {s.label}
              </div>
              <p className="mt-2.5 text-[18px] font-semibold leading-[1.35] text-pretty">{s.pertanyaan}</p>
            </div>
            <div className="mt-2.5 flex flex-col gap-2" dir={dir}>
              {s.opsi.map((teks, i) => {
                const aktif = pilih[s.nomor] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPilih((p) => ({ ...p, [s.nomor]: i }))}
                    aria-pressed={aktif}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[6px] border-[1.5px] border-[var(--color-ink)] px-3.5 py-2.5 text-start ${
                      aktif ? "bg-brand-100 shadow-[3px_3px_0_var(--color-ink)]" : "bg-[var(--color-paper)]"
                    }`}
                  >
                    <span
                      className={`flex size-7 flex-none items-center justify-center rounded-[6px] border-[1.5px] border-[var(--color-ink)] text-[13px] font-bold ${
                        aktif ? "bg-[var(--color-ink)] text-[var(--color-butter)]" : ""
                      }`}
                    >
                      {HURUF[i]}
                    </span>
                    <span className={`text-[15px] leading-[1.4] ${aktif ? "font-semibold" : ""}`}>{teks}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {/* Stays in reach while scrolling through the batch. */}
      <div className="sticky bottom-0 mt-6 border-t-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] px-4 pb-5 pt-4">
        {kurang ? (
          <span className="btn btn-primary w-full cursor-not-allowed opacity-55" aria-disabled="true">
            {label}
          </span>
        ) : (
          <Tombol label={label} belum={labelMenyimpan} />
        )}
        <p className="mt-3 text-center text-[13px] leading-[1.4] text-[var(--color-ink-3)]">
          {kurang ? sisa.replace("{n}", String(kurang)) : catatan}
        </p>
      </div>
    </form>
  );
}
