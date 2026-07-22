<template>
  <!--
    CollectorCardBack.vue — back face of every collector card.
    Same 280×392 viewBox as CollectorCard.vue.
    Each card ID gets a unique thematic back pattern.
  -->
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 280 392"
    xmlns="http://www.w3.org/2000/svg"
    class="collector-card-back"
    role="img"
    :aria-label="`${card.name} — back`"
  >
    <defs>
      <!-- Background: inverted front gradient -->
      <linearGradient :id="`bb-${card.id}`" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%"   :stop-color="card.bgTo" />
        <stop offset="100%" :stop-color="card.bgFrom" />
      </linearGradient>

      <!-- Shimmer layer -->
      <linearGradient :id="`bs-${card.id}`" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="rgba(255,255,255,0.07)"/>
        <stop offset="50%"  stop-color="rgba(255,255,255,0.02)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0.05)"/>
      </linearGradient>

      <!-- Border glow filter -->
      <filter :id="`bg-${card.id}`" x="-15%" y="-15%" width="130%" height="130%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- Card body -->
    <rect x="0" y="0" width="280" height="392" rx="10" :fill="`url(#bb-${card.id})`"/>
    <rect x="0" y="0" width="280" height="392" rx="10" :fill="`url(#bs-${card.id})`"/>

    <!-- Border -->
    <rect x="6" y="6" width="268" height="380" rx="7"
      fill="none" :stroke="card.borderColor" stroke-width="0.7" stroke-opacity="0.32"/>

    <!-- Corner L-ornaments -->
    <g :stroke="card.borderColor" stroke-width="1.0" stroke-opacity="0.55" fill="none">
      <polyline points="18,26 18,18 26,18"/>
      <polyline points="254,18 262,18 262,26"/>
      <polyline points="18,366 18,374 26,374"/>
      <polyline points="254,374 262,374 262,366"/>
    </g>

    <!-- ── UNIQUE BACK PATTERN per card ───────────────────────────────── -->

    <!-- 12: The Field Reading — GPS radar with data points -->
    <g v-if="card.id === 12">
      <circle cx="140" cy="196" r="80" fill="none" :stroke="card.artColors[0]" stroke-width="0.5" stroke-opacity="0.20"/>
      <circle cx="140" cy="196" r="55" fill="none" :stroke="card.artColors[0]" stroke-width="0.5" stroke-opacity="0.25"/>
      <circle cx="140" cy="196" r="30" fill="none" :stroke="card.artColors[0]" stroke-width="0.5" stroke-opacity="0.30"/>
      <!-- Crosshair -->
      <line x1="60" y1="196" x2="220" y2="196" :stroke="card.artColors[0]" stroke-width="0.4" stroke-opacity="0.25"/>
      <line x1="140" y1="116" x2="140" y2="276" :stroke="card.artColors[0]" stroke-width="0.4" stroke-opacity="0.25"/>
      <!-- Sweep arc -->
      <path d="M 140 196 L 140 116 A 80 80 0 0 1 218 240 Z"
        :fill="card.artColors[1]" fill-opacity="0.07"/>
      <!-- Data points -->
      <circle v-for="pt in gpsPoints" :key="pt.id"
        :cx="pt.cx" :cy="pt.cy" r="3" :fill="card.artColors[0]" fill-opacity="0.70"/>
      <!-- GPS pin at center -->
      <path d="M 140 170 C 140 158 125 154 125 168 C 125 178 140 190 140 190 C 140 190 155 178 155 168 C 155 154 140 158 140 170 Z"
        :fill="card.artColors[0]" fill-opacity="0.55"/>
      <circle cx="140" cy="168" r="4" fill="#000614" fill-opacity="0.70"/>
    </g>

    <!-- 13: The Living Verse — verse lines + breath gaps -->
    <g v-else-if="card.id === 13">
      <g v-for="(ln, i) in verseLines" :key="i">
        <rect :x="ln.x" :y="ln.y" :width="ln.w" height="2.5" rx="1"
          :fill="card.artColors[0]" :fill-opacity="ln.op"/>
      </g>
      <!-- Microphone outline -->
      <rect x="128" y="292" width="24" height="36" rx="12"
        fill="none" :stroke="card.artColors[2]" stroke-width="1.2" stroke-opacity="0.50"/>
      <path d="M 120 316 Q 120 334 140 334 Q 160 334 160 316"
        fill="none" :stroke="card.artColors[2]" stroke-width="1.0" stroke-opacity="0.45"/>
      <line x1="140" y1="334" x2="140" y2="345" :stroke="card.artColors[2]" stroke-width="1.0" stroke-opacity="0.45"/>
    </g>

    <!-- 14: The Raw Take — cassette tape cross-section -->
    <g v-else-if="card.id === 14">
      <!-- Cassette body -->
      <rect x="60" y="152" width="160" height="88" rx="6"
        fill="rgba(0,0,0,0.35)" :stroke="card.artColors[0]" stroke-width="1.0" stroke-opacity="0.55"/>
      <!-- Left reel -->
      <circle cx="104" cy="196" r="26" fill="rgba(0,0,0,0.50)" :stroke="card.artColors[0]" stroke-width="0.8" stroke-opacity="0.45"/>
      <circle cx="104" cy="196" r="10" fill="rgba(0,0,0,0.70)" :stroke="card.artColors[0]" stroke-width="0.6" stroke-opacity="0.40"/>
      <!-- Left reel spokes -->
      <g v-for="sp in 5" :key="'ls'+sp">
        <line :x1="104" y1="196"
          :x2="104 + 22 * Math.cos(sp * Math.PI * 2 / 5)"
          :y2="196 + 22 * Math.sin(sp * Math.PI * 2 / 5)"
          :stroke="card.artColors[0]" stroke-width="0.7" stroke-opacity="0.30"/>
      </g>
      <!-- Right reel -->
      <circle cx="176" cy="196" r="26" fill="rgba(0,0,0,0.50)" :stroke="card.artColors[0]" stroke-width="0.8" stroke-opacity="0.45"/>
      <circle cx="176" cy="196" r="10" fill="rgba(0,0,0,0.70)" :stroke="card.artColors[0]" stroke-width="0.6" stroke-opacity="0.40"/>
      <g v-for="sp in 5" :key="'rs'+sp">
        <line :x1="176" y1="196"
          :x2="176 + 22 * Math.cos(sp * Math.PI * 2 / 5 + 0.6)"
          :y2="196 + 22 * Math.sin(sp * Math.PI * 2 / 5 + 0.6)"
          :stroke="card.artColors[0]" stroke-width="0.7" stroke-opacity="0.30"/>
      </g>
      <!-- Tape path -->
      <path d="M 126 208 Q 140 220 154 208"
        fill="none" :stroke="card.artColors[0]" stroke-width="1.2" stroke-opacity="0.55"/>
      <!-- Label window -->
      <rect x="80" y="160" width="120" height="28" rx="2"
        fill="rgba(255,255,255,0.04)" :stroke="card.artColors[0]" stroke-width="0.5" stroke-opacity="0.30"/>
      <text x="140" y="179" text-anchor="middle"
        font-family="'Courier New', monospace" font-size="6.5"
        :fill="card.artColors[0]" fill-opacity="0.60" letter-spacing="0.12">THE RAW TAKE · SIDE A</text>
    </g>

    <!-- 15: Cipher Tongue — script grid -->
    <g v-else-if="card.id === 15">
      <text v-for="ch in cipherChars" :key="ch.id"
        :x="ch.x" :y="ch.y" :font-size="ch.sz"
        font-family="monospace" text-anchor="middle"
        :fill="card.artColors[0]" :fill-opacity="ch.op">{{ ch.c }}</text>
    </g>

    <!-- 16: Callus Print — skin cross-section anatomy -->
    <g v-else-if="card.id === 16">
      <!-- Skin layers -->
      <!-- Callus (stratum corneum) -->
      <rect x="50" y="136" width="180" height="28" rx="2"
        :fill="card.artColors[2]" fill-opacity="0.22"
        :stroke="card.artColors[0]" stroke-width="0.5" stroke-opacity="0.35"/>
      <text x="54" y="154" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[1]" fill-opacity="0.60">CALLUS · stratum corneum</text>
      <!-- Epidermis -->
      <rect x="50" y="164" width="180" height="40" rx="2"
        :fill="card.artColors[0]" fill-opacity="0.14"
        :stroke="card.artColors[0]" stroke-width="0.5" stroke-opacity="0.28"/>
      <text x="54" y="187" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[1]" fill-opacity="0.50">epidermis</text>
      <!-- Dermis -->
      <rect x="50" y="204" width="180" height="54" rx="2"
        fill="rgba(180,100,60,0.10)" :stroke="card.artColors[1]" stroke-width="0.5" stroke-opacity="0.25"/>
      <text x="54" y="235" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[1]" fill-opacity="0.45">dermis</text>
      <!-- Sweat gland coil -->
      <path d="M 180 210 Q 195 218 196 232 Q 197 248 184 252 Q 168 256 168 242 Q 168 228 184 226"
        fill="none" :stroke="card.artColors[2]" stroke-width="1.0" stroke-opacity="0.40"/>
      <!-- Ridge fingerprint cross-section lines -->
      <g fill="none" :stroke="card.artColors[0]" stroke-width="0.6" stroke-opacity="0.40">
        <path d="M 60 168 Q 65 160 70 168 Q 75 176 80 168 Q 85 160 90 168 Q 95 176 100 168"/>
        <path d="M 60 174 Q 65 166 70 174 Q 75 182 80 174 Q 85 166 90 174 Q 95 182 100 174"/>
        <path d="M 60 180 Q 65 172 70 180 Q 75 188 80 180 Q 85 172 90 180 Q 95 188 100 180"/>
      </g>
    </g>

    <!-- 17: The Circle — sociocracy double-link diagram -->
    <g v-else-if="card.id === 17">
      <!-- Outer circle of circles -->
      <g v-for="i in 8" :key="'cc'+i">
        <circle
          :cx="140 + 72 * Math.cos((i-1) * Math.PI / 4)"
          :cy="196 + 72 * Math.sin((i-1) * Math.PI / 4)"
          r="14"
          fill="rgba(0,0,0,0.40)" :stroke="card.artColors[0]" stroke-width="0.8" stroke-opacity="0.55"/>
        <!-- Double link connections to neighbour -->
        <line
          :x1="140 + 72 * Math.cos((i-1) * Math.PI / 4)"
          :y1="196 + 72 * Math.sin((i-1) * Math.PI / 4)"
          :x2="140 + 72 * Math.cos(i * Math.PI / 4)"
          :y2="196 + 72 * Math.sin(i * Math.PI / 4)"
          :stroke="card.artColors[0]" stroke-width="0.6" stroke-opacity="0.22"/>
      </g>
      <!-- Inner circle of circles -->
      <g v-for="i in 4" :key="'ic'+i">
        <circle
          :cx="140 + 32 * Math.cos((i-1) * Math.PI / 2 + Math.PI/4)"
          :cy="196 + 32 * Math.sin((i-1) * Math.PI / 2 + Math.PI/4)"
          r="10"
          fill="rgba(0,0,0,0.40)" :stroke="card.artColors[1]" stroke-width="0.8" stroke-opacity="0.55"/>
      </g>
      <!-- Centre -->
      <circle cx="140" cy="196" r="6" :fill="card.artColors[0]" fill-opacity="0.50"/>
    </g>

    <!-- 18: Compost Logic — spiral decomposition cross-section -->
    <g v-else-if="card.id === 18">
      <!-- Layer strata -->
      <rect x="55" y="136" width="170" height="22" rx="2" :fill="card.artColors[0]" fill-opacity="0.18"/>
      <text x="60" y="150" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[0]" fill-opacity="0.60">FRESH → carbon/nitrogen</text>
      <rect x="55" y="158" width="170" height="28" rx="2" :fill="card.artColors[1]" fill-opacity="0.18"/>
      <text x="60" y="176" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[1]" fill-opacity="0.60">ACTIVE decomposition</text>
      <rect x="55" y="186" width="170" height="32" rx="2" :fill="card.artColors[2]" fill-opacity="0.18"/>
      <text x="60" y="206" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[2]" fill-opacity="0.60">MATURING humus formation</text>
      <rect x="55" y="218" width="170" height="26" rx="2" :fill="card.artColors[3]" fill-opacity="0.25"/>
      <text x="60" y="234" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[3]" fill-opacity="0.70">FINISHED compost ← ready</text>
      <!-- Spiral decomposition symbol -->
      <path d="M 170 268 Q 185 258 184 244 Q 183 228 168 226 Q 152 224 150 240 Q 148 256 164 260 Q 178 262 180 252"
        fill="none" :stroke="card.artColors[1]" stroke-width="1.2" stroke-opacity="0.55"/>
    </g>

    <!-- 19: Street Frequency — RF interference rings -->
    <g v-else-if="card.id === 19">
      <!-- Tower mast -->
      <line x1="140" y1="130" x2="140" y2="270"
        :stroke="card.artColors[0]" stroke-width="1.5" stroke-opacity="0.55"/>
      <line x1="130" y1="145" x2="140" y2="135" :stroke="card.artColors[0]" stroke-width="0.7" stroke-opacity="0.40"/>
      <line x1="150" y1="145" x2="140" y2="135" :stroke="card.artColors[0]" stroke-width="0.7" stroke-opacity="0.40"/>
      <!-- Frequency rings -->
      <ellipse v-for="(r, i) in [18,36,54,72,90]" :key="'fr'+i"
        cx="140" cy="196" :rx="r" :ry="r*0.30"
        fill="none" :stroke="card.artColors[0]"
        stroke-width="0.6" :stroke-opacity="0.38 - i*0.05"
        stroke-dasharray="3,2"/>
      <!-- f = c/λ label -->
      <text x="140" y="290" text-anchor="middle"
        font-family="'Courier New', monospace" font-size="9" font-style="italic"
        :fill="card.artColors[0]" fill-opacity="0.55">f = c / λ</text>
    </g>

    <!-- 20: Mending Season — sashiko geometric stitching -->
    <g v-else-if="card.id === 20">
      <!-- Sashiko grid rendered from computed data -->
      <path v-for="sp in sashikoPaths" :key="sp"
        :d="sp" fill="none" :stroke="card.artColors[0]"
        stroke-width="0.9" stroke-opacity="0.42" stroke-linecap="round"/>
    </g>

    <!-- 21: The Count — tally mark grid -->
    <g v-else-if="card.id === 21">
      <!-- Groups of 5 tally marks: IIII with diagonal -->
      <g v-for="(grp, gi) in tallyGroups" :key="'tg'+gi"
        :transform="`translate(${grp.x}, ${grp.y})`">
        <!-- 4 vertical marks -->
        <line x1="0"  y1="0" x2="0"  y2="16" :stroke="card.artColors[0]" stroke-width="1.2" stroke-opacity="0.65"/>
        <line x1="5"  y1="0" x2="5"  y2="16" :stroke="card.artColors[0]" stroke-width="1.2" stroke-opacity="0.65"/>
        <line x1="10" y1="0" x2="10" y2="16" :stroke="card.artColors[0]" stroke-width="1.2" stroke-opacity="0.65"/>
        <line x1="15" y1="0" x2="15" y2="16" :stroke="card.artColors[0]" stroke-width="1.2" stroke-opacity="0.65"/>
        <!-- Diagonal strike-through -->
        <line x1="-2" y1="14" x2="17" y2="2"  :stroke="card.artColors[0]" stroke-width="1.2" stroke-opacity="0.65"/>
        <!-- Group count -->
        <text x="7.5" y="26" text-anchor="middle"
          font-family="'Courier New', monospace" font-size="5"
          :fill="card.artColors[1]" fill-opacity="0.45">{{ grp.count }}</text>
      </g>
    </g>

    <!-- 22: Margin Notes — notebook page with annotations -->
    <g v-else-if="card.id === 22">
      <!-- Page lines -->
      <g v-for="l in 14" :key="'ml'+l">
        <line :x1="80" :y1="120 + l*16" :x2="240" :y2="120 + l*16"
          stroke="rgba(120,140,170,0.20)" stroke-width="0.5"/>
      </g>
      <!-- Left margin line -->
      <line x1="88" y1="116" x2="88" y2="350"
        stroke="rgba(200,100,100,0.25)" stroke-width="0.8"/>
      <!-- Margin notes (SVG paths simulating handwriting strokes) -->
      <g fill="none" :stroke="card.artColors[0]" stroke-width="1.0" stroke-opacity="0.50" stroke-linecap="round">
        <path d="M 52 136 Q 56 134 60 136 Q 62 140 60 142 Q 56 144 52 142"/>
        <path d="M 53 158 L 65 158 M 53 162 L 62 162"/>
        <path d="M 52 184 Q 58 180 64 186 Q 62 192 56 190 Q 50 188 52 184"/>
        <path d="M 53 210 L 58 204 M 53 216 L 64 216"/>
      </g>
      <!-- Main text lines of varying widths -->
      <g v-for="(ln, i) in marginLines" :key="'mln'+i">
        <rect :x="92" :y="117 + i*16" :width="ln" height="2.5" rx="1"
          :fill="card.artColors[0]" fill-opacity="0.30"/>
      </g>
      <!-- Underline emphasis on one line -->
      <line x1="92" y1="149" x2="175" y2="149"
        :stroke="card.artColors[1]" stroke-width="0.7" stroke-opacity="0.45"/>
    </g>

    <!-- ── Default pattern for unlisted IDs ───────────────────────────── -->
    <g v-else>
      <circle cx="140" cy="196" r="60" fill="none"
        :stroke="card.borderColor" stroke-width="0.5" stroke-opacity="0.22"/>
    </g>

    <!-- ── COMMON BACK HEADER ──────────────────────────────────────────── -->

    <!-- Series badge (top centre) -->
    <text x="140" y="36" text-anchor="middle"
      font-family="'Courier New', monospace" font-size="7"
      :fill="card.borderColor" fill-opacity="0.55" letter-spacing="0.18">{{ card.series.toUpperCase() }}</text>
    <line x1="40" y1="42" x2="240" y2="42"
      :stroke="card.borderColor" stroke-width="0.4" stroke-opacity="0.20"/>

    <!-- Central Exotopia wordmark watermark -->
    <text x="140" y="364" text-anchor="middle"
      font-family="'Courier New', monospace" font-size="8" font-weight="300"
      :fill="card.borderColor" fill-opacity="0.28" letter-spacing="0.18">EXOTOPIA</text>

    <!-- ── COMMON BACK FOOTER ──────────────────────────────────────────── -->
    <line x1="40" y1="350" x2="240" y2="350"
      :stroke="card.borderColor" stroke-width="0.4" stroke-opacity="0.18"/>

    <!-- Card number -->
    <text x="44" y="362" font-family="'Courier New', monospace" font-size="7"
      :fill="card.borderColor" fill-opacity="0.45" letter-spacing="0.10">
      #{{ String(card.edition).padStart(2,'0') }}/{{ card.maxEdition }}
    </text>

    <!-- Series -->
    <text x="236" y="362" text-anchor="end" font-family="'Courier New', monospace" font-size="7"
      :fill="card.borderColor" fill-opacity="0.45" letter-spacing="0.10">
      {{ card.series.toUpperCase() }}
    </text>

    <!-- Bottom footer line -->
    <text x="140" y="378" text-anchor="middle"
      font-family="'Courier New', monospace" font-size="5.5"
      fill="rgba(60,90,120,0.50)" letter-spacing="0.10">PON INK v1.0  ·  GPL v3</text>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CollectorCard } from 'src/data/collector-cards'

const props = withDefaults(defineProps<{
  card:    CollectorCard
  width?:  number
  height?: number
}>(), { width: 280, height: 392 })

// ── Card-specific computed data ───────────────────────────────────────────────

// Card 12 — GPS data points on radar
const gpsPoints = computed(() => {
  const seed = props.card.id * 997
  const rng  = () => { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff } }
  const r    = rng()
  return Array.from({ length: 8 }, (_, i) => ({
    id:  i,
    cx:  140 + (r() - 0.5) * 140,
    cy:  196 + (r() - 0.5) * 130,
  }))
})

// Card 13 — verse line widths and positions
const verseLines = computed(() => {
  const stanzas = [
    [120, 95, 110, 140],
    [],
    [88, 115, 102, 130, 78],
    [],
    [140, 108],
  ]
  const lines: { x: number; y: number; w: number; op: number }[] = []
  let y = 118
  for (const stanza of stanzas) {
    if (stanza.length === 0) { y += 10; continue }
    for (const w of stanza) {
      lines.push({ x: 70, y, w, op: 0.25 + Math.random() * 0.15 })
      y += 11
    }
    y += 6
  }
  return lines
})

// Card 15 — cipher characters
const cipherChars = computed(() => {
  const pool = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψωابتثجحخدذرزسشصضطظعغفقكلمنهوي∂∇∑∏∫≈≠±∞√∈∉⊂∅'
  const chars = []
  let id = 0
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 8; col++) {
      const ch = pool[(row * 8 + col) % pool.length]
      chars.push({
        id: id++, c: ch,
        x: 54 + col * 26,
        y: 128 + row * 24,
        sz: 9 + (Math.abs(row - 4) + Math.abs(col - 3)) % 4,
        op: 0.15 + ((row * col) % 5) * 0.12,
      })
    }
  }
  return chars
})

// Card 20 — sashiko geometric paths
const sashikoPaths = computed(() => {
  const paths: string[] = []
  const ox = 62, oy = 118, step = 22
  // Hexagonal sashiko pattern: two sets of diagonal lines
  for (let i = 0; i < 10; i++) {
    const x1 = ox + i * step, y1 = oy
    const x2 = ox, y2 = oy + i * step
    if (x1 < 218) paths.push(`M ${x1} ${oy} L ${ox} ${oy + (218 - x1)}`)
    if (y2 < 350) paths.push(`M ${ox} ${y2} L ${ox + (350 - y2)} ${350}`)
    // Perpendicular set
    if (x1 < 218) paths.push(`M ${x1} 350 L 218 ${350 - (218 - x1)}`)
  }
  return paths
})

// Card 21 — tally groups
const tallyGroups = computed(() => [
  { x: 60,  y: 140, count: '5' },
  { x: 100, y: 140, count: '10' },
  { x: 140, y: 140, count: '15' },
  { x: 180, y: 140, count: '20' },
  { x: 60,  y: 184, count: '25' },
  { x: 100, y: 184, count: '30' },
  { x: 140, y: 184, count: '35' },
  { x: 180, y: 184, count: '40' },
  { x: 60,  y: 228, count: '45' },
  { x: 100, y: 228, count: '50' },
  { x: 140, y: 228, count: '55' },
  { x: 180, y: 228, count: '60' },
])

// Card 22 — margin text line widths
const marginLines = computed(() => [
  132, 148, 84, 138, 100, 152, 68, 140, 120, 88, 144, 76, 136, 104,
])
</script>

<style scoped>
.collector-card-back { display: block; }
</style>
