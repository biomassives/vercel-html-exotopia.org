<template>
  <q-page class="mint-page">

    <!-- ════════════════════════════════════════════════════════════════════
         DRY RUN PREVIEW BANNER
         ════════════════════════════════════════════════════════════════════ -->
    <div v-if="isPreview && mintMode === 'surface-deed'" class="preview-banner">
      <div class="pb-left">
        <span class="pb-badge">◈ DRY RUN</span>
        <span class="pb-label">PREVIEW · nothing is saved until you confirm</span>
      </div>
      <div class="pb-addr">
        exo-surface-v1:{{ claimHost }}:{{ claimPlanet }}
        · {{ claimLat >= 0 ? claimLat + '°N' : Math.abs(claimLat) + '°S' }}
        {{ claimLon >= 0 ? claimLon + '°E' : Math.abs(claimLon) + '°W' }}
      </div>
      <div class="pb-actions">
        <button class="pb-btn pb-btn--confirm" @click="confirmFromPreview">
          ⬡ Establish Settlement
        </button>
        <button class="pb-btn pb-btn--back" @click="router.back()">
          ← Back
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════
         CLAIM HERO — shown when arriving from PlanetClaimOverlay
         ════════════════════════════════════════════════════════════════════ -->
    <div v-if="mintMode === 'surface-deed'" class="claim-hero">

      <!-- ── Gold-rush land deed header ─────────────────────────────── -->
      <div class="deed-wrap">
        <svg class="deed-svg" viewBox="0 0 900 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="deed-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#1c0d00"/>
              <stop offset="50%"  stop-color="#150900"/>
              <stop offset="100%" stop-color="#0e0600"/>
            </linearGradient>
            <linearGradient id="deed-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#f0c040"/>
              <stop offset="50%"  stop-color="#d4900c"/>
              <stop offset="100%" stop-color="#c07808"/>
            </linearGradient>
            <linearGradient id="deed-gold-h" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stop-color="#6a3800" stop-opacity="0"/>
              <stop offset="20%"  stop-color="#c8880a"/>
              <stop offset="50%"  stop-color="#f0c040"/>
              <stop offset="80%"  stop-color="#c8880a"/>
              <stop offset="100%" stop-color="#6a3800" stop-opacity="0"/>
            </linearGradient>
            <filter id="deed-glow" x="-0%" y="-20%" width="110%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <!-- Background -->
          <rect x="0" y="0" width="900" height="220" fill="url(#deed-bg)"/>

          <!-- Outer decorative border -->
          <rect x="6" y="6" width="888" height="208" rx="4"
            fill="none" stroke="url(#deed-gold)" stroke-width="1.5" stroke-opacity="0.70"/>
          <!-- Inner border -->
          <rect x="14" y="14" width="872" height="192" rx="3"
            fill="none" stroke="#c8880a" stroke-width="0.6" stroke-opacity="0.45"/>

          <!-- Corner ornaments ─── top-left -->
          <g stroke="#d4900c" stroke-width="1.2" fill="none" opacity="0.80">
            <polyline points="14,36 14,14 36,14"/>
            <polyline points="884,14 906,14 906,36" transform="translate(-22,0)"/>
            <polyline points="14,184 14,206 36,206"/>
            <polyline points="884,206 906,206 906,184" transform="translate(-22,0)"/>
          </g>
          <!-- Corner flourish diamonds -->
          <polygon points="14,14 20,20 14,26 8,20"  fill="#c8880a" opacity="0.55"/>
          <polygon points="886,14 892,20 886,26 880,20" fill="#c8880a" opacity="0.55"/>
          <polygon points="14,194 20,200 14,206 8,200"  fill="#c8880a" opacity="0.55"/>
          <polygon points="886,194 892,200 886,206 880,200" fill="#c8880a" opacity="0.55"/>

          <!-- Authority title -->
          <text x="450" y="40" text-anchor="middle"
            font-family="Georgia, 'Times New Roman', serif"
            font-size="10" letter-spacing="0.28em"
            fill="#a06010" opacity="0.80">EXOTOPIA SETTLEMENT AUTHORITY · PON INK PROTOCOL</text>

          <!-- Gold rule under authority -->
          <rect x="100" y="47" width="700" height="0.8" fill="url(#deed-gold-h)" opacity="0.55"/>

          <!-- DEED main title -->
          <text x="450" y="82" text-anchor="middle" filter="url(#deed-glow)"
            font-family="Georgia, 'Times New Roman', serif"
            font-size="32" font-weight="bold" letter-spacing="0.12em"
            fill="url(#deed-gold)">LETTERS PATENT</text>

          <!-- Subtitle bar -->
          <text x="450" y="100" text-anchor="middle"
            font-family="Georgia, 'Times New Roman', serif"
            font-size="11" letter-spacing="0.22em" fill="#e8a020" opacity="0.88">
            TERRITORIAL LAND DEED · FORTY ACRES AND A MULE
          </text>

          <!-- Gold rule -->
          <rect x="60" y="108" width="780" height="1.0" fill="url(#deed-gold-h)" opacity="0.70"/>

          <!-- Deed body text -->
          <text x="450" y="130" text-anchor="middle"
            font-family="Georgia, 'Times New Roman', serif" font-size="10"
            fill="#c8a060" opacity="0.75" letter-spacing="0.04em">
            Be it known to all that the bearer hereof has established a settlement upon the herein described parcel of virtual land,
          </text>
          <text x="450" y="146" text-anchor="middle"
            font-family="Georgia, 'Times New Roman', serif" font-size="10"
            fill="#c8a060" opacity="0.75" letter-spacing="0.04em">
            to be held in perpetuity under the laws of the PON INK Protocol, GPL v3, and the customs of the Ecommunity DAO.
          </text>

          <!-- Planet + coordinates display -->
          <text x="450" y="170" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="15" font-weight="700"
            fill="#f0c040" letter-spacing="0.08em" filter="url(#deed-glow)">
            {{ claimPlanet }}   ·   {{ claimLat }}° {{ claimLat >= 0 ? 'N' : 'S' }}, {{ Math.abs(claimLon) }}° {{ claimLon >= 0 ? 'E' : 'W' }}
          </text>

          <!-- Bottom rule + seal area -->
          <rect x="60" y="180" width="780" height="0.8" fill="url(#deed-gold-h)" opacity="0.55"/>

          <!-- Left: free to mint badge -->
          <rect x="30" y="188" width="120" height="18" rx="2"
            fill="none" stroke="#448844" stroke-width="0.8" opacity="0.65"/>
          <text x="90" y="200" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="8" letter-spacing="0.12em"
            fill="#66cc66" opacity="0.80">FREE TO MINT · 0 USDC</text>

          <!-- Center: deed number + date -->
          <text x="450" y="198" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="8" letter-spacing="0.10em"
            fill="#8a6020" opacity="0.70">
            DEED NO. EXO-{{ claimHost.slice(0,4).toUpperCase() }}-{{ Math.abs(claimLat * 10).toFixed(0) }}{{ Math.abs(claimLon * 10).toFixed(0) }}
            · ISSUED {{ new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) }}
          </text>

          <!-- Right: resonance split badge -->
          <text x="840" y="198" text-anchor="middle"
            font-family="'Courier New', monospace" font-size="8" letter-spacing="0.06em"
            fill="#8a6020" opacity="0.65">100% CREATOR</text>

          <!-- Decorative seal circle on the right -->
          <circle cx="840" cy="110" r="42" fill="none" stroke="#c8880a" stroke-width="0.8" opacity="0.40"/>
          <circle cx="840" cy="110" r="36" fill="none" stroke="#c8880a" stroke-width="0.5" opacity="0.30"/>
          <text x="840" y="103" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#c8880a" opacity="0.55">⬡</text>
          <text x="840" y="118" text-anchor="middle" font-family="'Courier New', monospace" font-size="5.5" letter-spacing="0.14em" fill="#a06010" opacity="0.60">PON INK</text>
          <text x="840" y="128" text-anchor="middle" font-family="'Courier New', monospace" font-size="5" letter-spacing="0.10em" fill="#a06010" opacity="0.55">EXOTOPIA</text>

          <!-- Decorative left medallion -->
          <circle cx="62" cy="110" r="38" fill="none" stroke="#c8880a" stroke-width="0.8" opacity="0.35"/>
          <text x="62" y="116" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#c8880a" opacity="0.45">★</text>
        </svg>
      </div>

      <PlanetClaimCard
        :hostname="claimHost"
        :planet-name="claimPlanet"
        :lat="claimLat"
        :lon="claimLon"
      />
    </div>

    <!-- ════════════════════════════════════════════════════════════════════
         MOON ORBITAL CLAIM HERO
         ════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="mintMode === 'moon-orbital'" class="moon-hero">
      <div class="moon-hero__bg" aria-hidden="true">
        <!-- animated ring pulses via CSS -->
        <div class="moon-ring moon-ring--1" />
        <div class="moon-ring moon-ring--2" />
        <div class="moon-ring moon-ring--3" />
      </div>

      <!-- Orbital SVG diagram -->
      <svg class="moon-hero__diagram" viewBox="0 0 320 260" aria-hidden="true">
        <defs>
          <radialGradient id="mh-planet" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="#60d0ff"/>
            <stop offset="60%" stop-color="#1060b0"/>
            <stop offset="100%" stop-color="#04082a"/>
          </radialGradient>
          <radialGradient id="mh-moon" cx="40%" cy="35%" r="60%">
            <stop offset="0%"  stop-color="#e8e8ff"/>
            <stop offset="100%" stop-color="#8090b8"/>
          </radialGradient>
          <filter id="mh-glow">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="mh-station-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- Orbit path -->
        <ellipse cx="130" cy="135" rx="95" ry="58"
          fill="none" stroke="rgba(80,140,220,0.18)" stroke-width="0.8"/>
        <ellipse cx="130" cy="135" rx="95" ry="58"
          fill="none" stroke="rgba(80,140,220,0.06)" stroke-width="6"/>

        <!-- Planet glow halo -->
        <circle cx="130" cy="135" r="35" fill="rgba(20,80,180,0.12)"/>
        <circle cx="130" cy="135" r="24" fill="url(#mh-planet)" filter="url(#mh-glow)"/>

        <!-- Orbit dashes — faint far arc -->
        <ellipse cx="130" cy="135" rx="95" ry="58"
          fill="none" stroke="rgba(100,160,255,0.28)" stroke-width="0.5"
          stroke-dasharray="6 18" stroke-dashoffset="0"/>

        <!-- Moon position (top of orbit) -->
        <circle cx="130" cy="77" r="8" fill="url(#mh-moon)" filter="url(#mh-glow)"/>

        <!-- Settlement marker at moon -->
        <polygon points="130,57 133.5,70 130,67 126.5,70"
          fill="#a0d4ff" opacity="0.85" filter="url(#mh-station-glow)"/>
        <circle cx="130" cy="57" r="1.5" fill="#00e5ff"/>

        <!-- L4/L5 ghost points (60° ahead and behind) -->
        <circle cx="212" cy="88" r="3.5" fill="none" stroke="rgba(160,220,255,0.30)" stroke-width="0.8"/>
        <circle cx="48"  cy="88" r="3.5" fill="none" stroke="rgba(160,220,255,0.30)" stroke-width="0.8"/>
        <text x="220" y="85" font-family="monospace" font-size="6" fill="rgba(140,200,255,0.40)" letter-spacing="0.05em">L4</text>
        <text x="30"  y="85" font-family="monospace" font-size="6" fill="rgba(140,200,255,0.40)" letter-spacing="0.05em">L5</text>

        <!-- Moon roman numeral label -->
        <text :x="135" :y="74" font-family="Georgia, serif" font-size="9"
          fill="rgba(200,230,255,0.75)" letter-spacing="0.1em">{{ moonOrdinal }}</text>

        <!-- Coord type annotation -->
        <text x="130" y="50" text-anchor="middle"
          font-family="'Courier New', monospace" font-size="6.5"
          fill="rgba(100,200,255,0.55)" letter-spacing="0.12em">{{ moonCoordLabel }}</text>
      </svg>

      <!-- Text content -->
      <div class="moon-hero__copy">
        <div class="moon-hero__tag">
          <span class="moon-hero__tag-dot" />
          ORBITAL TERRITORY CLAIM
        </div>

        <h1 class="moon-hero__heading">
          {{ claimHost || (route.query.host as string) || 'Unknown System' }}<br>
          <span class="moon-hero__planet">{{ claimPlanet || (route.query.planet as string) || 'Planet' }}</span>
          <span class="moon-hero__sep"> · </span>
          <span class="moon-hero__moon">Moon {{ moonOrdinal }}</span>
        </h1>

        <div class="moon-hero__coord-badge" :class="`moon-hero__coord-badge--${moonCoordVariant}`">
          <span class="moon-hero__coord-icon">⊙</span>
          {{ moonCoordLabel }}
        </div>

        <p class="moon-hero__desc">
          Orbital territory at the {{ moonCoordLabel }} zone of
          <strong>{{ claimPlanet || (route.query.planet as string) || 'this planet' }}</strong>'s
          {{ moonOrdinal }} moon. Your settlement exists in gravitational resonance —
          no station-keeping required at stable Lagrange points.
        </p>

        <div class="moon-hero__meta">
          <span class="moon-hero__free">FREE TO MINT · 0 USDC</span>
          <span class="moon-hero__protocol">PON INK PROTOCOL · ALGORAND ARC-3</span>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════
         CLUSTER WORLD HERO — arrived via cluster surface "Claim settlement"
         ════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="mintMode === 'cluster-world'" class="cw-hero">
      <div class="cw-hero__stars" aria-hidden="true">
        <div v-for="s in heroStars" :key="s.id" class="hero-star"
          :style="{ left: s.x+'%', top: s.y+'%', width: s.r+'px', height: s.r+'px', opacity: s.o, animationDelay: s.d+'s' }" />
      </div>

      <!-- World identity -->
      <div class="cw-hero__identity">
        <div class="cw-hero__tag">CLUSTER WORLD · CREATE A SETTLEMENT</div>
        <div class="cw-hero__system">{{ cwSystem }}</div>
        <div class="cw-hero__planet">{{ cwPlanet }}</div>
        <div class="cw-hero__address">{{ cwCluster.toUpperCase() }} CLUSTER · {{ cwGalaxy }}</div>
        <div class="cw-hero__free">FREE TO MINT · 0 USDC · PON INK PROTOCOL</div>
      </div>

      <!-- Eco pathway cards -->
      <div class="cw-pathways">
        <div class="cw-pathways__label">What will this settlement do?</div>
        <div class="cw-pathways__grid">
          <div v-for="p in CW_ECO_PATHWAYS" :key="p.id" class="cw-card"
            :class="{ 'cw-card--active': selectedCwPathway === p.id }"
            @click="selectedCwPathway = p.id">
            <q-icon :name="p.icon" class="cw-card__icon" />
            <div class="cw-card__title">{{ p.title }}</div>
            <div class="cw-card__desc">{{ p.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Mini claim form (shown after pathway chosen) -->
      <div v-if="selectedCwPathway" class="cw-form q-mt-md">
        <div class="cw-form__label">LOCATION · AUTO-FILLED FROM YOUR EXPLORATION PATH</div>
        <div class="cw-form__address-row">
          <q-icon name="mdi-map-marker" color="amber-6" size="xs" />
          <span class="cw-form__address-text">{{ cwExolocation }}</span>
        </div>
        <q-input v-model="cwHandle" dark dense outlined
          label="Your name or group handle (optional)"
          class="q-mt-sm cw-form__input"
          placeholder="e.g. Fana Ka Community, your pon.ink handle" />
        <div class="cw-form__pathway-note">
          Selected pathway: <strong class="text-amber-5">{{ cwSelectedLabel }}</strong>
          — pre-loads the Mule knowledge corpus for this domain.
        </div>
        <div class="row q-gutter-sm q-mt-sm">
          <q-btn unelevated
            :color="hasSettlement(clusterKey(cwCluster, cwGalaxy, cwSystem, cwPlanet||'b')) ? 'teal-8' : 'amber-9'"
            :icon="hasSettlement(clusterKey(cwCluster, cwGalaxy, cwSystem, cwPlanet||'b')) ? 'mdi-home-circle' : 'mdi-map-marker-plus'"
            :label="hasSettlement(clusterKey(cwCluster, cwGalaxy, cwSystem, cwPlanet||'b')) ? 'Continue Your Settlement' : 'Create a Settlement'"
            @click="proceedCwMint" />
          <q-btn flat color="blue-grey-5" icon="mdi-tune-variant"
            label="Advanced form"
            @click="showCwAdvanced = !showCwAdvanced"
            title="Show full exolocation metadata form" />
        </div>
        <div class="cw-form__note q-mt-xs">
          Confirms coordinates and pathway. No transaction until you sign in your wallet.
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════
         CLUSTER OUTPOST HERO
         ════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="mintMode === 'cluster-outpost'" class="cluster-hero">
      <!-- Plasma glow background -->
      <div class="cluster-hero__plasma" aria-hidden="true">
        <div class="plasma-ring plasma-ring--1" />
        <div class="plasma-ring plasma-ring--2" />
        <div class="plasma-ring plasma-ring--3" />
        <div class="plasma-dots" aria-hidden="true">
          <span v-for="d in clusterDots" :key="d.id" class="plasma-dot"
            :style="{ left: d.x+'%', top: d.y+'%', width: d.r+'px', height: d.r+'px', opacity: d.o }" />
        </div>
      </div>

      <!-- X-ray emission SVG -->
      <svg class="cluster-hero__xray" viewBox="0 0 300 260" aria-hidden="true">
        <defs>
          <radialGradient id="ch-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#fff8e0" stop-opacity="0.95"/>
            <stop offset="15%"  stop-color="#ffcc44" stop-opacity="0.75"/>
            <stop offset="40%"  stop-color="#ff6010" stop-opacity="0.45"/>
            <stop offset="70%"  stop-color="#cc1a00" stop-opacity="0.20"/>
            <stop offset="100%" stop-color="#440000" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="ch-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#ff9030" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#660000" stop-opacity="0"/>
          </radialGradient>
          <filter id="ch-bloom">
            <feGaussianBlur stdDeviation="7" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- Outer thermal halo -->
        <circle cx="150" cy="130" r="115" fill="url(#ch-halo)"/>

        <!-- Emission rings -->
        <circle cx="150" cy="130" r="85" fill="none" stroke="rgba(255,120,30,0.12)" stroke-width="1"/>
        <circle cx="150" cy="130" r="60" fill="none" stroke="rgba(255,150,50,0.18)" stroke-width="0.8"/>
        <circle cx="150" cy="130" r="38" fill="none" stroke="rgba(255,180,60,0.25)" stroke-width="0.8"/>

        <!-- Core emission blob -->
        <circle cx="150" cy="130" r="90" fill="url(#ch-core)" filter="url(#ch-bloom)"/>
        <circle cx="150" cy="130" r="18" fill="rgba(255,250,200,0.90)" filter="url(#ch-bloom)"/>

        <!-- BCG galaxy at center -->
        <ellipse cx="150" cy="130" rx="12" ry="7" fill="rgba(255,240,180,0.65)"/>
        <ellipse cx="150" cy="130" rx="22" ry="10" fill="none"
          stroke="rgba(255,220,120,0.30)" stroke-width="0.5"/>

        <!-- Morphology label -->
        <text x="150" y="230" text-anchor="middle"
          font-family="'Courier New', monospace" font-size="9" letter-spacing="0.18em"
          fill="rgba(255,160,50,0.55)">MORPHOLOGY · {{ clusterMorph || 'UNKNOWN' }}</text>
      </svg>

      <!-- Text content -->
      <div class="cluster-hero__copy">
        <div class="cluster-hero__tag">
          <span class="cluster-hero__tag-dot" />
          DEEP FIELD OUTPOST
        </div>

        <h1 class="cluster-hero__heading">
          {{ clusterGalaxy || 'Unknown Cluster' }}
        </h1>

        <div class="cluster-hero__morph-wrap">
          <span class="cluster-hero__morph-badge">{{ clusterMorphFull }}</span>
          <span class="cluster-hero__morph-hint">BRIGHTEST CLUSTER GALAXY</span>
        </div>

        <p class="cluster-hero__desc">
          Create a settlement node within the deep-field environs of
          <strong>{{ clusterGalaxy || 'this cluster' }}</strong>.
          Outpost deeds are anchored to the cluster's X-ray emission frame —
          persistent even as the member galaxies evolve.
        </p>

        <div class="cluster-hero__stats">
          <div class="ch-stat">
            <span class="ch-stat__k">TYPE</span>
            <span class="ch-stat__v">Galaxy Cluster Outpost</span>
          </div>
          <div class="ch-stat">
            <span class="ch-stat__k">MORPH</span>
            <span class="ch-stat__v">{{ clusterMorph || '—' }}</span>
          </div>
          <div class="ch-stat">
            <span class="ch-stat__k">COST</span>
            <span class="ch-stat__v ch-stat__v--free">FREE TO MINT</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════
         ONBOARDING FIRST DEED HERO
         ════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="mintMode === 'onboarding'" class="onboard-hero">
      <!-- Star field -->
      <div class="hero-stars" aria-hidden="true">
        <div v-for="s in heroStars" :key="s.id"
          class="hero-star"
          :style="{ left: s.x+'%', top: s.y+'%', width: s.r+'px', height: s.r+'px', opacity: s.o, animationDelay: s.d+'s' }"
        />
      </div>

      <div class="onboard-hero__inner">
        <!-- Step trail -->
        <div class="onboard-steps">
          <span class="ob-step ob-step--done">① EXPLORE</span>
          <span class="ob-step-arrow">→</span>
          <span class="ob-step ob-step--done">② WALLET</span>
          <span class="ob-step-arrow">→</span>
          <span class="ob-step ob-step--active">③ MINT</span>
        </div>

        <h1 class="onboard-hero__heading">
          Your First<br>
          <span class="onboard-hero__accent">Exotopia Deed</span>
        </h1>

        <p class="onboard-hero__desc">
          You've set up your wallet and explored the cosmos.
          Now mint your first land deed — permanently yours, on-chain, free.
        </p>

        <!-- Chain badge -->
        <div class="onboard-chain-wrap">
          <div class="onboard-chain-badge" :class="`onboard-chain-badge--${onboardChain}`">
            <span class="ocb-icon">◈</span>
            <span class="ocb-name">{{ onboardChainLabel }}</span>
            <span class="ocb-status">SELECTED</span>
          </div>
          <div class="onboard-chain-hint">
            Mint on {{ onboardChainLabel }} · switch chains any time below
          </div>
        </div>

        <div class="onboard-hero__meta">
          <span class="onboard-free">FREE TO MINT · 0 USDC</span>
          <span class="onboard-protocol">40 ACRES · ONE MULE · PERMANENT DEED</span>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════
         HERO — card fan showcase + edition intro (shown when no claim)
         ════════════════════════════════════════════════════════════════════ -->
    <div v-else class="mint-hero">

      <!-- Star field backdrop -->
      <div class="hero-stars" aria-hidden="true">
        <div v-for="s in heroStars" :key="s.id"
          class="hero-star"
          :style="{ left: s.x + '%', top: s.y + '%', width: s.r + 'px', height: s.r + 'px', opacity: s.o, animationDelay: s.d + 's' }"
        />
      </div>

      <!-- Copy left -->
      <div class="hero-copy">
        <div class="hero-edition">
          <span class="edition-dot" />
          EXTRAPOLATION EDITION
        </div>

        <h1 class="hero-heading">
          Build your<br>
          <span class="hero-heading-accent">place in the cosmos</span>
        </h1>

        <p class="hero-desc">
          11 hand-crafted SVG collector's cards. Each one a unique astronomical
          object, phenomenon, or concept from the Exotopia ecosystem.
          Minted on-chain. Yours permanently.
        </p>

        <!-- Collection note — thematic variety, not a graded/scarcity display.
             These are collectible art records, not an investment: no rarity
             tiers or counts are shown here, deliberately. -->
        <div class="hero-rarities">
          <span class="rarity-pill" style="border-color: rgba(150,170,200,0.35); color: rgba(200,215,235,0.85)">
            11 distinct hand-crafted designs — each a different astronomical subject
          </span>
        </div>

        <!-- Free badge + chains -->
        <div class="hero-meta q-mt-md">
          <span class="free-badge">FREE TO MINT</span>
          <span class="chain-list">ALGO · MATIC · SOL · TEZ · HBAR · CELO</span>
        </div>

        <!-- CTAs -->
        <div class="hero-ctas q-mt-lg">
          <q-btn
            unelevated color="cyan-8" icon="mdi-hexagon-multiple"
            label="Start Minting"
            @click="scrollToForms"
          />
          <q-btn
            flat color="blue-grey-4" icon="mdi-view-gallery"
            label="View Collection"
            @click="$router.push('/gallery')"
            class="q-ml-sm"
          />
        </div>
      </div>

      <!-- Card fan right -->
      <div class="hero-fan" aria-hidden="true">
        <div
          v-for="(fc, i) in fanCards"
          :key="fc.id"
          class="fan-slot"
          :style="fanStyle(i)"
          @click="$router.push('/gallery')"
        >
          <CollectorCard
            :card="fc"
            :width="fanCardWidth(i)"
            :height="Math.round(fanCardWidth(i) * 1.4)"
          />
        </div>
      </div>

    </div><!-- /hero (v-if no claim) -->

    <!-- Contextual ticker — exolocation path in cluster-world, card names otherwise -->
    <div class="edition-ticker">
      <div v-if="mintMode === 'cluster-world'" class="ticker-inner ticker-inner--cw">
        <template v-for="_ in 6" :key="_">
          <span class="ticker-item">
            <span class="ticker-num">CLUSTER</span> {{ cwCluster.toUpperCase() }}
            <span class="ticker-sep">›</span>
          </span>
          <span class="ticker-item">
            <span class="ticker-num">GALAXY</span> {{ cwGalaxy }}
            <span class="ticker-sep">›</span>
          </span>
          <span class="ticker-item">
            <span class="ticker-num">SYSTEM</span> {{ cwSystem }}
            <span class="ticker-sep">›</span>
          </span>
          <span class="ticker-item">
            <span class="ticker-num">WORLD</span> {{ cwPlanet }}
            <span class="ticker-sep">◈</span>
          </span>
        </template>
      </div>
      <div v-else class="ticker-inner">
        <span v-for="c in COLLECTOR_CARDS" :key="c.id" class="ticker-item">
          <span class="ticker-num">#{{ String(c.id).padStart(2,'0') }}</span>
          {{ c.name }}
          <span class="ticker-sep">·</span>
        </span>
        <span v-for="c in COLLECTOR_CARDS" :key="'b' + c.id" class="ticker-item" aria-hidden="true">
          <span class="ticker-num">#{{ String(c.id).padStart(2,'0') }}</span>
          {{ c.name }}
          <span class="ticker-sep">·</span>
        </span>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════
         PREVIEW CONFIRM SECTION — replaces pathway + forms in dry-run mode
         ════════════════════════════════════════════════════════════════════ -->
    <div v-if="isPreview && mintMode === 'surface-deed'" class="preview-confirm">

      <div class="pc-section-label">SETTLEMENT SUMMARY</div>

      <div class="pc-addr-block">
        exo-surface-v1:{{ claimHost }}:{{ claimPlanet }}
      </div>

      <div class="pc-meta-grid">
        <div class="pc-meta-row">
          <span>Planet</span><span>{{ claimPlanet }}</span>
        </div>
        <div class="pc-meta-row">
          <span>System</span><span>{{ claimHost }}</span>
        </div>
        <div class="pc-meta-row">
          <span>Plot centre</span>
          <span>
            {{ claimLat >= 0 ? claimLat + '°N' : Math.abs(claimLat) + '°S' }} ·
            {{ claimLon >= 0 ? claimLon + '°E' : Math.abs(claimLon) + '°W' }}
          </span>
        </div>
        <div class="pc-meta-row">
          <span>Plot area</span><span>10° × 10° (40 virtual acres)</span>
        </div>
        <div class="pc-meta-row">
          <span>Coordinate system</span><span>exo-surface-v1</span>
        </div>
        <div class="pc-meta-row">
          <span>Record status</span>
          <span class="pc-meta-val--preview">PREVIEW · not yet saved</span>
        </div>
      </div>

      <div class="pc-section-label" style="margin-top:20px">WHAT HAPPENS WHEN YOU ESTABLISH</div>
      <div class="pc-checklist">
        <div class="pc-check-row">
          <span class="pc-check-icon">◈</span>
          Your plot is saved locally as your settlement record
        </div>
        <div class="pc-check-row">
          <span class="pc-check-icon">◈</span>
          Choose a settlement pathway — eco, gallery, water, learning, or community command
        </div>
        <div class="pc-check-row">
          <span class="pc-check-icon">◈</span>
          A Mule knowledge corpus is pre-loaded for your chosen domain
        </div>
        <div class="pc-check-row">
          <span class="pc-check-icon pc-check-icon--dim">◈</span>
          <span class="pc-check-dim">Optional: register the deed for permanent record (no cost at registration)</span>
        </div>
      </div>

      <div class="pc-cta-row">
        <button class="pc-cta-btn pc-cta-btn--confirm" @click="confirmFromPreview">
          ⬡ Establish Settlement
        </button>
        <button class="pc-cta-btn pc-cta-btn--back" @click="router.back()">
          ← Back to plot selection
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════
         PATHWAY WIZARD — card gallery to configure the mint
         ════════════════════════════════════════════════════════════════════ -->
    <div v-if="mintMode !== 'cluster-world' && !isPreview" class="pathway-section">
      <MintPathwayWizard @select="onPathwaySelect"/>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════
         MINTING FORMS
         ════════════════════════════════════════════════════════════════════ -->
    <div v-if="(mintMode !== 'cluster-world' || showCwAdvanced) && !isPreview" ref="formsAnchor" class="mint-forms q-pa-md">

      <!-- Suppress heading when deed header above is already showing -->
      <div v-if="mintMode === 'general'" class="row items-center q-mb-xs">
        <div class="text-h6 text-blue-grey-2" style="font-family:monospace; letter-spacing:0.08em">
          ◈ CONFIGURE YOUR MINT
        </div>
        <q-space />
        <q-btn flat dense size="sm" color="amber-6" icon="mdi-tune-variant" label="Style Builder"
          @click="$router.push('/mint-style')"
          title="Configure generative minting styles combining network sources" />
      </div>

      <div v-if="mintMode === 'general'" class="text-caption text-blue-grey-5 q-mb-md" style="font-family:monospace; letter-spacing:0.05em">
        <span class="text-green-5">FREE TO MINT</span> · utility-first model ·
        no resale or aftermarket fee — Exotopia doesn't operate a secondary market.
        Network gas is the only cost at mint time.
      </div>

      <!-- Compact deed context bar shown in claim mode -->
      <div v-if="mintMode === 'surface-deed'" class="deed-context-bar q-mb-sm">
        <span class="dcb-star">★</span>
        <span class="dcb-text">Select your settlement pathway below · each pre-loads a Mule knowledge corpus</span>
        <q-btn flat dense size="xs" color="amber-6" icon="mdi-tune-variant"
          @click="$router.push('/mint-style')" class="q-ml-auto" title="Style Builder"/>
      </div>

    <q-tabs v-model="tab" dense align="left" class="q-mb-md" scrollable>
      <q-tab name="exolocation" label="Exolocation (Algorand)" />
      <q-tab name="station"     label="Station Core (Solana)"  />
      <q-tab name="module"      label="Module (Solana)"        />
      <q-tab name="solution"    label="Ecocity Solution"       />
      <q-tab name="polygon"     label="Polygon / MATIC" />
      <q-tab name="celo"        label="Celo"            />
    </q-tabs>

    <q-tab-panels v-model="tab" animated class="bg-transparent">

      <!-- ── Exolocation (Algorand ARC-3 / ARC-69) ───────────────────── -->
      <q-tab-panel name="exolocation">
        <div id="exoloc-form" class="mint-form">

          <div class="form-section-label">LOCATION METADATA</div>

          <q-select
            v-model="exo.coordSystem"
            :options="COORD_SYSTEMS"
            label="Coordinate System  (Trophic Level)"
            dark dense outlined
            class="q-mb-sm"
            emit-value map-options
          />

          <!-- Trophic level badge -->
          <div v-if="exo.coordSystem" class="trophic-badge q-mb-sm">
            {{ COORD_SYSTEMS.find(c => c.value === exo.coordSystem)?.label ?? exo.coordSystem }}
          </div>

          <q-input
            v-model="exo.refBody"
            :label="isMoonCoord ? 'Parent Planet (hostname / planet)' : 'Reference Body (hostname / planet)'"
            dark dense outlined
            class="q-mb-sm"
            :rules="[v => !!v.trim() || 'Required']"
          />

          <!-- Moon-specific fields -->
          <template v-if="isMoonCoord">
            <div class="moon-section-label">MOON SPECIFICATION</div>
            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-4">
                <q-input v-model.number="exo.moonIndex" type="number" min="1" max="9"
                  label="Moon index (I=1, II=2…)" dark dense outlined />
              </div>
              <div class="col-8">
                <q-input
                  :model-value="exo.refBody ? `${exo.refBody} Moon ${'IIIIIVVVIVIIVIII'.slice((exo.moonIndex-1)*0).charAt(0) || exo.moonIndex}` : ''"
                  label="Moon name (auto-built)"
                  dark dense outlined readonly
                  hint="Derived from parent planet + index"
                />
              </div>
            </div>
            <q-toggle v-model="exo.tidallyLocked" :true-value="true" :false-value="false" :null-value="null"
              label="Tidally locked (one face always toward parent planet)"
              color="amber-6" dense class="q-mb-sm" />
          </template>

          <!-- L5 SYZYGY: Lagrange point selector -->
          <template v-if="isMoonLagrange">
            <div class="moon-section-label">LAGRANGE POINT</div>
            <q-select
              v-model="exo.lagrangePoint"
              :options="MOON_LAGRANGE_OPTS"
              emit-value map-options
              label="Lagrange Point"
              dark dense outlined class="q-mb-sm"
            />
            <div class="lagrange-physics" v-if="exo.lagrangePoint">
              <div v-for="lp in MOON_LAGRANGE_OPTS.filter(o => o.value === exo.lagrangePoint)" :key="lp.value">
                <span :class="['lagrange-stability', exo.lagrangePoint === 'L4' || exo.lagrangePoint === 'L5' ? 'stable' : 'unstable']">
                  {{ exo.lagrangePoint === 'L4' || exo.lagrangePoint === 'L5' ? 'STABLE — no station-keeping required' : 'UNSTABLE — active station-keeping required' }}
                </span>
              </div>
            </div>
          </template>

          <!-- L6 LIMINAL: Interface zone selector -->
          <template v-if="isMoonInterface">
            <div class="moon-section-label">INTERFACE ZONE TYPE</div>
            <q-select
              v-model="exo.interfaceZone"
              :options="MOON_INTERFACE_OPTS"
              emit-value map-options
              label="Zone Type"
              dark dense outlined class="q-mb-sm"
            />
          </template>

          <q-input
            v-model="exo.regionName"
            label="Settlement / Region Name"
            dark dense outlined
            class="q-mb-sm"
            counter maxlength="64"
            :rules="[v => v.trim().length >= 2 || 'Min 2 characters']"
          />

          <q-input
            v-if="!isMoonLagrange && !isMoonInterface"
            v-model="exo.boundary"
            :label="isMoonSurface ? 'Moon surface lat/long boundary' : 'Boundary descriptor (e.g. lat/long or AU range)'"
            dark dense outlined
            class="q-mb-sm"
            :hint="isMoonSurface ? 'e.g. 14.5,-23.1 (terminator zone coordinates)' : 'e.g. 14.5,-23.1 or 1.1-1.3au'"
          />

          <div class="form-section-label q-mt-md">TRANSACTION PREVIEW</div>

          <!-- ── FEE ISOLATION DISPLAY ──────────────────────────────── -->
          <!-- SPEC: community return and network costs are displayed in  -->
          <!-- separate blocks with independent data paths.               -->
          <!-- NEVER compute Total = Yield - NetworkFee in the template. -->

          <div class="fee-isolation-card q-mb-sm">
            <!-- MINT COST — FREE ────────────────────────────────────────── -->
            <div class="fee-block fee-block--free">
              <div class="fee-block-label">MINT COST</div>
              <div class="fee-block-value text-green-4">
                FREE · USD {{ mintCostUSD }}
              </div>
              <div class="fee-block-note">
                Utility-first model — no purchase required to mint your initial exolocation deed.
                Platform growth takes priority over early monetisation.
              </div>
            </div>

            <q-separator dark class="q-my-sm" style="opacity:0.15" />

            <!-- NETWORK COSTS (informational only) ──────────────── -->
            <div class="fee-block fee-block--network">
              <div class="fee-row">
                <span>Algorand ASA creation fee</span>
                <span class="text-blue-grey-5">0.001 ALGO (network only)</span>
              </div>
              <div class="fee-row">
                <span>IPFS metadata pin</span>
                <span class="text-blue-grey-5">~0.00 ALGO (Pinata free tier)</span>
              </div>
              <div class="fee-block-note">
                This mints a collectible record. Exotopia does not operate a resale market —
                there is no platform fee to disclose because there is no secondary sale to apply it to.
              </div>
            </div>
          </div>

          <!-- Chain target note -->
          <div class="chain-badge chain-badge--polygon q-mb-sm" style="font-size:8px;padding:3px 8px">
            POLYGON AMOY TESTNET · chainId 80002 · Exolocation ERC-721
          </div>

          <q-btn
            unelevated color="cyan-8"
            icon="mdi-hexagon-outline"
            :label="exoloLoading ? 'Estimating…' : 'Dry Run — Preview without on-chain cost'"
            class="full-width q-mb-xs"
            :loading="exoloLoading && !exoloResult"
            @click="dryRun('exolocation')"
          />

          <!-- Explicit pre-mint disclaimer — an affirmative, logged user action
               rather than a buried ToS clause. Required before Execute Mint
               enables, for every mint on this page, not just this one type. -->
          <label class="mint-disclaimer-check">
            <q-checkbox v-model="mintDisclaimerAccepted" dense color="cyan-6" />
            <span>This mints a collectible record. It has no cash value, no expectation of profit, and is not an investment.</span>
          </label>

          <q-btn
            unelevated color="green-8"
            icon="mdi-send"
            :label="exoloLoading && exoloResult !== null ? 'Minting…' : (walletAddress ? 'Execute Mint on Polygon Amoy' : 'Connect Wallet & Mint')"
            class="full-width"
            :disable="!exoFormValid || !mintDisclaimerAccepted"
            :loading="exoloLoading && !!exoloResult"
            @click="doMint('exolocation')"
          />
          <div v-if="!exoFormValid" class="validation-hint">
            Fill in Reference Body and Settlement Name to enable minting.
          </div>
          <div v-else-if="!mintDisclaimerAccepted" class="validation-hint">
            Check the box above to enable minting.
          </div>
          <div v-else-if="exoFormValid && !exoloResult" class="validation-hint validation-hint--info">
            Click <strong>Execute Mint</strong> — the contract will validate and report any issues inline.
          </div>

          <!-- Dry run result panel -->
          <div v-if="exoloDryResult" class="dry-result q-mt-sm">
            <div v-for="e in exoloDryResult.errors"   :key="e" class="dry-err">✗ {{ e }}</div>
            <div v-for="w in exoloDryResult.warnings.filter(w => !w.includes('placeholder') && !w.includes('Gas estimation skipped'))" :key="w" class="dry-warn">⚠ {{ w }}</div>
            <div class="dry-stats row q-gutter-x-sm q-mt-xs" v-if="exoloDryResult.valid">
              <span v-if="exoloDryResult.estimatedGasEth" class="dry-gas">
                ⛽ {{ exoloDryResult.estimatedGasEth }}
              </span>
              <span class="dry-bytes">
                {{ exoloDryResult.metadataBytes }} bytes ·
                {{ exoloDryResult.metadataBytes < 512 ? 'on-chain safe' : hasPinata() ? 'IPFS upload enabled' : 'add VITE_PINATA_JWT for IPFS' }}
              </span>
              <span class="dry-ok">✓ Ready to mint</span>
            </div>
          </div>

          <!-- Mint result panel -->
          <div v-if="exoloResult" class="q-mt-sm" :class="exoloResult.success ? 'mint-ok' : 'mint-err'">
            <template v-if="exoloResult.success">
              <q-icon name="check_circle" color="green-5" size="14px" class="q-mr-xs"/>
              Minted on Polygon Amoy!
              <a v-if="exoloResult.explorerUrl" :href="exoloResult.explorerUrl" target="_blank"
                rel="noopener" class="mint-link">View on Polygonscan →</a>
              <div v-if="exoloResult.txHash" class="mint-hash">{{ exoloResult.txHash }}</div>
            </template>
            <template v-else>
              <q-icon name="error_outline" color="red-5" size="14px" class="q-mr-xs"/>
              {{ exoloResult.error }}
            </template>
          </div>

          <!-- ── Live metadata preview ─────────────────────────────── -->
          <div class="meta-preview-wrap q-mt-md">
            <div class="meta-preview-header" @click="metaPreviewOpen = !metaPreviewOpen; metaPreviewOpen && refreshMetaPreview()">
              <span class="meta-preview-label">◈ NFT METADATA PREVIEW</span>
              <q-btn flat dense size="xs" icon="mdi-refresh" color="cyan-7"
                @click.stop="refreshMetaPreview(); metaPreviewOpen = true"
                title="Refresh metadata from current form values"/>
              <q-btn flat dense size="xs"
                :icon="metaPreviewOpen ? 'expand_less' : 'expand_more'"
                color="blue-grey-5"/>
            </div>

            <Transition name="meta-slide">
              <div v-if="metaPreviewOpen && metaPreview" class="meta-preview-body">
                <div class="meta-preview-actions">
                  <span class="meta-byte-count">{{ metaPreview.length }} bytes</span>
                  <q-btn flat dense size="xs" color="cyan-7"
                    :label="metaCopied ? '✓ copied' : 'copy JSON'"
                    @click="copyMetaPreview"/>
                </div>
                <pre class="meta-preview-code">{{ metaPreview }}</pre>

                <!-- ARC-69 note preview -->
                <div class="meta-arc69-label">ARC-69 on-chain note (≤1 KB fingerprint)</div>
                <pre class="meta-preview-code meta-preview-code--arc69">{{ arc69Preview }}</pre>
              </div>
            </Transition>
          </div>

        </div>
      </q-tab-panel>

      <!-- ── Station Core (Solana Bubblegum cNFT) ────────────────────── -->
      <q-tab-panel name="station">
        <div class="mint-form">

          <div class="form-section-label">STATION METADATA</div>

          <q-input
            v-model="station.name"
            label="Station Name"
            dark dense outlined class="q-mb-sm"
            counter maxlength="48"
            :rules="[v => !!v.trim() || 'Required']"
          />

          <q-select
            v-model="station.category"
            :options="STATION_CATEGORIES"
            label="Station Category"
            dark dense outlined class="q-mb-sm"
            emit-value map-options
          />

          <q-input
            v-model="station.exolocationRef"
            label="Exolocation NFT address"
            dark dense outlined class="q-mb-sm"
            hint="exo-surface-v1:hostname:region"
            :rules="[v => v.startsWith('exo-') || 'Must start with exo- prefix']"
          />

          <div class="form-section-label q-mt-md">TRANSACTION PREVIEW</div>

          <div class="fee-isolation-card q-mb-sm">
            <div class="fee-block fee-block--free">
              <div class="fee-block-label">MINT COST</div>
              <div class="fee-block-value text-green-4">FREE</div>
              <div class="fee-block-note">
                Utility-first model. No resale or aftermarket fee — Exotopia doesn't operate
                a secondary market. The 10% Hardware Fund allocation applies at mint time only.
              </div>
            </div>
            <q-separator dark class="q-my-sm" style="opacity:0.15" />
            <div class="fee-block fee-block--network">
              <div class="fee-row">
                <span>Solana Bubblegum cNFT gas</span>
                <span class="text-blue-grey-5">~0.000005 SOL (network only)</span>
              </div>
              <div class="fee-row">
                <span>Metaplex protocol fee</span>
                <span class="text-blue-grey-5">~0.01 SOL (network only)</span>
              </div>
              <div class="fee-block-note fee-note--warn">
                Gas is estimated — confirm in wallet. Never deducted from community allocation.
              </div>
            </div>
          </div>

          <q-btn
            unelevated color="cyan-8"
            icon="mdi-hexagon-outline"
            label="Dry Run — Preview without on-chain cost"
            class="full-width q-mb-xs"
            @click="dryRun('station')"
          />
          <q-btn
            outline color="cyan-6"
            icon="mdi-send"
            label="Execute Mint (connects wallet)"
            class="full-width"
            :disable="!stationFormValid"
            @click="doMint('station')"
          />
        </div>
      </q-tab-panel>

      <!-- ── Module (Solana) ──────────────────────────────────────────── -->
      <q-tab-panel name="module">
        <div class="mint-form">
          <div class="text-caption text-blue-grey-5 q-mb-sm">
            Station Module NFT — binds a functional zone to a Station Core.
          </div>
          <div class="form-section-label">MODULE METADATA</div>
          <q-select
            v-model="module_.type"
            :options="MODULE_TYPES"
            label="Module Type"
            dark dense outlined class="q-mb-sm"
            emit-value map-options
          />
          <q-input
            v-model="module_.stationRef"
            label="Parent Station Core NFT address"
            dark dense outlined class="q-mb-sm"
            :rules="[v => !!v.trim() || 'Station Core reference required']"
          />
          <div class="fee-isolation-card q-mt-md q-mb-sm">
            <div class="fee-block fee-block--network">
              <div class="fee-row"><span>Solana cNFT mint</span><span class="text-pink-4">~0.000005 SOL</span></div>
              <div class="fee-block-note fee-note--warn">Gas is informational — confirmed at wallet signing only.</div>
            </div>
          </div>
          <q-btn unelevated color="cyan-8" label="Dry Run" class="full-width q-mb-xs" @click="dryRun('module')" />
          <q-btn outline color="cyan-6" label="Execute Mint" class="full-width" :disable="!moduleFormValid" @click="doMint('module')" />
        </div>
      </q-tab-panel>

      <!-- ── Ecocity Solution ─────────────────────────────────────────── -->
      <q-tab-panel name="solution">
        <div class="mint-form">
          <div class="text-caption text-blue-grey-5 q-mb-sm">
            EcocitySolution NFT — records a real-world sustainable design object
            earned through eco-ops activity or workshop completion.
          </div>
          <div class="form-section-label">SOLUTION METADATA</div>
          <q-select
            v-model="solution.category"
            :options="ECOCITY_CATEGORIES"
            label="Category"
            dark dense outlined class="q-mb-sm"
            emit-value map-options
          />
          <q-input
            v-model="solution.impactMetric"
            label="Impact metric (e.g. 200L/day, 1.5kWh/day)"
            dark dense outlined class="q-mb-sm"
            :rules="[v => !!v.trim() || 'Required']"
          />
          <q-input
            v-model="solution.recipientAddress"
            label="Recipient wallet address"
            dark dense outlined class="q-mb-sm"
            :rules="[v => v.trim().length > 10 || 'Valid wallet required']"
          />
          <div class="fee-isolation-card q-mt-md q-mb-sm">
            <div class="fee-block fee-block--community">
              <div class="fee-block-label">ECO-OPS MILESTONE REWARD</div>
              <div class="fee-block-value text-green-5">Earned — no purchase required</div>
              <div class="fee-block-note">Dispatched automatically on milestone completion via pon.ink.</div>
            </div>
            <q-separator dark class="q-my-sm" style="opacity:0.15" />
            <div class="fee-block fee-block--network">
              <div class="fee-row"><span>Solana cNFT (airdrop)</span><span class="text-pink-4">~0.000005 SOL (platform covers)</span></div>
            </div>
          </div>
          <q-btn unelevated color="green-8" label="Dry Run Airdrop" class="full-width q-mb-xs" @click="dryRun('solution')" />
          <q-btn outline color="green-6" label="Execute Airdrop" class="full-width" :disable="!solutionFormValid" @click="doMint('solution')" />
        </div>
      </q-tab-panel>

      <!-- ── Polygon / MATIC ─────────────────────────────────────────────── -->
      <q-tab-panel name="polygon">
        <div class="mint-form">

          <!-- Wallet onboarding — shown when no injected wallet is present -->
          <Transition name="onboard-fade">
            <div v-if="!hasInjectedWallet() && !walletAddress" class="onboard-wrap">
              <WalletOnboardingGuide
                chain-id="polygon"
                :chain-data="POLYGON_AMOY"
                :has-wallet="hasInjectedWallet()"
                @connect="ensureWallet().then(a => { if (a) walletAddress = a })"
                @addNetwork="switchToChain(POLYGON_AMOY).catch(() => {})"
              />
              <q-separator color="blue-grey-8" class="q-my-lg" />
            </div>
          </Transition>

          <div class="chain-badge chain-badge--polygon">
            <q-icon name="mdi-hexagon-outline" size="14px" class="q-mr-xs" />
            POLYGON AMOY TESTNET  ·  chainId 80002  ·  Draft Push
          </div>
          <div class="text-caption text-blue-grey-5 q-mb-md">
            Polygon PoS (EVM-compatible) — low gas fees, large ecosystem.
            Used for $SUNLIGHT SUNLIGHT NFTs, Water Quality Certifications, and Health Card IDs.
          </div>

          <!-- Sub-type selector -->
          <q-btn-toggle
            v-model="polyType"
            unelevated dense
            :options="POLY_TYPES"
            class="q-mb-md"
            color="blue-grey-8" text-color="blue-grey-4"
            toggle-color="purple-9" toggle-text-color="white"
          />

          <!-- $SUNLIGHT -->
          <template v-if="polyType === 'sunlight'">
            <div class="form-section-label">$SUNLIGHT SOUND NFT METADATA</div>
            <q-input v-model="sunlight.title"    label="Track Title"   dark dense outlined class="q-mb-sm" :rules="[v => !!v.trim() || 'Required']" />
            <q-input v-model="sunlight.artist"   label="Artist (pon.ink handle)" dark dense outlined class="q-mb-sm" :rules="[v => !!v.trim() || 'Required']" />
            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-4"><q-input v-model.number="sunlight.duration_sec" type="number" label="Duration (s)" dark dense outlined /></div>
              <div class="col-4"><q-input v-model.number="sunlight.bpm"          type="number" label="BPM" dark dense outlined /></div>
              <div class="col-4"><q-input v-model="sunlight.key"                               label="Key (e.g. Am)" dark dense outlined /></div>
            </div>
            <q-select v-model="sunlight.license" :options="SUNLIGHT_LICENSES" label="License" emit-value map-options dark dense outlined class="q-mb-sm" />
            <q-input v-model="sunlight.ipfs_audio_cid" label="Audio IPFS CID" dark dense outlined class="q-mb-sm" hint="Upload audio to Pinata first — paste CID here" />
            <q-input v-model="sunlight.description" label="Description" dark dense outlined type="textarea" rows="2" counter maxlength="200" class="q-mb-sm" />
          </template>

          <!-- Water Quality Cert -->
          <template v-if="polyType === 'wq_cert'">
            <div class="form-section-label">WATER QUALITY CERTIFICATION</div>
            <q-input v-model="wqCert.cert_id"      label="Certificate ID (e.g. WQC-LAMU-2026-001)" dark dense outlined class="q-mb-sm" :rules="[v => !!v.trim() || 'Required']" />
            <q-input v-model="wqCert.location_name" label="Site Name"        dark dense outlined class="q-mb-sm" :rules="[v => !!v.trim() || 'Required']" />
            <q-input v-model="wqCert.measured_by"  label="Field Worker (handle)" dark dense outlined class="q-mb-sm" />
            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-4"><q-input v-model.number="wqCert.ph"               type="number" label="pH"             dark dense outlined /></div>
              <div class="col-4"><q-input v-model.number="wqCert.turbidity_ntu"    type="number" label="Turbidity (NTU)" dark dense outlined /></div>
              <div class="col-4"><q-input v-model.number="wqCert.nitrate_mg_l"     type="number" label="Nitrate mg/L"   dark dense outlined /></div>
            </div>
            <q-toggle v-model="wqCert.potable" label="Water is potable (drinkable)" color="green-5" class="q-mb-sm" />
          </template>

          <!-- Fee isolation + preview -->
          <div class="form-section-label q-mt-md">TRANSACTION PREVIEW</div>
          <div class="fee-isolation-card q-mb-sm">
            <div class="fee-block fee-block--free">
              <div class="fee-block-label">MINT COST</div>
              <div class="fee-block-value text-green-4">FREE</div>
              <div class="fee-block-note">Utility-first. No resale or aftermarket fee — Exotopia doesn't operate a secondary market.</div>
            </div>
            <q-separator dark class="q-my-sm" style="opacity:0.15" />
            <div class="fee-block fee-block--network">
              <div class="fee-row"><span>Polygon Amoy gas</span><span class="text-blue-grey-5">{{ polyGasEstimate }} (network only)</span></div>
              <div class="fee-row"><span>IPFS metadata pin</span><span class="text-blue-grey-5">0.00 MATIC (Pinata free tier)</span></div>
              <div class="fee-block-note fee-note--warn">Testnet only — use faucet at faucet.polygon.technology</div>
            </div>
          </div>

          <!-- Metadata preview -->
          <div v-if="polyDryResult" class="metadata-preview q-mb-sm">
            <div class="form-section-label">METADATA PREVIEW (dry run)</div>
            <div v-for="w in polyDryResult.warnings" :key="w" class="vp-warning">⚠ {{ w }}</div>
            <div v-for="e in polyDryResult.errors"   :key="e" class="mint-error">✗ {{ e }}</div>
            <pre class="meta-json">{{ polyDryResult.metadataJson.slice(0, 800) }}{{ polyDryResult.metadataJson.length > 800 ? '\n…' : '' }}</pre>
            <div class="meta-bytes">{{ polyDryResult.metadataBytes }} bytes — {{ polyDryResult.metadataBytes < 512 ? 'on-chain safe' : 'use IPFS URI' }}</div>
          </div>

          <div class="wallet-status q-mb-sm" v-if="walletAddress">
            <q-icon name="account_balance_wallet" size="12px" color="cyan-5" class="q-mr-xs" />
            {{ walletAddress.slice(0, 6) }}…{{ walletAddress.slice(-4) }} connected
          </div>

          <div class="row q-gutter-xs">
            <q-btn unelevated color="cyan-8" icon="mdi-eye" label="Dry Run" @click="polyDryRun" :loading="polyLoading" class="col" />
            <q-btn outline color="cyan-6" icon="mdi-send" label="Mint on Amoy" @click="polyExecute"
              :disable="!polyCanMint" :loading="polyLoading" class="col" />
          </div>
          <div v-if="polyResult" class="mint-result q-mt-sm" :class="polyResult.success ? 'mint-result--ok' : 'mint-result--fail'">
            <template v-if="polyResult.success">
              ✓ Minted — <a :href="polyResult.explorerUrl" target="_blank" rel="noopener">View on Polygonscan</a>
            </template>
            <template v-else>✗ {{ polyResult.error }}</template>
          </div>
        </div>
      </q-tab-panel>

      <!-- ── Celo ─────────────────────────────────────────────────────────── -->
      <q-tab-panel name="celo">
        <div class="mint-form">

          <!-- Wallet onboarding — shown when no injected wallet is present -->
          <Transition name="onboard-fade">
            <div v-if="!hasInjectedWallet() && !walletAddress" class="onboard-wrap">
              <WalletOnboardingGuide
                chain-id="celo"
                :chain-data="CELO_ALFAJORES"
                :has-wallet="hasInjectedWallet()"
                @connect="ensureWallet().then(a => { if (a) walletAddress = a })"
                @addNetwork="switchToChain(CELO_ALFAJORES).catch(() => {})"
              />
              <q-separator color="blue-grey-8" class="q-my-lg" />
            </div>
          </Transition>

          <div class="chain-badge chain-badge--celo">
            <q-icon name="mdi-leaf-circle-outline" size="14px" class="q-mr-xs" />
            CELO ALFAJORES TESTNET  ·  chainId 44787  ·  Draft Push
          </div>
          <div class="text-caption text-blue-grey-5 q-mb-md">
            Celo is EVM-compatible, mobile-first, and has strong adoption in East Africa.
            Its cUSD stablecoin maps directly to M-Pesa payment flows for community workers.
            Used for Community Badges and Eco-ops Participation Tokens.
          </div>

          <!-- Sub-type selector -->
          <q-btn-toggle
            v-model="celoType"
            unelevated dense
            :options="CELO_TYPES"
            class="q-mb-md"
            color="blue-grey-8" text-color="blue-grey-4"
            toggle-color="green-9" toggle-text-color="white"
          />

          <!-- Community Badge -->
          <template v-if="celoType === 'community_badge'">
            <div class="form-section-label">COMMUNITY BADGE METADATA</div>
            <q-input v-model="badge.badge_name"  label="Badge Name" dark dense outlined class="q-mb-sm" :rules="[v => !!v.trim() || 'Required']" />
            <q-input v-model="badge.community"   label="Community (e.g. Fana Ka)" dark dense outlined class="q-mb-sm" :rules="[v => !!v.trim() || 'Required']" />
            <q-input v-model="badge.recipient"   label="Recipient (pon.ink handle)" dark dense outlined class="q-mb-sm" />
            <q-input v-model="badge.awarded_for" label="Awarded for" dark dense outlined class="q-mb-sm" />
            <q-select v-model="badge.tier" :options="['bronze','silver','gold','platinum']" label="Badge Tier" dark dense outlined class="q-mb-sm" />
          </template>

          <!-- Eco-ops token -->
          <template v-if="celoType === 'eco_ops_token'">
            <div class="form-section-label">ECO-OPS PARTICIPATION TOKEN</div>
            <q-input v-model="ecoToken.token_id"      label="Token ID (e.g. ECO-LAMU-WQ-001)" dark dense outlined class="q-mb-sm" :rules="[v => !!v.trim() || 'Required']" />
            <q-select v-model="ecoToken.activity_type" :options="ECO_OPS_TYPES" emit-value map-options label="Activity Type" dark dense outlined class="q-mb-sm" />
            <q-input v-model="ecoToken.participant"   label="Participant (pon.ink handle)" dark dense outlined class="q-mb-sm" />
            <q-input v-model="ecoToken.location_name" label="Location Name" dark dense outlined class="q-mb-sm" />
            <q-input v-model.number="ecoToken.checkin_count" type="number" label="Check-in count at milestone" dark dense outlined class="q-mb-sm" />
            <q-input v-model="ecoToken.milestone"     label="Milestone description" dark dense outlined class="q-mb-sm" />
            <q-input v-model="ecoToken.group"         label="SHG Group (optional)" dark dense outlined class="q-mb-sm" />
          </template>

          <!-- Fee isolation -->
          <div class="form-section-label q-mt-md">TRANSACTION PREVIEW</div>
          <div class="fee-isolation-card q-mb-sm">
            <div class="fee-block fee-block--free">
              <div class="fee-block-label">MINT COST</div>
              <div class="fee-block-value text-green-4">FREE</div>
              <div class="fee-block-note">Earned via eco-ops or event attendance. Dispatched automatically via pon.ink. No purchase required. No resale or aftermarket fee — Exotopia doesn't operate a secondary market.</div>
            </div>
            <q-separator dark class="q-my-sm" style="opacity:0.15" />
            <div class="fee-block fee-block--network">
              <div class="fee-row"><span>Celo Alfajores gas</span><span class="text-blue-grey-5">{{ celoGasEstimate }} (network only)</span></div>
              <div class="fee-block-note fee-note--warn">Testnet only — use faucet at faucet.celo.org/alfajores</div>
            </div>
          </div>

          <!-- Metadata preview -->
          <div v-if="celoDryResult" class="metadata-preview q-mb-sm">
            <div class="form-section-label">METADATA PREVIEW (dry run)</div>
            <div v-for="w in celoDryResult.warnings" :key="w" class="vp-warning">⚠ {{ w }}</div>
            <div v-for="e in celoDryResult.errors"   :key="e" class="mint-error">✗ {{ e }}</div>
            <pre class="meta-json">{{ celoDryResult.metadataJson.slice(0, 800) }}{{ celoDryResult.metadataJson.length > 800 ? '\n…' : '' }}</pre>
          </div>

          <div class="wallet-status q-mb-sm" v-if="walletAddress">
            <q-icon name="account_balance_wallet" size="12px" color="green-5" class="q-mr-xs" />
            {{ walletAddress.slice(0, 6) }}…{{ walletAddress.slice(-4) }} connected
          </div>

          <div class="row q-gutter-xs">
            <q-btn unelevated color="green-8" icon="mdi-eye" label="Dry Run" @click="celoDryRun" :loading="celoLoading" class="col" />
            <q-btn outline color="green-6" icon="mdi-send" label="Mint on Alfajores" @click="celoExecute"
              :disable="!celoCanMint" :loading="celoLoading" class="col" />
          </div>
          <div v-if="celoResult" class="mint-result q-mt-sm" :class="celoResult.success ? 'mint-result--ok' : 'mint-result--fail'">
            <template v-if="celoResult.success">
              ✓ Minted — <a :href="celoResult.explorerUrl" target="_blank" rel="noopener">View on Celoscan</a>
            </template>
            <template v-else>✗ {{ celoResult.error }}</template>
          </div>
        </div>
      </q-tab-panel>

    </q-tab-panels>

    </div><!-- /mint-forms -->

  </q-page>
</template>

<script setup lang="ts">
/**
 * MintPage.vue — NFT minting interface
 *
 * SECURITY: Strict fee isolation enforced throughout.
 *   - Community return (80% Resonance Split) is computed from its own variable.
 *   - Platform draw (0%) and Hardware Fund (10%) are computed independently.
 *   - Network gas costs are informational only — displayed in a separate UI block
 *     and never combined with community values in any expression.
 *   - Dry-run mode is always offered before any wallet interaction.
 *
 * TODO (next sprint):
 *   - Bind exolocation tab to buildARC3() in src/lib/algorand/exolocation-metadata.js
 *   - Bind station tab to mintStation() in src/lib/solana/mint-station.ts
 *   - Connect wallet store (useWalletStore) for address resolution
 *   - Add IPFS upload step (Pinata) before on-chain mint
 */

import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlanetClaimCard      from 'src/components/PlanetClaimCard.vue'
import MintPathwayWizard    from 'src/components/MintPathwayWizard.vue'
import type { MintPathway } from 'src/lib/mint-config'
import CollectorCard         from 'src/components/CollectorCard.vue'
import {
  COLLECTOR_CARDS,
} from 'src/data/collector-cards'
import { POLYGON_AMOY, CELO_ALFAJORES, TESTNET_CONTRACTS } from 'src/lib/evm/chains'
import {
  buildSunlightMeta, buildWqCertMeta, buildCommunityBadgeMeta, buildEcoOpsTokenMeta,
  buildExolocMeta,
  type ExolocParams,
} from 'src/lib/evm/erc721-metadata'
import {
  dryRunMint,
  executeMint  as evmExecuteMint,   // renamed to avoid clash with local doMint
  requestAccount, hasInjectedWallet, switchToChain, hasPinata,
  type DryRunResult, type MintResult,
} from 'src/lib/evm/mint-evm'
import WalletOnboardingGuide from 'src/components/WalletOnboardingGuide.vue'
import { useSettlements, surfaceKey, clusterKey } from 'src/lib/settlements'

const { hasSettlement, addSettlement } = useSettlements()

const tab           = ref('exolocation')
const walletAddress = ref<string | null>(null)
const formsAnchor   = ref<HTMLElement | null>(null)

function scrollToForms() {
  formsAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Hero card fan ─────────────────────────────────────────────────────────────

const fanCards = [
  COLLECTOR_CARDS[0]!,   // #1 Blue Supergiant
  COLLECTOR_CARDS[6]!,   // #7 Nebula
  COLLECTOR_CARDS[1]!,   // #2 Wormhole Conduit (centre)
  COLLECTOR_CARDS[3]!,   // #4 Habitable World
  COLLECTOR_CARDS[2]!,   // #3 Cosmic Web
]

const FAN_ANGLES = [-22, -9, 0, 9, 22]
const FAN_YOFFS  = [28, 12, 0, 12, 28]
const FAN_Z      = [2, 3, 5, 3, 2]
const FAN_DELAY  = [0.6, 0.3, 0.0, 0.3, 0.6]

function fanStyle(i: number): Record<string, string> {
  return {
    transform:      `rotate(${FAN_ANGLES[i]}deg) translateY(${FAN_YOFFS[i]}px)`,
    zIndex:         String(FAN_Z[i]),
    animationDelay: FAN_DELAY[i] + 's',
  }
}

function fanCardWidth(i: number): number {
  return i === 2 ? 198 : (i === 1 || i === 3) ? 172 : 152
}

const heroStars = Array.from({ length: 40 }, (_, i) => {
  const rng = (n: number) => ((Math.sin(n * 127.1 + 17) * 43758.5) % 1 + 1) / 2
  return { id: i, x: rng(i*4)*100, y: rng(i*4+1)*100, r: 0.8+rng(i*4+2)*1.4, o: 0.15+rng(i*4+3)*0.45, d: rng(i)*4 }
})

// Connect wallet helper — called by either Polygon or Celo flows
async function ensureWallet(): Promise<string | null> {
  if (!hasInjectedWallet()) return null
  try {
    const addr = await requestAccount()
    walletAddress.value = addr
    return addr
  } catch {
    return null
  }
}

// ── Option catalogs ───────────────────────────────────────────────────────────

// Trophic hierarchy — ordered L1 (stellar) → L6 (liminal)
const COORD_SYSTEMS = [
  // ── Existing (L1–L3) ───────────────────────────────────────────────────
  { label: 'L1 · Stellar orbital zone',                         value: 'exo-stellar-orbital-v1'  },
  { label: 'L2 · Planet surface (lat/long polygon)',            value: 'exo-surface-v1'           },
  { label: 'L2 · Planet orbital altitude band',                 value: 'exo-orbital-v1'           },
  { label: 'L3 · Moon orbit (altitude above moon)',             value: 'exo-lunar-orbital-v1'     },
  // ── Moon-relative trophic levels (L4–L6) ──────────────────────────────
  { label: 'L4 · Moon surface  (SUBLUNARY)',                    value: 'exo-moon-surface-v1'      },
  { label: 'L5 · Moon–Planet Lagrange  (SYZYGY)  L1/L2/L4/L5', value: 'exo-moon-lagrange-v1'    },
  { label: 'L6 · Moon–Planet interface  (LIMINAL)',             value: 'exo-moon-interface-v1'   },
]

const MOON_LAGRANGE_OPTS = [
  { label: 'L4 — Leading Trojan (stable, permanent settlement)', value: 'L4' },
  { label: 'L5 — Trailing Trojan (stable, permanent settlement)', value: 'L5' },
  { label: 'L1 — Inner Gateway (unstable, requires station-keeping)', value: 'L1' },
  { label: 'L2 — Outer Observatory (unstable, requires station-keeping)', value: 'L2' },
]

const MOON_INTERFACE_OPTS = [
  { label: 'Hill Sphere Boundary — gravitational dominance transition', value: 'hill-sphere' },
  { label: 'Roche Limit Zone — tidal disruption inner boundary',        value: 'roche-limit' },
  { label: 'Tidal Lock Transition — synchronous rotation boundary',     value: 'tidal-lock-zone' },
  { label: 'Magnetosphere Interface — magnetic field boundary',         value: 'magnetosphere' },
  { label: 'Orbital Resonance Zone — mean motion resonance',            value: 'resonance-zone' },
]

const STATION_CATEGORIES = [
  { label: 'Gallery',           value: 'gallery'    },
  { label: 'WATSAN node',       value: 'watsan'     },
  { label: 'Energy node',       value: 'energy'     },
  { label: 'Healthcare post',   value: 'healthcare' },
  { label: 'Food production',   value: 'food'       },
  { label: 'Command module',    value: 'command'    },
]

const MODULE_TYPES = [
  { label: 'Gallery module',    value: 'gallery'    },
  { label: 'WATSAN module',     value: 'watsan'     },
  { label: 'Energy module',     value: 'energy'     },
  { label: 'Shelter module',    value: 'shelter'    },
  { label: 'Healthcare module', value: 'healthcare' },
  { label: 'Food module',       value: 'food'       },
]

const ECOCITY_CATEGORIES = [
  { label: 'WATSAN',     value: 'watsan'     },
  { label: 'ENERGY',     value: 'energy'     },
  { label: 'SHELTER',    value: 'shelter'    },
  { label: 'HEALTHCARE', value: 'healthcare' },
  { label: 'FOOD',       value: 'food'       },
]

// ── Form state ────────────────────────────────────────────────────────────────

const exo = ref({
  coordSystem:   'exo-surface-v1',
  refBody:       '',
  regionName:    '',
  boundary:      '',
  // Moon-specific fields (used when coordSystem is exo-moon-*)
  moonIndex:     1,         // moon ordinal (I=1, II=2, …)
  moonName:      '',        // auto-built from refBody + moonIndex
  lagrangePoint: 'L4',     // for exo-moon-lagrange-v1
  interfaceZone: 'hill-sphere',  // for exo-moon-interface-v1
  tidallyLocked: null as boolean | null,
})

// ── Pre-populate from surface-view claim links ────────────────────────────────

const route  = useRoute()
const router = useRouter()

// ── Claim params from PlanetClaimOverlay navigation ──────────────────────────

const claimHost    = computed(() => (route.query.host   as string) ?? '')
const claimPlanet  = computed(() => (route.query.planet as string) ?? '')
const claimLat     = computed(() => parseFloat((route.query.lat as string) ?? 'NaN'))
const claimLon     = computed(() => parseFloat((route.query.lon as string) ?? 'NaN'))
const hasClaimPlot = computed(() =>
  !!claimHost.value && !!claimPlanet.value && !isNaN(claimLat.value) && !isNaN(claimLon.value)
)

// ── Preview mode — arrived via "Preview first" from PlanetClaimOverlay ───────
// No settlement record is saved until the user explicitly confirms.

const isPreview = computed(() => route.query.preview === '1')

function confirmFromPreview() {
  if (!claimHost.value || !claimPlanet.value || isNaN(claimLat.value) || isNaN(claimLon.value)) return
  addSettlement({
    key:         surfaceKey(claimPlanet.value),
    type:        'surface',
    planetName:  claimPlanet.value,
    hostname:    claimHost.value,
    exolocation: `exo-surface-v1:${claimHost.value}:${claimPlanet.value}`,
    displayName: `${claimPlanet.value} · ${claimHost.value}`,
    lat:         claimLat.value,
    lon:         claimLon.value,
  })
  const params = new URLSearchParams({
    host:   claimHost.value,
    planet: claimPlanet.value,
    coord:  'exo-surface-v1',
    lat:    String(claimLat.value),
    lon:    String(claimLon.value),
  })
  void router.replace(`/mint?${params.toString()}`)
}

// Pathway wizard handler

const mintMode = computed((): 'surface-deed' | 'moon-orbital' | 'cluster-world' | 'cluster-outpost' | 'onboarding' | 'general' => {
  if (hasClaimPlot.value) return 'surface-deed'
  const coord = (route.query.coord as string) ?? ''
  if (coord.includes('moon') && route.query.host && route.query.planet) return 'moon-orbital'
  if (route.query.mode === 'cluster-world') return 'cluster-world'
  if (route.query.mode === 'cluster-outpost') return 'cluster-outpost'
  const tabQ = (route.query.tab as string) ?? ''
  if (tabQ === 'celo' || tabQ === 'polygon') return 'onboarding'
  return 'general'
})

// ── Cluster-world mode ────────────────────────────────────────────────────────

const cwSystem  = computed(() => (route.query.system  as string) ?? '')
const cwPlanet  = computed(() => (route.query.planet  as string) ?? '')
const cwCluster = computed(() => (route.query.cluster as string) ?? '')
const cwGalaxy  = computed(() => (route.query.galaxy  as string) ?? '')
const cwExolocation = computed(() =>
  `exo-cluster-v1:${cwCluster.value}:${cwGalaxy.value}:${cwSystem.value}:${cwPlanet.value}`
)

const selectedCwPathway = ref<string | null>(null)
const cwHandle          = ref('')
const showCwAdvanced    = ref(false)

const CW_ECO_PATHWAYS = [
  {
    id:    'eco',
    icon:  'mdi-leaf',
    title: 'Ecological Settlement',
    desc:  'Water, food, shelter node — full eco-ops field monitoring',
  },
  {
    id:    'learning',
    icon:  'mdi-school',
    title: 'Community Learning Hub',
    desc:  'Education, youth pathways, professional certificate support',
  },
  {
    id:    'watsan',
    icon:  'mdi-water',
    title: 'WATSAN Science Node',
    desc:  'Water quality monitoring, pH, turbidity, on-chain certificates',
  },
  {
    id:    'food',
    icon:  'mdi-sprout',
    title: 'Food Systems Station',
    desc:  'Permaculture, farm mapping, food co-op business management',
  },
  {
    id:    'health',
    icon:  'mdi-heart-pulse',
    title: 'Health & Green Business',
    desc:  'Healthcare outpost, clean energy training, green enterprise',
  },
  {
    id:    'command',
    icon:  'mdi-hexagon-multiple',
    title: 'Complete Station',
    desc:  'All five domains — for established SCD Hub communities',
  },
]

const cwSelectedLabel = computed(
  () => CW_ECO_PATHWAYS.find(p => p.id === selectedCwPathway.value)?.title ?? ''
)

function proceedCwMint() {
  // Record settlement intent in browser storage
  const sKey = clusterKey(cwCluster.value, cwGalaxy.value, cwSystem.value, cwPlanet.value || 'b')
  if (!hasSettlement(sKey)) {
    addSettlement({
      key:         sKey,
      type:        'cluster',
      planetName:  cwPlanet.value || 'b',
      hostname:    cwSystem.value,
      exolocation: cwExolocation.value,
      displayName: `${cwSystem.value} · ${cwPlanet.value || 'b'} (${cwCluster.value})`,
      clusterSlug: cwCluster.value,
      memberId:    cwGalaxy.value,
    })
  }
  // Pre-fill exolocation form and scroll to it
  exo.value.refBody     = cwSystem.value ? `${cwSystem.value}/${cwPlanet.value}` : cwPlanet.value
  exo.value.coordSystem = 'exo-surface-v1'
  exo.value.regionName  = cwHandle.value || cwExolocation.value
  exo.value.boundary    = cwExolocation.value
  if (selectedCwPathway.value) {
    const p = CW_ECO_PATHWAYS.find(pw => pw.id === selectedCwPathway.value)
    if (p) station.value.category = selectedCwPathway.value === 'health' ? 'healthcare' : selectedCwPathway.value
  }
  showCwAdvanced.value = true
  tab.value = 'exolocation'
  void nextTick(() => {
    const el = document.getElementById('exoloc-form')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// Moon orbital computeds
const MOON_ORDINALS = ['I','II','III','IV','V','VI','VII','VIII','IX']
const moonOrdinal = computed(() => {
  const idx = parseInt((route.query.moon as string) ?? '1') || 1
  return MOON_ORDINALS[idx - 1] ?? String(idx)
})
const moonCoordVariant = computed(() => {
  const c = (route.query.coord as string) ?? ''
  if (c === 'exo-moon-lagrange-v1')   return 'lagrange'
  if (c === 'exo-moon-interface-v1')  return 'interface'
  return 'surface'
})
const moonCoordLabel = computed(() => {
  const v = moonCoordVariant.value
  if (v === 'lagrange')  return 'L5 SYZYGY POINT'
  if (v === 'interface') return 'L6 LIMINAL ZONE'
  return 'L4 SURFACE'
})

// Cluster outpost computeds
const clusterGalaxy = computed(() => (route.query.galaxy as string) ?? '')
const clusterMorph  = computed(() => (route.query.morph  as string) ?? '')
const MORPH_LABELS: Record<string, string> = {
  E: 'Elliptical', S0: 'Lenticular', Sa: 'Spiral (Sa)', Sb: 'Spiral (Sb)',
  Sc: 'Spiral (Sc)', Irr: 'Irregular', cD: 'cD Giant', BCG: 'BCG Dominant'
}
const clusterMorphFull = computed(() => MORPH_LABELS[clusterMorph.value] ?? clusterMorph.value)
const clusterDots = computed(() => {
  const dots = []
  for (let i = 0; i < 48; i++) {
    const a = (i * 137.508) % 360, r = Math.sqrt(i / 48) * 48
    dots.push({
      id: i,
      x: 50 + r * Math.cos(a * Math.PI / 180) * 0.95,
      y: 50 + r * Math.sin(a * Math.PI / 180) * 0.95,
      r: 1 + Math.random() * 2.5,
      o: 0.15 + Math.random() * 0.45
    })
  }
  return dots
})

// Onboarding computeds
const onboardChain = computed(() => (route.query.tab as string) === 'polygon' ? 'polygon' : 'celo')
const onboardChainLabel = computed(() => onboardChain.value === 'polygon' ? 'Polygon (MATIC)' : 'Celo')

onMounted(async () => {
  const { host, planet, coord, moon, lat, lon, mode, system, cluster, galaxy } = route.query as Record<string, string>

  // cluster-world mode: identity is shown in the hero — no form pre-fill until pathway chosen
  if (mode === 'cluster-world') return

  if (!host && !planet) return
  if (host && planet) exo.value.refBody = `${host}/${planet}`
  if (coord)          exo.value.coordSystem = coord
  if (moon)           exo.value.moonIndex = parseInt(moon) || 1
  if (lat && lon) {
    const latN = parseFloat(lat), lonN = parseFloat(lon)
    const latStr = `${Math.abs(latN)}${latN >= 0 ? 'N' : 'S'}`
    const lonStr = `${Math.abs(lonN)}${lonN >= 0 ? 'E' : 'W'}`
    exo.value.regionName = `${latStr}, ${lonStr}`
    exo.value.boundary   = `exo-surface-v1:${planet}:${latStr},${lonStr}`
  }
  tab.value = 'exolocation'

  await nextTick()
  const el = document.getElementById('exoloc-form')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

// Derived: is the selected coordinate system a moon-relative one?
const isMoonCoord = computed(() =>
  ['exo-moon-surface-v1', 'exo-moon-lagrange-v1', 'exo-moon-interface-v1',
   'exo-lunar-orbital-v1'].includes(exo.value.coordSystem)
)
const isMoonSurface  = computed(() => exo.value.coordSystem === 'exo-moon-surface-v1')
const isMoonLagrange = computed(() => exo.value.coordSystem === 'exo-moon-lagrange-v1')
const isMoonInterface = computed(() => exo.value.coordSystem === 'exo-moon-interface-v1')

const station = ref({
  name:            '',
  category:        'gallery',
  exolocationRef:  '',
})

const module_ = ref({
  type:       'gallery',
  stationRef: '',
})

const solution = ref({
  category:         'watsan',
  impactMetric:     '',
  recipientAddress: '',
})

// ── Fee isolation — each value has its own independent variable path ──────────
// NEVER combine community yield and network fee in a single expression.
//
// CURRENT MODEL: initial mint is FREE (utility-first, network growth phase).
// Exotopia does not operate a secondary market or resale mechanism, so there
// is no aftermarket fee to compute or display — see
// RISK_REDUCTION_RECOMMENDATIONS.md §1 for why this was removed rather than
// just set to a 0% placeholder. Never reintroduce a fiat (e.g. KES) exchange
// rate display tied to in-app points/tokens — see §2.

// Initial mint cost — FREE
const mintCostUSD = '0.00'

// ── Validation ────────────────────────────────────────────────────────────────

const exoFormValid     = computed(() => exo.value.refBody.trim().length > 0 && exo.value.regionName.trim().length >= 2)
const stationFormValid = computed(() => station.value.name.trim().length > 0 && station.value.exolocationRef.startsWith('exo-'))
const moduleFormValid  = computed(() => module_.value.stationRef.trim().length > 0)
const solutionFormValid = computed(() => solution.value.impactMetric.trim().length > 0 && solution.value.recipientAddress.trim().length > 10)

// ── Exolocation EVM state (Polygon Amoy) ──────────────────────────────────────

const exoloDryResult = ref<DryRunResult | null>(null)
const exoloResult    = ref<MintResult   | null>(null)
const exoloLoading   = ref(false)

// ── Pre-mint disclaimer — required for every mint type on this page ──────────
// An affirmative, timestamped click-through beats a buried ToS clause under
// consumer-protection review. Logged to localStorage (one entry per accepted
// mint action) rather than only held in memory, so it survives page reload.
const mintDisclaimerAccepted = ref(false)

function logMintDisclaimerAcceptance(mintType: string) {
  const record = { mintType, acceptedAt: new Date().toISOString() }
  try {
    const key = 'exo.mint-disclaimer-log'
    const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[]
    existing.push(record)
    localStorage.setItem(key, JSON.stringify(existing))
  } catch { /* private mode / storage unavailable — non-fatal, mint still proceeds */ }
  console.info('[MINT DISCLAIMER ACCEPTED]', record)
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function dryRun(type: string) {
  if (type !== 'exolocation') {
    console.info(`[MINT DRY RUN] type=${type} — no on-chain transaction dispatched`)
    return
  }
  exoloDryResult.value = null
  exoloResult.value    = null
  exoloLoading.value   = true
  try {
    const meta     = buildExolocMeta(buildExolocParams())
    const addr     = walletAddress.value ?? await ensureWallet() ?? undefined
    const contract = TESTNET_CONTRACTS.amoy.exolocNft!
    exoloDryResult.value = await dryRunMint(meta, POLYGON_AMOY, contract, addr)
  } finally {
    exoloLoading.value = false
  }
  // Also show the metadata preview panel
  refreshMetaPreview()
  metaPreviewOpen.value = true
}

// ── Metadata preview state ────────────────────────────────────────────────────

const metaPreview     = ref<string | null>(null)    // pretty-printed JSON for display
const metaPreviewOpen = ref(false)
const metaCopied      = ref(false)

function buildExolocParams(): ExolocParams {
  const [rawHost, rawPlanet] = exo.value.refBody.split('/')
  const host   = rawHost   ?? exo.value.refBody
  const planet = rawPlanet ?? exo.value.refBody

  // Try to read lat/lon from route if they were set by PlanetClaimOverlay
  const latVal = parseFloat((route.query.lat as string) ?? '')
  const lonVal = parseFloat((route.query.lon as string) ?? '')

  return {
    planet_name:      planet.trim(),
    hostname:         host.trim(),
    coord_system:     exo.value.coordSystem,
    region:           exo.value.regionName || exo.value.boundary.split(':').pop() || '',
    boundary:         exo.value.boundary   || `${exo.value.coordSystem}:${planet.trim()}:${exo.value.regionName}`,
    plot_lat:         isNaN(latVal) ? undefined : latVal,
    plot_lon:         isNaN(lonVal) ? undefined : lonVal,
    zone_name:        undefined,
    climate_class:    undefined,
    trophic_level:    exo.value.coordSystem.includes('moon') ? 'L4 SUBLUNARY' : 'L2 PLANETARY',
    pathway_id:       station.value.category || undefined,
    moon_index:       exo.value.moonIndex > 1 ? exo.value.moonIndex : undefined,
    lagrange_point:   exo.value.lagrangePoint || undefined,
    interface_zone:   exo.value.interfaceZone || undefined,
    resonance_split:  { creator: 1.00, community_fund: 0, platform: 0 },
  }
}

function refreshMetaPreview() {
  try {
    const params = buildExolocParams()
    const meta   = buildExolocMeta(params)
    metaPreview.value = JSON.stringify(meta, null, 2)
  } catch {
    metaPreview.value = null
  }
}

async function copyMetaPreview() {
  if (!metaPreview.value) return
  await navigator.clipboard.writeText(metaPreview.value)
  metaCopied.value = true
  setTimeout(() => { metaCopied.value = false }, 2000)
}

// ── doMint — unified local dispatcher (replaces shadowed import name) ──────────
// Builds metadata, shows preview, then dispatches to the right chain driver.
// Algorand (exolocation/station/module/solution) → stub + preview for now.
// EVM chains (Polygon, Celo) → use evmExecuteMint via polyExecute / celoExecute.

const arc69Preview = computed((): string => {
  if (!metaPreview.value) return ''
  try {
    const params = buildExolocParams()
    const note   = {
      standard: 'arc69',
      media_url: 'ipfs://<CID-after-upload>',
      mime_type: 'application/json',
      properties: {
        exoloc:      `${params.coord_system}:${params.planet_name}:${params.region}`,
        chain:       'algorand',
        protocol:    'pon_ink_v1',
        resonance:   params.resonance_split,
      },
    }
    return JSON.stringify(note, null, 2)
  } catch { return '' }
})

async function doMint(type: string) {
  if (!mintDisclaimerAccepted.value) {
    exoloResult.value = { success: false, error: 'Please accept the disclaimer above before minting.' }
    return
  }

  if (type !== 'exolocation') {
    refreshMetaPreview()
    metaPreviewOpen.value = true
    // Show a visible result message instead of silent console.info
    exoloResult.value = {
      success: false,
      error: `${type} chain integration is in development — metadata preview is shown above.`,
    }
    return
  }

  exoloResult.value  = null
  exoloLoading.value = true
  try {
    // Fail fast on undeployed contract — no wallet connection needed
    const contract = TESTNET_CONTRACTS.amoy.exolocNft!
    if (contract.startsWith('PLACE')) {
      exoloResult.value = {
        success: false,
        error: 'Contract not yet deployed on Polygon Amoy. Set VITE_AMOY_EXOLOC_CONTRACT in .env.local after running the deploy script.',
      }
      return
    }

    const addr = walletAddress.value ?? await ensureWallet()
    if (!addr) { exoloResult.value = { success: false, error: 'No wallet connected. Install MetaMask or another EVM wallet.' }; return }
    walletAddress.value = addr

    logMintDisclaimerAcceptance(type)
    const meta = buildExolocMeta({ ...buildExolocParams(), minted_by: addr })
    exoloResult.value = await evmExecuteMint(meta, POLYGON_AMOY, contract, addr)
  } finally {
    exoloLoading.value = false
  }
}

// ── Polygon / MATIC state ─────────────────────────────────────────────────────

const POLY_TYPES = [
  { label: '$SUNLIGHT SUNLIGHT NFT',        value: 'sunlight'    },
  { label: 'Water Quality Cert',     value: 'wq_cert' },
]
const SUNLIGHT_LICENSES = [
  { label: 'Personal use',     value: 'personal_use' },
  { label: 'Commercial',       value: 'commercial'   },
  { label: 'Sync licensing',   value: 'sync'         },
  { label: 'Exclusive rights', value: 'exclusive'    },
]

const polyType    = ref<'sunlight' | 'wq_cert'>('sunlight')
const polyLoading = ref(false)
const polyDryResult = ref<DryRunResult | null>(null)
const polyResult    = ref<MintResult | null>(null)
const polyGasEstimate = ref('connect wallet to estimate')

const sunlight = ref({
  title: '', artist: '', duration_sec: 0, bpm: null as number | null,
  key: null as string | null, license: 'personal_use' as const,
  ipfs_audio_cid: '', description: '',
})

const wqCert = ref({
  cert_id: '', location_name: '', measured_by: '',
  ph: null as number | null, turbidity_ntu: null as number | null,
  nitrate_mg_l: null as number | null, potable: false, date_utc: new Date().toISOString().split('T')[0]!,
})

const polyCanMint = computed(() => !!polyDryResult.value?.valid)

async function polyDryRun() {
  polyLoading.value = true
  polyResult.value  = null
  try {
    const meta = polyType.value === 'sunlight'
      ? buildSunlightMeta({ ...sunlight.value, license: sunlight.value.license as any })
      : buildWqCertMeta(wqCert.value)
    const addr = walletAddress.value ?? await ensureWallet() ?? undefined
    const contract = polyType.value === 'sunlight'
      ? TESTNET_CONTRACTS.amoy.barsNft!
      : TESTNET_CONTRACTS.amoy.wqCertNft!
    polyDryResult.value = await dryRunMint(meta, POLYGON_AMOY, contract, addr ?? undefined)
    if (polyDryResult.value.estimatedGasEth) {
      polyGasEstimate.value = polyDryResult.value.estimatedGasEth
    }
  } catch (e: any) {
    polyDryResult.value = { valid: false, metadataJson: '', metadataBytes: 0, errors: [e.message ?? String(e)], warnings: [] }
  } finally {
    polyLoading.value = false
  }
}

async function polyExecute() {
  polyLoading.value = true
  try {
    const addr = walletAddress.value ?? await ensureWallet()
    if (!addr) { polyResult.value = { success: false, error: 'No wallet connected. Install MetaMask or another EVM wallet.' }; return }
    const meta     = polyType.value === 'sunlight'
      ? buildSunlightMeta({ ...sunlight.value, license: sunlight.value.license as any })
      : buildWqCertMeta(wqCert.value)
    const contract = polyType.value === 'sunlight'
      ? TESTNET_CONTRACTS.amoy.barsNft!
      : TESTNET_CONTRACTS.amoy.wqCertNft!
    polyResult.value = await evmExecuteMint(meta, POLYGON_AMOY, contract, addr)
  } catch (e: any) {
    polyResult.value = { success: false, error: e.message ?? String(e) }
  } finally {
    polyLoading.value = false
  }
}

// ── Celo state ────────────────────────────────────────────────────────────────

const CELO_TYPES = [
  { label: 'Community Badge',         value: 'community_badge' },
  { label: 'Eco-ops Token',           value: 'eco_ops_token'   },
]
const ECO_OPS_TYPES = [
  { label: 'Water Quality',    value: 'wqMap'        },
  { label: 'Waste Mapping',    value: 'garbageMap'   },
  { label: 'Farm Practice',    value: 'farmMap'       },
  { label: 'Resource Product', value: 'productMap'   },
  { label: 'Transport',        value: 'transportMap' },
  { label: 'Storage',          value: 'storageMap'   },
  { label: 'Source',           value: 'sourceMap'    },
  { label: 'Cleaning',         value: 'cleaningMap'  },
]

const celoType    = ref<'community_badge' | 'eco_ops_token'>('community_badge')
const celoLoading = ref(false)
const celoDryResult = ref<DryRunResult | null>(null)
const celoResult    = ref<MintResult | null>(null)
const celoGasEstimate = ref('connect wallet to estimate')

const badge = ref({
  badge_id: `BADGE-${Date.now()}`, badge_name: '', community: '',
  recipient: '', awarded_for: '', tier: 'bronze' as 'bronze'|'silver'|'gold'|'platinum',
})

const ecoToken = ref({
  token_id: '', activity_type: 'wqMap' as any,
  participant: '', location_name: '', checkin_count: 0,
  milestone: '', group: null as string | null,
})

const celoCanMint = computed(() => !!celoDryResult.value?.valid)

async function celoDryRun() {
  celoLoading.value = true
  celoResult.value  = null
  try {
    const meta = celoType.value === 'community_badge'
      ? buildCommunityBadgeMeta(badge.value)
      : buildEcoOpsTokenMeta(ecoToken.value)
    const addr     = walletAddress.value ?? await ensureWallet() ?? undefined
    const contract = celoType.value === 'community_badge'
      ? TESTNET_CONTRACTS.alfajores.communityBadge!
      : TESTNET_CONTRACTS.alfajores.ecoOpsToken!
    celoDryResult.value = await dryRunMint(meta, CELO_ALFAJORES, contract, addr ?? undefined)
    if (celoDryResult.value.estimatedGasEth) celoGasEstimate.value = celoDryResult.value.estimatedGasEth
  } catch (e: any) {
    celoDryResult.value = { valid: false, metadataJson: '', metadataBytes: 0, errors: [e.message ?? String(e)], warnings: [] }
  } finally {
    celoLoading.value = false
  }
}

async function celoExecute() {
  celoLoading.value = true
  try {
    const addr = walletAddress.value ?? await ensureWallet()
    if (!addr) { celoResult.value = { success: false, error: 'No wallet connected. Install MetaMask, Celo Valora, or another EVM wallet.' }; return }
    const meta     = celoType.value === 'community_badge'
      ? buildCommunityBadgeMeta(badge.value)
      : buildEcoOpsTokenMeta(ecoToken.value)
    const contract = celoType.value === 'community_badge'
      ? TESTNET_CONTRACTS.alfajores.communityBadge!
      : TESTNET_CONTRACTS.alfajores.ecoOpsToken!
    celoResult.value = await evmExecuteMint(meta, CELO_ALFAJORES, contract, addr)
  } catch (e: any) {
    celoResult.value = { success: false, error: e.message ?? String(e) }
  } finally {
    celoLoading.value = false
  }
}
</script>

<style scoped>
.mint-form {
  max-width: 540px;
}

.form-section-label {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.14em;
  color: rgba(0, 180, 220, 0.60);
  margin-bottom: 8px;
}

/* ── Fee isolation card ──────────────────────────────────────── */

.fee-isolation-card {
  background: rgba(0, 8, 22, 0.80);
  border: 1px solid rgba(0, 160, 220, 0.18);
  border-radius: 6px;
  padding: 10px 12px;
  font-family: 'Courier New', monospace;
  font-size: 9px;
}

.fee-block { padding: 4px 0; }

.fee-block--community {
  border-left: 3px solid rgba(0, 200, 240, 0.60);
  padding-left: 10px;
}

/* Free-to-mint indicator — green border, no cost */
.fee-block--free {
  border-left: 3px solid rgba(60, 220, 120, 0.70);
  padding-left: 10px;
  background: rgba(0, 60, 30, 0.12);
  border-radius: 0 3px 3px 0;
}

.fee-block--network {
  padding-left: 13px;
}

.fee-block-label {
  font-size: 7px;
  letter-spacing: 0.12em;
  color: rgba(80, 130, 160, 0.65);
  margin-bottom: 4px;
}

.fee-block-value {
  font-size: 15px;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}

.fee-block-note {
  font-size: 7px;
  color: rgba(80, 130, 160, 0.55);
  letter-spacing: 0.03em;
  line-height: 1.5;
}

.fee-note--warn {
  color: rgba(200, 140, 60, 0.65);
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
  color: rgba(100, 150, 180, 0.75);
  font-size: 9px;
}

/* ── Trophic level badge ─────────────────────────────────────────── */

.trophic-badge {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: rgba(0, 200, 240, 0.70);
  padding: 3px 10px;
  border: 1px solid rgba(0, 160, 200, 0.28);
  border-radius: 3px;
  background: rgba(0, 40, 80, 0.25);
  display: inline-block;
}

/* ── Moon section ────────────────────────────────────────────────── */

.moon-section-label {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.16em;
  color: rgba(180, 140, 255, 0.65);
  margin: 8px 0 5px;
  border-left: 2px solid rgba(160, 100, 255, 0.40);
  padding-left: 7px;
}

.lagrange-physics {
  margin-bottom: 8px;
}

.lagrange-stability {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 3px;
}

.lagrange-stability.stable {
  color: rgba(60, 220, 120, 0.85);
  background: rgba(0, 80, 40, 0.30);
  border: 1px solid rgba(60, 200, 100, 0.35);
}

.lagrange-stability.unstable {
  color: rgba(255, 160, 40, 0.85);
  background: rgba(80, 40, 0, 0.30);
  border: 1px solid rgba(220, 140, 40, 0.35);
}

.validation-hint {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(200, 140, 60, 0.70);
  margin-top: 6px;
  letter-spacing: 0.04em;
}
.validation-hint--info {
  color: rgba(80, 180, 220, 0.65);
}

.mint-disclaimer-check {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 8px 0;
  font-family: 'Courier New', monospace;
  font-size: 9.5px;
  line-height: 1.5;
  color: rgba(180, 200, 220, 0.80);
  cursor: pointer;
}

/* ── Live metadata preview ────────────────────────────────────── */

.meta-preview-wrap {
  border: 1px solid rgba(0, 140, 190, 0.20);
  border-radius: 5px;
  overflow: hidden;
  background: rgba(0, 5, 14, 0.70);
}

.meta-preview-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(0, 15, 35, 0.60);
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid rgba(0, 100, 160, 0.15);
}

.meta-preview-label {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.16em;
  color: rgba(0, 190, 230, 0.55);
  flex: 1;
}

.meta-preview-body { padding: 0; }

.meta-preview-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 10px;
  border-bottom: 1px solid rgba(0, 80, 130, 0.15);
}

.meta-byte-count {
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  color: rgba(60, 120, 160, 0.55);
}

.meta-preview-code {
  margin: 0;
  padding: 10px;
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  color: rgba(0, 210, 150, 0.78);
  background: rgba(0, 4, 10, 0.85);
  line-height: 1.55;
  overflow-x: auto;
  white-space: pre;
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 140, 100, 0.20) transparent;
}

.meta-arc69-label {
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  letter-spacing: 0.12em;
  color: rgba(0, 160, 190, 0.45);
  padding: 6px 10px 3px;
  border-top: 1px solid rgba(0, 80, 130, 0.15);
}

.meta-preview-code--arc69 {
  color: rgba(0, 180, 240, 0.72);
  max-height: 140px;
}

.meta-slide-enter-active { transition: max-height 0.24s ease, opacity 0.20s; max-height: 600px; }
.meta-slide-leave-active  { transition: max-height 0.18s ease, opacity 0.14s; }
.meta-slide-enter-from, .meta-slide-leave-to { max-height: 0; opacity: 0; }

/* ── Wallet onboarding wrapper ───────────────────────────────── */

.onboard-wrap {
  margin-bottom: 4px;
}

.onboard-fade-enter-active { transition: opacity 0.25s ease; }
.onboard-fade-leave-active  { transition: opacity 0.18s ease; }
.onboard-fade-enter-from,
.onboard-fade-leave-to      { opacity: 0; }

/* ── Chain badge ──────────────────────────────────────────────── */

.chain-badge {
  display: inline-flex;
  align-items: center;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.10em;
  padding: 3px 10px;
  border-radius: 3px;
  border: 1px solid;
  margin-bottom: 10px;
}

.chain-badge--polygon {
  border-color: rgba(130, 80, 255, 0.45);
  color: rgba(150, 100, 255, 0.85);
  background: rgba(100, 50, 200, 0.08);
}

.chain-badge--celo {
  border-color: rgba(60, 200, 100, 0.45);
  color: rgba(80, 210, 120, 0.85);
  background: rgba(40, 160, 80, 0.08);
}

/* ── Metadata preview ─────────────────────────────────────────── */

.metadata-preview {
  background: rgba(0, 6, 18, 0.80);
  border: 1px solid rgba(0, 100, 140, 0.25);
  border-radius: 4px;
  padding: 8px 10px;
}

.meta-json {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(120, 190, 220, 0.80);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  margin: 6px 0;
  scrollbar-width: thin;
}

.meta-bytes {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  color: rgba(70, 120, 150, 0.60);
  letter-spacing: 0.06em;
}

/* ── Wallet status + result ───────────────────────────────────── */

.wallet-status {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(0, 200, 240, 0.65);
  letter-spacing: 0.06em;
}

.mint-error {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(255, 80, 60, 0.90);
  margin-bottom: 2px;
}

.mint-result {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid;
}
.mint-result--ok   { border-color: rgba(60, 220, 100, 0.45); color: rgba(60, 220, 100, 0.85); }
.mint-result--fail { border-color: rgba(255, 80, 60, 0.45);  color: rgba(255, 80, 60, 0.85); }
.mint-result a { color: inherit; }

/* Exolocation dry-run panel */
.dry-result {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  padding: 6px 10px;
  background: rgba(0, 20, 40, 0.50);
  border: 1px solid rgba(0, 160, 200, 0.20);
  border-radius: 4px;
}
.dry-err  { color: rgba(255, 80, 60, 0.90); margin-bottom: 2px; }
.dry-warn { color: rgba(255, 180, 40, 0.85); margin-bottom: 2px; }
.dry-gas  { color: rgba(0, 200, 240, 0.80); }
.dry-bytes { color: rgba(120, 190, 220, 0.75); }
.dry-ok   { color: rgba(60, 220, 100, 0.85); font-weight: bold; }

/* Inline exoloc mint result */
.mint-ok  {
  font-family: 'Courier New', monospace;
  font-size: 9px; padding: 6px 10px; border-radius: 4px;
  border: 1px solid rgba(60, 220, 100, 0.45); color: rgba(60, 220, 100, 0.85);
}
.mint-err {
  font-family: 'Courier New', monospace;
  font-size: 9px; padding: 6px 10px; border-radius: 4px;
  border: 1px solid rgba(255, 80, 60, 0.45); color: rgba(255, 80, 60, 0.85);
}
.mint-link { color: inherit; text-decoration: underline; margin-left: 6px; }
.mint-hash { margin-top: 4px; font-size: 7px; word-break: break-all; opacity: 0.70; }

.vp-warning {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(255, 150, 40, 0.85);
  padding: 2px 6px;
  border-left: 2px solid rgba(255, 150, 40, 0.45);
  margin: 2px 0;
}

/* ══════════════════════════════════════════════════════════════
   MINT PAGE — hero + layout
   ══════════════════════════════════════════════════════════════ */

.mint-page {
  background: #000408;
  min-height: 100vh;
  font-family: 'Courier New', monospace;
}

/* ── Pathway wizard section ─────────────────────────────────── */

.pathway-section {
  padding: 0 24px 28px;
  border-bottom: 1px solid rgba(0, 80, 130, 0.15);
  background: rgba(0, 3, 12, 0.60);
}

/* ── Claim hero (when arriving with plot coords) ─────────────── */

.claim-hero {
  padding: 0;
}

/* ── Gold-rush land deed header ────────────────────────────────── */

.deed-wrap {
  width: 100%;
  background: #0e0600;
  border-bottom: 1px solid rgba(200, 136, 10, 0.35);
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.70), 0 0 60px rgba(200, 136, 10, 0.08) inset;
}

.deed-svg {
  display: block;
  width: 100%;
  height: auto;
}

/* ── Compact deed context bar (replaces configure heading in claim mode) ── */

.deed-context-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  background: rgba(28, 14, 0, 0.60);
  border: 1px solid rgba(200, 136, 10, 0.20);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 8.5px;
  letter-spacing: 0.08em;
  color: rgba(200, 160, 60, 0.70);
}

.dcb-star {
  font-size: 11px;
  color: rgba(220, 160, 20, 0.65);
  flex-shrink: 0;
}
.dcb-text { flex: 1; }

/* Keep old label classes in case referenced elsewhere */
.claim-hero__label { display: none; }
.claim-hero__tag   { display: none; }
.claim-hero__sub   { display: none; }

/* ── Hero ────────────────────────────────────────────────────── */

.mint-hero {
  position: relative;
  min-height: 560px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  padding: 60px 40px 50px;
  overflow: hidden;
  background: radial-gradient(ellipse 80% 100% at 60% 50%, rgba(0,40,80,0.35) 0%, transparent 70%);
  border-bottom: 1px solid rgba(0, 120, 180, 0.18);
}

/* ── Star field ──────────────────────────────────────────────── */

.hero-stars { position: absolute; inset: 0; pointer-events: none; }

.hero-star {
  position: absolute;
  border-radius: 50%;
  background: #ffffff;
  animation: star-twinkle 4s ease-in-out infinite alternate;
}

@keyframes star-twinkle {
  from { opacity: var(--star-opacity, 0.3); }
  to   { opacity: calc(var(--star-opacity, 0.3) * 0.35); }
}

/* ── Copy ────────────────────────────────────────────────────── */

.hero-copy {
  flex: 0 0 420px;
  max-width: 420px;
  position: relative;
  z-index: 2;
}

.hero-edition {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 8px;
  letter-spacing: 0.18em;
  color: rgba(255, 215, 0, 0.65);
  margin-bottom: 14px;
}

.edition-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #ffd700;
  box-shadow: 0 0 8px rgba(255,215,0,0.55);
  animation: edition-pulse 2.5s ease-in-out infinite;
}

@keyframes edition-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(255,215,0,0.55); }
  50%       { opacity: 0.6; box-shadow: 0 0 3px rgba(255,215,0,0.25); }
}

.hero-heading {
  font-family: 'Courier New', monospace;
  font-size: clamp(26px, 3.5vw, 36px);
  font-weight: 400;
  line-height: 1.25;
  color: rgba(200, 230, 255, 0.92);
  letter-spacing: 0.02em;
  margin: 0 0 14px;
}

.hero-heading-accent {
  color: #00e5ff;
  display: inline-block;
}

.hero-desc {
  font-size: 10px;
  color: rgba(120, 170, 200, 0.72);
  line-height: 1.70;
  margin-bottom: 16px;
  max-width: 380px;
}

.hero-rarities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.rarity-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 8px;
  letter-spacing: 0.10em;
  padding: 3px 9px;
  border: 1px solid;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.40);
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.free-badge {
  font-size: 8px;
  letter-spacing: 0.14em;
  padding: 3px 10px;
  border-radius: 3px;
  background: rgba(0, 80, 40, 0.45);
  border: 1px solid rgba(34, 204, 102, 0.45);
  color: rgba(34, 220, 120, 0.90);
}

.chain-list {
  font-size: 7px;
  letter-spacing: 0.12em;
  color: rgba(80, 130, 160, 0.60);
}

.hero-ctas { display: flex; align-items: center; }

/* ── Card fan ────────────────────────────────────────────────── */

.hero-fan {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex: 0 0 auto;
  position: relative;
  height: 300px;
  margin-right: 20px;
  /* Overlap cards with negative margins */
  gap: -28px;
  padding-bottom: 16px;
  cursor: pointer;
}

.fan-slot {
  position: relative;
  flex-shrink: 0;
  transform-origin: bottom center;
  transition: transform 0.25s ease, filter 0.25s ease;
  animation: fan-float 4.5s ease-in-out infinite alternate;
}

.fan-slot:hover {
  transform: rotate(0deg) translateY(-20px) scale(1.06) !important;
  filter: drop-shadow(0 16px 32px rgba(0, 200, 240, 0.35));
  z-index: 10 !important;
}

@keyframes fan-float {
  from { margin-bottom: 0px; }
  to   { margin-bottom: 8px; }
}

/* ── Ticker ──────────────────────────────────────────────────── */

.edition-ticker {
  background: rgba(0, 6, 18, 0.90);
  border-top: 1px solid rgba(0, 100, 140, 0.25);
  border-bottom: 1px solid rgba(0, 100, 140, 0.25);
  padding: 6px 0;
  overflow: hidden;
  white-space: nowrap;
}

.ticker-inner {
  display: inline-block;
  animation: ticker-scroll 28s linear infinite;
}

@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.ticker-item {
  display: inline;
  font-size: 8px;
  letter-spacing: 0.10em;
  color: rgba(80, 130, 160, 0.55);
  margin-right: 12px;
}

.ticker-num {
  color: rgba(0, 180, 220, 0.50);
  margin-right: 5px;
}

.ticker-sep {
  margin: 0 8px;
  opacity: 0.30;
}

.ticker-inner--cw {
  animation-duration: 22s;
}
.ticker-inner--cw .ticker-num {
  color: rgba(0, 210, 180, 0.65);
  font-size: 7px;
  letter-spacing: 0.14em;
}
.ticker-inner--cw .ticker-item {
  color: rgba(100, 200, 190, 0.60);
}

/* ── Forms section ───────────────────────────────────────────── */

.mint-forms {
  background: #000408;
  border-top: 1px solid rgba(0, 80, 120, 0.22);
  scroll-margin-top: 54px;  /* below fixed header */
}

/* ── Responsive ──────────────────────────────────────────────── */

@media (max-width: 900px) {
  .mint-hero {
    flex-direction: column;
    padding: 36px 20px 40px;
    min-height: auto;
  }
  .hero-copy   { flex: 0 0 auto; max-width: 100%; }
  .hero-fan    { height: 240px; }
}

/* ══════════════════════════════════════════════════════════════
   MOON ORBITAL HERO
   ══════════════════════════════════════════════════════════════ */

.moon-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
  background: linear-gradient(135deg, #030518 0%, #050d2a 50%, #030822 100%);
  border-bottom: 1px solid rgba(60, 120, 220, 0.25);
  overflow: hidden;
  min-height: 300px;
}

.moon-hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.moon-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(80, 140, 255, 0.08);
  animation: moon-pulse 4s ease-in-out infinite;
}
.moon-ring--1 { width: 320px; height: 320px; top: -80px; left: -60px; animation-delay: 0s; }
.moon-ring--2 { width: 500px; height: 500px; top: -170px; left: -150px; animation-delay: 1.4s; border-color: rgba(80,120,220,0.05); }
.moon-ring--3 { width: 160px; height: 160px; bottom: -20px; right: 200px; animation-delay: 2.8s; border-color: rgba(120,180,255,0.06); }
@keyframes moon-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%       { opacity: 1.0; transform: scale(1.015); }
}

.moon-hero__diagram {
  flex: 0 0 300px;
  width: 300px;
  height: 260px;
}

.moon-hero__copy {
  flex: 1;
  padding: 36px 40px 36px 20px;
  position: relative;
  z-index: 1;
}

.moon-hero__tag {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.18em;
  color: rgba(100, 180, 255, 0.70);
  margin-bottom: 10px;
}
.moon-hero__tag-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #60b0ff;
  box-shadow: 0 0 8px #60b0ff;
}

.moon-hero__heading {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: rgba(200, 225, 255, 0.92);
  margin: 0 0 12px;
  letter-spacing: 0.04em;
}
.moon-hero__planet { color: rgba(140, 200, 255, 0.85); }
.moon-hero__sep    { color: rgba(80, 120, 180, 0.55); font-weight: 300; }
.moon-hero__moon   { color: rgba(200, 220, 255, 0.65); font-size: 22px; }

.moon-hero__coord-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.14em;
  margin-bottom: 14px;
}
.moon-hero__coord-badge--surface   { background: rgba(40,100,200,0.25); border: 1px solid rgba(80,160,255,0.30); color: rgba(140,200,255,0.90); }
.moon-hero__coord-badge--lagrange  { background: rgba(60,40,160,0.25); border: 1px solid rgba(120,100,255,0.30); color: rgba(180,160,255,0.90); }
.moon-hero__coord-badge--interface { background: rgba(20,80,120,0.25); border: 1px solid rgba(40,160,200,0.30); color: rgba(100,200,220,0.90); }
.moon-hero__coord-icon { font-size: 11px; }

.moon-hero__desc {
  font-size: 12.5px;
  line-height: 1.7;
  color: rgba(160, 195, 230, 0.70);
  margin: 0 0 18px;
  max-width: 420px;
}

.moon-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.12em;
}
.moon-hero__free     { color: rgba(80, 220, 140, 0.80); }
.moon-hero__protocol { color: rgba(80, 120, 180, 0.55); }

/* ══════════════════════════════════════════════════════════════
   CLUSTER OUTPOST HERO
   ══════════════════════════════════════════════════════════════ */

.cluster-hero {
  position: relative;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #0a0200 0%, #160600 50%, #0c0200 100%);
  border-bottom: 1px solid rgba(200, 80, 20, 0.22);
  overflow: hidden;
  min-height: 300px;
}

.cluster-hero__plasma {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.plasma-ring {
  position: absolute;
  border-radius: 50%;
  animation: plasma-pulse 5s ease-in-out infinite;
}
.plasma-ring--1 { width: 280px; height: 280px; top: -40px; left: 260px; border: 1px solid rgba(255,80,10,0.10); animation-delay: 0s; }
.plasma-ring--2 { width: 460px; height: 460px; top: -130px; left: 170px; border: 1px solid rgba(255,100,20,0.06); animation-delay: 1.8s; }
.plasma-ring--3 { width: 160px; height: 160px; top: 60px; left: 340px; border: 1px solid rgba(255,150,40,0.14); animation-delay: 3.2s; }
@keyframes plasma-pulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 1.0; }
}

.plasma-dots { position: absolute; inset: 0; }
.plasma-dot  { position: absolute; border-radius: 50%; background: rgba(255,180,80,0.65); }

.cluster-hero__xray {
  flex: 0 0 300px;
  width: 300px;
  height: 260px;
}

.cluster-hero__copy {
  flex: 1;
  padding: 36px 40px 36px 20px;
  position: relative;
  z-index: 1;
}

.cluster-hero__tag {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.18em;
  color: rgba(255, 140, 40, 0.70);
  margin-bottom: 10px;
}
.cluster-hero__tag-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #ff8020;
  box-shadow: 0 0 10px #ff6000;
}

.cluster-hero__heading {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.15;
  color: rgba(255, 220, 160, 0.95);
  margin: 0 0 12px;
  letter-spacing: 0.06em;
  text-shadow: 0 0 30px rgba(255, 120, 20, 0.35);
}

.cluster-hero__morph-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.cluster-hero__morph-badge {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.12em;
  padding: 3px 9px;
  background: rgba(180, 60, 10, 0.30);
  border: 1px solid rgba(255, 100, 30, 0.28);
  border-radius: 3px;
  color: rgba(255, 180, 80, 0.90);
}
.cluster-hero__morph-hint {
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  letter-spacing: 0.12em;
  color: rgba(200, 100, 30, 0.50);
}

.cluster-hero__desc {
  font-size: 12.5px;
  line-height: 1.7;
  color: rgba(220, 170, 100, 0.65);
  margin: 0 0 18px;
  max-width: 420px;
}

.cluster-hero__stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.ch-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ch-stat__k {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.16em;
  color: rgba(180, 100, 30, 0.55);
}
.ch-stat__v {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: rgba(240, 190, 100, 0.80);
}
.ch-stat__v--free { color: rgba(80, 220, 120, 0.80); }

/* ══════════════════════════════════════════════════════════════
   ONBOARDING FIRST DEED HERO
   ══════════════════════════════════════════════════════════════ */

.onboard-hero {
  position: relative;
  background: linear-gradient(135deg, #010a08 0%, #021410 50%, #010c09 100%);
  border-bottom: 1px solid rgba(40, 200, 120, 0.18);
  overflow: hidden;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.onboard-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 600px;
  width: 100%;
  padding: 48px 40px;
  text-align: center;
}

.onboard-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 22px;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.16em;
}
.ob-step {
  padding: 3px 9px;
  border-radius: 3px;
  border: 1px solid transparent;
}
.ob-step--done {
  color: rgba(80, 180, 120, 0.55);
  border-color: rgba(40, 120, 80, 0.25);
  background: rgba(20, 60, 40, 0.30);
}
.ob-step--active {
  color: rgba(80, 230, 150, 0.95);
  border-color: rgba(60, 200, 120, 0.45);
  background: rgba(20, 80, 50, 0.45);
  box-shadow: 0 0 12px rgba(40, 200, 100, 0.20);
}
.ob-step-arrow {
  color: rgba(40, 100, 70, 0.45);
  font-size: 10px;
}

.onboard-hero__heading {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
  color: rgba(200, 240, 220, 0.92);
  margin: 0 0 14px;
  letter-spacing: 0.05em;
}
.onboard-hero__accent {
  color: rgba(60, 220, 150, 0.90);
  text-shadow: 0 0 24px rgba(40, 200, 120, 0.30);
}

.onboard-hero__desc {
  font-size: 13px;
  line-height: 1.7;
  color: rgba(160, 210, 185, 0.65);
  margin: 0 0 24px;
}

.onboard-chain-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  margin-bottom: 22px;
}
.onboard-chain-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 18px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
}
.onboard-chain-badge--celo {
  background: rgba(20, 80, 50, 0.45);
  border: 1px solid rgba(80, 200, 130, 0.35);
  color: rgba(100, 230, 160, 0.90);
  box-shadow: 0 0 20px rgba(40, 180, 100, 0.12);
}
.onboard-chain-badge--polygon {
  background: rgba(60, 20, 100, 0.45);
  border: 1px solid rgba(140, 80, 220, 0.35);
  color: rgba(180, 120, 255, 0.90);
  box-shadow: 0 0 20px rgba(120, 60, 200, 0.12);
}
.ocb-icon   { font-size: 14px; }
.ocb-name   { font-weight: bold; }
.ocb-status { font-size: 7px; opacity: 0.55; letter-spacing: 0.2em; }
.onboard-chain-hint {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: rgba(80, 160, 110, 0.50);
}

.onboard-hero__meta {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.12em;
}
.onboard-free     { color: rgba(80, 220, 140, 0.75); }
.onboard-protocol { color: rgba(60, 120, 90, 0.45); }

/* ══════════════════════════════════════════════════════════════
   CLUSTER WORLD HERO
   ══════════════════════════════════════════════════════════════ */

.cw-hero {
  position: relative;
  background: linear-gradient(160deg, #020814 0%, #040c1c 40%, #020a18 100%);
  border-bottom: 1px solid rgba(80, 160, 255, 0.14);
  overflow: hidden;
  padding: 40px 20px 32px;
}
.cw-hero__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.cw-hero__identity {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-bottom: 28px;
}
.cw-hero__tag {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.22em;
  color: rgba(80, 160, 255, 0.55);
  margin-bottom: 8px;
}
.cw-hero__system {
  font-size: 20px;
  font-weight: 600;
  color: rgba(200, 220, 255, 0.92);
  letter-spacing: 0.04em;
  font-family: 'Courier New', monospace;
}
.cw-hero__planet {
  font-size: 13px;
  color: rgba(120, 200, 255, 0.75);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.1em;
  margin-top: 4px;
}
.cw-hero__address {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.14em;
  color: rgba(80, 120, 180, 0.55);
  margin-top: 6px;
}
.cw-hero__free {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.16em;
  color: rgba(80, 220, 140, 0.65);
  margin-top: 8px;
}

.cw-pathways {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0 auto;
}
.cw-pathways__label {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.18em;
  color: rgba(100, 150, 200, 0.60);
  text-align: center;
  margin-bottom: 14px;
}
.cw-pathways__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
@media (max-width: 600px) {
  .cw-pathways__grid { grid-template-columns: repeat(2, 1fr); }
}
.cw-card {
  background: rgba(20, 40, 80, 0.55);
  border: 1px solid rgba(60, 100, 180, 0.25);
  border-radius: 8px;
  padding: 14px 12px;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cw-card:hover {
  background: rgba(30, 60, 120, 0.65);
  border-color: rgba(80, 140, 255, 0.45);
}
.cw-card--active {
  background: rgba(20, 60, 120, 0.75);
  border-color: rgba(100, 180, 255, 0.70);
  box-shadow: 0 0 12px rgba(60, 140, 255, 0.15);
}
.cw-card__icon {
  font-size: 22px;
  color: rgba(120, 190, 255, 0.80);
}
.cw-card--active .cw-card__icon { color: rgba(160, 220, 255, 1.0); }
.cw-card__title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(180, 210, 255, 0.90);
  letter-spacing: 0.03em;
}
.cw-card__desc {
  font-size: 9.5px;
  line-height: 1.5;
  color: rgba(100, 140, 200, 0.65);
}

.cw-form {
  position: relative;
  z-index: 1;
  max-width: 560px;
  margin: 0 auto;
  background: rgba(10, 20, 50, 0.60);
  border: 1px solid rgba(60, 100, 180, 0.25);
  border-radius: 10px;
  padding: 16px 18px;
}
.cw-form__label {
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  letter-spacing: 0.18em;
  color: rgba(80, 120, 180, 0.55);
  margin-bottom: 6px;
}
.cw-form__address-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: rgba(100, 160, 255, 0.70);
  word-break: break-all;
  margin-bottom: 4px;
}
.cw-form__address-text { flex: 1; }
.cw-form__input { width: 100%; }
.cw-form__pathway-note {
  font-size: 10px;
  color: rgba(120, 150, 200, 0.60);
  margin-top: 10px;
  line-height: 1.5;
}
.cw-form__note {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.06em;
  color: rgba(80, 120, 160, 0.45);
}

/* ── DRY RUN PREVIEW BANNER ───────────────────────────────────────────────── */

.preview-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 20px;
  background: rgba(0, 30, 20, 0.92);
  border-bottom: 1px solid rgba(0, 180, 120, 0.30);
  backdrop-filter: blur(8px);
  flex-wrap: wrap;
  font-family: 'Courier New', monospace;
}

.pb-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.pb-badge {
  font-size: 8.5px;
  letter-spacing: 0.18em;
  color: rgba(0, 230, 160, 0.90);
  background: rgba(0, 80, 50, 0.45);
  border: 1px solid rgba(0, 180, 120, 0.40);
  border-radius: 3px;
  padding: 2px 8px;
  white-space: nowrap;
}

.pb-label {
  font-size: 9px;
  letter-spacing: 0.10em;
  color: rgba(0, 200, 130, 0.60);
  white-space: nowrap;
}

.pb-addr {
  flex: 1;
  font-size: 9px;
  letter-spacing: 0.06em;
  color: rgba(0, 210, 255, 0.65);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pb-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.pb-btn {
  font-family: 'Courier New', monospace;
  font-size: 9.5px;
  letter-spacing: 0.10em;
  padding: 5px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.13s, border-color 0.13s;
}

.pb-btn--confirm {
  color: rgba(80, 230, 130, 0.92);
  background: rgba(0, 70, 40, 0.40);
  border: 1px solid rgba(60, 200, 110, 0.45);
}
.pb-btn--confirm:hover {
  background: rgba(0, 100, 55, 0.55);
  border-color: rgba(80, 230, 130, 0.65);
}

.pb-btn--back {
  color: rgba(80, 140, 180, 0.65);
  background: transparent;
  border: 1px solid rgba(60, 110, 150, 0.22);
}
.pb-btn--back:hover {
  background: rgba(0, 30, 60, 0.35);
  border-color: rgba(80, 150, 200, 0.40);
}

/* ── PREVIEW CONFIRM SECTION ──────────────────────────────────────────────── */

.preview-confirm {
  max-width: 680px;
  margin: 28px auto;
  padding: 24px 28px;
  background: rgba(0, 8, 20, 0.90);
  border: 1px solid rgba(0, 140, 200, 0.18);
  border-radius: 6px;
  font-family: 'Courier New', monospace;
}

.pc-section-label {
  font-size: 8px;
  letter-spacing: 0.20em;
  color: rgba(0, 180, 220, 0.50);
  margin-bottom: 10px;
}

.pc-addr-block {
  font-size: 12px;
  color: rgba(0, 225, 255, 0.88);
  letter-spacing: 0.06em;
  background: rgba(0, 40, 70, 0.35);
  border: 1px solid rgba(0, 160, 220, 0.28);
  border-radius: 4px;
  padding: 8px 14px;
  margin-bottom: 14px;
  word-break: break-all;
}

.pc-meta-grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: 4px;
}

.pc-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(0, 40, 70, 0.22);
  font-size: 9.5px;
}
.pc-meta-row span:first-child { color: rgba(70, 130, 170, 0.60); flex-shrink: 0; }
.pc-meta-row span:last-child  { color: rgba(180, 220, 240, 0.85); text-align: right; }

.pc-meta-val--preview {
  color: rgba(255, 190, 60, 0.75) !important;
  font-style: italic;
}

.pc-checklist {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 22px;
}

.pc-check-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 10px;
  color: rgba(160, 210, 235, 0.80);
}

.pc-check-icon {
  color: rgba(0, 210, 180, 0.70);
  font-size: 10px;
  flex-shrink: 0;
}
.pc-check-icon--dim { color: rgba(60, 110, 140, 0.50); }
.pc-check-dim       { color: rgba(80, 130, 160, 0.50); }

.pc-cta-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.pc-cta-btn {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 0.10em;
  padding: 9px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.14s, border-color 0.14s;
}

.pc-cta-btn--confirm {
  color: rgba(80, 230, 130, 0.92);
  background: rgba(0, 70, 40, 0.40);
  border: 1px solid rgba(60, 200, 110, 0.45);
}
.pc-cta-btn--confirm:hover {
  background: rgba(0, 100, 55, 0.55);
  border-color: rgba(80, 230, 130, 0.65);
}

.pc-cta-btn--back {
  color: rgba(80, 140, 180, 0.65);
  background: transparent;
  border: 1px solid rgba(60, 110, 150, 0.22);
}
.pc-cta-btn--back:hover {
  background: rgba(0, 30, 60, 0.30);
  border-color: rgba(80, 150, 200, 0.40);
}
</style>
