-- Answers to the short questionnaire a club asks on the way in (Majma' al-Lughah first).
-- Idempotent so a re-run against a database that already has the column is harmless.
ALTER TABLE "minat_club" ADD COLUMN IF NOT EXISTS "jawaban" jsonb;
