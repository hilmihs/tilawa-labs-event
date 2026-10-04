import { describe, expect, it } from "vitest";
import { kelayakanAbsen } from "./kelayakan";

const dasar = { statusAcara: "selesai", hadir: false, jenis: "pra", izinOtsAt: null };

describe("kelayakanAbsen", () => {
  it("lets a pre-registered no-show in once the programme is over", () => {
    expect(kelayakanAbsen(dasar)).toBe("boleh");
  });
  it("waits for the programme to be marked finished", () => {
    expect(kelayakanAbsen({ ...dasar, statusAcara: "berlangsung" })).toBe("belum_selesai");
    expect(kelayakanAbsen({ ...dasar, statusAcara: "pendaftaran" })).toBe("belum_selesai");
  });
  it("turns away someone who was scanned in", () => {
    expect(kelayakanAbsen({ ...dasar, hadir: true })).toBe("hadir");
  });
  it("does not ask a walk-in who was never let in", () => {
    expect(kelayakanAbsen({ ...dasar, jenis: "ots" })).toBe("bukan_sasaran");
    expect(kelayakanAbsen({ ...dasar, jenis: "ots", izinOtsAt: new Date() })).toBe("boleh");
  });
});
