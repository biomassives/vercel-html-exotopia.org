-- ============================================================================
-- 016_settlement_items.sql
--
-- Fast-follow to 015_settlements.sql: settlement ITEMS (src/lib/settlement-
-- items.ts) were still locked to one browser (localStorage key `e8.2:<hash>`)
-- even after a settlement itself became durable — a settler could sign in on
-- a new device and see their settlement, but arrive to an empty dome. Same
-- owner-only pattern as 015, one row per (owner, settlement), holding the
-- whole item list as JSONB — matching the client's own model exactly, where
-- `persist()` already rewrites the full array on every mutation rather than
-- diffing individual items.
-- ============================================================================

BEGIN;

CREATE TABLE public.settlement_items (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  settlement_key text        NOT NULL CHECK (char_length(settlement_key) BETWEEN 1 AND 300),
  items          jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, settlement_key)
);

CREATE INDEX ON public.settlement_items (owner_id);

ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlement_items_owner_select" ON public.settlement_items FOR SELECT
  USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "settlement_items_owner_insert" ON public.settlement_items FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.enforce_settlement_items_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    RAISE EXCEPTION 'ownership transfer is not permitted through this path'
      USING ERRCODE = '42501';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_settlement_items_update
  BEFORE UPDATE ON public.settlement_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_settlement_items_update();

CREATE POLICY "settlement_items_owner_update" ON public.settlement_items FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "settlement_items_owner_delete" ON public.settlement_items FOR DELETE
  USING (owner_id = auth.uid() OR public.is_admin());

COMMIT;
