import Link from "next/link";
import { redirect } from "next/navigation";
import { punyaAkses } from "@/lib/auth/sesi";
import { jumlahPendaftarPerAcara, semuaProgram } from "@/lib/acara/queries";
import { labelJenis, labelStatusAcara } from "@/lib/acara/view-model";
import { formatTanggalIso } from "@/lib/waktu";
import { StaffNav } from "@/components/staff-nav";
import { BuatForm } from "./buat-form";
import { UjiEmail } from "./uji-email";
import { driverEmail } from "@/lib/email/kirim";
import { daftarAduan } from "@/lib/aduan/queries";
import { SLUG_LATIHAN } from "@/lib/latihan/data";
import { KartuLatihan } from "./latihan";
import { KartuHub } from "./kartu-hub";
import { hubTampil } from "@/lib/pengaturan/queries";

export const dynamic = "force-dynamic";

export default async function AdminDaftar({ searchParams }: { searchParams: Promise<{ latihan?: string }> }) {
  const sesi = await punyaAkses("admin");
  if (!sesi) redirect("/gate?next=%2Fadmin");

  // One grouped count, not one query per programme: the list grows with every event.
  const [program, jumlah, aduan, hub] = await Promise.all([
    semuaProgram(),
    jumlahPendaftarPerAcara(),
    daftarAduan({ status: "baru", limit: 1 }),
    hubTampil(),
  ]);
  const aduanBaru = aduan.hitung.baru;
  const { latihan } = await searchParams;

  return (
    <main className="min-h-dvh bg-[var(--color-surface)] pb-16">
      <StaffNav current="admin" nama={sesi.nama} />
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-4 px-5 pt-6">
        <Link
          href="/admin/aduan"
          className="card flex flex-wrap items-center justify-between gap-2 px-5 py-3"
        >
          <span className="text-[15px] font-semibold">
            Complaints —{" "}
            <span className={aduanBaru > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-ink-3)]"}>
              {aduanBaru} new
            </span>
          </span>
          <span className="text-[14px] font-medium text-brand underline">Open complaints →</span>
        </Link>
        <section className="card overflow-hidden">
          <div className="px-5 py-4">
            <h1 className="text-[17px] font-semibold">Programmes</h1>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[14px]">
              <thead>
                <tr className="border-y border-[var(--color-line)] bg-[var(--color-surface)] text-left text-xs font-semibold text-[var(--color-ink-2)]">
                  <th className="px-5 py-2.5">NAME</th>
                  <th className="px-5 py-2.5">DATE</th>
                  <th className="px-5 py-2.5">TYPE</th>
                  <th className="px-5 py-2.5">STATUS</th>
                  <th className="px-5 py-2.5">PUBLIC</th>
                  <th className="px-5 py-2.5">REGISTERED</th>
                </tr>
              </thead>
              <tbody>
                {program.map((p) => (
                  <tr key={p.slug} className="border-b border-[var(--color-line)]">
                    <td className="px-5 py-3">
                      <Link href={`/admin/${p.slug}`} className="font-semibold underline">
                        {p.nama}
                      </Link>
                      <div className="text-[12px] text-[var(--color-ink-3)]">{p.slug}</div>
                    </td>
                    <td className="px-5 py-3">{formatTanggalIso(p.tanggal, "en")}</td>
                    <td className="px-5 py-3">{labelJenis(p.jenis, "en")}</td>
                    <td className="px-5 py-3">{labelStatusAcara(p.status)}</td>
                    <td className="px-5 py-3">{p.tampil ? "shown" : "hidden"}</td>
                    <td className="px-5 py-3">{jumlah.get(p.id) ?? 0}</td>
                  </tr>
                ))}
                {program.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-[var(--color-ink-3)]">
                      No programmes yet. Create one below.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        <BuatForm />
        <KartuHub tampil={hub} />
        <KartuLatihan ada={program.some((p) => p.slug === SLUG_LATIHAN)} pesan={latihan} />
        <UjiEmail driver={driverEmail()} dari={process.env.EMAIL_DARI?.trim() || "Tilawa Labs <demo@example.org>"} />
      </div>
    </main>
  );
}
