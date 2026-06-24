<template>
  <!--
    MuleCreature.vue — mule-bot: isometric/grodesign dimensional mule art.
    A compact mech-animal hybrid: angular mule head silhouette with circuit
    panel details, glowing sensor eyes, and a data-antenna mane.
    viewBox "-36 -36 72 72", scales via `size` prop.
  -->
  <svg
    :width="size" :height="size"
    viewBox="-36 -36 72 72"
    xmlns="http://www.w3.org/2000/svg"
    :aria-label="label"
    role="img"
    class="mule-creature"
  >
    <defs>
      <!-- Body panel gradient — metallic dark-teal -->
      <linearGradient id="mc-body" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%"   stop-color="#1a3a4a"/>
        <stop offset="50%"  stop-color="#0d2230"/>
        <stop offset="100%" stop-color="#060e18"/>
      </linearGradient>
      <!-- Face panel — slightly lighter -->
      <linearGradient id="mc-face" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%"   stop-color="#22404e"/>
        <stop offset="100%" stop-color="#102030"/>
      </linearGradient>
      <!-- Sensor eye glow -->
      <radialGradient id="mc-eye-l" cx="40%" cy="35%" r="60%">
        <stop offset="0%"   stop-color="#00ffcc" stop-opacity="1"/>
        <stop offset="55%"  stop-color="#00cc88" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#004433" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="mc-eye-r" cx="60%" cy="35%" r="60%">
        <stop offset="0%"   stop-color="#00ffcc" stop-opacity="1"/>
        <stop offset="55%"  stop-color="#00cc88" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#004433" stop-opacity="0"/>
      </radialGradient>
      <!-- Muzzle panel -->
      <linearGradient id="mc-muzz" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#18303c"/>
        <stop offset="100%" stop-color="#0a1a22"/>
      </linearGradient>
      <!-- Ear glow inner -->
      <linearGradient id="mc-ear-glow" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%"   stop-color="#003344" stop-opacity="0"/>
        <stop offset="100%" stop-color="#00ccaa" stop-opacity="0.55"/>
      </linearGradient>
      <!-- Edge highlight (rim light from upper-left) -->
      <filter id="mc-rim" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="-1" dy="-1" stdDeviation="0.5"
          flood-color="#00ffcc" flood-opacity="0.35"/>
      </filter>
      <!-- Eye glow filter -->
      <filter id="mc-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.8" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <!-- Circuit line filter -->
      <filter id="mc-circuit" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="0" stdDeviation="0.4"
          flood-color="#00ffcc" flood-opacity="0.60"/>
      </filter>
    </defs>

    <!-- ── EARS — angular mule ears with internal circuit trace ─────────── -->
    <!-- Left ear: trapezoidal plate, tilted outward -->
    <polygon points="-22,-14 -16,-30 -8,-26 -12,-12"
      fill="url(#mc-body)" stroke="#1a5060" stroke-width="0.7"/>
    <!-- Left ear inner glow stripe -->
    <polygon points="-20,-15 -15,-27 -11,-25 -14,-13"
      fill="url(#mc-ear-glow)" opacity="0.70"/>
    <!-- Left ear circuit trace -->
    <polyline points="-17,-26 -17,-20 -13,-16"
      fill="none" stroke="#00ccaa" stroke-width="0.5" stroke-opacity="0.55"
      filter="url(#mc-circuit)"/>

    <!-- Right ear: mirrored plate -->
    <polygon points="22,-14 16,-30 8,-26 12,-12"
      fill="url(#mc-body)" stroke="#1a5060" stroke-width="0.7"/>
    <polygon points="20,-15 15,-27 11,-25 14,-13"
      fill="url(#mc-ear-glow)" opacity="0.70"/>
    <polyline points="17,-26 17,-20 13,-16"
      fill="none" stroke="#00ccaa" stroke-width="0.5" stroke-opacity="0.55"
      filter="url(#mc-circuit)"/>

    <!-- ── ANTENNA MANE — data spike array on forehead ───────────────────── -->
    <g stroke="#00bbaa" stroke-width="0.6" stroke-linecap="round" filter="url(#mc-circuit)">
      <line x1="-4" y1="-14" x2="-6"  y2="-22"/>
      <line x1=" 0" y1="-14" x2=" 0"  y2="-24"/>
      <line x1=" 4" y1="-14" x2=" 6"  y2="-22"/>
      <!-- Antenna tips -->
      <circle cx="-6"  cy="-22" r="1.2" fill="#00ffcc" stroke="none"/>
      <circle cx=" 0"  cy="-24" r="1.5" fill="#00ffcc" stroke="none"/>
      <circle cx=" 6"  cy="-22" r="1.2" fill="#00ffcc" stroke="none"/>
    </g>

    <!-- ── MAIN HEAD PLATE ───────────────────────────────────────────────── -->
    <!-- Primary octagonal-ish head plate — mule proportioned (wider than tall) -->
    <polygon points="-22,-12 -26,-4 -26,8 -18,16 18,16 26,8 26,-4 22,-12"
      fill="url(#mc-face)" stroke="#1e4e62" stroke-width="0.8"
      filter="url(#mc-rim)"/>

    <!-- ── PANEL RIVETS — isometric corner details ───────────────────────── -->
    <g fill="#0a2030" stroke="#1a5060" stroke-width="0.5">
      <circle cx="-21" cy="-10" r="1.2"/>
      <circle cx=" 21" cy="-10" r="1.2"/>
      <circle cx="-22" cy="  8" r="1.2"/>
      <circle cx=" 22" cy="  8" r="1.2"/>
    </g>

    <!-- ── CIRCUIT TRACES on head plate ─────────────────────────────────── -->
    <g fill="none" stroke="#004455" stroke-width="0.4" stroke-opacity="0.75">
      <!-- Horizontal bus -->
      <line x1="-18" y1="-6" x2="18" y2="-6"/>
      <!-- Vertical spurs -->
      <line x1="-14" y1="-6" x2="-14" y2=" 0"/>
      <line x1="  0" y1="-6" x2="  0" y2="-2"/>
      <line x1=" 14" y1="-6" x2=" 14" y2=" 0"/>
      <!-- Lower bus -->
      <line x1="-14" y1=" 0" x2=" 14" y2=" 0"/>
    </g>
    <!-- Highlighted trace (active circuit line) -->
    <polyline points="-18,-6 -18,2 -10,2 -10,6"
      fill="none" stroke="#00ccaa" stroke-width="0.45" stroke-opacity="0.50"
      filter="url(#mc-circuit)"/>

    <!-- ── SENSOR EYES — large hexagonal lenses ──────────────────────────── -->
    <!-- Left eye housing -->
    <polygon points="-14,-3 -10,-6 -5,-4 -5,3 -9,6 -14,4"
      fill="#04121c" stroke="#006655" stroke-width="0.8"/>
    <!-- Left eye glow fill -->
    <polygon points="-13,-2 -10,-5 -6,-3 -6,2 -9,5 -13,3"
      fill="url(#mc-eye-l)"/>
    <!-- Left eye iris ring -->
    <circle cx="-9.5" cy="0" r="3.5"
      fill="none" stroke="#00ffcc" stroke-width="0.6" opacity="0.70"/>
    <!-- Left pupil -->
    <circle cx="-9.5" cy="0" r="1.8"
      fill="#00ffcc" opacity="0.90" filter="url(#mc-glow)"/>
    <!-- Left pupil crosshair -->
    <line x1="-9.5" y1="-1.5" x2="-9.5" y2="1.5"
      stroke="#004433" stroke-width="0.5"/>
    <line x1="-11.0" y1="0" x2="-8.0" y2="0"
      stroke="#004433" stroke-width="0.5"/>

    <!-- Right eye housing -->
    <polygon points="14,-3 10,-6 5,-4 5,3 9,6 14,4"
      fill="#04121c" stroke="#006655" stroke-width="0.8"/>
    <polygon points="13,-2 10,-5 6,-3 6,2 9,5 13,3"
      fill="url(#mc-eye-r)"/>
    <circle cx="9.5" cy="0" r="3.5"
      fill="none" stroke="#00ffcc" stroke-width="0.6" opacity="0.70"/>
    <circle cx="9.5" cy="0" r="1.8"
      fill="#00ffcc" opacity="0.90" filter="url(#mc-glow)"/>
    <line x1="9.5" y1="-1.5" x2="9.5" y2="1.5"
      stroke="#004433" stroke-width="0.5"/>
    <line x1="8.0" y1="0" x2="11.0" y2="0"
      stroke="#004433" stroke-width="0.5"/>

    <!-- ── MUZZLE PLATE ────────────────────────────────────────────────── -->
    <!-- Stepped muzzle panel — mule characteristic long face -->
    <polygon points="-14,14 -18,20 -14,28 14,28 18,20 14,14"
      fill="url(#mc-muzz)" stroke="#1a4050" stroke-width="0.7"/>
    <!-- Muzzle panel detail lines -->
    <line x1="-12" y1="18" x2="12" y2="18"
      stroke="#1a4050" stroke-width="0.5"/>
    <!-- Nostril vents (hexagonal grilles) -->
    <polygon points="-8,21 -5,19 -2,21 -2,24 -5,26 -8,24"
      fill="#04101a" stroke="#006655" stroke-width="0.5"/>
    <polygon points="2,21 5,19 8,21 8,24 5,26 2,24"
      fill="#04101a" stroke="#006655" stroke-width="0.5"/>
    <!-- Vent glow dots -->
    <circle cx="-5" cy="22.5" r="0.8" fill="#00ccaa" opacity="0.70"/>
    <circle cx=" 5" cy="22.5" r="0.8" fill="#00ccaa" opacity="0.70"/>

    <!-- ── STATUS LED strip (forehead bar) ───────────────────────────── -->
    <rect x="-10" y="-10" width="20" height="2.5" rx="1"
      fill="#04121c" stroke="#1a4050" stroke-width="0.4"/>
    <!-- Active LEDs -->
    <rect x="-9"  y="-9.5" width="3"  height="1.5" rx="0.5" fill="#00ffcc" opacity="0.80"/>
    <rect x="-4"  y="-9.5" width="3"  height="1.5" rx="0.5" fill="#00ddaa" opacity="0.55"/>
    <rect x=" 1"  y="-9.5" width="3"  height="1.5" rx="0.5" fill="#00ffcc" opacity="0.90"/>
    <rect x=" 6"  y="-9.5" width="3"  height="1.5" rx="0.5" fill="#00cc88" opacity="0.45"/>

    <!-- ── OUTER EDGE RIM LIGHT (top-left source) ────────────────────── -->
    <!-- Soft highlight along top-left edges -->
    <polyline points="-22,-12 -26,-4 -26,8"
      fill="none" stroke="#006677" stroke-width="1.0" stroke-opacity="0.55"
      stroke-linecap="round"/>
    <polyline points="-22,-12 -16,-30 -8,-26"
      fill="none" stroke="#006677" stroke-width="0.7" stroke-opacity="0.40"/>

    <!-- ── BRAND MARK — small ⬡ corpus symbol on forehead plate ──────── -->
    <text x="0" y="-2" text-anchor="middle" font-size="4.5"
      fill="#004444" fill-opacity="0.60">⬡</text>

  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string; label?: string }>(), {
  size:  64,
  label: 'mule-bot — AI knowledge companion',
})
</script>

<style scoped>
.mule-creature { display: block; }
</style>
