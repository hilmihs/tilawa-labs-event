import { ubahHubTampil } from "./hub-actions";

/** Admin card: show or hide Programme Hub & Fest on the public site. */
export function KartuHub({ tampil }: { tampil: boolean }) {
  return (
    <section className="card flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-[17px] font-semibold">Programme Hub &amp; Fest on the public site</h2>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
          When hidden, the club and Fest pages return 404, the &ldquo;Clubs &amp; Fest&rdquo; link, the teaser and the
          account section are gone, and visitors get the &ldquo;follow us on Instagram&rdquo; popup instead. The
          interest list in the panel keeps working either way.
        </p>
      </div>
      <form action={ubahHubTampil} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="tampil" value={tampil ? "0" : "1"} />
        <span
          className={`rounded-[6px] px-2.5 py-1 text-[13px] font-semibold ${
            tampil ? "bg-brand-100 text-brand" : "bg-[var(--color-surface)] text-[var(--color-ink-3)]"
          }`}
        >
          {tampil ? "Shown" : "Hidden"}
        </span>
        <button type="submit" className={`btn h-10 text-[14px] ${tampil ? "btn-ghost" : "btn-primary"}`}>
          {tampil ? "Hide Hub & Fest" : "Show Hub & Fest"}
        </button>
      </form>
    </section>
  );
}
