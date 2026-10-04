import { redirect } from "next/navigation";
import { DEFAULT_LANG } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

/**
 * Everyone lands on the Arabic page first; the switch in the header is one tap
 * away. The committee wants the site, like its social accounts, to lead with
 * Arabic rather than follow whatever language the phone happens to be set to.
 *
 * The query string travels with the redirect: a broadcast link like
 * the site root with ?src=wa is how the traffic tab tells WhatsApp from everything else.
 */
export default async function Root({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") q.set(k, v);
  }
  const s = q.toString();
  redirect(`/${DEFAULT_LANG}${s ? `?${s}` : ""}`);
}
