-- ============================================================
-- SCD Hub Blog Comment System
-- Migration 001 — initial schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Members ─────────────────────────────────────────────────
-- One row per registered member. auth.users.id is the FK anchor.
-- handle is the short name shown in comments (rank, curt, evans, etc.)

CREATE TABLE public.members (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle       text        UNIQUE NOT NULL,
  display_name text        NOT NULL,
  avatar_color text        NOT NULL DEFAULT '#00e5ff',
  bio          text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Connections (green-light mutual opt-in) ──────────────────
-- Canonical form: from_id < to_id (one row per pair).
-- status: 'pending' (from_id invited to_id) | 'accepted' (mutual)

CREATE TABLE public.connections (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id    uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  to_id      uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  status     text        NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (from_id, to_id),
  CHECK (from_id <> to_id)
);

-- ── Comments ─────────────────────────────────────────────────
CREATE TABLE public.comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug  text        NOT NULL,
  author_id  uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  parent_id  uuid        REFERENCES public.comments(id) ON DELETE CASCADE,
  body       text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  edited_at  timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.comments (post_slug, created_at);
CREATE INDEX ON public.comments (parent_id);

-- ── Reactions ────────────────────────────────────────────────
CREATE TABLE public.reactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  emoji      text NOT NULL CHECK (emoji IN ('👍','🌱','✨','🔬','❤️')),
  UNIQUE (comment_id, member_id, emoji)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions   ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user mutually green-lit with a given member?
CREATE OR REPLACE FUNCTION public.is_connected(other_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
    AND (
      (from_id = auth.uid() AND to_id = other_id)
      OR (to_id = auth.uid() AND from_id = other_id)
    )
  )
$$;

-- Members: anyone can read public profiles; only owner edits own row
CREATE POLICY "members_read_all"    ON public.members FOR SELECT USING (true);
CREATE POLICY "members_insert_own"  ON public.members FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "members_update_own"  ON public.members FOR UPDATE USING (id = auth.uid());

-- Connections: read own connections; insert/update own requests
CREATE POLICY "connections_read_own" ON public.connections FOR SELECT
  USING (from_id = auth.uid() OR to_id = auth.uid());
CREATE POLICY "connections_insert"   ON public.connections FOR INSERT
  WITH CHECK (from_id = auth.uid());
CREATE POLICY "connections_accept"   ON public.connections FOR UPDATE
  USING (to_id = auth.uid()); -- only recipient accepts

-- Comments: visible to author + mutually green-lit members
CREATE POLICY "comments_select" ON public.comments FOR SELECT
  USING (
    author_id = auth.uid()
    OR public.is_connected(author_id)
  );
CREATE POLICY "comments_insert" ON public.comments FOR INSERT
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_update" ON public.comments FOR UPDATE
  USING (author_id = auth.uid());
CREATE POLICY "comments_delete" ON public.comments FOR DELETE
  USING (author_id = auth.uid());

-- Reactions: visible to green-lit members
CREATE POLICY "reactions_select" ON public.reactions FOR SELECT
  USING (
    member_id = auth.uid()
    OR public.is_connected(member_id)
  );
CREATE POLICY "reactions_insert" ON public.reactions FOR INSERT
  WITH CHECK (member_id = auth.uid());
CREATE POLICY "reactions_delete" ON public.reactions FOR DELETE
  USING (member_id = auth.uid());

-- ============================================================
-- Enable Realtime on comments and reactions
-- (run in Supabase dashboard → Database → Replication, or:)
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;

-- ============================================================
-- Seed: 7-member test group, all fully connected
-- ============================================================
-- NOTE: Replace the uuid values below with actual auth.users.id values
-- after the 7 members sign up via magic link. Until then, use this
-- seed as a template and run it manually after sign-ups complete.

-- INSERT INTO public.members (id, handle, display_name, avatar_color) VALUES
--   ('<greg-uuid>',   'greg',   'Greg',   '#00e5ff'),
--   ('<rank-uuid>',   'rank',   'Rank',   '#44ff88'),
--   ('<curt-uuid>',   'curt',   'Curt',   '#ff6644'),
--   ('<evans-uuid>',  'evans',  'Evans',  '#7c4dff'),
--   ('<megan-uuid>',  'megan',  'Megan',  '#ff4db8'),
--   ('<kelly-uuid>',  'kelly',  'Kelly',  '#ffcc44'),
--   ('<ananda-uuid>', 'ananda', 'Ananda', '#4dd9ff');

-- -- Fully-meshed connections for the test group (all pairs, canonical from_id < to_id)
-- INSERT INTO public.connections (from_id, to_id, status, accepted_at)
-- SELECT a.id, b.id, 'accepted', now()
-- FROM public.members a, public.members b
-- WHERE a.id < b.id;
