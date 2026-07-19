<template>
  <!-- Transparent overlay — shared Three.js canvas in MainLayout renders behind -->
  <q-page class="vg-page viz-overlay-page"
    @mousedown="onDragStart"
    @mousemove="onPageMouseMove(); onDragMove($event)"
    @mouseup="onDragEnd"
    @mouseleave="onDragEnd"
    @click="onCanvasClick"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
  >

    <!-- Breadcrumb (auto-hides) -->
    <transition name="vg-fade">
      <div v-show="uiVisible" class="vg-breadcrumb row items-center q-gutter-xs no-wrap">
        <q-btn flat dense size="xs" color="blue-grey-5" icon="mdi-chevron-left" label="Cosmic"
          @click="$router.push('/cosmic')" />
        <span class="text-blue-grey-7 text-caption">/</span>
        <q-btn flat dense size="xs" color="blue-grey-5" :label="voidDisplayName"
          @click="goBackToVoid" />
        <span class="text-blue-grey-7 text-caption">/</span>
        <span class="text-blue-grey-4 text-caption vg-path-label">{{ shortGid }}</span>
      </div>
    </transition>

    <!-- Header (auto-hides) -->
    <transition name="vg-fade">
      <div v-show="uiVisible" class="vg-header">
        <div class="vg-eyebrow">VOID GALAXY · {{ morphDesc }}</div>
        <div class="vg-galaxy-name">{{ shortGid }}</div>
        <div class="vg-subtitle">
          {{ voidDisplayName }}
          <template v-if="galaxyZ"> · z={{ galaxyZ }}</template>
          <template v-if="systems.length"> · {{ systems.length }} systems</template>
        </div>
      </div>
    </transition>

    <!-- System info panel (shown on selection) -->
    <Transition name="vg-slide">
      <div v-if="selected" class="vg-panel">
        <div class="vg-panel-hdr">
          <div class="text-caption text-cyan-8" style="letter-spacing:0.10em">STAR SYSTEM</div>
          <q-btn flat dense size="xs" icon="mdi-close" color="blue-grey-5"
            @click="selected = null; clearRing()" />
        </div>
        <div class="text-subtitle2 text-blue-grey-2 q-mb-xs">{{ selected.name }}</div>
        <div class="vg-detail-row">
          <span class="vg-lbl">Spectral type</span>
          <span :style="{ color: selected.specColor }">{{ selected.spectral }}-type</span>
        </div>
        <div class="vg-detail-row">
          <span class="vg-lbl">Est. planets</span>
          <span class="text-blue-grey-3">{{ selected.planetCount }}</span>
        </div>
        <div class="vg-detail-row">
          <span class="vg-lbl">Surface temp</span>
          <span class="text-blue-grey-3">{{ selected.eqtRange }}</span>
        </div>
        <div class="vg-detail-row">
          <span class="vg-lbl">Settlement tier</span>
          <span :class="tierColor(selected.tier)">{{ selected.tier }}</span>
        </div>
        <q-separator color="blue-grey-8" class="q-my-sm" />
        <div class="text-caption text-blue-grey-6 q-mb-sm vg-flavour">
          Void galaxy field system — isolated in the Great Emptiness.
          Frontier territory beyond current settlement maps.
        </div>
        <div class="row q-gutter-xs">
          <q-btn dense rounded unelevated size="sm" color="cyan-9"
            icon="mdi-telescope" label="Enter system"
            @click="descendTo(selected)" />
          <q-btn dense rounded unelevated size="sm" color="amber-9"
            icon="mdi-map-marker-plus" label="Settle"
            @click="goSettle(selected)" />
        </div>
      </div>
    </Transition>

    <!-- Footer -->
    <div class="vg-footer">
      <span class="text-caption text-blue-grey-7">
        <span class="text-cyan-9">{{ systems.length }}</span> star systems
        · {{ morphDesc }}
        <span v-if="isWall" class="q-ml-xs text-blue-grey-8">· wall-band</span>
        <span v-if="hasAgn" class="q-ml-xs text-amber-9">· AGN</span>
        <span class="q-ml-xs text-blue-grey-9">· click a star to select</span>
      </span>
    </div>

    <div v-if="loading" class="vg-loading">
      <q-spinner-orbit color="cyan-7" size="48px" />
      <div class="text-caption text-blue-grey-5 q-mt-sm">Loading void data…</div>
    </div>
    <div v-if="error" class="vg-loading">
      <q-icon name="mdi-alert-circle-outline" color="amber-7" size="48px" />
      <div class="text-caption text-blue-grey-4 q-mt-sm">{{ error }}</div>
      <q-btn flat dense color="cyan-7" label="Back" class="q-mt-sm" @click="goBackToVoid" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useVizRenderer, VIZ_BAR_H } from 'src/composables/useVizRenderer'
import { disposeScene } from 'src/lib/three-utils'
import { useSceneTransitionStore } from 'src/stores/scene-transition'
import type { VoidGalaxy } from 'src/data/void-oracle.types'
import { loadVoidOracle } from 'src/lib/void-oracle'
import { useSettlements, clusterKey } from 'src/lib/settlements'

// ── Route ──────────────────────────────────────────────────────────────────────

const route      = useRoute()
const router     = useRouter()
const transition = useSceneTransitionStore()

const voidId = computed(() => String(route.params.voidId ?? 'bootes-void'))
const gid    = computed(() => String(route.params.gid    ?? ''))

// Query params passed from VoidInteriorPage click
const queryMorph = computed(() => String(route.query.morph  ?? 'Sb'))
const queryColor = computed(() => String(route.query.color  ?? '5577aa'))
const galaxyZ    = computed(() => route.query.z ? Number(route.query.z).toFixed(4) : '')
const isWall     = computed(() => route.query.wall === '1')
const hasAgn     = computed(() => route.query.agn  === '1')

// ── Display ────────────────────────────────────────────────────────────────────

const voidDisplayName = computed(() => voidId.value.replace(/-/g, ' ').toUpperCase())

const shortGid = computed(() => {
  const parts = gid.value.split('_')
  return parts.length >= 3
    ? `${(parts[1] ?? 'gal').toUpperCase()}-${parts[2] ?? '?'}`
    : gid.value.slice(0, 16)
})

const MORPH_DESC: Record<string, string> = {
  cD: 'Brightest Cluster Galaxy', E: 'Elliptical', S0: 'Lenticular',
  Sa: 'Early Spiral', Sb: 'Barred Spiral', Irr: 'Irregular',
}
const morphDesc = computed(() => MORPH_DESC[queryMorph.value] ?? 'Galaxy')

const SPEC_COLOR: Record<string, string> = {
  O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
  G: '#ffe4aa', K: '#ffbe6e', M: '#ff8250',
}

function tierColor(tier: string): string {
  if (tier === 'candidate') return 'text-cyan-5'
  if (tier === 'frontier')  return 'text-amber-6'
  return 'text-blue-grey-5'
}

// ── UI auto-hide ──────────────────────────────────────────────────────────────

const uiVisible = ref(true)
let hideTimer: ReturnType<typeof setTimeout> | null = null

function scheduleHide() {
  if (hideTimer) clearTimeout(hideTimer)
  uiVisible.value = true
  hideTimer = setTimeout(() => { uiVisible.value = false }, 5000)
}
function onPageMouseMove() { scheduleHide() }

// ── Star system data ──────────────────────────────────────────────────────────

const loading  = ref(true)
const error    = ref('')
const systems  = shallowRef<VoidStarSystem[]>([])
const selected = ref<VoidStarSystem | null>(null)

interface VoidStarSystem {
  idx:         number
  name:        string
  spectral:    string
  specColor:   string
  planetCount: number
  eqtRange:    string
  eqtK:        number
  tier:        string
  pos:         THREE.Vector3
}

// Seeded PRNG — matches ClusterSurfacePage + fetch script convention
function mulberry32(seed: number) {
  let t = seed + 0x6D2B79F5
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function nameHash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  }
  return h >>> 0
}

// Void galaxies are late-type dominated — spectral weights skewed toward K/M
const SPEC_WEIGHTS: Record<string, number[]> = {
  // Cumulative weights for [M, K, G, F, A, B, O]
  E:   [50, 80, 92, 97, 99, 100, 100],
  cD:  [55, 85, 95, 98, 99, 100, 100],
  S0:  [44, 74, 88, 94, 97,  99, 100],
  Sa:  [38, 66, 82, 90, 95,  98, 100],
  Sb:  [32, 58, 76, 86, 93,  98, 100],
  Irr: [28, 52, 70, 80, 87,  95, 100],
}
const SPEC_LABELS = ['M', 'K', 'G', 'F', 'A', 'B', 'O']

const MORPH_SYS_COUNT: Record<string, number> = {
  cD: 6, E: 5, S0: 9, Sa: 12, Sb: 18, Irr: 11
}

function pickSpec(morph: string, rng: () => number): string {
  const w = SPEC_WEIGHTS[morph] ?? SPEC_WEIGHTS.Sb!
  const r = rng() * 100
  for (let i = 0; i < w.length; i++) if (r < w[i]!) return SPEC_LABELS[i] ?? 'M'
  return 'M'
}

function generateSystems(gidVal: string, morph: string): VoidStarSystem[] {
  const seed    = nameHash(gidVal)
  const rng     = mulberry32(seed)
  const count   = MORPH_SYS_COUNT[morph] ?? 12
  // Catalog number: stable 4-digit label for display
  const catNum  = nameHash(gidVal + 'display') % 9000 + 1000
  // Disk height factor: thin for spirals, thick/spherical for E/Irr
  const diskH   = morph === 'E' || morph === 'cD' ? 0.8
                : morph === 'Irr' ? 0.55
                : 0.16

  return Array.from({ length: count }, (_, i) => {
    const spec = pickSpec(morph, rng)
    const r    = 2.8 + rng() * 6.2
    const th   = rng() * Math.PI * 2

    const eqtBase = (spec === 'O' || spec === 'B') ? 320 + rng() * 180
                  : (spec === 'A' || spec === 'F') ? 200 + rng() * 180
                  : spec === 'G'                   ? 180 + rng() * 200
                  :                                  140 + rng() * 180
    const eqtK    = Math.round(eqtBase)
    const nPl     = 1 + Math.floor(rng() * 5)
    const tier    = (spec === 'G' || spec === 'K') && eqtK >= 250 && eqtK <= 390
                    ? (rng() < 0.14 ? 'candidate' : 'frontier')
                    : 'theoretical'

    return {
      idx:         i,
      name:        `VGX ${catNum} ${String.fromCharCode(65 + i)}`,
      spectral:    spec,
      specColor:   SPEC_COLOR[spec] ?? '#ffbe6e',
      planetCount: nPl,
      eqtRange:    `${Math.round(eqtK * 0.82)}–${Math.round(eqtK * 1.18)} K`,
      eqtK,
      tier,
      pos: new THREE.Vector3(r * Math.cos(th), (rng() - 0.5) * diskH * r, r * Math.sin(th)),
    }
  })
}

// ── Navigation ────────────────────────────────────────────────────────────────

const { hasSettlement, addSettlement } = useSettlements()

async function goBackToVoid() {
  await transition.depart(50, 50, 'iris', 0)
  void router.push({
    name:   'void-interior',
    params: { voidId: voidId.value },
    query:  { name: voidDisplayName.value, radius: '130', dist: '250', conduit: '1' },
  })
}

async function descendTo(sys: VoidStarSystem) {
  let ox = 50, oy = 50
  if (camera) {
    const sc = sys.pos.clone().project(camera)
    ox = (sc.x + 1) / 2 * 100
    oy = (1 - sc.y) / 2 * 100
  }
  const bearing = Math.atan2(oy / 100 - 0.5, ox / 100 - 0.5)
  await transition.depart(ox, oy, 'lightning', bearing)
  void router.push({
    name:   'cluster-surface',
    params: { clusterSlug: `void-${voidId.value}`, memberId: gid.value, systemIdx: sys.idx },
    query:  {
      name:    sys.name,
      spec:    sys.spectral,
      eqt:     sys.eqtK,
      planets: sys.planetCount,
      cluster: voidDisplayName.value,
      morph:   queryMorph.value,
      bearing: bearing.toFixed(3),
    },
  })
}

function goSettle(sys: VoidStarSystem) {
  const key = clusterKey(`void-${voidId.value}`, gid.value, sys.name, 'b')
  if (!hasSettlement(key)) {
    addSettlement({
      key,
      type:        'cluster',
      planetName:  'b',
      hostname:    sys.name,
      exolocation: `exo-void-v1:${voidId.value}:${gid.value}:${sys.name}:b`,
      displayName: `${sys.name} · b (${voidDisplayName.value})`,
      clusterSlug: `void-${voidId.value}`,
      memberId:    gid.value,
    })
  }
  void descendTo(sys)
}

// ── Three.js — shared renderer ────────────────────────────────────────────────

const viz = useVizRenderer()
let renderer:   THREE.WebGLRenderer     | null = null
let scene:      THREE.Scene             | null = null
let camera:     THREE.PerspectiveCamera | null = null
let controls:   OrbitControls           | null = null
let _stopTick: (() => void) | null = null
let sysMarkers: THREE.Mesh[]      = []
let ringMesh:   THREE.Mesh | null = null

// Root group for all page-level scene objects — added/removed on mount/unmount
const pageGroup = new THREE.Group()

const orbit = { theta: 0.0, phi: Math.PI * 0.40 }
const drag  = { active: false, lastX: 0, lastY: 0 }
const touch = { lastX: 0, lastY: 0 }
let dragMoved = 0

function updateCamera() {
  if (!camera) return
  const sp = Math.sin(orbit.phi), cp = Math.cos(orbit.phi)
  camera.position.set(22 * sp * Math.sin(orbit.theta), 22 * cp, 22 * sp * Math.cos(orbit.theta))
  camera.lookAt(0, 0, 0)
}

function onDragStart(e: MouseEvent) { drag.active = true; drag.lastX = e.clientX; drag.lastY = e.clientY; dragMoved = 0 }
function onDragMove(e: MouseEvent) {
  if (!drag.active) return
  const dx = e.clientX - drag.lastX, dy = e.clientY - drag.lastY
  dragMoved   += Math.abs(dx) + Math.abs(dy)
  orbit.theta -= dx * 0.007
  orbit.phi    = Math.max(0.10, Math.min(Math.PI - 0.10, orbit.phi - dy * 0.007))
  drag.lastX   = e.clientX; drag.lastY = e.clientY
}
function onDragEnd() { drag.active = false }

function onTouchStart(e: TouchEvent) {
  if (e.touches[0]) { touch.lastX = e.touches[0].clientX; touch.lastY = e.touches[0].clientY; dragMoved = 0 }
}
function onTouchMove(e: TouchEvent) {
  if (!e.touches[0]) return
  const dx = e.touches[0].clientX - touch.lastX, dy = e.touches[0].clientY - touch.lastY
  dragMoved   += Math.abs(dx) + Math.abs(dy)
  orbit.theta -= dx * 0.007
  orbit.phi    = Math.max(0.10, Math.min(Math.PI - 0.10, orbit.phi - dy * 0.007))
  touch.lastX  = e.touches[0].clientX; touch.lastY = e.touches[0].clientY
}
function onTouchEnd() { drag.active = false }

function onCanvasClick(e: MouseEvent) {
  if (dragMoved > 6 || !camera || sysMarkers.length === 0) return
  const w = window.innerWidth, h = window.innerHeight - VIZ_BAR_H
  const rc = new THREE.Raycaster()
  rc.setFromCamera(
    new THREE.Vector2(
      (e.clientX / w) * 2 - 1,
      -((e.clientY - VIZ_BAR_H) / h) * 2 + 1,
    ),
    camera,
  )
  const hits = rc.intersectObjects(sysMarkers, false)
  if (!hits.length) { selected.value = null; clearRing(); return }
  const sys = systems.value[(hits[0]!.object as THREE.Mesh).userData.sysIdx as number]
  if (!sys) return
  selected.value = sys
  placeRing(sys)
}

function clearRing() {
  if (!ringMesh) return
  pageGroup.remove(ringMesh)
  ringMesh.geometry.dispose()
  ;(ringMesh.material as THREE.Material).dispose()
  ringMesh = null
}

function placeRing(sys: VoidStarSystem) {
  if (!camera) return
  clearRing()
  const geo  = new THREE.TorusGeometry(0.44, 0.045, 8, 32)
  const mat  = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.88, depthWrite: false })
  ringMesh   = new THREE.Mesh(geo, mat)
  ringMesh.position.copy(sys.pos)
  ringMesh.lookAt(camera.position)
  pageGroup.add(ringMesh)
}

// Lightweight seeded RNG for scene geometry only
function sceneRng(seed: number) {
  let s = seed ^ 0xdeadbeef
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff }
}

const SPEC_INT_COLOR: Record<string, number> = {
  O: 0x9bb0ff, B: 0xaabfff, A: 0xcad7ff, F: 0xf8f7ff,
  G: 0xffe4aa, K: 0xffbe6e, M: 0xff8250,
}

function buildScene(sysList: VoidStarSystem[], morph: string, colHex: string) {
  // Grab shared renderer refs
  renderer = viz.renderer
  scene    = viz.scene
  camera   = viz.camera
  controls = viz.controls
  if (!renderer || !scene || !camera || !controls) return

  // This page drives the camera with its own orbit math (no OrbitControls) —
  // disable the shared controls so a drag here isn't double-handled by both.
  controls.enabled = false

  scene.background = new THREE.Color(0x000002)

  camera.fov  = 55
  camera.near = 0.1
  camera.far  = 200
  updateCamera()
  camera.updateProjectionMatrix()

  scene.add(pageGroup)

  const baseColor = new THREE.Color(`#${colHex}`)
  const rng       = sceneRng(nameHash(gid.value + 'scene'))

  // ── Deep background: very sparse — you are deep in the void ────────────────
  const BG_N  = 75
  const bgPos = new Float32Array(BG_N * 3)
  const bgCol = new Float32Array(BG_N * 3)
  for (let i = 0; i < BG_N; i++) {
    const t = rng() * Math.PI * 2, p = Math.acos(2 * rng() - 1), r = 55 + rng() * 28
    bgPos[i*3]   = r * Math.sin(p) * Math.cos(t)
    bgPos[i*3+1] = r * Math.sin(p) * Math.sin(t)
    bgPos[i*3+2] = r * Math.cos(p)
    const w = rng()
    bgCol[i*3]   = 0.55 + w * 0.45
    bgCol[i*3+1] = 0.62 + w * 0.38
    bgCol[i*3+2] = 0.78 + w * 0.22
  }
  const bgGeo = new THREE.BufferGeometry()
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3))
  bgGeo.setAttribute('color',    new THREE.BufferAttribute(bgCol, 3))
  pageGroup.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
    size: 0.28, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.35, depthWrite: false,
  })))

  // ── Galaxy disk particle field ──────────────────────────────────────────────
  const DISK_N: Record<string, number> = { cD: 180, E: 140, S0: 200, Sa: 260, Sb: 340, Irr: 180 }
  const ND    = DISK_N[morph] ?? 200
  const diskH = morph === 'E' || morph === 'cD' ? 0.75
              : morph === 'Irr' ? 0.50
              : 0.10
  const dkPos = new Float32Array(ND * 3)
  const dkCol = new Float32Array(ND * 3)
  for (let i = 0; i < ND; i++) {
    const rr = 0.4 + Math.pow(rng(), 0.55) * 9.0
    const tt = rng() * Math.PI * 2
    dkPos[i*3]   = rr * Math.cos(tt)
    dkPos[i*3+1] = (rng() - 0.5) * diskH * rr
    dkPos[i*3+2] = rr * Math.sin(tt)
    const f = 0.45 + rng() * 0.55
    dkCol[i*3]   = Math.min(1, baseColor.r * f + rng() * 0.08)
    dkCol[i*3+1] = Math.min(1, baseColor.g * f + rng() * 0.07)
    dkCol[i*3+2] = Math.min(1, baseColor.b * f + rng() * 0.12)
  }
  const dkGeo = new THREE.BufferGeometry()
  dkGeo.setAttribute('position', new THREE.BufferAttribute(dkPos, 3))
  dkGeo.setAttribute('color',    new THREE.BufferAttribute(dkCol, 3))
  pageGroup.add(new THREE.Points(dkGeo, new THREE.PointsMaterial({
    size: 0.25, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.50, depthWrite: false,
  })))

  // ── Galaxy core ────────────────────────────────────────────────────────────
  const coreGeo = new THREE.SphereGeometry(0.55, 10, 10)
  const coreMat = new THREE.MeshBasicMaterial({
    color: baseColor, transparent: true, opacity: 0.38, depthWrite: false,
  })
  pageGroup.add(new THREE.Mesh(coreGeo, coreMat))

  // AGN hot core
  if (hasAgn.value) {
    const agnGeo = new THREE.SphereGeometry(0.16, 8, 8)
    const agnMat = new THREE.MeshBasicMaterial({
      color: 0xffe080, transparent: true, opacity: 0.90,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    pageGroup.add(new THREE.Mesh(agnGeo, agnMat))
  }

  // ── Star system markers ────────────────────────────────────────────────────
  sysMarkers = []
  sysList.forEach(sys => {
    const geo  = new THREE.SphereGeometry(0.22, 8, 8)
    const mat  = new THREE.MeshBasicMaterial({
      color: SPEC_INT_COLOR[sys.spectral] ?? 0xffbe6e,
      transparent: true, opacity: 0.92,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(sys.pos)
    mesh.userData.sysIdx = sys.idx
    pageGroup.add(mesh)
    sysMarkers.push(mesh)

    // Per-system soft halo
    const hGeo = new THREE.SphereGeometry(0.46, 8, 8)
    const hMat = new THREE.MeshBasicMaterial({
      color: SPEC_INT_COLOR[sys.spectral] ?? 0xffbe6e,
      transparent: true, opacity: 0.09,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const hMesh = new THREE.Mesh(hGeo, hMat)
    hMesh.position.copy(sys.pos)
    pageGroup.add(hMesh)
  })

  _stopTick = viz.addTick(tick)
}

function tick() {
  if (!drag.active) orbit.theta += 0.000115
  if (ringMesh && camera) ringMesh.lookAt(camera.position)
  updateCamera()
}

onMounted(async () => {
  // Await a tick so MainLayout's onMounted (which calls viz.init()) runs first —
  // this page can otherwise mount before the shared renderer exists.
  await Promise.resolve()
  scheduleHide()
  loading.value = true

  if (!gid.value) { error.value = 'No galaxy ID provided'; loading.value = false; return }

  // Load oracle to get actual morph + colour if available
  const oracle  = await loadVoidOracle(voidId.value)
  const galaxy: VoidGalaxy | undefined = oracle?.galaxies.find(g => g.gid === gid.value)

  const morph  = galaxy?.morph ?? queryMorph.value
  const colHex = galaxy ? galaxy.col_hex.replace('#', '') : queryColor.value

  systems.value = generateSystems(gid.value, morph)
  loading.value = false

  buildScene(systems.value, morph, colHex)
})

onUnmounted(() => {
  _stopTick?.(); _stopTick = null
  if (controls) controls.enabled = true
  if (hideTimer) clearTimeout(hideTimer)
  clearRing()

  disposeScene(pageGroup)
  scene?.remove(pageGroup)
  if (scene) scene.background = null
})
</script>

<style scoped>
.vg-page   { position: relative; width: 100%; height: 100vh; cursor: grab; }
.vg-page:active { cursor: grabbing; }

/* ── Breadcrumb ─────────────────────────────────────────────────────────── */
.vg-breadcrumb {
  position: absolute; top: 12px; left: 12px;
  z-index: 10;
  background: rgba(0,0,0,0.55);
  border-radius: 6px;
  padding: 2px 8px;
  pointer-events: auto;
}
.vg-path-label { font-size: 10px; letter-spacing: 0.06em; }

/* ── Header ─────────────────────────────────────────────────────────────── */
.vg-header {
  position: absolute; top: 44px; left: 12px;
  z-index: 10; max-width: 260px;
  pointer-events: none;
}
.vg-eyebrow     { font-size: 9px; letter-spacing: 0.12em; color: rgba(80,120,170,0.70); margin-bottom: 2px; }
.vg-galaxy-name { font-size: 14px; letter-spacing: 0.06em; color: rgba(180,210,240,0.88); font-weight: 500; }
.vg-subtitle    { font-size: 10px; color: rgba(100,130,160,0.70); margin-top: 2px; }

/* ── System info panel ──────────────────────────────────────────────────── */
.vg-panel {
  position: absolute; top: 50%; right: 16px;
  transform: translateY(-50%);
  width: 228px;
  background: rgba(2, 4, 14, 0.92);
  border: 1px solid rgba(60, 90, 140, 0.22);
  border-radius: 8px;
  padding: 14px;
  z-index: 10;
  backdrop-filter: blur(12px);
}
.vg-panel-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.vg-detail-row { display: flex; justify-content: space-between; font-size: 9.5px; line-height: 1.7; color: rgba(180,200,220,0.55); }
.vg-lbl        { color: rgba(80,110,150,0.75); flex-shrink: 0; padding-right: 6px; }
.vg-flavour    { font-size: 9px; line-height: 1.55; }

/* ── Footer ─────────────────────────────────────────────────────────────── */
.vg-footer {
  position: absolute; bottom: 12px; left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.45);
  border-radius: 12px;
  padding: 2px 14px;
  z-index: 10;
  white-space: nowrap;
}

/* ── Loading / error overlay ────────────────────────────────────────────── */
.vg-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: rgba(0,0,2,0.75);
  z-index: 20;
}

/* ── Transitions ────────────────────────────────────────────────────────── */
.vg-fade-enter-active, .vg-fade-leave-active { transition: opacity 0.5s ease; }
.vg-fade-enter-from,  .vg-fade-leave-to      { opacity: 0; }

.vg-slide-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.vg-slide-leave-active { transition: opacity 0.25s ease; }
.vg-slide-enter-from   { opacity: 0; transform: translateY(-50%) translateX(12px); }
.vg-slide-leave-to     { opacity: 0; }
</style>
