<template>
  <q-page class="ob-page">

    <div class="ob-stars" aria-hidden="true">
      <div v-for="s in stars" :key="s.id" class="ob-star"
        :style="{ left: s.x+'%', top: s.y+'%', width: s.r+'px', height: s.r+'px', opacity: s.o }"/>
    </div>

    <div class="ob-wrap">

      <!-- logo -->
      <div class="ob-logo-row">
        <router-link to="/" class="ob-logo">
          <span class="ob-logo-exo">EXO</span><span class="ob-logo-topia">TOPIA</span>
        </router-link>
        <span class="ob-tagline">a project of Sustainable Community Development Hub</span>
      </div>

      <!-- step rail -->
      <div class="ob-rail">
        <div v-for="(s, i) in STEPS" :key="i"
          class="ob-rail-item"
          :class="{
            'ob-rail-item--done':   i < step,
            'ob-rail-item--active': i === step,
            'ob-rail-item--future': i > step,
          }"
          @click="i < step && (step = i)"
        >
          <div class="ob-rail-dot">
            <span v-if="i < step">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="ob-rail-label">{{ s.label }}</span>
          <div v-if="i < STEPS.length - 1" class="ob-rail-line"/>
        </div>
      </div>

      <Transition name="ob-step" mode="out-in">

      <!-- ══ STEP 0 — MISSION ══════════════════════════════════════════════════ -->
      <div v-if="step === 0" key="0" class="ob-card">
        <div class="ob-card-hero">
          <div class="ob-hero-icon">🌍</div>
          <h1 class="ob-card-title">Welcome to Exotopia</h1>
          <p class="ob-card-sub">
            Exotopia is built by <strong>Sustainable Community Development Hub</strong>
            to support learning, field science, community projects, and vocational
            training — with the observable universe as the canvas.
          </p>
        </div>

        <div class="ob-mission-strip">
          <div class="ob-mission-item">
            <span class="ob-mission-dot" style="background:#44ff88"/>
            <span>Teach and learn living systems — water, soil, food, energy, biodiversity</span>
          </div>
          <div class="ob-mission-item">
            <span class="ob-mission-dot" style="background:#00e5ff"/>
            <span>Document and restore ecosystems harmed by industrial production economies</span>
          </div>
          <div class="ob-mission-item">
            <span class="ob-mission-dot" style="background:#ffaa33"/>
            <span>Build vocational skills and earn certificates that carry real-world weight</span>
          </div>
          <div class="ob-mission-item">
            <span class="ob-mission-dot" style="background:#cc88ff"/>
            <span>Every contribution you make — in the field, in the community, on this platform — earns your place in the cosmos</span>
          </div>
        </div>

        <div class="ob-cosmic-note">
          <div class="ob-cn-label">The cosmic layer</div>
          <p class="ob-cn-body">
            Settlements here range from rocky exoplanet surfaces to orbital stations
            near extreme objects. The same living-systems knowledge that applies to a
            habitat orbiting a black hole applies to the atmosphere, watersheds, and
            soil of the planet you're standing on right now. That's not metaphor —
            it's the design.
          </p>
        </div>

        <q-btn unelevated rounded color="teal-8" icon-right="arrow_forward"
          label="Choose my path" class="full-width ob-next-btn" @click="step = 1"/>
      </div>

      <!-- ══ STEP 1 — PATH ═════════════════════════════════════════════════════ -->
      <div v-else-if="step === 1" key="1" class="ob-card">
        <div class="ob-card-hero">
          <div class="ob-hero-icon">🧭</div>
          <h2 class="ob-card-title">What brings you here?</h2>
          <p class="ob-card-sub">
            Pick the area that fits you best. Every path leads to a settlement —
            the difference is what grows there and what activity confirms it.
          </p>
        </div>

        <div class="ob-path-list">
          <button
            v-for="p in PATHS" :key="p.id"
            class="ob-path-card"
            :class="{ 'ob-path-card--selected': selectedPath === p.id }"
            @click="selectedPath = p.id; selectedCommitment = null"
          >
            <span class="ob-path-icon">{{ p.icon }}</span>
            <div class="ob-path-body">
              <div class="ob-path-title">{{ p.title }}</div>
              <div class="ob-path-desc">{{ p.desc }}</div>
              <div class="ob-path-persona">{{ p.persona }}</div>
              <div class="ob-path-example">e.g. {{ p.example }}</div>
            </div>
            <div v-if="selectedPath === p.id" class="ob-path-check">✓</div>
          </button>
        </div>

        <div class="ob-nav-row">
          <q-btn flat rounded size="sm" color="blue-grey-5" icon="chevron_left" label="Back" @click="step--"/>
          <q-btn unelevated rounded color="teal-8" icon-right="arrow_forward"
            label="Continue" :disable="!selectedPath" @click="step = 2"/>
        </div>
      </div>

      <!-- ══ STEP 2 — COMMIT ═══════════════════════════════════════════════════ -->
      <div v-else-if="step === 2" key="2" class="ob-card">
        <div class="ob-card-hero">
          <div class="ob-hero-icon">{{ activePath?.icon }}</div>
          <h2 class="ob-card-title">{{ activePath?.commitTitle }}</h2>
          <p class="ob-card-sub">{{ activePath?.commitSub }}</p>
        </div>

        <div class="ob-section-label">Pick one — just one</div>
        <div class="ob-commit-list">
          <button
            v-for="c in activePath?.commitments ?? []" :key="c.id"
            class="ob-commit-card"
            :class="{ 'ob-commit-card--selected': selectedCommitment === c.id }"
            @click="selectedCommitment = c.id"
          >
            <span class="ob-commit-icon">{{ c.icon }}</span>
            <div class="ob-commit-body">
              <div class="ob-commit-title">{{ c.title }}</div>
              <div class="ob-commit-desc">{{ c.desc }}</div>
            </div>
            <div v-if="selectedCommitment === c.id" class="ob-commit-check">✓</div>
          </button>
        </div>

        <p class="ob-commit-note">You can do more later. This is just your first step.</p>

        <div class="ob-nav-row">
          <q-btn flat rounded size="sm" color="blue-grey-5" icon="chevron_left" label="Back" @click="step--"/>
          <q-btn unelevated rounded color="teal-8" icon-right="arrow_forward"
            label="This is my first step" :disable="!selectedCommitment" @click="step = 3"/>
        </div>
      </div>

      <!-- ══ STEP 3 — YOUR PLACE ═══════════════════════════════════════════════ -->
      <div v-else-if="step === 3" key="3" class="ob-card">
        <div class="ob-card-hero">
          <div class="ob-hero-icon">🪐</div>
          <h2 class="ob-card-title">Your place in the cosmos</h2>
          <p class="ob-card-sub">
            Enter your name and we'll reserve a real exoplanet settlement for you.
            No wallet, no fee. Your first activity confirms it.
          </p>
        </div>

        <div class="ob-name-field">
          <label class="ob-field-label">Your name or handle</label>
          <input
            v-model="displayName"
            class="ob-input"
            placeholder="e.g. Muirithi · Glipish · Sister Pat"
            maxlength="40"
            @input="updatePlanet"
          />
        </div>

        <Transition name="ob-fade">
        <div v-if="displayName.trim().length >= 2" class="ob-planet-preview">
          <div class="ob-planet-header">
            <span class="ob-planet-dot"/>
            <span class="ob-planet-label">Reserved settlement</span>
          </div>
          <div class="ob-planet-name">{{ planet.name }}</div>
          <div class="ob-planet-meta">{{ planet.type }} · {{ planet.dist }} ly from Earth</div>
          <div class="ob-planet-address">
            exo-surface-v1:<span class="ob-planet-addr-host">{{ planet.host }}</span>:{{ planet.slug }}
          </div>
          <div class="ob-planet-note">
            Confirmed when you complete: <em>{{ activeCommitment?.title }}</em>
          </div>
        </div>
        </Transition>

        <div class="ob-path-hiw">
          <div class="ob-hiw-title">What grows in this settlement</div>
          <div v-for="item in activePath?.settlementItems ?? []" :key="item.text" class="ob-hiw-item">
            <span class="ob-hiw-dot" :style="`background:${item.color}`"/>
            {{ item.text }}
          </div>
        </div>

        <div class="ob-nav-row">
          <q-btn flat rounded size="sm" color="blue-grey-5" icon="chevron_left" label="Back" @click="step--"/>
          <q-btn unelevated rounded color="teal-8" icon-right="arrow_forward"
            label="Reserve my settlement" :disable="displayName.trim().length < 2"
            @click="step = 4"/>
        </div>
      </div>

      <!-- ══ STEP 4 — BEGIN ════════════════════════════════════════════════════ -->
      <div v-else-if="step === 4" key="4" class="ob-card ob-card--ready">
        <div class="ob-card-hero">
          <div class="ob-hero-icon ob-hero-icon--pulse">🌌</div>
          <h2 class="ob-card-title">{{ displayName.trim() }}, you're in.</h2>
          <p class="ob-card-sub">
            <strong>{{ planet.name }}</strong> is reserved.
            Time for your first step.
          </p>
        </div>

        <!-- Settlement address chip -->
        <div class="ob-settlement-chip">
          <span class="ob-sc-label">Your settlement</span>
          <span class="ob-sc-addr">exo-surface-v1:{{ planet.host }}:{{ planet.slug }}</span>
          <router-link
            :to="`/surface/${encodeURIComponent(planet.host)}/${planet.slug}`"
            class="ob-sc-visit"
          >Visit →</router-link>
        </div>

        <!-- Primary CTA — commitment-specific -->
        <router-link :to="activeCommitment?.to ?? '/'" class="ob-primary-cta">
          <span class="ob-cta-icon">{{ activeCommitment?.icon }}</span>
          <div class="ob-cta-body">
            <div class="ob-cta-label">Your first commitment</div>
            <div class="ob-cta-title">{{ activeCommitment?.title }}</div>
            <div class="ob-cta-desc">{{ activeCommitment?.ctaDesc }}</div>
          </div>
          <span class="ob-cta-arrow">→</span>
        </router-link>

        <!-- PFAS context — shown only for eco path -->
        <div v-if="selectedPath === 'eco'" class="ob-eco-context">
          <div class="ob-eco-ctx-head">Why PFAS and microplastics?</div>
          <p class="ob-eco-ctx-body">
            PFOS, PFOA, and thousands of related "forever chemicals" are released by
            semiconductor manufacturing, firefighting foam, food packaging, and textile
            production. In 2026 they are active contaminants in watersheds on every
            inhabited continent — and they are traceable. Citizen science mapping of
            sources and field sampling of local water bodies directly supports
            regulatory accountability and ecosystem restoration. Your data matters.
          </p>
        </div>

        <!-- Secondary navigation -->
        <div class="ob-section-label">Also available to you</div>
        <div class="ob-secondary-grid">
          <router-link to="/" class="ob-secondary-card">
            <span class="ob-sec-icon">🌌</span>
            <span class="ob-sec-title">Explore the cosmos</span>
          </router-link>
          <router-link to="/eco-library" class="ob-secondary-card">
            <span class="ob-sec-icon">📚</span>
            <span class="ob-sec-title">Eco Library</span>
          </router-link>
          <router-link to="/learn" class="ob-secondary-card">
            <span class="ob-sec-icon">🎓</span>
            <span class="ob-sec-title">Training modules</span>
          </router-link>
          <router-link to="/blog" class="ob-secondary-card">
            <span class="ob-sec-icon">📡</span>
            <span class="ob-sec-title">Working notes</span>
          </router-link>
        </div>

        <!-- Optional on-chain upgrade -->
        <details class="ob-chain-upgrade">
          <summary class="ob-chain-summary">
            Make your settlement permanent on-chain (optional)
          </summary>
          <div class="ob-chain-body">
            <p>
              Your settlement exists and is navigable right now without a wallet.
              Minting it as an NFT gives you a permanent, transferable ownership record
              and unlocks the full pon.ink token economy.
            </p>
            <router-link to="/mint" class="ob-chain-link">Go to mint page →</router-link>
          </div>
        </details>

      </div>
      </Transition>

    </div><!-- /ob-wrap -->
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGuestProfile } from 'src/composables/useGuestProfile'

const { profile, update, complete } = useGuestProfile()

// Local state — selectedRole/selectedCommunity reused as path/commitment storage
const step               = ref(profile.value.onboardingStep)
const selectedPath       = ref<string | null>(profile.value.selectedRole)
const selectedCommitment = ref<string | null>(profile.value.selectedCommunity)
const displayName        = ref(profile.value.displayName)

watch([step, selectedPath, selectedCommitment, displayName], () =>
  update({
    onboardingStep:    step.value,
    selectedRole:      selectedPath.value,
    selectedCommunity: selectedCommitment.value,
    displayName:       displayName.value,
  })
)

watch(step, (s) => { if (s === 4) complete() })

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Mission'    },
  { label: 'Path'       },
  { label: 'Commit'     },
  { label: 'Your Place' },
  { label: 'Begin'      },
]

// ── Data types ────────────────────────────────────────────────────────────────

interface Commitment {
  id:      string
  icon:    string
  title:   string
  desc:    string
  to:      string
  ctaDesc: string
}

interface Path {
  id:             string
  icon:           string
  title:          string
  desc:           string
  persona:        string
  example:        string
  commitTitle:    string
  commitSub:      string
  commitments:    Commitment[]
  settlementItems: { text: string; color: string }[]
}

// ── Paths ─────────────────────────────────────────────────────────────────────

const PATHS: Path[] = [
  {
    id:      'learn',
    icon:    '📖',
    title:   'Learning & Discovery',
    desc:    'Explore the Eco Library — resources on PFAS contamination, living systems design, biodiversity, traditional ecological knowledge, and sustainable infrastructure. No required sequence. Follow what interests you.',
    persona: 'Choose this if you are new to eco systems, want to understand what PFAS is and how it moves through watersheds, or want context before taking field action.',
    example: 'Read about upstream PFAS producer responsibility',
    commitTitle: 'What do you want to learn about first?',
    commitSub:   'Our library draws from ApproVideo and field partners across 12 domains of sustainable living — water, soil, food, energy, biodiversity, climate, and restoration.',
    commitments: [
      {
        id:      'learn-library',
        icon:    '📚',
        title:   'Browse the Eco Library',
        desc:    'Explore resources across 12 living-systems domains. No quiz required — follow what interests you.',
        to:      '/eco-library',
        ctaDesc: 'Open the library and find something that interests you.',
      },
      {
        id:      'learn-quiz',
        icon:    '🧠',
        title:   'Take a knowledge quiz',
        desc:    'Short flashcard-style quizzes on water systems, PFAS basics, soil ecology, or renewable energy.',
        to:      '/learn',
        ctaDesc: 'Open the quiz system and pick a topic to start.',
      },
      {
        id:      'learn-blog',
        icon:    '📡',
        title:   'Read the working notes',
        desc:    'Our blog covers upstream PFAS producer responsibility, East Coast citizen science networks, library ecology proposals, and more.',
        to:      '/blog',
        ctaDesc: 'Open the blog and find a post that connects to your work.',
      },
    ],
    settlementItems: [
      { text: 'A library dome linked to your completed reading and modules', color: '#44ff88' },
      { text: 'Knowledge certificates displayed in your dome interior',       color: '#ffaa33' },
      { text: 'Ecocity infrastructure added as you complete each domain',     color: '#cc88ff' },
    ],
  },
  {
    id:      'project',
    icon:    '🔨',
    title:   'Make a Project',
    desc:    'Start or join a community eco project — a water monitoring network, a restoration plan, a local species guide, a resource translation, or a direct contribution to this platform\'s tools and content.',
    persona: 'Choose this if you have something in mind you want to build, a place you want to document, or a gap you\'ve already noticed in the available resources.',
    example: 'Name and log a stream you want to monitor',
    commitTitle: 'What kind of project are you closest to making?',
    commitSub:   'Projects here connect to real places and real communities. You can start with something small and grow it over time.',
    commitments: [
      {
        id:      'project-eco',
        icon:    '🌊',
        title:   'Start an eco field project',
        desc:    'Name a site you want to monitor — a stream, a wetland, a garden. Log it and start building a field record.',
        to:      '/eco-ops',
        ctaDesc: 'Open Eco Ops and create your first field site.',
      },
      {
        id:      'project-content',
        icon:    '📝',
        title:   'Contribute a resource to the library',
        desc:    'Add a video, guide, or document to the Eco Library. A technique, a local species, a traditional practice — anything useful.',
        to:      '/eco-library',
        ctaDesc: 'Open the Eco Library and add a resource.',
      },
      {
        id:      'project-platform',
        icon:    '🛠️',
        title:   'Improve this platform',
        desc:    'Submit a feature idea, flag something broken, or improve documentation. Platform contributions earn settlement credits.',
        to:      '/docs',
        ctaDesc: 'Open the docs and find something to improve or propose.',
      },
      {
        id:      'project-rewards',
        icon:    '🏅',
        title:   'Log volunteering and see your points',
        desc:    'Field submissions and self-reported volunteering (like a plastics-collection tally) feed one shared points ledger and Impact Profile.',
        to:      '/rewards',
        ctaDesc: 'Open your Rewards page and log an action.',
      },
    ],
    settlementItems: [
      { text: 'A project beacon object for each active field project you hold', color: '#00e5ff' },
      { text: 'Site pins on your settlement map for monitored locations',       color: '#44ff88' },
      { text: 'Contributor credits for accepted platform improvements',         color: '#ffaa33' },
    ],
  },
  {
    id:      'certify',
    icon:    '🎓',
    title:   'Train & Certify',
    desc:    'Work through vocational modules built from the ApproVideo library and SCD Hub field partners — water and sanitation, renewable energy, food systems, citizen science. Completing a module earns a certificate and an ecocity object for your settlement.',
    persona: 'Choose this if you want verifiable credentials, are an educator building curriculum, or want a structured pathway from concept to field practice.',
    example: 'Start the WATSAN module — about 30 minutes',
    commitTitle: 'Which training track fits where you are right now?',
    commitSub:   'Each track draws from the ApproVideo library and our field partners. Modules run 20–60 minutes. Completing one earns a certificate and an ecocity object for your settlement.',
    commitments: [
      {
        id:      'certify-watsan',
        icon:    '💧',
        title:   'Water & Sanitation (WATSAN)',
        desc:    'Biosand filtration, rainwater harvesting, water quality testing, and community water system design.',
        to:      '/learn',
        ctaDesc: 'Start the WATSAN module — about 30 minutes.',
      },
      {
        id:      'certify-citizen',
        icon:    '🔬',
        title:   'Citizen Science track',
        desc:    'PFAS monitoring basics, freshwater phenology, tick ecology, cyanobacteria identification, and community data submission.',
        to:      '/learn',
        ctaDesc: 'Start the Citizen Science track — pick your first module.',
      },
      {
        id:      'certify-energy',
        icon:    '☀️',
        title:   'Renewable Energy basics',
        desc:    'Solar sizing, battery systems, micro-hydro, community energy planning — applicable to off-grid settlements here and in the cosmos.',
        to:      '/learn',
        ctaDesc: 'Start the Energy module.',
      },
      {
        id:      'certify-finance',
        icon:    '💰',
        title:   'Personal Finance Literacy (P-Fin 8)',
        desc:    'Eight questions across earning, saving, investing, borrowing, insuring, and more. Completing it unlocks a settlement seed; the full P-Fin Index unlocks a parallel-universe settlement.',
        to:      '/learn',
        ctaDesc: 'Start the P-Fin 8 quiz — about 10 minutes.',
      },
    ],
    settlementItems: [
      { text: 'Certificate badges displayed inside your settlement dome',               color: '#ffaa33' },
      { text: 'Ecocity infrastructure objects matching your certification domain',      color: '#44ff88' },
      { text: 'Educator role unlocked once you complete a full track',                  color: '#cc88ff' },
    ],
  },
  {
    id:      'help',
    icon:    '🛠️',
    title:   'Help Build This Platform',
    desc:    'Report issues, propose features, improve documentation, or claim a development bounty. Every accepted contribution is credited to your settlement record and, where applicable, compensated through the bounty system.',
    persona: 'Choose this if you have technical, documentation, or design skills — or if you just found something that doesn\'t work right and want to see it fixed.',
    example: 'Submit a feature you wish existed',
    commitTitle: 'How do you want to help?',
    commitSub:   'Exotopia is open source and actively built by SCD Hub. We have open issues, documented bounties, and a lot of territory left to map. Whatever your skill, there is a place for it here.',
    commitments: [
      {
        id:      'help-issues',
        icon:    '🐛',
        title:   'Find and report an issue',
        desc:    'Explore the platform and report anything broken, confusing, or missing. Every valid report is logged, credited, and linked to your settlement.',
        to:      '/docs',
        ctaDesc: 'Explore the platform — note what you\'d fix and submit it.',
      },
      {
        id:      'help-feature',
        icon:    '💡',
        title:   'Submit a feature request',
        desc:    'Have an idea for something that should exist? We have a structured bounty system for proposals that get built into the platform.',
        to:      '/docs',
        ctaDesc: 'Open the docs and submit your feature idea.',
      },
      {
        id:      'help-content',
        icon:    '📖',
        title:   'Add or improve content',
        desc:    'Contribute to the eco library, improve glossary entries, add blog commentary, or help translate existing resources.',
        to:      '/eco-library',
        ctaDesc: 'Open the Eco Library and contribute a resource or edit.',
      },
    ],
    settlementItems: [
      { text: 'Contribution credit object added for each accepted issue or feature', color: '#00e5ff' },
      { text: 'Builder badge displayed on your settlement profile',                  color: '#ffaa33' },
      { text: 'Bounty earnings convertible to settlement upgrade tokens',            color: '#44ff88' },
    ],
  },
  {
    id:      'eco',
    icon:    '🌊',
    title:   'Eco Field Work',
    desc:    'Monitor water quality, map PFAS and microplastic contamination sources, conduct ecosystem surveys, or support restoration in your watershed. Data you collect feeds directly into community records accessible to regulators, researchers, and other field teams.',
    persona: 'Choose this if you are already near a water body, industrial site, or ecosystem under stress — or if you want to connect existing field work to a broader network.',
    example: 'Log your nearest stream as a monitoring site',
    commitTitle: 'What field work are you closest to?',
    commitSub:   'PFOS, PFOA, and related "forever chemicals" are active contaminants in 2026 watersheds globally. Citizen science tracking makes them visible and attributable. Where do you want to start?',
    commitments: [
      {
        id:      'eco-monitor',
        icon:    '💧',
        title:   'Log a water monitoring site',
        desc:    'Any stream, pond, tap, wetland, or coastline near you. Takes 2 minutes. You can add test data, photos, and notes over time.',
        to:      '/eco-ops',
        ctaDesc: 'Open Eco Ops and log your first monitoring site.',
      },
      {
        id:      'eco-pfas',
        icon:    '🏭',
        title:   'Map a potential PFAS source',
        desc:    'Document an industrial site, airport, fire station, semiconductor plant, or manufacturing facility near you — location, type, and notes.',
        to:      '/eco-ops',
        ctaDesc: 'Open Eco Ops and log a PFAS source near you.',
      },
      {
        id:      'eco-learn',
        icon:    '🔬',
        title:   'Learn PFAS monitoring basics',
        desc:    'Understand how forever chemicals move through watersheds, what field sampling looks like, and how to read public contamination databases.',
        to:      '/eco-library',
        ctaDesc: 'Open the Eco Library and start with the PFAS monitoring section.',
      },
    ],
    settlementItems: [
      { text: 'Water monitoring station added for each site you log',                 color: '#44ff88' },
      { text: 'Field records linked to your settlement and visible to your network',  color: '#00e5ff' },
      { text: 'Ecosystem restoration objects earned as your field data accumulates',  color: '#ffaa33' },
    ],
  },
]

// ── Derived ───────────────────────────────────────────────────────────────────

const activePath = computed(() =>
  PATHS.find(p => p.id === selectedPath.value) ?? null
)

const activeCommitment = computed(() =>
  activePath.value?.commitments.find(c => c.id === selectedCommitment.value) ?? null
)

// ── Planet pool — real confirmed exoplanets ───────────────────────────────────

const PLANET_POOL = [
  { name: 'Kepler-442 b',  host: 'Kepler-442',       slug: 'Kepler-442+b',       type: 'Rocky super-Earth',    dist: '1,206' },
  { name: 'Kepler-22 b',   host: 'Kepler-22',         slug: 'Kepler-22+b',        type: 'Ocean-candidate',      dist: '620'   },
  { name: 'Kepler-186 f',  host: 'Kepler-186',        slug: 'Kepler-186+f',       type: 'Rocky Earth-sized',    dist: '492'   },
  { name: 'HD 40307 g',    host: 'HD 40307',          slug: 'HD+40307+g',         type: 'Super-Earth',          dist: '42'    },
  { name: 'Gliese 667C c', host: 'Gliese 667C',       slug: 'Gliese+667+Cc',      type: 'Temperate HZ world',   dist: '23'    },
  { name: 'TRAPPIST-1 e',  host: 'TRAPPIST-1',        slug: 'TRAPPIST-1+e',       type: 'Rocky HZ candidate',   dist: '40'    },
  { name: 'TRAPPIST-1 f',  host: 'TRAPPIST-1',        slug: 'TRAPPIST-1+f',       type: 'Rocky ocean-possible', dist: '40'    },
  { name: 'K2-18 b',       host: 'K2-18',             slug: 'K2-18+b',            type: 'Hycean-candidate',     dist: '124'   },
  { name: 'TOI-700 d',     host: 'TOI-700',           slug: 'TOI-700+d',          type: 'Earth-sized, HZ',      dist: '101'   },
  { name: 'LHS 1140 b',    host: 'LHS 1140',          slug: 'LHS+1140+b',         type: 'Rocky super-Earth',    dist: '41'    },
  { name: 'Kepler-452 b',  host: 'Kepler-452',        slug: 'Kepler-452+b',       type: 'Earth cousin, HZ',     dist: '1,402' },
  { name: 'Kepler-62 f',   host: 'Kepler-62',         slug: 'Kepler-62+f',        type: 'Water-world candidate',dist: '1,200' },
  { name: 'Proxima Cen b', host: 'Proxima Cen',       slug: 'Proxima+Cen+b',      type: 'Rocky, nearest star',  dist: '4.2'   },
  { name: 'GJ 357 d',      host: 'GJ 357',            slug: 'GJ+357+d',           type: 'Super-Earth, outer HZ',dist: '31'    },
  { name: 'Kepler-1229 b', host: 'Kepler-1229',       slug: 'Kepler-1229+b',      type: 'Rocky, cool star',     dist: '770'   },
  { name: 'Wolf 1061 c',   host: 'Wolf 1061',         slug: 'Wolf+1061+c',        type: 'Super-Earth, HZ edge', dist: '14'    },
  { name: 'Kepler-283 c',  host: 'Kepler-283',        slug: 'Kepler-283+c',       type: 'Sub-Neptune, HZ',      dist: '1,741' },
  { name: 'GJ 3323 b',     host: 'GJ 3323',           slug: 'GJ+3323+b',          type: 'Rocky, red dwarf',     dist: '17'    },
  { name: 'Ross 128 b',    host: 'Ross 128',          slug: 'Ross+128+b',         type: 'Temperate Earth-size', dist: '11'    },
  { name: "Teegarden b",   host: "Teegarden's Star",  slug: 'Teegarden+b',        type: 'Earth-mass, HZ',       dist: '12'    },
]

function nameHash (s: string): number {
  let h = 5381
  for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0
  return h
}

const planet = ref(PLANET_POOL[0]!)

function updatePlanet () {
  const name = displayName.value.trim()
  if (name.length < 2) return
  planet.value = PLANET_POOL[nameHash(name) % PLANET_POOL.length]!
}

// ── Stars backdrop ────────────────────────────────────────────────────────────

const stars = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x:  Math.random() * 100,
  y:  Math.random() * 100,
  r:  0.5 + Math.random() * 1.5,
  o:  0.15 + Math.random() * 0.45,
}))
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */

.ob-page {
  background: #020610;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: 'Courier New', monospace;
}

.ob-stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.ob-star  { position: absolute; border-radius: 50%; background: #ffffff; }

.ob-wrap {
  position: relative; z-index: 1;
  max-width: 640px; margin: 0 auto;
  padding: 28px 20px 80px;
  display: flex; flex-direction: column; gap: 24px;
}

/* ── Logo ─────────────────────────────────────────────────────────────────── */

.ob-logo-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.ob-logo { text-decoration: none; font-size: 14px; font-weight: 300; letter-spacing: 0.18em; }
.ob-logo-exo   { color: #4dd0e1; }
.ob-logo-topia { color: #90a4ae; }
.ob-tagline { font-size: 9px; letter-spacing: 0.08em; color: rgba(80,180,120,0.55); }

/* ── Step rail ────────────────────────────────────────────────────────────── */

.ob-rail {
  display: flex; align-items: center;
  padding: 10px 14px;
  background: rgba(0,8,22,0.70);
  border: 1px solid rgba(0,80,130,0.18);
  border-radius: 7px;
}

.ob-rail-item {
  display: flex; align-items: center; gap: 6px; flex: 1;
  cursor: default; opacity: 0.40; transition: opacity 0.16s;
}
.ob-rail-item--done   { opacity: 0.75; cursor: pointer; }
.ob-rail-item--active { opacity: 1.00; }

.ob-rail-dot {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  background: rgba(0,30,70,0.70); border: 1px solid rgba(0,100,160,0.30);
  color: rgba(80,150,200,0.60); font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.ob-rail-item--done   .ob-rail-dot { background: rgba(0,60,40,0.60); border-color: rgba(60,200,120,0.45); color: rgba(80,230,140,0.90); }
.ob-rail-item--active .ob-rail-dot { background: rgba(0,60,130,0.60); border-color: rgba(0,200,255,0.55); color: rgba(0,230,255,0.95); }

.ob-rail-label {
  font-size: 8px; letter-spacing: 0.10em;
  color: rgba(80,140,180,0.60); white-space: nowrap; overflow: hidden;
}
.ob-rail-item--active .ob-rail-label { color: rgba(0,210,255,0.80); }
.ob-rail-line { flex: 1; height: 1px; background: rgba(0,80,130,0.22); margin: 0 4px; }

/* ── Card shell ───────────────────────────────────────────────────────────── */

.ob-card {
  background: rgba(0,8,22,0.88);
  border: 1px solid rgba(0,120,180,0.22);
  border-radius: 10px;
  padding: 24px;
  display: flex; flex-direction: column; gap: 18px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.65);
}
.ob-card--ready { border-color: rgba(60,200,120,0.30); }

.ob-card-hero { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
.ob-hero-icon { font-size: 44px; line-height: 1; }
.ob-hero-icon--pulse { animation: ob-pulse 2.8s ease-in-out infinite; }
@keyframes ob-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.10); } }

.ob-card-title {
  font-size: 22px; font-weight: 300; margin: 0;
  color: rgba(210,240,255,0.92); letter-spacing: 0.04em;
}
.ob-card-sub {
  font-size: 11px; color: rgba(120,175,215,0.72);
  line-height: 1.72; max-width: 480px; margin: 0;
}
.ob-card-sub strong { color: rgba(200,230,255,0.88); }

/* ── Section label ────────────────────────────────────────────────────────── */

.ob-section-label {
  font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(60,130,160,0.55); padding-bottom: 2px;
  border-bottom: 1px solid rgba(0,80,130,0.14);
}

/* ── Mission strip (step 0) ───────────────────────────────────────────────── */

.ob-mission-strip {
  display: flex; flex-direction: column; gap: 10px;
  padding: 16px;
  background: rgba(0,12,22,0.60);
  border: 1px solid rgba(0,80,130,0.15);
  border-radius: 8px;
}

.ob-mission-item {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 10px; color: rgba(140,190,220,0.75); line-height: 1.60;
}

.ob-mission-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
}

/* ── Cosmic note (step 0) ─────────────────────────────────────────────────── */

.ob-cosmic-note {
  padding: 14px 16px;
  background: rgba(0,20,40,0.55);
  border: 1px solid rgba(0,100,160,0.20);
  border-radius: 8px;
}

.ob-cn-label {
  font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(0,160,200,0.50); margin-bottom: 6px;
}

.ob-cn-body {
  font-size: 10px; color: rgba(100,160,200,0.65); line-height: 1.70; margin: 0;
}

/* ── Path cards (step 1) ──────────────────────────────────────────────────── */

.ob-path-list { display: flex; flex-direction: column; gap: 8px; }

.ob-path-card {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px;
  background: rgba(0,12,30,0.65);
  border: 1px solid rgba(0,80,130,0.20);
  border-radius: 7px; cursor: pointer; text-align: left;
  transition: border-color 0.14s, background 0.14s;
  position: relative;
}
.ob-path-card:hover     { border-color: rgba(60,200,120,0.35); background: rgba(0,20,40,0.82); }
.ob-path-card--selected { border-color: rgba(60,200,120,0.60); background: rgba(0,40,25,0.50); }

.ob-path-icon    { font-size: 24px; flex-shrink: 0; padding-top: 2px; }
.ob-path-body    { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.ob-path-title   { font-size: 11px; font-weight: 600; color: rgba(200,235,210,0.90); }
.ob-path-desc    { font-size: 9px; color: rgba(100,155,125,0.65); line-height: 1.58; }
.ob-path-persona { font-size: 8.5px; color: rgba(80,140,110,0.50); line-height: 1.50; font-style: italic; }
.ob-path-example {
  display: inline-block; margin-top: 2px;
  font-size: 8px; letter-spacing: 0.06em;
  color: rgba(0,180,140,0.55);
  background: rgba(0,80,50,0.22);
  border: 1px solid rgba(0,140,90,0.18);
  border-radius: 3px; padding: 2px 7px;
}
.ob-path-card--selected .ob-path-example {
  color: rgba(60,220,140,0.75);
  background: rgba(0,100,60,0.28);
  border-color: rgba(0,180,110,0.28);
}
.ob-path-check   { font-size: 14px; color: rgba(60,220,120,0.90); margin-left: auto; padding-left: 8px; flex-shrink: 0; align-self: center; }

/* ── Commit cards (step 2) ────────────────────────────────────────────────── */

.ob-commit-list { display: flex; flex-direction: column; gap: 8px; }

.ob-commit-card {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px;
  background: rgba(0,12,30,0.65);
  border: 1px solid rgba(0,80,130,0.20);
  border-radius: 7px; cursor: pointer; text-align: left;
  transition: border-color 0.14s, background 0.14s;
  position: relative;
}
.ob-commit-card:hover     { border-color: rgba(0,180,240,0.35); background: rgba(0,20,40,0.82); }
.ob-commit-card--selected { border-color: rgba(0,180,240,0.60); background: rgba(0,25,50,0.60); }

.ob-commit-icon  { font-size: 22px; flex-shrink: 0; padding-top: 1px; }
.ob-commit-body  { flex: 1; }
.ob-commit-title { font-size: 11px; font-weight: 600; color: rgba(180,225,255,0.90); margin-bottom: 4px; }
.ob-commit-desc  { font-size: 9px; color: rgba(90,140,175,0.65); line-height: 1.55; }
.ob-commit-check { font-size: 14px; color: rgba(0,210,255,0.90); margin-left: auto; padding-left: 8px; flex-shrink: 0; }

.ob-commit-note {
  font-size: 9px; color: rgba(80,130,160,0.50); text-align: center;
  font-style: italic; padding: 2px 0;
}

/* ── Name field & planet preview ──────────────────────────────────────────── */

.ob-name-field { display: flex; flex-direction: column; gap: 6px; }
.ob-field-label { font-size: 8px; letter-spacing: 0.12em; color: rgba(0,180,120,0.55); text-transform: uppercase; }

.ob-input {
  background: rgba(0,10,25,0.80);
  border: 1px solid rgba(0,120,160,0.30);
  border-radius: 6px;
  color: rgba(200,240,220,0.88);
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 10px 14px;
  outline: none;
  transition: border-color 0.14s;
  width: 100%;
}
.ob-input::placeholder { color: rgba(60,120,100,0.40); }
.ob-input:focus { border-color: rgba(0,200,160,0.50); }

.ob-planet-preview {
  background: rgba(0,20,10,0.55);
  border: 1px solid rgba(60,200,120,0.28);
  border-radius: 8px;
  padding: 16px 18px;
  display: flex; flex-direction: column; gap: 5px;
}
.ob-planet-header { display: flex; align-items: center; gap: 7px; }
.ob-planet-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #44ff88; box-shadow: 0 0 6px #44ff88; flex-shrink: 0;
  animation: ob-blink 1.8s ease-in-out infinite;
}
@keyframes ob-blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

.ob-planet-label   { font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(60,200,120,0.60); }
.ob-planet-name    { font-size: 20px; font-weight: 300; color: rgba(200,255,220,0.92); letter-spacing: 0.06em; }
.ob-planet-meta    { font-size: 9px; color: rgba(100,180,140,0.60); }
.ob-planet-address { font-size: 8.5px; color: rgba(60,140,100,0.55); word-break: break-all; line-height: 1.5; }
.ob-planet-addr-host { color: rgba(0,200,160,0.70); }
.ob-planet-note    { font-size: 9px; color: rgba(80,160,110,0.55); font-style: italic; margin-top: 4px; }

/* ── Settlement growth list (step 3) ─────────────────────────────────────── */

.ob-path-hiw {
  background: rgba(0,12,22,0.60);
  border: 1px solid rgba(0,80,130,0.15);
  border-radius: 7px;
  padding: 14px 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.ob-hiw-title { font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(0,160,200,0.45); margin-bottom: 4px; }
.ob-hiw-item  { display: flex; align-items: flex-start; gap: 10px; font-size: 9.5px; color: rgba(120,175,215,0.68); line-height: 1.55; }
.ob-hiw-dot   { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }

/* ── Settlement chip ──────────────────────────────────────────────────────── */

.ob-settlement-chip {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 14px;
  background: rgba(0,30,20,0.55);
  border: 1px solid rgba(60,200,120,0.28);
  border-radius: 6px; font-size: 9px;
}
.ob-sc-label { color: rgba(60,200,120,0.60); letter-spacing: 0.10em; text-transform: uppercase; flex-shrink: 0; }
.ob-sc-addr  { color: rgba(0,200,160,0.75); flex: 1; word-break: break-all; }
.ob-sc-visit { color: rgba(0,220,180,0.80); text-decoration: none; flex-shrink: 0; }
.ob-sc-visit:hover { color: #44ffcc; }

/* ── Primary CTA (step 4) ─────────────────────────────────────────────────── */

.ob-primary-cta {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
  background: rgba(0,40,80,0.60);
  border: 1px solid rgba(0,160,230,0.35);
  border-radius: 9px; text-decoration: none;
  transition: border-color 0.14s, background 0.14s;
}
.ob-primary-cta:hover {
  border-color: rgba(0,200,255,0.55);
  background: rgba(0,55,100,0.70);
}

.ob-cta-icon  { font-size: 28px; flex-shrink: 0; }
.ob-cta-body  { flex: 1; }
.ob-cta-label { font-size: 7.5px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(0,170,220,0.50); margin-bottom: 4px; }
.ob-cta-title { font-size: 12px; font-weight: 600; color: rgba(180,225,255,0.90); margin-bottom: 3px; }
.ob-cta-desc  { font-size: 9px; color: rgba(80,145,190,0.65); line-height: 1.55; }
.ob-cta-arrow { font-size: 18px; color: rgba(0,180,240,0.60); flex-shrink: 0; }

/* ── PFAS context box (eco path, step 4) ─────────────────────────────────── */

.ob-eco-context {
  padding: 14px 16px;
  background: rgba(0,30,15,0.55);
  border: 1px solid rgba(40,160,80,0.22);
  border-radius: 8px;
}
.ob-eco-ctx-head {
  font-size: 8.5px; letter-spacing: 0.10em; text-transform: uppercase;
  color: rgba(60,190,100,0.60); margin-bottom: 7px;
}
.ob-eco-ctx-body {
  font-size: 9.5px; color: rgba(100,165,130,0.68); line-height: 1.70; margin: 0;
}

/* ── Secondary grid (step 4) ─────────────────────────────────────────────── */

.ob-secondary-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}

.ob-secondary-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 6px; text-decoration: none;
  background: rgba(0,12,28,0.65);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 7px; text-align: center;
  transition: border-color 0.14s, background 0.14s;
}
.ob-secondary-card:hover {
  border-color: rgba(0,160,200,0.30);
  background: rgba(0,20,40,0.85);
}
.ob-sec-icon  { font-size: 20px; }
.ob-sec-title { font-size: 8px; color: rgba(100,160,190,0.65); line-height: 1.40; }

/* ── On-chain upgrade ─────────────────────────────────────────────────────── */

.ob-chain-upgrade {
  border: 1px solid rgba(0,80,130,0.18);
  border-radius: 7px;
  overflow: hidden;
}
.ob-chain-summary {
  padding: 10px 14px;
  font-size: 9.5px; letter-spacing: 0.05em;
  color: rgba(60,120,160,0.55);
  cursor: pointer; list-style: none;
  transition: color 0.13s;
}
.ob-chain-summary:hover { color: rgba(0,160,220,0.70); }
.ob-chain-summary::-webkit-details-marker { display: none; }
.ob-chain-summary::before { content: '+ '; }
details[open] .ob-chain-summary::before { content: '− '; }

.ob-chain-body {
  padding: 12px 14px 14px;
  border-top: 1px solid rgba(0,80,130,0.14);
  background: rgba(0,8,22,0.50);
}
.ob-chain-body p { font-size: 9.5px; color: rgba(100,155,195,0.68); line-height: 1.65; margin: 0 0 10px; }
.ob-chain-link { font-size: 9.5px; color: rgba(0,160,220,0.70); text-decoration: underline; }
.ob-chain-link:hover { color: rgba(0,220,255,0.85); }

/* ── Nav row ──────────────────────────────────────────────────────────────── */

.ob-nav-row {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(0,60,100,0.20); padding-top: 12px;
}

.ob-next-btn { font-size: 12px; letter-spacing: 0.08em; padding: 10px 24px; }

/* ── Step transition ──────────────────────────────────────────────────────── */

.ob-step-enter-active { transition: opacity 0.24s ease, transform 0.24s ease; }
.ob-step-leave-active { transition: opacity 0.16s ease, transform 0.16s ease; }
.ob-step-enter-from   { opacity: 0; transform: translateX(18px); }
.ob-step-leave-to     { opacity: 0; transform: translateX(-14px); }

.ob-fade-enter-active { transition: opacity 0.30s ease; }
.ob-fade-leave-active { transition: opacity 0.16s ease; }
.ob-fade-enter-from, .ob-fade-leave-to { opacity: 0; }

/* ── Mobile responsive ────────────────────────────────────────────────────── */

@media (max-width: 600px) {
  .ob-wrap { padding: 16px 14px 80px; gap: 18px; }
  .ob-card { padding: 16px; gap: 14px; }
  .ob-card-title { font-size: 18px; }
  .ob-hero-icon { font-size: 36px; }
  .ob-card-sub { font-size: 10.5px; }
  .ob-input { font-size: 16px; }
  .ob-nav-row { gap: 10px; }
  .ob-next-btn { width: 100%; justify-content: center; }
  .ob-settlement-chip { flex-direction: column; align-items: flex-start; gap: 6px; }
  .ob-sc-addr { font-size: 8px; }
  .ob-planet-name { font-size: 16px; }
  .ob-secondary-grid { grid-template-columns: repeat(2, 1fr); }
  .ob-primary-cta { flex-wrap: wrap; }
}

@media (max-width: 380px) {
  .ob-rail-label { display: none; }
  .ob-rail { padding: 8px; gap: 0; }
  .ob-rail-line { min-width: 6px; }
  .ob-card { padding: 12px; }
  .ob-card-title { font-size: 15px; }
  .ob-path-card, .ob-commit-card { padding: 10px 12px; }
}
</style>
