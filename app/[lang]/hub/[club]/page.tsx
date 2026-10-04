import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Muncul } from "@/components/muncul";
import { TandaClub } from "@/components/hub/tanda-club";
import { TombolMinat } from "@/components/hub/tombol-minat";
import { penggunaSekarang } from "@/lib/auth/akun";
import { AMBANG_JUMLAH_MINAT, CLUB, CLUB_KEYS, isClub, type MinatKey } from "@/lib/hub/konten";
import { jumlahMinatPerClub, minatSaya } from "@/lib/hub/queries";
import { isLang, t } from "@/lib/i18n/dict";
import { hubTampil } from "@/lib/pengaturan/queries";
import { formatAngka } from "@/lib/waktu";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; club: string }>;
}): Promise<Metadata> {
  const { lang, club } = await params;
  if (!isLang(lang) || !isClub(club)) return {};
  const c = CLUB[club];
  // The preview WhatsApp draws when this link is shared: name and hook, nothing longer.
  return { title: c.nama[lang], description: c.hook[lang], openGraph: { title: c.nama[lang], description: c.hook[lang] } };
}

/**
 * One club, read top to bottom in the order someone decides: what it is and the
 * button (above the fold), what they get, what a session looks like, a few
 * activities. The long background is folded away at the end; on a phone the button
 * stays on screen instead of being repeated.
 */
export default async function ClubPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; club: string }>;
  searchParams: Promise<{ minat?: string }>;
}) {
  const { lang, club } = await params;
  if (!isLang(lang) || !isClub(club)) notFound();
  if (!(await hubTampil())) notFound();
  const sp = await searchParams;
  const c = CLUB[club];
  const akun = await penggunaSekarang();
  const [minat, jumlah] = await Promise.all([
    akun ? minatSaya(akun.id) : Promise.resolve(new Set<MinatKey>()),
    jumlahMinatPerClub(),
  ]);
  const tercatat = minat.has(club);
  const d = t(lang, akun?.gender);
  const n = jumlah[club];
  const tombol = (
    <TombolMinat
      lang={lang}
      kunci={club}
      dari={`/${lang}/hub/${club}`}
      masuk={Boolean(akun)}
      minat={minat}
      baruMasuk={sp.minat}
      gender={akun?.gender}
    />
  );

  return (
    <main className={`min-h-dvh bg-[var(--color-surface)] ${tercatat ? "pb-16" : "pb-32 sm:pb-16"}`}>
      <PageHeader lang={lang} title={d.hub.judul} back={`/${lang}/hub`} />

      <section className="kertas border-b-[1.5px] border-[var(--color-ink)] bg-[#f3e6ca] py-10 md:py-14">
        <div className="mx-auto max-w-[860px] px-5 md:px-12">
          <TandaClub club={club} className="h-14 w-14 text-brand" />
          <h1 className="judul campur mt-4 text-[clamp(32px,5vw,60px)] leading-[1.05] rtl:text-[clamp(28px,4.2vw,50px)]">
            {c.nama[lang]}
          </h1>
          <p className="mt-3 text-[20px] font-semibold leading-[1.4] text-brand lg:text-[23px]">{c.hook[lang]}</p>
          <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.6] text-[var(--color-ink-2)] lg:text-[18px]">
            {c.ringkas[lang]}
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {c.chips.map((chip) => (
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
            <h2 className="judul text-[clamp(24px,3vw,36px)]">{d.hub.manfaat}</h2>
          </Muncul>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {c.manfaat.map((m, i) => (
              <Muncul key={m.judul.en} delay={i * 90}>
                <div className="card h-full p-5">
                  <div className="judul text-[32px] text-brand-300">{formatAngka(i + 1, lang)}</div>
                  <h3 className="mt-2 text-[17px] font-semibold leading-[1.35]">{m.judul[lang]}</h3>
                  <p className="mt-1.5 text-[15px] leading-[1.55] text-[var(--color-ink-2)]">{m.teks[lang]}</p>
                </div>
              </Muncul>
            ))}
          </div>
        </section>

        <section>
          <Muncul>
            <h2 className="judul text-[clamp(24px,3vw,36px)]">{c.sesi.judul[lang]}</h2>
          </Muncul>
          <ol className="card mt-4 divide-y-[1.5px] divide-[var(--color-line)]">
            {c.sesi.langkah.map((l) => (
              <li key={l.label.en} className="flex flex-col gap-1 p-5 sm:flex-row sm:gap-5">
                <div className="flex-none sm:w-[150px]">
                  <div className="font-semibold">{l.label[lang]}</div>
                  {l.waktu ? <div className="text-[13px] text-[var(--color-ink-3)]">{l.waktu[lang]}</div> : null}
                </div>
                <p className="text-[15px] leading-[1.55] text-[var(--color-ink-2)] lg:text-[16px]">{l.teks[lang]}</p>
              </li>
            ))}
          </ol>
        </section>

        {c.aktivitas.length ? (
          <section>
            <Muncul>
              <h2 className="judul text-[clamp(24px,3vw,36px)]">{d.hub.aktivitas}</h2>
            </Muncul>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {c.aktivitas.map((a) => (
                <div key={a.nama.en} className="rounded-[6px] bg-[var(--color-butter)] p-5">
                  <h3 className="font-semibold">{a.nama[lang]}</h3>
                  <p className="mt-1 text-[15px] leading-[1.55] text-[var(--color-ink-2)]">{a.teks[lang]}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}


        {c.selengkapnya.length ? (
          <details className="card group p-5">
            <summary className="cursor-pointer list-none font-semibold text-brand">
              <span className="inline-block transition-transform group-open:rotate-90 rtl:group-open:-rotate-90" aria-hidden>
                ›
              </span>{" "}
              {d.hub.selengkapnya}
            </summary>
            <div className="mt-4 flex flex-col gap-4">
              {c.selengkapnya.map((s) => (
                <div key={s.judul.en}>
                  <h3 className="font-semibold">{s.judul[lang]}</h3>
                  <p className="mt-1 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">{s.teks[lang]}</p>
                </div>
              ))}
            </div>
          </details>
        ) : null}


        <nav className="flex flex-wrap gap-2">
          {CLUB_KEYS.filter((k) => k !== club).map((k) => (
            <Link key={k} href={`/${lang}/hub/${k}`} className="btn btn-ghost h-10 text-[14px]">
              {CLUB[k].nama[lang]}
            </Link>
          ))}
          <Link href={`/${lang}/hub/fest`} className="btn btn-ghost h-10 text-[14px]">
            {d.hub.festLihat}
          </Link>
        </nav>
      </div>

      {/*
        On a phone the hero button scrolls away within a thumb-flick, and the benefits
        are exactly where someone makes up their mind. So until they are on the list,
        the button stays at the bottom of the screen.
      */}
      {!tercatat ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t-[1.5px] border-[var(--color-ink)] bg-[var(--color-surface)] px-5 py-3 sm:hidden">
          {tombol}
        </div>
      ) : null}
    </main>
  );
}
