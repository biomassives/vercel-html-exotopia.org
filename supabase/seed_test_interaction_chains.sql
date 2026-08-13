-- ============================================================================
-- seed_test_interaction_chains.sql
--
-- DEV/TEST ONLY. NOT a migration. Depends on seed_test_accounts.sql (member
-- rows) and 018_member_participation_mode.sql (the youth-participant flag).
-- Run with: psql "$SUPABASE_DB_URL" -f supabase/seed_test_interaction_chains.sql
--
-- Unlike seed_test_accounts.sql (identities) or seed_test_settlement_profiles.sql
-- (isolated rows), this seeds RELATIONSHIPS between existing test members —
-- a completed mentor cycle (crossing the real certificate threshold, with a
-- youth mentee so the age-bracket safeguard from 018 has something real to
-- exercise), one still-pending mentor request (the other UI state), and a
-- method proposal that gets endorsed through the real reward trigger, not a
-- hand-inserted certificate. Everything below goes through the same
-- triggers a live user's actions would — this is "did it actually flow
-- through the ledger," not just rows that look right in a table view.
-- ============================================================================

BEGIN;

-- ── Participation modes ──────────────────────────────────────────────────
-- test_student_04 is the mentee in the completed cycle below — marking them
-- youth_participant means RewardsPage.vue's youth-acknowledgment gate has a
-- real case to show when reviewing that flow, not just an empty state.
INSERT INTO public.member_participation_mode (member_id, mode) VALUES
  ('11111111-1111-1111-1111-111111111107', 'youth_participant'),
  ('11111111-1111-1111-1111-111111111116', 'adult_individual')
ON CONFLICT (member_id) DO NOTHING;

-- ── Green-light connections (required before RewardsPage.vue will list
--    someone as a mentor/mentee target) ───────────────────────────────────
INSERT INTO public.connections (from_id, to_id, status, accepted_at) VALUES
  ('11111111-1111-1111-1111-111111111107', '11111111-1111-1111-1111-111111111116', 'accepted', now() - interval '40 days'),
  ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111102', 'accepted', now() - interval '10 days')
ON CONFLICT (from_id, to_id) DO NOTHING;

-- ── Completed mentor cycle — 4 confirmed sessions crosses
--    MENTOR_CYCLE_THRESHOLD (rewards-catalog.ts), so this actually issues
--    the mentorship certificate via mentor_session_reward() (002_rewards.sql),
--    not a hand-inserted one. trg_mentor_session_pair_cooldown (007) blocks
--    a second session with the same pair inside 7 real-time days, which a
--    backfilled multi-week history would always hit if left on — disabled
--    for just this block, superuser-only, dev seed only.
ALTER TABLE public.mentor_sessions DISABLE TRIGGER trg_mentor_session_pair_cooldown;

-- Insert-then-update (not a single INSERT with confirmed_at pre-set) is
-- deliberate: trg_mentor_session_reward only fires on UPDATE where
-- confirmed_at transitions from NULL, so a direct INSERT with everything
-- already confirmed would silently skip the reward/certificate trigger
-- entirely — exactly the "looks right in a table view but never touched the
-- ledger" trap this file's header says to avoid.
DO $$
DECLARE
  v_id uuid;
  v_topic text;
  v_days_ago int;
BEGIN
  FOR v_topic, v_days_ago IN
    SELECT * FROM unnest(
      ARRAY['water testing basics', 'reading a topo map', 'writing up field notes', 'presenting findings to the group'],
      ARRAY[35, 24, 13, 2]
    ) AS t(topic, days_ago)
  LOOP
    INSERT INTO public.mentor_sessions (mentor_id, mentee_id, topic, created_at)
    VALUES ('11111111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111107',
            v_topic, now() - (v_days_ago || ' days')::interval)
    RETURNING id INTO v_id;

    UPDATE public.mentor_sessions SET confirmed_mentor = true, confirmed_mentee = true WHERE id = v_id;
  END LOOP;
END $$;

ALTER TABLE public.mentor_sessions ENABLE TRIGGER trg_mentor_session_pair_cooldown;

-- ── One still-pending mentor request — the other UI state
--    (pendingMentorConfirmations in rewards.ts). No natural uniqueness to
--    key an ON CONFLICT off of (see mentor_sessions' schema) — this file is
--    meant to be run once against a fresh seed, like its siblings.
INSERT INTO public.mentor_sessions (mentor_id, mentee_id, topic)
VALUES ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111102', 'kelp forest survey technique');

-- ── Method proposal, endorsed through the real trigger ──────────────────
INSERT INTO public.method_proposals
  (id, author_id, title, summary, economic_argument, environmental_argument, status) VALUES
  ('33333333-3333-3333-3333-333333333001', '11111111-1111-1111-1111-111111111103',
   'Staged activated-carbon filtration for small-outpost PFAS reduction',
   'A two-stage GAC filtration approach sized for outposts under 200 residents, using
    commercially available cartridges rather than a custom treatment plant.',
   'Cartridge replacement runs roughly 1/8th the cost of a municipal-scale system at this population size.',
   'Reduces PFOA/PFOS below the community''s target threshold in bench testing; residual filter media
    requires certified disposal, flagged as an open question.',
   'proposed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.proposal_endorsements (proposal_id, member_id) VALUES
  ('33333333-3333-3333-3333-333333333001', '11111111-1111-1111-1111-111111111105')
ON CONFLICT (proposal_id, member_id) DO NOTHING;

-- ── Admin-granted reward — the manual-credit path from AdminPage.vue's
--    Grant Reward form (adminGrantReward in rewards.ts) ────────────────────
INSERT INTO public.reward_events (member_id, track, action_key, points, metadata, self_reported) VALUES
  ('11111111-1111-1111-1111-111111111103', 'educating_others', 'bounty_verified', 30,
   '{"note": "seed: verified contribution to the eco-ops docs bounty"}'::jsonb, false)
ON CONFLICT DO NOTHING;

COMMIT;
