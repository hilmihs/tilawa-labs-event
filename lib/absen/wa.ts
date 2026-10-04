import { normalizePhone } from "@/lib/wa";
import { namaDepan } from "./tautan";

/**
 * The personal WhatsApp message to one no-show, sent one by one from the Tilawa Labs
 * number (the committee's sender reads it from the "WA list" download).
 *
 * Arabic then English, like the email: the site is English/Arabic, and the owner
 * wants the WhatsApp in those two languages. The Arabic follows the reader's side of
 * the hall because here, unlike on the anonymous page, we know who it is going to.
 *
 * It never says "you did not come" — it thanks them for registering and offers the
 * notes. One link, nothing else to tap.
 */
export function pesanWaAbsen({
  nama,
  gender,
  judul,
  link,
}: {
  nama: string;
  gender: string;
  judul: string;
  link: string;
}): string {
  const akhwat = gender === "akhwat";
  const depan = namaDepan(nama);
  return [
    `السلام عليكم ورحمة الله${depan ? ` يا ${depan}` : ""} 🌿`,
    "",
    `شكرًا على ${akhwat ? "تسجيلكِ" : "تسجيلك"} في محاضرة *${judul}*. عندنا ${akhwat ? "لكِ" : "لك"} هدية صغيرة 🎁 خلاصة المحاضرة، تُفتح بعد ثلاثين ثانية من الأسئلة عمّا حال دون الحضور، حتى يسهل حضور اللقاء القادم.`,
    "",
    `${depan ? `Dear ${depan}, thank` : "Thank"} you for signing up for *${judul}*. A little gift is waiting for you 🎁 the lecture notes, unlocked after 30 seconds of questions about what got in the way.`,
    "",
    `👉 ${link}`,
    "",
    `${akhwat ? "جزاكِ" : "جزاك"} الله خيرًا`,
    "Tilawa Labs",
  ].join("\n");
}

type BarisSumber = { nama: string; gender: string; wa: string; diisiAt: Date | null };

/**
 * The rows of the "WA list": no-shows who have not answered yet, each with the number
 * in the 62… form a sender expects and the message ready to paste. A number that does
 * not normalise is dropped rather than sent to a sender that would fail on it.
 */
export function barisWaAbsen(
  rows: BarisSumber[],
  { judul, link }: { judul: string; link: string },
): { wa: string; nama: string; gender: string; pesan: string }[] {
  const hasil: { wa: string; nama: string; gender: string; pesan: string }[] = [];
  for (const r of rows) {
    if (r.diisiAt) continue;
    const wa = normalizePhone(r.wa);
    if (!wa) continue;
    hasil.push({ wa, nama: r.nama, gender: r.gender, pesan: pesanWaAbsen({ nama: r.nama, gender: r.gender, judul, link }) });
  }
  return hasil;
}
