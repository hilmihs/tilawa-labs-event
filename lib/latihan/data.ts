import { createHash } from "node:crypto";

/*
 * Practice programme for gate and help-desk drills.
 *
 * Everything here is deterministic: the same 1,000 names, numbers and ticket codes
 * come out every time, on a laptop and on the server. That is what lets the QR cards
 * be printed once, from this file, and still match the rows the admin button writes
 * into production — and match them again after every reset.
 *
 * The codes are only valid inside this programme: the scanner looks a code up by
 * programme and code together, so a practice card scanned for the real event reads
 * NOT VALID.
 */

export const SLUG_LATIHAN = "latihan-scan";
export const PREFIKS_LATIHAN = "LAT";
// In the past on purpose: staff pages default to the nearest upcoming live programme,
// and a practice run must never be what an usher lands on for the real event.
export const TANGGAL_LATIHAN = "2026-01-01";

export const KUOTA_LATIHAN = { ikhwan: 400, akhwat: 600 } as const;

export type SkenarioLatihan =
  /** A normal seat: MAY ENTER. */
  | "kursi"
  /** A seat already scanned before the drill starts: ALREADY SCANNED. */
  | "sudah"
  /** Seat released by the participant: NOT VALID. */
  | "lepas"
  /** A walk-in still in the queue: WALK-IN · NOT YET until the committee permits them. */
  | "ots"
  /** Deactivated by the committee: NOT VALID. */
  | "nonaktif";

export type PesertaLatihan = {
  urut: number;
  nomor: string;
  kode: string;
  nama: string;
  gender: "ikhwan" | "akhwat";
  wa: string;
  statusLipia: "mahasiswa" | "khirrij" | "mutarabbish";
  skenario: SkenarioLatihan;
};

// The counts per side must never change: the printed cards' numbers and codes come
// from the same shuffle. Online seats ("kursi" + "sudah") stop short of each side's
// quota, so the walk-in queue has free seats to be permitted into.
const KOMPOSISI: Record<"ikhwan" | "akhwat", Record<SkenarioLatihan, number>> = {
  ikhwan: { kursi: 340, sudah: 10, lepas: 8, ots: 30, nonaktif: 4 },
  akhwat: { kursi: 540, sudah: 10, lepas: 12, ots: 40, nonaktif: 6 },
};

const ALFABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function kodeDari(benih: string): string {
  const h = createHash("sha256").update(benih).digest();
  let out = "";
  for (let i = 0; i < 10; i++) out += ALFABET[h[i] % 32];
  return out;
}

function acak(benih: string): () => number {
  let s = createHash("sha256").update(benih).digest().readUInt32LE(0);
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEPAN_IKHWAN = [
  "Muhammad", "Ahmad", "Abdullah", "Umar", "Ali", "Hasan", "Husain", "Yusuf", "Ibrahim", "Ismail",
  "Hamzah", "Bilal", "Zaid", "Khalid", "Salman", "Faris", "Rizki", "Fikri", "Hafiz", "Naufal",
  "Fadhil", "Ilham", "Arif", "Taufiq", "Hanif", "Ridwan", "Syafiq", "Luqman", "Harits", "Anas",
  "Rafi", "Fauzan", "Irfan", "Dzaki", "Azzam", "Habib", "Ikhsan", "Wildan", "Yahya", "Zakariya",
];
const DEPAN_AKHWAT = [
  "Aisyah", "Fatimah", "Khadijah", "Maryam", "Zainab", "Hafshah", "Ruqayyah", "Sumayyah", "Asma", "Hana",
  "Nabila", "Salsabila", "Nurul", "Siti", "Annisa", "Aulia", "Rahmah", "Zahra", "Syifa", "Hanifah",
  "Latifah", "Najwa", "Farah", "Kamila", "Afifah", "Luthfiyah", "Humaira", "Shafiyyah", "Ummu", "Azizah",
  "Balqis", "Dzakiyyah", "Fathiyah", "Izzah", "Madinah", "Naila", "Qonita", "Raihanah", "Tsabita", "Wardah",
];
const BELAKANG = [
  "Hidayat", "Rahman", "Nugroho", "Saputra", "Pratama", "Hakim", "Syahputra", "Ramadhan", "Firdaus", "Kurniawan",
  "Maulana", "Hasibuan", "Nasution", "Siregar", "Lubis", "Harahap", "Wijaya", "Santoso", "Setiawan", "Hamdani",
  "Fauzi", "Anshari", "Al-Amin", "Baharuddin", "Mubarak", "Zulkarnain", "Assegaf", "Alatas", "Basalamah", "Bafadhal",
  "Rasyid", "Syamsuddin", "Mahmud", "Hamid", "Latif", "Munir", "Azhari", "Iskandar", "Sulaiman", "Idris",
];

let cache: PesertaLatihan[] | null = null;

/** The 1,000 practice participants, brothers first, in number order. */
export function pesertaLatihan(): PesertaLatihan[] {
  if (cache) return cache;
  const hasil: PesertaLatihan[] = [];
  const nama = acak("nawa-latihan:nama");
  for (const gender of ["ikhwan", "akhwat"] as const) {
    const skenario = (Object.entries(KOMPOSISI[gender]) as Array<[SkenarioLatihan, number]>).flatMap(([s, n]) =>
      Array<SkenarioLatihan>(n).fill(s),
    );
    // Spread through the list, not in blocks, so the printed stack is not sorted by answer.
    const r = acak(`nawa-latihan:skenario:${gender}`);
    for (let i = skenario.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [skenario[i], skenario[j]] = [skenario[j], skenario[i]];
    }
    const depan = gender === "ikhwan" ? DEPAN_IKHWAN : DEPAN_AKHWAT;
    skenario.forEach((s, i) => {
      const urut = hasil.length + 1;
      const dua = nama() < 0.35;
      const n1 = depan[Math.floor(nama() * depan.length)];
      const n2 = dua ? ` ${depan[Math.floor(nama() * depan.length)]}` : "";
      const n3 = BELAKANG[Math.floor(nama() * BELAKANG.length)];
      const st = nama();
      hasil.push({
        urut,
        nomor: `${PREFIKS_LATIHAN}-${gender === "ikhwan" ? "B" : "S"}-${String(i + 1).padStart(4, "0")}`,
        kode: kodeDari(`nawa-latihan:kode:${urut}`),
        nama: n2 && n2.trim() === n1 ? `${n1} ${n3}` : `${n1}${n2} ${n3}`,
        gender,
        // 0800 is not a mobile range: nothing can ever reach a real person.
        wa: `6280000${String(urut).padStart(5, "0")}`,
        statusLipia: st < 0.7 ? "mahasiswa" : st < 0.9 ? "khirrij" : "mutarabbish",
        skenario: s,
      });
    });
  }
  cache = hasil;
  return hasil;
}

/**
 * Cards that are not on the practice list, for the NOT VALID drills: well-formed
 * codes that belong to nobody here, and QR codes that are not tickets at all.
 */
export function kartuLuarLatihan(): Array<{ isi: string; judul: string; arti: string }> {
  const luar = Array.from({ length: 8 }, (_, i) => ({
    isi: kodeDari(`nawa-latihan:luar:${i + 1}`),
    judul: `Tiket program lain #${i + 1}`,
    arti: "Kode sah tapi bukan peserta program ini",
  }));
  return [
    ...luar,
    { isi: "https://nawaroom.id", judul: "QR tautan website", arti: "Bukan tiket" },
    { isi: "LAT-B-0001", judul: "QR berisi nomor, bukan kode", arti: "Bukan tiket" },
  ];
}
