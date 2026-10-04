"use server";

import { redirect } from "next/navigation";
import { buatSesiAkun } from "@/lib/auth/akun";
import { tujuanAman } from "@/lib/auth/tujuan";
import { periksaMasuk } from "@/lib/akun/queries";
import { bolehMasuk, catatAksesAkun } from "@/lib/akun/batas";
import { ipHashPermintaan } from "@/lib/keamanan";
import { normalizePhone } from "@/lib/wa";
import { isLang, type Lang } from "@/lib/i18n/dict";

export type StatusMasuk = { error?: "gagal_masuk" | "laju"; wa?: string };

export async function kirimMasuk(_prev: StatusMasuk, form: FormData): Promise<StatusMasuk> {
  const langRaw = String(form.get("lang") ?? "ar");
  const lang: Lang = isLang(langRaw) ? langRaw : "ar";
  const waMentah = String(form.get("wa") ?? "");
  const wa = normalizePhone(waMentah);

  const ipHash = await ipHashPermintaan();
  if (!(await bolehMasuk(ipHash, wa))) return { error: "laju", wa: waMentah };

  // One message for every failure: an unknown number and a wrong password look the same.
  const p = await periksaMasuk(waMentah, String(form.get("password") ?? ""));
  await catatAksesAkun({ jenis: "login", wa, ipHash, berhasil: Boolean(p) });
  if (!p) return { error: "gagal_masuk", wa: waMentah };

  await buatSesiAkun(p);
  redirect(tujuanAman(String(form.get("next") ?? ""), lang));
}
