-- Views of the lecture notes and the quiz were stored as the programme page, which
-- inflated the first step of the registration funnel. Reclassified by their path.
UPDATE "kunjungan" SET "halaman" = 'artikel' WHERE "halaman" = 'program' AND "path" ~ '^(/(en|ar))?/p/[^/]+/notes(/|$)';--> statement-breakpoint
UPDATE "kunjungan" SET "halaman" = 'kuis' WHERE "halaman" = 'program' AND "path" ~ '^(/(en|ar))?/p/[^/]+/quiz(/|$)';
