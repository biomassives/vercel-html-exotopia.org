<template>
  <Teleport to="body">
    <Transition name="portal-fade">
      <div v-if="portalStore.active" class="portal-overlay">
        <canvas ref="canvas" class="portal-canvas" />

        <div class="portal-hud">
          <div class="portal-phase-label">{{ phaseLabel }}</div>
          <Transition name="dest-fade">
            <div
              v-if="showDestLabel"
              class="portal-dest-label"
              :style="{ color: destLabelColor, textShadow: `0 0 28px ${destLabelColor}66` }"
            >
              {{ portalStore.destination?.label ?? '' }}
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * WormholePortal.vue  —  Calm branching transit with directional star streaming
 *
 * Three visual layers:
 *   1. Branching network  — organic mycelium lines growing from centre
 *   2. E8 mandala        — very faint, barely-spinning geometric anchor
 *   3. Streaming stars   — 3D perspective projection from a vanishing point
 *                          creates the zoom-in / zoom-out camera feel
 *
 * Color spectrum:  the star stream shifts from source spectral color
 *                  to destination spectral color across the transit.
 *                  Individual stream stars are typed O–M for variety.
 *
 * Speed profile:   0 → peak 0.12 → 0 (smooth bell, never harsh)
 *                  Trail alpha is inverse of speed: fast = long streaks,
 *                  slow = dots → naturally creates zoom feel without effort.
 */

import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute }                          from 'vue-router'
import { usePortalStore }                               from 'src/stores/portal'
import { e8CoxeterPoints, e8CoxeterEdges, RING_META }  from 'src/lib/e8-lattice'
import { playPortalChime, fadePortalChime, playArrivalTone } from 'src/lib/portal-chime'

const portalStore = usePortalStore()
const router      = useRouter()
const route       = useRoute()
const canvas      = ref<HTMLCanvasElement | null>(null)

// ── Timing ────────────────────────────────────────────────────────────────────

const DURATION    = 7.0
const BREATHE_END = 3.0
const PASSAGE_END = 5.5

let rafId     = 0
let startT    = 0
let spinAngle = 0
let lastNow   = 0

const phaseLabel    = ref('')
const showDestLabel = ref(false)

// ── E8 geometry (pre-computed) ────────────────────────────────────────────────

const E8_PTS   = e8CoxeterPoints()
const E8_EDGES = e8CoxeterEdges(E8_PTS)

const E8_RING_RGBA = [
  (a: number) => `rgba(70,155,210,${a})`,
  (a: number) => `rgba(90,65,175,${a})`,
  (a: number) => `rgba(45,135,165,${a})`,
  (a: number) => `rgba(55,90,200,${a})`,
]

// ── Color helpers ─────────────────────────────────────────────────────────────

type RGB = [number, number, number]

const ROUTE_COLORS: Record<string, RGB> = {
  cosmic:     [26,  55, 120],   // deep space blue
  galaxy:     [200,136, 42],    // Milky Way amber
  surface:    [70, 180, 160],   // temperate teal
  cosmos:     [50, 130, 160],   // cosmos entry
  gallery:    [120, 68, 185],   // gallery violet
  station:    [90, 155, 200],   // station blue
  default:    [45, 100, 160],   // neutral space
}

function routeToRgb(r: string): RGB {
  if (r === '/' || r.startsWith('/cosmic')) return ROUTE_COLORS.cosmic!
  if (r.startsWith('/galaxy'))  return ROUTE_COLORS.galaxy!
  if (r.startsWith('/surface')) return ROUTE_COLORS.surface!
  if (r.startsWith('/gallery')) return ROUTE_COLORS.gallery!
  if (r.startsWith('/station')) return ROUTE_COLORS.station!
  return ROUTE_COLORS.default!
}

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function rgbStr(c: RGB, a: number): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`
}

function rgbHex(c: RGB): string {
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')
}

// Spectral variety for individual stream stars (O → M)
const SPECTRAL_RGB: RGB[] = [
  [155, 176, 255],  // O
  [170, 191, 255],  // B
  [202, 215, 255],  // A
  [248, 247, 245],  // F
  [255, 236, 170],  // G
  [255, 190, 110],  // K
  [255, 130,  80],  // M
]

// Resolved colors for the active transit
let srcRgb: RGB = [45, 100, 160]
let dstRgb: RGB = [45, 100, 160]

function resolveColors() {
  const dest    = portalStore.destination
  const curPath = route.path

  srcRgb = dest?.sourceColor
    ? hexToRgb(dest.sourceColor)
    : routeToRgb(curPath)

  dstRgb = dest?.destColor
    ? hexToRgb(dest.destColor)
    : routeToRgb(dest?.route ?? '')
}

// Destination label color (tinted by arrival color)
const destLabelColor = computed(() => {
  const c = lerpRgb(dstRgb, [200, 225, 245], 0.45)
  return rgbHex(c)
})

// ── Branching structure (pre-computed) ───────────────────────────────────────

interface Branch {
  x0: number; y0: number
  x1: number; y1: number
  depth: number
  delay: number; growDur: number
  baseAlpha: number; width: number
}

function rngFn(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const BRANCHES: Branch[] = (() => {
  const rng = rngFn(0x7CA14E55)
  const out: Branch[] = []
  const N = 8

  for (let i = 0; i < N; i++) {
    const a0  = (i / N) * Math.PI * 2 + (rng() - 0.5) * 0.28
    const l0  = 0.30 + rng() * 0.18
    const x1p = Math.cos(a0) * l0, y1p = Math.sin(a0) * l0
    out.push({ x0: 0, y0: 0, x1: x1p, y1: y1p, depth: 0, delay: rng() * 0.18, growDur: 0.65 + rng() * 0.20, baseAlpha: 0.50 + rng() * 0.15, width: 1.2 })

    const nS = 2 + (rng() > 0.6 ? 1 : 0)
    for (let j = 0; j < nS; j++) {
      const aJ = a0 + (j - (nS - 1) / 2) * (0.40 + rng() * 0.18)
      const lJ = l0 * (0.42 + rng() * 0.22)
      const tJ = 0.55 + rng() * 0.25
      const jx0 = Math.cos(a0) * l0 * tJ, jy0 = Math.sin(a0) * l0 * tJ
      const jx1 = jx0 + Math.cos(aJ) * lJ, jy1 = jy0 + Math.sin(aJ) * lJ
      out.push({ x0: jx0, y0: jy0, x1: jx1, y1: jy1, depth: 1, delay: 0.55 + rng() * 0.30, growDur: 0.55 + rng() * 0.25, baseAlpha: 0.30 + rng() * 0.15, width: 0.7 })

      const nT = 1 + (rng() > 0.55 ? 1 : 0)
      for (let k = 0; k < nT; k++) {
        const aK = aJ + (k - (nT - 1) / 2) * (0.45 + rng() * 0.18)
        const lK = lJ * (0.38 + rng() * 0.20)
        const tK = 0.48 + rng() * 0.32
        const kx0 = jx0 + Math.cos(aJ) * lJ * tK, ky0 = jy0 + Math.sin(aJ) * lJ * tK
        out.push({ x0: kx0, y0: ky0, x1: kx0 + Math.cos(aK) * lK, y1: ky0 + Math.sin(aK) * lK, depth: 2, delay: 1.05 + rng() * 0.40, growDur: 0.45 + rng() * 0.22, baseAlpha: 0.16 + rng() * 0.10, width: 0.35 })
      }
    }
  }
  return out
})()

// ── Streaming star pool ───────────────────────────────────────────────────────
// 3D perspective projection: stars stream from a central vanishing point
// outward, creating the zoom-through-space camera movement feel.
// Speed profile controls trail length: fast = long streaks, slow = dots.

const N_STREAM = 200

// Mutable z-depth arrays (reset at animation start, updated each frame)
const sX    = new Float32Array(N_STREAM)
const sY    = new Float32Array(N_STREAM)
const sZ    = new Float32Array(N_STREAM)
const sZprv = new Float32Array(N_STREAM)   // z from previous frame → streak length
const sSp   = new Float32Array(N_STREAM)   // per-star speed multiplier
const sSpc  = new Uint8Array(N_STREAM)     // spectral index 0–6

function resetStream() {
  const rng = rngFn(0x5EA5E99)
  for (let i = 0; i < N_STREAM; i++) {
    const z    = rng()
    sX[i]    = (rng() - 0.5) * 2
    sY[i]    = (rng() - 0.5) * 2
    sZ[i]    = z
    sZprv[i] = z
    sSp[i]   = 0.45 + rng() * 1.10
    sSpc[i]  = Math.floor(rng() * 7)
  }
}

// Speed profile: smooth 0 → peak 0.12 → 0 bell curve over 7s
function speedAt(elapsed: number): number {
  const rise = Math.min(1, elapsed / 2.8)
  const fall = Math.max(0, 1 - Math.max(0, (elapsed - 4.8) / 2.2))
  // Ease-in on the rise so first second is very gentle
  return 0.12 * (rise * rise) * fall
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

watch(() => portalStore.active, async (active) => {
  if (active) { await nextTick(); startAnimation() }
  else          stopAnimation()
})

function startAnimation() {
  if (!canvas.value) return
  resize()
  resolveColors()
  resetStream()
  startT      = performance.now()
  lastNow     = startT
  spinAngle   = 0
  showDestLabel.value = false
  phaseLabel.value    = 'opening path…'
  // Etheric bell chime accompanies the branching-network animation
  playPortalChime(0.17)
  rafId = requestAnimationFrame(tick)
}

function stopAnimation() {
  cancelAnimationFrame(rafId)
  showDestLabel.value = false
  fadePortalChime(0.8)
}

onUnmounted(stopAnimation)

function resize() {
  if (!canvas.value) return
  canvas.value.width  = window.innerWidth
  canvas.value.height = window.innerHeight
}

// ── Main render loop ──────────────────────────────────────────────────────────

function tick(now: number) {
  if (!canvas.value) return

  const elapsed = (now - startT) / 1000
  const dt      = Math.min(0.05, (now - lastNow) / 1000)   // capped to avoid jumps
  lastNow       = now

  const ctx = canvas.value.getContext('2d')!
  const W   = ctx.canvas.width, H = ctx.canvas.height
  const cx  = W / 2, cy = H / 2
  const maxR = Math.min(W, H) * 0.44

  // Phase labels
  if      (elapsed < BREATHE_END) phaseLabel.value = 'opening path…'
  else if (elapsed < PASSAGE_END) phaseLabel.value = 'in passage…'
  else {
    phaseLabel.value    = 'arriving…'
    showDestLabel.value = elapsed > 6.1
    // Soft arrival tone on first tick of ARRIVAL phase
    if (elapsed >= PASSAGE_END && elapsed < PASSAGE_END + 0.05) {
      playArrivalTone(0.10)
    }
  }

  // Color progress: 0 = fully source, 1 = fully dest
  const cprog = Math.min(1, Math.max(0, (elapsed - 0.8) / 5.4))
  const curRgb = lerpRgb(srcRgb, dstRgb, cprog)

  // ── Dynamic trail alpha (key to zoom feel) ──────────────────────────────────
  const speed      = speedAt(elapsed)
  const trailAlpha = Math.max(0.022, 0.10 - speed * 0.62)
  ctx.fillStyle = `rgba(0,4,18,${trailAlpha})`
  ctx.fillRect(0, 0, W, H)

  // ── Source color edge vignette (fades as you depart) ─────────────────────
  if (cprog < 0.6) {
    const va  = (1 - cprog / 0.6) * 0.07
    const vgr = ctx.createRadialGradient(cx, cy, maxR * 0.6, cx, cy, maxR * 1.5)
    vgr.addColorStop(0,   rgbStr(srcRgb, 0))
    vgr.addColorStop(0.5, rgbStr(srcRgb, va))
    vgr.addColorStop(1,   rgbStr(srcRgb, va * 0.4))
    ctx.fillStyle = vgr
    ctx.fillRect(0, 0, W, H)
  }

  // ── Deep central glow — shifts from source to dest color ─────────────────
  {
    const breathe = 1 + Math.sin(elapsed * Math.PI / 2) * 0.04
    const glowR   = maxR * 0.50 * breathe
    const glowA   = 0.10 * Math.min(1, elapsed / 1.8)
    const grd     = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
    grd.addColorStop(0,   rgbStr(curRgb, glowA * 1.8))
    grd.addColorStop(0.45, rgbStr(curRgb, glowA))
    grd.addColorStop(1,   'rgba(0,4,18,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }

  // ── Streaming stars (3D perspective) ────────────────────────────────────────
  {
    const arrFade = elapsed > PASSAGE_END ? Math.max(0, 1 - (elapsed - PASSAGE_END) / 0.8) : 1.0
    const FL      = 0.44   // focal length — controls spread of star field

    ctx.save()
    ctx.globalCompositeOperation = 'screen'

    for (let i = 0; i < N_STREAM; i++) {
      sZprv[i] = sZ[i]
      sZ[i]   -= speed * sSp[i] * dt

      if (sZ[i] <= 0.008) {
        // Recycle star to far end with fresh random position
        sX[i]    = (Math.random() - 0.5) * 2
        sY[i]    = (Math.random() - 0.5) * 2
        sZ[i]    = 0.96 + Math.random() * 0.04
        sZprv[i] = sZ[i]
        continue
      }

      const z   = sZ[i]
      const zp  = Math.min(1, sZprv[i])

      // Perspective projection: vanishing point at screen centre
      const sx  = (sX[i] / z)  * FL * W * 0.5 + cx
      const sy  = (sY[i] / z)  * FL * H * 0.5 + cy
      const sxp = (sX[i] / zp) * FL * W * 0.5 + cx
      const syp = (sY[i] / zp) * FL * H * 0.5 + cy

      if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) continue

      // Brightness: closer = brighter, farther = dimmer
      const brightness = Math.pow(1 - z, 1.4) * 0.6 + 0.06
      const alpha      = brightness * arrFade

      // Star's own spectral color, tinted toward the current transit color
      const specRgb = SPECTRAL_RGB[sSpc[i]]!
      const starRgb = lerpRgb(specRgb, curRgb, 0.35 + cprog * 0.3)

      const streakLen = Math.hypot(sx - sxp, sy - syp)

      if (streakLen > 1.2 && speed > 0.01) {
        // Streak: line from prev to current position
        const grad = ctx.createLinearGradient(sxp, syp, sx, sy)
        grad.addColorStop(0,   rgbStr(starRgb, 0))
        grad.addColorStop(0.4, rgbStr(starRgb, alpha * 0.35))
        grad.addColorStop(1,   rgbStr(starRgb, alpha))
        ctx.strokeStyle = grad
        ctx.lineWidth   = Math.max(0.4, (1 - z) * 1.8)
        ctx.lineCap     = 'round'
        ctx.beginPath()
        ctx.moveTo(sxp, syp)
        ctx.lineTo(sx, sy)
        ctx.stroke()
      } else {
        // Dot: soft radial glow when slow
        const r = Math.max(0.5, (1 - z) * 2.5 + 0.3)
        const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.5)
        grd.addColorStop(0,   rgbStr(starRgb, alpha))
        grd.addColorStop(0.4, rgbStr(starRgb, alpha * 0.4))
        grd.addColorStop(1,   rgbStr(starRgb, 0))
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(sx, sy, r * 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }

  // ── Branching network ─────────────────────────────────────────────────────
  {
    const arrFade = elapsed > PASSAGE_END ? Math.max(0, 1 - (elapsed - PASSAGE_END) / 1.0) : 1.0
    const breathe = 1 + Math.sin(elapsed * Math.PI / 2) * 0.03

    // Branch colors inherit the current transit color
    const bCols: RGB[] = [
      lerpRgb([45, 120, 175], curRgb, 0.40),   // primary
      lerpRgb([75,  55, 155], curRgb, 0.25),   // secondary
      lerpRgb([35,  90, 125], curRgb, 0.20),   // tertiary
    ]

    ctx.save()
    ctx.translate(cx, cy)
    ctx.globalCompositeOperation = 'screen'

    for (const b of BRANCHES) {
      const grow = Math.max(0, Math.min(1, (elapsed - b.delay) / b.growDur))
      if (grow <= 0) continue

      const sc   = maxR * breathe
      const ex   = b.x0 * sc + (b.x1 - b.x0) * sc * grow
      const ey   = b.y0 * sc + (b.y1 - b.y0) * sc * grow
      const bc   = bCols[b.depth]!
      const alpha = b.baseAlpha * arrFade

      ctx.strokeStyle = rgbStr(bc, alpha)
      ctx.lineWidth   = b.width
      ctx.lineCap     = 'round'
      ctx.beginPath()
      ctx.moveTo(b.x0 * sc, b.y0 * sc)
      ctx.lineTo(ex, ey)
      ctx.stroke()

      // Tip glow when fully grown
      if (grow >= 0.98) {
        const tg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 5)
        tg.addColorStop(0,   rgbStr(bc, alpha * 0.7))
        tg.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.fillStyle = tg
        ctx.beginPath()
        ctx.arc(ex, ey, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  // ── E8 mandala — barely present, geometric anchor ────────────────────────
  {
    const fadeIn  = Math.min(1, Math.max(0, (elapsed - 0.5) / 2.5))
    const fadeOut = elapsed > PASSAGE_END ? Math.max(0, 1 - (elapsed - PASSAGE_END) / 1.2) : 1.0
    const e8A     = fadeIn * fadeOut

    if (e8A > 0.01) {
      spinAngle += 0.0008 + speed * 0.002   // barely spins; spins slightly faster at cruise
      const gentle = 1 + Math.sin(elapsed * Math.PI * 0.5) * 0.035

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(spinAngle)
      ctx.globalCompositeOperation = 'screen'

      // Edges — very faint
      ctx.lineWidth = 0.5
      for (const [ai, bi] of E8_EDGES) {
        const a = E8_PTS[ai]!, b = E8_PTS[bi]!
        const fn = E8_RING_RGBA[a.ring] ?? E8_RING_RGBA[0]!
        ctx.strokeStyle = fn!(e8A * 0.07)
        ctx.beginPath()
        ctx.moveTo(a.x * maxR, a.y * maxR)
        ctx.lineTo(b.x * maxR, b.y * maxR)
        ctx.stroke()
      }

      // Points — tinted by current transit color
      for (const pt of E8_PTS) {
        const x   = pt.x * maxR * gentle
        const y   = pt.y * maxR * gentle
        const sz  = (RING_META[pt.ring]?.size ?? 2) * 0.85
        // Blend ring base color toward the transit color
        const ringBase: RGB = a => {
          const m = [[70,155,210],[90,65,175],[45,135,165],[55,90,200]][pt.ring] ?? [70,155,210]
          return m as RGB
        }
        const ptCol = lerpRgb(ringBase(0), curRgb, 0.30)
        const ptA   = e8A * 0.38

        const grd = ctx.createRadialGradient(x, y, 0, x, y, sz * 2.6)
        grd.addColorStop(0,   rgbStr(ptCol, ptA))
        grd.addColorStop(0.5, rgbStr(ptCol, ptA * 0.3))
        grd.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(x, y, sz * 2.6, 0, Math.PI * 2)
        ctx.fill()

        // Core (no white — keeps it soft)
        ctx.fillStyle = rgbStr(ptCol, ptA * 0.55)
        ctx.beginPath()
        ctx.arc(x, y, sz * 0.55, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
  }

  // ── Arrival: destination color blooms at centre ───────────────────────────
  if (elapsed > PASSAGE_END) {
    const ap  = (elapsed - PASSAGE_END) / (DURATION - PASSAGE_END)
    const bA  = ap * 0.18
    const bR  = maxR * 0.38 * (1 + ap * 0.3)
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, bR)
    grd.addColorStop(0,   rgbStr(dstRgb, bA * 2.0))
    grd.addColorStop(0.45, rgbStr(dstRgb, bA))
    grd.addColorStop(1,   'rgba(0,4,18,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)

    // Star field softly emerges around destination
    const rng2 = rngFn(0x57A25F)
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    const starCount = Math.round(ap * 140)
    for (let i = 0; i < starCount; i++) {
      const sx = rng2() * W, sy = rng2() * H
      const sr = 0.4 + rng2() * 0.9
      const sa = (0.08 + rng2() * 0.28) * Math.min(1, ap * 2.2)
      const sc = lerpRgb([155, 185, 215], dstRgb, 0.25)
      ctx.fillStyle = rgbStr(sc, sa)
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  // ── Navigate on complete ──────────────────────────────────────────────────
  if (elapsed >= DURATION) {
    showDestLabel.value = false
    const destRoute = portalStore.destination?.route ?? null
    portalStore.closePortal()
    if (destRoute) router.push(destRoute)
    return
  }

  rafId = requestAnimationFrame(tick)
}

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', resize)
onUnmounted(() => window.removeEventListener('resize', resize))
</script>

<style scoped>
.portal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9900;
  background: #00040e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.portal-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.portal-hud {
  position: relative;
  z-index: 9901;
  text-align: center;
  pointer-events: none;
}

.portal-phase-label {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.20em;
  color: rgba(80, 150, 190, 0.50);
  text-transform: lowercase;
  margin-bottom: 0.6rem;
}

.portal-dest-label {
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  letter-spacing: 0.16em;
  /* color and text-shadow set dynamically from destLabelColor */
}

.portal-fade-enter-active { transition: opacity 0.6s ease; }
.portal-fade-leave-active { transition: opacity 0.5s ease; }
.portal-fade-enter-from,
.portal-fade-leave-to     { opacity: 0; }

.dest-fade-enter-active {
  transition: opacity 0.9s ease, transform 0.9s ease;
}
.dest-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
</style>
