import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { LangSwitch } from "@/components/lang-switch";
import { Muncul } from "@/components/muncul";
import { daftarProgramPublik } from "@/lib/acara/queries";
import { penggunaSekarang } from "@/lib/auth/akun";
import { labelJenis, tampilanAcara } from "@/lib/acara/view-model";
import { isLang, t } from "@/lib/i18n/dict";
import { Instagram } from "@/components/instagram";

export const dynamic = "force-dynamic";

/**
 * The front door is now a list. One deployment serves every programme the
 * committee runs, and a participant picks the one they came for. Same paper and
 * ink as the programme page, so moving between the two feels like turning a page.
 */
export default async function DaftarProgram({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const program = await daftarProgramPublik();
  const akun = await penggunaSekarang();

  return (
    <main className="min-h-dvh bg-[var(--color-surface)]">
      <header className="flex h-[68px] items-center justify-between border-b-[1.5px] border-[var(--color-ink)] bg-[var(--color-surface)] px-5 md:h-[76px] md:px-12">
        <Link href={`/${lang}`} className="text-[var(--color-ink)]">
          <Logo kind="lockup" height={44} tone="dark" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={akun ? `/${lang}/akun` : `/${lang}/masuk`}
            className="text-[15px] font-semibold text-[var(--color-ink)] underline-offset-4 hover:underline"
          >
            {akun ? d.akun.akunSaya : d.akun.masuk}
          </Link>
          <LangSwitch lang={lang} />
        </div>
      </header>

      <section className="kertas border-b-[1.5px] border-[var(--color-ink)] px-6 py-12 md:px-14 md:py-16">
        <h1 className="judul max-w-[12ch] text-[clamp(36px,6vw,74px)] text-[var(--color-ink)] rtl:text-[clamp(28px,4.5vw,59px)]">
          {d.program.title}
        </h1>
        <p className="mt-5 max-w-[520px] text-[17px] font-light leading-[1.55] text-[var(--color-ink-2)]">
          {d.program.intro}
        </p>
      </section>

      <section className="px-5 py-8 md:px-12 md:py-12">
        {program.length === 0 ? (
          <p className="text-[15px] text-[var(--color-ink-2)]">{d.program.none}</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {program.map((ev, i) => {
              const v = tampilanAcara(ev, lang);
              return (
                <Muncul key={ev.slug} delay={i * 60}>
                  <Link href={`/${lang}/p/${ev.slug}`} className="card flex h-full flex-col p-6">
                    <div className="eyebrow">{labelJenis(ev.jenis, lang)}</div>
                    <h2 className="judul mt-3 text-[24px] leading-[1.05] text-[var(--color-ink)] md:text-[28px]">
                      {v.judul ?? v.nama}
                    </h2>
                    <p className="mt-3 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">
                      {v.tanggal}
                      {/* "·" beside Arabic digits reads as ٠ (zero); Arabic takes its own comma. */}
                      {v.waktu ? `${lang === "ar" ? "، " : " · "}${v.waktu}` : ""}
                    </p>
                    {v.lokasi ? (
                      <p className="mt-1 text-[14px] text-[var(--color-ink-3)]">{v.lokasi}</p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between gap-3 border-t-[1.5px] border-[var(--color-line)] pt-5">
                      <span
                        className={`inline-block border-[1.5px] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${
                          v.terbuka
                            ? "border-[var(--color-ink)] bg-brand-100 text-[var(--color-ink)]"
                            : "border-dashed border-[var(--color-ink-3)] text-[var(--color-ink-3)]"
                        }`}
                      >
                        {v.terbuka ? d.program.open : d.program.closed}
                      </span>
                      <span className="text-[14px] font-semibold text-[var(--color-ink)]">
                        {d.program.view}{" "}
                        {/* The arrow follows the reading direction, so Arabic flips it. */}
                        <span aria-hidden className="inline-block rtl:rotate-180">
                          →
                        </span>
                      </span>
                    </div>
                  </Link>
                </Muncul>
              );
            })}
          </div>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t-[1.5px] border-[var(--color-ink)] bg-[var(--color-surface)] px-5 py-7 md:px-12">
        <Logo kind="lockup" height={40} tone="dark" />
        <div className="flex items-center gap-5">
          <Instagram />
          <LangSwitch lang={lang} />
        </div>
      </footer>
    </main>
  );
}
