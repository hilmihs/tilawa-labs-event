import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { penggunaSekarang } from "@/lib/auth/akun";
import { isLang, t } from "@/lib/i18n/dict";
import { konteksKuis } from "@/lib/kuis/konteks";
import { nomorTampil, tandaTile } from "@/lib/kuis/nomor";
import { jumlahPemain, nomorPeserta, papan } from "@/lib/kuis/queries";
import { peringkat } from "@/lib/kuis/skor";
import { formatAngka } from "@/lib/waktu";

export const dynamic = "force-dynamic";

/*
 * The leaderboard, one side of the hall at a time.
 *
 * Participant numbers and scores, never names — see lib/kuis/nomor.ts for why the
 * little tile carries digits rather than an initial. The two sides are separate
 * boards rather than one mixed list because that is how the hall, the WhatsApp
 * groups and the gates are already split.
 */

const GENDER = ["akhwat", "ikhwan"] as const;
type Gender = (typeof GENDER)[number];

function isGender(v: string | undefined): v is Gender {
  return v === "akhwat" || v === "ikhwan";
}

export default async function HalamanPapan({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{ g?: string }>;
}) {
  const { lang, slug } = await params;
  const sp = await searchParams;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const { sesi } = await konteksKuis(slug);

  const akun = await penggunaSekarang();
  // Their own side first: that is the board they are on and the one they want.
  const sisi: Gender = isGender(sp.g) ? sp.g : isGender(akun?.gender) ? akun.gender : "akhwat";
  const jalur = `/${lang}/p/${slug}/quiz`;

  const [baris, jumlah] = await Promise.all([papan(slug, sisi, sesi), jumlahPemain(slug, sisi)]);
  const urut = peringkat(baris);
  const nomorSaya = akun ? nomorTampil(akun.id, await nomorPeserta(akun.id, slug)) : null;
  const saya = nomorSaya ? urut.find((b) => b.nomor === nomorSaya) : undefined;
  const angka = (n: number) => formatAngka(n, lang);

  return (
    <main className="min-h-dvh bg-[var(--color-surface)]">
      <PageHeader
        lang={lang}
        title={d.kuis.papan}
        back={`${jalur}`}
      />

      <div className="mx-auto w-full max-w-[520px] px-5 pb-12 pt-4">
        <div className="flex overflow-hidden rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)]">
          {GENDER.map((g) => (
            <Link
              key={g}
              href={`${jalur}/papan?g=${g}`}
              aria-current={g === sisi ? "true" : undefined}
              className={`flex-1 py-3 text-center text-[14px] font-bold ${
                g === sisi
                  ? "bg-[var(--color-ink)] text-[var(--color-butter)]"
                  : "text-[var(--color-ink-3)]"
              }`}
            >
              {g === "akhwat" ? d.gender.akhwat : d.gender.ikhwan}
            </Link>
          ))}
        </div>

        <p className="mt-2.5 text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
          {nomorSaya
            ? d.kuis.papanCatatan.replace("{nomor}", nomorSaya)
            : d.kuis.perluMasuk}
        </p>

        {urut.length === 0 ? (
          <p className="card mt-4 p-5 text-center text-[15px] text-[var(--color-ink-2)]">
            {d.kuis.papanKosong}
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)]">
            {urut.map((b, i) => (
              <div
                key={b.penggunaId}
                className={`grid grid-cols-[38px_minmax(0,1fr)_auto_44px] items-center gap-2 px-3.5 py-3 ${
                  i === 0 ? "" : "border-t-[1.5px] border-[var(--color-line)]"
                } ${b.nomor === nomorSaya ? "bg-brand-100" : ""}`}
              >
                <span
                  className={`text-[16px] font-bold tabular-nums ${
                    b.rank <= 3 ? "text-brand" : "text-[var(--color-ink-3)]"
                  }`}
                >
                  {angka(b.rank)}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex size-7.5 flex-none items-center justify-center rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-brand-200 text-[11px] font-bold tabular-nums text-[var(--color-ink)]">
                    {tandaTile(b.nomor)}
                  </span>
                  <span className="truncate text-[15px] font-semibold tabular-nums" dir="ltr">
                    {b.nomor}
                  </span>
                </span>
                <span className="whitespace-nowrap text-[13px] text-[var(--color-ink-3)]">
                  {d.kuis.streakSesi.replace("{n}", angka(b.streak))}
                </span>
                <span className="text-end text-[16px] font-bold tabular-nums">
                  {angka(b.skor)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3.5 flex flex-wrap justify-between gap-2 text-[12px] text-[var(--color-ink-3)]">
          <span>{d.kuis.papanAturan}</span>
          <span>{d.kuis.papanJumlah.replace("{n}", angka(jumlah))}</span>
        </div>

        {saya ? (
          <div className="mt-5 flex items-center gap-3 rounded-[6px] border-[1.5px] border-[var(--color-ink)] bg-brand-100 px-4 py-3.5">
            <span className="flex size-9 flex-none items-center justify-center rounded-[6px] bg-brand text-[13px] font-bold text-[var(--color-butter)]">
              {angka(saya.rank)}
            </span>
            <span className="text-[14px] leading-[1.45] text-[var(--color-ink-2)]">
              {d.kuis.posisiKamu.replace("{n}", angka(saya.rank))}
            </span>
          </div>
        ) : null}

        <Link href={`${jalur}`} className="btn btn-ghost mt-5">
          {d.kuis.keKalender}
        </Link>
      </div>
    </main>
  );
}
