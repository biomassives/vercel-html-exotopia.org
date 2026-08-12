-- ============================================================================
-- 015_settlements.sql
--
-- Server-backed counterpart to the local-only SettlementRecord (src/lib/
-- settlements.ts). Until now a settlement existed only in one browser's
-- localStorage (XOR-obfuscated via storage-cipher, not real encryption) —
-- clear your cache, lose your settlement; sign in on a second device, it
-- isn't there. This table gives a signed-in member's settlements a real,
-- durable home, following the exact owner-only RLS shape already proven by
-- settlement_profiles (012) and community_nodes (008).
--
-- Deliberately NOT a public table like settlement_profiles — nothing here is
-- ever meant to be read by anyone but its owner (and admins). Publishing a
-- settlement is still the separate, explicit, opt-in settlement_profiles
-- flow; this table is just "does my own claim survive a cleared cache."
--
-- No collision authority over `key`/`exolocation`, same as everywhere else in
-- this design (see SETTLEMENT_ADDRESS_API.md): two different members can each
-- have their own row for the same address, and nothing here arbitrates
-- between them. UNIQUE is scoped to (owner_id, key) only — one member can't
-- have two rows for the same settlement, which is what "idempotent" meant
-- for the old localStorage addSettlement().
--
-- Anonymous (not signed in) settlement creation still works exactly as
-- before — this table is additive, not a replacement. See settlements.ts for
-- the hybrid client logic: localStorage remains the offline/anonymous store;
-- signed-in members additionally sync to this table.
-- ============================================================================

BEGIN;

CREATE TABLE public.settlements (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  key           text        NOT NULL CHECK (char_length(key) BETWEEN 1 AND 300),
  type          text        NOT NULL
                CHECK (type IN ('surface','cluster','moon','orbital','bh-orbital','stellar-orbital','lunar-orbital')),
  planet_name   text        NOT NULL,
  hostname      text        NOT NULL,
  exolocation   text        NOT NULL CHECK (char_length(exolocation) BETWEEN 1 AND 300),
  display_name  text        NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 200),

  lat           double precision,
  lon           double precision,
  cluster_slug  text,
  -- Mirrors SettlementRecord.memberId — an optional cluster-specific field
  -- from the source data, unrelated to owner_id (the auth identity below).
  cluster_member_id text,

  objects       text[]      NOT NULL DEFAULT '{}',
  focus         text        CHECK (focus IS NULL OR focus IN
                ('eco', 'learning', 'library', 'watsan', 'food', 'health', 'leadership', 'command')),

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (owner_id, key)
);

CREATE INDEX ON public.settlements (owner_id);

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlements_owner_select" ON public.settlements FOR SELECT
  USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "settlements_owner_insert" ON public.settlements FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- updated_at is server-set; ownership transfer isn't permitted through this
-- path, same reasoning as settlement_profiles' update trigger (012) even
-- though this table has no public/admin-moderation angle.
CREATE OR REPLACE FUNCTION public.enforce_settlement_update()
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

CREATE TRIGGER trg_settlement_update
  BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.enforce_settlement_update();

CREATE POLICY "settlements_owner_update" ON public.settlements FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

-- Unlike settlement_profiles, real DELETE is allowed here — this is a
-- private record of the owner's own claim, not moderated public content.
CREATE POLICY "settlements_owner_delete" ON public.settlements FOR DELETE
  USING (owner_id = auth.uid() OR public.is_admin());

COMMIT;
