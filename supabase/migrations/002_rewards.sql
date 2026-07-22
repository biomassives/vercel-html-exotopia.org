-- ============================================================
-- SCD Hub Rewards & Incentive Foundation
-- Migration 002 — points ledger, certificates, mentorship
-- ============================================================
-- Shared foundation for three reward-earning tracks: volunteering,
-- finance-literacy education, and educating others. See
-- SPEC_ECOOPS_COMMUNITY_PLATFORM.md for the fuller design this is
-- a lean subset of.

-- ── Reward events (append-only points ledger) ──────────────────
CREATE TABLE public.reward_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  track      text        NOT NULL CHECK (track IN ('volunteering', 'finance_literacy', 'educating_others')),
  action_key text        NOT NULL,   -- free text, not enum — new action types shouldn't need a migration
  points     int         NOT NULL CHECK (points >= 0),
  metadata   jsonb        NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.reward_events (member_id, created_at);
CREATE INDEX ON public.reward_events (track);

-- ── Certificates (issued credentials, one per member per type) ─
CREATE TABLE public.certificates (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id            uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  certificate_type     text        NOT NULL,
  settlement_object_key text,
  source_event_id      uuid        REFERENCES public.reward_events(id) ON DELETE SET NULL,
  issued_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, certificate_type)
);

CREATE INDEX ON public.certificates (member_id);

-- ── Mentor sessions (peer-to-peer "educating others" credit) ───
-- Pairing requires an existing green-light connection (public.is_connected,
-- from 001_blog_comments.sql) — no new social graph needed.

CREATE TABLE public.mentor_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id        uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  mentee_id        uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  topic            text        NOT NULL,
  confirmed_mentor bool        NOT NULL DEFAULT false,
  confirmed_mentee bool        NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  confirmed_at     timestamptz,
  CHECK (mentor_id <> mentee_id)
);

CREATE INDEX ON public.mentor_sessions (mentor_id);
CREATE INDEX ON public.mentor_sessions (mentee_id);

-- ── Minimal admin allow-list ────────────────────────────────────
-- Manual INSERT after real member signup, same pattern as the 001
-- seed comment at the bottom of this file. Not a general roles system.

CREATE TABLE public.admin_members (
  member_id uuid PRIMARY KEY REFERENCES public.members(id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_members WHERE member_id = auth.uid())
$$;

-- ── Convenience view for a future leaderboard ───────────────────
CREATE VIEW public.member_points AS
  SELECT member_id, COALESCE(SUM(points), 0) AS total_points
  FROM public.reward_events
  GROUP BY member_id;

-- ============================================================
-- Mentor session confirmation guard + reward emission
-- ============================================================
-- A party can only ever flip their OWN confirmation flag, no matter
-- what the client sends. The moment both are true, confirmed_at is
-- set and a second trigger (SECURITY DEFINER, so it can write reward
-- rows for both parties from a single party's UPDATE) emits points
-- for mentor and mentee and issues a mentorship certificate once the
-- mentor has 4 confirmed sessions.

CREATE OR REPLACE FUNCTION public.mentor_session_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- mentor_id/mentee_id/topic/created_at are immutable via UPDATE — without this,
  -- either party could reassign the session (and its point payout) to an arbitrary
  -- member by including a different mentor_id/mentee_id in their confirmation call.
  NEW.mentor_id   := OLD.mentor_id;
  NEW.mentee_id   := OLD.mentee_id;
  NEW.topic       := OLD.topic;
  NEW.created_at  := OLD.created_at;

  IF auth.uid() = OLD.mentor_id THEN
    NEW.confirmed_mentee := OLD.confirmed_mentee;  -- mentor can't touch mentee's flag
  ELSIF auth.uid() = OLD.mentee_id THEN
    NEW.confirmed_mentor := OLD.confirmed_mentor;  -- mentee can't touch mentor's flag
  END IF;

  IF NEW.confirmed_mentor AND NEW.confirmed_mentee AND OLD.confirmed_at IS NULL THEN
    NEW.confirmed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mentor_session_guard
  BEFORE UPDATE ON public.mentor_sessions
  FOR EACH ROW EXECUTE FUNCTION public.mentor_session_guard();

CREATE OR REPLACE FUNCTION public.mentor_session_reward()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cycle_count int;
BEGIN
  INSERT INTO public.reward_events (member_id, track, action_key, points, metadata) VALUES
    (NEW.mentor_id, 'educating_others', 'mentor_session', 40, jsonb_build_object('session_id', NEW.id, 'role', 'mentor', 'topic', NEW.topic)),
    (NEW.mentee_id, 'educating_others', 'mentor_session', 40, jsonb_build_object('session_id', NEW.id, 'role', 'mentee', 'topic', NEW.topic));

  SELECT count(*) INTO cycle_count
  FROM public.mentor_sessions
  WHERE mentor_id = NEW.mentor_id AND confirmed_at IS NOT NULL;

  IF cycle_count >= 4 THEN
    INSERT INTO public.certificates (member_id, certificate_type, settlement_object_key)
    VALUES (NEW.mentor_id, 'mentorship', 'mentorship_beacon')
    ON CONFLICT (member_id, certificate_type) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mentor_session_reward
  AFTER UPDATE ON public.mentor_sessions
  FOR EACH ROW
  WHEN (NEW.confirmed_at IS NOT NULL AND OLD.confirmed_at IS NULL)
  EXECUTE FUNCTION public.mentor_session_reward();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.reward_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_members   ENABLE ROW LEVEL SECURITY;

-- reward_events / certificates: public read (Impact Profile), like members_read_all.
-- Insert is self-service or admin-on-behalf-of. No update/delete policy — immutable ledger.
CREATE POLICY "reward_events_read_all" ON public.reward_events FOR SELECT USING (true);
CREATE POLICY "reward_events_insert"   ON public.reward_events FOR INSERT
  WITH CHECK (member_id = auth.uid() OR public.is_admin());

CREATE POLICY "certificates_read_all" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "certificates_insert"   ON public.certificates FOR INSERT
  WITH CHECK (member_id = auth.uid() OR public.is_admin());

-- mentor_sessions: visible/editable only to the two parties (or admin).
-- Mentor initiates and must already be green-light connected to the mentee.
CREATE POLICY "mentor_sessions_select" ON public.mentor_sessions FOR SELECT
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid() OR public.is_admin());
CREATE POLICY "mentor_sessions_insert" ON public.mentor_sessions FOR INSERT
  WITH CHECK (mentor_id = auth.uid() AND public.is_connected(mentee_id));
CREATE POLICY "mentor_sessions_update" ON public.mentor_sessions FOR UPDATE
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

-- admin_members: readable by anyone (small allow-list, not sensitive); no client writes —
-- rows are inserted manually via the SQL editor, same as the 001 member seed.
CREATE POLICY "admin_members_read_all" ON public.admin_members FOR SELECT USING (true);

-- ============================================================
-- Seed: admin allow-list template
-- ============================================================
-- NOTE: Replace with actual auth.users.id values after signup, same
-- pattern as the member seed in 001_blog_comments.sql.

-- INSERT INTO public.admin_members (member_id) VALUES
--   ('<greg-uuid>');
