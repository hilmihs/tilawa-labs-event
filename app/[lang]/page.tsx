import { notFound, redirect } from "next/navigation";
import HalamanProgram from "./p/[slug]/page";
import { acaraBawaanPublik } from "@/lib/acara/queries";
import { isLang } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

/*
 * For now the home page is the programme itself, not the list of programmes.
 *
 * There is one programme running and everything already broadcast points at the
 * bare domain, so a visitor should land on the lecture — not on a list with one card
 * they have to tap first. The page is rendered in place rather than redirected so
 * the address stays /ar. The list lives at /[lang]/program and becomes
 * the home page again once several programmes run side by side.
 */
export default async function Beranda({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const ev = await acaraBawaanPublik();
  if (!ev) redirect(`/${lang}/program`);

  return <HalamanProgram params={Promise.resolve({ lang, slug: ev.slug })} />;
}
