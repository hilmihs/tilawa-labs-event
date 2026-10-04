import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { KartuSoal } from "@/components/kuis/kartu-soal";
import { kunciJawaban } from "../actions";
import { penggunaSekarang } from "@/lib/auth/akun";
import { BAHASA_TAMPIL, dirTeks } from "@/lib/catatan/tipe";
import { isLang, t } from "@/lib/i18n/dict";
import { konteksKuis } from "@/lib/kuis/konteks";
import { isSoalSah, sesiDari, sudahTerbuka, tanggalSesi } from "@/lib/kuis/jadwal";
import { jawabanSaya } from "@/lib/kuis/queries";
import { ringkasan } from "@/lib/kuis/skor";
import { JUMLAH_SOAL, LABEL_TIPE, soalKe } from "@/lib/kuis/soal";
import { JUMLAH_SESI } from "@/lib/kuis/jadwal";
import { formatAngka, formatTanggalIso } from "@/lib/waktu";

export const dynamic = "force-dynamic";

/*
 * One question of the quiz: the question before it is answered, the explanation after.
 *
 * The same URL for both. A link into the quiz from the WhatsApp group is sent to
 * four hundred people at once, some of whom have already answered, and it should do
 * the right thing for each of them rather than bouncing half of them somewhere else.
 */

const HURUF = ["A", "B", "C", "D"];

export default async function HalamanHari({
  params,
}: {
  params: Promise<{ lang: string; slug: string; nomor: string }>;
}) {
  const { lang, slug, nomor: nomorRaw } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);

  const nomor = Number(nomorRaw);
  if (!isSoalSah(nomor)) notFound();
  const soal = soalKe(nomor);
  if (!soal) notFound();

  const { catatan, mulai, sesi } = await konteksKuis(slug);
  const b = BAHASA_TAMPIL;
  const dir = dirTeks(b);
  const jalur = `/${lang}/p/${slug}/quiz`;
  const angka = (n: number) => formatAngka(n, lang);
  const v = soal.varian[b];

  const akun = await penggunaSekarang();
  const jawaban = akun ? await jawabanSaya(akun.id, slug) : [];
  const punya = jawaban.find((j) => j.nomor === nomor) ?? null;
  const r = ringkasan(jawaban, mulai);
  const bagian = catatan.bagian.find((x) => x.id === soal.bagian);

  const kepala = (
    <PageHeader
      lang={lang}
      title={d.kuis.judulSoal}
      back={`${jalur}`}
      right={`${angka(nomor)} / ${angka(JUMLAH_SOAL)}`}
    />
  );

  // Not open yet: say when, rather than pretending the question does not exist.
  if (!sudahTerbuka(mulai, nomor)) {
    return (
      <main className="min-h-dvh bg-[var(--color-surface)]">
        {kepala}
        <div className="mx-auto w-full max-w-[420px] px-5 pt-10 text-center">
          <div className="text-[64px] font-bold leading-none tracking-[-0.03em] text-[var(--color-line)]">
            {String(nomor).padStart(2, "0")}
          </div>
          <p className="mt-4 text-[16px] leading-[1.6] text-[var(--color-ink-2)]">
            {d.kuis.terkunci
              .replace(
                "{tanggal}",
                formatTanggalIso(tanggalSesi(mulai, sesiDari(nomor)).dari, lang),
              )
              .replace("{n}", angka(sesiDari(nomor)))}
          </p>
          <Link href={`${jalur}`} className="btn btn-primary mt-6">
            {d.kuis.keKalender}
          </Link>
        </div>
      </main>
    );
  }

  if (punya) {
    const benar = punya.benar;
    return (
      <main
        className={`flex min-h-dvh flex-col ${
          benar ? "bg-brand text-[var(--color-butter)]" : "bg-[var(--color-surface)]"
        }`}
      >
        {/* The header sits on cream; inside a green <main> it would inherit the butter text. */}
        <div className="text-[var(--color-ink)]">{kepala}</div>
        <div className="mx-auto w-full max-w-[420px] flex-1 px-4 pb-8">
          <div className="pt-8 text-center">
            <div
              className={`mx-auto flex size-[72px] items-center justify-center rounded-full border-[1.5px] border-[var(--color-ink)] text-[34px] font-bold shadow-[3px_3px_0_var(--color-ink)] ${
                benar ? "bg-brand-300 text-[var(--color-ink)]" : "bg-[var(--color-butter)] text-[var(--color-danger)]"
              }`}
            >
              {benar ? "✓" : "✕"}
            </div>
            <h1 className="judul mt-4 text-[clamp(32px,9vw,44px)]">
              {benar ? d.kuis.benar : d.kuis.salah}
            </h1>
            <div
              className={`mt-2.5 text-[15px] ${
                benar ? "text-brand-200" : "text-[var(--color-ink-3)]"
              }`}
            >
              {d.kuis.streakSesi.replace("{n}", angka(r.streak))} ·{" "}
              {d.kuis.skor} {angka(r.skor)} / {angka(r.terbuka)}
            </div>
          </div>

          <div className="card mt-6 p-4.5 text-[var(--color-ink)]" dir={dir}>
            <div className="eyebrow">{d.kuis.jawabanBenar.replace("{huruf}", HURUF[soal.jawab])}</div>
            <div className="mt-2 text-[19px] font-semibold leading-[1.3]">{v.o[soal.jawab]}</div>
            {benar ? null : (
              <div className="mt-2 text-[14px] text-[var(--color-danger)]">
                {d.kuis.jawabanKamu.replace("{huruf}", HURUF[punya.pilih] ?? "—")}
              </div>
            )}
            <p className="mt-3 text-[15px] leading-[1.55] text-[var(--color-ink-2)]">{v.e}</p>
            {bagian?.penutup.jenis === "dalil" ? (
              <div className="mt-4 rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-canvas)] px-4 py-3.5">
                <div dir="rtl" className="font-arabic text-[22px] leading-[1.6]">
                  {bagian.penutup.arab}
                </div>
                <div className="mt-1.5 text-[12px] font-semibold text-brand">
                  {bagian.penutup.sumber[b]}
                </div>
              </div>
            ) : null}
            <Link
              href={`/${lang}/p/${slug}/notes#${soal.bagian}`}
              className="mt-4 inline-block border-b-[1.5px] border-brand pb-[3px] text-[14px] font-bold text-brand"
            >
              {d.kuis.bacaDiCatatan.replace("{bagian}", soal.rujuk[b])} →
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href={`${jalur}`}
              className={`btn ${
                benar
                  ? "border-[var(--color-ink)] bg-[var(--color-butter)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)]"
                  : "btn-primary"
              }`}
            >
              {d.kuis.keKalender}
            </Link>
            <span
              className={`flex h-12 items-center justify-center rounded-[6px] border-[1.5px] text-[15px] font-bold ${
                benar
                  ? "border-[var(--color-butter)] text-[var(--color-butter)]"
                  : "border-[var(--color-ink)] text-[var(--color-ink-2)]"
              }`}
            >
              {sesiDari(nomor) < JUMLAH_SESI ? d.kuis.sesiDepan : d.kuis.sertifikatSiap}
            </span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-[var(--color-surface)]">
      {kepala}
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col pb-0">
        <div className="flex items-start justify-between gap-3 px-4 pt-5">
          <div>
            <div className="eyebrow">
              {d.kuis.soal.replace("{n}", angka(nomor))} ·{" "}
              {d.kuis.labelSesi.replace("{n}", angka(sesiDari(nomor)))}
            </div>
            <div className="mt-1.5 text-[34px] font-bold leading-none tracking-[-0.02em]">
              {String(nomor).padStart(2, "0")}{" "}
              <span className="text-[var(--color-line)]">/ {JUMLAH_SOAL}</span>
            </div>
          </div>
        </div>

        {akun ? null : (
          <p className="mx-4 mt-4 rounded-[6px] border-[1.5px] border-dashed border-[var(--color-ink)] px-4 py-3 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
            {d.kuis.perluMasuk}
          </p>
        )}

        <div
          className="relative mx-4 mt-4 overflow-hidden rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] px-4 py-5"
          dir={dir}
        >
          {/* The speech bubble from the poster, faded back behind the question. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kv/balon.webp"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-5 h-[110px] w-auto select-none opacity-45"
          />
          <div className="relative text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-ink-3)] rtl:tracking-normal">
            {LABEL_TIPE[soal.tipe][b]} · {soal.rujuk[b]}
          </div>
          <p className="relative mt-3 text-[20px] font-semibold leading-[1.35] text-pretty">{v.q}</p>
        </div>

        <div className="mt-3.5 flex flex-1 flex-col">
          <KartuSoal
            opsi={[...v.o]}
            aksi={kunciJawaban}
            tersembunyi={{ lang, slug, nomor: String(nomor) }}
            label={d.kuis.kunciJawaban}
            labelMenyimpan={d.kuis.menyimpan}
            catatan={d.kuis.sekaliCoba}
            pilihDulu={d.kuis.pilihDulu}
            dir={dir}
          />
        </div>
      </div>
    </main>
  );
}
