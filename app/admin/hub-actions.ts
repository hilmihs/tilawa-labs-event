"use server";

import { redirect } from "next/navigation";
import { punyaAkses } from "@/lib/auth/sesi";
import { setHubTampil } from "@/lib/pengaturan/queries";

/** The /admin switch for Programme Hub & Fest. Every public page reads it live, so no revalidation is needed. */
export async function ubahHubTampil(form: FormData): Promise<void> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");
  await setHubTampil(String(form.get("tampil")) === "1");
  redirect("/admin");
}
