import { notFound } from "next/navigation";
import { LANGS, dirOf, isLang } from "@/lib/i18n/dict";
import { DaftarServiceWorker } from "@/components/daftar-sw";
import { AturHtml } from "@/components/atur-html";
import { CatatKunjungan } from "@/components/catat-kunjungan";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const dir = dirOf(lang);

  return (
    <div dir={dir} lang={lang} className="min-h-dvh">
      {/* The wrapper carries dir for layout; <html> gets it too, for native controls. */}
      <AturHtml lang={lang} dir={dir} />
      <DaftarServiceWorker />
      <CatatKunjungan />
      {children}
    </div>
  );
}
