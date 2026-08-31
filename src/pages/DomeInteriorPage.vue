<template>
  <q-page class="di-page">
    <canvas ref="canvasEl" class="di-canvas" @mousemove="onMouseMove" @click="onCanvasClick" />

    <!-- ── Top bar ──────────────────────────────────────────────────────── -->
    <div class="di-topbar">
      <q-btn flat dense size="xs" color="blue-grey-4" icon="arrow_back"
        @click="goBack" label="Surface" />
      <div class="di-topbar-center">
        <q-icon name="mdi-home-circle-outline" size="12px" color="cyan-5" class="q-mr-xs" />
        <span class="di-title">DOME INTERIOR</span>
        <span class="di-hostname q-ml-sm">{{ hostname }}</span>
      </div>
      <div class="di-exoloc">{{ exolocation }}</div>
    </div>

    <!-- ── Hover tooltip ───────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="hoveredItem" class="di-tooltip q-pa-sm" :style="tooltipStyle">
        <div class="row items-center q-mb-xs">
          <div class="di-tt-dot q-mr-sm" :style="{ background: hoveredItem.color }" />
          <span class="text-subtitle2 text-blue-grey-1">{{ hoveredItem.label }}</span>
        </div>
        <div class="text-caption text-cyan-5 q-mb-xs">{{ hoveredItem.zone }} · {{ TYPE_LABELS[hoveredItem.type] }}</div>
        <div class="text-caption text-blue-grey-4">{{ hoveredItem.description }}</div>
      </div>
    </Transition>

    <!-- ── Zone labels (toggleable) ────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showZones" class="di-zone-overlay">
        <div v-for="(pos, zone) in ZONE_POSITIONS" :key="zone"
          class="di-zone-label"
          :style="zoneScreenPos(pos)"
        >{{ zone }}</div>
      </div>
    </Transition>

    <!-- ── Loading ─────────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="!sceneReady" class="di-loading column items-center justify-center">
        <q-spinner-orbit color="cyan" size="44px" />
        <div class="text-caption text-blue-grey-5 q-mt-sm">Entering dome…</div>
      </div>
    </Transition>

    <!-- ── Bottom HUD ───────────────────────────────────────────────────── -->
    <div class="di-hud">
      <div class="row items-center q-gutter-x-sm no-wrap">
        <q-btn flat dense round icon="help_outline" color="blue-grey-5" size="sm"
          @click="showHints = !showHints" title="Controls" />
        <q-btn flat dense round
          :icon="showZones ? 'place' : 'place'" :color="showZones ? 'cyan-5' : 'blue-grey-6'"
          size="sm" title="Toggle zone labels"
          @click="showZones = !showZones" />
        <q-separator vertical color="blue-grey-8" />
        <span class="di-hud-count text-caption text-blue-grey-5">
          {{ items.length }} item{{ items.length !== 1 ? 's' : '' }} placed
        </span>
        <q-separator vertical color="blue-grey-8" />
        <q-btn flat dense round icon="exit_to_app" color="blue-grey-4" size="sm"
          @click="goBack" title="Exit dome" />
      </div>
    </div>

    <!-- ── Control hints ───────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showHints" class="di-hints q-pa-sm">
        <div class="di-hint-row"><q-icon name="mouse" size="11px" class="q-mr-xs" />Drag to look around</div>
        <div class="di-hint-row"><q-icon name="scroll" size="11px" class="q-mr-xs" />Scroll / pinch to zoom</div>
        <div class="di-hint-row"><q-icon name="keyboard" size="11px" class="q-mr-xs" />WASD / arrows to walk</div>
        <div class="di-hint-row"><q-icon name="ads_click" size="11px" class="q-mr-xs" />Click item to inspect</div>
      </div>
    </Transition>

    <!-- ── Inventory panel ─────────────────────────────────────────────── -->
    <SettlementInventory :settlement-key="settlementKey" />

    <!-- ── Item inspector ───────────────────────────────────────────────── -->
    <Transition name="di-inspect-slide">
      <div v-if="selectedItem" class="di-inspect-panel">
        <div class="di-inspect-header">
          <div class="di-inspect-dot" :style="{ background: selectedItem.color }" />
          <span class="di-inspect-title">{{ selectedItem.label }}</span>
          <q-space />
          <q-btn flat dense round icon="close" size="xs" color="blue-grey-5" @click="closeInspector" title="Close" />
        </div>
        <div class="di-inspect-body">
          <div class="di-inspect-meta">
            <span class="di-inspect-chip">{{ selectedItem.zone }}</span>
            <span class="di-inspect-chip" :class="`di-type--${selectedItem.type}`">{{ TYPE_LABELS[selectedItem.type] }}</span>
          </div>
          <div class="di-inspect-desc">{{ selectedItem.description }}</div>
          <div v-if="selectedItem.community" class="di-inspect-prov">
            <q-icon name="groups" size="10px" class="q-mr-xs" />{{ selectedItem.community }}
          </div>
          <div v-if="selectedItem.donorKey" class="di-inspect-prov">
            <q-icon name="swap_horiz" size="10px" class="q-mr-xs" />From {{ selectedItem.donorKey }}
          </div>
          <div v-if="selectedItem.airdropBundle" class="di-inspect-prov">
            <q-icon name="bolt" size="10px" class="q-mr-xs" />{{ selectedItem.airdropBundle }}
          </div>
          <div v-if="selectedItem.buildCost" class="di-inspect-prov">
            <q-icon name="build" size="10px" class="q-mr-xs" />{{ selectedItem.buildCost }} eco-ops pts
          </div>
          <div class="di-inspect-date">Acquired {{ fmtDate(selectedItem.acquiredAt) }}</div>
        </div>
        <div class="di-inspect-footer">
          <q-btn flat dense icon="delete_outline" label="Remove from settlement" color="red-5" size="sm"
            @click="confirmRemoveSelected" />
        </div>
      </div>
    </Transition>

    <!-- Remove confirm -->
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
import { surfacePaletteFor, disposeScene } from 'src/lib/three-utils'
import { tryLoadGLTF, ASSET_PATHS } from 'src/lib/asset-loader'
import { useGalaxyStore } from 'src/stores/galaxy'
import {
  useSettlementItems,
  ITEM_MESH_PRESETS,
  ZONE_POSITIONS,
  autoPosition,
  buildItemMesh,
  enhanceItemMeshWithAsset,
  MAX_ITEM_LIGHTS,
  STARTER_LIGHT_PRESET,
  consumeStarterReveal,
  type ItemAcquisitionType,
  type SettlementItem,
} from 'src/lib/settlement-items'
import { surfaceKey, moonKey } from 'src/lib/settlements'
import SettlementInventory from 'src/components/SettlementInventory.vue'

// ── Route ──────────────────────────────────────────────────────────────────────

const route  = useRoute()
const router = useRouter()

const hostname   = computed(() => String(route.params.hostname   ?? ''))
const planetName = computed(() => String(route.params.planetName ?? ''))
const eqtK       = computed(() => Number(route.query.eqt ?? 285))

// Moon context — mirrors SurfaceViewPage.vue's isMoonView/settlementKey so a
// moon settlement's dome interior resolves to the SAME settlement key (and
// therefore the same placed items / claim state) as its exterior view. Lost
// when navigating here without ?parent, which is why enterDome()/goBack()
// must round-trip it.
const parentName = computed(() => String(route.query.parent ?? ''))
const isMoonView = computed(() => !!parentName.value)

// ── Settlement store ───────────────────────────────────────────────────────────

const galaxyStore  = useGalaxyStore()
const planet       = computed(() => galaxyStore.getPlanet(planetName.value) ?? null)
const system       = computed(() => galaxyStore.getSystem(hostname.value)  ?? null)
const effectiveEqt = computed(() => planet.value?.pl_eqt ?? eqtK.value)

const settlementKey = computed(() => isMoonView.value
  ? moonKey(parentName.value, 1, 'exo-moon-surface-v1')
  : surfaceKey(planetName.value))
const exolocation   = computed(() => isMoonView.value
  ? `exo-moon-surface-v1:${parentName.value}:${planetName.value}`
  : `exo-surface-v1:${hostname.value}:${planetName.value}`)

const { items, removeItem } = useSettlementItems(settlementKey)

// ── Constants / display ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ItemAcquisitionType, string> = {
  constructed: 'constructed',
  traded:      'traded',
  generated:   'airdrop',
  'eco-ops':   'eco-ops',
  reward:      'earned',
}

// ── UI state ──────────────────────────────────────────────────────────────────

const sceneReady = ref(false)
const showHints  = ref(false)
const showZones  = ref(false)

// ── Three.js ──────────────────────────────────────────────────────────────────

const canvasEl = ref<HTMLCanvasElement>()

let renderer: THREE.WebGLRenderer     | null = null
let scene:    THREE.Scene             | null = null
let camera:   THREE.PerspectiveCamera | null = null
let controls: OrbitControls           | null = null
let rafId:    number | null = null
let clock:    THREE.Clock

// Scene item meshes — keyed by item id
const itemMeshes = new Map<string, THREE.Group>()
// Starter-lantern reveal: item id -> tick() time the reveal animation started
const revealStarts = new Map<string, number>()

// Raycaster for hover
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

// Item inspector (click-to-inspect)
const selectedItem      = ref<SettlementItem | null>(null)
const removeConfirmOpen = ref(false)
let   selectionRing: THREE.Mesh | null = null

// Keyboard walk
const keysDown = new Set<string>()

// ── Scene ─────────────────────────────────────────────────────────────────────

function buildScene() {
  if (!canvasEl.value) return

  const eqt     = effectiveEqt.value
  const palette = surfacePaletteFor(eqt)

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.85

  scene  = new THREE.Scene()
  scene.background = new THREE.Color(0x010510)
  scene.fog        = new THREE.FogExp2(0x010510, 0.008)

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500)
  camera.position.set(0, 5, 22)

  // Controls — free-look inside dome
  controls = new OrbitControls(camera, canvasEl.value)
  controls.target.set(0, 4, -5)
  controls.enableDamping  = true
  controls.dampingFactor  = 0.07
  controls.minDistance    = 0.4
  controls.maxDistance    = 64        // keeps camera inside dome r=70
  controls.minPolarAngle  = 0.06
  controls.maxPolarAngle  = Math.PI * 0.82
  controls.rotateSpeed    = 0.45
  controls.mouseButtons   = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
  controls.touches        = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
  controls.update()

  clock     = new THREE.Clock()
  raycaster = new THREE.Raycaster()

  buildLights(eqt)
  buildDomeShell()
  buildGround(palette)
  buildStructures(palette, eqt)
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
  ring.position.y = 0.08
  ring.visible = false
  scene!.add(ring)
  selectionRing = ring
}

function buildLights(eqt: number) {
  // Diffuse dome atmosphere
  scene!.add(new THREE.AmbientLight(0x0a1828, 1.2))

  // Soft "dome sky" hemisphere — slight tint from planet temperature
  const skyColor = eqt > 800 ? new THREE.Color(0x1a0808) : eqt < 200 ? new THREE.Color(0x080818) : new THREE.Color(0x060e18)
  scene!.add(new THREE.HemisphereLight(skyColor, new THREE.Color(0x020408), 0.6))

  // Directional light filtering through dome apex
  const sun = new THREE.DirectionalLight(0xddddff, 0.5)
  sun.position.set(5, 60, -10)
  scene!.add(sun)
}

function buildDomeShell() {
  // Half-sphere visible from inside (BackSide)
  const geo = new THREE.SphereGeometry(70, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)

  // Inner shell — soft blue-black
  scene!.add(Object.assign(
    new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x020c1a, transparent: true, opacity: 0.55, side: THREE.BackSide, depthWrite: false })),
    {}
  ))

  // Wireframe geodesic lattice (BackSide)
  scene!.add(Object.assign(
    new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: 0x0066aa, wireframe: true, transparent: true, opacity: 0.06, side: THREE.BackSide, depthWrite: false })),
    {}
  ))

  // Apex glow — diffuse ambient from dome top
  const apexGlow = new THREE.Mesh(
    new THREE.SphereGeometry(12, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0x003355, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  apexGlow.position.set(0, 68, 0)
  scene!.add(apexGlow)

  // Ground ring at dome base
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(68, 72, 64),
    new THREE.MeshBasicMaterial({ color: 0x0088cc, side: THREE.DoubleSide, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.1
  scene!.add(ring)
}

function buildGround(palette: ReturnType<typeof surfacePaletteFor>) {
  // Main ground
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(70, 48),
    new THREE.MeshPhongMaterial({ color: palette.terrain, shininess: 2 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.05
  scene!.add(ground)

  // Subtle centre pathway markings
  const spoke = new THREE.MeshBasicMaterial({ color: 0x0055aa, transparent: true, opacity: 0.14, depthWrite: false })
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const pts   = [
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(Math.cos(angle) * 50, 0.05, Math.sin(angle) * 50),
    ]
    scene!.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), spoke))
  }
}

function buildStructures(palette: ReturnType<typeof surfacePaletteFor>, eqt: number) {
  // Library (simplified) — previously read as a flat black rectangle from the
  // default camera position: its only light was a PointLight sitting above
  // the roof (y=22, box top at y=18), so the front face visitors actually
  // see got almost no direct light, just dim ambient/hemisphere fill plus a
  // weak emissiveIntensity (0.35). Fixed with a front-facing light and a
  // brighter emissive so the structure reads clearly without needing an
  // authored model — see enhanceDomeStructure() below for the real fix once
  // one exists (public/assets/dome-structures/library.glb).
  const lib = new THREE.Group()
  const libMat = new THREE.MeshPhongMaterial({ color: 0x24405a, emissive: 0x0a2a44, emissiveIntensity: 0.75, shininess: 12 })
  const libBox = new THREE.Mesh(new THREE.BoxGeometry(14, 18, 14), libMat)
  libBox.position.set(0, 9, -15)
  lib.add(libBox)
  // windows — DoubleSide because the previous rotation.y = a formula had the
  // plane's facing direction inverted on 2 of the 4 sides (including the one
  // facing the default camera): a plane's default normal after `rotation.y = a`
  // points toward (sin a, 0, cos a), but the outward direction from the box
  // at that position is (sin a, 0, -cos a) — only equal when cos(a) = 0. The
  // other two windows were being back-face-culled, invisible from outside,
  // which was most of why the library read as a flat unlit rectangle.
  const winMat = new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  for (let s = 0; s < 4; s++) {
    const a = s * Math.PI / 2
    const w = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 6.5), winMat)
    w.position.set(Math.sin(a) * 7.05, 9, -15 - Math.cos(a) * 7.05)
    w.rotation.y = a
    lib.add(w)
  }
  // Roof light (kept) plus a front-facing fill light — the box's south face
  // (toward the dome entrance / default camera) is the one visitors actually
  // see first, and previously had no direct light of its own.
  const roofLight = new THREE.PointLight(0x44aaff, 0.8, 70)
  roofLight.position.set(0, 22, -15)
  lib.add(roofLight)
  const frontLight = new THREE.PointLight(0x66ccff, 1.1, 40)
  frontLight.position.set(0, 10, 4)
  lib.add(frontLight)
  scene!.add(lib)

  void enhanceDomeStructure(lib, 'library')

  // Water feature (animated in tick)
  const wGeo = new THREE.PlaneGeometry(30, 60, 12, 20)
  const wMat = new THREE.MeshPhongMaterial({ color: 0x0044aa, emissive: 0x001133, shininess: 70, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
  const water = new THREE.Mesh(wGeo, wMat)
  water.rotation.x = -Math.PI / 2
  water.position.set(34, 0.3, -26)
  water.name = 'water'
  scene!.add(water)
  const waterLight = new THREE.PointLight(0x0066cc, 0.5, 50)
  waterLight.position.set(34, 2, -26)
  scene!.add(waterLight)

  // Vegetation cluster (simplified)
  const baseHue = eqt > 800 ? 0.08 : eqt < 200 ? 0.55 : 0.32
  for (let i = 0; i < 20; i++) {
    const h = baseHue + (Math.sin(i * 7.31) * 0.5 + 0.5) * 0.12
    const col = new THREE.Color().setHSL(h, 0.65, 0.30 + (i % 5) * 0.04)
    const ht  = 2.8 + (i % 4) * 1.8
    const r   = 1.2 + (i % 3) * 0.8
    const plant = new THREE.Mesh(
      new THREE.ConeGeometry(r, ht, 6),
      new THREE.MeshPhongMaterial({ color: col, flatShading: true })
    )
    const angle = (i / 20) * Math.PI * 2
    const dist  = 20 + (i % 5) * 6
    plant.position.set(Math.cos(angle) * dist * 0.4 + 4, ht / 2, Math.sin(angle) * dist - 50)
    scene!.add(plant)
  }
}

/**
 * Swap a fixed dome structure's procedural placeholder for an authored .glb
 * if one exists at ASSET_PATHS.domeStructure(name) — see
 * public/assets/dome-structures/README.md for the drop-in convention.
 * No-op until that file exists; the procedural fallback (with the lighting
 * fix above) keeps rendering. Keeps `group`'s PointLight children since an
 * authored model isn't expected to carry its own lights.
 */
async function enhanceDomeStructure(group: THREE.Group, name: string) {
  const gltf = await tryLoadGLTF(ASSET_PATHS.domeStructure(name))
  if (!gltf) return
  const lights = group.children.filter(c => (c as THREE.PointLight).isPointLight)
  for (const child of [...group.children]) {
    if (lights.includes(child)) continue
    group.remove(child)
    disposeScene(child)   // disposes geometry + material(s) for that child
  }
  group.add(gltf.scene)
}

function buildItems() {
  // Clear existing
  for (const g of itemMeshes.values()) scene?.remove(g)
  itemMeshes.clear()
  itemMeshArr = []
  revealStarts.clear()

  // Founding reveal plays once per settlement, the first time its dome loads.
  const playReveal = consumeStarterReveal(settlementKey.value)

  // Zone slot counters for auto-positioning
  const zoneCount: Record<string, number> = {}

  for (const [idx, item] of items.value.entries()) {
    const slotIdx = zoneCount[item.zone] ?? 0
    zoneCount[item.zone] = slotIdx + 1

    const pos   = autoPosition(item, slotIdx)
    const group = buildItemMesh(item.meshPreset, item.color, idx < MAX_ITEM_LIGHTS, item.voxels, item.vectorPaths)
    group.position.set(pos.x, 0, pos.z)
    group.name = `item:${item.id}`
    if (item.meshPreset === STARTER_LIGHT_PRESET && playReveal) {
      group.scale.setScalar(0.001)
      revealStarts.set(item.id, clock.getElapsedTime())
    }
    scene!.add(group)
    itemMeshes.set(item.id, group)

    // Register all child meshes for hover detection
    group.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) itemMeshArr.push({ mesh: obj, id: item.id })
    })

    // Swap in an authored model if one exists at its preset's asset path —
    // no-ops until that file is actually dropped in (see asset-loader.ts).
    // Hover-detection entries for this item are re-registered on swap since
    // the procedural meshes just registered above get disposed.
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

  // Water ripple
  const water = scene?.getObjectByName('water') as THREE.Mesh | undefined
  if (water) {
    const pos = (water.geometry as THREE.BufferGeometry).attributes.position!
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      pos.setY(i, Math.sin(x * 0.22 + t * 1.8) * 0.5 + Math.cos(z * 0.17 + t * 1.4) * 0.35)
    }
    pos.needsUpdate = true
    water.geometry.computeVertexNormals()
  }

  // Crystal float + rotation
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

  // Selection ring pulse
  if (selectionRing?.visible) {
    ;(selectionRing.material as THREE.MeshBasicMaterial).opacity = 0.40 + Math.sin(t * 3) * 0.25
    selectionRing.rotation.z = t * 0.6
  }

  // WASD movement
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

  // Keep camera inside dome
  const camDist = new THREE.Vector2(camera!.position.x, camera!.position.z).length()
  if (camDist > 62) {
    const scale = 62 / camDist
    camera!.position.x *= scale
    camera!.position.z *= scale
  }
  if (camera!.position.y < 1.2) camera!.position.y = 1.2
  if (camera!.position.y > 65)  camera!.position.y = 65

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

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
}

// ── Zone screen projections (for zone labels) ──────────────────────────────────

function zoneScreenPos(pos: { cx: number; cz: number }): { left: string; top: string } {
  if (!camera || !renderer) return { left: '50%', top: '50%' }
  const v = new THREE.Vector3(pos.cx, 0.5, pos.cz).project(camera)
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
  const parentQuery = isMoonView.value ? `?parent=${encodeURIComponent(parentName.value)}` : ''
  void router.push(`/surface/${encodeURIComponent(hostname.value)}/${encodeURIComponent(planetName.value)}${parentQuery}`)
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

const keydownFn = (e: KeyboardEvent) => {
  keysDown.add(e.code)
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
}
const keyupFn = (e: KeyboardEvent) => keysDown.delete(e.code)

// Re-build items whenever store changes
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
})
</script>

<style scoped>
.di-page   { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #010510; }
.di-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

/* Top bar */
.di-topbar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; gap: 10px;
  padding: 6px 12px;
  background: rgba(0, 5, 18, 0.82);
  border-bottom: 1px solid rgba(0, 100, 160, 0.20);
  backdrop-filter: blur(6px);
}
.di-topbar-center { flex: 1; display: flex; align-items: center; }
.di-title    { font-size: 9px; letter-spacing: 0.18em; color: rgba(0, 180, 220, 0.65); font-family: monospace; }
.di-hostname { font-size: 9px; color: rgba(130, 190, 220, 0.70); font-family: monospace; }
.di-exoloc   { font-size: 8px; color: rgba(60, 100, 140, 0.55); font-family: monospace; }

/* Tooltip */
.di-tooltip {
  position: absolute; z-index: 20; pointer-events: none;
  background: rgba(1, 5, 20, 0.92); border: 1px solid rgba(0, 130, 190, 0.25);
  border-radius: 4px; min-width: 160px; max-width: 220px;
  backdrop-filter: blur(6px);
}
.di-tt-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Zone overlay */
.di-zone-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 8; }
.di-zone-label {
  position: absolute; transform: translate(-50%, -50%);
  font-size: 8px; letter-spacing: 0.12em;
  color: rgba(0, 150, 200, 0.45); font-family: monospace;
  background: rgba(0, 5, 15, 0.50); padding: 2px 5px; border-radius: 2px;
}

/* Loading */
.di-loading {
  position: absolute; inset: 0; background: #010510; z-index: 50;
}

/* Bottom HUD */
.di-hud {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 10;
  background: rgba(0, 5, 20, 0.82); border: 1px solid rgba(0, 80, 130, 0.25);
  border-radius: 20px; padding: 5px 14px;
  backdrop-filter: blur(6px);
}
.di-hud-count { font-family: monospace; font-size: 9px; }

/* Hints */
.di-hints {
  position: absolute; bottom: 52px; left: 50%; transform: translateX(-50%); z-index: 10;
  background: rgba(0, 5, 20, 0.88); border: 1px solid rgba(0, 70, 120, 0.22);
  border-radius: 5px; backdrop-filter: blur(6px);
}
.di-hint-row { display: flex; align-items: center; font-size: 9px; color: rgba(100, 160, 200, 0.70); margin-bottom: 3px; }
.di-hint-row:last-child { margin-bottom: 0; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.20s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Item inspector */
.di-inspect-panel {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 240px; z-index: 20;
  background: rgba(1, 5, 20, 0.96);
  border: 1px solid rgba(0, 150, 200, 0.22);
  border-radius: 0 6px 6px 0;
  backdrop-filter: blur(10px);
  display: flex; flex-direction: column;
  max-height: 70vh; overflow: hidden;
}
.di-inspect-header {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 80, 130, 0.25);
  background: rgba(0, 8, 28, 0.70);
  flex-shrink: 0;
}
.di-inspect-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.di-inspect-title { font-size: 11px; color: rgba(180, 220, 240, 0.92); letter-spacing: 0.04em; }
.di-inspect-body  { padding: 10px; overflow-y: auto; }
.di-inspect-meta  { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
.di-inspect-chip {
  font-size: 8px; padding: 2px 6px; border-radius: 2px; letter-spacing: 0.06em;
  background: rgba(0, 60, 100, 0.30); color: rgba(100, 160, 200, 0.70);
}
.di-type--constructed { background: rgba(180, 120, 0, 0.20);  color: rgba(255, 190, 60, 0.75); }
.di-type--traded      { background: rgba(0, 120, 180, 0.20);  color: rgba(80, 200, 240, 0.75); }
.di-type--generated   { background: rgba(120, 0, 180, 0.20);  color: rgba(190, 100, 255, 0.80); }
.di-type--eco-ops     { background: rgba(0, 130, 50, 0.20);   color: rgba(80, 210, 120, 0.80); }
.di-type--reward      { background: rgba(180, 140, 0, 0.22);  color: rgba(255, 215, 110, 0.85); }
.di-inspect-desc { font-size: 10px; color: rgba(140, 190, 220, 0.80); line-height: 1.5; margin-bottom: 8px; }
.di-inspect-prov {
  font-size: 9px; color: rgba(100, 160, 200, 0.60);
  display: flex; align-items: center; gap: 3px; margin-bottom: 4px;
}
.di-inspect-date {
  font-size: 8px; color: rgba(70, 100, 130, 0.55);
  font-family: monospace; margin-top: 6px;
}
.di-inspect-footer { padding: 8px 10px; border-top: 1px solid rgba(0, 60, 100, 0.20); flex-shrink: 0; }

.di-inspect-slide-enter-active, .di-inspect-slide-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }
.di-inspect-slide-enter-from, .di-inspect-slide-leave-to { transform: translateX(-100%) translateY(-50%); opacity: 0; }
</style>
