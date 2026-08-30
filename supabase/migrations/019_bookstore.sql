-- ============================================================
-- Bookstore & Media Orders — income support for network creatives
-- and core program maintainers ("Home Team")
-- Migration 019
-- ============================================================
-- v1 scope: this is an ORDER-INTAKE system, not a live checkout. There is no
-- payment processor wired into this table set — bookstore_orders records
-- expressed interest/an order request that a human (the creator or an admin)
-- fulfils out-of-band (direct contact, invoice, or a pon.ink transaction once
-- that path exists). Do not present this as "purchase confirmed" anywhere in
-- the UI; the honest framing is "order request received."
--
-- Catalog entries are self-listed by signed-in members (status='pending')
-- and reviewed by an admin before going public (status='active') — same
-- submitter/reviewer split as video_suggestions (010) and method_proposals,
-- not a direct, unmoderated public write.
--
-- Income split: see src/lib/resonance-split.ts BOOKSTORE_SPLIT. Not enforced
-- at the DB layer (no payment flows through this table yet) — it's recorded
-- per-item at creation time (split_note) purely for display/consistency, so a
-- later payment integration has a documented default to start from rather
-- than inventing a number at that point.
-- ============================================================

BEGIN;

CREATE TABLE public.bookstore_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  creator_name    text        NOT NULL CHECK (char_length(creator_name) BETWEEN 1 AND 200),
  title           text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  format          text        NOT NULL CHECK (format IN ('book', 'zine', 'print', 'audio', 'other')),
  description     text        NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  price_usd       numeric(10,2) NOT NULL CHECK (price_usd >= 0),
  cover_image_url text,
  external_url    text,       -- optional: creator's own storefront / pon.ink listing, once one exists
  is_home_team     boolean     NOT NULL DEFAULT false,  -- true = proceeds support core maintainer income, not an individual creator
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'active', 'archived', 'rejected')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid        REFERENCES public.members(id)
);

CREATE INDEX ON public.bookstore_items (status, created_at DESC);
CREATE INDEX ON public.bookstore_items (creator_id);

ALTER TABLE public.bookstore_items ENABLE ROW LEVEL SECURITY;

-- Public sees only reviewed, live listings; a creator also sees their own
-- pending/rejected rows so they know what happened to their submission.
CREATE POLICY "bookstore_items_read" ON public.bookstore_items FOR SELECT
  USING (status = 'active' OR creator_id = auth.uid() OR public.is_admin());

CREATE POLICY "bookstore_items_insert" ON public.bookstore_items FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Admins review (approve/reject); creators may edit their own row only while
-- it is still pending (e.g. fix a typo before review) — once active/rejected,
-- only an admin can change it, so a listing can't be silently altered after
-- someone has already placed an order against it.
CREATE POLICY "bookstore_items_update_owner_pending" ON public.bookstore_items FOR UPDATE
  USING (creator_id = auth.uid() AND status = 'pending')
  WITH CHECK (creator_id = auth.uid() AND status = 'pending');

CREATE POLICY "bookstore_items_update_admin" ON public.bookstore_items FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================

CREATE TABLE public.bookstore_orders (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       uuid        NOT NULL REFERENCES public.bookstore_items(id) ON DELETE CASCADE,
  buyer_id      uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  quantity      integer     NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 50),
  note          text        CHECK (char_length(note) <= 1000),
  status        text        NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new', 'contacted', 'fulfilled', 'cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz
);

CREATE INDEX ON public.bookstore_orders (status, created_at DESC);
CREATE INDEX ON public.bookstore_orders (item_id);
CREATE INDEX ON public.bookstore_orders (buyer_id);

ALTER TABLE public.bookstore_orders ENABLE ROW LEVEL SECURITY;

-- Requires sign-in to submit (same posture as support_messages/video_suggestions
-- avoiding an anonymous-write PII table — buyer contact info is resolved via
-- the member's own account, not a free-text email field here). A buyer sees
-- their own order history; the item's creator sees orders placed against
-- their own listings (they're the one fulfilling it); admins see everything.
CREATE POLICY "bookstore_orders_read" ON public.bookstore_orders FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookstore_items i
      WHERE i.id = bookstore_orders.item_id AND i.creator_id = auth.uid()
    )
  );

CREATE POLICY "bookstore_orders_insert" ON public.bookstore_orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Status updates (contacted/fulfilled/cancelled): the fulfilling creator or
-- an admin, never the buyer unilaterally (a buyer cancels by contacting the
-- creator/admin, keeping one record of what actually happened for both sides).
CREATE POLICY "bookstore_orders_update_fulfiller" ON public.bookstore_orders FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookstore_items i
      WHERE i.id = bookstore_orders.item_id AND i.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookstore_items i
      WHERE i.id = bookstore_orders.item_id AND i.creator_id = auth.uid()
    )
  );

COMMIT;
