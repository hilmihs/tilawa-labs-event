-- No more waiting list and no more held-back walk-in seats. Walk-ins register
-- themselves through /[lang]/p/[slug]/ots, get a place in their side's queue
-- (urut_ots) and wait for the committee's permit (izin_ots_at) before the QR shows.
-- Idempotent: every step checks what is already there.
ALTER TABLE "acara" ADD COLUMN IF NOT EXISTS "ots_buka" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "acara_counter" ADD COLUMN IF NOT EXISTS "terakhir_ots" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "acara_peserta" ADD COLUMN IF NOT EXISTS "urut_ots" integer;--> statement-breakpoint
ALTER TABLE "acara_peserta" ADD COLUMN IF NOT EXISTS "izin_ots_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'acara_peserta' AND column_name = 'antre_at') THEN
  -- Waiting-list rows become walk-ins awaiting a permit, numbered in the order they queued, per side.
  WITH w AS (
    SELECT id, row_number() OVER (PARTITION BY acara_id, gender ORDER BY coalesce(antre_at, created_at)) AS n
      FROM acara_peserta WHERE jenis = 'waitlist'
  )
  UPDATE acara_peserta p SET jenis = 'ots', urut_ots = w.n, updated_at = now() FROM w WHERE p.id = w.id;
  -- Walk-ins the old desk registered were seated on the spot: permitted, numbered after the queue.
  WITH d AS (
    SELECT p.id,
           (SELECT count(*) FROM acara_peserta q WHERE q.acara_id = p.acara_id AND q.gender = p.gender AND q.urut_ots IS NOT NULL)
             + row_number() OVER (PARTITION BY p.acara_id, p.gender ORDER BY p.created_at) AS n
      FROM acara_peserta p WHERE p.jenis = 'ots' AND p.urut_ots IS NULL
  )
  UPDATE acara_peserta p SET urut_ots = d.n, izin_ots_at = p.created_at, updated_at = now() FROM d WHERE p.id = d.id;
  UPDATE acara_counter c SET terakhir_ots = coalesce(
    (SELECT max(urut_ots) FROM acara_peserta p WHERE p.acara_id = c.acara_id AND p.gender = c.gender), 0);
 END IF;
END $$;--> statement-breakpoint
ALTER TABLE "acara" DROP COLUMN IF EXISTS "kuota_ots";--> statement-breakpoint
ALTER TABLE "acara" DROP COLUMN IF EXISTS "waitlist_masuk";--> statement-breakpoint
ALTER TABLE "acara_peserta" DROP COLUMN IF EXISTS "dipromosikan_at";--> statement-breakpoint
ALTER TABLE "acara_peserta" DROP COLUMN IF EXISTS "antre_at";--> statement-breakpoint
ALTER TABLE "acara_kehadiran" DROP COLUMN IF EXISTS "jalur";
