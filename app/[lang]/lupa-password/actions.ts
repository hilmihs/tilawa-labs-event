"use server";

import { ambilPenggunaByWa, buatOtp } from "@/lib/akun/queries";
import { bolehMintaOtp, catatAksesAkun, tautanAbsolut } from "@/lib/akun/batas";
import { kirimEmail } from "@/lib/email/kirim";
import { templateOtp } from "@/lib/email/template";
import { ipHashPermintaan } from "@/lib/keamanan";
import { normalizePhone } from "@/lib/wa";
import { isLang, type Lang } from "@/lib/i18n/dict";

export type StatusLupa = { terkirim?: boolean; error?: "laju"; wa?: string };

/*
 * The answer is the same whether or not the number has an account, so this page
 * cannot be used to find out who is registered. A failed email is logged, not shown,
 * for the same reason.
 */
export async function kirimLupa(_prev: StatusLupa, form: FormData): Promise<StatusLupa> {
  const langRaw = String(form.get("lang") ?? "ar");
  const lang: Lang = isLang(langRaw) ? langRaw : "ar";
  const waMentah = String(form.get("wa") ?? "");
  const wa = normalizePhone(waMentah);

  const ipHash = await ipHashPermintaan();
  if (!(await bolehMintaOtp(ipHash, wa))) return { error: "laju", wa: waMentah };
  await catatAksesAkun({ jenis: "otp", wa, ipHash, berhasil: true });

  const p = wa ? await ambilPenggunaByWa(wa) : null;
  if (p && p.aktif) {
    const kode = await buatOtp(p.id, "reset");
    const tautan = tautanAbsolut(`/${lang}/reset-password?wa=${encodeURIComponent(p.wa)}`);
    try {
      await kirimEmail({ ke: p.email, ...templateOtp("reset", kode, lang, tautan) });
    } catch (e) {
      console.error("[lupa-password] email not sent:", (e as Error).message);
    }
  }
  return { terkirim: true, wa: waMentah };
}
