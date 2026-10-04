-- The English honorific now reads "may Allah protect him". Only the row still holding
-- exactly the previous seeded text is changed, so a speaker line the committee edited
-- in /admin is left alone.
UPDATE "acara" SET "pemateri" = 'Ustadz Muhammad Nuzul Dzikri (may Allah protect him)'
 WHERE "pemateri" = 'Ustadz Muhammad Nuzul Dzikri (may Allah preserve him)';
