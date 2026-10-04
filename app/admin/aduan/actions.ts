"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { punyaAkses } from "@/lib/auth/sesi";
import { STATUS_ADUAN, ubahAduan, type StatusAduan } from "@/lib/aduan/queries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATATAN_MAKS = 4000;

/**
 * Status and note for one complaint. Admin only: the committee code may read the
 * list, but closing a ticket is a decision someone must own, and the committee code
 * is shared far more widely than the admin one.
 */
export async function ubahAduanAction(form: FormData): Promise<void> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin%2Faduan");

  const id = String(form.get("id") ?? "");
  // Judged before it reaches a query: a malformed uuid is a Postgres error, not a miss.
  if (!UUID.test(id)) return;

  const statusRaw = String(form.get("status") ?? "");
  const status = (STATUS_ADUAN as readonly string[]).includes(statusRaw)
    ? (statusRaw as StatusAduan)
    : undefined;

  const catatanRaw = form.get("catatanAdmin");
  // An emptied textarea clears the note; a form without the field leaves it alone.
  const catatanAdmin =
    catatanRaw === null ? undefined : String(catatanRaw).trim().slice(0, CATATAN_MAKS) || null;

  await ubahAduan(id, { status, catatanAdmin });
  revalidatePath("/admin/aduan");
  revalidatePath("/admin");
}
