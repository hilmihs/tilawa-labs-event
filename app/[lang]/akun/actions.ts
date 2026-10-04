"use server";

import { redirect } from "next/navigation";
import { hapusSesiAkun } from "@/lib/auth/akun";
import { isLang } from "@/lib/i18n/dict";

export async function keluar(form: FormData): Promise<void> {
  const langRaw = String(form.get("lang") ?? "ar");
  const lang = isLang(langRaw) ? langRaw : "ar";
  await hapusSesiAkun();
  // Back to where they were (the registration form, for someone registering a friend),
  // but only to a page of this site — never a URL taken from the form as-is.
  const next = String(form.get("next") ?? "");
  const aman = next.startsWith(`/${lang}/`) && !next.startsWith("//") && !next.includes("\\");
  redirect(aman ? next : `/${lang}`);
}
