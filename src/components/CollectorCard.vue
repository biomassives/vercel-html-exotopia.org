<template>
  <!-- Playing-card format SVG collector's item — 280×392 px viewport -->
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 280 392`"
    xmlns="http://www.w3.org/2000/svg"
    class="collector-card"
    :class="`card-rarity--${card.rarity}`"
    role="img"
    :aria-label="`${card.name} — ${card.rarity}`"
  >
    <defs>
      <!-- Card background gradient -->
      <linearGradient :id="`bg-${card.id}`" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%"   :stop-color="card.bgFrom" />
        <stop offset="100%" :stop-color="card.bgTo" />
      </linearGradient>

      <!-- Rarity border glow filter -->
      <filter :id="`glow-${card.id}`" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Soft inner glow for artwork -->
      <filter :id="`soft-${card.id}`" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Shimmer highlight gradient -->
      <linearGradient :id="`shimmer-${card.id}`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stop-color="rgba(255,255,255,0.10)" />
        <stop offset="45%"  stop-color="rgba(255,255,255,0.04)" />
        <stop offset="55%"  stop-color="rgba(255,255,255,0.10)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.02)" />
      </linearGradient>

      <!-- Art background gradient (radial) -->
      <radialGradient :id="`art-bg-${card.id}`" cx="50%" cy="50%" r="60%">
        <stop offset="0%"   :stop-color="card.artColors[0]" stop-opacity="0.25" />
        <stop offset="100%" :stop-color="card.bgFrom" stop-opacity="0" />
      </radialGradient>

      <clipPath :id="`card-clip-${card.id}`">
        <rect x="0" y="0" width="280" height="392" rx="14" />
      </clipPath>
    </defs>

    <!-- Card body -->
    <rect x="0" y="0" width="280" height="392" rx="14"
      :fill="`url(#bg-${card.id})`" />

    <!-- Rarity outer glow border -->
    <rect x="2" y="2" width="276" height="388" rx="13"
      fill="none" :stroke="card.borderColor" stroke-width="1.8"
      :filter="`url(#glow-${card.id})`"
      opacity="0.75" />

    <!-- Inner border -->
    <rect x="6" y="6" width="268" height="380" rx="11"
      fill="none" :stroke="card.borderColor" stroke-width="0.6" opacity="0.30" />

    <!-- Shimmer overlay -->
    <rect x="0" y="0" width="280" height="392" rx="14"
      :fill="`url(#shimmer-${card.id})`" />

    <!-- ── HEADER ─────────────────────────────────────────────────────────── -->
    <g clip-path="none">
      <!-- Header background -->
      <rect x="6" y="6" width="268" height="36" rx="8"
        fill="rgba(0,0,0,0.50)" />

      <!-- Series name -->
      <text x="14" y="20"
        font-family="'Courier New', monospace" font-size="7"
        letter-spacing="0.18em" fill="rgba(255,255,255,0.45)" text-anchor="start">
        EXOTOPIA
      </text>
      <text x="14" y="30"
        font-family="'Courier New', monospace" font-size="6"
        letter-spacing="0.14em" fill="rgba(255,255,255,0.30)" text-anchor="start">
        EXTRAPOLATION EDITION
      </text>

      <!-- Card number top-right -->
      <text x="266" y="22"
        font-family="'Courier New', monospace" font-size="8"
        letter-spacing="0.05em"
        :fill="card.borderColor" text-anchor="end" opacity="0.90">
        #{{ String(card.edition).padStart(2, '0') }}/{{ String(card.maxEdition).padStart(2,'0') }}
      </text>

      <!-- Rarity indicator -->
      <circle cx="253" cy="33" r="3.5" :fill="card.borderColor" opacity="0.80" />
      <text x="248" y="36.5"
        font-family="'Courier New', monospace" font-size="5.5"
        letter-spacing="0.10em" :fill="card.borderColor" text-anchor="end" opacity="0.75">
        {{ RARITY_CONFIG[card.rarity].label }}
      </text>
    </g>

    <!-- ── ARTWORK PANEL ──────────────────────────────────────────────────── -->
    <g :clip-path="`url(#card-clip-${card.id})`">
      <!-- Art area background -->
      <rect x="10" y="46" width="260" height="210" rx="6"
        fill="rgba(0,0,0,0.45)" />
      <rect x="10" y="46" width="260" height="210" rx="6"
        :fill="`url(#art-bg-${card.id})`" />

      <!-- ── UNIQUE ARTWORK per card.id ────────────────────────────────────── -->

      <!-- 1: Blue Supergiant — radial star with corona spikes -->
      <g v-if="card.id === 1" :transform="`translate(140, 151)`">
        <circle cx="0" cy="0" r="55" :fill="card.artColors[2]" opacity="0.15" :filter="`url(#soft-${card.id})`" />
        <circle cx="0" cy="0" r="32" :fill="card.artColors[1]" opacity="0.35" />
        <circle cx="0" cy="0" r="18" :fill="card.artColors[0]" opacity="0.85" />
        <circle cx="0" cy="0" r="9"  fill="#ffffff" opacity="0.95" />
        <!-- 8 spikes -->
        <g v-for="i in 8" :key="i" :transform="`rotate(${i * 45})`">
          <line x1="0" y1="-22" x2="0" y2="-75"
            :stroke="card.artColors[0]" stroke-width="1.5" stroke-linecap="round" opacity="0.50" />
          <line x1="0" y1="-22" x2="0" y2="-52"
            :stroke="card.artColors[4]" stroke-width="0.8" stroke-linecap="round" opacity="0.90" />
        </g>
        <!-- Outer glow ring -->
        <circle cx="0" cy="0" r="70" fill="none" :stroke="card.artColors[1]" stroke-width="0.5" opacity="0.30" />
        <circle cx="0" cy="0" r="90" fill="none" :stroke="card.artColors[2]" stroke-width="0.3" opacity="0.15" />
      </g>

      <!-- 2: Wormhole Conduit — E8 octagon + spiral -->
      <g v-else-if="card.id === 2" :transform="`translate(140, 151)`">
        <!-- Outer rings -->
        <circle cx="0" cy="0" r="90" fill="none" :stroke="card.artColors[2]" stroke-width="0.4" opacity="0.20" />
        <circle cx="0" cy="0" r="68" fill="none" :stroke="card.artColors[0]" stroke-width="0.6" opacity="0.25" />
        <!-- E8 octagon (8 nodes at equal angles) -->
        <g v-for="i in 8" :key="i">
          <circle :cx="Math.cos(i * Math.PI/4) * 55" :cy="Math.sin(i * Math.PI/4) * 55" r="5"
            :fill="card.artColors[0]" opacity="0.85" />
          <!-- Connect to adjacent nodes -->
          <line
            :x1="Math.cos(i * Math.PI/4) * 55" :y1="Math.sin(i * Math.PI/4) * 55"
            :x2="Math.cos((i+1) * Math.PI/4) * 55" :y2="Math.sin((i+1) * Math.PI/4) * 55"
            :stroke="card.artColors[2]" stroke-width="0.8" opacity="0.55" />
          <!-- Connect to centre -->
          <line x1="0" y1="0"
            :x2="Math.cos(i * Math.PI/4) * 55" :y2="Math.sin(i * Math.PI/4) * 55"
            :stroke="card.artColors[0]" stroke-width="0.4" opacity="0.30" />
        </g>
        <!-- Central portal -->
        <circle cx="0" cy="0" r="20" :fill="card.artColors[4]" opacity="0.50" :filter="`url(#soft-${card.id})`" />
        <circle cx="0" cy="0" r="12" :fill="card.artColors[2]" opacity="0.70" />
        <circle cx="0" cy="0" r="5"  fill="#ffffff" opacity="0.90" />
        <!-- Spiral -->
        <path :d="spiralPath(30, 3)" :stroke="card.artColors[0]" stroke-width="0.8" fill="none" opacity="0.40" />
      </g>

      <!-- 3: Cosmic Web — filament network -->
      <g v-else-if="card.id === 3">
        <g v-for="(node, i) in webNodes" :key="i">
          <circle :cx="node.x" :cy="node.y" :r="node.r"
            :fill="card.artColors[i % 3]" :opacity="node.r > 5 ? 0.75 : 0.45" />
        </g>
        <g v-for="(edge, i) in webEdges" :key="i">
          <line :x1="edge.x1" :y1="edge.y1" :x2="edge.x2" :y2="edge.y2"
            :stroke="card.artColors[0]" stroke-width="0.5" opacity="0.22" />
        </g>
        <!-- Milky Way marker -->
        <circle cx="140" cy="151" r="7" :fill="card.artColors[3]" opacity="0.90" />
        <circle cx="140" cy="151" r="14" fill="none" :stroke="card.artColors[3]" stroke-width="0.6" opacity="0.45" />
      </g>

      <!-- 4: Habitable World — planet with HZ ring -->
      <g v-else-if="card.id === 4" :transform="`translate(140, 151)`">
        <!-- HZ band -->
        <circle cx="0" cy="0" r="88" fill="none" :stroke="card.artColors[0]" stroke-width="6" opacity="0.10" stroke-dasharray="3,3" />
        <!-- Planet -->
        <circle cx="0" cy="0" r="42" :fill="card.artColors[1]" opacity="0.90" />
        <!-- Landmass shapes -->
        <ellipse cx="-8" cy="-15" rx="14" ry="10" :fill="card.artColors[2]" opacity="0.75" transform="rotate(-25)" />
        <ellipse cx="12" cy="8"  rx="10" ry="7"  :fill="card.artColors[2]" opacity="0.70" transform="rotate(15)" />
        <ellipse cx="-5" cy="18" rx="8"  ry="5"  :fill="card.artColors[2]" opacity="0.60" />
        <!-- Atmosphere glow -->
        <circle cx="0" cy="0" r="46" fill="none" :stroke="card.artColors[3]" stroke-width="4" opacity="0.20" :filter="`url(#soft-${card.id})`" />
        <!-- Host star -->
        <circle cx="80" cy="-70" r="12" fill="#fff4ea" opacity="0.85" />
        <circle cx="80" cy="-70" r="20" fill="#fff4ea" opacity="0.15" :filter="`url(#soft-${card.id})`" />
        <!-- Orbital path -->
        <circle cx="0" cy="0" r="88" fill="none" :stroke="card.artColors[4]" stroke-width="0.4" opacity="0.20" stroke-dasharray="2,4" />
      </g>

      <!-- 5: Binary Dance — two stars spiral -->
      <g v-else-if="card.id === 5" :transform="`translate(140, 151)`">
        <!-- Orbital trail -->
        <ellipse cx="0" cy="0" rx="58" ry="28" fill="none"
          :stroke="card.artColors[0]" stroke-width="0.6" opacity="0.20" stroke-dasharray="3,5" transform="rotate(-20)" />
        <!-- Star A — larger, amber -->
        <circle cx="-38" cy="12" r="24" :fill="card.artColors[0]" opacity="0.80" />
        <circle cx="-38" cy="12" r="32" :fill="card.artColors[0]" opacity="0.12" :filter="`url(#soft-${card.id})`" />
        <circle cx="-38" cy="12" r="8"  fill="#ffffff" opacity="0.85" />
        <!-- Star B — smaller, cooler orange -->
        <circle cx="42" cy="-10" r="16" :fill="card.artColors[1]" opacity="0.80" />
        <circle cx="42" cy="-10" r="24" :fill="card.artColors[1]" opacity="0.14" :filter="`url(#soft-${card.id})`" />
        <circle cx="42" cy="-10" r="6"  fill="#ffffff" opacity="0.80" />
        <!-- Barycentre -->
        <circle cx="0" cy="0" r="2" fill="rgba(255,255,255,0.40)" />
      </g>

      <!-- 6: The Void — sparse, dark, ominous -->
      <g v-else-if="card.id === 6">
        <!-- Void darkness -->
        <rect x="10" y="46" width="260" height="210" rx="6" fill="#000000" opacity="0.60" />
        <!-- Edge particle scatter -->
        <g v-for="p in voidParticles" :key="p.x">
          <circle :cx="p.x" :cy="p.y" :r="p.r" :fill="card.artColors[2]" :opacity="p.o" />
        </g>
        <!-- Central void symbol -->
        <circle cx="140" cy="151" r="35" fill="none"
          :stroke="card.artColors[2]" stroke-width="0.4" opacity="0.20" stroke-dasharray="2,6" />
        <circle cx="140" cy="151" r="18" fill="none"
          :stroke="card.artColors[2]" stroke-width="0.3" opacity="0.15" />
        <text x="140" y="157" font-family="'Courier New', monospace" font-size="9"
          fill="rgba(80,60,120,0.50)" text-anchor="middle" letter-spacing="0.15em">
          ∅
        </text>
      </g>

      <!-- 7: The Nebula — colorful gas blobs -->
      <g v-else-if="card.id === 7" :clip-path="`url(#art-clip-${card.id})`">
        <defs>
          <clipPath :id="`art-clip-${card.id}`">
            <rect x="10" y="46" width="260" height="210" rx="6" />
          </clipPath>
        </defs>
        <ellipse cx="100" cy="130" rx="70" ry="55" :fill="card.artColors[0]" opacity="0.28" :filter="`url(#soft-${card.id})`" />
        <ellipse cx="175" cy="165" rx="65" ry="50" :fill="card.artColors[1]" opacity="0.24" :filter="`url(#soft-${card.id})`" />
        <ellipse cx="140" cy="145" rx="45" ry="38" :fill="card.artColors[2]" opacity="0.22" :filter="`url(#soft-${card.id})`" />
        <ellipse cx="115" cy="175" rx="40" ry="30" :fill="card.artColors[3]" opacity="0.20" :filter="`url(#soft-${card.id})`" />
        <!-- Embedded stars -->
        <circle v-for="s in nebulaStars" :key="s.x" :cx="s.x" :cy="s.y" :r="s.r" fill="#ffffff" :opacity="s.o" />
        <!-- Dense core -->
        <circle cx="140" cy="151" r="12" fill="#ffffff" opacity="0.15" :filter="`url(#soft-${card.id})`" />
      </g>

      <!-- 8: Red Dwarf Companion — small star, large dark planet -->
      <g v-else-if="card.id === 8" :transform="`translate(140, 151)`">
        <!-- Background glow -->
        <circle cx="0" cy="0" r="95" :fill="card.artColors[0]" opacity="0.06" :filter="`url(#soft-${card.id})`" />
        <!-- Dark planet silhouette (large) -->
        <circle cx="30" cy="20" r="58" fill="#050000" opacity="0.95" />
        <!-- Red dwarf star (small but bright) -->
        <circle cx="-52" cy="-38" r="22" :fill="card.artColors[0]" opacity="0.90" />
        <circle cx="-52" cy="-38" r="30" :fill="card.artColors[0]" opacity="0.22" :filter="`url(#soft-${card.id})`" />
        <circle cx="-52" cy="-38" r="9"  fill="#ffaa88" opacity="0.95" />
        <!-- Terminator glow on planet edge -->
        <circle cx="30" cy="20" r="60" fill="none"
          :stroke="card.artColors[2]" stroke-width="3" opacity="0.25"
          :filter="`url(#soft-${card.id})`" />
        <!-- Orbital ring hint -->
        <ellipse cx="0" cy="0" rx="85" ry="30" fill="none"
          :stroke="card.artColors[2]" stroke-width="0.4" opacity="0.15" transform="rotate(-15)" stroke-dasharray="2,5" />
      </g>

      <!-- 9: Settlement Pioneer — dome + stone circle -->
      <g v-else-if="card.id === 9" :transform="`translate(140, 170)`">
        <!-- Stars background -->
        <circle v-for="s in settlementStars" :key="s.x" :cx="s.x" :cy="s.y" :r="s.r" fill="#ffffff" :opacity="s.o" />
        <!-- Terrain -->
        <ellipse cx="0" cy="40" rx="110" ry="18" :fill="card.artColors[1]" opacity="0.18" />
        <!-- Stone circle (8 stones) -->
        <g v-for="i in 8" :key="i">
          <rect
            :x="Math.cos(i * Math.PI/4) * 55 - 3"
            :y="Math.sin(i * Math.PI/4) * 18 + 30 - 8"
            width="5" height="9" rx="1"
            :fill="card.artColors[3]" opacity="0.60" />
        </g>
        <!-- Dome -->
        <path d="M -50 35 A 50 50 0 0 1 50 35 Z" :fill="card.artColors[0]" opacity="0.20" />
        <path d="M -50 35 A 50 50 0 0 1 50 35" fill="none" :stroke="card.artColors[0]" stroke-width="1.5" opacity="0.70" />
        <!-- Dome base ring -->
        <ellipse cx="0" cy="35" rx="50" ry="6" fill="none" :stroke="card.artColors[0]" stroke-width="0.8" opacity="0.45" />
        <!-- Library beacon -->
        <rect x="-4" y="15" width="8" height="16" rx="1" :fill="card.artColors[2]" opacity="0.65" />
        <circle cx="0" cy="12" r="3" :fill="card.artColors[3]" opacity="0.85" />
        <!-- Dome glow -->
        <path d="M -50 35 A 50 50 0 0 1 50 35 Z" :fill="card.artColors[0]" opacity="0.05" :filter="`url(#soft-${card.id})`" />
      </g>

      <!-- 10: The Mule — knowledge web nodes -->
      <g v-else-if="card.id === 10" :transform="`translate(140, 151)`">
        <!-- Central mule entity -->
        <circle cx="0" cy="0" r="20" :fill="card.artColors[0]" opacity="0.85" :filter="`url(#soft-${card.id})`" />
        <circle cx="0" cy="0" r="12" :fill="card.artColors[1]" opacity="0.90" />
        <circle cx="0" cy="0" r="5"  fill="#ffffff" opacity="0.95" />
        <!-- Knowledge rays (corpus depth indicator) -->
        <g v-for="i in 12" :key="i" :transform="`rotate(${i * 30})`">
          <line x1="0" y1="-24" :x2="0" :y2="-35 - (i % 3) * 8"
            :stroke="card.artColors[0]" stroke-width="1.0" opacity="0.55" stroke-linecap="round" />
          <!-- Corpus nodes at tips -->
          <circle cx="0" :cy="-38 - (i % 3) * 8" r="2.5"
            :fill="card.artColors[i % 5 === 0 ? 1 : 0]" opacity="0.75" />
        </g>
        <!-- Outer orbit ring -->
        <circle cx="0" cy="0" r="65" fill="none"
          :stroke="card.artColors[2]" stroke-width="0.4" opacity="0.20" stroke-dasharray="2,4" />
        <!-- PON INK symbol -->
        <text x="0" y="5" font-family="'Courier New', monospace" font-size="6"
          fill="rgba(0,0,0,0.70)" text-anchor="middle">M</text>
      </g>

      <!-- 11: Water Quality — wave + data -->
      <g v-else-if="card.id === 11" :transform="`translate(140, 151)`">
        <!-- Water background -->
        <ellipse cx="0" cy="20" rx="95" ry="60" :fill="card.artColors[1]" opacity="0.18" :filter="`url(#soft-${card.id})`" />
        <!-- Wave paths -->
        <path d="M -100 -10 Q -65 -30 -25 -10 Q 15 10 55 -10 Q 90 -30 100 -10" fill="none"
          :stroke="card.artColors[0]" stroke-width="2.0" opacity="0.65" stroke-linecap="round" />
        <path d="M -100 8 Q -65 -12 -25 8 Q 15 28 55 8 Q 90 -12 100 8" fill="none"
          :stroke="card.artColors[2]" stroke-width="1.5" opacity="0.45" stroke-linecap="round" />
        <path d="M -100 26 Q -65 6 -25 26 Q 15 46 55 26 Q 90 6 100 26" fill="none"
          :stroke="card.artColors[0]" stroke-width="1.0" opacity="0.30" stroke-linecap="round" />
        <!-- Droplet -->
        <path d="M 0 -60 C -15 -35 -22 -20 -22 -8 A 22 22 0 0 0 22 -8 C 22 -20 15 -35 0 -60 Z"
          :fill="card.artColors[2]" opacity="0.70" />
        <circle cx="0" cy="-14" r="6" fill="#ffffff" opacity="0.25" />
        <!-- pH label -->
        <text x="-65" y="55" font-family="'Courier New', monospace" font-size="8"
          :fill="card.artColors[0]" opacity="0.70" letter-spacing="0.08em">pH 7.1</text>
        <text x="20" y="55" font-family="'Courier New', monospace" font-size="8"
          :fill="card.artColors[2]" opacity="0.65" letter-spacing="0.05em">✓ POTABLE</text>
      </g>

      <!-- ══ EDITION 2: Anti-AI Slop Drop (IDs 12–22) ═══════════════════════ -->

      <!-- 12: The Field Reading — data table grid with real measurements -->
      <g v-else-if="card.id === 12" :transform="`translate(140, 151)`">
        <!-- Grid background -->
        <rect x="-95" y="-80" width="190" height="160" rx="3" fill="rgba(0,0,0,0.40)" />
        <!-- Column headers -->
        <rect x="-95" y="-80" width="190" height="20" rx="3" :fill="card.artColors[0]" opacity="0.30" />
        <text x="-80" y="-66" font-family="'Courier New', monospace" font-size="7" :fill="card.artColors[0]" opacity="0.90" letter-spacing="0.08em">PARAMETER</text>
        <text x="20"  y="-66" font-family="'Courier New', monospace" font-size="7" :fill="card.artColors[0]" opacity="0.90" letter-spacing="0.06em">VALUE</text>
        <text x="78"  y="-66" font-family="'Courier New', monospace" font-size="7" :fill="card.artColors[0]" opacity="0.90" letter-spacing="0.04em">STATUS</text>
        <!-- Data rows -->
        <g v-for="(row, i) in [
          ['pH',          '7.1',    '✓'],
          ['Turbidity',   '0.3 NTU','✓'],
          ['Conductivity','280 µS', '✓'],
          ['Nitrate',     '2.1 mg/L','✓'],
          ['Coliform',    '0 CFU',  '✓'],
          ['Temp (°C)',   '22.4',   '✓'],
        ]" :key="i">
          <rect x="-95" :y="-57 + i*20" width="190" height="19"
            :fill="i%2===0 ? 'rgba(0,80,40,0.12)' : 'rgba(0,0,0,0.05)'" />
          <text x="-82" :y="-43 + i*20" font-family="'Courier New', monospace" font-size="7.5" :fill="card.artColors[2]" opacity="0.80">{{ row[0] }}</text>
          <text x="20"  :y="-43 + i*20" font-family="'Courier New', monospace" font-size="7.5" fill="rgba(200,240,210,0.85)">{{ row[1] }}</text>
          <text x="78"  :y="-43 + i*20" font-family="'Courier New', monospace" font-size="9" :fill="card.artColors[0]" opacity="0.85">{{ row[2] }}</text>
        </g>
        <!-- GPS tag -->
        <text x="0" y="92" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[1]" opacity="0.60" text-anchor="middle" letter-spacing="0.06em">GPS: −2.2887°, 40.9162° · VERIFIED</text>
      </g>

      <!-- 13: The Living Verse — poetry on the page, recorded or written -->
      <g v-else-if="card.id === 13">
        <!-- Soft page background -->
        <rect x="22" y="52" width="235" height="205" rx="4"
          fill="rgba(30,10,40,0.45)" />

        <!-- Verse lines — varying indent and length, like real stanzas -->
        <!-- Stanza 1 -->
        <g v-for="(ln, i) in [
          { x: 35,  w: 155, indent: false },
          { x: 35,  w: 190, indent: false },
          { x: 55,  w: 140, indent: true  },
          { x: 35,  w: 170, indent: false },
        ]" :key="'s1-' + i">
          <rect :x="ln.x" :y="72 + i * 15" :width="ln.w" height="5" rx="2"
            :fill="ln.indent ? card.artColors[1] : card.artColors[0]"
            :opacity="ln.indent ? 0.45 : 0.62" />
        </g>

        <!-- Breath gap between stanzas — the pause that means something -->
        <line x1="35" y1="138" x2="90" y2="138"
          :stroke="card.artColors[1]" stroke-width="0.6" opacity="0.30" stroke-dasharray="2,4" />

        <!-- Stanza 2 -->
        <g v-for="(ln, i) in [
          { x: 35, w: 175, indent: false },
          { x: 35, w: 120, indent: false },
          { x: 55, w: 160, indent: true  },
          { x: 55, w: 145, indent: true  },
          { x: 35, w: 90,  indent: false },
        ]" :key="'s2-' + i">
          <rect :x="ln.x" :y="150 + i * 15" :width="ln.w" height="5" rx="2"
            :fill="ln.indent ? card.artColors[1] : card.artColors[0]"
            :opacity="ln.indent ? 0.42 : 0.58" />
        </g>

        <!-- Stanza 3 (shorter — trailing off) -->
        <g v-for="(ln, i) in [
          { x: 35, w: 160 },
          { x: 35, w: 70  },
        ]" :key="'s3-' + i">
          <rect :x="ln.x" :y="232 + i * 15" :width="ln.w" height="5" rx="2"
            :fill="card.artColors[0]" :opacity="0.35 - i * 0.10" />
        </g>

        <!-- Recording microphone — verse spoken aloud, not just written -->
        <g :transform="`translate(215, 210)`">
          <!-- Mic body -->
          <rect x="-7" y="-24" width="14" height="26" rx="7"
            fill="none" :stroke="card.artColors[0]" stroke-width="1.4" opacity="0.60" />
          <!-- Mic grille lines -->
          <line x1="-5" y1="-18" x2="5" y2="-18" :stroke="card.artColors[0]" stroke-width="0.7" opacity="0.40" />
          <line x1="-6" y1="-12" x2="6" y2="-12" :stroke="card.artColors[0]" stroke-width="0.7" opacity="0.40" />
          <line x1="-6" y1="-6"  x2="6" y2="-6"  :stroke="card.artColors[0]" stroke-width="0.7" opacity="0.40" />
          <!-- Stand -->
          <line x1="0" y1="2" x2="0" y2="12" :stroke="card.artColors[0]" stroke-width="1.2" opacity="0.50" />
          <line x1="-8" y1="12" x2="8" y2="12" :stroke="card.artColors[0]" stroke-width="1.2" opacity="0.50" stroke-linecap="round" />
          <!-- Soft glow -->
          <circle cx="0" cy="-11" r="14" :fill="card.artColors[1]" opacity="0.06"
            :filter="`url(#soft-${card.id})`" />
        </g>

        <!-- Caption -->
        <text x="140" y="244" font-family="'Courier New', monospace" font-size="6.5"
          :fill="card.artColors[1]" opacity="0.60" text-anchor="middle" letter-spacing="0.10em">
          HONOUR THE RHYME  ·  HONOUR THE VERSE
        </text>
      </g>

      <!-- 14: The Raw Take — audio waveform -->
      <g v-else-if="card.id === 14" :transform="`translate(140, 151)`">
        <!-- Timeline -->
        <line x1="-95" y1="0" x2="95" y2="0" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" />
        <!-- Waveform bars — irregular heights simulate real recording -->
        <g v-for="(h, i) in [8,22,14,35,18,52,28,65,44,58,35,72,48,60,38,55,42,68,30,75,52,40,62,28,45,58,33,22,48,35,25,40,18,30,12,22,8,16,10,6]" :key="i">
          <rect
            :x="-90 + i*4.7" :y="-h/2"
            width="3.5" :height="h"
            :fill="card.artColors[0]"
            :opacity="h > 60 ? 0.85 : h > 40 ? 0.65 : 0.45"
            rx="1"
          />
        </g>
        <!-- Chair creak annotation -->
        <line x1="25" y1="-80" x2="25" y2="-38" :stroke="card.artColors[1]" stroke-width="0.8" stroke-dasharray="2,3" opacity="0.50" />
        <text x="28" y="-82" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[1]" opacity="0.65" letter-spacing="0.06em">chair creak</text>
        <text x="28" y="-74" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[1]" opacity="0.50">2m 08s (real)</text>
        <!-- Duration -->
        <text x="0" y="70" font-family="'Courier New', monospace" font-size="8" :fill="card.artColors[2]" opacity="0.60" text-anchor="middle" letter-spacing="0.10em">3m 41s  ·  WAV 48kHz  ·  TAKE 1</text>
      </g>

      <!-- 15: Cipher Tongue — overlapping text blocks -->
      <g v-else-if="card.id === 15">
        <!-- Text blocks in multiple scripts/languages at different angles -->
        <text x="30"  y="110" font-family="'Courier New', monospace" font-size="12" :fill="card.artColors[0]" opacity="0.65" transform="rotate(-12, 30, 110)">Habari yako</text>
        <text x="80"  y="140" font-family="'Courier New', monospace" font-size="11" :fill="card.artColors[1]" opacity="0.55" transform="rotate(8, 80, 140)">wha gwaan</text>
        <text x="15"  y="165" font-family="'Courier New', monospace" font-size="10" :fill="card.artColors[2]" opacity="0.60" transform="rotate(-5, 15, 165)">niaje</text>
        <text x="100" y="120" font-family="'Courier New', monospace" font-size="9"  :fill="card.artColors[0]" opacity="0.45" transform="rotate(15, 100, 120)">sawa sawa</text>
        <text x="45"  y="185" font-family="'Courier New', monospace" font-size="13" :fill="card.artColors[1]" opacity="0.50" transform="rotate(-8, 45, 185)">irie</text>
        <text x="120" y="170" font-family="'Courier New', monospace" font-size="8"  :fill="card.artColors[2]" opacity="0.55" transform="rotate(20, 120, 170)">mambo vipi</text>
        <text x="60"  y="220" font-family="'Courier New', monospace" font-size="11" :fill="card.artColors[0]" opacity="0.45" transform="rotate(-15, 60, 220)">nini hali</text>
        <text x="30"  y="245" font-family="'Courier New', monospace" font-size="9"  :fill="card.artColors[1]" opacity="0.40" transform="rotate(5, 30, 245)">big up</text>
        <!-- Overlay scan effect -->
        <rect x="10" y="46" width="260" height="210" fill="none" :stroke="card.artColors[2]" stroke-width="0.3" opacity="0.15" rx="4" />
      </g>

      <!-- 16: Callus Print — proper ulnar loop dermoglyph specimen -->
      <g v-else-if="card.id === 16" :transform="`translate(138, 152)`">

        <!-- Callus zone wash — right side of loop where ridges meet the tool -->
        <radialGradient id="callus-wash" cx="68%" cy="50%" r="45%">
          <stop offset="0%"   :stop-color="card.artColors[2]" stop-opacity="0.13"/>
          <stop offset="100%" :stop-color="card.artColors[2]" stop-opacity="0"/>
        </radialGradient>
        <ellipse cx="28" cy="0" rx="60" ry="78" fill="url(#callus-wash)"/>

        <!-- Faint forensic reference grid -->
        <line x1="-82" y1="0"  x2="82" y2="0"  :stroke="card.artColors[3]" stroke-width="0.35" opacity="0.14" stroke-dasharray="2,5"/>
        <line x1="0"  y1="-90" x2="0"  y2="90"  :stroke="card.artColors[3]" stroke-width="0.35" opacity="0.14" stroke-dasharray="2,5"/>

        <!--
          Loop ridges — ulnar loop, opens to the right.
          Each is an SVG arc: M sx sy A rx ry 0 1 1 sx ey
          (large-arc=1, sweep=1 = clockwise around the right side)
          Ridges i≥8 enter the callus zone (lighter, slightly thicker).
        -->
        <!-- i=0 inner -->
        <path d="M -7.9 5.0  A  8  10 0 1 1 -7.9  -5.0"  fill="none" :stroke="card.artColors[0]" stroke-width="1.05" opacity="0.62"/>
        <!-- i=1 -->
        <path d="M -13.5 8.0  A 13  16 0 1 1 -13.5  -8.0"  fill="none" :stroke="card.artColors[0]" stroke-width="1.05" opacity="0.64"/>
        <!-- i=2 -->
        <path d="M -19.0 11.0 A 18  22 0 1 1 -19.0 -11.0" fill="none" :stroke="card.artColors[0]" stroke-width="1.10" opacity="0.66"/>
        <!-- i=3 -->
        <path d="M -24.5 14.0 A 23  28 0 1 1 -24.5 -14.0" fill="none" :stroke="card.artColors[0]" stroke-width="1.10" opacity="0.67"/>
        <!-- i=4 -->
        <path d="M -30.1 17.0 A 28  34 0 1 1 -30.1 -17.0" fill="none" :stroke="card.artColors[0]" stroke-width="1.15" opacity="0.68"/>
        <!-- i=5 -->
        <path d="M -35.6 20.0 A 33  40 0 1 1 -35.6 -20.0" fill="none" :stroke="card.artColors[0]" stroke-width="1.15" opacity="0.68"/>
        <!-- i=6 -->
        <path d="M -41.1 23.0 A 38  46 0 1 1 -41.1 -23.0" fill="none" :stroke="card.artColors[0]" stroke-width="1.20" opacity="0.67"/>
        <!-- i=7 -->
        <path d="M -46.6 26.0 A 43  52 0 1 1 -46.6 -26.0" fill="none" :stroke="card.artColors[0]" stroke-width="1.20" opacity="0.65"/>
        <!-- i=8  — callus zone begins: slightly lighter, thicker ridges -->
        <path d="M -52.2 29.0 A 48  58 0 1 1 -52.2 -29.0" fill="none" :stroke="card.artColors[2]" stroke-width="1.55" opacity="0.60"/>
        <!-- i=9 -->
        <path d="M -57.7 32.0 A 53  64 0 1 1 -57.7 -32.0" fill="none" :stroke="card.artColors[2]" stroke-width="1.60" opacity="0.58"/>
        <!-- i=10 -->
        <path d="M -63.2 35.0 A 58  70 0 1 1 -63.2 -35.0" fill="none" :stroke="card.artColors[2]" stroke-width="1.65" opacity="0.55"/>
        <!-- i=11 -->
        <path d="M -68.8 38.0 A 63  76 0 1 1 -68.8 -38.0" fill="none" :stroke="card.artColors[2]" stroke-width="1.70" opacity="0.50"/>
        <!-- i=12 outer -->
        <path d="M -74.3 41.0 A 68  82 0 1 1 -74.3 -41.0" fill="none" :stroke="card.artColors[2]" stroke-width="1.75" opacity="0.44"/>

        <!-- Delta region — triangular ridge junction at lower-right -->
        <polygon points="42,-64 49,-55 35,-55"
          fill="none" :stroke="card.artColors[1]" stroke-width="0.9" opacity="0.42"/>
        <!-- Delta cross-lines -->
        <line x1="35" y1="-55" x2="22" y2="-45" :stroke="card.artColors[1]" stroke-width="0.7" opacity="0.30"/>
        <line x1="49" y1="-55" x2="58" y2="-45" :stroke="card.artColors[1]" stroke-width="0.7" opacity="0.30"/>

        <!-- Loop core — small closed oval at apex of the loop, tight inner marker -->
        <ellipse cx="0" cy="-2" rx="5" ry="7"
          fill="none" :stroke="card.artColors[0]" stroke-width="1.0" opacity="0.72"/>
        <circle cx="0" cy="-2" r="2.2" :fill="card.artColors[0]" opacity="0.55"/>

        <!-- ── Minutiae markers ─────────────────────────────────────────── -->
        <!-- Bifurcation 1 — ridge 4 forks at upper-right arc -->
        <path d="M 22 -27 L 28 -27 L 31 -33"
          fill="none" :stroke="card.artColors[3]" stroke-width="1.3" opacity="0.58" stroke-linecap="round"/>
        <path d="M 28 -27 L 31 -21"
          fill="none" :stroke="card.artColors[3]" stroke-width="1.3" opacity="0.58" stroke-linecap="round"/>

        <!-- Bifurcation 2 — ridge 7, left lower arc -->
        <path d="M -42 20 L -36 17 L -32 22"
          fill="none" :stroke="card.artColors[3]" stroke-width="1.3" opacity="0.52" stroke-linecap="round"/>
        <path d="M -36 17 L -33 12"
          fill="none" :stroke="card.artColors[3]" stroke-width="1.3" opacity="0.52" stroke-linecap="round"/>

        <!-- Bifurcation 3 — callus zone, ridge 9 upper -->
        <path d="M 30 -51 L 36 -51 L 39 -57"
          fill="none" :stroke="card.artColors[3]" stroke-width="1.2" opacity="0.45" stroke-linecap="round"/>
        <path d="M 36 -51 L 39 -45"
          fill="none" :stroke="card.artColors[3]" stroke-width="1.2" opacity="0.45" stroke-linecap="round"/>

        <!-- Ridge ending 1 — small circle at terminus of ridge 5 -->
        <circle cx="-34" cy="-20" r="2.2" :fill="card.artColors[3]" opacity="0.50"/>
        <!-- Ridge ending 2 — ridge 11 outer -->
        <circle cx="-68" cy="-38" r="2.2" :fill="card.artColors[3]" opacity="0.42"/>

        <!-- Callus zone bracket annotation -->
        <path d="M 54 -68 L 60 -68 L 60 68 L 54 68"
          fill="none" :stroke="card.artColors[3]" stroke-width="0.65" opacity="0.35"/>
        <text x="63" y="4" font-family="'Courier New', monospace" font-size="5.5"
          :fill="card.artColors[3]" opacity="0.48" text-anchor="start"
          transform="rotate(90, 63, 4)" letter-spacing="0.08em">CALLUS ZONE</text>

        <!-- Magnification label -->
        <text x="-78" y="-74" font-family="'Courier New', monospace" font-size="5.5"
          :fill="card.artColors[3]" opacity="0.50" text-anchor="start" letter-spacing="0.06em">17×</text>

        <!-- Scale bar (bottom right) -->
        <line x1="44" y1="76" x2="68" y2="76" :stroke="card.artColors[1]" stroke-width="0.9" opacity="0.50"/>
        <line x1="44" y1="73" x2="44" y2="79" :stroke="card.artColors[1]" stroke-width="0.9" opacity="0.50"/>
        <line x1="68" y1="73" x2="68" y2="79" :stroke="card.artColors[1]" stroke-width="0.9" opacity="0.50"/>
        <text x="56" y="72" font-family="'Courier New', monospace" font-size="5"
          :fill="card.artColors[1]" opacity="0.45" text-anchor="middle">0.5 mm</text>

        <!-- Classification footer -->
        <text x="0" y="93" font-family="'Courier New', monospace" font-size="6.5"
          :fill="card.artColors[1]" opacity="0.58" text-anchor="middle" letter-spacing="0.10em">
          R.INDEX · ULNAR LOOP · CALLUS MCP3
        </text>
        <text x="0" y="102" font-family="'Courier New', monospace" font-size="5.5"
          :fill="card.artColors[3]" opacity="0.42" text-anchor="middle" letter-spacing="0.08em">
          DERMOGLYPH SPECIMEN · ADAPTIVE RIDGE STRUCTURE
        </text>
      </g>

      <!-- 17: The Circle — people arranged in ring from above -->
      <g v-else-if="card.id === 17" :transform="`translate(140, 151)`">
        <!-- Ground shadow -->
        <circle cx="0" cy="0" r="75" :fill="card.artColors[1]" opacity="0.08" />
        <!-- People (circles) in a ring, 12 positions -->
        <g v-for="i in 12" :key="i">
          <!-- Person body -->
          <circle
            :cx="Math.cos((i-1) * Math.PI/6) * 62"
            :cy="Math.sin((i-1) * Math.PI/6) * 62"
            r="7"
            :fill="card.artColors[i % 3 === 0 ? 2 : i % 3 === 1 ? 0 : 1]"
            :opacity="0.72 + (i % 4) * 0.05"
          />
          <!-- Head -->
          <circle
            :cx="Math.cos((i-1) * Math.PI/6) * 62"
            :cy="Math.sin((i-1) * Math.PI/6) * 62 - 10"
            r="4"
            :fill="card.artColors[i % 3 === 0 ? 2 : i % 3 === 1 ? 0 : 1]"
            :opacity="0.60"
          />
        </g>
        <!-- Central open space marker -->
        <circle cx="0" cy="0" r="38" fill="none" :stroke="card.artColors[0]" stroke-width="0.5" opacity="0.18" stroke-dasharray="3,5" />
        <circle cx="0" cy="0" r="4" :fill="card.artColors[0]" opacity="0.30" />
        <!-- Lines connecting everyone to centre -->
        <g v-for="i in 12" :key="i" opacity="0.07">
          <line x1="0" y1="0"
            :x2="Math.cos((i-1) * Math.PI/6) * 55"
            :y2="Math.sin((i-1) * Math.PI/6) * 55"
            :stroke="card.artColors[0]" stroke-width="0.5" />
        </g>
      </g>

      <!-- 18: Compost Logic — decomposition spiral -->
      <g v-else-if="card.id === 18" :transform="`translate(140, 151)`">
        <!-- Background glow -->
        <circle cx="0" cy="0" r="90" :fill="card.artColors[0]" opacity="0.05" :filter="`url(#soft-${card.id})`" />
        <!-- Spiral path (Archimedean, 2 turns) -->
        <path :d="spiralPath(80, 2)" :stroke="card.artColors[1]" stroke-width="1.5" fill="none" opacity="0.50" />
        <!-- Organic blobs along the spiral -->
        <g v-for="(pt, i) in compostPoints" :key="i">
          <ellipse :cx="pt.x" :cy="pt.y"
            :rx="4 + i * 1.2" :ry="3 + i * 0.9"
            :fill="pt.color" :opacity="pt.o"
            :transform="`rotate(${i * 37}, ${pt.x}, ${pt.y})`"
          />
        </g>
        <!-- Cycle labels -->
        <text x="-30" y="-70" font-family="'Courier New', monospace" font-size="7" :fill="card.artColors[2]" opacity="0.65">FOOD</text>
        <text x="55"  y="20"  font-family="'Courier New', monospace" font-size="7" :fill="card.artColors[2]" opacity="0.65">SCRAPS</text>
        <text x="-80" y="30"  font-family="'Courier New', monospace" font-size="7" :fill="card.artColors[0]" opacity="0.55">SOIL</text>
        <text x="-10" y="75"  font-family="'Courier New', monospace" font-size="7" :fill="card.artColors[1]" opacity="0.60">COMPOST</text>
        <!-- Arrows -->
        <path d="M -25 -60 L -10 -48" :stroke="card.artColors[2]" stroke-width="1" fill="none" opacity="0.40" />
      </g>

      <!-- 19: Street Frequency — radio wave arcs -->
      <g v-else-if="card.id === 19" :transform="`translate(140, 151)`">
        <!-- Antenna mast -->
        <line x1="0" y1="60" x2="0" y2="-20" :stroke="card.artColors[0]" stroke-width="2" opacity="0.80" />
        <line x1="0" y1="-20" x2="-12" y2="-6" :stroke="card.artColors[0]" stroke-width="1.2" opacity="0.65" />
        <line x1="0" y1="-20" x2="12"  y2="-6" :stroke="card.artColors[0]" stroke-width="1.2" opacity="0.65" />
        <!-- Broadcast arcs -->
        <g v-for="(r, i) in [25, 45, 65, 85, 105]" :key="i">
          <path
            :d="`M ${-r * Math.cos(Math.PI*0.35)} ${-r * Math.sin(Math.PI*0.35)} A ${r} ${r} 0 0 1 ${r * Math.cos(Math.PI*0.35)} ${-r * Math.sin(Math.PI*0.35)}`"
            fill="none" :stroke="card.artColors[0]" :stroke-width="1.8 - i * 0.2"
            :opacity="0.65 - i * 0.10" />
        </g>
        <!-- Signal waves leftward (community direction) -->
        <g v-for="(r, i) in [20, 38, 56]" :key="'l' + i">
          <path
            :d="`M ${-r * 0.5} ${-r * 0.1} A ${r} ${r * 0.8} 0 0 0 ${-r} ${r * 0.3}`"
            fill="none" :stroke="card.artColors[1]" stroke-width="0.8" :opacity="0.35 - i * 0.08" />
        </g>
        <text x="0" y="85" font-family="'Courier New', monospace" font-size="7" :fill="card.artColors[1]" opacity="0.60" text-anchor="middle" letter-spacing="0.10em">COMMUNITY RADIO  ·  LOCAL SIGNAL</text>
      </g>

      <!-- 20: Mending Season — cross-stitch / repair grid -->
      <g v-else-if="card.id === 20" :transform="`translate(140, 151)`">
        <!-- Fabric grid base -->
        <g v-for="i in 14" :key="'h' + i">
          <line :x1="-91" :y1="-91 + i*14" :x2="91" :y2="-91 + i*14"
            stroke="rgba(180,120,120,0.12)" stroke-width="0.5" />
        </g>
        <g v-for="i in 14" :key="'v' + i">
          <line :x1="-91 + i*14" y1="-91" :x2="-91 + i*14" y2="91"
            stroke="rgba(180,120,120,0.12)" stroke-width="0.5" />
        </g>
        <!-- Stitch crosses — scattered organic pattern -->
        <g v-for="(s, i) in stitchPoints" :key="i">
          <line :x1="s.x-5" :y1="s.y-5" :x2="s.x+5" :y2="s.y+5"
            :stroke="card.artColors[0]" stroke-width="1.8" opacity="0.75" stroke-linecap="round" />
          <line :x1="s.x+5" :y1="s.y-5" :x2="s.x-5" :y2="s.y+5"
            :stroke="card.artColors[0]" stroke-width="1.8" opacity="0.75" stroke-linecap="round" />
        </g>
        <!-- Running stitch along a tear -->
        <g v-for="(d, i) in [-56,-42,-28,-14,0,14,28,42,56]" :key="'rs' + i">
          <circle v-if="i%2===0" :cx="d" cy="-20" r="2.5" :fill="card.artColors[1]" opacity="0.60" />
        </g>
        <text x="0" y="85" font-family="'Courier New', monospace" font-size="7" :fill="card.artColors[2]" opacity="0.55" text-anchor="middle" letter-spacing="0.10em">REPAIR OVER REPLACEMENT</text>
      </g>

      <!-- 21: The Count — tally marks -->
      <g v-else-if="card.id === 21" :transform="`translate(140, 151)`">
        <!-- Tally groups (|||||) -->
        <g v-for="(row, ri) in [
          [5, 5, 5, 4],
          [5, 5, 3, 0],
          [5, 2, 0, 0],
        ]" :key="ri">
          <g v-for="(count, ci) in row.filter(c => c > 0)" :key="ci">
            <!-- Individual strokes -->
            <g v-for="n in Math.min(count, 4)" :key="n">
              <line
                :x1="-80 + ci * 48 + (n-1) * 8" :y1="-65 + ri * 46"
                :x2="-80 + ci * 48 + (n-1) * 8" :y2="-65 + ri * 46 + 30"
                :stroke="card.artColors[0]" stroke-width="2.5" opacity="0.75" stroke-linecap="round" />
            </g>
            <!-- Diagonal cross for 5th -->
            <line v-if="count >= 5"
              :x1="-84 + ci * 48" :y1="-60 + ri * 46"
              :x2="-84 + ci * 48 + 34" :y2="-35 + ri * 46"
              :stroke="card.artColors[1]" stroke-width="2" opacity="0.80" stroke-linecap="round" />
          </g>
        </g>
        <!-- Total -->
        <rect x="-60" y="50" width="120" height="24" rx="3" :fill="card.artColors[0]" opacity="0.12" />
        <text x="0" y="67" font-family="'Courier New', monospace" font-size="11" :fill="card.artColors[0]" opacity="0.75" text-anchor="middle" letter-spacing="0.12em">TOTAL: 37</text>
        <text x="0" y="88" font-family="'Courier New', monospace" font-size="7" :fill="card.artColors[1]" opacity="0.50" text-anchor="middle" letter-spacing="0.10em">VERIFIED EVENTS ONLY · NO ESTIMATES</text>
      </g>

      <!-- 23: Stardust — stellar nucleosynthesis debris field -->
      <g v-else-if="card.id === 23">
        <!-- Wispy nebula cloud behind dots -->
        <ellipse cx="140" cy="151" rx="110" ry="90"
          :fill="card.artColors[0]" fill-opacity="0.04"/>
        <ellipse cx="100" cy="130" rx="60" ry="50"
          :fill="card.artColors[2]" fill-opacity="0.04"/>
        <!-- Stardust particles — H(white), Na(yellow), Ca(orange), O(blue), Fe(red), C(green) -->
        <g v-for="(d, i) in dustDots" :key="'d'+i">
          <circle :cx="d.x" :cy="d.y" :r="d.r"
            :fill="card.artColors[d.c]" :fill-opacity="d.o"/>
        </g>
        <!-- Element labels near a few prominent dots -->
        <text x="92"  y="95"  font-family="monospace" font-size="6" :fill="card.artColors[0]" opacity="0.65">Na</text>
        <text x="175" y="118" font-family="monospace" font-size="6" :fill="card.artColors[2]" opacity="0.60">O</text>
        <text x="58"  y="155" font-family="monospace" font-size="6" :fill="card.artColors[3]" opacity="0.58">Fe</text>
        <text x="200" y="175" font-family="monospace" font-size="6" :fill="card.artColors[4]" opacity="0.60">C</text>
        <text x="130" y="210" font-family="monospace" font-size="6" :fill="card.artColors[1]" opacity="0.55">Ca</text>
        <text x="60"  y="200" font-family="monospace" font-size="6" :fill="card.artColors[5]" opacity="0.65">H</text>
        <text x="140" y="70"  font-family="monospace" font-size="6" :fill="card.artColors[5]" opacity="0.60">H</text>
        <!-- Caption -->
        <text x="140" y="245" font-family="'Courier New', monospace" font-size="6.5"
          :fill="card.artColors[0]" opacity="0.50" text-anchor="middle" letter-spacing="0.10em">
          STELLAR NUCLEOSYNTHESIS · ⊙ → SN → YOU
        </text>
      </g>

      <!-- 24: Moonbeams — diffracted moonlight rays -->
      <g v-else-if="card.id === 24">
        <!-- Moon disc -->
        <radialGradient id="moon-grd" cx="45%" cy="38%" r="60%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="70%" stop-color="#c8d8f0" stop-opacity="0.80"/>
          <stop offset="100%" stop-color="#6070a0" stop-opacity="0.50"/>
        </radialGradient>
        <circle cx="140" cy="95" r="42" fill="url(#moon-grd)"/>
        <!-- Moon terminator -->
        <path d="M 140 53 A 42 42 0 0 0 140 137" fill="rgba(0,10,30,0.28)"/>
        <!-- Diffraction interference rings around moon -->
        <circle v-for="ri in 5" :key="'mr'+ri" cx="140" cy="95" :r="42 + ri*14"
          fill="none" :stroke="card.artColors[0]" stroke-width="0.4"
          :stroke-opacity="0.12 - ri*0.02"/>
        <!-- Light rays emanating downward from moon -->
        <g v-for="(ray, ri) in moonRays" :key="'ray'+ri" :opacity="ray.o">
          <line :x1="ray.x1" :y1="ray.y1" :x2="ray.x2" :y2="ray.y2"
            :stroke="card.artColors[0]" :stroke-width="ray.w"/>
          <!-- Ray diffraction shimmer lines -->
          <line :x1="ray.x1 + ray.dx" :y1="ray.y1" :x2="ray.x2 + ray.dx*2.5" :y2="ray.y2"
            :stroke="card.artColors[1]" :stroke-width="ray.w*0.4" stroke-opacity="0.35"/>
          <line :x1="ray.x1 - ray.dx" :y1="ray.y1" :x2="ray.x2 - ray.dx*2.5" :y2="ray.y2"
            :stroke="card.artColors[1]" :stroke-width="ray.w*0.4" stroke-opacity="0.35"/>
        </g>
        <!-- Light scatter at the base -->
        <ellipse cx="140" cy="230" rx="80" ry="10"
          :fill="card.artColors[0]" fill-opacity="0.06"/>
        <!-- Illuminance label -->
        <text x="140" y="248" font-family="'Courier New', monospace" font-size="6.5"
          :fill="card.artColors[0]" opacity="0.50" text-anchor="middle" letter-spacing="0.08em">
          0.001 LUX · 384,400 km · REFLECTED
        </text>
      </g>

      <!-- 25: Cosmic Energy — plasma filaments and dark energy field -->
      <g v-else-if="card.id === 25">
        <!-- Dark energy field background haze -->
        <radialGradient id="de-grd" cx="50%" cy="50%" r="60%">
          <stop offset="0%" :stop-color="card.artColors[0]" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <rect x="10" y="46" width="260" height="210" fill="url(#de-grd)"/>
        <!-- Plasma filament arcs — cosmic energy streams -->
        <path v-for="(fil, i) in plasmaFilaments" :key="'pf'+i"
          :d="fil.d" fill="none"
          :stroke="card.artColors[fil.c]"
          :stroke-width="fil.w"
          :stroke-opacity="fil.o"
          stroke-linecap="round"/>
        <!-- Central energy burst -->
        <circle cx="140" cy="151" r="4" :fill="card.artColors[3]" opacity="0.90"/>
        <circle cx="140" cy="151" r="12" fill="none" :stroke="card.artColors[3]" stroke-width="0.6" opacity="0.55"/>
        <circle cx="140" cy="151" r="24" fill="none" :stroke="card.artColors[0]" stroke-width="0.4" opacity="0.30"/>
        <!-- Vacuum energy density annotation -->
        <text x="140" y="245" font-family="'Courier New', monospace" font-size="6.5"
          :fill="card.artColors[0]" opacity="0.55" text-anchor="middle" letter-spacing="0.06em">
          Λ = 1.1 × 10⁻⁵² m⁻² · DARK ENERGY · 68%
        </text>
      </g>

      <!-- 26: Quantum Gravity — warped spacetime grid -->
      <g v-else-if="card.id === 26">
        <!-- Warped horizontal grid lines -->
        <path v-for="(p, i) in gravityHLines" :key="'gh'+i"
          :d="p" fill="none" :stroke="card.artColors[0]"
          :stroke-width="0.55" :stroke-opacity="0.28"/>
        <!-- Warped vertical grid lines -->
        <path v-for="(p, i) in gravityVLines" :key="'gv'+i"
          :d="p" fill="none" :stroke="card.artColors[0]"
          :stroke-width="0.55" :stroke-opacity="0.28"/>
        <!-- Gravitational wave ripples from central mass -->
        <circle v-for="ri in 4" :key="'gwr'+ri"
          cx="140" cy="151" :r="ri*22"
          fill="none" :stroke="card.artColors[4]"
          stroke-width="0.4" :stroke-opacity="0.18 - ri*0.03"/>
        <!-- Central mass -->
        <radialGradient id="mass-grd" cx="40%" cy="38%" r="60%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.90"/>
          <stop offset="40%" :stop-color="card.artColors[0]" stop-opacity="0.80"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
        </radialGradient>
        <circle cx="140" cy="151" r="14" fill="url(#mass-grd)"/>
        <!-- Planck scale label -->
        <text x="10" y="58" font-family="'Courier New', monospace" font-size="5.5"
          :fill="card.artColors[0]" opacity="0.50">ℓₚ = 1.616 × 10⁻³⁵ m</text>
        <text x="140" y="245" font-family="'Courier New', monospace" font-size="6.5"
          :fill="card.artColors[0]" opacity="0.55" text-anchor="middle" letter-spacing="0.06em">
          SPACETIME CURVATURE · Gμν + Λgμν = 8πTμν
        </text>
      </g>

      <!-- 27: Paired Particles — quantum entanglement -->
      <g v-else-if="card.id === 27">
        <!-- Left particle: spin-up (red) -->
        <circle cx="75" cy="151" r="26" :fill="card.artColors[0]" fill-opacity="0.18"
          :stroke="card.artColors[0]" stroke-width="1.2" stroke-opacity="0.70"/>
        <!-- Left spin arrow (up) -->
        <line x1="75" y1="165" x2="75" y2="140" :stroke="card.artColors[0]" stroke-width="2" stroke-opacity="0.80" stroke-linecap="round"/>
        <polyline points="70,145 75,138 80,145" :stroke="card.artColors[0]" stroke-width="1.8" fill="none" stroke-linejoin="round" stroke-opacity="0.80"/>
        <text x="75" y="183" font-family="serif" font-size="13" text-anchor="middle" :fill="card.artColors[0]" opacity="0.80">↑</text>
        <!-- Left particle label -->
        <text x="75" y="128" font-family="'Courier New', monospace" font-size="8"
          text-anchor="middle" :fill="card.artColors[0]" opacity="0.70">A</text>
        <!-- Right particle: spin-down (blue) -->
        <circle cx="205" cy="151" r="26" :fill="card.artColors[1]" fill-opacity="0.18"
          :stroke="card.artColors[1]" stroke-width="1.2" stroke-opacity="0.70"/>
        <!-- Right spin arrow (down) -->
        <line x1="205" y1="137" x2="205" y2="162" :stroke="card.artColors[1]" stroke-width="2" stroke-opacity="0.80" stroke-linecap="round"/>
        <polyline points="200,157 205,164 210,157" :stroke="card.artColors[1]" stroke-width="1.8" fill="none" stroke-linejoin="round" stroke-opacity="0.80"/>
        <text x="205" y="119" font-family="serif" font-size="13" text-anchor="middle" :fill="card.artColors[1]" opacity="0.80">↓</text>
        <!-- Right particle label -->
        <text x="205" y="128" font-family="'Courier New', monospace" font-size="8"
          text-anchor="middle" :fill="card.artColors[1]" opacity="0.70">B</text>
        <!-- Quantum correlation connection (dashed gold) -->
        <line x1="101" y1="151" x2="179" y2="151"
          :stroke="card.artColors[2]" stroke-width="1.0"
          stroke-dasharray="5,4" stroke-opacity="0.70"/>
        <!-- Entanglement "non-local" indicator -->
        <text x="140" y="146" font-family="serif" font-size="9"
          text-anchor="middle" :fill="card.artColors[2]" opacity="0.80">∞</text>
        <!-- State vector notation -->
        <text x="140" y="95" font-family="'Courier New', monospace" font-size="7.5"
          text-anchor="middle" :fill="card.artColors[4]" opacity="0.70">|ψ⟩ = (|↑↓⟩ − |↓↑⟩) / √2</text>
        <!-- Separation indicator -->
        <line x1="75" y1="200" x2="205" y2="200" :stroke="card.artColors[2]" stroke-width="0.5" opacity="0.35"/>
        <text x="140" y="213" font-family="'Courier New', monospace" font-size="6"
          text-anchor="middle" :fill="card.artColors[2]" opacity="0.55">SEPARATION: ANY DISTANCE</text>
        <!-- Probability collapse arrows -->
        <path d="M 50 90 Q 75 70 100 85" fill="none" :stroke="card.artColors[0]" stroke-width="0.6" stroke-opacity="0.40" stroke-dasharray="3,3"/>
        <path d="M 230 90 Q 205 70 180 85" fill="none" :stroke="card.artColors[1]" stroke-width="0.6" stroke-opacity="0.40" stroke-dasharray="3,3"/>
        <text x="50"  y="88" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[0]" opacity="0.50">MEASURE</text>
        <text x="188" y="88" font-family="'Courier New', monospace" font-size="6" :fill="card.artColors[1]" opacity="0.50">COLLAPSE</text>
        <text x="140" y="245" font-family="'Courier New', monospace" font-size="6.5"
          :fill="card.artColors[2]" opacity="0.55" text-anchor="middle" letter-spacing="0.08em">
          SPOOKY ACTION AT A DISTANCE · EPR · BELL
        </text>
      </g>

      <!-- 22: Margin Notes — page with handwritten annotations -->
      <g v-else-if="card.id === 22">
        <!-- Page lines (text) -->
        <g v-for="i in 9" :key="i">
          <line :x1="30" :y1="70 + i * 19" :x2="250" :y2="70 + i * 19"
            stroke="rgba(150,160,180,0.20)" stroke-width="0.8" />
        </g>
        <!-- Margin line -->
        <line x1="38" y1="55" x2="38" y2="225" :stroke="card.artColors[0]" stroke-width="0.8" opacity="0.30" />
        <!-- Margin annotations (handwritten marks) -->
        <text x="12" y="90"  font-family="serif" font-size="9"  :fill="card.artColors[0]" opacity="0.55" transform="rotate(-3)">?</text>
        <text x="14" y="130" font-family="serif" font-size="8"  :fill="card.artColors[1]" opacity="0.50" transform="rotate(2)">✓</text>
        <text x="10" y="165" font-family="serif" font-size="7"  :fill="card.artColors[0]" opacity="0.45" transform="rotate(-4)">see p.47</text>
        <text x="11" y="200" font-family="serif" font-size="8"  :fill="card.artColors[0]" opacity="0.55" transform="rotate(1)">!</text>
        <!-- Underline on one text line -->
        <line x1="55" y1="127" x2="180" y2="127" :stroke="card.artColors[1]" stroke-width="0.8" opacity="0.35" />
        <!-- Circle around a word (line 3) -->
        <ellipse cx="110" cy="109" rx="35" ry="8" fill="none" :stroke="card.artColors[0]" stroke-width="0.7" opacity="0.30" />
        <!-- Dog-eared corner -->
        <path d="M 250 46 L 262 46 L 262 60 Z" :fill="card.artColors[2]" opacity="0.40" />
        <!-- Note in corner -->
        <text x="140" y="235" font-family="'Courier New', monospace" font-size="6.5" :fill="card.artColors[0]" opacity="0.45" text-anchor="middle" letter-spacing="0.08em">AI GENERATES THE PAGE · NOT THE MARGIN</text>
      </g>

    </g><!-- end artwork clip group -->

    <!-- ── TITLE BAND ──────────────────────────────────────────────────────── -->
    <rect x="6" y="260" width="268" height="58" rx="4"
      fill="rgba(0,0,0,0.55)" />

    <text x="140" y="282"
      font-family="'Courier New', monospace" font-size="14"
      font-weight="600" letter-spacing="0.06em"
      :fill="card.borderColor" text-anchor="middle">
      {{ card.name.toUpperCase() }}
    </text>

    <!-- Description excerpt (first 80 chars) -->
    <text x="140" y="296"
      font-family="'Courier New', monospace" font-size="6.5"
      letter-spacing="0.04em" fill="rgba(180,210,230,0.65)" text-anchor="middle">
      {{ card.description.slice(0, 72) }}…
    </text>

    <!-- Rarity bar -->
    <rect x="14" y="306" width="252" height="3" rx="1.5"
      fill="rgba(255,255,255,0.08)" />
    <rect x="14" y="306" :width="rarityBarWidth" height="3" rx="1.5"
      :fill="card.borderColor" opacity="0.65" />

    <!-- ── STATS BAR ───────────────────────────────────────────────────────── -->
    <rect x="6" y="322" width="268" height="64" rx="4"
      fill="rgba(0,0,0,0.45)" />

    <!-- Rarity score -->
    <text x="50" y="340"
      font-family="'Courier New', monospace" font-size="8"
      fill="rgba(150,190,220,0.55)" text-anchor="middle">RARITY</text>
    <text x="50" y="356"
      font-family="'Courier New', monospace" font-size="18"
      font-weight="700" :fill="card.borderColor" text-anchor="middle">
      {{ card.rarityScore }}<tspan font-size="10" opacity="0.55">/10</tspan>
    </text>

    <!-- Edition -->
    <text x="140" y="340"
      font-family="'Courier New', monospace" font-size="8"
      fill="rgba(150,190,220,0.55)" text-anchor="middle">EDITION</text>
    <text x="140" y="356"
      font-family="'Courier New', monospace" font-size="14"
      font-weight="600" fill="rgba(200,230,255,0.80)" text-anchor="middle">
      {{ card.edition }}<tspan font-size="10" opacity="0.45">/{{ card.maxEdition }}</tspan>
    </text>

    <!-- Minted -->
    <text x="228" y="340"
      font-family="'Courier New', monospace" font-size="8"
      fill="rgba(150,190,220,0.55)" text-anchor="middle">MINTED</text>
    <text x="228" y="356"
      font-family="'Courier New', monospace" font-size="18"
      font-weight="700" fill="rgba(200,230,255,0.80)" text-anchor="middle">
      {{ card.mintedCount }}<tspan font-size="10" opacity="0.45">/{{ card.maxEdition }}</tspan>
    </text>

    <!-- Dividers -->
    <line x1="95" y1="328" x2="95" y2="378" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <line x1="185" y1="328" x2="185" y2="378" stroke="rgba(255,255,255,0.08)" stroke-width="1" />

    <!-- Footer: chain + protocol -->
    <text x="140" y="374"
      font-family="'Courier New', monospace" font-size="6"
      letter-spacing="0.12em" fill="rgba(100,140,160,0.45)" text-anchor="middle">
      PON INK v1.0 · EXOTOPIA · GPL v3
    </text>

    <!-- Bottom edge line -->
    <line x1="14" y1="381" x2="266" y2="381"
      :stroke="card.borderColor" stroke-width="0.5" opacity="0.25" />

  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CollectorCard } from 'src/data/collector-cards'
import { RARITY_CONFIG } from 'src/data/collector-cards'

const props = withDefaults(defineProps<{
  card:   CollectorCard
  width?: number
  height?: number
}>(), {
  width:  280,
  height: 392,
})

const { card } = props

// Rarity bar width (0–252 px based on score/10)
const rarityBarWidth = computed(() => Math.round((card.rarityScore / 10) * 252))

// ── Procedural geometry helpers ───────────────────────────────────────────────

function spiralPath(r: number, turns: number): string {
  const steps = 80
  let d = 'M 0 0 '
  for (let i = 1; i <= steps; i++) {
    const t     = i / steps
    const angle = t * Math.PI * 2 * turns
    const radius = t * r
    d += `L ${Math.cos(angle) * radius} ${Math.sin(angle) * radius} `
  }
  return d
}

// Cosmic web node + edge data (card 3)
const webNodes = (() => {
  const nodes: { x: number; y: number; r: number }[] = []
  const seed = 42
  const rng  = (n: number) => ((Math.sin(n * 127.1 + seed) * 43758.5453) % 1 + 1) / 2
  for (let i = 0; i < 18; i++) {
    nodes.push({
      x: 10 + rng(i * 3)     * 260,
      y: 46 + rng(i * 3 + 1) * 210,
      r: 2 + rng(i * 3 + 2) * 7,
    })
  }
  return nodes
})()

const webEdges = (() => {
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = 0; i < webNodes.length - 1; i++) {
    if (i % 3 !== 2) {  // connect ~2/3 of adjacent nodes
      edges.push({ x1: webNodes[i]!.x, y1: webNodes[i]!.y, x2: webNodes[i+1]!.x, y2: webNodes[i+1]!.y })
    }
    if (i % 5 === 0 && i + 4 < webNodes.length) {
      edges.push({ x1: webNodes[i]!.x, y1: webNodes[i]!.y, x2: webNodes[i+4]!.x, y2: webNodes[i+4]!.y })
    }
  }
  return edges
})()

// Void particles (card 6) — scattered near edges
const voidParticles = (() => {
  const pts: { x: number; y: number; r: number; o: number }[] = []
  const rng = (n: number) => ((Math.sin(n * 91.3) * 43758.5) % 1 + 1) / 2
  for (let i = 0; i < 30; i++) {
    const edge = Math.floor(rng(i * 7) * 4)
    let x = 0, y = 0
    if (edge === 0) { x = 10 + rng(i)     * 260; y = 46 + rng(i+1) * 40 }
    if (edge === 1) { x = 10 + rng(i)     * 260; y = 216 - rng(i+1) * 40 }
    if (edge === 2) { x = 10 + rng(i)     * 50;  y = 46 + rng(i+1) * 210 }
    if (edge === 3) { x = 220 + rng(i)    * 50;  y = 46 + rng(i+1) * 210 }
    pts.push({ x, y, r: 0.5 + rng(i+3) * 1.5, o: 0.15 + rng(i+4) * 0.35 })
  }
  return pts
})()

// Nebula embedded stars (card 7)
const nebulaStars = (() => {
  const stars: { x: number; y: number; r: number; o: number }[] = []
  const rng = (n: number) => ((Math.sin(n * 113.7) * 43758.5) % 1 + 1) / 2
  for (let i = 0; i < 22; i++) {
    stars.push({ x: 20 + rng(i*4) * 240, y: 56 + rng(i*4+1) * 190, r: 0.5 + rng(i*4+2) * 1.5, o: 0.3 + rng(i*4+3) * 0.65 })
  }
  return stars
})()

// Compost spiral points (card 18)
const compostPoints = (() => {
  const pts: { x: number; y: number; color: string; o: number }[] = []
  const colors = ['#88cc22', '#446600', '#ccee88', '#664400', '#228800']
  for (let i = 0; i < 14; i++) {
    const t     = i / 13
    const angle = t * Math.PI * 2 * 2
    const r     = 10 + t * 72
    pts.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      color: colors[i % colors.length] ?? colors[0],
      o: 0.35 + t * 0.35,
    })
  }
  return pts
})()

// Stitch points (card 20) — scattered within artwork area
const stitchPoints = (() => {
  const pts: { x: number; y: number }[] = []
  const rng = (n: number) => ((Math.sin(n * 91.3) * 43758.5) % 1 + 1) / 2
  const occupied = new Set<string>()
  for (let i = 0; i < 24; i++) {
    const col = Math.round((rng(i*3)     * 12 - 6)) * 14
    const row = Math.round((rng(i*3 + 1) * 12 - 6)) * 14
    const key = `${col},${row}`
    if (!occupied.has(key)) {
      occupied.add(key)
      pts.push({ x: col, y: row })
    }
  }
  return pts
})()

// ── Cosmic Phenomena edition (cards 23-27) computed data ─────────────────────

// Card 23: Stardust — scattered stellar element particles
const dustDots = (() => {
  const rng = (n: number) => ((Math.sin(n * 127.1) * 43758.5) % 1 + 1) / 2
  // artColors indices: 0=Na(yellow) 1=Ca(orange) 2=O(blue) 3=Fe(red) 4=C(green) 5=H(white)
  const elementWeights = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5]  // more H
  const dots: { x: number; y: number; r: number; o: number; c: number }[] = []
  for (let i = 0; i < 70; i++) {
    // Cloud distribution: more dots near center, fewer at edges
    const angle  = rng(i * 3) * Math.PI * 2
    const radius = 20 + rng(i * 3 + 1) * 100
    const cx     = 140 + Math.cos(angle) * radius * (0.7 + rng(i) * 0.5)
    const cy     = 151 + Math.sin(angle) * radius * 0.7
    if (cx < 15 || cx > 265 || cy < 50 || cy > 255) continue
    dots.push({
      x: cx,
      y: cy,
      r: 0.8 + rng(i * 3 + 2) * 2.8,
      o: 0.30 + rng(i * 7) * 0.60,
      c: elementWeights[Math.floor(rng(i * 11) * elementWeights.length)]!,
    })
  }
  return dots
})()

// Card 24: Moonbeams — 8 diffracted light rays
const moonRays = (() => {
  const rays: { x1: number; y1: number; x2: number; y2: number; w: number; o: number; dx: number }[] = []
  const nRays = 8
  for (let i = 0; i < nRays; i++) {
    const angle = -Math.PI * 0.5 + (i - nRays / 2 + 0.5) * (Math.PI * 0.55 / nRays)
    const intensity = 1 - Math.abs(i - nRays / 2 + 0.5) / (nRays / 2)
    rays.push({
      x1: 140 + Math.cos(angle) * 44,
      y1: 95  + Math.sin(angle) * 44,
      x2: 140 + Math.cos(angle) * 190,
      y2: 95  + Math.sin(angle) * 190,
      w:  0.8 + intensity * 2.8,
      o:  0.12 + intensity * 0.28,
      dx: Math.cos(angle + Math.PI * 0.5) * 6,
    })
  }
  return rays
})()

// Card 25: Cosmic Energy — plasma filament paths
const plasmaFilaments = (() => {
  const rng  = (n: number) => ((Math.sin(n * 91.3) * 43758.5) % 1 + 1) / 2
  const fils: { d: string; c: number; w: number; o: number }[] = []
  const cx = 140, cy = 151
  for (let i = 0; i < 18; i++) {
    const angle  = rng(i * 4) * Math.PI * 2
    const length = 40 + rng(i * 4 + 1) * 100
    const bend   = (rng(i * 4 + 2) - 0.5) * 80
    const ex     = cx + Math.cos(angle) * length
    const ey     = cy + Math.sin(angle) * length
    const mx     = cx + Math.cos(angle + 0.4) * length * 0.5 + Math.cos(angle + Math.PI * 0.5) * bend
    const my     = cy + Math.sin(angle + 0.4) * length * 0.5 + Math.sin(angle + Math.PI * 0.5) * bend
    fils.push({
      d: `M ${cx} ${cy} Q ${mx} ${my} ${ex} ${ey}`,
      c: Math.floor(rng(i * 7) * 4),  // artColors 0-3
      w: 0.5 + rng(i * 3) * 2.0,
      o: 0.25 + rng(i * 5) * 0.55,
    })
    // Secondary branch off the filament
    if (rng(i * 2) > 0.5) {
      const bx = cx + (ex - cx) * 0.5 + Math.cos(angle - 0.6) * length * 0.4
      const by = cy + (ey - cy) * 0.5 + Math.sin(angle - 0.6) * length * 0.4
      fils.push({ d: `M ${mx} ${my} L ${bx} ${by}`, c: (Math.floor(rng(i*9)*4)+1)%4, w: 0.4, o: 0.20 })
    }
  }
  return fils
})()

// Card 26: Quantum Gravity — warped spacetime grid paths
const { gravityHLines, gravityVLines } = (() => {
  const cx = 140, cy = 151, M = 3200, SOFT = 600
  const SAMPLES = 22

  function warp(x: number, y: number): [number, number] {
    const dx = cx - x, dy = cy - y
    const r2  = dx * dx + dy * dy
    const fac = M / ((r2 + SOFT) * Math.sqrt(r2 + SOFT) * 0.018)
    return [x + dx * fac, y + dy * fac]
  }

  const hLines: string[] = []
  for (let row = 0; row <= 10; row++) {
    const y0 = 56 + row * 20
    const pts: string[] = []
    for (let s = 0; s <= SAMPLES; s++) {
      const x0 = 15 + s * (250 / SAMPLES)
      const [wx, wy] = warp(x0, y0)
      pts.push(`${wx.toFixed(1)},${wy.toFixed(1)}`)
    }
    hLines.push('M ' + pts.join(' L '))
  }

  const vLines: string[] = []
  for (let col = 0; col <= 12; col++) {
    const x0 = 15 + col * (250 / 12)
    const pts: string[] = []
    for (let s = 0; s <= SAMPLES; s++) {
      const y0 = 56 + s * (200 / SAMPLES)
      const [wx, wy] = warp(x0, y0)
      pts.push(`${wx.toFixed(1)},${wy.toFixed(1)}`)
    }
    vLines.push('M ' + pts.join(' L '))
  }

  return { gravityHLines: hLines, gravityVLines: vLines }
})()

// Settlement background stars (card 9)
const settlementStars = (() => {
  const stars: { x: number; y: number; r: number; o: number }[] = []
  const rng = (n: number) => ((Math.sin(n * 78.3) * 43758.5) % 1 + 1) / 2
  for (let i = 0; i < 20; i++) {
    stars.push({ x: (rng(i*3) - 0.5) * 220, y: (rng(i*3+1) - 0.5) * 160 - 30, r: 0.4 + rng(i*3+2), o: 0.20 + rng(i) * 0.45 })
  }
  return stars
})()
</script>

<style scoped>
.collector-card {
  display: block;
  transition: transform 0.25s ease, filter 0.25s ease;
}

.collector-card:hover {
  transform: translateY(-4px) scale(1.02);
}

.card-rarity--legendary:hover { filter: drop-shadow(0 8px 24px rgba(255, 215, 0, 0.45)); }
.card-rarity--rare:hover       { filter: drop-shadow(0 8px 20px rgba(68, 136, 255, 0.40)); }
.card-rarity--uncommon:hover   { filter: drop-shadow(0 8px 18px rgba(34, 204, 102, 0.38)); }
.card-rarity--common:hover     { filter: drop-shadow(0 6px 14px rgba(102, 119, 136, 0.30)); }
</style>
