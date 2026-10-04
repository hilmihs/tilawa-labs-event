"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { punyaAkses } from "@/lib/auth/sesi";
import { hapusLatihan, resetLatihan } from "@/lib/latihan/siapkan";
import { SLUG_LATIHAN } from "@/lib/latihan/data";

/** Creates or resets the practice programme. Only ever touches that one slug. */
export async function siapkanLatihan(form: FormData): Promise<void> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");
  if (form.get("yakin") !== "on") redirect("/admin?latihan=centang");
  await resetLatihan();
  revalidatePath("/admin");
  revalidatePath(`/admin/${SLUG_LATIHAN}`);
  redirect("/admin?latihan=siap");
}

export async function buangLatihan(form: FormData): Promise<void> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");
  if (String(form.get("konfirmasi") ?? "").trim() !== SLUG_LATIHAN) redirect("/admin?latihan=salah");
  await hapusLatihan();
  revalidatePath("/admin");
  redirect("/admin?latihan=hapus");
}
