-- ============================================================
-- Construction ledger — real, debt-permissive item economy
-- Migration 014
-- ============================================================
-- Settlement "constructed" items (src/lib/settlement-items.ts) have always
-- shown a buildCost in eco-ops points, but nothing ever deducted it from
-- anything — the number was decoration. This migration makes it real:
-- constructing an item debits the finance_literacy track for real, via a
-- server-verified cost (never a client-supplied number), by inserting a
-- negative reward_events row.
--
-- Debt is intentional, not a bug: points carry no real-world value, so
-- letting a settler's balance go negative is a safe place to first
-- encounter "you spent more than you have" — a deliberate on-ramp toward
-- the PFIN-8/PFIN-28 finance-literacy quizzes (src/data/finance-literacy-
-- quiz.ts), which already exist and already pay real points back in
-- (pfin8_complete: +25, pfin28_complete: +60 — see points_catalog).

-- reward_events.points was CHECK (points >= 0) — every existing writer
-- (award_self_reported, award_quiz_completion, the admin-grant policy) only
-- ever inserts a non-negative, catalog-bounded value, so relaxing this to
-- "any nonzero integer" doesn't loosen anything for those paths. Only the
-- new debit_construction() below will ever insert a negative row, and it
-- does so as SECURITY DEFINER, not via a client-writable policy.
ALTER TABLE public.reward_events DROP CONSTRAINT reward_events_points_check;
ALTER TABLE public.reward_events ADD CONSTRAINT reward_events_points_check CHECK (points <> 0);

-- ── Construction catalog — server-side source of truth for item cost ───────
-- Mirrors src/lib/settlement-items.ts's ITEM_MESH_PRESETS[*].buildCost for
-- every preset with 'constructed' in its acquiredBy list. Keep in sync by
-- hand when that file's buildCost values change — same coupling already
-- accepted elsewhere (e.g. MENTOR_CYCLE_THRESHOLD vs. its trigger).
CREATE TABLE IF NOT EXISTS public.construction_catalog (
  item_key    text PRIMARY KEY,
  cost        integer NOT NULL CHECK (cost > 0),
  description text
);

INSERT INTO public.construction_catalog (item_key, cost, description) VALUES
  ('beacon',        40, 'Signal Beacon'),
  ('planter',       20, 'Garden Planter'),
  ('solar-array',   60, 'Solar Array'),
  ('archive-node',  35, 'Archive Node'),
  ('water-filter',  50, 'Water Filtration Unit'),
  ('comms-relay',   45, 'Comms Relay')
ON CONFLICT (item_key) DO NOTHING;

ALTER TABLE public.construction_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "construction_catalog_read" ON public.construction_catalog FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policy: catalogue changes are migrations, not runtime.

-- ── debit_construction() — the only way a construction cost is charged ─────
-- Same shape as award_self_reported()/award_quiz_completion(): the client
-- names WHAT it did (an item_key), never HOW MUCH that's worth. Repeatable
-- by design (unlike the quiz one-shot rule) — building a second lantern
-- costs again, same as the first.
CREATE OR REPLACE FUNCTION public.debit_construction(
  p_item_key text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS public.reward_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_cat public.construction_catalog;
  v_row public.reward_events;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_cat FROM public.construction_catalog WHERE item_key = p_item_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown construction item %', p_item_key USING ERRCODE = '42704';
  END IF;

  INSERT INTO public.reward_events (member_id, track, action_key, points, metadata, self_reported)
  VALUES (v_uid, 'finance_literacy', 'construct:' || p_item_key, -v_cat.cost,
          coalesce(p_metadata, '{}'::jsonb), false)
  RETURNING * INTO v_row;

  RETURN v_row;
END $$;

REVOKE ALL ON FUNCTION public.debit_construction(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.debit_construction(text, jsonb) TO authenticated;
