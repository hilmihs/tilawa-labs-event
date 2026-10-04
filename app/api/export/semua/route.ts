import { NextResponse } from "next/server";
import { bacaFilterStatus, bearerCocok, kelompokkanPerProgram } from "@/lib/acara/ekspor";
import { kehadiranExportUntuk, pesertaExportUntuk, semuaProgram } from "@/lib/acara/queries";

export const dynamic = "force-dynamic";

/**
 * Every programme in one pull, for the other dashboard once there are more than a
 * handful: it no longer has to know each slug, and a new programme shows up on the
 * next pull without anyone touching its configuration.
 *
 * Bearer only. The committee's CSV button stays per programme on /api/export — a
 * spreadsheet of every programme's participants is not something the panel needs.
 * Two reads in total however many programmes there are, never one pair per programme.
 */
export async function GET(req: Request) {
  if (!bearerCocok(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const filter = bacaFilterStatus(new URL(req.url).searchParams.get("status"));
  if (!filter.ok) {
    return NextResponse.json({ error: "status", salah: filter.salah }, { status: 400 });
  }

  const semua = await semuaProgram();
  const status: readonly string[] | null = filter.status;
  const program = status ? semua.filter((a) => status.includes(a.status)) : semua;
  const ids = program.map((a) => a.id);

  const [peserta, kehadiran] = await Promise.all([
    pesertaExportUntuk(ids),
    kehadiranExportUntuk(ids),
  ]);

  return NextResponse.json(
    {
      diambilAt: new Date().toISOString(),
      jumlahProgram: program.length,
      program: kelompokkanPerProgram(program, peserta, kehadiran),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
