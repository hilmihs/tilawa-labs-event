import { redirect } from "next/navigation";
import { punyaAkses } from "@/lib/auth/sesi";
import { acaraUntukStaf } from "@/lib/acara/pilih";
import { daftarCetak } from "@/lib/acara/queries";
import { formatTanggalIso } from "@/lib/waktu";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

const PER_HALAMAN = 26;

/**
 * The paper fallback for when the whole system is down. No colour, no coloured
 * logo, a wide signature column, and it prints from the browser with no PDF library.
 */
export default async function Print({
  searchParams,
}: {
  searchParams: Promise<{ g?: string; acara?: string }>;
}) {
  const sesi = await punyaAkses("panitia");
  if (!sesi) redirect("/gate?next=%2Fprint");

  const sp = await searchParams;
  const ev = await acaraUntukStaf(sp.acara);
  if (!ev) return <main className="p-10">No event configured.</main>;

  const acaraQs = encodeURIComponent(ev.slug);
  const semua = await daftarCetak(ev.id);
  const filter = sp.g === "ikhwan" || sp.g === "akhwat" ? sp.g : null;
  const baris = filter ? semua.filter((p) => p.gender === filter) : semua;

  const halaman: (typeof baris)[] = [];
  for (let i = 0; i < baris.length; i += PER_HALAMAN) {
    halaman.push(baris.slice(i, i + PER_HALAMAN));
  }
  if (halaman.length === 0) halaman.push([]);

  return (
    <main className="bg-[var(--color-canvas)] print:bg-white">
      <div className="no-print flex flex-wrap items-center gap-3 border-b border-[var(--color-line)] bg-white px-5 py-3">
        <span className="text-[15px] font-semibold">Backup attendance list</span>
        {/* The programme rides along, or a filter click drops back to the default one. */}
        <a href={`/print?acara=${acaraQs}`} className="btn btn-ghost h-10 text-[13px]">
          All
        </a>
        <a href={`/print?acara=${acaraQs}&g=ikhwan`} className="btn btn-ghost h-10 text-[13px]">
          Brothers
        </a>
        <a href={`/print?acara=${acaraQs}&g=akhwat`} className="btn btn-ghost h-10 text-[13px]">
          Sisters
        </a>
        <span className="ms-auto text-[13px] text-[var(--color-ink-2)]">
          {baris.length} rows · {halaman.length} pages · use the browser&apos;s print dialog
        </span>
      </div>

      {halaman.map((rows, hi) => (
        <section
          key={hi}
          className="print-sheet mx-auto my-5 w-[794px] max-w-full bg-white p-12 text-black shadow-sm print:my-0 print:w-auto print:p-0 print:shadow-none"
        >
          <div className="flex items-start justify-between border-b-2 border-black pb-3.5">
            <div className="flex items-start gap-4">
              {/* Black and white only on paper — no colour, no grey logo. */}
              <Logo kind="mark" height={34} tone="mono" decorative className="mt-0.5" />
              <div>
              <div className="text-[19px] font-bold leading-[1.3]">Backup attendance list</div>
              <div className="mt-1 text-[14px] leading-[1.5]">
                {ev.nama} · {formatTanggalIso(ev.tanggal, "en")} · {ev.lokasi}
              </div>
              </div>
            </div>
            <div className="text-right text-[12px] leading-[1.6]">
              {ev.penyelenggara ? (
                <>
                  {ev.penyelenggara}
                  <br />
                </>
              ) : null}
              Page {hi + 1} of {halaman.length}
            </div>
          </div>

          <div className="flex flex-wrap gap-8 border-b border-black py-3 text-[12px] leading-[1.5]">
            <div>
              Gate:{" "}
              <strong className="font-bold">
                {filter === "akhwat"
                  ? "South (sisters)"
                  : filter === "ikhwan"
                    ? "North (brothers)"
                    : "All"}
              </strong>
            </div>
            <div>Usher: ______________</div>
            <div>Start: ______ End: ______</div>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black text-left text-[12px] font-bold leading-[1.3]">
                <th className="w-[34px] py-2">No</th>
                <th className="w-[130px] py-2">Number</th>
                <th className="py-2">Name</th>
                <th className="w-[92px] py-2">Status</th>
                <th className="w-[118px] py-2">Programme</th>
                <th className="w-[168px] py-2">Signature</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.nomor} className="border-b border-[#C9CDC6] text-[13px] leading-[1.4]">
                  <td className="py-2.5">{hi * PER_HALAMAN + i + 1}</td>
                  <td className="py-2.5">{p.nomor}</td>
                  <td className="py-2.5">
                    {p.nama}
                    {p.konfirmasi === false ? (
                      <strong className="ms-2 font-bold">(released seat)</strong>
                    ) : null}
                  </td>
                  <td className="py-2.5">
                    {p.statusLipia === "mahasiswa"
                      ? "Student"
                      : p.statusLipia === "khirrij"
                        ? "Graduate"
                        : p.statusLipia === "mutarabbish"
                          ? "Mutarabbish"
                          : "—"}
                  </td>
                  <td className="py-2.5">
                    {p.statusLipia === "mahasiswa"
                      ? [p.prodi, p.sesi === "pagi" ? "morning" : p.sesi === "sore" ? "afternoon" : p.sesi].filter(Boolean).join(" / ") || "—"
                      : (p.tahunLulus ?? "—")}
                  </td>
                  <td className="py-2.5" />
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-between text-[12px] leading-[1.6]">
            <div className="max-w-[420px]">
              Use this list only if QR scanning is unavailable. Cross off each participant number
              as they enter and take a signature.
            </div>
            <div className="text-right">
              Arrivals on this page: ______
              <br />
              Verified: ______________
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
