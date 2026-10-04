import { TautanKetuk, TombolKirim } from "./tombol-kirim";
import { nyatakanMinat, tarikMinat } from "@/app/[lang]/hub/actions";
import { isClub, kunciDari, pertanyaanClub, type KunciTombol, type MinatKey } from "@/lib/hub/konten";
import { kembaliKe } from "@/lib/hub/tautan";
import { t, type Lang } from "@/lib/i18n/dict";

/**
 * "Keep me posted" for one club, Tilawa Labs Fest, or everything at once (`semua`), in
 * whichever of four states the reader is:
 *
 * - a guest: a link to sign in that brings them back here with `?minat=<key>`;
 * - back from signing in: the same button with a line saying one more tap does it.
 *   It is never recorded on arrival — a link someone was sent must not register
 *   interest on their behalf;
 * - signed in: the button;
 * - already on the list (for `semua`: for every key): the confirmation, and a quiet
 *   way to withdraw.
 *
 * `dari` is the page the button sits on, #section included, so every path comes back
 * to the same spot. `ringkas` is the small version that sits inside a card (one
 * Tilawa Labs Fest competition): no caption, a quieter button, a one-line confirmation.
 *
 * A club with a questionnaire (PERTANYAAN_CLUB) has no one-tap path: the button, for
 * guest and member alike, leads to /hub/[club]/minat, and interest is recorded there
 * with the answers. A guest signs in first and lands straight on the questions.
 */
export function TombolMinat({
  lang,
  kunci,
  dari,
  masuk,
  minat,
  baruMasuk,
  gender,
  ringkas = false,
  className,
}: {
  lang: Lang;
  kunci: KunciTombol;
  dari: string;
  masuk: boolean;
  minat: Set<MinatKey>;
  /** The page's `?minat=` value. */
  baruMasuk?: string;
  gender?: string | null;
  ringkas?: boolean;
  className?: string;
}) {
  const d = t(lang, gender);
  const tercatat = kunciDari(kunci).every((k) => minat.has(k));
  const label = kunci === "semua" ? d.hub.minatSemua : kunci === "fest" ? d.hub.minatFest : d.hub.minat;
  const kelasTombol = ringkas ? "btn btn-ghost h-10 w-full text-[14px]" : "btn btn-primary w-full sm:w-auto";
  const catatan = kunci === "semua" ? d.hub.minatSemuaCatatan : d.hub.minatCatatan;
  const tersembunyi = (
    <>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="kunci" value={kunci} />
      <input type="hidden" name="dari" value={dari} />
    </>
  );

  if (tercatat && ringkas) {
    return (
      <form action={tarikMinat} role="status" className={`flex flex-wrap items-center justify-between gap-2 ${className ?? ""}`}>
        {tersembunyi}
        <span className="text-[14px] font-semibold text-brand">✓ {d.hub.tercatat}</span>
        <TombolKirim className="text-[13px] text-[var(--color-ink-3)] underline underline-offset-2">{d.hub.batal}</TombolKirim>
      </form>
    );
  }

  if (tercatat) {
    return (
      <div role="status" className={`rounded-[8px] border-[1.5px] border-brand bg-brand-100 px-4 py-3 ${className ?? ""}`}>
        <div className="font-semibold text-brand">✓ {kunci === "semua" ? d.hub.tercatatSemua : d.hub.tercatat}</div>
        <p className="mt-1 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
          {kunci === "fest" ? d.hub.tercatatFestBody : d.hub.tercatatBody}
        </p>
        <form action={tarikMinat} className="mt-2">
          {tersembunyi}
          <TombolKirim className="text-[13px] text-[var(--color-ink-3)] underline underline-offset-2">
            {kunci === "semua" ? d.hub.batalSemua : d.hub.batal}
          </TombolKirim>
        </form>
      </div>
    );
  }

  if (isClub(kunci) && pertanyaanClub(kunci).length) {
    const tanya = `/${lang}/hub/${kunci}/minat`;
    return (
      <div className={className}>
        <TautanKetuk
          href={masuk ? tanya : `/${lang}/masuk?next=${encodeURIComponent(tanya)}`}
          ketuk={kunci}
          className={kelasTombol}
        >
          {label}
        </TautanKetuk>
        {ringkas ? null : <p className="mt-2 text-[13px] text-[var(--color-ink-3)]">{catatan}</p>}
      </div>
    );
  }

  if (!masuk) {
    const next = kembaliKe(lang, dari).denganMinat(kunci);
    return (
      <div className={className}>
        <TautanKetuk
          href={`/${lang}/masuk?next=${encodeURIComponent(next)}`}
          ketuk={kunci}
          className={kelasTombol}
        >
          {label}
        </TautanKetuk>
        {ringkas ? null : <p className="mt-2 text-[13px] text-[var(--color-ink-3)]">{catatan}</p>}
      </div>
    );
  }

  return (
    <form action={nyatakanMinat} className={className}>
      {tersembunyi}
      {baruMasuk === kunci ? <p className="mb-2 text-[14px] font-medium text-brand">{d.hub.konfirmasi}</p> : null}
      <TombolKirim ketuk={kunci} className={kelasTombol}>
        {label}
      </TombolKirim>
      {ringkas ? null : <p className="mt-2 text-[13px] text-[var(--color-ink-3)]">{catatan}</p>}
    </form>
  );
}
