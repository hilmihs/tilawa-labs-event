import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffNav } from "@/components/staff-nav";
import { PilihAcara } from "@/components/pilih-acara";
import { TabPanel } from "@/components/tab-panel";
import { SalinTeks } from "@/components/salin-teks";
import { BatangHarian, KartuDistribusi, persen } from "@/components/grafik";
import { KartuPeta, KartuSekolah } from "@/components/peta-wilayah";
import { punyaAkses } from "@/lib/auth/sesi";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { adaCatatan } from "@/lib/catatan/kajian";
import { ringkasanTrafik, trafikCatatanKuis } from "@/lib/trafik/queries";
import { barisStatistik } from "@/lib/acara/queries";
import { hitungStatistik, type AngkaSisi, type Statistik } from "@/lib/acara/statistik";
import { formatAngka, formatJam, formatTanggal, formatTanggalIso, tanggalIsoWib } from "@/lib/waktu";

export const dynamic = "force-dynamic";

/**
 * What stakeholders ask for between now and the day: how many, who, and from where —
 * the numbers and the Google-Form-style charts of every question, on one page, without
 * opening a spreadsheet.
 *
 * The headline numbers are always the whole programme. The filter narrows the charts
 * only, so "how many sisters are graduates" never quietly changes the total above it.
 */
export default async function Ringkasan({
  searchParams,
}: {
  searchParams: Promise<{ acara?: string; g?: string; h?: string }>;
}) {
  const sesi = await punyaAkses("panitia");
  if (!sesi) redirect("/gate?next=%2Fpanel%2Fringkasan");

  const sp = await searchParams;
  const ev = await acaraUntukStaf(sp.acara);
  if (!ev) return <main className="p-10">No event configured.</main>;

  const gender = sp.g === "ikhwan" || sp.g === "akhwat" ? sp.g : undefined;
  const hanyaHadir = sp.h === "1";

  // Seven days back to midnight WIB, the same default range as the traffic tab.
  const sejak7 = new Date(`${tanggalIsoWib()}T00:00:00+07:00`);
  sejak7.setUTCDate(sejak7.getUTCDate() - 6);
  const [baris, trafik, ck] = await Promise.all([
    barisStatistik(ev.id),
    ringkasanTrafik(sejak7),
    // The notes and quiz since they went up, not just this week.
    adaCatatan(ev.slug) ? trafikCatatanKuis(ev.slug, new Date(0)) : Promise.resolve(null),
  ]);
  const kuota = { ikhwan: ev.kuotaIkhwan, akhwat: ev.kuotaAkhwat };
  const s = hitungStatistik(baris, kuota);
  const tersaring =
    gender || hanyaHadir
      ? hitungStatistik(
          baris.filter((r) => (!gender || r.gender === gender) && (!hanyaHadir || r.hadir)),
          kuota,
        )
      : s;

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const gabung = { acara: ev.slug, g: gender, h: hanyaHadir ? "1" : undefined, ...patch };
    for (const [k, v] of Object.entries(gabung)) if (v) p.set(k, v);
    return `/panel/ringkasan?${p.toString()}`;
  };
  const daftar = (patch: Record<string, string>) =>
    `/panel/list?${new URLSearchParams({ acara: ev.slug, ...patch }).toString()}`;

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <StaffNav
        current="panel"
        nama={sesi.nama}
        acara={ev.slug}
        pilih={<PilihAcara sekarang={ev} next="/panel/ringkasan" />}
      />
      <TabPanel aktif="ringkasan" acara={ev.slug} />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-5 pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight">{ev.nama}</h1>
            <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">
              {formatTanggalIso(ev.tanggal, "en")} · figures as of {formatJam(new Date(), "en")} WIB
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SalinTeks teks={teksRekap(ev.nama, s)} label="Copy summary for WhatsApp" />
            <a
              href={`/api/export?format=csv&acara=${encodeURIComponent(ev.slug)}`}
              className="btn btn-ghost h-10 text-[13px]"
            >
              Download CSV
            </a>
          </div>
        </div>

        {/* ---- Headline numbers: whole programme ---- */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Angka label="Registered" nilai={s.total} href={daftar({})}>
            {formatAngka(s.kursi, "en")} seats · {formatAngka(s.ots, "en")} walk-in let in ·{" "}
            {formatAngka(s.otsMenunggu, "en")} walk-in waiting
          </Angka>
          <Angka label="Walk-in waiting" nilai={s.otsMenunggu} warna="warn" href={`/panel/ots?acara=${ev.slug}`}>
            in queue order on the walk-in tab — permit them there
          </Angka>
          <Angka label="Walk-in let in" nilai={s.ots} href={daftar({ jenis: "ots" })}>
            registered at the venue and permitted
          </Angka>
          <Angka label="Released their seat" nilai={s.lepas} warna="redup" href={daftar({ batal: "1" })}>
            said they cannot come
          </Angka>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Sisi judul="Brothers" a={s.sisi.ikhwan} href={daftar({ gender: "ikhwan" })} />
          <Sisi judul="Sisters" a={s.sisi.akhwat} href={daftar({ gender: "akhwat" })} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Angka label="Joined the WhatsApp group" nilai={s.grupWa}>
            {persen(s.grupWa, s.total)} of registered · {formatAngka(s.total - s.grupWa, "en")} not yet
          </Angka>
          <Angka label="Came back to their ticket" nilai={s.tiketDibuka}>
            {persen(s.tiketDibuka, s.total)} opened it again after registering
          </Angka>
          <Angka label="Arrived" nilai={s.hadir} warna="brand" href={daftar({ hadir: "sudah" })}>
            {persen(s.hadirKursi, s.kursi)} of seat holders · {formatAngka(s.hadirOts, "en")} walk-in
          </Angka>
          <Angka label="Accounts" nilai={s.akun}>
            registrations made with a participant account
          </Angka>
        </div>

        {/* ---- Traffic: the detail lives on the Traffic tab ---- */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Angka label="Site visitors today" nilai={trafik.pengunjungHariIni} href={`/panel/trafik?acara=${ev.slug}&r=1`}>
            {formatAngka(trafik.aktif, "en")} on the site now · {formatAngka(trafik.tayangHariIni, "en")} page views
          </Angka>
          <Angka label="Site visitors · 7 days" nilai={trafik.pengunjung} href={`/panel/trafik?acara=${ev.slug}`}>
            {formatAngka(trafik.tayang, "en")} page views · a visitor is one browser per day
          </Angka>
          {ck ? (
            <>
              <Angka label="Read the lecture notes" nilai={ck.bagian.artikel?.pengunjung ?? 0} href={`/panel/trafik?acara=${ev.slug}&r=30`}>
                visitors since the notes went up · {formatAngka(ck.bagian.artikel?.tayang ?? 0, "en")} page views
              </Angka>
              <Angka label="Answered the quiz" nilai={ck.penjawab} warna="brand" href={`/panel/kuis?acara=${ev.slug}`}>
                accounts · {formatAngka(ck.jawaban, "en")} answers ·{" "}
                {formatAngka(ck.pengunjungKuis, "en")} visitors opened the quiz
              </Angka>
            </>
          ) : null}
        </div>

        <section className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-semibold">Registrations per day</h2>
            <span className="text-[13px] text-[var(--color-ink-3)]">WIB · last 21 days · Σ running total</span>
          </div>
          <div className="mt-4">
            <BatangHarian harian={s.harian} />
          </div>
        </section>

        {/* ---- Charts: every question ---- */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <h2 className="text-[19px] font-semibold">Who registered</h2>
          <div className="flex flex-wrap gap-2">
            <Chip href={qs({ g: undefined })} on={!gender} label="Everyone" />
            <Chip href={qs({ g: "ikhwan" })} on={gender === "ikhwan"} label="Brothers" />
            <Chip href={qs({ g: "akhwat" })} on={gender === "akhwat"} label="Sisters" />
            <span className="w-px self-stretch bg-[var(--color-line)]" />
            <Chip href={qs({ h: hanyaHadir ? undefined : "1" })} on={hanyaHadir} label="Arrived only" />
          </div>
        </div>
        {gender || hanyaHadir ? (
          <p className="-mt-2 text-[13px] text-[var(--color-ink-2)]">
            Charts show {formatAngka(tersaring.total, "en")} people
            {gender ? ` · ${gender === "akhwat" ? "sisters" : "brothers"}` : ""}
            {hanyaHadir ? " · arrived" : ""}. The numbers above are still the whole programme.
          </p>
        ) : null}

        <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tersaring.distribusi
            .filter((d) => !(gender && d.kunci === "gender"))
            .map((d) => (
              d.peta ? (
                <KartuPeta key={d.kunci} d={d} />
              ) : d.jenis ? (
                <KartuSekolah key={d.kunci} d={d} />
              ) : (
                <KartuDistribusi key={d.kunci} d={d} />
              )
            ))}
        </div>
      </div>
    </main>
  );
}

function Angka({
  label,
  nilai,
  href,
  warna,
  children,
}: {
  label: string;
  nilai: number;
  href?: string;
  warna?: "brand" | "warn" | "redup";
  children?: React.ReactNode;
}) {
  const kelas =
    warna === "brand"
      ? "text-brand"
      : warna === "warn"
        ? "text-[var(--color-warn)]"
        : warna === "redup"
          ? "text-[var(--color-ink-2)]"
          : "";
  const isi = (
    <>
      <div className="text-[13px] text-[var(--color-ink-3)]">{label}</div>
      <div className={`mt-2 text-[32px] font-bold leading-none tabular-nums ${kelas}`}>
        {formatAngka(nilai, "en")}
      </div>
      {children ? <div className="mt-2 text-[13px] leading-[1.4] text-[var(--color-ink-2)]">{children}</div> : null}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 hover:bg-white">
      {isi}
    </Link>
  ) : (
    <div className="card p-5">{isi}</div>
  );
}

/** One side of the hall: seats taken against its quota, and who else is around it. */
function Sisi({ judul, a, href }: { judul: string; a: AngkaSisi; href: string }) {
  const terisi = a.kursi;
  const lebar = a.kuota ? Math.min(100, (terisi / a.kuota) * 100) : 0;
  return (
    <Link href={href} className="card block p-5 hover:bg-white">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[16px] font-semibold">{judul}</h3>
        <span className="text-[13px] text-[var(--color-ink-3)]">
          {a.kuota ? `quota ${formatAngka(a.kuota, "en")}` : "no quota set"}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[32px] font-bold leading-none tabular-nums">{formatAngka(terisi, "en")}</span>
        <span className="text-[14px] text-[var(--color-ink-2)]">
          {a.kuota ? `of ${formatAngka(a.kuota, "en")} seats · ${persen(terisi, a.kuota)}` : "seats booked"}
        </span>
      </div>
      {a.kuota ? (
        <div className="mt-3 h-2.5 overflow-hidden rounded-[3px] bg-[var(--color-canvas)]">
          <div
            className={`h-full ${lebar >= 100 ? "bg-[var(--color-warn)]" : "bg-brand"}`}
            style={{ width: `${lebar}%` }}
          />
        </div>
      ) : null}
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[12px] text-[var(--color-ink-3)]">
        <Kecil label="walk-in in" n={a.ots} />
        <Kecil label="walk-in wait" n={a.otsMenunggu} />
        <Kecil label="released" n={a.lepas} />
        <Kecil label="arrived" n={a.hadir} />
      </div>
    </Link>
  );
}

function Kecil({ label, n }: { label: string; n: number }) {
  return (
    <div className="rounded-[6px] bg-[var(--color-surface)] py-1.5">
      <div className="text-[16px] font-semibold tabular-nums text-[var(--color-ink)]">{formatAngka(n, "en")}</div>
      {label}
    </div>
  );
}

function Chip({ href, on, label }: { href: string; on: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-[8px] border px-3 py-1.5 text-[13px] font-medium ${
        on
          ? "border-brand bg-brand-100 font-semibold text-brand"
          : "border-[var(--color-line)] bg-white text-[var(--color-ink-2)]"
      }`}
    >
      {label}
    </Link>
  );
}

/** The recap as committee members forward it: Indonesian, WhatsApp bold, one screen. */
function teksRekap(nama: string, s: Statistik): string {
  const sekarang = new Date();
  const sisi = (label: string, a: AngkaSisi) =>
    `• ${label}: ${a.kursi}${a.kuota ? `/${a.kuota}` : ""} kursi · OTS masuk ${a.ots} · OTS antre ${a.otsMenunggu} · hadir ${a.hadir}`;
  const minat = s.distribusi.find((d) => d.kunci === "minat");
  const prodi = s.distribusi.find((d) => d.kunci === "prodi");
  const baris = [
    `*Rekap pendaftar — ${nama}*`,
    `${formatTanggal(sekarang, "en")} · ${formatJam(sekarang, "en")} WIB`,
    "",
    `Pendaftar aktif: *${s.total}*`,
    sisi("Ikhwan", s.sisi.ikhwan),
    sisi("Akhwat", s.sisi.akhwat),
    `Walk-in masuk: ${s.ots} · Walk-in antre: ${s.otsMenunggu} · Batal hadir: ${s.lepas}`,
    `Masuk grup WA: ${s.grupWa} (${persen(s.grupWa, s.total)})`,
    `Hadir: ${s.hadir}`,
  ];
  if (prodi && prodi.irisan.length) {
    baris.push("", "*Prodi*", ...prodi.irisan.map((i) => `• ${i.label}: ${i.n} (${persen(i.n, prodi.menjawab)})`));
  }
  if (minat && minat.irisan.length) {
    baris.push(
      "",
      "*Minat teratas*",
      ...minat.irisan.slice(0, 5).map((i) => `• ${i.label}: ${i.n} (${persen(i.n, minat.menjawab)})`),
    );
  }
  return baris.join("\n");
}
