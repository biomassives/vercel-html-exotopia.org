-- ============================================================================
-- seed_test_video_suggestions.sql
--
-- DEV/TEST ONLY — same rules as the other seed_test_*.sql files. Depends on
-- migration 010_video_suggestions.sql and seed_test_accounts.sql.
--
--   psql "$SUPABASE_DB_URL" -f supabase/seed_test_video_suggestions.sql
--
-- Gives the interface-testing cohort real activity in the video-suggestion
-- moderation queue (EcoLibrary.vue's "Suggest a video" / admin "Suggestions"
-- review panel) — one approved (shows the community badge + merge live),
-- one pending (shows the admin queue with something real to review), one
-- rejected (shows that terminal state exists too).
-- ============================================================================

BEGIN;

INSERT INTO public.video_suggestions
  (id, submitted_by, area, subcat_id, youtube_id, title, note, status, created_at, reviewed_at, reviewed_by)
VALUES
  ('12121212-1212-1212-1212-000000000001', '11111111-1111-1111-1111-111111111104',
   'Decontamination', 'decon-0', 'j8UkxcMTkiI',
   'GAC Filter Media Change-Out — Field Walkthrough',
   'Found this while researching our Aurora Basin pilot — shows the actual change-out procedure our project log entries describe.',
   'approved', now() - interval '12 days', now() - interval '10 days', '11111111-1111-1111-1111-111111111120'),

  ('12121212-1212-1212-1212-000000000002', '11111111-1111-1111-1111-111111111110',
   'Ecology & Biodiversity', 'eco-0', 'kxopqvYE0Rw',
   'Point-Count Method for Volunteer Bird Surveys',
   'Good fit for the Biodiversity Monitoring section — matches the count method we used for the pollinator corridor survey.',
   'pending', now() - interval '4 days', NULL, NULL),

  ('12121212-1212-1212-1212-000000000003', '11111111-1111-1111-1111-111111111108',
   'Decontamination', 'decon-1', 'ScMzIvxBSi4',
   'Heavy Metal Soil Testing — Home Kit Review',
   'Wanted to flag this but on review it''s a product review, not a methodology walkthrough.',
   'rejected', now() - interval '9 days', now() - interval '7 days', '11111111-1111-1111-1111-111111111121')
ON CONFLICT (id) DO NOTHING;

COMMIT;
