-- ============================================================================
-- seed_test_ecology_activity.sql
--
-- DEV/TEST ONLY — same rules as seed_test_accounts.sql. Depends on, and must
-- run after, BOTH prior seed files plus migration 009:
--
--   psql "$SUPABASE_DB_URL" -f supabase/seed_test_accounts.sql
--   psql "$SUPABASE_DB_URL" -f supabase/seed_test_activity.sql
--   psql "$SUPABASE_DB_URL" -f supabase/seed_test_ecology_activity.sql
--
-- Gives the interface-testing cohort real ecology_sites/ecology_projects/
-- ecology_log_entries activity (009_ecology_biodiversity.sql), exercising
-- the access_status pipeline (map research -> letter of inquiry -> access
-- confirmed) at different stages so the cohort remains a useful, visible
-- reference for group-formation and educational-use patterns across BOTH
-- citizen-science tracks, not just PFAS.
--
-- Fixed UUIDs (ON CONFLICT DO NOTHING on each table's natural uniqueness),
-- new prefixes not used by seed_test_activity.sql, so both files can be
-- re-run independently without collision or duplication.
-- ============================================================================

BEGIN;

-- ============================================================================
-- Ecology sites — four, deliberately spanning different access_status
-- states so the pipeline itself is visible in the seeded data, not just the
-- end state.
-- ============================================================================

INSERT INTO public.ecology_sites
  (id, created_by, name, description, habitat_type, base_address, is_simulated, access_status, contact_note, created_at)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000001', '11111111-1111-1111-1111-111111111117',
   'Riverside Schoolyard Pollinator Corridor',
   'Native-plant pollinator strip along the schoolyard fence line, tied to the TRAPPIST-1 e class group.',
   'schoolyard', 'TRAPPIST-1', true, 'access_confirmed',
   'Facilities director approved after a one-page project description and faculty sponsor (teacher_02).',
   now() - interval '18 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000002', '11111111-1111-1111-1111-111111111116',
   'Sunny Ridge Community Garden Forest Guild',
   'Proposed food-forest guild plot within an existing community garden.',
   'community garden', 'Kepler-442', true, 'inquiry_sent',
   'Letter of inquiry sent to the garden committee — awaiting response.',
   now() - interval '9 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000003', '11111111-1111-1111-1111-111111111119',
   'Lakeside Greenway Bird Blind',
   'Acopian-style bird blind along the public greenway, under the parks department''s standing volunteer permit.',
   'greenway/park', 'TOI-700', true, 'not_required',
   'Public right-of-way, covered by the organizing group''s standing parks-department volunteer permit — no separate inquiry needed.',
   now() - interval '13 days'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-000000000004', '11111111-1111-1111-1111-111111111112',
   'Backyard Rain Garden Pilot',
   'Independent student-proposed rain garden on a private lot — still in the map-research stage.',
   'urban lot', 'K2-18', true, 'unresearched', NULL,
   now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Ecology projects — only at the two sites with confirmed/not-required
-- access, matching the real-world rule this pipeline exists to enforce:
-- fieldwork follows access, not the other way around.
-- ============================================================================

INSERT INTO public.ecology_projects (id, site_id, owner_id, title, project_type, status, created_at) VALUES
  ('dddddddd-dddd-dddd-dddd-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', '11111111-1111-1111-1111-111111111117',
   'Pollinator Corridor Biodiversity Survey', 'biodiversity_survey', 'active', now() - interval '16 days'),
  ('dddddddd-dddd-dddd-dddd-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000003', '11111111-1111-1111-1111-111111111119',
   'Lakeside Bird Blind Installation', 'bird_blind', 'active', now() - interval '12 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Log entries — two students per project, two entries each, mirroring
-- seed_test_activity.sql's PFAS log-entry pattern (1/day, well under
-- ecology_field_log's daily_cap of 2).
-- ============================================================================

INSERT INTO public.ecology_log_entries (id, project_id, author_id, notes, metrics, logged_at) VALUES
  ('eeeeeeee-eeee-eeee-eeee-000000000001', 'dddddddd-dddd-dddd-dddd-000000000001', '11111111-1111-1111-1111-111111111107', 'Baseline pollinator count along the fence line.',        '{"species_count": 4, "individuals": 22}'::jsonb, now() - interval '15 days'),
  ('eeeeeeee-eeee-eeee-eeee-000000000002', 'dddddddd-dddd-dddd-dddd-000000000001', '11111111-1111-1111-1111-111111111107', 'Follow-up count after the first native-plant bed matured.', '{"species_count": 7, "individuals": 41}'::jsonb, now() - interval '8 days'),
  ('eeeeeeee-eeee-eeee-eeee-000000000003', 'dddddddd-dddd-dddd-dddd-000000000001', '11111111-1111-1111-1111-111111111108', 'Photo-documented three new bee species not seen at baseline.', '{"new_species": 3}'::jsonb, now() - interval '14 days'),
  ('eeeeeeee-eeee-eeee-eeee-000000000004', 'dddddddd-dddd-dddd-dddd-000000000001', '11111111-1111-1111-1111-111111111108', 'Second photo-documentation pass, same transect.',           '{"new_species": 1}'::jsonb, now() - interval '7 days'),

  ('eeeeeeee-eeee-eeee-eeee-000000000005', 'dddddddd-dddd-dddd-dddd-000000000002', '11111111-1111-1111-1111-111111111114', 'Blind frame assembled, sited per the strike-risk assessment.', '{"stage": "frame assembled"}'::jsonb, now() - interval '11 days'),
  ('eeeeeeee-eeee-eeee-eeee-000000000006', 'dddddddd-dddd-dddd-dddd-000000000002', '11111111-1111-1111-1111-111111111114', 'First observation session — 5 species logged.',              '{"species_logged": 5}'::jsonb, now() - interval '4 days'),
  ('eeeeeeee-eeee-eeee-eeee-000000000007', 'dddddddd-dddd-dddd-dddd-000000000002', '11111111-1111-1111-1111-111111111115', 'Weatherproofing pass before the observation season starts.', '{"stage": "weatherproofed"}'::jsonb, now() - interval '10 days'),
  ('eeeeeeee-eeee-eeee-eeee-000000000008', 'dddddddd-dddd-dddd-dddd-000000000002', '11111111-1111-1111-1111-111111111115', 'Second observation session — 3 species logged, including one new to the site list.', '{"species_logged": 3}'::jsonb, now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Matching reward_events — ecology_field_log is self-reportable (6 pts,
-- daily_cap 2 per points_catalog), same pattern as decon_progress_log in
-- seed_test_activity.sql. Fresh id prefix so this file never collides with
-- that one's reward_events rows regardless of run order.
-- ============================================================================

INSERT INTO public.reward_events (id, member_id, track, action_key, points, metadata, self_reported, created_at) VALUES
  ('ffffffff-ffff-ffff-ffff-000000000001', '11111111-1111-1111-1111-111111111107', 'volunteering', 'ecology_field_log', 6, '{"log_id": "eeeeeeee-eeee-eeee-eeee-000000000001"}'::jsonb, true, now() - interval '15 days'),
  ('ffffffff-ffff-ffff-ffff-000000000002', '11111111-1111-1111-1111-111111111107', 'volunteering', 'ecology_field_log', 6, '{"log_id": "eeeeeeee-eeee-eeee-eeee-000000000002"}'::jsonb, true, now() - interval '8 days'),
  ('ffffffff-ffff-ffff-ffff-000000000003', '11111111-1111-1111-1111-111111111108', 'volunteering', 'ecology_field_log', 6, '{"log_id": "eeeeeeee-eeee-eeee-eeee-000000000003"}'::jsonb, true, now() - interval '14 days'),
  ('ffffffff-ffff-ffff-ffff-000000000004', '11111111-1111-1111-1111-111111111108', 'volunteering', 'ecology_field_log', 6, '{"log_id": "eeeeeeee-eeee-eeee-eeee-000000000004"}'::jsonb, true, now() - interval '7 days'),
  ('ffffffff-ffff-ffff-ffff-000000000005', '11111111-1111-1111-1111-111111111114', 'volunteering', 'ecology_field_log', 6, '{"log_id": "eeeeeeee-eeee-eeee-eeee-000000000005"}'::jsonb, true, now() - interval '11 days'),
  ('ffffffff-ffff-ffff-ffff-000000000006', '11111111-1111-1111-1111-111111111114', 'volunteering', 'ecology_field_log', 6, '{"log_id": "eeeeeeee-eeee-eeee-eeee-000000000006"}'::jsonb, true, now() - interval '4 days'),
  ('ffffffff-ffff-ffff-ffff-000000000007', '11111111-1111-1111-1111-111111111115', 'volunteering', 'ecology_field_log', 6, '{"log_id": "eeeeeeee-eeee-eeee-eeee-000000000007"}'::jsonb, true, now() - interval '10 days'),
  ('ffffffff-ffff-ffff-ffff-000000000008', '11111111-1111-1111-1111-111111111115', 'volunteering', 'ecology_field_log', 6, '{"log_id": "eeeeeeee-eeee-eeee-eeee-000000000008"}'::jsonb, true, now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Certificates don't need a refresh_certificates() pass here — no
-- ecology-specific certificate exists yet (see SPEC_ECOLOGY_ADJACENT_DOMES.md
-- §4/Q3), and these points do count toward the generic field_volunteer
-- threshold via the existing volunteering-track SUM, so re-running
-- seed_test_activity.sql's refresh_certificates() pass after this file
-- would still pick these up correctly if a member crosses that threshold.
