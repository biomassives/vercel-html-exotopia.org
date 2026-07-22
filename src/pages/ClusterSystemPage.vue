<template>
  <!-- Transparent overlay — shared Three.js canvas in MainLayout renders behind -->
  <q-page class="cs-page viz-overlay-page" :style="hoveringPlanet ? { cursor: 'pointer' } : {}"
    @click="onCanvasClick" @mousemove="onCanvasMove" @mouseleave="onCanvasLeave">

    <!-- Breadcrumb -->
    <div class="cs-breadcrumb row items-center q-gutter-xs no-wrap">
      <q-btn flat dense size="xs" color="blue-grey-5" icon="mdi-chevron-left" label="Cosmic"
        @click="$router.push('/cosmic')" />
      <span class="text-blue-grey-7 text-caption">/</span>
      <q-btn flat dense size="xs" color="blue-grey-5" :label="clusterDisplayName"
        @click="$router.push(`/cluster-interior/${clusterSlug}`)" />
      <span class="text-blue-grey-7 text-caption">/</span>
      <q-btn flat dense size="xs" color="blue-grey-5" :label="memberDisplayName"
        @click="$router.push(`/cluster-galaxy/${clusterSlug}/${encodeURIComponent(memberId)}`)" />
      <span class="text-blue-grey-7 text-caption">/</span>
      <span class="text-blue-grey-3 text-caption">{{ systemLabel }}</span>
    </div>

    <!-- System header -->
    <div class="cs-header">
      <div class="text-caption text-blue-grey-5 q-mb-xs" style="letter-spacing:0.1em">STAR SYSTEM · LOCAL VIEW</div>
      <div class="text-h6 text-blue-grey-2">{{ systemLabel }}</div>
      <div class="text-caption text-blue-grey-5">
        <span :style="{ color: starColor }">{{ starSpectral }}</span>
        &nbsp;·&nbsp;{{ starMass }} M☉
        &nbsp;·&nbsp;{{ planetCount }} planet{{ planetCount !== 1 ? 's' : '' }}
        &nbsp;·&nbsp;{{ clusterDisplayName }}
      </div>
    </div>

    <!-- Planet list panel -->
    <div class="cs-planet-panel" v-if="!loading && planets.length">
      <div class="text-caption text-blue-grey-6 q-mb-sm" style="letter-spacing:0.09em;font-size:8px">
        PLANETS · CLICK TO SELECT
      </div>

      <div
        v-for="(p, i) in planets"
        :key="p.id"
        class="cs-planet-row"
        :class="{ 'cs-planet-row--active': selectedPlanet?.id === p.id }"
        @click="selectPlanet(p)"
      >
        <div class="cs-planet-dot" :style="{ background: planetColor(p.type) }" />
        <div class="cs-planet-info">
          <div class="cs-planet-name">{{ p.label }}</div>
          <div class="cs-planet-sub">{{ planetTypeLabel(p.type) }}
            &nbsp;·&nbsp;{{ p.radius_earth.toFixed(1) }} R⊕
            &nbsp;·&nbsp;{{ p.eq_temp_k }} K
          </div>
        </div>
        <div class="cs-planet-tier" :style="{ color: tierColor(p.settlement_tier) }">
          {{ tierLabel(p.settlement_tier) }}
        </div>
      </div>

      <!-- Selected planet detail -->
      <Transition name="cs-slide">
        <div v-if="selectedPlanet" class="cs-planet-detail q-mt-sm">
          <q-separator color="blue-grey-8" class="q-mb-sm" />
          <div class="cs-detail-row"><span class="cs-dl">Type</span><span>{{ planetTypeLabel(selectedPlanet.type) }}</span></div>
          <div class="cs-detail-row"><span class="cs-dl">Radius</span><span>{{ selectedPlanet.radius_earth.toFixed(2) }} R⊕</span></div>
          <div class="cs-detail-row"><span class="cs-dl">Mass</span><span>{{ selectedPlanet.mass_earth.toFixed(2) }} M⊕</span></div>
          <div class="cs-detail-row"><span class="cs-dl">Orbit</span><span>{{ selectedPlanet.semi_major_au }} AU · {{ selectedPlanet.period_days }}d</span></div>
          <div class="cs-detail-row"><span class="cs-dl">Eq. temp</span><span>{{ selectedPlanet.eq_temp_k }} K</span></div>
          <div class="cs-detail-row"><span class="cs-dl">Atmosphere</span><span>{{ selectedPlanet.atmosphere }}</span></div>
          <div class="cs-detail-row"><span class="cs-dl">Settlement</span>
            <span :style="{ color: tierColor(selectedPlanet.settlement_tier) }">
              {{ tierLabel(selectedPlanet.settlement_tier) }}
            </span>
          </div>

          <div v-if="observatoryReport" class="q-mt-xs text-caption text-blue-grey-6"
            style="font-size:8px;line-height:1.5;font-style:italic;border-left:2px solid #1a3a4a;padding-left:6px">
            {{ observatoryReport }}
          </div>

          <div class="row q-gutter-xs q-mt-sm">
            <q-btn dense rounded unelevated size="sm" color="cyan-9" icon="mdi-earth"
              label="Descend to surface"
              @click="descendToPlanet(selectedPlanet)" />
          </div>
        </div>
      </Transition>
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="cs-loading">
      <q-spinner-orbit color="cyan-7" size="48px" />
      <div class="text-caption text-blue-grey-5 q-mt-sm">Loading star system…</div>
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
import { useClusterGalaxyData } from 'src/composables/useClusterGalaxyData'
import type { ClusterPlanet, ClusterStarSystem } from 'src/composables/useClusterGalaxyData'
import { useSceneTransitionStore }               from 'src/stores/scene-transition'
import { disposeScene }                          from 'src/lib/three-utils'
import { clusterPlanetHasNoSolidGround }          from 'src/lib/surface-classify'

// ── Route ──────────────────────────────────────────────────────────────────────
const route      = useRoute()
const router     = useRouter()
const transition = useSceneTransitionStore()

const clusterSlug = computed(() => String(route.params.clusterSlug ?? ''))
const memberId    = computed(() => String(route.params.memberId    ?? ''))
const systemIdx   = computed(() => parseInt(String(route.params.systemIdx ?? '0'), 10))

// ── Data ───────────────────────────────────────────────────────────────────────
const { loading, doc, load } = useClusterGalaxyData(clusterSlug, memberId)

const starSystem = computed((): ClusterStarSystem | null => {
  const systems = doc.value?.star_systems
  if (!systems) return null
  return systems[systemIdx.value] ?? systems[0] ?? null
})

const planets      = computed(() => starSystem.value?.planets ?? [])
const planetCount  = computed(() => planets.value.length)
const starSpectral = computed(() => starSystem.value?.spectral_type ?? 'K5V')
const starMass     = computed(() => starSystem.value?.mass_sol?.toFixed(2) ?? '—')
const systemLabel  = computed(() => starSystem.value?.label ?? `System ${systemIdx.value + 1}`)
const observatoryReport = computed(() => doc.value?.provenance?.observatory_report ?? '')

const clusterDisplayName = computed(() => doc.value?.cluster ?? clusterSlug.value.replace(/-/g, ' '))
const memberDisplayName  = computed(() => {
  const id = memberId.value
  return (id.startsWith('proc-') || id.startsWith('bcg-'))
    ? `${doc.value?.galaxy_hubble ?? ''} ${id}`
    : id
})

const SPECTRAL_COLOR: Record<string, string> = {
  O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
  G: '#ffe4aa', K: '#ffbe6e', M: '#ff8250',
}

const starColor = computed(() => {
  const spec = starSpectral.value[0] ?? 'K'
  return SPECTRAL_COLOR[spec] ?? '#ffbe6e'
})

// ── Selected planet ────────────────────────────────────────────────────────────
const selectedPlanet = ref<ClusterPlanet | null>(null)

function selectPlanet(p: ClusterPlanet) {
  selectedPlanet.value = selectedPlanet.value?.id === p.id ? null : p
  const mesh = planetMeshes.value.find(m => m.userData.planetId === p.id)
  if (mesh && camera && controls) {
    const target = mesh.position.clone()
    const fromCam = camera.position.clone().sub(target).normalize()
    const dist    = Math.max(0.6, target.length() * 0.5)
    gsap.to(controls.target, { x: target.x, y: target.y, z: target.z, duration: 0.6, ease: 'power2.out', onUpdate: () => controls!.update() })
    gsap.to(camera.position, {
      x: target.x + fromCam.x * dist,
      y: target.y + fromCam.y * dist + 0.3,
      z: target.z + fromCam.z * dist,
      duration: 1.2, ease: 'power3.out', onUpdate: () => controls!.update(),
    })
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const PLANET_COLORS: Record<string, string> = {
  lava_world:    '#ff4422', hot_rocky:  '#ff8844', rocky_barren: '#886655',
  super_earth:   '#44aacc', ice_world:  '#99ddff', gas_giant:    '#aabb88',
  mini_neptune:  '#6699bb', ocean_world:'#2277cc',
}

function planetColor(type: string): string {
  return PLANET_COLORS[type] ?? '#607d8b'
}

function planetTypeLabel(type: string): string {
  return type.replace(/_/g, ' ')
}

function tierLabel(tier: string): string {
  if (tier === 'candidate')   return 'Candidate'
  if (tier === 'frontier')    return 'Frontier'
  if (tier === 'theoretical') return 'Theoretical'
  return tier
}

function tierColor(tier: string): string {
  if (tier === 'candidate')   return '#4caf50'
  if (tier === 'frontier')    return '#ff9800'
  return 'rgba(100,140,170,0.55)'
}

// ── Navigation ─────────────────────────────────────────────────────────────────
async function descendToPlanet(p: ClusterPlanet) {
  if (clusterPlanetHasNoSolidGround(p.type)) {
    void router.push({
      name: 'station-interior',
      params: { hostname: systemLabel.value, refName: p.id },
      query: {
        reason:      'no-solid-crust',
        surfaceType: p.type,
        clusterSlug: clusterSlug.value,
        memberId:    memberId.value,
        systemIdx:   systemIdx.value,
      },
    })
    return
  }

  const mesh = planetMeshes.value.find(m => m.userData.planetId === p.id)

  // Final in-page approach toward the planet before the route change —
  // ClusterSystemPage and ClusterSurfacePage now share the same renderer/camera.
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

  // Project selected planet mesh to screen for lightning origin
  let ox = 50, oy = 50
  if (mesh && camera) {
    const sc = mesh.position.clone().project(camera)
    ox = (sc.x + 1) / 2 * 100
    oy = (1 - sc.y) / 2 * 100
  }
  const bearing = Math.atan2(oy/100 - 0.5, ox/100 - 0.5)
  await transition.depart(ox, oy, 'lightning', bearing)
  void router.push({
    name: 'cluster-surface',
    params: { clusterSlug: clusterSlug.value, memberId: memberId.value, systemIdx: systemIdx.value },
    query: {
      eqt:     p.eq_temp_k,
      spec:    starSpectral.value,
      planets: planetCount.value,
      name:    systemLabel.value,
      cluster: clusterDisplayName.value,
      morph:   doc.value?.galaxy_hubble ?? 'E',
      planet:  p.id,
      bearing: bearing.toFixed(3),
    },
  })
}

// ── Three.js — shared renderer ─────────────────────────────────────────────────
const viz = useVizRenderer()
const planetMeshes = shallowRef<THREE.Mesh[]>([])
const hoveringPlanet = ref(false)

let renderer:      THREE.WebGLRenderer     | null = null
let scene:         THREE.Scene             | null = null
let camera:        THREE.PerspectiveCamera | null = null
let controls:      OrbitControls           | null = null
let _stopTick: (() => void) | null = null
let raycasterSys:  THREE.Raycaster | null = null
const mouseVec     = new THREE.Vector2()
let hoveredPlanetId: string | null = null

// Root group for all page-level scene objects — added/removed on mount/unmount
const pageGroup = new THREE.Group()

const ORBIT_SCALE = 4.5   // AU → scene units; compressed for visibility

function auToSu(au: number, maxAu: number): number {
  // Log-compressed so widely spaced planets still fit in view
  return Math.log(1 + au / Math.max(0.01, maxAu) * 3) / Math.log(4) * ORBIT_SCALE + 0.18
}

function buildStarGlow(specColor: string): THREE.Sprite {
  const cv  = document.createElement('canvas'); cv.width = cv.height = 128
  const ctx = cv.getContext('2d')!
  const cx  = 64
  const col = specColor.replace('#', '')
  const sr  = parseInt(col.substring(0, 2), 16)
  const sg  = parseInt(col.substring(2, 4), 16)
  const sb  = parseInt(col.substring(4, 6), 16)
  const g   = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
  g.addColorStop(0.00, 'rgba(255,255,255,1.0)')
  g.addColorStop(0.08, `rgba(${sr},${sg},${sb},0.92)`)
  g.addColorStop(0.30, `rgba(${sr},${sg},${sb},0.32)`)
  g.addColorStop(0.70, `rgba(${sr},${sg},${sb},0.06)`)
  g.addColorStop(1.00, `rgba(${sr},${sg},${sb},0)`)
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(cv)
  tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  const sp  = new THREE.Sprite(mat)
  sp.scale.setScalar(0.55)
  return sp
}

function buildOrbitRing(r: number): THREE.Line {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 192; i++) {
    const a = (i / 192) * Math.PI * 2
    pts.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a)))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineDashedMaterial({
    color: 0x1e4060, transparent: true, opacity: 0.55,
    dashSize: r * 0.22, gapSize: r * 0.10,
  })
  const line = new THREE.Line(geo, mat)
  line.computeLineDistances()
  return line
}

function buildPlanetMesh(p: ClusterPlanet, orbitR: number): THREE.Mesh {
  const radius  = Math.max(0.018, Math.min(0.065, p.radius_earth * 0.028))
  const col     = new THREE.Color(planetColor(p.type))
  const geo     = new THREE.SphereGeometry(radius, 12, 12)
  const mat     = new THREE.MeshBasicMaterial({ color: col })
  const mesh    = new THREE.Mesh(geo, mat)
  const angle   = Math.random() * Math.PI * 2
  mesh.position.set(orbitR * Math.cos(angle), 0, orbitR * Math.sin(angle))
  mesh.userData.planetId   = p.id
  mesh.userData.planetType = p.type
  mesh.userData.orbitR     = orbitR
  mesh.userData.orbitSpd   = 0.004 + 0.012 / Math.max(0.1, orbitR)
  mesh.userData.orbitAngle = angle
  return mesh
}

function buildScene() {
  // Grab shared renderer refs
  renderer = viz.renderer
  scene    = viz.scene
  camera   = viz.camera
  controls = viz.controls
  if (!renderer || !scene || !camera || !controls) return

  // Configure scene appearance for the star-system level
  scene.background = new THREE.Color(0x020508)

  // Configure camera for system scale
  camera.fov  = 50
  camera.near = 0.001
  camera.far  = 120

  const b       = parseFloat(String(route.query.bearing ?? '0')) || 0
  const entryD  = 18
  camera.position.set(Math.sin(b) * entryD, 6.5, Math.cos(b) * entryD)
  camera.updateProjectionMatrix()

  // Configure controls for system navigation
  controls.dampingFactor  = 0.06
  controls.minDistance    = 0.3;  controls.maxDistance   = 18
  controls.autoRotate     = true; controls.autoRotateSpeed = 0.15

  scene.add(pageGroup)

  // Background star field
  const bgPos = new Float32Array(2000 * 3)
  for (let i = 0; i < bgPos.length; i++) bgPos[i] = (Math.random() - 0.5) * 80
  const bgGeo = new THREE.BufferGeometry()
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3))
  const bgMat = new THREE.PointsMaterial({ color: 0x8899aa, size: 0.06, transparent: true, opacity: 0.40 })
  pageGroup.add(new THREE.Points(bgGeo, bgMat))

  const sys = starSystem.value
  if (!sys) return

  // Central star
  const starSpec  = sys.spectral_type[0] ?? 'K'
  const starCol   = SPECTRAL_COLOR[starSpec] ?? '#ffbe6e'
  const starR     = Math.max(0.06, Math.min(0.18, (sys.mass_sol ?? 0.8) * 0.14))
  const starGeo   = new THREE.SphereGeometry(starR, 16, 16)
  const starMat   = new THREE.MeshBasicMaterial({ color: new THREE.Color(starCol) })
  pageGroup.add(new THREE.Mesh(starGeo, starMat))
  pageGroup.add(buildStarGlow(starCol))

  // Planets
  const maxAu  = Math.max(...sys.planets.map(p => p.semi_major_au), 0.1)
  const meshes: THREE.Mesh[] = []

  for (const p of sys.planets) {
    const r    = auToSu(p.semi_major_au, maxAu)
    pageGroup.add(buildOrbitRing(r))
    const mesh = buildPlanetMesh(p, r)
    pageGroup.add(mesh)
    meshes.push(mesh)

    // Planet glow sprite
    const gcv  = document.createElement('canvas'); gcv.width = gcv.height = 48
    const gctx = gcv.getContext('2d')!
    const gc   = gctx.createRadialGradient(24, 24, 0, 24, 24, 24)
    const pcol = new THREE.Color(planetColor(p.type))
    gc.addColorStop(0,    `rgba(255,255,255,0.85)`)
    gc.addColorStop(0.25, `rgba(${Math.round(pcol.r*255)},${Math.round(pcol.g*255)},${Math.round(pcol.b*255)},0.45)`)
    gc.addColorStop(1,    `rgba(0,0,0,0)`)
    gctx.fillStyle = gc; gctx.fillRect(0, 0, 48, 48)
    const gtex = new THREE.CanvasTexture(gcv)
    gtex.generateMipmaps = false; gtex.minFilter = THREE.LinearFilter
    const glowScale = Math.max(0.06, mesh.geometry.boundingSphere?.radius ?? 0.03) * 4.5
    const gsp  = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    gsp.scale.setScalar(glowScale)
    gsp.userData.baseGlowScale = glowScale
    gsp.position.copy(mesh.position)
    mesh.userData.glowSprite = gsp
    pageGroup.add(gsp)
  }

  planetMeshes.value = meshes

  raycasterSys = new THREE.Raycaster()
  raycasterSys.params.Mesh = {}

  _stopTick = viz.addTick(tick)
}

function onCanvasClick(e: MouseEvent) {
  if (!raycasterSys || !camera) return
  const w = window.innerWidth, h = window.innerHeight - VIZ_BAR_H
  mouseVec.x =  (e.clientX / w) * 2 - 1
  mouseVec.y = -((e.clientY - VIZ_BAR_H) / h) * 2 + 1
  raycasterSys.setFromCamera(mouseVec, camera)
  const hits = raycasterSys.intersectObjects(planetMeshes.value, false)
  if (hits.length) {
    const pid = hits[0]!.object.userData.planetId as string
    const p   = planets.value.find(pl => pl.id === pid)
    if (p) selectPlanet(p)
  }
}

function onCanvasMove(e: MouseEvent) {
  if (!raycasterSys || !camera) return
  const w = window.innerWidth, h = window.innerHeight - VIZ_BAR_H
  mouseVec.x =  (e.clientX / w) * 2 - 1
  mouseVec.y = -((e.clientY - VIZ_BAR_H) / h) * 2 + 1
  raycasterSys.setFromCamera(mouseVec, camera)
  const hits = raycasterSys.intersectObjects(planetMeshes.value, false)
  const newId = hits.length ? (hits[0]!.object.userData.planetId as string) : null

  if (newId === hoveredPlanetId) return

  if (hoveredPlanetId) {
    const prev = planetMeshes.value.find(m => m.userData.planetId === hoveredPlanetId)
    if (prev) {
      ;(prev.material as THREE.MeshBasicMaterial).color.set(planetColor(prev.userData.planetType as string))
      prev.scale.setScalar(1.0)
      const gsp = prev.userData.glowSprite as THREE.Sprite | undefined
      if (gsp) { gsp.scale.setScalar(gsp.userData.baseGlowScale as number) }
    }
  }

  if (newId) {
    const next = planetMeshes.value.find(m => m.userData.planetId === newId)
    if (next) {
      const base = new THREE.Color(planetColor(next.userData.planetType as string))
      ;(next.material as THREE.MeshBasicMaterial).color.copy(base.lerp(new THREE.Color(0xffffff), 0.38))
      next.scale.setScalar(1.5)
      const gsp = next.userData.glowSprite as THREE.Sprite | undefined
      if (gsp) { gsp.scale.setScalar((gsp.userData.baseGlowScale as number) * 2.2) }
    }
    hoveringPlanet.value = true
  } else {
    hoveringPlanet.value = false
  }
  hoveredPlanetId = newId
}

function onCanvasLeave() {
  if (hoveredPlanetId) {
    const prev = planetMeshes.value.find(m => m.userData.planetId === hoveredPlanetId)
    if (prev) {
      ;(prev.material as THREE.MeshBasicMaterial).color.set(planetColor(prev.userData.planetType as string))
      prev.scale.setScalar(1.0)
      const gsp = prev.userData.glowSprite as THREE.Sprite | undefined
      if (gsp) gsp.scale.setScalar(gsp.userData.baseGlowScale as number)
    }
    hoveredPlanetId = null
  }
  hoveringPlanet.value = false
}

function tick() {
  // Animate planet orbits
  for (const mesh of planetMeshes.value) {
    mesh.userData.orbitAngle += mesh.userData.orbitSpd
    const r  = mesh.userData.orbitR as number
    const a  = mesh.userData.orbitAngle as number
    mesh.position.set(r * Math.cos(a), 0, r * Math.sin(a))
    const gsp = mesh.userData.glowSprite as THREE.Sprite | undefined
    if (gsp) gsp.position.copy(mesh.position)
  }
}

function teardown() {
  _stopTick?.(); _stopTick = null

  disposeScene(pageGroup)
  scene?.remove(pageGroup)
  if (scene) scene.background = null
  if (controls) controls.autoRotate = false

  raycasterSys = null
  hoveredPlanetId = null
}

onMounted(async () => {
  // Await a tick so MainLayout's onMounted (which calls viz.init()) runs first —
  // this page can otherwise mount before the shared renderer exists.
  await Promise.resolve()
  await load()
  if (doc.value?._source !== 'generated') {
    console.warn(
      `[exotopia] cluster-system ${clusterSlug.value}/${memberId.value}/sys${systemIdx.value}:` +
      ` using ${doc.value?._source ?? 'no-data'} — generated JSON not found`
    )
  }
  buildScene()
  if (camera && controls) {
    gsap.to(camera.position, {
      x: 0, y: 3.5, z: 7.0,
      duration: 1.4, ease: 'power3.out',
      onUpdate: () => controls!.update(),
    })
  }
})
onBeforeUnmount(teardown)
</script>

<style scoped>
.cs-page   { position: relative; width: 100vw; height: 100vh; overflow: hidden; }

.cs-breadcrumb {
  position: absolute; top: 12px; left: 12px; z-index: 10;
  background: rgba(5,10,20,0.72); padding: 4px 10px; border-radius: 20px;
  backdrop-filter: blur(4px);
}

.cs-header {
  position: absolute; top: 44px; left: 16px; z-index: 10;
  pointer-events: none;
}

.cs-planet-panel {
  position: absolute; top: 80px; right: 12px;
  width: 240px; z-index: 10;
  background: rgba(4, 8, 18, 0.88);
  border: 1px solid rgba(60,100,140,0.30);
  border-radius: 8px; padding: 14px;
  backdrop-filter: blur(8px);
  pointer-events: auto;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.cs-planet-row {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 8px; border-radius: 5px;
  cursor: pointer;
  transition: background 0.12s;
  border: 1px solid transparent;
}
.cs-planet-row:hover { background: rgba(0,30,70,0.45); }
.cs-planet-row--active {
  background: rgba(0,40,90,0.55);
  border-color: rgba(0,140,220,0.28);
}

.cs-planet-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}

.cs-planet-info { flex: 1; min-width: 0; }
.cs-planet-name { font-size: 10px; color: rgba(165,210,245,0.88); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cs-planet-sub  { font-size: 8px; color: rgba(90,145,190,0.55); margin-top: 1px; }

.cs-planet-tier { font-size: 8px; letter-spacing: 0.04em; flex-shrink: 0; }

.cs-planet-detail {
  background: rgba(0,10,28,0.55);
  border-radius: 5px; padding: 10px 8px;
}

.cs-detail-row {
  display: flex; justify-content: space-between;
  font-size: 9px; padding: 2px 0;
  color: rgba(130,180,215,0.75);
  border-bottom: 1px solid rgba(0,40,80,0.15);
}
.cs-dl { color: rgba(70,120,165,0.55); }

.cs-loading {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  display: flex; flex-direction: column; align-items: center; z-index: 20;
}

.cs-slide-enter-active, .cs-slide-leave-active {
  overflow: hidden; transition: max-height 0.25s ease, opacity 0.20s ease; max-height: 600px;
}
.cs-slide-enter-from, .cs-slide-leave-to { opacity: 0; max-height: 0; }
</style>
