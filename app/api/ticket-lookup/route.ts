import { NextResponse } from "next/server";
import {
  ambilAcara,
  cariPeserta,
  catatAkses,
  catatGagalSekali,
  hitungAkses,
} from "@/lib/acara/queries";
import { ipHashPermintaan } from "@/lib/keamanan";
import { signTiketToken } from "@/lib/tiket/token";
import { empatDigit, normalizePhone } from "@/lib/wa";

export const dynamic = "force-dynamic";

/*
 * This and /daftar are the only public endpoints that touch the data of a thousand
 * people, so a limit belongs here — but it has the same shared-address problem, and
 * worse consequences. Everyone testing or registering from one campus wifi is one
 * address; at five failures a handful of people mistyping their own number would
 * lock the whole building out of their own tickets for ten minutes.
 *
 * Tens is the right order. Someone walking a list of numbers still accumulates a
 * failure per number and trips it, which is the pattern this is for. Failures are
 * also deduplicated per (address, last four digits) so the page's own retry loop
 * cannot spend the budget on one person.
 */
// Floor of 1,000 for the same shared-address reason as the registration form: a low
// deploy variable must not be able to lock a campus out of its own tickets.
const BATAS_GAGAL = Math.max(Number(process.env.BATAS_TIKET_GAGAL_PER_IP) || 0, 1000);
const JENDELA_MENIT = Number(process.env.BATAS_TIKET_JENDELA_MENIT ?? 10);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    slug?: string;
    wa?: string;
    nama4?: string;
  } | null;

  // A hidden programme has no public pages, so it has no public lookup either — an
  // already-issued /ticket/[token] link stays the deliberate exception.
  const ev = await ambilAcara(String(body?.slug ?? ""));
  if (!ev || !ev.tampil) return NextResponse.json({ status: "tidak_ketemu" }, { status: 200 });

  const ipHash = await ipHashPermintaan();
  const sejak = new Date(Date.now() - JENDELA_MENIT * 60 * 1000);
  const gagal = await hitungAkses(ipHash, "tiket", sejak, true);
  if (gagal >= BATAS_GAGAL) {
    return NextResponse.json({ status: "laju" }, { status: 429 });
  }

  const wa = normalizePhone(body?.wa ?? "");
  const nama4 = (body?.nama4 ?? "").trim();

  if (!wa || nama4.length < 2) {
    await catatGagalSekali(ev.id, {
      jenis: "tiket",
      wa4: empatDigit(body?.wa ?? ""),
      ipHash,
      berhasil: false,
    });
    return NextResponse.json({ status: "tidak_ketemu" });
  }

  const peserta = await cariPeserta(ev.id, wa, nama4);

  if (peserta) {
    await catatAkses(ev.id, { jenis: "tiket", wa4: empatDigit(wa), ipHash, berhasil: true });
  } else {
    // Deduped: the client polls this every five seconds while it waits.
    await catatGagalSekali(ev.id, {
      jenis: "tiket",
      wa4: empatDigit(wa),
      ipHash,
      berhasil: false,
    });
  }

  if (!peserta) {
    // Never a flat "not found": people react to that by filling the form again.
    // The client keeps saying "looking…" for sixty seconds before it says anything else.
    return NextResponse.json({ status: "tidak_ketemu" });
  }

  const token = await signTiketToken({ pid: peserta.id, slug: ev.slug });
  return NextResponse.json({ status: "ketemu", token, nomor: peserta.nomor });
}
