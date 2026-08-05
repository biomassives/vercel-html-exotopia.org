<template>
  <div class="defender-nav" :class="{ 'is-collapsed': collapsed }">
    <div class="defender-header">
      <span class="dn-breadcrumb">{{ modeLabel }} / {{ sceneLabel }}</span>

      <!-- View mode pills — kept (controls scene overlay in parent) -->
      <div class="dn-view-pills">
        <button
          v-for="m in VIEW_MODES" :key="m.key"
          :class="['dn-pill', { 'dn-pill--active': viewMode === m.key }]"
          @click="setViewMode(m.key)"
          :title="m.desc"
        >{{ m.label }}</button>
      </div>

      <span class="dn-sep">│</span>

      <!-- Event finder -->
      <button
        :class="['dn-finder-btn', { 'dn-finder-btn--active': eventFinderActive }]"
        @click="toggleEventFinder"
        title="Event finder"
      >⊙</button>

      <span class="dn-sep">│</span>

      <!-- ▲ GO UP — ascend one realm level (hidden in cosmic mode) -->
      <button
        v-if="props.mode !== 'cosmic'"
        class="dn-ascend-btn"
        @click="emit('ascendRealm')"
        :title="props.mode === 'surface' ? 'Go up to star system view' : 'Go up to cosmic view'"
      >▲ {{ props.mode === 'surface' ? 'SYSTEM' : 'COSMIC' }}</button>

      <span class="dn-sep">│</span>

      <!-- ◄ PREV — return to saved camera position (shown by parent) -->
      <button
        v-if="props.showReturnBtn"
        class="dn-return-btn"
        @click="emit('returnToPrev')"
        title="Return to previous view"
      >◄ PREV</button>

      <span class="dn-sep">│</span>

      <!-- Meta view tabs — show current strip, or zoom-out context views -->
      <div class="dn-meta-tabs">
        <button
          :class="['dn-mtab', { 'dn-mtab--active': metaTab === 0 }]"
          @click="metaTab = 0"
          title="Current scene strip view"
        >STRIP</button>
        <button
          :class="['dn-mtab', { 'dn-mtab--active': metaTab === 1 }]"
          @click="metaTab = 1"
          :title="meta1Label"
        >+1</button>
        <button
          :class="['dn-mtab', { 'dn-mtab--active': metaTab === 2 }]"
          @click="metaTab = 2"
          :title="meta2Label"
        >+2</button>
      </div>

      <button class="dn-collapse-btn" @click="collapsed = !collapsed">
        {{ collapsed ? '▲' : '▼' }}
      </button>
    </div>

    <canvas
      ref="navCanvas"
      v-show="!collapsed"
      class="dn-canvas"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseLeave"
      @wheel.prevent="onWheel"
      @click="onClick"
    />

    <Transition name="dn-tip">
      <div
        v-if="tooltip.visible"
        class="dn-tooltip"
        :style="{ left: tooltip.x + 'px' }"
      >
        <div class="dn-tip-name">{{ tooltip.name }}</div>
        <div v-if="tooltip.type" class="dn-tip-type">{{ tooltip.type }}</div>
        <div v-if="tooltip.stat" class="dn-tip-stat">{{ tooltip.stat }}</div>
        <div v-if="tooltip.action" class="dn-tip-action">{{ tooltip.action }}</div>
        <div v-if="tooltip.warning" class="dn-tip-warn">{{ tooltip.warning }}</div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import type {
  DefenderNavData,
  DefenderTarget,
  OrbitalGalleryEntry,
  GalleryType,
  StellarConfig,
  PlanetStripEntry,
  SkyObjectEntry,
  CosmicStripEntry,
  ConduitStripEntry,
} from 'src/lib/defender-nav.types'

// ── Props / Emits / Expose ────────────────────────────────────────────────────

const props = defineProps<{
  mode:           'system' | 'surface' | 'cosmic'
  sceneLabel:     string
  showReturnBtn?: boolean    // show ◄ PREV pill when caller has a saved camera position
}>()

type ViewMode = 'natural' | 'xray' | 'dark_matter'

const VIEW_MODES: { key: ViewMode; label: string; desc: string }[] = [
  { key: 'natural',     label: 'NAT',    desc: 'Natural light — standard visualization' },
  { key: 'xray',        label: 'X-RAY',  desc: 'X-ray overlay — highlights hot gas, clusters, and AGN' },
  { key: 'dark_matter', label: 'DK.MAT', desc: 'Dark matter view — filament density prototype' },
]

const emit = defineEmits<{
  flyTo:           [target: DefenderTarget]
  portalTo:        [dest: { label: string; route: string }]
  viewModeChange:  [mode: ViewMode]
  eventFinderOpen: []
  /** User clicked the Earth↔System inset — parent should zoom to show both Sol and current system */
  contextZoom:     []
  /** User clicked ◄ PREV — parent should restore saved camera position */
  returnToPrev:    []
  /** User clicked ▲ SYSTEM / ▲ COSMIC — parent should navigate one realm level up */
  ascendRealm:     []
}>()

// ── View mode / time scrubber / event finder state ────────────────────────────

const viewMode          = ref<ViewMode>('natural')
const cosmicTimeMyr     = ref(0)           // 0 = now, negative = Myr ago
const eventFinderActive = ref(false)

// ── Meta view tabs ────────────────────────────────────────────────────────────
// 0 = current scene strip (default), 1 = one level up, 2 = two levels up
const metaTab = ref<0 | 1 | 2>(0)

const meta1Label = computed(() => {
  if (props.mode === 'surface') return 'Star system — top-down orrery'
  if (props.mode === 'system')  return 'Galactic position context'
  return 'Cluster distribution overview'
})
const meta2Label = computed(() => {
  if (props.mode === 'surface') return 'Galactic context — Sol to system'
  if (props.mode === 'system')  return 'Cosmic cluster map'
  return 'Void-scale large structure'
})

const cosmicTimeLabel = computed(() => {
  if (cosmicTimeMyr.value === 0) return 'NOW'
  const abs = Math.abs(cosmicTimeMyr.value)
  return abs >= 1000 ? `${(abs / 1000).toFixed(1)} Gyr` : `${abs} Myr`
})

function setViewMode(mode: ViewMode) {
  viewMode.value = mode
  emit('viewModeChange', mode)
}

function toggleEventFinder() {
  eventFinderActive.value = !eventFinderActive.value
  emit('eventFinderOpen')
}

// ── Module-level mutable state (not reactive — updated every frame) ───────────

let W            = 0
let H            = 80
let DPR          = 1
let zoomCurrent  = 1
let viewOffset   = 0
let targetOffset = 0
let viewOffsetX  = 0
let viewOffsetZ  = 0

// System-mode strip angle is otherwise an arbitrary orbital-plane origin —
// this reanchors screen-X=0° to the system's real galactic longitude (see
// galacticLongitudeDeg() below), so the tick row reads as a genuine compass
// toward the galactic center rather than an arbitrary zero. Zero in
// surface/cosmic mode: surface azimuth is already a real local compass and
// shouldn't be re-anchored, and cosmic mode has no single system to anchor to.
let galacticOffsetDeg = 0

let isDragging          = false
let dragStartX          = 0
let dragStartOffset     = 0
let autoFollowSuppressed = false
let suppressTimer       = 0

// ── Drag-release momentum + "slosh" settle physics ─────────────────────────
// Model: on release, a flicked drag keeps coasting (exponential velocity
// decay = friction), then hands its small residual velocity off to a light
// underdamped spring that overshoots the settle point slightly and wobbles
// down — reads as "weighted dial with give" rather than a hard stop.
const PAN_FRICTION          = 3.2   // 1/s — velocity decay rate during coast
const MIN_FLICK_VELOCITY    = 15    // deg/s — below this, no momentum at all (plain stop)
const MAX_PAN_VELOCITY      = 900   // deg/s — clamp so a huge mouse jump can't spin wildly
const SLOSH_ENTRY_VELOCITY  = 6     // deg/s — coast hands off to the spring below this speed
const SLOSH_STIFFNESS       = 300   // spring k (rad/s^2 per deg) — sets wobble period (~0.36s)
const SLOSH_DAMPING         = 11    // spring c — zeta ≈ 0.32 (underdamped, quick decay)
const SLOSH_SETTLE_EPS_POS  = 0.05  // deg — below this + velocity eps, spring is considered settled
const SLOSH_SETTLE_EPS_VEL  = 0.5   // deg/s

let velocityEMA    = 0     // deg/s — smoothed pointer velocity, sampled during drag
let lastMoveT       = 0     // performance.now()/1000 at last onMouseMove sample
let panVelocity     = 0     // deg/s — active coast velocity
let momentumActive  = false
let sloshActive     = false
let sloshOffset     = 0     // deg — spring displacement from settlePoint
let sloshVelocity   = 0     // deg/s — spring velocity
let settlePoint     = 0     // deg — center the spring oscillates around

let drawT = 0
let lastFrameT = 0

// ── Strip zoom-into-dot portal animation (spec §6) ────────────────────────────
// When the user clicks a cross-level destination, the strip zooms in toward the
// clicked dot (0.28s), dims to black (0.10s), then fires the portalTo event.

interface ZoomPortalAnim {
  startT:  number                          // drawT when animation started
  angle:   number                          // azimuth or orbit angle to center on
  dest:    { label: string; route: string }
}
let zoomPortalAnim: ZoomPortalAnim | null = null

// Last known system reference (stored from redraw data, used in onClick)
let lastCurrentSystemRef: DefenderNavData['currentSystemRef'] = undefined

interface HitRegion {
  x: number
  y: number
  r: number
  target: DefenderTarget
  tip: TooltipData
}
let hitRegions: HitRegion[] = []

interface TooltipData {
  name:     string
  type?:    string
  stat?:    string
  action?:  string
  warning?: string
}

// ── Vue reactive state ────────────────────────────────────────────────────────

const navCanvas = ref<HTMLCanvasElement | null>(null)
const collapsed  = ref(false)
const zoomTarget = ref(1)

const tooltip = reactive<{
  visible: boolean
  x:       number
  name:    string
  type?:   string
  stat?:   string
  action?: string
  warning?: string
}>({
  visible: false,
  x:       0,
  name:    '',
})

const modeLabel = computed(() =>
  props.mode === 'system'  ? 'ORBITAL PLANE' :
  props.mode === 'surface' ? '360° HORIZON'  : 'COSMIC WEB'
)

// ── Colour helpers ────────────────────────────────────────────────────────────

function teffToHex(teff?: number | null): string {
  if (!teff) return '#fff4ea'
  if (teff >= 30000) return '#9bb0ff'
  if (teff >= 10000) return '#aabfff'
  if (teff >= 7500)  return '#cad7ff'
  if (teff >= 6000)  return '#f8f7ff'
  if (teff >= 5200)  return '#fff4ea'
  if (teff >= 3700)  return '#ffd2a1'
  return '#ffcc6f'
}

function eqtToHex(eqt?: number | null, au?: number | null): string {
  if (eqt != null) {
    if (eqt > 2000) return '#ff4500'
    if (eqt > 1200) return '#ff8c42'
    if (eqt > 500)  return '#f0c040'
    if (eqt > 273)  return '#4ecdc4'
    if (eqt > 100)  return '#82b4d0'
    return '#c8e8f8'
  }
  if (au != null) {
    if (au < 0.08) return '#ff4500'
    if (au < 0.5)  return '#ff8c42'
    if (au < 1.5)  return '#4ecdc4'
    if (au < 4.0)  return '#82b4d0'
    return '#c8e8f8'
  }
  return '#7fb3d3'
}

const GALLERY_COLORS: Record<GalleryType, string> = {
  art:       'rgba(200,120,255,0.9)',
  community: 'rgba(255,200,60,0.9)',
  research:  'rgba(60,220,180,0.9)',
  stage:     'rgba(255,60,180,0.9)',
  info:      'rgba(140,200,255,0.9)',
}

// ── Coordinate helpers ────────────────────────────────────────────────────────

// J2000 north galactic pole (IAU 1958 definition, as used throughout this
// app's other RA/Dec math — see drawContextInset below).
const NGP_RA_DEG  = 192.85948
const NGP_DEC_DEG = 27.12825
const L_NCP_DEG   = 122.93192

/**
 * Real galactic longitude (0-360°, l=0 toward the galactic center) for a
 * J2000 RA/Dec position — standard equatorial→galactic conversion. This is
 * the one honest piece of real geometry available for "compass toward the
 * galaxy": the underlying orbital-plane orientation of a generated system
 * relative to the sky isn't modeled in 3D, so this offset anchors the strip
 * to something real (the system's actual sky position) without claiming the
 * orbital plane itself is physically pointed that way — see
 * SPEC_DEFENDERNAV.md §1.7 for the caveat spelled out in full.
 */
function galacticLongitudeDeg(raDeg: number, decDeg: number): number {
  const ra  = raDeg  * Math.PI / 180
  const dec = decDeg * Math.PI / 180
  const raNgp  = NGP_RA_DEG  * Math.PI / 180
  const decNgp = NGP_DEC_DEG * Math.PI / 180

  const y = Math.cos(dec) * Math.sin(ra - raNgp)
  const x = Math.cos(decNgp) * Math.sin(dec) - Math.sin(decNgp) * Math.cos(dec) * Math.cos(ra - raNgp)
  const l = L_NCP_DEG - Math.atan2(y, x) * 180 / Math.PI
  return ((l % 360) + 360) % 360
}

function angleToX(deg: number): number {
  const range = 360 / zoomCurrent
  return (((deg - galacticOffsetDeg) - viewOffset + 3600) % 360) / range * W
}

function auToY(au: number, maxAU: number): number {
  return H - 6 - (Math.log10(1 + au) / Math.log10(1 + maxAU)) * (H - 10)
}

function azToX(deg: number): number {
  return angleToX(deg)
}

function altToY(alt: number): number {
  return H / 2 - (alt / 90) * (H / 2 - 4)
}

function cosmicToX(sceneX: number, worldRangeX: number): number {
  return (sceneX - viewOffsetX) / worldRangeX * W
}

function cosmicToZ(sceneZ: number, worldRangeZ: number): number {
  return (sceneZ - viewOffsetZ) / worldRangeZ * H
}

// ── Glow drawing helper ───────────────────────────────────────────────────────

function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  outerR: number,
  innerR: number,
) {
  const prev = ctx.globalCompositeOperation
  ctx.globalCompositeOperation = 'screen'

  const go = ctx.createRadialGradient(x, y, 0, x, y, outerR)
  go.addColorStop(0, color)
  go.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalAlpha = 0.13
  ctx.fillStyle = go
  ctx.beginPath(); ctx.arc(x, y, outerR, 0, Math.PI * 2); ctx.fill()

  const gi = ctx.createRadialGradient(x, y, 0, x, y, innerR)
  gi.addColorStop(0, '#ffffff')
  gi.addColorStop(0.3, color)
  gi.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalAlpha = 0.88
  ctx.fillStyle = gi
  ctx.beginPath(); ctx.arc(x, y, innerR, 0, Math.PI * 2); ctx.fill()

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = prev
}

// ── Background helpers ────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#010810'
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = 'rgba(0,0,0,0.07)'
  for (let y = 0; y < H; y += 2) {
    ctx.fillRect(0, y, W, 1)
  }
}

// ── Hexagon helper ────────────────────────────────────────────────────────────

function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6
    if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
    else          ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  ctx.closePath()
}

// ── Diamond helper ────────────────────────────────────────────────────────────

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, angleDeg: number) {
  const a = angleDeg * Math.PI / 180
  const cos = Math.cos(a), sin = Math.sin(a)
  ctx.beginPath()
  ctx.moveTo(cx + cos * r,       cy + sin * r)
  ctx.lineTo(cx - sin * r,       cy + cos * r)
  ctx.lineTo(cx - cos * r,       cy - sin * r)
  ctx.lineTo(cx + sin * r,       cy - cos * r)
  ctx.closePath()
}

// ── Scale ruler (system mode) ─────────────────────────────────────────────────

function drawScaleRuler(ctx: CanvasRenderingContext2D, maxAU: number) {
  const ticks = [0.1, 0.5, 1, 2, 5, 10, 20, 50].filter(t => t <= maxAU * 1.05)
  const last4 = ticks.slice(-4)
  ctx.fillStyle = 'rgba(120,190,220,0.85)'
  ctx.font = '7px "Courier New", monospace'
  ctx.textAlign = 'right'
  for (const t of last4) {
    const y = auToY(t, maxAU)
    ctx.fillStyle = 'rgba(60,120,160,0.35)'
    ctx.fillRect(W - 36, y, 34, 0.5)
    ctx.fillStyle = 'rgba(120,190,220,0.65)'
    ctx.fillText(`${t}AU`, W - 2, y - 1)
  }
}

// ── Angle ticks (system/surface X-axis: orbital angle or azimuth, 0-360°) ─────
// Major ticks land on multiples of 90° and are always labelled ("0°"/"90°"/
// "180°"/"270°"); as zoom tightens the visible range, finer unlabelled minor
// ticks (45°/30°/15°) fill in between so the band still reads as a ruler
// rather than going bare between two widely-spaced 90° marks.
const ANGLE_TICK_INTERVALS = [90, 45, 30, 15]

function drawAngleTicks(ctx: CanvasRenderingContext2D) {
  const range = 360 / zoomCurrent
  let interval = 90
  for (const iv of ANGLE_TICK_INTERVALS) {
    if (range / iv >= 3) { interval = iv; break }
  }

  ctx.font = '7px "Courier New", monospace'
  ctx.textAlign = 'center'
  // `deg` here is the COMPASS angle (0° = galactic center in system mode,
  // real local azimuth in surface mode — see angleToX/galacticOffsetDeg).
  // Feeding angleToX(deg + galacticOffsetDeg) converts back to the raw scene
  // angle it expects, so the ticks stay at fixed, evenly-spaced screen
  // positions with correct labels while the actual scene content (which
  // passes raw angles into angleToX directly) shifts relative to them.
  for (let deg = 0; deg < 360; deg += interval) {
    const major = deg % 90 === 0
    for (const off of [-360, 0, 360]) {
      const x = angleToX(deg + off + galacticOffsetDeg)
      if (x < -10 || x > W + 10) continue
      ctx.fillStyle = major ? 'rgba(120,190,220,0.55)' : 'rgba(60,120,160,0.30)'
      ctx.fillRect(x - 0.5, 0, 1, major ? 4 : 2)
      if (major) {
        ctx.fillStyle = 'rgba(120,190,220,0.65)'
        const label = (deg === 0 && galacticOffsetDeg !== 0) ? '0°GC' : `${deg}°`
        ctx.fillText(label, x, 11)
      }
    }
  }
}

// ── System mode drawing ───────────────────────────────────────────────────────

function drawSystem(ctx: CanvasRenderingContext2D, data: NonNullable<DefenderNavData['systemData']>) {
  const { planets, galleries, cameraAngle, cameraRadius, stellarConfig } = data
  const maxAU = Math.max(2, ...planets.map(p => p.radius), ...galleries.map(g => g.radiusAU)) * 1.15

  drawBackground(ctx)

  const range = 360 / zoomCurrent

  // Forbidden zone hatching
  if (
    (stellarConfig.type === 'circumbinary' || stellarConfig.type === 'hierarchical_triple') &&
    stellarConfig.innerBinary
  ) {
    const fzY = auToY(stellarConfig.innerBinary.forbiddenZoneRadius, maxAU)
    const bandH = H - 6 - fzY
    if (bandH > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, fzY, W, bandH)
      ctx.clip()
      ctx.strokeStyle = 'rgba(180,60,30,0.55)'
      ctx.lineWidth = 1
      for (let x = -H; x < W + H; x += 6) {
        ctx.beginPath()
        ctx.moveTo(x, fzY)
        ctx.lineTo(x + bandH, fzY + bandH)
        ctx.stroke()
      }
      ctx.restore()
    }
  }

  // Orbit rings — planets
  for (const p of planets) {
    const y = auToY(p.radius, maxAU)
    ctx.beginPath()
    ctx.setLineDash([4, 6])
    ctx.lineWidth = 0.7
    ctx.strokeStyle = p.orbitType === 'circumbinary'
      ? 'rgba(255,160,30,0.35)'
      : 'rgba(40,80,120,0.35)'
    ctx.moveTo(0, y); ctx.lineTo(W, y)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Orbit rings — galleries
  for (const g of galleries) {
    const y = auToY(g.radiusAU, maxAU)
    ctx.beginPath()
    ctx.setLineDash([2, 5])
    ctx.lineWidth = 0.5
    ctx.strokeStyle = 'rgba(80,40,120,0.2)'
    ctx.moveTo(0, y); ctx.lineTo(W, y)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Stars
  // (was an inlined duplicate of angleToX(0)'s formula — switched to calling
  // it directly so the barycentre picks up the galactic-offset shift too,
  // same as every planet/gallery/camera-cursor position on this strip.)
  const baryX = angleToX(0)

  const drawStarGlow = (x: number, y: number, teff: number | null | undefined, r: number) => {
    drawGlow(ctx, x, y, teffToHex(teff), r * 3, r)
  }

  const sc = stellarConfig
  const starY = H - 6

  if (sc.type === 'single') {
    drawStarGlow(baryX, starY, data.starTeff, 4)
  } else if (sc.type === 'circumstellar' && sc.companion) {
    drawStarGlow(baryX, starY, data.starTeff, 4)
    const compX = angleToX(sc.companion.orbitalAngle)
    const compY = auToY(sc.companion.orbitalRadius, maxAU)
    if (compX >= -20 && compX <= W + 20) {
      drawStarGlow(compX, compY, sc.companion.teff, 3)
    }
  } else if ((sc.type === 'circumbinary' || sc.type === 'contact') && sc.innerBinary) {
    const ib = sc.innerBinary
    const spread = zoomCurrent >= 3 ? 8 : 3
    const a = ib.angle * Math.PI / 180
    const ox = Math.cos(a) * spread
    drawStarGlow(baryX - ox, starY, ib.primaryTeff, 4)
    drawStarGlow(baryX + ox, starY, ib.companionTeff, 3.5)
  } else if (sc.type === 'hierarchical_triple' && sc.innerBinary) {
    const ib = sc.innerBinary
    const spread = zoomCurrent >= 3 ? 8 : 3
    const a = ib.angle * Math.PI / 180
    const ox = Math.cos(a) * spread
    drawStarGlow(baryX - ox, starY, ib.primaryTeff, 4)
    drawStarGlow(baryX + ox, starY, ib.companionTeff, 3.5)
    if (sc.outerCompanion) {
      const ocX = angleToX(sc.outerCompanion.orbitalAngle)
      const ocY = auToY(sc.outerCompanion.orbitalRadius, maxAU)
      if (ocX >= -20 && ocX <= W + 20) {
        drawStarGlow(ocX, ocY, sc.outerCompanion.teff, 3)
      }
    }
  }

  // Planets
  for (const p of planets) {
    const col = eqtToHex(p.eqt, p.radius)
    const drawPlanetAt = (deg: number) => {
      const x = angleToX(deg)
      if (x < -10 || x > W + 10) return
      const y = auToY(p.radius, maxAU)
      const r = p.isCurrent ? 5 : (p.orbitType === 'circumbinary' ? 4 : 3.5)

      if (p.isCurrent) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 14)
        g.addColorStop(0, col + 'aa')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill()
      }

      ctx.fillStyle = col
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()

      if (p.orbitType === 'circumbinary') {
        ctx.strokeStyle = 'rgba(255,160,30,0.6)'
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.arc(x, y, r + 2.5, 0, Math.PI * 2); ctx.stroke()
        if (zoomCurrent >= 2) {
          ctx.fillStyle = 'rgba(255,160,30,0.8)'
          ctx.font = '7px "Courier New", monospace'
          ctx.textAlign = 'center'
          ctx.fillText('⟡', x, y + r + 9)
        }
      }

      if (p.hasSettlement) {
        ctx.strokeStyle = 'rgba(0,200,220,0.9)'
        ctx.lineWidth = 1.2
        drawHexagon(ctx, x, y - r - 7, 4)
        ctx.stroke()
      }

      // L4
      const l4x = angleToX(p.l4angle)
      if (l4x >= 0 && l4x <= W) {
        const l4y = auToY(p.radius, maxAU)
        ctx.fillStyle = 'rgba(60,220,100,0.75)'
        ctx.beginPath()
        ctx.moveTo(l4x, l4y - 6); ctx.lineTo(l4x - 4, l4y); ctx.lineTo(l4x + 4, l4y)
        ctx.closePath(); ctx.fill()
        hitRegions.push({ x: l4x, y: l4y, r: 8, target: { type: 'lagrange', id: `${p.name}-L4`, angle: p.l4angle, radius: p.radius }, tip: { name: `${p.name} L4`, type: 'Lagrange point' } })
      }

      // L5
      const l5x = angleToX(p.l5angle)
      if (l5x >= 0 && l5x <= W) {
        const l5y = auToY(p.radius, maxAU)
        ctx.fillStyle = 'rgba(255,180,30,0.75)'
        ctx.beginPath()
        ctx.moveTo(l5x, l5y + 6); ctx.lineTo(l5x - 4, l5y); ctx.lineTo(l5x + 4, l5y)
        ctx.closePath(); ctx.fill()
        hitRegions.push({ x: l5x, y: l5y, r: 8, target: { type: 'lagrange', id: `${p.name}-L5`, angle: p.l5angle, radius: p.radius }, tip: { name: `${p.name} L5`, type: 'Lagrange point' } })
      }

      const tipName = p.name + (p.isCurrent ? ' (here)' : '')
      hitRegions.push({
        x, y, r: 10,
        target: { type: 'planet', id: p.name, angle: p.angle, radius: p.radius },
        tip: { name: tipName, type: p.orbitType === 'circumbinary' ? 'P-type orbit' : 'Planet', stat: `${p.radius.toFixed(2)} AU` },
      })

      if (p.isCurrent || zoomCurrent >= 3) {
        ctx.fillStyle = p.isCurrent ? '#00e5ff' : 'rgba(120,190,220,0.7)'
        ctx.font = p.isCurrent ? '10px "Courier New", monospace' : '8px "Courier New", monospace'
        ctx.textAlign = 'left'
        ctx.fillText(p.name, x + r + 3, y + 3)
      }
    }

    drawPlanetAt(p.angle)
    // wrap-around
    const range2 = 360 / zoomCurrent
    if (p.angle - range2 < viewOffset + range2) drawPlanetAt(p.angle - 360)
    if (p.angle + 360 - viewOffset < range2 * 2) drawPlanetAt(p.angle + 360)
  }

  // Gallery stations
  for (const g of galleries) {
    const drawGalleryAt = (deg: number) => {
      const x = angleToX(deg)
      if (x < -12 || x > W + 12) return
      const y = auToY(g.radiusAU, maxAU)
      const col = GALLERY_COLORS[g.galleryType]

      const state = g.meetingState
      const rotSpeed = state === 'live' ? 1.4 : state === 'open' ? 0.45 : 0
      const rotDeg = rotSpeed > 0 ? (drawT * rotSpeed * 360) : 0

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotDeg * Math.PI / 180)

      const size = 6
      ctx.beginPath()
      ctx.moveTo(0, -size); ctx.lineTo(size, 0); ctx.lineTo(0, size); ctx.lineTo(-size, 0)
      ctx.closePath()

      if (state === 'locked' || state === 'exclusive') {
        ctx.strokeStyle = col
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.75
        ctx.stroke()
      } else {
        ctx.fillStyle = col
        ctx.globalAlpha = state === 'live' ? 1.0 : state === 'open' ? 0.75 : 0.4
        ctx.fill()
      }
      ctx.restore()

      if (state === 'live') {
        const pulse = 0.5 + Math.sin(drawT * 4) * 0.35
        ctx.globalAlpha = pulse
        ctx.strokeStyle = col
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.stroke()
        ctx.globalAlpha = 1

        ctx.fillStyle = '#ffffff'
        ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#010810'
        ctx.font = '7px "Courier New", monospace'
        ctx.textAlign = 'center'
        ctx.fillText(String(g.presenceCount), x, y - 9)

        ctx.fillStyle = col
        ctx.font = '8px "Courier New", monospace'
        ctx.textAlign = 'left'
        ctx.fillText(g.name, x + 8, y - 1)
      }

      const tipAction = g.accessLevel === 'none' ? 'No access' :
                        state === 'locked'        ? 'Locked'    : 'Enter gallery'
      hitRegions.push({
        x, y, r: 10,
        target: { type: 'gallery', id: g.id, galleryId: g.id, accessLevel: g.accessLevel, meetingState: g.meetingState },
        tip: { name: g.name, type: `${g.galleryType} · ${g.ownershipModel}`, stat: state === 'live' ? `${g.presenceCount} present` : state, action: tipAction },
      })
    }

    drawGalleryAt(g.currentAngleDeg)
    const range2 = 360 / zoomCurrent
    if (g.currentAngleDeg - range2 < viewOffset + range2) drawGalleryAt(g.currentAngleDeg - 360)
    if (g.currentAngleDeg + 360 - viewOffset < range2 * 2) drawGalleryAt(g.currentAngleDeg + 360)
  }

  // Camera cursor
  const camX = angleToX(cameraAngle)
  const camY = auToY(cameraRadius, maxAU)
  const blink = Math.floor(drawT * 2.8) % 2
  ctx.globalAlpha = blink ? 1.0 : 0.35
  ctx.fillStyle = '#00e5ff'
  ctx.beginPath()
  ctx.moveTo(camX, camY + 9); ctx.lineTo(camX - 5, camY); ctx.lineTo(camX + 5, camY)
  ctx.closePath(); ctx.fill()
  ctx.globalAlpha = 1

  hitRegions.push({ x: camX, y: camY, r: 10, target: { type: 'star', id: 'cam' }, tip: { name: 'Camera', stat: `${cameraRadius.toFixed(2)} AU, ${cameraAngle.toFixed(1)}°` } })

  drawScaleRuler(ctx, maxAU)
  drawAngleTicks(ctx)
}

// ── Surface mode drawing ──────────────────────────────────────────────────────

function drawSurface(ctx: CanvasRenderingContext2D, data: NonNullable<DefenderNavData['surfaceData']>) {
  const { cameraAzimuth, cameraFov, skyObjects, galleries } = data

  drawBackground(ctx)

  // Terrain silhouette
  const profile = data.terrainProfile
  ctx.beginPath()
  const step = W / 64
  for (let i = 0; i <= 64; i++) {
    const alt = profile ? profile[Math.min(i, 63)]! : (Math.sin(i * 0.7) * 6 + Math.cos(i * 1.3) * 4)
    const x = i * step
    const y = altToY(alt)
    if (i === 0) ctx.moveTo(x, y)
    else          ctx.lineTo(x, y)
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath()
  ctx.fillStyle = 'rgba(20,40,20,0.3)'
  ctx.fill()

  // Horizon line
  ctx.strokeStyle = 'rgba(40,100,40,0.45)'
  ctx.lineWidth = 0.7
  ctx.beginPath()
  ctx.moveTo(0, altToY(0)); ctx.lineTo(W, altToY(0))
  ctx.stroke()

  // Settlement origin anchor
  ctx.strokeStyle = 'rgba(0,200,220,0.7)'
  ctx.lineWidth = 1.2
  drawHexagon(ctx, azToX(0), altToY(0), 5)
  ctx.stroke()

  // Sky objects
  for (const obj of skyObjects) {
    const x = azToX(obj.azimuth)
    if (x < -15 || x > W + 15) continue
    const y = altToY(obj.altitude)

    switch (obj.type) {
      case 'star':
        drawGlow(ctx, x, y, obj.color, 12, 4)
        break
      case 'companion_tight': {
        drawGlow(ctx, x, y, obj.color, 10, 3.5)
        if (obj.angularSeparation && obj.separationAngle != null) {
          const sepPx = obj.angularSeparation * W / 360
          const sa = obj.separationAngle * Math.PI / 180
          const cx2 = x + Math.cos(sa) * sepPx
          const cy2 = y + Math.sin(sa) * sepPx
          drawGlow(ctx, cx2, cy2, obj.color, 8, 2.5)
        }
        break
      }
      case 'companion_wide':
        drawGlow(ctx, x, y, obj.color, 8, 3)
        break
      case 'outer_companion':
        drawGlow(ctx, x, y, obj.color, 7, 2.5)
        break
      case 'moon': {
        const mg = ctx.createRadialGradient(x, y, 0, x, y, 6)
        mg.addColorStop(0, obj.color)
        mg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalCompositeOperation = 'screen'
        ctx.fillStyle = mg; ctx.globalAlpha = 0.5
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = obj.color
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
        break
      }
      case 'planet':
        ctx.fillStyle = obj.color
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill()
        break
      case 'settlement':
        ctx.strokeStyle = 'rgba(0,200,220,0.8)'
        ctx.lineWidth = 1.2
        drawHexagon(ctx, x, y, 4.5)
        ctx.stroke()
        break
      case 'pyramid':
        ctx.fillStyle = 'rgba(255,180,40,0.85)'
        ctx.beginPath()
        ctx.moveTo(x, y - 5); ctx.lineTo(x - 4, y + 2); ctx.lineTo(x + 4, y + 2)
        ctx.closePath(); ctx.fill()
        break
      case 'blackhole_station': {
        // Event horizon: black core + pulsing purple accretion ring
        ctx.fillStyle = '#000000'
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
        const bhPulse = 0.35 + Math.sin(drawT * 2.2) * 0.35
        ctx.globalAlpha = bhPulse
        ctx.strokeStyle = '#cc55ff'
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke()
        ctx.globalAlpha = 0.18
        ctx.strokeStyle = '#ff88ff'
        ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke()
        ctx.globalAlpha = 1
        break
      }
      case 'gallery': {
        const gEntry = galleries.find(g => g.id === obj.galleryId)
        const col = gEntry ? GALLERY_COLORS[gEntry.galleryType] : 'rgba(140,200,255,0.9)'
        const rotDeg = gEntry?.meetingState === 'live'
          ? drawT * 1.4 * 360
          : gEntry?.meetingState === 'open' ? drawT * 0.45 * 360 : 0
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rotDeg * Math.PI / 180)
        drawDiamond(ctx, 0, 0, 4, 0)
        ctx.fillStyle = col
        ctx.fill()
        ctx.restore()
        if (gEntry?.meetingState === 'live') {
          const pulse = 0.4 + Math.sin(drawT * 4) * 0.35
          ctx.globalAlpha = pulse
          ctx.strokeStyle = col
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke()
          ctx.globalAlpha = 1
        }
        if (gEntry) {
          hitRegions.push({
            x, y, r: 9,
            target: { type: 'gallery', id: gEntry.id, galleryId: gEntry.id, azimuth: obj.azimuth, accessLevel: gEntry.accessLevel, meetingState: gEntry.meetingState },
            tip: { name: gEntry.name, type: gEntry.galleryType, stat: gEntry.meetingState, action: gEntry.accessLevel === 'none' ? 'No access' : 'Enter gallery' },
          })
        }
        break
      }
    }

    if (obj.type !== 'gallery') {
      const ttype =
        obj.type === 'planet'    ? 'planet' :
        obj.type === 'moon'      ? 'moon'   :
        obj.type === 'blackhole_station' ? 'blackhole_station' :
        (obj.type === 'star' || obj.type === 'companion_tight' || obj.type === 'companion_wide' || obj.type === 'outer_companion') ? 'companion' :
        'azimuth'
      const tipAction =
        obj.type === 'planet' || obj.type === 'moon' ? 'Click to transit surface' :
        obj.type === 'blackhole_station' ? 'Click to enter station' : undefined
      hitRegions.push({
        x, y, r: obj.type === 'blackhole_station' ? 14 : 10,
        target: { type: ttype, id: obj.name, azimuth: obj.azimuth },
        tip: { name: obj.name, type: obj.type, stat: `Az ${obj.azimuth.toFixed(1)}° Alt ${obj.altitude.toFixed(1)}°`, action: tipAction },
      })
    }
  }

  // Camera look-direction cursor
  const camX = azToX(cameraAzimuth)
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(camX, 0); ctx.lineTo(camX, H); ctx.stroke()

  // FOV bracket
  const halfFov = cameraFov / 2
  const lx = azToX(cameraAzimuth - halfFov)
  const rx = azToX(cameraAzimuth + halfFov)
  const hy = altToY(0)
  ctx.strokeStyle = 'rgba(0,229,255,0.55)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(lx, hy - 8); ctx.lineTo(lx, hy); ctx.lineTo(lx + 8, hy)
  ctx.moveTo(rx, hy - 8); ctx.lineTo(rx, hy); ctx.lineTo(rx - 8, hy)
  ctx.stroke()

  drawAngleTicks(ctx)
}

// ── Cosmic mode drawing ───────────────────────────────────────────────────────

function drawCosmic(ctx: CanvasRenderingContext2D, data: NonNullable<DefenderNavData['cosmicData']>) {
  const { cameraX, cameraZ, clusters, conduits } = data

  drawBackground(ctx)

  if (!clusters.length && !conduits.length) return

  const allX = clusters.map(c => c.x).concat(conduits.map(c => c.x))
  const allZ = clusters.map(c => c.z).concat(conduits.map(c => c.z))
  const minX = Math.min(...allX), maxX = Math.max(...allX)
  const minZ = Math.min(...allZ), maxZ = Math.max(...allZ)
  const worldRangeX = (maxX - minX) || 1
  const worldRangeZ = (maxZ - minZ) || 1

  // Apply auto-follow for cosmic mode
  viewOffsetX = minX
  viewOffsetZ = minZ

  // Clusters
  const displayed = clusters.slice(0, 300)
  for (const c of displayed) {
    const x = cosmicToX(c.x, worldRangeX)
    const z = cosmicToZ(c.z, worldRangeZ)
    if (x < -10 || x > W + 10 || z < -5 || z > H + 5) continue

    const r = 2 + (c.richness / 10) * 4
    ctx.fillStyle = c.color
    ctx.beginPath(); ctx.arc(x, z, r, 0, Math.PI * 2); ctx.fill()

    if (c.hasEvent) {
      const pulse = 0.4 + Math.sin(drawT * 3.5) * 0.35
      ctx.globalAlpha = pulse
      ctx.strokeStyle = c.color
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(x, z, r + 5, 0, Math.PI * 2); ctx.stroke()
      ctx.globalAlpha = 1
    }

    hitRegions.push({
      x, y: z, r: r + 6,
      target: { type: 'cluster', id: c.name },
      tip: { name: c.name, type: 'Cluster', stat: `richness ${c.richness.toFixed(1)}${c.hasEvent ? ' · event' : ''}` },
    })
  }

  // Conduits
  for (const cd of conduits) {
    const x = cosmicToX(cd.x, worldRangeX)
    const z = cosmicToZ(cd.z, worldRangeZ)
    if (x < -10 || x > W + 10 || z < -5 || z > H + 5) continue

    const opacity = cd.isPulsing ? 0.4 + Math.sin(drawT * 2.4) * 0.35 : 0.55
    ctx.globalAlpha = opacity
    ctx.fillStyle = '#00e5ff'
    drawDiamond(ctx, x, z, 4, 45)
    ctx.fill()
    ctx.globalAlpha = 1

    hitRegions.push({
      x, y: z, r: 8,
      target: { type: 'cluster', id: cd.name },
      tip: { name: cd.name, type: 'Conduit', stat: cd.isPulsing ? 'pulsing' : 'stable' },
    })
  }

  // Camera cursor blinking ◇
  const cx = cosmicToX(cameraX, worldRangeX)
  const cz = cosmicToZ(cameraZ, worldRangeZ)
  const blink = Math.floor(drawT * 2.8) % 2
  ctx.globalAlpha = blink ? 1.0 : 0.35
  ctx.strokeStyle = '#00e5ff'
  ctx.lineWidth = 1.5
  drawDiamond(ctx, cx, cz, 5, 45)
  ctx.stroke()
  ctx.globalAlpha = 1
}

// ── Main redraw ───────────────────────────────────────────────────────────────

function redraw(data: DefenderNavData): void {
  const cv = navCanvas.value
  if (!cv || collapsed.value) return

  const ctx = cv.getContext('2d')
  if (!ctx) return

  drawT = performance.now() / 1000
  const dt = lastFrameT > 0 ? Math.min(0.1, Math.max(0, drawT - lastFrameT)) : 0
  lastFrameT = drawT

  // Zoom smooth follow
  zoomCurrent += (zoomTarget.value - zoomCurrent) * 0.18
  if (zoomCurrent < 0.5) zoomCurrent = 0.5
  if (zoomCurrent > 8)   zoomCurrent = 8

  // Drag-release momentum + slosh settle (skipped while actively dragging —
  // onMouseMove tracks viewOffset 1:1 during that phase)
  if (!isDragging && momentumActive) {
    if (dt > 0) {
      viewOffset   = (viewOffset + panVelocity * dt + 3600) % 360
      panVelocity *= Math.exp(-PAN_FRICTION * dt)
    }
    if (Math.abs(panVelocity) < SLOSH_ENTRY_VELOCITY) {
      // Hand off remaining velocity to a light underdamped spring for the
      // final "weighted give" wobble instead of just stopping dead.
      momentumActive = false
      sloshActive    = true
      settlePoint    = viewOffset
      sloshOffset    = 0
      sloshVelocity  = panVelocity
      panVelocity    = 0
    }
  } else if (!isDragging && sloshActive) {
    if (dt > 0) {
      const accel   = -SLOSH_STIFFNESS * sloshOffset - SLOSH_DAMPING * sloshVelocity
      sloshVelocity += accel * dt
      sloshOffset   += sloshVelocity * dt
      viewOffset     = (settlePoint + sloshOffset + 3600) % 360
    }
    if (Math.abs(sloshOffset) < SLOSH_SETTLE_EPS_POS && Math.abs(sloshVelocity) < SLOSH_SETTLE_EPS_VEL) {
      sloshActive = false
      autoFollowSuppressed = false
    }
  }

  // Auto-follow
  if (!autoFollowSuppressed) {
    const visRange = 360 / zoomCurrent
    if (props.mode === 'system' && data.systemData) {
      targetOffset = ((data.systemData.cameraAngle - visRange / 2) + 3600) % 360
      viewOffset += (targetOffset - viewOffset) * 0.12
    } else if (props.mode === 'surface' && data.surfaceData) {
      targetOffset = ((data.surfaceData.cameraAzimuth - visRange / 2) + 3600) % 360
      viewOffset += (targetOffset - viewOffset) * 0.12
    }
  }

  // Rebuild hit regions each frame
  hitRegions = []

  // Store system ref for use in onClick (planet surface transit routing)
  lastCurrentSystemRef = data.currentSystemRef

  // Re-anchor the strip to a real compass in system mode only — see
  // galacticLongitudeDeg() above for what this is and isn't claiming.
  galacticOffsetDeg = (props.mode === 'system' && data.currentSystemRef)
    ? galacticLongitudeDeg(data.currentSystemRef.ra, data.currentSystemRef.dec)
    : 0

  ctx.save()
  ctx.scale(DPR, DPR)

  // ── Meta view tabs take priority over strip ───────────────────────────────
  if (metaTab.value === 1) { drawMetaOrrery(ctx, data); ctx.restore(); return }
  if (metaTab.value === 2) { drawMetaGalaxy(ctx, data); ctx.restore(); return }

  if (props.mode === 'system' && data.systemData) {
    drawSystem(ctx, data.systemData)
  } else if (props.mode === 'surface' && data.surfaceData) {
    drawSurface(ctx, data.surfaceData)
  } else if (props.mode === 'cosmic' && data.cosmicData) {
    drawCosmic(ctx, data.cosmicData)
  } else {
    drawBackground(ctx)
    ctx.fillStyle = 'rgba(80,130,170,0.55)'
    ctx.font = '10px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('No data', W / 2, H / 2 + 4)
  }

  // Earth↔System context inset — shown in system and surface modes
  if (data.currentSystemRef && (props.mode === 'system' || props.mode === 'surface')) {
    drawContextInset(ctx, data.currentSystemRef)
  }

  // ── Strip zoom-into-dot animation (spec §6) ───────────────────────────────
  if (zoomPortalAnim) {
    const elapsed = drawT - zoomPortalAnim.startT

    if (elapsed < 0.28) {
      // Phase 1: zoom in over 0.28s (ease-in-out)
      const t    = elapsed / 0.28
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      zoomTarget.value = 1 + (8 - 1) * ease
      // Keep the clicked dot centered
      const zoom     = zoomTarget.value
      const centered = ((zoomPortalAnim.angle - 180 / zoom) + 3600) % 360
      viewOffset     = viewOffset + (centered - viewOffset) * 0.35
    } else if (elapsed < 0.38) {
      // Phase 2: dim to black over 0.10s
      zoomTarget.value = 8
      const dimAlpha = (elapsed - 0.28) / 0.10
      ctx.fillStyle = `rgba(0,0,0,${dimAlpha.toFixed(3)})`
      ctx.fillRect(0, 0, W, H)
    } else {
      // Phase 3: fire portal, reset zoom
      const dest = zoomPortalAnim.dest
      zoomPortalAnim   = null
      zoomTarget.value = 1
      autoFollowSuppressed = false
      emit('portalTo', dest)
    }
  }

  ctx.restore()
}

// ── Meta tab: +1 — top-down star system orrery ────────────────────────────────
// Full-canvas 2D overhead view of orbits + planets. Used when metaTab === 1.

function drawMetaOrrery(ctx: CanvasRenderingContext2D, data: DefenderNavData) {
  drawBackground(ctx)

  ctx.fillStyle = 'rgba(0, 180, 220, 0.55)'
  ctx.font = '5.5px "Courier New", monospace'
  ctx.letterSpacing = '0.10em'
  ctx.textAlign = 'center'
  ctx.fillText(meta1Label.value.toUpperCase(), W / 2, 9)
  ctx.letterSpacing = '0'

  const cx = W / 2, cy = H / 2

  if (data.systemData) {
    const { starTeff, planets, cameraAngle, cameraRadius } = data.systemData
    const maxOrbit = planets.reduce((m, p) => Math.max(m, p.radius), 1)
    const maxR     = Math.min(W, H) * 0.42
    const scale    = maxR / (maxOrbit || 1)

    // Orbit rings
    for (const p of planets) {
      const r = Math.min(p.radius * scale, maxR)
      ctx.strokeStyle = p.isCurrent ? 'rgba(0,220,255,0.28)' : 'rgba(60,100,140,0.18)'
      ctx.lineWidth   = p.isCurrent ? 0.9 : 0.5
      ctx.setLineDash(p.isCurrent ? [] : [2, 4])
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([])
    }

    // Star glow
    const sc = teffToHex(starTeff)
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 11)
    sg.addColorStop(0, sc + 'aa'); sg.addColorStop(1, sc + '00')
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = sc; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill()

    // Planets
    for (const p of planets) {
      const r   = Math.min(p.radius * scale, maxR)
      const ang = ((p.angle - 90) * Math.PI) / 180
      const px  = cx + Math.cos(ang) * r
      const py  = cy + Math.sin(ang) * r
      const col = p.eqt
        ? p.eqt > 800 ? '#ff6644' : p.eqt > 200 ? '#44ddaa' : '#8899ff'
        : '#aabbcc'
      ctx.fillStyle = p.isCurrent ? '#00e5ff' : col
      const pr = p.isCurrent ? 3.8 : 2.2
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill()
      if (p.isCurrent) {
        ctx.strokeStyle = 'rgba(0,220,255,0.55)'; ctx.lineWidth = 0.9
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = 'rgba(0,200,240,0.60)'
        ctx.font = '5px "Courier New", monospace'
        ctx.textAlign = 'left'
        ctx.fillText(p.name, px + 6, py + 2)
      }
    }

    // Camera position dot
    const camAng = ((cameraAngle - 90) * Math.PI) / 180
    const camR   = Math.min(cameraRadius * scale, maxR * 0.9)
    const camX   = cx + Math.cos(camAng) * camR
    const camY   = cy + Math.sin(camAng) * camR
    ctx.fillStyle = 'rgba(255,255,200,0.70)'
    ctx.beginPath(); ctx.arc(camX, camY, 2, 0, Math.PI * 2); ctx.fill()

  } else if (data.currentSystemRef) {
    ctx.fillStyle = 'rgba(80,130,170,0.55)'
    ctx.font = '8px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(data.currentSystemRef.hostname, cx, cy + 3)
    ctx.font = '6px "Courier New", monospace'
    ctx.fillStyle = 'rgba(60,100,140,0.45)'
    ctx.fillText('system data loading…', cx, cy + 13)
  }
}

// ── Meta tab: +2 — galactic position context ──────────────────────────────────
// Full-canvas dot map: Sol at centre, current system direction & log-distance.
// In cosmic mode: cluster scatter-plot instead.

function drawMetaGalaxy(ctx: CanvasRenderingContext2D, data: DefenderNavData) {
  drawBackground(ctx)

  ctx.fillStyle = 'rgba(0, 180, 220, 0.55)'
  ctx.font = '5.5px "Courier New", monospace'
  ctx.letterSpacing = '0.10em'
  ctx.textAlign = 'center'
  ctx.fillText(meta2Label.value.toUpperCase(), W / 2, 9)
  ctx.letterSpacing = '0'

  const cx = W / 2, cy = H / 2

  // Galactic disc — faint ellipse gradient
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(1, 0.28)
  const gal = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(W, H) * 0.44)
  gal.addColorStop(0,   'rgba(180,160,255,0.16)')
  gal.addColorStop(0.5, 'rgba(80,100,200,0.07)')
  gal.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = gal; ctx.beginPath(); ctx.arc(0, 0, Math.min(W, H) * 0.44, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  if (data.currentSystemRef) {
    const ref    = data.currentSystemRef
    const raRad  = (ref.ra  * Math.PI) / 180
    const decRad = (ref.dec * Math.PI) / 180
    const dx     = Math.cos(decRad) * Math.cos(raRad)
    const dy     = Math.cos(decRad) * Math.sin(raRad)
    const norm   = Math.sqrt(dx * dx + dy * dy) || 1
    const maxR   = Math.min(W, H) * 0.40
    const logR   = Math.log10(Math.max(1, ref.distPc)) / Math.log10(8000) * maxR
    const sysX   = cx + (dx / norm) * logR
    const sysY   = cy - (dy / norm) * logR  // screen Y inverted vs astronomical dec

    // Sol dot
    ctx.fillStyle = '#ffd480'
    ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,212,128,0.55)'
    ctx.font = '6px "Courier New", monospace'; ctx.textAlign = 'left'
    ctx.fillText('Sol', cx + 4, cy + 2)

    // Connection line
    ctx.strokeStyle = 'rgba(0,180,220,0.38)'; ctx.lineWidth = 0.7
    ctx.setLineDash([3, 4])
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sysX, sysY); ctx.stroke()
    ctx.setLineDash([])

    // System dot
    const sg2 = ctx.createRadialGradient(sysX, sysY, 0, sysX, sysY, 7)
    sg2.addColorStop(0, 'rgba(0,200,255,0.48)'); sg2.addColorStop(1, 'rgba(0,200,255,0)')
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = sg2; ctx.beginPath(); ctx.arc(sysX, sysY, 7, 0, Math.PI * 2); ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#00e5ff'; ctx.beginPath(); ctx.arc(sysX, sysY, 2.2, 0, Math.PI * 2); ctx.fill()

    // Label
    const midX = (cx + sysX) / 2, midY = (cy + sysY) / 2
    const distStr = ref.distPc >= 1000 ? `${(ref.distPc / 1000).toFixed(1)}kpc` : `${Math.round(ref.distPc)}pc`
    ctx.fillStyle = 'rgba(0,200,240,0.60)'; ctx.font = '5.5px "Courier New", monospace'; ctx.textAlign = 'center'
    ctx.fillText(ref.hostname, midX, midY - 3)
    ctx.fillStyle = 'rgba(0,180,200,0.45)'
    ctx.fillText(distStr, midX, midY + 5)

  } else if (data.cosmicData) {
    // Cosmic mode: cluster scatter
    const { clusters } = data.cosmicData
    const scale = Math.min(W, H) / 60
    for (const c of clusters) {
      const px = cx + c.x * scale
      const py = cy + c.z * scale
      if (px < 2 || px > W - 2 || py < 2 || py > H - 2) continue
      ctx.globalAlpha = 0.4 + c.richness * 0.06
      ctx.fillStyle = c.color
      ctx.beginPath(); ctx.arc(px, py, 1.2 + c.richness * 0.25, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    // Camera position cross
    const { cameraX, cameraZ } = data.cosmicData
    const kx = cx + cameraX * scale, ky = cy + cameraZ * scale
    ctx.strokeStyle = 'rgba(255,255,200,0.60)'; ctx.lineWidth = 0.8
    const cs = 4
    ctx.beginPath(); ctx.moveTo(kx - cs, ky); ctx.lineTo(kx + cs, ky); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(kx, ky - cs); ctx.lineTo(kx, ky + cs); ctx.stroke()
  }
}

// ── Earth↔System context inset ────────────────────────────────────────────────
// Drawn in the bottom-right corner of the canvas. Shows Sol (amber) and the
// current star system (cyan) with a connecting line and distance label.
// Click → emits contextZoom; acts as a spatial "where am I in the galaxy?" cue.

function drawContextInset(
  ctx: CanvasRenderingContext2D,
  ref: NonNullable<DefenderNavData['currentSystemRef']>,
) {
  const BW = 66, BH = 50         // box dimensions in logical (CSS) pixels
  const bx = W - BW - 5          // right-aligned with 5px padding
  const by = H - BH - 3          // bottom-aligned with 3px padding

  ctx.save()

  // ── Background box ─────────────────────────────────────────────────────────
  ctx.fillStyle   = 'rgba(0, 4, 18, 0.90)'
  ctx.strokeStyle = 'rgba(0, 180, 220, 0.32)'
  ctx.lineWidth   = 0.7
  ctx.beginPath()
  ctx.roundRect?.(bx, by, BW, BH, 3) ?? (() => {
    ctx.rect(bx, by, BW, BH)  // fallback for older engines
  })()
  ctx.fill()
  ctx.stroke()

  // Header label
  ctx.fillStyle = 'rgba(0, 160, 200, 0.55)'
  ctx.font = '5px "Courier New", monospace'
  ctx.textAlign = 'left'
  ctx.letterSpacing = '0.08em'
  ctx.fillText('EARTH ↔ SYSTEM', bx + 3, by + 7)
  ctx.letterSpacing = '0'

  // ── Sol dot — amber, fixed at lower-left of inset ─────────────────────────
  const solX = bx + 12, solY = by + BH - 12

  // Sol glow
  const sg = ctx.createRadialGradient(solX, solY, 0, solX, solY, 8)
  sg.addColorStop(0, 'rgba(255, 212, 128, 0.55)')
  sg.addColorStop(1, 'rgba(255, 212, 128, 0)')
  ctx.globalCompositeOperation = 'screen'
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(solX, solY, 8, 0, Math.PI * 2); ctx.fill()
  ctx.globalCompositeOperation = 'source-over'

  // Sol core
  ctx.fillStyle = '#ffd480'
  ctx.beginPath(); ctx.arc(solX, solY, 2.2, 0, Math.PI * 2); ctx.fill()

  // Sol label
  ctx.fillStyle = 'rgba(255, 212, 128, 0.70)'
  ctx.font = '6px "Courier New", monospace'
  ctx.textAlign = 'left'
  ctx.fillText('Sol', solX + 4, solY + 2)

  // ── Current system dot — cyan, direction from RA/Dec ──────────────────────
  // Map RA (0→360°) and Dec (−90→+90°) to a 2D direction within the inset.
  // This is a simplified equatorial→inset projection — enough to show direction.
  const raRad   = (ref.ra  * Math.PI) / 180
  const decRad  = (ref.dec * Math.PI) / 180
  const dx      = Math.cos(decRad) * Math.cos(raRad)    // ~ galactic east
  const dy      = Math.cos(decRad) * Math.sin(raRad)    // ~ galactic north
  // Scale to fit inside the usable inset area (radius ~18px from Sol)
  const maxR    = 20
  const rawLen  = Math.sqrt(dx * dx + dy * dy)
  const norm    = rawLen > 0 ? 1 / rawLen : 1
  const sysX    = Math.max(bx + 5, Math.min(bx + BW - 5, solX + dx * norm * maxR))
  const sysY    = Math.max(by + 10, Math.min(by + BH - 5, solY - dy * norm * maxR))

  // Dashed line Sol → system
  ctx.setLineDash([2, 3])
  ctx.strokeStyle = 'rgba(0, 180, 220, 0.42)'
  ctx.lineWidth   = 0.7
  ctx.beginPath()
  ctx.moveTo(solX, solY)
  ctx.lineTo(sysX, sysY)
  ctx.stroke()
  ctx.setLineDash([])

  // System glow
  const sysg = ctx.createRadialGradient(sysX, sysY, 0, sysX, sysY, 7)
  sysg.addColorStop(0, 'rgba(0, 200, 255, 0.50)')
  sysg.addColorStop(1, 'rgba(0, 200, 255, 0)')
  ctx.globalCompositeOperation = 'screen'
  ctx.fillStyle = sysg; ctx.beginPath(); ctx.arc(sysX, sysY, 7, 0, Math.PI * 2); ctx.fill()
  ctx.globalCompositeOperation = 'source-over'

  // System core
  ctx.fillStyle = '#00e5ff'
  ctx.beginPath(); ctx.arc(sysX, sysY, 2.0, 0, Math.PI * 2); ctx.fill()

  // ── Distance label ────────────────────────────────────────────────────────
  const distLabel = ref.distPc >= 1000
    ? `${(ref.distPc / 1000).toFixed(1)} kpc`
    : `${Math.round(ref.distPc)} pc`
  ctx.fillStyle = 'rgba(0, 200, 240, 0.60)'
  ctx.font = '6px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.fillText(distLabel, bx + BW / 2, by + BH - 2)

  // ── Blinking zoom-out hint (slow pulse) ──────────────────────────────────
  const hint = Math.sin(drawT * 1.5) > 0.3
  if (hint) {
    ctx.fillStyle = 'rgba(0, 180, 220, 0.38)'
    ctx.font = '5px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('click to zoom out', bx + BW / 2, by + BH - 10)
  }

  ctx.restore()

  // ── Hit region ────────────────────────────────────────────────────────────
  hitRegions.push({
    x: bx + BW / 2, y: by + BH / 2, r: BW / 2,
    target: { type: 'star', id: 'context_zoom' },   // reuse 'star' type; onClick checks id
    tip: {
      name:   `Earth ↔ ${ref.hostname}`,
      type:   'Context view',
      stat:   `${distLabel} from Sol`,
      action: 'Click to zoom out — see both in galaxy',
    },
  })
}

defineExpose({ redraw })

// ── Zoom / pan interactions ───────────────────────────────────────────────────

function onWheel(e: WheelEvent) {
  const next = zoomTarget.value * (1 - e.deltaY * 0.001)
  zoomTarget.value = Math.min(8, Math.max(0.5, next))
}

function onMouseDown(e: MouseEvent) {
  isDragging    = true
  dragStartX    = e.clientX
  dragStartOffset = viewOffset

  // A fresh grab always wins over any in-flight coast/wobble.
  momentumActive = false
  sloshActive    = false
  velocityEMA    = 0
  lastMoveT      = performance.now() / 1000
}

function onMouseMove(e: MouseEvent) {
  if (isDragging) {
    const dx = e.clientX - dragStartX
    const range = 360 / zoomCurrent
    const newOffset = ((dragStartOffset - dx / W * range) + 3600) % 360

    // Sample instantaneous angular velocity between move events and fold it
    // into an EMA — smooths pointer jitter while still tracking a deliberate
    // flick closely enough to feel responsive at release.
    const now = performance.now() / 1000
    const dtMove = now - lastMoveT
    // Upper bound protects against using a stale pre-pause sample; it must
    // stay generous because DefenderNav sits on top of pages doing continuous
    // WebGL rendering, and mousemove delivery gets bursty under that main-
    // thread load — gaps well past 200ms are routine, not exceptional
    // (measured 185ms+ for nominal ~20ms waits under load), and a tight gate
    // here was silently dropping most/all velocity samples, leaving
    // velocityEMA near 0 by release and momentum never triggering.
    if (dtMove > 0.001 && dtMove < 1.0) {
      let delta = newOffset - viewOffset
      if (delta > 180) delta -= 360
      else if (delta < -180) delta += 360
      const instVel = delta / dtMove
      velocityEMA += (instVel - velocityEMA) * 0.5
    }
    lastMoveT = now

    viewOffset = newOffset
    return
  }

  // Tooltip hit testing
  const rect = navCanvas.value!.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  let nearest: HitRegion | null = null
  let nearestDist = Infinity
  for (const hr of hitRegions) {
    const dist = Math.hypot(mx - hr.x, my - hr.y)
    if (dist < hr.r && dist < nearestDist) {
      nearest = hr
      nearestDist = dist
    }
  }

  if (nearest) {
    Object.assign(tooltip, nearest.tip, { visible: true, x: Math.min(mx, W - 140) })
  } else {
    tooltip.visible = false
  }
}

// Shared release path for both a clean mouseup and a drag that exits the
// canvas bounds — either way the drag is over and should hand off the same
// way: a real flick keeps coasting under momentum, anything smaller just
// falls back to the plain suppress-then-resume-autofollow timer.
function endDrag() {
  isDragging = false

  if (Math.abs(velocityEMA) >= MIN_FLICK_VELOCITY) {
    panVelocity    = Math.max(-MAX_PAN_VELOCITY, Math.min(MAX_PAN_VELOCITY, velocityEMA))
    momentumActive = true
    sloshActive    = false
    autoFollowSuppressed = true
    clearTimeout(suppressTimer)
    // No fixed timer here — auto-follow resumes once the momentum/slosh
    // phases finish settling (see redraw()), not on a clock that might cut
    // off mid-coast.
  } else {
    autoFollowSuppressed = true
    clearTimeout(suppressTimer)
    suppressTimer = window.setTimeout(() => { autoFollowSuppressed = false }, 3000)
  }
}

function onMouseUp() {
  if (isDragging) endDrag()
}

function onMouseLeave() {
  if (isDragging) endDrag()
  tooltip.visible = false
}

function fireZoomPortal(angle: number, dest: { label: string; route: string }) {
  autoFollowSuppressed = true
  clearTimeout(suppressTimer)
  momentumActive = false
  sloshActive    = false
  zoomPortalAnim = { startT: drawT, angle, dest }
}

function onClick(e: MouseEvent) {
  const rect = navCanvas.value!.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  let nearest: HitRegion | null = null
  let nearestDist = Infinity
  for (const hr of hitRegions) {
    const dist = Math.hypot(mx - hr.x, my - hr.y)
    if (dist < hr.r && dist < nearestDist) {
      nearest = hr
      nearestDist = dist
    }
  }

  if (!nearest) return
  const tgt = nearest.target

  // Context inset click — emit contextZoom instead of normal flyTo
  if (tgt.type === 'star' && tgt.id === 'context_zoom') {
    emit('contextZoom')
    return
  }

  if (tgt.type === 'gallery') {
    if (tgt.accessLevel === 'none') {
      Object.assign(tooltip, { visible: true, x: Math.min(mx, W - 160), name: nearest.tip.name, type: nearest.tip.type, stat: nearest.tip.stat, warning: 'No access — acquire on pon.ink', action: undefined })
      return
    }
    if (tgt.meetingState === 'locked') {
      Object.assign(tooltip, { visible: true, x: Math.min(mx, W - 160), name: nearest.tip.name, type: nearest.tip.type, stat: nearest.tip.stat, warning: 'Gallery is locked', action: undefined })
      return
    }
    const hn = tgt.hostname ?? 'unknown'
    fireZoomPortal(tgt.azimuth ?? 180, { label: nearest.tip.name, route: `/gallery/${hn}/${tgt.galleryId}` })
  } else if (
    (tgt.type === 'planet' || tgt.type === 'moon') &&
    props.mode === 'surface' &&
    lastCurrentSystemRef
  ) {
    // Transit to sibling planet or moon surface — strip zoom then portal
    const host  = lastCurrentSystemRef.hostname
    const route = `/surface/${encodeURIComponent(host)}/${encodeURIComponent(tgt.id)}`
    fireZoomPortal(tgt.azimuth ?? 180, { label: tgt.id, route })
  } else {
    emit('flyTo', tgt)
  }
}

// ── Canvas setup & resize ─────────────────────────────────────────────────────

function setupCanvas() {
  const cv = navCanvas.value
  if (!cv) return
  DPR = window.devicePixelRatio || 1
  W   = window.innerWidth
  H   = 60
  cv.width  = W * DPR
  cv.height = H * DPR
  cv.style.width  = W + 'px'
  cv.style.height = H + 'px'
}

function onResize() {
  W = window.innerWidth
  const cv = navCanvas.value
  if (!cv) return
  cv.width        = W * DPR
  cv.style.width  = W + 'px'
}

onMounted(() => {
  setupCanvas()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  clearTimeout(suppressTimer)
})
</script>

<style scoped>
.defender-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 8;
  font-family: monospace;
}

.defender-header {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background: #010810;
  border-top: 1px solid rgba(0, 180, 220, 0.18);
  font-size: 9px;
  color: rgba(0, 200, 240, 0.7);
  letter-spacing: 0.07em;
}

.dn-breadcrumb {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.dn-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.dn-zoom-label {
  font-size: 8px;
  color: rgba(0, 180, 220, 0.6);
  min-width: 28px;
  text-align: right;
}

.dn-collapse-btn {
  background: none;
  border: none;
  color: rgba(0, 200, 240, 0.6);
  cursor: pointer;
  font-size: 9px;
  padding: 0 2px;
  line-height: 1;
}

.dn-collapse-btn:hover {
  color: #00e5ff;
}

/* ── View mode pills ──────────────────────────────────────────────── */

.dn-view-pills {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.dn-pill {
  background: rgba(0, 80, 120, 0.18);
  border: 1px solid rgba(0, 160, 200, 0.22);
  color: rgba(0, 170, 210, 0.52);
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.07em;
  padding: 1px 5px;
  cursor: pointer;
  border-radius: 2px;
  line-height: 1.4;
  transition: all 0.1s;
}

.dn-pill--active {
  background: rgba(0, 180, 220, 0.20);
  border-color: rgba(0, 220, 255, 0.52);
  color: #00e5ff;
}

.dn-pill:hover:not(.dn-pill--active) {
  color: rgba(0, 220, 255, 0.75);
  border-color: rgba(0, 200, 240, 0.36);
}

/* ── Separator ────────────────────────────────────────────────────── */

.dn-sep {
  color: rgba(0, 90, 120, 0.38);
  font-size: 11px;
  padding: 0 4px;
  flex-shrink: 0;
  line-height: 1;
}

/* ── Return to previous view button ──────────────────────────────── */

.dn-return-btn {
  background: rgba(0, 50, 90, 0.30);
  border: 1px solid rgba(0, 180, 220, 0.38);
  color: rgba(0, 210, 255, 0.78);
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  cursor: pointer;
  border-radius: 2px;
  flex-shrink: 0;
  transition: all 0.12s;
}
.dn-return-btn:hover {
  background: rgba(0, 100, 160, 0.30);
  color: #00e5ff;
  border-color: rgba(0, 220, 255, 0.55);
}

/* ── Ascend realm button ──────────────────────────────────────────── */

.dn-ascend-btn {
  background: rgba(0, 60, 80, 0.40);
  border: 1px solid rgba(0, 200, 160, 0.55);
  color: rgba(0, 220, 160, 0.88);
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.09em;
  padding: 2px 8px;
  cursor: pointer;
  border-radius: 2px;
  flex-shrink: 0;
  transition: all 0.12s;
  font-weight: bold;
}
.dn-ascend-btn:hover {
  background: rgba(0, 100, 100, 0.40);
  color: #00ffcc;
  border-color: rgba(0, 240, 180, 0.75);
  box-shadow: 0 0 6px rgba(0, 220, 160, 0.25);
}

/* ── Event finder button ──────────────────────────────────────────── */

.dn-finder-btn {
  background: none;
  border: 1px solid rgba(0, 180, 220, 0.20);
  color: rgba(0, 180, 220, 0.52);
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.08em;
  padding: 1px 6px;
  cursor: pointer;
  border-radius: 2px;
  flex-shrink: 0;
  line-height: 1.4;
  transition: all 0.1s;
}

.dn-finder-btn--active,
.dn-finder-btn:hover {
  color: #00e5ff;
  border-color: rgba(0, 229, 255, 0.48);
  background: rgba(0, 229, 255, 0.06);
}

/* ── Meta view tab strip ──────────────────────────────────────────── */

.dn-meta-tabs {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.dn-mtab {
  background: none;
  border: 1px solid rgba(0, 140, 180, 0.18);
  color: rgba(0, 160, 200, 0.45);
  font-family: 'Courier New', monospace;
  font-size: 6.5px;
  letter-spacing: 0.08em;
  padding: 1px 5px;
  cursor: pointer;
  border-radius: 2px;
  line-height: 1.4;
  transition: all 0.12s;
  flex-shrink: 0;
}

.dn-mtab:hover {
  color: #00e5ff;
  border-color: rgba(0, 229, 255, 0.40);
  background: rgba(0, 229, 255, 0.05);
}

.dn-mtab--active {
  color: #00e5ff;
  border-color: rgba(0, 229, 255, 0.55);
  background: rgba(0, 180, 255, 0.10);
}

.dn-canvas {
  display: block;
  width: 100%;
  height: 60px;
  cursor: crosshair;
}

.is-collapsed .dn-canvas {
  display: none;
}

.dn-tooltip {
  position: fixed;
  bottom: 84px;
  background: rgba(1, 8, 16, 0.95);
  border: 1px solid rgba(0, 180, 220, 0.25);
  border-radius: 4px;
  padding: 5px 9px;
  pointer-events: none;
  font-size: 9px;
  color: #b0c8e8;
  white-space: nowrap;
  z-index: 9;
  font-family: 'Courier New', monospace;
}

.dn-tip-name {
  font-size: 10px;
  color: #00e5ff;
  margin-bottom: 2px;
}

.dn-tip-type {
  color: rgba(120, 190, 220, 0.75);
  margin-bottom: 1px;
}

.dn-tip-stat {
  color: rgba(160, 200, 230, 0.7);
}

.dn-tip-action {
  color: rgba(60, 220, 100, 0.9);
  margin-top: 2px;
}

.dn-tip-warn {
  color: rgba(255, 120, 60, 0.9);
  margin-top: 2px;
}

.dn-tip-enter-active,
.dn-tip-leave-active {
  transition: opacity 0.12s;
}

.dn-tip-enter-from,
.dn-tip-leave-to {
  opacity: 0;
}
</style>
