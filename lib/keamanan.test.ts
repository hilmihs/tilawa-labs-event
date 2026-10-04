import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * The rate limit is only as good as the address it counts. X-Forwarded-For is
 * appended to by proxies, not replaced, so the leftmost entry is whatever the client
 * sent — trusting it lets anyone rotate a header and walk through both public
 * limiters, including the one guarding ticket lookup.
 */
const nilaiHeader = { value: "" };

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (k: string) => (k === "x-forwarded-for" ? nilaiHeader.value || null : null),
  }),
}));

let ipHashPermintaan: typeof import("./keamanan").ipHashPermintaan;
let hashIp: typeof import("./keamanan").hashIp;

beforeAll(async () => {
  process.env.IP_SALT = "test-salt-aaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  ({ ipHashPermintaan, hashIp } = await import("./keamanan"));
});

describe("ipHashPermintaan", () => {
  it("takes the hop we trust, not the value the client injected", async () => {
    process.env.PROXY_HOPS = "1";
    // Client sent "1.2.3.4"; our nginx appended the real peer "203.0.113.9".
    nilaiHeader.value = "1.2.3.4, 203.0.113.9";
    expect(await ipHashPermintaan()).toBe(hashIp("203.0.113.9"));
  });

  it("cannot be shifted by adding more spoofed hops", async () => {
    process.env.PROXY_HOPS = "1";
    nilaiHeader.value = "9.9.9.9, 8.8.8.8, 7.7.7.7, 203.0.113.9";
    expect(await ipHashPermintaan()).toBe(hashIp("203.0.113.9"));
  });

  it("counts back the configured number of our own proxies", async () => {
    process.env.PROXY_HOPS = "2";
    // CDN in front of nginx: client, real peer, then the CDN's own hop.
    nilaiHeader.value = "1.2.3.4, 203.0.113.9, 10.0.0.1";
    expect(await ipHashPermintaan()).toBe(hashIp("203.0.113.9"));
  });

  it("falls back to a constant rather than trusting nothing at all", async () => {
    process.env.PROXY_HOPS = "1";
    nilaiHeader.value = "";
    expect(await ipHashPermintaan()).toBe(hashIp("unknown"));
  });

  it("hashes rather than storing the address", async () => {
    expect(hashIp("203.0.113.9")).not.toContain("203.0.113.9");
    expect(hashIp("203.0.113.9")).toBe(hashIp("203.0.113.9"));
    expect(hashIp("203.0.113.9")).not.toBe(hashIp("203.0.113.10"));
  });
});
