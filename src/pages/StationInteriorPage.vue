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
      <div class="si-exoloc">{{ exolocation }}</div>
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
  STARTER_LIGHT_PRESET,
  consumeStarterReveal,
  type ItemAcquisitionType,
  type SettlementItem,
} from 'src/lib/settlement-items'
import { orbitalKey } from 'src/lib/settlements'
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

// ── Constants / display ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ItemAcquisitionType, string> = {
  constructed: 'constructed',
  traded:      'traded',
  generated:   'airdrop',
  'eco-ops':   'eco-ops',
}

const CYL_R   = 70
const CYL_LEN = 200
const CYL_GAP = 60
const CYL_SEP = CYL_R * 2 + CYL_GAP

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
  buildEndCaps()
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

function buildEndCaps() {
  const capMat = new THREE.MeshBasicMaterial({ color: 0x081018, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
  for (const cx of [0, CYL_SEP]) {
    for (const z of [-CYL_LEN / 2, CYL_LEN / 2]) {
      const cap = new THREE.Mesh(new THREE.CircleGeometry(CYL_R, 32), capMat)
      cap.position.set(cx, 0, z)
      scene!.add(cap)

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 6, 10), new THREE.MeshPhongMaterial({ color: 0x223344 }))
      hub.rotation.x = Math.PI / 2
      hub.position.set(cx, 0, z + (z < 0 ? 3 : -3))
      scene!.add(hub)
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

  for (const item of items.value) {
    const slotIdx = zoneCount[item.zone] ?? 0
    zoneCount[item.zone] = slotIdx + 1

    const pos   = autoPosition(item, slotIdx, CYLINDER_ZONE_POSITIONS)
    const group = buildItemMesh(item.meshPreset, item.color)
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
