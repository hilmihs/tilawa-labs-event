import type { Lang } from "@/lib/i18n/dict";
import type { JenisOtp } from "@/lib/auth/otp";
import { OTP_MENIT } from "@/lib/auth/otp";

type Isi = { subjek: string; teks: string; html: string };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SALIN = {
  en: {
    reset: {
      subjek: "Your Tilawa Labs password reset code",
      pembuka: "Use this code to choose a new password:",
      tautan: "Or open this page and enter the code:",
    },
    verifikasi_email: {
      subjek: "Verify your email for Tilawa Labs",
      pembuka: "Use this code to verify your email address:",
      tautan: "",
    },
    berlaku: `The code is valid for ${OTP_MENIT} minutes. If you did not ask for it, ignore this email.`,
    diubahSubjek: "Your Tilawa Labs password was changed",
    diubah: "The password for your Tilawa Labs account was just changed.",
    bukanAnda: "If this was not you, reset your password now:",
    salam: "— Tilawa Labs",
  },
  ar: {
    reset: {
      subjek: "رمز إعادة تعيين كلمة المرور في Tilawa Labs",
      pembuka: "استخدم هذا الرمز لاختيار كلمة مرور جديدة:",
      tautan: "أو افتح هذه الصفحة وأدخل الرمز:",
    },
    verifikasi_email: {
      subjek: "تأكيد بريدك الإلكتروني في Tilawa Labs",
      pembuka: "استخدم هذا الرمز لتأكيد بريدك الإلكتروني:",
      tautan: "",
    },
    berlaku: `الرمز صالح لمدة ${OTP_MENIT} دقائق. إن لم تطلبه فتجاهل هذه الرسالة.`,
    diubahSubjek: "تم تغيير كلمة المرور في Tilawa Labs",
    diubah: "تم الآن تغيير كلمة المرور لحسابك في Tilawa Labs.",
    bukanAnda: "إن لم تكن أنت، فأعد تعيين كلمة المرور الآن:",
    salam: "— Tilawa Labs",
  },
} as const;

function bungkus(lang: Lang, isi: string): string {
  const dir = lang === "ar" ? "rtl" : "ltr";
  return `<!doctype html><html lang="${lang}" dir="${dir}"><body style="font-family:system-ui,sans-serif;background:#f3e9c5;padding:24px;color:#1f1d18"><div dir="${dir}" style="max-width:480px;margin:auto;background:#faf3da;border:1.5px solid #1f1d18;padding:24px">${isi}</div></body></html>`;
}

export function templateOtp(jenis: JenisOtp, kode: string, lang: Lang, tautan: string): Isi {
  const s = SALIN[lang];
  const j = s[jenis];
  const pakaiTautan = jenis === "reset" && j.tautan !== "";
  const teks = [j.pembuka, "", kode, "", ...(pakaiTautan ? [j.tautan, tautan, ""] : []), s.berlaku, "", s.salam].join("\n");
  const html = bungkus(
    lang,
    `<p>${esc(j.pembuka)}</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0" dir="ltr">${esc(kode)}</p>` +
      (pakaiTautan ? `<p>${esc(j.tautan)}<br><a href="${esc(tautan)}">${esc(tautan)}</a></p>` : "") +
      `<p style="color:#4a4638">${esc(s.berlaku)}</p><p>${esc(s.salam)}</p>`,
  );
  return { subjek: j.subjek, teks, html };
}

export function templatePasswordDiubah(lang: Lang, tautanLupa: string): Isi {
  const s = SALIN[lang];
  const teks = [s.diubah, "", s.bukanAnda, tautanLupa, "", s.salam].join("\n");
  const html = bungkus(
    lang,
    `<p>${esc(s.diubah)}</p><p>${esc(s.bukanAnda)}<br><a href="${esc(tautanLupa)}">${esc(tautanLupa)}</a></p><p>${esc(s.salam)}</p>`,
  );
  return { subjek: s.diubahSubjek, teks, html };
}

/**
 * The no-show email: a small gift (the lecture notes) that opens after a 30-second
 * favour.
 *
 * One message, Arabic first then English, because we do not store which language a
 * participant reads and guessing wrong would bury the one line that matters. Official
 * enough to come from the committee's address, warm enough not to read as a
 * complaint about their absence — it never says "you did not come".
 *
 * Exactly one button, to the form: the notes are the reward at the end of it, not a
 * second door that lets the favour be skipped. Without notes there is no gift, so
 * the email is a plain thank-you and a request.
 *
 * Inline styles and a table-free single column: that is what survives Gmail and the
 * phone mail apps. No images — the Tilawa Labs wordmark is set in type, so nothing is
 * blocked by "show images".
 */
export function templateAbsen(a: {
  nama: string;
  gender: string;
  judulEn: string;
  judulAr: string;
  linkEn: string;
  linkAr: string;
  adaCatatan: boolean;
  pengingat: boolean;
}): Isi {
  const nama = a.nama.trim().split(/\s+/)[0] ?? "";
  const akhwat = a.gender === "akhwat";
  const lak = akhwat ? "لكِ" : "لكَ";
  const k = akhwat ? "كِ" : "ك";
  const hadiah = a.adaCatatan;

  const ar = {
    salam: `أهلًا ${nama}،`,
    hadiah: hadiah
      ? `عندنا ${lak} هدية صغيرة 🎁 — خلاصة «${a.judulAr}»، جهّزناها لمن لم يتمكّن من الحضور.`
      : `شكرًا على تسجيل${k} في «${a.judulAr}» 🌿`,
    terima: hadiah ? `وشكرًا على تسجيل${k} 🌿` : "",
    minta: hadiah
      ? akhwat
        ? "تُفتح الهدية بعد ثلاثين ثانية: أخبرينا ما الذي منعكِ، حتى يسهل عليكِ حضور اللقاء القادم."
        : "تُفتح الهدية بعد ثلاثين ثانية: أخبرنا ما الذي منعك، حتى يسهل عليك حضور اللقاء القادم."
      : akhwat
        ? "وهل تساعديننا بشيء صغير؟ ثلاثون ثانية لنعرف ما الذي منعكِ، حتى يسهل عليكِ حضور اللقاء القادم."
        : "وهل تساعدنا بشيء صغير؟ ثلاثون ثانية لنعرف ما الذي منعك، حتى يسهل عليك حضور اللقاء القادم.",
    tombol: hadiah
      ? akhwat
        ? "🎁 افتحي هديتكِ — 30 ثانية"
        : "🎁 افتح هديتك — 30 ثانية"
      : akhwat
        ? "ساعدينا — 30 ثانية"
        : "ساعدنا — 30 ثانية",
    tenang: `إجابت${k} لن تؤثّر على تسجيل${k} القادم.`,
    salamPenutup: "مع خالص التحية،\nلجنة Tilawa Labs",
  };
  const en = {
    salam: `Hey ${nama},`,
    hadiah: hadiah
      ? `We've got something for you 🎁 — the notes from “${a.judulEn}”, put together just for those who couldn't make it.`
      : `Thank you for signing up for “${a.judulEn}” 🌿`,
    terima: hadiah ? "And thank you for signing up 🌿" : "",
    minta: hadiah
      ? "It opens after 30 seconds: tell us what got in the way, so the next one is easier to come to."
      : "One small favour back? 30 seconds to tell us what got in the way, so the next one is easier to come to.",
    tombol: hadiah ? "🎁 Open my gift — 30 seconds" : "Help us — 30 seconds",
    tenang: "Your answer won't affect your next registration.",
    salamPenutup: "Warm regards,\nThe Tilawa Labs committee",
  };

  // Without notes there is no gift to speak of, so the subject cannot promise one.
  const subjek = hadiah
    ? a.pengingat
      ? "🎁 ما زالت هديتك تنتظرك · Your notes are still waiting — Tilawa Labs"
      : "🎁 هدية صغيرة من Tilawa Labs · A little something for you"
    : a.pengingat
      ? "دقيقة من وقتك؟ · 30 seconds? — Tilawa Labs"
      : "شكرًا على تسجيلك · Thank you for signing up — Tilawa Labs";

  const tombol = (href: string, label: string) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:6px 0;padding:12px 20px;border:1.5px solid #1f1d18;border-radius:10px;text-decoration:none;font-weight:600;background:#3c542f;color:#faf3da">${esc(label)}</a>`;

  const blok = (lang: "ar" | "en", s: typeof en, link: string) => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    const align = lang === "ar" ? "right" : "left";
    return `<div dir="${dir}" lang="${lang}" style="text-align:${align};font-size:16px;line-height:1.65">
<p style="margin:0 0 12px;font-size:18px;font-weight:700">${esc(s.salam)}</p>
<p style="margin:0 0 8px">${esc(s.hadiah)}</p>
${s.terima ? `<p style="margin:0 0 12px;color:#5b5648">${esc(s.terima)}</p>` : ""}
<p style="margin:0 0 8px">${esc(s.minta)}</p>
<p style="margin:0 0 8px">${tombol(link, s.tombol)}</p>
<p style="margin:0 0 16px;font-size:13px;color:#5b5648">${esc(s.tenang)}</p>
<p style="margin:0;white-space:pre-line;color:#5b5648">${esc(s.salamPenutup)}</p>
</div>`;
  };

  const html = `<!doctype html><html lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;font-family:system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;background:#f3e9c5;padding:24px;color:#1f1d18">
<div style="max-width:520px;margin:auto;background:#faf3da;border:1.5px solid #1f1d18;border-radius:14px;overflow:hidden">
<div style="padding:18px 24px;border-bottom:1.5px solid #1f1d18;font-weight:800;letter-spacing:.18em;font-size:20px">Tilawa Labs</div>
<div style="padding:24px">${blok("ar", ar, a.linkAr)}</div>
<div style="margin:0 24px;border-top:1px dashed #b9ae8a"></div>
<div style="padding:24px">${blok("en", en, a.linkEn)}</div>
</div></body></html>`;

  const teksBlok = (s: typeof en, link: string) =>
    [s.salam, "", s.hadiah, s.terima, "", s.minta, `${s.tombol}: ${link}`, "", s.tenang, "", s.salamPenutup]
      .filter((x, i, arr) => x !== "" || arr[i - 1] !== "")
      .join("\n");
  const teks = `${teksBlok(ar, a.linkAr)}\n\n———\n\n${teksBlok(en, a.linkEn)}`;

  return { subjek, teks, html };
}
