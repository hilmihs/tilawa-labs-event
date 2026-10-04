import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc, eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { acaraPeserta } from "@/db/schema";
import { punyaAkses } from "@/lib/auth/sesi";
import { ambilAcara, ringkasanAcara } from "@/lib/acara/queries";
import { StaffNav } from "@/components/staff-nav";
import { ImportForm } from "../import-form";
import { EventForm } from "../event-form";
import { kosongkanPendaftar, ubahAktif, ubahStatus, ubahWaPeserta } from "../actions";
import { formatJam, formatTanggalIso } from "@/lib/waktu";
import { labelStatusAcara, labelSumber } from "@/lib/acara/view-model";
import { EmailAbsen } from "../absen-email";
import { daftarAbsen } from "@/lib/absen/queries";
import { bisaDiingatkan } from "@/lib/absen/pengingat";
import { adaCatatan } from "@/lib/catatan/kajian";

export const dynamic = "force-dynamic";
// Server Actions take their time limit from the page they run on: the no-show email
// sends to everyone in one press. The action also stops itself well before this.
export const maxDuration = 300;

const STATUS = ["draft", "pendaftaran", "ditutup", "berlangsung", "selesai", "batal"] as const;

const ARTI: Record<string, string> = {
  draft: "Nothing is public yet.",
  pendaftaran: "The form is open. This is the only status that opens it.",
  ditutup: "The form is closed; tickets still work.",
  berlangsung: "Event day. The walk-in link works if it is open.",
  selesai: "Over. Scanners wipe their offline copy on next open.",
  batal: "Cancelled.",
};

export default async function AdminAcara({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; wa?: string; kosong?: string; akun?: string }>;
}) {
  const sesi = await punyaAkses("admin");
  if (!sesi) redirect("/gate?next=%2Fadmin");

  const { slug } = await params;
  const ev = await ambilAcara(slug);
  if (!ev) notFound();

  const sp = await searchParams;
  const r = await ringkasanAcara(ev.id);
  const absen = await daftarAbsen(ev.id);
  const denganEmail = absen.filter((a) => a.email && !a.diisiAt);
  const hitungAbsen = {
    absen: absen.length,
    punyaEmail: absen.filter((a) => a.email).length,
    belumUndangan: denganEmail.filter((a) => !a.emailAt).length,
    bisaDiingatkan: denganEmail.filter((a) => bisaDiingatkan(a)).length,
  };
  const db = getDb();

  const terbaru = await db
    .select({
      nomor: acaraPeserta.nomor,
      nama: acaraPeserta.nama,
      wa: acaraPeserta.wa,
      gender: acaraPeserta.gender,
      sumber: acaraPeserta.sumber,
      aktif: acaraPeserta.aktif,
      catatan: acaraPeserta.catatan,
      createdAt: acaraPeserta.createdAt,
    })
    .from(acaraPeserta)
    .where(
      sp.q
        ? and(eq(acaraPeserta.acaraId, ev.id), eq(acaraPeserta.nomor, sp.q.trim()))
        : eq(acaraPeserta.acaraId, ev.id),
    )
    .orderBy(desc(acaraPeserta.createdAt))
    .limit(25);

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <StaffNav current="admin" nama={sesi.nama} acara={ev.slug} />

      <div className="mx-auto w-full max-w-[1040px] px-5 pt-4 text-[13px]">
        <Link href="/admin" className="underline">← All programmes</Link>
      </div>

      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-4 px-5 pt-6">
        <section className="card p-5">
          <h1 className="text-[17px] font-semibold">{ev.nama}</h1>
          <p className="mt-1 text-[14px] text-[var(--color-ink-2)]">
            {formatTanggalIso(ev.tanggal, "en")} · {ev.lokasi} · slug{" "}
            <code className="rounded bg-[var(--color-surface)] px-1.5 py-0.5">{ev.slug}</code>
          </p>
          <div className="mt-3 flex flex-wrap gap-5 text-[14px]">
            <span>
              Registered <strong className="font-semibold">{r.pendaftar}</strong>
            </span>
            <span>
              Tickets opened <strong className="font-semibold">{r.tiketDibuka}</strong>
            </span>
            <span>
              Arrived <strong className="font-semibold">{r.hadir}</strong>
            </span>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-[17px] font-semibold">Event status</h2>
          <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
            The registration door is read from this, never from comparing dates — so the
            committee can close early when the hall is full without moving an announced date.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {STATUS.map((s) => (
              <form key={s} action={ubahStatus} className="flex items-center gap-3">
                <input type="hidden" name="slug" value={ev.slug} />
                <input type="hidden" name="status" value={s} />
                <button
                  type="submit"
                  disabled={s === ev.status}
                  className={`h-10 w-[170px] flex-none rounded-[8px] border px-2 text-[13px] font-semibold ${
                    s === ev.status
                      ? "border-brand bg-brand-100 text-brand"
                      : "border-[var(--color-line)] bg-white"
                  }`}
                >
                  {labelStatusAcara(s)}
                </button>
                <span className="text-[13px] text-[var(--color-ink-2)]">{ARTI[s]}</span>
              </form>
            ))}
          </div>
        </section>

        <EmailAbsen slug={ev.slug} selesai={ev.status === "selesai"} adaCatatan={adaCatatan(ev.slug)} hitung={hitungAbsen} />

        <section className="card p-5">
          <h2 className="text-[17px] font-semibold">Event details</h2>
          <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
            Everything the public pages show. The slug and the number prefix are not here
            on purpose — both are already baked into numbers issued and links sent.
          </p>
          <div className="mt-4">
            <EventForm
              slug={ev.slug}
              awal={{
                nama: ev.nama,
                namaAr: ev.namaAr,
                judul: ev.judul,
                judulAr: ev.judulAr,
                pemateri: ev.pemateri,
                pemateriAr: ev.pemateriAr,
                penyelenggara: ev.penyelenggara,
                tanggal: ev.tanggal,
                waktuMulai: ev.waktuMulai,
                waktuSelesai: ev.waktuSelesai,
                waktuWajibTiba: ev.waktuWajibTiba,
                lokasi: ev.lokasi,
                lokasiAr: ev.lokasiAr,
                alamat: ev.alamat,
                alamatAr: ev.alamatAr,
                petaUrl: ev.petaUrl,
                petaGambarUrl: ev.petaGambarUrl,
                petaEmbedUrl: ev.petaEmbedUrl,
                tatibUrl: ev.tatibUrl,
                feedbackUrl: ev.feedbackUrl,
                gateIkhwan: ev.gateIkhwan,
                gateAkhwat: ev.gateAkhwat,
                kuota: ev.kuota,
                kuotaIkhwan: ev.kuotaIkhwan,
                kuotaAkhwat: ev.kuotaAkhwat,
                otsBuka: ev.otsBuka,
                waGrupIkhwan: ev.waGrupIkhwan,
                waGrupAkhwat: ev.waGrupAkhwat,
                waAdmin: ev.waAdmin,
                agenda: ev.agenda,
                jenis: ev.jenis,
                pakaiTiket: ev.pakaiTiket,
                deskripsi: ev.deskripsi,
                deskripsiAr: ev.deskripsiAr,
                posterUrl: ev.posterUrl,
                tampil: ev.tampil,
                urutan: ev.urutan,
              }}
            />
          </div>
        </section>

        <ImportForm slug={ev.slug} />

        {/*
          The committee has no shell on the server, so clearing a guest list has to be
          possible from here. One named operation, not a query box: the admin code
          always ends up in a WhatsApp group, and this is what it would reach.
        */}
        <section className="card border-[var(--color-danger)]/40 p-5">
          <h2 className="text-[17px] font-semibold text-[var(--color-danger)]">
            Empty this programme
          </h2>
          <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
            Deletes every registration and attendance row for <strong>{ev.nama}</strong> and
            restarts numbering at 0001. Tickets already issued stop working. This cannot be
            undone.
          </p>
          {sp.kosong === "ok" ? (
            <p role="status" className="mt-3 rounded-[8px] bg-brand-100 px-4 py-3 text-[14px]">
              Registrations deleted
              {sp.akun && sp.akun !== "0" ? ` · ${sp.akun} account(s) deleted` : ""}. Numbering
              starts at 0001 again.
            </p>
          ) : null}
          {sp.kosong === "salah" ? (
            <p
              role="alert"
              className="mt-3 rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] text-[var(--color-danger)]"
            >
              Nothing was deleted — the confirmation did not match the slug.
            </p>
          ) : null}
          <form action={kosongkanPendaftar} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="slug" value={ev.slug} />
            <div>
              <label className="label" htmlFor="konfirmasi">
                Type <code className="rounded bg-[var(--color-surface)] px-1.5 py-0.5">{ev.slug}</code>{" "}
                to confirm
              </label>
              <input id="konfirmasi" name="konfirmasi" autoComplete="off" className="field h-10 w-[260px] text-[14px]" />
            </div>
            <label className="flex items-center gap-3 text-[14px]">
              <input type="checkbox" name="hapus_akun" className="h-5 w-5 accent-[var(--color-danger)]" />
              Also delete the participant accounts these registrations belong to
            </label>
            <button
              type="submit"
              className="h-11 w-[260px] rounded-[6px] border-[1.5px] border-[var(--color-danger)] bg-[var(--color-danger)] px-4 text-[14px] font-semibold text-white"
            >
              Delete all registrations
            </button>
          </form>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <h2 className="text-[17px] font-semibold">Latest registrations</h2>
            {sp.wa ? (
              <span
                className={`text-[13px] font-semibold ${
                  sp.wa === "ok" ? "text-brand" : "text-[var(--color-danger)]"
                }`}
              >
                {sp.wa === "ok"
                  ? "WhatsApp number changed."
                  : sp.wa === "bentrok"
                    ? "That number already belongs to another participant."
                    : "That number could not be read."}
              </span>
            ) : null}
            <form action={`/admin/${ev.slug}`} className="flex gap-2">
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Participant number"
                className="field h-10 w-[190px] text-[14px]"
              />
              <button className="btn btn-ghost h-10 text-[13px]">Find</button>
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[14px]">
              <thead>
                <tr className="border-y border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs font-semibold text-[var(--color-ink-2)]">
                  <th className="px-5 py-2.5">TIME</th>
                  <th className="px-5 py-2.5">NUMBER</th>
                  <th className="px-5 py-2.5">NAME</th>
                  <th className="px-5 py-2.5">SOURCE</th>
                  <th className="px-5 py-2.5">STATE</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {terbaru.map((p) => (
                  <tr key={p.nomor} className="border-b border-[var(--color-line)]">
                    <td className="px-5 py-3 text-[var(--color-ink-2)]">
                      {formatJam(p.createdAt, "en")}
                    </td>
                    <td className="px-5 py-3">{p.nomor}</td>
                    <td className="px-5 py-3">
                      {p.nama}
                      {p.catatan ? (
                        <div className="text-[12px] text-[var(--color-warn)]">{p.catatan}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-ink-2)]">{labelSumber(p.sumber)}</td>
                    <td className="px-5 py-3">
                      {p.aktif ? (
                        <span className="text-brand">active</span>
                      ) : (
                        <span className="text-[var(--color-danger)]">deactivated</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        {/* The correction participants cannot make for themselves. */}
                        <form action={ubahWaPeserta} className="flex items-center gap-1.5">
                          <input type="hidden" name="slug" value={ev.slug} />
                          <input type="hidden" name="nomor" value={p.nomor} />
                          <input
                            name="wa"
                            defaultValue={p.wa}
                            aria-label={`WhatsApp number for ${p.nomor}`}
                            className="field h-9 w-[150px] text-[13px]"
                          />
                          <button className="text-[13px] font-semibold underline">Save</button>
                        </form>
                        {/* Deactivate, never delete: deleting destroys the trail. */}
                        <form action={ubahAktif}>
                          <input type="hidden" name="slug" value={ev.slug} />
                          <input type="hidden" name="nomor" value={p.nomor} />
                          <input type="hidden" name="aktif" value={p.aktif ? "false" : "true"} />
                          <button className="text-[13px] font-semibold underline">
                            {p.aktif ? "Deactivate" : "Reactivate"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
