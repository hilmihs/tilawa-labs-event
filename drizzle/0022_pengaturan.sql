-- Site-wide switches flipped from /admin (first one: whether NAWA Hub & Fest are shown).
-- Idempotent so a re-run against a database that already has the table is harmless.
CREATE TABLE IF NOT EXISTS "pengaturan" (
	"kunci" text PRIMARY KEY NOT NULL,
	"nilai" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
