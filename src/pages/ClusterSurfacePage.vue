<template>
  <q-page class="cs-page bg-black overflow-hidden">
    <canvas ref="canvasEl" class="cs-canvas" />

    <!-- Breadcrumb -->
    <div class="cs-breadcrumb row items-center q-gutter-xs no-wrap">
      <q-btn flat dense size="xs" color="blue-grey-5" icon="mdi-chevron-left" label="Cosmic"
        @click="$router.push('/cosmic')" />
      <span class="text-blue-grey-7 text-caption">/</span>
      <q-btn flat dense size="xs" color="blue-grey-5" :label="clusterName"
        @click="$router.push(`/clusters?cluster=${clusterSlug}`)" />
      <span class="text-blue-grey-7 text-caption">/</span>
      <q-btn flat dense size="xs" color="blue-grey-5" :label="galaxyLabel"
        @click="$router.back()" />
      <span class="text-blue-grey-7 text-caption">/</span>
      <span class="text-blue-grey-3 text-caption">{{ systemName }}</span>
    </div>

    <!-- Generated Galaxy pop overlay -->
    <Transition name="gen-overlay">
      <div v-if="genOverlayOpen" class="cs-gen-overlay" @click.self="genOverlayOpen = false">
        <div class="cs-gen-card">
          <div class="cs-gen-card__header">
            <span class="cs-gen-card__title">GENERATED GALAXY · CLUSTER MEMBER</span>
            <button class="cs-gen-card__close" @click="genOverlayOpen = false">✕</button>
          </div>
          <p class="cs-gen-card__body">
            This world is part of a <strong>computationally generated galaxy</strong> drawn from confirmed membership
            of the <em>{{ clusterName }}</em> cluster. Galaxy positions and cluster membership come from real X-ray
            survey catalog data (Takey 2013 / XMM-Newton). The individual star systems, planetary architectures, and
            surface environments are generated from a deterministic seed derived from each galaxy's catalog ID —
            they are not observationally confirmed, but they are stable and permanent.
          </p>
          <p class="cs-gen-card__body">
            Settlement addresses on generated cluster worlds are as valid as any confirmed-exoplanet settlement.
            Your exolocation NFT pins to the same coordinate in every session.
          </p>
          <div class="cs-gen-card__footer">
            <span class="cs-gen-card__tag">{{ galaxyLabel }}</span>
            <span class="cs-gen-card__tag">{{ clusterName }}</span>
            <span class="cs-gen-card__tag">{{ spectral }}-type host</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Planet info panel -->
    <div class="cs-info-panel">
      <div class="text-caption text-blue-grey-5 row items-center no-wrap"
           style="letter-spacing:0.1em;font-size:9px;gap:4px">
        <span>GENERATED GALAXY · CLUSTER MEMBER</span>
        <button class="cs-info-badge" @click="genOverlayOpen = true" title="What is a generated galaxy?">ⓘ</button>
      </div>
      <div class="text-subtitle2 text-blue-grey-2 q-mt-xs">{{ systemName }}</div>
      <div class="text-caption text-blue-grey-5 q-mb-sm">{{ planetLabel }}</div>

      <div class="cs-stat-row"><span class="cs-stat-key">Biome</span><span class="cs-stat-val">{{ biomeLabel }}</span></div>
      <div class="cs-stat-row"><span class="cs-stat-key">Surface temp</span><span class="cs-stat-val">{{ eqtK }} K</span></div>
      <div class="cs-stat-row"><span class="cs-stat-key">Star type</span><span :style="{color: specColor}" class="cs-stat-val">{{ spectral }}-type</span></div>
      <div class="cs-stat-row"><span class="cs-stat-key">Host cluster</span><span class="cs-stat-val">{{ clusterName }}</span></div>

      <q-separator color="blue-grey-8" class="q-my-sm" />

      <div class="text-caption text-blue-grey-7 q-mb-sm" style="font-size:9px;line-height:1.5">
        Exolocation address:<br />
        <span class="text-cyan-8">{{ exolocation }}</span>
      </div>

      <div class="row q-gutter-xs">
        <q-btn dense rounded unelevated size="sm"
          :color="hasThisSettlement ? 'teal-8' : 'amber-9'"
          :icon="hasThisSettlement ? 'mdi-home-circle' : 'mdi-map-marker-plus'"
          :label="hasThisSettlement ? 'Use Your Settlement' : 'Create a Settlement'"
          @click="goSettle" />
        <q-btn dense rounded unelevated size="sm" color="blue-grey-8" icon="mdi-moon-waning-crescent"
          label="Moon"
          :disable="!canGoMoon"
          :title="canGoMoon ? 'View moon surface' : 'Already on moon — sub-lunar territory not mapped'"
          @click="goMoon" />
      </div>
    </div>

    <!-- Atmosphere label -->
    <div class="cs-atm-label text-caption text-blue-grey-6" style="font-size:9px">
      {{ atmosphereLabel }}
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { surfacePaletteFor, disposeScene, type SurfacePalette } from 'src/lib/three-utils'
import { useSettlements, clusterKey }               from 'src/lib/settlements'

// ── UI state ───────────────────────────────────────────────────────────────────
const genOverlayOpen = ref(false)

// ── Route ──────────────────────────────────────────────────────────────────────
const route  = useRoute()
const router = useRouter()

const clusterSlug = computed(() => String(route.params.clusterSlug ?? ''))
const memberId    = computed(() => String(route.params.memberId    ?? ''))
const systemIdx   = computed(() => Number(route.params.systemIdx   ?? 0))

// Query params from ClusterGalaxyPage
const eqtK      = computed(() => Number(route.query.eqt     ?? 285))
const spectral  = computed(() => String(route.query.spec    ?? 'G'))
const nPlanets  = computed(() => Number(route.query.planets ?? 3))
const systemName  = computed(() => String(route.query.name   ?? `System-${systemIdx.value}`))
const moonDepth   = computed(() => (systemName.value.match(/-moon/g) ?? []).length)
const canGoMoon   = computed(() => moonDepth.value === 0)
const clusterName = computed(() => String(route.query.cluster ?? clusterSlug.value))

// ── Derived display ────────────────────────────────────────────────────────────
const SPEC_COLOR: Record<string, string> = {
  O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
  G: '#ffe4aa', K: '#ffbe6e', M: '#ff8250',
}
const specColor = computed(() => SPEC_COLOR[spectral.value] ?? '#aaaaaa')

const planetIdx   = computed(() => systemIdx.value % Math.max(1, nPlanets.value))
const planetLabel = computed(() => `Planet ${String.fromCharCode(98 + planetIdx.value)}`)   // b, c, d…

// Galaxy morphology passed from ClusterGalaxyPage via query (for galaxy-in-sky sprite)
const memberHubble = computed(() => String(route.query.morph ?? 'E'))
const pal          = computed(() => surfacePaletteFor(eqtK.value))

const biomeLabel = computed(() => {
  const t = eqtK.value
  if (t < 130) return 'Frozen · Cryogenic'
  if (t < 200) return 'Tundra · Ice sheets'
  if (t < 260) return 'Cold desert · Permafrost'
  if (t < 290) return 'Temperate · Habitable zone'
  if (t < 350) return 'Arid · Savanna'
  if (t < 440) return 'Hot desert · Volcanic margins'
  return 'Molten · Uninhabitable'
})

const atmosphereLabel = computed(() => {
  const t = eqtK.value
  if (t < 150) return 'Dense nitrogen-methane ice atmosphere'
  if (t < 220) return 'Thin CO₂ atmosphere · trace nitrogen'
  if (t < 290) return 'Mixed nitrogen-oxygen atmosphere'
  if (t < 380) return 'Dense CO₂ greenhouse atmosphere'
  return 'Tenuous sulfuric atmosphere'
})

const galaxyLabel  = computed(() => memberId.value.length > 12 ? memberId.value.substring(0, 12) + '…' : memberId.value)
const exolocation  = computed(() => `exo-cluster-v1:${clusterSlug.value}:${memberId.value}:${systemName.value}:${planetLabel.value}`)
const mintUrl      = computed(() => `/mint?mode=cluster-world&cluster=${encodeURIComponent(clusterSlug.value)}&galaxy=${encodeURIComponent(memberId.value)}&system=${encodeURIComponent(systemName.value)}&planet=${planetLabel.value}`)

const { hasSettlement, addSettlement } = useSettlements()
const settlementKey     = computed(() => clusterKey(clusterSlug.value, memberId.value, systemName.value, planetLabel.value))
const hasThisSettlement = computed(() => hasSettlement(settlementKey.value))

function goSettle() {
  if (!hasThisSettlement.value) {
    addSettlement({
      key:         settlementKey.value,
      type:        'cluster',
      planetName:  planetLabel.value,
      hostname:    systemName.value,
      exolocation: exolocation.value,
      displayName: `${systemName.value} · ${planetLabel.value} (${clusterName.value})`,
      clusterSlug: clusterSlug.value,
      memberId:    memberId.value,
    })
  }
  void router.push(mintUrl.value)
}

// ── Seeded RNG ──────────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeSeed(s: string) {
  return s.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0) & 0xFFFFFFFF
}

// ── Three.js scene ─────────────────────────────────────────────────────────────
const canvasEl = ref<HTMLCanvasElement>()
let renderer:  THREE.WebGLRenderer | null = null
let scene:     THREE.Scene | null = null
let camera:    THREE.PerspectiveCamera | null = null
let controls:  OrbitControls | null = null
let rafId:     number | null = null

function buildTerrain(pal: SurfacePalette, rng: () => number): THREE.Mesh {
  const W = 64, H = 64
  const geo = new THREE.PlaneGeometry(28, 28, W - 1, H - 1)
  geo.rotateX(-Math.PI / 2)

  const pos  = geo.attributes['position'] as THREE.BufferAttribute
  const cols = new Float32Array(pos.count * 3)
  const col3 = new THREE.Color()

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i)
    // Multi-frequency height via sum of sines — no noise lib needed
    const h = Math.sin(x * 0.28) * 0.6
            + Math.sin(z * 0.34) * 0.5
            + Math.sin((x + z) * 0.18) * 0.9
            + (rng() - 0.5) * 0.25
    pos.setY(i, h)

    // Blend terrain → rock by height
    const t = Math.min(1, Math.max(0, (h + 1.0) / 2.5))
    col3.lerpColors(pal.terrain, pal.rock, t)
    cols[i * 3]     = col3.r
    cols[i * 3 + 1] = col3.g
    cols[i * 3 + 2] = col3.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3))
  geo.computeVertexNormals()

  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.FrontSide })
  return new THREE.Mesh(geo, mat)
}

function buildGalaxyInSky(morph: string): THREE.Sprite {
  const cv  = document.createElement('canvas')
  cv.width  = cv.height = 128
  const ctx = cv.getContext('2d')!
  const cx  = 64
  const isSpiral = morph === 'Sa' || morph === 'Sb'
  const coreRgb  = isSpiral ? '160,190,255' : '255,200,130'

  ctx.save(); ctx.beginPath(); ctx.arc(cx, cx, cx, 0, Math.PI * 2); ctx.clip()
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.85)
  g.addColorStop(0.00, `rgba(255,255,255,0.85)`)
  g.addColorStop(0.08, `rgba(${coreRgb},0.60)`)
  g.addColorStop(0.30, `rgba(${coreRgb},0.22)`)
  g.addColorStop(0.65, `rgba(${coreRgb},0.06)`)
  g.addColorStop(1.00, `rgba(${coreRgb},0)`)
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
  ctx.restore()

  const tex = new THREE.CanvasTexture(cv)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.setScalar(2.2)
  return sprite
}

function buildHostStar(spec: string): THREE.Sprite {
  const col = SPEC_COLOR[spec] ?? '#ffe4aa'
  const cv  = document.createElement('canvas')
  cv.width  = cv.height = 64
  const ctx = cv.getContext('2d')!
  const cx  = 32
  const c   = new THREE.Color(col)
  const rgb = `${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)}`

  ctx.save(); ctx.beginPath(); ctx.arc(cx, cx, cx, 0, Math.PI * 2); ctx.clip()
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.7)
  g.addColorStop(0,    `rgba(255,255,255,1.0)`)
  g.addColorStop(0.06, `rgba(255,255,255,0.90)`)
  g.addColorStop(0.14, `rgba(${rgb},0.80)`)
  g.addColorStop(0.40, `rgba(${rgb},0.30)`)
  g.addColorStop(0.80, `rgba(${rgb},0.06)`)
  g.addColorStop(1,    `rgba(${rgb},0)`)
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64)
  ctx.restore()

  const tex = new THREE.CanvasTexture(cv)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.setScalar(0.8)
  return sprite
}

function buildDome(): THREE.Group {
  const group = new THREE.Group()

  // Dome wireframe
  const domeGeo = new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  const domeMat = new THREE.MeshBasicMaterial({
    color: 0x334455, wireframe: true, transparent: true, opacity: 0.35,
  })
  group.add(new THREE.Mesh(domeGeo, domeMat))

  // Base ring
  const ringGeo = new THREE.RingGeometry(0.88, 0.94, 32)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x556677, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  const ring    = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = -Math.PI / 2
  group.add(ring)

  // Interior glow
  const glowGeo = new THREE.SphereGeometry(0.85, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x112233, transparent: true, opacity: 0.18, side: THREE.BackSide })
  group.add(new THREE.Mesh(glowGeo, glowMat))

  return group
}

function buildScene() {
  if (!canvasEl.value) return

  const rng = mulberry32(makeSeed(`${clusterSlug.value}-${memberId.value}-${systemIdx.value}`))

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x02040a)

  scene  = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 200)

  const b      = parseFloat(String(route.query.bearing ?? '0')) || 0
  const entryD = 9
  camera.position.set(Math.sin(b) * entryD, 3.5, Math.cos(b) * entryD)
  camera.lookAt(0, 0.5, 0)

  // Sky gradient (hemisphere) — tint from atmosphere color or default deep blue
  const skyColor = pal.value.atmosphere ?? new THREE.Color(0x050a14)
  const sky = new THREE.HemisphereLight(skyColor, new THREE.Color(0x02040a), 0.8)
  scene.add(sky)

  // Directional light (host star)
  const sun = new THREE.DirectionalLight(new THREE.Color(specColor.value), 1.6)
  sun.position.set(8, 6, -4)
  scene.add(sun)

  // Terrain
  const terrain = buildTerrain(pal.value, rng)
  terrain.position.y = -0.8
  scene.add(terrain)

  // Settlement dome
  const dome = buildDome()
  dome.position.set(rng() * 2 - 1, -0.8, rng() * 2 - 3)
  scene.add(dome)

  // Host star in sky
  const star = buildHostStar(spectral.value)
  const starAngle = rng() * Math.PI * 0.6 + 0.2
  star.position.set(Math.cos(starAngle) * 12, Math.sin(starAngle) * 5 + 2, -14)
  scene.add(star)

  // Parent galaxy glow in sky
  const galaxyGlow = buildGalaxyInSky(memberHubble.value)
  galaxyGlow.position.set(-8 + rng() * 4, 3 + rng() * 2, -18)
  scene.add(galaxyGlow)

  // Fog
  if (pal.value.fog) scene.fog = new THREE.FogExp2(pal.value.fog.getHex(), pal.value.fogDensity)

  // Distant cluster haze (faint background glow)
  for (let i = 0; i < 6; i++) {
    const haze = new THREE.Sprite(new THREE.SpriteMaterial({
      color: new THREE.Color(specColor.value),
      transparent: true, opacity: 0.03 + rng() * 0.04,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }))
    haze.scale.setScalar(6 + rng() * 10)
    haze.position.set((rng() - 0.5) * 40, (rng() - 0.2) * 8, -20 - rng() * 20)
    scene.add(haze)
  }

  // Wormhole pyramid (settlement marker)
  const pyrGeo = new THREE.ConeGeometry(0.18, 0.5, 4)
  const pyrMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, wireframe: true, transparent: true, opacity: 0.55 })
  const pyr    = new THREE.Mesh(pyrGeo, pyrMat)
  pyr.position.set(0.4, -0.5, -0.5)
  scene.add(pyr)

  // Orbit controls — drag to rotate, pinch/scroll to zoom, right-drag to pan
  controls = new OrbitControls(camera, canvasEl.value)
  controls.target.set(0, 0.5, 0)
  controls.enableDamping  = true
  controls.dampingFactor  = 0.08
  controls.minDistance    = 0.8
  controls.maxDistance    = 16
  controls.minPolarAngle  = 0.05
  controls.maxPolarAngle  = Math.PI * 0.60
  controls.rotateSpeed    = 0.5
  controls.mouseButtons   = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
  controls.touches        = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
  controls.update()

  window.addEventListener('resize', onResize)
  tick()
}

function tick() {
  rafId = requestAnimationFrame(tick)
  controls?.update()
  if (scene && camera && renderer) renderer.render(scene, camera)
}

function onResize() {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function teardown() {
  if (rafId !== null) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onResize)
  controls?.dispose(); controls = null
  if (scene) disposeScene(scene)
  renderer?.dispose()
  renderer = null; scene = null; camera = null
}

function goMoon() {
  // Navigate to moon surface: same system, increment planet letter
  router.push({
    name: 'cluster-surface',
    params: { clusterSlug: clusterSlug.value, memberId: memberId.value, systemIdx: systemIdx.value + 100 },
    query: { ...route.query, name: `${systemName.value}-moon` },
  })
}

onMounted(() => {
  buildScene()
  if (camera && controls) {
    gsap.to(camera.position, {
      x: 0, y: 1.6, z: 3.0,
      duration: 1.2, ease: 'power3.out',
      onUpdate: () => { controls?.update() },
    })
  }
})
onBeforeUnmount(teardown)
</script>

<style scoped>
.cs-page   { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.cs-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

.cs-breadcrumb {
  position: absolute; top: 12px; left: 12px; z-index: 10;
  background: rgba(2,4,10,0.75); padding: 4px 10px; border-radius: 20px;
  backdrop-filter: blur(4px);
}

.cs-info-panel {
  position: absolute; top: 50px; right: 16px; z-index: 10;
  background: rgba(2,4,10,0.88); padding: 14px;
  border-radius: 8px; border: 1px solid #1a2a3a;
  backdrop-filter: blur(6px); min-width: 210px; max-width: 250px;
}
.cs-stat-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; gap: 8px; }
.cs-stat-key { color: #556677; flex-shrink: 0; }
.cs-stat-val { color: #99aabb; text-align: right; }

.cs-atm-label {
  position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
  background: rgba(2,4,10,0.70); padding: 4px 12px; border-radius: 20px;
  backdrop-filter: blur(4px); white-space: nowrap;
}

/* ─ Generated galaxy info badge ──────────────────────────────────────────────── */

.cs-info-badge {
  background: none;
  border: none;
  color: rgba(0, 180, 220, 0.55);
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  padding: 0;
  transition: color 0.15s ease;
  flex-shrink: 0;
}
.cs-info-badge:hover { color: rgba(0, 220, 255, 0.95); }

/* ─ Generated galaxy pop overlay ────────────────────────────────────────────── */

.cs-gen-overlay {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 2, 14, 0.55);
  backdrop-filter: blur(6px);
}

.cs-gen-card {
  background: rgba(2, 6, 22, 0.96);
  border: 1px solid rgba(0, 100, 160, 0.30);
  border-radius: 10px;
  padding: 20px 22px;
  max-width: 420px;
  width: calc(100% - 40px);
  font-family: 'Courier New', monospace;
}

.cs-gen-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.cs-gen-card__title {
  font-size: 9.5px;
  letter-spacing: 0.12em;
  color: rgba(0, 200, 255, 0.85);
  line-height: 1.4;
}

.cs-gen-card__close {
  background: none;
  border: none;
  color: rgba(100, 150, 190, 0.55);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  flex-shrink: 0;
  padding: 0;
  transition: color 0.15s ease;
}
.cs-gen-card__close:hover { color: rgba(220, 90, 90, 0.90); }

.cs-gen-card__body {
  font-size: 11px;
  line-height: 1.7;
  color: rgba(140, 180, 215, 0.80);
  margin: 0 0 10px;
}
.cs-gen-card__body strong { color: rgba(0, 210, 255, 0.90); font-weight: normal; }
.cs-gen-card__body em     { color: rgba(180, 220, 255, 0.80); font-style: normal; }

.cs-gen-card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.cs-gen-card__tag {
  font-size: 9px;
  letter-spacing: 0.09em;
  color: rgba(80, 160, 200, 0.65);
  background: rgba(0, 60, 100, 0.25);
  border: 1px solid rgba(0, 100, 160, 0.20);
  border-radius: 3px;
  padding: 2px 8px;
}

.gen-overlay-enter-active,
.gen-overlay-leave-active {
  transition: opacity 0.20s ease;
}
.gen-overlay-enter-from,
.gen-overlay-leave-to {
  opacity: 0;
}
</style>
