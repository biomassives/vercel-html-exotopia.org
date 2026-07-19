# SPEC: Eco Ops API and Quasar Framework Plan

**Version 1.1 — July 2026**  
**Status: Phase 0 shipped; Phase 1 in build**

---

## 0. Executive summary

**Version note:** Updated July 2026 to reflect two shipped systems (§11 PWA offline + §12 Bounty Network) and the platform's now-clearly-defined target audiences and geographic scope.

This spec describes the updated API and Quasar frontend architecture for the eco ops lifecycle — from site discovery through multi-year longitudinal monitoring — across five target jurisdictions: **US, Kenya, Costa Rica, Canada, UK**.

### 0.1 What the product now is

SCD Hub Eco Ops is a three-layer system:

1. **Field data platform** — offline-first PWA for environmental monitoring (water quality, PFAS, macroinvertebrates, tick surveillance, phenology, CSO events). Works on Android and iOS without an app store install. Records queue locally in IndexedDB and sync via Background Sync when connectivity returns. Multiple drafts per site. Photo resize before storage. Full local data management panel (§11).

2. **Civic data bounty network** — GitHub Issues as structured procurement for environmental data tasks. Community members claim specific tasks (`/claim` bot), collect data using the platform, and submit to regulatory agencies (EPA, EA, NEMA, SINAC) or directly to the platform database. Payment via M-Pesa, bank transfer, Algorand, or eco:certificate credit. Four bounty categories: field records ($10–50), agency submissions ($25–200), SME review ($100–300), protocol development (negotiated). See §12.

3. **Certificate and recognition layer** — Open Badges 3.0 / W3C VC 2.0 certificates for monitoring contributions, anchored on Algorand. Four PFAS tiers, eco:biodiversity, eco:indigenous (with FPIC), learn:practitioner. E8 lattice ZK proof identity system for trust composition across instances. See §9, §10.

### 0.2 Target groups (now clearly identified)

The product is actively reaching out to and building for:

- **Community field teams in Kenya (Lamu/Mpeketoni), coastal Costa Rica, UK river trusts, US East Coast watershed councils** — primary users of the monitoring wizard and offline PWA
- **Subject matter experts** — limnologists, tick ecologists, PFAS specialists, tribal environmental offices, EA data stewards — recruited via SME bounties and the SME engagement management area (§8a)
- **Educators and curriculum developers** — secondary school and community college instructors implementing PBL units (Tick Watch Northeast, Cyanobacteria Watch, Freshwater Phenology Network)
- **Regulatory agencies** — EPA state portals, EA Data Returns, NEMA, SINAC — as recipients of formal submissions generated through the bounty system
- **Funders and partner organisations** — transparent auditable record of what was collected, when, and what it cost; milestone-based via GitHub milestones

### 0.3 Dual platform presence

- **GitHub** (`biomassives/vercel-html-exotopia.org`) — primary: PRs, Issues, bounty system, GitHub Actions
- **GitLab** — mirror: push-mirrored via GitHub Actions on every merge to `main`; pull-mirror as backup. GitLab Issues for bounties under evaluation for future phase.

**On the UK question: not a pain.** The Rivers Trust network (60+ local river trusts) is already looking for exactly this kind of platform. The combined sewer overflow (CSO) crisis (2022–2025) has created a political moment equivalent to PFAS in the US — massive public appetite, inadequate monitoring infrastructure, and grassroots groups that need tools. UK GDPR is structurally identical to our existing data sovereignty approach. The Environment Agency has a published citizen science data acceptance framework. Unique UK data types (CSO event monitoring, chalk stream surveys) are additional columns in the same schema, not a different schema. The only minor extra: a `country_code` branch in the regulatory reporting pathway. UK is in.

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│  Quasar / Vue 3 / TypeScript frontend                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ EcoOps   │ │ Water    │ │ SME      │ │ Library /     │  │
│  │ Hub      │ │ Quality  │ │ Network  │ │ Elder Records │  │
│  │ (extend  │ │ Dashboard│ │ Page     │ │ Page          │  │
│  │ existing)│ │          │ │          │ │               │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
└───────┼────────────┼────────────┼───────────────┼───────────┘
        │            │            │               │
        ▼            ▼            ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase: eco_ops schema (PostgreSQL + Realtime + Auth)     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ sites    │ │ water_   │ │ sme_     │ │ knowledge_    │  │
│  │          │ │ quality  │ │ profiles │ │ records       │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐ │
│  │ country_ │ │ certif-  │ │ monitoring_records           │ │
│  │ standards│ │ icates   │ │ (parent of type-specific obs)│ │
│  └──────────┘ └──────────┘ └──────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               │ Edge Functions (Deno)
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
  Cloudflare Workers      Algorand          M-Pesa B2C
  (ZK proof trigger,      (proof anchor)    (Kenya payments)
   alert relay)
```

**Backend**: Supabase new `eco_ops` schema (keeps clean separation from `public` blog/member schema).  
**API**: Supabase auto-generated REST (`/rest/v1/`) for CRUD. Supabase Edge Functions for certificate issuance, cross-country aggregation, ZK proof triggers, and alert notifications.  
**Maps**: Leaflet (new dependency, ~42KB gzip, works with offline tile cache via service worker).  
**Real-time**: Supabase Realtime on `monitoring_records` — a monitoring session leader can see co-participants' submissions appear live.

**Offline layer (shipped July 2026):** A PWA service worker (Workbox generateSW) pre-caches the app shell and OSM map tiles. `useEcoOfflineStore` (Pinia) manages an IndexedDB queue (`eco-ops-offline` DB, `submission-queue` + `draft-store`). Records enqueue locally on submit and sync via Background Sync when connectivity returns. `LocalDataPanel.vue`, `OfflineStatusBar.vue`, and `InstallPrompt.vue` are mounted globally in `MainLayout.vue`. See §11.

**Bounty system (shipped July 2026):** GitHub Issues at `biomassives/vercel-html-exotopia.org` act as structured procurement for environmental data tasks. `/claim` and `/unclaim` slash commands drive a GitHub Actions bot that assigns, labels, and confirms. Bounty data files committed to `data/submissions/`. Repository mirrored to GitLab on every merge to `main`. See §12.

---

## 2. Database schema — `eco_ops`

### 2.1 Core tables

```sql
CREATE SCHEMA eco_ops;

-- ─── Sites ────────────────────────────────────────────────────
CREATE TABLE eco_ops.sites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  site_type     text NOT NULL,        -- 'water_quality' | 'forest_garden' | 'rain_garden'
                                      -- | 'bird_blinds' | 'language_doc' | 'pfas' | 'elder_knowledge'
  country_code  char(2) NOT NULL,     -- ISO 3166-1: US KE CR CA GB
  region        text,                 -- state/county/watershed/tribal territory
  lat           double precision,
  lng           double precision,
  precision     text DEFAULT '1km',   -- 'exact' | '1km' | '10km' — privacy tier
  access_tier   text DEFAULT 'community', -- 'public' | 'community' | 'private'
  status        text DEFAULT 'proposed',
                                      -- 'proposed' | 'secured' | 'active' | 'monitoring' | 'archived'
  partner_orgs  text[],               -- org names/IDs co-signing
  community_id  text,                 -- links to member store community group
  owner_id      uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ─── Monitoring records (parent) ───────────────────────────────
CREATE TABLE eco_ops.monitoring_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       uuid REFERENCES eco_ops.sites(id) ON DELETE CASCADE,
  record_type   text NOT NULL,        -- 'water_quality' | 'macroinvertebrate' | 'tick_drag'
                                      -- | 'phenology' | 'strike_survey' | 'pfas_sample'
  observed_at   timestamptz NOT NULL,
  observer_id   uuid REFERENCES auth.users(id),
  observer_alias text,                -- display name
  protocol      text,                 -- 'bmwp' | 'secchi' | 'epa_method_533' | 'drag_cloth' | etc.
  photos        text[],               -- Supabase Storage paths after upload (Phase 1);
                                      -- IPFS CIDs planned as archival layer in Phase 2.
                                      -- In IndexedDB queue, stored as base64 data-URIs pre-sync.
  bounty_issue_number text,           -- GitHub issue # if this record was created for a bounty
  pending_photo_upload boolean DEFAULT false, -- true if record arrived without photo paths (SW sync);
                                      -- Phase 2 background sweep retries uploads for these rows
  notes         text,
  proof_hash    text,                 -- Algorand tx ID from ZK anchor
  proof_status  text DEFAULT 'pending', -- 'pending' | 'anchored' | 'verified'
  created_at    timestamptz DEFAULT now()
);

-- ─── Water quality observations ────────────────────────────────
CREATE TABLE eco_ops.water_quality_obs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id       uuid REFERENCES eco_ops.monitoring_records(id) ON DELETE CASCADE,
  -- Physical parameters
  ph              numeric(4,2),
  turbidity_ntu   numeric(8,3),
  temp_c          numeric(5,2),
  conductivity_us numeric(8,2),      -- µS/cm
  dissolved_o2    numeric(5,2),      -- mg/L
  -- Nutrients
  nitrate_mgl     numeric(8,4),
  nitrite_mgl     numeric(8,4),
  phosphate_mgl   numeric(8,4),
  ammonia_mgl     numeric(8,4),
  -- Biological
  ecoli_cfu       numeric(10,1),     -- CFU/100mL
  secchi_depth_m  numeric(5,2),
  bmwp_score      smallint,
  bmwp_families   text[],            -- Perlidae, Ephemeridae, etc.
  -- Bloom
  cyano_present   boolean,
  cyano_level     text,              -- 'none'|'low'|'medium'|'high'|'bloom'
  cyano_photos    text[],
  -- Contamination
  pfas_ppt        numeric(12,6),     -- for PFAS sample records
  pfas_compounds  jsonb,             -- { "PFOS": 3.2, "PFOA": 1.1, ... }
  -- UK-specific
  cso_event       boolean DEFAULT false, -- combined sewer overflow event observed
  cso_outfall_id  text,              -- EA overflow permit number if known
  -- Reporting
  reported_to_agency boolean DEFAULT false,
  agency_ref      text               -- submission reference number
);

-- ─── Macroinvertebrate samples (standalone for BMWP detail) ───
CREATE TABLE eco_ops.macroinvertebrate_samples (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id   uuid REFERENCES eco_ops.monitoring_records(id) ON DELETE CASCADE,
  family_name text NOT NULL,         -- e.g. 'Perlidae'
  bmwp_score  smallint NOT NULL,     -- 1–10
  count       smallint,              -- number of individuals
  notes       text
);

-- ─── Country water quality standards ──────────────────────────
CREATE TABLE eco_ops.country_standards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    char(2) NOT NULL,
  parameter       text NOT NULL,     -- 'ph' | 'nitrate' | 'ecoli_swim' | 'pfas_pfos' | etc.
  standard_type   text NOT NULL,     -- 'drinking' | 'swimming' | 'ecological' | 'cso'
  min_value       numeric,
  max_value       numeric,
  unit            text,
  description     text,              -- human-readable rule
  regulatory_body text,              -- 'EPA' | 'Environment Agency' | 'NEMA' | 'SENASA' | 'Health Canada'
  citation        text,              -- regulation name + year
  effective_date  date,
  UNIQUE(country_code, parameter, standard_type)
);

-- ─── SME profiles ──────────────────────────────────────────────
CREATE TABLE eco_ops.sme_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id),
  display_name    text NOT NULL,
  expertise       text[],            -- ['tick_ecology','limnology','macroinvertebrates','pfas','language_doc']
  country_codes   char(2)[],         -- jurisdictions they can advise on
  affiliation     text,              -- institution/org
  bio             text,
  availability    text,              -- 'remote_only' | 'regional' | 'national'
  region          text,
  contact_public  boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- ─── SME engagements (site ↔ SME connection) ───────────────────
CREATE TABLE eco_ops.sme_engagements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     uuid REFERENCES eco_ops.sites(id),
  sme_id      uuid REFERENCES eco_ops.sme_profiles(id),
  role        text,                  -- 'reviewer' | 'trainer' | 'data_advisor' | 'partner'
  status      text DEFAULT 'proposed',  -- 'proposed' | 'active' | 'completed'
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- ─── Knowledge / library records ───────────────────────────────
CREATE TABLE eco_ops.knowledge_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         uuid REFERENCES eco_ops.sites(id),
  record_type     text NOT NULL,     -- 'elder_session' | 'language_doc' | 'field_note' | 'sme_review'
  contributor     text,              -- display name (consented)
  contributor_role text,             -- 'Knowledge Keeper' | 'Elder' | 'SME' | 'Community Member'
  domain_tags     text[],            -- ['place','plant','animal','season','practice','memory']
  content_text    text,              -- transcript or summary
  audio_url       text,              -- IPFS CID or ELAR link
  archive_ref     text,              -- ELAR/AILLA/PARADISEC deposit ID
  access_tier     text DEFAULT 'community',
  language_code   text,              -- ISO 639-3
  community_consent boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- ─── Certificates (issued via ZK layer) ────────────────────────
CREATE TABLE eco_ops.certificates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         uuid REFERENCES eco_ops.sites(id),
  recipient_id    uuid REFERENCES auth.users(id),
  cert_type       text NOT NULL,     -- 'eco:monitoring' | 'eco:habitat' | 'eco:indigenous' | 'learn:practitioner'
  cert_subtype    text,              -- 'water_quality' | 'tick_index' | 'forest_garden' | etc.
  country_code    char(2),
  co_signers      text[],
  badge_json      jsonb,             -- Open Badges 3.0 / W3C VC 2.0
  proof_hash      text,              -- Algorand tx ID
  art_hash_svg    text,              -- IPFS CID of E8 art-hash SVG
  issued_at       timestamptz DEFAULT now()
);
```

### 2.2 RLS policies (summary)

```sql
-- Sites: public-tier visible to all; community-tier visible to authenticated + same community_id;
--        private visible only to owner_id and site SMEs
ALTER TABLE eco_ops.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public sites visible to all"
  ON eco_ops.sites FOR SELECT
  USING (access_tier = 'public' OR auth.uid() = owner_id);

-- Water quality obs: inherits from monitoring_record → site access tier
-- SME profiles: public display_name + expertise visible to all authenticated users
-- Knowledge records: access_tier column, same pattern as sites
-- Certificates: recipient + site owner + any SME with engagement on that site
```

### 2.3 Seed data: country_standards (critical rows)

```sql
INSERT INTO eco_ops.country_standards
  (country_code, parameter, standard_type, max_value, unit, regulatory_body, citation) VALUES
-- US EPA
('US','ph','drinking', 8.5,'pH units','EPA','National Primary/Secondary DWR 2023'),
('US','nitrate','drinking', 10,'mg/L NO3-N','EPA','40 CFR 141.62'),
('US','ecoli_swim','swimming', 126,'CFU/100mL','EPA','Recreational Water Quality Criteria 2012'),
('US','pfas_pfos','drinking', 0.004,'µg/L','EPA','PFAS MCL Rule 2024'),
('US','pfas_pfoa','drinking', 0.004,'µg/L','EPA','PFAS MCL Rule 2024'),
-- Kenya (NEMA/WASREB)
('KE','ph','drinking', 8.5,'pH units','NEMA','Water Quality Regulations 2006'),
('KE','nitrate','drinking', 50,'mg/L NO3','NEMA','Kenya Gazette Supplement 2006'),
('KE','ecoli_swim','swimming', 200,'CFU/100mL','NEMA','WHO Guidelines adopted'),
-- Costa Rica (SENASA/MINAE)
('CR','ph','drinking', 8.5,'pH units','SENASA','Decreto 32327 Reglamento AHR'),
('CR','nitrate','drinking', 45,'mg/L NO3','SENASA','Decreto 32327'),
('CR','ecoli_swim','swimming', 200,'CFU/100mL','MINAE','WHO Guidelines adopted'),
-- Canada (Health Canada)
('CA','ph','drinking', 8.5,'pH units','Health Canada','GCDWQ 2023'),
('CA','nitrate','drinking', 45,'mg/L NO3','Health Canada','GCDWQ 2023'),
('CA','ecoli_swim','swimming', 100,'E. coli/100mL','Health Canada','Recreational Water Guidelines'),
-- UK (DWI / Environment Agency)
('GB','ph','drinking', 8.5,'pH units','DWI','Water Supply (Water Quality) Regs 2016'),
('GB','nitrate','drinking', 50,'mg/L NO3','DWI','SI 2016/614'),
('GB','ecoli_swim','swimming', 900,'CFU/100mL','Environment Agency','Bathing Water Regs 2008 — Sufficient class'),
('GB','cso','ecological', 0,'events/year','Environment Agency','Storm Overflow Discharge Reduction Plan 2023');
```

---

## 3. API surface

### 3.1 Auto-generated REST (Supabase)

Supabase generates full REST CRUD for all tables. Primary patterns:

```
GET  /rest/v1/eco_ops.sites?country_code=eq.US&site_type=eq.water_quality
GET  /rest/v1/eco_ops.sites?site_type=eq.water_quality&select=*,monitoring_records(*)
POST /rest/v1/eco_ops.monitoring_records
GET  /rest/v1/eco_ops.water_quality_obs?record_id=eq.<uuid>
GET  /rest/v1/eco_ops.country_standards?country_code=eq.GB
GET  /rest/v1/eco_ops.sme_profiles?expertise=cs.{limnology}&country_codes=cs.{GB}
```

PostgREST operators used heavily: `cs.{}` (contains), `eq.`, `gte.`, `lte.`, `in.(...)`.

### 3.2 Supabase Edge Functions (Deno)

| Function | Trigger | What it does |
|---|---|---|
| `issue-certificate` | POST from frontend after milestone | Generates Open Badges 3.0 JSON, calls ZK E8 proof layer, anchors to Algorand, stores `eco_ops.certificates` row |
| `water-quality-alert` | DB trigger on `water_quality_obs` INSERT | Checks observation against `country_standards`; if any parameter exceeds MCL, sends email/push alert to site owner + SMEs with agency reporting link |
| `match-sme` | POST with site_id | Queries `sme_profiles` by site's `site_type` + `country_code` + `expertise` overlap; returns top 5 matches with availability |
| `aggregate-country` | Scheduled (weekly) | Aggregates water quality observations by country and site_type; writes to `eco_ops.aggregate_cache` for dashboard performance |
| `cso-event-notify` | DB trigger on `water_quality_obs` where `cso_event=true` | UK-only: formats a Rivers Trust / EA-compatible incident report and queues it for the site owner to review and submit |
| `report-to-agency` | POST after owner confirmation | Formats observation data per country reporting standard and sends to: US EPA Volunteer Monitoring Gateway / EA Data Returns API / NEMA Kenya email template / SINASA Costa Rica data portal |

### 3.3 Cloudflare Worker bridges (existing pattern, extended)

```
POST /api/proof/eco-ops    → trigger E8 ZK proof for monitoring record
                             → returns proof_hash for storage in monitoring_records
POST /api/payment/mpesa    → Kenya M-Pesa B2C for monitoring payment trigger
                             → requires anchored proof_hash from above
GET  /api/sites/near       → geospatial query (lat, lng, radius_km)
                             → uses Supabase PostGIS extension, proxied via CF Worker
                               for low-latency edge response
```

---

## 4. Quasar frontend architecture

### 4.1 New pages

The existing route `eco-ops/:area?` already accommodates sub-navigation via the `area` param. Extend with these additional routes in `routes.ts`:

```typescript
// Insert after the existing 'eco-ops' route block:
{
  path: 'eco-ops/sites',
  name: 'eco-ops-sites',
  component: () => import('src/pages/EcoOpSiteListPage.vue'),
  meta: { title: 'Eco Ops · Site Map' },
},
{
  path: 'eco-ops/sites/:siteId',
  name: 'eco-ops-site',
  component: () => import('src/pages/EcoOpSitePage.vue'),
  meta: { title: 'Eco Ops · Site' },
  props: true,
},
{
  path: 'eco-ops/sites/new',
  name: 'eco-ops-site-new',
  component: () => import('src/pages/EcoOpSiteNewPage.vue'),
  meta: { title: 'Eco Ops · Add Site' },
},
{
  path: 'eco-ops/monitor/:siteId',
  name: 'eco-ops-monitor',
  component: () => import('src/pages/MonitoringEntryPage.vue'),
  meta: { title: 'Eco Ops · Submit Observation' },
  props: true,
},
{
  path: 'eco-ops/water',
  name: 'eco-ops-water',
  component: () => import('src/pages/WaterQualityPage.vue'),
  meta: { title: 'Water Quality · Global Dashboard' },
},
{
  path: 'eco-ops/network',
  name: 'eco-ops-network',
  component: () => import('src/pages/SMENetworkPage.vue'),
  meta: { title: 'Eco Ops · Expert Network' },
},
```

Note: The existing `EcoOpsPage.vue` at `/eco-ops/:area?` becomes the hub/dashboard that links out to the new sub-pages. Its existing video library behaviour is preserved and extended with site count stats and quick-action buttons.

### 4.2 New pages (detail)

**`EcoOpSiteListPage.vue`**  
Two-panel layout: Leaflet map (left, ~60% width on desktop, full-screen on mobile with list toggle) + site cards list (right). Map clusters sites by proximity at low zoom. Country filter pill tabs at top: ALL / US / KE / CR / CA / GB. Site type filter chips below. Clicking a site card or map marker → `eco-ops-site` route.

**`EcoOpSitePage.vue`**  
Props: `siteId: string`. Three tabs: Overview (site details, partner orgs, lifecycle status badge), Monitoring (timeline of observations with parameter sparklines), Knowledge (linked elder/language records). Sticky header shows site name, type icon, country flag, and lifecycle stage chip. If the current user is the site owner: edit + add observation buttons. If user has SME engagement on this site: SME review panel.

**`MonitoringEntryPage.vue`**  
Multi-step wizard (Q-Stepper). Step 1: confirm site and date/time. Step 2: record type selection (water quality / macroinvertebrate / tick drag / phenology / PFAS / other). Steps 3+: type-specific data entry forms — each form field shows the relevant country standard threshold as a reference value. Step final: photo upload (Supabase Storage), notes, submit. On submit: creates `monitoring_records` row, then type-specific obs row, then calls `water-quality-alert` Edge Function if water quality type. Certificate milestone check runs in background.

**`WaterQualityPage.vue`**  
Global water quality dashboard. Country selector tabs + parameter filter. Three view modes: Map (Leaflet with colour-coded site markers — green/amber/red by latest observation vs. standard), Timeline (multi-site sparklines for a selected parameter over time), Alerts (sites where latest obs exceeded any country standard). Uses `eco_ops.aggregate_cache` for performance.

**`SMENetworkPage.vue`**  
SME directory with expertise filter chips (tick ecology, limnology, PFAS, macroinvertebrates, language documentation, forest gardening, etc.) and country filter. Calls `match-sme` Edge Function with the user's active site to get ranked suggestions. SME card shows: display name, expertise tags, affiliation, availability, country scope. Contact button opens in-platform message thread (via existing member/comment infrastructure) or — where SME has opted in — shows email.

### 4.3 New Pinia stores

```typescript
// src/stores/ecoSite.ts
// State: sites[], selectedSiteId, mapBounds, filters (country, type, status)
// Actions: fetchSites(), fetchSite(id), createSite(), updateSiteStatus()
// Getters: filteredSites, selectedSite, sitesByCountry

// src/stores/waterQuality.ts
// State: observations[], countryStandards{}, alertSites[]
// Actions: fetchObservations(siteId), submitObservation(), fetchStandards(countryCode)
// Getters: latestByParameter(siteId, param), exceedances(countryCode)
// Note: countryStandards loaded once per session, cached in Pinia; no refetch

// src/stores/ecoNetwork.ts
// State: smeProfiles[], myEngagements[], matchResults[]
// Actions: fetchSMEs(filters), requestEngagement(siteId, smeId), fetchMatchResults(siteId)
// Getters: smesForSite(siteId), expertiseOptions (derived unique list)

// src/stores/ecoLibrary.ts
// State: records[], activeRecordId, searchQuery, domainFilter[]
// Actions: fetchRecords(siteId?), fetchRecord(id), submitRecord()
// Getters: filteredRecords, recordsBySite

// src/stores/eco-offline.ts                                  ← SHIPPED (July 2026)
// Primary offline state — Pinia singleton; all components share the same IDB-backed state.
// IDB v2: 'eco-ops-offline' DB with 'submission-queue' + 'draft-store' object stores.
// State: queue[], drafts[], online, panelOpen, syncing, initialised
// Actions: init() (idempotent bootstrap, registers window online/offline),
//          enqueue(), syncNow() (guarded by syncing flag),
//          saveDraft(), deleteDraft(), draftsForSite(siteId),
//          retryItem(id), removeQueueItem(id), refreshQueue(),
//          cleanSynced(maxAgeDays=7), exportJson() (photos replaced with [photo-omitted])
// Computed: pending, failed, syncedItems, pendingCount, failedCount, draftCount
// Defines: RecordType (union literal), QueuedSubmission, MonitoringDraft
// Key: uses supabase.schema('eco_ops').from(TABLE[item.type]) for schema-qualified queries.
// No teardown() — online/offline listeners are app-scoped; removing them on unmount
// would break detection for the whole app.
```

### 4.4 New composables

```typescript
// src/composables/useWaterParameters.ts
// — thresholds(countryCode, parameter, standardType) → { min, max, unit, body, citation }
// — classify(value, threshold) → 'ok' | 'warning' | 'exceedance'
// — formatValue(value, parameter) → human-readable string with unit
// — bmwpGrade(score) → { grade: 'A'–'E', label: string, colour: string }

// src/composables/useMonitoringWizard.ts                     ← REWRITTEN (July 2026)
// Signature: useMonitoringWizard(siteId, siteName, resumeDraftKey?)
// — imports MonitoringDraft, RecordType from src/stores/eco-offline (not from itself)
// — freshDraft() creates draft with crypto.randomUUID() as draftKey
// — 500ms debounced auto-save to IDB draft-store (not sessionStorage)
// — addPhoto() calls resizePhoto() from src/lib/photo-resize.ts before storing
// — addingPhoto: Ref<boolean> exposed for loading state in templates
// — setNote(note) exposed as explicit setter
// — on submit: store.enqueue() + store.deleteDraft(draftKey); does NOT call Supabase directly
// — validate(step) → string[] of error messages

// src/composables/useOfflineQueue.ts                         ← NOW A SHIM (July 2026)
// Thin compatibility shim over useEcoOfflineStore.
// Returns computed() wrappers for queue, pending, failed, synced, online.
// Delegates enqueue, syncNow, remove, refresh to the store.
// New code should import useEcoOfflineStore directly.

// src/composables/useMapSites.ts
// — initMap(container, options) → Leaflet map instance
// — addSiteMarkers(sites, options) → LayerGroup with click handlers
// — clusterMarkers() → L.markerClusterGroup (requires leaflet.markercluster)
// — colourForStatus(status) → hex colour per lifecycle stage

// src/composables/useSMEMatch.ts
// — matchForSite(siteId) → calls match-sme Edge Function, returns SMEProfile[]
// — sortByRelevance(profiles, site) → applies country + expertise overlap score
```

### 4.5 New components directory: `src/components/eco/`

```
WaterParameterGauge.vue     — radial gauge with threshold zone colouring (SVG, no dep)
MonitoringTimeline.vue      — date-indexed sparkline strip per parameter (Canvas 2D)
BMWPFamilyGrid.vue          — grid of macroinvertebrate family chips, colour = BMWP score tier
CyanobacteriaAlert.vue      — prominent warning card when cyano_level ≥ 'high'
CountryStandardBadge.vue    — inline chip showing regulatory threshold next to a form field
SiteLifecycleBadge.vue      — pill showing lifecycle stage with stage-aware next action
SMEProfileCard.vue          — expert card with expertise chips + engagement button
ElderKnowledgeCard.vue      — knowledge record summary with domain tag chips
CertificatePreview.vue      — compact Open Badges 3.0 certificate card with art-hash thumbnail
SiteCard.vue                — site list card (type icon, country flag, status, last obs date)

// ── Offline / PWA components (SHIPPED July 2026) ──────────────────────────────
LocalDataPanel.vue          — q-dialog (position=bottom), controlled by store.panelOpen.
                              Four q-tab-panels: pending, failed, drafts, synced.
                              Failed tab: error string + Retry button (store.retryItem).
                              Drafts tab: Resume → router.push eco-ops-monitor + draft query param.
                              Synced tab: Clean old (>7 days) → store.cleanSynced().
                              Export JSON downloads file via store.exportJson().
OfflineStatusBar.vue        — fixed-top bar; reads from useEcoOfflineStore directly.
                              Hidden when online and no pending/failed items.
                              Entire bar clickable → store.panelOpen = true.
                              Shows failedCount (purple), pendingCount, Sync button.
                              No onUnmounted teardown (store listeners are app-scoped).
InstallPrompt.vue           — q-dialog bottom-sheet, intercepts beforeinstallprompt.
                              3-second delay; sessionStorage dismiss suppression.
                              Calls deferredPrompt.prompt() on install button click.
```

**Support library:**

```typescript
// src/lib/photo-resize.ts                                    ← SHIPPED (July 2026)
// resizePhoto(source: File | Blob | string): Promise<string>
//   — scales to max 1280px on long edge at 0.78 JPEG quality (5MB → ~150-200KB)
// estimateBase64Kb(dataUri: string): number
// scaledDims(w, h, max): { w, h }
// loadImage(source): Promise<HTMLImageElement>
```

### 4.6 New dependencies to add

```bash
npm install leaflet leaflet.markercluster
npm install @types/leaflet
```

Leaflet is the only new runtime dependency. No charting library needed — sparklines and gauges are light enough to implement in Canvas 2D and inline SVG, keeping the bundle lean.

---

## 5. Monitoring lifecycle support

The platform actively guides groups through six lifecycle stages rather than presenting a static database:

| Stage | Name | Gate to advance | UI state | Platform action |
|---|---|---|---|---|
| 0 | **Discovery** | Create account + browse sites | Read-only map; "Start a site near you" CTA | Show nearby sites; show SME network |
| 1 | **Onboarding** | Site created | `EcoOpSiteNewPage.vue` wizard complete | Auto-match 3 SMEs; show site assessment checklist; link to relevant curriculum unit |
| 2 | **Secured** | Site status updated to 'secured' | Edit site: upload letter of agreement (stored in Supabase Storage, private tier) | Prompt: schedule first monitoring session; suggest monitoring event date |
| 3 | **Active monitoring** | 3+ observations submitted | Monitoring tab shows sparklines | Enable Realtime on the site's monitoring_records; show comparison to similar sites |
| 4 | **Data sharing** | 1 year of observations OR owner opts in | Data sharing panel in site admin | Offer formatted export for EPA VMP / EA Data Returns / NEMA / SINASA |
| 5 | **Knowledge transfer** | Owner opts in as trainer | SME profile creation prompt | Appear in SME match results for new sites of same type + country |

The lifecycle stage is computed from the `sites.status` field + a count of `monitoring_records` + the age of the oldest record. No separate field needed.

---

## 6. Water quality by country

### Parameter coverage and unique per-country additions

| Parameter | US | KE | CR | CA | GB |
|---|---|---|---|---|---|
| pH | ✓ | ✓ | ✓ | ✓ | ✓ |
| Turbidity (NTU) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Temperature (°C) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dissolved oxygen | ✓ | ✓ | ✓ | ✓ | ✓ |
| Nitrate (mg/L) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Phosphate (mg/L) | ✓ | ✓ | ✓ | ✓ | ✓ |
| E. coli (CFU/100mL) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Secchi depth (m) | ✓ | — | ✓ | ✓ | ✓ |
| BMWP score | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cyanobacteria | ✓ | — | ✓ | ✓ | ✓ |
| PFAS/PFOS (ppt) | ✓ | — | — | ✓ | ✓ (EA PFAS roadmap) |
| CSO event flag | — | — | — | — | ✓ (UK-specific) |
| Conductivity (µS/cm) | — | ✓ | — | — | ✓ |

### Reporting pathways (what `report-to-agency` Edge Function targets)

- **US**: EPA Volunteer Monitoring Program Gateway + state programs (varies by state; function routes by site region)
- **Kenya**: NEMA email template (nema.go.ke); WASREB for water service quality; function generates formatted PDF
- **Costa Rica**: SINAC online reporting portal for ecological sites; SENASA for drinking water quality
- **Canada**: Provincial EA data portals (Ontario: MOE; BC: ENV; Quebec: MELCCFP); Health Canada drinking water reporting varies by province; function prompts owner to confirm provincial route
- **UK**: Environment Agency Data Returns API (beta); EA Flood and Coastal Risk Management data team for CSO events; Drinking Water Inspectorate (DWI) for supply quality; function generates EA-compatible CSV + optionally formats a Rivers Trust report

### UK specifics (expanded)

The UK is not a pain because:

1. **Rivers Trust partnership pathway** is formalised. Local river trusts are the natural co-signing partner for UK water quality certificates. There are 60+; any site can be linked to its catchment's river trust.

2. **CSO event monitoring** is genuinely underserved. Water companies are required to publish Event Duration Monitoring (EDM) data but reporting delays are common. Community observation of overflow events (raw sewage reaching a watercourse) can supplement the official record and is legally significant under the Storm Overflow Discharge Reduction Plan 2023. Our `cso_event` boolean + `cso_outfall_id` field gives this a home.

3. **Chalk streams** (93% of world's chalk streams are in England, majority in Hampshire and Hertfordshire) are globally rare and acutely threatened by abstraction and nutrient runoff. A dedicated chalk stream site type (sub-type of `water_quality`) with bespoke parameters (chalk stream BMWP families, groundwater connectivity, watercress presence as indicator) is a Phase 2 addition.

4. **UK GDPR**: same handling as the rest of our data sovereignty approach. Supabase hosts in EU by default; UK users' data can be pinned to the `eu-west-2` (London) region in the Supabase project settings. No extra code.

5. **Surfers Against Sewage integration**: SAS already operates a Water Quality API (API key required, free for NGOs). We can pull their beach and river site ratings into our `WaterQualityPage.vue` UK tab as a comparison layer.

---

## 7. Implementation phases

### Phase 0 — SHIPPED (July 2026)

- **PWA offline layer:** `useEcoOfflineStore` (Pinia + IDB v2), `useMonitoringWizard` (IDB drafts, photo resize), `useOfflineQueue` shim, `OfflineStatusBar`, `InstallPrompt`, `LocalDataPanel`, `photo-resize.ts`. Mounted globally in `MainLayout.vue`. Service worker with Workbox runtimeCaching + Background Sync queue.
- **Civic bounty system:** `.github/` issue templates, `/claim` + `/unclaim` bot, GitLab mirror workflow, CODEOWNERS, PR template, `data/submissions/` tree, `docs/git-collaboration-guide.md`. Blog posts published. First bounty wave pending.
- **`monitoring_records.bounty_issue_number`** column added to schema (§2.1).

### Phase 1 — Core (4–6 weeks)

- Supabase: create `eco_ops` schema, all tables from §2, seed `country_standards`
- `useWaterParameters.ts` composable with threshold lookup
- `EcoOpSiteListPage.vue` + Leaflet map (sites from DB, markers, country filter)
- `EcoOpSitePage.vue` — Overview tab only
- `MonitoringEntryPage.vue` — water quality type only, all parameters for all 5 countries
- `water-quality-alert` Edge Function
- Water parameter gauge component (inline SVG, no dep)
- Routes wired in `routes.ts` (the sub-routes documented in §4.1 are planned but not yet added)
- `ecoSite.ts` + `waterQuality.ts` Pinia stores
- Liability messages L1–L8 wired to UI (§10.7) — required before first user-visible feature
- Create 25 GitHub labels (per §12.4), set branch protection, create Q3/Q4 milestones
- Post first bounty wave (Mpeketoni water, US East HAB, UK CSO)

### Phase 2 — Monitoring depth (4–6 weeks)

- Macroinvertebrate observation type + BMWP family grid component
- Tick drag observation type
- Phenology observation type
- `MonitoringTimeline.vue` sparklines
- Realtime subscription on `monitoring_records` for live co-monitoring sessions
- Certificate milestone triggers → `issue-certificate` Edge Function
- SME match function + `SMENetworkPage.vue`
- `ecoNetwork.ts` store

### Phase 3 — Knowledge and lifecycle (4–6 weeks)

- Knowledge records CRUD + `ecoLibrary.ts` store
- Elder knowledge audio player component
- Site lifecycle stage UI (badges, next-action prompts, data sharing panel)
- `report-to-agency` Edge Function (US + Kenya first; others in Phase 4)
- PFAS observation type
- UK CSO event flag and EA report formatter

### Phase 4 — Scale and partner APIs (ongoing)

- SAS (Surfers Against Sewage) API integration for UK water quality comparison layer
- USA-NPN phenology data import for US phenology sites
- iNaturalist species observation auto-link for sites with biodiversity monitoring
- Chalk stream site sub-type (UK)
- Canada provincial routing in `report-to-agency`
- SME trainer pathway (Stage 5 lifecycle)
- IPFS photo pinning via Pinata as archival layer (Phase 1 uses Supabase Storage only — see §8 Q3)
- GitLab Issues evaluation for bounty management (Phase 1 bounties are GitHub only)

---

## 8. Open questions before Phase 1 build

1. **Supabase project**: ✅ **DECIDED** — Shared project (Option 1): single `eco_ops` schema alongside `public` blog/member schema, single Auth user table. Data portability, new deployment creation, and inter-instance federation are addressed in §10.

2. **Leaflet tile provider**: ✅ **DECIDED** — OpenStreetMap (free, must credit). Offline tile cache via Workbox CacheFirst strategy in service worker (1500 tiles, 30-day TTL). Mapbox and Maplibre deferred to Phase 4 if OSM performance proves insufficient at scale.

3. **Photo storage**: ✅ **DECIDED (Phase 1)** — Supabase Storage bucket `eco-ops-photos` (public bucket for `access_tier=public` sites, authenticated-only for restricted). Path pattern: `monitoring/{siteId}/{recordId}-{index}.{ext}`. Photos are resized on device (max 1280px, JPEG 0.78 quality) via `photo-resize.ts` and stored as base64 data-URIs in IndexedDB before sync. On sync, decoded to Blob and uploaded to Supabase Storage as a non-blocking operation (upload failure logs a warning on the synced record rather than re-queuing the whole record). IPFS pinning via Pinata is a Phase 4 archival option, not Phase 1.

4. **PFAS lab integration**: Consider partnering with Eurofins (US, EU, UK) or TestAmerica for a discounted community sampling rate. Lab submits results via API → auto-populate `pfas_compounds` jsonb. This changes the `MonitoringEntryPage.vue` PFAS flow from manual entry to result confirmation.

5. **Mobile data entry**: ✅ **DECIDED** — Full MVP PWA. Field testing this week with two user groups (Mpeketoni + second group). Workbox generateSW already configured in quasar.config.js — needs runtimeCaching rules, Background Sync queue, IndexedDB draft store, tile pre-cache, offline status bar, and install prompt. See §11.

6. **CSO outfall IDs (UK)**: The EA's EDM database is publicly accessible. A lookup widget in the monitoring entry form that takes a postcode or coordinates and returns nearby permitted overflow points (and their EA permit numbers) would make the `cso_outfall_id` field self-completing rather than requiring the user to look it up manually.

7. **Agency data sharing agreements**: Does the `report-to-agency` Edge Function expose SCD Hub to legal liability if submitted data is inaccurate or if the relevant agency has not consented to third-party submission on behalf of users? Options: (a) function formats and delivers directly to agency API on the user's behalf; (b) function generates a ready-to-submit export file that the user submits themselves; (c) pursue formal MOUs with EPA, EA, NEMA, SENASA, and Health Canada before enabling direct submission. Recommendation: option (b) for Phase 1 (avoids liability, still dramatically reduces friction), with option (a) unlocked per-agency as MOUs are established.

8. **SME engagement and compensation model**: ✅ **DECIDED** — Platform acts as coordination layer only; SMEs send payments directly between parties and upload receipts as confirmation. No payment processing by SCD Hub. Phase 1 builds a lightweight engagement management area covering: hourly rate setting, estimate submission and approval, retainer option, payment schedule tracking, sample terms template, and receipt upload. See §8a below.

---

### §8a — SME Engagement Management: Phase 1 design

**Model:** The platform connects SMEs with sites and provides the coordination scaffolding. Actual payment happens off-platform (bank transfer, M-Pesa, PayPal, whatever the two parties agree). The platform tracks the agreement, the schedule, and receipt confirmation. This avoids payment processing liability and compliance overhead while giving both parties a shared record.

**Workflow:**
1. SME sets `rate_per_hour` and `rate_currency` on their profile
2. Site owner requests an engagement → SME is notified
3. SME submits an estimate: hours × rate, or a retainer proposal (flat amount / period)
4. Site owner approves or counters the estimate
5. Platform surfaces sample terms (template, not legal advice) for both parties to acknowledge before work begins
6. Work happens off-platform
7. SME records payments received and uploads receipts (Supabase Storage, private to both parties)
8. Platform shows running payment status to both parties

**`sme_engagements` table additions:**

```sql
ALTER TABLE eco_ops.sme_engagements
  ADD COLUMN rate_per_hour     NUMERIC(10,2),
  ADD COLUMN rate_currency     CHAR(3)  DEFAULT 'USD',  -- ISO 4217
  ADD COLUMN estimate_hours    NUMERIC(6,1),
  ADD COLUMN estimate_total    NUMERIC(10,2),
  ADD COLUMN estimate_notes    TEXT,
  ADD COLUMN estimate_status   TEXT     DEFAULT 'draft',
                               -- 'draft'|'submitted'|'approved'|'declined'|'countered'
  ADD COLUMN retainer_amount   NUMERIC(10,2),
  ADD COLUMN retainer_period   TEXT,    -- 'monthly'|'quarterly'|'project'
  ADD COLUMN payment_schedule  TEXT,    -- 'on_completion'|'milestone'|'monthly'|'retainer'
  ADD COLUMN terms_template_id TEXT,    -- reference to the sample terms version used
  ADD COLUMN sme_terms_ack     BOOLEAN  DEFAULT FALSE,
  ADD COLUMN sme_terms_ack_at  TIMESTAMPTZ,
  ADD COLUMN client_terms_ack  BOOLEAN  DEFAULT FALSE,
  ADD COLUMN client_terms_ack_at TIMESTAMPTZ,
  ADD COLUMN payment_receipts  TEXT[],  -- Supabase Storage paths, private to both parties
  ADD COLUMN payment_notes     TEXT,
  ADD COLUMN amount_paid       NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN payment_status    TEXT     DEFAULT 'unpaid';
                               -- 'unpaid'|'partial'|'paid'|'retainer_active'
```

**Sample terms template** (stored as `public/print/sme-engagement-terms.html`, linked from the platform and accessible at `/print/sme-engagement-terms`): covers scope description, rate and schedule, IP ownership (work product belongs to the community group unless otherwise agreed), liability cap (limited to fees paid), no employment relationship. Boilerplate with fill-in fields — not legal advice, parties should seek independent counsel for material engagements.

**Phase 1 UI — `SMEEngagementPanel.vue` component:**
- Shown on `EcoOpSitePage.vue` if the current user is a site owner with a pending or active SME engagement
- Shows: SME name + expertise, estimate status chip, terms acknowledgement status, payment schedule with paid/remaining amounts, receipt upload button, payment notes field
- SME-side view (same component, role-conditional rendering): submit/edit estimate, mark payment received, upload receipt

---

### §8b — Mpeketoni Table Banking: M-Pesa B2C Payment Processing (Phase 1)

**Context:** The Eco-Ledger group in Mpeketoni, Lamu County (led by Muirithi Jariffe) operates on a table banking model — members pool contributions and make disbursement requests against the collective balance. This is an internal group payment flow, not an external contractor payment. The M-Pesa B2C infrastructure already exists (Cloudflare Worker relay, triggered by ZK proof for field worker payments). Phase 1 extends it to handle on-the-table disbursement requests.

**This is distinct from §8a (SME payments).** Table banking payments:
- Are between known, verified group members (closed group, not open marketplace)
- Are denominated in KES, paid via M-Pesa B2C
- Require group quorum approval before disbursement fires
- Use the existing CF Worker → M-Pesa B2C infrastructure
- Are recorded in the Eco-Ledger, not the SME engagement system

**Workflow:**
1. Member submits a disbursement request: amount (KES), purpose, request type
2. Platform notifies other group members (push notification or Supabase Realtime)
3. Required quorum of group members approve via platform (e.g. 2-of-5 or majority — configurable per group)
4. On quorum reached → Supabase Edge Function calls the existing CF Worker relay
5. CF Worker calls M-Pesa B2C API → payment sent to requester's registered phone
6. M-Pesa callback updates record status to `paid` with the M-Pesa transaction reference
7. Record written to the Eco-Ledger running balance

**New table: `eco_ops.table_banking_requests`**

```sql
CREATE TABLE eco_ops.table_banking_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           uuid REFERENCES eco_ops.sites(id),
  community_id      text NOT NULL,          -- matches eco_ops.sites.community_id
  requester_id      uuid REFERENCES auth.users(id),
  requester_alias   text,
  mpesa_phone       text NOT NULL,          -- E.164 format e.g. +254712345678
                                            -- stored encrypted at rest (pgcrypto)
  amount_kes        numeric(10,2) NOT NULL,
  purpose           text NOT NULL,
  request_type      text NOT NULL,
                    -- 'loan'|'withdrawal'|'emergency'|'contribution_return'|'project'
  proof_hash        text,                   -- ZK anchor if linked to verified field work
  approvals_needed  smallint DEFAULT 2,     -- quorum threshold, set per group
  approver_ids      uuid[]   DEFAULT '{}',  -- members who have approved
  approval_count    smallint DEFAULT 0,
  status            text     DEFAULT 'pending',
                    -- 'pending'|'approved'|'rejected'|'processing'|'paid'|'failed'
  rejection_reason  text,
  mpesa_ref         text,                   -- M-Pesa originator conversation ID
  mpesa_receipt     text,                   -- M-Pesa receipt number on success
  mpesa_status      text,                   -- 'pending'|'success'|'failed'|'timeout'
  mpesa_raw         jsonb,                  -- full M-Pesa callback payload, for audit
  requested_at      timestamptz DEFAULT now(),
  approved_at       timestamptz,
  paid_at           timestamptz,
  ledger_entry_id   uuid                    -- FK to eco-ledger entry once written
);

-- Phone number encryption (pgcrypto extension must be enabled)
-- Store as: pgp_sym_encrypt(phone, current_setting('app.encryption_key'))
-- Read as:  pgp_sym_decrypt(mpesa_phone::bytea, current_setting('app.encryption_key'))
```

**RLS:** Requests visible only to members of the same `community_id`. Approval action restricted to authenticated members who are not the requester. `mpesa_raw` column visible only to the site owner and platform admin role — never exposed to the requester or general group members.

**New Edge Function: `table-banking-disburse`**

Triggered by `status` transitioning to `'approved'` (via a Postgres trigger on `approval_count >= approvals_needed`):

```typescript
// supabase/functions/table-banking-disburse/index.ts
Deno.serve(async (req) => {
  const { request_id } = await req.json()

  // 1. Fetch request record, verify status = 'approved'
  // 2. Mark status = 'processing' (idempotency guard)
  // 3. POST to existing CF Worker /api/payment/mpesa with:
  //    { phone, amount_kes, reference: request_id, purpose }
  // 4. On CF Worker success → update mpesa_ref, mpesa_status = 'pending'
  // 5. CF Worker / M-Pesa callback fires separately → updates to 'success'|'failed'
  // 6. On success → write Eco-Ledger entry (decrement group balance, record disbursement)
})
```

**CF Worker extension** (`/api/payment/mpesa`) — already exists for field worker payments. Add a `source` field to the payload: `'field_work'` (existing) or `'table_banking'` (new). The Worker routes both through the same M-Pesa B2C call; the `source` is logged for audit.

**M-Pesa callback** — the existing callback handler needs one new branch: if `source === 'table_banking'`, update `table_banking_requests` instead of the field work record.

**Eco-Ledger integration:** On successful payment, write a `ledger_entry` record:
- `type: 'disbursement'`
- `member_id`: requester
- `amount_kes`: disbursed amount
- `request_id`: FK back to `table_banking_requests.id`
- `mpesa_receipt`: for cross-reference
- `balance_after`: running group balance (trigger-computed)

**Phase 1 UI — `TableBankingPanel.vue`:**
- Shown on the Mpeketoni site page (and any other table banking-enabled community site)
- **Member view:** running balance, submit request button (amount, purpose, type), list of own past requests with status chips
- **Approval view:** pending requests from other members — each card shows requester alias, amount, purpose, current approval count vs. quorum; Approve / Decline buttons
- **Admin view:** full request history, ledger balance summary, export to CSV for group records

**Security notes:**
- M-Pesa phone numbers encrypted at rest with pgcrypto symmetric encryption; key held in Supabase Vault (not in the database itself)
- Approval quorum enforced server-side in the Edge Function — client-side approval count is display-only
- `status = 'processing'` set atomically before CF Worker call to prevent double-disbursement on retry
- All M-Pesa callback payloads stored in `mpesa_raw` for audit; accessible only to platform admin

---

---

## §9 — PFAS Citizen Science Strategy: Incentives, Blind Spots, Producer Responsibility, and Focused Action

### 9.1 Why PFAS needs its own strategy layer

PFAS monitoring is different from general water quality monitoring in three ways that require dedicated design:

1. **Source specificity.** Every PFAS compound has a traceable origin: a manufacturer, a product category, a decade of release. A pH measurement is a measurement of current water conditions. A PFOS detection at 8 ppt is evidence linking that water body to a specific industrial practice — AFFF firefighting foam manufacture or use — and potentially to a specific company's liability. The platform can and should surface that connection.

2. **Blind-spot concentration.** PFAS contamination is heavily concentrated near identifiable source categories (old fire stations, military airbases, Teflon/PTFE manufacturing facilities, airports, landfills, agricultural land irrigated with biosolids). These areas are systematically undermonitored because they are often in communities with fewer resources for independent testing, on land controlled by the contaminating institution, or in jurisdictions where agencies have not yet conducted surveys. A community monitoring platform can direct effort to exactly these gaps.

3. **Long-chain vs. short-chain chemistry matters for strategy.** Legacy long-chain PFAS (PFOS, PFOA — ≥8 carbons) are now regulated under EPA MCL rules (2024). Manufacturers replaced them with short-chain variants (PFBS, GenX, PFBA, PFHxA — ≤6 carbons) marketed as "safer" — but short-chain PFAS are more mobile in water, travel further from source, and many are not yet fully regulated. Monitoring programmes that only test for PFOS/PFOA miss the ongoing contamination from the replacement chemicals. Our system tests for both.

---

### 9.2 PFAS source taxonomy

**Long-chain PFAS sources** (legacy, higher bioaccumulation, mostly regulated):

| Compound | Primary source | Carbon chain | EPA MCL (2024) |
|---|---|---|---|
| PFOS | AFFF firefighting foam, military/airport use, Scotchgard | C8 sulfonate | 0.004 µg/L |
| PFOA | Teflon/PTFE manufacturing (DuPont/Chemours), industrial coatings | C8 carboxylate | 0.004 µg/L |
| PFHxS | AFFF formulations, stain-resistant products | C6 sulfonate | 10 µg/L (MRL sum) |
| PFNA | Food packaging, industrial processes | C9 carboxylate | 10 µg/L (MRL sum) |
| HFPO-DA (GenX) | Chemours Fayetteville Works NC — PFOA replacement | polymer | 10 µg/L (MRL sum) |

**Short-chain PFAS sources** (modern, more mobile, partially regulated):

| Compound | Primary source | Carbon chain | Status |
|---|---|---|---|
| PFBS | 3M replacement for PFOS, widely used since 2003 | C4 sulfonate | Health advisory only |
| PFHxA | Non-stick cookware (current generation), food packaging | C6 carboxylate | Under EPA review |
| PFBA | Consumer waterproofing products, ski wax, carpet treatment | C4 carboxylate | Under EPA review |
| PFPeA | Fast food packaging, microwave popcorn bags | C5 carboxylate | Under EPA review |
| 6:2 FTS | Aqueous film-forming foam (newer formulations) | fluorotelomer | Under EPA review |

**Blind-spot source site categories** — areas with known contamination history and systematically insufficient monitoring:

1. **Pre-1995 fire stations** — AFFF training pits, typically on-site or within 500m. Training involved burning fuel and suppressing with AFFF repeatedly over decades. Groundwater beneath and downhill is high priority.
2. **Military bases and National Guard airfields** — highest concentration of AFFF use. Base boundaries do not contain contamination; surrounding residential wells and municipal supply intakes are the exposure pathway.
3. **Civilian airports (>30 years old)** — particularly cargo and GA airports where AFFF systems were tested regularly; less scrutinised than major commercial airports.
4. **PTFE/fluoropolymer manufacturing corridors** — DuPont Washington Works (Parkersburg, WV), Chemours Fayetteville Works (NC), 3M Cottage Grove (MN), and surrounding watersheds. Well-documented but surrounding community monitoring remains sparse.
5. **Industrial parks with chrome plating, semiconductor fabs, or chemical manufacturing** — PFAS used as process aids; releases typically to wastewater systems which then discharge to rivers.
6. **Landfills receiving waste after 1960** — PFAS-containing products (carpets, clothing, food packaging) leach through liner systems; leachate collection failures are common in older cells.
7. **Agricultural land irrigated with municipal biosolids** — wastewater treatment does not remove PFAS; biosolids concentrate it. Land application spreads it to soil and shallow groundwater. Heavily used farmland in the Northeast and Midwest US is a significant blind spot.
8. **Golf courses** — PFAS-containing pesticide formulations, combined with frequent irrigation, create contamination pathways to adjacent residential wells and streams.
9. **High-density takeout/fast food corridors** — grease-resistant food packaging leaches PFHxA and related short-chain compounds to stormwater and receiving waters. Urban stream monitoring downstream of commercial strips.
10. **Textile treatment and dry-cleaning clusters** — PFAS-based stain and water repellent treatments, solvent recovery systems; particularly in garment district / industrial laundry areas.

---

### 9.3 Producer responsibility tracking

Every PFAS compound detected in a monitoring record can be linked upstream to a manufacturer and product category. The platform captures this link and makes it available for regulatory use.

**New table: `eco_ops.pfas_producer_registry`**

```sql
CREATE TABLE eco_ops.pfas_producer_registry (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compound        text NOT NULL,          -- 'PFOS'|'PFOA'|'PFBS'|'GenX'|'PFHxA' etc.
  chain_length    smallint,               -- carbon chain length
  chain_type      text,                   -- 'long'|'short'
  manufacturer    text NOT NULL,          -- '3M'|'DuPont'|'Chemours'|'Dynax' etc.
  product_category text NOT NULL,         -- 'AFFF'|'non-stick cookware'|'food packaging' etc.
  use_period      text,                   -- '1960–2002'|'2003–present' etc.
  regulatory_action text,                 -- EPA enforcement, state AG action, settlement
  notes           text
);

-- Seed rows (representative, not exhaustive):
-- PFOS | 8 | long | 3M | AFFF | 1960–2002 | EPA TSCA order 2000, class action settlements 2018–2023
-- PFOA | 8 | long | DuPont/Chemours | PTFE manufacturing | 1951–2015 | EPA consent decree 2004; Chemours settlement 2023
-- GenX | polymer | long | Chemours | PTFE replacement | 2009–present | NC DEQ enforcement 2017
-- PFBS | 4 | short | 3M | general replacement for PFOS | 2003–present | health advisory only
-- PFHxA | 6 | short | multiple | cookware, food packaging | 2003–present | under EPA review
```

**Linking detections to producers:**

When a `water_quality_obs` record contains a `pfas_compounds` jsonb entry, an Edge Function `pfas-source-attribution` runs in the background:

1. For each detected compound exceeding 10% of its MCL or health advisory value, query `pfas_producer_registry` for matching entries
2. Write attribution records to `eco_ops.pfas_attributions` (observation_id, compound, manufacturer, product_category, confidence: 'possible'|'likely'|'confirmed')
3. Confidence is `possible` by default; becomes `likely` when a nearby registered blind-spot source of that manufacturer's product category exists within 5km; becomes `confirmed` only when an SME reviewer explicitly marks it

**New table: `eco_ops.pfas_attributions`**

```sql
CREATE TABLE eco_ops.pfas_attributions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id  uuid REFERENCES eco_ops.water_quality_obs(id),
  compound        text NOT NULL,
  manufacturer    text,
  product_category text,
  nearby_source_id uuid REFERENCES eco_ops.pfas_source_registry(id),
  confidence      text DEFAULT 'possible',  -- 'possible'|'likely'|'confirmed'
  reviewed_by     uuid REFERENCES eco_ops.sme_profiles(id),
  reviewed_at     timestamptz,
  notes           text
);
```

**Regulatory use:** When a community group reaches 3+ confirmed attributions linking detections to a specific manufacturer or source site, the `report-to-agency` Edge Function gains a new export mode: `pfas_producer_complaint` — formatting the attribution chain as an EPA PFAS Strategic Roadmap complaint package, a state AG referral letter template, or an EWG database submission.

---

### 9.4 Blind-spot site registry and priority scoring

**New table: `eco_ops.pfas_source_registry`**

```sql
CREATE TABLE eco_ops.pfas_source_registry (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,          -- 'Former Pease AFB AFFF training area'
  source_category text NOT NULL,          -- from §9.2 category list (1–10)
  chain_type      text NOT NULL,          -- 'long'|'short'|'both'
  compounds_expected text[],              -- ['PFOS','PFHxS'] based on source type
  lat             double precision,
  lng             double precision,
  country_code    char(2),
  region          text,
  operational_period text,               -- '1962–1999' — when PFAS use occurred
  status          text DEFAULT 'unmonitored',
                  -- 'unmonitored'|'partially_monitored'|'monitored'|'remediated'
  data_sources    text[],               -- ['EWG PFAS map'|'EPA PFAS Strategic Roadmap'|'community submission']
  public          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);
```

**Priority score computation** — a function `eco_ops.pfas_priority_score(lat, lng)` returns a score 0–100 for any coordinate, used to generate the monitoring focus map:

```sql
-- Pseudocode for the scoring function:
-- base_score = 0
-- For each pfas_source_registry entry within 5km:
--   + 40 * (1 - distance_km / 5)   -- proximity weight (max 40 pts at 0km)
--   * chain_weight                  -- long-chain = 1.0; short-chain = 0.8 (more mobile, larger plume)
-- If no monitoring_records for this site in past 365 days: + 30
-- If within 1km of a drinking water well or municipal intake: + 20
-- If compound_expected not in any regulatory survey within 2 years: + 10
-- Cap at 100
```

This score powers:
- The **monitoring focus map** (`WaterQualityPage.vue` PFAS tab) — choropleth heat layer showing priority zones
- The **"Where to monitor next"** prompt shown to users with an active PFAS monitoring site
- The **blind-spot badge** trigger (see §9.5)

---

### 9.5 Certificate and recognition system

PFAS certificates use the standard `eco_ops.certificates` table with `cert_type = 'pfas'` and the following `cert_subtype` values. They are issued automatically at milestones by the `issue-certificate` Edge Function, or manually by an SME reviewer for pattern and producer-link tiers.

**Tier 1 — Individual monitoring commitment**

| cert_subtype | Trigger | What it means |
|---|---|---|
| `pfas:first-sample` | First `water_quality_obs` with any PFAS compound | Entered the monitoring network |
| `pfas:monitor-5` | 5 samples submitted, any sites | Consistent contributor |
| `pfas:monitor-25` | 25 samples submitted | Dedicated monitor |
| `pfas:longitudinal` | ≥4 samples at same site over ≥12 months | Long-term site steward |
| `pfas:blind-spot` | Sample submitted from a site scoring >70 on `pfas_priority_score` with no prior data | Filled a documented gap |

**Tier 2 — Source intelligence**

| cert_subtype | Trigger | What it means |
|---|---|---|
| `pfas:upstream-trace` | Samples both upstream and downstream of a registered blind-spot source site | Established a contamination gradient |
| `pfas:short-chain` | Detected a short-chain compound (PFBS, GenX, PFHxA, PFBA) not yet in regulatory databases for this location | Advanced detection — compounds the agency isn't yet looking for |
| `pfas:source-flag` | Attribution confidence upgraded to `likely` by SME review on ≥2 samples | Data linked to a probable source |

**Tier 3 — Network and collective impact**

| cert_subtype | Trigger | What it means |
|---|---|---|
| `pfas:network-sentinel` | Contributing member of a regional cluster of ≥5 connected monitoring sites showing consistent pattern | Part of a network producing systemic evidence |
| `pfas:compound-fingerprint` | SME-confirmed multi-site attribution establishing a compound fingerprint linking to a single source | Data contributed to a production chain traceback |
| `pfas:producer-link` | Attribution chain included in a regulatory complaint, AG referral, or legal filing | Monitoring data became evidence |
| `pfas:community-trainer` | Trained ≥3 other community members in PFAS monitoring protocol | Knowledge multiplier |

**Tier 4 — System-level recognition**

| cert_subtype | Trigger | What it means |
|---|---|---|
| `pfas:expert-reviewer` | SME who has reviewed and confirmed ≥10 PFAS attribution records | Peer-validation authority |
| `pfas:policy-contributor` | Data formally cited in an EPA comment, state rulemaking dossier, or EWG database submission | Regulatory impact recognised |
| `pfas:sentinel-annual` | `pfas:longitudinal` for 3+ consecutive years | Long-term guardian designation |

**Visual distinction:** PFAS certificates generate a variant art-hash SVG using the standard E8 Coxeter projection but with a blue-water colour palette (deep blue at the centre rings, teal at the outer ring) instead of the default ink-wash. This makes PFAS certificates visually distinguishable at a glance in the library and on member profiles while maintaining the same ZK proof verification properties.

**Certificate networking:** When 5 or more `pfas:monitor` or higher certificates from different members reference monitoring data within the same 10km radius, the platform auto-generates a **Regional PFAS Monitoring Network** entry in the library — a collective record linking all the individual certificates, their data, and the attribution chain. This collective record is co-signed by all contributing members and is what gets submitted to regulatory bodies.

---

### 9.6 Upstream producer responsibility — action pathway

The goal is to convert dispersed community monitoring data into usable, well-documented evidence for producer accountability. The pathway:

```
Individual sample → SME attribution review → Regional pattern → Regulatory package
       ↓                      ↓                     ↓                  ↓
  first-sample cert     source-flag cert      network-sentinel    producer-link cert
                                              cert (collective)
```

**Regulatory packages the platform generates** (via `report-to-agency` Edge Function, PFAS producer mode):

- **EPA PFAS Strategic Roadmap complaint** — formatted submission to EPA's PFAS compliance and enforcement programme; includes site coordinates (generalised to protect submitter), compound detections with dates, source attribution chain, and certificate verification links
- **State AG referral template** — pre-formatted letter to state attorney general citing relevant state PFAS law (Maine, Michigan, New York, California, Minnesota have strong state-level PFAS enforcement); includes the same attribution chain with a plain-language summary for non-technical staff
- **EWG PFAS contamination map submission** — data contribution to the Environmental Working Group's publicly accessible contamination map; this is the most visible action and often the one that triggers media coverage
- **AFFF litigation support packet** — for communities within the geographic scope of the AFFF class action settlements or related litigation; formatted data package with chain-of-custody notes, suitable for submission to a plaintiff's attorney as supporting documentation

**What the platform does not do:** Provide legal advice, represent communities in legal proceedings, or guarantee any regulatory outcome. The packages are tools for communities and their chosen advocates.

---

### 9.7 Focus/direction system — Phase 1 UI

**`WaterQualityPage.vue` — PFAS tab additions:**

- **Priority heat map layer** — Leaflet overlay computing `pfas_priority_score` for a grid of points within the current map view; rendered as a choropleth (white → amber → red). Clicking a high-priority cell shows: nearest blind-spot source category, expected compounds, last monitoring date (or "never"), "Start monitoring here" CTA.

- **"Where to monitor next" panel** — shown to logged-in users; computes the highest-priority unmonitored or under-monitored location within 50km of their registered home region. Shows: priority score, source category, expected compounds (long/short chain), nearest registered monitoring site for reference, link to start a new site.

- **Compound coverage gap indicator** — for each country, shows which short-chain compounds have no regulatory data in the current map view. If a user's monitoring tests for those compounds, their data fills a genuine regulatory gap — this is surfaced explicitly to motivate testing for the full panel.

- **Producer attribution panel** — shown when a monitoring site has SME-reviewed attributions. Displays: detected compounds → mapped manufacturer → regulatory action status for that manufacturer. If a community has `pfas:producer-link` potential (attribution is `likely` or `confirmed` and no complaint has been filed), a "Generate regulatory package" button appears.

**Certificate showcase** — on the member profile and on the site page, PFAS certificates are displayed with their distinctive blue-water art-hash alongside the monitoring data they certify. The collective Regional Network record (when triggered) displays on the map as a cluster marker — hovering shows the network name, contributing member count, compound detections, and the art-hash of the collective certificate.

---

---

## §10 — Instance Federation, Data Portability, and Inter-Instance Communication

### 10.1 Architecture: hub + federated instances

The canonical SCD Hub deployment (exotopia.org, single Supabase project, Option 1) is the **hub instance**. Any organisation can export their community's data and run a **standalone instance** — their own Supabase project, their own Vercel/Appwrite deployment, their own domain — without SCD Hub's involvement. Instances can then subscribe to one another for content discovery, and verify each other's certificates cryptographically without needing to trust the issuing instance.

```
                    ┌──────────────────────────────┐
                    │  SCD Hub Hub Instance         │
                    │  exotopia.org                 │
                    │  Supabase: shared eco_ops     │
                    │  schema, canonical registry   │
                    └──────┬───────────┬────────────┘
                   RSS/    │           │   ZK proof
                 WebSub    │           │   verify
                    ↓      │           │      ↓
          ┌─────────────┐  │  ┌────────────────────┐
          │ Standalone  │  │  │ Standalone Instance │
          │ Instance A  │◄─┘  │ B (Appwrite node)   │
          │ (Mpeketoni) │     │ (Costa Rica SINAC)  │
          │ Self-hosted │     │ Self-hosted          │
          └──────┬──────┘     └──────────┬──────────┘
                 │  E8/Λ₂₄               │
                 │  composite             │
                 │  trust vector ─────────┘
                 │  (bilateral partnership
                 │   art-hash generated)
```

**Key principle:** Certificates are verifiable on any instance without contacting the issuing instance. The ZK proof is anchored on Algorand — public, permanent, requires no trust in SCD Hub or any federation partner.

---

### 10.2 Data export: formats and scope

Every community group has the right to export all data they have contributed. Export is triggered from the site admin panel and runs as an async Edge Function job.

**New table: `eco_ops.export_jobs`**

```sql
CREATE TABLE eco_ops.export_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       uuid REFERENCES eco_ops.sites(id),
  requested_by  uuid REFERENCES auth.users(id),
  status        text DEFAULT 'queued',
                -- 'queued'|'running'|'complete'|'failed'
  format        text DEFAULT 'full',
                -- 'full'|'monitoring_csv'|'certificates_jsonld'|'library_archive'
  storage_path  text,           -- Supabase Storage path once complete
  ipfs_cid      text,           -- IPFS CID if pinned (for archival exports)
  expires_at    timestamptz,    -- download link expiry (7 days)
  error_msg     text,
  created_at    timestamptz DEFAULT now(),
  completed_at  timestamptz
);
```

**Export formats:**

| Format | Contents | Use case |
|---|---|---|
| `full` | All tables for this site, JSON-LD, zipped | Import into a new instance |
| `monitoring_csv` | All `water_quality_obs` + `monitoring_records` as CSV | Spreadsheet / academic use |
| `certificates_jsonld` | All certificates as Open Badges 3.0 / W3C VC 2.0 JSON-LD | Wallet import, institutional recognition |
| `library_archive` | All `knowledge_records` + audio files (IPFS links preserved) | Community archival, ELAR supplement |
| `pfas_regulatory` | PFAS observations + attributions, formatted for EPA/EA/EWG | Regulatory submission |

**Full export bundle structure (zip):**

```
site-export-<site_id>-<date>/
  manifest.json           ← site metadata, export date, schema version, hub instance DID
  sites.json              ← site record
  monitoring/
    records.json          ← all monitoring_records
    water_quality.json    ← all water_quality_obs
    macroinvertebrates.json
    pfas_attributions.json
  certificates/
    <cert_id>.jsonld      ← one file per certificate, full W3C VC 2.0
    index.json
  knowledge/
    records.json
    audio_refs.json       ← IPFS CIDs / ELAR links (audio not bundled, linked)
  sme_engagements/
    engagements.json      ← excludes phone numbers and mpesa_raw
  README.md               ← import instructions for a new instance
  PROVENANCE.md           ← hub instance DID, export timestamp, Algorand anchor refs
```

**Edge Function: `export-site-data`** — runs async, writes zip to Supabase Storage private bucket, notifies site owner via Supabase Realtime when complete. Download link expires in 7 days. Owner can request a fresh export at any time.

---

### 10.3 New deployment creation wizard

Any user can create a new standalone instance. The wizard runs in-app at `/onboard/new-instance` and produces a deployment package.

**Three deployment targets:**

**A — SCD Hub hosted** (default, zero setup): community stays on exotopia.org Supabase, gets their own `community_id` namespace. No separate deployment. Easiest — selected by default for new groups.

**B — Self-hosted Supabase + Vercel**: community runs their own Supabase project and Vercel deployment. Wizard generates:
- `supabase/migrations/` — all `eco_ops` schema SQL files, pre-populated with `country_standards` seed data
- `.env.example` — all required environment variables with instructions
- `vercel.json` — pre-configured for SPA + print folder exclusion
- `INSTANCE_README.md` — step-by-step setup guide (Supabase project creation, Vercel deploy, env vars, first migration)
- `instance-config.json` — instance DID request (pending Algorand registration), hub URL, community metadata

**C — Appwrite standalone node**: community runs their own Appwrite instance (Docker or Appwrite Cloud). Wizard generates an Appwrite migration equivalent and a connector adapter that maps Appwrite collections to the same API surface the Quasar frontend expects. This path is Phase 3 — the adapter spec is included in the export but the frontend connector is not yet built.

**Instance registration (optional):** After setup, the new instance operator can register in the hub's `eco_ops.instance_registry`. This is opt-in — unregistered instances are fully functional but not discoverable from the hub's federation map.

---

### 10.4 Instance registry schema

```sql
CREATE TABLE eco_ops.instance_registry (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_did    text UNIQUE NOT NULL,   -- did:algo:<INSTANCE_ROOT_ADDRESS>
  name            text NOT NULL,          -- 'Mpeketoni Eco-Ledger Instance'
  base_url        text NOT NULL,          -- 'https://mpeketoni.ecoops.example.org'
  operator_org    text,                   -- 'Uni-Kibaoni-Peace-Youth-SHG'
  country_code    char(2),
  region          text,
  site_categories text[],                 -- ['water_quality','forest_garden','pfas']
  e8_root_vector  jsonb,                  -- 8-element array: this instance's E8 identity
  public_key_b64  text,                   -- Ed25519 public key for signed payloads
  rss_feed_url    text,                   -- canonical RSS feed endpoint
  websub_hub_url  text,                   -- WebSub hub for push (optional)
  status          text DEFAULT 'active',  -- 'active'|'inactive'|'unverified'
  verified_at     timestamptz,            -- when hub last verified the instance is live
  registered_at   timestamptz DEFAULT now()
);

CREATE TABLE eco_ops.instance_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id   uuid REFERENCES eco_ops.instance_registry(id),
  publisher_id    uuid REFERENCES eco_ops.instance_registry(id),
  feed_type       text NOT NULL,          -- 'sites'|'certificates'|'monitoring'|'library'|'pfas_alerts'
  composite_vector jsonb,                 -- E8/Λ₂₄ composite trust vector for this pair
  composite_art_hash_cid text,            -- IPFS CID of the partnership art-hash SVG
  status          text DEFAULT 'active',
  established_at  timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, publisher_id, feed_type)
);
```

**E8/Λ₂₄ bilateral trust vector:** When two instances establish a subscription pair, a composite identity vector is computed: `E_composite = w_A × E_A + w_B × E_B (mod Λ_E8)`, where `E_A` and `E_B` are the instances' registered E8 root vectors and weights are equal (0.5 each). This composite is projected to the Coxeter plane and rendered as a partnership art-hash SVG — a unique visual identity for the A↔B relationship, stored on IPFS and displayed on both instances' federation pages. If `|contributors| > 8`, the composite promotes to `Λ₂₄`. Certificates issued from collaborative work spanning both instances use this composite as their lattice identity.

---

### 10.5 RSS feeds — public content layer

Each instance exposes RSS 2.0 feeds for its public-tier content. These are static JSON feeds generated by a scheduled Edge Function (`generate-feeds`, runs hourly) and served from Supabase Storage as cacheable files — no live database query on read.

**Feed endpoints (served from `/feeds/` — excluded from SPA routing via `vercel.json`):**

| URL | Contents | Update frequency |
|---|---|---|
| `/feeds/sites.rss` | New public sites registered | On new site created |
| `/feeds/certificates.rss` | New certificates issued (public sites only) | On certificate issued |
| `/feeds/monitoring.rss` | New monitoring records (public sites, summary only) | Hourly batch |
| `/feeds/library.rss` | New public knowledge records | On record created |
| `/feeds/pfas-alerts.rss` | PFAS exceedance alerts for public sites | On exceedance detected |
| `/feeds/network.rss` | New Regional PFAS Network records | On network record created |

**Feed item structure** (RSS 2.0, with custom `<eco:>` namespace extensions):

```xml
<item>
  <title>Water quality monitoring — Mpeketoni Creek, Lamu County</title>
  <link>https://exotopia.org/#/eco-ops/sites/uuid</link>
  <guid isPermaLink="false">urn:eco-ops:monitoring:uuid</guid>
  <pubDate>Tue, 01 Jul 2026 09:00:00 +0000</pubDate>
  <eco:site_id>uuid</eco:site_id>
  <eco:record_type>water_quality</eco:record_type>
  <eco:country_code>KE</eco:country_code>
  <eco:proof_hash>ALGORAND_TX_ID</eco:proof_hash>
  <eco:cert_id>uuid</eco:cert_id>         <!-- if a certificate was issued -->
  <eco:art_hash_cid>Qm...</eco:art_hash_cid>  <!-- IPFS CID of art-hash SVG -->
  <description>pH 7.2, BMWP score 64 (Good). Secchi depth 1.8m.</description>
</item>
```

The `<eco:proof_hash>` element allows any RSS reader or downstream system to independently verify the item against the Algorand blockchain without trusting the feed publisher.

**`vercel.json` update** — add `/feeds/` to the static passthrough alongside `/print/`:

```json
{ "source": "/feeds/:path*",  "destination": "/feeds/:path*" },
{ "source": "/print/:path*",  "destination": "/print/:path*" },
{ "source": "/(.*)",          "destination": "/index.html"   }
```

And in `quasar.config.js` `STATIC_PREFIXES`: add `'/feeds/'`.

**WebSub (W3C PubSubHubbub):** For instances that want push rather than polling, each RSS feed declares a `<atom:link rel="hub">` pointing to a lightweight WebSub hub (Superfeedr or a self-hosted go-pubsubhubbub instance). When the `generate-feeds` Edge Function writes a new feed, it sends a WebSub notification. Subscribing instances receive the update within seconds rather than waiting for the next poll cycle.

---

### 10.6 Internal communication in the 24D system

Beyond RSS/WebSub (which is for content discovery), the 24D Leech lattice system provides a **trust and identity layer** for authenticated inter-instance communication — things RSS cannot do: verified certificate exchange, collaborative proof generation, and private channel establishment between known instances.

**What the 24D system enables that RSS does not:**

| Need | RSS/WebSub | 24D lattice channel |
|---|---|---|
| Public content discovery | ✓ | — |
| Verify a certificate without trusting the issuer | ✗ (trust the feed) | ✓ (Algorand anchor) |
| Private monitoring data between two trusted instances | ✗ | ✓ (composite vector = shared key) |
| Co-sign a joint certificate spanning two instances | ✗ | ✓ (composite proof, both E8 vectors) |
| Detect tampering in a relayed message | ✗ | ✓ (ZK proof check) |
| Establish a new trust relationship without SCD Hub involvement | ✗ | ✓ (peer E8 handshake) |

**Instance-to-instance handshake protocol:**

```
Instance A                              Instance B
    │                                       │
    │── POST /api/federation/propose ──────►│
    │   { did_a, e8_vector_a, pub_key_a,   │
    │     feed_types[], nonce }             │
    │                                       │
    │◄── { did_b, e8_vector_b, pub_key_b, ─┤
    │      nonce_signed_by_b }              │
    │                                       │
    │  Both compute:                        │
    │  E_composite = reduce(                │
    │    0.5×E_a + 0.5×E_b, Λ_E8)         │
    │  art_hash = coxeter_project(          │
    │    E_composite)                       │
    │  Pin art_hash SVG to IPFS             │
    │                                       │
    │── POST /api/federation/confirm ──────►│
    │   { composite_cid, feeds_accepted }   │
    │                                       │
    │  Both write instance_subscriptions    │
    │  row with composite_vector +          │
    │  composite_art_hash_cid               │
```

For `|instances| > 8` in a collaborative network (e.g. SINAC Costa Rica + Mpeketoni Kenya + Rivers Trust UK + 6 others), the composite promotes to Λ₂₄. The 24 dimensional composite vector then carries all partner identities and projects to a joint art-hash that represents the entire network partnership — the same mathematical property used for multi-contributor field work certificates, now applied at the instance level.

**Private channel for restricted data:** Once a bilateral composite vector is established, it can be used as a symmetric encryption key seed for transmitting community-tier or private-tier monitoring data between instances — for example, a community group in Mpeketoni sharing detailed table banking records with a partner cooperative in Nairobi running their own instance, without that data passing through SCD Hub.

---

### 10.7 Liability messages — required copy and placement

The following messages are **non-negotiable platform text**. They must appear at the specified locations verbatim or with only localisation changes (language translation permitted; substance changes require legal review).

---

**L1 — Data accuracy disclaimer**  
*Appears on: every monitoring record detail view, every water quality observation, every export download*

> **Community-generated data.** The monitoring results on this page were collected by community volunteers using field instruments and citizen science protocols. This data has not been independently verified by a certified laboratory or regulatory authority. It should not be used as the sole basis for decisions about drinking water safety, medical treatment, or legal compliance. If you have concerns about your water supply, contact your local health department or a certified water testing laboratory.

---

**L2 — PFAS results disclaimer**  
*Appears on: any page or export containing PFAS compound detections*

> **PFAS monitoring results — not a regulatory test.** These results were produced using field sampling methods and may not meet chain-of-custody or analytical quality requirements for regulatory compliance, enforcement, or litigation. Results showing exceedances of EPA or other regulatory limits should be confirmed by a certified laboratory before regulatory action is taken. For certified testing resources, contact your state health department or the EPA Safe Drinking Water Hotline: 800-426-4791 (US).

---

**L3 — Certificate recognition disclaimer**  
*Appears on: all certificate detail pages, certificate export downloads, and the onboarding wizard*

> **Certificate status.** Certificates issued by this platform are verifiable digital credentials aligned with Open Badges 3.0 and W3C Verifiable Credentials 2.0 standards. They are cryptographically anchored and tamper-proof. Recognition by educational institutions, employers, or government bodies is at the discretion of those bodies and is not guaranteed by SCD Hub. SCD Hub makes no representation that these certificates satisfy licensing, professional qualification, or regulatory requirements in any jurisdiction.

---

**L4 — Producer attribution disclaimer**  
*Appears on: all PFAS attribution records and any generated regulatory packages*

> **Attribution — not a legal finding.** Source attributions shown on this platform are based on the proximity of monitoring data to known contamination source categories and compound-manufacturer correlations in published research. They represent a possible or probable connection, not a legal determination of causation or liability. Attribution confidence levels (possible / likely / confirmed by SME) do not constitute expert legal testimony. Communities considering legal action should consult a qualified environmental attorney.

---

**L5 — Standalone instance operator notice**  
*Appears on: the deployment creation wizard (Step 1, before any setup), and in `INSTANCE_README.md`*

> **You are the operator.** By creating a standalone deployment of this platform, you become the responsible operator for that instance. You are responsible for: compliance with applicable data protection law in your jurisdiction (including GDPR, UK GDPR, Australia Privacy Act, Kenya Data Protection Act, or equivalent); compliance with applicable online safety legislation; content moderation obligations; maintaining the security of your deployment; and honouring users' rights to their data. SCD Hub provides open-source software and documentation. It is not the operator of your instance, is not responsible for your users' data, and accepts no liability for your deployment's operation. You may export all data from your instance at any time. SCD Hub retains no copy of data held on standalone instances.

---

**L6 — Table banking / M-Pesa payments notice**  
*Appears on: TableBankingPanel.vue, first visit and on every disbursement request form*

> **Payment notice.** Disbursements are processed via M-Pesa B2C on behalf of the community group. SCD Hub facilitates the technical transfer only. SCD Hub does not hold, lend, or guarantee community funds. The community group is responsible for the accuracy of disbursement decisions and the management of the group's collective balance. If a payment fails, contact your group administrator. SCD Hub is not liable for failed transactions, incorrect phone numbers, or group fund management decisions.

---

**L7 — SME engagement / payment coordination notice**  
*Appears on: SMEEngagementPanel.vue and on `/print/sme-engagement-terms`*

> **Independent parties.** SCD Hub provides coordination tools for SME engagements but is not a party to any agreement between a subject matter expert and a community group. SCD Hub does not process, hold, or guarantee any payment. Disputes between parties are resolved between those parties. The sample terms template provided is not legal advice.

---

**L8 — RSS / federation content notice**  
*Appears in RSS feed `<description>` channel element and on the federation settings page*

> **Federated content.** Some content displayed on or distributed by this instance may originate from federated partner instances. SCD Hub does not verify, moderate, or take responsibility for content originating from standalone or partner instances. ZK proof verification confirms that a certificate was anchored on the Algorand blockchain by the stated issuing instance; it does not constitute SCD Hub endorsement of the certificate's claims.

---

### 10.8 Implementation notes for Phase 1

| Item | Location | Phase |
|---|---|---|
| `export_jobs` table + Edge Function | Supabase migration + functions/ | 1 |
| Full export bundle generator | `export-site-data` Edge Function | 1 |
| Deployment wizard `/onboard/new-instance` | New Quasar page | 1 |
| `instance_registry` + `instance_subscriptions` tables | Supabase migration | 1 |
| RSS feed generator (`generate-feeds` Edge Function) | functions/ | 1 |
| `/feeds/` static passthrough (vercel.json + quasar.config.js) | Config files | 1 |
| L1–L8 liability messages wired to UI | Components (inline) | 1 — must ship with first feature that triggers them |
| WebSub hub integration | Edge Function extension | 2 |
| E8/Λ₂₄ instance handshake (`/api/federation/`) | CF Worker + DB | 2 |
| Composite art-hash for bilateral partnerships | ZK proof layer | 2 |
| Private channel encryption (composite vector as key seed) | CF Worker | 3 |
| Appwrite connector adapter | Standalone | 3 |

**Critical:** Liability messages L1–L8 are not optional UI polish — they are Phase 1 requirements and must be wired before any feature they govern is accessible to users. L5 (operator notice) must appear before a user can complete the deployment wizard. L1 and L2 must appear before a user can view or download monitoring data containing exceedances.

---

*This spec is the authoritative reference for the eco ops API build. File as a living document — update sections as decisions close.*

---

## §11 PWA MVP — Offline Field Use

**Status:** DECIDED (Q5) — Full MVP PWA, testing this week with two user groups (Mpeketoni + second group).

**Goal:** Field workers must be able to open the app with no signal, complete a full monitoring entry, attach photos, and submit — with automatic retry when connectivity returns. Zero manual steps for the user post-submission.

---

### 11.1 Architecture summary

```
Field device (PWA)
  ├── Service Worker (Workbox generateSW)
  │     ├── App shell: precached (HTML/JS/CSS) — always instant
  │     ├── OSM tiles: CacheFirst, 1500 tiles, 30-day TTL
  │     ├── Supabase REST GET: NetworkFirst, 3s timeout, 24h cache
  │     ├── Supabase Storage: CacheFirst, 200 entries, 7 days
  │     ├── monitoring_records POST: NetworkOnly + Background Sync queue
  │     └── water_quality_obs POST: NetworkOnly + Background Sync queue
  │
  ├── useEcoOfflineStore (Pinia + IDB)  ← PRIMARY SOURCE OF TRUTH
  │     ├── IDB v2: 'eco-ops-offline' DB
  │     │     ├── 'submission-queue' object store (status: pending|syncing|synced|failed)
  │     │     └── 'draft-store' object store (keyed by crypto.randomUUID() draftKey)
  │     ├── Singleton — all components share the same reactive state
  │     ├── init() registers window online/offline listeners (once, app-scoped)
  │     ├── syncNow() guarded by syncing flag — no concurrent runs
  │     ├── Photo upload: non-blocking; upload failure = warning, not re-queue
  │     └── Store defines RecordType, QueuedSubmission, MonitoringDraft types
  │
  ├── useOfflineQueue (composable shim)
  │     └── Thin wrapper over useEcoOfflineStore for backward compatibility
  │
  ├── useMonitoringWizard (IDB draft store)
  │     ├── Signature: useMonitoringWizard(siteId, siteName, resumeDraftKey?)
  │     ├── Multiple concurrent drafts — each gets crypto.randomUUID() draftKey
  │     ├── Debounced auto-save: 500ms after any field change → store.saveDraft()
  │     ├── addPhoto() calls resizePhoto() (photo-resize.ts) before storing
  │     └── On submit: store.enqueue() + store.deleteDraft(draftKey)
  │
  ├── LocalDataPanel (q-dialog, position=bottom)
  │     ├── Controlled by store.panelOpen
  │     ├── Tabs: pending | failed | drafts | synced
  │     ├── Failed: error string + Retry (store.retryItem)
  │     ├── Drafts: Resume → router.push eco-ops-monitor?draft=<draftKey>
  │     └── Synced: Clean old >7 days; Export JSON
  │
  ├── OfflineStatusBar (fixed top bar)
  │     ├── Hidden when online + no pending/failed items
  │     ├── Reads from useEcoOfflineStore directly (not useOfflineQueue)
  │     ├── Entire bar clickable → store.panelOpen = true
  │     ├── Shows failedCount (purple) + pendingCount + Sync button
  │     └── Slides in/out with CSS transition
  │
  └── InstallPrompt (bottom sheet dialog)
        ├── Intercepts beforeinstallprompt event
        ├── Shows 3 seconds after page load (first visit)
        ├── sessionStorage dismiss suppression (not localStorage — session-scoped)
        └── Disappears permanently after appinstalled event
```

---

### 11.2 Files created / updated

| File | Status | Purpose |
|---|---|---|
| `src/stores/eco-offline.ts` | **New** (primary) | Pinia store — single source of truth; IDB v2; defines RecordType, QueuedSubmission, MonitoringDraft |
| `src/lib/photo-resize.ts` | **New** | Canvas resize to 1280px max, JPEG 0.78 quality before IDB storage |
| `src/composables/useOfflineQueue.ts` | **Rewritten** (shim) | Backward-compat wrapper over useEcoOfflineStore |
| `src/composables/useMonitoringWizard.ts` | **Rewritten** | Multi-step wizard; IDB draft persistence; multiple concurrent drafts; photo resize |
| `src/components/eco/LocalDataPanel.vue` | **New** | Four-tab panel: pending / failed / drafts / synced |
| `src/components/eco/OfflineStatusBar.vue` | **New** | Fixed-top status bar; reads from store directly |
| `src/components/eco/InstallPrompt.vue` | **New** | beforeinstallprompt intercept; session-scoped dismiss |
| `src/layouts/MainLayout.vue` | **Updated** | Mounts OfflineStatusBar, InstallPrompt, LocalDataPanel |
| `quasar.config.js` → `pwa:` section | **Updated** | Manifest + 6 Workbox runtimeCaching strategies |

`OfflineStatusBar`, `InstallPrompt`, and `LocalDataPanel` are all mounted in `MainLayout.vue` — present across all routes.

**Key architectural note:** `RecordType` is defined in `eco-offline.ts` and imported by `useMonitoringWizard.ts` (not the reverse). This resolves the circular import that would result from the wizard defining types that the store imports.

---

### 11.3 Manifest (key fields)

```json
{
  "name": "Exotopia Eco Ops",
  "short_name": "Eco Ops",
  "display": "standalone",
  "start_url": "/#/eco-ops",
  "theme_color": "#1a73e8",
  "background_color": "#0a0f1e",
  "shortcuts": [
    { "name": "New monitoring record", "url": "/#/eco-ops/monitor" },
    { "name": "My sites",             "url": "/#/eco-ops/sites" }
  ]
}
```

Shortcuts appear in Android long-press and Windows taskbar right-click — gives field workers one-tap access to start a record from the home screen.

---

### 11.4 Record types supported (useMonitoringWizard)

| `RecordType` | Steps | Primary use |
|---|---|---|
| `water_quality` | 5 | pH, DO, turbidity, nutrients, biological |
| `macroinvertebrate` | 4 | BMWP family tally, score |
| `tick_drag` | 4 | Transect, count by life stage |
| `phenology` | 4 | Species, phenophase (USA-NPN protocol) |
| `pfas_sample` | 5 | Sample details, results if known, chain of custody |
| `cso_event` | 4 | CSO outfall observation (UK / US) |

---

### 11.5 Background Sync vs manual retry

Background Sync (Workbox `NetworkOnly + backgroundSync`) is used for POST requests rather than manual retry because:

1. **Survives app closure** — critical for 3G in Kenya where the user may close the browser before connectivity returns
2. **Order preservation** — single named queue `monitoring-submit-queue` processes both record types in insertion order
3. **24-hour retention** — `maxRetentionTime: 1440` minutes; gives a full day of intermittent connectivity to deliver the POST
4. **No duplicate logic** — useOfflineQueue handles the UI visibility layer; the SW queue handles the actual network delivery

If Background Sync is not supported (iOS Safari < 17), useOfflineQueue's `window.addEventListener('online', syncNow)` provides the same result with a small UX difference: the user must keep the tab open until they regain connectivity.

---

### 11.6 Photo handling

**Before storage (on device):**  
`useMonitoringWizard.addPhoto()` calls `resizePhoto()` from `src/lib/photo-resize.ts` before adding the photo to the draft. This scales every photo to a maximum of 1280 pixels on the long edge at JPEG 0.78 quality, reducing typical camera photos from 3–8 MB to approximately 150–200 KB per photo. The resized photo is stored as a base64 data-URI in the IDB `draft-store` as part of the draft object.

**On submit (enqueue):**  
The draft including photo data-URIs is moved to the `submission-queue` object store via `store.enqueue()`. The photos remain as base64 data-URIs in IDB until sync.

**On sync (`syncNow()`):**  
1. The Supabase record (`monitoring_records` + type-specific obs) is posted first
2. Each photo data-URI is decoded to a `Blob` and uploaded to Supabase Storage bucket `eco-ops-photos` at path `monitoring/{siteId}/{recordId}-{index}.{ext}`
3. Photo upload is a **non-blocking, best-effort** operation: if upload fails, a warning is logged on the synced record and the record is still marked `synced`. The record does not re-queue due to a photo upload failure.
4. The monitoring record's `photos` column is updated with the Supabase Storage paths after successful upload.

**Caveat:** If the SW Background Sync fires the Supabase POST before `syncNow()` runs (i.e. the record syncs via service worker while the app is closed), the record will land in the database without photo paths. Phase 2 adds a `pending_photo_upload: boolean` column so a background sweep can retry photo uploads for records that arrived without them.

---

### 11.7 Testing checklist (two user groups, this week)

**Group A — Mpeketoni field team (Kenya)**
- [ ] Install PWA on Android via Chrome
- [ ] Open app, navigate offline (airplane mode)
- [ ] Complete a `water_quality` record with 2 photos
- [ ] Confirm OfflineStatusBar shows pending count
- [ ] Re-enable connection, confirm auto-sync + status clears
- [ ] Verify record appears in Supabase `eco_ops.monitoring_records`
- [ ] Verify photos in Supabase Storage `eco-ops-photos/monitoring/`
- [ ] Test draft restore: half-fill a form, close tab, re-open

**Group B — second test group**
- [ ] Same flow on iOS Safari (no Background Sync — test manual sync path)
- [ ] Test install prompt appears and "Add to Home Screen" works
- [ ] Test shortcuts from home screen icon long-press
- [ ] Test OSM tile caching: load site map, go offline, pan the map


---

## §12 — Civic Data Bounty System

**Status:** Shipped (July 2026). GitHub infrastructure in `.github/`. Blog posts published. First bounty wave pending.

### 12.1 What it is

GitHub Issues used as structured procurement for environmental data tasks. A bounty issue specifies: what to collect, from where, to what protocol standard, with what evidence, for what payment. The system is fully transparent and auditable — the issue, claim event, PR, review, and payment status are all public Git history.

This is not a freelancer marketplace. It is a civic infrastructure procurement mechanism. The tasks it pays for are tasks that environmental agencies, watershed councils, and public health programmes need done but lack the field capacity to do.

### 12.2 Four bounty categories

| Category | Range | Who claims | What they deliver |
|---|---|---|---|
| Field record | $10–50 | Community members, field teams | Platform monitoring record + 2 photos + GPS |
| Agency submission | $25–200 | Community members with protocol training | Above + formal filing to EPA / EA / NEMA / SINAC + confirmation number |
| SME review | $100–300 | Credentialled specialists | Review memo, corrected protocol doc, species ID |
| Protocol development | Negotiated | Ecologists, regulatory specialists | New monitoring protocol for platform, passes peer review |

### 12.3 Issue templates

Two YAML-based GitHub issue templates:

- `.github/ISSUE_TEMPLATE/bounty-agency-submission.yml` — dropdowns for region, agency, submission type, bounty amount, payment method; required fields for data requirements and verification criteria; FPIC checkbox for indigenous site work
- `.github/ISSUE_TEMPLATE/bounty-field-record.yml` — simpler form for field data bounties without agency submission component
- `.github/ISSUE_TEMPLATE/config.yml` — disables blank issues, links to protocol guide and platform

### 12.4 Label taxonomy

Must be created manually in GitHub Issues → Labels (GitHub does not read a labels file):

**Bounty:** `bounty`, `bounty:$10` `bounty:$25` `bounty:$50` `bounty:$75` `bounty:$100` `bounty:$150` `bounty:$200+`

**Status pipeline:** `status:open` → `status:claimed` (bot) → `status:submitted` (PR open) → `status:verified` (data confirmed) → `status:paid` (payment sent)

**Region:** `region:us` `region:ke` `region:cr` `region:uk` `region:ca`

**Type:** `type:water-quality` `type:pfas` `type:tick` `type:hab` `type:macroinvert` `type:phenology` `type:cso`

**Agency:** `agency:epa` `agency:ea` `agency:nema` `agency:sinac` `agency:state`

**Accessibility:** `good first issue` `help wanted`

### 12.5 The /claim bot

GitHub Actions workflow at `.github/workflows/bounty-claim.yml`.

**Trigger:** issue comment created, containing `/claim`, on an issue labelled `bounty`.

**Actions on `/claim`:**
1. Remove `status:open`, add `status:claimed`
2. Add commenter to issue assignees
3. Post confirmation comment with next-steps checklist

**Actions on `/unclaim`:**
1. Remove `status:claimed`, restore `status:open`
2. Remove commenter from assignees
3. Post "released" comment

**Permissions required:** `issues: write` (provided by `GITHUB_TOKEN` — no additional secrets).

**Edge cases not yet handled (Phase 1 known gaps):**
- `/claim` on an already-`status:claimed` issue — bot does not warn, silently re-labels; Phase 2 will add a "this is already claimed by @handle" reply
- No verification that claimer has required expertise or equipment — review stage handles this
- No deadline enforcement — maintainer manages manually; stale claimed issues released after 10 days silence (7-day check-in + 3 days)
- `status:submitted` label not set by bot — maintainer sets manually when PR is opened (future: PR-open webhook could automate this)

### 12.6 Data submission file structure

```
data/
  submissions/
    2026-Q3/
      us-east/     -- field records, HAB reports, tick data
      kenya/       -- Mpeketoni sites, NEMA submissions
      costa-rica/  -- SINAC biodiversity, SETENA
      uk/          -- CSO events, EA Data Returns
    2026-Q4/
  templates/
    water-quality-record.json  -- canonical JSON template
```

File naming: `<site-slug>-<record-type>-<YYYY-MM-DD>.<ext>`

### 12.7 Payment infrastructure by region

| Region | Method | Infrastructure |
|---|---|---|
| Kenya | M-Pesa B2C | Cloudflare Worker relay (existing from table banking). Mpeketoni group: quorum approval required. Individual claimers: direct disbursement. |
| US | Bank transfer (ACH/wire) | Manual via project banking; SWIFT for international |
| UK | Bank transfer (BACS/SEPA) | Manual via project banking |
| Costa Rica | Bank transfer (SWIFT) | Manual |
| All regions | Algorand ALGO | Direct to wallet address provided in PR comment |
| All regions | eco:certificate credit | Platform-internal; avoids payment complexity for academic/institutional contributors |

### 12.8 PR template additions

`.github/PULL_REQUEST_TEMPLATE.md` includes a Bounty Submission section that all data PRs must fill:
- Agency / programme
- Site name & country
- Record type
- Platform record ID (from Local Data panel Synced tab after sync)
- Agency tracking / confirmation number
- Evidence checklist (photos, CoC form, confirmation email)

### 12.9 Milestone structure

GitHub milestones map to monitoring seasons:

| Milestone | Due date | Scope |
|---|---|---|
| Q3-2026 US East | 2026-09-30 | Tick, HAB, water quality — summer window |
| Q3-2026 Kenya | 2026-09-30 | Mpeketoni water + macroinvertebrate baseline |
| Q3-2026 Costa Rica | 2026-09-30 | SINAC biodiversity submissions |
| Q4-2026 PFAS | 2026-12-15 | PFAS sampling push before winter |

### 12.10 GitLab mirror

Two options, both documented in `docs/git-collaboration-guide.md`:

**Option A — GitLab pull mirror:** GitLab polls GitHub every ~5 minutes. Zero GitHub config needed. Set up entirely in GitLab (Settings → Repository → Mirroring). Recommended as baseline.

**Option B — GitHub Actions push:** `.github/workflows/mirror-to-gitlab.yml` pushes on every merge to `main`. Requires two GitHub secrets: `GITLAB_TOKEN` (GitLab Project Access Token, `write_repository` scope) and `GITLAB_REPO` (GitLab path, e.g. `biomassives/exotopia-org`). Instant sync.

Bounty Issues remain on GitHub only. GitLab is read/code mirror, not Issue mirror, in Phase 1.

### 12.11 CODEOWNERS

`.github/CODEOWNERS` assigns `@biomassives` as default reviewer for all paths. High-risk paths (payment logic, GitHub Actions, Vercel config) require explicit review regardless of contributor write-access level. Add co-maintainers as a named column alongside `@biomassives` as the team grows.

### 12.12 Phase 1 implementation checklist

- [x] Issue templates (`bounty-agency-submission.yml`, `bounty-field-record.yml`, `config.yml`)
- [x] PR template with Bounty Submission section
- [x] CODEOWNERS
- [x] GitLab mirror workflow (needs `GITLAB_TOKEN` + `GITLAB_REPO` secrets to activate)
- [x] `/claim` + `/unclaim` bot workflow
- [x] `data/submissions/` directory tree
- [x] `data/templates/water-quality-record.json`
- [x] `docs/git-collaboration-guide.md`
- [ ] Create GitHub labels (manual — 25 labels per taxonomy in §12.4)
- [ ] Set branch protection on `main` (require 1 PR review, status checks)
- [ ] Add `GITLAB_TOKEN` and `GITLAB_REPO` secrets to GitHub
- [ ] Create Q3-2026 and Q4-2026 milestones in GitHub
- [ ] Post first wave of bounty issues (Mpeketoni water quality, US East HAB, UK CSO)
- [ ] Confirm M-Pesa B2C disbursement tested for individual claimers (not just table banking group flow)

### 12.13 Relationship to SME engagement area (§8a)

The bounty system and the SME engagement management area (§8a) serve different but overlapping functions:

| Bounty system | SME engagement area |
|---|---|
| GitHub Issues — public, transparent | Platform UI — may be private |
| Anyone can claim | Targeted invitations to specific SMEs |
| Payment per task, on completion | Hourly rates, retainers, ongoing engagements |
| Protocol-following field workers and community scientists | Credentialled professionals with their own methodologies |
| Payment via M-Pesa / bank / ALGO | Off-platform, upload receipts as confirmation |

In practice: an SME might first engage via an SME review bounty (low commitment, public, one-time task) and then move to an ongoing engagement through the §8a management area. The bounty system is the discovery and onboarding layer; the engagement management area is the ongoing relationship layer.

---

*Living document. Update as decisions close, systems ship, and field testing produces findings.*

---

---

## §13 — User Onboarding and Minor-Safe Design

**Status:** Shipped (July 2026). `src/pages/OnboardPage.vue` + `src/composables/useGuestProfile.ts`.

### 13.1 Design goals

Two requirements shaped this section:

1. **Pre-connection useability** — the platform must work for someone who has just installed the PWA, has intermittent connectivity, or has not yet created an account. Onboarding wizard state must survive a page refresh, tab close, or browser restart.

2. **Safe participation for minors without identity verification** — the platform serves secondary school educators, youth groups (Fana Ka, Mpeketoni cooperatives), and PBL curriculum programmes. Young participants must be able to use monitoring, learning, and certificate features without the platform requiring government-issued ID, age verification, or parental consent tracking. Safety is achieved through participation mode design and coordinator accountability, not surveillance.

### 13.2 Pre-connection: guest profile persistence

`src/composables/useGuestProfile.ts` is a singleton composable that:
- Generates a stable `guestId` (`crypto.randomUUID()`) on first visit, persisted in `localStorage`
- Mirrors all onboarding wizard state to `localStorage` on every change (deep watch)
- Restores state on mount — the user picks up exactly where they left off after a page refresh, battery death, or network outage
- Exposes `accountPayload()` — the profile fields to upsert into Supabase `profiles` when the user creates an account, preserving their local IDB monitoring drafts under the same `guestId`

The onboarding wizard is fully functional with no network connection. A user can:
- Complete all five steps of the wizard
- Install the PWA from the install prompt (shown on step 0)
- Start a monitoring record and have it queue in IDB
- Create an account later — the queued data syncs and is attributed to the new account

### 13.3 Five-step onboarding wizard

| Step | Key | Content | Gate |
|---|---|---|---|
| 0 | Role | Who are you? (Field worker / Artist / Educator / Coordinator / Explorer) | Role selected |
| 1 | Community | Which group are you joining? (named communities + solo) | Community selected |
| 2 | Joining as | Participation mode — see §13.4 | Mode selected |
| 3 | Your Place | Display name → reserved exoplanet settlement preview | Name ≥ 2 chars |
| 4 | Start | Settlement chip + first actions (role-specific or youth-simplified) | — (complete) |

Step 4 mount calls `complete()` on the guest profile, setting `onboardingComplete: true` in localStorage.

### 13.4 Participation modes

Three modes, self-declared on step 2. No verification is performed — the mode activates UX constraints by design.

**`adult_individual`** — Default for adults joining solo. All platform features: monitoring, learning, bounty claims, financial features (M-Pesa, ALGO, bank), on-chain settlement.

**`group_member`** — Joining through a community group, watershed council, educator, or programme. Optional invite code at onboarding (can be added later). Group coordinator has visibility into the group's monitoring activity. All features available.

**`youth_participant`** — For young people (under 18) or students joining under educator accountability. Activates:
- **Simplified first-action set:** Monitoring record → Learning module → Explore settlement. Financial features (bounty claims, on-chain mint) are not shown on the start screen.
- **Youth banner** on step 4 confirming the mode and explaining what's available
- **Invite code prompt** at step 2 with a note: "If you don't have a code yet, you can continue and share it later. A teacher or group leader can add you to their group at any time."
- **No private messaging with unknown adults** — the existing consent-based comment system (both parties must agree before seeing each other's messages) already prevents unsolicited contact from strangers; youth mode makes this the default restriction

Financial and on-chain features become available once a coordinator adds the youth participant to their group in the group management area (Phase 2).

### 13.5 Why no ID verification

The platform's position is documented in `blog-online-safety-and-private-comms.md`. In summary:

- Age verification requires identification. Identification infrastructure is surveillance infrastructure. The populations this platform serves include people for whom surveillance is not an abstract concern.
- The `youth_participant` mode is a participation declaration, not a legal determination of age. It activates UX safety features appropriate for a supervised programme context.
- Safety is achieved by design: the consent-based comment system, the monitoring-focused feature set, and coordinator group visibility together provide appropriate safeguards for an educational context.
- CSAM hash detection will be implemented when image uploads are user-to-user (currently photos go to Supabase Storage as monitoring evidence, not to social feeds).
- For group deployments: the educator or coordinator's institutional accountability is the compliance layer, as it is for any school-administered digital tool.

### 13.6 Coordinator group management (Phase 2 requirement)

For youth participant mode to be fully functional, a Phase 2 addition is needed:

**`eco_ops.group_invites` table:**
```sql
CREATE TABLE eco_ops.group_invites (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code    text UNIQUE NOT NULL,      -- e.g. 'UKP-2026'
  coordinator_id uuid REFERENCES auth.users(id),
  community_id   text,
  max_uses       smallint DEFAULT 30,
  use_count      smallint DEFAULT 0,
  expires_at     timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE eco_ops.group_members (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id uuid REFERENCES auth.users(id),
  member_id      uuid REFERENCES auth.users(id),
  guest_id       text,                      -- matches guestId if not yet registered
  participation_mode text DEFAULT 'youth_participant',
  joined_at      timestamptz DEFAULT now(),
  UNIQUE(coordinator_id, member_id)
);
```

**Phase 2 UI — Group Coordinator panel:**
- Create invite codes, set expiry and max uses
- View group member list with activity summary (monitoring records submitted, certificates earned)
- Approve bounty claims for youth participants (co-signer flow)
- Remove members

### 13.7 Database profile additions (Phase 1)

The existing `profiles` table (or its equivalent in the platform's auth layer) should be extended with:

```sql
ALTER TABLE public.profiles                         -- adjust table name to match existing schema
  ADD COLUMN IF NOT EXISTS guest_id            text,
  ADD COLUMN IF NOT EXISTS participation_mode  text DEFAULT 'adult_individual',
                                               -- 'adult_individual'|'group_member'|'youth_participant'
  ADD COLUMN IF NOT EXISTS group_invite_code   text,
  ADD COLUMN IF NOT EXISTS onboarding_source   text DEFAULT 'direct',
                                               -- 'onboard_wizard'|'invite_link'|'admin_add'
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
```

`guest_id` is set when a user creates an account after completing the onboarding wizard in guest mode. It allows IDB drafts queued under the guestId to be attributed to the new account on first sync.

### 13.8 Files

| File | Status | Purpose |
|---|---|---|
| `src/composables/useGuestProfile.ts` | New | localStorage-persisted guest profile singleton |
| `src/pages/OnboardPage.vue` | Updated | 5-step wizard with participation mode; localStorage persistence; youth-simplified final step |

### 13.9 What the onboarding does NOT do

- Does not create a Supabase auth user (account creation is a separate flow, not yet implemented in the wizard — step 4 links to first actions without auth)
- Does not verify age, identity, or group coordinator status
- Does not send an invite code to anyone — codes are created by coordinators in the Phase 2 group management UI; the wizard merely stores the code locally for use at account creation
- Does not block access to any route — participation mode is a UX filter, not an access control gate; route-level guards are a Phase 2 addition for financial features

---

## §14 Blog Comment System — Privacy, Safety, and Compliance

### 14.1 Overview

Comments on blog posts are gated by the platform's green-light consent network. A user who is not signed in cannot see or post comments. A signed-in user sees only comments authored by members they have a mutual green-light connection with, plus their own. This is enforced in the client query and the realtime subscription; it should additionally be enforced via Supabase RLS (see §14.3).

### 14.2 Privacy model

The consent model is: **you choose who can reach you, and who can see your voice.** Comments are not a public forum. They are private communications visible only within the green-lit graph. A stranger who creates an account and posts cannot be seen by any existing member who has not accepted a connection from them.

This model:
- Prevents unsolicited contact from unknown accounts
- Prevents pile-ons and targeted harassment (a harasser cannot amplify to the member's audience without consent from each reader)
- Is consistent with the platform's position on surveillance-free private communications (`blog-online-safety-and-private-comms.md`)
- Does not require content scanning or keyword filtering

### 14.3 Required Supabase RLS policies

The green-light gate is currently enforced client-side. These RLS policies enforce it at the database layer — required before public launch:

```sql
-- Read: only own comments + green-lit members' comments
CREATE POLICY "comments_select_greenlit"
  ON public.comments FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      author_id = auth.uid()
      OR author_id IN (
        SELECT CASE WHEN from_id = auth.uid() THEN to_id ELSE from_id END
        FROM public.connections
        WHERE (from_id = auth.uid() OR to_id = auth.uid()) AND status = 'accepted'
      )
    )
  );

-- Insert: own rows only
CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT WITH CHECK (author_id = auth.uid());

-- Update / Delete: own rows only
CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "comments_delete_own" ON public.comments
  FOR DELETE USING (author_id = auth.uid());
```

### 14.4 Rate limiting and character limit

- **Client-side rate limit:** 5 posts per 10 minutes (`COMMENT_RATE_LIMIT` in `src/lib/supabase.ts`). Server-side Postgres function rate limiter is a Phase 2 addition.
- **Character limit:** 2,000 characters (`COMMENT_MAX_LENGTH`). Enforced in `useComments.post()` and in the textarea UI with a live counter.

### 14.5 Block and report

**Block:** Unilateral client-visible filter. Persisted to `localStorage` and synced to `public.blocked_members` via `useMemberStore.blockMember()`. On sign-in, server block list is merged with local. Blocked members' comments are filtered from the `threaded` computed in `useComments` before the UI ever sees them.

**Report:** 🚩 button on every non-own comment writes to `public.comment_reports`. Silently best-effort (fails gracefully if table not yet migrated). Admin reviews reports via service-role access. No auto-removal.

### 14.6 Required database migrations

```sql
-- Flagged comments
CREATE TABLE public.comment_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id),
  reason      text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert_own" ON public.comment_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());
-- SELECT restricted to service role (admin only)

-- User-managed block list
CREATE TABLE public.blocked_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id),
  blocked_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);
ALTER TABLE public.blocked_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_select_own" ON public.blocked_members FOR SELECT USING (blocker_id = auth.uid());
CREATE POLICY "blocks_insert_own" ON public.blocked_members FOR INSERT WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "blocks_delete_own" ON public.blocked_members FOR DELETE USING (blocker_id = auth.uid());
```

### 14.7 Youth participant comment restriction

- **Pre-auth (guest mode):** `useGuestProfile().isYouthMode` checked in `BlogComments.vue`; if true, compose area replaced with a coordinator-required note.
- **Post-auth (signed in):** Phase 2 requirement. Add `participation_mode` column to `members` table; add RLS INSERT check that rejects `youth_participant` accounts without coordinator approval.

### 14.8 Online privacy law posture

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Right to delete own content | GDPR Art. 17, CCPA | ✅ | `useComments.remove()` hard-deletes; account deletion needs FK cascade |
| No unsolicited contact | GDPR / design | ✅ | Green-light gate is core architecture |
| No minor ID collection | COPPA | ✅ | No DOB; youth mode is self-declaration |
| Minor comment restriction | COPPA / KOSA | ⏳ Phase 2 | Pre-auth gate done; post-auth server check pending |
| Right to account erasure | GDPR Art. 17 | ⏳ Pending | Need `DELETE CASCADE` on `members` → `comments`, `reactions`, `connections`, `blocked_members` |
| Lawful-order compliance | All jurisdictions | ✅ | Admin can delete any row via service role; no bulk surveillance |
| CSAM hash detection | KOSA / OSA | ⏳ Phase 4 | Hash-match on user-to-user image uploads only; not applicable to text |
| No bulk communication scanning | Platform policy | ✅ | No keyword filtering; no AI content audit |

### 14.9 Routing

| Route | Component | Notes |
|---|---|---|
| `/blog` | `BlogIndexPage.vue` | Series and audience filters; grid view |
| `/blog/:slug` | `BlogPostPage.vue` | `document.title` set dynamically; 404 fallback for unknown slugs |

Vercel `vercel.json` catch-all (`/(.*) → /index.html`) handles SPA routing correctly for all blog paths.

### 14.10 Files

| File | Status | Purpose |
|---|---|---|
| `src/lib/supabase.ts` | Updated | `CommentReport`, `BlockedMember` types; `COMMENT_MAX_LENGTH`, `COMMENT_RATE_LIMIT` constants |
| `src/stores/member.ts` | Updated | `blockedIds` ref (localStorage + Supabase sync); `blockMember()` / `unblockMember()` |
| `src/composables/useComments.ts` | Updated | Green-light filter in `load()` and realtime handler; rate limit; char cap; `report()` function |
| `src/components/BlogComments.vue` | Updated | Char counter; youth mode compose guard; privacy note |
| `src/components/CommentItem.vue` | Updated | 🚩 report button; block/unblock for non-own comments; `postSlug` prop |
| `src/pages/BlogPostPage.vue` | Updated | Dynamic `document.title` |
| `src/router/routes.ts` | Updated | Removed unused `props: true` from `blog-post` |

---

## Revision history

| Version | Date | Summary |
|---|---|---|
| 1.0 | June 2026 | Initial architecture spec — §1–§10, Phase 1–4 plan |
| 1.0.1 | July 2026 | Added §11 PWA MVP (initial draft) |
| 1.0.2 | July 2026 | Added §12 Civic Data Bounty System; rewrote §0 executive summary with target groups and dual platform |
| 1.1 | July 2026 | **Spec review update:** §1 architecture note (offline layer + bounty system); §2.1 photos field corrected (Supabase Storage not IPFS; added `bounty_issue_number`, `pending_photo_upload`); §4.3 added `eco-offline.ts` store; §4.4 updated `useMonitoringWizard` + `useOfflineQueue` shim; §4.5 added `LocalDataPanel`, `OfflineStatusBar`, `InstallPrompt`, `photo-resize.ts`; §7 added Phase 0 (shipped), updated Phase 1, removed offline from Phase 4; §8 Q2 DECIDED (OpenStreetMap), Q3 DECIDED (Supabase Storage, IPFS Phase 4); §11 full architecture and files update (Pinia store, IDB draft-store, photo resize pipeline); §12.5 bot edge cases expanded |
| 1.2 | July 2026 | **Onboarding + minor-safe design:** Added §13. New `useGuestProfile.ts` composable. Updated `OnboardPage.vue`: 5-step wizard, participation modes, localStorage persistence, youth-simplified final step, youth banner. Phase 2 group coordinator requirements. |
| 1.3 | July 2026 | **Comment privacy + blog routing:** Added §14 (Blog Comment System — Privacy, Safety, and Compliance). Green-light gate implemented in `useComments.load()` and realtime subscription. Rate limit (5/10 min), char cap (2000), block/report system. Youth mode compose guard. RLS policy specs and migration SQL for `comment_reports` and `blocked_members`. Privacy law posture table. Dynamic blog post titles. |
