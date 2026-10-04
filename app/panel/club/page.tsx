import { redirect } from "next/navigation";
import { StaffNav } from "@/components/staff-nav";
import { punyaAkses } from "@/lib/auth/sesi";
import { MINAT_KEYS, bacaJawaban, isLomba, isMinat, namaMinat } from "@/lib/hub/konten";
import { semuaMinat } from "@/lib/hub/queries";
import { corongHub } from "@/lib/trafik/queries";
import { hitungRekap } from "@/lib/hub/rekap";
import { formatAngka, formatTanggal } from "@/lib/waktu";

export const dynamic = "force-dynamic";

/**
 * Who has raised a hand for each Tilawa Labs club, before any group exists. The counts are
 * split brothers/sisters because the groups will be; the list under them is what the
 * committee messages once a group opens.
 */
const RENTANG = { "7": 7, "30": 30, semua: null } as const;
type Rentang = keyof typeof RENTANG;

export default async function PanelClub({ searchParams }: { searchParams: Promise<{ club?: string; r?: string }> }) {
  const sesi = await punyaAkses("panitia");
  if (!sesi) redirect("/gate?next=%2Fpanel%2Fclub");
  const sp = await searchParams;
  const pilih = isMinat(sp.club) ? sp.club : null;
  const rentang: Rentang = sp.r === "7" || sp.r === "semua" ? sp.r : "30";
  const hari = RENTANG[rentang];
  const sejak = hari ? new Date(Date.now() - hari * 86_400_000) : new Date(0);

  const [semua, corong] = await Promise.all([semuaMinat(), corongHub(sejak)]);
  const baruDalamRentang = (k: string) => semua.filter((r) => r.club === k && !r.batalAt && r.createdAt >= sejak).length;
  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const gabung = { club: pilih, r: rentang === "30" ? null : rentang, ...patch };
    for (const [k, v] of Object.entries(gabung)) if (v) p.set(k, v);
    const q = p.toString();
    return `/panel/club${q ? `?${q}` : ""}`;
  };
  const rekap = hitungRekap(semua);
  const baris = semua.filter((r) => !r.batalAt && (!pilih || r.club === pilih));

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <StaffNav current="club" nama={sesi.nama} />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-5 pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight">Programme Hub · clubs &amp; Fest interest</h1>
            <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">
              Accounts that asked to be kept posted. Message them on WhatsApp or email when there is news.
            </p>
          </div>
          <a href="/api/export/club" className="btn btn-ghost h-10 text-[13px]">
            Download CSV
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {MINAT_KEYS.map((k) => {
            const a = rekap[k];
            return (
              <a
                key={k}
                href={qs({ club: pilih === k ? null : k })}
                className={`card block p-5 hover:bg-white ${pilih === k ? "outline outline-2 outline-brand" : ""}`}
              >
                <div className="text-[13px] text-[var(--color-ink-3)]">{namaMinat(k, "en")}</div>
                <div className="mt-2 text-[32px] font-bold leading-none tabular-nums">{formatAngka(a.total, "en")}</div>
                <div className="mt-2 text-[13px] text-[var(--color-ink-2)]">
                  Brothers {formatAngka(a.ikhwan, "en")} · Sisters {formatAngka(a.akhwat, "en")}
                  {a.batal ? ` · ${formatAngka(a.batal, "en")} withdrew` : ""}
                </div>
              </a>
            );
          })}
        </div>

        {/* ---- Traffic: who looked, who tapped, who ended up on the list ---- */}
        <section className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-semibold">Traffic &amp; conversion</h2>
              <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">
                Visitors are per day (one browser, one day). Taps include guests sent to sign in. &ldquo;Joined&rdquo; counts
                accounts recorded in the period.
              </p>
            </div>
            <div className="flex gap-2">
              {(["7", "30", "semua"] as const).map((r) => (
                <a
                  key={r}
                  href={qs({ r: r === "30" ? null : r })}
                  className={`rounded-[8px] border px-3 py-1.5 text-[13px] font-medium ${
                    rentang === r
                      ? "border-brand bg-brand-100 font-semibold text-brand"
                      : "border-[var(--color-line)] bg-white text-[var(--color-ink-2)]"
                  }`}
                >
                  {r === "semua" ? "All time" : `Last ${r} days`}
                </a>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[14px] text-[var(--color-ink-2)]">
            Home page (where the teaser sits): <b className="tabular-nums">{formatAngka(corong.beranda, "en")}</b> visitors ·
            /hub index: <b className="tabular-nums">{formatAngka(corong.lihat.index ?? 0, "en")}</b>{" "}
            visitors
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-[14px]">
              <thead className="border-b border-[var(--color-line)] text-left text-[12px] text-[var(--color-ink-3)]">
                <tr>
                  <th className="py-2 pe-4 font-medium">Button</th>
                  <th className="py-2 pe-4 font-medium">Opened its page</th>
                  <th className="py-2 pe-4 font-medium">Tapped</th>
                  <th className="py-2 pe-4 font-medium">Joined</th>
                  <th className="py-2 font-medium">Tap → joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)] tabular-nums">
                {MINAT_KEYS.map((k) => {
                  // A competition's button sits on the Tilawa Labs Fest page.
                  const halaman = isLomba(k) ? "fest" : k;
                  const lihat = corong.lihat[halaman] ?? 0;
                  const ketuk = corong.ketuk[k] ?? 0;
                  const gabung = baruDalamRentang(k);
                  return (
                    <tr key={k}>
                      <td className="py-2 pe-4">{namaMinat(k, "en")}</td>
                      <td className="py-2 pe-4">{formatAngka(lihat, "en")}</td>
                      <td className="py-2 pe-4">
                        {formatAngka(ketuk, "en")}
                        <span className="text-[var(--color-ink-3)]">{lihat ? ` · ${Math.round((ketuk / lihat) * 100)}%` : ""}</span>
                      </td>
                      <td className="py-2 pe-4">{formatAngka(gabung, "en")}</td>
                      <td className="py-2">
                        {ketuk ? `${Math.min(100, Math.round((gabung / ketuk) * 100))}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {corong.sumber.length ? (
            <p className="mt-3 text-[13px] text-[var(--color-ink-2)]">
              Hub visitors came from (banner / navbar = the links at the top of the home page):{" "}
              {corong.sumber
                .map((x) => `${x.kunci} ${formatAngka(x.n, "en")}`)
                .join(" · ")}
            </p>
          ) : null}
        </section>

        <section className="card overflow-x-auto p-0">
          <table className="w-full min-w-[1000px] text-[14px]">
            <thead className="border-b border-[var(--color-line)] text-left text-[12px] text-[var(--color-ink-3)]">
              <tr>
                <th className="px-4 py-2 font-medium">Club</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Side</th>
                <th className="px-4 py-2 font-medium">WhatsApp</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Study</th>
                <th className="px-4 py-2 font-medium">Answers</th>
                <th className="px-4 py-2 font-medium">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {baris.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-[var(--color-ink-3)]">
                    Nobody yet.
                  </td>
                </tr>
              ) : (
                baris.map((r) => (
                  <tr key={`${r.club}-${r.wa}`}>
                    <td className="px-4 py-2">{isMinat(r.club) ? namaMinat(r.club, "en") : r.club}</td>
                    <td className="px-4 py-2 font-medium">{r.nama}</td>
                    <td className="px-4 py-2">{r.gender === "akhwat" ? "Sister" : "Brother"}</td>
                    <td className="px-4 py-2 tabular-nums">{r.wa}</td>
                    <td className="px-4 py-2">{r.email}</td>
                    <td className="px-4 py-2 text-[var(--color-ink-2)]">
                      {[r.statusLipia, r.prodi, r.semester && `sem. ${r.semester}`].filter(Boolean).join(" · ")}
                    </td>
                    <td className="max-w-[360px] px-4 py-2 text-[13px] text-[var(--color-ink-2)]">
                      {bacaJawaban(r.club, r.jawaban).map(({ q, a }) => (
                        <div key={q.id} className="mt-1 first:mt-0">
                          <span className="text-[var(--color-ink-3)]">{q.teks.en}</span>{" "}
                          <span dir="auto" className="font-medium text-[var(--color-ink)]">
                            {a}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-2 text-[var(--color-ink-2)]">{formatTanggal(r.createdAt, "en")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
