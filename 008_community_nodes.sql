-- ============================================================================
-- 008_community_nodes.sql
--
-- Backing table for the community-nodes feature (see SPEC_COMMUNITY_NODES.md).
--
-- OPTIONAL / NOT REQUIRED BY THE PATCHES.
-- The code patches ship a stub store whose fetchGalleryNodes() returns [] and
-- never queries this table, so the app builds and runs without this migration.
-- Apply it only when you actually start implementing the feature — and read the
-- "decide before shipping" notes below first, because two of them are choices
-- this file guesses at on your behalf.
--
-- Follows the posture set by 007_reward_integrity.sql:
--   - clients never assert their own trust decisions
--   - the moderation transition is an RPC, not a client UPDATE
--   - every SECURITY DEFINER function pins search_path
--
-- Reuses public.is_admin() and public.admin_members from 002_rewards.sql —
-- which resolves open question #1 in SPEC_COMMUNITY_NODES.md ("where does the
-- moderator role come from"): it already exists, no new role source needed.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_nodes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  -- Validated in code against src/data/community-node-types.ts, deliberately
  -- NOT a Postgres enum: adding a node type must not require a migration.
  node_type         text NOT NULL,

  name              text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  description       text CHECK (description IS NULL OR length(description) <= 4000),

  -- Host star. The gallery query key — both call sites fetch by hostname.
  hostname          text NOT NULL CHECK (hostname <> '' AND hostname NOT LIKE '%:%'),

  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','submitted','approved','rejected','withdrawn')),

  -- Orbit placement → GalleryOrbitAnchor (src/lib/defender-nav.types.ts)
  anchor_type       text NOT NULL DEFAULT 'free'
                    CHECK (anchor_type IN ('free','lagrange','circumbinary')),
  radius_au         numeric CHECK (radius_au IS NULL OR radius_au > 0),
  initial_angle_deg numeric CHECK (initial_angle_deg IS NULL
                                   OR (initial_angle_deg >= 0 AND initial_angle_deg < 360)),
  anchor_planet     text,
  lagrange_point    text CHECK (lagrange_point IS NULL OR lagrange_point IN ('L4','L5')),

  -- Presentation → OrbitalGalleryEntry
  gallery_type      text NOT NULL DEFAULT 'community'
                    CHECK (gallery_type IN ('art','community','research','stage','info')),
  ownership_model   text NOT NULL DEFAULT 'solo'
                    CHECK (ownership_model IN ('solo','cooperative','dao','public')),
  -- 'ticket' is deliberately excluded: it implies payments, which this repo has
  -- kept out on purpose (RISK_REDUCTION_RECOMMENDATIONS.md, Exchange Depot removal).
  access_level      text NOT NULL DEFAULT 'public'
                    CHECK (access_level IN ('owner','member','public','none')),
  pon_ink_url       text,

  -- Moderation trail
  reviewed_by       uuid REFERENCES public.members(id) ON DELETE SET NULL,
  reviewed_at       timestamptz,
  review_note       text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  -- Shape integrity: each anchor type needs its own fields present.
  CONSTRAINT community_nodes_anchor_shape CHECK (
    (anchor_type = 'free'         AND radius_au IS NOT NULL AND initial_angle_deg IS NOT NULL)
 OR (anchor_type = 'circumbinary' AND radius_au IS NOT NULL)
 OR (anchor_type = 'lagrange'     AND anchor_planet IS NOT NULL AND lagrange_point IS NOT NULL)
  )
);

-- Public read path: approved rows for one host star.
CREATE INDEX IF NOT EXISTS community_nodes_hostname_approved_idx
  ON public.community_nodes (hostname) WHERE status = 'approved';

-- Owner dashboard + the member.ts data-export row.
CREATE INDEX IF NOT EXISTS community_nodes_owner_idx
  ON public.community_nodes (owner_id);

-- Moderation queue.
CREATE INDEX IF NOT EXISTS community_nodes_submitted_idx
  ON public.community_nodes (created_at) WHERE status = 'submitted';

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at maintenance
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.community_nodes_touch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_nodes_touch_trg ON public.community_nodes;
CREATE TRIGGER community_nodes_touch_trg
  BEFORE UPDATE ON public.community_nodes
  FOR EACH ROW EXECUTE FUNCTION public.community_nodes_touch();

-- ─────────────────────────────────────────────────────────────────────────────
-- Guard: a client must never move its own row into 'approved'/'rejected', and
-- must never edit the moderation trail. This is the structural equivalent of
-- 007's "clients lose INSERT on the ledger" — the UI filtering is not the control.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.community_nodes_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Once approved, an owner editing the row drops it back to 'submitted' for
  -- re-review rather than silently mutating live public content.
  --
  -- This must run BEFORE the status validation below: on an ordinary edit the
  -- client does not send a status at all, so NEW.status is still 'approved' and
  -- the validation would reject the edit outright, making an approved node
  -- permanently uneditable by its owner. NEW.status = OLD.status is what tells
  -- us "this is an edit, not a status change".
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status = OLD.status THEN
    NEW.status := 'submitted';
  END IF;

  -- Owners may only ever sit in these states. Reached after the demote above,
  -- so an edit of live content passes as 'submitted', while an explicit attempt
  -- to set 'approved'/'rejected' from any other state still fails here.
  IF NEW.status NOT IN ('draft','submitted','withdrawn') THEN
    RAISE EXCEPTION 'status % may only be set by moderation', NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- Moderation trail is not client-writable.
  IF TG_OP = 'UPDATE' THEN
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.review_note := OLD.review_note;
    NEW.owner_id    := OLD.owner_id;
  ELSE
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.review_note := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_nodes_guard_trg ON public.community_nodes;
CREATE TRIGGER community_nodes_guard_trg
  BEFORE INSERT OR UPDATE ON public.community_nodes
  FOR EACH ROW EXECUTE FUNCTION public.community_nodes_guard();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.community_nodes ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) may read approved nodes; that is the orbital gallery.
DROP POLICY IF EXISTS "community_nodes_read_approved" ON public.community_nodes;
CREATE POLICY "community_nodes_read_approved" ON public.community_nodes
  FOR SELECT USING (status = 'approved');

-- An owner sees all of their own rows, whatever the status.
DROP POLICY IF EXISTS "community_nodes_read_own" ON public.community_nodes;
CREATE POLICY "community_nodes_read_own" ON public.community_nodes
  FOR SELECT USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "community_nodes_insert_own" ON public.community_nodes;
CREATE POLICY "community_nodes_insert_own" ON public.community_nodes
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Editable only while not live; the guard trigger enforces the status values.
DROP POLICY IF EXISTS "community_nodes_update_own" ON public.community_nodes;
CREATE POLICY "community_nodes_update_own" ON public.community_nodes
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "community_nodes_delete_own" ON public.community_nodes;
CREATE POLICY "community_nodes_delete_own" ON public.community_nodes
  FOR DELETE USING (owner_id = auth.uid() OR public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Moderation RPC. The ONLY path to 'approved'/'rejected'.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.moderate_community_node(
  p_node_id uuid,
  p_status  text,
  p_note    text DEFAULT NULL
)
RETURNS public.community_nodes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.community_nodes;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorised' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_status NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'moderation status must be approved or rejected'
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.community_nodes
     SET status      = p_status,
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         review_note = p_note
   WHERE id = p_node_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'node % not found', p_node_id USING ERRCODE = 'no_data_found';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.moderate_community_node(uuid, text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.moderate_community_node(uuid, text, text) TO authenticated;

-- ============================================================================
-- Decide before shipping — this file guesses, and you should confirm
-- ============================================================================
-- 1. PER-HOST CAP (spec Q3). Not enforced here. Nothing stops one member
--    filling a system with approved nodes. If you want a cap, add it as a
--    statement-level check or enforce it inside moderate_community_node().
--
-- 2. PLACEMENT COLLISIONS (spec Q2). Two nodes may claim the same radius/angle
--    around one host. If overlap should be impossible, add something like:
--      CREATE UNIQUE INDEX community_nodes_slot_idx
--        ON public.community_nodes (hostname, radius_au, initial_angle_deg)
--        WHERE status = 'approved' AND anchor_type = 'free';
--    Left out because "nodes may visually overlap" is a legitimate choice and
--    a unique index would start rejecting moderation approvals at random.
--
-- 3. HOSTNAME VALIDITY (spec Q5). hostname is only shape-checked (non-empty, no
--    ':'), not verified against the galaxy dataset — that data lives client-side,
--    so the DB cannot confirm a host exists.
--
-- 4. MODERATION SLA (spec Q4). No auto-expiry on 'submitted'.
--
-- 5. The member.ts data-export row for community_nodes starts returning data as
--    soon as this table exists. It filters on owner_id, so it will not leak
--    other members' rows — but confirm the export excludes review_note, which is
--    moderator-authored text about the member.
-- ============================================================================
