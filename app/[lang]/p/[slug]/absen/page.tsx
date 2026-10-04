import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormAbsen } from "./form";
import { ambilAcara } from "@/lib/acara/queries";
import { pesertaDariAkun } from "@/lib/absen/queries";
import { penggunaSekarang } from "@/lib/auth/akun";
import { BAHASA_TAMPIL, catatanUntuk, dirTeks } from "@/lib/catatan/kajian";
import { isLang, t } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

/**
 * The no-show page: a gift first, then thirty seconds of questions, one at a time.
 *
 * One link for the whole programme, sent in the committee's email and WhatsApp, so
 * the page usually knows nothing about the reader until they type their number on
 * the last screen. That is why the Arabic is written to be gender-neutral: there is
 * no one to address yet. A reader signed in to their Tilawa Labs account is the exception —
 * their registration for this programme is found from the session, the number is
 * not asked for, and the greeting may use their first name (it is their own session,
 * so nothing leaks). The action re-reads the session itself.
 */
export default async function HalamanAbsen({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();

  const ev = await ambilAcara(slug);
  if (!ev || !ev.tampil) notFound();
  if (ev.status !== "selesai") redirect(`/${lang}/p/${slug}`);

  const d = t(lang).absen;
  // The gift: the notes' summary, shown in place once the form is sent. Public data —
  // the notes page itself is public — so it can travel with the page.
  const catatan = catatanUntuk(ev.slug);
  const hadiah = catatan
    ? {
        href: `/${lang}/p/${ev.slug}/notes`,
        ringkasan: catatan.ringkasan.map((r) => r[BAHASA_TAMPIL]),
        dir: dirTeks(BAHASA_TAMPIL),
        bahasa: BAHASA_TAMPIL,
      }
    : null;
  const judul = (lang === "ar" ? ev.judulAr || ev.namaAr : ev.judul) || ev.judul || ev.nama;

  const akun = await penggunaSekarang();
  const peserta = akun ? await pesertaDariAkun(ev.id, akun.id) : null;
  const namaDepan = peserta ? (peserta.nama.trim().split(/\s+/)[0] ?? null) : null;

  return (
    <main className="min-h-dvh overflow-x-clip bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={hadiah ? d.judul : d.judulTanpaCatatan} back={`/${lang}/p/${slug}`} />
      <div className="mx-auto w-full max-w-[480px] px-4 pt-5">
        <FormAbsen
          lang={lang}
          slug={ev.slug}
          judul={judul}
          hadiah={hadiah}
          dikenali={Boolean(peserta)}
          namaDepan={namaDepan}
        />
      </div>
    </main>
  );
}
