<template>
  <q-page class="viz-overlay-page"
    @mousemove="onHover"
    @mouseleave="clearHover"
    @click="onClick"
  >

    <!-- Status overlay — top left -->
    <div class="space-overlay" style="top:12px;left:12px;max-width:320px">
      <div class="text-caption text-cyan-3" style="letter-spacing:0.1em">
        {{ mode === 'system' ? 'SYSTEM VIEW' : 'GALAXY VIEW' }}
      </div>
      <div class="text-caption text-blue-grey-4 q-mt-xs">{{ statusText }}</div>
    </div>

    <!-- Hover info card -->
    <Transition name="hover-fade">
      <!-- ── Activity badge hover panel ─────────────────────────────── -->
      <div v-if="hoveredInfo" class="hover-box" :style="hoverStyle">
        <div class="hb-name">{{ hoveredInfo.name }}</div>
        <div class="hb-spec">
          {{ hoveredInfo.spec ?? '—' }}
          <span v-if="hoveredInfo.dist" class="hb-dot">·</span>
          {{ hoveredInfo.dist }}
        </div>

        <!-- System composition badges -->
        <div class="hb-row hb-row--system">
          <span class="hb-badge hb-badge--planets" :title="`${hoveredInfo.planets ?? 0} confirmed planets`">
            ★ {{ hoveredInfo.planets ?? 0 }}
          </span>
          <span class="hb-badge hb-badge--moons" :title="`${hoveredInfo.moons ?? 0} known moons`">
            ⟳ {{ hoveredInfo.moons ?? 0 }}
          </span>
          <span v-if="(hoveredInfo.stars ?? 1) > 1" class="hb-badge hb-badge--binary"
            :title="`${hoveredInfo.stars}-star system`">
            ★★ {{ hoveredInfo.stars }}
          </span>
          <span v-if="hoveredInfo.hz" class="hb-badge hb-badge--hz" title="Habitable zone planet">
            HZ ✓
          </span>
        </div>

        <!-- Activity badges — live counts when pon.ink data available -->
        <div class="hb-row hb-row--activity">
          <span class="hb-badge hb-badge--settlement"
            :class="{ 'hb-badge--live': (hoveredInfo.settledCount ?? 0) > 0 }"
            title="Active settlements">
            ⬡ {{ hoveredInfo.settledCount ? hoveredInfo.settledCount : '—' }}
          </span>
          <span class="hb-badge hb-badge--art"
            :class="{ 'hb-badge--live': (hoveredInfo.artCount ?? 0) > 0 }"
            title="Art / gallery NFTs at this system">
            ♪ {{ hoveredInfo.artCount ? hoveredInfo.artCount : '—' }}
          </span>
          <span class="hb-badge hb-badge--science"
            :class="{ 'hb-badge--live': (hoveredInfo.ecoOpsCount ?? 0) > 0 }"
            title="Eco-ops / citizen science check-ins">
            ◈ {{ hoveredInfo.ecoOpsCount ? hoveredInfo.ecoOpsCount : '—' }}
          </span>
        </div>

        <div v-if="hoveredInfo.note" class="hb-note">{{ hoveredInfo.note }}</div>
      </div>
    </Transition>

    <!-- Navigator inset — bottom-right, visible in system view -->
    <NavigatorInset
      v-if="mode === 'system' && currentSystem"
      mode="neighborhood"
      :hostname="currentSystem.hostname"
    />

    <!-- ── Two-stage zoom HUD badge ─────────────────────────────── -->
    <Transition name="zoom-badge">
      <div v-if="zoomStage > 0 && mode === 'galaxy'" class="zoom-stage-badge">
        <span class="zsb-stage">{{ zoomStage }}/2</span>
        <span class="zsb-label">
          {{ zoomStage === 1 ? `Approaching  ${approachSystem?.hostname ?? ''}  · click again to enter` : 'Entering system…' }}
        </span>
      </div>
    </Transition>

    <!-- Planet entry fade overlay -->
    <Transition name="planet-fade">
      <div v-if="enteringPlanet" class="planet-entry-overlay" />
    </Transition>

    <!-- ── Persistent system preview panel (galaxy mode) ────────────── -->
    <Transition name="preview-slide">
      <div
        v-if="previewSystem && mode === 'galaxy'"
        class="sys-preview"
        @mouseenter="cancelPreviewDismiss"
        @mouseleave="startPreviewDismiss"
      >
        <!-- Header -->
        <div class="sp-head">
          <div class="sp-star-dot" :style="{ background: '#' + previewStarColor }" />
          <div class="sp-title">
            <div class="sp-name">{{ previewSystem.hostname }}</div>
            <div class="sp-spec">
              {{ previewSystem.st_spectype ?? '—' }}
              <span v-if="previewSystem.sy_dist"> · {{ previewSystem.sy_dist.toFixed(1) }} pc</span>
              <span v-if="previewSystem.st_teff"> · {{ Math.round(previewSystem.st_teff) }} K</span>
            </div>
          </div>
          <q-btn flat dense round icon="close" size="xs" color="blue-grey-7"
                 class="q-ml-auto" @click="previewSystem = null" />
        </div>

        <!-- Composition badges -->
        <div class="sp-badges">
          <span class="sp-badge sp-badge--planets">
            ★ {{ previewSystem.planets.length }} planet{{ previewSystem.planets.length !== 1 ? 's' : '' }}
          </span>
          <span v-if="previewSystem.sy_mnum > 0" class="sp-badge sp-badge--moons">
            ⟳ {{ previewSystem.sy_mnum }} moon{{ previewSystem.sy_mnum !== 1 ? 's' : '' }}
          </span>
          <span v-if="(previewSystem.sy_snum ?? 1) > 1" class="sp-badge sp-badge--binary">★★ binary</span>
          <span v-if="isHZSystem(previewSystem)" class="sp-badge sp-badge--hz">HZ ✓</span>
        </div>

        <div class="sp-sep" />

        <!-- Planet list -->
        <div class="sp-planet-list">
          <div
            v-for="p in previewSystem.planets.slice(0, 4)"
            :key="p.pl_name"
            class="sp-planet"
          >
            <div class="sp-planet-dot" :style="{ background: '#' + planetColorHex(p) }" />
            <span class="sp-planet-name">{{ p.pl_name }}</span>
            <span class="sp-planet-stat">
              {{ p.pl_eqt != null ? Math.round(p.pl_eqt) + ' K' : '' }}
              {{ p.pl_rade != null ? ' · ' + p.pl_rade.toFixed(1) + 'R⊕' : '' }}
            </span>
          </div>
          <div v-if="previewSystem.planets.length > 4" class="sp-more">
            + {{ previewSystem.planets.length - 4 }} more
          </div>
        </div>

        <!-- Activity row — settlement / art / eco-ops -->
        <div class="sp-activity">
          <span class="sp-act-badge" title="Settlements">⬡ —</span>
          <span class="sp-act-badge" title="Art NFTs">♪ —</span>
          <span class="sp-act-badge" title="Eco-ops check-ins">◈ —</span>
        </div>

        <!-- CTA -->
        <q-btn
          dense unelevated rounded
          color="cyan-9" icon="mdi-arrow-right-circle-outline"
          label="Enter System"
          class="full-width sp-enter"
          @click="enterSystemFromPreview"
        />
      </div>
    </Transition>

    <!-- ── Non-confirmed system panel (candidate / frontier / theoretical) ── -->
    <Transition name="preview-slide">
      <div
        v-if="clickedNonConfirmed && mode === 'galaxy'"
        class="sys-preview ncs-preview"
      >
        <div class="sp-head">
          <div class="sp-star-dot" :style="{ background: clickedNonConfirmed.dotColor }" />
          <div class="sp-title">
            <div class="sp-name">{{ clickedNonConfirmed.hostname }}</div>
            <div class="sp-spec">{{ clickedNonConfirmed.typeLabel }}</div>
          </div>
          <q-btn flat dense round icon="close" size="xs" color="blue-grey-7"
                 class="q-ml-auto" @click="clickedNonConfirmed = null" />
        </div>

        <div class="sp-badges">
          <span class="sp-badge" :style="{ borderColor: clickedNonConfirmed.badgeColor, color: clickedNonConfirmed.badgeColor }">
            {{ clickedNonConfirmed.statusLabel }}
          </span>
          <span v-if="clickedNonConfirmed.dist" class="sp-badge">
            {{ clickedNonConfirmed.dist }}
          </span>
          <span v-if="clickedNonConfirmed.spec" class="sp-badge">
            {{ clickedNonConfirmed.spec }}
          </span>
        </div>

        <div v-if="clickedNonConfirmed.note" class="sp-sep" />
        <div v-if="clickedNonConfirmed.note" class="text-caption text-blue-grey-6 q-px-xs"
             style="font-size:9px;line-height:1.5">
          {{ clickedNonConfirmed.note }}
        </div>

        <div class="sp-sep" />

        <q-btn
          dense unelevated rounded
          color="amber-9" icon="mdi-map-marker-plus"
          label="Reserve for Settlement"
          class="full-width sp-enter"
          @click="$router.push('/mint')"
        />
      </div>
    </Transition>

    <!-- System-view panel -->
    <Transition name="fade">
      <div v-if="mode === 'system' && currentSystem" class="space-overlay system-panel q-pa-md">
        <div class="text-subtitle1 text-blue-grey-1" style="letter-spacing:0.06em">
          {{ currentSystem.hostname }}
        </div>
        <div class="text-caption text-blue-grey-4 q-mb-xs">
          {{ currentSystem.st_spectype ?? '' }}
          {{ currentSystem.st_teff ? ' · ' + currentSystem.st_teff + ' K' : '' }}
          {{ currentSystem.sy_dist ? ' · ' + currentSystem.sy_dist.toFixed(1) + ' pc' : '' }}
        </div>
        <!-- Stellar detail lens trigger -->
        <button class="stellar-lens-btn" @click="starLensOpen = true">
          <span class="slb-icon">⊕</span> View stellar detail
        </button>
        <q-separator color="blue-grey-8" class="q-my-xs" />
        <div class="text-caption text-blue-grey-5 q-mb-xs">Click to zoom to planet</div>
        <div
          v-for="p in currentSystem.planets"
          :key="p.pl_name"
          class="text-caption q-mb-xs row items-center cursor-pointer planet-row"
          :class="selectedPlanet?.pl_name === p.pl_name ? 'text-cyan-3 planet-row--selected' : 'text-blue-grey-3'"
          @click="goToSurface(p.pl_name)"
        >
          <div
            class="planet-dot q-mr-sm"
            :style="{ background: '#' + planetColorHex(p) }"
          />
          {{ p.pl_name }}
          <span class="text-blue-grey-5 q-ml-xs">
            {{ p.pl_eqt != null ? p.pl_eqt + ' K' : '' }}
            {{ p.pl_rade != null ? ' · ' + p.pl_rade.toFixed(1) + ' R⊕' : '' }}
          </span>
          <q-icon v-if="selectedPlanet?.pl_name === p.pl_name"
            name="chevron_right" size="14px" color="cyan-5" class="q-ml-auto" />
        </div>
      </div>
    </Transition>

    <!-- Planet detail card -->
    <Transition name="fade">
      <div v-if="selectedPlanet" class="space-overlay planet-card q-pa-md">
        <!-- Header row -->
        <div class="row items-center q-mb-xs">
          <div class="planet-card-dot q-mr-sm"
               :style="{ background: '#' + planetColorHex(selectedPlanet) }" />
          <div class="text-subtitle2 text-blue-grey-1" style="letter-spacing:0.05em">
            {{ selectedPlanet.pl_name }}
          </div>
          <q-btn flat dense round icon="close" color="blue-grey-5" size="xs"
            class="q-ml-auto" @click="selectedPlanet = null" />
        </div>
        <div class="text-caption text-cyan-6 q-mb-xs">
          Exoplanet · {{ selectedPlanet.hostname }}
          {{ selectedPlanet.st_spectype ? ' · ' + selectedPlanet.st_spectype : '' }}
        </div>

        <!-- Physical classification badge (descriptive, not a rarity/value tier) -->
        <div v-if="selectedClass" class="pclass-badge q-mb-sm"
             :style="{ borderColor: selectedClass.color, color: selectedClass.color }">
          <span class="pclass-label">{{ selectedClass.label }}</span>
          <span class="pclass-desc">{{ selectedClass.desc }}</span>
        </div>

        <!-- Data sheet accordion toggle -->
        <button class="planet-card-accordion" @click="planetCardExpanded = !planetCardExpanded">
          <span class="pca-arrow">{{ planetCardExpanded ? '▾' : '▸' }}</span>
          <span class="pca-label">DATA SHEET</span>
          <span class="pca-hint">{{ planetCardExpanded ? 'collapse' : Object.keys(planetCardStats).length + ' fields' }}</span>
        </button>

        <!-- Collapsible stats body -->
        <Transition name="pca-slide">
          <div v-if="planetCardExpanded" class="planet-card-stats">
            <div v-for="(val, key) in planetCardStats" :key="key"
                 class="row justify-between q-mb-xs">
              <span class="text-caption text-blue-grey-5">{{ key }}</span>
              <span class="text-caption text-blue-grey-2 text-right" style="max-width:58%">{{ val }}</span>
            </div>
          </div>
        </Transition>

        <q-separator color="blue-grey-8" class="q-mt-xs q-mb-sm" />
        <q-btn
          dense rounded unelevated
          color="cyan-8" icon="public" label="Enter Surface"
          class="full-width"
          :loading="enteringPlanet"
          @click="enterPlanetSurface(selectedPlanet)"
        />
      </div>
    </Transition>

    <!-- ── Galaxy view layer controls (bottom-right) ──────────────── -->

    <!-- GALAXY MODE: three toggle pill layers -->
    <div v-if="mode === 'galaxy'" class="gl-controls">
      <button
        :class="['gl-pill', { 'gl-pill--on': filterHZ }]"
        @click="filterHZ = !filterHZ"
        title="Highlight systems with a planet in the habitable zone — others fade"
      >
        <span class="gl-pip" :style="{ background: filterHZ ? '#22ff88' : '#3a5a4a' }" />
        HABITABLE ZONE
      </button>
      <button
        :class="['gl-pill', { 'gl-pill--on': filterNearby }]"
        @click="filterNearby = !filterNearby"
        title="Highlight star systems within 150 pc of Earth"
      >
        <span class="gl-pip" :style="{ background: filterNearby ? '#00e5ff' : '#1a4055' }" />
        NEARBY
      </button>
      <button
        :class="['gl-pill', { 'gl-pill--on': showPredicted }]"
        @click="showPredicted = !showPredicted"
        title="Toggle candidate and frontier star systems predicted by survey zones"
      >
        <span class="gl-pip" :style="{ background: showPredicted ? '#f0a030' : '#3a2d10' }" />
        FRONTIER
      </button>
    </div>

    <!-- SYSTEM MODE: icon-only controls on the LEFT — clear of the NavigatorInset -->
    <!-- Labels slide out on hover so the buttons never block the neighborhood viewer -->
    <div v-if="mode === 'system'" class="sys-controls">

      <button class="sys-btn"
        @click="focusedPlanet ? defocusPlanet() : exitSystem()"
        :title="focusedPlanet ? 'Return to system view' : 'Return to galaxy map'">
        <span class="sys-icon">←</span>
        <span class="sys-label">{{ focusedPlanet ? 'SYSTEM' : 'GALAXY' }}</span>
      </button>

      <button
        class="sys-btn sys-btn--surface"
        :class="{ 'sys-btn--disabled': !selectedPlanet }"
        :disabled="!selectedPlanet"
        @click="selectedPlanet && enterPlanetSurface(selectedPlanet)"
        :title="selectedPlanet ? `Enter surface of ${selectedPlanet.pl_name}` : 'Select a planet first'"
      >
        <span class="sys-icon">↗</span>
        <span class="sys-label">{{ selectedPlanet ? 'SURFACE' : 'SELECT PLANET' }}</span>
      </button>

      <button class="sys-btn"
        @click="onContextZoom"
        title="Zoom out to see Earth and this system together">
        <span class="sys-icon">↔</span>
        <span class="sys-label">EARTH ↔</span>
      </button>

      <!-- Release orbit (shown while co-orbiting) -->
      <button v-if="focusedPlanet && planetCamFollow && planetCamMode === 'orbit'"
        class="sys-btn sys-btn--active"
        @click="togglePlanetFollow('orbit')"
        title="Release co-orbit — return to free camera">
        <span class="sys-icon">⊙</span>
        <span class="sys-label">RELEASE</span>
      </button>

      <!-- DK.MAT — elevated dark matter scope (always available when planet focused) -->
      <button v-if="focusedPlanet"
        class="sys-btn sys-btn--dkmat"
        :class="{ 'sys-btn--active': planetCamFollow && planetCamMode === 'dkmat' }"
        @click="togglePlanetFollow('dkmat')"
        title="Dark matter scope — ascend above the orbital plane">
        <span class="sys-icon">◈</span>
        <span class="sys-label">DK.MAT</span>
      </button>


    </div>

    <!-- Legend toggle + panel — bottom left, hidden by default -->
    <div class="legend-anchor">
      <!-- Toggle button — always visible -->
      <button class="legend-toggle" @click="showLegend = !showLegend" :title="showLegend ? 'Hide key' : 'Show map key'">
        <span class="legend-toggle__icon">◉</span>
        <span class="legend-toggle__label">{{ showLegend ? 'HIDE KEY' : 'MAP KEY' }}</span>
      </button>

      <!-- Panel — shown on demand -->
      <Transition name="legend-slide">
        <div v-if="showLegend" class="legend-block q-pa-sm">
          <div class="legend-section">STAR TYPE</div>
          <div v-for="s in starLegend" :key="s.label" class="legend-row">
            <span class="legend-dot" :style="{ background: s.color }" />
            <span class="text-caption text-blue-grey-4">{{ s.label }}</span>
          </div>

          <!-- Tier 1: PLANET TEMP accordion -->
          <button class="legend-accordion" @click="showPlanetLegend = !showPlanetLegend">
            <span class="legend-accordion__arrow">{{ showPlanetLegend ? '▾' : '▸' }}</span>
            <span class="legend-section legend-section--inline">PLANET TEMP</span>
          </button>
          <template v-if="showPlanetLegend">
            <div v-for="s in planetLegend" :key="s.label" class="legend-row legend-row--indented">
              <span class="legend-dot" :style="{ background: s.color }" />
              <span class="text-caption text-blue-grey-4">{{ s.label }}</span>
            </div>
          </template>

          <!-- Tier 2: ACTIVITY PIPS + HOVER BADGES accordion -->
          <button class="legend-accordion" @click="showActivityLegend = !showActivityLegend">
            <span class="legend-accordion__arrow">{{ showActivityLegend ? '▾' : '▸' }}</span>
            <span class="legend-section legend-section--inline">ACTIVITY &amp; BADGES</span>
          </button>
          <template v-if="showActivityLegend">
            <div class="legend-section legend-section--sub">ACTIVITY PIPS</div>
            <div v-for="s in pipLegend" :key="s.label" class="legend-row legend-row--indented">
              <span class="legend-dot legend-pip" :style="{ background: s.color }" />
              <span class="text-caption text-blue-grey-4">{{ s.label }}</span>
            </div>
            <div class="legend-section legend-section--sub" style="margin-top:4px">HOVER BADGES</div>
            <div class="legend-badge-row legend-badge-row--indented">
              <span class="legend-badge" style="color:#b0e0b0">⬡ n</span>
              <span class="text-caption text-blue-grey-5">settlements</span>
            </div>
            <div class="legend-badge-row legend-badge-row--indented">
              <span class="legend-badge" style="color:#c8a0e0">♪ n</span>
              <span class="text-caption text-blue-grey-5">art / $BARS</span>
            </div>
            <div class="legend-badge-row legend-badge-row--indented">
              <span class="legend-badge" style="color:#a0c8e0">◈ n</span>
              <span class="text-caption text-blue-grey-5">eco-ops</span>
            </div>
            <div class="legend-badge-row legend-badge-row--indented">
              <span class="legend-badge" style="color:#888">—</span>
              <span class="text-caption text-blue-grey-6">no data yet</span>
            </div>
          </template>
        </div>
      </Transition>
    </div>

    <!-- Loading -->
    <Transition name="fade">
      <div v-if="!loaded" class="loading-overlay column items-center justify-center">
        <q-spinner-orbit color="cyan" size="52px" />
        <div class="text-caption text-blue-grey-4 q-mt-sm">Loading star systems…</div>
      </div>
    </Transition>

    <!-- ── Stellar detail lens overlay ──────────────────────────────── -->
    <StarDetailLens
      v-if="starLensOpen && currentSystem"
      :sys="currentSystem"
      @close="starLensOpen = false"
    />

    <DefenderNav
      ref="defenderNav"
      :mode="mode === 'system' ? 'system' : 'cosmic'"
      :sceneLabel="mode === 'system' ? (currentSystem?.hostname ?? '') : 'Stellar Neighborhood'"
      :showReturnBtn="hasReturnPosition"
      @flyTo="onDefenderFlyTo"
      @portalTo="onDefenderPortalTo"
      @contextZoom="onContextZoom"
      @returnToPrev="onReturnToPrev"
      @ascendRealm="onAscendRealm"
    />
  </q-page>
</template>

<script setup lang="ts">
/**
 * GalaxyPage.vue
 *
 * Full galaxy + system visualisation, ported from main_oct2.js to Vue 3.
 * Galaxy view: one sphere per star system, coloured by spectral type.
 * System view: star + orbital rings + animated planets + moons.
 * GSAP camera transitions between views.
 * Click planet → navigate to /surface/:hostname/:planetName
 */

import { ref, computed, onMounted, onUnmounted, nextTick, watch, watchEffect } from 'vue'
import { useVizRenderer } from 'src/composables/useVizRenderer'
import { useRouter, useRoute }                             from 'vue-router'
import * as THREE                                 from 'three'
import { OrbitControls }                          from 'three/examples/jsm/controls/OrbitControls.js'
import gsap                                       from 'gsap'
import { useGalaxyStore }                         from 'src/stores/galaxy'
import {
  starColorFromTeff,
  planetColor,
  raDecToVec3,
  distToViz,
  hostnameToSeed,
  auToViz,
  fallbackAU,
  disposeScene,
} from 'src/lib/three-utils'
import { makeStarMesh, teffToSpectral, SPECTRAL_RGB } from 'src/lib/star-sprites'
import { logNavEvent }                  from 'src/lib/nav-history'
import NavigatorInset                   from 'src/components/NavigatorInset.vue'
import StarDetailLens                   from 'src/components/StarDetailLens.vue'
import type { StarSystem, Planet }      from 'src/stores/galaxy'
import DefenderNav from 'src/components/DefenderNav.vue'
import type { DefenderNavData, PlanetStripEntry, StellarConfig, DefenderTarget, OrbitalGalleryEntry } from 'src/lib/defender-nav.types'
import { usePortalStore } from 'src/stores/portal'
import { useSceneTransitionStore } from 'src/stores/scene-transition'
import { BLACK_HOLE_CATALOG, bhColorHex } from 'src/data/black-holes'
import { getSurfaceType, NO_GROUND_SURFACE_TYPES } from 'src/lib/surface-classify'
import { useCommunityNodesStore } from 'src/stores/community-nodes'

// ── Galaxy star shader — one draw call for all ~5 000 confirmed systems ───────
// Vertex: size-attenuated points (pSize in scene-unit scale; 700 / depth → pixels).
// Fragment: smooth circular falloff + additive blending — no texture needed.

const STAR_VERT = `
attribute vec3  aColor;
attribute float pSize;
varying   vec3  vColor;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = clamp(pSize * 700.0 / -mv.z, 0.5, 30.0);
  gl_Position  = projectionMatrix * mv;
}
`
const STAR_FRAG = `
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.08, d);
  gl_FragColor = vec4(vColor * a, 1.0);
}
`

// ── Store / router ────────────────────────────────────────────────────────────

const galaxyStore = useGalaxyStore()
const portalStore = usePortalStore()
const transition  = useSceneTransitionStore()
const communityNodesStore = useCommunityNodesStore()
const router      = useRouter()
const route       = useRoute()

// Populated once per enterSystemView() call, read synchronously by
// buildDefenderData() — that function runs in the render loop (throttled to
// every 6th frame), so it can't itself make an async Supabase call.
const galleriesForCurrentSystem = ref<OrbitalGalleryEntry[]>([])

// ── UI state ──────────────────────────────────────────────────────────────────

// canvas ref removed — canvas is in MainLayout
const loaded          = ref(false)
const showLegend      = ref(false)   // map key panel — hidden by default
const showPlanetLegend   = ref(false)  // accordion tier 1 — planet temp
const showActivityLegend = ref(false)  // accordion tier 2 — pips + badges
const starLensOpen    = ref(false)   // stellar detail lens overlay

// ── Lagrangian planet-camera follow ──────────────────────────────────────────
// When enabled the camera rides co-orbitally alongside the focused planet,
// maintaining a trailing elevated position that updates each animation tick.
//   'orbit'  — trailing behind the planet, elevated ~35° above orbital plane
//   'dkmat'  — high above the system, looking down (dark-matter scope view)
const planetCamFollow = ref(false)
const planetCamMode   = ref<'orbit' | 'dkmat'>('orbit')

// ── Time dilation at planet surface vs L4 companion altitude ─────────────────
// Gravitational time dilation: Δτ/Δt ≈ 1 − GM/(Rc²)
// Shown in the planet data sheet whenever a planet is selected.
const timeDilationData = computed(() => {
  const planet = selectedPlanet.value
  if (!planet) return null
  const G     = 6.674e-11                                  // m³ kg⁻¹ s⁻²
  const c2    = 8.988e16                                   // c² m²/s²
  const M     = (planet.pl_bmasse  ?? 1.0) * 5.972e24     // kg (Earth masses)
  const Rsurf = (planet.pl_rade    ?? 1.0) * 6.371e6      // m (Earth radii)
  // Dilation at surface vs infinite: Δτ/t = GM/(Rc²)
  const dilSurf   = G * M / (Rsurf * c2)   // dimensionless
  // Convert to ns/day: 1 day = 86400 s, × 1e9 for ns
  const nsPerDay  = dilSurf * 86400 * 1e9
  // Escape velocity at surface: v_esc = sqrt(2GM/R) — gives sense of gravity
  const vEsc      = Math.sqrt(2 * G * M / Rsurf) / 1000  // km/s
  return {
    nsPerDay:  nsPerDay.toFixed(nsPerDay < 1 ? 3 : 1),
    vEscKms:   vEsc.toFixed(1),
    massLabel: (planet.pl_bmasse ?? 1.0).toFixed(2) + ' M⊕',
    radLabel:  (planet.pl_rade   ?? 1.0).toFixed(2) + ' R⊕',
  }
})
// Orbital parameters stored when a planet is focused (for the follow calculation)
let followOrbR  = 0
let followIncl  = 0
let followStarPos = new THREE.Vector3()

// ── Two-stage zoom state ──────────────────────────────────────────────────────
// Stage 1: approach — camera moves 55% toward target, star enlarges, context visible
// Stage 2: enter   — full system view (enterSystemView call)
const zoomStage       = ref<0|1|2>(0)   // 0=galaxy, 1=approaching, 2=system
const approachSystem  = ref<StarSystem | null>(null)
let   approachTimer:   ReturnType<typeof setTimeout> | null = null
const showPredicted   = ref(false)   // opt-in: loads candidate + frontier tiers

// ── Galaxy view filter layers ─────────────────────────────────────────────────

const filterHZ     = ref(false)   // HZ WORLDS — dim non-habitable-zone systems
const filterNearby = ref(false)   // NEARBY    — dim systems beyond 150 pc

function isHZSystem(sys: StarSystem): boolean {
  return sys.planets.some(p =>
    (p.pl_eqt != null && p.pl_eqt > 200 && p.pl_eqt < 380) ||
    (p.pl_orbsmax != null && p.pl_orbsmax > 0.7 && p.pl_orbsmax < 1.8)
  )
}

function applyGalaxyFilter() {
  if (!galaxyStarPoints || !_starBaseColors.length) return
  const attr = galaxyStarPoints.geometry.attributes['aColor'] as THREE.BufferAttribute
  const arr  = attr.array as Float32Array

  for (let i = 0; i < galaxyMarkers.length; i++) {
    const marker = galaxyMarkers[i]!
    const sys    = marker.userData.system as StarSystem | undefined
    if (!sys) continue
    let scale = 1.0
    if (filterHZ.value     && !isHZSystem(sys))                scale = Math.min(scale, 0.04)
    if (filterNearby.value && (sys.sy_dist ?? Infinity) > 150) scale = Math.min(scale, 0.04)
    const bi = i * 3
    arr[bi]     = _starBaseColors[bi]!     * scale
    arr[bi + 1] = _starBaseColors[bi + 1]! * scale
    arr[bi + 2] = _starBaseColors[bi + 2]! * scale
  }
  attr.needsUpdate = true
}

watch([filterHZ, filterNearby], ([hz, nearby]) => {
  applyGalaxyFilter()
  if (hz)      logNavEvent('hz_filter',     { activatedAt: Date.now() })
  if (nearby)  logNavEvent('nearby_filter', { activatedAt: Date.now() })
})

const mode            = ref<'galaxy' | 'system'>('galaxy')
const currentSystem   = ref<StarSystem | null>(null)
const selectedPlanet  = ref<Planet | null>(null)
const focusedPlanet   = ref<Planet | null>(null)
const enteringPlanet  = ref(false)
interface HoverInfo {
  name:           string
  type?:          string
  spec?:          string
  dist?:          string
  planets?:       number
  moons?:         number
  stars?:         number
  hz?:            boolean
  // Activity badges — populated from pon.ink when live; 0/undefined = no data yet
  settledCount?:  number
  artCount?:      number
  ecoOpsCount?:   number
  note?:          string
}

const hoveredInfo  = ref<HoverInfo | null>(null)
const hoverStyle   = ref({ left: '0px', top: '0px' })
let   hoverTimer: ReturnType<typeof setTimeout> | null = null

// ── Non-confirmed system click panel ─────────────────────────────────────────
interface NonConfirmedInfo {
  hostname:    string
  typeLabel:   string
  statusLabel: string
  dotColor:    string
  badgeColor:  string
  dist?:       string
  spec?:       string
  note?:       string
}
const clickedNonConfirmed = ref<NonConfirmedInfo | null>(null)

// ── Persistent system preview panel ──────────────────────────────────────────
const previewSystem       = ref<StarSystem | null>(null)
let   previewDwellTimer:   ReturnType<typeof setTimeout> | null = null
let   previewDismissTimer: ReturnType<typeof setTimeout> | null = null

const previewStarColor = computed(() =>
  previewSystem.value
    ? starColorFromTeff(previewSystem.value.st_teff).getHexString()
    : '446688'
)

function cancelPreviewDismiss() {
  if (previewDismissTimer) { clearTimeout(previewDismissTimer); previewDismissTimer = null }
}

function startPreviewDismiss() {
  cancelPreviewDismiss()
  previewDismissTimer = setTimeout(() => { previewSystem.value = null; previewDismissTimer = null }, 4000)
}

function enterSystemFromPreview() {
  const sys = previewSystem.value
  previewSystem.value = null
  cancelPreviewDismiss()
  if (sys) enterSystemView(sys)
}

const planetCardExpanded = ref(false)
watch(selectedPlanet, () => { planetCardExpanded.value = false })

const planetCardStats = computed<Record<string, string>>(() => {
  const p  = selectedPlanet.value
  const td = timeDilationData.value
  if (!p) return {}
  return {
    ...(p.pl_rade    != null ? { 'Radius':       p.pl_rade.toFixed(2)    + ' R⊕' } : {}),
    ...(p.pl_bmasse  != null ? { 'Mass':         p.pl_bmasse.toFixed(1)  + ' M⊕' } : {}),
    ...(p.pl_eqt     != null ? { 'Eq. Temp':     Math.round(p.pl_eqt)   + ' K'  } : {}),
    ...(p.pl_orbsmax != null ? { 'Orbit':        p.pl_orbsmax.toFixed(3) + ' AU' } : {}),
    ...(p.pl_orbper  != null ? { 'Period':       p.pl_orbper.toFixed(1)  + ' d'  } : {}),
    ...(p.pl_insol   != null ? { 'Insolation':   p.pl_insol.toFixed(2)  + ' S⊕' } : {}),
    ...(p.discoverymethod   ? { 'Detected':      p.discoverymethod }             : {}),
    'Atmosphere': atmosphereDesc(p),
    ...(td ? {
      'Time dilation': td.nsPerDay + ' ns/day · surface',
      'Escape velocity': td.vEscKms + ' km/s',
    } : {}),
    'Settlements': 'None logged',
  }
})

const selectedClass = computed(() =>
  selectedPlanet.value ? planetClass(selectedPlanet.value) : null
)

const statusText = computed(() => {
  if (!loaded.value) return 'Loading…'
  if (mode.value === 'galaxy')
    return `${galaxyStore.systems.size.toLocaleString()} star systems · click to explore`
  return currentSystem.value
    ? `${currentSystem.value.planets.length} planet${currentSystem.value.planets.length !== 1 ? 's' : ''}`
      + (currentSystem.value.sy_mnum > 0 ? ` · ${currentSystem.value.sy_mnum} moon${currentSystem.value.sy_mnum !== 1 ? 's' : ''}` : '')
    : ''
})

// ── Three.js refs ─────────────────────────────────────────────────────────────

const viz = useVizRenderer()
let renderer: THREE.WebGLRenderer     | null = null
let scene:    THREE.Scene             | null = null
let camera:   THREE.PerspectiveCamera | null = null
let controls: OrbitControls           | null = null
let _stopTick: (() => void) | null = null
const pageGroup = new THREE.Group()
let raycaster:     THREE.Raycaster
// animId removed — RAF owned by useVizRenderer

let galaxyMarkers:      THREE.Mesh[]      = []
// Galaxy-view Points objects — 2 draw calls replace ~10 000 individual sprites
let galaxyStarPoints:   THREE.Points | null = null
let galaxyPipPoints:    THREE.Points | null = null
let _starBaseColors:    Float32Array        = new Float32Array(0)   // original colors for filter restore
let theoreticalMarkers: THREE.Mesh[]      = []
let frontierMarkers:    THREE.Mesh[]      = []
let candidateMarkers:   THREE.Mesh[]      = []
let catalogBhMarkers:   THREE.Mesh[]      = []
let systemObjects:      THREE.Object3D[] = []
let animObjects:        THREE.Mesh[]     = []
let focusMoonObjects:   THREE.Object3D[] = []   // spawned when zoomed to a planet
let focusedPlanetMesh:  THREE.Mesh | null = null

let currentHovered: THREE.Mesh | null = null
let binaryAngle = 0

// Cached stellar config — set once on system entry, cleared on exit.
// Avoids allocating a new StellarConfig object every animation frame.
let _stellarCfgCache: StellarConfig | null = null

// Pre-allocated scratch vectors for the planet-follow inner loop.
// Prevents Vector3 GC churn at 60fps.
const _fs = {
  P:       new THREE.Vector3(),
  fromStar: new THREE.Vector3(),
  tang:    new THREE.Vector3(),
  orbNorm: new THREE.Vector3(),
  camTgt:  new THREE.Vector3(),
  lookTgt: new THREE.Vector3(),
}

// DefenderNav throttle — redraws at ~10fps (every 6 render frames).
let _navThrottle = 0

const mouseNDC    = new THREE.Vector2()
const defenderNav = ref<InstanceType<typeof DefenderNav> | null>(null)

// ── Initialise Three.js ───────────────────────────────────────────────────────

function initScene() {
  renderer = viz.renderer
  scene    = viz.scene
  camera   = viz.camera
  controls = viz.controls
  if (!renderer || !scene || !camera || !controls) return

  scene.background = new THREE.Color(0x02040a)
  scene.fog        = null

  camera.fov  = 60
  camera.near = 0.1
  camera.far  = 5000
  camera.position.set(0, 0, 600)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  controls.enableDamping = true
  controls.dampingFactor = 0.12
  controls.rotateSpeed   = 0.4
  controls.zoomSpeed     = 1.2
  controls.maxDistance   = 2500
  controls.minDistance   = 4
  controls.zoomToCursor  = false

  raycaster = new THREE.Raycaster()

  const amb = new THREE.AmbientLight(0x111822, 0.8)
  const dir = new THREE.DirectionalLight(0xffffff, 0.35)
  dir.position.set(1, 1, 1)
  pageGroup.add(amb, dir)
  scene.add(pageGroup)

  buildGalacticBackground()
}

// ── Galactic disk background — aligned to true galactic plane ─────────────────
//
// Galactic north pole: RA 192.85°, Dec 27.13° (equatorial → scene transform
// matches raDecToVec3 used for all star system positions, so the disk sits
// exactly where the confirmed systems cluster — along the galactic plane).
//
// The camera at (0,0,600) sees the disk ~78° from face-on (nearly edge-on),
// giving the classic Milky Way band effect.  Star systems confirmed by Kepler/
// TESS/ground surveys concentrate near galactic latitude 0° and should align
// with this band.

function makeGalacticDiskTexture(): THREE.CanvasTexture {
  const S = 1024, cx = S / 2
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')!

  // Diffuse disk glow
  const diskGrad = ctx.createRadialGradient(cx, cx, 0, cx, cx, S * 0.48)
  diskGrad.addColorStop(0.00, 'rgba(255,250,200,0.00)')
  diskGrad.addColorStop(0.06, 'rgba(255,240,140,0.65)')
  diskGrad.addColorStop(0.18, 'rgba(255,200, 80,0.38)')
  diskGrad.addColorStop(0.42, 'rgba(160,120, 40,0.16)')
  diskGrad.addColorStop(0.75, 'rgba( 60, 40, 10,0.07)')
  diskGrad.addColorStop(1.00, 'rgba(0,0,0,0)')
  ctx.fillStyle = diskGrad; ctx.fillRect(0, 0, S, S)

  // Galactic bar
  ctx.save(); ctx.translate(cx, cx); ctx.rotate(44 * Math.PI / 180)
  const barGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 0.13)
  barGrad.addColorStop(0.0, 'rgba(255,250,210,0.80)')
  barGrad.addColorStop(0.4, 'rgba(255,220,120,0.45)')
  barGrad.addColorStop(1.0, 'rgba(0,0,0,0)')
  ctx.scale(1.0, 0.28); ctx.fillStyle = barGrad
  ctx.fillRect(-S * 0.20, -S * 0.20, S * 0.40, S * 0.40)
  ctx.restore()

  // Four spiral arms — each with a distinct colour signature
  const ARMS: [number, string, string, number, number][] = [
    [0.00,          '80,160,255',  '100,200,255', 0.38, 32],  // Scutum-Centaurus — blue (OB-rich)
    [Math.PI * 0.5, '255,200, 80', '255,240,140', 0.30, 28],  // Sagittarius — amber (older pops)
    [Math.PI * 1.0, '220, 80,180', '255,140,220', 0.26, 26],  // Perseus — pink (HII regions)
    [Math.PI * 1.5, '60, 200,160', '100,240,200', 0.20, 22],  // Norma-Outer — teal
  ]
  const PITCH = Math.tan(12 * Math.PI / 180)
  const rngK  = (seed: number) => { let s = seed; return () => { s=s*1664525+1013904223|0; return (s>>>0)/4294967296 } }

  for (const [startAngle, rgb, rgbBright, alpha, width] of ARMS) {
    // Wide outer glow
    ctx.beginPath()
    let first = true
    for (let t = 0; t < Math.PI * 2.9; t += 0.025) {
      const r = S * 0.048 * Math.exp(t * PITCH); if (r > S * 0.49) break
      const a = t + startAngle
      const x = cx + r * Math.cos(a), y = cx + r * Math.sin(a)
      first ? (ctx.moveTo(x, y), first = false) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `rgba(${rgb},${(alpha * 0.55).toFixed(3)})`; ctx.lineWidth = width * 1.4; ctx.lineCap = 'round'; ctx.stroke()

    // Bright core of arm
    ctx.beginPath(); first = true
    for (let t = 0.15; t < Math.PI * 2.7; t += 0.025) {
      const r = S * 0.048 * Math.exp(t * PITCH); if (r > S * 0.47) break
      const a = t + startAngle
      const x = cx + r * Math.cos(a), y = cx + r * Math.sin(a)
      first ? (ctx.moveTo(x, y), first = false) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `rgba(${rgbBright},${alpha.toFixed(3)})`; ctx.lineWidth = width * 0.38; ctx.stroke()

    // HII knots
    const rk = rngK(Math.round(startAngle * 999 + 1))
    for (let k = 0; k < 14; k++) {
      const t2 = rk() * Math.PI * 2.2 + 0.3
      const r2 = S * 0.048 * Math.exp(t2 * PITCH) * (0.80 + rk() * 0.40)
      if (r2 > S * 0.48) continue
      const kx = cx + r2 * Math.cos(t2 + startAngle + (rk() - 0.5) * 0.3)
      const ky = cx + r2 * Math.sin(t2 + startAngle + (rk() - 0.5) * 0.3)
      const ks = 5 + rk() * 18
      const kg = ctx.createRadialGradient(kx, ky, 0, kx, ky, ks)
      kg.addColorStop(0, `rgba(${rgbBright},${(alpha * 2.2).toFixed(2)})`); kg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(kx, ky, ks, 0, Math.PI * 2); ctx.fill()
    }
  }

  // Dust lanes between arms
  ctx.globalCompositeOperation = 'multiply'
  for (let arm = 0; arm < 4; arm++) {
    const dAngle = (arm + 0.5) / 4 * Math.PI * 2
    ctx.beginPath(); let first2 = true
    for (let t = 0.4; t < Math.PI * 2.6; t += 0.035) {
      const r = S * 0.055 * Math.exp(t * PITCH); if (r > S * 0.45) break
      const x = cx + r * Math.cos(t + dAngle), y = cx + r * Math.sin(t + dAngle)
      first2 ? (ctx.moveTo(x, y), first2 = false) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = 'rgba(20,8,0,0.60)'; ctx.lineWidth = 12; ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'

  // Star dust points
  const rngS = rngK(77777)
  const SCOLS: [string, number][] = [['80,140,255',0.9],['180,200,255',0.7],['255,255,230',0.6],['255,220,140',0.5],['255,160,80',0.5],['220,100,80',0.4]]
  for (let i = 0; i < 6000; i++) {
    const arm2 = Math.floor(rngS() * 4), t3 = rngS() * Math.PI * 2.5
    const r3 = S * 0.048 * Math.exp(t3 * PITCH) * (0.65 + rngS() * 0.70)
    if (r3 > S * 0.49) continue
    const spread3 = (rngS() - 0.5) * S * 0.15
    const sx = cx + r3 * Math.cos(t3 + (arm2/4)*Math.PI*2 + (rngS()-0.5)*0.5) + spread3
    const sy = cx + r3 * Math.sin(t3 + (arm2/4)*Math.PI*2 + (rngS()-0.5)*0.5) + spread3
    const [scol, sopac] = SCOLS[Math.floor(rngS() * SCOLS.length)]!
    ctx.fillStyle = `rgba(${scol},${(sopac * (0.3 + rngS() * 0.7)).toFixed(2)})`
    ctx.beginPath(); ctx.arc(sx, sy, 0.4 + rngS() * 1.4, 0, Math.PI * 2); ctx.fill()
  }

  // Nuclear cluster + bulge
  const nucGrad = ctx.createRadialGradient(cx, cx, 0, cx, cx, S * 0.022)
  nucGrad.addColorStop(0, 'rgba(255,255,240,1.0)'); nucGrad.addColorStop(1, 'rgba(255,200,80,0)')
  ctx.fillStyle = nucGrad; ctx.fillRect(0, 0, S, S)
  const bulgeGrad = ctx.createRadialGradient(cx, cx, 0, cx, cx, S * 0.11)
  bulgeGrad.addColorStop(0, 'rgba(255,248,200,0.80)')
  bulgeGrad.addColorStop(0.4,'rgba(255,220,120,0.50)')
  bulgeGrad.addColorStop(1,  'rgba(0,0,0,0)')
  ctx.fillStyle = bulgeGrad; ctx.fillRect(0, 0, S, S)

  const tex = new THREE.CanvasTexture(cv)
  tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter
  return tex
}

function buildGalacticBackground() {
  const NGP_RA  = 192.85 * Math.PI / 180
  const NGP_DEC =  27.13 * Math.PI / 180
  const galNormal = new THREE.Vector3(
    Math.cos(NGP_DEC) * Math.cos(NGP_RA),
    Math.sin(NGP_DEC),
    -Math.cos(NGP_DEC) * Math.sin(NGP_RA),
  ).normalize()
  // Rotate disk from XY plane (normal=Z) to galactic plane (normal=galNormal)
  const diskQuat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), galNormal,
  )

  const DISK_R = 580

  // Canvas-texture disk
  const diskMesh = new THREE.Mesh(
    new THREE.CircleGeometry(DISK_R, 128),
    new THREE.MeshBasicMaterial({
      map: makeGalacticDiskTexture(), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }),
  )
  diskMesh.quaternion.copy(diskQuat)
  scene.add(diskMesh)

  // 3-D star particle field distributed in the galactic disk plane
  const STAR_N  = 14000
  const starPos: number[] = [], starCol: number[] = []
  let   rngSt   = 55441
  const rngNext = () => { rngSt = rngSt * 1664525 + 1013904223 | 0; return (rngSt >>> 0) / 4294967296 }
  const PITCH   = Math.tan(12 * Math.PI / 180)

  // Arm colour palette — matches disk texture arms
  const ARM_COLS: [number, number, number][][] = [
    [[0.31,0.63,1.00],[0.20,0.50,0.88]],   // blue arm
    [[1.00,0.78,0.31],[1.00,0.94,0.55]],   // amber arm
    [[0.86,0.31,0.71],[1.00,0.55,0.86]],   // pink arm
    [[0.24,0.78,0.63],[0.39,0.94,0.78]],   // teal arm
  ]

  for (let i = 0; i < STAR_N; i++) {
    const arm  = Math.floor(rngNext() * 4)
    const t    = rngNext() * Math.PI * 2.8
    const r    = DISK_R * 0.070 * Math.exp(t * PITCH) * (0.55 + rngNext() * 0.90)
    if (r > DISK_R * 0.97) continue
    const spreadX = (rngNext() - 0.5) * DISK_R * 0.20
    const spreadY = (rngNext() - 0.5) * DISK_R * 0.20
    const angle   = t + (arm / 4) * Math.PI * 2 + (rngNext() - 0.5) * 0.55
    // Use XY plane to match the canvas texture (CircleGeometry lies in XY plane)
    const lx  = r * Math.cos(angle) + spreadX
    const ly  = r * Math.sin(angle) + spreadY
    const lz  = (rngNext() - 0.5) * DISK_R * 0.055  // disk scale height (perpendicular)
    const lv  = new THREE.Vector3(lx, ly, lz).applyQuaternion(diskQuat)
    starPos.push(lv.x, lv.y, lv.z)

    // Colour: arm tint blended with stellar type randomness
    const [colA, colB] = ARM_COLS[arm]!
    const blend = rngNext()
    const br    = 0.25 + rngNext() * 0.75
    starCol.push(
      (colA[0]! * (1 - blend) + colB[0]! * blend) * br,
      (colA[1]! * (1 - blend) + colB[1]! * blend) * br,
      (colA[2]! * (1 - blend) + colB[2]! * blend) * br,
    )
  }

  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3))
  starGeo.setAttribute('color',    new THREE.Float32BufferAttribute(starCol, 3))
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 0.9, vertexColors: true, sizeAttenuation: true,
    transparent: true, opacity: 0.65, depthWrite: false,
    blending: THREE.AdditiveBlending,
  })))

  // Halo glow
  scene.add(Object.assign(new THREE.Mesh(
    new THREE.SphereGeometry(DISK_R * 0.70, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe090, transparent: true, opacity: 0.025, depthWrite: false, blending: THREE.AdditiveBlending }),
  )))
}

// ── Galaxy view ───────────────────────────────────────────────────────────────
// All confirmed star systems are rendered as a single THREE.Points object
// (2 draw calls total: stars + pips) instead of ~10 000 individual sprites.

function buildGalaxyView() {
  // Pre-allocate for worst case — trim later via slice
  const systems  = [...galaxyStore.systems.values()].filter(s => s.ra != null && s.dec != null)
  const N        = systems.length
  const starPos  = new Float32Array(N * 3)
  const starCol  = new Float32Array(N * 3)
  const starSize = new Float32Array(N)

  const pipPos:  number[] = []
  const pipCol:  number[] = []
  const pipSize: number[] = []

  let si = 0   // star index into the flat arrays

  for (const sys of systems) {
    const seed     = hostnameToSeed(sys.hostname)
    const vizDist  = distToViz(sys.sy_dist, seed)
    const pos      = raDecToVec3(sys.ra!, sys.dec!, vizDist)
    const spectral = teffToSpectral(sys.st_teff)
    const pCount   = sys.planets.length
    const dist     = sys.sy_dist ?? 500
    const teff     = sys.st_teff ?? 5778

    // ── Size from stellar luminosity ─────────────────────────────────────────
    const lumEst   = Math.pow(teff / 5778, 4)
    const logLum   = Math.log10(Math.max(0.0001, lumEst))
    const baseSize = Math.max(2.5, 3.8 + logLum * 2.6)
    const richBoost = Math.min(2.2, pCount * 0.40)
    const nearBoost = dist < 20 ? 1.8 : dist < 40 ? 0.8 : dist < 100 ? 0.2 : 0
    const sizeUnits = baseSize + richBoost + nearBoost

    // ── Color from spectral class ─────────────────────────────────────────────
    const rgb = SPECTRAL_RGB[spectral] ?? [200, 200, 200] as [number, number, number]
    let cr = rgb[0] / 255, cg = rgb[1] / 255, cb = rgb[2] / 255

    if (sys.sy_dist == null) {
      // Unknown distance: desaturate + dim
      const grey = (cr + cg + cb) / 3
      cr = grey * 0.43; cg = grey * 0.43; cb = grey * 0.43
    }

    // Apparent magnitude → mild brightness boost for very bright stars
    const appMag   = 4.83 - 2.5 * logLum + 5 * Math.log10(Math.max(10, dist) / 10)
    const brightK  = appMag < 1 ? 1.4 : appMag < 4.5 ? 1.1 : 1.0
    cr *= brightK; cg *= brightK; cb *= brightK

    starPos[si * 3]     = pos.x
    starPos[si * 3 + 1] = pos.y
    starPos[si * 3 + 2] = pos.z
    starCol[si * 3]     = cr
    starCol[si * 3 + 1] = cg
    starCol[si * 3 + 2] = cb
    starSize[si]        = sizeUnits

    // ── System property pips ─────────────────────────────────────────────────
    const hasHZ = sys.planets.some(p =>
      (p.pl_eqt != null && p.pl_eqt > 200 && p.pl_eqt < 380) ||
      (p.pl_orbsmax != null && p.pl_orbsmax > 0.7 && p.pl_orbsmax < 1.8)
    )
    const stars = sys.sy_snum ?? 1

    if (hasHZ) {
      pipPos.push(pos.x + sizeUnits * 0.60, pos.y + sizeUnits * 0.35, pos.z)
      pipCol.push(0x22 / 255, 0xff / 255, 0x88 / 255)
      pipSize.push(Math.max(2.2, sizeUnits * 0.28))
    }
    if (pCount >= 5) {
      pipPos.push(pos.x - sizeUnits * 0.60, pos.y + sizeUnits * 0.35, pos.z)
      pipCol.push(0x88 / 255, 0xbb / 255, 0xff / 255)
      pipSize.push(Math.max(1.8, sizeUnits * 0.22))
    }
    if (stars >= 2) {
      pipPos.push(pos.x, pos.y - sizeUnits * 0.55, pos.z)
      pipCol.push(0xff / 255, 0xd4 / 255, 0x80 / 255)
      pipSize.push(Math.max(1.8, sizeUnits * 0.22))
    }

    // ── Invisible hit sphere (raycasting only, never added to scene) ──────────
    const hitR = Math.max(4.5, sizeUnits * 0.60)
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(hitR, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    )
    mesh.position.copy(pos)
    mesh.userData = {
      type:   'star_system',
      system: sys,
      ptIdx:  si,   // index into Points buffer for highlight/filter
      hoverInfo: {
        name:    sys.hostname,
        type:    'Star System',
        spec:    sys.st_spectype
          ?? (sys.st_teff ? `${spectral}-type  ${Math.round(teff)} K` : undefined),
        dist:    dist ? `${dist.toFixed(1)} pc` : undefined,
        planets: pCount,
        moons:   sys.sy_mnum ?? 0,
        stars,
        hz:      hasHZ,
        settledCount: 0, artCount: 0, ecoOpsCount: 0,
      } as HoverInfo,
    }
    mesh.updateMatrixWorld(true)
    galaxyMarkers.push(mesh)
    si++
  }

  // ── Build star Points ────────────────────────────────────────────────────────
  const starColTrimmed  = starCol.slice(0, si * 3)
  _starBaseColors       = starColTrimmed.slice()   // save original for filter restore
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos.slice(0, si * 3), 3))
  starGeo.setAttribute('aColor',   new THREE.BufferAttribute(starColTrimmed, 3))
  starGeo.setAttribute('pSize',    new THREE.BufferAttribute(starSize.slice(0, si), 1))

  const starMat = new THREE.ShaderMaterial({
    vertexShader:   STAR_VERT,
    fragmentShader: STAR_FRAG,
    transparent:    true,
    depthWrite:     false,
    blending:       THREE.AdditiveBlending,
  })
  galaxyStarPoints = new THREE.Points(starGeo, starMat)
  scene.add(galaxyStarPoints)

  // ── Build pip Points ─────────────────────────────────────────────────────────
  if (pipPos.length > 0) {
    const pipGeo = new THREE.BufferGeometry()
    pipGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pipPos), 3))
    pipGeo.setAttribute('aColor',   new THREE.BufferAttribute(new Float32Array(pipCol), 3))
    pipGeo.setAttribute('pSize',    new THREE.BufferAttribute(new Float32Array(pipSize), 1))
    const pipMat = new THREE.ShaderMaterial({
      vertexShader:   STAR_VERT,
      fragmentShader: STAR_FRAG,
      transparent:    true,
      depthWrite:     false,
      blending:       THREE.AdditiveBlending,
    })
    galaxyPipPoints = new THREE.Points(pipGeo, pipMat)
    scene.add(galaxyPipPoints)
  }
}

// ── Theoretical systems (sparse/unsurveyed sky regions) ──────────────────────

function buildTheoreticalSystems() {
  // 15 canonical zones from SPEC_NFT_FRONTIER.md Appendix A
  // Each zone: [zone_id, ra_min, ra_max, dec_min, dec_max, count, dist_min_pc, dist_max_pc, mission_zone_id | null]
  const ZONES: [string, number, number, number, number, number, number, number, string | null][] = [
    ['south-cap-1',       0, 360, -90, -75, 40,  200, 1800, null],
    ['south-cap-2',       0,  90, -75, -60, 35,  150, 1600, null],
    ['south-cap-3',      90, 270, -75, -60, 35,  150, 1600, null],
    ['sculptor-eridanus', 0,  90, -45, -10, 55,   90, 1600, null],
    ['south-mid-1',       0,  60, -60, -30, 40,  120, 1400, null],
    ['south-mid-2',     120, 210, -60, -30, 40,  120, 1400, null],
    ['galactic-cap-n',  120, 240,  60,  90, 28,   80, 1200, null],
    ['coma-virgo-gap',  180, 270,  30,  60, 50,   80, 1400, null],
    ['oph-sgr-gap',     240, 285,   5,  30, 35,  100, 2000, null],
    ['roman-zone',      260, 273, -32, -26, 30,  400, 8000, 'roman-zone'],
    ['plato-1',         243, 264,  54,  66, 55,   60, 1200, 'plato-1'],
    ['plato-2',          83, 104, -36, -24, 55,   60, 1200, 'plato-2'],
    ['lsst-south-1',      0,  90, -30,  -5, 45,  100, 2000, 'lsst-south'],
    ['lsst-south-2',    150, 240, -30,  -5, 45,  100, 2000, 'lsst-south'],
    ['csst-zone',       300, 360, -10,  30, 30,  150, 1800, null],
  ]

  const rng = mulberry32(99991)

  // Colour by zone type
  function zoneColor(missionZone: string | null): THREE.Color {
    if (missionZone === 'roman-zone')  return new THREE.Color().setHSL(0.08, 0.6, 0.28)  // amber-red
    if (missionZone === 'plato-1' || missionZone === 'plato-2') return new THREE.Color().setHSL(0.55, 0.5, 0.28) // blue
    if (missionZone === 'lsst-south') return new THREE.Color().setHSL(0.35, 0.35, 0.25) // green-grey
    return new THREE.Color().setHSL(0.72 + rng() * 0.08, 0.18, 0.22 + rng() * 0.12)    // default violet
  }

  for (const [zone_id, raMin, raMax, decMin, decMax, count, distMin, distMax, missionZone] of ZONES) {
    const col = zoneColor(missionZone)

    for (let i = 0; i < count; i++) {
      const ra   = raMin + rng() * (raMax - raMin)
      const dec  = decMin + rng() * (decMax - decMin)
      const dist = distMin + rng() * (distMax - distMin)

      const vizDist = distToViz(dist)
      const pos     = raDecToVec3(ra, dec, vizDist)

      const geo = new THREE.SphereGeometry(0.55, 5, 5)
      const mat = new THREE.MeshStandardMaterial({
        color: col, emissive: col, emissiveIntensity: 0.35,
        transparent: true, opacity: missionZone ? 0.65 : 0.50,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      mesh.userData = {
        type:        'theoretical_system',
        zone_id,
        mission_zone: missionZone,
        label:       missionZone
          ? `⊙ ${missionZone.toUpperCase()} zone — ${Math.round(dist)} pc`
          : `⊙ Theoretical — ${zone_id}  (${Math.round(dist)} pc)`,
        ra, dec, dist,
      }
      scene.add(mesh)
      theoreticalMarkers.push(mesh)
    }
  }
}

// ── Galactic Center marker — Sgr A* hotspot in galaxy view ───────────────────

let galacticCenterMarker: THREE.Mesh | null = null

function buildGalacticCenterMarker() {
  // Sgr A* position (J2000): RA 266.4168°, Dec -29.0078°, dist 8178 pc
  const vizDist = distToViz(8178)
  const pos     = raDecToVec3(266.4168, -29.0078, vizDist)

  // Outer glow ring
  const ringGeo = new THREE.TorusGeometry(1.8, 0.2, 6, 40)
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff8800, transparent: true, opacity: 0.35,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.position.copy(pos)
  scene.add(ring)

  // Central bright point
  const geo = new THREE.SphereGeometry(0.75, 10, 10)
  const mat = new THREE.MeshBasicMaterial({ color: 0xffcc66 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.copy(pos)
  mesh.userData = {
    type:          'galactic_center',
    label:         'Galactic Core — Sagittarius A*',
    spec:          '4.154 × 10⁶ M☉ · 8.2 kpc · Nuclear Star Cluster',
    dist:          '8,178 pc',
    hoverInfo: {
      name:  'Galactic Core · Sagittarius A*',
      spec:  'Supermassive black hole · 4.154 × 10⁶ M☉',
      dist:  '8,178 pc (26,000 ly)',
    },
    onClickRoute:  '/galactic-center',
  }
  scene.add(mesh)
  galacticCenterMarker = mesh
  theoreticalMarkers.push(mesh)   // included in raycast targets
}

// ── Black hole catalog markers — the 9 non-Sgr-A* black holes from
// src/data/black-holes.ts, placed at real RA/Dec/distance so the cosmic-web
// navigation chain (CosmicPage → GalaxyPage) reaches them directly instead of
// only through the standalone /black-holes index. M87* and NGC 4258 are
// genuinely extragalactic (Mpc-scale) — distToViz's log scale places them at
// the far edge of the view, and their marker/hover copy says so explicitly
// rather than implying they're part of the Milky Way. ─────────────────────────

function buildCatalogBlackHoleMarkers() {
  for (const bh of BLACK_HOLE_CATALOG) {
    const vizDist = distToViz(bh.dist_pc)
    const pos     = raDecToVec3(bh.ra_deg, bh.dec_deg, vizDist)
    const isExtragalactic = bh.dist_pc > 1e5   // > ~326 kly — well beyond the Milky Way

    const ringGeo = new THREE.TorusGeometry(1.1, 0.13, 6, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: bhColorHex(bh), transparent: true, opacity: 0.4,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.copy(pos)
    pageGroup.add(ring)

    const geo = new THREE.SphereGeometry(0.42, 10, 10)
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(pos)
    const massLabel = bh.mass_msun >= 1e6
      ? `${(bh.mass_msun / 1e6).toFixed(2)}M M☉`
      : `${bh.mass_msun.toFixed(1)} M☉`
    mesh.userData = {
      type:  'catalog_black_hole',
      bhId:  bh.id,
      label: bh.label,
      hoverInfo: {
        name: bh.label,
        type: 'Black hole · click to enter',
        spec: massLabel,
        dist: isExtragalactic
          ? `${(bh.dist_pc * 3.2616 / 1e6).toFixed(1)} Mly — external galaxy, not part of the Milky Way`
          : `${Math.round(bh.dist_pc).toLocaleString()} pc`,
      },
    }
    pageGroup.add(mesh)
    catalogBhMarkers.push(mesh)
  }
}

function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function buildCandidateView() {
  for (const p of galaxyStore.candidatePlanets) {
    if (p.ra == null || p.dec == null) continue
    const vizDist = distToViz(p.sy_dist, hostnameToSeed(p.hostname))
    const pos     = raDecToVec3(p.ra, p.dec, vizDist)

    // Warm amber — visually distinct from confirmed (spectral) and frontier (blue-grey)
    const col = new THREE.Color(0xf0a030)

    // Small amber sprite (slightly smaller than confirmed stars)
    const sprite = makeStarMesh('K', 6, 1.8)
    sprite.position.copy(pos)
    scene.add(sprite)

    // Invisible hit sphere
    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 6, 6),
      new THREE.MeshBasicMaterial({ visible: false })
    )
    hitMesh.position.copy(pos)
    hitMesh.userData = {
      type: 'candidate_system',
      planet: p,
      hoverInfo: {
        name:    p.hostname,
        type:    'Planet Candidate',
        spec:    p.st_spectype ?? (p.st_teff ? `${Math.round(p.st_teff)} K` : undefined),
        dist:    p.sy_dist ? `${p.sy_dist.toFixed(1)} pc` : undefined,
        planets: 1,
        note:    `⚠ CANDIDATE · ${p.source_catalog?.toUpperCase() ?? ''} ${p.source_id ?? ''}`,
      } as HoverInfo,
    }
    hitMesh.updateMatrixWorld(true)
    candidateMarkers.push(hitMesh)
  }
}

function buildFrontierView() {
  for (const p of galaxyStore.frontierPlanets) {
    if (p.ra == null || p.dec == null) continue
    const vizDist = distToViz(p.sy_dist, hostnameToSeed(p.hostname))
    const pos     = raDecToVec3(p.ra, p.dec, vizDist)

    // Pale blue-grey — dim, clearly distinct from confirmed
    const sprite = makeStarMesh('A', 8, 1.4)
    ;(sprite.material as THREE.SpriteMaterial).opacity = 0.50
    sprite.position.copy(pos)
    scene.add(sprite)

    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 5, 5),
      new THREE.MeshBasicMaterial({ visible: false })
    )
    hitMesh.position.copy(pos)
    hitMesh.userData = {
      type: 'frontier_system',
      planet: p,
      hoverInfo: {
        name:    p.hostname,
        type:    'Frontier (Predicted)',
        spec:    p.st_spectype ?? (p.st_teff ? `${Math.round(p.st_teff)} K` : undefined),
        dist:    p.sy_dist ? `${p.sy_dist.toFixed(1)} pc` : undefined,
        planets: 1,
        note:    `◌ FRONTIER · ${p.mission_zone ? p.mission_zone.toUpperCase() + ' · ' : ''}HIP ${p.source_id ?? ''}`,
      } as HoverInfo,
    }
    hitMesh.updateMatrixWorld(true)
    frontierMarkers.push(hitMesh)
  }
}

const KNOWN_CIRCUMBINARY = new Set([
  'Kepler-16', 'Kepler-34', 'Kepler-35', 'Kepler-38', 'Kepler-47',
  'Kepler-64', 'Kepler-413', 'Kepler-453', 'Kepler-1647', 'TOI-1338',
  'BEBOP-1', 'Kepler-1661',
])

function resolveStellarConfig(sys: import('src/stores/galaxy').StarSystem): StellarConfig {
  const snum = sys.sy_snum ?? 1
  if (snum <= 1) return { type: 'single' }

  const primaryTeff    = sys.st_teff ?? 5778
  const companionTeff  = primaryTeff * 0.72
  const innermostAU    = Math.min(...sys.planets.map(p => p.pl_orbsmax ?? 999).filter(v => v < 990))
  const isCircumbinary = KNOWN_CIRCUMBINARY.has(sys.hostname) || (innermostAU > 0.8 && snum === 2)

  if (snum === 2) {
    if (isCircumbinary) {
      // Number.isFinite (not isNaN) — an all-filtered planets.map() makes
      // Math.min(...[]) return Infinity, which is not NaN and would
      // otherwise flow straight into separation/period/forbiddenZoneRadius.
      const sep = Math.max(0.05, Number.isFinite(innermostAU) ? innermostAU / 4 : 0.2)
      return {
        type: 'circumbinary',
        innerBinary: {
          primaryTeff, companionTeff,
          separation: sep,
          periodDays: Math.pow(sep, 1.5) * 365.25,
          angle: 0,
          massRatio: 0.72,
          forbiddenZoneRadius: sep * 3.5,
        },
      }
    }
    return {
      type: 'circumstellar',
      companion: { teff: companionTeff, orbitalRadius: 50, orbitalAngle: 0, massRatio: 0.72 },
    }
  }

  const sep = Math.max(0.05, Number.isFinite(innermostAU) ? innermostAU / 4 : 0.1)
  const forbiddenZoneRadius = sep * 3.5
  return {
    type: 'hierarchical_triple',
    innerBinary: {
      primaryTeff, companionTeff,
      separation: sep,
      periodDays: Math.pow(sep, 1.5) * 365.25,
      angle: 0,
      massRatio: 0.72,
      forbiddenZoneRadius,
    },
    // Outer companion must always render outside the inner binary's forbidden
    // zone — a wide inner separation (large innermostAU) would otherwise let
    // the hardcoded 200 AU default fall inside the hatched exclusion band.
    outerCompanion: { teff: companionTeff * 0.8, orbitalRadius: Math.max(200, forbiddenZoneRadius * 1.3), orbitalAngle: 0 },
  }
}

// ── System view ───────────────────────────────────────────────────────────────

// Deterministic orbital inclination per planet — adds visual depth without
// astronomical fiction.  Seeded from hostname + index so the same system
// always looks the same.  Range: ±11°.
function planetInclinationRad(hostname: string, idx: number): number {
  let h = 0
  for (let i = 0; i < hostname.length; i++) h = (h * 31 + hostname.charCodeAt(i)) >>> 0
  const raw = ((h ^ (idx * 2654435761)) >>> 0) / 0xffffffff
  return (raw - 0.5) * (22 * Math.PI / 180)
}

function enterSystemView(sys: StarSystem) {
  if (mode.value === 'system') exitSystemViewImmediate()
  mode.value          = 'system'
  currentSystem.value = sys
  clickedNonConfirmed.value = null
  void router.replace({ query: { focusHost: sys.hostname } })

  // Log for smart preset generation in MintStylePage
  logNavEvent('system_view', {
    hostname: sys.hostname,
    dist:     sys.sy_dist,
    teff:     sys.st_teff,
    spectype: sys.st_spectype,
    pCount:   sys.planets.length,
    moons:    sys.sy_mnum ?? 0,
    snum:     sys.sy_snum ?? 1,
    hasHZ:    isHZSystem(sys),
  })

  // Hide galaxy Points during system view
  if (galaxyStarPoints) galaxyStarPoints.visible = false
  if (galaxyPipPoints)  galaxyPipPoints.visible  = false
  const marker = galaxyMarkers.find(m => m.userData.system.hostname === sys.hostname) ?? null

  const starPos = marker ? marker.position.clone() : new THREE.Vector3(0, 0, 0)
  buildSystemScene(sys, starPos)
  _stellarCfgCache = resolveStellarConfig(sys)
  moveCameraToSystem(starPos, sys.planets.length)

  galleriesForCurrentSystem.value = []
  void communityNodesStore.fetchGalleryNodes(sys.hostname).then(entries => {
    // Guard against a slow fetch resolving after the user has already
    // navigated to a different system.
    if (currentSystem.value?.hostname === sys.hostname) galleriesForCurrentSystem.value = entries
  })
}

function buildSystemScene(sys: StarSystem, starPos: THREE.Vector3) {
  const starCol     = starColorFromTeff(sys.st_teff)
  const spectral    = teffToSpectral(sys.st_teff)

  // ── Star: invisible hit-target sphere + sprite glow + corona ────────────
  const hitGeo  = new THREE.SphereGeometry(9, 16, 16)
  const hitMat  = new THREE.MeshBasicMaterial({ visible: false })
  const starMesh = new THREE.Mesh(hitGeo, hitMat)
  starMesh.position.copy(starPos)
  starMesh.userData = {
    type: 'star', system: sys,
    label: `★ ${sys.hostname}${sys.st_spectype ? '  [' + sys.st_spectype + ']' : ''}${sys.st_teff ? '  ' + Math.round(sys.st_teff) + ' K' : ''}`,
  }
  scene.add(starMesh); systemObjects.push(starMesh)

  // Sprite — scientifically coloured, additive blending
  const starSprite = makeStarMesh(spectral, 1, 80)
  starSprite.position.copy(starPos)
  scene.add(starSprite); systemObjects.push(starSprite as unknown as THREE.Object3D)

  // Large corona glow sphere
  const coronaGeo = new THREE.SphereGeometry(30, 12, 12)
  const coronaMat = new THREE.MeshBasicMaterial({
    color: starCol, transparent: true, opacity: 0.08,
    depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const corona = new THREE.Mesh(coronaGeo, coronaMat)
  corona.position.copy(starPos)
  scene.add(corona); systemObjects.push(corona)

  const starLight = new THREE.PointLight(starCol, 3, 900)
  starLight.position.copy(starPos)
  scene.add(starLight); systemObjects.push(starLight)

  // ── Habitable zone band ─────────────────────────────────────────────���────
  // Approximate luminosity from teff (main-sequence): L ∝ T^4
  const teff  = sys.st_teff ?? 5778
  const lum   = Math.pow(teff / 5778, 4)
  const hzIn  = auToViz(Math.sqrt(lum / 1.1))
  const hzOut = auToViz(Math.sqrt(lum / 0.36))
  const hzGeo = new THREE.RingGeometry(hzIn, hzOut, 128)
  const hzMat = new THREE.MeshBasicMaterial({
    color: 0x22ff88, side: THREE.DoubleSide,
    transparent: true, opacity: 0.08,
    depthWrite: false,
  })
  const hzRing = new THREE.Mesh(hzGeo, hzMat)
  hzRing.rotation.x = Math.PI / 2
  hzRing.position.copy(starPos)
  hzRing.userData = { type: 'orbit_ring' }
  scene.add(hzRing); systemObjects.push(hzRing)

  // ── Planets ───────────────────────────────────────────────────────��──────
  const sorted = [...sys.planets].sort((a, b) => {
    const au = (p: Planet) => p.pl_orbsmax != null ? p.pl_orbsmax : 999
    return au(a) - au(b)
  })

  sorted.forEach((pl, i) => {
    const orbAU  = pl.pl_orbsmax != null ? pl.pl_orbsmax : fallbackAU(i, sorted.length)
    const orbR   = auToViz(orbAU)

    // Per-planet inclination — deterministic, ±11°, removes the flat merry-go-round look
    const incl = planetInclinationRad(sys.hostname, i)

    // Orbital ring — thicker (0.55 wide), planet-color-tinted, tilted by inclination
    const ringCol = planetColor(pl.pl_eqt, orbAU).clone().lerp(new THREE.Color(0x08121e), 0.45)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(orbR - 0.55, orbR + 0.55, 96),
      new THREE.MeshBasicMaterial({
        color: ringCol, side: THREE.DoubleSide, transparent: true, opacity: 0.75, depthWrite: false,
      })
    )
    ring.rotation.x = Math.PI / 2
    ring.rotation.z = incl    // tilt ring plane to match orbital inclination
    ring.position.copy(starPos)
    ring.userData   = { type: 'orbit_ring' }
    scene.add(ring); systemObjects.push(ring)

    // Planet sphere — geometry detail + physically-typed material
    const pR    = Math.max(0.9, Math.min(5, (pl.pl_rade ?? 2.0) * 0.42))
    const pCol  = planetColor(pl.pl_eqt, orbAU)
    const initAngle = (i / sorted.length) * Math.PI * 2

    const pMesh = new THREE.Mesh(
      new THREE.SphereGeometry(pR, 32, 32),
      buildPlanetMaterial(pl, pCol)
    )
    // Apply inclination to Y — planets are no longer all coplanar
    pMesh.position.set(
      starPos.x + orbR * Math.cos(initAngle),
      starPos.y  + orbR * Math.sin(initAngle) * Math.sin(incl),
      starPos.z  + orbR * Math.sin(initAngle) * Math.cos(incl)
    )
    const periodDays = pl.pl_orbper ?? 365
    // Visual time-scale: Earth takes ~60 s to orbit; floor at 150 d prevents hot Jupiters from spinning
    const angSpeed   = (2 * Math.PI * 365) / (Math.max(periodDays, 150) * 3600)

    pMesh.userData = {
      type: 'planet', planet: pl, system: sys,
      starPos, orbR, orbAngle: initAngle, angSpeed,
      incl,
      originalEmissive: pCol.clone(),
      label: describePlanet(pl),
    }

    scene.add(pMesh); systemObjects.push(pMesh); animObjects.push(pMesh)

    const l4geo = new THREE.ConeGeometry(1.2, 3.5, 3)
    const l4mat = new THREE.MeshBasicMaterial({ color: 0x3cdc64, transparent: true, opacity: 0.7 })
    const l4mesh = new THREE.Mesh(l4geo, l4mat)
    const l4initAngle = initAngle + Math.PI / 3
    l4mesh.position.set(
      starPos.x + orbR * Math.cos(l4initAngle),
      starPos.y  + orbR * Math.sin(l4initAngle) * Math.sin(incl),
      starPos.z  + orbR * Math.sin(l4initAngle) * Math.cos(incl)
    )
    l4mesh.userData = {
      type: 'lagrange', point: 'L4', planet: pl,
      starPos, orbR, orbAngle: l4initAngle, angSpeed, incl,
      label: `L4 — ${pl.pl_name} Lagrange point (+60°)`,
    }
    scene.add(l4mesh)
    systemObjects.push(l4mesh)
    animObjects.push(l4mesh)

    const l5geo = new THREE.ConeGeometry(1.2, 3.5, 3)
    const l5mat = new THREE.MeshBasicMaterial({ color: 0xffb41e, transparent: true, opacity: 0.7 })
    const l5mesh = new THREE.Mesh(l5geo, l5mat)
    const l5initAngle = initAngle - Math.PI / 3
    l5mesh.position.set(
      starPos.x + orbR * Math.cos(l5initAngle),
      starPos.y  + orbR * Math.sin(l5initAngle) * Math.sin(incl),
      starPos.z  + orbR * Math.sin(l5initAngle) * Math.cos(incl)
    )
    l5mesh.userData = {
      type: 'lagrange', point: 'L5', planet: pl,
      starPos, orbR, orbAngle: l5initAngle, angSpeed, incl,
      label: `L5 — ${pl.pl_name} Lagrange zone (−60°)`,
    }
    scene.add(l5mesh)
    systemObjects.push(l5mesh)
    animObjects.push(l5mesh)

    // Atmosphere glow shell — opacity driven by planet type
    const atmCol     = atmosphereColor(pl.pl_eqt, orbAU)
    const atmOpacity = atmosphereOpacity(pl.pl_eqt, pl.pl_rade)
    const atmGeo = new THREE.SphereGeometry(pR * 1.28, 24, 24)
    const atmMat = new THREE.MeshBasicMaterial({
      color: atmCol, transparent: true, opacity: atmOpacity,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const atm = new THREE.Mesh(atmGeo, atmMat)
    atm.position.copy(pMesh.position)
    atm.userData = { type: 'atm', parentPlanet: pMesh }
    scene.add(atm); systemObjects.push(atm); animObjects.push(atm)

    // Floating 3D name label — monospace canvas sprite anchored above each planet
    {
      const lc = document.createElement('canvas')
      lc.width = 256; lc.height = 44
      const lx = lc.getContext('2d')!
      lx.clearRect(0, 0, 256, 44)
      lx.font      = 'bold 14px "Courier New", monospace'
      lx.fillStyle = '#aad4ff'
      lx.fillText(pl.pl_name, 5, 30)
      const _lt = new THREE.CanvasTexture(lc)
      _lt.generateMipmaps = false
      _lt.minFilter       = THREE.LinearFilter
      const lbl = new THREE.Sprite(new THREE.SpriteMaterial({
        map: _lt,
        transparent: true, depthWrite: false, blending: THREE.NormalBlending,
      }))
      lbl.scale.set(16, 3.5, 1)
      lbl.position.copy(pMesh.position)
      lbl.position.y += pR + 7
      lbl.userData = { type: 'planet_label', parentPlanet: pMesh, pR }
      scene.add(lbl)
      systemObjects.push(lbl)
      animObjects.push(lbl as unknown as THREE.Mesh)
    }

    // Moons on outermost planet
    if (sys.sy_mnum > 0 && i === sorted.length - 1) {
      spawnMoons(pMesh, Math.min(sys.sy_mnum, 4), pR)
    }
  })
}

function atmosphereColor(eqt: number | null | undefined, orbAU: number): THREE.Color {
  if (eqt != null && eqt > 1500) return new THREE.Color(0xff3300)
  if (eqt != null && eqt > 700)  return new THREE.Color(0xff8800)
  if (eqt != null && eqt > 200)  return new THREE.Color(0x2299ff)
  return new THREE.Color(0x88bbff)
}

function atmosphereOpacity(eqt: number | null | undefined, rade: number | null | undefined): number {
  if (rade != null && rade < 0.6) return 0.04  // bare rock — almost no atmosphere
  if (eqt != null && eqt > 2000)  return 0.32  // outgassed steam/magma glow
  if (eqt != null && eqt > 1000)  return 0.24
  if (eqt != null && eqt > 300)   return 0.18  // thick hot envelope
  if (eqt != null && eqt >= 200)  return 0.22  // habitable-zone — visible scattering
  return 0.10                                    // cold / gas giant
}

function buildPlanetMaterial(pl: Planet, pCol: THREE.Color): THREE.MeshStandardMaterial {
  const eqt  = pl.pl_eqt
  const rade = pl.pl_rade
  const mass = pl.pl_bmasse

  if ((rade != null && rade > 4) || (mass != null && mass > 50)) {
    // Gas / ice giant: banded, smooth
    return new THREE.MeshStandardMaterial({ color: pCol, emissive: pCol, emissiveIntensity: 0.10, roughness: 0.55, metalness: 0.0 })
  }
  if (eqt != null && eqt > 1800) {
    // Lava world: self-luminous
    return new THREE.MeshStandardMaterial({ color: pCol, emissive: pCol, emissiveIntensity: 0.75, roughness: 0.85, metalness: 0.0 })
  }
  if (eqt != null && eqt > 800) {
    // Hot rocky: warm glow
    return new THREE.MeshStandardMaterial({ color: pCol, emissive: pCol, emissiveIntensity: 0.40, roughness: 0.88, metalness: 0.0 })
  }
  if (eqt != null && eqt >= 200 && eqt <= 380) {
    // Temperate / ocean: blue-water sheen
    return new THREE.MeshStandardMaterial({ color: pCol, emissive: pCol, emissiveIntensity: 0.06, roughness: 0.30, metalness: 0.04 })
  }
  if (eqt != null && eqt < 120) {
    // Frozen world: icy reflective crust
    return new THREE.MeshStandardMaterial({ color: pCol, emissive: pCol, emissiveIntensity: 0.03, roughness: 0.90, metalness: 0.0 })
  }
  return new THREE.MeshStandardMaterial({ color: pCol, emissive: pCol, emissiveIntensity: 0.18, roughness: 0.70, metalness: 0.02 })
}

// ── Planet physical classification + atmosphere description (for card panel) ──
//
// NOTE: this deliberately returns a *descriptive physical class*, not a ranked
// rarity tier. It previously returned LEGENDARY / RARE / UNCOMMON / COMMON with
// scarcity language ("extreme rarity") on a panel that links directly to /mint.
// Ranked scarcity tiering on a pre-mint surface is the exact signal called out
// in RISK_REDUCTION_RECOMMENDATIONS.md §1 as the clearest Howey-test hook
// available to a regulator. Do not reintroduce ordered tiers, counts, or
// scarcity wording here. Colours below are keyed to temperature/composition,
// not to a value ladder.

function planetClass(p: Planet): { label: string; color: string; desc: string } {
  const rade = p.pl_rade
  const eqt  = p.pl_eqt
  const au   = p.pl_orbsmax
  const mass = p.pl_bmasse

  const earthSize  = rade != null && rade >= 0.8 && rade <= 1.4
  const superEarth = rade != null && rade > 1.4  && rade <= 2.5
  const isGas      = (rade != null && rade > 4) || (mass != null && mass > 50)
  const inHZ = (eqt != null && eqt >= 200 && eqt <= 380) ||
               (au  != null && au  >= 0.7 && au  <= 1.8)
  const ultraHot = (eqt != null && eqt > 2000) || (au != null && au < 0.04)
  const frozen   = (eqt != null && eqt < 80)

  if (earthSize && inHZ)  return { label: 'TEMPERATE TERRESTRIAL', color: '#44cc99', desc: 'Earth-sized, temperate orbit' }
  if (earthSize)          return { label: 'TERRESTRIAL',           color: '#44cc99', desc: 'Earth-sized world' }
  if (superEarth && inHZ) return { label: 'TEMPERATE SUPER-EARTH',  color: '#44cc99', desc: 'Super-Earth in habitable zone' }
  if (inHZ)               return { label: 'TEMPERATE ZONE',         color: '#5599ff', desc: 'Habitable zone candidate' }
  if (ultraHot && !isGas) return { label: 'HOT ROCKY',              color: '#ff8855', desc: 'Extreme hot-zone world' }
  if (frozen)             return { label: 'FROZEN',                 color: '#88bbdd', desc: 'Deep-frozen outer world' }
  if (superEarth)         return { label: 'SUPER-EARTH',            color: '#5599ff', desc: 'Super-Earth class' }
  if (isGas)              return { label: 'GAS / ICE GIANT',        color: '#c0a0d8', desc: 'Gas / ice giant' }
  return                         { label: 'ROCKY',                  color: '#9fb0c0', desc: 'Cataloged rocky world' }
}

function atmosphereDesc(p: Planet): string {
  const eqt  = p.pl_eqt
  const rade = p.pl_rade
  const mass = p.pl_bmasse

  if (rade != null && rade < 0.6)             return 'Bare rock — unlikely to retain atmosphere'
  if ((rade != null && rade > 4) || (mass != null && mass > 50)) return 'Gas/ice giant — no solid surface'
  if (mass != null && mass > 15)              return 'Sub-Neptune — thick H₂/He envelope'
  if (eqt != null && eqt > 2500)             return 'Molten — volatiles vaporized'
  if (eqt != null && eqt > 1500)             return 'Outgassed steam/CO₂ atmosphere'
  if (eqt != null && eqt > 700)              return 'Dense CO₂/SO₂ volcanic atmosphere'
  if (eqt != null && eqt >= 200 && eqt <= 380) {
    if (rade != null && rade <= 1.5)          return 'Potentially habitable thin N₂/O₂'
    return 'Thick N₂/H₂O vapor envelope'
  }
  if (eqt != null && eqt < 120)              return 'CO₂/N₂ collapsed to surface (frozen)'
  return 'Atmosphere composition uncharted'
}

function spawnMoons(parentMesh: THREE.Mesh, count: number, parentR: number) {
  for (let m = 0; m < count; m++) {
    const moonOrbR = parentR + 3.5 + m * 2.8

    const mRing = new THREE.Mesh(
      new THREE.RingGeometry(moonOrbR - 0.18, moonOrbR + 0.18, 48),
      new THREE.MeshBasicMaterial({
        color: 0x334455, side: THREE.DoubleSide, transparent: true, opacity: 0.4,
      })
    )
    mRing.rotation.x = Math.PI / 2
    scene.add(mRing); systemObjects.push(mRing)

    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.38 + m * 0.08, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x9999aa, emissive: new THREE.Color(0x1a1a2a) })
    )
    moonMesh.userData = {
      type: 'moon',
      parent: parentMesh,
      ring: mRing,
      moonOrbR,
      moonAngle: (m / count) * Math.PI * 2,
      moonSpeed: (2.0 + m * 0.7) / 60,
      label: `Moon of ${parentMesh.userData.planet?.pl_name ?? 'planet'} (proposed)`,
    }
    scene.add(moonMesh); systemObjects.push(moonMesh); animObjects.push(moonMesh as THREE.Mesh)
  }
}

function exitSystemViewImmediate() {
  clearFocusMoons()
  removeContextLine()                  // clear Sol↔system line if present
  hasReturnPosition.value = false
  savedCamPos = null; savedTargetPos = null
  systemObjects.forEach(o => scene.remove(o))
  systemObjects     = []
  animObjects       = []
  _stellarCfgCache  = null
  if (galaxyStarPoints) galaxyStarPoints.visible = true
  if (galaxyPipPoints)  galaxyPipPoints.visible  = true
  mode.value           = 'galaxy'
  currentSystem.value  = null
  selectedPlanet.value = null
  focusedPlanet.value  = null
  enteringPlanet.value = false
  controls.enabled     = true
}

function exitSystem() {
  exitSystemViewImmediate()
  zoomStage.value = 0
  void router.replace({ query: {} })
  gsap.to(camera.position, {
    duration: 1.4, x: 0, y: 0, z: 600,
    onUpdate: () => controls.update(),
  })
  gsap.to(controls.target, {
    duration: 1.4, x: 0, y: 0, z: 0,
    onUpdate: () => controls.update(),
  })
}

function moveCameraToSystem(starPos: THREE.Vector3, planetCount: number) {
  // Sweep in from a 3/4 elevated angle so the orbital plane is visible on arrival
  const spread = 90 + planetCount * 14
  gsap.to(camera.position, {
    duration: 2.2,
    x: starPos.x + spread * 0.28,
    y: starPos.y + spread * 0.38,
    z: starPos.z + spread,
    ease: 'power2.inOut',
    onUpdate: () => controls.update(),
  })
  gsap.to(controls.target, {
    duration: 2.2,
    x: starPos.x, y: starPos.y, z: starPos.z,
    ease: 'power2.inOut', onUpdate: () => controls.update(),
  })
}

// ── Planet focus mode ─────────────────────────────────────────────────────────

function togglePlanetFollow(mode: 'orbit' | 'dkmat') {
  // Toggle off if already in this mode
  if (planetCamFollow.value && planetCamMode.value === mode) {
    planetCamFollow.value = false
    controls.enabled = true
    return
  }
  planetCamMode.value   = mode
  planetCamFollow.value = true
  controls.enabled = false   // hand camera control to the follow system

  if (mode === 'dkmat' && focusedPlanetMesh) {
    // Dramatic DK.MAT ascent — GSAP the initial move then follow takes over
    const S    = followStarPos.clone()
    const up   = new THREE.Vector3(0, 1, 0)
    const orbUp = new THREE.Vector3(
      -Math.sin(followIncl),
      Math.cos(followIncl),
      0,
    ).normalize()
    const ascent = followOrbR * 2.8
    gsap.to(camera.position, {
      duration: 2.2, ease: 'power3.inOut',
      x: S.x + orbUp.x * ascent,
      y: S.y + ascent,
      z: S.z + orbUp.z * ascent,
      onUpdate: () => controls.update(),
    })
  }
}

function focusPlanet(pMesh: THREE.Mesh) {
  clearFocusMoons()
  focusedPlanetMesh    = pMesh
  focusedPlanet.value  = pMesh.userData.planet as Planet
  selectedPlanet.value = pMesh.userData.planet as Planet

  // ── Store orbital parameters ───────────────────────────────────────────────
  const d = pMesh.userData
  followOrbR    = d.orbR    ?? 40
  followIncl    = d.incl    ?? 0
  followStarPos = d.starPos ? d.starPos.clone() : new THREE.Vector3()

  const P    = pMesh.position.clone()
  const S    = followStarPos
  const pR   = (pMesh.geometry as THREE.SphereGeometry).parameters?.radius ?? 2
  const θ    = d.orbAngle ?? 0
  const incl = followIncl

  // ── Compute the L4-companion camera landing position ──────────────────────
  // The L4 point is 60° ahead in the orbit. Instead of sitting at L4 (which
  // keeps the planet small at orbital distance), we position the camera close
  // to the planet in a trailing Lagrangian-flavoured companion orbit:
  //   −55% along orbital tangent (slightly behind the planet)
  //   +40% along the orbit normal (above the orbital plane)
  //   +12% radially outward (slight outward tilt = star stays in view)
  const fromStar = P.clone().sub(S).normalize()   // star → planet
  const tang     = new THREE.Vector3(
    -Math.sin(θ),
     Math.cos(θ) * Math.sin(incl),
     Math.cos(θ) * Math.cos(incl),
  ).normalize()
  const orbNorm  = new THREE.Vector3().crossVectors(fromStar, tang).normalize()

  const companionDist = Math.max(30, pR * 11)
  const L4companion   = P.clone()
    .addScaledVector(tang,    -companionDist * 0.55)
    .addScaledVector(orbNorm,  companionDist * 0.40)
    .addScaledVector(fromStar, companionDist * 0.12)

  // Midpoint for the braking manoeuvre (halfway between current cam and target)
  const midPt = camera.position.clone().lerp(L4companion, 0.50)
  midPt.y    += companionDist * 0.20   // slight arc up then down

  // ── Phase 1 (0–0.9 s): Rush toward the planet — power4.in accelerates hard ─
  controls.enabled = false
  planetCamFollow.value = false

  gsap.to(controls.target, {
    duration: 0.9, ease: 'power3.in',
    x: P.x, y: P.y, z: P.z,
    onUpdate: () => controls.update(),
  })

  gsap.to(camera.position, {
    duration: 0.9, ease: 'power4.in',
    x: midPt.x, y: midPt.y, z: midPt.z,
    onUpdate: () => controls.update(),

    // ── Phase 2 (0.9–2.8 s): Decelerate into L4 companion orbit ────────────
    // The sharp power4.out easing creates the "spacecraft braking" sensation —
    // the planet seems to grow quickly then suddenly slow as you settle into orbit.
    onComplete: () => {
      gsap.to(camera.position, {
        duration: 1.9, ease: 'power4.out',
        x: L4companion.x, y: L4companion.y, z: L4companion.z,
        onUpdate: () => controls.update(),
        onComplete: () => {
          // Hand control to the spring-follow system; user is now in co-orbit
          planetCamMode.value   = 'orbit'
          planetCamFollow.value = true
          // controls stay disabled — spring follow drives the camera
        },
      })
    },
  })

  // Equatorial ring — colour-coded by physical class (not a rarity tier)
  const rar = planetClass(pMesh.userData.planet as Planet)
  const eqTorus = new THREE.Mesh(
    new THREE.TorusGeometry(pR * 1.40, pR * 0.038, 8, 80),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(rar.color),
      transparent: true, opacity: 0.55,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })
  )
  eqTorus.position.copy(P)
  eqTorus.rotation.x = Math.PI / 2
  scene.add(eqTorus)
  focusMoonObjects.push(eqTorus)

  // Moons: use system total, max 5
  const moonCount = Math.min(5, Math.max(1, currentSystem.value?.sy_mnum ?? 1))
  spawnFocusMoons(pMesh, moonCount, pR)
}

function spawnFocusMoons(parentMesh: THREE.Mesh, count: number, parentR: number) {
  for (let m = 0; m < count; m++) {
    // Orbit radii spaced further out than system-level moons — visible at close zoom
    const moonOrbR = parentR + 8 + m * 6

    // Ring — slightly tilted per moon for orbital-inclination realism
    const tiltDeg  = 8 + m * 12   // 8°, 20°, 32°, 44°, 56°
    const ringGeo  = new THREE.RingGeometry(moonOrbR - 0.25, moonOrbR + 0.25, 64)
    const ringMat  = new THREE.MeshBasicMaterial({
      color: 0x445566, side: THREE.DoubleSide, transparent: true, opacity: 0.35,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    ring.rotation.z = (tiltDeg * Math.PI) / 180
    scene.add(ring); focusMoonObjects.push(ring)

    // Moon mesh — slightly larger and more varied than system-level moons
    const moonR    = 0.55 + m * 0.18
    const moonHue  = 0.55 + m * 0.06     // range of grey-blue tones
    const moonCol  = new THREE.Color().setHSL(moonHue, 0.12, 0.38 + m * 0.04)
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(moonR, 12, 12),
      new THREE.MeshStandardMaterial({
        color: moonCol,
        emissive: moonCol,
        emissiveIntensity: 0.08,
        roughness: 0.9,
      })
    )

    moonMesh.userData = {
      type:       'focus_moon',
      parent:     parentMesh,
      ring,
      moonOrbR,
      tiltRad:    (tiltDeg * Math.PI) / 180,
      moonAngle:  (m / count) * Math.PI * 2,
      // Gentle speeds: ~8–12× slower than system-level moons
      moonSpeed:  0.0018 + m * 0.0007,
      label:      `Moon ${m + 1} of ${parentMesh.userData.planet?.pl_name ?? 'planet'}`,
    }
    scene.add(moonMesh); focusMoonObjects.push(moonMesh)
  }
}

function clearFocusMoons() {
  focusMoonObjects.forEach(o => {
    scene.remove(o)
    if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose()
  })
  focusMoonObjects    = []
  focusedPlanetMesh   = null
  focusedPlanet.value = null
}

function defocusPlanet() {
  planetCamFollow.value = false
  controls.enabled      = true
  clearFocusMoons()
  selectedPlanet.value = null
  if (!currentSystem.value) return
  const marker  = galaxyMarkers.find(m => m.userData.system.hostname === currentSystem.value!.hostname)
  const starPos = marker ? marker.position.clone() : new THREE.Vector3()
  moveCameraToSystem(starPos, currentSystem.value.planets.length)
}

// ── Animation loop ────────────────────────────────────────────────────────────

function galaxyTick(_t: number) {
  {
    if (mode.value === 'system' && _stellarCfgCache?.innerBinary) {
      const dtDays = (1 / 60) / 86400
      binaryAngle = (binaryAngle + (360 / _stellarCfgCache.innerBinary.periodDays) * dtDays) % 360
    }

    if (mode.value === 'system') {
      for (const obj of animObjects) {
        const d = obj.userData
        if (d.type === 'planet') {
          d.orbAngle += d.angSpeed
          const incl = d.incl ?? 0
          obj.position.set(
            d.starPos.x + d.orbR * Math.cos(d.orbAngle),
            d.starPos.y  + d.orbR * Math.sin(d.orbAngle) * Math.sin(incl),
            d.starPos.z  + d.orbR * Math.sin(d.orbAngle) * Math.cos(incl)
          )
        } else if (d.type === 'moon') {
          d.moonAngle += d.moonSpeed
          const px = d.parent.position
          obj.position.set(
            px.x + d.moonOrbR * Math.cos(d.moonAngle),
            px.y,
            px.z + d.moonOrbR * Math.sin(d.moonAngle)
          )
          d.ring.position.copy(px)
        } else if (d.type === 'atm') {
          obj.position.copy(d.parentPlanet.position)
        } else if (d.type === 'planet_label') {
          // Follow parent planet, stay anchored above it
          obj.position.copy(d.parentPlanet.position)
          obj.position.y += (d.pR ?? 2) + 7
        } else if (d.type === 'lagrange') {
          d.orbAngle += d.angSpeed
          const incl = d.incl ?? 0
          obj.position.set(
            d.starPos.x + d.orbR * Math.cos(d.orbAngle),
            d.starPos.y  + d.orbR * Math.sin(d.orbAngle) * Math.sin(incl),
            d.starPos.z  + d.orbR * Math.sin(d.orbAngle) * Math.cos(incl),
          )
        }
      }

      // Focus moon animation — gentle, inclined orbits
      for (const obj of focusMoonObjects) {
        const d = obj.userData
        if (d.type !== 'focus_moon') continue
        d.moonAngle += d.moonSpeed
        const px  = d.parent.position
        const cos = Math.cos(d.moonAngle)
        const sin = Math.sin(d.moonAngle)
        // Apply tilt: rotate orbit plane around z-axis by tiltRad
        const ct  = Math.cos(d.tiltRad)
        const st  = Math.sin(d.tiltRad)
        obj.position.set(
          px.x + d.moonOrbR * cos,
          px.y + d.moonOrbR * sin * st,
          px.z + d.moonOrbR * sin * ct,
        )
        // Ring stays centred on planet, keeps its own rotation
        d.ring.position.copy(px)
      }

      // ── Lagrangian planet-camera follow ─────────────────────────────
      // Runs AFTER all planet positions are updated so P is current.
      if (planetCamFollow.value && focusedPlanetMesh) {
        const P  = _fs.P.copy(focusedPlanetMesh.position)
        const S  = followStarPos
        const pR = (focusedPlanetMesh.geometry as THREE.SphereGeometry).parameters?.radius ?? 2

        // Radial direction: from star outward to planet
        const fromStar = _fs.fromStar.copy(P).sub(S).normalize()

        // Orbital tangent: derivative of position w.r.t. angle
        const d      = focusedPlanetMesh.userData
        const angle  = d.orbAngle ?? 0
        const incl   = d.incl    ?? 0
        _fs.tang.set(
          -Math.sin(angle),
          Math.cos(angle) * Math.sin(incl),
          Math.cos(angle) * Math.cos(incl),
        ).normalize()
        const tang = _fs.tang

        // Orbit normal (up out of orbital plane)
        const orbNorm = _fs.orbNorm.crossVectors(fromStar, tang).normalize()

        let camTarget: THREE.Vector3
        let lookTarget: THREE.Vector3

        if (planetCamMode.value === 'orbit') {
          const dist = Math.max(35, pR * 11)
          camTarget = _fs.camTgt.copy(P)
            .addScaledVector(tang,     -dist * 0.55)
            .addScaledVector(orbNorm,   dist * 0.40)
            .addScaledVector(fromStar,  dist * 0.12)
          lookTarget = _fs.lookTgt.copy(P)
        } else {
          const high = followOrbR * 2.8
          camTarget = _fs.camTgt.copy(S)
            .addScaledVector(orbNorm,  high)
            .addScaledVector(fromStar, followOrbR * 0.40)
          lookTarget = _fs.lookTgt.copy(S).lerp(P, 0.35)
        }

        // Spring-damped follow. The coefficient scales with distance to planet
        // so the camera feels tighter (more responsive) at close range — the
        // "perspective slows" effect: far out = lazy drift, close = crisp lock.
        const distToPlanet = camera.position.distanceTo(P)
        const pRad         = (focusedPlanetMesh!.geometry as THREE.SphereGeometry).parameters?.radius ?? 2
        const closeness    = Math.max(0, Math.min(1, 1 - (distToPlanet - pRad * 8) / (pRad * 40)))
        const lerpK        = planetCamMode.value === 'orbit'
          ? 0.032 + closeness * 0.038   // 0.032 (far drift) → 0.070 (near crisp)
          : 0.020                        // DK.MAT: very slow, majestic
        camera.position.lerp(camTarget, lerpK)
        controls.target.lerp(lookTarget, lerpK * 1.5)
        controls.update()
      }
    }

    if ((_navThrottle = (_navThrottle + 1) % 6) === 0) {
      defenderNav.value?.redraw(buildDefenderData())
    }
  }
}

// ── Interaction ───────────────────────────────────────────────────────────────

function getHitTargets(): THREE.Mesh[] {
  if (mode.value === 'galaxy') return [...galaxyMarkers, ...theoreticalMarkers, ...candidateMarkers, ...frontierMarkers, ...catalogBhMarkers]
  return systemObjects.filter(
    o => (o as THREE.Mesh).isMesh && o.userData.type !== 'orbit_ring'
  ) as THREE.Mesh[]
}

function raycast(x: number, y: number) {
  if (!camera) return []
  const w = window.innerWidth, h = window.innerHeight - 44
  mouseNDC.x =  (x / w) * 2 - 1
  mouseNDC.y = -((y - 44) / h) * 2 + 1
  raycaster.setFromCamera(mouseNDC, camera)
  return raycaster.intersectObjects(getHitTargets(), false)
}

function makeHoverInfo(obj: THREE.Mesh): HoverInfo | null {
  // Pre-built info on the mesh takes priority (galaxy-view star systems)
  if (obj.userData.hoverInfo) return obj.userData.hoverInfo as HoverInfo

  const t = obj.userData.type
  if (t === 'star') {
    const sys = obj.userData.system as StarSystem
    return {
      name:    sys.hostname,
      type:    'Host Star',
      spec:    sys.st_spectype ?? undefined,
      dist:    sys.sy_dist ? `${sys.sy_dist.toFixed(1)} pc` : '? pc — uncharted',
      planets: sys.planets.length,
    }
  }
  if (t === 'planet') {
    const pl = obj.userData.planet as Planet
    return {
      name: pl.pl_name,
      type: 'Exoplanet',
      spec: pl.pl_eqt    ? `${Math.round(pl.pl_eqt)} K eq.temp`    : undefined,
      dist: pl.pl_orbsmax ? `${pl.pl_orbsmax.toFixed(3)} AU orbit` : undefined,
      note: pl.discoverymethod ?? undefined,
    }
  }
  if (t === 'lagrange') {
    const pl = obj.userData.planet as Planet
    return {
      name: `${obj.userData.point} — ${pl.pl_name}`,
      type: `Lagrange ${obj.userData.point} Zone`,
      note: `Orbital stability zone ${obj.userData.point === 'L4' ? '+60°' : '−60°'} relative to ${pl.pl_name}`,
    }
  }
  if (t === 'moon' || t === 'focus_moon') {
    return { name: obj.userData.label ?? 'Moon', type: 'Natural satellite' }
  }
  if (t === 'theoretical_system') {
    return { name: 'Proposed system', type: 'Unsurveyed region', note: obj.userData.label }
  }
  if (t === 'galactic_center') {
    return { name: 'Galactic Core · Sagittarius A*', type: 'Supermassive Black Hole · click to enter', dist: '8,178 pc' }
  }
  const label = obj.userData.label ?? obj.userData.system?.hostname
  return label ? { name: label, type: '' } : null
}

// Object types that should never receive hover/click — they sit in front of the
// real interactive mesh (planet, star) and silently intercept pointer events.
const TRANSPARENT_TYPES = new Set([
  'orbit_ring', 'hz_ring', 'hz_pip', 'rich_pip', 'binary_pip',
  'atm',           // atmosphere sphere — larger than planet, intercepts clicks
  'planet_label',  // floating name sprite — sits above the planet
  'multi_halo',
])

/** Return the first hit that is actually interactive, skipping transparent overlays. */
function firstInteractableHit(hits: THREE.Intersection[]): THREE.Mesh | null {
  for (const h of hits) {
    const m = h.object as THREE.Mesh
    if (!TRANSPARENT_TYPES.has(m.userData.type as string)) return m
  }
  return null
}

function onHover(e: MouseEvent) {
  hoverStyle.value = { left: (e.clientX + 14) + 'px', top: (e.clientY + 14) + 'px' }

  if (hoverTimer !== null) { clearTimeout(hoverTimer); hoverTimer = null }
  if (currentHovered) { restoreHighlight(currentHovered); currentHovered = null }

  const hits = raycast(e.clientX, e.clientY)
  if (!hits.length) {
    if (hoveredInfo.value !== null) {
      hoverTimer = setTimeout(() => { hoveredInfo.value = null; hoverTimer = null }, 2000)
    }
    if (previewDwellTimer) { clearTimeout(previewDwellTimer); previewDwellTimer = null }
    return
  }

  const obj = firstInteractableHit(hits)
  if (!obj) {
    if (hoveredInfo.value !== null) {
      hoverTimer = setTimeout(() => { hoveredInfo.value = null; hoverTimer = null }, 2000)
    }
    if (previewDwellTimer) { clearTimeout(previewDwellTimer); previewDwellTimer = null }
    return
  }

  currentHovered = obj
  applyHighlight(obj)
  hoveredInfo.value = makeHoverInfo(obj)

  // Dwell-to-preview: after 400 ms on a star_system, pin the side preview panel
  if (obj.userData.type === 'star_system') {
    const sys = obj.userData.system as StarSystem
    cancelPreviewDismiss()
    if (!previewSystem.value || previewSystem.value.hostname !== sys.hostname) {
      if (previewDwellTimer) clearTimeout(previewDwellTimer)
      previewDwellTimer = setTimeout(() => {
        previewSystem.value = sys
        previewDwellTimer   = null
      }, 400)
    }
  } else {
    if (previewDwellTimer) { clearTimeout(previewDwellTimer); previewDwellTimer = null }
  }
}

function clearHover() {
  if (currentHovered) { restoreHighlight(currentHovered); currentHovered = null }
  // Persist cursor tooltip 2 s after leaving canvas
  if (hoveredInfo.value !== null) {
    if (hoverTimer !== null) clearTimeout(hoverTimer)
    hoverTimer = setTimeout(() => { hoveredInfo.value = null; hoverTimer = null }, 2000)
  }
  // Cancel any pending dwell; start 4 s dismiss for the preview panel
  if (previewDwellTimer) { clearTimeout(previewDwellTimer); previewDwellTimer = null }
  if (previewSystem.value) startPreviewDismiss()
}

// ── Two-stage zoom helpers ────────────────────────────────────────────────────

function startApproach(targetPos: THREE.Vector3, _sys: StarSystem) {
  const camPos   = camera.position.clone()
  const toTarget = targetPos.clone().sub(camPos)
  const dist     = toTarget.length()

  // Approach point: 55% of the way toward the star, slight upward arc
  const approach = camPos.clone().addScaledVector(toTarget.normalize(), dist * 0.55)
  approach.y    += dist * 0.06

  gsap.to(camera.position, {
    duration: 0.90, ease: 'power2.out',
    x: approach.x, y: approach.y, z: approach.z,
    onUpdate: () => controls.update(),
  })
  gsap.to(controls.target, {
    duration: 0.90, ease: 'power2.out',
    x: targetPos.x, y: targetPos.y, z: targetPos.z,
    onUpdate: () => controls.update(),
  })
}

/** Cancel any pending approach when clicking empty space */
function cancelApproach() {
  if (approachTimer) { clearTimeout(approachTimer); approachTimer = null }
  approachSystem.value      = null
  zoomStage.value           = 0
  clickedNonConfirmed.value = null
}

async function goToGalacticCenter(ox: number, oy: number, bearing: number) {
  await transition.depart(ox, oy, 'iris', bearing)
  void router.push('/galactic-center')
}

function onClick(e: MouseEvent) {
  const hits = raycast(e.clientX, e.clientY)
  if (!hits.length) { cancelApproach(); return }

  // Skip transparent overlay meshes (atm spheres, label sprites, pip dots)
  // so clicks always reach the underlying interactive planet or star
  const obj = firstInteractableHit(hits)
  if (!obj) return
  const t   = obj.userData.type

  if (mode.value === 'galaxy' && t === 'star_system') {
    const sys = obj.userData.system as StarSystem
    selectedPlanet.value = null

    if (approachSystem.value?.hostname === sys.hostname) {
      // ── Stage 2: already approaching this star — commit to system entry ───
      if (approachTimer) { clearTimeout(approachTimer); approachTimer = null }
      approachSystem.value = null
      zoomStage.value      = 2
      enterSystemView(sys)
    } else {
      // ── Stage 1: start approach — animate 55% toward the star ────────────
      if (approachTimer) clearTimeout(approachTimer)
      approachSystem.value = sys
      zoomStage.value      = 1
      startApproach(obj.position, sys)
      // Auto-commit after 1.4 s if user doesn't click again
      approachTimer = setTimeout(() => {
        if (approachSystem.value?.hostname === sys.hostname) {
          approachSystem.value = null
          zoomStage.value      = 2
          enterSystemView(sys)
        }
        approachTimer = null
      }, 1400)
    }
  } else if (mode.value === 'system' && t === 'star') {
    // Clicking star while in planet focus → return to system overview
    if (focusedPlanet.value) { defocusPlanet(); return }
    selectedPlanet.value = null
  } else if (mode.value === 'system' && t === 'planet') {
    focusPlanet(obj as THREE.Mesh)
    return
  } else if (mode.value === 'galaxy' && t === 'theoretical_system') {
    const p   = obj.position.clone()
    const dir = camera.position.clone().sub(p).normalize()
    gsap.to(camera.position, {
      duration: 1.2, x: p.x + dir.x * 80, y: p.y + dir.y * 80, z: p.z + dir.z * 80,
      onUpdate: () => controls.update(),
    })
    gsap.to(controls.target, {
      duration: 1.2, x: p.x, y: p.y, z: p.z,
      onUpdate: () => controls.update(),
    })
    clickedNonConfirmed.value = {
      hostname:    obj.userData.zone_id ?? 'Unsurveyed Region',
      typeLabel:   obj.userData.mission_zone
        ? `Mission Zone · ${obj.userData.mission_zone.toUpperCase()}`
        : 'Theoretical Region',
      statusLabel: '◌ THEORETICAL',
      dotColor:    '#334466',
      badgeColor:  '#667799',
      dist:        obj.userData.dist != null ? `${Math.round(obj.userData.dist as number)} pc` : undefined,
      note:        obj.userData.label as string | undefined,
    }
  } else if (mode.value === 'galaxy' && t === 'galactic_center') {
    // Zoom toward Sgr A* then navigate to the Galactic Center scene. GalaxyPage
    // and GalacticCenterPage now share the same renderer/camera, so this reads
    // as one continuous approach — the iris wipe below only needs to cover the
    // pageGroup swap underneath (Milky Way content → Sgr A* content).
    const p      = obj.position.clone()
    const dir    = camera.position.clone().sub(p).normalize()
    const sc     = p.clone().project(camera!)
    const ox     = (sc.x + 1) / 2 * 100
    const oy     = (1 - sc.y) / 2 * 100
    const bearing = Math.atan2(oy / 100 - 0.5, ox / 100 - 0.5)
    gsap.to(camera.position, {
      duration: 1.4, x: p.x + dir.x * 40, y: p.y + dir.y * 40, z: p.z + dir.z * 40,
      onUpdate: () => controls.update(),
      onComplete: () => { void goToGalacticCenter(ox, oy, bearing) },
    })
    gsap.to(controls.target, {
      duration: 1.4, x: p.x, y: p.y, z: p.z,
      onUpdate: () => controls.update(),
    })
  } else if (mode.value === 'galaxy' && t === 'catalog_black_hole') {
    // Same continuous zoom-then-iris pattern as the Sgr A* marker, routed to
    // this specific catalog object's own scene instead of /galactic-center.
    const bhId  = obj.userData.bhId as string
    const p     = obj.position.clone()
    const dir   = camera.position.clone().sub(p).normalize()
    const sc    = p.clone().project(camera!)
    const ox    = (sc.x + 1) / 2 * 100
    const oy    = (1 - sc.y) / 2 * 100
    const bearing = Math.atan2(oy / 100 - 0.5, ox / 100 - 0.5)
    gsap.to(camera.position, {
      duration: 1.4, x: p.x + dir.x * 40, y: p.y + dir.y * 40, z: p.z + dir.z * 40,
      onUpdate: () => controls.update(),
      onComplete: () => {
        void (async () => {
          await transition.depart(ox, oy, 'iris', bearing)
          void router.push(`/bh/${bhId}`)
        })()
      },
    })
    gsap.to(controls.target, {
      duration: 1.4, x: p.x, y: p.y, z: p.z,
      onUpdate: () => controls.update(),
    })
  } else if (mode.value === 'galaxy' && (t === 'candidate_system' || t === 'frontier_system')) {
    const p   = obj.position.clone()
    const dir = camera.position.clone().sub(p).normalize()
    gsap.to(camera.position, {
      duration: 1.0, x: p.x + dir.x * 60, y: p.y + dir.y * 60, z: p.z + dir.z * 60,
      onUpdate: () => controls.update(),
    })
    gsap.to(controls.target, {
      duration: 1.0, x: p.x, y: p.y, z: p.z,
      onUpdate: () => controls.update(),
    })
    const pl = obj.userData.planet as { hostname?: string; st_spectype?: string; sy_dist?: number; source_catalog?: string; source_id?: string; mission_zone?: string }
    clickedNonConfirmed.value = {
      hostname:    pl?.hostname ?? 'Unknown System',
      typeLabel:   t === 'candidate_system' ? 'Planet Candidate' : 'Frontier (Predicted)',
      statusLabel: t === 'candidate_system' ? '⚠ CANDIDATE' : '◌ FRONTIER',
      dotColor:    t === 'candidate_system' ? '#f0a030' : '#8899bb',
      badgeColor:  t === 'candidate_system' ? '#c07820' : '#6688aa',
      dist:        pl?.sy_dist != null ? `${pl.sy_dist.toFixed(1)} pc` : undefined,
      spec:        pl?.st_spectype ?? undefined,
      note:        t === 'candidate_system'
        ? (pl?.source_catalog ? `${pl.source_catalog.toUpperCase()} · ${pl?.source_id ?? ''}` : undefined)
        : (pl?.mission_zone ? `Mission zone: ${pl.mission_zone.toUpperCase()}` : undefined),
    }
  }
}

function goToSurface(planetName: string) {
  // Called from the system panel planet list — drives camera to the planet in 3D.
  // If the planet mesh exists in the scene, focus it (animates camera + spawns moons).
  // Fallback: just show the detail card if the system hasn't fully built yet.
  const pl = currentSystem.value?.planets.find(p => p.pl_name === planetName)
  if (!pl) return

  const pMesh = systemObjects.find(
    o => (o as THREE.Mesh).isMesh
      && o.userData.type === 'planet'
      && o.userData.planet?.pl_name === planetName,
  ) as THREE.Mesh | undefined

  if (pMesh) {
    focusPlanet(pMesh)   // animates camera + equatorial ring + moons + detail card
  } else {
    selectedPlanet.value = pl   // mesh not ready — at least show the card
  }
}

async function descendToPlanetSurface(pl: Planet, ox: number, oy: number, bearing: number) {
  const surfaceType = await getSurfaceType(pl.pl_name)
  const targetRoute = (surfaceType != null && NO_GROUND_SURFACE_TYPES.has(surfaceType))
    ? `/station-interior/${encodeURIComponent(pl.hostname)}/${encodeURIComponent(pl.pl_name)}?reason=no-solid-crust&surfaceType=${surfaceType}`
    : `/surface/${encodeURIComponent(pl.hostname)}/${encodeURIComponent(pl.pl_name)}`
  await transition.depart(ox, oy, 'iris', bearing)
  void router.push(targetRoute)
}

function enterPlanetSurface(pl: Planet) {
  if (enteringPlanet.value) return
  enteringPlanet.value = true
  controls.enabled = false

  // Brief zoom toward the planet before the descent transition fires. GalaxyPage
  // and SurfaceViewPage now share the same renderer/camera, so this reads as one
  // continuous approach — an iris wipe covers the pageGroup swap underneath
  // rather than the WormholePortal, which is reserved for lateral/long-haul jumps.
  // (Target route is resolved inside descendToPlanetSurface, once surface-type
  // classification returns — kept out of this function so the classification
  // fetch never delays the zoom's visual feedback.)
  const pMesh = systemObjects.find(
    o => (o as THREE.Mesh).isMesh && o.userData.type === 'planet' && o.userData.planet?.pl_name === pl.pl_name
  ) as THREE.Mesh | undefined

  if (pMesh) {
    const p      = pMesh.position.clone()
    const sc     = p.clone().project(camera!)
    const ox     = (sc.x + 1) / 2 * 100
    const oy     = (1 - sc.y) / 2 * 100
    const bearing = Math.atan2(oy / 100 - 0.5, ox / 100 - 0.5)
    gsap.to(controls.target, {
      duration: 0.8, x: p.x, y: p.y, z: p.z,
      ease: 'power2.in', onUpdate: () => controls.update(),
      onComplete: () => { void descendToPlanetSurface(pl, ox, oy, bearing) },
    })
    gsap.to(camera.position, {
      duration: 0.8, x: p.x, y: p.y, z: p.z + 2,
      ease: 'power2.in', onUpdate: () => controls.update(),
    })
  } else {
    void descendToPlanetSurface(pl, 50, 50, 0)
  }
}

function applyHighlight(obj: THREE.Mesh) {
  if (obj.userData.type === 'star_system' && galaxyStarPoints) {
    const i = obj.userData.ptIdx as number | undefined
    if (i === undefined) return
    const sAttr = galaxyStarPoints.geometry.attributes['pSize'] as THREE.BufferAttribute
    const sArr  = sAttr.array as Float32Array
    obj.userData._savedPSize = sArr[i]
    sArr[i] = (sArr[i] ?? 4) * 1.6
    sAttr.needsUpdate = true
    return
  }
  const mat = obj.material as THREE.MeshStandardMaterial
  if (!mat?.emissive) return
  obj.userData._savedEmissive  = mat.emissive.getHex()
  obj.userData._savedIntensity = mat.emissiveIntensity
  mat.emissive.setHex(0xffffff)
  mat.emissiveIntensity = 0.85
}

function restoreHighlight(obj: THREE.Mesh) {
  if (obj.userData.type === 'star_system' && obj.userData._savedPSize !== undefined && galaxyStarPoints) {
    const i = obj.userData.ptIdx as number | undefined
    if (i !== undefined) {
      const sAttr = galaxyStarPoints.geometry.attributes['pSize'] as THREE.BufferAttribute
      ;(sAttr.array as Float32Array)[i] = obj.userData._savedPSize as number
      obj.userData._savedPSize = undefined
      sAttr.needsUpdate = true
    }
    return
  }
  const mat = obj.material as THREE.MeshStandardMaterial
  if (!mat?.emissive || obj.userData._savedEmissive === undefined) return
  mat.emissive.setHex(obj.userData._savedEmissive)
  mat.emissiveIntensity = obj.userData._savedIntensity
}

// ── Surface panel helpers ─────────────────────────────────────────────────────

function planetColorHex(p: Planet): string {
  return planetColor(p.pl_eqt, p.pl_orbsmax).getHexString()
}

// ── Resize ────────────────────────────────────────────────────────────────────

// onResize handled globally by MainLayout via viz.resize()

// ── Helpers ───────────────────────────────────────────────────────────────────

function describePlanet(p: Planet): string {
  const parts = [p.pl_name]
  if (p.pl_rade   != null) parts.push(p.pl_rade.toFixed(2)   + ' R⊕')
  if (p.pl_bmasse != null) parts.push(p.pl_bmasse.toFixed(1) + ' M⊕')
  if (p.pl_eqt    != null) parts.push(Math.round(p.pl_eqt)   + ' K')
  if (p.pl_orbsmax != null) parts.push(p.pl_orbsmax.toFixed(3) + ' AU')
  if (p.pl_orbper  != null) parts.push(p.pl_orbper.toFixed(1)  + ' d')
  return parts.join(' · ')
}

// ── DefenderNav data + event handlers ────────────────────────────────────────

function buildDefenderData(): DefenderNavData {
  if (mode.value !== 'system' || !currentSystem.value) return {}
  const sys = currentSystem.value

  const starMarker = galaxyMarkers.find(m => m.userData.system?.hostname === sys.hostname)
  const starPos    = starMarker?.position ?? new THREE.Vector3()

  const camDelta       = camera.position.clone().sub(starPos)
  const cameraAngleDeg = ((Math.atan2(camDelta.x, camDelta.z) * 180 / Math.PI) + 360) % 360
  const vizR           = Math.max(0, camDelta.length())
  const cameraRadiusAU = Math.max(0, (Math.pow(10, Math.max(0, vizR - 14) * Math.log10(61) / 171) - 1) / 6)

  const cfg = _stellarCfgCache ?? resolveStellarConfig(sys)
  if (cfg.innerBinary) cfg.innerBinary.angle = binaryAngle

  const planets: PlanetStripEntry[] = []
  for (const obj of animObjects) {
    const d = obj.userData
    if (d.type !== 'planet') continue
    const pl  = d.planet as Planet
    const au  = pl.pl_orbsmax ?? fallbackAU(0, sys.planets.length)
    const deg = ((d.orbAngle * 180 / Math.PI) + 360) % 360
    planets.push({
      name:          pl.pl_name,
      angle:         deg,
      radius:        au,
      eqt:           pl.pl_eqt ?? null,
      hasMoon:       sys.sy_mnum > 0,
      hasSettlement: false,
      l4angle:       (deg + 60)  % 360,
      l5angle:       (deg - 60 + 360) % 360,
      orbitType:     cfg.type === 'circumbinary' ? 'circumbinary' : 'circumstellar',
      isCurrent:     selectedPlanet.value?.pl_name === pl.pl_name,
    })
  }

  return {
    systemData: {
      starTeff:      sys.st_teff ?? 5778,
      starPos:       { x: starPos.x, z: starPos.z },
      planets,
      galleries:     galleriesForCurrentSystem.value,
      cameraAngle:   cameraAngleDeg,
      cameraRadius:  cameraRadiusAU,
      stellarConfig: cfg,
    },
    // Earth↔System inset — always provided in system mode
    currentSystemRef: sys.sy_dist != null ? {
      hostname: sys.hostname,
      distPc:   sys.sy_dist,
      ra:       sys.ra,
      dec:      sys.dec,
    } : undefined,
  }
}

function onDefenderFlyTo(target: DefenderTarget) {
  if (target.type === 'planet') {
    const mesh = systemObjects.find(
      o => (o as THREE.Mesh).isMesh && o.userData.type === 'planet'
        && o.userData.planet?.pl_name === target.id
    ) as THREE.Mesh | undefined
    if (mesh) focusPlanet(mesh)
  } else if (target.type === 'lagrange') {
    const mesh = systemObjects.find(
      o => (o as THREE.Mesh).isMesh && o.userData.type === 'lagrange'
        && `${o.userData.point} — ${o.userData.planet?.pl_name}` === target.id
    ) as THREE.Mesh | undefined
    if (mesh) {
      const p = mesh.position.clone()
      gsap.to(camera.position, { duration: 1.6, x: p.x + 15, y: p.y + 8, z: p.z + 15, ease: 'power2.inOut', onUpdate: () => controls.update() })
      gsap.to(controls.target, { duration: 1.6, x: p.x, y: p.y, z: p.z, ease: 'power2.inOut', onUpdate: () => controls.update() })
    }
  }
}

function onDefenderPortalTo(dest: { label: string; route: string }) {
  const srcColor = currentSystem.value
    ? '#' + starColorFromTeff(currentSystem.value.st_teff).getHexString()
    : undefined
  portalStore.openPortal({ ...dest, sourceColor: srcColor })
}

function onAscendRealm() {
  // From system mode → exit to galaxy (cosmic) view
  if (mode.value === 'system') {
    exitSystem()
  }
  // In galaxy/cosmic mode the button is hidden, so this is a no-op fallback
}

// ── Context zoom — Earth ↔ current system ────────────────────────────────────

const hasReturnPosition = ref(false)

// Saved camera state for the ◄ PREV return
let savedCamPos:    THREE.Vector3 | null = null
let savedTargetPos: THREE.Vector3 | null = null
let contextLine:    THREE.Line    | null = null   // Sol↔system dashed line

function onContextZoom() {
  if (!currentSystem.value || !renderer) return
  logNavEvent('context_zoom', { hostname: currentSystem.value.hostname, dist: currentSystem.value.sy_dist })

  // Save current camera so we can return
  savedCamPos    = camera.position.clone()
  savedTargetPos = controls.target.clone()
  hasReturnPosition.value = true

  // Sol is at galaxy-view origin; current system is at its 3D viz position
  const solPos = new THREE.Vector3(0, 0, 0)
  const sys    = currentSystem.value
  const sysPos = raDecToVec3(sys.ra, sys.dec, distToViz(sys.sy_dist ?? 500))

  // Add or refresh the Sol↔system connecting line
  removeContextLine()
  const pts = [solPos, sysPos]
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  // Dashed line via LineSegments with alternating segments
  const lineMat = new THREE.LineDashedMaterial({
    color: 0x00c8ff, dashSize: 4, gapSize: 6,
    transparent: true, opacity: 0.55, depthWrite: false,
  })
  contextLine = new THREE.Line(geo, lineMat)
  contextLine.computeLineDistances()
  scene.add(contextLine)

  // Midpoint between Sol and the system
  const mid  = solPos.clone().lerp(sysPos, 0.5)
  const span = solPos.distanceTo(sysPos)

  // Camera: slightly above and behind the midpoint to show both clearly
  const fromCam  = camera.position.clone().sub(mid).normalize()
  const camDist  = Math.max(span * 0.9, 80)
  const targetX  = mid.x + fromCam.x * camDist * 0.15
  const targetY  = mid.y + camDist * 0.38
  const targetZ  = mid.z + fromCam.z * camDist * 0.85

  gsap.to(camera.position, {
    duration: 3.0, x: targetX, y: targetY, z: targetZ,
    ease: 'power3.inOut', onUpdate: () => controls.update(),
  })
  gsap.to(controls.target, {
    duration: 3.0, x: mid.x, y: mid.y, z: mid.z,
    ease: 'power2.inOut', onUpdate: () => controls.update(),
  })
}

function onReturnToPrev() {
  if (!savedCamPos || !savedTargetPos) return
  const cam = savedCamPos.clone(), tgt = savedTargetPos.clone()

  gsap.to(camera.position, {
    duration: 2.2, x: cam.x, y: cam.y, z: cam.z,
    ease: 'power2.inOut', onUpdate: () => controls.update(),
    onComplete: () => { hasReturnPosition.value = false; removeContextLine() },
  })
  gsap.to(controls.target, {
    duration: 2.2, x: tgt.x, y: tgt.y, z: tgt.z,
    ease: 'power2.inOut', onUpdate: () => controls.update(),
  })
  savedCamPos = null; savedTargetPos = null
}

function removeContextLine() {
  if (contextLine) { scene.remove(contextLine); contextLine.geometry.dispose(); contextLine = null }
}

// ── Legend data ───────────────────────────────────────────────────────────────

const starLegend = [
  { color: '#9bb0ff', label: 'O/B  >10 000 K' },
  { color: '#cad7ff', label: 'A    white' },
  { color: '#fff4ea', label: 'F/G  Sun-like' },
  { color: '#ffd2a1', label: 'K    orange' },
  { color: '#ffcc6f', label: 'M    red dwarf' },
]
const planetLegend = [
  { color: '#ff4500', label: '>2 000 K  ultra-hot' },
  { color: '#ff8c42', label: '1 000 K   hot' },
  { color: '#4ecdc4', label: '200 K     temperate' },
  { color: '#82b4d0', label: '<200 K    icy' },
  { color: '#9999bb', label: 'Moon (proposed)' },
  { color: '#5a4a7a', label: 'Proposed — unsurveyed' },
  { color: '#f0a030', label: 'Candidate (TOI/KOI)' },
  { color: '#8899bb', label: 'Frontier (predicted)' },
]

// Pip indicators replace ring geometry — same info at 1/50th visual weight
const pipLegend = [
  { color: '#22ff88', label: 'HZ planet confirmed  (2 oclock)' },
  { color: '#88bbff', label: '5+ planet system     (10 oclock)' },
  { color: '#ffd480', label: 'Binary / multi-star  (6 oclock)' },
]

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await galaxyStore.loadData()
  initScene()
  _stopTick = viz.addTick(galaxyTick)

  // ── Apply cosmic approach vector so galaxy opens facing correct direction ──
  try {
    const raw = sessionStorage.getItem('exo_cosmic_approach')
    if (raw) {
      const a = JSON.parse(raw) as { dir_x: number; dir_y: number; dir_z: number }
      sessionStorage.removeItem('exo_cosmic_approach')   // consume once
      const d  = new THREE.Vector3(a.dir_x, a.dir_y, a.dir_z).normalize()
      const D  = 550   // galaxy view initial distance
      const el = D * 0.14
      camera.position.set(-d.x * D, el, -d.z * D)
      camera.lookAt(0, 0, 0)
      controls.update()
    }
  } catch { /* no stored approach — use default */ }

  buildGalaxyView()
  buildTheoreticalSystems()
  buildGalacticCenterMarker()
  buildCatalogBlackHoleMarkers()
  loaded.value = true

  // Supplementary tiers loaded only when user toggles them on (see showPredicted)
  watchEffect(() => {
    if (!showPredicted.value) return
    if (!galaxyStore.isCandidateLoaded) { void galaxyStore.loadCandidateData() }
    if (!galaxyStore.isFrontierLoaded)  { void galaxyStore.loadFrontierData()  }
    if (galaxyStore.isCandidateLoaded && candidateMarkers.length === 0) buildCandidateView()
    if (galaxyStore.isFrontierLoaded  && frontierMarkers.length  === 0) buildFrontierView()
  })

  // Explore-menu "Planet Systems" shortcut — enable habitable-zone filter on arrival
  if (route.query.hz === '1') filterHZ.value = true

  // Deep-link from cosmic view or surface view: auto-enter the specified system
  const focusHost    = route.query.focusHost    as string | undefined
  const contextView  = route.query.contextView  as string | undefined
  if (focusHost) {
    const sys = galaxyStore.getSystem(focusHost)
    if (sys) {
      await nextTick()
      enterSystemView(sys)
      // If arriving from surface with contextView=true, auto-trigger context zoom
      if (contextView === 'true') {
        setTimeout(() => onContextZoom(), 350)  // allow Three.js to build system objects
      }
    }
  }
})

onUnmounted(() => {
  _stopTick?.()
  _stopTick = null

  disposeScene(pageGroup)
  scene?.remove(pageGroup)
  if (scene) { scene.background = null; scene.fog = null }

  galaxyMarkers      = []
  theoreticalMarkers = []
  frontierMarkers    = []
  candidateMarkers   = []
  catalogBhMarkers   = []
  animObjects        = []
  focusMoonObjects   = []
  galaxyStarPoints       = null
  galaxyPipPoints        = null
  focusedPlanetMesh      = null
  contextLine            = null
  galacticCenterMarker   = null
})
</script>

<style scoped>
/* ── Activity badge hover panel ───────────────────────────────── */

.hover-box {
  position: fixed;
  background: rgba(1, 6, 20, 0.95);
  border: 1px solid rgba(0, 180, 220, 0.30);
  border-radius: 6px;
  padding: 8px 11px 7px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #b0c8e8;
  pointer-events: none;
  z-index: 10;
  min-width: 180px;
  max-width: 280px;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 16px rgba(0, 160, 220, 0.12);
}

.hb-name {
  font-size: 12px;
  color: rgba(200, 230, 255, 0.92);
  letter-spacing: 0.05em;
  margin-bottom: 2px;
  font-weight: 600;
}

.hb-spec {
  font-size: 9px;
  color: rgba(80, 150, 190, 0.72);
  letter-spacing: 0.04em;
  margin-bottom: 7px;
}

.hb-dot { margin: 0 4px; opacity: 0.45; }

/* Badge row layout */
.hb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

/* Base badge pill */
.hb-badge {
  display: inline-flex;
  align-items: center;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 3px;
  border: 1px solid;
  white-space: nowrap;
}

/* System composition badges */
.hb-badge--planets  { color: rgba(180, 220, 255, 0.82); border-color: rgba(80, 140, 200, 0.35); background: rgba(0, 60, 120, 0.25); }
.hb-badge--moons    { color: rgba(160, 200, 240, 0.72); border-color: rgba(60, 110, 170, 0.28); background: rgba(0, 40, 100, 0.20); }
.hb-badge--binary   { color: rgba(255, 210, 130, 0.82); border-color: rgba(200, 160, 50, 0.38); background: rgba(80, 50, 0, 0.25); }
.hb-badge--hz       { color: rgba(80, 220, 140, 0.90);  border-color: rgba(60, 200, 100, 0.45); background: rgba(0, 80, 40, 0.28); }

/* Activity badges — greyed when no data (—), coloured when live */
.hb-row--activity   { margin-top: 2px; }
.hb-badge--settlement { color: rgba(100, 190, 150, 0.60); border-color: rgba(80, 160, 110, 0.22); background: transparent; }
.hb-badge--art        { color: rgba(170, 130, 210, 0.60); border-color: rgba(140, 100, 190, 0.22); background: transparent; }
.hb-badge--science    { color: rgba(100, 170, 210, 0.60); border-color: rgba(80, 140, 190, 0.22); background: transparent; }

/* When activity badge has live data (non-zero count) */
.hb-badge--live {
  opacity: 1;
  border-color: currentColor;
  background: rgba(0, 40, 80, 0.35);
  box-shadow: 0 0 6px currentColor;
}

.hb-note {
  margin-top: 4px;
  font-size: 9px;
  color: rgba(80, 130, 160, 0.60);
  white-space: normal;
  line-height: 1.45;
}
/* ── Two-stage zoom HUD badge ─────────────────────────────────── */

.zoom-stage-badge {
  position: fixed;
  top: 46px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px 5px 10px;
  background: rgba(0, 8, 22, 0.88);
  border: 1px solid rgba(0, 200, 255, 0.28);
  border-radius: 20px;
  backdrop-filter: blur(8px);
  z-index: 30;
  font-family: 'Courier New', monospace;
  pointer-events: none;
}

.zsb-stage {
  font-size: 9px;
  font-weight: 700;
  color: rgba(0, 230, 255, 0.90);
  background: rgba(0, 80, 130, 0.50);
  border-radius: 10px;
  padding: 1px 7px;
  letter-spacing: 0.08em;
}

.zsb-label {
  font-size: 9px;
  color: rgba(140, 200, 235, 0.75);
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 340px;
}

.zoom-badge-enter-active { transition: opacity 0.20s ease, transform 0.20s ease; }
.zoom-badge-leave-active  { transition: opacity 0.15s ease, transform 0.15s ease; }
.zoom-badge-enter-from    { opacity: 0; transform: translateX(-50%) translateY(-6px); }
.zoom-badge-leave-to      { opacity: 0; transform: translateX(-50%) translateY(-4px); }

.hover-fade-enter-active,
.hover-fade-leave-active { transition: opacity 0.15s ease; }
.hover-fade-enter-from,
.hover-fade-leave-to    { opacity: 0; }

/* ── Stellar detail lens trigger ─────────────────────────────── */

.stellar-lens-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 5px 8px;
  margin: 4px 0 2px;
  font-family: 'Courier New', monospace;
  font-size: 8.5px;
  letter-spacing: 0.10em;
  color: rgba(0, 200, 240, 0.75);
  background: rgba(0, 40, 80, 0.35);
  border: 1px solid rgba(0, 160, 210, 0.28);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.stellar-lens-btn:hover {
  background: rgba(0, 70, 120, 0.55);
  border-color: rgba(0, 220, 255, 0.50);
}
.slb-icon { font-size: 11px; }

.system-panel {
  position: absolute;
  top: 50px;
  left: 12px;
  width: 260px;
  background: rgba(2, 6, 18, 0.88);
  border: 1px solid rgba(49, 204, 236, 0.2);
  border-radius: 6px;
  backdrop-filter: blur(4px);
  z-index: 5;
}

.planet-row {
  padding: 3px 6px;
  border-radius: 3px;
  transition: background 0.15s;
}
.planet-row:hover { background: rgba(49, 204, 236, 0.1); }

.planet-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.planet-row--selected {
  background: rgba(0, 200, 220, 0.08);
  border-radius: 3px;
}

/* ── Planet detail card ─────────────────────────────────────────────── */

.planet-card {
  position: absolute;
  top: 54px;
  right: 12px;
  width: 240px;
  background: rgba(1, 4, 16, 0.94);
  border: 1px solid rgba(0, 200, 220, 0.22);
  border-radius: 7px;
  backdrop-filter: blur(8px);
  z-index: 6;
}

.planet-card-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pclass-badge {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 3px 8px;
  border: 1px solid;
  border-radius: 4px;
  background: rgba(0,0,0,0.35);
}
.pclass-label {
  font-family: monospace;
  font-size: 9px;
  letter-spacing: 0.12em;
  font-weight: 700;
}
.pclass-desc {
  font-family: monospace;
  font-size: 9px;
  opacity: 0.75;
}

/* ── Planet entry fade overlay ──────────────────────────────────────── */

.planet-entry-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  animation: planetFadeIn 2.0s ease-in forwards;
  z-index: 50;
  pointer-events: none;
}

@keyframes planetFadeIn {
  0%   { opacity: 0; }
  50%  { opacity: 0.5; }
  100% { opacity: 1; }
}

.planet-fade-enter-active { animation: planetFadeIn 2.0s ease-in forwards; }

/* ── Legend anchor + toggle ───────────────────────────────────── */
.legend-anchor {
  position: absolute;
  bottom: 92px;
  left: 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.legend-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px 3px 6px;
  background: rgba(0, 10, 25, 0.72);
  border: 1px solid rgba(0, 130, 180, 0.22);
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  backdrop-filter: blur(6px);
  transition: background 0.13s, border-color 0.13s;
}
.legend-toggle:hover {
  background: rgba(0, 20, 45, 0.88);
  border-color: rgba(0, 180, 220, 0.38);
}
.legend-toggle__icon {
  font-size: 9px;
  color: rgba(0, 190, 230, 0.55);
}
.legend-toggle__label {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.12em;
  color: rgba(80, 150, 190, 0.70);
}

.legend-block {
  background: rgba(0, 0, 0, 0.72);
  border: 1px solid rgba(0, 100, 150, 0.18);
  border-radius: 5px;
  font-family: monospace;
  backdrop-filter: blur(6px);
}

/* Slide-up transition for the legend panel */
.legend-slide-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.legend-slide-leave-active  { transition: opacity 0.14s ease, transform 0.14s ease; }
.legend-slide-enter-from    { opacity: 0; transform: translateY(6px); }
.legend-slide-leave-to      { opacity: 0; transform: translateY(4px); }
.legend-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}
.legend-section {
  font-size: 7px;
  letter-spacing: 0.12em;
  color: rgba(80, 130, 160, 0.60);
  margin-bottom: 3px;
}

.legend-dot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Pip dots are slightly smaller than legend dots — more accurate scale */
.legend-pip {
  width: 5px;
  height: 5px;
  box-shadow: 0 0 4px currentColor;
}

.legend-badge-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.legend-badge {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  min-width: 28px;
  text-align: right;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(2, 4, 10, 0.85);
  z-index: 20;
}

/* ── Galaxy view layer controls ───────────────────────────────── */

.gl-controls {
  position: fixed;
  bottom: 92px;
  right: 14px;
  z-index: 6;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-end;
}

.gl-controls--system {
  /* System mode buttons are slightly larger — primary action is prominent */
}

/* Base pill button */
.gl-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  min-width: 120px;
  border: 1px solid rgba(0, 140, 180, 0.30);
  border-radius: 22px;
  background: rgba(0, 8, 24, 0.90);
  color: rgba(120, 180, 210, 0.72);
  font-family: 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 0.10em;
  cursor: pointer;
  transition: all 0.14s;
  backdrop-filter: blur(6px);
  user-select: none;
  white-space: nowrap;
  justify-content: flex-start;
}

.gl-pill:hover:not(.gl-pill--disabled) {
  background: rgba(0, 40, 80, 0.85);
  border-color: rgba(0, 200, 240, 0.50);
  color: rgba(180, 230, 255, 0.90);
}

/* Active / toggled on */
.gl-pill--on {
  background: rgba(0, 30, 60, 0.92);
  border-color: rgba(0, 200, 240, 0.50);
  color: rgba(180, 230, 255, 0.92);
  box-shadow: 0 0 12px rgba(0, 160, 220, 0.15);
}

/* Primary action (Enter Surface) */
.gl-pill--primary {
  background: rgba(0, 60, 100, 0.85);
  border-color: rgba(0, 200, 240, 0.55);
  color: #00e5ff;
  font-weight: 600;
  min-width: 140px;
  justify-content: center;
}

.gl-pill--primary:hover:not(.gl-pill--disabled) {
  background: rgba(0, 100, 160, 0.85);
  box-shadow: 0 0 18px rgba(0, 200, 240, 0.25);
}

/* Disabled state */
.gl-pill--disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Small coloured pip indicator inside pill */
.gl-pip {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.15s;
  box-shadow: 0 0 5px currentColor;
}

/* ── System-mode controls — bottom-right, ABOVE the NavigatorInset ──
   NavigatorInset: bottom 142 px, height ~190 px → top edge ~332 px.
   Buttons sit at bottom: 340 px so there is a clear gap above the inset.
   Legend lives at bottom-left so there is zero overlap.
   Labels expand LEFTWARD from the icon (row-reverse) so text never
   spills into the right margin or over the inset.              ──── */

.sys-controls {
  position: fixed;
  bottom: 340px;
  right: 14px;
  left: auto;
  z-index: 6;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;   /* flush to right edge */
}

.sys-btn {
  display: inline-flex;
  align-items: center;
  flex-direction: row-reverse;  /* icon right, label expands leftward */
  gap: 0;
  height: 34px;
  max-width: 34px;         /* collapsed: icon-only circle */
  overflow: hidden;
  border-radius: 17px;
  border: 1px solid rgba(0, 140, 180, 0.28);
  background: rgba(0, 8, 24, 0.88);
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: max-width 0.28s ease, gap 0.28s ease,
              background 0.14s, border-color 0.14s;
  padding: 0 11px;
  user-select: none;
}

.sys-btn:hover:not(.sys-btn--disabled) {
  max-width: 175px;       /* expands leftward (row-reverse) */
  gap: 8px;
  background: rgba(0, 40, 80, 0.88);
  border-color: rgba(0, 200, 240, 0.48);
}

.sys-btn--surface        { border-color: rgba(0, 180, 220, 0.35); }
.sys-btn--surface:hover:not(.sys-btn--disabled) {
  background: rgba(0, 60, 110, 0.88);
  border-color: rgba(0, 229, 255, 0.60);
  box-shadow: 0 0 14px rgba(0, 200, 240, 0.20);
}

.sys-btn--disabled { opacity: 0.32; cursor: not-allowed; }

/* ── Planet data sheet accordion ──────────────────────────── */

.planet-card-accordion {
  display: flex; align-items: center; width: 100%;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(60,100,130,0.22);
  border-radius: 4px; padding: 4px 8px; cursor: pointer;
  color: #5588aa; font-size: 10px; gap: 5px;
  transition: background 0.15s; margin-bottom: 4px;
  font-family: 'Courier New', monospace; letter-spacing: 0.04em;
}
.planet-card-accordion:hover { background: rgba(255,255,255,0.07); color: #77aacc; }
.pca-arrow { font-size: 9px; }
.pca-label { flex: 1; text-align: left; letter-spacing: 0.10em; }
.pca-hint  { color: rgba(60,90,115,0.65); font-size: 9px; }

.planet-card-stats { overflow: hidden; padding-top: 4px; }

.pca-slide-enter-active,
.pca-slide-leave-active {
  transition: opacity 0.18s ease, max-height 0.22s ease;
  max-height: 600px;
}
.pca-slide-enter-from,
.pca-slide-leave-to { opacity: 0; max-height: 0; }

/* Planet follow + DK.MAT buttons */
.sys-btn--active {
  border-color: rgba(0, 230, 255, 0.60) !important;
  background:   rgba(0, 80, 120, 0.55) !important;
  color:        rgba(0, 240, 255, 0.95) !important;
  box-shadow:   0 0 10px rgba(0, 200, 255, 0.25);
}

.sys-btn--dkmat { border-color: rgba(160, 80, 255, 0.35); }
.sys-btn--dkmat:hover:not(.sys-btn--disabled) {
  border-color: rgba(180, 100, 255, 0.60);
  color: rgba(200, 140, 255, 0.90);
}
.sys-btn--dkmat.sys-btn--active {
  border-color: rgba(180, 100, 255, 0.65) !important;
  background:   rgba(60, 0, 120, 0.55) !important;
  color:        rgba(210, 150, 255, 0.95) !important;
  box-shadow:   0 0 14px rgba(160, 80, 255, 0.35);
}

.sys-icon {
  font-size: 15px;
  flex-shrink: 0;
  width: 16px;
  text-align: center;
  color: rgba(140, 200, 230, 0.80);
}

.sys-label {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.10em;
  white-space: nowrap;
  color: rgba(160, 215, 240, 0.85);
  opacity: 0;
  transform: translateX(-5px);
  transition: opacity 0.16s 0.10s, transform 0.16s 0.10s;
}

.sys-btn:hover:not(.sys-btn--disabled) .sys-label {
  opacity: 1;
  transform: translateX(0);
}

/* ── Persistent system preview panel ─────────────────────────────── */

.sys-preview {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 256px;
  background: rgba(1, 6, 22, 0.96);
  border: 1px solid rgba(0, 180, 220, 0.28);
  border-radius: 8px;
  padding: 12px 14px 12px;
  z-index: 50;
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 160, 200, 0.06);
  pointer-events: all;
}

.ncs-preview {
  border-color: rgba(180, 140, 60, 0.25);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(180, 130, 40, 0.06);
}

.sp-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.sp-star-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}

.sp-title { flex: 1; min-width: 0; }

.sp-name {
  font-size: 12px;
  font-weight: 600;
  color: rgba(210, 235, 255, 0.92);
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-spec {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: rgba(80, 150, 190, 0.70);
  letter-spacing: 0.04em;
  margin-top: 1px;
}

.sp-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.sp-badge {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid;
  white-space: nowrap;
}
.sp-badge--planets { color: rgba(160, 210, 255, 0.82); border-color: rgba(80, 140, 200, 0.32); background: rgba(0, 50, 110, 0.22); }
.sp-badge--moons   { color: rgba(140, 190, 240, 0.70); border-color: rgba(60, 110, 170, 0.26); background: rgba(0, 35, 90, 0.18); }
.sp-badge--binary  { color: rgba(255, 210, 120, 0.80); border-color: rgba(200, 160, 50, 0.36); background: rgba(70, 45, 0, 0.22); }
.sp-badge--hz      { color: rgba(80, 225, 130, 0.90);  border-color: rgba(60, 200, 100, 0.42); background: rgba(0, 70, 35, 0.26); }

.sp-sep {
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  margin: 6px 0 8px;
}

.sp-planet-list { margin-bottom: 6px; }

.sp-planet {
  display: flex;
  align-items: center;
  padding: 3px 0;
  gap: 6px;
  font-size: 11px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.sp-planet-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sp-planet-name {
  flex: 1;
  color: rgba(180, 210, 235, 0.80);
  font-family: monospace;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-planet-stat {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: rgba(80, 130, 160, 0.65);
  white-space: nowrap;
}

.sp-more {
  font-size: 9px;
  color: rgba(80, 120, 150, 0.55);
  padding: 3px 0;
  text-align: right;
  font-family: 'Courier New', monospace;
}

.sp-activity {
  display: flex;
  gap: 6px;
  margin: 6px 0 8px;
}

.sp-act-badge {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: rgba(80, 120, 150, 0.55);
  padding: 2px 6px;
  border: 1px solid rgba(80, 120, 150, 0.18);
  border-radius: 3px;
}

.sp-enter {
  font-size: 11px;
  letter-spacing: 0.05em;
}

/* Preview panel slide-in from the right */
.preview-slide-enter-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.2, 0, 0.3, 1);
}
.preview-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.preview-slide-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(24px);
}
.preview-slide-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(12px);
}
</style>
