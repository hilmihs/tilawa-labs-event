/**
 * IndexedDB store for the scanner. Two object stores:
 *  - manifes: the four-column participant list plus its expiry
 *  - antrean: scans recorded while the network was gone
 *
 * Deliberately hand-rolled: this runs on a volunteer's personal phone on the day
 * the mosque wifi is dead, and a dependency is one more thing that can break.
 */
const DB = "nawa-scan";
const VERSI = 1;
const S_MANIFES = "manifes";
const S_ANTREAN = "antrean";

/** w: 1 = a walk-in not yet permitted (refuse, send to the desk); u: their queue number. */
export type BarisManifes = { k: string; n: string; d: string; g: string; w?: number; u?: number; h?: number };

export type Manifes = {
  slug: string;
  status: string;
  diambilAt: string;
  kedaluwarsa: string;
  jumlah: number;
  daftar: BarisManifes[];
};

export type PindaiAntre = {
  id?: number;
  kode: string;
  gate: string | null;
  petugas: string | null;
  metode: "qr" | "manual" | "nama";
  clientScannedAt: string;
  offline: true;
  /*
   * The programme this scan was taken for. One deployment now serves many, and the
   * queue outlives the manifest: a usher can scan offline for one programme, then
   * download the list for another before the network returns. Without the slug on
   * the scan itself the whole queue would be flushed into whichever programme the
   * phone happens to hold now. Optional because scans queued by an older build have
   * none — those fall back to the stored manifest's slug, which is what they meant.
   */
  slug?: string;
};

function buka(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSI);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(S_MANIFES)) db.createObjectStore(S_MANIFES);
      if (!db.objectStoreNames.contains(S_ANTREAN)) {
        db.createObjectStore(S_ANTREAN, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return buka().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

export async function simpanManifes(m: Manifes): Promise<void> {
  // Stored as a lookup map so a scan is O(1) — a linear scan of a thousand rows on
  // a cheap phone is the difference between instant and "did it freeze?".
  const peta: Record<string, BarisManifes> = {};
  for (const b of m.daftar) peta[b.k] = b;
  await tx(S_MANIFES, "readwrite", (s) => s.put({ ...m, peta }, "current"));
}

export async function ambilManifes(): Promise<(Manifes & { peta: Record<string, BarisManifes> }) | null> {
  try {
    const m = await tx<(Manifes & { peta: Record<string, BarisManifes> }) | undefined>(
      S_MANIFES,
      "readonly",
      (s) => s.get("current"),
    );
    return m ?? null;
  } catch {
    return null;
  }
}

export async function antrekan(p: PindaiAntre): Promise<void> {
  await tx(S_ANTREAN, "readwrite", (s) => s.add(p));
}

export async function isiAntrean(): Promise<PindaiAntre[]> {
  try {
    return (await tx<PindaiAntre[]>(S_ANTREAN, "readonly", (s) => s.getAll())) ?? [];
  } catch {
    return [];
  }
}

export async function hapusAntrean(ids: number[]): Promise<void> {
  const db = await buka();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(S_ANTREAN, "readwrite");
    const s = t.objectStore(S_ANTREAN);
    for (const id of ids) s.delete(id);
    t.oncomplete = () => {
      db.close();
      resolve();
    };
    t.onerror = () => reject(t.error);
  });
}

/**
 * Wipe the stored manifest and only the queued scans that belong to `slug`.
 *
 * The queue outlives any one manifest now: a phone can hold scans for several
 * programmes at once, so the end of one programme must not throw the others away —
 * those scans are attendances nobody has recorded anywhere else yet. Entries with
 * no slug were queued by an older build against the stored manifest, so they belong
 * to the programme being cleared.
 */
export async function hapusManifesDanAntreanUntuk(slug: string): Promise<void> {
  await tx(S_MANIFES, "readwrite", (s) => s.clear());
  const antre = await isiAntrean();
  const ids = antre
    .filter((p) => (p.slug ?? slug) === slug && typeof p.id === "number")
    .map((p) => p.id as number);
  await hapusAntrean(ids);
}

export function manifesKedaluwarsa(m: Manifes | null): boolean {
  if (!m) return true;
  return new Date(m.kedaluwarsa).getTime() < Date.now();
}
