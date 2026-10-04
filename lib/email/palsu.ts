import type { Pesan } from "./kirim";

/** Messages sent with EMAIL_DRIVER=palsu. Tests read this; nothing leaves the process. */
export const kotakPalsu: Pesan[] = [];

export async function kirimPalsu(p: Pesan): Promise<void> {
  kotakPalsu.push(p);
  // In local development the code has to be readable somewhere, or nobody can test
  // the reset flow without a mail account. Never in production: the driver there is sendgrid.
  if (process.env.NODE_ENV === "development") {
    console.info(`[email palsu] to ${p.ke} · ${p.subjek}\n${p.teks}`);
  }
}
