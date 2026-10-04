"use client";

import { useActionState, useState } from "react";
import { simpanAcara, type StatusSimpanAcara } from "./event-actions";

const AWAL: StatusSimpanAcara = {};

export type NilaiAcara = {
  nama: string;
  namaAr: string | null;
  judul: string | null;
  judulAr: string | null;
  pemateri: string | null;
  pemateriAr: string | null;
  penyelenggara: string | null;
  tanggal: string;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  waktuWajibTiba: string | null;
  lokasi: string | null;
  lokasiAr: string | null;
  alamat: string | null;
  alamatAr: string | null;
  petaUrl: string | null;
  petaGambarUrl: string | null;
  petaEmbedUrl: string | null;
  tatibUrl: string | null;
  feedbackUrl: string | null;
  gateIkhwan: string | null;
  gateAkhwat: string | null;
  kuota: number | null;
  kuotaIkhwan: number | null;
  kuotaAkhwat: number | null;
  otsBuka: boolean;
  waGrupIkhwan: string | null;
  waGrupAkhwat: string | null;
  waAdmin: string | null;
  agenda: Array<{ jam: string; en: string; ar: string }> | null;
  jenis: string;
  pakaiTiket: boolean;
  deskripsi: string | null;
  deskripsiAr: string | null;
  posterUrl: string | null;
  tampil: boolean;
  urutan: number;
};

const jam5 = (v: string | null) => (v ? v.slice(0, 5) : "");

export function EventForm({ slug, awal }: { slug: string; awal: NilaiAcara }) {
  const [state, action, pending] = useActionState(simpanAcara, AWAL);
  const [agenda, setAgenda] = useState(
    awal.agenda?.length ? awal.agenda : [{ jam: "", en: "", ar: "" }],
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="slug" value={slug} />
      {state.error ? (
        <p
          role="alert"
          className="rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-4 py-3 text-[14px] text-[var(--color-danger)]"
        >
          {state.error}
        </p>
      ) : null}
      {state.tersimpan ? (
        <p className="rounded-[8px] bg-brand-100 px-4 py-3 text-[14px] font-semibold text-brand">
          Saved. The public pages already show it — no redeploy needed.
        </p>
      ) : null}

      <Bagian judul="Programme type and visibility">
        <Dua>
          <div>
            <label className="label" htmlFor="jenis">Type</label>
            <select id="jenis" name="jenis" defaultValue={awal.jenis} className="field">
              <option value="acara">Event — one day, QR ticket at the door</option>
              <option value="kelas">Class — several meetings, committee accepts</option>
              <option value="seleksi">Selection — documents, committee decides</option>
            </select>
          </div>
          <F label="Order in the public list (lower first)" name="urutan" v={String(awal.urutan)} type="number" />
        </Dua>
        <label className="flex items-center gap-3 text-[14px]">
          <input type="checkbox" name="tampil" defaultChecked={awal.tampil} className="h-5 w-5 accent-[var(--color-brand)]" />
          Show on the public programme list
        </label>
        <label className="flex items-center gap-3 text-[14px]">
          <input type="checkbox" name="pakai_tiket" defaultChecked={awal.pakaiTiket} className="h-5 w-5 accent-[var(--color-brand)]" />
          Issue a QR ticket
        </label>
        <Dua>
          <F label="Description" name="deskripsi" v={awal.deskripsi} area />
          <F label="Description (Arabic)" name="deskripsi_ar" v={awal.deskripsiAr} area rtl />
        </Dua>
        <F
          label="Poster image URL (not shown yet — reserved for a later phase)"
          name="poster_url"
          v={awal.posterUrl}
        />
      </Bagian>

      <Bagian judul="What it is called">
        <Dua>
          <F label="Event name" name="nama" v={awal.nama} req />
          <F label="Event name (Arabic)" name="nama_ar" v={awal.namaAr} rtl />
        </Dua>
        <Dua>
          <F label="Lecture title" name="judul" v={awal.judul} />
          <F label="Lecture title (Arabic)" name="judul_ar" v={awal.judulAr} rtl />
        </Dua>
        <Dua>
          <F label="Speaker" name="pemateri" v={awal.pemateri} />
          <F label="Speaker (Arabic)" name="pemateri_ar" v={awal.pemateriAr} rtl />
        </Dua>
        <F label="Organised by (optional)" name="penyelenggara" v={awal.penyelenggara} />
      </Bagian>

      <Bagian judul="When">
        <Dua>
          <F label="Date" name="tanggal" v={awal.tanggal} type="date" req />
          <F label="Doors open (must arrive by)" name="waktu_wajib_tiba" v={jam5(awal.waktuWajibTiba)} type="time" />
        </Dua>
        <Dua>
          <F label="Starts" name="waktu_mulai" v={jam5(awal.waktuMulai)} type="time" />
          <F label="Ends" name="waktu_selesai" v={jam5(awal.waktuSelesai)} type="time" />
        </Dua>
      </Bagian>

      <Bagian judul="Where">
        <Dua>
          <F label="Venue" name="lokasi" v={awal.lokasi} />
          <F label="Venue (Arabic)" name="lokasi_ar" v={awal.lokasiAr} rtl />
        </Dua>
        <Dua>
          <F label="Address" name="alamat" v={awal.alamat} area />
          <F label="Address (Arabic)" name="alamat_ar" v={awal.alamatAr} area rtl />
        </Dua>
        <F label="Map link (the button participants tap)" name="peta_url" v={awal.petaUrl} />
        <F
          label="Site plan image URL — shown on the landing page"
          name="peta_gambar_url"
          v={awal.petaGambarUrl}
        />
        <F
          label="…or an embed URL (Google Maps ending in &output=embed, or an OSM embed)"
          name="peta_embed_url"
          v={awal.petaEmbedUrl}
        />
        <Dua>
          {/* These two words are printed on every ticket. */}
          <F label="Gate for brothers" name="gate_ikhwan" v={awal.gateIkhwan} />
          <F label="Gate for sisters" name="gate_akhwat" v={awal.gateAkhwat} />
        </Dua>
      </Bagian>

      <Bagian
        judul="Capacity"
        catatan="Set the two sides separately — they are separate rooms with separate doors, and one total can be met while one side overflows and the other has empty rows. Online registration fills the quota and then the form says the hall is full. There is no waiting list."
      >
        <Dua>
          <F label="Seats — brothers" name="kuota_ikhwan" v={awal.kuotaIkhwan?.toString() ?? ""} type="number" />
          <F label="Seats — sisters" name="kuota_akhwat" v={awal.kuotaAkhwat?.toString() ?? ""} type="number" />
        </Dua>
        <F label="Hall total — ignored when brothers or sisters is filled" name="kuota" v={awal.kuota?.toString() ?? ""} type="number" />
        <p className="text-[13px] leading-[1.5] text-[var(--color-ink-2)]">
          With the two sides filled in, the total is not used — the hall is brothers plus
          sisters. Lowering a number takes nobody&apos;s seat back.
        </p>
      </Bagian>

      <Bagian
        judul="Walk-in on the day"
        catatan="Walk-ins register themselves through a link you share at the venue. Each gets a number in their side's queue and a ticket with no QR; from the dashboard's Walk-in tab you let them in one by one, a few at a time, or all at once, against the seats still free. The gate refuses a walk-in until then."
      >
        <label className="flex items-start gap-3 rounded-[8px] bg-white px-4 py-3.5 text-[14px] leading-[1.5] ring-1 ring-[var(--color-line)]">
          <input
            type="checkbox"
            name="ots_buka"
            defaultChecked={awal.otsBuka}
            className="mt-0.5 h-5 w-5 flex-none accent-[var(--color-brand)]"
          />
          <span>
            <strong className="font-semibold">Open the walk-in link.</strong> Off by default. It works
            whatever the online form&apos;s status, so open it on the day and close it when the hall is
            full. The link: <code className="rounded bg-[var(--color-surface)] px-1">/ar/p/{slug}/ots</code>{" "}
            (or <code className="rounded bg-[var(--color-surface)] px-1">/en/…</code>).
          </span>
        </label>
      </Bagian>

      <Bagian
        judul="Contact and links"
        catatan="These used to be build-time settings. A group that hits its 1,024-member cap can now be swapped here without a redeploy."
      >
        <Dua>
          {/* One link per line; a group fills up at 1,024 and a second one is opened. */}
          <F
            label="WhatsApp groups — brothers (one link per line, optional name before a |)"
            name="wa_grup_ikhwan"
            v={awal.waGrupIkhwan}
            area
          />
          <F
            label="WhatsApp groups — sisters (one link per line, optional name before a |)"
            name="wa_grup_akhwat"
            v={awal.waGrupAkhwat}
            area
          />
        </Dua>
        <Dua>
          <F label="Admin number shown to participants" name="wa_admin" v={awal.waAdmin} />
          <F label="House rules link" name="tatib_url" v={awal.tatibUrl} />
        </Dua>
        <F
          label="Feedback link (shown on the ticket once the event is over)"
          name="feedback_url"
          v={awal.feedbackUrl}
        />
      </Bagian>

      <Bagian judul="Schedule" catatan="Shown on the landing page. Leave a row blank to drop it.">
        <div className="flex flex-col gap-2">
          {agenda.map((row, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <input
                name="agenda_jam"
                defaultValue={row.jam}
                placeholder="07:30"
                className="field w-[92px] flex-none"
              />
              <input
                name="agenda_en"
                defaultValue={row.en}
                placeholder="Doors open"
                className="field min-w-[140px] flex-1"
              />
              <input
                name="agenda_ar"
                defaultValue={row.ar}
                placeholder="فتح الأبواب"
                dir="rtl"
                className="field min-w-[140px] flex-1"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setAgenda((a) => [...a, { jam: "", en: "", ar: "" }])}
            className="self-start text-[13px] font-semibold text-brand underline"
          >
            Add a row
          </button>
        </div>
      </Bagian>

      <button type="submit" className="btn btn-primary self-start" disabled={pending}>
        {pending ? "Saving…" : "Save event details"}
      </button>
    </form>
  );
}

function Bagian({
  judul,
  catatan,
  children,
}: {
  judul: string;
  catatan?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-[var(--color-line)] pt-4">
      <legend className="sr-only">{judul}</legend>
      <div>
        <h3 className="text-[15px] font-semibold">{judul}</h3>
        {catatan ? (
          <p className="mt-1 text-[13px] leading-[1.5] text-[var(--color-ink-2)]">{catatan}</p>
        ) : null}
      </div>
      {children}
    </fieldset>
  );
}

function Dua({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}

function F({
  label,
  name,
  v,
  type = "text",
  req = false,
  area = false,
  rtl = false,
}: {
  label: string;
  name: string;
  v?: string | null;
  type?: string;
  req?: boolean;
  area?: boolean;
  rtl?: boolean;
}) {
  const common = {
    id: name,
    name,
    defaultValue: v ?? "",
    required: req,
    className: "field",
    dir: rtl ? ("rtl" as const) : undefined,
  };
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      {area ? <textarea {...common} rows={2} /> : <input {...common} type={type} />}
    </div>
  );
}
