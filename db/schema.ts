import {
  boolean,
  date,
  jsonb,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * One row per event. The next event is an INSERT, not a migration — that is why
 * every piece of copy that changes between events lives here and not in code.
 */
export const acara = pgTable(
  "acara",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    nama: text("nama").notNull(),
    namaAr: text("nama_ar"),
    // Nullable on purpose: the committee announces the date before the title is fixed.
    judul: text("judul"),
    judulAr: text("judul_ar"),
    pemateri: text("pemateri"),
    pemateriAr: text("pemateri_ar"),
    // Optional and unset by default: nothing should carry an organiser name the
    // committee has not chosen for itself.
    penyelenggara: text("penyelenggara"),
    tanggal: date("tanggal").notNull(),
    waktuMulai: time("waktu_mulai"),
    waktuWajibTiba: time("waktu_wajib_tiba"),
    waktuSelesai: time("waktu_selesai"),
    // Displayed to participants. The registration door is NOT decided by these.
    registrasiBukaAt: timestamp("registrasi_buka_at", { withTimezone: true }),
    registrasiTutupAt: timestamp("registrasi_tutup_at", { withTimezone: true }),
    lokasi: text("lokasi"),
    lokasiAr: text("lokasi_ar"),
    alamat: text("alamat"),
    alamatAr: text("alamat_ar"),
    petaUrl: text("peta_url"),
    /*
     * Two ways to show the venue, in this order of preference:
     *  - petaGambarUrl: an image the committee made — a plan of the site showing
     *    which gate is which. More useful than a road map for someone who has to
     *    find the north gate, and it still renders with no third party involved.
     *  - petaEmbedUrl: an embed URL (Google Maps "…&output=embed", or the OSM
     *    embed) for when a plain locator map is enough.
     */
    petaGambarUrl: text("peta_gambar_url"),
    petaEmbedUrl: text("peta_embed_url"),
    tatibUrl: text("tatib_url"),
    feedbackUrl: text("feedback_url"),
    /*
     * One table holds every kind of programme. `jenis` decides what a registration
     * means: an `acara` issues a QR ticket that is scanned at the door; a `kelas`
     * or `seleksi` waits for the committee's decision (a later phase). `pakaiTiket`
     * is separate so a class can still hand out a QR when it wants one.
     */
    jenis: text("jenis").notNull().default("acara"),
    pakaiTiket: boolean("pakai_tiket").notNull().default(true),
    deskripsi: text("deskripsi"),
    deskripsiAr: text("deskripsi_ar"),
    posterUrl: text("poster_url"),
    // Listed publicly only once the committee flips this. A draft stays invisible
    // even with a direct link, so nothing half-written is ever broadcast by accident.
    tampil: boolean("tampil").notNull().default(false),
    urutan: integer("urutan").notNull().default(0),
    // [{ jam: "07:30", en: "Doors open", ar: "فتح الأبواب" }, …]
    agenda: jsonb("agenda").$type<Array<{ jam: string; en: string; ar: string }>>(),
    gateIkhwan: text("gate_ikhwan"),
    gateAkhwat: text("gate_akhwat"),
    /*
     * These used to be NEXT_PUBLIC_* env vars, which are baked into the client
     * bundle at build time — so changing a WhatsApp group link meant a redeploy.
     * They are the values most likely to change late (a group fills up at 1,024
     * members and a second one is opened), so they live in the row the committee
     * can edit. Env is still read as a fallback for anything left null.
     */
    waGrupIkhwan: text("wa_grup_ikhwan"),
    waGrupAkhwat: text("wa_grup_akhwat"),
    waAdmin: text("wa_admin"),
    /*
     * Capacity is per gender, not one number.
     *
     * The two sides of the hall are separate rooms with separate doors, so a single
     * total can be met while one side is overflowing and the other has empty rows.
     * `kuota` stays as the sum for display; the two below are what registration
     * actually checks.
     */
    kuota: integer("kuota"),
    kuotaIkhwan: integer("kuota_ikhwan"),
    kuotaAkhwat: integer("kuota_akhwat"),
    /*
     * Whether the walk-in link (/[lang]/p/[slug]/ots) accepts registrations.
     *
     * Off by default. On the day the committee shares that link at the venue; whoever
     * fills it in gets a number in the walk-in queue and a ticket whose QR stays
     * hidden until the committee permits them from /panel/ots — one, several, or all
     * at once — against the seats still free. There is no waiting list and no reserve
     * of held-back seats: online registration fills the quota, and past it the form
     * closes.
     */
    otsBuka: boolean("ots_buka").notNull().default(false),
    prefiksNomor: text("prefiks_nomor").notNull(),
    /**
     * The registration door is read from status, never from comparing dates.
     * The committee must be able to close early when the hall fills up without
     * touching a date that has already been broadcast.
     */
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("acara_slug_unik").on(t.slug)],
);

export const acaraPeserta = pgTable(
  "acara_peserta",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    acaraId: uuid("acara_id")
      .notNull()
      .references(() => acara.id, { onDelete: "cascade" }),
    // Sequential, printed everywhere, safe to show.
    nomor: text("nomor").notNull(),
    /**
     * The QR payload. Random, NOT the participant number: the number is sequential
     * and visible on every screen, so anyone who saw it could draw someone else's QR.
     * Neither nomor nor kode ever changes once issued — participants keep screenshots.
     */
    kode: text("kode").notNull(),
    nama: text("nama").notNull(),
    gender: text("gender").notNull(),
    wa: text("wa").notNull(),
    // Whether they study at the institute at all. Everything about programme, session and
    // semester only means something when this is true.
    lipia: boolean("lipia").notNull().default(true),
    email: text("email"),
    statusLipia: text("status_lipia"),
    nim: text("nim"),
    prodi: text("prodi"),
    sesi: text("sesi"),
    semester: text("semester"),
    tahunLulus: text("tahun_lulus"),
    domisili: text("domisili"),
    // Where they are from and where they studied before the institute. Not used on the day;
    // asked now because the committee expects to need it later.
    asalDaerah: text("asal_daerah"),
    asalSekolah: text("asal_sekolah"),
    // From the previous event's form. Not needed to get through the gate — it is
    // there so the committee can find the people who can help run the next one.
    // Comma-separated keys from KEAHLIAN, at most MAKS_KEAHLIAN of them.
    keahlian: text("keahlian"),
    transportasi: text("transportasi"),
    kebutuhanKhusus: text("kebutuhan_khusus"),
    /*
     * The account this registration belongs to. Null only for CSV imports: everyone
     * who fills the form in, the walk-in link included, makes
     * an account in the same step, and that is what lets them see their ticket again
     * and register for the next programme without retyping anything.
     *
     * `set null` on delete, not cascade: removing an account must never take a
     * participant row — and the number that was printed on their ticket — with it.
     */
    penggunaId: uuid("pengguna_id").references(() => pengguna.id, { onDelete: "set null" }),
    // "pra" — a seat booked online; "ots" — registered through the walk-in link on
    // the day, in the queue until permitted (see urutOts / izinOtsAt).
    jenis: text("jenis").notNull().default("pra"),
    // "web" — any form on the site, the walk-in link included; "impor" — CSV.
    sumber: text("sumber").notNull().default("web"),
    // Spam rows are deactivated, never deleted — deleting destroys the trail.
    aktif: boolean("aktif").notNull().default(true),
    konfirmasi: boolean("konfirmasi"),
    konfirmasiAt: timestamp("konfirmasi_at", { withTimezone: true }),
    /*
     * Walk-ins only. `urutOts` is their place in the walk-in queue of their side of
     * the hall (1, 2, 3… per event and gender, from acara_counter.terakhir_ots), the
     * number they see on their ticket and the committee sees on /panel/ots. It never
     * changes. `izinOtsAt` is when the committee let them in: until then the ticket
     * shows no QR and the gate refuses the code.
     */
    urutOts: integer("urut_ots"),
    izinOtsAt: timestamp("izin_ots_at", { withTimezone: true }),
    // Written once, only while still NULL. Never on every page load.
    tiketDibukaAt: timestamp("tiket_dibuka_at", { withTimezone: true }),
    /*
     * When the participant confirmed they joined the WhatsApp group.
     *
     * The group is where every change on the day is announced, so the QR is held
     * back until this is set: the ticket page shows the group link first and the
     * code only afterwards. It is their own word, not proof — the point is that
     * nobody reaches the gate without having been shown the group.
     */
    grupWaAt: timestamp("grup_wa_at", { withTimezone: true }),
    catatan: text("catatan"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("peserta_nomor_unik").on(t.acaraId, t.nomor),
    uniqueIndex("peserta_wa_unik").on(t.acaraId, t.wa),
    uniqueIndex("peserta_kode_unik").on(t.kode),
    // One registration per account per programme. Partial: walk-ins have no account.
    uniqueIndex("peserta_pengguna_unik")
      .on(t.acaraId, t.penggunaId)
      .where(sql`${t.penggunaId} is not null`),
    // Partial: graduates have no active NIM, and repeated NULLs are not duplicates.
    uniqueIndex("peserta_nim_unik")
      .on(t.acaraId, t.nim)
      .where(sql`${t.nim} is not null`),
    index("peserta_gender_idx").on(t.acaraId, t.gender),
    index("peserta_tiket_dibuka_idx").on(t.acaraId, t.tiketDibukaAt),
    index("peserta_nama_idx").on(t.acaraId, t.nama),
  ],
);

/**
 * One locked row per (event, gender). UPDATE ... RETURNING locks the row, so a
 * second concurrent registration waits instead of reading a stale max(nomor).
 */
export const acaraCounter = pgTable(
  "acara_counter",
  {
    acaraId: uuid("acara_id")
      .notNull()
      .references(() => acara.id, { onDelete: "cascade" }),
    gender: text("gender").notNull(),
    terakhir: integer("terakhir").notNull().default(0),
    // The walk-in queue's own sequence, under the same lock.
    terakhirOts: integer("terakhir_ots").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.acaraId, t.gender] })],
);

export const acaraKehadiran = pgTable(
  "acara_kehadiran",
  {
    /**
     * PK is peserta_id: a second scan can never create a second row. It is
     * detected as "already scanned", which is the correct answer for the usher —
     * not an error.
     */
    pesertaId: uuid("peserta_id")
      .primaryKey()
      .references(() => acaraPeserta.id, { onDelete: "cascade" }),
    acaraId: uuid("acara_id")
      .notNull()
      .references(() => acara.id, { onDelete: "cascade" }),
    scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
    // Differs from scannedAt only when an offline queue syncs late. The arrival-rate
    // chart uses coalesce(client_scanned_at, scanned_at) so it stays true across outages.
    clientScannedAt: timestamp("client_scanned_at", { withTimezone: true }),
    gate: text("gate"),
    petugas: text("petugas"),
    metode: text("metode").notNull().default("qr"),
    offline: boolean("offline").notNull().default(false),
  },
  (t) => [
    index("kehadiran_waktu_idx").on(t.acaraId, t.scannedAt),
    index("kehadiran_gate_idx").on(t.acaraId, t.gate),
  ],
);

/**
 * Attempts against the two public endpoints, and the basis for rate limiting.
 * Full WhatsApp numbers are never stored here — four digits is enough to trace a
 * guessing pattern without creating a second place the participant directory lives.
 */
export const acaraAkses = pgTable(
  "acara_akses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    acaraId: uuid("acara_id").references(() => acara.id, { onDelete: "cascade" }),
    jenis: text("jenis").notNull(),
    wa4: text("wa4"),
    // HMAC of the full normalised number (IP_SALT). The per-number account limits
    // (sign-in failures, OTP requests) cannot use wa4: four digits collide across
    // thousands of students. Hashed, so this table still holds no phone directory.
    waHash: text("wa_hash"),
    ipHash: text("ip_hash"),
    berhasil: boolean("berhasil").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("akses_ip_idx").on(t.ipHash, t.jenis, t.createdAt),
    index("akses_wa_idx").on(t.waHash, t.jenis, t.createdAt),
  ],
);

/**
 * Created now, used in full only after the event, so that adding to it later does
 * not touch a table holding live data.
 */
export const acaraPanitia = pgTable("acara_panitia", {
  id: uuid("id").primaryKey().defaultRandom(),
  acaraId: uuid("acara_id")
    .notNull()
    .references(() => acara.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  nama: text("nama").notNull(),
  gender: text("gender"),
  wa: text("wa"),
  divisi: text("divisi"),
  subTim: text("sub_tim"),
  peran: text("peran"),
  kodePos: text("kode_pos"),
  status: text("status"),
  bisaTm: boolean("bisa_tm"),
  bisaGladi: boolean("bisa_gladi"),
  bisa0445: boolean("bisa_0445"),
  punyaPowerbank: boolean("punya_powerbank"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per person, across every programme.
 *
 * `wa` is the sign-in identity (normalised 62…), unique. `email` is required and
 * stored lower-cased by the code that writes it, so a plain unique index is enough
 * for case-insensitive uniqueness. `sesi_versi` is bumped on every password change
 * or reset: a session cookie carries the version it was issued with, so bumping it
 * signs out every other device at once.
 */
export const pengguna = pgTable(
  "pengguna",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    wa: text("wa").notNull(),
    email: text("email").notNull(),
    emailTerverifikasiAt: timestamp("email_terverifikasi_at", { withTimezone: true }),
    passwordHash: text("password_hash").notNull(),
    sesiVersi: integer("sesi_versi").notNull().default(1),
    nama: text("nama").notNull(),
    gender: text("gender").notNull(),
    statusLipia: text("status_lipia"),
    prodi: text("prodi"),
    sesi: text("sesi"),
    semester: text("semester"),
    tahunLulus: text("tahun_lulus"),
    domisili: text("domisili"),
    asalDaerah: text("asal_daerah"),
    asalSekolah: text("asal_sekolah"),
    // Comma-separated keys from KEAHLIAN, at most MAKS_KEAHLIAN.
    minat: text("minat"),
    kebutuhanKhusus: text("kebutuhan_khusus"),
    // Deactivated, never deleted — same rule as participants.
    aktif: boolean("aktif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("pengguna_wa_unik").on(t.wa),
    uniqueIndex("pengguna_email_unik").on(t.email),
  ],
);

/**
 * One-time codes for password reset and email verification. Only an HMAC of the
 * code is stored. A new code of the same kind burns the previous one.
 */
export const otp = pgTable(
  "otp",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    penggunaId: uuid("pengguna_id")
      .notNull()
      .references(() => pengguna.id, { onDelete: "cascade" }),
    jenis: text("jenis").notNull(),
    kodeHash: text("kode_hash").notNull(),
    kadaluarsaAt: timestamp("kadaluarsa_at", { withTimezone: true }).notNull(),
    dipakaiAt: timestamp("dipakai_at", { withTimezone: true }),
    percobaan: integer("percobaan").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("otp_pengguna_idx").on(t.penggunaId, t.jenis, t.createdAt)],
);

/**
 * One row per public page view, for the traffic tab.
 *
 * No IP and no user agent is stored. `pengunjung` is an HMAC of IP + browser + the
 * WIB date: enough to count distinct visitors per day, useless for following anyone
 * across days, and it cannot be turned back into an address. Ticket URLs carry a
 * signed token, so `path` is stored with the token cut out.
 */
export const kunjungan = pgTable(
  "kunjungan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    path: text("path").notNull(),
    halaman: text("halaman").notNull(),
    slug: text("slug"),
    lang: text("lang"),
    sumber: text("sumber").notNull(),
    perujuk: text("perujuk"),
    perangkat: text("perangkat").notNull(),
    pengunjung: text("pengunjung").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("kunjungan_waktu_idx").on(t.createdAt), index("kunjungan_slug_idx").on(t.slug, t.createdAt)],
);

/**
 * Problem reports sent from the website, monitored in /admin.
 *
 * Reports used to go to the admin's WhatsApp number, which was banned; this table
 * replaces that channel. Every link to other tables is nullable with "set null": a
 * report must outlive a deleted programme or account, because it may be the only
 * record of what went wrong. `kontak` is whatever the participant typed (WhatsApp or
 * email) so the committee can reply outside the site. `ip_hash` only serves the rate
 * limit — it is an HMAC, not an address.
 */
export const aduan = pgTable(
  "aduan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Human ticket number ("ADU-0001") that a participant can quote back.
    nomor: text("nomor").notNull().unique(),
    acaraId: uuid("acara_id").references(() => acara.id, { onDelete: "set null" }),
    slug: text("slug"),
    halaman: text("halaman").notNull(),
    pesan: text("pesan").notNull(),
    nama: text("nama"),
    kontak: text("kontak"),
    nomorPeserta: text("nomor_peserta"),
    penggunaId: uuid("pengguna_id").references(() => pengguna.id, { onDelete: "set null" }),
    lang: text("lang"),
    // "baru" | "diproses" | "selesai" — see STATUS_ADUAN in lib/aduan/queries.ts.
    status: text("status").notNull().default("baru"),
    catatanAdmin: text("catatan_admin"),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("aduan_status_idx").on(t.status, t.createdAt),
    index("aduan_waktu_idx").on(t.createdAt),
  ],
);

/**
 * "I'm interested" in one of the Tilawa Labs clubs (lib/hub/konten.ts), before any of them
 * has a WhatsApp group. Tied to an account so the committee gets a name, a number
 * and a side of the hall without asking again. One row per account and club;
 * withdrawing stamps `batalAt` and a second change of heart clears it — rows are
 * never deleted, the same rule as participants.
 */
export const minatClub = pgTable(
  "minat_club",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    penggunaId: uuid("pengguna_id")
      .notNull()
      .references(() => pengguna.id, { onDelete: "cascade" }),
    // A key of CLUB in lib/hub/konten.ts.
    club: text("club").notNull(),
    // The short questionnaire some clubs ask on the way in (PERTANYAAN_CLUB in
    // lib/hub/konten.ts), keyed by question id. Null for clubs that ask nothing.
    jawaban: jsonb("jawaban").$type<Record<string, string>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    batalAt: timestamp("batal_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("minat_club_unik").on(t.penggunaId, t.club), index("minat_club_club_idx").on(t.club)],
);

/**
 * One row per person per question of the six-week quiz that follows a lecture.
 *
 * Keyed by the programme's slug rather than its id: the questions are written in
 * code (lib/kuis/soal.ts) against the notes of one particular lecture, and the slug
 * is what ties the two together. The unique index is the rule of the quiz — one
 * attempt per day, no second guess — enforced by the database and not only by the
 * page that writes it.
 *
 * `benar` and `tepatWaktu` are decided when the answer is written, not read back
 * later. The correct option could in principle be corrected in code after the fact,
 * and a score that silently changed under someone weeks later would be worse than a
 * score that is simply what they earned on the day.
 */
export const kuisJawaban = pgTable(
  "kuis_jawaban",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    penggunaId: uuid("pengguna_id")
      .notNull()
      .references(() => pengguna.id, { onDelete: "cascade" }),
    // The programme these questions belong to, by slug.
    slug: text("slug").notNull(),
    // Which question of the bank, 1…30 (lib/kuis/soal.ts).
    nomor: integer("nomor").notNull(),
    // Index into the question's four options, 0…3.
    pilih: integer("pilih").notNull(),
    benar: boolean("benar").notNull(),
    // Answered before its own week closed on Sunday, so the streak survives.
    tepatWaktu: boolean("tepat_waktu").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("kuis_jawaban_unik").on(t.penggunaId, t.slug, t.nomor),
    index("kuis_jawaban_slug_idx").on(t.slug),
  ],
);

/**
 * What a registrant who did not come told us, and how we reached them.
 *
 * One row per participant, created by whichever happens first — the invitation email,
 * the committee marking the WhatsApp message sent, or the participant opening the
 * link. That makes the funnel (sent → opened → answered) a plain count over one table,
 * and lets a repeated blast skip everyone already sent to.
 *
 * Only for people who did not attend: `lib/absen/queries.ts` decides who that is, and
 * the page refuses anyone else. The answers are keys from lib/absen/alasan.ts, never
 * labels, so a reworded chip does not split the recap.
 */
export const feedbackAbsen = pgTable(
  "feedback_absen",
  {
    pesertaId: uuid("peserta_id")
      .primaryKey()
      .references(() => acaraPeserta.id, { onDelete: "cascade" }),
    acaraId: uuid("acara_id")
      .notNull()
      .references(() => acara.id, { onDelete: "cascade" }),
    alasan: text("alasan").array(),
    alasanLain: text("alasan_lain"),
    waktuCocok: text("waktu_cocok").array(),
    pengingat: text("pengingat").array(),
    // Null: not asked (no access reason picked) or left unanswered.
    mauOnline: boolean("mau_online"),
    saran: text("saran"),
    kabari: boolean("kabari").notNull().default(false),
    emailAt: timestamp("email_at", { withTimezone: true }),
    emailIngatAt: timestamp("email_ingat_at", { withTimezone: true }),
    waAt: timestamp("wa_at", { withTimezone: true }),
    dibukaAt: timestamp("dibuka_at", { withTimezone: true }),
    diisiAt: timestamp("diisi_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("feedback_absen_acara_idx").on(t.acaraId)],
);

/**
 * Site-wide switches the committee flips from /admin without a deploy, one row per
 * key. Values are short strings ("1"/"0" for a switch); a missing row means the
 * code's default. See lib/pengaturan/queries.ts for the keys in use.
 */
export const pengaturan = pgTable("pengaturan", {
  kunci: text("kunci").primaryKey(),
  nilai: text("nilai").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Acara = typeof acara.$inferSelect;
export type Peserta = typeof acaraPeserta.$inferSelect;
export type FeedbackAbsen = typeof feedbackAbsen.$inferSelect;
export type Kehadiran = typeof acaraKehadiran.$inferSelect;
export type Pengguna = typeof pengguna.$inferSelect;
export type Otp = typeof otp.$inferSelect;
export type Aduan = typeof aduan.$inferSelect;
export type MinatClub = typeof minatClub.$inferSelect;
export type KuisJawaban = typeof kuisJawaban.$inferSelect;
