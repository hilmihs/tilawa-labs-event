"use server";

import { redirect } from "next/navigation";
import { buatSesiAkun } from "@/lib/auth/akun";
import { tujuanAman } from "@/lib/auth/tujuan";
import { daftarAkun, type AlasanDaftarAkun } from "@/lib/akun/queries";
import { bolehDaftarAkun, catatAksesAkun } from "@/lib/akun/batas";
import { ipHashPermintaan } from "@/lib/keamanan";
import { normalizePhone } from "@/lib/wa";
import { isLang, type Lang } from "@/lib/i18n/dict";

export type StatusDaftarAkun = {
  error?: AlasanDaftarAkun | "wajib_setuju" | "laju";
  nilai?: { nama?: string; gender?: string; wa?: string; email?: string };
};

export async function kirimDaftarAkun(_prev: StatusDaftarAkun, form: FormData): Promise<StatusDaftarAkun> {
  const langRaw = String(form.get("lang") ?? "ar");
  const lang: Lang = isLang(langRaw) ? langRaw : "ar";
  const nilai = {
    nama: String(form.get("nama") ?? ""),
    gender: String(form.get("gender") ?? "ikhwan"),
    wa: String(form.get("wa") ?? ""),
    email: String(form.get("email") ?? ""),
  };

  const ipHash = await ipHashPermintaan();
  if (!(await bolehDaftarAkun(ipHash))) return { error: "laju", nilai };
  if (form.get("setuju") !== "on") return { error: "wajib_setuju", nilai };

  const hasil = await daftarAkun({
    nama: nilai.nama,
    gender: nilai.gender === "akhwat" ? "akhwat" : "ikhwan",
    wa: nilai.wa,
    email: nilai.email,
    password: String(form.get("password") ?? ""),
  });
  await catatAksesAkun({
    jenis: "daftar_akun",
    wa: normalizePhone(nilai.wa),
    ipHash,
    berhasil: hasil.ok,
  });
  if (!hasil.ok) return { error: hasil.alasan, nilai };

  await buatSesiAkun(hasil.pengguna);
  redirect(tujuanAman(String(form.get("next") ?? ""), lang));
}
