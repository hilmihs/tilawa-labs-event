"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { acara, acaraCounter, acaraKehadiran, acaraPeserta, pengguna } from "@/db/schema";
import { punyaAkses } from "@/lib/auth/sesi";
import { ambilAcara } from "@/lib/acara/queries";
import { slugSah } from "@/lib/acara/view-model";
import { daftarPeserta } from "@/lib/acara/daftar";
import { siapkanImpor } from "@/lib/admin/csv";
import { normalizePhone } from "@/lib/wa";

export type PratinjauImpor = {
  total: number;
  baru: number;
  diperbarui: number;
  ditolak: Array<{ no: number; alasan: string; wa: string }>;
  contoh: Array<{ nama: string; wa: string; gender: string; status: string }>;
  csv?: string;
};

/**
 * Preview before writing: how many are new, how many are updates, how many were
 * rejected and why. Nothing is written by this call.
 */
export async function pratinjauImpor(
  _prev: PratinjauImpor | null,
  form: FormData,
): Promise<PratinjauImpor | null> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");

  const file = form.get("csv");
  const teks =
    file instanceof File ? await file.text() : String(form.get("csv_teks") ?? "");
  if (!teks.trim()) return null;

  const { baris } = siapkanImpor(teks);
  // Judged before it reaches a query or a redirect target: every path below builds
  // /admin/${slug} out of it.
  const slug = String(form.get("slug") ?? "");
  if (!slugSah(slug)) return null;
  const ev = await ambilAcara(slug);
  if (!ev) return null;

  const db = getDb();
  const valid = baris.filter((b) => b.input);
  const waList = valid.map((b) => b.input!.wa);

  const sudah =
    waList.length > 0
      ? await db
          .select({ wa: acaraPeserta.wa })
          .from(acaraPeserta)
          .where(and(eq(acaraPeserta.acaraId, ev.id), inArray(acaraPeserta.wa, waList)))
      : [];

  const set = new Set(sudah.map((s) => s.wa));

  return {
    total: baris.length,
    baru: valid.filter((b) => !set.has(b.input!.wa)).length,
    diperbarui: valid.filter((b) => set.has(b.input!.wa)).length,
    ditolak: baris
      .filter((b) => !b.input)
      .map((b) => ({ no: b.no, alasan: b.alasan ?? "unknown", wa: b.waMentah })),
    contoh: valid.slice(0, 8).map((b) => ({
      nama: b.input!.nama,
      wa: b.input!.wa,
      gender: b.input!.gender,
      status: b.input!.statusLipia ?? "",
    })),
    csv: teks,
  };
}

export type HasilImpor = { baru: number; diperbarui: number; gagal: number };

/**
 * Writes through daftarPeserta with sumber: "impor" — the same single write path.
 * Running the same file twice creates no new row and rewrites no ticket code.
 */
export async function jalankanImpor(
  _prev: HasilImpor | null,
  form: FormData,
): Promise<HasilImpor | null> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");

  const slug = String(form.get("slug") ?? "");
  if (!slugSah(slug)) redirect("/admin");
  const teks = String(form.get("csv_teks") ?? "");
  if (!teks.trim()) return null;

  const { baris } = siapkanImpor(teks);
  let baru = 0;
  let diperbarui = 0;
  let gagal = 0;

  for (const b of baris) {
    if (!b.input) {
      gagal++;
      continue;
    }
    try {
      const hasil = await daftarPeserta(slug, b.input, { sumber: "impor" });
      if (hasil.ok) hasil.baru ? baru++ : diperbarui++;
      else gagal++;
    } catch {
      gagal++;
    }
  }

  revalidatePath(`/admin/${slug}`);
  revalidatePath("/panel");
  return { baru, diperbarui, gagal };
}

/**
 * Empties one programme: every registration, every attendance row, and the two
 * counters back to zero so numbering starts at 0001 again.
 *
 * This exists because the committee has no shell on the server — the alternative was
 * a page that runs arbitrary SQL, and the admin code ends up in a WhatsApp group
 * sooner or later. One named, auditable operation is a far smaller blast radius than
 * a query box. The slug has to be typed out to confirm, for the same reason a
 * dangerous command asks twice.
 *
 * Accounts are only removed when explicitly asked: a person's account outlives any
 * single programme, and deleting it is not part of clearing a guest list.
 */
export async function kosongkanPendaftar(form: FormData): Promise<void> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");

  const slug = String(form.get("slug") ?? "");
  if (!slugSah(slug)) redirect("/admin");
  const ev = await ambilAcara(slug);
  if (!ev) redirect("/admin");

  // Typed by hand, compared exactly: a mis-click cannot reach this.
  if (String(form.get("konfirmasi") ?? "").trim() !== ev.slug) {
    redirect(`/admin/${ev.slug}?kosong=salah`);
  }

  const db = getDb();
  const ikutAkun = form.get("hapus_akun") === "on";
  let akunTerhapus = 0;

  await db.transaction(async (tx) => {
    if (ikutAkun) {
      const baris = await tx
        .select({ id: acaraPeserta.penggunaId })
        .from(acaraPeserta)
        .where(eq(acaraPeserta.acaraId, ev.id));
      const idAkun = [...new Set(baris.map((b) => b.id).filter((v): v is string => Boolean(v)))];
      if (idAkun.length > 0) {
        // The registration rows go next, so the foreign key is left pointing at nothing
        // only for the moment between these two statements — inside one transaction.
        await tx.delete(pengguna).where(inArray(pengguna.id, idAkun));
        akunTerhapus = idAkun.length;
      }
    }
    await tx.delete(acaraKehadiran).where(eq(acaraKehadiran.acaraId, ev.id));
    await tx.delete(acaraPeserta).where(eq(acaraPeserta.acaraId, ev.id));
    await tx.update(acaraCounter).set({ terakhir: 0 }).where(eq(acaraCounter.acaraId, ev.id));
  });

  revalidatePath(`/admin/${ev.slug}`);
  revalidatePath("/panel");
  redirect(`/admin/${ev.slug}?kosong=ok&akun=${akunTerhapus}`);
}

export async function ubahStatus(form: FormData): Promise<void> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");
  const slug = String(form.get("slug") ?? "");
  if (!slugSah(slug)) redirect("/admin");
  const status = String(form.get("status"));
  const izin = ["draft", "pendaftaran", "ditutup", "berlangsung", "selesai", "batal"];
  if (!izin.includes(status)) return;

  const db = getDb();
  await db
    .update(acara)
    .set({ status, updatedAt: new Date() })
    .where(eq(acara.slug, slug));
  revalidatePath(`/admin/${slug}`);
  revalidatePath("/panel");
}

/** Spam rows are deactivated, never deleted — deleting destroys the trail. */
export async function ubahAktif(form: FormData): Promise<void> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");
  const slug = String(form.get("slug") ?? "");
  if (!slugSah(slug)) redirect("/admin");
  const nomor = String(form.get("nomor") ?? "").trim();
  const aktif = String(form.get("aktif")) === "true";
  if (!nomor) return;

  const ev = await ambilAcara(slug);
  if (!ev) return;

  const db = getDb();
  await db
    .update(acaraPeserta)
    .set({ aktif, updatedAt: new Date() })
    .where(and(eq(acaraPeserta.acaraId, ev.id), eq(acaraPeserta.nomor, nomor)));
  revalidatePath(`/admin/${slug}`);
}

/**
 * The one field a participant cannot change for themselves.
 *
 * It is both the identity key and the recovery key: a participant who typed it wrong
 * and then edited it wrong again would lock themselves out of their own ticket with
 * no way back. So the correction lives here, with someone who can be asked to prove
 * who they are first.
 */
export async function ubahWaPeserta(form: FormData): Promise<void> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");
  const slug = String(form.get("slug") ?? "");
  if (!slugSah(slug)) redirect("/admin");
  const nomor = String(form.get("nomor") ?? "").trim();
  const baru = normalizePhone(String(form.get("wa") ?? ""));
  if (!nomor || !baru) redirect(`/admin/${slug}?wa=tidak_valid`);

  const ev = await ambilAcara(slug);
  if (!ev) return;

  const db = getDb();
  try {
    await db
      .update(acaraPeserta)
      .set({ wa: baru, updatedAt: new Date() })
      .where(and(eq(acaraPeserta.acaraId, ev.id), eq(acaraPeserta.nomor, nomor)));
  } catch {
    // The unique index did its job: that number already belongs to someone else.
    redirect(`/admin/${slug}?wa=bentrok`);
  }
  revalidatePath(`/admin/${slug}`);
  redirect(`/admin/${slug}?wa=ok`);
}
