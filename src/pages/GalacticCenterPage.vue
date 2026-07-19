<template>
  <!-- Transparent overlay — shared Three.js canvas in MainLayout renders behind -->
  <q-page class="gc-page viz-overlay-page" :style="hoverInfo ? { cursor: 'pointer' } : {}"
    @click="onClick" @mousemove="onMouseMove" @mouseleave="onMouseLeave">

    <!-- Breadcrumb -->
    <div class="gc-breadcrumb">
      <q-btn flat dense size="xs" color="blue-grey-5" icon="mdi-chevron-left"
        :label="isSgrA ? 'Galaxy' : 'Black Holes'"
        @click="$router.push(isSgrA ? '/galaxy' : '/black-holes')" />
      <span class="gc-bc-sep">/</span>
      <span class="gc-bc-cur">{{ isSgrA ? 'Galactic Center · Sgr A*' : targetLabel }}</span>
    </div>

    <!-- Top overlay: scale + time -->
    <div class="gc-top-overlay">
      <div class="gc-eyebrow">{{ targetEyebrow }}</div>
      <div class="gc-stat-row">
        <span class="gc-stat-key">Distance from Earth</span>
        <span class="gc-stat-val">{{ targetDistLabel }}</span>
      </div>
      <div class="gc-stat-row">
        <span class="gc-stat-key">{{ targetLabel }} mass</span>
        <span class="gc-stat-val">{{ targetMassLabel }}</span>
      </div>
      <div class="gc-stat-row">
        <span class="gc-stat-key">Scene scale</span>
        <span class="gc-stat-val">{{ scaleLabelText }}</span>
      </div>
      <template v-if="showTimeWarp">
        <div class="gc-stat-row">
          <span class="gc-stat-key">Time warp</span>
          <span class="gc-stat-val">1 s = {{ timeWarpLabel }}</span>
        </div>
        <div class="gc-time-ctrl q-mt-xs">
          <q-btn dense flat size="xs" icon="mdi-rewind" color="blue-grey-4" @click="changeTimeWarp(-1)" />
          <q-btn dense flat size="xs" icon="mdi-play-pause" color="blue-grey-4" @click="togglePause" />
          <q-btn dense flat size="xs" icon="mdi-fast-forward" color="blue-grey-4" @click="changeTimeWarp(1)" />
        </div>
      </template>
    </div>

    <!-- Right panel: zone selector (Sgr A* only — settlement lore doesn't extend elsewhere) -->
    <div v-if="isSgrA" class="gc-zone-panel" :class="{ 'gc-zone-panel--open': zonePanelOpen }">
      <div class="gc-zp-header" @click="zonePanelOpen = !zonePanelOpen">
        <span class="gc-zp-title">Research Settlements</span>
        <q-icon :name="zonePanelOpen ? 'mdi-chevron-right' : 'mdi-chevron-left'" size="16px" color="amber-4" />
      </div>
      <div v-if="zonePanelOpen" class="gc-zp-body">
        <div
          v-for="zone in SETTLEMENT_ZONES"
          :key="zone.id"
          class="gc-zone-card"
          :class="{ 'gc-zone-card--active': selectedZone?.id === zone.id }"
          @click="selectZone(zone)"
        >
          <div class="gc-zc-label">{{ zone.label }}</div>
          <div class="gc-zc-dist">{{ zone.orbital_radius_au.toFixed(1) }} AU · {{ zone.orbital_radius_rs.toLocaleString() }} Rs</div>
          <div class="gc-zc-rad" :class="`text-${zone.radiation_class === 'extreme' ? 'red-5' : zone.radiation_class === 'elevated' ? 'amber-5' : 'green-5'}`">
            {{ zone.radiation_class.toUpperCase() }} RADIATION
          </div>
        </div>
      </div>
    </div>

    <!-- Right panel: discovery/evidence (catalog targets only) -->
    <div v-else class="gc-zone-panel gc-zone-panel--open">
      <div class="gc-zp-header">
        <span class="gc-zp-title">How We Know</span>
      </div>
      <div class="gc-zp-body">
        <div class="gc-evidence-card">
          <div class="gc-zc-label">Discovery</div>
          <div class="gc-evidence-text">{{ catalogTarget?.discovery }}</div>
        </div>
        <div class="gc-evidence-card">
          <div class="gc-zc-label">Evidence</div>
          <div class="gc-evidence-text">{{ catalogTarget?.evidence }}</div>
        </div>
        <div v-if="accretionNote" class="gc-evidence-card">
          <div class="gc-zc-label">Current Activity</div>
          <div class="gc-evidence-text">{{ accretionNote }}</div>
        </div>
      </div>
    </div>

    <!-- Zone detail drawer -->
    <Transition name="zone-detail">
      <div v-if="selectedZone" class="gc-zone-detail">
        <button class="gc-zd-close" @click="selectedZone = null">✕</button>
        <div class="gc-zd-label">{{ selectedZone.label }}</div>
        <div class="gc-zd-addr">{{ selectedZone.exoloc_address }}</div>
        <div class="gc-zd-stats">
          <div class="gc-zd-stat">
            <span class="gc-zd-k">Distance</span>
            <span class="gc-zd-v">{{ selectedZone.orbital_radius_rs.toLocaleString() }} Rs</span>
          </div>
          <div class="gc-zd-stat">
            <span class="gc-zd-k">Time dilation</span>
            <span class="gc-zd-v">τ/t = {{ selectedZone.time_dilation_factor.toFixed(4) }}</span>
          </div>
          <div class="gc-zd-stat">
            <span class="gc-zd-k">Radiation</span>
            <span class="gc-zd-v" :class="`text-${selectedZone.radiation_class === 'extreme' ? 'red-4' : selectedZone.radiation_class === 'elevated' ? 'amber-4' : 'green-4'}`">
              {{ selectedZone.radiation_class }}
            </span>
          </div>
        </div>
        <div class="gc-zd-focus">{{ selectedZone.research_focus }}</div>
        <div class="gc-zd-note">{{ selectedZone.settlement_note }}</div>
        <q-btn dense rounded unelevated size="sm" color="amber-9" icon="mdi-map-marker-plus"
          label="Claim Research Settlement"
          class="q-mt-sm"
          @click="claimSettlement(selectedZone)" />
      </div>
    </Transition>

    <!-- Hovered object tooltip -->
    <Transition name="hover-fade">
      <div v-if="hoverInfo" class="gc-hover-box" :style="{ left: hoverX + 'px', top: hoverY + 'px' }">
        <div class="gc-hb-name">{{ hoverInfo.label }}</div>
        <div v-if="hoverInfo.sub" class="gc-hb-sub">{{ hoverInfo.sub }}</div>
      </div>
    </Transition>

    <!-- IRS 13E detail overlay (Sgr A* only) -->
    <Transition name="hover-fade">
      <div v-if="isSgrA && irs13eSelected" class="gc-irs-panel">
        <button class="gc-zd-close" @click="irs13eSelected = false">✕</button>
        <div class="gc-zd-label">IRS 13E · IMBH Candidate</div>
        <div class="gc-irs-dist">6,300 AU (0.1 ly) from Sgr A*</div>
        <p class="gc-irs-body">
          Compact evaporating cluster containing an intermediate-mass black hole candidate (≥ 10,000 M☉).
          Confirmed by VLT + ALMA + Chandra multi-disk structure (Schödel et al. 2023).
          Six Wolf-Rayet stars are being tidally stripped by Sgr A*.
          Spiraling inward via dynamical friction — IMRI gravitational wave source for LISA.
        </p>
        <div class="gc-zd-addr">exotopia:bh-orbital:Sgr-A*/irs13e</div>
        <q-btn dense rounded unelevated size="sm" color="teal-8" icon="mdi-map-marker-plus"
          label="Establish IRS 13E Outpost"
          class="q-mt-sm"
          @click="claimSettlement(SETTLEMENT_ZONES.find(z => z.id === 'irs13e-outpost')!)" />
      </div>
    </Transition>

    <!-- Educational link -->
    <div class="gc-edu-link">
      <q-btn flat dense size="xs" icon="mdi-book-open-variant" color="blue-grey-5"
        label="Physics of this scene"
        @click="$router.push('/sky-lessons?lesson=3')" />
    </div>

    <!-- Legend -->
    <div class="gc-legend">
      <div v-for="item in legendItems" :key="item.label" class="gc-leg-item">
        <span class="gc-leg-dot" :style="{ background: item.color, border: item.border }" />
        <span class="gc-leg-name">{{ item.label }}</span>
      </div>
    </div>

    <!-- Defender view — parsec-gradient scale navigator -->
    <BlackHoleDefenderNav
      :target-label="targetLabel"
      :current-distance-pc="defenderCurrentDistancePc"
      :min-pc="defenderSliderBounds.min"
      :max-pc="defenderSliderBounds.max"
      :markers="defenderMarkers"
      :catalog-list="defenderCatalogList"
      :current-id="catalogTarget?.id ?? SGR_A_JUMP_ID"
      @seek="onDefenderSeek"
      @jump-to="onDefenderJump"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as THREE from 'three'
import gsap from 'gsap'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useVizRenderer, VIZ_BAR_H } from 'src/composables/useVizRenderer'
import { disposeScene } from 'src/lib/three-utils'
import { buildEventHorizonCore, buildAccretionDiskCore, flareEnvelope } from 'src/lib/black-hole-core'
import { SPECTRAL_RGB, type SpectralClass } from 'src/lib/star-sprites'
import {
  SGR_A_STAR, S_STARS, COMPACT_OBJECTS, SETTLEMENT_ZONES, SCENE_AU,
  sStarOrbitPath, sStarPositionAU,
  type SettlementZone,
} from 'src/data/galactic-center'
import {
  findBlackHole, radiiFor, BLACK_HOLE_CATALOG,
  type BlackHoleTarget, type XRayBinaryTarget, type GlobularImbhTarget,
  type AgnJetTarget, type MegamaserDiskTarget,
} from 'src/data/black-holes'
import { useSettlements } from 'src/lib/settlements'
import BlackHoleDefenderNav, { type DefenderMarker } from 'src/components/BlackHoleDefenderNav.vue'

// ── Scene globals ─────────────────────────────────────────────────────────────

const route  = useRoute()
const router = useRouter()
const { addSettlement } = useSettlements()

// ── Target resolution — Sgr A* by default, or a catalog lookup by bhId ────────

const bhIdParam    = computed(() => String(route.params.bhId ?? ''))
const catalogTarget = computed<BlackHoleTarget | null>(() =>
  bhIdParam.value ? (findBlackHole(bhIdParam.value) ?? null) : null
)
const isSgrA = computed(() => !catalogTarget.value)

const targetLabel = computed(() => catalogTarget.value?.label ?? 'Sagittarius A*')
const targetMassLabel = computed(() => {
  const m = catalogTarget.value?.mass_msun ?? SGR_A_STAR.mass_msun
  return m >= 1e6 ? `${(m / 1e6).toFixed(3)}M M☉` : `${m.toFixed(1)} M☉`
})
const targetDistLabel = computed(() => {
  if (!catalogTarget.value) return '26,000 ly (8.178 kpc)'
  const pc = catalogTarget.value.dist_pc
  const ly = pc * 3.2616
  return pc > 1e6
    ? `${(ly / 1e6).toFixed(1)}M ly (${(pc / 1e6).toFixed(2)} Mpc)`
    : `${ly.toLocaleString(undefined, { maximumFractionDigits: 0 })} ly (${pc.toLocaleString()} pc)`
})
const targetEyebrow = computed(() => {
  const t = catalogTarget.value
  if (!t) return 'GALACTIC CENTER · NUCLEAR STAR CLUSTER'
  if (t.sceneType === 'x-ray-binary')    return 'X-RAY BINARY · STELLAR-MASS BLACK HOLE'
  if (t.sceneType === 'globular-imbh')   return 'GLOBULAR CLUSTER · INTERMEDIATE-MASS BLACK HOLE'
  if (t.sceneType === 'agn-jet')         return 'ACTIVE GALACTIC NUCLEUS · JETTED SUPERMASSIVE BLACK HOLE'
  return 'MEGAMASER DISK · SUPERMASSIVE BLACK HOLE'
})

// "Current Activity" card — only x-ray binaries have a real, citable answer
// to "what does this system actually look like right now" that differs
// meaningfully from what's rendered by default (mid-outburst, for legibility).
const accretionNote = computed(() => {
  const t = catalogTarget.value
  if (!t || t.sceneType !== 'x-ray-binary') return null
  if (t.accretionState === 'detached') {
    return "No accretion disk. The companion's orbit never brings it close enough to fill its Roche lobe, so no gas flows toward the black hole — no disk, no X-rays. That absence of an X-ray signature is exactly why this black hole was invisible to every X-ray survey and was only found through the star's astrometric wobble."
  }
  if (t.accretionState === 'persistent') {
    return 'Persistent X-ray source. Wind-fed accretion from the supergiant companion keeps a bright disk essentially always on, unlike the transient systems in this catalog — this is the steady state, not a rare event.'
  }
  return `Quiescent transient. What's rendered here is a stylized mid-outburst state for legibility — the real system spends decades far fainter than this, then erupts dramatically and rarely. Last real outburst: ${t.lastOutburst}.`
})

interface LegendItem { label: string; color: string; border?: string }
const legendItems = computed<LegendItem[]>(() => {
  const base: LegendItem[] = [
    { label: 'Event Horizon', color: '#000', border: '1px solid #556677' },
    { label: 'Photon Ring',   color: '#ffe8c0' },
  ]
  const t = catalogTarget.value
  if (!t) {
    return [
      ...base,
      ...S_STARS.map(s => ({ label: s.name, color: s.color_hex })),
      { label: 'IRS 13E', color: '#ff9944' },
    ]
  }
  if (t.sceneType === 'x-ray-binary') {
    return [...base, { label: t.companion.spectral_type, color: t.companion.color_hex }]
  }
  if (t.sceneType === 'globular-imbh') {
    return [...base, { label: 'Hypervelocity tracer stars', color: '#ffe080' }, { label: 'Cluster core field', color: '#9bb0ff' }]
  }
  if (t.sceneType === 'agn-jet') {
    return [...base, { label: 'Relativistic jet', color: '#88ccff' }, { label: 'Host galaxy core', color: '#ffcc88' }]
  }
  return [...base, { label: 'Maser disk', color: '#66ddcc' }]
})

// ── UI state ──────────────────────────────────────────────────────────────────

const zonePanelOpen  = ref(true)
const selectedZone   = ref<SettlementZone | null>(null)
const irs13eSelected = ref(false)
const hoverInfo      = ref<{ label: string; sub?: string } | null>(null)
const hoverX         = ref(0)
const hoverY         = ref(0)

// ── Time animation ────────────────────────────────────────────────────────────

/** current simulated epoch (decimal year) — starts at real current date */
const simEpoch   = ref(2026.5)
const paused     = ref(false)

/** Time warp index: 0=slowest … 5=fastest */
const warpIdx    = ref(2)
const WARP_STEPS = [
  { label: '1 month/s', yr_per_s: 1 / 12 },
  { label: '6 months/s', yr_per_s: 0.5 },
  { label: '1 yr/s',    yr_per_s: 1 },
  { label: '5 yr/s',    yr_per_s: 5 },
  { label: '1 orbit/s', yr_per_s: 16.0455 },  // S2 orbit period
  { label: '10 yr/s',   yr_per_s: 10 },
]
const timeWarpLabel = computed(() => WARP_STEPS[warpIdx.value]!.label)

// Time warp only makes sense where something is actually animated on a real
// orbital period — Sgr A*'s S-stars, or an x-ray binary's companion orbit.
const showTimeWarp = computed(() => isSgrA.value || catalogTarget.value?.sceneType === 'x-ray-binary')

function changeTimeWarp(dir: number) {
  warpIdx.value = Math.max(0, Math.min(WARP_STEPS.length - 1, warpIdx.value + dir))
}
function togglePause() { paused.value = !paused.value }

// ── Scale label ───────────────────────────────────────────────────────────────

const camDist = ref(30) // scene units from the current target

// Real distance each scene's units correspond to — this was previously a
// single Sgr-A*-specific constant (SCENE_AU) applied unconditionally to every
// catalog scene too, which understated or overstated the true zoom level by
// orders of magnitude depending on scene type. Each catalog scene type has
// its own scale (see the loadAnticipatedObjects() calls in each builder,
// which establish the pc-per-scene-unit correspondence used here); for
// scenes with two coexisting scales (compact core vs. ambient neighborhood,
// e.g. M87*'s jet is deliberately not-to-scale), this uses the ambient/outer
// scale since that governs most of the camera's actual navigable range.
const sceneUnitsToPc = computed(() => {
  const t = catalogTarget.value
  if (!t) return SCENE_AU / 206265                 // Sgr A*: 100 AU/unit
  if (t.sceneType === 'x-ray-binary')  return 1 / 206265        // 1 AU/unit, direct
  if (t.sceneType === 'globular-imbh') return 6 / 11            // matches loadAnticipatedObjects(11/6) call
  if (t.sceneType === 'agn-jet')       return 1 / 25            // matches loadAnticipatedObjects(25) call
  return 1 / 13.5                                                // megamaser-disk — matches loadAnticipatedObjects(13.5) call
})

const scaleLabelText = computed(() => {
  const pc = camDist.value * sceneUnitsToPc.value
  const au = pc * 206265
  const targetName = targetLabel.value
  if (au < 1)     return `${(au * 1000).toFixed(1)} mAU from ${targetName}`
  if (au < 500)   return `${au.toFixed(au < 10 ? 2 : 0)} AU from ${targetName}`
  if (pc < 0.306)  return `${(au / 63241).toFixed(3)} ly from ${targetName}`
  return `${pc.toFixed(4)} pc from ${targetName}`
})

// ── Defender view — parsec-gradient navigation panel ───────────────────────────
// Markers are computed directly from real physical data (radiiFor, catalog
// fields) rather than duplicating the builders' internal scene-unit numbers —
// the two "Anticipated ..." sample-radius figures (6 pc, 2 pc) are the same
// figures documented in datagathering/generate_bh_anticipated_objects.py.
const AU_PER_PC = 206265

const defenderMarkers = computed<DefenderMarker[]>(() => {
  const t = catalogTarget.value
  if (!t) {
    return [
      { label: 'Horizon',     distancePc: SGR_A_STAR.rs_au / AU_PER_PC, color: '#000000' },
      { label: 'Photon Ring', distancePc: SGR_A_STAR.photon_sphere_au / AU_PER_PC, color: '#ffe8c0' },
      { label: 'ISCO',        distancePc: SGR_A_STAR.isco_au_prograde / AU_PER_PC, color: '#88aacc' },
      { label: 'Disk Outer',  distancePc: SGR_A_STAR.accretion_disk.outer_au / AU_PER_PC, color: '#ff6600' },
      { label: 'S2 Orbit',    distancePc: 1023 / AU_PER_PC, color: '#88ddff' },
    ]
  }
  const { rs_au, photon_sphere_au, isco_au } = radiiFor(t)
  const base: DefenderMarker[] = [
    { label: 'Horizon',     distancePc: rs_au / AU_PER_PC, color: '#000000' },
    { label: 'Photon Ring', distancePc: photon_sphere_au / AU_PER_PC, color: '#ffe8c0' },
    { label: 'ISCO',        distancePc: isco_au / AU_PER_PC, color: '#88aacc' },
  ]
  if (t.sceneType === 'x-ray-binary') {
    if (t.accretionState !== 'detached') {
      base.push({ label: 'Disk Outer', distancePc: (t.separation_au * 0.35) / AU_PER_PC, color: '#ff6600' })
    }
    base.push({ label: t.companion.spectral_type, distancePc: t.separation_au / AU_PER_PC, color: t.companion.color_hex })
    base.push({ label: 'Anticipated Field', distancePc: Math.max(t.separation_au * 25, 60) / AU_PER_PC, color: '#66ffaa' })
  } else if (t.sceneType === 'globular-imbh') {
    base.push({ label: 'Anticipated Cluster', distancePc: 6, color: '#66ffaa' })
  } else if (t.sceneType === 'agn-jet') {
    base.push({ label: 'Anticipated Cusp', distancePc: 2, color: '#66ffaa' })
  } else {
    base.push({ label: 'Maser Disk', distancePc: t.diskOuterPc, color: '#66aacc' })
    base.push({ label: 'Anticipated Cusp', distancePc: 2, color: '#66ffaa' })
  }
  return base
})

const defenderSliderBounds = computed(() => {
  const ds = defenderMarkers.value.map(m => m.distancePc).filter(d => d > 0)
  if (!ds.length) return { min: 0.00001, max: 1 }
  return { min: Math.min(...ds) * 0.35, max: Math.max(...ds) * 2.4 }
})

const defenderCurrentDistancePc = computed(() => camDist.value * sceneUnitsToPc.value)

const SGR_A_JUMP_ID = '__sgr_a__'
const defenderCatalogList = computed(() => [
  { id: SGR_A_JUMP_ID, label: 'Sagittarius A*' },
  ...BLACK_HOLE_CATALOG.map(bh => ({ id: bh.id, label: bh.label })),
].filter(e => e.id !== (catalogTarget.value?.id ?? SGR_A_JUMP_ID)))

function onDefenderSeek(pc: number) {
  if (!camera || !controls) return
  const sceneUnits = pc / sceneUnitsToPc.value
  const dir = camera.position.clone().sub(controls.target)
  if (dir.lengthSq() < 1e-12) dir.set(0, 0.3, 1)
  dir.normalize()
  const dest = controls.target.clone().addScaledVector(dir, sceneUnits)
  gsap.killTweensOf(camera.position)
  gsap.to(camera.position, {
    duration: 0.5, ease: 'power2.out',
    x: dest.x, y: dest.y, z: dest.z,
    onUpdate: () => controls?.update(),
  })
}

function onDefenderJump(bhId: string) {
  void router.push(bhId === SGR_A_JUMP_ID ? '/galactic-center' : `/bh/${bhId}`)
}

// ── Three.js state — shared renderer; per-page raycaster ─────────────────────

const viz = useVizRenderer()
let renderer:  THREE.WebGLRenderer     | null = null
let scene:     THREE.Scene             | null = null
let camera:    THREE.PerspectiveCamera | null = null
let controls:  OrbitControls           | null = null
let _stopTick: (() => void) | null = null
const clock: THREE.Clock = new THREE.Clock()

// Root group for all page-level scene objects — added/removed on mount/unmount
const pageGroup = new THREE.Group()

// Scene objects we need to animate
const starDots:    THREE.Mesh[] = []
const zoneRings:   { mesh: THREE.Mesh; zoneId: string }[] = []
let   bhHorizonMesh:       THREE.Mesh | null = null  // event horizon — pure black shadow
let   bhPhotonRing: THREE.Mesh | null = null
let   diskMat:        THREE.MeshBasicMaterial | null = null
let   irs13eMesh:  THREE.Mesh | null = null

// Catalog-scene animation state (unused for Sgr A*)
let companionMesh:     THREE.Mesh | null = null
let companionOrbitAU:  number = 0
let companionPeriodYr: number = 0
let hotSpotMesh:       THREE.Sprite | null = null
let hotSpotOrbitR:     number = 0
const tracerStars: { mesh: THREE.Mesh; driftDir: THREE.Vector3; speed: number }[] = []

// Set only by the 4 catalog scene dressings (never by Sgr A*'s own disk
// builder) — a slow spin so the enhanced/turbulent disk reads as flowing
// material rather than a static texture.
let catalogDiskMesh: THREE.Mesh | null = null

// Per-scene disk brightness/flare tuning — real objects genuinely differ in
// how much (and how dramatically) their disk brightness varies, so this is
// reset by each scene builder rather than sharing one hardcoded formula.
// Defaults match Sgr A*'s original hardcoded flare exactly (Sgr A* itself
// never touches this — real Sgr A* flares roughly daily; this stylized
// cycle compresses that into a visible-on-screen rhythm).
interface DiskFlareConfig { period: number; spikeWidth: number; spikeHeight: number; baseOpacity: number }
let diskFlareCfg: DiskFlareConfig = { period: 9, spikeWidth: 14, spikeHeight: 0.7, baseOpacity: 0.55 }

// ── Anticipated-object field (public/black-holes/anticipated/<bhId>.json) ─────
// Loaded async per scene; `anticipatedLoadToken` guards against a slow fetch
// from a previous bhId resolving after the user has already navigated on to
// a different one (route-param watcher rebuilds synchronously; the fetch does not).
let anticipatedPoints: THREE.Points | null = null
let anticipatedLoadToken = 0
const anticipatedSummary = ref<{ count: number; methodology: string; note: string } | null>(null)

// ── Compact-object radii, derived from real GRAVITY-collaboration values ──────
//
// Two exaggeration factors are used because the horizon/photon-sphere/ISCO trio
// (< 0.4 AU) and the accretion disk (4–30 AU) span ~2 orders of magnitude — one
// factor would either vanish the horizon or blow the disk past the S-star
// orbits. Each is applied uniformly within its own group, so the physically
// real ratios (photon sphere ≈ 1.5 Rs, ISCO ≈ 4.5 Rs for spin a*≈0.5) stay
// correct even though the absolute scale is exaggerated for legibility.
const COMPACT_EXAG = 40
const DISK_EXAG     = 5
const rsScene        = (SGR_A_STAR.rs_au            / SCENE_AU) * COMPACT_EXAG
const photonScene    = (SGR_A_STAR.photon_sphere_au / SCENE_AU) * COMPACT_EXAG
const iscoScene      = (SGR_A_STAR.isco_au_prograde / SCENE_AU) * COMPACT_EXAG
const diskInnerScene = (SGR_A_STAR.accretion_disk.inner_au / SCENE_AU) * DISK_EXAG
const diskOuterScene = (SGR_A_STAR.accretion_disk.outer_au / SCENE_AU) * DISK_EXAG

// Raycaster for hover
const raycaster = new THREE.Raycaster()
const mouseNDC  = new THREE.Vector2()
const hoverTargets: { obj: THREE.Object3D; label: string; sub?: string; onClickId?: string }[] = []

// ── Scene build ───────────────────────────────────────────────────────────────

function buildScene() {
  // Grab shared renderer refs
  renderer = viz.renderer
  scene    = viz.scene
  camera   = viz.camera
  controls = viz.controls
  if (!renderer || !scene || !camera || !controls) return

  // Configure scene appearance common to every black hole scene
  scene.background = new THREE.Color(0x000205)
  scene.fog = new THREE.FogExp2(0x000205, 0.006)
  camera.fov = 55
  controls.enablePan = true
  scene.add(pageGroup)
  pageGroup.add(new THREE.AmbientLight(0x111133, 0.6))

  if (isSgrA.value) {
    buildSgrAScene()
  } else if (catalogTarget.value) {
    buildCatalogScene(catalogTarget.value)
  }
}

function buildSgrAScene() {
  if (!camera || !controls) return

  diskFlareCfg = { period: 9, spikeWidth: 14, spikeHeight: 0.7, baseOpacity: 0.55 }

  // Configure camera for galactic-center scale
  camera.near = 0.001
  camera.far  = 2000
  camera.position.set(0, 12, 30)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  // Configure controls for galactic-center navigation
  controls.minDistance = 0.2
  controls.maxDistance = 500
  controls.target.set(0, 0, 0)

  const pl = new THREE.PointLight(0xffcc88, 4, 100)
  pl.position.set(0, 0, 0)
  pageGroup.add(pl)

  // ── Background star field (nuclear star cluster) ───────────────────────────
  buildNuclearStarCluster()

  // ── Sgr A* — event horizon, photon ring, ISCO ──────────────────────────────
  buildEventHorizon()

  // Accretion disk (exaggerated — true inner = 0.04 units, shown at 1.5 for visibility)
  buildAccretionDisk()

  // ── S-star orbital paths ───────────────────────────────────────────────────
  for (const star of S_STARS) {
    // Orbit path line
    const pts    = sStarOrbitPath(star, 360)
    const verts  = new Float32Array(pts.flatMap(p => [p[0] / SCENE_AU, p[2] / SCENE_AU, p[1] / SCENE_AU]))
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(star.color_hex),
      opacity: 0.30,
      transparent: true,
    })
    pageGroup.add(new THREE.LineLoop(lineGeo, lineMat))

    // Star dot
    const dotGeo = new THREE.SphereGeometry(0.06, 8, 8)
    const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(star.color_hex) })
    const dot    = new THREE.Mesh(dotGeo, dotMat)
    const pos    = sStarPositionAU(star, simEpoch.value)
    dot.position.set(pos[0] / SCENE_AU, pos[2] / SCENE_AU, pos[1] / SCENE_AU)
    pageGroup.add(dot)
    starDots.push(dot)

    hoverTargets.push({ obj: dot, label: star.name, sub: `${star.spectral_type} · K=${star.mag_K} · P=${star.period_yr} yr` })
  }

  // ── Settlement zone rings ──────────────────────────────────────────────────
  for (const zone of SETTLEMENT_ZONES) {
    if (zone.id === 'irs13e-outpost') continue   // shown as separate IRS 13E object
    const r = zone.orbital_radius_au / SCENE_AU
    if (r < 0.01) continue                       // photon-sphere / ISCO — too small, shown via disk colors
    buildZoneRing(zone, r)
  }

  // ── IRS 13E ───────────────────────────────────────────────────────────────
  const irs13e = COMPACT_OBJECTS[0]!
  const irsPos = irs13e.offset_au.map(v => v / SCENE_AU)
  buildIRS13E(irsPos[0]!, irsPos[1]!, irsPos[2]!)

  // ── Scale reference rings ──────────────────────────────────────────────────
  addScaleRing(0.1 * 63241 / SCENE_AU, '0.1 ly (IRS 13E distance)', 0x224444)  // 0.1 ly in scene units
  addScaleRing(1023 / SCENE_AU, 'S2 orbit', 0x222244)
}

function buildNuclearStarCluster() {
  if (!scene) return

  // Two populations: dense inner core + looser outer disk
  const totalParticles = 3000
  const positions = new Float32Array(totalParticles * 3)
  const colors    = new Float32Array(totalParticles * 3)

  const rng = mulberry32(42)
  for (let i = 0; i < totalParticles; i++) {
    // r^-1.5 density profile sampled via rejection
    const r      = Math.pow(rng(), 0.4) * 18   // scene units → 0 to 1800 AU
    const theta  = rng() * 2 * Math.PI
    const phi    = Math.acos(2 * rng() - 1) * (i < 1500 ? 0.25 : 1)  // inner: disk-ish
    const si     = i * 3
    positions[si]     = r * Math.sin(phi) * Math.cos(theta)
    positions[si + 1] = r * Math.cos(phi) * 0.4               // flatten into disk
    positions[si + 2] = r * Math.sin(phi) * Math.sin(theta)

    // Color: mix of late K/M stars (warm) + OB stars (blue) near center
    const t = rng()
    if (i < 300 && rng() > 0.6) {
      // Inner OB stars — blue-white
      colors[si] = 0.7 + rng() * 0.3; colors[si + 1] = 0.8 + rng() * 0.2; colors[si + 2] = 1.0
    } else {
      // Background K/M — warm orange-red
      colors[si] = 0.9 + rng() * 0.1; colors[si + 1] = 0.5 + t * 0.3; colors[si + 2] = 0.2 + t * 0.2
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.PointsMaterial({
    size:         0.10,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.7,
  })
  pageGroup.add(new THREE.Points(geo, mat))
}

function buildEventHorizon() {
  if (!scene) return

  const { horizon, photonRing } = buildEventHorizonCore(pageGroup, {
    rsScene, photonScene, iscoScene,
    diskInnerScene, diskOuterScene,
    diskInnerTempK: SGR_A_STAR.accretion_disk.inner_temp_K,
    diskOuterTempK: SGR_A_STAR.accretion_disk.outer_temp_K,
  })
  bhHorizonMesh       = horizon
  bhPhotonRing = photonRing

  hoverTargets.push({
    obj:   bhHorizonMesh,
    label: 'Sagittarius A* — Event Horizon',
    sub:   `${(SGR_A_STAR.mass_msun / 1e6).toFixed(3)}M M☉ · spin a*≈${SGR_A_STAR.spin_parameter} · `
         + `Rs=${(SGR_A_STAR.rs_km / 1e6).toFixed(2)}M km · EHT-imaged 2022`,
  })
}

function buildAccretionDisk() {
  if (!scene) return

  const { inner_temp_K, outer_temp_K } = SGR_A_STAR.accretion_disk
  const { disk, diskMat: mat } = buildAccretionDiskCore(pageGroup, {
    rsScene, photonScene, iscoScene,
    diskInnerScene, diskOuterScene,
    diskInnerTempK: inner_temp_K,
    diskOuterTempK: outer_temp_K,
  })
  diskMat = mat

  hoverTargets.push({
    obj:   disk,
    label: 'Accretion Flow',
    sub:   `${SGR_A_STAR.accretion_disk.inner_au.toFixed(1)}–${SGR_A_STAR.accretion_disk.outer_au.toFixed(1)} AU · `
         + `${inner_temp_K.toExponential(0)}–${outer_temp_K.toExponential(0)} K`,
  })
}

function buildZoneRing(zone: SettlementZone, r: number) {
  if (!scene) return

  const geo  = new THREE.TorusGeometry(r, 0.008, 4, 96)
  const mat  = new THREE.MeshBasicMaterial({
    color:       new THREE.Color(zone.ring_color_hex),
    transparent: true,
    opacity:     zone.id === 'flare-observatory' ? 0.6 : 0.25,
  })
  const ring = new THREE.Mesh(geo, mat)
  ring.rotation.x = Math.PI / 2
  pageGroup.add(ring)
  zoneRings.push({ mesh: ring, zoneId: zone.id })
}

function buildIRS13E(x: number, y: number, z: number) {
  if (!scene) return

  // Central IMBH glow
  const geo  = new THREE.SphereGeometry(0.12, 12, 12)
  const mat  = new THREE.MeshBasicMaterial({ color: 0xff9944 })
  irs13eMesh = new THREE.Mesh(geo, mat)
  irs13eMesh.position.set(x, z, y)
  pageGroup.add(irs13eMesh)

  // Wolf-Rayet star cluster (6 stars scattered around IMBH)
  const wrColors = ['#ffaaff', '#ff88ff', '#ff66dd', '#ff55cc', '#aa44ff', '#cc55ff']
  const rng = mulberry32(99)
  for (let i = 0; i < 6; i++) {
    const angle  = (i / 6) * Math.PI * 2 + rng() * 0.5
    const spread = 0.6 + rng() * 0.6
    const wx = x + Math.cos(angle) * spread
    const wy = z + (rng() - 0.5) * 0.3
    const wz = y + Math.sin(angle) * spread
    const wGeo = new THREE.SphereGeometry(0.04 + rng() * 0.02, 8, 8)
    const wMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(wrColors[i % wrColors.length]!) })
    const wMesh = new THREE.Mesh(wGeo, wMat)
    wMesh.position.set(wx, wy, wz)
    pageGroup.add(wMesh)
  }

  // Connector line from Sgr A* to IRS 13E (very faint)
  const pts = new Float32Array([0, 0, 0, x, z, y])
  const lGeo = new THREE.BufferGeometry()
  lGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
  const lMat = new THREE.LineBasicMaterial({ color: 0xff9944, opacity: 0.08, transparent: true })
  pageGroup.add(new THREE.Line(lGeo, lMat))

  hoverTargets.push({
    obj:       irs13eMesh,
    label:     'IRS 13E — IMBH Candidate',
    sub:       '≥ 10,000 M☉ · 0.1 ly from Sgr A* · click for details',
    onClickId: 'irs13e',
  })
}

function addScaleRing(r: number, label: string, color: number) {
  if (!scene || r < 0.05) return
  const geo = new THREE.TorusGeometry(r, 0.003, 3, 96)
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2 })
  const m   = new THREE.Mesh(geo, mat)
  m.rotation.x = Math.PI / 2
  pageGroup.add(m)
  void label  // label is for documentation; add CSS label system in v2
}

// ── Catalog black holes (everything that isn't Sgr A*) ────────────────────────
//
// Dispatches to one of four scene "dressings" by sceneType. All four share the
// same event-horizon/photon-ring/ISCO/disk core (buildEventHorizonCore /
// buildAccretionDiskCore from src/lib/black-hole-core.ts) — only the
// surrounding context differs, because a stellar-mass X-ray binary, a
// globular-cluster IMBH, a jetted AGN, and a megamaser disk galaxy are
// genuinely different physical environments and it would misrepresent them
// to force one template (e.g. a fake nuclear star cluster around Cygnus X-1).

function buildCatalogScene(target: BlackHoleTarget) {
  if (target.sceneType === 'x-ray-binary')  return buildXRayBinaryScene(target)
  if (target.sceneType === 'globular-imbh') return buildGlobularImbhScene(target)
  if (target.sceneType === 'agn-jet')       return buildAgnJetScene(target)
  return buildMegamaserDiskScene(target)
}

function hoverStatsCommon(target: BlackHoleTarget): string {
  return `${target.mass_msun >= 1e6 ? (target.mass_msun / 1e6).toFixed(2) + 'M' : target.mass_msun.toFixed(1)} M☉ · `
       + `${target.discovery}`
}

/**
 * X-ray binaries — Cygnus X-1, V404 Cygni, GRO J1655-40, A0620-00.
 * Scene units = 1 AU (direct) so the companion star sits at its real Kepler-
 * derived separation. The compact object's true Schwarzschild radius is
 * sub-micro-AU at this scale (invisible), so the horizon/photon-ring/ISCO
 * trio uses a fixed presentational size (TARGET_RS_SCENE) rather than a
 * mass-derived exaggeration factor — at this narrow mass range (6–33 M☉)
 * that would barely differ visually anyway.
 */
function buildXRayBinaryScene(target: XRayBinaryTarget) {
  if (!camera || !controls) return

  // Radii are drawn as a fixed *fraction of the orbital separation* rather
  // than a fixed absolute size — separations here range from 0.018 AU
  // (A0620-00) to 16.5 AU (Gaia BH3), nearly 1,000x. A fixed absolute bubble
  // size (tuned to look right for Cygnus X-1) would swallow the whole orbit
  // for the tightest systems. Scaling with `sep` guarantees the physical
  // ordering horizon < photon ring < ISCO < disk < companion orbit always
  // holds, for every system, regardless of its absolute scale.
  const regime = target.spinRegime
  const sep = target.separation_au
  const iscoS   = sep * 0.12
  const rsS     = iscoS / (regime === 'near-extremal' ? 1.3 : regime === 'moderate' ? 4.5 : 6.0)
  const photonS = rsS * (regime === 'near-extremal' ? 1.2 : 1.5)

  // Anticipated field stars sit in a shell well beyond the binary itself —
  // far and near clip / max zoom need enough headroom to actually reach it
  // (see the loadAnticipatedObjects call below for the shell radius itself).
  const neighborhoodShellAU = Math.max(sep * 25, 60)

  camera.near = 0.001
  camera.far  = Math.max(400, neighborhoodShellAU * 3)
  const camDist = Math.max(sep * 2.6, 0.01)
  camera.position.set(0, camDist * 0.35, camDist)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  controls.minDistance = sep * 0.05
  controls.maxDistance = Math.max(neighborhoodShellAU * 1.6, sep * 12, 3)
  controls.target.set(0, 0, 0)

  const pl = new THREE.PointLight(0xffcc88, 3, camDist * 4)
  pl.position.set(0, 0, 0)
  pageGroup.add(pl)

  // Background field
  buildDistantStarField(400, camDist * 6)

  // Event horizon / photon ring / ISCO exist regardless of accretion state —
  // these are properties of the black hole itself, not of whatever is or
  // isn't falling into it.
  const { horizon, photonRing } = buildEventHorizonCore(pageGroup, {
    rsScene: rsS, photonScene: photonS, iscoScene: iscoS,
    diskInnerScene: iscoS * 1.05, diskOuterScene: sep * 0.35,
    diskInnerTempK: 1e6, diskOuterTempK: 8e3,
  })
  bhHorizonMesh = horizon
  bhPhotonRing  = photonRing

  if (target.accretionState === 'detached') {
    // No disk, no hot spot — the companion never fills its Roche lobe, so no
    // gas ever flows toward the black hole. This is the actual physical
    // reason Gaia BH1/2/3 produced no X-ray signature and were only found via
    // astrometric orbital wobble; rendering a bright disk here would misrepresent
    // exactly the thing that makes these three discoveries scientifically notable.
    hoverTargets.push({
      obj: horizon,
      label: `${target.label} — Event Horizon`,
      sub: `${hoverStatsCommon(target)} · no accretion disk — detached binary, companion doesn't fill its Roche lobe`,
    })
  } else {
    // Compact object core — illustrative disk extends from just outside the
    // ISCO to roughly a third of the orbital separation (LMXB disks are
    // tidally truncated well inside the Roche lobe; exact truncation radius
    // isn't in the catalog data, so this is a plausible illustrative extent).
    hoverTargets.push({ obj: horizon, label: `${target.label} — Event Horizon`, sub: hoverStatsCommon(target) })

    const { disk, diskMat: mat } = buildAccretionDiskCore(pageGroup, {
      rsScene: rsS, photonScene: photonS, iscoScene: iscoS,
      diskInnerScene: iscoS * 1.05, diskOuterScene: sep * 0.35,
      diskInnerTempK: 1e6, diskOuterTempK: 8e3,
      turbulence: true, turbulenceSeed: target.mass_msun, dopplerPower: 2.5,
    })
    diskMat = mat
    catalogDiskMesh = disk

    // Real behavior differs sharply between the one persistent wind-fed
    // source (Cygnus X-1 — bright essentially continuously since 1964) and
    // the quiescent transients, which spend decades faint and erupt rarely.
    // A single shared flare cadence (the Sgr A* default) would misrepresent
    // both: it's too dramatic for Cygnus X-1 and far too frequent for a
    // system whose real outburst cycle is measured in decades.
    diskFlareCfg = target.accretionState === 'persistent'
      ? { period: 6,  spikeWidth: 30, spikeHeight: 0.15, baseOpacity: 0.55 }
      : { period: 22, spikeWidth: 10, spikeHeight: 2.2,  baseOpacity: 0.16 }

    hoverTargets.push({
      obj: disk,
      label: 'Accretion Disk',
      sub: target.accretionState === 'persistent'
        ? `Wind-fed from ${target.companion.spectral_type} · persistently bright, not a transient system`
        : `Roche-lobe overflow from ${target.companion.spectral_type} · shown here mid-outburst — real quiescent state is far fainter`,
    })

    // Accretion-stream hot spot — where Roche-lobe overflow from the companion
    // impacts the outer disk edge. A real, well-documented LMXB feature (it's
    // what produces the orbital-phase "hump" seen in many quiescent light
    // curves). Kept as its own top-level object (not a child of the spinning
    // disk mesh) and re-aligned to the companion's current orbital phase each
    // frame in tick() — the stream always points from the companion inward,
    // regardless of how the disk's own turbulent pattern is spinning.
    hotSpotOrbitR = sep * 0.35 * 0.96
    hotSpotMesh = makeGlowSprite('#ffffff', hotSpotOrbitR * 0.5)
    hotSpotMesh.position.set(hotSpotOrbitR, 0, 0)
    pageGroup.add(hotSpotMesh)
    hoverTargets.push({
      obj: hotSpotMesh,
      label: 'Accretion stream hot spot',
      sub: 'Where Roche-lobe overflow from the companion impacts the disk edge',
    })
  }

  // Companion star — placed at true orbital separation; simple circular
  // approximation animated in tick() over the real orbital period.
  const c = target.companion
  // Capped at a fraction of the orbital separation so the companion sphere
  // never grows to overlap or exceed its own orbit — binding only for the
  // tightest systems (A0620-00, GRO J1655-40), where an absolute size tuned
  // for Cygnus X-1 would otherwise be larger than the whole orbit.
  const visR = Math.min(sep * 0.25, 0.03 + c.radius_rsun * 0.006)
  const starGeo = new THREE.SphereGeometry(visR, 16, 16)
  const starMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(c.color_hex) })
  companionMesh = new THREE.Mesh(starGeo, starMat)
  companionMesh.position.set(sep, 0, 0)
  pageGroup.add(companionMesh)
  companionOrbitAU  = sep
  companionPeriodYr = target.period_days / 365.25

  // Glow so the companion reads clearly against the disk
  const glowSprite = makeGlowSprite(c.color_hex, visR * 3.5)
  glowSprite.position.copy(companionMesh.position)
  companionMesh.userData.glow = glowSprite
  pageGroup.add(glowSprite)

  hoverTargets.push({
    obj: companionMesh,
    label: `${c.spectral_type} (companion)`,
    sub: `${c.mass_msun.toFixed(2)} M☉ · ${c.teff_K.toLocaleString()} K · P=${target.period_days.toFixed(2)} d · a=${sep.toFixed(3)} AU`,
  })

  // Faint orbit path
  const orbitPts: THREE.Vector3[] = []
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2
    orbitPts.push(new THREE.Vector3(sep * Math.cos(a), 0, sep * Math.sin(a)))
  }
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts)
  const orbitMat = new THREE.LineBasicMaterial({ color: new THREE.Color(c.color_hex), transparent: true, opacity: 0.25 })
  pageGroup.add(new THREE.LineLoop(orbitGeo, orbitMat))

  // Anticipated Milky Way field stars — ordinary background population at
  // this system's real galactic position (Jurić et al. 2008 thin-disk
  // model), compressed from their true ~3 pc search radius into this
  // reachable shell. See loadAnticipatedObjects() doc comment.
  void loadAnticipatedObjects(target.id, neighborhoodShellAU / 3.0, neighborhoodShellAU * 0.008)
}

/**
 * Globular cluster IMBH — Omega Centauri. Dense stellar field standing in
 * for the cluster core, plus the small number of hypervelocity tracer stars
 * whose motion is the actual dynamical evidence (Häberle et al. 2024). Their
 * exact orbits aren't published per-star, so they're shown drifting outward
 * from the core — evocative of "moving too fast to be bound," not a literal
 * ephemeris.
 */
function buildGlobularImbhScene(target: GlobularImbhTarget) {
  if (!camera || !controls) return

  const rsS = 0.03
  const photonS = rsS * 1.5
  const iscoS   = rsS * 6.0

  camera.near = 0.01
  camera.far  = 400
  camera.position.set(0, 6, 16)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  controls.minDistance = 0.05
  controls.maxDistance = 80
  controls.target.set(0, 0, 0)

  const pl = new THREE.PointLight(0xffeecc, 2, 30)
  pageGroup.add(pl)

  buildDistantStarField(500, 120)

  const { horizon, photonRing } = buildEventHorizonCore(pageGroup, {
    rsScene: rsS, photonScene: photonS, iscoScene: iscoS,
    diskInnerScene: iscoS * 1.2, diskOuterScene: iscoS * 5,
    diskInnerTempK: 5e5, diskOuterTempK: 8e3,
  })
  bhHorizonMesh = horizon
  bhPhotonRing  = photonRing
  hoverTargets.push({ obj: horizon, label: `${target.label} — Event Horizon`, sub: hoverStatsCommon(target) })

  const { disk, diskMat: mat } = buildAccretionDiskCore(pageGroup, {
    rsScene: rsS, photonScene: photonS, iscoScene: iscoS,
    diskInnerScene: iscoS * 1.2, diskOuterScene: iscoS * 5,
    diskInnerTempK: 5e5, diskOuterTempK: 8e3,
    turbulence: true, turbulenceSeed: target.mass_msun, dopplerPower: 2.5,
  })
  diskMat = mat
  catalogDiskMesh = disk
  // Faint and steady — Häberle et al. 2024 found this IMBH via hypervelocity
  // tracer stars precisely because it isn't feeding enough gas to produce a
  // dramatic, variable disk signature.
  diskFlareCfg = { period: 14, spikeWidth: 20, spikeHeight: 0.1, baseOpacity: 0.25 }
  hoverTargets.push({
    obj: disk,
    label: 'Accretion Disk',
    sub: 'Faint, low-luminosity flow — IMBHs like this one are not actively feeding much gas',
  })

  // Dense cluster core field — ANTICIPATED, generated from a King (1962)
  // profile using Omega Centauri's real core radius (see
  // datagathering/generate_bh_anticipated_objects.py). Scale factor keeps this
  // replacement visually matching the extent of the illustrative field it
  // replaces (previously a hardcoded r^0.5 scatter with no citable profile).
  void loadAnticipatedObjects(target.id, 11 / 6, 0.05)

  // Tracer (hypervelocity) stars — the actual dynamical evidence
  const rng = mulberry32(77)
  tracerStars.length = 0
  for (let i = 0; i < target.tracerStarCount; i++) {
    const dir = new THREE.Vector3(rng() - 0.5, (rng() - 0.5) * 0.6, rng() - 0.5).normalize()
    const startR = 0.3 + rng() * 0.6
    const tGeo = new THREE.SphereGeometry(0.05, 8, 8)
    const tMat = new THREE.MeshBasicMaterial({ color: 0xffe080 })
    const mesh = new THREE.Mesh(tGeo, tMat)
    mesh.position.copy(dir.clone().multiplyScalar(startR))
    pageGroup.add(mesh)
    tracerStars.push({ mesh, driftDir: dir, speed: 0.15 + rng() * 0.1 })
    hoverTargets.push({
      obj: mesh,
      label: `Hypervelocity tracer star ${i + 1}`,
      sub: `~${target.coreVelDispKmS.toFixed(0)} km/s core dispersion · escaping the cluster core`,
    })
  }
}

/**
 * AGN with relativistic jet — M87*. The jet's true length (~5,000 ly) is
 * ~2 million times the horizon scale; rendered at a fixed stylized length
 * instead of true-to-scale (which would make the horizon a sub-pixel dot),
 * same "documented compression" already used for the accretion disk.
 */
function buildAgnJetScene(target: AgnJetTarget) {
  if (!camera || !controls) return

  const EXAG = 2
  const { rs_au, photon_sphere_au, isco_au } = radiiFor(target)
  const rsS = (rs_au / SCENE_AU) * EXAG
  const photonS = (photon_sphere_au / SCENE_AU) * EXAG
  const iscoS   = (isco_au / SCENE_AU) * EXAG

  camera.near = 0.01
  camera.far  = 5000
  camera.position.set(0, 15, 42)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  controls.minDistance = 0.3
  controls.maxDistance = 2000
  controls.target.set(0, 0, 0)

  const pl = new THREE.PointLight(0xffddbb, 3, 60)
  pageGroup.add(pl)

  buildDistantStarField(1200, 900, 0xffeecc)

  const { horizon, photonRing } = buildEventHorizonCore(pageGroup, {
    rsScene: rsS, photonScene: photonS, iscoScene: iscoS,
    diskInnerScene: iscoS * 1.1, diskOuterScene: iscoS * 8,
    diskInnerTempK: 1e6, diskOuterTempK: 1e4,
  })
  bhHorizonMesh = horizon
  bhPhotonRing  = photonRing
  hoverTargets.push({ obj: horizon, label: `${target.label} — Event Horizon`, sub: hoverStatsCommon(target) })

  const { disk, diskMat: mat } = buildAccretionDiskCore(pageGroup, {
    rsScene: rsS, photonScene: photonS, iscoScene: iscoS,
    diskInnerScene: iscoS * 1.1, diskOuterScene: iscoS * 8,
    diskInnerTempK: 1e6, diskOuterTempK: 1e4,
    turbulence: true, turbulenceSeed: target.mass_msun, dopplerPower: 2.5,
  })
  diskMat = mat
  catalogDiskMesh = disk
  // A radiatively-inefficient accretion flow (RIAF) is steady on human
  // timescales, not flare-prone — the dramatic variability belongs to the
  // jet, not the disk, for a source like this.
  diskFlareCfg = { period: 10, spikeWidth: 25, spikeHeight: 0.12, baseOpacity: 0.45 }
  hoverTargets.push({
    obj: disk,
    label: 'Accretion Disk',
    sub: 'Radiatively inefficient accretion flow — the same low-luminosity regime that powers the jet',
  })

  // Relativistic jet — one-sided prominence (the counter-jet is faint/absent
  // due to relativistic beaming, as observed). Tilted slightly toward the
  // line of sight per the catalogued inclination.
  const jetLen = 60
  const jetBaseR = Math.min(iscoS * 0.5, jetLen * 0.025)   // narrow, collimated — never wider than ~2.5% of its length
  const jetTipR  = jetBaseR * 0.08
  const tiltRad = THREE.MathUtils.degToRad(90 - target.jetInclinationDeg) * 0.4
  const jetGroup = new THREE.Group()
  jetGroup.rotation.z = tiltRad
  const segs = 24
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs, t1 = (i + 1) / segs
    const r0 = jetBaseR * (1 - t0) + jetTipR * t0
    const r1 = jetBaseR * (1 - t1) + jetTipR * t1
    const segGeo = new THREE.CylinderGeometry(r1, r0, jetLen / segs, 10, 1, true)
    const segMat = new THREE.MeshBasicMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.5 * (1 - t0 * 0.7),
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const seg = new THREE.Mesh(segGeo, segMat)
    seg.position.y = jetLen * ((t0 + t1) / 2)
    jetGroup.add(seg)
  }
  pageGroup.add(jetGroup)
  hoverTargets.push({
    obj: jetGroup,
    label: 'Relativistic jet',
    sub: `~${target.jetLengthLy.toLocaleString()} ly, one of the best-studied AGN jets · not to scale`,
  })

  // Host galaxy core glow
  const hostGlow = makeGlowSprite('#ffcc88', 14)
  pageGroup.add(hostGlow)
  hoverTargets.push({ obj: hostGlow, label: target.hostGalaxy, sub: target.hostGalaxyType })

  // Anticipated nuclear star cluster — Bahcall & Wolf (1976) relaxed cusp,
  // cross-calibrated against Sgr A*'s own nuclear cluster (see
  // loadAnticipatedObjects() doc comment) — individual stars in M87's nucleus
  // are far beyond resolution from Earth, so this is illustrative density only.
  void loadAnticipatedObjects(target.id, 25, 0.4)
}

/**
 * Megamaser accretion disk — NGC 4258. The maser disk itself (0.13-0.28 pc,
 * mapped via VLBI water-maser Keplerian rotation) is ~35,000-75,000x the
 * horizon radius — even more extreme than Sgr A*'s own disk-vs-horizon gap —
 * so it's rendered at a fixed presentational radius with the true parsec
 * figures in its hover tooltip, rather than the small generic accretion disk
 * used by the other scene types.
 */
function buildMegamaserDiskScene(target: MegamaserDiskTarget) {
  if (!camera || !controls) return

  const COMPACT_EXAG = 40
  const { rs_au, photon_sphere_au, isco_au } = radiiFor(target)
  const rsS = (rs_au / SCENE_AU) * COMPACT_EXAG
  const photonS = (photon_sphere_au / SCENE_AU) * COMPACT_EXAG
  const iscoS   = (isco_au / SCENE_AU) * COMPACT_EXAG

  camera.near = 0.005
  camera.far  = 400
  camera.position.set(0, 9, 22)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  controls.minDistance = 0.1
  controls.maxDistance = 200
  controls.target.set(0, 0, 0)

  const pl = new THREE.PointLight(0xbbddff, 3, 40)
  pageGroup.add(pl)

  buildDistantStarField(600, 300, 0x99bbdd)

  const { horizon, photonRing } = buildEventHorizonCore(pageGroup, {
    rsScene: rsS, photonScene: photonS, iscoScene: iscoS,
    diskInnerScene: iscoS, diskOuterScene: iscoS * 1.01, // no small generic disk — the maser disk (below) takes this role
    diskInnerTempK: 1e4, diskOuterTempK: 1e4,
  })
  bhHorizonMesh = horizon
  bhPhotonRing  = photonRing
  hoverTargets.push({ obj: horizon, label: `${target.label} — Event Horizon`, sub: hoverStatsCommon(target) })

  // The maser disk — edge-on, warped-looking ring at a stylized radius.
  // NGC 4258's real maser disk is known to be slightly warped rather than
  // perfectly flat (Herrnstein et al. 2005) — the per-vertex turbulence here
  // stands in for that non-flat structure rather than a literal warp model.
  const inner = 3, outer = 9
  const geom = new THREE.RingGeometry(inner, outer, 128, 6)
  const posArr = geom.attributes['position'] as THREE.BufferAttribute
  const colArr = new Float32Array(posArr.count * 3)
  for (let i = 0; i < posArr.count; i++) {
    const x = posArr.getX(i), z = posArr.getZ(i)
    const r = Math.sqrt(x * x + z * z)
    const theta = Math.atan2(z, x)
    const t = (r - inner) / (outer - inner)
    const n1 = Math.sin(theta * 6 + t * 8) * 0.5 + 0.5
    const n2 = Math.sin(theta * 13 - t * 4) * 0.5 + 0.5
    const turb = 0.7 + (n1 * 0.6 + n2 * 0.4) * 0.4
    colArr[i*3]   = (0.25 + t * 0.15) * turb
    colArr[i*3+1] = (0.75 - t * 0.1) * turb
    colArr[i*3+2] = (0.85 - t * 0.1) * turb
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colArr, 3))
  const maserMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
  const maserDisk = new THREE.Mesh(geom, maserMat)
  maserDisk.rotation.x = Math.PI / 2
  maserDisk.rotation.z = THREE.MathUtils.degToRad(target.diskInclinationDeg - 90)
  pageGroup.add(maserDisk)
  diskMat = maserMat
  catalogDiskMesh = maserDisk
  // Water masers are steady dynamical tracers, not a variable emission
  // source — a "flare" here would misrepresent the very thing that makes
  // this measurement so precise (constant, model-independent Keplerian
  // rotation). Flat opacity, no brightening cycle.
  diskFlareCfg = { period: 1, spikeWidth: 1, spikeHeight: 0, baseOpacity: 0.6 }

  hoverTargets.push({
    obj: maserDisk,
    label: 'Water-maser disk',
    sub: `${target.diskInnerPc.toFixed(2)}–${target.diskOuterPc.toFixed(2)} pc · Keplerian VLBI rotation — the most precise extragalactic BH mass after Sgr A* · not to scale`,
  })

  // Anticipated nuclear star cluster — same Bahcall & Wolf (1976) cusp model
  // as M87*, scaled to this scene's smaller camera bounds.
  void loadAnticipatedObjects(target.id, 13.5, 0.25)
}

// ── Anticipated-object field ───────────────────────────────────────────────────
//
// Loads public/black-holes/anticipated/<bhId>.json (see
// datagathering/generate_bh_anticipated_objects.py and the companion post
// "What Else Is Out There") and renders it as a single colored Points cloud —
// same performance pattern as buildNuclearStarCluster() and the old inline
// globular field this replaces, since even the smallest of these fields can
// run into the thousands of stars for the two extragalactic nuclei.
//
// pcToSceneUnits is a per-scene-type illustrative compression factor, not a
// literal AU/pc scale — the same "documented compression" already used for
// jet length, disk radii, etc. throughout this file. It's chosen so the real
// field-star neighborhood (which can be many thousands of AU away from a
// tight binary) sits in a reachable shell just beyond the confirmed objects,
// rather than either overlapping them or being physically-accurately distant
// enough to never be seen.

interface AnticipatedObject { id: string; type: string; spectral: SpectralClass; teff_K: number; offset_pc: [number, number, number] }
interface AnticipatedData {
  bh_id: string; category: string; methodology: string
  methodology_note: string; methodology_params: Record<string, number>
  object_count: number; objects: AnticipatedObject[]
}

async function loadAnticipatedObjects(bhId: string, pcToSceneUnits: number, pointSize: number) {
  const myToken = ++anticipatedLoadToken
  let data: AnticipatedData | null = null
  try {
    const res = await fetch(`/black-holes/anticipated/${bhId}.json`)
    if (res.ok) data = await res.json() as AnticipatedData
  } catch {
    data = null   // no anticipated data yet for this object — not an error the user needs to see
  }
  if (myToken !== anticipatedLoadToken) return   // navigated away before this resolved
  if (!data || !data.objects.length) return

  const count = data.objects.length
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const o = data.objects[i]!
    pos[i * 3]     = o.offset_pc[0] * pcToSceneUnits
    pos[i * 3 + 1] = o.offset_pc[1] * pcToSceneUnits
    pos[i * 3 + 2] = o.offset_pc[2] * pcToSceneUnits
    const [r, g, b] = SPECTRAL_RGB[o.spectral]
    col[i * 3] = r / 255; col[i * 3 + 1] = g / 255; col[i * 3 + 2] = b / 255
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const mat = new THREE.PointsMaterial({
    size: pointSize, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.85,
  })
  const points = new THREE.Points(geo, mat)
  points.userData = { type: 'anticipated_field' }
  pageGroup.add(points)
  anticipatedPoints = points

  anticipatedSummary.value = { count: data.object_count, methodology: data.methodology, note: data.methodology_note }
  hoverTargets.push({
    obj: points,
    label: `Anticipated Neighborhood (${data.object_count.toLocaleString()} stars)`,
    sub: `${data.methodology} — generated estimate, not individually observed`,
  })
}

// ── Shared catalog-scene helpers ───────────────────────────────────────────────

function buildDistantStarField(count: number, radius: number, tint = 0x8899aa) {
  if (!scene) return
  const pos = new Float32Array(count * 3)
  const rng = mulberry32(1234)
  for (let i = 0; i < count; i++) {
    const theta = rng() * Math.PI * 2
    const phi   = Math.acos(2 * rng() - 1)
    const r     = radius * (0.4 + rng() * 0.6)
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i*3+2] = r * Math.cos(phi)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({ color: tint, size: radius * 0.0015, sizeAttenuation: true, transparent: true, opacity: 0.5 })
  pageGroup.add(new THREE.Points(geo, mat))
}

function makeGlowSprite(colorHex: string, scale: number): THREE.Sprite {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64
  const ctx = cv.getContext('2d')!
  const col = new THREE.Color(colorHex)
  const rgb = `${Math.round(col.r*255)},${Math.round(col.g*255)},${Math.round(col.b*255)}`
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, `rgba(${rgb},0.9)`); g.addColorStop(0.4, `rgba(${rgb},0.25)`); g.addColorStop(1, `rgba(${rgb},0)`)
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(cv)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  const sp = new THREE.Sprite(mat)
  sp.scale.setScalar(scale)
  return sp
}

// ── Animation loop ────────────────────────────────────────────────────────────

function tick() {
  const dt = clock.getDelta()
  if (!paused.value) {
    simEpoch.value += dt * (WARP_STEPS[warpIdx.value]!.yr_per_s)
  }

  // Update S-star dot positions
  for (let i = 0; i < S_STARS.length; i++) {
    const star = S_STARS[i]!
    const pos  = sStarPositionAU(star, simEpoch.value)
    starDots[i]?.position.set(pos[0] / SCENE_AU, pos[2] / SCENE_AU, pos[1] / SCENE_AU)
  }

  // Photon-ring shimmer — subtle brightness variation representing turbulent
  // lensed light near the shadow boundary (the horizon itself never pulses —
  // it's a pure shadow, not a light source)
  if (bhPhotonRing) {
    const shimmer = 0.70 + 0.15 * Math.sin(clock.getElapsedTime() * 3.2);
    (bhPhotonRing.material as THREE.MeshBasicMaterial).opacity = shimmer
  }

  // Stylized disk flare — see flareEnvelope() comment and diskFlareCfg above.
  // Tuned per-scene: Sgr A* keeps its original daily-flare-derived cadence;
  // catalog scenes set their own cfg reflecting how that specific object
  // actually behaves (persistent/steady vs quiescent-with-rare-outburst).
  if (diskMat) {
    diskMat.opacity = diskFlareCfg.baseOpacity * flareEnvelope(
      clock.getElapsedTime(), diskFlareCfg.period, diskFlareCfg.spikeWidth, diskFlareCfg.spikeHeight
    )
  }

  // Highlight selected zone ring
  for (const { mesh, zoneId } of zoneRings) {
    const active = selectedZone.value?.id === zoneId;
    (mesh.material as THREE.MeshBasicMaterial).opacity = active ? 0.9 : 0.25
  }

  // IRS 13E slow orbit animation (simplified — just wobble)
  if (irs13eMesh) {
    const t = clock.getElapsedTime() * 0.012  // very slow
    const irs = COMPACT_OBJECTS[0]!
    const bx  = irs.offset_au[0]! / SCENE_AU
    const bz  = irs.offset_au[1]! / SCENE_AU
    irs13eMesh.position.x = bx + Math.cos(t) * 0.3
    irs13eMesh.position.z = bz + Math.sin(t) * 0.3
  }

  // Companion star orbital motion (x-ray binaries only — companionMesh stays
  // null for every other scene type, so this is a no-op elsewhere)
  if (companionMesh && companionOrbitAU > 0) {
    const phase = (simEpoch.value / companionPeriodYr) * Math.PI * 2
    companionMesh.position.set(companionOrbitAU * Math.cos(phase), 0, companionOrbitAU * Math.sin(phase))
    const glow = companionMesh.userData.glow as THREE.Sprite | undefined
    if (glow) glow.position.copy(companionMesh.position)

    // Hot spot stays aligned with the companion's current direction — the
    // stream always flows from wherever the companion currently is, not
    // wherever the disk's own turbulent spin has carried a fixed point
    if (hotSpotMesh) hotSpotMesh.position.set(hotSpotOrbitR * Math.cos(phase), 0, hotSpotOrbitR * Math.sin(phase))
  }

  // Hypervelocity tracer stars — slow outward drift, evoking "escaping the
  // cluster core" (see buildGlobularImbhScene comment on why not literal orbits)
  for (const ts of tracerStars) {
    ts.mesh.position.addScaledVector(ts.driftDir, ts.speed * dt)
    if (ts.mesh.position.length() > 9) {
      ts.mesh.position.copy(ts.driftDir).multiplyScalar(0.3)
    }
  }

  // Slow disk spin (catalog scenes only — Sgr A*'s disk never rotates).
  // rotateZ() composes around the mesh's own local Z axis (its geometric
  // normal, before the disk.rotation.x/z orientation was applied at build
  // time) via quaternion multiplication, so it spins correctly within the
  // disk's tilted plane regardless of that fixed orientation.
  if (catalogDiskMesh) {
    catalogDiskMesh.rotateZ(dt * 0.08)
  }

  // Update camera distance for scale label
  if (camera) {
    camDist.value = camera.position.length()
  }
}

// ── Interaction ───────────────────────────────────────────────────────────────

function onMouseMove(ev: MouseEvent) {
  if (!camera) return
  const w = window.innerWidth, h = window.innerHeight - VIZ_BAR_H
  mouseNDC.x =  (ev.clientX / w) * 2 - 1
  mouseNDC.y = -((ev.clientY - VIZ_BAR_H) / h) * 2 + 1

  raycaster.setFromCamera(mouseNDC, camera)
  const targets  = hoverTargets.map(h => h.obj)
  const hits     = raycaster.intersectObjects(targets, true)

  if (hits.length > 0) {
    const hitObj = hits[0]!.object
    const entry  = hoverTargets.find(h => h.obj === hitObj || hitObj.parent === h.obj)
    if (entry) {
      hoverInfo.value = { label: entry.label, sub: entry.sub }
      hoverX.value    = ev.clientX + 12
      hoverY.value    = ev.clientY - 8
      return
    }
  }
  hoverInfo.value = null
}

function onMouseLeave() {
  hoverInfo.value = null
}

function onClick(ev: MouseEvent) {
  if (!camera) return
  const w = window.innerWidth, h = window.innerHeight - VIZ_BAR_H
  mouseNDC.x =  (ev.clientX / w) * 2 - 1
  mouseNDC.y = -((ev.clientY - VIZ_BAR_H) / h) * 2 + 1

  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(hoverTargets.map(h => h.obj), true)
  if (!hits.length) return

  const hitObj = hits[0]!.object
  const entry  = hoverTargets.find(h => h.obj === hitObj || hitObj.parent === h.obj)
  if (entry?.onClickId === 'irs13e') {
    irs13eSelected.value = !irs13eSelected.value
  }
}

// ── UI actions ────────────────────────────────────────────────────────────────

function selectZone(zone: SettlementZone) {
  selectedZone.value = selectedZone.value?.id === zone.id ? null : zone
}

function claimSettlement(zone: SettlementZone | undefined) {
  if (!zone) return
  addSettlement({
    key:         `sgra-${zone.id}`,
    type:        'bh-orbital',
    planetName:  zone.id,
    hostname:    'Sgr-A*',
    exolocation: zone.exoloc_address,
    displayName: `${zone.label} · Sgr A*`,
  })
  void router.push(`/mint?mode=bh-orbital&bh=Sgr-A*&zone=${encodeURIComponent(zone.id)}&addr=${encodeURIComponent(zone.exoloc_address)}`)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

// Disposes and clears every scene object plus the animation-state that
// tick() reads, without touching the tick registration itself. Needed both
// on unmount and when navigating between two different catalog black holes —
// vue-router reuses this component instance for bhId-only param changes
// (same route record), so onMounted/buildScene never re-fire on their own.
function teardownSceneObjects() {
  disposeScene(pageGroup)
  pageGroup.clear()
  scene?.remove(pageGroup)

  starDots.length    = 0
  tracerStars.length = 0
  hoverTargets.length = 0
  zoneRings.length   = 0

  bhHorizonMesh  = null
  bhPhotonRing   = null
  diskMat        = null
  irs13eMesh     = null
  companionMesh  = null
  companionOrbitAU  = 0
  companionPeriodYr = 0
  hotSpotMesh    = null
  hotSpotOrbitR  = 0
  catalogDiskMesh = null
  diskFlareCfg   = { period: 9, spikeWidth: 14, spikeHeight: 0.7, baseOpacity: 0.55 }
  anticipatedPoints = null
  anticipatedSummary.value = null
  anticipatedLoadToken++   // invalidate any in-flight fetch from the scene being torn down
}

onMounted(async () => {
  // Await a tick so MainLayout's onMounted (which calls viz.init()) runs first —
  // this page can otherwise mount before the shared renderer exists.
  await Promise.resolve()
  buildScene()
  if (!camera || !controls || !renderer || !scene) return  // WebGL unavailable

  _stopTick = viz.addTick(tick)
})

// Rebuild when the :bhId param changes to a different object while this
// component stays mounted (e.g. navigating from one catalog black hole
// straight to another via the /black-holes index). buildScene() sets the new
// scene's camera position/target instantly via .set() — without the tween
// below that would read as a hard cut, not the continuous vector zoom every
// other transition on this site uses. So: capture where the camera actually
// is, let buildScene() compute where it wants to be, snap back to the start,
// then GSAP-tween from start to destination.
watch(bhIdParam, (next, prev) => {
  if (next === prev || !camera || !controls) return

  // Every scene builder (Sgr A* and all 4 catalog dressings) targets the
  // origin, but each uses its own scene-unit scale — Cygnus X-1's "19" is an
  // AU-direct coordinate, M87*'s "19" sits almost on top of the horizon.
  // Tweening the raw camera.position vector straight across that boundary
  // (the first version of this fix) reads as a jarring crash-zoom, not a
  // continuous flight, because the same number means wildly different
  // physical things in each frame. Fix: pull the camera back to a safe
  // distance in the OLD scene's own scale, swap the scene, place the camera
  // at the equivalent pulled-back distance in the NEW scene's scale (same
  // viewing direction, for continuity), then dive in to the new default view.
  const oldMaxDist = controls.maxDistance
  const dir = camera.position.clone().sub(controls.target)
  if (dir.lengthSq() < 1e-12) dir.set(0, 0.3, 1)
  dir.normalize()
  const pullBackOld = controls.target.clone().addScaledVector(dir, oldMaxDist * 1.4)

  controls.enabled = false
  const oldFar = camera.far
  camera.far = Math.max(oldFar, oldMaxDist * 4)
  camera.updateProjectionMatrix()

  gsap.to(camera.position, {
    duration: 0.45, ease: 'power1.in',
    x: pullBackOld.x, y: pullBackOld.y, z: pullBackOld.z,
    onUpdate: () => controls?.update(),
    onComplete: () => {
      teardownSceneObjects()
      selectedZone.value   = null
      irs13eSelected.value = false
      hoverInfo.value      = null
      buildScene()
      if (!camera || !controls) { if (controls) controls.enabled = true; return }

      const toPos     = camera.position.clone()
      const toTarget  = controls.target.clone()
      const toNear    = camera.near, toFar = camera.far
      const toMinDist = controls.minDistance, toMaxDist = controls.maxDistance

      const newDirSrc = toPos.clone().sub(toTarget)
      const newDir = newDirSrc.lengthSq() > 1e-12 ? newDirSrc.normalize() : dir.clone()
      const pullBackNew = toTarget.clone().addScaledVector(newDir, toMaxDist * 1.4)

      camera.near = Math.min(toNear, 0.0001)
      camera.far  = Math.max(toFar, toMaxDist * 4)
      camera.updateProjectionMatrix()
      controls.minDistance = 0
      controls.maxDistance = toMaxDist * 4
      camera.position.copy(pullBackNew)
      controls.update()

      gsap.to(camera.position, {
        duration: 1.1, ease: 'power2.inOut',
        x: toPos.x, y: toPos.y, z: toPos.z,
        onUpdate: () => controls?.update(),
        onComplete: () => {
          if (!camera || !controls) return
          camera.near = toNear
          camera.far  = toFar
          camera.updateProjectionMatrix()
          controls.minDistance = toMinDist
          controls.maxDistance = toMaxDist
          controls.enabled = true
        },
      })
    },
  })
})

onUnmounted(() => {
  _stopTick?.()
  _stopTick = null

  teardownSceneObjects()
  if (scene) {
    scene.background = null
    scene.fog        = null
  }
})

// ── Utility ───────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
</script>

<style scoped>
.gc-page { position: relative; width: 100%; height: 100vh; overflow: hidden; cursor: grab; background: #000205; }
.gc-page:active { cursor: grabbing; }

/* Breadcrumb */
.gc-breadcrumb {
  position: absolute; top: 12px; left: 12px; z-index: 10;
  display: flex; align-items: center; gap: 4px;
  background: rgba(0,0,0,0.55); border-radius: 6px; padding: 2px 8px;
}
.gc-bc-sep { font-size: 11px; color: #445566; }
.gc-bc-cur { font-size: 10px; letter-spacing: 0.08em; color: #88aacc; }

/* Top overlay */
.gc-top-overlay {
  position: absolute; top: 44px; left: 12px; z-index: 10;
  background: rgba(0,2,8,0.72); border: 1px solid rgba(80,120,180,0.18);
  border-radius: 8px; padding: 10px 14px; min-width: 220px;
  pointer-events: auto;
}
.gc-eyebrow { font-size: 8px; letter-spacing: 0.14em; color: #556677; margin-bottom: 8px; }
.gc-stat-row { display: flex; gap: 6px; margin-bottom: 2px; }
.gc-stat-key { font-size: 9px; color: #4a6070; flex: 0 0 120px; }
.gc-stat-val { font-size: 9px; color: #88c0dd; font-family: monospace; }
.gc-time-ctrl { display: flex; gap: 2px; }

/* Zone panel (right) */
.gc-zone-panel {
  position: absolute; top: 12px; right: 0; z-index: 10;
  width: 48px; transition: width 0.25s ease;
  background: rgba(0,2,8,0.80); border-left: 1px solid rgba(80,120,180,0.15);
  border-radius: 0 0 0 8px;
  overflow: hidden;
}
.gc-zone-panel--open { width: 220px; }

.gc-zp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; cursor: pointer;
  border-bottom: 1px solid rgba(80,120,180,0.12);
}
.gc-zp-title { font-size: 9px; letter-spacing: 0.12em; color: #aab8c4; }

.gc-zp-body { padding: 6px; display: flex; flex-direction: column; gap: 4px; }

.gc-evidence-card { padding: 8px; }
.gc-evidence-text { font-size: 9.5px; line-height: 1.6; color: rgba(180,200,220,0.75); margin-top: 3px; }

.gc-zone-card {
  padding: 7px 10px; border-radius: 5px; cursor: pointer;
  border: 1px solid rgba(80,120,180,0.12);
  background: rgba(10,20,30,0.4);
  transition: background 0.15s, border-color 0.15s;
}
.gc-zone-card:hover { background: rgba(30,50,80,0.5); border-color: rgba(120,160,200,0.3); }
.gc-zone-card--active { background: rgba(40,70,110,0.6); border-color: rgba(180,200,220,0.4); }

.gc-zc-label { font-size: 9px; color: #b8ccdd; margin-bottom: 2px; }
.gc-zc-dist  { font-size: 8px; color: #556070; font-family: monospace; margin-bottom: 2px; }
.gc-zc-rad   { font-size: 7px; letter-spacing: 0.08em; }

/* Zone detail drawer (bottom-center) */
.gc-zone-detail {
  position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
  z-index: 20; width: min(480px, 90vw);
  background: rgba(0,4,12,0.92); border: 1px solid rgba(100,140,200,0.25);
  border-radius: 10px; padding: 14px 18px;
}
.gc-zd-close {
  position: absolute; top: 8px; right: 10px;
  background: none; border: none; color: #556070; cursor: pointer; font-size: 13px;
}
.gc-zd-label { font-size: 13px; color: #c8d8e8; margin-bottom: 2px; }
.gc-zd-addr  { font-size: 8px; color: #446688; font-family: monospace; margin-bottom: 8px; }
.gc-zd-stats { display: flex; gap: 16px; margin-bottom: 8px; }
.gc-zd-stat  { display: flex; flex-direction: column; gap: 2px; }
.gc-zd-k     { font-size: 8px; color: #4a5e6e; }
.gc-zd-v     { font-size: 9px; color: #88c0dd; font-family: monospace; }
.gc-zd-focus { font-size: 9px; color: #7a9ab0; margin-bottom: 4px; }
.gc-zd-note  { font-size: 9px; color: #556070; line-height: 1.5; }

/* IRS 13E panel */
.gc-irs-panel {
  position: absolute; top: 50%; right: 250px; transform: translateY(-50%);
  z-index: 20; width: 280px;
  background: rgba(0,4,12,0.92); border: 1px solid rgba(255,153,68,0.3);
  border-radius: 10px; padding: 14px 18px;
}
.gc-irs-dist { font-size: 9px; color: #ff9944; font-family: monospace; margin-bottom: 8px; }
.gc-irs-body { font-size: 9px; color: #7a9090; line-height: 1.6; margin-bottom: 8px; }

/* Hover tooltip */
.gc-hover-box {
  position: fixed; z-index: 30; pointer-events: none;
  background: rgba(0,4,12,0.88); border: 1px solid rgba(100,140,200,0.3);
  border-radius: 5px; padding: 5px 10px;
}
.gc-hb-name { font-size: 10px; color: #c8d8e8; }
.gc-hb-sub  { font-size: 8px;  color: #667788; margin-top: 2px; }

/* Educational link */
.gc-edu-link {
  position: absolute; bottom: 16px; right: 250px; z-index: 10;
  background: rgba(0,2,8,0.65); border-radius: 5px; padding: 2px 4px;
}

/* Legend */
.gc-legend {
  position: absolute; bottom: 16px; left: 12px; z-index: 10;
  display: flex; flex-direction: column; gap: 4px;
}
.gc-leg-item { display: flex; align-items: center; gap: 5px; }
.gc-leg-dot  { display: inline-block; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.gc-leg-name { font-size: 8px; color: #556070; letter-spacing: 0.06em; }

/* Transitions */
.zone-detail-enter-active, .zone-detail-leave-active { transition: opacity 0.2s, transform 0.2s; }
.zone-detail-enter-from, .zone-detail-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
.hover-fade-enter-active, .hover-fade-leave-active { transition: opacity 0.1s; }
.hover-fade-enter-from, .hover-fade-leave-to { opacity: 0; }
</style>
