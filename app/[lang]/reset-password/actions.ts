"use server";

import { redirect } from "next/navigation";
import { buatSesiAkun } from "@/lib/auth/akun";
import { PANJANG_MIN_PASSWORD } from "@/lib/auth/password";
import { ambilPenggunaByWa, gantiPassword, periksaOtp } from "@/lib/akun/queries";
import { bolehMasuk, catatAksesAkun, tautanAbsolut } from "@/lib/akun/batas";
import { kirimEmail } from "@/lib/email/kirim";
import { templatePasswordDiubah } from "@/lib/email/template";
import { ipHashPermintaan } from "@/lib/keamanan";
import { normalizePhone } from "@/lib/wa";
import { isLang, type Lang } from "@/lib/i18n/dict";

export type StatusReset = { error?: "kode_salah" | "kode_kadaluarsa" | "password_pendek" | "laju"; wa?: string };

export async function kirimReset(_prev: StatusReset, form: FormData): Promise<StatusReset> {
  const langRaw = String(form.get("lang") ?? "ar");
  const lang: Lang = isLang(langRaw) ? langRaw : "ar";
  const waMentah = String(form.get("wa") ?? "");
  const wa = normalizePhone(waMentah);
  const password = String(form.get("password") ?? "");

  // Code guessing across many numbers from one address is capped by the sign-in limiter.
  const ipHash = await ipHashPermintaan();
  if (!(await bolehMasuk(ipHash, wa))) return { error: "laju", wa: waMentah };
  if (password.length < PANJANG_MIN_PASSWORD) return { error: "password_pendek", wa: waMentah };

  const p = wa ? await ambilPenggunaByWa(wa) : null;
  if (!p || !p.aktif) {
    await catatAksesAkun({ jenis: "login", wa, ipHash, berhasil: false });
    return { error: "kode_salah", wa: waMentah };
  }

  const keadaan = await periksaOtp(p.id, "reset", String(form.get("kode") ?? ""));
  if (keadaan !== "cocok") {
    await catatAksesAkun({ jenis: "login", wa, ipHash, berhasil: false });
    return { error: keadaan === "salah" ? "kode_salah" : "kode_kadaluarsa", wa: waMentah };
  }

  const baru = await gantiPassword(p.id, password);
  try {
    await kirimEmail({ ke: baru.email, ...templatePasswordDiubah(lang, tautanAbsolut(`/${lang}/lupa-password`)) });
  } catch (e) {
    console.error("[reset-password] notice not sent:", (e as Error).message);
  }
  await buatSesiAkun(baru);
  redirect(`/${lang}/akun?ok=password`);
}
