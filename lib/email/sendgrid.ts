import type { Pesan } from "./kirim";

/**
 * The sender, as SendGrid wants it: `Tilawa Labs <demo@example.org>` split into name and
 * address. A bare address works too.
 */
function pengirim(): { email: string; name?: string } {
  const mentah = (process.env.EMAIL_DARI ?? "Tilawa Labs <demo@example.org>").trim();
  const cocok = mentah.match(/^(.*)<([^>]+)>$/);
  if (!cocok) return { email: mentah };
  const name = cocok[1].trim().replace(/^"|"$/g, "");
  return name ? { email: cocok[2].trim(), name } : { email: cocok[2].trim() };
}

/**
 * SendGrid's v3 API over fetch — no SDK, and no SMTP host, port or password to keep
 * anywhere. The account still has to own the sender: either the domain is
 * authenticated or `admin@nawaroom.id` is verified as a single sender, otherwise
 * SendGrid answers 403 and nothing is delivered.
 */
export async function kirimSendgrid(p: Pesan): Promise<void> {
  const kunci = process.env.SENDGRID_API_KEY;
  if (!kunci) throw new Error("SENDGRID_API_KEY is not set");

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { authorization: `Bearer ${kunci}`, "content-type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: p.ke }] }],
      from: pengirim(),
      subject: p.subjek,
      content: [
        { type: "text/plain", value: p.teks },
        { type: "text/html", value: p.html },
      ],
    }),
    signal: AbortSignal.timeout(10_000),
  });

  // 202 Accepted is the success answer; anything else carries a JSON reason worth logging.
  if (!res.ok) {
    const isi = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`SendGrid answered ${res.status}: ${isi}`);
  }
}
