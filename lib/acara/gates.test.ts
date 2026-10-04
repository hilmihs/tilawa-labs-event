import { describe, expect, it } from "vitest";
import { GATES, KELOMPOK_GATE } from "./view-model";

describe("GATES", () => {
  it("has ten brothers' stations, fifteen sisters', and the help desk", () => {
    expect(GATES.filter((g) => g.startsWith("IKH-"))).toHaveLength(10);
    expect(GATES.filter((g) => g.startsWith("AKH-"))).toHaveLength(15);
    expect(GATES).toContain("BANTUAN");
    expect(GATES).not.toContain("OTS");
    expect(new Set(GATES).size).toBe(GATES.length);
  });

  it("groups every gate exactly once", () => {
    expect(KELOMPOK_GATE.flatMap((k) => k.gates)).toEqual([...GATES]);
  });
});
