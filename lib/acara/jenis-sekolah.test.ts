import { describe, expect, it } from "vitest";
import { jenisSekolah } from "./jenis-sekolah";

describe("jenisSekolah", () => {
  it("reads the type from the name", () => {
    expect(jenisSekolah("Ponpes Abu Hurairah Mataram")).toBe("pesantren");
    expect(jenisSekolah("Ma'had Al Furqon")).toBe("pesantren");
    expect(jenisSekolah("معهد السنة لومبوك")).toBe("pesantren");
    expect(jenisSekolah("Albinaa IBS")).toBe("pesantren");
    expect(jenisSekolah("MAN 2 Bogor")).toBe("ma");
    expect(jenisSekolah("SMA IT Al Bayyinah")).toBe("sma");
    expect(jenisSekolah("LIPIA MEDAN")).toBe("tinggi");
    expect(jenisSekolah("Al Fatah")).toBe("lain");
    expect(jenisSekolah("")).toBeNull();
  });
});
