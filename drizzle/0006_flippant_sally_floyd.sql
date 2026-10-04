ALTER TABLE "acara" ADD COLUMN "kuota_ikhwan" integer;--> statement-breakpoint
ALTER TABLE "acara" ADD COLUMN "kuota_akhwat" integer;--> statement-breakpoint
ALTER TABLE "acara_peserta" ADD COLUMN "lipia" boolean DEFAULT true NOT NULL;