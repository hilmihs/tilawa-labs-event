import { notFound } from "next/navigation";
import { ambilAcara } from "@/lib/acara/queries";
import { catatanUntuk } from "@/lib/catatan/kajian";
import type { Catatan } from "@/lib/catatan/tipe";
import type { Acara } from "@/db/schema";
import { mulaiSetelah, sesiTerbuka, soalTerbuka } from "./jadwal";

/**
 * What every quiz page needs before it can draw anything: the programme, its notes,
 * and how far through the six weeks the quiz has got.
 *
 * A programme with no notes has no quiz — the questions are written against one
 * particular lecture — so this 404s rather than rendering an empty calendar. Four
 * pages ask the same four questions; asking them in one place is what keeps the
 * "draft programmes stay invisible" rule from being forgotten on the fourth.
 */
export type KonteksKuis = {
  ev: Acara;
  catatan: Catatan;
  /** The first day's date, YYYY-MM-DD. */
  mulai: string;
  /** Highest week opened so far; 0 before the quiz starts. */
  sesi: number;
  /** Highest question number opened so far; 0 before the quiz starts. */
  terbuka: number;
};

export async function konteksKuis(slug: string): Promise<KonteksKuis> {
  const ev = await ambilAcara(slug);
  if (!ev || !ev.tampil) notFound();
  const catatan = catatanUntuk(slug);
  if (!catatan) notFound();
  const mulai = mulaiSetelah(catatan.tanggal);
  return { ev, catatan, mulai, sesi: sesiTerbuka(mulai), terbuka: soalTerbuka(mulai) };
}
