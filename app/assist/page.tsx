import { redirect } from "next/navigation";
import { punyaAkses } from "@/lib/auth/sesi";
import { keGate } from "@/lib/auth/tujuan";
import { ambilAcara, cariUntukBantuan, ringkasBantuan } from "@/lib/acara/queries";
import { antreanOts } from "@/lib/acara/ots";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { PilihAcara } from "@/components/pilih-acara";
import { batalkanKehadiran, catatKehadiranLangsung } from "@/lib/kehadiran/catat";
import { formatAngka, formatJam } from "@/lib/waktu";
import { StaffNav } from "@/components/staff-nav";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function Assist({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; done?: string; acara?: string }>;
}) {
  const sp = await searchParams;
  const sesi = await punyaAkses("petugas");
  if (!sesi) redirect(keGate("/assist", sp.acara));

  const q = sp.q ?? "";
  const ev = await acaraUntukStaf(sp.acara);
  if (!ev) return <main className="p-10">No event configured.</main>;

  const [hasil, meja, antrean] = await Promise.all([
    q ? cariUntukBantuan(ev.id, q) : Promise.resolve([]),
    ringkasBantuan(ev.id),
    antreanOts(ev.id),
  ]);

  /*
   * One action, one button. For a walk-in still in the queue, letting them in here
   * is the permit (catatKehadiranLangsung stamps it), so the desk can act without
   * waiting for the dashboard.
   */
  async function tandaiHadir(form: FormData) {
    "use server";
    const slug = String(form.get("slug") ?? "");
    const s = await punyaAkses("petugas");
    if (!s) redirect(keGate("/assist", slug));
    const e = await ambilAcara(slug);
    // Returning silently left the desk staring at an unchanged row with no idea
    // whether anything was written. Say so instead.
    if (!e) redirect(`/assist?acara=${encodeURIComponent(slug)}&done=gagal`);
    const pesertaId = String(form.get("peserta_id"));
    const hasilTandai = await catatKehadiranLangsung(e.id, pesertaId, {
      gate: "BANTUAN",
      petugas: s.nama || null,
      metode: "nama",
    });
    revalidatePath("/assist");
    redirect(
      `/assist?q=${encodeURIComponent(String(form.get("q") ?? ""))}` +
        `&acara=${encodeURIComponent(slug)}&done=${hasilTandai}`,
    );
  }

  async function batalkan(form: FormData) {
    "use server";
    const slug = String(form.get("slug") ?? "");
    const s = await punyaAkses("petugas");
    if (!s) redirect(keGate("/assist", slug));
    const e = await ambilAcara(slug);
    if (!e) redirect(`/assist?acara=${encodeURIComponent(slug)}&done=gagal`);
    await batalkanKehadiran(e.id, String(form.get("peserta_id")), s.nama);
    revalidatePath("/assist");
    redirect(
      `/assist?q=${encodeURIComponent(String(form.get("q") ?? ""))}` +
        `&acara=${encodeURIComponent(slug)}&done=batal`,
    );
  }

  const sisiIkhwan = antrean.sisi.find((x) => x.gender === "ikhwan");
  const sisiAkhwat = antrean.sisi.find((x) => x.gender === "akhwat");
  const angkaSisa = (x?: { sisa: number | null }) => (x?.sisa == null ? "—" : formatAngka(x.sisa, "en"));
  const nadaSisa = (x?: { sisa: number | null }) =>
    x?.sisa == null ? undefined : x.sisa <= 0 ? ("merah" as const) : ("hijau" as const);

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <StaffNav
        current="assist"
        nama={sesi.nama}
        peran={sesi.peran}
        acara={ev.slug}
        pilih={<PilihAcara sekarang={ev} next="/assist" />}
      />

      <div className="mx-auto w-full max-w-[640px] px-5 pt-6">
        <h1 className="text-xl font-semibold">Help desk</h1>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-[var(--color-ink-2)]">
          For a participant whose phone is dead or whose QR will not read. Search by name,
          participant number, or the last digits of their WhatsApp number.
        </p>

        {/*
          The desk lets people in against the seats actually free, per side of the
          hall, and sees the walk-in queue it may be asked about.
        */}
        <div className="card mt-4 grid grid-cols-2 gap-3 p-4 text-center sm:grid-cols-4">
          <Angka label="Seats free · brothers" nilai={angkaSisa(sisiIkhwan)} nada={nadaSisa(sisiIkhwan)} />
          <Angka label="Seats free · sisters" nilai={angkaSisa(sisiAkhwat)} nada={nadaSisa(sisiAkhwat)} />
          <Angka
            label="Walk-ins waiting"
            nilai={formatAngka((sisiIkhwan?.menunggu ?? 0) + (sisiAkhwat?.menunggu ?? 0), "en")}
            nada="kuning"
          />
          <Angka label="Let in by this desk" nilai={formatAngka(meja.total, "en")} />
        </div>

        {sp.done === "hijau" ? (
          <p className="mt-4 rounded-[8px] bg-brand-100 px-4 py-3 text-[15px] font-semibold text-brand">
            Marked as arrived.
          </p>
        ) : null}
        {sp.done === "kuning" ? (
          <p className="mt-4 rounded-[8px] bg-[var(--color-warn)]/20 px-4 py-3 text-[15px] font-semibold">
            Already scanned earlier — nothing changed.
          </p>
        ) : null}
        {sp.done === "batal" ? (
          <p className="mt-4 rounded-[8px] bg-[var(--color-warn)]/20 px-4 py-3 text-[15px] font-semibold">
            Scan reversed. They can be scanned again.
          </p>
        ) : null}
        {sp.done === "gagal" ? (
          <p
            role="alert"
            className="mt-4 rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[15px] font-semibold text-[var(--color-danger)]"
          >
            Nothing was recorded — programme not found.
          </p>
        ) : null}
        {sp.done === "merah" ? (
          <p
            role="alert"
            className="mt-4 rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[15px] font-semibold text-[var(--color-danger)]"
          >
            Nothing was recorded — that person is not registered for this programme.
          </p>
        ) : null}

        <form className="mt-5 flex gap-2" action="/assist">
          {/* A GET form drops everything not in it — including which programme. */}
          {ev ? <input type="hidden" name="acara" value={ev.slug} /> : null}
          <input
            name="q"
            defaultValue={q}
            placeholder="Name, number, or last 4 digits"
            className="field flex-1"
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-2">
          {hasil.map((p) => {
            const otsMenunggu = p.jenis === "ots" && !p.izinOtsAt;
            const perluKeputusan = p.aktif && !p.scannedAt && (otsMenunggu || p.konfirmasi === false);
            return (
              <div key={p.id} className="card flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[17px] font-semibold leading-tight">{p.nama}</div>
                  <div className="mt-1 text-[13px] text-[var(--color-ink-2)]">
                    {p.nomor} · {p.gender === "akhwat" ? "Sisters" : "Brothers"}
                    {p.statusLipia
                      ? ` · ${
                          p.statusLipia === "mahasiswa"
                            ? "Student"
                            : p.statusLipia === "khirrij"
                              ? "Graduate"
                              : "Mutarabbish"
                        }`
                      : ""}
                    {!p.aktif ? " · DEACTIVATED" : ""}
                  </div>
                  {/* The desk is where a queued walk-in or a released seat gets decided. */}
                  {perluKeputusan ? (
                    <div className="mt-1 text-[13px] font-semibold text-[var(--color-danger)]">
                      {p.konfirmasi === false
                        ? "Released their seat — check there is room before letting in"
                        : `Walk-in no. ${p.urutOts ?? "?"} — not permitted yet; letting in here counts as the permit`}
                    </div>
                  ) : null}
                  {p.jenis === "ots" && p.izinOtsAt && !p.scannedAt ? (
                    <div className="mt-1 text-[13px] font-semibold text-brand">
                      Walk-in no. {p.urutOts ?? "?"} — permitted, their QR works at the gate
                    </div>
                  ) : null}
                  {p.scannedAt ? (
                    <div className="mt-1 text-[13px] font-semibold text-[var(--color-warn)]">
                      Already scanned {formatJam(new Date(p.scannedAt), "en")}
                      {p.gate ? ` · ${p.gate}` : ""}
                    </div>
                  ) : null}
                </div>
                {p.aktif && !p.scannedAt ? (
                  <div className="flex flex-wrap gap-2">
                    <TombolTandai p={p} q={q} slug={ev.slug} kelas={perluKeputusan ? "btn btn-ghost" : "btn btn-primary"}>
                      {otsMenunggu ? "Let in · permit" : perluKeputusan ? "Let in anyway" : "Mark arrived"}
                    </TombolTandai>
                  </div>
                ) : null}
                {p.scannedAt ? (
                  /* The correction path for a scan of the wrong person's phone. */
                  <form action={batalkan}>
                    <input type="hidden" name="peserta_id" value={p.id} />
                    <input type="hidden" name="q" value={q} />
                    <input type="hidden" name="slug" value={ev.slug} />
                    <button type="submit" className="btn btn-ghost">
                      Undo scan
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}

          {q && hasil.length === 0 ? (
            <p className="rounded-[8px] bg-white px-4 py-6 text-center text-[15px] text-[var(--color-ink-2)] ring-1 ring-[var(--color-line)]">
              Nobody found. Have them register through the walk-in link:{" "}
              <code className="rounded bg-[var(--color-surface)] px-1">/ar/p/{ev.slug}/ots</code>
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );

  function TombolTandai({
    p,
    q,
    slug,
    kelas,
    children,
  }: {
    p: { id: string };
    q: string;
    slug: string;
    kelas: string;
    children: React.ReactNode;
  }) {
    return (
      <form action={tandaiHadir}>
        <input type="hidden" name="peserta_id" value={p.id} />
        <input type="hidden" name="q" value={q} />
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" className={kelas}>
          {children}
        </button>
      </form>
    );
  }
}

function Angka({ label, nilai, nada }: { label: string; nilai: string; nada?: "hijau" | "kuning" | "merah" }) {
  const warna =
    nada === "merah"
      ? "text-[var(--color-danger)]"
      : nada === "kuning"
        ? "text-[var(--color-warn)]"
        : nada === "hijau"
          ? "text-brand"
          : "";
  return (
    <div>
      <div className="text-[12px] leading-[1.3] text-[var(--color-ink-3)]">{label}</div>
      <div className={`mt-1 text-[24px] font-bold leading-none ${warna}`}>{nilai}</div>
    </div>
  );
}
