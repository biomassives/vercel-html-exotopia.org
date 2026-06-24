<template>
  <q-page class="gallery-page">

    <!-- ════════════════════════════════════════════════════════════════
         GALLERY HERO — star field + edition branding
         ════════════════════════════════════════════════════════════════ -->
    <div class="gallery-hero">

      <!-- Star field -->
      <div class="gal-stars" aria-hidden="true">
        <div
          v-for="s in stars" :key="s.id"
          class="gal-star"
          :style="{ left: s.x + '%', top: s.y + '%', width: s.r + 'px', height: s.r + 'px', opacity: s.o, animationDelay: s.d + 's' }"
        />
      </div>

      <!-- Left: series info -->
      <div class="hero-left">
        <!-- Edition switcher -->
        <div class="edition-switcher">
          <button
            v-for="e in EDITIONS" :key="e.slug"
            :class="['ed-btn', { 'ed-btn--active': activeEditionSlug === e.slug }]"
            :style="{
              borderColor: activeEditionSlug === e.slug ? e.accentColor + 'aa' : 'rgba(255,255,255,0.08)',
              color:       activeEditionSlug === e.slug ? e.accentColor : 'rgba(120,160,190,0.55)',
              boxShadow:   activeEditionSlug === e.slug ? `0 0 14px ${e.accentColor}22` : 'none',
            }"
            @click="activeEditionSlug = e.slug; selectedCard = null"
          >
            <span class="ed-id">{{ String(e.id).padStart(2,'0') }}</span>
            {{ e.name }}
            <span class="ed-status" :class="`ed-status--${e.status}`">{{ STATUS_LABELS[e.status] }}</span>
          </button>
        </div>

        <div class="hero-edition-tag">
          <span class="hero-dot" :style="{ background: activeEdition.accentColor }" />
          {{ activeEdition.name.toUpperCase() }}
        </div>

        <h1 class="hero-title">
          EXOTOPIA<br>
          <span class="hero-title-sub">GALLERY</span>
        </h1>

        <p class="hero-desc">{{ activeEdition.tagline }}</p>

        <!-- Stats row -->
        <div class="hero-stats">
          <div class="stat-block">
            <div class="stat-value" :style="{ color: activeEdition.accentColor }">{{ activeEdition.totalCards }}</div>
            <div class="stat-label">ITEMS</div>
          </div>
          <div class="stat-block" v-for="s in EDITION_STATS" :key="s.label">
            <div class="stat-value" :style="{ color: s.color }">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>

        <!-- View tabs inline -->
        <div class="hero-tabs q-mt-lg">
          <button
            :class="['htab', { 'htab--active': activeView === 'cards' }]"
            @click="activeView = 'cards'"
          >
            <q-icon name="mdi-cards-outline" size="14px" class="q-mr-xs" />
            COLLECTOR CARDS
          </button>
          <button
            :class="['htab', { 'htab--active': activeView === 'orbital' }]"
            @click="activeView = 'orbital'"
          >
            <q-icon name="mdi-orbit" size="14px" class="q-mr-xs" />
            ORBITAL GALLERY
          </button>
        </div>
      </div>

      <!-- Right: card fan spread (same design as /mint hero) -->
      <div class="hero-fan">
        <div
          v-for="(fc, i) in fanCards" :key="fc.id"
          class="fan-slot"
          :style="fanStyle(i)"
          @click="selectCard(fc)"
        >
          <CollectorCard
            :card="fc"
            :width="fanCardWidth(i)"
            :height="Math.round(fanCardWidth(i) * 1.4)"
          />
        </div>
      </div>

    </div><!-- /hero -->

    <!-- Scrolling name ticker -->
    <div class="gal-ticker">
      <div class="ticker-track">
        <span v-for="c in [...COLLECTOR_CARDS, ...COLLECTOR_CARDS]" :key="c.id + '-' + c.name" class="ticker-item">
          <span class="ticker-num">#{{ String(c.id).padStart(2,'0') }}</span>
          {{ c.name }}
          <span class="ticker-rarity" :style="{ color: RARITY_CONFIG[c.rarity].color }">
            {{ RARITY_CONFIG[c.rarity].label }}
          </span>
          <span class="ticker-sep">◆</span>
        </span>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════
         COLLECTOR CARDS VIEW
         ════════════════════════════════════════════════════════════════ -->
    <div v-if="activeView === 'cards'" class="cards-section">

      <!-- Rarity filter bar -->
      <div class="filter-bar">
        <div class="filter-bar-left">
          <button
            :class="['filter-all', { 'filter-all--active': activeRarity === 'all' }]"
            @click="activeRarity = 'all'"
          >
            ALL · {{ COLLECTOR_CARDS.length }}
          </button>
          <button
            v-for="r in RARITY_FILTERS" :key="r.id"
            :class="['filter-pill', { 'filter-pill--active': activeRarity === r.id }]"
            :style="{
              borderColor: activeRarity === r.id ? r.color : 'rgba(255,255,255,0.08)',
              color:       activeRarity === r.id ? r.color : 'rgba(120,160,190,0.55)',
              boxShadow:   activeRarity === r.id ? `0 0 12px ${r.color}33` : 'none',
            }"
            @click="activeRarity = activeRarity === r.id ? 'all' : r.id"
          >
            <span class="filter-pip" :style="{ background: r.color }" />
            {{ r.label }}
            <span class="filter-count">{{ COLLECTOR_CARDS.filter(c => c.rarity === r.id).length }}</span>
          </button>
        </div>
        <div class="filter-showing">
          showing {{ filteredCards.length }} of {{ COLLECTOR_CARDS.length }}
        </div>
      </div>

      <!-- Card grid -->
      <div class="card-grid">
        <div
          v-for="card in filteredCards"
          :key="card.id"
          class="card-cell"
          :class="`card-cell--${card.rarity}`"
          :style="{
            '--rarity-color':  card.borderColor,
            '--rarity-glow':   card.glowColor,
          }"
          @click="selectCard(card)"
        >
          <!-- Rarity corner badge -->
          <div class="cell-corner-badge" :style="{ background: card.borderColor + '22', color: card.borderColor }">
            #{{ String(card.id).padStart(2,'0') }}
          </div>

          <!-- 3D flip scene -->
          <div class="flip-scene">
            <div class="flip-card">
              <!-- Front face -->
              <div class="flip-face flip-face--front">
                <CollectorCard :card="card" :width="220" :height="308" />
              </div>
              <!-- Back face -->
              <div class="flip-face flip-face--back">
                <CollectorCardBack :card="card" :width="220" :height="308" />
              </div>
            </div>
          </div>

          <div class="cell-footer">
            <div class="cell-name">{{ card.name }}</div>
            <div class="cell-sub">
              <span class="cell-rarity" :style="{ color: card.borderColor }">
                {{ RARITY_CONFIG[card.rarity].label }}
              </span>
              <span class="cell-edition">{{ card.edition }}/{{ card.maxEdition }}</span>
            </div>
            <!-- Score bar -->
            <div class="cell-score-track">
              <div class="cell-score-fill"
                :style="{ width: (card.rarityScore / 10 * 100) + '%', background: card.borderColor }" />
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ════════════════════════════════════════════════════════════════
         ORBITAL GALLERY — station announcements + feature targets
         ════════════════════════════════════════════════════════════════ -->
    <div v-else class="orbital-section">

      <!-- Star field backdrop -->
      <div class="orb-stars" aria-hidden="true">
        <div v-for="s in orbStars" :key="s.id" class="orb-star"
          :style="{ left:s.x+'%', top:s.y+'%', width:s.r+'px', height:s.r+'px', opacity:s.o, animationDelay:s.d+'s' }" />
      </div>

      <!-- Header -->
      <div class="orb-header">
        <div class="orb-header-left">
          <div class="orb-title">
            <q-icon name="mdi-orbit" color="cyan-5" size="16px" class="q-mr-xs" />
            ORBITAL STATION ANNOUNCEMENTS
          </div>
          <div class="orb-subtitle">
            Feature targets · deployment status · community milestones
          </div>
        </div>
        <div class="orb-legend">
          <span v-for="s in STATUS_CONFIG" :key="s.id" class="orb-legend-item">
            <span class="orb-legend-dot" :style="{ background: s.color }" />
            {{ s.label }}
          </span>
        </div>
      </div>

      <!-- Announcement grid -->
      <div class="orb-grid">
        <div
          v-for="ann in ANNOUNCEMENTS"
          :key="ann.id"
          class="orb-station"
          :class="`orb-station--${ann.status}`"
          :style="{ '--status-color': STATUS_CONFIG.find(s=>s.id===ann.status)?.color ?? '#445566' }"
        >
          <!-- Station header -->
          <div class="ost-head">
            <div class="ost-hex">⬡</div>
            <div class="ost-id">STN-{{ String(ann.id).padStart(3,'0') }}</div>
            <div class="ost-status-chip">
              {{ STATUS_CONFIG.find(s => s.id === ann.status)?.label }}
            </div>
          </div>

          <!-- Content -->
          <div class="ost-title">{{ ann.title }}</div>
          <div class="ost-desc">{{ ann.description }}</div>

          <!-- Tags row -->
          <div class="ost-tags">
            <span class="ost-tag ost-tag--cat">{{ ann.category }}</span>
            <span v-for="t in ann.targets" :key="t" class="ost-tag">{{ t }}</span>
          </div>

          <!-- Target date / chain if set -->
          <div v-if="ann.target || ann.chain" class="ost-footer">
            <span v-if="ann.chain" class="ost-chain">{{ ann.chain }}</span>
            <span v-if="ann.target" class="ost-target">⊙ {{ ann.target }}</span>
          </div>
        </div>
      </div>

      <!-- WebXR prototype collapse button -->
      <details class="orb-xr-details">
        <summary class="orb-xr-summary">
          <q-icon name="mdi-shield-check" size="11px" class="q-mr-xs" />
          WebXR Prototype (sandboxed iframe)
        </summary>
        <div class="orb-xr-frame-wrap">
          <iframe
            src="/gallery/index.html"
            sandbox="allow-scripts allow-same-origin"
            allow="xr-spatial-tracking"
            referrerpolicy="no-referrer"
            class="orbital-frame-inline"
            title="Orbital Gallery — WebXR prototype"
          />
        </div>
      </details>

    </div>

    <!-- ════════════════════════════════════════════════════════════════
         CARD DETAIL PANEL (slide in from right)
         ════════════════════════════════════════════════════════════════ -->
    <Transition name="panel-slide">
      <div
        v-if="selectedCard"
        class="detail-panel"
        :style="{ '--rarity-color': selectedCard.borderColor, '--rarity-glow': selectedCard.glowColor }"
      >
        <!-- Panel header -->
        <div class="panel-header">
          <div class="panel-header-bg" />
          <div class="panel-title">
            <span class="panel-num">#{{ String(selectedCard.id).padStart(2,'0') }}</span>
            {{ selectedCard.name }}
          </div>
          <div class="panel-rarity-label" :style="{ color: selectedCard.borderColor }">
            {{ RARITY_CONFIG[selectedCard.rarity].label }}
          </div>
          <q-btn flat dense round icon="close" color="blue-grey-5" size="xs"
            class="panel-close" @click="selectedCard = null" />
        </div>

        <div class="panel-body">
          <!-- Card large view -->
          <div class="panel-card-wrap">
            <CollectorCard :card="selectedCard" :width="260" :height="364" />
            <!-- Rarity halo under card -->
            <div class="panel-card-halo" :style="{ background: selectedCard.glowColor }" />
          </div>

          <!-- Info column -->
          <div class="panel-info">

            <!-- Description -->
            <div class="panel-section">
              <div class="panel-section-label">ABOUT</div>
              <p class="panel-desc">{{ selectedCard.description }}</p>
            </div>

            <!-- Score bars -->
            <div class="panel-section">
              <div class="panel-section-label">RARITY SCORE</div>
              <div class="score-display">
                <span class="score-num" :style="{ color: selectedCard.borderColor }">
                  {{ selectedCard.rarityScore }}
                </span>
                <span class="score-denom">/10</span>
                <div class="score-bar">
                  <div class="score-fill"
                    :style="{ width: (selectedCard.rarityScore / 10 * 100) + '%', background: selectedCard.borderColor }" />
                </div>
              </div>
            </div>

            <!-- Attributes table -->
            <div class="panel-section">
              <div class="panel-section-label">ATTRIBUTES</div>
              <div class="attr-table">
                <div v-for="a in selectedCard.attributes" :key="a.trait_type" class="attr-row">
                  <span class="attr-key">{{ a.trait_type }}</span>
                  <span class="attr-val">{{ a.value }}</span>
                </div>
              </div>
            </div>

            <!-- Mint status -->
            <div class="panel-section">
              <div class="panel-section-label">MINT STATUS</div>
              <div class="mint-status-row">
                <div class="mint-count">
                  <span class="mint-minted" :style="{ color: selectedCard.borderColor }">
                    {{ selectedCard.mintedCount }}
                  </span>
                  <span class="mint-max"> / {{ selectedCard.maxEdition }} minted</span>
                </div>
                <div class="availability-chip"
                  :class="selectedCard.mintedCount < selectedCard.maxEdition ? 'avail--open' : 'avail--sold'"
                >
                  {{ selectedCard.mintedCount < selectedCard.maxEdition ? 'AVAILABLE' : 'SOLD OUT' }}
                </div>
              </div>
              <div class="mint-bar-track">
                <div class="mint-bar-fill"
                  :style="{
                    width: (selectedCard.mintedCount / selectedCard.maxEdition * 100) + '%',
                    background: selectedCard.borderColor,
                  }" />
              </div>
              <div v-if="selectedCard.ipfsCid" class="cid-row">
                <span class="cid-label">IPFS CID</span>
                <span class="cid-val">{{ selectedCard.ipfsCid }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="panel-actions">
              <q-btn
                unelevated icon="mdi-hexagon-outline"
                label="Mint this card"
                class="full-width q-mb-xs"
                :style="{
                  background: selectedCard.borderColor + '22',
                  border: `1px solid ${selectedCard.borderColor}55`,
                  color: selectedCard.borderColor,
                }"
                :disable="selectedCard.mintedCount >= selectedCard.maxEdition"
                @click="$router.push('/mint')"
              />
              <q-btn
                outline color="blue-grey-6" icon="download"
                label="Download SVG" size="sm"
                class="full-width"
                @click="downloadSvg(selectedCard)"
              />
            </div>

          </div>
        </div>
      </div>
    </Transition>

    <!-- Panel backdrop -->
    <Transition name="backdrop-fade">
      <div v-if="selectedCard" class="panel-backdrop" @click="selectedCard = null" />
    </Transition>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CollectorCard     from 'src/components/CollectorCard.vue'
import CollectorCardBack from 'src/components/CollectorCardBack.vue'
import {
  EDITIONS, EDITION_TOC, STATUS_LABELS,
  type Edition,
} from 'src/data/editions/index'
import {
  RARITY_CONFIG,
  type CollectorCard as CardType, type CardRarity,
} from 'src/data/collector-cards'

// Active edition (default: edition 1)
const activeEditionSlug = ref(EDITIONS[0]!.slug)
const activeEdition = computed<Edition>(() =>
  EDITIONS.find(e => e.slug === activeEditionSlug.value) ?? EDITIONS[0]!
)
const COLLECTOR_CARDS = computed(() => activeEdition.value.cards)

const activeView   = ref<'cards' | 'orbital'>('cards')
const selectedCard = ref<CardType | null>(null)

function selectCard(card: CardType) {
  selectedCard.value = selectedCard.value?.id === card.id ? null : card
}

// ── Card fan spread — picks 5 cards from active edition for the fan ───────────
// Selects the 3 legendaries (or highest rarity) for centre/outer positions,
// and 2 rares for the adjacent slots. Falls back gracefully for smaller sets.

const fanCards = computed(() => {
  const cards = COLLECTOR_CARDS.value
  const leg   = cards.filter(c => c.rarity === 'legendary').slice(0, 3)
  const rare  = cards.filter(c => c.rarity === 'rare').slice(0, 2)
  // Fan order: outer-left, inner-left, CENTRE, inner-right, outer-right
  const five = [leg[0], rare[0], leg[1] ?? leg[0], rare[1] ?? rare[0], leg[2] ?? leg[0]]
  return five.filter(Boolean) as typeof cards
})

const FAN_ANGLES = [-22, -9, 0, 9, 22]
const FAN_YOFFS  = [28,  12, 0, 12, 28]
const FAN_Z      = [2,   3,  5,  3,  2]
const FAN_DELAY  = [0.6, 0.3, 0.0, 0.3, 0.6]

function fanStyle(i: number): Record<string, string> {
  return {
    transform:      `rotate(${FAN_ANGLES[i]}deg) translateY(${FAN_YOFFS[i]}px)`,
    zIndex:         String(FAN_Z[i]),
    animationDelay: FAN_DELAY[i] + 's',
  }
}

function fanCardWidth(i: number): number {
  return i === 2 ? 198 : (i === 1 || i === 3) ? 172 : 152
}

// ── Rarity filter ─────────────────────────────────────────────────────────────

type RarityFilter = CardRarity | 'all'
const activeRarity = ref<RarityFilter>('all')

const RARITY_FILTERS = [
  { id: 'legendary' as const, label: 'LEGENDARY', color: '#ffd700' },
  { id: 'rare'      as const, label: 'RARE',      color: '#4488ff' },
  { id: 'uncommon'  as const, label: 'UNCOMMON',  color: '#22cc66' },
  { id: 'common'    as const, label: 'COMMON',    color: '#667788' },
]

const filteredCards = computed(() =>
  activeRarity.value === 'all'
    ? COLLECTOR_CARDS.value
    : COLLECTOR_CARDS.value.filter(c => c.rarity === activeRarity.value)
)

// ── Edition stats ─────────────────────────────────────────────────────────────

// Dynamic edition stats — edition-agnostic counts
const EDITION_STATS = computed(() => [
  { value: String(activeEdition.value.cards.filter(c => c.rarity === 'legendary').length),  label: 'LEGENDARY', color: '#ffd700' },
  { value: String(activeEdition.value.cards.filter(c => c.rarity === 'rare').length),       label: 'RARE',      color: '#4488ff' },
  { value: 'SVG', label: 'FORMAT', color: '#22cc66' },
])

// ── Orbital gallery: status config + announcements ───────────────────────────

type AnnStatus = 'live' | 'testing' | 'soon' | 'planned'

const STATUS_CONFIG: { id: AnnStatus; label: string; color: string }[] = [
  { id: 'live',    label: 'LIVE',         color: '#22dd88' },
  { id: 'testing', label: 'TESTING',      color: '#f0a030' },
  { id: 'soon',    label: 'COMING SOON',  color: '#4488ff' },
  { id: 'planned', label: 'PLANNED',      color: '#667788' },
]

interface Announcement {
  id:          number
  title:       string
  description: string
  status:      AnnStatus
  category:    string
  targets:     string[]   // audience / community tags
  chain?:      string     // chain context if relevant
  target?:     string     // target milestone or date
}

const ANNOUNCEMENTS: Announcement[] = [
  // ── LIVE ─────────────────────────────────────────────────────────────────
  {
    id: 1, status: 'live',
    title:       'Collector Cards — Extrapolation Edition',
    description: '11 hand-crafted SVG cards. Astronomical objects and Exotopia concepts. Rarity tiers from Common to Legendary. Free to mint — chain gas only.',
    category:    'NFT DROP',
    targets:     ['all communities', 'collectors'],
    chain:       'ALGO · SOL · MATIC',
    target:      'Edition 1 of ∞',
  },
  {
    id: 2, status: 'live',
    title:       'Anti-AI Slop Drop — Edition 2',
    description: 'Human craft, field truth, community signal. 11 cards celebrating real data, real music, real work. The Field Reading, The Living Verse (poetry — recorded or written), The Raw Take. Counter to AI-generated generic content.',
    category:    'NFT DROP',
    targets:     ['OT Kulcha', 'Fana Ka', 'Uni-Kibaoni'],
    chain:       'ALGO · CELO',
    target:      'Edition 2 — live now',
  },
  {
    id: 3, status: 'live',
    title:       'Moon Settlement Trophic Levels',
    description: 'L4 SUBLUNARY (moon surface), L5 SYZYGY (moon-planet Lagrange), L6 LIMINAL (Hill sphere / Roche / tidal-lock). Six trophic levels fully specced and mintable. Field workers, eco-ops teams, and environmental engineering communities can claim settlements at moon-relative positions beyond the planet surface.',
    category:    'SETTLEMENT',
    targets:     ['pioneers', 'science', 'Uni-Kibaoni', 'field workers'],
    chain:       'ALGO ARC-3',
    target:      'Coordinate schema live · see Glossary for definitions',
  },
  {
    id: 4, status: 'live',
    title:       'X-RAY Thermal Vision Mode',
    description: 'Toggle X-RAY in the DefenderNav — full thermal binary-vision colour inversion with scan-lines, vignette, sensor brackets, log temperature scale and distance ruler.',
    category:    'VISUALIZATION',
    targets:     ['all users'],
    target:      'Surface view · DK.MAT mode',
  },
  {
    id: 5, status: 'live',
    title:       'Wormhole Chime — Etheric Bell',
    description: 'Web Audio API pentatonic bell (A4/E5/C#5) with 6-partial shimmer. Zero audio file bytes — synthesised in browser. 20% volume. Arrival tone at 5.5s.',
    category:    'AUDIO',
    targets:     ['all users'],
    target:      'MIDI-style, ships light',
  },

  // ── TESTING ──────────────────────────────────────────────────────────────
  {
    id: 6, status: 'testing',
    title:       'Polygon Amoy — $SUNLIGHT & WQ Certs',
    description: '$SUNLIGHT SUNLIGHT NFTs, Water Quality Certifications, and Health Card IDs on Polygon Amoy testnet. ERC-721, MetaMask compatible. Dry-run mode active.',
    category:    'CHAIN',
    targets:     ['artists', 'field workers'],
    chain:       'POLYGON AMOY 80002',
    target:      'Faucet: faucet.polygon.technology',
  },
  {
    id: 7, status: 'testing',
    title:       'Celo Alfajores — Community Badges',
    description: 'Community badges and eco-ops participation tokens on Celo Alfajores. Badges are earned through real field work across the five Mule domains: advocacy materials, business planning, water system health, youth career development, and Approvideo library maintenance. Mobile-first, cUSD bridges to M-Pesa.',
    category:    'CHAIN',
    targets:     ['Uni-Kibaoni', 'Fana Ka', 'OT Kulcha'],
    chain:       'CELO ALFAJORES 44787',
    target:      'Faucet: faucet.celo.org/alfajores',
  },
  {
    id: 8, status: 'live',
    title:       'Generative Minting Style Builder',
    description: 'Configure named NFT "styles" that combine up to five sources: Worldbridger One artist/musician, Ecocity sustainable model, mule-bot knowledge delta, gallery show event, and settlement eco-ops history. Session-aware smart presets based on what you explored today.',
    category:    'MINTING',
    targets:     ['artists', 'community builders'],
    target:      'Route: /mint-style — fully live',
  },
  {
    id: 9, status: 'testing',
    title:       'Frontier NFT Tier System',
    description: 'CONFIRMED / CANDIDATE / FRONTIER / THEORETICAL — four tiers filling survey blind spots. Hipparcos catalog predicted planets. PLATO / Roman / LSST pre-allocation zones.',
    category:    'SCIENCE NFT',
    targets:     ['science', 'collectors'],
    chain:       'ALGO',
    target:      'candidate-exoplanets.json live',
  },

  // ── COMING SOON ───────────────────────────────────────────────────────────
  {
    id: 10, status: 'soon',
    title:       'Tezos FA2 — Art Collectibles & $SUNLIGHT',
    description: 'Tezos has a strong NFT art/music culture (Objkt, fxhash). FA2 standard. Low energy, on-chain metadata. $SUNLIGHT music NFTs and visual art collectibles.',
    category:    'CHAIN',
    targets:     ['artists', 'musicians'],
    chain:       'TEZOS (Ghostnet testnet)',
    target:      'Community governance vote required',
  },
  {
    id: 11, status: 'soon',
    title:       'ecocity.com Module API',
    description: 'Module completion webhook: POST /api/module/complete ← called by pon.ink after assessment. Certificate minted, EcocitySolution NFT dispatched, POAP issued automatically. Directly feeds the Mule\'s career development and educational advocacy domains — every module completion updates the Mule\'s corpus for that settlement.',
    category:    'INTEGRATION',
    targets:     ['facilitators', 'Uni-Kibaoni', 'youth'],
    target:      'Connects ecocity ↔ pon.ink ↔ Exotopia ↔ Mule corpus',
  },
  {
    id: 12, status: 'soon',
    title:       'pon.ink Live Settlement Sync',
    description: 'settlement_presence, eco_ops_checkins, mule_corpus live from Supabase. Visitor count increments on wormhole arrival. Activity badges fill in the gallery hover panel.',
    category:    'INTEGRATION',
    targets:     ['all communities'],
    target:      'Shared Supabase project',
  },
  {
    id: 13, status: 'soon',
    title:       'Gallery Interior — Native Three.js Orbital',
    description: 'Collector card gallery view is live (Vue 3, native). The full immersive orbital gallery — encapsulated Three.js with DefenderNav floor plan strip at Level 3.5, artwork panels, and mule-bot companion — replaces the remaining sandboxed WebXR iframe.',
    category:    'GALLERY',
    targets:     ['artists', 'visitors'],
    target:      'Cards view: live · Three.js orbital: coming',
  },

  // ── PLANNED ──────────────────────────────────────────────────────────────
  {
    id: 14, status: 'planned',
    title:       'Hedera HTS — Eco-Data Certs',
    description: 'Hedera Token Service for Water Quality Certs and health credentials. Enterprise-grade tamper-evidence. HBAR Sustainable Impact Fund alignment. Ideal for field data permanence.',
    category:    'CHAIN',
    targets:     ['field workers', 'health educators'],
    chain:       'HEDERA (Testnet)',
    target:      'High-trust environmental records',
  },
  {
    id: 15, status: 'planned',
    title:       'mule-bot — Domain Specialist (Local AI)',
    description: 'V2 is a purpose-built specialist, not a general assistant. Local-network AI (no LLM, no cloud) reviews and compiles the corpus across five defined knowledge domains: (1) educational materials supporting advocacy; (2) business planning metrics for community development; (3) community water system health — tracking, analysis, and reporting; (4) young people\'s career development in environmental engineering; (5) maintenance of the hub Approvideo library. Owners interact with the database through a dedicated UI — browsing, editing, and approving what the Mule represents in each domain.',
    category:    'LOCAL AI',
    targets:     ['settlement owners', 'facilitators', 'Uni-Kibaoni', 'youth'],
    target:      'Five specialist domains · local inference · corpus stays sovereign',
  },
  {
    id: 16, status: 'planned',
    title:       'Ecommunity DAO — Governance Tokens',
    description: 'Governance token distribution, proposal mechanism, voting UI. Anti-harassment enforcement. Community-controlled moderation. Earned through participation and facilitation.',
    category:    'GOVERNANCE',
    targets:     ['administrators', 'facilitators'],
    chain:       'ALGO · CELO',
    target:      'After v1.1 launch',
  },
  {
    id: 17, status: 'planned',
    title:       'Swahili + Patois Localisation',
    description: 'All module content and UI in Swahili for Lamu/Nairobi communities. Patois for OT Kulcha / Caribbean connections. Translation pipeline established before English is finalised.',
    category:    'LOCALISATION',
    targets:     ['Uni-Kibaoni', 'OT Kulcha', 'Fana Ka'],
    target:      'Swahili first · Patois second',
  },
  {
    id: 18, status: 'planned',
    title:       'Multiplayer Settlement Presence',
    description: 'Surface mode DefenderNav shows other users\' camera look-directions as coloured cursor lines. See where community members are looking. Live event co-presence.',
    category:    'SOCIAL',
    targets:     ['all communities'],
    target:      'Requires pon.ink auth + presence API',
  },
  {
    id: 19, status: 'live',
    title:       'mule-bot Design Published — "The mule-bot · land care specialist"',
    description: 'Design blog post and SPEC_PON_INK.md updated. The mule-bot is defined as a domain specialist — not a general assistant and not connected to any LLM. Local-network AI reviews and compiles the corpus across five domains: educational advocacy materials; business planning metrics; community water system health; youth career development in environmental engineering; Hub Approvideo library maintenance. Full spec in SPEC_PON_INK.md. Blog post: blog-mule-v2-specialist.md.',
    category:    'DESIGN DOC',
    targets:     ['all communities', 'settlement owners', 'facilitators', 'youth'],
    target:      'blog-mule-v2-specialist.md · SPEC_PON_INK.md',
  },
]

// Orbital star field (slightly denser than hero)
const orbStars = Array.from({ length: 70 }, (_, i) => {
  const rng = (n: number) => ((Math.sin(n * 113.7 + 5) * 43758.5) % 1 + 1) / 2
  return { id: i, x: rng(i*4)*100, y: rng(i*4+1)*100, r: 0.6+rng(i*4+2)*1.4, o: 0.08+rng(i*4+3)*0.38, d: rng(i)*5 }
})

// ── Hero star field ────────────────────────────────────────────────────────────

const stars = Array.from({ length: 55 }, (_, i) => {
  const rng = (n: number) => ((Math.sin(n * 127.1 + 7) * 43758.5) % 1 + 1) / 2
  return { id: i, x: rng(i*4)*100, y: rng(i*4+1)*100, r: 0.7+rng(i*4+2)*1.6, o: 0.12+rng(i*4+3)*0.50, d: rng(i)*5 }
})

// ── SVG download ──────────────────────────────────────────────────────────────

function downloadSvg(card: CardType) {
  const all = document.querySelectorAll<SVGSVGElement>('.collector-card')
  const el  = [...all].find(s => {
    const texts = s.querySelectorAll('text')
    return [...texts].some(t => t.textContent?.includes(card.name.toUpperCase()))
  })
  if (!el) return
  const blob = new Blob([new XMLSerializer().serializeToString(el)], { type: 'image/svg+xml' })
  const a = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(blob),
    download: `exotopia-${String(card.id).padStart(2,'0')}-${card.name.toLowerCase().replace(/\s+/g,'-')}.svg`,
  })
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<style scoped>
/* ── Page shell ───────────────────────────────────────────────── */

.gallery-page {
  background: #000408;
  min-height: 100vh;
  font-family: 'Courier New', monospace;
  color: rgba(180, 220, 240, 0.85);
}

/* ════════════════════════════════════════════════════════════════
   HERO
   ════════════════════════════════════════════════════════════════ */

.gallery-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  padding: 52px 44px 44px;
  overflow: hidden;
  border-bottom: 1px solid rgba(0, 120, 180, 0.18);
  background:
    radial-gradient(ellipse 70% 90% at 30% 50%, rgba(0,30,60,0.40) 0%, transparent 70%),
    radial-gradient(ellipse 50% 70% at 80% 40%, rgba(30,10,60,0.30) 0%, transparent 60%);
}

/* Star field */
.gal-stars { position: absolute; inset: 0; pointer-events: none; z-index: 0; }

.gal-star {
  position: absolute;
  border-radius: 50%;
  background: #ffffff;
  animation: star-twinkle 3.5s ease-in-out infinite alternate;
}

@keyframes star-twinkle {
  from { opacity: var(--op, 0.3); }
  to   { opacity: calc(var(--op, 0.3) * 0.3); }
}

/* Left copy */
.hero-left {
  flex: 0 0 400px;
  max-width: 400px;
  position: relative;
  z-index: 1;
}

/* Edition switcher */
.edition-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 14px;
}

.ed-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.08em;
  padding: 5px 12px;
  border: 1px solid;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.55);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.ed-btn:hover { background: rgba(0, 20, 40, 0.70); }

.ed-id {
  font-size: 7px;
  opacity: 0.55;
  margin-right: 2px;
}

.ed-status {
  font-size: 6px;
  letter-spacing: 0.12em;
  opacity: 0.60;
  padding: 1px 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.06);
}

.ed-status--live    { color: rgba(60, 220, 120, 0.75); }
.ed-status--dropping{ color: rgba(255, 200, 40, 0.75); }
.ed-status--upcoming{ color: rgba(100, 160, 220, 0.65); }
.ed-status--sold_out{ color: rgba(180, 80, 60, 0.65); }

.hero-edition-tag {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 7px;
  letter-spacing: 0.20em;
  color: rgba(255, 215, 0, 0.65);
  margin-bottom: 12px;
}

.hero-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #ffd700;
  box-shadow: 0 0 9px rgba(255,215,0,0.60);
  animation: dot-pulse 2.8s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 9px rgba(255,215,0,0.60); }
  50%       { box-shadow: 0 0 3px rgba(255,215,0,0.20); }
}

.hero-title {
  font-size: clamp(32px, 4vw, 46px);
  font-weight: 400;
  letter-spacing: 0.14em;
  line-height: 1.1;
  margin: 0 0 4px;
  color: rgba(200, 230, 255, 0.92);
}

.hero-title-sub {
  font-size: clamp(20px, 2.5vw, 28px);
  color: #00e5ff;
  letter-spacing: 0.20em;
  display: block;
}

.hero-desc {
  font-size: 9px;
  color: rgba(100, 150, 180, 0.68);
  line-height: 1.70;
  margin: 12px 0 16px;
  max-width: 360px;
}

/* Stats row */
.hero-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 6px;
}

.stat-block { text-align: center; }

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.04em;
}

.stat-label {
  font-size: 6px;
  letter-spacing: 0.16em;
  color: rgba(80, 120, 150, 0.60);
  margin-top: 2px;
}

/* Hero tabs */
.hero-tabs { display: flex; gap: 6px; }

.htab {
  display: inline-flex;
  align-items: center;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.10em;
  padding: 6px 14px;
  border: 1px solid rgba(0, 140, 180, 0.28);
  border-radius: 3px;
  background: none;
  color: rgba(0, 160, 200, 0.50);
  cursor: pointer;
  transition: all 0.15s;
}

.htab--active {
  background: rgba(0, 160, 200, 0.14);
  border-color: rgba(0, 220, 255, 0.55);
  color: #00e5ff;
  box-shadow: 0 0 14px rgba(0,200,240,0.12);
}

.htab:hover:not(.htab--active) { color: rgba(0, 200, 240, 0.72); }

/* Card fan — same design as /mint hero */
.hero-fan {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  height: 300px;
  margin-right: 20px;
  padding-bottom: 16px;
}

.fan-slot {
  flex-shrink: 0;
  transform-origin: bottom center;
  transition: transform 0.25s ease, filter 0.25s ease;
  animation: fan-float 4.5s ease-in-out infinite alternate;
  cursor: pointer;
  margin-left: -28px;
}

.fan-slot:first-child { margin-left: 0; }

.fan-slot:hover {
  transform: rotate(0deg) translateY(-20px) scale(1.06) !important;
  filter: drop-shadow(0 16px 32px rgba(0, 200, 240, 0.38));
  z-index: 10 !important;
}

@keyframes fan-float {
  from { margin-bottom: 0; }
  to   { margin-bottom: 8px; }
}

/* ── Ticker ────────────────────────────────────────────────────── */

.gal-ticker {
  overflow: hidden;
  background: rgba(0, 4, 14, 0.90);
  border-top: 1px solid rgba(0, 100, 140, 0.20);
  border-bottom: 1px solid rgba(0, 100, 140, 0.20);
  padding: 6px 0;
  white-space: nowrap;
}

.ticker-track {
  display: inline-flex;
  animation: ticker-run 32s linear infinite;
}

@keyframes ticker-run {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: rgba(80, 130, 160, 0.52);
  margin-right: 4px;
}

.ticker-num    { color: rgba(0, 180, 220, 0.48); }
.ticker-rarity { font-size: 7px; letter-spacing: 0.12em; }
.ticker-sep    { color: rgba(40, 80, 110, 0.35); font-size: 6px; }

/* ════════════════════════════════════════════════════════════════
   FILTER BAR
   ════════════════════════════════════════════════════════════════ */

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0, 80, 120, 0.18);
  background: rgba(0, 4, 14, 0.70);
  flex-wrap: wrap;
  gap: 8px;
}

.filter-bar-left { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }

.filter-all {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.12em;
  padding: 4px 10px;
  border: 1px solid rgba(0, 150, 200, 0.25);
  border-radius: 3px;
  background: none;
  color: rgba(0, 160, 200, 0.55);
  cursor: pointer;
  transition: all 0.12s;
}

.filter-all--active {
  background: rgba(0, 150, 200, 0.14);
  border-color: rgba(0, 220, 255, 0.45);
  color: #00e5ff;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.10em;
  padding: 4px 12px;
  border: 1px solid;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.50);
  cursor: pointer;
  transition: all 0.15s;
}

.filter-pip {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.filter-count {
  font-size: 6px;
  opacity: 0.60;
  margin-left: 2px;
}

.filter-showing {
  font-size: 7px;
  color: rgba(60, 100, 130, 0.50);
  letter-spacing: 0.08em;
}

/* ════════════════════════════════════════════════════════════════
   CARD GRID
   ════════════════════════════════════════════════════════════════ */

.cards-section { min-height: 60vh; }

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(236px, 1fr));
  gap: 1px;
  background: rgba(0, 60, 100, 0.08);
  padding: 0;
}

.card-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 16px;
  cursor: pointer;
  background: rgba(0, 4, 14, 0.90);
  transition: background 0.18s;
  border: 1px solid transparent;
}

/* ── 3D flip ────────────────────────────────────────────────── */

.flip-scene {
  perspective: 900px;
  width: 220px;
  height: 308px;
  flex-shrink: 0;
}

.flip-card {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.60s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover on card-cell triggers the flip via .flip-card */
.card-cell:hover .flip-card {
  transform: rotateY(180deg);
}

.flip-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-face--back {
  transform: rotateY(180deg);
}

.card-cell::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--rarity-glow, transparent);
  opacity: 0;
  transition: opacity 0.25s;
  pointer-events: none;
}

.card-cell:hover {
  background: rgba(0, 15, 35, 0.95);
  border-color: rgba(var(--rarity-color, 255,255,255), 0.12);
}

.card-cell:hover::before { opacity: 0.06; }

/* Rarity tints */
.card-cell--legendary { background: rgba(4, 3, 0, 0.92); }
.card-cell--rare      { background: rgba(0, 4, 14, 0.92); }
.card-cell--uncommon  { background: rgba(0, 5, 2,  0.92); }
.card-cell--common    { background: rgba(2, 3, 4,  0.92); }

/* Corner badge */
.cell-corner-badge {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 7px;
  letter-spacing: 0.10em;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid currentColor;
  opacity: 0.70;
}

.cell-footer {
  width: 220px;
  margin-top: 10px;
}

.cell-name {
  font-size: 10px;
  letter-spacing: 0.05em;
  color: rgba(180, 220, 245, 0.85);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-sub {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.cell-rarity {
  font-size: 7px;
  letter-spacing: 0.12em;
}

.cell-edition {
  font-size: 7px;
  color: rgba(70, 110, 140, 0.55);
  letter-spacing: 0.06em;
}

.cell-score-track {
  height: 2px;
  background: rgba(255,255,255,0.07);
  border-radius: 1px;
  overflow: hidden;
}

.cell-score-fill {
  height: 100%;
  border-radius: 1px;
  transition: width 0.6s ease;
  opacity: 0.70;
}

/* ════════════════════════════════════════════════════════════════
   DETAIL PANEL
   ════════════════════════════════════════════════════════════════ */

.panel-backdrop {
  position: fixed;
  inset: 0;
  z-index: 19;
  background: rgba(0, 2, 10, 0.65);
  backdrop-filter: blur(2px);
}

.detail-panel {
  position: fixed;
  right: 0; top: 0; bottom: 0;
  width: min(680px, 95vw);
  z-index: 20;
  background: rgba(0, 4, 18, 0.98);
  border-left: 1px solid rgba(var(--rarity-color), 0.20);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Panel header */
.panel-header {
  position: relative;
  padding: 20px 20px 14px;
  border-bottom: 1px solid rgba(0, 100, 140, 0.22);
  overflow: hidden;
}

.panel-header-bg {
  position: absolute;
  inset: 0;
  background: var(--rarity-glow, transparent);
  opacity: 0.08;
  pointer-events: none;
}

.panel-title {
  font-size: 16px;
  letter-spacing: 0.07em;
  color: rgba(200, 230, 255, 0.92);
  position: relative;
}

.panel-num {
  font-size: 10px;
  color: rgba(var(--rarity-color), 0.55);
  margin-right: 8px;
  letter-spacing: 0.10em;
}

.panel-rarity-label {
  font-size: 8px;
  letter-spacing: 0.16em;
  margin-top: 4px;
  position: relative;
}

.panel-close {
  position: absolute;
  top: 14px;
  right: 14px;
}

/* Panel body */
.panel-body {
  display: flex;
  gap: 24px;
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 150, 200, 0.20) transparent;
  flex-wrap: wrap;
}

.panel-card-wrap {
  flex-shrink: 0;
  position: relative;
}

.panel-card-halo {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 40px;
  border-radius: 50%;
  filter: blur(20px);
  opacity: 0.35;
}

.panel-info { flex: 1; min-width: 200px; }

/* Section */
.panel-section { margin-bottom: 18px; }

.panel-section-label {
  font-size: 6.5px;
  letter-spacing: 0.18em;
  color: rgba(0, 160, 200, 0.45);
  margin-bottom: 6px;
}

.panel-desc {
  font-size: 9px;
  color: rgba(120, 170, 200, 0.75);
  line-height: 1.68;
  margin: 0;
}

/* Score */
.score-display { display: flex; align-items: center; gap: 6px; }
.score-num     { font-size: 28px; font-weight: 700; line-height: 1; }
.score-denom   { font-size: 12px; color: rgba(80, 120, 150, 0.55); }

.score-bar {
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.07);
  border-radius: 2px;
  overflow: hidden;
  margin-left: 8px;
}

.score-fill {
  height: 100%;
  border-radius: 2px;
}

/* Attributes */
.attr-table { display: flex; flex-direction: column; gap: 3px; }

.attr-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 8px;
  padding: 3px 0;
  border-bottom: 1px solid rgba(0, 60, 100, 0.18);
}

.attr-key { color: rgba(70, 120, 150, 0.65); flex-shrink: 0; }
.attr-val { color: rgba(160, 210, 230, 0.85); text-align: right; }

/* Mint status */
.mint-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.mint-count { font-size: 10px; }
.mint-minted { font-size: 20px; font-weight: 700; }
.mint-max    { font-size: 10px; color: rgba(80,120,150,0.55); }

.availability-chip {
  font-size: 7px;
  letter-spacing: 0.12em;
  padding: 3px 8px;
  border-radius: 2px;
  border: 1px solid;
}

.avail--open {
  color: rgba(34, 204, 102, 0.85);
  border-color: rgba(34, 204, 102, 0.35);
  background: rgba(0, 80, 30, 0.25);
}

.avail--sold {
  color: rgba(255, 80, 60, 0.75);
  border-color: rgba(255, 80, 60, 0.30);
}

.mint-bar-track {
  height: 3px;
  background: rgba(255,255,255,0.07);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.mint-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }

.cid-row {
  display: flex;
  gap: 8px;
  font-size: 7px;
  color: rgba(80, 120, 150, 0.55);
}

.cid-label { flex-shrink: 0; }
.cid-val   { word-break: break-all; }

/* Actions */
.panel-actions { margin-top: 4px; display: flex; flex-direction: column; gap: 6px; }

/* Slide transition */
.panel-slide-enter-active { transition: transform 0.30s cubic-bezier(0.22,1,0.36,1); }
.panel-slide-leave-active  { transition: transform 0.22s ease-in; }
.panel-slide-enter-from,
.panel-slide-leave-to      { transform: translateX(100%); }

.backdrop-fade-enter-active { transition: opacity 0.25s ease; }
.backdrop-fade-leave-active  { transition: opacity 0.20s ease; }
.backdrop-fade-enter-from,
.backdrop-fade-leave-to      { opacity: 0; }

/* ════════════════════════════════════════════════════════════════
   ORBITAL GALLERY — announcement station
   ════════════════════════════════════════════════════════════════ */

.orbital-section {
  position: relative;
  min-height: 80vh;
  overflow: hidden;
  padding: 0;
}

/* Star field */
.orb-stars { position: absolute; inset: 0; pointer-events: none; z-index: 0; }

.orb-star {
  position: absolute;
  border-radius: 50%;
  background: #ffffff;
  animation: star-twinkle 4s ease-in-out infinite alternate;
}

/* Header */
.orb-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 18px 24px 14px;
  border-bottom: 1px solid rgba(0, 120, 180, 0.18);
  background: rgba(0, 4, 14, 0.80);
  backdrop-filter: blur(6px);
}

.orb-title {
  display: flex;
  align-items: center;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: rgba(0, 200, 240, 0.80);
  margin-bottom: 3px;
}

.orb-subtitle {
  font-size: 8px;
  letter-spacing: 0.07em;
  color: rgba(80, 130, 160, 0.55);
}

.orb-legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.orb-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 7px;
  letter-spacing: 0.10em;
  color: rgba(100, 150, 180, 0.60);
}

.orb-legend-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Grid */
.orb-grid {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 1px;
  background: rgba(0, 40, 80, 0.06);
  padding: 0;
}

/* Station card */
.orb-station {
  position: relative;
  padding: 16px 16px 14px 20px;
  background: rgba(0, 4, 14, 0.88);
  border-left: 3px solid var(--status-color, #445566);
  transition: background 0.15s;
}

.orb-station:hover {
  background: rgba(0, 10, 28, 0.95);
}

/* Status glow on hover */
.orb-station::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--status-color);
  box-shadow: 0 0 12px var(--status-color);
  opacity: 0;
  transition: opacity 0.2s;
}

.orb-station:hover::after { opacity: 0.60; }

/* Station header row */
.ost-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
}

.ost-hex {
  font-size: 12px;
  color: var(--status-color);
  opacity: 0.65;
  line-height: 1;
}

.ost-id {
  font-size: 7px;
  letter-spacing: 0.14em;
  color: rgba(70, 110, 150, 0.55);
}

.ost-status-chip {
  margin-left: auto;
  font-size: 6.5px;
  letter-spacing: 0.14em;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1px solid var(--status-color);
  color: var(--status-color);
  background: rgba(var(--status-color), 0.08);
  opacity: 0.85;
}

/* Content */
.ost-title {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: rgba(190, 225, 245, 0.90);
  margin-bottom: 6px;
  line-height: 1.3;
}

.ost-desc {
  font-size: 8px;
  color: rgba(100, 150, 180, 0.70);
  line-height: 1.65;
  margin-bottom: 9px;
}

/* Tags */
.ost-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 7px;
}

.ost-tag {
  font-size: 6.5px;
  letter-spacing: 0.09em;
  padding: 1px 6px;
  border-radius: 2px;
  background: rgba(0, 60, 100, 0.35);
  border: 1px solid rgba(0, 120, 180, 0.22);
  color: rgba(0, 180, 220, 0.60);
}

.ost-tag--cat {
  background: rgba(var(--status-color), 0.10);
  border-color: var(--status-color);
  color: var(--status-color);
  opacity: 0.80;
}

/* Footer */
.ost-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 7px;
  border-top: 1px solid rgba(0, 60, 100, 0.18);
}

.ost-chain {
  font-size: 7px;
  letter-spacing: 0.10em;
  color: rgba(0, 200, 240, 0.45);
}

.ost-target {
  font-size: 7px;
  color: rgba(80, 130, 160, 0.50);
  letter-spacing: 0.06em;
}

/* WebXR iframe collapse */
.orb-xr-details {
  position: relative;
  z-index: 2;
  border-top: 1px solid rgba(0, 80, 120, 0.20);
  background: rgba(0, 2, 10, 0.90);
}

.orb-xr-summary {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 8px;
  letter-spacing: 0.10em;
  color: rgba(0, 160, 200, 0.45);
  cursor: pointer;
  user-select: none;
  list-style: none;
}

.orb-xr-summary::-webkit-details-marker { display: none; }
.orb-xr-summary:hover { color: rgba(0, 200, 240, 0.65); }

.orb-xr-frame-wrap {
  height: 500px;
  position: relative;
}

.orbital-frame-inline {
  width: 100%;
  height: 100%;
  border: none;
  z-index: 1;
}

.isolation-badge {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 2;
  padding: 4px 12px;
  background: rgba(1, 10, 22, 0.88);
  border-top: 1px solid rgba(0, 229, 255, 0.22);
  font-size: 8px; letter-spacing: 0.09em;
  color: rgba(0, 200, 240, 0.60);
  display: flex; align-items: center;
  pointer-events: none;
}

/* ── Responsive ────────────────────────────────────────────────── */

@media (max-width: 860px) {
  .gallery-hero {
    flex-direction: column;
    padding: 36px 20px 32px;
  }
  .hero-left { flex: 0 0 auto; max-width: 100%; }
  .hero-spotlight { margin-right: 0; }
}
</style>
