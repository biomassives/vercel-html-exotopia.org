-- ============================================================================
-- 008_community_nodes.sql
--
-- "Community node" manager: business listings, business location pages,
-- music/creative pages, and future node types not yet designed. Backs the
-- previously-empty OrbitalGalleryEntry pipeline (src/lib/defender-nav.types.ts)
-- — DefenderNav.vue already renders orbit anchor / access level / scheduled
-- events / presence count correctly, but GalaxyPage.vue and SurfaceViewPage.vue
-- both hardcode `galleries: []`. This table is the missing data source.
--
-- Explicitly NOT a marketplace. node_type = 'business_listing' means a
-- description of what a business offers and how to reach them — never an
-- in-platform price, cart, or checkout. The removed "Exchange Depot" secondary
-- marketplace (see blog-risk-reduction-pass.md) was cut for NFT-resale/
-- investment-framing risk; a real-world business directory is a different
-- risk category, but only stays that way if this table never grows a price/
-- offer/bid column. If that's ever wanted, it needs its own risk review, not
-- a quiet column addition here.
--
-- Security posture, following migration 007's fixes:
--   - Every SECURITY DEFINER function below has search_path pinned explicitly
--     (007's dynamic pin only covered functions that existed at the time).
--   - Self-publish is immediate (matches how every real business-directory
--     product works, and 'self'/'family' in knowledge_keeper_records) but
--     rate-limited server-side (a client bug or a bad actor scripting the
--     insert endpoint shouldn't be able to flood the table) and status
--     transitions are guarded by a trigger so an owner can toggle
--     draft<->published on their own listing but cannot self-reverse an
--     admin takedown (archived -> published) — that requires is_admin().
--   - node_type is a CHECK-constrained allow-list, not a free string. Adding
--     a new type ("X") is a small additive migration
--     (ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT ... CHECK (...))
--     plus whatever new shape it needs in `metadata` — cheap, but still
--     server-validated, not client-arbitrary. See
--     SPEC_SETTLEMENT_CMS_NODE_TYPES.md for the extension mechanism.
--   - No client DELETE. "Removal" is either self-service (status='archived',
--     same as any other status change the owner is allowed to make) or an
--     admin takedown. A full account-level erasure already has its own path
--     via deletion_requests (migration 004) — this table doesn't need a
--     second one.
-- ============================================================================

BEGIN;

CREATE TABLE public.community_nodes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  node_type        text        NOT NULL
                    CHECK (node_type IN ('business_listing', 'business_location', 'creative_page')),

  title            text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description      text        CHECK (description IS NULL OR char_length(description) <= 8000),

  -- Type-specific shape, validated at the application layer per node_type
  -- (e.g. business_listing -> {items, contact}; business_location ->
  -- {address, hours, region}; creative_page -> {ponInkUrl, mediaLinks}).
  -- Never a price/offer/bid field — see header note.
  metadata         jsonb       NOT NULL DEFAULT '{}'::jsonb,

  -- Which star system's gallery this node appears in (matches StarSystem.hostname
  -- from src/stores/galaxy.ts, e.g. sys.hostname). Free-text, not a foreign key —
  -- same loose pattern as focus_areas.base_address / knowledge_keeper_records.site_ref,
  -- since the astronomical catalog isn't itself a table this schema owns.
  -- Nullable: a node with no hostname yet doesn't appear in any system's gallery.
  hostname         text,

  -- Optional full exolocation address (SPEC_EXOLOC_ADDRESS.md grammar) if this
  -- node is attached to a specific settlement rather than just a system.
  exoloc_address   text,

  -- Mirrors GalleryOrbitAnchor from defender-nav.types.ts: {type: 'free' |
  -- 'lagrange' | 'circumbinary', ...}. Where a node renders within that system.
  orbit_anchor     jsonb       NOT NULL DEFAULT '{}'::jsonb,

  ownership_model  text        NOT NULL DEFAULT 'solo'
                    CHECK (ownership_model IN ('solo', 'cooperative', 'dao', 'public')),
  access_level     text        NOT NULL DEFAULT 'public'
                    CHECK (access_level IN ('owner', 'member', 'ticket', 'public', 'none')),

  status           text        NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'archived')),

  created_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid        REFERENCES public.members(id)
);

CREATE INDEX ON public.community_nodes (owner_id);
CREATE INDEX ON public.community_nodes (status);
CREATE INDEX ON public.community_nodes (node_type, status);
CREATE INDEX ON public.community_nodes (hostname, status);

ALTER TABLE public.community_nodes ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Read: published nodes are public (this is what populates the gallery
-- pipeline for every visitor). Draft/archived are visible only to the owner
-- and admins.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "community_nodes_read" ON public.community_nodes FOR SELECT
  USING (status = 'published' OR owner_id = auth.uid() OR public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Insert: owner-only, rate-limited server-side so scripting the insert
-- endpoint can't flood the table with spam listings.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_community_node_creation_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_today_count integer;
BEGIN
  SELECT count(*) INTO v_today_count
    FROM public.community_nodes
    WHERE owner_id = NEW.owner_id
      AND created_at >= now() - interval '24 hours';

  IF v_today_count >= 5 THEN
    RAISE EXCEPTION 'daily community node creation limit reached (5 per 24h)'
      USING ERRCODE = '53400';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_community_node_creation_limit
  BEFORE INSERT ON public.community_nodes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_community_node_creation_limit();

CREATE POLICY "community_nodes_insert_own" ON public.community_nodes FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- Update: owners can edit their own node's content and toggle
-- draft <-> published freely, but cannot self-reverse an admin takedown.
-- Admins can set any status (moderation / abuse response).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_community_node_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;   -- admins may set any status, e.g. archiving for abuse
  END IF;

  IF OLD.status = 'archived' AND NEW.status <> 'archived' THEN
    RAISE EXCEPTION 'only an admin can restore an archived node'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    RAISE EXCEPTION 'ownership transfer is not permitted through this path'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_community_node_status_transition
  BEFORE UPDATE ON public.community_nodes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_community_node_status_transition();

CREATE POLICY "community_nodes_update_own" ON public.community_nodes FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

-- No DELETE policy — see header note. Removal is status='archived'
-- (self-service or admin) or a full account erasure via deletion_requests.

COMMIT;
