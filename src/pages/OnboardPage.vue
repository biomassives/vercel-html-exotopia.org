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
        <span class="ob-tagline">Your real-world work earns a place in the cosmos</span>
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

      <!-- ══ STEP 0 — Role ═══════════════════════════════════════════════════ -->
      <div v-if="step === 0" key="0" class="ob-card">
        <div class="ob-card-hero">
          <div class="ob-hero-icon">🌍</div>
          <h1 class="ob-card-title">Welcome to Exotopia</h1>
          <p class="ob-card-sub">
            Every confirmed exoplanet in the observable sky is a potential settlement.
            Your real-world activity — eco field work, cultural production, community
            training, food pantry volunteering — earns you a permanent place in that
            universe. No wallet needed to begin.
          </p>
        </div>

        <div class="ob-section-label">What best describes you?</div>
        <div class="ob-role-grid">
          <button
            v-for="r in ROLES" :key="r.id"
            class="ob-role-card"
            :class="{ 'ob-role-card--selected': selectedRole === r.id }"
            @click="selectedRole = r.id"
          >
            <span class="ob-role-icon">{{ r.icon }}</span>
            <div class="ob-role-body">
              <div class="ob-role-title">{{ r.title }}</div>
              <div class="ob-role-desc">{{ r.desc }}</div>
            </div>
            <div v-if="selectedRole === r.id" class="ob-role-check">✓</div>
          </button>
        </div>

        <q-btn unelevated rounded color="teal-8" icon-right="arrow_forward"
          label="Continue" :disable="!selectedRole"
          class="full-width ob-next-btn" @click="step = 1"/>
      </div>

      <!-- ══ STEP 1 — Community ══════════════════════════════════════════════ -->
      <div v-else-if="step === 1" key="1" class="ob-card">
        <div class="ob-card-hero">
          <div class="ob-hero-icon">🤝</div>
          <h2 class="ob-card-title">Your community</h2>
          <p class="ob-card-sub">
            Exotopia settlements are community spaces. Find your group below,
            or start building your own path solo.
          </p>
        </div>

        <div class="ob-comm-list">
          <button
            v-for="c in COMMUNITIES" :key="c.id"
            class="ob-comm-card"
            :class="{ 'ob-comm-card--selected': selectedCommunity === c.id }"
            @click="selectedCommunity = c.id"
          >
            <div class="ob-comm-head">
              <span class="ob-comm-icon">{{ c.icon }}</span>
              <div>
                <div class="ob-comm-name">{{ c.name }}</div>
                <div class="ob-comm-loc">{{ c.location }}</div>
              </div>
              <div v-if="selectedCommunity === c.id" class="ob-comm-check">✓</div>
            </div>
            <div class="ob-comm-tags">
              <span v-for="t in c.tags" :key="t" class="ob-comm-tag"
                :style="`border-color:${c.color}44;color:${c.color}`">{{ t }}</span>
            </div>
            <p class="ob-comm-desc">{{ c.desc }}</p>
          </button>
        </div>

        <div class="ob-nav-row">
          <q-btn flat rounded size="sm" color="blue-grey-5" icon="chevron_left" label="Back" @click="step--"/>
          <q-btn unelevated rounded color="teal-8" icon-right="arrow_forward"
            label="This is my community" :disable="!selectedCommunity" @click="step = 2"/>
        </div>
      </div>

      <!-- ══ STEP 2 — Your Place ════════════════════════════════════════════ -->
      <div v-else-if="step === 2" key="2" class="ob-card">
        <div class="ob-card-hero">
          <div class="ob-hero-icon">🪐</div>
          <h2 class="ob-card-title">Your place in the cosmos</h2>
          <p class="ob-card-sub">
            Enter your name and we'll reserve a real exoplanet settlement —
            no wallet, no fee. Your first check-in confirms it.
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
          <div class="ob-planet-meta">
            {{ planet.type }} · {{ planet.dist }} ly from Earth
          </div>
          <div class="ob-planet-address">
            exo-surface-v1:<span class="ob-planet-addr-host">{{ planet.host }}</span>:{{ planet.slug }}
          </div>
          <div class="ob-planet-note">
            Confirmed by your first eco-ops check-in or community activity.
          </div>
        </div>
        </Transition>

        <div class="ob-how-it-works">
          <div class="ob-hiw-title">How it works</div>
          <div class="ob-hiw-item">
            <span class="ob-hiw-dot" style="background:#44ff88"/>
            Log real-world eco or cultural activity → your settlement is confirmed
          </div>
          <div class="ob-hiw-item">
            <span class="ob-hiw-dot" style="background:#ffaa33"/>
            Continued activity grows your settlement — more objects, bigger dome
          </div>
          <div class="ob-hiw-item">
            <span class="ob-hiw-dot" style="background:#cc88ff"/>
            Complete a training module → earn a certificate and an ecocity object
          </div>
          <div class="ob-hiw-item">
            <span class="ob-hiw-dot" style="background:#00e5ff"/>
            Make it permanent on-chain at any time — your choice, not a requirement
          </div>
        </div>

        <div class="ob-nav-row">
          <q-btn flat rounded size="sm" color="blue-grey-5" icon="chevron_left" label="Back" @click="step--"/>
          <q-btn unelevated rounded color="teal-8" icon-right="arrow_forward"
            label="Reserve my planet" :disable="displayName.trim().length < 2"
            @click="step = 3"/>
        </div>
      </div>

      <!-- ══ STEP 3 — Start ════════════════════════════════════════════════ -->
      <div v-else-if="step === 3" key="3" class="ob-card ob-card--ready">
        <div class="ob-card-hero">
          <div class="ob-hero-icon ob-hero-icon--pulse">🌌</div>
          <h2 class="ob-card-title">{{ displayName.trim() }}, you're in the cosmos</h2>
          <p class="ob-card-sub">
            <strong>{{ planet.name }}</strong> is reserved for you in the
            {{ activeCommunity.name }} sector.
            Your first activity confirms it.
          </p>
        </div>

        <!-- Settlement address chip -->
        <div class="ob-settlement-chip">
          <span class="ob-sc-label">Your settlement</span>
          <span class="ob-sc-addr">exo-surface-v1:{{ planet.host }}:{{ planet.slug }}</span>
          <router-link :to="`/surface-view/${encodeURIComponent(planet.host)}`" class="ob-sc-visit">
            Visit →
          </router-link>
        </div>

        <!-- First actions grid -->
        <div class="ob-section-label">Choose your first step</div>
        <div class="ob-action-grid">
          <router-link
            v-for="a in firstActions"
            :key="a.label"
            :to="a.to"
            class="ob-action-card"
            :style="`--ac:${a.color}`"
          >
            <span class="ob-action-icon">{{ a.icon }}</span>
            <div class="ob-action-title">{{ a.title }}</div>
            <div class="ob-action-desc">{{ a.desc }}</div>
            <div v-if="a.primary" class="ob-action-badge">Start here</div>
          </router-link>
        </div>

        <!-- Community coordination block -->
        <div v-if="activeCommunity.id !== 'solo'" class="ob-coord-block">
          <div class="ob-coord-head">
            <span class="ob-coord-icon">{{ activeCommunity.icon }}</span>
            <div>
              <div class="ob-coord-name">{{ activeCommunity.name }}</div>
              <div class="ob-coord-desc">{{ activeCommunity.coordDesc }}</div>
            </div>
          </div>
          <div class="ob-coord-links">
            <a v-if="activeCommunity.coordUrl" :href="activeCommunity.coordUrl"
              target="_blank" rel="noopener" class="ob-coord-btn">
              {{ activeCommunity.coordLabel }} ↗
            </a>
            <router-link v-if="activeCommunity.internalRoute"
              :to="activeCommunity.internalRoute" class="ob-coord-btn ob-coord-btn--alt">
              {{ activeCommunity.internalLabel }} →
            </router-link>
          </div>
        </div>

        <!-- Optional on-chain upgrade -->
        <details class="ob-chain-upgrade">
          <summary class="ob-chain-summary">
            Make your settlement permanent on-chain (optional)
          </summary>
          <div class="ob-chain-body">
            <p>
              Your Exotopia settlement exists and is navigable right now without a
              blockchain wallet. When you're ready, minting a deed as an NFT gives you
              a permanent, transferable record of ownership — and unlocks the full
              pon.ink token economy.
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
import { ref, computed } from 'vue'

// ── Wizard state ──────────────────────────────────────────────────────────────

const step              = ref(0)
const selectedRole      = ref<string | null>(null)
const selectedCommunity = ref<string | null>(null)
const displayName       = ref('')

// ── Config ────────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Role'       },
  { label: 'Community'  },
  { label: 'Your Place' },
  { label: 'Start'      },
]

const ROLES = [
  {
    id:    'field',
    icon:  '🌿',
    title: 'Field Worker',
    desc:  'I do eco-ops work: water quality mapping, recycling, agroforestry, or land surveys',
  },
  {
    id:    'artist',
    icon:  '🎨',
    title: 'Artist & Creator',
    desc:  'I make music, visual art, film, or other cultural work that carries community stories',
  },
  {
    id:    'educator',
    icon:  '📚',
    title: 'Educator & Trainer',
    desc:  'I run workshops, training sessions, or community education programmes',
  },
  {
    id:    'coordinator',
    icon:  '🤝',
    title: 'Community Coordinator',
    desc:  'I organise people, resources, and logistics — including food pantry and community support work',
  },
  {
    id:    'explorer',
    icon:  '🔭',
    title: 'Explorer',
    desc:  'I\'m here to learn, look around, and see what this is all about',
  },
]

const COMMUNITIES = [
  {
    id:            'funky-pony',
    icon:          '🐴',
    name:          'Funky Pony',
    location:      'Food pantry coordination network — funkypony.space',
    color:         '#ffcc44',
    tags:          ['Food bank', 'Volunteers', 'Daily call queue', 'Donors', 'Coordination'],
    desc:          'Funky Pony coordinates food pantry operations: daily phone-call queues let members claim pick-up tickets, flag stocking needs, request specific items, and route volunteers and donors to where they\'re needed — low stress, high coverage.',
    coordDesc:     'Join the daily coordination call or log a volunteer shift. Every contribution earns activity on your Exotopia settlement.',
    coordUrl:      'https://funkypony.space',
    coordLabel:    'Open Funky Pony',
    internalRoute: '/eco-ops',
    internalLabel: 'Log a coordination activity',
  },
  {
    id:            'fana-ka',
    icon:          '🎵',
    name:          'Fana Ka',
    location:      'Nairobi, Kenya',
    color:         '#ff6644',
    tags:          ['Music', 'Youth culture', 'Rap battles', 'Events'],
    desc:          'A Nairobi youth music and cultural movement. Rap battles, digital rights education, and community events form the foundation of their work in the cosmos.',
    coordDesc:     'Join the Fana Ka coordination channel to find upcoming events, sessions, and how your cultural work connects to your settlement.',
    coordUrl:      null,
    coordLabel:    '',
    internalRoute: '/eco-ops',
    internalLabel: 'Log an event activity',
  },
  {
    id:            'uni-kibaoni',
    icon:          '🌿',
    name:          'Uni-Kibaoni Peace Youth SHG',
    location:      'Mpeketoni · Lamu County, Kenya',
    color:         '#44ff88',
    tags:          ['Eco-ops', 'Water quality', 'Recycling', 'Agroforestry'],
    desc:          'A self-help group in Mpeketoni working on biosand filters, rainwater harvesting, composting, and community recycling. Led by Muirithi Jariffe.',
    coordDesc:     'Log eco-ops field activities, water quality readings, or recycling events. Every check-in builds your planet.',
    coordUrl:      null,
    coordLabel:    '',
    internalRoute: '/eco-ops',
    internalLabel: 'Log a field check-in',
  },
  {
    id:            'ot-kulcha',
    icon:          '🎨',
    name:          'OT Kulcha',
    location:      'Kingston, Jamaica · Nairobi, Kenya',
    color:         '#cc88ff',
    tags:          ['Visual art', 'Photography', 'Pain in the Ghetto', 'Cross-diaspora'],
    desc:          '"Pain in the Ghetto" — a Kingston-Nairobi visual art and photography collaboration documenting life, beauty, and resilience in urban communities.',
    coordDesc:     'Submit artwork, join the gallery, or coordinate with the OT Kulcha network on upcoming projects.',
    coordUrl:      null,
    coordLabel:    '',
    internalRoute: '/gallery',
    internalLabel: 'Browse the gallery',
  },
  {
    id:            'solo',
    icon:          '🔭',
    name:          'Starting solo',
    location:      'Your own path',
    color:         '#4488cc',
    tags:          ['Independent', 'Researcher', 'Curious'],
    desc:          'Explore Exotopia on your own terms. You can join a community group at any time, or build your settlement through individual eco-ops and learning activities.',
    coordDesc:     '',
    coordUrl:      null,
    coordLabel:    '',
    internalRoute: '/',
    internalLabel: 'Explore the cosmos',
  },
]

// ── Planet pool — real confirmed exoplanets ───────────────────────────────────

const PLANET_POOL = [
  { name: 'Kepler-442 b',       host: 'Kepler-442',       slug: 'Kepler-442+b',       type: 'Rocky super-Earth',    dist: '1,206' },
  { name: 'Kepler-22 b',        host: 'Kepler-22',         slug: 'Kepler-22+b',        type: 'Ocean-candidate',      dist: '620'   },
  { name: 'Kepler-186 f',       host: 'Kepler-186',        slug: 'Kepler-186+f',       type: 'Rocky Earth-sized',    dist: '492'   },
  { name: 'HD 40307 g',         host: 'HD 40307',          slug: 'HD+40307+g',         type: 'Super-Earth',          dist: '42'    },
  { name: 'Gliese 667C c',      host: 'Gliese 667C',       slug: 'Gliese+667+Cc',      type: 'Temperate HZ world',   dist: '23'    },
  { name: 'TRAPPIST-1 e',       host: 'TRAPPIST-1',        slug: 'TRAPPIST-1+e',       type: 'Rocky HZ candidate',   dist: '40'    },
  { name: 'TRAPPIST-1 f',       host: 'TRAPPIST-1',        slug: 'TRAPPIST-1+f',       type: 'Rocky ocean-possible', dist: '40'    },
  { name: 'K2-18 b',            host: 'K2-18',             slug: 'K2-18+b',            type: 'Hycean-candidate',     dist: '124'   },
  { name: 'TOI-700 d',          host: 'TOI-700',           slug: 'TOI-700+d',          type: 'Earth-sized, HZ',      dist: '101'   },
  { name: 'LHS 1140 b',         host: 'LHS 1140',          slug: 'LHS+1140+b',         type: 'Rocky super-Earth',    dist: '41'    },
  { name: 'Kepler-452 b',       host: 'Kepler-452',        slug: 'Kepler-452+b',       type: 'Earth cousin, HZ',     dist: '1,402' },
  { name: 'Kepler-62 f',        host: 'Kepler-62',         slug: 'Kepler-62+f',        type: 'Water-world candidate',dist: '1,200' },
  { name: 'Proxima Cen b',      host: 'Proxima Cen',       slug: 'Proxima+Cen+b',      type: 'Rocky, nearest star',  dist: '4.2'  },
  { name: 'GJ 357 d',           host: 'GJ 357',            slug: 'GJ+357+d',           type: 'Super-Earth, outer HZ',dist: '31'   },
  { name: 'Kepler-1229 b',      host: 'Kepler-1229',       slug: 'Kepler-1229+b',      type: 'Rocky, cool star',     dist: '770'  },
  { name: 'Wolf 1061 c',        host: 'Wolf 1061',         slug: 'Wolf+1061+c',        type: 'Super-Earth, HZ edge', dist: '14'   },
  { name: 'Kepler-283 c',       host: 'Kepler-283',        slug: 'Kepler-283+c',       type: 'Sub-Neptune, HZ',      dist: '1,741'},
  { name: 'GJ 3323 b',          host: 'GJ 3323',           slug: 'GJ+3323+b',          type: 'Rocky, red dwarf',     dist: '17'   },
  { name: 'Ross 128 b',         host: 'Ross 128',          slug: 'Ross+128+b',         type: 'Temperate Earth-size', dist: '11'   },
  { name: "Teegarden b",        host: "Teegarden's Star",  slug: 'Teegarden+b',        type: 'Earth-mass, HZ',       dist: '12'   },
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

// ── Derived ───────────────────────────────────────────────────────────────────

const activeCommunity = computed(() =>
  COMMUNITIES.find(c => c.id === selectedCommunity.value) ?? COMMUNITIES[COMMUNITIES.length - 1]!
)

const ROLE_ACTIONS: Record<string, { icon: string; title: string; desc: string; to: string; color: string; primary?: true; label?: string }[]> = {
  field: [
    { icon: '💧', title: 'Log a field check-in', desc: 'Record water quality data, recycling activity, or a farm observation', to: '/eco-ops', color: '#44ff88', primary: true, label: 'field-checkin' },
    { icon: '🗺️', title: 'Map an eco site',       desc: 'Add a location to the community eco-ops map',                         to: '/eco-ops', color: '#44ff88',              label: 'field-map'     },
    { icon: '🌌', title: 'Visit your planet',     desc: 'See your settlement, dome interior, and community objects',            to: `/surface-view/${encodeURIComponent(planet.value.host)}`, color: '#00e5ff', label: 'field-planet' },
  ],
  artist: [
    { icon: '🎨', title: 'Browse the gallery',    desc: 'See community artwork from OT Kulcha and Fana Ka',                   to: '/gallery', color: '#cc88ff', primary: true, label: 'art-gallery' },
    { icon: '🎵', title: 'Find a cultural event', desc: 'Upcoming music sessions, rap battles, and art workshops',             to: '/docs',    color: '#ff6644',              label: 'art-events'  },
    { icon: '🌌', title: 'Visit your planet',     desc: 'See your settlement and community objects',                           to: `/surface-view/${encodeURIComponent(planet.value.host)}`, color: '#00e5ff', label: 'art-planet' },
  ],
  educator: [
    { icon: '📚', title: 'Start a training module', desc: 'WATSAN, energy, shelter, or food system modules — earn a certificate',  to: '/learn',        color: '#ffaa33', primary: true, label: 'edu-train'   },
    { icon: '🏗️', title: 'Browse ecocity designs',  desc: 'Biosand filters, rainwater harvesters, composting units',              to: '/eco-library',  color: '#44ff88',              label: 'edu-eco'     },
    { icon: '🌌', title: 'Visit your planet',       desc: 'See your planet and training centre settlement objects',               to: `/surface-view/${encodeURIComponent(planet.value.host)}`, color: '#00e5ff', label: 'edu-planet' },
  ],
  coordinator: [
    { icon: '🐴', title: 'Open Funky Pony',            desc: 'Join the daily queue call — claim a ticket, flag a need, route a donor', to: '/eco-ops', color: '#ffcc44', primary: true, label: 'coord-fp'    },
    { icon: '📋', title: 'Log a coordination activity', desc: 'Record a group session, scheduling work, or volunteer shift',            to: '/eco-ops', color: '#ffcc44',              label: 'coord-log'   },
    { icon: '🌌', title: 'Visit your planet',           desc: 'See your settlement and community hub objects',                          to: `/surface-view/${encodeURIComponent(planet.value.host)}`, color: '#00e5ff', label: 'coord-planet' },
  ],
  explorer: [
    { icon: '🌌', title: 'Explore the cosmic map', desc: 'Navigate from galaxy clusters to exoplanet surfaces',  to: '/',       color: '#00e5ff', primary: true, label: 'exp-map'    },
    { icon: '🪐', title: 'Visit your planet',      desc: `Land on ${planet.value.name} and see your settlement`, to: `/surface-view/${encodeURIComponent(planet.value.host)}`, color: '#4488cc', label: 'exp-planet' },
    { icon: '📖', title: 'Read the blog',          desc: 'Working notes on astronomy data, void math, and the ecosystem', to: '/blog', color: '#8899aa', label: 'exp-blog' },
  ],
}

const firstActions = computed(() =>
  ROLE_ACTIONS[selectedRole.value ?? 'explorer'] ?? ROLE_ACTIONS['explorer']!
)

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

.ob-logo-row { display: flex; align-items: baseline; gap: 12px; }
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

/* ── Role cards ───────────────────────────────────────────────────────────── */

.ob-role-grid { display: flex; flex-direction: column; gap: 8px; }

.ob-role-card {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 14px;
  background: rgba(0,12,30,0.65);
  border: 1px solid rgba(0,80,130,0.20);
  border-radius: 7px; cursor: pointer; text-align: left;
  transition: border-color 0.14s, background 0.14s;
  position: relative;
}
.ob-role-card:hover     { border-color: rgba(60,200,120,0.35); background: rgba(0,20,40,0.82); }
.ob-role-card--selected { border-color: rgba(60,200,120,0.60); background: rgba(0,40,25,0.50); }

.ob-role-icon  { font-size: 22px; flex-shrink: 0; padding-top: 1px; }
.ob-role-body  { flex: 1; }
.ob-role-title { font-size: 11px; font-weight: 600; color: rgba(200,235,210,0.90); margin-bottom: 3px; }
.ob-role-desc  { font-size: 9px; color: rgba(100,155,125,0.65); line-height: 1.50; }
.ob-role-check { font-size: 14px; color: rgba(60,220,120,0.90); margin-left: auto; padding-left: 8px; }

/* ── Community cards ──────────────────────────────────────────────────────── */

.ob-comm-list { display: flex; flex-direction: column; gap: 10px; }

.ob-comm-card {
  padding: 14px;
  background: rgba(0,12,30,0.70);
  border: 1px solid rgba(0,80,130,0.20);
  border-radius: 8px; cursor: pointer; text-align: left;
  display: flex; flex-direction: column; gap: 8px;
  transition: border-color 0.14s, background 0.14s;
}
.ob-comm-card:hover     { border-color: rgba(100,200,150,0.30); background: rgba(0,18,40,0.85); }
.ob-comm-card--selected { border-color: rgba(60,220,120,0.50);  background: rgba(0,35,20,0.50); }

.ob-comm-head { display: flex; align-items: flex-start; gap: 10px; }
.ob-comm-icon { font-size: 22px; flex-shrink: 0; }
.ob-comm-name { font-size: 12px; font-weight: 600; color: rgba(210,240,220,0.90); }
.ob-comm-loc  { font-size: 8.5px; letter-spacing: 0.06em; color: rgba(80,140,100,0.55); margin-top: 2px; }
.ob-comm-check { margin-left: auto; font-size: 14px; color: rgba(60,220,120,0.90); padding-left: 8px; }

.ob-comm-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.ob-comm-tag  {
  font-size: 8px; padding: 2px 7px; border-radius: 3px;
  border: 1px solid; background: rgba(0,0,0,0.25);
  letter-spacing: 0.04em;
}

.ob-comm-desc { font-size: 9.5px; color: rgba(120,175,140,0.68); line-height: 1.60; margin: 0; }

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

/* ── How it works ─────────────────────────────────────────────────────────── */

.ob-how-it-works {
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

/* ── First action cards ───────────────────────────────────────────────────── */

.ob-action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
@media (max-width: 520px) { .ob-action-grid { grid-template-columns: 1fr; } }

.ob-action-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 16px 10px; text-decoration: none;
  background: rgba(0,12,28,0.75);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px; text-align: center; position: relative;
  transition: border-color 0.14s, background 0.14s, transform 0.12s;
}
.ob-action-card:hover {
  border-color: color-mix(in srgb, var(--ac) 40%, transparent);
  background: rgba(0,20,40,0.88);
  transform: translateY(-2px);
}
.ob-action-icon  { font-size: 24px; }
.ob-action-title { font-size: 10px; font-weight: 600; color: rgba(210,240,225,0.88); }
.ob-action-desc  { font-size: 8px; color: rgba(100,155,130,0.62); line-height: 1.50; }
.ob-action-badge {
  font-size: 6.5px; letter-spacing: 0.14em; padding: 2px 7px;
  background: rgba(60,200,120,0.18); border: 1px solid rgba(60,220,120,0.35);
  border-radius: 3px; color: rgba(60,220,120,0.85);
}

/* ── Community coordination block ────────────────────────────────────────── */

.ob-coord-block {
  background: rgba(0,15,10,0.55);
  border: 1px solid rgba(80,180,120,0.20);
  border-radius: 8px;
  padding: 14px 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.ob-coord-head { display: flex; align-items: flex-start; gap: 10px; }
.ob-coord-icon { font-size: 20px; flex-shrink: 0; }
.ob-coord-name { font-size: 11px; font-weight: 600; color: rgba(200,240,215,0.88); margin-bottom: 3px; }
.ob-coord-desc { font-size: 9px; color: rgba(100,165,130,0.65); line-height: 1.55; }
.ob-coord-links { display: flex; flex-wrap: wrap; gap: 8px; }

.ob-coord-btn {
  padding: 7px 14px; text-decoration: none;
  background: rgba(0,50,30,0.50); border: 1px solid rgba(60,180,100,0.35);
  border-radius: 5px; font-size: 9.5px; color: rgba(80,220,140,0.85);
  letter-spacing: 0.05em; transition: border-color 0.13s, background 0.13s;
}
.ob-coord-btn:hover { background: rgba(0,70,40,0.70); border-color: rgba(60,220,120,0.55); }
.ob-coord-btn--alt {
  background: rgba(0,20,40,0.50); border-color: rgba(0,120,180,0.30); color: rgba(80,180,220,0.80);
}
.ob-coord-btn--alt:hover { background: rgba(0,30,60,0.65); border-color: rgba(0,180,240,0.45); }

/* ── Optional on-chain upgrade ────────────────────────────────────────────── */

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
</style>
