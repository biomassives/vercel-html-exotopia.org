<template>
  <!-- Transparent overlay — shared Three.js canvas in MainLayout renders behind -->
  <q-page class="ci-page viz-overlay-page" :style="{ cursor: hoverName ? 'pointer' : 'default' }"
    @click="onClick" @mousedown="onDragStart" @mousemove="onMouseMove($event); onDragTrack($event)" @mouseleave="onMouseLeave">

    <!-- Breadcrumb -->
    <div class="ci-breadcrumb row items-center q-gutter-xs no-wrap">
      <q-btn flat dense size="xs" color="blue-grey-5" icon="mdi-chevron-left" label="Cosmic"
        @click="$router.push('/cosmic')" />
      <span class="text-blue-grey-7 text-caption">/</span>
      <span class="text-blue-grey-4 text-caption">{{ clusterData?.cluster ?? slug }}</span>
    </div>

    <!-- Cluster header -->
    <div v-if="clusterData" class="ci-header">
      <div class="text-caption text-blue-grey-5 q-mb-xs" style="letter-spacing:0.1em">GALAXY CLUSTER · INTERIOR</div>
      <div class="text-h6 text-blue-grey-2">{{ clusterData.cluster }}</div>
      <div class="text-caption text-blue-grey-5">
        {{ clusterData.dist_mpc.toFixed(1) }} Mpc ·
        {{ clusterData.member_count }} members ·
        R<sub style="font-size:8px">vir</sub> {{ clusterData.rvir_mpc.toFixed(2) }} Mpc
        <span v-if="clusterData.tx_kev"> · T<sub style="font-size:8px">X</sub> {{ clusterData.tx_kev.toFixed(1) }} keV</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ci-loading">
      <q-spinner-dots color="cyan-8" size="32px" />
      <div class="text-caption text-blue-grey-5 q-mt-sm">Loading cluster members…</div>
    </div>

    <!-- Galaxy info / loading / interior panel -->
    <Transition name="slide-panel" mode="out-in">

      <!-- ── CLUSTER: member galaxy info ────────────────────────────────── -->
      <div v-if="viewMode === 'cluster' && selected" key="cluster" class="ci-panel">
        <div class="ci-panel-header">
          <div>
            <div class="text-caption text-cyan-7 q-mb-xs" style="letter-spacing:0.1em">MEMBER GALAXY</div>
            <div class="ci-zoom-badge" :class="`ci-zoom-badge--${zoomLevel}`">
              {{ zoomLevel === 'systems' ? '⬡ SYSTEMS VIEW' : zoomLevel === 'galaxy' ? '◈ GALAXY VIEW' : '◎ OVERVIEW' }}
            </div>
          </div>
          <q-btn flat dense size="xs" icon="mdi-close" color="blue-grey-5" @click="deselect" />
        </div>

        <div class="text-subtitle2 text-blue-grey-1 q-mb-xs">{{ selected.name || selected.id }}</div>
        <div v-if="selected.aliases?.length" class="text-caption text-blue-grey-5 q-mb-sm">
          {{ selected.aliases.join(' · ') }}
        </div>

        <div class="ci-row"><span class="ci-lbl">Type</span><span class="text-blue-grey-3">{{ selected.hubble }}</span></div>
        <div v-if="selected.bt_mag != null" class="ci-row">
          <span class="ci-lbl">B<sub>T</sub> magnitude</span>
          <span class="text-blue-grey-3">{{ selected.bt_mag.toFixed(1) }}</span>
        </div>
        <div v-if="selected.system_architecture?.planet_bias" class="ci-row">
          <span class="ci-lbl">Planet bias</span>
          <span class="text-amber-5" style="font-size:10px">{{ selected.system_architecture.planet_bias }}</span>
        </div>
        <template v-if="selectedRealData">
          <div class="ci-row">
            <span class="ci-lbl">Star systems</span><span class="text-cyan-5">{{ selectedRealData.systems }}</span>
          </div>
          <div class="ci-row">
            <span class="ci-lbl">Mapped worlds</span><span class="text-cyan-5">{{ selectedRealData.planets }}</span>
          </div>
          <div class="ci-data-badge">◉ mapped data</div>
        </template>
        <div v-else-if="selected.system_architecture?.estimated_planets != null" class="ci-row">
          <span class="ci-lbl">Est. worlds</span>
          <span class="text-blue-grey-3">{{ selected.system_architecture.estimated_planets }}</span>
        </div>
        <div v-if="selected.system_architecture?.icm_stress != null" class="ci-row">
          <span class="ci-lbl">ICM stress</span>
          <span class="text-blue-grey-3">{{ selected.system_architecture.icm_stress.toFixed(2) }}</span>
        </div>
        <div v-if="selected.notes" class="text-caption text-blue-grey-6 q-mt-xs" style="font-size:9px;line-height:1.5">
          {{ selected.notes }}
        </div>
        <div v-if="zoomLevel === 'systems'" class="ci-lod-cloud">
          <q-icon name="mdi-star-four-points-small" size="9px" />
          <span>{{ systemCloudCount }} systems visible</span>
        </div>
        <q-separator color="blue-grey-8" class="q-my-sm" />
        <q-btn v-if="zoomLevel !== 'systems'" dense rounded unelevated size="sm" color="blue-grey-8" class="full-width q-mb-xs"
          icon="mdi-magnify-plus" label="Zoom In — Reveal Systems" @click="flyToSystemView()" />
        <q-btn dense rounded unelevated size="sm" color="cyan-8" class="full-width q-mb-xs"
          icon="mdi-telescope" label="Explore Star Systems" @click="exploreGalaxy(selected)" />
        <q-btn flat dense size="xs" color="blue-grey-5" class="full-width"
          icon="mdi-map-marker-plus" label="Create a Settlement Here" @click="navigateToGalaxy(true)" />
      </div>

      <!-- ── GALAXY LOADING ──────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'galaxy-loading'" key="loading" class="ci-panel">
        <div class="ci-panel-header">
          <div class="text-caption text-cyan-7" style="letter-spacing:0.1em">ENTERING GALAXY</div>
        </div>
        <div class="text-subtitle2 text-blue-grey-2 q-mt-xs q-mb-sm">
          {{ exploredMember?.name || exploredMember?.id }}
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <q-spinner-dots color="cyan-8" size="20px"/>
          <span class="text-caption text-blue-grey-5">Loading star systems…</span>
        </div>
      </div>

      <!-- ── GALAXY INTERIOR ─────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'galaxy'" key="galaxy" class="ci-panel ci-panel--galaxy">
        <div class="ci-panel-header">
          <div>
            <div class="text-caption text-cyan-6 q-mb-xs" style="letter-spacing:0.1em">GALAXY INTERIOR</div>
            <div class="text-subtitle2 text-blue-grey-1">{{ exploredMember?.name || exploredMember?.id }}</div>
            <div class="text-caption text-blue-grey-5">
              {{ exploredDoc?.galaxy_hubble }} · {{ galSystems.length }} systems
            </div>
          </div>
          <q-btn flat dense size="xs" icon="mdi-close" color="blue-grey-5" @click="exitGalaxyExplore" />
        </div>

        <!-- Full-page galaxy view — the same dissolve handoff descendToSurface
             uses, so browsing here gets the matched-placement crossfade too,
             not just "Create a Settlement Here" (SPEC_DISSOLVE_HANDOFF.md §3,
             Q1: this was previously the only path into ClusterGalaxyPage). -->
        <q-btn flat dense size="xs" color="cyan-7" class="full-width q-mb-xs"
          icon="mdi-view-dashboard" label="View Full Galaxy" @click="navigateToGalaxy(false)" />

        <template v-if="selectedSystem">
          <q-separator color="blue-grey-8" class="q-my-sm" />
          <div class="text-caption text-cyan-9 q-mb-xs" style="font-size:8px;letter-spacing:0.10em">STAR SYSTEM</div>
          <div class="text-subtitle2 text-blue-grey-1 q-mb-xs">{{ selectedSystem.name }}</div>
          <div class="ci-row">
            <span class="ci-lbl">Spectral</span>
            <span :style="{ color: selectedSystem.specColor }">{{ selectedSystem.spectral }}–class</span>
          </div>
          <div class="ci-row">
            <span class="ci-lbl">Planets</span>
            <span class="text-blue-grey-3">{{ selectedSystem.planetCount }}</span>
          </div>
          <div class="ci-row">
            <span class="ci-lbl">Temp range</span>
            <span class="text-blue-grey-3">{{ selectedSystem.eqtRange }}</span>
          </div>
          <q-separator color="blue-grey-8" class="q-my-sm" />
          <div class="row q-gutter-xs q-mb-xs">
            <q-btn dense rounded unelevated size="sm" color="cyan-9" icon="mdi-telescope" label="Enter system"
              @click="descendToSurface(selectedSystem)" />
            <q-btn dense rounded unelevated size="sm" color="amber-9" icon="mdi-map-marker-plus" label="Settle"
              @click="goClaimSystem(selectedSystem)" />
          </div>
          <q-btn flat dense size="xs" color="blue-grey-6" class="full-width q-mb-xs"
            icon="mdi-close" label="Deselect system" @click="selectedSystem = null" />
        </template>
        <template v-else>
          <div class="text-caption text-blue-grey-6 q-mt-xs q-mb-sm" style="font-size:9px;line-height:1.55">
            Scroll to zoom · drag to orbit · click a star system to select it
          </div>
        </template>

        <q-separator color="blue-grey-9" class="q-my-xs" />
        <q-btn flat dense size="xs" color="blue-grey-5" class="full-width"
          icon="mdi-chevron-left" label="Back to cluster" @click="exitGalaxyExplore" />
      </div>

    </Transition>

    <!-- Hover tooltip -->
    <Transition name="fade">
      <div v-if="hoverName" class="ci-tooltip"
        :style="{ left: (hoverPos.x + 14) + 'px', top: (hoverPos.y - 8) + 'px' }">
        {{ hoverName }}
      </div>
    </Transition>

    <!-- Bottom HUD (void catalogs get VoidDefenderNav instead — it already shows the count) -->
    <div v-if="!isVoid" class="ci-hud">
      <span class="text-caption text-blue-grey-6">{{ memberCount }} galaxies · scroll to zoom · drag to orbit</span>
    </div>

    <VoidDefenderNav
      v-if="isVoid"
      :void-id="slug"
      :void-name="clusterData?.cluster ?? slug"
      :members="voidNavMembers"
      :current-id="selected?.id"
      @select="selectVoidNavMember"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { useVizRenderer, VIZ_BAR_H } from 'src/composables/useVizRenderer'
import { disposeScene } from 'src/lib/three-utils'
import { computeHandoffOrigin, placeCameraForHandoff } from 'src/lib/scene-handoff'
import { prefetchClusterGalaxies, fetchGalaxyDoc, buildBackgroundField, mulberry32 } from 'src/composables/useClusterGalaxyData'
import type { ClusterGalaxyDoc } from 'src/composables/useClusterGalaxyData'
import { useSettlements, clusterKey } from 'src/lib/settlements'
import { useSceneTransitionStore }  from 'src/stores/scene-transition'
import VoidDefenderNav, { type VoidNavMember } from 'src/components/VoidDefenderNav.vue'

// ── Scene constants ───────────────────────────────────────────────────────────
const SCENE_SCALE = 80   // scene units per Mpc — gives ~10 su for a 0.13 Mpc spread

// ── Types ─────────────────────────────────────────────────────────────────────
interface SystemDataEntry { systems: number; planets: number }

interface SystemArch {
  planet_bias:        string
  estimated_planets:  number
  metallicity_fe_h:   number
  icm_stress:         number
  cluster_zone?:      'void_wall' | 'void_interior' | 'void_far_wall'
}

interface ClusterMember {
  id:                 string
  name:               string
  aliases?:           string[]
  ra:                 number
  dec:                number
  hubble:             string
  bt_mag?:            number
  offset:             [number, number, number]
  lod3_params?:       { scene_su: number; axis_ratio: number; pa_deg?: number }
  is_named?:          boolean
  notes?:             string
  system_architecture?: SystemArch
}

interface ClusterData {
  cluster:      string
  slug:         string
  dist_mpc:     number
  rvir_mpc:     number
  richness:     number
  sigma_v_kms?: number
  tx_kev?:      number
  member_count: number
  notes:        string
  members:      ClusterMember[]
}

type GalMorph = 'cD' | 'E' | 'S0' | 'Sa' | 'Sb' | 'Irr'
type ViewMode = 'cluster' | 'galaxy-loading' | 'galaxy'

interface GalSystem {
  idx:         number
  id:          string
  name:        string
  spectral:    string
  specColor:   string
  planetCount: number
  eqtRange:    string
  worldPos:    THREE.Vector3
}

// ── Route ─────────────────────────────────────────────────────────────────────
const route      = useRoute()
const router     = useRouter()
const slug       = computed(() => String(route.params.slug ?? ''))
const transition = useSceneTransitionStore()

// Last click origin (viewport %) and bearing — used when navigating to galaxy
const clickPct     = { x: 50, y: 50 }
const clickBearing = ref(0)

// ── Vue state ─────────────────────────────────────────────────────────────────
const loading     = ref(true)
const clusterData = ref<ClusterData | null>(null)
const selected    = ref<ClusterMember | null>(null)
const hoverName   = ref<string>('')
const hoverPos    = ref({ x: 0, y: 0 })
const memberCount = ref(0)
const systemDataMap = ref(new Map<string, SystemDataEntry>())

// ── Void nav (only when this slug's members carry a cluster_zone — i.e. it's a
// void member catalog, not a real galaxy cluster) ──────────────────────────────
// Checks all members, not just members[0] — a catalog where the first entry
// happens to omit cluster_zone (e.g. it's added incrementally by a generator)
// would otherwise be misclassified as a non-void cluster.
const isVoid = computed(() =>
  !!clusterData.value?.members?.some(m => m.system_architecture?.cluster_zone))

const voidNavMembers = computed<VoidNavMember[]>(() => {
  if (!isVoid.value || !clusterData.value) return []
  // "Limited objects" — the real named galaxies (NGC 6503, IC 342, …), not the
  // synthetic filler population used to bulk out the render.
  return clusterData.value.members.filter(m => m.is_named).map(m => ({
    id:       m.id,
    name:     m.name || m.id,
    zone:     m.system_architecture?.cluster_zone === 'void_wall'     ? 'wall'
            : m.system_architecture?.cluster_zone === 'void_far_wall' ? 'far_wall'
            : 'interior',
    angleDeg: Math.atan2(m.offset[2], m.offset[0]) * 180 / Math.PI,
  }))
})

async function selectVoidNavMember(memberId: string) {
  const member = clusterData.value?.members.find(m => m.id === memberId)
  const proxy  = hitProxies.find(p => (p.userData.member as ClusterMember).id === memberId)
  if (!member || !proxy) return
  selected.value = member
  void router.replace({ query: { member: member.id } })
  // Edge-ring nav is a fast-travel shortcut — unlike a direct sprite click (which
  // only selects + shows the "Explore Star Systems" button), this goes straight
  // into the galaxy interior so the ring is actually a one-click descent path
  // down to star systems / settlements, not a dead end requiring a second click.
  await exploreGalaxy(member)
}

// ── LOD / zoom reveal state ───────────────────────────────────────────────────
type ZoomLevel = 'overview' | 'galaxy' | 'systems'
const zoomLevel        = ref<ZoomLevel>('overview')
const systemCloudCount = ref(0)
let   systemCloudMesh: THREE.Points | null = null

const selectedRealData = computed(() =>
  selected.value ? systemDataMap.value.get(selected.value.id) ?? null : null
)

// ── Galaxy interior view state ────────────────────────────────────────────────
const viewMode        = ref<ViewMode>('cluster')
const exploredMember  = ref<ClusterMember | null>(null)
const exploredDoc     = ref<ClusterGalaxyDoc | null>(null)
const selectedSystem  = ref<GalSystem | null>(null)
const galSystems      = ref<GalSystem[]>([])
const { hasSettlement, addSettlement } = useSettlements()

// ── Three.js handles — shared renderer; per-page raycaster ───────────────────
const viz = useVizRenderer()
// Convenience aliases updated on mount (scene/camera may be null until then)
let renderer:  THREE.WebGLRenderer     | null = null
let scene:     THREE.Scene             | null = null
let camera:    THREE.PerspectiveCamera | null = null
let controls:  OrbitControls           | null = null
const raycaster = new THREE.Raycaster()
let _stopTick: (() => void) | null = null

// Root group for all page-level scene objects — added/removed on mount/unmount
const pageGroup = new THREE.Group()

const mouseNDC       = new THREE.Vector2()
const hitProxies:    THREE.Mesh[]    = []
const memberSprites: THREE.Sprite[]  = []
const clusterCenter  = new THREE.Vector3()
// Set alongside clusterCenter once members load — see loadAndBuild(). deselect()
// reuses this instead of a hardcoded offset so voids (35-90x a real cluster's
// spread) don't land the camera back in empty space on every deselect, only
// on first load (the bug this was originally meant to fix — see SPEC.md §22.2).
let   overviewCamOffset = 28
// Galaxy interior objects
let   galaxyGroup:    THREE.Group | null = null
const sysProxies:     THREE.Mesh[]       = []
const galGlowSprites: THREE.Sprite[]     = []
let   hoveredSysIdx   = -1   // centroid of loaded members, set after build

// ── Galaxy morph texture cache ────────────────────────────────────────────────
const _texCache = new Map<string, THREE.CanvasTexture>()

function morphColor(morph: GalMorph): THREE.Color {
  if (morph === 'cD') return new THREE.Color(0xffd580)
  if (morph === 'E')  return new THREE.Color(0xffcc88)
  if (morph === 'S0') return new THREE.Color(0xddddff)
  if (morph === 'Sa' || morph === 'Sb') return new THREE.Color(0x99ccff)
  return new THREE.Color(0x88ffcc)  // Irr
}

function makeGalSprite(morph: GalMorph, col: THREE.Color, sizeSu: number): THREE.Sprite {
  const key = `${morph}_${col.getHexString()}`
  let tex = _texCache.get(key)

  if (!tex) {
    const S  = 256
    const cx = S / 2
    const cv = document.createElement('canvas')
    cv.width = cv.height = S
    const ctx = cv.getContext('2d')!
    const [r, g, b] = [Math.round(col.r * 255), Math.round(col.g * 255), Math.round(col.b * 255)]
    const rgb = `${r},${g},${b}`

    ctx.save()
    ctx.beginPath(); ctx.arc(cx, cx, cx * 0.90, 0, Math.PI * 2); ctx.clip()

    const pk = morph === 'cD' ? 0.70 : morph === 'E' ? 0.58 : morph === 'S0' ? 0.48 : morph === 'Sa' || morph === 'Sb' ? 0.42 : 0.34
    const gGlow = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.82)
    gGlow.addColorStop(0.00, `rgba(255,255,255,${pk.toFixed(3)})`)
    gGlow.addColorStop(0.10, `rgba(255,255,255,${(pk * 0.70).toFixed(3)})`)
    gGlow.addColorStop(0.25, `rgba(${rgb},${pk.toFixed(3)})`)
    gGlow.addColorStop(0.55, `rgba(${rgb},${(pk * 0.35).toFixed(3)})`)
    gGlow.addColorStop(0.85, `rgba(${rgb},${(pk * 0.06).toFixed(3)})`)
    gGlow.addColorStop(1.00, `rgba(${rgb},0)`)
    ctx.fillStyle = gGlow; ctx.fillRect(0, 0, S, S)

    if (morph === 'cD') {
      ctx.beginPath(); ctx.ellipse(cx, cx, S*0.42, S*0.42, 0, 0, Math.PI*2)
      ctx.strokeStyle = `rgba(${rgb},0.22)`; ctx.lineWidth = 2.0; ctx.stroke()
      ctx.beginPath(); ctx.ellipse(cx, cx, S*0.26, S*0.26, 0, 0, Math.PI*2)
      ctx.strokeStyle = `rgba(${rgb},0.58)`; ctx.lineWidth = 3.5; ctx.stroke()
      const nc = ctx.createRadialGradient(cx,cx,0,cx,cx,S*0.09)
      nc.addColorStop(0,`rgba(255,255,255,1.0)`); nc.addColorStop(1,`rgba(${rgb},0)`)
      ctx.fillStyle=nc; ctx.beginPath(); ctx.arc(cx,cx,S*0.09,0,Math.PI*2); ctx.fill()

    } else if (morph === 'E') {
      ctx.beginPath(); ctx.ellipse(cx, cx, S*0.35, S*0.28, Math.PI*0.2, 0, Math.PI*2)
      ctx.strokeStyle = `rgba(${rgb},0.62)`; ctx.lineWidth = 3.0; ctx.stroke()
      const ng = ctx.createRadialGradient(cx,cx,0,cx,cx,S*0.12)
      ng.addColorStop(0,`rgba(255,255,255,0.95)`); ng.addColorStop(1,`rgba(${rgb},0)`)
      ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(cx,cx,S*0.12,0,Math.PI*2); ctx.fill()

    } else if (morph === 'S0') {
      ctx.beginPath(); ctx.ellipse(cx, cx, S*0.38, S*0.14, Math.PI*0.15, 0, Math.PI*2)
      ctx.strokeStyle = `rgba(${rgb},0.65)`; ctx.lineWidth = 2.5; ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - S*0.36, cx); ctx.lineTo(cx + S*0.36, cx)
      ctx.strokeStyle = `rgba(${rgb},0.18)`; ctx.lineWidth = 1.2; ctx.stroke()

    } else if (morph === 'Sa' || morph === 'Sb') {
      const arms = morph === 'Sa' ? 2 : 3
      for (let a = 0; a < arms; a++) {
        const start = (a / arms) * Math.PI * 2
        ctx.beginPath()
        for (let i = 0; i <= 40; i++) {
          const t  = i / 40
          const th = start + t * Math.PI * 1.6
          const rr = S * (0.05 + t * 0.38)
          const x  = cx + Math.cos(th) * rr
          const y  = cx + Math.sin(th) * rr
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(${rgb},0.45)`; ctx.lineWidth = 1.8; ctx.stroke()
      }
      ctx.beginPath(); ctx.ellipse(cx, cx, S*0.10, S*0.06, 0, 0, Math.PI*2)
      ctx.strokeStyle = `rgba(255,255,255,0.55)`; ctx.lineWidth = 2.0; ctx.stroke()

    } else {
      // Irr — irregular blobs
      for (let i = 0; i < 3; i++) {
        const ox = cx + (i - 1) * S * 0.12
        const oy = cx + Math.sin(i * 1.4) * S * 0.08
        ctx.beginPath(); ctx.ellipse(ox, oy, S*(0.10 + i*0.04), S*(0.08 + i*0.03), i*0.7, 0, Math.PI*2)
        ctx.strokeStyle = `rgba(${rgb},${0.38 + i*0.10})`; ctx.lineWidth = 1.5; ctx.stroke()
      }
    }
    ctx.restore()

    tex = new THREE.CanvasTexture(cv)
    _texCache.set(key, tex)
  }

  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  const sp  = new THREE.Sprite(mat)
  sp.scale.setScalar(sizeSu)
  sp.frustumCulled = false
  return sp
}

// ── Scene initialisation ──────────────────────────────────────────────────────
function initScene() {
  // Grab shared renderer refs
  renderer = viz.renderer
  scene    = viz.scene
  camera   = viz.camera
  controls = viz.controls
  if (!renderer || !scene || !camera || !controls) return

  // Configure scene appearance for the cluster-interior level
  scene.background = new THREE.Color(0x000408)
  scene.fog        = new THREE.FogExp2(0x000408, 0.006)

  // Configure camera for cluster-interior scale
  camera.fov  = 55
  camera.near = 0.05
  camera.far  = 300
  camera.position.set(0, 8, 26)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  // Configure controls for cluster-interior navigation
  controls.minDistance  = 0.3
  controls.maxDistance  = 60
  controls.zoomToCursor = true

  scene.add(pageGroup)

  buildBackground()

  // Canvas event listeners (canvas owned by MainLayout)
  viz.canvas?.addEventListener('wheel', onWheel, { passive: false })
}

function buildBackground() {
  const count = 2000
  const pos   = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r  = 60 + Math.random() * 100
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    pos[i*3]   = r * Math.sin(ph) * Math.cos(th)
    pos[i*3+1] = r * Math.sin(ph) * Math.sin(th)
    pos[i*3+2] = r * Math.cos(ph)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({ color: 0x99aabb, size: 0.18, sizeAttenuation: true, transparent: true, opacity: 0.55 })
  pageGroup.add(new THREE.Points(geo, mat))
}

async function loadAndBuild() {
  loading.value = true
  try {
    const [membersRes, indexRes] = await Promise.all([
      fetch(`/clusters/${slug.value}-members.json`),
      fetch('/star-systems/index.json').catch(() => null),
    ])
    if (!membersRes.ok) throw new Error(`HTTP ${membersRes.status}`)
    const data: ClusterData = await membersRes.json()
    clusterData.value = data

    // Build galaxy→data lookup from the star-systems index
    if (indexRes?.ok) {
      type IdxCluster = Array<{ galaxy_id: string; systems: number; planets: number }>
      type Idx = { clusters: Record<string, IdxCluster> }
      const idx = await indexRes.json() as Idx
      const entries = idx.clusters[slug.value] ?? []
      const map = new Map<string, SystemDataEntry>()
      for (const e of entries) map.set(e.galaxy_id, { systems: e.systems, planets: e.planets })
      systemDataMap.value = map
    }

    buildMembers(data.members)
    memberCount.value = data.members.length

    // Warm the galaxy data cache for named members so navigation feels instant
    const namedIds = data.members.filter(m => m.is_named).map(m => m.id)
    prefetchClusterGalaxies(slug.value, namedIds)

    // Re-orient camera to look at actual cluster centroid (offsets aren't always
    // centered on the origin — Virgo's members, for example, are skewed -Y)
    if (!camera || !controls) return
    const c = clusterCenter

    // Camera offset scales with the actual member spread rather than a fixed
    // constant — real clusters (~0.1-2 Mpc virial radius) keep ~today's framing
    // via the floor, but voids (45-130 Mpc radius, 35-90x larger at SCENE_SCALE)
    // no longer start with the camera lost in empty space.
    const boundRadius = memberSprites.reduce((max, s) => Math.max(max, s.position.distanceTo(c)), 0)
    const camOffset    = Math.max(28, boundRadius * 1.6)
    overviewCamOffset  = camOffset

    if (transition.phase !== 'idle') {
      // Arrived via a transition (the common case — CosmicPage's cluster-sphere
      // click) — place the camera to reproduce the departing frame's
      // composition around the cluster's real centroid, reusing camOffset as
      // the handoff distance rather than a fixed constant (clusters and voids
      // span wildly different physical scales, which is exactly why camOffset
      // is already computed per-cluster). See SPEC_DISSOLVE_HANDOFF.md §2.
      placeCameraForHandoff(
        camera, controls, c,
        { ox: transition.ox, oy: transition.oy, bearing: transition.bearing },
        camOffset,
      )
    } else {
      // Direct navigation (bookmark, refresh) — no departing frame to match,
      // fall back to the previous recenter + gentle intro zoom from farther back.
      controls.target.copy(c)
      camera.position.set(c.x, c.y + camOffset * 0.35, c.z + camOffset)
      camera.lookAt(c)
      controls.update()
      gsap.from(camera.position, {
        duration: 2.4, z: c.z + camOffset * 1.9, ease: 'power3.out',
        onUpdate: () => controls?.update(),
      })
    }
    // Restore selected member from URL if present
    const memberId = String(route.query.member ?? '').trim()
    if (memberId && clusterData.value) {
      const m = clusterData.value.members.find(x => x.id === memberId)
      if (m) {
        selected.value = m
        const proxy = hitProxies.find(p => (p.userData.member as ClusterMember).id === memberId)
        if (proxy) flyToMember(proxy.position)
      }
    }
  } catch (e) {
    console.warn('ClusterInteriorPage: failed to load members', e)
  } finally {
    loading.value = false
  }
}

function buildMembers(members: ClusterMember[]) {
  hitProxies.length = 0
  memberSprites.length = 0

  for (const m of members) {
    const morph = (m.hubble ?? 'E') as GalMorph
    const col   = morphColor(morph)

    // Size: named members 1.6-2.8 su, others 0.6-1.4 su (scaled by magnitude)
    const magFactor = m.bt_mag != null ? Math.max(0.4, Math.min(1.0, 1.1 - (m.bt_mag - 9) * 0.06)) : 0.7
    const szBase    = m.is_named
      ? (morph === 'cD' ? 2.8 : morph === 'E' ? 2.0 : 1.6)
      : (morph === 'E'  ? 1.1 : morph === 'S0' ? 1.0 : 0.8)
    const sz = szBase * magFactor

    const sp = makeGalSprite(morph, col, sz)

    // Apply axis ratio and position angle
    const ar = m.lod3_params?.axis_ratio ?? (morph === 'S0' ? 0.35 : 0.85)
    sp.scale.y *= ar
    if (m.lod3_params?.pa_deg) {
      ;(sp.material as THREE.SpriteMaterial).rotation = m.lod3_params.pa_deg * Math.PI / 180
    }

    // Opacity from magnitude
    const opacity = m.bt_mag != null ? Math.max(0.28, Math.min(0.95, 1.10 - (m.bt_mag - 9) * 0.09)) : 0.6
    ;(sp.material as THREE.SpriteMaterial).opacity = opacity

    const [ox, oy, oz] = m.offset
    sp.position.set((ox ?? 0) * SCENE_SCALE, (oy ?? 0) * SCENE_SCALE, (oz ?? 0) * SCENE_SCALE)
    sp.userData = { member: m }
    pageGroup.add(sp)
    memberSprites.push(sp)

    // Hit proxy — slightly larger than sprite so it's easy to click, but not so
    // large that neighbours overlap (typical galaxy spacing ~1-7 su at SCENE_SCALE=80)
    const hitR  = Math.max(0.7, sz * 0.9)
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(hitR, 4, 4),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    )
    proxy.position.copy(sp.position)
    proxy.frustumCulled = false
    proxy.userData = { member: m, sprite: sp }
    pageGroup.add(proxy)
    hitProxies.push(proxy)
  }

  // Compute centroid of all member positions so camera can centre on the cluster
  clusterCenter.set(0, 0, 0)
  for (const sp of memberSprites) clusterCenter.add(sp.position)
  if (memberSprites.length > 0) clusterCenter.divideScalar(memberSprites.length)

  // Soft ICM glow centred on actual cluster position
  const icmGeo  = new THREE.SphereGeometry(4.0, 16, 16)
  const icmMat  = new THREE.MeshBasicMaterial({ color: 0x0a1a2e, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.BackSide })
  const icmMesh = new THREE.Mesh(icmGeo, icmMat)
  icmMesh.position.copy(clusterCenter)
  pageGroup.add(icmMesh)
}

// ── Animation loop ────────────────────────────────────────────────────────────
function tick() {
  updateZoomLevel()
}

// ── Input handlers ────────────────────────────────────────────────────────────
function onWheel() {
  if (!camera || !controls) return
  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)
}

function applyGalHover(newIdx: number) {
  if (newIdx === hoveredSysIdx) return
  if (hoveredSysIdx >= 0) {
    const pg = galGlowSprites[hoveredSysIdx]
    if (pg) pg.scale.setScalar(pg.userData.baseScale as number)
  }
  if (newIdx >= 0) {
    const ng = galGlowSprites[newIdx]
    if (ng) ng.scale.setScalar((ng.userData.baseScale as number) * 2.5)
  }
  hoveredSysIdx = newIdx
}

// ── Drag-vs-click detection ────────────────────────────────────────────────
// OrbitControls handles the actual drag-to-orbit itself (its own listeners
// on the canvas), but the click handler below needs to know whether THIS
// click was the tail end of a drag gesture or a genuine tap — without this,
// every orbit/pan while zoomed in also fires as a "click," misses the tiny
// raycast target, and deselects/resets the camera. Mirrors the pattern
// already used correctly in VoidInteriorPage.vue / VoidGalaxyPage.vue.
let dragStartX = 0, dragStartY = 0, dragMoved = 0
function onDragStart(e: MouseEvent) { dragStartX = e.clientX; dragStartY = e.clientY; dragMoved = 0 }
function onDragTrack(e: MouseEvent) { dragMoved = Math.abs(e.clientX - dragStartX) + Math.abs(e.clientY - dragStartY) }

function onMouseMove(e: MouseEvent) {
  if (!camera) return
  const w = window.innerWidth, h = window.innerHeight - VIZ_BAR_H
  mouseNDC.x =  (e.clientX / w) * 2 - 1
  mouseNDC.y = -((e.clientY - VIZ_BAR_H) / h) * 2 + 1
  raycaster.setFromCamera(mouseNDC, camera)

  if (viewMode.value === 'galaxy') {
    const hits = raycaster.intersectObjects(sysProxies)
    if (hits.length) {
      const idx = (hits[0].object as THREE.Mesh).userData.sysIdx as number
      const sys = galSystems.value[idx]
      hoverName.value = sys?.name ?? ''
      hoverPos.value  = { x: e.clientX, y: e.clientY }
      applyGalHover(idx)
    } else {
      hoverName.value = ''
      applyGalHover(-1)
    }
    return
  }

  const hits = raycaster.intersectObjects(hitProxies)
  if (hits.length) {
    const m = hits[0].object.userData.member as ClusterMember
    hoverName.value = m.name || m.id
    hoverPos.value  = { x: e.clientX, y: e.clientY }
  } else {
    hoverName.value = ''
  }
}

function onMouseLeave() {
  hoverName.value = ''
  applyGalHover(-1)
}

function onClick(e: MouseEvent) {
  if (dragMoved > 6 || !camera) return
  // onClick is bound on the page root, so clicks on the side panel's own
  // buttons (Explore Star Systems, Create a Settlement Here, etc.) bubble up
  // here too. This branch's cluster-mode hit path also calls router.replace
  // (member query sync) — a button click landing over a 3D hit target's
  // screen projection would otherwise race that against the button's own
  // navigateToGalaxy()/router.push. Same viz-overlay-page target-class guard
  // CosmicPage.vue's onClick uses for the identical hazard.
  if (!(e.target as HTMLElement)?.classList?.contains('viz-overlay-page')) return
  const w = window.innerWidth, h = window.innerHeight - VIZ_BAR_H
  mouseNDC.x =  (e.clientX / w) * 2 - 1
  mouseNDC.y = -((e.clientY - VIZ_BAR_H) / h) * 2 + 1
  raycaster.setFromCamera(mouseNDC, camera)

  // ── Galaxy interior mode ──────────────────────────────────────────────────
  if (viewMode.value === 'galaxy') {
    const hits = raycaster.intersectObjects(sysProxies)
    if (hits.length) {
      const idx = (hits[0].object as THREE.Mesh).userData.sysIdx as number
      const sys = galSystems.value[idx]
      if (sys) selectGalSystem(sys)
    } else {
      selectedSystem.value = null
    }
    return
  }

  // ── Cluster mode ──────────────────────────────────────────────────────────
  const hits = raycaster.intersectObjects(hitProxies)
  if (!hits.length) {
    deselect()
    return
  }
  const proxy  = hits[0].object
  const member = proxy.userData.member as ClusterMember
  selected.value = member
  clickPct.x      = e.clientX / window.innerWidth  * 100
  clickPct.y      = e.clientY / window.innerHeight * 100
  clickBearing.value = Math.atan2(
    e.clientY / window.innerHeight - 0.5,
    e.clientX / window.innerWidth  - 0.5,
  )
  void router.replace({ query: { member: member.id } })
  flyToMember(proxy.position)
  // Warm the cache during the ~2s flyToMember tween so "Explore Star Systems"
  // usually finds the doc already resolved — the loading gap is what used to
  // freeze the camera mid-approach (see exploreGalaxy()).
  void fetchGalaxyDoc(slug.value, member.id)
}

// ── Galaxy interior helpers ───────────────────────────────────────────────────

const SPECTRAL_COLOR: Record<string, string> = {
  O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
  G: '#ffe4aa', K: '#ffbe6e', M: '#ff8250',
}

function mapDocToGalSystems(doc: ClusterGalaxyDoc, origin: THREE.Vector3): GalSystem[] {
  const seed = (doc.cluster_slug + doc.galaxy_id)
    .split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0) & 0xFFFFFFFF
  const rng  = mulberry32(seed)
  return (doc.star_systems ?? []).slice(0, 80).map((s, i) => {
    const spec      = s.spectral_type[0] ?? 'K'
    const specColor = SPECTRAL_COLOR[spec] ?? '#ffbe6e'
    const temps     = s.planets.map(p => p.eq_temp_k)
    const eqtLo     = temps.length ? Math.min(...temps) : 150
    const eqtHi     = temps.length ? Math.max(...temps) : 400
    const orbitR    = 0.3 + rng() * 2.2
    const theta     = rng() * Math.PI * 2
    const phi       = Math.acos(2 * rng() - 1) * 0.55
    const worldPos  = new THREE.Vector3(
      origin.x + orbitR * Math.sin(phi) * Math.cos(theta),
      origin.y + orbitR * Math.cos(phi) * 0.28,
      origin.z + orbitR * Math.sin(phi) * Math.sin(theta),
    )
    return { idx: i, id: s.id, name: s.label, spectral: spec, specColor, planetCount: s.planets.length, eqtRange: `${eqtLo}–${eqtHi} K`, worldPos }
  })
}

function buildSysGlow(sys: GalSystem): THREE.Sprite {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64
  const ctx = cv.getContext('2d')!; const cx = 32
  const hex = sys.specColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cx, cx, 0, Math.PI * 2); ctx.clip()
  const grd = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.8)
  grd.addColorStop(0,    `rgba(255,255,255,0.95)`)
  grd.addColorStop(0.08, `rgba(${r},${g},${b},0.80)`)
  grd.addColorStop(0.35, `rgba(${r},${g},${b},0.22)`)
  grd.addColorStop(1,    `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64); ctx.restore()
  const tex = new THREE.CanvasTexture(cv)
  tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
  const sp = new THREE.Sprite(mat)
  sp.scale.setScalar(0.055); sp.position.copy(sys.worldPos)
  sp.userData = { baseScale: 0.055, sysIdx: sys.idx }
  return sp
}

function buildGalaxyInterior(doc: ClusterGalaxyDoc, origin: THREE.Vector3, systems: GalSystem[]) {
  clearGalaxyInterior()
  galaxyGroup = new THREE.Group()
  galGlowSprites.length = 0; sysProxies.length = 0; hoveredSysIdx = -1

  // Background stellar population (morphology-aware, from composable)
  const field = buildBackgroundField(doc, 2.5)
  const bgPos = new Float32Array(field.count * 3)
  for (let i = 0; i < field.count; i++) {
    bgPos[i * 3]     = origin.x + field.positions[i * 3]
    bgPos[i * 3 + 1] = origin.y + field.positions[i * 3 + 1]
    bgPos[i * 3 + 2] = origin.z + field.positions[i * 3 + 2]
  }
  const bgGeo = new THREE.BufferGeometry()
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3))
  bgGeo.setAttribute('color',    new THREE.BufferAttribute(field.colors, 3))

  const ptCv = document.createElement('canvas'); ptCv.width = ptCv.height = 32
  const ptCtx = ptCv.getContext('2d')!
  const ptGrd = ptCtx.createRadialGradient(16, 16, 0, 16, 16, 16)
  ptGrd.addColorStop(0, 'rgba(255,255,255,1.0)'); ptGrd.addColorStop(0.3, 'rgba(255,255,255,0.7)')
  ptGrd.addColorStop(0.7, 'rgba(255,255,255,0.15)'); ptGrd.addColorStop(1, 'rgba(255,255,255,0)')
  ptCtx.fillStyle = ptGrd; ptCtx.fillRect(0, 0, 32, 32)
  const ptTex = new THREE.CanvasTexture(ptCv)
  ptTex.generateMipmaps = false; ptTex.minFilter = THREE.LinearFilter
  const bgMat = new THREE.PointsMaterial({
    map: ptTex, vertexColors: true, size: 0.016, sizeAttenuation: true,
    transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, alphaTest: 0.01,
  })
  const bgPoints = new THREE.Points(bgGeo, bgMat)
  galaxyGroup.add(bgPoints)
  gsap.to(bgMat, { opacity: 0.65, duration: 1.8, delay: 0.4, ease: 'power2.out' })

  // Anchor star systems: dot + glow + invisible hit proxy
  for (const sys of systems) {
    const visR = 0.022 + sys.planetCount * 0.005
    const dotGeo = new THREE.SphereGeometry(visR, 6, 6)
    const dotMat = new THREE.MeshBasicMaterial({ color: sys.specColor, transparent: true, opacity: 0 })
    const dot    = new THREE.Mesh(dotGeo, dotMat)
    dot.position.copy(sys.worldPos)
    dot.userData = { sysIdx: sys.idx }

    const glow = buildSysGlow(sys)
    galGlowSprites[sys.idx] = glow

    const hitR   = Math.max(0.06, visR * 3.2)
    const proxy  = new THREE.Mesh(
      new THREE.SphereGeometry(hitR, 6, 6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    )
    proxy.position.copy(sys.worldPos)
    proxy.userData = { sysIdx: sys.idx }
    sysProxies.push(proxy)

    gsap.to(dotMat, { opacity: 0.88, duration: 1.2, delay: 0.5 + sys.idx * 0.006, ease: 'power2.out' })
    gsap.to(glow.material, { opacity: 0.55, duration: 1.2, delay: 0.5 + sys.idx * 0.006, ease: 'power2.out' })

    galaxyGroup.add(dot, glow, proxy)
  }

  pageGroup.add(galaxyGroup)
}

function clearGalaxyInterior() {
  if (!galaxyGroup) return
  pageGroup.remove(galaxyGroup)
  galaxyGroup.traverse(obj => {
    if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
      (obj as THREE.Mesh).geometry?.dispose()
      const mat = (obj as THREE.Mesh).material
      if (Array.isArray(mat)) mat.forEach(m => m.dispose())
      else mat?.dispose()
    }
    if ((obj as THREE.Sprite).isSprite) {
      const mat = (obj as THREE.Sprite).material as THREE.SpriteMaterial
      mat.map?.dispose(); mat.dispose()
    }
  })
  galaxyGroup = null
  sysProxies.length = 0
  galGlowSprites.length = 0
  hoveredSysIdx = -1
}

async function exploreGalaxy(member: ClusterMember | null) {
  if (!member || !camera || !controls) return
  viewMode.value = 'galaxy-loading'
  exploredMember.value = member
  selectedSystem.value = null
  clearSystemCloud()

  const origin = memberSprites.find(
    sp => (sp.userData as { member: ClusterMember }).member.id === member.id
  )?.position.clone() ?? new THREE.Vector3()

  // Continue the approach immediately, in parallel with the (usually
  // already-warm, see onClick's prefetch) data fetch below — this used to
  // wait for the fetch to resolve before moving the camera at all, which
  // froze it mid-approach behind the "Loading star systems…" panel, then
  // jumped it OUT to 4.0 su (farther than flyToMember's 2.8 su landing
  // spot) once data arrived. Landing closer than flyToMember here keeps the
  // whole click → explore sequence monotonically zooming in — no pull-back.
  const camDir  = camera.position.clone().sub(origin).normalize()
  const camDest = origin.clone().addScaledVector(camDir, 1.8)
  gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target)
  gsap.to(controls.target, { x: origin.x, y: origin.y, z: origin.z, duration: 1.6, ease: 'power2.out', onUpdate: () => controls?.update() })
  gsap.to(camera.position, { x: camDest.x, y: camDest.y, z: camDest.z, duration: 2.0, ease: 'power3.out', onUpdate: () => controls?.update() })

  try {
    const doc = await fetchGalaxyDoc(slug.value, member.id)
    exploredDoc.value = doc
    const systems = mapDocToGalSystems(doc, origin)
    galSystems.value = systems
    // buildGalaxyInterior fades its own meshes in from opacity 0 (background
    // field + each star-system dot/glow, staggered) — that's the "smooth
    // vector object reveal," and it now plays out while the camera above is
    // still gliding in, instead of popping in only once the camera stops.
    buildGalaxyInterior(doc, origin, systems)

    // Dim all other galaxy sprites so the explored one reads clearly
    for (const sp of memberSprites) {
      const m = (sp.userData as { member: ClusterMember }).member
      const mat = sp.material as THREE.SpriteMaterial
      const target = m.id === member.id ? mat.opacity : 0.05
      gsap.to(mat, { opacity: target, duration: 0.9 })
    }

    viewMode.value = 'galaxy'
  } catch (e) {
    console.warn('[ClusterInteriorPage] exploreGalaxy failed:', e)
    viewMode.value = 'cluster'
    exploredMember.value = null
    // The approach tween above may still be running toward a galaxy whose
    // data failed to load — bring the camera back to the member framing
    // (flyToMember's distance) rather than leaving it stalled mid-flight.
    if (camera && controls) flyToMember(origin)
  }
}

function exitGalaxyExplore() {
  if (!camera || !controls) return
  selectedSystem.value = null
  clearGalaxyInterior()
  galSystems.value = []
  exploredDoc.value = null

  // Restore all galaxy sprite opacities
  for (const sp of memberSprites) {
    const m = (sp.userData as { member: ClusterMember }).member
    const base = m.bt_mag != null
      ? Math.max(0.28, Math.min(0.95, 1.10 - (m.bt_mag - 9) * 0.09))
      : 0.6
    gsap.to(sp.material as THREE.SpriteMaterial, { opacity: base, duration: 0.8 })
  }

  // Fly back to cluster overview
  const c = clusterCenter
  gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target)
  gsap.to(controls.target, { x: c.x, y: c.y, z: c.z, duration: 1.0, ease: 'power2.out', onUpdate: () => controls?.update() })
  gsap.to(camera.position, { x: c.x, y: c.y + 10, z: c.z + 28, duration: 2.0, ease: 'power3.inOut', onUpdate: () => controls?.update() })

  exploredMember.value = null
  viewMode.value = 'cluster'
}

function selectGalSystem(sys: GalSystem) {
  if (!camera || !controls) return
  selectedSystem.value = sys
  const fromCam = camera.position.clone().sub(sys.worldPos).normalize()
  const dest    = sys.worldPos.clone().addScaledVector(fromCam, 0.85)
  gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target)
  gsap.to(controls.target, { x: sys.worldPos.x, y: sys.worldPos.y, z: sys.worldPos.z, duration: 0.6, ease: 'power2.out', onUpdate: () => controls?.update() })
  gsap.to(camera.position, { x: dest.x, y: dest.y, z: dest.z, duration: 1.4, ease: 'power3.out', onUpdate: () => controls?.update() })
}

async function descendToSurface(sys: GalSystem) {
  const mem = exploredMember.value
  if (!mem || !camera) return

  // Final in-page approach toward the system before the route change —
  // ClusterInteriorPage and ClusterSystemPage now share the same renderer/camera.
  if (controls) {
    const fromCam = camera.position.clone().sub(sys.worldPos).normalize()
    const dest    = sys.worldPos.clone().addScaledVector(fromCam, 0.15)
    gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target)
    await new Promise<void>(resolve => {
      gsap.to(controls!.target, { x: sys.worldPos.x, y: sys.worldPos.y, z: sys.worldPos.z, duration: 0.4, ease: 'power2.out', onUpdate: () => controls?.update() })
      gsap.to(camera!.position, { x: dest.x, y: dest.y, z: dest.z, duration: 0.7, ease: 'power2.out', onUpdate: () => controls?.update(), onComplete: resolve })
    })
  }

  // 'dissolve' + the handoff origin below: ClusterSystemPage places its
  // arrival camera to reproduce this exact composition (see
  // src/lib/scene-handoff.ts), so the crossfade resolves into a matching
  // view of the same star instead of a fresh establishing shot.
  const handoff = computeHandoffOrigin(camera, sys.worldPos)
  await transition.depart(handoff.ox, handoff.oy, 'dissolve', handoff.bearing)
  void router.push({
    name:   'cluster-system',
    params: { clusterSlug: slug.value, memberId: mem.id, systemIdx: sys.idx },
    query:  { bearing: handoff.bearing.toFixed(3) },
  })
}

function goClaimSystem(sys: GalSystem) {
  const mem = exploredMember.value
  if (!mem) return
  const key = clusterKey(slug.value, mem.id, sys.id, 'b')
  if (!hasSettlement(key)) {
    addSettlement({
      key, type: 'cluster', planetName: 'b', hostname: sys.id,
      exolocation: `exo-cluster-v1:${slug.value}:${mem.id}:${sys.id}:b`,
      displayName: `${sys.id} · b (${slug.value})`,
      clusterSlug: slug.value, memberId: mem.id,
    })
  }
  void router.push(
    `/mint?mode=cluster-world&cluster=${encodeURIComponent(slug.value)}&galaxy=${encodeURIComponent(mem.id)}&system=${encodeURIComponent(sys.id)}`
  )
}

async function navigateToGalaxy(settle = false) {
  const mem = selected.value
  if (!mem) return
  const id = mem.id

  // In-page camera zoom toward the galaxy node before the route change
  // (SPEC_ZOOM_DESCENT.md §4.2 / SPEC_DISSOLVE_HANDOFF.md §3) — lands close
  // to the galaxy sprite so the handoff origin below reflects an already-
  // tight composition, same as the system-descent reference implementation.
  if (camera && controls) {
    const proxy = hitProxies.find(p => (p.userData.member as ClusterMember).id === id)
    if (proxy) {
      const fromCam = camera.position.clone().sub(proxy.position).normalize()
      const dest    = proxy.position.clone().addScaledVector(fromCam, 0.35)
      gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target)
      await new Promise<void>(resolve => {
        gsap.to(controls!.target, { x: proxy.position.x, y: proxy.position.y, z: proxy.position.z, duration: 0.5, ease: 'power2.out', onUpdate: () => controls?.update() })
        gsap.to(camera!.position, { x: dest.x, y: dest.y, z: dest.z, duration: 0.9, ease: 'power2.out', onUpdate: () => controls?.update(), onComplete: resolve })
      })
    }
  }

  // Handoff origin: ClusterGalaxyPage places its arrival camera to reproduce
  // this composition around coreSprite (its own local origin) — see
  // SPEC_DISSOLVE_HANDOFF.md §3.
  let origin = { ox: 50, oy: 50, bearing: 0 }
  if (camera) {
    const proxy = hitProxies.find(p => (p.userData.member as ClusterMember).id === id)
    if (proxy) origin = computeHandoffOrigin(camera, proxy.position)
  }
  await transition.depart(origin.ox, origin.oy, 'dissolve', origin.bearing)
  const base  = `/cluster-galaxy/${slug.value}/${encodeURIComponent(id)}`
  const query = settle
    ? `?action=claim&bearing=${origin.bearing.toFixed(3)}&morph=${mem.hubble}`
    : `?bearing=${origin.bearing.toFixed(3)}&morph=${mem.hubble}`
  void router.push(base + query)
}

// ── LOD cloud management ──────────────────────────────────────────────────────
function hashGalId(id: string): number {
  let h = 0x811c9dc5 >>> 0
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h
}

function makeRng(seed: number): () => number {
  let s = (seed | 1) >>> 0
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5
    return (s >>> 0) / 0xFFFFFFFF
  }
}

function clearSystemCloud() {
  if (!systemCloudMesh) return
  pageGroup.remove(systemCloudMesh)
  systemCloudMesh.geometry.dispose()
  ;(systemCloudMesh.material as THREE.PointsMaterial).dispose()
  systemCloudMesh = null
  systemCloudCount.value = 0
}

function spawnSystemCloud(member: ClusterMember, pos: THREE.Vector3) {
  clearSystemCloud()
  const realData  = systemDataMap.value.get(member.id)
  const nEst      = realData?.systems ?? member.system_architecture?.estimated_planets
  const n         = Math.min(nEst ?? 10, 35)
  const radius    = (member.lod3_params?.scene_su ?? 0.3) * 1.1
  const rng       = makeRng(hashGalId(member.id))

  const positions = new Float32Array(n * 3)
  const colors    = new Float32Array(n * 3)

  // Approximate stellar population spectrum colors (O→M)
  const palette = [
    [0.61, 0.69, 1.00],  // O/B blue-white
    [0.79, 0.87, 1.00],  // A  white-blue
    [1.00, 0.96, 0.93],  // F  warm white
    [1.00, 0.89, 0.71],  // G  yellow-white (sun-like)
    [1.00, 0.70, 0.40],  // K  orange
    [1.00, 0.50, 0.25],  // M  deep orange
  ]
  const weights = [0.02, 0.08, 0.18, 0.30, 0.26, 0.16]

  for (let i = 0; i < n; i++) {
    const r  = radius * (0.15 + rng() * 0.85)
    const th = rng() * Math.PI * 2
    const ph = Math.acos(2 * rng() - 1)
    positions[i*3]   = pos.x + r * Math.sin(ph) * Math.cos(th)
    positions[i*3+1] = pos.y + r * Math.sin(ph) * Math.sin(th) * 0.45  // flatten to disc-ish
    positions[i*3+2] = pos.z + r * Math.cos(ph)

    let pick = rng(); let ci = 0
    for (let w = 0; w < weights.length; w++) { pick -= weights[w]; if (pick <= 0) { ci = w; break } }
    ci = Math.min(ci, palette.length - 1)
    colors[i*3] = palette[ci][0]; colors[i*3+1] = palette[ci][1]; colors[i*3+2] = palette[ci][2]
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.PointsMaterial({ size: 0.045, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0 })
  systemCloudMesh = new THREE.Points(geo, mat)
  pageGroup.add(systemCloudMesh)
  gsap.to(mat, { opacity: 0.80, duration: 1.4, ease: 'power2.out' })
  systemCloudCount.value = n

  // Log data availability for developers / data pipeline
  const clName = clusterData.value?.cluster ?? slug.value
  if (realData) {
    console.info(`[LOD] ${clName} — ${member.name || member.id}: ${realData.systems} real systems, ${realData.planets} planets from generated pipeline.`)
  } else {
    console.info(`[LOD] ${clName} — ${member.name || member.id}: no pipeline entry — rendering ${n} deterministic systems from seed. DATA REQUEST: need star-system JSON entry for galaxy_id="${member.id}" in cluster "${clName}".`)
  }
  if (!member.system_architecture) {
    console.info(`[LOD] ${clName} — ${member.name || member.id}: system_architecture missing. DATA REQUEST: want metallicity_fe_h, estimated_planets, planet_bias, icm_stress for this member.`)
  }
}

function updateZoomLevel() {
  // LOD cloud only relevant in cluster mode
  if (viewMode.value !== 'cluster') return
  if (!camera || !controls) return
  const mem = selected.value
  if (!mem) {
    if (zoomLevel.value !== 'overview') { zoomLevel.value = 'overview'; clearSystemCloud() }
    return
  }
  const dist = camera.position.distanceTo(controls.target)
  const next: ZoomLevel = dist < 1.8 ? 'systems' : dist < 6.0 ? 'galaxy' : 'overview'
  if (next === zoomLevel.value) return
  zoomLevel.value = next
  if (next === 'systems' && !systemCloudMesh) {
    const proxy = hitProxies.find(p => (p.userData.member as ClusterMember).id === mem.id)
    if (proxy) spawnSystemCloud(mem, proxy.position)
  }
  if (next === 'overview') clearSystemCloud()
}

function flyToMember(pos: THREE.Vector3) {
  if (!camera || !controls) return
  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)

  const fromCam = camera.position.clone().sub(pos).normalize()
  const dest    = pos.clone().addScaledVector(fromCam, 2.8)  // land 2.8 su from galaxy

  gsap.to(controls.target, { x: pos.x, y: pos.y, z: pos.z, duration: 0.7, ease: 'power2.out', onUpdate: () => controls?.update() })
  gsap.to(camera.position, { x: dest.x, y: dest.y, z: dest.z, duration: 2.0, ease: 'power3.out', onUpdate: () => controls?.update() })
}

function flyToSystemView() {
  if (!camera || !controls) return
  const mem = selected.value
  if (!mem) return
  const proxy = hitProxies.find(p => (p.userData.member as ClusterMember).id === mem.id)
  if (!proxy) return
  const pos     = proxy.position
  const fromCam = camera.position.clone().sub(pos).normalize()
  const dest    = pos.clone().addScaledVector(fromCam, 0.75)

  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)
  gsap.to(controls.target, { x: pos.x, y: pos.y, z: pos.z, duration: 0.5, ease: 'power2.out', onUpdate: () => controls?.update() })
  gsap.to(camera.position, { x: dest.x, y: dest.y, z: dest.z, duration: 2.6, ease: 'power4.out', onUpdate: () => controls?.update() })
}

function deselect() {
  if (!selected.value) return
  if (!camera || !controls) return
  selected.value = null
  clearSystemCloud()
  zoomLevel.value = 'overview'
  void router.replace({ query: {} })
  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)
  const c = clusterCenter
  const off = overviewCamOffset
  gsap.to(controls.target, { x: c.x, y: c.y, z: c.z, duration: 1.0, ease: 'power2.out', onUpdate: () => controls?.update() })
  gsap.to(camera.position, { x: c.x, y: c.y + off * 0.35, z: c.z + off, duration: 1.8, ease: 'power3.inOut', onUpdate: () => controls?.update() })
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  // Await a tick so MainLayout's onMounted (which calls viz.init()) runs first —
  // this page can otherwise mount before the shared renderer exists.
  await Promise.resolve()
  initScene()
  if (!camera || !controls || !renderer || !scene) return  // WebGL unavailable

  void loadAndBuild()
  _stopTick = viz.addTick(tick)
})

onUnmounted(() => {
  _stopTick?.()
  _stopTick = null

  viz.canvas?.removeEventListener('wheel', onWheel)
  clearSystemCloud()
  clearGalaxyInterior()
  _texCache.forEach(t => t.dispose())
  _texCache.clear()

  disposeScene(pageGroup)
  scene?.remove(pageGroup)
  if (scene) {
    scene.background = null
    scene.fog        = null
  }
})
</script>

<style scoped lang="scss">
.ci-page  { position: relative; width: 100vw; height: 100vh; }
.ci-canvas {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  display: block;
}

.ci-breadcrumb {
  position: absolute; top: 12px; left: 12px; z-index: 10;
  pointer-events: auto;
}

.ci-header {
  position: absolute; top: 44px; left: 16px; z-index: 10;
  pointer-events: none;
}

.ci-loading {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  display: flex; flex-direction: column; align-items: center; z-index: 20;
}

.ci-panel {
  position: absolute; top: 80px; right: 12px;
  width: 220px; z-index: 10;
  background: rgba(4, 8, 16, 0.88);
  border: 1px solid rgba(60,100,140,0.35);
  border-radius: 8px;
  padding: 12px;
  backdrop-filter: blur(8px);
  pointer-events: auto;
}
.ci-panel--galaxy {
  border-color: rgba(0,180,160,0.30);
  background: rgba(2, 12, 18, 0.92);
}
.ci-panel-header {
  display: flex; justify-content: space-between; align-items: flex-start;
}
.ci-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 4px; font-size: 11px;
}
.ci-lbl {
  color: #546e7a; font-size: 10px; letter-spacing: 0.04em;
}

.ci-data-badge {
  font-size: 9px; letter-spacing: 0.08em;
  color: rgba(0,210,190,0.80);
  margin: 3px 0 2px;
}

.ci-zoom-badge {
  font-size: 8px; letter-spacing: 0.10em; padding: 1px 5px;
  border-radius: 3px; display: inline-block; margin-bottom: 4px;
}
.ci-zoom-badge--overview { color: rgba(100,160,200,0.65); }
.ci-zoom-badge--galaxy   { color: rgba(80,230,200,0.85); }
.ci-zoom-badge--systems  { color: rgba(180,240,120,0.90); }

.ci-lod-cloud {
  display: flex; align-items: center; gap: 4px;
  font-size: 9px; color: rgba(180,240,120,0.80);
  letter-spacing: 0.05em; margin: 3px 0;
}

.ci-tooltip {
  position: absolute; z-index: 20; pointer-events: none;
  background: rgba(4,8,16,0.82); border: 1px solid rgba(80,140,180,0.28);
  padding: 3px 8px; border-radius: 4px; backdrop-filter: blur(4px);
  font-size: 11px; color: #cdd9e0; white-space: nowrap;
}

.ci-hud {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  pointer-events: none; z-index: 10;
}

/* Transitions */
.slide-panel-enter-active, .slide-panel-leave-active { transition: all 0.22s ease; }
.slide-panel-enter-from  { opacity: 0; transform: translateX(16px); }
.slide-panel-leave-to    { opacity: 0; transform: translateX(16px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
