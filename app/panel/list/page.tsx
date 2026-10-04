import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffNav } from "@/components/staff-nav";
import { PilihAcara } from "@/components/pilih-acara";
import { TabPanel } from "@/components/tab-panel";
import { punyaAkses } from "@/lib/auth/sesi";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { daftarPesertaPanel } from "@/lib/acara/queries";
import { PRODI, kodeKeahlian, teksKeahlianLain } from "@/lib/acara/view-model";
import { t } from "@/lib/i18n/dict";
import { formatWaTampil } from "@/lib/wa";
import { formatAngka, formatJam, formatTanggal } from "@/lib/waktu";

export const dynamic = "force-dynamic";

const PER_HALAMAN = 100;

const STATUS_SINGKAT: Record<string, string> = {
  mahasiswa: "Student",
  khirrij: "Graduate",
  mutarabbish: "Mutarabbish",
};

type Param = {
  hadir?: string;
  gender?: string;
  jenis?: string;
  batal?: string;
  grup?: string;
  status?: string;
  prodi?: string;
  q?: string;
  hal?: string;
  acara?: string;
};

/**
 * Every registration and every answer, in the dashboard itself — not only in the CSV.
 * The filters are the questions actually asked ("who has not arrived", "which sisters
 * are still waiting", "who has not joined the group"), and the list pages through all
 * of them instead of stopping at the first few hundred.
 */
export default async function PanelList({ searchParams }: { searchParams: Promise<Param> }) {
  const sesi = await punyaAkses("panitia");
  if (!sesi) redirect("/gate?next=%2Fpanel%2Flist");

  const sp = await searchParams;
  const ev = await acaraUntukStaf(sp.acara);
  if (!ev) return <main className="p-10">No event configured.</main>;

  const hadir = sp.hadir === "sudah" || sp.hadir === "belum" ? sp.hadir : undefined;
  const gender = sp.gender === "ikhwan" || sp.gender === "akhwat" ? sp.gender : undefined;
  const jenis = sp.jenis === "ots" || sp.jenis === "pra" ? sp.jenis : undefined;
  const batal = sp.batal === "1" ? true : undefined;
  const tanpaGrup = sp.grup === "belum" ? true : undefined;
  const status = sp.status && STATUS_SINGKAT[sp.status] ? sp.status : undefined;
  const prodi = sp.prodi && (PRODI as readonly string[]).includes(sp.prodi) ? sp.prodi : undefined;
  const halaman = Math.max(1, Math.floor(Number(sp.hal) || 1));

  const { baris, total } = await daftarPesertaPanel(ev.id, {
    hadir,
    gender,
    jenis,
    batal,
    tanpaGrup,
    statusLipia: status,
    prodi,
    q: sp.q,
    limit: PER_HALAMAN,
    offset: (halaman - 1) * PER_HALAMAN,
  });
  const jumlahHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const dari = total === 0 ? 0 : (halaman - 1) * PER_HALAMAN + 1;
  const sampai = Math.min(total, halaman * PER_HALAMAN);

  const f = t("en").form;
  const qs = (patch: Partial<Record<keyof Param, string | undefined>>) => {
    const p = new URLSearchParams();
    const gabung: Partial<Record<keyof Param, string | undefined>> = {
      acara: ev.slug,
      hadir,
      gender,
      jenis,
      batal: batal ? "1" : undefined,
      grup: tanpaGrup ? "belum" : undefined,
      status,
      prodi,
      q: sp.q,
      // Changing a filter goes back to the first page; only the pager keeps `hal`.
      hal: undefined,
      ...patch,
    };
    for (const [k, v] of Object.entries(gabung)) if (v) p.set(k, v);
    return `/panel/list?${p.toString()}`;
  };

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <StaffNav
        current="panel"
        nama={sesi.nama}
        acara={ev.slug}
        pilih={<PilihAcara sekarang={ev} next="/panel/list" />}
      />
      <TabPanel aktif="peserta" acara={ev.slug} />

      <div className="flex w-full flex-col gap-3 px-5 pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-xl font-semibold">Participants</h1>
          <a
            href={`/api/export?format=csv&acara=${encodeURIComponent(ev.slug)}`}
            className="text-[14px] font-medium text-brand underline"
          >
            Download everything as CSV
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip href={qs({ hadir: undefined })} on={!hadir} label="Everyone" />
          <Chip href={qs({ hadir: "belum" })} on={hadir === "belum"} label="Not arrived" />
          <Chip href={qs({ hadir: "sudah" })} on={hadir === "sudah"} label="Arrived" />
          <Pemisah />
          <Chip href={qs({ gender: undefined })} on={!gender} label="Both" />
          <Chip href={qs({ gender: "ikhwan" })} on={gender === "ikhwan"} label="Brothers" />
          <Chip href={qs({ gender: "akhwat" })} on={gender === "akhwat"} label="Sisters" />
          <Pemisah />
          <Chip href={qs({ jenis: jenis === "pra" ? undefined : "pra" })} on={jenis === "pra"} label="Seat" />
          <Chip href={qs({ jenis: jenis === "ots" ? undefined : "ots" })} on={jenis === "ots"} label="Walk-in" />
          <Chip href={qs({ batal: batal ? undefined : "1" })} on={!!batal} label="Released seat" />
          <Chip
            href={qs({ grup: tanpaGrup ? undefined : "belum" })}
            on={!!tanpaGrup}
            label="Not in WA group"
          />
        </div>

        <form action="/panel/list" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_170px_190px_auto]">
          {Object.entries({
            acara: ev.slug,
            hadir,
            gender,
            jenis,
            batal: batal ? "1" : undefined,
            grup: tanpaGrup ? "belum" : undefined,
          }).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Name, number, email, or WhatsApp digits"
            className="field"
          />
          <select name="status" defaultValue={status ?? ""} className="field">
            <option value="">Any status</option>
            {Object.entries(STATUS_SINGKAT).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select name="prodi" defaultValue={prodi ?? ""} className="field">
            <option value="">Any programme</option>
            {PRODI.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost">Apply</button>
        </form>

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3 text-[13px] text-[var(--color-ink-2)]">
            <span>
              {total === 0
                ? "Nobody matches that."
                : `${formatAngka(dari, "en")}–${formatAngka(sampai, "en")} of ${formatAngka(total, "en")}`}
              {jenis === "ots" ? " · in queue order" : " · by name"}
            </span>
            <Pager halaman={halaman} jumlah={jumlahHalaman} href={(h) => `${qs({})}&hal=${h}`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1800px] text-[13px]">
              <thead>
                <tr className="border-y border-[var(--color-line)] bg-[var(--color-surface)] text-start text-[11px] font-semibold tracking-[0.04em] text-[var(--color-ink-2)]">
                  <Th sticky>NUMBER · NAME</Th>
                  <Th>STATUS</Th>
                  <Th>WHATSAPP</Th>
                  <Th>STUDIES</Th>
                  <Th>LIVES IN</Th>
                  <Th>HOME REGION</Th>
                  <Th>SCHOOL</Th>
                  <Th>GETTING THERE</Th>
                  <Th>INTERESTS</Th>
                  <Th>NEEDS</Th>
                  <Th>WA GROUP</Th>
                  <Th>REGISTERED</Th>
                  <Th>ARRIVED</Th>
                </tr>
              </thead>
              <tbody>
                {baris.map((p, i) => {
                  const minat = [
                    ...kodeKeahlian(p.keahlian)
                      .filter((k) => k !== "lain")
                      .map((k) => (f.keahlianOpsi as Record<string, string>)[k] ?? k),
                    teksKeahlianLain(p.keahlian),
                  ].filter(Boolean);
                  return (
                    <tr key={p.id} className="border-b border-[var(--color-line)] align-top hover:bg-white">
                      <td className="sticky start-0 z-[1] min-w-[230px] bg-[var(--color-paper)] px-4 py-2.5">
                        <Link href={`/panel/list/${p.id}?acara=${ev.slug}`} className="block">
                          <span className="font-mono text-[12px] text-[var(--color-ink-2)]">
                            {p.jenis === "ots" && p.urutOts ? (
                              <span className="me-1.5 font-sans font-bold text-[var(--color-warn)]">#{p.urutOts}</span>
                            ) : null}
                            {p.nomor}
                          </span>
                          <span className="block font-semibold text-[var(--color-ink)] underline-offset-2 hover:underline">
                            {p.nama}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          <Lencana>{p.gender === "akhwat" ? "Sister" : "Brother"}</Lencana>
                          {p.jenis === "ots" ? (
                            p.izinOtsAt ? <Lencana warna="brand">Walk-in · in</Lencana> : <Lencana warna="warn">Walk-in · waiting</Lencana>
                          ) : null}
                          {p.konfirmasi === false ? <Lencana warna="gelap">Released</Lencana> : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <a
                          href={`https://wa.me/${p.wa}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-brand underline-offset-2 hover:underline"
                        >
                          {formatWaTampil(p.wa)}
                        </a>
                      </td>
                      <td className="px-4 py-2.5">
                        {p.statusLipia ? STATUS_SINGKAT[p.statusLipia] ?? p.statusLipia : "—"}
                        {p.prodi ? ` · ${p.prodi}` : ""}
                        {p.semester ? ` · sem ${p.semester}` : ""}
                        {p.sesi ? ` · ${p.sesi === "pagi" ? "morning" : "afternoon"}` : ""}
                        {p.tahunLulus ? ` · grad ${p.tahunLulus}` : ""}
                      </td>
                      <Td>{p.domisili}</Td>
                      <Td>{p.asalDaerah}</Td>
                      <Td>{p.asalSekolah}</Td>
                      <Td>
                        {p.transportasi ? ((f.transport as Record<string, string>)[p.transportasi] ?? p.transportasi) : null}
                      </Td>
                      <Td>{minat.join(", ")}</Td>
                      <Td>{p.kebutuhanKhusus}</Td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        {p.grupWaAt ? (
                          <span className="text-brand">joined</span>
                        ) : (
                          <span className="text-[var(--color-ink-3)]">not yet</span>
                        )}
                        <div className="text-[11px] text-[var(--color-ink-3)]">
                          ticket {p.tiketDibukaAt ? "reopened" : "not reopened"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[var(--color-ink-2)]">
                        {formatTanggal(new Date(p.createdAt), "en").replace(/^\w+, /, "")}
                        <div className="text-[11px] text-[var(--color-ink-3)]">
                          {formatJam(new Date(p.createdAt), "en")}
                          {p.sumber !== "web" ? " · import" : ""}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        {p.scannedAt ? (
                          <span className="text-brand">
                            {formatJam(new Date(p.scannedAt), "en")}
                            {p.gate ? ` · ${p.gate}` : ""}
                          </span>
                        ) : (
                          <span className="text-[var(--color-ink-3)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {jumlahHalaman > 1 ? (
            <div className="flex justify-end px-5 py-3">
              <Pager halaman={halaman} jumlah={jumlahHalaman} href={(h) => `${qs({})}&hal=${h}`} />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Th({ children, sticky = false }: { children: React.ReactNode; sticky?: boolean }) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-2.5 text-start ${
        sticky ? "sticky start-0 z-[1] bg-[var(--color-surface)]" : ""
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="max-w-[220px] px-4 py-2.5 text-[var(--color-ink-2)]">
      {children || <span className="text-[var(--color-ink-3)]">—</span>}
    </td>
  );
}

function Lencana({ children, warna }: { children: React.ReactNode; warna?: "warn" | "brand" | "gelap" }) {
  const kelas =
    warna === "warn"
      ? "bg-[var(--color-warn)]/25 text-[var(--color-ink)]"
      : warna === "brand"
        ? "bg-brand-100 text-brand"
        : warna === "gelap"
          ? "bg-[var(--color-ink-2)] text-white"
          : "bg-[var(--color-canvas)] text-[var(--color-ink-2)]";
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${kelas}`}>{children}</span>;
}

function Pemisah() {
  return <span className="mx-0.5 w-px self-stretch bg-[var(--color-line)]" />;
}

function Pager({ halaman, jumlah, href }: { halaman: number; jumlah: number; href: (h: number) => string }) {
  if (jumlah <= 1) return null;
  return (
    <nav className="flex items-center gap-1.5 text-[13px]" aria-label="Pages">
      {halaman > 1 ? (
        <Link href={href(halaman - 1)} className="rounded-[6px] border border-[var(--color-line)] bg-white px-2.5 py-1">
          ← Prev
        </Link>
      ) : null}
      <span className="px-1.5">
        Page {halaman} of {jumlah}
      </span>
      {halaman < jumlah ? (
        <Link href={href(halaman + 1)} className="rounded-[6px] border border-[var(--color-line)] bg-white px-2.5 py-1">
          Next →
        </Link>
      ) : null}
    </nav>
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
