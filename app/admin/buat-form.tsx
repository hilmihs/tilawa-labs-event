"use client";

import { useActionState } from "react";
import { buatAcara, type StatusBuatAcara } from "./event-actions";

const AWAL: StatusBuatAcara = {};

export function BuatForm() {
  const [state, action, pending] = useActionState(buatAcara, AWAL);
  return (
    <form action={action} className="card flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-[17px] font-semibold">New programme</h2>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
          Created as a draft. The slug and the number prefix cannot be changed later —
          both end up in links and participant numbers.
        </p>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="buat-nama">Name</label>
          <input id="buat-nama" name="nama" required className="field" placeholder="Open Lecture 3" />
        </div>
        <div>
          <label className="label" htmlFor="buat-slug">Slug (in the URL)</label>
          <input id="buat-slug" name="slug" required pattern="[A-Za-z0-9-]{3,60}" className="field" placeholder="open-lecture-3" />
        </div>
        <div>
          <label className="label" htmlFor="buat-tanggal">Date</label>
          <input id="buat-tanggal" name="tanggal" type="date" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="buat-prefiks">Number prefix</label>
          <input id="buat-prefiks" name="prefiks_nomor" required pattern="[A-Za-z0-9]{2,8}" className="field" placeholder="the institute" />
        </div>
        <div>
          <label className="label" htmlFor="buat-jenis">Type</label>
          <select id="buat-jenis" name="jenis" defaultValue="acara" className="field">
            <option value="acara">Event</option>
            <option value="kelas">Class</option>
            <option value="seleksi">Selection</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn btn-primary self-start" disabled={pending}>
        {pending ? "Creating…" : "Create draft"}
      </button>
    </form>
  );
}
