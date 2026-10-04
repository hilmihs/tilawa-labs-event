"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { simpanProfil, type StatusProfil } from "./actions";
import {
  KEAHLIAN,
  MAKS_KEAHLIAN,
  MAKS_KEAHLIAN_LAIN,
  PRODI,
  SEMESTER,
  kodeKeahlian,
  teksKeahlianLain,
} from "@/lib/acara/view-model";
import { Pilih } from "@/components/pilih";
import { Pilihan } from "@/components/pilihan";
import { PilihWilayah } from "@/components/pilih-wilayah";
import { t, type Lang } from "@/lib/i18n/dict";
import { angkaArab } from "@/lib/waktu";
import { formatWaTampil, latinkanKetikan } from "@/lib/wa";
import { fokusKolom, kolomKosong, pesanWajib } from "@/app/[lang]/p/[slug]/register/form";

const AWAL: StatusProfil = {};

/** What the profile form needs. The password hash and session version never leave the server. */
export type NilaiProfil = {
  wa: string;
  nama: string;
  gender: string;
  statusLipia: string | null;
  prodi: string | null;
  sesi: string | null;
  semester: string | null;
  tahunLulus: string | null;
  domisili: string | null;
  asalDaerah: string | null;
  asalSekolah: string | null;
  minat: string | null;
  kebutuhanKhusus: string | null;
};

export function FormProfil({ lang, awal }: { lang: Lang; awal: NilaiProfil }) {
  // The saved gender picks the Arabic form of address, as on the other account pages.
  const d = t(lang, awal.gender);
  const [state, action, pending] = useActionState(simpanProfil, AWAL);
  const [gender, setGender] = useState(awal.gender);
  const [status, setStatus] = useState(awal.statusLipia ?? "mahasiswa");
  /*
   * The dropdowns are controlled for the same reason as the registration form:
   * React re-applies `defaultValue` on the re-render a server action causes, so a
   * rejected save would quietly empty every <select> the participant had just set.
   */
  const [pilih, setPilih] = useState({
    prodi: awal.prodi ?? "",
    semester: awal.semester ?? "",
  });
  const [minat, setMinat] = useState<string[]>(kodeKeahlian(awal.minat));
  // The column also carries what was typed behind "Something else"; without the box
  // here, saving the profile would quietly drop it.
  const [minatLain, setMinatLain] = useState<string>(teksKeahlianLain(awal.minat));
  // Same trap as the dropdowns: the form reset unticks every checkbox while `minat`
  // still holds the choices, so the DOM is re-synced after every commit.
  const minatRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    minatRef.current
      ?.querySelectorAll<HTMLInputElement>('input[name="keahlian"]')
      .forEach((el) => {
        el.checked = minat.includes(el.value);
      });
  });

  /*
   * Same required rule as the registration form, checked before the save: the empty
   * fields are named in one message and the first is scrolled to. It re-checks as the
   * participant fills them in, so the message shrinks and then goes away on its own.
   */
  const formRef = useRef<HTMLFormElement>(null);
  const [kurang, setKurang] = useState<string[]>([]);
  function periksaUlang() {
    if (kurang.length === 0) return;
    // After React has committed: a picker writes its hidden value on the re-render.
    setTimeout(() => {
      if (formRef.current) setKurang(kolomKosong(formRef.current));
    }, 0);
  }
  useEffect(() => {
    const kolom = state.kolom?.[0];
    if (state.error === "wajib_diisi" && kolom && formRef.current) fokusKolom(formRef.current, kolom);
  }, [state]);

  const mahasiswa = status === "mahasiswa";
  const khirrij = status === "khirrij";
  const pesan =
    kurang.length > 0
      ? pesanWajib(d, lang, kurang)
      : state.error
        ? {
            nama_pendek: d.errors.namaPendek,
            wajib_diisi: pesanWajib(d, lang, state.kolom ?? []),
            umum: d.akun.errors.umum,
          }[state.error]
        : null;

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={(e) => {
        const kosong = kolomKosong(e.currentTarget);
        setKurang(kosong);
        if (kosong.length === 0) return;
        e.preventDefault();
        fokusKolom(e.currentTarget, kosong[0]);
      }}
      onChange={periksaUlang}
      onInput={periksaUlang}
      onClick={periksaUlang}
      className="flex flex-col gap-4"
      noValidate
    >
      <input type="hidden" name="lang" value={lang} />

      {pesan ? (
        <p
          role="alert"
          className="rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] text-[var(--color-danger)]"
        >
          {pesan}
        </p>
      ) : null}

      <div>
        <label className="label" htmlFor="nama">
          {d.form.name}
        </label>
        <input
          id="nama"
          name="nama"
          required
          autoComplete="name"
          defaultValue={awal.nama}
          className="field"
        />
      </div>

      <div>
        <span className="label">{d.akun.wa}</span>
        <p dir="ltr" className="text-[15px] text-[var(--color-ink)]">
          {formatWaTampil(awal.wa)}
        </p>
        <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">{d.akun.waTetap}</p>
      </div>

      <div>
        <span className="label">{d.form.gender}</span>
        <Pilihan
          name="gender"
          value={gender}
          onChange={setGender}
          options={[
            { value: "ikhwan", label: d.gender.ikhwan },
            { value: "akhwat", label: d.gender.akhwat },
          ]}
        />
      </div>

      <div>
        <span className="label">{d.form.status}</span>
        <Pilihan
          name="status_lipia"
          value={status}
          onChange={setStatus}
          options={[
            { value: "mahasiswa", label: d.form.statusMahasiswa },
            { value: "khirrij", label: d.form.statusKhirrij },
            { value: "mutarabbish", label: d.form.statusMutarabbish },
          ]}
        />
      </div>

      {mahasiswa || khirrij ? (
        <div>
          <label className="label" htmlFor="prodi">
            {d.form.prodi}
          </label>
          <Pilih
            id="prodi"
            name="prodi"
            value={pilih.prodi}
            onChange={(v) => setPilih((p) => ({ ...p, prodi: v }))}
          >
            <option value="">{d.form.prodiPilih}</option>
            {PRODI.map((p) => (
              // The value is the stored one; only the label follows the page.
              <option key={p} value={p}>
                {d.form.prodiOpsi[p]}
              </option>
            ))}
          </Pilih>
        </div>
      ) : null}

      {mahasiswa ? (
        <>
          <div>
            <label className="label" htmlFor="semester">
              {d.form.semester}
            </label>
            <Pilih
              id="semester"
              name="semester"
              value={pilih.semester}
              onChange={(v) => setPilih((p) => ({ ...p, semester: v }))}
            >
              <option value="">{d.form.semesterPilih}</option>
              {SEMESTER.map((s) => (
                <option key={s} value={s}>
                  {lang === "ar" ? angkaArab(s) : s}
                </option>
              ))}
            </Pilih>
          </div>

          <div>
            <span className="label">{d.form.sesi}</span>
            <Pilihan
              name="sesi"
              value={awal.sesi ?? "pagi"}
              options={[
                { value: "pagi", label: d.form.sesiPagi },
                { value: "sore", label: d.form.sesiSore },
              ]}
            />
          </div>
        </>
      ) : null}

      {khirrij ? (
        <div>
          <label className="label" htmlFor="tahun_lulus">
            {d.form.tahunLulus}
          </label>
          <input
            id="tahun_lulus"
            name="tahun_lulus"
            dir="ltr"
            inputMode="numeric"
            maxLength={4}
            onInput={latinkanKetikan}
            defaultValue={awal.tahunLulus ?? ""}
            className="field"
          />
        </div>
      ) : null}

      {/* Same pickers as the registration form; an older typed answer opens under "Other". */}
      <PilihWilayah
        lang={lang}
        gender={awal.gender}
        jenis="domisili"
        name="domisili"
        label={d.form.domisili}
        awal={awal.domisili}
      />

      <PilihWilayah
        lang={lang}
        gender={awal.gender}
        jenis="asal"
        name="asal_daerah"
        label={d.form.asalDaerah}
        awal={awal.asalDaerah}
      />

      <div>
        <label className="label" htmlFor="asal_sekolah">
          {d.form.asalSekolah}
        </label>
        <input
          id="asal_sekolah"
          name="asal_sekolah"
          defaultValue={awal.asalSekolah ?? ""}
          placeholder={d.form.asalSekolahPlaceholder}
          className="field"
        />
      </div>

      <fieldset>
        <legend className="label">{d.form.keahlian}</legend>
        <p className="mb-2.5 text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
          {d.form.keahlianHint}
        </p>
        <div ref={minatRef} className="grid gap-2 sm:grid-cols-2">
          {KEAHLIAN.map((k) => {
            const dipilih = minat.includes(k);
            const habis = !dipilih && minat.length >= MAKS_KEAHLIAN;
            return (
              <label
                key={k}
                className={`flex items-center gap-3 rounded-[10px] bg-white px-4 py-3 text-[15px] leading-[1.4] ring-1 ${
                  dipilih ? "ring-brand" : "ring-[var(--color-line)]"
                } ${habis ? "opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  name="keahlian"
                  value={k}
                  checked={dipilih}
                  disabled={habis}
                  onChange={(e) => {
                    const dicentang = e.target.checked;
                    setMinat((m) =>
                      dicentang ? [...m, k].slice(0, MAKS_KEAHLIAN) : m.filter((x) => x !== k),
                    );
                    if (k === "lain" && !dicentang) setMinatLain("");
                  }}
                  className="h-5 w-5 flex-none accent-[var(--color-brand)]"
                />
                <span>{d.form.keahlianOpsi[k]}</span>
              </label>
            );
          })}
        </div>
        {minat.includes("lain") ? (
          <input
            name="keahlian_lain"
            value={minatLain}
            onChange={(e) => setMinatLain(e.target.value)}
            maxLength={MAKS_KEAHLIAN_LAIN}
            aria-label={d.form.keahlianOpsi.lain}
            placeholder={d.form.keahlianLainPlaceholder}
            className="field mt-2"
          />
        ) : null}
      </fieldset>

      <div>
        <label className="label" htmlFor="kebutuhan_khusus">
          {d.form.kebutuhan}
        </label>
        <textarea
          id="kebutuhan_khusus"
          name="kebutuhan_khusus"
          defaultValue={awal.kebutuhanKhusus ?? ""}
          placeholder={d.form.kebutuhanPlaceholder}
          className="field"
        />
      </div>

      {/* Repeated by the button: the alert at the top is off screen on a long form. */}
      {kurang.length > 0 ? (
        <p className="text-[14px] leading-[1.5] text-[var(--color-danger)]">{pesan}</p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? d.form.submitting : d.akun.simpan}
      </button>
    </form>
  );
}
