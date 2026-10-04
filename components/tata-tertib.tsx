"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Lang } from "@/lib/i18n/dict";

/**
 * The house rules, in the two places they are needed.
 *
 * On the registration form they open as a dialog over the form — the form stays
 * where it is, with everything already typed still in it, and the rules cannot be
 * missed on the way to the submit button. Elsewhere they fold away behind their own
 * title, because those pages are not asking for a decision.
 */
function IsiTatib({
  lang,
  url,
  gender,
}: {
  lang: Lang;
  url?: string | null;
  gender?: string | null;
}) {
  const d = t(lang, gender);
  return (
    <>
      {d.tatib.bagian.map((bagian) => (
        <section key={bagian.judul} className="mt-5 first:mt-0">
          <h3 className="eyebrow">{bagian.judul}</h3>
          <ul className="mt-2.5 flex flex-col gap-2 text-[14px] leading-[1.6] text-[var(--color-ink-2)]">
            {bagian.poin.map((poin) => (
              <li key={poin} className="flex gap-2.5">
                <span className="mt-[8px] h-[5px] w-[5px] flex-none rounded-full bg-brand-300" />
                <span>{poin}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-5 inline-block text-[13px] font-semibold text-brand underline underline-offset-2"
        >
          {d.form.tatibDokumen}
        </a>
      ) : null}
    </>
  );
}

/** Folded away behind its title: the programme page and the ticket. */
export function TataTertib({
  lang,
  url,
  className,
  gender,
}: {
  lang: Lang;
  url?: string | null;
  className?: string;
  /** Known on the ticket, unknown on the programme page — so it stays optional. */
  gender?: string | null;
}) {
  const d = t(lang, gender);
  const [buka, setBuka] = useState(false);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        className="text-[14px] font-semibold text-brand underline underline-offset-2"
      >
        {buka ? d.form.tatibTutup : d.form.tatibLink}
      </button>
      {buka ? (
        <div className="mt-3 rounded-[6px] border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <IsiTatib lang={lang} url={url} gender={gender} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * The same rules as a dialog, for the registration form.
 *
 * `<dialog>` and not a div: the browser gives the focus trap, Escape, the backdrop
 * and the inert page for free, and a phone keyboard that is open when it appears
 * does not push it off screen.
 */
export function TataTertibDialog({
  lang,
  url,
  buka,
  onTutup,
  onSudahBaca,
  gender,
}: {
  lang: Lang;
  url?: string | null;
  buka: boolean;
  onTutup: () => void;
  onSudahBaca: () => void;
  /** Follows the gender buttons live, so the rules re-read as she picks. */
  gender?: string | null;
}) {
  const d = t(lang, gender);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (buka && !el.open) el.showModal();
    if (!buka && el.open) el.close();
  }, [buka]);

  return (
    <dialog
      ref={ref}
      onClose={onTutup}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog itself, never on its children.
        if (e.target === ref.current) onTutup();
      }}
      className="m-auto w-[min(92vw,520px)] rounded-[8px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] p-0 text-[var(--color-ink)] backdrop:bg-black/45"
    >
      <div className="flex max-h-[80svh] flex-col">
        <div className="border-b-[1.5px] border-[var(--color-line)] px-5 py-4 text-[17px] font-semibold">
          {d.tatib.judul}
        </div>
        <div className="overflow-y-auto px-5 py-4">
          <IsiTatib lang={lang} url={url} gender={gender} />
        </div>
        <div className="flex flex-wrap gap-2 border-t-[1.5px] border-[var(--color-line)] px-5 py-4">
          {/* Focus lands here, not on the scrolling box, whose ring is the browser's. */}
          <button
            type="button"
            autoFocus
            onClick={onSudahBaca}
            className="btn btn-primary flex-1"
          >
            {d.form.tatibSudah}
          </button>
          <button type="button" onClick={onTutup} className="btn btn-ghost">
            {d.form.tatibTutupDialog}
          </button>
        </div>
      </div>
    </dialog>
  );
}
