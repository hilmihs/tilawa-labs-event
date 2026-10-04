"use server";

import { redirect } from "next/navigation";
import { wajibMasuk } from "@/lib/auth/akun";
import { isLang } from "@/lib/i18n/dict";
import { isSoalSah, soalSesi } from "@/lib/kuis/jadwal";
import { konteksKuis } from "@/lib/kuis/konteks";
import { simpanJawaban } from "@/lib/kuis/queries";
import { slugSah } from "@/lib/acara/view-model";

/**
 * Locking in an answer.
 *
 * Nothing from the form is trusted beyond being a shape: the question number is re-checked
 * against the calendar, the chosen option against the question, and whether it is
 * correct is decided here, from the bank — the page that submitted it never gets a
 * say in whether it was right.
 *
 * Signing in mid-quiz lands back on the same question rather than on the account
 * page, so the answer someone was about to give is still one tap away.
 */
export async function kunciJawaban(form: FormData): Promise<void> {
  const langRaw = String(form.get("lang") ?? "");
  const lang = isLang(langRaw) ? langRaw : "ar";
  const slugRaw = String(form.get("slug") ?? "");
  const slug = slugSah(slugRaw) ? slugRaw : "";
  const nomor = Number(form.get("nomor"));
  const pilih = Number(form.get("pilih"));

  if (!slug || !isSoalSah(nomor)) redirect(`/${lang}/program`);

  const tujuan = `/${lang}/p/${slug}/quiz/${nomor}`;
  const p = await wajibMasuk(lang, tujuan);
  const { mulai } = await konteksKuis(slug);

  await simpanJawaban({ penggunaId: p.id, slug, nomor, pilih, mulai });

  // Always back to the question's own page. It renders the result when an answer
  // exists, so "already answered" and "just answered" land in the same place.
  redirect(tujuan);
}

/**
 * Locking in a whole batch at once: one `pilih_<nomor>` field per question on the
 * batch's page. Each answer goes through the same checks as a single one, so a
 * question already answered is skipped rather than overwritten, and a field for a
 * question outside this batch is ignored.
 */
export async function kunciSesi(form: FormData): Promise<void> {
  const langRaw = String(form.get("lang") ?? "");
  const lang = isLang(langRaw) ? langRaw : "ar";
  const slugRaw = String(form.get("slug") ?? "");
  const slug = slugSah(slugRaw) ? slugRaw : "";
  const sesi = Number(form.get("sesi"));
  const nomor = soalSesi(sesi);

  if (!slug || !nomor.length) redirect(`/${lang}/program`);

  const tujuan = `/${lang}/p/${slug}/quiz/sesi/${sesi}`;
  const p = await wajibMasuk(lang, tujuan);
  const { mulai } = await konteksKuis(slug);

  // One at a time: a handful of inserts, and each keeps its own one-attempt guard.
  for (const n of nomor) {
    const mentah = form.get(`pilih_${n}`);
    if (mentah === null || mentah === "") continue;
    await simpanJawaban({ penggunaId: p.id, slug, nomor: n, pilih: Number(mentah), mulai });
  }

  redirect(tujuan);
}
