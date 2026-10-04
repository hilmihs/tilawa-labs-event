import { describe, expect, it } from "vitest";
import { adaArab, alihAksara } from "./arab-latin";

describe("adaArab", () => {
  it("tells the two alphabets apart", () => {
    expect(adaArab("معهد الإمام البخاري")).toBe(true);
    expect(adaArab("Pondok Pesantren Imam Bukhari")).toBe(false);
    expect(adaArab("معهد الفرقان Gresik")).toBe(true);
  });
});

describe("alihAksara", () => {
  it("writes the words that carry a meaning the way Indonesians write them", () => {
    expect(alihAksara("معهد")).toBe("mahad");
    expect(alihAksara("مدرسة")).toBe("madrasah");
    expect(alihAksara("الثانوية")).toBe("aliyah");
    expect(alihAksara("جامعة")).toBe("universitas");
  });

  it("takes the definite article off as a word of its own", () => {
    expect(alihAksara("الحق")).toBe("al hq");
    expect(alihAksara("المعتوق")).toBe("al matuq");
  });

  it("goes letter by letter for a name it does not know", () => {
    expect(alihAksara("البخاري")).toBe("al bkhari");
    expect(alihAksara("هريرة")).toBe("hrirh");
  });

  it("drops the prefixed bi- of a place, but not the b of a name", () => {
    expect(alihAksara("بماتارام")).toBe("mataram");
    // Bangka is a place whose name simply starts with the same letter.
    expect(alihAksara("بانكا")).toBe("banka");
  });

  it("leaves Latin words and numbers alone", () => {
    expect(alihAksara("معهد الفرقان Gresik")).toBe("mahad al frqan Gresik");
    expect(alihAksara("معهد اتحاد ١٨")).toBe("mahad athad 18");
  });
});
