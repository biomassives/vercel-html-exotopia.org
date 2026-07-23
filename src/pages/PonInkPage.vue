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

    <!-- Non-transactional notice — this page displays settlement identity
         records only. No pricing, trading, or resale of any kind happens
         here or anywhere else in Exotopia; see /terms. -->
    <div class="pon-notice">
      A settlement hashmark is a visual identity record for your claim — not a tradable
      asset. Exotopia does not host or facilitate a resale market for settlements.
    </div>

    <!-- ── Content ───────────────────────────────────────────────────────── -->
    <div class="pon-body">

      <!-- Settlement Registry ────────────────────────────────────────── -->
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
    </div><!-- /body -->

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// This page displays settlement identity/hashmark records only — see the
// non-transactional notice in the template. Exotopia does not build or host
// a secondary market, resale pricing, or peer-to-peer offer system for
// settlements (see RISK_REDUCTION_RECOMMENDATIONS.md §1 for why).

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
}

function makeSettlement(planet: string, host: string, zone: string, domeType: string, eqt: number, biome: string): Settlement {
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
  }
}

const demoSettlements = ref<Settlement[]>([
  makeSettlement('Proxima Cen b', 'Proxima Centauri', 'dayside', 'geodesic_aerogel_vacuum', 234, 'cryophyte_tundra'),
  makeSettlement('TRAPPIST-1 e',  'TRAPPIST-1',       'temperate','geodesic_polycarbonate', 271, 'temperate_grassland'),
  makeSettlement('Kepler-442 b',  'Kepler-442',       'polar',    'geodesic_aerogel_vacuum', 233, 'cryophyte_tundra'),
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
  display: flex;
  justify-content: center;
  max-width: 1100px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
}

.pon-col--left {
  width: 100%;
  max-width: 480px;
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
.pon-btn--ghost {
  background: rgba(0, 15, 28, 0.50);
  border-color: rgba(0, 140, 90, 0.25);
  color: rgba(0, 200, 140, 0.65);
}
.pon-btn--ghost:hover {
  border-color: rgba(0, 200, 140, 0.45);
  color: rgba(0, 230, 160, 0.85);
}

/* ── Non-transactional notice ──────────────────────────────────────────────── */

.pon-notice {
  max-width: 1100px;
  margin: 0 auto;
  padding: 8px 20px;
  font-size: 8.5px;
  letter-spacing: 0.05em;
  line-height: 1.5;
  color: rgba(150, 190, 220, 0.60);
  border-bottom: 1px solid rgba(0, 140, 90, 0.12);
}

</style>
