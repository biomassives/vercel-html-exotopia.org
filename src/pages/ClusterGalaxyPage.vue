<template>
  <!-- Transparent overlay — shared Three.js canvas in MainLayout renders behind -->
  <q-page class="cg-page viz-overlay-page" :style="hoveringSystem ? { cursor: 'pointer' } : {}"
    @click="onClick" @mousedown="onDragStart" @mousemove="onMouseMove($event); onDragTrack($event)" @mouseleave="onMouseLeaveCanvas">

    <!-- Breadcrumb -->
    <div class="cg-breadcrumb row items-center q-gutter-xs no-wrap">
      <q-btn flat dense size="xs" color="blue-grey-5" icon="mdi-chevron-left" label="Cosmic"
        @click="$router.push('/cosmic')" />
      <span class="text-blue-grey-7 text-caption">/</span>
      <q-btn flat dense size="xs" color="blue-grey-5" :label="clusterDisplayName"
        @click="$router.push(`/clusters?cluster=${clusterSlug}`)" />
      <span class="text-blue-grey-7 text-caption">/</span>
      <span class="text-blue-grey-3 text-caption">{{ memberDisplayName }}</span>
    </div>

    <!-- Galaxy header -->
    <div class="cg-header">
      <div class="text-caption text-blue-grey-5 q-mb-xs" style="letter-spacing:0.1em">
        CLUSTER GALAXY · INTERIOR VIEW
      </div>
      <div class="text-h6 text-blue-grey-2">{{ memberDisplayName }}</div>
      <div class="text-caption text-blue-grey-5">
        {{ hubbleDesc }} · {{ systemCount }} star systems · {{ clusterDisplayName }}
      </div>
    </div>

    <!-- System info panel (shown when a system is selected) -->
    <Transition name="slide-panel">
      <div v-if="selectedSystem" class="cg-panel">
        <div class="cg-panel-header">
          <div class="text-caption text-cyan-7" style="letter-spacing:0.1em">STAR SYSTEM</div>
          <q-btn flat dense size="xs" icon="mdi-close" color="blue-grey-5"
            @click="selectedSystem = null; resetToGalaxyCenter()" />
        </div>

        <div class="text-subtitle2 text-blue-grey-2 q-mb-xs">{{ selectedSystem.name }}</div>

        <div class="cg-detail-row">
          <span class="cg-detail-label">Spectral type</span>
          <span :style="{ color: selectedSystem.specColor }">{{ selectedSystem.spectral }}</span>
        </div>
        <div class="cg-detail-row">
          <span class="cg-detail-label">Est. planets</span>
          <span class="text-blue-grey-3">{{ selectedSystem.planetCount }}</span>
        </div>
        <div class="cg-detail-row">
          <span class="cg-detail-label">Surface temp</span>
          <span class="text-blue-grey-3">{{ selectedSystem.eqtRange }}</span>
        </div>
        <div class="cg-detail-row">
          <span class="cg-detail-label">Dist. from core</span>
          <span class="text-blue-grey-3">{{ selectedSystem.distKly }} kly</span>
        </div>

        <q-separator color="blue-grey-8" class="q-my-sm" />

        <div v-if="observatoryReport" class="text-caption text-blue-grey-6 q-mb-xs"
          style="font-size:9px;line-height:1.5;font-style:italic;border-left:2px solid #1a3a4a;padding-left:6px">
          {{ observatoryReport }}
        </div>
        <div class="text-caption text-blue-grey-6 q-mb-sm" style="font-size:9px;line-height:1.5">
          Theoretical system in {{ memberDisplayName }}, {{ clusterDisplayName }}.
          Create a settlement to establish a deed anchored to this cosmic address.
        </div>

        <div class="row q-gutter-xs">
          <q-btn dense rounded unelevated size="sm" color="cyan-9" icon="mdi-telescope"
            label="Enter system"
            @click="descendToSurface(selectedSystem)" />
          <q-btn dense rounded unelevated size="sm"
            :color="hasSelectedSettlement ? 'teal-8' : (claimMode ? 'amber-7' : 'amber-9')"
            :icon="hasSelectedSettlement ? 'mdi-home-circle' : 'mdi-map-marker-plus'"
            :label="hasSelectedSettlement ? 'Use Your Settlement' : 'Create a Settlement'"
            @click="goClaimSystem(selectedSystem)" />
        </div>
      </div>
    </Transition>

    <!-- Create-settlement prompt — shown when arriving from "Create a Settlement Here" -->
    <Transition name="fade">
      <div v-if="claimMode && !selectedSystem && !loading" class="cg-claim-banner">
        <q-icon name="mdi-map-marker-plus" color="amber-6" size="16px" class="q-mr-xs" />
        <span class="text-caption text-amber-4">Select a star system to create a settlement</span>
      </div>
    </Transition>

    <!-- System count bar -->
    <div class="cg-footer">
      <div class="text-caption text-blue-grey-7">
        <span class="text-cyan-9">{{ navCount.toLocaleString() }}</span> star systems
        <span class="text-blue-grey-8 q-ml-xs">·</span>
        <span class="text-blue-grey-8 q-ml-xs">{{ systemCount }} anchor</span>
        <span class="text-blue-grey-8 q-ml-sm">{{ claimMode ? '· Click a star to claim' : '· Click an anchor to descend' }}</span>
      </div>
      <div class="cg-morph-chips row q-gutter-xs q-mt-xs">
        <span v-for="(pct, morph) in morphBreakdown" :key="morph"
          class="cg-chip"
          :style="{ borderColor: morphChipColor(morph) }">
          {{ morph }} {{ pct }}%
        </span>
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="cg-loading">
      <q-spinner-orbit color="cyan-7" size="48px" />
      <div class="text-caption text-blue-grey-5 q-mt-sm">Loading galaxy data…</div>
    </div>

    <!-- Error overlay -->
    <div v-if="error" class="cg-loading">
      <q-icon name="mdi-alert-circle-outline" color="amber-7" size="48px" />
      <div class="text-caption text-blue-grey-4 q-mt-sm">{{ error }}</div>
      <q-btn flat dense color="cyan-7" label="Back to Cosmic" class="q-mt-sm"
        @click="$router.push('/cosmic')" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import gsap from 'gsap'
import { useVizRenderer, VIZ_BAR_H } from 'src/composables/useVizRenderer'
import { useClusterGalaxyData, mulberry32, buildBackgroundField } from 'src/composables/useClusterGalaxyData'
import type { ClusterGalaxyDoc } from 'src/composables/useClusterGalaxyData'
import { useSettlements, clusterKey }                             from 'src/lib/settlements'
import { useSceneTransitionStore }                                from 'src/stores/scene-transition'
import { disposeScene }                                           from 'src/lib/three-utils'

// ── Route ──────────────────────────────────────────────────────────────────────
const route  = useRoute()
const router = useRouter()

const clusterSlug = computed(() => String(route.params.clusterSlug ?? ''))
const memberId    = computed(() => String(route.params.memberId    ?? ''))

// ── Data composable ────────────────────────────────────────────────────────────
const { loading, error, doc, load: loadGalaxyData } = useClusterGalaxyData(clusterSlug, memberId)

// ── State ──────────────────────────────────────────────────────────────────────
const hoveringSystem = ref(false)

interface StarSystem {
  id:         string     // stable machine id (e.g. "ngc0224-s01") — used for settlement keys; never the display name
  idx:        number
  name:       string
  spectral:   string
  specColor:  string
  planetCount: number
  eqtRange:   string
  distKly:    string
  eqtK:       number     // for surface navigation
  orbitR:     number     // Three.js scene radius
  theta:      number     // orbit angle
  phi:        number
}

const systems       = shallowRef<StarSystem[]>([])
const selectedSystem = ref<StarSystem | null>(null)
const claimMode      = computed(() => route.query.action === 'claim')

const { hasSettlement, addSettlement } = useSettlements()
const transition = useSceneTransitionStore()

// Track click origin for departure transition
const clickPct     = { x: 50, y: 50 }
const clickBearing = ref(0)

function selectedSettlementKey() {
  const sys = selectedSystem.value
  if (!sys) return ''
  const planetLabel = `b`  // primary planet
  return clusterKey(clusterSlug.value, memberId.value, sys.id, planetLabel)
}
const hasSelectedSettlement = computed(() => selectedSystem.value ? hasSettlement(selectedSettlementKey()) : false)

function goClaimSystem(sys: StarSystem) {
  if (!hasSettlement(clusterKey(clusterSlug.value, memberId.value, sys.id, 'b'))) {
    addSettlement({
      key:         clusterKey(clusterSlug.value, memberId.value, sys.id, 'b'),
      type:        'cluster',
      planetName:  'b',
      hostname:    sys.id,
      exolocation: `exo-cluster-v1:${clusterSlug.value}:${memberId.value}:${sys.id}:b`,
      displayName: `${sys.id} · b (${clusterDisplayName.value})`,
      clusterSlug: clusterSlug.value,
      memberId:    memberId.value,
    })
  }
  void router.push(claimUrl(sys))
}

// Member data derived from composable doc
const memberHubble       = computed(() => doc.value?.galaxy_hubble ?? 'E')
const memberDistMpc      = computed(() => doc.value?.cluster_dist_mpc ?? 65)
const clusterDisplayName = computed(() => doc.value?.cluster ?? clusterSlug.value.replace(/-/g, ' '))

const systemCount = computed(() => systems.value.length)
const navCount    = computed(() => doc.value?.population?.nav_count ?? systemCount.value)

const hubbleDesc = computed(() => {
  const map: Record<string, string> = {
    cD: 'Brightest Cluster Galaxy', E: 'Giant Elliptical', S0: 'Lenticular',
    Sa: 'Early Spiral', Sb: 'Barred Spiral', Irr: 'Irregular',
    dE: 'Dwarf Elliptical', dIrr: 'Dwarf Irregular',
  }
  return map[memberHubble.value] ?? 'Galaxy'
})

const observatoryReport = computed(() => doc.value?.provenance?.observatory_report ?? '')

const memberDisplayName = computed(() => {
  const id = memberId.value
  if (id.startsWith('proc-') || id.startsWith('bcg-')) {
    return `${memberHubble.value} galaxy · ${id}`
  }
  return id
})

// Morphology breakdown for display
const morphBreakdown = computed(() => {
  const counts: Record<string, number> = {}
  for (const s of systems.value) counts[s.spectral[0]] = (counts[s.spectral[0]] ?? 0) + 1
  const total = systems.value.length || 1
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(counts)) out[k] = Math.round(v / total * 100)
  return out
})

const SPECTRAL_COLOR: Record<string, string> = {
  O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
  G: '#ffe4aa', K: '#ffbe6e', M: '#ff8250', W: '#50e6ff',
}

// ── Map ClusterGalaxyDoc → scene StarSystem[] ──────────────────────────────────
function mapDocToSystems(galaxyDoc: ClusterGalaxyDoc): StarSystem[] {
  const seed = (galaxyDoc.cluster_slug + galaxyDoc.galaxy_id)
    .split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0) & 0xFFFFFFFF
  const rng  = mulberry32(seed)

  return galaxyDoc.star_systems.slice(0, 80).map((s, i) => {
    const spec       = s.spectral_type[0] ?? 'K'
    const specColor  = SPECTRAL_COLOR[spec] ?? '#ffbe6e'
    const temps      = s.planets.map(p => p.eq_temp_k)
    const eqtLo      = temps.length ? Math.min(...temps) : 150
    const eqtHi      = temps.length ? Math.max(...temps) : 400
    const eqtK       = temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : 280
    const orbitR     = 0.3 + rng() * 2.2
    const theta      = rng() * Math.PI * 2
    const phi        = Math.acos(2 * rng() - 1) * 0.55
    const distKly    = (1 + rng() * 29).toFixed(1)

    const tierRank   = { candidate: 3, frontier: 2, theoretical: 1 } as Record<string, number>
    const bestTier   = s.planets.reduce((best, p) =>
      (tierRank[p.settlement_tier] ?? 0) > (tierRank[best] ?? 0) ? p.settlement_tier : best, 'theoretical')
    const label      = bestTier === 'candidate' ? `★ ${s.label}` : s.label

    return {
      id: s.id, idx: i, name: label, spectral: spec, specColor,
      planetCount: s.planets.length,
      eqtRange: `${eqtLo}–${eqtHi} K`, distKly, eqtK,
      orbitR, theta, phi,
    }
  })
}

// ── Three.js scene — shared renderer; per-page raycaster ─────────────────────
const viz = useVizRenderer()
let renderer: THREE.WebGLRenderer     | null = null
let scene:    THREE.Scene             | null = null
let camera:   THREE.PerspectiveCamera | null = null
let controls: OrbitControls           | null = null

// Root group for all page-level scene objects — added/removed on mount/unmount
const pageGroup = new THREE.Group()

const systemMeshes  = shallowRef<THREE.Mesh[]>([])
const glowSprites:  THREE.Sprite[]  = []   // indexed by sys.idx — for hover brightening
let   coreSprite:   THREE.Sprite | null = null
let   guideLine:    THREE.Line   | null = null
let   guideGeo:     THREE.BufferGeometry | null = null
let   raycaster:    THREE.Raycaster
let   mouse:        THREE.Vector2

function buildGalaxyCoreSprite(morph: string): THREE.Sprite {
  const cv  = document.createElement('canvas')
  cv.width  = cv.height = 256
  const ctx = cv.getContext('2d')!
  const cx  = 128

  // Clip to circle
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cx, cx, 0, Math.PI * 2); ctx.clip()

  // Core glow
  const isSpiral = morph === 'Sa' || morph === 'Sb'
  const coreColor = isSpiral ? '180,210,255' : '255,220,150'

  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.9)
  g.addColorStop(0.00, `rgba(255,255,255,0.95)`)
  g.addColorStop(0.04, `rgba(255,255,255,0.80)`)
  g.addColorStop(0.12, `rgba(${coreColor},0.60)`)
  g.addColorStop(0.28, `rgba(${coreColor},0.28)`)
  g.addColorStop(0.55, `rgba(${coreColor},0.10)`)
  g.addColorStop(1.00, `rgba(${coreColor},0)`)
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256)

  // Spiral arm hints for Sa/Sb
  if (isSpiral) {
    for (let arm = 0; arm < 2; arm++) {
      ctx.beginPath(); let first = true
      for (let t = 0.4; t < Math.PI * 1.8; t += 0.05) {
        const r = cx * 0.08 * Math.exp(t * 0.28)
        if (r > cx * 0.82) break
        const x = cx + r * Math.cos(t + arm * Math.PI)
        const y = cx + r * Math.sin(t + arm * Math.PI) * 0.55
        if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = `rgba(${coreColor},0.22)`; ctx.lineWidth = 1.5; ctx.stroke()
    }
  }

  ctx.restore()
  const tex = new THREE.CanvasTexture(cv)
  tex.generateMipmaps = false
  tex.minFilter       = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.setScalar(0.6)
  return sprite
}

function buildSystemMesh(sys: StarSystem): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.022 + sys.planetCount * 0.005, 8, 8)
  const mat = new THREE.MeshBasicMaterial({ color: sys.specColor, transparent: true, opacity: 0.90 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(
    sys.orbitR * Math.sin(sys.phi) * Math.cos(sys.theta),
    sys.orbitR * Math.cos(sys.phi) * 0.28,   // flatten to disk plane
    sys.orbitR * Math.sin(sys.phi) * Math.sin(sys.theta),
  )
  mesh.userData.sysIdx = sys.idx
  return mesh
}

function buildGlowSprite(sys: StarSystem): THREE.Sprite {
  const cv  = document.createElement('canvas')
  cv.width  = cv.height = 64
  const ctx = cv.getContext('2d')!
  const cx  = 32
  const col = sys.specColor.replace('#', '')
  const r   = parseInt(col.substring(0, 2), 16)
  const g   = parseInt(col.substring(2, 4), 16)
  const b   = parseInt(col.substring(4, 6), 16)

  ctx.save(); ctx.beginPath(); ctx.arc(cx, cx, cx, 0, Math.PI * 2); ctx.clip()
  const grd = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.8)
  grd.addColorStop(0,    `rgba(255,255,255,0.95)`)
  grd.addColorStop(0.08, `rgba(${r},${g},${b},0.80)`)
  grd.addColorStop(0.35, `rgba(${r},${g},${b},0.22)`)
  grd.addColorStop(1,    `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64)
  ctx.restore()

  const tex = new THREE.CanvasTexture(cv)
  tex.generateMipmaps = false
  tex.minFilter       = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.setScalar(0.055)
  return sprite
}

function buildScene() {
  // Grab shared renderer refs
  renderer = viz.renderer
  scene    = viz.scene
  camera   = viz.camera
  controls = viz.controls
  if (!renderer || !scene || !camera || !controls) return

  // Configure scene appearance for the cluster-galaxy level
  scene.background = new THREE.Color(0x030609)
  scene.fog        = null

  // Configure camera for cluster-galaxy scale
  camera.fov  = 55
  camera.near = 0.001
  camera.far  = 200

  // Bearing-synced arrival: approach from the direction of the click in the prior scene
  const b = parseFloat(String(route.query.bearing ?? '0')) || 0
  const entryDist = 11
  camera.position.set(Math.sin(b) * entryDist, 4.2, Math.cos(b) * entryDist)
  camera.updateProjectionMatrix()

  // Configure controls for cluster-galaxy navigation
  controls.dampingFactor  = 0.06
  controls.minDistance    = 0.06; controls.maxDistance   = 14
  controls.autoRotate     = true; controls.autoRotateSpeed = 0.25

  scene.add(pageGroup)

  raycaster = new THREE.Raycaster()
  raycaster.params.Points = { threshold: 0.04 }
  mouse     = new THREE.Vector2()

  // Dust particle field
  const ptGeo = new THREE.BufferGeometry()
  const ptPos = new Float32Array(3000 * 3)
  for (let i = 0; i < ptPos.length; i++) ptPos[i] = (Math.random() - 0.5) * 20
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3))
  const ptMat = new THREE.PointsMaterial({ color: 0x334455, size: 0.015, transparent: true, opacity: 0.5 })
  pageGroup.add(new THREE.Points(ptGeo, ptMat))

  // Ambient light (very dark)
  pageGroup.add(new THREE.AmbientLight(0x112233, 0.4))

  // Galaxy core sprite — kept in module ref so hover can pulse it
  coreSprite = buildGalaxyCoreSprite(memberHubble.value)
  pageGroup.add(coreSprite)

  // Galaxy core glow mesh (for depth blending)
  const coreGlowGeo = new THREE.SphereGeometry(0.08, 12, 12)
  const coreGlowMat = new THREE.MeshBasicMaterial({ color: 0xffeecc, transparent: true, opacity: 0.5 })
  pageGroup.add(new THREE.Mesh(coreGlowGeo, coreGlowMat))

  // Subtle orbit ring
  const ringGeo = new THREE.RingGeometry(0.12, 0.13, 64)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x223344, side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
  const ring    = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = -Math.PI / 2
  pageGroup.add(ring)

  // Background stellar population — THREE.Points from seed, single draw call
  if (doc.value) {
    const field  = buildBackgroundField(doc.value)
    const ptGeo  = new THREE.BufferGeometry()
    ptGeo.setAttribute('position', new THREE.BufferAttribute(field.positions, 3))
    ptGeo.setAttribute('color',    new THREE.BufferAttribute(field.colors,    3))
    // Circular Gaussian texture — prevents default square WebGL point rendering
    const ptCv  = document.createElement('canvas'); ptCv.width = ptCv.height = 32
    const ptCtx = ptCv.getContext('2d')!
    const ptGrd = ptCtx.createRadialGradient(16, 16, 0, 16, 16, 16)
    ptGrd.addColorStop(0,    'rgba(255,255,255,1.0)')
    ptGrd.addColorStop(0.30, 'rgba(255,255,255,0.7)')
    ptGrd.addColorStop(0.70, 'rgba(255,255,255,0.15)')
    ptGrd.addColorStop(1.00, 'rgba(255,255,255,0)')
    ptCtx.fillStyle = ptGrd; ptCtx.fillRect(0, 0, 32, 32)
    const ptTex = new THREE.CanvasTexture(ptCv)
    ptTex.generateMipmaps = false; ptTex.minFilter = THREE.LinearFilter
    const ptMat  = new THREE.PointsMaterial({
      map:             ptTex,
      vertexColors:    true,
      size:            0.016,
      sizeAttenuation: true,
      transparent:     true,
      opacity:         0.72,
      blending:        THREE.AdditiveBlending,
      depthWrite:      false,
      alphaTest:       0.01,
    })
    pageGroup.add(new THREE.Points(ptGeo, ptMat))
  }

  // Anchor system meshes + invisible hit proxies for reliable raycasting
  glowSprites.length = 0

  const meshes: THREE.Mesh[] = []
  for (const sys of systems.value) {
    const mesh = buildSystemMesh(sys)
    const glow = buildGlowSprite(sys)
    glow.position.copy(mesh.position)
    glow.userData.baseScale = glow.scale.x
    glowSprites[sys.idx] = glow
    pageGroup.add(mesh, glow)

    // Hit proxy: invisible sphere 3× the visual radius — makes clicking reliable
    const visR  = 0.022 + sys.planetCount * 0.005
    const hitR  = Math.max(0.06, visR * 3.0)
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(hitR, 6, 6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    )
    proxy.position.copy(mesh.position)
    proxy.userData.sysIdx = sys.idx
    pageGroup.add(proxy)
    meshes.push(proxy)   // raycaster targets the proxy, not the visual mesh
  }
  systemMeshes.value = meshes

  // Guide line: center → hovered system (invisible until hover)
  const guidePos = new Float32Array(6)
  guideGeo = new THREE.BufferGeometry()
  guideGeo.setAttribute('position', new THREE.BufferAttribute(guidePos, 3))
  guideLine = new THREE.Line(guideGeo, new THREE.LineDashedMaterial({
    color: 0x00e5d0, transparent: true, opacity: 0,
    dashSize: 0.08, gapSize: 0.04, depthWrite: false,
  }))
  guideLine.frustumCulled = false
  guideLine.computeLineDistances()
  pageGroup.add(guideLine)
}

let hoveredIdx = -1

function raycastSystems(event: MouseEvent): StarSystem | null {
  if (!camera || !scene) return null
  const w = window.innerWidth, h = window.innerHeight - VIZ_BAR_H
  mouse.x =  (event.clientX / w) * 2 - 1
  mouse.y = -((event.clientY - VIZ_BAR_H) / h) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects(systemMeshes.value, false)
  if (!hits.length) return null
  const idx = (hits[0]!.object as THREE.Mesh).userData.sysIdx as number
  return systems.value[idx] ?? null
}

function flyToSystem(sys: StarSystem) {
  const mesh = systemMeshes.value[sys.idx]
  if (!mesh || !camera || !controls) return
  const target = mesh.position.clone()
  const fromCam = camera.position.clone().sub(target).normalize()
  const dest    = target.clone().addScaledVector(fromCam, 0.55)
  gsap.to(controls.target, {
    x: target.x, y: target.y, z: target.z,
    duration: 0.55, ease: 'power2.out',
    onUpdate: () => controls!.update(),
  })
  gsap.to(camera.position, {
    x: dest.x, y: dest.y, z: dest.z,
    duration: 1.3, ease: 'power3.out',
    onUpdate: () => controls!.update(),
  })
}

function resetToGalaxyCenter() {
  if (!controls || !camera) return
  gsap.to(controls.target, {
    x: 0, y: 0, z: 0,
    duration: 0.8, ease: 'power2.out',
    onUpdate: () => controls!.update(),
  })
  const dist = camera.position.distanceTo(new THREE.Vector3())
  const dir  = camera.position.clone().normalize()
  const dest = dir.multiplyScalar(Math.max(3.5, dist))
  gsap.to(camera.position, {
    x: dest.x, y: dest.y, z: dest.z,
    duration: 1.0, ease: 'power2.out',
    onUpdate: () => controls!.update(),
    onComplete: () => { if (controls) controls.autoRotate = true },
  })
}

function onClick(event: MouseEvent) {
  if (dragMoved > 6) return
  const sys = raycastSystems(event)
  if (sys) {
    selectedSystem.value = sys
    controls!.autoRotate = false
    clickPct.x      = event.clientX / window.innerWidth  * 100
    clickPct.y      = event.clientY / window.innerHeight * 100
    clickBearing.value = Math.atan2(
      event.clientY / window.innerHeight - 0.5,
      event.clientX / window.innerWidth  - 0.5,
    )
    flyToSystem(sys)
  } else {
    selectedSystem.value = null
    resetToGalaxyCenter()
  }
}

function applyHover(newIdx: number) {
  if (newIdx === hoveredIdx) return

  // Restore previous
  if (hoveredIdx >= 0) {
    const pg = glowSprites[hoveredIdx]
    if (pg) pg.scale.setScalar(pg.userData.baseScale as number)
  }

  if (newIdx >= 0) {
    const mesh = systemMeshes.value[newIdx]
    const ng   = glowSprites[newIdx]
    if (ng) ng.scale.setScalar((ng.userData.baseScale as number) * 2.4)

    // Brighten core
    if (coreSprite) (coreSprite.material as THREE.SpriteMaterial).opacity = 1.0

    // Update guide line to point from center → hovered system
    if (guideLine && guideGeo && mesh) {
      const attr = guideGeo.attributes['position'] as THREE.BufferAttribute
      attr.setXYZ(0, 0, 0, 0)
      attr.setXYZ(1, mesh.position.x, mesh.position.y, mesh.position.z)
      attr.needsUpdate = true
      guideLine.computeLineDistances()
      ;(guideLine.material as THREE.LineDashedMaterial).opacity = 0.45
    }
    hoveringSystem.value = true
  } else {
    if (coreSprite) (coreSprite.material as THREE.SpriteMaterial).opacity = 0.65
    if (guideLine) (guideLine.material as THREE.LineDashedMaterial).opacity = 0
    hoveringSystem.value = false
  }

  hoveredIdx = newIdx
}

function onMouseMove(event: MouseEvent) {
  const sys = raycastSystems(event)
  applyHover(sys?.idx ?? -1)
}

// ── Drag-vs-click detection — see the matching comment in ClusterInteriorPage.vue ──
let dragStartX = 0, dragStartY = 0, dragMoved = 0
function onDragStart(e: MouseEvent) { dragStartX = e.clientX; dragStartY = e.clientY; dragMoved = 0 }
function onDragTrack(e: MouseEvent) { dragMoved = Math.abs(e.clientX - dragStartX) + Math.abs(e.clientY - dragStartY) }

function onMouseLeaveCanvas() {
  applyHover(-1)
}

function teardown() {
  disposeScene(pageGroup)
  scene?.remove(pageGroup)
  if (scene) {
    scene.background = null
    scene.fog        = null
  }
  if (controls) controls.autoRotate = false
  coreSprite = null; guideLine = null; guideGeo = null
  glowSprites.length = 0
}

// ── Navigation ─────────────────────────────────────────────────────────────────
async function descendToSurface(sys: StarSystem) {
  const mesh = systemMeshes.value[sys.idx]

  // Final in-page approach toward the system before the route change —
  // ClusterGalaxyPage and ClusterSystemPage now share the same renderer/camera.
  if (mesh && camera && controls) {
    const target  = mesh.position.clone()
    const fromCam = camera.position.clone().sub(target).normalize()
    const dest    = target.clone().addScaledVector(fromCam, 0.15)
    gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target)
    await new Promise<void>(resolve => {
      gsap.to(controls!.target, { x: target.x, y: target.y, z: target.z, duration: 0.4, ease: 'power2.out', onUpdate: () => controls?.update() })
      gsap.to(camera!.position, { x: dest.x, y: dest.y, z: dest.z, duration: 0.7, ease: 'power2.out', onUpdate: () => controls?.update(), onComplete: resolve })
    })
  }

  // Project selected system's mesh to screen for transition origin
  if (mesh && camera) {
    const sc = mesh.position.clone().project(camera)
    clickPct.x      = (sc.x + 1) / 2 * 100
    clickPct.y      = (1 - sc.y) / 2 * 100
    clickBearing.value = Math.atan2(clickPct.y/100 - 0.5, clickPct.x/100 - 0.5)
  }
  await transition.depart(clickPct.x, clickPct.y, 'lightning', clickBearing.value)
  void router.push({
    name:   'cluster-system',
    params: { clusterSlug: clusterSlug.value, memberId: memberId.value, systemIdx: sys.idx },
    query:  { bearing: clickBearing.value.toFixed(3) },
  })
}

function claimUrl(sys: StarSystem): string {
  return `/mint?mode=cluster-world&cluster=${encodeURIComponent(clusterSlug.value)}&galaxy=${encodeURIComponent(memberId.value)}&system=${encodeURIComponent(sys.name)}`
}

function morphChipColor(morph: string): string {
  return ({ K: '#ffbe6e', M: '#ff8250', G: '#ffe4aa', F: '#f8f7ff', A: '#cad7ff', B: '#aabfff', O: '#9bb0ff' } as Record<string, string>)[morph] ?? '#445566'
}

// ── Data loading (delegates to composable) ────────────────────────────────────
async function loadAndBuild() {
  await loadGalaxyData()
  if (doc.value) {
    systems.value = mapDocToSystems(doc.value)
    if (doc.value._source !== 'generated') {
      console.warn(
        `[exotopia] cluster-galaxy ${clusterSlug.value}/${memberId.value}:` +
        ` using ${doc.value._source ?? 'no-data'} — generated JSON not found`
      )
    }
  }
  buildScene()
  // Fly in to normal orbital distance after scene builds
  if (camera && controls) {
    gsap.to(camera.position, {
      x: 0, y: 1.8, z: 4.5,
      duration: 1.6, ease: 'power3.out',
      onUpdate: () => controls?.update(),
    })
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  // Await a tick so MainLayout's onMounted (which calls viz.init()) runs first —
  // this page can otherwise mount before the shared renderer exists.
  await Promise.resolve()
  void loadAndBuild()
})
onBeforeUnmount(teardown)
</script>

<style scoped>
.cg-page    { position: relative; width: 100vw; height: 100vh; overflow: hidden; }

.cg-breadcrumb {
  position: absolute; top: 12px; left: 12px; z-index: 10;
  background: rgba(5,10,20,0.72); padding: 4px 10px; border-radius: 20px;
  backdrop-filter: blur(4px);
}

.cg-claim-banner {
  position: absolute; top: 50%; left: 50%; z-index: 15;
  transform: translate(-50%, -50%);
  background: rgba(20, 14, 4, 0.88); border: 1px solid rgba(255,160,0,0.35);
  padding: 8px 16px; border-radius: 20px; backdrop-filter: blur(6px);
  display: flex; align-items: center; pointer-events: none;
}

.cg-header {
  position: absolute; top: 48px; left: 12px; z-index: 10;
  background: rgba(5,10,20,0.72); padding: 10px 14px; border-radius: 8px;
  backdrop-filter: blur(4px); max-width: 300px;
}

.cg-panel {
  position: absolute; top: 50%; right: 16px; z-index: 10;
  transform: translateY(-50%);
  background: rgba(5,10,20,0.88); padding: 14px;
  border-radius: 8px; border: 1px solid #1a2a3a;
  backdrop-filter: blur(6px); min-width: 220px; max-width: 260px;
}
.cg-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }

.cg-detail-row { display: flex; justify-content: space-between; font-size: 11px;
  margin-bottom: 4px; gap: 8px; }
.cg-detail-label { color: #556677; flex-shrink: 0; }

.cg-footer {
  position: absolute; bottom: 16px; left: 12px; z-index: 10;
  background: rgba(5,10,20,0.72); padding: 8px 12px; border-radius: 8px;
  backdrop-filter: blur(4px);
}
.cg-chip {
  font-size: 9px; color: #778899; padding: 2px 6px;
  border-radius: 10px; border: 1px solid #223344;
}

.cg-loading {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; z-index: 20;
  background: rgba(3,6,9,0.80);
}

.slide-panel-enter-active, .slide-panel-leave-active { transition: all 0.2s ease; }
.slide-panel-enter-from  { opacity: 0; transform: translateY(-50%) translateX(20px); }
.slide-panel-leave-to    { opacity: 0; transform: translateY(-50%) translateX(20px); }
</style>
