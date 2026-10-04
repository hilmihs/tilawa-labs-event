import { kirimPalsu } from "./palsu";
import { kirimSendgrid } from "./sendgrid";

export type Pesan = { ke: string; subjek: string; teks: string; html: string };

/**
 * The transport actually in use — shown on /api/health and the admin test button.
 *
 * Production sends through SendGrid, always. Outside production it is `palsu` unless
 * EMAIL_DRIVER=sendgrid says otherwise, so a laptop or a CI run cannot email a real
 * student even if a key is lying around in the environment. Any other EMAIL_DRIVER
 * value — including the `resend` left over in the variable group from before — is
 * ignored rather than trusted: there is only one real transport now.
 */
export function driverEmail(): "sendgrid" | "palsu" {
  const diminta = process.env.EMAIL_DRIVER?.trim().toLowerCase();
  if (diminta === "palsu") return "palsu";
  if (diminta === "sendgrid") return "sendgrid";
  return process.env.NODE_ENV === "production" ? "sendgrid" : "palsu";
}

/** The only way the app sends mail. */
export async function kirimEmail(p: Pesan): Promise<void> {
  if (driverEmail() === "sendgrid") return kirimSendgrid(p);
  return kirimPalsu(p);
}
