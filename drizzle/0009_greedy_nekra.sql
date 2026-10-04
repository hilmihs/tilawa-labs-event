CREATE TABLE "otp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pengguna_id" uuid NOT NULL,
	"jenis" text NOT NULL,
	"kode_hash" text NOT NULL,
	"kadaluarsa_at" timestamp with time zone NOT NULL,
	"dipakai_at" timestamp with time zone,
	"percobaan" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengguna" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wa" text NOT NULL,
	"email" text NOT NULL,
	"email_terverifikasi_at" timestamp with time zone,
	"password_hash" text NOT NULL,
	"sesi_versi" integer DEFAULT 1 NOT NULL,
	"nama" text NOT NULL,
	"gender" text NOT NULL,
	"status_lipia" text,
	"prodi" text,
	"sesi" text,
	"semester" text,
	"tahun_lulus" text,
	"domisili" text,
	"asal_daerah" text,
	"asal_sekolah" text,
	"minat" text,
	"kebutuhan_khusus" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acara_akses" ADD COLUMN IF NOT EXISTS "wa_hash" text;--> statement-breakpoint
ALTER TABLE "otp" ADD CONSTRAINT "otp_pengguna_id_pengguna_id_fk" FOREIGN KEY ("pengguna_id") REFERENCES "public"."pengguna"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "otp_pengguna_idx" ON "otp" USING btree ("pengguna_id","jenis","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pengguna_wa_unik" ON "pengguna" USING btree ("wa");--> statement-breakpoint
CREATE UNIQUE INDEX "pengguna_email_unik" ON "pengguna" USING btree ("email");--> statement-breakpoint
CREATE INDEX "akses_wa_idx" ON "acara_akses" USING btree ("wa_hash","jenis","created_at");