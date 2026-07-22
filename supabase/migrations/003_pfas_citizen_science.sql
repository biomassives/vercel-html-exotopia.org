-- ============================================================
-- PFAS/PFOA Citizen Science — focus areas, decontamination
-- projects, public method proposals, branch settlements
-- Migration 003
-- ============================================================
-- Fully public system (SELECT true throughout) — this is explicitly
-- meant to be readable by anyone, including signed-out visitors,
-- not gated behind green-light connections like the comment system.
-- Reuses is_admin() from 002_rewards.sql.

-- ── Focus areas — a place (real or simulated) with PFAS/PFOA relevance ──
CREATE TABLE public.focus_areas (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by         uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  name               text        NOT NULL,
  description        text,
  contamination_type text        NOT NULL DEFAULT 'PFAS',
  base_address       text,       -- exolocation address, if tied to a specific exoplanet/moon/station
  is_simulated       boolean     NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.focus_areas (created_by);

-- ── Decontamination projects — a specific effort at a focus area ────────
CREATE TABLE public.decon_projects (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  focus_area_id         uuid        NOT NULL REFERENCES public.focus_areas(id) ON DELETE CASCADE,
  owner_id              uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  title                 text        NOT NULL,
  method_proposal_id    uuid,
  status                text        NOT NULL DEFAULT 'planning'
                                    CHECK (status IN ('planning', 'active', 'monitoring', 'complete')),
  branch_settlement_id  uuid,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.decon_projects (focus_area_id);
CREATE INDEX ON public.decon_projects (owner_id);

-- ── Progress log entries — the actual citizen-science logging surface ──
CREATE TABLE public.project_log_entries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        NOT NULL REFERENCES public.decon_projects(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  notes      text        NOT NULL,
  metrics    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  logged_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.project_log_entries (project_id, logged_at);

-- ── Method proposals — publicly proposed cleanup methods with evidence ──
CREATE TABLE public.method_proposals (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id              uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  title                  text        NOT NULL,
  summary                text        NOT NULL,
  method_key             text,       -- optional link to a src/data/pfas-methods-library.ts entry
  precedent_citations    jsonb       NOT NULL DEFAULT '[]'::jsonb,   -- [{title, url, note}]
  economic_argument      text,
  environmental_argument text,
  status                 text        NOT NULL DEFAULT 'proposed'
                                    CHECK (status IN ('proposed', 'endorsed', 'adopted')),
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.method_proposals (author_id);

ALTER TABLE public.decon_projects
  ADD CONSTRAINT fk_method_proposal FOREIGN KEY (method_proposal_id) REFERENCES public.method_proposals(id);

-- ── Proposal endorsements — lightweight public support signal ───────────
-- Same shape as `reactions` (001) but public, not green-light gated.
CREATE TABLE public.proposal_endorsements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.method_proposals(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, member_id)
);

-- ── Branch settlements — first real exo-branch-v1 implementation ────────
-- See SPEC_EXOLOC_ADDRESS.md §3.7. leech_vector is 3 stacked 8-vectors
-- (current[0-7] / aspirational[8-15] / relational[16-23]) per
-- blog-settlements-as-possible-worlds.md — plain structured comparison
-- data, not genuine Leech-lattice sphere-packing/decoding.
CREATE TABLE public.branch_settlements (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id       text        UNIQUE NOT NULL,   -- {owner-slug}-{purpose}-{version}
  branch_type     text        NOT NULL DEFAULT 'research'
                              CHECK (branch_type IN ('public', 'private', 'branded', 'research', 'educational')),
  owner_id        uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  base_address    text        NOT NULL,
  divergence_note text,
  access          text        NOT NULL DEFAULT 'open',
  leech_vector    float8[]    NOT NULL CHECK (array_length(leech_vector, 1) = 24),
  leech_axis      text        DEFAULT 'current' CHECK (leech_axis IN ('current', 'aspirational', 'relational')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.branch_settlements (owner_id);
CREATE INDEX ON public.branch_settlements (base_address);

ALTER TABLE public.decon_projects
  ADD CONSTRAINT fk_branch_settlement FOREIGN KEY (branch_settlement_id) REFERENCES public.branch_settlements(id);

-- ============================================================
-- Proposal endorsement reward — server-side, because it must credit
-- the endorser AND (on the first endorsement) issue a certificate to
-- the proposal's AUTHOR, a different member than the one performing
-- the insert. A plain client insert can't do the author's certificate
-- write under RLS (member_id must equal auth.uid() unless admin), so
-- this mirrors the mentor_session_reward SECURITY DEFINER pattern from
-- 002_rewards.sql. Points value (4) must match
-- POINTS.method_proposal_endorsed in src/data/rewards-catalog.ts.
-- ============================================================

CREATE OR REPLACE FUNCTION public.proposal_endorsement_reward()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  proposal_author  uuid;
  endorsement_count int;
BEGIN
  SELECT author_id INTO proposal_author FROM public.method_proposals WHERE id = NEW.proposal_id;

  INSERT INTO public.reward_events (member_id, track, action_key, points, metadata)
  VALUES (NEW.member_id, 'educating_others', 'method_proposal_endorsed', 4,
          jsonb_build_object('proposal_id', NEW.proposal_id));

  SELECT count(*) INTO endorsement_count FROM public.proposal_endorsements WHERE proposal_id = NEW.proposal_id;

  IF endorsement_count = 1 THEN
    INSERT INTO public.certificates (member_id, certificate_type, settlement_object_key)
    VALUES (proposal_author, 'method_contributor', 'method_contributor_beacon')
    ON CONFLICT (member_id, certificate_type) DO NOTHING;

    UPDATE public.method_proposals SET status = 'endorsed'
      WHERE id = NEW.proposal_id AND status = 'proposed';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_proposal_endorsement_reward
  AFTER INSERT ON public.proposal_endorsements
  FOR EACH ROW EXECUTE FUNCTION public.proposal_endorsement_reward();

-- ============================================================
-- Row Level Security — public read throughout, owner-scoped write
-- ============================================================

ALTER TABLE public.focus_areas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decon_projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_log_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.method_proposals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_settlements   ENABLE ROW LEVEL SECURITY;

-- focus_areas
CREATE POLICY "focus_areas_read_all" ON public.focus_areas FOR SELECT USING (true);
CREATE POLICY "focus_areas_insert"   ON public.focus_areas FOR INSERT
  WITH CHECK (created_by = auth.uid() OR public.is_admin());
CREATE POLICY "focus_areas_update"   ON public.focus_areas FOR UPDATE
  USING (created_by = auth.uid() OR public.is_admin());

-- decon_projects
CREATE POLICY "decon_projects_read_all" ON public.decon_projects FOR SELECT USING (true);
CREATE POLICY "decon_projects_insert"   ON public.decon_projects FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "decon_projects_update"   ON public.decon_projects FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin());

-- project_log_entries — append-only, no UPDATE policy
CREATE POLICY "project_log_entries_read_all" ON public.project_log_entries FOR SELECT USING (true);
CREATE POLICY "project_log_entries_insert"   ON public.project_log_entries FOR INSERT
  WITH CHECK (author_id = auth.uid() OR public.is_admin());

-- method_proposals
CREATE POLICY "method_proposals_read_all" ON public.method_proposals FOR SELECT USING (true);
CREATE POLICY "method_proposals_insert"   ON public.method_proposals FOR INSERT
  WITH CHECK (author_id = auth.uid() OR public.is_admin());
CREATE POLICY "method_proposals_update"   ON public.method_proposals FOR UPDATE
  USING (author_id = auth.uid() OR public.is_admin());

-- proposal_endorsements — append-only, no UPDATE policy
CREATE POLICY "proposal_endorsements_read_all" ON public.proposal_endorsements FOR SELECT USING (true);
CREATE POLICY "proposal_endorsements_insert"   ON public.proposal_endorsements FOR INSERT
  WITH CHECK (member_id = auth.uid());

-- branch_settlements — append-only, no UPDATE policy (a branch's divergence
-- from its base is a fact about when/how it was created, not editable state)
CREATE POLICY "branch_settlements_read_all" ON public.branch_settlements FOR SELECT USING (true);
CREATE POLICY "branch_settlements_insert"   ON public.branch_settlements FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());
