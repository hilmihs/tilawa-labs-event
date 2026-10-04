import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormReset } from "./form";
import { isLang, t } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

export default async function ResetPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ wa?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  const d = t(lang);
  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={d.akun.judulReset} back={`/${lang}/lupa-password`} tautanAkun={false} />
      <div className="mx-auto w-full max-w-[440px] px-5 pt-8">
        <FormReset lang={lang} wa={sp.wa ?? ""} />
      </div>
    </main>
  );
}
