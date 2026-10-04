import { emberLimaMenit, labelEmber, type Lang } from "@/lib/waktu";

export type Batang = { kunci: string; label: string; jumlah: number; puncak: boolean };

/**
 * Arrival rate in five-minute buckets, computed in WIB. Pure so it can be tested
 * without a database, which is the whole point: this is the calculation that
 * silently breaks when the server runs in UTC.
 */
export function lajuKedatangan(
  waktu: Date[],
  lang: Lang = "en",
  // Four hours of buckets. The committee reads the whole morning at once: a gate
  // that opens at 07:30 must still be on screen when the last stragglers scan.
  maksBatang = 48,
): Batang[] {
  if (waktu.length === 0) return [];

  const hitung = new Map<string, number>();
  for (const d of waktu) {
    const k = emberLimaMenit(d);
    hitung.set(k, (hitung.get(k) ?? 0) + 1);
  }

  const kunci = [...hitung.keys()].sort();
  const awal = kunci[0];
  const akhir = kunci[kunci.length - 1];

  // Fill the gaps so a quiet five minutes reads as a gap, not as a missing bar.
  const semua: string[] = [];
  let cur = awal;
  for (let guard = 0; guard < 1000 && cur <= akhir; guard++) {
    semua.push(cur);
    cur = emberBerikutnya(cur);
  }

  const dipakai = semua.slice(-maksBatang);
  const puncak = Math.max(...dipakai.map((k) => hitung.get(k) ?? 0));

  return dipakai.map((k) => {
    const jumlah = hitung.get(k) ?? 0;
    return { kunci: k, label: labelEmber(k, lang), jumlah, puncak: jumlah === puncak && jumlah > 0 };
  });
}

function emberBerikutnya(kunci: string): string {
  const [tanggal, jam] = kunci.split("T");
  const [y, m, d] = tanggal.split("-").map(Number);
  const [hh, mm] = jam.split(":").map(Number);
  // Bucket arithmetic on wall-clock parts. WIB has no DST, so this is exact.
  let menit = mm + 5;
  let jamBaru = hh;
  let hari = d;
  let bulan = m;
  let tahun = y;
  if (menit >= 60) {
    menit -= 60;
    jamBaru += 1;
  }
  if (jamBaru >= 24) {
    jamBaru -= 24;
    const next = new Date(Date.UTC(y, m - 1, d + 1, 12));
    tahun = next.getUTCFullYear();
    bulan = next.getUTCMonth() + 1;
    hari = next.getUTCDate();
  }
  return (
    `${tahun}-${String(bulan).padStart(2, "0")}-${String(hari).padStart(2, "0")}` +
    `T${String(jamBaru).padStart(2, "0")}:${String(menit).padStart(2, "0")}`
  );
}

export type AmbangTiket = { persen: number; tingkat: "aman" | "waspada" | "bahaya"; pesan: string };

/**
 * The percentage of participants who have opened their ticket is the only number
 * that warns *before* the problem happens, while there is still time to act on it.
 */
export function ambangTiketDibuka(dibuka: number, pendaftar: number): AmbangTiket {
  const persen = pendaftar === 0 ? 0 : (dibuka / pendaftar) * 100;
  if (persen >= 80) {
    return { persen, tingkat: "aman", pesan: "Outreach is working. Carry on as planned." };
  }
  if (persen >= 50) {
    return {
      persen,
      tingkat: "waspada",
      pesan: "The queue will be slow. Broadcast again tonight.",
    };
  }
  return {
    persen,
    tingkat: "bahaya",
    pesan: "Danger. Add greeters, open a second help desk, widen the window by 15 minutes.",
  };
}

export function persenAman(bagian: number, total: number): number {
  return total === 0 ? 0 : (bagian / total) * 100;
}
