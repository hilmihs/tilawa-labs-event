import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FormLupa } from "./form";
import { isLang, t } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

export default async function LupaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <PageHeader lang={lang} title={d.akun.judulLupa} back={`/${lang}/masuk`} tautanAkun={false} />
      <div className="mx-auto w-full max-w-[440px] px-5 pt-8">
        <FormLupa lang={lang} />
      </div>
    </main>
  );
}
