import { KartuClub } from "./kartu-club";
import { Muncul } from "@/components/muncul";
import { PINTU_KEYS, adaMinatFest, type MinatKey } from "@/lib/hub/konten";
import { t, type Lang } from "@/lib/i18n/dict";

/**
 * Programme Hub on the programme page: the three clubs and Tilawa Labs Fest as four cards. It sits
 * below "how it works", never above it — people arrive here for a ticket, and the
 * clubs are what they find once that is sorted.
 */
export function TeaserHub({
  lang,
  minat,
  gender,
}: {
  lang: Lang;
  minat: Set<MinatKey>;
  gender?: string | null;
}) {
  const d = t(lang, gender);
  return (
    <section id="hub" className="px-5 pt-12 md:px-12 md:pt-16">
      <Muncul>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <div className="eyebrow">{d.hub.teaserEyebrow}</div>
            <h2 className="judul mt-2 text-[clamp(30px,4.2vw,50px)]">{d.hub.teaserJudul}</h2>
          </div>
          <p className="max-w-[46ch] text-[15px] text-[var(--color-ink-2)] lg:text-[17px]">{d.hub.teaserBody}</p>
        </div>
      </Muncul>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PINTU_KEYS.map((k, i) => (
          <Muncul key={k} delay={i * 90}>
            <KartuClub lang={lang} club={k} tercatat={k === "fest" ? adaMinatFest(minat) : minat.has(k)} gender={gender} />
          </Muncul>
        ))}
      </div>
    </section>
  );
}
