import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { PageHeader } from "@/components/page-header";
import { wajibMasuk } from "@/lib/auth/akun";
import { BAHASA_TAMPIL } from "@/lib/catatan/tipe";
import { isLang, t } from "@/lib/i18n/dict";
import { konteksKuis } from "@/lib/kuis/konteks";
import { JUMLAH_SESI, tanggalSesi } from "@/lib/kuis/jadwal";
import { nomorTampil } from "@/lib/kuis/nomor";
import { jawabanSaya, nomorPeserta } from "@/lib/kuis/queries";
import { skor, streakTerpanjang } from "@/lib/kuis/skor";
import { JUMLAH_SOAL } from "@/lib/kuis/soal";
import { formatAngka, formatTanggalIso } from "@/lib/waktu";

export const dynamic = "force-dynamic";

/*
 * The certificate: A5 landscape, printed from the browser.
 *
 * No image generation and no PDF library. The sheet is the page, `@media print` in
 * globals.css already strips the furniture, and "print" on a phone offers "save as
 * PDF" — which is the file people actually wanted. It also means the certificate is
 * set in the real typefaces rather than in whatever a canvas renderer has.
 *
 * It needs an account, because it has a name on it, and it only appears once every
 * batch has passed: a certificate for finishing something still running is not a
 * certificate.
 */
export default async function HalamanSertifikat({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const { catatan, mulai, sesi } = await konteksKuis(slug);
  const b = BAHASA_TAMPIL;
  const jalur = `/${lang}/p/${slug}/quiz`;
  const angka = (n: number) => formatAngka(n, lang);

  const akun = await wajibMasuk(lang, `${jalur}/sertifikat`);

  if (sesi < JUMLAH_SESI) {
    return (
      <main className="min-h-dvh bg-[var(--color-surface)]">
        <PageHeader lang={lang} title={d.kuis.sertifikat} back={`${jalur}`} />
        <div className="mx-auto w-full max-w-[420px] px-5 pt-10 text-center">
          <p className="text-[16px] leading-[1.6] text-[var(--color-ink-2)]">
            {d.kuis.sertifikatBelum}
          </p>
          <Link href={`${jalur}`} className="btn btn-primary mt-6">
            {d.kuis.keKalender}
          </Link>
        </div>
      </main>
    );
  }

  const jawaban = await jawabanSaya(akun.id, slug);
  const nomor = nomorTampil(akun.id, await nomorPeserta(akun.id, slug));
  const nilai = skor(jawaban);
  const terpanjang = streakTerpanjang(jawaban);

  return (
    <main className="min-h-dvh bg-[var(--color-surface)]">
      <div className="no-print">
        <PageHeader lang={lang} title={d.kuis.sertifikat} back={`${jalur}`} />
      </div>

      <div className="mx-auto w-full max-w-[880px] px-4 py-6">
        {/*
          840 × 594 is A5 landscape at 96dpi. It scales down on a phone rather than
          reflowing: a certificate that rearranges itself is not the same document,
          and this is one people will screenshot as often as print.
        */}
        <div className="print-sheet overflow-x-auto">
          <div
            dir="ltr"
            className="relative grid h-[594px] w-[840px] grid-cols-[minmax(0,1fr)_300px] overflow-hidden rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)]"
          >
            <div className="relative z-10 flex flex-col p-[52px]">
              <div className="flex items-center justify-between">
                <Logo kind="lockup" height={44} tone="dark" title="Tilawa Labs" />
                <span className="eyebrow">
                  {d.kuis.eyebrow} ·{" "}
                  {formatTanggalIso(tanggalSesi(mulai, 1).dari, "en")} –{" "}
                  {formatTanggalIso(tanggalSesi(mulai, JUMLAH_SESI).sampai, "en")}
                </span>
              </div>

              <div className="mt-11 text-[18px] leading-[1.5] text-[var(--color-ink-2)]">
                {d.kuis.sertifikatUntuk}
              </div>
              <div className="mt-1.5 text-[46px] font-bold leading-none tracking-[-0.02em] text-balance">
                {akun.nama}
              </div>
              <p className="mt-4 max-w-[40ch] text-[17px] leading-[1.5] text-[var(--color-ink-2)]">
                {d.kuis.sertifikatTeks
                  .replace("{judul}", catatan.judul[b])
                  .replace("{pemateri}", catatan.pemateri[b])
                  .replace("{doa}", catatan.doa[b])}
              </p>

              <div className="mt-auto flex items-end gap-10">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-3)]">
                    {d.kuis.skor}
                  </div>
                  <div className="mt-2 text-[54px] font-bold leading-[0.9] tracking-[-0.03em] text-brand">
                    {angka(nilai)}
                    <span className="text-[22px] font-normal text-[var(--color-ink-3)]">
                      {" "}
                      /{angka(JUMLAH_SOAL)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-3)]">
                    {d.kuis.sertifikatStreak}
                  </div>
                  <div className="mt-2 text-[54px] font-bold leading-[0.9] tracking-[-0.03em]">
                    {angka(terpanjang)}
                  </div>
                </div>
                <div className="ms-auto text-end text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
                  <div>{d.kuis.sertifikatNomor.replace("{nomor}", nomor)}</div>
                  <div>{catatan.acara[b]}</div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden border-s-[1.5px] border-[var(--color-ink)] bg-[var(--color-canvas)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/kv/pohon.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -left-[60px] -bottom-2.5 h-[560px] w-auto max-w-none select-none"
              />
            </div>
          </div>
        </div>

        <p className="no-print mt-4 text-center text-[14px] text-[var(--color-ink-3)]">
          {d.kuis.cetak}
        </p>
      </div>
    </main>
  );
}
