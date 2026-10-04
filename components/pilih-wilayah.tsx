"use client";

import { useMemo, useState } from "react";
import { Pilih } from "@/components/pilih";
import { JABODETABEK, PROVINSI, PULAU, type KodePulau } from "@/lib/wilayah/data";
import { t, type Lang } from "@/lib/i18n/dict";

/*
 * Where someone lives, or where they are from, picked step by step instead of typed.
 *
 * Typed answers came back as "Pasar Minggu", "pasar minggu", "Ps. Minggu" and
 * "Jaksel": four spellings of one place, and a dashboard that cannot count any of
 * them. The picker writes one official name per place into the same hidden field the
 * text box used, so the server, the CSV and the charts keep reading `domisili` and
 * `asal_daerah` exactly as before.
 *
 * Where you live — Jabodetabek first, because that is where most students are:
 *   Jabodetabek → city/regency → district (kecamatan)   "Pasar Minggu, Kota Jakarta Selatan"
 *   Elsewhere on Java → province                         "Jawa Tengah"
 *   Outside Java → island → province                     "Sulawesi Selatan"
 *   Other → typed                                        whatever they write
 *
 * Home region — island → province → city/regency         "Kab. Garut, Jawa Barat"
 *   Other → typed (abroad, or anything the list lacks)
 */

type Jenis = "domisili" | "asal";

const PEMISAH = ", ";

function provinsiDariSimpan(nama: string) {
  return PROVINSI.find((p) => p.simpan === nama);
}

/** Reads a stored answer back into the steps, so editing a profile starts where it was left. */
function uraikan(jenis: Jenis, awal: string | null | undefined) {
  const v = (awal ?? "").trim();
  const kosong = { langkah1: "", langkah2: "", langkah3: "", lain: "" };
  if (!v) return kosong;

  if (jenis === "domisili") {
    const [kec, kota] = v.split(PEMISAH);
    const j = JABODETABEK.find((k) => k.simpan === kota);
    if (j && kec && j.kecamatan.includes(kec)) return { langkah1: "jabodetabek", langkah2: j.kode, langkah3: kec, lain: "" };
    const p = provinsiDariSimpan(v);
    if (p && p.pulau === "jawa") return { langkah1: "jawa", langkah2: p.kode, langkah3: "", lain: "" };
    if (p) return { langkah1: "luar", langkah2: p.pulau, langkah3: p.kode, lain: "" };
    return { ...kosong, langkah1: "lain", lain: v };
  }

  const bagian = v.split(PEMISAH);
  const p = provinsiDariSimpan(bagian[bagian.length - 1] ?? "");
  const kab = bagian.slice(0, -1).join(PEMISAH);
  if (p && p.kabkota.includes(kab)) return { langkah1: p.pulau, langkah2: p.kode, langkah3: kab, lain: "" };
  return { ...kosong, langkah1: "lain", lain: v };
}

/*
 * One step of the picker. Module scope, NOT a function defined inside PilihWilayah:
 * a component declared in a render body is a new type on every render, so React
 * unmounts and rebuilds every <select> whenever anything in the form changes. On a
 * phone that destroys the element the native dropdown is attached to, and the list
 * closes the moment it is tapped — the picker simply would not open.
 */
function Langkah({
  idPilih,
  value,
  onChange,
  kosong,
  children,
}: {
  idPilih: string;
  value: string;
  onChange: (v: string) => void;
  kosong: string;
  children: React.ReactNode;
}) {
  return (
    <Pilih id={idPilih} value={value} onChange={onChange}>
      <option value="">{kosong}</option>
      {children}
    </Pilih>
  );
}

export function PilihWilayah({
  lang,
  gender,
  jenis,
  name,
  label,
  awal,
}: {
  lang: Lang;
  gender?: string | null;
  jenis: Jenis;
  /** The form field the answer is submitted as — the name the old text box had. */
  name: string;
  label: string;
  awal?: string | null;
}) {
  const d = t(lang, gender).form.wilayah;
  const mula = useMemo(() => uraikan(jenis, awal), [jenis, awal]);
  const [langkah1, setLangkah1] = useState(mula.langkah1);
  const [langkah2, setLangkah2] = useState(mula.langkah2);
  const [langkah3, setLangkah3] = useState(mula.langkah3);
  const [lain, setLain] = useState(mula.lain);

  const nama = (x: { en: string; ar: string }) => (lang === "ar" ? x.ar : x.en);
  const id = `wilayah-${name}`;

  // The answer, or "" until every step is chosen: half an address is not an answer.
  let nilai = "";
  if (jenis === "domisili") {
    if (langkah1 === "jabodetabek") {
      const kota = JABODETABEK.find((k) => k.kode === langkah2);
      if (kota && langkah3) nilai = `${langkah3}${PEMISAH}${kota.simpan}`;
    } else if (langkah1 === "jawa") {
      nilai = PROVINSI.find((p) => p.kode === langkah2)?.simpan ?? "";
    } else if (langkah1 === "luar") {
      nilai = PROVINSI.find((p) => p.kode === langkah3)?.simpan ?? "";
    } else if (langkah1 === "lain") {
      nilai = lain.trim();
    }
  } else if (langkah1 === "lain") {
    nilai = lain.trim();
  } else {
    const p = PROVINSI.find((x) => x.kode === langkah2);
    if (p && langkah3) nilai = `${langkah3}${PEMISAH}${p.simpan}`;
  }

  const ganti1 = (v: string) => {
    setLangkah1(v);
    setLangkah2("");
    setLangkah3("");
  };
  const ganti2 = (v: string) => {
    setLangkah2(v);
    setLangkah3("");
  };

  const pulauLuarJawa = PULAU.filter((p) => p.kode !== "jawa");
  const provinsiPulau = (kode: string) => PROVINSI.filter((p) => p.pulau === (kode as KodePulau));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="label">{label}</legend>
      <input type="hidden" name={name} value={nilai} />

      {jenis === "domisili" ? (
        <>
          <Langkah idPilih={`${id}-1`} value={langkah1} onChange={ganti1} kosong={d.pilih}>
            <option value="jabodetabek">{d.jabodetabek}</option>
            <option value="jawa">{d.jawaLain}</option>
            <option value="luar">{d.luarJawa}</option>
            <option value="lain">{d.lainnya}</option>
          </Langkah>

          {langkah1 === "jabodetabek" ? (
            <Langkah idPilih={`${id}-2`} value={langkah2} onChange={ganti2} kosong={d.pilihKota}>
              {JABODETABEK.map((k) => (
                <option key={k.kode} value={k.kode}>
                  {nama(k)}
                </option>
              ))}
            </Langkah>
          ) : null}
          {langkah1 === "jabodetabek" && langkah2 ? (
            <Langkah idPilih={`${id}-3`} value={langkah3} onChange={setLangkah3} kosong={d.pilihKecamatan}>
              {JABODETABEK.find((k) => k.kode === langkah2)?.kecamatan.map((kec) => (
                <option key={kec} value={kec}>
                  {kec}
                </option>
              ))}
            </Langkah>
          ) : null}

          {langkah1 === "jawa" ? (
            <Langkah idPilih={`${id}-2`} value={langkah2} onChange={ganti2} kosong={d.pilihProvinsi}>
              {/* Jakarta is Jabodetabek in full, so it is the first option, not this one. */}
              {provinsiPulau("jawa")
                .filter((p) => p.kode !== "31")
                .map((p) => (
                  <option key={p.kode} value={p.kode}>
                    {nama(p)}
                  </option>
                ))}
            </Langkah>
          ) : null}

          {langkah1 === "luar" ? (
            <Langkah idPilih={`${id}-2`} value={langkah2} onChange={ganti2} kosong={d.pilihPulau}>
              {pulauLuarJawa.map((p) => (
                <option key={p.kode} value={p.kode}>
                  {nama(p)}
                </option>
              ))}
            </Langkah>
          ) : null}
          {langkah1 === "luar" && langkah2 ? (
            <Langkah idPilih={`${id}-3`} value={langkah3} onChange={setLangkah3} kosong={d.pilihProvinsi}>
              {provinsiPulau(langkah2).map((p) => (
                <option key={p.kode} value={p.kode}>
                  {nama(p)}
                </option>
              ))}
            </Langkah>
          ) : null}
        </>
      ) : (
        <>
          <Langkah idPilih={`${id}-1`} value={langkah1} onChange={ganti1} kosong={d.pilihPulau}>
            {PULAU.map((p) => (
              <option key={p.kode} value={p.kode}>
                {nama(p)}
              </option>
            ))}
            <option value="lain">{d.lainnya}</option>
          </Langkah>
          {langkah1 && langkah1 !== "lain" ? (
            <Langkah idPilih={`${id}-2`} value={langkah2} onChange={ganti2} kosong={d.pilihProvinsi}>
              {provinsiPulau(langkah1).map((p) => (
                <option key={p.kode} value={p.kode}>
                  {nama(p)}
                </option>
              ))}
            </Langkah>
          ) : null}
          {langkah1 && langkah1 !== "lain" && langkah2 ? (
            <Langkah idPilih={`${id}-3`} value={langkah3} onChange={setLangkah3} kosong={d.pilihKabKota}>
              {PROVINSI.find((p) => p.kode === langkah2)?.kabkota.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Langkah>
          ) : null}
        </>
      )}

      {langkah1 === "lain" ? (
        <input
          id={`${id}-lain`}
          value={lain}
          onChange={(e) => setLain(e.target.value.slice(0, 120))}
          placeholder={d.lainnyaPlaceholder}
          aria-label={d.lainnya}
          className="field"
        />
      ) : null}
    </fieldset>
  );
}
