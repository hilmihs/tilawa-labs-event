"use server";

import { redirect } from "next/navigation";
import { buatSesiAkun, wajibMasuk } from "@/lib/auth/akun";
import { PANJANG_MIN_PASSWORD, cocokPassword } from "@/lib/auth/password";
import {
  buatOtp,
  gantiPassword,
  periksaOtp,
  tandaiEmailTerverifikasi,
  ubahEmail,
} from "@/lib/akun/queries";
import { bolehMintaOtp, catatAksesAkun, tautanAbsolut } from "@/lib/akun/batas";
import { kirimEmail } from "@/lib/email/kirim";
import { templateOtp, templatePasswordDiubah } from "@/lib/email/template";
import { ipHashPermintaan } from "@/lib/keamanan";
import { isLang, type Lang } from "@/lib/i18n/dict";

export type StatusKeamanan = {
  error?:
    | "password_lama_salah"
    | "password_pendek"
    | "email_tidak_valid"
    | "email_terpakai"
    | "kode_salah"
    | "kode_kadaluarsa"
    | "laju"
    | "umum";
};

function bahasa(form: FormData): Lang {
  const v = String(form.get("lang") ?? "ar");
  return isLang(v) ? v : "ar";
}

const JALUR = (lang: Lang) => `/${lang}/akun/keamanan`;

export async function gantiPasswordAkun(
  _prev: StatusKeamanan,
  form: FormData,
): Promise<StatusKeamanan> {
  const lang = bahasa(form);
  const p = await wajibMasuk(lang, JALUR(lang));
  if (!(await cocokPassword(String(form.get("password_lama") ?? ""), p.passwordHash))) {
    return { error: "password_lama_salah" };
  }
  const baruTeks = String(form.get("password_baru") ?? "");
  if (baruTeks.length < PANJANG_MIN_PASSWORD) return { error: "password_pendek" };

  const baru = await gantiPassword(p.id, baruTeks);
  // sesiVersi moved on: re-issue this device's cookie so only the other devices
  // are signed out — otherwise changing your password logs you out of the page
  // you are standing on.
  await buatSesiAkun(baru);
  try {
    await kirimEmail({
      ke: baru.email,
      ...templatePasswordDiubah(lang, tautanAbsolut(`/${lang}/lupa-password`)),
    });
  } catch (e) {
    console.error("[keamanan] notice not sent:", (e as Error).message);
  }
  redirect(`${JALUR(lang)}?ok=password`);
}

export async function gantiEmailAkun(
  _prev: StatusKeamanan,
  form: FormData,
): Promise<StatusKeamanan> {
  const lang = bahasa(form);
  const p = await wajibMasuk(lang, JALUR(lang));
  // The password is asked for here because the email is what recovers the account:
  // a borrowed unlocked phone must not be able to point it somewhere else.
  if (!(await cocokPassword(String(form.get("password") ?? ""), p.passwordHash))) {
    return { error: "password_lama_salah" };
  }
  const hasil = await ubahEmail(p.id, String(form.get("email") ?? ""));
  if (!hasil.ok) return { error: hasil.alasan };
  redirect(`${JALUR(lang)}?ok=email`);
}

export async function kirimKodeVerifikasi(
  _prev: StatusKeamanan,
  form: FormData,
): Promise<StatusKeamanan> {
  const lang = bahasa(form);
  const p = await wajibMasuk(lang, JALUR(lang));
  const ipHash = await ipHashPermintaan();
  if (!(await bolehMintaOtp(ipHash, p.wa))) return { error: "laju" };
  await catatAksesAkun({ jenis: "otp", wa: p.wa, ipHash, berhasil: true });

  const kode = await buatOtp(p.id, "verifikasi_email");
  try {
    await kirimEmail({
      ke: p.email,
      ...templateOtp("verifikasi_email", kode, lang, tautanAbsolut(JALUR(lang))),
    });
  } catch (e) {
    console.error("[keamanan] verification code not sent:", (e as Error).message);
    return { error: "umum" };
  }
  redirect(`${JALUR(lang)}?ok=kode`);
}

export async function verifikasiEmail(
  _prev: StatusKeamanan,
  form: FormData,
): Promise<StatusKeamanan> {
  const lang = bahasa(form);
  const p = await wajibMasuk(lang, JALUR(lang));
  const keadaan = await periksaOtp(p.id, "verifikasi_email", String(form.get("kode") ?? ""));
  if (keadaan === "salah") return { error: "kode_salah" };
  if (keadaan !== "cocok") return { error: "kode_kadaluarsa" };
  await tandaiEmailTerverifikasi(p.id);
  redirect(`${JALUR(lang)}?ok=verifikasi`);
}
