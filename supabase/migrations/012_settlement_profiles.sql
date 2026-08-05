-- ============================================================================
-- 012_settlement_profiles.sql
--
-- Public-facing counterpart to the local-only SettlementRecord (src/lib/
-- settlements.ts). Settlements themselves live entirely in browser
-- localStorage (via storage-cipher) — fine for "my own claim, in my own
-- browser," but it means nothing exists server-side for a guest on a
-- different device to ever see. This table is the minimal publishable
-- subset: display name, focus, description, and attached "technology"
-- placeholder-model keys (src/data/technology-library.ts) — opt-in, created
-- only when a settler explicitly chooses to "publish a settlement page."
--
-- public_slug (not exolocation) is the URL key. SETTLEMENT_ADDRESS_API.md's
-- design deliberately has no collision authority over exoloc addresses under
-- IPFS pinning — two different people could each claim the same address in
-- their own browsers with no chain arbitrating between them. A generated
-- slug sidesteps that entirely: it's this table's own key, not a claim over
-- the address space.
--
-- Security posture, following migration 007/008's established pattern:
--   - Every SECURITY DEFINER function below has search_path pinned
--     explicitly (007's dynamic backfill only covered functions that
--     existed at the time it ran).
--   - Self-publish is immediate (no admin queue) but rate-limited
--     server-side — 007's own commit message is the reason this is a
--     DB-side trigger and not a client-side-only limiter: a client-side
--     rate limit was exactly the vulnerability 007 fixed for reward_events.
--   - Status transitions are guarded the same way as community_nodes (008):
--     an owner can edit their own content and toggle published<->archived,
--     but cannot self-reverse an admin takedown.
--   - No client DELETE. Removal is status='archived' (self-service or
--     admin) or a full account erasure via deletion_requests (004).
--   - focus is a CHECK-constrained allow-list mirroring MintPage.vue's
--     FOCUS_OPTIONS ids, not a free string — same reasoning as community_
--     nodes' node_type constraint (008): server-validated, not client-
--     arbitrary, and cheap to extend additively if a new focus is added.
-- ============================================================================

BEGIN;

CREATE TABLE public.settlement_profiles (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  -- Public URL key — see header note on why this isn't the exoloc address.
  public_slug      text        UNIQUE NOT NULL
                    DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),

  exolocation      text        NOT NULL CHECK (char_length(exolocation) BETWEEN 1 AND 200),
  display_name     text        NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 200),

  focus            text        NOT NULL
                    CHECK (focus IN ('eco', 'learning', 'library', 'watsan', 'food', 'health', 'leadership', 'command')),

  description      text        CHECK (description IS NULL OR char_length(description) <= 2000),

  -- Keys into src/data/technology-library.ts, rendered via settlement-items.ts's
  -- existing buildItemMesh() default-orb-then-real-.glb pipeline. Not FK-
  -- validated against a catalog table (the catalog is a static data file,
  -- same trust level as community_nodes.metadata) — capped in length only.
  technology_keys  text[]      NOT NULL DEFAULT '{}'
                    CHECK (array_length(technology_keys, 1) IS NULL OR array_length(technology_keys, 1) <= 12),

  status           text        NOT NULL DEFAULT 'published'
                    CHECK (status IN ('published', 'archived')),

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.settlement_profiles (owner_id);
CREATE INDEX ON public.settlement_profiles (status);

ALTER TABLE public.settlement_profiles ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Read: published profiles are public — this is what a guest visiting
-- /settlement/:slug on any device sees. Archived is visible only to the
-- owner and admins.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "settlement_profiles_read" ON public.settlement_profiles FOR SELECT
  USING (status = 'published' OR owner_id = auth.uid() OR public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Insert: owner-only, rate-limited server-side (see header note).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_settlement_profile_creation_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_today_count integer;
BEGIN
  SELECT count(*) INTO v_today_count
    FROM public.settlement_profiles
    WHERE owner_id = NEW.owner_id
      AND created_at >= now() - interval '24 hours';

  IF v_today_count >= 3 THEN
    RAISE EXCEPTION 'daily settlement profile creation limit reached (3 per 24h)'
      USING ERRCODE = '53400';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_settlement_profile_creation_limit
  BEFORE INSERT ON public.settlement_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_settlement_profile_creation_limit();

CREATE POLICY "settlement_profiles_insert_own" ON public.settlement_profiles FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- Update: owners can edit their own content and toggle published<->archived
-- freely, but cannot self-reverse an admin takedown or transfer ownership.
-- updated_at is server-set, not client-writable.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_settlement_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_admin() THEN
    NEW.updated_at := now();
    RETURN NEW;   -- admins may set any status, e.g. archiving for abuse
  END IF;

  IF OLD.status = 'archived' AND NEW.status <> 'archived' THEN
    RAISE EXCEPTION 'only an admin can restore an archived settlement profile'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    RAISE EXCEPTION 'ownership transfer is not permitted through this path'
      USING ERRCODE = '42501';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_settlement_profile_update
  BEFORE UPDATE ON public.settlement_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_settlement_profile_update();

CREATE POLICY "settlement_profiles_update_own" ON public.settlement_profiles FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

-- No DELETE policy — see header note. Removal is status='archived'
-- (self-service or admin) or a full account erasure via deletion_requests.

COMMIT;
