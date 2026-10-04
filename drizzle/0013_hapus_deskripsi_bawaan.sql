-- The seeded one-line description was added with the programme list and never
-- approved. Cleared only where it is still exactly the seeded text, so anything the
-- committee has since written in /admin is left untouched.
UPDATE "acara" SET "deskripsi" = NULL
 WHERE "deskripsi" = 'A morning with Ustadz Muhammad Nuzul Dzikri hafizhahullah on how to make the most of your years at LIPIA.';
--> statement-breakpoint
UPDATE "acara" SET "deskripsi_ar" = NULL
 WHERE "deskripsi_ar" = 'صباح مع الأستاذ محمد نزول ذكري حفظه الله تعالى عن كيفية الاستفادة القصوى من سنوات الدراسة في المعهد.';
