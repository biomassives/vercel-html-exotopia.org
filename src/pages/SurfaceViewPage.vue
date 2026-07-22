<template>
  <q-page class="surface-page viz-overlay-page"
    @mousemove="onMouseMove"
    @mouseleave="hoveredObject = null"
    @click="onCanvasClick"
    @dblclick="onCanvasDblClick"
  >

    <!-- ── X-RAY mode overlays ────────────────────────────────────── -->
    <Transition name="xray-fade">
      <div v-if="viewMode === 'xray'" class="xray-overlays" aria-hidden="true">

        <!-- Scan-line texture -->
        <div class="xray-scanlines" />

        <!-- Vignette -->
        <div class="xray-vignette" />

        <!-- Sensor HUD frame corners -->
        <div class="xray-corner xray-corner--tl" />
        <div class="xray-corner xray-corner--tr" />
        <div class="xray-corner xray-corner--bl" />
        <div class="xray-corner xray-corner--br" />

        <!-- Sensor mode label -->
        <div class="xray-mode-label">
          <span class="xray-blink">●</span>
          THERMAL · BINARY FIELD VISION
        </div>

        <!-- Thermal scale bar (logarithmic temperature ruler) -->
        <div class="xray-scale">
          <div class="xray-scale-title">TEMP SCALE</div>
          <div class="xray-scale-bar">
            <div
              v-for="t in THERMAL_TICKS"
              :key="t.label"
              class="xray-scale-row"
            >
              <span class="xray-scale-label">{{ t.label }}</span>
              <div class="xray-scale-swatch" :style="{ background: t.color }" />
            </div>
          </div>
          <div class="xray-scale-note">log K · {{ eqtLabel }}</div>
        </div>

        <!-- Distance log ruler (right edge) -->
        <div class="xray-ruler">
          <div class="xray-ruler-title">DIST</div>
          <div
            v-for="d in DISTANCE_TICKS"
            :key="d.label"
            class="xray-ruler-tick"
            :style="{ top: d.pct + '%' }"
          >
            <span class="xray-ruler-label">{{ d.label }}</span>
            <div class="xray-ruler-line" />
          </div>
        </div>

      </div>
    </Transition>

    <!-- ── Entry approach HUD ─────────────────────────────────────── -->
    <Transition name="xray-fade">
      <div v-if="entryAnimating" class="entry-hud" aria-hidden="true">
        <div class="eh-corner eh-corner--tl" /><div class="eh-corner eh-corner--tr" />
        <div class="eh-corner eh-corner--bl" /><div class="eh-corner eh-corner--br" />
        <div class="eh-top">
          <span class="eh-label">DESCENT APPROACH</span>
          <span class="eh-sep">·</span>
          <span class="eh-planet">{{ planetName }}</span>
        </div>
        <div class="eh-bottom">
          <span class="eh-sys">{{ hostname }}</span>
          <span class="eh-sep">·</span>
          <span class="eh-mode">ION DRIVE</span>
          <span class="eh-blink">▮</span>
        </div>
      </div>
    </Transition>

    <!-- ── Thermal lens badge (hot worlds: eqt > 600K) ─────────── -->
    <Transition name="xray-fade">
      <div v-if="planet?.pl_eqt && planet.pl_eqt > 600 && viewMode === 'natural'" class="thermal-lens-hud">
        <span class="tlh-icon">⊙</span>
        <span class="tlh-label">THERMAL LENS</span>
        <span class="tlh-sep">·</span>
        <span class="tlh-temp">{{ planet.pl_eqt.toLocaleString() }} K</span>
      </div>
    </Transition>

    <!-- ── Property header ─────────────────────────────────────── -->
    <!-- ── Planet info panel (top-left, collapsible) ─────────────── -->
    <div v-show="!entryAnimating" class="planet-info-panel">

      <!-- Collapsed header — always visible -->
      <div class="pip-header" @click="infoPanelOpen = !infoPanelOpen">
        <q-icon
          :name="isMoonView ? 'brightness_3' : 'public'"
          size="13px" color="cyan-5" class="q-mr-xs"
        />
        <span class="pip-planet-name">{{ planetName }}</span>
        <span class="pip-zone-chip" :class="`zone--${planetZone.cls}`">{{ planetZone.label }}</span>
        <span class="pip-toggle">{{ infoPanelOpen ? '▲' : '▼' }}</span>
      </div>

      <!-- Expanded body -->
      <Transition name="pip-expand">
        <div v-if="infoPanelOpen" class="pip-body">

          <!-- Host star -->
          <div class="pip-section">
            <div class="pip-section-label">HOST STAR</div>
            <div class="pip-row">
              <span class="pip-k">System</span>
              <span class="pip-v">{{ hostname }}</span>
            </div>
            <div class="pip-row" v-if="system?.st_spectype">
              <span class="pip-k">Spectral type</span>
              <span class="pip-v">{{ system.st_spectype }}</span>
            </div>
            <div class="pip-row" v-if="system?.st_teff">
              <span class="pip-k">Temperature</span>
              <span class="pip-v">{{ system.st_teff.toLocaleString() }} K</span>
            </div>
            <div class="pip-row" v-if="system?.sy_snum && system.sy_snum > 1">
              <span class="pip-k">Stars</span>
              <span class="pip-v pip-v--warn">{{ system.sy_snum }}-star system</span>
            </div>
          </div>

          <!-- Location -->
          <div class="pip-section">
            <div class="pip-section-label">LOCATION</div>
            <div class="pip-row" v-if="system?.sy_dist">
              <span class="pip-k">Distance</span>
              <span class="pip-v">{{ system.sy_dist.toFixed(1) }} pc · {{ (system.sy_dist * 3.2616).toFixed(0) }} ly</span>
            </div>
            <div class="pip-row" v-if="system">
              <span class="pip-k">RA · Dec</span>
              <span class="pip-v">{{ system.ra.toFixed(2) }}° · {{ system.dec.toFixed(2) }}°</span>
            </div>
          </div>

          <!-- This planet -->
          <div class="pip-section">
            <div class="pip-section-label">THIS PLANET</div>
            <div class="pip-row" v-if="planet?.pl_eqt">
              <span class="pip-k">Eq. temp</span>
              <span class="pip-v" :class="`zone--${planetZone.cls}`">{{ planet.pl_eqt }} K</span>
            </div>
            <div class="pip-row" v-if="planet?.pl_rade">
              <span class="pip-k">Radius</span>
              <span class="pip-v">{{ planet.pl_rade.toFixed(2) }} R⊕</span>
            </div>
            <div class="pip-row" v-if="planet?.pl_bmasse">
              <span class="pip-k">Mass</span>
              <span class="pip-v">{{ planet.pl_bmasse.toFixed(2) }} M⊕</span>
            </div>
            <div class="pip-row" v-if="planet?.pl_orbsmax">
              <span class="pip-k">Orbit</span>
              <span class="pip-v">{{ planet.pl_orbsmax.toFixed(3) }} AU</span>
            </div>
            <div class="pip-row" v-if="planet?.pl_orbper">
              <span class="pip-k">Period</span>
              <span class="pip-v">{{ planet.pl_orbper.toFixed(1) }} days</span>
            </div>
            <div class="pip-row" v-if="planet?.pl_insol">
              <span class="pip-k">Insolation</span>
              <span class="pip-v">{{ planet.pl_insol.toFixed(2) }} S⊕</span>
            </div>
            <div class="pip-row" v-if="planet?.discoverymethod">
              <span class="pip-k">Detected</span>
              <span class="pip-v">{{ planet.discoverymethod }}</span>
            </div>
          </div>

          <!-- ── Climate estimates ────────────────────────────────── -->
          <div class="pip-section pip-section--climate" v-if="climateProfile">
            <div class="pip-section-label">CLIMATE ESTIMATES</div>

            <!-- Day length -->
            <div class="pip-row">
              <span class="pip-k">Day length</span>
              <span class="pip-v pip-v--mono">{{ climateProfile.day.label }}</span>
            </div>

            <!-- Binary note -->
            <div v-if="climateProfile.isBinary" class="pip-climate-note pip-climate-note--binary">
              ★★ {{ climateProfile.binaryNote }}
            </div>

            <!-- Diurnal range -->
            <template v-if="climateProfile.day.mode === 'locked'">
              <div class="pip-row">
                <span class="pip-k">Dayside</span>
                <span class="pip-v pip-v--warm">{{ fmtK(climateProfile.diurnal.dayK) }}</span>
              </div>
              <div class="pip-row">
                <span class="pip-k">Nightside</span>
                <span class="pip-v pip-v--cool">{{ fmtK(climateProfile.diurnal.nightK) }}</span>
              </div>
              <div class="pip-climate-note">Permanent day/night · terminator zone most habitable</div>
            </template>
            <template v-else>
              <div class="pip-row">
                <span class="pip-k">Day/Night Δ</span>
                <span class="pip-v pip-v--mono">
                  {{ fmtRng(climateProfile.diurnal.nightK, climateProfile.diurnal.dayK) }}
                </span>
              </div>
            </template>

            <!-- Seasonal -->
            <div class="pip-row">
              <span class="pip-k">Seasons</span>
              <span class="pip-v pip-v--mono">
                {{ climateProfile.seasonal.deltaK === 0
                    ? 'Circular orbit — stable'
                    : fmtRng(climateProfile.seasonal.aphelionK, climateProfile.seasonal.perihelionK) }}
              </span>
            </div>

            <!-- Confidence caveat -->
            <div class="pip-climate-note">
              {{ climateProfile.day.note }}
            </div>
          </div>

          <!-- THIS PLANET section re-opened for settlement button -->
          <div class="pip-section">
            <button v-if="planet && !hasThisSettlement" class="pip-claim-primary"
              @click="openSettlement">
              ⬡ Create a Settlement
            </button>
            <button v-else-if="planet && hasThisSettlement" class="pip-claim-primary pip-claim-primary--manage"
              @click="openSettlement">
              ⬡ Use Your Settlement
            </button>
          </div>

          <!-- Sibling planets — chip grid -->
          <div class="pip-section pip-section--chips" v-if="siblingPlanets.length">
            <div class="pip-section-label">SYSTEM PLANETS · {{ siblingPlanets.length }}</div>
            <div class="pip-chips-grid">
              <div
                v-for="sib in siblingPlanets"
                :key="sib.pl_name"
                class="pip-chip"
                :class="{ 'pip-chip--here': sib.pl_name === planetName }"
              >
                <div class="ppc-head"
                  @click="sib.pl_name !== planetName && navigateToPlanet(sib)">
                  <span class="ppc-dot"
                    :style="{ background: siblingColor(sib.pl_eqt, sib.pl_orbsmax) }" />
                  <span class="ppc-name">{{ planetShortName(sib) }}</span>
                  <span v-if="sib.pl_name === planetName" class="ppc-here">◈</span>
                </div>
                <div class="ppc-au">
                  {{ sib.pl_orbsmax != null ? sib.pl_orbsmax.toFixed(2) + ' AU' : '—' }}
                </div>
                <button class="ppc-claim"
                  :class="{ 'ppc-claim--has': hasSettlement(surfaceKey(sib.pl_name)) }"
                  @click.stop="router.push(mintClaimUrl(sib, 'exo-surface-v1'))">
                  {{ hasSettlement(surfaceKey(sib.pl_name)) ? '⬡ manage' : '⬡ settle' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Moon pulldown -->
          <div class="pip-section pip-moon-section" v-if="moonPanelCount > 0">
            <div class="pip-moon-header" @click="moonDropdownOpen = !moonDropdownOpen">
              <span class="pip-section-label" style="margin:0">
                EXOMOONS · {{ moonPanelCount }}
              </span>
              <span class="pip-source" style="margin-left:auto;margin-right:4px">
                {{ system?.sy_mnum ? 'archive' : 'estimated' }}
              </span>
              <span class="pip-toggle">{{ moonDropdownOpen ? '▲' : '▼' }}</span>
            </div>
            <Transition name="pip-expand">
              <div v-if="moonDropdownOpen" class="pip-moon-list">
                <div v-for="mi in moonPanelCount" :key="mi" class="pip-moon-entry">
                  <div class="pme-label">
                    Moon {{ MOON_NUMERALS[mi - 1] || mi }}
                    <span class="pme-of">of {{ planetName }}</span>
                  </div>
                  <div class="pme-claims" v-if="planet">
                    <button class="pme-claim pme-claim--l4"
                      @click="router.push(mintClaimUrl(planet, 'exo-moon-surface-v1', mi))"
                      title="L4 SUBLUNARY — moon surface">
                      L4 SURFACE
                    </button>
                    <button class="pme-claim pme-claim--l5"
                      @click="router.push(mintClaimUrl(planet, 'exo-moon-lagrange-v1', mi))"
                      title="L5 SYZYGY — Lagrange point">
                      L5 SYZYGY
                    </button>
                    <button class="pme-claim pme-claim--l6"
                      @click="router.push(mintClaimUrl(planet, 'exo-moon-interface-v1', mi))"
                      title="L6 LIMINAL — moon–planet interface">
                      L6 LIMINAL
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

        </div>
      </Transition>

      <!-- ── Settlement hashmark — secondary pulldown ───────────── -->
      <SettlementHashmark
        :planet="planet"
        :system="system"
        :lat="isMoonView ? undefined : 0"
        :lon="isMoonView ? undefined : 0"
      />
    </div>

    <!-- ── Settlement address badge ────────────────────────────── -->
    <div class="space-overlay settlement-badge q-px-sm q-py-xs">
      <div class="row items-center no-wrap q-gutter-x-xs">
        <q-icon name="mdi-home-circle" color="cyan-6" size="14px" />
        <span class="text-caption text-cyan-5" style="letter-spacing:0.08em">SETTLEMENT</span>
      </div>
      <div class="text-caption text-blue-grey-3" style="font-size:10px">
        exo-surface-v1:{{ hostname }}:{{ planetName }}
      </div>
    </div>

    <!-- ── Community presence indicator ──────────────────────── -->
    <div class="space-overlay presence-indicator q-px-sm q-py-xs" @click="portalStore.showHelp = true">
      <div class="row items-center no-wrap q-gutter-x-xs">
        <div v-for="def in orbDefs" :key="def.name"
          class="presence-dot"
          :style="{ background: def.colorHex }"
          :title="def.name"
        />
        <span class="text-caption presence-label">{{ orbDefs.length }} Mules · tap to learn more</span>
      </div>
    </div>

    <!-- ── Hover tooltip ───────────────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="hoveredObject"
        class="space-overlay celestial-tooltip q-pa-sm"
        :style="tooltipStyle"
      >
        <div class="row items-center q-mb-xs">
          <div class="legend-dot q-mr-sm" :style="{ background: hoveredObject.color, width:'8px', height:'8px' }" />
          <span class="text-subtitle2 text-blue-grey-1">{{ hoveredObject.name }}</span>
        </div>
        <div class="text-caption text-cyan-3 q-mb-xs">{{ hoveredObject.type }}</div>
        <template v-if="hoveredObject.details">
          <div v-for="(val, key) in hoveredObject.details" :key="key" class="text-caption text-blue-grey-3">
            <span class="text-blue-grey-5">{{ key }}: </span>{{ val }}
          </div>
        </template>
        <div v-if="hoveredObject.isPyramid" class="text-caption text-cyan-4 q-mt-xs" style="letter-spacing:0.05em">
          ▲ Click to open wormhole transit
        </div>
        <div v-else-if="hoveredObject.type.includes('Sustainable Land Assistant')" class="text-caption text-amber-4 q-mt-xs" style="letter-spacing:0.05em">
          ● Click to greet · double-click to approach
        </div>
      </div>
    </Transition>

    <!-- ── Mule / soul orb interaction panel ────────────────────── -->
    <Transition name="fade">
      <div v-if="selectedOrb" class="space-overlay mule-panel q-pa-sm">
        <div class="mule-panel-header row items-center no-wrap q-mb-xs">
          <div class="mule-orb-dot q-mr-sm" :style="{ background: selectedOrb.color }" />
          <span class="mule-name">{{ selectedOrb.name }}</span>
          <q-space />
          <q-btn flat dense round icon="close" size="xs" color="blue-grey-5"
            @click="selectedOrb = null" />
        </div>
        <div class="mule-type q-mb-xs">{{ selectedOrb.type }}</div>
        <template v-if="selectedOrb.details">
          <div v-for="(val, key) in selectedOrb.details" :key="key" class="mule-detail-row">
            <span class="mule-detail-key">{{ key }}</span>
            <span class="mule-detail-val">{{ val }}</span>
          </div>
        </template>
        <div class="mule-actions row q-mt-sm q-gutter-x-xs">
          <q-btn flat dense size="sm" color="amber-4" icon="directions_walk"
            label="Approach"
            @click="spatial.flyTo(`settlement:orb:${toOrbSlug(selectedOrb.name)}`); selectedOrb = null" />
          <q-btn flat dense size="sm" color="blue-grey-4" icon="person"
            label="Profile"
            @click="selectedOrb = null" />
        </div>
      </div>
    </Transition>

    <!-- Sky legend removed — info now lives in the planet info panel above -->

    <!-- ── Bottom controls ─────────────────────────────────────── -->
    <div v-show="!entryAnimating" class="space-overlay surface-controls q-pa-sm q-px-md">
      <div class="row items-center q-gutter-x-sm no-wrap">
        <q-btn flat dense round :icon="animating ? 'pause' : 'play_arrow'"
          color="blue-grey-3" size="sm" @click="toggleAnimation">
          <q-tooltip>{{ animating ? 'Pause' : 'Animate sky' }}</q-tooltip>
        </q-btn>
        <!-- Real-time toggle indicator -->
        <q-btn flat dense round :icon="isRealTime ? 'wifi_tethering' : 'edit'"
          :color="isRealTime ? 'cyan-4' : 'blue-grey-5'" size="sm"
          @click="toggleRealTime">
          <q-tooltip>{{ isRealTime ? 'LIVE — synced to Earth UTC. Click for manual' : 'Manual mode. Click to sync to Earth time' }}</q-tooltip>
        </q-btn>
        <q-slider v-model="localTimeDeg" :min="0" :max="359" :step="1"
          :color="isRealTime ? 'cyan-6' : 'amber-6'" style="width:160px"
          @update:model-value="onSliderDrag" />
        <span class="text-caption q-mr-xs"
          :style="{ minWidth: '52px', color: isRealTime ? '#00ccee' : '#aabbcc' }">
          {{ timeLabel }}
        </span>
        <q-icon name="speed" size="14px" color="blue-grey-6" />
        <q-slider v-model="animSpeed" :min="0" :max="1" :step="0.01"
          color="amber-7" style="width:72px"
          :disable="isRealTime">
          <q-tooltip anchor="top middle" self="bottom middle">Orbit speed (disabled in live mode)</q-tooltip>
        </q-slider>
        <q-separator vertical color="blue-grey-8" />
        <q-btn-toggle v-model="lookMode" dense flat toggle-color="cyan-4"
          :options="[
            { value: 'orbit',  icon: 'panorama_horizontal' },
            { value: 'zenith', icon: 'filter_center_focus' },
            { value: 'walk',   icon: 'directions_walk' },
          ]"
          @update:model-value="setLookMode">
          <q-tooltip anchor="top middle" self="bottom middle">Look mode · Walk = WASD/arrow keys to move</q-tooltip>
        </q-btn-toggle>
        <q-separator vertical color="blue-grey-8" />
        <q-btn flat dense round icon="schedule" :color="showChronometer ? 'cyan-4' : 'blue-grey-5'"
          size="sm" @click="showChronometer = !showChronometer">
          <q-tooltip>Chronometer / event planner</q-tooltip>
        </q-btn>
        <q-btn flat dense round icon="mdi-pyramid" color="cyan-5" size="sm"
          @click="showTransitDialog = true">
          <q-tooltip>Pyramid transit</q-tooltip>
        </q-btn>
        <q-btn flat dense round icon="mdi-home-circle-outline" color="cyan-6" size="sm"
          @click="enterDome">
          <q-tooltip>Enter dome interior</q-tooltip>
        </q-btn>
        <q-btn flat dense round icon="arrow_back" color="blue-grey-4" size="sm"
          @click="goBackToGalaxy()">
          <q-tooltip>Back to star system</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- ── Chronometer panel ─────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showChronometer" class="space-overlay chrono-panel q-pa-sm">
        <div class="chrono-header row items-center no-wrap q-mb-xs">
          <q-icon name="schedule" size="11px" color="cyan-4" class="q-mr-xs" />
          <span class="chrono-title-text">CHRONOMETER</span>
          <q-space />
          <q-btn flat dense round icon="close" size="xs" color="blue-grey-5"
            @click="showChronometer = false" />
        </div>

        <div class="chrono-row">
          <span class="chrono-label">UTC</span>
          <span class="chrono-value">{{ utcTimeStr }}</span>
        </div>
        <div class="chrono-row">
          <span class="chrono-label">EAT (Nairobi)</span>
          <span class="chrono-value eat">{{ eatTimeStr }}</span>
        </div>
        <div class="chrono-row q-mb-sm">
          <span class="chrono-label">Planet phase</span>
          <span class="chrono-value phase">{{ planetPhase }}</span>
        </div>

        <div class="row items-center q-mb-sm no-wrap">
          <q-btn :icon="isRealTime ? 'wifi_tethering' : 'edit'"
            :color="isRealTime ? 'cyan-4' : 'blue-grey-5'"
            flat dense size="xs" class="q-mr-xs" @click="toggleRealTime" />
          <span :style="{ fontSize: '9px', color: isRealTime ? '#00ccee' : '#88aacc', fontFamily: 'monospace' }">
            {{ isRealTime ? 'LIVE · Earth UTC sync' : 'MANUAL · drag slider to plan' }}
          </span>
        </div>

        <q-separator color="blue-grey-9" class="q-mb-xs" />

        <div class="chrono-section-label q-mb-xs">UPCOMING EVENTS</div>

        <div v-for="ev in upcomingEvents" :key="ev.name" class="event-row q-mb-xs">
          <div class="row items-center no-wrap q-mb-xxs">
            <div class="event-dot q-mr-xs" :style="{ background: ev.color }" />
            <span class="event-name">{{ ev.name }}</span>
          </div>
          <div class="event-detail">
            {{ ev.eatStr }} EAT
            <span class="event-sep">·</span>
            Sky {{ ev.skyDeg }}°
            <span class="event-sep">·</span>
            {{ ev.phase }}
          </div>
        </div>

        <q-separator color="blue-grey-9" class="q-my-xs" />
        <div class="chrono-hint">
          Drag the sky slider to preview any time.
          Sky {{ Math.round(localTimeDeg) }}° = {{ timeLabel }} local
        </div>
      </div>
    </Transition>

    <!-- ── Navigator inset — orbital / galaxy / cosmic tabs ─────── -->
    <NavigatorInset
      v-if="sceneReady"
      mode="orbital"
      :hostname="hostname"
      :currentPlanet="planetName"
      @nav-galaxy="goBackToGalaxy"
      @nav-cosmic="router.push('/')"
    />

    <!-- ── Loading ──────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="!sceneReady" class="loading-overlay column items-center justify-center">
        <q-spinner-orbit color="cyan" size="52px" />
        <div class="text-caption text-blue-grey-4 q-mt-sm">Rendering surface of {{ planetName }}…</div>
      </div>
    </Transition>

    <!-- ── Planet claim overlay ─────────────────────────────────────── -->
    <PlanetClaimOverlay
      v-model="claimOverlayOpen"
      :planet="planet"
      :system="system"
    />

    <DefenderNav
      ref="defenderNav"
      mode="surface"
      :sceneLabel="planetName"
      @flyTo="onDefenderFlyTo"
      @portalTo="onDefenderPortalTo"
      @viewModeChange="onViewModeChange"
      @contextZoom="onContextZoom"
      @ascendRealm="goBackToGalaxy"
    />

    <!-- ── DK.MAT wormhole key panel ──────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="viewMode === 'dark_matter'" class="wormhole-key">
        <div class="wk-header">
          <q-icon name="mdi-vector-triangle" color="purple-4" size="14px" class="q-mr-xs" />
          WORMHOLE NETWORK  ·  DARK MATTER VIEW
        </div>
        <div class="wk-row">
          <span class="wk-glyph wk-pyramid">▲</span>
          <div>
            <div class="wk-label">E8 Transit Pyramid</div>
            <div class="wk-desc">Wormhole entry point · E8 Coxeter lattice resonance</div>
          </div>
        </div>
        <div class="wk-row">
          <span class="wk-glyph wk-conduit">◆</span>
          <div>
            <div class="wk-label">Void-edge Conduit</div>
            <div class="wk-desc">Long-range routing node at great void periphery</div>
          </div>
        </div>
        <div class="wk-row">
          <span class="wk-glyph wk-dome">⬡</span>
          <div>
            <div class="wk-label">Settlement Dome</div>
            <div class="wk-desc">Arrival point · whitelisted transit destination</div>
          </div>
        </div>
        <div class="wk-note">
          Dark matter filaments concentrate at void walls —<br>
          conduit nodes align with these density peaks.
        </div>
      </div>
    </Transition>

    <!-- ── Pyramid Transit Dialog ───────────────────────────────── -->
    <q-dialog v-model="showTransitDialog" position="bottom">
      <q-card class="transit-card" style="width:100%;max-width:520px;margin:0 auto">
        <q-card-section class="q-pb-xs">
          <div class="row items-center q-mb-xs">
            <q-icon name="mdi-pyramid" color="amber-4" size="22px" class="q-mr-sm" />
            <div>
              <div class="text-subtitle1 text-blue-grey-1" style="letter-spacing:0.06em">
                WORMHOLE TRANSIT
              </div>
              <div class="text-caption text-blue-grey-5">
                E8 lattice conduit · {{ routingLabel }}
              </div>
            </div>
          </div>
          <q-separator color="blue-grey-8" />
        </q-card-section>

        <q-card-section class="q-pt-xs q-pb-sm" style="max-height:55vh;overflow-y:auto">
          <div class="text-caption text-blue-grey-5 q-mb-sm" style="letter-spacing:0.08em">
            AVAILABLE DESTINATIONS
          </div>

          <q-item
            v-for="dest in transitDestinations"
            :key="dest.route"
            clickable v-ripple
            class="dest-item q-mb-xs rounded-borders"
            @click="initiateTransit(dest)"
          >
            <q-item-section avatar>
              <div class="dest-icon-wrap">
                <q-icon name="scatter_plot" :style="{ color: dest.starColor }" size="20px" />
              </div>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-blue-grey-2">{{ dest.label }}</q-item-label>
              <q-item-label caption class="text-blue-grey-5">
                {{ dest.planetLabel }}  ·  {{ dest.distLabel }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="routing-badge" :class="dest.routingClass">
                {{ dest.routing }}
              </div>
            </q-item-section>
          </q-item>

          <div v-if="!transitDestinations.length" class="text-caption text-blue-grey-6 q-pa-sm text-center">
            No destinations indexed. Eco-ops check-ins unlock transit network.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="blue-grey-4" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Help overlay ──────────────────────────────────────── -->
    <Transition name="help-slide">
      <div v-if="portalStore.showHelp" class="help-panel q-pa-md">

        <div class="row items-center justify-between q-mb-sm">
          <div class="row items-center no-wrap q-gutter-x-xs">
            <q-icon name="help_outline" color="cyan-5" size="15px" />
            <span class="help-section-title" style="font-size:11px;letter-spacing:0.1em">SETTLEMENT GUIDE</span>
          </div>
          <q-btn flat dense round icon="close" color="blue-grey-5" size="xs" @click="portalStore.showHelp = false" />
        </div>

        <!-- Your location -->
        <div class="help-section-title q-mb-xs">YOUR LOCATION</div>
        <div class="help-body q-mb-xs">
          You are viewing the surface of <span class="help-accent">{{ planetName }}</span>,
          a real exoplanet from the NASA archive
          {{ system ? `· ${system.sy_dist?.toFixed(0) ?? '?'} pc from Earth` : '' }}.
        </div>
        <div class="help-code q-mb-sm">exo-surface-v1:{{ hostname }}:{{ planetName }}</div>
        <q-separator color="blue-grey-9" class="q-mb-sm" />

        <!-- The sky -->
        <div class="help-section-title q-mb-xs">IN THE SKY</div>
        <div class="help-row q-mb-xs">
          <span class="help-dot" style="background:#ffd480" />
          <div>
            <span class="help-accent">Host star arc</span>
            <span class="help-body"> — {{ hostname }} traces a path across the sky each day. The dashed arc shows its transit route.</span>
          </div>
        </div>
        <div class="help-row q-mb-xs">
          <span class="help-dot" style="background:#c8b898" />
          <div>
            <span class="help-accent">Exomoons</span>
            <span class="help-body"> — {{ moonCount }} moon(s) orbiting this planet. They move across the horizon — watch them rise and set.</span>
          </div>
        </div>
        <div class="help-row q-mb-xs">
          <span class="help-dot" style="background:#4ecdc4" />
          <div>
            <span class="help-accent">System planets</span>
            <span class="help-body"> — Other planets in the {{ hostname }} star system visible in the sky.</span>
          </div>
        </div>
        <div class="help-row q-mb-sm">
          <span class="help-dot" style="background:#9bb0ff" />
          <div>
            <span class="help-accent">Catalog stars</span>
            <span class="help-body"> — Background stars positioned from real RA/Dec coordinates.</span>
          </div>
        </div>
        <q-separator color="blue-grey-9" class="q-mb-sm" />

        <!-- Community orbs -->
        <div class="help-section-title q-mb-xs">SUSTAINABLE LAND ASSISTANTS</div>
        <div class="help-body q-mb-sm">
          The glowing orbs inside the dome are vantage points of
          <span class="help-accent">Sustainable Land Assistants</span> — community
          <span class="help-accent">Mules</span> who tend this settlement. Each orb drifts
          through its designated zone (water feature, library, garden, gateway). Hover any
          orb to see the community it represents. Designated users appear with a link to
          their pon.ink profile.
        </div>
        <div v-for="def in orbDefs" :key="def.name" class="help-row q-mb-xs">
          <span class="help-dot" :style="{ background: def.colorHex }" />
          <div>
            <span class="help-accent">{{ def.name }}</span>
            <span class="help-body"> · {{ def.group }} · {{ def.desc }}</span>
          </div>
        </div>
        <div class="help-note q-mt-xs q-mb-sm">
          Placeholder Mules shown. When a designated user holds a Mule-tier pon.ink profile,
          their orb links directly to their eco-ops record and settlement portfolio.
        </div>
        <q-separator color="blue-grey-9" class="q-mb-sm" />

        <!-- Settlement structures -->
        <div class="help-section-title q-mb-xs">DOME &amp; SETTLEMENT</div>
        <div class="help-body q-mb-xs">The geodesic dome encloses the community settlement. Inside:</div>
        <div class="help-row q-mb-xs">
          <q-icon name="mdi-library" color="blue-grey-5" size="12px" class="q-mr-xs" />
          <span class="help-body"><span class="help-accent">Library</span> — central community knowledge hub</span>
        </div>
        <div class="help-row q-mb-xs">
          <q-icon name="water_drop" color="blue-grey-5" size="12px" class="q-mr-xs" />
          <span class="help-body"><span class="help-accent">Water</span> — eco-ops water quality resource marker</span>
        </div>
        <div class="help-row q-mb-xs">
          <q-icon name="park" color="blue-grey-5" size="12px" class="q-mr-xs" />
          <span class="help-body"><span class="help-accent">Vegetation</span> — alien plants adapted to {{ planet?.pl_eqt != null ? planet.pl_eqt + ' K' : 'local' }} temperature</span>
        </div>
        <div class="help-row q-mb-xs">
          <q-icon name="mdi-circle-multiple-outline" color="blue-grey-5" size="12px" class="q-mr-xs" />
          <span class="help-body">
            <span class="help-accent">Stone Circle</span> — cultural landmark; marks the settlement's
            cardinal directions, a time capsule, and intention statement.
          </span>
        </div>
        <div class="help-row q-mb-sm">
          <q-icon name="mdi-pyramid" color="purple-4" size="12px" class="q-mr-xs" />
          <span class="help-body">
            <span class="help-accent">E8 Pyramid</span> — hidden by default.
            Enable <span class="help-accent">DK.MAT</span> in the DefenderNav to reveal the
            wormhole conduit access point and transit to another settlement.
          </span>
        </div>
        <q-separator color="blue-grey-9" class="q-mb-sm" />

        <!-- Controls -->
        <div class="help-section-title q-mb-xs">CONTROLS</div>
        <div class="help-ctrl-row q-mb-xs">
          <q-icon name="play_arrow" color="blue-grey-4" size="13px" />
          <span class="help-body">Animate sky — watch the planet rotate in real time</span>
        </div>
        <div class="help-ctrl-row q-mb-xs">
          <q-icon name="wifi_tethering" color="cyan-4" size="13px" />
          <span class="help-body"><span class="help-accent">LIVE</span> — sky locked to Earth UTC clock. Toggle to switch to manual.</span>
        </div>
        <div class="help-ctrl-row q-mb-xs">
          <q-icon name="edit" color="amber-6" size="13px" />
          <span class="help-body"><span class="help-accent">Manual</span> — drag the sky slider to plan any time of day</span>
        </div>
        <div class="help-ctrl-row q-mb-xs">
          <q-icon name="panorama_horizontal" color="blue-grey-4" size="13px" />
          <span class="help-body">Horizon view — look outward from settlement ground level</span>
        </div>
        <div class="help-ctrl-row q-mb-xs">
          <q-icon name="filter_center_focus" color="blue-grey-4" size="13px" />
          <span class="help-body">Zenith view — look straight up through the dome</span>
        </div>
        <div class="help-ctrl-row q-mb-xs">
          <q-icon name="schedule" color="blue-grey-4" size="13px" />
          <span class="help-body">Chronometer — UTC + Nairobi (EAT) time + upcoming event schedule</span>
        </div>
        <div class="help-ctrl-row q-mb-xs">
          <q-icon name="mdi-pyramid" color="cyan-5" size="13px" />
          <span class="help-body">Pyramid transit — open wormhole travel dialog</span>
        </div>
        <div class="help-ctrl-row q-mb-sm">
          <q-icon name="arrow_back" color="blue-grey-4" size="13px" />
          <span class="help-body">Return to the {{ hostname }} star system in the Milky Way map</span>
        </div>
        <q-separator color="blue-grey-9" class="q-mb-sm" />

        <!-- Navigator -->
        <div class="help-section-title q-mb-xs">ORBITAL MAP</div>
        <div class="help-body q-mb-sm">
          The diagram in the bottom-right shows {{ planetName }}'s orbit around {{ hostname }}.
          Tap any other planet in the diagram to visit its settlement.
        </div>

      </div>
    </Transition>

  </q-page>
</template>

<script setup lang="ts">
/**
 * SurfaceViewPage.vue
 *
 * Renders the exoplanet/moon surface from first person, with:
 *   • Sky scene  — host star arc, background stars, system planets, parent planet (moon view)
 *   • Settlement  — dome, library, water, vegetation, soul orbs
 *   • Pyramid    — E8 wormhole transit landmark, click to open transit dialog
 *   • Portal     — integrates with WormholePortal via portalStore
 *
 * Route: /surface/:hostname/:planetName?parent=<parentPlanetName>
 */

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useVizRenderer } from 'src/composables/useVizRenderer'
import { useSpatialLocation } from 'src/composables/useSpatialLocation'
import { useRoute, useRouter }                           from 'vue-router'
import NavigatorInset                                    from 'src/components/NavigatorInset.vue'
import PlanetClaimOverlay                               from 'src/components/PlanetClaimOverlay.vue'
import SettlementHashmark                               from 'src/components/SettlementHashmark.vue'
import DefenderNav                                       from 'src/components/DefenderNav.vue'
import type { DefenderNavData, SkyObjectEntry, SkyObjectType, DefenderTarget } from 'src/lib/defender-nav.types'
import gsap                                              from 'gsap'
import * as THREE                                        from 'three'
import { OrbitControls }                                from 'three/examples/jsm/controls/OrbitControls.js'
import { useGalaxyStore }                               from 'src/stores/galaxy'
import { usePortalStore }                               from 'src/stores/portal'
import {
  starColorFromTeff,
  planetColor,
  raDecToVec3,
  skyPosition,
  buildTerrainGeometry,
  surfacePaletteFor,
  disposeScene,
} from 'src/lib/three-utils'
import { enforceSessionHorizon, detectBandwidthTier } from 'src/lib/security'
import { logNavEvent }                                from 'src/lib/nav-history'
import { useSettlements, surfaceKey, moonKey }        from 'src/lib/settlements'
import type { Planet } from 'src/stores/galaxy'
import {
  buildClimateProfile, formatTempK, formatRangeK, usesFahrenheit,
} from 'src/lib/planet-climate'
import { hasNoSolidGround } from 'src/lib/surface-classify'

// ── Route / props ─────────────────────────────────────────────────────────────

const route  = useRoute()
const router = useRouter()

// Spatial URL API — ?at=<scope> / ?cam=x,y,z,tx,ty,tz,fov navigation.
// Getters close over `camera`/`controls`/`terrainBaseY`, all assigned in initScene()
// (terrainBaseY varies per planet — see adjustForTerrain() in spatial-scopes.ts).
const spatial = useSpatialLocation(() => camera, () => controls, () => terrainBaseY)

const hostname   = computed(() => String(route.params.hostname   ?? ''))
const planetName = computed(() => String(route.params.planetName ?? ''))
const parentName = computed(() => String(route.query.parent      ?? ''))
const isMoonView = computed(() => !!parentName.value)

// ── Stores ────────────────────────────────────────────────────────────────────

const galaxyStore = useGalaxyStore()
const portalStore = usePortalStore()
const { hasSettlement, addSettlement: recordSettlement } = useSettlements()

const system      = computed(() => galaxyStore.getSystem(hostname.value) ?? null)
const planet      = computed(() => galaxyStore.getPlanet(planetName.value) ?? null)
const parentPlanet = computed(() => parentName.value ? galaxyStore.getPlanet(parentName.value) : null)

// ── Derived text ──────────────────────────────────────────────────────────────

const propertyTitle = computed(() =>
  isMoonView.value
    ? `${planetName.value} (moon of ${parentName.value})`
    : (planetName.value || hostname.value)
)

const exolocationSummary = computed(() =>
  system.value
    ? `${hostname.value} · RA ${system.value.ra.toFixed(2)}° · Dec ${system.value.dec.toFixed(2)}°`
      + (system.value.sy_dist != null ? ` · ${system.value.sy_dist.toFixed(1)} pc` : '')
    : ''
)

const headerStats = computed(() => {
  const p = planet.value
  if (!p) return []
  return [
    { label: 'Eq. temp',  value: p.pl_eqt  != null ? `${p.pl_eqt} K`   : '—' },
    { label: 'Radius',    value: p.pl_rade != null ? `${p.pl_rade} R⊕` : '—' },
    { label: 'Orbit',     value: p.pl_orbsmax != null ? `${p.pl_orbsmax} AU` : '—' },
    { label: 'Host star', value: p.st_teff != null ? `${p.st_teff} K` : '—' },
  ]
})

// ── Planet info panel ─────────────────────────────────────────────────────────

const infoPanelOpen    = ref(false)
const claimOverlayOpen = ref(false)
const moonDropdownOpen = ref(false)

const settlementKey     = computed(() => isMoonView.value
  ? moonKey(parentName.value || planetName.value, 1, 'exo-moon-surface-v1')
  : surfaceKey(planetName.value))
const hasThisSettlement = computed(() => hasSettlement(settlementKey.value))

function openSettlement() {
  if (!hasThisSettlement.value && planet.value) {
    recordSettlement({
      key:         settlementKey.value,
      type:        isMoonView.value ? 'moon' : 'surface',
      planetName:  planetName.value,
      hostname:    hostname.value,
      exolocation: `exo-surface-v1:${hostname.value}:${planetName.value}`,
      displayName: `${planetName.value} · ${hostname.value}`,
    })
  }
  claimOverlayOpen.value = true
}

const MOON_NUMERALS = ['I','II','III','IV','V','VI','VII','VIII','IX','X']

function planetShortName(pl: Planet): string {
  const stripped = pl.pl_name.replace(hostname.value, '').trim()
  return stripped || pl.pl_name
}

function mintClaimUrl(pl: Planet, coord: string, moonIdx?: number): string {
  const p = new URLSearchParams({ host: hostname.value, planet: pl.pl_name, coord })
  if (moonIdx !== undefined) p.set('moon', String(moonIdx))
  return `/mint?${p.toString()}`
}

function navigateToPlanet(pl: Planet) {
  void router.push(`/surface/${encodeURIComponent(hostname.value)}/${encodeURIComponent(pl.pl_name)}`)
}

/** Temperature zone classification */
const planetZone = computed((): { label: string; cls: string } => {
  const eqt = planet.value?.pl_eqt
  if (eqt == null) return { label: '? K', cls: 'unknown' }
  if (eqt < 100)   return { label: 'FROZEN',     cls: 'frozen'    }
  if (eqt < 200)   return { label: 'ICY',         cls: 'icy'       }
  if (eqt < 280)   return { label: 'TEMPERATE',   cls: 'temperate' }
  if (eqt < 450)   return { label: 'WARM',        cls: 'warm'      }
  if (eqt < 1000)  return { label: 'HOT',         cls: 'hot'       }
  return                   { label: 'ULTRA-HOT',  cls: 'ultrahot'  }
})

/** All planets in the system sorted by orbital distance, includes current */
const siblingPlanets = computed(() => {
  if (!system.value) return []
  return [...system.value.planets].sort(
    (a, b) => (a.pl_orbsmax ?? 999) - (b.pl_orbsmax ?? 999)
  )
})

/** Color for a sibling planet dot based on its temperature */
function siblingColor(eqt: number | null | undefined, au: number | null | undefined): string {
  if (eqt != null) {
    if (eqt > 1200) return '#ff4500'
    if (eqt > 500)  return '#ff8c42'
    if (eqt > 250)  return '#22ff88'
    if (eqt > 100)  return '#82b4d0'
    return '#b0d0e8'
  }
  if (au != null) {
    if (au < 0.2) return '#ff4500'
    if (au < 1.2) return '#22ff88'
    return '#82b4d0'
  }
  return '#555577'
}

/** Moon count for the panel (post-scene-build) */
const moonPanelCount = computed(() => {
  // moonMeshes is module-level; fall back to archive number if scene not ready
  return moonMeshes.length || (system.value?.sy_mnum ?? 0)
})

// ── Climate profile ───────────────────────────────────────────────────────────

const useFahrenheit = usesFahrenheit()

const climateProfile = computed(() => {
  if (!planet.value || !system.value) return null
  return buildClimateProfile(planet.value, system.value)
})

/** Format a Kelvin value in the user's preferred unit. */
function fmtK(k: number | null | undefined): string {
  if (k == null) return '—'
  return formatTempK(k, useFahrenheit)
}

/** Format a K range as min→max in preferred unit. */
function fmtRng(lo: number | null, hi: number | null): string {
  return formatRangeK(lo, hi, useFahrenheit) ?? '—'
}

// ── Transit system ────────────────────────────────────────────────────────────

const showTransitDialog = ref(false)

/** Routing label for the current system's wormhole connections */
const routingLabel = computed(() => {
  const d = system.value?.sy_dist ?? 0
  if (d < 50)  return 'Direct transit available'
  if (d < 300) return 'Local Void conduit routing'
  return 'Boötes Void conduit — long-range'
})

interface TransitDest {
  label:       string
  planetLabel: string
  route:       string
  distLabel:   string
  routing:     string
  routingClass: string
  starColor:   string
}

const transitDestinations = computed<TransitDest[]>(() => {
  if (!galaxyStore.isLoaded || !system.value) return []

  const selfHost = hostname.value
  const selfDist = system.value.sy_dist ?? 0

  // Collect one representative planet per nearby host, sorted by distance
  const hostMap = new Map<string, Planet>()
  for (const p of galaxyStore.planets) {
    if (p.hostname === selfHost) continue
    if (p.sy_dist == null) continue
    if (!hostMap.has(p.hostname)) hostMap.set(p.hostname, p)
  }

  const sorted = [...hostMap.values()]
    .sort((a, b) => (a.sy_dist ?? 9999) - (b.sy_dist ?? 9999))
    .slice(0, 9)

  return sorted.map(p => {
    const dist    = p.sy_dist ?? 0
    const diff    = Math.abs(dist - selfDist)
    let routing: string
    let routingClass: string
    if (diff < 50) {
      routing = 'Direct'
      routingClass = 'routing-direct'
    } else if (diff < 300) {
      routing = 'Local Void'
      routingClass = 'routing-local'
    } else {
      routing = 'Boötes Void'
      routingClass = 'routing-far'
    }

    const starCol = '#' + starColorFromTeff(p.st_teff).getHexString()

    return {
      label:       p.hostname,
      planetLabel: p.pl_name,
      route:       `/surface/${encodeURIComponent(p.hostname)}/${encodeURIComponent(p.pl_name)}`,
      distLabel:   dist.toFixed(1) + ' pc',
      routing,
      routingClass,
      starColor:   starCol,
    }
  })
})

function initiateTransit(dest: TransitDest) {
  showTransitDialog.value = false
  // Pass spectral colors so the portal shifts from source star type to destination
  const srcColor = system.value
    ? '#' + starColorFromTeff(system.value.st_teff).getHexString()
    : undefined
  portalStore.openPortal({
    label:       dest.label,
    route:       dest.route,
    hostname:    dest.label,
    sourceColor: srcColor,
    destColor:   dest.starColor,   // already computed as hex in TransitDest
  })
}

// ── UI state ──────────────────────────────────────────────────────────────────

const defenderNav      = ref<InstanceType<typeof DefenderNav> | null>(null)
const viewMode         = ref<'natural' | 'xray' | 'dark_matter'>('natural')

// ── X-RAY thermal scale data ──────────────────────────────────────────────────

// Thermal colour palette: cold (bottom) → white-hot (top).
// Each stop is a temperature in K with the thermal-vision mapped colour.
const THERMAL_TICKS = [
  { label: '30 K',   color: '#010003' },   // void cold — near black
  { label: '100 K',  color: '#0a0020' },   // deep space cold — violet-black
  { label: '200 K',  color: '#1a0040' },   // icy world — deep purple
  { label: '500 K',  color: '#6b0015' },   // warm rocky — dark crimson
  { label: '1 kK',   color: '#cc1800' },   // hot planet surface — bright red
  { label: '3 kK',   color: '#ff5500' },   // M-dwarf star — orange-red
  { label: '5 kK',   color: '#ff9900' },   // K/G star — orange
  { label: '10 kK',  color: '#ffee00' },   // A-type star — yellow
  { label: '30 kK+', color: '#ffffff' },   // O/B star — white-hot
].reverse()   // displayed top (hot) to bottom (cold)

// Distance log ruler ticks (sky depth: nearby = top, far = bottom)
const DISTANCE_TICKS = [
  { label: '1 AU',    pct:  5 },
  { label: '5 AU',    pct: 18 },
  { label: '50 AU',   pct: 33 },
  { label: '1 kAU',   pct: 50 },
  { label: '1 pc',    pct: 65 },
  { label: '100 pc',  pct: 80 },
  { label: '∞',       pct: 92 },
]

// EQT label for scale footer
const eqtLabel = computed(() => {
  const eqt = planet.value?.pl_eqt
  if (!eqt) return 'unknown'
  if (eqt < 150) return `${eqt} K — icy`
  if (eqt < 280) return `${eqt} K — temperate`
  if (eqt < 500) return `${eqt} K — warm`
  return `${eqt} K — hot`
})

function onViewModeChange(mode: 'natural' | 'xray' | 'dark_matter') {
  viewMode.value = mode
  applyViewModeToScene(mode)
}

function applyViewModeToScene(mode: 'natural' | 'xray' | 'dark_matter') {

  // ── X-RAY: Thermal binary-vision — radical colour inversion ─────────────
  // CSS filter on the canvas does the heavy lifting: sepia + hue shift +
  // extreme saturation + high contrast = thermal infrared palette.
  // Dark space → near-black; bright stars → white-hot; warm terrain → red-orange.
  if (viz.canvas) {
    viz.canvas.style.filter = mode === 'xray'
      ? 'sepia(0.95) hue-rotate(-40deg) saturate(6) contrast(2.4) brightness(1.18)'
      : ''
    viz.canvas.style.transition = 'filter 0.6s ease'
  }

  // ── Renderer exposure: blown-out for X-RAY, standard for others ──────────
  if (renderer) {
    renderer.toneMappingExposure = mode === 'xray' ? 1.75 : 0.9
    renderer.toneMapping = mode === 'xray'
      ? THREE.CineonToneMapping   // filmic high-contrast
      : THREE.ACESFilmicToneMapping
  }

  // ── Scene background / fog: near-black with a dark red cast in X-RAY ─────
  if (scene) {
    const palette = surfacePaletteFor(planet.value?.pl_eqt ?? null)
    if (mode === 'xray') {
      scene.background = new THREE.Color(0x040001)
      scene.fog        = new THREE.FogExp2(0x040001, 0.0006)
    } else {
      scene.background = new THREE.Color(0x020408)
      scene.fog        = new THREE.FogExp2(
        palette.fog ?? new THREE.Color(0x020408), palette.fogDensity
      )
    }
  }

  // ── Ambient light: harsh white in X-RAY, normal otherwise ───────────────
  scene?.traverse(obj => {
    if ((obj as THREE.AmbientLight).isAmbientLight) {
      const light = obj as THREE.AmbientLight
      if (mode === 'xray') {
        light.color.setHex(0xffffff)
        light.intensity = 1.6
      } else {
        const eqt = planet.value?.pl_eqt ?? null
        if (eqt != null && eqt > 1500) { light.color.setHex(0xdd6622); light.intensity = 3.8 }
        else if (eqt != null && eqt > 600) { light.color.setHex(0xcc8833); light.intensity = 3.0 }
        else { light.color.setHex(0x334466); light.intensity = 1.2 }
      }
    }
  })

  // ── Host star: white-hot emissive in X-RAY ───────────────────────────────
  if (hostStarGlow) {
    const mat = hostStarGlow.material as THREE.MeshBasicMaterial
    if (mode === 'xray') {
      mat.color.setHex(0xffffff)
      mat.opacity = 0.65
    } else {
      const teff = system.value?.st_teff ?? 5778
      mat.color.copy(starColorFromTeff(teff))
      mat.opacity = 0.28
    }
  }

  // ── Soul orbs: white-hot signatures in X-RAY ────────────────────────────
  for (const orb of soulOrbs) {
    const mat = orb.material as THREE.MeshBasicMaterial
    if (mode === 'xray') {
      mat.color.setHex(0xffffff)
    } else {
      // restore to original orb colour
      const idx = soulOrbs.indexOf(orb)
      mat.color.setHex(ORB_DEFS[idx % ORB_DEFS.length]?.color ?? 0xffffff)
    }
    // Glow mesh
    const glow = orb.userData.glowMesh as THREE.Mesh | undefined
    if (glow) {
      const gm = glow.material as THREE.MeshBasicMaterial
      if (mode === 'xray') { gm.color.setHex(0xff3300); gm.opacity = 0.55 }
      else {
        const idx = soulOrbs.indexOf(orb)
        gm.color.setHex(ORB_DEFS[idx % ORB_DEFS.length]?.color ?? 0xffffff)
        gm.opacity = 0.22
      }
    }
  }

  // ── Dome wireframe: bright orange/white in X-RAY ─────────────────────────
  settlementGroup?.traverse(obj => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const mat = mesh.material as any
    if (!mat?.wireframe && !mat?.color) return

    if (mat.wireframe) {
      if (mode === 'xray') { mat.color?.setHex(0xff6600); mat.opacity = 0.35 }
      else                 { mat.color?.setHex(0x0099dd); mat.opacity = 0.07 }
    }
  })

  // ── Pyramid group: ONLY visible in DK.MAT mode ───────────────────────────
  const pyramidGroup = settlementGroup?.getObjectByName('pyramid_group') as THREE.Group | undefined
  if (pyramidGroup) pyramidGroup.visible = mode === 'dark_matter'

  if (pyramidLight) {
    pyramidLight.visible = mode === 'dark_matter'
    if (mode === 'dark_matter') { pyramidLight.color.setHex(0xcc55ff); pyramidLight.intensity = 2.0 }
  }

  const pyramid = settlementGroup?.getObjectByName('pyramid') as THREE.Mesh | undefined
  if (pyramid && mode === 'dark_matter') {
    const mat = pyramid.material as THREE.MeshPhongMaterial
    mat.color.setHex(0xcc55ff); mat.emissive.setHex(0x8800cc); mat.emissiveIntensity = 2.2
  }

  // ── Stone circle glow ─────────────────────────────────────────────────────
  if (stoneCircleGlow) {
    const mat = stoneCircleGlow.material as THREE.MeshBasicMaterial
    if (mode === 'xray') {
      mat.color.setHex(0xff2200)   // red-hot "bio-signature" in thermal vision
      mat.opacity = 0.55
    } else if (mode === 'dark_matter') {
      mat.color.setHex(0x4488aa); mat.opacity = 0.03
    } else {
      mat.color.setHex(0x4488aa); mat.opacity = 0.10
    }
  }
}
const sceneReady       = ref(false)
const animating        = ref(true)
const localTimeDeg     = ref(180)
const animSpeed        = ref(0.12)   // 0–1; default slow (~2.4 deg/sec)
const lookMode         = ref<'orbit' | 'zenith' | 'walk'>('orbit')
const isRealTime       = ref(true)   // true = sky synced to Earth UTC clock
const showChronometer  = ref(false)
const earthClock       = ref(new Date())
let   clockInterval:   ReturnType<typeof setInterval> | null = null

interface CelestialHit {
  name:       string
  type:       string
  color:      string
  details?:   Record<string, string>
  isPyramid?: boolean
}

const hoveredObject = ref<CelestialHit | null>(null)
const selectedOrb   = ref<CelestialHit | null>(null)
const tooltipStyle  = ref({ left: '0px', top: '0px' })
const mouseNDC      = new THREE.Vector2()

// Community presence orb definitions (module-level constant — used by both scene builder and template)
const ORB_DEFS = [
  { name: 'Fana Ka',             color: 0xff6688, group: 'Street Poets',       desc: 'Nairobi rap collective' },
  { name: 'OT Kulcha',           color: 0x55ffaa, group: 'Music Collective',    desc: 'East Africa music community' },
  { name: 'Uni-Kibaoni SHG',     color: 0x5588ff, group: 'Peace Youth',         desc: 'Field workers · eco-ops' },
  { name: 'Glipish DJ',          color: 0xffcc44, group: 'Visual Artist',       desc: 'Binary pixel art · Denver' },
  { name: '_am_lunchmeat',       color: 0xff88ee, group: 'Visual Artist',       desc: 'Paintings · Denver' },
]

// Expose orb definitions to the template for the help panel + presence indicator
const orbDefs = ORB_DEFS.map(d => ({
  ...d,
  colorHex: '#' + new THREE.Color(d.color).getHexString(),
}))

// Moon count exposed for help text (populated after scene builds)
const moonCount = ref(0)

// ── Earth clock derived values ────────────────────────────────────────────────

const utcSeconds = computed(() => {
  const d = earthClock.value
  return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds()
})

const utcTimeStr = computed(() => {
  const d = earthClock.value
  const h = d.getUTCHours(), m = d.getUTCMinutes(), s = d.getUTCSeconds()
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
})

const eatTimeStr = computed(() => {
  const d = earthClock.value
  const h = (d.getUTCHours() + 3) % 24
  const m = d.getUTCMinutes(), s = d.getUTCSeconds()
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
})

const planetPhase = computed(() => {
  const d = localTimeDeg.value
  if (d < 22 || d >= 338)  return 'Midnight'
  if (d < 68)  return 'Late night'
  if (d < 90)  return 'Pre-dawn'
  if (d < 112) return 'Dawn'
  if (d < 158) return 'Morning'
  if (d < 202) return 'Noon'
  if (d < 248) return 'Afternoon'
  if (d < 270) return 'Dusk'
  if (d < 315) return 'Evening'
  return 'Night'
})

const timeLabel = computed(() => {
  const deg = isRealTime.value ? (utcSeconds.value / 86400) * 360 : localTimeDeg.value
  const h = Math.floor((deg / 360) * 24)
  const m = Math.floor(((deg / 360) * 24 - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

// ── Virtual event schedule ────────────────────────────────────────────────────

interface VirtualEvent { name: string; eatHour: number; eatMin: number; color: string }
const EVENT_SCHEDULE: VirtualEvent[] = [
  { name: 'Fana Ka Street Poets Rap Battle', eatHour: 19, eatMin: 0,  color: '#ff6688' },
  { name: 'OT Kulcha Community Drop',        eatHour: 20, eatMin: 0,  color: '#55ffaa' },
  { name: 'Uni-Kibaoni Peace Youth SHG',     eatHour: 18, eatMin: 0,  color: '#5588ff' },
]

const upcomingEvents = computed(() => EVENT_SCHEDULE.map(ev => {
  const utcH   = (ev.eatHour - 3 + 24) % 24
  const skyDeg = Math.round(((utcH * 3600 + ev.eatMin * 60) / 86400) * 360)
  const phase  = skyDegToPhase(skyDeg)
  return {
    ...ev,
    eatStr: `${String(ev.eatHour).padStart(2,'0')}:${String(ev.eatMin).padStart(2,'0')}`,
    skyDeg,
    phase,
  }
}))

const legend = computed(() => {
  const items: Array<{ label: string; color: string; size: number }> = []
  if (system.value) {
    const c = '#' + starColorFromTeff(system.value.st_teff).getHexString()
    items.push({ label: `${hostname.value} (host star)`, color: c, size: 12 })
  }
  if (isMoonView.value && parentPlanet.value)
    items.push({ label: parentName.value + ' (parent)', color: '#4a8fc0', size: 10 })
  items.push({ label: 'System planets', color: '#4ecdc4', size: 6 })
  if (moonMeshes.length) items.push({ label: `Exomoons (${moonMeshes.length})`, color: '#c8b898', size: 5 })
  items.push({ label: 'Catalog stars',  color: '#9bb0ff', size: 3 })
  items.push({ label: 'Settlement dome', color: '#00aaff', size: 6 })
  items.push({ label: 'Community orbs',  color: '#ff6688', size: 5 })
  items.push({ label: 'Pyramid / conduit', color: '#ffcc44', size: 6 })
  return items
})

// ── Three.js refs ─────────────────────────────────────────────────────────────

// canvas ref removed — canvas is in MainLayout
const viz = useVizRenderer()
let renderer: THREE.WebGLRenderer     | null = null
let scene:    THREE.Scene             | null = null
let camera:   THREE.PerspectiveCamera | null = null
let controls: OrbitControls           | null = null
let _stopTick: (() => void) | null = null
const pageGroup = new THREE.Group()
let clockRef:      THREE.Clock

// ── Keyboard WASD navigation ──────────────────────────────────────────────────
const keysDown  = new Set<string>()
let keydownFn:  ((e: KeyboardEvent) => void) | null = null
let keyupFn:    ((e: KeyboardEvent) => void) | null = null

let hostStarMesh:  THREE.Mesh | null = null
let hostStarGlow:  THREE.Mesh | null = null
let hostStarLight: THREE.DirectionalLight | null = null

let raycaster:     THREE.Raycaster
let hitTargets:    Array<{ mesh: THREE.Object3D; hit: CelestialHit }> = []

// Settlement objects updated each frame
let soulOrbs:       THREE.Mesh[] = []
let pyramidLight:   THREE.PointLight | null = null
let waterMesh:      THREE.Mesh | null = null
let settlementGroup: THREE.Group | null = null

// Terrain Y base — set in addTerrain so settlement objects align with ground
let terrainBaseY = -20

// ── Entry animation state ─────────────────────────────────────────────────────
const entryAnimating = ref(false)
let entryGroup: THREE.Group | null = null

// ── Exomoon sky objects ───────────────────────────────────────────────────────

interface MoonInfo {
  name:               string
  color:              number     // hex int
  radiusViz:          number     // visual size in scene units
  orbitalPeriodDays:  number     // relative to one planet day
  inclDeg:            number     // orbital inclination (degrees)
  initialPhaseDeg:    number     // phase offset so moons start spread out
}

let moonMeshes: Array<{ mesh: THREE.Mesh; glow: THREE.Mesh; info: MoonInfo }> = []

// ── Scene initialisation ──────────────────────────────────────────────────────

function initScene() {
  renderer = viz.renderer
  scene    = viz.scene
  camera   = viz.camera
  controls = viz.controls
  if (!renderer || !scene || !camera || !controls) return

  const eqt     = planet.value?.pl_eqt ?? null
  const palette = surfacePaletteFor(eqt)

  scene.background = new THREE.Color(0x020408)
  scene.fog        = new THREE.FogExp2(palette.fog ?? new THREE.Color(0x020408), palette.fogDensity)

  camera.fov  = 80
  camera.near = 0.1
  camera.far  = 2000
  camera.aspect = window.innerWidth / (window.innerHeight - 44)
  camera.position.set(0, 4, 85)
  camera.updateProjectionMatrix()

  controls.target.set(0, 2, 0)
  controls.enableRotate       = true
  controls.enablePan          = true
  controls.screenSpacePanning = false
  controls.panSpeed           = 0.6
  controls.enableZoom         = true
  controls.zoomToCursor       = true   // pinch/scroll zooms toward pointer
  controls.zoomSpeed          = 0.9
  controls.minDistance        = 2
  controls.maxDistance        = 500
  controls.minPolarAngle      = 0.10
  controls.maxPolarAngle      = Math.PI * 0.54
  controls.rotateSpeed        = 0.4
  controls.mouseButtons       = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
  controls.touches            = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
  controls.update()

  scene.add(pageGroup)
  clockRef  = new THREE.Clock()
  raycaster = new THREE.Raycaster()
  raycaster.params.Points = { threshold: 2 }

  // Keyboard movement — register once per scene init; cleaned up in onUnmounted
  if (!keydownFn) {
    keydownFn = (e: KeyboardEvent) => {
      keysDown.add(e.code)
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
    }
    keyupFn = (e: KeyboardEvent) => keysDown.delete(e.code)
    window.addEventListener('keydown', keydownFn)
    window.addEventListener('keyup',   keyupFn!)
  }

  addAmbientLight()
  addStarField()
  addHostStar()
  if (isMoonView.value) addParentPlanet()
  addSystemPlanets()
  addMoons()
  addTerrain(palette)
  addSettlement()
  applyLocalTime(localTimeDeg.value)

  sceneReady.value = true
}

// ── Sky builders ──────────────────────────────────────────────────────────────

function addAmbientLight() {
  const eqt = planet.value?.pl_eqt ?? null
  if (eqt != null && eqt > 1500) {
    scene.add(new THREE.AmbientLight(0xdd6622, 3.8))  // ultra-hot: volcanic orange fill
  } else if (eqt != null && eqt > 600) {
    scene.add(new THREE.AmbientLight(0xcc8833, 3.0))  // hot: warm amber — thermal lens
  } else {
    scene.add(new THREE.AmbientLight(0x334466, 1.2))
  }
}

function addStarField() {
  // ── Layer 1: Procedural full-sky background ──────────────────────────────
  // Fills the southern cap, galactic centre, and other survey-sparse regions
  // with a realistic distribution of background stars.  Seeded by hostname so
  // each settlement has a unique but consistent background.
  {
    const bgPos: number[] = [], bgCol: number[] = []
    const seed = hostname.value.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 42)
    const rng  = mulberry32(seed)

    for (let i = 0; i < 5000; i++) {
      // Uniform distribution over full sphere (Archimedes hat-box theorem)
      const u = rng(), v = rng()
      const theta = 2 * Math.PI * u
      const phi   = Math.acos(2 * v - 1)
      bgPos.push(900 * Math.sin(phi) * Math.cos(theta), 900 * Math.sin(phi) * Math.sin(theta), 900 * Math.cos(phi))

      // Realistic spectral type occurrence: M ≫ K > G > F > A/B/O
      const roll = rng()
      let teff: number
      if      (roll < 0.52) teff = 2700  + rng() * 1300   // M
      else if (roll < 0.74) teff = 4000  + rng() * 1500   // K
      else if (roll < 0.88) teff = 5400  + rng() * 1000   // G
      else if (roll < 0.96) teff = 6200  + rng() * 1800   // F
      else                   teff = 7500  + rng() * 22500  // hot — rare

      const c  = starColorFromTeff(teff)
      const br = 0.18 + rng() * 0.40   // dim: background ≪ survey stars
      bgCol.push(c.r * br, c.g * br, c.b * br)
    }

    const bgGeo = new THREE.BufferGeometry()
    bgGeo.setAttribute('position', new THREE.Float32BufferAttribute(bgPos, 3))
    bgGeo.setAttribute('color',    new THREE.Float32BufferAttribute(bgCol, 3))
    scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
      size: 0.9, vertexColors: true, sizeAttenuation: false,
      transparent: true, opacity: 0.70, depthWrite: false,
    })))
  }

  // ── Layer 2: Catalog stars from NASA Exoplanet Archive — with parallax ────
  // Stars are placed in their actual 3D galactic positions (parsec space)
  // relative to the observer's exoplanet, so every settlement sees a genuinely
  // different sky: nearby stars shift dramatically, distant stars are fixed.
  //
  // Kepler field (RA 278–308°, Dec 35–53°): ~3,000 confirmed hosts crammed into
  // a 10°×12° patch produce a visible rectangular "waffle" from Earth's vantage.
  // Subsampled to ~12% (1-in-8) and given ±0.6° jitter; parallax dissolves the
  // pattern naturally when viewed from any non-Solar exoplanet.
  {
    const positions: number[] = [], colors: number[] = [], sizes: number[] = []
    const seenHosts = new Set<string>()

    // Observer's 3D galactic position in parsec space (Earth = origin)
    const obsRA   = system.value?.ra  ?? 0
    const obsDec  = system.value?.dec ?? 0
    const obsDist = system.value?.sy_dist ?? 0
    const obsPc   = raDecToVec3(obsRA, obsDec, obsDist)  // actual parsecs from Earth

    for (const p of galaxyStore.planets) {
      if (p.hostname === hostname.value) continue
      if (seenHosts.has(p.hostname)) continue
      seenHosts.add(p.hostname)

      // Kepler primary field (Earth RA/Dec — subsample before parallax transform)
      const inKeplerField = p.ra > 278 && p.ra < 308 && p.dec > 35 && p.dec < 53
      if (inKeplerField) {
        const h = p.hostname.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)
        if ((h & 7) !== 0) continue   // retain ~12% (1-in-8) of Kepler hosts
      }

      // ── Parallax: compute apparent sky direction from observer's position ──
      const starDist = p.sy_dist ?? 1000
      const starPc   = raDecToVec3(p.ra, p.dec, starDist)
      const relVec   = new THREE.Vector3().subVectors(starPc, obsPc)
      const distToStar = relVec.length()
      if (distToStar < 0.5) continue  // skip the observer's own star
      relVec.normalize()

      // Jitter in angular space to break any coordinate-quantisation grid.
      // Applied to the sky-sphere direction, not the parsec position.
      const jitterSeed = p.hostname.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const jRng = mulberry32(jitterSeed)
      const perpX = new THREE.Vector3(relVec.y, -relVec.x, 0).normalize()
      const perpY = new THREE.Vector3().crossVectors(relVec, perpX)
      const jitterAng = inKeplerField ? 0.012 : 0.006   // radians ≈ 0.7° / 0.34°
      relVec.addScaledVector(perpX, (jRng() - 0.5) * jitterAng)
              .addScaledVector(perpY, (jRng() - 0.5) * jitterAng)
              .normalize()

      const skyPos = relVec.multiplyScalar(900)
      positions.push(skyPos.x, skyPos.y, skyPos.z)

      const col = starColorFromTeff(p.st_teff)
      colors.push(col.r, col.g, col.b)

      // Apparent size from distance to observer (not Earth distance)
      sizes.push(Math.max(0.4, 2.4 - Math.log10(distToStar + 1) * 0.6))
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3))
    geo.setAttribute('size',     new THREE.Float32BufferAttribute(sizes,     1))
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: 1.8, vertexColors: true, sizeAttenuation: false,
      transparent: true, opacity: 0.88, depthWrite: false,
    })))
  }
}

function addHostStar() {
  if (!system.value) return
  const teff  = system.value.st_teff ?? 5778
  const color = starColorFromTeff(teff)
  const hex   = color.getHex()

  hostStarMesh = new THREE.Mesh(
    new THREE.SphereGeometry(6, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })
  )
  hostStarGlow = new THREE.Mesh(
    new THREE.SphereGeometry(14, 24, 24),
    new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.28, fog: false, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  const outerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(24, 24, 24),
    new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.08, fog: false, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  hostStarLight = new THREE.DirectionalLight(hex, 2.4)
  scene.add(hostStarMesh, hostStarGlow, outerGlow, hostStarLight)

  hitTargets.push({
    mesh: hostStarMesh,
    hit: {
      name:  `${hostname.value} (host star)`,
      type:  spectralType(teff),
      color: '#' + color.getHexString(),
      details: {
        'Eff. temp': `${teff} K`,
        'Distance':  system.value.sy_dist ? `${system.value.sy_dist.toFixed(1)} pc` : '—',
        'RA / Dec':  `${system.value.ra.toFixed(2)}° / ${system.value.dec.toFixed(2)}°`,
      },
    },
  })
}

function addParentPlanet() {
  const pp    = parentPlanet.value
  const pCol  = planetColor(pp?.pl_eqt, pp?.pl_orbsmax)
  const mesh  = new THREE.Mesh(
    new THREE.SphereGeometry(110, 48, 48),
    new THREE.MeshPhongMaterial({ color: pCol, emissive: pCol.clone().multiplyScalar(0.04), shininess: 12, fog: false, depthWrite: false })
  )
  mesh.position.set(380, 300, -700)
  mesh.renderOrder = -1
  scene.add(mesh)

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(115, 124, 64),
    new THREE.MeshBasicMaterial({ color: pCol.clone().lerp(new THREE.Color(0x88ccff), 0.5), side: THREE.DoubleSide, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
  )
  ring.position.copy(mesh.position)
  ring.rotation.x = Math.PI * 0.18
  scene.add(ring)

  const parentLight = new THREE.PointLight(pCol.getHex(), 0.4, 600)
  parentLight.position.copy(mesh.position)
  scene.add(parentLight)

  hitTargets.push({ mesh, hit: {
    name:  parentName.value,
    type:  'Parent planet (moon view)',
    color: '#' + pCol.getHexString(),
    details: pp ? {
      'Eq. temp': pp.pl_eqt  != null ? `${pp.pl_eqt} K`   : '—',
      'Radius':   pp.pl_rade != null ? `${pp.pl_rade} R⊕` : '—',
    } : undefined,
  }})
}

function addSystemPlanets() {
  if (!system.value) return
  const siblings = system.value.planets.filter(p => p.pl_name !== planetName.value)

  siblings.forEach((p, i) => {
    const col   = planetColor(p.pl_eqt, p.pl_orbsmax)
    const hex   = col.getHex()
    const angle = ((i / Math.max(siblings.length, 1)) * Math.PI * 1.6) - Math.PI * 0.8

    // Place planets clearly in the sky background — far and elevated
    const dist  = 1200
    const x     = Math.sin(angle) * dist * 0.7
    const y     = 100 + Math.cos(angle * 0.5) * 90   // 10–190 above ground
    const z     = -Math.sqrt(dist * dist - x * x) * 0.88
    // Cap visual size: even large gas giants should look like distant discs
    const size  = Math.min(5, Math.max(0.8, (p.pl_rade ?? 1.5) * 0.5))

    // depthWrite:false + renderOrder:-1 → always renders behind terrain geometry
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 16, 16),
      new THREE.MeshBasicMaterial({ color: hex, fog: false, depthWrite: false })
    )
    mesh.position.set(x, y, z)
    mesh.renderOrder = -1
    scene.add(mesh)

    const glowMesh2 = new THREE.Mesh(
      new THREE.SphereGeometry(size * 2.8, 8, 8),
      new THREE.MeshBasicMaterial({
        color: hex, transparent: true, opacity: 0.13,
        depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      })
    )
    glowMesh2.position.copy(mesh.position)
    glowMesh2.renderOrder = -1
    scene.add(glowMesh2)

    hitTargets.push({ mesh, hit: {
      name:  p.pl_name,
      type:  `System planet (${spectralClass(p.pl_eqt)})`,
      color: '#' + col.getHexString(),
      details: {
        'Eq. temp': p.pl_eqt      != null ? `${p.pl_eqt} K`      : '—',
        'Radius':   p.pl_rade     != null ? `${p.pl_rade} R⊕`    : '—',
        'Orbit':    p.pl_orbsmax  != null ? `${p.pl_orbsmax} AU` : '—',
      },
    }})
  })
}

function addTerrain(palette: ReturnType<typeof surfacePaletteFor>) {
  const eqt       = planet.value?.pl_eqt ?? 300
  const seed      = hostname.value.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const roughness = eqt > 1000 ? 1.8 : eqt > 400 ? 1.2 : 0.8

  // Keep terrain peaks consistently below y = -4 so camera at y=4 always floats above ground.
  // max noise output ≈ roughness * 33; place base so peak = -4.
  terrainBaseY = -(roughness * 33) - 4

  // Bandwidth-aware segment count:
  //   fast/unknown → 80 segments (full quality)
  //   medium (3G)  → 40 segments (half polygon count)
  //   slow (2G)    → 20 segments (quarter count — lowest coherent terrain)
  const segCount = bandwidthTier.value === 'slow' ? 20
                 : bandwidthTier.value === 'medium' ? 40
                 : 80

  const terrain = new THREE.Mesh(
    buildTerrainGeometry(2000, segCount, roughness, seed),
    new THREE.MeshPhongMaterial({ color: palette.terrain, specular: new THREE.Color(0x111111), shininess: 4, flatShading: true })
  )
  terrain.rotation.x = -Math.PI / 2
  terrain.position.y = terrainBaseY
  scene.add(terrain)

  const rockMat = new THREE.MeshPhongMaterial({ color: palette.rock, flatShading: true, shininess: 2 })
  for (let i = 0; i < 18; i++) {
    const r  = 1.5 + Math.random() * 4
    const rm = new THREE.Mesh(new THREE.SphereGeometry(r, 5, 4), rockMat)
    rm.position.set((Math.random() - 0.5) * 300, terrainBaseY + r * 0.4, -20 - Math.random() * 200)
    rm.rotation.set(Math.random(), Math.random(), Math.random())
    scene.add(rm)
  }

  // Solid planet body — opaque cylinder below terrain prevents seeing through the surface.
  // Radius 1400 covers full FOV at any zoom level.
  const crustColor = palette.terrain.clone().multiplyScalar(0.45)
  const floorMesh  = new THREE.Mesh(
    new THREE.CylinderGeometry(1400, 1400, 80, 32),
    new THREE.MeshPhongMaterial({ color: crustColor, flatShading: false, fog: false })
  )
  floorMesh.position.y = terrainBaseY - 40   // top of cylinder aligns with terrain base
  scene.add(floorMesh)
}

// ── Settlement ────────────────────────────────────────────────────────────────
//
// Everything below is anchored at terrain level y = -14.
// The settlement dome sits at the centre; the pyramid is ~120 units in front.

function addSettlement() {
  // All settlement objects live in this group so they track terrainBaseY automatically
  settlementGroup = new THREE.Group()
  settlementGroup.position.y = terrainBaseY
  scene.add(settlementGroup)

  addDome()
  addLibrary()
  addWater()
  addVegetation()
  addSoulOrbs()
  addStoneCircle()   // visible by default — organic cultural landmark
  addPyramid()       // hidden by default — revealed in DK.MAT mode only
}

function addDome() {
  const sg = settlementGroup!
  const geo = new THREE.SphereGeometry(70, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)

  // Wireframe lattice — outer shell only; no filled sphere so there is no
  // "inner blue ball" artefact when viewed from outside the dome.
  const wireMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color: 0x0099dd, wireframe: true, transparent: true, opacity: 0.07, depthWrite: false,
  }))
  wireMesh.position.set(0, 0, 0)
  sg.add(wireMesh)

  // Faint interior ambient surface — BackSide so it is only visible from
  // inside the dome (future interior camera view).
  const interiorMesh = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
    color: 0x003366, transparent: true, opacity: 0.035,
    side: THREE.BackSide, depthWrite: false,
  }))
  interiorMesh.position.set(0, 0, 0)
  sg.add(interiorMesh)

  // Ground ring where dome meets terrain
  const ringGeo = new THREE.RingGeometry(68, 72, 64)
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00aaff, side: THREE.DoubleSide, transparent: true, opacity: 0.25,
    depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const groundRing = new THREE.Mesh(ringGeo, ringMat)
  groundRing.rotation.x = -Math.PI / 2
  groundRing.position.set(0, 0.5, 0)
  sg.add(groundRing)
}

function addLibrary() {
  const sg = settlementGroup!
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(18, 22, 18),
    new THREE.MeshPhongMaterial({ color: 0x1e2e3e, emissive: 0x002233, emissiveIntensity: 0.4, shininess: 6 })
  )
  body.position.set(0, 11, -10)
  sg.add(body)

  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(14, 13, 2.5, 8),
    new THREE.MeshPhongMaterial({ color: 0x162230, emissive: 0x003355, emissiveIntensity: 0.5 })
  )
  roof.position.set(0, 23, -10)
  sg.add(roof)

  const winMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.8 })
  for (let side = 0; side < 4; side++) {
    const angle = side * Math.PI / 2
    const win   = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), winMat)
    win.position.set(Math.sin(angle) * 9.1, 11, -10 - Math.cos(angle) * 9.1)
    win.rotation.y = angle
    sg.add(win)
  }

  const light = new THREE.PointLight(0x44aaff, 1.0, 90)
  light.position.set(0, 28, -10)
  sg.add(light)
}

function addWater() {
  const sg = settlementGroup!
  const wGeo = new THREE.PlaneGeometry(35, 90, 20, 30)
  const wMat = new THREE.MeshPhongMaterial({
    color: 0x0044aa, emissive: 0x001133, emissiveIntensity: 0.3,
    shininess: 80, transparent: true, opacity: 0.75, side: THREE.DoubleSide,
  })
  waterMesh = new THREE.Mesh(wGeo, wMat)
  waterMesh.rotation.x = -Math.PI / 2
  waterMesh.position.set(38, 0.8, -30)   // group handles terrainBaseY offset
  sg.add(waterMesh)

  const shoreLight = new THREE.PointLight(0x0066cc, 0.5, 60)
  shoreLight.position.set(38, 2, -30)
  sg.add(shoreLight)
}

function addVegetation() {
  const rng = mulberry32(hostname.value.split('').reduce((a, c) => a + c.charCodeAt(0), 0))

  // Determine base plant hue from planet type: temperate = green, hot = orange-red, cold = blue-white
  const eqt      = planet.value?.pl_eqt ?? 300
  const baseHue  = eqt > 800 ? 0.08 : eqt > 200 ? 0.32 : 0.55
  const satRange = eqt > 800 ? [0.5, 0.9] : eqt > 200 ? [0.5, 0.8] : [0.3, 0.6]

  for (let i = 0; i < 28; i++) {
    const h   = baseHue + (rng() - 0.5) * 0.12
    const s   = satRange[0] + rng() * (satRange[1] - satRange[0])
    const l   = 0.3 + rng() * 0.3
    const col = new THREE.Color().setHSL(h, s, l)

    const height = 3 + rng() * 9
    const radius = 1.5 + rng() * 3

    const plant = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, 6),
      new THREE.MeshPhongMaterial({ color: col, flatShading: true, shininess: 2 })
    )
    plant.position.set(
      (rng() - 0.5) * 80,
      height / 2,   // base at group y=0 (= terrainBaseY in world)
      -5 - rng() * 75
    )
    plant.rotation.y = rng() * Math.PI * 2
    settlementGroup!.add(plant)

    if (rng() > 0.5) {
      const inner = new THREE.Mesh(
        new THREE.ConeGeometry(radius * 0.65, height * 0.55, 6),
        new THREE.MeshPhongMaterial({ color: new THREE.Color().setHSL(h, s, l + 0.12), flatShading: true })
      )
      inner.position.set(plant.position.x, height * 0.6, plant.position.z)
      inner.rotation.y = rng() * Math.PI * 2
      settlementGroup!.add(inner)
    }
  }
}

// Zones that anchor each community orb to a meaningful settlement area.
// Centre coordinates are in local group space (relative to terrainBaseY).
// Water feature is at (38, -, -30); library at (0, -, -10); vegetation
// spreads across (-40 to 40, -, -5 to -80).
const ORB_ZONES: { cx: number; cz: number; radius: number; height: number }[] = [
  { cx:  38, cz: -30, radius: 12, height: 2.0 },  // Fana Ka → water feature
  { cx: -10, cz: -12, radius: 10, height: 2.5 },  // OT Kulcha → library (cultural hub)
  { cx:  15, cz: -52, radius: 14, height: 1.8 },  // Uni-Kibaoni → garden / eco-ops zone
  { cx:  24, cz:  12, radius: 10, height: 2.2 },  // Glipish DJ → gateway / entrance
  { cx:   8, cz:  -8, radius:  8, height: 2.6 },  // _am_lunchmeat → library courtyard
]

function addSoulOrbs() {
  const sg = settlementGroup!

  for (let i = 0; i < ORB_DEFS.length; i++) {
    const def    = ORB_DEFS[i]!
    const zone   = ORB_ZONES[i]!
    const { color } = def

    // Start at zone centre with a small random offset
    const startX = zone.cx + (Math.random() - 0.5) * zone.radius
    const startZ = zone.cz + (Math.random() - 0.5) * zone.radius

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 10, 10),
      new THREE.MeshBasicMaterial({ color })
    )
    orb.position.set(startX, zone.height, startZ)

    // Waypoint wandering state — no circular orbit
    orb.userData = {
      zone,
      height:    zone.height,
      phase:     (i / ORB_DEFS.length) * Math.PI * 2,   // stagger hover phase
      speed:     0.014 + i * 0.003,                      // wander speed
      target:    new THREE.Vector3(startX, zone.height, startZ),
      glowMesh:  null as THREE.Mesh | null,
      pointLight: null as THREE.PointLight | null,
    }

    sg.add(orb)
    soulOrbs.push(orb)

    hitTargets.push({
      mesh: orb,
      hit: {
        name:  def.name,
        type:  `${def.group} · Sustainable Land Assistant`,
        color: '#' + new THREE.Color(color).getHexString(),
        details: {
          Community: def.desc,
          Zone:      ['Water feature', 'Library', 'Garden', 'Gateway', 'Courtyard'][i] ?? 'Settlement',
          Role:      'Mule — eco-ops steward of this zone',
          Profile:   'Connects to pon.ink profile when designated user active',
        },
      },
    })

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 8, 8),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.22,
        depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      })
    )
    glow.position.copy(orb.position)
    orb.userData.glowMesh  = glow
    sg.add(glow)

    const light = new THREE.PointLight(color, 0.4, 20)
    light.position.copy(orb.position)
    orb.userData.pointLight = light
    sg.add(light)
  }
}

// ── Exomoon sky objects ───────────────────────────────────────────────────────

/**
 * Build scientifically plausible moon descriptors for this planet.
 * Priority: sy_mnum from NASA archive → type-based estimate → 0.
 * Hot Jupiters (eqt > 1200 K) are assumed moon-free (tidal disruption).
 * Rogue planets get a synthetic "captured body" roll.
 */
function getMoonData(): MoonInfo[] {
  const pl   = planet.value
  const eqt  = pl?.pl_eqt   ?? null
  const rade = pl?.pl_rade  ?? null
  const mass = pl?.pl_bmasse ?? null
  const sys  = system.value
  const seed = (hostname.value + planetName.value)
    .split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 17)
  const rng  = mulberry32(Math.abs(seed))

  const isGasGiant  = (rade != null && rade > 4) || (mass != null && mass > 50)
  const isHotJupiter = isGasGiant && eqt != null && eqt > 1200
  const isRocky     = rade != null && rade <= 1.6
  const isSuperEarth = rade != null && rade > 1.6 && rade <= 3.5

  if (isHotJupiter) return []   // tidal disruption zone — no stable moon orbits

  // How many moons to show
  let count = sys?.sy_mnum ?? 0
  if (count === 0) {
    // Archive has no moon count — estimate from planet type
    if (isGasGiant)   count = 2 + Math.floor(rng() * 3)   // 2–4
    else if (isSuperEarth) count = Math.floor(rng() * 3)  // 0–2
    else if (isRocky) count = rng() > 0.55 ? 1 : 0        // ~45% have 1 moon
    else              count = Math.floor(rng() * 2)        // 0–1
  }
  count = Math.min(count, 5)   // cap display at 5

  // Moon appearance palette based on planet temperature
  const moonPalettes = eqt != null && eqt > 800
    ? [0xd4804a, 0xc87040, 0xa05828, 0xe09060, 0xf0a070]   // volcanic / hot tones
    : eqt != null && eqt < 150
    ? [0xc8d8f0, 0xb0c4e0, 0xa0b8d8, 0xd0e0f0, 0xe0eaf8]   // icy / cold tones
    : [0xc8b898, 0xb0a888, 0x98a0b0, 0xd0c0a0, 0xa8b890]    // rocky / temperate

  const moons: MoonInfo[] = []
  for (let i = 0; i < count; i++) {
    // Inner moons: shorter period; outer moons: longer
    const periodBase = isGasGiant
      ? 1.8 * Math.pow(3.4, i)         // Galilean-style: ~1.8, 6, 21, 70 days
      : 8   * Math.pow(2.5, i)          // rocky: ~8, 20, 50 days
    const period = periodBase * (0.85 + rng() * 0.3)

    moons.push({
      name:              count === 1 ? 'Natural Satellite' : `Moon ${['I','II','III','IV','V'][i]}`,
      color:             moonPalettes[i % moonPalettes.length],
      // Size: inner moons smaller; gas-giant moons larger
      radiusViz:         isGasGiant ? 3.2 - i * 0.3 : 2.2 - i * 0.2,
      orbitalPeriodDays: Math.max(0.4, period),
      inclDeg:           2 + rng() * (isGasGiant ? 8 : 18),   // inclination spread
      initialPhaseDeg:   (i / Math.max(count, 1)) * 360,       // evenly spread on start
    })
  }
  return moons
}

/**
 * Place each moon as a sky-level object (distance 900 units — same layer as star field).
 * Positions are updated every frame in the tick loop via moonMeshes[].
 */
function addMoons() {
  const moons = getMoonData()
  for (const info of moons) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(info.radiusViz, 14, 14),
      new THREE.MeshBasicMaterial({ color: info.color, fog: false, depthWrite: false })
    )
    mesh.renderOrder = -1

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(info.radiusViz * 2.6, 8, 8),
      new THREE.MeshBasicMaterial({
        color: info.color, transparent: true, opacity: 0.18,
        depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      })
    )
    glow.renderOrder = -1

    scene.add(mesh)
    scene.add(glow)
    moonMeshes.push({ mesh, glow, info })
    moonCount.value = moonMeshes.length

    hitTargets.push({
      mesh,
      hit: {
        name:  info.name,
        type:  'Natural satellite (exomoon)',
        color: '#' + new THREE.Color(info.color).getHexString(),
        details: {
          'Orbital period': `${info.orbitalPeriodDays.toFixed(1)} days`,
          'Inclination':    `${info.inclDeg.toFixed(1)}°`,
          'Data source':    system.value?.sy_mnum ? 'NASA archive' : 'Type-estimated',
        },
      },
    })
  }
}

// ── Stone circle / spiral — default settlement landmark ───────────────────────
// Replaces the pyramid as the visible cultural landmark in NAT and X-RAY modes.
// The circle of standing stones is unique per settlement (seeded from hostname).
// The ground spiral represents the community's relationship with the cosmos.

let stoneCircleGlow: THREE.Mesh | null = null

function addStoneCircle() {
  const sg  = settlementGroup!
  const cx  = 0, cz = -90    // just outside dome (r=70), centred axially

  // Stone colour seeded from hostname — each settlement has a unique stone palette
  const h   = hostname.value.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)
  const hue = (h % 20) * 0.018 + 0.04    // warm earthy range 0.04–0.40
  const stoneTint = new THREE.Color().setHSL(hue, 0.12 + (h % 6) * 0.03, 0.30 + (h % 8) * 0.025)
  const stoneMat  = new THREE.MeshPhongMaterial({
    color: stoneTint, emissive: stoneTint.clone().multiplyScalar(0.06),
    flatShading: true, shininess: 2,
  })

  // 8 standing stones arranged in a circle
  const N = 8
  for (let i = 0; i < N; i++) {
    const angle  = (i / N) * Math.PI * 2
    const stoneH = 7 + Math.sin(h * (i + 1) * 0.73) * 2.5      // 4.5–9.5 units
    const stoneW = 1.4 + ((h * (i + 3)) % 5) * 0.22             // 1.4–2.5 units
    const tiltX  = (Math.sin(h * (i + 1) * 1.13) - 0.5) * 0.10  // subtle tilt ≤ 5°
    const tiltZ  = (Math.sin(h * (i + 2) * 1.77) - 0.5) * 0.08

    const stone = new THREE.Mesh(
      new THREE.CylinderGeometry(stoneW * 0.65, stoneW, stoneH, 5 + (i % 3)),
      stoneMat
    )
    stone.position.set(
      cx + Math.cos(angle) * 15,
      stoneH / 2,
      cz + Math.sin(angle) * 15,
    )
    stone.rotation.x = tiltX
    stone.rotation.z = tiltZ
    stone.rotation.y = angle    // face inward toward circle centre
    sg.add(stone)
  }

  // Central altar — low flat stone, slightly elevated
  const altar = new THREE.Mesh(
    new THREE.CylinderGeometry(3.8, 4.5, 1.0, 8),
    stoneMat.clone()
  )
  altar.position.set(cx, 0.5, cz)
  sg.add(altar)

  // Ground triple-spiral (triskelion-inspired) — etched symbol around the circle
  {
    const spiralPts: THREE.Vector3[] = []
    const ARMS = 3, TURNS = 3
    for (let arm = 0; arm < ARMS; arm++) {
      const startAngle = (arm / ARMS) * Math.PI * 2
      const steps = 80 * TURNS
      for (let j = 0; j <= steps; j++) {
        const t     = j / steps
        const theta = startAngle + t * Math.PI * 2 * TURNS
        const r     = 1.5 + t * 12                        // spiral out from r=1.5 to r=13.5
        spiralPts.push(new THREE.Vector3(cx + Math.cos(theta) * r, 0.12, cz + Math.sin(theta) * r))
      }
    }
    const spiralLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(spiralPts),
      new THREE.LineBasicMaterial({ color: 0x6699bb, transparent: true, opacity: 0.30, depthWrite: false })
    )
    sg.add(spiralLine)
  }

  // Very faint ambient glow at the circle centre — bioluminescent moss aesthetic
  stoneCircleGlow = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0x4488aa, transparent: true, opacity: 0.10,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })
  )
  stoneCircleGlow.position.set(cx, 1.2, cz)
  sg.add(stoneCircleGlow)
}

// ── Pyramid — E8 wormhole access point, hidden by default ─────────────────────
// Visible ONLY when DK.MAT (dark matter) mode is active in the DefenderNav.
// The pyramid marks the E8 lattice conduit entry; its presence in DK.MAT mode
// reveals the wormhole network topology that underlies the dark matter filaments.

function addPyramid() {
  const pyramidGeo = new THREE.ConeGeometry(9, 16, 4)
  pyramidGeo.rotateY(Math.PI / 4)

  const pyramidMat = new THREE.MeshPhongMaterial({
    color:             0xc8882a,
    emissive:          0x443300,
    emissiveIntensity: 0.6,
    shininess:         14,
    flatShading:       true,
  })

  // ── Wrap all pyramid objects in a named group — easy to show/hide ────────
  const pyramidGroup = new THREE.Group()
  pyramidGroup.name = 'pyramid_group'
  pyramidGroup.visible = false    // hidden by default — revealed in DK.MAT mode
  settlementGroup!.add(pyramidGroup)

  const pyramid = new THREE.Mesh(pyramidGeo, pyramidMat)
  pyramid.position.set(0, 8, -125)
  pyramid.name = 'pyramid'
  pyramidGroup.add(pyramid)

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(pyramidGeo),
    new THREE.LineBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.4 })
  )
  edges.position.copy(pyramid.position)
  pyramidGroup.add(edges)

  pyramidLight = new THREE.PointLight(0xffcc44, 1.2, 80)
  pyramidLight.position.set(0, 16, -125)
  pyramidLight.visible = false    // also hidden by default
  settlementGroup!.add(pyramidLight)

  const ringGeo = new THREE.RingGeometry(11, 14, 30)
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffcc44, side: THREE.DoubleSide, transparent: true,
    opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.set(0, 0.2, -125)
  pyramidGroup.add(ring)

  for (let k = 0; k < 8; k++) {
    const angle = (k / 8) * Math.PI * 2
    const pts = [
      new THREE.Vector3(Math.cos(angle) * 11, 0.2, -125 + Math.sin(angle) * 11),
      new THREE.Vector3(Math.cos(angle) * 22, 0.2, -125 + Math.sin(angle) * 22),
    ]
    pyramidGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.15 })
    ))
  }

  hitTargets.push({
    mesh: pyramid,
    hit: {
      name:      'E8 Wormhole Conduit',
      type:      'Dark Matter Transit Access Point',
      color:     '#cc55ff',
      isPyramid: true,
      details: {
        'Address':  `exo-surface-v1:${hostname.value}:${planetName.value}`,
        'Routing':  routingLabel.value,
        'Protocol': 'E8 lattice · void-edge conduit network',
        'Access':   'Visible in Dark Matter view mode',
      },
    },
  })
}

// ── Local time → host star sky position ──────────────────────────────────────

function applyLocalTime(deg: number) {
  if (!hostStarMesh || !hostStarGlow || !hostStarLight) return
  const t        = (deg / 360) * Math.PI * 2
  const hourAngle = t - Math.PI
  const starDec   = system.value?.dec ?? 0
  const dir       = skyPosition(starDec, hourAngle, 30)
  const pos       = dir.clone().multiplyScalar(700)

  hostStarMesh.position.copy(pos)
  hostStarGlow.position.copy(pos)
  hostStarLight.position.copy(pos)
  hostStarLight.target.position.set(0, 0, 0)
  scene.add(hostStarLight.target)

  const altitude   = Math.asin(Math.max(-1, Math.min(1, dir.y)))
  const eqt        = planet.value?.pl_eqt ?? null
  const nightFloor = eqt != null && eqt > 600 ? 0.30 : 0
  hostStarLight.intensity = altitude > 0 ? Math.sin(altitude) * 2.4 : nightFloor

  const twilightBand = Math.max(0, 1 - Math.abs(altitude) / (Math.PI * 0.12))
  const nightColor   = new THREE.Color(0x020408)
  const twilightColor = new THREE.Color(system.value?.st_teff
    ? starColorFromTeff(system.value.st_teff).multiplyScalar(0.04) : 0x0a0408)
  renderer.setClearColor(nightColor.clone().lerp(twilightColor, twilightBand * 0.6))
}

// ── Animation loop ────────────────────────────────────────────────────────────

function surfaceTick(t: number) {
  {
    const dt = clockRef.getDelta()

    if (!isRealTime.value && animating.value && animSpeed.value > 0) {
      localTimeDeg.value = (localTimeDeg.value + dt * 20 * animSpeed.value) % 360
      applyLocalTime(localTimeDeg.value)
    }

    // Stone circle glow — slow breathing pulse (0.15 Hz, very gentle)
    if (stoneCircleGlow && viewMode.value !== 'dark_matter') {
      const baseOp = viewMode.value === 'xray' ? 0.06 : 0.10
      ;(stoneCircleGlow.material as THREE.MeshBasicMaterial).opacity =
        baseOp + Math.sin(t * 0.95) * 0.03
    }

    // Soul orbs — zone-based wandering: each orb drifts toward a waypoint
    // within its assigned settlement area, picks a new one when close.
    for (const orb of soulOrbs) {
      const d    = orb.userData
      const zone = d.zone as { cx: number; cz: number; radius: number; height: number }
      const tgt  = d.target as THREE.Vector3

      // Pick a new waypoint when close enough
      if (orb.position.distanceTo(tgt) < 1.8) {
        const angle = Math.random() * Math.PI * 2
        const r     = Math.random() * zone.radius
        tgt.set(
          zone.cx + Math.cos(angle) * r,
          d.height,
          zone.cz + Math.sin(angle) * r,
        )
      }

      // Gentle lerp toward waypoint
      orb.position.x += (tgt.x - orb.position.x) * d.speed
      orb.position.z += (tgt.z - orb.position.z) * d.speed

      // Subtle vertical hover — stays low, close to ground
      orb.position.y = d.height + Math.sin(t * 0.55 + d.phase) * 0.6

      if (d.glowMesh)   (d.glowMesh   as THREE.Mesh).position.copy(orb.position)
      if (d.pointLight) (d.pointLight as THREE.PointLight).position.copy(orb.position)
    }

    // Moon sky positions — each moon traces an arc across the horizon
    for (const { mesh, glow, info } of moonMeshes) {
      // How far the moon has moved in its orbit at this planet-day fraction
      const moonPhase = (info.initialPhaseDeg + localTimeDeg.value / info.orbitalPeriodDays) % 360
      const hourAngle = (moonPhase / 360) * Math.PI * 2 - Math.PI
      const dir = skyPosition(info.inclDeg, hourAngle, 0)
      const pos = dir.clone().multiplyScalar(900)
      mesh.position.copy(pos)
      glow.position.copy(pos)
      // Hide moon when below the visible horizon (-5° threshold avoids pop-in)
      const above = dir.y > -0.087   // ~5° below horizon
      mesh.visible = above
      glow.visible = above
    }

    // Pyramid pulse
    if (pyramidLight) {
      pyramidLight.intensity = 0.7 + Math.sin(t * 2.2) * 0.55
    }

    // Water ripple
    if (waterMesh) {
      const pos = (waterMesh.geometry as THREE.BufferGeometry).attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const z = pos.getZ(i)
        pos.setY(i, Math.sin(x * 0.18 + t * 2.0) * 0.7 + Math.cos(z * 0.14 + t * 1.6) * 0.5)
      }
      pos.needsUpdate = true
      waterMesh.geometry.computeVertexNormals()
    }

    // WASD / arrow-key walk — pan camera+target together so view direction stays fixed
    if (keysDown.size > 0) {
      const WALK_SPEED = 1.4
      const fwd = new THREE.Vector3()
      camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize()
      const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0))
      const delta = new THREE.Vector3()
      if (keysDown.has('KeyW') || keysDown.has('ArrowUp'))    delta.addScaledVector(fwd,   WALK_SPEED)
      if (keysDown.has('KeyS') || keysDown.has('ArrowDown'))  delta.addScaledVector(fwd,  -WALK_SPEED)
      if (keysDown.has('KeyA') || keysDown.has('ArrowLeft'))  delta.addScaledVector(right, -WALK_SPEED)
      if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) delta.addScaledVector(right,  WALK_SPEED)
      if (delta.lengthSq() > 0) {
        camera.position.add(delta)
        controls.target.add(delta)
      }
    }

    controls.update()

    // Hard floor: camera never drops below terrain base — prevents seeing settlement from underneath
    const surfaceFloor = terrainBaseY + 4
    if (camera.position.y < surfaceFloor) {
      camera.position.y = surfaceFloor
    }
    // Also keep the orbit target from drifting underground via panning
    if (controls.target.y < surfaceFloor) {
      controls.target.y = surfaceFloor
    }

    defenderNav.value?.redraw(buildSkyDefenderData())
  }
}

// ── Look modes ────────────────────────────────────────────────────────────────

function toggleAnimation() { animating.value = !animating.value }

function setLookMode(mode: string) {
  if (mode === 'zenith') {
    // Look straight up at the sky dome — camera at eye level, target elevated
    const eyeY = Math.max(terrainBaseY + 4, 2)
    camera.position.set(0, eyeY, 0)
    controls.target.set(0, eyeY + 100, 0)
    controls.minPolarAngle = 0
    controls.maxPolarAngle = Math.PI * 0.45
  } else if (mode === 'walk') {
    // Walk mode — camera inside dome at eye level; WASD/arrow keys move forward/back/strafe
    const eyeY = Math.max(terrainBaseY + 3.5, 3.5)
    camera.position.set(0, eyeY, 50)
    controls.target.set(0, eyeY, -10)
    controls.minPolarAngle = 0.05
    controls.maxPolarAngle = Math.PI * 0.68
  } else {
    // Orbit mode — camera outside dome, full turntable rotation
    const eyeY = Math.max(terrainBaseY + 4, 4)
    camera.position.set(0, eyeY, 85)
    controls.target.set(0, eyeY * 0.5, 0)
    controls.minPolarAngle = 0.10
    controls.maxPolarAngle = Math.PI * 0.54
  }
  controls.update()
}

// ── Raycasting ────────────────────────────────────────────────────────────────

function onMouseMove(e: MouseEvent) {
  const w = window.innerWidth, h = window.innerHeight - 44
  mouseNDC.x =  (e.clientX / w) * 2 - 1
  mouseNDC.y = -((e.clientY - 44) / h) * 2 + 1
  tooltipStyle.value = { left: (e.clientX + 16) + 'px', top: (e.clientY - 8) + 'px' }

  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(hitTargets.map(t => t.mesh), false)
  hoveredObject.value = hits.length ? (hitTargets.find(t => t.mesh === hits[0].object)?.hit ?? null) : null
}

function onCanvasClick() {
  if (hoveredObject.value?.isPyramid) {
    showTransitDialog.value = true
  } else if (hoveredObject.value?.type.includes('Sustainable Land Assistant')) {
    selectedOrb.value = selectedOrb.value?.name === hoveredObject.value.name
      ? null
      : hoveredObject.value
  } else {
    selectedOrb.value = null
  }
}

// Double-click: fly to the named scope for the hovered object, or zoom toward hit point.
function onCanvasDblClick(e: MouseEvent) {
  if (!camera || !controls) return

  const w = window.innerWidth, h = window.innerHeight - 44
  const ndcX =  (e.clientX / w) * 2 - 1
  const ndcY = -((e.clientY - 44) / h) * 2 + 1
  raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera)

  const hits = raycaster.intersectObjects(hitTargets.map(t => t.mesh), false)

  if (hits.length) {
    const hitObj = hitTargets.find(t => t.mesh === hits[0]!.object)?.hit
    if (hitObj) {
      if (hitObj.isPyramid) { spatial.flyTo('settlement:pyramid:chamber'); return }
      if (hitObj.type.includes('Sustainable Land Assistant')) {
        spatial.flyTo(`settlement:orb:${toOrbSlug(hitObj.name)}`)
        return
      }
      // Library, water, star, planet hits — zoom toward the world hit point
    }
    // Zoom toward the specific hit point in the scene
    const pt  = hits[0]!.point
    const cam = camera!
    const ctrl = controls!
    const dir  = cam.position.clone().sub(pt).normalize()
    const dist = cam.position.distanceTo(pt)
    const newPos = pt.clone().add(dir.multiplyScalar(Math.max(dist * 0.35, ctrl.minDistance + 1)))
    gsap.to(cam.position,  { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.2, ease: 'power2.out',
      onUpdate: () => ctrl.update() })
    gsap.to(ctrl.target,   { x: pt.x, y: pt.y, z: pt.z, duration: 1.2, ease: 'power2.out' })
    return
  }

  // No hit mesh — zoom camera forward by 35% toward cursor direction
  const cam = camera!
  const forward = new THREE.Vector3(ndcX * 0.5, ndcY * 0.5, 0.5)
    .unproject(cam).sub(cam.position).normalize()
  const step = Math.max(cam.position.distanceTo(controls!.target) * 0.35, 5)
  const newPos = cam.position.clone().add(forward.multiplyScalar(step))
  gsap.to(cam.position, { x: newPos.x, y: newPos.y, z: newPos.z, duration: 1.1, ease: 'power2.out',
    onUpdate: () => controls?.update() })
}

function toOrbSlug(name: string): string {
  return name.toLowerCase().replace(/^_+/, '').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
}

// ── Resize ────────────────────────────────────────────────────────────────────

// onResize handled globally by MainLayout via viz.resize()

// ── Helpers ───────────────────────────────────────────────────────────────────

function spectralType(teff: number): string {
  if (teff >= 30000) return 'O-type star (blue)'
  if (teff >= 10000) return 'B-type star (blue-white)'
  if (teff >= 7500)  return 'A-type star (white)'
  if (teff >= 6000)  return 'F-type star (yellow-white)'
  if (teff >= 5200)  return 'G-type star (yellow, Sun-like)'
  if (teff >= 3700)  return 'K-type star (orange)'
  return 'M-type star (red)'
}

function skyDegToPhase(d: number): string {
  if (d < 22 || d >= 338) return 'Midnight'
  if (d < 90)  return 'Night'
  if (d < 112) return 'Dawn'
  if (d < 202) return 'Day'
  if (d < 270) return 'Dusk'
  return 'Evening'
}

function toggleRealTime() {
  isRealTime.value = !isRealTime.value
  if (isRealTime.value) {
    const d = new Date()
    const s = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds()
    localTimeDeg.value = (s / 86400) * 360
    applyLocalTime(localTimeDeg.value)
  }
}

function onSliderDrag(val: number) {
  isRealTime.value = false
  applyLocalTime(val)
}

function spectralClass(eqt: number | null | undefined): string {
  if (eqt == null) return 'unknown temperature'
  if (eqt > 1500)  return 'ultra-hot'
  if (eqt > 600)   return 'hot'
  if (eqt > 200)   return 'temperate'
  return 'cold'
}

function buildSkyDefenderData(): DefenderNavData {
  if (!sceneReady.value) return {}

  const look    = controls.target.clone().sub(camera.position).normalize()
  const azimuth = ((Math.atan2(look.x, -look.z) * 180 / Math.PI) + 360) % 360
  const fov     = 80

  const skyObjects: SkyObjectEntry[] = []

  if (hostStarMesh && system.value) {
    const pos  = hostStarMesh.position.clone().normalize()
    const alt  = Math.asin(Math.max(-1, Math.min(1, pos.y))) * 180 / Math.PI
    const az   = ((Math.atan2(pos.x, -pos.z) * 180 / Math.PI) + 360) % 360
    const col  = '#' + starColorFromTeff(system.value.st_teff).getHexString()
    skyObjects.push({ name: system.value.hostname, type: 'star', azimuth: az, altitude: alt, color: col })
  }

  for (const { mesh, info } of moonMeshes) {
    if (!mesh.visible) continue
    const pos = mesh.position.clone().normalize()
    const alt = Math.asin(Math.max(-1, Math.min(1, pos.y))) * 180 / Math.PI
    const az  = ((Math.atan2(pos.x, -pos.z) * 180 / Math.PI) + 360) % 360
    const col = '#' + new THREE.Color(info.color).getHexString()
    skyObjects.push({ name: info.name, type: 'moon', azimuth: az, altitude: alt, color: col })
  }

  scene.traverse(obj => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const hit = hitTargets.find(t => t.mesh === mesh)
    if (!hit) return
    if (hit.hit.type?.includes('System planet')) {
      const pos = mesh.position.clone().normalize()
      const alt = Math.asin(Math.max(-1, Math.min(1, pos.y))) * 180 / Math.PI
      const az  = ((Math.atan2(pos.x, -pos.z) * 180 / Math.PI) + 360) % 360
      skyObjects.push({ name: hit.hit.name, type: 'planet', azimuth: az, altitude: alt, color: hit.hit.color })
    }
  })

  const terrainProfile: number[] = []
  for (let i = 0; i < 64; i++) {
    const x = (i / 64) * 400 - 200
    const seed = hostname.value.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 7.31
    const eqt  = planet.value?.pl_eqt ?? 300
    const roughness = eqt > 1000 ? 1.8 : eqt > 400 ? 1.2 : 0.8
    const h =
      Math.sin(x * 0.012 + seed) * 14 * roughness +
      Math.sin(x * 0.035 + seed * 2.1) * 3 * roughness
    terrainProfile.push(Math.max(0, h + 40) / 80)
  }

  return {
    surfaceData: {
      cameraAzimuth:  azimuth,
      cameraFov:      fov,
      skyObjects,
      galleries:      [],
      localTimeDeg:   localTimeDeg.value,
      terrainProfile,
    },
    // Earth↔System inset — gives spatial context: how far is this planet from Sol?
    currentSystemRef: system.value?.sy_dist != null ? {
      hostname: system.value.hostname,
      distPc:   system.value.sy_dist,
      ra:       system.value.ra,
      dec:      system.value.dec,
    } : undefined,
  }
}

/** Return to the galaxy view for this system, using the portal animation. */
function goBackToGalaxy() {
  const srcColor = system.value
    ? '#' + starColorFromTeff(system.value.st_teff).getHexString()
    : undefined
  portalStore.openPortal({
    label:       hostname.value,
    route:       `/galaxy?focusHost=${encodeURIComponent(hostname.value)}&contextView=true`,
    hostname:    hostname.value,
    sourceColor: srcColor,
  })
}

/** Navigate into the dome interior page. */
function enterDome() {
  void router.push({
    name: 'dome-interior',
    params: { hostname: hostname.value, planetName: planetName.value },
    query: { eqt: String(planet.value?.pl_eqt ?? 285) },
  })
}

/** Context zoom from surface: portal to galaxy view with this system highlighted. */
function onContextZoom() {
  goBackToGalaxy()
}

function onDefenderFlyTo(target: DefenderTarget) {
  if (target.type === 'azimuth' && target.azimuth != null) {
    const az  = (target.azimuth * Math.PI) / 180
    const eyeY = camera.position.y
    gsap.to(controls.target, {
      duration: 1.2,
      x: Math.sin(az) * 200,
      y: eyeY,
      z: -Math.cos(az) * 200,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    })
  }
}

function onDefenderPortalTo(dest: { label: string; route: string }) {
  portalStore.openPortal(dest)
}

function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ── Entry animation: approach from high orbit, retro-ion landing ──────────────
//
// Plays once after initScene(). Camera sweeps from high altitude (y=350)
// down to normal orbit position while a small ion-drive shuttle descends
// ahead of us and "lands" near the settlement dome.
//
// Design: retro hard-SF aesthetic — blunt hull, splayed engine bells,
// pulsing blue-white ion exhaust. Tidally-locked or ultra-hot worlds skip
// the sequence to avoid jarring entry into an already dramatic scene.

function playEntryAnimation() {
  if (!scene || !camera || !controls) return

  entryAnimating.value = true
  controls.enabled = false

  // ── Build shuttle ────────────────────────────────────────────────────────
  const sg = new THREE.Group()
  sg.name = 'entry_shuttle'

  // Hull — flattened box, nose along -Z
  const hullMat = new THREE.MeshPhongMaterial({ color: 0x1c2535, shininess: 90, specular: 0x334466 })
  const hullGeo = new THREE.BoxGeometry(2.8, 0.9, 7.0)
  const hull    = new THREE.Mesh(hullGeo, hullMat)
  sg.add(hull)

  // Wings — swept low-profile slabs
  const wingMat = new THREE.MeshPhongMaterial({ color: 0x141c28, shininess: 60 })
  const wingGeo = new THREE.BoxGeometry(10, 0.20, 3.5)
  const wings   = new THREE.Mesh(wingGeo, wingMat)
  wings.position.set(0, -0.35, 0.8)
  sg.add(wings)

  // Nose cone
  const noseMat = new THREE.MeshPhongMaterial({ color: 0x0e1520, shininess: 120 })
  const noseGeo = new THREE.ConeGeometry(0.55, 2.5, 8)
  const nose    = new THREE.Mesh(noseGeo, noseMat)
  nose.position.set(0, 0, -4.25)
  nose.rotation.x = Math.PI / 2
  sg.add(nose)

  // Navigation lights — green starboard, red port
  const stbMat = new THREE.MeshBasicMaterial({ color: 0x00ff44, transparent: true, opacity: 0.9, fog: false })
  const portMat = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.9, fog: false })
  const navGeo  = new THREE.SphereGeometry(0.18, 6, 6)
  const stbLight = new THREE.Mesh(navGeo, stbMat);  stbLight.position.set( 5.3, 0, 0.8); sg.add(stbLight)
  const portLight = new THREE.Mesh(navGeo, portMat); portLight.position.set(-5.3, 0, 0.8); sg.add(portLight)

  // Engine bells — 3 bells at tail (+Z end)
  const bellMat = new THREE.MeshPhongMaterial({ color: 0x2a3d55, shininess: 120, specular: 0x88aacc })
  const bellGeo = new THREE.ConeGeometry(0.42, 1.4, 8)
  const bellOffsets = [[-1.1, 0, 3.9], [0, 0, 3.9], [1.1, 0, 3.9]] as const
  bellOffsets.forEach(([x, y, z]) => {
    const bell = new THREE.Mesh(bellGeo, bellMat)
    bell.position.set(x, y, z)
    bell.rotation.x = -Math.PI / 2   // open end pointing +Z (behind craft)
    sg.add(bell)
  })

  // Ion jet cones — glowing emissive, additive blending
  const jetMat = new THREE.MeshBasicMaterial({
    color: 0x55ccff, transparent: true, opacity: 0.72,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  })
  const jetGeo = new THREE.ConeGeometry(0.22, 16, 6)
  const jetMeshes: THREE.Mesh[] = []
  bellOffsets.forEach(([x, y, z]) => {
    const jet = new THREE.Mesh(jetGeo, jetMat.clone() as THREE.MeshBasicMaterial)
    jet.position.set(x, y, z + 9)   // extending behind engine bell
    jet.rotation.x = -Math.PI / 2
    sg.add(jet)
    jetMeshes.push(jet)
  })

  // Engine glow PointLights
  const glowLights: THREE.PointLight[] = []
  bellOffsets.forEach(([x, y, z]) => {
    const pt = new THREE.PointLight(0x44bbff, 3.0, 28)
    pt.position.set(x, y, z + 2)
    sg.add(pt)
    glowLights.push(pt)
  })

  // ── Position and orient shuttle ──────────────────────────────────────────
  // Start high above and slightly offset from the settlement
  const startY  = terrainBaseY + 340
  const startZ  = 120
  sg.position.set(5, startY, startZ)
  // Nose-down attitude for descent
  sg.rotation.x = 0.22
  sg.lookAt(0, terrainBaseY + 2, 20)

  scene.add(sg)
  entryGroup = sg

  // ── Camera start position: high overhead looking steeply down ────────────
  camera.position.set(0, terrainBaseY + 400, 180)
  controls.target.set(0, terrainBaseY + 80, 60)
  controls.update()

  // ── Animation sequence ───────────────────────────────────────────────────

  // Phase 1 (0–4.5s): camera sweeps down to orbit position
  gsap.to(camera.position, {
    x: 0, y: 4, z: 85,
    duration: 4.5, ease: 'power2.inOut',
    onUpdate: () => controls.update(),
  })
  gsap.to(controls.target, {
    x: 0, y: 2, z: 0,
    duration: 4.5, ease: 'power2.inOut',
  })

  // Shuttle descends toward the settlement landing zone
  const shuttlePos = { y: startY, z: startZ }
  gsap.to(shuttlePos, {
    y: terrainBaseY + 3, z: 22,
    duration: 3.8, ease: 'power2.in',
    onUpdate: () => {
      sg.position.y = shuttlePos.y
      sg.position.z = shuttlePos.z
    },
  })
  // Shuttle nose levels out as it lands
  gsap.to(sg.rotation, { x: 0.0, duration: 1.2, delay: 2.8, ease: 'power2.out' })

  // Phase 2 (3.6–4.5s): engines cut — jets and glow fade
  const engineFade = { v: 1.0 }
  gsap.to(engineFade, {
    v: 0,
    delay: 3.5, duration: 1.0, ease: 'power2.in',
    onUpdate: () => {
      jetMeshes.forEach(j => { (j.material as THREE.MeshBasicMaterial).opacity = engineFade.v * 0.72 })
      glowLights.forEach(l => { l.intensity = engineFade.v * 3.0 })
    },
  })

  // Phase 3 (4.8–5.4s): shuttle fades out and is removed, controls re-enable
  const hullFade = { v: 1.0 }
  gsap.to(hullFade, {
    v: 0,
    delay: 4.6, duration: 0.8, ease: 'power1.in',
    onUpdate: () => {
      const op = hullFade.v
      sg.traverse(obj => {
        const m = obj as THREE.Mesh
        if (!m.isMesh) return
        const mat = m.material as THREE.MeshPhongMaterial | THREE.MeshBasicMaterial
        if (!mat.transparent) { mat.transparent = true }
        mat.opacity = op
      })
    },
    onComplete: () => {
      scene!.remove(sg)
      sg.traverse(o => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
        if (m.material && !Array.isArray(m.material)) (m.material as THREE.Material).dispose()
      })
      entryGroup = null
      controls!.enabled = true
      entryAnimating.value = false
    },
  })
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

// Bandwidth tier detected once at mount — drives asset quality decisions.
const bandwidthTier = ref<'fast' | 'medium' | 'slow' | 'unknown'>('unknown')

onMounted(async () => {
  // ── Security: enforce 48-hour session horizon ───────────────────────────────
  // Clears Exotopia-namespaced sessionStorage if the session is older than 48h.
  // Prevents stale virtual property data persisting across field device sessions.
  enforceSessionHorizon()

  // ── Bandwidth detection: adjust asset quality for low-bandwidth devices ─────
  bandwidthTier.value = detectBandwidthTier()
  if (bandwidthTier.value === 'slow') {
    console.info('[BANDWIDTH] slow-2g/2g detected — scene will use simplified geometry')
  }

  earthClock.value = new Date()
  const initSec = earthClock.value.getUTCHours() * 3600
    + earthClock.value.getUTCMinutes() * 60
    + earthClock.value.getUTCSeconds()
  localTimeDeg.value = (initSec / 86400) * 360

  clockInterval = setInterval(() => {
    earthClock.value = new Date()
    if (isRealTime.value) {
      const d = earthClock.value
      const s = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds()
      localTimeDeg.value = (s / 86400) * 360
      applyLocalTime(localTimeDeg.value)
    }
  }, 1000)

  await galaxyStore.loadData()

  // No-solid-ground backstop: bodyless/malformed addresses (planet.value is null
  // for ANY unresolved hostname/planetName, from any entry path — deep link,
  // bookmark, hand-edited URL), and real gas-giant/magma-ocean/lava worlds, don't
  // get the flat-terrain dome scene. See src/lib/surface-classify.ts.
  if (!isMoonView.value) {
    const noGround = !planet.value || await hasNoSolidGround(planetName.value)
    if (noGround) {
      const reason = planet.value ? 'no-solid-crust' : 'bodyless-orbital'
      void router.replace(
        `/station-interior/${encodeURIComponent(hostname.value)}/${encodeURIComponent(planetName.value)}?reason=${reason}`
      )
      return
    }
  }

  // Log surface/moon visit for smart preset generation in MintStylePage
  logNavEvent(isMoonView.value ? 'moon_view' : 'surface_view', {
    hostname:    hostname.value,
    planetName:  planetName.value,
    parentName:  parentName.value || null,
    eqt:         planet.value?.pl_eqt ?? null,
    dist:        system.value?.sy_dist ?? null,
    teff:        system.value?.st_teff ?? null,
    isMoon:      isMoonView.value,
  })

  initScene()
  // Skip entry animation if a spatial URL is present (direct deep-link) or planet is gaseous
  const eqt = planet.value?.pl_eqt ?? null
  const rade = planet.value?.pl_rade ?? 2.0
  const isGasGiant = rade > 5.0 || (eqt != null && eqt > 1800)
  if (!route.query.at && !route.query.cam && !isGasGiant) {
    playEntryAnimation()
  } else {
    spatial.restoreFromUrl()
  }
  _stopTick = viz.addTick(surfaceTick)
})

onUnmounted(() => {
  if (keydownFn) { window.removeEventListener('keydown', keydownFn); keydownFn = null }
  if (keyupFn)   { window.removeEventListener('keyup',   keyupFn);   keyupFn   = null }
  keysDown.clear()
  if (clockInterval !== null) clearInterval(clockInterval)
  _stopTick?.(); _stopTick = null

  disposeScene(pageGroup)
  scene?.remove(pageGroup)
  if (scene) { scene.background = null; scene.fog = null }

  soulOrbs        = []
  moonMeshes      = []
  hitTargets      = []
  waterMesh       = null
  pyramidLight    = null
  hostStarMesh    = null
  hostStarGlow    = null
  hostStarLight   = null
  settlementGroup = null
  stoneCircleGlow = null
  if (entryGroup) { scene?.remove(entryGroup); entryGroup = null }
  entryAnimating.value = false
})
watch([hostname, planetName], async () => {
  if (renderer) {
    _stopTick?.(); _stopTick = null
    disposeScene(pageGroup)
    pageGroup.clear()
    hitTargets   = []
    soulOrbs     = []
    moonMeshes   = []
    waterMesh    = null
    pyramidLight = null
    hostStarMesh = hostStarGlow = hostStarLight = null
    sceneReady.value = false
  }
  await galaxyStore.loadData()
  initScene()
  spatial.restoreFromUrl()
  _stopTick = viz.addTick(surfaceTick)
})
</script>

<style scoped>
.surface-page { position: relative; width: 100vw; height: 100vh; overflow: hidden; }

/* surface-header replaced by .planet-info-panel below */
.surface-header { display: none; }

.settlement-badge {
  position: absolute; top: 12px; right: 12px;
  background: rgba(0, 30, 50, 0.8); border: 1px solid rgba(0, 180, 220, 0.2);
  border-radius: 4px;
}

/* ── Planet info panel ─────────────────────────────────────────── */

.planet-info-panel {
  position: absolute;
  top: 56px;             /* below the MainLayout header */
  left: 12px;
  width: 270px;
  background: rgba(1, 5, 18, 0.92);
  border: 1px solid rgba(0, 140, 190, 0.22);
  border-radius: 6px;
  backdrop-filter: blur(8px);
  font-family: 'Courier New', monospace;
  z-index: 5;
  overflow: hidden;
}

.pip-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  cursor: pointer;
  user-select: none;
  background: rgba(0, 10, 28, 0.60);
  border-bottom: 1px solid rgba(0, 80, 120, 0.30);
  transition: background 0.12s;
}
.pip-header:hover { background: rgba(0, 20, 45, 0.80); }

.pip-planet-name {
  flex: 1;
  font-size: 10px;
  letter-spacing: 0.05em;
  color: rgba(180, 220, 245, 0.90);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pip-zone-chip {
  font-size: 6.5px;
  letter-spacing: 0.12em;
  padding: 1px 5px;
  border-radius: 2px;
  border: 1px solid;
  flex-shrink: 0;
}

.zone--temperate { color: rgba(60, 220, 120, 0.85); border-color: rgba(60, 200, 100, 0.40); }
.zone--icy       { color: rgba(140, 200, 240, 0.80); border-color: rgba(100, 180, 220, 0.35); }
.zone--frozen    { color: rgba(160, 200, 255, 0.70); border-color: rgba(120, 160, 220, 0.30); }
.zone--warm      { color: rgba(255, 210, 80, 0.85);  border-color: rgba(220, 180, 50, 0.40); }
.zone--hot       { color: rgba(255, 140, 60, 0.85);  border-color: rgba(220, 110, 40, 0.40); }
.zone--ultrahot  { color: rgba(255, 80, 40, 0.85);   border-color: rgba(220, 60, 30, 0.40); }
.zone--unknown   { color: rgba(80, 120, 160, 0.60);  border-color: rgba(60, 100, 140, 0.25); }

.pip-toggle {
  font-size: 8px;
  color: rgba(0, 160, 200, 0.45);
  flex-shrink: 0;
}

/* Expanded body */
.pip-body {
  padding: 6px 0 4px;
  max-height: 65vh;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 140, 190, 0.20) transparent;
}

.pip-section {
  padding: 5px 10px 4px;
  border-bottom: 1px solid rgba(0, 50, 90, 0.22);
}
.pip-section:last-child { border-bottom: none; }

.pip-section-label {
  font-size: 6.5px;
  letter-spacing: 0.16em;
  color: rgba(0, 150, 190, 0.50);
  margin-bottom: 4px;
}

.pip-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.pip-k { font-size: 8px; color: rgba(70, 120, 155, 0.65); flex-shrink: 0; }
.pip-v {
  font-size: 8px;
  color: rgba(160, 210, 232, 0.85);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pip-v--warn { color: rgba(255, 180, 60, 0.80); }

.pip-source {
  font-size: 7px;
  color: rgba(60, 100, 140, 0.50);
  margin-left: 4px;
}

/* Sibling planet rows */
.pip-sibling {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
}

.pip-sib-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pip-sib-name {
  flex: 1;
  font-size: 8px;
  color: rgba(140, 195, 220, 0.78);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pip-sib--here { color: #00e5ff; }
.pip-here-tag  { font-size: 6.5px; color: rgba(0, 200, 240, 0.55); margin-left: 3px; }

.pip-sib-au {
  font-size: 7px;
  color: rgba(70, 120, 155, 0.55);
  flex-shrink: 0;
}

/* ── Climate estimates section ───────────────────────────────── */
.pip-section--climate { background: rgba(0, 18, 40, 0.40); }

.pip-v--mono  { font-family: 'Courier New', monospace; font-size: 8px; max-width: 58%; white-space: normal; text-align: right; line-height: 1.35; }
.pip-v--warm  { color: rgba(255, 160, 80, 0.90); }
.pip-v--cool  { color: rgba(130, 200, 240, 0.85); }

.pip-climate-note {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  color: rgba(70, 120, 155, 0.65);
  line-height: 1.45;
  margin: 3px 0 2px;
  padding: 2px 0;
  border-top: 1px solid rgba(0, 50, 90, 0.18);
}
.pip-climate-note--binary {
  color: rgba(255, 210, 100, 0.70);
  border-top-color: rgba(200, 150, 40, 0.20);
}

/* ── Primary claim button (THIS PLANET) ──────────────────────── */
.pip-claim-primary {
  display: block;
  width: 100%;
  margin-top: 7px;
  padding: 5px 0;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.10em;
  color: rgba(0, 200, 230, 0.85);
  background: rgba(0, 50, 90, 0.45);
  border: 1px solid rgba(0, 160, 210, 0.35);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, border-color 0.14s;
  text-align: center;
}
.pip-claim-primary:hover {
  background: rgba(0, 90, 140, 0.60);
  color: #00e5ff;
  border-color: rgba(0, 200, 255, 0.55);
}
.pip-claim-primary--manage {
  color: rgba(100, 220, 180, 0.90);
  background: rgba(0, 60, 50, 0.45);
  border-color: rgba(60, 200, 160, 0.38);
}
.pip-claim-primary--manage:hover {
  background: rgba(0, 100, 80, 0.55);
  color: #00ffcc;
  border-color: rgba(80, 240, 190, 0.55);
}

/* ── Planet chip grid ─────────────────────────────────────────── */
.pip-section--chips { padding-bottom: 8px; }

.pip-chips-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin-top: 5px;
}

.pip-chip {
  background: rgba(0, 20, 50, 0.50);
  border: 1px solid rgba(0, 100, 160, 0.22);
  border-radius: 4px;
  padding: 5px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.pip-chip:not(.pip-chip--here) .ppc-head { cursor: pointer; }
.pip-chip:not(.pip-chip--here):hover { border-color: rgba(0, 180, 220, 0.40); }
.pip-chip--here {
  border-color: rgba(0, 200, 255, 0.35);
  background: rgba(0, 40, 70, 0.55);
}

.ppc-head { display: flex; align-items: center; gap: 4px; }

.ppc-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.ppc-name {
  font-size: 8px;
  color: rgba(180, 210, 235, 0.82);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.ppc-here { font-size: 8px; color: rgba(0, 200, 255, 0.65); }

.ppc-au { font-size: 7px; color: rgba(70, 115, 150, 0.55); }

.ppc-claim {
  width: 100%;
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.10em;
  color: rgba(0, 180, 220, 0.75);
  background: rgba(0, 60, 100, 0.35);
  border: 1px solid rgba(0, 140, 190, 0.30);
  border-radius: 3px;
  padding: 2px 0;
  cursor: pointer;
  text-align: center;
  transition: background 0.12s, color 0.12s;
}
.ppc-claim:hover { background: rgba(0, 100, 160, 0.50); color: #00e5ff; }
.ppc-claim--has  { color: rgba(80, 210, 170, 0.80); border-color: rgba(60,180,140,0.30); }
.ppc-claim--has:hover { background: rgba(0, 90, 70, 0.50); color: #00ffcc; }

/* ── Moon pulldown ─────────────────────────────────────────────── */
.pip-moon-section { padding-bottom: 0; }

.pip-moon-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 2px 0 4px;
}
.pip-moon-header:hover .pip-section-label { color: rgba(0, 200, 240, 0.70); }

.pip-moon-list { padding-top: 2px; }

.pip-moon-entry {
  padding: 5px 0;
  border-top: 1px solid rgba(0, 50, 90, 0.22);
}

.pme-label {
  font-size: 8px;
  color: rgba(160, 200, 230, 0.75);
  margin-bottom: 4px;
}
.pme-of { font-size: 7px; color: rgba(80, 120, 155, 0.55); margin-left: 4px; }

.pme-claims { display: flex; gap: 3px; }

.pme-claim {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.04em;
  padding: 2px 2px;
  border-radius: 3px;
  border: 1px solid;
  cursor: pointer;
  text-align: center;
  transition: filter 0.12s;
}
.pme-claim--l4 { color: rgba(80, 220, 130, 0.85); border-color: rgba(60, 200, 100, 0.30); background: rgba(0, 70, 35, 0.25); }
.pme-claim--l5 { color: rgba(160, 130, 210, 0.85); border-color: rgba(140, 100, 190, 0.30); background: rgba(40, 0, 80, 0.25); }
.pme-claim--l6 { color: rgba(200, 160, 80, 0.85);  border-color: rgba(180, 130, 50, 0.30);  background: rgba(60, 30, 0, 0.25); }
.pme-claim:hover { filter: brightness(1.35); }

/* Expand transition */
.pip-expand-enter-active { transition: max-height 0.22s ease, opacity 0.18s; max-height: 70vh; }
.pip-expand-leave-active  { transition: max-height 0.18s ease, opacity 0.14s; }
.pip-expand-enter-from,
.pip-expand-leave-to      { max-height: 0; opacity: 0; }

.surface-legend { position: absolute; bottom: 150px; left: 12px; display: none; }
.surface-controls {
  position: absolute; bottom: 92px; left: 50%; transform: translateX(-50%);
  white-space: nowrap; background: rgba(2, 6, 18, 0.8); border-radius: 6px;
}

.celestial-tooltip {
  position: fixed; max-width: 260px; pointer-events: none; z-index: 10;
  background: rgba(2, 6, 18, 0.9); border: 1px solid rgba(49, 204, 236, 0.25); border-radius: 4px;
}
.loading-overlay { position: absolute; inset: 0; background: rgba(2, 4, 8, 0.85); z-index: 20; }

.transit-card {
  background: rgba(3, 8, 20, 0.97);
  border: 1px solid rgba(0, 180, 220, 0.2);
  border-radius: 10px 10px 0 0;
  color: #c0d0e0;
}

.dest-item {
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 120, 180, 0.15);
  transition: background 0.15s;
}
.dest-item:hover { background: rgba(0, 60, 100, 0.5); }

.routing-badge {
  font-family: monospace; font-size: 10px; letter-spacing: 0.05em;
  padding: 2px 6px; border-radius: 3px;
}
.routing-direct { background: rgba(0, 180, 100, 0.2); color: #44ffaa; }
.routing-local  { background: rgba(0, 100, 200, 0.2); color: #66aaff; }
.routing-far    { background: rgba(100, 0, 200, 0.2); color: #bb88ff; }

.legend-dot { display: inline-block; border-radius: 50%; flex-shrink: 0; }

/* ── Chronometer panel ──────────────────────────────────────────────────── */
.chrono-panel {
  position: absolute;
  bottom: 142px;
  left: 50%;
  transform: translateX(-50%);
  width: 270px;
  background: rgba(2, 6, 18, 0.94);
  border: 1px solid rgba(0, 180, 220, 0.22);
  border-radius: 6px;
  backdrop-filter: blur(8px);
  z-index: 6;
  font-family: monospace;
}
.chrono-header { border-bottom: 1px solid rgba(0, 80, 120, 0.25); padding-bottom: 4px; margin-bottom: 6px; }
.chrono-title-text { font-size: 9px; letter-spacing: 0.1em; color: rgba(0, 200, 240, 0.8); }

.chrono-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}
.chrono-label { font-size: 8px; color: rgba(80, 130, 160, 0.85); letter-spacing: 0.06em; }
.chrono-value { font-size: 11px; color: rgba(180, 220, 245, 0.9); letter-spacing: 0.06em; }
.chrono-value.eat   { color: rgba(255, 200, 100, 0.9); }
.chrono-value.phase { color: rgba(120, 200, 180, 0.9); font-size: 10px; }

.chrono-section-label { font-size: 8px; letter-spacing: 0.08em; color: rgba(60, 110, 145, 0.85); }

.event-row { padding: 3px 0; border-bottom: 1px solid rgba(0, 50, 80, 0.3); }
.event-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.event-name { font-size: 9px; color: rgba(160, 210, 235, 0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.event-detail { font-size: 8px; color: rgba(80, 120, 150, 0.85); padding-left: 15px; }
.event-sep { color: rgba(40, 80, 110, 0.7); margin: 0 3px; }

.chrono-hint { font-size: 8px; color: rgba(60, 100, 130, 0.8); letter-spacing: 0.04em; }

/* ── Community presence indicator ──────────────────────────────────────── */
.presence-indicator {
  position: absolute;
  bottom: 152px;
  right: 12px;
  background: rgba(0, 15, 30, 0.78);
  border: 1px solid rgba(0, 120, 180, 0.18);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.presence-indicator:hover { border-color: rgba(0, 180, 240, 0.35); }
.presence-dot {
  width: 7px; height: 7px; border-radius: 50%;
  display: inline-block; flex-shrink: 0;
  box-shadow: 0 0 4px currentColor;
}
.presence-label {
  font-size: 9px; font-family: monospace;
  color: rgba(80, 140, 170, 0.85); letter-spacing: 0.05em;
}

/* ── Help panel ─────────────────────────────────────────────────────────── */
.help-panel {
  position: absolute;
  top: 0; right: 0; bottom: 0;
  width: 300px;
  max-width: 88vw;
  background: rgba(1, 5, 18, 0.97);
  border-left: 1px solid rgba(0, 180, 220, 0.18);
  backdrop-filter: blur(12px);
  z-index: 20;
  overflow-y: auto;
  font-family: monospace;
}

.help-section-title {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: rgba(0, 200, 240, 0.75);
  text-transform: uppercase;
}
.help-body {
  font-size: 10px;
  color: rgba(140, 180, 205, 0.85);
  line-height: 1.55;
}
.help-accent {
  color: rgba(180, 230, 255, 0.95);
  font-weight: 600;
}
.help-note {
  font-size: 9px;
  color: rgba(80, 130, 155, 0.78);
  font-style: italic;
  line-height: 1.5;
}
.help-code {
  font-size: 9px;
  color: rgba(0, 200, 240, 0.6);
  letter-spacing: 0.04em;
  background: rgba(0, 40, 60, 0.4);
  border-radius: 3px;
  padding: 3px 7px;
}
.help-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.help-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 3px;
  box-shadow: 0 0 5px currentColor;
}
.help-ctrl-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Help panel slide transition ─────────────────────────────────────── */
.help-slide-enter-active,
.help-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
.help-slide-enter-from,
.help-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ── Wormhole key panel (DK.MAT mode) ──────────────────────────── */

.wormhole-key {
  position: fixed;
  bottom: 90px;
  left: 14px;
  z-index: 7;
  width: 268px;
  background: rgba(20, 5, 40, 0.94);
  border: 1px solid rgba(180, 80, 255, 0.35);
  border-radius: 7px;
  padding: 10px 12px;
  font-family: 'Courier New', monospace;
  backdrop-filter: blur(10px);
}

.wk-header {
  font-size: 8px;
  letter-spacing: 0.14em;
  color: rgba(200, 120, 255, 0.80);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.wk-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}

.wk-glyph {
  font-size: 16px;
  flex-shrink: 0;
  width: 22px;
  text-align: center;
  line-height: 1.2;
}

.wk-pyramid { color: rgba(200, 120, 255, 0.9); }
.wk-conduit { color: rgba(0, 229, 255, 0.9); }
.wk-dome    { color: rgba(0, 200, 220, 0.9); }

.wk-label {
  font-size: 9px;
  letter-spacing: 0.06em;
  color: rgba(200, 180, 240, 0.85);
  margin-bottom: 2px;
}

.wk-desc {
  font-size: 7px;
  color: rgba(140, 110, 190, 0.65);
  letter-spacing: 0.03em;
  line-height: 1.45;
}

.wk-note {
  font-size: 7px;
  color: rgba(160, 100, 220, 0.55);
  letter-spacing: 0.04em;
  border-top: 1px solid rgba(180, 80, 255, 0.18);
  padding-top: 7px;
  margin-top: 4px;
  line-height: 1.55;
}

/* ════════════════════════════════════════════════════════════════
   X-RAY THERMAL BINARY VISION — overlays + canvas filter
   ════════════════════════════════════════════════════════════════ */

/* Canvas filter — applied via :class binding; transition in JS */
:deep(.canvas--xray) {
  /* CSS filter is set via viz.canvas.style.filter in the script.
     This class exists for any additional canvas-level overrides. */
}

/* All X-RAY overlays sit in one container above the canvas */
.xray-overlays {
  position: fixed;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  user-select: none;
}

/* ── Scan lines ────────────────────────────────────────────────── */

.xray-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.00) 0px,
    rgba(0, 0, 0, 0.00) 3px,
    rgba(0, 0, 0, 0.14) 3px,
    rgba(0, 0, 0, 0.14) 4px
  );
}

/* ── Edge vignette ─────────────────────────────────────────────── */

.xray-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 90% 85% at 50% 50%,
    transparent 55%,
    rgba(40, 0, 0, 0.55) 100%
  );
}

/* ── Corner sensor brackets ────────────────────────────────────── */

.xray-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: rgba(255, 60, 0, 0.65);
  border-style: solid;
}

.xray-corner--tl { top: 14px; left: 14px; border-width: 2px 0 0 2px; }
.xray-corner--tr { top: 14px; right: 14px; border-width: 2px 2px 0 0; }
.xray-corner--bl { bottom: 92px; left: 14px; border-width: 0 0 2px 2px; }
.xray-corner--br { bottom: 92px; right: 14px; border-width: 0 2px 2px 0; }

/* ── Sensor mode label ─────────────────────────────────────────── */

.xray-mode-label {
  position: absolute;
  top: 56px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.22em;
  color: rgba(255, 80, 20, 0.70);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.xray-blink {
  animation: xray-blink 1.2s step-start infinite;
  font-size: 10px;
}

@keyframes xray-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* ── Thermal scale bar (left side, vertical) ───────────────────── */

.xray-scale {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.xray-scale-title {
  font-family: 'Courier New', monospace;
  font-size: 6px;
  letter-spacing: 0.16em;
  color: rgba(255, 80, 20, 0.55);
  margin-bottom: 3px;
}

.xray-scale-bar {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border: 1px solid rgba(255, 60, 0, 0.25);
  border-radius: 2px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.55);
}

.xray-scale-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 1px 4px 1px 0;
}

.xray-scale-label {
  font-family: 'Courier New', monospace;
  font-size: 6px;
  color: rgba(255, 120, 60, 0.65);
  letter-spacing: 0.04em;
  min-width: 34px;
  text-align: right;
}

.xray-scale-swatch {
  width: 20px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 1px;
}

.xray-scale-note {
  font-family: 'Courier New', monospace;
  font-size: 6px;
  color: rgba(180, 60, 20, 0.45);
  letter-spacing: 0.06em;
  margin-top: 3px;
}

/* ── Log distance ruler (right side, vertical) ─────────────────── */

.xray-ruler {
  position: absolute;
  top: 80px;
  right: 52px;
  bottom: 100px;
  width: 55px;
  border-left: 1px solid rgba(255, 60, 0, 0.20);
}

.xray-ruler-title {
  position: absolute;
  top: -16px;
  right: 0;
  font-family: 'Courier New', monospace;
  font-size: 6px;
  letter-spacing: 0.14em;
  color: rgba(255, 80, 20, 0.45);
}

.xray-ruler-tick {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  transform: translateY(-50%);
}

.xray-ruler-label {
  font-family: 'Courier New', monospace;
  font-size: 6px;
  color: rgba(255, 100, 40, 0.55);
  letter-spacing: 0.04em;
  text-align: right;
  min-width: 38px;
}

.xray-ruler-line {
  width: 8px;
  height: 1px;
  background: rgba(255, 60, 0, 0.40);
}

/* ── Fade transition ───────────────────────────────────────────── */

.xray-fade-enter-active { transition: opacity 0.5s ease; }
.xray-fade-leave-active { transition: opacity 0.4s ease; }
.xray-fade-enter-from,
.xray-fade-leave-to     { opacity: 0; }

/* ── Thermal lens HUD badge ────────────────────────────────────── */

.thermal-lens-hud {
  position:        fixed;
  top:             52px;
  right:           12px;
  display:         flex;
  align-items:     center;
  gap:             5px;
  background:      rgba(80, 30, 0, 0.58);
  border:          1px solid rgba(220, 100, 20, 0.38);
  border-radius:   4px;
  padding:         3px 9px;
  pointer-events:  none;
  z-index:         20;
  backdrop-filter: blur(4px);
}

.tlh-icon {
  font-size:   11px;
  color:       #ff8833;
  line-height: 1;
}

.tlh-label {
  font-family:     'Courier New', monospace;
  font-size:       9px;
  font-weight:     600;
  letter-spacing:  0.14em;
  color:           rgba(255, 140, 50, 0.90);
  text-transform:  uppercase;
}

.tlh-sep {
  color: rgba(180, 80, 20, 0.55);
  font-size: 9px;
}

.tlh-temp {
  font-family:  'Courier New', monospace;
  font-size:    9px;
  color:        rgba(255, 180, 90, 0.80);
  letter-spacing: 0.06em;
}

/* ── Mule / soul orb interaction panel ────────────────────────── */

.mule-panel {
  position:        fixed;
  bottom:          72px;
  right:           12px;
  min-width:       220px;
  max-width:       280px;
  background:      rgba(8, 16, 28, 0.88);
  border:          1px solid rgba(100, 180, 255, 0.22);
  border-radius:   6px;
  backdrop-filter: blur(8px);
  z-index:         25;
}

.mule-panel-header {
  border-bottom: 1px solid rgba(80, 140, 200, 0.15);
  padding-bottom: 6px;
  margin-bottom:  6px;
}

.mule-orb-dot {
  width:         10px;
  height:        10px;
  border-radius: 50%;
  flex-shrink:   0;
  box-shadow:    0 0 6px currentColor;
}

.mule-name {
  font-size:      13px;
  font-weight:    600;
  color:          #d8e8f8;
  letter-spacing: 0.02em;
}

.mule-type {
  font-family:    'Courier New', monospace;
  font-size:      9px;
  color:          rgba(120, 200, 255, 0.70);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom:  6px;
}

.mule-detail-row {
  display:         flex;
  justify-content: space-between;
  gap:             8px;
  margin-bottom:   3px;
}

.mule-detail-key {
  font-size:  10px;
  color:      rgba(140, 160, 180, 0.70);
  flex-shrink: 0;
}

.mule-detail-val {
  font-size:  10px;
  color:      rgba(200, 220, 240, 0.88);
  text-align: right;
}

.mule-actions {
  border-top:  1px solid rgba(80, 140, 200, 0.12);
  padding-top: 6px;
}

/* ── Entry approach HUD ────────────────────────────────────────── */

.entry-hud {
  position:  fixed;
  inset:     0;
  pointer-events: none;
  z-index:   30;
}

/* Corner bracket markers */
.eh-corner {
  position:  absolute;
  width:     22px;
  height:    22px;
  border-color: rgba(80, 200, 255, 0.45);
  border-style: solid;
}
.eh-corner--tl { top: 52px; left: 10px;  border-width: 2px 0 0 2px; }
.eh-corner--tr { top: 52px; right: 10px; border-width: 2px 2px 0 0; }
.eh-corner--bl { bottom: 10px; left: 10px;  border-width: 0 0 2px 2px; }
.eh-corner--br { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; }

.eh-top {
  position:       absolute;
  top:            56px;
  left:           50%;
  transform:      translateX(-50%);
  display:        flex;
  align-items:    center;
  gap:            8px;
  background:     rgba(4, 12, 24, 0.62);
  border:         1px solid rgba(60, 160, 255, 0.28);
  border-radius:  3px;
  padding:        4px 14px;
}

.eh-bottom {
  position:       absolute;
  bottom:         14px;
  left:           50%;
  transform:      translateX(-50%);
  display:        flex;
  align-items:    center;
  gap:            8px;
  background:     rgba(4, 12, 24, 0.55);
  border:         1px solid rgba(60, 160, 255, 0.20);
  border-radius:  3px;
  padding:        3px 12px;
}

.eh-label {
  font-family:    'Courier New', monospace;
  font-size:      9px;
  font-weight:    700;
  letter-spacing: 0.18em;
  color:          rgba(80, 200, 255, 0.90);
  text-transform: uppercase;
}

.eh-planet {
  font-family:    'Courier New', monospace;
  font-size:      11px;
  font-weight:    400;
  letter-spacing: 0.08em;
  color:          rgba(200, 230, 255, 0.92);
}

.eh-sys {
  font-family:    'Courier New', monospace;
  font-size:      9px;
  color:          rgba(120, 180, 255, 0.75);
  letter-spacing: 0.08em;
}

.eh-mode {
  font-family:    'Courier New', monospace;
  font-size:      9px;
  letter-spacing: 0.14em;
  color:          rgba(80, 200, 255, 0.80);
  text-transform: uppercase;
}

.eh-sep {
  color:          rgba(60, 130, 200, 0.50);
  font-size:      9px;
}

.eh-blink {
  color:    rgba(80, 200, 255, 0.90);
  font-size: 9px;
  animation: blink-pulse 0.9s step-end infinite;
}

@keyframes blink-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

</style>
