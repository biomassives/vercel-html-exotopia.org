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
        <button class="pb-btn pb-btn--confirm" :disabled="!mintConsentAccepted" @click="confirmFromPreview">
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

      <!-- Focus editor — shown once established (skipped confirmFromPreview's
           gate by claiming directly via PlanetClaimOverlay's "Establish
           Settlement" button). Also lets an existing settler change focus
           later, since it just calls updateSettlement each click. -->
      <div v-if="!isPreview" class="cw-pathways q-mt-md">
        <div class="cw-pathways__label">What will this settlement do?</div>
        <div class="cw-pathways__grid">
          <div v-for="p in FOCUS_OPTIONS" :key="p.id" class="cw-card"
            :class="{ 'cw-card--active': selectedFocus === p.id }"
            @click="selectedFocus = p.id; updateSettlement(surfaceKey(claimPlanet), { focus: p.id })">
            <q-icon :name="p.icon" class="cw-card__icon" />
            <div class="cw-card__title">{{ p.title }}</div>
            <div class="cw-card__desc">{{ p.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Publish a public settlement page — opt-in, separate from the
           private local claim above. Requires a real account since a guest
           needs an actual owner_id/RLS row to read, not just localStorage. -->
      <div v-if="!isPreview" class="publish-card q-mt-md">
        <div v-if="!member.isSignedIn" class="publish-card__signin">
          <div class="publish-card__label">PUBLISH A SETTLEMENT PAGE</div>
          <p class="publish-card__desc">Sign in to publish this settlement at its own public URL.</p>
          <MemberSignIn />
        </div>
        <div v-else-if="publishedProfile" class="publish-result">
          <q-icon name="check_circle" color="green-5" size="14px" class="q-mr-xs"/>
          Published —
          <router-link :to="`/settlement/${publishedProfile.public_slug}`" class="publish-result__link">
            exotopia.org/settlement/{{ publishedProfile.public_slug }}
          </router-link>
        </div>
        <div v-else>
          <div class="publish-card__label">PUBLISH A SETTLEMENT PAGE</div>
          <p class="publish-card__desc">
            Optional — makes this settlement visible to guests at its own URL, showing
            your chosen focus and any technologies from the library you want to feature.
            You can change any of this later.
          </p>
          <div class="publish-tech-grid">
            <label v-for="m in REMEDIATION_METHODS" :key="m.key" class="publish-tech-chip"
              :class="{ 'publish-tech-chip--active': selectedTechKeys.includes(m.key) }">
              <input v-model="selectedTechKeys" type="checkbox" :value="m.key" class="publish-tech-checkbox" />
              {{ m.name }}
            </label>
          </div>
          <q-btn unelevated color="cyan-8" icon="mdi-earth"
            :label="publishing ? 'Publishing…' : 'Publish settlement page'"
            :loading="publishing" :disable="!selectedFocus" @click="doPublishProfile" />
          <div v-if="publishError" class="publish-error">✗ {{ publishError }}</div>
        </div>
      </div>
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
          <span class="moon-hero__protocol">PON INK PROTOCOL</span>
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

      <!-- Focus cards -->
      <div class="cw-pathways">
        <div class="cw-pathways__label">What will this settlement do?</div>
        <div class="cw-pathways__grid">
          <div v-for="p in FOCUS_OPTIONS" :key="p.id" class="cw-card"
            :class="{ 'cw-card--active': selectedFocus === p.id }"
            @click="selectedFocus = p.id">
            <q-icon :name="p.icon" class="cw-card__icon" />
            <div class="cw-card__title">{{ p.title }}</div>
            <div class="cw-card__desc">{{ p.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Mini claim form (shown after a focus is chosen) -->
      <div v-if="selectedFocus" class="cw-form q-mt-md">
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
          Selected focus: <strong class="text-amber-5">{{ selectedFocusLabel }}</strong>
          — a self-declared badge shown on this settlement, here and on its public page if you publish it.
        </div>
        <label class="pc-check-row pc-check-row--consent q-mt-sm">
          <input type="checkbox" v-model="mintConsentAccepted" />
          <span class="pc-check-dim">
            This creates a free address record — no wallet, no blockchain transaction, no investment
            or expectation of profit.
          </span>
        </label>
        <div class="row q-gutter-sm q-mt-sm">
          <q-btn unelevated
            :disable="!mintConsentAccepted"
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
          Confirms coordinates and focus. Free — no wallet, no gas fee.
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
          Design your<br>
          <span class="hero-heading-accent">place in the cosmos</span>
        </h1>

        <p class="hero-desc">
          11 hand-crafted SVG collector's cards, or a generative piece you configure
          yourself from real astronomical and eco-ops data. Either way: you compose
          it, you hold the record. Exotopia provides the tools and the data — what
          you do with what you make, including whether and where you trade it,
          is yours to decide.
        </p>

        <!-- Collection note — thematic variety, not a graded/scarcity display.
             These are collectible art records, not an investment: no rarity
             tiers or counts are shown here, deliberately. -->
        <div class="hero-rarities">
          <span class="rarity-pill" style="border-color: rgba(150,170,200,0.35); color: rgba(200,215,235,0.85)">
            11 distinct hand-crafted designs — each a different astronomical subject
          </span>
        </div>

        <!-- Free badge — chain badges (ALGO/MATIC/SOL/TEZ/HBAR/CELO) removed:
             this page's own header comment confirms wallet/chain minting was
             already removed from the actual mint flow below ("no wallet, no
             chain, no gas fee" — see SETTLEMENT_ADDRESS_API.md). The badges
             were stale copy from before that change and were no longer true. -->
        <div class="hero-meta q-mt-md">
          <span class="free-badge">FREE · NO WALLET REQUIRED</span>
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
          <q-btn
            flat color="purple-4" icon="mdi-palette-outline"
            label="Design Your Own"
            @click="$router.push('/mint-style')"
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

      <div class="pc-section-label" style="margin-top:20px">WHAT WILL THIS SETTLEMENT DO?</div>
      <div class="cw-pathways">
        <div class="cw-pathways__grid">
          <div v-for="p in FOCUS_OPTIONS" :key="p.id" class="cw-card"
            :class="{ 'cw-card--active': selectedFocus === p.id }"
            @click="selectedFocus = p.id">
            <q-icon :name="p.icon" class="cw-card__icon" />
            <div class="cw-card__title">{{ p.title }}</div>
            <div class="cw-card__desc">{{ p.desc }}</div>
          </div>
        </div>
      </div>

      <label class="pc-check-row pc-check-row--consent q-mt-sm">
        <input type="checkbox" v-model="mintConsentAccepted" />
        <span class="pc-check-dim">
          This creates a free address record — no wallet, no blockchain transaction, no investment
          or expectation of profit. Exotopia doesn't guarantee exclusive claim to this address; see
          <router-link to="/docs#exolocation">how addressing works →</router-link>
        </span>
      </label>
      <div class="pc-cta-row q-mt-xs">
        <button class="pc-cta-btn pc-cta-btn--confirm" :disabled="!selectedFocus || !mintConsentAccepted" @click="confirmFromPreview">
          ⬡ Establish Settlement
        </button>
        <button class="pc-cta-btn pc-cta-btn--back" @click="router.back()">
          ← Back to plot selection
        </button>
      </div>
      <div class="pc-check-row q-mt-xs">
        <span class="pc-check-icon pc-check-icon--dim">◈</span>
        <span class="pc-check-dim">Free — no wallet, no gas fee. Change your focus anytime from your settlement page.</span>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════
         PATHWAY WIZARD — card gallery to configure the mint
         ════════════════════════════════════════════════════════════════════ -->
    <!-- ════════════════════════════════════════════════════════════════════
         SUPPORT THE NETWORK — pin to IPFS
         No wallet, no chain, no gas fee. Durability comes from content
         persistence (as long as someone keeps it pinned), not from
         exclusivity of on-chain ownership — see SETTLEMENT_ADDRESS_API.md.
         ════════════════════════════════════════════════════════════════════ -->
    <div v-if="(mintMode !== 'cluster-world' || showCwAdvanced) && !isPreview" ref="formsAnchor" class="mint-forms q-pa-md">

      <div class="row items-center q-mb-xs">
        <div class="text-h6 text-blue-grey-2" style="font-family:monospace; letter-spacing:0.08em">
          ◈ SUPPORT THIS SETTLEMENT
        </div>
        <q-space />
        <q-btn flat dense size="sm" color="amber-6" icon="mdi-tune-variant" label="Style Builder"
          @click="$router.push('/mint-style')"
          title="Configure generative minting styles combining network sources" />
      </div>

      <p class="text-caption text-blue-grey-5 q-mb-md" style="font-family:monospace; letter-spacing:0.03em; line-height:1.6">
        Pinning to IPFS keeps this settlement's content available — no wallet,
        no blockchain, no gas fee. There is no collision-proof claim registry
        here by design: durability comes from someone keeping it pinned, not
        from exclusive ownership. Pin it yourself, or use the service below.
      </p>

      <div class="pin-card q-pa-md">
        <q-input
          v-model="pinTitle"
          label="Settlement title"
          dark dense outlined class="q-mb-sm"
        />
        <q-input
          v-model="pinDescription"
          label="Description (optional)"
          type="textarea" rows="2"
          dark dense outlined class="q-mb-sm"
        />
        <div class="pin-address-row q-mb-sm">
          <span class="pin-address-label">Exolocation address</span>
          <span class="pin-address-value">{{ currentExolocAddress || '(not yet available)' }}</span>
        </div>

        <q-btn
          unelevated color="cyan-8"
          icon="mdi-cloud-upload-outline"
          :label="pinLoading ? 'Pinning…' : 'Pin to IPFS'"
          class="full-width"
          :loading="pinLoading"
          :disable="!currentExolocAddress || !pinTitle.trim()"
          @click="doPin"
        />

        <div v-if="!hasAnyPinningConfigured()" class="pin-hint q-mt-sm">
          No pinning service is configured in this deployment yet
          (VITE_PINATA_JWT). You can still copy the address above and pin it
          yourself with any IPFS pinning service.
        </div>

        <div v-if="pinError" class="pin-error q-mt-sm">✗ {{ pinError }}</div>

        <div v-if="pinCid" class="pin-result q-mt-sm">
          <q-icon name="check_circle" color="green-5" size="14px" class="q-mr-xs"/>
          Pinned — <span class="pin-cid">{{ pinCid }}</span>
          <a :href="`https://ipfs.io/ipfs/${pinCid.replace('ipfs://', '')}`" target="_blank" rel="noopener" class="pin-link">
            View on IPFS gateway →
          </a>
        </div>
      </div>

    </div><!-- /mint-forms -->

  </q-page>
</template>

<script setup lang="ts">
/**
 * MintPage.vue — settlement claim + IPFS support interface
 *
 * Previously a blockchain/NFT minting interface (wallet connect, per-chain
 * mint transactions). That's been removed — settlement creation was already
 * independent of minting (addSettlement() below never depended on a
 * successful mint), so this page now does exactly that plus an optional
 * "pin to IPFS" step (src/lib/ipfs-pinning.ts) in place of the old mint
 * forms. No wallet, no chain, no gas fee, and deliberately no collision-proof
 * claim registry — see SETTLEMENT_ADDRESS_API.md.
 *
 * The removed per-chain mint code (EVM/Solana/Algorand) was relocated, not
 * deleted — see /archive/chains for reuse in other projects.
 */

import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlanetClaimCard      from 'src/components/PlanetClaimCard.vue'
import CollectorCard         from 'src/components/CollectorCard.vue'
import {
  COLLECTOR_CARDS,
} from 'src/data/collector-cards'
import { useSettlements, surfaceKey, clusterKey } from 'src/lib/settlements'
import { consumeSuggestedFocus } from 'src/lib/settlement-focus-intent'
import { FOCUS_OPTIONS, focusLabel } from 'src/data/settlement-focus-options'
import { pinSettlement, hasAnyPinningConfigured, type SettlementPinMetadata } from 'src/lib/ipfs-pinning'

// ── Mint consent (RISK_REDUCTION_RECOMMENDATIONS.md §1) ──────────────────────
// Same pattern as PfasCitizenSciencePage.vue's logFieldWaiverAcceptance() — a
// per-action, timestamped, evidentiary record beats a buried ToS clause.
// Shared across both establish-settlement flows (confirmFromPreview,
// proceedCwMint) below; each one guards on it and logs on success.
const mintConsentAccepted = ref(false)

function logMintConsentAcceptance(context: string) {
  try {
    const key = 'exo.mint-consent-log'
    const log = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[]
    log.push({ context, acceptedAt: new Date().toISOString() })
    localStorage.setItem(key, JSON.stringify(log))
  } catch { /* private mode / quota */ }
}
import { useSettlementProfilesStore, type SettlementProfile } from 'src/stores/settlement-profiles'
import { useMemberStore } from 'src/stores/member'
import { REMEDIATION_METHODS } from 'src/data/pfas-methods-library'
import MemberSignIn from 'src/components/MemberSignIn.vue'

const { hasSettlement, addSettlement, getSettlement, updateSettlement } = useSettlements()
const settlementProfiles = useSettlementProfilesStore()
const member             = useMemberStore()

const selectedTechKeys  = ref<string[]>([])
const publishing        = ref(false)
const publishError      = ref<string | null>(null)
const publishedProfile  = ref<SettlementProfile | null>(null)

async function doPublishProfile() {
  if (!selectedFocus.value || !claimHost.value || !claimPlanet.value) return
  publishing.value   = true
  publishError.value = null
  const result = await settlementProfiles.createProfile({
    exolocation:    `exo-surface-v1:${claimHost.value}:${claimPlanet.value}`,
    displayName:    `${claimPlanet.value} · ${claimHost.value}`,
    focus:          selectedFocus.value,
    technologyKeys: selectedTechKeys.value,
  })
  publishing.value = false
  if (!result) {
    publishError.value = 'Could not publish — you may have reached the daily limit (3 per 24h), or a sign-in issue.'
    return
  }
  publishedProfile.value = result
}

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
  if (!selectedFocus.value) return
  if (!mintConsentAccepted.value) return
  logMintConsentAcceptance('surface-deed')
  addSettlement({
    key:         surfaceKey(claimPlanet.value),
    type:        'surface',
    planetName:  claimPlanet.value,
    hostname:    claimHost.value,
    exolocation: `exo-surface-v1:${claimHost.value}:${claimPlanet.value}`,
    displayName: `${claimPlanet.value} · ${claimHost.value}`,
    lat:         claimLat.value,
    lon:         claimLon.value,
    focus:       selectedFocus.value,
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

const mintMode = computed((): 'surface-deed' | 'moon-orbital' | 'cluster-world' | 'cluster-outpost' | 'general' => {
  if (hasClaimPlot.value) return 'surface-deed'
  const coord = (route.query.coord as string) ?? ''
  if (coord.includes('moon') && route.query.host && route.query.planet) return 'moon-orbital'
  if (route.query.mode === 'cluster-world') return 'cluster-world'
  if (route.query.mode === 'cluster-outpost') return 'cluster-outpost'
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

// ── Settlement focus — shown at both surface-deed and cluster-world claim
// time. Pre-selected from ?suggestedFocus=<id> when the user arrived via a
// subsystem page's own "Start a settlement" CTA (see e.g. PfasCitizenSciencePage,
// EcoLibrary, KnowledgeKeepersPage, RewardsPage), so the wordy generic form
// collapses to a one-click confirm instead of an open choice every time.
const selectedFocus = ref<string | null>(
  getSettlement(surfaceKey(claimPlanet.value || 'x'))?.focus
  || (route.query.suggestedFocus as string)
  || consumeSuggestedFocus()
  || null
)
const cwHandle       = ref('')
const showCwAdvanced = ref(false)

const selectedFocusLabel = computed(() => focusLabel(selectedFocus.value))

function proceedCwMint() {
  if (!mintConsentAccepted.value) return
  // Record settlement intent in browser storage
  const sKey = clusterKey(cwCluster.value, cwGalaxy.value, cwSystem.value, cwPlanet.value || 'b')
  if (!hasSettlement(sKey)) {
    logMintConsentAcceptance('cluster-world')
    addSettlement({
      key:         sKey,
      type:        'cluster',
      planetName:  cwPlanet.value || 'b',
      hostname:    cwSystem.value,
      exolocation: cwExolocation.value,
      displayName: `${cwSystem.value} · ${cwPlanet.value || 'b'} (${cwCluster.value})`,
      clusterSlug: cwCluster.value,
      memberId:    cwGalaxy.value,
      focus:       selectedFocus.value ?? undefined,
    })
  }
  // Reveal the IPFS-pin section and prefill it from the cluster-world context.
  pinTitle.value = cwHandle.value || cwExolocation.value
  showCwAdvanced.value = true
  void nextTick(() => scrollToForms())
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

// ── IPFS pinning (replaces the old wallet-connect / on-chain mint forms) ─────

onMounted(() => {
  // Arrived via a claim link (surface-deed / moon-orbital) — scroll straight
  // to the pin section once the settlement context is on screen.
  if (route.query.host && route.query.planet) {
    void nextTick(() => scrollToForms())
  }
})

/** Best-effort exoloc address for whatever mode the page is currently in. */
const currentExolocAddress = computed(() => {
  if (mintMode.value === 'cluster-world' || mintMode.value === 'cluster-outpost') {
    return cwExolocation.value
  }
  if (claimHost.value && claimPlanet.value) {
    return `exo-surface-v1:${claimHost.value}:${claimPlanet.value}`
  }
  const host   = (route.query.host as string)   ?? ''
  const planet = (route.query.planet as string) ?? ''
  const coord  = (route.query.coord as string)  ?? 'exo-surface-v1'
  return host && planet ? `${coord}:${host}:${planet}` : ''
})

const pinTitle       = ref('')
const pinDescription = ref('')
const pinLoading     = ref(false)
const pinCid         = ref<string | null>(null)
const pinError       = ref<string | null>(null)

async function doPin() {
  if (!currentExolocAddress.value || !pinTitle.value.trim()) return
  pinLoading.value = true
  pinError.value   = null
  pinCid.value      = null
  try {
    const metadata: SettlementPinMetadata = {
      title:              pinTitle.value.trim(),
      description:        pinDescription.value.trim() || undefined,
      exolocationAddress: currentExolocAddress.value,
      createdAt:          new Date().toISOString(),
    }
    pinCid.value = await pinSettlement(metadata)
  } catch (e) {
    pinError.value = e instanceof Error ? e.message : String(e)
  } finally {
    pinLoading.value = false
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

.pc-check-row--consent {
  align-items: flex-start;
  cursor: pointer;
  max-width: 480px;
}
.pc-check-row--consent input[type="checkbox"] {
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: rgba(0, 210, 180, 0.85);
}
.pc-check-row--consent .pc-check-dim { color: rgba(140, 190, 215, 0.75); line-height: 1.5; }
.pc-check-row--consent a { color: rgba(0, 200, 240, 0.80); }

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
.pc-cta-btn--confirm:disabled {
  color: rgba(120, 150, 140, 0.45);
  background: rgba(20, 30, 26, 0.30);
  border-color: rgba(60, 90, 80, 0.25);
  cursor: not-allowed;
}
.pc-cta-btn--confirm:disabled:hover {
  background: rgba(20, 30, 26, 0.30);
  border-color: rgba(60, 90, 80, 0.25);
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

/* ── Publish a settlement page ─────────────────────────────────────────── */

.publish-card {
  background: rgba(0, 12, 22, 0.55);
  border: 1px solid rgba(0, 160, 200, 0.18);
  border-radius: 8px;
  padding: 16px;
}
.publish-card__label {
  font-family: 'Courier New', monospace;
  font-size: 10px; letter-spacing: 0.12em;
  color: rgba(0, 200, 240, 0.65);
  margin-bottom: 6px;
}
.publish-card__desc {
  font-size: 12px; line-height: 1.6;
  color: rgba(140, 190, 220, 0.72);
  margin-bottom: 12px;
}
.publish-tech-grid {
  display: flex; flex-wrap: wrap; gap: 6px;
  margin-bottom: 14px;
}
.publish-tech-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0, 8, 22, 0.60);
  color: rgba(160, 200, 225, 0.75);
  cursor: pointer;
  transition: all 0.12s;
}
.publish-tech-chip:hover { background: rgba(0, 40, 80, 0.55); }
.publish-tech-chip--active {
  border-color: rgba(0, 200, 240, 0.55);
  color: rgba(200, 235, 255, 0.95);
  background: rgba(0, 60, 90, 0.45);
}
.publish-tech-checkbox { accent-color: #00c8f0; }

.publish-result {
  font-size: 12.5px;
  color: rgba(140, 190, 220, 0.80);
}
.publish-result__link {
  color: rgba(0, 220, 255, 0.85);
  font-family: 'Courier New', monospace;
  text-decoration: none;
}
.publish-result__link:hover { color: rgba(80, 235, 255, 0.95); }

.publish-error {
  margin-top: 10px;
  font-size: 11.5px;
  color: rgba(255, 110, 110, 0.85);
}

.publish-card__signin { max-width: 320px; }
</style>
