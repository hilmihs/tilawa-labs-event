"use server";

import { redirect } from "next/navigation";
import { wajibMasuk } from "@/lib/auth/akun";
import { ubahProfil } from "@/lib/akun/queries";
import { rapikanKeahlian } from "@/lib/acara/view-model";
import { keAngkaLatin } from "@/lib/wa";
import { isLang, type Lang } from "@/lib/i18n/dict";

export type StatusProfil = {
  error?: "nama_pendek" | "wajib_diisi" | "umum";
  /** With `wajib_diisi`: the empty fields, by form name, in the order the form shows them. */
  kolom?: string[];
};

const STATUS_LIPIA = ["mahasiswa", "khirrij", "mutarabbish"];

/*
 * The same rule as the registration form, for the same fields: a profile is what the
 * next registration is filled from, so blanking an answer here would bring the blank
 * back there. Transport and the password are not profile fields and are not asked.
 */
function kolomKosong(form: FormData): string[] {
  const isi = (k: string) => String(form.get(k) ?? "").trim() !== "";
  const kosong: string[] = [];
  if (!isi("nama")) kosong.push("nama");
  const gender = String(form.get("gender") ?? "");
  if (gender !== "ikhwan" && gender !== "akhwat") kosong.push("gender");
  const status = String(form.get("status_lipia") ?? "");
  if (!STATUS_LIPIA.includes(status)) kosong.push("status_lipia");
  if ((status === "mahasiswa" || status === "khirrij") && !isi("prodi")) kosong.push("prodi");
  if (status === "mahasiswa") {
    if (!isi("semester")) kosong.push("semester");
    if (!isi("sesi")) kosong.push("sesi");
  }
  if (status === "khirrij" && !isi("tahun_lulus")) kosong.push("tahun_lulus");
  for (const k of ["domisili", "asal_daerah", "asal_sekolah"]) if (!isi(k)) kosong.push(k);
  const minat = form.getAll("keahlian").map(String);
  if (rapikanKeahlian(minat) === null) kosong.push("keahlian");
  else if (minat.includes("lain") && !isi("keahlian_lain")) kosong.push("keahlian_lain");
  return kosong;
}

export async function simpanProfil(_prev: StatusProfil, form: FormData): Promise<StatusProfil> {
  const langRaw = String(form.get("lang") ?? "ar");
  const lang: Lang = isLang(langRaw) ? langRaw : "ar";
  const p = await wajibMasuk(lang, `/${lang}/akun/profil/ubah`);

  const teks = (k: string) => {
    const v = String(form.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  const kosong = kolomKosong(form);
  if (kosong.length > 0) return { error: "wajib_diisi", kolom: kosong };

  const nama = String(form.get("nama") ?? "").trim().replace(/\s+/g, " ");
  if (nama.length < 3) return { error: "nama_pendek" };

  const statusRaw = String(form.get("status_lipia") ?? "");
  const statusLipia = STATUS_LIPIA.includes(statusRaw) ? statusRaw : null;
  const mahasiswa = statusLipia === "mahasiswa";
  const khirrij = statusLipia === "khirrij";
  const tahun = teks("tahun_lulus");

  try {
    await ubahProfil(p.id, {
      nama,
      gender: String(form.get("gender")) === "akhwat" ? "akhwat" : "ikhwan",
      statusLipia,
      // Fields that only mean something for one status are cleared with it, so a
      // graduate does not keep a semester from the year they were still studying.
      prodi: mahasiswa || khirrij ? teks("prodi") : null,
      sesi: mahasiswa ? teks("sesi") : null,
      semester: mahasiswa ? teks("semester") : null,
      tahunLulus: khirrij && tahun ? keAngkaLatin(tahun) : null,
      domisili: teks("domisili"),
      asalDaerah: teks("asal_daerah"),
      asalSekolah: teks("asal_sekolah"),
      minat: rapikanKeahlian(form.getAll("keahlian").map(String), teks("keahlian_lain")),
      kebutuhanKhusus: teks("kebutuhan_khusus"),
    });
  } catch {
    return { error: "umum" };
  }
  redirect(`/${lang}/akun/profil?ok=1`);
}
