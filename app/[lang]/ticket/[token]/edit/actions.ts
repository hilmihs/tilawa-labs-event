"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { acaraPeserta } from "@/db/schema";
import { ambilAcara, ambilPesertaById } from "@/lib/acara/queries";
import { ambilKembaliKursi } from "@/lib/acara/daftar";
import { verifyTiketToken } from "@/lib/tiket/token";
import { isLang, type Lang } from "@/lib/i18n/dict";
import { latinAtauNull } from "@/lib/wa";

export type StatusEdit = { error?: "invalid" | "nama_pendek" | "umum"; tersimpan?: boolean };

/**
 * The token IS the authorisation.
 *
 * It is signed, scoped, and only reachable by someone who either just registered or
 * passed the number + name lookup. That is exactly the proof of ownership an edit
 * needs, so self-service editing costs no new auth story.
 */
async function pesertaDariToken(token: string) {
  const payload = await verifyTiketToken(token);
  if (!payload) return null;
  const ev = await ambilAcara(payload.slug);
  if (!ev) return null;
  const p = await ambilPesertaById(payload.pid);
  if (!p || p.acaraId !== ev.id || !p.aktif) return null;
  return { ev, peserta: p };
}

export async function simpanEditPeserta(
  _prev: StatusEdit,
  form: FormData,
): Promise<StatusEdit> {
  const token = String(form.get("token") ?? "");
  const langRaw = String(form.get("lang") ?? "en");
  const lang: Lang = isLang(langRaw) ? langRaw : "en";

  const ctx = await pesertaDariToken(token);
  if (!ctx) return { error: "invalid" };

  const nama = String(form.get("nama") ?? "").trim().replace(/\s+/g, " ");
  if (nama.length < 3) return { error: "nama_pendek" };

  const gender = String(form.get("gender")) === "akhwat" ? "akhwat" : "ikhwan";
  const diLipia = String(form.get("lipia") ?? "ya") !== "tidak";
  const statusLipia = diLipia ? String(form.get("status_lipia") ?? "mahasiswa") : null;
  const mahasiswa = diLipia && statusLipia === "mahasiswa";
  const khirrij = diLipia && statusLipia === "khirrij";
  const teks = (k: string) => {
    const v = String(form.get(k) ?? "").trim();
    return v === "" ? null : v;
  };

  /*
   * nomor and kode are NOT touched, including when the gender changes.
   *
   * The gender letter in the number then no longer matches — a sister can hold a
   * "…-B-0042". That drift is deliberate: the number is printed in screenshots and
   * on the paper backup list, and re-issuing it would leave the participant holding
   * a screenshot that disagrees with the list on the very day the system is down.
   * The gate, the WhatsApp group and the attendance list all read `gender`, not the
   * letter, so nothing operational depends on them agreeing.
   */
  const db = getDb();
  try {
    await db
      .update(acaraPeserta)
      .set({
        nama,
        gender,
        lipia: diLipia,
        statusLipia,
        prodi: mahasiswa || khirrij || !diLipia ? teks("prodi") : null,
        sesi: mahasiswa ? teks("sesi") : null,
        semester: mahasiswa ? teks("semester") : null,
        tahunLulus: khirrij ? latinAtauNull(teks("tahun_lulus")) : null,
        domisili: teks("domisili"),
        asalDaerah: teks("asal_daerah"),
        asalSekolah: teks("asal_sekolah"),
        transportasi: teks("transportasi"),
        kebutuhanKhusus: teks("kebutuhan_khusus"),
        email: teks("email"),
        updatedAt: new Date(),
      })
      .where(eq(acaraPeserta.id, ctx.peserta.id));
  } catch {
    return { error: "umum" };
  }

  revalidatePath(`/${lang}/ticket/${token}`);
  redirect(`/${lang}/ticket/${token}?tersimpan=1`);
}

/**
 * "I cannot come."
 *
 * Sets konfirmasi = false and leaves the row active. It is not a deletion and not
 * the spam flag: the seat is released for the waiting list, the trail survives, and
 * the participant can change their mind.
 */
/**
 * "I have joined the WhatsApp group" — the gate in front of the QR.
 *
 * Written once: re-confirming does not move the timestamp, so the committee can read
 * it as when the participant first saw the group, not when they last opened the page.
 */
export async function konfirmasiGrupWa(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "");
  const langRaw = String(form.get("lang") ?? "ar");
  const lang: Lang = isLang(langRaw) ? langRaw : "ar";

  const ctx = await pesertaDariToken(token);
  if (!ctx) redirect(`/${lang}/ticket`);

  await getDb()
    .update(acaraPeserta)
    .set({ grupWaAt: new Date(), updatedAt: new Date() })
    .where(and(eq(acaraPeserta.id, ctx.peserta.id), isNull(acaraPeserta.grupWaAt)));

  revalidatePath(`/${lang}/ticket/${token}`);
  redirect(`/${lang}/ticket/${token}`);
}

export async function ubahKehadiranRencana(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "");
  const langRaw = String(form.get("lang") ?? "en");
  const lang: Lang = isLang(langRaw) ? langRaw : "en";
  const datang = String(form.get("datang")) === "true";

  const ctx = await pesertaDariToken(token);
  if (!ctx) redirect(`/${lang}/ticket`);

  /*
   * Releasing a seat needs the last four digits of the registered number, checked
   * here and not only in the form. The ticket link is recoverable from a number and
   * the first letters of a name — both semi-public in a class group — so the link
   * alone must not be enough to cancel somebody else's registration. Taking a seat
   * back is harmless and needs nothing.
   */
  if (!datang) {
    const wa4 = String(form.get("wa4") ?? "").replace(/\D/g, "");
    if (wa4 !== ctx.peserta.wa.slice(-4)) {
      redirect(`/${lang}/ticket/${token}?gagal_batal=1`);
    }
  }

  /*
   * Coming after all does not simply flip the flag back. Someone else may have
   * registered into the seat since it was released, so taking it back unconditionally
   * would put two people in one chair. ambilKembaliKursi gives a free seat if there
   * is one and otherwise says the hall is full.
   */
  if (datang) {
    const kembali = await ambilKembaliKursi(ctx.peserta.id);
    revalidatePath(`/${lang}/ticket/${token}`);
    redirect(`/${lang}/ticket/${token}${!kembali.ok && kembali.alasan === "penuh" ? "?penuh=1" : ""}`);
  }

  const db = getDb();
  await db
    .update(acaraPeserta)
    .set({ konfirmasi: false, konfirmasiAt: new Date(), updatedAt: new Date() })
    .where(eq(acaraPeserta.id, ctx.peserta.id));

  revalidatePath(`/${lang}/ticket/${token}`);
  redirect(`/${lang}/ticket/${token}`);
}
