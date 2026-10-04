ALTER TABLE "acara" ADD COLUMN "waitlist_masuk" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "acara_peserta" ADD COLUMN "dipromosikan_at" timestamp with time zone;