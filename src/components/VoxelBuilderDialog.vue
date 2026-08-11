<template>
  <q-dialog :model-value="modelValue" @update:model-value="v => $emit('update:modelValue', v)" position="right">
    <q-card v-if="modelValue" class="vb-card">
      <q-card-section class="q-pb-xs">
        <div class="row items-center q-mb-xs">
          <q-icon name="view_in_ar" color="pink-4" size="18px" class="q-mr-sm" />
          <div class="text-subtitle2 text-blue-grey-1" style="letter-spacing:0.06em">DESIGN YOUR SCULPTURE</div>
        </div>
        <q-separator color="blue-grey-8" />
      </q-card-section>

      <q-card-section>
        <div class="vb-layout">
          <canvas ref="previewCanvasEl" class="vb-preview" />

          <div class="vb-editor">
            <div class="vb-layer-tabs">
              <button v-for="y in VOXEL_GRID_SIZE" :key="y"
                class="vb-layer-tab" :class="{ 'vb-layer-tab--active': activeLayer === y - 1 }"
                @click="activeLayer = y - 1">{{ y }}</button>
            </div>
            <div class="vb-grid" :style="gridStyle">
              <button v-for="cell in layerCells" :key="cell.idx"
                class="vb-cell" :class="{ 'vb-cell--filled': cells[cell.idx] > 0 }"
                :style="{ background: cellColor(cell.idx) }"
                @click="paint(cell.idx)" />
            </div>
          </div>
        </div>

        <div class="vb-palette">
          <button v-for="(hex, i) in palette" :key="hex + i"
            class="vb-swatch" :class="{ 'vb-swatch--active': activeColorIndex === i }"
            :style="{ background: hex }" @click="activeColorIndex = i" />
          <button v-if="palette.length < VOXEL_MAX_COLORS" class="vb-swatch vb-swatch--add"
            title="Add a colour" @click="colorInputEl?.click()">+</button>
          <input ref="colorInputEl" type="color" class="vb-hidden-input" @input="onAddColor" />
        </div>

        <div class="vb-toolbar">
          <q-btn flat dense size="sm" icon="clear_all" label="Clear" color="blue-grey-5" @click="clearAll" />
        </div>

        <div class="vb-selfhost-note">
          Want more room to create — real artwork, unconstrained designs?
          <router-link to="/docs#new-user" @click="$emit('update:modelValue', false)">Run your own Exotopia instance.</router-link>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="blue-grey-5" @click="$emit('update:modelValue', false)" />
        <q-btn unelevated label="Save" color="cyan-8" @click="doSave" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import * as THREE from 'three'
import {
  VOXEL_GRID_SIZE, VOXEL_MAX_COLORS,
  buildVoxelInstancedMesh, starterLightColorHex,
  type VoxelPayload,
} from 'src/lib/settlement-items'
import { disposeScene } from 'src/lib/three-utils'

const props = defineProps<{
  modelValue:    boolean
  initial?:      VoxelPayload
  settlementKey: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: VoxelPayload]
}>()

const SIZE = VOXEL_GRID_SIZE

function defaultPalette(): string[] {
  return [starterLightColorHex(props.settlementKey), '#ff6688', '#44bb44', '#ffcc44']
}

const palette          = ref<string[]>(defaultPalette())
const cells             = ref<number[]>(new Array(SIZE ** 3).fill(0))
const activeColorIndex  = ref(0)
const activeLayer       = ref(Math.floor(SIZE / 2))
const colorInputEl      = ref<HTMLInputElement | null>(null)

function resetState() {
  if (props.initial && props.initial.size === SIZE) {
    palette.value = [...props.initial.palette]
    cells.value   = [...props.initial.cells]
  } else {
    palette.value = defaultPalette()
    cells.value   = new Array(SIZE ** 3).fill(0)
  }
  activeColorIndex.value = 0
  activeLayer.value      = Math.floor(SIZE / 2)
}

// Cells for the active Y layer, in (row=z, col=x) order matching buildVoxelInstancedMesh's decode.
const layerCells = computed(() => {
  const y = activeLayer.value
  const out: { idx: number }[] = []
  for (let z = 0; z < SIZE; z++) {
    for (let x = 0; x < SIZE; x++) {
      out.push({ idx: x + y * SIZE + z * SIZE * SIZE })
    }
  }
  return out
})

const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }))

function cellColor(idx: number): string {
  const v = cells.value[idx] ?? 0
  return v > 0 ? (palette.value[v - 1] ?? 'transparent') : 'transparent'
}

function paint(idx: number) {
  const target = activeColorIndex.value + 1
  cells.value = cells.value.map((v, i) => i === idx ? (v === target ? 0 : target) : v)
}

function clearAll() {
  cells.value = cells.value.map(() => 0)
}

function onAddColor(e: Event) {
  const hex = (e.target as HTMLInputElement).value
  if (!hex || palette.value.length >= VOXEL_MAX_COLORS) return
  palette.value = [...palette.value, hex]
  activeColorIndex.value = palette.value.length - 1
}

const currentPayload = computed<VoxelPayload>(() => ({
  size: SIZE, palette: [...palette.value], cells: [...cells.value],
}))

function doSave() {
  emit('save', currentPayload.value)
  emit('update:modelValue', false)
}

// ── Live 3D preview — mirrors SettlementProfilePage.vue's rotating-scene pattern ──

const previewCanvasEl = ref<HTMLCanvasElement | null>(null)
let renderer: THREE.WebGLRenderer | null = null
let scene:    THREE.Scene             | null = null
let camera:   THREE.PerspectiveCamera | null = null
let group:    THREE.Object3D          | null = null
let rafId:    number | null = null

function rebuildPreviewMesh() {
  if (!scene) return
  if (group) { scene.remove(group); disposeScene(group) }
  group = buildVoxelInstancedMesh(currentPayload.value)
  scene.add(group)
}

function tick() {
  rafId = requestAnimationFrame(tick)
  if (!renderer || !scene || !camera) return
  scene.rotation.y += 0.012
  renderer.render(scene, camera)
}

function initPreview() {
  if (!previewCanvasEl.value) return
  renderer = new THREE.WebGLRenderer({ canvas: previewCanvasEl.value, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(previewCanvasEl.value.clientWidth, 190, false)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, previewCanvasEl.value.clientWidth / 190, 0.1, 100)
  camera.position.set(0, 2.4, 8)
  camera.lookAt(0, 0, 0)
  scene.add(new THREE.AmbientLight(0x445566, 1.6))
  const key = new THREE.DirectionalLight(0xffffff, 0.9)
  key.position.set(4, 6, 5)
  scene.add(key)

  rebuildPreviewMesh()
  tick()
}

function disposePreview() {
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null
  if (group && scene) { scene.remove(group); disposeScene(group) }
  group = null
  renderer?.dispose()
  renderer = null; scene = null; camera = null
}

watch(() => props.modelValue, async (open) => {
  if (open) {
    resetState()
    await nextTick()
    initPreview()
  } else {
    disposePreview()
  }
})

watch(currentPayload, () => rebuildPreviewMesh())

onBeforeUnmount(() => disposePreview())
</script>

<style scoped>
.vb-card {
  width: 340px;
  background: rgba(1, 5, 20, 0.98);
  border: 1px solid rgba(0, 140, 200, 0.20);
}

.vb-layout { display: flex; flex-direction: column; gap: 10px; }
.vb-preview { display: block; width: 100%; height: 190px; border-radius: 4px; background: rgba(0, 8, 20, 0.6); }

.vb-editor { display: flex; flex-direction: column; gap: 6px; }
.vb-layer-tabs { display: flex; gap: 3px; }
.vb-layer-tab {
  flex: 1; font-size: 9px; padding: 4px 0; border-radius: 3px; cursor: pointer;
  background: rgba(0, 20, 45, 0.7); border: 1px solid rgba(0, 90, 140, 0.25);
  color: rgba(100, 160, 200, 0.65);
}
.vb-layer-tab:hover { color: rgba(180, 220, 240, 0.9); }
.vb-layer-tab--active { background: rgba(0, 90, 140, 0.45); color: #00ccee; border-color: rgba(0, 150, 200, 0.5); }

.vb-grid { display: grid; gap: 3px; }
.vb-cell {
  aspect-ratio: 1; border-radius: 2px; cursor: pointer; padding: 0;
  background-color: transparent;
  background-image:
    linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
  border: 1px solid rgba(0, 90, 140, 0.25);
}
.vb-cell--filled { border-color: rgba(255, 255, 255, 0.25); }
.vb-cell:hover { border-color: rgba(0, 180, 220, 0.6); }

.vb-palette { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.vb-swatch {
  width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.15);
}
.vb-swatch--active { border-color: #00ccee; }
.vb-swatch--add {
  background: rgba(0, 20, 45, 0.7) !important; color: rgba(120, 170, 200, 0.8);
  border-style: dashed; font-size: 13px; line-height: 1;
}
.vb-hidden-input { position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none; }

.vb-toolbar { margin-top: 8px; }

.vb-selfhost-note {
  margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(0, 70, 110, 0.25);
  font-size: 9.5px; line-height: 1.5; color: rgba(100, 150, 180, 0.65);
}
.vb-selfhost-note a { color: #4488cc; text-decoration: none; }
.vb-selfhost-note a:hover { color: #66aaee; }
</style>
