import { normalizePhone } from "@/lib/wa";
import type { Gender, InputPendaftaran } from "@/lib/acara/daftar";

export type BarisCsv = {
  no: number;
  input: InputPendaftaran | null;
  alasan?: string;
  waMentah: string;
};

/** RFC-ish CSV split: handles quoted fields and embedded commas and newlines. */
export function parseCsv(teks: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuote = false;

  const bersih = teks.replace(/^﻿/, "").replace(/\r\n?/g, "\n");

  for (let i = 0; i < bersih.length; i++) {
    const c = bersih[i];
    if (inQuote) {
      if (c === '"') {
        if (bersih[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuote = false;
      } else cur += c;
      continue;
    }
    if (c === '"') inQuote = true;
    else if (c === "," || c === ";" || c === "\t") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else cur += c;
  }
  if (cur !== "" || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const ALIAS: Record<string, string[]> = {
  nama: ["nama", "name", "nama lengkap", "full name", "الاسم"],
  wa: ["wa", "whatsapp", "no wa", "nomor wa", "phone", "hp", "nomor whatsapp", "الواتساب"],
  gender: ["gender", "jenis kelamin", "ikhwan/akhwat", "l/p"],
  status_lipia: ["status", "status lipia", "status_lipia"],
  nim: ["nim", "student number", "no induk"],
  prodi: ["prodi", "program studi", "programme", "program"],
  sesi: ["sesi", "session", "sesi kuliah"],
  semester: ["semester", "smt"],
  tahun_lulus: ["tahun lulus", "tahun_lulus", "graduation", "angkatan lulus"],
  domisili: ["domisili", "alamat", "kota", "city"],
  email: ["email", "e-mail", "surel"],
};

function petaKolom(header: string[]): Record<string, number> {
  const peta: Record<string, number> = {};
  header.forEach((h, i) => {
    const k = h.trim().toLowerCase();
    for (const [field, aliases] of Object.entries(ALIAS)) {
      if (aliases.includes(k) && peta[field] === undefined) peta[field] = i;
    }
  });
  return peta;
}

function tebakGender(v: string): Gender {
  const s = v.trim().toLowerCase();
  if (["akhwat", "p", "perempuan", "f", "female", "sister", "sisters", "w"].includes(s)) {
    return "akhwat";
  }
  return "ikhwan";
}

function tebakStatus(v: string): string {
  const s = v.trim().toLowerCase();
  if (s.startsWith("khir") || s.includes("alum") || s.includes("lulus") || s.includes("grad")) {
    return "khirrij";
  }
  if (s.startsWith("tarob") || s.startsWith("mutarab") || s.includes("non-degree"))
    return "mutarabbish";
  return "mahasiswa";
}

/**
 * Turns a CSV into rows ready for daftarPeserta. A row that cannot be normalised is
 * returned with a reason and REPORTED — never silently dropped.
 */
export function siapkanImpor(teks: string): { baris: BarisCsv[]; header: string[] } {
  const rows = parseCsv(teks);
  if (rows.length === 0) return { baris: [], header: [] };

  const header = rows[0].map((h) => h.trim());
  const peta = petaKolom(header);
  const ambil = (r: string[], k: string) =>
    peta[k] === undefined ? "" : (r[peta[k]] ?? "").trim();

  const baris: BarisCsv[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const nama = ambil(r, "nama");
    const waMentah = ambil(r, "wa");
    const wa = normalizePhone(waMentah);

    if (!nama || nama.length < 3) {
      baris.push({ no: i, input: null, alasan: "name missing or too short", waMentah });
      continue;
    }
    if (!wa) {
      baris.push({ no: i, input: null, alasan: "WhatsApp number unreadable", waMentah });
      continue;
    }

    const status = tebakStatus(ambil(r, "status_lipia"));
    baris.push({
      no: i,
      waMentah,
      input: {
        nama,
        wa,
        gender: tebakGender(ambil(r, "gender")),
        statusLipia: status,
        nim: status === "mahasiswa" ? ambil(r, "nim") || null : null,
        prodi: status === "mahasiswa" ? ambil(r, "prodi") || null : null,
        sesi: status === "mahasiswa" ? ambil(r, "sesi") || null : null,
        semester: status === "mahasiswa" ? ambil(r, "semester") || null : null,
        tahunLulus: status === "mahasiswa" ? null : ambil(r, "tahun_lulus") || null,
        domisili: ambil(r, "domisili") || null,
        email: ambil(r, "email") || null,
      },
    });
  }

  return { baris, header };
}
