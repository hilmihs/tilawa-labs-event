import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormEdit } from "./form";
import { ambilAcara, ambilPesertaById } from "@/lib/acara/queries";
import { verifyTiketToken } from "@/lib/tiket/token";
import { isLang, t } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

export default async function EditTiket({
  params,
}: {
  params: Promise<{ lang: string; token: string }>;
}) {
  const { lang, token } = await params;
  if (!isLang(lang)) notFound();
  // Masculine until the row loads; the invalid-token branch below never gets one.
  let d = t(lang);

  const payload = await verifyTiketToken(token);
  const ev = payload ? await ambilAcara(payload.slug) : null;
  const peserta = payload && ev ? await ambilPesertaById(payload.pid) : null;

  if (!peserta || !ev || peserta.acaraId !== ev.id || !peserta.aktif) {
    return (
      <main className="min-h-dvh bg-[var(--color-surface)]">
        <PageHeader lang={lang} title={d.edit.judul} back={`/${lang}`} />
        <div className="mx-auto max-w-[440px] px-5 py-12 text-center">
          <h1 className="text-xl font-semibold">{d.tiket.invalidTitle}</h1>
          <Link href={`/${lang}/ticket`} className="btn btn-primary mt-6 w-full">
            {d.tiket.findAgain}
          </Link>
        </div>
      </main>
    );
  }

  d = t(lang, peserta.gender);

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={d.edit.judul} back={`/${lang}/ticket/${token}`} />
      <div className="mx-auto w-full max-w-[520px] px-5 pt-6">
        <FormEdit
          lang={lang}
          token={token}
          awal={{
            nama: peserta.nama,
            gender: peserta.gender,
            statusLipia: peserta.statusLipia,
            nim: peserta.nim,
            prodi: peserta.prodi,
            sesi: peserta.sesi,
            semester: peserta.semester,
            tahunLulus: peserta.tahunLulus,
            domisili: peserta.domisili,
            asalDaerah: peserta.asalDaerah,
            asalSekolah: peserta.asalSekolah,
            transportasi: peserta.transportasi,
            kebutuhanKhusus: peserta.kebutuhanKhusus,
            email: peserta.email,
          }}
        />
      </div>
    </main>
  );
}
