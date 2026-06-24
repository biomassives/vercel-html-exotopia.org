<template>
  <q-page class="ps-page">

    <!-- ── Sidebar navigation ─────────────────────────────────────────────── -->
    <aside class="ps-sidebar">
      <div class="ps-sidebar-head">
        <span class="ps-head-icon">◉</span>
        PLANET SYSTEMS
      </div>

      <nav class="ps-nav">
        <a
          v-for="s in SECTIONS"
          :key="s.id"
          :href="`#${s.id}`"
          class="ps-nav-link"
          :class="{ 'ps-nav-link--active': activeSection === s.id }"
          @click.prevent="scrollTo(s.id)"
        >
          <span class="ps-nav-icon">{{ s.icon }}</span>
          {{ s.label }}
        </a>
      </nav>

      <div class="ps-sidebar-footer">
        <q-btn
          flat dense size="xs" color="cyan-6"
          icon="scatter_plot" label="Milky Way map"
          @click="$router.push('/galaxy?hz=1')"
        />
        <q-btn
          flat dense size="xs" color="blue-grey-5"
          icon="mdi-hexagon-outline" label="Mint deed"
          class="q-mt-xs"
          @click="$router.push('/mint')"
        />
      </div>
    </aside>

    <!-- ── Main content ───────────────────────────────────────────────────── -->
    <main ref="mainEl" class="ps-main" @scroll="onScroll">

      <!-- ── Hero ──────────────────────────────────────────────────────── -->
      <div class="ps-hero">
        <div class="ps-hero-eyebrow">SETTLEMENT GUIDE</div>
        <h1 class="ps-hero-title">Planet Systems &amp; Settlement Protocol</h1>
        <p class="ps-hero-sub">
          Every Exotopia settlement occupies a real confirmed exoplanet from the NASA Archive.
          This guide explains how your settlement is anchored in the universe, how portal
          transit works, and how the community governs itself.
        </p>
      </div>

      <!-- ── § 1  Exolocation ───────────────────────────────────────────── -->
      <section :id="SECTIONS[0].id" class="ps-section">
        <div class="ps-section-tag">01</div>
        <h2 class="ps-section-title">
          <span class="ps-s-icon">◉</span>
          Your Exolocation
        </h2>
        <p>
          When you mint a settlement deed, the NFT's metadata encodes an <strong>exolocation</strong>
          — a precise coordinate record linking your property to a real astronomical body.
          Four coordinate systems cover every settlement type:
        </p>

        <div class="ps-coord-grid">
          <div v-for="cs in COORD_SYSTEMS" :key="cs.id" class="ps-coord-card">
            <div class="ps-coord-id">{{ cs.id }}</div>
            <div class="ps-coord-name">{{ cs.name }}</div>
            <div class="ps-coord-desc">{{ cs.desc }}</div>
          </div>
        </div>

        <p class="q-mt-md">
          The most common type is <code>exo-surface-v1</code>, used for ground settlements.
          The NFT stores your region's boundary as a polygon of surface latitude/longitude pairs,
          plus the host star's real RA/Dec coordinates — making your deed verifiably unique
          in the observable universe.
        </p>

        <div class="ps-code-block">
          <div class="ps-code-label">exolocation fields (surface type)</div>
          <pre>{{ EXOLOC_SAMPLE }}</pre>
        </div>

        <div class="ps-info-row">
          <div class="ps-info-box">
            <div class="ps-ib-label">ANCHOR</div>
            <div class="ps-ib-value">NASA Exoplanet Archive ID</div>
            <div class="ps-ib-note">Immutable reference — survives catalog updates</div>
          </div>
          <div class="ps-info-box">
            <div class="ps-ib-label">COORDINATES</div>
            <div class="ps-ib-value">RA / Dec (J2000.0)</div>
            <div class="ps-ib-note">Sky position of the host star in decimal degrees</div>
          </div>
          <div class="ps-info-box">
            <div class="ps-ib-label">BOUNDARY</div>
            <div class="ps-ib-value">Polygon — surface lat/lon</div>
            <div class="ps-ib-note">Encloses your settlement acreage on the planet</div>
          </div>
          <div class="ps-info-box">
            <div class="ps-ib-label">DISTANCE</div>
            <div class="ps-ib-value">sy_dist in parsecs</div>
            <div class="ps-ib-note">From Earth — affects sky rendering and transit cost</div>
          </div>
        </div>

        <p>
          The surface view at <code>/surface/:hostname/:planetName</code> uses these coordinates
          to render the correct host star position in your sky, neighbouring systems in their
          real directions, and any nearby galaxy cluster glow.
        </p>
      </section>

      <!-- ── § 2  Portals ───────────────────────────────────────────────── -->
      <section :id="SECTIONS[1].id" class="ps-section">
        <div class="ps-section-tag">02</div>
        <h2 class="ps-section-title">
          <span class="ps-s-icon">⬡</span>
          Nearby Portals
        </h2>
        <p>
          Every settlement surface includes an <strong>E8 Wormhole Conduit</strong> — a
          hexagonal portal node anchored at your settlement's location.
          Portals are the primary navigation mechanism between settlements separated by
          thousands of parsecs of real cosmic distance.
        </p>

        <div class="ps-portal-diagram">
          <div class="ps-pd-center">
            <div class="ps-pd-hex">⬡</div>
            <div class="ps-pd-label">YOUR SETTLEMENT</div>
          </div>
          <div class="ps-pd-spokes">
            <div v-for="d in PORTAL_DESTINATIONS" :key="d.label" class="ps-pd-spoke">
              <div class="ps-pd-line" />
              <div class="ps-pd-dest">
                <span class="ps-pd-dest-icon">◈</span>
                <span class="ps-pd-dest-name">{{ d.label }}</span>
                <span class="ps-pd-dest-dist">{{ d.dist }}</span>
              </div>
            </div>
          </div>
        </div>

        <h3 class="ps-sub-title">How portal destinations are calculated</h3>
        <p>
          The transit list surfaces the five nearest settlements that fall within the
          habitable temperature band (160 K – 500 K equilibrium temperature) and have
          a confirmed exolocation deed. Distance is computed in parsecs along the
          real line-of-sight between host stars — not traversal steps.
        </p>

        <div class="ps-rule-list">
          <div v-for="r in PORTAL_RULES" :key="r.key" class="ps-rule">
            <div class="ps-rule-key">{{ r.key }}</div>
            <div class="ps-rule-val">{{ r.val }}</div>
          </div>
        </div>

        <h3 class="ps-sub-title">E8 Mandala &amp; Pyramid structure</h3>
        <p>
          The portal geometry is derived from the <strong>E8 root system</strong> — 240 vectors
          in eight-dimensional space projected to three. Each portal node on the surface is
          one of eight connection points arranged in the mandala pattern.
          The apex pyramid above the settlement acts as the transit beacon,
          broadcasting the settlement's exolocation signature to the network.
        </p>
        <p>
          Initiating a warp opens the portal animation, computes the
          receiving settlement's sky orientation, and routes you via
          <code>/surface/:hostname/:planetName</code> with the approach vector
          stored in session so the sky loads facing the correct direction.
        </p>
      </section>

      <!-- ── § 3  Community engagement ─────────────────────────────────── -->
      <section :id="SECTIONS[2].id" class="ps-section">
        <div class="ps-section-tag">03</div>
        <h2 class="ps-section-title">
          <span class="ps-s-icon">◎</span>
          Community Engagement
        </h2>
        <p>
          Settlements are organized into <strong>Groups</strong> — named communities that
          hold shared land, cultural identity, and DAO voting weight.
          Active communities include OT Kulcha, Fana Ka, and Uni-Kibaoni-Peace-Youth-SHG.
        </p>

        <h3 class="ps-sub-title">Engagement tiers</h3>
        <div class="ps-tier-list">
          <div v-for="t in ENGAGEMENT_TIERS" :key="t.tier" class="ps-tier">
            <div class="ps-tier-badge" :style="{ borderColor: t.color, color: t.color }">
              {{ t.tier }}
            </div>
            <div class="ps-tier-info">
              <div class="ps-tier-name">{{ t.name }}</div>
              <div class="ps-tier-desc">{{ t.desc }}</div>
            </div>
          </div>
        </div>

        <h3 class="ps-sub-title">Group Manager responsibilities</h3>
        <p>
          Each Group has one or more <strong>Group Managers</strong> who onboard members,
          moderate activity, and submit eco-ops field reports.
          Group Managers are trained on the protocol, have elevated DAO proposal rights,
          and are accountable to the community for the group's alignment with the
          SCD Hub mission.
        </p>

        <div class="ps-rule-list">
          <div v-for="r in GROUP_MANAGER_RULES" :key="r.key" class="ps-rule">
            <div class="ps-rule-key">{{ r.key }}</div>
            <div class="ps-rule-val">{{ r.val }}</div>
          </div>
        </div>

        <h3 class="ps-sub-title">Inter-settlement visits</h3>
        <p>
          Any holder may visit any public settlement via the portal network — visits are
          viewable, not intrusive.  A settlement owner may flag a settlement as
          <em>private</em> (visible in the directory but surface view restricted to holders
          with an invitation NFT) or <em>community</em> (open to all verified group members).
        </p>
      </section>

      <!-- ── § 4  Privacy ───────────────────────────────────────────────── -->
      <section :id="SECTIONS[3].id" class="ps-section">
        <div class="ps-section-tag">04</div>
        <h2 class="ps-section-title">
          <span class="ps-s-icon">🔒</span>
          Privacy
        </h2>

        <div class="ps-privacy-grid">
          <div class="ps-priv-col ps-priv-col--public">
            <div class="ps-priv-head">PUBLIC (on-chain)</div>
            <ul class="ps-priv-list">
              <li v-for="i in PRIVACY_PUBLIC" :key="i">{{ i }}</li>
            </ul>
          </div>
          <div class="ps-priv-col ps-priv-col--private">
            <div class="ps-priv-head">PRIVATE (off-chain)</div>
            <ul class="ps-priv-list">
              <li v-for="i in PRIVACY_PRIVATE" :key="i">{{ i }}</li>
            </ul>
          </div>
        </div>

        <h3 class="ps-sub-title">Metadata visibility</h3>
        <p>
          NFT metadata is published to IPFS / Arweave as part of the minting process.
          The exolocation block — including your boundary polygon and host star RA/Dec —
          is permanently public and immutable once minted.
          Off-chain profile data (email, contact handles, field-op notes) is stored
          only in the SCD Hub CRM and is never written on-chain.
        </p>

        <h3 class="ps-sub-title">Settlement surface view</h3>
        <p>
          The 3D surface renderer reads your public exolocation to position the sky.
          No personal data is embedded in the rendering.  Screen captures of the surface
          view may be shared freely — they contain no wallet or identity information.
        </p>
      </section>

      <!-- ── § 5  Etiquette ─────────────────────────────────────────────── -->
      <section :id="SECTIONS[4].id" class="ps-section">
        <div class="ps-section-tag">05</div>
        <h2 class="ps-section-title">
          <span class="ps-s-icon">◇</span>
          Etiquette
        </h2>

        <p>
          Exotopia is a shared virtual space anchored to a non-profit mission.
          Community members are expected to treat the space, and each other, with care.
        </p>

        <div class="ps-etiq-list">
          <div v-for="e in ETIQUETTE" :key="e.rule" class="ps-etiq">
            <div class="ps-etiq-marker">›</div>
            <div class="ps-etiq-body">
              <div class="ps-etiq-rule">{{ e.rule }}</div>
              <div class="ps-etiq-detail">{{ e.detail }}</div>
            </div>
          </div>
        </div>

        <h3 class="ps-sub-title">Naming conventions</h3>
        <p>
          Settlement regions are named by their group at mint time.
          Names must be unique within the group, in English or the group's local language,
          and must not impersonate real places, people, or protected community names
          without explicit consent from the referenced community.
        </p>

        <h3 class="ps-sub-title">Eco-ops field reporting</h3>
        <p>
          Eco-ops activity is visible to all community members and used in the
          leaderboard on the settlements panel.  Reports must reflect genuine
          environmental or community work — inflated or fabricated reports are
          grounds for Group Manager review and potential deed freeze.
        </p>
      </section>

      <!-- ── § 6  Security ─────────────────────────────────────────────── -->
      <section :id="SECTIONS[5].id" class="ps-section">
        <div class="ps-section-tag">06</div>
        <h2 class="ps-section-title">
          <span class="ps-s-icon">⬙</span>
          Security
        </h2>

        <p>
          Your settlement deed is a non-fungible token on a supported EVM chain.
          Securing your wallet is the primary responsibility of every holder.
        </p>

        <div class="ps-sec-list">
          <div v-for="s in SECURITY_RULES" :key="s.title" class="ps-sec-item">
            <div class="ps-sec-icon">{{ s.icon }}</div>
            <div class="ps-sec-body">
              <div class="ps-sec-title">{{ s.title }}</div>
              <div class="ps-sec-detail">{{ s.detail }}</div>
            </div>
          </div>
        </div>

        <h3 class="ps-sub-title">Authorization levels</h3>
        <div class="ps-rule-list">
          <div v-for="r in AUTH_LEVELS" :key="r.key" class="ps-rule">
            <div class="ps-rule-key">{{ r.key }}</div>
            <div class="ps-rule-val">{{ r.val }}</div>
          </div>
        </div>

        <h3 class="ps-sub-title">Reporting incidents</h3>
        <p>
          If you suspect a wallet compromise, unauthorized transfer, or protocol
          exploit, contact your Group Manager immediately and open a ticket via
          the SCD Hub CRM.  The DAO Security Working Group monitors on-chain
          activity and can escalate to chain-level support where available.
        </p>
      </section>

      <!-- ── § 7  DAO governance ────────────────────────────────────────── -->
      <section :id="SECTIONS[6].id" class="ps-section">
        <div class="ps-section-tag">07</div>
        <h2 class="ps-section-title">
          <span class="ps-s-icon">⬡</span>
          DAO Governance
        </h2>

        <p>
          The <strong>Ecommunity DAO</strong> is the overarching governance layer for
          Exotopia, PON.INK, and the Ecocity platform.  It is operated as a
          non-profit under the SCD Hub umbrella.
        </p>

        <h3 class="ps-sub-title">Revenue split</h3>
        <div class="ps-revenue-bar">
          <div class="ps-rb-seg" style="flex:80;background:rgba(0,200,120,0.18);border-color:rgba(0,200,120,0.5)">
            <div class="ps-rb-pct">80%</div>
            <div class="ps-rb-label">Community &amp; Programs</div>
          </div>
          <div class="ps-rb-seg" style="flex:15;background:rgba(80,160,255,0.18);border-color:rgba(80,160,255,0.5)">
            <div class="ps-rb-pct">15%</div>
            <div class="ps-rb-label">Platform Operations</div>
          </div>
          <div class="ps-rb-seg" style="flex:5;background:rgba(255,180,60,0.18);border-color:rgba(255,180,60,0.5)">
            <div class="ps-rb-pct">5%</div>
            <div class="ps-rb-label">Reserve</div>
          </div>
        </div>

        <h3 class="ps-sub-title">Voting weight</h3>
        <p>
          Voting weight is determined by active deed count plus eco-ops score —
          rewarding both land ownership and community contribution.
          A single wallet cannot exceed 5% of total voting weight regardless of
          deed count, preventing concentration.
        </p>

        <div class="ps-rule-list">
          <div v-for="r in DAO_RULES" :key="r.key" class="ps-rule">
            <div class="ps-rule-key">{{ r.key }}</div>
            <div class="ps-rule-val">{{ r.val }}</div>
          </div>
        </div>

        <h3 class="ps-sub-title">Proposal lifecycle</h3>
        <div class="ps-proposal-steps">
          <div v-for="(step, i) in PROPOSAL_STEPS" :key="i" class="ps-proposal-step">
            <div class="ps-ps-num">{{ i + 1 }}</div>
            <div class="ps-ps-body">
              <div class="ps-ps-title">{{ step.title }}</div>
              <div class="ps-ps-desc">{{ step.desc }}</div>
            </div>
          </div>
        </div>

        <h3 class="ps-sub-title">Working groups</h3>
        <p>
          Day-to-day governance is delegated to elected working groups.
          Current working groups:
          <strong>Protocol</strong> (exolocation schema &amp; on-chain standards),
          <strong>Security</strong> (incident response &amp; CVE monitoring),
          <strong>Eco-ops</strong> (field reporting standards &amp; leaderboard),
          <strong>Community</strong> (onboarding, etiquette enforcement, translation).
        </p>
      </section>

      <!-- ── § 8  Notable Worlds ──────────────────────────────────────── -->
      <section :id="SECTIONS[7].id" class="ps-section">
        <div class="ps-section-tag">08</div>
        <h2 class="ps-section-title">
          <span class="ps-s-icon">★</span>
          Notable Worlds
        </h2>
        <p>
          Confirmed exoplanets within the habitable temperature band (200–400 K
          equilibrium temperature), sorted by distance from Earth.
          Click any card to open the system in the galaxy map.
        </p>

        <div v-if="galaxyStore.isLoaded && hzWorlds.length" class="ps-world-grid">
          <div
            v-for="w in hzWorlds"
            :key="w.hostname"
            class="ps-world-card"
            @click="router.push('/galaxy?focusHost=' + encodeURIComponent(w.hostname))"
          >
            <div class="ps-wc-name">{{ w.pl_name }}</div>
            <div class="ps-wc-host">{{ w.hostname }}</div>
            <div class="ps-wc-meta">
              <span v-if="w.dist">{{ w.dist.toFixed(0) }} pc</span>
              <span v-if="w.dist && w.pl_eqt"> · </span>
              <span v-if="w.pl_eqt">{{ Math.round(w.pl_eqt) }} K</span>
              <span v-if="w.spectype"> · {{ w.spectype.slice(0, 3) }}</span>
            </div>
            <div class="ps-wc-action">Enter system →</div>
          </div>
        </div>
        <div v-else-if="!galaxyStore.isLoaded" class="text-caption text-blue-grey-6 q-mt-sm">
          Loading galaxy archive…
        </div>

        <h3 class="ps-sub-title q-mt-lg">Named Cluster Galaxies</h3>
        <p>
          The brightest BCG galaxies in nearby rich clusters — each opens the
          cluster interior view where you can explore thousands of member galaxies.
        </p>
        <div class="ps-cluster-grid">
          <div
            v-for="c in CLUSTER_HIGHLIGHTS"
            :key="c.slug"
            class="ps-cluster-card"
            @click="router.push('/cluster-interior/' + c.slug)"
          >
            <div class="ps-cc-name">{{ c.name }}</div>
            <div class="ps-cc-galaxy">{{ c.galaxy }}</div>
            <div class="ps-cc-desc">{{ c.desc }}</div>
            <div class="ps-cc-action">Browse cluster →</div>
          </div>
        </div>
      </section>

      <!-- ── Footer ────────────────────────────────────────────────────── -->
      <div class="ps-footer">
        <q-btn
          unelevated rounded color="cyan-9"
          icon="mdi-rocket-launch" label="Mint a settlement deed"
          @click="$router.push('/mint')"
        />
        <q-btn
          flat rounded color="blue-grey-5"
          icon="scatter_plot" label="Explore planet systems"
          class="q-ml-sm"
          @click="$router.push('/galaxy?hz=1')"
        />
      </div>

    </main>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGalaxyStore } from 'src/stores/galaxy'

// ── Section definitions ────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'exolocation',  label: 'Exolocation',        icon: '◉' },
  { id: 'portals',      label: 'Nearby Portals',      icon: '⬡' },
  { id: 'community',    label: 'Community',           icon: '◎' },
  { id: 'privacy',      label: 'Privacy',             icon: '🔒' },
  { id: 'etiquette',    label: 'Etiquette',           icon: '◇' },
  { id: 'security',     label: 'Security',            icon: '⬙' },
  { id: 'dao',          label: 'DAO Governance',      icon: '⬡' },
  { id: 'worlds',      label: 'Notable Worlds',      icon: '★' },
]

// ── Static content ────────────────────────────────────────────────────────

const COORD_SYSTEMS = [
  {
    id:   'exo-surface-v1',
    name: 'Surface Colony',
    desc: 'Ground settlement on an exoplanet — defined by a surface lat/lon polygon. Most common type.',
  },
  {
    id:   'exo-orbital-v1',
    name: 'Orbital Station',
    desc: 'Zone or station in orbit around an exoplanet — defined by altitude band and inclination.',
  },
  {
    id:   'exo-lunar-orbital-v1',
    name: 'Lunar Orbit',
    desc: 'Zone in orbit around a moon of an exoplanet. The moon\'s parent planet is the reference body.',
  },
  {
    id:   'exo-stellar-orbital-v1',
    name: 'Stellar Orbit',
    desc: 'Zone around the star or binary star system — defined by orbital radius in AU.',
  },
]

const EXOLOC_SAMPLE = `coordinate_system: "exo-surface-v1"
reference_body:
  type:            "exoplanet"
  pl_name:         "Kepler-452b"
  host_star:       "Kepler-452"
  ra_deg:          296.0037
  dec_deg:         44.2776
  sy_dist_pc:      430
region_name: "Aurora Basin"
boundary:
  type:            "polygon"
  coordinate_units: "degrees_surface_lat_long"
  coordinates:     [[14.5,-23.1],[14.5,-22.0],
                    [15.8,-22.0],[15.8,-23.1],[14.5,-23.1]]`

const PORTAL_DESTINATIONS = [
  { label: 'TRAPPIST-1e',  dist: '12 pc'  },
  { label: 'Kepler-62f',   dist: '368 pc' },
  { label: 'LHS 1140 b',   dist: '15 pc'  },
  { label: 'K2-18 b',      dist: '124 pc' },
  { label: 'TOI-700 d',    dist: '102 pc' },
]

const PORTAL_RULES = [
  { key: 'Range',         val: 'No hard limit — any minted settlement may be reached.' },
  { key: 'Prerequisites', val: 'Destination must have an active exolocation deed.' },
  { key: 'Transit time',  val: 'Cosmetically instant — sky orientation adjusts on arrival.' },
  { key: 'Direction',     val: 'Approach vector stored in sessionStorage; receiving sky faces origin.' },
  { key: 'Cost',          val: 'Zero gas for off-chain transit (no on-chain transaction required).' },
]

const ENGAGEMENT_TIERS = [
  { tier: 'OBSERVER',  name: 'Observer',      color: '#668899', desc: 'Can view any public settlement and eco-ops board. No voting rights.' },
  { tier: 'MEMBER',    name: 'Group Member',  color: '#3399cc', desc: 'Active deed holder within a group. Full settlement access, one vote.' },
  { tier: 'STEWARD',   name: 'Group Steward', color: '#44ccaa', desc: 'Endorsed by majority of group members. Enhanced proposal rights.' },
  { tier: 'MANAGER',   name: 'Group Manager', color: '#ffcc44', desc: 'Elected or appointed coordinator. Onboards members, submits reports.' },
]

const GROUP_MANAGER_RULES = [
  { key: 'Onboarding',  val: 'Must verify new member identities against the SCD Hub CRM before assigning deeds.' },
  { key: 'Reporting',   val: 'Monthly eco-ops field reports due by the 5th of the following month.' },
  { key: 'Disputes',    val: 'First point of contact for intra-group disputes; escalates to DAO Community WG if unresolved.' },
  { key: 'Training',    val: 'Must complete the Group Manager protocol training module before taking the role.' },
]

const PRIVACY_PUBLIC = [
  'Wallet address (deed owner)',
  'NFT token ID and contract address',
  'Exolocation metadata (host star, coordinates, boundary polygon)',
  'Region name and group assignment',
  'Eco-ops field report summaries',
  'DAO vote records (pseudonymous — wallet only)',
]

const PRIVACY_PRIVATE = [
  'Real name, email, phone number',
  'Group Manager contact details',
  'CRM field notes and internal correspondence',
  'Draft eco-ops reports before submission',
  'Wallet recovery phrases and private keys',
  'Invitation NFT recipient lists',
]

const ETIQUETTE = [
  {
    rule: 'Respect settlement boundaries',
    detail: 'Do not attempt to claim or render land within another group\'s confirmed boundary polygon.',
  },
  {
    rule: 'Accurate eco-ops reporting',
    detail: 'Field reports represent real-world environmental work. Falsification undermines community trust and is subject to review.',
  },
  {
    rule: 'Constructive DAO participation',
    detail: 'Proposals and votes should advance the mission. Spam proposals or vote manipulation are grounds for voting weight reduction.',
  },
  {
    rule: 'Inclusive language',
    detail: 'The community spans many languages and cultures. Use clear, respectful language in all public-facing fields.',
  },
  {
    rule: 'Attribution for generated content',
    detail: 'If you share surface view renders or oracle-generated galaxy data externally, attribute them to Exotopia and the universe version.',
  },
  {
    rule: 'No unsolicited transit',
    detail: 'Do not automate or script portal transits into private settlements without consent. The portal list is a directory, not an open invitation.',
  },
]

const SECURITY_RULES = [
  {
    icon: '🔑',
    title: 'Seed phrase custody',
    detail: 'Your wallet seed phrase is the only recovery path. Store it offline, never in a browser, email, or cloud service. The platform will never ask for it.',
  },
  {
    icon: '🔗',
    title: 'Verify contract addresses',
    detail: 'Only interact with contracts listed on the Chains page (/chains). Check the address before signing any transaction.',
  },
  {
    icon: '🚫',
    title: 'Phishing prevention',
    detail: 'Official communications come from @exotopia.org and @scd-hub.org domains only. Treat all unsolicited DMs offering free deeds as phishing.',
  },
  {
    icon: '🔄',
    title: 'Transfer authorization',
    detail: 'Deed transfers require a signed transaction from the owner wallet. The platform cannot move your NFT on your behalf.',
  },
  {
    icon: '📋',
    title: 'Approval hygiene',
    detail: 'Revoke stale approvals regularly using a tool like Revoke.cash. Unlimited approvals on ERC-20 tokens are a common exploit vector.',
  },
]

const AUTH_LEVELS = [
  { key: 'View',        val: 'Anyone — no wallet required to view public settlements and the galaxy map.' },
  { key: 'Transit',     val: 'No wallet required — transit is off-chain navigation.' },
  { key: 'Eco-ops',     val: 'Requires active Group Member deed in the relevant group.' },
  { key: 'DAO vote',    val: 'Requires at least one active minted deed on a supported chain.' },
  { key: 'Proposal',    val: 'Requires Group Steward or Manager tier within a recognised group.' },
  { key: 'Protocol WG', val: 'Requires DAO vote — assigned per governance period.' },
]

const DAO_RULES = [
  { key: 'Quorum',         val: '10% of eligible voting weight must participate for a proposal to be binding.' },
  { key: 'Approval',       val: 'Simple majority (> 50%) for operational proposals; 66% for protocol changes.' },
  { key: 'Voting period',  val: '7 days for standard proposals, 3 days for urgent security proposals.' },
  { key: 'Cap',            val: 'Single wallet voting weight capped at 5% of total regardless of deed count.' },
  { key: 'Delegation',     val: 'Holders may delegate their voting weight to a Group Steward or Manager.' },
]

const PROPOSAL_STEPS = [
  { title: 'Draft',    desc: 'Author writes the proposal in the SCD Hub CRM. Group Manager endorses before submission.' },
  { title: 'Review',   desc: 'Relevant Working Group has 48 hours to raise blockers or request amendments.' },
  { title: 'Vote',     desc: 'Proposal goes live on the DAO platform. 7-day voting window opens.' },
  { title: 'Enact',    desc: 'If passed, the Protocol WG implements the change within 14 days.' },
  { title: 'Record',   desc: 'Outcome published in the GLOSSARY and on-chain event log (where applicable).' },
]

// ── Live data — HZ worlds & cluster highlights ────────────────────────────

const router      = useRouter()
const galaxyStore = useGalaxyStore()

const CLUSTER_HIGHLIGHTS = [
  { slug: 'virgo',   name: 'Virgo Cluster',   galaxy: 'M87',      desc: 'Core of the Virgo Supercluster — 2000+ member galaxies, 54 Mly' },
  { slug: 'coma',    name: 'Coma Cluster',    galaxy: 'NGC 4889', desc: 'One of the densest known clusters — 1000+ galaxies, 320 Mly' },
  { slug: 'perseus', name: 'Perseus Cluster', galaxy: 'NGC 1275', desc: 'Brightest X-ray cluster in the sky — 500+ galaxies, 240 Mly' },
  { slug: 'fornax',  name: 'Fornax Cluster',  galaxy: 'NGC 1399', desc: 'Nearest rich cluster to the Milky Way — 50+ major members, 62 Mly' },
]

const hzWorlds = computed(() => {
  const sysList = [...galaxyStore.systems.values()]
  return sysList
    .filter(sys => sys.planets.some(p => p.pl_eqt != null && p.pl_eqt >= 200 && p.pl_eqt <= 400))
    .sort((a, b) => (a.sy_dist ?? 9999) - (b.sy_dist ?? 9999))
    .slice(0, 12)
    .map(sys => {
      const hz = sys.planets.find(p => p.pl_eqt != null && p.pl_eqt >= 200 && p.pl_eqt <= 400)!
      return {
        hostname: sys.hostname,
        dist:     sys.sy_dist,
        spectype: (sys.st_spectype ?? hz.st_spectype ?? null) as string | null,
        pl_name:  hz.pl_name,
        pl_eqt:   hz.pl_eqt!,
        pl_rade:  hz.pl_rade ?? null,
        sy_pnum:  sys.sy_pnum ?? null,
      }
    })
})

// ── Active section tracking ───────────────────────────────────────────────

const mainEl       = ref<HTMLElement | null>(null)
const activeSection = ref(SECTIONS[0].id)

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el && mainEl.value) {
    mainEl.value.scrollTo({ top: el.offsetTop - 24, behavior: 'smooth' })
  }
}

function onScroll() {
  if (!mainEl.value) return
  const scrollTop = mainEl.value.scrollTop
  for (let i = SECTIONS.length - 1; i >= 0; i--) {
    const el = document.getElementById(SECTIONS[i].id)
    if (el && el.offsetTop - 80 <= scrollTop) {
      activeSection.value = SECTIONS[i].id
      return
    }
  }
  activeSection.value = SECTIONS[0].id
}

onMounted(() => {
  mainEl.value?.addEventListener('scroll', onScroll)
  void galaxyStore.loadData()
})
onUnmounted(() => { mainEl.value?.removeEventListener('scroll', onScroll) })
</script>

<style scoped>
/* ── Page shell ────────────────────────────────────────────────────────────── */

.ps-page {
  display: flex;
  height: calc(100vh - 44px);
  background: #010614;
  color: #c0d8f0;
  font-family: 'Courier New', monospace;
  overflow: hidden;
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */

.ps-sidebar {
  width: 200px;
  min-width: 200px;
  border-right: 1px solid rgba(0, 160, 220, 0.15);
  display: flex;
  flex-direction: column;
  padding: 20px 0 12px;
  background: rgba(0, 10, 30, 0.6);
}

.ps-sidebar-head {
  font-size: 9px;
  letter-spacing: 0.14em;
  color: rgba(0, 200, 255, 0.65);
  padding: 0 16px 14px;
  border-bottom: 1px solid rgba(0, 160, 220, 0.12);
  display: flex;
  align-items: center;
  gap: 6px;
}

.ps-head-icon { font-size: 12px; color: rgba(0, 210, 255, 0.8); }

.ps-nav { flex: 1; padding: 10px 0; overflow-y: auto; }

.ps-nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: rgba(160, 200, 230, 0.55);
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
  cursor: pointer;
}

.ps-nav-link:hover { color: rgba(200, 240, 255, 0.9); background: rgba(0, 160, 220, 0.06); }
.ps-nav-link--active { color: #00d4ff; background: rgba(0, 210, 255, 0.08); }

.ps-nav-icon { font-size: 11px; opacity: 0.7; }

.ps-sidebar-footer {
  display: flex;
  flex-direction: column;
  padding: 10px 12px 4px;
  border-top: 1px solid rgba(0, 160, 220, 0.10);
  gap: 2px;
}

/* ── Main scroll area ─────────────────────────────────────────────────────── */

.ps-main {
  flex: 1;
  overflow-y: auto;
  padding: 0 32px 48px;
  scroll-behavior: smooth;
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */

.ps-hero {
  padding: 36px 0 28px;
  border-bottom: 1px solid rgba(0, 160, 220, 0.12);
  margin-bottom: 8px;
}

.ps-hero-eyebrow {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: rgba(0, 210, 255, 0.55);
  margin-bottom: 8px;
}

.ps-hero-title {
  font-size: 22px;
  font-weight: 700;
  color: #e0f0ff;
  letter-spacing: 0.03em;
  margin: 0 0 12px;
  font-family: inherit;
}

.ps-hero-sub {
  font-size: 12px;
  color: rgba(160, 200, 230, 0.7);
  max-width: 640px;
  line-height: 1.7;
  margin: 0;
}

/* ── Sections ─────────────────────────────────────────────────────────────── */

.ps-section {
  padding: 36px 0 20px;
  border-bottom: 1px solid rgba(0, 160, 220, 0.08);
  position: relative;
}

.ps-section-tag {
  position: absolute;
  top: 38px;
  right: 0;
  font-size: 48px;
  font-weight: 900;
  color: rgba(0, 160, 220, 0.05);
  letter-spacing: -0.04em;
  line-height: 1;
  pointer-events: none;
}

.ps-section-title {
  font-size: 16px;
  font-weight: 700;
  color: #b0e0ff;
  margin: 0 0 14px;
  font-family: inherit;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ps-s-icon { opacity: 0.7; font-size: 14px; }

.ps-section p {
  font-size: 11.5px;
  color: rgba(180, 215, 240, 0.75);
  line-height: 1.75;
  max-width: 680px;
  margin: 0 0 12px;
}

.ps-sub-title {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(0, 210, 255, 0.6);
  margin: 20px 0 8px;
  font-weight: 700;
  font-family: inherit;
}

/* ── Coordinate system cards ─────────────────────────────────────────────── */

.ps-coord-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 16px 0;
  max-width: 680px;
}

.ps-coord-card {
  background: rgba(0, 20, 50, 0.6);
  border: 1px solid rgba(0, 140, 200, 0.18);
  border-radius: 6px;
  padding: 12px 14px;
}

.ps-coord-id {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: rgba(0, 200, 255, 0.65);
  margin-bottom: 4px;
}

.ps-coord-name {
  font-size: 12px;
  font-weight: 700;
  color: #c0e0ff;
  margin-bottom: 6px;
}

.ps-coord-desc {
  font-size: 10.5px;
  color: rgba(160, 200, 230, 0.65);
  line-height: 1.6;
}

/* ── Code block ───────────────────────────────────────────────────────────── */

.ps-code-block {
  background: rgba(0, 8, 24, 0.8);
  border: 1px solid rgba(0, 140, 200, 0.2);
  border-radius: 6px;
  padding: 14px 16px;
  margin: 14px 0;
  max-width: 580px;
}

.ps-code-label {
  font-size: 8px;
  letter-spacing: 0.12em;
  color: rgba(0, 200, 255, 0.4);
  margin-bottom: 8px;
}

.ps-code-block pre {
  font-size: 10.5px;
  color: rgba(180, 230, 255, 0.8);
  margin: 0;
  white-space: pre;
  line-height: 1.7;
}

/* ── Info row ─────────────────────────────────────────────────────────────── */

.ps-info-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 14px 0;
  max-width: 680px;
}

.ps-info-box {
  background: rgba(0, 20, 50, 0.5);
  border: 1px solid rgba(0, 140, 200, 0.14);
  border-radius: 4px;
  padding: 10px 12px;
}

.ps-ib-label {
  font-size: 8px;
  letter-spacing: 0.12em;
  color: rgba(0, 200, 255, 0.5);
  margin-bottom: 4px;
}

.ps-ib-value {
  font-size: 11px;
  font-weight: 700;
  color: #a0c8e8;
  margin-bottom: 4px;
}

.ps-ib-note { font-size: 9.5px; color: rgba(140, 180, 210, 0.55); line-height: 1.5; }

/* ── Portal diagram ───────────────────────────────────────────────────────── */

.ps-portal-diagram {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 18px 0;
  padding: 18px 20px;
  background: rgba(0, 15, 40, 0.5);
  border: 1px solid rgba(0, 180, 220, 0.12);
  border-radius: 8px;
  max-width: 680px;
}

.ps-pd-center { text-align: center; min-width: 90px; }
.ps-pd-hex { font-size: 32px; color: rgba(0, 210, 255, 0.75); line-height: 1; }
.ps-pd-label { font-size: 8px; letter-spacing: 0.12em; color: rgba(0, 200, 255, 0.5); margin-top: 4px; }

.ps-pd-spokes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.ps-pd-spoke { display: flex; align-items: center; gap: 8px; }
.ps-pd-line { width: 20px; height: 1px; background: rgba(0, 180, 220, 0.3); }

.ps-pd-dest {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 20, 50, 0.6);
  border: 1px solid rgba(0, 140, 200, 0.15);
  border-radius: 4px;
  padding: 4px 10px;
}

.ps-pd-dest-icon { color: rgba(0, 200, 255, 0.5); font-size: 10px; }
.ps-pd-dest-name { font-size: 10.5px; color: #a8d0f0; }
.ps-pd-dest-dist { font-size: 9px; color: rgba(140, 180, 210, 0.55); margin-left: auto; }

/* ── Rule list ────────────────────────────────────────────────────────────── */

.ps-rule-list { max-width: 680px; margin: 12px 0; }

.ps-rule {
  display: flex;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(0, 140, 200, 0.08);
  font-size: 10.5px;
}

.ps-rule-key {
  min-width: 120px;
  color: rgba(0, 200, 255, 0.6);
  font-weight: 700;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.ps-rule-val { color: rgba(180, 215, 240, 0.75); line-height: 1.6; }

/* ── Tier list ────────────────────────────────────────────────────────────── */

.ps-tier-list { max-width: 680px; margin: 14px 0; display: flex; flex-direction: column; gap: 8px; }

.ps-tier {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(0, 15, 40, 0.5);
  border-radius: 5px;
  border: 1px solid rgba(0, 140, 200, 0.1);
}

.ps-tier-badge {
  font-size: 8px;
  letter-spacing: 0.1em;
  border: 1px solid;
  border-radius: 3px;
  padding: 2px 6px;
  white-space: nowrap;
  margin-top: 1px;
  font-weight: 700;
}

.ps-tier-name {
  font-size: 11.5px;
  font-weight: 700;
  color: #b0d8f0;
  margin-bottom: 3px;
}

.ps-tier-desc { font-size: 10.5px; color: rgba(160, 200, 230, 0.65); line-height: 1.6; }

/* ── Privacy grid ─────────────────────────────────────────────────────────── */

.ps-privacy-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0;
  max-width: 680px;
}

.ps-priv-col {
  border-radius: 6px;
  padding: 14px 16px;
  border: 1px solid;
}

.ps-priv-col--public { background: rgba(0, 30, 60, 0.5); border-color: rgba(0, 180, 255, 0.2); }
.ps-priv-col--private { background: rgba(30, 10, 10, 0.4); border-color: rgba(200, 80, 80, 0.2); }

.ps-priv-head {
  font-size: 9px;
  letter-spacing: 0.12em;
  margin-bottom: 10px;
  font-weight: 700;
}
.ps-priv-col--public .ps-priv-head { color: rgba(0, 200, 255, 0.7); }
.ps-priv-col--private .ps-priv-head { color: rgba(220, 100, 100, 0.7); }

.ps-priv-list { margin: 0; padding-left: 14px; }
.ps-priv-list li { font-size: 10.5px; color: rgba(180, 215, 240, 0.7); line-height: 1.8; }

/* ── Etiquette list ───────────────────────────────────────────────────────── */

.ps-etiq-list { max-width: 680px; margin: 14px 0; display: flex; flex-direction: column; gap: 2px; }

.ps-etiq {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 140, 200, 0.07);
}

.ps-etiq-marker { color: rgba(0, 200, 255, 0.45); font-size: 14px; margin-top: 1px; flex-shrink: 0; }
.ps-etiq-rule { font-size: 11.5px; font-weight: 700; color: #b0d8f0; margin-bottom: 3px; }
.ps-etiq-detail { font-size: 10.5px; color: rgba(160, 200, 230, 0.65); line-height: 1.6; }

/* ── Security items ───────────────────────────────────────────────────────── */

.ps-sec-list {
  max-width: 680px;
  margin: 14px 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.ps-sec-item {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(0, 15, 40, 0.5);
  border: 1px solid rgba(0, 140, 200, 0.12);
  border-radius: 5px;
}

.ps-sec-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.ps-sec-title { font-size: 11.5px; font-weight: 700; color: #b0d8f0; margin-bottom: 4px; }
.ps-sec-detail { font-size: 10.5px; color: rgba(160, 200, 230, 0.65); line-height: 1.6; }

/* ── Revenue bar ──────────────────────────────────────────────────────────── */

.ps-revenue-bar {
  display: flex;
  gap: 4px;
  height: 64px;
  margin: 14px 0;
  max-width: 540px;
}

.ps-rb-seg {
  border: 1px solid;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.ps-rb-pct { font-size: 18px; font-weight: 900; color: rgba(200, 240, 255, 0.85); }
.ps-rb-label { font-size: 8px; letter-spacing: 0.06em; color: rgba(180, 220, 255, 0.55); text-align: center; padding: 0 4px; }

/* ── Proposal steps ───────────────────────────────────────────────────────── */

.ps-proposal-steps {
  max-width: 680px;
  margin: 14px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ps-proposal-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(0, 15, 40, 0.45);
  border-radius: 5px;
  border: 1px solid rgba(0, 140, 200, 0.1);
}

.ps-ps-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 160, 220, 0.15);
  border: 1px solid rgba(0, 180, 240, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: rgba(0, 210, 255, 0.8);
  flex-shrink: 0;
  margin-top: 1px;
}

.ps-ps-title { font-size: 11.5px; font-weight: 700; color: #b0d8f0; margin-bottom: 3px; }
.ps-ps-desc { font-size: 10.5px; color: rgba(160, 200, 230, 0.65); line-height: 1.6; }

/* ── Footer ───────────────────────────────────────────────────────────────── */

.ps-footer {
  padding: 36px 0 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

/* ── code inline ──────────────────────────────────────────────────────────── */

code {
  background: rgba(0, 140, 200, 0.12);
  border: 1px solid rgba(0, 140, 200, 0.2);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 10.5px;
  color: rgba(160, 220, 255, 0.85);
}

/* ── Notable Worlds — HZ system cards ────────────────────────────────────── */

.ps-world-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
  gap: 10px;
  margin-top: 14px;
  max-width: 740px;
}

.ps-world-card {
  background: rgba(0, 20, 50, 0.7);
  border: 1px solid rgba(0, 160, 220, 0.18);
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.ps-world-card:hover {
  border-color: rgba(0, 210, 255, 0.45);
  background: rgba(0, 30, 70, 0.85);
}

.ps-wc-name {
  font-size: 11px;
  font-weight: 700;
  color: #a0e0ff;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.ps-wc-host {
  font-size: 9px;
  color: rgba(100, 160, 200, 0.7);
  margin-bottom: 5px;
}

.ps-wc-meta {
  font-size: 9px;
  color: rgba(160, 200, 230, 0.55);
  line-height: 1.5;
  margin-bottom: 7px;
}

.ps-wc-action {
  font-size: 9px;
  color: rgba(0, 210, 255, 0.6);
  letter-spacing: 0.06em;
}

/* ── Notable Worlds — cluster highlight cards ─────────────────────────────── */

.ps-cluster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
  gap: 10px;
  margin-top: 14px;
  max-width: 740px;
}

.ps-cluster-card {
  background: rgba(10, 5, 30, 0.7);
  border: 1px solid rgba(100, 60, 180, 0.22);
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.ps-cluster-card:hover {
  border-color: rgba(140, 80, 255, 0.50);
  background: rgba(20, 8, 50, 0.85);
}

.ps-cc-name {
  font-size: 11px;
  font-weight: 700;
  color: #c0a0ff;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.ps-cc-galaxy {
  font-size: 9px;
  color: rgba(160, 120, 240, 0.7);
  margin-bottom: 5px;
}

.ps-cc-desc {
  font-size: 9px;
  color: rgba(160, 180, 220, 0.55);
  line-height: 1.6;
  margin-bottom: 7px;
}

.ps-cc-action {
  font-size: 9px;
  color: rgba(160, 120, 255, 0.65);
  letter-spacing: 0.06em;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */

@media (max-width: 768px) {
  .ps-sidebar { display: none; }
  .ps-coord-grid { grid-template-columns: 1fr; }
  .ps-info-row { grid-template-columns: repeat(2, 1fr); }
  .ps-privacy-grid { grid-template-columns: 1fr; }
  .ps-sec-list { grid-template-columns: 1fr; }
  .ps-portal-diagram { flex-direction: column; }
}
</style>
