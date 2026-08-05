<template>
  <q-page class="spp-page">

    <div v-if="loading" class="spp-status">
      <q-spinner-orbit color="cyan-7" size="40px" />
      <div class="text-caption text-blue-grey-5 q-mt-sm">Loading settlement…</div>
    </div>

    <div v-else-if="!profile" class="spp-status">
      <div class="spp-notfound-title">Settlement not found</div>
      <p class="spp-notfound-sub">
        This page doesn't exist, or its owner hasn't published it (or has archived it).
      </p>
      <router-link to="/" class="spp-back-link">← Exotopia</router-link>
    </div>

    <div v-else class="spp-wrap">
      <router-link to="/" class="spp-back-link">← Exotopia</router-link>

      <div class="spp-header">
        <div class="spp-focus-badge">{{ focusLabel(profile.focus) || profile.focus }}</div>
        <h1 class="spp-title">{{ profile.display_name }}</h1>
        <div class="spp-address">{{ profile.exolocation }}</div>
        <p v-if="profile.description" class="spp-desc">{{ profile.description }}</p>
      </div>

      <div v-if="profile.technology_keys.length" class="spp-tech-section">
        <div class="spp-section-label">FEATURED TECHNOLOGIES · click one for details</div>
        <canvas ref="canvasEl" class="spp-canvas" @click="onCanvasClick" />

        <Transition name="spp-fade">
          <div v-if="selectedMethod" class="spp-method-panel">
            <div class="spp-method-name">{{ selectedMethod.name }}</div>
            <div class="spp-method-meta">
              {{ selectedMethod.media }} · {{ selectedMethod.maturity }}
            </div>
            <p class="spp-method-p"><strong>Mechanism —</strong> {{ selectedMethod.mechanism }}</p>
            <p class="spp-method-p"><strong>Chain length —</strong> {{ selectedMethod.chainLengthNote }}</p>
            <p class="spp-method-p"><strong>Cost —</strong> {{ selectedMethod.costNote }}</p>
            <p class="spp-method-p"><strong>Limitations —</strong> {{ selectedMethod.limitations }}</p>
            <div class="spp-citations">
              <span v-for="c in selectedMethod.citations" :key="c.title" class="spp-citation">
                {{ c.title }} — {{ c.org }}
              </span>
            </div>
          </div>
        </Transition>
      </div>

      <div class="spp-repo-links">
        <a :href="REPO_URL" target="_blank" rel="noopener">View source on GitHub</a>
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import * as THREE from 'three'
import { useSettlementProfilesStore, type SettlementProfile } from 'src/stores/settlement-profiles'
import { focusLabel } from 'src/data/settlement-focus-options'
import { REMEDIATION_METHODS, type RemediationMethod } from 'src/data/pfas-methods-library'
import { buildItemMesh, enhanceTechnologyMesh } from 'src/lib/settlement-items'
import { disposeScene } from 'src/lib/three-utils'

const REPO_URL = 'https://github.com/biomassives/vercel-html-exotopia.org'

const route = useRoute()
const store = useSettlementProfilesStore()

const loading = ref(true)
const profile = ref<SettlementProfile | null>(null)
const selectedMethod = ref<RemediationMethod | null>(null)
const canvasEl = ref<HTMLCanvasElement>()

let renderer: THREE.WebGLRenderer | null = null
let scene:    THREE.Scene             | null = null
let camera:   THREE.PerspectiveCamera | null = null
let raycaster: THREE.Raycaster | null = null
let rafId: number | null = null
const meshEntries: { group: THREE.Group; methodKey: string }[] = []

function buildTechScene() {
  if (!canvasEl.value || !profile.value) return
  const keys = profile.value.technology_keys
  if (!keys.length) return

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(canvasEl.value.clientWidth, 260, false)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(50, canvasEl.value.clientWidth / 260, 0.1, 200)
  camera.position.set(0, 3, 10 + keys.length * 1.2)
  camera.lookAt(0, 1.5, 0)

  scene.add(new THREE.AmbientLight(0x223344, 1.4))
  const key = new THREE.DirectionalLight(0xffffff, 0.8)
  key.position.set(4, 8, 6)
  scene.add(key)

  const spacing = 4.2
  const startX  = -((keys.length - 1) * spacing) / 2

  keys.forEach((methodKey, i) => {
    const method = REMEDIATION_METHODS.find(m => m.key === methodKey)
    const color  = method?.media === 'soil' ? '#996633' : method?.media === 'both' ? '#55aa88' : '#2288cc'
    const group  = buildItemMesh(methodKey, color, false)
    group.position.x = startX + i * spacing
    group.userData.methodKey = methodKey
    scene!.add(group)
    meshEntries.push({ group, methodKey })
    void enhanceTechnologyMesh(group, methodKey)
  })

  raycaster = new THREE.Raycaster()
  window.addEventListener('resize', onResize)
  tick()
}

function tick() {
  rafId = requestAnimationFrame(tick)
  if (!renderer || !scene || !camera) return
  scene.rotation.y += 0.0018
  renderer.render(scene, camera)
}

function onResize() {
  if (!renderer || !camera || !canvasEl.value) return
  const w = canvasEl.value.clientWidth
  camera.aspect = w / 260
  camera.updateProjectionMatrix()
  renderer.setSize(w, 260, false)
}

function onCanvasClick(e: MouseEvent) {
  if (!raycaster || !camera || !scene || !canvasEl.value) return
  const rect = canvasEl.value.getBoundingClientRect()
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  )
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects(scene.children, true)
  for (const hit of hits) {
    let obj: THREE.Object3D | null = hit.object
    while (obj && !obj.userData.methodKey) obj = obj.parent
    if (obj?.userData.methodKey) {
      selectedMethod.value = REMEDIATION_METHODS.find(m => m.key === obj!.userData.methodKey) ?? null
      return
    }
  }
}

onMounted(async () => {
  const slug = String(route.params.slug ?? '')
  profile.value = await store.getProfileBySlug(slug)
  loading.value = false
  await nextTick()
  buildTechScene()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (scene) disposeScene(scene)
  renderer?.dispose()
})
</script>

<style scoped>
.spp-page { background: #050912; min-height: 100vh; color: #c8d4e8; font-family: 'Roboto', sans-serif; }

.spp-status {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 24px;
}
.spp-notfound-title { font-size: 18px; color: #c8d4e8; margin-bottom: 8px; }
.spp-notfound-sub   { font-size: 13px; color: #7888aa; max-width: 420px; line-height: 1.6; margin-bottom: 20px; }

.spp-wrap { max-width: 760px; margin: 0 auto; padding: 28px 24px 80px; }

.spp-back-link { color: #4488cc; text-decoration: none; font-size: 13px; }
.spp-back-link:hover { color: #66aaee; }

.spp-header { margin: 24px 0 20px; }
.spp-focus-badge {
  display: inline-block; font-size: 10px; letter-spacing: 0.10em; text-transform: uppercase;
  color: #00e5ff; border: 1px solid rgba(0,229,255,0.35); border-radius: 4px;
  padding: 3px 8px; margin-bottom: 10px;
}
.spp-title   { font-size: 26px; margin: 0 0 6px; color: #e8f0ff; }
.spp-address { font-family: 'Courier New', monospace; font-size: 12px; color: #6688aa; margin-bottom: 14px; }
.spp-desc    { font-size: 14px; line-height: 1.7; color: #a8bcd8; }

.spp-tech-section { margin-top: 24px; }
.spp-section-label { font-size: 10px; letter-spacing: 0.12em; color: #5588aa; margin-bottom: 8px; }
.spp-canvas { display: block; width: 100%; height: 260px; cursor: pointer; }

.spp-method-panel {
  margin-top: 12px; background: rgba(0,20,36,0.7); border: 1px solid rgba(0,160,200,0.20);
  border-radius: 8px; padding: 16px;
}
.spp-method-name { font-size: 15px; color: #e8f0ff; margin-bottom: 2px; }
.spp-method-meta { font-size: 10px; letter-spacing: 0.08em; color: #5588aa; text-transform: uppercase; margin-bottom: 10px; }
.spp-method-p    { font-size: 12.5px; line-height: 1.65; color: #a8bcd8; margin: 0 0 8px; }
.spp-method-p strong { color: #7ec8e8; }
.spp-citations { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.spp-citation  { font-size: 10.5px; color: #6688aa; }

.spp-fade-enter-active, .spp-fade-leave-active { transition: opacity 0.18s; }
.spp-fade-enter-from, .spp-fade-leave-to { opacity: 0; }

.spp-repo-links { margin-top: 32px; font-size: 11px; }
.spp-repo-links a { color: #4488cc; text-decoration: none; }
</style>
