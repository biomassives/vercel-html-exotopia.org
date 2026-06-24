<template>
  <q-page class="bg-black" style="height:100vh;overflow:hidden" @click="onCanvasClick" @dblclick="onCanvasDblClick">

    <!-- ── Slow-connection fallback — skip Three.js entirely on 2G ────── -->
    <div v-if="isSlowConnection" class="low-bw-fallback">
      <div class="lbw-icon">◈</div>
      <div class="lbw-title">EXOTOPIA</div>
      <div class="lbw-sub">Cosmic visualization loading is paused on this connection.<br>
        Select a view below or wait for a stronger signal.</div>
      <div class="lbw-btns">
        <q-btn unelevated color="cyan-9" icon="scatter_plot" label="Milky Way" @click="$router.push('/galaxy')" />
        <q-btn outline color="blue-grey-5" icon="mdi-web" label="Cosmic" @click="$router.push('/cosmic')" class="q-ml-sm" />
      </div>
      <div class="lbw-note">{{ lbwNote }}</div>
    </div>

    <!-- ── Cluster label overlay — clickable, navigate to cosmic view ── -->
    <div class="labels-layer">
      <div
        v-for="lbl in clusterLabels"
        :key="lbl.name"
        v-show="lbl.visible"
        class="cluster-label cluster-label--clickable"
        :style="{
          left:    lbl.x + 'px',
          top:     lbl.y + 'px',
          opacity: lbl.opacity,
          '--sc-color': lbl.scColor,
        }"
        role="button"
        :aria-label="`Navigate to ${lbl.name}`"
        tabindex="0"
        @click.stop="goToCluster(lbl.name)"
        @keyup.enter="goToCluster(lbl.name)"
      >
        <div class="cl-name">{{ lbl.name }}</div>
        <div v-if="lbl.supercluster" class="cl-super">{{ lbl.supercluster }}</div>
        <div class="cl-dist">{{ lbl.distMpc }} Mpc</div>
        <div class="cl-enter">→ enter field</div>
        <div class="cl-tick" />
      </div>
    </div>

    <!-- ── Cosmic time epoch indicator (visible when scrubbing) ──────── -->
    <Transition name="epoch-fade">
      <div v-if="cosmicTimeMyr !== 0" class="epoch-indicator">
        <div class="ei-label">VIEWING EPOCH</div>
        <div class="ei-value">{{ cosmicTimeDisplay }}</div>
        <div class="ei-sn">{{ activeSnCount }} supernovae active</div>
      </div>
    </Transition>

    <!-- ── Quick-nav (below header) ────────────────────────────────────── -->
    <div class="top-nav">
      <q-btn flat dense size="xs" color="blue-grey-5" icon="scatter_plot"        label="Milky Way"  @click="$router.push('/galaxy')" />
      <q-btn flat dense size="xs" color="blue-grey-5" icon="mdi-web"             label="Cosmic"  @click="$router.push('/cosmic')" />
      <q-btn flat dense size="xs" color="cyan-7"      icon="mdi-hexagon-outline" label="Transit" @click="transitOpen = true" />
    </div>

    <!-- ── "New here?" Get Started button ────────────────────────────── -->
    <div class="ob-entry-btn-wrap">
      <q-btn
        unelevated rounded
        color="cyan-9"
        icon="mdi-rocket-launch"
        label="New here? Get Started"
        @click="$router.push('/onboard')"
        class="ob-entry-btn"
      />
    </div>

    <!-- ── Settlement mini panel (bottom-right, collapsible) ───────── -->
    <div class="settlement-panel" :class="{ 'sp--open': panelOpen }">
      <div class="sp-header" @click="panelOpen = !panelOpen">
        <span class="sp-icon">⬡</span>
        <span class="sp-title">SETTLEMENTS</span>
        <span v-if="!panelOpen && galaxyStore.isLoaded" class="sp-total">
          · {{ galaxyStore.planets.length.toLocaleString() }}
        </span>
        <span class="sp-toggle">{{ panelOpen ? '▼' : '▲' }}</span>
      </div>

      <Transition name="sp-expand">
        <div v-if="panelOpen" class="sp-body">
          <div class="sp-tabs">
            <button
              v-for="tab in TABS" :key="tab.key"
              :class="['sp-tab', { 'sp-tab--active': activeTab === tab.key }]"
              @click.stop="activeTab = tab.key"
            >{{ tab.label }}</button>
          </div>

          <div v-if="!galaxyStore.isLoaded" class="sp-loading">
            <q-spinner-dots color="cyan-8" size="18px" />
            <span class="q-ml-sm text-blue-grey-6" style="font-size:9px">Loading catalog…</span>
          </div>

          <div v-else class="sp-list">
            <div
              v-for="(p, i) in tabData" :key="p.pl_name"
              class="sp-row"
              @click.stop="goToSettlement(p)"
            >
              <span v-if="activeTab === 'leaders'" class="sp-rank">#{{ i + 1 }}</span>
              <span class="sp-dot" :style="{ background: activityColor(p) }" />
              <div class="sp-info">
                <div class="sp-name">{{ p.pl_name }}</div>
                <div class="sp-meta">
                  {{ p.hostname }}
                  <span class="sp-sep">·</span>
                  {{ p.sy_dist?.toFixed(0) ?? '?' }} pc
                  <span v-if="p.pl_eqt" class="sp-sep">·</span>
                  <span v-if="p.pl_eqt" :class="tempClass(p.pl_eqt)">{{ p.pl_eqt.toFixed(0) }} K</span>
                </div>
                <div v-if="activeTab === 'updated'" class="sp-badge-row">
                  <span class="sp-badge" :style="{ borderColor: ecoOpsColor(p) }">{{ ecoOpsLabel(p) }}</span>
                </div>
                <div v-if="activeTab === 'leaders'" class="sp-score-row">
                  <div class="sp-score-bar"><div class="sp-score-fill" :style="{ width: leaderScore(p) + '%' }" /></div>
                  <span class="sp-score-val">{{ leaderScore(p).toFixed(0) }}</span>
                </div>
              </div>
              <q-btn flat dense size="xs" color="cyan-7" icon="mdi-arrow-right" class="sp-enter-btn" @click.stop="goToSettlement(p)" />
            </div>
          </div>

          <div class="sp-footer">
            <div class="sp-your-wrap">
              <div class="sp-your-label">YOUR SETTLEMENT</div>
              <div class="sp-your-name">{{ mySettlement?.pl_name ?? '—' }}</div>
              <div class="sp-your-meta">{{ mySettlement?.hostname ?? '' }}</div>
            </div>
            <div class="sp-footer-btns">
              <q-btn flat dense size="xs" color="cyan-6"  icon="mdi-home-circle-outline" label="Enter"   @click.stop="enterMySettlement" />
              <q-btn flat dense size="xs" color="amber-6" icon="mdi-hexagon-outline"      label="Transit" @click.stop="transitOpen = true" />
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ── Wormhole transit dialog ───────────────────────────────────── -->
    <q-dialog v-model="transitOpen" position="bottom">
      <q-card class="transit-card q-pa-md" style="min-width:340px;max-width:520px">
        <div class="row items-center q-mb-sm">
          <q-icon name="mdi-hexagon-outline" color="cyan-4" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-blue-grey-1" style="letter-spacing:0.05em">E8 Wormhole Conduit</div>
        </div>
        <div class="text-caption text-cyan-6 q-mb-sm" style="letter-spacing:0.09em">NEAREST HABITABLE DESTINATIONS</div>
        <div v-for="dest in transitDests" :key="dest.route"
          class="dest-row row items-center justify-between q-px-sm q-py-xs q-mb-xs">
          <div>
            <div class="text-body2 text-blue-grey-1">{{ dest.label }}</div>
            <div class="text-caption text-blue-grey-5">{{ dest.dist }} pc · {{ dest.spec }} · {{ dest.eqt }}</div>
          </div>
          <q-btn dense rounded unelevated size="sm" color="cyan-8" icon="mdi-hexagon-outline" label="Warp" @click="initiateTransit(dest)" />
        </div>
        <q-separator color="blue-grey-8" class="q-my-sm" />
        <div class="row justify-between items-center">
          <q-btn flat dense size="sm" color="blue-grey-5" label="Cancel" @click="transitOpen = false" />
          <q-btn flat dense size="sm" color="blue-grey-5" icon="mdi-web" label="Cosmic view" @click="$router.push('/cosmic')" />
        </div>
      </q-card>
    </q-dialog>

    <!-- ── DefenderNav — cosmic mode with time scrubber ─────────────── -->
    <DefenderNav
      ref="defenderNav"
      mode="cosmic"
      sceneLabel="Cosmic Web"
      @flyTo="onDefenderFlyTo"
      @portalTo="() => {}"
      @timeScaleChange="t => { cosmicTimeMyr = t }"
      @viewModeChange="m => { viewMode = m }"
      @eventFinderOpen="() => {}"
    />

    <!-- ── Welcome overlay — role-aware entry panel ───────────────────── -->
    <WelcomeOverlay ref="welcomeOverlay" />

  </q-page>
</template>

<script setup lang="ts">
/**
 * CosmosPage.vue — Unified cosmic entry point
 *
 * Void peripheries: IcosahedronGeometry polygon edges + Fresnel sphere membrane
 * Galaxy clusters:  elegantly labelled (projected DOM overlay)
 * Supernovae:       time-aware catalog — scrub DefenderNav time slider to reveal
 *                   SNe from across 13.8 Gyr of cosmic history
 */

import { ref, computed, shallowRef, onMounted, onUnmounted } from 'vue'
import { useRouter }     from 'vue-router'
import * as THREE        from 'three'
import gsap              from 'gsap'
import { useVizRenderer } from 'src/composables/useVizRenderer'
import { useGalaxyStore } from 'src/stores/galaxy'
import { usePortalStore } from 'src/stores/portal'
import type { Planet }   from 'src/stores/galaxy'
import { enforceSessionHorizon, detectBandwidthTier } from 'src/lib/security'
import DefenderNav       from 'src/components/DefenderNav.vue'
import WelcomeOverlay    from 'src/components/WelcomeOverlay.vue'
import type {
  DefenderNavData, CosmicStripEntry,
  DefenderTarget,
} from 'src/lib/defender-nav.types'
import {
  CLUSTERS, VOIDS,
  clusterScenePos, voidScenePos, voidSceneRadius,
  superclusters as lookupSupercluster,
} from 'src/data/cosmic-structures'
import { VOID_VERT, VOID_FRAG } from 'src/lib/void-shader'

// ── Stores / router ───────────────────────────────────────────────────────────

const router      = useRouter()
const galaxyStore = useGalaxyStore()
const portalStore = usePortalStore()

// ── Three.js shared renderer ──────────────────────────────────────────────────

const viz             = useVizRenderer()
const defenderNav     = ref<InstanceType<typeof DefenderNav> | null>(null)
const welcomeOverlay  = ref<InstanceType<typeof WelcomeOverlay> | null>(null)

// ── Bandwidth detection ───────────────────────────────────────────────────────
// On slow-2g / 2g connections the Three.js cosmic scene is skipped entirely.
// Users get a minimal navigation UI instead. The scene is never parsed or compiled.
const isSlowConnection = ref(false)
const lbwNote          = ref('')

// ── Cosmic view control state ─────────────────────────────────────────────────

type ViewMode = 'natural' | 'xray' | 'dark_matter'
const viewMode       = ref<ViewMode>('natural')
let   cosmicTimeMyr  = 0   // mutable, not reactive — updated via DefenderNav event

const cosmicTimeDisplay = computed(() => {
  if (cosmicTimeMyr === 0) return 'NOW'
  const abs = Math.abs(cosmicTimeMyr)
  return abs >= 1000 ? `${(abs / 1000).toFixed(1)} Gyr ago` : `${abs} Myr ago`
})

// ── Cluster label overlay ─────────────────────────────────────────────────────

interface ClusterLabelState {
  name:        string
  supercluster: string
  scColor:     string
  distMpc:     number
  x:           number
  y:           number
  visible:     boolean
  opacity:     number
}

const clusterLabels = shallowRef<ClusterLabelState[]>([])
const _projVec      = new THREE.Vector3()
let lastLabelMs     = 0

// ── Settlement panel state ────────────────────────────────────────────────────

const transitOpen  = ref(false)
const panelOpen    = ref(false)
const mySettlement = ref<Planet | null>(null)

type TabKey = 'recent' | 'updated' | 'leaders'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'recent',  label: 'RECENT'  },
  { key: 'updated', label: 'UPDATED' },
  { key: 'leaders', label: 'LEADERS' },
]

const activeTab = ref<TabKey>('recent')

// ── Helpers ───────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ── Settlement tab data ───────────────────────────────────────────────────────

const recentSettlements = computed<Planet[]>(() => {
  if (!galaxyStore.isLoaded) return []
  const rng = mulberry32(Math.floor(Date.now() / 3_600_000) * 0x9e3779b9)
  return [...galaxyStore.planets.filter(p => p.sy_dist && p.pl_eqt)].sort(() => rng() - 0.5).slice(0, 6)
})

const updatedSettlements = computed<Planet[]>(() => {
  if (!galaxyStore.isLoaded) return []
  return galaxyStore.planets
    .filter(p => p.pl_eqt && p.pl_eqt >= 170 && p.pl_eqt <= 430 && p.sy_dist)
    .sort((a, b) => Math.abs((a.pl_eqt ?? 0) - 288) - Math.abs((b.pl_eqt ?? 0) - 288))
    .slice(0, 6)
})

function rawScore(p: Planet): number {
  return 1000 / ((p.sy_dist ?? 9999) + 1)
    + Math.max(0, 1 - Math.abs((p.pl_eqt ?? 9999) - 288) / 400) * 60
    + Math.max(0, 1 - Math.abs((p.st_teff ?? 9999) - 5778) / 8000) * 20
}

const leaderboardSettlements = computed<Planet[]>(() => {
  if (!galaxyStore.isLoaded) return []
  return [...galaxyStore.planets.filter(p => p.sy_dist && p.pl_eqt)].sort((a, b) => rawScore(b) - rawScore(a)).slice(0, 6)
})

function leaderScore(p: Planet): number {
  const top = leaderboardSettlements.value[0]
  if (!top) return 0
  return Math.max(4, (rawScore(p) / (rawScore(top) || 1)) * 100)
}

const tabData = computed<Planet[]>(() => {
  if (activeTab.value === 'recent')  return recentSettlements.value
  if (activeTab.value === 'updated') return updatedSettlements.value
  return leaderboardSettlements.value
})

function tempClass(eqt: number): string {
  if (eqt < 150) return 'text-blue-3'
  if (eqt < 250) return 'text-teal-4'
  if (eqt < 380) return 'text-green-5'
  if (eqt < 600) return 'text-amber-5'
  if (eqt < 900) return 'text-orange-6'
  return 'text-red-6'
}

function activityColor(p: Planet): string {
  const h = p.hostname.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 3
  return h === 0 ? '#00dd88' : h === 1 ? '#f0aa30' : '#4488aa'
}

const ECO_OPS_TYPES = ['wqMap', 'farmMap', 'garbageMap', 'productMap', 'cleaningMap']
function ecoOpsLabel(p: Planet): string {
  return ECO_OPS_TYPES[p.hostname.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % ECO_OPS_TYPES.length]!
}
function ecoOpsColor(p: Planet): string {
  const m: Record<string, string> = { wqMap: '#00ccff', farmMap: '#44dd88', garbageMap: '#ffaa44', productMap: '#aa88ff', cleaningMap: '#ff88aa' }
  return m[ecoOpsLabel(p)] ?? '#668899'
}

// ── Navigation ────────────────────────────────────────────────────────────────

function goToSettlement(p: Planet) {
  router.push(`/surface/${encodeURIComponent(p.hostname)}/${encodeURIComponent(p.pl_name)}`)
}
function enterMySettlement() { if (mySettlement.value) goToSettlement(mySettlement.value) }

interface TransitDest { label: string; route: string; dist: string; spec: string; eqt: string }

const transitDests = computed<TransitDest[]>(() => {
  if (!galaxyStore.isLoaded) return []
  return galaxyStore.planets
    .filter(p => p.sy_dist && p.pl_eqt && p.pl_eqt > 160 && p.pl_eqt < 500)
    .sort((a, b) => (a.sy_dist ?? 9999) - (b.sy_dist ?? 9999))
    .slice(0, 5)
    .map(p => ({
      label: p.hostname,
      route: `/surface/${encodeURIComponent(p.hostname)}/${encodeURIComponent(p.pl_name)}`,
      dist:  p.sy_dist?.toFixed(0) ?? '?',
      spec:  p.st_spectype?.slice(0, 2) ?? '—',
      eqt:   p.pl_eqt ? `${p.pl_eqt.toFixed(0)} K` : '? K',
    }))
})

function initiateTransit(dest: TransitDest) {
  transitOpen.value = false
  portalStore.openPortal({ label: dest.label, route: dest.route })
}

/** Navigate to cosmic view centred on a named cluster, or galaxy view for the MW */
function goToCluster(name: string) {
  if (name === 'milky-way') { router.push('/galaxy'); return }
  router.push({ path: '/cosmic', query: { focus: name } })
}

function onCanvasClick(e: MouseEvent) {
  // A click on the 3D scene dismisses the welcome overlay
  welcomeOverlay.value?.dismiss()

  if (panelOpen.value) { panelOpen.value = false; return }
  if (!camera) return

  // Raycast the cosmos scene for cluster sphere hits
  const ndcX =  (e.clientX / window.innerWidth)  * 2 - 1
  const ndcY = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera)

  const hits = raycaster.intersectObjects(hitMeshes, false)
  if (hits.length) {
    const name = hits[0].object.userData.clusterName as string | undefined
    if (name) { goToCluster(name); return }
  }
}

function onDefenderFlyTo(target: DefenderTarget) {
  if (target.type === 'cluster') router.push('/cosmic')
}

// Double-click: navigate into hovered cluster, or zoom camera toward cursor.
function onCanvasDblClick(e: MouseEvent) {
  if (!camera) return
  const ndcX =  (e.clientX / window.innerWidth)  * 2 - 1
  const ndcY = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera)

  const hits = raycaster.intersectObjects(hitMeshes, false)
  if (hits.length) {
    const name = hits[0].object.userData.clusterName as string | undefined
    if (name) { goToCluster(name); return }
  }

  // No specific cluster hit — zoom camera 30% forward toward cursor direction
  const forward = new THREE.Vector3(ndcX * 0.5, ndcY * 0.5, 0.5)
    .unproject(camera).sub(camera.position).normalize()
  const step = camera.position.length() * 0.30
  const newPos = camera.position.clone().add(forward.multiplyScalar(step))
  gsap.to(camera.position, { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.3, ease: 'power2.out' })
}

// VOID_VERT / VOID_FRAG imported from src/lib/void-shader.ts

// ── Black hole catalog ────────────────────────────────────────────────────────

interface BHEntry {
  pos: [number,number,number]; diskInner: number; diskOuter: number
  diskColor: number; jetColor: number; jetLen: number
}
const BH_LIST: BHEntry[] = [
  { pos: [ 2.5, -0.3, -1.6], diskInner: 0.10, diskOuter: 0.32, diskColor: 0xff9933, jetColor: 0x44aaff, jetLen: 0.85 },
  { pos: [ 5.4, -0.7, -3.2], diskInner: 0.07, diskOuter: 0.20, diskColor: 0xffbb44, jetColor: 0x66ddff, jetLen: 0.55 },
  { pos: [-1.4,  0.5,  1.6], diskInner: 0.04, diskOuter: 0.12, diskColor: 0xff6622, jetColor: 0x99ccff, jetLen: 0.28 },
]
const BH_CLUSTER_POS = new THREE.Vector3(-4.2, 0.4, -2.8)

// ── Quasar catalog ────────────────────────────────────────────────────────────

interface QuasarEntry {
  pos: [number,number,number]; color: number; jetLen: number; jetDir: [number,number,number]
}
const QUASAR_LIST: QuasarEntry[] = [
  { pos: [-10,  2.8, -12], color: 0x44ccff, jetLen: 6.0, jetDir: [ 0.45, 0.85, 0.28] },
  { pos: [ 13, -1.2,  -9], color: 0x77bbff, jetLen: 4.5, jetDir: [  0.0,  1.0, 0.15] },
]

// ── Supernova catalog — time-aware ────────────────────────────────────────────
// epochMyr: when the SN occurred (negative = Myr ago; 0 = right now)
// lifespanMyr: how long the remnant is visible after the explosion
// Visible when: epochMyr <= cosmicTimeMyr <= epochMyr + lifespanMyr

interface SNovaEntry {
  pos:         [number,number,number]
  r:           number
  age:         'young' | 'medium' | 'old'
  shellCol:    number
  coreCol:     number
  epochMyr:    number
  lifespanMyr: number
}

const SNOVA_LIST: SNovaEntry[] = [
  // ── CONTEMPORARY — visible at T = 0 (NOW) ──────────────────────────────────
  { pos: [ 1.1, -0.9,  3.5], r: 0.20, age: 'young',  shellCol: 0x00eeff, coreCol: 0xff5522, epochMyr:    -0.5, lifespanMyr: 60  },
  { pos: [-0.7, -1.4, -4.8], r: 0.16, age: 'young',  shellCol: 0x00ffdd, coreCol: 0xff3311, epochMyr:    -5,   lifespanMyr: 80  },
  { pos: [ 5.6,  1.6, -2.8], r: 0.50, age: 'medium', shellCol: 0x22aadd, coreCol: 0xff8833, epochMyr:  -100,   lifespanMyr: 300 },
  { pos: [-4.0,  0.3,  4.5], r: 1.05, age: 'old',    shellCol: 0x224466, coreCol: 0x882211, epochMyr:  -800,   lifespanMyr: 900 },

  // ── ~1 Gyr ago ─────────────────────────────────────────────────────────────
  { pos: [ 8.2,  0.5, -7.1], r: 0.28, age: 'young',  shellCol: 0xff88aa, coreCol: 0xff2200, epochMyr: -1100,   lifespanMyr: 90  },
  { pos: [-6.5,  1.2,  6.8], r: 0.52, age: 'medium', shellCol: 0x88ddff, coreCol: 0xff5500, epochMyr:  -950,   lifespanMyr: 250 },
  { pos: [ 3.5, -2.0, -9.5], r: 0.35, age: 'young',  shellCol: 0xffaa88, coreCol: 0xff3300, epochMyr: -1350,   lifespanMyr: 110 },

  // ── ~3–5 Gyr ago ───────────────────────────────────────────────────────────
  { pos: [-10.0, 0.8, -3.2], r: 0.70, age: 'medium', shellCol: 0xaaffdd, coreCol: 0xcc4400, epochMyr: -2800,   lifespanMyr: 300 },
  { pos: [ 11.5,-1.5,  5.0], r: 0.42, age: 'medium', shellCol: 0x66aaff, coreCol: 0xff6600, epochMyr: -3500,   lifespanMyr: 200 },
  { pos: [  3.5, 2.5,-12.5], r: 0.60, age: 'medium', shellCol: 0x99eeff, coreCol: 0xee3300, epochMyr: -4800,   lifespanMyr: 280 },

  // ── ~7–9 Gyr ago ───────────────────────────────────────────────────────────
  { pos: [ -8.5, 2.5,-12.0], r: 0.65, age: 'medium', shellCol: 0xffaa44, coreCol: 0xee2200, epochMyr: -7200,   lifespanMyr: 350 },
  { pos: [  5.5,-3.0, 12.0], r: 0.45, age: 'young',  shellCol: 0xffdd88, coreCol: 0xff4400, epochMyr: -6800,   lifespanMyr: 120 },
  { pos: [ -3.5, 3.5,-15.0], r: 1.10, age: 'old',    shellCol: 0x334455, coreCol: 0x661100, epochMyr: -9000,   lifespanMyr: 800 },

  // ── ~11–13 Gyr ago (early universe) ────────────────────────────────────────
  { pos: [ 15.0, 0.5, -8.0], r: 0.38, age: 'young',  shellCol: 0xffcc00, coreCol: 0xff2200, epochMyr:-12000,   lifespanMyr: 100 },
  { pos: [-12.0,-2.0,  9.0], r: 0.52, age: 'medium', shellCol: 0xffaa00, coreCol: 0xcc3300, epochMyr:-11500,   lifespanMyr: 280 },
  { pos: [ -5.0, 4.0,-18.0], r: 0.85, age: 'medium', shellCol: 0xff8800, coreCol: 0xaa2200, epochMyr:-13000,   lifespanMyr: 400 },
]

// How many SNe are active at the current time position
const activeSnCount = computed(() => {
  const T = cosmicTimeMyr
  return SNOVA_LIST.filter(sn => T >= sn.epochMyr && T <= sn.epochMyr + sn.lifespanMyr).length
})

// ── Three.js module-level state ───────────────────────────────────────────────

// pageGroup holds all CosmosPage scene objects — added to / removed from shared scene
const pageGroup = new THREE.Group()
let   stopTick: (() => void) | null = null

let renderer:  THREE.WebGLRenderer | null = null
let scene:     THREE.Scene          | null = null
let camera:    THREE.PerspectiveCamera | null = null
let controls:  ReturnType<typeof useVizRenderer>['controls'] = null
let raycaster  = new THREE.Raycaster()
let hitMeshes: THREE.Mesh[] = []   // invisible click targets for clusters

interface SNovaGroup { meshes: THREE.Object3D[]; epochMyr: number; lifespanMyr: number }

let accretionDisks: THREE.Mesh[]   = []
let quasarJets:     THREE.Mesh[]   = []
let novaShells:     { mesh: THREE.Mesh; phase: number }[] = []
let snovaGroups:    SNovaGroup[]   = []
type VoidUniforms = {
  uTime:       { value: number }
  uColor:      { value: THREE.Color }
  uColor2:     { value: THREE.Color }
  uPointer:    { value: THREE.Vector2 }
  uPointerStr: { value: number }
}
let voidUniforms: VoidUniforms[] = []

// ── Void pointer / interaction tracking ──────────────────────────────────────
const _voidPointerNDC  = new THREE.Vector2(0, 0)
let   _voidPointerStr  = 0      // current smoothed interaction strength
let   _voidLastMove    = 0      // timestamp of last pointer move (ms)
let voidEdgeMats:   { mat: THREE.LineBasicMaterial; phase: number }[] = []
let voidGlowMats:   { mat: THREE.LineBasicMaterial; phase: number }[] = []
let laniakeaObjs:   THREE.Object3D[] = []
let laniakeaFlowMat: THREE.LineBasicMaterial | undefined
let bhClusterOrbs:  { mesh: THREE.Mesh; angle: number; r: number; speed: number }[] = []

// ── Scene builders ────────────────────────────────────────────────────────────

function buildBackground() {
  const pos: number[] = [], col: number[] = []
  const rng = mulberry32(7777)
  for (let i = 0; i < 6000; i++) {
    const theta = rng() * Math.PI * 2
    const phi   = Math.acos(2 * rng() - 1)
    const r     = 90 + rng() * 60
    pos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi))
    const c = new THREE.Color().setHSL(rng(), 0.22, 0.10 + rng() * 0.25)
    col.push(c.r, c.g, c.b)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3))
  pageGroup.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.30, vertexColors: true, transparent: true, opacity: 0.50, depthWrite: false,
  })))
}

// Complementary colour pairs for void iridescence: [primary HSL, complement HSL]
// Each pair creates a shimmery shift between two hues as the surface moves
const VOID_PAIRS: [[number,number,number],[number,number,number]][] = [
  [[0.50, 0.98, 0.74], [0.84, 0.92, 0.70]],  // electric cyan  ↔  violet-rose
  [[0.62, 0.92, 0.68], [0.11, 0.96, 0.74]],  // deep indigo    ↔  amber-gold
  [[0.16, 0.95, 0.72], [0.56, 0.88, 0.70]],  // spring green   ↔  cornflower
  [[0.76, 0.85, 0.72], [0.26, 0.90, 0.74]],  // orchid violet  ↔  lime-chartreuse
  [[0.08, 0.96, 0.74], [0.58, 0.90, 0.70]],  // solar orange   ↔  azure
  [[0.44, 0.94, 0.74], [0.94, 0.90, 0.70]],  // aquamarine     ↔  crimson-rose
  [[0.70, 0.88, 0.70], [0.20, 0.92, 0.74]],  // blue-lavender  ↔  warm yellow
  [[0.30, 0.90, 0.72], [0.80, 0.88, 0.70]],  // sea-green      ↔  deep purple
]

function buildVoids() {
  const eligibleVoids = VOIDS.filter(v => voidSceneRadius(v) >= 0.3)

  for (let i = 0; i < eligibleVoids.length; i++) {
    const v   = eligibleVoids[i]!
    const pos = voidScenePos(v)
    const r   = voidSceneRadius(v)

    // Seeded non-uniform scale — makes each void a unique irregular polyhedron
    const seed = v.name.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)
    const rng  = mulberry32(seed)
    const sx   = 0.76 + rng() * 0.48
    const sy   = 0.62 + rng() * 0.56
    const sz   = 0.78 + rng() * 0.44

    const polyIdx = Math.floor(rng() * 3)
    let polyGeo: THREE.BufferGeometry
    if (polyIdx === 0) {
      polyGeo = new THREE.IcosahedronGeometry(r, r > 3 ? 1 : 0)
    } else if (polyIdx === 1) {
      polyGeo = new THREE.OctahedronGeometry(r, 0)
    } else {
      polyGeo = new THREE.DodecahedronGeometry(r, 0)
    }
    polyGeo.scale(sx, sy, sz)

    // Complementary colour pair for this void
    const [hslA, hslB] = VOID_PAIRS[i % VOID_PAIRS.length]!
    const colA = new THREE.Color().setHSL(...hslA)
    const colB = new THREE.Color().setHSL(...hslB)

    // Edge bright line (slightly lighter primary)
    const edgeColA = new THREE.Color().setHSL(hslA[0], hslA[1], Math.min(1, hslA[2] + 0.18))
    // Edge glow line (complement, additive)
    const edgeColB = new THREE.Color().setHSL(hslB[0], hslB[1], Math.min(1, hslB[2] + 0.12))

    // ── Translucent polygon faces (two passes, primary + complement) ──────────
    const faceA = new THREE.Mesh(polyGeo, new THREE.MeshBasicMaterial({
      color: colA, transparent: true, opacity: 0.016,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    }))
    faceA.position.copy(pos); pageGroup.add(faceA)

    const faceB = new THREE.Mesh(polyGeo, new THREE.MeshBasicMaterial({
      color: colB, transparent: true, opacity: 0.010,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    }))
    faceB.position.copy(pos); pageGroup.add(faceB)

    // ── Primary edge lines — solid glow structure ─────────────────────────────
    const edgeGeo = new THREE.EdgesGeometry(polyGeo, 8)
    const phase   = rng() * Math.PI * 2

    const edgeMat = new THREE.LineBasicMaterial({
      color: edgeColA, transparent: true, opacity: 0.06,
    })
    const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat)
    edgeMesh.position.copy(pos)
    pageGroup.add(edgeMesh)
    voidEdgeMats.push({ mat: edgeMat, phase })

    // ── Secondary glow edge — additive complement colour ─────────────────────
    const glowMat = new THREE.LineBasicMaterial({
      color: edgeColB, transparent: true, opacity: 0.03,
      blending: THREE.AdditiveBlending,
    })
    const glowMesh = new THREE.LineSegments(edgeGeo, glowMat)
    glowMesh.position.copy(pos)
    pageGroup.add(glowMesh)
    voidGlowMats.push({ mat: glowMat, phase: phase + Math.PI * 0.55 })

    // ── HSW meniscus membrane sphere (all voids r ≥ 0.6) ────────────────────
    if (r >= 0.6) {
      const uniforms: VoidUniforms = {
        uTime:       { value: 0 },
        uColor:      { value: colA },
        uColor2:     { value: colB },
        uPointer:    { value: new THREE.Vector2(0, 0) },
        uPointerStr: { value: 0 },
      }
      voidUniforms.push(uniforms)

      const meniscusMat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader:   VOID_VERT,
        fragmentShader: VOID_FRAG,
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
      })
      const shellMesh = new THREE.Mesh(
        new THREE.SphereGeometry(r * 0.97, 52, 36),
        meniscusMat,
      )
      shellMesh.position.copy(pos)
      pageGroup.add(shellMesh)

      // Dark inner void — true emptiness
      const innerFill = new THREE.Mesh(
        new THREE.SphereGeometry(r * 0.96, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0x000106, transparent: true, opacity: 0.10,
          side: THREE.BackSide, depthWrite: false,
        }),
      )
      innerFill.position.copy(pos)
      pageGroup.add(innerFill)
    }
  }
}

function buildBlackHoles() {
  for (const bh of BH_LIST) {
    const pos = new THREE.Vector3(...bh.pos)
    const col = new THREE.Color(bh.diskColor)

    // Event horizon
    const horizon = new THREE.Mesh(new THREE.SphereGeometry(bh.diskInner * 0.55, 14, 14), new THREE.MeshBasicMaterial({ color: 0x000000 }))
    horizon.position.copy(pos)
    pageGroup.add(horizon)

    // Lensing halo
    const lens = new THREE.Mesh(new THREE.SphereGeometry(bh.diskInner * 1.05, 14, 14), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.09, depthWrite: false, blending: THREE.AdditiveBlending }))
    lens.position.copy(pos); pageGroup.add(lens)

    // Accretion disk
    const disk = new THREE.Mesh(
      new THREE.TorusGeometry((bh.diskInner + bh.diskOuter) / 2, (bh.diskOuter - bh.diskInner) / 2, 14, 80),
      new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.5, transparent: true, opacity: 0.90, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    )
    disk.position.copy(pos)
    disk.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5
    disk.rotation.z = (Math.random() - 0.5) * 0.35
    pageGroup.add(disk); accretionDisks.push(disk)

    // Jets
    const jetUp  = new THREE.Vector3(0, 1, 0).applyEuler(disk.rotation)
    const jetMat = new THREE.MeshBasicMaterial({ color: bh.jetColor, transparent: true, opacity: 0.50, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    for (const sign of [1, -1] as const) {
      const jet = new THREE.Mesh(new THREE.ConeGeometry(bh.diskInner * 0.5, bh.jetLen, 8, 1, true), jetMat.clone())
      jet.position.copy(pos).addScaledVector(jetUp, sign * bh.jetLen * 0.5)
      jet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sign > 0 ? jetUp : jetUp.clone().negate())
      pageGroup.add(jet); quasarJets.push(jet)
    }
    const bhLight = new THREE.PointLight(bh.diskColor, 0.7, bh.diskOuter * 14); bhLight.position.copy(pos); pageGroup.add(bhLight)
  }

  // BH cluster
  const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
  for (let i = 0; i < 4; i++) {
    const orbitR = 0.22 + i * 0.04
    const angle  = angles[i]!
    const bhPos  = BH_CLUSTER_POS.clone().add(new THREE.Vector3(Math.cos(angle) * orbitR, (i % 2) * 0.06, Math.sin(angle) * orbitR))
    const mini   = 0.05 + i * 0.012

    const bhMesh = new THREE.Mesh(new THREE.SphereGeometry(mini * 0.55, 8, 8), new THREE.MeshBasicMaterial({ color: 0x050505 }))
    bhMesh.position.copy(bhPos); pageGroup.add(bhMesh)

    const miniDisk = new THREE.Mesh(new THREE.TorusGeometry(mini, mini * 0.38, 6, 28), new THREE.MeshBasicMaterial({ color: 0xff6611, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))
    miniDisk.position.copy(bhPos); miniDisk.rotation.x = Math.PI / 2 + 0.25
    pageGroup.add(miniDisk); accretionDisks.push(miniDisk)
    bhClusterOrbs.push({ mesh: bhMesh, angle, r: orbitR, speed: 0.18 + i * 0.07 })
  }

  const haze = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.045, depthWrite: false, blending: THREE.AdditiveBlending }))
  haze.position.copy(BH_CLUSTER_POS); pageGroup.add(haze)
}

function buildQuasars() {
  for (const q of QUASAR_LIST) {
    const pos = new THREE.Vector3(...q.pos)
    const col = new THREE.Color(q.color)

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 3.5 }))
    core.position.copy(pos); pageGroup.add(core)

    for (const [r, op] of [[0.14, 0.42], [0.32, 0.20], [0.7, 0.08], [1.4, 0.03]] as [number,number][]) {
      const g = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }))
      g.position.copy(pos); pageGroup.add(g)
    }

    const jetDir = new THREE.Vector3(...q.jetDir).normalize()
    const jetMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    for (const sign of [1, -1] as const) {
      const jet = new THREE.Mesh(new THREE.ConeGeometry(0.05, q.jetLen, 8, 1, true), jetMat.clone())
      jet.position.copy(pos).addScaledVector(jetDir, sign * q.jetLen * 0.5)
      jet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sign > 0 ? jetDir : jetDir.clone().negate())
      pageGroup.add(jet); quasarJets.push(jet)
    }
    const qLight = new THREE.PointLight(q.color, 1.4, q.jetLen * 5); qLight.position.copy(pos); pageGroup.add(qLight)
  }
}

function buildSupernovae() {
  for (const sn of SNOVA_LIST) {
    const pos   = new THREE.Vector3(...sn.pos)
    const phase = Math.random() * Math.PI * 2
    const opC   = sn.age === 'young' ? 0.60 : sn.age === 'medium' ? 0.35 : 0.18
    const opS   = sn.age === 'young' ? 0.50 : sn.age === 'medium' ? 0.25 : 0.10
    const group: SNovaGroup = { meshes: [], epochMyr: sn.epochMyr, lifespanMyr: sn.lifespanMyr }

    const core = new THREE.Mesh(new THREE.SphereGeometry(sn.r * 0.38, 12, 12), new THREE.MeshBasicMaterial({ color: sn.coreCol, transparent: true, opacity: opC, depthWrite: false, blending: THREE.AdditiveBlending }))
    core.position.copy(pos); pageGroup.add(core); group.meshes.push(core)

    const shell = new THREE.Mesh(new THREE.SphereGeometry(sn.r, 22, 18), new THREE.MeshBasicMaterial({ color: sn.shellCol, wireframe: true, transparent: true, opacity: opS, depthWrite: false }))
    shell.position.copy(pos); pageGroup.add(shell); group.meshes.push(shell)
    novaShells.push({ mesh: shell, phase })

    const halo = new THREE.Mesh(new THREE.SphereGeometry(sn.r * 1.3, 8, 8), new THREE.MeshBasicMaterial({ color: sn.shellCol, transparent: true, opacity: opS * 0.4, depthWrite: false, blending: THREE.AdditiveBlending }))
    halo.position.copy(pos); pageGroup.add(halo); group.meshes.push(halo)

    if (sn.age === 'young') {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(sn.r * 0.92, sn.r * 0.055, 8, 64), new THREE.MeshBasicMaterial({ color: sn.shellCol, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))
      ring.position.copy(pos); ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.8
      pageGroup.add(ring); group.meshes.push(ring)
      const snLight = new THREE.PointLight(sn.shellCol, 0.55, sn.r * 12); snLight.position.copy(pos); pageGroup.add(snLight)
    }

    // Contemporary SNe start visible; historical ones start hidden
    const T        = cosmicTimeMyr
    const isActive = T >= sn.epochMyr && T <= sn.epochMyr + sn.lifespanMyr
    for (const m of group.meshes) m.visible = isActive

    snovaGroups.push(group)
  }
}

// ── Laniakea Supercluster — polygonal envelope + galaxy flow lines ────────────

function buildLaniakea() {
  const MPC = 1 / 15   // 1 Mpc → 0.0667 scene units (MPC_SCALE)

  /** RA/Dec/Mpc → Three.js scene Vector3 (same formula as cosmic-structures.ts) */
  function toVec(ra: number, dec: number, dist: number): THREE.Vector3 {
    const raR  = ra  * Math.PI / 180
    const decR = dec * Math.PI / 180
    return new THREE.Vector3(
      dist * Math.cos(decR) * Math.cos(raR),
      dist * Math.sin(decR),
      -dist * Math.cos(decR) * Math.sin(raR),
    ).multiplyScalar(MPC)
  }

  // ── Great Attractor: convergence focus of all Laniakea galaxy velocities ────
  // RA 243°, Dec −29°, 65 Mpc  →  (−1.72, −2.10, +3.37) scene
  const gaPos = toVec(243, -29, 65)

  // Base icosahedron — subdivision 0 = 20 triangular faces, clearly polygonal
  const icoBase = new THREE.IcosahedronGeometry(1, 0)

  // ── Helper: add one shell (face mesh + wireframe) ───────────────────────────
  function addShell(
    sx: number, sy: number, sz: number,
    warmHex: number, coolHex: number,
    faceOp: number, wireOp: number,
    rOrd: number, rotY: number,
  ) {
    const geo = icoBase.clone()
    geo.rotateY(rotY)               // break perfect axis-alignment
    geo.rotateX(rotY * 0.4)        // slight tilt out of the XZ plane
    geo.scale(sx, sy, sz)

    // Vertex colour: warm amber at centre → dim red-orange at periphery
    const posAttr  = geo.attributes['position'] as THREE.BufferAttribute
    const colArr   = new Float32Array(posAttr.count * 3)
    const warmCol  = new THREE.Color(warmHex)
    const coolCol  = new THREE.Color(coolHex)
    const outerR   = Math.max(sx, sy, sz)

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i), vy = posAttr.getY(i), vz = posAttr.getZ(i)
      // Normalised radial distance 0 (centre) → 1 (outer vertex)
      const t = Math.min(1, Math.sqrt(vx*vx + vy*vy + vz*vz) / outerR)
      const c = warmCol.clone().lerp(coolCol, t * t)   // quadratic — denser warmth inside
      colArr[i * 3] = c.r; colArr[i * 3 + 1] = c.g; colArr[i * 3 + 2] = c.b
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colArr, 3))

    // Face mesh — DoubleSide so interior is lit, AdditiveBlending for glow stack
    const faceMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent:  true,
      opacity:      faceOp,
      side:         THREE.DoubleSide,
      depthWrite:   false,
      blending:     THREE.AdditiveBlending,
    }))
    faceMesh.position.copy(gaPos)
    faceMesh.renderOrder = rOrd
    pageGroup.add(faceMesh)
    laniakeaObjs.push(faceMesh)

    // Wireframe overlay — EdgesGeometry on the same scaled geo
    // 8° threshold: shows the 30 polygon edges of the icosahedron clearly
    const edgeGeo  = new THREE.EdgesGeometry(geo, 8)
    const wireCol  = new THREE.Color(warmHex).lerp(new THREE.Color(coolHex), 0.25)
    const wireMesh = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({
      color:       wireCol,
      transparent: true,
      opacity:     wireOp,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    }))
    wireMesh.position.copy(gaPos)
    wireMesh.renderOrder = rOrd - 2
    pageGroup.add(wireMesh)
    laniakeaObjs.push(wireMesh)
  }

  // ── Outer envelope — full Laniakea extent, ~160 Mpc main axis ───────────────
  // sx 5.2 ≈ 78 Mpc · sy 2.3 ≈ 35 Mpc (SGZ thin dimension) · sz 5.8 ≈ 87 Mpc
  addShell(5.2, 2.3, 5.8,  0xcc7218, 0x7a2e08,  0.022, 0.115,  16, 0.26)

  // ── Inner density shell — ~80 Mpc, higher opacity ────────────────────────────
  addShell(2.9, 1.35, 3.2, 0xe08c20, 0x9a3c10,  0.036, 0.082,  18, -0.14)

  // ── Great Attractor core glow ─────────────────────────────────────────────────
  // Three concentric spheres: bright nucleus → mid halo → faint outer pull
  const gaLayers = [
    { r: 0.40, col: 0xffb040, op: 0.42, rOrd: 26 },
    { r: 1.05, col: 0xff8818, op: 0.08, rOrd: 24 },
    { r: 2.30, col: 0xe06012, op: 0.028,rOrd: 22 },
  ]
  for (const { r, col, op, rOrd } of gaLayers) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 12, 9),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op,
        depthWrite: false, blending: THREE.AdditiveBlending }),
    )
    m.position.copy(gaPos)
    m.renderOrder = rOrd
    pageGroup.add(m)
    laniakeaObjs.push(m)
  }

  // ── Galaxy flow lines — velocity streams converging on the Great Attractor ───
  // These are the physical definition of Laniakea: any galaxy whose peculiar
  // velocity stream flows toward the GA is *in* Laniakea (Tully et al. 2014).
  laniakeaFlowMat = new THREE.LineBasicMaterial({
    color:       new THREE.Color(0xdd8f22),
    transparent: true,
    opacity:     0.10,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  })

  const flowSources: THREE.Vector3[] = [
    toVec(  0,     0,     0 ),   // Milky Way (origin)
    toVec(187.7,  12.3,  16.5),  // Virgo Cluster
    toVec(192.2, -41.3,  46.0),  // Centaurus Cluster (Abell 3526)
    toVec(159.2, -27.5,  59.0),  // Hydra Cluster (Abell 1060 — corrected 59 Mpc)
    toVec( 54.6, -35.4,  19.9),  // Fornax Cluster
    toVec(243.3, -60.9,  65.0),  // Norma Cluster (Abell 3627) — GA dominant cluster
    toVec(150,    28,    48  ),  // Ursa Major lobe
    toVec(315,   -18,    55  ),  // Telescopium-Grus arm
    toVec( 30,    10,    35  ),  // Pisces-Cetus approach
  ]

  for (const src of flowSources) {
    const toGa  = gaPos.clone().sub(src)
    // Control point at 40% of the way, curled slightly perpendicular (in XZ plane)
    const perp  = new THREE.Vector3(-toGa.z, toGa.y * 0.15, toGa.x)
      .normalize()
      .multiplyScalar(0.55 + src.length() * 0.045)
    const mid   = src.clone().lerp(gaPos, 0.40).add(perp)

    const curve = new THREE.QuadraticBezierCurve3(src, mid, gaPos)
    const pts   = curve.getPoints(20)
    const geo   = new THREE.BufferGeometry().setFromPoints(pts)
    const line  = new THREE.Line(geo, laniakeaFlowMat)
    line.renderOrder = 8
    pageGroup.add(line)
    laniakeaObjs.push(line)
  }

  // Warm point light near the GA — adds a subtle amber tint to nearby clusters
  const gaLight = new THREE.PointLight(0xff8820, 0.28, 9)
  gaLight.position.copy(gaPos)
  pageGroup.add(gaLight)
  laniakeaObjs.push(gaLight)
}

function buildClusters() {
  // Milky Way
  const mwCol = new THREE.Color(0xffd480)
  pageGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.20, 14, 14), new THREE.MeshStandardMaterial({ color: mwCol, emissive: mwCol, emissiveIntensity: 1.3 })))
  pageGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), new THREE.MeshBasicMaterial({ color: mwCol, transparent: true, opacity: 0.09, depthWrite: false, blending: THREE.AdditiveBlending })))
  pageGroup.add(new THREE.PointLight(0xffd480, 0.8, 12))

  hitMeshes = []   // reset on rebuild
  for (const c of CLUSTERS.filter(cl => cl.name !== 'Milky Way')) {
    const pos = clusterScenePos(c)
    const col = new THREE.Color(c.color)
    const r   = 0.07 + c.richness * 0.018

    // Visible glow sphere
    const cm  = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9 }))
    cm.position.copy(pos); pageGroup.add(cm)
    const cg  = new THREE.Mesh(new THREE.SphereGeometry(r * 4, 6, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending }))
    cg.position.copy(pos); pageGroup.add(cg)

    // Invisible hit sphere — generous radius for comfortable clicking
    const hitR   = Math.max(0.30, r * 5)
    const hitGeo = new THREE.SphereGeometry(hitR, 6, 6)
    const hitMat = new THREE.MeshBasicMaterial({ visible: false })
    const hitMesh = new THREE.Mesh(hitGeo, hitMat)
    hitMesh.position.copy(pos)
    hitMesh.userData.clusterName = c.name
    pageGroup.add(hitMesh)
    hitMeshes.push(hitMesh)
  }

  // Milky Way is also clickable — enter galaxy view
  const mwHit = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 6, 6),
    new THREE.MeshBasicMaterial({ visible: false }),
  )
  mwHit.userData.clusterName = 'milky-way'
  pageGroup.add(mwHit)
  hitMeshes.push(mwHit)
}

// ── Cluster label projection ──────────────────────────────────────────────────

function updateClusterLabels(nowMs: number) {
  if (nowMs - lastLabelMs < 50) return   // ~20fps is plenty for DOM labels
  lastLabelMs = nowMs

  const W   = window.innerWidth
  const H   = window.innerHeight
  const pad = 60

  const labels: ClusterLabelState[] = []

  for (const c of CLUSTERS) {
    if (c.name === 'Milky Way') continue   // omit — always at centre

    _projVec.copy(clusterScenePos(c))
    const dist = camera!.position.distanceTo(_projVec)
    _projVec.project(camera!)

    const sx = (_projVec.x + 1) / 2 * W
    const sy = (-_projVec.y + 1) / 2 * H

    const inView = _projVec.z < 1 && sx > pad && sx < W - pad && sy > pad && sy < H - pad - 90

    // Fade labels that are too close (camera is inside the cluster) or too far
    const opacity = inView ? Math.min(1, dist / 1.2) * Math.min(1, 35 / Math.max(dist, 0.5)) : 0
    const sc      = lookupSupercluster(c.name)
    const scCol   = sc ? '#' + new THREE.Color(sc.color).getHexString() : '#5577aa'

    labels.push({
      name:        c.name,
      supercluster: c.supercluster ?? '',
      scColor:     scCol,
      distMpc:     c.distMpc,
      x: sx, y: sy,
      visible: inView && opacity > 0.04,
      opacity: Math.max(0, Math.min(1, opacity)),
    })
  }

  clusterLabels.value = labels
}

// ── Supernova time visibility update ─────────────────────────────────────────

function updateSnovaVisibility() {
  const T = cosmicTimeMyr
  for (const g of snovaGroups) {
    const visible = T >= g.epochMyr && T <= g.epochMyr + g.lifespanMyr
    for (const m of g.meshes) m.visible = visible
  }
}

// ── DefenderNav cosmic data builder ──────────────────────────────────────────

function buildDefenderData(): DefenderNavData {
  const clusters: CosmicStripEntry[] = CLUSTERS.filter(c => c.name !== 'Milky Way').map(c => {
    const pos = clusterScenePos(c)
    return { name: c.name, x: pos.x, z: pos.z, richness: c.richness, color: '#' + new THREE.Color(c.color).getHexString(), hasEvent: false }
  })
  return { cosmicData: { cameraX: camera?.position.x ?? 0, cameraZ: camera?.position.z ?? 0, clusters, conduits: [] } }
}

// ── Scene initialisation ──────────────────────────────────────────────────────

function initScene() {
  renderer = viz.renderer
  scene    = viz.scene
  camera   = viz.camera
  controls = viz.controls
  if (!renderer || !scene || !camera || !controls) return

  // Shared scene-level settings
  scene.background = new THREE.Color(0x010208)
  scene.fog        = new THREE.FogExp2(0x010208, 0.010)

  // Meta view: pulled back, slightly elevated, wider FOV
  camera.fov    = 65
  camera.near   = 0.05
  camera.far    = 500
  camera.position.set(5, 3.5, 20)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  controls.enableDamping   = true
  controls.dampingFactor   = 0.07
  controls.autoRotate      = true
  controls.autoRotateSpeed = 0.11
  controls.minDistance     = 0.5
  controls.maxDistance     = 280
  controls.enablePan       = false

  pageGroup.add(new THREE.AmbientLight(0x080c18, 0.7))

  buildBackground()
  buildVoids()
  buildBlackHoles()
  buildQuasars()
  buildSupernovae()
  buildLaniakea()
  buildClusters()

  scene.add(pageGroup)
  stopTick = viz.addTick(onTick)

  // Cinematic pull-in — starts far out so the meta view scale is felt
  gsap.from(camera.position, { z: 55, y: 10, duration: 7, ease: 'power2.out', onUpdate: () => controls!.update() })
}

// ── Per-frame tick (registered with shared useVizRenderer loop) ───────────────

let lastSnovaCheck = 0

function onTick(t: number) {
  const nowMs  = t * 1000
  const nowWall = performance.now()

  // Smooth pointer strength: ramp to 1 on activity, decay to 0 after 2.2 s idle
  const TARGET_STR = (nowWall - _voidLastMove < 2200) ? 1.0 : 0.0
  _voidPointerStr += (TARGET_STR - _voidPointerStr) * 0.06
  if (_voidPointerStr < 0.002) _voidPointerStr = 0

  for (const u of voidUniforms) {
    u.uTime.value = t
    u.uPointer.value.copy(_voidPointerNDC)
    u.uPointerStr.value = _voidPointerStr
  }

  for (let ei = 0; ei < voidEdgeMats.length; ei++) {
    const { mat, phase } = voidEdgeMats[ei]!
    mat.opacity = 0.05 + 0.02 * Math.sin(t * 0.18 + phase)
  }
  for (let gi = 0; gi < voidGlowMats.length; gi++) {
    const { mat, phase } = voidGlowMats[gi]!
    mat.opacity = 0.02 + 0.01 * Math.sin(t * 0.22 + phase)
  }

  for (let i = 0; i < accretionDisks.length; i++) {
    accretionDisks[i]!.rotation.y += 0.0045 + i * 0.0008
  }

  for (let i = 0; i < quasarJets.length; i++) {
    ;(quasarJets[i]!.material as THREE.MeshBasicMaterial).opacity = 0.28 + Math.sin(t * 1.6 + i * 0.9) * 0.18
  }

  for (const sn of novaShells) {
    sn.mesh.scale.setScalar(1 + Math.sin(t * 0.55 + sn.phase) * 0.025)
  }

  for (const orb of bhClusterOrbs) {
    orb.angle += orb.speed * 0.016
    orb.mesh.position.set(
      BH_CLUSTER_POS.x + Math.cos(orb.angle) * orb.r,
      BH_CLUSTER_POS.y,
      BH_CLUSTER_POS.z + Math.sin(orb.angle) * orb.r,
    )
  }

  if (nowMs - lastSnovaCheck > 480) {
    updateSnovaVisibility()
    lastSnovaCheck = nowMs
  }

  if (camera) updateClusterLabels(nowMs)
  defenderNav.value?.redraw(buildDefenderData())
  // controls.update() and renderer.render() are handled by useVizRenderer loop
}

// ── Void pointer event handlers ───────────────────────────────────────────────

function _onVoidPointerMove(clientX: number, clientY: number) {
  const el = viz.renderer?.domElement
  if (!el) return
  const rect = el.getBoundingClientRect()
  _voidPointerNDC.x =  ((clientX - rect.left)  / rect.width)  * 2 - 1
  _voidPointerNDC.y = -((clientY - rect.top)   / rect.height) * 2 + 1
  _voidLastMove = performance.now()
}

function onVoidMouseMove(e: MouseEvent) { _onVoidPointerMove(e.clientX, e.clientY) }
function onVoidTouchMove(e: TouchEvent) {
  const t = e.touches[0]
  if (t) _onVoidPointerMove(t.clientX, t.clientY)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  enforceSessionHorizon()

  const tier = detectBandwidthTier()
  if (tier === 'slow') {
    isSlowConnection.value = true
    lbwNote.value = 'Connection detected: slow-2g / 2g — heavy 3D rendering suppressed.'
    await galaxyStore.loadData()
    const pool = galaxyStore.planets.filter(p => p.st_teff && p.sy_dist && p.pl_eqt)
    mySettlement.value = pool.length ? pool[Math.floor(Math.random() * pool.length)]! : null
    return
  }

  await galaxyStore.loadData()
  const pool = galaxyStore.planets.filter(p => p.st_teff && p.sy_dist && p.pl_eqt)
  mySettlement.value = pool.length ? pool[Math.floor(Math.random() * pool.length)]! : null
  initScene()
  window.addEventListener('mousemove',  onVoidMouseMove, { passive: true })
  window.addEventListener('touchmove',  onVoidTouchMove, { passive: true })
})

onUnmounted(() => {
  stopTick?.()

  // Restore shared controls to neutral state
  if (controls) {
    controls.autoRotate      = false
    controls.autoRotateSpeed = 0
    controls.enablePan       = true
  }

  // Dispose all geometries and materials inside the pageGroup
  pageGroup.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const m = obj as THREE.Mesh
      m.geometry?.dispose()
      if (Array.isArray(m.material)) m.material.forEach(x => x.dispose())
      else (m.material as THREE.Material)?.dispose()
    } else if ((obj as THREE.Line).isLine) {
      (obj as THREE.Line).geometry?.dispose()
    }
  })
  viz.scene?.remove(pageGroup)

  // Reset module-level tracking arrays
  accretionDisks = []; quasarJets = []; novaShells = []; snovaGroups = []
  voidUniforms = []; voidEdgeMats = []; voidGlowMats = []; bhClusterOrbs = []
  laniakeaObjs = []; hitMeshes = []
  laniakeaFlowMat?.dispose(); laniakeaFlowMat = undefined
  window.removeEventListener('mousemove', onVoidMouseMove)
  window.removeEventListener('touchmove', onVoidTouchMove)
})
</script>

<style scoped>
/* ── Get Started entry button ────────────────────────────────────── */

.ob-entry-btn-wrap {
  position: absolute;
  bottom: 108px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: all;
}

.ob-entry-btn {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  box-shadow: 0 4px 20px rgba(0, 180, 220, 0.28), 0 0 0 1px rgba(0, 200, 240, 0.18);
  animation: ob-entry-glow 3s ease-in-out infinite;
}

@keyframes ob-entry-glow {
  0%, 100% { box-shadow: 0 4px 20px rgba(0,180,220,0.28), 0 0 0 1px rgba(0,200,240,0.18); }
  50%       { box-shadow: 0 4px 28px rgba(0,210,255,0.45), 0 0 0 1px rgba(0,230,255,0.35); }
}

/* ── Cluster label overlay ────────────────────────────────────────── */

.labels-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;   /* layer itself is passthrough */
  z-index: 3;
  overflow: hidden;
}

.cluster-label {
  position: absolute;
  transform: translate(-50%, -100%);
  padding-bottom: 0;
  text-align: center;
  pointer-events: none;   /* default: non-interactive */
  will-change: opacity;
  user-select: none;
}

/* Clickable variant — label becomes interactive */
.cluster-label--clickable {
  pointer-events: all;
  cursor: pointer;
  border-radius: 4px;
  padding: 4px 7px 3px;
  transition: background 0.14s;
}
.cluster-label--clickable:hover {
  background: rgba(0, 60, 100, 0.50);
}
.cluster-label--clickable:hover .cl-name {
  color: rgba(0, 230, 255, 0.95);
  text-shadow: 0 0 8px rgba(0, 200, 255, 0.50);
}
.cluster-label--clickable:hover .cl-tick {
  background: linear-gradient(to bottom, rgba(0, 230, 255, 0.65), rgba(0, 200, 255, 0.10));
}

.cl-name {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.13em;
  color: rgba(180, 220, 255, 0.82);
  white-space: nowrap;
  text-transform: uppercase;
  line-height: 1.4;
}

.cl-super {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.07em;
  color: var(--sc-color, #5577aa);
  opacity: 0.75;
  white-space: nowrap;
  line-height: 1.3;
}

.cl-dist {
  font-family: 'Courier New', monospace;
  font-size: 6px;
  color: rgba(70, 110, 150, 0.55);
  letter-spacing: 0.05em;
  margin-top: 1px;
  line-height: 1.3;
}

/* "→ enter field" call-to-action — shown on hover via parent hover */
.cl-enter {
  font-family: 'Courier New', monospace;
  font-size: 6px;
  letter-spacing: 0.10em;
  color: rgba(0, 200, 240, 0.0);   /* invisible by default */
  margin-top: 2px;
  transition: color 0.14s;
  white-space: nowrap;
}
.cluster-label--clickable:hover .cl-enter {
  color: rgba(0, 210, 255, 0.75);
}

/* Downward tick mark connecting the label to the cluster dot */
.cl-tick {
  width: 1px;
  height: 9px;
  background: linear-gradient(to bottom, rgba(0, 200, 240, 0.35), rgba(0, 200, 240, 0.05));
  margin: 3px auto 0;
}

/* ── Cosmic time epoch indicator ──────────────────────────────────── */

.epoch-indicator {
  position: fixed;
  top: 46px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  pointer-events: none;
  z-index: 6;
  background: rgba(1, 4, 18, 0.88);
  border: 1px solid rgba(120, 80, 255, 0.35);
  border-radius: 6px;
  padding: 6px 16px;
  backdrop-filter: blur(6px);
}

.ei-label {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.14em;
  color: rgba(120, 80, 255, 0.65);
}

.ei-value {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  letter-spacing: 0.04em;
  color: rgba(180, 140, 255, 0.92);
  line-height: 1.3;
}

.ei-sn {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: rgba(100, 60, 200, 0.65);
  margin-top: 2px;
}

.epoch-fade-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.epoch-fade-leave-active { transition: opacity 0.25s ease; }
.epoch-fade-enter-from   { opacity: 0; transform: translateX(-50%) translateY(-6px); }
.epoch-fade-leave-to     { opacity: 0; }

/* ── Top navigation strip ─────────────────────────────────────────── */

.top-nav {
  position: fixed;
  top: 54px;   /* sit just below the MainLayout header (~50px tall) */
  left: 12px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── Low-bandwidth fallback ───────────────────────────────────────── */

.low-bw-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000814;
  font-family: 'Courier New', monospace;
  text-align: center;
  padding: 24px;
  gap: 12px;
}

.lbw-icon {
  font-size: 36px;
  color: rgba(0, 200, 240, 0.55);
}

.lbw-title {
  font-size: 22px;
  letter-spacing: 0.22em;
  color: rgba(0, 200, 240, 0.80);
}

.lbw-sub {
  font-size: 11px;
  color: rgba(80, 130, 160, 0.75);
  max-width: 340px;
  line-height: 1.65;
}

.lbw-btns { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }

.lbw-note {
  font-size: 8px;
  color: rgba(60, 100, 130, 0.55);
  margin-top: 8px;
  letter-spacing: 0.06em;
}

/* ── Settlement panel ─────────────────────────────────────────────── */

.settlement-panel {
  position: fixed; bottom: 84px; right: 14px; z-index: 6;
  font-family: 'Courier New', monospace; min-width: 172px;
}

.sp-header {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 10px;
  background: rgba(1, 6, 20, 0.93);
  border: 1px solid rgba(0, 200, 220, 0.22); border-radius: 5px;
  cursor: pointer; user-select: none; white-space: nowrap;
  transition: border-color 0.12s;
}
.sp--open .sp-header { border-radius: 5px 5px 0 0; border-bottom-color: rgba(0, 80, 120, 0.35); }
.sp-header:hover { border-color: rgba(0, 220, 255, 0.38); }
.sp-icon    { color: rgba(0, 200, 220, 0.78); font-size: 12px; }
.sp-title   { font-size: 9px; letter-spacing: 0.13em; color: rgba(0, 200, 240, 0.75); }
.sp-total   { font-size: 8px; color: rgba(80, 130, 160, 0.65); }
.sp-toggle  { margin-left: auto; font-size: 8px; color: rgba(0, 180, 220, 0.5); padding-left: 6px; }

.sp-body {
  background: rgba(1, 5, 18, 0.96); border: 1px solid rgba(0, 200, 220, 0.22);
  border-top: none; border-radius: 0 0 5px 5px; backdrop-filter: blur(10px);
  width: 310px; overflow: hidden;
}

.sp-tabs { display: flex; border-bottom: 1px solid rgba(0, 80, 120, 0.35); }
.sp-tab { flex: 1; background: none; border: none; font-family: 'Courier New', monospace; font-size: 8px; letter-spacing: 0.09em; color: rgba(0, 160, 200, 0.48); padding: 6px 4px; cursor: pointer; transition: color 0.1s; position: relative; }
.sp-tab--active { color: #00e5ff; }
.sp-tab--active::after { content: ''; position: absolute; bottom: -1px; left: 10%; right: 10%; height: 1px; background: #00e5ff; }
.sp-tab:hover:not(.sp-tab--active) { color: rgba(0, 220, 255, 0.68); }

.sp-loading { display: flex; align-items: center; padding: 14px 12px; }

.sp-list { max-height: 230px; overflow-y: auto; padding: 2px 0; scrollbar-width: thin; scrollbar-color: rgba(0, 180, 220, 0.2) transparent; }

.sp-row { display: flex; align-items: center; gap: 7px; padding: 6px 10px; border-bottom: 1px solid rgba(0, 40, 70, 0.3); cursor: pointer; transition: background 0.1s; }
.sp-row:hover { background: rgba(0, 60, 100, 0.22); }
.sp-row:last-child { border-bottom: none; }

.sp-rank  { font-size: 9px; color: rgba(0, 200, 220, 0.5); min-width: 20px; }
.sp-dot   { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 4px currentColor; }
.sp-info  { flex: 1; min-width: 0; }
.sp-name  { font-size: 10px; color: rgba(180, 220, 240, 0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.02em; }
.sp-meta  { font-size: 8px; color: rgba(100, 150, 180, 0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.sp-sep   { margin: 0 3px; opacity: 0.45; }

.sp-badge-row { margin-top: 2px; }
.sp-badge { font-size: 7px; letter-spacing: 0.07em; padding: 1px 4px; border: 1px solid; border-radius: 2px; color: rgba(180, 220, 240, 0.7); opacity: 0.8; }

.sp-score-row { display: flex; align-items: center; gap: 5px; margin-top: 3px; }
.sp-score-bar { flex: 1; height: 2px; background: rgba(0, 80, 120, 0.35); border-radius: 1px; overflow: hidden; }
.sp-score-fill { height: 100%; background: linear-gradient(90deg, #0088cc, #00e5ff); border-radius: 1px; }
.sp-score-val  { font-size: 7px; color: rgba(0, 200, 240, 0.5); min-width: 20px; text-align: right; }
.sp-enter-btn  { flex-shrink: 0; }

.sp-footer { padding: 7px 10px; border-top: 1px solid rgba(0, 80, 120, 0.35); background: rgba(0, 4, 14, 0.55); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.sp-your-wrap { min-width: 0; flex: 1; }
.sp-your-label { font-size: 7px; letter-spacing: 0.1em; color: rgba(80, 130, 160, 0.65); margin-bottom: 1px; }
.sp-your-name  { font-size: 10px; color: rgba(0, 220, 255, 0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-your-meta  { font-size: 8px; color: rgba(80, 140, 170, 0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-footer-btns { display: flex; gap: 3px; flex-shrink: 0; }

.sp-expand-enter-active { transition: max-height 0.22s ease-out, opacity 0.18s ease-out; max-height: 400px; }
.sp-expand-leave-active { transition: max-height 0.18s ease-in, opacity 0.15s ease-in; }
.sp-expand-enter-from, .sp-expand-leave-to { max-height: 0; opacity: 0; }

/* ── Transit dialog ───────────────────────────────────────────────── */

.transit-card { background: rgba(2, 5, 22, 0.97); border: 1px solid rgba(0, 180, 220, 0.2); border-radius: 10px 10px 0 0; color: #c0d0e0; }
.dest-row { background: rgba(0, 18, 38, 0.55); border: 1px solid rgba(0, 100, 160, 0.14); border-radius: 4px; transition: background 0.14s; }
.dest-row:hover { background: rgba(0, 50, 100, 0.5); }
</style>
