import { kodeCocok } from "@/lib/keamanan";
import type { StatusAcara } from "./view-model";

/**
 * The machine door into /api/export and /api/export/semua. With no EXPORT_TOKEN on
 * the server the door is shut outright — an empty token must never match an empty
 * Bearer.
 */
export function bearerCocok(header: string | null): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  return kodeCocok(header.slice(7), process.env.EXPORT_TOKEN);
}

const STATUS_SAH: readonly StatusAcara[] = [
  "draft",
  "pendaftaran",
  "ditutup",
  "berlangsung",
  "selesai",
  "batal",
];

/**
 * `?status=pendaftaran,berlangsung` → that list; absent → every programme. An
 * unknown value is an error rather than a filter that quietly matches nothing: a
 * typo would otherwise look to the other dashboard like every programme vanished.
 */
export function bacaFilterStatus(
  q: string | null,
): { ok: true; status: StatusAcara[] | null } | { ok: false; salah: string[] } {
  const nilai = [...new Set((q ?? "").split(",").map((s) => s.trim()).filter(Boolean))];
  if (nilai.length === 0) return { ok: true, status: null };
  const salah = nilai.filter((s) => !STATUS_SAH.includes(s as StatusAcara));
  if (salah.length > 0) return { ok: false, salah };
  return { ok: true, status: nilai as StatusAcara[] };
}

type ProgramEkspor = {
  id: string;
  slug: string;
  nama: string;
  tanggal: string;
  status: string;
  kuota: number | null;
  jenis: string;
};

/** The programme header both exports send. The internal id stays behind. */
export function kepalaAcara(ev: ProgramEkspor) {
  return {
    slug: ev.slug,
    nama: ev.nama,
    tanggal: ev.tanggal,
    status: ev.status,
    kuota: ev.kuota,
    jenis: ev.jenis,
  };
}

/**
 * One block per programme, in the order given, each shaped like the single-programme
 * export — so a consumer that already reads /api/export reads each block unchanged.
 * A programme nobody has registered for yet still gets its block.
 */
export function kelompokkanPerProgram<P extends { acaraId: string }, K extends { acaraId: string }>(
  program: ProgramEkspor[],
  peserta: P[],
  kehadiran: K[],
) {
  const pesertaPer = kelompok(peserta);
  const hadirPer = kelompok(kehadiran);
  return program.map((ev) => ({
    acara: kepalaAcara(ev),
    peserta: pesertaPer.get(ev.id) ?? [],
    kehadiran: hadirPer.get(ev.id) ?? [],
  }));
}

function kelompok<T extends { acaraId: string }>(baris: T[]): Map<string, T[]> {
  const peta = new Map<string, T[]>();
  for (const b of baris) {
    const ada = peta.get(b.acaraId);
    if (ada) ada.push(b);
    else peta.set(b.acaraId, [b]);
  }
  return peta;
}
