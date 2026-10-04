import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { pengaturan } from "@/db/schema";

/**
 * Whether Programme Hub (the three clubs) and Tilawa Labs Fest are on the public site at all:
 * their pages, the navbar link, the teaser on the programme page, the section on
 * the account page and the greeting popup. Off until the committee is ready to
 * announce them; while off, the programme page greets with the Instagram popup
 * instead. The staff panel (/panel/club) is not affected.
 */
export const KUNCI_HUB_TAMPIL = "hub_tampil";

async function ambil(kunci: string): Promise<string | null> {
  const [row] = await getDb().select({ nilai: pengaturan.nilai }).from(pengaturan).where(eq(pengaturan.kunci, kunci)).limit(1);
  return row?.nilai ?? null;
}

async function simpan(kunci: string, nilai: string): Promise<void> {
  await getDb()
    .insert(pengaturan)
    .values({ kunci, nilai })
    .onConflictDoUpdate({ target: pengaturan.kunci, set: { nilai, updatedAt: sql`now()` } });
}

/** Default off: no row, or anything but "1", hides the Hub. */
export async function hubTampil(): Promise<boolean> {
  return (await ambil(KUNCI_HUB_TAMPIL)) === "1";
}

export async function setHubTampil(tampil: boolean): Promise<void> {
  await simpan(KUNCI_HUB_TAMPIL, tampil ? "1" : "0");
}
