-- ============================================================
-- Support messages — site contact form inbox
-- Migration 015
-- ============================================================
-- Written to exclusively by the workers/support-inbox Cloudflare Worker
-- (see that directory), which sits in front of this table: it validates
-- input, checks Cloudflare Turnstile, rate-limits by IP, then inserts here
-- using the service-role key and sends the submitter an auto-reply email.
--
-- Deliberately NO insert policy for anon/authenticated — unlike
-- video_suggestions/app_error_logs, this table is never written to
-- directly from the browser. The service role bypasses RLS entirely,
-- which is the point: the Worker is the only writer, after it has done
-- validation the DB itself can't enforce (Turnstile, rate limits, email
-- auto-reply side effects).
-- ============================================================

BEGIN;

CREATE TABLE public.support_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_type    text        NOT NULL CHECK (message_type IN ('bug', 'support', 'partnership', 'press', 'general')),
  name            text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  email           text        NOT NULL CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  subject         text        CHECK (char_length(subject) <= 200),
  body            text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  status          text        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  ip_hash         text,       -- SHA-256 of submitter IP, not the raw address — abuse review only
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,
  resolved_by     uuid        REFERENCES public.members(id),
  resolution_note text
);

CREATE INDEX ON public.support_messages (status, created_at DESC);
CREATE INDEX ON public.support_messages (message_type);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Read/update: admins only. No insert policy at all (see header note).
CREATE POLICY "support_messages_read_admin" ON public.support_messages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "support_messages_update_admin" ON public.support_messages FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
