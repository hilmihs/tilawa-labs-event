import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { StaffNav } from "@/components/staff-nav";
import { PilihAcara } from "@/components/pilih-acara";
import { punyaAkses } from "@/lib/auth/sesi";
import { keGate } from "@/lib/auth/tujuan";
import { ambilAcara } from "@/lib/acara/queries";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { antreanOts, cabutIzinOts, izinkanOts, izinkanSemuaOts, type BarisOts, type SisiOts } from "@/lib/acara/ots";
import { formatAngka, formatJam } from "@/lib/waktu";
import { formatWaTampil } from "@/lib/wa";

export const dynamic = "force-dynamic";

// Module scope on purpose: the inline server actions below close over it, and an
// action may only capture serialisable values — a closure here would be sent to the
// client and refused.
function kembali(slug: string, done: string, n?: number): string {
  return `/panel/ots?acara=${encodeURIComponent(slug)}&done=${done}${n !== undefined ? `&n=${n}` : ""}`;
}

/**
 * The walk-in queues, one per side of the hall, in the order people registered
 * through the walk-in link. The committee permits from here — one row, the ticked
 * rows, or everyone still waiting on a side — while watching the seats still free.
 * A permit shows the QR on the participant's ticket and turns the gate green.
 */
export default async function PanelOts({
  searchParams,
}: {
  searchParams: Promise<{ acara?: string; done?: string; n?: string }>;
}) {
  const sp = await searchParams;
  const sesi = await punyaAkses("panitia");
  if (!sesi) redirect(keGate("/panel/ots", sp.acara));
  const ev = await acaraUntukStaf(sp.acara);
  if (!ev) return <main className="p-10">No event configured.</main>;

  const { baris, sisi } = await antreanOts(ev.id);

  async function izinkan(form: FormData) {
    "use server";
    const slug = String(form.get("slug") ?? "");
    const s = await punyaAkses("panitia");
    if (!s) redirect(keGate("/panel/ots", slug));
    const e = await ambilAcara(slug);
    if (!e) redirect(kembali(slug, "gagal"));
    const ids = form.getAll("id").map(String).filter((v) => /^[0-9a-f-]{36}$/i.test(v));
    const n = await izinkanOts(e.id, ids);
    revalidatePath("/panel/ots");
    redirect(kembali(slug, "izin", n));
  }

  async function izinkanSemua(form: FormData) {
    "use server";
    const slug = String(form.get("slug") ?? "");
    const s = await punyaAkses("panitia");
    if (!s) redirect(keGate("/panel/ots", slug));
    const e = await ambilAcara(slug);
    if (!e) redirect(kembali(slug, "gagal"));
    const g = String(form.get("gender") ?? "");
    const n = await izinkanSemuaOts(e.id, g === "ikhwan" || g === "akhwat" ? g : undefined);
    revalidatePath("/panel/ots");
    redirect(kembali(slug, "izin", n));
  }

  async function cabut(form: FormData) {
    "use server";
    const slug = String(form.get("slug") ?? "");
    const s = await punyaAkses("panitia");
    if (!s) redirect(keGate("/panel/ots", slug));
    const e = await ambilAcara(slug);
    if (!e) redirect(kembali(slug, "gagal"));
    const ok = await cabutIzinOts(e.id, String(form.get("id") ?? ""));
    revalidatePath("/panel/ots");
    redirect(kembali(slug, ok ? "cabut" : "sudah_masuk"));
  }

  const totalMenunggu = sisi.reduce((a, x) => a + x.menunggu, 0);
  const pesan =
    sp.done === "izin"
      ? `${formatAngka(Number(sp.n ?? 0), "en")} permitted. Their tickets now show the QR.`
      : sp.done === "cabut"
        ? "Permit withdrawn. Their ticket hides the QR again."
        : sp.done === "sudah_masuk"
          ? "Already through the gate — the scan stands. Use the help desk's undo if it was a mistake."
          : sp.done === "gagal"
            ? "Nothing was changed — programme not found."
            : null;

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <StaffNav
        current="ots"
        nama={sesi.nama}
        peran={sesi.peran}
        acara={ev.slug}
        pilih={<PilihAcara sekarang={ev} next="/panel/ots" />}
      />
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-5 pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight">Walk-in queue</h1>
            <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">
              Registered at the venue through the walk-in link, in order. A permit shows the QR on their ticket
              and lets the gate read it. The link is{" "}
              <code className="rounded bg-white px-1">/ar/p/{ev.slug}/ots</code>
              {ev.otsBuka ? " — open." : " — closed; open it in the programme settings."}
            </p>
          </div>
          {totalMenunggu > 0 ? (
            <form action={izinkanSemua}>
              <input type="hidden" name="slug" value={ev.slug} />
              <button type="submit" className="btn btn-primary h-10 text-[13px]">
                Permit everyone waiting ({formatAngka(totalMenunggu, "en")})
              </button>
            </form>
          ) : null}
        </div>

        {pesan ? (
          <p
            role="status"
            className={`rounded-[8px] px-4 py-3 text-[14px] font-semibold ${
              sp.done === "izin" ? "bg-brand-100 text-brand" : "bg-[var(--color-warn)]/20"
            }`}
          >
            {pesan}
          </p>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          {sisi.map((x) => (
            <Sisi
              key={x.gender}
              slug={ev.slug}
              sisi={x}
              baris={baris.filter((r) => r.gender === x.gender)}
              izinkan={izinkan}
              izinkanSemua={izinkanSemua}
              cabut={cabut}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function Sisi({
  slug,
  sisi,
  baris,
  izinkan,
  izinkanSemua,
  cabut,
}: {
  slug: string;
  sisi: SisiOts;
  baris: BarisOts[];
  izinkan: (form: FormData) => Promise<void>;
  izinkanSemua: (form: FormData) => Promise<void>;
  cabut: (form: FormData) => Promise<void>;
}) {
  const judul = sisi.gender === "akhwat" ? "Sisters" : "Brothers";
  const penuh = sisi.sisa !== null && sisi.sisa <= 0;
  const formId = `izin-${sisi.gender}`;
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-line)] px-5 py-4">
        <h2 className="text-[17px] font-semibold">{judul}</h2>
        <div className="text-[13px] text-[var(--color-ink-2)]">
          {sisi.sisa === null ? (
            "no quota set"
          ) : (
            <>
              seats free{" "}
              <b className={`tabular-nums ${penuh ? "text-[var(--color-danger)]" : "text-brand"}`}>
                {formatAngka(sisi.sisa, "en")}
              </b>{" "}
              of {formatAngka(sisi.kuota ?? 0, "en")}
            </>
          )}
          {" · "}waiting <b className="tabular-nums">{formatAngka(sisi.menunggu, "en")}</b>
          {" · "}let in <b className="tabular-nums">{formatAngka(sisi.diizinkan, "en")}</b>
          {" · "}arrived <b className="tabular-nums">{formatAngka(sisi.hadir, "en")}</b>
        </div>
      </div>

      {sisi.menunggu > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5">
          <button type="submit" form={formId} className="btn btn-primary h-9 text-[13px]">
            Permit ticked
          </button>
          <form action={izinkanSemua}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="gender" value={sisi.gender} />
            <button type="submit" className="btn btn-ghost h-9 text-[13px]">
              Permit all {judul.toLowerCase()} waiting ({formatAngka(sisi.menunggu, "en")})
            </button>
          </form>
          {penuh ? (
            <span className="text-[12px] font-semibold text-[var(--color-danger)]">
              No seat free on this side — permit only if the hall says otherwise.
            </span>
          ) : null}
        </div>
      ) : null}

      <form id={formId} action={izinkan}>
        <input type="hidden" name="slug" value={slug} />
      </form>

      <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-[14px]">
        <thead className="text-left text-[12px] text-[var(--color-ink-3)]">
          <tr>
            <th className="w-8 px-3 py-2" />
            <th className="px-2 py-2 font-medium">#</th>
            <th className="px-2 py-2 font-medium">Name</th>
            <th className="px-2 py-2 font-medium">WhatsApp</th>
            <th className="px-2 py-2 font-medium">Since</th>
            <th className="px-2 py-2 font-medium">Status</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-line)]">
          {baris.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-6 text-center text-[var(--color-ink-3)]">
                Nobody yet.
              </td>
            </tr>
          ) : (
            baris.map((r) => (
              <tr key={r.id} className={r.izinAt ? "text-[var(--color-ink-2)]" : ""}>
                <td className="px-3 py-2">
                  {!r.izinAt ? (
                    <input
                      type="checkbox"
                      name="id"
                      value={r.id}
                      form={formId}
                      aria-label={`Permit ${r.nama}`}
                      className="h-5 w-5 accent-[var(--color-brand)]"
                    />
                  ) : null}
                </td>
                <td className="px-2 py-2 font-bold tabular-nums">{r.urut ?? "—"}</td>
                <td className="px-2 py-2">
                  <div className="font-semibold text-[var(--color-ink)]">{r.nama}</div>
                  <div className="text-[12px] text-[var(--color-ink-3)]">{r.nomor}</div>
                </td>
                <td className="px-2 py-2 tabular-nums">{formatWaTampil(r.wa)}</td>
                <td className="px-2 py-2 tabular-nums">{formatJam(r.createdAt, "en")}</td>
                <td className="px-2 py-2">
                  {r.hadirAt ? (
                    <span className="font-semibold text-brand">Arrived {formatJam(r.hadirAt, "en")}</span>
                  ) : r.izinAt ? (
                    <span className="font-semibold text-brand">Let in {formatJam(r.izinAt, "en")}</span>
                  ) : (
                    <span className="font-semibold text-[var(--color-warn)]">Waiting</span>
                  )}
                </td>
                <td className="px-2 py-2 text-end">
                  {!r.izinAt ? (
                    <form action={izinkan}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="btn btn-primary h-8 px-3 text-[12px]">
                        Permit
                      </button>
                    </form>
                  ) : !r.hadirAt ? (
                    <form action={cabut}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="text-[12px] text-[var(--color-ink-3)] underline underline-offset-2">
                        Withdraw
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </section>
  );
}
