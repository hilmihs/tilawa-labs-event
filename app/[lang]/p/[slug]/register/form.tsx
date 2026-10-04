"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { kirimPendaftaran, type StatusForm } from "./actions";
import { keluar } from "@/app/[lang]/akun/actions";
import {
  KEAHLIAN,
  MAKS_KEAHLIAN,
  MAKS_KEAHLIAN_LAIN,
  PRODI,
  SEMESTER,
  TRANSPORT,
} from "@/lib/acara/view-model";
import { t, type Lang } from "@/lib/i18n/dict";
import { angkaArab } from "@/lib/waktu";
import { Pilih } from "@/components/pilih";
import { latinkanKetikan } from "@/lib/wa";
import { TataTertibDialog } from "@/components/tata-tertib";
import { PilihWilayah } from "@/components/pilih-wilayah";

const AWAL: StatusForm = {};

/*
 * Switching language is a navigation — a different URL, a fresh page — so without
 * this everything typed so far is gone. Someone halfway through the form who taps
 * العربية to read a label they did not understand should not be punished for it.
 *
 * sessionStorage, not localStorage: this holds a name and a phone number, and it
 * has no business outliving the tab. It is cleared the moment the registration
 * succeeds.
 */
const KUNCI_DRAF = "nawa.draf-pendaftaran";

// One draft per programme: a half-filled form for one event must not surface on another.
function kunciDraf(slug: string): string {
  return `${KUNCI_DRAF}:${slug}`;
}

function simpanDraf(form: HTMLFormElement) {
  try {
    const fd = new FormData(form);
    const isi: Record<string, string> = {};
    for (const [k, v] of fd.entries()) {
      if (typeof v !== "string") continue;
      if (k === "hp_website" || k === "dimuat_at" || k === "lang" || k === "slug") continue;
      // A password has no business sitting in sessionStorage, even for one tab.
      if (k === "password" || k === "password_ulang") continue;
      // React puts its own bookkeeping into the form; it is not ours to keep.
      if (k.startsWith("$ACTION")) continue;
      if (v === "") continue;
      // Several boxes share the name "keahlian"; keep them all, not just the last.
      isi[k] = k === "keahlian" && isi[k] ? `${isi[k]},${v}` : v;
    }
    sessionStorage.setItem(kunciDraf(String(fd.get("slug") ?? "")), JSON.stringify(isi));
  } catch {
    // Private mode, or a full quota. The form still works; the draft is a courtesy.
  }
}

export function hapusDraf(slug: string) {
  try {
    sessionStorage.removeItem(kunciDraf(slug));
  } catch {
    /* nothing to clean up */
  }
}

/*
 * Every field in this list is required whenever the form actually shows it. Presence
 * in the DOM carries the conditions: the study fields render only for the status that
 * needs them, the account fields only when signed out, "Something else" only once
 * ticked. The server repeats the rule explicitly (actions.ts); this is the courtesy
 * that says so before a round trip. Order is form order, so the first is the one to
 * scroll to. `kebutuhan_khusus` is the one optional question and is left out on purpose.
 */
const KOLOM_WAJIB = [
  "nama",
  "wa",
  "email",
  "password",
  "password_ulang",
  "gender",
  "status_lipia",
  "prodi",
  "semester",
  "sesi",
  "tahun_lulus",
  "domisili",
  "asal_daerah",
  "asal_sekolah",
  "transportasi",
  "keahlian",
  "keahlian_lain",
] as const;

/** Required fields present in the form and still empty. Shared with the profile form. */
export function kolomKosong(form: HTMLFormElement): string[] {
  const data = new FormData(form);
  return KOLOM_WAJIB.filter(
    (k) =>
      form.querySelector(`[name="${k}"]`) !== null &&
      // getAll: the interest boxes share one name, and none ticked means none sent.
      data.getAll(k).every((v) => String(v).trim() === ""),
  );
}

/** "Please complete: Where you live, Home region." — built from the labels the form shows. */
export function pesanWajib(d: ReturnType<typeof t>, lang: Lang, kolom: string[]): string {
  const label: Record<string, string> = {
    nama: d.form.name,
    wa: d.form.wa,
    email: d.akun.email,
    password: d.akun.password,
    password_ulang: d.akun.passwordUlang,
    gender: d.form.gender,
    status_lipia: d.form.status,
    prodi: d.form.prodi,
    semester: d.form.semester,
    sesi: d.form.sesi,
    tahun_lulus: d.form.tahunLulus,
    domisili: d.form.domisili,
    asal_daerah: d.form.asalDaerah,
    asal_sekolah: d.form.asalSekolah,
    transportasi: d.form.transportasi,
    // The field label is a whole question; the short section name reads better in a list.
    keahlian: d.akun.bagianMinat,
    keahlian_lain: d.form.keahlianOpsi.lain,
  };
  const nama = kolom.map((k) =>
    (label[k] ?? k)
      // "(Latin letters)" and the like are hints for typing, not part of the name.
      .replace(/\s*\([^)]*\)\s*$/, "")
      .replace(/[\s.:?؟]+$/, ""),
  );
  return d.errors.wajibDiisi.replace("{fields}", nama.join(lang === "ar" ? "، " : ", "));
}

/**
 * Brings the first empty field into view and puts the cursor on it. Pickers submit
 * through a hidden input, so for those the visible control beside it is focused
 * instead — the first step still unchosen, or the first button of a choice row.
 */
export function fokusKolom(form: HTMLFormElement, nama: string) {
  const el = form.querySelector<HTMLElement>(`[name="${nama}"]`);
  if (!el) return;
  let sasaran: HTMLElement | null = el;
  if (el instanceof HTMLInputElement && el.type === "hidden") {
    const calon = Array.from(
      el.parentElement?.querySelectorAll<HTMLElement>('select, input:not([type="hidden"]), button') ?? [],
    );
    sasaran =
      calon.find(
        (c) => (c instanceof HTMLSelectElement || c instanceof HTMLInputElement) && c.value === "",
      ) ??
      calon[0] ??
      null;
  }
  if (!sasaran) return;
  sasaran.scrollIntoView({ block: "center", behavior: "smooth" });
  sasaran.focus({ preventScroll: true });
}

export function FormPendaftaran({
  lang,
  slug,
  tatibUrl,
  akun = null,
  ots = false,
}: {
  lang: Lang;
  slug: string;
  tatibUrl: string | null;
  /**
   * Signed in already: the account exists, so the form does not ask for one again,
   * and the registration is the account holder's — their name and number, not
   * whatever is typed. Registering a friend on the same phone means signing out.
   */
  akun?: { nama: string; wa: string; gender: string } | null;
  /** The walk-in link: same form, posts with ots=1, no seat taken. */
  ots?: boolean;
}) {
  const sudahMasuk = akun !== null;
  const [state, action, pending] = useActionState(kirimPendaftaran, AWAL);
  const [status, setStatus] = useState<string>(state.nilai?.status_lipia ?? "mahasiswa");
  const [gender, setGender] = useState<string>(state.nilai?.gender ?? akun?.gender ?? "ikhwan");
  /*
   * The Arabic copy follows the gender buttons, not the saved row — there is no saved
   * row yet. Every label, hint and house rule below re-reads in the feminine the
   * moment a sister taps "الطالبات", which is the only point in the flow where she
   * tells us who she is.
   */
  const d = t(lang, gender);
  /*
   * The dropdowns are controlled, unlike the text fields.
   *
   * `defaultValue` on a <select> only applies at mount, and React re-applies it on
   * the re-render a server action causes — so a failed submit silently emptied every
   * dropdown while the typed fields kept their contents. Someone who forgot the
   * house-rules checkbox lost their programme, semester and transport and usually
   * did not notice until the confirmation showed them blank.
   */
  const [pilih, setPilih] = useState<Record<string, string>>({
    semester: state.nilai?.semester ?? "",
    prodi: state.nilai?.prodi ?? "",
    transportasi: state.nilai?.transportasi ?? "",
  });
  const [minat, setMinat] = useState<string[]>(pisahMinat(state.nilai?.keahlian));
  /*
   * Controlled, not merely uncontrolled-with-a-defaultValue: the box only exists
   * while "Something else" is ticked, so it is mounted long after the draft has been
   * restored and there would be no DOM node to write the saved text back onto.
   */
  const [minatLain, setMinatLain] = useState<string>(state.nilai?.keahlian_lain ?? "");
  /*
   * The house rules are a dialog, and submitting is blocked until they have been
   * opened once. A checkbox alone is ticked without reading; a link alone is not
   * followed at all. This way the rules appear on the way to the button, over the
   * form, with everything already typed still in place behind them.
   */
  const [tatibBuka, setTatibBuka] = useState(false);
  const [tatibDibaca, setTatibDibaca] = useState(false);
  const [takSama, setTakSama] = useState(false);
  /*
   * Every question but "anything we should know" is required. The check runs on
   * submit, before the house-rules dialog, like the password check: nobody should read
   * the rules only to be sent back up for an empty field. `kurang` is what is missing.
   */
  const [kurang, setKurang] = useState<string[]>([]);
  // Read the rules, then unticked the box again: said here rather than after a round trip.
  const [belumSetuju, setBelumSetuju] = useState(false);
  const setujuRef = useRef<HTMLInputElement>(null);
  /*
   * Same trap as the dropdowns: React's form reset after a rejected submit unticks
   * every checkbox, and because `checked` did not change React leaves them unticked
   * while `minat` still holds the choices. Re-sync the DOM after every commit.
   */
  const minatRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    minatRef.current?.querySelectorAll<HTMLInputElement>('input[name="keahlian"]').forEach((el) => {
      el.checked = minat.includes(el.value);
    });
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setPilih((p) => ({ ...p, [k]: e.target.value }));
  const dimuat = useRef<number>(0);
  const [dimuatAt, setDimuatAt] = useState("0");

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    dimuat.current = Date.now();
    setDimuatAt(String(dimuat.current));
  }, []);

  // Restore after mount, never during render: sessionStorage does not exist on the
  // server, and reading it while rendering would make the markup disagree.
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    let isi: Record<string, string>;
    try {
      isi = JSON.parse(sessionStorage.getItem(kunciDraf(slug)) ?? "{}");
    } catch {
      return;
    }
    if (!isi || Object.keys(isi).length === 0) return;

    if (isi.status_lipia) setStatus(isi.status_lipia);
    if (isi.gender) setGender(isi.gender);
    if (isi.keahlian) setMinat(pisahMinat(isi.keahlian));
    if (isi.keahlian_lain) setMinatLain(isi.keahlian_lain);
    setPilih((p) => ({
      semester: isi.semester ?? p.semester,
      prodi: isi.prodi ?? p.prodi,
      transportasi: isi.transportasi ?? p.transportasi,
    }));

    // The typed fields are uncontrolled, so they are put back on the DOM directly.
    for (const [k, v] of Object.entries(isi)) {
      const f = el.elements.namedItem(k);
      // A read-only field (the signed-in account's number) is not the draft's to overwrite.
      if (f instanceof HTMLInputElement && f.type !== "checkbox" && !f.readOnly) f.value = v;
      else if (f instanceof HTMLTextAreaElement) f.value = v;
    }
  }, [slug]);

  const mahasiswa = status === "mahasiswa";
  const khirrij = status === "khirrij";
  const v = state.nilai ?? {};

  const pesanServer = state.error
    ? {
        tutup: d.errors.tutupBody,
        ots_tutup: d.errors.otsTutupBody,
        penuh: d.errors.penuhBody,
        wa_tidak_valid: d.errors.waTidakValid,
        laju: d.errors.lajuTerlalu,
        wajib_setuju: d.errors.wajibSetuju,
        nama_pendek: d.errors.namaPendek,
        terlalu_cepat: d.errors.terlaluCepat,
        email_tidak_valid: d.akun.errors.emailTidakValid,
        password_pendek: d.akun.errors.passwordPendek,
        wa_terpakai: d.akun.errors.waTerpakai,
        email_terpakai: d.akun.errors.emailTerpakai,
        password_tidak_sama: d.akun.passwordTidakSama,
        wajib_diisi: pesanWajib(d, lang, state.kolom ?? []),
        umum: d.errors.umum,
      }[state.error]
    : null;
  // Same rule as the account form: a mistyped password on an account made for one
  // event day locks the participant out on the day itself, so the submit is blocked
  // while the two fields differ. Checked before the house-rules dialog opens, so
  // nobody reads the rules only to be sent back to the password box.
  const pesanWajibKlien = kurang.length > 0 ? pesanWajib(d, lang, kurang) : null;
  const pesanError = pesanWajibKlien
    ? pesanWajibKlien
    : takSama
      ? d.akun.passwordTidakSama
      : belumSetuju
        ? d.errors.wajibSetuju
        : pesanServer;

  // The server said what is empty (no JavaScript check ran, or it was bypassed): go there.
  useEffect(() => {
    const kolom = state.kolom?.[0];
    if (state.error === "wajib_diisi" && kolom && formRef.current) fokusKolom(formRef.current, kolom);
  }, [state]);

  /*
   * Once the message is up, it follows the form: each answer given drops its name, and
   * the last one clears it. Deferred a tick, because a region picker writes its hidden
   * value on the re-render after the change, and a choice row changes on a click.
   */
  function periksaUlang() {
    if (kurang.length === 0) return;
    setTimeout(() => {
      if (formRef.current) setKurang(kolomKosong(formRef.current));
    }, 0);
  }

  function passwordCocok(form: HTMLFormElement): boolean {
    if (sudahMasuk) return true;
    const data = new FormData(form);
    return data.get("password") === data.get("password_ulang");
  }

  // Drop the warning as soon as the two fields agree again, without waiting for another submit.
  function cocokkan(ev: FormEvent<HTMLInputElement>) {
    const form = ev.currentTarget.form;
    if (!takSama || !form) return;
    if (passwordCocok(form)) setTakSama(false);
  }

  if (state.sudahTerdaftar) {
    const { nomor, token } = state.sudahTerdaftar;
    return (
      <div className="card p-6">
        <h2 className="text-xl font-semibold">{d.sudahTerdaftar.title}</h2>
        <p className="mt-2 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">
          {token ? d.sudahTerdaftar.body : d.sudahTerdaftar.bodyBedaNama}
        </p>
        {nomor ? (
          <div className="mt-4 rounded-[8px] bg-brand-100 p-4">
            <div className="eyebrow">{d.konfirmasi.nomor}</div>
            <div className="mt-1.5 text-2xl font-bold">{nomor}</div>
          </div>
        ) : null}
        {/* Without a name match this is a plain link to the lookup, not a ticket. */}
        <Link
          href={token ? `/${lang}/ticket/${token}` : `/${lang}/p/${slug}/ticket`}
          className="btn btn-primary mt-4 w-full"
        >
          {token ? d.sudahTerdaftar.cta : d.landing.findTicket}
        </Link>
      </div>
    );
  }

  return (
    <>
    <form
      ref={formRef}
      action={action}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const kosong = kolomKosong(form);
        setKurang(kosong);
        if (kosong.length > 0) {
          e.preventDefault();
          fokusKolom(form, kosong[0]);
          return;
        }
        if (!passwordCocok(form)) {
          e.preventDefault();
          setTakSama(true);
          return;
        }
        if (tatibDibaca) {
          if (setujuRef.current && !setujuRef.current.checked) {
            e.preventDefault();
            setBelumSetuju(true);
            setujuRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
            setujuRef.current.focus({ preventScroll: true });
          }
          return;
        }
        e.preventDefault();
        setTatibBuka(true);
      }}
      onChange={(e) => {
        simpanDraf(e.currentTarget);
        periksaUlang();
      }}
      onInput={(e) => {
        simpanDraf(e.currentTarget);
        periksaUlang();
      }}
      onClick={periksaUlang}
      className="flex flex-col gap-4"
      noValidate
    >
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="slug" value={slug} />
      {ots ? <input type="hidden" name="ots" value="1" /> : null}
      {/* Registration is for the institute students for now, so the question is not asked. */}
      <input type="hidden" name="lipia" value="ya" />
      <input type="hidden" name="dimuat_at" value={dimuatAt} />
      {/* Honeypot. Hidden from people and from screen readers; bots fill it anyway. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="hp_website">Website</label>
        <input id="hp_website" name="hp_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {pesanError ? (
        <p
          role="alert"
          className="rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] leading-[1.5] text-[var(--color-danger)]"
        >
          {pesanError}
          {/* The number is theirs already: the way through is signing in, not retyping. */}
          {state.error === "wa_terpakai" ? (
            <>
              {" "}
              <Link
                href={`/${lang}/masuk?next=${encodeURIComponent(`/${lang}/p/${slug}/register`)}`}
                className="font-semibold underline"
              >
                {d.akun.masuk}
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {akun ? (
        <div className="rounded-[8px] bg-brand-100 px-4 py-3 text-[14px] leading-[1.5]">
          <p>{d.form.masukSebagai.replace("{nama}", akun.nama)}</p>
          <button
            type="submit"
            form="keluar-akun"
            className="mt-1 font-semibold text-brand underline"
          >
            {d.form.bukanAnda}
          </button>
        </div>
      ) : null}

      <p className="text-[13px] leading-[1.5] text-[var(--color-ink-2)]">{d.form.intro}</p>

      <div>
        <label className="label" htmlFor="nama">
          {d.form.name}
        </label>
        <input
          id="nama"
          name="nama"
          required
          autoComplete="name"
          defaultValue={v.nama ?? akun?.nama}
          placeholder={d.form.namePlaceholder}
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="wa">
          {d.form.wa}
        </label>
        {/*
          A phone number reads left to right in every language, so this row is LTR
          even on the Arabic page: "+62" stays in front of the number instead of
          after it, and the digits are not shown back to front.
        */}
        <div
          dir="ltr"
          className="flex h-12 items-center overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-white focus-within:border-brand"
        >
          <span className="border-e border-[var(--color-line)] px-3.5 text-[15px] font-medium leading-[48px] text-[var(--color-ink-3)]">
            +62
          </span>
          <input
            id="wa"
            name="wa"
            required
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={akun ? akun.wa.replace(/^62/, "") : v.wa}
            readOnly={sudahMasuk}
            placeholder={d.form.waPlaceholder}
            onInput={latinkanKetikan}
            className={`h-full w-full bg-transparent px-3.5 text-[16px] outline-none ${
              sudahMasuk ? "text-[var(--color-ink-3)]" : ""
            }`}
          />
        </div>
        <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
          {d.form.waLatin} {d.form.waHint}
        </p>
      </div>

      {/*
        Registering creates the account in the same step. Two more fields buy the
        participant their ticket page for good, and every later programme without
        filling any of this in again.
      */}
      {sudahMasuk ? null : (
        <>
          <div>
            <label className="label" htmlFor="email">
              {d.akun.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              dir="ltr"
              autoComplete="email"
              defaultValue={v.email}
              className="field"
            />
            <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
              {d.akun.emailHint}
            </p>
          </div>

          <div>
            <label className="label" htmlFor="password">
              {d.akun.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              dir="ltr"
              autoComplete="new-password"
              onInput={cocokkan}
              className="field"
            />
            <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
              {d.akun.passwordHint}
            </p>
          </div>

          <div>
            <label className="label" htmlFor="password_ulang">
              {d.akun.passwordUlang}
            </label>
            <input
              id="password_ulang"
              name="password_ulang"
              type="password"
              required
              minLength={8}
              dir="ltr"
              autoComplete="new-password"
              onInput={cocokkan}
              className="field"
            />
          </div>
        </>
      )}

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

      {/*
        A graduate has a programme too — it was missing before, so every khirrij
        came through with no record of what they had actually studied.
      */}
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
              value={v.sesi ?? "pagi"}
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
            defaultValue={v.tahun_lulus}
            className="field"
          />
        </div>
      ) : null}

      {/* Picked, not typed: one official name per place, so the dashboard can count them. */}
      <PilihWilayah
        lang={lang}
        gender={gender}
        jenis="domisili"
        name="domisili"
        label={d.form.domisili}
        awal={v.domisili}
      />

      <PilihWilayah
        lang={lang}
        gender={gender}
        jenis="asal"
        name="asal_daerah"
        label={d.form.asalDaerah}
        awal={v.asal_daerah}
      />

      <div>
        <label className="label" htmlFor="asal_sekolah">
          {d.form.asalSekolah}
        </label>
        <input
          id="asal_sekolah"
          name="asal_sekolah"
          defaultValue={v.asal_sekolah}
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
                    // Unticked, the answer has no question left; keeping it would
                    // save text nobody claimed.
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
          defaultValue={v.kebutuhan_khusus}
          placeholder={d.form.kebutuhanPlaceholder}
          className="field"
        />
      </div>

      <label className="flex items-start gap-3 rounded-[8px] bg-white px-4 py-3.5 text-[15px] leading-[1.5] ring-1 ring-[var(--color-line)]">
        <input
          ref={setujuRef}
          type="checkbox"
          name="setuju"
          onChange={(e) => {
            if (e.target.checked) setBelumSetuju(false);
          }}
          className="mt-0.5 h-5 w-5 flex-none accent-[var(--color-brand)]"
        />
        <span>{d.form.setuju}</span>
      </label>

      {/* Outside the label: a button inside it would tick the box on every tap. */}
      <button
        type="button"
        onClick={() => setTatibBuka(true)}
        className="-mt-2 self-start text-[14px] font-semibold text-brand underline underline-offset-2"
      >
        {d.form.tatibLink}
      </button>
      {!tatibDibaca ? (
        <p className="-mt-2 text-[13px] text-[var(--color-ink-3)]">{d.form.tatibWajib}</p>
      ) : null}

      <TataTertibDialog
        lang={lang}
        gender={gender}
        url={tatibUrl}
        buka={tatibBuka}
        onTutup={() => setTatibBuka(false)}
        onSudahBaca={() => {
          setTatibDibaca(true);
          setTatibBuka(false);
          // Reading them is what the checkbox claims, so it is ticked here.
          if (setujuRef.current) setujuRef.current.checked = true;
          setBelumSetuju(false);
        }}
      />

      {/* Repeated by the button: the alert at the top is off screen on a long form. */}
      {kurang.length > 0 || belumSetuju ? (
        <p className="text-[14px] leading-[1.5] text-[var(--color-danger)]">{pesanError}</p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? d.form.submitting : d.form.submit}
      </button>
    </form>
    {/* Outside the registration form: forms cannot nest. The link above submits it. */}
    {akun ? (
      <form id="keluar-akun" action={keluar} hidden>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="next" value={`/${lang}/p/${slug}/register`} />
      </form>
    ) : null}
    </>
  );
}

function pisahMinat(nilai: string | undefined): string[] {
  return (nilai ?? "").split(",").filter(Boolean).slice(0, MAKS_KEAHLIAN);
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
