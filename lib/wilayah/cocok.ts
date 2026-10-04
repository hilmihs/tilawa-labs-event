import { kunciTeks } from "@/lib/acara/rapikan-teks";
import { JABODETABEK, PROVINSI } from "./data";

/*
 * Reading a place out of what someone wrote for "home region" or "where they live",
 * so the dashboard can count people per province and drill into regencies.
 *
 * Answers from the picker are exact ("Kab. Garut, Jawa Barat"; "Pasar Minggu, Kota
 * Jakarta Selatan"). Older answers are free text ("Jaksel", "bekasi", "Lombok Timur
 * NTB", "Jati Padang, Pasar Minggu"). Both go through the same steps: normalise with
 * the dashboard's own `kunciTeks`, then look for a province, a regency/city and — in
 * Jabodetabek — a district, by whole comma-separated parts first and by runs of words
 * second. A name that fits several places is only used when the rest of the answer
 * says which one. Anything still unclear is reported as unmatched, never guessed.
 */

export type Tempat = {
  /** Province code from data.ts. */
  prov: string;
  /** Regency/city as stored ("Kab. Garut"), or "Bogor (Kab./Kota)" when the answer does not say which. */
  kab: string | null;
  /** Jabodetabek district, when named. */
  kec: string | null;
};

type KabRef = { prov: string; kab: string };
type KecRef = { prov: string; kab: string; kec: string };

/**
 * Short names people use for provinces. Keys go through `kunciTeks`, which already
 * spells out a few ("jaksel") and drops "dki"/"provinsi", so they match what it makes
 * of an answer.
 */
const ALIAS_PROVINSI: Record<string, string> = {
  aceh: "11",
  nad: "11",
  "nanggroe aceh darussalam": "11",
  sumut: "12",
  medan: "12",
  sumbar: "13",
  padang: "13",
  pekanbaru: "14",
  sumsel: "16",
  palembang: "16",
  babel: "19",
  "bangka belitung": "19",
  kepri: "21",
  batam: "21",
  jakarta: "31",
  "جاكرتا": "31",
  "لومبوك": "52",
  "لمبوك": "52",
  "جاوى الشرقية": "35",
  "جاوى الشرقيه": "35",
  "الجاوي الشرقية": "35",
  "جوى غربية": "32",
  "جاوى الوسطى": "33",
  "جوغجاكارتا": "34",
  "رياو": "14",
  "بانتن": "36",
  "نوسا تينجارا غربي": "52",
  jabar: "32",
  jawabarat: "32",
  jateng: "33",
  jawatengah: "33",
  diy: "34",
  jogja: "34",
  jogjakarta: "34",
  yogya: "34",
  yogyakarta: "34",
  "daerah istimewa yogyakarta": "34",
  jatim: "35",
  jawatimur: "35",
  ntb: "52",
  lombok: "52",
  ntt: "53",
  kalbar: "61",
  kalteng: "62",
  kalsel: "63",
  kaltim: "64",
  kaltara: "65",
  sulut: "71",
  sulteng: "72",
  sulsel: "73",
  makassar: "73",
  sultra: "74",
  kendari: "74",
  sulbar: "76",
  malut: "82",
};

/**
 * Other names for a regency or city: common short forms, towns inside a regency, and
 * the Arabic spellings students typed on the Arabic form. Values are the stored names
 * in data.ts.
 */
const ALIAS_KAB: Record<string, string> = {
  solo: "Kota Surakarta",
  pangkalpinang: "Kota Pangkal Pinang",
  cikarang: "Kab. Bekasi",
  cibubur: "Kota Depok",
  bintaro: "Kota Tangerang Selatan",
  sumpiuh: "Kab. Banyumas",
  "بوغور": "Kota Bogor",
  "بوجور": "Kota Bogor",
  "بكاسي": "Kota Bekasi",
  "ديفوك": "Kota Depok",
  "تانجيرانج": "Kota Tangerang",
  "باندونج": "Kota Bandung",
  "بندونج": "Kota Bandung",
  "باتام": "Kota Batam",
  "بادانج": "Kota Padang",
  "باكنبارو": "Kota Pekanbaru",
  "بونتيانك": "Kota Pontianak",
  "باندا آتشيه": "Kota Banda Aceh",
  "كندال": "Kab. Kendal",
  // Written without the space, which nothing else splits back apart.
  jakartaselatan: "Kota Jakarta Selatan",
  jakartatimur: "Kota Jakarta Timur",
  jakartabarat: "Kota Jakarta Barat",
  jakartautara: "Kota Jakarta Utara",
  jakartapusat: "Kota Jakarta Pusat",
  "جاكرتا الجانوبي": "Kota Jakarta Selatan",
  "جاكرتا الجنوبي": "Kota Jakarta Selatan",
  "تنجراغ الجنوبية": "Kota Tangerang Selatan",
  "سمباوى": "Kab. Sumbawa",
  "لومبوك الغربية": "Kab. Lombok Barat",
  "كيديري": "Kab. Kediri",
};

/**
 * Neighbourhoods (kelurahan) around the institute that people write instead of the district.
 * Only the ones that come up; the district list itself is complete.
 */
const KELURAHAN: Record<string, { kab: string; kec: string }> = {
  "jati padang": { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  jatipadang: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  jatipdang: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  pejaten: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  "pejaten barat": { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  "pejaten timur": { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  ragunan: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  kebagusan: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  "cilandak timur": { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  kalibata: { kab: "Kota Jakarta Selatan", kec: "Pancoran" },
  "lenteng agung": { kab: "Kota Jakarta Selatan", kec: "Jagakarsa" },
  "tanjung barat": { kab: "Kota Jakarta Selatan", kec: "Jagakarsa" },
  "srengseng sawah": { kab: "Kota Jakarta Selatan", kec: "Jagakarsa" },
  ciganjur: { kab: "Kota Jakarta Selatan", kec: "Jagakarsa" },
  cipedak: { kab: "Kota Jakarta Selatan", kec: "Jagakarsa" },
  "pasar rebo": { kab: "Kota Jakarta Timur", kec: "Pasar Rebo" },
  "kampung rambutan": { kab: "Kota Jakarta Timur", kec: "Ciracas" },
  condet: { kab: "Kota Jakarta Timur", kec: "Kramatjati" },
  cawang: { kab: "Kota Jakarta Timur", kec: "Kramatjati" },
  ciputat: { kab: "Kota Tangerang Selatan", kec: "Ciputat" },
  // Streets and housing around the campus, written instead of an area.
  pasarminggu: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  pasming: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  pasaming: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  pekayon: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  "karang pola": { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  karangpola: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  syaridin: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  wiraguna: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  "kejaksaan agung": { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  kejagung: { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  "tg priuk": { kab: "Kota Jakarta Utara", kec: "Tanjung Priok" },
  "bojong kulur": { kab: "Kab. Bogor", kec: "Gunungputri" },
  rawamangun: { kab: "Kota Jakarta Timur", kec: "Pulogadung" },
  "utan kayu": { kab: "Kota Jakarta Timur", kec: "Matraman" },
  mampang: { kab: "Kota Jakarta Selatan", kec: "Mampang Prapatan" },
  "جاتي بادانج": { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  "جاتي فادنغ": { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
  "جتي بدنج": { kab: "Kota Jakarta Selatan", kec: "Pasar Minggu" },
};

type Indeks = {
  prov: Map<string, string>;
  kab: Map<string, KabRef[]>;
  kec: Map<string, KecRef[]>;
  kel: Map<string, KecRef>;
  provKab: Map<string, string>;
  maksKata: number;
};

let cache: Indeks | null = null;

function tambah<T>(m: Map<string, T[]>, k: string, v: T) {
  if (!k) return;
  const ada = m.get(k);
  if (ada) ada.push(v);
  else m.set(k, [v]);
}

function indeks(): Indeks {
  if (cache) return cache;
  const prov = new Map<string, string>();
  const kab = new Map<string, KabRef[]>();
  const kec = new Map<string, KecRef[]>();
  const kel = new Map<string, KecRef>();
  const provKab = new Map<string, string>();
  for (const p of PROVINSI) {
    prov.set(kunciTeks(p.simpan), p.kode);
    prov.set(kunciTeks(p.en), p.kode);
    prov.set(kunciTeks(p.ar), p.kode);
    for (const kk of p.kabkota) {
      const ref = { prov: p.kode, kab: kk };
      provKab.set(kk, p.kode);
      const k = kunciTeks(kk);
      tambah(kab, k, ref);
      tambah(kab, k.replace(/^(kab|kota) /, ""), ref);
    }
  }
  for (const [alias, kode] of Object.entries(ALIAS_PROVINSI)) {
    const k = kunciTeks(alias);
    // A regency or city of the same name wins ("Padang" the city, "Medan" the city):
    // the alias only fills in the province when no regency matched.
    if (k && !prov.has(k)) prov.set(k, kode);
  }
  for (const [alias, nama] of Object.entries(ALIAS_KAB)) {
    const p = provKab.get(nama);
    const k = kunciTeks(alias);
    if (p && k && !kab.has(k)) tambah(kab, k, { prov: p, kab: nama });
  }
  for (const j of JABODETABEK) {
    const p = provKab.get(j.simpan) ?? j.kode.slice(0, 2);
    // The picker's own English and Arabic labels: "South Jakarta", "جاكرتا الجنوبية".
    // People answer in the language the form was in, and the stored name is Indonesian.
    for (const nama of [j.en, j.ar]) {
      const k = kunciTeks(nama);
      if (k && !kab.has(k)) tambah(kab, k, { prov: p, kab: j.simpan });
    }
    for (const nama of j.kecamatan) tambah(kec, kunciTeks(nama), { prov: p, kab: j.simpan, kec: nama });
  }
  for (const [nama, v] of Object.entries(KELURAHAN)) {
    kel.set(kunciTeks(nama), { prov: provKab.get(v.kab) ?? "31", kab: v.kab, kec: v.kec });
  }
  let maksKata = 1;
  for (const k of [...prov.keys(), ...kab.keys(), ...kec.keys(), ...kel.keys()]) {
    maksKata = Math.max(maksKata, k.split(" ").length);
  }
  cache = { prov, kab, kec, kel, provKab, maksKata };
  return cache;
}

/** Every run of consecutive words, longest first, with its word positions. */
function potongan(kata: string[], maks: number) {
  const hasil: { k: string; dari: number; sampai: number }[] = [];
  for (let n = Math.min(maks, kata.length); n >= 1; n--) {
    for (let i = 0; i + n <= kata.length; i++) hasil.push({ k: kata.slice(i, i + n).join(" "), dari: i, sampai: i + n });
  }
  return hasil;
}

/** "Kab. Bogor" + "Kota Bogor" → "Bogor (Kab./Kota)". */
function labelKabGanda(refs: KabRef[]): string {
  const nama = refs[0].kab.replace(/^(Kab\.|Kota) /, "");
  return refs.every((r) => r.kab.replace(/^(Kab\.|Kota) /, "") === nama) ? `${nama} (Kab./Kota)` : refs[0].kab;
}

export function cocokTempat(teks: string | null | undefined): Tempat | null {
  const utuh = kunciTeks(teks);
  if (!utuh) return null;
  const ix = indeks();
  const kata = utuh.split(" ");
  // Words already used by a longer match, so "Jakarta Selatan" is not also read as the
  // province "Jakarta" plus a stray "Selatan".
  const terpakai = new Array<boolean>(kata.length).fill(false);
  const bebas = (a: number, b: number) => terpakai.slice(a, b).every((x) => !x);
  const pakai = (a: number, b: number) => terpakai.fill(true, a, b);

  const provs = new Set<string>();
  // `kata` is how many words the name took: "Jakarta Selatan" outweighs a street's
  // "Ketapang", which happens to be a regency in Kalimantan.
  let kabs: (KabRef & { kata: number })[] = [];
  let kecs: KecRef[] = [];

  for (const { k, dari, sampai } of potongan(kata, ix.maksKata)) {
    if (!bebas(dari, sampai)) continue;
    const kel = ix.kel.get(k);
    const kec = ix.kec.get(k);
    const kab = ix.kab.get(k);
    const prov = ix.prov.get(k);
    if (kel) {
      kecs.push(kel);
      pakai(dari, sampai);
    } else if (kab) {
      kabs.push(...kab.map((r) => ({ ...r, kata: sampai - dari })));
      pakai(dari, sampai);
    } else if (kec) {
      kecs.push(...kec);
      pakai(dari, sampai);
    } else if (prov) {
      provs.add(prov);
      pakai(dari, sampai);
    }
  }

  // Narrow each level by the others: a district that exists in two cities is settled
  // by the city written next to it, a regency name shared by two provinces by the
  // province.
  // Two regencies in different provinces and nothing saying which: the one whose name
  // took more words is the one the answer is about, the other is a street or a
  // neighbourhood that happens to share a name.
  if (new Set(kabs.map((r) => r.prov)).size > 1) {
    const terpanjang = Math.max(...kabs.map((r) => r.kata));
    if (kabs.some((r) => r.kata < terpanjang)) kabs = kabs.filter((r) => r.kata === terpanjang);
  }

  if (provs.size) {
    const dalam = kabs.filter((r) => provs.has(r.prov));
    if (dalam.length) kabs = dalam;
    const kecDalam = kecs.filter((r) => provs.has(r.prov));
    if (kecDalam.length) kecs = kecDalam;
  }
  if (kabs.length && kecs.length) {
    const cocok = kecs.filter((c) => kabs.some((r) => r.kab === c.kab));
    if (cocok.length) {
      kecs = cocok;
      kabs = kabs.filter((r) => cocok.some((c) => c.kab === r.kab));
    } else {
      // The district belongs somewhere else than the regency named: trust the regency.
      kecs = [];
    }
  }

  const kecUnik = new Map(kecs.map((c) => [`${c.kab}|${c.kec}`, c]));
  if (kecUnik.size === 1) {
    const c = [...kecUnik.values()][0];
    return { prov: c.prov, kab: c.kab, kec: c.kec };
  }

  const kabUnik = new Map(kabs.map((r) => [r.kab, r]));
  const provDariKab = new Set([...kabUnik.values()].map((r) => r.prov));
  if (kabUnik.size === 1) {
    const r = [...kabUnik.values()][0];
    return { prov: r.prov, kab: r.kab, kec: null };
  }
  if (kabUnik.size > 1 && provDariKab.size === 1) {
    return { prov: [...provDariKab][0], kab: labelKabGanda([...kabUnik.values()]), kec: null };
  }
  const kabKec = new Set([...kecUnik.values()].map((c) => c.kab));
  if (kecUnik.size > 1 && kabKec.size === 1 && !kabUnik.size) {
    // "Cilandak, Pasar Minggu": two districts of one city, so the city is certain even
    // though which district is not.
    const c = [...kecUnik.values()][0];
    return { prov: c.prov, kab: c.kab, kec: null };
  }
  const provKec = new Set([...kecUnik.values()].map((c) => c.prov));
  if (kecUnik.size > 1 && provKec.size === 1 && !kabUnik.size) {
    return { prov: [...provKec][0], kab: null, kec: null };
  }
  if (provs.size === 1) return { prov: [...provs][0], kab: null, kec: null };
  return null;
}
