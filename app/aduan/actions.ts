"use server";

import { revalidatePath } from "next/cache";
import { ambilAcara } from "@/lib/acara/queries";
import { slugSah } from "@/lib/acara/view-model";
import { hitungAduanDariIp, simpanAduan } from "@/lib/aduan/queries";
import { penggunaSekarang } from "@/lib/auth/akun";
import { ipHashPermintaan } from "@/lib/keamanan";

export type StatusKirimAduan = { ok?: boolean; nomor?: string; error?: "pesan_pendek" | "laju" | "umum" };

const PESAN_MIN = 10;
const PESAN_MAKS = 2000;
// Generous on purpose: a whole campus can sit behind one NAT address, and a problem
// that hits registration hits many students at the same moment.
const BATAS_PER_JAM = 20;

/** Trimmed, whitespace collapsed, cut to a maximum; empty becomes null. */
function rapikan(v: FormDataEntryValue | null, maks: number): string | null {
  const s = String(v ?? "").replace(/\s+/g, " ").trim().slice(0, maks).trim();
  return s ? s : null;
}

export async function kirimAduan(_prev: StatusKirimAduan, form: FormData): Promise<StatusKirimAduan> {
  // Honeypot: a bot that fills every field gets a believable success and nothing is stored,
  // so it has no signal to adapt to.
  if (String(form.get("hp_website") ?? "").trim()) return { ok: true, nomor: "ADU-0000" };

  const pesan = rapikan(form.get("pesan"), PESAN_MAKS);
  if (!pesan || pesan.length < PESAN_MIN) return { error: "pesan_pendek" };

  try {
    const ipHash = await ipHashPermintaan();
    const sejamLalu = new Date(Date.now() - 60 * 60 * 1000);
    if ((await hitungAduanDariIp(ipHash, sejamLalu)) >= BATAS_PER_JAM) return { error: "laju" };

    const slugMentah = String(form.get("slug") ?? "").trim();
    const ev = slugMentah && slugSah(slugMentah) ? await ambilAcara(slugMentah) : null;
    const pengguna = await penggunaSekarang();

    const { nomor } = await simpanAduan({
      acaraId: ev?.id ?? null,
      slug: ev?.slug ?? null,
      halaman: rapikan(form.get("halaman"), 80) ?? "-",
      pesan,
      nama: rapikan(form.get("nama"), 100),
      kontak: rapikan(form.get("kontak"), 120),
      nomorPeserta: rapikan(form.get("nomor_peserta"), 30),
      penggunaId: pengguna?.id ?? null,
      lang: rapikan(form.get("lang"), 5),
      ipHash,
    });

    revalidatePath("/admin/aduan");
    return { ok: true, nomor };
  } catch (e) {
    console.error("kirimAduan failed", e);
    return { error: "umum" };
  }
}
