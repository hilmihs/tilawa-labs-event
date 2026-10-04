import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormProfil } from "../form";
import { wajibMasuk } from "@/lib/auth/akun";
import { isLang, t } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

/*
 * The form lives one step below the profile on purpose. Most visits to the profile
 * are a glance — "what did I put down?" — and a page of inputs answers that badly.
 * Editing is the exception, so it gets its own page and its own back arrow.
 */
export default async function UbahProfilPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const p = await wajibMasuk(lang, `/${lang}/akun/profil/ubah`);
  const d = t(lang, p.gender);

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={d.akun.ubahProfil} back={`/${lang}/akun/profil`} />
      <div className="mx-auto w-full max-w-[520px] px-5 pt-6">
        {/* Only the fields the form edits are handed to the client. */}
        <FormProfil
          lang={lang}
          awal={{
            wa: p.wa,
            nama: p.nama,
            gender: p.gender,
            statusLipia: p.statusLipia,
            prodi: p.prodi,
            sesi: p.sesi,
            semester: p.semester,
            tahunLulus: p.tahunLulus,
            domisili: p.domisili,
            asalDaerah: p.asalDaerah,
            asalSekolah: p.asalSekolah,
            minat: p.minat,
            kebutuhanKhusus: p.kebutuhanKhusus,
          }}
        />
      </div>
    </main>
  );
}
