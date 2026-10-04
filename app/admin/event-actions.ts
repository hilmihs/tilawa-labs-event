"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { acara, acaraCounter } from "@/db/schema";
import { punyaAkses } from "@/lib/auth/sesi";
import { ambilAcara } from "@/lib/acara/queries";
import { JENIS_PROGRAM, slugSah } from "@/lib/acara/view-model";

export type StatusSimpanAcara = { tersimpan?: boolean; error?: string };

function teks(form: FormData, key: string): string | null {
  const v = String(form.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function angka(form: FormData, key: string): number | null {
  const v = String(form.get(key) ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/** "07:30" or "07:30:00" → "07:30:00"; anything else → null. */
function jam(form: FormData, key: string): string | null {
  const v = String(form.get(key) ?? "").trim();
  if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(v)) return null;
  const [h, m] = v.split(":");
  return `${h.padStart(2, "0")}:${m}:00`;
}

/**
 * Everything on the public pages that the committee is likely to change after the
 * site is live — the title before it is fixed, the quota when the hall changes, a
 * WhatsApp group link when the first one hits its 1,024-member cap.
 *
 * `slug` arrives on the form, but only as the key of the row being written — it is
 * never updated, and neither is `prefiks_nomor`: both are baked into numbers already
 * issued and into links already sent. `status` has its own control, so that opening
 * or closing registration is never a side effect of fixing a typo.
 */
export async function simpanAcara(
  _prev: StatusSimpanAcara,
  form: FormData,
): Promise<StatusSimpanAcara> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");

  const slug = String(form.get("slug") ?? "");
  if (!slugSah(slug)) return { error: "Missing or malformed programme." };

  const nama = String(form.get("nama") ?? "").trim();
  if (nama.length < 2) return { error: "The event name cannot be empty." };

  const tanggal = String(form.get("tanggal") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return { error: "The date must be YYYY-MM-DD." };

  // The agenda arrives as three parallel arrays, one row per line on the form.
  const jamAg = form.getAll("agenda_jam").map(String);
  const enAg = form.getAll("agenda_en").map(String);
  const arAg = form.getAll("agenda_ar").map(String);
  const agenda = jamAg
    .map((j, i) => ({ jam: j.trim(), en: (enAg[i] ?? "").trim(), ar: (arAg[i] ?? "").trim() }))
    .filter((r) => r.jam !== "" && (r.en !== "" || r.ar !== ""));

  const db = getDb();

  // Read first, so an unknown `jenis` can fall back to the value already stored
  // rather than to "acara", which would quietly turn a class back into an event.
  const ev = await ambilAcara(slug);
  if (!ev) return { error: "Programme not found." };
  const jenisForm = String(form.get("jenis") ?? "");
  const jenis = (JENIS_PROGRAM as readonly string[]).includes(jenisForm) ? jenisForm : ev.jenis;

  try {
    const diubah = await db
      .update(acara)
      .set({
        nama,
        namaAr: teks(form, "nama_ar"),
        judul: teks(form, "judul"),
        judulAr: teks(form, "judul_ar"),
        pemateri: teks(form, "pemateri"),
        pemateriAr: teks(form, "pemateri_ar"),
        penyelenggara: teks(form, "penyelenggara"),
        tanggal,
        waktuMulai: jam(form, "waktu_mulai"),
        waktuSelesai: jam(form, "waktu_selesai"),
        waktuWajibTiba: jam(form, "waktu_wajib_tiba"),
        lokasi: teks(form, "lokasi"),
        lokasiAr: teks(form, "lokasi_ar"),
        alamat: teks(form, "alamat"),
        alamatAr: teks(form, "alamat_ar"),
        petaUrl: teks(form, "peta_url"),
        petaGambarUrl: teks(form, "peta_gambar_url"),
        petaEmbedUrl: teks(form, "peta_embed_url"),
        tatibUrl: teks(form, "tatib_url"),
        feedbackUrl: teks(form, "feedback_url"),
        gateIkhwan: teks(form, "gate_ikhwan"),
        gateAkhwat: teks(form, "gate_akhwat"),
        kuota: angka(form, "kuota"),
        kuotaIkhwan: angka(form, "kuota_ikhwan"),
        kuotaAkhwat: angka(form, "kuota_akhwat"),
        waGrupIkhwan: teks(form, "wa_grup_ikhwan"),
        waGrupAkhwat: teks(form, "wa_grup_akhwat"),
        waAdmin: teks(form, "wa_admin"),
        otsBuka: form.get("ots_buka") === "on",
        agenda: agenda.length > 0 ? agenda : null,
        jenis,
        pakaiTiket: form.get("pakai_tiket") === "on",
        deskripsi: teks(form, "deskripsi"),
        deskripsiAr: teks(form, "deskripsi_ar"),
        posterUrl: teks(form, "poster_url"),
        tampil: form.get("tampil") === "on",
        urutan: angka(form, "urutan") ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(acara.slug, slug))
      .returning({ id: acara.id });
    // No row matched: the slug on the form names a programme that is not there, and
    // reporting "saved" would be a lie.
    if (diubah.length === 0) return { error: "Programme not found." };
  } catch (e) {
    return { error: (e as Error).message.slice(0, 200) };
  }

  // Everything public reads this row, so every public page has to be re-rendered.
  revalidatePath("/", "layout");
  revalidatePath(`/admin/${slug}`);
  revalidatePath("/panel");
  return { tersimpan: true };
}

export type StatusBuatAcara = { error?: string };

/**
 * A new programme starts as a draft, invisible until `tampil` is switched on from
 * its detail page. The two counter rows are created here, not lazily, because the
 * first registration must never find them missing.
 */
export async function buatAcara(_prev: StatusBuatAcara, form: FormData): Promise<StatusBuatAcara> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");

  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) {
    return { error: "Slug: 3–60 characters, lowercase letters, digits and hyphens only." };
  }
  const nama = String(form.get("nama") ?? "").trim();
  if (nama.length < 2) return { error: "The programme name cannot be empty." };
  const tanggal = String(form.get("tanggal") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return { error: "The date must be YYYY-MM-DD." };
  const prefiks = String(form.get("prefiks_nomor") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{2,8}$/.test(prefiks)) {
    return { error: "Number prefix: 2–8 uppercase letters or digits." };
  }
  const jenisRaw = String(form.get("jenis") ?? "acara");
  const jenis = (JENIS_PROGRAM as readonly string[]).includes(jenisRaw) ? jenisRaw : "acara";

  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(acara)
        .values({ slug, nama, tanggal, prefiksNomor: prefiks, jenis, status: "draft" })
        .returning({ id: acara.id });
      // Without this the counter rows would be inserted against `undefined` and the
      // first registration would fail with something unreadable.
      if (!row) throw new Error("The programme row was not created.");
      await tx.insert(acaraCounter).values([
        { acaraId: row.id, gender: "ikhwan", terakhir: 0 },
        { acaraId: row.id, gender: "akhwat", terakhir: 0 },
      ]);
    });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (msg.includes("acara_slug_unik")) return { error: "That slug is already used." };
    return { error: msg.slice(0, 200) };
  }

  revalidatePath("/admin");
  redirect(`/admin/${slug}`);
}
