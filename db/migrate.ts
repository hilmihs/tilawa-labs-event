import { loadEnvFile } from "./env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { konfigurasiSsl, tanpaSslmode } from "./index";

loadEnvFile();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Same TLS rules as the app (DB_SSL_CA): the deploy pipeline runs this against
  // the production database, which signs its certificates with its own root.
  const ssl = konfigurasiSsl();
  const pool = new Pool({
    connectionString: ssl ? tanpaSslmode(url) : url,
    max: 1,
    ...(ssl ? { ssl } : {}),
  });
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("migrations applied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
