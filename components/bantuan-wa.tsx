"use client";

import { useActionState, useId, useState } from "react";
import { kirimAduan, type StatusKirimAduan } from "@/app/aduan/actions";
import { t, type Lang } from "@/lib/i18n/dict";

const AWAL: StatusKirimAduan = {};

/**
 * "Something is broken" → a short complaint form on the page itself.
 *
 * This used to be a wa.me link to the admin. That number was banned, and a report
 * that depends on one phone is lost the moment that phone is. The report now lands
 * in the database and the committee works through it from /admin.
 *
 * The name `BantuanWa` and its props are kept so every call site stays as it was;
 * `nomor` is accepted and ignored. What the committee needs to place the report —
 * programme, page, participant number — travels as hidden fields, so the only thing
 * left for the person to type is what happened.
 */
export function BantuanWa({
  lang,
  acara,
  halaman,
  nomorPeserta,
  slug,
  gender,
  gaya = "tombol",
  className,
}: {
  lang: Lang;
  nomor?: string | null;
  acara?: string | null;
  halaman: string;
  nomorPeserta?: string | null;
  slug?: string | null;
  gender?: string | null;
  gaya?: "tombol" | "tautan";
  className?: string;
}) {
  const b = t(lang, gender).bantuan;
  const id = useId();
  const [buka, setBuka] = useState(false);
  const [state, action, pending] = useActionState(kirimAduan, AWAL);
  // Controlled on purpose: React resets an uncontrolled <form> after its action runs,
  // so a rejected report would wipe the message the person just wrote.
  const [pesan, setPesan] = useState("");
  const [nama, setNama] = useState("");
  const [kontak, setKontak] = useState("");

  if (state.ok && state.nomor) {
    const [sebelum, sesudah = ""] = b.terkirim.split("{nomor}");
    return (
      <p
        role="status"
        className={`rounded-[8px] bg-brand-100 p-4 text-[14px] leading-[1.6] text-[var(--color-ink)] ${className ?? ""}`.trim()}
      >
        {sebelum}
        {/* Latin ticket code inside Arabic text: isolate it so the digits keep their order. */}
        <bdi dir="ltr" className="font-semibold">
          {state.nomor}
        </bdi>
        {sesudah}
      </p>
    );
  }

  if (!buka) {
    const kelas =
      gaya === "tombol"
        ? `btn btn-ghost w-full ${className ?? ""}`
        : `font-semibold text-brand underline underline-offset-2 ${className ?? ""}`;
    return (
      <button type="button" onClick={() => setBuka(true)} className={kelas.trim()}>
        {b.tombolLapor}
      </button>
    );
  }

  const pesanError =
    state.error === "pesan_pendek"
      ? b.errPesanPendek
      : state.error === "laju"
        ? b.errLaju
        : state.error === "umum"
          ? b.errUmum
          : null;

  return (
    <form
      action={action}
      className={`card relative block p-4 text-start text-[15px] leading-[1.5] text-[var(--color-ink)] ${className ?? ""}`.trim()}
    >
      <h2 className="text-[16px] font-semibold">{b.judulForm}</h2>

      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="slug" value={slug ?? ""} />
      <input type="hidden" name="halaman" value={acara ? `${halaman} · ${acara}` : halaman} />
      <input type="hidden" name="nomor_peserta" value={nomorPeserta ?? ""} />

      {/* Honeypot: off-screen and out of the tab order; people never fill it, bots do. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
        <label htmlFor={`${id}-hp`}>Website</label>
        <input id={`${id}-hp`} type="text" name="hp_website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="mt-3">
        <label className="label" htmlFor={`${id}-pesan`}>
          {b.labelPesan}
        </label>
        <textarea
          id={`${id}-pesan`}
          name="pesan"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          autoFocus
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          placeholder={b.placeholderPesan}
          className="field"
        />
      </div>

      <div className="mt-3">
        <label className="label" htmlFor={`${id}-nama`}>
          {b.labelNama}
        </label>
        <input
          id={`${id}-nama`}
          name="nama"
          maxLength={100}
          autoComplete="name"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="field"
        />
      </div>

      <div className="mt-3">
        <label className="label" htmlFor={`${id}-kontak`}>
          {b.labelKontak}
        </label>
        <input
          id={`${id}-kontak`}
          name="kontak"
          dir="ltr"
          maxLength={120}
          autoComplete="off"
          value={kontak}
          onChange={(e) => setKontak(e.target.value)}
          placeholder={b.placeholderKontak}
          className="field"
        />
      </div>

      {pesanError ? (
        <p
          role="alert"
          className="mt-3 rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-3 py-2 text-[14px] text-[var(--color-danger)]"
        >
          {pesanError}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <button type="submit" className="btn btn-primary w-full" disabled={pending} aria-busy={pending}>
          {pending ? b.mengirim : b.kirim}
        </button>
        <button type="button" className="btn btn-ghost w-full" disabled={pending} onClick={() => setBuka(false)}>
          {b.batal}
        </button>
      </div>
    </form>
  );
}
