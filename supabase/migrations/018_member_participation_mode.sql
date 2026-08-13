-- ============================================================================
-- 018_member_participation_mode.sql
--
-- Persists src/composables/useGuestProfile.ts's ParticipationMode
-- ('adult_individual' | 'group_member' | 'youth_participant') server-side.
-- Today it is guest-local localStorage state only (key scd_guest_profile) —
-- accountPayload() in that file already *builds* a payload including
-- participation_mode intended to be "written after Supabase account
-- creation," but nothing calls it and its own comment admits the target
-- table ("eco_ops.profiles (or public.profiles)") was never decided. The
-- result: mentor_sessions (002_rewards.sql) has zero awareness of which
-- party, if either, is a minor, and BlogComments.vue's youth-mode gate
-- (isYouthMode) reverts to "not youth" the moment guest state stops being
-- consulted — neither is a real safeguard, both are a self-report that
-- never survives becoming an authenticated member.
--
-- This table is that missing home. Deliberately NOT a column on
-- public.members: members_read_all is a public SELECT policy (any visitor
-- can read any member row), and "is this account a minor" is exactly the
-- kind of fact that should never be public-readable — broadcasting it is
-- itself a safety problem, not just a privacy one. So: separate table,
-- self+admin read only, plus a minimal-disclosure SECURITY DEFINER function
-- below for the one legitimate cross-member use case (a prospective mentor
-- needs to know *whether* their mentee is a youth participant, not read
-- their full record).
--
-- No client UPDATE policy — set once at signup from a self-attested bracket
-- (see OnboardPage.vue's age step; under_13 is blocked before account
-- creation entirely, so it never reaches this table). Letting someone
-- silently flip their own age bracket after the fact is exactly the kind
-- of self-report you don't want backing a safety flag; a correction goes
-- through an admin, same posture as settlement_profiles' admin-only status
-- reversal (012).
-- ============================================================================

BEGIN;

CREATE TABLE public.member_participation_mode (
  member_id  uuid        PRIMARY KEY REFERENCES public.members(id) ON DELETE CASCADE,
  mode       text        NOT NULL CHECK (mode IN ('adult_individual', 'group_member', 'youth_participant')),
  set_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_participation_mode ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participation_mode_read_self" ON public.member_participation_mode FOR SELECT
  USING (member_id = auth.uid() OR public.is_admin());

CREATE POLICY "participation_mode_insert_own" ON public.member_participation_mode FOR INSERT
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "participation_mode_update_admin" ON public.member_participation_mode FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Minimal-disclosure check: reveals one bit ("is this member a youth
-- participant"), not the row. Any authenticated caller can run it — a
-- mentor needs this before/while starting a mentor_sessions row with a
-- given mentee_id, which the RLS above alone wouldn't allow them to see.
CREATE OR REPLACE FUNCTION public.is_youth_participant(p_member_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_participation_mode
    WHERE member_id = p_member_id AND mode = 'youth_participant'
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_youth_participant(uuid) TO anon, authenticated;

COMMIT;
