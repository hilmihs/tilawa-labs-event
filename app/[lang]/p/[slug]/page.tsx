import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { LangSwitch } from "@/components/lang-switch";
import { Muncul } from "@/components/muncul";
import { ambilAcara, jumlahPendaftarAktif } from "@/lib/acara/queries";
import { penggunaSekarang } from "@/lib/auth/akun";
import { pendaftaranAkun } from "@/lib/akun/queries";
import { signTiketToken } from "@/lib/tiket/token";
import { KONTAK_ADMIN_AKTIF, kuotaEfektif, tampilanAcara, waAdmin } from "@/lib/acara/view-model";
import { bagianTanggalIso, formatAngka, formatJamTampil } from "@/lib/waktu";
import { dirOf, isLang, t } from "@/lib/i18n/dict";
import { formatWaTampil, normalizePhone } from "@/lib/wa";
import { BantuanWa } from "@/components/bantuan-wa";
import { Instagram } from "@/components/instagram";
import { TataTertib } from "@/components/tata-tertib";
import { TeaserHub } from "@/components/hub/teaser-hub";
import { RakKartu } from "@/components/catatan/rak-kartu";
import { TeaserKuis } from "@/components/catatan/teaser-kuis";
import { catatanUntuk } from "@/lib/catatan/kajian";
import { mulaiSetelah, sesiTerbuka } from "@/lib/kuis/jadwal";
import { SapaanHub } from "@/components/hub/sapaan-hub";
import { SapaanInstagram } from "@/components/sapaan-instagram";
import { hubTampil } from "@/lib/pengaturan/queries";
import { minatSaya } from "@/lib/hub/queries";

export const dynamic = "force-dynamic";

/*
 * The programme name and the running order, written here rather than read from the
 * event row.
 *
 * The committee settled on two lines and wanted them up immediately; the row in the
 * database still carries the older four-line rundown, and editing it from /admin is
 * one more thing to remember on the day. When a second programme needs its own
 * order, this goes back to `ev.agenda`.
 */
const NAMA = { en: "Open Lecture", ar: "لقاء مفتوح" } as const;

const JADWAL = [
  { jam: "07:30", en: "Gate opens", ar: "فتح البوابة" },
  { jam: "09:00", en: "'Ilm session", ar: "الجلسة العلمية" },
] as const;

/*
 * The wording of poster 04, line for line. The hero is that poster on a screen, so
 * the invitation, the speaker's name as it is set there — honorific on one line,
 * name on the next, the du'a small underneath — and the closing lines are written
 * here rather than assembled from the event row, whose speaker field is one string.
 * Date, time and the venue's name still come from the row.
 */
const POSTER = {
  en: {
    undangan:
      "Tilawa Labs is pleased to invite students of the institute, brothers and sisters, to join us for an ilm session:",
    bersama: "with",
    pemateri: ["Dr. Sample", "Speaker"],
    doa: "– may Allah protect him –",
    alamat: "Demo Hall, Jakarta",
    kursi: "Limited space available",
    info: "For more info:",
    lewatWa: "(via WhatsApp)",
    penutup: "May Allah bless our gathering and grant us beneficial knowledge.",
  },
  ar: {
    undangan:
      "يسر تلاوة لابز دعوة طلاب وطالبات المعهد لحضور محاضرة علمية بعنوان:",
    bersama: "يقدمها:",
    pemateri: ["فضيلة الأستاذ", "متحدث تجريبي"],
    doa: "– حفظه الله تعالى –",
    alamat: "بالقاعة التجريبية، جاكرتا",
    kursi: "المقاعد محدودة",
    info: "لمزيد من المعلومات والاستفسارات التواصل على الرقم التالي:",
    lewatWa: "(عبر الوتساب)",
    penutup: null,
  },
} as const;

/*
 * One programme's own page — the landing page at /[lang] is the list that leads
 * here. It carries the campaign posters onto the screen: butter-cream paper,
 * forest green, ink type, and the four risograph illustrations — the open door,
 * the "why?" figure, the speech bubble and the plant. Each one keeps the line it
 * was drawn for on the poster.
 *
 * The illustrations are cut straight out of the print PDFs (public/kv), so every
 * section behind one is painted the exact cream or green the picture was printed
 * on; the edge of the image then disappears into the page.
 */
export default async function HalamanProgram({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);

  // A draft has no public page, even for someone holding the link.
  const ev = await ambilAcara(slug);
  if (!ev || !ev.tampil) notFound();

  const v = tampilanAcara(ev, lang);
  const terisi = await jumlahPendaftarAktif(ev.id);
  // The count stays private; it only decides whether the button still says "register".
  const kuota = kuotaEfektif(ev);
  const penuh = Boolean(kuota && terisi >= kuota);
  const nomorAdmin = waAdmin(ev);
  const akun = await penggunaSekarang();
  // Already registered with this account: the first button is their ticket.
  const milik = akun ? (await pendaftaranAkun(akun.id)).find((r) => r.slug === ev.slug) : undefined;
  const tokenMilik = milik ? await signTiketToken({ pid: milik.pesertaId, slug: ev.slug }) : null;
  const hub = await hubTampil();
  // Written once the lecture has been given; a programme without them shows nothing.
  const catatan = catatanUntuk(ev.slug);
  // The quiz follows the notes by a day, so the teaser only offers a link once the
  // first question has actually opened.
  const sesiKuis = catatan ? sesiTerbuka(mulaiSetelah(catatan.tanggal)) : 0;
  /*
   * The page has two modes, and the notes are what tells them apart: they are
   * written up after the lecture, so their presence means the day has passed.
   * Before that the page invites and explains how to register; after it, the
   * registration furniture — the three steps, the schedule, the map, what to bring —
   * is answering a question nobody is asking any more, and it goes.
   */
  const setelahAcara = Boolean(catatan);
  const minatClub = akun && hub ? await minatSaya(akun.id) : new Set<never>();
  // Split at the source, not out of the formatted string: Arabic uses ، not a comma.
  const { tanggal: tanggalSaja } = bagianTanggalIso(ev.tanggal, lang);
  const P = POSTER[lang];
  // The poster's contact line: the committee's number, as a tap-to-chat link.
  const waNormal = normalizePhone(nomorAdmin);
  const waTampil = waNormal ? formatWaTampil(waNormal) : nomorAdmin;

  return (
    <main className="min-h-dvh bg-[var(--color-surface)]">
      <header className="flex h-[68px] items-center justify-between border-b-[1.5px] border-[var(--color-ink)] bg-[var(--color-surface)] px-5 md:h-[76px] md:px-12">
        <div className="flex items-center gap-10">
          <Link href={`/${lang}`} className="text-[var(--color-ink)]">
            <Logo kind="lockup" height={44} tone="dark" />
          </Link>
          <nav className="hidden gap-7 text-[15px] lg:text-[17px] font-medium text-[var(--color-ink-2)] lg:flex">
            <Link href={`/${lang}/program`} className="hover:text-[var(--color-ink)]">
              {d.program.all}
            </Link>
            {hub ? (
              <Link
                href={`/${lang}/hub?src=navbar`}
                className="-my-1 inline-flex items-center gap-2 rounded-full border-[1.5px] border-brand bg-brand-100 px-3 py-1 font-semibold text-brand hover:bg-brand hover:text-[var(--color-butter)]"
              >
                {d.hub.navHub}
                <span className="rounded-full bg-brand px-1.5 py-px text-[11px] font-bold leading-[1.4] text-[var(--color-butter)]">
                  {d.hub.baru}
                </span>
              </Link>
            ) : null}
            <span className="border-b-2 border-[var(--color-ink)] pb-1 font-semibold text-[var(--color-ink)]">
              {d.nav.event}
            </span>
            {catatan ? (
              <Link
                href={`/${lang}/p/${ev.slug}/notes`}
                className="hover:text-[var(--color-ink)]"
              >
                {d.catatan.navNotes}
              </Link>
            ) : null}
            {sesiKuis >= 1 ? (
              <Link href={`/${lang}/p/${ev.slug}/quiz`} className="hover:text-[var(--color-ink)]">
                {d.kuis.judulPerjalanan}
              </Link>
            ) : null}
            {setelahAcara ? null : (
              <>
                <a href="#schedule" className="hover:text-[var(--color-ink)]">
                  {d.nav.schedule}
                </a>
                <a href="#venue" className="hover:text-[var(--color-ink)]">
                  {d.nav.venue}
                </a>
              </>
            )}
            {setelahAcara ? null : (
              <a href="#contact" className="hover:text-[var(--color-ink)]">
                {d.nav.contact}
              </a>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* No next: after signing in, the account page with "My registrations" is the useful place. */}
          <Link
            href={akun ? `/${lang}/akun` : `/${lang}/masuk`}
            className="text-[15px] lg:text-[17px] font-semibold text-[var(--color-ink)] underline-offset-4 hover:underline"
          >
            {akun ? d.akun.akunSaya : d.akun.masuk}
          </Link>
          <LangSwitch lang={lang} />
          {v.terbuka && !setelahAcara ? (
            <Link
              href={`/${lang}/p/${ev.slug}/register`}
              className="btn btn-primary hidden md:inline-flex"
            >
              {d.landing.registerNow}
            </Link>
          ) : catatan ? (
            <Link
              href={`/${lang}/p/${ev.slug}/notes`}
              className="btn btn-primary hidden md:inline-flex"
            >
              {d.catatan.baca}
            </Link>
          ) : null}
        </div>
      </header>

      {/*
        Hero: poster 04 on a screen. The text column sits on the right in both
        languages and the tree grows out of the bottom-left corner, the way the poster
        is set — so the grid is pinned left-to-right and the column takes the page's
        own direction back. Poster 04 sets its English in mixed case, unlike the
        campaign posters' caps, so the display faces here drop the uppercase. On a wide screen the hero is one full screen; on a phone
        the words come first and the tree, with the logo beside it, closes the section.
      */}
      <section className="kertas relative bg-[#f3e6ca]">
        {hub ? <SapaanHub lang={lang} /> : <SapaanInstagram lang={lang} gender={akun?.gender} />}
        <div
          dir="ltr"
          className="grid lg:min-h-[calc(100svh-76px)] lg:grid-cols-[minmax(320px,42%)_minmax(0,1fr)]"
        >
          <div
            dir={dirOf(lang)}
            className={`relative z-10 flex flex-col justify-center px-6 pb-10 pt-10 md:px-14 md:pb-12 md:pt-12 lg:order-2 ${
              lang === "en" ? "items-end text-right" : "items-start"
            }`}
          >
            <p className="max-w-[34ch] text-[17px] lg:text-[19px] leading-[1.5] text-[var(--color-ink-2)]">
              {setelahAcara ? d.landing.sudahBerlangsung : P.undangan}
            </p>
            <h1 className="judul mt-4 max-w-[15ch] text-[clamp(40px,6.6vw,88px)] campur text-[var(--color-ink)] rtl:max-w-[16ch] rtl:text-[clamp(28px,4.6vw,60px)]">
              {v.judul ?? v.nama}
            </h1>

            <p className="mt-5 text-[17px] lg:text-[19px] text-[var(--color-ink-2)]">{P.bersama}</p>
            <p className="judul mt-1 text-[clamp(26px,2.8vw,38px)] campur leading-[1.1] text-[var(--color-brand)] rtl:text-[clamp(22px,2.3vw,31px)]">
              {P.pemateri[0]}
              <br />
              {P.pemateri[1]}
            </p>
            <p className="mt-1.5 text-[14px] lg:text-[15px] text-[var(--color-ink-2)]">{P.doa}</p>

            <div className="judul mt-5 text-[clamp(22px,2.2vw,30px)] campur leading-[1.25] text-[var(--color-ink)] rtl:text-[clamp(19px,1.8vw,25px)]">
              <div>{tanggalSaja}</div>
              {/* No start time set: the line would read a bare " WIB". */}
              {v.waktu ? <div>{lang === "en" ? `${v.waktu} ${d.landing.tz}` : v.waktu}</div> : null}
            </div>
            <p className="mt-1.5 text-[16px] lg:text-[18px] leading-[1.5] text-[var(--color-ink-2)]">
              {lang === "ar" && v.waktu ? (
                <>
                  {d.landing.tz}
                  <br />
                </>
              ) : null}
              {v.lokasi ? (
                <>
                  {v.lokasi}
                  <br />
                </>
              ) : null}
              {P.alamat}
            </p>

            {setelahAcara ? null : (
              <div className="mt-5 text-[16px] lg:text-[18px] font-semibold text-[var(--color-ink)]">
                {d.landing.registration}:
              </div>
            )}
            <div className={`mt-3 flex flex-wrap gap-3 ${lang === "en" ? "justify-end" : ""}`}>
              {/*
                Once the notes exist they are what most people are arriving for, so
                they lead the row; registration keeps its own button behind them for
                as long as the door is still open.
              */}
              {catatan ? (
                <Link href={`/${lang}/p/${ev.slug}/notes`} className="btn btn-primary">
                  {d.catatan.baca}
                </Link>
              ) : null}
              {setelahAcara && sesiKuis >= 1 ? (
                <Link href={`/${lang}/p/${ev.slug}/quiz`} className="btn btn-ghost">
                  {d.kuis.lanjut.replace("{n}", formatAngka(sesiKuis, lang))}
                </Link>
              ) : null}
              {setelahAcara ? null : tokenMilik ? (
                <Link
                  href={`/${lang}/ticket/${tokenMilik}`}
                  className={`btn ${catatan ? "btn-ghost" : "btn-primary"}`}
                >
                  {d.sudahTerdaftar.cta}
                </Link>
              ) : v.terbuka && !penuh ? (
                <Link
                  href={`/${lang}/p/${ev.slug}/register`}
                  className={`btn ${catatan ? "btn-ghost" : "btn-primary"}`}
                >
                  {d.landing.registerNow}
                </Link>
              ) : v.terbuka ? (
                <span className="inline-flex h-12 items-center rounded-[6px] border-[1.5px] border-dashed border-[var(--color-ink)] px-5 text-[15px] lg:text-[17px] font-semibold text-[var(--color-ink-2)]">
                  {d.landing.full}
                </span>
              ) : (
                <span className="inline-flex h-12 items-center rounded-[6px] border-[1.5px] border-dashed border-[var(--color-ink)] px-5 text-[15px] lg:text-[17px] font-semibold text-[var(--color-ink-2)]">
                  {d.errors.tutup}
                </span>
              )}
              {setelahAcara || tokenMilik ? null : (
                <Link href={`/${lang}/p/${ev.slug}/ticket`} className="btn btn-ghost">
                  {d.landing.findTicket}
                </Link>
              )}
            </div>
            {setelahAcara ? null : (
              <p className="mt-2.5 text-[15px] lg:text-[17px] text-[var(--color-ink-2)]">{P.kursi}</p>
            )}

            {KONTAK_ADMIN_AKTIF ? (
            <p className="mt-5 max-w-[34ch] text-[15px] lg:text-[17px] leading-[1.55] text-[var(--color-ink-2)]">
              {P.info}
              <br />
              {waNormal ? (
                <a
                  href={`https://wa.me/${waNormal}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  dir="ltr"
                  className="font-semibold text-[var(--color-ink)] underline-offset-4 hover:underline"
                >
                  {waTampil}
                </a>
              ) : (
                <span dir="ltr" className="font-semibold text-[var(--color-ink)]">
                  {waTampil}
                </span>
              )}{" "}
              {P.lewatWa}
            </p>
            ) : null}
            {P.penutup && !setelahAcara ? (
              <p className="mt-4 max-w-[30ch] text-[16px] lg:text-[18px] leading-[1.5] text-[var(--color-ink-2)]">
                {P.penutup}
              </p>
            ) : null}
            <Instagram className="mt-4 text-[15px] lg:text-[16px]" />
          </div>

          {/*
            The tree grows out of the chair's shadow, bottom-left, exactly as drawn —
            never mirrored: the poster leans it towards the words on the right in both
            languages. The column is pinned to the screen while the longer text column
            scrolls past, so the tree stays in the corner of the screen as it does on
            the page. The logo stands under its lowest leaves, mark over wordmark, the
            way it does in print.
          */}
          <div className="relative lg:sticky lg:top-[76px] lg:order-1 lg:h-[calc(100svh-76px)] lg:self-start">
            {/*
              On a phone the picture sits in the flow, so the section is exactly as
              tall as the tree and no leaf is clipped; on a wide screen it is pinned to
              the bottom-left of the pinned column. The cut-out is transparent all
              round, so it needs no edge fade.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kv/pohon.webp"
              alt=""
              width={1036}
              height={1060}
              fetchPriority="high"
              decoding="async"
              className="tumbuh-dari-kursi gerak-apung-pelan pointer-events-none relative block h-[42svh] w-auto max-w-full select-none sm:h-[50svh] lg:absolute lg:bottom-0 lg:left-0 lg:h-[76svh] lg:max-w-none"
            />
            <div className="absolute bottom-6 left-6 flex flex-col items-start gap-2 md:bottom-10 md:left-10">
              <Logo kind="mark" height={46} tone="dark" decorative />
              <Logo kind="wordmark" height={38} tone="dark" title="Tilawa Labs" />
            </div>
          </div>
        </div>
      </section>

      {/*
        The lecture itself, once it has been given: eight cards on the same cream as
        the hero, then the quiz drawn from them. Both disappear entirely for
        a programme that has no notes, which is every programme before its day.
      */}
      {catatan ? (
        <>
          <RakKartu
            lang={lang}
            slug={ev.slug}
            bagian={catatan.bagian}
            teks={{
              eyebrow: d.catatan.eyebrow,
              judul: d.catatan.judul,
              bacaPenuh: d.catatan.bacaPenuh,
              sebelumnya: d.catatan.sebelumnya,
              berikutnya: d.catatan.berikutnya,
              keKartu: d.catatan.keKartu,
              alur: d.catatan.alur,
              geser: d.catatan.geser,
            }}
          />
          <TeaserKuis
            eyebrow={d.kuis.eyebrow}
            judul={d.kuis.judul}
            body={d.kuis.body}
            segera={d.kuis.segera}
            syarat={d.kuis.syarat}
            cta={
              sesiKuis <= 1
                ? d.kuis.mulai
                : d.kuis.lanjut.replace("{n}", formatAngka(sesiKuis, lang))
            }
            href={sesiKuis >= 1 ? `/${lang}/p/${ev.slug}/quiz` : null}
          />
        </>
      ) : null}

      {/* "It all starts with why": the figure on the ledge, on the poster's green. */}
      {setelahAcara ? null : (
      <section className="kertas overflow-hidden bg-[#3c5430] text-[var(--color-butter)]">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(240px,36%)]">
          <Muncul className="px-6 py-14 md:px-14 md:py-20">
            <h2 className="judul max-w-[10ch] text-[clamp(38px,6vw,84px)] rtl:text-[clamp(28px,4.5vw,59px)]">
              {d.landing.whyTitle}
            </h2>
            <div className="mt-8 max-w-[440px] text-[18px] font-light leading-[1.5] md:text-[21px]">
              {d.landing.whyLines.map((baris) => (
                <div key={baris}>{baris}</div>
              ))}
              <p className="mt-5">{d.landing.whyBody}</p>
            </div>
          </Muncul>
          {/*
            At least as tall as the picture plus its bubble: the section's height comes from
            the text beside it, and when that text is shorter than the 72svh figure the
            question-mark bubble above its head was cut off at the section's top edge.
          */}
          <div className="relative overflow-hidden md:min-h-[80svh]">
            {/*
              The cliff is cut flush at the picture's right and bottom, so it sits on
              the section's end edge and bottom, where those cuts vanish; the cliff face
              on its other side is drawn, and stays whole — no edge fade. On a phone the
              picture is in the flow, so nothing is clipped above.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kv/tanya.webp"
              alt=""
              width={651}
              height={1259}
              loading="lazy"
              decoding="async"
              className="gerak-apung-pelan pointer-events-none relative ms-auto block h-[38svh] w-auto max-w-full select-none sm:h-[46svh] md:absolute md:bottom-0 md:end-0 md:h-[72svh] md:max-w-none rtl:-scale-x-100"
            />
          </div>
        </div>
      </section>
      )}

      {/*
        How registration works, the map, the running order and what to bring. All of
        it answers a question that stops being asked the moment the day is over, so
        once the notes are up the whole block goes rather than sitting there stale.
      */}
      {setelahAcara ? null : (
        <>
        <section className="px-5 pt-12 md:px-12 md:pt-16">
          <Muncul>
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <h2 className="judul text-[clamp(30px,4.2vw,50px)]">{d.landing.howTitle}</h2>
              <p className="text-[15px] lg:text-[17px] text-[var(--color-ink-2)]">{d.landing.howNote}</p>
            </div>
          </Muncul>
          {/*
            Staggered by 90ms so the three steps arrive one after another, in the order
            they are meant to be read, instead of appearing as one block.
          */}
          <div className="card mt-6 grid overflow-hidden md:grid-cols-3">
            <Muncul>
              <Langkah n="01" title={d.landing.step1Title} body={d.landing.step1Body} />
            </Muncul>
            <Muncul
              delay={90}
              className="border-t-[1.5px] border-[var(--color-ink)] md:border-t-0 md:border-s-[1.5px]"
            >
              <Langkah n="02" title={d.landing.step2Title} body={d.landing.step2Body} />
            </Muncul>
            <Muncul
              delay={180}
              className="border-t-[1.5px] border-[var(--color-ink)] md:border-t-0 md:border-s-[1.5px]"
            >
              <Langkah n="03" title={d.landing.step3Title} body={d.landing.step3Body} />
            </Muncul>
          </div>
        </section>

        {hub ? <TeaserHub lang={lang} minat={minatClub} gender={akun?.gender} /> : null}

        {/*
          Two boxes, not three: the running order is two lines now, and a card of its
          own left a column of empty paper next to it. It sits under the venue, which
          is what someone checks in the same breath — where, and when to be there.
        */}
        <section className="grid gap-6 px-5 py-6 md:px-12 md:py-8 lg:grid-cols-2">
          <Muncul>
            <div id="venue" className="card h-full overflow-hidden">
              {/*
                A picture the committee drew of the site beats a road map here: the
                question on the morning is "which one is the north gate", not "where is
                Jakarta". So an uploaded plan wins, an embed is the fallback, and the
                placeholder only shows while neither has been set.
              */}
              {ev.petaGambarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ev.petaGambarUrl}
                  alt={d.landing.mapAlt}
                  className="h-[220px] w-full border-b-[1.5px] border-[var(--color-ink)] object-cover"
                />
              ) : ev.petaEmbedUrl ? (
                <iframe
                  src={ev.petaEmbedUrl}
                  title={d.landing.mapAlt}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[220px] w-full border-0 border-b-[1.5px] border-[var(--color-ink)]"
                />
              ) : (
                <div className="flex h-[168px] items-center justify-center border-b-[1.5px] border-[var(--color-ink)] bg-brand-100 text-xs font-bold tracking-[0.14em] lg:text-[13px] text-brand">
                  {d.landing.mapPlaceholder}
                </div>
              )}
              <div className="p-6">
                <div className="eyebrow">{d.landing.venue}</div>
                <div className="mt-3 text-[19px] lg:text-[21px] font-semibold leading-[1.35]">{v.lokasi}</div>
                <p className="mt-2 text-[15px] lg:text-[17px] leading-[1.6] text-[var(--color-ink-2)]">{v.alamat}</p>
                {v.petaUrl ? (
                  <a
                    href={v.petaUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-3.5 inline-block border-b-[1.5px] border-brand pb-0.5 text-[15px] lg:text-[17px] font-bold text-brand"
                  >
                    {d.landing.openInMaps}
                  </a>
                ) : null}

                <div id="schedule" className="mt-6 border-t-[1.5px] border-[var(--color-line)] pt-5">
                  <div className="eyebrow">{d.landing.schedule}</div>
                  <div className="mt-4 flex flex-col gap-3">
                    {JADWAL.map((baris) => (
                      <Baris
                        key={baris.jam}
                        jam={formatJamTampil(baris.jam, lang)}
                        teks={lang === "ar" ? baris.ar : baris.en}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Muncul>

          <Muncul delay={90}>
            <div id="contact" className="card h-full p-6">
              <div className="eyebrow">{d.landing.beforeYouCome}</div>
              <ul className="mt-4 flex flex-col gap-3 text-[15px] lg:text-[17px] leading-[1.6] text-[var(--color-ink-2)]">
                {d.landing.tips.map((tip) => (
                  <Poin key={tip} teks={tip} />
                ))}
              </ul>
              <div className="eyebrow mt-5">{d.landing.duringEvent}</div>
              <ul className="mt-4 flex flex-col gap-3 text-[15px] lg:text-[17px] leading-[1.6] text-[var(--color-ink-2)]">
                {d.landing.tipsDuring.map((tip) => (
                  <Poin key={tip} teks={tip} />
                ))}
              </ul>
              {/*
                The full house rules, when the committee has posted them somewhere.
                The two lists above are the short version people actually read on a
                phone; this is the document they are asked to agree to on the form.
              */}
              <TataTertib lang={lang} url={v.tatibUrl} className="mt-5" />
              <div className="mt-5 border-t-[1.5px] border-[var(--color-line)] pt-4 text-[15px] lg:text-[17px] leading-[1.6] text-[var(--color-ink-2)]">
                {/* No number to ask while the admin WhatsApp is unavailable. */}
                {KONTAK_ADMIN_AKTIF ? (
                  <>
                    {d.landing.questions}
                    <br />
                    <span className="rounded-[4px] bg-brand-200 px-1.5 py-0.5 font-semibold text-[var(--color-ink)]">
                      {nomorAdmin}
                    </span>
                  </>
                ) : null}
                {ev.penyelenggara ? (
                  <div className="mt-2 text-[13px] lg:text-[14px] text-[var(--color-ink-3)]">
                    {d.landing.organiser} {ev.penyelenggara}
                  </div>
                ) : null}
                <BantuanWa
                  lang={lang}
                  nomor={nomorAdmin}
                  acara={NAMA[lang]}
                  halaman={d.bantuan.halamanUtama}
                  slug={ev.slug}
                  className="mt-4"
                />
              </div>
            </div>
          </Muncul>
        </section>
        </>
      )}

      {/*
        The hadith in its speech bubble. The bubble is the poster's own; the words sit
        inside the ellipse, clear of the tail, at whatever size the bubble is drawn.
      */}
      <section className="kertas bg-[#3a5839] px-5 py-14 md:py-20">
        <Muncul className="relative mx-auto w-full max-w-[640px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kv/balon.webp"
            alt=""
            width={1000}
            height={929}
            loading="lazy"
            decoding="async"
            className="gerak-apung block h-auto w-full select-none"
          />
          <figure className="absolute inset-0 flex flex-col items-center justify-center px-[16%] pb-[26%] pt-[12%] text-center text-[var(--color-ink)]">
            <figcaption className="text-[clamp(13px,2.4vw,18px)] font-semibold">
              {d.landing.hadithLead}
            </figcaption>
            <blockquote className="mt-2 text-[clamp(17px,3.7vw,30px)] font-bold leading-[1.3]">
              {d.landing.hadith}
            </blockquote>
            <div className="mt-2 text-[clamp(11px,2vw,14px)] font-medium text-[var(--color-ink-2)]">
              {d.landing.hadithSource}
            </div>
          </figure>
        </Muncul>
      </section>

      {/* Footer: the plant, and the line the whole campaign is built on. */}
      <footer className="kertas overflow-hidden border-t-[1.5px] border-[var(--color-ink)] bg-[#f4e7cc]">
        <div className="grid md:grid-cols-[minmax(220px,32%)_minmax(0,1fr)]">
          <div className="relative order-2 min-h-[260px] md:order-1 md:min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kv/daun.webp"
              alt=""
              width={1000}
              height={1228}
              loading="lazy"
              decoding="async"
              className="gerak-daun pointer-events-none absolute bottom-0 start-0 h-[32svh] w-auto max-w-none select-none lg:h-[54svh]"
            />
          </div>
          <Muncul className="order-1 px-6 py-12 md:order-2 md:px-14 md:py-16">
            <h2 className="judul max-w-[12ch] whitespace-pre-line text-[clamp(34px,5vw,70px)] rtl:max-w-none rtl:text-[clamp(28px,4.1vw,55px)]">{d.landing.tagline}</h2>
            <p className="mt-6 max-w-[480px] text-[17px] lg:text-[19px] font-light leading-[1.55] text-[var(--color-ink-2)]">
              {d.landing.taglineBody}
            </p>
            <p className="mt-3 text-[15px] lg:text-[17px] font-semibold text-[var(--color-ink)]">
              {d.landing.taglineFor}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t-[1.5px] border-[var(--color-ink)] pt-6">
              <div className="flex items-center gap-4">
                <Logo kind="lockup" height={40} tone="dark" />
                <span className="text-[13px] lg:text-[14px] leading-[1.5] text-[var(--color-ink-3)]">
                  {NAMA[lang]} · {v.tanggal}
                </span>
              </div>
              <div className="flex items-center gap-5">
                <Instagram />
                <LangSwitch lang={lang} />
              </div>
            </div>
          </Muncul>
        </div>
      </footer>
    </main>
  );
}

function Poin({ teks }: { teks: string }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[9px] h-[6px] w-[6px] flex-none rounded-full bg-brand-300" />
      <span>{teks}</span>
    </li>
  );
}

function Langkah({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="h-full p-7">
      <div className="judul text-[48px] text-brand-300">{n}</div>
      <div className="mt-3.5 text-[17px] lg:text-[19px] font-semibold leading-[1.4]">{title}</div>
      <p className="mt-1.5 text-[15px] lg:text-[17px] leading-[1.6] text-[var(--color-ink-2)]">{body}</p>
    </div>
  );
}

function Baris({ jam, teks }: { jam: string; teks: string }) {
  if (!jam) return null;
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="w-[86px] flex-none whitespace-nowrap text-[15px] lg:text-[17px] font-semibold leading-[1.4] rtl:w-[76px]">
        {jam}
      </span>
      <span className="flex-1 border-b border-dotted border-[var(--color-ink-3)]" />
      <span className="text-[15px] lg:text-[17px] leading-[1.4] text-[var(--color-ink-2)]">{teks}</span>
    </div>
  );
}
