"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { simpanEditPeserta, type StatusEdit } from "./actions";
import { PRODI, SEMESTER, TRANSPORT } from "@/lib/acara/view-model";
import { t, type Lang } from "@/lib/i18n/dict";
import { angkaArab } from "@/lib/waktu";
import { Pilih } from "@/components/pilih";
import { latinkanKetikan } from "@/lib/wa";

const AWAL: StatusEdit = {};

export type NilaiAwal = {
  nama: string;
  gender: string;
  statusLipia: string | null;
  nim: string | null;
  prodi: string | null;
  sesi: string | null;
  semester: string | null;
  tahunLulus: string | null;
  domisili: string | null;
  asalDaerah: string | null;
  asalSekolah: string | null;
  transportasi: string | null;
  kebutuhanKhusus: string | null;
  email: string | null;
};

export function FormEdit({
  lang,
  token,
  awal,
}: {
  lang: Lang;
  token: string;
  awal: NilaiAwal;
}) {
  const [state, action, pending] = useActionState(simpanEditPeserta, AWAL);
  const [status, setStatus] = useState(awal.statusLipia ?? "mahasiswa");
  const [gender, setGender] = useState(awal.gender);
  // Reads off the live state, not `awal`: switching to "الطالبات" must reword the
  // page she is looking at, not only the copy she sees after saving.
  const d = t(lang, gender);
  // Controlled for the same reason as the registration form: a `defaultValue` on a
  // <select> is re-applied on the re-render a server action causes, so a rejected
  // save would quietly empty the dropdowns the participant had just set.
  const [pilih, setPilih] = useState<Record<string, string>>({
    semester: awal.semester ?? "",
    prodi: awal.prodi ?? "",
    transportasi: awal.transportasi ?? "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setPilih((p) => ({ ...p, [k]: e.target.value }));
  const mahasiswa = status === "mahasiswa";

  const pesan = state.error
    ? { invalid: d.tiket.invalidTitle, nama_pendek: d.errors.namaPendek, umum: d.errors.umum }[
        state.error
      ]
    : null;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="lang" value={lang} />

      {pesan ? (
        <p
          role="alert"
          className="rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] text-[var(--color-danger)]"
        >
          {pesan}
        </p>
      ) : null}

      <p className="rounded-[8px] bg-brand-100 px-4 py-3 text-[13px] leading-[1.6]">
        {d.edit.catatanNomor}
      </p>

      <div>
        <label className="label" htmlFor="nama">
          {d.form.name}
        </label>
        <input id="nama" name="nama" required defaultValue={awal.nama} className="field" />
        <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
          {d.edit.catatanNama}
        </p>
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
        <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
          {d.edit.catatanGender}
        </p>
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
      ) : (
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
      )}

      <div>
        <label className="label" htmlFor="domisili">
          {d.form.domisili}
        </label>
        <input
          id="domisili"
          name="domisili"
          defaultValue={awal.domisili ?? ""}
          placeholder={d.form.domisiliPlaceholder}
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="asal_daerah">
          {d.form.asalDaerah}
        </label>
        <input
          id="asal_daerah"
          name="asal_daerah"
          defaultValue={awal.asalDaerah ?? ""}
          placeholder={d.form.asalDaerahPlaceholder}
          className="field"
        />
      </div>

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

      <div>
        <label className="label" htmlFor="transportasi">
          {d.form.transportasi}
        </label>
        <Pilih
          id="transportasi"
          name="transportasi"
          value={pilih.transportasi}
          onChange={(v) => setPilih((p) => ({ ...p, transportasi: v }))}
        >
          <option value="">{d.form.transportasiPilih}</option>
          {TRANSPORT.map((k) => (
            <option key={k} value={k}>
              {d.form.transport[k]}
            </option>
          ))}
        </Pilih>
      </div>

      <div>
        <label className="label" htmlFor="kebutuhan_khusus">
          {d.form.kebutuhan}
        </label>
        <textarea
          id="kebutuhan_khusus"
          name="kebutuhan_khusus"
          defaultValue={awal.kebutuhanKhusus ?? ""}
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="email">
          {d.form.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={awal.email ?? ""}
          className="field"
        />
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? d.form.submitting : d.edit.simpan}
      </button>
      <Link href={`/${lang}/ticket/${token}`} className="btn btn-ghost w-full">
        {d.edit.batal}
      </Link>
    </form>
  );
}

function Pilihan({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange?: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const [local, setLocal] = useState(value);
  const current = onChange ? value : local;
  const set = (v: string) => {
    setLocal(v);
    onChange?.(v);
  };
  return (
    <div className="flex gap-2">
      <input type="hidden" name={name} value={current} />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => set(o.value)}
          aria-pressed={current === o.value}
          className={`min-h-12 flex-1 rounded-[6px] border-[1.5px] px-2 py-2 text-[15px] font-medium leading-[1.25] ${
            current === o.value
              ? "border-[var(--color-ink)] bg-brand font-semibold text-[var(--color-butter)]"
              : "border-[var(--color-line)] bg-white text-[var(--color-ink)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
