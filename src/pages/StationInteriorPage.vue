<template>
  <q-page class="si-page">
    <canvas ref="canvasEl" class="si-canvas" @mousemove="onMouseMove" @click="onCanvasClick" />

    <!-- ── Top bar ──────────────────────────────────────────────────────── -->
    <div class="si-topbar">
      <q-btn flat dense size="xs" color="blue-grey-4" icon="arrow_back"
        @click="goBack" label="Back" />
      <div class="si-topbar-center">
        <q-icon name="mdi-space-station" size="12px" color="cyan-5" class="q-mr-xs" />
        <span class="si-title">STATION INTERIOR</span>
        <span class="si-hostname q-ml-sm">{{ hostname }}</span>
      </div>
      <div class="row items-center q-gutter-x-sm no-wrap">
        <div class="si-exoloc">{{ exolocation }}</div>
        <q-btn dense rounded unelevated size="sm"
          :color="hasThisSettlement ? 'teal-8' : 'amber-9'"
          :icon="hasThisSettlement ? 'mdi-home-circle' : 'mdi-map-marker-plus'"
          :label="hasThisSettlement ? 'Your Settlement' : 'Create a Settlement'"
          @click="goSettle" />
      </div>
    </div>

    <!-- ── Hover tooltip ───────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="hoveredItem" class="si-tooltip q-pa-sm" :style="tooltipStyle">
        <div class="row items-center q-mb-xs">
          <div class="si-tt-dot q-mr-sm" :style="{ background: hoveredItem.color }" />
          <span class="text-subtitle2 text-blue-grey-1">{{ hoveredItem.label }}</span>
        </div>
        <div class="text-caption text-cyan-5 q-mb-xs">{{ hoveredItem.zone }} · {{ TYPE_LABELS[hoveredItem.type] }}</div>
        <div class="text-caption text-blue-grey-4">{{ hoveredItem.description }}</div>
      </div>
    </Transition>

    <!-- ── Zone labels (toggleable) ────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showZones" class="si-zone-overlay">
        <div v-for="(pos, zone) in CYLINDER_ZONE_POSITIONS" :key="zone"
          class="si-zone-label"
          :style="zoneScreenPos(pos)"
        >{{ zone }}</div>
      </div>
    </Transition>

    <!-- ── Loading ─────────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="!sceneReady" class="si-loading column items-center justify-center">
        <q-spinner-orbit color="cyan" size="44px" />
        <div class="text-caption text-blue-grey-5 q-mt-sm">Docking with station…</div>
      </div>
    </Transition>

    <!-- ── Bottom HUD ───────────────────────────────────────────────────── -->
    <div class="si-hud">
      <div class="row items-center q-gutter-x-sm no-wrap">
        <q-btn flat dense round icon="help_outline" color="blue-grey-5" size="sm"
          @click="showHints = !showHints" title="Controls" />
        <q-btn flat dense round
          icon="place" :color="showZones ? 'cyan-5' : 'blue-grey-6'"
          size="sm" title="Toggle zone labels"
          @click="showZones = !showZones" />
        <q-btn flat dense round
          icon="explore" :color="showGuide ? 'cyan-5' : 'blue-grey-6'"
          size="sm" title="Station guide"
          @click="showGuide = !showGuide" />
        <q-separator vertical color="blue-grey-8" />
        <span class="si-hud-count text-caption text-blue-grey-5">
          {{ items.length }} item{{ items.length !== 1 ? 's' : '' }} placed
        </span>
        <q-separator vertical color="blue-grey-8" />
        <q-btn flat dense round icon="exit_to_app" color="blue-grey-4" size="sm"
          @click="goBack" title="Exit station" />
      </div>
    </div>

    <!-- ── Control hints ───────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showHints" class="si-hints q-pa-sm">
        <div class="si-hint-row"><q-icon name="mouse" size="11px" class="q-mr-xs" />Drag to look around</div>
        <div class="si-hint-row"><q-icon name="scroll" size="11px" class="q-mr-xs" />Scroll / pinch to zoom</div>
        <div class="si-hint-row"><q-icon name="keyboard" size="11px" class="q-mr-xs" />WASD / arrows to walk</div>
        <div class="si-hint-row"><q-icon name="ads_click" size="11px" class="q-mr-xs" />Click item to inspect</div>
      </div>
    </Transition>

    <!-- ── Station guide: deck map + status board ─────────────────────── -->
    <Transition name="si-guide-slide">
      <div v-if="showGuide" class="si-guide-panel">
        <div class="si-guide-tabs">
          <button :class="['si-guide-tab', guideTab === 'map' && 'si-guide-tab--active']" @click="guideTab = 'map'">MAP</button>
          <button :class="['si-guide-tab', guideTab === 'schedule' && 'si-guide-tab--active']" @click="guideTab = 'schedule'">SCHEDULE</button>
          <q-space />
          <q-btn flat dense round icon="close" size="xs" color="blue-grey-5" @click="showGuide = false" />
        </div>

        <div v-if="guideTab === 'map'" class="si-guide-body">
          <svg viewBox="-70 -70 140 140" class="si-guide-map">
            <rect x="-60" y="-64" width="120" height="128" rx="10" fill="rgba(0,80,130,0.08)" stroke="rgba(0,150,200,0.30)" stroke-width="1" />
            <circle cx="0" cy="0" r="2" fill="#00ccee" />
            <text x="0" y="-6" text-anchor="middle" font-size="5" fill="rgba(0,200,240,0.65)">YOU ARE HERE</text>
            <g v-for="(pos, zone) in CYLINDER_ZONE_POSITIONS" :key="zone">
              <circle :cx="pos.cx" :cy="pos.cz" :r="pos.radius * 0.5" fill="rgba(0,150,200,0.14)" stroke="rgba(0,190,230,0.45)" stroke-width="0.6" />
              <text :x="pos.cx" :y="pos.cz + 2" text-anchor="middle" font-size="5.5" fill="rgba(150,210,235,0.85)">{{ zone }}</text>
            </g>
            <text x="0" y="-58" text-anchor="middle" font-size="4.5" fill="rgba(100,170,210,0.55)">◎ AEGIS-PANE (FAR)</text>
            <text x="0" y="62" text-anchor="middle" font-size="4.5" fill="rgba(100,170,210,0.55)">◎ AEGIS-PANE (NEAR)</text>
          </svg>
          <div class="si-guide-note">Deck layout — both hulls share this zone plan.</div>
        </div>

        <div v-else class="si-guide-body">
          <div class="si-sched-row"><span>Ring rotation</span><span>{{ spinPeriodLabel }} / rev</span></div>
          <div class="si-sched-row"><span>Host system</span><span>{{ hostname }}{{ system?.st_spectype ? ` · ${system.st_spectype}` : '' }}</span></div>
          <div class="si-sched-row" v-if="system?.sy_dist"><span>Distance</span><span>{{ system.sy_dist.toFixed(1) }} pc</span></div>
          <div class="si-sched-row"><span>Viewport status</span><span>4 AEGIS-panes · nominal</span></div>
          <div class="si-sched-row"><span>Composite mode</span><span>{{ viewStyleLabel }}</span></div>
        </div>
      </div>
    </Transition>

    <!-- ── Inventory panel ─────────────────────────────────────────────── -->
    <SettlementInventory :settlement-key="settlementKey" />

    <!-- ── Item inspector ───────────────────────────────────────────────── -->
    <Transition name="si-inspect-slide">
      <div v-if="selectedItem" class="si-inspect-panel">
        <div class="si-inspect-header">
          <div class="si-inspect-dot" :style="{ background: selectedItem.color }" />
          <span class="si-inspect-title">{{ selectedItem.label }}</span>
          <q-space />
          <q-btn flat dense round icon="close" size="xs" color="blue-grey-5" @click="closeInspector" title="Close" />
        </div>
        <div class="si-inspect-body">
          <div class="si-inspect-meta">
            <span class="si-inspect-chip">{{ selectedItem.zone }}</span>
            <span class="si-inspect-chip">{{ TYPE_LABELS[selectedItem.type] }}</span>
          </div>
          <div class="si-inspect-desc">{{ selectedItem.description }}</div>
          <div v-if="selectedItem.community" class="si-inspect-prov">
            <q-icon name="groups" size="10px" class="q-mr-xs" />{{ selectedItem.community }}
          </div>
          <div v-if="selectedItem.donorKey" class="si-inspect-prov">
            <q-icon name="swap_horiz" size="10px" class="q-mr-xs" />From {{ selectedItem.donorKey }}
          </div>
          <div v-if="selectedItem.airdropBundle" class="si-inspect-prov">
            <q-icon name="bolt" size="10px" class="q-mr-xs" />{{ selectedItem.airdropBundle }}
          </div>
          <div v-if="selectedItem.buildCost" class="si-inspect-prov">
            <q-icon name="build" size="10px" class="q-mr-xs" />{{ selectedItem.buildCost }} eco-ops pts
          </div>
        </div>
        <div class="si-inspect-footer">
          <q-btn flat dense icon="delete_outline" label="Remove from settlement" color="red-5" size="sm"
            @click="confirmRemoveSelected" />
        </div>
      </div>
    </Transition>

    <q-dialog v-model="removeConfirmOpen">
      <q-card class="bg-dark text-blue-grey-1" style="min-width:280px">
        <q-card-section>
          <div class="text-subtitle2">Remove "{{ selectedItem?.label }}"?</div>
          <div class="text-caption text-blue-grey-5 q-mt-xs">This cannot be undone.</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="blue-grey-5" @click="removeConfirmOpen = false" />
          <q-btn flat label="Remove" color="red-5" @click="doRemoveSelected" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { surfacePaletteFor, disposeScene, starColorFromTeff } from 'src/lib/three-utils'
import { useGalaxyStore } from 'src/stores/galaxy'
import {
  useSettlementItems,
  CYLINDER_ZONE_POSITIONS,
  autoPosition,
  buildItemMesh,
  enhanceItemMeshWithAsset,
  MAX_ITEM_LIGHTS,
  STARTER_LIGHT_PRESET,
  consumeStarterReveal,
  type ItemAcquisitionType,
  type SettlementItem,
} from 'src/lib/settlement-items'
import { orbitalKey, useSettlements } from 'src/lib/settlements'
import SettlementInventory from 'src/components/SettlementInventory.vue'

// ── Route ──────────────────────────────────────────────────────────────────────

const route  = useRoute()
const router = useRouter()

const hostname    = computed(() => String(route.params.hostname ?? ''))
const refName     = computed(() => String(route.params.refName  ?? ''))
const coordSystem = computed(() => String(route.query.coordSystem ?? 'exo-orbital-v1'))
const isBlackHole = computed(() => hostname.value === 'Sgr-A*' || !!route.query.zone)

// ── Store ──────────────────────────────────────────────────────────────────────

const galaxyStore = useGalaxyStore()
const system      = computed(() => galaxyStore.getSystem(hostname.value) ?? null)

const settlementKey = computed(() => orbitalKey(coordSystem.value, hostname.value, refName.value || undefined))
const exolocation   = computed(() => refName.value
  ? `${coordSystem.value}:${hostname.value}:${refName.value}`
  : `${coordSystem.value}:${hostname.value}`)

const { items, removeItem } = useSettlementItems(settlementKey)

// ── Settlement record ────────────────────────────────────────────────────────
// Unlike every other interior page, this one had no way to actually create a
// SettlementRecord — a visitor got a free starter-lantern item (useSettlementItems
// auto-grants one) but never anything findable later via "My Settlements." Matters
// most for the no-solid-ground cluster-planet path (ClusterSystemPage.vue's
// descendToPlanet(), see clusterSlug/memberId query params below): those planets
// route straight here with no claim step at all, unlike their solid-ground
// siblings which get ClusterSurfacePage.vue's "Create a Settlement" button.
const clusterSlugQ = computed(() => typeof route.query.clusterSlug === 'string' ? route.query.clusterSlug : undefined)
const memberIdQ    = computed(() => typeof route.query.memberId    === 'string' ? route.query.memberId    : undefined)
const surfaceTypeQ = computed(() => typeof route.query.surfaceType === 'string' ? route.query.surfaceType : undefined)

const { hasSettlement, addSettlement } = useSettlements()
const hasThisSettlement = computed(() => hasSettlement(settlementKey.value))

function goSettle() {
  if (hasThisSettlement.value) return
  addSettlement({
    key:         settlementKey.value,
    type:        'orbital',
    planetName:  refName.value || hostname.value,
    hostname:    hostname.value,
    exolocation: exolocation.value,
    displayName: surfaceTypeQ.value
      ? `${hostname.value} (${surfaceTypeQ.value.replace(/_/g, ' ')})`
      : hostname.value,
    ...(clusterSlugQ.value ? { clusterSlug: clusterSlugQ.value } : {}),
    ...(memberIdQ.value    ? { memberId:    memberIdQ.value }    : {}),
  })
}

// ── Constants / display ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ItemAcquisitionType, string> = {
  constructed: 'constructed',
  traded:      'traded',
  generated:   'airdrop',
  'eco-ops':   'eco-ops',
  reward:      'earned',
}

const CYL_R   = 70
const CYL_LEN = 200
const CYL_GAP = 60
const CYL_SEP = CYL_R * 2 + CYL_GAP

// ── UI state ──────────────────────────────────────────────────────────────────

const sceneReady = ref(false)
const showHints  = ref(false)
const showZones  = ref(false)
const showGuide  = ref(false)
const guideTab   = ref<'map' | 'schedule'>('map')

const VIEW_STYLE_LABELS: Record<ViewStyle, string> = {
  'gas-bands':     'Gas-giant cloud bands',
  'lava':          'Magma-flow thermal',
  'ocean-clouds':  'Hycean cloud composite',
  'accretion-disk': 'Accretion-disk composite',
  'deep-field':    'Deep-field starscape',
}
const viewStyleLabel = computed(() => VIEW_STYLE_LABELS[viewStyleFor()])

// Hull spin rate is fixed at 0.06 rad/s in tick() below — a real derived stat
// from that, not an invented number, for the schedule tab's flavour text.
const spinPeriodLabel = computed(() => `${(2 * Math.PI / 0.06).toFixed(0)}s`)

// ── Three.js ──────────────────────────────────────────────────────────────────

const canvasEl = ref<HTMLCanvasElement>()

let renderer: THREE.WebGLRenderer     | null = null
let scene:    THREE.Scene             | null = null
let camera:   THREE.PerspectiveCamera | null = null
let controls: OrbitControls           | null = null
let rafId:    number | null = null
let clock:    THREE.Clock

let hullA: THREE.Mesh | null = null
let hullB: THREE.Mesh | null = null
let deckY = 0

const itemMeshes = new Map<string, THREE.Group>()
// Starter-lantern reveal: item id -> tick() time the reveal animation started
const revealStarts = new Map<string, number>()

let raycaster:  THREE.Raycaster
let itemMeshArr: { mesh: THREE.Object3D; id: string }[] = []

interface HoveredItemData {
  label: string
  color: string
  zone: string
  type: ItemAcquisitionType
  description: string
}
const hoveredItem  = ref<HoveredItemData | null>(null)
const tooltipStyle = ref({ left: '0px', top: '0px' })
const mouseNDC     = new THREE.Vector2()

const selectedItem      = ref<SettlementItem | null>(null)
const removeConfirmOpen = ref(false)
let   selectionRing: THREE.Mesh | null = null

const keysDown = new Set<string>()

// ── Scene ─────────────────────────────────────────────────────────────────────

function buildScene() {
  if (!canvasEl.value) return

  const palette = surfacePaletteFor(280)   // no real body → fixed temperate deck tint

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.85

  scene  = new THREE.Scene()
  scene.background = new THREE.Color(0x010510)
  scene.fog        = new THREE.FogExp2(0x010510, 0.006)

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 800)
  camera.position.set(0, deckY, 40)

  controls = new OrbitControls(camera, canvasEl.value)
  controls.target.set(0, deckY + 4, 0)
  controls.enableDamping  = true
  controls.dampingFactor  = 0.07
  controls.minDistance    = 0.4
  controls.maxDistance    = 120
  controls.minPolarAngle  = 0.06
  controls.maxPolarAngle  = Math.PI * 0.9
  controls.rotateSpeed    = 0.45
  controls.mouseButtons   = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
  controls.touches        = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
  controls.update()

  clock     = new THREE.Clock()
  raycaster = new THREE.Raycaster()

  const starColor = isBlackHole.value
    ? new THREE.Color(0xff6a2a)   // accretion-glow tint — never starColorFromTeff(undefined) for a black-hole origin
    : starColorFromTeff(system.value?.st_teff)

  buildLights(starColor)
  buildHullPair()
  buildEndCapWindows()
  buildConnectingTruss()
  deckY = buildInteriorGround(palette)
  camera.position.set(0, deckY + 6, 40)
  controls.target.set(0, deckY + 4, 0)
  controls.update()
  buildItems()
  buildSelectionRing()

  window.addEventListener('resize', onResize)
  tick()
  sceneReady.value = true
}

function buildSelectionRing() {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.9, 2.5, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ccee, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = deckY + 0.08
  ring.visible = false
  scene!.add(ring)
  selectionRing = ring
}

function buildLights(starColor: THREE.Color) {
  scene!.add(new THREE.AmbientLight(0x0a1828, 1.2))
  scene!.add(new THREE.HemisphereLight(starColor.clone().multiplyScalar(0.3), new THREE.Color(0x020408), 0.6))
  const sun = new THREE.DirectionalLight(starColor, 0.6)
  sun.position.set(30, 80, -20)
  scene!.add(sun)
}

function buildHullPair() {
  const geo = new THREE.CylinderGeometry(CYL_R, CYL_R, CYL_LEN, 32, 1, true)

  hullA = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color: 0x0c1626, transparent: true, opacity: 0.5, side: THREE.BackSide, depthWrite: false,
  }))
  hullA.rotation.x = Math.PI / 2
  scene!.add(hullA)

  const wireA = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
    color: 0x2288bb, wireframe: true, transparent: true, opacity: 0.08, side: THREE.BackSide, depthWrite: false,
  }))
  wireA.rotation.x = Math.PI / 2
  scene!.add(wireA)

  hullB = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
    color: 0x0c1626, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false,
  }))
  hullB.rotation.x = Math.PI / 2
  hullB.position.x = CYL_SEP
  scene!.add(hullB)

  const wireB = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
    color: 0x2288bb, wireframe: true, transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false,
  }))
  wireB.rotation.x = Math.PI / 2
  wireB.position.x = CYL_SEP
  scene!.add(wireB)
}

// ── Viewport windows ─────────────────────────────────────────────────────────
// Real windows onto real space would show either a featureless black gas-giant
// silhouette (surface too cold to self-illuminate) or nothing at all (bodyless
// orbital addresses, black-hole zones). "Infrared filter" is the in-universe
// excuse for what these actually render: a false-colour composite driven by
// the same surfaceType classification that routed the visitor here in the
// first place (see src/lib/surface-classify.ts), so the view at least means
// something rather than being decorative noise.

type ViewStyle = 'gas-bands' | 'lava' | 'ocean-clouds' | 'accretion-disk' | 'deep-field'

function viewStyleFor(): ViewStyle {
  if (isBlackHole.value) return 'accretion-disk'
  const st = surfaceTypeQ.value ?? ''
  if (st === 'gas_giant' || st === 'hot_gas_giant' || st === 'sub_neptune') return 'gas-bands'
  if (st === 'magma_ocean' || st === 'lava') return 'lava'
  if (st === 'hycean' || st === 'ocean') return 'ocean-clouds'
  return 'deep-field'   // bodyless orbital / unresolved — nothing solid to false-colour
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Seeded per-hostname so a given station always shows the same "sensor read." */
function seedFromHostname(): number {
  return hostname.value.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0) || 1
}

function drawGasBands(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number) {
  const hues = [28, 200, 320, 45, 260]   // amber / cyan / magenta / gold / violet — IR false-colour, not a real albedo
  const bandCount = 7 + Math.floor(rng() * 4)
  let y = 0
  for (let i = 0; i < bandCount; i++) {
    const bandH = h / bandCount
    const hue = hues[Math.floor(rng() * hues.length)]!
    const light = 30 + rng() * 30
    ctx.fillStyle = `hsl(${hue}, 70%, ${light}%)`
    ctx.fillRect(0, y, w, bandH + 1)
    // Turbulent edge between bands instead of a hard line
    ctx.beginPath(); ctx.moveTo(0, y + bandH)
    for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + bandH + Math.sin(x * 0.02 + rng() * 6) * bandH * 0.18)
    ctx.lineTo(w, y); ctx.lineTo(0, y); ctx.closePath()
    ctx.fillStyle = `hsla(${hues[(Math.floor(rng() * hues.length))]}, 70%, ${light + 12}%, 0.35)`
    ctx.fill()
    y += bandH
  }
  // One storm spot
  const sx = w * (0.25 + rng() * 0.5), sy = h * (0.3 + rng() * 0.4)
  const grad = ctx.createRadialGradient(sx, sy, 4, sx, sy, w * 0.09)
  grad.addColorStop(0, 'hsla(0, 85%, 60%, 0.9)')
  grad.addColorStop(1, 'hsla(0, 85%, 60%, 0)')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.ellipse(sx, sy, w * 0.09, w * 0.055, 0, 0, Math.PI * 2); ctx.fill()
}

function drawLava(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number) {
  ctx.fillStyle = '#180404'; ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `hsla(${20 + rng() * 20}, 100%, ${55 + rng() * 20}%, 0.9)`
    ctx.lineWidth = 3 + rng() * 5
    ctx.beginPath()
    let x = rng() * w, y = 0
    ctx.moveTo(x, y)
    while (y < h) {
      x += (rng() - 0.5) * 60
      y += h / 10
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  const grad = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.6)
  grad.addColorStop(0, 'rgba(255,120,20,0.18)')
  grad.addColorStop(1, 'rgba(255,120,20,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function drawOceanClouds(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, 'hsl(200, 70%, 25%)')
  grad.addColorStop(1, 'hsl(210, 80%, 12%)')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 40; i++) {
    const cx = rng() * w, cy = rng() * h, r = 14 + rng() * 46
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, `hsla(190, 60%, 92%, ${0.10 + rng() * 0.12})`)
    g.addColorStop(1, 'hsla(190, 60%, 92%, 0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.4, rng() * Math.PI, 0, Math.PI * 2); ctx.fill()
  }
}

function drawAccretionDisk(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number) {
  ctx.fillStyle = '#020103'; ctx.fillRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2

  // Soft glow wash before the particle disk so the window still reads at a
  // glance/distance, not just up close where individual specks are visible.
  const wash = ctx.createRadialGradient(cx, cy, w * 0.05, cx, cy, w * 0.5)
  wash.addColorStop(0, 'rgba(255,170,60,0.28)')
  wash.addColorStop(0.5, 'rgba(255,110,30,0.14)')
  wash.addColorStop(1, 'rgba(255,110,30,0)')
  ctx.fillStyle = wash
  ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.5, w * 0.5 * 0.32, 0, 0, Math.PI * 2); ctx.fill()

  for (let i = 0; i < 420; i++) {
    const a = rng() * Math.PI * 2
    const r = (w * 0.08) + rng() * w * 0.42
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r * 0.32
    const hot = 1 - Math.min(1, (r - w * 0.08) / (w * 0.42))
    ctx.fillStyle = `hsla(${28 - hot * 20}, 100%, ${50 + hot * 35}%, ${0.6 + hot * 0.4})`
    ctx.fillRect(x, y, 2 + hot, 2 + hot)
  }
  ctx.fillStyle = '#000000'
  ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.07, w * 0.07, 0, 0, Math.PI * 2); ctx.fill()
}

function drawDeepField(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number) {
  ctx.fillStyle = '#01030a'; ctx.fillRect(0, 0, w, h)
  const neb = ctx.createRadialGradient(w * 0.4, h * 0.5, 0, w * 0.4, h * 0.5, w * 0.5)
  neb.addColorStop(0, 'rgba(90,60,160,0.18)')
  neb.addColorStop(1, 'rgba(90,60,160,0)')
  ctx.fillStyle = neb; ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 140; i++) {
    const b = rng()
    ctx.fillStyle = `rgba(${200 + b * 55},${200 + b * 55},255,${0.3 + b * 0.6})`
    ctx.fillRect(rng() * w, rng() * h, 1 + b, 1 + b)
  }
}

function buildWindowTexture(): THREE.CanvasTexture {
  const w = 512, h = 512   // square — these now fill a circular end-cap, not a wall strip
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  const rng = mulberry32(seedFromHostname())

  switch (viewStyleFor()) {
    case 'gas-bands':      drawGasBands(ctx, w, h, rng);      break
    case 'lava':            drawLava(ctx, w, h, rng);          break
    case 'ocean-clouds':    drawOceanClouds(ctx, w, h, rng);   break
    case 'accretion-disk':  drawAccretionDisk(ctx, w, h, rng); break
    case 'deep-field':      drawDeepField(ctx, w, h, rng);     break
  }

  // Thin scanline overlay + corner readout — sells the "sensor display" framing
  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)
  ctx.font = '15px monospace'
  ctx.fillStyle = 'rgba(120,255,220,0.55)'
  ctx.fillText('AEGIS-PANE COMPOSITE · IR FALSE-COLOUR', 14, h - 16)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Two large end-cap windows per cylinder — "some substance and technology not
// yet revealed" stands in for how an engineered structure could ever put a
// window this size at the load-bearing end of a spinning hull; the previous
// design (many small windows on the curved wall) is gone. With the cylinder
// lying on its side, these end-caps read as the tube's "top and bottom" —
// the two faces you'd call top/bottom if it stood upright — capping the view
// straight down the long axis in both directions instead of off to the side.
const WINDOW_RADIUS = CYL_R * 0.93
const MULLION_COUNT = 8

let windowMaterial: THREE.MeshBasicMaterial | null = null

function buildEndCapWindows() {
  const tex = buildWindowTexture()
  windowMaterial = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false })
  const frameMat = new THREE.MeshPhongMaterial({ color: 0x1a2432, shininess: 40 })
  const mullionMat = new THREE.MeshPhongMaterial({ color: 0x141c28, shininess: 20 })
  const glowMat  = new THREE.MeshBasicMaterial({
    color: 0x66ddff, transparent: true, opacity: 0.09, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  })

  for (const cx of [0, CYL_SEP]) {
    for (const z of [-CYL_LEN / 2, CYL_LEN / 2]) {
      // Front-to-back from a viewer standing inside the tube looking toward
      // this end: glow (nearest) > pane (texture) > frame ring (farthest).
      // A viewer at z=+40 looking toward the z=-100 end has "nearer" == less
      // negative z; toward the z=+100 end "nearer" == less positive z — i.e.
      // nearer is always *toward the tube's centre* (z=0), same idea as the
      // old radial ordering, just along the axis instead of across it.
      const inward = z < 0 ? 1 : -1

      const frame = new THREE.Mesh(new THREE.RingGeometry(WINDOW_RADIUS, WINDOW_RADIUS + 5, 48), frameMat)
      frame.position.set(cx, 0, z - inward * 0.6)
      scene!.add(frame)

      const pane = new THREE.Mesh(new THREE.CircleGeometry(WINDOW_RADIUS, 48), windowMaterial)
      pane.position.set(cx, 0, z)
      if (z > 0) pane.rotation.y = Math.PI   // face inward, not away from the tube
      scene!.add(pane)

      const glow = new THREE.Mesh(new THREE.CircleGeometry(WINDOW_RADIUS * 1.25, 48), glowMat)
      glow.position.set(cx, 0, z + inward * 0.6)
      scene!.add(glow)

      // Radial mullions — structural read (this is meant to look like an
      // engineered viewport, not a sticker) and a visual scale reference so a
      // window this large doesn't flatten into an abstract colour field. Must
      // sit IN FRONT of the pane (nearer the camera, same side as glow) — the
      // pane is opaque, so anything placed behind it is simply invisible.
      for (let i = 0; i < MULLION_COUNT; i++) {
        const a = (i / MULLION_COUNT) * Math.PI * 2
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.5, WINDOW_RADIUS * 2, 0.5), mullionMat)
        beam.position.set(cx, 0, z + inward * 0.3)
        beam.rotation.z = a
        scene!.add(beam)
      }
      const hubRing = new THREE.Mesh(new THREE.TorusGeometry(3, 0.6, 8, 20), mullionMat)
      hubRing.position.set(cx, 0, z + inward * 0.3)
      scene!.add(hubRing)
    }
  }
}

function buildConnectingTruss() {
  const beamMat = new THREE.MeshPhongMaterial({ color: 0x334455, shininess: 30 })
  for (const z of [-CYL_LEN / 2, 0, CYL_LEN / 2]) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, CYL_SEP, 8), beamMat)
    beam.rotation.z = Math.PI / 2
    beam.position.set(CYL_SEP / 2, 0, z)
    scene!.add(beam)

    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.4, 6, 20), new THREE.MeshBasicMaterial({ color: 0x0099cc, transparent: true, opacity: 0.5 }))
    ring.position.set(CYL_SEP / 2, 0, z)
    ring.rotation.y = Math.PI / 2
    scene!.add(ring)
  }
}

function buildInteriorGround(palette: ReturnType<typeof surfacePaletteFor>): number {
  const y = -(CYL_R - 6)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, CYL_LEN * 0.8),
    new THREE.MeshPhongMaterial({ color: palette.terrain, shininess: 2 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, y, 0)
  scene!.add(ground)

  const spoke = new THREE.MeshBasicMaterial({ color: 0x0055aa, transparent: true, opacity: 0.14, depthWrite: false })
  for (const z of [-70, -35, 0, 35, 70]) {
    const pts = [new THREE.Vector3(-55, y + 0.05, z), new THREE.Vector3(55, y + 0.05, z)]
    scene!.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), spoke))
  }

  return y
}

function buildItems() {
  for (const g of itemMeshes.values()) scene?.remove(g)
  itemMeshes.clear()
  itemMeshArr = []
  revealStarts.clear()

  // Founding reveal plays once per settlement, the first time its deck loads.
  const playReveal = consumeStarterReveal(settlementKey.value)

  const zoneCount: Record<string, number> = {}

  for (const [idx, item] of items.value.entries()) {
    const slotIdx = zoneCount[item.zone] ?? 0
    zoneCount[item.zone] = slotIdx + 1

    const pos   = autoPosition(item, slotIdx, CYLINDER_ZONE_POSITIONS)
    const group = buildItemMesh(item.meshPreset, item.color, idx < MAX_ITEM_LIGHTS, item.voxels)
    group.position.set(pos.x, deckY, pos.z)
    group.name = `item:${item.id}`
    if (item.meshPreset === STARTER_LIGHT_PRESET && playReveal) {
      group.scale.setScalar(0.001)
      revealStarts.set(item.id, clock.getElapsedTime())
    }
    scene!.add(group)
    itemMeshes.set(item.id, group)

    group.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) itemMeshArr.push({ mesh: obj, id: item.id })
    })

    // Swap in an authored model if one exists at its preset's asset path —
    // no-ops until that file is actually dropped in (see asset-loader.ts).
    void enhanceItemMeshWithAsset(group, item.meshPreset).then(swapped => {
      if (!swapped) return
      itemMeshArr = itemMeshArr.filter(m => m.id !== item.id)
      group.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) itemMeshArr.push({ mesh: obj, id: item.id })
      })
    })
  }
}

const REVEAL_DURATION = 2.4

/** Ease-out cube + hue sweep while a starter lantern's founding reveal plays. */
function tickStarterReveal(id: string, group: THREE.Group, item: SettlementItem, t: number) {
  const start = revealStarts.get(id)
  if (start === undefined) return
  const elapsed = t - start
  const p = Math.min(elapsed / REVEAL_DURATION, 1)
  const eased = 1 - Math.pow(1 - p, 3)
  group.scale.setScalar(Math.max(0.001, eased))

  const sweepColor = p < 1
    ? new THREE.Color().setHSL((p * 1.4) % 1, 0.9, 0.6)
    : new THREE.Color(item.color)
  group.traverse(obj => {
    const mesh = obj as THREE.Mesh
    const mat  = mesh.isMesh ? (mesh.material as THREE.MeshPhongMaterial | THREE.MeshBasicMaterial) : null
    if (mat?.color) mat.color.copy(sweepColor)
    if ((obj as THREE.PointLight).isPointLight) (obj as THREE.PointLight).color.copy(sweepColor)
  })

  if (p >= 1) revealStarts.delete(id)
}

// ── Animation loop ─────────────────────────────────────────────────────────────

function tick() {
  rafId = requestAnimationFrame(tick)

  const t = clock.getElapsedTime()

  if (hullA) hullA.rotation.z = t * 0.06
  if (hullB) hullB.rotation.z = -t * 0.06

  // Slow cloud/plasma drift across every window — same texture, so this alone
  // keeps 18 windows from reading as one static repeated photo.
  if (windowMaterial?.map) {
    windowMaterial.map.offset.x = (t * 0.006) % 1
  }

  for (const [id, group] of itemMeshes) {
    const item = items.value.find(i => i.id === id)
    if (item?.meshPreset === 'crystal') {
      group.children[0]!.position.y = 2.4 + Math.sin(t * 0.8) * 0.4
      group.children[0]!.rotation.y = t * 0.5
    }
    if (item?.meshPreset === 'art-sphere') {
      const orbit = group.children[2]
      if (orbit) orbit.rotation.z = t * 0.4
    }
    if (item?.meshPreset === STARTER_LIGHT_PRESET) {
      tickStarterReveal(id, group, item, t)
    }
  }

  if (selectionRing?.visible) {
    (selectionRing.material as THREE.MeshBasicMaterial).opacity = 0.40 + Math.sin(t * 3) * 0.25
    selectionRing.rotation.z = t * 0.6
  }

  if (keysDown.size > 0 && camera && controls) {
    const WALK = 1.1
    const fwd  = new THREE.Vector3()
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize()
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0))
    const delta = new THREE.Vector3()
    if (keysDown.has('KeyW') || keysDown.has('ArrowUp'))    delta.addScaledVector(fwd,   WALK)
    if (keysDown.has('KeyS') || keysDown.has('ArrowDown'))  delta.addScaledVector(fwd,  -WALK)
    if (keysDown.has('KeyA') || keysDown.has('ArrowLeft'))  delta.addScaledVector(right, -WALK)
    if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) delta.addScaledVector(right,  WALK)
    if (delta.lengthSq() > 0) {
      camera.position.add(delta)
      controls.target.add(delta)
    }
  }

  controls?.update()

  // Keep camera within the elongated deck footprint
  if (camera!.position.x < -58) camera!.position.x = -58
  if (camera!.position.x >  58) camera!.position.x =  58
  const halfLen = CYL_LEN * 0.4 - 4
  if (camera!.position.z < -halfLen) camera!.position.z = -halfLen
  if (camera!.position.z >  halfLen) camera!.position.z =  halfLen
  if (camera!.position.y < deckY + 1.2) camera!.position.y = deckY + 1.2
  if (camera!.position.y > deckY + 60)  camera!.position.y = deckY + 60

  if (renderer && scene && camera) renderer.render(scene, camera)
}

// ── Hover ─────────────────────────────────────────────────────────────────────

function onMouseMove(e: MouseEvent) {
  mouseNDC.x =  (e.clientX / window.innerWidth) * 2 - 1
  mouseNDC.y = -((e.clientY - 44) / (window.innerHeight - 44)) * 2 + 1
  tooltipStyle.value = { left: (e.clientX + 14) + 'px', top: (e.clientY - 10) + 'px' }

  if (!camera) return
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(itemMeshArr.map(m => m.mesh), false)
  if (hits.length) {
    const hit  = itemMeshArr.find(m => m.mesh === hits[0]!.object)!
    const item = items.value.find(i => i.id === hit.id)
    if (item) {
      hoveredItem.value = {
        label: item.label, color: item.color, zone: item.zone,
        type: item.type, description: item.description,
      }
      return
    }
  }
  hoveredItem.value = null
}

function onCanvasClick() {
  if (!camera) return
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(itemMeshArr.map(m => m.mesh), false)
  if (hits.length) {
    const hit  = itemMeshArr.find(m => m.mesh === hits[0]!.object)!
    const item = items.value.find(i => i.id === hit.id)
    const group = itemMeshes.get(hit.id)
    if (item && group) {
      selectedItem.value = item
      if (selectionRing) {
        selectionRing.position.x = group.position.x
        selectionRing.position.z = group.position.z
        ;(selectionRing.material as THREE.MeshBasicMaterial).color.set(item.color)
        selectionRing.visible = true
      }
      return
    }
  }
  closeInspector()
}

function closeInspector() {
  selectedItem.value = null
  if (selectionRing) selectionRing.visible = false
}

function confirmRemoveSelected() {
  removeConfirmOpen.value = true
}

function doRemoveSelected() {
  if (selectedItem.value) removeItem(selectedItem.value.id)
  removeConfirmOpen.value = false
  closeInspector()
}

// ── Zone screen projections ─────────────────────────────────────────────────────

function zoneScreenPos(pos: { cx: number; cz: number }): { left: string; top: string } {
  if (!camera || !renderer) return { left: '50%', top: '50%' }
  const v = new THREE.Vector3(pos.cx, deckY + 0.5, pos.cz).project(camera)
  const x = ((v.x + 1) / 2) * window.innerWidth
  const y = ((-v.y + 1) / 2) * window.innerHeight
  return { left: x + 'px', top: y + 'px' }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function onResize() {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function goBack() {
  if (route.query.clusterSlug && route.query.memberId && route.query.systemIdx) {
    void router.push({
      name: 'cluster-system',
      params: {
        clusterSlug: String(route.query.clusterSlug),
        memberId:    String(route.query.memberId),
        systemIdx:   String(route.query.systemIdx),
      },
    })
    return
  }
  if (isBlackHole.value) {
    void router.push('/galactic-center')
    return
  }
  void router.push('/galaxy')
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

const keydownFn = (e: KeyboardEvent) => {
  keysDown.add(e.code)
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
}
const keyupFn = (e: KeyboardEvent) => keysDown.delete(e.code)

watch(items, () => {
  if (scene) buildItems()
  if (selectedItem.value && !items.value.some(i => i.id === selectedItem.value!.id)) {
    closeInspector()
  }
}, { deep: true })

onMounted(async () => {
  window.addEventListener('keydown', keydownFn)
  window.addEventListener('keyup',   keyupFn)
  await galaxyStore.loadData()
  buildScene()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', keydownFn)
  window.removeEventListener('keyup',   keyupFn)
  keysDown.clear()
  if (rafId !== null) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onResize)
  controls?.dispose()
  if (scene) disposeScene(scene)
  renderer?.dispose()
  renderer = null; scene = null; camera = null; controls = null
  windowMaterial = null
})
</script>

<style scoped>
.si-page   { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #010510; }
.si-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

.si-topbar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; gap: 10px;
  padding: 6px 12px;
  background: rgba(0, 5, 18, 0.82);
  border-bottom: 1px solid rgba(0, 100, 160, 0.20);
  backdrop-filter: blur(6px);
}
.si-topbar-center { flex: 1; display: flex; align-items: center; }
.si-title    { font-size: 9px; letter-spacing: 0.18em; color: rgba(0, 180, 220, 0.65); font-family: monospace; }
.si-hostname { font-size: 9px; color: rgba(130, 190, 220, 0.70); font-family: monospace; }
.si-exoloc   { font-size: 8px; color: rgba(60, 100, 140, 0.55); font-family: monospace; }

.si-tooltip {
  position: absolute; z-index: 20; pointer-events: none;
  background: rgba(1, 5, 20, 0.92); border: 1px solid rgba(0, 130, 190, 0.25);
  border-radius: 4px; min-width: 160px; max-width: 220px;
  backdrop-filter: blur(6px);
}
.si-tt-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.si-zone-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 8; }
.si-zone-label {
  position: absolute; transform: translate(-50%, -50%);
  font-size: 8px; letter-spacing: 0.12em;
  color: rgba(0, 150, 200, 0.45); font-family: monospace;
  background: rgba(0, 5, 15, 0.50); padding: 2px 5px; border-radius: 2px;
}

.si-loading { position: absolute; inset: 0; background: #010510; z-index: 50; }

.si-hud {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 10;
  background: rgba(0, 5, 20, 0.82); border: 1px solid rgba(0, 80, 130, 0.25);
  border-radius: 20px; padding: 5px 14px;
  backdrop-filter: blur(6px);
}
.si-hud-count { font-family: monospace; font-size: 9px; }

.si-hints {
  position: absolute; bottom: 52px; left: 50%; transform: translateX(-50%); z-index: 10;
  background: rgba(0, 5, 20, 0.88); border: 1px solid rgba(0, 70, 120, 0.22);
  border-radius: 5px; backdrop-filter: blur(6px);
}
.si-hint-row { display: flex; align-items: center; font-size: 9px; color: rgba(100, 160, 200, 0.70); margin-bottom: 3px; }
.si-hint-row:last-child { margin-bottom: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.20s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Station guide: deck map + status board ──────────────────────────────── */

.si-guide-panel {
  position: absolute; top: 44px; right: 12px; z-index: 15;
  width: 230px;
  background: rgba(1, 5, 20, 0.94);
  border: 1px solid rgba(0, 140, 200, 0.24);
  border-radius: 6px;
  backdrop-filter: blur(10px);
  overflow: hidden;
}
.si-guide-tabs {
  display: flex; align-items: center;
  padding: 4px 4px 4px 8px;
  border-bottom: 1px solid rgba(0, 70, 120, 0.25);
  background: rgba(0, 8, 28, 0.60);
}
.si-guide-tab {
  padding: 3px 9px; margin-right: 2px; border-radius: 3px;
  font-size: 9px; letter-spacing: 0.08em; font-family: monospace;
  color: rgba(100, 150, 190, 0.65); background: none; border: none; cursor: pointer;
}
.si-guide-tab:hover { color: rgba(160, 210, 235, 0.9); }
.si-guide-tab--active { background: rgba(0, 100, 160, 0.28); color: #00ccee; }

.si-guide-body { padding: 10px; }
.si-guide-map { width: 100%; height: auto; display: block; }
.si-guide-note { font-size: 8px; color: rgba(90, 135, 165, 0.55); margin-top: 6px; text-align: center; }

.si-sched-row {
  display: flex; justify-content: space-between; gap: 10px;
  font-size: 9.5px; padding: 5px 0;
  border-bottom: 1px solid rgba(0, 60, 100, 0.20);
}
.si-sched-row:last-child { border-bottom: none; }
.si-sched-row span:first-child { color: rgba(90, 145, 185, 0.70); }
.si-sched-row span:last-child  { color: rgba(180, 220, 240, 0.88); text-align: right; }

.si-guide-slide-enter-active, .si-guide-slide-leave-active { transition: transform 0.20s ease, opacity 0.20s ease; }
.si-guide-slide-enter-from, .si-guide-slide-leave-to { transform: translateY(-8px); opacity: 0; }

.si-inspect-panel {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 240px; z-index: 20;
  background: rgba(1, 5, 20, 0.96);
  border: 1px solid rgba(0, 150, 200, 0.22);
  border-radius: 0 6px 6px 0;
  backdrop-filter: blur(10px);
  display: flex; flex-direction: column;
  max-height: 70vh; overflow: hidden;
}
.si-inspect-header {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 80, 130, 0.25);
  background: rgba(0, 8, 28, 0.70);
  flex-shrink: 0;
}
.si-inspect-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.si-inspect-title { font-size: 11px; color: rgba(180, 220, 240, 0.92); letter-spacing: 0.04em; }
.si-inspect-body  { padding: 10px; overflow-y: auto; }
.si-inspect-meta  { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
.si-inspect-chip {
  font-size: 8px; padding: 2px 6px; border-radius: 2px; letter-spacing: 0.06em;
  background: rgba(0, 60, 100, 0.30); color: rgba(100, 160, 200, 0.70);
}
.si-inspect-desc { font-size: 10px; color: rgba(140, 190, 220, 0.80); line-height: 1.5; margin-bottom: 8px; }
.si-inspect-prov {
  font-size: 9px; color: rgba(100, 160, 200, 0.60);
  display: flex; align-items: center; gap: 3px; margin-bottom: 4px;
}
.si-inspect-footer { padding: 8px 10px; border-top: 1px solid rgba(0, 60, 100, 0.20); flex-shrink: 0; }

.si-inspect-slide-enter-active, .si-inspect-slide-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }
.si-inspect-slide-enter-from, .si-inspect-slide-leave-to { transform: translateX(-100%) translateY(-50%); opacity: 0; }
</style>
