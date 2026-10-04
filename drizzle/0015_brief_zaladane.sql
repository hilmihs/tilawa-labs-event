CREATE TABLE IF NOT EXISTS "kunjungan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"halaman" text NOT NULL,
	"slug" text,
	"lang" text,
	"sumber" text NOT NULL,
	"perujuk" text,
	"perangkat" text NOT NULL,
	"pengunjung" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kunjungan_waktu_idx" ON "kunjungan" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kunjungan_slug_idx" ON "kunjungan" USING btree ("slug","created_at");