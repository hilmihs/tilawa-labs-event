import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { keluar } from "./actions";
import { IngatVerifikasi } from "@/components/ingat-verifikasi";
import { TombolGrupWa } from "@/components/tombol-grup-wa";
import { wajibMasuk } from "@/lib/auth/akun";
import { daftarWaGrup, labelGender } from "@/lib/acara/view-model";
import { formatWaTampil } from "@/lib/wa";
import { formatTanggalIso } from "@/lib/waktu";
import { pendaftaranAkun } from "@/lib/akun/queries";
import { signTiketToken } from "@/lib/tiket/token";
import { isLang, t } from "@/lib/i18n/dict";
import { MINAT_KEYS, halamanMinat, namaMinat } from "@/lib/hub/konten";
import { minatSaya } from "@/lib/hub/queries";
import { hubTampil } from "@/lib/pengaturan/queries";

export const dynamic = "force-dynamic";

export default async function AkunPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const p = await wajibMasuk(lang, `/${lang}/akun`);
  const sp = await searchParams;
  const d = t(lang, p.gender);
  const pesanOk = sp.ok === "password" ? d.akun.passwordDiganti : null;
  const daftar = await Promise.all(
    (await pendaftaranAkun(p.id)).map(async (r) => ({
      ...r,
      token: await signTiketToken({ pid: r.pesertaId, slug: r.slug }),
    })),
  );
  const hub = await hubTampil();
  const minat = hub ? await minatSaya(p.id) : new Set<never>();
  const status = (r: (typeof daftar)[number]) => {
    if (r.hadirAt) return { label: d.akun.statusHadir, kelas: "bg-brand text-[var(--color-butter)]" };
    if (r.konfirmasi === false) return { label: d.akun.statusLepas, kelas: "bg-[var(--color-ink-2)] text-white" };
    if (r.jenis === "ots" && !r.izinOtsAt) return { label: d.akun.statusOtsTunggu, kelas: "bg-[var(--color-warn)]/30" };
    if (r.jenis === "ots") return { label: d.akun.statusOts, kelas: "bg-brand-100 text-brand" };
    return { label: d.akun.statusKursi, kelas: "bg-brand-100 text-brand" };
  };

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={d.akun.judulAkun} back={`/${lang}`} tautanAkun={false} />
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-4 px-5 pt-6">
        {pesanOk ? (
          <p role="status" className="rounded-[8px] bg-brand-100 px-4 py-3 text-[14px]">
            {pesanOk}
          </p>
        ) : null}

        {p.email && !p.emailTerverifikasiAt ? (
          <IngatVerifikasi lang={lang} gender={p.gender} email={p.email} sudahMasuk />
        ) : null}

        <section className="card p-6">
          <h1 className="text-xl font-semibold">{d.akun.halo.replace("{nama}", p.nama)}</h1>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
            <dt className="text-[var(--color-ink-3)]">{d.akun.wa}</dt>
            <dd dir="ltr" className="text-start">
              {formatWaTampil(p.wa)}
            </dd>
            <dt className="text-[var(--color-ink-3)]">{d.akun.email}</dt>
            <dd dir="ltr" className="text-start">
              {p.email}{" "}
              <span className="text-[13px] text-[var(--color-ink-3)]">
                · {p.emailTerverifikasiAt ? d.akun.emailSudah : d.akun.emailBelum}
              </span>
            </dd>
            <dt className="text-[var(--color-ink-3)]">{d.form.gender}</dt>
            <dd>{labelGender(p.gender, lang)}</dd>
          </dl>
        </section>

        <nav className="grid gap-3 sm:grid-cols-2">
          <Link href={`/${lang}/akun/profil`} className="card p-5 font-semibold">
            {d.akun.profil}
          </Link>
          <Link href={`/${lang}/akun/keamanan`} className="card p-5 font-semibold">
            {d.akun.keamanan}
          </Link>
        </nav>

        {/*
          The ticket link is the thing people lose. Signed in, they should never need
          the number-and-name lookup to get back to it.
        */}
        <section className="card p-5">
          <h2 className="text-[17px] font-semibold">{d.akun.pendaftaranSaya}</h2>
          {daftar.length === 0 ? (
            <div className="mt-2">
              <p className="text-[14px] text-[var(--color-ink-3)]">{d.akun.pendaftaranNanti}</p>
              <Link href={`/${lang}/program`} className="mt-3 inline-block text-[14px] font-semibold text-brand underline">
                {d.akun.lihatProgram}
              </Link>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-[var(--color-line)]">
              {daftar.map((r) => (
                <li key={r.pesertaId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="font-semibold leading-[1.35]">
                      {(lang === "ar" ? r.namaAr : r.nama) || r.nama}
                    </div>
                    <div className="mt-1 text-[13px] text-[var(--color-ink-2)]">
                      {formatTanggalIso(r.tanggal, lang)}{lang === "ar" ? "، " : " · "}<span dir="ltr">{r.nomor}</span>
                    </div>
                    <span
                      className={`mt-1.5 inline-block rounded-[5px] px-2 py-0.5 text-[12px] font-semibold ${status(r).kelas}`}
                    >
                      {status(r).label}
                    </span>
                  </div>
                  {r.pakaiTiket ? (
                    <Link href={`/${lang}/ticket/${r.token}`} className="btn btn-ghost h-10 text-[14px]">
                      {d.akun.bukaTiket}
                    </Link>
                  ) : null}
                  {/*
                    Always here, not only before the QR: a group gets restricted or fills
                    up, the committee posts a new link, and this is where people find it.
                  */}
                  {r.status !== "selesai" && r.status !== "batal" && r.konfirmasi !== false ? (
                    <TombolGrupWa
                      lang={lang}
                      gender={r.gender}
                      grup={daftarWaGrup(r, r.gender)}
                      className="w-full basis-full"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/*
          The clubs someone raised a hand for, so they can see it stuck — and the ones
          they have not, one tap from a look inside.
        */}
        {hub ? (
        <section className="card p-5">
          <h2 className="text-[17px] font-semibold">{d.hub.akunJudul}</h2>
          {minat.size === 0 ? <p className="mt-1 text-[14px] text-[var(--color-ink-3)]">{d.hub.akunKosong}</p> : null}
          <ul className="mt-3 flex flex-col divide-y divide-[var(--color-line)]">
            {MINAT_KEYS.map((k) => (
              <li key={k}>
                <Link href={halamanMinat(lang, k)} className="flex items-center justify-between gap-3 py-3">
                  <span className="font-semibold leading-[1.35]">{namaMinat(k, lang)}</span>
                  {minat.has(k) ? (
                    <span className="flex-none rounded-[5px] bg-brand-100 px-2 py-0.5 text-[12px] font-semibold text-brand">
                      ✓ {d.hub.tercatat}
                    </span>
                  ) : (
                    <span className="flex-none text-[14px] font-semibold text-brand">{d.hub.lihat}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        ) : null}

        <form action={keluar}>
          <input type="hidden" name="lang" value={lang} />
          <button type="submit" className="btn btn-ghost w-full">
            {d.akun.keluar}
          </button>
        </form>
      </div>
    </main>
  );
}
