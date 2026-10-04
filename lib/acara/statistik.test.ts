import { describe, expect, it } from "vitest";
import { hitungStatistik, type BarisStat } from "./statistik";

function baris(p: Partial<BarisStat> = {}): BarisStat {
  return {
    gender: "ikhwan",
    jenis: "pra",
    izinOts: false,
    konfirmasi: null,
    sumber: "web",
    statusLipia: "mahasiswa",
    prodi: "Syariah",
    semester: "3",
    sesi: "pagi",
    tahunLulus: null,
    domisili: "Depok",
    asalDaerah: null,
    asalSekolah: null,
    keahlian: null,
    transportasi: "umum",
    kebutuhanKhusus: null,
    punyaAkun: true,
    grupWa: false,
    tiketDibuka: false,
    hadir: false,
    createdAt: new Date("2026-09-14T03:00:00Z"),
    ...p,
  };
}

describe("hitungStatistik", () => {
  it("splits seats, walk-ins let in, walk-ins waiting and released per side", () => {
    const s = hitungStatistik(
      [
        baris(),
        baris({ jenis: "ots" }),
        baris({ gender: "akhwat", jenis: "ots", izinOts: true, hadir: true }),
        baris({ gender: "akhwat", konfirmasi: false }),
        // Released but came anyway: in the hall, so counted.
        baris({ konfirmasi: false, hadir: true }),
      ],
      { ikhwan: 400, akhwat: 600 },
    );
    expect(s.total).toBe(4);
    expect(s.kursi).toBe(2);
    expect(s.otsMenunggu).toBe(1);
    expect(s.ots).toBe(1);
    expect(s.lepas).toBe(1);
    expect(s.hadir).toBe(2);
    expect(s.hadirOts).toBe(1);
    expect(s.sisi.ikhwan).toMatchObject({ kuota: 400, kursi: 2, otsMenunggu: 1, lepas: 0 });
    expect(s.sisi.akhwat).toMatchObject({ kuota: 600, ots: 1, lepas: 1 });
  });

  it("groups free text regardless of case and spacing, under the common spelling", () => {
    const s = hitungStatistik(
      [
        baris({ domisili: "Pasar Minggu" }),
        baris({ domisili: "pasar  minggu " }),
        baris({ domisili: "Pasar Minggu" }),
        baris({ domisili: "" }),
      ],
      { ikhwan: null, akhwat: null },
    );
    const d = s.distribusi.find((x) => x.kunci === "domisili")!;
    expect(d.irisan[0]).toMatchObject({ label: "Pasar Minggu", n: 3 });
    expect(d.kosong).toBe(1);
  });

  it("merges similar spellings of schools and places into one slice", () => {
    const tanpaKuota = { ikhwan: null, akhwat: null };
    const s = hitungStatistik(
      [
        baris({ asalSekolah: "Pondok Pesantren Al-Uji", domisili: "Jakarta Selatan", asalDaerah: "Kab. Bogor" }),
        baris({ asalSekolah: "ponpes al uji", domisili: "Jaksel", asalDaerah: "Kabupaten Bogor" }),
        baris({ asalSekolah: "PP Al Uji", domisili: "jakarta selatan ", asalDaerah: "Bogor" }),
        baris({ asalSekolah: "Pesantren Al-Uji", domisili: "Jakarta Selatan", asalDaerah: "Kab. Bogor" }),
        baris({ asalSekolah: "SMAN 1 Depok", domisili: "Depok", asalDaerah: "Jateng" }),
      ],
      tanpaKuota,
    );
    const irisan = (k: string) => s.distribusi.find((x) => x.kunci === k)!.irisan.map((i) => [i.label, i.n]);
    expect(irisan("asalSekolah")).toEqual([
      ["Pondok Pesantren Al-Uji", 4],
      ["SMAN 1 Depok", 1],
    ]);
    expect(irisan("domisili")).toEqual([
      ["Jakarta Selatan", 4],
      ["Depok", 1],
    ]);
    expect(irisan("asalDaerah")).toEqual([
      ["Kab. Bogor", 4],
      ["Jateng", 1],
    ]);
  });

  it("keeps the top ten merged groups and folds the rest into one slice", () => {
    const sekolah = Array.from({ length: 13 }, (_, i) => `SMAN ${i + 1} Depok`);
    const s = hitungStatistik(
      [...sekolah, "SMA Negeri 1 Depok", "sman 1 depok"].map((asalSekolah) => baris({ asalSekolah })),
      { ikhwan: null, akhwat: null },
    );
    const d = s.distribusi.find((x) => x.kunci === "asalSekolah")!;
    expect(d.irisan).toHaveLength(11);
    expect(d.irisan[0]).toMatchObject({ label: "SMA Negeri 1 Depok", n: 3 });
    expect(d.irisan[10]).toEqual({ kunci: "__lainnya", label: "3 other answers", n: 3 });
    expect(d.menjawab).toBe(15);
  });

  it("counts every ticked interest per person and keeps the written 'other'", () => {
    const s = hitungStatistik(
      [baris({ keahlian: "quran,arab" }), baris({ keahlian: "arab,lain,lain:Falak" }), baris({ keahlian: null })],
      { ikhwan: null, akhwat: null },
    );
    const d = s.distribusi.find((x) => x.kunci === "minat")!;
    expect(d.menjawab).toBe(2);
    expect(d.irisan.find((i) => i.kunci === "arab")?.n).toBe(2);
    expect(d.catatan).toEqual(["Falak"]);
  });

  it("counts registrations per WIB day with a running total", () => {
    const s = hitungStatistik(
      [
        // 23:30 UTC on the 13th is already the 14th in Jakarta.
        baris({ createdAt: new Date("2026-09-13T23:30:00Z") }),
        baris({ createdAt: new Date("2026-09-14T05:00:00Z") }),
        baris({ createdAt: new Date("2026-09-12T05:00:00Z") }),
      ],
      { ikhwan: null, akhwat: null },
    );
    expect(s.harian).toEqual([
      { tanggal: "2026-09-12", n: 1, kumulatif: 1 },
      { tanggal: "2026-09-14", n: 2, kumulatif: 3 },
    ]);
  });
});
