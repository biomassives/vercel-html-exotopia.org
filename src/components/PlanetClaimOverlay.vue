<template>
  <Teleport to="body">
    <Transition name="claim-fade">
      <div v-if="modelValue && planet" class="claim-overlay">

        <!-- ── Header ─────────────────────────────────────────────────────── -->
        <div class="co-header">
          <div class="co-header__left">
            <span class="co-badge">⬡ CREATE A SETTLEMENT</span>
            <span class="co-planet-name">{{ planet.pl_name }}</span>
            <span class="co-sys">{{ system?.hostname ?? '' }}</span>
          </div>
          <div class="co-steps">
            <span v-for="(label, i) in STEP_LABELS" :key="i"
              class="co-step-pip"
              :class="{ 'co-step-pip--done': i < step, 'co-step-pip--active': i === step }">
              {{ i + 1 }}. {{ label }}
            </span>
          </div>
          <button class="co-close" @click="$emit('update:modelValue', false)">✕</button>
        </div>

        <!-- ══ STEP 0 — ORIENTATION ════════════════════════════════════════ -->
        <div v-if="step === 0" class="co-body co-orient">

          <!-- Planet disc -->
          <div class="co-disc-wrap">
            <svg viewBox="-110 -110 220 220" class="co-disc">
              <defs>
                <radialGradient :id="`pdg-${uid}`" cx="38%" cy="32%" r="68%">
                  <stop offset="0%"   :stop-color="planetHex" stop-opacity="1.00"/>
                  <stop offset="55%"  :stop-color="planetHex" stop-opacity="0.80"/>
                  <stop offset="100%" stop-color="#000308"    stop-opacity="0.92"/>
                </radialGradient>
                <clipPath :id="`pc-${uid}`"><circle cx="0" cy="0" r="95"/></clipPath>
              </defs>

              <!-- Body fill -->
              <circle cx="0" cy="0" r="95" :fill="`url(#pdg-${uid})`"/>

              <!-- Latitude parallels: equator, ±30°, ±60° -->
              <g :clip-path="`url(#pc-${uid})`" fill="none" stroke-width="0.5">
                <ellipse cx="0" cy="0"   rx="95" ry="1"  stroke="rgba(255,255,255,0.24)"/>
                <ellipse cx="0" cy="-47" rx="82" ry="5"  stroke="rgba(255,255,255,0.10)"/>
                <ellipse cx="0" cy="47"  rx="82" ry="5"  stroke="rgba(255,255,255,0.10)"/>
                <ellipse cx="0" cy="-82" rx="47" ry="5"  stroke="rgba(255,255,255,0.07)"/>
                <ellipse cx="0" cy="82"  rx="47" ry="5"  stroke="rgba(255,255,255,0.07)"/>
              </g>

              <!-- Meridians: every 45° (simplified 4 lines) -->
              <g :clip-path="`url(#pc-${uid})`" fill="none"
                 stroke="rgba(255,255,255,0.07)" stroke-width="0.5">
                <line x1="-95" y1="0" x2="95" y2="0"/>
                <ellipse cx="0" cy="0" rx="67" ry="95" transform="rotate(45)"/>
                <ellipse cx="0" cy="0" rx="67" ry="95" transform="rotate(-45)"/>
              </g>

              <!-- Night-side overlay (tidally locked) -->
              <path v-if="isLocked"
                d="M 0 -95 A 95 95 0 0 0 0 95"
                :clip-path="`url(#pc-${uid})`"
                fill="rgba(0,0,15,0.48)"/>

              <!-- Prime meridian line -->
              <line x1="0" y1="-95" x2="0" y2="95"
                :clip-path="`url(#pc-${uid})`"
                stroke="rgba(0,230,255,0.60)" stroke-width="1.2" stroke-dasharray="5,3"/>

              <!-- Sub-stellar point / star indicator -->
              <text v-if="isLocked" x="48" y="5"
                font-size="22" text-anchor="middle" fill="rgba(255,220,60,0.85)">☀</text>

              <!-- ── Habitable zone bands ──────────────────────────────── -->
              <!-- HZ is estimated from equilibrium temperature ranges;
                   for tidally locked planets the terminator zone IS the HZ band. -->
              <template v-if="hzZones.length">
                <g :clip-path="`url(#pc-${uid})`">
                  <!-- Temperate band (200–350 K): green arc ring on equator -->
                  <template v-for="hz in hzZones" :key="hz.label">
                    <!-- Fill the latitude band corresponding to the HZ temperature -->
                    <ellipse cx="0" :cy="hz.cy" :rx="95 * hz.cosLat" ry="4"
                      :fill="hz.color" :fill-opacity="hz.opacity"/>
                    <!-- Label -->
                    <text :x="hz.labelX" :y="hz.cy + 1.5"
                      font-size="4.5" text-anchor="middle"
                      :fill="hz.color" fill-opacity="0.80">{{ hz.label }}</text>
                  </template>
                </g>

                <!-- HZ legend strip below disc -->
                <g transform="translate(-85, 106)">
                  <text font-size="4" fill="rgba(60,200,130,0.60)" letter-spacing="0.12">HABITABLE ZONE ESTIMATE</text>
                  <g v-for="(hz, i) in hzZones" :key="'lg'+i" :transform="`translate(${i*68}, 7)`">
                    <rect x="0" y="0" width="10" height="4" rx="1"
                      :fill="hz.color" :fill-opacity="hz.opacity * 2"/>
                    <text x="13" y="3.5" font-size="4" :fill="hz.color" fill-opacity="0.70">{{ hz.label }}</text>
                  </g>
                </g>
              </template>

              <!-- Prime meridian equator dot -->
              <circle cx="0" cy="0" r="3.5" fill="rgba(0,230,255,0.90)"/>
              <circle cx="0" cy="0" r="6"   fill="none"
                stroke="rgba(0,230,255,0.40)" stroke-width="0.8"/>

              <!-- Atmosphere ring -->
              <circle cx="0" cy="0" r="99"
                fill="none" :stroke="planetHex" stroke-width="5" stroke-opacity="0.10"/>
              <circle cx="0" cy="0" r="104"
                fill="none" :stroke="planetHex" stroke-width="1" stroke-opacity="0.04"/>
            </svg>

            <!-- Disc caption -->
            <div class="co-disc-cap">
              {{ isLocked ? 'Tidally locked · permanent day/night' : 'Rotating · full surface accessible' }}
            </div>
          </div>

          <!-- Meridian info panel -->
          <div class="co-orient-info">
            <div class="co-section-label">LOCAL GREENWICH · 0° MERIDIAN</div>
            <div class="co-prime-type">{{ primeInfo.label }}</div>
            <div class="co-prime-desc">{{ primeInfo.description }}</div>

            <div class="co-zones" v-if="primeInfo.specialZones.length">
              <div class="co-section-label" style="margin-top:14px">KEY REFERENCE LOCATIONS</div>
              <div v-for="z in primeInfo.specialZones" :key="z.label" class="co-zone-row">
                <span class="co-zone-coord">
                  {{ z.lon >= 0 ? '+' : '' }}{{ z.lon }}°&nbsp;lon &nbsp;·&nbsp; {{ z.lat }}°&nbsp;lat
                </span>
                <span class="co-zone-name" :class="`co-zone--${z.type}`">{{ z.label }}</span>
              </div>
            </div>

            <div class="co-stats">
              <div class="co-stat" v-if="planet.pl_rade">
                <span>Radius</span><span>{{ planet.pl_rade.toFixed(2) }} R⊕</span>
              </div>
              <div class="co-stat" v-if="planet.pl_eqt">
                <span>Eq. temperature</span>
                <span>{{ Math.round(planet.pl_eqt) }} K &nbsp;({{ fmtTemp(planet.pl_eqt) }})</span>
              </div>
              <div class="co-stat">
                <span>Day length (est.)</span><span>{{ dayLabel }}</span>
              </div>
              <div class="co-stat">
                <span>Available plots</span><span>648 · 10° × 10° per plot</span>
              </div>
              <div class="co-stat">
                <span>Coordinate system</span><span>exo-surface-v1</span>
              </div>
            </div>

            <button class="co-btn" @click="step = 1">Choose my plot →</button>
          </div>
        </div>

        <!-- ══ STEP 1 — PLOT SELECTION MAP ═════════════════════════════════ -->
        <div v-if="step === 1" class="co-body co-select">

          <div class="co-map-header">
            <span class="co-map-title">{{ planet.pl_name }} · Surface Plot Grid  (36 × 18 = 648 plots)</span>
            <span class="co-map-hint">Click a cell to select · hover to preview</span>
          </div>

          <!-- Axis labels row above map -->
          <div class="co-axis-top">
            <span v-for="l in lonAxisLabels" :key="l.lon"
              class="co-axis-label" :style="{ left: l.pct + '%' }">
              {{ l.lon > 0 ? '+' : '' }}{{ l.lon }}°
            </span>
          </div>

          <div class="co-map-row">
            <!-- Lat axis left -->
            <div class="co-axis-left">
              <span v-for="l in latAxisLabels" :key="l.lat"
                class="co-axis-label" :style="{ top: l.pct + '%' }">
                {{ l.lat > 0 ? l.lat + 'N' : Math.abs(l.lat) + 'S' }}
              </span>
            </div>

            <!-- SVG map -->
            <div class="co-map-container" ref="mapContainer">
              <svg
                ref="mapSvg"
                class="co-map-svg"
                viewBox="0 0 360 180"
                preserveAspectRatio="xMidYMid meet"
                @mousemove="onMapMove"
                @mouseleave="hoveredCell = null"
                @click="onMapClick"
              >
                <!-- Background -->
                <rect x="0" y="0" width="360" height="180" fill="rgba(1,3,12,0.98)"/>

                <!-- Zone colour washes -->
                <template v-if="isLocked">
                  <!-- Dayside warm wash -->
                  <rect x="90" y="0" width="180" height="180" fill="rgba(255,170,30,0.05)"/>
                  <!-- Nightside cold wash -->
                  <rect x="0"  y="0" width="90"  height="180" fill="rgba(0,0,40,0.18)"/>
                  <rect x="270" y="0" width="90" height="180" fill="rgba(0,0,40,0.18)"/>
                  <!-- Terminator shafts -->
                  <rect x="80" y="0" width="20" height="180" fill="rgba(0,200,230,0.04)"/>
                  <rect x="260" y="0" width="20" height="180" fill="rgba(0,200,230,0.04)"/>
                </template>
                <template v-else>
                  <!-- Latitude temperature gradient: hot equator, cold poles -->
                  <rect x="0" y="0"   width="360" height="25"  fill="rgba(160,220,255,0.06)"/>
                  <rect x="0" y="155" width="360" height="25"  fill="rgba(160,220,255,0.06)"/>
                  <rect x="0" y="65"  width="360" height="50"  fill="rgba(255,140,30,0.04)"/>
                </template>

                <!-- Selectable cells (648) — rendered via v-for row then col -->
                <g v-for="row in 18" :key="'r'+row">
                  <rect
                    v-for="col in 36" :key="'c'+col"
                    :x="(col-1)*10" :y="(row-1)*10"
                    width="9.6" height="9.6" rx="0.6"
                    :fill="cellFill(row-1, col-1)"
                    :stroke="cellStroke(row-1, col-1)"
                    :stroke-width="isSelectedCell(row-1,col-1) ? 1.0 : isHoveredCell(row-1,col-1) ? 0.7 : 0.18"
                    stroke-opacity="0.85"
                  />
                </g>

                <!-- Grid reference lines every 30° -->
                <g stroke="rgba(80,140,190,0.20)" stroke-width="0.4" fill="none">
                  <line v-for="x in [30,60,90,120,150,180,210,240,270,300,330]"
                    :key="'gl'+x" :x1="x" y1="0" :x2="x" y2="180"/>
                  <line v-for="y in [30,60,90,120,150]"
                    :key="'gla'+y" x1="0" :y1="y" x2="360" :y2="y"/>
                </g>

                <!-- Prime meridian + equator -->
                <line x1="180" y1="0" x2="180" y2="180"
                  stroke="rgba(0,220,255,0.50)" stroke-width="0.9"/>
                <line x1="0" y1="90" x2="360" y2="90"
                  stroke="rgba(0,220,255,0.25)" stroke-width="0.6"/>

                <!-- Locked: terminator lines + sub-stellar marker -->
                <template v-if="isLocked">
                  <line x1="90" y1="0" x2="90" y2="180"
                    stroke="rgba(0,210,240,0.38)" stroke-width="0.8" stroke-dasharray="3,2"/>
                  <line x1="270" y1="0" x2="270" y2="180"
                    stroke="rgba(0,210,240,0.38)" stroke-width="0.8" stroke-dasharray="3,2"/>
                  <circle cx="180" cy="90" r="5"
                    fill="rgba(255,220,50,0.55)"/>
                  <circle cx="180" cy="90" r="10"
                    fill="none" stroke="rgba(255,220,50,0.28)" stroke-width="0.8"/>
                  <text x="183" y="101" font-size="4.5" fill="rgba(255,220,50,0.70)">☀ 0°lon</text>
                  <!-- Anti-stellar -->
                  <circle cx="0" cy="90" r="3" fill="rgba(80,100,160,0.40)"/>
                  <circle cx="360" cy="90" r="3" fill="rgba(80,100,160,0.40)"/>
                </template>

                <!-- Cardinal labels on the map -->
                <text x="181" y="7" font-size="4.5" fill="rgba(0,200,255,0.50)">90°N</text>
                <text x="181" y="177" font-size="4.5" fill="rgba(0,200,255,0.50)">90°S</text>
                <text x="3"  y="89" font-size="4.0" fill="rgba(0,200,255,0.35)">180°W</text>
                <text x="326" y="89" font-size="4.0" fill="rgba(0,200,255,0.35)">180°E</text>
              </svg>
            </div>
          </div>

          <!-- Selected cell details bar -->
          <Transition name="cell-bar">
            <div class="co-cell-bar" v-if="selectedCell">
              <div class="co-cell-coord">{{ cellLabel(selectedCell.row, selectedCell.col) }}</div>
              <div class="co-cell-zone">{{ zoneName(selectedCell.row, selectedCell.col) }}</div>
              <div class="co-cell-climate" :class="`climate--${climateClass(selectedCell.row, selectedCell.col)}`">
                {{ climateDesc(selectedCell.row, selectedCell.col) }}
              </div>
              <div class="co-cell-addr">{{ previewAddress }}</div>
            </div>
            <div class="co-cell-bar co-cell-bar--empty" v-else>
              <span>Click any cell to select your 40-acre plot</span>
            </div>
          </Transition>

          <div class="co-select-actions">
            <button class="co-btn co-btn--ghost" @click="step = 0">← Back</button>
            <button class="co-btn" :disabled="!selectedCell" @click="step = 2">
              Confirm this plot →
            </button>
          </div>
        </div>

        <!-- ══ STEP 2 — CONFIRM & ADDRESS ══════════════════════════════════ -->
        <div v-if="step === 2 && selectedCell" class="co-body co-confirm">

          <!-- Zoom map: 5×5 cells around selection -->
          <div class="co-zoom-panel">
            <div class="co-section-label">SELECTED REGION — 5× ZOOM</div>
            <svg class="co-zoom-svg" :viewBox="zoomViewBox" preserveAspectRatio="xMidYMid meet">

              <!-- Background -->
              <rect :x="zoomBox.x" :y="zoomBox.y" :width="50" :height="50"
                fill="rgba(1,3,12,0.98)"/>

              <!-- Cells in the 5×5 window -->
              <g v-for="r in zoomRows" :key="'zr'+r">
                <rect
                  v-for="c in zoomCols" :key="'zc'+c"
                  :x="c*10" :y="r*10"
                  width="9.6" height="9.6" rx="0.5"
                  :fill="cellFill(r,c)"
                  :stroke="cellStroke(r,c)"
                  :stroke-width="isSelectedCell(r,c) ? 1.5 : 0.35"
                  stroke-opacity="0.90"
                />
                <!-- Coordinate labels in zoom view -->
                <text
                  v-for="c in zoomCols" :key="'zt'+r+'_'+c"
                  :x="c*10 + 4.8" :y="r*10 + 5.5"
                  font-size="1.8" text-anchor="middle"
                  fill="rgba(100,180,220,0.50)"
                >{{ shortCoord(r,c) }}</text>
              </g>

              <!-- Grid lines -->
              <g stroke="rgba(80,140,190,0.30)" stroke-width="0.3" fill="none">
                <line v-for="c in zoomCols" :key="'zvl'+c"
                  :x1="c*10" :y1="zoomBox.y" :x2="c*10" :y2="zoomBox.y+50"/>
                <line v-for="r in zoomRows" :key="'zhl'+r"
                  :x1="zoomBox.x" :y1="r*10" :x2="zoomBox.x+50" :y2="r*10"/>
              </g>

              <!-- Selected cell glowing border -->
              <rect
                :x="selectedCell.col*10" :y="selectedCell.row*10"
                width="9.6" height="9.6" rx="0.5"
                fill="none"
                stroke="rgba(255,60,60,0.90)" stroke-width="1.2"/>
            </svg>
          </div>

          <!-- Metadata panel -->
          <div class="co-meta-panel">
            <div class="co-section-label">EXOLOCATION ADDRESS</div>
            <div class="co-addr-block">{{ exolocAddress }}</div>

            <div class="co-meta-grid">
              <div class="co-meta-row"><span>Coordinate system</span><span>exo-surface-v1</span></div>
              <div class="co-meta-row"><span>Reference body</span><span>{{ planet.pl_name }}</span></div>
              <div class="co-meta-row"><span>Plot centre</span>
                <span>{{ cellLabel(selectedCell.row, selectedCell.col) }}</span></div>
              <div class="co-meta-row"><span>Zone</span>
                <span>{{ zoneName(selectedCell.row, selectedCell.col) }}</span></div>
              <div class="co-meta-row"><span>Climate</span>
                <span>{{ climateDesc(selectedCell.row, selectedCell.col) }}</span></div>
              <div class="co-meta-row"><span>Plot angular area</span><span>10° × 10° (40 virtual acres)</span></div>
              <div class="co-meta-row"><span>Prime meridian</span>
                <span>{{ primeInfo.type === 'sub-stellar' ? 'Sub-stellar (star-facing)' : 'Discovery transit meridian' }}</span></div>
              <div class="co-meta-row"><span>System</span><span>{{ system?.hostname }}</span></div>
              <div class="co-meta-row"><span>Distance</span>
                <span v-if="system?.sy_dist">{{ system.sy_dist.toFixed(1) }} pc · {{ (system.sy_dist * 3.26).toFixed(0) }} ly</span>
              </div>
            </div>

            <div class="co-next-tease">
              <div class="co-section-label" style="margin-top:14px">NEXT STEPS</div>
              <div class="co-tease-row">
                <span class="co-tease-item co-tease-item--2">⚡ Hub tech pack</span>
                <span class="co-tease-item co-tease-item--3">♪ Artists &amp; $BARS</span>
                <span class="co-tease-item co-tease-item--4">🤖 Mule corpus</span>
              </div>
              <div class="co-tease-note">Select in the next mint steps after location is confirmed.</div>
            </div>

            <div class="co-confirm-actions">
              <button class="co-btn co-btn--ghost" @click="step = 1">← Back to map</button>
              <button class="co-btn co-btn--preview" @click="proceedToPreview">
                ◈ Preview first →
              </button>
              <button class="co-btn co-btn--mint" @click="proceedToMint">
                ⬡ Establish Settlement
              </button>
            </div>
          </div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Planet, StarSystem } from 'src/stores/galaxy'
import { usesFahrenheit } from 'src/lib/planet-climate'
import { estimateDayLength } from 'src/lib/planet-climate'
import { useSettlements, surfaceKey } from 'src/lib/settlements'

// ── Props / emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  modelValue: boolean
  planet:     Planet | null
  system:     StarSystem | null
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const router = useRouter()
const { addSettlement } = useSettlements()

// Stable unique ID for SVG gradient refs
const uid = Math.random().toString(36).slice(2, 8)

// ── Step state ────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Orient', 'Select plot', 'Confirm'] as const
const step = ref(0)

// ── Cell selection ────────────────────────────────────────────────────────────

interface Cell { row: number; col: number }

const selectedCell = ref<Cell | null>(null)
const hoveredCell  = ref<Cell | null>(null)

function cellLon(col: number): number { return col * 10 - 175 }   // centre of 10° cell
function cellLat(row: number): number { return 85  - row * 10 }   // centre of 10° cell

function isSelectedCell(r: number, c: number) {
  return selectedCell.value?.row === r && selectedCell.value?.col === c
}
function isHoveredCell(r: number, c: number) {
  return hoveredCell.value?.row === r && hoveredCell.value?.col === c
}

// ── Planet visual ─────────────────────────────────────────────────────────────

const planetHex = computed((): string => {
  const eqt = props.planet?.pl_eqt
  if (eqt == null) return '#4488aa'
  if (eqt > 2000) return '#ff2200'
  if (eqt > 1200) return '#ff6600'
  if (eqt > 500)  return '#ffaa00'
  if (eqt > 280)  return '#44ddaa'
  if (eqt > 150)  return '#6699cc'
  return '#aaccff'
})

// ── Habitable zone bands on the planet disc ───────────────────────────────────
// We estimate where the surface temperature is in the 200–350 K range.
// For tidally locked: this is the terminator zone (around ±90° lon → ±90° lat equivalent in the diagram).
// For rotating planets: it's a latitude band computed from the planet's equilibrium temperature.

interface HZBand { label: string; cy: number; cosLat: number; color: string; opacity: number; labelX: number }

const hzZones = computed((): HZBand[] => {
  const eqt = props.planet?.pl_eqt
  if (eqt == null) return []

  const zones: HZBand[] = []

  if (isLocked.value) {
    // Terminator zone = temperate ring at ±90° — show as two vertical bands on disc
    // In the 2D disc projection, ±90° lon correspond to the limb edges; we mark them
    // as curved caps on the left/right of the disc
    if (eqt > 100 && eqt < 800) {
      zones.push({
        label: 'Terminator HZ', cy: 0,
        cosLat: 0.06,  // thin strip at the disc edge (limb)
        color: '#44ee99', opacity: 0.22, labelX: 80,
      })
    }
  } else {
    // For a rotating planet, equatorial temperature ≈ eqt; polar ≈ eqt × 0.65
    // Find the latitude where T drops into [200, 350] K
    const polarT = eqt * 0.65
    const isHZEquator = eqt >= 200 && eqt <= 350
    const isHZPole    = polarT >= 200 && polarT <= 350

    if (isHZEquator) {
      // Equatorial band (±20°) is temperate
      zones.push({ label: 'Eq. HZ', cy: 0,   cosLat: Math.cos(20 * Math.PI/180), color: '#44ee99', opacity: 0.18, labelX: 0 })
    }
    if (eqt > 350 && eqt < 700) {
      // Too hot at equator, but sub-tropics (lat ~30–50°) might be habitable
      const lat = 40
      const cy  = -(lat / 90) * 95
      zones.push({ label: 'Sub-trop. HZ', cy, cosLat: Math.cos(lat * Math.PI/180), color: '#88ddcc', opacity: 0.16, labelX: 0 })
      zones.push({ label: 'Sub-trop. HZ', cy: -cy, cosLat: Math.cos(lat * Math.PI/180), color: '#88ddcc', opacity: 0.16, labelX: 0 })
    }
    if (isHZPole) {
      // Polar region is in temperate range
      const lat = 70
      const cy  = -(lat / 90) * 95
      zones.push({ label: 'Polar HZ', cy,   cosLat: Math.cos(lat * Math.PI/180), color: '#aaddff', opacity: 0.18, labelX: 0 })
      zones.push({ label: 'Polar HZ', cy: -cy, cosLat: Math.cos(lat * Math.PI/180), color: '#aaddff', opacity: 0.18, labelX: 0 })
    }
    if (eqt < 200) {
      // Entire planet is frozen — no HZ band, show "sub-surface liquid possible"
      zones.push({ label: 'Cryo HZ?', cy: 0, cosLat: Math.cos(25 * Math.PI/180), color: '#88aaff', opacity: 0.12, labelX: 0 })
    }
  }

  return zones
})

// ── Tidal lock & day length ───────────────────────────────────────────────────

const isLocked = computed((): boolean => {
  if (!props.planet || !props.system) return false
  const dl = estimateDayLength(props.planet, props.system)
  return dl.mode === 'locked'
})

const dayLabel = computed((): string => {
  if (!props.planet || !props.system) return '—'
  return estimateDayLength(props.planet, props.system).label
})

// ── Prime meridian definition ─────────────────────────────────────────────────

interface ZoneRef { lon: number; lat: number; label: string; type: 'hot'|'cold'|'temperate'|'info' }
interface PrimeInfo {
  type:         'sub-stellar' | 'discovery'
  label:        string
  description:  string
  specialZones: ZoneRef[]
}

const primeInfo = computed((): PrimeInfo => {
  if (isLocked.value) {
    return {
      type: 'sub-stellar',
      label: '0° — Sub-stellar point (permanent noon)',
      description:
        'This planet is tidally locked. The star is always directly overhead at 0° longitude — '
        + 'permanent day side. 180° is the anti-stellar point, in permanent darkness. '
        + 'The terminator — the day/night boundary — runs along ±90° longitude and is '
        + 'the most thermally stable zone for settlement.',
      specialZones: [
        { lon:   0, lat: 0, label: 'Sub-stellar point · permanent noon', type: 'hot'       },
        { lon:  90, lat: 0, label: 'East terminator · perpetual dawn',   type: 'temperate' },
        { lon: -90, lat: 0, label: 'West terminator · perpetual dusk',   type: 'temperate' },
        { lon: 180, lat: 0, label: 'Anti-stellar · permanent midnight',  type: 'cold'      },
      ],
    }
  }
  return {
    type: 'discovery',
    label: '0° — Discovery transit meridian',
    description:
      'The prime meridian is set at the planetary orientation during the first confirmed transit '
      + 'detection — the face presented toward Earth at discovery epoch. '
      + 'Since no surface features have been resolved, this is the standard convention for '
      + 'uncharted exoplanets.',
    specialZones: [
      { lon:   0, lat:  0, label: 'Discovery meridian / equatorial reference', type: 'info' },
      { lon: -90, lat:  0, label: 'Western quadrant boundary',                 type: 'info' },
      { lon:  90, lat:  0, label: 'Eastern quadrant boundary',                 type: 'info' },
      { lon: 180, lat:  0, label: 'Anti-meridian',                             type: 'info' },
    ],
  }
})

// ── Temperature formatting ────────────────────────────────────────────────────

const useFahrenheit = usesFahrenheit()
function fmtTemp(k: number): string {
  if (useFahrenheit) return `${Math.round((k - 273.15) * 9 / 5 + 32)} °F`
  return `${Math.round(k - 273.15)} °C`
}

// ── Zone / climate helpers ────────────────────────────────────────────────────

const TERRAIN: string[] = [
  'Planitia', 'Highland', 'Basin', 'Shelf', 'Ridge',
  'Plateau', 'Mare', 'Lacus', 'Terra', 'Rupes',
  'Vallis', 'Dorsum', 'Fossa', 'Chaos',
]

function zoneName(row: number, col: number): string {
  const lon = cellLon(col), lat = cellLat(row)
  const absLat = Math.abs(lat)
  const latBand = absLat < 15 ? 'Equatorial'
    : absLat < 35 ? 'Sub-tropical'
    : absLat < 60 ? 'Temperate'
    : 'Polar'

  let sideBand: string
  if (isLocked.value) {
    const absLon = Math.abs(lon)
    sideBand = absLon < 30 ? 'Sub-stellar'
      : absLon < 75 ? 'Dayside'
      : absLon < 105 ? 'Terminator'
      : absLon < 150 ? 'Nightside'
      : 'Anti-stellar'
  } else {
    sideBand = lon < -60 ? 'Western' : lon > 60 ? 'Eastern' : 'Central'
  }

  const terrIdx = Math.abs((row * 37 + col * 13 + row * col) % TERRAIN.length)
  return `${latBand} ${sideBand} ${TERRAIN[terrIdx]}`
}

function climateClass(row: number, col: number): string {
  const lon    = cellLon(col), lat = cellLat(row)
  const eqt    = props.planet?.pl_eqt ?? 280
  const absLat = Math.abs(lat)

  if (isLocked.value) {
    const absLon = Math.abs(lon)
    if (absLon < 45)  return eqt > 400 ? 'hot'  : eqt > 220 ? 'warm'      : 'temperate'
    if (absLon < 90)  return eqt > 500 ? 'warm' : 'temperate'
    if (absLon < 135) return 'cold'
    return 'frozen'
  }
  if (absLat < 20)   return eqt > 400 ? 'hot'  : eqt > 250 ? 'warm'  : 'temperate'
  if (absLat < 50)   return eqt > 300 ? 'warm' : 'temperate'
  return eqt < 180 ? 'frozen' : 'cold'
}

const CLIMATE_DESC: Record<string, string> = {
  hot:       'Ultra-hot · hostile surface',
  warm:      'Warm · liquid surface possible',
  temperate: 'Temperate · habitable zone',
  cold:      'Cold · subsurface liquid possible',
  frozen:    'Frozen · cryo-stable',
}
function climateDesc(row: number, col: number): string {
  return CLIMATE_DESC[climateClass(row, col)] ?? '—'
}

// ── Cell visual styling ───────────────────────────────────────────────────────

const CLIMATE_FILL: Record<string, string> = {
  hot:       'rgba(255, 60,  10, 0.22)',
  warm:      'rgba(255,140,  40, 0.14)',
  temperate: 'rgba( 40,200, 120, 0.12)',
  cold:      'rgba( 80,140, 220, 0.12)',
  frozen:    'rgba(160,200, 255, 0.10)',
}

function cellFill(row: number, col: number): string {
  if (isSelectedCell(row, col)) return 'rgba(255, 40, 40, 0.38)'
  if (isHoveredCell(row, col))  return 'rgba(255,100, 40, 0.22)'
  return CLIMATE_FILL[climateClass(row, col)] ?? 'rgba(20,40,60,0.20)'
}

function cellStroke(row: number, col: number): string {
  if (isSelectedCell(row, col)) return 'rgba(255,  60, 60, 0.95)'
  if (isHoveredCell(row, col))  return 'rgba(255, 160, 60, 0.70)'
  return 'rgba(40, 90, 130, 0.25)'
}

// ── Map interaction ───────────────────────────────────────────────────────────

const mapSvg = ref<SVGSVGElement | null>(null)

function svgCoords(e: MouseEvent): { col: number; row: number } | null {
  const el = mapSvg.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  // SVG viewBox is 360×180; scale raw mouse offset into SVG units
  const x = (e.clientX - rect.left)  / rect.width  * 360
  const y = (e.clientY - rect.top)   / rect.height * 180
  const col = Math.floor(x / 10)
  const row = Math.floor(y / 10)
  if (col < 0 || col > 35 || row < 0 || row > 17) return null
  return { col, row }
}

function onMapMove(e: MouseEvent) {
  hoveredCell.value = svgCoords(e)
}

function onMapClick(e: MouseEvent) {
  const c = svgCoords(e)
  if (!c) return
  selectedCell.value = c
}

// ── Cell labels & address ─────────────────────────────────────────────────────

function cellLabel(row: number, col: number): string {
  const lon = cellLon(col), lat = cellLat(row)
  const latStr = lat >= 0 ? `${lat}°N` : `${Math.abs(lat)}°S`
  const lonStr = lon >= 0 ? `${lon}°E` : `${Math.abs(lon)}°W`
  return `${latStr} · ${lonStr}`
}

function shortCoord(row: number, col: number): string {
  const lon = cellLon(col), lat = cellLat(row)
  return `${lat}°,${lon}°`
}

const previewAddress = computed((): string => {
  const c = selectedCell.value
  if (!c || !props.planet) return ''
  const lat = cellLat(c.row), lon = cellLon(c.col)
  return `exo-surface-v1:${props.planet.pl_name}:${Math.abs(lat)}${lat>=0?'N':'S'},${Math.abs(lon)}${lon>=0?'E':'W'}`
})

const exolocAddress = computed(() => previewAddress.value)

// ── Axis tick labels ──────────────────────────────────────────────────────────

const lonAxisLabels = computed(() =>
  [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => ({
    lon,
    pct: ((lon + 175) / 360) * 100,
  }))
)
const latAxisLabels = computed(() =>
  [80, 60, 30, 0, -30, -60, -80].map(lat => ({
    lat,
    pct: ((90 - lat) / 180) * 100,
  }))
)

// ── Zoom view ─────────────────────────────────────────────────────────────────

const zoomBox = computed(() => {
  const c = selectedCell.value ?? { row: 9, col: 18 }
  // 5×5 window centred on selected cell, clamped to [0,35]×[0,17]
  const minCol = Math.max(0,  c.col - 2)
  const minRow = Math.max(0,  c.row - 2)
  const maxCol = Math.min(35, minCol + 4)
  const maxRow = Math.min(17, minRow + 4)
  return { x: minCol * 10, y: minRow * 10, maxCol, maxRow, minCol, minRow }
})

const zoomViewBox = computed(() => {
  const b = zoomBox.value
  return `${b.x} ${b.y} 50 50`
})

const zoomRows = computed(() => {
  const { minRow, maxRow } = zoomBox.value
  return Array.from({ length: maxRow - minRow + 1 }, (_, i) => minRow + i)
})
const zoomCols = computed(() => {
  const { minCol, maxCol } = zoomBox.value
  return Array.from({ length: maxCol - minCol + 1 }, (_, i) => minCol + i)
})

// ── Proceed to mint ───────────────────────────────────────────────────────────

function proceedToMint() {
  const c = selectedCell.value
  if (!c || !props.planet || !props.system) return

  const lat = cellLat(c.row)
  const lon = cellLon(c.col)

  // Persist settlement record in browser storage
  addSettlement({
    key:         surfaceKey(props.planet.pl_name),
    type:        'surface',
    planetName:  props.planet.pl_name,
    hostname:    props.system.hostname,
    exolocation: `exo-surface-v1:${props.system.hostname}:${props.planet.pl_name}`,
    displayName: `${props.planet.pl_name} · ${props.system.hostname}`,
    lat,
    lon,
  })

  const params = new URLSearchParams({
    host:   props.system.hostname,
    planet: props.planet.pl_name,
    coord:  'exo-surface-v1',
    lat:    String(lat),
    lon:    String(lon),
  })

  emit('update:modelValue', false)
  void router.push(`/mint?${params.toString()}`)
}

/** Navigate to the mint page in preview mode — no settlement record is saved. */
function proceedToPreview() {
  const c = selectedCell.value
  if (!c || !props.planet || !props.system) return

  const lat = cellLat(c.row)
  const lon = cellLon(c.col)

  const params = new URLSearchParams({
    host:    props.system.hostname,
    planet:  props.planet.pl_name,
    coord:   'exo-surface-v1',
    lat:     String(lat),
    lon:     String(lon),
    preview: '1',
  })

  emit('update:modelValue', false)
  void router.push(`/mint?${params.toString()}`)
}
</script>

<style scoped>
/* ── Overlay shell ─────────────────────────────────────────────────────────── */

.claim-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 2, 10, 0.96);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);
  font-family: 'Courier New', monospace;
}

.claim-fade-enter-active { transition: opacity 0.22s ease; }
.claim-fade-leave-active  { transition: opacity 0.16s ease; }
.claim-fade-enter-from,
.claim-fade-leave-to      { opacity: 0; }

/* ── Header ─────────────────────────────────────────────────────────────────── */

.co-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(0, 160, 220, 0.16);
  flex-shrink: 0;
}

.co-header__left { display: flex; align-items: center; gap: 10px; }

.co-badge {
  font-size: 9px;
  letter-spacing: 0.14em;
  color: rgba(0, 230, 255, 0.80);
  background: rgba(0, 80, 120, 0.28);
  border: 1px solid rgba(0, 180, 220, 0.30);
  border-radius: 3px;
  padding: 2px 7px;
}

.co-planet-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(210, 240, 255, 0.92);
  letter-spacing: 0.06em;
}

.co-sys {
  font-size: 9px;
  color: rgba(80, 150, 190, 0.60);
  letter-spacing: 0.08em;
}

.co-steps {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.co-step-pip {
  font-size: 8.5px;
  letter-spacing: 0.10em;
  color: rgba(60, 110, 150, 0.50);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(60, 110, 150, 0.20);
}
.co-step-pip--active {
  color: rgba(0, 220, 255, 0.88);
  border-color: rgba(0, 180, 220, 0.40);
  background: rgba(0, 60, 100, 0.28);
}
.co-step-pip--done {
  color: rgba(80, 200, 130, 0.70);
  border-color: rgba(60, 180, 110, 0.25);
}

.co-close {
  margin-left: 10px;
  background: none;
  border: 1px solid rgba(80, 120, 160, 0.30);
  color: rgba(80, 130, 170, 0.70);
  width: 26px; height: 26px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: color 0.12s, border-color 0.12s;
}
.co-close:hover { color: #ff6666; border-color: rgba(200,80,80,0.45); }

/* ── Body (shared) ───────────────────────────────────────────────────────────── */

.co-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px 24px;
  gap: 28px;
}

.co-section-label {
  font-size: 8px;
  letter-spacing: 0.20em;
  color: rgba(0, 180, 220, 0.50);
  margin-bottom: 8px;
}

.co-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 0.10em;
  color: rgba(0, 220, 255, 0.90);
  background: rgba(0, 60, 100, 0.40);
  border: 1px solid rgba(0, 180, 220, 0.40);
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.14s, border-color 0.14s;
}
.co-btn:hover:not(:disabled) {
  background: rgba(0, 90, 140, 0.55);
  border-color: rgba(0, 220, 255, 0.60);
}
.co-btn:disabled { opacity: 0.35; cursor: default; }
.co-btn--ghost {
  color: rgba(80, 140, 180, 0.65);
  background: transparent;
  border-color: rgba(60, 110, 150, 0.22);
}
.co-btn--preview {
  color: rgba(0, 200, 255, 0.80);
  border-color: rgba(0, 160, 220, 0.30);
  background: rgba(0, 40, 70, 0.28);
}
.co-btn--preview:hover:not(:disabled) {
  background: rgba(0, 60, 100, 0.42);
  border-color: rgba(0, 210, 255, 0.50);
}
.co-btn--mint {
  color: rgba(80, 230, 130, 0.92);
  border-color: rgba(60, 200, 110, 0.45);
  background: rgba(0, 70, 40, 0.35);
}
.co-btn--mint:hover:not(:disabled) {
  background: rgba(0, 100, 55, 0.50);
  border-color: rgba(80, 230, 130, 0.60);
}

/* ── STEP 0 — Orient ─────────────────────────────────────────────────────────── */

.co-orient {
  align-items: flex-start;
}

.co-disc-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.co-disc {
  width: 280px;
  height: 280px;
}

.co-disc-cap {
  font-size: 8px;
  letter-spacing: 0.10em;
  color: rgba(80, 150, 190, 0.55);
  text-align: center;
}

.co-orient-info {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.co-prime-type {
  font-size: 13px;
  color: rgba(0, 220, 255, 0.85);
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.co-prime-desc {
  font-size: 11px;
  color: rgba(140, 190, 220, 0.75);
  line-height: 1.65;
  max-width: 520px;
  margin-bottom: 10px;
}

.co-zone-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 60, 100, 0.20);
  font-size: 9.5px;
}
.co-zone-coord { color: rgba(80, 150, 190, 0.65); min-width: 140px; }
.co-zone-name  { font-size: 10px; letter-spacing: 0.05em; }
.co-zone--hot       { color: rgba(255, 120, 40, 0.85); }
.co-zone--temperate { color: rgba(60, 220, 130, 0.85); }
.co-zone--cold      { color: rgba(120, 180, 255, 0.80); }
.co-zone--info      { color: rgba(0, 200, 240, 0.70); }

.co-stats {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.co-stat {
  display: flex;
  justify-content: space-between;
  font-size: 9.5px;
  padding: 3px 0;
  border-bottom: 1px solid rgba(0, 50, 80, 0.20);
}
.co-stat span:first-child { color: rgba(80, 140, 180, 0.65); }
.co-stat span:last-child  { color: rgba(180, 220, 240, 0.85); }

/* ── STEP 1 — Select ─────────────────────────────────────────────────────────── */

.co-select {
  flex-direction: column;
  padding: 14px 20px 12px;
  gap: 10px;
}

.co-map-header {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-shrink: 0;
}
.co-map-title { font-size: 11px; color: rgba(0, 210, 255, 0.80); letter-spacing: 0.08em; }
.co-map-hint  { font-size: 9px;  color: rgba(80, 140, 180, 0.55); }

/* Axis labels */
.co-axis-top {
  position: relative;
  height: 16px;
  margin-left: 36px;
  flex-shrink: 0;
}
.co-axis-label {
  position: absolute;
  font-size: 7.5px;
  color: rgba(60, 130, 180, 0.55);
  transform: translateX(-50%);
}

.co-map-row {
  display: flex;
  flex: 1;
  gap: 6px;
  min-height: 0;
}

.co-axis-left {
  width: 32px;
  position: relative;
  flex-shrink: 0;
}
.co-axis-left .co-axis-label {
  right: 4px;
  transform: translateY(-50%);
  font-size: 7.5px;
  color: rgba(60, 130, 180, 0.55);
}

.co-map-container {
  flex: 1;
  min-width: 0;
  border: 1px solid rgba(0, 100, 160, 0.20);
  border-radius: 4px;
  overflow: hidden;
  cursor: crosshair;
}
.co-map-svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* Cell bar */
.co-cell-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  background: rgba(0, 20, 40, 0.60);
  border: 1px solid rgba(0, 120, 180, 0.20);
  border-radius: 5px;
  font-size: 9.5px;
  min-height: 36px;
}
.co-cell-bar--empty { color: rgba(60, 110, 150, 0.50); justify-content: center; }
.co-cell-coord { color: rgba(0, 210, 255, 0.80); min-width: 130px; }
.co-cell-zone  { color: rgba(160, 200, 230, 0.70); flex: 1; }
.co-cell-addr  {
  font-size: 8.5px;
  color: rgba(80, 160, 200, 0.55);
  margin-left: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.climate--hot       { color: rgba(255, 100, 30, 0.85); }
.climate--warm      { color: rgba(255, 180, 60, 0.80); }
.climate--temperate { color: rgba(60, 220, 120, 0.82); }
.climate--cold      { color: rgba(120, 180, 255, 0.78); }
.climate--frozen    { color: rgba(200, 220, 255, 0.70); }

.co-select-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.cell-bar-enter-active { transition: opacity 0.18s; }
.cell-bar-leave-active { transition: opacity 0.12s; }
.cell-bar-enter-from, .cell-bar-leave-to { opacity: 0; }

/* ── STEP 2 — Confirm ────────────────────────────────────────────────────────── */

.co-confirm {
  align-items: flex-start;
}

.co-zoom-panel {
  flex-shrink: 0;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.co-zoom-svg {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid rgba(0, 100, 160, 0.22);
  border-radius: 5px;
  background: rgba(1, 3, 12, 0.98);
  cursor: default;
}

.co-meta-panel {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.co-addr-block {
  font-size: 12px;
  color: rgba(0, 230, 255, 0.88);
  letter-spacing: 0.06em;
  background: rgba(0, 40, 70, 0.35);
  border: 1px solid rgba(0, 160, 220, 0.28);
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 10px;
  word-break: break-all;
}

.co-meta-grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.co-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 40, 70, 0.25);
  font-size: 9.5px;
}
.co-meta-row span:first-child { color: rgba(70, 130, 170, 0.65); flex-shrink: 0; }
.co-meta-row span:last-child  { color: rgba(180, 220, 240, 0.85); text-align: right; }

.co-next-tease {
  margin-top: 8px;
  padding: 10px 12px;
  background: rgba(0, 20, 40, 0.40);
  border: 1px solid rgba(0, 80, 130, 0.20);
  border-radius: 5px;
}
.co-tease-row {
  display: flex;
  gap: 14px;
  margin: 6px 0;
  flex-wrap: wrap;
}
.co-tease-item {
  font-size: 9.5px;
  padding: 3px 8px;
  border-radius: 3px;
  border: 1px solid;
}
.co-tease-item--2 { color: rgba(255,190,50,0.75); border-color: rgba(220,160,40,0.25); }
.co-tease-item--3 { color: rgba(190,130,255,0.75); border-color: rgba(160,100,220,0.25); }
.co-tease-item--4 { color: rgba(80,210,160,0.75);  border-color: rgba(60,180,130,0.25); }
.co-tease-note {
  font-size: 8.5px;
  color: rgba(70, 120, 160, 0.55);
  margin-top: 4px;
}

.co-confirm-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
</style>
