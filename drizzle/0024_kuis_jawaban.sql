CREATE TABLE "kuis_jawaban" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pengguna_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"nomor" integer NOT NULL,
	"pilih" integer NOT NULL,
	"benar" boolean NOT NULL,
	"tepat_waktu" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acara" ALTER COLUMN "ots_buka" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "acara_counter" ALTER COLUMN "terakhir_ots" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "kuis_jawaban" ADD CONSTRAINT "kuis_jawaban_pengguna_id_pengguna_id_fk" FOREIGN KEY ("pengguna_id") REFERENCES "public"."pengguna"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "kuis_jawaban_unik" ON "kuis_jawaban" USING btree ("pengguna_id","slug","nomor");--> statement-breakpoint
CREATE INDEX "kuis_jawaban_slug_idx" ON "kuis_jawaban" USING btree ("slug");