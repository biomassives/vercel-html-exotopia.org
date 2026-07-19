<template>
  <q-page class="pl-page">

    <div class="pl-topbar">
      <router-link to="/" class="pl-back">← universe</router-link>
      <span class="pl-topbar-title">Platform Status &amp; Roadmap</span>
      <span class="pl-topbar-sub">exotopia.org · 6 years in development</span>
    </div>

    <div class="pl-body">

      <!-- ── Sidebar ────────────────────────────────────────────────────── -->
      <nav class="pl-sidebar">
        <div class="pl-nav-head">SECTIONS</div>
        <a v-for="s in SECTIONS" :key="s.id"
          :href="'#' + s.id"
          class="pl-nav-item"
          :class="{ 'pl-nav-item--active': activeSection === s.id }"
          @click.prevent="scrollTo(s.id)">
          <span class="pl-nav-dot" :class="`pl-dot--${s.color}`"></span>
          {{ s.label }}
        </a>

        <div class="pl-nav-head" style="margin-top:20px">QUICK LINKS</div>
        <router-link to="/" class="pl-quick-link">/ universe</router-link>
        <router-link to="/galaxy" class="pl-quick-link">/galaxy</router-link>
        <router-link to="/galactic-center" class="pl-quick-link">/galactic-center</router-link>
        <router-link to="/clusters" class="pl-quick-link">/clusters</router-link>
        <router-link to="/eco-ops" class="pl-quick-link">/eco-ops</router-link>
        <router-link to="/blog" class="pl-quick-link">/blog</router-link>
        <router-link to="/docs" class="pl-quick-link">/docs</router-link>
        <router-link to="/data-coverage" class="pl-quick-link">/data-coverage</router-link>

        <div class="pl-nav-head" style="margin-top:20px">STATUS</div>
        <div v-for="s in STATUS_SUMMARY" :key="s.label" class="pl-status-chip">
          <span class="pl-nav-dot" :class="`pl-dot--${s.color}`"></span>
          <span class="pl-status-count">{{ s.count }}</span>
          <span class="pl-status-label">{{ s.label }}</span>
        </div>
      </nav>

      <!-- ── Main content ───────────────────────────────────────────────── -->
      <main class="pl-main" ref="mainEl" @scroll="onScroll">

        <!-- ── About / History ──────────────────────────────────────────── -->
        <section id="about" class="pl-section">
          <div class="pl-section-eyebrow">ORIGIN</div>
          <h1 class="pl-h1">Six years as Exoworld → Exotopia</h1>
          <p class="pl-p">
            What started as a Three.js exoplanet data browser on the <em>exoworld.org</em> domain
            has grown into a navigable universe with citizen science, ecology tooling, NFT land deeds,
            and a member community. The domain moved to <em>exotopia.org</em> in 2022 when the scope
            expanded beyond exoplanets to include cosmic structures, void navigation, and Earth-based
            field science.
          </p>

          <div class="pl-timeline">
            <div v-for="era in TIMELINE" :key="era.year" class="pl-era">
              <div class="pl-era-year">{{ era.year }}</div>
              <div class="pl-era-bar"></div>
              <div class="pl-era-content">
                <div class="pl-era-title">{{ era.title }}</div>
                <ul class="pl-era-list">
                  <li v-for="item in era.items" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="pl-callout pl-callout--note">
            The platform is open-development. This page is the living record of what works, what is
            being built right now, and where we are heading. Every URL listed below is a real path
            you can visit.
          </div>
        </section>

        <!-- ── Live ─────────────────────────────────────────────────────── -->
        <section id="live" class="pl-section">
          <div class="pl-section-eyebrow">PRODUCTION</div>
          <h1 class="pl-h1">What's live and working</h1>
          <p class="pl-p">
            These features are deployed and accessible. Each entry includes the URL, a brief
            description, and data sources.
          </p>

          <div v-for="group in LIVE_GROUPS" :key="group.heading" class="pl-feat-group">
            <h2 class="pl-h2">{{ group.heading }}</h2>
            <div v-for="f in group.features" :key="f.url" class="pl-feat-row">
              <span class="pl-nav-dot pl-dot--green"></span>
              <router-link :to="f.url" class="pl-feat-url">{{ f.url }}</router-link>
              <span class="pl-feat-desc">{{ f.desc }}</span>
              <span v-if="f.data" class="pl-feat-data">{{ f.data }}</span>
            </div>
          </div>
        </section>

        <!-- ── Building ──────────────────────────────────────────────────── -->
        <section id="building" class="pl-section">
          <div class="pl-section-eyebrow">ACTIVE SPRINT</div>
          <h1 class="pl-h1">In development now</h1>
          <p class="pl-p">
            Features shipped in the current development window or actively being built.
            Items marked <span class="pl-badge pl-badge--shipped">SHIPPED</span> are live but recent enough to still be warm.
          </p>

          <div v-for="item in BUILDING" :key="item.title" class="pl-build-row">
            <div class="pl-build-header">
              <span class="pl-nav-dot pl-dot--amber"></span>
              <span class="pl-build-title">{{ item.title }}</span>
              <span v-if="item.shipped" class="pl-badge pl-badge--shipped">SHIPPED</span>
              <span v-else class="pl-badge pl-badge--wip">IN PROGRESS</span>
            </div>
            <p class="pl-build-desc">{{ item.desc }}</p>
            <div v-if="item.url" class="pl-build-url-row">
              <router-link :to="item.url" class="pl-feat-url">{{ item.url }}</router-link>
            </div>
            <ul v-if="item.details" class="pl-build-details">
              <li v-for="d in item.details" :key="d">{{ d }}</li>
            </ul>
          </div>
        </section>

        <!-- ── Bugs ──────────────────────────────────────────────────────── -->
        <section id="bugs" class="pl-section">
          <div class="pl-section-eyebrow">TRANSPARENCY</div>
          <h1 class="pl-h1">Known issues</h1>
          <p class="pl-p">
            We track bugs publicly here rather than hiding them. Items marked
            <span class="pl-badge pl-badge--fixed">FIXED</span> were resolved in the current development window.
          </p>

          <div v-for="bug in BUGS" :key="bug.id" class="pl-bug-row">
            <div class="pl-bug-header">
              <span class="pl-nav-dot" :class="bug.fixed ? 'pl-dot--green' : 'pl-dot--red'"></span>
              <code class="pl-bug-id">{{ bug.id }}</code>
              <span class="pl-bug-title">{{ bug.title }}</span>
              <span v-if="bug.fixed" class="pl-badge pl-badge--fixed">FIXED</span>
              <span v-else-if="bug.severity === 'high'" class="pl-badge pl-badge--high">HIGH</span>
              <span v-else class="pl-badge pl-badge--low">LOW</span>
            </div>
            <p class="pl-bug-desc">{{ bug.desc }}</p>
            <div v-if="bug.affects" class="pl-bug-affects">
              Affects: <span v-for="a in bug.affects" :key="a" class="pl-bug-path">{{ a }}</span>
            </div>
          </div>
        </section>

        <!-- ── Near-term ─────────────────────────────────────────────────── -->
        <section id="near" class="pl-section">
          <div class="pl-section-eyebrow">NEXT 3–6 MONTHS</div>
          <h1 class="pl-h1">Near-term roadmap</h1>
          <p class="pl-p">
            These are planned features with clear implementation paths. Most have data or architecture
            already partially in place.
          </p>

          <div v-for="item in NEAR_TERM" :key="item.title" class="pl-road-row">
            <div class="pl-road-header">
              <span class="pl-nav-dot pl-dot--cyan"></span>
              <span class="pl-road-title">{{ item.title }}</span>
              <span class="pl-road-effort">{{ item.effort }}</span>
            </div>
            <p class="pl-road-desc">{{ item.desc }}</p>
            <div v-if="item.blockedBy" class="pl-road-blocked">
              Blocked by: {{ item.blockedBy }}
            </div>
          </div>
        </section>

        <!-- ── Horizon ───────────────────────────────────────────────────── -->
        <section id="horizon" class="pl-section">
          <div class="pl-section-eyebrow">12–24 MONTHS</div>
          <h1 class="pl-h1">Long-term vision</h1>
          <p class="pl-p">
            These represent the larger architectural goals for Exotopia. Some require external
            infrastructure, partner data, or significant research work to complete.
          </p>

          <div v-for="item in HORIZON" :key="item.title" class="pl-horizon-row">
            <div class="pl-horizon-header">
              <span class="pl-nav-dot pl-dot--purple"></span>
              <span class="pl-horizon-title">{{ item.title }}</span>
              <span class="pl-horizon-tag">{{ item.tag }}</span>
            </div>
            <p class="pl-horizon-desc">{{ item.desc }}</p>
          </div>

          <div class="pl-callout pl-callout--vision">
            <strong>The core commitment:</strong> every layer of Exotopia — from cosmic void navigation
            to PFAS field monitoring to NFT deed math — is built on real science and transparent
            methodology. The platform exists to make the universe and the living Earth equally
            navigable, from the Sgr A* photon sphere to a rain garden in your county.
          </div>
        </section>

        <!-- ── URL API ───────────────────────────────────────────────────── -->
        <section id="url-api" class="pl-section">
          <div class="pl-section-eyebrow">DEVELOPER REFERENCE</div>
          <h1 class="pl-h1">URL API — path conventions</h1>
          <p class="pl-p">
            All navigation in Exotopia is URL-first. Every coordinate, view preset, and scene state
            is addressable. Share a link to any view and it reproduces exactly.
          </p>

          <div v-for="group in URL_API_GROUPS" :key="group.heading" class="pl-url-group">
            <h2 class="pl-h2">{{ group.heading }}</h2>
            <div v-for="entry in group.entries" :key="entry.pattern" class="pl-url-entry">
              <code class="pl-url-pattern">{{ entry.pattern }}</code>
              <span class="pl-url-desc">{{ entry.desc }}</span>
            </div>
          </div>

          <pre class="pl-code"><!-- Query param conventions shared across all viz pages:
  ?at=surface                   named camera preset
  ?at=settlement:dome:interior  nested scope (colon-separated)
  ?cam=x,y,z,tx,ty,tz,fov      exact camera position (1 dp)
  ?section=live                 jump to a section (this page)
  ?cluster=virgo                restore cluster panel from link
  ?lesson=3                     jump to sky-lessons lesson

Scope hierarchy  (most specific wins):
  cosmos / surface / cluster / void / galaxy / bh-orbital
  settlement:dome[:interior|:exterior]
  settlement:orb:<slug>
  exotopia:<scope>:<id>[/<subpath>]  ← canonical exoloc address --></pre>
        </section>

      </main>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()

// ── Section nav ───────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'about',   label: '1. History',        color: 'blue'   },
  { id: 'live',    label: '2. Live & Working',  color: 'green'  },
  { id: 'building',label: '3. Building Now',    color: 'amber'  },
  { id: 'bugs',    label: '4. Known Issues',    color: 'red'    },
  { id: 'near',    label: '5. Near-Term',       color: 'cyan'   },
  { id: 'horizon', label: '6. Long-Term',       color: 'purple' },
  { id: 'url-api', label: '7. URL API',         color: 'blue'   },
]

const STATUS_SUMMARY = [
  { label: 'live features', count: 22, color: 'green'  },
  { label: 'in progress',   count:  7, color: 'amber'  },
  { label: 'known bugs',    count:  6, color: 'red'    },
  { label: 'planned',       count: 12, color: 'cyan'   },
  { label: 'vision items',  count:  9, color: 'purple' },
]

// ── Timeline ──────────────────────────────────────────────────────────────

const TIMELINE = [
  {
    year: '2019–20',
    title: 'Exoworld — first light',
    items: [
      'NASA Exoplanet Archive browser with Three.js point cloud',
      'RA/Dec/distance → Cartesian coordinate pipeline',
      'Topo-params: surface terrain generator from stellar parameters',
      'First exolocation address scheme (exoworld: scope)',
    ],
  },
  {
    year: '2021',
    title: 'Settlement concept + cluster data',
    items: [
      'NFT land deed concept for exoplanet surface settlements',
      'E8 lattice research begins for coordinate encoding',
      'HYG 120k star catalog integration',
      'First cluster member catalogs (Virgo, Fornax, Perseus)',
    ],
  },
  {
    year: '2022',
    title: 'Domain move to exotopia.org',
    items: [
      'Void interior navigation (Boötes Void, 2836 NED galaxies)',
      'CosmicPage unified entry replacing split cosmos/welcome pages',
      'X-ray cluster overlay (345 Takey+2013 XMM-Newton clusters)',
      'Spatial URL API — ?at= and ?cam= params standardized',
    ],
  },
  {
    year: '2023',
    title: 'Eco-ops track + E8 math',
    items: [
      'Citizen science: PFAS monitoring, water quality, macroinvertebrates',
      'Eco-ops offline queue (IndexedDB, Supabase sync)',
      'E8/Λ₂₄ PLONK/halo2 ZK proof spec for on-chain deed verification',
      'Gallery, station builder, dome interior first-person view',
    ],
  },
  {
    year: '2024',
    title: 'Member system + blog',
    items: [
      'Supabase auth — magic-link sign in, member profiles',
      'Green-light mutual connection system (social graph)',
      'Blog with threaded comments gated by green-light connections',
      'Bounty system: .github templates, claim bot, GitLab mirror Action',
    ],
  },
  {
    year: '2025',
    title: 'Sky lessons + compliance',
    items: [
      'Sky Lessons educational unit (L1: photorealism, L2: orbit math)',
      'Online safety law compliance analysis',
      'Curriculum + domain competency glossary',
      'East Coast citizen science units (tick/cyanobacteria/phenology)',
    ],
  },
  {
    year: '2026',
    title: 'Galactic center + void math',
    items: [
      'Sgr A* galactic center scene: S-star Kepler orbits, IRS 13E IMBH',
      'Schwarzschild/Kerr physics, gravitational time dilation UI',
      'Void math page: Hamaus density profile, conduit placement math',
      'Sky Lessons L3: galactic center astrophysics (grad/public science)',
      'Local Void and Boötes Void member catalogs',
    ],
  },
]

// ── Live features ─────────────────────────────────────────────────────────

const LIVE_GROUPS = [
  {
    heading: 'Cosmic navigation',
    features: [
      { url: '/',                  desc: 'CosmicPage — full LOD navigation: supercluster → cluster → galaxy → surface', data: 'HYG 120k · 345 XMM clusters · Laniakea flow' },
      { url: '/galaxy',            desc: 'Milky Way star field — HYG catalog, spectral color, constellation overlays',  data: 'HYG 2.4 (Hipparcos/Yale/Gliese)' },
      { url: '/galactic-center',   desc: 'Sgr A* galactic center — S-star Kepler orbits, IRS 13E, Kerr BH physics',   data: 'Gillessen+2017, Peissker+2020, EHT 2022' },
      { url: '/clusters',          desc: 'Galaxy cluster browser — 10 named clusters + 2 cosmic voids with member data', data: '~2500 member galaxies across 12 JSON catalogs' },
      { url: '/cluster-interior/virgo',      desc: 'Virgo Cluster interior — LOD galaxy sprites, M87 BCG, subcluster labels', data: 'VCC Binggeli+1985' },
      { url: '/cluster-interior/bootes-void',desc: 'Boötes Void interior — 50 real + synthetic void residents, CGCG catalog', data: 'NED TAP + Kirshner+1981' },
      { url: '/cluster-interior/local-void', desc: 'Local Void interior — NGC 6503, Fireworks Galaxy, IC 342 on near wall', data: 'Tully+2008, Kreckel+2012' },
      { url: '/void/bootes-void',  desc: 'Boötes Void particle scene — 2876 NED catalog + synthetic galaxies, Hamaus profile', data: 'NASA/IPAC NED TAP' },
    ],
  },
  {
    heading: 'Exoplanet surfaces',
    features: [
      { url: '/planet-systems',    desc: 'Settlement guide — browse confirmed exoplanets by tier, claim surface deeds', data: 'NASA Exoplanet Archive' },
      { url: '/surface/kepler-452/kepler-452b', desc: 'Surface view — procedural terrain from stellar parameters, dome interior', data: 'topo-params.json · 16 confirmed atmospheres' },
      { url: '/surface/55-cnc/55-cnc-e',        desc: 'Sample surface — lava-world topo params, ultra-hot rocky terrain', data: 'pl_dens + st_lum topo pipeline' },
    ],
  },
  {
    heading: 'Eco-ops / citizen science',
    features: [
      { url: '/eco-ops',           desc: 'Eco-ops hub — PFAS monitoring, water quality, macroinvertebrate sampling', data: 'Offline-first IndexedDB queue' },
      { url: '/eco-ledger',        desc: 'Field record ledger — submitted observations with sync status', data: 'Supabase eco_ops schema (pending)' },
      { url: '/eco-library',       desc: 'Ecology library — protocols, field guides, Acopian blind specs',            data: 'docs/eco-ops-workflow-guide.md' },
    ],
  },
  {
    heading: 'Community + publishing',
    features: [
      { url: '/blog',              desc: 'Working notes blog — posts on astrophysics, ecology, platform dev', data: 'Static MDX + Supabase comments' },
      { url: '/onboard',           desc: 'Member onboarding — magic-link auth, handle/profile creation',     data: 'Supabase Auth' },
      { url: '/mint',              desc: 'NFT deed minting — E8/Λ₂₄ encoded settlement deed on Solana',      data: 'Solana · SPL metadata' },
      { url: '/sky-lessons',       desc: 'Educational units — photorealism, orbital math, galactic astrophysics (L1–L3)', data: '' },
      { url: '/void-math',         desc: 'Void math explainer — Hamaus profile, conduit placement, NFW scale', data: '' },
      { url: '/docs',              desc: 'Technical docs — pipeline, catalog sources, data flow', data: '' },
      { url: '/data-coverage',     desc: "Data coverage transparency — what's real vs procedural, catalog gaps", data: '' },
    ],
  },
]

// ── Building now ──────────────────────────────────────────────────────────

const BUILDING = [
  {
    title: 'Supabase null-guard crash fix',
    shipped: true,
    desc: 'Homepage crashed without .env.local because createClient("","") throws at module evaluation time. Fixed by exporting SupabaseClient | null and adding null guards to all callers (member.ts, useComments.ts, eco-offline.ts).',
    url: '/onboard',
    details: [
      'src/lib/supabase.ts → exports null when env vars absent',
      'src/stores/member.ts → if (!supabase) return at top of init(), _loadProfile(), sendMagicLink(), signOut()',
      'src/composables/useComments.ts → all supabase.from() calls guarded, channel setup conditional',
      'src/stores/eco-offline.ts → syncNow() early return when supabase is null',
    ],
  },
  {
    title: 'Boötes Void cluster path + slug fix',
    shipped: true,
    desc: 'clusterSlug("Boötes Void") was producing "btes-void" because the ö character was stripped without NFD normalization. Fixed to produce the correct "bootes-void" slug, matching how voidSlug() works.',
    url: '/cluster-interior/bootes-void',
    details: [
      'src/pages/CosmicPage.vue → clusterSlug() now uses .normalize("NFD") before alnum filter',
      'public/clusters/bootes-void-members.json → new 50-member file (15 NED catalog, 35 synthetic)',
      'public/clusters/local-void-members.json → new 50-member file (15 real, 35 synthetic)',
      'GalaxyClustersPage.vue → Boötes Void and Local Void added to NAMED_CLUSTERS list',
    ],
  },
  {
    title: 'Sgr A* Galactic Center scene',
    shipped: true,
    desc: 'Full Three.js scene for the Galactic Center: 6 S-stars with real Kepler orbital mechanics (Newton-Raphson solver), IRS 13E IMBH candidate, accretion disk with Doppler beaming, settlement zones at photon sphere / ISCO / S-star deck / IRS 13E outpost.',
    url: '/galactic-center',
    details: [
      'src/data/galactic-center.ts → Kepler solver, orbital mechanics, S-star data (Gillessen+2017)',
      'src/pages/GalacticCenterPage.vue → own renderer, time-warp controls, exoloc settlement claims',
      'src/pages/SkyLessonsPage.vue → Lesson 3: Galactic Center Astrophysics (10 sections)',
      'src/router/routes.ts → /galactic-center and /bh/:bhId/:zone? routes',
    ],
  },
  {
    title: 'Galaxy page Sgr A* marker',
    shipped: true,
    desc: 'GalaxyPage now renders an amber synthetic marker at the correct RA/Dec/distance for the Galactic Center (Sgr A*), clickable to navigate to the GalacticCenterPage scene.',
    url: '/galaxy',
    details: [
      'GalaxyPage.vue → buildGalacticCenterMarker() places marker at RA=266.4168°, Dec=−29.0078°, d=8178 pc',
    ],
  },
  {
    title: 'Sky Lessons Lesson 3 — Galactic Center Astrophysics',
    shipped: true,
    desc: 'New educational unit covering the math and physics behind the Sgr A* scene: Kepler elements, Kepler equation, Schwarzschild radius, Kerr spin, gravitational time dilation, accretion disk Doppler, IRS 13E IMBH evidence, EHT imaging.',
    url: '/sky-lessons?lesson=3',
  },
  {
    title: 'Void member catalogs (Local Void + Boötes Void)',
    shipped: true,
    desc: 'Two new cluster-format JSON files for cosmic voids, enabling ClusterInteriorPage navigation. Real NED catalog galaxies with 3D offsets computed from raDecToVec3 + void center coordinates.',
    details: [
      'public/clusters/local-void-members.json — 15 real (NGC 6503, IC 342, Fireworks...) + 35 synthetic',
      'public/clusters/bootes-void-members.json — 15 real (NGC 6272, NGC 5277, IC 4409...) + 35 synthetic',
    ],
  },
  {
    title: 'Bounty + git collaboration system',
    shipped: true,
    desc: 'GitHub workflow templates, issue/PR labels, /claim bot action, GitLab mirror Action, data/submissions/ layout for bounty work. Documented in docs/git-collaboration-guide.md.',
    url: '/blog',
  },
]

// ── Known bugs ────────────────────────────────────────────────────────────

const BUGS = [
  {
    id: 'BUG-001',
    title: 'Void scale in ClusterInteriorPage',
    fixed: false,
    severity: 'low',
    desc: 'ClusterInteriorPage uses SCENE_SCALE=80 (scene units per Mpc), appropriate for dense clusters with 1–2 Mpc virial radii. Local Void (45 Mpc) and Boötes Void (130 Mpc) render with offsets 35–90× larger than normal clusters, causing camera to start far from any galaxy. Members technically load correctly but the initial view is very sparse.',
    affects: ['/cluster-interior/local-void', '/cluster-interior/bootes-void'],
  },
  {
    id: 'BUG-002',
    title: 'TS5101: baseUrl deprecated tsconfig warning',
    fixed: false,
    severity: 'low',
    desc: 'tsconfig.json uses the deprecated baseUrl option which triggers TS5101 on every tsc run. Pre-existing, not introduced by recent work. Has no runtime effect but clutters the build log.',
    affects: ['build output'],
  },
  {
    id: 'BUG-003',
    title: 'NFT deed JSON quality: 8 known issues',
    fixed: false,
    severity: 'low',
    desc: 'Letters Patent NFT deed JSON has 8 identified quality issues: missing planet density field, incorrect coordinate precision in some exoloc addresses, missing stellar age in some records, and a few metadata schema mismatches with SPL Metadata standard v1.1.',
    affects: ['/mint'],
  },
  {
    id: 'BUG-004',
    title: 'NASA ExA distance field: sy_dist not pulled',
    fixed: false,
    severity: 'low',
    desc: 'fetch-exoplanet-archive.mjs was updated to pull st_age, st_met, pl_dens, st_lum but sy_dist (system parallax distance) was not included. Some surface pages fall back to a seed-based procedural distance when sy_dist is absent.',
    affects: ['/planet-systems', '/surface'],
  },
  {
    id: 'BUG-005',
    title: 'Supabase null callers: eco-offline syncNow guard',
    fixed: true,
    severity: 'high',
    desc: 'Homepage crashed at module load time due to createClient("","") when Supabase env vars absent. All callers now null-guarded. eco-offline.ts syncNow() guard added.',
    affects: ['/'],
  },
  {
    id: 'BUG-006',
    title: 'clusterSlug diacritic stripping (Boötes → btes-void)',
    fixed: true,
    severity: 'high',
    desc: 'clusterSlug() stripped ö to produce "btes-void" instead of "bootes-void", causing a 404 when navigating to the Boötes Void cluster interior. Fixed with NFD normalization before the alnum filter.',
    affects: ['/cluster-interior/bootes-void'],
  },
]

// ── Near-term ─────────────────────────────────────────────────────────────

const NEAR_TERM = [
  {
    title: 'Spectral view toggles for GalacticCenterPage',
    effort: '2–3 weeks',
    desc: 'Four spectral views: Visible (current), Near-IR (star population contrast), Radio (cm-wave accretion disk), X-ray (Chandra flare sources at IRS 13E). Each view changes sprite colors, disk opacity, and shows relevant physics overlays. Architecture: toggle buttons swap THREE.Color palettes and material parameters without re-building the scene.',
  },
  {
    title: 'Local Void viz.json for VoidInteriorPage',
    effort: '1 week + data',
    desc: 'The Local Void has a member catalog (local-void-members.json) but no void-galaxies/local-void-viz.json for the particle-field VoidInteriorPage. Need a NED TAP query for z < 0.008 galaxies in RA 170–270°, Dec −10° to +60°, plus synthetic population using the Hamaus profile at r_v=45 Mpc.',
    blockedBy: 'NED TAP query + Python fetch script (fetch-bootes-void.mjs → fetch-local-void.mjs)',
  },
  {
    title: 'BH close-in scene: photon sphere lensing',
    effort: '3–4 weeks',
    desc: 'A dedicated view for /bh/Sgr-A*/photon-sphere showing gravitational lensing (Einstein ring simulation), relativistic Doppler shift of the accretion disk, and the shadow diameter (51.8 μas per EHT 2022). Fragment shader approach using ray-marching around the Schwarzschild metric.',
  },
  {
    title: 'S-star full catalog from SIMBAD',
    effort: '1 week',
    desc: 'Currently hardcoded 6 S-stars (S2, S62, S4714, S8, S55, S14). SIMBAD CDS VizieR table J/A+A/609/A27 (Gillessen+2017) has 40+ measured orbits. Python script → public/s-stars-full.json, GalacticCenterPage loads on demand.',
  },
  {
    title: '/learn citizen science track content',
    effort: '2 weeks',
    desc: 'LearnPage has quiz infrastructure but the citizen science track (tick drag monitoring, PFAS sampling, macroinvertebrate ID) needs question content. Integrate with the East Coast citizen science blog post curriculum units.',
  },
  {
    title: 'VGS: IRS source positions from VizieR',
    effort: '3 days',
    desc: 'VizieR query for J/A+A/609/A27 IRS catalog (Schödel+2017) → public/gc-irs-sources.json. Adds ~100 known IRS sources to the GalacticCenterPage nuclear star cluster as named clickable sprites.',
  },
  {
    title: 'Eco-ops photo upload to Supabase Storage',
    effort: '1 week',
    desc: 'eco-offline.ts already queues resized JPEG data-URIs and has Supabase Storage upload logic in syncNow(), but the eco_ops schema and storage bucket are not yet deployed. Need: Supabase migration, bucket policy, and test with field submission flow.',
  },
  {
    title: 'VoidInteriorPage scale for Local Void',
    effort: '2 days',
    desc: 'Fix the ClusterInteriorPage SCENE_SCALE issue for voids by detecting when the cluster slug is a void (rvir_mpc > 10) and scaling the scene units accordingly, or adding a dedicated VoidClusterPage that renders with MPC_SCALE = 1/15 matching CosmicPage.',
  },
]

// ── Long-term horizon ─────────────────────────────────────────────────────

const HORIZON = [
  {
    title: 'E8/PLONK ZK proof on-chain deed validation',
    tag: 'CRYPTOGRAPHY',
    desc: 'The spec for E8/Λ₂₄ PLONK/halo2 ZK proof is written (SPEC_ECO_OPS_API.md). The proof encodes exoloc coordinates as E8 lattice points and verifies settlement uniqueness on-chain. Requires a Rust circuit implementation and Solana program deployment.',
  },
  {
    title: 'Multi-void spectral navigation (radio/X-ray/UV)',
    tag: 'VISUALIZATION',
    desc: 'Show void galaxy populations in different electromagnetic windows. UV picks out star-forming dwarfs (GALEX-analog view). Radio shows HI 21cm gas halos extending beyond optical disks. X-ray reveals faint AGN in void-wall galaxies. Each spectral view is a palette/opacity swap on the existing void oracle data.',
  },
  {
    title: 'Collaborative settlement buildings',
    tag: 'SOCIAL',
    desc: 'Multiple members can co-own a settlement. The dome interior becomes a shared space where each member contributes a building (library, lab, garden, comms tower). State stored in Supabase; real-time updates via Postgres realtime channels.',
  },
  {
    title: 'Eco-ops API v1 — public data submission',
    tag: 'ECO-OPS',
    desc: 'Open the eco_ops Supabase schema to external submissions. REST + WebSocket endpoints for field stations, mobile apps, and partner organizations. Rate-limiting, API keys, and a public data dashboard at /eco-ledger.',
  },
  {
    title: 'Real-time EHT / Sgr A* flare feed',
    tag: 'SCIENCE DATA',
    desc: 'JWST MIRI 2025 data shows 5–6 major Sgr A* flares per day at 6 rₛ. A live or near-live feed from public EHT/Chandra quicklook data could animate the accretion disk in GalacticCenterPage, lighting up the plasmoid ring during active flares.',
  },
  {
    title: 'Inter-settlement void travel routes',
    tag: 'GAMEPLAY',
    desc: 'Wormhole conduit system (already visually present in CosmicPage) connected to actual settlement inventory. Travel costs (resources, time dilation) computed from the conduit math in VoidMathPage. Settlement-to-settlement messaging via green-light connections.',
  },
  {
    title: 'Full solar system integration',
    tag: 'VISUALIZATION',
    desc: 'Add the solar system as a navigable entry nested inside the GalaxyPage (at correct RA/Dec/dist from HYG catalog). Planetary surfaces, moons, and L4/L5 Trojan settlement zones. Reuse SurfaceViewPage topo-params pipeline for solar bodies.',
  },
  {
    title: 'SIMBAD-linked object database',
    tag: 'DATA',
    desc: 'Every clickable cosmic object — S-stars, IRS sources, named cluster galaxies, void residents — linked to a live SIMBAD CDS record. Clicking the info badge opens a panel with real-time NED/SIMBAD data. Requires CORS-friendly CDS API or a proxy worker.',
  },
  {
    title: 'Exotopia mobile app (PWA)',
    tag: 'PLATFORM',
    desc: 'The eco-ops offline queue and monitoring wizard are already mobile-first. Wrapping the full app as a PWA (Quasar already supports this) with push notifications for Sgr A* flare alerts, field monitoring reminders, and green-light connection requests.',
  },
]

// ── URL API groups ────────────────────────────────────────────────────────

const URL_API_GROUPS = [
  {
    heading: 'Cosmic scenes',
    entries: [
      { pattern: '/',                                   desc: 'Universe entry — CosmicPage (LOD root)' },
      { pattern: '/galaxy',                             desc: 'Milky Way star field' },
      { pattern: '/galactic-center',                    desc: 'Sgr A* galactic center scene' },
      { pattern: '/bh/:bhId/:zone?',                    desc: 'Black hole orbital scene (zone optional)' },
      { pattern: '/clusters',                           desc: 'Galaxy cluster browser' },
      { pattern: '/cluster-interior/:slug',             desc: 'Cluster interior — loads /clusters/{slug}-members.json' },
      { pattern: '/void/:voidId',                       desc: 'Void interior — loads /void-galaxies/{voidId}-viz.json' },
      { pattern: '/void-galaxy/:voidId/:gid',           desc: 'Individual void galaxy interior' },
      { pattern: '/xcluster/:xid',                      desc: 'X-ray cluster (Takey+2013) scene' },
      { pattern: '/cluster-galaxy/:clusterSlug/:id',    desc: 'Named cluster galaxy interior' },
      { pattern: '/cluster-system/:slug/:id/:idx',      desc: 'Star system orrery in cluster context' },
      { pattern: '/cluster-surface/:slug/:id/:idx',     desc: 'Cluster world surface view' },
    ],
  },
  {
    heading: 'Exoplanet surfaces',
    entries: [
      { pattern: '/planet-systems',                     desc: 'Exoplanet browser + settlement guide' },
      { pattern: '/surface/:hostname/:planetName',      desc: 'Planet surface view' },
      { pattern: '/surface/:hostname/:planetName/interior', desc: 'Dome interior (first-person)' },
    ],
  },
  {
    heading: 'Tools + community',
    entries: [
      { pattern: '/eco-ops/:area?',                     desc: 'Eco-ops hub (area: water / forest / pfas / tick / phenology)' },
      { pattern: '/eco-ledger',                         desc: 'Field submission ledger' },
      { pattern: '/eco-library',                        desc: 'Ecology protocol library' },
      { pattern: '/blog',                               desc: 'Blog index' },
      { pattern: '/blog/:slug',                         desc: 'Blog post' },
      { pattern: '/onboard',                            desc: 'Member auth + profile' },
      { pattern: '/mint',                               desc: 'NFT deed minting' },
      { pattern: '/pon-ink',                            desc: 'Settlement registry (PON.INK)' },
      { pattern: '/chains',                             desc: 'Chain / wallet status' },
    ],
  },
  {
    heading: 'Learning + reference',
    entries: [
      { pattern: '/sky-lessons?lesson=1',               desc: 'Sky generation — photorealism (beginner)' },
      { pattern: '/sky-lessons?lesson=2',               desc: 'Orbital mechanics (intermediate)' },
      { pattern: '/sky-lessons?lesson=3',               desc: 'Galactic center astrophysics (grad)' },
      { pattern: '/void-math',                          desc: 'Void architecture + conduit math' },
      { pattern: '/docs',                               desc: 'Technical documentation' },
      { pattern: '/data-coverage',                      desc: 'Data coverage + catalog transparency' },
      { pattern: '/platform',                           desc: 'This page — status + roadmap' },
    ],
  },
]

// ── Scroll tracking ───────────────────────────────────────────────────────

const mainEl        = ref<HTMLElement | null>(null)
const activeSection = ref('about')

function onScroll() {
  if (!mainEl.value) return
  const scrollTop = mainEl.value.scrollTop
  let current = SECTIONS[0]!.id
  for (const s of SECTIONS) {
    const el = document.getElementById(s.id)
    if (el && el.offsetTop - 80 <= scrollTop) current = s.id
  }
  activeSection.value = current
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el && mainEl.value) {
    mainEl.value.scrollTo({ top: el.offsetTop - 24, behavior: 'smooth' })
  }
  void router.replace({ query: { ...route.query, section: id } })
}

onMounted(() => {
  const section = route.query.section as string | undefined
  if (section) {
    setTimeout(() => scrollTo(section), 120)
  }
})
</script>

<style scoped>
.pl-page {
  background: #080c10;
  color: #c8d8e8;
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Top bar ───────────────────────────────────────────────────────────── */
.pl-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(8,12,16,0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(100,160,240,0.12);
  padding: 10px 24px;
  display: flex;
  align-items: baseline;
  gap: 16px;
}
.pl-back         { color: #5588cc; font-size: 12px; text-decoration: none; }
.pl-back:hover   { color: #88bbff; }
.pl-topbar-title { font-size: 13px; font-weight: 600; color: #dde8f4; letter-spacing: 0.03em; }
.pl-topbar-sub   { font-size: 11px; color: #5577aa; margin-left: auto; }

/* ── Layout ────────────────────────────────────────────────────────────── */
.pl-body {
  display: flex;
  height: calc(100vh - 42px);
}

/* ── Sidebar ───────────────────────────────────────────────────────────── */
.pl-sidebar {
  width: 200px;
  min-width: 200px;
  padding: 20px 14px;
  border-right: 1px solid rgba(100,160,240,0.10);
  overflow-y: auto;
  background: rgba(6,10,16,0.6);
}
.pl-nav-head {
  font-size: 9px;
  letter-spacing: 0.12em;
  color: #446688;
  margin: 6px 0 6px 4px;
  font-weight: 600;
}
.pl-nav-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border-radius: 5px;
  font-size: 12px;
  color: #6688aa;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.pl-nav-item:hover           { background: rgba(100,160,240,0.06); color: #99bbdd; }
.pl-nav-item--active         { background: rgba(100,160,240,0.10); color: #c8ddf0; }
.pl-quick-link {
  display: block;
  padding: 3px 8px;
  font-size: 11px;
  color: #446688;
  text-decoration: none;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.pl-quick-link:hover { color: #6699cc; }

.pl-status-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  font-size: 11px;
}
.pl-status-count { color: #c8d8e8; font-weight: 600; min-width: 22px; }
.pl-status-label { color: #446688; }

/* ── Status dots ───────────────────────────────────────────────────────── */
.pl-nav-dot {
  display: inline-block;
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pl-dot--green  { background: #22cc66; box-shadow: 0 0 5px #22cc66; }
.pl-dot--amber  { background: #ffaa22; box-shadow: 0 0 5px #ffaa22; }
.pl-dot--red    { background: #ee4444; box-shadow: 0 0 5px #ee4444; }
.pl-dot--cyan   { background: #22ddcc; box-shadow: 0 0 5px #22ddcc; }
.pl-dot--purple { background: #9966ee; box-shadow: 0 0 5px #9966ee; }
.pl-dot--blue   { background: #4488ff; box-shadow: 0 0 5px #4488ff; }

/* ── Main content ──────────────────────────────────────────────────────── */
.pl-main {
  flex: 1;
  overflow-y: auto;
  padding: 32px 48px 80px;
  max-width: 900px;
}

.pl-section {
  margin-bottom: 64px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(100,160,240,0.08);
}
.pl-section:last-child { border-bottom: none; }

.pl-section-eyebrow {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: #4466aa;
  font-weight: 700;
  margin-bottom: 6px;
}
.pl-h1 {
  font-size: 22px;
  font-weight: 700;
  color: #dde8f8;
  margin: 0 0 16px;
  letter-spacing: -0.01em;
}
.pl-h2 {
  font-size: 14px;
  font-weight: 600;
  color: #88aacc;
  margin: 24px 0 10px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.pl-p {
  font-size: 13px;
  line-height: 1.7;
  color: #8899bb;
  margin: 0 0 16px;
}

/* ── Timeline ──────────────────────────────────────────────────────────── */
.pl-timeline { display: flex; flex-direction: column; gap: 0; margin: 24px 0; }
.pl-era {
  display: grid;
  grid-template-columns: 64px 24px 1fr;
  gap: 0 12px;
  margin-bottom: 0;
}
.pl-era-year {
  font-size: 11px;
  font-weight: 700;
  color: #4488cc;
  padding-top: 2px;
  text-align: right;
  font-family: monospace;
}
.pl-era-bar {
  width: 2px;
  background: linear-gradient(to bottom, rgba(68,136,204,0.6), rgba(68,136,204,0.1));
  position: relative;
  margin: 0 auto;
  flex-shrink: 0;
}
.pl-era-bar::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #4488cc;
  box-shadow: 0 0 6px #4488cc;
}
.pl-era-content {
  padding: 0 0 24px 4px;
}
.pl-era-title {
  font-size: 13px;
  font-weight: 600;
  color: #99bbdd;
  margin-bottom: 6px;
}
.pl-era-list {
  margin: 0;
  padding-left: 16px;
  list-style: disc;
}
.pl-era-list li {
  font-size: 12px;
  color: #6677aa;
  line-height: 1.6;
  margin-bottom: 2px;
}

/* ── Callouts ──────────────────────────────────────────────────────────── */
.pl-callout {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.65;
  margin: 16px 0;
}
.pl-callout--note   { border-left: 3px solid #4488cc; background: rgba(68,136,204,0.07); color: #7799cc; }
.pl-callout--vision { border-left: 3px solid #9966ee; background: rgba(153,102,238,0.07); color: #997acc; }

/* ── Live features ─────────────────────────────────────────────────────── */
.pl-feat-group { margin-bottom: 8px; }
.pl-feat-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(100,140,200,0.06);
  flex-wrap: wrap;
}
.pl-feat-url {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: #4499dd;
  text-decoration: none;
  white-space: nowrap;
}
.pl-feat-url:hover { color: #77bbff; text-decoration: underline; }
.pl-feat-desc {
  font-size: 12px;
  color: #6677aa;
  flex: 1;
}
.pl-feat-data {
  font-size: 10px;
  color: #334466;
  font-family: monospace;
  background: rgba(100,140,200,0.06);
  padding: 1px 6px;
  border-radius: 3px;
}

/* ── Building rows ─────────────────────────────────────────────────────── */
.pl-build-row {
  border: 1px solid rgba(255,170,34,0.15);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: rgba(255,170,34,0.03);
}
.pl-build-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.pl-build-title { font-size: 13px; font-weight: 600; color: #ccaa66; }
.pl-build-desc  { font-size: 12px; color: #6677aa; line-height: 1.65; margin: 0 0 8px; }
.pl-build-url-row { margin-bottom: 8px; }
.pl-build-details {
  margin: 4px 0 0;
  padding-left: 18px;
}
.pl-build-details li {
  font-size: 11px;
  color: #445566;
  font-family: monospace;
  line-height: 1.8;
}

/* ── Badges ────────────────────────────────────────────────────────────── */
.pl-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 2px 6px;
  border-radius: 3px;
}
.pl-badge--shipped { background: rgba(34,204,102,0.15); color: #22cc66; }
.pl-badge--wip     { background: rgba(255,170,34,0.12); color: #ffaa22; }
.pl-badge--fixed   { background: rgba(34,204,102,0.12); color: #22cc66; }
.pl-badge--high    { background: rgba(238,68,68,0.12);  color: #ee4444; }
.pl-badge--low     { background: rgba(100,140,200,0.12);color: #6699bb; }

/* ── Bug rows ──────────────────────────────────────────────────────────── */
.pl-bug-row {
  border: 1px solid rgba(100,140,200,0.10);
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 10px;
}
.pl-bug-row:has(.pl-dot--green) { border-color: rgba(34,204,102,0.12); background: rgba(34,204,102,0.02); }
.pl-bug-row:has(.pl-dot--red)   { border-color: rgba(238,68,68,0.15);  background: rgba(238,68,68,0.02); }
.pl-bug-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.pl-bug-id    { font-family: monospace; font-size: 11px; color: #446688; }
.pl-bug-title { font-size: 13px; color: #99aacc; font-weight: 600; }
.pl-bug-desc  { font-size: 12px; color: #6677aa; line-height: 1.65; margin: 0 0 6px; }
.pl-bug-affects { font-size: 11px; color: #334466; }
.pl-bug-path {
  font-family: monospace;
  font-size: 11px;
  color: #4466aa;
  background: rgba(68,102,170,0.08);
  padding: 1px 6px;
  border-radius: 3px;
  margin-left: 4px;
}

/* ── Roadmap rows ──────────────────────────────────────────────────────── */
.pl-road-row {
  border-left: 2px solid rgba(34,221,204,0.25);
  padding: 8px 0 8px 16px;
  margin-bottom: 16px;
}
.pl-road-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.pl-road-title   { font-size: 13px; font-weight: 600; color: #66ccbb; }
.pl-road-effort  { font-size: 10px; color: #3a5a6a; background: rgba(34,221,204,0.08); padding: 1px 7px; border-radius: 3px; }
.pl-road-desc    { font-size: 12px; color: #6677aa; line-height: 1.65; margin: 0 0 4px; }
.pl-road-blocked { font-size: 11px; color: #774422; background: rgba(255,100,34,0.06); padding: 4px 8px; border-radius: 4px; }

/* ── Horizon rows ──────────────────────────────────────────────────────── */
.pl-horizon-row {
  border-left: 2px solid rgba(153,102,238,0.25);
  padding: 8px 0 8px 16px;
  margin-bottom: 16px;
}
.pl-horizon-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.pl-horizon-title { font-size: 13px; font-weight: 600; color: #aa88ee; }
.pl-horizon-tag   { font-size: 9px; letter-spacing: 0.1em; color: #553388; background: rgba(153,102,238,0.10); padding: 2px 7px; border-radius: 3px; font-weight: 700; }
.pl-horizon-desc  { font-size: 12px; color: #6677aa; line-height: 1.65; margin: 0; }

/* ── URL API ────────────────────────────────────────────────────────────── */
.pl-url-group { margin-bottom: 24px; }
.pl-url-entry {
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(100,140,200,0.06);
}
.pl-url-pattern {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: #4499dd;
  white-space: nowrap;
  min-width: 320px;
}
.pl-url-desc { font-size: 12px; color: #6677aa; }

.pl-code {
  background: rgba(20,30,50,0.8);
  border: 1px solid rgba(100,140,200,0.15);
  border-radius: 6px;
  padding: 16px 18px;
  font-size: 11.5px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #7799bb;
  line-height: 1.7;
  white-space: pre;
  overflow-x: auto;
  margin-top: 16px;
}

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .pl-body   { flex-direction: column; height: auto; }
  .pl-sidebar { width: 100%; min-width: 0; border-right: none; border-bottom: 1px solid rgba(100,160,240,0.10); display: flex; flex-wrap: wrap; gap: 4px; padding: 12px; }
  .pl-main   { padding: 20px 16px 60px; max-width: 100%; }
  .pl-url-pattern { min-width: 0; }
  .pl-url-entry { flex-direction: column; gap: 4px; }
  .pl-nav-head  { width: 100%; }
}
</style>
