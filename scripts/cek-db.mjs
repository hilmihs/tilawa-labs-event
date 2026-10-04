#!/usr/bin/env node
/*
 * Connection doctor.
 *
 * A refused database connection reports one opaque error, and the cause is almost
 * always one of a handful of dull things: a placeholder left unreplaced, an
 * unencoded character in the password, the wrong port, the wrong user. This checks
 * the string's shape first, then actually connects, and names what went wrong.
 *
 * The password is never printed.
 *
 *   node scripts/cek-db.mjs 'postgresql://user:pass@host:6543/postgres'
 *   DATABASE_URL='…' node scripts/cek-db.mjs
 */
import fs from "node:fs";
import pg from "pg";

const url = process.argv[2] ?? process.env.DATABASE_URL;

if (!url) {
  console.error("Usage: node scripts/cek-db.mjs '<connection string>'");
  console.error("   or: DATABASE_URL='…' node scripts/cek-db.mjs");
  process.exit(2);
}

let u;
try {
  u = new URL(url);
} catch {
  console.error("✗ The string is not a valid URL at all.");
  console.error("  It must start with postgresql:// and have no stray spaces or quotes.");
  process.exit(1);
}

const pw = decodeURIComponent(u.password ?? "");
const masalah = [];

if (!/^postgres(ql)?:$/.test(u.protocol)) masalah.push(`protocol is ${u.protocol}, expected postgresql:`);
if (!u.username) masalah.push("no username");
if (!pw) masalah.push("no password");
if (/[[\]]/.test(pw)) masalah.push("password still contains [ ] — the placeholder was not replaced");
if (/\s/.test(pw)) masalah.push("password contains a space");
if (u.hostname.includes("supabase")) {
  if (u.hostname.startsWith("db.")) {
    masalah.push("this is the DIRECT host, which is IPv6-only — use the pooler host");
  }
  if (u.port !== "6543") {
    masalah.push(`port is ${u.port || "(none)"}, the transaction pooler is 6543`);
  }
  if (u.hostname.includes("pooler") && !u.username.includes(".")) {
    masalah.push("pooler username should look like postgres.<project-ref>");
  }
}

// Characters that change the meaning of a URL if they are not percent-encoded.
const berbahaya = [...new Set([...pw].filter((c) => "@:/?#[]&= ".includes(c)))];

console.log("Shape");
console.log("  user     :", u.username);
console.log("  host     :", u.hostname);
console.log("  port     :", u.port || "(none)");
console.log("  database :", u.pathname.replace(/^\//, "") || "(none)");
console.log("  query    :", u.search || "(none)");
console.log("  password :", `${pw.length} characters`, berbahaya.length ? `— contains ${JSON.stringify(berbahaya)}, which must be percent-encoded` : "— all safe characters");

if (masalah.length) {
  console.log("\nProblems in the string:");
  for (const m of masalah) console.log("  ✗", m);
} else {
  console.log("\n✓ The string looks well formed.");
}

// Same TLS handling as the application: verify against the provider CA when given.
let ssl;
const caFile = "supabase-root-ca.crt";
if (process.env.DB_SSL_CA) {
  const raw = process.env.DB_SSL_CA.trim();
  ssl = {
    ca: raw.startsWith("-----BEGIN") ? raw : Buffer.from(raw, "base64").toString("utf8"),
    rejectUnauthorized: true,
  };
  console.log("\nTLS: verifying against DB_SSL_CA");
} else if (fs.existsSync(caFile)) {
  ssl = { ca: fs.readFileSync(caFile, "utf8"), rejectUnauthorized: true };
  console.log(`\nTLS: verifying against ${caFile}`);
} else {
  console.log("\nTLS: leaving it to the connection string");
}

const bersih = new URL(url);
if (ssl) {
  bersih.searchParams.delete("sslmode");
  bersih.searchParams.delete("ssl");
}

const ARTI = {
  "28P01": "the password is wrong",
  "28000": "the username is wrong, or that user may not connect this way",
  "3D000": "that database does not exist",
  ENOTFOUND: "the host does not resolve",
  ECONNREFUSED: "nothing is listening on that port",
  ETIMEDOUT: "the host did not answer — wrong port, or blocked",
  SELF_SIGNED_CERT_IN_CHAIN: "the provider's CA is not trusted — supply DB_SSL_CA",
};

const client = new pg.Client({
  connectionString: bersih.toString(),
  ...(ssl ? { ssl } : {}),
  connectionTimeoutMillis: 15_000,
});

try {
  await client.connect();
  const { rows } = await client.query("select current_user, current_database(), version()");
  console.log("\n✓ Connected.");
  console.log("  user     :", rows[0].current_user);
  console.log("  database :", rows[0].current_database);
  console.log("  server   :", String(rows[0].version).split(" ").slice(0, 2).join(" "));
  const t = await client.query("select count(*)::int AS n FROM acara");
  console.log("  events in the table:", t.rows[0].n);
  await client.end();
  process.exit(0);
} catch (e) {
  const kode = e.code ?? e.cause?.code;
  console.log("\n✗ Connection failed.");
  console.log("  code   :", kode ?? "(none)");
  console.log("  meaning:", ARTI[kode] ?? e.message);
  process.exit(1);
}
