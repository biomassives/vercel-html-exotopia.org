-- ============================================================================
-- seed_test_settlement_profiles.sql
--
-- DEV/TEST ONLY. NOT a migration — do not put this in supabase/migrations/ and
-- do not run it against a production project. Populates public.settlement_
-- profiles (migration 012) for reviewing AdminSettlementProfilesPage.vue
-- against something closer to real conditions than an empty table.
--
-- Depends on seed_test_accounts.sql having been run first (references its
-- fixed test member UUIDs as owner_id). Run with:
--   psql "$SUPABASE_DB_URL" -f supabase/seed_test_settlement_profiles.sql
--
-- Deliberately includes two "near-duplicate" pairs (same focus/tech/wording,
-- different owner, close-together timestamps — the copy-paste-spam shape)
-- to exercise settlement-profile-similarity.ts's duplicate hint, plus one
-- pair where one half is already archived and the other is still live and
-- newer — the exact "admin caught one, missed the follow-up" case the
-- duplicate badge exists for.
-- ============================================================================

BEGIN;

INSERT INTO public.settlement_profiles
  (id, owner_id, exolocation, display_name, focus, description, technology_keys, status, created_at) VALUES

  -- Duplicate pair #1 — same content, different owner, 18 days apart
  ('22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111101', 'surface:Kepler-442b', 'Kelp Forest Waystation', 'eco',
   'Coastal restoration base focused on kelp forest regrowth and PFAS remediation research.',
   ARRAY['solar-array','water-purifier','greenhouse-dome'], 'published', now() - interval '20 days'),
  ('22222222-2222-2222-2222-222222222002', '11111111-1111-1111-1111-111111111102', 'surface:Kepler-442b', 'Kelp Forest Way Station', 'eco',
   'Coastal restoration base focused on kelp forest regrowth and PFAS remediation research.',
   ARRAY['solar-array','water-purifier','greenhouse-dome'], 'published', now() - interval '2 days'),

  -- Duplicate pair #2 — same content, different owner, 44 days apart
  ('22222222-2222-2222-2222-222222222003', '11111111-1111-1111-1111-111111111103', 'moon:Kepler-442b:1', 'Silverleaf Learning Commons', 'learning',
   'Open curriculum exchange and mentor-matching hub for the Kepler cluster.',
   ARRAY['holo-classroom','archive-node'], 'published', now() - interval '45 days'),
  ('22222222-2222-2222-2222-222222222004', '11111111-1111-1111-1111-111111111104', 'moon:Kepler-442b:1', 'Silverleaf Learning Hall', 'learning',
   'Open curriculum exchange and mentor-matching hub for the Kepler cluster.',
   ARRAY['holo-classroom','archive-node'], 'published', now() - interval '1 day'),

  -- Ordinary distinct profiles, one per remaining focus
  ('22222222-2222-2222-2222-222222222005', '11111111-1111-1111-1111-111111111105', 'surface:TRAPPIST-1e', 'Founders'' Athenaeum', 'library',
   'Community-run print/archive library, open stacks.',
   ARRAY['archive-node','print-forge'], 'published', now() - interval '60 days'),
  ('22222222-2222-2222-2222-222222222006', '11111111-1111-1111-1111-111111111106', 'surface:TRAPPIST-1e', 'Blue Reservoir WATSAN Post', 'watsan',
   'Watershed monitoring and potable water distribution for the eastern basin.',
   ARRAY['water-purifier','pump-array'], 'published', now() - interval '10 days'),
  ('22222222-2222-2222-2222-222222222007', '11111111-1111-1111-1111-111111111107', 'surface:Proxima Cen b', 'Terraced Foodways Co-op', 'food',
   'Vertical terrace farming co-op, seed bank exchange.',
   ARRAY['greenhouse-dome','aquaponics-rig'], 'published', now() - interval '5 days'),
  ('22222222-2222-2222-2222-222222222008', '11111111-1111-1111-1111-111111111108', 'cluster:virgo:proc-0100', 'Wayfarer Health Outpost', 'health',
   'Field clinic and telemedicine relay.',
   ARRAY['med-bay','diagnostics-array'], 'published', now() - interval '3 days'),
  ('22222222-2222-2222-2222-222222222009', '11111111-1111-1111-1111-111111111116', 'orbital:kepler-442-station', 'Circle of Stewards', 'leadership',
   'Rotating-council governance experiment, open minutes.',
   ARRAY['council-hall'], 'published', now() - interval '90 days'),
  ('22222222-2222-2222-2222-222222222010', '11111111-1111-1111-1111-111111111117', 'bh-orbital:sagA-relay', 'Vanguard Command Relay', 'command',
   'Coordination hub for cluster-wide eco-ops scheduling.',
   ARRAY['comms-array','beacon'], 'published', now() - interval '15 days'),
  ('22222222-2222-2222-2222-222222222011', '11111111-1111-1111-1111-111111111122', 'surface:Proxima Cen b', 'Latticework Waystation', 'eco',
   'Data-logging outpost pairing E8 lattice visualization research with local eco monitoring.',
   ARRAY['solar-array','sensor-mesh'], 'published', now() - interval '1 day'),

  -- Abuse pair — first already archived (a prior admin takedown), second is
  -- a fresh near-duplicate that hasn't been caught yet.
  ('22222222-2222-2222-2222-222222222012', '11111111-1111-1111-1111-111111111118', 'surface:Kepler-442b', 'Spam Deals Now Click Here', 'command',
   'BUY CHEAP CREDITS FAST -- link in bio', ARRAY[]::text[], 'archived', now() - interval '7 days'),
  ('22222222-2222-2222-2222-222222222013', '11111111-1111-1111-1111-111111111119', 'surface:Kepler-442b', 'Second Spam Deals Now', 'command',
   'BUY CHEAP CREDITS FAST -- link in bio', ARRAY[]::text[], 'published', now() - interval '6 hours'),

  -- Self-archived, legitimate (owner toggled it off themselves — nothing
  -- wrong with it, just here so the table shows both archive reasons)
  ('22222222-2222-2222-2222-222222222014', '11111111-1111-1111-1111-111111111109', 'moon:TRAPPIST-1e:2', 'Riverside Apiary Garden', 'food',
   'Pollinator corridor demonstration plot.', ARRAY['greenhouse-dome'], 'archived', now() - interval '30 days')

ON CONFLICT (id) DO NOTHING;

COMMIT;
