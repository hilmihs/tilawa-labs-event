import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StaffNav } from "@/components/staff-nav";
import { TabPanel } from "@/components/tab-panel";
import { punyaAkses } from "@/lib/auth/sesi";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { detailPesertaPanel } from "@/lib/acara/queries";
import { kodeKeahlian, teksKeahlianLain } from "@/lib/acara/view-model";
import { t } from "@/lib/i18n/dict";
import { formatWaTampil } from "@/lib/wa";
import { formatJam, formatTanggal } from "@/lib/waktu";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  mahasiswa: "Current student",
  khirrij: "Graduate",
  mutarabbish: "Mutarabbish",
};

function waktu(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const x = new Date(d);
  return `${formatTanggal(x, "en")} · ${formatJam(x, "en")} WIB`;
}

/** Everything recorded about one registration — the answers, and what happened since. */
export default async function DetailPeserta({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ acara?: string }>;
}) {
  const sesi = await punyaAkses("panitia");
  if (!sesi) redirect("/gate?next=%2Fpanel%2Flist");

  const { id } = await params;
  const sp = await searchParams;
  const ev = await acaraUntukStaf(sp.acara);
  if (!ev) return <main className="p-10">No event configured.</main>;
  // Scoped to the programme in view: an id from another programme is simply not here.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const row = await detailPesertaPanel(ev.id, id);
  if (!row) notFound();
  const { p, k } = row;

  const f = t("en").form;
  const minat = kodeKeahlian(p.keahlian)
    .filter((x) => x !== "lain")
    .map((x) => (f.keahlianOpsi as Record<string, string>)[x] ?? x);
  const lain = teksKeahlianLain(p.keahlian);

  const statusDaftar =
    p.konfirmasi === false
      ? "Released their seat"
      : p.jenis === "ots"
        ? `Walk-in · number ${p.urutOts ?? "?"} in the queue · ${p.izinOtsAt ? "let in by the committee" : "waiting for a permit"}`
        : "Seat";

  const baris: Array<[string, React.ReactNode]> = [
    ["Participant number", <span key="n" className="font-mono">{p.nomor}</span>],
    ["Name", p.nama],
    ["Gender", p.gender === "akhwat" ? "Sister" : "Brother"],
    [
      "WhatsApp",
      <a key="wa" href={`https://wa.me/${p.wa}`} target="_blank" rel="noreferrer noopener" className="text-brand underline">
        {formatWaTampil(p.wa)}
      </a>,
    ],
    ["Email", p.email],
    ["Registration", statusDaftar],
    ["Status", p.statusLipia ? STATUS[p.statusLipia] ?? p.statusLipia : null],
    ["Programme of study", p.prodi],
    ["Semester", p.semester],
    ["Class session", p.sesi ? (p.sesi === "pagi" ? f.sesiPagi : f.sesiSore) : null],
    ["Graduation year", p.tahunLulus],
    ["Lives in", p.domisili],
    ["Home region", p.asalDaerah],
    ["School or pesantren", p.asalSekolah],
    ["Getting there", p.transportasi ? ((f.transport as Record<string, string>)[p.transportasi] ?? p.transportasi) : null],
    ["Interests", [...minat, lain ? `Other: ${lain}` : ""].filter(Boolean).join(", ") || null],
    ["Special needs", p.kebutuhanKhusus],
    ["Committee note", p.catatan],
  ];

  const jejak: Array<[string, string | null]> = [
    ["Registered", waktu(p.createdAt)],
    ["Source", p.sumber === "web" ? (p.jenis === "ots" ? "Walk-in link" : "Web form") : "Imported"],
    ["Has an account", p.penggunaId ? "Yes" : "No"],
    ["Joined the WhatsApp group", waktu(p.grupWaAt) ?? "Not yet"],
    ["Came back to their ticket", waktu(p.tiketDibukaAt) ?? "Not yet"],
    ["Said they cannot come", p.konfirmasi === false ? waktu(p.konfirmasiAt) : null],
    ["Walk-in permitted", p.jenis === "ots" ? (waktu(p.izinOtsAt) ?? "Not yet") : null],
    [
      "Arrived",
      k
        ? `${waktu(k.clientScannedAt ?? k.scannedAt)}${k.gate ? ` · ${k.gate}` : ""}${k.petugas ? ` · by ${k.petugas}` : ""}${k.offline ? " · offline" : ""}`
        : "Not yet",
    ],
  ];

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <StaffNav current="panel" nama={sesi.nama} acara={ev.slug} />
      <TabPanel aktif="peserta" acara={ev.slug} />
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-4 px-5 pt-5">
        <Link href={`/panel/list?acara=${ev.slug}`} className="text-[14px] font-medium text-brand underline">
          ← All participants
        </Link>
        <div>
          <h1 className="text-[22px] font-semibold leading-tight">{p.nama}</h1>
          <p className="mt-1 text-[14px] text-[var(--color-ink-2)]">
            {p.nomor} · {statusDaftar}
          </p>
        </div>

        <div className="grid items-start gap-4 md:grid-cols-[3fr_2fr]">
          <section className="card overflow-hidden">
            <h2 className="border-b border-[var(--color-line)] px-5 py-3 text-[15px] font-semibold">Answers</h2>
            <dl>
              {baris.map(([label, nilai]) => (
                <div key={label} className="grid grid-cols-[150px_1fr] gap-3 border-b border-[var(--color-line)] px-5 py-2.5 text-[14px] last:border-0">
                  <dt className="text-[var(--color-ink-3)]">{label}</dt>
                  <dd className="min-w-0 break-words">{nilai || <span className="text-[var(--color-ink-3)]">—</span>}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card overflow-hidden">
            <h2 className="border-b border-[var(--color-line)] px-5 py-3 text-[15px] font-semibold">What happened</h2>
            <ol>
              {jejak
                .filter(([, v]) => v)
                .map(([label, nilai]) => (
                  <li key={label} className="border-b border-[var(--color-line)] px-5 py-2.5 text-[14px] last:border-0">
                    <div className="text-[12px] text-[var(--color-ink-3)]">{label}</div>
                    <div>{nilai}</div>
                  </li>
                ))}
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
