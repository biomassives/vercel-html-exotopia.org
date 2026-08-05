-- ============================================================
-- Video suggestions — a moderation queue for the Eco Ops library
-- (public/ot6a.json, rendered by src/pages/EcoLibrary.vue).
-- Migration 010
-- ============================================================
-- The library itself is a static JSON file with no runtime write path (the
-- page's pre-existing "Edit library" mode posts to /api/save-library and
-- /api/upload-image, but neither exists in this repo — api/ contains only a
-- static gallery1.json. That edit mode was a local-authoring tool, not a
-- live production write path, but it was rendered to every visitor with no
-- gate at all — anyone could open it, even though saving silently 404'd.
-- Fixed alongside this migration: edit mode is now gated on is_admin()
-- client-side (rewards.isAdmin), and this table gives everyone else a real,
-- working way to contribute — a suggestion the admin/editor reviews, not a
-- direct write.
--
-- Approved suggestions are NOT written back into ot6a.json (there is no
-- runtime mechanism to do that against a static file) — EcoLibrary.vue
-- instead merges status='approved' rows into the in-memory library at load
-- time, tagged as community-suggested. Rejected/pending rows are never
-- shown outside the submitter's own view and the admin queue.
-- ============================================================

BEGIN;

CREATE TABLE public.video_suggestions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by  uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  area          text        NOT NULL,   -- matches OtArea.area (EcoLibrary.vue)
  subcat_id     text        NOT NULL,   -- matches OtSubcategory.uniqueId
  youtube_id    text        NOT NULL CHECK (char_length(youtube_id) BETWEEN 1 AND 32),
  title         text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  note          text,       -- why this is a good fit — shown to the reviewer, not the public
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid        REFERENCES public.members(id)
);

CREATE INDEX ON public.video_suggestions (status);
CREATE INDEX ON public.video_suggestions (submitted_by);
CREATE INDEX ON public.video_suggestions (area, subcat_id);

ALTER TABLE public.video_suggestions ENABLE ROW LEVEL SECURITY;

-- Approved suggestions are effectively part of the public library (this is
-- what EcoLibrary.vue merges in for every visitor); pending/rejected are
-- visible only to the submitter and admins, same posture as
-- knowledge_keeper_records' pending_review tier.
CREATE POLICY "video_suggestions_read" ON public.video_suggestions FOR SELECT
  USING (status = 'approved' OR submitted_by = auth.uid() OR public.is_admin());

CREATE POLICY "video_suggestions_insert" ON public.video_suggestions FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

-- Only admins approve/reject — submitters cannot self-approve.
CREATE POLICY "video_suggestions_review" ON public.video_suggestions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
