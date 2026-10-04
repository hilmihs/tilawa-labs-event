"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { simpanAbsen, type StatusAbsen } from "./actions";
import { KadoSvg, JamPasirSvg, SelesaiSvg, TunasSvg, IkonWaktu, IkonOnline, Centang } from "./gambar";
import { ALASAN, KELOMPOK, KUNCI_ALASAN, PENGINGAT, WAKTU, kelompokDipilih, MAKS_LAIN, MAKS_SARAN } from "@/lib/absen/alasan";
import { t, type Lang } from "@/lib/i18n/dict";

const AWAL: StatusAbsen = {};

const isi = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

/** The notes' summary, revealed on the thank-you screen: the gift, unwrapped. */
export type HadiahAbsen = { href: string; ringkasan: string[]; dir: "ltr" | "rtl"; bahasa: string };

type Langkah = "hadiah" | "alasan" | "waktu" | "pengingat" | "online" | "saran" | "akhir";
type Arah = "maju" | "mundur";

function Chip({
  name,
  value,
  checked,
  onChange,
  type = "checkbox",
  ikon,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  type?: "checkbox" | "radio";
  ikon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="absen-chip" data-on={checked ? "1" : undefined}>
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {ikon}
      <span>{children}</span>
      <Centang />
    </label>
  );
}

/**
 * One question per screen, in one <form>.
 *
 * Every screen stays mounted — the hidden ones with `hidden`, which still submits
 * their inputs — so `simpanAbsen` receives the same fields it always did. Only the
 * visible screen changes, and it slides in from the side it came from (mirrored on
 * the Arabic page, still for anyone who asked for less motion).
 *
 * Every field is controlled, text included: React resets a form's uncontrolled
 * fields after each action, and "number not found" must not wipe the suggestion
 * someone just wrote.
 */
export function FormAbsen({
  lang,
  slug,
  judul,
  hadiah,
  dikenali,
  namaDepan,
}: {
  lang: Lang;
  slug: string;
  judul: string;
  hadiah: HadiahAbsen | null;
  /** Signed in, with a registration for this programme: no number is asked for. */
  dikenali: boolean;
  namaDepan: string | null;
}) {
  const kamus = t(lang);
  const d = kamus.absen;
  const [state, action, pending] = useActionState(simpanAbsen, AWAL);
  const [layar, setLayar] = useState<Langkah>("hadiah");
  const [arah, setArah] = useState<Arah>("maju");
  const [alasan, setAlasan] = useState<string[]>([]);
  const [alasanLain, setAlasanLain] = useState("");
  const [waktu, setWaktu] = useState<string[]>([]);
  const [pengingat, setPengingat] = useState<string[]>([]);
  const [online, setOnline] = useState<string>("");
  const [saran, setSaran] = useState("");
  const [kabari, setKabari] = useState(false);
  const [wa, setWa] = useState("");
  const [galatLokal, setGalatLokal] = useState<"alasan" | "lain" | null>(null);
  // The session can lapse between opening the page and sending: the server then asks
  // for the number after all, and the field appears.
  const [perluWa, setPerluWa] = useState(!dikenali);
  // Set when the participant goes back from the thank-you screen to change an answer.
  const [ubah, setUbah] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sudahPindah = useRef(false);

  const grup = kelompokDipilih(alasan);
  const urutan: Langkah[] = [
    "hadiah",
    "alasan",
    ...(grup.has("waktu") ? (["waktu"] as const) : []),
    ...(grup.has("info") ? (["pengingat"] as const) : []),
    ...(grup.has("akses") ? (["online"] as const) : []),
    "saran",
    "akhir",
  ];
  const aktif = urutan.includes(layar) ? layar : "alasan";
  const posisi = urutan.indexOf(aktif);
  const total = urutan.length - 1;

  const pindah = (ke: Langkah, a: Arah) => {
    if (timer.current) clearTimeout(timer.current);
    sudahPindah.current = true;
    setArah(a);
    setLayar(ke);
    setGalatLokal(null);
  };
  const maju = () => pindah(urutan[Math.min(posisi + 1, urutan.length - 1)], "maju");
  const mundur = () => pindah(urutan[Math.max(posisi - 1, 0)], "mundur");

  // A server error sends the reader back to the screen that owns it — adjusted during
  // render rather than in an effect, so there is no frame showing the wrong screen.
  const [statusLalu, setStatusLalu] = useState(state);
  if (state !== statusLalu) {
    setStatusLalu(state);
    if (state.error === "alasan" || state.error === "lain") {
      setArah("mundur");
      setLayar("alasan");
    } else if (state.error) {
      if (state.error === "wa" || state.error === "tidakDitemukan") setPerluWa(true);
      setLayar("akhir");
    }
  }

  // The new screen's heading takes focus, so a screen reader hears the question and
  // the keyboard starts from the top of it. Not on first load.
  useEffect(() => {
    if (!sudahPindah.current) return;
    const h = document.getElementById(`absen-${aktif}-judul`);
    h?.focus({ preventScroll: true });
    const top = formRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) formRef.current?.scrollIntoView({ block: "start" });
  }, [aktif]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const togel = (set: React.Dispatch<React.SetStateAction<string[]>>, k: string) => () =>
    set((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));

  const lanjutDariAlasan = () => {
    if (alasan.length === 0) return setGalatLokal("alasan");
    if (alasan.includes("lain") && !alasanLain.trim()) return setGalatLokal("lain");
    maju();
  };

  const pilihOnline = (k: string) => {
    setOnline(k);
    if (timer.current) clearTimeout(timer.current);
    // A single-choice answer moves on by itself, after a beat to see the tick land.
    timer.current = setTimeout(() => pindah(urutan[posisi + 1], "maju"), 480);
  };

  // The only button on the thank-you screen, and only when there is something to read.
  if (state.tersimpan && !ubah) {
    return (
      <div className="flex flex-col gap-5">
        <div className="absen-kartu absen-langkah kertas flex flex-col items-center gap-3 px-6 pb-7 pt-5 text-center">
          {hadiah ? (
            <div className="absen-kado-gambar absen-kado-gambar-selesai">
              <KadoSvg terbuka denganCatatan />
            </div>
          ) : (
            <SelesaiSvg />
          )}
          <h1 className="judul campur text-[30px]" tabIndex={-1}>
            {d.selesaiJudul}
          </h1>
          <p className="text-[16px] leading-[1.6] text-[var(--color-ink-2)]">
            {hadiah ? d.selesaiIsi : d.selesaiIsiTanpaCatatan}
          </p>
        </div>

        {hadiah ? (
          <section className="absen-kartu absen-ringkasan kertas flex flex-col gap-4 p-5" aria-labelledby="absen-ringkasan-judul">
            <div className="flex flex-col gap-1">
              <h2 id="absen-ringkasan-judul" className="eyebrow">
                {kamus.catatan.ringkasanJudul}
              </h2>
              <p className="text-[13px] text-[var(--color-ink-3)]">{kamus.catatan.bahasaCatatan}</p>
            </div>
            <ol dir={hadiah.dir} lang={hadiah.bahasa} className="flex list-none flex-col gap-3 p-0">
              {hadiah.ringkasan.map((r, i) => (
                <li key={i} className="absen-butir" style={{ "--i": i } as React.CSSProperties}>
                  <span className="absen-butir-no">{String(i + 1).padStart(2, "0")}</span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>
            <Link href={hadiah.href} className="btn btn-primary w-full">
              {d.bacaLengkap}
            </Link>
          </section>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setUbah(true);
            pindah("alasan", "mundur");
          }}
          className="self-center text-[13px] text-[var(--color-ink-3)] underline underline-offset-4"
        >
          {d.ubah}
        </button>
      </div>
    );
  }

  const galatServer = state.error && !ubah ? state.error : null;
  const galatDi = (langkah: Langkah) => {
    const k =
      langkah === "alasan"
        ? (galatLokal ?? (galatServer === "alasan" || galatServer === "lain" ? galatServer : null))
        : langkah === "akhir" && galatServer && galatServer !== "alasan" && galatServer !== "lain"
          ? galatServer
          : null;
    return k ? (
      <p role="alert" className="absen-galat">
        {d.galat[k]}
      </p>
    ) : null;
  };

  // Plain functions, not components: a component declared inside render would be a
  // new type every render and remount its subtree.
  const judulLangkah = (id: Langkah, children: React.ReactNode) => (
    <h2 id={`absen-${id}-judul`} tabIndex={-1} className="judul campur text-[26px] outline-none">
      {children}
    </h2>
  );

  // Where a screen shows, and which way it came in from.
  const tampil = (k: Langkah) => ({
    hidden: aktif !== k,
    "data-arah": arah,
    "aria-labelledby": `absen-${k}-judul`,
  });

  const navigasi = (children: React.ReactNode) => (
    <div className="mt-2 flex items-center gap-2">
      <button type="button" onClick={mundur} className="btn btn-ghost px-4">
        {d.kembali}
      </button>
      {children}
    </div>
  );

  const lewatiAtauLanjut = (terisi: boolean) =>
    terisi ? (
      <button type="button" onClick={maju} className="btn btn-primary flex-1">
        {d.lanjut}
      </button>
    ) : (
      <button type="button" onClick={maju} className="btn btn-ghost absen-lewati flex-1">
        {d.lewati}
      </button>
    );

  return (
    <form
      ref={formRef}
      // Dispatched by hand rather than through the `action` prop: a form action makes
      // React reset the form afterwards, and that reset unticks the hidden screens'
      // checkboxes in the DOM even though their state still says ticked — a retry
      // after "number not found" would then send no reasons at all.
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setUbah(false);
        startTransition(() => action(f));
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="kabari" value={kabari ? "1" : "0"} />

      {aktif !== "hadiah" ? (
        <div className="absen-progres" style={{ "--p": posisi / total } as React.CSSProperties}>
          <div className="absen-progres-jalur" aria-hidden>
            <div className="absen-progres-isi" />
            <svg className="absen-progres-daun" viewBox="0 0 20 20" width="20" height="20">
              <path d="M3 17C3 8 9 3 17 3c0 8-5 14-14 14Z" fill="var(--color-brand-300)" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M4 16 13 7" stroke="var(--color-ink)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <p className="absen-progres-teks" aria-live="polite">
            {isi(d.langkah, { n: String(posisi), total: String(total) })}
          </p>
        </div>
      ) : null}

      {/* The gift */}
      <section {...tampil("hadiah")} className="absen-langkah absen-kartu absen-kado kertas">
        <div className="absen-kado-gambar">
          {hadiah ? <KadoSvg terbuka={false} denganCatatan /> : <TunasSvg />}
        </div>
        <div className="flex flex-col items-center gap-3 px-6 pb-7 text-center">
          {namaDepan ? <p className="absen-sapaan">{isi(d.sapaan, { nama: namaDepan })}</p> : null}
          {hadiah ? (
            <>
              <h1 id="absen-hadiah-judul" tabIndex={-1} className="judul campur text-[30px] outline-none">
                {d.hadiahJudul}
              </h1>
              <p className="text-[14px] text-[var(--color-ink-3)]">{d.terimaKasih}</p>
              <p className="text-[16px] leading-[1.6] text-[var(--color-ink-2)]">{isi(d.hadiahIsi, { judul })}</p>
            </>
          ) : (
            <h1 id="absen-hadiah-judul" tabIndex={-1} className="judul campur text-[28px] outline-none">
              {isi(d.tanpaCatatan, { judul })}
            </h1>
          )}
          <div className="absen-minta">
            <JamPasirSvg />
            <p className="text-[15px] font-semibold">{hadiah ? d.hadiahHint : d.mintaTolong}</p>
          </div>
          {/* One button: the gift opens at the end of the questions, not before. */}
          <button type="button" onClick={maju} className="btn btn-primary absen-mulai w-full">
            {hadiah ? d.bukaHadiah : d.mulai}
          </button>
          <p className="text-[12px] text-[var(--color-ink-3)]">{d.tenang}</p>
        </div>
      </section>

      {/* Why */}
      <section {...tampil("alasan")} className="absen-langkah absen-kartu flex flex-col gap-5 p-5">
        <div>
          {judulLangkah("alasan", d.alasanJudul)}
          <p className="mt-1.5 text-[14px] text-[var(--color-ink-3)]">{d.alasanHint}</p>
        </div>
        {KELOMPOK.map((g) => (
          <fieldset key={g} className="absen-kelompok">
            <legend className="absen-kelompok-judul">{d.kelompok[g]}</legend>
            <div className="flex flex-wrap gap-2">
              {KUNCI_ALASAN.filter((k) => ALASAN[k] === g).map((k) => (
                <Chip
                  key={k}
                  name="alasan"
                  value={k}
                  checked={alasan.includes(k)}
                  onChange={() => {
                    setGalatLokal(null);
                    togel(setAlasan, k)();
                  }}
                >
                  {d.alasan[k]}
                </Chip>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="absen-buka" data-buka={alasan.includes("lain") ? "1" : undefined}>
          <div>
            <input
              name="alasan_lain"
              value={alasanLain}
              onChange={(e) => setAlasanLain(e.target.value)}
              onKeyDown={(e) => {
                // Enter would submit the whole form from the first question.
                if (e.key === "Enter") {
                  e.preventDefault();
                  lanjutDariAlasan();
                }
              }}
              disabled={!alasan.includes("lain")}
              maxLength={MAKS_LAIN}
              placeholder={d.lainPlaceholder}
              aria-label={d.alasan.lain}
              className="field"
              dir="auto"
            />
          </div>
        </div>
        {galatDi("alasan")}
        {navigasi(
          <button type="button" onClick={lanjutDariAlasan} className="btn btn-primary flex-1" aria-disabled={alasan.length === 0}>
            {d.lanjut}
          </button>,
        )}
      </section>

      {/* When — only if a timing reason was picked */}
      <section {...tampil("waktu")} className="absen-langkah absen-kartu flex flex-col gap-5 p-5">
        <div>
          <p className="absen-opsional">{d.opsional}</p>
          {judulLangkah("waktu", d.waktuJudul)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {WAKTU.map((k) => (
            <Chip
              key={k}
              name="waktu"
              value={k}
              checked={waktu.includes(k)}
              onChange={togel(setWaktu, k)}
              ikon={<IkonWaktu k={k} />}
            >
              {d.waktu[k]}
            </Chip>
          ))}
        </div>
        {navigasi(lewatiAtauLanjut(waktu.length > 0))}
      </section>

      {/* Reminders — only if an information reason was picked */}
      <section {...tampil("pengingat")} className="absen-langkah absen-kartu flex flex-col gap-5 p-5">
        <div>
          <p className="absen-opsional">{d.opsional}</p>
          {judulLangkah("pengingat", d.pengingatJudul)}
        </div>
        <div className="flex flex-col gap-2">
          {PENGINGAT.map((k) => (
            <Chip key={k} name="pengingat" value={k} checked={pengingat.includes(k)} onChange={togel(setPengingat, k)}>
              {d.pengingat[k]}
            </Chip>
          ))}
        </div>
        {navigasi(lewatiAtauLanjut(pengingat.length > 0))}
      </section>

      {/* Recording or live stream — only if a getting-there reason was picked */}
      <section {...tampil("online")} className="absen-langkah absen-kartu flex flex-col gap-5 p-5">
        <div>
          <p className="absen-opsional">{d.opsional}</p>
          {judulLangkah("online", d.onlineJudul)}
        </div>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="absen-online-judul">
          {(["ya", "tidak"] as const).map((k) => (
            <label key={k} className="absen-ubin" data-on={online === k ? "1" : undefined}>
              <input
                type="radio"
                name="online"
                value={k}
                checked={online === k}
                onChange={() => pilihOnline(k)}
                onClick={() => online === k && pilihOnline(k)}
                className="sr-only"
              />
              <IkonOnline k={k} />
              <span>{d[k]}</span>
            </label>
          ))}
        </div>
        {navigasi(lewatiAtauLanjut(online !== ""))}
      </section>

      {/* One thing for next time */}
      <section {...tampil("saran")} className="absen-langkah absen-kartu flex flex-col gap-5 p-5">
        <div>
          <p className="absen-opsional">{d.opsional}</p>
          {judulLangkah("saran", <label htmlFor="saran">{d.saranJudul}</label>)}
        </div>
        <textarea
          id="saran"
          name="saran"
          value={saran}
          onChange={(e) => setSaran(e.target.value)}
          maxLength={MAKS_SARAN}
          rows={4}
          placeholder={d.saranPlaceholder}
          className="field absen-saran"
          dir="auto"
        />
        {navigasi(lewatiAtauLanjut(saran.trim() !== ""))}
      </section>

      {/* Last: who is answering, and the one opt-in */}
      <section {...tampil("akhir")} className="absen-langkah absen-kartu flex flex-col gap-5 p-5">
        {judulLangkah("akhir", d.lanjutanJudul)}
        {perluWa ? (
          <div>
            <label htmlFor="wa" className="mb-2 block text-[15px] font-semibold">
              {d.waLabel}
            </label>
            <input
              id="wa"
              name="wa"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={wa}
              onChange={(e) => setWa(e.target.value)}
              placeholder="08xx xxxx xxxx"
              className="field text-start"
              dir="ltr"
            />
            <p className="mt-1.5 text-[12px] text-[var(--color-ink-3)]">{d.waHint}</p>
          </div>
        ) : (
          <p className="absen-dikenali">{d.akunDikenali}</p>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={kabari}
          onClick={() => setKabari((k) => !k)}
          className="absen-saklar"
        >
          <span className="absen-saklar-jalur" aria-hidden>
            <span className="absen-saklar-bulat" />
          </span>
          <span className="text-start">{d.kabari}</span>
        </button>
        {galatDi("akhir")}
        {navigasi(
          <button type="submit" disabled={pending} className="btn btn-primary flex-1">
            {pending ? d.mengirim : d.kirim}
          </button>,
        )}
      </section>
    </form>
  );
}
