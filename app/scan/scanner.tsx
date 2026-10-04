"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { KELOMPOK_GATE } from "@/lib/acara/view-model";
import { isKodeValid, normalizeKode } from "@/lib/tiket/kode";
import {
  ambilManifes,
  antrekan,
  hapusAntrean,
  hapusManifesDanAntreanUntuk,
  isiAntrean,
  manifesKedaluwarsa,
  simpanManifes,
  type Manifes,
  type PindaiAntre,
} from "@/lib/scan/offline";
import { bunyiHijau, bunyiKuning, bunyiMerah, siapkanAudio } from "@/lib/scan/umpan-balik";
import { formatJam } from "@/lib/waktu";

type Keadaan =
  | { warna: "siap" }
  | { warna: "hijau"; nomor: string; nama: string; gender: string; ket?: string | null; lokal?: boolean }
  | {
      warna: "kuning";
      nomor: string;
      nama: string;
      gender: string;
      ket?: string | null;
      pertama?: string | null;
      gate?: string | null;
      lokal?: boolean;
    }
  | {
      // A walk-in the committee has not let in yet. Not a refusal and not an
      // admission — the usher decides, here or at the help desk.
      warna: "antre";
      nomor: string;
      nama: string;
      gender: string;
      ket?: string | null;
      posisi?: number | null;
      // Absent offline: the list on the phone carries no ids, so the permit — which
      // is a write — has to wait for the network or for the help desk.
      pesertaId?: string | null;
      lokal?: boolean;
    }
  | { warna: "merah"; kode: string }
  // The server said no vs. we could not ask anyone. Showing a valid ticket-holder
  // the red "not on the list" screen because a session expired is how a queue stops.
  | { warna: "abu"; kode: string; sebab: string };

type Hasil = Exclude<Keadaan, { warna: "siap" }>;

/** What /api/scan and /api/hadir answer for one ticket. */
type HasilServer =
  | { keadaan: "hijau"; nomor: string; nama: string; gender: string; keterangan: string | null }
  | {
      keadaan: "kuning";
      nomor: string;
      nama: string;
      gender: string;
      keterangan: string | null;
      pertamaAt: string;
      pertamaGate: string | null;
    }
  | {
      keadaan: "antre";
      nomor: string;
      nama: string;
      gender: string;
      keterangan: string | null;
      posisi: number | null;
      pesertaId?: string;
    }
  | { keadaan: "merah"; kode: string }
  | { keadaan: "gagal"; kode: string };

/** One row of a search by name, number or WhatsApp digits (see /api/cari). */
type BarisCari = {
  id: string;
  nomor: string;
  nama: string;
  gender: string;
  aktif: boolean;
  jenis: string;
  urutOts: number | null;
  izinOts: boolean;
  konfirmasi: boolean | null;
  scannedAt: string | null;
  gate: string | null;
};

type Pencarian = { q: string; hasil: BarisCari[]; sibuk: boolean; pesan: string | null };

/*
 * The result no longer covers the camera, so it does not have to be cleared before
 * the next person can be scanned — it only has to stay long enough to be read. A new
 * code replaces it at once.
 */
const JEDA_TAMPIL_MS = 4000;
/*
 * The camera keeps reading while the result is on screen, and the participant is
 * usually still holding their phone up. The same code inside this window is the same
 * person, not a second entry — without it every ticket would turn yellow a moment
 * after it turned green.
 */
const JEDA_KODE_SAMA_MS = 6000;
/*
 * After a result, a *different* code is ignored for this long. Two people at the
 * gate hold their phones up at once, and the second ticket used to replace the
 * first on screen before the usher had read it — green, then yellow, then nobody
 * knows who was let in. A bar drains across the card so the pause is visible and
 * predictable; tapping the card ends it early. Typed codes never wait.
 */
const JEDA_ANTAR_KODE_MS = 2000;
/*
 * A card that asks the usher for a decision holds the camera off until they give
 * one, rather than for the couple of seconds a plain result gets. Not forever: a
 * phone left face-up on the table must come back by itself, or the next shift finds
 * a scanner that reads nothing and no reason why.
 */
const TAHAN_KEPUTUSAN_MS = 3 * 60 * 1000;
/*
 * A scan waits this long for the server before falling back to the offline list.
 * One cell tower and a thousand phones make "online but nothing arrives" the normal
 * failure on the day, and a scanner that hangs on it stops the queue.
 */
const BATAS_TUNGGU_MS = 2500;
const K_GATE = "nawa.gate";
const K_PETUGAS = "nawa.petugas";
const K_KAMERA = "nawa.kamera";

type Hadap = "environment" | "user";

/*
 * The big tick in the middle of the screen stays this long. Long enough to be seen
 * from the corner of the eye, gone before the next ticket is up.
 */
const JEDA_IKON_MS = 1300;

/** `?acara=` for the programme a call is about; nothing when we do not know one. */
function acaraQs(slug: string | null | undefined): string {
  return slug ? `?acara=${encodeURIComponent(slug)}` : "";
}

type BarcodeDetectorLike = { detect(src: CanvasImageSource): Promise<Array<{ rawValue: string }>> };
type BarcodeDetectorCtor = {
  new (opts: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};

/** The phone's own QR decoder when it has one: much faster than decoding in JS. */
async function detektorBawaan(): Promise<BarcodeDetectorLike | null> {
  const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    const f = (await Ctor.getSupportedFormats?.()) ?? [];
    if (!f.includes("qr_code")) return null;
    return new Ctor({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

function labelGender(g: string): string {
  return g === "akhwat" ? "Sisters" : "Brothers";
}

/**
 * `slugPilihan` is the programme the staff picked in the header. It wins over the
 * stored manifest's slug for everything sent live: one deployment serves many
 * programmes, and a phone that still holds last week's offline list must not file
 * today's scans under last week's programme.
 */
export function Scanner({
  namaSesi,
  slugPilihan,
}: {
  namaSesi: string;
  slugPilihan: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const terakhirKode = useRef<{ kode: string; at: number }>({ kode: "", at: 0 });
  const jeda = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tahanSampai = useRef(0);
  const jedaTahan = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tahan, setTahan] = useState(false);

  const [gate, setGate] = useState<string>("");
  const [petugas, setPetugas] = useState<string>(namaSesi);
  const [siapPilih, setSiapPilih] = useState(true);
  const [keadaan, setKeadaan] = useState<Keadaan>({ warna: "siap" });
  const [riwayat, setRiwayat] = useState<Array<{ id: number; hasil: Hasil; jam: Date }>>([]);
  const [online, setOnline] = useState(true);
  const [menunggu, setMenunggu] = useState(0);
  const [manifes, setManifes] = useState<Manifes | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [kamera, setKamera] = useState<"memuat" | "bawaan" | "js" | "gagal">("memuat");
  /*
   * Which camera. The back camera by default — a ticket is held up in front of the
   * phone — but a laptop on a desk has only the front one, and an usher whose back
   * camera is cracked or fogged needs the other. Remembered per phone.
   */
  const [hadap, setHadap] = useState<Hadap>("environment");
  // A ref, not state read inside proses(): proses is memoised on [gate, petugas],
  // so a state value captured there would freeze at the render that built it and
  // every repeat offline scan would come back green.
  const hadirLokal = useRef<Set<string>>(new Set());
  const [manual, setManual] = useState("");
  const [ringkas, setRingkas] = useState<string | null>(null);
  // The box at the bottom also takes a name, a number or WhatsApp digits: the same
  // search as the help desk, so a QR that will not read does not mean a walk to the
  // desk when the usher can see the name on the ticket.
  const [cari, setCari] = useState<Pencarian | null>(null);

  // The gate is chosen once at the start of the shift and remembered.
  useEffect(() => {
    const g = localStorage.getItem(K_GATE);
    const p = localStorage.getItem(K_PETUGAS);
    if (p) setPetugas(p);
    if (localStorage.getItem(K_KAMERA) === "user") setHadap("user");
    if (g) {
      setGate(g);
      setSiapPilih(false);
    }
    void refreshManifes();
    void refreshAntrean();
  }, []);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  /*
   * Keep a copy of this page and the code it runs on in the service worker, so the
   * scanner still opens if the phone reloads it after the network is gone. Without it
   * the offline list is useless the moment someone pulls down to refresh.
   */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;
    let batal = false;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        if (batal || !navigator.onLine) return;
        const aset = performance
          .getEntriesByType("resource")
          .map((e) => new URL(e.name))
          .filter((u) => u.origin === location.origin && u.pathname.startsWith("/_next/static/"))
          .map((u) => u.pathname + u.search);
        reg.active?.postMessage({
          jenis: "simpan-halaman",
          halaman: location.pathname + location.search,
          aset,
        });
      })
      .catch(() => {
        // No offline copy of the page; scanning still works while it stays open.
      });
    return () => {
      batal = true;
    };
  }, []);

  async function refreshManifes() {
    const m = await ambilManifes();
    setManifes(m);
    // The scanner wipes its own copy once the event is over. A phone that goes home
    // with a participant list is a phone that should not have one. The stored status
    // is only as fresh as the download, so re-check with the server when possible.
    let status = m?.status;
    if (navigator.onLine) {
      try {
        const res = await fetch(`/api/event-state${acaraQs(m?.slug)}`, { cache: "no-store" });
        if (res.ok) status = ((await res.json()) as { status: string }).status;
      } catch {
        // Offline or the server is down. The stored status stands.
      }
    }
    if (m && status === "selesai") {
      // Send before erasing: a queued scan is an attendance that exists nowhere
      // else. Then wipe the list and only this programme's queue — the queue
      // outlives any one manifest now, and the other programmes on this phone still
      // have scans waiting to be filed.
      if (navigator.onLine) await kirimAntrean();
      // kirimAntrean gives up quietly on a failed batch. Anything still queued for this
      // programme has reached nobody, so nothing is erased until it has.
      const belumTerkirim = (await isiAntrean()).filter((p) => (p.slug ?? m.slug) === m.slug).length;
      if (belumTerkirim > 0) {
        setPesan(
          `Event is over, but ${belumTerkirim} scans for it have not reached the server yet. They stay on this phone — keep it online and open this page again.`,
        );
        return;
      }
      await hapusManifesDanAntreanUntuk(m.slug);
      setManifes(null);
      const sisa = await refreshAntrean();
      setPesan(
        "Event is over. The offline list on this phone has been erased." +
          (sisa > 0 ? ` ${sisa} queued scans for other programmes were kept.` : ""),
      );
    }
  }

  async function refreshAntrean(): Promise<number> {
    const antre = await isiAntrean();
    setMenunggu(antre.length);
    // Rebuilt from the queue, not kept only in memory: a reload while offline must
    // not turn a second scan of the same person back into a green screen.
    hadirLokal.current = new Set(antre.map((a) => a.kode));
    return antre.length;
  }

  const unduhManifes = useCallback(async () => {
    setSibuk(true);
    setPesan(null);
    try {
      const lama = await ambilManifes();
      const antre = await isiAntrean();
      const res = await fetch(`/api/manifest${acaraQs(slugPilihan)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const m = (await res.json()) as Manifes;
      await simpanManifes(m);
      setManifes(m);

      // Downloading another programme's list used to overwrite the old one in
      // silence, and the queue left behind looked like it belonged to the new list.
      // Every queued scan now carries its own slug, so nothing is misfiled — but the
      // usher is told, rather than left reading "12 QUEUED" as twelve scans for the
      // programme they just downloaded.
      const tertinggal = antre.filter((p) => (p.slug ?? lama?.slug) !== m.slug);
      const dasar = `Offline list ready · ${m.jumlah} participants · ${m.slug}`;
      if (tertinggal.length === 0) {
        setPesan(dasar);
      } else {
        const slugLama = tertinggal[0].slug ?? lama?.slug ?? "another programme";
        setPesan(
          `${dasar}. ${tertinggal.length} queued scans for "${slugLama}" are kept and will be sent to that programme when online.`,
        );
      }
    } catch {
      setPesan("Could not download the offline list. Check the connection.");
    } finally {
      setSibuk(false);
    }
  }, [slugPilihan]);

  const kirimAntrean = useCallback(async () => {
    const antre = await isiAntrean();
    if (antre.length === 0) return;
    const m = await ambilManifes();
    setSibuk(true);
    try {
      // Each scan carries the programme it was taken for, so the queue is flushed
      // per programme and never all into whichever list the phone holds now. Scans
      // queued by an older build have no slug: the stored manifest is what they were
      // scanned against, so that is where they belong.
      const grup = new Map<string, PindaiAntre[]>();
      for (const p of antre) {
        const s = p.slug ?? m?.slug ?? "";
        const ada = grup.get(s);
        if (ada) ada.push(p);
        else grup.set(s, [p]);
      }

      // Sent in chunks so a flaky connection loses one batch, not the queue.
      let terkirim = 0;
      let bentrok = 0;
      let gagal = 0;
      let tidakDikenal = 0;
      for (const [slug, isi] of grup) {
        for (let i = 0; i < isi.length; i += 50) {
          const batch = isi.slice(i, i + 50);
          let res: Response;
          try {
            res = await fetch(`/api/scan${acaraQs(slug)}`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ pindai: batch.map(({ id: _id, slug: _s, ...p }) => p) }),
            });
          } catch {
            // The network went again mid-sync. What was not sent stays queued.
            break;
          }
          // Only this programme's remaining chunks are abandoned; the other
          // programmes in the queue still get their turn.
          if (!res.ok) break;
          const { hasil } = (await res.json()) as { hasil: Array<{ keadaan: string }> };
          bentrok += hasil.filter((h) => h.keadaan === "kuning").length;

          // Delete what was recorded, and what can never be: a code the server does
          // not know (merah) will not become valid by retrying, and kept it would
          // read "still queued" on this phone for good. Only "gagal" — the server
          // failing — stays queued for the next sync.
          const selesai = batch.filter((_, i) => {
            const k = hasil[i]?.keadaan;
            return k === "hijau" || k === "kuning" || k === "merah" || k === "antre";
          });
          const tercatat = batch.filter((_, i) => hasil[i]?.keadaan === "hijau" || hasil[i]?.keadaan === "kuning");
          tidakDikenal += selesai.length - tercatat.length;
          gagal += batch.length - selesai.length;
          await hapusAntrean(selesai.map((b) => b.id!).filter(Boolean));
          terkirim += tercatat.length;
        }
      }
      await refreshAntrean();
      if (terkirim > 0 || gagal > 0 || tidakDikenal > 0) {
        // Told plainly, not hidden: two offline scanners cannot see each other, so
        // the same person can be accepted at two gates and it only shows up now.
        const bagian = [`Synced ${terkirim} scans.`];
        if (bentrok > 0) {
          bagian.push(
            `${bentrok} were already scanned elsewhere — most likely the same person at two gates while both were offline.`,
          );
        }
        if (tidakDikenal > 0) {
          bagian.push(
            `${tidakDikenal} codes are not on the participant list and were not recorded.`,
          );
        }
        if (gagal > 0) {
          bagian.push(
            `${gagal} could not be recorded and are still queued on this phone. Tell the committee.`,
          );
        }
        if (bentrok === 0 && gagal === 0 && tidakDikenal === 0) bagian.push("No conflicts.");
        setRingkas(bagian.join(" "));
      }
    } finally {
      setSibuk(false);
    }
  }, []);

  useEffect(() => {
    if (online) void kirimAntrean();
  }, [online, kirimAntrean]);

  const tampilkan = useCallback((k: Hasil) => {
    setKeadaan(k);
    setRiwayat((r) => [{ id: Date.now() + Math.random(), hasil: k, jam: new Date() }, ...r].slice(0, 6));
    if (k.warna === "hijau") bunyiHijau();
    else if (k.warna === "kuning" || k.warna === "antre") bunyiKuning();
    else if (k.warna === "merah" || k.warna === "abu") bunyiMerah();

    /*
     * Back to ready without the usher touching the screen. Their hands are busy.
     *
     * Except when the card carries a decision: a walk-in waiting for a permit stays
     * until the usher permits them or taps the card away. Four seconds to find and
     * hit a button, with somebody talking to you, is not a choice — it is a miss.
     */
    if (jeda.current) clearTimeout(jeda.current);
    if (!(k.warna === "antre" && k.pesertaId)) {
      jeda.current = setTimeout(() => setKeadaan({ warna: "siap" }), JEDA_TAMPIL_MS);
    }

    // The next ticket waits until this one has been read. A card awaiting a decision
    // holds the camera off for as long as it is up, so the answer cannot be replaced
    // by the next person's ticket mid-tap.
    const keputusan = k.warna === "antre" && Boolean(k.pesertaId);
    tahanSampai.current = Date.now() + (keputusan ? TAHAN_KEPUTUSAN_MS : JEDA_ANTAR_KODE_MS);
    setTahan(true);
    if (jedaTahan.current) clearTimeout(jedaTahan.current);
    if (!keputusan) jedaTahan.current = setTimeout(() => setTahan(false), JEDA_ANTAR_KODE_MS);
  }, []);

  const tutupHasil = useCallback(() => {
    if (jeda.current) clearTimeout(jeda.current);
    if (jedaTahan.current) clearTimeout(jedaTahan.current);
    setKeadaan({ warna: "siap" });
    setTahan(false);
    tahanSampai.current = 0;

    // Dismissing by hand means "scan that again on purpose".
    terakhirKode.current = { kode: "", at: 0 };
  }, []);

  /** A server answer onto the screen. `kode` is what to show when the answer is "no". */
  const tampilkanServer = useCallback(
    (h: HasilServer, kode: string) => {
      if (h.keadaan === "gagal") throw new Error("failed");
      if (h.keadaan === "merah") tampilkan({ warna: "merah", kode });
      else if (h.keadaan === "antre")
        tampilkan({
          warna: "antre",
          nomor: h.nomor,
          nama: h.nama,
          gender: h.gender,
          ket: h.keterangan,
          posisi: h.posisi,
          pesertaId: h.pesertaId,
        });
      else if (h.keadaan === "hijau")
        tampilkan({ warna: "hijau", nomor: h.nomor, nama: h.nama, gender: h.gender, ket: h.keterangan });
      else
        tampilkan({
          warna: "kuning",
          nomor: h.nomor,
          nama: h.nama,
          gender: h.gender,
          ket: h.keterangan,
          pertama: h.pertamaAt,
          gate: h.pertamaGate,
        });
    },
    [tampilkan],
  );

  const proses = useCallback(
    async (kodeMentah: string, metode: "qr" | "manual" = "qr") => {
      const kode = normalizeKode(kodeMentah);
      if (!isKodeValid(kode)) {
        // A QR that is not a ticket at all (a poster, a payment code) is read over
        // and over while it stays in frame; say so once, not twenty times.
        const now = Date.now();
        const mentah = kodeMentah.slice(0, 24);
        if (terakhirKode.current.kode === mentah && now - terakhirKode.current.at < JEDA_KODE_SAMA_MS) {
          return;
        }
        if (metode === "qr" && now < tahanSampai.current) return;
        terakhirKode.current = { kode: mentah, at: now };
        tampilkan({ warna: "merah", kode: mentah });
        return;
      }

      // The same code still in front of the camera is the same person.
      const now = Date.now();
      if (terakhirKode.current.kode === kode && now - terakhirKode.current.at < JEDA_KODE_SAMA_MS) return;
      // A different code while the last result is still being read: not yet.
      if (metode === "qr" && now < tahanSampai.current) return;
      terakhirKode.current = { kode, at: now };

      const clientScannedAt = new Date().toISOString();
      // Read from IndexedDB, never from the `manifes` state: this callback is
      // memoised and the camera effect depends on it, so a manifest dependency here
      // tears the camera down and re-opens it on every refresh. The `??` also means
      // the store is only touched when no programme was picked.
      const slugKirim = slugPilihan ?? (await ambilManifes())?.slug;
      const antre: PindaiAntre = {
        kode,
        gate: gate || null,
        petugas: petugas || null,
        metode,
        clientScannedAt,
        offline: true,
        slug: slugKirim,
      };

      if (!navigator.onLine) {
        await pindaiOffline(kode, antre);
        return;
      }

      const henti = new AbortController();
      const waktuHabis = setTimeout(() => henti.abort(), BATAS_TUNGGU_MS);
      try {
        const res = await fetch(`/api/scan${acaraQs(slugKirim)}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            // The programme rides in the query string; the server ignores it here.
            pindai: [{ ...antre, slug: undefined, offline: false, clientScannedAt }],
          }),
          signal: henti.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const { hasil } = (await res.json()) as { hasil: HasilServer[] };
        const h = hasil[0];
        if (!h) throw new Error("failed");
        tampilkanServer(h, kode);
      } catch (e) {
        // The network dropped mid-scan, took too long, or the staff session expired.
        // Fall through to the offline list rather than showing an error to someone
        // standing in front of a queue — but say "cannot verify", never "not on the list".
        const sebab = henti.signal.aborted ? "Server too slow." : `Server unreachable (${String(e).slice(0, 40)}).`;
        await pindaiOffline(kode, antre, sebab);
      } finally {
        clearTimeout(waktuHabis);
      }
    },
    [gate, petugas, tampilkan, tampilkanServer, slugPilihan],
  );

  /*
   * A name, a number or WhatsApp digits. Online it is the help desk's search; offline
   * the phone only holds numbers and first names, so a participant number typed in
   * full is looked up in the offline list and treated like its QR.
   */
  const cariPeserta = useCallback(
    async (q: string) => {
      const bersih = q.trim();
      if (!navigator.onLine) {
        const m = await ambilManifes();
        const baris = m ? Object.values(m.peta).find((b) => b.n.toUpperCase() === bersih.toUpperCase()) : null;
        if (baris) {
          terakhirKode.current = { kode: "", at: 0 };
          void proses(baris.k, "manual");
          return;
        }
        setCari({
          q: bersih,
          hasil: [],
          sibuk: false,
          pesan: m
            ? "Offline: only a full participant number (e.g. LAT-B-0118) can be looked up on this phone."
            : "Offline, and no offline list on this phone.",
        });
        return;
      }
      setCari({ q: bersih, hasil: [], sibuk: true, pesan: null });
      try {
        const slug = slugPilihan ?? (await ambilManifes())?.slug;
        const url = `/api/cari${acaraQs(slug)}${slug ? "&" : "?"}q=${encodeURIComponent(bersih)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const { hasil } = (await res.json()) as { hasil: BarisCari[] };
        setCari({
          q: bersih,
          hasil,
          sibuk: false,
          pesan: hasil.length === 0 ? "Nobody found. Have them register through the walk-in link at the desk." : null,
        });
      } catch {
        setCari({ q: bersih, hasil: [], sibuk: false, pesan: "Search failed — check the connection." });
      }
    },
    [proses, slugPilihan],
  );

  /** "Let in" on a search row: the same rules as a scan, by id instead of code. */
  const tandaiDariCari = useCallback(
    async (p: BarisCari) => {
      setCari((c) => (c ? { ...c, sibuk: true } : c));
      try {
        const slug = slugPilihan ?? (await ambilManifes())?.slug;
        // A walk-in still in the queue is permitted here, the same as from the card:
        // /api/hadir applies the gate's rules and would answer WALK-IN · NOT YET.
        const jalur = p.jenis === "ots" && !p.izinOts ? "/api/izin-ots" : "/api/hadir";
        const res = await fetch(`${jalur}${acaraQs(slug)}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pesertaId: p.id,
            gate: gate || null,
            petugas: petugas || null,
            clientScannedAt: new Date().toISOString(),
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const { hasil } = (await res.json()) as { hasil: HasilServer };
        tampilkanServer(hasil, p.nomor);
        setCari(null);
      } catch {
        setCari((c) => (c ? { ...c, sibuk: false, pesan: "Could not record it — check the connection and try again." } : c));
      }
    },
    [gate, petugas, slugPilihan, tampilkanServer],
  );

  /**
   * "Permit & let in" on a walk-in the committee has not reached yet. The same
   * decision the help desk makes, taken where the person is actually standing.
   * Seats are the committee's business, so the number of free ones is on the
   * dashboard, not here — the usher is expected to have been told.
   */
  const izinkanOts = useCallback(
    async (pesertaId: string, nomor: string) => {
      setSibuk(true);
      try {
        const slug = slugPilihan ?? (await ambilManifes())?.slug;
        const res = await fetch(`/api/izin-ots${acaraQs(slug)}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ gate: gate || null, petugas: petugas || null, pesertaId }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const { hasil } = (await res.json()) as { hasil: HasilServer };
        tampilkanServer(hasil, nomor);
      } catch {
        tampilkan({ warna: "abu", kode: nomor, sebab: "Could not permit — check the connection and try again." });
      } finally {
        setSibuk(false);
      }
    },
    [gate, petugas, slugPilihan, tampilkan, tampilkanServer],
  );

  // The camera loop reads through this ref, so choosing a gate or renaming the usher
  // does not stop and restart the camera.
  const prosesRef = useRef(proses);
  useEffect(() => {
    prosesRef.current = proses;
  }, [proses]);

  async function pindaiOffline(kode: string, antre: PindaiAntre, sebabGagal?: string) {
    const m = await ambilManifes();
    if (!m) {
      // No offline list on this phone, so nothing can be confirmed either way.
      tampilkan({
        warna: "abu",
        kode,
        sebab: sebabGagal ?? "No offline list downloaded on this phone.",
      });
      return;
    }
    const baris = m.peta?.[kode];
    if (!baris) {
      tampilkan({ warna: "merah", kode });
      return;
    }
    if (baris.w === 1) {
      // Same rule offline as online, or a dead network would quietly admit the
      // whole walk-in queue.
      tampilkan({
        warna: "antre",
        nomor: baris.n,
        nama: baris.d,
        gender: baris.g === "a" ? "akhwat" : "ikhwan",
        posisi: baris.u ?? null,
        lokal: true,
      });
      return;
    }
    if (hadirLokal.current.has(kode) || baris.h === 1) {
      tampilkan({
        warna: "kuning",
        nomor: baris.n,
        nama: baris.d,
        gender: baris.g === "a" ? "akhwat" : "ikhwan",
        lokal: true,
      });
      return;
    }
    await antrekan(antre);
    hadirLokal.current.add(kode);
    await refreshAntrean();
    tampilkan({
      warna: "hijau",
      nomor: baris.n,
      nama: baris.d,
      gender: baris.g === "a" ? "akhwat" : "ikhwan",
      lokal: true,
    });
  }

  /*
   * Camera. Environment-facing, and HTTPS is mandatory for getUserMedia.
   *
   * The whole frame is decoded, not a box in the middle: a QR anywhere on the screen
   * is read, so the usher does not have to line anything up. The phone's own decoder
   * is used where it exists (Android Chrome), which reads a code in a few frames; the
   * JS decoder is the fallback for iOS.
   */
  useEffect(() => {
    if (siapPilih) return;
    let batal = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    let zx: IScannerControls | null = null;
    setKamera("memuat");

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            // `ideal`, not `exact`: a laptop with one camera still gets a picture.
            facingMode: { ideal: hadap },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (batal) return;
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play().catch(() => {});

        // Continuous autofocus where the phone allows it; a fixed focus cannot read a
        // ticket held close.
        const track = stream.getVideoTracks()[0];
        try {
          await track.applyConstraints({
            advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
          });
        } catch {
          // Not supported. The default focus stands.
        }

        const detektor = await detektorBawaan();
        if (batal) return;
        if (detektor) {
          setKamera("bawaan");
          let berjalan = false;
          let terakhir = 0;
          const putar = (t: number) => {
            if (batal) return;
            if (!berjalan && t - terakhir >= 70 && v.readyState >= 2) {
              berjalan = true;
              terakhir = t;
              detektor
                .detect(v)
                .then((kode) => {
                  for (const k of kode) if (k.rawValue) void prosesRef.current(k.rawValue);
                })
                .catch(() => {})
                .finally(() => {
                  berjalan = false;
                });
            }
            raf = requestAnimationFrame(putar);
          };
          raf = requestAnimationFrame(putar);
        } else {
          setKamera("js");
          const reader = new BrowserQRCodeReader(undefined, {
            delayBetweenScanAttempts: 60,
            delayBetweenScanSuccess: 250,
          });
          const c = await reader.decodeFromVideoElement(v, (result) => {
            if (result) void prosesRef.current(result.getText());
          });
          if (batal) c.stop();
          else zx = c;
        }
      } catch {
        if (!batal) {
          setKamera("gagal");
          setPesan("Camera unavailable. Use the manual code box below.");
        }
      }
    })();

    return () => {
      batal = true;
      cancelAnimationFrame(raf);
      zx?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [siapPilih, hadap]);

  const balikKamera = useCallback(() => {
    setHadap((h) => {
      const baru: Hadap = h === "environment" ? "user" : "environment";
      localStorage.setItem(K_KAMERA, baru);
      return baru;
    });
  }, []);

  const warnaTepi = useMemo(() => {
    switch (keadaan.warna) {
      case "hijau":
        return "border-brand-300";
      case "kuning":
        return "border-[var(--color-warn)]";
      case "merah":
        return "border-[var(--color-danger)]";
      case "abu":
        return "border-[var(--color-ink-3)]";
      case "antre":
        return "border-[var(--color-warn)]";
      default:
        return "border-transparent";
    }
  }, [keadaan.warna]);

  /*
   * The list on this phone is for a different programme than the one the staff
   * picked in the header. Not an error the scanner can resolve on its own — offline
   * scans would be checked against the wrong participant list — so it stays on
   * screen until the right list is downloaded.
   */
  const manifesSalah = manifes != null && slugPilihan != null && manifes.slug !== slugPilihan;
  const siapOffline = manifes != null && !manifesKedaluwarsa(manifes) && !manifesSalah;
  const perluKeputusan = keadaan.warna === "antre" && Boolean(keadaan.pesertaId);

  if (siapPilih) {
    return (
      <div className="h-full overflow-y-auto bg-[var(--color-surface)] p-5">
        <h1 className="text-xl font-semibold">Choose your gate</h1>
        <p className="mt-1.5 text-[15px] text-[var(--color-ink-2)]">
          Set once at the start of your shift. It is remembered on this phone.
        </p>
        <label className="label mt-6" htmlFor="nama-petugas">
          Your name
        </label>
        <input
          id="nama-petugas"
          value={petugas}
          onChange={(e) => setPetugas(e.target.value)}
          className="field"
          placeholder="Shown in the scan history"
        />
        {KELOMPOK_GATE.map((k) => (
          <div key={k.label} className="mt-5">
            <div className="text-xs font-bold tracking-[0.12em] text-[var(--color-ink-3)]">{k.label.toUpperCase()}</div>
            <div className={`mt-2 grid gap-2 ${k.gates.length > 2 ? "grid-cols-5" : "grid-cols-2"}`}>
              {k.gates.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    siapkanAudio();
                    localStorage.setItem(K_GATE, g);
                    localStorage.setItem(K_PETUGAS, petugas);
                    setGate(g);
                    setSiapPilih(false);
                  }}
                  className="h-12 rounded-[10px] border border-[var(--color-line)] bg-white text-[15px] font-semibold"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-black text-white">
      {/*
        Full-bleed preview that stays mounted for the whole shift. Unmounting it
        between scans detaches the element the decoder is reading from.
      */}
      <video
        ref={videoRef}
        // The front camera is shown mirrored, the way every phone shows it, so moving
        // the ticket left moves it left on screen. The decoder reads the raw frames.
        className={`absolute inset-0 h-full w-full object-cover ${hadap === "user" ? "-scale-x-100" : ""}`}
        muted
        playsInline
        autoPlay
      />

      {/* The result colour runs round the edge of the screen: readable from the side
          of the eye while the usher is already looking at the next ticket. */}
      <div
        className={`pointer-events-none absolute inset-0 border-[12px] transition-colors duration-100 ${warnaTepi}`}
        aria-hidden
      />

      {/* One big glyph in the middle of the screen for a second: a tick, a cross, a
          bang. The card at the bottom says why; this says what, from across the hall.
          Keyed on the scan so a second result of the same colour plays it again. */}
      {keadaan.warna !== "siap" ? <IkonHasil key={riwayat[0]?.id ?? 0} warna={keadaan.warna} /> : null}

      <div className="absolute inset-x-0 top-0 flex flex-col gap-2 bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="whitespace-nowrap text-xs font-bold tracking-[0.12em] text-white/85">SCANNER · {gate}</span>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {!online ? (
              <span className="rounded-[6px] bg-[var(--color-danger)] px-2 py-1 text-[11px] font-bold">OFFLINE</span>
            ) : null}
            {menunggu > 0 ? (
              <span className="rounded-[6px] bg-black/50 px-2 py-1 text-[11px] font-bold">{menunggu} QUEUED</span>
            ) : null}
            <span
              className={`rounded-[6px] px-2 py-1 text-[11px] font-bold ${
                siapOffline ? "bg-brand text-[var(--color-butter)]" : "bg-black/50 text-white/80"
              }`}
            >
              {siapOffline ? "OFFLINE READY" : "NO OFFLINE LIST"}
            </span>
            <button
              type="button"
              onClick={balikKamera}
              className="rounded-[6px] bg-black/50 px-2 py-1 text-[11px] font-bold"
              aria-label={hadap === "user" ? "Use the back camera" : "Use the front camera"}
            >
              {hadap === "user" ? "FRONT CAM" : "BACK CAM"}
            </button>
            {/* The station's own log, for the phone or laptop on the desk. A plain link:
                leaving the scanner is deliberate, and it must not be a tap away from the
                camera by accident. */}
            <a
              href={`/scan/log?gate=${encodeURIComponent(gate)}${slugPilihan ? `&acara=${encodeURIComponent(slugPilihan)}` : ""}`}
              className="rounded-[6px] bg-black/50 px-2 py-1 text-[11px] font-bold"
            >
              LOG
            </a>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(K_GATE);
                setSiapPilih(true);
              }}
              className="rounded-[6px] bg-black/50 px-2 py-1 text-[11px] font-bold"
            >
              CHANGE
            </button>
          </div>
        </div>

        {manifesSalah ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border-2 border-white/70 bg-black/70 p-3">
            <p className="text-[13px] font-bold leading-[1.4] text-white">
              Offline list is for &ldquo;{manifes?.slug}&rdquo; — download the list for &ldquo;
              {slugPilihan}&rdquo;
            </p>
            <button
              type="button"
              onClick={unduhManifes}
              disabled={sibuk}
              className="rounded-[6px] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[var(--color-ink)]"
            >
              Download
            </button>
          </div>
        ) : null}
      </div>

      {keadaan.warna === "siap" && kamera !== "gagal" ? (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-8 text-center text-[16px] font-semibold text-white/80 [text-shadow:0_1px_3px_rgba(0,0,0,.7)]">
          {kamera === "memuat" ? "Starting camera…" : "Point at a ticket — anywhere on the screen"}
        </p>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pb-4">
        {/* A walk-in waiting for a permit: the card stays until the usher answers. */}
        {keadaan.warna !== "siap" ? (
          <button
            type="button"
            onClick={tutupHasil}
            className="w-full text-start"
            aria-live="assertive"
          >
            <KartuHasil k={keadaan} />
            <div className="mt-1.5 px-1">
              <div className="h-1 overflow-hidden rounded-full bg-white/25">
                {tahan && !perluKeputusan ? (
                  <div
                    key={riwayat[0]?.id ?? 0}
                    className="h-full rounded-full bg-white/90"
                    style={{ animation: `nawa-tahan ${JEDA_ANTAR_KODE_MS}ms linear forwards` }}
                  />
                ) : null}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-white/75">
                {perluKeputusan
                  ? "Waiting for you — permit below, or tap to dismiss"
                  : tahan
                    ? "Hold — next ticket in a moment · tap to skip"
                    : "Ready for the next ticket"}
              </div>
            </div>
          </button>
        ) : null}

        {/*
          Outside the dismiss button, not inside it: a button within a button is not
          a thing, and permitting must never happen by tapping the card away.
        */}
        {keadaan.warna === "antre" && keadaan.pesertaId ? (
          <button
            type="button"
            disabled={sibuk}
            onClick={() => izinkanOts(keadaan.pesertaId!, keadaan.nomor)}
            className="btn btn-primary w-full disabled:opacity-60"
          >
            {sibuk ? "Permitting…" : "Permit & let in"}
          </button>
        ) : null}

        {cari ? <PanelCari c={cari} onTutup={() => setCari(null)} onTandai={tandaiDariCari} /> : null}

        <div className="rounded-[12px] bg-black/65 p-2.5 backdrop-blur-sm">
          {riwayat.length > 0 ? (
            <ul className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Recent scans">
              {riwayat.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-none items-center gap-1.5 rounded-[6px] bg-white/10 px-2 py-1 text-[11px] font-semibold"
                >
                  <span className={`h-2 w-2 rounded-full ${titikWarna(r.hasil.warna)}`} />
                  {"nama" in r.hasil ? r.hasil.nama.split(" ")[0] : r.hasil.kode.slice(0, 6)}
                  <span className="text-white/55">{formatJam(r.jam, "en")}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!manual.trim()) return;
              if (isKodeValid(manual)) {
                terakhirKode.current = { kode: "", at: 0 };
                // Typed, not read: the log says "Manual", so a relayed code stands out.
                void proses(manual, "manual");
              } else {
                void cariPeserta(manual);
              }
              setManual("");
            }}
            className="flex gap-2"
          >
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Code, number, name or WA digits"
              className="field h-11 flex-1"
              autoComplete="off"
            />
            <button type="submit" className="btn h-11 bg-white font-bold text-[var(--color-ink)]">
              GO
            </button>
          </form>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] font-medium text-white/85">
            <button
              type="button"
              onClick={unduhManifes}
              disabled={sibuk}
              className="rounded-[6px] bg-white/15 px-2.5 py-1.5"
            >
              {manifes
                ? `Offline list: ${manifes.jumlah}${manifesKedaluwarsa(manifes) ? " (expired)" : ""} · refresh`
                : "Download offline list"}
            </button>
            {menunggu > 0 && online ? (
              <button
                type="button"
                onClick={kirimAntrean}
                disabled={sibuk}
                className="rounded-[6px] bg-white/15 px-2.5 py-1.5"
              >
                Sync {menunggu} now
              </button>
            ) : null}
          </div>

          {pesan ? <p className="mt-2 text-[12px] text-white/85">{pesan}</p> : null}
          {ringkas ? (
            <div className="mt-2 rounded-[8px] bg-white/10 p-2.5 text-[12px] leading-[1.5] text-white">
              {ringkas}{" "}
              <button type="button" onClick={() => setRingkas(null)} className="font-bold underline">
                dismiss
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Search results, docked above the code box. Each row says what the gate needs to
 * know before "Let in" — side, waiting list, released seat, already scanned — and
 * "Let in" goes through the same rules as a scan, so the answer comes back as the
 * usual green, yellow or red card.
 */
function PanelCari({
  c,
  onTutup,
  onTandai,
}: {
  c: Pencarian;
  onTutup: () => void;
  onTandai: (p: BarisCari) => void;
}) {
  return (
    <div className="rounded-[12px] bg-white p-3 text-[var(--color-ink)] shadow-[0_6px_24px_rgba(0,0,0,.45)]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 truncate text-[13px] font-semibold text-[var(--color-ink-2)]">
          {c.sibuk ? "Searching…" : `Search: ${c.q}`}
        </div>
        <button type="button" onClick={onTutup} className="rounded-[6px] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-bold">
          CLOSE
        </button>
      </div>
      {c.pesan ? <p className="mt-2 text-[13px] leading-[1.45] text-[var(--color-ink-2)]">{c.pesan}</p> : null}
      {c.hasil.length > 0 ? (
        <ul className="mt-2 flex max-h-[38dvh] flex-col gap-1.5 overflow-y-auto">
          {c.hasil.map((p) => {
            const catatan = !p.aktif
              ? "DEACTIVATED"
              : p.scannedAt
                ? `Already scanned ${formatJam(new Date(p.scannedAt), "en")}${p.gate ? ` · ${p.gate}` : ""}`
                : p.konfirmasi === false
                  ? "Released their seat"
                  : p.jenis === "ots" && !p.izinOts
                    ? `Walk-in no. ${p.urutOts ?? "?"} · not let in yet`
                    : null;
            const warnaCatatan = !p.aktif || p.konfirmasi === false ? "text-[var(--color-danger)]" : "text-[var(--color-warn)]";
            return (
              <li key={p.id} className="flex items-center gap-2 rounded-[8px] bg-[var(--color-surface)] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold leading-tight">{p.nama}</div>
                  <div className="text-[12px] text-[var(--color-ink-2)]">
                    {p.nomor} · {labelGender(p.gender)}
                    {catatan ? (
                      <>
                        {" · "}
                        <span className={`font-semibold ${warnaCatatan}`}>{catatan}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                {p.aktif && !p.scannedAt ? (
                  <button
                    type="button"
                    disabled={c.sibuk}
                    onClick={() => onTandai(p)}
                    className="btn btn-primary h-10 flex-none px-3 text-[14px]"
                  >
                    {p.jenis === "ots" && !p.izinOts ? "Permit & let in" : "Let in"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function IkonHasil({ warna }: { warna: Hasil["warna"] }) {
  const latar =
    warna === "hijau"
      ? "bg-brand text-[var(--color-butter)]"
      : warna === "kuning" || warna === "antre"
        ? "bg-[var(--color-warn)] text-[var(--color-ink)]"
        : warna === "abu"
          ? "bg-[var(--color-ink-2)] text-white"
          : "bg-[var(--color-danger)] text-white";
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden
      style={{ animation: `nawa-ikon-hasil ${JEDA_IKON_MS}ms ease-out forwards` }}
    >
      <div className={`flex h-40 w-40 items-center justify-center rounded-full shadow-[0_10px_40px_rgba(0,0,0,.5)] ${latar}`}>
        {warna === "hijau" ? (
          <svg viewBox="0 0 24 24" className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 12.5l5 5 10-11" />
          </svg>
        ) : warna === "kuning" || warna === "antre" ? (
          <svg viewBox="0 0 24 24" className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
            <path d="M12 4.5v9.5" />
            <path d="M12 19.2v.1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        )}
      </div>
    </div>
  );
}

function titikWarna(w: Hasil["warna"]): string {
  switch (w) {
    case "hijau":
      return "bg-brand-300";
    case "kuning":
    case "antre":
      return "bg-[var(--color-warn)]";
    case "merah":
      return "bg-[var(--color-danger)]";
    default:
      return "bg-white/60";
  }
}

/** The result, docked at the bottom so the camera above it keeps reading. */
function KartuHasil({ k }: { k: Hasil }) {
  if (k.warna === "hijau") {
    return (
      <div className="rounded-[12px] bg-brand p-4 text-[var(--color-butter)] shadow-[0_6px_24px_rgba(0,0,0,.45)]">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-[30px] font-bold leading-none tracking-[-0.01em]">MAY ENTER</div>
          {k.lokal ? <div className="text-[11px] font-bold text-brand-200">OFFLINE · WILL SYNC</div> : null}
        </div>
        <div className="mt-2.5 text-[20px] font-bold leading-[1.25]">{k.nama}</div>
        <div className="mt-1 text-[14px] font-medium text-brand-200">
          {k.nomor} · {labelGender(k.gender)}
          {k.ket ? ` · ${k.ket}` : ""}
        </div>
      </div>
    );
  }
  if (k.warna === "kuning") {
    return (
      <div className="rounded-[12px] bg-[var(--color-warn)] p-4 text-[var(--color-ink)] shadow-[0_6px_24px_rgba(0,0,0,.45)]">
        <div className="text-[30px] font-bold leading-none tracking-[-0.01em]">ALREADY SCANNED</div>
        <div className="mt-2.5 text-[19px] font-bold leading-[1.25]">{k.nama}</div>
        <div className="mt-1 text-[14px] font-medium">
          {k.nomor} · {labelGender(k.gender)}
          {k.pertama ? ` · first ${formatJam(new Date(k.pertama), "en")}` : ""}
          {k.gate ? ` · ${k.gate}` : ""}
        </div>
        <div className="mt-1.5 text-[14px] font-semibold">Send them to the help desk.</div>
      </div>
    );
  }
  if (k.warna === "antre") {
    return (
      <div className="rounded-[12px] bg-[var(--color-warn)] p-4 text-[var(--color-ink)] shadow-[0_6px_24px_rgba(0,0,0,.45)]">
        <div className="text-[30px] font-bold leading-none tracking-[-0.01em]">WALK-IN · NOT YET</div>
        <div className="mt-2.5 text-[19px] font-bold leading-[1.25]">
          {k.nama}
          {k.posisi ? ` · no. ${k.posisi}` : ""}
        </div>
        <div className="mt-1 text-[14px] font-medium">
          {k.nomor} · {labelGender(k.gender)}
          {k.ket ? ` · ${k.ket}` : ""}
        </div>
        <div className="mt-1.5 text-[14px] font-semibold">
          {k.pesertaId
            ? "Not let in yet. Permit them below if the committee says there is room — never turn them away."
            : "Not let in yet. Send them to the help desk — do not turn them away."}
        </div>
      </div>
    );
  }
  if (k.warna === "abu") {
    return (
      <div className="rounded-[12px] bg-[var(--color-ink-2)] p-4 text-white shadow-[0_6px_24px_rgba(0,0,0,.45)]">
        <div className="text-[30px] font-bold leading-none tracking-[-0.01em]">CANNOT VERIFY</div>
        <div className="mt-2 font-mono text-[15px] font-bold">{k.kode}</div>
        <div className="mt-1 text-[13px] leading-[1.45] text-white/80">{k.sebab}</div>
        <div className="mt-1.5 text-[14px] font-semibold">Do not turn them away. Send them to the help desk.</div>
      </div>
    );
  }
  return (
    <div className="rounded-[12px] bg-[var(--color-danger)] p-4 text-white shadow-[0_6px_24px_rgba(0,0,0,.45)]">
      <div className="text-[30px] font-bold leading-none tracking-[-0.01em]">NOT VALID</div>
      <div className="mt-2 font-mono text-[15px] font-bold">{k.kode}</div>
      <div className="mt-1 text-[14px] font-semibold">
        Not on the list, or the seat was released. Send them to the help desk.
      </div>
    </div>
  );
}
