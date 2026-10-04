import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormPassword } from "./form-password";
import { FormEmail } from "./form-email";
import { FormVerifikasi } from "./form-verifikasi";
import { wajibMasuk } from "@/lib/auth/akun";
import { isLang, t } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

export default async function KeamananPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const p = await wajibMasuk(lang, `/${lang}/akun/keamanan`);
  const sp = await searchParams;
  const d = t(lang, p.gender);

  const ok = (
    {
      password: d.akun.passwordDiganti,
      email: d.akun.emailDiganti,
      kode: d.akun.kodeTerkirim,
      verifikasi: d.akun.emailDiverifikasi,
    } as Record<string, string>
  )[sp.ok ?? ""];

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={d.akun.keamanan} back={`/${lang}/akun`} />
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-4 px-5 pt-6">
        {ok ? (
          <p role="status" className="rounded-[8px] bg-brand-100 px-4 py-3 text-[14px]">
            {ok}
          </p>
        ) : null}
        <FormVerifikasi
          lang={lang}
          terverifikasi={Boolean(p.emailTerverifikasiAt)}
          email={p.email}
          gender={p.gender}
        />
        <FormEmail lang={lang} email={p.email} gender={p.gender} />
        <FormPassword lang={lang} gender={p.gender} />
      </div>
    </main>
  );
}
