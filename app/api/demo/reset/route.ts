import { NextResponse } from "next/server";
import { seedDemo } from "@/db/seed-demo";

/**
 * Wipes the demo back to its seeded state.
 *
 * Visitors can register, scan and edit — that is the point of a demo — so by the
 * end of a day the data is full of "test" and "asdf". This runs nightly from
 * vercel.json and puts it back.
 *
 * Two independent guards, because this endpoint deletes rows:
 *  - DEMO_MODE must be "1". On any deployment that is not the demo, the route
 *    404s, so it cannot be reached even if the file ships by mistake.
 *  - The caller must present DEMO_RESET_TOKEN. Vercel Cron sends it as a bearer
 *    in the Authorization header (set CRON_SECRET to the same value).
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return jalankan(req);
}

export async function POST(req: Request) {
  return jalankan(req);
}

async function jalankan(req: Request) {
  if (process.env.DEMO_MODE !== "1") {
    return new NextResponse("Not found", { status: 404 });
  }

  const harapan = process.env.DEMO_RESET_TOKEN;
  if (!harapan) {
    return NextResponse.json({ error: "DEMO_RESET_TOKEN is not set" }, { status: 500 });
  }

  const diberikan = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (diberikan !== harapan) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const hasil = await seedDemo();
  return NextResponse.json({ ok: true, ...hasil });
}
