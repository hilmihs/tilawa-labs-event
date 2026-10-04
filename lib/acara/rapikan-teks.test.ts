import { describe, expect, it } from "vitest";
import { bentukPendek, jarakEdit, kelompokkanTeks, kunciTeks } from "./rapikan-teks";

const sama = (...teks: string[]) => new Set(teks.map(kunciTeks)).size === 1;

describe("kunciTeks", () => {
  it("ignores case, spacing, punctuation and diacritics", () => {
    expect(kunciTeks("  Jakarta   Selatan ")).toBe("jakarta selatan");
    expect(kunciTeks('"Bandung" (Café)')).toBe("bandung cafe");
    expect(kunciTeks("")).toBe("");
    expect(kunciTeks(null)).toBe("");
  });

  it("spells every way of writing pesantren the same", () => {
    expect(kunciTeks("Pondok Pesantren Al-Uji")).toBe("pesantren al uji");
    expect(
      sama("Pondok Pesantren Al-Uji", "ponpes al uji", "PP Al Uji", "Pesantren Al-Uji", "Pontren Al Uji", "Pondok Al-Uji", "PP. Pondok Pesantren Al Uji"),
    ).toBe(true);
  });

  it("expands regency, city and province abbreviations", () => {
    expect(sama("Kab. Bogor", "Kabupaten Bogor", "kab bogor")).toBe(true);
    expect(sama("Jakarta Selatan", "Jaksel", "jakarta selatan ")).toBe(true);
    expect(sama("Kota Adm. Jakarta Selatan", "Kota Administrasi Jakarta Selatan", "Kota Jakarta Selatan")).toBe(true);
    expect(sama("Jakbar", "Jakarta Barat")).toBe(true);
    expect(sama("Tangsel", "Tangerang Selatan")).toBe(true);
    expect(sama("Jabar", "Jawa Barat", "Provinsi Jawa Barat")).toBe(true);
    expect(sama("Jateng", "Jawa Tengah")).toBe(true);
    expect(sama("Jatim", "Jawa Timur")).toBe(true);
    expect(sama("DIY", "DI Yogyakarta", "Jogja", "Jogjakarta", "Yogyakarta", "DI Jogja")).toBe(true);
    expect(sama("Sulsel", "Sulawesi Selatan")).toBe(true);
    expect(sama("Sumbar", "Sumatra Barat", "Sumatera Barat")).toBe(true);
    expect(sama("DKI Jakarta", "Jakarta")).toBe(true);
    expect(sama("Jawa Barat", "Jawa Timur")).toBe(false);
  });

  it("expands school abbreviations on whole words only", () => {
    expect(sama("SMAN 1 Bogor", "SMA N 1 Bogor", "SMA Negeri 1 Bogor", "sman1 bogor")).toBe(true);
    expect(sama("SMKN 2 Depok", "SMK N 2 Depok", "SMK Negeri 2 Depok")).toBe(true);
    expect(sama("MAN 1 Jakarta", "Madrasah Aliyah Negeri 1 Jakarta")).toBe(true);
    expect(sama("MA Al-Uji", "Madrasah Aliyah Al Uji")).toBe(true);
    expect(kunciTeks("SMAIT Al Uji")).toBe("smait al uji");
    expect(kunciTeks("SMA IT Al Uji")).toBe("smait al uji");
    expect(kunciTeks("SDIT Al Uji")).toBe("sdit al uji");
    // Not the abbreviation "ma", and not "man" inside a longer word.
    expect(kunciTeks("Ma'had Al-Uji")).toBe("mahad al uji");
    expect(kunciTeks("Mandiri")).toBe("mandiri");
    expect(kunciTeks("Pamulang")).toBe("pamulang");
    expect(sama("SMAN 1 Bogor", "SMAN 2 Bogor")).toBe(false);
  });

  it("treats al- and al the same", () => {
    expect(sama("Al-Uji", "Al Uji", "al  uji")).toBe(true);
  });
});

describe("bentukPendek", () => {
  it("drops a leading kab/kota and a trailing city or province", () => {
    expect(bentukPendek("kab bogor")).toEqual(["bogor"]);
    expect(bentukPendek(kunciTeks("Kab. Garut, Jawa Barat"))).toEqual(["garut", "garut jawa barat", "kab garut"]);
    expect(bentukPendek(kunciTeks("Pasar Minggu, Kota Jakarta Selatan"))).toEqual(["pasar minggu"]);
    expect(bentukPendek("pesantren al uji bogor")).toEqual(["pesantren al uji"]);
  });

  it("never cuts a place name down to part of itself", () => {
    expect(bentukPendek(kunciTeks("Kota Jakarta Selatan"))).toEqual(["jakarta selatan"]);
    expect(bentukPendek(kunciTeks("Kab. Bandung Barat"))).toEqual(["bandung barat"]);
    expect(bentukPendek("jawa barat")).toEqual([]);
  });
});

describe("jarakEdit", () => {
  it("counts edits and stops past the limit", () => {
    expect(jarakEdit("pesantren al uji", "pesantren aluji", 2)).toBe(1);
    expect(jarakEdit("kitten", "sitting", 5)).toBe(3);
    expect(jarakEdit("abc", "abcdef", 2)).toBe(3);
  });
});

describe("kelompokkanTeks", () => {
  const label = (nilai: string[]) => kelompokkanTeks(nilai).grup.map((g) => [g.label, g.n]);

  it("merges the pesantren spellings under the most common one", () => {
    expect(
      label(["Pondok Pesantren Al-Uji", "ponpes al uji", "PP Al Uji", "Pesantren Al-Uji", "PP Al Uji", "Pesantren Aluji"]),
    ).toEqual([["PP Al Uji", 6]]);
  });

  it("merges Jakarta Selatan spellings and counts blanks apart", () => {
    const h = kelompokkanTeks(["Jakarta Selatan", "Jaksel", "jakarta selatan ", "", null, "  "]);
    expect(h.grup).toEqual([
      { kunci: "jakarta selatan", label: "Jakarta Selatan", n: 3, ejaan: ["jakarta selatan", "Jaksel"] },
    ]);
    expect(h.kosong).toBe(3);
  });

  it("folds a bare name into its regency when that is the only match", () => {
    expect(label(["Kab. Bogor", "Kabupaten Bogor", "Bogor"])).toEqual([["Kabupaten Bogor", 3]]);
  });

  it("keeps a bare name apart when it could be the city or the regency", () => {
    expect(label(["Kab. Bogor", "Kota Bogor", "Bogor"])).toEqual([
      ["Bogor", 1],
      ["Kab. Bogor", 1],
      ["Kota Bogor", 1],
    ]);
  });

  it("joins an answer with its trailing city only when unambiguous", () => {
    expect(label(["Pesantren Al-Uji", "Pesantren Al Uji Bogor"])).toEqual([["Pesantren Al Uji Bogor", 2]]);
    expect(label(["SMAN 1", "SMAN 1 Bogor", "SMAN 1 Depok"]).length).toBe(3);
  });

  it("joins picker values with the free text written before the picker", () => {
    expect(label(["Kab. Garut, Jawa Barat", "Garut", "Kabupaten Garut"])).toEqual([["Kab. Garut, Jawa Barat", 3]]);
    expect(label(["Pasar Minggu, Kota Jakarta Selatan", "pasar minggu"])).toEqual([
      ["Pasar Minggu, Kota Jakarta Selatan", 2],
    ]);
  });

  it("merges small typos but not different numbers or different places", () => {
    expect(label(["Jakarta Selatan", "Jakarta Selatn"])).toEqual([["Jakarta Selatan", 2]]);
    expect(label(["SMAN 1 Bogor", "SMAN 2 Bogor"]).length).toBe(2);
    expect(label(["Kab. Malang", "Kab. Magelang"]).length).toBe(2);
    // Short keys are too easy to confuse: never fuzzy-merged.
    expect(label(["Depok", "Depak"]).length).toBe(2);
  });

  it("breaks label ties by length, then alphabetically", () => {
    expect(label(["PP Al Uji", "Pondok Pesantren Al-Uji"])).toEqual([["Pondok Pesantren Al-Uji", 2]]);
    expect(label(["jaksel", "Jaksel"])).toEqual([["Jaksel", 2]]);
  });

  it("gives the same result whatever the order", () => {
    const nilai = ["Kab. Bogor", "Bogor", "Jaksel", "Jakarta Selatan", "PP Al Uji", "Pesantren Al-Uji Bogor", "Depok"];
    const a = kelompokkanTeks(nilai).grup;
    const b = kelompokkanTeks([...nilai].reverse()).grup;
    expect(b).toEqual(a);
  });

  it("folds transliteration, spacing and doubled letters", () => {
    expect(
      label(["Ma'had Raudhotul Qur'an", "Mahad Raudhatul Quran", "Ponpes Ibnu Taimiyyah", "Pesantren Ibn Taimiyah"]),
    ).toEqual([
      ["Ma'had Raudhotul Qur'an", 2],
      ["Pesantren Ibn Taimiyah", 2],
    ]);
    expect(label(["Assunnah", "As-Sunnah", "Assunnah Cirebon"])).toEqual([["Assunnah Cirebon", 3]]);
    expect(label(["Jati Padang", "Jatipadang"])).toEqual([["Jati Padang", 2]]);
  });

  it("does not care which part comes first", () => {
    expect(label(["Pasar Minggu, Kota Jakarta Selatan", "Kota Jakarta Selatan, Pasar Minggu", "Jakarta Selatan Pasar Minggu"])).toEqual([
      ["Kota Jakarta Selatan, Pasar Minggu", 3],
    ]);
    expect(label(["Bogor Barat", "Kota Bogor"]).length).toBe(2);
  });

  it("treats a trailing region written two ways as one, unless it could be two", () => {
    expect(
      label([
        "Pasar Minggu, Kota Jakarta Selatan",
        "Pasar Minggu, Kota Jakarta Selatan",
        "Pasar Minggu, Jakarta Selatan",
        "Pasar Minggu",
        "Jati Padang",
        "Jati padang, Pasar Minggu",
      ]),
    ).toEqual([
      ["Pasar Minggu, Kota Jakarta Selatan", 4],
      ["Jati padang, Pasar Minggu", 2],
    ]);
    expect(label(["Cibinong, Kab. Bogor", "Cibinong, Kota Bogor", "Cibinong, Bogor"]).length).toBe(3);
  });

  it("joins a short name to the one longer answer it sits inside", () => {
    expect(label(["Gontor", "Pondok Modern Darussalam Gontor", "PMDG"])).toEqual([["Pondok Modern Darussalam Gontor", 3]]);
    // Inside two different answers: could be either.
    expect(label(["Gontor", "Gontor Putri 1", "Darussalam Gontor 2"]).length).toBe(3);
    // A city is inside many answers and joins none.
    expect(label(["Bekasi", "Pesantren Al Uji Bekasi"]).length).toBe(2);
  });

  it("never folds one official region into another with the same words", () => {
    expect(label(["Kab. Lombok Timur, Nusa Tenggara Barat", "Kab. Lombok Barat, Nusa Tenggara Barat"]).length).toBe(2);
  });

  it("counts an area that starts several region names with the one most people named", () => {
    expect(
      label([
        "Kab. Lombok Timur, Nusa Tenggara Barat",
        "Kab. Lombok Timur, Nusa Tenggara Barat",
        "Lombok Timur, NTB",
        "Kab. Lombok Barat, Nusa Tenggara Barat",
        "Lombok",
      ]),
    ).toEqual([
      ["Kab. Lombok Timur, Nusa Tenggara Barat", 4],
      ["Kab. Lombok Barat, Nusa Tenggara Barat", 1],
    ]);
    // A word that merely ends several names is not an area.
    expect(label(["Jakarta Selatan", "Tangerang Selatan", "Selatan"]).length).toBe(3);
  });

  it("keeps Jati Padang apart from Pasar Minggu", () => {
    expect(
      label([
        "Pasar Minggu, Kota Jakarta Selatan",
        "Pasar Minggu, Kota Jakarta Selatan",
        "Pasar Minggu, Jakarta Selatan",
        "Pasar Minggu",
        "Jati padang",
        "Jati padang",
        "jati padang, pasar minggu",
        "Jakarta Selatan",
      ]),
    ).toEqual([
      ["Pasar Minggu, Kota Jakarta Selatan", 4],
      ["Jati padang", 3],
      ["Jakarta Selatan", 1],
    ]);
  });

  it("counts a name written in Arabic with the same school written in Indonesian", () => {
    expect(
      label([
        "Pondok Pesantren Imam Bukhari",
        "Ponpes Imam Bukhori",
        "معهد الإمام البخاري",
        "معهد الامام البخاري",
      ]),
    ).toEqual([["Pondok Pesantren Imam Bukhari", 4]]);
    // The label stays in Latin letters even when the Arabic spelling is the commoner
    // one, because that is what the rest of the dashboard is read in.
    const [g] = kelompokkanTeks(["معهد المعتوق", "معهد المعتوق", "Pesantren Al-Ma'tuq"]).grup;
    expect(g).toMatchObject({ label: "Pesantren Al-Ma'tuq", n: 3 });
  });

  it("does not join two Arabic names that merely look alike", () => {
    // Al-Ukhuwah and Ar-Rabwah are two letters apart and two pesantren.
    expect(label(["معهد الأخوة", "معهد الربوة"]).length).toBe(2);
  });

  it("joins a name that differs only by the word for what the place is", () => {
    expect(label(["Alfurqon", "Ma'had Al Furqon Al Islami", "Al-Furqon"])).toEqual([
      ["Ma'had Al Furqon Al Islami", 3],
    ]);
  });

  it("lists the other spellings under each label", () => {
    const [g] = kelompokkanTeks(["Gontor", "Gontor", "Pondok Modern Darussalam Gontor"]).grup;
    expect(g).toMatchObject({ label: "Gontor", n: 3, ejaan: ["Pondok Modern Darussalam Gontor"] });
  });
});
