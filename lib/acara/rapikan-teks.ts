import { adaArab, alihAksara } from "./arab-latin";
import { JABODETABEK, PROVINSI } from "@/lib/wilayah/data";

/**
 * Folds free-text answers ("PP Al-Uji", "ponpes al uji", "Pondok Pesantren Al Uji")
 * into one group for the summary charts. Pure and deterministic: the same answers in
 * any order give the same groups, labels and keys.
 */

/**
 * Token rewrites, matched longest first on whole words. Several passes run until the
 * key stops changing, so "DI Jogja" becomes "di yogyakarta" and then "yogyakarta".
 */
const GANTI: Array<[string, string]> = [
  // Pesantren in all its spellings.
  ["pondok pesantren", "pesantren"],
  ["pon pes", "pesantren"],
  ["ponpes", "pesantren"],
  ["pontren", "pesantren"],
  ["pp", "pesantren"],
  ["pondok", "pesantren"],
  ["pmdg", "pesantren modern darussalam gontor"],
  // Administrative words.
  ["kabupaten", "kab"],
  ["kota administrasi", "kota"],
  ["kota adm", "kota"],
  ["kotamadya", "kota"],
  ["kodya", "kota"],
  ["kecamatan", "kec"],
  ["kelurahan", "kel"],
  ["provinsi", ""],
  ["prov", ""],
  ["dki", ""],
  ["daerah khusus ibukota", ""],
  ["daerah khusus", ""],
  ["kep", "kepulauan"],
  // Jakarta and around.
  ["jkt", "jakarta"],
  ["jaksel", "jakarta selatan"],
  ["jakbar", "jakarta barat"],
  ["jaktim", "jakarta timur"],
  ["jakut", "jakarta utara"],
  ["jakpus", "jakarta pusat"],
  ["tangsel", "tangerang selatan"],
  // Provinces.
  ["jabar", "jawa barat"],
  ["jateng", "jawa tengah"],
  ["jatim", "jawa timur"],
  ["daerah istimewa yogyakarta", "yogyakarta"],
  ["di yogyakarta", "yogyakarta"],
  ["diy", "yogyakarta"],
  ["jogjakarta", "yogyakarta"],
  ["jogja", "yogyakarta"],
  ["jogya", "yogyakarta"],
  ["yogya", "yogyakarta"],
  ["sumatra", "sumatera"],
  ["sumut", "sumatera utara"],
  ["sumbar", "sumatera barat"],
  ["sumsel", "sumatera selatan"],
  ["kalbar", "kalimantan barat"],
  ["kalteng", "kalimantan tengah"],
  ["kalsel", "kalimantan selatan"],
  ["kaltim", "kalimantan timur"],
  ["kaltara", "kalimantan utara"],
  ["sulut", "sulawesi utara"],
  ["sulteng", "sulawesi tengah"],
  ["sulsel", "sulawesi selatan"],
  ["sultra", "sulawesi tenggara"],
  ["sulbar", "sulawesi barat"],
  ["ntb", "nusa tenggara barat"],
  ["ntt", "nusa tenggara timur"],
  ["babel", "kepulauan bangka belitung"],
  ["kepri", "kepulauan riau"],
  ["malut", "maluku utara"],
  ["pabar", "papua barat"],
  // Schools. "sdit/smpit/smait" are their own kind and stay joined.
  ["sma n", "sma negeri"],
  ["sman", "sma negeri"],
  ["smk n", "smk negeri"],
  ["smkn", "smk negeri"],
  ["smp n", "smp negeri"],
  ["smpn", "smp negeri"],
  ["sd n", "sd negeri"],
  ["sdn", "sd negeri"],
  ["sma it", "smait"],
  ["smp it", "smpit"],
  ["sd it", "sdit"],
  ["mts n", "madrasah tsanawiyah negeri"],
  ["mtsn", "madrasah tsanawiyah negeri"],
  ["mts", "madrasah tsanawiyah"],
  ["man", "madrasah aliyah negeri"],
  ["ma", "madrasah aliyah"],
];

type Aturan = { dari: string[]; ke: string[] };

const ATURAN: Map<string, Aturan[]> = (() => {
  const m = new Map<string, Aturan[]>();
  for (const [dari, ke] of GANTI) {
    const a = { dari: dari.split(" "), ke: ke ? ke.split(" ") : [] };
    const daftar = m.get(a.dari[0]) ?? [];
    daftar.push(a);
    m.set(a.dari[0], daftar);
  }
  for (const daftar of m.values()) daftar.sort((x, y) => y.dari.length - x.dari.length);
  return m;
})();

function tulisUlang(token: string[]): string[] {
  const hasil: string[] = [];
  let i = 0;
  while (i < token.length) {
    const cocok = (ATURAN.get(token[i]) ?? []).find((a) => a.dari.every((d, j) => token[i + j] === d));
    if (cocok) {
      hasil.push(...cocok.ke);
      i += cocok.dari.length;
    } else {
      hasil.push(token[i]);
      i++;
    }
  }
  // "PP Pondok Pesantren X" should not read "pesantren pesantren x".
  return hasil.filter((t, j) => !(t === "pesantren" && hasil[j - 1] === "pesantren"));
}

/**
 * The grouping key: lowercase, no diacritics, punctuation as spaces (apostrophes
 * dropped, so "Ma'had" does not turn into the abbreviation "ma"), common Indonesian
 * abbreviations spelled out the same way.
 */
export function kunciTeks(teks: string | null | undefined): string {
  let s = (teks ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’‘`ʼ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    // "SMAN1" and "SMAN 1" are the same school.
    .replace(/(\p{L})(\p{N})/gu, "$1 $2")
    .replace(/(\p{N})(\p{L})/gu, "$1 $2")
    .trim();
  for (let putaran = 0; putaran < 4; putaran++) {
    const baru = tulisUlang(s ? s.split(" ") : []).join(" ");
    if (baru === s) break;
    s = baru;
  }
  return s;
}

const ADMIN = new Set(["kab", "kota", "kec", "kel"]);

let cacheTempat: { ekor: Set<string>; dikenal: Set<string>; arti: Map<string, Set<string>> } | null = null;

/**
 * Place names that may trail an answer ("..., Bogor", "..., Jawa Barat") and the full
 * set of names the region picker can store. Built once, from the same list the form uses.
 */
function tempat() {
  if (cacheTempat) return cacheTempat;
  const ekor = new Set<string>();
  const dikenal = new Set<string>();
  // Which official regions a trailing name can mean: "jakarta selatan" only one,
  // "bogor" both the regency and the city.
  const arti = new Map<string, Set<string>>();
  const artinya = (nama: string, id: string) => arti.set(nama, (arti.get(nama) ?? new Set()).add(id));
  const tambahKabKota = (nama: string) => {
    const k = kunciTeks(nama);
    ekor.add(k);
    ekor.add(k.replace(/^(kab|kota) /, ""));
    artinya(k, k);
    artinya(k.replace(/^(kab|kota) /, ""), k);
  };
  for (const p of PROVINSI) {
    ekor.add(kunciTeks(p.simpan));
    artinya(kunciTeks(p.simpan), `provinsi ${kunciTeks(p.simpan)}`);
    for (const kk of p.kabkota) {
      tambahKabKota(kk);
      dikenal.add(kunciTeks(`${kk}, ${p.simpan}`));
    }
  }
  for (const j of JABODETABEK) {
    tambahKabKota(j.simpan);
    for (const kec of j.kecamatan) {
      dikenal.add(kunciTeks(kec));
      dikenal.add(kunciTeks(`${kec}, ${j.simpan}`));
    }
  }
  ekor.delete("");
  for (const e of ekor) dikenal.add(e);
  cacheTempat = { ekor, dikenal, arti };
  return cacheTempat;
}

/**
 * Shorter forms an answer may also be written as: without a leading "kab"/"kota", or
 * without a trailing city or province. "kab garut jawa barat" → "kab garut", "garut".
 */
export function bentukPendek(kunci: string): string[] {
  const { ekor, dikenal } = tempat();
  const hasil = new Set<string>();
  const antre = [kunci];
  while (antre.length) {
    const t = antre.pop()!.split(" ");
    const calon: string[][] = [];
    if (t.length > 1 && (t[0] === "kab" || t[0] === "kota")) calon.push(t.slice(1));
    // The city written first ("Jakarta Selatan Pasar Minggu"): only when what is left is
    // itself a known district, so "Bogor Barat" never becomes "barat".
    for (let n = Math.min(4, t.length - 1); n >= 1; n--) {
      const sisa = t.slice(n).join(" ");
      if (ekor.has(t.slice(0, n).join(" ")) && dikenal.has(sisa) && !ekor.has(sisa)) calon.push(t.slice(n));
    }
    for (let n = Math.min(4, t.length - 1); n >= 1; n--) {
      if (!ekor.has(t.slice(-n).join(" "))) continue;
      const kepala = t.slice(0, -n);
      while (kepala.length && ADMIN.has(kepala[kepala.length - 1])) kepala.pop();
      if (kepala.length) calon.push(kepala);
    }
    for (const c of calon) {
      const k = c.join(" ");
      if (k === kunci || hasil.has(k)) continue;
      hasil.add(k);
      antre.push(k);
    }
  }
  return [...hasil].sort();
}

/** Edit distance, giving up (returning batas + 1) once it cannot stay within batas. */
export function jarakEdit(a: string, b: string, batas: number): number {
  if (Math.abs(a.length - b.length) > batas) return batas + 1;
  let sebelum = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const kini = [i];
    let terkecil = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(sebelum[j] + 1, kini[j - 1] + 1, sebelum[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      kini.push(v);
      if (v < terkecil) terkecil = v;
    }
    if (terkecil > batas) return batas + 1;
    sebelum = kini;
  }
  return sebelum[b.length];
}

/**
 * One word folded so the usual transliteration variants meet: Raudhotul/Raudhatul,
 * Qur'an/Quran, Bukhori/Bukhari, Taimiyyah/Taimiyah, Hurairoh/Hurairah.
 */
function lipat(kata: string): string {
  // "Almatuq" and "Al-Ma'tuq" are the same name: the article is written joined as often
  // as it is written apart. Only the plain "al", and only when a whole name is left, so
  // "alam" and "aliyah" keep their letters.
  let k = kata.length >= 6 && kata.startsWith("al") ? kata.slice(2) : kata;
  k = k
    .replace(/dj/g, "j")
    .replace(/oe/g, "u")
    .replace(/(dh|dl|dz)/g, "d")
    .replace(/th/g, "t")
    .replace(/ts/g, "s")
    .replace(/(sy|sh)/g, "s")
    .replace(/kh/g, "k")
    .replace(/q/g, "k")
    .replace(/o/g, "a")
    .replace(/(\p{L})\1+/gu, "$1");
  if (k === "ibnu") k = "ibn";
  if (k.length > 3 && k.endsWith("h")) k = k.slice(0, -1);
  return k;
}

/**
 * "Al" on its own, dropped so "Al Bayyinah" meets "Albayyinah" — `lipat` takes the
 * joined one off the front of a word, and this takes the loose one out. Only "al":
 * the assimilating forms ("as-Sunnah" → "Assunnah") already meet once the doubled
 * letter is collapsed, and dropping them would part them again.
 */
function kataInti(kunci: string): string[] {
  return kunci
    .split(" ")
    .filter((w) => w !== "al")
    .map(lipat);
}

/** Spacing and doubled letters ignored: "As-Sunnah" and "Assunnah", "Jati Padang" and "Jatipadang". */
function rapat(kunci: string): string {
  return kataInti(kunci).join("").replace(/(\p{L})\1+/gu, "$1");
}

/** Word order ignored: "Jakarta Selatan, Pasar Minggu" and "Pasar Minggu, Jakarta Selatan". */
function kantong(kunci: string): string {
  return kataInti(kunci).sort().join(" ");
}

/** Words that say what kind of school it is, or are articles, not which one. */
const UMUM = new Set(
  [
    "pesantren",
    "modern",
    "mahad",
    "maahad",
    "islam",
    "islami",
    "islamic",
    "islamiyah",
    "islamiyyah",
    "terpadu",
    "boarding",
    "school",
    "yayasan",
    "salafiyah",
    "al",
    "el",
    "an",
    "ar",
    "as",
    "at",
    "ad",
    "asy",
    "ash",
    "az",
    "kab",
    "kota",
    "kec",
    "kel",
  ].map(lipat),
);

/**
 * Words that say the kind of school rather than which one. Not folded away in general
 * — an MA and the pesantren it sits in are worth counting apart — but an answer in
 * Arabic names the place, not the Indonesian school category, so the Arabic pass
 * ignores them.
 */
const JENIS = new Set(
  [
    "madrasah",
    "aliyah",
    "tsanawiyah",
    "negeri",
    "sma",
    "smait",
    "smk",
    "smp",
    "sd",
    "universitas",
    "kuliyah",
    "markaz",
    "putra",
    "putri",
  ].map(lipat),
);

/**
 * What is left of a name once the alphabet is out of the way: the consonants of the
 * words that say which school it is. Arabic writes no short vowels, so they are the
 * only thing the two spellings are sure to share — "معهد الإمام البخاري" and "Pondok
 * Pesantren Imam Bukhari" both come down to "bkr mm".
 *
 * Too blunt to group Latin answers by on its own (Iman and Amin would meet), so it is
 * only used to attach an Arabic answer to a Latin one, and only when exactly one
 * matches.
 */
export function kerangkaKunci(kunci: string): string {
  // Indonesian glues the article to the word before it where Arabic writes it
  // separately: "Nurul Hakim" is "نور الحكيم", "Minhajul Haq" is "منهاج الحق".
  const tanpaSambung = (w: string) => w.replace(/^(.{3,})u[lnrstdz]$/, "$1");
  const kata = kataInti(alihAksara(kunci))
    .filter((w) => !UMUM.has(w) && !JENIS.has(w))
    .map((w) => tanpaSambung(w).replace(/[aiueo]/g, "").replace(/h$/, ""))
    .filter((w) => w.length >= 2);
  return [...new Set(kata)].sort().join(" ");
}

export type GrupTeks = {
  kunci: string;
  label: string;
  n: number;
  /** The other spellings counted under this label, most common first. */
  ejaan: string[];
};

const PANJANG_MIN_MIRIP = 8;
const JARAK_MAKS = 2;

/**
 * Groups answers by key, then merges keys that are the same answer written more or less
 * fully, and near-identical typos. Every merge must be unambiguous: "Bogor" joins
 * "Kab. Bogor" only if no "Kota Bogor" was also answered, and "SMAN 1" joins nothing if
 * both "SMAN 1 Bogor" and "SMAN 1 Depok" are there. Sorted by count, then key.
 */
export function kelompokkanTeks(nilai: Array<string | null | undefined>): { grup: GrupTeks[]; kosong: number } {
  const perKunci = new Map<string, Map<string, number>>();
  let kosong = 0;
  for (const v of nilai) {
    const ejaan = (v ?? "").replace(/\s+/g, " ").trim();
    const k = kunciTeks(ejaan);
    if (!k) {
      kosong++;
      continue;
    }
    const m = perKunci.get(k) ?? new Map<string, number>();
    m.set(ejaan, (m.get(ejaan) ?? 0) + 1);
    perKunci.set(k, m);
  }

  // Longest first, so a long answer is joined to its middle-length form before a short
  // one looks for where it belongs.
  const kunci = [...perKunci.keys()].sort(
    (a, b) => b.split(" ").length - a.split(" ").length || b.length - a.length || (a < b ? -1 : a > b ? 1 : 0),
  );
  const induk = new Map(kunci.map((k) => [k, k]));
  const cari = (k: string): string => {
    let r = k;
    while (induk.get(r) !== r) r = induk.get(r)!;
    induk.set(k, r);
    return r;
  };
  const satukan = (a: string, b: string) => {
    const ra = cari(a);
    const rb = cari(b);
    if (ra !== rb) induk.set(ra < rb ? rb : ra, ra < rb ? ra : rb);
  };
  const gabungJikaTunggal = (k: string, calon: string[]) => {
    const akar = new Set(calon.map(cari));
    akar.delete(cari(k));
    if (akar.size === 1) satukan(k, [...akar][0]);
  };

  const { ekor, dikenal, arti } = tempat();

  // The same district followed by the same region written two ways: "Pasar Minggu,
  // Kota Jakarta Selatan" and "Pasar Minggu, Jakarta Selatan". Not "..., Bogor", which
  // could be the regency or the city.
  const perTempat = new Map<string, string[]>();
  for (const k of kunci) {
    const t = k.split(" ");
    for (let n = Math.min(4, t.length - 1); n >= 1; n--) {
      const makna = arti.get(t.slice(-n).join(" "));
      if (!makna) continue;
      const kepala = t.slice(0, -n);
      while (kepala.length && ADMIN.has(kepala[kepala.length - 1])) kepala.pop();
      if (makna.size === 1 && kepala.length) {
        const tanda = `${rapat(kepala.join(" "))}@${[...makna][0]}`;
        perTempat.set(tanda, [...(perTempat.get(tanda) ?? []), k]);
      }
      break;
    }
  }
  for (const [pertama, ...lain] of perTempat.values()) for (const k of lain) satukan(k, pertama);

  // Same letters however spaced or spelled, or same words in another order. Spelling
  // folds are for transliterated names: an official place name only meets another
  // answer that has exactly its letters ("Depok" is not "Depak").
  const polos = (k: string) => [k.replace(/ /g, ""), k.split(" ").sort().join(" ")];
  for (const bentuk of [rapat, kantong]) {
    const ember = new Map<string, string[]>();
    for (const k of kunci) ember.set(bentuk(k), [...(ember.get(bentuk(k)) ?? []), k]);
    for (const [pertama, ...lain] of ember.values()) {
      for (const k of lain) {
        if (dikenal.has(k) || dikenal.has(pertama)) {
          const [a, b] = [polos(k), polos(pertama)];
          if (a[0] !== b[0] && a[1] !== b[1]) continue;
        }
        satukan(k, pertama);
      }
    }
  }

  // The same name with a different word for what the place is: "Alfurqon", "Ma'had Al
  // Furqon Al Islami". What is left once those words go is the same, so they are one
  // school. A name is needed for this, not an abbreviation: at least one long word.
  const emberInti = new Map<string, string[]>();
  for (const k of kunci) {
    // Never an answer that is itself a place, or one whose shorter form is: "Cibinong,
    // Kota Bogor" and "Cibinong, Bogor" differ by the one word that says which Bogor.
    if ([k, ...bentukPendek(k)].some((p) => dikenal.has(p))) continue;
    const kata = [...new Set(kataInti(k).filter((w) => !UMUM.has(w)))].sort();
    if (!kata.some((w) => /\p{L}{4,}/u.test(w))) continue;
    const tanda = kata.join(" ");
    emberInti.set(tanda, [...(emberInti.get(tanda) ?? []), k]);
  }
  for (const [pertama, ...lain] of emberInti.values()) for (const k of lain) satukan(k, pertama);

  const pemilikBentuk = new Map<string, string[]>();
  for (const k of kunci) {
    for (const p of bentukPendek(k)) {
      const d = pemilikBentuk.get(rapat(p)) ?? [];
      d.push(k);
      pemilikBentuk.set(rapat(p), d);
    }
  }
  for (const k of kunci) gabungJikaTunggal(k, pemilikBentuk.get(rapat(k)) ?? []);

  // Typos. Numbers must match ("SMAN 1" is not "SMAN 2"), and two real place names are
  // never merged however close ("Kab. Malang", "Kab. Magelang").
  const angka = (k: string) => (k.match(/\d+/g) ?? []).join(" ");
  const panjang = kunci.filter((k) => k.length > PANJANG_MIN_MIRIP);
  const mirip = new Map<string, string[]>();
  for (let i = 0; i < panjang.length; i++) {
    for (let j = i + 1; j < panjang.length; j++) {
      const a = panjang[i];
      const b = panjang[j];
      if (angka(a) !== angka(b) || (dikenal.has(a) && dikenal.has(b))) continue;
      // Arabic words are short and share most of their letters: "الأخوة" and "الربوة"
      // are two letters apart and two different pesantren.
      if (adaArab(a) && adaArab(b)) continue;
      if (jarakEdit(a, b, JARAK_MAKS) > JARAK_MAKS) continue;
      mirip.set(a, [...(mirip.get(a) ?? []), b]);
      mirip.set(b, [...(mirip.get(b) ?? []), a]);
    }
  }
  for (const k of kunci) gabungJikaTunggal(k, mirip.get(k) ?? []);

  // A short name found whole inside exactly one longer answer: "Gontor" in "Pondok
  // Modern Darussalam Gontor". Never an official place name: "Kab. Lombok Barat, Nusa
  // Tenggara Barat" has all its words inside "Kab. Lombok Timur, Nusa Tenggara Barat".
  const inti = new Map(kunci.map((k) => [k, new Set(k.split(" ").map(lipat).filter((w) => !UMUM.has(w)))]));
  const total = (k: string) => [...perKunci.get(k)!.values()].reduce((s, n) => s + n, 0);
  const jumlah = (akar: string) => kunci.reduce((s, j) => (cari(j) === akar ? s + total(j) : s), 0);
  for (const k of kunci) {
    const kata = inti.get(k)!;
    if (dikenal.has(k) || ![...kata].some((w) => /\p{L}{4,}/u.test(w))) continue;
    const pemilik = kunci.filter((j) => {
      const lain = inti.get(j)!;
      return j !== k && lain.size > kata.size && [...kata].every((w) => lain.has(w));
    });
    // Already grouped with a longer answer that contains it: another one elsewhere
    // makes it ambiguous, not a match.
    if (pemilik.some((j) => cari(j) === cari(k))) continue;
    const akar = [...new Set(pemilik.map(cari))];
    if (akar.length === 1) satukan(k, akar[0]);
    // An area that is not itself a region but starts the names of several ("Lombok" for
    // Lombok Timur and Lombok Barat): counted with the one most people named.
    else if (
      akar.length > 1 &&
      pemilik.every((j) => [j, ...bentukPendek(j)].some((p) => ekor.has(p) && p.replace(/^(kab|kota) /, "").startsWith(`${k} `)))
    ) {
      const terbanyak = akar.map((a) => [a, jumlah(a)] as const).sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))[0][0];
      satukan(k, terbanyak);
    }
  }

  // Answers written in Arabic script. Short vowels are not written in Arabic, so the
  // two alphabets only meet on the consonants: "معهد الإمام البخاري" and "Pondok
  // Pesantren Imam Bukhari" both come down to imam + bkr. Dropping the vowels is too
  // blunt for the Latin answers on their own — Iman and Amin would meet — so it is
  // used here alone, and only when exactly one answer on the other side matches.
  const arab = kunci.filter((k) => adaArab(k));
  if (arab.length) {
    const ember = new Map<string, string[]>();
    for (const k of kunci) {
      const r = kerangkaKunci(k);
      // Two consonants are not a name to go on; three are.
      if (r.replace(/ /g, "").length < 3) continue;
      ember.set(r, [...(ember.get(r) ?? []), k]);
    }
    for (const k of arab) {
      const calon = (ember.get(kerangkaKunci(k)) ?? []).filter((j) => !adaArab(j));
      const akar = [...new Set(calon.map(cari))].filter((a) => a !== cari(k));
      if (!akar.length) continue;
      if (akar.length === 1) {
        satukan(k, akar[0]);
        continue;
      }
      // Several Latin groups with the same consonants are usually the same school
      // written at different lengths ("Imam Bukhari", "Imam Bukhari Boarding School"),
      // so the Arabic answer goes to the one most people wrote. Short skeletons are
      // not enough to say that — "Ibnu Abbas" and "Albinaa IBS" are both "bn bs" —
      // and are left alone.
      if (kerangkaKunci(k).replace(/ /g, "").length < 5) continue;
      const terbanyak = akar
        .map((a) => [a, jumlah(a)] as const)
        .sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))[0][0];
      satukan(k, terbanyak);
    }
  }

  const perAkar = new Map<string, Map<string, number>>();
  for (const k of kunci) {
    const r = cari(k);
    const m = perAkar.get(r) ?? new Map<string, number>();
    for (const [e, n] of perKunci.get(k)!) m.set(e, (m.get(e) ?? 0) + n);
    perAkar.set(r, m);
  }
  const grup = [...perAkar.values()].map((ejaan) => {
    const urut = [...ejaan.entries()]
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([e]) => e);
    // The dashboard is read in Latin letters: when the same school was written both
    // ways, the label is the Indonesian spelling most people used and the Arabic one
    // is listed among the other spellings. A group written only in Arabic keeps it.
    const label = urut.find((e) => !adaArab(e)) ?? urut[0];
    return {
      kunci: kunciTeks(label),
      label,
      n: [...ejaan.values()].reduce((s, n) => s + n, 0),
      ejaan: urut.filter((e) => e !== label),
    };
  });
  grup.sort((a, b) => b.n - a.n || (a.kunci < b.kunci ? -1 : a.kunci > b.kunci ? 1 : 0));
  return { grup, kosong };
}
