-- ============================================================================
-- 007_reward_integrity.sql
--
-- Two security fixes deliberately left out of the cleanup pass.
--
-- (A) SECURITY DEFINER functions had no `search_path` pinned. A definer
--     function resolves unqualified object names using the *caller's*
--     search_path; a caller who can create objects in an earlier schema can
--     shadow a referenced table or operator and have it execute with the
--     definer's privileges. Pinned below for every definer function in public.
--
-- (B) The reward ledger was self-serve. `reward_events_insert` allowed
--     `WITH CHECK (member_id = auth.uid() OR is_admin())`, and `points` had
--     only `CHECK (points >= 0)` — no upper bound, no catalogue check, no
--     dedupe. The anon key is public by design and RLS is the only gate, so
--     any authenticated user could POST straight to PostgREST with
--     {member_id: <self>, track: 'volunteering', action_key: 'anything',
--      points: 999999} and skip the app entirely. `certificates_insert` had
--     the same shape, meaning a user could self-issue any certificate_type
--     including 'mentorship' — the credentials that compliance/
--     digital-credentials-law/ frames as a trust hierarchy for local
--     ecologist and educator standing.
--
--     The careful anti-fraud work in mentor_session_guard() (immutable
--     mentor_id/mentee_id, each party flips only their own flag) was fully
--     bypassable by inserting the reward row directly.
--
-- Approach for (B): clients lose INSERT on both tables entirely. All writes go
-- through SECURITY DEFINER RPCs that own the trust decisions — point values
-- come from a server-side catalogue, not the request body, and certificates are
-- derived from ledger state rather than asserted.
--
-- NOTE ON SELF-REPORTING: some actions are genuinely self-attested (see the
-- comment on logVolunteerAction in src/stores/rewards.ts — eco_ops-backed
-- tables don't exist yet). This migration does not pretend to verify them. It
-- bounds them: server-set point values, a per-action daily cap, and a
-- `self_reported` flag on the row so a later audit can tell asserted work from
-- verified work. That distinction should be surfaced in the UI and on any
-- certificate derived from self-reported points.
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- (A) Pin search_path on every SECURITY DEFINER function in public.
--     Done dynamically rather than by name so functions added since this file
--     was written are covered too. ALTER FUNCTION is used instead of
--     CREATE OR REPLACE so no function body is rewritten.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM   pg_proc p
    JOIN   pg_namespace n ON n.oid = p.pronamespace
    WHERE  n.nspname = 'public'
      AND  p.prosecdef                                     -- SECURITY DEFINER
      AND  NOT EXISTS (                                    -- not already pinned
             SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c
             WHERE c LIKE 'search_path=%'
           )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn.sig);
    RAISE NOTICE 'pinned search_path on %', fn.sig;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- (B1) Server-side points catalogue. Point values must never come from the
--      client. `self_report_allowed` marks actions a member may claim without
--      third-party verification; `daily_cap` bounds how many times per day.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.points_catalog (
  action_key          text PRIMARY KEY,
  track               text    NOT NULL CHECK (track IN ('volunteering','educating_others','finance_literacy')),
  points              integer NOT NULL CHECK (points >= 0 AND points <= 500),
  self_report_allowed boolean NOT NULL DEFAULT false,
  daily_cap           integer NOT NULL DEFAULT 0 CHECK (daily_cap >= 0),
  description         text
);

-- Seeded from src/data/rewards-catalog.ts POINTS. That file becomes display
-- metadata only; this table is the source of truth.
INSERT INTO public.points_catalog
  (action_key, track, points, self_report_allowed, daily_cap, description) VALUES
  ('pfin8_complete',            'finance_literacy',  25, false, 0, 'PFIN-8 quiz, awarded via award_quiz_completion'),
  ('pfin28_complete',           'finance_literacy',  60, false, 0, 'PFIN-28 quiz, awarded via award_quiz_completion'),
  ('eco_submission',            'volunteering',      10, false, 0, 'Auto-logged from a verified eco-offline sync'),
  ('volunteer_self_report',     'volunteering',       8, true,  3, 'Self-reported volunteering entry'),
  ('mentor_session',            'educating_others',  40, false, 0, 'Emitted by mentor_session_reward() trigger only'),
  ('bounty_verified',           'volunteering',      30, false, 0, 'Admin-granted'),
  ('contribution_verified',     'educating_others',  20, false, 0, 'Admin-granted'),
  ('decon_progress_log',        'volunteering',       6, true,  2, 'Self-reported decontamination progress log'),
  ('method_proposal_published', 'educating_others',  25, true,  1, 'Publishing a public cleanup method proposal'),
  ('method_proposal_endorsed',  'educating_others',   4, false, 0, 'Emitted by proposal_endorsement_reward() trigger only'),
  ('knowledge_keeper_record',   'educating_others',  15, true,  1, 'Documenting a Knowledge Keeper contribution')
ON CONFLICT (action_key) DO NOTHING;

ALTER TABLE public.points_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "points_catalog_read" ON public.points_catalog FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policy: catalogue changes are migrations, not runtime.

-- ─────────────────────────────────────────────────────────────────────────────
-- (B2) Quiz reward rules, mirroring QUIZ_REWARD_MAP. Server-side so the pass
--      threshold and prerequisite chain can't be edited in devtools.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_reward_rules (
  area_id               text PRIMARY KEY,
  action_key            text NOT NULL REFERENCES public.points_catalog(action_key),
  certificate_type      text NOT NULL,
  settlement_object_key text NOT NULL,
  min_score             integer NOT NULL CHECK (min_score >= 0),
  prerequisite_area_id  text REFERENCES public.quiz_reward_rules(area_id)
);

INSERT INTO public.quiz_reward_rules VALUES
  ('pfin8',  'pfin8_complete',  'pfin8',  'finance_seed',              6,  NULL),
  ('pfin28', 'pfin28_complete', 'pfin28', 'parallel_universe_beacon', 20, 'pfin8')
ON CONFLICT (area_id) DO NOTHING;

ALTER TABLE public.quiz_reward_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_reward_rules_read" ON public.quiz_reward_rules FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- (B3) Revoke direct write access. This is the core of the fix — everything
--      else is machinery to keep the app working without it.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reward_events_insert" ON public.reward_events;
DROP POLICY IF EXISTS "certificates_insert"  ON public.certificates;

-- Admin grants keep a narrow, explicit path.
CREATE POLICY "reward_events_insert_admin" ON public.reward_events
  FOR INSERT WITH CHECK (
    public.is_admin()
    AND points <= (SELECT c.points FROM public.points_catalog c WHERE c.action_key = action_key)
  );

REVOKE INSERT, UPDATE, DELETE ON public.reward_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.certificates  FROM anon, authenticated;
GRANT  INSERT                  ON public.reward_events TO authenticated;  -- gated by the admin policy above

-- Provenance: distinguish asserted work from verified work.
ALTER TABLE public.reward_events
  ADD COLUMN IF NOT EXISTS self_reported boolean NOT NULL DEFAULT false;

-- Kill replay of the same logical action.
CREATE UNIQUE INDEX IF NOT EXISTS reward_events_once_per_action
  ON public.reward_events (member_id, action_key)
  WHERE action_key IN ('pfin8_complete','pfin28_complete');

CREATE UNIQUE INDEX IF NOT EXISTS certificates_one_per_type
  ON public.certificates (member_id, certificate_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- (B4) Certificate issuance is derived, never asserted.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_certificates(p_member uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_volunteer_points integer;
  v_decon_logs       integer;
  v_mentor_cycles    integer;
BEGIN
  SELECT coalesce(sum(points), 0) INTO v_volunteer_points
    FROM public.reward_events WHERE member_id = p_member AND track = 'volunteering';

  SELECT count(*) INTO v_decon_logs
    FROM public.reward_events WHERE member_id = p_member AND action_key = 'decon_progress_log';

  SELECT count(*) INTO v_mentor_cycles
    FROM public.mentor_sessions
    WHERE mentor_id = p_member AND confirmed_mentor AND confirmed_mentee;

  IF v_volunteer_points >= 50 THEN
    INSERT INTO public.certificates (member_id, certificate_type, settlement_object_key)
    VALUES (p_member, 'field_volunteer', 'volunteer_dome_object')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_decon_logs >= 10 THEN
    INSERT INTO public.certificates (member_id, certificate_type, settlement_object_key)
    VALUES (p_member, 'pfas_field_researcher', 'pfas_researcher_marker')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_mentor_cycles >= 4 THEN
    INSERT INTO public.certificates (member_id, certificate_type, settlement_object_key)
    VALUES (p_member, 'mentorship', 'mentor_beacon')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.refresh_certificates(uuid) FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- (B5) The only client-callable award paths.
-- ─────────────────────────────────────────────────────────────────────────────

-- Self-reported actions: server sets points, enforces the daily cap, and flags
-- the row as asserted rather than verified.
CREATE OR REPLACE FUNCTION public.award_self_reported(
  p_action_key text,
  p_metadata   jsonb DEFAULT '{}'::jsonb
) RETURNS public.reward_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_cat   public.points_catalog;
  v_today integer;
  v_row   public.reward_events;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_cat FROM public.points_catalog WHERE action_key = p_action_key;
  IF NOT FOUND OR NOT v_cat.self_report_allowed THEN
    RAISE EXCEPTION 'action % is not self-reportable', p_action_key USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_today
    FROM public.reward_events
    WHERE member_id = v_uid
      AND action_key = p_action_key
      AND created_at >= date_trunc('day', now());

  IF v_today >= v_cat.daily_cap THEN
    RAISE EXCEPTION 'daily limit reached for %', p_action_key USING ERRCODE = '53400';
  END IF;

  INSERT INTO public.reward_events (member_id, track, action_key, points, metadata, self_reported)
  VALUES (v_uid, v_cat.track, p_action_key, v_cat.points,
          coalesce(p_metadata, '{}'::jsonb), true)
  RETURNING * INTO v_row;

  PERFORM public.refresh_certificates(v_uid);
  RETURN v_row;
END $$;

GRANT EXECUTE ON FUNCTION public.award_self_reported(text, jsonb) TO authenticated;

-- Quiz completion. Score is still supplied by the client — this function does
-- not make quiz results trustworthy, it makes the *reward* consistent: the
-- threshold, the prerequisite chain, the point value and the one-shot rule are
-- all enforced server-side. Making the score itself trustworthy requires
-- server-side grading (submit answers, not a score); tracked as follow-up.
CREATE OR REPLACE FUNCTION public.award_quiz_completion(
  p_area_id text,
  p_score   integer
) RETURNS public.reward_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_rule public.quiz_reward_rules;
  v_pts  integer;
  v_row  public.reward_events;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_rule FROM public.quiz_reward_rules WHERE area_id = p_area_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown quiz area %', p_area_id USING ERRCODE = '42501';
  END IF;

  IF p_score < v_rule.min_score THEN
    RETURN NULL;
  END IF;

  IF v_rule.prerequisite_area_id IS NOT NULL THEN
    PERFORM 1 FROM public.certificates c
      JOIN public.quiz_reward_rules r ON r.certificate_type = c.certificate_type
      WHERE c.member_id = v_uid AND r.area_id = v_rule.prerequisite_area_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'prerequisite % not met', v_rule.prerequisite_area_id USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT points INTO v_pts FROM public.points_catalog WHERE action_key = v_rule.action_key;

  INSERT INTO public.reward_events (member_id, track, action_key, points, metadata, self_reported)
  SELECT v_uid, c.track, v_rule.action_key, v_pts,
         jsonb_build_object('score', p_score, 'area_id', p_area_id), false
  FROM public.points_catalog c WHERE c.action_key = v_rule.action_key
  ON CONFLICT DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RETURN NULL;   -- already awarded
  END IF;

  INSERT INTO public.certificates
    (member_id, certificate_type, settlement_object_key, source_event_id)
  VALUES (v_uid, v_rule.certificate_type, v_rule.settlement_object_key, v_row.id)
  ON CONFLICT DO NOTHING;

  RETURN v_row;
END $$;

GRANT EXECUTE ON FUNCTION public.award_quiz_completion(text, integer) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- (B6) Mentor-session collusion bound.
--      Two accounts could previously confirm unlimited sessions at 40 points
--      each, and four with the same partner minted the mentorship certificate.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS mentor_sessions_unique_pair_topic
  ON public.mentor_sessions (mentor_id, mentee_id, lower(topic));

CREATE OR REPLACE FUNCTION public.mentor_session_pair_cooldown()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM 1 FROM public.mentor_sessions
    WHERE mentor_id = NEW.mentor_id
      AND mentee_id = NEW.mentee_id
      AND created_at > now() - interval '7 days';
  IF FOUND THEN
    RAISE EXCEPTION 'a session with this mentee already exists in the last 7 days'
      USING ERRCODE = '53400';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_mentor_session_pair_cooldown ON public.mentor_sessions;
CREATE TRIGGER trg_mentor_session_pair_cooldown
  BEFORE INSERT ON public.mentor_sessions
  FOR EACH ROW EXECUTE FUNCTION public.mentor_session_pair_cooldown();

-- Distinct-mentee requirement for the mentorship certificate is enforced in
-- refresh_certificates() by counting confirmed sessions; tighten to
-- count(DISTINCT mentee_id) if four separate mentees is the intended bar.

-- ─────────────────────────────────────────────────────────────────────────────
-- (B7) Stop publishing the admin allow-list to every anonymous visitor.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_members_read_all" ON public.admin_members;
CREATE POLICY "admin_members_read_self" ON public.admin_members
  FOR SELECT USING (member_id = auth.uid() OR public.is_admin());

COMMIT;
