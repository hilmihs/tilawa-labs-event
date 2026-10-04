import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Muncul } from "@/components/muncul";
import { TandaClub } from "@/components/hub/tanda-club";
import { TombolMinat } from "@/components/hub/tombol-minat";
import { penggunaSekarang } from "@/lib/auth/akun";
import { AMBANG_JUMLAH_MINAT, CLUB, CLUB_KEYS, FEST, type MinatKey } from "@/lib/hub/konten";
import { jumlahMinatPerClub, minatSaya } from "@/lib/hub/queries";
import { isLang, t } from "@/lib/i18n/dict";
import { hubTampil } from "@/lib/pengaturan/queries";
import { formatAngka } from "@/lib/waktu";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: FEST.nama[lang],
    description: FEST.hook[lang],
    openGraph: { title: FEST.nama[lang], description: FEST.hook[lang] },
  };
}

/**
 * Tilawa Labs Fest, laid out like a club page: what it is and the button for the whole Fest
 * first, then the three competitions, each with its own smaller button. There are no dates or rules yet, so the button asks to be kept
 * posted rather than to register.
 */
export default async function FestPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ minat?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  if (!(await hubTampil())) notFound();
  const sp = await searchParams;
  const akun = await penggunaSekarang();
  const [minat, jumlah] = await Promise.all([
    akun ? minatSaya(akun.id) : Promise.resolve(new Set<MinatKey>()),
    jumlahMinatPerClub(),
  ]);
  const tercatat = minat.has("fest");
  const d = t(lang, akun?.gender);
  const n = jumlah.fest;
  const tombol = (
    <TombolMinat
      lang={lang}
      kunci="fest"
      dari={`/${lang}/hub/fest`}
      masuk={Boolean(akun)}
      minat={minat}
      baruMasuk={sp.minat}
      gender={akun?.gender}
    />
  );

  return (
    <main className={`min-h-dvh bg-[var(--color-surface)] ${tercatat ? "pb-16" : "pb-32 sm:pb-16"}`}>
      <PageHeader lang={lang} title={d.hub.judul} back={`/${lang}/hub`} />

      <section className="kertas border-b-[1.5px] border-[var(--color-ink)] bg-[var(--color-butter)] py-10 md:py-14">
        <div className="mx-auto max-w-[860px] px-5 md:px-12">
          <div className="flex items-start justify-between gap-3">
            <TandaClub club="fest" className="h-14 w-14 text-brand" />
            <span className="rounded-[5px] bg-[var(--color-ink)] px-2 py-0.5 text-[12px] font-semibold text-[var(--color-butter)]">
              {FEST.status[lang]}
            </span>
          </div>
          <h1 className="judul campur mt-4 text-[clamp(32px,5vw,60px)] leading-[1.05] rtl:text-[clamp(28px,4.2vw,50px)]">
            {FEST.nama[lang]}
          </h1>
          <p className="mt-3 text-[20px] font-semibold leading-[1.4] text-brand lg:text-[23px]">{FEST.hook[lang]}</p>
          <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.6] text-[var(--color-ink-2)] lg:text-[18px]">
            {FEST.ringkas[lang]}
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {FEST.chips.map((chip) => (
              <li key={chip.en} className="rounded-[5px] bg-brand-100 px-2 py-1 text-[13px] font-medium text-brand">
                {chip[lang]}
              </li>
            ))}
          </ul>
          <div className="mt-6">{tombol}</div>
          {n >= AMBANG_JUMLAH_MINAT ? (
            <p className="mt-3 text-[14px] text-[var(--color-ink-2)]">
              {d.hub.jumlah.replace("{n}", formatAngka(n, lang))}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto flex max-w-[860px] flex-col gap-10 px-5 pt-10 md:px-12">
        <section>
          <Muncul>
            <h2 className="judul text-[clamp(24px,3vw,36px)]">{d.hub.festLomba}</h2>
          </Muncul>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {FEST.lomba.map((l, i) => (
              <Muncul key={l.key} delay={i * 90}>
                <article id={l.key} className="card flex h-full scroll-mt-6 flex-col p-5">
                  <div className="judul text-[32px] text-brand-300">{formatAngka(i + 1, lang)}</div>
                  <h3 className="mt-2 text-[17px] font-semibold leading-[1.35]">{l.nama[lang]}</h3>
                  <p className="mt-1.5 text-[15px] leading-[1.55] text-[var(--color-ink-2)]">{l.teks[lang]}</p>
                  {l.catatan ? (
                    <p className="mt-3 border-t-[1.5px] border-[var(--color-line)] pt-3 text-[14px] font-medium leading-[1.5]">
                      {l.catatan[lang]}
                    </p>
                  ) : null}
                  {/* One competition only: for someone who knows which stage is theirs. */}
                  <TombolMinat
                    lang={lang}
                    kunci={l.key}
                    dari={`/${lang}/hub/fest#${l.key}`}
                    masuk={Boolean(akun)}
                    minat={minat}
                    baruMasuk={sp.minat}
                    gender={akun?.gender}
                    ringkas
                    className="mt-auto pt-4"
                  />
                </article>
              </Muncul>
            ))}
          </div>
        </section>


        <nav className="flex flex-wrap gap-2">
          {CLUB_KEYS.map((k) => (
            <Link key={k} href={`/${lang}/hub/${k}`} className="btn btn-ghost h-10 text-[14px]">
              {CLUB[k].nama[lang]}
            </Link>
          ))}
        </nav>
      </div>

      {!tercatat ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t-[1.5px] border-[var(--color-ink)] bg-[var(--color-surface)] px-5 py-3 sm:hidden">
          {tombol}
        </div>
      ) : null}
    </main>
  );
}
