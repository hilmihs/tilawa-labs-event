import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { signTiketToken, verifyTiketToken } from "./token";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

beforeAll(() => {
  process.env.AUTH_SECRET = SECRET;
});

function key(s = SECRET) {
  return new TextEncoder().encode(s);
}

// Test 4 of the six: forged ticket links.
describe("verifyTiketToken", () => {
  it("round-trips a token it signed", async () => {
    const token = await signTiketToken({ pid: "abc-123", slug: "student-lecture" });
    expect(await verifyTiketToken(token)).toEqual({ pid: "abc-123", slug: "student-lecture" });
  });

  it("rejects a bad signature", async () => {
    const token = await new SignJWT({ pid: "abc", slug: "s", scope: "etiket" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(key("a-different-secret-bbbbbbbbbbbbbbbbbbbb"));
    expect(await verifyTiketToken(token)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    const token = await new SignJWT({ pid: "abc", slug: "s", scope: "etiket" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(past - 100)
      .setExpirationTime(past)
      .sign(key());
    expect(await verifyTiketToken(token)).toBeNull();
  });

  it("rejects the wrong scope", async () => {
    const token = await new SignJWT({ pid: "abc", slug: "s", scope: "sesi" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(key());
    expect(await verifyTiketToken(token)).toBeNull();
  });

  it("rejects malformed claims", async () => {
    const missing = await new SignJWT({ slug: "s", scope: "etiket" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(key());
    const wrongType = await new SignJWT({ pid: 42, slug: "s", scope: "etiket" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(key());
    const empty = await new SignJWT({ pid: "", slug: "s", scope: "etiket" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(key());

    expect(await verifyTiketToken(missing)).toBeNull();
    expect(await verifyTiketToken(wrongType)).toBeNull();
    expect(await verifyTiketToken(empty)).toBeNull();
  });

  it("rejects garbage that is not a token at all", async () => {
    expect(await verifyTiketToken("not-a-token")).toBeNull();
    expect(await verifyTiketToken("")).toBeNull();
  });

  it("rejects an unsigned (alg: none) token", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(
      JSON.stringify({ pid: "abc", slug: "s", scope: "etiket", exp: 9999999999 }),
    ).toString("base64url");
    expect(await verifyTiketToken(`${header}.${body}.`)).toBeNull();
  });
});
