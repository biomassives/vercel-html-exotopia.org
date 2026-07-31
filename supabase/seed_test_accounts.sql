-- ============================================================================
-- seed_test_accounts.sql
--
-- DEV/TEST ONLY. NOT a migration — do not put this in supabase/migrations/ and
-- do not run it against a production project. It creates fake Supabase Auth
-- users directly in auth.users (bypassing the normal sign-up flow) so that
-- public.members and public.community_nodes rows can reference them, since
-- members.id is a hard foreign key to auth.users(id).
--
-- Run with: psql "$SUPABASE_DB_URL" -f supabase/seed_test_accounts.sql
-- (or paste into the Supabase SQL Editor on a scratch/dev project only).
--
-- These accounts have no real password and cannot sign in through the normal
-- magic-link flow — they exist only so their nodes show up as real, owned
-- rows. To actually browse /my-listings AS one of these owners (rather than
-- just viewing their published nodes as any visitor would), you'd need a
-- real account of your own instead — see the note at the bottom for granting
-- your own account admin access, which is the more useful thing to test with.
--
-- Fixed UUIDs (not gen_random_uuid()) so re-running this script is a no-op
-- via ON CONFLICT DO NOTHING rather than creating duplicates.
-- ============================================================================

BEGIN;

-- ── Fake auth users ──────────────────────────────────────────────────────────
-- Minimal columns Supabase's auth service expects populated; emails are on an
-- obviously-fake, non-deliverable domain on purpose.

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111101', 'authenticated', 'authenticated',
   'test-maria@seed.exotopia.invalid', '', now(), now(), now(), '{}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111102', 'authenticated', 'authenticated',
   'test-oskar@seed.exotopia.invalid', '', now(), now(), now(), '{}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111103', 'authenticated', 'authenticated',
   'test-lena@seed.exotopia.invalid',  '', now(), now(), now(), '{}', '{}')
ON CONFLICT (id) DO NOTHING;

-- ── Matching member profiles ─────────────────────────────────────────────────

INSERT INTO public.members (id, handle, display_name, avatar_color, bio) VALUES
  ('11111111-1111-1111-1111-111111111101', 'test_maria', 'Maria (test)', '#44bb44', 'Seed test account — woven-goods cooperative'),
  ('11111111-1111-1111-1111-111111111102', 'test_oskar', 'Oskar (test)', '#00ddff', 'Seed test account — repair shop location'),
  ('11111111-1111-1111-1111-111111111103', 'test_lena',  'Lena (test)',  '#ff6688', 'Seed test account — musician / creative page')
ON CONFLICT (id) DO NOTHING;

-- ── Community nodes across all three types, three hostnames, mixed status ───
-- Hostnames are real entries in public/exoplanets-viz.json, so these are
-- reachable at real URLs:
--   /galaxy?focusHost=Kepler-442        (Maria's listing's gallery)
--   /galaxy?focusHost=TRAPPIST-1        (Oskar's location's gallery)
--   /galaxy?focusHost=Proxima%20Cen     (Lena's creative page's gallery — draft, won't show)
--   /surface/Kepler-442/Kepler-442%20b  (surface-view gallery for the same node)

INSERT INTO public.community_nodes
  (id, owner_id, node_type, title, description, hostname, metadata, ownership_model, access_level, status)
VALUES
  ('22222222-2222-2222-2222-222222222201',
   '11111111-1111-1111-1111-111111111101',
   'business_listing', 'Aurora Basin Weavers',
   'Handwoven baskets and textiles from the Aurora Basin cooperative.',
   'Kepler-442',
   '{"items": ["woven baskets", "textiles", "dyed cord"], "contact": "test-maria@seed.exotopia.invalid"}',
   'cooperative', 'public', 'published'),

  ('22222222-2222-2222-2222-222222222202',
   '11111111-1111-1111-1111-111111111102',
   'business_location', 'Oskar''s Repair Bay',
   'Equipment repair, open six days a week.',
   'TRAPPIST-1',
   '{"address": "Dock 7, TRAPPIST-1 e", "hours": "Mon-Sat 8am-6pm"}',
   'solo', 'public', 'published'),

  ('22222222-2222-2222-2222-222222222203',
   '11111111-1111-1111-1111-111111111103',
   'creative_page', 'Lena — Field Recordings',
   'Ambient recordings and generative pieces. Still drafting the page copy.',
   'Proxima Cen',
   '{"ponInkUrl": "https://pon.ink/lena", "mediaLinks": ["https://pon.ink/lena/track-1"]}',
   'solo', 'public', 'draft'),

  ('22222222-2222-2222-2222-222222222204',
   '11111111-1111-1111-1111-111111111101',
   'business_listing', 'Old Basin Pottery (discontinued)',
   'Kept as a seeded example of an archived listing for the admin moderation view.',
   'Kepler-442',
   '{"items": ["pottery"], "contact": "n/a"}',
   'solo', 'public', 'archived')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================================
-- To test the ADMIN moderation view (/admin/community-nodes) as YOURSELF
-- rather than as a fake seed account — sign in with your real account once
-- first (so a row exists in public.members for you), find your member id:
--
--   SELECT id, handle FROM public.members ORDER BY created_at DESC LIMIT 5;
--
-- then run (this is the same pattern migration 002 already documents):
--
--   INSERT INTO public.admin_members (member_id) VALUES ('<your-member-id>');
-- ============================================================================
