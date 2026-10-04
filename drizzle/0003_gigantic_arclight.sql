ALTER TABLE "acara" ALTER COLUMN "penyelenggara" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "acara" ALTER COLUMN "penyelenggara" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "acara" ADD COLUMN "peta_gambar_url" text;--> statement-breakpoint
ALTER TABLE "acara" ADD COLUMN "peta_embed_url" text;