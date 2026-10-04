"use client";

import { useActionState, useState } from "react";
import {
  jalankanImpor,
  pratinjauImpor,
  type HasilImpor,
  type PratinjauImpor,
} from "./actions";

/**
 * The schedule-recovery bridge: if the site is not live on the day registration was
 * meant to open, a Google Form runs that night and its CSV lands here.
 */
export function ImportForm({ slug }: { slug: string }) {
  const [pratinjau, aksiPratinjau, sedangPratinjau] = useActionState<
    PratinjauImpor | null,
    FormData
  >(pratinjauImpor, null);
  const [hasil, aksiJalankan, sedangJalan] = useActionState<HasilImpor | null, FormData>(
    jalankanImpor,
    null,
  );
  const [teks, setTeks] = useState("");

  return (
    <section className="card p-5">
      <h2 className="text-[17px] font-semibold">Import a CSV</h2>
      <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
        Column names are matched loosely (name / nama, wa / whatsapp / phone, gender,
        status, nim, prodi, sesi, semester, tahun lulus, domisili, email). Nothing is
        written until you press Import.
      </p>

      <form action={aksiPratinjau} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="slug" value={slug} />
        <input
          type="file"
          name="csv"
          accept=".csv,text/csv,text/plain"
          className="field pt-3 text-[14px]"
        />
        <textarea
          name="csv_teks"
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          placeholder="…or paste the CSV here"
          className="field font-mono text-[13px]"
          rows={5}
        />
        <button type="submit" className="btn btn-ghost self-start" disabled={sedangPratinjau}>
          {sedangPratinjau ? "Reading…" : "Preview"}
        </button>
      </form>

      {pratinjau ? (
        <div className="mt-5 rounded-[8px] bg-[var(--color-surface)] p-4">
          <div className="flex flex-wrap gap-6 text-[15px]">
            <Angka label="Rows" n={pratinjau.total} />
            <Angka label="New" n={pratinjau.baru} />
            <Angka label="Updated" n={pratinjau.diperbarui} />
            <Angka label="Rejected" n={pratinjau.ditolak.length} merah />
          </div>

          {pratinjau.ditolak.length > 0 ? (
            <div className="mt-4">
              <div className="text-[13px] font-semibold">Rejected rows</div>
              <ul className="mt-1.5 max-h-40 overflow-auto text-[13px] text-[var(--color-ink-2)]">
                {pratinjau.ditolak.map((d) => (
                  <li key={d.no}>
                    row {d.no}: {d.alasan}
                    {d.wa ? ` — “${d.wa}”` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {pratinjau.contoh.length > 0 ? (
            <div className="mt-4">
              <div className="text-[13px] font-semibold">First rows</div>
              <ul className="mt-1.5 text-[13px] text-[var(--color-ink-2)]">
                {pratinjau.contoh.map((c) => (
                  <li key={c.wa}>
                    {c.nama} · {c.wa} · {c.gender} · {c.status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <form action={aksiJalankan} className="mt-4">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="csv_teks" value={pratinjau.csv ?? ""} />
            <button type="submit" className="btn btn-primary" disabled={sedangJalan}>
              {sedangJalan ? "Importing…" : `Import ${pratinjau.baru + pratinjau.diperbarui} rows`}
            </button>
          </form>
        </div>
      ) : null}

      {hasil ? (
        <p className="mt-4 rounded-[8px] bg-brand-100 px-4 py-3 text-[15px]">
          Imported. {hasil.baru} new, {hasil.diperbarui} updated, {hasil.gagal} failed. Running the
          same file again changes nothing.
        </p>
      ) : null}
    </section>
  );
}

function Angka({ label, n, merah = false }: { label: string; n: number; merah?: boolean }) {
  return (
    <div>
      <div className="text-[13px] text-[var(--color-ink-3)]">{label}</div>
      <div className={`text-[24px] font-bold ${merah && n > 0 ? "text-[var(--color-danger)]" : ""}`}>
        {n}
      </div>
    </div>
  );
}
