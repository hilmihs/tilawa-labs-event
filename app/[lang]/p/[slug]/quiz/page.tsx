import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { penggunaSekarang } from "@/lib/auth/akun";
import { BAHASA_TAMPIL } from "@/lib/catatan/tipe";
import { isLang, t } from "@/lib/i18n/dict";
import { konteksKuis } from "@/lib/kuis/konteks";
import { JUMLAH_SESI, tanggalSesi } from "@/lib/kuis/jadwal";
import { jawabanSaya, nomorPeserta } from "@/lib/kuis/queries";
import { nomorTampil } from "@/lib/kuis/nomor";
import { ringkasan, type StatusSoal } from "@/lib/kuis/skor";
import { formatAngka, formatTanggalRingkas } from "@/lib/waktu";

export const dynamic = "force-dynamic";

/*
 * The board: eight releases of three or four questions, and the way back into any
 * question still owed.
 *
 * A row per release rather than one long grid of thirty. The release is the unit the
 * quiz is actually run in — a batch opens together on a Monday or a Thursday and its
 * streak is decided before the next one — so the row is what a reader needs to see
 * whole. Four to a row at every width: a batch that breaks across two lines stops
 * reading as one batch.
 *
 * Every square is a link to its batch's page, locked ones included: a locked batch's
 * page says when it opens, which is more use than a square that does nothing when
 * tapped. A closed batch with questions still owed gets a make-up link beside its
 * label — answered late, they count for score but not for the streak.
 */

const KOTAK: Record<StatusSoal, string> = {
  benar: "border-[var(--color-ink)] bg-brand text-[var(--color-butter)]",
  salah: "border-[var(--color-danger)] bg-[var(--color-butter)] text-[var(--color-danger)]",
  lewat: "border-[var(--color-ink)] bg-[var(--color-paper)] text-[var(--color-ink-3)]",
  terbuka:
    "border-[var(--color-ink)] bg-brand-100 text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)]",
  terkunci:
    "border-dashed border-[var(--color-ink-3)] bg-[var(--color-canvas)] text-[var(--color-ink-3)]",
};

const TAG: Record<StatusSoal, "legendaBenar" | "legendaSalah" | "legendaLewat" | "sesiIni" | "legendaTerkunci"> = {
  benar: "legendaBenar",
  salah: "legendaSalah",
  lewat: "legendaLewat",
  terbuka: "sesiIni",
  terkunci: "legendaTerkunci",
};

function Tegel({ label, nilai, warna }: { label: string; nilai: string; warna?: string }) {
  return (
    <div className="card px-3 py-3.5">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-ink-3)] rtl:tracking-normal">
        {label}
      </div>
      <div className={`mt-2 text-[30px] font-bold leading-none tracking-[-0.02em] ${warna ?? ""}`}>
        {nilai}
      </div>
    </div>
  );
}

export default async function HalamanKuis({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const { catatan, mulai, sesi } = await konteksKuis(slug);
  const b = BAHASA_TAMPIL;

  const akun = await penggunaSekarang();
  const jawaban = akun ? await jawabanSaya(akun.id, slug) : [];
  const r = ringkasan(jawaban, mulai);
  const nomorSaya = akun ? nomorTampil(akun.id, await nomorPeserta(akun.id, slug)) : null;

  const jalur = `/${lang}/p/${slug}/quiz`;
  const angka = (n: number) => formatAngka(n, lang);
  const sisaSesiIni =
    sesi >= 1 ? r.papan[sesi - 1].kotak.filter((k) => k.status === "terbuka").length : 0;

  return (
    <main className="min-h-dvh bg-[var(--color-surface)]">
      <PageHeader
        lang={lang}
        title={d.kuis.judulPerjalanan}
        back={`/${lang}/p/${slug}`}
        right={nomorSaya ?? undefined}
      />

      <div className="mx-auto w-full max-w-[520px] px-5 pb-12 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="eyebrow">
            {d.kuis.jendela
              .replace("{mulai}", formatTanggalRingkas(tanggalSesi(mulai, 1).dari, lang))
              .replace(
                "{selesai}",
                formatTanggalRingkas(tanggalSesi(mulai, JUMLAH_SESI).sampai, lang),
              )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <Tegel
            label={d.kuis.skor}
            nilai={`${angka(r.skor)} / ${angka(Math.max(r.terbuka, 1))}`}
          />
          <Tegel label={d.kuis.streak} nilai={angka(r.streak)} warna="text-brand" />
          <Tegel
            label={d.kuis.sesiKe}
            nilai={`${angka(sesi)} / ${angka(JUMLAH_SESI)}`}
          />
        </div>

        {sesi === 0 ? (
          <p className="card mt-5 p-4 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">
            {d.kuis.belumMulai.replace(
              "{tanggal}",
              formatTanggalRingkas(tanggalSesi(mulai, 1).dari, lang),
            )}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3.5">
          {r.papan.map((p) => {
            const rentang = tanggalSesi(mulai, p.sesi);
            const kini = p.sesi === sesi;
            return (
              <div key={p.sesi}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-baseline gap-2.5">
                    <span
                      className={`text-[12px] font-bold uppercase tracking-[0.1em] rtl:tracking-normal ${
                        kini ? "text-brand" : "text-[var(--color-ink-3)]"
                      }`}
                    >
                      {d.kuis.labelSesi.replace("{n}", angka(p.sesi))}
                    </span>
                    {/* A closed batch with questions still owed: made up for score, the streak stays lost. */}
                    {!kini && p.kotak.some((k) => k.status === "lewat") ? (
                      <Link
                        href={`${jalur}/sesi/${p.sesi}`}
                        className="border-b-[1.5px] border-brand text-[12px] font-bold text-brand"
                      >
                        {d.kuis.qodho}
                      </Link>
                    ) : null}
                  </span>
                  <span className="text-[12px] text-[var(--color-ink-3)]">
                    {d.kuis.rentang
                      .replace("{dari}", formatTanggalRingkas(rentang.dari, lang))
                      .replace("{sampai}", formatTanggalRingkas(rentang.sampai, lang))}
                  </span>
                </div>
                <div className="mt-1.5 grid max-w-[300px] grid-cols-4 gap-2 sm:gap-2.5 rtl:ms-auto" dir="ltr">
                  {p.kotak.map((k) => (
                    <Link
                      key={k.nomor}
                      href={`${jalur}/sesi/${p.sesi}#s${k.nomor}`}
                      aria-label={`${d.kuis.soal.replace("{n}", String(k.nomor))} — ${
                        d.kuis[TAG[k.status]]
                      }`}
                      className={`flex aspect-square items-center justify-center rounded-[6px] border-[1.5px] text-[15px] font-bold tabular-nums sm:text-[17px] ${
                        KOTAK[k.status]
                      }`}
                    >
                      {String(k.nomor).padStart(2, "0")}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3.5 text-[12px] text-[var(--color-ink-2)]">
          {(["benar", "salah", "lewat", "terkunci"] as StatusSoal[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`size-3 rounded-[3px] border-[1.5px] ${KOTAK[s]}`} />
              {d.kuis[TAG[s]]}
            </span>
          ))}
        </div>

        {sesi >= 1 ? (
          <div className="mt-5 flex items-center justify-between gap-3.5 rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-brand p-4 text-[var(--color-butter)]">
            <div>
              <div className="eyebrow text-brand-200">{d.kuis.sesiIni}</div>
              <div className="mt-1.5 text-[17px] font-semibold leading-[1.3]">
                {sisaSesiIni === 0
                  ? d.kuis.sudahLengkap
                  : d.kuis.sisaSesiIni.replace("{n}", angka(sisaSesiIni))}
              </div>
            </div>
            {sisaSesiIni > 0 ? (
              <Link
                href={`${jalur}/sesi/${sesi}`}
                className="btn h-11 flex-none border-[var(--color-ink)] bg-[var(--color-butter)] px-4 text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)]"
              >
                {d.kuis.jawabSekarang}
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`${jalur}/papan`} className="btn btn-ghost">
            {d.kuis.papan}
          </Link>
          <Link href={`/${lang}/p/${slug}/notes`} className="btn btn-ghost">
            {d.catatan.baca}
          </Link>
          {sesi === JUMLAH_SESI ? (
            <Link href={`${jalur}/sertifikat`} className="btn btn-ghost">
              {d.kuis.sertifikat}
            </Link>
          ) : null}
        </div>

        {akun ? null : (
          <p className="mt-5 text-center text-[14px] leading-[1.5] text-[var(--color-ink-3)]">
            {d.kuis.perluMasuk}
          </p>
        )}
        <p className="mt-4 text-center text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
          {d.kuis.lewatMasihBisa}
        </p>
        {/* The notes are the answer key; the quiz is only worth playing next to them. */}
        <p className="mt-2 text-center text-[13px] text-[var(--color-ink-3)]">
          {catatan.judul[b]}
        </p>
      </div>
    </main>
  );
}
