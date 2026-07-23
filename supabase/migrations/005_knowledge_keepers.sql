-- ============================================================
-- Wisdom from Elders — Knowledge Keeper contributions
-- Migration 005
-- ============================================================
-- Implements docs/eco-ops-workflow-guide.md Part 7 ("Intersectional
-- Curricula Framework — Wisdom from Elders"). This is deliberately the
-- lightweight, informal path — NOT the formal Endangered Language
-- Documentation protocol in Part 6, which requires Free, Prior and
-- Informed Consent from a community governance body before any recording
-- begins and is not something a graded self-attestation should ever
-- substitute for. If `domain_tags` includes a threatened-language
-- component, route that submission through Part 6's process instead of
-- this table.
--
-- Consent model: graded by the SUBMITTER's relationship to the Knowledge
-- Keeper/elder, self-attested at submission time (same UX pattern as the
-- onboarding age-bracket self-attestation — no ID verification, just an
-- honest question).
--
--   'self' / 'family'   → publishes immediately (trusted attestation)
--   'friend'             → publishes immediately, but the client shows a
--                          reminder to confirm the attribution level with
--                          the Knowledge Keeper first (soft nudge, not a
--                          server-side gate — see AccountPage-adjacent UI)
--   'student_researcher' → held as 'pending_review' until a coordinator
--                          (is_admin()) reviews the required consent_note
--                          and flips status to 'published'
--
-- Submitters with no real relationship to a specific Knowledge Keeper
-- aren't offered this path in the UI at all — general/anonymous
-- "someone told me once" submissions don't belong in this table.

CREATE TABLE public.knowledge_keeper_records (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id        uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  keeper_name         text,       -- as much or as little as they consent to: full name, first name, "anonymous"
  site_ref            text,       -- free-text site/exolocation reference — same loose pattern as focus_areas.base_address
  domain_tags         text[]      NOT NULL DEFAULT '{}',  -- place/plant/animal/season/practice/memory/story
  summary             text        NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 8000),
  technical_link_note text,       -- optional cross-reference to a technical monitoring record, free text
  submitter_relationship text     NOT NULL
                        CHECK (submitter_relationship IN ('self', 'family', 'friend', 'student_researcher')),
  consent_note         text,      -- required (enforced in app + trigger below) when relationship = 'student_researcher'
  status               text        NOT NULL DEFAULT 'published'
                        CHECK (status IN ('published', 'pending_review')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  reviewed_at          timestamptz,
  reviewed_by          uuid        REFERENCES public.members(id)
);

CREATE INDEX ON public.knowledge_keeper_records (submitter_id);
CREATE INDEX ON public.knowledge_keeper_records (status);

-- Server-side enforcement of the tier logic, not just app-level trust —
-- a client bug shouldn't be able to publish a student/researcher
-- submission immediately or skip the consent note.
CREATE OR REPLACE FUNCTION public.enforce_knowledge_keeper_gate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.submitter_relationship = 'student_researcher' THEN
    IF NEW.consent_note IS NULL OR char_length(trim(NEW.consent_note)) = 0 THEN
      RAISE EXCEPTION 'consent_note is required when submitter_relationship is student_researcher';
    END IF;
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending_review';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.status := 'published';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER knowledge_keeper_gate
  BEFORE INSERT ON public.knowledge_keeper_records
  FOR EACH ROW EXECUTE FUNCTION public.enforce_knowledge_keeper_gate();

ALTER TABLE public.knowledge_keeper_records ENABLE ROW LEVEL SECURITY;

-- Published records are public (this is a library-facing feature, per
-- Part 8 — same "fully public" posture as the PFAS tables in 003).
-- Pending-review records are visible only to their submitter and admins,
-- since they may contain a consent_note describing private circumstances.
CREATE POLICY "kkr_read_published" ON public.knowledge_keeper_records FOR SELECT
  USING (status = 'published' OR submitter_id = auth.uid() OR public.is_admin());

CREATE POLICY "kkr_insert_own" ON public.knowledge_keeper_records FOR INSERT
  WITH CHECK (submitter_id = auth.uid());

-- Only admins can move a pending record to published (or reject/edit it) —
-- submitters cannot self-approve their own held submission.
CREATE POLICY "kkr_review_admin" ON public.knowledge_keeper_records FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
