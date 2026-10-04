import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { kunjungan } from "@/db/schema";
import { ipHashPermintaan } from "@/lib/keamanan";
import {
  bukanManusia,
  halamanStaf,
  jenisHalaman,
  jenisPerangkat,
  rapikanPath,
  sumberKunjungan,
} from "@/lib/trafik/klasifikasi";
import { tanggalIsoWib } from "@/lib/waktu";
import { isKunciTombol } from "@/lib/hub/konten";
import { HALAMAN_KETUK_MINAT } from "@/lib/trafik/klasifikasi";

export const dynamic = "force-dynamic";

const KOSONG = () => new Response(null, { status: 204 });

/*
 * Limits kept in memory: one server process, and a counter that forgets on restart is
 * fine for traffic numbers. Per visitor, a real person does not open 40 pages in ten
 * minutes; overall, the whole student body arriving at once is well under 3,000 a
 * minute. Past either, views are dropped, so a script cannot inflate the dashboard or
 * grow the table without bound.
 */
const JENDELA_PENGUNJUNG_MS = 10 * 60 * 1000;
const MAKS_PER_PENGUNJUNG = 40;
const MAKS_PER_MENIT = 3000;
const perPengunjung = new Map<string, { n: number; sampai: number }>();
let menit = { n: 0, sampai: 0 };

function bolehCatat(pengunjung: string): boolean {
  const kini = Date.now();
  if (kini > menit.sampai) menit = { n: 0, sampai: kini + 60_000 };
  if (++menit.n > MAKS_PER_MENIT) return false;

  const ada = perPengunjung.get(pengunjung);
  if (!ada || kini > ada.sampai) {
    // Swept when it grows, so the map cannot become the unbounded thing instead.
    if (perPengunjung.size > 20_000) {
      for (const [k, v] of perPengunjung) if (kini > v.sampai) perPengunjung.delete(k);
    }
    perPengunjung.set(pengunjung, { n: 1, sampai: kini + JENDELA_PENGUNJUNG_MS });
    return true;
  }
  return ++ada.n <= MAKS_PER_PENGUNJUNG;
}

/**
 * One public page view, sent by the page itself with `navigator.sendBeacon`.
 *
 * Always answers 204, whatever happens: a counter must never be the reason a page
 * errors, and a script probing this endpoint learns nothing from the reply. Nothing
 * that identifies a person is written — see the `kunjungan` table.
 */
export async function POST(req: Request) {
  try {
    const mentah = (await req.text()).slice(0, 2000);
    const isi = JSON.parse(mentah) as { path?: unknown; ref?: unknown; utm?: unknown; aksi?: unknown; kunci?: unknown };
    if (typeof isi.path !== "string" || !isi.path.startsWith("/") || halamanStaf(isi.path)) return KOSONG();

    const h = await headers();
    // Only this site's own pages count. Browsers mark a beacon from another site as
    // cross-site; a request that says so is someone else's script.
    const situs = h.get("sec-fetch-site");
    if (situs && situs !== "same-origin") return KOSONG();
    const ua = h.get("user-agent") ?? "";
    if (bukanManusia(ua)) return KOSONG();

    const path = rapikanPath(isi.path);
    const jenis = jenisHalaman(path);
    // A tap on an interest button rather than a page view: stored beside the views so it
    // shares their visitor hash and limits, but under its own kind, which every traffic
    // figure leaves out (see HALAMAN_KETUK_MINAT). `slug` says which button.
    const ketuk = isi.aksi === "minat" && isKunciTombol(isi.kunci) ? isi.kunci : null;
    if (isi.aksi !== undefined && !ketuk) return KOSONG();
    const { halaman, slug, lang } = ketuk ? { halaman: HALAMAN_KETUK_MINAT, slug: ketuk, lang: jenis.lang } : jenis;
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
    const { sumber, perujuk } = sumberKunjungan(
      typeof isi.ref === "string" ? isi.ref.slice(0, 300) : null,
      typeof isi.utm === "string" ? isi.utm : null,
      host.split(":")[0],
    );

    const salt = process.env.IP_SALT;
    if (!salt) return KOSONG();
    // Per WIB day: counts today's distinct visitors, and cannot link one person's days.
    const pengunjung = createHmac("sha256", salt)
      .update(`${await ipHashPermintaan()}|${ua}|${tanggalIsoWib()}`)
      .digest("hex")
      .slice(0, 32);

    if (!bolehCatat(pengunjung)) return KOSONG();

    await getDb().insert(kunjungan).values({
      path,
      halaman,
      slug,
      lang,
      sumber,
      perujuk,
      perangkat: jenisPerangkat(ua),
      pengunjung,
    });
  } catch {
    // Malformed body or a database hiccup: the visit simply is not counted.
  }
  return KOSONG();
}
