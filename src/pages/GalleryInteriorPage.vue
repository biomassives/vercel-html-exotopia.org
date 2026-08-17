<template>
  <q-page class="gi-page">
    <canvas ref="canvasEl" class="gi-canvas" @mousemove="onMouseMove" @click="onCanvasClick" />

    <!-- ── Top bar ──────────────────────────────────────────────────────── -->
    <div class="gi-topbar">
      <q-btn flat dense size="xs" color="blue-grey-4" icon="arrow_back"
        @click="goBack" label="Surface" />
      <div class="gi-topbar-center">
        <q-icon name="mdi-hexagon-multiple-outline" size="12px" color="amber-5" class="q-mr-xs" />
        <span class="gi-title">GALLERY</span>
        <span class="gi-hostname q-ml-sm">{{ hostname }}</span>
      </div>
      <div class="gi-exoloc">{{ exolocation }}</div>
    </div>

    <!-- ── Loading ─────────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="!sceneReady" class="gi-loading column items-center justify-center">
        <q-spinner-orbit color="amber" size="44px" />
        <div class="text-caption text-blue-grey-5 q-mt-sm">Entering the gallery…</div>
      </div>
    </Transition>

    <!-- ── Bottom HUD ───────────────────────────────────────────────────── -->
    <div class="gi-hud">
      <div class="row items-center q-gutter-x-sm no-wrap">
        <q-btn flat dense round icon="help_outline" color="blue-grey-5" size="sm"
          @click="showHints = !showHints" title="Controls" />
        <q-separator vertical color="blue-grey-8" />
        <q-btn flat dense round icon="exit_to_app" color="blue-grey-4" size="sm"
          @click="goBack" title="Exit gallery" />
      </div>
    </div>

    <!-- ── Control hints ───────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showHints" class="gi-hints q-pa-sm">
        <div class="gi-hint-row"><q-icon name="mouse" size="11px" class="q-mr-xs" />Drag to look around</div>
        <div class="gi-hint-row"><q-icon name="scroll" size="11px" class="q-mr-xs" />Scroll / pinch to zoom</div>
        <div class="gi-hint-row"><q-icon name="keyboard" size="11px" class="q-mr-xs" />WASD / arrows to walk</div>
      </div>
    </Transition>

    <FileCabinetOverlay v-model="fileCabinetOpen" />
  </q-page>
</template>

<script setup lang="ts">
/**
 * GalleryInteriorPage.vue
 *
 * The gallery building's interior — reached by approaching the bioluminescent
 * gallery structure in SurfaceViewPage.vue (see addGallery()/galleryEnterT in
 * that file). Deliberately styled after a real livable geodesic biodome
 * (open wireframe lattice ceiling, warm tone, planted interior) rather than
 * the cooler sci-fi tone of the main settlement dome interior
 * (DomeInteriorPage.vue), whose buildDomeShell() lattice technique this
 * reuses at a smaller scale.
 *
 * Scope for this pass: walkable shell + lighting + entry/exit + a clickable
 * file cabinet (opens FileCabinetOverlay.vue). Artwork panels, soul orbs, and
 * a robot companion are still SPEC.md §18's documented follow-up.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { disposeScene } from 'src/lib/three-utils'
import { useMemberStore } from 'src/stores/member'
import { useFileCabinetStore } from 'src/stores/file-cabinet'
import FileCabinetOverlay from 'src/components/FileCabinetOverlay.vue'

// ── Route ────────────────────────────────────────────────────────────────────

const route  = useRoute()
const router = useRouter()

const hostname   = computed(() => String(route.params.hostname   ?? ''))
const planetName = computed(() => String(route.params.planetName ?? ''))
// Moon context round-trip — mirrors DomeInteriorPage.vue's isMoonView/goBack
// fix so exiting the gallery from a moon settlement returns to the moon's
// surface view instead of silently dropping to the parent planet.
const parentName = computed(() => String(route.query.parent ?? ''))
const isMoonView = computed(() => !!parentName.value)
const exolocation = computed(() => isMoonView.value
  ? `exo-moon-surface-v1:${parentName.value}:${planetName.value}`
  : `exo-surface-v1:${hostname.value}:${planetName.value}`)

// ── UI state ─────────────────────────────────────────────────────────────────

const sceneReady = ref(false)
const showHints  = ref(false)
const canvasEl   = ref<HTMLCanvasElement>()

const member       = useMemberStore()
const fileCabinet  = useFileCabinetStore()
const fileCabinetOpen = ref(false)

// ── Three.js ─────────────────────────────────────────────────────────────────

const GALLERY_INTERIOR_RADIUS = 24

let renderer: THREE.WebGLRenderer     | null = null
let scene:    THREE.Scene             | null = null
let camera:   THREE.PerspectiveCamera | null = null
let controls: OrbitControls           | null = null
let rafId:    number | null = null

const keysDown = new Set<string>()

// ── File cabinet click target ─────────────────────────────────────────────────
// This page has no raycast infrastructure otherwise — one clickable object
// doesn't need SurfaceViewPage.vue's full hitTargets system, just enough to
// pick this one mesh (mirrors DomeInteriorPage.vue's lighter single-object
// pattern).
let raycaster:     THREE.Raycaster | null = null
let cabinetMeshes: THREE.Object3D[] = []
const mouseNDC = new THREE.Vector2()

function buildShell() {
  const r   = GALLERY_INTERIOR_RADIUS
  const geo = new THREE.SphereGeometry(r, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2)

  // Soft inner shell — warm amber-brown, distinct from the main dome's cool blue
  scene!.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color: 0x2a1a08, transparent: true, opacity: 0.5, side: THREE.BackSide, depthWrite: false,
  })))

  // Open wireframe geodesic lattice — warm gold, more visible than the main
  // dome's near-invisible 0.06 lattice, since here the structure itself is
  // meant to feel like real geodesic-biodome architecture, not a backdrop.
  scene!.add(new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
    color: 0xffaa55, wireframe: true, transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false,
  })))

  // Apex glow
  const apexGlow = new THREE.Mesh(
    new THREE.SphereGeometry(6, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffbb66, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  apexGlow.position.set(0, r - 2, 0)
  scene!.add(apexGlow)

  // Ground ring at the shell's base
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(r - 2, r + 2, 48),
    new THREE.MeshBasicMaterial({ color: 0xffcc66, side: THREE.DoubleSide, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.1
  scene!.add(ring)

  // Floor — warm earthy tone, evoking a real biodome's planted growing floor
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(r, 40),
    new THREE.MeshPhongMaterial({ color: 0x3a2a14, shininess: 2 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.05
  scene!.add(floor)

  // A simple planted ring near the perimeter — same cone-plant idiom already
  // used for exterior vegetation (SurfaceViewPage.vue's addVegetation()),
  // giving the interior a "livable" planted floor rather than a bare room.
  const plantMat = new THREE.MeshPhongMaterial({ color: 0x4a9a4a, flatShading: true, shininess: 2 })
  const PLANT_COUNT = 10
  for (let i = 0; i < PLANT_COUNT; i++) {
    const angle  = (i / PLANT_COUNT) * Math.PI * 2
    const pr     = r * 0.72
    const height = 2 + (i % 3)
    const plant  = new THREE.Mesh(new THREE.ConeGeometry(0.9 + (i % 2) * 0.3, height, 6), plantMat)
    plant.position.set(Math.cos(angle) * pr, height / 2, Math.sin(angle) * pr)
    scene!.add(plant)
  }
}

/**
 * The file cabinet — SPEC.md §18.5's in-world archive access point, opened via
 * FileCabinetOverlay.vue. Procedural-only like the rest of this scene (no
 * textures): a slate body with four stacked drawer faces, warm-amber handles
 * matching this room's accent color, and a soft glow so it reads as "there's
 * something here" without a label. Placed inside the planted ring (r*0.72,
 * see buildShell()'s 10 cone plants) but pulled in to r*0.55 so it doesn't
 * collide with them, on the far side of the room from the camera's entry
 * facing direction so it's discovered by walking in, not stared at on arrival.
 */
function buildFileCabinet() {
  const group = new THREE.Group()

  const bodyMat = new THREE.MeshPhongMaterial({ color: 0x334455, shininess: 18 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.4, 1.6), bodyMat)
  body.position.y = 1.7
  group.add(body)

  const drawerMat = new THREE.MeshPhongMaterial({ color: 0x445566, shininess: 12 })
  const handleMat = new THREE.MeshBasicMaterial({ color: 0xffaa55 })
  const DRAWER_COUNT = 4
  for (let i = 0; i < DRAWER_COUNT; i++) {
    const y = 0.5 + i * 0.78
    const drawer = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.72, 0.08), drawerMat)
    drawer.position.set(0, y, 0.84)
    group.add(drawer)

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6), handleMat)
    handle.rotation.z = Math.PI / 2
    handle.position.set(0, y, 0.90)
    group.add(handle)
  }

  const light = new THREE.PointLight(0xffaa55, 0.5, 8)
  light.position.set(0, 3.3, 0)
  group.add(light)

  const glow = new THREE.Mesh(
    new THREE.RingGeometry(1.3, 1.7, 24),
    new THREE.MeshBasicMaterial({ color: 0xffaa55, side: THREE.DoubleSide, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  glow.rotation.x = -Math.PI / 2
  glow.position.y = 0.05
  group.add(glow)

  const angle  = Math.PI
  const radius = GALLERY_INTERIOR_RADIUS * 0.55
  group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
  group.lookAt(0, 1.7, 0)

  scene!.add(group)

  cabinetMeshes = []
  group.traverse(o => { if ((o as THREE.Mesh).isMesh) cabinetMeshes.push(o) })
}

function buildLights() {
  scene!.add(new THREE.AmbientLight(0x2a1808, 1.4))
  scene!.add(new THREE.HemisphereLight(new THREE.Color(0x3a2810), new THREE.Color(0x0a0602), 0.7))

  // Warm bioluminescent point lights, continuing the mood established by the
  // exterior gallery structure (addGallery() in SurfaceViewPage.vue).
  const colors = [0xffaa44, 0x55ffaa, 0xffaa44, 0x55ffaa]
  const r = GALLERY_INTERIOR_RADIUS * 0.65
  for (let i = 0; i < colors.length; i++) {
    const angle = (i / colors.length) * Math.PI * 2
    const light = new THREE.PointLight(colors[i]!, 1.0, 40)
    light.position.set(Math.cos(angle) * r, 6, Math.sin(angle) * r)
    scene!.add(light)
  }
}

function buildScene() {
  if (!canvasEl.value) return

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0602)
  scene.fog        = new THREE.FogExp2(0x1a0f04, 0.012)

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300)
  camera.position.set(0, 5, GALLERY_INTERIOR_RADIUS * 0.85)

  controls = new OrbitControls(camera, canvasEl.value)
  controls.target.set(0, 4, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.07
  controls.minDistance   = 0.4
  controls.maxDistance   = GALLERY_INTERIOR_RADIUS - 2
  controls.minPolarAngle = 0.06
  controls.maxPolarAngle = Math.PI * 0.82
  controls.rotateSpeed   = 0.45
  controls.mouseButtons  = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
  controls.touches       = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
  controls.update()

  buildLights()
  buildShell()
  buildFileCabinet()

  raycaster = new THREE.Raycaster()

  window.addEventListener('resize', onResize)
  tick()
  sceneReady.value = true
}

function tick() {
  rafId = requestAnimationFrame(tick)

  // WASD movement — same hand-rolled pattern as DomeInteriorPage.vue/
  // StationInteriorPage.vue (no shared controller; each interior page owns its own).
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

  // Keep camera inside the shell
  if (camera) {
    const camDist = new THREE.Vector2(camera.position.x, camera.position.z).length()
    const maxR = GALLERY_INTERIOR_RADIUS - 3
    if (camDist > maxR) {
      const scale = maxR / camDist
      camera.position.x *= scale
      camera.position.z *= scale
    }
    if (camera.position.y < 1.2) camera.position.y = 1.2
    if (camera.position.y > GALLERY_INTERIOR_RADIUS - 4) camera.position.y = GALLERY_INTERIOR_RADIUS - 4
  }

  if (renderer && scene && camera) renderer.render(scene, camera)
}

function onResize() {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// ── File cabinet hover/click ──────────────────────────────────────────────────

function onMouseMove(e: MouseEvent) {
  mouseNDC.x =  (e.clientX / window.innerWidth) * 2 - 1
  mouseNDC.y = -((e.clientY - 44) / (window.innerHeight - 44)) * 2 + 1
}

function onCanvasClick() {
  if (!camera || !raycaster || cabinetMeshes.length === 0) return
  raycaster.setFromCamera(mouseNDC, camera)
  if (raycaster.intersectObjects(cabinetMeshes, false).length) {
    fileCabinetOpen.value = true
  }
}

function goBack() {
  const parentQuery = isMoonView.value ? `?parent=${encodeURIComponent(parentName.value)}` : ''
  void router.push(`/surface/${encodeURIComponent(hostname.value)}/${encodeURIComponent(planetName.value)}${parentQuery}`)
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

const keydownFn = (e: KeyboardEvent) => {
  keysDown.add(e.code)
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
}
const keyupFn = (e: KeyboardEvent) => keysDown.delete(e.code)

onMounted(() => {
  window.addEventListener('keydown', keydownFn)
  window.addEventListener('keyup',   keyupFn)
  buildScene()
  if (member.isSignedIn) void fileCabinet.loadMyFileCabinet()
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
  cabinetMeshes = []
})
</script>

<style scoped>
.gi-page   { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #0a0602; }
.gi-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

.gi-topbar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px;
  background: linear-gradient(to bottom, rgba(10, 6, 2, 0.85), transparent);
}
.gi-topbar-center { display: flex; align-items: center; }
.gi-title    { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.14em; color: rgba(255, 200, 130, 0.85); }
.gi-hostname { font-family: 'Courier New', monospace; font-size: 10px; color: rgba(255, 180, 110, 0.55); }
.gi-exoloc   { font-family: 'Courier New', monospace; font-size: 9px; color: rgba(200, 150, 100, 0.45); }

.gi-loading { position: absolute; inset: 0; z-index: 20; background: rgba(10, 6, 2, 0.92); }

.gi-hud {
  position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); z-index: 10;
  background: rgba(10, 6, 2, 0.75); backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 170, 80, 0.18); border-radius: 8px;
  padding: 6px 10px;
}

.gi-hints {
  position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%); z-index: 10;
  background: rgba(10, 6, 2, 0.85); border: 1px solid rgba(255, 170, 80, 0.18); border-radius: 6px;
  font-size: 10.5px; color: rgba(220, 190, 150, 0.75);
}
.gi-hint-row { display: flex; align-items: center; padding: 3px 4px; white-space: nowrap; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
