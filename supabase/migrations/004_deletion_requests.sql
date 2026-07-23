-- ============================================================
-- Account deletion requests — ARCO "Cancellation" self-service
-- Migration 004
-- ============================================================
-- The client can never safely perform the actual delete itself — that
-- needs the Supabase Admin API (service-role key) to remove the
-- auth.users row, which every other table in this schema already
-- cascades from (members.id REFERENCES auth.users(id) ON DELETE CASCADE,
-- and every subsequent table REFERENCES members(id) ON DELETE CASCADE —
-- see 001/002/003). So deleting one auth.users row via the Admin API is
-- sufficient to remove a member's entire footprint; this table exists
-- only to let a signed-in user queue that request themselves, logged
-- with a timestamp, instead of requiring an email round-trip.
--
-- Processing this queue (calling the Admin API and marking rows
-- resolved) is a manual/operator step until an edge function exists to
-- automate it — see RISK_REDUCTION_RECOMMENDATIONS.md §6/§7 and
-- legal-privacy.md §8 for why this needs to exist at all.

CREATE TABLE public.deletion_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'completed', 'cancelled')),
  resolved_at  timestamptz,
  note         text
);

CREATE INDEX ON public.deletion_requests (member_id);
CREATE INDEX ON public.deletion_requests (status);

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- A member can see and file their own request, and cancel it (update to
-- 'cancelled') while still pending — but cannot mark it 'completed'
-- themselves; only an operator with elevated access does that.
CREATE POLICY "deletion_requests_read_own" ON public.deletion_requests FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "deletion_requests_insert_own" ON public.deletion_requests FOR INSERT
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "deletion_requests_cancel_own" ON public.deletion_requests FOR UPDATE
  USING (member_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'cancelled');
