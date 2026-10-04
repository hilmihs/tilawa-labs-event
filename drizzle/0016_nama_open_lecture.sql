-- The programme was renamed to "Open Lecture" / "لقاء مفتوح", but only the programme
-- page had the new name written into it; the row still said "Student Lecture" /
-- "لقاء طلابي", so the account page, the ticket, the WhatsApp copy of the ticket and
-- the staff screens kept the old name. Changed only where the row still holds exactly
-- the old text, so a name the committee has since set in /admin is left alone.
UPDATE "acara" SET "nama" = 'Open Lecture' WHERE "nama" = 'Student Lecture';
--> statement-breakpoint
UPDATE "acara" SET "nama_ar" = 'لقاء مفتوح' WHERE "nama_ar" = 'لقاء طلابي';
