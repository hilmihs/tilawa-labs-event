"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { punyaAkses } from "@/lib/auth/sesi";
import { ambilAcara } from "@/lib/acara/queries";
import { adaCatatan } from "@/lib/catatan/kajian";
import { driverEmail, kirimEmail } from "@/lib/email/kirim";
import { templateAbsen } from "@/lib/email/template";
import { bisaDiingatkan } from "@/lib/absen/pengingat";
import { daftarAbsen, tandaiAbsen } from "@/lib/absen/queries";
import { basisSitus, linkAbsen } from "@/lib/absen/tautan";

export type StatusEmailAbsen = { ok?: string; error?: string };

/** Sent side by side. SendGrid is happy with this; a few hundred people take a minute or so. */
const SEKALIGUS = 5;
/**
 * Wall-clock budget for one press. The domain's DNS is on Cloudflare, and a proxied
 * request is cut there at 100 seconds whatever `maxDuration` says, so the loop stops
 * short of that and reports what is left rather than ending in an error page.
 */
const BATAS_MS = 75_000;
const EMAIL_SAH = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// One send per programme at a time. If a press outlives the browser's patience and
// the admin presses again, the second one must not pick up the same unsent people.
// One `next start` process serves the site, so a module-level set is enough.
const sedangKirim = new Set<string>();

/**
 * Three modes from one card:
 * - `uji`: one sample to an address the admin types; touches no participant row.
 * - `undangan`: every no-show with an email who has not been sent one.
 * - `pengingat`: once, to those invited at least 12 hours ago who have not answered.
 *
 * `email_at` is written per person only after the provider accepted the message, so
 * a failure or a timeout half-way leaves the rest for the next press and never sends
 * twice.
 */
export async function kirimEmailAbsen(_prev: StatusEmailAbsen, form: FormData): Promise<StatusEmailAbsen> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");
  const ev = await ambilAcara(String(form.get("slug") ?? ""));
  if (!ev) return { error: "Programme not found." };
  if (ev.status !== "selesai") return { error: "Mark the programme finished first — the link only opens after that." };

  const mode = String(form.get("mode") ?? "");
  const basis = basisSitus();
  const catatan = adaCatatan(ev.slug);
  const isi = (nama: string, gender: string, pengingat: boolean) =>
    templateAbsen({
      nama,
      gender,
      judulEn: ev.judul || ev.nama,
      judulAr: ev.judulAr || ev.namaAr || ev.judul || ev.nama,
      linkEn: linkAbsen(basis, "en", ev.slug),
      linkAr: linkAbsen(basis, "ar", ev.slug),
      adaCatatan: catatan,
      pengingat,
    });

  if (mode === "uji") {
    const ke = String(form.get("ke") ?? "").trim();
    if (!EMAIL_SAH.test(ke)) return { error: "That email address does not look right." };
    try {
      await kirimEmail({ ke, ...isi("Ahmad Fauzi", "ikhwan", false) });
    } catch (e) {
      return { error: String((e as Error)?.message ?? e).slice(0, 400) };
    }
    return { ok: `Sample sent to ${ke} (${driverEmail()}). Its buttons open the real page.` };
  }

  if (mode !== "undangan" && mode !== "pengingat") return { error: "Unknown action." };
  if (sedangKirim.has(ev.id)) {
    return { error: "A send for this programme is still running. Wait a minute, reload, and press again for whatever is left." };
  }
  sedangKirim.add(ev.id);
  try {
    const pengingat = mode === "pengingat";
    const rows = await daftarAbsen(ev.id);
    const sasaran = rows.filter(
      (r) =>
        r.email &&
        EMAIL_SAH.test(r.email.trim()) &&
        !r.diisiAt &&
        (pengingat ? bisaDiingatkan(r) : !r.emailAt),
    );

    const mulai = Date.now();
    let terkirim = 0;
    let gagal = 0;
    let galatPertama = "";
    let berhenti = false;
    for (let i = 0; i < sasaran.length; i += SEKALIGUS) {
      if (Date.now() - mulai > BATAS_MS) {
        berhenti = true;
        break;
      }
      await Promise.all(
        sasaran.slice(i, i + SEKALIGUS).map(async (r) => {
          try {
            await kirimEmail({ ke: r.email!.trim(), ...isi(r.nama, r.gender, pengingat) });
            await tandaiAbsen(r.pesertaId, ev.id, pengingat ? "emailIngatAt" : "emailAt");
            terkirim += 1;
          } catch (e) {
            gagal += 1;
            galatPertama ||= String((e as Error)?.message ?? e).slice(0, 200);
          }
        }),
      );
    }
    if (terkirim > 0) revalidatePath(`/admin/${ev.slug}`);
    const sisa = sasaran.length - terkirim;
    const palsu = driverEmail() === "palsu" ? " (fake driver — nothing left the server)" : "";
    return {
      ok: `${pengingat ? "Reminders" : "Invitations"}: ${terkirim} sent${palsu}, ${gagal} failed, ${sisa} left.${
        berhenti ? " Stopped to stay inside the time limit — press again for the rest." : sisa > 0 ? " Press again to retry." : ""
      }${galatPertama ? ` First error: ${galatPertama}` : ""}`,
    };
  } finally {
    sedangKirim.delete(ev.id);
  }
}
