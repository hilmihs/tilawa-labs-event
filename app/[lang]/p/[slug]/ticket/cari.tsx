"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { t, type Lang } from "@/lib/i18n/dict";
import { keAngkaLatin } from "@/lib/wa";
import { BantuanWa } from "@/components/bantuan-wa";
import { KONTAK_ADMIN_AKTIF } from "@/lib/acara/view-model";

type Keadaan = "awal" | "mencari" | "gagal" | "laju";

const JEDA_MS = 5_000;
const BATAS_MS = 60_000;

/**
 * Recovery path for participants who lost their link.
 *
 * While registration is open, a miss is answered with "looking for your
 * registration…" and retried every five seconds for a minute. If it turns up
 * mid-wait the QR appears with the participant doing nothing. Answering "not found"
 * straight away has one predictable result: they fill the form again.
 */
export function CariTiket({
  lang,
  slug,
  masihBuka,
  waAdmin,
}: {
  lang: Lang;
  slug: string;
  masihBuka: boolean;
  waAdmin: string;
}) {
  const d = t(lang);
  const router = useRouter();
  const [keadaan, setKeadaan] = useState<Keadaan>("awal");
  const [wa, setWa] = useState("");
  const [nama4, setNama4] = useState("");
  const [progres, setProgres] = useState(0);
  const mulai = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bersihkan = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => bersihkan, []);

  const coba = useCallback(async () => {
    const res = await fetch("/api/ticket-lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, wa, nama4 }),
    });

    if (res.status === 429) {
      setKeadaan("laju");
      return;
    }

    const data = (await res.json()) as { status: string; token?: string };

    if (data.status === "ketemu" && data.token) {
      router.push(`/${lang}/ticket/${data.token}`);
      return;
    }

    const lewat = Date.now() - mulai.current;
    setProgres(Math.min(100, (lewat / BATAS_MS) * 100));

    if (!masihBuka || lewat >= BATAS_MS) {
      setKeadaan("gagal");
      return;
    }
    timer.current = setTimeout(coba, JEDA_MS);
  }, [wa, nama4, slug, lang, masihBuka, router]);

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    bersihkan();
    mulai.current = Date.now();
    setProgres(0);
    setKeadaan("mencari");
    void coba();
  };

  if (keadaan === "mencari") {
    return (
      <div>
        <h1 className="text-2xl font-semibold leading-[1.3]">{d.cari.title}</h1>
        <p className="mt-2 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">{d.cari.intro}</p>

        <div className="mt-6 flex h-12 items-center justify-center rounded-[10px] bg-brand-100 text-[15px] font-semibold text-brand">
          {d.cari.searching}
        </div>
        <div
          className="mt-2.5 h-[3px] overflow-hidden rounded-[2px] bg-[var(--color-line)]"
          role="progressbar"
          aria-valuenow={Math.round(progres)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-brand transition-[width] duration-500"
            style={{ width: `${Math.max(6, progres)}%` }}
          />
        </div>
        <p className="mt-3 text-center text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
          {d.cari.searchingNote}
        </p>
        <p className="mt-7 border-t border-[var(--color-line)] pt-5 text-[13px] leading-[1.6] text-[var(--color-ink-3)]">
          {d.cari.dontClose}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold leading-[1.3]">{d.cari.title}</h1>
      <p className="mt-2 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">{d.cari.intro}</p>

      {keadaan === "gagal" ? (
        <div role="status" className="mt-5 rounded-[8px] bg-brand-100 p-4 text-[14px] leading-[1.6]">
          <strong className="font-semibold">{d.cari.notFoundTitle}.</strong>{" "}
          {KONTAK_ADMIN_AKTIF ? (
            <>
              {d.cari.notFoundBody}{" "}
              <span className="rounded-[4px] bg-brand-200 px-1.5 py-0.5 font-semibold">{waAdmin}</span>.
            </>
          ) : (
            // Only the first sentence: the second one ends in the admin's number.
            `${d.cari.notFoundBody.split(". ")[0]}.`
          )}{" "}
          {/* The complaint form needs no admin number, so it stays available either way. */}
          <BantuanWa
            lang={lang}
            nomor={waAdmin}
            halaman={d.bantuan.halamanCari}
            slug={slug}
            gaya="tautan"
          />
        </div>
      ) : null}

      {keadaan === "laju" ? (
        <p
          role="alert"
          className="mt-5 rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] text-[var(--color-danger)]"
        >
          {d.cari.rate}
        </p>
      ) : null}

      <form onSubmit={kirim} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="wa">
            {d.cari.wa}
          </label>
          {/* Left to right on the Arabic page too — see the registration form. */}
          <div
            dir="ltr"
            className="flex h-12 items-center overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-white focus-within:border-brand"
          >
            <span className="border-e border-[var(--color-line)] px-3.5 text-[15px] font-medium leading-[48px] text-[var(--color-ink-3)]">
              +62
            </span>
            <input
              id="wa"
              value={wa}
              onChange={(e) => setWa(keAngkaLatin(e.target.value))}
              required
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              placeholder={d.form.waPlaceholder}
              className="h-full w-full bg-transparent px-3.5 text-[16px] outline-none"
            />
          </div>
          <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
            {d.form.waLatin}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="nama4">
            {d.cari.nama4}
          </label>
          <input
            id="nama4"
            value={nama4}
            onChange={(e) => setNama4(e.target.value)}
            required
            minLength={2}
            maxLength={4}
            autoComplete="off"
            className="field uppercase tracking-[0.25em]"
          />
          <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
            {d.cari.nama4Hint}
          </p>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={keadaan === "laju"}>
          {d.cari.submit}
        </button>
        <Link href={`/${lang}/p/${slug}/register`} className="btn btn-ghost w-full">
          {d.cari.notYet}
        </Link>
      </form>

      {KONTAK_ADMIN_AKTIF ? (
      <div className="mt-6 rounded-[8px] bg-brand-100 p-4 text-[13px] leading-[1.6]">
        {d.cari.contactAdmin}{" "}
        <span className="rounded-[4px] bg-brand-200 px-1.5 py-0.5 font-semibold">{waAdmin}</span>{" "}
        {d.cari.duringHours}
      </div>
      ) : null}
      {/* Outside the condition: the admin number stays hidden, the complaint form does not. */}
      <BantuanWa
        lang={lang}
        nomor={waAdmin}
        halaman={d.bantuan.halamanCari}
        slug={slug}
        className="mt-6"
      />
    </div>
  );
}
