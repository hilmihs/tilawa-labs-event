"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n/dict";

export type DataSimpan = {
  nomor: string;
  nama: string;
  kode: string;
  pintu: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  acara: string;
  url: string;
  wa: string;
};

/**
 * Two ways to keep a ticket, because a link in a browser tab is not kept at all.
 *
 * The first sends it to the participant's own WhatsApp. We know their number, so
 * the link opens a chat with themselves — one tap and the ticket is searchable in
 * the app they already live in, for as long as the phone lasts. That solves losing
 * the link far better than any recovery flow, which is worth doing precisely
 * because recovery relies on a number and a name that are both semi-public.
 *
 * The second draws a card and saves it to the gallery. A screenshot works, but it
 * arrives cropped and dimmed by whatever the screen brightness was; a drawn card is
 * pure black on white at a fixed size, which is what a scanner needs at a gate in
 * the morning sun.
 */
export function SimpanTiket({
  lang,
  data,
  gender,
}: {
  lang: Lang;
  data: DataSimpan;
  gender?: string | null;
}) {
  const d = t(lang, gender);
  const [sibuk, setSibuk] = useState(false);

  const teks = [
    `${d.simpan.templateJudul} — ${data.acara}`,
    "",
    `${d.tiket.nomor}: ${data.nomor}`,
    `${d.tiket.nama}: ${data.nama}`,
    `${d.tiket.entrance}: ${data.pintu}`,
    `${d.tiket.waktu}: ${data.tanggal}${lang === "ar" ? "، " : " · "}${data.waktu}`,
    `${d.tiket.tempat}: ${data.lokasi}`,
    "",
    d.simpan.templatePenutup,
    data.url,
  ].join("\n");

  // Their own number, so this opens a chat with themselves rather than a share sheet.
  const waUrl = `https://wa.me/${data.wa}?text=${encodeURIComponent(teks)}`;

  async function unduhKartu() {
    setSibuk(true);
    try {
      const QR = (await import("qrcode")).default;
      const S = 3; // draw at 3× so it stays sharp when the gallery scales it
      const W = 620 * S;
      const H = 880 * S;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = c.getContext("2d");
      if (!g) return;

      g.fillStyle = "#FFFFFF";
      g.fillRect(0, 0, W, H);

      const tulis = (
        s: string,
        y: number,
        ukuran: number,
        tebal = "400",
        warna = "#2D2F2B",
      ) => {
        g.fillStyle = warna;
        g.font = `${tebal} ${ukuran * S}px system-ui, sans-serif`;
        g.textAlign = "center";
        g.fillText(s, W / 2, y * S);
      };

      tulis(data.acara, 62, 20, "600");
      tulis(d.tiket.nomor.toUpperCase(), 100, 13, "700", "#8C8E8C");
      tulis(data.nomor, 140, 34, "700");

      // The QR is drawn last and largest: it is the only part a machine reads.
      const qrData = await QR.toDataURL(data.kode, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 420 * S,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = qrData;
      });
      g.drawImage(img, (W - 420 * S) / 2, 175 * S, 420 * S, 420 * S);

      tulis(data.nama, 632, 24, "600");
      tulis(data.pintu, 668, 17, "400", "#585D5D");
      tulis(`${data.tanggal}${lang === "ar" ? "، " : " · "}${data.waktu}`, 706, 16, "400", "#585D5D");
      tulis(data.lokasi, 738, 16, "400", "#585D5D");

      g.strokeStyle = "#EBEDE9";
      g.lineWidth = 1 * S;
      g.beginPath();
      g.moveTo(60 * S, 776 * S);
      g.lineTo((620 - 60) * S, 776 * S);
      g.stroke();
      tulis(d.simpan.kartuCatatan, 812, 14, "400", "#8C8E8C");

      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `${data.nomor}.png`;
      a.click();
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <a href={waUrl} target="_blank" rel="noreferrer noopener" className="btn btn-primary w-full">
        {d.simpan.keWa}
      </a>
      <button type="button" onClick={unduhKartu} disabled={sibuk} className="btn btn-ghost w-full">
        {sibuk ? d.simpan.menyiapkan : d.simpan.unduh}
      </button>
      <p className="text-[13px] leading-[1.6] text-[var(--color-ink-3)]">{d.simpan.catatan}</p>
    </div>
  );
}
