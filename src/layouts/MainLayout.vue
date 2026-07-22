<template>
  <q-layout view="lhh Lpr lFf">

    <!-- ── Shared Three.js canvas — persistent across all visualization pages ── -->
    <canvas ref="vizCanvas" class="viz-canvas-root" />

    <!-- ── WebGL unavailable fallback ────────────────────────────────────────── -->
    <div v-if="vizError" class="webgl-fallback column items-center justify-center">
      <q-icon name="mdi-video-3d-off" size="40px" color="blue-grey-5" />
      <div class="text-subtitle2 text-blue-grey-3 q-mt-md">3D visualization unavailable</div>
      <div class="text-caption text-blue-grey-5 q-mt-xs" style="max-width: 360px; text-align: center">
        This browser couldn't create a WebGL context — hardware acceleration may be
        disabled or unsupported. Enable GPU acceleration in your browser settings and reload
        to view the cosmic visualizations.
      </div>
    </div>

    <!-- ── Top navigation bar ────────────────────────────────────────────────── -->
    <div class="exo-bar"
         :class="{ 'exo-bar--open': !!openSection, 'exo-bar--settlement': isSettlementPage }"
         v-show="showFullExoBar">

      <!-- Left: logo + nav groups -->
      <div class="exo-bar__left">

        <div class="exo-logo" @click="navTo('/')">
          <div class="exo-orb">E</div>
          <span class="exo-wordmark">
            <span class="ew-exo">EXO</span><span class="ew-topia">TOPIA</span>
          </span>
        </div>

        <div class="bar-divider" />

        <nav class="bar-groups">
          <button
            v-for="g in NAV_GROUPS" :key="g.id"
            class="bar-group"
            :class="{ 'bar-group--active': openSection === g.id, 'bar-group--link': !!g.directLink }"
            @click="g.directLink ? navTo(g.directLink) : toggleSection(g.id)"
          >
            {{ g.label }}
            <q-icon
              v-if="!g.directLink"
              :name="openSection === g.id ? 'expand_less' : 'expand_more'"
              size="12px" class="bar-group__chevron"
            />
          </button>
        </nav>
      </div>

      <!-- Right: level label + search + wallet -->
      <div class="exo-bar__right">
        <span class="bar-level">{{ currentLevelLabel }}</span>

        <div class="bar-search-wrap">
          <q-input
            v-model="addressInput"
            dense dark borderless
            placeholder="planet/system"
            input-class="bar-search-input"
            @update:model-value="onAddressInput"
            @keyup.enter="navigateToFirst"
            @focus="searchFocused = true"
            @blur="onBlur"
          >
            <template #prepend>
              <q-icon name="search" size="13px" color="blue-grey-6" />
            </template>
          </q-input>
          <div v-if="searchResults.length && searchFocused" class="bar-results">
            <div
              v-for="r in searchResults" :key="r.route"
              class="bar-result" @mousedown.prevent="navTo(r.route)"
            >
              <q-icon :name="r.icon" :color="r.color" size="11px" />
              <span class="bar-result__label">{{ r.label }}</span>
              <span class="bar-result__meta">{{ r.meta }}</span>
            </div>
            <div v-if="noResults" class="bar-result bar-result--empty">No match found</div>
          </div>
        </div>

        <q-btn
          v-if="wallet.connected"
          flat dense rounded color="positive"
          icon="account_balance_wallet"
          :label="wallet.shortAddress || ''"
          size="xs"
          @click="navTo('/mint')"
        />
        <q-btn
          v-else
          flat dense rounded color="blue-grey-5"
          icon="account_balance_wallet"
          label=""
          size="xs"
          @click="connectDialog = true"
        />
        <span v-if="wallet.connected" class="bar-wallet-dot" />
        <button
          class="bar-mob-burger"
          @click="mobileMenuOpen = !mobileMenuOpen"
          :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
        >
          <span class="bar-mob-burger-icon">{{ mobileMenuOpen ? '✕' : '≡' }}</span>
        </button>
        <button v-if="isSettlementPage" class="settle-bar-x" @click="collapseToSlim" title="Hide navigation">✕</button>
      </div>
    </div>

    <!-- ── Settlement location strip (auto-hide breadcrumb) ─────────────────── -->
    <Transition name="settle-strip">
      <div v-if="isSettlementPage && barMode === 'slim'"
           class="settle-strip"
           @mouseenter="pauseAutoHide"
           @mouseleave="resumeAutoHide">
        <button class="settle-burger" @click="showFullBar" title="Open navigation">≡</button>
        <nav class="settle-crumbs">
          <template v-for="(node, idx) in settlementBreadcrumb" :key="idx">
            <span v-if="idx > 0" class="settle-sep">›</span>
            <button v-if="node.route" class="settle-crumb settle-crumb--link" @click="navTo(node.route)">{{ node.label }}</button>
            <span v-else class="settle-crumb settle-crumb--current">{{ node.label }}</span>
          </template>
        </nav>
        <button class="settle-close" @click="hideStripManually" title="Dismiss">✕</button>
      </div>
    </Transition>
    <!-- ── Collapsed icon bar — visible when bar is auto-hidden on any page ─── -->
    <!-- Full-width so hovering anywhere in the top zone restores the bar       -->
    <div v-if="barMode === 'icons'"
         class="exo-icons-bar"
         @mouseenter="onIconsBarHover">
      <button class="exo-icon-btn" @click="navTo('/')" title="Home">
        <q-icon name="home" size="15px" />
      </button>
      <button class="exo-icon-btn" @click="showFullBar" title="Search">
        <q-icon name="search" size="15px" />
      </button>
      <button class="exo-icon-btn" @click="showFullBar" title="Navigation">
        <span class="exo-icon-burger">≡</span>
      </button>
    </div>

    <!-- ── Record widget ────────────────────────────────────────────────────── -->
    <RecordWidget />

    <!-- ── Mega panel ──────────────────────────────────────────────────────── -->
    <Transition name="mega-slide">
      <div v-if="openSection" class="exo-mega">

        <!-- Shared animated landscape — always behind all panel content -->
        <div class="mega-landscape" aria-hidden="true">
          <svg viewBox="0 0 900 220" width="100%" height="100%"
               preserveAspectRatio="xMidYMid slice">
            <g v-html="LANDSCAPE_SVG" />
          </svg>
        </div>

        <!-- Three distinct mega panel layouts — one per nav group -->
        <template v-for="g in NAV_GROUPS" :key="g.id">

          <!-- ── EXPLORE: warm sky with comic scale-bubbles ── -->
          <div v-if="openSection === g.id && g.id === 'explore'"
               class="mega-explore-cin"
               @mouseleave="hoveredExplore = null">

            <!-- Settlement scene: charming starfield, two domes, four comic thought-bubbles -->
            <svg class="mecin-svg" viewBox="0 0 900 290"
                 preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs>
                <radialGradient id="mecSky" cx="70%" cy="20%" r="60%">
                  <stop offset="0%"   stop-color="rgba(35,55,120,0.32)"/>
                  <stop offset="100%" stop-color="rgba(0,2,14,0)"/>
                </radialGradient>
              </defs>

              <!-- Sky -->
              <rect width="900" height="290" fill="rgba(0,2,14,0.90)"/>
              <rect width="900" height="290" fill="url(#mecSky)"/>

              <!-- Stars — warm whites and amber, placed outside bubble areas -->
              <!-- Left of CW bubble (x<228) -->
              <circle cx="22"  cy="8"   r="0.8" fill="rgba(210,225,255,0.65)"/>
              <circle cx="58"  cy="14"  r="0.6" fill="rgba(255,242,210,0.58)"/>
              <circle cx="98"  cy="7"   r="0.9" fill="rgba(210,225,255,0.68)"/>
              <circle cx="142" cy="16"  r="0.6" fill="rgba(255,255,255,0.55)"/>
              <circle cx="188" cy="10"  r="0.7" fill="rgba(210,225,255,0.62)" class="mecin-twinkle"/>
              <circle cx="32"  cy="58"  r="0.6" fill="rgba(210,225,255,0.45)"/>
              <circle cx="78"  cy="74"  r="0.5" fill="rgba(255,242,210,0.42)"/>
              <circle cx="128" cy="56"  r="0.6" fill="rgba(210,225,255,0.45)"/>
              <circle cx="172" cy="72"  r="0.7" fill="rgba(255,255,255,0.48)" class="mecin-twinkle"/>
              <circle cx="208" cy="60"  r="0.5" fill="rgba(255,242,210,0.40)"/>
              <!-- CW–GV gap (x 346–388) -->
              <circle cx="352" cy="13"  r="0.7" fill="rgba(255,242,210,0.52)"/>
              <circle cx="370" cy="7"   r="0.6" fill="rgba(210,225,255,0.60)"/>
              <circle cx="358" cy="72"  r="0.5" fill="rgba(210,225,255,0.40)"/>
              <circle cx="374" cy="58"  r="0.6" fill="rgba(255,255,255,0.38)"/>
              <!-- GV–GC gap (x 506–550) -->
              <circle cx="514" cy="10"  r="0.8" fill="rgba(210,225,255,0.62)" class="mecin-twinkle"/>
              <circle cx="534" cy="18"  r="0.6" fill="rgba(255,255,255,0.55)"/>
              <circle cx="510" cy="68"  r="0.5" fill="rgba(255,242,210,0.40)"/>
              <circle cx="538" cy="58"  r="0.6" fill="rgba(210,225,255,0.42)"/>
              <!-- GC–PS gap (x 670–716) -->
              <circle cx="678" cy="14"  r="0.7" fill="rgba(255,242,210,0.55)"/>
              <circle cx="700" cy="7"   r="0.6" fill="rgba(210,225,255,0.60)"/>
              <circle cx="676" cy="70"  r="0.5" fill="rgba(210,225,255,0.42)"/>
              <circle cx="700" cy="58"  r="0.6" fill="rgba(255,255,255,0.40)"/>
              <!-- Right of PS bubble (x>832) -->
              <circle cx="840" cy="10"  r="0.8" fill="rgba(255,255,255,0.58)"/>
              <circle cx="866" cy="18"  r="0.6" fill="rgba(210,225,255,0.62)"/>
              <circle cx="838" cy="68"  r="0.5" fill="rgba(210,225,255,0.45)"/>
              <circle cx="864" cy="55"  r="0.6" fill="rgba(255,242,210,0.42)"/>
              <circle cx="886" cy="70"  r="0.6" fill="rgba(210,225,255,0.42)"/>
              <!-- Row 3 — below all bubbles (y 108–128), full width -->
              <circle cx="55"  cy="115" r="0.5" fill="rgba(210,225,255,0.35)"/>
              <circle cx="118" cy="108" r="0.5" fill="rgba(255,242,210,0.32)"/>
              <circle cx="178" cy="122" r="0.5" fill="rgba(210,225,255,0.35)"/>
              <circle cx="238" cy="110" r="0.5" fill="rgba(255,255,255,0.32)"/>
              <circle cx="298" cy="125" r="0.5" fill="rgba(210,225,255,0.32)"/>
              <circle cx="358" cy="112" r="0.5" fill="rgba(255,242,210,0.30)"/>
              <circle cx="418" cy="120" r="0.5" fill="rgba(210,225,255,0.35)"/>
              <circle cx="478" cy="110" r="0.5" fill="rgba(255,255,255,0.30)"/>
              <circle cx="538" cy="124" r="0.5" fill="rgba(210,225,255,0.32)"/>
              <circle cx="598" cy="112" r="0.5" fill="rgba(255,242,210,0.30)"/>
              <circle cx="658" cy="120" r="0.5" fill="rgba(210,225,255,0.32)"/>
              <circle cx="718" cy="110" r="0.5" fill="rgba(255,255,255,0.28)"/>
              <circle cx="778" cy="124" r="0.5" fill="rgba(210,225,255,0.32)"/>
              <circle cx="838" cy="112" r="0.5" fill="rgba(255,242,210,0.28)"/>
              <circle cx="878" cy="120" r="0.5" fill="rgba(210,225,255,0.30)"/>
              <!-- Row 4 — open sky above terrain (y 152–178) -->
              <circle cx="42"  cy="155" r="0.5" fill="rgba(210,225,255,0.28)"/>
              <circle cx="108" cy="168" r="0.5" fill="rgba(255,242,210,0.25)"/>
              <circle cx="175" cy="158" r="0.5" fill="rgba(210,225,255,0.28)"/>
              <circle cx="248" cy="172" r="0.5" fill="rgba(255,255,255,0.24)"/>
              <circle cx="348" cy="162" r="0.5" fill="rgba(210,225,255,0.28)"/>
              <circle cx="448" cy="175" r="0.5" fill="rgba(255,242,210,0.24)"/>
              <circle cx="548" cy="160" r="0.5" fill="rgba(210,225,255,0.26)"/>
              <circle cx="648" cy="172" r="0.5" fill="rgba(255,255,255,0.24)"/>
              <circle cx="748" cy="158" r="0.5" fill="rgba(210,225,255,0.26)"/>
              <circle cx="848" cy="168" r="0.5" fill="rgba(255,242,210,0.24)"/>

              <!-- Planet rising over far horizon — warm tan, drawn before terrain -->
              <circle cx="140" cy="250" r="62"  fill="rgba(190,162,118,0.10)"/>
              <circle cx="140" cy="250" r="46"  fill="rgba(196,172,130,0.30)" stroke="rgba(215,192,148,0.14)" stroke-width="0.7"/>
              <ellipse cx="128" cy="240" rx="12" ry="7"  fill="rgba(255,248,225,0.09)"/>
              <circle  cx="155" cy="258" r="5"   fill="rgba(160,138,100,0.16)"/>
              <circle cx="140" cy="250" r="54"  fill="rgba(200,175,130,0.04)"/>

              <!-- ① COSMIC WEB bubble — cx=287, cy=51 -->
              <g :style="{ opacity: hoveredExplore === null ? 0.68 : hoveredExplore === 'Cosmic Web' ? 1 : 0.22, transition: 'opacity 0.40s ease' }">
                <rect x="228" y="12" width="118" height="78" rx="9" fill="rgba(0,4,22,0.84)" stroke="rgba(80,200,255,0.52)" stroke-width="1.2"/>
                <polygon points="279,90 295,90 287,105" fill="rgba(0,4,22,0.84)" stroke="rgba(80,200,255,0.52)" stroke-width="1.2" stroke-linejoin="round"/>
                <!-- void web filaments & nodes -->
                <path d="M238,46 Q252,26 278,20 Q302,16 340,32" fill="none" stroke="rgba(80,200,255,0.18)" stroke-width="0.7"/>
                <path d="M238,46 Q248,58 266,66 Q290,70 322,58" fill="none" stroke="rgba(80,200,255,0.15)" stroke-width="0.7"/>
                <path d="M278,20 Q278,42 278,60 Q278,66 266,66"  fill="none" stroke="rgba(80,200,255,0.13)" stroke-width="0.6"/>
                <path d="M340,32 Q340,44 340,58 Q340,66 322,58"  fill="none" stroke="rgba(80,200,255,0.15)" stroke-width="0.6"/>
                <path d="M278,20 Q308,26 340,32"               fill="none" stroke="rgba(80,200,255,0.10)" stroke-width="0.5"/>
                <circle cx="238" cy="46" r="3"   fill="rgba(80,200,255,0.72)"/>
                <circle cx="278" cy="20" r="2.5" fill="rgba(80,200,255,0.62)"/>
                <circle cx="340" cy="32" r="2.5" fill="rgba(80,200,255,0.60)"/>
                <circle cx="322" cy="58" r="2"   fill="rgba(80,200,255,0.55)"/>
                <circle cx="266" cy="66" r="2"   fill="rgba(80,200,255,0.52)"/>
                <circle cx="238" cy="46" r="7"   fill="rgba(80,200,255,0.07)"/>
                <circle cx="278" cy="20" r="5"   fill="rgba(80,200,255,0.06)"/>
                <!-- thought-trail toward domes -->
                <circle cx="292" cy="116" r="2.2" fill="rgba(80,200,255,0.28)"/>
                <circle cx="300" cy="132" r="1.7" fill="rgba(80,200,255,0.22)"/>
                <circle cx="310" cy="150" r="1.3" fill="rgba(80,200,255,0.16)"/>
              </g>

              <!-- ② GALAXY VIEW bubble — cx=447, cy=57 -->
              <g :style="{ opacity: hoveredExplore === null ? 0.68 : hoveredExplore === 'Milky Way' ? 1 : 0.22, transition: 'opacity 0.40s ease' }">
                <rect x="388" y="18" width="118" height="78" rx="9" fill="rgba(0,4,22,0.84)" stroke="rgba(180,130,255,0.52)" stroke-width="1.2"/>
                <polygon points="441,96 453,96 447,111" fill="rgba(0,4,22,0.84)" stroke="rgba(180,130,255,0.52)" stroke-width="1.2" stroke-linejoin="round"/>
                <!-- spiral galaxy -->
                <ellipse cx="447" cy="57" rx="46" ry="24" fill="rgba(180,130,255,0.04)" transform="rotate(-18 447 57)"/>
                <ellipse cx="447" cy="57" rx="30" ry="16" fill="rgba(180,130,255,0.07)" transform="rotate(-18 447 57)"/>
                <path d="M447,57 Q462,44 476,36 Q484,31 486,36" fill="none" stroke="rgba(200,165,255,0.28)" stroke-width="1.1"/>
                <path d="M447,57 Q454,70 458,78 Q462,84 458,80" fill="none" stroke="rgba(200,165,255,0.22)" stroke-width="0.9"/>
                <path d="M447,57 Q432,44 418,36 Q410,31 408,36" fill="none" stroke="rgba(200,165,255,0.25)" stroke-width="1.0"/>
                <path d="M447,57 Q440,70 436,78 Q432,84 436,80" fill="none" stroke="rgba(200,165,255,0.20)" stroke-width="0.8"/>
                <ellipse cx="447" cy="57" rx="11" ry="6"  fill="rgba(230,200,255,0.30)" transform="rotate(-18 447 57)"/>
                <circle  cx="447" cy="57" r="4"           fill="rgba(255,245,255,0.52)"/>
                <circle cx="484" cy="36" r="0.8" fill="rgba(200,165,255,0.62)"/>
                <circle cx="458" cy="78" r="0.8" fill="rgba(200,165,255,0.58)"/>
                <!-- thought-trail -->
                <circle cx="445" cy="122" r="2.2" fill="rgba(180,130,255,0.28)"/>
                <circle cx="442" cy="140" r="1.7" fill="rgba(180,130,255,0.22)"/>
                <circle cx="440" cy="158" r="1.3" fill="rgba(180,130,255,0.16)"/>
              </g>

              <!-- ③ GALAXY CLUSTERS bubble — cx=610, cy=51 -->
              <g :style="{ opacity: hoveredExplore === null ? 0.68 : hoveredExplore === 'Galaxy Clusters' ? 1 : 0.22, transition: 'opacity 0.40s ease' }">
                <rect x="550" y="12" width="120" height="78" rx="9" fill="rgba(0,4,22,0.84)" stroke="rgba(255,180,60,0.52)" stroke-width="1.2"/>
                <polygon points="604,90 616,90 610,105" fill="rgba(0,4,22,0.84)" stroke="rgba(255,180,60,0.52)" stroke-width="1.2" stroke-linejoin="round"/>
                <!-- X-ray cluster field -->
                <ellipse cx="610" cy="50" rx="38" ry="24" fill="rgba(255,180,60,0.06)"/>
                <ellipse cx="610" cy="50" rx="22" ry="14" fill="rgba(255,180,60,0.09)"/>
                <circle cx="608" cy="47" r="2.5" fill="rgba(255,225,160,0.90)"/>
                <circle cx="616" cy="41" r="1.8" fill="rgba(255,210,130,0.85)"/>
                <circle cx="602" cy="43" r="1.5" fill="rgba(255,225,160,0.80)"/>
                <circle cx="620" cy="53" r="1.8" fill="rgba(255,200,100,0.82)"/>
                <circle cx="600" cy="55" r="1.5" fill="rgba(255,225,160,0.78)"/>
                <circle cx="612" cy="59" r="1.2" fill="rgba(255,210,130,0.75)"/>
                <circle cx="614" cy="35" r="1.0" fill="rgba(255,225,160,0.70)"/>
                <circle cx="596" cy="49" r="1.2" fill="rgba(255,200,100,0.72)"/>
                <circle cx="624" cy="46" r="1.0" fill="rgba(255,225,160,0.68)"/>
                <!-- satellite groups -->
                <circle cx="568" cy="32" r="1.5" fill="rgba(255,210,130,0.62)"/>
                <circle cx="572" cy="38" r="1.0" fill="rgba(255,225,160,0.55)"/>
                <circle cx="564" cy="37" r="0.8" fill="rgba(255,200,100,0.52)"/>
                <circle cx="650" cy="62" r="1.5" fill="rgba(255,210,130,0.60)"/>
                <circle cx="646" cy="68" r="1.0" fill="rgba(255,225,160,0.52)"/>
                <!-- thought-trail -->
                <circle cx="597" cy="116" r="2.2" fill="rgba(255,180,60,0.28)"/>
                <circle cx="583" cy="133" r="1.7" fill="rgba(255,180,60,0.22)"/>
                <circle cx="568" cy="152" r="1.3" fill="rgba(255,180,60,0.16)"/>
              </g>

              <!-- ④ PLANET SYSTEMS bubble — cx=774, cy=59 -->
              <g :style="{ opacity: hoveredExplore === null ? 0.68 : hoveredExplore === 'Planet Systems' ? 1 : 0.22, transition: 'opacity 0.40s ease' }">
                <rect x="716" y="20" width="116" height="78" rx="9" fill="rgba(0,4,22,0.84)" stroke="rgba(60,220,160,0.52)" stroke-width="1.2"/>
                <polygon points="768,98 780,98 774,113" fill="rgba(0,4,22,0.84)" stroke="rgba(60,220,160,0.52)" stroke-width="1.2" stroke-linejoin="round"/>
                <!-- star system: concentric orbit rings + habitable zone planet -->
                <ellipse cx="774" cy="59" rx="44" ry="22" fill="none" stroke="rgba(60,220,160,0.10)" stroke-width="0.7" transform="rotate(-20 774 59)"/>
                <ellipse cx="774" cy="59" rx="30" ry="15" fill="none" stroke="rgba(60,220,160,0.26)" stroke-width="0.9" stroke-dasharray="3,2" transform="rotate(-20 774 59)"/>
                <ellipse cx="774" cy="59" rx="30" ry="15" fill="rgba(60,220,160,0.04)" transform="rotate(-20 774 59)"/>
                <ellipse cx="774" cy="59" rx="16" ry="8"  fill="none" stroke="rgba(60,220,160,0.13)" stroke-width="0.7" transform="rotate(-20 774 59)"/>
                <circle cx="774" cy="59" r="6"   fill="rgba(255,240,160,0.48)"/>
                <circle cx="774" cy="59" r="3.5" fill="rgba(255,255,200,0.72)"/>
                <circle cx="774" cy="59" r="2"   fill="rgba(255,255,255,0.90)"/>
                <!-- planet on HZ ring, upper right -->
                <circle cx="800" cy="46" r="3"   fill="rgba(60,220,160,0.82)"/>
                <circle cx="800" cy="46" r="1.5" fill="rgba(160,255,210,0.52)"/>
                <!-- moon -->
                <circle cx="806" cy="42" r="1.4" fill="rgba(200,255,230,0.38)"/>
                <!-- thought-trail -->
                <circle cx="756" cy="124" r="2.2" fill="rgba(60,220,160,0.28)"/>
                <circle cx="728" cy="142" r="1.7" fill="rgba(60,220,160,0.22)"/>
                <circle cx="698" cy="162" r="1.3" fill="rgba(60,220,160,0.16)"/>
              </g>

              <!-- Terrain far — drawn after planet so terrain clips planet base -->
              <path d="M0,215 Q100,207 205,212 Q320,218 440,206 Q545,197 648,209 Q748,218 900,207 L900,290 L0,290 Z"
                    fill="rgba(22,50,34,0.55)"/>
              <!-- Terrain near -->
              <path d="M0,232 Q112,226 232,230 Q358,234 480,225 Q585,218 705,227 Q822,232 900,225 L900,290 L0,290 Z"
                    fill="rgba(14,38,22,0.75)"/>

              <!-- Main settlement dome -->
              <ellipse cx="370" cy="214" rx="58"  ry="7.5" fill="rgba(50,110,180,0.18)"/>
              <path d="M316,214 Q338,182 370,177 Q402,182 424,214 Z"
                    fill="rgba(38,85,158,0.50)" stroke="rgba(80,170,230,0.48)" stroke-width="1.0"/>
              <ellipse cx="370" cy="198" rx="26" ry="6"    fill="rgba(80,190,255,0.07)"/>
              <rect x="361" y="202" width="2"   height="12" fill="rgba(16,36,68,0.85)"/>
              <rect x="366" y="197" width="2"   height="17" fill="rgba(16,36,68,0.85)"/>
              <rect x="371" y="202" width="2"   height="12" fill="rgba(16,36,68,0.80)"/>
              <rect x="376" y="197" width="2"   height="17" fill="rgba(16,36,68,0.85)"/>
              <rect x="381" y="202" width="2"   height="12" fill="rgba(16,36,68,0.80)"/>
              <ellipse cx="370" cy="215" rx="17" ry="2.5"  fill="rgba(120,200,255,0.12)"/>

              <!-- Secondary dome -->
              <path d="M517,210 Q538,188 560,183 Q582,188 603,210 Z"
                    fill="rgba(38,85,158,0.34)" stroke="rgba(80,170,230,0.28)" stroke-width="0.7"/>
              <ellipse cx="560" cy="211" rx="43" ry="6"    fill="rgba(50,110,180,0.10)"/>
              <rect x="553" y="198" width="1.8" height="10" fill="rgba(16,36,68,0.72)"/>
              <rect x="557" y="193" width="1.8" height="15" fill="rgba(16,36,68,0.74)"/>
              <rect x="561" y="198" width="1.8" height="10" fill="rgba(16,36,68,0.70)"/>
              <rect x="565" y="193" width="1.8" height="15" fill="rgba(16,36,68,0.74)"/>
              <ellipse cx="560" cy="211" rx="11" ry="2"    fill="rgba(120,200,255,0.09)"/>

              <!-- Scale label (hover) -->
              <text
                :opacity="hoveredExplore ? 0.55 : 0"
                x="888" y="282" text-anchor="end"
                font-size="6.5" fill="rgba(0,180,255,0.8)"
                font-family="Courier New" letter-spacing="0.12em"
                style="transition: opacity 0.32s ease"
              >{{ EXPLORE_SCOPE[hoveredExplore ?? ''] ?? '' }}</text>
            </svg>

            <!-- Floating glass nav overlay -->
            <nav class="mecin-nav">
              <div class="mecin-nav-eyebrow">EXPLORE</div>
              <button
                v-for="card in g.cards"
                :key="card.title"
                class="mecin-item"
                :class="{ 'mecin-item--active': hoveredExplore === card.title }"
                :style="{ '--ac': card.color }"
                @mouseenter="hoveredExplore = card.title"
                @click="navTo(card.route)"
              >
                <div class="mecin-item-body">
                  <span class="mecin-item-title">{{ card.title }}</span>
                  <span class="mecin-item-desc">{{ card.desc }}</span>
                </div>
                <span class="mecin-item-arrow">›</span>
              </button>
            </nav>

          </div>

          <!-- ── PARTICIPATE: sidebar + scene-modification right panel ──────── -->
          <div v-else-if="openSection === g.id && g.id === 'participate'"
               class="mega-twotrack" @mouseleave="hoveredItem = null">

            <nav class="mega-sidebar">
              <button
                v-for="card in g.cards"
                :key="card.title"
                class="msi-item"
                :class="{ 'msi-item--active': hoveredItem === card.title }"
                :style="{ '--ac': card.color }"
                @mouseenter="hoveredItem = card.title"
                @click="navTo(card.route)"
              >
                <span class="msi-label">{{ card.title }}</span>
                <span class="msi-chevron">›</span>
              </button>
            </nav>

            <!-- Settlement exterior scene — hover items modify scene layers -->
            <div class="mega-panel-area psp-panel">
              <svg class="psp-svg" viewBox="0 0 700 230"
                   preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <defs>
                  <radialGradient id="pspSky" cx="72%" cy="22%" r="58%">
                    <stop offset="0%"   stop-color="rgba(35,55,120,0.32)"/>
                    <stop offset="100%" stop-color="rgba(0,2,14,0)"/>
                  </radialGradient>
                </defs>

                <!-- Sky -->
                <rect width="700" height="230" fill="rgba(0,2,14,0.90)"/>
                <rect width="700" height="230" fill="url(#pspSky)"/>

                <!-- Stars — warm whites and cool blues, charming scatter -->
                <circle cx="18"  cy="10" r="0.8" fill="rgba(210,225,255,0.65)"/>
                <circle cx="58"  cy="28" r="0.6" fill="rgba(255,242,210,0.58)"/>
                <circle cx="105" cy="14" r="0.9" fill="rgba(210,225,255,0.68)"/>
                <circle cx="152" cy="6"  r="0.6" fill="rgba(255,255,255,0.55)"/>
                <circle cx="198" cy="34" r="0.7" fill="rgba(210,225,255,0.62)" class="mecin-twinkle"/>
                <circle cx="242" cy="12" r="0.5" fill="rgba(255,242,210,0.52)"/>
                <circle cx="288" cy="38" r="0.7" fill="rgba(210,225,255,0.60)"/>
                <circle cx="332" cy="16" r="0.6" fill="rgba(255,255,255,0.55)"/>
                <circle cx="378" cy="30" r="0.8" fill="rgba(210,225,255,0.65)" class="mecin-twinkle"/>
                <circle cx="422" cy="10" r="0.6" fill="rgba(255,242,210,0.55)"/>
                <circle cx="466" cy="36" r="0.7" fill="rgba(210,225,255,0.62)"/>
                <circle cx="510" cy="18" r="0.5" fill="rgba(255,255,255,0.52)"/>
                <circle cx="558" cy="28" r="0.8" fill="rgba(210,225,255,0.65)"/>
                <circle cx="602" cy="12" r="0.6" fill="rgba(255,242,210,0.58)"/>
                <circle cx="648" cy="32" r="0.7" fill="rgba(210,225,255,0.62)" class="mecin-twinkle"/>
                <circle cx="688" cy="16" r="0.6" fill="rgba(255,255,255,0.55)"/>
                <!-- Second row, slightly dimmer -->
                <circle cx="38"  cy="62" r="0.6" fill="rgba(210,225,255,0.45)"/>
                <circle cx="82"  cy="78" r="0.5" fill="rgba(255,242,210,0.42)"/>
                <circle cx="128" cy="55" r="0.6" fill="rgba(210,225,255,0.45)"/>
                <circle cx="172" cy="72" r="0.7" fill="rgba(255,255,255,0.48)" class="mecin-twinkle"/>
                <circle cx="218" cy="58" r="0.5" fill="rgba(255,242,210,0.40)"/>
                <circle cx="262" cy="80" r="0.6" fill="rgba(210,225,255,0.45)"/>
                <circle cx="308" cy="62" r="0.5" fill="rgba(255,255,255,0.42)"/>
                <circle cx="352" cy="75" r="0.6" fill="rgba(210,225,255,0.45)"/>
                <circle cx="398" cy="58" r="0.7" fill="rgba(255,242,210,0.48)"/>
                <circle cx="442" cy="80" r="0.5" fill="rgba(210,225,255,0.42)"/>
                <circle cx="488" cy="65" r="0.6" fill="rgba(255,255,255,0.45)"/>
                <circle cx="532" cy="78" r="0.5" fill="rgba(210,225,255,0.42)"/>
                <circle cx="578" cy="60" r="0.6" fill="rgba(255,242,210,0.45)"/>
                <circle cx="622" cy="75" r="0.7" fill="rgba(210,225,255,0.48)"/>
                <circle cx="668" cy="65" r="0.5" fill="rgba(255,255,255,0.42)"/>
                <!-- Third row — very dim, near horizon -->
                <circle cx="55"  cy="118" r="0.5" fill="rgba(210,225,255,0.35)"/>
                <circle cx="118" cy="105" r="0.5" fill="rgba(255,242,210,0.32)"/>
                <circle cx="178" cy="120" r="0.5" fill="rgba(210,225,255,0.35)"/>
                <circle cx="238" cy="108" r="0.5" fill="rgba(255,255,255,0.32)"/>
                <circle cx="298" cy="122" r="0.5" fill="rgba(210,225,255,0.35)"/>
                <circle cx="358" cy="112" r="0.5" fill="rgba(255,242,210,0.32)"/>
                <circle cx="418" cy="118" r="0.5" fill="rgba(210,225,255,0.35)"/>
                <circle cx="478" cy="108" r="0.5" fill="rgba(255,255,255,0.32)"/>
                <circle cx="538" cy="122" r="0.5" fill="rgba(210,225,255,0.32)"/>
                <circle cx="598" cy="110" r="0.5" fill="rgba(255,242,210,0.30)"/>
                <circle cx="658" cy="120" r="0.5" fill="rgba(210,225,255,0.32)"/>

                <!-- Moon / planet — upper right, warm tan like the original -->
                <circle cx="578" cy="68"  r="62"  fill="rgba(190,162,118,0.10)"/>
                <circle cx="578" cy="68"  r="44"  fill="rgba(196,172,130,0.32)" stroke="rgba(215,192,148,0.16)" stroke-width="0.7"/>
                <ellipse cx="568" cy="60" rx="11"  ry="7"  fill="rgba(255,248,225,0.10)"/>
                <circle  cx="590" cy="76" r="5"   fill="rgba(160,138,100,0.18)"/>
                <circle  cx="562" cy="52" r="3"   fill="rgba(180,158,118,0.14)"/>
                <!-- Outer atmosphere halo -->
                <circle cx="578" cy="68" r="52" fill="rgba(200,175,130,0.05)"/>

                <!-- Horizon atmosphere -->
                <ellipse cx="350" cy="160" rx="360" ry="32" fill="rgba(55,145,85,0.04)"/>
                <path d="M0,152 Q175,144 350,148 Q490,152 700,142"
                      fill="none" stroke="rgba(60,190,120,0.07)" stroke-width="1.5"/>

                <!-- Terrain far -->
                <path d="M0,155 Q90,147 188,152 Q282,158 372,146 Q462,135 562,148 Q618,154 700,146 L700,230 L0,230 Z"
                      fill="rgba(22,50,34,0.55)"/>
                <!-- Terrain near -->
                <path d="M0,172 Q110,167 222,170 Q334,173 446,166 Q528,160 700,167 L700,230 L0,230 Z"
                      fill="rgba(14,38,22,0.75)"/>

                <!-- Main settlement dome — small, on horizon, panned out -->
                <ellipse cx="210" cy="168" rx="54"  ry="7"   fill="rgba(50,110,180,0.18)"/>
                <path d="M156,168 Q178,136 210,131 Q242,136 264,168 Z"
                      fill="rgba(38,85,158,0.50)" stroke="rgba(80,170,230,0.48)" stroke-width="1.0"/>
                <!-- Interior glass glow -->
                <ellipse cx="210" cy="153" rx="26" ry="6"    fill="rgba(80,190,255,0.08)"/>
                <!-- Dome slit bars -->
                <rect x="200" y="149" width="2"   height="12" fill="rgba(16,36,68,0.85)"/>
                <rect x="205" y="144" width="2"   height="18" fill="rgba(16,36,68,0.85)"/>
                <rect x="210" y="149" width="2"   height="12" fill="rgba(16,36,68,0.80)"/>
                <rect x="215" y="144" width="2"   height="18" fill="rgba(16,36,68,0.85)"/>
                <rect x="220" y="149" width="2"   height="12" fill="rgba(16,36,68,0.80)"/>
                <!-- Glow pool -->
                <ellipse cx="210" cy="169" rx="16" ry="2.5"  fill="rgba(120,200,255,0.12)"/>

                <!-- Secondary dome — behind and right, smaller -->
                <path d="M335,163 Q356,143 378,140 Q400,143 421,163 Z"
                      fill="rgba(38,85,158,0.34)" stroke="rgba(80,170,230,0.28)" stroke-width="0.7"/>
                <ellipse cx="378" cy="164" rx="43"  ry="6"   fill="rgba(50,110,180,0.10)"/>
                <rect x="370" y="152" width="1.8"  height="10" fill="rgba(16,36,68,0.72)"/>
                <rect x="375" y="147" width="1.8"  height="15" fill="rgba(16,36,68,0.74)"/>
                <rect x="380" y="152" width="1.8"  height="10" fill="rgba(16,36,68,0.70)"/>
                <rect x="385" y="147" width="1.8"  height="15" fill="rgba(16,36,68,0.74)"/>
                <!-- Glow pool -->
                <ellipse cx="378" cy="164" rx="11"  ry="2"   fill="rgba(120,200,255,0.09)"/>

                <!-- ── HOVER HINTS — minimal glows, no text ── -->

                <!-- "Start a Settlement": gentle green land-claim beacon on terrain -->
                <g :style="{ opacity: hoveredItem === 'Start a Settlement' ? 0.80 : 0, transition: 'opacity 0.45s ease' }">
                  <ellipse cx="498" cy="163" rx="36" ry="5" fill="rgba(60,200,108,0.08)" stroke="rgba(60,200,108,0.55)" stroke-width="0.9" stroke-dasharray="3,2.5"/>
                  <circle  cx="462" cy="163" r="2"          fill="rgba(60,200,108,0.80)"/>
                  <circle  cx="534" cy="163" r="2"          fill="rgba(60,200,108,0.80)"/>
                  <ellipse cx="498" cy="164" rx="22" ry="3" fill="rgba(48,180,95,0.10)"/>
                </g>

                <!-- "Design Gallery": soft purple corona above main dome -->
                <g :style="{ opacity: hoveredItem === 'Design Gallery' ? 0.72 : 0, transition: 'opacity 0.45s ease' }">
                  <ellipse cx="210" cy="124" rx="28" ry="10" fill="rgba(155,68,255,0.10)" stroke="rgba(155,68,255,0.40)" stroke-width="0.8"/>
                  <circle  cx="210" cy="124" r="4"           fill="rgba(175,90,255,0.45)"/>
                  <ellipse cx="210" cy="130" rx="12" ry="3"  fill="rgba(155,68,255,0.14)"/>
                </g>

                <!-- "Sustainable Design": three eco pips on terrain -->
                <g :style="{ opacity: hoveredItem === 'Sustainable Design' ? 0.78 : 0, transition: 'opacity 0.45s ease' }">
                  <circle cx="280" cy="162" r="2.5" fill="rgba(60,200,108,0.80)"/>
                  <circle cx="296" cy="165" r="2"   fill="rgba(60,200,108,0.65)"/>
                  <circle cx="265" cy="165" r="2"   fill="rgba(60,200,108,0.65)"/>
                  <ellipse cx="280" cy="166" rx="18" ry="3" fill="rgba(48,180,95,0.10)"/>
                </g>

                <!-- "Knowledge Quizzes": soft amber ring above secondary dome -->
                <g :style="{ opacity: hoveredItem === 'Knowledge Quizzes' ? 0.72 : 0, transition: 'opacity 0.45s ease' }">
                  <circle cx="378" cy="132" r="14" fill="none" stroke="rgba(220,175,30,0.42)" stroke-width="0.9"/>
                  <circle cx="378" cy="132" r="8"  fill="none" stroke="rgba(220,175,30,0.28)" stroke-width="0.7"/>
                  <circle cx="378" cy="132" r="3"  fill="rgba(255,210,60,0.65)"/>
                </g>

                <!-- "Aftermarket": warm amber glow on secondary dome -->
                <g :style="{ opacity: hoveredItem === 'Aftermarket' ? 0.72 : 0, transition: 'opacity 0.45s ease' }">
                  <ellipse cx="378" cy="152" rx="16" ry="6"  fill="rgba(255,145,30,0.12)" stroke="rgba(255,145,30,0.45)" stroke-width="0.8"/>
                  <circle  cx="378" cy="152" r="3"           fill="rgba(255,145,30,0.75)"/>
                  <ellipse cx="378" cy="156" rx="8"  ry="2"  fill="rgba(255,145,30,0.12)"/>
                </g>

                <!-- "Benefit Earth": warm glow on horizon, left side -->
                <g :style="{ opacity: hoveredItem === 'Benefit Earth' ? 0.65 : 0, transition: 'opacity 0.52s ease' }">
                  <ellipse cx="88" cy="155" rx="55" ry="12" fill="rgba(70,160,255,0.08)"/>
                  <ellipse cx="88" cy="158" rx="30" ry="6"  fill="rgba(70,160,255,0.12)"/>
                  <circle  cx="88" cy="155" r="5"           fill="rgba(90,180,255,0.50)"/>
                </g>
              </svg>

              <!-- Hover caption + CTA overlay -->
              <Transition name="panel-swap" mode="out-in">
                <div v-if="hoveredItem && PARTICIPATE_PANEL[hoveredItem]" :key="hoveredItem" class="map-art-overlay">
                  <span class="map-art-caption">{{ PARTICIPATE_PANEL[hoveredItem]?.caption }}</span>
                  <div class="map-art-action-zone">
                    <span v-if="sessionValue(PARTICIPATE_PANEL[hoveredItem]?.sessionKey)" class="map-art-session">
                      {{ sessionValue(PARTICIPATE_PANEL[hoveredItem]?.sessionKey) }}
                    </span>
                    <button class="map-art-cta"
                            @click.stop="navTo(PARTICIPATE_PANEL[hoveredItem]?.route ?? '/')">
                      {{ PARTICIPATE_PANEL[hoveredItem]?.cta }}
                    </button>
                  </div>
                </div>
                <div v-else key="__default" class="map-banner map-banner--open">
                  <span class="map-banner-label">{{ GROUP_BANNERS['participate'].label }}</span>
                  <span class="map-banner-hint">← hover an item</span>
                </div>
              </Transition>
            </div>
          </div>

          <!-- ── DOCS: sidebar + right contextual panel ────────────────────── -->
          <div v-else-if="openSection === g.id && g.id === 'docs'"
               class="mega-twotrack" @mouseleave="hoveredItem = null">

            <nav class="mega-sidebar">
              <button
                v-for="card in g.cards"
                :key="card.title"
                class="msi-item"
                :class="{ 'msi-item--active': hoveredItem === card.title }"
                :style="{ '--ac': card.color }"
                @mouseenter="hoveredItem = card.title"
                @click="navTo(card.route)"
              >
                <span class="msi-label">{{ card.title }}</span>
                <span class="msi-chevron">›</span>
              </button>
            </nav>

            <div class="mega-panel-area">
              <Transition name="panel-swap" mode="out-in">

                <div v-if="!hoveredItem" key="__banner" class="map-banner map-banner--open">
                  <span class="map-banner-label">{{ GROUP_BANNERS['docs'].label }}</span>
                  <span class="map-banner-hint">← hover an item</span>
                </div>

                <div v-else :key="hoveredItem" class="map-content"
                     :class="`map-content--${ITEM_PANELS[hoveredItem]?.style ?? 'docs'}`">
                  <div class="map-head">
                    <div class="map-headline">{{ ITEM_PANELS[hoveredItem]?.headline }}</div>
                    <div v-if="ITEM_PANELS[hoveredItem]?.subline" class="map-subline">
                      {{ ITEM_PANELS[hoveredItem]?.subline }}
                    </div>
                  </div>
                  <div
                    v-if="ITEM_PANELS[hoveredItem]?.sessionKey && sessionValue(ITEM_PANELS[hoveredItem]!.sessionKey)"
                    class="map-session"
                  >
                    <span class="map-session-label">{{ ITEM_PANELS[hoveredItem]?.sessionLabel }}</span>
                    <span class="map-session-value">{{ sessionValue(ITEM_PANELS[hoveredItem]!.sessionKey) }}</span>
                  </div>
                  <div v-if="ITEM_PANELS[hoveredItem]?.field" class="map-field-wrap">
                    <input
                      v-model="fieldValues[ITEM_PANELS[hoveredItem]!.field!.key]"
                      class="map-field"
                      :placeholder="ITEM_PANELS[hoveredItem]!.field!.placeholder"
                      @keyup.enter="panelNavigate(ITEM_PANELS[hoveredItem]!.actions[0]!, hoveredItem)"
                    />
                  </div>
                  <div class="map-actions">
                    <button
                      v-for="action in ITEM_PANELS[hoveredItem]?.actions"
                      :key="action.label"
                      class="map-action"
                      :class="{ 'map-action--primary': action.primary }"
                      @click.stop="panelNavigate(action, hoveredItem)"
                    >{{ action.label }}</button>
                  </div>
                </div>

              </Transition>
            </div>
          </div>

        </template>

      </div>
    </Transition>

    <!-- Backdrop -->
    <div v-if="openSection" class="exo-backdrop" @click="openSection = null" />

    <!-- ── Mobile navigation overlay ────────────────────────────────────── -->
    <Transition name="mob-menu">
      <div v-if="mobileMenuOpen" class="exo-mob-menu" @click.self="mobileMenuOpen = false">
        <div class="mob-menu-inner">
          <div class="mob-menu-header">
            <span class="mob-menu-title">Navigation</span>
            <button class="mob-menu-close" @click="mobileMenuOpen = false" aria-label="Close">✕</button>
          </div>
          <nav class="mob-nav-list">
            <button class="mob-nav-item" @click="navTo('/')">
              <span class="mob-nav-icon">🌌</span>
              <span class="mob-nav-text">
                <span class="mob-nav-label">Explore</span>
                <span class="mob-nav-sub">Cosmic Web · Galaxy · Surface</span>
              </span>
            </button>
            <button class="mob-nav-item" @click="navTo('/onboard')">
              <span class="mob-nav-icon">🌱</span>
              <span class="mob-nav-text">
                <span class="mob-nav-label">Get Started</span>
                <span class="mob-nav-sub">Join · Role · Community</span>
              </span>
            </button>
            <button class="mob-nav-item" @click="navTo('/eco-ops')">
              <span class="mob-nav-icon">💧</span>
              <span class="mob-nav-text">
                <span class="mob-nav-label">Eco Ops</span>
                <span class="mob-nav-sub">Monitor · Field work · Bounties</span>
              </span>
            </button>
            <button class="mob-nav-item" @click="navTo('/mint')">
              <span class="mob-nav-icon">🪐</span>
              <span class="mob-nav-text">
                <span class="mob-nav-label">Mint a Planet</span>
                <span class="mob-nav-sub">Reserve your settlement</span>
              </span>
            </button>
            <button class="mob-nav-item" @click="navTo('/learn')">
              <span class="mob-nav-icon">📚</span>
              <span class="mob-nav-text">
                <span class="mob-nav-label">Learn</span>
                <span class="mob-nav-sub">Curriculum · Modules</span>
              </span>
            </button>
            <button class="mob-nav-item" @click="navTo('/rewards')">
              <span class="mob-nav-icon">🏅</span>
              <span class="mob-nav-text">
                <span class="mob-nav-label">Rewards</span>
                <span class="mob-nav-sub">Points · Certificates</span>
              </span>
            </button>
            <button class="mob-nav-item" @click="navTo('/pfas-citizen-science')">
              <span class="mob-nav-icon">🧪</span>
              <span class="mob-nav-text">
                <span class="mob-nav-label">PFAS Cleanup</span>
                <span class="mob-nav-sub">Citizen science · Method proposals</span>
              </span>
            </button>
            <button class="mob-nav-item" @click="navTo('/blog')">
              <span class="mob-nav-icon">📄</span>
              <span class="mob-nav-text">
                <span class="mob-nav-label">Blog</span>
                <span class="mob-nav-sub">Articles · Updates</span>
              </span>
            </button>
            <button class="mob-nav-item" @click="navTo('/docs')">
              <span class="mob-nav-icon">📋</span>
              <span class="mob-nav-text">
                <span class="mob-nav-label">Docs</span>
                <span class="mob-nav-sub">Protocol · Guides</span>
              </span>
            </button>
          </nav>
          <div class="mob-menu-footer">
            <q-btn
              v-if="wallet.connected"
              flat rounded color="positive"
              icon="account_balance_wallet"
              :label="wallet.shortAddress || ''"
              class="full-width"
              @click="navTo('/mint')"
            />
            <q-btn
              v-else
              flat rounded color="blue-grey-5"
              icon="account_balance_wallet"
              label="Connect wallet"
              class="full-width"
              @click="connectDialog = true; mobileMenuOpen = false"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Page area ─────────────────────────────────────────────────────── -->
    <q-page-container class="exo-page-container">
      <router-view />
    </q-page-container>

    <!-- ── Wormhole portal overlay ───────────────────────────────────────── -->
    <WormholePortal />

    <!-- ── Scene-to-scene transition overlay ─────────────────────────────── -->
    <SceneTransition />

    <!-- ── PWA: offline status bar + install prompt ───────────────────────── -->
    <OfflineStatusBar />
    <InstallPrompt />
    <LocalDataPanel />

    <!-- ── First-visit demo/legal consent gate ─────────────────────────────── -->
    <DemoConsentOverlay />

    <!-- ── Connect wallet dialog ─────────────────────────────────────────── -->
    <q-dialog v-model="connectDialog">
      <q-card class="glass-card" style="min-width:300px">
        <q-card-section>
          <div class="text-h6 text-blue-grey-2">Connect Via Chain</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-btn outline color="cyan" label="Phantom (Solana / EVM)"
            icon="mdi-currency-eth" class="full-width"
            @click="connectDialog = false" />
          <q-btn outline color="blue-4" label="Pera (Algorand)"
            icon="mdi-wallet" class="full-width"
            @click="connectDialog = false" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="blue-grey-4" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import RecordWidget            from 'src/components/RecordWidget.vue'
import { useWalletStore }      from 'src/stores/wallet'
import { useGalaxyStore }      from 'src/stores/galaxy'
import { usePortalStore }      from 'src/stores/portal'
import WormholePortal          from 'src/components/WormholePortal.vue'
import SceneTransition         from 'src/components/SceneTransition.vue'
import OfflineStatusBar        from 'src/components/eco/OfflineStatusBar.vue'
import InstallPrompt           from 'src/components/eco/InstallPrompt.vue'
import LocalDataPanel          from 'src/components/eco/LocalDataPanel.vue'
import DemoConsentOverlay      from 'src/components/DemoConsentOverlay.vue'
import { useVizRenderer }      from 'src/composables/useVizRenderer'
import { recordVisit }        from 'src/composables/useRecentLocations'

const router      = useRouter()
const route       = useRoute()
const wallet      = useWalletStore()
const galaxyStore = useGalaxyStore()
const portalStore = usePortalStore()

// ── Persistent Three.js canvas ────────────────────────────────────────────────
const vizCanvas = ref<HTMLCanvasElement | null>(null)
const viz       = useVizRenderer()
const vizError  = ref<string | null>(null)

onMounted(() => {
  if (vizCanvas.value) viz.init(vizCanvas.value)
  vizError.value = viz.initError
  window.addEventListener('resize', viz.resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', viz.resize)
  viz.destroy()
  if (autoHideTimer) clearTimeout(autoHideTimer)
})

// ── Navigation group definitions ──────────────────────────────────────────────

type NavCard = {
  title: string
  desc:  string
  cta:   string
  route: string
  color: string
  art:   { vb: string; svg: string }
}

type NavGroup = {
  id:          string
  label:       string
  cards:       NavCard[]
  directLink?: string   // navigate directly; no mega panel
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'explore',
    label: 'EXPLORE',
    cards: [
      {
        title: 'Cosmic Web',
        desc:  'Navigate the large-scale structure of the universe — voids, filaments, and X-ray clusters.',
        cta:   'Open',
        route: '/',
        color: 'rgba(80,200,255,0.90)',
        art: { vb: '', svg: '' },
      },
      {
        title: 'Milky Way',
        desc:  'Navigate the galaxy map — star systems, stellar classification, and sky coverage.',
        cta:   'Browse',
        route: '/galaxy',
        color: 'rgba(180,130,255,0.90)',
        art: { vb: '', svg: '' },
      },
      {
        title: 'Galaxy Clusters',
        desc:  'Zoom into named X-ray clusters — browse member galaxies and cluster fields.',
        cta:   'Explore',
        route: '/clusters',
        color: 'rgba(255,180,60,0.90)',
        art: { vb: '', svg: '' },
      },
      {
        title: 'Planet Systems',
        desc:  'Settlement exolocation, portal transit, community rules, DAO governance.',
        cta:   'Open guide',
        route: '/planet-systems',
        color: 'rgba(60,220,160,0.90)',
        art: { vb: '', svg: '' },
      },
      {
        title: 'Black Holes',
        desc:  'Sgr A*, M87*, and every other black hole with strong observational evidence — EHT imaging, megamaser dynamics, Gaia astrometry, X-ray binaries.',
        cta:   'Observatory',
        route: '/black-holes',
        color: 'rgba(255,232,192,0.90)',
        art: { vb: '', svg: '' },
      },
    ],
  },
  {
    id: 'participate',
    label: 'PARTICIPATE',
    cards: [
      {
        title: 'Start a Settlement',
        desc:  'Claim 40 virtual acres on a confirmed exoplanet — your permanent on-chain home.',
        cta:   'Begin',
        route: '/mint',
        color: 'rgba(60,230,140,0.95)',
        art: {
          vb: '0 0 80 50',
          svg: `<rect x="0" y="0" width="80" height="50" fill="rgba(8,4,0,0.82)"/>
                <rect x="9" y="5" width="62" height="40" rx="2.5" fill="rgba(28,12,2,0.80)" stroke="rgba(200,148,18,0.65)" stroke-width="0.9"/>
                <rect x="12" y="8" width="56" height="34" rx="1.5" fill="none" stroke="rgba(175,118,10,0.32)" stroke-width="0.45"/>
                <path d="M12 8 L18 8 L18 9 L13 9 L13 15 L12 15 Z" fill="rgba(200,148,18,0.45)"/>
                <path d="M68 8 L62 8 L62 9 L67 9 L67 15 L68 15 Z" fill="rgba(200,148,18,0.45)"/>
                <path d="M12 42 L18 42 L18 41 L13 41 L13 35 L12 35 Z" fill="rgba(200,148,18,0.45)"/>
                <path d="M68 42 L62 42 L62 41 L67 41 L67 35 L68 35 Z" fill="rgba(200,148,18,0.45)"/>
                <text x="40" y="18" text-anchor="middle" font-size="5.8" fill="rgba(225,172,42,0.92)" font-family="Georgia,serif" font-weight="bold" letter-spacing="0.08em">LETTERS PATENT</text>
                <line x1="18" y1="21" x2="62" y2="21" stroke="rgba(180,120,10,0.30)" stroke-width="0.45"/>
                <text x="40" y="27" text-anchor="middle" font-size="3.8" fill="rgba(175,138,52,0.72)" font-family="monospace" letter-spacing="0.05em">EXOTOPIA COORDINATE REGISTRY</text>
                <text x="40" y="32" text-anchor="middle" font-size="3.4" fill="rgba(155,118,40,0.58)" font-family="monospace">exo-surface-v1 : Kepler-442b</text>
                <text x="40" y="37" text-anchor="middle" font-size="3.2" fill="rgba(140,105,35,0.48)" font-family="monospace">15N, 23W · 40 ACRES</text>
                <circle cx="40" cy="43" r="3.8" fill="rgba(160,18,18,0.55)" stroke="rgba(200,40,40,0.42)" stroke-width="0.45"/>
                <text x="40" y="44.5" text-anchor="middle" font-size="3.2" fill="rgba(255,200,200,0.62)" font-family="serif">⊕</text>`,
        },
      },
      {
        title: 'Design Gallery',
        desc:  '11 hand-crafted SVG designs across the Extrapolation Edition collector series.',
        cta:   'Browse',
        route: '/gallery',
        color: 'rgba(200,140,255,0.90)',
        art: {
          vb: '0 0 80 50',
          svg: `<rect x="22" y="10" width="28" height="38" rx="2" fill="rgba(20,10,40,0.70)" stroke="rgba(160,80,255,0.50)" stroke-width="0.8" transform="rotate(-8 36 29)"/>
                <rect x="30" y="8"  width="28" height="38" rx="2" fill="rgba(20,10,40,0.75)" stroke="rgba(160,80,255,0.60)" stroke-width="0.8" transform="rotate(-2 44 27)"/>
                <rect x="36" y="7"  width="28" height="38" rx="2" fill="rgba(10,5,30,0.85)"  stroke="rgba(200,140,255,0.70)" stroke-width="0.8"/>
                <circle cx="50" cy="22" r="6" fill="rgba(160,80,255,0.35)"/>
                <text x="50" y="35" text-anchor="middle" font-size="4.5" fill="rgba(200,150,255,0.70)" font-family="monospace" letter-spacing="0.05em">LEGENDARY</text>`,
        },
      },
      {
        title: 'Sustainable Design',
        desc:  'Water quality, farm mapping, and field work — sustainable design for Earth communities.',
        cta:   'Support',
        route: '/eco-ops',
        color: 'rgba(80,210,120,0.90)',
        art: {
          vb: '0 0 80 50',
          svg: `<path d="M40 42 C40 42 18 30 18 18 C18 10 28 6 40 14 C52 6 62 10 62 18 C62 30 40 42 40 42 Z" fill="rgba(60,180,100,0.35)" stroke="rgba(80,200,120,0.50)" stroke-width="0.8"/>
                <path d="M40 38 C40 38 22 28 22 20 C22 14 30 10 40 16 C50 10 58 14 58 20 C58 28 40 38 40 38 Z" fill="rgba(60,180,100,0.20)"/>
                <line x1="40" y1="42" x2="40" y2="48" stroke="rgba(80,180,100,0.45)" stroke-width="1"/>`,
        },
      },
      {
        title: 'Eco Ledger',
        desc:  'Member contributions, species records, and habitat register for field groups.',
        cta:   'Open ledger',
        route: '/eco-ledger',
        color: 'rgba(60,200,140,0.90)',
        art: {
          vb: '0 0 80 50',
          svg: `<rect x="14" y="6" width="52" height="38" rx="2.5" fill="rgba(0,25,14,0.75)" stroke="rgba(60,180,100,0.40)" stroke-width="0.8"/>
                <line x1="14" y1="15" x2="66" y2="15" stroke="rgba(60,160,90,0.28)" stroke-width="0.5"/>
                <line x1="14" y1="22" x2="66" y2="22" stroke="rgba(40,120,65,0.18)" stroke-width="0.4"/>
                <line x1="14" y1="29" x2="66" y2="29" stroke="rgba(40,120,65,0.18)" stroke-width="0.4"/>
                <line x1="14" y1="36" x2="66" y2="36" stroke="rgba(40,120,65,0.18)" stroke-width="0.4"/>
                <rect x="17" y="9" width="18" height="4" rx="1" fill="rgba(60,180,100,0.22)"/>
                <rect x="17" y="17" width="12" height="3" rx="1" fill="rgba(60,180,100,0.18)"/>
                <rect x="17" y="24" width="16" height="3" rx="1" fill="rgba(60,180,100,0.18)"/>
                <rect x="17" y="31" width="10" height="3" rx="1" fill="rgba(60,180,100,0.18)"/>
                <circle cx="56" cy="34" r="6" fill="rgba(40,160,90,0.30)" stroke="rgba(80,220,130,0.45)" stroke-width="0.7"/>
                <path d="M53 34 L55.5 36.5 L59 31.5" stroke="rgba(80,230,140,0.75)" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
        },
      },
      {
        title: 'Knowledge Quizzes',
        desc:  'Test your understanding of exoplanet science, settlement protocols, and the PON INK system.',
        cta:   'Start',
        route: '/learn',
        color: 'rgba(255,200,60,0.90)',
        art: {
          vb: '0 0 80 50',
          svg: `<circle cx="40" cy="22" r="14" fill="none" stroke="rgba(255,200,60,0.35)" stroke-width="0.8"/>
                <text x="40" y="27" text-anchor="middle" font-size="16" fill="rgba(255,200,60,0.70)" font-family="Georgia,serif" font-weight="bold">?</text>
                <circle cx="40" cy="40" r="2" fill="rgba(255,200,60,0.60)"/>`,
        },
      },
      {
        title: 'Aftermarket',
        desc:  'Secondary exchange — sphere properties, airdrop bundles, and Mule tier listings.',
        cta:   'Enter',
        route: '/pon-ink',
        color: 'rgba(0,220,150,0.90)',
        art: {
          vb: '0 0 80 50',
          svg: `<polygon points="40,8 52,18 52,32 40,42 28,32 28,18" fill="none" stroke="rgba(0,220,150,0.40)" stroke-width="0.8"/>
                <polygon points="40,14 48,21 48,31 40,38 32,31 32,21" fill="rgba(0,180,120,0.15)"/>
                <text x="40" y="29" text-anchor="middle" font-size="9" fill="rgba(0,220,150,0.80)" font-family="monospace" font-weight="bold">⬡</text>`,
        },
      },
      {
        title: 'Benefit Earth',
        desc:  'Connect with a community that matters — wallet, land, and real-world good in three steps.',
        cta:   'Begin',
        route: '/onboard',
        color: 'rgba(60,200,255,0.90)',
        art: {
          vb: '0 0 80 50',
          svg: `<circle cx="20" cy="25" r="7" fill="rgba(60,180,255,0.25)" stroke="rgba(60,180,255,0.50)" stroke-width="0.7"/>
                <text x="20" y="28" text-anchor="middle" font-size="7" fill="rgba(60,200,255,0.80)" font-family="monospace" font-weight="bold">①</text>
                <line x1="28" y1="25" x2="33" y2="25" stroke="rgba(60,180,255,0.30)" stroke-width="0.8" stroke-dasharray="2 1"/>
                <circle cx="40" cy="25" r="7" fill="rgba(60,180,255,0.20)" stroke="rgba(60,180,255,0.40)" stroke-width="0.7"/>
                <text x="40" y="28" text-anchor="middle" font-size="7" fill="rgba(60,200,255,0.70)" font-family="monospace">②</text>
                <line x1="48" y1="25" x2="53" y2="25" stroke="rgba(60,180,255,0.30)" stroke-width="0.8" stroke-dasharray="2 1"/>
                <circle cx="60" cy="25" r="7" fill="rgba(60,180,255,0.15)" stroke="rgba(60,180,255,0.35)" stroke-width="0.7"/>
                <text x="60" y="28" text-anchor="middle" font-size="7" fill="rgba(60,200,255,0.60)" font-family="monospace">③</text>`,
        },
      },
      {
        title: 'Rewards & Certificates',
        desc:  'Points across volunteering, educating others, and finance literacy — plus certificates that unlock settlement objects.',
        cta:   'Open',
        route: '/rewards',
        color: 'rgba(255,204,68,0.90)',
        art: {
          vb: '0 0 80 50',
          svg: `<circle cx="40" cy="22" r="13" fill="rgba(255,204,68,0.15)" stroke="rgba(255,204,68,0.55)" stroke-width="0.9"/>
                <circle cx="40" cy="22" r="8" fill="none" stroke="rgba(255,204,68,0.40)" stroke-width="0.6"/>
                <path d="M40 15 L42.2 20 L47.5 20.5 L43.6 24 L44.7 29.2 L40 26.4 L35.3 29.2 L36.4 24 L32.5 20.5 L37.8 20 Z" fill="rgba(255,224,120,0.75)"/>
                <path d="M31 32 L27 42 L33 42 L35 38 Z" fill="rgba(255,204,68,0.30)" stroke="rgba(255,204,68,0.45)" stroke-width="0.5"/>
                <path d="M49 32 L53 42 L47 42 L45 38 Z" fill="rgba(255,204,68,0.30)" stroke="rgba(255,204,68,0.45)" stroke-width="0.5"/>`,
        },
      },
      {
        title: 'PFAS Cleanup',
        desc:  'Citizen-science PFAS/PFOA decontamination — log project progress, propose methods, and mark real work in your settlement.',
        cta:   'Explore',
        route: '/pfas-citizen-science',
        color: 'rgba(0,229,255,0.90)',
        art: {
          vb: '0 0 80 50',
          svg: `<path d="M40 6 C40 6 26 22 26 32 C26 39.7 32.3 46 40 46 C47.7 46 54 39.7 54 32 C54 22 40 6 40 6 Z" fill="rgba(0,229,255,0.12)" stroke="rgba(0,229,255,0.55)" stroke-width="0.9"/>
                <path d="M40 14 C40 14 31 25 31 32 C31 36.9 35.1 41 40 41 C44.9 41 49 36.9 49 32 C49 25 40 14 40 14 Z" fill="rgba(0,229,255,0.20)"/>
                <circle cx="35" cy="30" r="1.6" fill="rgba(180,245,255,0.55)"/>
                <circle cx="44" cy="34" r="1.3" fill="rgba(180,245,255,0.45)"/>
                <line x1="35" y1="30" x2="44" y2="34" stroke="rgba(180,245,255,0.35)" stroke-width="0.5"/>`,
        },
      },
    ],
  },
  // Docs links live inside /docs page sidebar — this is a direct nav link only
  {
    id:         'docs',
    label:      'DOCS',
    cards:      [],
    directLink: '/docs',
  },
]

// ── Group banner art (wide panoramic subheader, one per nav group) ───────────

interface GroupBanner { vb: string; svg: string; label: string }

const GROUP_BANNERS: Record<string, GroupBanner> = {
  explore: {
    label: 'L1 COSMIC  ·  L2 GALAXY  ·  L4 SURFACE',
    vb: '0 0 400 60',
    svg: `<rect x="0" y="0" width="400" height="60" fill="rgba(0,2,14,0.55)"/>
          <polygon points="88,7 192,3 288,11 358,32 312,50 188,54 88,44 44,26"
            fill="rgba(0,6,30,0.40)" stroke="rgba(0,140,215,0.14)" stroke-width="0.7"/>
          <path d="M0 22 Q88 7 192 3 Q288 11 400 6" fill="none" stroke="rgba(0,160,240,0.12)" stroke-width="0.8"/>
          <path d="M0 48 Q88 44 192 54 Q288 50 358 32 Q382 24 400 30" fill="none" stroke="rgba(100,20,200,0.09)" stroke-width="0.6"/>
          <path d="M0 32 Q80 24 192 30 Q304 36 400 26" fill="none" stroke="rgba(255,180,60,0.08)" stroke-width="1.2"/>
          <circle cx="88"  cy="7"  r="2.5" fill="rgba(0,200,255,0.55)"/>
          <circle cx="192" cy="3"  r="3.0" fill="rgba(0,200,255,0.46)"/>
          <circle cx="288" cy="11" r="2.0" fill="rgba(180,100,255,0.50)"/>
          <circle cx="358" cy="32" r="2.5" fill="rgba(255,180,60,0.44)"/>
          <circle cx="312" cy="50" r="1.8" fill="rgba(0,200,255,0.38)"/>
          <line x1="88"  y1="7"  x2="60"  y2="0" stroke="rgba(0,180,255,0.20)" stroke-width="0.6"/>
          <line x1="192" y1="3"  x2="210" y2="0" stroke="rgba(0,180,255,0.16)" stroke-width="0.5"/>
          <line x1="288" y1="11" x2="312" y2="0" stroke="rgba(180,100,255,0.14)" stroke-width="0.5"/>
          <line x1="358" y1="32" x2="400" y2="28" stroke="rgba(255,180,60,0.16)" stroke-width="0.5"/>
          <circle cx="22"  cy="18" r="0.7" fill="rgba(255,255,255,0.22)"/>
          <circle cx="144" cy="40" r="0.6" fill="rgba(255,255,255,0.17)"/>
          <circle cx="252" cy="22" r="0.6" fill="rgba(255,255,255,0.17)"/>
          <circle cx="374" cy="46" r="0.7" fill="rgba(255,255,255,0.19)"/>
          <circle cx="58"  cy="50" r="0.5" fill="rgba(180,200,255,0.16)"/>`,
  },
  participate: {
    label: 'SETTLEMENT  ·  COMMUNITY  ·  FIELD WORK',
    vb: '0 0 400 60',
    svg: `<rect x="0" y="0" width="400" height="60" fill="rgba(2,7,24,0.62)"/>
          <path d="M0 15 Q100 9 200 13 Q300 17 400 11" fill="none" stroke="rgba(60,220,120,0.20)" stroke-width="2.5"/>
          <path d="M0 21 Q120 15 200 19 Q280 23 400 17" fill="none" stroke="rgba(60,190,255,0.14)" stroke-width="1.8"/>
          <path d="M0 27 Q160 21 200 25 Q256 29 400 23" fill="none" stroke="rgba(60,160,255,0.08)" stroke-width="1.0"/>
          <circle cx="18"  cy="6"  r="0.6" fill="rgba(255,255,255,0.40)"/>
          <circle cx="78"  cy="8"  r="0.5" fill="rgba(255,255,255,0.32)"/>
          <circle cx="182" cy="5"  r="0.6" fill="rgba(255,255,255,0.36)"/>
          <circle cx="290" cy="7"  r="0.5" fill="rgba(255,255,255,0.28)"/>
          <circle cx="368" cy="5"  r="0.5" fill="rgba(200,220,255,0.36)"/>
          <circle cx="342" cy="10" r="7.5" fill="rgba(180,162,122,0.34)" stroke="rgba(200,182,140,0.20)" stroke-width="0.4"/>
          <path d="M0 38 Q58 32 98 36 Q158 40 220 32 Q278 24 338 30 Q378 34 400 28 L400 60 L0 60 Z" fill="rgba(28,60,40,0.62)"/>
          <path d="M0 46 Q78 42 148 45 Q218 48 298 42 Q358 38 400 44 L400 60 L0 60 Z" fill="rgba(20,48,30,0.72)"/>
          <path d="M172 38 Q190 23 200 22 Q210 23 228 38 Z" fill="rgba(40,90,160,0.44)" stroke="rgba(80,170,230,0.36)" stroke-width="0.6"/>
          <ellipse cx="200" cy="38" rx="19" ry="3.5" fill="rgba(50,110,180,0.18)"/>
          <rect x="190" y="34" width="1.5" height="5.5" fill="rgba(18,38,68,0.82)"/>
          <rect x="194" y="32" width="1.5" height="7.5" fill="rgba(18,38,68,0.82)"/>
          <rect x="198" y="34" width="1.5" height="5.5" fill="rgba(18,38,68,0.78)"/>
          <rect x="202" y="32" width="1.5" height="7.5" fill="rgba(18,38,68,0.82)"/>
          <rect x="206" y="34" width="1.5" height="5.5" fill="rgba(18,38,68,0.78)"/>`,
  },
  docs: {
    label: 'PROTOCOL  ·  GLOSSARY  ·  NETWORKS  ·  SPECS',
    vb: '0 0 400 60',
    svg: `<rect x="0" y="0" width="400" height="60" fill="rgba(0,4,20,0.56)"/>
          <rect x="14" y="9"  width="110" height="5.5" rx="1" fill="rgba(100,200,240,0.40)"/>
          <rect x="14" y="20" width="190" height="2.5" rx="1" fill="rgba(100,200,240,0.18)"/>
          <rect x="14" y="26" width="168" height="2.5" rx="1" fill="rgba(100,200,240,0.14)"/>
          <rect x="14" y="32" width="205" height="2.5" rx="1" fill="rgba(100,200,240,0.11)"/>
          <rect x="14" y="38" width="148" height="2.5" rx="1" fill="rgba(100,200,240,0.09)"/>
          <rect x="14" y="44" width="175" height="2.5" rx="1" fill="rgba(100,200,240,0.07)"/>
          <rect x="244" y="9"  width="148" height="43" rx="2" fill="rgba(0,20,52,0.42)" stroke="rgba(0,90,155,0.22)" stroke-width="0.5"/>
          <rect x="252" y="16" width="92"  height="2.2" rx="1" fill="rgba(0,200,105,0.35)"/>
          <rect x="252" y="22" width="70"  height="2.2" rx="1" fill="rgba(180,120,255,0.28)"/>
          <rect x="260" y="28" width="105" height="2.2" rx="1" fill="rgba(100,180,255,0.26)"/>
          <rect x="260" y="34" width="80"  height="2.2" rx="1" fill="rgba(100,180,255,0.22)"/>
          <rect x="260" y="40" width="90"  height="2.2" rx="1" fill="rgba(100,180,255,0.19)"/>
          <rect x="252" y="46" width="58"  height="2.2" rx="1" fill="rgba(255,200,60,0.20)"/>`,
  },
}

// ── Shared animated landscape — background for all mega panels ───────────────
// Stars use SMIL <animate>, moon pulses, mule walks via <animateTransform>.
// Injected via v-html on a <g> so the SVG namespace is preserved.

const LANDSCAPE_SVG = `
<rect x="0" y="0" width="900" height="220" fill="rgba(0,2,14,0.74)"/>

<circle cx="35"  cy="16"  r="0.8" fill="rgba(210,225,255,1)"><animate attributeName="opacity" values="0.28;0.78;0.28" dur="3.4s" repeatCount="indefinite" begin="0s"/></circle>
<circle cx="122" cy="44"  r="0.6" fill="rgba(255,242,210,1)"><animate attributeName="opacity" values="0.32;0.80;0.32" dur="4.2s" repeatCount="indefinite" begin="0.7s"/></circle>
<circle cx="210" cy="26"  r="1.0" fill="rgba(210,225,255,1)"><animate attributeName="opacity" values="0.30;0.88;0.30" dur="2.9s" repeatCount="indefinite" begin="1.3s"/></circle>
<circle cx="298" cy="58"  r="0.7" fill="rgba(255,255,255,1)"><animate attributeName="opacity" values="0.22;0.70;0.22" dur="3.8s" repeatCount="indefinite" begin="2.0s"/></circle>
<circle cx="378" cy="13"  r="0.9" fill="rgba(210,225,255,1)"><animate attributeName="opacity" values="0.32;0.82;0.32" dur="4.6s" repeatCount="indefinite" begin="0.4s"/></circle>
<circle cx="458" cy="40"  r="0.6" fill="rgba(255,242,210,1)"><animate attributeName="opacity" values="0.26;0.72;0.26" dur="3.1s" repeatCount="indefinite" begin="1.6s"/></circle>
<circle cx="525" cy="66"  r="0.8" fill="rgba(210,225,255,1)"><animate attributeName="opacity" values="0.28;0.75;0.28" dur="5.1s" repeatCount="indefinite" begin="0.5s"/></circle>
<circle cx="598" cy="20"  r="1.1" fill="rgba(255,255,255,1)"><animate attributeName="opacity" values="0.38;0.92;0.38" dur="2.7s" repeatCount="indefinite" begin="2.3s"/></circle>
<circle cx="672" cy="80"  r="0.7" fill="rgba(210,225,255,1)"><animate attributeName="opacity" values="0.26;0.68;0.26" dur="4.3s" repeatCount="indefinite" begin="1.0s"/></circle>
<circle cx="738" cy="35"  r="0.9" fill="rgba(255,242,210,1)"><animate attributeName="opacity" values="0.30;0.78;0.30" dur="3.9s" repeatCount="indefinite" begin="3.1s"/></circle>
<circle cx="800" cy="58"  r="0.6" fill="rgba(210,225,255,1)"><animate attributeName="opacity" values="0.24;0.66;0.24" dur="4.9s" repeatCount="indefinite" begin="1.9s"/></circle>
<circle cx="858" cy="28"  r="0.8" fill="rgba(255,255,255,1)"><animate attributeName="opacity" values="0.32;0.82;0.32" dur="3.6s" repeatCount="indefinite" begin="0.2s"/></circle>
<circle cx="90"  cy="90"  r="0.7" fill="rgba(255,255,255,1)"><animate attributeName="opacity" values="0.20;0.60;0.20" dur="3.5s" repeatCount="indefinite" begin="2.8s"/></circle>
<circle cx="340" cy="118" r="0.8" fill="rgba(255,242,210,1)"><animate attributeName="opacity" values="0.24;0.65;0.24" dur="3.0s" repeatCount="indefinite" begin="1.4s"/></circle>
<circle cx="500" cy="92"  r="0.6" fill="rgba(210,225,255,1)"><animate attributeName="opacity" values="0.22;0.62;0.22" dur="4.1s" repeatCount="indefinite" begin="3.6s"/></circle>
<circle cx="640" cy="125" r="0.7" fill="rgba(255,255,255,1)"><animate attributeName="opacity" values="0.18;0.55;0.18" dur="4.7s" repeatCount="indefinite" begin="2.5s"/></circle>
<circle cx="750" cy="98"  r="0.9" fill="rgba(210,225,255,1)"><animate attributeName="opacity" values="0.26;0.70;0.26" dur="3.3s" repeatCount="indefinite" begin="1.2s"/></circle>

<circle cx="718" cy="50" r="30" fill="rgba(190,162,118,0.16)">
  <animate attributeName="r" values="30;38;30" dur="9s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0.7;1;0.7" dur="9s" repeatCount="indefinite"/>
</circle>
<circle cx="718" cy="50" r="20" fill="rgba(196,172,130,0.40)" stroke="rgba(215,192,148,0.20)" stroke-width="0.7">
  <animate attributeName="opacity" values="0.80;1.00;0.80" dur="9s" repeatCount="indefinite"/>
</circle>
<ellipse cx="712" cy="45" rx="5.5" ry="3.5" fill="rgba(255,248,225,0.10)"/>
<circle cx="722" cy="55" r="2" fill="rgba(160,138,100,0.22)"/>

<ellipse cx="450" cy="165" rx="450" ry="50" fill="rgba(60,155,88,0.05)"/>
<path d="M0 162 Q225 156 450 160 Q675 164 900 158" fill="none" stroke="rgba(80,200,120,0.10)" stroke-width="1.5"/>

<path d="M0 170 Q130 163 250 167 Q380 171 500 163 Q625 155 745 161 Q825 165 900 159 L900 220 L0 220 Z" fill="rgba(22,50,34,0.52)"/>
<path d="M0 182 Q160 178 315 180 Q460 182 600 175 Q725 170 900 175 L900 220 L0 220 Z" fill="rgba(14,38,22,0.65)"/>

<path d="M276 167 Q290 149 303 146 Q317 149 330 167 Z" fill="rgba(40,90,160,0.44)" stroke="rgba(80,170,230,0.36)" stroke-width="0.8"/>
<ellipse cx="303" cy="167" rx="22" ry="3.5" fill="rgba(50,110,180,0.17)"/>
<path d="M281 163 Q289 154 300 151" fill="none" stroke="rgba(130,210,255,0.15)" stroke-width="0.8"/>
<ellipse cx="303" cy="160" rx="11" ry="6" fill="rgba(80,200,255,0.05)"/>
<rect x="297" y="157" width="1.2" height="11" fill="rgba(18,38,68,0.80)"/>
<rect x="301" y="152" width="1.2" height="16" fill="rgba(18,38,68,0.80)"/>
<rect x="305" y="157" width="1.2" height="11" fill="rgba(18,38,68,0.76)"/>

<g>
  <ellipse cx="0" cy="0" rx="15" ry="7" fill="rgba(20,12,5,0.82)"/>
  <path d="M-13 -5 Q-19 -12 -21 -16" stroke="rgba(20,12,5,0.82)" stroke-width="4.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="-23" cy="-19" rx="5.5" ry="4.5" fill="rgba(20,12,5,0.82)"/>
  <path d="M-22 -23 L-20 -32 L-24 -23" fill="rgba(20,12,5,0.76)"/>
  <path d="M-25 -23 L-25 -31 L-28 -23" fill="rgba(20,12,5,0.76)"/>
  <ellipse cx="-27" cy="-17" rx="2.5" ry="1.8" fill="rgba(40,28,16,0.55)"/>
  <line x1="7"   y1="6" x2="10" y2="18" stroke="rgba(20,12,5,0.80)" stroke-width="3" stroke-linecap="round"/>
  <line x1="2"   y1="6" x2="0"  y2="18" stroke="rgba(20,12,5,0.80)" stroke-width="3" stroke-linecap="round"/>
  <line x1="-5"  y1="6" x2="-4" y2="18" stroke="rgba(20,12,5,0.80)" stroke-width="3" stroke-linecap="round"/>
  <line x1="-11" y1="6" x2="-13" y2="18" stroke="rgba(20,12,5,0.80)" stroke-width="3" stroke-linecap="round"/>
  <path d="M15 -3 Q23 -7 21 -14" fill="none" stroke="rgba(20,12,5,0.62)" stroke-width="2" stroke-linecap="round"/>
  <animateTransform attributeName="transform" type="translate" from="960,180" to="-70,180" dur="32s" repeatCount="indefinite" begin="-14s"/>
</g>
`

// ── Item panel definitions (right-side content per left-sidebar hover) ──────

interface PanelAction { label: string; route: string; primary?: boolean }
interface PanelField  { placeholder: string; key: string }
interface ItemPanel {
  style:         string
  headline:      string
  subline?:      string
  field?:        PanelField
  actions:       PanelAction[]
  sessionKey?:   string
  sessionLabel?: string
}

const ITEM_PANELS: Record<string, ItemPanel> = {
  'Cosmic Web': {
    style: 'cosmic', headline: 'Navigate the cosmic web',
    subline: 'Great voids, Laniakea filaments, and X-ray cluster boundaries.',
    actions: [{ label: 'Enter Laniakea', route: '/', primary: true }, { label: 'Boötes Void', route: '/' }],
    sessionKey: 'exo_last_cluster', sessionLabel: 'Last cluster',
  },
  'Galaxy Clusters': {
    style: 'cosmic', headline: 'Galaxy cluster browser',
    subline: '345 XMM-Newton clusters — zoom into a cluster field.',
    field:   { placeholder: 'Cluster name or MCXC ID…', key: 'cluster' },
    actions: [{ label: 'Browse all', route: '/galaxy', primary: true }, { label: 'Virgo', route: '/galaxy' }, { label: 'Perseus', route: '/galaxy' }],
    sessionKey: 'exo_last_cluster', sessionLabel: 'Last visited',
  },
  'Planet Systems': {
    style: 'search', headline: 'Exoplanet system explorer',
    subline: '5,000+ confirmed systems — find your destination planet.',
    field:   { placeholder: 'Planet or host star name…', key: 'planet' },
    actions: [{ label: 'Search', route: '/galaxy', primary: true }, { label: 'Habitable zone', route: '/galaxy' }, { label: 'Kepler set', route: '/galaxy' }],
    sessionKey: 'exo_last_planet', sessionLabel: 'Last visited',
  },
  'Settlement Surfaces': {
    style: 'surface', headline: 'Surface & settlement view',
    subline: 'Walk a dome settlement on any confirmed exoplanet.',
    actions: [{ label: 'Enter surface', route: '/planet-systems', primary: true }, { label: 'My settlement', route: '/' }],
    sessionKey: 'exo_last_planet', sessionLabel: 'Resume at',
  },
  'Data Coverage': {
    style: 'data', headline: 'Catalog coverage & gaps',
    subline: 'NASA archive, XMM-Newton clusters, HYG star database.',
    actions: [{ label: 'View coverage', route: '/data-coverage', primary: true }],
  },
  'Start a Settlement': {
    style: 'deed', headline: 'Mint a free exolocation deed',
    subline: '40 virtual acres on a confirmed exoplanet — permanently on-chain.',
    field:   { placeholder: 'Planet name or coordinates…', key: 'mintPlanet' },
    actions: [{ label: 'Mint free deed →', route: '/mint', primary: true }],
    sessionKey: 'exo_wallet', sessionLabel: 'Wallet',
  },
  'Design Gallery': {
    style: 'gallery', headline: 'Collector card gallery',
    subline: '11 hand-crafted SVG cards, one collector series.',
    actions: [{ label: 'Browse gallery', route: '/gallery', primary: true }, { label: 'My collection', route: '/gallery' }],
    sessionKey: 'exo_last_gallery_card', sessionLabel: 'Last viewed',
  },
  'Sustainable Design': {
    style: 'eco', headline: 'Sustainable design & field ops',
    subline: 'Water quality, farm mapping, and community field work — real-world impact.',
    field:   { placeholder: 'Field site or community name…', key: 'ecoSite' },
    actions: [{ label: 'Log field work', route: '/eco-ops', primary: true }, { label: 'Field map', route: '/eco-ops' }],
  },
  'Knowledge Quizzes': {
    style: 'quiz', headline: 'Test your exoplanet knowledge',
    subline: 'Exoplanet science, PON INK protocol, settlement ecology.',
    actions: [{ label: 'Start quiz', route: '/learn', primary: true }, { label: 'Continue', route: '/learn' }],
    sessionKey: 'exo_quiz_score', sessionLabel: 'Your score',
  },
  'Aftermarket': {
    style: 'chain', headline: 'Aftermarket exchange',
    subline: 'Sphere properties, airdrop bundles, Mule tiers — secondary market.',
    actions: [{ label: 'Open aftermarket', route: '/pon-ink', primary: true }],
  },
  'Benefit Earth': {
    style: 'onboard', headline: 'Benefit Earth — begin here',
    subline: 'Set up your wallet, claim land, and connect with a community that matters.',
    actions: [{ label: 'Begin →', route: '/onboard', primary: true }],
    sessionKey: 'exo_onboard_step', sessionLabel: 'Progress',
  },
  'Rewards & Certificates': {
    style: 'quiz', headline: 'Rewards & incentive ledger',
    subline: 'Volunteering, educating others, finance literacy — points and certificates in one place.',
    actions: [{ label: 'Open rewards', route: '/rewards', primary: true }, { label: 'How it works', route: '/rewards-guide' }],
  },
  'PFAS Cleanup': {
    style: 'eco', headline: 'PFAS/PFOA citizen science',
    subline: 'Real remediation methods, public method proposals, and decon-project logging.',
    actions: [{ label: 'Browse projects', route: '/pfas-citizen-science', primary: true }, { label: 'Method proposals', route: '/method-proposals' }],
  },
  'Getting Started': {
    style: 'docs', headline: 'Platform overview & quickstart',
    subline: 'Resonance split, Eco-ops integration, community structure.',
    actions: [{ label: 'Read guide', route: '/docs#getting-started', primary: true }],
  },
  'Coordinate System': {
    style: 'coords', headline: 'PON INK coordinate addressing',
    subline: 'L1–L6 trophic levels — stellar orbital to moon interface.',
    field:   { placeholder: 'e.g.  Kepler-442b : 15N, 23W', key: 'coordLookup' },
    actions: [{ label: 'Look up address', route: '/docs#protocol', primary: true }, { label: 'Full spec', route: '/docs#protocol' }],
  },
  'Glossary': {
    style: 'docs', headline: '45 canonical terms',
    subline: 'Trophic levels, exolocation addressing, wormhole transit, Mule AI.',
    field:   { placeholder: 'Search terms…', key: 'glossarySearch' },
    actions: [{ label: 'Open glossary', route: '/glossary', primary: true }],
  },
  'Networks & Chains': {
    style: 'chain', headline: 'Active blockchain networks',
    subline: 'Polygon Amoy, Celo Alfajores, Algorand — status and NFT roles.',
    actions: [{ label: 'View chains', route: '/chains', primary: true }],
    sessionKey: 'exo_wallet', sessionLabel: 'Connected wallet',
  },
  'Minting Guide': {
    style: 'docs', headline: 'Step-by-step minting guide',
    subline: 'Wallet · IPFS metadata · safeMint · Polygonscan confirmation.',
    actions: [{ label: 'Read guide', route: '/docs#minting', primary: true }],
  },
  'Data Sources': {
    style: 'data', headline: 'Catalog sources & sky coverage',
    subline: 'NASA archive, XMM-Newton, HYG stars — scope and gaps.',
    actions: [{ label: 'Full coverage page', route: '/data-coverage', primary: true }],
  },
}

// ── Participate group — art-immersion panel data ──────────────────────────────

interface ParticipatePanelData {
  vb: string       // zoomed viewBox crop of the card art
  filter: string   // CSS filter for colour variation
  caption: string  // atmospheric label shown top-left
  cta: string      // single CTA text (consolidated action zone)
  route: string
  sessionKey?: string
}

const PARTICIPATE_PANEL: Record<string, ParticipatePanelData> = {
  'Start a Settlement': {
    vb: '12 12 54 28', filter: 'sepia(0.22) saturate(1.7) brightness(1.08)',
    caption: '40 ACRES · START A SETTLEMENT', cta: 'Begin settlement →', route: '/mint',
    sessionKey: 'exo_wallet',
  },
  'Design Gallery': {
    vb: '30 4 36 34', filter: 'saturate(1.9) hue-rotate(256deg) brightness(1.1)',
    caption: 'SVG ORIGINALS · DESIGN GALLERY', cta: 'Browse gallery →', route: '/gallery',
    sessionKey: 'exo_last_gallery_card',
  },
  'Sustainable Design': {
    vb: '18 6 44 42', filter: 'saturate(2.2) hue-rotate(92deg) brightness(1.12)',
    caption: 'SUSTAINABLE DESIGN · FIELD OPS', cta: 'Support field work →', route: '/eco-ops',
  },
  'Knowledge Quizzes': {
    vb: '24 6 32 34', filter: 'saturate(1.6) brightness(1.18)',
    caption: 'SCIENCE · PROTOCOL · ECOLOGY', cta: 'Start a quiz →', route: '/learn',
    sessionKey: 'exo_quiz_score',
  },
  'Aftermarket': {
    vb: '24 4 32 40', filter: 'saturate(1.8) hue-rotate(148deg) brightness(1.1)',
    caption: 'AFTERMARKET · SPHERE EXCHANGE', cta: 'Open aftermarket →', route: '/pon-ink',
  },
  'Benefit Earth': {
    vb: '10 14 60 22', filter: 'saturate(1.4) brightness(1.14)',
    caption: 'BENEFIT EARTH · BEGIN HERE', cta: 'Begin →', route: '/onboard',
    sessionKey: 'exo_onboard_step',
  },
  'Rewards & Certificates': {
    vb: '20 4 40 40', filter: 'saturate(1.7) brightness(1.12)',
    caption: 'POINTS · CERTIFICATES · IMPACT', cta: 'Open rewards →', route: '/rewards',
  },
  'PFAS Cleanup': {
    vb: '20 4 40 42', filter: 'saturate(1.9) hue-rotate(6deg) brightness(1.1)',
    caption: 'CITIZEN SCIENCE · PFAS CLEANUP', cta: 'Browse projects →', route: '/pfas-citizen-science',
  },
}

// ── Sidebar hover state + action forms ───────────────────────────────────────

const hoveredItem    = ref<string | null>(null)
const hoveredExplore = ref<string | null>(null)
const fieldValues    = reactive<Record<string, string>>({})

const EXPLORE_SCOPE: Record<string, string> = {
  'Cosmic Web':      'L1 · COSMIC SCALE · VOID MAPPING',
  'Milky Way':       'L2 · MILKY WAY · 5K+ SYSTEMS',
  'Galaxy Clusters': 'L2 · XMM CLUSTERS · 345 FIELDS',
  'Planet Systems':  'L3 · CONFIRMED EXOPLANETS · HABITABLE ZONE',
}

// Card lookup for the currently hovered item (used by the participate art panel)
const hoveredCard = computed(() => {
  if (!hoveredItem.value) return null
  for (const g of NAV_GROUPS) {
    const c = g.cards.find(card => card.title === hoveredItem.value)
    if (c) return c
  }
  return null
})

function panelNavigate(action: PanelAction, itemTitle: string | null) {
  const panel = itemTitle ? ITEM_PANELS[itemTitle] : null
  const q = panel?.field ? (fieldValues[panel.field.key] ?? '').trim() : ''
  navTo(q ? `${action.route}?q=${encodeURIComponent(q)}` : action.route)
}

// Session context — read from localStorage at startup (SPA mode; no SSR risk)
const session = reactive<Record<string, string | null>>({
  exo_last_planet:       null,
  exo_last_cluster:      null,
  exo_quiz_score:        null,
  exo_onboard_step:      null,
  exo_last_gallery_card: null,
  exo_wallet:            null,
})
if (typeof window !== 'undefined') {
  Object.keys(session).forEach(k => { session[k] = localStorage.getItem(k) })
}

function sessionValue(key?: string): string | null {
  if (!key) return null
  if (key === 'exo_wallet') return wallet.shortAddress || session.exo_wallet
  return session[key] ?? null
}

// ── Open/close ─────────────────────────────────────────────────────────────────

const openSection    = ref<string | null>(null)
const connectDialog  = ref(false)
const mobileMenuOpen = ref(false)

function toggleSection(id: string) {
  openSection.value = openSection.value === id ? null : id
}

function navTo(path: string) {
  openSection.value    = null
  mobileMenuOpen.value = false
  addressInput.value   = ''
  searchResults.value  = []
  noResults.value      = false
  void router.push(path)
}

watch(() => route.path, () => { openSection.value = null; mobileMenuOpen.value = false })
watch(openSection,      () => { hoveredItem.value  = null })

// Record surface/cluster page visits for quick-transit shortcuts
watch(() => route.name, (name) => {
  if (typeof name !== 'string') return
  recordVisit(
    name,
    route.params as Record<string, string>,
    route.query  as Record<string, string>,
  )
}, { immediate: true })

// ── Art strip stars ───────────────────────────────────────────────────────────

const artStars = (() => {
  const rng = (n: number) => ((Math.sin(n * 91.3) * 43758.5) % 1 + 1) / 2
  const COLORS = ['#ffffff', '#a0c8ff', '#ffd2a1', '#00ddcc', '#ffcc88', '#c0c8ff']
  return Array.from({ length: 55 }, (_, i) => ({
    id: i,
    x:  Math.round(rng(i * 3)     * 1200),
    y:  Math.round(rng(i * 3 + 1) * 36),
    r:  +(0.3 + rng(i * 3 + 2) * 1.2).toFixed(1),
    o:  +(0.08 + rng(i * 7)     * 0.35).toFixed(2),
    c:  COLORS[Math.floor(rng(i * 11) * COLORS.length)]!,
  }))
})()

// ── Level label ───────────────────────────────────────────────────────────────

const currentLevelLabel = computed((): string => {
  const p = route.path
  if (p.startsWith('/surface'))      return 'L4 SURFACE'
  if (p.startsWith('/galaxy'))       return 'L2 GALAXY'
  if (p.startsWith('/clusters'))     return 'L2 CLUSTERS'
  if (p.startsWith('/planet-systems')) return 'L3 SYSTEMS'
  if (p === '/' || p.startsWith('/cosmic')) return 'L1 COSMIC'
  if (p.startsWith('/gallery'))      return 'L6 GALLERY'
  if (p.startsWith('/mint'))         return 'MINT'
  if (p.startsWith('/learn'))        return 'LEARN'
  if (p.startsWith('/docs'))         return 'DOCS'
  if (p.startsWith('/data-coverage'))return 'DATA'
  if (p.startsWith('/admin'))        return 'ADMIN'
  if (p.startsWith('/black-holes'))  return 'OBSERVATORY'
  if (p.startsWith('/bh/') || p.startsWith('/galactic-center')) return 'L3 BLACK HOLE'
  return ''
})

// ── Admin shortcut (Shift + Alt + A) ─────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.shiftKey && e.altKey && e.key === 'A') void router.push('/admin')
  })
}

// ── Planet / system search ────────────────────────────────────────────────────

const addressInput  = ref('')
const searchFocused = ref(false)

interface SearchResult { label: string; meta: string; route: string; icon: string; color: string }
const searchResults = ref<SearchResult[]>([])
const noResults     = ref(false)

function onAddressInput() {
  const q = addressInput.value.trim().toLowerCase()
  if (!q) { searchResults.value = []; noResults.value = false; return }
  if (!galaxyStore.isLoaded) { void galaxyStore.loadData(); return }

  const results: SearchResult[] = []
  const seenHosts = new Set<string>()

  for (const p of galaxyStore.planets) {
    if (results.length >= 8) break
    if (p.pl_name.toLowerCase().includes(q)) {
      results.push({
        label: p.pl_name,
        meta:  `${p.hostname} · ${p.sy_dist?.toFixed(0) ?? '?'} pc`,
        route: `/surface/${encodeURIComponent(p.hostname)}/${encodeURIComponent(p.pl_name)}`,
        icon: 'mdi-earth', color: 'cyan-5',
      })
      seenHosts.add(p.hostname)
    }
  }

  for (const [host, sys] of galaxyStore.systems) {
    if (results.length >= 8) break
    if (seenHosts.has(host)) continue
    if (host.toLowerCase().includes(q)) {
      const planet = sys.planets[0]
      if (planet) results.push({
        label: host,
        meta:  `${sys.planets.length} planet(s) · ${sys.sy_dist?.toFixed(0) ?? '?'} pc`,
        route: `/surface/${encodeURIComponent(host)}/${encodeURIComponent(planet.pl_name)}`,
        icon: 'scatter_plot', color: 'amber-6',
      })
    }
  }

  searchResults.value = results
  noResults.value     = results.length === 0
}

function navigateToFirst() {
  if (searchResults.value.length) navTo(searchResults.value[0]!.route)
}

function onBlur() {
  setTimeout(() => { searchFocused.value = false }, 150)
}

// ── Global auto-hide nav bar ───────────────────────────────────────────────────
// 'full'  — full EXOTOPIA bar visible
// 'slim'  — settlement location breadcrumb strip (settlement routes only)
// 'icons' — collapsed to 3 icons; bar hidden to expose the star field

const SETTLEMENT_ROUTES = new Set(['surface', 'dome-interior', 'cluster-surface'])

const isSettlementPage = computed(() => SETTLEMENT_ROUTES.has(route.name as string))
const showFullExoBar   = computed(() => barMode.value === 'full')

type BarMode = 'full' | 'slim' | 'icons'
const barMode = ref<BarMode>('full')
let autoHideTimer: ReturnType<typeof setTimeout> | null = null
let hoverPaused = false

function scheduleHide(delayMs = 5000) {
  if (autoHideTimer) clearTimeout(autoHideTimer)
  autoHideTimer = setTimeout(() => {
    if (!hoverPaused) barMode.value = 'icons'
  }, delayMs)
}

function showSlimStrip() {
  barMode.value = 'slim'
  scheduleHide(4500)
}

function showFullBar() {
  barMode.value = 'full'
  if (autoHideTimer) clearTimeout(autoHideTimer)
  const collapse = isSettlementPage.value
    ? () => { barMode.value = 'slim'; scheduleHide(4500) }
    : () => { barMode.value = 'icons' }
  autoHideTimer = setTimeout(collapse, isSettlementPage.value ? 7000 : 5000)
}

function collapseToSlim() {
  barMode.value = isSettlementPage.value ? 'slim' : 'icons'
  if (isSettlementPage.value) scheduleHide(4500)
}

function hideStripManually() {
  barMode.value = 'icons'
  if (autoHideTimer) clearTimeout(autoHideTimer)
}

function pauseAutoHide() { hoverPaused = true }

function resumeAutoHide() {
  hoverPaused = false
  scheduleHide(isSettlementPage.value ? 3000 : 4000)
}

function onIconsBarHover() {
  if (isSettlementPage.value) showSlimStrip()
  else { barMode.value = 'full'; scheduleHide(4000) }
}

watch(isSettlementPage, (v) => {
  if (autoHideTimer) clearTimeout(autoHideTimer)
  if (v) {
    barMode.value = 'slim'
    scheduleHide(4500)
  } else {
    barMode.value = 'full'
    scheduleHide(5000)
  }
}, { immediate: true })

// ── Settlement location breadcrumb ─────────────────────────────────────────────

interface BreadcrumbNode { label: string; route?: string }

const settlementBreadcrumb = computed((): BreadcrumbNode[] => {
  if (!isSettlementPage.value) return []
  const rName = route.name as string

  if (rName === 'surface' || rName === 'dome-interior') {
    const host   = String(route.params.hostname   ?? '')
    const planet = String(route.params.planetName ?? '')
    const parent = String(route.query.parent      ?? '')
    const nodes: BreadcrumbNode[] = [
      { label: 'Milky Way', route: '/galaxy' },
      { label: host,        route: `/galaxy?focusHost=${encodeURIComponent(host)}` },
      { label: planet },
    ]
    if (parent)                    nodes.push({ label: `Moon · ${parent}` })
    if (rName === 'dome-interior') nodes.push({ label: 'Interior' })
    return nodes
  }

  if (rName === 'cluster-surface') {
    const slug    = String(route.params.clusterSlug ?? '')
    const gid     = String(route.params.memberId    ?? '')
    const clName  = String(route.query.cluster      ?? slug)
    const sysName = String(route.query.name         ?? `System-${route.params.systemIdx}`)
    const nPl     = Number(route.query.planets      ?? 3)
    const sysIdx  = Number(route.params.systemIdx   ?? 0)
    const pIdx    = sysIdx % Math.max(1, nPl)
    const pLabel  = `Planet ${String.fromCharCode(98 + pIdx)}`
    const galLabel = gid.length > 16 ? `${gid.slice(0, 16)}…` : gid
    const isVoid   = slug.startsWith('void-')
    const topRoute = isVoid
      ? `/void/${encodeURIComponent(slug.slice(5))}`
      : `/clusters?cluster=${encodeURIComponent(slug)}`
    const galRoute = `/cluster-galaxy/${encodeURIComponent(slug)}/${encodeURIComponent(gid)}`
    return [
      { label: isVoid ? 'Void' : clName, route: topRoute },
      { label: galLabel, route: galRoute },
      { label: sysName },
      { label: pLabel },
    ]
  }

  return []
})
</script>

<style>
.exo-page-container { padding-top: 44px !important; }
</style>

<style scoped>

/* ── Top bar ────────────────────────────────────────────────────────────────── */

.exo-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 44px;
  z-index: 6100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(1, 3, 16, 0.97);
  border-bottom: 1px solid rgba(0, 100, 160, 0.10);
  backdrop-filter: blur(22px) saturate(140%);
  padding: 0 16px 0 12px;
  transition: border-bottom-color 0.5s ease;
}
.exo-bar--open {
  border-bottom-color: rgba(0, 160, 220, 0.18);
}

.exo-bar__left {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}

.exo-bar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

/* ── Logo ───────────────────────────────────────────────────────────────────── */

.exo-logo {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  padding: 0 12px 0 0;
  flex-shrink: 0;
  user-select: none;
}
.exo-logo:hover .ew-exo { color: #80e8f8; }

.exo-orb {
  width: 22px; height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 38% 38%, rgba(0,60,90,0.55) 0%, rgba(0,20,40,0.80) 100%);
  border: 1px solid rgba(0,140,180,0.28);
  box-shadow: inset 2px 2px 4px rgba(0,0,0,0.70), inset -1px -1px 2px rgba(0,180,220,0.12), 0 1px 4px rgba(0,0,0,0.50);
  color: rgba(0,120,160,0.70);
  text-shadow: 0 1px 0 rgba(0,210,255,0.50), 0 -1px 0 rgba(0,0,0,0.60);
  font-size: 10px; font-weight: 800;
}

.exo-wordmark { font-size: 12px; font-weight: 300; letter-spacing: 0.16em; white-space: nowrap; }
.ew-exo   { color: #4dd0e1; transition: color 0.13s; }
.ew-topia { color: #607d8b; }

.bar-divider {
  width: 1px; height: 20px;
  background: rgba(0, 120, 180, 0.20);
  margin: 0 4px;
  flex-shrink: 0;
}

/* ── Nav group tabs ─────────────────────────────────────────────────────────── */

.bar-groups {
  display: flex;
  align-items: stretch;
  height: 44px;
}

.bar-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 14px;
  background: none;
  border: none;
  border-bottom: 1px solid transparent;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: rgba(120, 165, 200, 0.55);
  transition: color 0.35s ease, border-color 0.35s ease, background 0.35s ease;
  white-space: nowrap;
}
.bar-group:hover {
  color: rgba(190, 225, 252, 0.85);
  background: rgba(0, 25, 55, 0.35);
}
.bar-group--active {
  color: rgba(77, 208, 225, 0.90);
  border-bottom-color: rgba(0, 200, 240, 0.40);
  background: rgba(0, 35, 65, 0.30);
}
.bar-group__chevron { opacity: 0.40; flex-shrink: 0; transition: opacity 0.30s; }
.bar-group--active .bar-group__chevron { opacity: 0.70; }
.bar-group:hover .bar-group__chevron { opacity: 0.60; }

/* ── Right side ─────────────────────────────────────────────────────────────── */

.bar-level {
  font-family: 'Courier New', monospace;
  font-size: 8.5px;
  letter-spacing: 0.14em;
  color: rgba(0, 180, 220, 0.40);
  white-space: nowrap;
  flex-shrink: 0;
}

.bar-wallet-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(60, 220, 120, 0.80);
  flex-shrink: 0;
}

/* ── Search ─────────────────────────────────────────────────────────────────── */

.bar-search-wrap {
  position: relative;
  width: 220px;
  flex-shrink: 0;
}

:deep(.bar-search-input) {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: rgba(180, 210, 230, 0.85);
}

.bar-results {
  position: absolute;
  top: calc(100% + 6px);
  left: 0; right: 0;
  background: rgba(1, 6, 22, 0.99);
  border: 1px solid rgba(0, 180, 255, 0.20);
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 200;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.65);
}
.bar-result {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  cursor: pointer;
  font-size: 11px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  transition: background 0.10s;
}
.bar-result:hover { background: rgba(0, 200, 255, 0.07); }
.bar-result__label { font-family: monospace; color: #90b8cc; flex: 1; }
.bar-result__meta  { font-size: 9.5px; color: #455a64; }
.bar-result--empty { color: #455a64; cursor: default; }
.bar-result--empty:hover { background: none; }

/* ── Mega panel ─────────────────────────────────────────────────────────────── */

.exo-mega {
  position: fixed;
  top: 44px; left: 0; right: 0;
  z-index: 6090;
  background:
    radial-gradient(ellipse 55% 120% at 18% 75%, rgba(0,60,130,0.13) 0%, transparent 55%),
    radial-gradient(ellipse 45% 100% at 82% 20%, rgba(80,0,180,0.10) 0%, transparent 55%),
    radial-gradient(ellipse 40% 80%  at 50% 95%, rgba(0,130,80,0.07) 0%, transparent 50%),
    rgba(1, 3, 14, 0.99);
  border-bottom: 1px solid rgba(0, 150, 200, 0.18);
  backdrop-filter: blur(24px);
  box-shadow: 0 14px 48px rgba(0, 0, 0, 0.65);
}

.mega-slide-enter-active { transition: opacity 0.38s ease, transform 0.38s cubic-bezier(0.22, 0.61, 0.36, 1); }
.mega-slide-leave-active  { transition: opacity 0.24s ease, transform 0.24s ease; }
.mega-slide-enter-from    { opacity: 0; transform: translateY(-10px); }
.mega-slide-leave-to      { opacity: 0; transform: translateY(-6px); }

/* ── Shared animated landscape background ────────────────────────────────── */

.mega-landscape {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.mega-landscape svg { display: block; width: 100%; height: 100%; }

/* ── Mega panel layout — left sidebar + right contextual panel ───────────────── */

.mega-twotrack {
  display: flex;
  min-height: 230px;
  position: relative;
  z-index: 1;
}

/* Left sidebar — labels only, reveals on hover */
.mega-sidebar {
  width: 196px;
  flex-shrink: 0;
  border-right: 1px solid rgba(0, 55, 105, 0.18);
  padding: 6px 0;
  display: flex;
  flex-direction: column;
  background: rgba(0, 3, 14, 0.86);
  backdrop-filter: blur(8px);
}

.msi-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px 9px 16px;
  background: none;
  border: none;
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background 0.22s ease, border-color 0.22s ease;
  min-width: 0;
}
.msi-item:hover,
.msi-item--active {
  background: rgba(0, 14, 44, 0.60);
  border-left-color: var(--ac, rgba(0, 200, 255, 0.70));
}

.msi-label {
  font-family: 'Courier New', monospace;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: rgba(120, 170, 210, 0.52);
  transition: color 0.22s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.msi-item:hover .msi-label,
.msi-item--active .msi-label {
  color: var(--ac, rgba(0, 210, 255, 0.88));
}

.msi-chevron {
  font-size: 13px;
  color: rgba(100, 155, 200, 0.28);
  flex-shrink: 0;
  transform: translateX(0);
  transition: transform 0.18s ease, color 0.18s ease;
}
.msi-item:hover .msi-chevron,
.msi-item--active .msi-chevron {
  transform: translateX(3px);
  color: var(--ac, rgba(0, 200, 255, 0.60));
}

/* Right contextual area */
.mega-panel-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 230px;
}

/* Default banner — transparent overlay, landscape shows through */
.map-banner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 0 10px 18px;
  overflow: hidden;
  /* gradient footer to anchor the text labels */
  background: linear-gradient(to bottom, transparent 55%, rgba(0, 2, 14, 0.45) 100%);
}

.map-banner-label {
  position: relative;
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.22em;
  color: rgba(140, 195, 230, 0.28);
  text-transform: uppercase;
  pointer-events: none;
}
.map-banner-hint {
  position: relative;
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.14em;
  color: rgba(100, 155, 195, 0.18);
  margin-top: 4px;
  pointer-events: none;
}

/* Contextual content panel */
.map-content {
  position: absolute;
  inset: 0;
  padding: 24px 32px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-left: 2px solid rgba(0, 180, 255, 0.18);
  background: rgba(0, 8, 28, 0.72);
}

/* Style variants */
.map-content--cosmic  { background: rgba(0, 4, 24, 0.82); border-left-color: rgba(60, 160, 255, 0.30); }
.map-content--search  { background: rgba(0, 6, 20, 0.80); border-left-color: rgba(120, 100, 255, 0.28); }
.map-content--surface { background: rgba(0, 16, 10, 0.82); border-left-color: rgba(0, 210, 120, 0.28); }
.map-content--deed    { background: rgba(12, 6, 0, 0.84); border-left-color: rgba(255, 160, 40, 0.30); }
.map-content--gallery { background: rgba(8, 0, 20, 0.82); border-left-color: rgba(200, 80, 255, 0.30); }
.map-content--eco     { background: rgba(0, 14, 6, 0.82); border-left-color: rgba(80, 220, 80, 0.28); }
.map-content--quiz    { background: rgba(0, 8, 24, 0.80); border-left-color: rgba(0, 190, 240, 0.28); }
.map-content--chain   { background: rgba(4, 0, 20, 0.82); border-left-color: rgba(180, 80, 255, 0.30); }
.map-content--docs    { background: rgba(0, 6, 18, 0.80); border-left-color: rgba(100, 160, 255, 0.25); }
.map-content--data    { background: rgba(0, 10, 16, 0.80); border-left-color: rgba(0, 200, 200, 0.28); }
.map-content--coords  { background: rgba(6, 0, 20, 0.80); border-left-color: rgba(200, 160, 60, 0.28); }
.map-content--onboard { background: rgba(0, 12, 8, 0.82); border-left-color: rgba(60, 220, 160, 0.30); }

/* Subtle texture overlays */
.map-content--deed::before,
.map-content--docs::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.04;
}
.map-content--deed::before {
  background: repeating-linear-gradient(0deg, rgba(255,160,40,0.8) 0px, transparent 1px, transparent 18px);
}
.map-content--docs::before {
  background:
    repeating-linear-gradient(0deg, rgba(100,160,255,0.6) 0px, transparent 1px, transparent 22px),
    repeating-linear-gradient(90deg, rgba(100,160,255,0.4) 0px, transparent 1px, transparent 40px);
}

.map-head { display: flex; flex-direction: column; gap: 5px; }

.map-headline {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(0, 210, 255, 0.90);
  line-height: 1.2;
}
.map-content--cosmic  .map-headline { color: rgba(80, 180, 255, 0.92); }
.map-content--search  .map-headline { color: rgba(160, 130, 255, 0.90); }
.map-content--surface .map-headline { color: rgba(60, 220, 140, 0.90); }
.map-content--deed    .map-headline { color: rgba(255, 175, 60, 0.90); }
.map-content--gallery .map-headline { color: rgba(210, 100, 255, 0.90); }
.map-content--eco     .map-headline { color: rgba(100, 230, 100, 0.90); }
.map-content--quiz    .map-headline { color: rgba(0, 200, 245, 0.90); }
.map-content--chain   .map-headline { color: rgba(190, 110, 255, 0.90); }
.map-content--docs    .map-headline { color: rgba(120, 175, 255, 0.90); }
.map-content--data    .map-headline { color: rgba(0, 210, 210, 0.90); }
.map-content--coords  .map-headline { color: rgba(215, 175, 80, 0.90); }
.map-content--onboard .map-headline { color: rgba(80, 230, 180, 0.90); }

.map-subline {
  font-size: 10px;
  color: rgba(110, 160, 200, 0.55);
  line-height: 1.55;
}

/* Session data chip */
.map-session {
  display: flex;
  align-items: center;
  gap: 8px;
}
.map-session-label {
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  letter-spacing: 0.12em;
  color: rgba(90, 140, 185, 0.48);
  text-transform: uppercase;
  flex-shrink: 0;
}
.map-session-value {
  font-family: 'Courier New', monospace;
  font-size: 8.5px;
  color: rgba(160, 210, 240, 0.65);
  background: rgba(0, 60, 120, 0.18);
  border: 1px solid rgba(0, 120, 200, 0.16);
  border-radius: 3px;
  padding: 1px 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

/* Input field */
.map-field-wrap { display: flex; }
.map-field {
  font-family: 'Courier New', monospace;
  font-size: 9.5px;
  letter-spacing: 0.04em;
  color: rgba(180, 215, 240, 0.85);
  background: rgba(0, 10, 32, 0.65);
  border: 1px solid rgba(0, 140, 200, 0.22);
  border-radius: 3px;
  padding: 6px 10px;
  outline: none;
  width: 100%;
  transition: border-color 0.20s ease;
}
.map-field::placeholder { color: rgba(80, 130, 175, 0.40); }
.map-field:focus { border-color: rgba(0, 200, 255, 0.50); }
.map-content--deed    .map-field:focus { border-color: rgba(255, 160, 40, 0.45); }
.map-content--gallery .map-field:focus { border-color: rgba(200, 80, 255, 0.45); }
.map-content--coords  .map-field:focus { border-color: rgba(215, 175, 80, 0.45); }

/* Action buttons */
.map-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
}
.map-action {
  font-family: 'Courier New', monospace;
  font-size: 8.5px;
  letter-spacing: 0.09em;
  padding: 5px 13px;
  background: rgba(0, 30, 70, 0.45);
  border: 1px solid rgba(0, 110, 180, 0.22);
  border-radius: 3px;
  color: rgba(130, 185, 225, 0.70);
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.map-action:hover { background: rgba(0, 40, 90, 0.65); color: rgba(180, 220, 248, 0.88); }

.map-action--primary {
  background: rgba(0, 100, 180, 0.30);
  border-color: rgba(0, 180, 255, 0.35);
  color: rgba(0, 210, 255, 0.90);
}
.map-action--primary:hover { background: rgba(0, 120, 200, 0.45); }

.map-content--surface .map-action--primary { background: rgba(0,140,80,0.28); border-color: rgba(0,210,120,0.35); color: rgba(60,230,140,0.90); }
.map-content--surface .map-action--primary:hover { background: rgba(0,160,90,0.40); }
.map-content--deed    .map-action--primary { background: rgba(140,80,0,0.28); border-color: rgba(255,160,40,0.35); color: rgba(255,180,70,0.90); }
.map-content--deed    .map-action--primary:hover { background: rgba(160,90,0,0.40); }
.map-content--gallery .map-action--primary { background: rgba(100,0,160,0.28); border-color: rgba(200,80,255,0.35); color: rgba(215,110,255,0.90); }
.map-content--gallery .map-action--primary:hover { background: rgba(110,0,175,0.40); }
.map-content--eco     .map-action--primary { background: rgba(0,120,0,0.28); border-color: rgba(80,220,80,0.35); color: rgba(110,235,110,0.90); }
.map-content--eco     .map-action--primary:hover { background: rgba(0,140,0,0.40); }
.map-content--search  .map-action--primary { background: rgba(80,40,160,0.28); border-color: rgba(150,110,255,0.35); color: rgba(175,145,255,0.90); }
.map-content--search  .map-action--primary:hover { background: rgba(90,50,175,0.40); }
.map-content--chain   .map-action--primary { background: rgba(100,0,160,0.28); border-color: rgba(180,80,255,0.35); color: rgba(200,110,255,0.90); }
.map-content--chain   .map-action--primary:hover { background: rgba(110,0,175,0.40); }
.map-content--data    .map-action--primary { background: rgba(0,100,100,0.28); border-color: rgba(0,200,200,0.35); color: rgba(0,220,220,0.90); }
.map-content--data    .map-action--primary:hover { background: rgba(0,120,120,0.40); }
.map-content--coords  .map-action--primary { background: rgba(120,90,0,0.28); border-color: rgba(215,175,60,0.35); color: rgba(225,190,80,0.90); }
.map-content--coords  .map-action--primary:hover { background: rgba(140,105,0,0.40); }
.map-content--quiz    .map-action--primary { background: rgba(0,100,140,0.28); border-color: rgba(0,190,240,0.35); color: rgba(0,210,250,0.90); }
.map-content--quiz    .map-action--primary:hover { background: rgba(0,115,160,0.40); }
.map-content--onboard .map-action--primary { background: rgba(0,120,80,0.28); border-color: rgba(60,220,160,0.35); color: rgba(80,235,175,0.90); }
.map-content--onboard .map-action--primary:hover { background: rgba(0,140,95,0.40); }
.map-content--docs    .map-action--primary { background: rgba(40,80,180,0.28); border-color: rgba(100,160,255,0.35); color: rgba(130,185,255,0.90); }
.map-content--docs    .map-action--primary:hover { background: rgba(50,95,200,0.40); }

/* Panel swap transition */
.panel-swap-enter-active { transition: opacity 0.20s ease, transform 0.20s ease; }
.panel-swap-leave-active  { transition: opacity 0.12s ease, transform 0.12s ease; }
.panel-swap-enter-from    { opacity: 0; transform: translateX(10px); }
.panel-swap-leave-to      { opacity: 0; transform: translateX(-6px); }

/* ── Explore: landscape spacer + horizontal card band ────────────────────── */

.mega-fb-layout {
  display: flex;
  flex-direction: column;
  min-height: 220px;
  position: relative;
  z-index: 1;
}

/* Transparent top area — landscape shows through here */
.mega-fb-spacer {
  flex: 1;
  display: flex;
  align-items: flex-end;
  padding: 0 0 10px 18px;
  pointer-events: none;
}

.mega-fb-label {
  font-family: 'Courier New', monospace;
  font-size: 6.5px;
  letter-spacing: 0.24em;
  color: rgba(150, 205, 238, 0.30);
  text-transform: uppercase;
}

/* Dark card band at the bottom — readable over landscape */
.mega-fb-cards {
  display: flex;
  background: rgba(0, 3, 16, 0.84);
  border-top: 1px solid rgba(0, 55, 110, 0.18);
  backdrop-filter: blur(6px);
}

.mega-fb-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 16px 14px;
  cursor: pointer;
  background: none;
  border: none;
  border-right: 1px solid rgba(0, 45, 95, 0.12);
  text-align: left;
  transition: background 0.28s ease;
  --ac: rgba(0, 200, 255, 0.85);
  min-width: 0;
}
.mega-fb-card:last-child { border-right: none; }
.mega-fb-card:hover { background: rgba(0, 16, 48, 0.55); }

.mega-fbc-title {
  font-family: 'Courier New', monospace;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: var(--ac);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.mega-fbc-desc {
  font-size: 8px;
  color: rgba(105, 158, 200, 0.58);
  line-height: 1.60;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Participate: art-immersion panel ───────────────────────────────────── */

.map-art-panel {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.map-art-panel svg {
  position: absolute;
  inset: 0;
  transition: filter 0.40s ease;
}

.map-art-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 18px 14px;
  background: linear-gradient(
    to bottom,
    rgba(0, 2, 14, 0.06) 0%,
    transparent 38%,
    rgba(0, 2, 14, 0.60) 100%
  );
}

.map-art-caption {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.22em;
  color: rgba(180, 215, 245, 0.34);
  text-transform: uppercase;
  pointer-events: none;
}

.map-art-action-zone {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.map-art-session {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.06em;
  color: rgba(150, 200, 230, 0.52);
  background: rgba(0, 20, 55, 0.55);
  border: 1px solid rgba(0, 100, 180, 0.18);
  border-radius: 3px;
  padding: 2px 8px;
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

.map-art-cta {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.10em;
  padding: 6px 18px;
  background: rgba(0, 8, 26, 0.76);
  border: 1px solid rgba(0, 175, 245, 0.38);
  border-radius: 3px;
  color: rgba(0, 215, 255, 0.92);
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}
.map-art-cta:hover {
  background: rgba(0, 30, 72, 0.88);
  border-color: rgba(0, 210, 255, 0.58);
  color: rgba(120, 235, 255, 0.98);
}

/* ── Explore: cinematic observatory overlay ─────────────────────────────────── */

.mega-explore-cin {
  position: relative;
  min-height: 295px;
  overflow: hidden;
  background: #010612;
}

.mecin-svg {
  display: block;
  width: 100%;
  height: 295px;
  animation: mecin-enter 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

@keyframes mecin-enter {
  from { transform: scale(1.045); opacity: 0; }
  to   { transform: scale(1);     opacity: 1; }
}

/* Floating glass nav overlay — positioned absolute over scene */
.mecin-nav {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 212px;
  background: rgba(1, 4, 20, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-right: 1px solid rgba(0, 120, 200, 0.14);
  display: flex;
  flex-direction: column;
  padding: 14px 0 10px;
  z-index: 2;
}

.mecin-nav-eyebrow {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.20em;
  color: rgba(0, 200, 255, 0.40);
  padding: 0 16px 12px;
  border-bottom: 1px solid rgba(0, 120, 200, 0.10);
  margin-bottom: 4px;
}

.mecin-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 10px 16px;
  background: none;
  border: none;
  border-left: 2px solid transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.22s, border-color 0.22s;
  min-width: 0;
}

.mecin-item:hover,
.mecin-item--active {
  background: rgba(0, 14, 48, 0.55);
  border-left-color: var(--ac, rgba(0, 200, 255, 0.70));
}

.mecin-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mecin-item-title {
  font-family: 'Courier New', monospace;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgba(120, 170, 212, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.22s;
}

.mecin-item:hover .mecin-item-title,
.mecin-item--active .mecin-item-title {
  color: var(--ac, rgba(0, 212, 255, 0.92));
}

.mecin-item-desc {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(100, 148, 188, 0.38);
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.22s;
}

.mecin-item:hover .mecin-item-desc,
.mecin-item--active .mecin-item-desc {
  color: rgba(160, 210, 240, 0.60);
}

.mecin-item-arrow {
  font-size: 14px;
  color: rgba(100, 155, 202, 0.28);
  flex-shrink: 0;
  transform: translateX(0);
  transition: transform 0.18s, color 0.18s;
}

.mecin-item:hover .mecin-item-arrow,
.mecin-item--active .mecin-item-arrow {
  transform: translateX(3px);
  color: var(--ac, rgba(0, 200, 255, 0.65));
}

/* Star twinkle animation (used in both explore and participate scenes) */
.mecin-twinkle {
  animation: mecin-twink 3.8s ease-in-out infinite;
}
.mecin-twinkle:nth-child(3n)   { animation-delay: -1.2s; animation-duration: 4.5s; }
.mecin-twinkle:nth-child(3n+1) { animation-delay: -2.5s; animation-duration: 3.2s; }

@keyframes mecin-twink {
  0%, 100% { opacity: var(--so, 0.85); }
  48%       { opacity: calc(var(--so, 0.85) * 0.28); }
}

/* ── Participate: settlement exterior scene panel ───────────────────────────── */

.psp-panel {
  position: relative;
  overflow: hidden;
}

.psp-svg {
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

/* ── Backdrop ───────────────────────────────────────────────────────────────── */

.exo-backdrop {
  position: fixed;
  inset: 0;
  z-index: 6080;
  background: rgba(0, 0, 0, 0.30);
  backdrop-filter: blur(1px);
}

/* ── Shared visualization canvas ─────────────────────────────────────────────
   Sits below all UI (z-index 0). Visualization pages render into this via the
   useVizRenderer singleton. Non-viz pages render on top with opaque backgrounds.
   The canvas is always in the DOM — pages show/hide it as needed.           */

.viz-canvas-root {
  position: fixed;
  top: 44px;   /* nav bar height */
  left: 0;
  width: 100vw;
  height: calc(100vh - 44px);
  z-index: 0;
  display: block;
  pointer-events: none;  /* pages add their own canvas listeners */
}

.webgl-fallback {
  position: fixed;
  top: 44px;
  left: 0;
  width: 100vw;
  height: calc(100vh - 44px);
  z-index: 1;
  background: #010208;
  font-family: 'Courier New', monospace;
  padding: 24px;
}

/* ── Collapsed icon bar (home · search · hamburger) ─────────────────────────── */

.exo-icons-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 40px;
  z-index: 6200;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 2px;
  background: rgba(0, 2, 14, 0.22);
  backdrop-filter: blur(3px);
  cursor: default;
  transition: background 0.3s ease;
}
.exo-icons-bar:hover {
  background: rgba(0, 4, 20, 0.55);
}

.exo-icon-btn {
  background: none;
  border: none;
  color: rgba(90, 150, 200, 0.50);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 5px;
  transition: color 0.15s ease, background 0.15s ease;
}
.exo-icon-btn:hover {
  color: rgba(0, 210, 255, 0.96);
  background: rgba(0, 60, 110, 0.32);
}

.exo-icon-burger {
  font-size: 18px;
  line-height: 1;
}

/* ── Settlement slim location strip ─────────────────────────────────────────── */

.settle-strip {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 32px;
  z-index: 6200;
  display: flex;
  align-items: center;
  background: rgba(0, 4, 18, 0.86);
  border-bottom: 1px solid rgba(0, 80, 140, 0.18);
  backdrop-filter: blur(16px) saturate(130%);
  padding: 0 8px 0 4px;
}

.settle-burger,
.settle-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: rgba(90, 150, 200, 0.65);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  font-size: 17px;
  line-height: 1;
  transition: color 0.15s ease, background 0.15s ease;
}
.settle-burger:hover,
.settle-close:hover {
  color: rgba(0, 210, 255, 0.95);
  background: rgba(0, 80, 140, 0.22);
}

.settle-crumbs {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  padding: 0 6px;
}

.settle-sep {
  color: rgba(50, 110, 155, 0.45);
  font-size: 11px;
  padding: 0 4px;
  flex-shrink: 0;
}

.settle-crumb {
  font-family: 'Courier New', monospace;
  font-size: 10.5px;
  letter-spacing: 0.05em;
  color: rgba(110, 165, 210, 0.58);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  flex-shrink: 1;
}
.settle-crumb--current {
  color: rgba(0, 210, 255, 0.88);
}
.settle-crumb--link {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease;
}
.settle-crumb--link:hover {
  color: rgba(0, 230, 255, 0.98);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.settle-hover-zone {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 5px;
  z-index: 6200;
  cursor: default;
}

/* Full bar raised above settle-strip when shown on settlement pages */
.exo-bar--settlement {
  z-index: 6300;
}

/* X button inside the full bar (settlement pages only) */
.settle-bar-x {
  flex-shrink: 0;
  background: none;
  border: none;
  color: rgba(100, 150, 200, 0.55);
  cursor: pointer;
  font-size: 12px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  margin-left: 2px;
  transition: color 0.15s ease, background 0.15s ease;
}
.settle-bar-x:hover {
  color: rgba(220, 90, 90, 0.92);
  background: rgba(200, 50, 50, 0.12);
}

/* Slide-down enter / slide-up leave */
.settle-strip-enter-active,
.settle-strip-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.settle-strip-enter-from,
.settle-strip-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

/* ── Mobile hamburger button ─────────────────────────────────────────────── */

.bar-mob-burger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  flex-shrink: 0;
  transition: background 0.15s ease;
}
.bar-mob-burger:hover { background: rgba(0, 80, 140, 0.25); }
.bar-mob-burger-icon {
  font-size: 19px;
  color: rgba(140, 185, 215, 0.80);
  line-height: 1;
  user-select: none;
}

/* ── Mobile nav overlay ──────────────────────────────────────────────────── */

.exo-mob-menu {
  position: fixed;
  inset: 0;
  z-index: 6500;
  background: rgba(0, 2, 12, 0.96);
  backdrop-filter: blur(22px) saturate(130%);
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
}

.mob-menu-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.mob-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(0, 80, 130, 0.22);
  flex-shrink: 0;
}

.mob-menu-title {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  color: rgba(0, 180, 220, 0.55);
  text-transform: uppercase;
}

.mob-menu-close {
  background: none;
  border: none;
  color: rgba(120, 170, 210, 0.65);
  font-size: 16px;
  cursor: pointer;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  transition: color 0.15s ease, background 0.15s ease;
}
.mob-menu-close:hover {
  color: rgba(220, 80, 80, 0.90);
  background: rgba(200, 40, 40, 0.12);
}

.mob-nav-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 6px 0;
}

.mob-nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(0, 55, 100, 0.14);
  cursor: pointer;
  text-align: left;
  min-height: 60px;
  width: 100%;
  transition: background 0.14s ease;
}
.mob-nav-item:active { background: rgba(0, 50, 90, 0.60); }

.mob-nav-icon {
  font-size: 22px;
  flex-shrink: 0;
  width: 28px;
  text-align: center;
}

.mob-nav-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mob-nav-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(200, 230, 250, 0.92);
  text-align: left;
}

.mob-nav-sub {
  font-size: 10px;
  color: rgba(80, 140, 180, 0.52);
  letter-spacing: 0.03em;
  text-align: left;
}

.mob-menu-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 80, 130, 0.18);
  flex-shrink: 0;
}

.mob-menu-enter-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.mob-menu-leave-active { transition: opacity 0.16s ease, transform 0.16s ease; }
.mob-menu-enter-from   { opacity: 0; transform: translateY(-6px); }
.mob-menu-leave-to     { opacity: 0; transform: translateY(-4px); }

/* ── Responsive breakpoints ──────────────────────────────────────────────── */

@media (max-width: 640px) {
  .bar-groups,
  .bar-search-wrap,
  .bar-level    { display: none !important; }
  .bar-divider  { display: none; }
  .exo-logo     { padding-right: 0; }
  .bar-mob-burger { display: flex; }
}
</style>
