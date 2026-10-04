import { kelompokkanTeks } from "@/lib/acara/rapikan-teks";
import { t } from "@/lib/i18n/dict";
import { KEAHLIAN, PRODI, SEMESTER, TRANSPORT, kodeKeahlian, teksKeahlianLain } from "@/lib/acara/view-model";
import { tanggalIsoWib } from "@/lib/waktu";
import { hitungPeta, type PetaWilayah } from "@/lib/wilayah/rekap";
import { JENIS_SEKOLAH, LABEL_JENIS_SEKOLAH, jenisSekolah, type JenisSekolah } from "@/lib/acara/jenis-sekolah";

/**
 * Everything the committee is asked for about who registered, computed from the rows
 * in one pass. Pure — no database — so the counting can be tested, and so every chart
 * on the page agrees with every number on it: they are cut from the same rows.
 */

export type BarisStat = {
  gender: string;
  jenis: string;
  /** Walk-ins: permitted by the committee (a seat), or still in the queue. */
  izinOts: boolean;
  konfirmasi: boolean | null;
  sumber: string;
  statusLipia: string | null;
  prodi: string | null;
  semester: string | null;
  sesi: string | null;
  tahunLulus: string | null;
  domisili: string | null;
  asalDaerah: string | null;
  asalSekolah: string | null;
  keahlian: string | null;
  transportasi: string | null;
  kebutuhanKhusus: string | null;
  punyaAkun: boolean;
  grupWa: boolean;
  tiketDibuka: boolean;
  hadir: boolean;
  createdAt: Date;
};

export type Irisan = {
  kunci: string;
  label: string;
  n: number;
  /** For free text: the other spellings counted under this label. */
  ejaan?: string[];
};

export type Distribusi = {
  kunci: string;
  judul: string;
  /** People who answered. For a multi-choice question, the percentages are of these. */
  menjawab: number;
  kosong: number;
  irisan: Irisan[];
  bentuk: "donat" | "batang";
  multi?: boolean;
  /** Free-text answers that were folded into "Other", shown under the chart. */
  catatan?: string[];
  /** Free text: the groups behind the "N other answers" bar, most common first. */
  lainnya?: Irisan[];
  /** Places: the same answers placed on the map, province → regency → district. */
  peta?: PetaWilayah;
  /** Schools: the same answers by type, each with its schools grouped as free text. */
  jenis?: { kunci: JenisSekolah; label: string; n: number; sekolah: Irisan[] }[];
};

export type AngkaSisi = {
  kuota: number | null;
  kursi: number;
  /** Walk-ins permitted (they hold a seat). */
  ots: number;
  /** Walk-ins still in the queue. */
  otsMenunggu: number;
  lepas: number;
  hadir: number;
};

export type Statistik = {
  /** Active registrations still holding a seat or a place: released ones excluded. */
  total: number;
  kursi: number;
  ots: number;
  otsMenunggu: number;
  lepas: number;
  hadir: number;
  hadirKursi: number;
  hadirOts: number;
  akun: number;
  grupWa: number;
  tiketDibuka: number;
  sisi: { ikhwan: AngkaSisi; akhwat: AngkaSisi };
  harian: Array<{ tanggal: string; n: number; kumulatif: number }>;
  distribusi: Distribusi[];
};

const MAKS_IRISAN_TEKS = 10;

function rapikan(v: string | null | undefined): string {
  return (v ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Counts one answer per person. Unknown codes are kept under their own label rather
 * than dropped — an option renamed after launch should show up, not vanish.
 */
function hitungPilihan(
  nilai: Array<string | null>,
  urutan: readonly string[],
  label: (k: string) => string,
): { irisan: Irisan[]; kosong: number } {
  const m = new Map<string, number>();
  let kosong = 0;
  for (const v of nilai) {
    const k = rapikan(v);
    if (!k) {
      kosong++;
      continue;
    }
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  const dikenal = urutan.filter((k) => m.has(k));
  const lain = [...m.keys()].filter((k) => !urutan.includes(k)).sort((a, b) => m.get(b)! - m.get(a)!);
  return {
    irisan: [...dikenal, ...lain].map((k) => ({ kunci: k, label: label(k), n: m.get(k)! })),
    kosong,
  };
}

/**
 * Free text grouped so one place or school counts once however it was written
 * ("PP Al-Uji", "ponpes al uji"; "Jaksel", "Jakarta Selatan"), shown under the spelling
 * most people used, top ten and the rest as one slice.
 */
function hitungTeks(nilai: Array<string | null>): { irisan: Irisan[]; kosong: number; lainnya: Irisan[] } {
  const { grup, kosong } = kelompokkanTeks(nilai);
  const atas: Irisan[] = grup.slice(0, MAKS_IRISAN_TEKS);
  const sisa = grup.slice(MAKS_IRISAN_TEKS);
  if (sisa.length) {
    atas.push({
      kunci: "__lainnya",
      label: `${sisa.length} other answers`,
      n: sisa.reduce((s, g) => s + g.n, 0),
    });
  }
  return { irisan: atas, kosong, lainnya: sisa };
}

/** Schools by what kind they are, and within each kind the schools themselves. */
function hitungJenisSekolah(nilai: Array<string | null>): NonNullable<Distribusi["jenis"]> {
  const per = new Map<JenisSekolah, string[]>();
  for (const v of nilai) {
    const j = jenisSekolah(v);
    if (!j) continue;
    per.set(j, [...(per.get(j) ?? []), v!]);
  }
  return JENIS_SEKOLAH.filter((j) => per.has(j))
    .map((j) => ({
      kunci: j,
      label: LABEL_JENIS_SEKOLAH[j],
      n: per.get(j)!.length,
      sekolah: kelompokkanTeks(per.get(j)!).grup.map((g) => ({ kunci: g.kunci, label: g.label, n: g.n, ejaan: g.ejaan })),
    }))
    .sort((a, b) => (a.kunci === "lain" ? 1 : b.kunci === "lain" ? -1 : b.n - a.n));
}

function sisiKosong(kuota: number | null): AngkaSisi {
  return { kuota, kursi: 0, ots: 0, otsMenunggu: 0, lepas: 0, hadir: 0 };
}

export function hitungStatistik(
  semua: BarisStat[],
  kuota: { ikhwan: number | null; akhwat: number | null },
): Statistik {
  const d = t("en").form;
  const s: Statistik = {
    total: 0,
    kursi: 0,
    ots: 0,
    otsMenunggu: 0,
    lepas: 0,
    hadir: 0,
    hadirKursi: 0,
    hadirOts: 0,
    akun: 0,
    grupWa: 0,
    tiketDibuka: 0,
    sisi: { ikhwan: sisiKosong(kuota.ikhwan), akhwat: sisiKosong(kuota.akhwat) },
    harian: [],
    distribusi: [],
  };

  const aktif: BarisStat[] = [];
  const perHari = new Map<string, number>();
  for (const r of semua) {
    const sisi = r.gender === "akhwat" ? s.sisi.akhwat : s.sisi.ikhwan;
    const hari = tanggalIsoWib(r.createdAt);
    perHari.set(hari, (perHari.get(hari) ?? 0) + 1);

    // A released seat still counts if they came anyway: they are in the hall.
    if (r.konfirmasi === false && !r.hadir) {
      s.lepas++;
      sisi.lepas++;
      continue;
    }
    aktif.push(r);
    s.total++;
    if (r.jenis === "ots") {
      if (r.izinOts) {
        s.ots++;
        sisi.ots++;
      } else {
        s.otsMenunggu++;
        sisi.otsMenunggu++;
      }
    } else {
      s.kursi++;
      sisi.kursi++;
    }
    if (r.hadir) {
      s.hadir++;
      sisi.hadir++;
      if (r.jenis === "ots") s.hadirOts++;
      else s.hadirKursi++;
    }
    if (r.punyaAkun) s.akun++;
    if (r.grupWa) s.grupWa++;
    if (r.tiketDibuka) s.tiketDibuka++;
  }

  let kumulatif = 0;
  s.harian = [...perHari.keys()].sort().map((tanggal) => {
    kumulatif += perHari.get(tanggal)!;
    return { tanggal, n: perHari.get(tanggal)!, kumulatif };
  });

  const tambah = (
    kunci: string,
    judul: string,
    bentuk: Distribusi["bentuk"],
    h: Pick<Distribusi, "irisan" | "kosong" | "lainnya">,
    ekstra: Partial<Distribusi> = {},
  ) => {
    s.distribusi.push({
      kunci,
      judul,
      bentuk,
      menjawab: h.irisan.reduce((a, i) => a + i.n, 0),
      ...h,
      ...ekstra,
    });
  };

  tambah(
    "gender",
    "Gender",
    "donat",
    hitungPilihan(
      aktif.map((r) => r.gender),
      ["ikhwan", "akhwat"],
      (k) => (k === "akhwat" ? "Sisters" : k === "ikhwan" ? "Brothers" : k),
    ),
  );

  tambah(
    "jenis",
    "Registration type",
    "donat",
    hitungPilihan(
      aktif.map((r) => (r.jenis === "ots" ? (r.izinOts ? "ots" : "ots_menunggu") : r.jenis)),
      ["pra", "ots", "ots_menunggu"],
      (k) => ({ pra: "Seat (online)", ots: "Walk-in (permitted)", ots_menunggu: "Walk-in (in queue)" })[k] ?? k,
    ),
  );

  const labelStatus: Record<string, string> = {
    mahasiswa: "Current student",
    khirrij: "Graduate",
    mutarabbish: "Mutarabbish",
  };
  tambah(
    "status",
    "Status",
    "donat",
    hitungPilihan(
      aktif.map((r) => r.statusLipia),
      Object.keys(labelStatus),
      (k) => labelStatus[k] ?? k,
    ),
  );

  tambah(
    "prodi",
    "Programme of study",
    "donat",
    hitungPilihan(
      aktif.map((r) => r.prodi),
      PRODI,
      (k) => (d.prodiOpsi as Record<string, string>)[k] ?? k,
    ),
  );

  const mahasiswa = aktif.filter((r) => r.statusLipia === "mahasiswa");
  tambah(
    "semester",
    "Semester (current students)",
    "batang",
    hitungPilihan(
      mahasiswa.map((r) => r.semester),
      SEMESTER,
      (k) => `Semester ${k}`,
    ),
  );

  tambah(
    "sesi",
    "Class session (current students)",
    "donat",
    hitungPilihan(
      mahasiswa.map((r) => r.sesi),
      ["pagi", "sore"],
      (k) => (k === "pagi" ? d.sesiPagi : k === "sore" ? d.sesiSore : k),
    ),
  );

  const khirrij = aktif.filter((r) => r.statusLipia === "khirrij");
  if (khirrij.length) {
    const tahun = hitungPilihan(
      khirrij.map((r) => r.tahunLulus),
      [],
      (k) => k,
    );
    tahun.irisan.sort((a, b) => a.kunci.localeCompare(b.kunci));
    tambah("tahun", "Graduation year (graduates)", "batang", tahun);
  }

  tambah(
    "transport",
    "Getting there",
    "donat",
    hitungPilihan(
      aktif.map((r) => r.transportasi),
      TRANSPORT,
      (k) => (d.transport as Record<string, string>)[k] ?? k,
    ),
  );

  // Several boxes per person: each slice counts people who ticked it.
  const minat = new Map<string, number>();
  let menjawabMinat = 0;
  const teksLain: string[] = [];
  for (const r of aktif) {
    const kode = kodeKeahlian(r.keahlian);
    if (kode.length) menjawabMinat++;
    for (const k of kode) minat.set(k, (minat.get(k) ?? 0) + 1);
    const lain = teksKeahlianLain(r.keahlian);
    if (lain) teksLain.push(lain);
  }
  s.distribusi.push({
    kunci: "minat",
    judul: "Fields of interest (up to 3 each)",
    bentuk: "batang",
    multi: true,
    menjawab: menjawabMinat,
    kosong: aktif.length - menjawabMinat,
    irisan: KEAHLIAN.filter((k) => minat.has(k))
      .map((k) => ({
        kunci: k,
        label: (d.keahlianOpsi as Record<string, string>)[k] ?? k,
        n: minat.get(k)!,
      }))
      .sort((a, b) => b.n - a.n),
    catatan: teksLain.slice(0, 30),
  });

  tambah("domisili", "Where they live", "batang", hitungTeks(aktif.map((r) => r.domisili)), {
    peta: hitungPeta(aktif.map((r) => r.domisili)),
  });
  tambah("asalDaerah", "Home region", "batang", hitungTeks(aktif.map((r) => r.asalDaerah)), {
    peta: hitungPeta(aktif.map((r) => r.asalDaerah)),
  });
  tambah("asalSekolah", "School or pesantren", "batang", hitungTeks(aktif.map((r) => r.asalSekolah)), {
    jenis: hitungJenisSekolah(aktif.map((r) => r.asalSekolah)),
  });

  const kebutuhan = aktif.map((r) => rapikan(r.kebutuhanKhusus)).filter(Boolean);
  s.distribusi.push({
    kunci: "kebutuhan",
    judul: "Special needs noted",
    bentuk: "batang",
    menjawab: kebutuhan.length,
    kosong: aktif.length - kebutuhan.length,
    irisan: [],
    catatan: kebutuhan,
  });

  return s;
}
