<template>
  <q-page class="gloss-page">

    <!-- ── Sidebar (index) ─────────────────────────────────────────────── -->
    <aside class="gloss-sidebar">
      <div class="gloss-sidebar-head">
        <q-icon name="mdi-book-open-variant" color="cyan-5" size="14px" class="q-mr-xs" />
        GLOSSARY
      </div>

      <!-- Search -->
      <div class="gloss-search-wrap">
        <input
          v-model="searchQ"
          class="gloss-search"
          placeholder="Search terms…"
          type="search"
          @input="filterTerms"
        />
      </div>

      <!-- Category index -->
      <div class="gloss-index">
        <div
          v-for="cat in visibleCategories"
          :key="cat.id"
          class="gloss-cat"
        >
          <div class="gloss-cat-label" @click="toggleCat(cat.id)">
            <span class="gloss-cat-arrow">{{ openCats.has(cat.id) ? '▾' : '▸' }}</span>
            {{ cat.label }}
            <span class="gloss-cat-count">{{ cat.terms.length }}</span>
          </div>

          <div v-if="openCats.has(cat.id)" class="gloss-cat-terms">
            <a
              v-for="t in cat.terms"
              :key="t.id"
              :href="`#term-${t.id}`"
              class="gloss-index-link"
              :class="{ 'gloss-index-link--active': activeId === t.id }"
              @click.prevent="scrollTo(t.id)"
            >
              <span class="gloss-ref">[{{ t.id }}]</span>
              {{ t.term }}
            </a>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="gloss-sidebar-foot">
        <div class="gsf-count">{{ allTerms.length }} terms · v{{ VERSION }}</div>
        <div class="gsf-note">GPL v3 · SCD Hub</div>
      </div>
    </aside>

    <!-- ── Main content ────────────────────────────────────────────────── -->
    <main class="gloss-main">

      <!-- Page header -->
      <div class="gloss-header">
        <h1 class="gloss-title">
          <router-link to="/" class="gloss-home-link">EXOTOPIA</router-link>
          / PON INK — GLOSSARY
        </h1>
        <p class="gloss-intro">
          Canonical reference for all platform terminology.
          Numbered entries are used as footnotes across all documents
          using superscript notation — e.g. <code>sublunary¹⁰</code> links to entry [10].
        </p>
      </div>

      <!-- Show search results or category sections -->
      <template v-if="searchQ">
        <div class="gloss-section" v-if="searchResults.length">
          <div class="gloss-section-label">
            RESULTS FOR "{{ searchQ }}" · {{ searchResults.length }} found
          </div>
          <div
            v-for="t in searchResults"
            :key="t.id"
            :id="`term-${t.id}`"
            class="gloss-entry"
          >
            <TermEntry :term="t" @intersect="activeId = t.id" />
          </div>
        </div>
        <div v-else class="gloss-empty">
          No terms match "{{ searchQ }}"
        </div>
      </template>

      <template v-else>
        <div
          v-for="cat in CATEGORIES"
          :key="cat.id"
          class="gloss-section"
        >
          <div class="gloss-section-label">{{ cat.label }}</div>
          <div
            v-for="t in cat.terms"
            :key="t.id"
            :id="`term-${t.id}`"
            class="gloss-entry"
            ref="entryRefs"
          >
            <TermEntry :term="t" @intersect="activeId = t.id" />
          </div>
        </div>
      </template>

    </main>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'

const VERSION = '1.0'

// ── Term type ─────────────────────────────────────────────────────────────────

interface GlossTerm {
  id:         number
  term:       string
  short:      string             // one-line definition
  body:       string             // full explanation (markdown-lite)
  etymology?: string             // word origin
  related?:   number[]           // IDs of related terms
  category:   string
}

// ── Full term catalog ─────────────────────────────────────────────────────────

const TERMS: GlossTerm[] = [

  // ── PROTOCOL IDENTIFIERS ──────────────────────────────────────────────────
  {
    id: 1, category: 'protocol', term: 'STN',
    short: 'Station Number — prefix for Orbital Station announcement IDs.',
    body: 'The three-letter prefix used in Orbital Station announcement IDs (STN-001 through STN-019). Each announcement is a message from a named station in the network. Mirrors the on-chain StationRecord identifier (prefixed STA, see [2]), shortened to STN for compact display in the monospace UI.',
    related: [2, 37],
  },
  {
    id: 2, category: 'protocol', term: 'STA',
    short: 'Station — prefix for on-chain Station Core NFT identifiers.',
    body: 'The prefix used in on-chain Station Core NFT identifiers (e.g. STA-0001). Unique within the PON INK ecosystem. Once minted on Solana, the ID is permanent and cannot be changed.',
    related: [1, 37],
  },
  {
    id: 3, category: 'protocol', term: 'EXOLOC',
    short: 'Exolocation address prefix — the exo- namespace for all virtual property addresses.',
    body: 'The exo- namespace used in all virtual property addresses (e.g. exo-surface-v1:Kepler-442b:14.5,-23.1). Six coordinate systems are currently defined: exo-surface-v1, exo-orbital-v1, exo-lunar-orbital-v1, exo-stellar-orbital-v1, exo-moon-surface-v1, exo-moon-lagrange-v1, exo-moon-interface-v1.',
    related: [24, 6],
  },
  {
    id: 4, category: 'protocol', term: 'ARC-3 / ARC-69',
    short: 'Algorand NFT metadata standards used for Exolocation NFTs.',
    body: 'Two complementary NFT metadata standards on the Algorand blockchain. ARC-3 stores rich JSON metadata off-chain (typically on IPFS), referenced by the ASA URL field. ARC-69 stores compact identifying metadata directly in the on-chain note field (≤ 1 KB). Exolocation NFTs use both: ARC-3 for full property data, ARC-69 for the tamper-evident on-chain fingerprint.',
    related: [39],
  },
  {
    id: 5, category: 'protocol', term: 'cNFT',
    short: 'Compressed NFT — Solana Metaplex Bubblegum standard for low-cost community airdrops.',
    body: 'A Solana NFT standard that stores token data in a Merkle tree rather than individual accounts. Reduces mint cost from ~0.01 SOL to ~0.000005 SOL, enabling large-scale community airdrops. Used for Station Core, Station Module, and EcocitySolution NFTs.',
    related: [37, 38, 36],
  },

  // ── TROPHIC HIERARCHY ─────────────────────────────────────────────────────
  {
    id: 6, category: 'trophic', term: 'Trophic Level',
    short: 'A settlement\'s position in the gravitational/energetic hierarchy of a star system.',
    etymology: 'From Greek τροφή (trophē, nourishment). In ecology describes position in a food chain.',
    body: 'In ecology, a trophic level describes an organism\'s position in the food chain — energy flows from producers through consumers. In Exotopia, the term is borrowed to describe a settlement\'s position in the gravitational and energetic hierarchy of a star system. Six levels are defined: L1 STELLAR through L6 LIMINAL. The metaphor captures both spatial position and the dependency relationships between levels.',
    related: [7, 8, 9, 10, 11, 12],
  },
  {
    id: 7, category: 'trophic', term: 'L1 STELLAR',
    short: 'Trophic level 1 — orbital zone around the host star.',
    body: 'The outermost trophic level — orbital zones around the host star itself. Coordinate system: exo-stellar-orbital-v1. High-energy environment; extreme engineering requirements. Primary energy source for all lower levels.',
    related: [6],
  },
  {
    id: 8, category: 'trophic', term: 'L2 PLANETARY',
    short: 'Trophic level 2 — on or in orbit around a confirmed exoplanet.',
    body: 'The most common settlement tier. Coordinate systems: exo-surface-v1 (surface polygon) and exo-orbital-v1 (altitude band). The main tier addressed by the NASA Exoplanet Archive data.',
    related: [6, 24],
  },
  {
    id: 9, category: 'trophic', term: 'L3 LUNAR',
    short: 'Trophic level 3 — in orbit around a moon of an exoplanet.',
    body: 'In orbit around a moon of an exoplanet. Coordinate system: exo-lunar-orbital-v1. The reference body is the moon itself. Parent planet provides tidal heating and visual dominance of the sky.',
    related: [6, 18],
  },
  {
    id: 10, category: 'trophic', term: 'L4 SUBLUNARY',
    short: 'Trophic level 4 — on the surface of a moon.',
    etymology: 'From Latin sub (below) + luna (moon).',
    body: 'On the surface of a moon. Coordinate system: exo-moon-surface-v1. The parent planet dominates the sky. Tidal heating may provide subsurface liquid water (Europa-type). Tidally locked moons have a permanent planet-facing side and a permanent far side; the terminator zone is most habitable.',
    related: [6, 13, 18],
  },
  {
    id: 11, category: 'trophic', term: 'L5 SYZYGY',
    short: 'Trophic level 5 — at a Lagrange equilibrium point of the moon–planet system.',
    etymology: 'From Greek syzygía (union, yoke).',
    body: 'At a Lagrange equilibrium point of the moon–planet system. Coordinate system: exo-moon-lagrange-v1. Four points are available: L1 (inner gateway, unstable), L2 (outer observatory, unstable), L4 (leading trojan, stable), L5 (trailing trojan, stable). L4 and L5 accumulate material naturally and require no station-keeping thrust.',
    related: [6, 14, 19],
  },
  {
    id: 12, category: 'trophic', term: 'L6 LIMINAL',
    short: 'Trophic level 6 — in the transition zone between a moon\'s and planet\'s gravitational dominance.',
    etymology: 'From Latin limen (threshold, doorway).',
    body: 'In the transition zone between a moon\'s gravitational dominance and its parent planet\'s. Coordinate system: exo-moon-interface-v1. Five zone types: Hill sphere boundary, Roche limit zone, tidal-lock transition, magnetosphere interface, and orbital resonance zone.',
    related: [6, 15, 16, 17],
  },

  // ── ASTRONOMICAL ─────────────────────────────────────────────────────────
  {
    id: 13, category: 'astronomical', term: 'Sublunary',
    short: 'Below the moon — historically the zone of change; here, on a moon\'s surface.',
    etymology: 'Latin sub (below) + luna (moon).',
    body: 'In Aristotelian cosmology, the sublunary realm was the region between Earth and the Moon — the zone of change, imperfection, and mortality. In Exotopia, SUBLUNARY (L4) describes being on a moon\'s surface: below the moon\'s sky, subject to its gravity and its parent planet\'s influence.',
    related: [10],
  },
  {
    id: 14, category: 'astronomical', term: 'Syzygy',
    short: 'Alignment of three or more celestial bodies; used for the Lagrange balance points.',
    etymology: 'Greek syzygía (union, yoke).',
    body: 'In astronomy, syzygy is the alignment of three or more celestial bodies — most commonly the Sun, Earth, and Moon at new or full moon. In Exotopia, SYZYGY (L5) refers to the gravitational balance points of the moon–planet system: the Lagrange points where gravitational pulls combine to create stable or semi-stable equilibrium.',
    related: [11, 19],
  },
  {
    id: 15, category: 'astronomical', term: 'Liminal',
    short: 'Threshold — the transitional zone between gravitational domains.',
    etymology: 'Latin limen (threshold, doorway).',
    body: 'A liminal space is a transitional zone — between states, between territories, between conditions. In Exotopia, LIMINAL (L6) describes the boundary region between a moon\'s gravitational sphere of influence and its parent planet\'s — neither fully one nor the other.',
    related: [12],
  },
  {
    id: 16, category: 'astronomical', term: 'Hill Sphere',
    short: 'The region where a moon\'s gravity dominates over its parent planet\'s tidal forces.',
    body: 'The region around a celestial body within which its gravitational pull dominates over the tidal forces of the primary body. Radius: r_H = a × ∛(m / 3M). A moon can only retain natural satellites within its Hill sphere. The Hill sphere boundary is a key feature of the L6 LIMINAL zone.',
    related: [12],
  },
  {
    id: 17, category: 'astronomical', term: 'Roche Limit',
    short: 'The minimum distance at which tidal forces prevent a coherent body from forming.',
    body: 'The minimum distance from a primary at which tidal forces exceed a satellite\'s self-gravity. For a fluid body: d = 2.44 × R_primary × ∛(ρ_primary / ρ_satellite). Named after Édouard Roche (1850). Within the Roche limit, rings form but moons cannot.',
    related: [12],
  },
  {
    id: 18, category: 'astronomical', term: 'Tidal Lock',
    short: 'Synchronous rotation — one face permanently pointing toward the parent body.',
    body: 'Synchronous rotation in which a body\'s orbital period equals its rotational period, causing one face to permanently point toward the primary. Most inner moons are tidally locked. Tidally locked planets in habitable zones have permanent day and night hemispheres; the terminator is the most habitable strip.',
    related: [10, 12],
  },
  {
    id: 19, category: 'astronomical', term: 'Lagrange Points',
    short: 'Five gravitational equilibrium positions in a two-body system.',
    body: 'Five points in a two-body orbital system where a small object can maintain a stable or semi-stable position relative to both bodies. Named after Joseph-Louis Lagrange (1772). L1, L2, L3 are unstable (require active station-keeping). L4 and L5 are stable (trojan points, 60° ahead and behind the smaller body).',
    related: [11, 14],
  },
  {
    id: 20, category: 'astronomical', term: 'Barycentre',
    short: 'The centre of mass of a two-body system, around which both bodies orbit.',
    body: 'The centre of mass of a two-body (or multi-body) system. In a binary star system, the barycentre may lie outside either star. In the DefenderNav, camera distance and angle are computed relative to the system barycentre rather than the primary star alone.',
    related: [43],
  },
  {
    id: 21, category: 'astronomical', term: 'Equilibrium Temperature',
    short: 'Theoretical surface temperature of a planet assuming no atmosphere (NASA field: pl_eqt).',
    body: 'The theoretical surface temperature of a planet if it were a perfect blackbody with no atmosphere, computed from stellar luminosity and orbital distance. Used in Exotopia to classify settlements as FROZEN, ICY, TEMPERATE, WARM, HOT, or ULTRA-HOT and to determine surface palette and terrain roughness.',
    related: [],
  },
  {
    id: 22, category: 'astronomical', term: 'Circumbinary (P-type / S-type)',
    short: 'P-type: planet orbits both stars. S-type: planet orbits one star of a binary.',
    body: 'P-type (circumbinary): a planet that orbits both stars of a binary system, outside both. S-type (circumstellar): a planet that orbits one star. Kepler-16b is a famous P-type example. The DefenderNav\'s forbidden zone (red-amber hatching) marks the unstable region inside P-type systems.',
    related: [23, 20],
  },
  {
    id: 23, category: 'astronomical', term: 'Forbidden Zone',
    short: 'The dynamically unstable region inside a circumbinary system where no stable orbit exists.',
    body: 'In a circumbinary system, the region around the stellar barycentre within approximately 2–4× the binary separation where planetary orbits are dynamically unstable due to gravitational perturbations. Rendered as diagonal-hatched red-amber in the DefenderNav system strip.',
    related: [22],
  },

  // ── SETTLEMENT & GOVERNANCE ───────────────────────────────────────────────
  {
    id: 24, category: 'settlement', term: 'Exolocation',
    short: 'A permanent on-chain address anchoring a virtual settlement to a NASA-catalogued location.',
    body: 'A permanent, on-chain address anchoring a virtual settlement to a specific location in the NASA Exoplanet Archive. Format: [coordinate-system]:[reference-body]:[location-descriptor]. Six coordinate systems support six trophic levels. The Exolocation NFT (ARC-3 / ARC-69 on Algorand) is the virtual land deed.',
    related: [3, 39, 6],
  },
  {
    id: 25, category: 'settlement', term: 'Settlement Dome',
    short: 'The primary structure of a Level 4/5 settlement — geodesic hemisphere with community facilities.',
    body: 'The primary physical structure of a settlement in Exotopia. A geodesic hemisphere containing the library building, water feature, food production, vegetation, stone circle, and Sustainable Land Assistant orbs.',
    related: [26, 29],
  },
  {
    id: 26, category: 'settlement', term: 'mule-bot',
    short: 'AI-powered domain specialist knowledge assistant living in the settlement gallery.',
    body: 'In V1, corpus-driven — speaks in the owner\'s words, assembled from items added to the knowledge base. In V2, a local-network AI (no LLM, no cloud) reviews and compiles the corpus across land care specialist domains: educational advocacy materials; business planning metrics; community water system health; youth career development in environmental engineering; Hub Approvideo library maintenance.',
    related: [27, 45],
  },
  {
    id: 27, category: 'settlement', term: 'Eco-ops',
    short: 'Ecological operations — the check-in protocol connecting field work to on-chain records.',
    body: 'Short for ecological operations. The check-in protocol connecting real-world community field work to on-chain records and virtual rewards. Eight activity types: wqMap (water quality), garbageMap, farmMap, productMap, transportMap, storageMap, sourceMap, cleaningMap.',
    related: [26, 33],
  },
  {
    id: 28, category: 'settlement', term: '40 Acres',
    short: '"40 acres and a mule" — the standard virtual land claim unit with its knowledge assistant.',
    body: 'A reference to the unfulfilled 1865 promise of land redistribution to freed enslaved people in the United States. In Exotopia, 40 virtual acres is the standard land claim unit attached to an Exolocation NFT. The mule is the mule-bot — the knowledge assistant that accompanies the settlement.',
    related: [24, 26],
  },
  {
    id: 29, category: 'settlement', term: 'Stone Circle',
    short: 'Cultural landmark marking cardinal directions, time capsule, and community intention statement.',
    body: 'The cultural landmark at the centre of each settlement. Marks cardinal directions, functions as a time capsule, and carries the community\'s intention statement. The E8 Pyramid (wormhole access point) is hidden within the circle, visible only in DK.MAT (dark matter) view mode.',
    related: [44],
  },
  {
    id: 30, category: 'settlement', term: 'Ecommunity DAO',
    short: 'The self-evolving governance layer for settlement collectives in Exotopia.',
    body: 'Principles: privacy by design, anti-harassment enforcement with community-controlled moderation, collective direction of technology resources toward local Earth-based projects. Governance tokens earned through participation, facilitation, and mentorship.',
    related: [31],
  },
  {
    id: 31, category: 'settlement', term: 'Resonance Split',
    short: 'The allocation applied when a transaction carries a fee. It is not a yield or a revenue share.',
    body: 'Two allocations, depending on what is being minted. $SUNLIGHT recordings and generative compositions use 99 / 0.75 / 0.25 — 99% to the creator/artist/worker wallet, 0.75% to the Community Hardware Fund (WATSAN / mapping infrastructure), 0.25% to platform maintenance. Exoloc settlement deeds use 100 / 0 / 0 — the platform takes no cut. Primary settlement minting is free: you pay network gas and nothing else, so on that path there is no fee to divide. Paths are computed independently and always displayed before confirmation, never combined into a single figure with gas costs or community payout amounts (fee isolation rule). A settlement record carries no claim on future platform revenue and no resale royalty — seller_fee_basis_points is 0 and Exotopia does not operate a secondary market.',
    related: [40],
  },

  // ── NFT & CHAIN ──────────────────────────────────────────────────────────
  {
    id: 32, category: 'nft', term: '$SUNLIGHT',
    short: 'Sound / music NFT — ownership and licensing rights to a recorded track.',
    body: 'Represents ownership and licensing rights to a recorded track or soundbank. Minted on Polygon or Solana. Includes title, duration, BPM, key, genre, sample credits, license terms, and IPFS audio CID. Royalty enforcement is on-chain.',
    related: [31],
  },
  {
    id: 33, category: 'nft', term: 'Water Quality Certificate',
    short: 'On-chain proof of a water quality field measurement — tamper-evident.',
    body: 'Fields: pH, turbidity (NTU), conductivity (µS/cm), nitrate (mg/L), coliform (CFU/100mL), GPS coordinates, timestamp, potability assessment. Stored on Polygon; backup on Arweave. Feeds the mule-bot\'s community water system health domain.',
    related: [26, 27],
  },
  {
    id: 34, category: 'nft', term: 'Health Card ID',
    short: 'Decentralised encrypted health credential on Polygon.',
    body: 'Portable to employers and health systems independent of the SCD Hub platform. Encrypted on-chain.',
    related: [],
  },
  {
    id: 35, category: 'nft', term: 'POAP',
    short: 'Proof of Attendance Protocol — event participation proof used for DAO voting weight.',
    body: 'Event participation proof used for voting weight in the Ecommunity DAO and event coordination. Multi-chain.',
    related: [30],
  },
  {
    id: 36, category: 'nft', term: 'EcocitySolution NFT',
    short: 'Virtual settlement object + proof of real-world sustainable design learning or construction.',
    body: 'A collectible virtual object (3D GLTF, < 5,000 triangles) displayable in the settlement dome that also certifies learning, construction, or support of a real-world sustainable design. Categories: WATSAN, ENERGY, SHELTER, HEALTHCARE, FOOD. Minted on Solana via Metaplex Bubblegum.',
    related: [5, 25],
  },
  {
    id: 37, category: 'nft', term: 'Station Core',
    short: 'The root NFT of a settlement station — anchors infrastructure to an exoplanet location.',
    body: 'A named, on-chain record anchoring the station to a specific exoplanet location. Contains the Exolocation reference and a map of installed module mint addresses. Minted on Solana. Identifier prefix: STA.',
    related: [2, 38, 24],
  },
  {
    id: 38, category: 'nft', term: 'Station Module',
    short: 'A functional zone within a Station Core — gallery, watsan, energy, shelter, healthcare, food, or command.',
    body: 'Each module is a separate Solana cNFT minted independently. Modules can be added to a Station Core over time. Seven types: gallery, watsan, energy, shelter, healthcare, food, command.',
    related: [37, 5],
  },
  {
    id: 39, category: 'nft', term: 'Exolocation NFT',
    short: 'The virtual land deed — ARC-3 / ARC-69 on Algorand, free to mint.',
    body: 'Encodes the full exolocation address, coordinate system, reference body, boundary descriptor, and owner attribution. Free to mint (network gas only). Not resellable through any Exotopia-hosted market.',
    related: [4, 24, 31],
  },

  // ── PROTOCOL & PLATFORM ──────────────────────────────────────────────────
  {
    id: 40, category: 'platform', term: 'PON INK',
    short: '"Put it on ink" — the primary operations portal for the SCD Hub ecosystem.',
    body: 'The daily-use tool for artists, field workers, and community builders. Every action is permanently recorded on-chain. Hosts: sound tools, cultural events, M-Pesa / Stripe payments, NFT minting, airdrop campaigns, and user dashboards.',
    related: [41, 31],
  },
  {
    id: 41, category: 'platform', term: 'SCD Hub',
    short: 'Sustainable Community Development Hub — US non-profit operating Exotopia, pon.ink, ecocity.com.',
    body: 'Dedicated to improving lives through mentor networks in environmental engineering, community resilience, reliable income, and capacity development globally.',
    related: [40],
  },
  {
    id: 42, category: 'platform', term: 'E8 Coxeter Lattice',
    short: 'Root system in 8-dimensional space — the mathematical basis for the wormhole network.',
    body: 'A root system in 8-dimensional space with 240 roots and exceptional symmetry. The E8 lattice is the mathematical basis for the wormhole conduit routing geometry. The E8 mandala is displayed during the 7-second portal animation.',
    related: [44],
  },
  {
    id: 43, category: 'platform', term: 'DefenderNav',
    short: 'Persistent horizontal minimap strip — inspired by the 1981 Williams Electronics arcade game.',
    body: 'Shows the full spatial context of the current view — orbital plane, 360° sky horizon, or cosmic web XZ projection. Three modes: system, surface, cosmic. Controls: view mode pills (NAT / X-RAY / DK.MAT), event finder, collapse toggle.',
    related: [20],
  },
  {
    id: 44, category: 'platform', term: 'Wormhole Conduit',
    short: 'Transit node at the periphery of a cosmic void — the routing point for long-distance travel.',
    body: 'Placed at the periphery of a great cosmic void in the large-scale structure of the universe. Visible in cosmic view as a pulsing cyan tetrahedron. In DK.MAT mode, the E8 Pyramid in settlements becomes visible, revealing the local entry point to the conduit network.',
    related: [42, 29],
  },
  {
    id: 45, category: 'platform', term: 'Hub Approvideo',
    short: 'The SCD Hub\'s curated approved video resource library — maintained by the mule-bot.',
    body: 'The SCD Hub\'s curated collection of approved video resources. Maintained by the mule-bot as one of its land care specialist domains — new materials surfaced, outdated content flagged, existing catalogue kept organised and findable for field communities.',
    related: [26],
  },
  {
    id: 46, category: 'platform', term: 'Science Outreach Event',
    short: 'A cosmic-map session run jointly with international education or research partners.',
    body: 'A COSMIC_EVENTS entry of type "science-outreach" — marked on the cosmic map with a blue beacon ring. Used for live cluster tours with astronomy education networks and citizen-science data verification sprints. Unlike sound-session or gallery events, the focus is the underlying dataset itself: comparing generated content against real catalogs and feeding gaps back into the data pipeline.',
    related: [47, 31],
  },
  {
    id: 47, category: 'astronomical', term: 'LOD Data Reveal',
    short: 'Progressive disclosure of catalog vs. generated data as the camera zooms into a galaxy cluster member.',
    body: 'In Cluster Interior view, clicking a galaxy flies the camera to a fixed close distance and tags the view OVERVIEW / GALAXY VIEW / SYSTEMS VIEW based on camera distance. At SYSTEMS VIEW a deterministic star-system cloud is spawned, colour-coded by spectral class. If the galaxy has no real star-system catalog entry, an "[LOD] DATA REQUEST" note is printed to the browser console naming the missing dataset — the same signal used in Citizen Data Verification science-outreach events.',
    related: [46],
  },
]

// ── Categories ────────────────────────────────────────────────────────────────

interface Category { id: string; label: string; terms: GlossTerm[] }

const CATEGORIES: Category[] = [
  { id: 'protocol',      label: 'PROTOCOL IDENTIFIERS', terms: TERMS.filter(t => t.category === 'protocol')     },
  { id: 'trophic',       label: 'TROPHIC HIERARCHY',    terms: TERMS.filter(t => t.category === 'trophic')      },
  { id: 'astronomical',  label: 'ASTRONOMICAL TERMS',   terms: TERMS.filter(t => t.category === 'astronomical') },
  { id: 'settlement',    label: 'SETTLEMENT & GOVERNANCE', terms: TERMS.filter(t => t.category === 'settlement') },
  { id: 'nft',           label: 'NFT & CHAIN',           terms: TERMS.filter(t => t.category === 'nft')         },
  { id: 'platform',      label: 'PROTOCOL & PLATFORM',  terms: TERMS.filter(t => t.category === 'platform')    },
]

const allTerms = TERMS

// ── Search ────────────────────────────────────────────────────────────────────

const searchQ = ref('')
const activeId = ref<number | null>(null)

const searchResults = computed(() => {
  const q = searchQ.value.toLowerCase().trim()
  if (!q) return []
  return allTerms.filter(t =>
    t.term.toLowerCase().includes(q) ||
    t.short.toLowerCase().includes(q) ||
    t.body.toLowerCase().includes(q) ||
    (t.etymology ?? '').toLowerCase().includes(q)
  )
})

// ── Category open/close ───────────────────────────────────────────────────────

const openCats = ref<Set<string>>(new Set(['protocol', 'trophic']))

function toggleCat(id: string) {
  if (openCats.value.has(id)) openCats.value.delete(id)
  else openCats.value.add(id)
}

const visibleCategories = computed(() =>
  searchQ.value
    ? CATEGORIES.filter(c => c.terms.some(t => searchResults.value.includes(t)))
    : CATEGORIES
)

// ── Scroll ────────────────────────────────────────────────────────────────────

function scrollTo(id: number) {
  activeId.value = id
  const el = document.getElementById(`term-${id}`)
  if (!el) return
  // Open the category that contains this term
  const cat = CATEGORIES.find(c => c.terms.some(t => t.id === id))
  if (cat) openCats.value.add(cat.id)
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function filterTerms() {
  // Auto-open categories that have matching results
  if (searchQ.value) {
    for (const cat of CATEGORIES) {
      if (cat.terms.some(t => searchResults.value.includes(t))) {
        openCats.value.add(cat.id)
      }
    }
  }
}
</script>

<!-- ── TermEntry sub-component (inline) ───────────────────────────────────── -->
<script lang="ts">
export default defineComponent({ name: 'GlossaryPage' })

// Inline sub-component for a single term entry
const TermEntry = defineComponent({
  props: { term: { type: Object as () => import('vue').PropType<any>, required: true } },
  emits: ['intersect'],
  setup(props) {
    return () => {
      const t = props.term as any
      return h('div', { class: 'term-card' }, [
        // Term header
        h('div', { class: 'term-head' }, [
          h('span', { class: 'term-ref' }, `[${t.id}]`),
          h('span', { class: 'term-name' }, t.term),
          t.etymology && h('span', { class: 'term-etym' }, t.etymology),
        ]),
        // Short definition
        h('div', { class: 'term-short' }, t.short),
        // Full body
        h('div', { class: 'term-body' }, t.body),
        // Related terms
        t.related?.length && h('div', { class: 'term-related' },
          [h('span', { class: 'term-related-label' }, 'See also: '),
           ...t.related.map((id: number) => h('a', {
             class: 'term-related-link',
             href: `#term-${id}`,
             onClick: (e: Event) => { e.preventDefault(); document.getElementById(`term-${id}`)?.scrollIntoView({ behavior: 'smooth' }) }
           }, `[${id}]`))]
        ),
      ])
    }
  }
})
</script>

<style scoped>
/* ── Page layout ──────────────────────────────────────────────────── */

.gloss-page {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
  background: #000408;
  font-family: 'Courier New', monospace;
}

/* ── Sidebar ──────────────────────────────────────────────────────── */

.gloss-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid rgba(0, 100, 140, 0.22);
  background: rgba(0, 3, 12, 0.92);
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 140, 190, 0.18) transparent;
}

.gloss-sidebar-head {
  padding: 14px 12px 10px;
  font-size: 9px;
  letter-spacing: 0.16em;
  color: rgba(0, 200, 240, 0.75);
  border-bottom: 1px solid rgba(0, 80, 120, 0.25);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Search */
.gloss-search-wrap { padding: 8px 10px; border-bottom: 1px solid rgba(0, 60, 100, 0.20); }

.gloss-search {
  width: 100%;
  background: rgba(0, 10, 28, 0.80);
  border: 1px solid rgba(0, 100, 140, 0.28);
  border-radius: 3px;
  padding: 5px 8px;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(160, 210, 235, 0.85);
  outline: none;
  transition: border-color 0.12s;
}

.gloss-search:focus { border-color: rgba(0, 180, 220, 0.50); }
.gloss-search::placeholder { color: rgba(60, 100, 140, 0.50); }

/* Index */
.gloss-index { flex: 1; overflow-y: auto; padding: 4px 0; }

.gloss-cat-label {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 7px;
  letter-spacing: 0.14em;
  color: rgba(0, 160, 200, 0.55);
  cursor: pointer;
  user-select: none;
  transition: color 0.1s;
}
.gloss-cat-label:hover { color: rgba(0, 200, 240, 0.80); }

.gloss-cat-arrow { font-size: 8px; width: 10px; flex-shrink: 0; }
.gloss-cat-count {
  margin-left: auto;
  font-size: 7px;
  color: rgba(50, 90, 130, 0.55);
}

.gloss-cat-terms { padding: 2px 0 4px; }

.gloss-index-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px 3px 20px;
  font-size: 8px;
  color: rgba(100, 155, 185, 0.70);
  text-decoration: none;
  transition: all 0.10s;
  cursor: pointer;
}

.gloss-index-link:hover {
  color: rgba(0, 200, 240, 0.85);
  background: rgba(0, 40, 70, 0.25);
}

.gloss-index-link--active {
  color: #00e5ff;
  background: rgba(0, 60, 100, 0.22);
}

.gloss-ref {
  font-size: 7px;
  color: rgba(0, 140, 180, 0.45);
  flex-shrink: 0;
  min-width: 28px;
}

/* Footer */
.gloss-sidebar-foot {
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 60, 100, 0.20);
  flex-shrink: 0;
}
.gsf-count { font-size: 7px; color: rgba(60, 100, 140, 0.55); letter-spacing: 0.08em; }
.gsf-note  { font-size: 6.5px; color: rgba(40, 70, 100, 0.40); letter-spacing: 0.06em; }

/* ── Main content ─────────────────────────────────────────────────── */

.gloss-main {
  padding: 28px 32px 60px;
  max-width: 820px;
  overflow-y: auto;
}

.gloss-header { margin-bottom: 28px; }

.gloss-home-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.14s, text-shadow 0.14s;
}
.gloss-home-link:hover {
  color: #4dd0e1;
  text-shadow: 0 0 8px rgba(77, 208, 225, 0.4);
}

.gloss-title {
  font-size: 18px;
  letter-spacing: 0.12em;
  color: rgba(200, 230, 255, 0.90);
  font-weight: 400;
  margin: 0 0 10px;
}

.gloss-intro {
  font-size: 9px;
  color: rgba(100, 150, 180, 0.70);
  line-height: 1.70;
  max-width: 560px;
  margin: 0;
}

.gloss-intro code {
  background: rgba(0, 40, 70, 0.50);
  border: 1px solid rgba(0, 120, 180, 0.25);
  border-radius: 2px;
  padding: 1px 5px;
  font-size: 8px;
  color: rgba(0, 200, 240, 0.80);
}

/* Section headings */
.gloss-section { margin-bottom: 32px; }

.gloss-section-label {
  font-size: 7px;
  letter-spacing: 0.20em;
  color: rgba(0, 150, 190, 0.50);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0, 80, 120, 0.20);
}

/* Empty / error state */
.gloss-empty {
  font-size: 9px;
  color: rgba(80, 120, 155, 0.55);
  padding: 24px 0;
  letter-spacing: 0.06em;
}

/* ── Term card ────────────────────────────────────────────────────── */

:deep(.term-card) {
  background: rgba(0, 4, 14, 0.75);
  border: 1px solid rgba(0, 70, 110, 0.28);
  border-left: 3px solid rgba(0, 140, 190, 0.45);
  border-radius: 4px;
  padding: 12px 14px;
  margin-bottom: 8px;
  scroll-margin-top: 16px;
  transition: border-left-color 0.15s;
}

:deep(.term-card:hover) {
  border-left-color: rgba(0, 200, 240, 0.65);
  background: rgba(0, 8, 22, 0.85);
}

:deep(.term-head) {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

:deep(.term-ref) {
  font-size: 7.5px;
  color: rgba(0, 160, 200, 0.50);
  letter-spacing: 0.06em;
  flex-shrink: 0;
  min-width: 28px;
}

:deep(.term-name) {
  font-size: 13px;
  letter-spacing: 0.05em;
  color: rgba(190, 225, 245, 0.92);
  font-weight: 600;
}

:deep(.term-etym) {
  font-size: 7.5px;
  color: rgba(140, 100, 200, 0.65);
  font-style: italic;
  letter-spacing: 0.04em;
}

:deep(.term-short) {
  font-size: 9px;
  color: rgba(0, 190, 230, 0.72);
  letter-spacing: 0.03em;
  margin-bottom: 6px;
  line-height: 1.5;
}

:deep(.term-body) {
  font-size: 8.5px;
  color: rgba(120, 170, 200, 0.72);
  line-height: 1.68;
  margin-bottom: 6px;
}

:deep(.term-related) {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px solid rgba(0, 50, 90, 0.20);
}

:deep(.term-related-label) {
  font-size: 7px;
  color: rgba(60, 100, 140, 0.55);
  letter-spacing: 0.06em;
}

:deep(.term-related-link) {
  font-size: 7.5px;
  color: rgba(0, 160, 200, 0.60);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.1s;
}

:deep(.term-related-link:hover) { color: #00e5ff; }
</style>
