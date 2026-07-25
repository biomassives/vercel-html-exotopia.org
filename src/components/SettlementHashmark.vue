<template>
  <!-- Trigger tab — prominent card with mini quilt preview -->
  <button class="shm-trigger" @click="toggle" :class="{ 'shm-trigger--done': phase === 'done' }">
    <div class="shm-trigger__left">
      <!-- Mini quilt: 8 colored squares from first 8 hash nibbles (or placeholder) -->
      <div class="shm-mini-quilt">
        <span
          v-for="(cell, i) in miniQuiltCells"
          :key="i"
          class="shm-mini-cell"
          :style="{ color: cell.fg, backgroundColor: cell.bg }"
        >{{ cell.glyph }}</span>
      </div>
      <div class="shm-trigger__text">
        <span class="shm-trigger__label">⬡ SETTLEMENT HASHMARK</span>
        <span class="shm-trigger__sub" v-if="phase === 'done'">
          {{ finalHash.slice(0, 8) }}&thinsp;···
        </span>
        <span class="shm-trigger__sub shm-trigger__sub--dim" v-else-if="phase !== 'idle'">
          computing…
        </span>
        <span class="shm-trigger__sub shm-trigger__sub--dim" v-else>
          tap to generate
        </span>
      </div>
    </div>
    <span class="shm-trigger__chevron">{{ open ? '▲' : '▼' }}</span>
  </button>

  <!-- CLI terminal panel — slides down -->
  <Transition name="shm-panel">
    <div v-if="open" class="shm-panel">

      <!-- ── Quilt displayed FIRST when done ── -->
      <Transition name="shm-result">
        <div v-if="phase === 'done'" class="shm-result">
          <div class="shm-result__header">
            <span class="shm-result__label">⬡ SETTLEMENT HASHMARK</span>
            <button class="shm-copy" @click="copyHash" :title="copied ? 'Copied!' : 'Copy hash'">
              {{ copied ? '✓ copied' : 'copy' }}
            </button>
          </div>

          <!-- ── ASCII quilt — 8 hash rows + 4 derived parity rows ──────────────
               The SHA-256 is 64 nibbles → 8 rows × 8 columns.
               Four derived rows extend the matrix using XOR diffusion,
               like the error-correction strips of a data matrix symbol.
               Row 8 = column-wise XOR of rows 0-3 (upper-half parity)
               Row 9 = column-wise XOR of rows 4-7 (lower-half parity)
               Row 10 = XOR of rows 0-7 (full column parity stripe)
               Row 11 = row-wise XOR of cols 0-3 and cols 4-7 (checksum) -->
          <div class="shm-quilt" aria-label="Settlement signature quilt">
            <div
              v-for="(row, ri) in allQuiltRows"
              :key="ri"
              class="shm-quilt-row"
              :class="{ 'shm-quilt-row--parity': ri >= 8 }"
            >
              <span
                v-for="(cell, ci) in row"
                :key="ci"
                class="shm-quilt-cell"
                :class="{ 'shm-quilt-cell--parity': ri >= 8 }"
                :style="{ color: cell.fg, backgroundColor: cell.bg }"
                :title="`[${ri},${ci}] 0x${cell.nibble} — ${cell.label}`"
              >{{ cell.glyph }}</span>
            </div>
            <!-- Parity divider label -->
            <div class="shm-quilt-divider">
              <span class="shm-quilt-divider__line"/>
              <span class="shm-quilt-divider__label">XOR PARITY · ERROR CORRECTION</span>
              <span class="shm-quilt-divider__line"/>
            </div>
          </div>

          <!-- Compact hex strip -->
          <div class="shm-hash-compact">
            <span v-for="(chunk, i) in hashChunks" :key="i"
              class="shm-chunk" :class="{ 'shm-chunk--hi': i % 4 === 0 }">
              {{ chunk }}
            </span>
          </div>

          <!-- ── Second accordion — terminal log + vectors ──────────────── -->
          <details class="shm-detail-wrap">
            <summary class="shm-detail-summary">
              <span>SETTLEMENT DETAIL</span>
              <span class="shm-detail-note">terminal log · {{ jsonByteSize }} bytes</span>
            </summary>

            <!-- Mini terminal replay (last N lines) -->
            <div class="shm-detail-terminal">
              <div v-for="line in visibleLines.slice(-12)" :key="line.id"
                class="shm-line" :class="`shm-line--${line.kind}`">
                <span class="shm-line__prefix">{{ linePrefix(line.kind) }}</span>
                <span class="shm-line__text" v-html="line.html"/>
              </div>
            </div>

            <!-- JSON metadata -->
            <div class="shm-json-label">NFT metadata · reconstruction vectors</div>
            <pre class="shm-json">{{ metadataJson }}</pre>
          </details>

        </div>
      </Transition>

      <!-- Terminal output (below quilt, always visible while computing) -->
      <div class="shm-terminal" ref="termEl" v-if="visibleLines.length || phase !== 'done'">
        <div
          v-for="line in visibleLines"
          :key="line.id"
          class="shm-line"
          :class="`shm-line--${line.kind}`"
        >
          <span class="shm-line__prefix">{{ linePrefix(line.kind) }}</span>
          <span class="shm-line__text" v-html="line.html"/>
        </div>
        <span v-if="phase !== 'done'" class="shm-cursor">▋</span>
      </div>

      <!-- Progress bar (phase: hashing) -->
      <div class="shm-progress" v-if="phase === 'hashing'">
        <span class="shm-progress__label">sha256</span>
        <span class="shm-progress__bar">
          <span class="shm-progress__fill" :style="{ width: hashPct + '%' }"/>
        </span>
        <span class="shm-progress__pct">{{ Math.round(hashPct) }}%</span>
      </div>

    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Planet, StarSystem } from 'src/stores/galaxy'
import { SETTLEMENT_SPLIT } from 'src/lib/resonance-split'

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  planet:   Planet | null
  system:   StarSystem | null
  lat?:     number
  lon?:     number
  // When true, start open and auto-run on mount (used by PonInkPage hero display)
  autoExpand?: boolean
}>()

const emit = defineEmits<{
  hashReady: [hash: string]
}>()

// ── State ─────────────────────────────────────────────────────────────────────

const open       = ref(false)
const phase      = ref<'idle' | 'building' | 'hashing' | 'done'>('idle')
const visibleLines = ref<Line[]>([])
const finalHash  = ref('')
const hashPct    = ref(0)
const copied     = ref(false)
const termEl     = ref<HTMLElement | null>(null)

interface Line {
  id:   number
  kind: 'cmd' | 'key' | 'val' | 'sep' | 'hash' | 'blank'
  html: string
}

let lineCounter = 0
function mkLine(kind: Line['kind'], html: string): Line {
  return { id: lineCounter++, kind, html }
}

// ── Seeded RNG (same mulberry32 as scene) ────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hostSeed(hostname: string): number {
  return hostname.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)
}

// ── Settlement design parameters (deterministic from planet data) ─────────────

const design = computed(() => {
  const pl  = props.planet
  const sys = props.system
  if (!pl) return null

  const seed = hostSeed(pl.hostname)
  const rng  = mulberry32(seed)

  // ── Dome ──────────────────────────────────────────────────────────────────
  const eqt = pl.pl_eqt ?? 250
  const domeType = eqt > 500  ? 'lava_tube_liner'
    : eqt > 300  ? 'inflatable_pvc'
    : eqt > 180  ? 'geodesic_polycarbonate'
    : 'geodesic_aerogel_vacuum'
  const domeRadius  = Math.round(80 + rng() * 80)    // 80–160 m
  const domeSegs    = [5, 6, 8][Math.floor(rng() * 3)]!  // icosahedron subdivision
  const domeApex    = Math.round(domeRadius * (0.55 + rng() * 0.30) * 10) / 10

  // ── Surface ───────────────────────────────────────────────────────────────
  const surfType = eqt > 1500 ? 'molten_basalt'
    : eqt > 700  ? 'rocky_silicate'
    : eqt > 273  ? 'rocky_basalt'
    : eqt > 150  ? 'icy_regolith'
    : 'cryo_nitrogen_ice'

  const orbPer = pl.pl_orbper ?? 365
  const zone   = orbPer < 10 ? (Math.abs(props.lon ?? 0) < 90 ? 'dayside' : 'nightside')
    : eqt > 350 ? 'equatorial'
    : Math.abs(props.lat ?? 0) > 60 ? 'polar'
    : 'temperate'

  const atmType = eqt > 1200 ? 'vacuum_trace'
    : (pl.pl_rade ?? 1) > 2.5 ? 'thick_h2_he'
    : 'thin_n2_co2'

  // ── Stone circle / hut ────────────────────────────────────────────────────
  const nStones  = 8
  const circleR  = Math.round(12 + rng() * 8)      // 12–20 m
  const spiralN  = Math.floor(1 + rng() * 3)        // 1–3 arms
  // Stone heights: array of 8 values
  const stoneH   = Array.from({ length: nStones }, () => +(1.5 + rng() * 2.5).toFixed(2))
  // Stone azimuths (offsets from uniform spacing)
  const stoneAz  = Array.from({ length: nStones }, (_, i) =>
    +(( i / nStones * 360) + (rng() - 0.5) * 8).toFixed(1)
  )

  // ── Ecosystem ─────────────────────────────────────────────────────────────
  const biome = eqt > 500  ? 'extremophile_thermophile'
    : eqt > 350  ? 'xerophyte_desert'
    : eqt > 250  ? 'temperate_grassland'
    : eqt > 150  ? 'cryophyte_tundra'
    : 'psychrophile_ice_sheet'

  const waterState = eqt > 400 ? 'vapor_only'
    : eqt > 273  ? 'surface_liquid'
    : eqt > 150  ? 'subsurface_liquid'
    : 'permafrost'

  const n2Pct   = +(60 + rng() * 35).toFixed(1)
  const o2Pct   = eqt > 200 && eqt < 400 ? +(5 + rng() * 20).toFixed(1) : 0.0
  const co2Pct  = +(100 - n2Pct - o2Pct).toFixed(1)

  const floraTypes = eqt > 250 && eqt < 400
    ? ['pioneer_lichen', 'rhizobial_nodule', 'mycorrhizal_mat']
    : eqt < 200 ? ['psychrophilic_algae', 'ice_crystal_formation']
    : ['chemolithotroph', 'thermophilic_archaea']

  // ── Item placement ────────────────────────────────────────────────────────
  const baseLat = props.lat  ?? 0
  const baseLon = props.lon  ?? 0

  const items = {
    dome:         { lat: +baseLat.toFixed(4),              lon: +baseLon.toFixed(4)             },
    mule:         { lat: +(baseLat + (rng()-0.5)*0.004).toFixed(4), lon: +(baseLon + (rng()-0.5)*0.004).toFixed(4) },
    stone_circle: { lat: +(baseLat + (rng()-0.5)*0.002).toFixed(4), lon: +(baseLon + (rng()-0.5)*0.002).toFixed(4) },
    e8_pyramid:   { lat: +(baseLat + (rng()-0.5)*0.006).toFixed(4), lon: +(baseLon + (rng()-0.5)*0.006).toFixed(4) },
    mule_orbs:    Array.from({ length: 5 }, () => ({
      lat: +(baseLat + (rng()-0.5)*0.010).toFixed(4),
      lon: +(baseLon + (rng()-0.5)*0.010).toFixed(4),
      zone: ['advocacy','watsan','business','youth','approvideo'][Math.floor(rng()*5)],
    })),
  }

  // ── Mule corpus config ────────────────────────────────────────────────────
  const muleCorpus = {
    version:   'v2',
    specialist_domains: ['advocacy_materials','watsan_health','business_planning','youth_career','hub_approvideo'],
    local_network_only: true,
    corpus_seed:        seed.toString(16).toUpperCase(),
    reconstruction_key: [pl.hostname, pl.pl_name, baseLat, baseLon].join(':'),
  }

  return {
    // v2: the `resonance` block previously hardcoded 80/15/5, which matched no
    // shipped metadata writer and was being SHA-256'd into `design_hash` and
    // embedded in ERC-721 deed metadata. Corrected to the real settlement split.
    // Schema version bumped so v1 deed hashes remain reproducible under v1.
    schema:       'exotopia-settlement-v2',
    planet:       pl.pl_name,
    hostname:     pl.hostname,
    coordinate:   `exo-surface-v1:${pl.pl_name}:${Math.abs(baseLat)}${baseLat>=0?'N':'S'},${Math.abs(baseLon)}${baseLon>=0?'E':'W'}`,
    dome:         { type: domeType, radius_m: domeRadius, segments: domeSegs, apex_m: domeApex },
    surface:      { type: surfType, eqt_K: Math.round(eqt), zone, atmosphere: atmType },
    hut: {
      type: 'stone_circle_archimedean_triple_spiral',
      n_stones: nStones, radius_m: circleR, spiral_arms: spiralN,
      stone_heights_m: stoneH, stone_azimuths_deg: stoneAz,
    },
    ecosystem:    { biome, water_state: waterState, n2_pct: n2Pct, o2_pct: o2Pct, co2_pct: co2Pct, flora: floraTypes },
    items,
    mule:         muleCorpus,
    resonance:    {
      creator_pct:        SETTLEMENT_SPLIT.creator        * 100,
      community_fund_pct: SETTLEMENT_SPLIT.community_fund * 100,
      platform_pct:       SETTLEMENT_SPLIT.platform       * 100,
    },
  }
})

// ── SHA-256 via Web Crypto API ────────────────────────────────────────────────

async function sha256hex(text: string): Promise<string> {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Computed display helpers ──────────────────────────────────────────────────

const hashChunks = computed(() =>
  finalHash.value.match(/.{1,8}/g) ?? []
)

// Mini quilt: 16 cells (2×8) shown in the trigger button, always visible.
// Uses the first 16 nibbles of the hash when ready, else placeholder dim cells.
const miniQuiltCells = computed((): QuiltCell[] => {
  const h = finalHash.value
  if (h.length >= 16) {
    return Array.from({ length: 16 }, (_, i) => {
      const nibble = h[i]!
      const val    = parseInt(nibble, 16)
      return { nibble, glyph: QUILT_GLYPHS[val]!, fg: QUILT_FG[val]!, bg: QUILT_BG_ROW[Math.floor(i / 8)]!, label: 'mini' }
    })
  }
  // Placeholder: dim blocks
  return Array.from({ length: 16 }, (_, i) => ({
    nibble: '0', glyph: '░', fg: 'rgba(0,160,100,0.20)', bg: 'rgba(0,20,12,0.40)', label: 'pending',
  }))
})

// ── ASCII quilt — 8×8 grid of coloured block glyphs ──────────────────────────
// The SHA-256 hash has 64 hex chars = 64 nibbles → fills an 8×8 grid perfectly.

// Glyph palette: 16 block/box characters, one per nibble value 0-F
const QUILT_GLYPHS = ['█','▓','▒','░','▄','▀','▌','▐','■','□','▪','▫','◆','◇','●','○'] as const

// Colour palette: 16 vivid hues mapped to nibble values (inspired by QR code palettes)
const QUILT_FG = [
  '#ff4455', '#ff8822', '#ffcc00', '#88dd00',
  '#00cc88', '#00aaff', '#8844ff', '#ff44cc',
  '#ff6644', '#ffaa44', '#aaee44', '#44ddaa',
  '#44aaee', '#aa66ff', '#ee44aa', '#ffddaa',
]

const QUILT_BG_ROW = [
  'rgba(80,0,0,0.28)',   'rgba(80,30,0,0.22)', 'rgba(50,50,0,0.20)',  'rgba(0,50,0,0.22)',
  'rgba(0,40,50,0.22)',  'rgba(0,20,80,0.22)', 'rgba(30,0,80,0.22)',  'rgba(70,0,50,0.22)',
]

interface QuiltCell { nibble: string; glyph: string; fg: string; bg: string; label: string }

const DOMAIN_LABELS = [
  'dome','surface','hut','ecosystem',
  'placement','mule','resonance','signature',
]

// Background colours for the 4 parity extension rows
const QUILT_BG_PARITY = [
  'rgba(0,30,20,0.40)',   // row 8 — upper-half XOR
  'rgba(0,20,30,0.40)',   // row 9 — lower-half XOR
  'rgba(20,10,30,0.45)',  // row 10 — full column parity
  'rgba(30,15,0,0.40)',   // row 11 — row checksum
]
const PARITY_LABELS = ['xor-upper','xor-lower','col-parity','checksum']

const quiltRows = computed((): QuiltCell[][] => {
  const h = finalHash.value
  if (h.length < 64) return []
  const rows: QuiltCell[][] = []
  for (let r = 0; r < 8; r++) {
    const row: QuiltCell[] = []
    for (let c = 0; c < 8; c++) {
      const nibble = h[r * 8 + c]!
      const val    = parseInt(nibble, 16)
      row.push({
        nibble,
        glyph: QUILT_GLYPHS[val]!,
        fg:    QUILT_FG[val]!,
        bg:    QUILT_BG_ROW[r]!,
        label: DOMAIN_LABELS[r] ?? 'data',
      })
    }
    rows.push(row)
  }
  return rows
})

/**
 * Extended quilt: 8 hash rows + 4 XOR-parity rows.
 * Row  8: column-wise XOR of rows 0–3  (upper-half column parity)
 * Row  9: column-wise XOR of rows 4–7  (lower-half column parity)
 * Row 10: column-wise XOR of all 8 rows (full parity stripe)
 * Row 11: row-wise XOR compressed to 8 nibbles (global checksum)
 */
const allQuiltRows = computed((): QuiltCell[][] => {
  const base = quiltRows.value
  if (base.length < 8) return base

  function xorNibbles(rows: QuiltCell[][], col: number): QuiltCell {
    let val = 0
    for (const row of rows) val ^= parseInt(row[col]!.nibble, 16)
    const nibble = val.toString(16)
    return {
      nibble,
      glyph: QUILT_GLYPHS[val]!,
      fg:    QUILT_FG[val]!,
      bg:    '',   // set by row below
      label: 'parity',
    }
  }

  const makeParityRow = (srcRows: QuiltCell[][], rowIdx: number): QuiltCell[] =>
    Array.from({ length: 8 }, (_, c) => ({
      ...xorNibbles(srcRows, c),
      bg:    QUILT_BG_PARITY[rowIdx]!,
      label: PARITY_LABELS[rowIdx]!,
    }))

  const row8  = makeParityRow(base.slice(0, 4), 0)
  const row9  = makeParityRow(base.slice(4, 8), 1)
  const row10 = makeParityRow(base,             2)

  // Row 11: XOR of ALL 64 nibbles folded into 8 (global 4-bit checksum per column)
  const row11: QuiltCell[] = Array.from({ length: 8 }, (_, c) => {
    let val = 0
    for (let r = 0; r < 8; r++) {
      val ^= parseInt(base[r]![c]!.nibble, 16)
      val ^= parseInt(base[r]![(c + 4) % 8]!.nibble, 16)
    }
    val &= 0xf
    const nibble = val.toString(16)
    return {
      nibble,
      glyph: QUILT_GLYPHS[val]!,
      fg:    QUILT_FG[val]!,
      bg:    QUILT_BG_PARITY[3]!,
      label: 'checksum',
    }
  })

  return [...base, row8, row9, row10, row11]
})

const metadataJson = computed(() =>
  design.value ? JSON.stringify(design.value, null, 2) : ''
)

const jsonByteSize = computed(() =>
  new TextEncoder().encode(metadataJson.value).length
)

function linePrefix(kind: Line['kind']): string {
  return kind === 'cmd' ? '> ' : kind === 'blank' ? '' : '  '
}

// ── Animation pipeline ────────────────────────────────────────────────────────

function hl(text: string, cls: string) {
  return `<span class="shm-hl shm-hl--${cls}">${text}</span>`
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function addLine(kind: Line['kind'], html: string, wait = 120) {
  await delay(wait)
  visibleLines.value.push(mkLine(kind, html))
  await nextTick()
  if (termEl.value) termEl.value.scrollTop = termEl.value.scrollHeight
}

async function runAnimation() {
  if (!design.value || !props.planet) return
  const d = design.value
  const pl = props.planet

  phase.value = 'building'
  visibleLines.value = []

  await addLine('cmd',   `sha256sum settlement.json`, 60)
  await addLine('blank', '', 40)
  await addLine('cmd',   `loading settlement corpus for ${hl(pl.pl_name, 'planet')}`, 80)
  await addLine('blank', '', 60)

  await addLine('key',  `DOME`.padEnd(10) + hl(d.dome.type, 'val') + `  ·  r=${d.dome.radius_m}m  ·  segs=${d.dome.segments}  ·  apex=${d.dome.apex_m}m`, 160)
  await addLine('key',  `SURFACE`.padEnd(10) + hl(d.surface.type, 'val') + `  ·  ${d.surface.eqt_K}K  ·  zone:${hl(d.surface.zone,'zone')}  ·  atm:${d.surface.atmosphere}`, 160)
  await addLine('key',  `HUT`.padEnd(10) + hl(`stone_circle_${d.hut.n_stones}`, 'val') + `  ·  r=${d.hut.radius_m}m  ·  spiral_arms=${d.hut.spiral_arms}`, 160)
  await addLine('val',  `           heights=[${d.hut.stone_heights_m.join(', ')}]m`, 80)
  await addLine('key',  `ECOSYSTEM`.padEnd(10) + hl(d.ecosystem.biome, 'val') + `  ·  H₂O:${d.ecosystem.water_state}`, 160)
  await addLine('val',  `           atm: N₂=${d.ecosystem.n2_pct}%  O₂=${d.ecosystem.o2_pct}%  CO₂=${d.ecosystem.co2_pct}%`, 80)
  await addLine('val',  `           flora: [${d.ecosystem.flora.join(', ')}]`, 80)
  await addLine('key',  `PLACEMENT`.padEnd(10) + `dome@${hl(`${d.items.dome.lat}N,${d.items.dome.lon}E`,'coord')}  mule@${d.items.mule.lat}N,${d.items.mule.lon}E`, 160)
  await addLine('val',  `           circle@${d.items.stone_circle.lat}N,${d.items.stone_circle.lon}E  pyramid@${d.items.e8_pyramid.lat}N,${d.items.e8_pyramid.lon}E`, 80)
  await addLine('key',  `MULE`.padEnd(10) + hl('corpus_v2', 'val') + `  ·  local_only  ·  seed:${d.mule.corpus_seed}`, 160)
  await addLine('val',  `           domains:[${d.mule.specialist_domains.join('|')}]`, 80)
  await addLine('blank', '', 60)

  await addLine('cmd',  `computing sha256...`, 120)
  await addLine('blank', '', 60)

  // ── Hash progress animation ────────────────────────────────────────────────
  phase.value = 'hashing'
  const inputStr = JSON.stringify(d)
  let pct = 0
  const tickInterval = setInterval(() => {
    pct = Math.min(pct + (2 + Math.random() * 6), 95)
    hashPct.value = pct
  }, 60)
  const hash = await sha256hex(inputStr)
  clearInterval(tickInterval)
  hashPct.value = 100
  await delay(200)

  // Show hash groups
  const groups = hash.match(/.{1,8}/g) ?? []
  for (let i = 0; i < groups.length; i += 4) {
    const row = groups.slice(i, i + 4).join('  ')
    await addLine('hash', hl(row, 'hash'), 80)
  }
  await addLine('blank', '', 60)

  finalHash.value = hash
  phase.value = 'done'
  emit('hashReady', hash)
}

// ── Toggle ────────────────────────────────────────────────────────────────────

async function toggle() {
  open.value = !open.value
  if (open.value && phase.value === 'idle') {
    await nextTick()
    await runAnimation()
  }
}

// ── Copy ─────────────────────────────────────────────────────────────────────

async function copyHash() {
  await navigator.clipboard.writeText(finalHash.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// Auto-expand (for hero display in PonInkPage)
if (props.autoExpand) {
  open.value = true
  void nextTick().then(() => runAnimation())
}

// Reset when planet changes
watch(() => props.planet?.pl_name, () => {
  open.value  = false
  phase.value = 'idle'
  visibleLines.value = []
  finalHash.value    = ''
  hashPct.value      = 0
})
</script>

<style scoped>
/* ── Trigger button — prominent card ─────────────────────────────────────────── */

.shm-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 10px;
  background: rgba(0, 12, 22, 0.88);
  border: 1px solid rgba(0, 200, 130, 0.30);
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  transition: background 0.13s, border-color 0.13s, box-shadow 0.13s;
  user-select: none;
  gap: 8px;
}
.shm-trigger:hover {
  background: rgba(0, 20, 38, 0.92);
  border-color: rgba(0, 255, 160, 0.45);
  box-shadow: 0 0 10px rgba(0, 200, 130, 0.12);
}
.shm-trigger--done {
  border-color: rgba(0, 220, 140, 0.50);
  box-shadow: 0 0 12px rgba(0, 180, 120, 0.15);
}
.shm-trigger__left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.shm-trigger__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.shm-trigger__label {
  font-size: 8.5px;
  letter-spacing: 0.14em;
  color: rgba(0, 210, 130, 0.85);
  white-space: nowrap;
}
.shm-trigger__sub {
  font-size: 7.5px;
  letter-spacing: 0.10em;
  color: rgba(0, 255, 170, 0.70);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.shm-trigger__sub--dim { color: rgba(0, 160, 100, 0.40); }
.shm-trigger__chevron { font-size: 8px; color: rgba(0, 180, 110, 0.55); flex-shrink: 0; }

/* ── Mini quilt in trigger ────────────────────────────────────────────────────── */

.shm-mini-quilt {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1px;
  flex-shrink: 0;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid rgba(0, 120, 80, 0.25);
}
.shm-mini-cell {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  line-height: 1;
  width: 9px;
  height: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.15s;
}

/* ── Slide transition ────────────────────────────────────────────────────────── */

.shm-panel-enter-active { transition: max-height 0.30s ease, opacity 0.22s ease; max-height: 700px; }
.shm-panel-leave-active { transition: max-height 0.22s ease, opacity 0.16s ease; }
.shm-panel-enter-from   { max-height: 0; opacity: 0; }
.shm-panel-leave-to     { max-height: 0; opacity: 0; }

/* ── Terminal panel ──────────────────────────────────────────────────────────── */

.shm-panel {
  overflow: hidden;
  background: #00080c;
  border: 1px solid rgba(0, 160, 100, 0.22);
  border-top: none;
  border-radius: 0 0 4px 4px;
}

.shm-terminal {
  padding: 10px 10px 4px;
  max-height: 280px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 160, 100, 0.20) transparent;
}

.shm-line {
  display: flex;
  align-items: baseline;
  gap: 2px;
  line-height: 1.65;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  white-space: pre-wrap;
  word-break: break-all;
}
.shm-line--cmd  { color: rgba(0, 230, 150, 0.85); }
.shm-line--key  { color: rgba(0, 200, 130, 0.75); }
.shm-line--val  { color: rgba(0, 160, 100, 0.60); }
.shm-line--hash { color: rgba(0, 255, 180, 0.80); letter-spacing: 0.08em; }
.shm-line--sep  { color: rgba(0, 100, 70, 0.45); }
.shm-line--blank{ height: 4px; }

.shm-line__prefix { color: rgba(0, 180, 110, 0.40); flex-shrink: 0; }
.shm-line__text   { flex: 1; }

/* highlight spans inside lines */
:deep(.shm-hl)          { }
:deep(.shm-hl--planet)  { color: rgba(0, 240, 200, 0.92); }
:deep(.shm-hl--val)     { color: rgba(80, 255, 180, 0.85); }
:deep(.shm-hl--zone)    { color: rgba(180, 255, 120, 0.80); }
:deep(.shm-hl--coord)   { color: rgba(0, 220, 255, 0.80); }
:deep(.shm-hl--hash)    { color: rgba(0, 255, 180, 0.90); letter-spacing: 0.12em; }

/* Blinking cursor */
.shm-cursor {
  display: inline-block;
  color: rgba(0, 255, 160, 0.80);
  font-family: 'Courier New', monospace;
  font-size: 9px;
  animation: shm-blink 0.9s step-end infinite;
}
@keyframes shm-blink { 0%,100% { opacity: 1 } 50% { opacity: 0 } }

/* ── Progress bar ────────────────────────────────────────────────────────────── */

.shm-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  font-family: 'Courier New', monospace;
  font-size: 8px;
}
.shm-progress__label { color: rgba(0, 180, 110, 0.55); min-width: 40px; }
.shm-progress__bar   { flex: 1; height: 4px; background: rgba(0, 60, 40, 0.50); border-radius: 2px; overflow: hidden; }
.shm-progress__fill  { height: 100%; background: linear-gradient(90deg, #00cc88, #00ffb8); border-radius: 2px; transition: width 0.12s linear; }
.shm-progress__pct   { color: rgba(0, 230, 150, 0.70); min-width: 28px; text-align: right; }

/* ── ASCII quilt ─────────────────────────────────────────────────────────────── */

.shm-quilt {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 10px 6px;
  background: rgba(0, 4, 8, 0.92);
  border-radius: 3px;
  margin-bottom: 6px;
  border: 1px solid rgba(0, 100, 80, 0.25);
}

.shm-quilt-row {
  display: flex;
  gap: 1px;
}

.shm-quilt-cell {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.1;
  width: 1ch;
  text-align: center;
  flex-shrink: 0;
  cursor: default;
  border-radius: 1px;
  transition: transform 0.08s, filter 0.08s;
}
.shm-quilt-cell:hover {
  transform: scale(1.35);
  filter: brightness(1.6);
  z-index: 2;
  position: relative;
}

/* Parity extension rows — slightly reduced brightness, distinct spacing */
.shm-quilt-row--parity { margin-top: 1px; }

.shm-quilt-cell--parity {
  font-size: 11px;  /* slightly smaller — secondary data */
  opacity: 0.72;
}
.shm-quilt-cell--parity:hover { opacity: 1; }

/* Divider between hash rows and parity rows */
.shm-quilt-divider {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}
.shm-quilt-divider__line {
  flex: 1;
  height: 1px;
  background: rgba(0, 120, 80, 0.30);
}
.shm-quilt-divider__label {
  font-family: 'Courier New', monospace;
  font-size: 6px;
  letter-spacing: 0.16em;
  color: rgba(0, 160, 100, 0.45);
  white-space: nowrap;
}

/* Compact hex strip below quilt */
.shm-hash-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-bottom: 8px;
}

/* ── Result section ──────────────────────────────────────────────────────────── */

.shm-result-enter-active { transition: opacity 0.30s ease; }
.shm-result-leave-active { transition: opacity 0.15s ease; }
.shm-result-enter-from, .shm-result-leave-to { opacity: 0; }

.shm-result {
  padding: 10px 10px 12px;
  border-top: 1px solid rgba(0, 120, 80, 0.22);
}

.shm-result__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.shm-result__label {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.16em;
  color: rgba(0, 210, 130, 0.60);
}

.shm-copy {
  margin-left: auto;
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  letter-spacing: 0.10em;
  color: rgba(0, 180, 110, 0.55);
  background: none;
  border: 1px solid rgba(0, 140, 90, 0.28);
  border-radius: 3px;
  padding: 1px 7px;
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s;
}
.shm-copy:hover { color: rgba(0, 255, 160, 0.80); border-color: rgba(0, 200, 130, 0.45); }

/* Main hash display */
.shm-hash {
  font-family: 'Courier New', monospace;
  font-size: 8.5px;
  color: rgba(0, 255, 170, 0.80);
  letter-spacing: 0.12em;
  word-break: break-all;
  margin-bottom: 5px;
}

.shm-hash__groups {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}
.shm-chunk {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(0, 200, 130, 0.65);
  background: rgba(0, 40, 25, 0.40);
  border: 1px solid rgba(0, 120, 80, 0.22);
  border-radius: 3px;
  padding: 1px 5px;
  letter-spacing: 0.08em;
}
.shm-chunk--hi {
  color: rgba(0, 255, 170, 0.85);
  border-color: rgba(0, 180, 120, 0.35);
  background: rgba(0, 60, 40, 0.45);
}

/* JSON metadata accordion */
.shm-json-wrap {
  border: 1px solid rgba(0, 100, 65, 0.22);
  border-radius: 4px;
  overflow: hidden;
}
.shm-json-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  color: rgba(0, 200, 130, 0.65);
  letter-spacing: 0.08em;
  cursor: pointer;
  background: rgba(0, 20, 12, 0.60);
  list-style: none;
  user-select: none;
}
.shm-json-summary::-webkit-details-marker { display: none; }
.shm-json-summary::before { content: '▶ '; font-size: 7px; color: rgba(0, 160, 100, 0.50); }
details[open] .shm-json-summary::before { content: '▼ '; }
.shm-json-note {
  font-size: 7px;
  color: rgba(0, 140, 88, 0.45);
  margin-left: auto;
}

.shm-json {
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  color: rgba(0, 200, 130, 0.65);
  background: rgba(0, 8, 5, 0.85);
  padding: 10px;
  margin: 0;
  overflow-x: auto;
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 120, 80, 0.20) transparent;
  white-space: pre;
  line-height: 1.55;
}

/* ── Second accordion — detail / terminal / JSON ─────────────── */

.shm-detail-wrap {
  border: 1px solid rgba(0, 100, 65, 0.22);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 6px;
}

.shm-detail-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  color: rgba(0, 190, 120, 0.65);
  letter-spacing: 0.12em;
  cursor: pointer;
  background: rgba(0, 14, 8, 0.70);
  list-style: none;
  user-select: none;
}
.shm-detail-summary::-webkit-details-marker { display: none; }
.shm-detail-summary::before { content: '▶ '; font-size: 7px; color: rgba(0,150,90,0.50); }
details[open] .shm-detail-summary::before { content: '▼ '; }

.shm-detail-note {
  font-size: 7px;
  color: rgba(0, 130, 80, 0.40);
}

.shm-detail-terminal {
  background: rgba(0, 4, 2, 0.90);
  padding: 8px 10px 4px;
  border-bottom: 1px solid rgba(0, 80, 50, 0.18);
  max-height: 140px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 120, 80, 0.20) transparent;
}

.shm-json-label {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.14em;
  color: rgba(0, 160, 100, 0.40);
  padding: 5px 10px 2px;
  background: rgba(0, 8, 5, 0.85);
}
</style>
