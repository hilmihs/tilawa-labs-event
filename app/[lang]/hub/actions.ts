"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { wajibMasuk } from "@/lib/auth/akun";
import { bacaFormJawaban } from "@/lib/hub/jawaban";
import { MAKS_JAWABAN, isClub, isKunciTombol, kunciDari, pertanyaanClub } from "@/lib/hub/konten";
import { kembaliKe } from "@/lib/hub/tautan";
import { batalkanMinat, catatMinat, catatMinatDenganJawaban } from "@/lib/hub/queries";
import { isLang } from "@/lib/i18n/dict";

/*
 * Both actions end back on the page the button was on, without `?minat=`, so a refresh
 * never shows the "tap once more" prompt again. The key is checked against the list
 * and the page against this site's own paths — neither is trusted from the form.
 */

async function baca(form: FormData) {
  const langRaw = String(form.get("lang") ?? "");
  const lang = isLang(langRaw) ? langRaw : "ar";
  const kunci = String(form.get("kunci") ?? "");
  if (!isKunciTombol(kunci)) redirect(`/${lang}/hub`);
  const dari = kembaliKe(lang, String(form.get("dari") ?? ""));
  const p = await wajibMasuk(lang, dari.denganMinat(kunci));
  return { lang, kunci, dari, p };
}

export async function nyatakanMinat(form: FormData): Promise<void> {
  const { lang, kunci, dari, p } = await baca(form);
  await catatMinat(p.id, kunciDari(kunci));
  revalidatePath(`/${lang}/akun`);
  redirect(dari.polos);
}

export async function tarikMinat(form: FormData): Promise<void> {
  const { lang, kunci, dari, p } = await baca(form);
  await batalkanMinat(p.id, kunciDari(kunci));
  revalidatePath(`/${lang}/akun`);
  redirect(dari.polos);
}

export type StatusJawaban = {
  error?: "wajib_diisi" | "umum";
  /** With `wajib_diisi`: the unanswered question ids, in the order the form shows them. */
  kosong?: string[];
  /** What was typed, so the form can show it again — React clears the fields after an action. */
  nilai?: Record<string, string>;
};

/**
 * "I'm interested" for a club that asks a few questions first (/hub/[club]/minat).
 * Validation errors come back as state so the page can point at the blank question;
 * success lands on the club page with the confirmation, like the one-tap button.
 */
export async function kirimJawabanMinat(_prev: StatusJawaban, form: FormData): Promise<StatusJawaban> {
  const langRaw = String(form.get("lang") ?? "");
  const lang = isLang(langRaw) ? langRaw : "ar";
  const club = String(form.get("club") ?? "");
  if (!isClub(club) || !pertanyaanClub(club).length) redirect(`/${lang}/hub`);
  const p = await wajibMasuk(lang, `/${lang}/hub/${club}/minat`);
  const daftar = pertanyaanClub(club);
  const nilai = Object.fromEntries(daftar.map((q) => [q.id, String(form.get(q.id) ?? "").slice(0, MAKS_JAWABAN)]));
  const hasil = bacaFormJawaban(daftar, (id) => nilai[id]);
  if (!hasil.ok) return { error: "wajib_diisi", kosong: hasil.kosong, nilai };
  try {
    await catatMinatDenganJawaban(p.id, club, hasil.jawaban);
  } catch {
    return { error: "umum", nilai };
  }
  revalidatePath(`/${lang}/akun`);
  redirect(`/${lang}/hub/${club}`);
}
