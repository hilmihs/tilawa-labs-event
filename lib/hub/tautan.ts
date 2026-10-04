import type { Lang } from "@/lib/i18n/dict";
import type { KunciTombol } from "./konten";

/**
 * The page an interest button sends someone back to, from the `dari` it carries.
 *
 * Only a path on this site in the same language is accepted — anything else falls back
 * to /[lang]/hub, so the form cannot be turned into an open redirect. `polos` is the
 * page as it was; `denganMinat` adds `?minat=<key>` before any #section, which is how
 * the page knows, after sign-in, which button to ask about.
 */
export function kembaliKe(lang: Lang, dari: string): { polos: string; denganMinat: (k: KunciTombol) => string } {
  const aman =
    (dari === `/${lang}` || dari.startsWith(`/${lang}/`) || dari.startsWith(`/${lang}#`)) &&
    !dari.startsWith("//") &&
    !dari.includes("\\") &&
    !dari.includes("?") &&
    // eslint-disable-next-line no-control-regex -- reject control chars smuggling another host
    !/[\x00-\x1f]/.test(dari) &&
    dari.length <= 200;
  const polos = aman ? dari : `/${lang}/hub`;
  const [jalur, hash] = polos.split("#");
  return {
    polos,
    denganMinat: (k) => `${jalur}?minat=${k}${hash ? `#${hash}` : ""}`,
  };
}
