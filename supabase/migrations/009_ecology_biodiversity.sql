-- ============================================================
-- Ecology & Biodiversity Citizen Science — the logging-table
-- equivalent of 003_pfas_citizen_science.sql for ecology/
-- biodiversity field work (forest gardening, rain gardens,
-- bird blinds, biodiversity surveys, habitat restoration).
-- Migration 009
-- ============================================================
-- Mirrors 003's focus_areas -> decon_projects -> project_log_entries
-- shape exactly (site -> project -> log entries), renamed for this
-- domain. Fully public system (SELECT true throughout), same posture
-- as 003 — meant to be readable by anyone, including signed-out
-- visitors. Reuses is_admin() from 002_rewards.sql.
--
-- What's genuinely new here, not just a rename of 003: ecology_sites
-- carries an access_status lifecycle (unresearched -> map_research_done
-- -> inquiry_sent -> access_confirmed) that PFAS's focus_areas does not.
-- This backs the map-research-session -> letter-of-inquiry workflow in
-- src/data/ecology-fieldwork-library.ts, operationalizing
-- docs/eco-ops-workflow-guide.md Part 1 ("Securing Locations") as real
-- per-site state instead of a static doc checklist nobody's progress is
-- tracked against.
--
-- Endangered-language/knowledge-keeper content is explicitly NOT part of
-- this table — that already has its own table and consent-gated workflow
-- (005_knowledge_keepers.sql, docs Part 6/7). A biodiversity_survey
-- project here that also touches oral history should use both tables,
-- not one instead of the other.
-- ============================================================

BEGIN;

-- ── Ecology sites — a place (real or simulated) with ecology/biodiversity
--    relevance. The access_status column is this table's actual departure
--    from focus_areas: a real, trackable pathway from "found it on a map"
--    to "have permission to work there," not just a description.
CREATE TABLE public.ecology_sites (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by         uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  name               text        NOT NULL,
  description        text,
  habitat_type       text,       -- free text, e.g. 'forest', 'wetland', 'schoolyard', 'urban lot' — same loose-taxonomy convention as focus_areas.contamination_type
  base_address       text,       -- exolocation address, if tied to a specific exoplanet/moon/station
  is_simulated       boolean     NOT NULL DEFAULT true,

  -- Map-research -> letter-of-inquiry -> agreement pipeline. See
  -- src/data/ecology-fieldwork-library.ts for the guided workflow that
  -- moves a site through these states, and docs/eco-ops-workflow-guide.md
  -- Part 1 for the real-world site-securing process this represents.
  access_status      text        NOT NULL DEFAULT 'unresearched'
                                 CHECK (access_status IN (
                                   'unresearched',       -- just created, no map research done yet
                                   'map_research_done',  -- site identified, contact/owner path researched
                                   'inquiry_sent',        -- a letter of inquiry (RFI) has been sent
                                   'access_confirmed',    -- owner/manager has granted access
                                   'not_required'          -- e.g. public right-of-way, no permission step needed
                                 )),
  contact_note       text,       -- who was contacted / response status, free text — the site owner's own running note, not a structured CRM field

  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.ecology_sites (created_by);
CREATE INDEX ON public.ecology_sites (access_status);

-- ── Ecology projects — a specific effort at a site ──────────────────────
CREATE TABLE public.ecology_projects (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id               uuid        NOT NULL REFERENCES public.ecology_sites(id) ON DELETE CASCADE,
  owner_id              uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  title                 text        NOT NULL,
  project_type          text        NOT NULL DEFAULT 'biodiversity_survey'
                                    CHECK (project_type IN (
                                      'biodiversity_survey', 'forest_garden', 'rain_garden',
                                      'bird_blind', 'habitat_restoration', 'other'
                                    )),
  status                text        NOT NULL DEFAULT 'planning'
                                    CHECK (status IN ('planning', 'active', 'monitoring', 'complete')),
  -- Same "simulated project gets a research-branch settlement" pattern as
  -- decon_projects.branch_settlement_id (003) — a parallel/practice version
  -- of the project lives in its own exo-branch-v1 record.
  branch_settlement_id  uuid        REFERENCES public.branch_settlements(id),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.ecology_projects (site_id);
CREATE INDEX ON public.ecology_projects (owner_id);

-- ── Progress log entries — the actual citizen-science logging surface ──
CREATE TABLE public.ecology_log_entries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        NOT NULL REFERENCES public.ecology_projects(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  notes      text        NOT NULL,
  metrics    jsonb       NOT NULL DEFAULT '{}'::jsonb,   -- species counts, canopy %, etc. — shape is per project_type, validated client-side same as project_log_entries.metrics
  logged_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.ecology_log_entries (project_id, logged_at);

-- ============================================================
-- Row Level Security — public read throughout, owner-scoped write.
-- Identical shape to 003_pfas_citizen_science.sql's policies.
-- ============================================================

ALTER TABLE public.ecology_sites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecology_projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecology_log_entries ENABLE ROW LEVEL SECURITY;

-- ecology_sites
CREATE POLICY "ecology_sites_read_all" ON public.ecology_sites FOR SELECT USING (true);
CREATE POLICY "ecology_sites_insert"   ON public.ecology_sites FOR INSERT
  WITH CHECK (created_by = auth.uid() OR public.is_admin());
CREATE POLICY "ecology_sites_update"   ON public.ecology_sites FOR UPDATE
  USING (created_by = auth.uid() OR public.is_admin());

-- ecology_projects
CREATE POLICY "ecology_projects_read_all" ON public.ecology_projects FOR SELECT USING (true);
CREATE POLICY "ecology_projects_insert"   ON public.ecology_projects FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "ecology_projects_update"   ON public.ecology_projects FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin());

-- ecology_log_entries — append-only, no UPDATE policy
CREATE POLICY "ecology_log_entries_read_all" ON public.ecology_log_entries FOR SELECT USING (true);
CREATE POLICY "ecology_log_entries_insert"   ON public.ecology_log_entries FOR INSERT
  WITH CHECK (author_id = auth.uid() OR public.is_admin());

-- ============================================================
-- Points catalogue entry — mirrors decon_progress_log exactly (same
-- points/cap) so self-reported ecology field logging and PFAS progress
-- logging are valued the same way. Inserted here rather than in 007
-- since this action key didn't exist until this table did.
-- ============================================================

INSERT INTO public.points_catalog
  (action_key, track, points, self_report_allowed, daily_cap, description) VALUES
  ('ecology_field_log', 'volunteering', 6, true, 2, 'Self-reported ecology/biodiversity field-work progress log')
ON CONFLICT (action_key) DO NOTHING;

COMMIT;
