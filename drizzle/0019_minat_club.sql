-- "I'm interested" in a NAWA club, recorded against an account before the clubs have WhatsApp groups.
-- Idempotent so a re-run against a database that already has the table is harmless.
CREATE TABLE IF NOT EXISTS "minat_club" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pengguna_id" uuid NOT NULL,
	"club" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"batal_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'minat_club_pengguna_id_pengguna_id_fk') THEN
  ALTER TABLE "minat_club" ADD CONSTRAINT "minat_club_pengguna_id_pengguna_id_fk" FOREIGN KEY ("pengguna_id") REFERENCES "public"."pengguna"("id") ON DELETE cascade ON UPDATE no action;
 END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "minat_club_unik" ON "minat_club" USING btree ("pengguna_id","club");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "minat_club_club_idx" ON "minat_club" USING btree ("club");
