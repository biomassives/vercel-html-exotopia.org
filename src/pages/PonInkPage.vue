<template>
  <q-page class="pon-page">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="pon-header">
      <div class="pon-header__inner">
        <div class="pon-logo">
          <span class="pon-logo__hex">⬡</span>
          <div class="pon-logo__text">
            <span class="pon-logo__pon">PON</span><span class="pon-logo__ink">.INK</span>
          </div>
          <span class="pon-logo__badge">on EXOTOPIA</span>
        </div>
        <div class="pon-header__sub">
          Exolocated Virtual Settlements
        </div>
      </div>
    </div>

    <!-- ── Two-column content ─────────────────────────────────────────────── -->
    <div class="pon-body">

      <!-- LEFT: Settlement Registry ────────────────────────────────────────── -->
      <div class="pon-col pon-col--left">

        <!-- Section header -->
        <div class="pon-section-head">
          <span class="pon-section-icon">⬡</span>
          <div>
            <div class="pon-section-title">Settlement Registry</div>
            <div class="pon-section-hint">Your on-chain settlement signatures</div>
          </div>
        </div>

        <!-- No planet selected state -->
        <div v-if="!demoSettlements.length" class="pon-empty">
          <q-icon name="mdi-map-marker-off" size="32px" color="blue-grey-7" />
          <div class="pon-empty__text">Navigate to a planet surface to generate your settlement hashmark</div>
          <q-btn unelevated size="sm" color="cyan-9" icon="mdi-rocket-launch"
            label="Go to Galaxy View" @click="$router.push('/galaxy')" />
        </div>

        <!-- Demo settlement cards -->
        <div v-else class="pon-settlements">
          <div
            v-for="s in demoSettlements"
            :key="s.id"
            class="pon-settle-card"
            :class="{ 'pon-settle-card--active': activeSettlement === s.id }"
            @click="activeSettlement = s.id"
          >
            <!-- Mini quilt preview -->
            <div class="psc-quilt">
              <div
                v-for="(row, ri) in s.quiltRows"
                :key="ri"
                class="psc-quilt-row"
              >
                <span
                  v-for="(cell, ci) in row"
                  :key="ci"
                  class="psc-quilt-cell"
                  :style="{ color: cell.fg, backgroundColor: cell.bg }"
                >{{ cell.glyph }}</span>
              </div>
            </div>
            <!-- Info -->
            <div class="psc-info">
              <div class="psc-name">{{ s.planetName }}</div>
              <div class="psc-host">{{ s.hostname }}</div>
              <div class="psc-coord">{{ s.coordinate }}</div>
              <div class="psc-tags">
                <span class="psc-tag psc-tag--zone">{{ s.zone }}</span>
                <span class="psc-tag psc-tag--dome">{{ s.domeType }}</span>
              </div>
              <div class="psc-hash">{{ s.hash.slice(0, 16) }}…</div>
            </div>
            <!-- Status badge -->
            <div class="psc-status" :class="`psc-status--${s.marketStatus}`">
              {{ s.marketStatus }}
            </div>
          </div>
        </div>

        <!-- Active settlement hashmark hero ─────────────────────────────── -->
        <div v-if="activeDemo" class="pon-hashmark-hero">
          <div class="pon-section-head pon-section-head--sub">
            <span class="pon-section-icon" style="font-size:13px">◈</span>
            <div>
              <div class="pon-section-title" style="font-size:10px">ACTIVE HASHMARK</div>
              <div class="pon-section-hint">{{ activeDemo.planetName }}</div>
            </div>
          </div>

          <!-- Full quilt display -->
          <div class="pon-full-quilt" aria-label="Settlement hashmark quilt">
            <div
              v-for="(row, ri) in activeDemo.allQuiltRows"
              :key="ri"
              class="pon-quilt-row"
              :class="{ 'pon-quilt-row--parity': ri >= 8 }"
            >
              <span
                v-for="(cell, ci) in row"
                :key="ci"
                class="pon-quilt-cell"
                :class="{ 'pon-quilt-cell--parity': ri >= 8 }"
                :style="{ color: cell.fg, backgroundColor: cell.bg }"
                :title="`[${ri},${ci}] 0x${cell.nibble}`"
              >{{ cell.glyph }}</span>
            </div>
            <div class="pon-quilt-divider">
              <span class="pon-quilt-divider__line"/>
              <span class="pon-quilt-divider__label">XOR PARITY · ERROR CORRECTION</span>
              <span class="pon-quilt-divider__line"/>
            </div>
          </div>

          <!-- Hash strip -->
          <div class="pon-hash-strip">
            <span
              v-for="(chunk, i) in activeDemo.hashChunks"
              :key="i"
              class="pon-hash-chunk"
              :class="{ 'pon-hash-chunk--hi': i % 4 === 0 }"
            >{{ chunk }}</span>
          </div>

          <!-- Metadata row -->
          <div class="pon-meta-row">
            <div class="pon-meta-item">
              <span class="pon-meta-label">DOME</span>
              <span class="pon-meta-val">{{ activeDemo.domeType }}</span>
            </div>
            <div class="pon-meta-item">
              <span class="pon-meta-label">ZONE</span>
              <span class="pon-meta-val">{{ activeDemo.zone }}</span>
            </div>
            <div class="pon-meta-item">
              <span class="pon-meta-label">EQT</span>
              <span class="pon-meta-val">{{ activeDemo.eqt }}K</span>
            </div>
            <div class="pon-meta-item">
              <span class="pon-meta-label">BIOME</span>
              <span class="pon-meta-val">{{ activeDemo.biome }}</span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="pon-action-row">
            <button class="pon-btn pon-btn--primary" @click="listSettlement(activeDemo)">
              <q-icon name="mdi-tag-outline" size="11px" class="q-mr-xs"/>
              List in Depot
            </button>
            <button class="pon-btn pon-btn--ghost" @click="copySettlementHash(activeDemo)">
              <q-icon name="mdi-content-copy" size="11px" class="q-mr-xs"/>
              {{ copiedId === activeDemo.id ? '✓ copied' : 'Copy hash' }}
            </button>
            <button class="pon-btn pon-btn--ghost" @click="$router.push('/surface/' + activeDemo.hostname + '/' + activeDemo.planetName)">
              <q-icon name="mdi-earth" size="11px" class="q-mr-xs"/>
              Visit Surface
            </button>
          </div>
        </div>

      </div>

      <!-- RIGHT: Exchange Depot ────────────────────────────────────────────── -->
      <div class="pon-col pon-col--right">

        <div class="pon-section-head">
          <span class="pon-section-icon" style="color:#ffcc44">⇄</span>
          <div>
            <div class="pon-section-title">Exchange Depot</div>
            <div class="pon-section-hint">Trade settlements · items · bundles</div>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="pon-depot-filters">
          <button
            v-for="f in depotFilters"
            :key="f.id"
            class="pon-filter-btn"
            :class="{ 'pon-filter-btn--active': activeFilter === f.id }"
            @click="activeFilter = f.id"
          >{{ f.label }}</button>

          <div class="pon-filter-sep"/>

          <button
            v-for="z in zoneFilters"
            :key="z"
            class="pon-zone-btn"
            :class="{ 'pon-zone-btn--active': activeZone === z }"
            @click="activeZone = activeZone === z ? null : z"
          >{{ z }}</button>
        </div>

        <!-- Depot listing grid -->
        <div class="pon-depot-grid">
          <div
            v-for="listing in filteredListings"
            :key="listing.id"
            class="pon-listing"
            :class="{ 'pon-listing--reserved': listing.status === 'reserved' }"
          >
            <!-- Quilt signature -->
            <div class="pon-listing__quilt">
              <div
                v-for="(row, ri) in listing.quiltRows"
                :key="ri"
                class="pon-listing__qrow"
              >
                <span
                  v-for="(cell, ci) in row"
                  :key="ci"
                  class="pon-listing__qcell"
                  :style="{ color: cell.fg, backgroundColor: cell.bg }"
                >{{ cell.glyph }}</span>
              </div>
            </div>

            <!-- Details -->
            <div class="pon-listing__body">
              <div class="pon-listing__name">{{ listing.planetName }}</div>
              <div class="pon-listing__host">{{ listing.hostname }}</div>
              <div class="pon-listing__tags">
                <span class="psc-tag psc-tag--zone">{{ listing.zone }}</span>
                <span class="psc-tag" :class="`psc-tag--${listing.type}`">{{ listing.type }}</span>
              </div>
              <div class="pon-listing__asks">
                <span class="pon-listing__ask-label">ASKING</span>
                <span class="pon-listing__ask-val">{{ listing.asking }}</span>
              </div>
              <div class="pon-listing__wants">
                <span class="pon-listing__want-label">WANTS</span>
                <div class="pon-listing__want-tags">
                  <span v-for="w in listing.wants" :key="w" class="pon-want-tag">{{ w }}</span>
                </div>
              </div>
            </div>

            <!-- Action -->
            <div class="pon-listing__footer">
              <span class="pon-listing__status" :class="`pon-listing__status--${listing.status}`">
                {{ listing.status }}
              </span>
              <button
                class="pon-offer-btn"
                :disabled="listing.status === 'reserved'"
                @click="openOfferDialog(listing)"
              >
                {{ listing.status === 'reserved' ? 'Reserved' : 'Make Offer' }}
              </button>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!filteredListings.length" class="pon-depot-empty">
            <q-icon name="mdi-tag-off-outline" size="28px" color="blue-grey-7" />
            <div class="pon-empty__text">No listings match this filter</div>
          </div>
        </div>

        <!-- Post a listing ────────────────────────────────────────────── -->
        <div class="pon-post-section">
          <button class="pon-post-toggle" @click="showPostForm = !showPostForm">
            <q-icon name="mdi-plus-circle-outline" size="12px" class="q-mr-xs"/>
            POST YOUR OWN LISTING
            <q-icon :name="showPostForm ? 'expand_less' : 'expand_more'" size="12px" class="q-ml-xs"/>
          </button>

          <Transition name="pon-drop">
            <div v-if="showPostForm" class="pon-post-form">
              <div class="pon-form-row">
                <div class="pon-form-group">
                  <label class="pon-form-label">SETTLEMENT / ITEM</label>
                  <input class="pon-form-input" v-model="postForm.item" placeholder="e.g. Kepler-442b surface claim, Tier-2 dome kit…" />
                </div>
                <div class="pon-form-group">
                  <label class="pon-form-label">TYPE</label>
                  <select class="pon-form-select" v-model="postForm.type">
                    <option value="settlement">Settlement</option>
                    <option value="item">Item / Equipment</option>
                    <option value="bundle">Bundle</option>
                    <option value="data">Data Package</option>
                  </select>
                </div>
              </div>
              <div class="pon-form-row">
                <div class="pon-form-group">
                  <label class="pon-form-label">ASKING</label>
                  <input class="pon-form-input" v-model="postForm.asking" placeholder="e.g. 500 PON · Settlement Swap · Data Bundle…" />
                </div>
                <div class="pon-form-group">
                  <label class="pon-form-label">ZONE</label>
                  <select class="pon-form-select" v-model="postForm.zone">
                    <option v-for="z in ['temperate','polar','equatorial','dayside','nightside']" :key="z" :value="z">{{ z }}</option>
                  </select>
                </div>
              </div>
              <div class="pon-form-group">
                <label class="pon-form-label">WANTS (comma-separated)</label>
                <input class="pon-form-input" v-model="postForm.wants" placeholder="e.g. Watsan tech, Tier-3 dome, Settlement Swap…" />
              </div>
              <div class="pon-form-group">
                <label class="pon-form-label">NOTES</label>
                <textarea class="pon-form-input pon-form-textarea" v-model="postForm.notes" placeholder="Any additional context, conditions, or description…" rows="2" />
              </div>
              <div class="pon-form-actions">
                <button class="pon-btn pon-btn--primary" @click="submitPost">
                  <q-icon name="mdi-send-outline" size="11px" class="q-mr-xs"/>
                  Submit Listing
                </button>
                <button class="pon-btn pon-btn--ghost" @click="showPostForm = false">Cancel</button>
              </div>
              <div v-if="postConfirm" class="pon-post-confirm">
                <q-icon name="mdi-check-circle-outline" size="13px" color="green-5" class="q-mr-xs"/>
                Listing submitted to depot queue — review within 24h
              </div>
            </div>
          </Transition>
        </div>

      </div><!-- /right col -->
    </div><!-- /body -->

    <!-- ── Offer dialog ───────────────────────────────────────────────────── -->
    <q-dialog v-model="offerDialogOpen" persistent>
      <q-card class="pon-dialog" dark>
        <q-card-section class="pon-dialog__header">
          <div class="pon-dialog__title">Make an Offer</div>
          <div class="pon-dialog__sub" v-if="offerTarget">{{ offerTarget.planetName }} · {{ offerTarget.asking }}</div>
        </q-card-section>
        <q-card-section class="pon-dialog__body">
          <div class="pon-form-group">
            <label class="pon-form-label">YOUR OFFER</label>
            <input class="pon-form-input" v-model="offerForm.offer" placeholder="e.g. 400 PON · Tier-2 dome kit + 50 PON…" />
          </div>
          <div class="pon-form-group">
            <label class="pon-form-label">YOUR SETTLEMENT (optional — for swap)</label>
            <input class="pon-form-input" v-model="offerForm.settlement" placeholder="Settlement address or planet name…" />
          </div>
          <div class="pon-form-group">
            <label class="pon-form-label">MESSAGE</label>
            <textarea class="pon-form-input pon-form-textarea" v-model="offerForm.message" placeholder="Why this is a good deal for both parties…" rows="2"/>
          </div>
        </q-card-section>
        <q-card-actions class="pon-dialog__actions">
          <button class="pon-btn pon-btn--ghost" @click="offerDialogOpen = false">Cancel</button>
          <button class="pon-btn pon-btn--primary" @click="submitOffer">
            <q-icon name="mdi-handshake-outline" size="11px" class="q-mr-xs"/>
            Send Offer
          </button>
        </q-card-actions>
        <div v-if="offerSent" class="pon-offer-sent">
          <q-icon name="mdi-check-circle-outline" size="13px" color="green-5" class="q-mr-xs"/>
          Offer sent! The seller will contact you via pon.ink DM.
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ── Quilt helpers (same palette as SettlementHashmark) ────────────────────────

const QUILT_GLYPHS = ['█','▓','▒','░','▄','▀','▌','▐','■','□','▪','▫','◆','◇','●','○'] as const
const QUILT_FG = [
  '#ff4455','#ff8822','#ffcc00','#88dd00',
  '#00cc88','#00aaff','#8844ff','#ff44cc',
  '#ff6644','#ffaa44','#aaee44','#44ddaa',
  '#44aaee','#aa66ff','#ee44aa','#ffddaa',
]
const QUILT_BG_ROW = [
  'rgba(80,0,0,0.30)','rgba(80,30,0,0.25)','rgba(50,50,0,0.22)','rgba(0,50,0,0.24)',
  'rgba(0,40,50,0.24)','rgba(0,20,80,0.24)','rgba(30,0,80,0.24)','rgba(70,0,50,0.24)',
]
const QUILT_BG_PARITY = [
  'rgba(0,30,20,0.44)','rgba(0,20,30,0.44)','rgba(20,10,30,0.48)','rgba(30,15,0,0.44)',
]

interface QuiltCell { nibble: string; glyph: string; fg: string; bg: string }

function makeQuiltRows(hash: string): QuiltCell[][] {
  if (hash.length < 64) return []
  return Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (__, c) => {
      const nibble = hash[r * 8 + c]!
      const val    = parseInt(nibble, 16)
      return { nibble, glyph: QUILT_GLYPHS[val]!, fg: QUILT_FG[val]!, bg: QUILT_BG_ROW[r]! }
    })
  )
}

function makeAllQuiltRows(hash: string): QuiltCell[][] {
  const base = makeQuiltRows(hash)
  if (base.length < 8) return base

  function xorNibble(rows: QuiltCell[][], col: number, rowBg: string): QuiltCell {
    let val = 0
    for (const row of rows) val ^= parseInt(row[col]!.nibble, 16)
    const nibble = val.toString(16)
    return { nibble, glyph: QUILT_GLYPHS[val]!, fg: QUILT_FG[val]!, bg: rowBg }
  }

  const row8  = Array.from({ length: 8 }, (_, c) => xorNibble(base.slice(0, 4), c, QUILT_BG_PARITY[0]!))
  const row9  = Array.from({ length: 8 }, (_, c) => xorNibble(base.slice(4, 8), c, QUILT_BG_PARITY[1]!))
  const row10 = Array.from({ length: 8 }, (_, c) => xorNibble(base,             c, QUILT_BG_PARITY[2]!))
  const row11 = Array.from({ length: 8 }, (_, c) => {
    let val = 0
    for (let r = 0; r < 8; r++) {
      val ^= parseInt(base[r]![c]!.nibble, 16)
      val ^= parseInt(base[r]![(c + 4) % 8]!.nibble, 16)
    }
    val &= 0xf
    return { nibble: val.toString(16), glyph: QUILT_GLYPHS[val]!, fg: QUILT_FG[val]!, bg: QUILT_BG_PARITY[3]! }
  })
  return [...base, row8, row9, row10, row11]
}

// ── Seeded deterministic hash (not crypto — just for demo visuals) ─────────────

function seededHash(seed: string): string {
  let h = 0xdeadbeef
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x9e3779b9)
    h = ((h << 13) | (h >>> 19)) ^ h
  }
  // Expand to 64 hex chars
  let result = ''
  let state = h >>> 0
  for (let i = 0; i < 8; i++) {
    state = (Math.imul(state, 0x6c62272e) + 0x07bb0142) >>> 0
    result += state.toString(16).padStart(8, '0')
  }
  return result.slice(0, 64)
}

// ── Demo settlement data ───────────────────────────────────────────────────────

interface Settlement {
  id:          string
  planetName:  string
  hostname:    string
  coordinate:  string
  zone:        string
  domeType:    string
  eqt:         number
  biome:       string
  hash:        string
  quiltRows:   QuiltCell[][]
  allQuiltRows:QuiltCell[][]
  hashChunks:  string[]
  marketStatus:'private' | 'listed' | 'pending' | 'sold'
}

function makeSettlement(planet: string, host: string, zone: string, domeType: string, eqt: number, biome: string, status: Settlement['marketStatus']): Settlement {
  const hash  = seededHash(planet + host + zone)
  const coord = `exo-surface-v1:${planet}:${eqt}K-${zone}`
  return {
    id: planet,
    planetName: planet,
    hostname:   host,
    coordinate: coord,
    zone, domeType, eqt, biome,
    hash,
    quiltRows:    makeQuiltRows(hash),
    allQuiltRows: makeAllQuiltRows(hash),
    hashChunks:   hash.match(/.{1,8}/g) ?? [],
    marketStatus: status,
  }
}

const demoSettlements = ref<Settlement[]>([
  makeSettlement('Proxima Cen b', 'Proxima Centauri', 'dayside', 'geodesic_aerogel_vacuum', 234, 'cryophyte_tundra', 'listed'),
  makeSettlement('TRAPPIST-1 e',  'TRAPPIST-1',       'temperate','geodesic_polycarbonate', 271, 'temperate_grassland', 'private'),
  makeSettlement('Kepler-442 b',  'Kepler-442',       'polar',    'geodesic_aerogel_vacuum', 233, 'cryophyte_tundra', 'listed'),
])

const activeSettlement = ref<string>(demoSettlements.value[0]?.id ?? '')

const activeDemo = computed(() =>
  demoSettlements.value.find(s => s.id === activeSettlement.value) ?? null
)

// ── Copy ──────────────────────────────────────────────────────────────────────

const copiedId = ref<string | null>(null)
async function copySettlementHash(s: Settlement) {
  await navigator.clipboard.writeText(s.hash)
  copiedId.value = s.id
  setTimeout(() => { copiedId.value = null }, 2000)
}

function listSettlement(s: Settlement) {
  s.marketStatus = 'listed'
  const existing = depotListings.value.find(l => l.id === `depot-${s.id}`)
  if (!existing) {
    depotListings.value.unshift({
      id:         `depot-${s.id}`,
      planetName: s.planetName,
      hostname:   s.hostname,
      zone:       s.zone,
      type:       'settlement',
      asking:     'Open offer',
      wants:      ['PON', 'Settlement Swap', 'Equipment'],
      status:     'listed',
      quiltRows:  s.quiltRows,
    })
  }
}

// ── Exchange Depot ─────────────────────────────────────────────────────────────

interface DepotListing {
  id:         string
  planetName: string
  hostname:   string
  zone:       string
  type:       'settlement' | 'item' | 'bundle' | 'data'
  asking:     string
  wants:      string[]
  status:     'listed' | 'reserved' | 'pending'
  quiltRows:  QuiltCell[][]
}

const depotListings = ref<DepotListing[]>([
  {
    id: 'dl-1', planetName: 'Kepler-452 b',    hostname: 'Kepler-452',
    zone: 'equatorial', type: 'settlement',
    asking: '500 PON', wants: ['Dome upgrade kit', 'Watsan tech bundle'],
    status: 'listed',
    quiltRows: makeQuiltRows(seededHash('Kepler-452 b depot')),
  },
  {
    id: 'dl-2', planetName: '55 Cnc f',         hostname: '55 Cancri',
    zone: 'temperate',  type: 'settlement',
    asking: 'Settlement Swap', wants: ['Polar zone settlement', 'Any T < 250K'],
    status: 'listed',
    quiltRows: makeQuiltRows(seededHash('55 Cnc f depot')),
  },
  {
    id: 'dl-3', planetName: 'Gliese 667C c',    hostname: 'Gliese 667C',
    zone: 'dayside',    type: 'item',
    asking: '120 PON', wants: ['PON only'],
    status: 'reserved',
    quiltRows: makeQuiltRows(seededHash('Gliese 667C c item')),
  },
  {
    id: 'dl-4', planetName: 'HD 40307 g',        hostname: 'HD 40307',
    zone: 'polar',      type: 'bundle',
    asking: '2× Tier-3 dome + 80 PON', wants: ['High-EQT settlement (>400K)', 'Lava zone plot'],
    status: 'listed',
    quiltRows: makeQuiltRows(seededHash('HD 40307 g bundle')),
  },
  {
    id: 'dl-5', planetName: 'Wolf 1061 c',        hostname: 'Wolf 1061',
    zone: 'temperate',  type: 'data',
    asking: '60 PON', wants: ['PON', 'Eco-ops sponsorship'],
    status: 'listed',
    quiltRows: makeQuiltRows(seededHash('Wolf 1061 c data')),
  },
  {
    id: 'dl-6', planetName: 'K2-18 b',            hostname: 'K2-18',
    zone: 'polar',      type: 'settlement',
    asking: '350 PON or swap', wants: ['Temperate zone settlement', 'O₂ atmosphere preferred'],
    status: 'pending',
    quiltRows: makeQuiltRows(seededHash('K2-18 b settlement')),
  },
])

const depotFilters = [
  { id: 'all',        label: 'All' },
  { id: 'settlement', label: 'Settlements' },
  { id: 'item',       label: 'Items' },
  { id: 'bundle',     label: 'Bundles' },
  { id: 'data',       label: 'Data' },
]
const zoneFilters  = ['temperate','polar','equatorial','dayside','nightside']

const activeFilter = ref<string>('all')
const activeZone   = ref<string | null>(null)

const filteredListings = computed(() =>
  depotListings.value.filter(l => {
    const typeOk = activeFilter.value === 'all' || l.type === activeFilter.value
    const zoneOk = !activeZone.value || l.zone === activeZone.value
    return typeOk && zoneOk
  })
)

// ── Post form ──────────────────────────────────────────────────────────────────

const showPostForm = ref(false)
const postConfirm  = ref(false)
const postForm = ref({
  item: '', type: 'settlement', asking: '', zone: 'temperate', wants: '', notes: '',
})

function submitPost() {
  if (!postForm.value.item.trim()) return
  const hash = seededHash(postForm.value.item + Date.now())
  depotListings.value.unshift({
    id:         `user-${Date.now()}`,
    planetName: postForm.value.item,
    hostname:   'your-system',
    zone:       postForm.value.zone,
    type:       postForm.value.type as DepotListing['type'],
    asking:     postForm.value.asking || 'Open offer',
    wants:      postForm.value.wants.split(',').map(s => s.trim()).filter(Boolean),
    status:     'listed',
    quiltRows:  makeQuiltRows(hash),
  })
  showPostForm.value = false
  postConfirm.value  = true
  postForm.value = { item: '', type: 'settlement', asking: '', zone: 'temperate', wants: '', notes: '' }
  setTimeout(() => { postConfirm.value = false }, 4000)
}

// ── Offer dialog ───────────────────────────────────────────────────────────────

const offerDialogOpen = ref(false)
const offerTarget     = ref<DepotListing | null>(null)
const offerSent       = ref(false)
const offerForm       = ref({ offer: '', settlement: '', message: '' })

function openOfferDialog(listing: DepotListing) {
  offerTarget.value = listing
  offerForm.value   = { offer: '', settlement: '', message: '' }
  offerSent.value   = false
  offerDialogOpen.value = true
}

function submitOffer() {
  if (!offerForm.value.offer.trim()) return
  offerSent.value = true
  if (offerTarget.value) offerTarget.value.status = 'pending'
  setTimeout(() => { offerDialogOpen.value = false; offerSent.value = false }, 2500)
}
</script>

<style scoped>

/* ── Page shell ─────────────────────────────────────────────────────────────── */

.pon-page {
  min-height: 100vh;
  background: #000a12;
  color: rgba(200, 220, 240, 0.88);
  font-family: 'Courier New', monospace;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */

.pon-header {
  background: linear-gradient(180deg, rgba(0,15,30,0.98) 0%, rgba(0,8,18,0.95) 100%);
  border-bottom: 1px solid rgba(0, 200, 130, 0.18);
  padding: 16px 20px 14px;
}
.pon-header__inner {
  max-width: 1100px;
  margin: 0 auto;
}
.pon-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.pon-logo__hex {
  font-size: 26px;
  color: #00e5a0;
  filter: drop-shadow(0 0 8px rgba(0,220,150,0.55));
  line-height: 1;
}
.pon-logo__text { display: flex; align-items: baseline; gap: 1px; }
.pon-logo__pon  { font-size: 22px; font-weight: 700; letter-spacing: 0.04em; color: #e8f0ff; }
.pon-logo__ink  { font-size: 22px; font-weight: 700; letter-spacing: 0.04em; color: #00e5a0; }
.pon-logo__badge {
  font-size: 8px;
  letter-spacing: 0.14em;
  color: rgba(0, 200, 140, 0.55);
  background: rgba(0, 50, 35, 0.45);
  border: 1px solid rgba(0, 160, 100, 0.28);
  border-radius: 3px;
  padding: 2px 7px;
}
.pon-header__sub {
  font-size: 9px;
  letter-spacing: 0.14em;
  color: rgba(150, 190, 220, 0.45);
}

/* ── Body layout ────────────────────────────────────────────────────────────── */

.pon-body {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 0;
  max-width: 1100px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
}

@media (max-width: 860px) {
  .pon-body { grid-template-columns: 1fr; }
}

.pon-col--left {
  border-right: 1px solid rgba(0, 140, 90, 0.15);
  padding: 16px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pon-col--right {
  padding: 16px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Section headers ─────────────────────────────────────────────────────────── */

.pon-section-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.pon-section-head--sub { margin-top: 4px; }
.pon-section-icon {
  font-size: 18px;
  color: #00e5a0;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 1px;
}
.pon-section-title {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: rgba(0, 230, 160, 0.85);
  font-weight: 600;
}
.pon-section-hint {
  font-size: 8px;
  letter-spacing: 0.10em;
  color: rgba(120, 170, 200, 0.45);
  margin-top: 2px;
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */

.pon-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 12px;
  border: 1px dashed rgba(0, 120, 80, 0.22);
  border-radius: 6px;
  text-align: center;
}
.pon-empty__text {
  font-size: 8.5px;
  letter-spacing: 0.08em;
  color: rgba(140, 180, 200, 0.55);
  max-width: 200px;
}

/* ── Settlement card list ────────────────────────────────────────────────────── */

.pon-settlements {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pon-settle-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(0, 8, 16, 0.70);
  border: 1px solid rgba(0, 140, 90, 0.20);
  border-radius: 5px;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
  position: relative;
}
.pon-settle-card:hover {
  border-color: rgba(0, 200, 130, 0.38);
  background: rgba(0, 15, 28, 0.80);
}
.pon-settle-card--active {
  border-color: rgba(0, 230, 150, 0.55);
  background: rgba(0, 18, 32, 0.88);
  box-shadow: 0 0 12px rgba(0, 180, 120, 0.12);
}

/* Mini quilt on card */
.psc-quilt {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex-shrink: 0;
}
.psc-quilt-row { display: flex; gap: 1px; }
.psc-quilt-cell {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  width: 10px;
  height: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1px;
}

.psc-info { flex: 1; min-width: 0; }
.psc-name {
  font-size: 10px;
  letter-spacing: 0.06em;
  color: rgba(200, 230, 255, 0.88);
  font-weight: 600;
}
.psc-host {
  font-size: 7.5px;
  color: rgba(100, 160, 200, 0.55);
  letter-spacing: 0.08em;
}
.psc-coord {
  font-size: 7px;
  color: rgba(0, 180, 130, 0.45);
  letter-spacing: 0.06em;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.psc-tags { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
.psc-tag {
  font-size: 6.5px;
  letter-spacing: 0.10em;
  padding: 1px 5px;
  border-radius: 2px;
  border: 1px solid;
}
.psc-tag--zone    { color: rgba(0, 200, 255, 0.70); border-color: rgba(0, 160, 220, 0.30); background: rgba(0, 30, 50, 0.40); }
.psc-tag--dome    { color: rgba(100, 220, 140, 0.70); border-color: rgba(0, 160, 100, 0.28); background: rgba(0, 25, 15, 0.40); }
.psc-tag--settlement { color: rgba(0, 220, 180, 0.75); border-color: rgba(0, 180, 140, 0.28); background: rgba(0, 25, 20, 0.40); }
.psc-tag--item    { color: rgba(255, 190, 60, 0.75);  border-color: rgba(200, 140, 0, 0.28); background: rgba(30, 18, 0, 0.40); }
.psc-tag--bundle  { color: rgba(180, 130, 255, 0.75); border-color: rgba(140, 80, 220, 0.28); background: rgba(15, 5, 30, 0.40); }
.psc-tag--data    { color: rgba(80, 200, 255, 0.75);  border-color: rgba(30, 150, 220, 0.28); background: rgba(0, 15, 30, 0.40); }

.psc-hash {
  font-size: 6.5px;
  color: rgba(0, 160, 110, 0.45);
  letter-spacing: 0.10em;
  margin-top: 3px;
}

.psc-status {
  position: absolute;
  top: 7px;
  right: 8px;
  font-size: 6px;
  letter-spacing: 0.14em;
  padding: 1px 5px;
  border-radius: 2px;
  border: 1px solid;
}
.psc-status--private   { color: rgba(150, 170, 200, 0.50); border-color: rgba(100,120,160,0.20); background: rgba(10,12,20,0.40); }
.psc-status--listed    { color: rgba(0, 220, 150, 0.80);   border-color: rgba(0,180,120,0.30);   background: rgba(0,25,15,0.45); }
.psc-status--pending   { color: rgba(255, 190, 60, 0.80);  border-color: rgba(200,140,0,0.30);   background: rgba(25,15,0,0.45); }
.psc-status--sold      { color: rgba(100, 140, 180, 0.55); border-color: rgba(60,90,130,0.22);   background: rgba(5,8,15,0.40); }

/* ── Hashmark hero ───────────────────────────────────────────────────────────── */

.pon-hashmark-hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 5, 12, 0.90);
  border: 1px solid rgba(0, 180, 120, 0.28);
  border-radius: 6px;
  box-shadow: 0 0 20px rgba(0, 150, 100, 0.08);
}

.pon-full-quilt {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px;
  background: rgba(0, 3, 8, 0.95);
  border-radius: 4px;
  border: 1px solid rgba(0, 100, 70, 0.22);
}
.pon-quilt-row { display: flex; gap: 1px; }
.pon-quilt-row--parity { margin-top: 1px; }
.pon-quilt-cell {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.1;
  width: 1ch;
  text-align: center;
  border-radius: 1px;
  cursor: default;
  transition: transform 0.08s, filter 0.08s;
}
.pon-quilt-cell:hover { transform: scale(1.4); filter: brightness(1.7); z-index: 2; position: relative; }
.pon-quilt-cell--parity { font-size: 11px; opacity: 0.72; }
.pon-quilt-cell--parity:hover { opacity: 1; }
.pon-quilt-divider {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 0;
}
.pon-quilt-divider__line { flex: 1; height: 1px; background: rgba(0,120,80,0.28); }
.pon-quilt-divider__label { font-size: 6px; letter-spacing: 0.16em; color: rgba(0,160,100,0.42); white-space: nowrap; }

.pon-hash-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.pon-hash-chunk {
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  color: rgba(0, 190, 130, 0.65);
  background: rgba(0, 35, 22, 0.40);
  border: 1px solid rgba(0, 110, 75, 0.22);
  border-radius: 3px;
  padding: 1px 5px;
  letter-spacing: 0.08em;
}
.pon-hash-chunk--hi {
  color: rgba(0, 255, 170, 0.85);
  border-color: rgba(0, 180, 120, 0.35);
  background: rgba(0, 55, 38, 0.45);
}

.pon-meta-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pon-meta-item { display: flex; flex-direction: column; gap: 1px; }
.pon-meta-label {
  font-size: 6.5px;
  letter-spacing: 0.16em;
  color: rgba(0, 160, 110, 0.50);
}
.pon-meta-val {
  font-size: 8px;
  letter-spacing: 0.06em;
  color: rgba(140, 220, 180, 0.80);
}

.pon-action-row { display: flex; gap: 6px; flex-wrap: wrap; }

/* ── Buttons ─────────────────────────────────────────────────────────────────── */

.pon-btn {
  display: inline-flex;
  align-items: center;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.12em;
  border-radius: 4px;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.12s;
  border: 1px solid;
}
.pon-btn--primary {
  background: rgba(0, 50, 35, 0.70);
  border-color: rgba(0, 200, 130, 0.40);
  color: rgba(0, 240, 160, 0.90);
}
.pon-btn--primary:hover {
  background: rgba(0, 70, 48, 0.85);
  border-color: rgba(0, 240, 160, 0.60);
  box-shadow: 0 0 8px rgba(0, 200, 130, 0.20);
}
.pon-btn--ghost {
  background: rgba(0, 15, 28, 0.50);
  border-color: rgba(0, 140, 90, 0.25);
  color: rgba(0, 200, 140, 0.65);
}
.pon-btn--ghost:hover {
  border-color: rgba(0, 200, 140, 0.45);
  color: rgba(0, 230, 160, 0.85);
}

/* ── Depot filter bar ───────────────────────────────────────────────────────── */

.pon-depot-filters {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.pon-filter-sep { width: 1px; height: 14px; background: rgba(0, 120, 80, 0.22); margin: 0 2px; }
.pon-filter-btn, .pon-zone-btn {
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  letter-spacing: 0.10em;
  padding: 3px 9px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.12s;
  border: 1px solid rgba(0, 120, 80, 0.22);
  background: rgba(0, 10, 18, 0.60);
  color: rgba(0, 180, 120, 0.60);
}
.pon-filter-btn:hover, .pon-zone-btn:hover { border-color: rgba(0, 200, 130, 0.40); color: rgba(0, 220, 150, 0.80); }
.pon-filter-btn--active, .pon-zone-btn--active {
  background: rgba(0, 40, 28, 0.70);
  border-color: rgba(0, 200, 130, 0.50);
  color: rgba(0, 240, 160, 0.90);
}

/* ── Depot listing grid ──────────────────────────────────────────────────────── */

.pon-depot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}

.pon-listing {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: rgba(0, 8, 16, 0.75);
  border: 1px solid rgba(0, 140, 90, 0.20);
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.pon-listing:hover {
  border-color: rgba(0, 200, 130, 0.38);
  box-shadow: 0 0 12px rgba(0, 160, 110, 0.10);
}
.pon-listing--reserved {
  opacity: 0.65;
}

.pon-listing__quilt {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 8px;
  background: rgba(0, 4, 10, 0.90);
}
.pon-listing__qrow { display: flex; gap: 1px; }
.pon-listing__qcell {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1px;
}

.pon-listing__body { padding: 8px 10px; flex: 1; display: flex; flex-direction: column; gap: 3px; }
.pon-listing__name {
  font-size: 10px;
  letter-spacing: 0.05em;
  color: rgba(200, 230, 255, 0.88);
  font-weight: 600;
}
.pon-listing__host { font-size: 7.5px; color: rgba(100, 160, 200, 0.50); }
.pon-listing__tags { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 1px; }
.pon-listing__asks, .pon-listing__wants { display: flex; flex-direction: column; gap: 1px; margin-top: 5px; }
.pon-listing__ask-label, .pon-listing__want-label {
  font-size: 6px;
  letter-spacing: 0.16em;
  color: rgba(0, 160, 110, 0.45);
}
.pon-listing__ask-val {
  font-size: 9px;
  letter-spacing: 0.05em;
  color: rgba(0, 230, 160, 0.85);
}
.pon-listing__want-tags { display: flex; gap: 3px; flex-wrap: wrap; }
.pon-want-tag {
  font-size: 6.5px;
  letter-spacing: 0.06em;
  padding: 1px 5px;
  border-radius: 2px;
  background: rgba(0, 20, 35, 0.60);
  border: 1px solid rgba(0, 100, 160, 0.25);
  color: rgba(80, 180, 240, 0.70);
}

.pon-listing__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-top: 1px solid rgba(0, 100, 70, 0.15);
  background: rgba(0, 5, 12, 0.55);
}
.pon-listing__status { font-size: 6.5px; letter-spacing: 0.12em; }
.pon-listing__status--listed  { color: rgba(0, 220, 150, 0.75); }
.pon-listing__status--reserved{ color: rgba(200, 150, 60, 0.65); }
.pon-listing__status--pending { color: rgba(255, 190, 60, 0.75); }

.pon-offer-btn {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.10em;
  padding: 3px 9px;
  border-radius: 3px;
  cursor: pointer;
  background: rgba(0, 40, 28, 0.70);
  border: 1px solid rgba(0, 180, 120, 0.35);
  color: rgba(0, 220, 150, 0.85);
  transition: all 0.12s;
}
.pon-offer-btn:hover:not(:disabled) {
  background: rgba(0, 60, 42, 0.85);
  border-color: rgba(0, 230, 150, 0.55);
}
.pon-offer-btn:disabled {
  opacity: 0.40;
  cursor: not-allowed;
}

.pon-depot-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 30px 16px;
  border: 1px dashed rgba(0, 100, 70, 0.20);
  border-radius: 6px;
}

/* ── Post listing form ──────────────────────────────────────────────────────── */

.pon-post-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.pon-post-toggle {
  display: flex;
  align-items: center;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.14em;
  color: rgba(0, 200, 140, 0.60);
  background: rgba(0, 12, 20, 0.70);
  border: 1px solid rgba(0, 130, 88, 0.25);
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  width: 100%;
  transition: all 0.12s;
}
.pon-post-toggle:hover { border-color: rgba(0, 200, 130, 0.40); color: rgba(0, 240, 160, 0.80); }

.pon-drop-enter-active, .pon-drop-leave-active { transition: max-height 0.28s ease, opacity 0.20s ease; max-height: 400px; }
.pon-drop-enter-from, .pon-drop-leave-to { max-height: 0; opacity: 0; overflow: hidden; }

.pon-post-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 8, 16, 0.80);
  border: 1px solid rgba(0, 140, 90, 0.22);
  border-radius: 5px;
}
.pon-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.pon-form-group { display: flex; flex-direction: column; gap: 4px; }
.pon-form-label {
  font-size: 6.5px;
  letter-spacing: 0.16em;
  color: rgba(0, 170, 115, 0.60);
}
.pon-form-input, .pon-form-select, .pon-form-textarea {
  font-family: 'Courier New', monospace;
  font-size: 8.5px;
  padding: 5px 8px;
  background: rgba(0, 5, 12, 0.80);
  border: 1px solid rgba(0, 120, 80, 0.28);
  border-radius: 3px;
  color: rgba(160, 220, 200, 0.85);
  outline: none;
  transition: border-color 0.12s;
}
.pon-form-input:focus, .pon-form-select:focus, .pon-form-textarea:focus {
  border-color: rgba(0, 200, 130, 0.50);
}
.pon-form-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(0,160,100,0.5)'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; padding-right: 22px; }
.pon-form-textarea { resize: vertical; }
.pon-form-actions { display: flex; gap: 8px; }

.pon-post-confirm {
  display: flex;
  align-items: center;
  font-size: 8px;
  letter-spacing: 0.10em;
  color: rgba(0, 230, 150, 0.80);
}

/* ── Offer dialog ───────────────────────────────────────────────────────────── */

.pon-dialog {
  background: rgba(0, 8, 18, 0.97) !important;
  border: 1px solid rgba(0, 160, 100, 0.30) !important;
  border-radius: 8px !important;
  min-width: 340px;
  max-width: 480px;
  font-family: 'Courier New', monospace;
}
.pon-dialog__header { border-bottom: 1px solid rgba(0, 120, 80, 0.20); }
.pon-dialog__title {
  font-size: 11px;
  letter-spacing: 0.14em;
  color: rgba(0, 230, 160, 0.88);
}
.pon-dialog__sub {
  font-size: 8px;
  letter-spacing: 0.08em;
  color: rgba(100, 170, 200, 0.50);
  margin-top: 3px;
}
.pon-dialog__body { display: flex; flex-direction: column; gap: 10px; }
.pon-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid rgba(0, 100, 68, 0.18);
  padding-top: 10px;
}
.pon-offer-sent {
  display: flex;
  align-items: center;
  padding: 8px 16px 12px;
  font-size: 8px;
  letter-spacing: 0.10em;
  color: rgba(0, 220, 150, 0.80);
}
</style>
