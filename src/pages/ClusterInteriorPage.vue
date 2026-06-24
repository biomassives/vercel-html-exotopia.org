<template>
  <q-page class="ci-page bg-black overflow-hidden">
    <canvas ref="canvasEl" class="ci-canvas" @click="onClick" @mousemove="onMouseMove" @mouseleave="onMouseLeave" />

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

    <!-- Selected galaxy panel -->
    <Transition name="slide-panel">
      <div v-if="selected" class="ci-panel">
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
            <span class="ci-lbl">Star systems</span>
            <span class="text-cyan-5">{{ selectedRealData.systems }}</span>
          </div>
          <div class="ci-row">
            <span class="ci-lbl">Mapped worlds</span>
            <span class="text-cyan-5">{{ selectedRealData.planets }}</span>
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
          icon="mdi-magnify-plus" label="Zoom In — Reveal Systems"
          @click="flyToSystemView()" />
        <q-btn dense rounded unelevated size="sm" color="cyan-8" class="full-width q-mb-xs"
          icon="mdi-telescope" label="Explore Star Systems"
          @click="navigateToGalaxy(false)" />
        <q-btn flat dense size="xs" color="blue-grey-5" class="full-width"
          icon="mdi-map-marker-plus" label="Create a Settlement Here"
          @click="navigateToGalaxy(true)" />
      </div>
    </Transition>

    <!-- Hover tooltip -->
    <Transition name="fade">
      <div v-if="hoverName" class="ci-tooltip"
        :style="{ left: (hoverPos.x + 14) + 'px', top: (hoverPos.y - 8) + 'px' }">
        {{ hoverName }}
      </div>
    </Transition>

    <!-- Bottom HUD -->
    <div class="ci-hud">
      <span class="text-caption text-blue-grey-6">{{ memberCount }} galaxies · scroll to zoom · drag to orbit</span>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { prefetchClusterGalaxies } from 'src/composables/useClusterGalaxyData'
import { useSceneTransitionStore }  from 'src/stores/scene-transition'

// ── Scene constants ───────────────────────────────────────────────────────────
const SCENE_SCALE = 80   // scene units per Mpc — gives ~10 su for a 0.13 Mpc spread

// ── Types ─────────────────────────────────────────────────────────────────────
interface SystemDataEntry { systems: number; planets: number }

interface SystemArch {
  planet_bias:        string
  estimated_planets:  number
  metallicity_fe_h:   number
  icm_stress:         number
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

// ── Route ─────────────────────────────────────────────────────────────────────
const route      = useRoute()
const router     = useRouter()
const slug       = computed(() => String(route.params.slug ?? ''))
const transition = useSceneTransitionStore()

// Last click origin (viewport %) and bearing — used when navigating to galaxy
const clickPct     = { x: 50, y: 50 }
const clickBearing = ref(0)

// ── Vue state ─────────────────────────────────────────────────────────────────
const canvasEl    = ref<HTMLCanvasElement | null>(null)
const loading     = ref(true)
const clusterData = ref<ClusterData | null>(null)
const selected    = ref<ClusterMember | null>(null)
const hoverName   = ref<string>('')
const hoverPos    = ref({ x: 0, y: 0 })
const memberCount = ref(0)
const systemDataMap = ref(new Map<string, SystemDataEntry>())

// ── LOD / zoom reveal state ───────────────────────────────────────────────────
type ZoomLevel = 'overview' | 'galaxy' | 'systems'
const zoomLevel        = ref<ZoomLevel>('overview')
const systemCloudCount = ref(0)
let   systemCloudMesh: THREE.Points | null = null

const selectedRealData = computed(() =>
  selected.value ? systemDataMap.value.get(selected.value.id) ?? null : null
)

// ── Three.js handles ──────────────────────────────────────────────────────────
let renderer:  THREE.WebGLRenderer
let scene:     THREE.Scene
let camera:    THREE.PerspectiveCamera
let controls:  OrbitControls
let raycaster: THREE.Raycaster
let animId:    number
const mouseNDC       = new THREE.Vector2()
const hitProxies:    THREE.Mesh[]    = []
const memberSprites: THREE.Sprite[]  = []
const dataRings:     THREE.Sprite[]  = []    // pulsing ring badges for galaxies with real data
const clusterCenter  = new THREE.Vector3()   // centroid of loaded members, set after build

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

// ── Data-badge ring sprite ────────────────────────────────────────────────────

function makeDataRing(sizeSu: number): THREE.Sprite {
  const S = 128, cx = S / 2
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')!
  ctx.setLineDash([9, 5])
  ctx.beginPath()
  ctx.arc(cx, cx, cx * 0.80, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,220,200,0.70)'
  ctx.lineWidth   = 3.5
  ctx.stroke()
  ctx.setLineDash([])
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * cx * 0.80, cx + Math.sin(a) * cx * 0.80, 3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,255,220,0.9)'
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  const sp  = new THREE.Sprite(mat)
  sp.scale.setScalar(sizeSu * 1.75)
  return sp
}

// ── Scene initialisation ──────────────────────────────────────────────────────
function initScene() {
  if (!canvasEl.value) return

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000408)

  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x000408, 0.006)

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 300)
  camera.position.set(0, 8, 26)
  camera.lookAt(0, 0, 0)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping  = true
  controls.dampingFactor  = 0.08
  controls.minDistance    = 0.3
  controls.maxDistance    = 60
  controls.zoomToCursor   = true

  raycaster = new THREE.Raycaster()

  buildBackground()

  renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('resize', onResize)
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
  scene.add(new THREE.Points(geo, mat))
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
    const c = clusterCenter
    controls.target.copy(c)
    camera.position.set(c.x, c.y + 10, c.z + 28)
    camera.lookAt(c)
    controls.update()

    // Gentle intro zoom from farther back
    gsap.from(camera.position, {
      duration: 2.4, z: c.z + 55, ease: 'power3.out',
      onUpdate: () => controls.update(),
    })
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
  dataRings.length = 0

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
    scene.add(sp)
    memberSprites.push(sp)

    // Data-badge ring for galaxies with generated star-system JSON
    if (systemDataMap.value.has(m.id)) {
      const ring = makeDataRing(sz)
      ring.position.copy(sp.position)
      ring.userData = { isBadge: true }
      scene.add(ring)
      dataRings.push(ring)
    }

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
    scene.add(proxy)
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
  scene.add(icmMesh)
}

// ── Animation loop ────────────────────────────────────────────────────────────
function startLoop() {
  const tick = () => {
    animId = requestAnimationFrame(tick)
    controls.update()
    updateZoomLevel()
    // Slowly rotate data-badge rings so they feel alive
    const t = performance.now() / 1000
    for (const ring of dataRings) {
      ;(ring.material as THREE.SpriteMaterial).rotation = t * 0.35
    }
    renderer.render(scene, camera)
  }
  tick()
}

// ── Input handlers ────────────────────────────────────────────────────────────
function onWheel() {
  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)
}

function onMouseMove(e: MouseEvent) {
  const el = canvasEl.value
  if (!el) return
  mouseNDC.x =  (e.clientX / el.clientWidth)  * 2 - 1
  mouseNDC.y = -(e.clientY / el.clientHeight) * 2 + 1
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(hitProxies)
  if (hits.length) {
    const m = hits[0].object.userData.member as ClusterMember
    hoverName.value = m.name || m.id
    hoverPos.value  = { x: e.clientX, y: e.clientY }
    el.style.cursor = 'pointer'
  } else {
    hoverName.value = ''
    el.style.cursor = ''
  }
}

function onMouseLeave() {
  hoverName.value = ''
}

function onClick(e: MouseEvent) {
  const el = canvasEl.value
  if (!el) return
  mouseNDC.x =  (e.clientX / el.clientWidth)  * 2 - 1
  mouseNDC.y = -(e.clientY / el.clientHeight) * 2 + 1
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(hitProxies)
  if (!hits.length) {
    deselect()
    return
  }
  const proxy  = hits[0].object
  const member = proxy.userData.member as ClusterMember
  selected.value = member
  // Capture click viewport % and bearing for the outgoing transition
  clickPct.x      = e.clientX / window.innerWidth  * 100
  clickPct.y      = e.clientY / window.innerHeight * 100
  clickBearing.value = Math.atan2(
    e.clientY / window.innerHeight - 0.5,
    e.clientX / window.innerWidth  - 0.5,
  )
  void router.replace({ query: { member: member.id } })
  flyToMember(proxy.position)
}

async function navigateToGalaxy(settle = false) {
  if (!selected.value) return
  const id = selected.value.id
  await transition.depart(clickPct.x, clickPct.y, 'spirograph', clickBearing.value)
  const base  = `/cluster-galaxy/${slug.value}/${encodeURIComponent(id)}`
  const query = settle
    ? `?action=claim&bearing=${clickBearing.value.toFixed(3)}&morph=${selected.value.hubble}`
    : `?bearing=${clickBearing.value.toFixed(3)}&morph=${selected.value.hubble}`
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
  scene.remove(systemCloudMesh)
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
  scene.add(systemCloudMesh)
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
  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)

  const fromCam = camera.position.clone().sub(pos).normalize()
  const dest    = pos.clone().addScaledVector(fromCam, 2.8)  // land 2.8 su from galaxy

  gsap.to(controls.target, { x: pos.x, y: pos.y, z: pos.z, duration: 0.7, ease: 'power2.out', onUpdate: () => controls.update() })
  gsap.to(camera.position, { x: dest.x, y: dest.y, z: dest.z, duration: 2.0, ease: 'power3.out', onUpdate: () => controls.update() })
}

function flyToSystemView() {
  const mem = selected.value
  if (!mem) return
  const proxy = hitProxies.find(p => (p.userData.member as ClusterMember).id === mem.id)
  if (!proxy) return
  const pos     = proxy.position
  const fromCam = camera.position.clone().sub(pos).normalize()
  const dest    = pos.clone().addScaledVector(fromCam, 0.75)

  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)
  gsap.to(controls.target, { x: pos.x, y: pos.y, z: pos.z, duration: 0.5, ease: 'power2.out', onUpdate: () => controls.update() })
  gsap.to(camera.position, { x: dest.x, y: dest.y, z: dest.z, duration: 2.6, ease: 'power4.out', onUpdate: () => controls.update() })
}

function deselect() {
  if (!selected.value) return
  selected.value = null
  clearSystemCloud()
  zoomLevel.value = 'overview'
  void router.replace({ query: {} })
  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)
  const c = clusterCenter
  gsap.to(controls.target, { x: c.x, y: c.y, z: c.z, duration: 1.0, ease: 'power2.out', onUpdate: () => controls.update() })
  gsap.to(camera.position, { x: c.x, y: c.y + 10, z: c.z + 28, duration: 1.8, ease: 'power3.inOut', onUpdate: () => controls.update() })
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  initScene()
  void loadAndBuild()
  startLoop()
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', onResize)
  renderer?.domElement.removeEventListener('wheel', onWheel)
  clearSystemCloud()
  _texCache.forEach(t => t.dispose())
  _texCache.clear()
  renderer?.dispose()
  controls?.dispose()
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
