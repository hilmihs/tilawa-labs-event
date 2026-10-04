import Link from "next/link";
import { notFound } from "next/navigation";
import { FormPendaftaran } from "../register/form";
import { PageHeader } from "@/components/page-header";
import { ambilAcara } from "@/lib/acara/queries";
import { penggunaSekarang } from "@/lib/auth/akun";
import { pendaftaranAkun } from "@/lib/akun/queries";
import { signTiketToken } from "@/lib/tiket/token";
import { waAdmin } from "@/lib/acara/view-model";
import { isLang, t } from "@/lib/i18n/dict";
import { BantuanWa } from "@/components/bantuan-wa";

export const dynamic = "force-dynamic";

/**
 * The walk-in link, shared at the venue on the day. The same form as /register,
 * posted with ots=1: no seat is taken, the person gets a number in their side's
 * walk-in queue and a ticket whose QR appears once the committee permits them
 * (/panel/ots). Works only while the committee has the link open, whatever the
 * online form's status — that is the point of it.
 */
export default async function WalkIn({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  let d = t(lang);
  const ev = await ambilAcara(slug);
  if (!ev || !ev.tampil) notFound();

  const akun = await penggunaSekarang();
  if (akun) d = t(lang, akun.gender);
  // Signed in and already registered here: the ticket, not a second registration.
  const sudah = akun ? ((await pendaftaranAkun(akun.id)).find((r) => r.slug === ev.slug) ?? null) : null;
  const tokenSudah = sudah ? await signTiketToken({ pid: sudah.pesertaId, slug: ev.slug }) : null;

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={d.form.otsTitle} back={`/${lang}/p/${slug}`} />
      <div className="mx-auto w-full max-w-[520px] px-5 pt-6">
        {sudah && tokenSudah ? (
          <div className="card p-6">
            <h2 className="text-xl font-semibold">{d.sudahTerdaftar.title}</h2>
            <p className="mt-2 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">{d.sudahTerdaftar.body}</p>
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
        ) : ev.otsBuka ? (
          <>
            <div className="mb-5 rounded-[8px] border-[1.5px] border-brand bg-brand-100 px-4 py-3">
              <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-brand rtl:normal-case rtl:tracking-normal rtl:text-[13px]">
                {d.form.otsTitle}
              </div>
              <p className="mt-1 text-[14px] leading-[1.55] text-[var(--color-ink-2)]">{d.form.otsIntro}</p>
            </div>
            <FormPendaftaran
              lang={lang}
              slug={slug}
              tatibUrl={ev.tatibUrl}
              akun={akun ? { nama: akun.nama, wa: akun.wa, gender: akun.gender } : null}
              ots
            />
          </>
        ) : (
          <div className="card p-6 text-center">
            <h2 className="text-xl font-semibold">{d.errors.otsTutup}</h2>
            <p className="mt-2 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">{d.errors.otsTutupBody}</p>
            <Link href={`/${lang}/p/${slug}/ticket`} className="btn btn-ghost mt-5 w-full">
              {d.landing.findTicket}
            </Link>
          </div>
        )}
        <BantuanWa
          lang={lang}
          nomor={waAdmin(ev)}
          acara={ev.nama}
          halaman={d.bantuan.halamanDaftar}
          slug={ev.slug}
          className="mt-4"
        />
      </div>
    </main>
  );
}
