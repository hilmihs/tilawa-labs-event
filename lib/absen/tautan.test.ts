import { describe, expect, it } from "vitest";
import { linkAbsen, linkCatatan, namaDepan } from "./tautan";

const BASIS = "https://nawaroom.id";

describe("tautan", () => {
  it("builds one static no-show link per programme, with no token in it", () => {
    expect(linkAbsen(BASIS, "ar", "student-lecture")).toBe("https://nawaroom.id/ar/p/student-lecture/absen");
  });
  it("builds the notes link", () => {
    expect(linkCatatan(BASIS, "en", "student-lecture")).toBe("https://nawaroom.id/en/p/student-lecture/notes");
  });
  it("takes the first name, and survives odd spacing", () => {
    expect(namaDepan("  Ahmad   Fauzi ")).toBe("Ahmad");
    expect(namaDepan("")).toBe("");
  });
});
