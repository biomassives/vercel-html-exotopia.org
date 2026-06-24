<template>
  <!-- Transparent overlay — shared Three.js canvas in MainLayout renders behind -->
  <q-page class="viz-overlay-page"
    @mousemove="onHover"
    @mouseleave="clearHover"
    @touchmove.passive="onTouchMove"
    @click="onClick"
    @dblclick="onDblClick"
  >

    <!-- ── Milky Way entry fade overlay ────────────────────────────── -->
    <Transition name="mw-fade">
      <div v-if="enteringMW" class="mw-entry-overlay" />
    </Transition>

    <!-- ── Floating cluster / void name labels ──────────────────────── -->
    <div class="labels-layer">
      <div
        v-for="lbl in clusterLabels"
        :key="lbl.name"
        v-show="lbl.visible"
        class="cluster-label"
        :style="{
          left: lbl.x + 'px',
          top:  lbl.y + 'px',
          '--sc-color': lbl.scColor,
        }"
      >
        <div class="cl-name">{{ lbl.name }}</div>
        <div v-if="lbl.supercluster" class="cl-super">{{ lbl.supercluster }}</div>
      </div>

      <!-- Sub-cluster / BCG labels — tracked sprites projected to screen -->
      <div
        v-for="(lbl, i) in subclusterLabels"
        :key="'sc' + i"
        class="subcluster-label"
        :style="{ left: lbl.x + 'px', top: lbl.y + 'px', color: lbl.color }"
      >{{ lbl.text }}</div>
    </div>

    <!-- ── Proposed zone panel ─────────────────────────────────────────── -->
    <Transition name="propose-fade">
      <div
        v-if="showProposePanel"
        class="propose-panel"
        :style="proposalPanelStyle"
      >
        <div class="propose-header">
          <span class="propose-icon">◌</span>
          UNCHARTED ZONE
          <button class="propose-close" @click="showProposePanel = false">✕</button>
        </div>

        <div class="propose-field">
          <div class="propose-label">ZONE NAME</div>
          <input
            v-model="draftZone.name"
            class="propose-input"
            :placeholder="autoZoneName()"
            maxlength="24"
          />
        </div>

        <div class="propose-field">
          <div class="propose-label">PLANET TYPE</div>
          <div class="propose-types">
            <button
              v-for="pt in (['rocky','super-earth','gas','ice'] as PlanetType[])"
              :key="pt"
              class="propose-type-btn"
              :class="{ active: draftZone.planetType === pt }"
              @click="draftZone.planetType = pt"
            >{{ pt }}</button>
          </div>
        </div>

        <div class="propose-field">
          <div class="propose-label">ORBIT RADIUS — {{ draftZone.orbRadiusSu.toFixed(2) }} su</div>
          <input
            v-model.number="draftZone.orbRadiusSu"
            type="range" min="0.05" max="0.70" step="0.01"
            class="propose-slider"
          />
          <div class="propose-range-hints"><span>tight</span><span>wide</span></div>
        </div>

        <div class="propose-actions">
          <button class="propose-btn propose-btn--primary" @click="commitProposal()">
            ⊙ Render path &amp; zoom
          </button>
          <button
            class="propose-btn propose-btn--secondary"
            @click="() => { if(_proposalClickWorld) { const z = proposedZones.at(-1); if(z) claimAsTheoreticalNft(z) } }"
            :disabled="!proposedZones.length"
          >
            ◇ Claim Frontier NFT
          </button>
          <button class="propose-btn propose-btn--ghost" @click="() => { clearProposalRings(); showProposePanel = false }">
            Clear all paths
          </button>
        </div>

        <div class="propose-note">
          Uncharted — no catalog data. Path is theoretical.
        </div>
      </div>
    </Transition>

    <!-- Level badge -->
    <!-- ── Contextual left-side info panel ──────────────────────────────── -->
    <div class="ctx-panel">

      <!-- Level header — click to expand/collapse panel body -->
      <div class="ctx-header ctx-header--toggle" @click="panelCollapsed = !panelCollapsed">
        <span class="ctx-icon">◈</span>
        <span class="ctx-headline">{{ contextLevelLabel }}</span>
        <span class="ctx-l1">L1</span>
        <span class="ctx-chevron" :class="{ 'ctx-chevron--open': !panelCollapsed }">▶</span>
      </div>

      <!-- ── Collapsible panel body ─────────────────────────────────── -->
      <div v-if="!panelCollapsed" class="ctx-panel-body">

      <!-- ── OVERVIEW ──────────────────────────────────────────────────── -->
      <template v-if="contextLevel === 'overview'">
        <div class="ctx-body">
          <div class="ctx-line">Galaxy clusters · Great voids</div>
          <div class="ctx-line">Wormhole conduit network</div>
          <div class="ctx-div" />
          <div class="ctx-row"><span class="ctx-k">Scale</span><span class="ctx-v">1 unit ≈ 15 Mpc</span></div>
          <div class="ctx-row"><span class="ctx-k">Clusters</span><span class="ctx-v">{{ CLUSTERS.length - 1 }}</span></div>
          <div class="ctx-row">
            <span class="ctx-k">Confirmed worlds</span>
            <span class="ctx-v text-cyan-5">{{ galaxyStore.isLoaded ? galaxyStore.planets.length.toLocaleString() : '…' }}</span>
          </div>
        </div>
      </template>

      <!-- ── SELECTED — named cluster ──────────────────────────────────── -->
      <template v-else-if="contextLevel === 'selected' && selected">
        <div class="ctx-body">
          <div v-if="selected.supercluster" class="ctx-sc" :style="{ color: selected.scColor }">
            {{ selected.supercluster }} Supercluster
          </div>
          <div class="ctx-div" />
          <div v-for="(val, key) in selected.details" :key="key" class="ctx-row">
            <span class="ctx-k">{{ key }}</span>
            <span class="ctx-v">{{ val }}</span>
          </div>
          <div class="ctx-div" />
          <q-btn dense unelevated size="xs" color="cyan-8" class="full-width q-mb-xs"
            icon="mdi-view-dashboard" label="Browse Cluster Galaxies"
            @click="navigateToClusterInterior()" />
          <q-btn flat dense size="xs" color="blue-grey-5" class="full-width"
            icon="mdi-telescope" label="Fly in (cosmic view)"
            @click="enterCluster()" />
        </div>
      </template>

      <!-- ── X-RAY CLUSTER ─────────────────────────────────────────────── -->
      <template v-else-if="contextLevel === 'xray' && selected">
        <div class="ctx-body">
          <div v-for="(val, key) in selected.details" :key="key" class="ctx-row">
            <span class="ctx-k">{{ key }}</span>
            <span class="ctx-v">{{ val }}</span>
          </div>
          <div class="ctx-div" />
          <q-btn dense unelevated size="xs" color="cyan-8" class="full-width q-mb-xs"
            icon="mdi-view-dashboard" label="Browse Cluster Galaxies"
            @click="navigateToXCluster()" />
          <template v-if="nearestSystemHost">
            <div class="ctx-div" />
            <div class="ctx-row">
              <span class="ctx-k">Nearest system</span>
              <span class="ctx-v text-cyan-5">{{ nearestSystemHost }}</span>
            </div>
            <div class="ctx-row ctx-settle-hint">
              <span class="ctx-k">Status</span>
              <span class="ctx-v text-amber-5">Available to settle</span>
            </div>
            <div class="ctx-div" />
            <div class="row q-gutter-xs">
              <q-btn dense unelevated size="xs" color="blue-grey-8" style="flex:1"
                icon="mdi-rocket-launch" label="Enter System"
                @click="enterXraySystem()" />
              <q-btn dense outline size="xs" color="amber-7" style="flex:1"
                icon="mdi-map-marker-plus" label="Settle"
                @click="$router.push('/mint')" />
            </div>
          </template>
        </div>
      </template>

      <!-- ── WORMHOLE CONDUIT ──────────────────────────────────────────── -->
      <template v-else-if="contextLevel === 'conduit' && selected">
        <div class="ctx-body">
          <div v-for="(val, key) in selected.details" :key="key" class="ctx-row">
            <span class="ctx-k">{{ key }}</span>
            <span class="ctx-v">{{ val }}</span>
          </div>
          <div class="ctx-div" />
          <div class="ctx-line" style="color:rgba(0,229,255,0.55)">
            Void-edge transit — unlimited range
          </div>
        </div>
      </template>

      <!-- ── COSMIC VOID ────────────────────────────────────────────────── -->
      <template v-else-if="contextLevel === 'void' && selected">
        <div class="ctx-body">
          <div v-for="(val, key) in selected.details" :key="key" class="ctx-row">
            <span class="ctx-k">{{ key }}</span>
            <span class="ctx-v">{{ val }}</span>
          </div>
          <div class="ctx-div" />
          <q-btn
            dense unelevated size="xs" color="blue-grey-8" class="full-width q-mb-xs"
            icon="mdi-circle-outline" label="Enter Void Interior"
            @click="navigateToVoid()"
          />
          <div class="ctx-line" style="color:rgba(100,130,170,0.55);font-size:9px">
            One of the largest known structures in the universe
          </div>
        </div>
      </template>

      <!-- ── CLUSTER INTERIOR ────────────────────────────────────────────── -->
      <template v-else-if="contextLevel === 'cluster_interior' && activeCluster">
        <div class="ctx-body">
          <!-- Zoom depth arc -->
          <div class="cluster-depth-wrap">
            <svg viewBox="0 0 48 48" class="cluster-depth-svg">
              <circle cx="24" cy="24" r="19" class="cdepth-track" />
              <circle cx="24" cy="24" r="19" class="cdepth-fill"
                :style="{ strokeDashoffset: 119.4 * (1 - activeCluster.zoomDepth) }"
              />
            </svg>
            <div class="cdepth-label">
              <div class="cdepth-pct">{{ Math.round(activeCluster.zoomDepth * 100) }}</div>
              <div class="cdepth-unit">%</div>
            </div>
          </div>
          <div class="cdepth-desc">CLUSTER DEPTH</div>

          <div class="ctx-div" />
          <div class="ctx-row">
            <span class="ctx-k">Distance</span>
            <span class="ctx-v">{{ activeCluster.distMpc.toFixed(1) }} Mpc</span>
          </div>
          <div v-if="activeCluster.tapKev" class="ctx-row">
            <span class="ctx-k">X-ray temp</span>
            <span class="ctx-v">{{ activeCluster.tapKev }} keV</span>
          </div>
          <div class="ctx-row">
            <span class="ctx-k">Richness</span>
            <span class="ctx-v">{{ activeCluster.richness }} / 10</span>
          </div>
          <div class="ctx-row">
            <span class="ctx-k">Visible galaxies</span>
            <span class="ctx-v text-cyan-5">{{ activeCluster.memberCount }}</span>
          </div>
          <div v-if="activeCluster.hasSubcluster" class="ctx-row">
            <span class="ctx-k">Structure</span>
            <span class="ctx-v text-amber-5">Sub-cluster</span>
          </div>

          <!-- Morphology distribution bars -->
          <template v-if="activeCluster.morphBars.length">
            <div class="ctx-div" />
            <div class="ctx-path-lbl" style="margin-bottom:5px">MORPHOLOGY MIX</div>
            <div v-for="bar in activeCluster.morphBars" :key="bar.label" class="morph-row">
              <span class="morph-lbl">{{ bar.label }}</span>
              <div class="morph-track">
                <div class="morph-fill" :style="{ width: bar.pct + '%', background: bar.color }" />
              </div>
              <span class="morph-pct">{{ bar.pct }}%</span>
            </div>
          </template>

          <div class="ctx-div" />
          <div class="row q-gutter-xs">
            <!-- Named cluster: go to cluster interior (member galaxy list) -->
            <q-btn v-if="!activeCluster.isXray" dense unelevated size="xs" color="cyan-8" style="flex:1"
              icon="mdi-view-dashboard" label="Browse Cluster Galaxies"
              @click="navigateToClusterInterior()" />
            <!-- X-ray cluster or cluster member selected: browse star systems -->
            <q-btn v-else dense unelevated size="xs" color="cyan-8" style="flex:1"
              icon="mdi-telescope" label="Browse Star Systems"
              @click="selected?.isClusterMember
                ? $router.push({ path: `/cluster-galaxy/${clusterSlug(selected.memberClusterName ?? '')}/${encodeURIComponent(selected.memberId ?? selected.memberName ?? selected.name)}`, query: { morph: selected.memberMorph ?? 'E' } })
                : $router.push('/galaxy')" />
          </div>
        </div>
      </template>

      <!-- ── MILKY WAY / LOCAL GROUP ───────────────────────────────────── -->
      <template v-else-if="contextLevel === 'milkyway' || contextLevel === 'nearby'">
        <div class="ctx-body">
          <div class="ctx-line">Solar neighbourhood · Local Group</div>
          <div class="ctx-div" />
          <div class="ctx-row">
            <span class="ctx-k">Confirmed worlds</span>
            <span class="ctx-v text-cyan-5">{{ galaxyStore.isLoaded ? galaxyStore.planets.length.toLocaleString() : '…' }}</span>
          </div>
          <div class="ctx-row">
            <span class="ctx-k">Star systems</span>
            <span class="ctx-v">{{ galaxyStore.isLoaded ? galaxyStore.systems.size.toLocaleString() : '…' }}</span>
          </div>
          <div class="ctx-div" />
          <q-btn dense unelevated size="xs" color="amber-8" class="full-width"
            icon="scatter_plot" label="Milky Way Map"
            @click="$router.push('/galaxy')" />
        </div>
      </template>

      <!-- ── Navigation pathway (always shown) ────────────────────────── -->
      <div class="ctx-pathway">
        <div class="ctx-path-lbl">NAVIGATION PATH</div>
        <div class="ctx-steps">
          <span class="ctx-step ctx-step--active">COSMIC</span>
          <span class="ctx-arr">›</span>
          <span class="ctx-step ctx-step--link" @click="$router.push(galaxyNavTarget)">GALAXY</span>
          <span class="ctx-arr">›</span>
          <span class="ctx-step ctx-step--dim">SYSTEM</span>
          <span class="ctx-arr">›</span>
          <span class="ctx-step ctx-step--dim">PLANET</span>
          <span class="ctx-arr">›</span>
          <span class="ctx-step ctx-step--settle" @click="$router.push('/mint')">SETTLE</span>
        </div>
      </div>

      <!-- ── Settle / claim CTA ────────────────────────────────────────── -->
      <div class="ctx-claim">
        <div class="ctx-claim-title">CLAIM A WORLD</div>
        <div class="ctx-claim-sub">
          40 acres · one mule · permanent deed
        </div>

        <!-- 6-chain support grid (mini) -->
        <div class="ctx-chains">
          <button
            v-for="c in SUPPORTED_CHAINS" :key="c.id"
            class="ctx-chain-chip"
            :class="`ctx-chain-chip--${c.status}`"
            :title="`${c.name} — ${c.statusLabel}`"
            @click="$router.push('/chains')"
          >
            <span class="ctx-chain-dot" :style="{ background: c.color }" />
            {{ c.symbol }}
          </button>
        </div>
        <div class="ctx-chains-hint" @click="$router.push('/chains')">
          6 chains · view status matrix →
        </div>

        <div class="row q-gutter-xs q-mt-sm">
          <q-btn dense unelevated size="xs" color="cyan-9" icon="scatter_plot"
            label="Browse Worlds" style="flex:1"
            @click="$router.push(galaxyNavTarget)" />
          <q-btn dense unelevated size="xs" color="amber-8" icon="mdi-map-marker-plus"
            label="Mint Deed" style="flex:1"
            @click="$router.push('/mint')" />
        </div>
      </div>

      </div><!-- /ctx-panel-body -->
    </div>

    <!-- Hover tooltip (non-conduit objects) -->
    <div v-if="hoveredLabel && !conduitMeta" class="hover-box" :style="hoverStyle">
      <div class="text-caption text-blue-grey-1 text-weight-medium">{{ hoveredLabel.name }}</div>
      <div class="text-caption text-cyan-5">{{ hoveredLabel.type }}</div>
      <div v-if="hoveredLabel.detail" class="text-caption text-blue-grey-4 q-mt-xs">{{ hoveredLabel.detail }}</div>
    </div>

    <!-- Conduit meta-map panel -->
    <div v-if="conduitMeta" class="conduit-meta-panel" :style="hoverStyle">
      <div class="cmp-title">{{ conduitMeta.conduit.name }}</div>
      <div class="cmp-void">{{ conduitMeta.conduit.voidName }} · transit node</div>

      <!-- Radar SVG: viewBox -80 to +80 → 160×160px; scale 1 Mpc = 0.2 SVG units -->
      <svg width="160" height="160" viewBox="-80 -80 160 160" class="cmp-radar">
        <!-- Background -->
        <rect x="-80" y="-80" width="160" height="160" fill="rgba(0,8,20,0.6)"/>
        <!-- Distance rings: 100, 200, 400 Mpc -->
        <circle cx="0" cy="0" r="20"  fill="none" stroke="rgba(0,200,255,0.18)" stroke-width="0.5"/>
        <circle cx="0" cy="0" r="40"  fill="none" stroke="rgba(0,200,255,0.12)" stroke-width="0.5"/>
        <circle cx="0" cy="0" r="80"  fill="none" stroke="rgba(0,200,255,0.06)" stroke-width="0.5"/>
        <text x="2" y="-21" font-size="5.5" fill="rgba(0,180,220,0.4)">100 Mpc</text>
        <text x="2" y="-41" font-size="5.5" fill="rgba(0,180,220,0.3)">200 Mpc</text>
        <!-- Crosshairs -->
        <line x1="-80" y1="0" x2="80" y2="0" stroke="rgba(0,200,255,0.09)" stroke-width="0.4"/>
        <line x1="0" y1="-80" x2="0" y2="80" stroke="rgba(0,200,255,0.09)" stroke-width="0.4"/>
        <!-- This conduit at center -->
        <polygon points="0,-5.5 3.5,3 -3.5,3" fill="#00e5ff" opacity="0.95"/>
        <polygon points="0,5.5 3.5,-3 -3.5,-3" fill="#00e5ff" opacity="0.55"/>
        <!-- Neighbors (sorted by distance; nearest plotted on top) -->
        <g v-for="n in conduitMeta.neighbors.slice().reverse()" :key="n.name">
          <g :transform="`translate(${Math.min(73,Math.max(-73, n.dx*0.2))},${Math.min(73,Math.max(-73,-n.dz*0.2))})`">
            <circle    v-if="n.kind==='cluster'"  cx="0" cy="0" r="3.5" :fill="n.color" opacity="0.78"/>
            <polygon   v-else-if="n.kind==='bh'"  points="0,-5 3.5,0 0,5 -3.5,0" :fill="n.color" opacity="0.92"/>
            <polygon   v-else                     points="0,-4.5 3,2.5 -3,2.5" fill="none" :stroke="n.color" stroke-width="0.9"/>
            <text v-if="n.distMpc < 300" dx="5" dy="3" font-size="5.5" :fill="n.color" opacity="0.72">
              {{ n.name.length > 18 ? n.name.slice(0,17) + '…' : n.name }}
            </text>
          </g>
        </g>
      </svg>

      <!-- Stats row -->
      <div class="cmp-stats">
        <span class="cmp-stat cmp-stat--bh"
              v-if="conduitMeta.neighbors.filter(n => n.kind==='bh').length">
          ⬡ {{ conduitMeta.neighbors.filter(n => n.kind==='bh').length }} BH
        </span>
        <span class="cmp-stat cmp-stat--cl">
          ✦ {{ conduitMeta.neighbors.filter(n => n.kind==='cluster').length }} clusters
        </span>
        <span class="cmp-stat cmp-stat--co">
          ◈ {{ conduitMeta.neighbors.filter(n => n.kind==='conduit').length }} links
        </span>
      </div>
      <div class="cmp-strat">
        STRATEGIC VALUE
        <span :style="{ color: stratColor, fontWeight: 'bold' }">{{ conduitMeta.stratValue }}</span>/100
      </div>
      <div class="cmp-hint">click to open transit panel</div>
    </div>

    <!-- Side info panel (shown when cluster/conduit is selected) -->
    <Transition name="fade">
      <div v-if="selected" class="space-overlay side-panel q-pa-md">
        <div class="row items-center q-mb-sm">
          <q-icon :name="selected.icon" :color="selected.iconColor" size="18px" class="q-mr-sm" />
          <div class="text-subtitle2 text-blue-grey-1">{{ selected.name }}</div>
        </div>
        <div class="text-caption text-cyan-5 q-mb-xs">{{ selected.type }}</div>

        <!-- Supercluster badge -->
        <div v-if="selected.supercluster" class="sc-badge q-mb-xs q-px-sm q-py-xs row items-center"
             :style="{ borderColor: selected.scColor }">
          <q-icon name="mdi-web" size="12px" class="q-mr-xs" :style="{ color: selected.scColor }" />
          <span class="text-caption" :style="{ color: selected.scColor, letterSpacing: '0.08em' }">
            {{ selected.supercluster }} Supercluster
          </span>
        </div>

        <q-separator color="blue-grey-8" class="q-my-sm" />
        <div v-for="(val, key) in selected.details" :key="key" class="text-caption text-blue-grey-3 q-mb-xs">
          <span class="text-blue-grey-5">{{ key }}: </span>{{ val }}
        </div>

        <template v-if="selected.isConduit">
          <q-separator color="blue-grey-8" class="q-my-sm" />
          <div class="text-caption text-cyan-5 q-mb-xs" style="letter-spacing:0.08em">
            TRANSIT DESTINATIONS
          </div>
          <div v-if="!galaxyStore.isLoaded" class="text-caption text-blue-grey-6 q-mb-sm">
            Loading star systems…
          </div>
          <template v-else>
            <div
              v-for="dest in transitTargets"
              :key="dest.route"
              class="transit-row row items-center justify-between q-mb-xs"
            >
              <div class="col">
                <div class="text-caption text-blue-grey-1 dest-name">{{ dest.label }}</div>
                <div class="text-caption text-blue-grey-6 dest-meta">{{ dest.dist }} pc · {{ dest.spec }}</div>
              </div>
              <q-btn
                dense rounded unelevated size="xs" color="cyan-9"
                icon="mdi-hexagon-outline" label="Warp"
                class="warp-btn"
                @click="initiateTransit(dest)"
              />
            </div>
            <div v-if="!transitTargets.length" class="text-caption text-blue-grey-7 q-mb-sm">
              No catalogued systems in this conduit's range.
            </div>
            <q-separator color="blue-grey-9" class="q-mt-sm q-mb-sm" />
            <q-btn flat dense size="xs" color="blue-grey-5" icon="scatter_plot" label="Milky Way map"
              @click="$router.push('/galaxy')" />
          </template>
        </template>

        <!-- Galaxy cluster member — explore star systems, then settle -->
        <template v-if="selected.isClusterMember">
          <q-separator color="blue-grey-8" class="q-my-sm" />
          <div class="text-caption text-blue-grey-5 q-mb-xs" style="letter-spacing:0.08em">
            {{ selected.isBrightGalaxy ? 'CATALOGUED GALAXY · CLUSTER MEMBER' : 'GENERATED GALAXY · CLUSTER MEMBER' }}
          </div>

          <!-- Primary action: navigate into the galaxy's star systems -->
          <q-btn
            dense rounded unelevated size="sm" color="cyan-8" class="full-width q-mb-xs"
            icon="mdi-telescope"
            label="Explore Star Systems"
            @click="$router.push({ path: `/cluster-galaxy/${clusterSlug(selected.memberClusterName ?? '')}/${encodeURIComponent(selected.memberId ?? selected.memberName ?? selected.name)}`, query: { morph: selected.memberMorph ?? 'E' } })"
          />

          <!-- Secondary action: jump straight to minting a deed -->
          <q-btn
            flat dense size="xs" color="blue-grey-5" class="full-width"
            icon="mdi-map-marker-plus"
            :label="selected.isBrightGalaxy ? 'Claim a world here' : 'Claim a world here'"
            @click="$router.push({ path: `/cluster-galaxy/${clusterSlug(selected.memberClusterName ?? '')}/${encodeURIComponent(selected.memberId ?? selected.memberName ?? selected.name)}`, query: { morph: selected.memberMorph ?? 'E', action: 'claim' } })"
          />

          <div class="text-caption text-blue-grey-6 q-mt-xs" style="font-size:9px;line-height:1.5">
            {{ selected.isBrightGalaxy
              ? 'Luminous catalogued galaxy — explore generated star systems and settle an exoplanet or orbital position.'
              : 'Generated galaxy with star systems designed for exploration and settlement. Each world can be claimed as an exolocation deed.' }}
          </div>

          <div v-if="selected.details?.['Notes']" class="q-mt-xs text-caption text-cyan-8" style="font-size:8px;line-height:1.4">
            {{ selected.details['Notes'] }}
          </div>

          <!-- BH first-class navigation — shown when this galaxy hosts a black hole -->
          <template v-if="selected.isBH">
            <q-separator color="amber-9" class="q-my-sm" />
            <div class="text-caption q-mb-xs" style="color:#ffaa33;letter-spacing:0.08em">
              BLACK HOLE · ORBITAL ZONE
            </div>
            <div class="text-caption text-blue-grey-5 q-mb-sm" style="font-size:9px;line-height:1.5">
              Safe settlement beyond ISCO (3× Schwarzschild radius). Ultra-massive BHs offer
              extreme gravitational lensing from stable orbital zones.
            </div>
            <q-btn
              dense rounded unelevated size="sm" color="amber-9" class="full-width q-mb-xs"
              icon="mdi-orbit"
              label="Enter Host Cluster"
              @click="$router.push(`/cluster-interior/${clusterSlug(selected.details['Cluster'] ?? '')}`)"
            />
            <div class="text-caption text-blue-grey-7 q-mt-xs" style="font-size:9px">
              Full BH accretion zone scene · planned v1.2
            </div>
          </template>
        </template>

        <!-- Named cluster navigation -->
        <template v-if="!selected.isConduit && !selected.isMilkyWay && !selected.isBrightGalaxy && !selected.xrayCluster">
          <q-separator color="blue-grey-8" class="q-my-sm" />
          <div class="text-caption text-blue-grey-5 q-mb-xs" style="letter-spacing:0.08em">NAVIGATION</div>
          <q-btn
            dense rounded unelevated size="sm" color="cyan-8" class="full-width q-mb-xs"
            icon="mdi-view-dashboard" label="Browse Cluster Galaxies"
            @click="navigateToClusterInterior()"
          />
          <q-btn
            flat dense size="xs" color="blue-grey-5" class="full-width"
            icon="mdi-telescope" label="Fly in (cosmic view)"
            @click="enterCluster()"
          />
        </template>

        <!-- X-ray cluster navigation -->
        <template v-if="selected.xrayCluster">
          <q-separator color="blue-grey-8" class="q-my-sm" />
          <div class="text-caption text-blue-grey-5 q-mb-xs" style="letter-spacing:0.08em">NAVIGATION</div>
          <q-btn
            dense rounded unelevated size="sm" color="cyan-8" class="full-width q-mb-xs"
            icon="mdi-view-dashboard" label="Browse Cluster Galaxies"
            @click="navigateToXCluster()"
          />
          <q-separator color="blue-grey-9" class="q-my-sm" />
          <div class="text-caption text-blue-grey-5 q-mb-xs" style="letter-spacing:0.08em">STAR FIELD</div>
          <template v-if="galaxyStore.isLoaded">
            <div v-if="nearestSystemHost" class="text-caption text-blue-grey-4 q-mb-sm">
              Nearest catalogued system<br>
              <span class="text-cyan-4" style="letter-spacing:0.04em">{{ nearestSystemHost }}</span>
            </div>
            <div v-else class="text-caption text-blue-grey-6 q-mb-sm" style="font-size:9px">
              No catalogued systems in this region — extrapolating theoretical candidate
            </div>
            <q-btn
              dense rounded unelevated size="sm"
              :color="nearestSystemHost ? 'blue-grey-8' : 'blue-grey-9'"
              icon="mdi-rocket-launch"
              :label="nearestSystemHost ? 'Enter System' : 'Enter Candidate'"
              @click="enterXraySystem"
            />
            <div class="text-caption text-blue-grey-7 q-mt-xs" style="font-size:9px">
              {{ nearestSystemHost ? 'NASA exoplanet catalog · verified' : 'Star formation extrapolated · speculative' }}
            </div>
          </template>
          <div v-else class="text-caption text-blue-grey-6">Loading catalog…</div>
        </template>

        <q-btn flat dense round icon="close" color="blue-grey-5" size="xs"
          class="absolute-top-right q-ma-xs" @click="selected = null; $router.replace({ query: {} })" />
      </div>
    </Transition>

    <!-- Event panel -->
    <Transition name="fade">
      <div v-if="activeEvent" class="space-overlay event-panel q-pa-md">
        <div class="row items-center justify-between q-mb-xs">
          <div class="event-type-badge q-px-sm q-py-xs"
               :style="{ background: eventTypeColor(activeEvent.type) + '22', borderColor: eventTypeColor(activeEvent.type) }">
            <span class="text-caption" :style="{ color: eventTypeColor(activeEvent.type), letterSpacing: '0.1em' }">
              {{ eventTypeLabel(activeEvent.type) }}
            </span>
          </div>
          <q-btn flat dense round icon="close" color="blue-grey-5" size="xs" @click="activeEvent = null" />
        </div>

        <div class="text-subtitle2 text-blue-grey-1 q-mb-xs" style="line-height:1.3">
          {{ activeEvent.title }}
        </div>
        <div class="text-caption text-blue-grey-4 q-mb-sm">{{ activeEvent.community }}</div>

        <q-separator color="blue-grey-8" class="q-mb-sm" />

        <div class="text-caption text-blue-grey-3 q-mb-sm" style="line-height:1.6">
          {{ activeEvent.description }}
        </div>

        <!-- Timed event countdown -->
        <template v-if="activeEvent.eventTimeUtc">
          <div class="row items-center q-mb-xs" style="gap:6px">
            <q-icon name="mdi-clock-outline" color="cyan-6" size="14px" />
            <span class="text-caption text-blue-grey-3">{{ formatEventTime(activeEvent.eventTimeUtc) }}</span>
          </div>
          <div v-if="eventCountdown" class="countdown-display q-mb-sm">
            <span class="text-caption text-blue-grey-5" style="letter-spacing:0.06em">STARTS IN  </span>
            <span class="text-caption text-cyan-4" style="font-family:monospace;letter-spacing:0.1em">
              {{ eventCountdown }}
            </span>
          </div>
        </template>

        <!-- Capacity -->
        <div v-if="activeEvent.maxGuests" class="row items-center q-mb-sm" style="gap:6px">
          <q-icon name="mdi-account-group-outline" color="blue-grey-5" size="13px" />
          <span class="text-caption text-blue-grey-5">Up to {{ activeEvent.maxGuests.toLocaleString() }} guests</span>
        </div>

        <q-separator color="blue-grey-8" class="q-mb-sm" />

        <!-- pon.ink actions -->
        <div class="column q-gutter-xs">
          <q-btn v-if="activeEvent.ponInkUrl"
            dense rounded unelevated size="sm"
            color="amber-8" icon="mdi-music-note-plus"
            :label="activeEvent.type === 'settlement' ? 'Open in pon.ink' : 'Join Event — pon.ink'"
            @click="openPonInk(activeEvent.ponInkUrl!)"
          />
          <q-btn v-if="activeEvent.airdropId"
            dense rounded outline size="sm"
            color="cyan-7" icon="mdi-gift-outline"
            label="Claim Airdrop"
            @click="openPonInk(activeEvent.ponInkUrl ?? 'https://pon.ink')"
          />
          <q-btn
            flat dense size="xs" color="blue-grey-5"
            icon="mdi-arrow-expand-all" label="Fly to cluster"
            @click="flyToActiveEvent"
          />
        </div>
      </div>
    </Transition>

    <!-- ── Cluster approach HUD — appears when entering LOD_NEAR ────────────── -->
    <Transition name="approach-fade">
      <div v-if="activeCluster && activeCluster.zoomDepth > 0" class="approach-hud">
        <div class="approach-name">{{ activeCluster.name }}</div>
        <div class="approach-bar-wrap">
          <div class="approach-bar" :style="{ width: (activeCluster.zoomDepth * 100) + '%' }" />
        </div>
        <div class="approach-meta">
          <span v-if="activeCluster.tapKev">{{ activeCluster.tapKev }} keV</span>
          <span v-if="activeCluster.tapKev"> · </span>
          <span>{{ activeCluster.distMpc.toFixed(0) }} Mpc</span>
          <span v-if="activeCluster.richness"> · r{{ activeCluster.richness }}</span>
        </div>
      </div>
    </Transition>

    <!-- Defender navigator strip -->
    <DefenderNav
      ref="defenderNav"
      mode="cosmic"
      :sceneLabel="selected?.name ?? 'Cosmic Web'"
      @flyTo="onDefenderCosmicFlyTo"
      @portalTo="dest => portalStore.openPortal(dest)"
      @viewModeChange="onCosmicViewModeChange"
    />

    <!-- ── DK.MAT dark matter / conduit overlay ──────────────────────── -->
    <Transition name="fade">
      <div v-if="cosmicViewMode === 'dark_matter'" class="dm-overlay">
        <div class="dm-title">
          <q-icon name="mdi-dots-hexagon" color="purple-4" size="12px" class="q-mr-xs" />
          DARK MATTER  ·  VOID-EDGE CONDUIT NETWORK
        </div>
        <div class="dm-body">
          Wormhole conduit nodes ◆ are placed at the periphery of great cosmic voids —
          the same regions where dark matter filaments converge between superclusters.
          The E8 lattice transit network routes through these density peaks.
        </div>
        <div class="dm-legend">
          <span class="dm-dot dm-conduit" />  Conduit node
          <span class="dm-dot dm-void" />  Void boundary
          <span class="dm-dot dm-filament" />  Filament / dark matter wall
        </div>
      </div>
    </Transition>

    <!-- ── Cluster member navigator toolbar ─────────────────────────────── -->
    <Transition name="fade">
      <div v-if="activeClusterLabel" class="cluster-nav-bar">
        <div class="cluster-nav-crumb">
          <q-icon name="mdi-galaxy" size="13px" color="cyan-6" class="q-mr-xs" />
          <span class="cnb-cluster">{{ activeClusterLabel }}</span>
          <template v-if="clusterFocusIdx >= 0 && clusterMemberSprites.length">
            <span class="cnb-sep">›</span>
            <span class="cnb-member">
              {{ clusterMemberSprites[clusterFocusIdx]?.userData.catalogName
                ?? ((clusterMemberSprites[clusterFocusIdx]?.userData.morph as string) + ' galaxy') }}
            </span>
          </template>
        </div>
        <div class="cluster-nav-controls">
          <q-btn flat dense round icon="mdi-chevron-left" size="sm" color="blue-grey-4"
            :disable="!clusterMemberSprites.length"
            title="Previous galaxy"
            @click="navigateClusterMember(-1)" />
          <span v-if="clusterMemberSprites.length" class="cnb-count">
            {{ clusterFocusIdx >= 0 ? clusterFocusIdx + 1 : '–' }}&thinsp;/&thinsp;{{ clusterMemberSprites.length }}
          </span>
          <q-btn flat dense round icon="mdi-chevron-right" size="sm" color="blue-grey-4"
            :disable="!clusterMemberSprites.length"
            title="Next galaxy"
            @click="navigateClusterMember(1)" />
          <div class="cnb-divider" />
          <q-btn flat dense round icon="mdi-crosshairs-gps" size="sm" color="blue-grey-5"
            title="Center on cluster core"
            @click="centerOnCluster()" />
          <q-btn flat dense round icon="mdi-arrow-expand-all" size="sm" color="blue-grey-5"
            title="Exit cluster view"
            @click="exitCluster()" />
        </div>
      </div>
    </Transition>

    <!-- Bottom nav -->
    <div class="space-overlay" style="bottom:92px;right:14px;display:flex;gap:8px">
      <q-btn flat dense rounded icon="scatter_plot" label="Milky Way" color="amber-5" size="sm"
        @click="flyToMilkyWay" />
      <q-btn flat dense rounded icon="zoom_out_map" label="Full web" color="blue-grey-4" size="sm"
        @click="flyToOverview" />
    </div>

    <!-- Legend — bottom left: toggle + collapsible structure key -->
    <div class="legend-anchor" style="bottom:92px;left:14px">
      <button class="legend-toggle" @click="showLegend = !showLegend" :title="showLegend ? 'Hide key' : 'Show structure key'">
        <span class="legend-toggle__icon">◉</span>
        <span class="legend-toggle__label">{{ showLegend ? 'HIDE KEY' : 'MAP KEY' }}</span>
      </button>
      <Transition name="legend-slide">
        <div v-if="showLegend" class="legend-block q-pa-sm">
          <div class="text-caption text-blue-grey-6 q-mb-xs" style="letter-spacing:0.08em;font-size:9px">
            STRUCTURE
          </div>
          <div v-for="l in legendItems" :key="l.label" class="legend-row">
            <span class="legend-dot" :style="{ background: l.color, width: l.size+'px', height: l.size+'px' }" />
            <span class="text-caption text-blue-grey-4">{{ l.label }}</span>
          </div>
        </div>
      </Transition>
    </div>
    <!-- ── Quick transit strip — settlements + recent locations ────────── -->
    <Transition name="qt-appear">
      <div v-if="quickTransitItems.length" class="qt-strip">
        <div class="qt-label">QUICK TRANSIT</div>
        <div class="qt-scroll">
          <button
            v-for="item in quickTransitItems"
            :key="item.route"
            class="qt-chip"
            :class="item.isSettle ? 'qt-chip--settle' : 'qt-chip--recent'"
            :title="item.sublabel"
            @click="$router.push(item.route)"
          >
            <q-icon :name="item.icon" size="11px" class="qt-icon" />
            <span class="qt-name">{{ item.label }}</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Welcome overlay — role-aware entry panel ───────────────────── -->
    <WelcomeOverlay ref="welcomeOverlay" />

  </q-page>
</template>

<script setup lang="ts">
/**
 * CosmicPage.vue — Level 1 cosmic view
 *
 * Shows the local cosmic web: galaxy clusters as glowing spheres,
 * great voids as transparent wireframe shells, filaments as faint
 * arcing lines, and wormhole conduit markers at void periphery.
 *
 * The conduit network is the long-distance substrate of the
 * wormhole transit system. Short routes use direct transit;
 * inter-cluster routes route through void-edge conduits.
 */

import { ref, computed, shallowRef, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter, useRoute }    from 'vue-router'
import { useVizRenderer }         from 'src/composables/useVizRenderer'
import * as THREE                                            from 'three'
import { OrbitControls }                                    from 'three/examples/jsm/controls/OrbitControls.js'
import gsap                                                  from 'gsap'
import { usePortalStore }                                    from 'src/stores/portal'
import { useGalaxyStore }                                    from 'src/stores/galaxy'
import { useSceneTransitionStore }                           from 'src/stores/scene-transition'
import DefenderNav                                           from 'src/components/DefenderNav.vue'
import WelcomeOverlay                                        from 'src/components/WelcomeOverlay.vue'
import { useSettlements }                                    from 'src/lib/settlements'
import { useRecentLocations }                                from 'src/composables/useRecentLocations'
import type { SettlementRecord }                             from 'src/lib/settlements'
import type { DefenderNavData, CosmicStripEntry, ConduitStripEntry, DefenderTarget } from 'src/lib/defender-nav.types'
import {
  CLUSTERS,
  VOIDS,
  SUPERCLUSTERS,
  GREAT_ATTRACTOR,
  LANIAKEA_EXTENT_MPC,
  buildConduits,
  clusterScenePos,
  voidScenePos,
  voidSceneRadius,
  superclusters as lookupSupercluster,
  MPC_SCALE,
  loadXrayClusters,
  xrayClusterScenePos,
  tapKevToRichness,
  type CosmicCluster,
  type CosmicVoid,
  type WormholeConduit,
  type BrightGalaxy,
  type XRayCluster,
} from 'src/data/cosmic-structures'
import {
  makeStarMesh,
  makeGalaxySprite,
  makeNamedClusterSprite,
  randomClusterSpectral,
  seededRng,
} from 'src/lib/star-sprites'
import { VOID_VERT, VOID_FRAG } from 'src/lib/void-shader'
import { disposeScene }                          from 'src/lib/three-utils'
import { loadOracleCluster, prewarmOracleIndex } from 'src/lib/galaxy-oracle'
import type { OracleGalaxy } from 'src/data/galaxy-oracle.types'
import {
  COSMIC_EVENTS,
  eventForCluster,
  formatEventTime,
  msUntilEvent,
  EVENT_TYPE_LABEL,
  EVENT_TYPE_COLOR,
  type CosmicEvent,
} from 'src/data/events'

// ── Stores ────────────────────────────────────────────────────────────────────

const portalStore  = usePortalStore()
const galaxyStore  = useGalaxyStore()
const router       = useRouter()
const route        = useRoute()
const transition   = useSceneTransitionStore()

// ── Reactive UI state ─────────────────────────────────────────────────────────

// canvas ref removed — events are on the q-page element; canvas is in MainLayout
const hoveredLabel = ref<{ name: string; type: string; detail?: string } | null>(null)
const hoverStyle   = ref({ left: '0px', top: '0px' })

// ── Conduit meta-map hover ────────────────────────────────────────────────────
const hoveredConduitData = ref<WormholeConduit | null>(null)

interface ConduitNeighbor {
  name:     string
  kind:     'cluster' | 'bh' | 'conduit'
  distMpc:  number
  dx:       number
  dz:       number
  detail:   string
  color:    string
}

const conduitMeta = computed(() => {
  const c = hoveredConduitData.value
  if (!c) return null

  const cPos = c.pos   // already in Mpc
  const neighbors: ConduitNeighbor[] = []

  // Named clusters
  for (const cl of CLUSTERS) {
    if (cl.distMpc === 0) continue
    const clScene = clusterScenePos(cl)
    const clPos   = new THREE.Vector3(clScene.x * 15, clScene.y * 15, clScene.z * 15)
    const dist    = cPos.distanceTo(clPos)
    if (dist > 500) continue
    const scColor = cl.supercluster === 'Laniakea'       ? '#4499ff'
                  : cl.supercluster === 'Perseus-Pisces' ? '#ff6633'
                  : cl.supercluster === 'Coma'           ? '#55ee88'
                  : cl.supercluster === 'Virgo'          ? '#cc88ff'
                  :                                        '#8899aa'
    neighbors.push({ name: cl.name, kind: 'cluster', distMpc: dist,
      dx: clPos.x - cPos.x, dz: clPos.z - cPos.z,
      detail: cl.supercluster ?? '', color: scColor })
  }

  // BH host galaxies inside named clusters
  for (const cl of CLUSTERS) {
    if (!cl.brightGalaxies?.length) continue
    const clScene = clusterScenePos(cl)
    const clPos   = new THREE.Vector3(clScene.x * 15, clScene.y * 15, clScene.z * 15)
    const dist    = cPos.distanceTo(clPos)
    if (dist > 500) continue
    for (const bg of cl.brightGalaxies!) {
      if (!bg.bhType) continue
      neighbors.push({ name: bg.name, kind: 'bh', distMpc: dist,
        dx: clPos.x - cPos.x, dz: clPos.z - cPos.z,
        detail: bg.bhMass ?? bg.bhType,
        color: bg.bhType === 'ULSMBH' ? '#ff9933' : '#8899ff' })
    }
  }

  // Other conduits
  for (const other of buildConduits()) {
    if (other.name === c.name) continue
    const dist = cPos.distanceTo(other.pos)
    neighbors.push({ name: other.name, kind: 'conduit', distMpc: dist,
      dx: other.pos.x - cPos.x, dz: other.pos.z - cPos.z,
      detail: other.voidName, color: '#00e5ff' })
  }

  neighbors.sort((a, b) => a.distMpc - b.distMpc)

  const bhNear  = neighbors.filter(n => n.kind === 'bh'      && n.distMpc < 300).length
  const clNear  = neighbors.filter(n => n.kind === 'cluster' && n.distMpc < 300).length
  const stratValue = Math.min(100, Math.round(bhNear * 20 + clNear * 6 + 10))

  return { conduit: c, neighbors: neighbors.slice(0, 9), stratValue }
})

const stratColor = computed(() => {
  const v = conduitMeta.value?.stratValue ?? 0
  return v > 60 ? '#44ff88' : v > 30 ? '#ffaa33' : '#66ccff'
})

interface SelectedInfo {
  name:             string
  type:             string
  icon:             string
  iconColor:        string
  details:          Record<string, string>
  supercluster?:    string
  scColor?:         string
  isConduit?:       boolean
  isMilkyWay?:      boolean
  isBrightGalaxy?:   boolean
  isBH?:             boolean
  isClusterMember?:   boolean   // any galaxy sprite in an active LOD cluster
  memberMorph?:       string    // Hubble type of the clicked member
  memberName?:        string    // catalogue name if known
  memberId?:          string    // JSON catalog id (proc-NNNN or named ID)
  memberClusterName?: string    // display name of the host cluster
  conduitVoidName?:  string
  xrayCluster?:      XRayCluster
  isVoid?:           boolean
  cosmicVoid?:       CosmicVoid
}

const selected       = ref<SelectedInfo | null>(null)
const enteringMW     = ref(false)
const activeEvent    = ref<CosmicEvent | null>(null)

// ── Contextual info panel ─────────────────────────────────────────────────────

// Distance from camera to Milky Way (origin) — updated each frame
const camDistToOrigin = ref(12)

// Active cluster interior state — updated each frame when inside LOD_NEAR
interface MorphBar { label: string; pct: number; color: string }
interface ClusterInteriorState {
  name:         string
  distMpc:      number
  tapKev?:      number
  richness:     number
  zoomDepth:    number   // 0 (at LOD_FAR) → 1 (at LOD_REVEAL)
  memberCount:  number
  morphBars:    MorphBar[]
  hasSubcluster: boolean
  isXray:       boolean
}
const activeCluster = shallowRef<ClusterInteriorState | null>(null)

// ── Cluster member navigator state ────────────────────────────────────────────
const activeClusterLabel   = ref<string | null>(null)
const clusterMemberSprites = shallowRef<THREE.Sprite[]>([])
const clusterFocusIdx      = ref(-1)

function syncMemberList(group: THREE.Group, clusterName: string) {
  activeClusterLabel.value   = clusterName
  clusterFocusIdx.value      = -1
  clusterMemberSprites.value = group.children.filter(
    o => (o as THREE.Sprite).isSprite && o.userData.morph,
  ) as THREE.Sprite[]
}

function clearMemberList() {
  activeClusterLabel.value   = null
  clusterMemberSprites.value = []
  clusterFocusIdx.value      = -1
}

function buildMorphBars(children: THREE.Object3D[]): MorphBar[] {
  const counts: Record<string, number> = { cD: 0, E: 0, S0: 0, Sa: 0, Sb: 0, Irr: 0 }
  let total = 0
  for (const c of children) {
    const m = c.userData.morph as string | undefined
    if (m && m in counts) { counts[m]!++; total++ }
  }
  if (!total) return []
  const COLOR: Record<string, string> = {
    cD: '#ffcc88', E: '#ffaa66', S0: '#88aacc',
    Sa: '#66bbaa', Sb: '#44aadd', Irr: '#aa88ff',
  }
  return (Object.entries(counts) as [string, number][])
    .filter(([, n]) => n > 0)
    .map(([label, n]) => ({ label, pct: Math.round(n / total * 100), color: COLOR[label] ?? '#88aacc' }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4)
}

type ContextLevel = 'overview' | 'nearby' | 'milkyway' | 'conduit' | 'xray' | 'void' | 'selected' | 'cluster_interior'

const contextLevel = computed((): ContextLevel => {
  if (selected.value?.isMilkyWay || camDistToOrigin.value < 0.7) return 'milkyway'
  if (camDistToOrigin.value < 3.5)                                return 'nearby'
  if (activeCluster.value)                                        return 'cluster_interior'
  if (selected.value?.isConduit)                                  return 'conduit'
  if (selected.value?.xrayCluster)                                return 'xray'
  if (selected.value?.isVoid)                                     return 'void'
  if (selected.value && !selected.value.isBrightGalaxy)           return 'selected'
  return 'overview'
})

const contextLevelLabel = computed((): string => {
  const lv = contextLevel.value
  if (lv === 'milkyway')         return 'MILKY WAY'
  if (lv === 'nearby')           return 'LOCAL GROUP'
  if (lv === 'cluster_interior') return activeCluster.value?.name ?? 'CLUSTER'
  if (lv === 'xray')             return selected.value?.name ?? 'X-RAY CLUSTER'
  if (lv === 'conduit')          return selected.value?.name ?? 'CONDUIT'
  if (lv === 'void')             return selected.value?.name ?? 'VOID'
  if (lv === 'selected')         return selected.value?.name ?? 'CLUSTER'
  return 'COSMIC WEB'
})

// When a cluster member galaxy is selected, GALAXY nav targets that galaxy's
// cluster-galaxy page instead of the Milky Way /galaxy route.
const galaxyNavTarget = computed((): string => {
  const sel = selected.value
  if (sel?.isClusterMember && sel.memberClusterName) {
    const slug = clusterSlug(sel.memberClusterName)
    const id   = encodeURIComponent(sel.memberId ?? sel.memberName ?? sel.name)
    return `/cluster-galaxy/${slug}/${id}`
  }
  return '/galaxy'
})

// ── DefenderNav view mode ─────────────────────────────────────────────────────

const cosmicViewMode = ref<'natural' | 'xray' | 'dark_matter'>('natural')

// Accent colours per mode
const CONDUIT_NAT  = { color: 0x00e5ff, emissive: 0x00e5ff, intensity: 1.2, scale: 1.0 }
const CONDUIT_XRAY = { color: 0xff8833, emissive: 0xff4400, intensity: 0.7, scale: 0.85 }
const CONDUIT_DKM  = { color: 0xcc55ff, emissive: 0x9900cc, intensity: 2.2, scale: 2.2 }

function onCosmicViewModeChange(mode: 'natural' | 'xray' | 'dark_matter') {
  cosmicViewMode.value = mode
  const cfg = mode === 'dark_matter' ? CONDUIT_DKM
            : mode === 'xray'        ? CONDUIT_XRAY
            :                          CONDUIT_NAT

  for (const mesh of conduitMeshes) {
    const mat = mesh.material as THREE.MeshStandardMaterial
    mat.color.setHex(cfg.color)
    mat.emissive.setHex(cfg.emissive)
    mat.emissiveIntensity = cfg.intensity
    mesh.scale.setScalar(cfg.scale)
  }
  // Lower pyramids share the same material but need scale updated independently
  for (const mesh of conduitLowerMeshes) {
    mesh.scale.setScalar(cfg.scale)
  }
}

// Countdown display for timed events (updated each second)
const eventCountdown = ref('')

// ── Cluster label overlay state ───────────────────────────────────────────────

interface ClusterLabel {
  name:        string
  supercluster: string
  scColor:     string
  x:           number
  y:           number
  visible:     boolean
}

const clusterLabels = shallowRef<ClusterLabel[]>([])

interface SubclusterLabel {
  text:    string
  color:   string
  x:       number
  y:       number
}
const subclusterLabels  = shallowRef<SubclusterLabel[]>([])
// Sprites that carry a sub-cluster or BCG label; rebuilt each time a catalog loads
const _subclusterMarkers: Array<{ sprite: THREE.Sprite; text: string; color: string }> = []

// ── Proposed Zone — user-defined planet path in uncharted regions ─────────────

type PlanetType = 'rocky' | 'super-earth' | 'gas' | 'ice'

interface ProposedZone {
  id:          string
  worldPos:    THREE.Vector3
  orbRadiusSu: number          // orbit ring radius in scene units
  planetType:  PlanetType
  name:        string
  clusterCtx:  string          // cluster name for context
}

const panelCollapsed    = ref(true)
const showLegend        = ref(false)
const showProposePanel  = ref(false)
const proposedZones     = ref<ProposedZone[]>([])
const draftZone         = ref<Omit<ProposedZone, 'id' | 'worldPos' | 'clusterCtx'>>({
  orbRadiusSu: 0.18,
  planetType:  'rocky',
  name:        '',
})
const _proposalClickWorld = ref<THREE.Vector3 | null>(null)
const _proposalPanelPos   = ref({ x: 0, y: 0 })
const proposalPanelStyle  = computed(() => ({
  left: Math.min(_proposalPanelPos.value.x, (window.innerWidth  || 1200) - 280) + 'px',
  top:  Math.min(_proposalPanelPos.value.y + 12, (window.innerHeight || 800) - 320) + 'px',
}))

// Live Three.js objects for rendered proposals (for cleanup)
const _proposalRings: THREE.Object3D[] = []

const PLANET_TYPE_COLOR: Record<PlanetType, number> = {
  rocky:       0x88aacc,
  'super-earth': 0x66cc88,
  gas:         0xffaa44,
  ice:         0xaaddff,
}

function autoZoneName(): string {
  const syllables = ['Vo', 'Ra', 'Ne', 'Li', 'Ex', 'Ar', 'Zo', 'Ka', 'Mu', 'Ti']
  const seed = Date.now() % 1000
  return `${syllables[seed % 10]}${syllables[(seed * 7) % 10]}-${(seed % 89 + 10).toString(36).toUpperCase()}`
}

// ── Supercluster legend data ──────────────────────────────────────────────────

const superclusters = SUPERCLUSTERS.map(sc => ({
  name:     sc.name,
  colorHex: '#' + new THREE.Color(sc.color).getHexString(),
}))

interface TransitDest {
  label: string
  route: string
  dist:  string
  spec:  string
}

// Transit destination list — filtered from galaxy data by void type
const transitTargets = computed<TransitDest[]>(() => {
  if (!selected.value?.isConduit || !galaxyStore.isLoaded) return []
  const voidName = selected.value.conduitVoidName ?? ''

  const allSystems = [...galaxyStore.systems.values()]

  let candidates: typeof allSystems
  if (voidName.includes('Boötes')) {
    // Far-field: systems > 300 pc  (inter-supercluster routing)
    candidates = allSystems.filter(s => (s.sy_dist ?? 0) > 300)
  } else if (voidName.includes('Sculptor')) {
    // Southern sky direction (dec < −15°)
    candidates = allSystems.filter(s => s.dec < -15)
  } else {
    // Local Void: intermediate range 50–300 pc
    candidates = allSystems.filter(s => {
      const d = s.sy_dist ?? 0
      return d >= 50 && d <= 300
    })
  }

  // Sort by ascending distance, take 6
  candidates.sort((a, b) => (a.sy_dist ?? 9999) - (b.sy_dist ?? 9999))

  return candidates.slice(0, 6).map(sys => {
    const planet = sys.planets[0]
    return {
      label: sys.hostname,
      route: planet
        ? `/surface/${encodeURIComponent(sys.hostname)}/${encodeURIComponent(planet.pl_name)}`
        : '/galaxy',
      dist: sys.sy_dist?.toFixed(0) ?? '?',
      spec: sys.st_spectype?.slice(0, 2) ?? '—',
    }
  })
})

function initiateTransit(dest: TransitDest) {
  selected.value = null
  portalStore.openPortal({ label: dest.label, route: dest.route })
}

// ── Three.js — shared renderer; per-page raycaster ───────────────────────────

const viz = useVizRenderer()
// Convenience aliases updated on mount (scene/camera may be null until then)
let renderer:  THREE.WebGLRenderer     | null = null
let scene:     THREE.Scene             | null = null
let camera:    THREE.PerspectiveCamera | null = null
let controls:  OrbitControls           | null = null

let raycaster: THREE.Raycaster = new THREE.Raycaster()
raycaster.params.Points = { threshold: 0.3 }

let _stopTick: (() => void) | null = null

// Root group for all cosmic-level scene objects — added/removed on mount/unmount
const pageGroup = new THREE.Group()

const mouseNDC = new THREE.Vector2()

interface HitTarget {
  mesh:  THREE.Object3D
  label: NonNullable<typeof hoveredLabel.value>
  info:  SelectedInfo
}
let hitTargets: HitTarget[] = []

// conduit meshes — upper pyramid (primary hit target, rotation/scale driver)
let conduitMeshes: THREE.Mesh[] = []
// conduit lower pyramids — share material with upper; synced in animation tick
let conduitLowerMeshes: THREE.Mesh[] = []

// BH ring meshes — slow rotation animation (one ring per SMBH/ULSMBH galaxy)
let bhRingMeshes: THREE.Mesh[] = []

// Great Attractor convergence rings — inward-pulsing indicator
let gaRingMeshes: THREE.Mesh[] = []

// ── Void HSW membrane state ───────────────────────────────────────────────────
type VoidUniforms = {
  uTime:       { value: number }
  uColor:      { value: THREE.Color }
  uColor2:     { value: THREE.Color }
  uPointer:    { value: THREE.Vector2 }
  uPointerStr: { value: number }
}
let voidUniforms: VoidUniforms[] = []

// Void pointer tracking — CosmicPage already has mouseNDC updated by onHover
let _voidPointerStr = 0
let _voidLastMove   = 0

// ── X-ray cluster LOD tracking ────────────────────────────────────────────────

interface XRayLodEntry {
  cluster:         XRayCluster
  sphere:          THREE.Mesh    // invisible hit target
  visual:          THREE.Sprite  // galaxy point sprite
  pos:             THREE.Vector3
  starGroup:       THREE.Group | null
  beaconRing:      THREE.Mesh | null
  hasEvent:        boolean
  spriteBaseSize:  number        // original sprite scale
  bcgGlowMesh:     THREE.Mesh | null
  spriteRes:       number        // current texture resolution (128 | 256 | 384)
  clusterColor:    THREE.Color
  clusterRichness: number
  spawnProgress:   number        // 0 = sprite only → 1 = stars fully in (cross-fade driver)
  spriteAspect:    number        // deterministic aspect for re-building sprite at new res
}

let xrayLodEntries: XRayLodEntry[] = []
let activeLodEntry:  XRayLodEntry | null = null
const MORPH_DESC: Record<string, string> = {
  cD:  'Giant cD elliptical — dominant BCG with extended stellar envelope; most massive galaxies known',
  E:   'Elliptical — smooth de Vaucouleurs r¹/⁴ profile; old stellar populations; little cold gas',
  S0:  'Lenticular — disk galaxy without spiral arms; transition between E and spirals',
  Sa:  'Early spiral — tight wound arms; prominent bulge; mixed stellar populations',
  Sb:  'Intermediate spiral — moderate pitch; disk and bulge roughly equal',
  Irr: 'Irregular — disrupted morphology; often merger product or tidal interaction',
}

const LOD_FAR    = 40.0   // scene units — sprite starts brightening
const LOD_MID    = 20.0   // sprite resolution upgrades to 256, pronounced bloom
const LOD_NEAR   = 9.0    // star field spawns, sprite cross-fades out
const LOD_REVEAL = 2.5    // all stars visible, sprite fully dissolved

// ── Cluster catalog data (loaded lazily from /public/clusters/ + /public/stars/) ─

interface CatalogMember {
  id:          string
  name?:       string
  ra:          number
  dec:         number
  hubble:      string
  bt_mag?:     number | null
  offset:      [number, number, number]
  lod3_params: { scene_su: number; axis_ratio: number; pitch_deg: number; n_arms: number; pa_deg?: number }
  is_named?:   boolean
  notes?:      string
}

interface CatalogStarEntry {
  id: string; ra: number; dec: number; dist_pc: number
  mag: number; spect: string; color_hex: string; name?: string
}

interface ClusterCatalog { members: CatalogMember[] }
interface StarRegion     { stars: CatalogStarEntry[] }

// In-memory cache of loaded catalogs keyed by cluster slug
const _catalogCache   = new Map<string, CatalogMember[]>()
const _starRegionCache = new Map<string, CatalogStarEntry[]>()

function clusterSlug(name: string): string {
  return name.toLowerCase()
    .replace(/\s+cluster/i,'').replace(/\s+concentration/i,'')
    .trim().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
}

async function loadClusterCatalog(clusterName: string): Promise<CatalogMember[]> {
  const slug = clusterSlug(clusterName)
  if (_catalogCache.has(slug)) return _catalogCache.get(slug)!
  try {
    const res = await fetch(`/clusters/${slug}-members.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: ClusterCatalog = await res.json()
    _catalogCache.set(slug, data.members ?? [])
    return data.members ?? []
  } catch {
    _catalogCache.set(slug, [])   // cache the miss so we don't retry
    return []
  }
}

async function loadStarRegion(clusterName: string): Promise<CatalogStarEntry[]> {
  const slug = clusterSlug(clusterName)
  if (_starRegionCache.has(slug)) return _starRegionCache.get(slug)!
  try {
    const res = await fetch(`/stars/${slug}-region.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: StarRegion = await res.json()
    _starRegionCache.set(slug, data.stars ?? [])
    return data.stars ?? []
  } catch {
    _starRegionCache.set(slug, [])
    return []
  }
}

// ── Named cluster LOD tracking ────────────────────────────────────────────────

interface NamedClusterLodEntry {
  cluster:   CosmicCluster
  pos:       THREE.Vector3
  physR:     number          // physical radius in scene units
  starGroup: THREE.Group | null
  sprite:    THREE.Sprite    // overview billboard — faded/hidden on LOD approach
  bgMeshes:  THREE.Object3D[] // bright-galaxy overview glows — hidden on LOD entry
}

let namedLodEntries: NamedClusterLodEntry[] = []
let activeNamedLodEntry: NamedClusterLodEntry | null = null
const LOD_NAMED_NEAR = 0.55  // slightly larger so catalog members appear earlier

// Countdown interval handle
let countdownInterval: ReturnType<typeof setInterval> | null = null

// VOID_VERT / VOID_FRAG imported from src/lib/void-shader.ts

// Complementary hue pairs for void iridescence — cycles through 8 distinct looks
const VOID_PAIRS: [[number,number,number],[number,number,number]][] = [
  [[0.50, 0.98, 0.74], [0.84, 0.92, 0.70]],  // cyan ↔ violet-rose
  [[0.62, 0.92, 0.68], [0.11, 0.96, 0.74]],  // indigo ↔ amber
  [[0.16, 0.95, 0.72], [0.56, 0.88, 0.70]],  // green ↔ cornflower
  [[0.76, 0.85, 0.72], [0.26, 0.90, 0.74]],  // orchid ↔ lime
  [[0.08, 0.96, 0.74], [0.58, 0.90, 0.70]],  // orange ↔ azure
  [[0.44, 0.94, 0.74], [0.94, 0.90, 0.70]],  // aqua ↔ crimson
  [[0.70, 0.88, 0.70], [0.20, 0.92, 0.74]],  // lavender ↔ yellow
  [[0.30, 0.90, 0.72], [0.80, 0.88, 0.70]],  // sea-green ↔ purple
]

// ── Scene setup ───────────────────────────────────────────────────────────────

function initScene() {
  // Grab shared renderer refs
  renderer = viz.renderer
  scene    = viz.scene
  camera   = viz.camera
  controls = viz.controls
  if (!renderer || !scene || !camera || !controls) return

  // Configure scene appearance for cosmic level
  scene.background = new THREE.Color(0x010208)
  scene.fog        = new THREE.FogExp2(0x010208, 0.022)

  // Configure camera for cosmic scale
  camera.fov    = 55
  camera.near   = 0.01
  camera.far    = 400
  camera.position.set(3, 2, 12)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  // Configure controls for cosmic navigation
  controls.minDistance  = 0.005
  controls.maxDistance  = 250   // covers ~3750 Mpc at MPC_SCALE 1/15
  controls.zoomToCursor = true

  pageGroup.add(new THREE.AmbientLight(0x080c18, 1))
  scene.add(pageGroup)

  prewarmOracleIndex()

  buildBackground()
  buildVoids()
  buildFilaments()
  buildClusters()
  buildConduitMarkers()
  buildSuperclusters()

  // X-ray clusters load async after scene is up
  void loadXrayClusters().then(buildXrayClusters).catch(e => console.warn('X-ray clusters:', e))

  // Canvas event listeners (canvas owned by MainLayout)
  viz.canvas?.addEventListener('wheel', onCanvasWheel, { passive: false })
}

// ── Background: distant galaxy sprites ───────────────────────────────────────

function buildBackground() {
  const positions: number[] = []
  const colors: number[]    = []
  const rng = mulberry32(12345)

  for (let i = 0; i < 3000; i++) {
    // Distribute on a large sphere
    const theta = rng() * Math.PI * 2
    const phi   = Math.acos(2 * rng() - 1)
    const r     = 70 + rng() * 60
    positions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    )
    const brightness = 0.15 + rng() * 0.35
    const hue = rng()
    const col = new THREE.Color().setHSL(hue, 0.3, brightness)
    colors.push(col.r, col.g, col.b)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3))
  const mat = new THREE.PointsMaterial({
    size: 0.4, vertexColors: true, sizeAttenuation: false,
    transparent: true, opacity: 0.55, depthWrite: false,
  })
  pageGroup.add(new THREE.Points(geo, mat))
}

// ── Void shells ───────────────────────────────────────────────────────────────

function buildVoids() {
  let voidIdx = 0

  for (const v of VOIDS) {
    const pos = voidScenePos(v)
    const r   = voidSceneRadius(v)
    if (r < 0.2) continue   // skip tiny/zero-radius

    // Fill — very faint dark interior
    const fillGeo = new THREE.SphereGeometry(r, 24, 16)
    const fillMat = new THREE.MeshBasicMaterial({
      color: v.color, transparent: true, opacity: 0.04,
      side: THREE.BackSide, depthWrite: false,
    })
    const fill = new THREE.Mesh(fillGeo, fillMat)
    fill.position.copy(pos)
    pageGroup.add(fill)

    // Wireframe shell
    const wireGeo = new THREE.SphereGeometry(r, 20, 12)
    const wireMat = new THREE.MeshBasicMaterial({
      color: v.color === 0x00050e ? 0x001133 : v.color,
      wireframe: true, transparent: true, opacity: 0.03, depthWrite: false,
    })
    const wire = new THREE.Mesh(wireGeo, wireMat)
    wire.position.copy(pos)
    pageGroup.add(wire)

    // Invisible hit sphere for raycasting — skip KBC (camera is inside it)
    if (v.distMpc > 0) {
      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 12, 8),
        new THREE.MeshBasicMaterial({ visible: false, side: THREE.FrontSide }),
      )
      hitMesh.position.copy(pos)
      pageGroup.add(hitMesh)
      hitTargets.push({
        mesh:  hitMesh,
        label: { name: v.name, type: 'Cosmic Void', detail: `${v.radiusMpc} Mpc radius` },
        info:  {
          name:      v.name,
          type:      'Cosmic Void',
          icon:      'mdi-circle-outline',
          iconColor: '#334466',
          isVoid:    true,
          cosmicVoid: v,
          details: {
            'Radius':      `${v.radiusMpc} Mpc`,
            'Distance':    `${v.distMpc} Mpc`,
            'Conduit':     v.hasConduit ? 'Yes — wormhole transit available' : 'No',
          },
        },
      })
    }

    // ── Aetheric lens: iridescent Fresnel membrane on larger voids ────────────
    if (r >= 0.4) {
      const [hslA, hslB] = VOID_PAIRS[voidIdx % VOID_PAIRS.length]!
      const colA = new THREE.Color().setHSL(...hslA)
      const colB = new THREE.Color().setHSL(...hslB)

      const uniforms: VoidUniforms = {
        uTime:       { value: 0 },
        uColor:      { value: colA },
        uColor2:     { value: colB },
        uPointer:    { value: new THREE.Vector2(0, 0) },
        uPointerStr: { value: 0 },
      }
      voidUniforms.push(uniforms)

      const lensMat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader:   VOID_VERT,
        fragmentShader: VOID_FRAG,
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
      })
      const shell = new THREE.Mesh(new THREE.SphereGeometry(r * 0.97, 48, 32), lensMat)
      shell.position.copy(pos)
      pageGroup.add(shell)

      // True void emptiness — dark inner fill
      const inner = new THREE.Mesh(
        new THREE.SphereGeometry(r * 0.96, 14, 10),
        new THREE.MeshBasicMaterial({
          color: 0x000106, transparent: true, opacity: 0.08,
          side: THREE.BackSide, depthWrite: false,
        }),
      )
      inner.position.copy(pos)
      pageGroup.add(inner)
    }

    voidIdx++

    // Void label sprite (circle billboard)
    addTextMarker(pos.clone().setY(pos.y + r * 0.85), v.name, 0x334466, 0.8)
  }
}

// ── Cosmic web filaments ──────────────────────────────────────────────────────

function buildFilaments() {
  const clusterMap = new Map<string, CosmicCluster>()
  CLUSTERS.forEach(c => clusterMap.set(c.name, c))

  const drawn = new Set<string>()

  for (const c of CLUSTERS) {
    if (!c.filaments) continue
    for (const targetName of c.filaments) {
      const key = [c.name, targetName].sort().join('↔')
      if (drawn.has(key)) continue
      drawn.add(key)

      const target = clusterMap.get(targetName)
      if (!target) continue

      const a = clusterScenePos(c)
      const b = clusterScenePos(target)

      // Arc: midpoint offset perpendicular to chord
      const mid  = a.clone().lerp(b, 0.5)
      const perp = new THREE.Vector3(
        -(b.z - a.z), Math.abs(b.y - a.y) * 0.3 + 0.8, (b.x - a.x)
      ).normalize().multiplyScalar(a.distanceTo(b) * 0.12)
      mid.add(perp)

      const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
      const pts   = curve.getPoints(40)
      const geo   = new THREE.BufferGeometry().setFromPoints(pts)
      const mat   = new THREE.LineBasicMaterial({
        color: 0x1a3a6a, transparent: true, opacity: 0.35,
        depthWrite: false,
      })
      pageGroup.add(new THREE.Line(geo, mat))
    }
  }
}

// ── Milky Way galaxy — multi-layer procedural disk + star field ────────────────
//
// Structure modelled after known galactic parameters:
//   Disk radius:    ~50 kpc  (visualised at 1.8 scene-units for aesthetic scale)
//   Galactic bar:   ~4 kpc   (orientated ~44° from galactic lon 0°)
//   Spiral arms:    4 main (Scutum-Centaurus, Sagittarius, Perseus, Norma-Outer)
//                   Logarithmic spiral:  r(θ) = r₀ · exp(θ · tan(12°))
//   Disk normal:    galactic north pole ≈ RA 192.8°, Dec 27.1° in equatorial coords
//                   → scene direction (-0.868, 0.456, 0.199)
//   Sun position:   8.5 kpc from centre — near inner edge of Orion Spur
//
// Layers rendered (back to front):
//   1. Outer halo sphere  (large, very faint amber)
//   2. Canvas-texture disk plane  (galaxy image with arms + dust)
//   3. Points star field  (8 000 spectral-coloured stars in disk coords)
//   4. Central bar glow   (elongated bright region)
//   5. Core nucleus        (small white point)
//   6. Galactic centre PointLight

function makeMWGalaxyTexture(): THREE.CanvasTexture {
  const S  = 512
  const cx = S / 2, cy = S / 2
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')!

  // ── Layer 1: diffuse disk component ──────────────────────────────────────
  const diskGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.48)
  diskGrad.addColorStop(0.00, 'rgba(255, 250, 200, 0.00)')
  diskGrad.addColorStop(0.08, 'rgba(255, 240, 160, 0.55)')
  diskGrad.addColorStop(0.20, 'rgba(255, 220, 100, 0.30)')
  diskGrad.addColorStop(0.50, 'rgba(200, 160,  60, 0.14)')
  diskGrad.addColorStop(0.80, 'rgba(120,  90,  30, 0.07)')
  diskGrad.addColorStop(1.00, 'rgba(0,    0,    0, 0.00)')
  ctx.fillStyle = diskGrad
  ctx.fillRect(0, 0, S, S)

  // ── Layer 2: galactic bar (elongated, 44° tilt) ───────────────────────────
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(44 * Math.PI / 180)
  const barGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 0.14)
  barGrad.addColorStop(0.0, 'rgba(255, 250, 200, 0.70)')
  barGrad.addColorStop(0.3, 'rgba(255, 230, 140, 0.40)')
  barGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)')
  ctx.scale(1.0, 0.30)   // elongate along rotated x-axis
  ctx.fillStyle = barGrad
  ctx.fillRect(-S * 0.20, -S * 0.20, S * 0.40, S * 0.40)
  ctx.restore()

  // ── Layer 3: four logarithmic spiral arms ─────────────────────────────────
  // Arm parameters: [startAngle, hue, opacity, width]
  const ARMS: [number, string, number, number][] = [
    [0.00, '255,220,130', 0.30, 28],   // Scutum-Centaurus
    [Math.PI * 0.50, '240,200,110', 0.24, 24],   // Sagittarius
    [Math.PI * 1.00, '255,240,160', 0.22, 22],   // Perseus
    [Math.PI * 1.50, '220,180, 80', 0.18, 20],   // Norma-Outer
  ]
  const PITCH_TAN = Math.tan(12 * Math.PI / 180)   // 12° pitch angle

  for (const [startAngle, rgb, alpha, width] of ARMS) {
    // Primary arm stroke
    ctx.beginPath()
    let first = true
    for (let t = 0; t < Math.PI * 2.8; t += 0.03) {
      const r     = S * 0.055 * Math.exp(t * PITCH_TAN)
      if (r > S * 0.49) break
      const angle = t + startAngle
      const x     = cx + r * Math.cos(angle)
      const y     = cy + r * Math.sin(angle)
      if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `rgba(${rgb},${alpha})`
    ctx.lineWidth   = width
    ctx.lineCap     = 'round'
    ctx.stroke()

    // Bright core of arm (narrower, brighter)
    ctx.beginPath()
    first = true
    for (let t = 0.2; t < Math.PI * 2.6; t += 0.03) {
      const r     = S * 0.055 * Math.exp(t * PITCH_TAN)
      if (r > S * 0.45) break
      const angle = t + startAngle
      const x     = cx + r * Math.cos(angle)
      const y     = cy + r * Math.sin(angle)
      if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `rgba(${rgb},${(alpha * 0.65).toFixed(3)})`
    ctx.lineWidth   = width * 0.35
    ctx.stroke()

    // HII region bright knots along the arm
    const rngKnot = mulberry32(startAngle * 1000)
    for (let k = 0; k < 8; k++) {
      const t2    = rngKnot() * Math.PI * 2.0 + 0.3
      const r2    = S * 0.055 * Math.exp(t2 * PITCH_TAN) * (0.85 + rngKnot() * 0.30)
      if (r2 > S * 0.48) continue
      const angle2 = t2 + startAngle + (rngKnot() - 0.5) * 0.25
      const kx     = cx + r2 * Math.cos(angle2)
      const ky     = cy + r2 * Math.sin(angle2)
      const kSize  = 4 + rngKnot() * 12
      const kGrad  = ctx.createRadialGradient(kx, ky, 0, kx, ky, kSize)
      kGrad.addColorStop(0, `rgba(${rgb},${(alpha * 1.8).toFixed(2)})`)
      kGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = kGrad
      ctx.beginPath(); ctx.arc(kx, ky, kSize, 0, Math.PI * 2); ctx.fill()
    }
  }

  // ── Layer 4: dust lane darkenings between arms ─────────────────────────────
  ctx.globalCompositeOperation = 'multiply'
  for (let arm = 0; arm < 4; arm++) {
    const dustAngle = (arm + 0.5) / 4 * Math.PI * 2
    ctx.beginPath()
    let first = true
    for (let t = 0.5; t < Math.PI * 2.5; t += 0.04) {
      const r     = S * 0.065 * Math.exp(t * PITCH_TAN)
      if (r > S * 0.44) break
      const angle = t + dustAngle
      const x     = cx + r * Math.cos(angle)
      const y     = cy + r * Math.sin(angle)
      if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = 'rgba(30, 10, 0, 0.55)'
    ctx.lineWidth   = 14
    ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'

  // ── Layer 5: individual star dots ─────────────────────────────────────────
  const rngS = mulberry32(99999)
  const STAR_COLORS = [
    [180, 200, 255],  // O/B blue-white
    [220, 235, 255],  // A white
    [255, 255, 230],  // F pale yellow
    [255, 240, 180],  // G solar yellow
    [255, 200, 100],  // K orange
    [255, 140,  60],  // M red-orange
  ]
  for (let i = 0; i < 4000; i++) {
    // Place stars in disk with spiral arm bias
    const arm    = Math.floor(rngS() * 4)
    const t      = rngS() * Math.PI * 2.5
    const r      = S * 0.055 * Math.exp(t * PITCH_TAN) * (0.7 + rngS() * 0.6)
    if (r > S * 0.49) continue
    const spread = (rngS() - 0.5) * S * 0.14
    const angle  = t + (arm / 4) * Math.PI * 2 + (rngS() - 0.5) * 0.45
    const sx     = cx + r * Math.cos(angle) + spread
    const sy     = cy + r * Math.sin(angle) + spread

    const starType = Math.floor(rngS() * STAR_COLORS.length)
    const [sr, sg, sb] = STAR_COLORS[starType]!
    const opac   = 0.30 + rngS() * 0.70
    const size   = 0.4 + rngS() * 1.2

    ctx.fillStyle = `rgba(${sr},${sg},${sb},${opac.toFixed(2)})`
    ctx.beginPath()
    ctx.arc(sx, sy, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // ── Layer 6: nuclear star cluster / galactic centre ───────────────────────
  const nucGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.025)
  nucGrad.addColorStop(0, 'rgba(255,255,240,1.0)')
  nucGrad.addColorStop(0.4,'rgba(255,240,180,0.90)')
  nucGrad.addColorStop(1,  'rgba(255,200, 80,0.00)')
  ctx.fillStyle = nucGrad
  ctx.fillRect(0, 0, S, S)

  // ── Layer 7: bulge glow ───────────────────────────────────────────────────
  const bulgeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.10)
  bulgeGrad.addColorStop(0,   'rgba(255,250,200,0.75)')
  bulgeGrad.addColorStop(0.35,'rgba(255,230,140,0.50)')
  bulgeGrad.addColorStop(0.70,'rgba(255,200, 80,0.25)')
  bulgeGrad.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = bulgeGrad
  ctx.fillRect(0, 0, S, S)

  const tex = new THREE.CanvasTexture(cv)
  tex.generateMipmaps = false
  tex.minFilter       = THREE.LinearFilter
  return tex
}

function buildMilkyWayGalaxy(
  pos:     THREE.Vector3,
  c:       CosmicCluster,
  scColor: string | undefined,
) {
  const col = new THREE.Color(c.color)
  const DISK_R = 1.80   // visual scene-unit radius (artistically enlarged; true MW = 0.003 su)

  // ── Galactic disk orientation ─────────────────────────────────────────────
  // North galactic pole: RA 192.8°, Dec 27.1° → equatorial Cartesian
  const NGP_RA  = 192.8 * Math.PI / 180
  const NGP_DEC =  27.1 * Math.PI / 180
  const galNormal = new THREE.Vector3(
    Math.cos(NGP_DEC) * Math.cos(NGP_RA),    // ≈ -0.868
    Math.sin(NGP_DEC),                        // ≈  0.456
    -Math.cos(NGP_DEC) * Math.sin(NGP_RA),   // ≈  0.199
  ).normalize()
  const diskQuat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), galNormal
  )

  // ── 1. Outer stellar halo (very faint, large) ─────────────────────────────
  const haloMesh = new THREE.Mesh(
    new THREE.SphereGeometry(DISK_R * 0.85, 12, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffe8a0, transparent: true, opacity: 0.045,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }),
  )
  haloMesh.position.copy(pos)
  pageGroup.add(haloMesh)

  // ── 2. Canvas-texture galaxy disk ─────────────────────────────────────────
  const galTex  = makeMWGalaxyTexture()
  const diskMesh = new THREE.Mesh(
    new THREE.CircleGeometry(DISK_R, 128),
    new THREE.MeshBasicMaterial({
      map: galTex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }),
  )
  diskMesh.position.copy(pos)
  diskMesh.quaternion.copy(diskQuat)
  pageGroup.add(diskMesh)

  // ── 3. 3D star particle field distributed in disk coords ─────────────────
  const STAR_N = 8000
  const starPos: number[] = [], starCol: number[] = []
  const rng    = mulberry32(42042)
  const PITCH  = Math.tan(12 * Math.PI / 180)

  // Spectral colour palette
  const S_COLS: [number, number, number][] = [
    [0.70, 0.78, 1.00],  // O/B
    [0.86, 0.92, 1.00],  // A
    [1.00, 1.00, 0.90],  // F
    [1.00, 0.94, 0.70],  // G
    [1.00, 0.78, 0.39],  // K
    [1.00, 0.55, 0.24],  // M
  ]

  for (let i = 0; i < STAR_N; i++) {
    const arm   = Math.floor(rng() * 4)
    const t     = rng() * Math.PI * 2.5
    const r     = DISK_R * 0.11 * Math.exp(t * PITCH) * (0.65 + rng() * 0.70)
    if (r > DISK_R * 0.98) continue

    const spread = (rng() - 0.5) * DISK_R * 0.18
    const angle  = t + (arm / 4) * Math.PI * 2 + (rng() - 0.5) * 0.5

    // Local disk coords: x/z in disk plane, y = vertical thickness
    const lx = r * Math.cos(angle) + spread
    const lz = r * Math.sin(angle) + spread
    const ly = (rng() - 0.5) * DISK_R * 0.06   // disk scale height

    // Rotate into world coords using disk quaternion
    const lv = new THREE.Vector3(lx, ly, lz).applyQuaternion(diskQuat)
    starPos.push(pos.x + lv.x, pos.y + lv.y, pos.z + lv.z)

    const typeIdx = Math.min(S_COLS.length - 1, Math.floor(rng() * (rng() > 0.3 ? 4 : 6)))
    const [sr, sg, sb] = S_COLS[typeIdx]!
    const br = 0.25 + rng() * 0.75
    starCol.push(sr * br, sg * br, sb * br)
  }

  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3))
  starGeo.setAttribute('color',    new THREE.Float32BufferAttribute(starCol, 3))
  const starPts = new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 0.009, vertexColors: true, sizeAttenuation: true,
    transparent: true, opacity: 0.72, depthWrite: false,
    blending: THREE.AdditiveBlending,
    map: getCirclePointTexture(),
  }))
  pageGroup.add(starPts)

  // ── 4. Central bar glow (elongated along bar direction) ───────────────────
  const barGeo = new THREE.SphereGeometry(DISK_R * 0.12, 12, 8)
  barGeo.scale(1.0, 0.28, 3.0)   // squash + elongate along local z
  const barMesh = new THREE.Mesh(barGeo, new THREE.MeshBasicMaterial({
    color: 0xfff0b0, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }))
  barMesh.position.copy(pos)
  barMesh.quaternion.copy(diskQuat)
  barMesh.rotateZ(44 * Math.PI / 180)   // bar tilt within disk plane
  pageGroup.add(barMesh)

  // ── 5. Nuclear star cluster (bright core) ────────────────────────────────
  const coreGrad = new THREE.Mesh(
    new THREE.SphereGeometry(DISK_R * 0.04, 12, 10),
    new THREE.MeshBasicMaterial({
      color: 0xfffff0, transparent: true, opacity: 0.92,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }),
  )
  coreGrad.position.copy(pos)
  pageGroup.add(coreGrad)

  // Core outer bloom
  const coreBloom = new THREE.Mesh(
    new THREE.SphereGeometry(DISK_R * 0.12, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffe8a0, transparent: true, opacity: 0.32,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }),
  )
  coreBloom.position.copy(pos)
  pageGroup.add(coreBloom)

  // ── 6. PointLight ─────────────────────────────────────────────────────────
  const light = new THREE.PointLight(col, 1.5, DISK_R * 18)
  light.position.copy(pos)
  pageGroup.add(light)

  // ── Hit sphere (invisible, same position, for click detection) ────────────
  const hitMesh = new THREE.Mesh(
    new THREE.SphereGeometry(DISK_R * 0.30, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false }),
  )
  hitMesh.position.copy(pos)
  pageGroup.add(hitMesh)

  hitTargets.push({
    mesh: hitMesh,
    label: { name: 'Milky Way', type: 'Our home galaxy — click to enter', detail: 'Milky Way star map' },
    info: {
      name: 'Milky Way', type: 'Our Galaxy',
      icon: 'scatter_plot', iconColor: 'amber',
      supercluster: c.supercluster, scColor,
      details: {
        'Disk radius':     '~50 kpc',
        'Spiral arms':     '4 (Perseus · Sagittarius · Scutum · Norma)',
        'Bar angle':       '44° from Gal. lon. 0°',
        'Sun position':    '8.5 kpc from centre',
        'Total stars':     '~200–400 billion',
      },
      isMilkyWay: true,
    },
  })
}

// ── Galaxy clusters ───────────────────────────────────────────────────────────

function buildClusters() {
  for (const c of CLUSTERS) {
    const pos  = clusterScenePos(c)
    const isMW = c.name === 'Milky Way'
    const col  = new THREE.Color(c.color)
    const sc   = lookupSupercluster(c.name)
    const scColor = sc ? '#' + new THREE.Color(sc.color).getHexString() : undefined

    if (isMW) {
      buildMilkyWayGalaxy(pos, c, scColor)

    } else {
      // Named cluster: morphology-typed overview sprite + wireframe boundary + hit sphere
      const physR      = (0.4 + c.richness * 0.28) * MPC_SCALE
      const spriteSize = Math.max(0.22, 0.14 + c.richness * 0.042)

      const sprite = c.clusterType
        ? makeNamedClusterSprite(
            c.clusterType,
            col,
            c.richness,
            spriteSize,
            c.orientDeg  ?? 0,
            c.axisRatio  ?? 1.0,
          )
        : makeGalaxySprite(col, c.richness, spriteSize, 1.3)
      sprite.position.copy(pos)
      pageGroup.add(sprite)

      // Dark matter halo — faint additive purple sphere at 4.5× physical radius
      const dmR   = physR * 4.5
      const dmMat = new THREE.MeshBasicMaterial({
        color:       0x4422aa,
        transparent: true,
        opacity:     0.028,
        depthWrite:  false,
        blending:    THREE.AdditiveBlending,
        side:        THREE.BackSide,
      })
      const dmMesh = new THREE.Mesh(new THREE.SphereGeometry(dmR, 14, 10), dmMat)
      dmMesh.position.copy(pos)
      pageGroup.add(dmMesh)

      // Invisible hit sphere — slightly larger than sprite for comfortable clicking
      const hitR   = Math.max(0.10, spriteSize * 0.55)
      const hitGeo = new THREE.SphereGeometry(hitR, 5, 5)
      const hitMat = new THREE.MeshBasicMaterial({ visible: false })
      const hitMesh = new THREE.Mesh(hitGeo, hitMat)
      hitMesh.position.copy(pos)
      pageGroup.add(hitMesh)

      hitTargets.push({
        mesh: hitMesh,
        label: { name: c.name, type: 'Galaxy Cluster', detail: `${c.distMpc} Mpc` },
        info: {
          name:         c.name,
          type:         'Galaxy Cluster',
          icon:         'mdi-star-circle',
          iconColor:    'cyan-4',
          supercluster: c.supercluster,
          scColor,
          details: {
            'Distance':      `${c.distMpc} Mpc`,
            'Richness':      `${c.richness} / 10`,
            ...(c.virialMassMsun   ? { 'Virial mass':  c.virialMassMsun }                      : {}),
            ...(c.dmHaloRadiusMpc  ? { 'DM halo r₂₀₀': `${c.dmHaloRadiusMpc} Mpc` }           : {}),
            ...(c.dmFraction       ? { 'Dark matter':   `${Math.round(c.dmFraction * 100)}%` }  : {}),
            'Connected':     c.filaments?.join(', ') ?? '—',
          },
        },
      })

      const lodEntry: NamedClusterLodEntry = { cluster: c, pos: pos.clone(), physR, starGroup: null, sprite, bgMeshes: [] }
      namedLodEntries.push(lodEntry)

      if (c.brightGalaxies?.length) buildBrightGalaxies(c, pos, col, lodEntry)
    }
  }
}

function buildBrightGalaxies(cluster: CosmicCluster, clusterPos: THREE.Vector3, baseCol: THREE.Color, lodEntry: NamedClusterLodEntry) {
  const bgCol = baseCol.clone().lerp(new THREE.Color(0xffffff), 0.35)

  for (const bg of cluster.brightGalaxies!) {
    const bgPos = clusterPos.clone().add(
      new THREE.Vector3(bg.offset[0], bg.offset[1], bg.offset[2])
    )

    // Small glowing orb
    const geo = new THREE.SphereGeometry(0.07, 8, 8)
    const mat = new THREE.MeshStandardMaterial({
      color: bgCol, emissive: bgCol, emissiveIntensity: 1.4,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(bgPos)
    pageGroup.add(mesh)
    lodEntry.bgMeshes.push(mesh)

    // Additive halo
    const haloGeo = new THREE.SphereGeometry(0.18, 6, 6)
    const haloMat = new THREE.MeshBasicMaterial({
      color: bgCol, transparent: true, opacity: 0.12,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const halo = new THREE.Mesh(haloGeo, haloMat)
    halo.position.copy(bgPos)
    pageGroup.add(halo)
    lodEntry.bgMeshes.push(halo)

    // Black hole ring — for galaxies with a confirmed/estimated SMBH
    if (bg.bhType) {
      const isUltra   = bg.bhType === 'ULSMBH'
      const ringR     = isUltra ? 0.12 : 0.08
      const ringColor = isUltra ? 0xff9933 : bg.bhType === 'AGN' ? 0x88ffcc : 0x8899ff
      const ringGeo   = new THREE.TorusGeometry(ringR, ringR * 0.16, 8, 40)
      const ringMat   = new THREE.MeshBasicMaterial({
        color:       ringColor,
        transparent: true,
        opacity:     isUltra ? 0.70 : 0.45,
        depthWrite:  false,
        blending:    THREE.AdditiveBlending,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(bgPos)
      ring.rotation.x = Math.PI / 2 + 0.42   // ~24° tilt to show ring perspective
      pageGroup.add(ring)
      bhRingMeshes.push(ring)

      // For ultra-massive BHs: add a sharp photon-sphere point and wider disk glow
      if (isUltra) {
        const photonMat = new THREE.MeshBasicMaterial({
          color: 0xffffff, transparent: true, opacity: 0.88,
          depthWrite: false, blending: THREE.AdditiveBlending,
        })
        const photon = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), photonMat)
        photon.position.copy(bgPos)
        pageGroup.add(photon)

        const diskMat = new THREE.MeshBasicMaterial({
          color: 0xff7700, transparent: true, opacity: 0.12,
          depthWrite: false, blending: THREE.AdditiveBlending,
        })
        const disk = new THREE.Mesh(new THREE.TorusGeometry(ringR * 1.6, ringR * 0.50, 5, 32), diskMat)
        disk.position.copy(bgPos)
        disk.rotation.x = Math.PI / 2 + 0.42
        pageGroup.add(disk)
      }
    }

    hitTargets.push({
      mesh,
      label: { name: bg.name, type: bg.type, detail: bg.bhMass ?? bg.lum },
      info: {
        name:            bg.name,
        type:            bg.type,
        icon:            bg.bhType ? 'mdi-circle-double' : 'mdi-star-four-points',
        iconColor:       bg.bhType === 'ULSMBH' ? 'amber-4' : 'amber-3',
        isBrightGalaxy:  true,
        isBH:            !!bg.bhType,
        details: {
          'Cluster':     cluster.name,
          'Class':       bg.type,
          ...(bg.lum    ? { 'Luminosity': bg.lum }  : {}),
          ...(bg.bhMass ? { 'Black hole mass': bg.bhMass } : {}),
          ...(bg.bhType === 'ULSMBH' ? { 'BH class': 'Ultra-massive (≥ 10⁹ M☉)' }
            : bg.bhType === 'SMBH'   ? { 'BH class': 'Supermassive BH' }
            : bg.bhType === 'AGN'    ? { 'BH class': 'Active galactic nucleus' }
            : {}),
          'Distance':    `${cluster.distMpc} Mpc`,
        },
      },
    })
  }
}

// ── Wormhole conduit markers ──────────────────────────────────────────────────

function buildConduitMarkers() {
  const conduits = buildConduits()

  for (const conduit of conduits) {
    const pos = conduit.pos.clone().multiplyScalar(1 / 15)  // Mpc → scene units

    // Shared material for both pyramid halves — changing it affects both simultaneously
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.2,
    })

    // Upper pyramid — taller, pointing up; this is the primary hit + conduitMeshes entry
    const upperGeo = new THREE.ConeGeometry(0.13, 0.20, 4)
    const upper = new THREE.Mesh(upperGeo, mat)
    upper.position.copy(pos)
    upper.userData = { conduit }
    pageGroup.add(upper)
    conduitMeshes.push(upper)

    // Edge wireframe on upper for 3D depth definition
    const edgesGeo = new THREE.EdgesGeometry(upperGeo)
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x80ffff, transparent: true, opacity: 0.55 })
    upper.add(new THREE.LineSegments(edgesGeo, edgesMat))

    // Lower pyramid — shorter, inverted; shares material so mode color changes propagate
    const lowerGeo = new THREE.ConeGeometry(0.13, 0.14, 4)
    const lower = new THREE.Mesh(lowerGeo, mat)
    lower.position.copy(pos)
    lower.position.y -= 0.17   // base joins upper base at pos.y - 0.10; tip at pos.y - 0.24
    lower.rotation.x = Math.PI
    lower.userData = { conduit }
    pageGroup.add(lower)
    conduitLowerMeshes.push(lower)

    // Compact ring glow at the waist of the double pyramid
    const ringGeo = new THREE.RingGeometry(0.17, 0.25, 20)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff, side: THREE.DoubleSide, transparent: true,
      opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.copy(pos).setY(pos.y - 0.08)
    ring.rotation.x = -Math.PI / 2
    pageGroup.add(ring)

    // Hit targets — register both halves so click on lower half also selects
    const info: SelectedInfo = {
      name:             conduit.name,
      type:             'Wormhole Conduit',
      icon:             'mdi-hexagon-outline',
      iconColor:        'cyan-4',
      details: {
        'Void':     conduit.voidName,
        'Position': `${conduit.pos.x.toFixed(0)}, ${conduit.pos.y.toFixed(0)}, ${conduit.pos.z.toFixed(0)} Mpc`,
        'Access':   'Open — transit direct from cosmic view',
        'Range':    'Unlimited (void-edge routing)',
      },
      isConduit:        true,
      conduitVoidName:  conduit.voidName,
    }
    const label = { name: conduit.name, type: 'Wormhole Conduit', detail: conduit.voidName }
    hitTargets.push({ mesh: upper, label, info })
    hitTargets.push({ mesh: lower, label, info })
  }
}

// ── Supercluster boundaries + Great Attractor ─────────────────────────────────

function buildSuperclusters() {
  // ── Laniakea boundary: wireframe sphere centred on Milky Way (we're inside it) ──
  const laniR = LANIAKEA_EXTENT_MPC * MPC_SCALE   // ~10.7 scene units
  const laniGeo = new THREE.SphereGeometry(laniR, 20, 14)
  const laniMat = new THREE.MeshBasicMaterial({
    color: 0x2244cc, wireframe: true, transparent: true, opacity: 0.022, depthWrite: false,
  })
  pageGroup.add(new THREE.Mesh(laniGeo, laniMat))
  addTextMarker(new THREE.Vector3(0, laniR * 0.88, 0), 'Laniakea Boundary ~160 Mpc', 0x2244cc, 0.38)

  // ── Great Attractor: converging pulse rings at Norma Cluster position ─────────
  const gaPos = (() => {
    const ra  = (GREAT_ATTRACTOR.raDeg  * Math.PI) / 180
    const dec = (GREAT_ATTRACTOR.decDeg * Math.PI) / 180
    return new THREE.Vector3(
      GREAT_ATTRACTOR.distMpc * Math.cos(dec) * Math.cos(ra),
      GREAT_ATTRACTOR.distMpc * Math.sin(dec),
      -GREAT_ATTRACTOR.distMpc * Math.cos(dec) * Math.sin(ra),
    ).multiplyScalar(MPC_SCALE)
  })()

  // Three concentric rings, each slightly larger and more transparent
  const gaRingRadii   = [0.32, 0.55, 0.88]
  const gaRingOpacity = [0.22, 0.14, 0.07]
  for (let ri = 0; ri < gaRingRadii.length; ri++) {
    const r       = gaRingRadii[ri]!
    const ringGeo = new THREE.RingGeometry(r * 0.82, r, 36)
    const ringMat = new THREE.MeshBasicMaterial({
      color:       0xff7722,
      side:        THREE.DoubleSide,
      transparent: true,
      opacity:     gaRingOpacity[ri]!,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.copy(gaPos)
    ring.rotation.x = -Math.PI / 2
    pageGroup.add(ring)
    gaRingMeshes.push(ring)
  }

  // Bright convergence point at GA centre
  const gaDotGeo = new THREE.SphereGeometry(0.055, 10, 8)
  const gaDotMat = new THREE.MeshBasicMaterial({
    color: 0xffaa44, transparent: true, opacity: 0.75,
    depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const gaDotMesh = new THREE.Mesh(gaDotGeo, gaDotMat)
  gaDotMesh.position.copy(gaPos)
  pageGroup.add(gaDotMesh)

  // Outer diffuse glow
  const gaGlowGeo = new THREE.SphereGeometry(0.18, 8, 6)
  const gaGlowMat = new THREE.MeshBasicMaterial({
    color: 0xff6611, transparent: true, opacity: 0.12,
    depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const gaGlowMesh = new THREE.Mesh(gaGlowGeo, gaGlowMat)
  gaGlowMesh.position.copy(gaPos)
  pageGroup.add(gaGlowMesh)

  addTextMarker(gaPos.clone().add(new THREE.Vector3(0, 0.42, 0)), 'Great Attractor', 0xff7722, 0.60)
}

// ── X-ray cluster catalog layer ───────────────────────────────────────────────

function buildXrayClusters(clusters: XRayCluster[]) {
  for (const c of clusters) {
    const pos      = xrayClusterScenePos(c)
    const richness = tapKevToRichness(c.tapKev)
    const col      = new THREE.Color(c.colorHex)

    // Galaxy point sprite — size from X-ray temperature (richness proxy)
    const spriteSize = 0.035 + richness * 0.010
    const aspect     = 1.20 + (c.name.charCodeAt(3) % 5) * 0.10  // deterministic variety
    const visual     = makeGalaxySprite(col, richness, spriteSize, aspect)
    visual.position.copy(pos)
    pageGroup.add(visual)

    // Invisible hit sphere for raycasting
    const hitR   = Math.max(0.055, spriteSize * 0.55)
    const hitGeo = new THREE.SphereGeometry(hitR, 4, 4)
    const hitMat = new THREE.MeshBasicMaterial({ visible: false })
    const mesh   = new THREE.Mesh(hitGeo, hitMat)
    mesh.position.copy(pos)
    pageGroup.add(mesh)

    const ev       = eventForCluster(c.name)
    const hasEvent = !!ev

    // Event / settlement beacon ring (sized to sprite, not old sphere radius)
    let beaconRing: THREE.Mesh | null = null
    if (hasEvent) {
      const evColor = new THREE.Color(EVENT_TYPE_COLOR[ev!.type])
      const br      = spriteSize * 1.3
      const ringGeo = new THREE.RingGeometry(br, br * 1.35, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: evColor, side: THREE.DoubleSide,
        transparent: true, opacity: 0.7,
        depthWrite: false, blending: THREE.AdditiveBlending,
      })
      beaconRing = new THREE.Mesh(ringGeo, ringMat)
      beaconRing.position.copy(pos)
      beaconRing.rotation.x = -Math.PI / 2
      pageGroup.add(beaconRing)
    }

    const entry: XRayLodEntry = {
      cluster: c, sphere: mesh, visual, pos: pos.clone(),
      starGroup: null, beaconRing, hasEvent,
      spriteBaseSize:  spriteSize,
      bcgGlowMesh:     null,
      spriteRes:       128,
      clusterColor:    col.clone(),
      clusterRichness: richness,
      spawnProgress:   0,
      spriteAspect:    aspect,
    }
    xrayLodEntries.push(entry)

    const detailLabel = ev
      ? `${EVENT_TYPE_LABEL[ev.type]}  ·  ${ev.title}`
      : `z ${c.z.toFixed(3)}  ·  ${c.distMpc.toFixed(0)} Mpc  ·  ${c.tapKev} keV`

    hitTargets.push({
      mesh,
      label: { name: c.name, type: ev ? `${EVENT_TYPE_LABEL[ev.type]} — X-ray cluster` : 'X-ray cluster', detail: detailLabel },
      info: {
        name:      c.name,
        type:      ev ? `${EVENT_TYPE_LABEL[ev.type]} — X-ray cluster` : 'X-ray Galaxy Cluster',
        icon:      hasEvent ? 'mdi-broadcast' : 'mdi-radioactive',
        iconColor: hasEvent ? 'amber-4' : 'orange-4',
        details: {
          'Redshift':   c.z.toFixed(4),
          'Distance':   `${c.distMpc.toFixed(1)} Mpc`,
          'X-ray temp': `${c.tapKev} keV`,
          'Richness':   `${richness} / 10`,
          'Catalog':    c.source,
          ...(ev ? { 'Event': ev.title, 'Host': ev.community } : {}),
        },
        xrayCluster: c,
        ...(hasEvent ? { isXrayEvent: true, eventId: ev!.id } as any : {}),
      },
    })
  }
}

// ── Sprite resolution upgrade / downgrade ────────────────────────────────────

function upgradeClusterSprite(entry: XRayLodEntry, targetRes: number) {
  if (entry.spriteRes === targetRes) return
  // makeGalaxySprite caches by (richness, res) — rebuilding is cheap after first call
  const hiSprite = makeGalaxySprite(
    entry.clusterColor,
    entry.clusterRichness,
    entry.spriteBaseSize,
    entry.spriteAspect,
    targetRes,
  )
  // Swap the texture on the live material without touching opacity / color
  const mat = entry.visual.material as THREE.SpriteMaterial
  const old = mat.map
  mat.map = hiSprite.material.map
  mat.needsUpdate = true
  old?.dispose()
  hiSprite.material.dispose()
  entry.spriteRes = targetRes
}

function downgradeClusterSprite(entry: XRayLodEntry) {
  upgradeClusterSprite(entry, 128)
}

// ── Galaxy morphology sprite factory ─────────────────────────────────────────
//
// Each cluster member is rendered as a galaxy morphology sprite, not a star.
// Hubble sequence: cD → E → S0 → Sa → Sb → Sc → Irr
// Color temperature:  E/cD warm amber  ·  S0 neutral  ·  Sa/Sb cool white  ·  Sc/Irr blue-white

type GalMorph = 'cD' | 'E' | 'S0' | 'Sa' | 'Sb' | 'Irr'

const _galMorphCache = new Map<string, THREE.CanvasTexture>()

/**
 * Galaxy morphology sprite — OUTLINE rendering.
 *
 * Root cause of the all-white cluster view was filled blobs + AdditiveBlending:
 * hundreds of overlapping filled sprites summed to solid white.
 *
 * Fix: thin outline shapes (ellipse rings, arm curves, nucleus dots) drawn on a
 * transparent canvas, blended with NormalBlending so they composite over each other
 * without saturating. Even 500 overlapping outlines remain individually visible.
 */
function makeGalMorphSprite(morph: GalMorph, col: THREE.Color, sizeUnits: number): THREE.Sprite {
  const key = `outline_${morph}_${col.getHexString()}`
  let tex = _galMorphCache.get(key)

  if (!tex) {
    const S  = 256   // larger canvas for sharp detail on close approach
    const cx = S / 2
    const cv = document.createElement('canvas')
    cv.width = cv.height = S
    const ctx = cv.getContext('2d')!
    const [r, g, b] = [Math.round(col.r*255), Math.round(col.g*255), Math.round(col.b*255)]
    const rgb = `${r},${g},${b}`

    // Circular clip — prevents square canvas corners from appearing at any scale
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cx, cx * 0.90, 0, Math.PI * 2)
    ctx.clip()

    // ── Soft Gaussian background glow (dominant when sprite is sub-pixel) ─────
    // Drawn first so the sprite reads as a round blob at far distances.
    const pk = morph === 'cD' ? 0.62 : morph === 'E' ? 0.52 : morph === 'S0' ? 0.42 : morph === 'Sa' || morph === 'Sb' ? 0.36 : 0.28
    const wPk = Math.min(1.0, pk * 1.3)
    const gGlow = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.82)
    gGlow.addColorStop(0.00, `rgba(255,255,255,${wPk.toFixed(3)})`)
    gGlow.addColorStop(0.08, `rgba(255,255,255,${(wPk * 0.72).toFixed(3)})`)
    gGlow.addColorStop(0.22, `rgba(${rgb},${pk.toFixed(3)})`)
    gGlow.addColorStop(0.52, `rgba(${rgb},${(pk * 0.38).toFixed(3)})`)
    gGlow.addColorStop(0.82, `rgba(${rgb},${(pk * 0.08).toFixed(3)})`)
    gGlow.addColorStop(1.00, `rgba(${rgb},0)`)
    ctx.fillStyle = gGlow
    ctx.fillRect(0, 0, S, S)

    // ── Morphology outline details (visible on close approach) ─────────────────

    if (morph === 'cD') {
      // Two concentric ellipse rings + bright nucleus — cD's extended stellar envelope
      ctx.beginPath()
      ctx.ellipse(cx, cx, S*0.42, S*0.42, 0, 0, Math.PI*2)
      ctx.strokeStyle = `rgba(${rgb},0.22)`; ctx.lineWidth = 2.0; ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(cx, cx, S*0.26, S*0.26, 0, 0, Math.PI*2)
      ctx.strokeStyle = `rgba(${rgb},0.58)`; ctx.lineWidth = 3.5; ctx.stroke()
      // Nucleus: bright white core
      const nc = ctx.createRadialGradient(cx,cx,0,cx,cx,S*0.09)
      nc.addColorStop(0,`rgba(255,255,255,1.0)`)
      nc.addColorStop(0.5,`rgba(${rgb},0.75)`)
      nc.addColorStop(1,`rgba(${rgb},0)`)
      ctx.fillStyle=nc; ctx.beginPath(); ctx.arc(cx,cx,S*0.09,0,Math.PI*2); ctx.fill()

    } else if (morph === 'E') {
      // Single ellipse ring + nucleus
      ctx.beginPath()
      ctx.ellipse(cx, cx, S*0.35, S*0.28, Math.PI*0.2, 0, Math.PI*2)
      ctx.strokeStyle = `rgba(${rgb},0.62)`; ctx.lineWidth = 3.0; ctx.stroke()
      // Faint glow centre
      const ng = ctx.createRadialGradient(cx,cx,0,cx,cx,S*0.12)
      ng.addColorStop(0,`rgba(255,255,255,0.95)`)
      ng.addColorStop(1,`rgba(${rgb},0)`)
      ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(cx,cx,S*0.12,0,Math.PI*2); ctx.fill()

    } else if (morph === 'S0') {
      // Elongated lenticular ellipse + thin equatorial line
      ctx.beginPath()
      ctx.ellipse(cx, cx, S*0.38, S*0.14, Math.PI*0.15, 0, Math.PI*2)
      ctx.strokeStyle = `rgba(${rgb},0.65)`; ctx.lineWidth = 2.5; ctx.stroke()
      // Edge-on dust lane hint
      ctx.beginPath()
      ctx.moveTo(cx - S*0.36, cx); ctx.lineTo(cx + S*0.36, cx)
      ctx.strokeStyle = `rgba(${rgb},0.18)`; ctx.lineWidth = 1.2; ctx.stroke()
      // Nucleus
      const ng2 = ctx.createRadialGradient(cx,cx,0,cx,cx,S*0.09)
      ng2.addColorStop(0,`rgba(255,255,255,0.90)`); ng2.addColorStop(1,`rgba(${rgb},0)`)
      ctx.fillStyle=ng2; ctx.beginPath(); ctx.arc(cx,cx,S*0.09,0,Math.PI*2); ctx.fill()

    } else if (morph === 'Sa' || morph === 'Sb') {
      // Thin disk ellipse + 2 logarithmic arm curves + nucleus
      const incl = 0.60   // cos(inclination) — moderately inclined
      const pitch = morph === 'Sa' ? 0.20 : 0.30

      // Disk outline
      ctx.beginPath()
      ctx.ellipse(cx, cx, S*0.38, S*0.38*incl, 0, 0, Math.PI*2)
      ctx.strokeStyle = `rgba(${rgb},0.38)`; ctx.lineWidth = 2.0; ctx.stroke()

      // Spiral arms
      for (let arm = 0; arm < 2; arm++) {
        ctx.beginPath(); let first = true
        for (let t = 0.3; t < Math.PI * 1.6; t += 0.06) {
          const ar = S * 0.04 * Math.exp(t * pitch)
          if (ar > S*0.37) break
          const ax = cx + ar * Math.cos(t + arm * Math.PI)
          const ay = cx + ar * Math.sin(t + arm * Math.PI) * incl
          if (first) { ctx.moveTo(ax,ay); first=false } else ctx.lineTo(ax,ay)
        }
        ctx.strokeStyle = `rgba(${rgb},0.55)`; ctx.lineWidth = 2.8; ctx.stroke()
      }

      // HII region knots along arms
      for (let k = 0; k < 4; k++) {
        const t2 = 0.5 + k * 0.5
        const kr  = S * 0.04 * Math.exp(t2 * pitch)
        if (kr > S*0.35) continue
        const kx = cx + kr * Math.cos(t2)
        const ky = cx + kr * Math.sin(t2) * incl
        ctx.fillStyle = `rgba(${rgb},0.75)`
        ctx.beginPath(); ctx.arc(kx, ky, 3.5, 0, Math.PI*2); ctx.fill()
      }

      // Nucleus
      const na = ctx.createRadialGradient(cx,cx,0,cx,cx,S*0.07)
      na.addColorStop(0,`rgba(255,255,255,0.95)`); na.addColorStop(1,`rgba(${rgb},0)`)
      ctx.fillStyle=na; ctx.beginPath(); ctx.arc(cx,cx,S*0.07,0,Math.PI*2); ctx.fill()

    } else {
      // Irr — 3 separate bright knots (star-forming regions), no smooth outline
      const knots = [[cx-S*0.10, cx+S*0.06],[cx+S*0.12, cx-S*0.04],[cx-S*0.03, cx-S*0.12]]
      for (const [kx, ky] of knots) {
        ctx.fillStyle = `rgba(${rgb},0.70)`
        ctx.beginPath(); ctx.arc(kx, ky, S*0.07, 0, Math.PI*2); ctx.fill()
        // Connecting faint nebular wisps
        ctx.strokeStyle = `rgba(${rgb},0.18)`; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(kx,ky); ctx.lineTo(cx,cx); ctx.stroke()
      }
    }

    ctx.restore()  // end circular clip

    tex = new THREE.CanvasTexture(cv)
    tex.generateMipmaps = false
    tex.minFilter       = THREE.LinearFilter
    _galMorphCache.set(key, tex)
  }

  const mat    = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.setScalar(sizeUnits)
  return sprite
}

/**
 * Assign Hubble morphology from cluster-centric radius fraction (morphology-density relation).
 * Dense core: E/cD dominated; outer regions: more spirals and irregulars.
 */
function pickMorphology(rng: () => number, rFrac: number, isBcg: boolean): GalMorph {
  if (isBcg) return 'cD'
  const x = rng()
  if (rFrac < 0.30) return x < 0.65 ? 'E' : x < 0.90 ? 'S0' : 'Sa'
  if (rFrac < 0.65) return x < 0.48 ? 'E' : x < 0.78 ? 'S0' : x < 0.92 ? 'Sa' : 'Irr'
  return x < 0.30 ? 'E' : x < 0.55 ? 'S0' : x < 0.80 ? 'Sa' : x < 0.92 ? 'Sb' : 'Irr'
}

/** Warm/cool colour per morphology */
function morphColor(morph: GalMorph, base: THREE.Color): THREE.Color {
  const c = base.clone()
  if (morph === 'cD' || morph === 'E') return c.lerp(new THREE.Color(0xffe0a0), 0.55)
  if (morph === 'S0')                   return c.lerp(new THREE.Color(0xfff5e0), 0.25)
  if (morph === 'Sa')                   return c.lerp(new THREE.Color(0xe0f0ff), 0.30)
  if (morph === 'Sb')                   return c.lerp(new THREE.Color(0xc0e0ff), 0.40)
  return c.lerp(new THREE.Color(0xa0c8ff), 0.55)   // Irr — bluer
}

/** Flatten spiral galaxies on the sky (they're disk-like — foreshortened unless face-on) */
function applyGalaxyInclination(sprite: THREE.Sprite, morph: GalMorph, rng: () => number) {
  if (morph === 'S0' || morph === 'Sa' || morph === 'Sb' || morph === 'Irr') {
    const incl = rng() * Math.PI   // random inclination
    const q    = 0.2 + Math.abs(Math.cos(incl)) * 0.8   // axis ratio
    sprite.scale.y *= q
  }
}

// ── Cluster galaxy-member LOD spawn ───────────────────────────────────────────
// Oracle-first: load pre-generated member data from public/galaxy-oracle/{id}.json.
// Falls back to inline procedural generation when the oracle file is absent.

function spawnStarField(entry: XRayLodEntry) {
  if (entry.starGroup) return

  // Build the group immediately — oracle replaces members async when it arrives.
  // Procedural sprites are shown first so the cluster is never visually empty.
  const baseCol = new THREE.Color(entry.clusterColor)
  const group   = new THREE.Group()
  group.position.copy(entry.pos)
  entry.starGroup    = group
  entry.spawnProgress = 0
  pageGroup.add(group)

  _spawnProceduralMembers(entry, group, baseCol)

  // Attempt to replace procedurals with oracle data (same pattern as named catalogs)
  void loadOracleCluster(entry.cluster.name).then(oracle => {
    if (!oracle || !entry.starGroup) return
    // Remove procedural sprites; keep glow meshes (no morph in userData)
    const toRemove = group.children.filter(o => o.userData.morph)
    for (const o of toRemove) {
      group.remove(o)
      if ((o as THREE.Sprite).isSprite) (o as THREE.Sprite).material.dispose()
    }
    _spawnOracleMembers(entry, group, oracle.galaxies)
    syncMemberList(group, entry.cluster.name)
  })

  syncMemberList(group, entry.cluster.name)
}

/** Spawn galaxy sprites from oracle pre-generated data. */
function _spawnOracleMembers(
  entry:    XRayLodEntry,
  group:    THREE.Group,
  galaxies: OracleGalaxy[],
) {
  for (const g of galaxies) {
    const col = new THREE.Color(g.col_hex)
    const gal = makeGalMorphSprite(g.morph as GalMorph, col, g.size_su)
    gal.position.set(...g.pos_su)
    gal.scale.y *= g.axis_ratio
    const mat = gal.material as THREE.SpriteMaterial
    mat.rotation = g.rot_rad
    mat.opacity  = g.opacity

    gal.visible  = g.is_bcg
    gal.frustumCulled = false
    gal.userData = {
      morph:        g.morph,
      isBcg:        g.is_bcg,
      inSubcluster: g.in_sub,
      universeVer:  oracle_ver_from_entry(entry),
      memberId:     g.gid,
      clusterName:  entry.cluster.name,
    }

    if (g.is_bcg) {
      gsap.from(mat, { opacity: 0, duration: 0.6, ease: 'power2.out' })
    }

    // Hit proxy — oracle sprites can be tiny; invisible sphere gives a reliable click target
    const hitR    = Math.max(0.055, g.size_su * 3.5)
    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(hitR, 4, 4),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    )
    hitMesh.position.set(...g.pos_su)
    hitMesh.frustumCulled = false
    hitMesh.visible  = g.is_bcg
    hitMesh.userData = { ...gal.userData, isHitProxy: true, sprite: gal }
    group.add(hitMesh)

    group.add(gal)
  }
}

function oracle_ver_from_entry(_entry: XRayLodEntry): string {
  // Version is embedded per-cluster in the oracle file; use a placeholder here.
  // The actual ver lives in OracleCluster.universe_ver — accessible from the
  // async load context but not needed for rendering.
  return 'universe-221x'
}

/** Procedural fallback — runs immediately while oracle fetch is in flight. */
function _spawnProceduralMembers(
  entry:   XRayLodEntry,
  group:   THREE.Group,
  baseCol: THREE.Color,
) {
  const richness = tapKevToRichness(entry.cluster.tapKev)
  const distMpc  = entry.cluster.distMpc
  const tapKev   = entry.cluster.tapKev
  const rng      = seededRng(entry.cluster.name.charCodeAt(1) * 997 + entry.cluster.name.charCodeAt(Math.min(5, entry.cluster.name.length - 1)))
  const count    = 50 + Math.round(richness * 8)
  const radius   = 0.55 + richness * 0.08

  const hasSubcluster = richness >= 8
  const subAngle  = rng() * Math.PI * 2
  const subCore   = new THREE.Vector3(
    radius * 0.32 * Math.cos(subAngle), 0,
    radius * 0.32 * Math.sin(subAngle),
  )

  const zDim     = distMpc > 300 ? Math.max(0.38, 1.0 - (distMpc - 300) / 2200) : 1.0
  const zRed     = Math.min(0.42, Math.max(0, (distMpc - 800) / 2600))
  const hotBoost = Math.min(1.0, Math.max(0, (tapKev - 2.5) / 5.0))

  for (let i = 0; i < count; i++) {
    const isBcg = i === 0
    const inSub = hasSubcluster && !isBcg && rng() < 0.28

    const rFrac = isBcg ? 0.04 : Math.sqrt(rng()) * (0.15 + rng() * 0.85)
    const r     = radius * rFrac
    const theta = rng() * Math.PI * 2
    const phi   = Math.acos(2 * rng() - 1) * (1 - rFrac * 0.4)

    const morph = pickMorphology(rng, Math.max(0, rFrac - hotBoost * 0.20), isBcg)
    const col   = morphColor(morph, baseCol)
    if (zRed > 0) col.lerp(new THREE.Color(0xff7744), zRed)

    const lum = isBcg ? 2.0 : Math.min(2.5, Math.max(0.05,
      -Math.log(Math.max(0.001, rng())) * Math.pow(rng(), 0.40),
    ))
    const baseSize = morph === 'cD' ? 0.040 : morph === 'E' ? 0.012 : morph === 'S0' ? 0.010 : 0.013
    const gal = makeGalMorphSprite(morph, col, baseSize * (0.45 + lum * 0.55))

    const cx = inSub ? subCore.x : 0
    const cz = inSub ? subCore.z : 0
    gal.position.set(
      cx + r * Math.sin(phi) * Math.cos(theta),
           r * Math.sin(phi) * Math.sin(theta) * 0.65,
      cz + r * Math.cos(phi),
    )
    ;(gal.material as THREE.SpriteMaterial).rotation = rng() * Math.PI
    ;(gal.material as THREE.SpriteMaterial).opacity  = zDim * (isBcg ? 0.92 : 0.55 + lum * 0.18)
    applyGalaxyInclination(gal, morph, rng)
    gal.visible  = isBcg
    gal.frustumCulled = false
    gal.userData = {
      morph, isBcg, inSubcluster: inSub,
      memberId:    `proc-${String(i).padStart(4, '0')}`,
      clusterName: entry.cluster.name,
    }
    group.add(gal)
  }

  // Glow meshes — tagged isCoreGlow so progressiveReveal can fade them on close approach
  const bcgGlowMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffe0aa, transparent: true, opacity: 0.18,
      depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  bcgGlowMesh.frustumCulled = false
  bcgGlowMesh.userData = { isCoreGlow: true, baseOpacity: 0.18 }
  const firstSprite = group.children[0] as THREE.Sprite | undefined
  if (firstSprite) bcgGlowMesh.position.copy(firstSprite.position)
  group.add(bcgGlowMesh)
  entry.bcgGlowMesh = bcgGlowMesh

  const ambGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 7, 7),
    new THREE.MeshBasicMaterial({ color: 0xffcc88, transparent: true, opacity: 0.04,
      depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  ambGlow.frustumCulled = false
  ambGlow.userData = { isCoreGlow: true, baseOpacity: 0.04 }
  group.add(ambGlow)

  if (hasSubcluster) {
    const scGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.10, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd0a0, transparent: true, opacity: 0.12,
        depthWrite: false, blending: THREE.AdditiveBlending }),
    )
    scGlow.position.copy(subCore)
    scGlow.frustumCulled = false
    scGlow.userData = { isCoreGlow: true, baseOpacity: 0.12 }
    group.add(scGlow)
  }

  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 10),
    new THREE.MeshBasicMaterial({ color: baseCol, transparent: true, opacity: 0.22,
      depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  coreGlow.frustumCulled = false
  coreGlow.userData = { isCoreGlow: true, baseOpacity: 0.22 }
  group.add(coreGlow)

  const outerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 8),
    new THREE.MeshBasicMaterial({ color: baseCol, transparent: true, opacity: 0.07,
      depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  outerGlow.frustumCulled = false
  outerGlow.userData = { isCoreGlow: true, baseOpacity: 0.07 }
  group.add(outerGlow)
}

function despawnStarField(entry: XRayLodEntry) {
  if (!entry.starGroup) return
  scene.remove(entry.starGroup)
  entry.starGroup.traverse(o => {
    if ((o as THREE.Sprite).isSprite) {
      ;(o as THREE.Sprite).material.dispose()
    } else if ((o as THREE.Mesh).isMesh) {
      const m = o as THREE.Mesh
      m.geometry?.dispose()
      ;(m.material as THREE.Material)?.dispose()
    }
  })
  entry.starGroup    = null
  entry.bcgGlowMesh  = null
  entry.spawnProgress = 0
  clearMemberList()
  // Restore sprite
  entry.visual.visible = true
  const mat = entry.visual.material as THREE.SpriteMaterial
  mat.opacity = 0.75
  entry.visual.scale.setScalar(entry.spriteBaseSize)
  downgradeClusterSprite(entry)
}

// ── Named cluster star-field LOD ──────────────────────────────────────────────

/** Parse a galaxy type string to a Hubble morphology code */
function parseBrightGalaxyMorph(typeStr: string): GalMorph {
  const t = typeStr.toLowerCase()
  if (t.includes('cd') || t.includes('c d'))      return 'cD'
  if (t.includes('elliptical') || t.includes('lenticular') && !t.includes('spiral')) {
    if (t.includes('giant') || t.includes('bcg')) return 'cD'
    return 'E'
  }
  if (t.includes('lenticular') || t.includes('s0') || t.includes('sa0')) return 'S0'
  if (t.includes('seyfert') || t.includes('radio') || t.includes('peculiar')) return 'Sa'
  if (t.includes('spiral') || t.includes('barred')) {
    if (t.includes('a') && !t.includes('b')) return 'Sa'
    if (t.includes('b'))                     return 'Sb'
    return 'Sa'
  }
  if (t.includes('irregular')) return 'Irr'
  return 'E'   // default for unknown cluster members
}

/**
 * Place galaxy outline sprites from the pre-processed cluster member catalog.
 *
 * Visual spread multiplier (VSPREAD): the physical cluster offsets in scene units
 * are tiny (Virgo virial radius = 1.1 Mpc × 1/15 = 0.073 su). Multiplying by
 * VSPREAD expands them to a visually comfortable ~0.5 su radius — clear and
 * navigable at close approach — without changing the underlying physics.
 */
/** bt_mag → sprite opacity. BCG (mag ~9) → 0.92; faint members (mag ~16) → 0.22. */
function magToOpacity(bt_mag: number | null | undefined): number {
  if (bt_mag == null) return 0.55
  return Math.max(0.22, Math.min(0.92, 1.10 - (bt_mag - 9) * 0.10))
}

/**
 * Parse a sub-cluster or structural label from the member notes string.
 * Returns short display text or null if the galaxy needs no extra tag.
 *
 * Examples: "Virgo B subcluster BCG" → "Virgo B"
 *           "BCG-N; ~21B M☉ BH"     → "N Core"
 *           "Co-BCG; dominant core"  → "Co-BCG"
 */
function parseSubclusterTag(notes: string): string | null {
  const virgo = notes.match(/Virgo\s+([ABC])\s+subcluster/i)
  if (virgo) return `Virgo ${virgo[1]}`
  if (/BCG-N/i.test(notes)) return 'N Core'
  if (/BCG-S/i.test(notes)) return 'S Core'
  if (/Co-BCG/i.test(notes)) return 'Co-BCG'
  return null
}

function spawnCatalogMembers(group: THREE.Group, members: CatalogMember[], clusterPos: THREE.Vector3, distMpc: number, clusterName: string = '') {
  const VSPREAD  = 7.0
  const baseCol  = new THREE.Color(0xffe0b0)
  let   added    = 0

  // Clear any previous cluster's subcluster markers
  _subclusterMarkers.length = 0

  for (const m of members) {
    const morph = (m.hubble as GalMorph) ?? 'E'
    const col   = morphColor(morph, baseCol)

    const sz = m.is_named
      ? (morph === 'cD' ? 0.065 : 0.040)
      : (morph === 'E'  ? 0.026 : morph === 'Sa' || morph === 'Sb' ? 0.032 : 0.022)

    const gal = makeGalMorphSprite(morph, col, sz)

    const [ox, oy, oz] = m.offset
    gal.position.set((ox ?? 0) * VSPREAD, (oy ?? 0) * VSPREAD, (oz ?? 0) * VSPREAD)

    // ── Improvement 1: axis_ratio (existing) + pa_deg rotation ───────────────
    gal.scale.y *= m.lod3_params?.axis_ratio ?? 0.8
    const pa = m.lod3_params?.pa_deg ?? 0
    if (pa !== 0) (gal.material as THREE.SpriteMaterial).rotation = pa * Math.PI / 180

    // ── Improvement 2: bt_mag → opacity (magnitude-driven brightness) ─────────
    const targetOp = magToOpacity(m.bt_mag)
    ;(gal.material as THREE.SpriteMaterial).opacity = targetOp

    // All catalog members fade in — named ones immediately, faint ones staggered
    // Duration is longer so the wave of appearing stars blends with the dissolving fog
    gal.visible = true
    gal.frustumCulled = false
    const delay = m.is_named ? 0 : Math.min(added * 0.008, 2.0)
    ;(gal.material as THREE.SpriteMaterial).opacity = 0
    gsap.to(gal.material, { opacity: targetOp, duration: 1.4, delay, ease: 'power2.out' })

    gal.userData = {
      morph, isBcg: morph === 'cD',
      memberId:    m.id,
      catalogName: m.name ?? m.id,
      catalogType: morph,
      notes:       m.notes ?? '',
      clusterName,
      distMpc,
    }

    // ── Improvement 3: sub-cluster label detection ────────────────────────────
    if (m.is_named) {
      const tag = parseSubclusterTag(m.notes ?? '')
      if (tag) {
        // Named sub-cluster or structural role (Virgo B, N Core, Co-BCG…)
        _subclusterMarkers.push({ sprite: gal, text: tag, color: '#00e5ff' })
      } else if (morph === 'cD') {
        // Primary BCG with no further sub-cluster tag — label by name
        const label = m.name ?? m.id
        _subclusterMarkers.push({ sprite: gal, text: label, color: '#aaddff' })
      }
    }

    group.add(gal)

    // Invisible hit sphere — sprite scale is too small for reliable Sprite.raycast.
    // transparent+opacity:0 keeps visible:true so Three.js still raycasts it.
    const hitR    = Math.max(0.06, sz * 3.5)
    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(hitR, 4, 4),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    )
    hitMesh.position.copy(gal.position)
    hitMesh.frustumCulled = false
    hitMesh.userData = { ...gal.userData, isHitProxy: true, sprite: gal }
    group.add(hitMesh)

    added++
    if (added >= 300) break
  }
}

let _circlePointTex: THREE.CanvasTexture | null = null
/** Soft circular disc texture for THREE.Points — prevents square point rendering. */
function getCirclePointTexture(): THREE.CanvasTexture {
  if (_circlePointTex) return _circlePointTex
  const S = 64, c = S / 2
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')!
  const g = ctx.createRadialGradient(c, c, 0, c, c, c * 0.90)
  g.addColorStop(0.00, 'rgba(255,255,255,1.0)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.70, 'rgba(255,255,255,0.25)')
  g.addColorStop(1.00, 'rgba(255,255,255,0.0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  const tex = new THREE.CanvasTexture(cv)
  tex.generateMipmaps = false
  tex.minFilter       = THREE.LinearFilter
  _circlePointTex = tex
  return tex
}

/** Add Milky Way foreground stars from the region catalog as a faint backdrop. */
function addForegroundStarLayer(group: THREE.Group, stars: CatalogStarEntry[], _clusterPos: THREE.Vector3) {
  if (!stars.length) return
  const pos: number[] = [], col: number[] = []
  const spread = 3.0   // scene units — scatter foreground stars around the cluster
  const rng2   = seededRng(stars.length * 17 + 3)

  for (const s of stars) {
    if (s.mag > 9.5) continue
    // Positions are LOCAL to the group (which is already placed at clusterPos in world space).
    // Using clusterPos here would double-offset every foreground star by the cluster's world position.
    const theta = rng2() * Math.PI * 2, phi = Math.acos(2 * rng2() - 1)
    const r     = spread * (0.4 + rng2() * 0.8)
    pos.push(r*Math.sin(phi)*Math.cos(theta),
             r*Math.sin(phi)*Math.sin(theta),
             r*Math.cos(phi))
    const c = new THREE.Color(s.color_hex)
    const br = Math.max(0.1, 1 - s.mag / 12)
    col.push(c.r * br, c.g * br, c.b * br)
  }

  if (!pos.length) return
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.12, vertexColors: true, sizeAttenuation: true,
    transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
    map: getCirclePointTexture(),
  }))
  pts.userData = { type: 'foreground_stars' }
  group.add(pts)
}

function spawnNamedStarField(entry: NamedClusterLodEntry) {
  if (entry.starGroup) return
  const seed   = entry.cluster.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rng    = seededRng(seed)

  // Kick off async catalog load — will replace the procedural sprites when data arrives
  void loadClusterCatalog(entry.cluster.name).then(catalogMembers => {
    if (!entry.starGroup) return   // despawned before catalog arrived
    if (!catalogMembers.length) return
    // Remove procedural sprites/hit-proxies so catalog members replace them.
    // Keep foreground-star Points and isCoreGlow glow meshes.
    const toRemove = entry.starGroup!.children.filter(
      o => o.userData.type !== 'foreground_stars' && !o.userData.isCoreGlow
    )
    for (const o of toRemove) {
      entry.starGroup!.remove(o)
      if ((o as THREE.Sprite).isSprite) (o as THREE.Sprite).material.dispose()
    }
    spawnCatalogMembers(entry.starGroup!, catalogMembers, entry.pos, entry.cluster.distMpc ?? 0, entry.cluster.name)
    // Refresh navigator list with catalog sprites (they replaced the procedural ones)
    if (entry.starGroup) syncMemberList(entry.starGroup, entry.cluster.name)
  })

  void loadStarRegion(entry.cluster.name).then(foregroundStars => {
    if (!entry.starGroup) return
    addForegroundStarLayer(entry.starGroup!, foregroundStars, entry.pos)
  })
  const count  = 40 + Math.round(entry.cluster.richness * 6)
  const radius = Math.max(0.14, entry.physR * 2.8)
  const baseCol = new THREE.Color(entry.cluster.color)
  const group   = new THREE.Group()
  group.position.copy(entry.pos)

  // ── Named bright galaxies from catalog first ──────────────────────────────
  const bgs = entry.cluster.brightGalaxies ?? []
  bgs.forEach((bg, i) => {
    const morph = i === 0 ? 'cD' : parseBrightGalaxyMorph(bg.type)
    const col   = morphColor(morph, baseCol)
    const size  = i === 0 ? 0.065 : 0.032 + rng() * 0.016
    const gal   = makeGalMorphSprite(morph, col, size)

    // BrightGalaxy.offset is already in scene units (see cosmic-structures.ts interface)
    const off = bg.offset ?? [0, 0, 0]
    gal.position.set(off[0] ?? 0, off[1] ?? 0, off[2] ?? 0)
    applyGalaxyInclination(gal, morph, rng)
    gal.frustumCulled = false
    gal.userData = {
      morph, isBcg: i === 0,
      // memberId: normalise 'NGC 4889' → 'NGC4889' to match catalog id format
      memberId:    bg.name.replace(/\s+/g, ''),
      catalogName: bg.name, catalogType: bg.type,
      lum: bg.lum, clusterName: entry.cluster.name,
      distMpc: entry.cluster.distMpc,
    }
    group.add(gal)

    // Hit proxy for reliable raycasting on bright galaxy sprites
    const bgHitR    = Math.max(0.06, size * 3.5)
    const bgHitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(bgHitR, 4, 4),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    )
    bgHitMesh.position.copy(gal.position)
    bgHitMesh.frustumCulled = false
    bgHitMesh.userData = { ...gal.userData, isHitProxy: true, sprite: gal }
    group.add(bgHitMesh)
  })

  // ── Procedural faint members (morphology-density relation) ────────────────
  const faintCount = count - bgs.length
  for (let i = 0; i < faintCount; i++) {
    const rFrac  = Math.sqrt(rng()) * (0.18 + rng() * 0.82)
    const r      = radius * rFrac
    const theta  = rng() * Math.PI * 2
    const phi    = Math.acos(2 * rng() - 1) * (1 - rFrac * 0.35)
    const morph  = pickMorphology(rng, rFrac, false)
    const col    = morphColor(morph, baseCol)
    const size   = morph === 'E' ? 0.028 + rng() * 0.014
                 : morph === 'S0' ? 0.022 + rng() * 0.014
                 : 0.018 + rng() * 0.014

    const gal = makeGalMorphSprite(morph, col, size)
    gal.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta) * 0.60,
      r * Math.cos(phi),
    )
    applyGalaxyInclination(gal, morph, rng)
    gal.visible  = false   // revealed progressively
    gal.frustumCulled = false
    gal.userData = {
      morph, isBcg: false,
      memberId:    `proc-${String(bgs.length + i).padStart(4, '0')}`,
      clusterName: entry.cluster.name,
      distMpc:     entry.cluster.distMpc,
    }
    group.add(gal)

    // Hit proxy — faint sprites are too small for reliable Sprite.raycast
    const procHitR    = Math.max(0.05, size * 3.0)
    const procHitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(procHitR, 4, 4),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    )
    procHitMesh.position.copy(gal.position)
    procHitMesh.visible  = false   // matches the sprite — revealed on the same frame
    procHitMesh.frustumCulled = false
    procHitMesh.userData = { ...gal.userData, isHitProxy: true, sprite: gal }
    group.add(procHitMesh)
  }

  // Central cluster core glow — soft volume reference; fades out as camera enters the cluster.
  // Tagged isCoreGlow so the catalog-replacement pass keeps them (they're not galaxy sprites).
  const namedCoreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 10, 10),
    new THREE.MeshBasicMaterial({ color: baseCol, transparent: true, opacity: 0.28,
      depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  namedCoreGlow.frustumCulled = false
  namedCoreGlow.userData = { isCoreGlow: true, baseOpacity: 0.28 }

  const namedCoreGlowOuter = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 8, 8),
    new THREE.MeshBasicMaterial({ color: baseCol, transparent: true, opacity: 0.08,
      depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  namedCoreGlowOuter.frustumCulled = false
  namedCoreGlowOuter.userData = { isCoreGlow: true, baseOpacity: 0.08 }

  group.add(namedCoreGlow)
  group.add(namedCoreGlowOuter)

  entry.starGroup = group
  pageGroup.add(group)
  syncMemberList(group, entry.cluster.name)
}

function despawnNamedStarField(entry: NamedClusterLodEntry) {
  if (!entry.starGroup) return
  scene.remove(entry.starGroup)
  entry.starGroup.traverse(o => {
    if ((o as THREE.Sprite).isSprite) {
      ;(o as THREE.Sprite).material.dispose()
    }
  })
  entry.starGroup = null
  clearMemberList()
  // Restore overview sprite and bg glow meshes (updateNamedLod fine-tunes on next tick)
  entry.sprite.visible = true
  ;(entry.sprite.material as THREE.SpriteMaterial).opacity = 1.0
  for (const m of entry.bgMeshes) m.visible = true
}

const LOD_NAMED_FADE_START = LOD_NAMED_NEAR * 5.5  // begin fading overview sprite here

function updateNamedLod() {
  let closestEntry: NamedClusterLodEntry | null = null
  let closestDist  = Infinity

  for (const entry of namedLodEntries) {
    const d = camera.position.distanceTo(entry.pos)
    if (d < closestDist) { closestDist = d; closestEntry = entry }

    // ── Fade overview sprite on approach ──────────────────────────────────────
    const mat = entry.sprite.material as THREE.SpriteMaterial
    if (d < LOD_NAMED_FADE_START) {
      // t: 1.0 at fade-start distance → 0.0 at LOD_NAMED_NEAR
      const t = Math.max(0, (d - LOD_NAMED_NEAR) / (LOD_NAMED_FADE_START - LOD_NAMED_NEAR))
      mat.opacity     = t
      entry.sprite.visible = t > 0.02
      // Hide compact bright-galaxy overview glows once inside LOD range
      const bgVisible = d > LOD_NAMED_NEAR * 1.2
      for (const m of entry.bgMeshes) m.visible = bgVisible
    } else if (!entry.sprite.visible || mat.opacity < 1.0) {
      mat.opacity          = 1.0
      entry.sprite.visible = true
      for (const m of entry.bgMeshes) m.visible = true
    }

    // ── Fade core glow spheres as camera dives inside the cluster ─────────────
    // They represent the diffuse ICM/dark-matter envelope. Fade them out so
    // they don't occlude galaxy sprites once the user is navigating within the cluster.
    if (entry.starGroup) {
      // glowT: 1.0 when far away → 0.0 when camera is at 20% of LOD_NAMED_NEAR
      const glowT = Math.max(0, Math.min(1, (d - LOD_NAMED_NEAR * 0.2) / (LOD_NAMED_NEAR * 0.7)))
      for (const child of entry.starGroup.children) {
        if (child.userData.isCoreGlow) {
          const gm = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
          gm.opacity = (child.userData.baseOpacity as number) * glowT
        }
      }
    }
  }

  // Spawn member star field at 1.8× threshold so it fades in while the overview
  // fog is still dissolving — avoids a dark gap between the two LOD layers.
  if (closestEntry && closestDist < LOD_NAMED_NEAR * 1.8) {
    if (activeNamedLodEntry !== closestEntry) {
      if (activeNamedLodEntry) despawnNamedStarField(activeNamedLodEntry)
      activeNamedLodEntry = closestEntry
      spawnNamedStarField(closestEntry)
      // Move orbit center to cluster position so scroll-zoom orbits the cluster
      gsap.to(controls.target, {
        x: closestEntry.pos.x, y: closestEntry.pos.y, z: closestEntry.pos.z,
        duration: 1.2, ease: 'power2.out',
        onUpdate: () => controls.update(),
      })
    }
  } else if (activeNamedLodEntry && closestDist >= LOD_NAMED_NEAR * 2.2) {
    despawnNamedStarField(activeNamedLodEntry)
    activeNamedLodEntry = null
    // Return orbit center to galactic origin as camera pulls back out
    gsap.to(controls.target, {
      x: 0, y: 0, z: 0,
      duration: 1.5, ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    })
  }
}

function enterCluster() {
  if (!camera || !controls) return
  if (!selected.value) return
  const entry = namedLodEntries.find(e => e.cluster.name === selected.value!.name)

  // Fall back: if this cluster isn't in namedLodEntries (e.g. very small richness),
  // do a direct fly toward its scene position
  const targetPos = entry
    ? entry.pos.clone()
    : (() => {
        const c = CLUSTERS.find(cl => cl.name === selected.value!.name)
        return c ? clusterScenePos(c) : camera.position.clone()
      })()

  // fromCam: unit vector FROM cluster TOWARD camera.
  // + fromCam × flyR places landing on the SAME side as the camera.
  // (Previously used − which flew to the mirror side, making "entering" feel wrong.)
  const fromCam    = camera.position.clone().sub(targetPos).normalize()
  const up         = new THREE.Vector3(0, 1, 0)
  const right      = new THREE.Vector3().crossVectors(fromCam, up).normalize()
  const physR = entry ? entry.physR : 0.10
  // Named clusters: land at 1.8× physR (min 0.22 su) so the named-galaxy spread
  // is fully visible and catalog members have room to reveal around the camera.
  // X-ray clusters / fallback: tighter 0.40× landing.
  const flyR = entry
    ? Math.max(0.22, physR * 1.8)
    : Math.max(0.06, physR * 0.40)

  // If already within 1.5 × flyR, don't re-fly — just orient
  const distNow = camera.position.distanceTo(targetPos)
  if (distNow < flyR * 1.5) {
    gsap.to(controls.target, {
      duration: 0.8, ease: 'power2.out',
      x: targetPos.x, y: targetPos.y, z: targetPos.z,
      onUpdate: () => controls.update(),
    })
    return
  }

  // Land at flyR on the same side as camera, slight lateral offset for depth.
  // No vertical offset — keep camera coplanar with the cluster so galaxy members
  // appear centred in the viewport rather than biased toward screen bottom.
  const landX = targetPos.x + fromCam.x * flyR + right.x * flyR * 0.18
  const landZ = targetPos.z + fromCam.z * flyR + right.z * flyR * 0.18

  // Phase 1: Orient camera toward cluster
  gsap.to(controls.target, {
    duration: 1.0, ease: 'power2.out',
    x: targetPos.x, y: targetPos.y, z: targetPos.z,
    onUpdate: () => controls.update(),
  })

  // Phase 2: Fly in — level arrival keeps projection centred on cluster plane
  gsap.to(camera.position, {
    duration: 5.0, ease: 'power4.inOut',
    x: landX, y: targetPos.y, z: landZ,
    onUpdate: () => controls.update(),
  })
}

function voidSlug(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
}

function navigateToVoid() {
  const v = selected.value?.cosmicVoid
  if (!v) return
  void router.push({
    path:  `/void/${voidSlug(v.name)}`,
    query: {
      name:   v.name,
      radius: String(v.radiusMpc),
      dist:   String(v.distMpc),
      conduit: v.hasConduit ? '1' : '0',
    },
  })
}

function xrayClusterSlug(name: string): string {
  // "J001817.2+161740" → "j001817-2-161740" (matches galaxy-oracle file names)
  return name.toLowerCase().replace(/\./g, '-').replace(/\+/g, '-')
}

function navigateToXCluster() {
  const c = selected.value?.xrayCluster
  if (!c) return
  void router.push({
    path:  `/xcluster/${xrayClusterSlug(c.name)}`,
    query: {
      name: c.name,
      kev:  String(c.tapKev),
      z:    String(c.z),
      dist: String(Math.round(c.distMpc)),
    },
  })
}

async function navigateToClusterInterior() {
  // Use the selected named cluster, or fall back to the active LOD cluster
  // (when context has already switched to 'cluster_interior' during a fly-in)
  const name = (selected.value && !selected.value.isClusterMember && !selected.value.xrayCluster)
    ? selected.value.name
    : activeCluster.value?.name
  if (!name) return
  // Project cluster scene position to screen for spirograph origin
  let ox = 50, oy = 50
  const c = CLUSTERS.find(cl => cl.name === name)
  if (c && camera) {
    const pos3d = clusterScenePos(c)
    const sc    = pos3d.clone().project(camera)
    ox = (sc.x + 1) / 2 * 100
    oy = (1 - sc.y) / 2 * 100
  }
  const bearing = Math.atan2(oy / 100 - 0.5, ox / 100 - 0.5)
  await transition.depart(ox, oy, 'spirograph', bearing)
  void router.push(`/cluster-interior/${clusterSlug(name)}`)
}

// ── Text marker (billboard disc with label) ───────────────────────────────────

function addTextMarker(pos: THREE.Vector3, label: string, color: number, opacity: number) {
  // Simple circle disc
  const geo = new THREE.CircleGeometry(0.08, 12)
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false,
  })
  const m = new THREE.Mesh(geo, mat)
  m.position.copy(pos)
  pageGroup.add(m)
}

// ── Cluster navigator actions ─────────────────────────────────────────────────

/** Fly camera back out to the cluster overview distance so the whole field is visible. */
function exitCluster() {
  if (!camera || !controls) return
  const entry = activeNamedLodEntry ?? activeLodEntry
  if (!entry) return
  const target  = entry.pos.clone()
  const fromCam = camera.position.clone().sub(target)
  const fromLen = fromCam.length()
  const exitDist = activeNamedLodEntry ? LOD_NAMED_NEAR * 4.5 : LOD_NEAR * 1.6
  const dir = fromLen > 0.001 ? fromCam.normalize() : new THREE.Vector3(0, 0.3, 1).normalize()
  const dest = target.clone().addScaledVector(dir, exitDist).setY(target.y + exitDist * 0.15)
  gsap.to(controls.target, { x: target.x, y: target.y, z: target.z,
    duration: 1.5, ease: 'power3.out', onUpdate: () => controls.update() })
  gsap.to(camera.position, { x: dest.x, y: dest.y, z: dest.z,
    duration: 2.8, ease: 'power3.inOut', onUpdate: () => controls.update() })
  selected.value = null
}

/** Fly camera to a cluster-wide overview position so all member sprites are framed. */
function centerOnCluster() {
  if (!camera || !controls) return
  const entry = activeNamedLodEntry ?? activeLodEntry
  if (!entry) return
  const target      = entry.pos.clone()
  const fromCam     = camera.position.clone().sub(target)
  const fromLen     = fromCam.length()
  const overviewDist = activeNamedLodEntry
    ? Math.max(0.28, activeNamedLodEntry.physR * 1.4)
    : 0.42
  const dir  = fromLen > 0.001 ? fromCam.normalize() : new THREE.Vector3(0.3, 0.4, 1).normalize()
  const dest = target.clone()
    .addScaledVector(dir, overviewDist)
    .setY(target.y + overviewDist * 0.30)
  gsap.to(controls.target, { x: target.x, y: target.y, z: target.z,
    duration: 1.0, ease: 'power3.out', onUpdate: () => controls.update() })
  gsap.to(camera.position, { x: dest.x, y: dest.y, z: dest.z,
    duration: 1.8, ease: 'power3.out', onUpdate: () => controls.update() })
  selected.value = null
}

/** Cycle prev/next through the current cluster's galaxy member sprites. */
function navigateClusterMember(delta: number) {
  const sprites = clusterMemberSprites.value
  if (!sprites.length) return
  const start   = clusterFocusIdx.value < 0 ? (delta > 0 ? -1 : 0) : clusterFocusIdx.value
  const nextIdx = ((start + delta) + sprites.length) % sprites.length
  const sprite  = sprites[nextIdx]
  if (!sprite) return
  clusterFocusIdx.value = nextIdx
  const ud = sprite.userData
  selected.value = {
    name:             ud.catalogName ?? `${ud.morph as string} galaxy`,
    type:             ud.catalogType ?? `Hubble type ${ud.morph as string}`,
    icon:             ud.morph === 'cD' ? 'mdi-circle-double' : ud.morph === 'E' ? 'mdi-circle' : 'mdi-spiral',
    iconColor:        ud.isBcg ? 'amber-3' : (ud.morph === 'Sa' || ud.morph === 'Sb' ? 'blue-grey-3' : 'amber-5'),
    isBrightGalaxy:    !!ud.catalogName,
    isClusterMember:   true,
    memberMorph:       ud.morph as string,
    memberName:        ud.catalogName ?? null,
    memberId:          (ud.memberId as string) ?? undefined,
    memberClusterName: (ud.clusterName as string) || activeClusterLabel.value || undefined,
    details: {
      'Hubble type': ud.morph as string,
      'Cluster':     (ud.clusterName as string) || activeClusterLabel.value || '—',
      'Distance':    ud.distMpc ? `${ud.distMpc as number} Mpc` : '—',
      ...(ud.lum ? { 'Luminosity': ud.lum as string } : {}),
      'Role':        ud.isBcg ? 'BCG (cD type)' : ud.catalogName ? 'Catalogue member' : 'Faint member',
    },
  }
  zoomToGalaxyMember(sprite)
}

// ── Interaction ───────────────────────────────────────────────────────────────

function onTouchMove(e: TouchEvent) {
  const t = e.touches[0]
  if (!t || !camera) return
  const w = window.innerWidth, h = window.innerHeight - 44
  mouseNDC.x =  (t.clientX / w) * 2 - 1
  mouseNDC.y = -((t.clientY - 44) / h) * 2 + 1
  _voidLastMove = performance.now()
}

function onHover(e: MouseEvent) {
  if (!camera) return
  // Use viewport dimensions (canvas fills the full viewport below the nav bar)
  const w = window.innerWidth, h = window.innerHeight - 44
  mouseNDC.x =  (e.clientX / w) * 2 - 1
  mouseNDC.y = -((e.clientY - 44) / h) * 2 + 1
  _voidLastMove = performance.now()
  hoverStyle.value = { left: (e.clientX + 14) + 'px', top: (e.clientY + 14) + 'px' }

  raycaster.setFromCamera(mouseNDC, camera)
  const meshes = hitTargets.map(t => t.mesh)
  const hits   = raycaster.intersectObjects(meshes, false)

  if (hits.length) {
    const ht = hitTargets.find(t => t.mesh === hits[0].object)
    hoveredLabel.value = ht?.label ?? null
    hoveredConduitData.value = ht?.label.type === 'Wormhole Conduit'
      ? (hits[0].object.userData.conduit ?? null)
      : null
  } else {
    hoveredLabel.value       = null
    hoveredConduitData.value = null
  }
}

function clearHover() {
  hoveredLabel.value       = null
  hoveredConduitData.value = null
}

// ── Wheel — aim at nearest cluster; fly-through inside ───────────────────────

function onCanvasWheel(e: WheelEvent) {
  if (!camera || !controls) return
  // Kill only camera position fly-ins (the long 5s tweens that cause spring-back).
  // Do NOT kill controls.target tweens — enterCluster() needs those to run.
  gsap.killTweensOf(camera.position)

  const dir = new THREE.Vector3()
  camera.getWorldDirection(dir)

  if (activeLodEntry || activeNamedLodEntry) {
    // ── Inside cluster: fly-through — slide target along view direction ─────────
    const dist = camera.position.distanceTo(controls.target)
    const step = dist * 0.18 * (e.deltaY > 0 ? -1 : 1)
    controls.target.addScaledVector(dir, step)
    controls.update()
  } else {
    // ── Approaching scene: snap orbit target to the cluster the user is aimed at.
    // Without this, scroll-zoom goes toward the Milky Way origin (0,0,0) instead
    // of toward the cluster the user is looking at.
    let bestScore = 0
    let bestPos: THREE.Vector3 | null = null

    for (const entry of namedLodEntries) {
      const toCluster = entry.pos.clone().sub(camera.position)
      const dist = toCluster.length()
      if (dist < 0.01 || dist > 80) continue
      const dot = toCluster.divideScalar(dist).dot(dir)
      if (dot > 0.25) {
        const score = dot / dist
        if (score > bestScore) { bestScore = score; bestPos = entry.pos.clone() }
      }
    }
    for (const entry of xrayLodEntries) {
      const toCluster = entry.pos.clone().sub(camera.position)
      const dist = toCluster.length()
      if (dist < 0.01 || dist > 80) continue
      const dot = toCluster.divideScalar(dist).dot(dir)
      if (dot > 0.25) {
        const score = dot / dist
        if (score > bestScore) { bestScore = score; bestPos = entry.pos.clone() }
      }
    }

    if (bestPos) {
      // Snap immediately — no tween — so the very next OrbitControls update
      // uses this cluster as the orbit pivot and zoom goes straight into it.
      controls.target.copy(bestPos)
    }
  }
}

function onClick(e: MouseEvent) {
  if (enteringMW.value || !camera) return
  const w = window.innerWidth, h = window.innerHeight - 44
  mouseNDC.x =  (e.clientX / w) * 2 - 1
  mouseNDC.y = -((e.clientY - 44) / h) * 2 + 1

  raycaster.setFromCamera(mouseNDC, camera)

  // ── Priority 1: click a named galaxy member within an active cluster ───────
  // Raycast against sprites + invisible hit proxy meshes in the active LOD star group
  const activeLodGroup = activeLodEntry?.starGroup ?? activeNamedLodEntry?.starGroup
  if (activeLodGroup) {
    const memberHits = raycaster.intersectObjects(activeLodGroup.children, false)
    const memberHit  = memberHits.find(h =>
      h.object.userData.morph &&
      ((h.object as THREE.Sprite).isSprite || h.object.userData.isHitProxy)
    )
    if (memberHit) {
      const ud      = memberHit.object.userData
      const isNamed = !!ud.catalogName
      // Proxy meshes store a reference to the actual sprite for zoom/focus
      const sprite  = (ud.isHitProxy ? ud.sprite : memberHit.object) as THREE.Sprite

      selected.value = {
        name:             ud.catalogName ?? `${ud.morph} galaxy`,
        type:             ud.catalogType ?? `Hubble type ${ud.morph}`,
        icon:             ud.morph === 'cD' ? 'mdi-circle-double' : ud.morph === 'E' ? 'mdi-circle' : 'mdi-spiral',
        iconColor:        ud.isBcg ? 'amber-3' : ud.morph === 'Sa' || ud.morph === 'Sb' ? 'blue-grey-3' : 'amber-5',
        isBrightGalaxy:    isNamed,
        isClusterMember:   true,
        memberMorph:       ud.morph,
        memberName:        ud.catalogName ?? null,
        memberId:          (ud.memberId as string) ?? undefined,
        memberClusterName: ud.clusterName ?? activeLodEntry?.cluster.name ?? activeNamedLodEntry?.cluster.name ?? undefined,
        details: {
          'Hubble type':  ud.morph,
          'Cluster':      ud.clusterName ?? activeLodEntry?.cluster.name ?? activeNamedLodEntry?.cluster.name ?? '—',
          'Distance':     ud.distMpc ? `${ud.distMpc} Mpc` : '—',
          ...(ud.lum ? { 'Luminosity': ud.lum } : {}),
          'Role':         ud.isBcg ? 'Brightest Cluster Galaxy (BCG / cD)' : isNamed ? 'Catalogued cluster member' : 'Faint cluster member',
          'Morphology':   MORPH_DESC[ud.morph as GalMorph] ?? '—',
          ...(ud.notes ? { 'Notes': ud.notes } : {}),
        },
      }

      // Fly camera in close — sprite fills ~4% of screen
      zoomToGalaxyMember(sprite)
      return
    }
  }

  const hits = raycaster.intersectObjects(hitTargets.map(t => t.mesh), false)
  if (!hits.length) {
    // Single click on empty space: close any open panel, deselect — don't open propose
    if (showProposePanel.value) showProposePanel.value = false
    else { selected.value = null; void router.replace({ query: {} }) }
    return
  }

  const ht = hitTargets.find(t => t.mesh === hits[0].object)
  if (!ht) return

  // Milky Way click → animated fly-in, no panel
  if (ht.info.isMilkyWay) {
    enterMilkyWay()
    return
  }

  selected.value = ht.info
  void router.replace({ query: { cluster: clusterSlug(ht.info.name) } })

  // Open event panel if this cluster has an event
  const evId = (ht.info as any).eventId as string | undefined
  if (evId) {
    const ev = COSMIC_EVENTS.find(e => e.id === evId) ?? null
    activeEvent.value = ev
    startCountdown(ev)
  } else {
    activeEvent.value = null
  }

  // Void shell → fly camera toward the clicked point on the void boundary
  if (ht.info.isVoid) {
    const surface = hits[0]!.point                         // point on sphere nearest camera
    const dist    = camera.position.distanceTo(surface)
    const dir     = camera.position.clone().sub(surface).normalize()
    const flyDist = Math.max(0.8, dist * 0.35)
    gsap.to(camera.position, {
      duration: 1.6, ease: 'power2.inOut',
      x: surface.x + dir.x * flyDist,
      y: surface.y + dir.y * flyDist,
      z: surface.z + dir.z * flyDist,
      onUpdate: () => controls.update(),
    })
    gsap.to(controls.target, {
      duration: 1.6, ease: 'power2.inOut',
      x: surface.x, y: surface.y, z: surface.z,
      onUpdate: () => controls.update(),
    })
    return
  }

  // X-ray cluster → zoom into LOD range so star field appears immediately.
  // Guard: if already inside LOD_NEAR (star field is live) don't re-trigger the
  // 5.5 s fly — just refresh the selection panel so the user can interact with
  // the info panel and navigate via buttons.
  if (ht.info.xrayCluster) {
    const entry = xrayLodEntries.find(e => e.sphere === hits[0].object)
    if (entry) {
      const distToCluster = camera.position.distanceTo(entry.pos)
      if (distToCluster > LOD_NEAR * 0.90) {
        zoomToXrayCluster(entry)
      }
      // Already inside — selection already updated above; let panel buttons drive nav
    }
    return
  }

  // Named galaxy cluster → full enterCluster() fly-in to reveal member galaxies
  const namedEntry = namedLodEntries.find(e => e.cluster.name === ht.info.name)
  if (namedEntry) {
    enterCluster()
    return
  }

  // All other objects: partial fly toward the click.
  // If already very close to this object, just orient toward it — don't re-fly.
  const targetPos = hits[0].object.position.clone()
  const dist      = camera.position.distanceTo(targetPos)
  const flyDist   = ht.info.isBrightGalaxy
    ? Math.max(0.4, dist * 0.25)
    : Math.max(1.5, dist * 0.4)

  // Already within 1.5× flyDist: just re-orient, don't translate
  if (dist < flyDist * 1.5) {
    gsap.to(controls.target, {
      duration: 0.8, ease: 'power2.out',
      x: targetPos.x, y: targetPos.y, z: targetPos.z,
      onUpdate: () => controls.update(),
    })
    return
  }

  const dir = camera.position.clone().sub(targetPos).normalize()
  gsap.to(camera.position, {
    duration: 1.2,
    x: targetPos.x + dir.x * flyDist,
    y: targetPos.y + dir.y * flyDist + 0.3,
    z: targetPos.z + dir.z * flyDist,
    ease: 'power2.inOut',
    onUpdate: () => controls.update(),
  })
  gsap.to(controls.target, {
    duration: 1.2,
    x: targetPos.x, y: targetPos.y, z: targetPos.z,
    ease: 'power2.inOut',
    onUpdate: () => controls.update(),
  })
}

function onDblClick(e: MouseEvent) {
  if (enteringMW.value || !camera) return
  // Double-click on empty cluster space → open propose zone panel
  if (!(activeLodEntry || activeNamedLodEntry)) return
  const w = window.innerWidth, h = window.innerHeight - 44
  mouseNDC.x =  (e.clientX / w) * 2 - 1
  mouseNDC.y = -((e.clientY - 44) / h) * 2 + 1
  raycaster.setFromCamera(mouseNDC, camera)
  const hitMeshes = raycaster.intersectObjects(hitTargets.map(t => t.mesh), false)
  if (hitMeshes.length) return   // double-clicked on a hit target — let onClick handle it

  const clusterPos = activeLodEntry?.pos ?? activeNamedLodEntry!.pos
  const camToClust = camera.position.distanceTo(clusterPos)
  const depth      = camToClust * 0.55
  const worldPos   = raycaster.ray.at(depth, new THREE.Vector3())
  _proposalClickWorld.value = worldPos
  _proposalPanelPos.value   = { x: e.clientX, y: e.clientY }
  draftZone.value.name      = ''
  // Clear previous uncommitted draft ring so only one live proposal at a time
  clearDraftRing()
  showProposePanel.value    = true
}

function startCountdown(ev: CosmicEvent | null) {
  if (countdownInterval) clearInterval(countdownInterval)
  if (!ev?.eventTimeUtc) { eventCountdown.value = ''; return }

  const update = () => {
    const ms = msUntilEvent(ev.eventTimeUtc!)
    if (ms <= 0) {
      eventCountdown.value = 'LIVE NOW'
      return
    }
    const h = Math.floor(ms / 3_600_000)
    const m = Math.floor((ms % 3_600_000) / 60_000)
    const s = Math.floor((ms % 60_000) / 1000)
    eventCountdown.value = h > 0
      ? `${h}h ${m}m`
      : `${m}m ${String(s).padStart(2, '0')}s`
  }
  update()
  countdownInterval = setInterval(update, 1000)
}

function enterMilkyWay() {
  enteringMW.value = true
  controls.enabled = false

  // ── Capture approach vector for GalaxyPage initialisation ─────────────────
  // Stores the direction we flew in from so GalaxyPage can open facing the same way.
  const C   = camera.position.clone()
  const len = C.length()
  if (len > 0.001) {
    const rMpc   = len * 15
    const decRad = Math.asin(Math.max(-1, Math.min(1, C.y / len)))
    const raRad  = Math.atan2(-C.z, C.x)
    const dir    = C.clone().negate().normalize()
    // Use session storage so GalaxyPage can read it on mount
    try {
      sessionStorage.setItem('exo_cosmic_approach', JSON.stringify({
        ra_deg:   (raRad  * 180 / Math.PI + 360) % 360,
        dec_deg:  decRad  * 180 / Math.PI,
        dist_mpc: rMpc,
        dir_x: dir.x, dir_y: dir.y, dir_z: dir.z,
      }))
    } catch { /* quota/private mode */ }
  }

  // ── Phase 1 (0–1.5s): tighten look-at to MW, slight zoom ─────────────────
  gsap.to(controls.target, {
    duration: 1.2, x: 0, y: 0, z: 0, ease: 'power2.inOut',
    onUpdate: () => controls.update(),
  })

  // ── Phase 2 (0–2.6s): fly through MW sphere into its interior ────────────
  gsap.to(camera.position, {
    duration: 2.6,
    x: 0, y: 0, z: 0.05,
    ease: 'power3.in',
    onUpdate: () => controls.update(),
    onComplete: () => void router.push('/galaxy'),
  })
}

// ── Camera presets ────────────────────────────────────────────────────────────

function flyToMilkyWay() {
  if (!camera || !controls) return
  gsap.to(camera.position, { duration: 1.5, x: 1, y: 0.5, z: 4, ease: 'power2.inOut', onUpdate: () => controls.update() })
  gsap.to(controls.target, { duration: 1.5, x: 0, y: 0,   z: 0, ease: 'power2.inOut', onUpdate: () => controls.update() })
}

function flyToOverview() {
  if (!camera || !controls) return
  gsap.to(camera.position, { duration: 2.0, x: 8, y: 6, z: 22, ease: 'power2.inOut', onUpdate: () => controls.update() })
  gsap.to(controls.target, { duration: 2.0, x: 3, y: 0, z: 0,  ease: 'power2.inOut', onUpdate: () => controls.update() })
}

// ── Label projection ──────────────────────────────────────────────────────────

let lastLabelMs = 0
const _projVec   = new THREE.Vector3()

// ── Proposed zone rendering ───────────────────────────────────────────────────

/**
 * Render a dashed orbit ring + theoretical planet sphere at the proposed zone.
 * Returns the root Group so it can be tracked for cleanup.
 */
function renderProposedOrbit(zone: ProposedZone): THREE.Group {
  const group = new THREE.Group()
  group.position.copy(zone.worldPos)
  const col   = PLANET_TYPE_COLOR[zone.planetType]
  const R     = zone.orbRadiusSu

  // Dashed orbit ring
  const pts: THREE.Vector3[] = []
  const SEG = 128
  for (let i = 0; i <= SEG; i++) {
    const a = (i / SEG) * Math.PI * 2
    pts.push(new THREE.Vector3(R * Math.cos(a), 0, R * Math.sin(a)))
  }
  const ringGeo = new THREE.BufferGeometry().setFromPoints(pts)
  const ringMat = new THREE.LineDashedMaterial({
    color: col, dashSize: 0.04, gapSize: 0.025,
    opacity: 0.55, transparent: true, depthWrite: false,
  })
  const ring = new THREE.Line(ringGeo, ringMat)
  ring.computeLineDistances()
  group.add(ring)

  // Theoretical planet sphere — placed at 0° on the ring
  const planetR = zone.planetType === 'gas' ? 0.032 : zone.planetType === 'ice' ? 0.024 : 0.018
  const planet  = new THREE.Mesh(
    new THREE.SphereGeometry(planetR, 16, 12),
    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.70, depthWrite: false }),
  )
  planet.position.set(R, 0, 0)
  group.add(planet)

  // Soft glow at planet position
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(planetR * 2.8, 12, 8),
    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.14,
      depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  glow.position.copy(planet.position)
  group.add(glow)

  // Central star marker — tiny bright point
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(0.008, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff0cc, transparent: true, opacity: 0.80 }),
  )
  group.add(star)

  pageGroup.add(group)
  _proposalRings.push(group)
  return group
}

/** Fly camera to L4-companion position relative to a proposed orbit. */
function zoomToProposedOrbit(zone: ProposedZone) {
  const target = zone.worldPos.clone()
  const lookDir = camera.position.clone().sub(target).normalize()
  const right   = new THREE.Vector3().crossVectors(lookDir, new THREE.Vector3(0, 1, 0)).normalize()
  const dist    = Math.max(0.35, zone.orbRadiusSu * 3.5)
  const dest    = target.clone()
    .addScaledVector(lookDir,  dist * 0.55)
    .addScaledVector(right,    dist * 0.20)
    .setY(target.y + dist * 0.35)

  gsap.to(controls.target, { x: target.x, y: target.y, z: target.z,
    duration: 2.2, ease: 'power3.inOut', onUpdate: () => controls.update() })
  gsap.to(camera.position, { x: dest.x, y: dest.y, z: dest.z,
    duration: 2.2, ease: 'power3.inOut', onUpdate: () => controls.update() })
}

/** Remove the current uncommitted draft ring only (one-at-a-time model). */
let _draftRing: THREE.Object3D | null = null
function clearDraftRing() {
  if (!scene) return
  if (_draftRing) {
    scene.remove(_draftRing)
    const idx = _proposalRings.indexOf(_draftRing)
    if (idx !== -1) _proposalRings.splice(idx, 1)
    _draftRing = null
  }
}

/** Remove all proposal rings from the scene. */
function clearProposalRings() {
  if (!scene) return
  for (const obj of _proposalRings) scene.remove(obj)
  _proposalRings.length = 0
  _draftRing = null
}

/** Commit the draft zone — render it, track as _draftRing, zoom. */
function commitProposal() {
  if (!camera || !controls || !scene) return
  if (!_proposalClickWorld.value) return
  // Replace any previous uncommitted ring before rendering the new one
  clearDraftRing()
  const clusterCtx = activeLodEntry?.cluster.name
    ?? activeNamedLodEntry?.cluster.name ?? 'Unknown region'
  const zone: ProposedZone = {
    id:          crypto.randomUUID?.() ?? Date.now().toString(36),
    worldPos:    _proposalClickWorld.value.clone(),
    orbRadiusSu: draftZone.value.orbRadiusSu,
    planetType:  draftZone.value.planetType,
    name:        draftZone.value.name || autoZoneName(),
    clusterCtx,
  }
  proposedZones.value.push(zone)
  _draftRing = renderProposedOrbit(zone)
  zoomToProposedOrbit(zone)
  showProposePanel.value = false
  _proposalClickWorld.value = null
  draftZone.value = { orbRadiusSu: 0.18, planetType: 'rocky', name: '' }
}

/** Route to mint page with theoretical NFT prefill. */
function claimAsTheoreticalNft(zone: ProposedZone) {
  const params = new URLSearchParams({
    mode:   'theoretical',
    name:   zone.name,
    type:   zone.planetType,
    ctx:    zone.clusterCtx,
    orbR:   zone.orbRadiusSu.toFixed(3),
  })
  showProposePanel.value = false
  router.push(`/mint?${params.toString()}`)
}

// Projects tracked BCG/sub-cluster sprites to 2D screen positions for DOM labels.
// Runs in the animation loop alongside updateClusterLabels().
const _scProjVec = new THREE.Vector3()
function updateSubclusterLabels() {
  if (!_subclusterMarkers.length) {
    if (subclusterLabels.value.length) subclusterLabels.value = []
    return
  }
  const W = window.innerWidth, H = window.innerHeight
  const next: SubclusterLabel[] = []
  for (const { sprite, text, color } of _subclusterMarkers) {
    // Skip sprites whose group has been removed or is hidden
    if (!sprite.visible || !sprite.parent) continue
    _scProjVec.setFromMatrixPosition(sprite.matrixWorld)
    _scProjVec.project(camera)
    const x = (_scProjVec.x + 1) / 2 * W
    const y = (-_scProjVec.y + 1) / 2 * H
    if (_scProjVec.z < 1 && x > 30 && x < W - 30 && y > 30 && y < H - 30) {
      next.push({ text, color, x, y: y - 20 })
    }
  }
  subclusterLabels.value = next
}

function updateClusterLabels(nowMs: number) {
  if (nowMs - lastLabelMs < 40) return   // ~25 fps is plenty for DOM labels
  lastLabelMs = nowMs

  const W = window.innerWidth
  const H = window.innerHeight
  const pad = 60   // hide labels near edge

  const labels: ClusterLabel[] = CLUSTERS.map(c => {
    _projVec.copy(clusterScenePos(c))
    _projVec.project(camera)

    const x = (_projVec.x + 1) / 2 * W
    const y = (-_projVec.y + 1) / 2 * H
    const visible = _projVec.z < 1
      && x > pad && x < W - pad
      && y > pad && y < H - pad

    const sc = lookupSupercluster(c.name)
    return {
      name:        c.name,
      supercluster: c.supercluster ?? '',
      scColor:     sc ? '#' + new THREE.Color(sc.color).getHexString() : '#667788',
      x, y, visible,
    }
  })

  clusterLabels.value = labels
}

// ── Animation loop ────────────────────────────────────────────────────────────

function cosmicTick(t: number) {
  const now = t * 1000

  // Void HSW membrane — time + pointer interaction
  const nowMs = performance.now()
  const targetStr = (nowMs - _voidLastMove < 2200) ? 1.0 : 0.0
  _voidPointerStr += (targetStr - _voidPointerStr) * 0.06
  if (_voidPointerStr < 0.002) _voidPointerStr = 0

  for (const u of voidUniforms) {
    u.uTime.value = t
    u.uPointer.value.copy(mouseNDC)
    u.uPointerStr.value = _voidPointerStr
  }

  // Pulse + slow Y-spin on double-pyramid conduit markers
  for (let i = 0; i < conduitMeshes.length; i++) {
    const s = 0.85 + Math.sin(t * 2.2 + i * 1.1) * 0.2
    conduitMeshes[i].scale.setScalar(s)
    conduitMeshes[i].rotation.y = t * 0.45 + i * 0.8
    ;(conduitMeshes[i].material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.9 + Math.sin(t * 2.2 + i * 1.1) * 0.5
    if (conduitLowerMeshes[i]) {
      conduitLowerMeshes[i].scale.setScalar(s)
      conduitLowerMeshes[i].rotation.y = t * 0.45 + i * 0.8
    }
  }

  // BH rings
  for (let i = 0; i < bhRingMeshes.length; i++) {
    bhRingMeshes[i].rotation.z = t * (0.18 + i * 0.04)
  }

  // Great Attractor rings
  for (let i = 0; i < gaRingMeshes.length; i++) {
    const phase = ((t * 0.35 + i * 0.6) % 1.0)
    gaRingMeshes[i].scale.setScalar(1.0 - phase * 0.22)
    ;(gaRingMeshes[i].material as THREE.MeshBasicMaterial).opacity =
      (0.22 - i * 0.06) * (0.4 + phase * 0.6)
  }

  updateXrayLod(t)
  updateNamedLod()
  updateActiveClusterState()

  if (camera) camDistToOrigin.value = camera.position.length()

  updateClusterLabels(now)
  updateSubclusterLabels()
  defenderNav.value?.redraw(buildCosmicDefenderData())
}

// Progressive star reveal: BCG visible first, secondaries emerge as camera approaches.
// Also uses spawnProgress to begin revealing stars during the cross-fade.
function progressiveReveal(entry: XRayLodEntry, dist: number) {
  if (!entry.starGroup) return
  const children = entry.starGroup.children
  const sprites  = children.filter(c => (c as THREE.Sprite).isSprite)
  const starCount = sprites.length

  // Two drivers: distance-based (slow approach) and spawnProgress (fast fly-in)
  const distT     = Math.max(0, Math.min(1, (LOD_NEAR - dist) / (LOD_NEAR - LOD_REVEAL)))
  const spawnT    = entry.spawnProgress
  const t         = Math.max(distT, spawnT * 0.85)  // spawnProgress can pre-reveal stars

  // Ease-in-out curve — reveals with increasing speed
  const tSq      = t * t * (3 - 2 * t)
  const revealed = Math.max(1, Math.round(1 + tSq * (starCount - 1)))

  sprites.forEach((child, idx) => {
    const isVisible = idx < revealed
    if (child.visible !== isVisible) {
      child.visible = isVisible
      // Newly-appearing stars start slightly scaled down and pop in
      if (isVisible && idx > 0) {
        const mat = (child as THREE.Sprite).material as THREE.SpriteMaterial
        mat.opacity = 0.0   // starts transparent; faded in below
      }
    }
    // Fade opacity in for recently-revealed stars
    if (isVisible && idx > 0) {
      const mat = (child as THREE.Sprite).material as THREE.SpriteMaterial
      if (mat.opacity < 0.95) {
        mat.opacity = Math.min(1, mat.opacity + 0.025)  // ~40 frames to full
      }
    }
  })

  // BCG glow dims as secondary stars emerge — they collectively own the light budget
  if (entry.bcgGlowMesh) {
    const gMat = entry.bcgGlowMesh.material as THREE.MeshBasicMaterial
    gMat.opacity = 0.58 * (1 - t * 0.40) + Math.sin(t * Math.PI * 0.5) * 0.055
    // Sync baseOpacity so the isCoreGlow fade logic uses the right reference
    entry.bcgGlowMesh.userData.baseOpacity = gMat.opacity
  }

  // Fade all tagged glow spheres as the camera enters the cluster core.
  // glowT: 1.0 at LOD_NEAR → 0.0 at LOD_REVEAL.
  const glowT = Math.max(0, 1 - distT * 1.1)
  for (const child of children) {
    if (child.userData.isCoreGlow && child !== entry.bcgGlowMesh) {
      const gm = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
      gm.opacity = (child.userData.baseOpacity as number) * glowT
    }
  }
}

// Vista point: an elevated, angled position that gives a good view of the cluster.
// Arrives inside LOD_NEAR so the star field is visible from the moment of landing.
function computeVistaPoint(target: THREE.Vector3, richness: number): THREE.Vector3 {
  const vistaR = LOD_NEAR * 0.60   // land ~5.4 scene units from cluster — inside LOD_NEAR

  // Elevation: 20-30° above the cluster's midplane — varies gently by richness
  const elevAngle = 0.34 + richness * 0.022

  // fromCam: unit vector pointing FROM the cluster TOWARD the camera.
  // Adding this to the target places the vista on the SAME side as the camera
  // (between camera and cluster, at vistaR distance).
  // NOTE: previously this subtracted fromCam, placing the vista on the OPPOSITE
  // side — every click re-flew the camera to the mirror point, causing the toggle.
  const fromCam = camera.position.clone().sub(target).normalize()
  const up      = new THREE.Vector3(0, 1, 0)
  const right   = new THREE.Vector3().crossVectors(fromCam, up).normalize()

  return new THREE.Vector3(
    target.x + fromCam.x * vistaR * Math.cos(elevAngle) + right.x * vistaR * 0.25,
    target.y + vistaR * Math.sin(elevAngle),
    target.z + fromCam.z * vistaR * Math.cos(elevAngle) + right.z * vistaR * 0.25,
  )
}

function updateXrayLod(t: number) {
  let closestEntry: XRayLodEntry | null = null
  let closestDist  = Infinity

  for (const entry of xrayLodEntries) {
    const d = camera.position.distanceTo(entry.pos)

    // ── Stage 1 (LOD_FAR → LOD_MID): gentle brightening ──────────────────────
    if (entry.visual.visible) {
      const mat = entry.visual.material as THREE.SpriteMaterial

      // Base opacity 0.75; ramp up as we approach
      let opacity   = 0.75
      let scaleBoost = 1.0

      if (d < LOD_FAR) {
        const farProg = Math.max(0, 1 - (d - LOD_MID) / (LOD_FAR - LOD_MID))
        opacity += farProg * 0.22
      }

      // ── Stage 2 (LOD_MID → LOD_NEAR): bloom + resolution upgrade ────────────
      if (d < LOD_MID) {
        const midProg = Math.max(0, 1 - d / LOD_MID)
        opacity   += midProg * 0.50
        scaleBoost = 1 + midProg * 2.2
        // Upgrade sprite texture to 256px — sharp on close approach
        upgradeClusterSprite(entry, 256)
      } else if (d >= LOD_FAR && entry.spriteRes > 128) {
        // Camera has retreated far enough — restore cheap texture
        downgradeClusterSprite(entry)
      }

      // ── Stage 3 (LOD_NEAR → LOD_REVEAL): cross-fade sprite → star field ──────
      if (entry.starGroup) {
        // spawnProgress: 0 at LOD_NEAR, 1 at (LOD_NEAR + LOD_REVEAL) / 2
        const crossFadeLen = LOD_NEAR - LOD_REVEAL * 1.5
        const prog = Math.max(0, Math.min(1, (LOD_NEAR - d) / Math.max(0.1, crossFadeLen)))
        entry.spawnProgress = prog

        // Sprite dissolves: fade out and expand (galaxy "explodes" into resolved stars)
        opacity   = Math.max(0, (1 - prog * 1.15) * opacity)
        scaleBoost *= 1 + prog * 0.9   // expands slightly as it fades

        if (prog >= 0.98) {
          entry.visual.visible = false  // fully dissolved
        }
      }

      mat.opacity = Math.min(1, opacity)
      entry.visual.scale.setScalar(entry.spriteBaseSize * scaleBoost)
    }

    // ── Pulse event beacons ───────────────────────────────────────────────────
    if (entry.beaconRing) {
      const pulse = 0.4 + Math.sin(t * 2.4 + entry.pos.x) * 0.35
      ;(entry.beaconRing.material as THREE.MeshBasicMaterial).opacity = pulse
      entry.beaconRing.rotation.z = t * 0.3
    }

    // ── Progressive star reveal ───────────────────────────────────────────────
    if (entry.starGroup) progressiveReveal(entry, d)

    if (d < closestDist) { closestDist = d; closestEntry = entry }
  }

  // Spawn when inside LOD_NEAR; despawn with hysteresis
  if (closestEntry && closestDist < LOD_NEAR) {
    if (activeLodEntry !== closestEntry) {
      if (activeLodEntry) despawnStarField(activeLodEntry)
      activeLodEntry = closestEntry
      spawnStarField(closestEntry)
    }
  } else if (activeLodEntry && closestDist >= LOD_NEAR * 1.30) {
    despawnStarField(activeLodEntry)
    activeLodEntry = null
  }
}

// ── Cluster interior state update (called from animation loop) ───────────────

function updateActiveClusterState() {
  if (!activeLodEntry && !activeNamedLodEntry) {
    if (activeCluster.value !== null) activeCluster.value = null
    return
  }

  // Prefer the xray LOD entry when both are somehow active
  if (activeLodEntry) {
    const entry    = activeLodEntry
    const dist     = camera.position.distanceTo(entry.pos)
    const zoomDepth = Math.max(0, Math.min(1, (LOD_NEAR - dist) / (LOD_NEAR - LOD_REVEAL)))
    const children  = entry.starGroup?.children ?? []

    activeCluster.value = {
      name:         entry.cluster.name,
      distMpc:      entry.cluster.distMpc,
      tapKev:       entry.cluster.tapKev,
      richness:     tapKevToRichness(entry.cluster.tapKev),
      zoomDepth,
      memberCount:  children.filter(c => (c as THREE.Sprite).isSprite && c.userData.morph && c.visible).length,
      morphBars:    buildMorphBars(children),
      hasSubcluster: tapKevToRichness(entry.cluster.tapKev) >= 8,
      isXray: true,
    }
  } else {
    const entry    = activeNamedLodEntry!
    const dist     = camera.position.distanceTo(entry.pos)
    // Named clusters use LOD_NAMED_NEAR; map to same 0-1 depth scale
    const zoomDepth = Math.max(0, Math.min(1, (LOD_NAMED_NEAR - dist) / (LOD_NAMED_NEAR * 0.25)))
    const children  = entry.starGroup?.children ?? []

    activeCluster.value = {
      name:         entry.cluster.name,
      distMpc:      entry.cluster.distMpc ?? 0,
      tapKev:       undefined,
      richness:     entry.cluster.richness,
      zoomDepth,
      memberCount:  children.filter(c => (c as THREE.Sprite).isSprite && c.userData.morph && c.visible).length,
      morphBars:    buildMorphBars(children),
      hasSubcluster: (entry.cluster.brightGalaxies?.length ?? 0) > 1,
      isXray: false,
    }
  }
}

// ── Resize ────────────────────────────────────────────────────────────────────

// onResize is now handled globally by MainLayout via viz.resize()

// ── Helpers ───────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  refreshRecent()

  // Await so MainLayout's onMounted (which calls viz.init()) runs first —
  // CosmicPage can mount before MainLayout when '/' is the entry route, and
  // initScene() would otherwise see null renderer/scene/camera/controls.
  await galaxyStore.loadData()
  initScene()
  if (!camera || !controls || !renderer || !scene) return  // WebGL unavailable — nothing to animate

  // Register per-frame logic with the shared render loop
  _stopTick = viz.addTick(cosmicTick)

  // ── ?cluster=<slug> — restore panel from a shared link ──────────────────
  const clusterParam = route.query.cluster as string | undefined
  if (clusterParam && !route.query.focus) {
    setTimeout(() => {
      const ht = hitTargets.find(h => clusterSlug(h.info.name) === clusterParam)
      if (ht) {
        selected.value = ht.info
        const targetPos = ht.mesh.position.clone()
        const dir     = camera.position.clone().sub(targetPos).normalize()
        const flyDist = LOD_NAMED_NEAR * 0.70
        gsap.to(controls.target, {
          duration: 1.2, ease: 'power2.out',
          x: targetPos.x, y: targetPos.y, z: targetPos.z,
          onUpdate: () => controls.update(),
        })
        gsap.to(camera.position, {
          duration: 4.0, ease: 'power4.inOut',
          x: targetPos.x + dir.x * flyDist,
          y: targetPos.y + dir.y * flyDist + 0.10,
          z: targetPos.z + dir.z * flyDist,
          onUpdate: () => controls.update(),
        })
      }
    }, 400)
    return
  }

  // ── ?focus=<cluster name> — fly to a named cluster on arrival ────────────
  const focusName = route.query.focus as string | undefined
  if (focusName) {
    // Short delay so the scene has a frame to initialise
    setTimeout(() => {
      const target = CLUSTERS.find(c =>
        c.name.toLowerCase() === focusName.toLowerCase()
      )
      if (target) {
        const targetPos = clusterScenePos(target)
        // Phase 1: orient camera toward target
        gsap.to(controls.target, {
          duration: 1.2, ease: 'power2.out',
          x: targetPos.x, y: targetPos.y, z: targetPos.z,
          onUpdate: () => controls.update(),
        })
        // Phase 2: fly to LOD_NAMED_NEAR × 0.70 — inside the member-spawn threshold
        const dir     = camera.position.clone().sub(targetPos).normalize()
        const flyDist = LOD_NAMED_NEAR * 0.70   // ~0.385 — triggers galaxy member spawn
        gsap.to(camera.position, {
          duration: 4.0, ease: 'power4.inOut',
          x: targetPos.x + dir.x * flyDist,
          y: targetPos.y + dir.y * flyDist + 0.10,
          z: targetPos.z + dir.z * flyDist,
          onUpdate: () => controls.update(),
          onComplete: () => {
            // Select the cluster so its info panel opens
            const ht = hitTargets.find(h => h.info.name === target.name)
            if (ht) selected.value = ht.info
          },
        })
      }
    }, 400)
  } else {
    // Default: gentle pull-in intro
    setTimeout(() => {
      gsap.from(camera.position, {
        duration: 3, z: 30, ease: 'power2.out',
        onUpdate: () => controls.update(),
      })
    }, 300)
  }
})

onUnmounted(() => {
  // Stop per-frame callbacks for this level
  _stopTick?.()
  _stopTick = null

  if (countdownInterval) clearInterval(countdownInterval)

  // Remove canvas event listeners
  viz.canvas?.removeEventListener('wheel', onCanvasWheel)

  // Despawn any active LOD star fields before disposal
  if (activeNamedLodEntry) despawnNamedStarField(activeNamedLodEntry)
  namedLodEntries  = []
  xrayLodEntries   = []
  activeLodEntry   = null
  voidUniforms     = []
  conduitMeshes      = []
  conduitLowerMeshes = []
  bhRingMeshes       = []
  gaRingMeshes       = []
  hitTargets       = []

  // Dispose all GPU objects in the page group, then remove it from the scene
  disposeScene(pageGroup)
  scene?.remove(pageGroup)

  // Reset shared scene appearance for the next page
  if (scene) {
    scene.background = null
    scene.fog        = null
  }
})

// ── Legend ────────────────────────────────────────────────────────────────────

// ── Event helpers exposed to template ────────────────────────────────────────

function eventTypeLabel(type: string): string {
  return EVENT_TYPE_LABEL[type as keyof typeof EVENT_TYPE_LABEL] ?? type
}
function eventTypeColor(type: string): string {
  return EVENT_TYPE_COLOR[type as keyof typeof EVENT_TYPE_COLOR] ?? '#88aacc'
}
function openPonInk(url: string) {
  window.open(url, '_blank', 'noopener')
}
// ── X-ray cluster navigation ──────────────────────────────────────────────────

/**
 * Fly the camera close to a clicked galaxy-member sprite so it fills
 * roughly 4% of screen height (0.125–10% range depending on sprite size).
 * Uses a two-phase GSAP: instant pivot → braking fly-in.
 *
 * FOV = 55°  →  half-angle tangent ≈ 0.5206
 * viewDist = spriteWidth / (2 × targetFraction × tan(halfFOV))
 */
function zoomToGalaxyMember(sprite: THREE.Sprite) {
  if (!camera || !controls) return
  const idx = clusterMemberSprites.value.indexOf(sprite)
  if (idx !== -1) clusterFocusIdx.value = idx

  const target  = new THREE.Vector3()
  sprite.getWorldPosition(target)

  const halfFov  = (camera.fov * Math.PI) / 360        // half-FOV in radians
  const sz       = sprite.scale.x                       // sprite width (scene units)
  const rawDist  = sz / (2 * 0.040 * Math.tan(halfFov)) // land so sprite ≈ 4% tall
  const viewDist = Math.max(0.28, Math.min(2.4, rawDist))

  // Off-axis landing: trailing-right + slight elevation for depth perception
  const fromCam = camera.position.clone().sub(target).normalize()
  const right   = new THREE.Vector3().crossVectors(fromCam, new THREE.Vector3(0, 1, 0)).normalize()
  const dest    = target.clone()
    .addScaledVector(fromCam, viewDist * 0.80)
    .addScaledVector(right,   viewDist * 0.22)
    .setY(target.y + viewDist * 0.18)

  gsap.to(controls.target, {
    x: target.x, y: target.y, z: target.z,
    duration: 0.35, ease: 'power2.out',
    onUpdate: () => controls.update(),
  })
  gsap.to(camera.position, {
    x: dest.x, y: dest.y, z: dest.z,
    duration: 1.55, ease: 'power3.out',
    onUpdate: () => controls.update(),
  })
}

function zoomToXrayCluster(entry: XRayLodEntry) {
  const target  = entry.pos.clone()
  const richness = tapKevToRichness(entry.cluster.tapKev)
  const vista   = computeVistaPoint(target, richness)

  // Phase 1 (0–1.2 s): Turn the camera to face the cluster — feel its pull
  // before you start moving. Controls target swings smoothly.
  gsap.to(controls.target, {
    duration: 1.2,
    x: target.x, y: target.y, z: target.z,
    ease: 'power2.out',
    onUpdate: () => controls.update(),
  })

  // Phase 2 (0–5.5 s): Fly camera from current position to vista point.
  // power4.inOut: extremely gentle start (barely feels like moving at first),
  // then builds momentum, then eases into the landing — the "slowly resolves" feel.
  gsap.to(camera.position, {
    duration: 5.5,
    x: vista.x, y: vista.y, z: vista.z,
    ease: 'power4.inOut',
    onUpdate: () => controls.update(),
  })
}

function findNearestSystem(raDeg: number, decDeg: number): string | null {
  if (!galaxyStore.isLoaded) return null
  const dec1 = (decDeg * Math.PI) / 180
  const ra1  = (raDeg  * Math.PI) / 180
  let bestHost = ''
  let bestCos  = -2
  for (const [, sys] of galaxyStore.systems) {
    const dec2 = (sys.dec * Math.PI) / 180
    const ra2  = (sys.ra  * Math.PI) / 180
    const cosD = Math.sin(dec1) * Math.sin(dec2) + Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2)
    if (cosD > bestCos) { bestCos = cosD; bestHost = sys.hostname }
  }
  return bestHost || null
}

const nearestSystemHost = computed<string | null>(() => {
  if (!selected.value?.xrayCluster || !galaxyStore.isLoaded) return null
  return findNearestSystem(selected.value.xrayCluster.raDeg, selected.value.xrayCluster.decDeg)
})

function enterXraySystem() {
  if (!selected.value?.xrayCluster) return
  const cluster = selected.value.xrayCluster
  const host    = nearestSystemHost.value
  void router.push({
    path:  '/galaxy',
    query: host
      ? { focusHost: host, fromCluster: cluster.name }
      : { candidateCluster: cluster.name, candidateRa: String(cluster.raDeg), candidateDec: String(cluster.decDeg) },
  })
}

function flyToActiveEvent() {
  if (!camera || !controls) return
  if (!activeEvent.value) return
  const entry = xrayLodEntries.find(e => e.cluster.name === activeEvent.value!.clusterName)
  if (!entry) return
  const p = entry.pos
  gsap.to(camera.position, { duration: 2.0, x: p.x + 2, y: p.y + 1, z: p.z + 4, ease: 'power2.inOut', onUpdate: () => controls.update() })
  gsap.to(controls.target, { duration: 2.0, x: p.x, y: p.y, z: p.z, ease: 'power2.inOut', onUpdate: () => controls.update() })
}

// Re-export for template
const formatEventTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
}

// ── DefenderNav — cosmic mode ─────────────────────────────────────────────────

const defenderNav    = ref<InstanceType<typeof DefenderNav>    | null>(null)
const welcomeOverlay = ref<InstanceType<typeof WelcomeOverlay> | null>(null)

// ── Quick transit — settlements + recently visited locations ──────────────────

const { settlements }                       = useSettlements()
const { recent: recentLocs, refresh: refreshRecent } = useRecentLocations()

interface QuickTransitItem {
  route:     string
  label:     string
  sublabel:  string
  icon:      string
  isSettle:  boolean
}

const quickTransitItems = computed((): QuickTransitItem[] => {
  const items: QuickTransitItem[] = []
  const seen  = new Set<string>()

  for (const s of settlements.value as SettlementRecord[]) {
    const route = (s.type === 'cluster' && s.clusterSlug && s.memberId)
      ? `/cluster-surface/${encodeURIComponent(s.clusterSlug)}/${encodeURIComponent(s.memberId)}/0`
      : `/surface/${encodeURIComponent(s.hostname)}/${encodeURIComponent(s.planetName)}`
    if (seen.has(route)) continue
    seen.add(route)
    items.push({
      route,
      label:    s.displayName || s.planetName,
      sublabel: s.hostname || s.clusterSlug || '',
      icon:     s.type === 'cluster' ? 'mdi-star-four-points' : 'mdi-home-circle',
      isSettle: true,
    })
  }

  for (const r of recentLocs.value) {
    if (seen.has(r.route)) continue
    seen.add(r.route)
    items.push({ route: r.route, label: r.label, sublabel: r.sublabel, icon: r.icon, isSettle: false })
    if (items.length >= 10) break
  }

  return items
})

function buildCosmicDefenderData(): DefenderNavData {
  const clusters: CosmicStripEntry[] = CLUSTERS.map(c => {
    const pos = clusterScenePos(c)
    return {
      name:      c.name,
      x:         pos.x,
      z:         pos.z,
      richness:  c.richness,
      color:     '#' + new THREE.Color(c.color).getHexString(),
      hasEvent:  false,
    }
  })

  // Add X-ray clusters from loaded entries
  for (const entry of xrayLodEntries) {
    clusters.push({
      name:     entry.cluster.name,
      x:        entry.pos.x,
      z:        entry.pos.z,
      richness: tapKevToRichness(entry.cluster.tapKev),
      color:    entry.cluster.colorHex,
      hasEvent: entry.hasEvent,
    })
  }

  const conduits: ConduitStripEntry[] = conduitMeshes.map((m, i) => ({
    name:      m.userData.conduit?.name ?? `Conduit ${i}`,
    x:         m.position.x,
    z:         m.position.z,
    isPulsing: true,
  }))

  return {
    cosmicData: {
      cameraX:  camera.position.x,
      cameraZ:  camera.position.z,
      clusters,
      conduits,
    },
  }
}

function onDefenderCosmicFlyTo(target: DefenderTarget) {
  if (!camera || !controls) return
  if (target.type === 'cluster') {
    const entry = xrayLodEntries.find(e => e.cluster.name === target.id)
    if (entry) { zoomToXrayCluster(entry); return }
    const named = namedLodEntries.find(e => e.cluster.name === target.id)
    if (named) {
      // Reuse the elevated vista logic via a local inline
      const fromCam = camera.position.clone().sub(named.pos).normalize()
      const right   = new THREE.Vector3().crossVectors(fromCam, new THREE.Vector3(0, 1, 0)).normalize()
      const flyR    = Math.max(0.22, named.physR * 1.8)
      gsap.to(controls.target, {
        duration: 1.0,
        x: named.pos.x, y: named.pos.y, z: named.pos.z,
        ease: 'power2.out', onUpdate: () => controls.update(),
      })
      gsap.to(camera.position, {
        duration: 5.0,
        x: named.pos.x - fromCam.x * flyR + right.x * flyR * 0.25,
        y: named.pos.y + flyR * 0.35,
        z: named.pos.z - fromCam.z * flyR + right.z * flyR * 0.25,
        ease: 'power4.inOut', onUpdate: () => controls.update(),
      })
    }
  }
}

// ── Supported chain quick-reference (mirrors ChainStatusPage data) ────────────
const SUPPORTED_CHAINS = [
  { id: 'algo',   symbol: 'ALGO',  name: 'Algorand', color: '#1b85e0', status: 'live',    statusLabel: 'Live — Exolocation NFTs (ARC-3/ARC-69)' },
  { id: 'matic',  symbol: 'MATIC', name: 'Polygon',  color: '#8247e5', status: 'testing', statusLabel: 'Testnet (Amoy) — $BARS, WQ Certs, Health Cards' },
  { id: 'sol',    symbol: 'SOL',   name: 'Solana',   color: '#14f195', status: 'live',    statusLabel: 'Live — Station Core / Module / EcocitySolution' },
  { id: 'tez',    symbol: 'TEZ',   name: 'Tezos',    color: '#2c7df7', status: 'planned', statusLabel: 'Planned — Art collectibles, $BARS (FA2)' },
  { id: 'hbar',   symbol: 'HBAR',  name: 'Hedera',   color: '#3dbcb4', status: 'planned', statusLabel: 'Planned — Eco-data certs, supply chain' },
  { id: 'celo',   symbol: 'CELO',  name: 'Celo',     color: '#35d07f', status: 'testing', statusLabel: 'Testnet (Alfajores) — Community badges, Eco-ops tokens' },
]

const legendItems = [
  { label: 'Milky Way',                   color: '#ffd480', size: 12 },
  { label: 'Galaxy cluster',              color: '#88ccff', size: 9 },
  { label: 'Dark matter halo',            color: '#6633cc', size: 9 },
  { label: 'Ultra-massive black hole',    color: '#ff9933', size: 6 },
  { label: 'Supermassive BH / AGN',       color: '#8899ff', size: 5 },
  { label: 'Bright galaxy / BCG',         color: '#ffe8aa', size: 5 },
  { label: 'X-ray cluster (Takey)',       color: '#ffcc88', size: 5 },
  { label: 'Cosmic void shell',           color: '#112244', size: 9 },
  { label: 'Filament',                    color: '#1a3a6a', size: 4 },
  { label: 'Wormhole conduit',            color: '#00e5ff', size: 8 },
  { label: 'Great Attractor Basin',       color: '#ff7722', size: 7 },
  { label: 'Laniakea boundary (~160 Mpc)', color: '#2244cc', size: 7 },
]
</script>

<style scoped>
.hover-box {
  position: fixed;
  background: rgba(2, 8, 20, 0.9);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 4px;
  padding: 6px 10px;
  font-family: monospace;
  pointer-events: none;
  z-index: 10;
  max-width: 220px;
}

/* ── Conduit meta-map hover panel ─────────────────────────────────────────── */
.conduit-meta-panel {
  position: fixed;
  background: rgba(1, 6, 18, 0.94);
  border: 1px solid rgba(0, 229, 255, 0.30);
  border-radius: 5px;
  padding: 8px 10px 6px;
  font-family: monospace;
  pointer-events: none;
  z-index: 10;
  width: 188px;
}
.cmp-title {
  font-size: 10px;
  font-weight: 600;
  color: #b0e8ff;
  letter-spacing: 0.06em;
  margin-bottom: 1px;
}
.cmp-void {
  font-size: 8px;
  color: rgba(0, 200, 220, 0.55);
  margin-bottom: 5px;
  letter-spacing: 0.05em;
}
.cmp-radar {
  display: block;
  border-radius: 3px;
  margin-bottom: 5px;
}
.cmp-stats {
  display: flex;
  gap: 6px;
  margin-bottom: 3px;
}
.cmp-stat {
  font-size: 8px;
  padding: 1px 4px;
  border-radius: 2px;
  letter-spacing: 0.03em;
}
.cmp-stat--bh  { color: #ff9933; border: 1px solid rgba(255,153,51,0.30); }
.cmp-stat--cl  { color: #4499ff; border: 1px solid rgba(68,153,255,0.25); }
.cmp-stat--co  { color: #00e5ff; border: 1px solid rgba(0,229,255,0.20); }
.cmp-strat {
  font-size: 8px;
  color: rgba(180, 210, 230, 0.55);
  letter-spacing: 0.07em;
  margin-bottom: 2px;
}
.cmp-hint {
  font-size: 7.5px;
  color: rgba(0, 229, 255, 0.35);
  letter-spacing: 0.05em;
}

.side-panel {
  position: absolute;
  top: 54px;
  right: 12px;
  width: 250px;
  background: rgba(1, 4, 16, 0.92);
  border: 1px solid rgba(0, 229, 255, 0.18);
  border-radius: 6px;
  backdrop-filter: blur(6px);
  z-index: 5;
}

.transit-row {
  padding: 3px 2px;
  border-radius: 3px;
}
.transit-row:hover {
  background: rgba(0, 229, 255, 0.06);
}
.dest-name {
  font-size: 11px;
  font-family: monospace;
  line-height: 1.3;
}
.dest-meta {
  font-size: 9px;
  line-height: 1.2;
}
.warp-btn {
  font-size: 9px;
  flex-shrink: 0;
}

.legend-anchor {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.legend-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(0, 80, 120, 0.35);
  border-radius: 4px;
  padding: 3px 8px;
  cursor: pointer;
  color: rgba(0, 180, 220, 0.65);
  font-family: monospace;
  font-size: 8px;
  letter-spacing: 0.1em;
}
.legend-toggle:hover { background: rgba(0, 30, 50, 0.75); }
.legend-toggle__icon { font-size: 9px; }
.legend-toggle__label { }
.legend-block {
  background: rgba(0, 0, 0, 0.65);
  border-radius: 5px;
  font-family: monospace;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 3px;
}
.legend-dot {
  display: inline-block;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-slide-enter-active, .legend-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.legend-slide-enter-from, .legend-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* ── Cluster label overlays ──────────────────────────────────────────── */

.labels-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  overflow: hidden;
}

.cluster-label {
  position: absolute;
  transform: translate(-50%, calc(-100% - 10px));
  text-align: center;
  pointer-events: none;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.8));
}

.cl-name {
  font-size: 9px;
  font-family: monospace;
  color: rgba(180, 220, 255, 0.78);
  letter-spacing: 0.09em;
  line-height: 1.3;
  white-space: nowrap;
  text-transform: uppercase;
}

.cl-super {
  font-size: 8px;
  font-family: monospace;
  color: var(--sc-color, #7799aa);
  opacity: 0.65;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.subcluster-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 7.5px;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.14em;
  white-space: nowrap;
  pointer-events: none;
  text-shadow: 0 0 8px currentColor, 0 1px 3px rgba(0,0,0,0.9);
  opacity: 0.82;
  text-transform: uppercase;
}

/* ── Proposed zone panel ──────────────────────────────────────────────────── */
.propose-panel {
  position: absolute;
  width: 260px;
  background: rgba(2,8,20,0.94);
  border: 1px solid rgba(100,160,255,0.22);
  border-radius: 6px;
  padding: 14px 16px 12px;
  z-index: 500;
  font-family: 'Courier New', monospace;
  box-shadow: 0 4px 32px rgba(0,80,180,0.25), 0 0 0 1px rgba(80,140,255,0.08);
}
.propose-header {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: #88aaff;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  text-transform: uppercase;
}
.propose-icon { font-size: 14px; opacity: 0.7; }
.propose-close {
  margin-left: auto;
  background: none; border: none; color: #445566;
  cursor: pointer; font-size: 11px; padding: 0;
}
.propose-close:hover { color: #aabbcc; }
.propose-field { margin-bottom: 10px; }
.propose-label {
  font-size: 7px; letter-spacing: 0.16em;
  color: #445566; margin-bottom: 4px; text-transform: uppercase;
}
.propose-input {
  width: 100%; background: rgba(0,20,50,0.6); border: 1px solid #1a3050;
  border-radius: 3px; color: #88ccff; font-family: inherit;
  font-size: 10px; padding: 5px 8px; outline: none; box-sizing: border-box;
}
.propose-input::placeholder { color: #334455; }
.propose-input:focus { border-color: #336699; }
.propose-types {
  display: flex; gap: 4px; flex-wrap: wrap;
}
.propose-type-btn {
  background: rgba(0,20,50,0.5); border: 1px solid #1a3050;
  border-radius: 3px; color: #556677; font-family: inherit;
  font-size: 8px; letter-spacing: 0.08em; padding: 4px 8px;
  cursor: pointer; text-transform: lowercase; transition: all 0.15s;
}
.propose-type-btn:hover { border-color: #336699; color: #88aacc; }
.propose-type-btn.active { border-color: #4488cc; color: #88ccff; background: rgba(20,50,100,0.5); }
.propose-slider {
  width: 100%; accent-color: #4488cc; cursor: pointer;
  margin: 2px 0;
}
.propose-range-hints {
  display: flex; justify-content: space-between;
  font-size: 7px; color: #334455; letter-spacing: 0.08em;
}
.propose-actions { display: flex; flex-direction: column; gap: 5px; margin-top: 12px; }
.propose-btn {
  font-family: inherit; font-size: 9px; letter-spacing: 0.10em;
  border-radius: 3px; padding: 7px 12px; cursor: pointer;
  border: 1px solid transparent; transition: all 0.15s; text-align: left;
}
.propose-btn:disabled { opacity: 0.35; cursor: default; }
.propose-btn--primary {
  background: rgba(20,55,120,0.6); border-color: #336699; color: #88ccff;
}
.propose-btn--primary:hover:not(:disabled) { background: rgba(30,70,150,0.7); border-color: #4488bb; }
.propose-btn--secondary {
  background: rgba(10,35,60,0.5); border-color: #224466; color: #5577aa;
}
.propose-btn--secondary:hover:not(:disabled) { border-color: #336699; color: #88aacc; }
.propose-btn--ghost {
  background: none; border-color: transparent; color: #334455;
  font-size: 8px;
}
.propose-btn--ghost:hover { color: #556677; }
.propose-note {
  margin-top: 8px; font-size: 7px; letter-spacing: 0.08em;
  color: #334455; font-style: italic;
}

/* Panel fade transition */
.propose-fade-enter-active, .propose-fade-leave-active { transition: opacity 0.18s, transform 0.18s; }
.propose-fade-enter-from, .propose-fade-leave-to { opacity: 0; transform: scale(0.96) translateY(-4px); }

/* ── Supercluster badge in side panel ──────────────────────────────── */

.sc-badge {
  border: 1px solid;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.35);
}

/* ── Event panel ─────────────────────────────────────────────────────── */

.event-panel {
  position: absolute;
  bottom: 54px;
  left: 14px;
  width: 270px;
  background: rgba(1, 4, 16, 0.94);
  border: 1px solid rgba(255, 200, 80, 0.22);
  border-radius: 7px;
  backdrop-filter: blur(8px);
  z-index: 6;
}

.event-type-badge {
  border: 1px solid;
  border-radius: 3px;
  font-family: monospace;
}

.countdown-display {
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 3px;
  padding: 4px 8px;
  font-family: monospace;
}

/* ── Milky Way entry fade overlay ───────────────────────────────────── */

.mw-entry-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, #ffd48022 0%, #000000 70%);
  animation: mwFadeIn 2.4s ease-in forwards;
  z-index: 50;
  pointer-events: none;
}

@keyframes mwFadeIn {
  0%   { opacity: 0; background-color: transparent; }
  40%  { opacity: 0.4; }
  100% { opacity: 1; background-color: #000000; }
}

.mw-fade-enter-active { animation: mwFadeIn 2.4s ease-in forwards; }

/* ── Contextual info panel (top-left) ─────────────────────────────── */

.ctx-panel {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 5;
  width: 244px;
  background: rgba(1, 4, 16, 0.91);
  border: 1px solid rgba(0, 180, 220, 0.18);
  border-radius: 6px;
  backdrop-filter: blur(9px);
  font-family: 'Courier New', monospace;
  overflow: hidden;
}

.ctx-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(0, 8, 24, 0.55);
  border-bottom: 1px solid rgba(0, 80, 120, 0.32);
}

.ctx-icon     { color: rgba(0, 200, 240, 0.78); font-size: 11px; }
.ctx-headline {
  flex: 1;
  font-size: 9px;
  letter-spacing: 0.11em;
  color: rgba(0, 200, 240, 0.82);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ctx-l1 {
  font-size: 7px;
  letter-spacing: 0.13em;
  color: rgba(0, 150, 180, 0.52);
  background: rgba(0, 80, 120, 0.22);
  padding: 1px 5px;
  border-radius: 2px;
  flex-shrink: 0;
}
.ctx-header--toggle { cursor: pointer; user-select: none; }
.ctx-header--toggle:hover { background: rgba(0, 30, 50, 0.7); }
.ctx-chevron {
  font-size: 7px;
  color: rgba(0, 150, 180, 0.52);
  transition: transform 0.25s ease;
  flex-shrink: 0;
}
.ctx-chevron--open { transform: rotate(90deg); }

/* Body section */
.ctx-body { padding: 6px 10px 4px; }

.ctx-line {
  font-size: 8px;
  letter-spacing: 0.05em;
  color: rgba(100, 150, 180, 0.65);
  line-height: 1.55;
}

.ctx-div {
  height: 1px;
  background: rgba(0, 80, 120, 0.28);
  margin: 5px 0;
}

.ctx-sc {
  font-size: 8px;
  letter-spacing: 0.07em;
  opacity: 0.8;
  margin-bottom: 3px;
}

.ctx-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 2px;
}

.ctx-k {
  font-size: 7px;
  color: rgba(70, 120, 155, 0.65);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.ctx-v {
  font-size: 8px;
  color: rgba(160, 210, 232, 0.85);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 148px;
}

.ctx-settle-hint .ctx-v { font-weight: bold; }

/* Navigation pathway */
.ctx-pathway {
  padding: 5px 10px;
  border-top: 1px solid rgba(0, 80, 120, 0.28);
  background: rgba(0, 4, 16, 0.45);
}

.ctx-path-lbl {
  font-size: 6px;
  letter-spacing: 0.16em;
  color: rgba(50, 90, 130, 0.6);
  margin-bottom: 4px;
}

.ctx-steps {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.ctx-step {
  font-size: 7px;
  letter-spacing: 0.08em;
  color: rgba(70, 120, 155, 0.5);
  white-space: nowrap;
}
.ctx-step--active {
  color: #00e5ff;
}
.ctx-step--link {
  color: rgba(0, 200, 240, 0.68);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: rgba(0, 180, 220, 0.28);
  text-underline-offset: 2px;
  transition: color 0.1s;
}
.ctx-step--link:hover { color: #00e5ff; }
.ctx-step--dim { color: rgba(50, 90, 130, 0.38); }
.ctx-step--settle {
  color: rgba(255, 180, 40, 0.78);
  cursor: pointer;
  transition: color 0.1s;
}
.ctx-step--settle:hover { color: #ffcc44; }
.ctx-arr {
  font-size: 8px;
  color: rgba(0, 80, 120, 0.35);
  padding: 0 1px;
}

/* Claim CTA section */
.ctx-claim {
  padding: 6px 10px 8px;
  border-top: 1px solid rgba(0, 80, 120, 0.28);
  background: rgba(0, 6, 20, 0.5);
}

.ctx-claim-title {
  font-size: 7px;
  letter-spacing: 0.15em;
  color: rgba(255, 180, 40, 0.72);
  margin-bottom: 3px;
}

.ctx-claim-sub {
  font-size: 7px;
  color: rgba(70, 120, 155, 0.65);
  letter-spacing: 0.04em;
  line-height: 1.55;
  margin-bottom: 7px;
}

/* ── 6-chain mini-grid in claim panel ─────────────────────────── */

.ctx-chains {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 3px;
}

.ctx-chain-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Courier New', monospace;
  font-size: 7px;
  letter-spacing: 0.07em;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0, 8, 22, 0.60);
  color: rgba(140, 190, 220, 0.72);
  cursor: pointer;
  transition: all 0.12s;
}

.ctx-chain-chip:hover {
  background: rgba(0, 40, 80, 0.65);
  color: rgba(200, 230, 255, 0.90);
}

.ctx-chain-chip--live    { border-color: rgba(50, 220, 140, 0.30); }
.ctx-chain-chip--testing { border-color: rgba(200, 160, 50, 0.30); }
.ctx-chain-chip--planned { border-color: rgba(80, 100, 140, 0.22); color: rgba(100, 140, 170, 0.55); }

.ctx-chain-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
  opacity: 0.85;
}

.ctx-chains-hint {
  font-family: 'Courier New', monospace;
  font-size: 6px;
  letter-spacing: 0.08em;
  color: rgba(50, 100, 140, 0.50);
  cursor: pointer;
  margin-bottom: 5px;
  transition: color 0.12s;
}
.ctx-chains-hint:hover { color: rgba(0, 180, 220, 0.65); }

/* ── Dark matter overlay (DK.MAT mode) ─────────────────────────── */

.dm-overlay {
  position: fixed;
  bottom: 90px;
  left: 14px;
  z-index: 7;
  width: 280px;
  background: rgba(18, 4, 38, 0.94);
  border: 1px solid rgba(180, 80, 255, 0.35);
  border-radius: 7px;
  padding: 10px 13px;
  font-family: 'Courier New', monospace;
  backdrop-filter: blur(10px);
}

.dm-title {
  font-size: 8px;
  letter-spacing: 0.14em;
  color: rgba(200, 120, 255, 0.80);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.dm-body {
  font-size: 8px;
  color: rgba(160, 120, 200, 0.72);
  letter-spacing: 0.03em;
  line-height: 1.6;
  margin-bottom: 9px;
}

.dm-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 7px;
  color: rgba(160, 120, 200, 0.60);
  letter-spacing: 0.06em;
  border-top: 1px solid rgba(180, 80, 255, 0.18);
  padding-top: 7px;
}

.dm-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 3px;
  flex-shrink: 0;
}

.dm-conduit  { background: rgba(200, 80, 255, 0.85); }
.dm-void     { background: rgba(60, 100, 180, 0.65); }
.dm-filament { background: rgba(100, 50, 160, 0.55); }

/* ── Cluster depth ring ────────────────────────────────────────────── */

.cluster-depth-wrap {
  position: relative;
  width: 48px; height: 48px;
  margin: 0 auto 2px;
}
.cluster-depth-svg {
  width: 48px; height: 48px;
  transform: rotate(-90deg);
}
.cdepth-track {
  fill: none;
  stroke: rgba(0, 100, 150, 0.25);
  stroke-width: 3;
}
.cdepth-fill {
  fill: none;
  stroke: url(#cdepth-grad);
  stroke: rgba(0, 200, 255, 0.80);
  stroke-width: 3;
  stroke-dasharray: 119.4;
  stroke-dashoffset: 119.4;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.4s ease;
}
.cdepth-label {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.cdepth-pct {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: rgba(0, 220, 255, 0.9);
  line-height: 1;
  letter-spacing: -0.03em;
}
.cdepth-unit {
  font-family: 'Courier New', monospace;
  font-size: 6px;
  color: rgba(0, 160, 200, 0.6);
  line-height: 1;
}
.cdepth-desc {
  font-family: 'Courier New', monospace;
  font-size: 6.5px;
  letter-spacing: 0.12em;
  color: rgba(0, 160, 200, 0.5);
  text-align: center;
  margin-bottom: 2px;
}

/* ── Morphology bars ───────────────────────────────────────────────── */

.morph-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 3px;
}
.morph-lbl {
  font-family: 'Courier New', monospace;
  font-size: 7.5px;
  color: rgba(140, 180, 200, 0.7);
  min-width: 18px;
  letter-spacing: 0.04em;
}
.morph-track {
  flex: 1;
  height: 3px;
  background: rgba(0, 60, 100, 0.4);
  border-radius: 2px;
  overflow: hidden;
}
.morph-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}
.morph-pct {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  color: rgba(100, 150, 180, 0.55);
  min-width: 24px;
  text-align: right;
}

/* ── Cluster approach HUD ──────────────────────────────────────────── */

.approach-hud {
  position: fixed;
  top: 52px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  font-family: 'Courier New', monospace;
  text-align: center;
  background: rgba(1, 6, 22, 0.88);
  border: 1px solid rgba(0, 180, 230, 0.22);
  border-radius: 5px;
  padding: 5px 18px 6px;
  backdrop-filter: blur(5px);
  pointer-events: none;
}
.approach-name {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: rgba(0, 200, 255, 0.85);
  text-transform: uppercase;
  margin-bottom: 4px;
}
.approach-bar-wrap {
  height: 2px;
  background: rgba(0, 80, 130, 0.35);
  border-radius: 1px;
  overflow: hidden;
  margin-bottom: 3px;
}
.approach-bar {
  height: 100%;
  background: linear-gradient(90deg, rgba(0,160,200,0.55), rgba(0,220,255,0.9));
  border-radius: 1px;
  transition: width 0.3s ease;
}
.approach-meta {
  font-size: 7px;
  letter-spacing: 0.07em;
  color: rgba(80, 140, 170, 0.65);
}

.approach-fade-enter-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.approach-fade-leave-active { transition: opacity 0.25s ease; }
.approach-fade-enter-from   { opacity: 0; transform: translateX(-50%) translateY(-6px); }
.approach-fade-leave-to     { opacity: 0; }

/* ── Cluster member navigator toolbar ───────────────────────────────────────── */
.cluster-nav-bar {
  position: fixed;
  bottom: 102px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 110;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(6, 10, 26, 0.90);
  border: 1px solid rgba(0, 180, 230, 0.18);
  border-radius: 22px;
  padding: 5px 12px 5px 14px;
  backdrop-filter: blur(10px);
  font-family: 'Courier New', monospace;
  min-width: 300px;
  max-width: 520px;
}
.cluster-nav-crumb {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.cnb-cluster {
  font-size: 9px;
  letter-spacing: 0.14em;
  color: rgba(0, 200, 255, 0.9);
  text-transform: uppercase;
  white-space: nowrap;
}
.cnb-sep {
  font-size: 10px;
  color: rgba(80, 120, 150, 0.6);
  margin: 0 5px;
  flex-shrink: 0;
}
.cnb-member {
  font-size: 9px;
  letter-spacing: 0.06em;
  color: rgba(180, 210, 230, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cluster-nav-controls {
  display: flex;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}
.cnb-count {
  font-size: 8px;
  letter-spacing: 0.06em;
  color: rgba(80, 120, 160, 0.8);
  min-width: 34px;
  text-align: center;
}
.cnb-divider {
  width: 1px;
  height: 18px;
  background: rgba(40, 70, 110, 0.55);
  margin: 0 4px;
}

/* ── Quick transit strip ──────────────────────────────────────────────────── */

.qt-strip {
  position: absolute;
  bottom: 22px;
  left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 50;
  padding: 0 20px;
  pointer-events: auto;
}

.qt-label {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.14em;
  color: rgba(50, 100, 140, 0.50);
  white-space: nowrap;
  flex-shrink: 0;
}

.qt-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 2px 0;
  max-width: min(820px, calc(100vw - 140px));
}
.qt-scroll::-webkit-scrollbar { display: none; }

.qt-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 4, 18, 0.70);
  border: 1px solid rgba(0, 70, 120, 0.22);
  border-radius: 20px;
  padding: 4px 10px 4px 8px;
  cursor: pointer;
  white-space: nowrap;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  backdrop-filter: blur(8px);
  transition: background 0.18s ease, border-color 0.18s ease;
  flex-shrink: 0;
}
.qt-chip:hover {
  background: rgba(0, 30, 65, 0.92);
  border-color: rgba(0, 180, 230, 0.42);
}

.qt-icon { opacity: 0.60; flex-shrink: 0; }
.qt-name { color: rgba(140, 200, 235, 0.75); }

/* Settlement chips: teal tint */
.qt-chip--settle {
  border-color: rgba(0, 170, 155, 0.26);
  background:   rgba(0, 16, 16, 0.78);
}
.qt-chip--settle .qt-icon { color: rgba(0, 200, 185, 0.72); opacity: 1; }
.qt-chip--settle .qt-name { color: rgba(0, 220, 200, 0.88); }
.qt-chip--settle:hover {
  border-color: rgba(0, 210, 190, 0.52);
  background:   rgba(0, 35, 32, 0.94);
}

/* Recent chips: blue tint */
.qt-chip--recent .qt-icon { color: rgba(80, 150, 220, 0.65); opacity: 1; }

/* Slide-up fade-in with a short delay so the 3D scene loads first */
.qt-appear-enter-active { transition: opacity 0.6s ease 1.2s, transform 0.6s ease 1.2s; }
.qt-appear-leave-active { transition: opacity 0.25s ease; }
.qt-appear-enter-from   { opacity: 0; transform: translateY(10px); }
.qt-appear-leave-to     { opacity: 0; }
</style>
