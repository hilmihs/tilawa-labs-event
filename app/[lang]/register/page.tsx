import { notFound, redirect } from "next/navigation";
import { acaraBawaanPublik } from "@/lib/acara/queries";
import { isLang } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

/** The pre-multi-programme URL. Anything already broadcast keeps working. */
export default async function RegisterLama({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const ev = await acaraBawaanPublik();
  redirect(ev ? `/${lang}/p/${ev.slug}/register` : `/${lang}`);
}
