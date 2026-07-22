<template>
  <!-- Transparent overlay — shared Three.js canvas in MainLayout renders behind -->
  <q-page class="vi-page viz-overlay-page"
    @click="onClick"
    @mousedown="onDragStart"
    @mousemove="onPageMouseMove(); onDragMove($event)"
    @mouseup="onDragEnd"
    @mouseleave="onDragEnd"
    @touchstart.passive="onTouchDragStart"
    @touchmove.passive="onPageTouchMove(); onTouchDragMove($event)"
    @touchend="onDragEnd"
  >

    <!-- Top overlay: breadcrumb + header (auto-hides) -->
    <transition name="vi-fade">
      <div v-show="uiVisible" class="vi-top-overlay">
        <div class="row items-center q-gutter-xs no-wrap vi-breadcrumb-row">
          <q-btn flat dense size="xs" color="blue-grey-5" icon="mdi-chevron-left" label="Cosmic"
            @click="$router.push('/cosmic')" />
          <span class="text-blue-grey-7 text-caption">/</span>
          <span class="text-blue-grey-4 text-caption vi-path-label">{{ displayName }}</span>
        </div>
        <div class="q-mt-xs">
          <div class="vi-eyebrow">COSMIC VOID · GREAT EMPTINESS</div>
          <div class="vi-void-name">{{ displayName }}</div>
          <div class="vi-subtitle">
            <span v-if="radiusMpc">{{ radiusMpc }} Mpc radius</span>
            <span v-if="radiusMpc && distMpc"> · </span>
            <span v-if="distMpc && distMpc > 0">{{ distMpc }} Mpc from Milky Way</span>
            <span v-if="distMpc === 0">surrounding the Milky Way</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- Data panel (right, auto-hides) -->
    <transition name="vi-fade">
      <div v-show="uiVisible" class="vi-data-panel">

        <div class="vi-section-label">VOID PROPERTIES</div>
        <div class="vi-row">
          <span class="vi-lbl">Structure type</span>
          <span class="vi-val">Cosmic void — underdense region</span>
        </div>
        <div v-if="radiusMpc" class="vi-row">
          <span class="vi-lbl">Radius</span>
          <span class="vi-val">{{ radiusMpc }} Mpc · {{ (radiusMpc * 3.26).toFixed(0) }} Mly</span>
        </div>
        <div v-if="distMpc && distMpc > 0" class="vi-row">
          <span class="vi-lbl">Distance</span>
          <span class="vi-val">{{ distMpc }} Mpc from Milky Way</span>
        </div>
        <div v-else-if="distMpc === 0" class="vi-row">
          <span class="vi-lbl">Location</span>
          <span class="vi-val text-blue-grey-4">We are inside this void</span>
        </div>
        <div class="vi-row">
          <span class="vi-lbl">Galaxy density</span>
          <span class="vi-val">~10–20% of cosmic mean</span>
        </div>
        <div class="vi-row">
          <span class="vi-lbl">Wormhole conduit</span>
          <span class="vi-val" :class="hasConduit ? 'text-cyan-6' : 'text-blue-grey-6'">
            {{ hasConduit ? 'Transit node at periphery' : 'None mapped' }}
          </span>
        </div>

        <!-- Real catalog data when oracle loaded -->
        <template v-if="oracleData">
          <div class="vi-divider" />
          <div class="vi-section-label">CATALOG DATA</div>
          <div class="vi-row">
            <span class="vi-lbl">Confirmed galaxies</span>
            <span class="vi-val text-cyan-8">{{ oracleData.catalog_count.toLocaleString() }}</span>
          </div>
          <div class="vi-row">
            <span class="vi-lbl">Wall-band galaxies</span>
            <span class="vi-val">{{ oracleData.wall_count.toLocaleString() }}</span>
          </div>
          <div class="vi-row">
            <span class="vi-lbl">AGN fraction</span>
            <span class="vi-val">{{ agnPct }}%</span>
          </div>
          <div class="vi-row">
            <span class="vi-lbl">Source</span>
            <span class="vi-val vi-source-label">NASA/IPAC NED</span>
          </div>
        </template>

        <div class="vi-divider" />
        <div class="vi-section-label">INTERIOR CONDITIONS</div>
        <div class="vi-row">
          <span class="vi-lbl">Star density</span>
          <span class="vi-val">Sparse — isolated field galaxies</span>
        </div>
        <div class="vi-row">
          <span class="vi-lbl">ICM temperature</span>
          <span class="vi-val">Sub-keV · no X-ray emission</span>
        </div>
        <div class="vi-row">
          <span class="vi-lbl">Dark matter</span>
          <span class="vi-val">Severely underdense · &lt;20% mean</span>
        </div>
        <div class="vi-row">
          <span class="vi-lbl">Settlement tier</span>
          <span class="vi-val text-amber-8">Frontier — theoretical only</span>
        </div>

        <template v-if="hasConduit">
          <div class="vi-divider" />
          <div class="vi-section-label">TRANSIT</div>
          <div class="vi-transit-note">
            Wormhole conduit node at void periphery. Void-edge transit allows unlimited-range jumps
            between conduit nodes across the cosmic web.
          </div>
          <q-btn dense unelevated size="sm" color="blue-grey-9" class="full-width"
            icon="mdi-hexagon-outline" label="View Conduit Network"
            @click="$router.push('/cosmic')"
          />
        </template>

      </div>
    </transition>

    <!-- Selected galaxy panel -->
    <Transition name="vi-fade">
      <div v-if="selGalaxy" class="vi-sel-panel">
        <div class="vi-sel-header">
          <div>
            <div class="vi-sel-eyebrow">{{ selGalaxy.is_wall ? 'WALL GALAXY' : 'FIELD GALAXY' }}</div>
            <div class="vi-sel-name">{{ selGalaxy.gid }}</div>
          </div>
          <q-btn flat dense size="xs" icon="mdi-close" color="blue-grey-5" @click="selGalaxy = null" />
        </div>
        <div class="vi-row">
          <span class="vi-lbl">Morphology</span>
          <span class="vi-val">{{ selGalaxy.morph || '—' }}</span>
        </div>
        <div class="vi-row">
          <span class="vi-lbl">Redshift</span>
          <span class="vi-val">z = {{ selGalaxy.z.toFixed(4) }}</span>
        </div>
        <div v-if="selGalaxy.has_agn" class="vi-row">
          <span class="vi-lbl">AGN</span>
          <span class="vi-val text-amber-6">Active nucleus</span>
        </div>
        <div class="vi-row">
          <span class="vi-lbl">Position</span>
          <span class="vi-val" style="font-size:8px">
            {{ selGalaxy.pos_void.map(v => v.toFixed(2)).join(', ') }}
          </span>
        </div>
        <div class="vi-row">
          <span class="vi-lbl">Location</span>
          <span class="vi-val">{{ selGalaxy.is_wall ? 'Void wall' : 'Void interior' }}</span>
        </div>
        <div class="vi-sel-color" :style="`background:${selGalaxy.col_hex}22;border-left:3px solid ${selGalaxy.col_hex}`">
          Star colour: {{ selGalaxy.col_hex }}
        </div>
        <q-btn dense unelevated size="sm" color="blue-grey-9" class="full-width q-mt-sm"
          icon="mdi-telescope" label="Explore star systems"
          @click="goToGalaxy(selGalaxy)" />
      </div>
    </Transition>

    <!-- Layer controls (bottom-left) -->
    <transition name="vi-fade">
      <div v-show="uiVisible" class="vi-layers">
        <div class="vi-layers-label">LAYERS</div>
        <button class="vi-layer-btn" :class="{ active: layerWall }" @click="layerWall = !layerWall">
          <span class="vi-layer-dot" style="background:#cc8855"/>Wall
        </button>
        <button class="vi-layer-btn" :class="{ active: layerField }" @click="layerField = !layerField">
          <span class="vi-layer-dot" style="background:#446688"/>Field
        </button>
        <button class="vi-layer-btn" :class="{ active: layerAGN }" @click="layerAGN = !layerAGN">
          <span class="vi-layer-dot" style="background:#ffcc77"/>AGN
        </button>
      </div>
    </transition>

    <!-- Bottom HUD — always visible, tap to toggle UI -->
    <div class="vi-hud" @click="onHudClick">
      <span class="vi-hud-text">
        {{ volumeLabel }} · {{ Math.round(camR) }}% zoom
        <span v-if="!uiVisible" class="vi-hud-tap">· tap for info</span>
      </span>
    </div>

    <VoidDefenderNav
      v-if="oracleData"
      :void-id="String(route.params.voidId ?? 'bootes-void')"
      :void-name="displayName"
      :members="voidNavMembers"
      :current-id="selGalaxy?.gid"
      :bottom-px="110"
      @select="selectVoidNavMember"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useVizRenderer, VIZ_BAR_H } from 'src/composables/useVizRenderer'
import { disposeScene } from 'src/lib/three-utils'
import { useSceneTransitionStore } from 'src/stores/scene-transition'
import type { VoidOracleFile, VoidGalaxy } from 'src/data/void-oracle.types'
import { loadVoidOracle } from 'src/lib/void-oracle'
import VoidDefenderNav, { type VoidNavMember } from 'src/components/VoidDefenderNav.vue'

// ── Route ──────────────────────────────────────────────────────────────────────

const route      = useRoute()
const router     = useRouter()
const transition = useSceneTransitionStore()

const displayName = computed(() =>
  String(route.query.name ?? route.params.voidId ?? 'Cosmic Void').toUpperCase()
)
const radiusMpc  = computed(() => route.query.radius ? Number(route.query.radius) : null)
const distMpc    = computed(() => route.query.dist   ? Number(route.query.dist)   : null)
const hasConduit = computed(() => route.query.conduit === '1')

const volumeLabel = computed(() => {
  if (!radiusMpc.value) return 'Cosmic void — unknown extent'
  const r   = radiusMpc.value
  const vol = (4 / 3) * Math.PI * r * r * r
  return vol > 1e6
    ? `Cosmic void — ${(vol / 1e6).toFixed(1)} × 10⁶ Mpc³`
    : `Cosmic void — ${Math.round(vol).toLocaleString()} Mpc³`
})

// ── Data ──────────────────────────────────────────────────────────────────────

const oracleData = ref<VoidOracleFile | null>(null)

const agnPct = computed(() => {
  if (!oracleData.value) return '0.0'
  return ((oracleData.value.agn_count / oracleData.value.total_count) * 100).toFixed(1)
})

// "Limited objects" — real NED catalog galaxies only, not the generated filler
// population used to bulk out the ambient render.
const voidNavMembers = computed<VoidNavMember[]>(() => {
  if (!oracleData.value) return []
  return oracleData.value.galaxies
    .filter(g => g.source === 'catalog')
    .map(g => ({
      id:       g.gid,
      name:     g.gid,
      zone:     g.is_wall ? 'wall' : 'interior',
      angleDeg: Math.atan2(g.pos_void[2], g.pos_void[0]) * 180 / Math.PI,
    }))
})

function selectVoidNavMember(memberId: string) {
  const gal = oracleData.value?.galaxies.find(g => g.gid === memberId)
  if (!gal) return
  selGalaxy.value = gal
  uiVisible.value = true
  if (hideTimer) clearTimeout(hideTimer)
}

// ── Layer toggles + zoom + selection ─────────────────────────────────────────

const layerWall  = ref(true)
const layerField = ref(true)
const layerAGN   = ref(true)
const camR       = ref(115)
const selGalaxy  = ref<VoidGalaxy | null>(null)

// ── UI auto-hide ──────────────────────────────────────────────────────────────

const uiVisible = ref(true)
let hideTimer: ReturnType<typeof setTimeout> | null = null

function scheduleHide() {
  if (hideTimer) clearTimeout(hideTimer)
  uiVisible.value = true
  hideTimer = setTimeout(() => { uiVisible.value = false }, 4500)
}
function onHudClick()      { uiVisible.value = !uiVisible.value; if (uiVisible.value) scheduleHide() }
function onPageMouseMove() { scheduleHide() }
function onPageTouchMove() { scheduleHide() }

// ── Three.js — shared renderer ────────────────────────────────────────────────

const viz = useVizRenderer()
let renderer: THREE.WebGLRenderer     | null = null
let scene:    THREE.Scene             | null = null
let camera:   THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let _stopTick: (() => void) | null = null

// Root group for all page-level scene objects — added/removed on mount/unmount
const pageGroup = new THREE.Group()

// Orbital camera state
const orbit = { theta: 0.0, phi: Math.PI * 0.42 }
const drag  = { active: false, lastX: 0, lastY: 0 }
const touch = { lastX: 0, lastY: 0 }

// Click detection — distinguish tap from drag
let wallGalsArr:  VoidGalaxy[]        = []
let fieldGalsArr: VoidGalaxy[]        = []
let wallPoints:   THREE.Points | null = null
let fieldPoints:  THREE.Points | null = null
let agnPoints:    THREE.Points | null = null
let dragMoved    = 0

function updateCamera() {
  if (!camera) return
  const r  = camR.value
  const sp = Math.sin(orbit.phi), cp = Math.cos(orbit.phi)
  const st = Math.sin(orbit.theta), ct = Math.cos(orbit.theta)
  camera.position.set(r * sp * st, r * cp, r * sp * ct)
  camera.lookAt(0, 0, 0)
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  camR.value = Math.max(18, Math.min(188, camR.value + e.deltaY * 0.10))
}

// Mouse drag
function onDragStart(e: MouseEvent) { drag.active = true; drag.lastX = e.clientX; drag.lastY = e.clientY; dragMoved = 0 }
function onDragMove(e: MouseEvent) {
  if (!drag.active) return
  const dx = e.clientX - drag.lastX
  const dy = e.clientY - drag.lastY
  dragMoved   += Math.abs(dx) + Math.abs(dy)
  orbit.theta -= dx * 0.006
  orbit.phi    = Math.max(0.12, Math.min(Math.PI - 0.12, orbit.phi - dy * 0.006))
  drag.lastX   = e.clientX
  drag.lastY   = e.clientY
}
function onDragEnd() { drag.active = false }

// Touch drag
function onTouchDragStart(e: TouchEvent) {
  if (e.touches[0]) { touch.lastX = e.touches[0].clientX; touch.lastY = e.touches[0].clientY; dragMoved = 0 }
}
function onTouchDragMove(e: TouchEvent) {
  if (!e.touches[0]) return
  orbit.theta -= (e.touches[0].clientX - touch.lastX) * 0.006
  orbit.phi    = Math.max(0.12, Math.min(Math.PI - 0.12, orbit.phi - (e.touches[0].clientY - touch.lastY) * 0.006))
  touch.lastX  = e.touches[0].clientX
  touch.lastY  = e.touches[0].clientY
}

// ── Galaxy click handler ──────────────────────────────────────────────────────

function onClick(e: MouseEvent) {
  if (dragMoved > 6 || !camera) return
  const w = window.innerWidth, h = window.innerHeight - VIZ_BAR_H
  const rc = new THREE.Raycaster()
  rc.params.Points = { threshold: 2.6 }
  rc.setFromCamera(
    new THREE.Vector2(
      (e.clientX / w) * 2 - 1,
      -((e.clientY - VIZ_BAR_H) / h) * 2 + 1,
    ),
    camera,
  )
  const targets = ([wallPoints, fieldPoints] as (THREE.Points | null)[]).filter(Boolean) as THREE.Points[]
  const hits    = rc.intersectObjects(targets, false)
  if (!hits.length) { selGalaxy.value = null; return }
  const hit = hits[0]!
  const gal = hit.object === wallPoints ? wallGalsArr[hit.index!] : fieldGalsArr[hit.index!]
  if (!gal) return
  // Show in-place panel — no page transition
  selGalaxy.value = gal
  uiVisible.value = true
  if (hideTimer) clearTimeout(hideTimer)
}

async function goToGalaxy(gal: VoidGalaxy) {
  // This page drives the camera with fixed orbit-around-origin math (no
  // OrbitControls target to fly toward), so there's no continuous zoom here —
  // just an iris wipe centered on the galaxy's screen position to cover the
  // pageGroup swap into VoidGalaxyPage (which shares the renderer).
  let ox = 50, oy = 50
  if (camera) {
    const pos3d = new THREE.Vector3(...gal.pos_void).multiplyScalar(VIS_SCALE)
    const sc    = pos3d.project(camera)
    ox = (sc.x + 1) / 2 * 100
    oy = (1 - sc.y) / 2 * 100
  }
  const bearing = Math.atan2(oy / 100 - 0.5, ox / 100 - 0.5)
  await transition.depart(ox, oy, 'iris', bearing)
  void router.push({
    name:   'void-galaxy',
    params: { voidId: String(route.params.voidId ?? 'bootes-void'), gid: gal.gid },
    query:  { morph: gal.morph, color: gal.col_hex.replace('#', ''), z: String(gal.z), agn: gal.has_agn ? '1' : '0', wall: gal.is_wall ? '1' : '0' },
  })
}

// ── Scene construction ────────────────────────────────────────────────────────

// pos_void units: MPC_SCALE (1/15 per Mpc) → wall galaxies at r≈6.9–9.5
// VIS_SCALE×7.5 → wall shell at r≈52–71 visual units; camera at CAM_R=115
const VIS_SCALE = 7.5

function seededRng(seed: number) {
  let s = seed ^ 0xdeadbeef
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff }
}

function parseHex(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16 & 0xff) / 255, (n >> 8 & 0xff) / 255, (n & 0xff) / 255]
}

// ── Background star field ─────────────────────────────────────────────────────

function addStarField() {
  const rng  = seededRng(0x5a731c4e)
  const N    = 1600
  const pos  = new Float32Array(N * 3)
  const col  = new Float32Array(N * 3)

  for (let i = 0; i < N; i++) {
    const theta = rng() * Math.PI * 2
    const phi   = Math.acos(2 * rng() - 1)
    const r     = 158 + rng() * 44
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i*3+2] = r * Math.cos(phi)
    // Cool blue-white to warm pale stars
    const t = rng()
    col[i*3]   = 0.62 + t * 0.38
    col[i*3+1] = 0.68 + t * 0.32
    col[i*3+2] = 0.82 + (1 - t) * 0.18
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3))
  pageGroup.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.46, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.58, depthWrite: false,
  })))
}

// ── Galaxy data layers ────────────────────────────────────────────────────────

function addGalaxiesFromOracle(oracle: VoidOracleFile) {
  const allGals  = oracle.galaxies
  const wallGals = allGals.filter(g => g.is_wall)
  const fldGals  = allGals.filter(g => !g.is_wall)
  const agnGals  = allGals.filter(g => g.has_agn)

  // Wall galaxies — the soap-bubble shell of stars
  {
    wallGalsArr = wallGals
    const n   = wallGals.length
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    wallGals.forEach((g, i) => {
      pos[i*3]   = g.pos_void[0] * VIS_SCALE
      pos[i*3+1] = g.pos_void[1] * VIS_SCALE
      pos[i*3+2] = g.pos_void[2] * VIS_SCALE
      const [r, gc, b] = parseHex(g.col_hex)
      const boost = g.source === 'catalog' ? 1.0 : 0.62
      col[i*3]   = r  * boost
      col[i*3+1] = gc * boost
      col[i*3+2] = b  * boost
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    wallPoints = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.92, sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0.74, depthWrite: false,
    }))
    pageGroup.add(wallPoints)
  }

  // Interior field galaxies — sparse inside the bubble
  if (fldGals.length > 0) {
    fieldGalsArr = fldGals
    const n   = fldGals.length
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    fldGals.forEach((g, i) => {
      pos[i*3]   = g.pos_void[0] * VIS_SCALE
      pos[i*3+1] = g.pos_void[1] * VIS_SCALE
      pos[i*3+2] = g.pos_void[2] * VIS_SCALE
      const [r, gc, b] = parseHex(g.col_hex)
      col[i*3]   = r  * 0.58
      col[i*3+1] = gc * 0.58
      col[i*3+2] = b  * 0.58
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    fieldPoints = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.54, sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0.44, depthWrite: false,
    }))
    pageGroup.add(fieldPoints)
  }

  // AGN highlights — additive glow cores at active galactic nuclei positions
  if (agnGals.length > 0) {
    const n   = agnGals.length
    const pos = new Float32Array(n * 3)
    agnGals.forEach((g, i) => {
      pos[i*3]   = g.pos_void[0] * VIS_SCALE
      pos[i*3+1] = g.pos_void[1] * VIS_SCALE
      pos[i*3+2] = g.pos_void[2] * VIS_SCALE
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    agnPoints = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffd8a0, size: 2.6, sizeAttenuation: true,
      transparent: true, opacity: 0.20,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }))
    pageGroup.add(agnPoints)
  }

  // Wall-group halos — 12 evenly-sampled wall positions; soft glow suggests group-scale halo
  if (wallGals.length >= 12) {
    const step = Math.floor(wallGals.length / 12)
    const pos  = new Float32Array(12 * 3)
    for (let i = 0; i < 12; i++) {
      const g   = wallGals[i * step]
      pos[i*3]   = g.pos_void[0] * VIS_SCALE
      pos[i*3+1] = g.pos_void[1] * VIS_SCALE
      pos[i*3+2] = g.pos_void[2] * VIS_SCALE
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    pageGroup.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x5577aa, size: 9.0, sizeAttenuation: true,
      transparent: true, opacity: 0.09,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })))
  }
}

// Procedural fallback for voids without catalog data
function addProceduralVoid() {
  const rng = seededRng(0x9a1b2c3d)

  // Wall shell
  const WC  = 280
  const wPo = new Float32Array(WC * 3)
  const wCo = new Float32Array(WC * 3)
  for (let i = 0; i < WC; i++) {
    const theta = rng() * Math.PI * 2
    const phi   = Math.acos(2 * rng() - 1)
    const r     = 55 + rng() * 16
    wPo[i*3]   = r * Math.sin(phi) * Math.cos(theta)
    wPo[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
    wPo[i*3+2] = r * Math.cos(phi)
    wCo[i*3]   = 0.48 + rng() * 0.32
    wCo[i*3+1] = 0.28 + rng() * 0.22
    wCo[i*3+2] = 0.08 + rng() * 0.18
  }
  const wGeo = new THREE.BufferGeometry()
  wGeo.setAttribute('position', new THREE.BufferAttribute(wPo, 3))
  wGeo.setAttribute('color',    new THREE.BufferAttribute(wCo, 3))
  pageGroup.add(new THREE.Points(wGeo, new THREE.PointsMaterial({
    size: 0.9, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.62, depthWrite: false,
  })))

  // Sparse interior field
  const FC  = 35
  const fPo = new Float32Array(FC * 3)
  for (let i = 0; i < FC; i++) {
    fPo[i*3]   = (rng() - 0.5) * 86
    fPo[i*3+1] = (rng() - 0.5) * 86
    fPo[i*3+2] = (rng() - 0.5) * 86
  }
  const fGeo = new THREE.BufferGeometry()
  fGeo.setAttribute('position', new THREE.BufferAttribute(fPo, 3))
  pageGroup.add(new THREE.Points(fGeo, new THREE.PointsMaterial({
    color: 0x3a5060, size: 0.48, sizeAttenuation: true,
    transparent: true, opacity: 0.38, depthWrite: false,
  })))
}

// ── Main scene setup ──────────────────────────────────────────────────────────

async function buildScene() {
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

  camera.fov  = 65
  camera.near = 0.1
  camera.far  = 400
  updateCamera()
  camera.updateProjectionMatrix()

  scene.add(pageGroup)

  addStarField()

  const voidId = String(route.params.voidId ?? '')
  const oracle = await loadVoidOracle(voidId || 'bootes-void')
  oracleData.value = oracle
  oracle ? addGalaxiesFromOracle(oracle) : addProceduralVoid()

  // Void shell wireframe — visual boundary of the underdense region
  if (radiusMpc.value) {
    // pos_void coords: 1 Mpc = (1/15) pos_void unit; VIS_SCALE=7.5 → 1 Mpc ≈ 0.5 scene units
    const shellR   = radiusMpc.value * 0.5
    const shellGeo = new THREE.SphereGeometry(shellR, 48, 24)
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x1a3a60, wireframe: true, transparent: true, opacity: 0.04, depthWrite: false,
    })
    pageGroup.add(new THREE.Mesh(shellGeo, shellMat))

    // Equatorial ring — stronger accent at void midplane
    const ringGeo = new THREE.TorusGeometry(shellR, 0.18, 4, 80)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x224466, transparent: true, opacity: 0.07, depthWrite: false })
    pageGroup.add(new THREE.Mesh(ringGeo, ringMat))
  }

  _stopTick = viz.addTick(tick)
}

function tick() {
  if (!drag.active) orbit.theta += 0.000125
  // Sync layer visibility from reactive state
  if (wallPoints)  wallPoints.visible  = layerWall.value
  if (fieldPoints) fieldPoints.visible = layerField.value
  if (agnPoints)   agnPoints.visible   = layerAGN.value
  updateCamera()
}

onMounted(async () => {
  // Await a tick so MainLayout's onMounted (which calls viz.init()) runs first —
  // this page can otherwise mount before the shared renderer exists.
  await Promise.resolve()
  viz.canvas?.addEventListener('wheel', onWheel, { passive: false })
  scheduleHide()
  void buildScene()
})

onUnmounted(() => {
  viz.canvas?.removeEventListener('wheel', onWheel)
  _stopTick?.(); _stopTick = null
  if (controls) controls.enabled = true

  disposeScene(pageGroup)
  scene?.remove(pageGroup)
  if (scene) scene.background = null
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<style scoped>
.vi-page { position: relative; width: 100%; height: 100vh; cursor: grab; }
.vi-page:active { cursor: grabbing; }

/* ── Top overlay ─────────────────────────────────────────────────────────── */
.vi-top-overlay {
  position: absolute; top: 12px; left: 12px;
  z-index: 10;
  pointer-events: none;
}
.vi-top-overlay > * { pointer-events: auto; }

.vi-breadcrumb-row {
  background: rgba(0,0,0,0.55);
  border-radius: 6px;
  padding: 2px 8px;
}
.vi-path-label { font-size: 10px; letter-spacing: 0.06em; }

.vi-eyebrow {
  font-size: 9px; letter-spacing: 0.12em;
  color: rgba(80,120,170,0.70);
  margin-bottom: 2px;
}
.vi-void-name {
  font-size: 14px; letter-spacing: 0.06em;
  color: rgba(180,210,240,0.85);
  font-weight: 500;
}
.vi-subtitle {
  font-size: 10px;
  color: rgba(100,130,160,0.70);
  margin-top: 2px;
}

/* ── Data panel ──────────────────────────────────────────────────────────── */
.vi-data-panel {
  position: absolute; top: 50%; right: 16px;
  transform: translateY(-50%);
  width: 240px;
  background: rgba(2, 4, 14, 0.90);
  border: 1px solid rgba(60, 90, 140, 0.20);
  border-radius: 8px;
  padding: 14px;
  z-index: 10;
  backdrop-filter: blur(12px);
}

.vi-section-label {
  font-size: 9px; letter-spacing: 0.12em;
  color: rgba(80, 110, 160, 0.70);
  margin-bottom: 6px;
}
.vi-row {
  display: flex; justify-content: space-between;
  font-size: 9.5px; line-height: 1.7;
  color: rgba(180, 200, 220, 0.55);
}
.vi-lbl { color: rgba(80, 110, 150, 0.75); flex-shrink: 0; padding-right: 6px; }
.vi-val { text-align: right; }
.vi-source-label { font-size: 8px; color: rgba(80,110,150,0.55); }
.vi-divider { border-top: 1px solid rgba(60, 90, 130, 0.18); margin: 8px 0; }
.vi-transit-note {
  font-size: 9px; line-height: 1.6;
  color: rgba(100,130,170,0.65);
  margin-bottom: 8px;
}

/* ── Bottom HUD ──────────────────────────────────────────────────────────── */
.vi-hud {
  position: absolute; bottom: 12px; left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.45);
  border-radius: 12px;
  padding: 2px 14px;
  z-index: 10;
  cursor: pointer;
}
.vi-hud-text { font-size: 10px; color: rgba(100,120,140,0.65); }
.vi-hud-tap  { font-size: 9px;  color: rgba(80,100,120,0.45); }

/* ── Selected galaxy panel ───────────────────────────────────────────────── */
.vi-sel-panel {
  position: absolute; top: 50%; left: 16px;
  transform: translateY(-50%);
  width: 228px; z-index: 12;
  background: rgba(2, 6, 18, 0.92);
  border: 1px solid rgba(80,110,160,0.28);
  border-radius: 8px; padding: 12px;
  backdrop-filter: blur(10px);
}
.vi-sel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.vi-sel-eyebrow { font-size: 8px; letter-spacing: 0.12em; color: rgba(80,120,170,0.65); margin-bottom: 2px; }
.vi-sel-name { font-size: 13px; color: rgba(180,210,240,0.88); font-weight: 400; word-break: break-all; }
.vi-sel-color {
  font-size: 8.5px; color: rgba(160,180,200,0.55);
  margin: 6px 0 2px; padding: 3px 6px; border-radius: 3px;
}

/* ── Layer toggles ───────────────────────────────────────────────────────── */
.vi-layers {
  position: absolute; bottom: 48px; left: 16px; z-index: 10;
  display: flex; align-items: center; gap: 6px;
}
.vi-layers-label {
  font-size: 7.5px; letter-spacing: 0.12em;
  color: rgba(60,90,130,0.55); margin-right: 2px;
}
.vi-layer-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 12px;
  border: 1px solid rgba(80,110,150,0.22);
  background: rgba(0,0,0,0.45);
  color: rgba(100,130,165,0.50);
  font-size: 9px; font-family: 'Courier New', monospace;
  cursor: pointer; transition: all 0.13s;
}
.vi-layer-btn.active {
  border-color: rgba(80,130,190,0.45);
  color: rgba(170,200,235,0.80);
  background: rgba(0,10,30,0.65);
}
.vi-layer-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* ── Transitions ─────────────────────────────────────────────────────────── */
.vi-fade-enter-active, .vi-fade-leave-active { transition: opacity 0.5s ease; }
.vi-fade-enter-from,  .vi-fade-leave-to      { opacity: 0; }
</style>
