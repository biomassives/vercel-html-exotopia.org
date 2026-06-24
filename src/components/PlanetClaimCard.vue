<template>
  <div class="pcc-root">

    <!-- ── Twin-format hero ──────────────────────────────────────────────── -->
    <div class="pcc-diptych">

      <!-- ━━━━ CARD A — ORBITAL CARTOGRAPH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
      <div class="pcc-cartograph">
        <!-- HUD corner brackets -->
        <span class="hud-corner hud-corner--tl"/>
        <span class="hud-corner hud-corner--tr"/>
        <span class="hud-corner hud-corner--bl"/>
        <span class="hud-corner hud-corner--br"/>

        <!-- HUD data overlays -->
        <div class="hud-band hud-band--top">
          <span class="hud-tag">PLANETARY SURFACE CLAIM</span>
          <span class="hud-coord">{{ coordLabel }}</span>
          <span class="hud-tag hud-tag--right">{{ planetName }}</span>
        </div>

        <!-- Main map SVG -->
        <svg class="pcc-map" viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet">
          <defs>
            <!-- Mule knowledge sphere gradient -->
            <radialGradient id="mule-sphere" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stop-color="#ff9020" stop-opacity="0.18"/>
              <stop offset="60%"  stop-color="#ff6010" stop-opacity="0.08"/>
              <stop offset="100%" stop-color="#ff4000" stop-opacity="0.00"/>
            </radialGradient>
            <!-- Selected cell glow -->
            <filter id="plot-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <!-- Background -->
          <rect x="0" y="0" width="360" height="180" fill="rgba(1,3,14,0.99)"/>

          <!-- Climate zone background for all cells -->
          <g v-for="r in 18" :key="'mr'+r">
            <rect
              v-for="c in 36" :key="'mc'+c"
              :x="(c-1)*10" :y="(r-1)*10"
              width="9.6" height="9.6" rx="0.4"
              :fill="bgCellFill(r-1, c-1)"
              :opacity="isNearSelected(r-1,c-1) ? 1.0 : 0.28"
            />
          </g>

          <!-- Grid reference lines every 30° -->
          <g stroke="rgba(50,110,170,0.22)" stroke-width="0.35" fill="none">
            <line v-for="x in [30,60,90,120,150,180,210,240,270,300,330]"
              :key="'gl'+x" :x1="x" y1="0" :x2="x" y2="180"/>
            <line v-for="y in [30,60,90,120,150]"
              :key="'gla'+y" x1="0" :y1="y" x2="360" :y2="y"/>
          </g>

          <!-- Prime meridian + equator -->
          <line x1="180" y1="0" x2="180" y2="180"
            stroke="rgba(0,200,255,0.38)" stroke-width="0.8"/>
          <line x1="0" y1="90" x2="360" y2="90"
            stroke="rgba(0,200,255,0.20)" stroke-width="0.5"/>

          <!-- Tidally-locked terminator lines -->
          <template v-if="isLocked">
            <line x1="90" y1="0" x2="90" y2="180"
              stroke="rgba(0,200,230,0.35)" stroke-width="0.7" stroke-dasharray="3,2"/>
            <line x1="270" y1="0" x2="270" y2="180"
              stroke="rgba(0,200,230,0.35)" stroke-width="0.7" stroke-dasharray="3,2"/>
            <circle cx="180" cy="90" r="4" fill="rgba(255,220,50,0.50)"/>
          </template>

          <!-- Mule knowledge sphere — 20° radius influence zone -->
          <ellipse
            :cx="selX + 5" :cy="selY + 5"
            :rx="22" :ry="22"
            fill="url(#mule-sphere)"
          />
          <!-- Mule sphere outer ring pulse -->
          <circle :cx="selX + 5" :cy="selY + 5" r="22"
            fill="none" stroke="rgba(255,140,20,0.22)" stroke-width="0.7"
            stroke-dasharray="4,3">
            <animateTransform attributeName="transform" type="rotate"
              :from="`0 ${selX+5} ${selY+5}`" :to="`360 ${selX+5} ${selY+5}`"
              dur="18s" repeatCount="indefinite"/>
          </circle>
          <circle :cx="selX + 5" :cy="selY + 5" r="15"
            fill="none" stroke="rgba(255,100,10,0.18)" stroke-width="0.5"
            stroke-dasharray="2,4">
            <animateTransform attributeName="transform" type="rotate"
              :from="`360 ${selX+5} ${selY+5}`" :to="`0 ${selX+5} ${selY+5}`"
              dur="12s" repeatCount="indefinite"/>
          </circle>

          <!-- Selected plot cell -->
          <g filter="url(#plot-glow)">
            <rect :x="selX" :y="selY" width="9.6" height="9.6" rx="0.8"
              fill="rgba(255,80,30,0.55)"
              stroke="rgba(255,120,40,0.95)" stroke-width="1.2"/>
          </g>
          <!-- Outer glow rings on selected cell -->
          <rect :x="selX-3" :y="selY-3" width="15.6" height="15.6" rx="2"
            fill="none" stroke="rgba(255,100,30,0.45)" stroke-width="0.8">
            <animate attributeName="opacity" values="0.45;0.15;0.45" dur="2.4s" repeatCount="indefinite"/>
          </rect>
          <rect :x="selX-7" :y="selY-7" width="23.6" height="23.6" rx="3"
            fill="none" stroke="rgba(255,80,20,0.22)" stroke-width="0.5">
            <animate attributeName="opacity" values="0.22;0.06;0.22" dur="3.2s" repeatCount="indefinite"/>
          </rect>

          <!-- Mule emblem in selected cell -->
          <text :x="selX+4.8" :y="selY+7"
            font-size="6" text-anchor="middle" fill="rgba(255,220,100,0.90)">⬡</text>

          <!-- Coordinate crosshairs -->
          <line :x1="selX+5" y1="0" :x2="selX+5" :y2="selY"
            stroke="rgba(255,100,30,0.20)" stroke-width="0.5" stroke-dasharray="2,3"/>
          <line :x1="selX+5" :y1="selY+10" :x2="selX+5" y2="180"
            stroke="rgba(255,100,30,0.20)" stroke-width="0.5" stroke-dasharray="2,3"/>
          <line x1="0" :y1="selY+5" :x2="selX" :y2="selY+5"
            stroke="rgba(255,100,30,0.20)" stroke-width="0.5" stroke-dasharray="2,3"/>
          <line :x1="selX+10" :y1="selY+5" x2="360" :y2="selY+5"
            stroke="rgba(255,100,30,0.20)" stroke-width="0.5" stroke-dasharray="2,3"/>

          <!-- Corner labels -->
          <text x="3"  y="8"   font-size="3.8" fill="rgba(0,190,255,0.40)">90°N · 180°W</text>
          <text x="305" y="8"  font-size="3.8" fill="rgba(0,190,255,0.40)">90°N · 180°E</text>
          <text x="3"  y="178" font-size="3.8" fill="rgba(0,190,255,0.40)">90°S · 180°W</text>
          <text x="305" y="178" font-size="3.8" fill="rgba(0,190,255,0.40)">90°S · 180°E</text>
        </svg>

        <!-- HUD lower band -->
        <div class="hud-band hud-band--bot">
          <span class="hud-zone">{{ zoneName }}</span>
          <span class="hud-climate" :class="`hud-climate--${climateClass}`">
            {{ climateDesc }}
          </span>
          <span class="hud-addr">{{ exolocAddr }}</span>
        </div>
      </div>

      <!-- ━━━━ CARD B — SETTLEMENT DEED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
      <div class="pcc-deed-wrap">
        <svg class="pcc-deed" viewBox="0 0 280 392" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- Card background -->
            <linearGradient id="deed-bg" x1="0" y1="0" x2="0.2" y2="1">
              <stop offset="0%"   :stop-color="planetHex" stop-opacity="0.18"/>
              <stop offset="30%"  stop-color="#040210"    stop-opacity="1"/>
              <stop offset="100%" stop-color="#020108"    stop-opacity="1"/>
            </linearGradient>
            <!-- Planet disc gradient -->
            <radialGradient :id="`deed-planet`" cx="38%" cy="32%" r="68%">
              <stop offset="0%"   :stop-color="planetHex" stop-opacity="0.95"/>
              <stop offset="55%"  :stop-color="planetHex" stop-opacity="0.75"/>
              <stop offset="100%" stop-color="#000308"    stop-opacity="0.92"/>
            </radialGradient>
            <clipPath id="deed-disc-clip">
              <circle cx="140" cy="118" r="68"/>
            </clipPath>
            <!-- HZ radial gradient -->
            <radialGradient id="hz-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stop-color="#44ee99" stop-opacity="0.0"/>
              <stop offset="60%"  stop-color="#44ee99" stop-opacity="0.12"/>
              <stop offset="100%" stop-color="#44ee99" stop-opacity="0.0"/>
            </radialGradient>
            <!-- Mule emblem glow -->
            <radialGradient id="mule-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stop-color="#ff9020" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#ff6010" stop-opacity="0.0"/>
            </radialGradient>
            <!-- Mule fur gradient -->
            <radialGradient id="mc-fur-d" cx="45%" cy="35%" r="65%">
              <stop offset="0%"   stop-color="#e0a060"/>
              <stop offset="65%"  stop-color="#c88040"/>
              <stop offset="100%" stop-color="#a86030"/>
            </radialGradient>
            <radialGradient id="mc-muzz-d" cx="50%" cy="40%" r="55%">
              <stop offset="0%"   stop-color="#f0d0a0"/>
              <stop offset="100%" stop-color="#d0a870"/>
            </radialGradient>
            <radialGradient id="mc-ear-d" cx="50%" cy="60%" r="60%">
              <stop offset="0%"   stop-color="#ffb0a0"/>
              <stop offset="100%" stop-color="#e08070"/>
            </radialGradient>
            <!-- Mule face as reusable symbol centred at 0,0 in a 64×64 vb -->
            <symbol id="mule-face" viewBox="-32 -32 32 32">
              <!-- ears behind -->
              <g transform="rotate(-14,-14,-26)">
                <ellipse cx="-14" cy="-24" rx="5" ry="10" fill="url(#mc-fur-d)"/>
                <ellipse cx="-14" cy="-23" rx="2.8" ry="7" fill="url(#mc-ear-d)" opacity="0.90"/>
              </g>
              <g transform="rotate(14,14,-26)">
                <ellipse cx="14" cy="-24" rx="5" ry="10" fill="url(#mc-fur-d)"/>
                <ellipse cx="14" cy="-23" rx="2.8" ry="7" fill="url(#mc-ear-d)" opacity="0.90"/>
              </g>
              <!-- head -->
              <rect x="-18" y="-17" width="36" height="34" rx="13" fill="url(#mc-fur-d)"/>
              <!-- mane -->
              <path d="M -4 -16 C -6 -24 -2 -27 0 -25 C 2 -27 6 -24 4 -16 Z" fill="#9a6020"/>
              <!-- eyes -->
              <ellipse cx="-9" cy="-1" rx="7" ry="6" fill="white"/>
              <ellipse cx="9"  cy="-1" rx="7" ry="6" fill="white"/>
              <circle cx="-9" cy="-1" r="4" fill="#5a3010"/>
              <circle cx="9"  cy="-1" r="4" fill="#5a3010"/>
              <circle cx="-9" cy="-1" r="2.5" fill="#1e0c04"/>
              <circle cx="9"  cy="-1" r="2.5" fill="#1e0c04"/>
              <circle cx="-7.5" cy="-2.5" r="1.2" fill="rgba(255,255,255,0.88)"/>
              <circle cx="10.5" cy="-2.5" r="1.2" fill="rgba(255,255,255,0.88)"/>
              <path d="M -15 -4 Q -9 -8 -3 -4" fill="none" stroke="#7a4818" stroke-width="1.0" stroke-linecap="round"/>
              <path d="M 3 -4 Q 9 -8 15 -4"   fill="none" stroke="#7a4818" stroke-width="1.0" stroke-linecap="round"/>
              <!-- muzzle -->
              <ellipse cx="0" cy="12" rx="12" ry="9" fill="url(#mc-muzz-d)"/>
              <ellipse cx="-4" cy="14" rx="2.5" ry="1.5" fill="#9a6028" fill-opacity="0.65"/>
              <ellipse cx="4"  cy="14" rx="2.5" ry="1.5" fill="#9a6028" fill-opacity="0.65"/>
              <!-- smile -->
              <path d="M -7 18 Q 0 23 7 18" stroke="#9a6028" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </symbol>
            <!-- Shimmer -->
            <linearGradient id="deed-shimmer" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stop-color="rgba(255,255,255,0.07)"/>
              <stop offset="45%"  stop-color="rgba(255,255,255,0.02)"/>
              <stop offset="55%"  stop-color="rgba(255,255,255,0.07)"/>
              <stop offset="100%" stop-color="rgba(255,255,255,0.01)"/>
            </linearGradient>
          </defs>

          <!-- Card body -->
          <rect x="0" y="0" width="280" height="392" rx="10" fill="url(#deed-bg)"/>
          <!-- Shimmer overlay -->
          <rect x="0" y="0" width="280" height="392" rx="10" fill="url(#deed-shimmer)"/>

          <!-- Outer decorative border -->
          <rect x="6" y="6" width="268" height="380" rx="7"
            fill="none" :stroke="planetHex" stroke-width="0.6" stroke-opacity="0.28"/>
          <rect x="10" y="10" width="260" height="372" rx="5"
            fill="none" stroke="rgba(0,180,220,0.14)" stroke-width="0.4"/>

          <!-- Corner ornaments (L-brackets) -->
          <g :stroke="planetHex" stroke-width="1.2" stroke-opacity="0.55" fill="none">
            <polyline points="18,28 18,18 28,18"/>
            <polyline points="252,18 262,18 262,28"/>
            <polyline points="18,364 18,374 28,374"/>
            <polyline points="252,374 262,374 262,364"/>
          </g>

          <!-- Header -->
          <text x="140" y="36" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="7.5"
            fill="rgba(0,200,240,0.55)" letter-spacing="0.22">EXOLOCATION DEED</text>
          <line x1="26" y1="42" x2="254" y2="42"
            stroke="rgba(0,160,200,0.22)" stroke-width="0.5"/>

          <!-- Planet disc -->
          <circle cx="140" cy="118" r="68" fill="url(#deed-planet)"/>

          <!-- Latitude parallels on disc -->
          <g clip-path="url(#deed-disc-clip)" fill="none" stroke-width="0.4">
            <ellipse cx="140" cy="118" rx="68" ry="1.5"
              stroke="rgba(255,255,255,0.22)"/>
            <ellipse cx="140" cy="84" rx="59" ry="4"
              stroke="rgba(255,255,255,0.09)"/>
            <ellipse cx="140" cy="152" rx="59" ry="4"
              stroke="rgba(255,255,255,0.09)"/>
          </g>

          <!-- Meridians on disc -->
          <g clip-path="url(#deed-disc-clip)" fill="none"
            stroke="rgba(255,255,255,0.06)" stroke-width="0.4">
            <ellipse cx="140" cy="118" rx="48" ry="68" transform="rotate(45,140,118)"/>
            <ellipse cx="140" cy="118" rx="48" ry="68" transform="rotate(-45,140,118)"/>
          </g>

          <!-- Prime meridian on disc -->
          <line x1="140" y1="50" x2="140" y2="186"
            clip-path="url(#deed-disc-clip)"
            stroke="rgba(0,220,255,0.45)" stroke-width="0.8" stroke-dasharray="4,2.5"/>

          <!-- Night-side overlay for locked -->
          <path v-if="isLocked"
            d="M 140 50 A 68 68 0 0 0 140 186"
            clip-path="url(#deed-disc-clip)"
            fill="rgba(0,0,20,0.42)"/>

          <!-- HZ band on disc -->
          <template v-for="hz in hzBands" :key="hz.cy">
            <ellipse :cx="140" :cy="118 + hz.cy" :rx="68 * hz.cosLat" ry="4"
              clip-path="url(#deed-disc-clip)"
              :fill="hz.color" :fill-opacity="hz.opacity"/>
          </template>

          <!-- Plot dot on disc — orthographic projection of lat/lon -->
          <circle v-if="discDot"
            :cx="140 + discDot.x" :cy="118 - discDot.y"
            r="4" fill="rgba(255,70,20,0.85)">
            <animate attributeName="r" values="4;5.5;4" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.85;0.50;0.85" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle v-if="discDot"
            :cx="140 + discDot.x" :cy="118 - discDot.y"
            r="9" fill="none" stroke="rgba(255,80,20,0.35)" stroke-width="0.7">
            <animate attributeName="r" values="9;13;9" dur="2.4s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.35;0.10;0.35" dur="2.4s" repeatCount="indefinite"/>
          </circle>

          <!-- Atmosphere ring -->
          <circle cx="140" cy="118" r="72"
            fill="none" :stroke="planetHex" stroke-width="3" stroke-opacity="0.12"/>

          <!-- ── Deed body ─────────────────────────────────────────────── -->

          <line x1="26" y1="194" x2="254" y2="194"
            stroke="rgba(0,140,190,0.18)" stroke-width="0.5"/>

          <!-- "40 ACRES" -->
          <text x="140" y="214" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="21" font-weight="700"
            fill="rgba(230,245,255,0.92)" letter-spacing="0.06">40 ACRES</text>
          <text x="140" y="228" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="9.5"
            fill="rgba(150,200,230,0.60)" letter-spacing="0.20">&amp; A MULE</text>

          <line x1="60" y1="236" x2="220" y2="236"
            stroke="rgba(0,140,190,0.14)" stroke-width="0.4"/>

          <!-- Coordinates -->
          <text x="140" y="251" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="12.5"
            fill="rgba(0,220,255,0.85)" letter-spacing="0.10">{{ coordLabel }}</text>

          <!-- Zone name -->
          <text x="140" y="264" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="7.5"
            fill="rgba(160,200,225,0.68)" letter-spacing="0.08">{{ zoneName }}</text>

          <!-- Climate badge -->
          <rect x="98" y="270" width="84" height="13" rx="3"
            :fill="climateFill" fill-opacity="0.22"
            :stroke="climateFill" stroke-width="0.5" stroke-opacity="0.45"/>
          <text x="140" y="280" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="7"
            :fill="climateFill" fill-opacity="0.88" letter-spacing="0.10">{{ climateDesc }}</text>

          <line x1="26" y1="290" x2="254" y2="290"
            stroke="rgba(0,140,190,0.14)" stroke-width="0.4"/>

          <!-- Mule emblem — the creature itself -->
          <!-- Background glow disc -->
          <circle cx="140" cy="310" r="22" fill="url(#mule-glow)"/>
          <!-- Rotating orbit ring -->
          <circle cx="140" cy="310" r="22"
            fill="none" stroke="rgba(200,140,40,0.28)" stroke-width="0.7"
            stroke-dasharray="4,3">
            <animateTransform attributeName="transform" type="rotate"
              from="0 140 310" to="360 140 310"
              dur="20s" repeatCount="indefinite"/>
          </circle>
          <!-- The mule face, scaled to fit in a ~44px circle -->
          <!-- symbol viewBox is "-32 -32 64 64"; scale(0.68) → ~43px -->
          <use href="#mule-face" x="108" y="278" width="64" height="64" transform="scale(1)"/>
          <text x="140" y="337" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="6"
            fill="rgba(200,150,50,0.55)" letter-spacing="0.14">mule-bot corpus</text>

          <line x1="26" y1="346" x2="254" y2="346"
            stroke="rgba(0,140,190,0.14)" stroke-width="0.4"/>

          <!-- Exolocation address -->
          <text x="140" y="358" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="6.2"
            fill="rgba(0,180,220,0.65)" letter-spacing="0.06">{{ exolocAddr }}</text>

          <!-- Footer -->
          <text x="140" y="374" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="6"
            fill="rgba(60,100,140,0.55)" letter-spacing="0.12">
            PON INK v1.0  ·  EXOTOPIA  ·  GPL v3
          </text>
          <text x="140" y="383" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="5.5"
            fill="rgba(40,80,120,0.45)" letter-spacing="0.08">{{ hostname }}</text>

          <!-- Rarity indicator dots (bottom corners) -->
          <circle cx="22"  cy="382" r="2.5" fill="rgba(255,140,30,0.55)"/>
          <circle cx="258" cy="382" r="2.5" fill="rgba(255,140,30,0.55)"/>
          <circle cx="22"  cy="382" r="5"   fill="none"
            stroke="rgba(255,140,30,0.25)" stroke-width="0.5"/>
          <circle cx="258" cy="382" r="5"   fill="none"
            stroke="rgba(255,140,30,0.25)" stroke-width="0.5"/>
        </svg>
      </div>

    </div><!-- /diptych -->

    <!-- ── Data strip below both cards ───────────────────────────────────── -->
    <div class="pcc-strip">
      <div class="pcc-strip-item">
        <span class="psi-label">SYSTEM</span>
        <span class="psi-value">{{ hostname }}</span>
      </div>
      <div class="pcc-strip-item">
        <span class="psi-label">PLANET</span>
        <span class="psi-value">{{ planetName }}</span>
      </div>
      <div class="pcc-strip-item">
        <span class="psi-label">COORDINATES</span>
        <span class="psi-value">{{ coordLabel }}</span>
      </div>
      <div class="pcc-strip-item">
        <span class="psi-label">ZONE</span>
        <span class="psi-value">{{ zoneName }}</span>
      </div>
      <div class="pcc-strip-item">
        <span class="psi-label">CLIMATE</span>
        <span class="psi-value" :class="`psi-value--${climateClass}`">{{ climateDesc }}</span>
      </div>
      <div class="pcc-strip-item">
        <span class="psi-label">COORD SYSTEM</span>
        <span class="psi-value">exo-surface-v1</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGalaxyStore } from 'src/stores/galaxy'
import { usesFahrenheit, estimateDayLength } from 'src/lib/planet-climate'

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  hostname:   string
  planetName: string
  lat:        number    // degrees, −85 to +85
  lon:        number    // degrees, −175 to +175
}>()

// ── Store ─────────────────────────────────────────────────────────────────────

const galaxyStore = useGalaxyStore()

const planet = computed(() => galaxyStore.getPlanet(props.planetName) ?? null)
const system = computed(() => galaxyStore.getSystem(props.hostname)   ?? null)

// ── Coordinate helpers ────────────────────────────────────────────────────────

/** SVG map: column index (0-35) from longitude */
const selCol = computed(() => Math.round((props.lon + 175) / 10))
/** SVG map: row index (0-17) from latitude */
const selRow = computed(() => Math.round((85 - props.lat) / 10))
/** Top-left x of selected cell in map SVG */
const selX   = computed(() => selCol.value * 10)
/** Top-left y of selected cell in map SVG */
const selY   = computed(() => selRow.value * 10)

const coordLabel = computed(() => {
  const lat = props.lat, lon = props.lon
  const latS = lat >= 0 ? `${lat}°N` : `${Math.abs(lat)}°S`
  const lonS = lon >= 0 ? `${lon}°E` : `${Math.abs(lon)}°W`
  return `${latS} · ${lonS}`
})

const exolocAddr = computed(() => {
  const lat = props.lat, lon = props.lon
  const latS = `${Math.abs(lat)}${lat >= 0 ? 'N' : 'S'}`
  const lonS = `${Math.abs(lon)}${lon >= 0 ? 'E' : 'W'}`
  return `exo-surface-v1:${props.planetName}:${latS},${lonS}`
})

// ── Planet visual ─────────────────────────────────────────────────────────────

const planetHex = computed((): string => {
  const eqt = planet.value?.pl_eqt
  if (eqt == null) return '#448899'
  if (eqt > 2000) return '#ff2200'
  if (eqt > 1200) return '#ff6600'
  if (eqt > 500)  return '#ffaa00'
  if (eqt > 280)  return '#44ddaa'
  if (eqt > 150)  return '#6699cc'
  return '#aaccff'
})

// ── Tidal lock ────────────────────────────────────────────────────────────────

const isLocked = computed((): boolean => {
  if (!planet.value || !system.value) return false
  return estimateDayLength(planet.value, system.value).mode === 'locked'
})

// ── Climate classification ────────────────────────────────────────────────────

const climateClass = computed((): string => {
  const eqt    = planet.value?.pl_eqt ?? 280
  const absLat = Math.abs(props.lat)
  const absLon = Math.abs(props.lon)

  if (isLocked.value) {
    if (absLon < 45)  return eqt > 400 ? 'hot'  : eqt > 220 ? 'warm'  : 'temperate'
    if (absLon < 90)  return 'temperate'
    if (absLon < 135) return 'cold'
    return 'frozen'
  }
  if (absLat < 20)   return eqt > 400 ? 'hot'  : eqt > 250 ? 'warm'  : 'temperate'
  if (absLat < 50)   return eqt > 300 ? 'warm' : 'temperate'
  return eqt < 180 ? 'frozen' : 'cold'
})

const CLIMATE_DESC: Record<string, string> = {
  hot:       'Ultra-hot · hostile surface',
  warm:      'Warm · liquid surface possible',
  temperate: 'Temperate · habitable conditions',
  cold:      'Cold · subsurface liquid possible',
  frozen:    'Frozen · cryo-stable',
}
const climateDesc = computed(() => CLIMATE_DESC[climateClass.value] ?? '—')

const CLIMATE_COL: Record<string, string> = {
  hot:       '#ff5020',
  warm:      '#ffaa30',
  temperate: '#44ee99',
  cold:      '#6699ff',
  frozen:    '#aaccff',
}
const climateFill = computed(() => CLIMATE_COL[climateClass.value] ?? '#6699aa')

// ── Zone name ─────────────────────────────────────────────────────────────────

const TERRAIN = ['Planitia','Highland','Basin','Shelf','Ridge','Plateau','Mare','Lacus','Terra','Rupes','Vallis','Dorsum','Chaos','Fossa']

const zoneName = computed((): string => {
  const row = selRow.value, col = selCol.value
  const absLat = Math.abs(props.lat), absLon = Math.abs(props.lon)
  const lat = props.lat, lon = props.lon

  const latBand = absLat < 15 ? 'Equatorial'
    : absLat < 35 ? 'Sub-tropical'
    : absLat < 60 ? 'Temperate'
    : 'Polar'

  let side: string
  if (isLocked.value) {
    side = absLon < 30  ? 'Sub-stellar'
      : absLon < 75  ? 'Dayside'
      : absLon < 105 ? 'Terminator'
      : absLon < 150 ? 'Nightside'
      : 'Anti-stellar'
  } else {
    side = lon < -60 ? 'Western' : lon > 60 ? 'Eastern' : 'Central'
  }
  const t = Math.abs((row * 37 + col * 13 + row * col) % TERRAIN.length)
  return `${latBand} ${side} ${TERRAIN[t]}`
})

// ── Map cell fill helpers ─────────────────────────────────────────────────────

const CLIMATE_FILL: Record<string, string> = {
  hot:       'rgba(255, 60,  10, 0.32)',
  warm:      'rgba(255,140,  40, 0.22)',
  temperate: 'rgba( 40,200, 120, 0.20)',
  cold:      'rgba( 80,140, 220, 0.18)',
  frozen:    'rgba(160,200, 255, 0.14)',
}

function cellClimate(row: number, col: number): string {
  const eqt    = planet.value?.pl_eqt ?? 280
  const lat    = 85  - row * 10
  const lon    = col * 10 - 175
  const absLat = Math.abs(lat), absLon = Math.abs(lon)

  if (isLocked.value) {
    if (absLon < 45)  return eqt > 400 ? 'hot'  : eqt > 220 ? 'warm'  : 'temperate'
    if (absLon < 90)  return 'temperate'
    if (absLon < 135) return 'cold'
    return 'frozen'
  }
  if (absLat < 20) return eqt > 400 ? 'hot'  : eqt > 250 ? 'warm'  : 'temperate'
  if (absLat < 50) return eqt > 300 ? 'warm' : 'temperate'
  return eqt < 180 ? 'frozen' : 'cold'
}

function bgCellFill(row: number, col: number): string {
  return CLIMATE_FILL[cellClimate(row, col)] ?? 'rgba(20,40,60,0.18)'
}

function isNearSelected(row: number, col: number): boolean {
  return Math.abs(row - selRow.value) <= 3 && Math.abs(col - selCol.value) <= 5
}

// ── Habitable zone bands for planet disc ──────────────────────────────────────

interface HZBand { cy: number; cosLat: number; color: string; opacity: number }

const hzBands = computed((): HZBand[] => {
  const eqt = planet.value?.pl_eqt
  if (eqt == null) return []
  const bands: HZBand[] = []

  if (isLocked.value && eqt > 100 && eqt < 800) {
    bands.push({ cy: 0, cosLat: 0.06, color: '#44ee99', opacity: 0.24 })
  } else {
    const polarT = eqt * 0.65
    if (eqt >= 200 && eqt <= 350) {
      bands.push({ cy: 0, cosLat: Math.cos(20 * Math.PI / 180), color: '#44ee99', opacity: 0.20 })
    }
    if (eqt > 350 && eqt < 700) {
      const lat = 40, cy = -(lat / 90) * 68
      bands.push({ cy,  cosLat: Math.cos(lat * Math.PI / 180), color: '#88ddcc', opacity: 0.18 })
      bands.push({ cy: -cy, cosLat: Math.cos(lat * Math.PI / 180), color: '#88ddcc', opacity: 0.18 })
    }
    if (polarT >= 200 && polarT <= 350) {
      const lat = 68, cy = -(lat / 90) * 68
      bands.push({ cy,  cosLat: Math.cos(lat * Math.PI / 180), color: '#aaddff', opacity: 0.20 })
      bands.push({ cy: -cy, cosLat: Math.cos(lat * Math.PI / 180), color: '#aaddff', opacity: 0.20 })
    }
  }
  return bands
})

// ── Plot dot on sphere (orthographic projection) ──────────────────────────────

const discDot = computed((): { x: number; y: number } | null => {
  const lonR = props.lon * Math.PI / 180
  const latR = props.lat * Math.PI / 180
  const R    = 68  // disc radius in SVG units

  // Only show if point is on the visible hemisphere (|lon| < 90°)
  if (Math.abs(props.lon) >= 90) return null

  return {
    x:  Math.round(R * Math.cos(latR) * Math.sin(lonR) * 10) / 10,
    y:  Math.round(R * Math.sin(latR) * 10) / 10,
  }
})
</script>

<style scoped>
/* ── Root ──────────────────────────────────────────────────────────────────── */

.pcc-root {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

/* ── Diptych (two-panel row) ──────────────────────────────────────────────── */

.pcc-diptych {
  display: flex;
  gap: 20px;
  align-items: stretch;
  padding: 0 0 0 0;
}

/* ── PANEL A — Orbital Cartograph ─────────────────────────────────────────── */

.pcc-cartograph {
  flex: 1;
  position: relative;
  background: #010510;
  border: 1px solid rgba(0, 160, 220, 0.18);
  border-radius: 6px;
  overflow: hidden;
  /* Scanline texture */
  background-image:
    repeating-linear-gradient(
      to bottom,
      transparent 0px, transparent 3px,
      rgba(0, 200, 255, 0.012) 3px, rgba(0, 200, 255, 0.012) 4px
    );
}

/* HUD corner L-brackets */
.hud-corner {
  position: absolute;
  width: 14px; height: 14px;
  border-color: rgba(0, 190, 240, 0.40);
  border-style: solid;
  z-index: 2;
}
.hud-corner--tl { top: 8px; left: 8px;   border-width: 1.5px 0 0 1.5px; }
.hud-corner--tr { top: 8px; right: 8px;  border-width: 1.5px 1.5px 0 0; }
.hud-corner--bl { bottom: 8px; left: 8px;  border-width: 0 0 1.5px 1.5px; }
.hud-corner--br { bottom: 8px; right: 8px; border-width: 0 1.5px 1.5px 0; }

/* HUD data bands */
.hud-band {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  background: rgba(0, 6, 20, 0.75);
  border-color: rgba(0, 130, 190, 0.15);
  border-style: solid;
  font-family: 'Courier New', monospace;
  font-size: 8.5px;
  letter-spacing: 0.10em;
  z-index: 2;
  position: relative;
}
.hud-band--top { border-bottom-width: 1px; }
.hud-band--bot { border-top-width: 1px; }

.hud-tag     { color: rgba(0, 180, 220, 0.55); }
.hud-tag--right { margin-left: auto; color: rgba(160, 210, 240, 0.70); }
.hud-coord   { color: rgba(0, 230, 255, 0.80); flex: 1; text-align: center; }
.hud-zone    { color: rgba(160, 200, 230, 0.70); flex: 1; }
.hud-addr    { font-size: 7.5px; color: rgba(60, 130, 170, 0.55); margin-left: auto; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.hud-climate { font-size: 8px; padding: 1px 7px; border-radius: 3px; border: 1px solid; }
.hud-climate--hot       { color: rgba(255,100,30,0.85); border-color: rgba(220,80,20,0.35); }
.hud-climate--warm      { color: rgba(255,180,50,0.80); border-color: rgba(220,150,30,0.35); }
.hud-climate--temperate { color: rgba(60,220,120,0.82); border-color: rgba(40,190,100,0.35); }
.hud-climate--cold      { color: rgba(120,180,255,0.78); border-color: rgba(90,150,220,0.35); }
.hud-climate--frozen    { color: rgba(200,220,255,0.70); border-color: rgba(160,190,230,0.30); }

.pcc-map {
  display: block;
  width: 100%;
  height: auto;
  cursor: default;
}

/* ── PANEL B — Settlement Deed ────────────────────────────────────────────── */

.pcc-deed-wrap {
  flex-shrink: 0;
  width: 240px;
  display: flex;
  align-items: stretch;
  filter: drop-shadow(0 8px 32px rgba(0,0,0,0.7));
}

.pcc-deed {
  width: 100%;
  height: auto;
}

/* ── Data strip ────────────────────────────────────────────────────────────── */

.pcc-strip {
  display: flex;
  gap: 0;
  border-top: 1px solid rgba(0, 100, 160, 0.15);
  background: rgba(0, 4, 14, 0.80);
}

.pcc-strip-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-right: 1px solid rgba(0, 80, 130, 0.15);
  font-family: 'Courier New', monospace;
}
.pcc-strip-item:last-child { border-right: none; }

.psi-label {
  font-size: 6.5px;
  letter-spacing: 0.16em;
  color: rgba(0, 160, 200, 0.45);
}
.psi-value {
  font-size: 9px;
  color: rgba(160, 210, 235, 0.80);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.psi-value--hot       { color: rgba(255,100,30,0.85); }
.psi-value--warm      { color: rgba(255,180,50,0.80); }
.psi-value--temperate { color: rgba(60,220,120,0.82); }
.psi-value--cold      { color: rgba(120,180,255,0.78); }
.psi-value--frozen    { color: rgba(200,220,255,0.70); }
</style>
