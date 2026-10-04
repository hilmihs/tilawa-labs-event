/*
 * Arabic script written out in Latin letters, so an answer typed on the Arabic form
 * can be recognised as the same school someone else wrote in Indonesian: "معهد الإمام
 * البخاري" and "Pondok Pesantren Imam Bukhari" are one pesantren, not two.
 *
 * This is not a scholarly transliteration. It only has to land close enough that the
 * comparison in rapikan-teks — which already ignores the transliteration variants
 * Indonesians write, Bukhari/Bukhori and Raudhotul/Raudhatul — can see the two as the
 * same name. Short vowels are not written in Arabic at all, so the comparison drops
 * them on both sides; what has to survive here is the consonants and their order.
 *
 * The word list comes first: the handful of words that carry meaning rather than a
 * name ("معهد" is "ma'had", not "mahd") and whose letters would otherwise land wide of
 * the Indonesian spelling. Everything else goes letter by letter.
 */

const ARAB = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

export function adaArab(teks: string): boolean {
  return ARAB.test(teks);
}

/** Words whose Indonesian spelling is not what the letters alone would give. */
const KATA: Record<string, string> = {
  معهد: "mahad",
  معاهد: "mahad",
  المعهد: "mahad",
  مدرسة: "madrasah",
  المدرسة: "madrasah",
  ثانوية: "aliyah",
  الثانوية: "aliyah",
  العالية: "aliyah",
  جامعة: "universitas",
  الجامعة: "universitas",
  كلية: "kuliyah",
  مركز: "markaz",
  المركز: "markaz",
  تحفيظ: "tahfidz",
  لتحفيظ: "tahfidz",
  للتحفيظ: "tahfidz",
  تربية: "tarbiyah",
  التربية: "tarbiyah",
  للتربية: "tarbiyah",
  القرآن: "quran",
  القران: "quran",
  قرآن: "quran",
  الاسلامي: "islami",
  الاسلامية: "islami",
  الإسلامي: "islami",
  الإسلامية: "islami",
  اسلامي: "islami",
  إسلامي: "islami",
  الإسلام: "islam",
  الاسلام: "islam",
  السلفي: "salafi",
  السلفية: "salafi",
  // The "w" of these is a consonant, not the long "u" the letter usually stands for.
  الأخوة: "ukhuwah",
  الاخوة: "ukhuwah",
  أخوة: "ukhuwah",
  الدعوة: "dakwah",
  دعوة: "dakwah",
  النبوة: "nubuwah",
  التقوى: "taqwa",
  ابن: "ibnu",
  بن: "bin",
  أبو: "abu",
  ابو: "abu",
  أبي: "abu",
  ابي: "abu",
  أم: "ummu",
  ام: "ummu",
  بنت: "binti",
  للبنات: "putri",
  البنات: "putri",
  للبنين: "putra",
  البنين: "putra",
  // Prepositions and conjunctions: nothing in the name.
  في: "",
  و: "",
  ال: "",
};

/** One Arabic letter to the letters Indonesians write for it. */
const HURUF: Record<string, string> = {
  "ء": "", // ء
  "آ": "a", // آ
  "أ": "a", // أ
  "ؤ": "u", // ؤ
  "إ": "i", // إ
  "ئ": "i", // ئ
  "ا": "a", // ا
  "ب": "b", // ب
  "ة": "h", // ة
  "ت": "t", // ت
  "ث": "ts", // ث
  "ج": "j", // ج
  "ح": "h", // ح
  "خ": "kh", // خ
  "د": "d", // د
  "ذ": "dz", // ذ
  "ر": "r", // ر
  "ز": "z", // ز
  "س": "s", // س
  "ش": "sy", // ش
  "ص": "sh", // ص
  "ض": "dh", // ض
  "ط": "th", // ط
  "ظ": "zh", // ظ
  "ع": "a", // ع
  "غ": "gh", // غ
  "ـ": "", // ـ
  "ف": "f", // ف
  "ق": "q", // ق
  "ك": "k", // ك
  "ل": "l", // ل
  "م": "m", // م
  "ن": "n", // ن
  "ه": "h", // ه
  "و": "u", // و
  "ى": "a", // ى
  "ي": "i", // ي
  "ٱ": "a", // ٱ
  "پ": "p", // پ
  "چ": "c", // چ
  "ژ": "z", // ژ
  "ک": "k", // ک
  "گ": "g", // گ
  "ی": "i", // ی
};

const ANGKA = "٠١٢٣٤٥٦٧٨٩";

function huruf(kata: string): string {
  let hasil = "";
  for (const c of kata) {
    const i = ANGKA.indexOf(c);
    if (i >= 0) {
      hasil += String(i);
      continue;
    }
    hasil += HURUF[c] ?? (ARAB.test(c) ? "" : c);
  }
  return hasil;
}

/**
 * The prefixed "bi-" of a place ("بباكنبارو" = in Pekanbaru), taken off only when a
 * whole name is left — "بانكا" is Bangka, not "bi-Angka".
 */
function tanpaAwalan(kata: string): string {
  if (!kata.startsWith("ب") || kata.length < 6) return kata;
  const sisa = kata.slice(1);
  return huruf(sisa).length >= 5 ? sisa : kata;
}

/**
 * The whole answer in Latin letters, word by word; anything not Arabic is left alone.
 *
 * The definite article comes off as a word of its own: Arabic writes "الحق" joined
 * where Indonesian writes "Al Haq", and the rest of the machinery already knows to
 * ignore a loose "al".
 */
export function alihAksara(teks: string): string {
  return teks
    .split(/\s+/)
    .flatMap((kata) => {
      if (!adaArab(kata)) return [kata];
      const bersih = kata.replace(/[ً-ْٰ]/g, "");
      const dari = KATA[bersih];
      if (dari !== undefined) return [dari];
      const pokok = tanpaAwalan(bersih);
      if (pokok.startsWith("ال") && pokok.length >= 4) return ["al", huruf(pokok.slice(2))];
      return [huruf(pokok)];
    })
    .filter(Boolean)
    .join(" ");
}
