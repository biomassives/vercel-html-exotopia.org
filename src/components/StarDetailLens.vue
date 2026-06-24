<template>
  <Teleport to="body">
    <div class="sdl-backdrop" @click.self="$emit('close')">
      <div class="sdl-window">

        <!-- ── Header ──────────────────────────────────────────────── -->
        <div class="sdl-header">
          <div class="sdl-header__left">
            <span class="sdl-hostname">{{ sys.hostname }}</span>
            <span class="sdl-spec" :style="{ color: profile.hex }">
              {{ sys.st_spectype ?? '—' }}
            </span>
            <span class="sdl-temp">{{ (sys.st_teff ?? 0).toLocaleString() }} K</span>
          </div>
          <div class="sdl-header__right">
            <span class="sdl-lum-class">{{ profile.lumClass === 'V' ? 'Main sequence' : profile.lumClass === 'III' ? 'Giant' : profile.lumClass }}</span>
            <button class="sdl-close" @click="$emit('close')">✕</button>
          </div>
        </div>

        <!-- ── Main viewport ────────────────────────────────────────── -->
        <div class="sdl-viewport-wrap">
          <canvas ref="starCanvas" class="sdl-canvas"/>

          <!-- Feature annotations (positioned absolutely over canvas) -->
          <div class="sdl-annot sdl-annot--tl">
            <span class="sdl-a-label">GRANULATION</span>
            <span class="sdl-a-val">{{ granLabel }}</span>
          </div>
          <div class="sdl-annot sdl-annot--tr">
            <span class="sdl-a-label">ROTATION</span>
            <span class="sdl-a-val">{{ rotLabel }}</span>
          </div>
          <div class="sdl-annot sdl-annot--bl">
            <span class="sdl-a-label">SUNSPOTS</span>
            <span class="sdl-a-val sdl-a-val--activity" :style="{ color: activityColor }">
              {{ visibleSpotCount }} active
            </span>
          </div>
          <div class="sdl-annot sdl-annot--br">
            <span class="sdl-a-label">ACTIVITY</span>
            <div class="sdl-act-bar">
              <div class="sdl-act-fill" :style="{ width: (actLevel*100).toFixed(0)+'%', background: activityColor }"/>
            </div>
            <span class="sdl-a-val sdl-a-val--activity" :style="{ color: activityColor }">
              {{ (actLevel * 100).toFixed(0) }}%
            </span>
          </div>

          <!-- Crosshair reticle around disc -->
          <svg class="sdl-reticle" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="146" fill="none"
              :stroke="profile.hex" stroke-width="0.6" stroke-opacity="0.30"
              stroke-dasharray="4,6"/>
            <line x1="200" y1="20"  x2="200" y2="54"  :stroke="profile.hex" stroke-width="0.8" stroke-opacity="0.40"/>
            <line x1="200" y1="346" x2="200" y2="380" :stroke="profile.hex" stroke-width="0.8" stroke-opacity="0.40"/>
            <line x1="20"  y1="200" x2="54"  y2="200" :stroke="profile.hex" stroke-width="0.8" stroke-opacity="0.40"/>
            <line x1="346" y1="200" x2="380" y2="200" :stroke="profile.hex" stroke-width="0.8" stroke-opacity="0.40"/>
          </svg>
        </div>

        <!-- ── Time scale controls ──────────────────────────────────── -->
        <div class="sdl-controls">

          <!-- Play/pause + speed -->
          <div class="sdl-playrow">
            <button class="sdl-play" @click="playing = !playing">
              {{ playing ? '⏸' : '▶' }}
            </button>
            <span class="sdl-elapsed">t = {{ elapsedLabel }}</span>
            <button class="sdl-reset" @click="resetTime" title="Reset to t=0">↺</button>
          </div>

          <!-- Time scale selector -->
          <div class="sdl-scale-row">
            <span class="sdl-scale-label">SCALE</span>
            <div class="sdl-scale-pills">
              <button
                v-for="(sc, i) in TIME_SCALES"
                :key="i"
                class="sdl-scale-pill"
                :class="{ 'sdl-scale-pill--on': timeScaleIdx === i }"
                @click="timeScaleIdx = i as TimeScaleIdx"
              >{{ sc.shortLabel }}</button>
            </div>
          </div>

          <!-- Current scale description -->
          <div class="sdl-scale-desc">{{ TIME_SCALES[timeScaleIdx]?.label }}</div>

        </div>

        <!-- ── Chromology strip ─────────────────────────────────────── -->
        <div class="sdl-chrom">
          <div class="sdl-chrom-row">
            <span class="sdl-ch-k">Spectral class</span>
            <span class="sdl-ch-v" :style="{ color: profile.hex }">
              {{ profile.specClass }} {{ profile.lumClass }}
            </span>
          </div>
          <div class="sdl-chrom-row">
            <span class="sdl-ch-k">Rotation period</span>
            <span class="sdl-ch-v">{{ rotLabel }}</span>
          </div>
          <div class="sdl-chrom-row" v-if="profile.cyclePeriodYr">
            <span class="sdl-ch-k">Activity cycle</span>
            <span class="sdl-ch-v">~{{ profile.cyclePeriodYr.toFixed(1) }} yr</span>
          </div>
          <div class="sdl-chrom-row" v-else>
            <span class="sdl-ch-k">Activity cycle</span>
            <span class="sdl-ch-v sdl-ch-v--dim">None (hot star)</span>
          </div>
          <div class="sdl-chrom-row">
            <span class="sdl-ch-k">Limb darkening u</span>
            <span class="sdl-ch-v">{{ profile.limbU.toFixed(2) }}</span>
          </div>
          <div class="sdl-chrom-row" v-if="profile.granulation.nCells > 0">
            <span class="sdl-ch-k">Granule cells</span>
            <span class="sdl-ch-v">~{{ profile.granulation.nCells }} visible</span>
          </div>
          <div class="sdl-chrom-row" v-else>
            <span class="sdl-ch-k">Granulation</span>
            <span class="sdl-ch-v sdl-ch-v--dim">Radiative envelope — none</span>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { StarSystem } from 'src/stores/galaxy'
import {
  buildStellarProfile, TIME_SCALES, activityFromPhase, sunspotLatRange,
  prominenceParams, flareFrequency, seededFloat,
  type StellarProfile, type TimeScaleIdx,
} from 'src/lib/star-physics'

// ── Props / emits ─────────────────────────────────────────────────────────────

const props = defineProps<{ sys: StarSystem }>()
defineEmits<{ (e: 'close'): void }>()

// ── Profile (deterministic from sys.hostname) ─────────────────────────────────

const profile = computed<StellarProfile>(() => buildStellarProfile(props.sys))

// ── Canvas ────────────────────────────────────────────────────────────────────

const starCanvas = ref<HTMLCanvasElement | null>(null)
const CANVAS_SIZE = 400
const R_FRAC = 0.365   // star radius as fraction of canvas

// ── Playback state ────────────────────────────────────────────────────────────

const playing       = ref(true)
const timeScaleIdx  = ref<TimeScaleIdx>(1)   // default: rotation scale
const tStar         = ref(0)                 // accumulated "star time" in seconds
let   lastTs        = 0
let   rafId         = 0

// ── Derived temporal values ───────────────────────────────────────────────────

const rotPeriodSec  = computed(() => profile.value.rotPeriodDays * 86_400)
const cycleSec      = computed(() => (profile.value.cyclePeriodYr ?? Infinity) * 365.25 * 86_400)

const rotAngle = computed(() => (2 * Math.PI * tStar.value) / rotPeriodSec.value)

const cyclePhase = computed(() =>
  profile.value.cyclePeriodYr
    ? (tStar.value / cycleSec.value) % 1
    : 0.5
)

const actLevel = computed(() => activityFromPhase(cyclePhase.value))

// ── Labels ────────────────────────────────────────────────────────────────────

const rotLabel = computed(() => {
  const d = profile.value.rotPeriodDays
  return d < 1 ? `${(d * 24).toFixed(1)} h` : `${d.toFixed(1)} d`
})

const granLabel = computed(() => {
  const nC = profile.value.granulation.nCells
  return nC > 0 ? `~${nC} cells visible` : 'radiative zone'
})

const activityColor = computed(() => {
  const a = actLevel.value
  if (a > 0.7) return '#ff6644'
  if (a > 0.4) return '#ffaa44'
  return '#44bbff'
})

const visibleSpotCount = computed(() =>
  Math.round(actLevel.value * profile.value.maxSpots)
)

const elapsedLabel = computed(() => {
  const t = tStar.value
  if (t < 3_600)          return `${(t/60).toFixed(0)} min`
  if (t < 86_400)         return `${(t/3_600).toFixed(1)} hr`
  if (t < 365.25*86_400)  return `${(t/86_400).toFixed(1)} d`
  return `${(t/(365.25*86_400)).toFixed(1)} yr`
})

// ── Seeded scene objects (sunspots, granules, prominences, streamers) ─────────

interface Spot {
  lat: number   // latitude in radians (±π/2), seeded + constrained by Spörer
  lon: number   // initial longitude
  size: number  // as fraction of R
  contrast: number
  birthPhase: number   // cycle phase at which this spot "lives"
}

interface Granule {
  x: number; y: number   // disc-normalised coords (-1 to 1)
  size: number
  brightness: number
  phaseOff: number        // oscillation phase offset
}

interface Prominence { lon: number; lat: number; height: number; width: number }
interface Streamer   { lon: number; lat: number; length: number; width: number }

let spots:       Spot[]       = []
let granules:    Granule[]    = []
let prominences: Prominence[] = []
let streamers:   Streamer[]   = []

function initSceneObjects() {
  const p    = profile.value
  const seed = p.seed
  const rng  = (s: number) => seededFloat(seed + s)

  // Sunspot groups — scattered over cycle phases
  spots = []
  for (let i = 0; i < p.maxSpots * 3; i++) {
    const birthPh = rng(100 + i)
    const [latMin, latMax] = sunspotLatRange(birthPh)
    const lat = (rng(200 + i) < 0.5 ? 1 : -1) * (latMin + rng(300 + i) * (latMax - latMin))
    spots.push({
      lat,
      lon:        rng(400 + i) * Math.PI * 2,
      size:       0.025 + rng(500 + i) * 0.04,
      contrast:   0.55  + rng(600 + i) * 0.30,
      birthPhase: birthPh,
    })
  }

  // Granule cells (disc-space, only if convective)
  granules = []
  if (p.granulation.nCells > 0) {
    const nc = Math.min(p.granulation.nCells, 600)
    for (let i = 0; i < nc; i++) {
      const ang = rng(700 + i) * Math.PI * 2
      const r   = Math.sqrt(rng(800 + i)) * 0.94   // uniform in disc
      granules.push({
        x:          Math.cos(ang) * r,
        y:          Math.sin(ang) * r,
        size:       p.granulation.cellScale * (0.6 + rng(900 + i) * 0.8),
        brightness: 0.3  + rng(1000 + i) * 0.7,
        phaseOff:   rng(1100 + i) * Math.PI * 2,
      })
    }
  }

  // Prominences
  prominences = []
  for (let i = 0; i < 5; i++) {
    prominences.push({
      lon:    rng(1200 + i) * Math.PI * 2,
      lat:    (rng(1300 + i) - 0.5) * Math.PI * 0.5,
      height: 0.06 + rng(1400 + i) * 0.14,
      width:  0.03 + rng(1500 + i) * 0.06,
    })
  }

  // Coronal streamers
  streamers = []
  for (let i = 0; i < 6; i++) {
    streamers.push({
      lon:    rng(1600 + i) * Math.PI * 2,
      lat:    (rng(1700 + i) - 0.5) * Math.PI * 0.25,
      length: 0.8 + rng(1800 + i) * 1.4,
      width:  0.015 + rng(1900 + i) * 0.035,
    })
  }
}

// ── Canvas rendering ──────────────────────────────────────────────────────────

function drawFrame() {
  const cv = starCanvas.value
  if (!cv) return
  const ctx = cv.getContext('2d')!
  const W   = CANVAS_SIZE * 2   // actual pixel size (retina)
  const H   = W
  const cx  = W / 2, cy = H / 2
  const R   = W * R_FRAC
  const p   = profile.value
  const t   = tStar.value
  const rotΩ = 2 * Math.PI / rotPeriodSec.value   // rad/s
  const [sr, sg, sb] = p.rgb
  const act  = actLevel.value

  ctx.clearRect(0, 0, W, H)

  // ── 1. Deep space background ───────────────────────────────────────────
  ctx.fillStyle = '#000310'
  ctx.fillRect(0, 0, W, H)

  // ── 2. Outer corona layers ─────────────────────────────────────────────
  for (let layer = 4; layer >= 1; layer--) {
    const rIn  = R * (1.02 + layer * 0.18)
    const rOut = R * (1.10 + layer * 0.70)
    const a    = (act * 0.06 + 0.04) / layer
    const cg   = ctx.createRadialGradient(cx, cy, rIn, cx, cy, rOut)
    cg.addColorStop(0, `rgba(${sr},${sg},${sb},${a.toFixed(3)})`)
    cg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = cg
    ctx.fillRect(0, 0, W, H)
  }

  // ── 3. Coronal streamers ───────────────────────────────────────────────
  ctx.save()
  for (const st of streamers) {
    const lon  = st.lon + t * rotΩ
    const px   = Math.cos(st.lat) * Math.sin(lon)
    const py   = -Math.sin(st.lat)
    const dep  = Math.cos(st.lat) * Math.cos(lon)
    if (dep < 0) continue   // on far side

    const sx = cx + px * R
    const sy = cy + py * R
    const ex = cx + px * R * (2.0 + st.length * act)
    const ey = cy + py * R * (2.0 + st.length * act)

    const sg2 = ctx.createLinearGradient(sx, sy, ex, ey)
    sg2.addColorStop(0, `rgba(${sr},${sg},${sb},${(0.16 * act).toFixed(3)})`)
    sg2.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(ex, ey)
    ctx.strokeStyle = sg2
    ctx.lineWidth   = R * st.width * (1 + act * 0.5)
    ctx.stroke()
  }
  ctx.restore()

  // ── 4. Photosphere disc with limb darkening ────────────────────────────
  // Build gradient applying I(μ) = 1 − u(1−μ)  where μ = cos(θ) = √(1−(r/R)²)
  const limbGrad = ctx.createRadialGradient(cx - R*0.06, cy - R*0.06, 0, cx, cy, R)
  const u = p.limbU
  for (let i = 0; i <= 12; i++) {
    const frac = i / 12
    const mu   = Math.sqrt(Math.max(0, 1 - frac * frac))
    const I    = Math.max(0, 1 - u * (1 - mu))
    limbGrad.addColorStop(frac, `rgb(${Math.round(sr*I)},${Math.round(sg*I)},${Math.round(sb*I)})`)
  }
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fillStyle = limbGrad
  ctx.fill()

  // ── 5. Granulation overlay (clip to disc) ──────────────────────────────
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.985, 0, Math.PI * 2); ctx.clip()

  if (p.granulation.nCells > 0) {
    const lt   = p.granulation.lifetime
    const gc   = p.granulation.contrast
    ctx.globalCompositeOperation = 'overlay'
    for (const gr of granules) {
      const phase  = ((t / lt) + gr.phaseOff / (Math.PI * 2)) % 1
      const bright = Math.sin(phase * Math.PI) * gr.brightness   // 0→peak→0
      if (bright < 0.05) continue

      // Project granule from disc coords to pixel coords (accounting for rotation)
      const lonRot = Math.atan2(gr.x, Math.sqrt(1 - gr.x*gr.x - gr.y*gr.y)) + t * rotΩ
      const latRot = Math.asin(gr.y)
      const projX  = Math.cos(latRot) * Math.sin(lonRot)
      const projY  = -Math.sin(latRot)
      const dep2   = Math.cos(latRot) * Math.cos(lonRot)
      if (dep2 < 0) continue

      const gx = cx + projX * R * 0.94
      const gy = cy + projY * R * 0.94
      const gr2 = R * gr.size

      const rr = Math.round(sr + bright * gc * 255)
      const gg2 = Math.round(sg + bright * gc * 255)
      const bb = Math.round(sb + bright * gc * 255)
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr2)
      grad.addColorStop(0,   `rgba(${rr},${gg2},${bb},${(bright*0.55).toFixed(3)})`)
      grad.addColorStop(0.6, `rgba(${sr},${sg},${sb},${(bright*0.10).toFixed(3)})`)
      grad.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath(); ctx.arc(gx, gy, gr2, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  // ── 6. Sunspots (rotate with star, constrained by Spörer) ─────────────
  const cyclePh = cyclePhase.value
  let nVis = 0
  for (const spot of spots) {
    // Only show spots whose birth phase is within ±0.45 of current cycle phase
    const phaseDiff = Math.abs(((cyclePh - spot.birthPhase + 1.5) % 1) - 0.5)
    if (phaseDiff > 0.40) continue
    const lifetime = 1 - phaseDiff / 0.40   // fade in/out

    const lon  = spot.lon + t * rotΩ
    const projX = Math.cos(spot.lat) * Math.sin(lon)
    const projY = -Math.sin(spot.lat)
    const dep  = Math.cos(spot.lat) * Math.cos(lon)
    if (dep < 0.05) continue   // on back side or near limb

    const foreshorten = Math.sqrt(1 - projX * projX * 0.6)  // limb foreshortening
    const sx = cx + projX * R * 0.94
    const sy = cy + projY * R * 0.94
    const rU = R * spot.size * foreshorten * lifetime

    if (rU < 1.5) continue
    nVis++

    // Umbra (dark core)
    ctx.beginPath()
    ctx.arc(sx, sy, rU, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,0,0,${(spot.contrast * 0.85 * lifetime).toFixed(3)})`
    ctx.fill()

    // Penumbra (graduated halo)
    const pen = ctx.createRadialGradient(sx, sy, rU * 0.85, sx, sy, rU * 2.2)
    pen.addColorStop(0, `rgba(0,0,0,${(spot.contrast * 0.42 * lifetime).toFixed(3)})`)
    pen.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.arc(sx, sy, rU * 2.2, 0, Math.PI * 2)
    ctx.fillStyle = pen
    ctx.fill()

    // Faculae — bright patches flanking the sunspot
    const fac = ctx.createRadialGradient(sx + rU * 1.6, sy, 0, sx + rU * 1.6, sy, rU * 2.5)
    fac.addColorStop(0, `rgba(${Math.min(255,sr+40)},${Math.min(255,sg+30)},${Math.min(255,sb+20)},${(0.22*lifetime).toFixed(3)})`)
    fac.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = fac
    ctx.beginPath(); ctx.arc(sx + rU*1.6, sy, rU*2.5, 0, Math.PI*2); ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  ctx.restore()   // end disc clip

  // ── 7. Prominences at limb ─────────────────────────────────────────────
  const promParams = prominenceParams(p.teff, act)
  let promShown = 0
  for (const prom of prominences) {
    if (promShown >= promParams.count) break
    const lon  = prom.lon + t * rotΩ
    const projX = Math.cos(prom.lat) * Math.sin(lon)
    const projY = -Math.sin(prom.lat)
    const dep  = Math.cos(prom.lat) * Math.cos(lon)
    // Only visible near limb (|dep| < 0.22)
    if (Math.abs(dep) > 0.22) continue
    promShown++

    const limX = cx + projX * R
    const limY = cy + projY * R
    const hPx  = R * prom.height * (0.5 + act * 0.5)
    const wPx  = R * prom.width

    // Arch prominence: bezier arc rising from limb
    const midX = limX + (dep > 0 ? -1 : 1) * hPx * 0.4
    const midY = limY - hPx

    ctx.beginPath()
    ctx.moveTo(limX - wPx, limY)
    ctx.quadraticCurveTo(midX, midY, limX + wPx, limY)
    ctx.strokeStyle = promParams.color
    ctx.lineWidth   = Math.max(1.5, wPx * 0.4)
    ctx.lineCap     = 'round'
    ctx.stroke()
  }

  // ── 8. White hot-spot centre (photospheric hot core) ──────────────────
  const hotGrad = ctx.createRadialGradient(cx - R*0.04, cy - R*0.04, 0, cx, cy, R * 0.22)
  hotGrad.addColorStop(0,   'rgba(255,255,255,0.88)')
  hotGrad.addColorStop(0.25,'rgba(255,255,255,0.25)')
  hotGrad.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = hotGrad
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2); ctx.fill()

  // ── 9. Disc edge crisp border ──────────────────────────────────────────
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(${sr},${sg},${sb},0.18)`
  ctx.lineWidth   = 1.5
  ctx.stroke()

  // Expose visible spot count to reactive state (don't use ref in RAF, just update global)
  _visSpots = nVis
}

let _visSpots = 0
const visibleSpotCountCanvas = ref(0)

// ── Animation loop ────────────────────────────────────────────────────────────

function tick(ts: number) {
  const dt = Math.min((ts - lastTs) / 1000, 0.05)   // cap at 50ms to avoid big jumps
  lastTs = ts
  if (playing.value) {
    const speed = TIME_SCALES[timeScaleIdx.value]?.speedSec ?? 86_400
    tStar.value += dt * speed
  }
  drawFrame()
  visibleSpotCountCanvas.value = _visSpots
  rafId = requestAnimationFrame(tick)
}

function resetTime() { tStar.value = 0 }

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  const cv = starCanvas.value!
  cv.width  = CANVAS_SIZE * 2
  cv.height = CANVAS_SIZE * 2
  cv.style.width  = CANVAS_SIZE + 'px'
  cv.style.height = CANVAS_SIZE + 'px'

  initSceneObjects()
  lastTs = performance.now()
  rafId  = requestAnimationFrame(tick)
})

onUnmounted(() => { cancelAnimationFrame(rafId) })

watch(() => props.sys.hostname, () => {
  initSceneObjects()
  tStar.value = 0
})
</script>

<style scoped>
/* ── Backdrop ──────────────────────────────────────────────────────────────── */

.sdl-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: rgba(0, 2, 10, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Window ────────────────────────────────────────────────────────────────── */

.sdl-window {
  background: #010812;
  border: 1px solid rgba(0, 140, 200, 0.24);
  border-radius: 10px;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.80);
  width: 480px;
  max-width: 96vw;
  font-family: 'Courier New', monospace;
  overflow: hidden;
}

/* ── Header ────────────────────────────────────────────────────────────────── */

.sdl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 90, 150, 0.22);
  gap: 10px;
}
.sdl-header__left  { display: flex; align-items: center; gap: 10px; }
.sdl-header__right { display: flex; align-items: center; gap: 10px; }

.sdl-hostname { font-size: 13px; color: rgba(210, 235, 255, 0.90); letter-spacing: 0.05em; }
.sdl-spec     { font-size: 10px; letter-spacing: 0.12em; }
.sdl-temp     { font-size: 9px; color: rgba(100, 160, 200, 0.60); }
.sdl-lum-class{ font-size: 8px; letter-spacing: 0.12em; color: rgba(80, 140, 180, 0.55); }

.sdl-close {
  background: none; border: 1px solid rgba(80, 120, 160, 0.28);
  color: rgba(80, 130, 170, 0.70); width: 22px; height: 22px;
  border-radius: 4px; cursor: pointer; font-size: 11px;
  transition: color 0.12s, border-color 0.12s;
}
.sdl-close:hover { color: #ff6666; border-color: rgba(200,80,80,0.45); }

/* ── Viewport ──────────────────────────────────────────────────────────────── */

.sdl-viewport-wrap {
  position: relative;
  background: #000208;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.sdl-canvas {
  display: block;
  border-radius: 50%;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.90);
}

.sdl-reticle {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}

/* Annotation chips at corners of viewport */
.sdl-annot {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 2px;
  pointer-events: none;
}
.sdl-annot--tl { top: 8px;  left: 8px; }
.sdl-annot--tr { top: 8px;  right: 8px; align-items: flex-end; }
.sdl-annot--bl { bottom: 8px; left: 8px; }
.sdl-annot--br { bottom: 8px; right: 8px; align-items: flex-end; }

.sdl-a-label {
  font-size: 6.5px; letter-spacing: 0.16em;
  color: rgba(0, 160, 200, 0.45);
}
.sdl-a-val {
  font-size: 8px; color: rgba(160, 210, 240, 0.72);
}
.sdl-a-val--activity { font-weight: 600; }

.sdl-act-bar {
  width: 60px; height: 3px;
  background: rgba(255,255,255,0.08); border-radius: 1.5px;
  overflow: hidden; margin: 2px 0;
}
.sdl-act-fill { height: 100%; border-radius: 1.5px; transition: width 0.5s linear; }

/* ── Time controls ─────────────────────────────────────────────────────────── */

.sdl-controls {
  padding: 10px 14px 8px;
  border-top: 1px solid rgba(0, 80, 130, 0.18);
  border-bottom: 1px solid rgba(0, 80, 130, 0.18);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.sdl-playrow {
  display: flex; align-items: center; gap: 10px;
}

.sdl-play, .sdl-reset {
  background: rgba(0, 40, 80, 0.50); border: 1px solid rgba(0, 140, 200, 0.28);
  color: rgba(0, 200, 255, 0.80); border-radius: 4px; cursor: pointer;
  font-size: 11px; padding: 3px 9px;
  transition: background 0.12s;
}
.sdl-play:hover, .sdl-reset:hover { background: rgba(0, 70, 120, 0.65); }

.sdl-elapsed {
  font-size: 8.5px; color: rgba(100, 160, 200, 0.65);
  font-family: 'Courier New', monospace; flex: 1;
}

.sdl-scale-row {
  display: flex; align-items: center; gap: 10px;
}
.sdl-scale-label {
  font-size: 7.5px; letter-spacing: 0.14em; color: rgba(0, 160, 200, 0.45);
  flex-shrink: 0;
}

.sdl-scale-pills { display: flex; gap: 4px; flex-wrap: wrap; }

.sdl-scale-pill {
  font-family: 'Courier New', monospace; font-size: 7.5px;
  letter-spacing: 0.06em; padding: 2px 8px; border-radius: 3px;
  border: 1px solid rgba(0, 100, 160, 0.22);
  color: rgba(80, 150, 190, 0.60); background: none; cursor: pointer;
  transition: border-color 0.12s, color 0.12s, background 0.12s;
}
.sdl-scale-pill:hover { border-color: rgba(0, 180, 220, 0.38); color: rgba(0, 210, 255, 0.80); }
.sdl-scale-pill--on {
  border-color: rgba(0, 200, 240, 0.55);
  color: rgba(0, 230, 255, 0.90);
  background: rgba(0, 60, 100, 0.38);
}

.sdl-scale-desc {
  font-size: 8px; color: rgba(80, 140, 180, 0.50); letter-spacing: 0.08em;
}

/* ── Chromology strip ──────────────────────────────────────────────────────── */

.sdl-chrom {
  padding: 8px 14px 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.sdl-chrom-row {
  display: flex; justify-content: space-between; align-items: baseline;
  width: 100%; gap: 8px;
  padding: 2px 0; border-bottom: 1px solid rgba(0, 50, 80, 0.18);
  font-size: 8.5px;
}
.sdl-chrom-row:last-child { border-bottom: none; }

.sdl-ch-k { color: rgba(70, 130, 170, 0.60); flex-shrink: 0; }
.sdl-ch-v { color: rgba(180, 220, 240, 0.85); text-align: right; }
.sdl-ch-v--dim { color: rgba(80, 120, 150, 0.45); font-style: italic; }
</style>
