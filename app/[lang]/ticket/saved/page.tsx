import { notFound } from "next/navigation";
import { TiketTersimpan } from "./client";
import { isLang } from "@/lib/i18n/dict";

/**
 * The offline copy of the ticket.
 *
 * Static on purpose: no database call, no server data, nothing that needs the
 * network at render time. It draws the QR in the browser from what was saved to
 * localStorage the last time the real ticket loaded. Paired with the service
 * worker, this is the page a participant actually gets when a thousand people are
 * fighting over one cell tower in the car park.
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "ar" }];
}

export default async function Saved({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <TiketTersimpan lang={lang} />;
}
