import Link from "next/link";
import { notFound } from "next/navigation";
import { FormPendaftaran } from "./form";
import { PageHeader } from "@/components/page-header";
import { ambilAcara } from "@/lib/acara/queries";
import { penggunaSekarang } from "@/lib/auth/akun";
import { pendaftaranAkun } from "@/lib/akun/queries";
import { signTiketToken } from "@/lib/tiket/token";
import { pintuPendaftaranTerbuka, waAdmin } from "@/lib/acara/view-model";
import { isLang, t } from "@/lib/i18n/dict";
import { BantuanWa } from "@/components/bantuan-wa";

export const dynamic = "force-dynamic";

export default async function Register({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  let d = t(lang);
  const ev = await ambilAcara(slug);
  if (!ev || !ev.tampil) notFound();

  // The door is read from status, never from comparing dates.
  const terbuka = pintuPendaftaranTerbuka(ev.status);
  const akun = await penggunaSekarang();
  if (akun) d = t(lang, akun.gender);
  /*
   * Signed in and already registered here: the ticket, not a form to fill in again.
   * A released seat still gets the form path through the ticket ("I can come after
   * all"), so it is sent there too.
   */
  const sudah = akun
    ? (await pendaftaranAkun(akun.id)).find((r) => r.slug === ev.slug) ?? null
    : null;
  const tokenSudah = sudah ? await signTiketToken({ pid: sudah.pesertaId, slug: ev.slug }) : null;

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={d.form.title} back={`/${lang}/p/${slug}`} />
      <div className="mx-auto w-full max-w-[520px] px-5 pt-6">
        {sudah && tokenSudah ? (
          <div className="card p-6">
            <h2 className="text-xl font-semibold">{d.sudahTerdaftar.title}</h2>
            <p className="mt-2 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">
              {d.sudahTerdaftar.body}
            </p>
            <div className="mt-4 rounded-[8px] bg-brand-100 p-4">
              <div className="eyebrow">{d.konfirmasi.nomor}</div>
              <div className="mt-1.5 text-2xl font-bold" dir="ltr">
                {sudah.nomor}
              </div>
            </div>
            <Link href={`/${lang}/ticket/${tokenSudah}`} className="btn btn-primary mt-4 w-full">
              {d.sudahTerdaftar.cta}
            </Link>
          </div>
        ) : terbuka ? (
          <FormPendaftaran
            lang={lang}
            slug={slug}
            tatibUrl={ev.tatibUrl}
            akun={akun ? { nama: akun.nama, wa: akun.wa, gender: akun.gender } : null}
          />
        ) : (
          <div className="card p-6 text-center">
            <h2 className="text-xl font-semibold">{d.errors.tutup}</h2>
            <p className="mt-2 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">
              {d.errors.tutupBody}
            </p>
            <Link href={`/${lang}/p/${slug}/ticket`} className="btn btn-ghost mt-5 w-full">
              {d.landing.findTicket}
            </Link>
          </div>
        )}
        {/* Kalau formulir menolak atau tersendat, laporannya satu ketukan dari sini. */}
        <BantuanWa
          lang={lang}
          nomor={waAdmin(ev)}
          acara={ev.nama}
          halaman={d.bantuan.halamanDaftar}
          slug={slug}
          className="mt-4"
        />
      </div>
    </main>
  );
}
