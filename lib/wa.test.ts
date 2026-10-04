import { describe, expect, it } from "vitest";
import { empatDigit, keAngkaLatin, normalizePhone } from "./wa";

// Test 1 of the six that matter: dirty data from a thousand people.
describe("normalizePhone", () => {
  const valid: Array<[string, string]> = [
    ["081234567890", "6281234567890"],
    ["0812 3456 7890", "6281234567890"],
    ["0812-3456-7890", "6281234567890"],
    ["+6281234567890", "6281234567890"],
    ["+62 812 3456 7890", "6281234567890"],
    ["62 812 3456 7890", "6281234567890"],
    ["6281234567890", "6281234567890"],
    ["81234567890", "6281234567890"],
    ["8123456789", "628123456789"],
    ["(0812) 3456-7890", "6281234567890"],
    ["0812.3456.7890", "6281234567890"],
    ["006281234567890", "6281234567890"],
    ["620812 3456 7890", "6281234567890"],
    ["  081234567890  ", "6281234567890"],
    ["0812 3456 7890", "6281234567890"],
    // Typed on an Arabic keyboard, or copied out of right-to-left text.
    ["٠٨١٢٣٤٥٦٧٨٩٠", "6281234567890"],
    ["٨١٢ ٣٤٥٦ ٧٨٩٠", "6281234567890"],
    ["+٦٢ ٨١٢ ٣٤٥٦ ٧٨٩٠", "6281234567890"],
    ["۰۸۱۲-۳۴۵۶-۷۸۹۰", "6281234567890"],
    ["٠812 ٣456 7890", "6281234567890"],
    ["\u200E+62 812 3456 7890\u200F", "6281234567890"],
  ];

  for (const [input, expected] of valid) {
    it(`normalises ${JSON.stringify(input)}`, () => {
      expect(normalizePhone(input)).toBe(expected);
    });
  }

  const invalid = [
    "",
    "   ",
    "abcd",
    "0812345",            // too short
    "08123456789012345",  // too long
    "12345678901",        // does not start with 0, 8, or 62
    "+1 555 0100",        // not an Indonesian number
    "0812-3456-78ab",
    "+62",
  ];

  for (const input of invalid) {
    it(`rejects ${JSON.stringify(input)}`, () => {
      expect(normalizePhone(input)).toBeNull();
    });
  }

  it("rejects null and undefined", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });
});

describe("empatDigit", () => {
  it("keeps only the last four digits", () => {
    expect(empatDigit("6281234567890")).toBe("7890");
  });
  it("returns null for anything shorter", () => {
    expect(empatDigit("123")).toBeNull();
  });
});

describe("keAngkaLatin", () => {
  it("maps both Arabic digit sets to 0–9 and leaves the rest alone", () => {
    expect(keAngkaLatin("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
    expect(keAngkaLatin("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    expect(keAngkaLatin("سنة ٢٠٢٤ / 2024")).toBe("سنة 2024 / 2024");
  });
});
