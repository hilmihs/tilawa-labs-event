"use server";

import { ambilAcara, catatAkses, hitungAkses } from "@/lib/acara/queries";
import { parseJawabanAbsen } from "@/lib/absen/alasan";
import { kelayakanAbsen } from "@/lib/absen/kelayakan";
import { cariPesertaAbsen, pesertaDariAkun, simpanJawabanAbsen, sudahHadir } from "@/lib/absen/queries";
import { penggunaSekarang } from "@/lib/auth/akun";
import { ipHashPermintaan } from "@/lib/keamanan";
import { empatDigit } from "@/lib/wa";
import type { Peserta } from "@/db/schema";

export type StatusAbsen = {
  error?: "alasan" | "lain" | "wa" | "tidakDitemukan" | "umum";
  tersimpan?: boolean;
};

// The ticket lookup's limit and budget, shared: both turn a WhatsApp number into a
// participant, so someone walking a list of numbers spends one allowance across both.
// See app/api/ticket-lookup/route.ts for why the floor is so high.
const BATAS_GAGAL = Math.max(Number(process.env.BATAS_TIKET_GAGAL_PER_IP) || 0, 1000);
const JENDELA_MENIT = Number(process.env.BATAS_TIKET_JENDELA_MENIT ?? 10);

/**
 * The link is one static page per programme, so who is answering comes from the
 * signed-in account when there is one, and otherwise from the WhatsApp number typed
 * on the last screen.
 *
 * Nothing about the participant is sent back — not the name, and not whether they
 * came: someone who attended (or a walk-in never let in) gets the very same "thank
 * you" as a real answer, and nothing is written. The only thing a stranger can learn
 * is whether a number registered at all, which the owner accepted, and every lookup
 * — found or not — is spent from the ticket lookup's rate-limit budget.
 */
export async function simpanAbsen(_prev: StatusAbsen, form: FormData): Promise<StatusAbsen> {
  const ev = await ambilAcara(String(form.get("slug") ?? ""));
  if (!ev || !ev.tampil || ev.status !== "selesai") return { error: "umum" };

  const hasil = parseJawabanAbsen({
    alasan: form.getAll("alasan").map(String),
    alasanLain: String(form.get("alasan_lain") ?? ""),
    waktu: form.getAll("waktu").map(String),
    pengingat: form.getAll("pengingat").map(String),
    online: String(form.get("online") ?? ""),
    saran: String(form.get("saran") ?? ""),
    kabari: form.get("kabari") === "1",
  });
  if (!hasil.ok) return { error: hasil.error };

  try {
    // The session is read here, never taken from the form: a client-sent id would
    // let anyone answer for anyone.
    const akun = await penggunaSekarang();
    let p: Peserta | null = akun ? await pesertaDariAkun(ev.id, akun.id) : null;

    if (!p) {
      const waMentah = String(form.get("wa") ?? "").trim();
      if (!waMentah) return { error: "wa" };

      const ipHash = await ipHashPermintaan();
      const sejak = new Date(Date.now() - JENDELA_MENIT * 60 * 1000);
      if ((await hitungAkses(ipHash, "tiket", sejak, true)) >= BATAS_GAGAL) return { error: "umum" };
      // Every lookup spends the budget, a hit as much as a miss: recorded like the
      // registration form's spent attempts (berhasil false is what the limiter counts),
      // and not deduplicated — each submit is one more number tried.
      await catatAkses(ev.id, { jenis: "tiket", wa4: empatDigit(waMentah), ipHash, berhasil: false });

      p = await cariPesertaAbsen(ev.id, waMentah);
      if (!p) return { error: "tidakDitemukan" };
    }

    const boleh = kelayakanAbsen({
      statusAcara: ev.status,
      hadir: await sudahHadir(p.id),
      jenis: p.jenis,
      izinOtsAt: p.izinOtsAt,
    });
    if (boleh === "boleh") await simpanJawabanAbsen(p.id, ev.id, hasil.data);
  } catch {
    return { error: "umum" };
  }
  return { tersimpan: true };
}
