-- The speaker line carried the honorific as one transliterated word, which reads as
-- part of the name. It is now set off from the name: dashes in Arabic, brackets in
-- English. Only rows still holding exactly the seeded text are touched, so a name
-- the committee edited in /admin is left alone.
UPDATE "acara" SET "pemateri" = 'Ustadz Muhammad Nuzul Dzikri (may Allah preserve him)'
 WHERE "pemateri" = 'Ustadz Muhammad Nuzul Dzikri hafizhahullah';
--> statement-breakpoint
UPDATE "acara" SET "pemateri_ar" = 'الأستاذ محمد نزول ذكري – حفظه الله تعالى –'
 WHERE "pemateri_ar" = 'الأستاذ محمد نزول ذكري حفظه الله تعالى';
