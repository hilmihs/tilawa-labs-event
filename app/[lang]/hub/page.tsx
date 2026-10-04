import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Muncul } from "@/components/muncul";
import { KartuClub } from "@/components/hub/kartu-club";
import { penggunaSekarang } from "@/lib/auth/akun";
import { PINTU_KEYS, adaMinatFest, type MinatKey } from "@/lib/hub/konten";
import { minatSaya } from "@/lib/hub/queries";
import { isLang, t } from "@/lib/i18n/dict";
import { hubTampil } from "@/lib/pengaturan/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = t(lang);
  return { title: d.hub.judul, description: d.hub.intro };
}

/** The three clubs and Tilawa Labs Fest side by side. */
export default async function HubPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  if (!(await hubTampil())) notFound();
  const akun = await penggunaSekarang();
  const minat = akun ? await minatSaya(akun.id) : new Set<MinatKey>();
  const d = t(lang, akun?.gender);

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={d.hub.judul} back={`/${lang}`} />

      <section className="kertas border-b-[1.5px] border-[var(--color-ink)] bg-[#f3e6ca] py-10 md:py-14">
        <div className="mx-auto max-w-[1100px] px-5 md:px-12">
          <h1 className="judul text-[clamp(34px,5vw,64px)]">{d.hub.teaserJudul}</h1>
          <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.55] text-[var(--color-ink-2)] lg:text-[19px]">
            {d.hub.intro}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-5 pt-8 md:px-12">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PINTU_KEYS.map((k, i) => (
            <Muncul key={k} delay={i * 90}>
              <KartuClub lang={lang} club={k} tercatat={k === "fest" ? adaMinatFest(minat) : minat.has(k)} gender={akun?.gender} />
            </Muncul>
          ))}
        </div>

      </div>
    </main>
  );
}
