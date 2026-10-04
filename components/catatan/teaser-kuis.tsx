import Link from "next/link";
import { Muncul } from "@/components/muncul";

/*
 * The thirty-day quiz, announced from the notes it is drawn from.
 *
 * Before the first question opens there is nothing to link to, so the call to action
 * is the dashed "not yet" chip this app already uses for a registration that has not
 * opened — never a solid button that goes nowhere. Once day one is live it becomes
 * the link, and nothing else on the section changes.
 *
 * The section that follows on the programme page is the same forest green; the ink
 * rule along the bottom edge is what keeps the two from reading as one long block.
 */
export function TeaserKuis({
  eyebrow,
  judul,
  body,
  segera,
  syarat,
  cta,
  href,
}: {
  eyebrow: string;
  judul: string;
  body: string;
  segera: string;
  syarat: string;
  /** The button's words once the quiz is open. */
  cta: string;
  /** Where it goes, or null while every question is still locked. */
  href: string | null;
}) {
  return (
    <section className="kertas relative overflow-hidden border-b-[1.5px] border-[var(--color-ink)] bg-[#3c5430] text-[var(--color-butter)]">
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(220px,36%)]">
        <Muncul className="px-6 py-14 md:px-10 md:py-14">
          <div className="eyebrow text-brand-200">{eyebrow}</div>
          <h2 className="judul mt-3 max-w-[12ch] text-[clamp(36px,5.8vw,68px)] rtl:max-w-[16ch] rtl:text-[clamp(28px,4.2vw,50px)]">
            {judul}
          </h2>
          <p className="mt-5 max-w-[46ch] text-[18px] font-light leading-[1.5] md:text-[20px]">
            {body}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            {href ? (
              <Link
                href={href}
                className="btn border-[var(--color-ink)] bg-[var(--color-butter)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)]"
              >
                {cta}
              </Link>
            ) : (
              <span className="inline-flex h-12 items-center rounded-[6px] border-[1.5px] border-dashed border-[var(--color-butter)] px-5 text-[15px] font-bold">
                {segera}
              </span>
            )}
            <span className="max-w-[34ch] text-[14px] leading-[1.5] text-brand-200">{syarat}</span>
          </div>
        </Muncul>
        {/*
          The "why?" figure, bottom-right on the green the picture was printed on, so
          the cut edge disappears into the section. Decorative: the section reads the
          same with images off.
        */}
        <div className="relative min-h-[260px] md:min-h-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kv/tanya.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute bottom-0 right-0 block h-[240px] w-auto max-w-none select-none md:h-[420px]"
          />
        </div>
      </div>
    </section>
  );
}
