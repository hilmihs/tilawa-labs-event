import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffNav } from "@/components/staff-nav";
import { PilihAcara } from "@/components/pilih-acara";
import { TabPanel } from "@/components/tab-panel";
import { AutoRefresh } from "@/components/auto-refresh";
import { BatangMendatar, BatangVertikal, Donat, persen } from "@/components/grafik";
import { punyaAkses } from "@/lib/auth/sesi";
import { adaCatatan } from "@/lib/catatan/kajian";
import { sesiDari } from "@/lib/kuis/jadwal";
import { JUMLAH_SOAL } from "@/lib/kuis/soal";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { LABEL_HALAMAN, type JenisHalaman } from "@/lib/trafik/klasifikasi";
import {
  corongPendaftaran,
  ringkasanTrafik,
  trafikCatatanKuis,
  trafikMenurut,
  trafikPerHari,
  trafikPerJamHariIni,
  trafikSumber,
} from "@/lib/trafik/queries";
import { formatAngka, formatJam, tanggalIsoWib } from "@/lib/waktu";

export const dynamic = "force-dynamic";

const RENTANG = {
  "1": { hari: 1, label: "Today" },
  "7": { hari: 7, label: "7 days" },
  "30": { hari: 30, label: "30 days" },
} as const;

/** Midnight WIB, `hari - 1` days ago: "today" starts at 00:00 in Jakarta, not in UTC. */
function awalRentang(hari: number): Date {
  const hariIni = tanggalIsoWib();
  const awal = new Date(`${hariIni}T00:00:00+07:00`);
  awal.setUTCDate(awal.getUTCDate() - (hari - 1));
  return awal;
}

/**
 * Who is visiting the public site, and whether they get as far as registering.
 * Answers the questions asked after every broadcast: did it land, where did people
 * come from, and where do they drop out.
 */
export default async function Trafik({
  searchParams,
}: {
  searchParams: Promise<{ acara?: string; r?: string }>;
}) {
  const sesi = await punyaAkses("panitia");
  if (!sesi) redirect("/gate?next=%2Fpanel%2Ftrafik");

  const sp = await searchParams;
  const ev = await acaraUntukStaf(sp.acara);
  if (!ev) return <main className="p-10">No event configured.</main>;

  const kunciRentang = sp.r === "1" || sp.r === "30" ? sp.r : "7";
  const rentang = RENTANG[kunciRentang];
  const sejak = awalRentang(rentang.hari);

  const [r, perHari, perJam, halaman, perangkat, bahasa, sumber, corong, ck] = await Promise.all([
    ringkasanTrafik(sejak),
    trafikPerHari(sejak),
    trafikPerJamHariIni(),
    trafikMenurut("halaman", sejak),
    trafikMenurut("perangkat", sejak),
    trafikMenurut("lang", sejak),
    trafikSumber(sejak),
    corongPendaftaran(ev.id, ev.slug, sejak),
    // Only a programme with lecture notes has an article and a quiz to count.
    adaCatatan(ev.slug) ? trafikCatatanKuis(ev.slug, sejak) : Promise.resolve(null),
  ]);

  // Every day of the range, including days nobody came: a gap should look like a gap.
  const peta = new Map(perHari.map((h) => [h.tanggal, h]));
  const hari = Array.from({ length: rentang.hari }, (_, i) => {
    const d = new Date(sejak);
    d.setUTCDate(d.getUTCDate() + i);
    const k = tanggalIsoWib(new Date(d.getTime() + 12 * 3600 * 1000));
    return { kunci: k, label: `${k.slice(8, 10)}/${k.slice(5, 7)}`, n: peta.get(k)?.pengunjung ?? 0, tayang: peta.get(k)?.tayang ?? 0 };
  });
  const jamPeta = new Map(perJam.map((j) => [j.jam, j]));
  const jamSekarang = Number(formatJam(new Date(), "en").slice(0, 2));
  const jam = Array.from({ length: jamSekarang + 1 }, (_, h) => ({
    kunci: String(h),
    label: String(h).padStart(2, "0"),
    n: jamPeta.get(h)?.pengunjung ?? 0,
    judul: `${String(h).padStart(2, "0")}:00 · ${jamPeta.get(h)?.pengunjung ?? 0} visitors · ${jamPeta.get(h)?.tayang ?? 0} views`,
  }));
  const puncakJam = [...jam].sort((a, b) => b.n - a.n)[0];

  const ckHari = ck
    ? (() => {
        const p = new Map(ck.perHari.map((h) => [h.tanggal, h]));
        const semua = hari.map((h) => ({ ...h, artikel: p.get(h.kunci)?.artikel ?? 0, kuis: p.get(h.kunci)?.kuis ?? 0 }));
        // From the first day anyone came, so a 30-day range does not push the notes'
        // own days off the right edge behind weeks of nothing.
        const awal = semua.findIndex((h) => h.artikel || h.kuis);
        return awal < 0 ? semua.slice(-7) : semua.slice(Math.min(awal, Math.max(0, semua.length - 7)));
      })()
    : [];

  const qs = (rr: string) => `/panel/trafik?acara=${encodeURIComponent(ev.slug)}&r=${rr}`;

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      {/* "Right now" is only worth something if it moves on its own. */}
      <AutoRefresh detik={30} />
      <StaffNav
        current="panel"
        nama={sesi.nama}
        acara={ev.slug}
        pilih={<PilihAcara sekarang={ev} next="/panel/trafik" />}
      />
      <TabPanel aktif="trafik" acara={ev.slug} />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-5 pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight">Site traffic</h1>
            <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">
              Public pages only · a visitor is one browser per day · no IP addresses stored · refreshes every 30 s
            </p>
          </div>
          <div className="flex gap-2">
            {Object.entries(RENTANG).map(([k, v]) => (
              <Link
                key={k}
                href={qs(k)}
                className={`rounded-[8px] border px-3 py-1.5 text-[13px] font-medium ${
                  k === kunciRentang
                    ? "border-brand bg-brand-100 font-semibold text-brand"
                    : "border-[var(--color-line)] bg-white text-[var(--color-ink-2)]"
                }`}
              >
                {v.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Angka label="On the site now" nilai={r.aktif} catatan="visitors in the last 5 minutes" warna />
          <Angka label="Visitors today" nilai={r.pengunjungHariIni} catatan={`${formatAngka(r.tayangHariIni, "en")} page views`} />
          <Angka
            label={`Visitors · ${rentang.label.toLowerCase()}`}
            nilai={r.pengunjung}
            catatan={`${formatAngka(r.tayang, "en")} page views · ${
              r.pengunjung ? (r.tayang / r.pengunjung).toFixed(1) : "0"
            } per visitor`}
          />
          <Angka
            label="Busiest hour today"
            nilaiTeks={puncakJam && puncakJam.n ? `${puncakJam.label}:00` : "—"}
            catatan={puncakJam && puncakJam.n ? `${formatAngka(puncakJam.n, "en")} visitors` : "no visits yet today"}
          />
        </div>

        {/* The funnel: where people drop out between the poster and the ticket. */}
        <section className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-semibold">From visit to registration · {ev.nama}</h2>
            <span className="text-[13px] text-[var(--color-ink-3)]">{rentang.label}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Tahap label="Saw the programme" n={corong.lihat} dari={corong.lihat} />
            <Tahap label="Opened the form" n={corong.formulir} dari={corong.lihat} />
            <Tahap label="Registered (web)" n={corong.daftar} dari={corong.formulir} />
            <Tahap label="Opened a ticket page" n={corong.tiket} dari={corong.daftar} catatan="includes returning participants" />
          </div>
          <p className="mt-3 text-[12px] leading-[1.5] text-[var(--color-ink-3)]">
            Each percentage is of the step before it. A big drop between the form and registering usually means
            the form is stuck on something — check the help-desk WhatsApp.
          </p>
        </section>

        <div className="grid gap-3 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="text-[17px] font-semibold">Visitors per day</h2>
            <p className="mt-0.5 text-[12px] text-[var(--color-ink-3)]">WIB</p>
            <div className="mt-4">
              <BatangVertikal
                data={hari.map((h) => ({ ...h, judul: `${h.kunci} · ${h.n} visitors · ${h.tayang} views` }))}
              />
            </div>
          </section>
          <section className="card p-5">
            <h2 className="text-[17px] font-semibold">Today, by hour</h2>
            <p className="mt-0.5 text-[12px] text-[var(--color-ink-3)]">WIB · visitors · use it to time the next broadcast</p>
            <div className="mt-4">
              <BatangVertikal data={jam} />
            </div>
          </section>
        </div>

        {ck ? (
          <section className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[17px] font-semibold">Lecture notes &amp; quiz · {ev.nama}</h2>
              <span className="text-[13px] text-[var(--color-ink-3)]">{rentang.label}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Tahap label="Read the notes" n={ck.bagian.artikel?.pengunjung ?? 0} catatan={`${formatAngka(ck.bagian.artikel?.tayang ?? 0, "en")} page views`} />
              <Tahap label="Opened a batch" n={ck.bagian.soal?.pengunjung ?? 0} catatan={`quiz board: ${formatAngka(ck.bagian.kuis?.pengunjung ?? 0, "en")} visitors`} />
              <Tahap label="Answered (accounts)" n={ck.penjawab} catatan={`${formatAngka(ck.jawaban, "en")} answers in this range`} />
              <Tahap
                label="Leaderboard · certificate"
                n={ck.bagian.papan?.pengunjung ?? 0}
                catatan={`certificate page: ${formatAngka(ck.bagian.sertifikat?.pengunjung ?? 0, "en")} visitors`}
              />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-[15px] font-semibold">Per day · notes and quiz</h3>
                <p className="mt-0.5 text-[12px] text-[var(--color-ink-3)]">WIB · visitors · top: notes, bottom: quiz</p>
                <div className="mt-3 flex flex-col gap-4">
                  <BatangVertikal
                    tinggi={70}
                    data={ckHari.map((h) => ({ kunci: h.kunci, label: h.label, n: h.artikel, judul: `${h.kunci} · ${h.artikel} read the notes` }))}
                  />
                  <BatangVertikal
                    tinggi={70}
                    data={ckHari.map((h) => ({ kunci: h.kunci, label: h.label, n: h.kuis, judul: `${h.kunci} · ${h.kuis} opened the quiz` }))}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold">Per question · answers</h3>
                <p className="mt-0.5 text-[12px] text-[var(--color-ink-3)]">
                  Hover a bar for how many opened its batch. A batch opened far more than it was answered usually
                  means people stopped at the sign-in.
                </p>
                <div className="mt-3">
                  <BatangVertikal
                    data={Array.from({ length: JUMLAH_SOAL }, (_, i) => {
                      const nomor = i + 1;
                      const n = ck.jawabanSoal.get(nomor) ?? 0;
                      const sesi = sesiDari(nomor);
                      const buka = ck.pengunjungSesi.get(sesi) ?? 0;
                      const sendiri = ck.pengunjungSoal.get(nomor) ?? 0;
                      return {
                        kunci: String(nomor),
                        label: String(nomor),
                        n,
                        judul: `Q${nomor} · ${n} answers · batch ${sesi} page: ${buka} visitors · own page: ${sendiri}`,
                      };
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 text-[15px] font-semibold">Where notes &amp; quiz readers came from</h3>
              {ck.sumber.length ? (
                <BatangMendatar
                  irisan={ck.sumber.slice(0, 8).map((s) => ({ kunci: s.kunci, label: s.kunci, n: s.pengunjung }))}
                  total={ck.sumber.reduce((a, s) => a + s.pengunjung, 0)}
                />
              ) : (
                <Kosong />
              )}
              <p className="mt-3 text-[12px] leading-[1.5] text-[var(--color-ink-3)]">
                The quiz link in the release messages on /panel/kuis carries <code>?src=wa</code>, so a click from the
                groups shows here as WhatsApp.
              </p>
            </div>
          </section>
        ) : null}

        <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          <section className="card p-5">
            <h2 className="text-[16px] font-semibold">Where they came from</h2>
            <p className="mt-0.5 mb-3 text-[12px] leading-[1.45] text-[var(--color-ink-3)]">
              By the first page each visitor opened. &ldquo;Direct&rdquo; includes links opened inside the WhatsApp app,
              which does not say where a click came from — add <code>?src=wa</code> to links you broadcast to count
              them.
            </p>
            {sumber.length ? (
              <BatangMendatar
                irisan={sumber.slice(0, 10).map((s) => ({ kunci: s.kunci, label: s.kunci, n: s.pengunjung }))}
                total={sumber.reduce((a, s) => a + s.pengunjung, 0)}
              />
            ) : (
              <Kosong />
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 text-[16px] font-semibold">Pages visited</h2>
            {halaman.length ? (
              <BatangMendatar
                irisan={halaman.map((h) => ({
                  kunci: h.kunci ?? "lain",
                  label: LABEL_HALAMAN[(h.kunci ?? "lain") as JenisHalaman] ?? h.kunci ?? "Other",
                  n: h.pengunjung,
                }))}
                total={r.pengunjung}
              />
            ) : (
              <Kosong />
            )}
          </section>

          <section className="card flex flex-col gap-5 p-5">
            <div>
              <h2 className="mb-3 text-[16px] font-semibold">Device</h2>
              {perangkat.length ? (
                <Donat
                  irisan={perangkat.map((p) => ({
                    kunci: p.kunci ?? "?",
                    label: p.kunci === "mobile" ? "Phone" : p.kunci === "tablet" ? "Tablet" : "Computer",
                    n: p.pengunjung,
                  }))}
                  total={perangkat.reduce((a, p) => a + p.pengunjung, 0)}
                />
              ) : (
                <Kosong />
              )}
            </div>
            <div>
              <h2 className="mb-3 text-[16px] font-semibold">Language</h2>
              {bahasa.length ? (
                <Donat
                  irisan={bahasa.map((b) => ({
                    kunci: b.kunci ?? "?",
                    label: b.kunci === "ar" ? "العربية" : b.kunci === "en" ? "English" : "—",
                    n: b.pengunjung,
                  }))}
                  total={bahasa.reduce((a, b) => a + b.pengunjung, 0)}
                />
              ) : (
                <Kosong />
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Angka({
  label,
  nilai,
  nilaiTeks,
  catatan,
  warna = false,
}: {
  label: string;
  nilai?: number;
  nilaiTeks?: string;
  catatan?: string;
  warna?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-[13px] text-[var(--color-ink-3)]">
        {warna ? <span className="h-2 w-2 animate-pulse rounded-full bg-brand-300" /> : null}
        {label}
      </div>
      <div className={`mt-2 text-[32px] font-bold leading-none tabular-nums ${warna ? "text-brand" : ""}`}>
        {nilaiTeks ?? formatAngka(nilai ?? 0, "en")}
      </div>
      {catatan ? <div className="mt-2 text-[13px] text-[var(--color-ink-2)]">{catatan}</div> : null}
    </div>
  );
}

/** A funnel step; without `dari` it is a plain figure, with no bar to compare against. */
function Tahap({ label, n, dari, catatan }: { label: string; n: number; dari?: number; catatan?: string }) {
  const lebar = dari ? Math.min(100, (n / dari) * 100) : n ? 100 : 0;
  return (
    <div className="rounded-[8px] bg-[var(--color-surface)] p-4">
      <div className="text-[13px] text-[var(--color-ink-3)]">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[26px] font-bold leading-none tabular-nums">{formatAngka(n, "en")}</span>
        {/* Over 100% only means the steps were counted differently (a visitor is per day). */}
        {dari && n < dari ? <span className="text-[13px] text-[var(--color-ink-2)]">{persen(n, dari)}</span> : null}
      </div>
      {dari !== undefined ? (
        <div className="mt-2 h-2 overflow-hidden rounded-[3px] bg-[var(--color-canvas)]">
          <div className="h-full bg-brand" style={{ width: `${lebar}%` }} />
        </div>
      ) : null}
      {catatan ? <div className="mt-1.5 text-[11px] text-[var(--color-ink-3)]">{catatan}</div> : null}
    </div>
  );
}

function Kosong() {
  return <p className="text-[14px] text-[var(--color-ink-3)]">No visits in this range yet.</p>;
}
