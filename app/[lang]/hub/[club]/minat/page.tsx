import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TandaClub } from "@/components/hub/tanda-club";
import { FormJawaban } from "./form";
import { wajibMasuk } from "@/lib/auth/akun";
import { CLUB, isClub, pertanyaanClub, teksPertanyaan } from "@/lib/hub/konten";
import { jawabanSaya } from "@/lib/hub/queries";
import { isLang, t } from "@/lib/i18n/dict";
import { hubTampil } from "@/lib/pengaturan/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; club: string }> }): Promise<Metadata> {
  const { lang, club } = await params;
  if (!isLang(lang) || !isClub(club)) return {};
  return { title: `${t(lang).hub.tanyaJudul} · ${CLUB[club].nama[lang]}`, robots: { index: false } };
}

/**
 * The questions a club asks before it records interest. Only for clubs that have
 * some (PERTANYAAN_CLUB); the others record in one tap and never come here. Signing
 * in is required — the answers belong to an account — and someone who already
 * answered is sent back to the club page, where the confirmation is.
 */
export default async function MinatClubPage({ params }: { params: Promise<{ lang: string; club: string }> }) {
  const { lang, club } = await params;
  if (!isLang(lang) || !isClub(club)) notFound();
  if (!(await hubTampil())) notFound();
  const daftar = pertanyaanClub(club);
  if (!daftar.length) redirect(`/${lang}/hub/${club}`);
  const akun = await wajibMasuk(lang, `/${lang}/hub/${club}/minat`);
  if (await jawabanSaya(akun.id, club)) redirect(`/${lang}/hub/${club}`);
  const c = CLUB[club];
  const d = t(lang, akun.gender);
  const pertanyaan = daftar.map((q) => ({
    id: q.id,
    teks: teksPertanyaan(q, lang, akun.gender),
    pilihan: q.pilihan?.map((o) => ({ value: o.value, label: o.label[lang] })),
  }));

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={c.nama[lang]} back={`/${lang}/hub/${club}`} />
      <div className="mx-auto max-w-[640px] px-5 pt-8 md:px-12 md:pt-12">
        <TandaClub club={club} className="h-12 w-12 text-brand" />
        <h1 className="judul mt-4 text-[clamp(28px,4vw,44px)] leading-[1.1]">{d.hub.tanyaJudul}</h1>
        <p className="mt-2 text-[16px] leading-[1.6] text-[var(--color-ink-2)]">{d.hub.tanyaIntro}</p>
        <FormJawaban
          lang={lang}
          club={club}
          pertanyaan={pertanyaan}
          teks={{ placeholder: d.hub.tanyaPlaceholder, kirim: d.hub.tanyaKirim, wajib: d.hub.tanyaWajib, gagal: d.hub.gagal }}
        />
      </div>
    </main>
  );
}
