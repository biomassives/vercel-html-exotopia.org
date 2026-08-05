<template>
  <Teleport to="body">
    <canvas v-show="st.phase !== 'idle'" ref="cv" class="st-canvas"
      :class="{ 'st-inversion': st.mode === 'inversion' && st.phase === 'departing' }" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useRoute }                 from 'vue-router'
import { useSceneTransitionStore }  from 'src/stores/scene-transition'

const st    = useSceneTransitionStore()
const route = useRoute()
const cv    = ref<HTMLCanvasElement | null>(null)

let rafId = 0

// ── Canvas resize ────────────────────────────────────────────────────────────

function resize() {
  if (!cv.value) return
  cv.value.width  = window.innerWidth
  cv.value.height = window.innerHeight
}

// ── Lightning helpers ────────────────────────────────────────────────────────

const COMIC_WORDS   = ['WARP!', 'JUMP!', 'QUANTUM!', 'ZAP!', 'TRANSIT!', 'THOOM!', 'VWOOSH!', 'HYPERDRIVE!', 'KAPOW!']
const COMIC_COLORS  = ['#ffee00', '#ff6600', '#00ffcc', '#ff00bb', '#00ccff', '#ff4444']

function boltSegment(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, rough: number, depth: number) {
  if (depth <= 0 || Math.hypot(x2-x1, y2-y1) < 4) { ctx.lineTo(x2, y2); return }
  const d  = Math.hypot(x2-x1, y2-y1)
  const mx = (x1+x2)/2 + (Math.random()-.5) * d * rough
  const my = (y1+y2)/2 + (Math.random()-.5) * d * rough
  boltSegment(ctx, x1, y1, mx, my, rough, depth-1)
  boltSegment(ctx, mx, my, x2, y2, rough * .65, depth-1)
}

function starburst(ctx: CanvasRenderingContext2D, cx: number, cy: number, rOut: number, pts: number) {
  const rIn = rOut * 0.46
  ctx.beginPath()
  for (let i = 0; i < pts * 2; i++) {
    const r   = i % 2 === 0 ? rOut : rIn
    const ang = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2
    if (i === 0) ctx.moveTo(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r)
    else          ctx.lineTo(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r)
  }
  ctx.closePath()
}

function drawLightningFrame(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  ox: number, oy: number, elapsed: number,
) {
  ctx.clearRect(0, 0, W, H)
  const t = elapsed / 1600      // 0 → 1 over full duration — ~1.8x the original
                                 // 900ms, for paired dimensional space-jumps
                                 // (system↔surface descents) where the effect
                                 // should read as slower/weightier, not just
                                 // longer. Flicker/rotation rates below are
                                 // scaled by the same ~1.8x so the whole thing
                                 // dilates uniformly instead of getting busier.

  // Background darkens as bolts fly
  ctx.fillStyle = `rgba(0,0,6,${Math.min(1, t * 1.2)})`
  ctx.fillRect(0, 0, W, H)

  if (t > 0.78) return  // hold black

  const flickerT = Math.sin(elapsed / 50) * 0.5 + 0.5
  const maxR     = Math.hypot(W, H) * 0.55
  const nBolts   = 5

  ctx.save()
  for (let i = 0; i < nBolts; i++) {
    const angle  = (i / nBolts) * Math.PI * 2 + elapsed * 0.0022
    const dist   = maxR * (0.5 + Math.random() * 0.5)
    const tx     = ox + Math.cos(angle) * dist
    const ty     = oy + Math.sin(angle) * dist
    const bright = Math.max(0, (1 - t / 0.78)) * (0.55 + flickerT * 0.45)

    // glow pass
    ctx.shadowBlur   = 22
    ctx.shadowColor  = '#00eeff'
    ctx.strokeStyle  = `rgba(160,230,255,${bright * 0.45})`
    ctx.lineWidth    = 3.5
    ctx.beginPath(); ctx.moveTo(ox, oy)
    boltSegment(ctx, ox, oy, tx, ty, 0.22, 5)
    ctx.stroke()

    // core pass
    ctx.shadowBlur   = 5
    ctx.strokeStyle  = `rgba(255,255,255,${bright * 0.90})`
    ctx.lineWidth    = 1.4
    ctx.beginPath(); ctx.moveTo(ox, oy)
    boltSegment(ctx, ox, oy, tx, ty, 0.14, 4)
    ctx.stroke()

    // branch
    if (Math.random() < 0.45) {
      const bLen = dist * 0.32
      const bAng = angle + (Math.random() - 0.5) * 1.3
      const bmx  = ox + Math.cos(angle) * dist * 0.42
      const bmy  = oy + Math.sin(angle) * dist * 0.42
      ctx.globalAlpha = bright * 0.45
      ctx.strokeStyle = `rgba(120,200,255,1)`
      ctx.lineWidth   = 0.9
      ctx.beginPath(); ctx.moveTo(bmx, bmy)
      boltSegment(ctx, bmx, bmy, bmx + Math.cos(bAng)*bLen, bmy + Math.sin(bAng)*bLen, 0.28, 3)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }
  ctx.restore()

  // Comic text bursts — appear when flickering is bright. Probability is
  // scaled down from the original 0.18 (÷~1.8, matching the duration
  // stretch) so the longer animation doesn't just pop more words — the
  // total expected burst count over the full transit stays about the same.
  if (flickerT > 0.62 && t < 0.65 && Math.random() < 0.10) {
    const nWords = 1 + Math.floor(Math.random() * 2)
    for (let j = 0; j < nWords; j++) {
      const wx    = W * (0.12 + Math.random() * 0.74)
      const wy    = H * (0.10 + Math.random() * 0.72)
      const r     = 36 + Math.random() * 52
      const color = COMIC_COLORS[Math.floor(Math.random() * COMIC_COLORS.length)]!
      const word  = COMIC_WORDS[Math.floor(Math.random() * COMIC_WORDS.length)]!
      const rot   = (Math.random() - 0.5) * 0.55

      ctx.save()
      ctx.translate(wx, wy)
      ctx.rotate(rot)
      starburst(ctx, 0, 0, r, 10)
      ctx.fillStyle   = color
      ctx.fill()
      ctx.strokeStyle = '#000'
      ctx.lineWidth   = 2.5
      ctx.stroke()
      ctx.shadowBlur  = 0
      ctx.fillStyle   = '#000'
      const fs = Math.max(9, r * 0.52)
      ctx.font          = `bold ${fs}px 'Courier New', monospace`
      ctx.textAlign     = 'center'
      ctx.textBaseline  = 'middle'
      ctx.fillText(word, 0, 0)
      ctx.restore()
    }
  }
}

// ── Arrival fade-from-black ──────────────────────────────────────────────────

function drawArrivalFrame(ctx: CanvasRenderingContext2D, W: number, H: number, elapsed: number) {
  const alpha = Math.max(0, 1 - elapsed / 530)
  ctx.clearRect(0, 0, W, H)
  if (alpha > 0) {
    ctx.fillStyle = `rgba(0,0,6,${alpha})`
    ctx.fillRect(0, 0, W, H)
  }
}

// ── Iris wipe (CSS-free canvas version) ──────────────────────────────────────

function drawIrisFrame(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  ox: number, oy: number, elapsed: number, closing: boolean,
) {
  const dur    = 380
  const raw    = Math.min(1, elapsed / dur)
  const eased  = closing ? raw * raw : 1 - (1 - raw) * (1 - raw)
  const maxR   = Math.hypot(Math.max(ox, W-ox), Math.max(oy, H-oy)) * 1.1
  const radius = closing ? maxR * (1 - eased) : maxR * eased

  ctx.clearRect(0, 0, W, H)
  if (closing && eased >= 1) {
    ctx.fillStyle = '#000006'; ctx.fillRect(0, 0, W, H); return
  }
  if (!closing && eased >= 1) { return }

  // Black with circular hole
  ctx.fillStyle = '#000006'
  ctx.beginPath()
  ctx.rect(0, 0, W, H)
  ctx.arc(ox, oy, Math.max(0, radius), 0, Math.PI * 2, true)
  ctx.fill('evenodd')
}

// ── Light-inversion crossing (portal-step effect) ───────────────────────────
// A white flash-and-fade painted onto a canvas with mix-blend-mode:difference
// (see .st-inversion below) — the browser compositor computes |dst-src| per
// pixel, which for a white src produces an exact photographic-negative
// inversion of everything underneath (WebGL canvas, UI, all of it) without
// ever touching the WebGL context. Timing per SPEC_ZOOM_DESCENT.md §7.1:
// ramp to white 0-180ms, hold 180-380ms, fade to black 380-550ms (the fade
// covers the route change, same role the iris/lightning "hold black" plays).

function drawInversionFrame(ctx: CanvasRenderingContext2D, W: number, H: number, elapsed: number) {
  ctx.clearRect(0, 0, W, H)
  let alpha: number
  if      (elapsed < 180) alpha = elapsed / 180
  else if (elapsed < 380) alpha = 1.0
  else                     alpha = Math.max(0, 1 - (elapsed - 380) / 170)

  ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
  ctx.fillRect(0, 0, W, H)
}

// ── Main animation runner ────────────────────────────────────────────────────

function runLoop(animType: 'depart-lightning' | 'depart-iris' | 'depart-inversion' | 'arrive') {
  cancelAnimationFrame(rafId)
  const start = performance.now()

  const tick = () => {
    const canvas = cv.value
    if (!canvas) return
    const ctx     = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const elapsed = performance.now() - start
    const origX   = W * (st.ox / 100)
    const origY   = H * (st.oy / 100)

    if      (animType === 'depart-lightning')  drawLightningFrame(ctx, W, H, origX, origY, elapsed)
    else if (animType === 'depart-iris')       drawIrisFrame(ctx, W, H, origX, origY, elapsed, true)
    else if (animType === 'depart-inversion')  drawInversionFrame(ctx, W, H, elapsed)
    else                                        drawArrivalFrame(ctx, W, H, elapsed)

    const running = animType === 'arrive'            ? elapsed < 560 :
                     animType === 'depart-lightning'  ? elapsed < 1610 :
                     animType === 'depart-inversion'  ? elapsed < 560 : elapsed < 390
    if (running) rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

// ── Watchers ─────────────────────────────────────────────────────────────────

watch(() => st.phase, (phase) => {
  if (phase === 'departing') {
    resize()
    const animType = st.mode === 'lightning'  ? 'depart-lightning'
                    : st.mode === 'inversion' ? 'depart-inversion'
                    : 'depart-iris'
    runLoop(animType)
  } else if (phase === 'arriving') {
    resize()
    runLoop('arrive')
    setTimeout(() => st.clear(), 570)
  } else if (phase === 'idle') {
    cancelAnimationFrame(rafId)
    const canvas = cv.value
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }
})

// When the route changes while holding on black → start arrival animation
watch(() => route.fullPath, (n, o) => {
  if (n !== o && st.phase === 'black') {
    setTimeout(() => st.signalArriving(), 160)
  }
})

onUnmounted(() => cancelAnimationFrame(rafId))
</script>

<style scoped>
.st-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
  display: block;
}

/* Portal-crossing inversion — see drawInversionFrame(). The compositor does
   the actual per-pixel inversion; this canvas just paints a white rect. */
.st-inversion {
  mix-blend-mode: difference;
}
</style>
