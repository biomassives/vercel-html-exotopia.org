# Curriculum / VoTech Library — Architecture Spec

*SCD Hub / Exotopia.org — July 2026*
*Status: planning — no code written yet*

---

## 1. Why a separate architecture from ot6a / ot7a

`ot6a.json` is an ecological/sustainability library with 63 videos across 6 areas. Loading it whole (191 KB) and making it deeply reactive works fine at that scale.

Vocational content (carpentry, wiring, EMT, engine repair, accounting, etc.) will grow to **500–1,000+ videos** across 10–15 areas. If we apply the same pattern:

| Scenario | JSON size | `ref<>` reactive proxy cost | Load time (2G) |
|---|---|---|---|
| ot6a today (63 videos) | 191 KB | ~2,000 proxy objects | ~1.5 s |
| Vocational (500 videos, same schema) | ~1.5 MB | ~16,000 proxy objects | ~12 s |
| Vocational (500 videos, slim schema) | ~400 KB | ~8,000 proxy objects | ~3 s |
| Vocational, 2-tier lazy load | **~12 KB** index on load | **~200 proxies** upfront | **~0.1 s** |

The 2-tier architecture with a slim schema is the only viable path for target devices (sub-$200 Android, 2G/3G rural coverage).

Vocational training also has different organizational logic from the ecological axes (doesn't map cleanly to E8 dimensions), different curation sources (YouTube saved playlists, your own recordings, institutional training videos), and different audiences (learners building skills vs. community leaders assessing capabilities).

---

## 2. Data architecture — Two-tier, per-area lazy load

```
/public/
  curriculum-index.json              ~8 KB  — loads immediately on page mount
  curriculum/
    construction-carpentry.json      ~25 KB — loads when user clicks that area
    electrical-wiring.json           ~20 KB
    structural-site-planning.json    ~22 KB
    mechanical-engines.json          ~18 KB
    healthcare-emt.json              ~15 KB
    healthcare-nursing.json          ~20 KB
    business-accounting.json         ~14 KB
    marketing-communications.json    ~12 KB
    welding-metalwork.json           ~14 KB
    plumbing-water-systems.json      ~15 KB
    agriculture-food-processing.json ~16 KB
```

**Load strategy:**
1. Mount → fetch `curriculum-index.json` → render area grid (fast, ~0.1 s)
2. User clicks area tab → fetch `curriculum/{slug}.json` → render detail
3. Cache fetched area files in **IndexedDB** with 24h TTL (not localStorage — avoids 5MB quota and sync blocking)
4. Service Worker (already registered as PWA) serves curriculum area files cache-first after first visit

**Never load:** More than one area's full content into Vue's reactive system at a time. When user switches areas, the previous area's data is released (not held in ref).

---

## 3. Schema — slimmed and curriculum-specific

### 3a. `curriculum-index.json` — the lightweight index

```typescript
interface CurriculumAreaSummary {
  slug: string            // used to fetch /curriculum/{slug}.json
  area: string            // display name
  cluster: CurriculumCluster  // grouping for the area grid
  icon: string            // mdi- icon name
  color: string           // hex accent
  video_count: number     // shown in area card before detail loads
  subcat_count: number
  description: string     // one sentence — shown in area card
  tags: string[]          // for cross-area search (future)
  ot7a_axis_refs: string[] // which ot7a axes this develops, e.g. ['x5','x7']
  status: 'active' | 'planned' | 'partial'
}

type CurriculumCluster =
  | 'Build & Construction'
  | 'Mechanical'
  | 'Healthcare'
  | 'Business'
  | 'Digital & Media'
```

Serialised example (one entry):
```json
{
  "slug": "construction-carpentry",
  "area": "Carpentry & Construction",
  "cluster": "Build & Construction",
  "icon": "mdi-hammer",
  "color": "#d97706",
  "video_count": 42,
  "subcat_count": 5,
  "description": "Hand tools, framing, joinery, timber, and finish work — from basic bench skills to full structural carpentry.",
  "tags": ["carpentry", "framing", "joinery", "timber", "woodworking"],
  "ot7a_axis_refs": ["x1", "x5"],
  "status": "partial"
}
```

### 3b. Curriculum area file — the detail

```typescript
interface CurriculumArea {
  slug: string
  area: string
  cluster: CurriculumCluster
  icon: string
  color: string
  ot7a_axis_refs: string[]
  subcategories: CurriculumSubcategory[]
}

interface CurriculumSubcategory {
  uniqueId: string
  title: string
  subtitle?: string
  description: string
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'mixed'
  estimated_hours?: number          // total watch time for the subcat
  prerequisites?: string[]          // plain text or uniqueId refs
  learning_outcomes?: string[]      // what learner can do after
  tools_required?: string[]         // physical tools / materials
  youtube_playlist_id?: string      // if the whole subcat is one YT playlist
  certification_pathway?: string    // plain text or URL
  context?: string
  tags?: string[]
  videos: CurriculumVideo[]
  videoTagDirectory?: Record<string, CurriculumTagMeta>
}

interface CurriculumVideo {
  title: string
  youtubeId: string
  skill_level?: 'beginner' | 'intermediate' | 'advanced'
  duration_min?: number
  authors?: string
  licence?: string
  tags?: string[]
  // DROPPED from ot6a schema: description (long — use videoTagDirectory instead),
  // patreon, socials, fundraiser, sponsorPages, researchReviewItems,
  // icon_tag_fa (not used in new UI), color_tag, localVideoFilename (use SW cache)
}

interface CurriculumTagMeta {
  description: string
  link?: string
  linkLabel?: string
}
```

**Schema reduction:** 15 fields/video → 7 fields/video = ~55% smaller per video.
The dropped fields (`patreon`, `socials`, `fundraiser`, `sponsorPages`, `researchReviewItems`) were almost always empty strings in ot6a.json. Long `description` text moves to `videoTagDirectory` where it belongs — tag-level context rather than per-video long text.

---

## 4. Vocational area taxonomy

### Cluster: Build & Construction

**`construction-carpentry`** — Carpentry & Construction
- Hand Tools & Bench Skills (beginner — reading plans, measuring, basic cuts)
- Framing & Rough Carpentry (intermediate — platform, balloon, pole framing)
- Joinery & Finish Work (intermediate — doors, windows, trim, cabinets)
- Timber Framing & Traditional Joinery (advanced — mortise/tenon, timber raising)
- Bamboo & Natural Material Construction (beginner/intermediate — tropical context)

**`electrical-wiring`** — Electrical Wiring & Systems
- Residential Wiring Fundamentals (intermediate — circuits, panels, code basics)
- Off-Grid & Solar PV Wiring (intermediate — DC systems, charge controllers, battery banks)
- Low-Voltage & LED Systems (beginner — 12V, lighting, USB charging)
- Safety, Grounding & Testing (intermediate — test equipment, lockout/tagout)
- Three-Phase & Commercial (advanced — motors, 3-phase panels)

**`structural-site-planning`** — Structural & Site Planning
- Site Reading & Survey Basics (beginner — contours, slope, drainage, compass/GPS)
- Foundations & Earthworks (intermediate — footing types, drainage, compaction)
- Structural Principles for Builders (intermediate — loads, spans, connections)
- Masonry & Block Work (beginner — mortar, laying, bond patterns)
- Rammed Earth, Earthbag & Adobe (intermediate — traditional/natural structural systems)

**`welding-metalwork`** — Welding & Metalwork
- Stick/Arc Welding Fundamentals (intermediate)
- MIG & Wire Feed Welding (intermediate)
- Cutting — Angle Grinder & Plasma (beginner/intermediate)
- Fabrication & Structural Metalwork (advanced)

**`plumbing-water-systems`** — Plumbing & Water Systems
- Pipe Fitting & Materials (beginner — PVC, HDPE, copper, push-fit)
- Rainwater Harvesting Systems (beginner — gutters, first flush, tank sizing)
- Pump Types & Maintenance (intermediate — submersible, centrifugal, solar pump)
- Gravity-Fed & Pressurised Distribution (intermediate)
- Greywater & Constructed Wetland (intermediate — connects to ot7a Water)

### Cluster: Mechanical

**`mechanical-engines`** — Engine Repair & Mechanics
- Small Engine Basics (beginner — 4-stroke cycle, carburettors, ignition)
- Generator Maintenance & Repair (beginner/intermediate — common brands in East Africa/Latin America)
- Motorcycle & Bodaboda Mechanics (intermediate — chains, brakes, carb, common models)
- Diesel Engine Fundamentals (intermediate — injection, cooling, fuel system)
- Agricultural Equipment (intermediate — tractor, pump, irrigation motor)
- Outboard Motor Maintenance (intermediate — coastal/fishing community context)

### Cluster: Healthcare

**`healthcare-emt`** — EMT & Emergency Response
- Scene Safety & Patient Assessment (beginner — primary/secondary survey)
- Airway Management & Breathing (intermediate — BVM, positioning, suctioning)
- Bleeding Control & Wound Care (beginner — tourniquet, packing, pressure dressings)
- Shock Recognition & Management (intermediate)
- Trauma: Fractures, Burns, Head Injury (intermediate)
- Wilderness & Remote Emergency Care (intermediate — evacuation, improvisation)
- Childbirth Emergencies (intermediate — field delivery, PPH, newborn resus)
- AED & Basic Life Support (beginner — BLS/CPR, AED use)

**`healthcare-nursing`** — Nursing & Community Health
- Vital Signs & Patient Assessment (beginner)
- Injection Technique & Safe Practice (intermediate — IM, SC, IV access)
- Wound Assessment & Dressing Changes (intermediate)
- Medication Administration & Safety (intermediate)
- Maternal & Neonatal Care (intermediate — ANC, postnatal, newborn)
- Nutrition & Malnutrition Management (beginner/intermediate — MUAC, therapeutic feeding)
- Community Health Worker (CHW) Core Skills (beginner — referral, IMCI, TB/malaria)
- Mental Health First Aid (beginner — MHPSS, psychological first aid)

### Cluster: Business

**`business-accounting`** — Business Accounting & Finance
- Double-Entry Bookkeeping Basics (beginner — debits/credits, T-accounts)
- Cash Flow Management (beginner/intermediate — forecast, working capital)
- Payroll & Simple Payroll Tax (intermediate — PAYE, NHIF/NSSF equivalents)
- Financial Statements: Reading & Preparing (intermediate — P&L, balance sheet)
- Grant Accounting & Donor Reporting (intermediate)
- Cooperative & Group Finance (intermediate — share capital, member accounts, surplus distribution)

**`marketing-communications`** — Marketing & Communications
- Storytelling for Community Organisations (beginner — narrative structure, audience)
- Social Media for Impact Orgs (beginner — low-data platforms, WhatsApp, Facebook)
- Community Radio & Podcast Production (intermediate — recording, editing, distribution)
- Grant & Proposal Writing (intermediate — ToC, logframe, budget narrative)
- Photography & Visual Documentation (beginner — field documentation for reports)
- Report Writing & Plain Language (beginner — writing for non-technical funders)

### Cluster: Digital & Media *(cross-references ot7a x5 Technology area)*

**`digital-media`** — Digital Skills & Media Production *(partial — see ot7a Technology area)*
- Smartphone Photography & Video (beginner)
- Spreadsheets for Field Data (beginner — Google Sheets / offline Calc)
- Database Basics for Community Records (intermediate)
- WhatsApp & Community Coordination (beginner)

---

## 5. Quasar component architecture

```
src/pages/CurriculumPage.vue          — main route /curriculum
  ├── CurriculumGrid.vue              — area card grid (loaded from index)
  └── CurriculumAreaView.vue          — single area detail, lazy-loaded per route

src/components/curriculum/
  ├── CurriculumAreaCard.vue          — card in the grid view (index data only)
  ├── CurriculumSubcatPanel.vue       — one subcategory with QExpansionItem
  ├── CurriculumVideoRow.vue          — single video in QVirtualScroll
  └── CurriculumSkillBadge.vue        — beginner/intermediate/advanced chip

src/composables/
  └── useCurriculum.ts               — data loading, caching, state
```

### 5a. `useCurriculum.ts` — the critical composable

```typescript
import { shallowRef, markRaw, readonly } from 'vue'

// Index: shallowRef — only top level reactive, cards don't need deep reactivity
const index = shallowRef<CurriculumAreaSummary[]>([])

// Active area: markRaw — video arrays NEVER need to be reactive
// (they don't change at runtime; only UI state like activeTag changes)
const activeArea = shallowRef<CurriculumArea | null>(null)
const activeSlug = shallowRef<string | null>(null)

const CACHE_KEY_PREFIX = 'scd_curr_'
const CACHE_TTL_MS     = 24 * 60 * 60 * 1000   // 24 hours

async function loadIndex() {
  const res = await fetch('/curriculum-index.json')
  index.value = markRaw(await res.json())        // markRaw: no deep proxy
}

async function loadArea(slug: string) {
  if (activeSlug.value === slug) return          // already loaded
  activeSlug.value = slug
  activeArea.value = null                        // clear previous (GC)

  // 1. Check IDB cache (async, non-blocking)
  const cached = await idbGet<{ data: CurriculumArea; ts: number }>(CACHE_KEY_PREFIX + slug)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    activeArea.value = markRaw(cached.data)
    return
  }

  // 2. Fetch from network
  const res  = await fetch(`/curriculum/${slug}.json`)
  const data = markRaw(await res.json() as CurriculumArea)
  activeArea.value = data

  // 3. Cache in IDB (don't await — fire and forget)
  void idbSet(CACHE_KEY_PREFIX + slug, { data, ts: Date.now() })
}

export function useCurriculum() {
  return { index: readonly(index), activeArea: readonly(activeArea), loadIndex, loadArea }
}
```

**Why `markRaw()` matters here:**
Vue 3 wraps every object in a `Proxy` when you put it in a `ref`. For a CurriculumArea with 40 videos, each with 7 fields, that's ~280 proxy objects. Multiply by the previous area still in memory: ~560 proxies. `markRaw()` prevents this entirely — the data is readable but not observed for changes, which is correct because the JSON data never mutates at runtime (only UI state does).

### 5b. `CurriculumPage.vue` — route structure

```
/curriculum                  → CurriculumGrid (index view)
/curriculum/:slug            → CurriculumAreaView (area detail)
```

Routing into area detail (not tab switching) means:
- Browser back/forward works correctly
- Each area detail page has its own URL (shareable, bookmarkable)
- Vue Router handles component lifecycle — leaving the route releases the component and its refs
- No need to manually manage "at most N areas in memory" — the router does it

### 5c. `CurriculumAreaView.vue` — key Quasar patterns

```vue
<template>
  <!-- QVirtualScroll for videos within an open subcategory -->
  <!-- Only renders ~6 video rows regardless of total count -->
  <QVirtualScroll
    :items="filteredVideos"
    :virtual-scroll-item-size="72"
    @virtual-scroll="onVScroll"
  >
    <template #default="{ item }">
      <CurriculumVideoRow :video="item" />
    </template>
  </QVirtualScroll>

  <!-- QExpansionItem for subcategories — body not mounted until opened -->
  <QExpansionItem
    v-for="sub in activeArea.subcategories"
    :key="sub.uniqueId"
    :label="sub.title"
    expand-separator
    lazy                    <!-- ← key: DOM not created until first open -->
  >
    <template #default>
      <!-- video list rendered only after expand -->
    </template>
  </QExpansionItem>
</template>
```

**`lazy` on QExpansionItem:** subcategory bodies are not mounted until the user expands them. For an area with 5 subcategories and 8 videos each, this means only 1 subcategory's DOM exists at a time. Dramatic reduction in initial render cost.

**`QVirtualScroll` for videos:** renders only the visible viewport slice. A subcategory with 40 videos renders ~6 rows. Memory scales with visible items, not total items.

### 5d. Area card grid — `CurriculumGrid.vue`

```vue
<template>
  <!-- QSkeleton while index loads -->
  <div v-if="!index.length" class="curr-grid">
    <QSkeleton v-for="i in 10" :key="i" type="rect" height="120px" />
  </div>

  <!-- Group by cluster -->
  <section v-for="cluster in clusters" :key="cluster.name">
    <h3 class="curr-cluster-label">{{ cluster.name }}</h3>
    <div class="curr-grid">
      <CurriculumAreaCard
        v-for="area in cluster.areas"
        :key="area.slug"
        :area="area"
        @click="router.push(`/curriculum/${area.slug}`)"
      />
    </div>
  </section>
</template>
```

Area cards are rendered from the **index only** — no full area data loaded. Each card shows name, icon, video count, description, status badge.

---

## 6. Memory budget and performance targets

| Resource | Target | Strategy |
|---|---|---|
| Initial JS parse (index) | < 50 ms | 8 KB JSON, `markRaw` |
| Area detail load (network) | < 800 ms (3G) | 20 KB per file, SW cache-first |
| Active Vue proxies (steady state) | < 500 | `shallowRef` + `markRaw` on data |
| DOM nodes in video list | < 50 (regardless of video count) | `QVirtualScroll` |
| localStorage use | 0 | IDB only (avoids 5MB quota + sync blocking) |
| Offline capability | Full (after first visit per area) | SW cache + IDB |

**localStorage is not used for curriculum** (unlike ot6a's current approach). localStorage is synchronous — a 400 KB JSON parse on the main thread blocks paint. IDB is async and has no practical quota for this data size.

---

## 7. Cross-reference with ot7a axes

Each curriculum area has `ot7a_axis_refs` (e.g., `["x5", "x7"]`). The ot7a area JSON files have a `curriculum_refs` field (to be added) pointing back. This creates a bidirectional map:

```
Carpentry → x1 (Land/shelter), x5 (Technology)
Electrical Wiring → x5 (Technology)
EMT → x2 (Water — health impacts), x7 (Economy — healthcare as livelihood)
Accounting → x7 (Economy)
Marketing → x7 (Economy), x4 (Governance — public communication)
Engine Repair → x5 (Technology)
Nursing → x7 (Economy), x4 (Governance — healthcare access)
Site Planning → x1 (Land), x5 (Technology)
```

This allows a settlement profile page to show: "Your x5 (Technology) score is low — here are curriculum areas that develop it: Electrical Wiring, Engine Repair, Open-Source Tools."

---

## 8. Migration from ot6a.json patterns

ot6a.json is not replaced. It remains the ecological sustainability library and continues to power EcoLibrary.vue unchanged.

The curriculum system is additive:
- New route `/curriculum` and `/curriculum/:slug`
- New composable `useCurriculum`
- New page and component files under `curriculum/`
- New JSON files in `/public/curriculum/`

EcoLibrary.vue's edit mode, export-JSON, and save-to-repo functions are specific to ot6a. The curriculum system starts read-only (no edit mode in Phase 1); curation happens by editing the JSON files directly and committing to the repo.

**Phase 2:** Add an edit mode to `CurriculumAreaView` matching EcoLibrary's edit UX, generating a downloadable updated area JSON and a GitHub PR via the API.

---

## 9. Immediate next steps (in order)

1. **Create `curriculum-index.json`** — all area summaries, no video data (~8 KB)
2. **Create first area file** — `healthcare-emt.json` (smallest, already partially in ot6a Health area) — validate schema
3. **Create `useCurriculum.ts`** composable with `loadIndex` + `loadArea` + IDB cache
4. **Create `CurriculumPage.vue`** with grid view (index only, QSkeleton loading state)
5. **Add route** `/curriculum` and `/curriculum/:slug` to `routes.ts`
6. **Create `CurriculumAreaView.vue`** with QExpansionItem (lazy) + QVirtualScroll
7. **Populate remaining area files** from YouTube saved playlists and other sources
8. **Add `curriculum_refs` to ot7a area stubs** (bidirectional cross-reference)

---

*This spec does not create any code. Implementation begins at step 9.*
