"use server";

import { redirect } from "next/navigation";
import { punyaAkses } from "@/lib/auth/sesi";
import { driverEmail, kirimEmail } from "@/lib/email/kirim";

export type StatusUjiEmail = { ok?: string; error?: string };

/**
 * Sends one test message through the configured transport and reports the provider's
 * own answer. After SendGrid keys and DNS are set up this is the only way to know it
 * works without waiting for a student to ask for a password reset.
 */
export async function kirimEmailUji(_prev: StatusUjiEmail, form: FormData): Promise<StatusUjiEmail> {
  if (!(await punyaAkses("admin"))) redirect("/gate?next=%2Fadmin");
  const ke = String(form.get("ke") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ke)) return { error: "That email address does not look right." };

  const driver = driverEmail();
  const jam = new Date().toISOString();
  try {
    await kirimEmail({
      ke,
      subjek: "Tilawa Labs · test email",
      teks: `This is a test from the demo site (${driver}, ${jam}). If you can read it, password-reset codes will arrive too.`,
      html: `<p>This is a test from <b>the demo site</b> (${driver}, ${jam}).</p><p>If you can read it, password-reset codes will arrive too.</p>`,
    });
  } catch (e) {
    return { error: `${driver}: ${String((e as Error)?.message ?? e).slice(0, 400)}` };
  }
  if (driver === "palsu") {
    return { ok: "Sent with the fake driver — nothing leaves the server. Set EMAIL_DRIVER=sendgrid." };
  }
  return {
    ok: `Accepted by ${driver}. Check the inbox (and spam) of ${ke} in a minute.`,
  };
}
