<template>
  <q-page class="xc-page bg-black overflow-hidden">
    <canvas ref="canvasEl" class="xc-canvas" @click="onClick" @mousemove="onMouseMove" @mouseleave="onMouseLeave" />

    <!-- Breadcrumb -->
    <div class="xc-breadcrumb row items-center q-gutter-xs no-wrap">
      <q-btn flat dense size="xs" color="blue-grey-5" icon="mdi-chevron-left" label="Cosmic"
        @click="$router.push('/cosmic')" />
      <span class="text-blue-grey-7 text-caption">/</span>
      <span class="text-blue-grey-4 text-caption" style="font-size:10px;letter-spacing:0.04em">
        {{ displayName }}
      </span>
    </div>

    <!-- Cluster header -->
    <div class="xc-header">
      <div class="text-caption text-blue-grey-5 q-mb-xs" style="letter-spacing:0.1em">
        X-RAY CLUSTER · TAKEY2013 / XMM-NEWTON
      </div>
      <div class="text-h6 text-blue-grey-2" style="font-size:13px;letter-spacing:0.05em">
        {{ displayName }}
      </div>
      <div class="text-caption text-blue-grey-5 q-mt-xs">
        <span v-if="distMpc">{{ distMpc }} Mpc</span>
        <span v-if="distMpc && redshift"> · </span>
        <span v-if="redshift">z={{ redshift }}</span>
        <span v-if="kev"> · T<sub style="font-size:8px">X</sub> {{ kev }} keV</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="xc-loading">
      <q-spinner-dots color="cyan-8" size="32px" />
      <div class="text-caption text-blue-grey-5 q-mt-sm">Loading galaxy oracle…</div>
    </div>

    <!-- Error -->
    <div v-if="loadError" class="xc-loading">
      <div class="text-caption text-negative">{{ loadError }}</div>
    </div>

    <!-- Selected galaxy panel -->
    <Transition name="slide-panel">
      <div v-if="selected" class="xc-panel">
        <div class="xc-panel-header">
          <div class="text-caption text-cyan-7 q-mb-xs" style="letter-spacing:0.1em">MEMBER GALAXY</div>
          <q-btn flat dense size="xs" icon="mdi-close" color="blue-grey-5" @click="selected = null" />
        </div>

        <div class="text-subtitle2 text-blue-grey-1 q-mb-xs" style="font-size:11px;letter-spacing:0.04em">
          {{ selected.gid }}
        </div>

        <div class="xc-row">
          <span class="xc-lbl">Type</span>
          <span class="text-blue-grey-3">{{ selected.morph }}</span>
        </div>
        <div v-if="selected.is_bcg" class="xc-row">
          <span class="xc-lbl">Role</span>
          <span class="text-amber-5">Brightest Cluster Galaxy</span>
        </div>
        <div v-if="selected.in_sub" class="xc-row">
          <span class="xc-lbl">Substructure</span>
          <span class="text-blue-grey-4">yes</span>
        </div>
        <div class="xc-row">
          <span class="xc-lbl">Angular size</span>
          <span class="text-blue-grey-3">{{ (selected.size_su * 1000).toFixed(1) }} asu</span>
        </div>
        <div class="xc-row">
          <span class="xc-lbl">Opacity</span>
          <span class="text-blue-grey-3">{{ (selected.opacity * 100).toFixed(0) }}%</span>
        </div>

        <q-separator color="blue-grey-8" class="q-my-sm" />

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
      <div v-if="hoverLabel" class="xc-tooltip"
        :style="{ left: (hoverPos.x + 14) + 'px', top: (hoverPos.y - 8) + 'px' }">
        {{ hoverLabel }}
      </div>
    </Transition>

    <!-- Bottom HUD -->
    <div class="xc-hud">
      <span class="text-caption text-blue-grey-6">
        {{ galaxyCount }} galaxies · scroll to zoom · drag to orbit
      </span>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

// ── Types ──────────────────────────────────────────────────────────────────────

interface OracleGalaxy {
  gid:        string
  morph:      string
  col_hex:    string
  size_su:    number
  pos_su:     [number, number, number]
  rot_rad:    number
  opacity:    number
  axis_ratio: number
  is_bcg:     boolean
  in_sub:     boolean
}

interface OracleCluster {
  cluster_id: string
  universe_ver: string
  galaxies:   OracleGalaxy[]
}

// ── Route ──────────────────────────────────────────────────────────────────────

const route  = useRoute()
const router = useRouter()
const xid    = computed(() => String(route.params.xid ?? ''))

// Cluster metadata passed as query params from CosmicPage
const displayName = computed(() => String(route.query.name ?? xid.value).toUpperCase())
const kev         = computed(() => route.query.kev   ? Number(route.query.kev).toFixed(2)   : null)
const redshift    = computed(() => route.query.z     ? Number(route.query.z).toFixed(4)     : null)
const distMpc     = computed(() => route.query.dist  ? Number(route.query.dist).toFixed(0)  : null)

// ── State ──────────────────────────────────────────────────────────────────────

const canvasEl   = ref<HTMLCanvasElement | null>(null)
const loading    = ref(true)
const loadError  = ref('')
const galaxyCount = ref(0)
const selected   = ref<OracleGalaxy | null>(null)
const hoverLabel = ref('')
const hoverPos   = ref({ x: 0, y: 0 })

// ── Three.js ───────────────────────────────────────────────────────────────────

let renderer:  THREE.WebGLRenderer
let scene:     THREE.Scene
let camera:    THREE.PerspectiveCamera
let controls:  OrbitControls
let animId:    number
let raycaster: THREE.Raycaster

const proxyMap  = new Map<string, OracleGalaxy>()  // uuid → galaxy
const proxies:  THREE.Mesh[] = []                   // direct refs for raycasting
const mouseNDC  = new THREE.Vector2()

// Galaxy sprite texture cache keyed by morph+hex
const texCache = new Map<string, THREE.CanvasTexture>()

function makeGalSprite(g: OracleGalaxy): THREE.Sprite {
  const key = `${g.morph}_${g.col_hex}`
  let tex = texCache.get(key)

  if (!tex) {
    const S  = 128
    const cx = S / 2
    const cv = document.createElement('canvas')
    cv.width = cv.height = S
    const ctx = cv.getContext('2d')!

    const c = new THREE.Color(g.col_hex)
    const [r, gr, b] = [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)]
    const rgb = `${r},${gr},${b}`

    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cx, cx * 0.92, 0, Math.PI * 2)
    ctx.clip()

    const pk = g.morph === 'cD' ? 0.68 : g.morph === 'E' ? 0.55 : g.morph === 'S0' ? 0.44 : 0.38
    const glow = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.85)
    glow.addColorStop(0.00, `rgba(255,255,255,${pk.toFixed(2)})`)
    glow.addColorStop(0.10, `rgba(${rgb},${(pk * 0.75).toFixed(2)})`)
    glow.addColorStop(0.40, `rgba(${rgb},${(pk * 0.35).toFixed(2)})`)
    glow.addColorStop(1.00, `rgba(${rgb},0)`)
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, S, S)

    // BCG nucleus marker
    if (g.is_bcg) {
      const nc = ctx.createRadialGradient(cx, cx, 0, cx, cx, S * 0.07)
      nc.addColorStop(0, 'rgba(255,255,255,0.95)')
      nc.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = nc
      ctx.beginPath(); ctx.arc(cx, cx, S * 0.07, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()

    tex = new THREE.CanvasTexture(cv)
    texCache.set(key, tex)
  }

  const mat  = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  const sp   = new THREE.Sprite(mat)
  sp.scale.setScalar(Math.max(0.04, g.size_su * 8))
  return sp
}

function buildScene(galaxies: OracleGalaxy[]) {
  if (!canvasEl.value) return

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 1)
  renderer.setSize(canvasEl.value.clientWidth, canvasEl.value.clientHeight)

  scene  = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(50, canvasEl.value.clientWidth / canvasEl.value.clientHeight, 0.001, 200)
  camera.position.set(0, 0, 2.2)

  controls = new OrbitControls(camera, canvasEl.value)
  controls.enableDamping   = true
  controls.dampingFactor   = 0.08
  controls.minDistance     = 0.15
  controls.maxDistance     = 8
  controls.enablePan       = false
  controls.target.set(0, 0, 0)
  controls.update()

  raycaster = new THREE.Raycaster()

  // Ambient deep-field background particles
  const bgGeo = new THREE.BufferGeometry()
  const bgCount = 600
  const bgPos = new Float32Array(bgCount * 3)
  for (let i = 0; i < bgCount; i++) {
    bgPos[i * 3]     = (Math.random() - 0.5) * 6
    bgPos[i * 3 + 1] = (Math.random() - 0.5) * 6
    bgPos[i * 3 + 2] = (Math.random() - 0.5) * 6
  }
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3))
  const bgMat = new THREE.PointsMaterial({ color: 0x334455, size: 0.008, sizeAttenuation: true })
  scene.add(new THREE.Points(bgGeo, bgMat))

  // Galaxy sprites + invisible proxy spheres for raycasting
  for (const g of galaxies) {
    const sp = makeGalSprite(g)
    sp.position.set(...g.pos_su)
    scene.add(sp)

    const hitR  = Math.max(0.06, g.size_su * 4)
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(hitR, 6, 6),
      new THREE.MeshBasicMaterial({ visible: false }),
    )
    proxy.position.set(...g.pos_su)
    scene.add(proxy)
    proxyMap.set(proxy.uuid, g)
    proxies.push(proxy)
  }

  const loop = () => {
    animId = requestAnimationFrame(loop)
    controls.update()
    renderer.render(scene, camera)
  }
  loop()
}

function onClick(e: MouseEvent) {
  if (!canvasEl.value) return
  const rect = canvasEl.value.getBoundingClientRect()
  mouseNDC.set(
    ((e.clientX - rect.left) / rect.width)  * 2 - 1,
    -((e.clientY - rect.top)  / rect.height) * 2 + 1,
  )
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(proxies, false)
  if (hits.length) {
    const g = proxyMap.get(hits[0]!.object.uuid)
    if (g) selected.value = g
  } else {
    selected.value = null
  }
}

function onMouseMove(e: MouseEvent) {
  if (!canvasEl.value) return
  const rect = canvasEl.value.getBoundingClientRect()
  mouseNDC.set(
    ((e.clientX - rect.left) / rect.width)  * 2 - 1,
    -((e.clientY - rect.top)  / rect.height) * 2 + 1,
  )
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(proxies, false)
  if (hits.length) {
    const g = proxyMap.get(hits[0]!.object.uuid)
    hoverLabel.value = g ? (g.is_bcg ? `BCG · ${g.morph}` : g.morph) : ''
    hoverPos.value   = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  } else {
    hoverLabel.value = ''
  }
}

function onMouseLeave() { hoverLabel.value = '' }

function navigateToGalaxy(settle = false) {
  if (!selected.value) return
  const g    = selected.value
  const base = `/cluster-galaxy/xc-${xid.value}/${encodeURIComponent(g.gid)}`
  const q    = settle
    ? `?morph=${g.morph}&action=claim`
    : `?morph=${g.morph}`
  void router.push(base + q)
}

// ── Resize handling ───────────────────────────────────────────────────────────

function onResize() {
  if (!canvasEl.value || !renderer || !camera) return
  const w = canvasEl.value.clientWidth
  const h = canvasEl.value.clientHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  window.addEventListener('resize', onResize)

  try {
    const res = await fetch(`/galaxy-oracle/${xid.value}.json`)
    if (!res.ok) throw new Error(`oracle HTTP ${res.status}`)
    const data: OracleCluster = await res.json()

    galaxyCount.value = data.galaxies.length
    loading.value = false
    buildScene(data.galaxies)
  } catch (err) {
    loading.value = false
    loadError.value = String(err)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  cancelAnimationFrame(animId)
  renderer?.dispose()
  texCache.forEach(t => t.dispose())
  texCache.clear()
  proxyMap.clear()
  proxies.length = 0
})
</script>

<style scoped>
.xc-page { position: relative; width: 100%; height: 100vh; }

.xc-canvas {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  display: block;
}

.xc-breadcrumb {
  position: absolute; top: 12px; left: 12px;
  z-index: 10;
  background: rgba(0,0,0,0.55);
  border-radius: 6px;
  padding: 2px 8px;
}

.xc-header {
  position: absolute; top: 44px; left: 12px;
  z-index: 10;
  max-width: 260px;
}

.xc-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  z-index: 5;
}

/* Selected galaxy panel */
.xc-panel {
  position: absolute; top: 50%; right: 12px;
  transform: translateY(-50%);
  width: 210px;
  background: rgba(8,14,24,0.92);
  border: 1px solid rgba(0,229,255,0.12);
  border-radius: 8px;
  padding: 12px;
  z-index: 20;
}

.xc-panel-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px;
}

.xc-row {
  display: flex; justify-content: space-between;
  font-size: 10px; line-height: 1.6;
  color: rgba(255,255,255,0.55);
}

.xc-lbl { color: rgba(100,140,170,0.8); }

/* Hover tooltip */
.xc-tooltip {
  position: absolute;
  background: rgba(0,0,0,0.75);
  border: 1px solid rgba(0,229,255,0.25);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 10px;
  color: #b0d8f0;
  pointer-events: none;
  z-index: 30;
  white-space: nowrap;
}

/* Bottom HUD */
.xc-hud {
  position: absolute; bottom: 12px; left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.45);
  border-radius: 12px;
  padding: 2px 12px;
  z-index: 10;
}

/* Panel slide transition */
.slide-panel-enter-active,
.slide-panel-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.slide-panel-enter-from,
.slide-panel-leave-to    { transform: translateX(20px) translateY(-50%); opacity: 0; }
.slide-panel-enter-to,
.slide-panel-leave-from  { transform: translateY(-50%); opacity: 1; }

/* Fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from,   .fade-leave-to    { opacity: 0; }
</style>
