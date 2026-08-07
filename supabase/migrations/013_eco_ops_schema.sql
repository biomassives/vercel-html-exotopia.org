-- ============================================================
-- Eco Ops field-data schema — sites, monitoring records, SME
-- network, knowledge records, certificates
-- Migration 013
-- ============================================================
-- Backfills version control for the `eco_ops` schema. Per SPEC_ECO_OPS_API.md
-- §2.1/§2.2/§2.3, this schema was stood up directly on the hosted project
-- (dashboard/SQL editor) rather than through a migration — `src/stores/
-- eco-offline.ts` has been calling `supabase.schema('eco_ops').from(...)`
-- against it (monitoring_records, water_quality_obs, macroinvertebrate_samples
-- confirmed live) with no corresponding file here, which meant nobody could
-- audit its RLS/exposure from source. See RISK_REDUCTION_RECOMMENDATIONS.md
-- §5's geolocation-fuzzing recommendation and compliance/INDEX.md's Zimbabwe
-- entry (cross-border transfer notice depends on knowing what's actually
-- collected) — both assume this schema is inspectable, which it wasn't.
--
-- Every statement is IF NOT EXISTS / ON CONFLICT DO NOTHING so this is safe
-- to run against the existing hosted project without dropping live data.
-- It reconstructs the tables from the spec's canonical §2.1 definition; an
-- operator with dashboard access should diff this against the live schema
-- (`\d eco_ops.*` or the Supabase dashboard's table editor) once, since a
-- schema created out-of-band may have drifted from what's written here.
--
-- Scope: the nine core tables in §2.1 (sites through certificates) plus the
-- `eco-ops-photos` storage bucket referenced by 006_photo_retention.sql and
-- `eco-offline.ts`. Deliberately excludes §8a's SME payment columns and
-- §8b's `table_banking_requests` (pgcrypto/Vault-dependent, tied to M-Pesa
-- B2C infrastructure not confirmed live) — those still belong in a
-- dedicated migration once that feature actually ships.

CREATE SCHEMA IF NOT EXISTS eco_ops;

-- ── Sites ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eco_ops.sites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  site_type     text NOT NULL,        -- 'water_quality' | 'forest_garden' | 'rain_garden'
                                       -- | 'bird_blinds' | 'language_doc' | 'pfas' | 'elder_knowledge'
  country_code  char(2) NOT NULL,     -- ISO 3166-1: US KE CR CA GB ...
  region        text,                 -- state/county/watershed/tribal territory
  lat           double precision,
  lng           double precision,
  precision     text DEFAULT '1km',   -- 'exact' | '1km' | '10km' — privacy tier; public-facing
                                       -- display code must round/omit per this tier, never show
                                       -- raw lat/lng for 'exact' rows to non-owners/non-admins
  access_tier   text DEFAULT 'community' CHECK (access_tier IN ('public', 'community', 'private')),
  status        text DEFAULT 'proposed'
                CHECK (status IN ('proposed', 'secured', 'active', 'monitoring', 'archived')),
  partner_orgs  text[],
  community_id  text,
  owner_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sites_owner_idx ON eco_ops.sites (owner_id);
CREATE INDEX IF NOT EXISTS sites_country_idx ON eco_ops.sites (country_code);

-- ── Monitoring records (parent) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS eco_ops.monitoring_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id               uuid REFERENCES eco_ops.sites(id) ON DELETE CASCADE,
  record_type           text NOT NULL,
  observed_at           timestamptz NOT NULL,
  observer_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  observer_alias        text,
  protocol              text,
  photos                text[],
  bounty_issue_number   text,
  pending_photo_upload  boolean DEFAULT false,
  notes                 text,
  proof_hash            text,
  proof_status          text DEFAULT 'pending' CHECK (proof_status IN ('pending', 'anchored', 'verified')),
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monitoring_records_site_idx ON eco_ops.monitoring_records (site_id);
CREATE INDEX IF NOT EXISTS monitoring_records_observer_idx ON eco_ops.monitoring_records (observer_id);

-- ── Water quality observations ───────────────────────────────────
CREATE TABLE IF NOT EXISTS eco_ops.water_quality_obs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id          uuid REFERENCES eco_ops.monitoring_records(id) ON DELETE CASCADE,
  ph                 numeric(4,2),
  turbidity_ntu      numeric(8,3),
  temp_c             numeric(5,2),
  conductivity_us    numeric(8,2),
  dissolved_o2       numeric(5,2),
  nitrate_mgl        numeric(8,4),
  nitrite_mgl        numeric(8,4),
  phosphate_mgl      numeric(8,4),
  ammonia_mgl        numeric(8,4),
  ecoli_cfu          numeric(10,1),
  secchi_depth_m     numeric(5,2),
  bmwp_score         smallint,
  bmwp_families      text[],
  cyano_present      boolean,
  cyano_level        text CHECK (cyano_level IN ('none', 'low', 'medium', 'high', 'bloom')),
  cyano_photos       text[],
  pfas_ppt           numeric(12,6),
  pfas_compounds     jsonb,
  cso_event          boolean DEFAULT false,
  cso_outfall_id     text,
  reported_to_agency boolean DEFAULT false,
  agency_ref         text
);

CREATE INDEX IF NOT EXISTS water_quality_obs_record_idx ON eco_ops.water_quality_obs (record_id);

-- ── Macroinvertebrate samples ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS eco_ops.macroinvertebrate_samples (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id   uuid REFERENCES eco_ops.monitoring_records(id) ON DELETE CASCADE,
  family_name text NOT NULL,
  bmwp_score  smallint NOT NULL,
  count       smallint,
  notes       text
);

CREATE INDEX IF NOT EXISTS macroinvertebrate_samples_record_idx ON eco_ops.macroinvertebrate_samples (record_id);

-- ── Country water quality standards (reference data, not user data) ─
CREATE TABLE IF NOT EXISTS eco_ops.country_standards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    char(2) NOT NULL,
  parameter       text NOT NULL,
  standard_type   text NOT NULL,
  min_value       numeric,
  max_value       numeric,
  unit            text,
  description     text,
  regulatory_body text,
  citation        text,
  effective_date  date,
  UNIQUE (country_code, parameter, standard_type)
);

-- ── SME profiles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eco_ops.sme_profiles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name   text NOT NULL,
  expertise      text[],
  country_codes  char(2)[],
  affiliation    text,
  bio            text,
  availability   text CHECK (availability IN ('remote_only', 'regional', 'national')),
  region         text,
  contact_public boolean DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sme_profiles_user_idx ON eco_ops.sme_profiles (user_id);

-- ── SME engagements (site <-> SME connection) ───────────────────────
CREATE TABLE IF NOT EXISTS eco_ops.sme_engagements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id    uuid REFERENCES eco_ops.sites(id) ON DELETE CASCADE,
  sme_id     uuid REFERENCES eco_ops.sme_profiles(id) ON DELETE CASCADE,
  role       text CHECK (role IN ('reviewer', 'trainer', 'data_advisor', 'partner')),
  status     text DEFAULT 'proposed' CHECK (status IN ('proposed', 'active', 'completed')),
  notes      text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sme_engagements_site_idx ON eco_ops.sme_engagements (site_id);
CREATE INDEX IF NOT EXISTS sme_engagements_sme_idx ON eco_ops.sme_engagements (sme_id);

-- ── Knowledge / library records ──────────────────────────────────────
-- keeper_name/content_text may name and describe a third party (e.g. an
-- Elder) who consented via the submitter's attestation, not directly in
-- Supabase Auth — see legal-privacy.md's third-party-attested-data note.
CREATE TABLE IF NOT EXISTS eco_ops.knowledge_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           uuid REFERENCES eco_ops.sites(id) ON DELETE SET NULL,
  record_type       text NOT NULL CHECK (record_type IN ('elder_session', 'language_doc', 'field_note', 'sme_review')),
  contributor       text,
  contributor_role  text,
  domain_tags       text[],
  content_text      text,
  audio_url         text,
  archive_ref       text,
  access_tier       text DEFAULT 'community' CHECK (access_tier IN ('public', 'community', 'private')),
  language_code     text,
  community_consent boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_records_site_idx ON eco_ops.knowledge_records (site_id);

-- ── Certificates (issued server-side only — see RLS below) ───────────
CREATE TABLE IF NOT EXISTS eco_ops.certificates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      uuid REFERENCES eco_ops.sites(id) ON DELETE SET NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  cert_type    text NOT NULL,
  cert_subtype text,
  country_code char(2),
  co_signers   text[],
  badge_json   jsonb,
  proof_hash   text,
  art_hash_svg text,
  issued_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS eco_ops_certificates_recipient_idx ON eco_ops.certificates (recipient_id);

-- ============================================================
-- Seed data: country_standards (idempotent — matches SPEC_ECO_OPS_API.md §2.3)
-- ============================================================

INSERT INTO eco_ops.country_standards
  (country_code, parameter, standard_type, max_value, unit, regulatory_body, citation) VALUES
('US','ph','drinking', 8.5,'pH units','EPA','National Primary/Secondary DWR 2023'),
('US','nitrate','drinking', 10,'mg/L NO3-N','EPA','40 CFR 141.62'),
('US','ecoli_swim','swimming', 126,'CFU/100mL','EPA','Recreational Water Quality Criteria 2012'),
('US','pfas_pfos','drinking', 0.004,'µg/L','EPA','PFAS MCL Rule 2024'),
('US','pfas_pfoa','drinking', 0.004,'µg/L','EPA','PFAS MCL Rule 2024'),
('KE','ph','drinking', 8.5,'pH units','NEMA','Water Quality Regulations 2006'),
('KE','nitrate','drinking', 50,'mg/L NO3','NEMA','Kenya Gazette Supplement 2006'),
('KE','ecoli_swim','swimming', 200,'CFU/100mL','NEMA','WHO Guidelines adopted'),
('CR','ph','drinking', 8.5,'pH units','SENASA','Decreto 32327 Reglamento AHR'),
('CR','nitrate','drinking', 45,'mg/L NO3','SENASA','Decreto 32327'),
('CR','ecoli_swim','swimming', 200,'CFU/100mL','MINAE','WHO Guidelines adopted'),
('CA','ph','drinking', 8.5,'pH units','Health Canada','GCDWQ 2023'),
('CA','nitrate','drinking', 45,'mg/L NO3','Health Canada','GCDWQ 2023'),
('CA','ecoli_swim','swimming', 100,'E. coli/100mL','Health Canada','Recreational Water Guidelines'),
('GB','ph','drinking', 8.5,'pH units','DWI','Water Supply (Water Quality) Regs 2016'),
('GB','nitrate','drinking', 50,'mg/L NO3','DWI','SI 2016/614'),
('GB','ecoli_swim','swimming', 900,'CFU/100mL','Environment Agency','Bathing Water Regs 2008 — Sufficient class'),
('GB','cso','ecological', 0,'events/year','Environment Agency','Storm Overflow Discharge Reduction Plan 2023')
ON CONFLICT (country_code, parameter, standard_type) DO NOTHING;

-- ============================================================
-- Row Level Security
-- ============================================================
-- Reuses public.is_admin() from 002_rewards.sql (cross-schema call is fine —
-- it only reads public.admin_members, keyed by auth.uid()).

ALTER TABLE eco_ops.sites                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_ops.monitoring_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_ops.water_quality_obs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_ops.macroinvertebrate_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_ops.country_standards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_ops.sme_profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_ops.sme_engagements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_ops.knowledge_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_ops.certificates             ENABLE ROW LEVEL SECURITY;

-- sites: public tier open to all; community/private tiers restricted to the
-- owner and admins. (A full "same community_id" read policy needs a
-- members<->community_id membership table that doesn't exist yet — until
-- then, community-tier sites are treated as owner+admin only, the more
-- conservative reading of §2.2's "community-tier visible to authenticated +
-- same community_id.")
DROP POLICY IF EXISTS "eco_ops_sites_read" ON eco_ops.sites;
CREATE POLICY "eco_ops_sites_read" ON eco_ops.sites FOR SELECT
  USING (access_tier = 'public' OR owner_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "eco_ops_sites_insert" ON eco_ops.sites;
CREATE POLICY "eco_ops_sites_insert" ON eco_ops.sites FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "eco_ops_sites_update" ON eco_ops.sites;
CREATE POLICY "eco_ops_sites_update" ON eco_ops.sites FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin());

-- monitoring_records / water_quality_obs / macroinvertebrate_samples:
-- readable iff the parent site is readable; insertable by the observer.
DROP POLICY IF EXISTS "eco_ops_monitoring_records_read" ON eco_ops.monitoring_records;
CREATE POLICY "eco_ops_monitoring_records_read" ON eco_ops.monitoring_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eco_ops.sites s WHERE s.id = site_id
        AND (s.access_tier = 'public' OR s.owner_id = auth.uid())
    ) OR public.is_admin()
  );
DROP POLICY IF EXISTS "eco_ops_monitoring_records_insert" ON eco_ops.monitoring_records;
CREATE POLICY "eco_ops_monitoring_records_insert" ON eco_ops.monitoring_records FOR INSERT
  WITH CHECK (observer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "eco_ops_water_quality_obs_read" ON eco_ops.water_quality_obs;
CREATE POLICY "eco_ops_water_quality_obs_read" ON eco_ops.water_quality_obs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eco_ops.monitoring_records mr
      JOIN eco_ops.sites s ON s.id = mr.site_id
      WHERE mr.id = record_id AND (s.access_tier = 'public' OR s.owner_id = auth.uid())
    ) OR public.is_admin()
  );
DROP POLICY IF EXISTS "eco_ops_water_quality_obs_insert" ON eco_ops.water_quality_obs;
CREATE POLICY "eco_ops_water_quality_obs_insert" ON eco_ops.water_quality_obs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eco_ops.monitoring_records mr
      WHERE mr.id = record_id AND mr.observer_id = auth.uid()
    ) OR public.is_admin()
  );

DROP POLICY IF EXISTS "eco_ops_macroinvertebrate_samples_read" ON eco_ops.macroinvertebrate_samples;
CREATE POLICY "eco_ops_macroinvertebrate_samples_read" ON eco_ops.macroinvertebrate_samples FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eco_ops.monitoring_records mr
      JOIN eco_ops.sites s ON s.id = mr.site_id
      WHERE mr.id = record_id AND (s.access_tier = 'public' OR s.owner_id = auth.uid())
    ) OR public.is_admin()
  );
DROP POLICY IF EXISTS "eco_ops_macroinvertebrate_samples_insert" ON eco_ops.macroinvertebrate_samples;
CREATE POLICY "eco_ops_macroinvertebrate_samples_insert" ON eco_ops.macroinvertebrate_samples FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM eco_ops.monitoring_records mr
      WHERE mr.id = record_id AND mr.observer_id = auth.uid()
    ) OR public.is_admin()
  );

-- country_standards: reference data, public read, admin-only write
DROP POLICY IF EXISTS "eco_ops_country_standards_read" ON eco_ops.country_standards;
CREATE POLICY "eco_ops_country_standards_read" ON eco_ops.country_standards FOR SELECT USING (true);
DROP POLICY IF EXISTS "eco_ops_country_standards_write" ON eco_ops.country_standards;
CREATE POLICY "eco_ops_country_standards_write" ON eco_ops.country_standards FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- sme_profiles: public read (this is a directory by design — display_name/
-- expertise/affiliation are meant to be discoverable); self-managed write
DROP POLICY IF EXISTS "eco_ops_sme_profiles_read" ON eco_ops.sme_profiles;
CREATE POLICY "eco_ops_sme_profiles_read" ON eco_ops.sme_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "eco_ops_sme_profiles_insert" ON eco_ops.sme_profiles;
CREATE POLICY "eco_ops_sme_profiles_insert" ON eco_ops.sme_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "eco_ops_sme_profiles_update" ON eco_ops.sme_profiles;
CREATE POLICY "eco_ops_sme_profiles_update" ON eco_ops.sme_profiles FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

-- sme_engagements: visible to the site owner and the engaged SME only
DROP POLICY IF EXISTS "eco_ops_sme_engagements_read" ON eco_ops.sme_engagements;
CREATE POLICY "eco_ops_sme_engagements_read" ON eco_ops.sme_engagements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM eco_ops.sites s WHERE s.id = site_id AND s.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM eco_ops.sme_profiles p WHERE p.id = sme_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "eco_ops_sme_engagements_insert" ON eco_ops.sme_engagements;
CREATE POLICY "eco_ops_sme_engagements_insert" ON eco_ops.sme_engagements FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM eco_ops.sites s WHERE s.id = site_id AND s.owner_id = auth.uid())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "eco_ops_sme_engagements_update" ON eco_ops.sme_engagements;
CREATE POLICY "eco_ops_sme_engagements_update" ON eco_ops.sme_engagements FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM eco_ops.sites s WHERE s.id = site_id AND s.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM eco_ops.sme_profiles p WHERE p.id = sme_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

-- knowledge_records: same access_tier pattern as sites; a 'private' or
-- non-consented record is never publicly readable regardless of tier
DROP POLICY IF EXISTS "eco_ops_knowledge_records_read" ON eco_ops.knowledge_records;
CREATE POLICY "eco_ops_knowledge_records_read" ON eco_ops.knowledge_records FOR SELECT
  USING (
    (access_tier = 'public' AND community_consent = true) OR public.is_admin()
  );
DROP POLICY IF EXISTS "eco_ops_knowledge_records_insert" ON eco_ops.knowledge_records;
CREATE POLICY "eco_ops_knowledge_records_insert" ON eco_ops.knowledge_records FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- certificates: issued server-side only (Edge Function using the service
-- role, which bypasses RLS) — recipient/site-owner/admin can read, nobody
-- gets a client-side INSERT/UPDATE policy. Mirrors the reward_events /
-- certificates hardening already done for the public schema in
-- 007_reward_integrity.sql.
DROP POLICY IF EXISTS "eco_ops_certificates_read" ON eco_ops.certificates;
CREATE POLICY "eco_ops_certificates_read" ON eco_ops.certificates FOR SELECT
  USING (
    recipient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM eco_ops.sites s WHERE s.id = site_id AND s.owner_id = auth.uid())
    OR public.is_admin()
  );

-- ============================================================
-- Storage: eco-ops-photos bucket
-- ============================================================
-- Previously created manually via the dashboard (006_photo_retention.sql's
-- header said bucket creation "isn't expressible in a plain SQL migration" —
-- that's not quite right, storage.buckets is a normal table; captured here
-- so a from-scratch self-host doesn't silently miss this bucket.

INSERT INTO storage.buckets (id, name, public)
VALUES ('eco-ops-photos', 'eco-ops-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Photos inherit their site's access_tier via the storage path convention
-- `monitoring/{siteId}/{recordId}-{index}.{ext}` (src/stores/eco-offline.ts).
DROP POLICY IF EXISTS "eco_ops_photos_read" ON storage.objects;
CREATE POLICY "eco_ops_photos_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'eco-ops-photos' AND (
      EXISTS (
        SELECT 1 FROM eco_ops.sites s
        WHERE s.id::text = (storage.foldername(name))[2]
          AND (s.access_tier = 'public' OR s.owner_id = auth.uid())
      )
      OR public.is_admin()
    )
  );

-- Any authenticated user may upload a field-evidence photo (matches
-- monitoring_records' observer-submits-not-just-owner model) — but never
-- update or delete one client-side; the 90-day purge in
-- 006_photo_retention.sql is the only removal path, running as the
-- function's SECURITY DEFINER owner, not a client role.
DROP POLICY IF EXISTS "eco_ops_photos_insert" ON storage.objects;
CREATE POLICY "eco_ops_photos_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'eco-ops-photos' AND auth.uid() IS NOT NULL);
