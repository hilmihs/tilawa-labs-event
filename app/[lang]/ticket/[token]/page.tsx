import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { PageHeader } from "@/components/page-header";
import { TiketKlien } from "./client";
import { ambilAcara, ambilPesertaById, kehadiranPeserta, tandaiTiketDibuka } from "@/lib/acara/queries";
import {
  daftarWaGrup,
  labelGate,
  labelGender,
  tampilanAcara,
  waAdmin,
} from "@/lib/acara/view-model";
import { verifyTiketToken } from "@/lib/tiket/token";
import { penggunaSekarang } from "@/lib/auth/akun";
import { ambilPenggunaById } from "@/lib/akun/queries";
import { IngatVerifikasi } from "@/components/ingat-verifikasi";
import { TombolGrupWa } from "@/components/tombol-grup-wa";
import { konfirmasiGrupWa, ubahKehadiranRencana } from "./edit/actions";
import { LepasKursi } from "./lepas-kursi";
import { SimpanTiket } from "./simpan";
import { formatAngka, formatJam } from "@/lib/waktu";
import { isLang, t } from "@/lib/i18n/dict";
import { BantuanWa } from "@/components/bantuan-wa";
import { TataTertib } from "@/components/tata-tertib";

export const dynamic = "force-dynamic";

export default async function Tiket({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; token: string }>;
  searchParams: Promise<{
    baru?: string;
    tersimpan?: string;
    gagal_batal?: string;
    penuh?: string;
  }>;
}) {
  const { lang, token } = await params;
  const sp = await searchParams;
  if (!isLang(lang)) notFound();
  // Masculine until we know better; the invalid-token branch below never learns who
  // is reading, because there is no participant row behind the token.
  let d = t(lang);

  const payload = await verifyTiketToken(token);
  const akun = await penggunaSekarang();
  // Signed in, the ticket sits under "My registrations"; that is where back should lead.
  const kembali = akun ? `/${lang}/akun` : `/${lang}`;
  const ev = payload ? await ambilAcara(payload.slug) : null;
  const peserta = payload && ev ? await ambilPesertaById(payload.pid) : null;

  if (!peserta || !ev || peserta.acaraId !== ev.id || !peserta.aktif) {
    return (
      <main className="min-h-dvh bg-[var(--color-surface)]">
        <PageHeader lang={lang} title={d.tiket.label} back={kembali} />
        <div className="mx-auto max-w-[440px] px-5 py-12 text-center">
          <h1 className="text-xl font-semibold">{d.tiket.invalidTitle}</h1>
          <p className="mt-2 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">
            {d.tiket.invalidBody}
          </p>
          <Link href={`/${lang}/ticket`} className="btn btn-primary mt-6 w-full">
            {d.tiket.findAgain}
          </Link>
          <BantuanWa
            lang={lang}
            nomor={waAdmin(ev)}
            acara={ev?.nama}
            halaman={d.bantuan.halamanTiket}
            slug={ev?.slug}
            className="mt-3"
          />
        </div>
      </main>
    );
  }

  // From here on the participant row is loaded, so every Arabic line can address her
  // directly instead of falling back to the masculine default.
  d = t(lang, peserta.gender);

  /*
   * Recorded once, only while still NULL — and deliberately NOT on the view that
   * comes straight off the registration redirect (?baru=1).
   *
   * Registering already lands you here, so counting that view would make the
   * figure read ~100% forever and warn about nothing. What the committee actually
   * needs to know on the eve of the event is whether people can still FIND their
   * ticket — that is, whether they came back to it in a later session.
   */
  if (sp.baru !== "1") await tandaiTiketDibuka(peserta.id);

  const hadir = await kehadiranPeserta(peserta.id);
  /*
   * A walk-in still in the queue: number shown, QR held back. The code exists — the
   * gate refuses it until the permit — but showing it would invite a screenshot that
   * turns red in the line.
   */
  const otsMenunggu = peserta.jenis === "ots" && !peserta.izinOtsAt;
  const nomorOts = peserta.urutOts ? formatAngka(peserta.urutOts, lang) : null;
  const v = tampilanAcara(ev, lang);

  // The QR carries the random code, never the participant number.
  const qr = await QRCode.toString(peserta.kode, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#2D2F2B", light: "#FFFFFF" },
  });

  const daftarGrup = daftarWaGrup(ev, peserta.gender);
  const grup = daftarGrup[0]?.url ?? null;

  /*
   * The WhatsApp group comes before the QR.
   *
   * Every change on the day is announced there, so a participant who never joined is
   * a participant nobody can reach. The registration is already saved at this point —
   * this holds back the code, not the seat. With no group link configured there is
   * nothing to join, so the gate steps aside rather than trapping everyone.
   */
  if (!peserta.grupWaAt && grup) {
    return (
      <main className="min-h-dvh bg-[var(--color-surface)]">
        <PageHeader lang={lang} right={d.tiket.label} back={kembali} />
        <div className="mx-auto w-full max-w-[440px] px-5 pt-8">
          <div className="card flex flex-col gap-4 p-6">
            <div>
              <h1 className="text-xl font-semibold leading-[1.3]">{d.tiket.grupJudul}</h1>
              <p className="mt-2 text-[15px] leading-[1.6] text-[var(--color-ink-2)]">
                {d.tiket.grupBody}
              </p>
            </div>

            <div className="rounded-[8px] bg-brand-100 px-4 py-3 text-[14px] leading-[1.5]">
              <span className="font-semibold">{labelGender(peserta.gender, lang)}</span> ·{" "}
              {peserta.nomor}
              {/* Said before the QR, so nobody joins the group believing they have a seat. */}
              {otsMenunggu ? (
                <div className="mt-1 font-semibold text-[var(--color-ink)]">
                  {d.tiket.otsBanner}
                  {nomorOts ? ` · ${d.tiket.otsNomor.replace("{n}", nomorOts)}` : ""}
                </div>
              ) : null}
            </div>

            {/* Several groups when one has filled up: the participant picks any. */}
            <div className="flex flex-col gap-2">
              {daftarGrup.map((g, i) => (
                <a
                  key={g.url}
                  href={g.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`btn w-full ${i === 0 ? "btn-primary" : "btn-ghost"}`}
                >
                  {/*
                    Unnamed links are numbered, or several groups would show the
                    same caption and there would be no way to tell them apart.
                  */}
                  {g.label ??
                    (daftarGrup.length > 1
                      ? `${d.tiket.grupBuka} ${formatAngka(i + 1, lang)}`
                      : d.tiket.grupBuka)}
                </a>
              ))}
            </div>

            <form action={konfirmasiGrupWa}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="lang" value={lang} />
              <button type="submit" className="btn btn-ghost w-full">
                {d.tiket.grupSudah}
              </button>
            </form>

            <p className="text-[13px] leading-[1.6] text-[var(--color-ink-3)]">
              {d.tiket.grupCatatan}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const dilepas = peserta.konfirmasi === false && !hadir;
  // The account behind this registration, for the verify-your-email nudge only.
  const pemilik = peserta.penggunaId
    ? akun?.id === peserta.penggunaId
      ? akun
      : await ambilPenggunaById(peserta.penggunaId)
    : null;
  const ingatVerifikasi = Boolean(pemilik && pemilik.email && !pemilik.emailTerverifikasiAt && !hadir);
  const dipindaiPada = hadir
    ? formatJam(new Date(hadir.clientScannedAt ?? hadir.scannedAt), lang)
    : null;

  return (
    <TiketKlien
      lang={lang}
      slug={ev.slug}
      data={{
        kode: peserta.kode,
        nomor: peserta.nomor,
        nama: peserta.nama,
        gender: peserta.gender,
      }}
    >
      <main className="min-h-dvh bg-[var(--color-surface)] pb-14">
        <PageHeader lang={lang} right={d.tiket.label} back={kembali} />

        {peserta.konfirmasi === false ? (
          <div className="bg-[var(--color-ink-2)] px-5 py-3">
            <div className="text-[13px] font-bold tracking-[0.1em] text-white">
              {d.edit.dibatalkanTitle.toUpperCase()}
            </div>
            <p className="mt-1 text-[13px] leading-[1.5] text-white/85">{d.edit.dibatalkanBody}</p>
          </div>
        ) : null}

        {sp.gagal_batal === "1" ? (
          <p
            role="alert"
            className="bg-[var(--color-danger)]/10 px-5 py-3 text-center text-[14px] font-semibold text-[var(--color-danger)]"
          >
            {d.edit.gagalBatal}
          </p>
        ) : null}

        {sp.tersimpan === "1" ? (
          <p className="bg-brand-100 px-5 py-3 text-center text-[14px] font-semibold text-brand">
            {d.edit.tersimpan}
          </p>
        ) : null}

        {sp.penuh === "1" ? (
          <p role="alert" className="bg-[var(--color-warn)] px-5 py-3 text-center text-[14px] font-semibold text-[var(--color-ink)]">
            {d.edit.penuhKembali}
          </p>
        ) : null}

        {/*
          A place in the walk-in queue must not look like a seat. It is said before the
          QR, not in small print under it — and the number is big, because it is what
          they will be called by.
        */}
        {peserta.jenis === "ots" ? (
          <div className={`px-5 py-3 ${otsMenunggu ? "bg-[var(--color-warn)]" : "bg-brand-100"}`}>
            <div className="text-[13px] font-bold tracking-[0.1em] text-[var(--color-ink)]">
              {d.tiket.otsBanner}
            </div>
            {nomorOts ? (
              <div className="mt-1.5 text-[22px] font-bold leading-tight text-[var(--color-ink)]">
                {d.tiket.otsNomor.replace("{n}", nomorOts)} · {labelGender(peserta.gender, lang)}
              </div>
            ) : null}
            <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--color-ink)]">
              {otsMenunggu ? d.tiket.otsTunggu : d.tiket.otsIzin}
            </p>
          </div>
        ) : null}

        {dipindaiPada ? (
          // Primary green, not red: being scanned is the ticket working, not a fault.
          <div className="flex h-10 items-center justify-center bg-brand">
            <span className="text-[13px] font-bold tracking-[0.1em] text-white">
              {d.tiket.scannedBanner} · {dipindaiPada}
            </span>
          </div>
        ) : null}

        <div className="mx-auto w-full max-w-[440px] px-5 py-5">
          <div className="card overflow-hidden">
            <div className="border-b border-[var(--color-line)] p-4 text-center">
              <div className="eyebrow">{d.tiket.nomor}</div>
              <div className="mt-1.5 text-[22px] font-bold leading-[1.2]">{peserta.nomor}</div>
            </div>

            {/*
              A released ticket is void at the gate, so it shows no code to screenshot or
              send: a QR that turns red in the queue is worse than no QR at all.
            */}
            {dilepas || otsMenunggu ? (
              <div className="px-5 py-6 text-center text-[14px] leading-[1.6] text-[var(--color-ink-2)]">
                {dilepas ? d.tiket.dilepasQr : d.tiket.otsQrBelum}
              </div>
            ) : (
              <div className="relative flex flex-col items-center px-5 pb-4 pt-5">
                <div
                  className={`w-[260px] max-w-full ${dipindaiPada ? "opacity-20" : ""}`}
                  // The QR is the only large thing on the page. Everything else is caption.
                  dangerouslySetInnerHTML={{ __html: qr }}
                  aria-label={d.tiket.showAtGate}
                  role="img"
                />
                {dipindaiPada ? (
                  <div className="absolute inset-x-5 top-[46%] flex justify-center">
                    <span className="rounded-[8px] border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-center text-[15px] font-semibold">
                      {d.tiket.used}
                    </span>
                  </div>
                ) : null}
                <p className="mt-2.5 text-center text-[13px] leading-[1.5] text-[var(--color-ink-2)]">
                  {dipindaiPada ? d.tiket.usedNote : d.tiket.showAtGate}
                </p>
              </div>
            )}

            <Baris label={d.tiket.nama} value={peserta.nama} strong />
            <Baris
              label={d.tiket.entrance}
              value={`${labelGender(peserta.gender, lang)} — ${labelGate(ev, peserta.gender, lang)}`}
            />
            {dipindaiPada && hadir ? (
              <Baris
                label={d.tiket.entered}
                value={`${dipindaiPada}${hadir.gate ? ` · ${hadir.gate}` : ""}`}
              />
            ) : null}
          </div>

          <div className="card mt-3">
            <Baris label={d.tiket.waktu} value={`${v.tanggal}${lang === "ar" ? "، " : " · "}${v.waktu}`} />
            <Baris label={d.tiket.tempat} value={v.lokasi ?? ""} last />
          </div>

          {dipindaiPada ? (
            <p className="mt-3 rounded-[8px] bg-brand-100 p-4 text-[13px] leading-[1.6]">
              {d.tiket.reentry}
            </p>
          ) : null}

          {/*
            Keeping the ticket comes before editing it: a link in a browser tab is
            the one place it will not survive.
          */}
          {dilepas || otsMenunggu ? null : (
            <SimpanTiket
              lang={lang}
              data={{
                nomor: peserta.nomor,
                nama: peserta.nama,
                kode: peserta.kode,
                pintu: `${labelGender(peserta.gender, lang)} — ${labelGate(ev, peserta.gender, lang)}`,
                tanggal: v.tanggal,
                waktu: v.waktu,
                lokasi: v.lokasi ?? "",
                acara: v.nama,
                url: `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/${lang}/ticket/${token}`,
                wa: peserta.wa,
              }}
              gender={peserta.gender}
            />
          )}

          {ingatVerifikasi && pemilik ? (
            <IngatVerifikasi
              lang={lang}
              gender={peserta.gender}
              email={pemilik.email}
              sudahMasuk={akun?.id === pemilik.id}
              className="mt-3"
            />
          ) : null}

          {/*
            Editing and cancelling live on the ticket because the ticket is the only
            page a participant reliably keeps a link to.
          */}
          <div className="mt-3 flex flex-col gap-2">
            <Link href={`/${lang}/ticket/${token}/edit`} className="btn btn-ghost w-full">
              {d.edit.buka}
            </Link>

            {peserta.konfirmasi === false ? (
              <form action={ubahKehadiranRencana}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="lang" value={lang} />
                <input type="hidden" name="datang" value="true" />
                {/* Green: coming. Its opposite, "I cannot come", is red. */}
                <button type="submit" className="btn btn-primary w-full">
                  {d.edit.bisaHadir}
                </button>
              </form>
            ) : dipindaiPada ? null : (
              /* Only before they have been let in: after that it is meaningless. */
              <LepasKursi lang={lang} token={token} wa4={peserta.wa.slice(-4)} gender={peserta.gender} />
            )}
          </div>

          <p className="mt-3 text-[13px] leading-[1.6] text-[var(--color-ink-3)]">
            {d.edit.waTetap}
          </p>

          {/* Only once it is over: before that it is noise on a ticket. */}
          {ev.status === "selesai" && ev.feedbackUrl ? (
            <a
              href={ev.feedbackUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-primary mt-3 w-full"
            >
              {d.tiket.feedback}
            </a>
          ) : null}

          {/* Every group, not only the first: the first may be the restricted one. */}
          <TombolGrupWa lang={lang} gender={peserta.gender} grup={daftarGrup} className="mt-4" />


          <p className="mt-3 text-[13px] leading-[1.7] text-[var(--color-ink-2)]">{d.tiket.tips}</p>
          <TataTertib lang={lang} url={ev.tatibUrl} className="mt-3" gender={peserta.gender} />
        </div>
      </main>
    </TiketKlien>
  );
}

function Baris({
  label,
  value,
  strong = false,
  last = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex gap-3.5 px-4 py-3 ${last ? "" : "border-t border-[var(--color-line)]"}`}>
      <span className="w-[88px] flex-none text-[13px] leading-[1.5] text-[var(--color-ink-3)]">
        {label}
      </span>
      <span className={`text-[15px] leading-[1.5] ${strong ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
