import type { Acara } from "@/db/schema";
import { semuaProgram } from "@/lib/acara/queries";
import { pilihAcaraStaf } from "@/lib/acara/pilih-action";
import { labelStatusAcara } from "@/lib/acara/view-model";

/**
 * Which programme the staff screens are showing. A plain form, no JavaScript:
 * choosing submits, the action sets a cookie and sends you back to `next`.
 */
export async function PilihAcara({ sekarang, next }: { sekarang: Acara | null; next: string }) {
  const daftar = await semuaProgram();
  if (daftar.length === 0) return null;

  return (
    <form action={pilihAcaraStaf} className="flex min-w-0 items-center gap-2 text-[13px]">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="pilih-acara" className="hidden text-[var(--color-ink-3)] sm:inline">
        Programme
      </label>
      <select
        id="pilih-acara"
        name="slug"
        // React resets the form once the action resolves, and when `next` is this same
        // page the node is reconciled in place — it would snap back to the first option.
        // Keying on the slug remounts the select so the new default actually shows.
        key={sekarang?.slug ?? "auto"}
        defaultValue={sekarang?.slug ?? ""}
        // Narrower on a phone, so the scanner bar never pushes the page sideways.
        className="field h-9 w-[220px] min-w-0 max-w-[52vw] text-[13px]"
      >
        {/* Without this, a null `sekarang` would silently display the first programme. */}
        <option value="" disabled>
          Choose…
        </option>
        {daftar.map((a) => (
          <option key={a.slug} value={a.slug}>
            {a.nama} · {a.tanggal} · {labelStatusAcara(a.status)}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-ghost h-9 px-3 text-[13px]">
        Switch
      </button>
    </form>
  );
}
