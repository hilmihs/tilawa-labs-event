import { notFound, redirect } from "next/navigation";
import { acaraBawaanPublik } from "@/lib/acara/queries";
import { isLang } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

/** Old lookup URL, still linked from the saved-ticket page and the invalid-link screen. */
export default async function CariLama({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ pending?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  const ev = await acaraBawaanPublik();
  const qs = sp.pending ? `?pending=${encodeURIComponent(sp.pending)}` : "";
  redirect(ev ? `/${lang}/p/${ev.slug}/ticket${qs}` : `/${lang}`);
}
