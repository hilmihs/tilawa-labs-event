import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { wajibMasuk } from "@/lib/auth/akun";
import {
  KEAHLIAN,
  PRODI,
  kodeKeahlian,
  labelGender,
  teksKeahlianLain,
} from "@/lib/acara/view-model";
import { isLang, t } from "@/lib/i18n/dict";
import { formatWaTampil } from "@/lib/wa";
import { angkaArab } from "@/lib/waktu";

export const dynamic = "force-dynamic";

/*
 * Read first, edit second. The profile is what the committee sees on the list and
 * what every later registration is filled from, so it is shown the way a card is
 * read: label, value, grouped by what they are about. The inputs live at /ubah.
 */
export default async function ProfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const p = await wajibMasuk(lang, `/${lang}/akun/profil`);
  const sp = await searchParams;
  const d = t(lang, p.gender);

  const status = {
    mahasiswa: d.form.statusMahasiswa,
    khirrij: d.form.statusKhirrij,
    mutarabbish: d.form.statusMutarabbish,
  }[p.statusLipia ?? ""];
  const mahasiswa = p.statusLipia === "mahasiswa";
  const khirrij = p.statusLipia === "khirrij";
  // The stored value is the key; the label follows the page. Anything else is shown as typed.
  const prodi = p.prodi
    ? (PRODI as readonly string[]).includes(p.prodi)
      ? d.form.prodiOpsi[p.prodi as (typeof PRODI)[number]]
      : p.prodi
    : null;
  const semester = p.semester ? (lang === "ar" ? angkaArab(p.semester) : p.semester) : null;
  const sesi = p.sesi === "pagi" ? d.form.sesiPagi : p.sesi === "sore" ? d.form.sesiSore : null;
  const tahunLulus = p.tahunLulus ? (lang === "ar" ? angkaArab(p.tahunLulus) : p.tahunLulus) : null;
  const lain = teksKeahlianLain(p.minat);
  const minat = kodeKeahlian(p.minat)
    .filter((k): k is (typeof KEAHLIAN)[number] => (KEAHLIAN as readonly string[]).includes(k))
    .map((k) => (k === "lain" && lain ? lain : d.form.keahlianOpsi[k]));

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={d.akun.profil} back={`/${lang}/akun`} />
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-4 px-5 pt-6">
        {sp.ok ? (
          <p role="status" className="rounded-[8px] bg-brand-100 px-4 py-3 text-[14px]">
            {d.akun.tersimpan}
          </p>
        ) : null}

        <section className="card p-6">
          <div className="eyebrow">{d.akun.profil}</div>
          <h1 className="mt-2 text-[26px] font-semibold leading-[1.2]">{p.nama}</h1>
          <p className="mt-1.5 text-[15px] leading-[1.5] text-[var(--color-ink-2)]">
            {[labelGender(p.gender, lang), status].filter(Boolean).join(" · ")}
          </p>
          {/* The number reads left-to-right, the line still sits where the page's text sits. */}
          <p className="mt-3 text-[15px]">
            <span dir="ltr">{formatWaTampil(p.wa)}</span>
          </p>
          <Link href={`/${lang}/akun/profil/ubah`} className="btn btn-primary mt-5 w-full sm:w-auto">
            {d.akun.ubahProfil}
          </Link>
        </section>

        <Bagian judul={d.akun.bagianStudi}>
          <Baris label={d.form.status} value={status} kosong={d.akun.belumDiisi} />
          {mahasiswa || khirrij ? (
            <Baris label={d.form.prodi} value={prodi} kosong={d.akun.belumDiisi} />
          ) : null}
          {mahasiswa ? (
            <>
              <Baris label={d.form.semester} value={semester} kosong={d.akun.belumDiisi} />
              <Baris label={d.akun.labelSesi} value={sesi} kosong={d.akun.belumDiisi} />
            </>
          ) : null}
          {khirrij ? (
            <Baris label={d.form.tahunLulus} value={tahunLulus} kosong={d.akun.belumDiisi} />
          ) : null}
        </Bagian>

        <Bagian judul={d.akun.bagianAsal}>
          <Baris label={d.akun.labelDomisili} value={p.domisili} kosong={d.akun.belumDiisi} />
          <Baris label={d.akun.labelAsalDaerah} value={p.asalDaerah} kosong={d.akun.belumDiisi} />
          <Baris label={d.akun.labelAsalSekolah} value={p.asalSekolah} kosong={d.akun.belumDiisi} />
        </Bagian>

        <Bagian judul={d.akun.bagianMinat}>
          {minat.length === 0 ? (
            <p className="px-5 py-4 text-[14px] text-[var(--color-ink-3)]">{d.akun.belumDiisi}</p>
          ) : (
            <ul className="flex flex-wrap gap-2 px-5 py-4">
              {minat.map((m) => (
                <li
                  key={m}
                  className="rounded-full bg-brand-100 px-3.5 py-1.5 text-[14px] font-medium text-brand"
                >
                  {m}
                </li>
              ))}
            </ul>
          )}
        </Bagian>

        <Bagian judul={d.akun.bagianKebutuhan}>
          <p
            className={`px-5 py-4 text-[15px] leading-[1.6] ${
              p.kebutuhanKhusus ? "" : "text-[var(--color-ink-3)]"
            }`}
          >
            {p.kebutuhanKhusus || d.akun.belumDiisi}
          </p>
        </Bagian>

        <p className="text-[13px] leading-[1.5] text-[var(--color-ink-3)]">{d.akun.waTetap}</p>
      </div>
    </main>
  );
}

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <h2 className="eyebrow border-b border-[var(--color-line)] px-5 py-3">{judul}</h2>
      {children}
    </section>
  );
}

/** One label/value row. An empty value is said, in a quieter colour, rather than left blank. */
function Baris({ label, value, kosong }: { label: string; value: string | null | undefined; kosong: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-x-4 border-t border-[var(--color-line)] px-5 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <span className="text-[13px] leading-[1.5] text-[var(--color-ink-3)]">{label}</span>
      <span className={`text-[15px] leading-[1.5] ${value ? "" : "text-[var(--color-ink-3)]"}`}>
        {value || kosong}
      </span>
    </div>
  );
}
