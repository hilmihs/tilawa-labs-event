ALTER TABLE "acara" ADD COLUMN "jenis" text DEFAULT 'acara' NOT NULL;--> statement-breakpoint
ALTER TABLE "acara" ADD COLUMN "pakai_tiket" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "acara" ADD COLUMN "deskripsi" text;--> statement-breakpoint
ALTER TABLE "acara" ADD COLUMN "deskripsi_ar" text;--> statement-breakpoint
ALTER TABLE "acara" ADD COLUMN "poster_url" text;--> statement-breakpoint
ALTER TABLE "acara" ADD COLUMN "tampil" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "acara" ADD COLUMN "urutan" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "acara" SET "tampil" = true WHERE "status" IN ('pendaftaran', 'ditutup', 'berlangsung');