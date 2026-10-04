import { redirect } from "next/navigation";
import { StaffNav } from "@/components/staff-nav";
import { SalinTeks } from "@/components/salin-teks";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { PilihAcara } from "@/components/pilih-acara";
import { punyaAkses } from "@/lib/auth/sesi";
import { catatanUntuk } from "@/lib/catatan/kajian";
import {
  JUMLAH_SESI,
  mulaiSetelah,
  sesiDari,
  sesiTerbuka,
  soalSesi,
  tanggalSesi,
} from "@/lib/kuis/jadwal";
import { jumlahPemain, rekapSesi } from "@/lib/kuis/queries";
import { JUMLAH_SOAL, LABEL_TIPE, SOAL } from "@/lib/kuis/soal";
import { pesanRilis } from "@/lib/kuis/wa";

export const dynamic = "force-dynamic";

/*
 * The committee's side of the quiz: the two messages to paste into the groups on
 * release mornings, and the whole question bank with the answers marked.
 *
 * Staff-only, and it has to be: the bank shows every correct answer, which is
 * exactly the thing that must never sit on a public URL. Committee code, like the
 * rest of /panel.
 *
 * Nothing here sends anything. A message that goes to four hundred people gets read
 * by a human first — which is also why it is twice a week and not daily: a send that
 * has to happen every morning is a send that stops happening by the second week.
 */

const BASIS = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://nawa.room").replace(/\/$/, "");
const HURUF = ["A", "B", "C", "D"];

function Pesan({ judul, teks }: { judul: string; teks: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-semibold text-[var(--color-ink-2)]">{judul}</div>
        <SalinTeks teks={teks} label="Copy" />
      </div>
      {/* Pre-wrapped: the line breaks are the message, and WhatsApp keeps them. */}
      <pre className="mt-3 whitespace-pre-wrap font-sans text-[14px] leading-[1.55] text-[var(--color-ink)]">
        {teks}
      </pre>
    </div>
  );
}

export default async function PanelKuis({
  searchParams,
}: {
  searchParams: Promise<{ acara?: string; sesi?: string }>;
}) {
  const sesiStaf = await punyaAkses("panitia");
  if (!sesiStaf) redirect("/gate?next=%2Fpanel%2Fkuis");

  const sp = await searchParams;
  const ev = await acaraUntukStaf(sp.acara);
  if (!ev) return <main className="p-10">No event configured.</main>;

  const catatan = catatanUntuk(ev.slug);
  if (!catatan) {
    return (
      <main className="min-h-dvh bg-[var(--color-surface)]">
        <StaffNav current="kuis" nama={sesiStaf.nama} acara={ev.slug} peran={sesiStaf.peran} />
        <div className="p-6 text-[15px] text-[var(--color-ink-2)]">
          This programme has no lecture notes, so it has no quiz. The questions are
          written against one lecture — see lib/catatan.
        </div>
      </main>
    );
  }

  const mulai = mulaiSetelah(catatan.tanggal);
  const terbuka = sesiTerbuka(mulai);
  // The committee sometimes prepares a message the night before, so the batch is a
  // parameter with the current one as the default.
  const diminta = Number(sp.sesi);
  const sesi =
    Number.isInteger(diminta) && diminta >= 1 && diminta <= JUMLAH_SESI
      ? diminta
      : Math.max(1, terbuka);

  const kosong = { menjawab: 0, jawaban: 0, benar: 0 };
  const soalLalu = sesi > 1 ? soalSesi(sesi - 1) : [];
  const [ikhwanLalu, akhwatLalu, ikhwanMain, akhwatMain] = await Promise.all([
    soalLalu.length ? rekapSesi(ev.slug, soalLalu, "ikhwan") : Promise.resolve(kosong),
    soalLalu.length ? rekapSesi(ev.slug, soalLalu, "akhwat") : Promise.resolve(kosong),
    jumlahPemain(ev.slug, "ikhwan"),
    jumlahPemain(ev.slug, "akhwat"),
  ]);

  const persen = (r: { jawaban: number; benar: number }) =>
    r.jawaban ? Math.round((r.benar / r.jawaban) * 100) : 0;

  const grup = (
    [
      ["ikhwan", ikhwanLalu, ikhwanMain],
      ["akhwat", akhwatLalu, akhwatMain],
    ] as const
  ).map(([gender, lalu, pemain]) => ({
    gender,
    pesan: pesanRilis({
      sesi,
      mulai,
      gender,
      basis: BASIS,
      slug: ev.slug,
      lalu:
        sesi > 1 && pemain > 0
          ? { menjawab: lalu.menjawab, peserta: pemain, persenBenar: persen(lalu) }
          : undefined,
    }),
  }));

  return (
    <main className="min-h-dvh bg-[var(--color-surface)]">
      <StaffNav
        current="kuis"
        nama={sesiStaf.nama}
        acara={ev.slug}
        peran={sesiStaf.peran}
        pilih={<PilihAcara sekarang={ev} next="/panel/kuis" />}
      />

      <div className="px-5 py-6">
        <h1 className="judul text-[28px]">Quiz · 8 batches</h1>
        <p className="mt-2 text-[14px] text-[var(--color-ink-2)]">
          Batch {terbuka || "—"} of {JUMLAH_SESI} · a batch opens every Monday and Thursday at
          05.00 WIB · {akhwatMain + ikhwanMain} playing ({akhwatMain} sisters, {ikhwanMain}{" "}
          brothers)
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-[var(--color-ink-2)]">
            Message for batch
          </span>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: JUMLAH_SESI }, (_, i) => i + 1).map((n) => (
              <a
                key={n}
                href={`/panel/kuis?acara=${encodeURIComponent(ev.slug)}&sesi=${n}`}
                aria-current={n === sesi ? "true" : undefined}
                className={`flex size-8 items-center justify-center rounded-[4px] border text-[12px] font-semibold tabular-nums ${
                  n === sesi
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-butter)]"
                    : n <= terbuka
                      ? "border-[var(--color-line)] bg-white text-[var(--color-ink-2)]"
                      : "border-dashed border-[var(--color-line)] text-[var(--color-ink-3)]"
                }`}
              >
                {n}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {grup.map(({ gender, pesan }) => (
            <div key={gender} className="flex flex-col gap-3">
              <div className="text-[13px] font-bold uppercase tracking-[0.1em] text-brand">
                {gender} · {pesan.rentang}
              </div>
              <Pesan judul="Message 1 — this batch" teks={pesan.soal} />
              {pesan.kunci ? (
                <Pesan judul={`Message 2 — batch ${sesi - 1} answer key`} teks={pesan.kunci} />
              ) : (
                <div className="card p-4 text-[13px] text-[var(--color-ink-3)]">
                  No answer key on the first batch.
                </div>
              )}
            </div>
          ))}
        </div>

        <h2 className="judul mt-10 text-[22px]">Question bank</h2>
        <p className="mt-1.5 text-[14px] text-[var(--color-ink-2)]">
          All {JUMLAH_SOAL} questions, three or four per batch, correct answer in green. Staff only —
          this is the answer key.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {SOAL.map((s) => {
            const v = s.varian.id;
            return (
              <div key={s.nomor} className="card flex flex-col gap-2.5 px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[26px] font-bold leading-none tracking-[-0.02em] text-brand-300">
                    {String(s.nomor).padStart(2, "0")}
                  </span>
                  <span className="text-end text-[10px] font-bold uppercase tracking-[0.12em] text-brand">
                    {LABEL_TIPE[s.tipe].en} · {s.rujuk.en}
                  </span>
                </div>
                <div className="text-[15px] font-semibold leading-[1.4] text-pretty">{v.q}</div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {v.o.map((o, i) => {
                    const ok = i === s.jawab;
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-2 rounded-[4px] border px-2.5 py-1.5 text-[13.5px] leading-[1.4] ${
                          ok
                            ? "border-brand bg-brand-100 font-semibold text-[var(--color-ink)]"
                            : "border-[var(--color-line)] text-[var(--color-ink-2)]"
                        }`}
                      >
                        <span className="flex-none font-bold">{HURUF[i]}</span>
                        <span>{o}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-dashed border-[var(--color-line)] pt-2.5 text-[13.5px] leading-[1.5] text-[var(--color-ink-2)]">
                  {v.e}
                </div>
                <div className="text-[12px] text-[var(--color-ink-3)]">
                  Batch {sesiDari(s.nomor)} · opens {tanggalSesi(mulai, sesiDari(s.nomor)).dari}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
