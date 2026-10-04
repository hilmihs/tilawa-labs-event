import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormDaftarAkun } from "./form";
import { penggunaSekarang } from "@/lib/auth/akun";
import { tujuanAman } from "@/lib/auth/tujuan";
import { isLang, t } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

export default async function DaftarAkunPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  // Already signed in: there is nothing to create.
  if (await penggunaSekarang()) redirect(tujuanAman(sp.next, lang));
  const d = t(lang);
  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={d.akun.daftar} back={`/${lang}`} tautanAkun={false} />
      <div className="mx-auto w-full max-w-[440px] px-5 pt-8">
        <FormDaftarAkun lang={lang} next={sp.next ?? ""} />
      </div>
    </main>
  );
}
