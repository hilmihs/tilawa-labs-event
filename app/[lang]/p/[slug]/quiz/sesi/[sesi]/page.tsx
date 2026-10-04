import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormSesi } from "@/components/kuis/form-sesi";
import { kunciSesi } from "../../actions";
import { penggunaSekarang } from "@/lib/auth/akun";
import { BAHASA_TAMPIL, dirTeks } from "@/lib/catatan/tipe";
import { isLang, t } from "@/lib/i18n/dict";
import { konteksKuis } from "@/lib/kuis/konteks";
import { JUMLAH_SESI, soalSesi, sudahTerbuka, tanggalSesi, tutupSesi } from "@/lib/kuis/jadwal";
import { jawabanSaya } from "@/lib/kuis/queries";
import { ringkasan } from "@/lib/kuis/skor";
import { LABEL_TIPE, soalKe } from "@/lib/kuis/soal";
import { formatAngka, formatTanggalIso, formatTanggalRingkas } from "@/lib/waktu";

export const dynamic = "force-dynamic";

/*
 * One batch of the quiz on one page: every question still owed in a single form,
 * and every one already answered with its explanation.
 *
 * The batch is the unit the quiz is released in, twice a week, so it is also the
 * unit it is answered in — three or four questions and one press, rather than four
 * round trips through four pages on the mosque's signal. The single-question pages
 * (../[nomor]) stay for links already sent.
 */

const HURUF = ["A", "B", "C", "D"];

export default async function HalamanSesi({
  params,
}: {
  params: Promise<{ lang: string; slug: string; sesi: string }>;
}) {
  const { lang, slug, sesi: sesiRaw } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);

  const sesi = Number(sesiRaw);
  const nomor = Number.isInteger(sesi) ? soalSesi(sesi) : [];
  if (!nomor.length) notFound();

  const { catatan, mulai } = await konteksKuis(slug);
  const b = BAHASA_TAMPIL;
  const dir = dirTeks(b);
  const jalur = `/${lang}/p/${slug}/quiz`;
  const angka = (n: number) => formatAngka(n, lang);
  const rentang = tanggalSesi(mulai, sesi);

  const kepala = (
    <PageHeader
      lang={lang}
      title={d.kuis.labelSesi.replace("{n}", angka(sesi))}
      back={jalur}
      right={`${angka(sesi)} / ${angka(JUMLAH_SESI)}`}
    />
  );

  // Every question of a batch opens together, so the first one speaks for all.
  if (!sudahTerbuka(mulai, nomor[0])) {
    return (
      <main className="min-h-dvh bg-[var(--color-surface)]">
        {kepala}
        <div className="mx-auto w-full max-w-[420px] px-5 pt-10 text-center">
          <p className="text-[16px] leading-[1.6] text-[var(--color-ink-2)]">
            {d.kuis.belumBukaSesi
              .replace("{n}", angka(sesi))
              .replace("{tanggal}", formatTanggalIso(rentang.dari, lang))}
          </p>
          <Link href={jalur} className="btn btn-primary mt-6">
            {d.kuis.keKalender}
          </Link>
        </div>
      </main>
    );
  }

  const akun = await penggunaSekarang();
  const jawaban = akun ? await jawabanSaya(akun.id, slug) : [];
  const r = ringkasan(jawaban, mulai);
  const milik = new Map(jawaban.map((j) => [j.nomor, j]));
  const soal = nomor.map((n) => ({ n, s: soalKe(n)! })).filter((x) => x.s);
  const belum = soal.filter((x) => !milik.has(x.n));
  const sudah = soal.filter((x) => milik.has(x.n));
  const benar = sudah.filter((x) => milik.get(x.n)?.benar).length;

  return (
    <main className="min-h-dvh bg-[var(--color-surface)]">
      {kepala}
      <div className="mx-auto w-full max-w-[520px] pb-10 pt-5">
        <div className="px-4">
          <div className="eyebrow">
            {d.kuis.rentang
              .replace("{dari}", formatTanggalRingkas(rentang.dari, lang))
              .replace("{sampai}", formatTanggalRingkas(rentang.sampai, lang))}
          </div>
          {sudah.length ? (
            <div className="mt-1.5 text-[15px] text-[var(--color-ink-2)]">
              <span className="font-bold text-[var(--color-ink)]">
                {d.kuis.hasilSesi.replace("{b}", angka(benar)).replace("{n}", angka(sudah.length))}
              </span>{" "}
              · {d.kuis.streakSesi.replace("{n}", angka(r.streak))} · {d.kuis.skor} {angka(r.skor)} /{" "}
              {angka(r.terbuka)}
            </div>
          ) : null}
        </div>

        {/* A make-up: the answers still count for score, and saying so up front
            keeps a late answer from feeling like it was for nothing. */}
        {belum.length > 0 && Date.now() >= tutupSesi(mulai, sesi) ? (
          <p className="mx-4 mt-4 rounded-[6px] bg-[var(--color-canvas)] px-4 py-3 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
            {d.kuis.lewatMasihBisa}
          </p>
        ) : null}

        {akun ? null : (
          <p className="mx-4 mt-4 rounded-[6px] border-[1.5px] border-dashed border-[var(--color-ink)] px-4 py-3 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
            {d.kuis.perluMasuk}
          </p>
        )}

        {belum.length ? (
          <div className="mt-5">
            <FormSesi
              soal={belum.map(({ n, s }) => ({
                nomor: n,
                judul: d.kuis.soal.replace("{n}", angka(n)),
                label: `${LABEL_TIPE[s.tipe][b]} · ${s.rujuk[b]}`,
                pertanyaan: s.varian[b].q,
                opsi: [...s.varian[b].o],
              }))}
              aksi={kunciSesi}
              tersembunyi={{ lang, slug, sesi: String(sesi) }}
              label={d.kuis.kunciSemua.replace("{n}", angka(belum.length))}
              labelMenyimpan={d.kuis.menyimpan}
              catatan={d.kuis.sekaliCobaSesi}
              sisa={d.kuis.pilihSemua}
              dir={dir}
            />
          </div>
        ) : null}

        {sudah.length ? (
          <div className="mt-5 flex flex-col gap-3.5 px-4">
            {sudah.map(({ n, s }) => {
              const j = milik.get(n)!;
              const v = s.varian[b];
              return (
                <div key={n} id={`s${n}`} className="card scroll-mt-20 p-4.5" dir={dir}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="eyebrow">{d.kuis.soal.replace("{n}", angka(n))}</div>
                    <span
                      className={`flex size-8 flex-none items-center justify-center rounded-full border-[1.5px] border-[var(--color-ink)] text-[15px] font-bold ${
                        j.benar ? "bg-brand-300" : "bg-[var(--color-butter)] text-[var(--color-danger)]"
                      }`}
                      aria-label={j.benar ? d.kuis.benar : d.kuis.salah}
                    >
                      {j.benar ? "✓" : "✕"}
                    </span>
                  </div>
                  <p className="mt-2 text-[16px] font-semibold leading-[1.35]">{v.q}</p>
                  <div className="mt-3 text-[13px] font-bold text-brand">
                    {d.kuis.jawabanBenar.replace("{huruf}", HURUF[s.jawab])}
                  </div>
                  <div className="mt-1 text-[15px] leading-[1.4]">{v.o[s.jawab]}</div>
                  {j.benar ? null : (
                    <div className="mt-1.5 text-[14px] text-[var(--color-danger)]">
                      {d.kuis.jawabanKamu.replace("{huruf}", HURUF[j.pilih] ?? "—")}
                    </div>
                  )}
                  <p className="mt-3 text-[14px] leading-[1.55] text-[var(--color-ink-2)]">{v.e}</p>
                  <Link
                    href={`/${lang}/p/${slug}/notes#${s.bagian}`}
                    className="mt-3 inline-block border-b-[1.5px] border-brand pb-[3px] text-[13px] font-bold text-brand"
                  >
                    {d.kuis.bacaDiCatatan.replace("{bagian}", s.rujuk[b])} →
                  </Link>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2.5 px-4">
          <Link href={jalur} className="btn btn-ghost">
            {d.kuis.keKalender}
          </Link>
          {belum.length === 0 ? (
            <p className="text-center text-[13px] text-[var(--color-ink-3)]">
              {sesi < JUMLAH_SESI ? d.kuis.sesiDepan : d.kuis.sertifikatSiap}
            </p>
          ) : null}
        </div>
        {/* The notes are the answer key; the quiz is only worth playing next to them. */}
        <p className="mt-4 text-center text-[13px] text-[var(--color-ink-3)]">{catatan.judul[b]}</p>
      </div>
    </main>
  );
}
