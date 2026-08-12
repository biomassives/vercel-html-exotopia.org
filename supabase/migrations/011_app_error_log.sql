-- ============================================================
-- App error log — a small, detailed client-error review pipeline
-- so real runtime errors (not just what a developer happens to
-- catch locally) are visible somewhere reviewable.
-- Migration 011
-- ============================================================
-- Captured client-side by src/boot/error-reporting.ts (Vue app.config.
-- errorHandler + window 'error'/'unhandledrejection' listeners), inserted
-- directly — no edge function, no external service. Rate-limiting is
-- client-side (see that file's session de-dupe/cap), not enforced here,
-- since this isn't a public-content abuse surface the way community_nodes
-- is — errors are only ever readable by admins, never rendered publicly.
--
-- This is deliberately scoped to in-app client errors only. It is NOT the
-- external Cloudflare/Vercel/Supabase/GitHub "panopticon" dashboard also
-- requested — that needs a real secrets-holding backend proxy and is a
-- separate, not-yet-built piece (see the architecture note handed back in
-- conversation).
-- ============================================================

BEGIN;

CREATE TABLE public.app_error_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message        text        NOT NULL,
  stack          text,
  level          text        NOT NULL DEFAULT 'error' CHECK (level IN ('error', 'warn')),
  source         text,       -- route path / component name at time of capture, free text
  url            text,       -- full page URL at time of capture
  user_agent     text,
  member_id      uuid        REFERENCES public.members(id) ON DELETE SET NULL,  -- nullable — errors happen before sign-in too
  occurrence_count integer   NOT NULL DEFAULT 1,   -- bumped by the client de-dupe path instead of inserting duplicate rows
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  resolved       boolean     NOT NULL DEFAULT false,
  resolved_at    timestamptz,
  resolved_by    uuid        REFERENCES public.members(id),
  resolution_note text
);

CREATE INDEX ON public.app_error_logs (resolved, last_seen_at DESC);
CREATE INDEX ON public.app_error_logs (member_id);

ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;

-- Insert: open to anyone, including signed-out visitors — an error can
-- happen before auth resolves. Not public-read: only admins review these,
-- since a stack trace can incidentally include things not meant for a
-- public audience (route params, partial state).
CREATE POLICY "app_error_logs_insert" ON public.app_error_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "app_error_logs_read_admin" ON public.app_error_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "app_error_logs_update_admin" ON public.app_error_logs FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- De-dupe: client-side, before insert. If the client instead finds an
-- existing unresolved row with the same message+source in this browser
-- session it can bump occurrence_count/last_seen_at via this RPC rather
-- than inserting a new row for every repeat of the same error.
CREATE OR REPLACE FUNCTION public.bump_error_occurrence(p_error_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.app_error_logs
  SET occurrence_count = occurrence_count + 1, last_seen_at = now()
  WHERE id = p_error_id;
END $$;

-- Callable by anyone (same trust level as the insert policy above) — this
-- only ever increments a counter on an existing row, never exposes data.
GRANT EXECUTE ON FUNCTION public.bump_error_occurrence(uuid) TO anon, authenticated;

COMMIT;
