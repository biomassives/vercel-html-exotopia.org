<template>
  <div class="nav-inset" :class="{ 'nav-inset--collapsed': collapsed }">
    <div class="nav-bar">
      <span class="nav-icon" :class="{ 'nav-icon-pulse': isScanning && activeTab === 'local' }">{{ modeIcon }}</span>
      <span class="nav-title">{{ title }}</span>
      <span class="nav-count" v-if="!collapsed && activeTab === 'local' && mode === 'orbital' && planetCount > 1">
        {{ planetCount }} pl
      </span>
      <button class="nav-collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? 'Expand' : 'Minimize'">
        {{ collapsed ? '▲' : '▼' }}
      </button>
    </div>

    <template v-if="!collapsed">
      <!-- Location scale tabs -->
      <div class="nav-tabs">
        <button :class="['nav-tab', activeTab === 'local'  && 'nav-tab--active']" @click="setTab('local')">LOCAL</button>
        <button :class="['nav-tab', activeTab === 'galaxy' && 'nav-tab--active']" @click="setTab('galaxy')">GALAXY</button>
        <button :class="['nav-tab', activeTab === 'cosmic' && 'nav-tab--active']" @click="setTab('cosmic')">COSMIC</button>
      </div>

      <canvas
        ref="navCanvas"
        :width="W * 2"
        :height="H * 2"
        class="nav-canvas"
        :class="{ 'canvas-active-target': activeTab === 'local' && !!hoveredPlanet }"
        @click="onCanvasClick"
        @mousemove="onCanvasHover"
        @mouseleave="onCanvasLeave"
      />

      <div v-if="activeTab === 'local' && hoveredPlanet" class="nav-tooltip" :style="tooltipStyle">
        <div class="tooltip-header">{{ hoveredPlanet.pl_name }}</div>
        <div class="tooltip-meta">
          <span v-if="hoveredPlanet.pl_eqt">🌡️ {{ Math.round(hoveredPlanet.pl_eqt) }}K</span>
          <span v-if="hoveredPlanet.pl_orbsmax"> · 🌌 {{ hoveredPlanet.pl_orbsmax.toFixed(2) }} AU</span>
        </div>
      </div>

      <div class="nav-footer">
        <template v-if="activeTab === 'local'">
          <span class="nav-scale-hint">{{ scaleHint }}</span>
          <span v-if="mode === 'orbital' && moonCount > 0" class="nav-moons">⟳ {{ moonCount }}</span>
        </template>
        <template v-else-if="activeTab === 'galaxy'">
          <button class="nav-nav-btn" @click="emit('nav-galaxy')">
            <q-icon name="scatter_plot" size="9px" class="q-mr-xs" />Milky Way map
          </button>
        </template>
        <template v-else>
          <button class="nav-nav-btn" @click="emit('nav-cosmic')">
            <q-icon name="mdi-weather-night" size="9px" class="q-mr-xs" />Cosmic View
          </button>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter }    from 'vue-router'
import { useGalaxyStore } from 'src/stores/galaxy'
import type { Planet }    from 'src/stores/galaxy'

const props = defineProps<{
  mode:           'orbital' | 'neighborhood'
  hostname:       string
  currentPlanet?: string
}>()

const emit = defineEmits<{
  (e: 'select-planet', name: string): void
  (e: 'nav-galaxy'): void
  (e: 'nav-cosmic'): void
}>()

const W = 180
const H = 160

const navCanvas     = ref<HTMLCanvasElement | null>(null)
const galaxyStore   = useGalaxyStore()
const router        = useRouter()

const hoveredPlanet = ref<Planet | null>(null)
const tooltipStyle  = ref({ left: '0px', top: '0px' })
const activeTab     = ref<'local' | 'galaxy' | 'cosmic'>('local')
const collapsed     = ref(false)

// ── Interactive Animation States ─────────────────────────────────────────────
const isScanning    = ref(true)
let animationId     = 0
let scanY           = 0
let transitionProgress = ref(1.0)
let lastMode        = props.mode

const targetCrosshairOffset = ref({ x: 0, y: 0 })
const hitDots: { planet: Planet; cx: number; cy: number }[] = []

// ── Derived ───────────────────────────────────────────────────────────────────
const modeIcon    = computed(() => props.mode === 'orbital' ? '⬤' : '✦')
const title       = computed(() => props.mode === 'orbital' ? props.hostname : 'Stellar Neighborhood')
const scaleHint   = computed(() => props.mode === 'orbital' ? '↑ [CLICK STAR] SYSTEM' : '↑ [DRAG] SECTOR')
const planetCount = computed(() => galaxyStore.getSystem(props.hostname)?.planets.length ?? 0)
const moonCount   = computed(() => galaxyStore.getSystem(props.hostname)?.sy_mnum ?? 0)

function setTab(tab: 'local' | 'galaxy' | 'cosmic') {
  activeTab.value = tab
}

// ── Color helpers ─────────────────────────────────────────────────────────────
function starHex(teff?: number | null): string {
  if (!teff) return '#fff4ea'
  if (teff >= 30000) return '#9bb0ff'
  if (teff >= 10000) return '#aabfff'
  if (teff >= 7500)  return '#cad7ff'
  if (teff >= 6000)  return '#f8f7ff'
  if (teff >= 5200)  return '#fff4ea'
  if (teff >= 3700)  return '#ffd2a1'
  return '#ffcc6f'
}

function planetHex(eqt?: number | null, au?: number | null): string {
  if (eqt != null) {
    if (eqt > 2000) return '#ff4500'
    if (eqt > 1200) return '#ff8c42'
    if (eqt > 500)  return '#f0c040'
    if (eqt > 273)  return '#4ecdc4'
    if (eqt > 100)  return '#82b4d0'
    return '#c8e8f8'
  }
  return '#7fb3d3'
}

// ── Coordinate helpers ────────────────────────────────────────────────────────
function raDecToGalactic(ra: number, dec: number) {
  const D2R = Math.PI / 180
  const aNGP = 192.85948 * D2R, dNGP = 27.12825 * D2R, lNCP = 122.93192 * D2R
  const aR = ra * D2R, dR = dec * D2R
  const sinB = Math.sin(dR)*Math.sin(dNGP) + Math.cos(dR)*Math.cos(dNGP)*Math.cos(aR - aNGP)
  const b    = Math.asin(Math.max(-1, Math.min(1, sinB)))
  const y    = Math.cos(dR)*Math.sin(aR - aNGP)
  const x    = Math.sin(dR)*Math.cos(dNGP) - Math.cos(dR)*Math.sin(dNGP)*Math.cos(aR - aNGP)
  const l    = ((lNCP - Math.atan2(y, x)) * 180/Math.PI % 360 + 360) % 360
  return { l, b: b * 180/Math.PI }
}

function galToEquatorial(l: number, b: number): { ra: number; dec: number } {
  const D2R = Math.PI / 180
  const aNGP = 192.85948 * D2R, dNGP = 27.12825 * D2R, lNCP = 122.93192 * D2R
  const lR = l * D2R, bR = b * D2R
  const sinDec = Math.sin(bR)*Math.sin(dNGP) + Math.cos(bR)*Math.cos(dNGP)*Math.cos(lNCP - lR)
  const dec    = Math.asin(Math.max(-1, Math.min(1, sinDec))) * 180/Math.PI
  const y2     = Math.cos(bR)*Math.sin(lNCP - lR)
  const x2     = Math.sin(bR)*Math.cos(dNGP) - Math.cos(bR)*Math.sin(dNGP)*Math.cos(lNCP - lR)
  const ra     = ((aNGP + Math.atan2(y2, x2)) * 180/Math.PI % 360 + 360) % 360
  return { ra, dec }
}

// ── Render Cycle Frame Loop ──────────────────────────────────────────────────
function tick() {
  if (activeTab.value === 'local') {
    scanY = (scanY + 0.75) % H
    if (props.mode === 'orbital' && transitionProgress.value < 1.0) {
      transitionProgress.value = Math.min(1.0, transitionProgress.value + 0.07)
    } else if (props.mode === 'neighborhood' && transitionProgress.value > 0.0) {
      transitionProgress.value = Math.max(0.0, transitionProgress.value - 0.07)
    }
  }
  draw()
  animationId = requestAnimationFrame(tick)
}

function draw() {
  const cv = navCanvas.value
  if (!cv) return
  const ctx = cv.getContext('2d')!
  ctx.save()
  ctx.scale(2, 2)
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#020612'
  ctx.fillRect(0, 0, W, H)

  if (activeTab.value === 'galaxy') {
    drawGalaxyMiniMap(ctx)
    ctx.restore()
    return
  }
  if (activeTab.value === 'cosmic') {
    drawCosmicMiniMap(ctx)
    ctx.restore()
    return
  }

  // LOCAL tab — orbital / neighborhood orrery
  if (!galaxyStore.isLoaded) {
    ctx.fillStyle = 'rgba(80,130,170,0.55)'
    ctx.font      = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('CALIBRATING ARRAY…', W / 2, H / 2 + 4)
    ctx.restore()
    return
  }

  if (transitionProgress.value < 1.0) {
    ctx.save()
    ctx.globalAlpha = 1.0 - transitionProgress.value
    drawNeighborhood(ctx)
    ctx.restore()
  }
  if (transitionProgress.value > 0.0) {
    ctx.save()
    ctx.globalAlpha = transitionProgress.value
    drawOrbital(ctx)
    ctx.restore()
  }

  if (isScanning.value) {
    ctx.strokeStyle = 'rgba(0, 210, 245, 0.06)'
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.moveTo(0, scanY); ctx.lineTo(W, scanY)
    ctx.stroke()
  }

  ctx.restore()
}

// ── Galaxy minimap (Milky Way top-down) ──────────────────────────────────────
function drawGalaxyMiniMap(ctx: CanvasRenderingContext2D) {
  const sys = galaxyStore.getSystem(props.hostname)
  if (!sys) {
    ctx.fillStyle = 'rgba(80,130,170,0.45)'
    ctx.font = '8px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('NO SYSTEM DATA', W/2, H/2)
    return
  }
  const { l, b } = raDecToGalactic(sys.ra, sys.dec)
  const distPc   = sys.sy_dist ?? 100
  const D2R      = Math.PI / 180
  const cosB     = Math.cos(b * D2R)
  const sysX     = distPc * cosB * Math.cos(l * D2R)
  const sysY     = distPc * cosB * Math.sin(l * D2R)
  const scale    = Math.max(distPc * 1.6, 400)
  const cx = W / 2, cy = H / 2
  const px = (v: number) => cx + (v / scale) * (cx - 14)
  const py = (v: number) => cy - (v / scale) * (cy - 8)

  // Faint galactic disk
  const grd = ctx.createRadialGradient(cx, cy, 4, cx, cy, cx - 8)
  grd.addColorStop(0,   'rgba(160,140,255,0.13)')
  grd.addColorStop(0.5, 'rgba(60,80,180,0.07)')
  grd.addColorStop(1,   'rgba(8,14,40,0.0)')
  ctx.beginPath(); ctx.ellipse(cx, cy, cx-8, cy-6, 0, 0, Math.PI*2)
  ctx.fillStyle = grd; ctx.fill()

  // Galactic center dot or direction arrow
  const gcX = px(8178), gcY = py(0)
  if (gcX >= 2 && gcX <= W-2 && gcY >= 2 && gcY <= H-2) {
    ctx.beginPath(); ctx.arc(gcX, gcY, 3, 0, Math.PI*2)
    ctx.fillStyle = 'rgba(255,148,48,0.65)'; ctx.fill()
    ctx.fillStyle = 'rgba(255,128,38,0.52)'; ctx.font = '6px monospace'; ctx.textAlign = 'left'
    ctx.fillText('GC', gcX+4, gcY+3)
  } else {
    const ang = Math.atan2(gcY - cy, gcX - cx)
    const arX = cx + Math.cos(ang) * (cx - 16), arY = cy + Math.sin(ang) * (cy - 10)
    ctx.beginPath(); ctx.arc(arX, arY, 2, 0, Math.PI*2)
    ctx.fillStyle = 'rgba(255,128,38,0.42)'; ctx.fill()
    ctx.fillStyle = 'rgba(255,118,28,0.35)'; ctx.font = '6px monospace'; ctx.textAlign = 'left'
    ctx.fillText('GC', arX + (arX > cx ? -14 : 3), arY - 3)
  }

  // Sol
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2)
  ctx.fillStyle = '#ffe87a'; ctx.fill()
  ctx.fillStyle = 'rgba(255,230,120,0.48)'; ctx.font = '6px monospace'; ctx.textAlign = 'left'
  ctx.fillText('Sol', cx+4, cy-2)

  // Dashed line Sol → system
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px(sysX), py(sysY))
  ctx.strokeStyle = 'rgba(0,170,210,0.20)'; ctx.lineWidth = 0.8
  ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([])

  // System dot with ring
  const sdx = px(sysX), sdy = py(sysY)
  ctx.beginPath(); ctx.arc(sdx, sdy, 5, 0, Math.PI*2)
  ctx.strokeStyle = 'rgba(0,210,255,0.35)'; ctx.lineWidth = 1; ctx.stroke()
  ctx.beginPath(); ctx.arc(sdx, sdy, 2.5, 0, Math.PI*2)
  ctx.fillStyle = '#00ddff'; ctx.fill()

  // Corner labels
  ctx.fillStyle = 'rgba(0,188,218,0.62)'; ctx.font = '6px monospace'; ctx.textAlign = 'left'
  ctx.fillText(distPc < 1000 ? `${distPc.toFixed(0)} pc` : `${(distPc/1000).toFixed(1)} kpc`, 3, H-3)
  ctx.fillStyle = 'rgba(110,145,190,0.42)'; ctx.textAlign = 'right'
  ctx.fillText(`l=${l.toFixed(0)}° b=${b >= 0?'+':''}${b.toFixed(0)}°`, W-3, H-3)
}

// ── Cosmic minimap (RA/Dec sky map) ──────────────────────────────────────────
// Shows where this system sits on Earth's sky (equatorial coordinates), with
// the Milky Way's galactic plane overlaid for orientation. Previously just an
// unlabeled grid + curve + dot — added a legend, Dec ticks, and a name label
// on the system's own dot so the two lines and the dot are each identifiable
// without prior astronomy knowledge.
function drawCosmicMiniMap(ctx: CanvasRenderingContext2D) {
  const sys = galaxyStore.getSystem(props.hostname)
  if (!sys) return

  const EQUATOR_COLOR = 'rgba(90,150,220,0.85)'
  const GALPLANE_COLOR = 'rgba(225,180,80,0.85)'

  // Grid lines
  ctx.strokeStyle = 'rgba(28,52,88,0.52)'; ctx.lineWidth = 0.5
  for (let r = 0; r <= 360; r += 60) {
    const x = (r/360)*W; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke()
  }
  for (let d = -60; d <= 60; d += 30) {
    const y = ((90-d)/180)*H; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke()
  }

  // Celestial equator
  ctx.strokeStyle = 'rgba(45,85,145,0.48)'; ctx.lineWidth = 0.8
  const eq = (90/180)*H; ctx.beginPath(); ctx.moveTo(0,eq); ctx.lineTo(W,eq); ctx.stroke()

  // Galactic plane arc
  ctx.strokeStyle = 'rgba(195,152,55,0.26)'; ctx.lineWidth = 1
  ctx.beginPath()
  let prevRa = -999
  for (let li = 0; li <= 360; li += 2) {
    const { ra: gRa, dec: gDec } = galToEquatorial(li, 0)
    const gx = (gRa/360)*W, gy = ((90-gDec)/180)*H
    if (Math.abs(gRa - prevRa) > 180) { ctx.stroke(); ctx.beginPath(); ctx.moveTo(gx, gy) }
    else if (li === 0) ctx.moveTo(gx, gy)
    else ctx.lineTo(gx, gy)
    prevRa = gRa
  }
  ctx.stroke()

  // System position dot, labeled with its own name so it isn't just an
  // anonymous mark on the grid.
  const ra = sys.ra, dec = sys.dec
  const sx = (ra/360)*W, sy = ((90-dec)/180)*H
  ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI*2)
  ctx.strokeStyle = 'rgba(0,210,255,0.35)'; ctx.lineWidth = 1; ctx.stroke()
  ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI*2)
  ctx.fillStyle = '#00ddff'; ctx.fill()

  ctx.font = '6px monospace'
  ctx.fillStyle = 'rgba(0,220,255,0.85)'
  const labelLeft = sx > W - 40
  ctx.textAlign = labelLeft ? 'right' : 'left'
  ctx.fillText(sys.hostname, sx + (labelLeft ? -7 : 7), sy + 2)

  // RA ticks (top edge)
  ctx.fillStyle = 'rgba(55,95,145,0.58)'; ctx.font = '6px monospace'; ctx.textAlign = 'left'
  ctx.fillText('0h', 2, 8)
  ctx.textAlign = 'center'
  ctx.fillText('12h', W/2, 8)
  ctx.textAlign = 'right'
  ctx.fillText('24h', W-2, 8)

  // Dec ticks (left edge) — same grid rows as the horizontal lines above
  ctx.textAlign = 'left'
  for (const d of [60, 30, 0, -30, -60]) {
    const y = ((90-d)/180)*H
    ctx.fillText(`${d>0?'+':''}${d}°`, 2, y - 2)
  }

  // Legend — identifies the two lines so they aren't just unexplained marks
  const legendY = H - 20
  ctx.textAlign = 'left'
  ctx.strokeStyle = EQUATOR_COLOR; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.moveTo(W-58, legendY); ctx.lineTo(W-46, legendY); ctx.stroke()
  ctx.fillStyle = EQUATOR_COLOR
  ctx.fillText('Equator', W-44, legendY + 2)

  ctx.strokeStyle = GALPLANE_COLOR
  ctx.beginPath(); ctx.moveTo(W-58, legendY+9); ctx.lineTo(W-46, legendY+9); ctx.stroke()
  ctx.fillStyle = GALPLANE_COLOR
  ctx.fillText('Gal. plane', W-44, legendY + 11)

  // Coordinate readout
  ctx.fillStyle = 'rgba(0,182,212,0.62)'; ctx.textAlign = 'left'
  ctx.fillText(`RA ${(ra/15).toFixed(1)}h  Dec ${dec>=0?'+':''}${dec.toFixed(1)}°`, 3, H-3)
}

function drawOrbital(ctx: CanvasRenderingContext2D) {
  const sys = galaxyStore.getSystem(props.hostname)
  if (!sys?.planets.length) return

  hitDots.length = 0
  const cx   = W / 2
  const cy   = H / 2 + 2
  const maxR = Math.min(cx - 10, cy - 14)

  const sorted = [...sys.planets].sort((a, b) => (a.pl_orbsmax ?? 999) - (b.pl_orbsmax ?? 999))
  const maxAU  = Math.max(...sorted.map(p => p.pl_orbsmax ?? 0.3), 0.3)

  const hzInnerAU = 0.72
  const hzOuterAU = 1.77
  if (hzOuterAU <= maxAU) {
    const ri = 14 + Math.pow(hzInnerAU / maxAU, 0.52) * (maxR - 14)
    const ro = 14 + Math.pow(hzOuterAU / maxAU, 0.52) * (maxR - 14)
    const grad = ctx.createRadialGradient(cx, cy, ri, cx, cy, ro)
    grad.addColorStop(0,   'rgba(60, 200, 110, 0.00)')
    grad.addColorStop(0.5, 'rgba(60, 200, 110, 0.06)')
    grad.addColorStop(1,   'rgba(60, 200, 110, 0.00)')
    ctx.fillStyle = grad
    ctx.beginPath(); ctx.arc(cx, cy, ro, 0, Math.PI * 2); ctx.arc(cx, cy, ri, 0, Math.PI * 2, true); ctx.fill()
  }

  sorted.forEach((p, i) => {
    const au     = p.pl_orbsmax ?? (0.12 * (i + 1))
    const frac   = Math.pow(Math.min(au / maxAU, 1), 0.52)
    const orbitR = 14 + frac * (maxR - 14)
    const isCur  = p.pl_name === props.currentPlanet
    const col    = planetHex(p.pl_eqt, p.pl_orbsmax)

    const angle  = -Math.PI * 0.5 + (i / sorted.length) * Math.PI * 2
    const px     = cx + Math.cos(angle) * orbitR
    const py     = cy + Math.sin(angle) * orbitR

    hitDots.push({ planet: p, cx: px, cy: py })

    ctx.beginPath()
    ctx.setLineDash(isCur ? [] : [2, 4])
    ctx.strokeStyle = isCur ? 'rgba(0, 210, 235, 0.7)' : 'rgba(30, 70, 110, 0.35)'
    ctx.lineWidth   = isCur ? 1.2 : 0.6
    ctx.arc(cx, cy, orbitR, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    if (isCur) {
      ctx.fillStyle = col + '22'
      ctx.beginPath(); ctx.arc(px, py, 7 + Math.sin(scanY * 0.1) * 2, 0, Math.PI * 2); ctx.fill()
    }

    ctx.fillStyle = isCur ? col : col + 'b3'
    ctx.beginPath(); ctx.arc(px, py, isCur ? 3.5 : 2.0, 0, Math.PI * 2); ctx.fill()

    if (hoveredPlanet.value?.pl_name === p.pl_name) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth   = 1.0
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.stroke()
    }
  })

  const sc = starHex(sys.st_teff)
  ctx.fillStyle = sc
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill()
}

function drawNeighborhood(ctx: CanvasRenderingContext2D) {
  const sys = galaxyStore.getSystem(props.hostname)
  if (!sys) return

  const cx  = W / 2
  const cy  = H / 2
  const DEG = 18

  for (const [, s] of galaxyStore.systems) {
    const dx =  (s.ra  - sys.ra)  * (cx / DEG)
    const dy = -(s.dec - sys.dec) * (cy / DEG)
    const sx = cx + dx
    const sy = cy + dy
    if (sx < 1 || sx > W - 1 || sy < 1 || sy > H - 1) continue
    ctx.fillStyle = starHex(s.st_teff) + '44'
    ctx.fillRect(sx, sy, 1.2, 1.2)
  }

  const hx = cx + targetCrosshairOffset.value.x
  const hy = cy + targetCrosshairOffset.value.y

  ctx.strokeStyle = 'rgba(0,210,245,0.7)'
  ctx.lineWidth   = 0.8
  ctx.beginPath()
  ctx.moveTo(hx - 12, hy); ctx.lineTo(hx - 4, hy)
  ctx.moveTo(hx +  4, hy); ctx.lineTo(hx + 12, hy)
  ctx.moveTo(hx, hy - 12); ctx.lineTo(hx, hy -  4)
  ctx.moveTo(hx, hy +  4); ctx.lineTo(hx, hy + 12)
  ctx.stroke()
}

// ── Interaction ───────────────────────────────────────────────────────────────
function canvasCoords(e: MouseEvent): { x: number; y: number } {
  const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (W / rect.width),
    y: (e.clientY - rect.top)  * (H / rect.height),
  }
}

function onCanvasHover(e: MouseEvent) {
  if (activeTab.value !== 'local') return
  const { x, y } = canvasCoords(e)
  const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect()

  tooltipStyle.value = {
    left: `${e.clientX - rect.left + 12}px`,
    top:  `${e.clientY - rect.top  - 28}px`,
  }

  if (props.mode === 'orbital') {
    let best: Planet | null = null
    let bestD = 14
    for (const d of hitDots) {
      const dist = Math.hypot(d.cx - x, d.cy - y)
      if (dist < bestD) { bestD = dist; best = d.planet }
    }
    if (best?.pl_name !== hoveredPlanet.value?.pl_name) {
      hoveredPlanet.value = best
    }
  } else {
    const cx = W / 2, cy = H / 2
    const distanceToStar = Math.hypot(cx - x, cy - y)
    if (distanceToStar < 30) {
      targetCrosshairOffset.value = { x: (x - cx) * 0.45, y: (y - cy) * 0.45 }
    } else {
      targetCrosshairOffset.value = { x: 0, y: 0 }
    }
  }
}

function onCanvasLeave() {
  hoveredPlanet.value = null
  targetCrosshairOffset.value = { x: 0, y: 0 }
}

function onCanvasClick(e: MouseEvent) {
  if (activeTab.value !== 'local' || props.mode !== 'orbital' || !hoveredPlanet.value) return
  emit('select-planet', hoveredPlanet.value.pl_name)
  void router.push(`/surface/${encodeURIComponent(props.hostname)}/${encodeURIComponent(hoveredPlanet.value.pl_name)}`)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => { tick() })
onUnmounted(() => { cancelAnimationFrame(animationId) })

watch(() => props.mode, (newMode) => { lastMode = newMode })
</script>

<style scoped>
.nav-inset {
  position: absolute;
  bottom: 142px;
  right: 14px;
  width: 180px;
  background: rgba(2, 6, 18, 0.93);
  border: 1px solid rgba(0, 140, 200, 0.35);
  border-radius: 6px;
  overflow: visible;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 2, 10, 0.6);
  z-index: 5;
  transition: border-color 0.3s ease;
}

.nav-inset:hover {
  border-color: rgba(0, 210, 245, 0.5);
}

.nav-inset--collapsed {
  width: auto;
}

.nav-collapse-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  color: rgba(0, 180, 220, 0.55);
  font-size: 8px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}
.nav-collapse-btn:hover { color: rgba(0, 220, 255, 0.9); }

.nav-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px 4px;
  border-bottom: 1px solid rgba(0, 90, 150, 0.25);
  background: rgba(0, 15, 35, 0.4);
}

.nav-icon {
  font-size: 7px;
  color: rgba(0, 190, 240, 0.85);
  transition: transform 0.2s ease;
}

.nav-icon-pulse {
  animation: telemetryPulse 2s infinite ease-in-out;
}

/* ── Location scale tabs ───────────────────────────────────────────────────── */

.nav-tabs {
  display: flex;
  border-bottom: 1px solid rgba(0, 80, 130, 0.22);
}

.nav-tab {
  flex: 1;
  padding: 3px 0;
  background: none;
  border: none;
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  letter-spacing: 0.10em;
  color: rgba(70, 120, 160, 0.65);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.nav-tab:hover { color: rgba(0, 200, 240, 0.85); background: rgba(0, 130, 195, 0.06); }
.nav-tab--active {
  color: rgba(0, 210, 255, 0.95);
  background: rgba(0, 110, 170, 0.12);
  border-bottom: 2px solid rgba(0, 200, 250, 0.40);
}

/* ── Canvas ────────────────────────────────────────────────────────────────── */

.nav-canvas {
  display: block;
  width: 180px;
  height: 160px;
  transition: filter 0.2s ease;
}

.canvas-active-target {
  filter: drop-shadow(0 0 2px rgba(0, 210, 245, 0.3));
}

/* ── Tooltip ───────────────────────────────────────────────────────────────── */

.nav-tooltip {
  position: absolute;
  font-family: monospace;
  background: rgba(2, 10, 28, 0.96);
  border: 1px solid #00d2f5;
  border-radius: 4px;
  padding: 4px 8px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  z-index: 20;
}

.tooltip-header {
  font-size: 8.5px;
  font-weight: bold;
  color: #ffffff;
}

.tooltip-meta {
  font-size: 7.5px;
  color: rgba(0, 210, 245, 0.8);
  margin-top: 2px;
}

/* ── Footer ────────────────────────────────────────────────────────────────── */

.nav-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-top: 1px solid rgba(0, 70, 120, 0.25);
  font-family: monospace;
  font-size: 7.5px;
  color: rgba(75, 120, 165, 0.9);
  min-height: 24px;
}

.nav-scale-hint { flex: 1; }
.nav-moons      { margin-left: 4px; }

.nav-nav-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 2px 6px;
  background: rgba(0, 100, 160, 0.10);
  border: 1px solid rgba(0, 150, 200, 0.20);
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: rgba(0, 185, 225, 0.80);
  cursor: pointer;
  transition: background 0.14s, border-color 0.14s;
}
.nav-nav-btn:hover {
  background: rgba(0, 130, 190, 0.18);
  border-color: rgba(0, 195, 240, 0.38);
  color: rgba(0, 220, 255, 1);
}

/* ── Animation ─────────────────────────────────────────────────────────────── */

@keyframes telemetryPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); color: #00d2f5; }
}

.nav-title {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: rgba(160, 200, 240, 0.80);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-count {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  color: rgba(80, 140, 190, 0.60);
  flex-shrink: 0;
}
</style>
