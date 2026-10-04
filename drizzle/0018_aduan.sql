-- Complaint tickets submitted on the website (the admin WhatsApp number was banned).
-- Idempotent so a re-run against a database that already has the table is harmless.
CREATE TABLE IF NOT EXISTS "aduan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor" text NOT NULL,
	"acara_id" uuid,
	"slug" text,
	"halaman" text NOT NULL,
	"pesan" text NOT NULL,
	"nama" text,
	"kontak" text,
	"nomor_peserta" text,
	"pengguna_id" uuid,
	"lang" text,
	"status" text DEFAULT 'baru' NOT NULL,
	"catatan_admin" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "aduan_nomor_unique" UNIQUE("nomor")
);
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'aduan_acara_id_acara_id_fk') THEN
  ALTER TABLE "aduan" ADD CONSTRAINT "aduan_acara_id_acara_id_fk" FOREIGN KEY ("acara_id") REFERENCES "public"."acara"("id") ON DELETE set null ON UPDATE no action;
 END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'aduan_pengguna_id_pengguna_id_fk') THEN
  ALTER TABLE "aduan" ADD CONSTRAINT "aduan_pengguna_id_pengguna_id_fk" FOREIGN KEY ("pengguna_id") REFERENCES "public"."pengguna"("id") ON DELETE set null ON UPDATE no action;
 END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aduan_status_idx" ON "aduan" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aduan_waktu_idx" ON "aduan" USING btree ("created_at");