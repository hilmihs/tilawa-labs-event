"use server";

import { redirect } from "next/navigation";
import { daftarPeserta, type Gender } from "@/lib/acara/daftar";
import { ambilAcara, catatAkses, hitungAkses } from "@/lib/acara/queries";
import { rapikanKeahlian } from "@/lib/acara/view-model";
import { buatSesiAkun, penggunaSekarang } from "@/lib/auth/akun";
import { daftarAkun } from "@/lib/akun/queries";
import { ipHashPermintaan } from "@/lib/keamanan";
import { signTiketToken } from "@/lib/tiket/token";
import { empatDigit, normalizePhone, latinAtauNull } from "@/lib/wa";
import { isLang, type Lang } from "@/lib/i18n/dict";

export type StatusForm = {
  error?:
    | "tutup"
    | "ots_tutup"
    | "penuh"
    | "wa_tidak_valid"
    | "laju"
    | "wajib_setuju"
    | "nama_pendek"
    | "terlalu_cepat"
    | "email_tidak_valid"
    | "password_pendek"
    | "wa_terpakai"
    | "email_terpakai"
    | "password_tidak_sama"
    | "wajib_diisi"
    | "umum";
  /** With `wajib_diisi`: the empty fields, by form name, in the order the form shows them. */
  kolom?: string[];
  // No token unless the submitted name matches the one on the row. See below.
  sudahTerdaftar?: { nomor?: string; token?: string };
  nilai?: Record<string, string>;
};

/*
 * A public write endpoint had Google holding back the bots before. Nothing does now.
 *
 * Tens per hour, not a handful: a thousand students on one campus NAT all share a
 * single address, so a low number refuses genuine sign-ups long before it refuses a
 * flood. And the IP limit was never the real defence anyway — `unique(acara_id, wa)`
 * is. Every registration needs a distinct WhatsApp number, so nobody fills the table
 * by pressing submit repeatedly. This limit exists to stop a script, and thirty an
 * hour stops a script perfectly well.
 *
 * Failed attempts count too, so a fumbled number is not free — that is deliberate.
 * The attempt the limiter itself rejects is NOT logged, or the window would keep
 * sliding forward and lock the visitor out permanently.
 */
/*
 * Raised to thousands after real students were locked out on broadcast day: a whole
 * campus, a boarding house or one mobile carrier's NAT is ONE address, so "30 an hour"
 * refused genuine people by the hundred. The per-number uniqueness constraint is the
 * actual defence against flooding. A lower value left in the deploy variables is
 * ignored rather than trusted — that is how the lockout happened.
 */
const BATAS_PER_IP_PER_JAM = Math.max(Number(process.env.BATAS_DAFTAR_PER_IP) || 0, 5000);
const MINIMUM_DETIK = 3;

export async function kirimPendaftaran(
  _prev: StatusForm,
  form: FormData,
): Promise<StatusForm> {
  const langRaw = String(form.get("lang") ?? "en");
  const lang: Lang = isLang(langRaw) ? langRaw : "en";

  const nilai: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    // Passwords are never sent back to the page with an error; they are typed again.
    if (typeof v === "string" && !["hp_website", "dimuat_at", "slug", "password", "password_ulang"].includes(k))
      nilai[k] = v;
  }
  // Checkboxes share one name; FormData keeps each, a plain record only the last.
  nilai.keahlian = form.getAll("keahlian").map(String).join(",");

  const slug = String(form.get("slug") ?? "");
  const ev = await ambilAcara(slug);
  if (!ev || !ev.tampil) return { error: "tutup", nilai };
  /*
   * The walk-in link (/p/[slug]/ots) posts the same form with `ots=1`. It takes no
   * seat — the person gets a queue number and waits for the committee's permit — and
   * it only works while the committee has the link open (acara.ots_buka).
   */
  const ots = String(form.get("ots") ?? "") === "1";
  if (ots && !ev.otsBuka) return { error: "ots_tutup", nilai };

  const ipHashAwal = await ipHashPermintaan();

  /*
   * Honeypot: a hidden field that must stay empty. Filled means a bot, and it is
   * dropped silently with a success-looking outcome so the bot learns nothing.
   *
   * It IS logged, though. A password manager occasionally fills hidden fields, and
   * without a trace a real person dropped this way would be invisible — they would
   * wait for a ticket that was never created and nobody could tell them why.
   */
  const honeypot = String(form.get("hp_website") ?? "");
  if (honeypot.trim() !== "") {
    await catatAkses(ev.id, {
      jenis: "daftar",
      wa4: empatDigit(String(form.get("wa") ?? "")),
      ipHash: ipHashAwal,
      berhasil: false,
    });
    redirect(`/${lang}/p/${ev.slug}/ticket?pending=1`);
  }

  /*
   * Minimum dwell time — but answered out loud, not silently.
   *
   * This used to redirect away without a word. Browser autofill fills the name and
   * number instantly, so the fastest genuine users were exactly the ones dropped:
   * their registration was never created, and the page they landed on said nothing.
   * They would wait for a ticket that did not exist.
   *
   * A bot does not read error messages, so saying so costs nothing and stops the
   * false positive from being silent.
   */
  const dimuat = Number(form.get("dimuat_at") ?? 0);
  if (dimuat && Date.now() - dimuat < MINIMUM_DETIK * 1000) {
    return { error: "terlalu_cepat", nilai };
  }

  const ipHash = ipHashAwal;
  const sejam = new Date(Date.now() - 60 * 60 * 1000);
  const percobaan = await hitungAkses(ipHash, "daftar", sejam);
  if (percobaan >= BATAS_PER_IP_PER_JAM) {
    // Deliberately NOT logged. The window is a rolling hour over the logged rows,
    // so recording the rejection would push the release time forward on every
    // retry and lock the visitor out permanently.
    return { error: "laju", nilai };
  }

  // Signed in: the registration is the account holder's, on the account's number. The
  // field is read-only on the form, but a request can carry anything.
  const akunSekarang = await penggunaSekarang();

  /*
   * Every question is required except "anything we should know". The committee plans
   * seats, transport and groups from these answers, and a row with blanks cannot be
   * counted. The form checks this too, but only with JavaScript — this is the rule.
   * It runs before the account is created, so a rejected submit leaves nothing behind.
   */
  const kosong = kolomKosong(form, { sudahMasuk: akunSekarang !== null });
  if (kosong.length > 0) return { error: "wajib_diisi", kolom: kosong, nilai };

  const nama = String(form.get("nama") ?? "").trim();
  if (nama.length < 3) return { error: "nama_pendek", nilai };

  if (form.get("setuju") !== "on") return { error: "wajib_setuju", nilai };
  const waMentah = akunSekarang ? akunSekarang.wa : String(form.get("wa") ?? "");
  const wa = normalizePhone(waMentah);
  if (!wa) {
    await catatAkses(ev.id, {
      jenis: "daftar",
      wa4: empatDigit(waMentah),
      ipHash,
      berhasil: false,
    });
    return { error: "wa_tidak_valid", nilai };
  }

  const genderRaw = String(form.get("gender") ?? "ikhwan");
  const gender: Gender = genderRaw === "akhwat" ? "akhwat" : "ikhwan";
  const diLipia = String(form.get("lipia") ?? "ya") !== "tidak";
  const statusLipia = diLipia ? String(form.get("status_lipia") ?? "mahasiswa") : null;
  const mahasiswa = diLipia && statusLipia === "mahasiswa";
  const khirrij = diLipia && statusLipia === "khirrij";

  /*
   * Registering IS creating an account.
   *
   * The form asks everything once — profile and password together — so a participant
   * leaves with both a ticket and a way back in: their own ticket page, and the next
   * programme without retyping any of it. Someone already signed in keeps the account
   * they have; the identity then comes from the account, not from the form.
   */
  const profil = {
    statusLipia,
    prodi: mahasiswa || khirrij || !diLipia ? teks(form, "prodi") : null,
    sesi: mahasiswa ? teks(form, "sesi") : null,
    semester: mahasiswa ? teks(form, "semester") : null,
    tahunLulus: khirrij ? latinAtauNull(teks(form, "tahun_lulus")) : null,
    domisili: teks(form, "domisili"),
    asalDaerah: teks(form, "asal_daerah"),
    asalSekolah: teks(form, "asal_sekolah"),
    minat: rapikanKeahlian(form.getAll("keahlian").map(String), teks(form, "keahlian_lain")),
    kebutuhanKhusus: teks(form, "kebutuhan_khusus"),
  };

  let penggunaId = akunSekarang?.id ?? null;
  if (!akunSekarang) {
    // The form blocks this too, but only with JavaScript; the account is created here.
    if (String(form.get("password") ?? "") !== String(form.get("password_ulang") ?? "")) {
      return { error: "password_tidak_sama", nilai };
    }
    const hasilAkun = await daftarAkun({
      nama,
      gender,
      wa,
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      profil,
    });
    if (!hasilAkun.ok) {
      await catatAkses(ev.id, { jenis: "daftar", wa4: empatDigit(wa), ipHash, berhasil: false });
      const alasan = hasilAkun.alasan;
      if (alasan === "nama_pendek") return { error: "nama_pendek", nilai };
      if (alasan === "wa_tidak_valid") return { error: "wa_tidak_valid", nilai };
      return { error: alasan, nilai };
    }
    penggunaId = hasilAkun.pengguna.id;
    await buatSesiAkun(hasilAkun.pengguna);
  }

  const hasil = await daftarPeserta(
    ev.slug,
    {
      nama,
      gender,
      wa,
      penggunaId,
      email: teks(form, "email"),
      lipia: diLipia,
      statusLipia,
      // Not asked for any more; the column stays for the rows that already have one.
      nim: null,
      // A dropdown for the institute, free text for anyone studying elsewhere — same column.
      prodi: mahasiswa || khirrij || !diLipia ? teks(form, "prodi") : null,
      sesi: mahasiswa ? teks(form, "sesi") : null,
      semester: mahasiswa ? teks(form, "semester") : null,
      tahunLulus: khirrij ? latinAtauNull(teks(form, "tahun_lulus")) : null,
      domisili: teks(form, "domisili"),
      asalDaerah: teks(form, "asal_daerah"),
      asalSekolah: teks(form, "asal_sekolah"),
      keahlian: rapikanKeahlian(form.getAll("keahlian").map(String), teks(form, "keahlian_lain")),
      transportasi: teks(form, "transportasi"),
      kebutuhanKhusus: teks(form, "kebutuhan_khusus"),
    },
    { sumber: "web", jenis: ots ? "ots" : "pra", ipHash },
  );

  await catatAkses(ev.id, {
    jenis: "daftar",
    wa4: empatDigit(wa),
    ipHash,
    berhasil: hasil.ok,
  });

  if (!hasil.ok) {
    if (hasil.alasan === "sudah_terdaftar" && hasil.peserta) {
      /*
       * Answered kindly, with a way through — but the ticket itself is held back
       * unless the name matches too.
       *
       * /api/ticket-lookup deliberately asks for the number AND the first four
       * letters of the name, so that a leaked list of student phone numbers cannot
       * be turned into a list of e-tickets. Handing out a signed token here on the
       * number alone would reopen exactly that hole through the public form.
       */
      // The signed-in owner of that registration needs no name check: the session is
      // stronger proof than four letters.
      const milikSendiri = penggunaId !== null && hasil.peserta.penggunaId === penggunaId;
      const cocok =
        milikSendiri ||
        hasil.peserta.nama.trim().slice(0, 4).toLowerCase() ===
          nama.trim().slice(0, 4).toLowerCase();
      if (!cocok) return { sudahTerdaftar: {}, nilai };
      const token = await signTiketToken({ pid: hasil.peserta.id, slug: ev.slug });
      return { sudahTerdaftar: { nomor: hasil.peserta.nomor, token }, nilai };
    }
    if (hasil.alasan === "tutup") return { error: ots ? "ots_tutup" : "tutup", nilai };
    if (hasil.alasan === "penuh") return { error: "penuh", nilai };
    if (hasil.alasan === "wa_tidak_valid") return { error: "wa_tidak_valid", nilai };
    return { error: "umum", nilai };
  }

  // Straight to the ticket. The QR appears on the very next screen — that is the
  // biggest single win of owning the form, and it is thrown away by a thank-you page.
  const token = await signTiketToken({ pid: hasil.peserta.id, slug: ev.slug });
  redirect(`/${lang}/ticket/${token}?baru=1`);
}

/**
 * The empty required fields, by form name, in form order. Everything is required but
 * `kebutuhan_khusus`; the house-rules box keeps its own message (`wajib_setuju`).
 * Status decides which study fields exist: a student gives programme, semester and
 * session, a graduate programme and year, a mutarabbish neither.
 */
function kolomKosong(form: FormData, { sudahMasuk }: { sudahMasuk: boolean }): string[] {
  const isi = (k: string) => String(form.get(k) ?? "").trim() !== "";
  const kosong: string[] = [];
  if (!isi("nama")) kosong.push("nama");
  // Signed in, the number, email and password come from the account, not the form.
  if (!sudahMasuk) {
    for (const k of ["wa", "email", "password", "password_ulang"]) if (!isi(k)) kosong.push(k);
  }
  const gender = String(form.get("gender") ?? "");
  if (gender !== "ikhwan" && gender !== "akhwat") kosong.push("gender");
  const diLipia = String(form.get("lipia") ?? "ya") !== "tidak";
  const status = String(form.get("status_lipia") ?? "");
  if (diLipia && !["mahasiswa", "khirrij", "mutarabbish"].includes(status)) kosong.push("status_lipia");
  const mahasiswa = diLipia && status === "mahasiswa";
  const khirrij = diLipia && status === "khirrij";
  if ((mahasiswa || khirrij || !diLipia) && !isi("prodi")) kosong.push("prodi");
  if (mahasiswa) {
    if (!isi("semester")) kosong.push("semester");
    if (!isi("sesi")) kosong.push("sesi");
  }
  if (khirrij && !isi("tahun_lulus")) kosong.push("tahun_lulus");
  // The region pickers submit "" until every step is chosen, so half an address is empty.
  for (const k of ["domisili", "asal_daerah", "asal_sekolah", "transportasi"]) {
    if (!isi(k)) kosong.push(k);
  }
  const minat = form.getAll("keahlian").map(String);
  if (rapikanKeahlian(minat) === null) kosong.push("keahlian");
  else if (minat.includes("lain") && !isi("keahlian_lain")) kosong.push("keahlian_lain");
  return kosong;
}

function teks(form: FormData, key: string): string | null {
  const v = String(form.get(key) ?? "").trim();
  return v === "" ? null : v;
}
