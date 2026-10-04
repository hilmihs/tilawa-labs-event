import { redirect } from "next/navigation";
import { buatSesi, peranUntukKode, sesiSekarang } from "@/lib/auth/sesi";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

const TUJUAN: Record<string, string> = {
  petugas: "/scan",
  panitia: "/panel",
  admin: "/admin",
};

export default async function Gate({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; salah?: string }>;
}) {
  const sp = await searchParams;
  const sudah = await sesiSekarang();

  async function masuk(form: FormData) {
    "use server";
    const kode = String(form.get("kode") ?? "");
    const nama = String(form.get("nama") ?? "").trim();
    const next = String(form.get("next") ?? "");

    // Constant-time compare, and a code never reaches localStorage.
    const peran = peranUntukKode(kode);
    if (!peran) redirect(`/gate?salah=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);

    await buatSesi(peran, nama);
    // A single leading slash only. "//evil.com" and "/\\evil.com" are absolute URLs
    // to a browser, and landing staff on an attacker's page one keystroke after
    // they typed an access code is how the next code gets phished.
    const aman =
      next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
    redirect(aman ? next : TUJUAN[peran]);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--color-surface)] px-5">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex justify-center text-[var(--color-ink)]">
          <Logo kind="lockup" height={54} />
        </div>
        <form action={masuk} className="card flex flex-col gap-4 p-6">
          <div>
            <h1 className="text-xl font-semibold">Staff access</h1>
            <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink-2)]">
              Enter the code for your role. Each role has its own code.
            </p>
          </div>

          {sp.salah ? (
            <p
              role="alert"
              className="rounded-[8px] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/8 px-3.5 py-2.5 text-[14px] text-[var(--color-danger)]"
            >
              That code did not match.
            </p>
          ) : null}

          {sudah ? (
            <p className="rounded-[8px] bg-brand-100 px-3.5 py-2.5 text-[14px]">
              Signed in as <strong className="font-semibold">{sudah.peran}</strong>
              {sudah.nama ? ` · ${sudah.nama}` : ""}.
            </p>
          ) : null}

          <div>
            <label className="label" htmlFor="nama">
              Your name
            </label>
            <input
              id="nama"
              name="nama"
              defaultValue={sudah?.nama ?? ""}
              className="field"
              autoComplete="off"
              placeholder="Recorded with each scan"
            />
          </div>

          <div>
            <label className="label" htmlFor="kode">
              Access code
            </label>
            <input
              id="kode"
              name="kode"
              type="password"
              required
              className="field"
              autoComplete="off"
            />
          </div>

          <input type="hidden" name="next" value={sp.next ?? ""} />
          <button type="submit" className="btn btn-primary w-full">
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
