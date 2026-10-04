import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffNav } from "@/components/staff-nav";
import { punyaAkses } from "@/lib/auth/sesi";
import { STATUS_ADUAN, daftarAduan, type StatusAduan } from "@/lib/aduan/queries";
import { normalizePhone } from "@/lib/wa";
import { formatAngka, formatJam, formatTanggal } from "@/lib/waktu";
import { ubahAduanAction } from "./actions";

export const dynamic = "force-dynamic";

const PER_HALAMAN = 50;

const LABEL_STATUS: Record<StatusAduan, string> = {
  baru: "New",
  diproses: "In progress",
  selesai: "Done",
};

const WARNA_STATUS: Record<StatusAduan, string> = {
  baru: "bg-[var(--color-warn)] text-[var(--color-ink)]",
  diproses: "bg-brand-100 text-brand",
  selesai: "bg-[var(--color-surface)] text-[var(--color-ink-3)]",
};

const LABEL_BAHASA: Record<string, string> = { en: "English", ar: "Arabic", id: "Indonesian" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Param = { status?: string; q?: string; hal?: string; acara?: string };

/**
 * Complaints sent from the public site.
 *
 * Reading is open to the committee code, the same level that already sees every
 * participant's WhatsApp number on /panel/list, so the contact details here are no
 * wider exposure. Changing a ticket stays admin-only (see actions.ts).
 */
export default async function AdminAduan({ searchParams }: { searchParams: Promise<Param> }) {
  const sesi = await punyaAkses("panitia");
  if (!sesi) redirect("/gate?next=%2Fadmin%2Faduan");
  const bolehUbah = sesi.peran === "admin";

  const sp = await searchParams;
  const status = (STATUS_ADUAN as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as StatusAduan)
    : undefined;
  const q = sp.q?.trim() || undefined;
  const halaman = Math.max(1, Math.floor(Number(sp.hal) || 1));

  const { baris, total, hitung } = await daftarAduan({
    status,
    q,
    limit: PER_HALAMAN,
    offset: (halaman - 1) * PER_HALAMAN,
  });
  const jumlahHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const dari = total === 0 ? 0 : (halaman - 1) * PER_HALAMAN + 1;
  const sampai = Math.min(total, halaman * PER_HALAMAN);
  const semua = hitung.baru + hitung.diproses + hitung.selesai;

  const qs = (patch: Partial<Record<keyof Param, string | undefined>>) => {
    const p = new URLSearchParams();
    // Changing a filter goes back to the first page; only the pager keeps `hal`.
    const gabung = { acara: sp.acara, status, q, hal: undefined, ...patch };
    for (const [k, v] of Object.entries(gabung)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/aduan?${s}` : "/admin/aduan";
  };

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[var(--color-surface)] pb-16">
      <StaffNav current="aduan" nama={sesi.nama} acara={sp.acara} />
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-3 px-4 pt-5 sm:px-5">
        <h1 className="text-xl font-semibold">Complaints</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Chip href={qs({ status: undefined })} on={!status} label={`All · ${formatAngka(semua)}`} />
          {STATUS_ADUAN.map((s) => (
            <Chip
              key={s}
              href={qs({ status: s })}
              on={status === s}
              label={`${LABEL_STATUS[s]} · ${formatAngka(hitung[s])}`}
            />
          ))}
        </div>

        <form action="/admin/aduan" className="flex gap-2">
          {sp.acara ? <input type="hidden" name="acara" value={sp.acara} /> : null}
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <input
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Ticket, message, name, contact, participant no."
            className="field min-w-0 flex-1"
          />
          <button className="btn btn-ghost shrink-0">Search</button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-[var(--color-ink-2)]">
          <span>
            {total === 0
              ? "No complaints match that."
              : `${formatAngka(dari)}–${formatAngka(sampai)} of ${formatAngka(total)} · newest first`}
          </span>
          <Pager halaman={halaman} jumlah={jumlahHalaman} href={(h) => qs({ hal: String(h) })} />
        </div>

        <ul className="flex flex-col gap-3">
          {baris.map((a) => {
            const st = (STATUS_ADUAN as readonly string[]).includes(a.status) ? (a.status as StatusAduan) : "baru";
            return (
              <li key={a.id} className="card min-w-0 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-[15px] font-semibold">{a.nomor}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${WARNA_STATUS[st]}`}>
                    {LABEL_STATUS[st]}
                  </span>
                  <span className="text-[13px] text-[var(--color-ink-3)]">
                    {formatTanggal(a.createdAt)} · {formatJam(a.createdAt)} WIB
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[14px]">
                  <Baris label="Programme">{a.acaraNama ?? a.slug ?? "—"}</Baris>
                  <Baris label="Page">
                    <span className="break-all">{a.halaman}</span>
                  </Baris>
                  {a.nomorPeserta ? (
                    <Baris label="Participant">
                      <span className="font-mono">{a.nomorPeserta}</span>
                      {" · "}
                      <Link
                        href={`/panel/list?${new URLSearchParams({
                          ...(a.slug ? { acara: a.slug } : {}),
                          q: a.nomorPeserta,
                        }).toString()}`}
                        className="font-medium text-brand underline"
                      >
                        Open participant
                      </Link>
                    </Baris>
                  ) : null}
                  {a.nama ? <Baris label="Name">{a.nama}</Baris> : null}
                  {a.kontak ? (
                    <Baris label="Contact">
                      <Kontak nilai={a.kontak} />
                    </Baris>
                  ) : null}
                  {a.lang ? <Baris label="Language">{LABEL_BAHASA[a.lang] ?? a.lang}</Baris> : null}
                </dl>

                <p
                  dir="auto"
                  className="mt-3 whitespace-pre-wrap break-words rounded-[8px] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-[15px] leading-relaxed"
                >
                  {a.pesan}
                </p>

                {bolehUbah ? (
                  <form
                    key={a.updatedAt.getTime()}
                    action={ubahAduanAction}
                    className="mt-3 grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-start"
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <select name="status" defaultValue={st} className="field" aria-label="Status">
                      {STATUS_ADUAN.map((s) => (
                        <option key={s} value={s}>
                          {LABEL_STATUS[s]}
                        </option>
                      ))}
                    </select>
                    <textarea
                      name="catatanAdmin"
                      defaultValue={a.catatanAdmin ?? ""}
                      placeholder="Admin note (only staff see this)"
                      aria-label="Admin note"
                      rows={2}
                      maxLength={4000}
                      className="field !min-h-[48px]"
                    />
                    <button className="btn btn-primary">Save</button>
                  </form>
                ) : a.catatanAdmin ? (
                  <p className="mt-3 whitespace-pre-wrap break-words text-[14px] text-[var(--color-ink-2)]">
                    <span className="font-semibold">Admin note: </span>
                    {a.catatanAdmin}
                  </p>
                ) : null}

                {a.updatedAt.getTime() - a.createdAt.getTime() > 1000 ? (
                  <p className="mt-2 text-[12px] text-[var(--color-ink-3)]">
                    Updated {formatTanggal(a.updatedAt)} · {formatJam(a.updatedAt)} WIB
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        {jumlahHalaman > 1 ? (
          <div className="flex justify-end">
            <Pager halaman={halaman} jumlah={jumlahHalaman} href={(h) => qs({ hal: String(h) })} />
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-[var(--color-ink-3)]">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

/** A phone number opens WhatsApp, an address opens mail, anything else is shown as typed. */
function Kontak({ nilai }: { nilai: string }) {
  const teks = nilai.trim();
  if (EMAIL.test(teks)) {
    return (
      <a href={`mailto:${teks}`} className="break-all font-medium text-brand underline">
        {teks}
      </a>
    );
  }
  const wa = normalizePhone(teks);
  if (wa) {
    return (
      <a
        href={`https://wa.me/${wa}`}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-medium text-brand underline"
      >
        {teks}
      </a>
    );
  }
  return <span className="break-all">{teks}</span>;
}

function Pager({ halaman, jumlah, href }: { halaman: number; jumlah: number; href: (h: number) => string }) {
  if (jumlah <= 1) return null;
  return (
    <nav className="flex items-center gap-1.5 text-[13px]" aria-label="Pages">
      {halaman > 1 ? (
        <Link href={href(halaman - 1)} className="rounded-[6px] border border-[var(--color-line)] bg-white px-2.5 py-1">
          ← Prev
        </Link>
      ) : null}
      <span className="px-1.5">
        Page {halaman} of {jumlah}
      </span>
      {halaman < jumlah ? (
        <Link href={href(halaman + 1)} className="rounded-[6px] border border-[var(--color-line)] bg-white px-2.5 py-1">
          Next →
        </Link>
      ) : null}
    </nav>
  );
}

function Chip({ href, on, label }: { href: string; on: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-[8px] border px-3 py-1.5 text-[13px] font-medium ${
        on
          ? "border-brand bg-brand-100 font-semibold text-brand"
          : "border-[var(--color-line)] bg-white text-[var(--color-ink-2)]"
      }`}
    >
      {label}
    </Link>
  );
}
