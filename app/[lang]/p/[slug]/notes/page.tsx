import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ambilAcara } from "@/lib/acara/queries";
import { catatanUntuk } from "@/lib/catatan/kajian";
import { mulaiSetelah, sesiTerbuka } from "@/lib/kuis/jadwal";
import { BAHASA_TAMPIL, dirTeks, type BahasaTeks, type Blok } from "@/lib/catatan/tipe";
import { isLang, t } from "@/lib/i18n/dict";
import { formatTanggalIso } from "@/lib/waktu";

export const dynamic = "force-dynamic";

/*
 * The notes in full: the contents list on the left, the article on the right.
 *
 * Indonesian, on both the English and the Arabic site: that is the language the
 * lecture was given in, and the only rendering the committee has read. See
 * lib/catatan/tipe.ts for where that is decided and how the switch comes back.
 */

function Isi({ blok, b }: { blok: Blok; b: BahasaTeks }) {
  if (blok.jenis === "tanya") {
    return (
      <div className="mt-6 rounded-[6px] border-[1.5px] border-dashed border-[var(--color-ink)] bg-[var(--color-paper)] px-5 py-4 text-[16px] leading-[1.6] text-[var(--color-ink-2)]">
        {blok.teks[b]}
      </div>
    );
  }
  if (blok.jenis === "h3") {
    return <h3 className="mt-7 text-[21px] font-bold leading-[1.25]">{blok.teks[b]}</h3>;
  }
  if (blok.jenis === "ul") {
    return (
      <ul className="mt-4 flex list-none flex-col gap-3 p-0 text-[17px] leading-[1.6]">
        {blok.butir.map((butir, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-2.5 size-1.5 flex-none rounded-[3px] bg-brand-300" />
            <span>{butir[b]}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (blok.jenis === "dalil") {
    return (
      <figure className="mt-5 rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-canvas)] px-5 py-5 md:px-6">
        <div dir="rtl" className="font-arabic text-[26px] leading-[1.7] md:text-[32px]">
          {blok.arab}
        </div>
        <figcaption className="mt-2.5 text-[15px] italic leading-[1.5] text-[var(--color-ink-2)] md:text-[16px]">
          {blok.terjemah[b]}{" "}
          <span className="font-semibold not-italic text-brand">— {blok.sumber[b]}</span>
        </figcaption>
      </figure>
    );
  }
  return <p className="mt-4 text-[17px] leading-[1.65]">{blok.teks[b]}</p>;
}

export default async function HalamanCatatan({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);

  // A draft has no public page, and a programme with no notes has no notes page.
  const ev = await ambilAcara(slug);
  if (!ev || !ev.tampil) notFound();
  const catatan = catatanUntuk(slug);
  if (!catatan) notFound();

  const b = BAHASA_TAMPIL;
  const dir = dirTeks(b);
  const tanggal = formatTanggalIso(catatan.tanggal, lang === "ar" ? "ar" : "en");
  const sesiKuis = sesiTerbuka(mulaiSetelah(catatan.tanggal));

  return (
    <main className="min-h-dvh bg-[var(--color-surface)]">
      <PageHeader lang={lang} title={d.catatan.diberikan} back={`/${lang}/p/${slug}`} />

      <div className="flex items-center justify-between gap-4 border-b-[1.5px] border-[var(--color-line)] px-5 py-3 md:px-10">
        <Link
          href={`/${lang}/p/${slug}`}
          className="text-[14px] font-semibold text-[var(--color-ink-2)] underline-offset-4 hover:underline"
        >
          {d.catatan.kembali}
        </Link>
        <span className="text-[13px] text-[var(--color-ink-3)]">{d.catatan.bahasaCatatan}</span>
      </div>

      <div className="grid gap-10 px-5 py-9 md:px-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
        {/*
          On a phone the article comes first: a reader who tapped "read the notes"
          wants the notes, not a screenful of contents. The list still earns its place
          below as an index, and it is the left column again as soon as there is room
          for two.
        */}
        <aside className="order-2 flex flex-col gap-5 lg:order-none lg:sticky lg:top-6 lg:self-start">
          <nav className="card p-5" aria-label={d.catatan.daftarIsi}>
            <div className="eyebrow">{d.catatan.daftarIsi}</div>
            <ol className="mt-3.5 flex list-none flex-col gap-0.5 p-0 text-[14.5px] leading-[1.35] text-[var(--color-ink-2)]">
              {catatan.bagian.map((bag) => (
                <li key={bag.id}>
                  <a
                    href={`#${bag.id}`}
                    className="-mx-2 flex gap-2.5 rounded-[4px] px-2 py-1.5 hover:bg-brand-100 hover:text-[var(--color-ink)]"
                  >
                    <span className="tabular-nums text-brand-300">{bag.no}</span>
                    <span dir={dir}>{bag.ringkas[b]}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-brand p-5 text-[var(--color-butter)]">
            <div className="eyebrow text-brand-200">{d.kuis.eyebrow}</div>
            <div className="mt-2 text-[16px] font-semibold leading-[1.35]">
              {sesiKuis >= 1
                ? d.kuis.labelSesi.replace("{n}", String(sesiKuis))
                : d.kuis.judul}
            </div>
            {sesiKuis >= 1 ? (
              <Link
                href={`/${lang}/p/${slug}/quiz`}
                className="mt-3 inline-flex h-10 items-center rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-butter)] px-4 text-[14px] font-bold text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)]"
              >
                {d.kuis.jawabSekarang}
              </Link>
            ) : (
              <span className="mt-3 inline-flex h-10 items-center rounded-[6px] border-[1.5px] border-dashed border-[var(--color-butter)] px-4 text-[14px] font-bold">
                {d.kuis.segera}
              </span>
            )}
          </div>

          <p className="text-[13px] leading-[1.6] text-[var(--color-ink-3)]" dir={dir}>
            {catatan.sumber[b]}
          </p>
        </aside>

        {/*
          min-w-0: the evidence table below sets a min width so its three columns stay
          readable, and without this the grid track grows to fit it and the whole page
          scrolls sideways on a phone. The table gets its own scroller instead.
        */}
        <article className="order-1 min-w-0 max-w-[680px] lg:order-none" dir={dir}>
          <div className="eyebrow" dir={dirTeks(lang === "ar" ? "ar" : "en")}>
            {d.catatan.diberikan} · {tanggal}
          </div>
          <h1 className="judul campur mt-3 text-[clamp(34px,5.2vw,56px)]">{catatan.judul[b]}</h1>
          {/*
            The Arabic title as the poster sets it. The words run right-to-left
            whatever the reader has chosen — it is the title in Arabic, not a
            translation of it — but the line itself starts on the same edge as the
            headline above it, so the two read as one title block.
          */}
          <div className="mt-3.5 text-start">
            <bdi
              dir="rtl"
              className="font-arabic text-[22px] leading-[1.6] text-[var(--color-ink-2)] md:text-[26px]"
            >
              {catatan.judulArab}
            </bdi>
          </div>
          <p className="mt-3.5 text-[17px] leading-[1.5] text-[var(--color-ink-2)]">
            {catatan.pemateri[b]} <em>{catatan.doa[b]}</em> · {catatan.acara[b]} ·{" "}
            {catatan.tempat[b]}
          </p>

          <section className="card mt-7 p-5 md:p-6">
            <div className="eyebrow">{d.catatan.ringkasanJudul}</div>
            <ol className="mt-3.5 grid list-none grid-cols-1 gap-3 p-0 text-[14.5px] leading-[1.5] text-[var(--color-ink-2)] md:grid-cols-2 md:gap-x-6">
              {catatan.ringkasan.map((r, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="flex-none font-bold tabular-nums text-brand-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{r[b]}</span>
                </li>
              ))}
            </ol>
          </section>

          {catatan.bagian.map((bag) => (
            <section key={bag.id} id={bag.id} className="scroll-mt-6 pt-10">
              <div className="eyebrow">{bag.kicker[b]}</div>
              <div className="mt-1.5 flex items-baseline gap-4">
                <span className="text-[clamp(44px,7vw,64px)] font-bold leading-[0.9] tracking-[-0.03em] text-brand-300">
                  {bag.no}
                </span>
                <h2 className="judul campur text-[clamp(24px,3.4vw,34px)] leading-[1.05]">
                  {bag.judul[b]}
                </h2>
              </div>
              {bag.isi.map((blok, i) => (
                <Isi key={i} blok={blok} b={b} />
              ))}
            </section>
          ))}

        </article>
      </div>
    </main>
  );
}
