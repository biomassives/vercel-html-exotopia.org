<template>
  <q-page class="dp-page">

    <div class="dp-topbar">
      <router-link to="/" class="dp-home-link">
        <span class="dp-home-exo">EXO</span><span class="dp-home-topia">TOPIA</span>
        <span class="dp-home-arrow">↗</span>
      </router-link>

      <div class="dp-topbar-title">Documentation</div>

      <div class="dp-search-wrap" ref="searchWrap">
        <q-input
          v-model="query"
          dense dark outlined
          placeholder="Search docs…"
          color="cyan"
          input-class="dp-search-input"
          class="dp-search-field"
          @update:model-value="onQuery"
          @focus="searchFocused = true"
          @blur="onBlur"
          @keydown.down.prevent="hintIdx = Math.min(hintIdx + 1, hints.length - 1)"
          @keydown.up.prevent="hintIdx = Math.max(hintIdx - 1, 0)"
          @keydown.enter="selectHint(hints[hintIdx])"
          @keydown.escape="closeSearch"
        >
          <template #prepend><q-icon name="search" size="14px" color="blue-grey-6"/></template>
          <template #append v-if="query">
            <q-icon name="close" size="13px" color="blue-grey-6" class="cursor-pointer" @click="clearSearch"/>
          </template>
        </q-input>

        <div v-if="hints.length && searchFocused" class="dp-hints">
          <div
            v-for="(h, i) in hints" :key="h.id"
            class="dp-hint" :class="{ 'dp-hint--active': i === hintIdx }"
            @mousedown.prevent="selectHint(h)"
          >
            <span class="dp-hint__cat">{{ h.section }}</span>
            <span class="dp-hint__title">{{ h.title }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="dp-layout">

      <nav class="dp-nav">
        <div v-for="section in NAV" :key="section.id" class="dp-nav-section">
          <div class="dp-nav-section-head" @click="toggleNav(section.id)">
            <span>{{ section.icon }} {{ section.label }}</span>
            <q-icon :name="openNav.has(section.id) ? 'expand_less' : 'expand_more'" size="12px" color="blue-grey-6"/>
          </div>
          <div v-if="openNav.has(section.id)" class="dp-nav-items">
            <a
              v-for="item in section.items" :key="item.id"
              class="dp-nav-item"
              :class="{ 'dp-nav-item--active': activeSection === item.id }"
              @click.prevent="scrollTo(item.id)"
            >{{ item.label }}</a>
          </div>
        </div>
      </nav>

      <main class="dp-content" ref="contentEl">

        <section :id="'getting-started'" class="dp-section">
          <h1 class="dp-h1">Getting Started</h1>
          <p class="dp-p">Exotopia is an open, browser-based platform for virtual settlement on confirmed exoplanets and real-world eco-ops field work. Settlements are local-first: claiming and personalizing one is a free, device-resident record — no wallet, blockchain, or account required. An optional NFT deed and creative-economy layer are available through pon.ink / Worldbridger One for anyone who wants to monetize their work, but neither is required to create, own, or use a settlement.</p>

          <div :id="'what-is'" class="dp-sub">
            <h2 class="dp-h2">What is Exotopia?</h2>
            <p class="dp-p">Exotopia connects three things:</p>
            <ul class="dp-ul">
              <li><strong>NASA Exoplanet Archive data</strong> — 6,158 confirmed planets rendered in a navigable 3D cosmic web</li>
              <li><strong>Local-first settlement addresses</strong> — an Exolocation address (<code class="dp-code">exotopia:{scope}:{path}</code>) anchors a settlement to a specific coordinate on an exoplanet, stored on the owner's own device with no wallet or blockchain required (optional IPFS pinning for durability)</li>
              <li><strong>SCD Hub eco-ops network</strong> — real-world water quality, farm mapping, and community field work, recorded as tamper-evident Supabase + IPFS check-ins</li>
            </ul>
          </div>

          <div :id="'new-user'" class="dp-sub">
            <h2 class="dp-h2">Run your own instance — three steps, no blockchain</h2>
            <p class="dp-p">Exotopia is a client-side SPA with an optional Supabase backend. Standing up your own copy — on a home network or as a public deployment — takes three services, none of them locked to a vendor:</p>
            <ol class="dp-ol">
              <li><strong>Supabase</strong> — create a free project, then run the migrations already in <code class="dp-code">supabase/migrations/</code> against it to get the schema (rewards, citizen-science, community nodes, and more).</li>
              <li><strong>Git</strong> — fork or clone the repo to whichever host you prefer: <strong>GitLab</strong>, <strong>Gitea</strong>, or <strong>GitHub</strong> all work, nothing here depends on GitHub specifically.</li>
              <li><strong>Vercel</strong> — connect the repo, set <code class="dp-code">VITE_SUPABASE_URL</code> and <code class="dp-code">VITE_SUPABASE_ANON</code> from your Supabase project's API settings (see <code class="dp-code">.env.example</code>), and deploy. Build config lives in <code class="dp-code">vercel.json</code> — nothing to configure by hand.</li>
            </ol>
            <p class="dp-p">For local development instead of a deploy, the whole app runs with no environment variables at all:</p>
            <div class="dp-code-block">npm install
npx quasar dev          # dev server at http://localhost:9000
npx quasar build        # production build to dist/spa/</div>
            <p class="dp-p">Once it's running, browse the <router-link to="/galaxy" class="dp-link">galaxy view</router-link>, find a planet, click it, and claim 40 acres.</p>
          </div>

          <div :id="'refinements'" class="dp-sub">
            <h2 class="dp-h2">Refinements — scaling past the baseline stack</h2>
            <p class="dp-p">The three-step baseline above is enough to run a full instance. These are optional layers for scaling it up, hardening it, or dropping the SaaS dependencies entirely for a fully autonomous stand-up:</p>
            <ul class="dp-ul">
              <li><strong>Cloudflare</strong> — CDN/edge caching, DNS, and additional security headers in front of the deploy. <code class="dp-code">vercel.json</code> already ships a baseline CSP and cache-control policy; Cloudflare sits in front of that, it doesn't replace it.</li>
              <li><strong>Redis</strong> — caching, rate limiting, and queues for an instance that's outgrown the default Supabase-only setup, e.g. a node serving a large federated citizen-science community.</li>
              <li><strong>Appwrite (standalone)</strong> — a self-contained alternative to the Supabase + Vercel pairing, for a fully offline-capable home-network deployment with no external SaaS dependency at all.</li>
            </ul>
            <p class="dp-p">The pitch behind all of this — running an independent instance that still shares data and collaborative improvements back to the wider visualization / citizen-science / humanitarian-engineering / biodiversity work — is written up in <code class="dp-code">SPEC_SELF_HOSTED_NETWORK.md</code> and the accompanying blog post.</p>
          </div>

          <div :id="'free-platform'" class="dp-sub">
            <h2 class="dp-h2">Platform model — how value actually flows</h2>
            <p class="dp-p">Claiming, personalizing, and using a settlement is free, local-first, and carries no split of anything — there is no fee on that path, so there's nothing to divide. A separate, optional allocation called the <strong>Resonance Split</strong> exists for the one place real money can flow through the ecosystem today: pon.ink's creative-economy layer ($SUNLIGHT recordings, generative compositions). It only ever applies where a transaction actually carries a fee — never as an ongoing revenue share, a yield, or a claim on future platform income.</p>
            <table class="dp-table">
              <thead><tr><th>Path</th><th>Split (creator / community fund / platform)</th><th>When it applies</th></tr></thead>
              <tbody>
                <tr><td>Settlement creation</td><td>{{ primaryMintIsFree ? 'No split — free, no fee to divide' : 'No split defined' }}</td><td>Always, on the core (non-pon.ink) path</td></tr>
                <tr><td>Exoloc deed, if minted via pon.ink</td><td>{{ settlementSplitDisplay }}</td><td>Only if the owner opts into an on-chain deed</td></tr>
                <tr><td>$SUNLIGHT / generative works</td><td>{{ standardSplitDisplay }}</td><td>Only on a fee-carrying pon.ink sale</td></tr>
              </tbody>
            </table>
            <p class="dp-p">These numbers are pulled live from <code class="dp-code">src/lib/resonance-split.ts</code>, this codebase's single source of truth for the split — that file's own header rule is "do not inline percentages anywhere, including in copy," so this page computes them rather than restating them by hand. Special mintings and airdrop events on pon.ink may use different parameters via additional contracts; any custom split there requires Group Manager + Admin co-sign and is logged in the <code class="dp-code">payment_splits_ledger</code>, not on a blockchain.</p>
            <div class="dp-callout">
              <strong>Fee isolation rule:</strong> Gas costs are always displayed separately and never combined with creator payouts. The resonance split is computed independently of gas, and is never shown next to a free path as if it implies a revenue stream that doesn't exist there.
            </div>

            <div class="dp-qa">
              <div class="dp-qa-item">
                <p class="dp-qa-q">Do I have to pay anything to claim or keep a settlement?</p>
                <p class="dp-qa-a">No. The core settlement path — claiming a location, personalizing it, running eco-ops check-ins, earning points — is free and local-first: no wallet, no blockchain, no account, no gas fee. The Resonance Split above never applies to it.</p>
              </div>
              <div class="dp-qa-item">
                <p class="dp-qa-q">So when would the split ever actually apply to me?</p>
                <p class="dp-qa-a">Only if you choose to use pon.ink's optional layer — minting a tradeable Exoloc deed, or selling a $SUNLIGHT recording or generative composition. If you never touch pon.ink, you'll never see a split figure that means anything for you.</p>
              </div>
              <div class="dp-qa-item">
                <p class="dp-qa-q">Can the platform quietly take a bigger cut later?</p>
                <p class="dp-qa-a">Not without it showing up here first. The numbers on this page are computed from the same file (<code class="dp-code">resonance-split.ts</code>) every payment path in the app reads from — there's no separate, hidden figure used elsewhere. A custom split for a special event still requires two-person (Group Manager + Admin) co-sign and a ledger entry, not a unilateral change.</p>
              </div>
              <div class="dp-qa-item">
                <p class="dp-qa-q">Why does the settlement deed split (100/0/0-equivalent) differ from the creative-work split?</p>
                <p class="dp-qa-a">They're deliberately separate constants in the code, not two views of the same number — collapsing them would risk silently changing what a settlement deed transaction actually pays out. A settlement deed is meant to cost its owner nothing beyond network gas; a creative-work sale is meant to overwhelmingly favor the creator while still funding shared field infrastructure.</p>
              </div>
            </div>

            <h3 class="dp-h3">Validated against our guiding principles</h3>
            <p class="dp-p">This model is checked against the same five principles that govern the rest of Exotopia (<code class="dp-code">SPEC.md</code> §0) — not as marketing copy, but as a pathway anyone can re-verify against the actual code.</p>
            <div class="dp-principles">
              <div class="dp-principle">
                <p class="dp-principle-name">Real data, real stakes</p>
                <p class="dp-principle-body">The split only ever governs real value changing hands on pon.ink. It has no effect on the astronomical data pipeline or eco-ops records, which stay real and unmonetized either way.</p>
              </div>
              <div class="dp-principle">
                <p class="dp-principle-name">Reward the doers</p>
                <p class="dp-principle-body">The default, guaranteed reward path is the free points-and-certificate ledger (<code class="dp-code">SPEC.md</code> §21) — it doesn't require touching pon.ink at all. When a fee-carrying sale does happen, the split sends the overwhelming majority to the creator, not the platform.</p>
              </div>
              <div class="dp-principle">
                <p class="dp-principle-name">Accessible first</p>
                <p class="dp-principle-body">Primary settlement creation has no split to understand, no wallet to fund, and no gas to budget for — it works the same on a mid-range Android handset on 3G as it does anywhere else.</p>
              </div>
              <div class="dp-principle">
                <p class="dp-principle-name">Open by default</p>
                <p class="dp-principle-body">The split math lives in one open-source file with a stated no-inlining rule, so this page (and every other surface that shows it) is provably reading the same number — not a black box, and not something that can drift out of sync without the source changing first.</p>
              </div>
              <div class="dp-principle">
                <p class="dp-principle-name">Culture is the vehicle</p>
                <p class="dp-principle-body">The one place the split actually applies today is creative work — recordings and generative compositions — with a mandatory slice routed to the Community Hardware Fund rather than platform margin.</p>
              </div>
            </div>
          </div>
        </section>

        <section :id="'visualization'" class="dp-section">
          <h1 class="dp-h1">The Visualization</h1>

          <div :id="'cosmic-view'" class="dp-sub">
            <h2 class="dp-h2">Cosmic Web view</h2>
            <p class="dp-p">The highest scale view shows the universe at supercluster level. The iridescent polygonal structures are <strong>great cosmic voids</strong> — regions of near-empty space between galaxy filaments. These are not artistic choices: the Boötes Void, Local Void, KBC Void (which contains our Milky Way), and Sculptor Void are all real large-scale structures rendered as low-poly icosahedral boundaries.</p>
            <p class="dp-p">The warm amber filaments around the void edges represent the Laniakea Supercluster — the ~160 Mpc structure containing the Milky Way, Virgo Cluster, and Great Attractor. Flow lines show galaxy velocity streams converging toward the Great Attractor (RA 243°, Dec −29°, 65 Mpc).</p>
          </div>

          <div :id="'galaxy-clusters'" class="dp-sub">
            <h2 class="dp-h2">Galaxy clusters → stars LOD system</h2>
            <p class="dp-p">As you approach a galaxy cluster, a multi-level resolution system activates:</p>
            <ul class="dp-ul">
              <li><strong>LOD 0 (far):</strong> Single point sprite — colour-coded by X-ray temperature</li>
              <li><strong>LOD 2 (approach):</strong> Individual galaxy morphology sprites — cD ellipticals, spirals, lenticulars, irregulars. Morphology-density relation applied (cluster cores are elliptical-dominated)</li>
              <li><strong>LOD 3 (inside):</strong> Full galaxy structure textures — logarithmic spiral arms, dust lanes, HII region knots</li>
            </ul>
            <p class="dp-p">Clicking a galaxy sprite inside a cluster opens an info panel showing Hubble type, luminosity, notes, and cluster membership.</p>
          </div>

          <div :id="'system-view'" class="dp-sub">
            <h2 class="dp-h2">Star system view — multiplanet & multimoon</h2>
            <p class="dp-p">Clicking a star in galaxy view enters the system. Planets orbit the star with deterministic inclinations (±11°, seeded from hostname) to break the flat merry-go-round appearance. Clicking a planet activates the <strong>L4 companion camera</strong>: a two-phase braking approach (power4.in → power4.out) settles the camera into a co-orbital trailing position. The camera then follows the planet around the star each animation frame.</p>
            <p class="dp-p">Moon systems are shown as inclined rings at each planet. The system view also shows Lagrange point markers (L4/L5) for planets with exomoon settlement potential.</p>
          </div>

          <div :id="'settlement-surfaces'" class="dp-sub">
            <h2 class="dp-h2">Settlement surface view</h2>
            <p class="dp-p">The surface view shows the exoplanet from ground level. The dome settlement contains a stone circle (8 standing stones, deterministic from hostname seed, triple Archimedean spiral pattern), the mule-bot, soul orbs representing community zones, and a sky showing the real stellar neighbourhood in that direction.</p>
            <p class="dp-p">X-RAY mode applies a thermal palette (sepia + hue-rotate) simulating radiometric imaging. DK.MAT (dark matter) mode reveals the E8 pyramid — the wormhole conduit entry point for long-distance transit.</p>
          </div>

          <div :id="'nav-wayfinding'" class="dp-sub">
            <h2 class="dp-h2">Navigation &amp; wayfinding</h2>
            <p class="dp-p">The top bar auto-hides to keep every view immersive. On settlement routes (surface, dome interior, cluster surface) it collapses to a slim breadcrumb strip showing the chain back to orbit — e.g. <code class="dp-code">Milky Way › Kepler-442 › Kepler-442b</code> for catalog worlds, or <code class="dp-code">Hydra Cluster › NGC3309 · System-3</code> for generated cluster systems. Hover the strip to pause auto-hide; <code class="dp-code">≡</code> reopens the full bar, <code class="dp-code">✕</code> drops to a 3-icon bar (home · search · menu) so the star field is unobstructed.</p>
            <p class="dp-p">The Cosmic Web view adds a <strong>quick-transit strip</strong> along the bottom edge — your saved settlements, followed by recently visited star systems and surfaces, each one click away. Visits are recorded automatically and kept locally (most recent 12, de-duplicated by route).</p>
          </div>

          <div :id="'lod-reveal'" class="dp-sub">
            <h2 class="dp-h2">Granular zoom &amp; data reveal (LOD)</h2>
            <p class="dp-p">Inside a galaxy cluster (<code class="dp-code">/#/cluster-interior/{slug}</code>), clicking a member galaxy flies the camera to a fixed close orbit and tags the view with a zoom badge:</p>
            <table class="dp-table">
              <thead><tr><th>Badge</th><th>Camera distance</th><th>Shows</th></tr></thead>
              <tbody>
                <tr><td>◎ OVERVIEW</td><td>&gt; 6.0 su</td><td>Full cluster member field</td></tr>
                <tr><td>◈ GALAXY VIEW</td><td>1.8 – 6.0 su</td><td>Selected galaxy's detail panel</td></tr>
                <tr><td>⬡ SYSTEMS VIEW</td><td>&lt; 1.8 su</td><td>Deterministic star-system point cloud (up to 35 systems, spectral-class colours)</td></tr>
              </tbody>
            </table>
            <p class="dp-p">The <strong>Zoom In — Reveal Systems</strong> button drives the camera the rest of the way in; the system count is shown live. The cloud is generated deterministically from the galaxy's ID, so the same galaxy always reveals the same systems on every visit.</p>
            <div class="dp-callout dp-callout--info">
              When a revealed galaxy has no real star-system catalog entry yet, the browser console logs a line starting with <code class="dp-code">[LOD] DATA REQUEST</code> naming the missing dataset. This is the same signal used by the Citizen Data Verification science-outreach sessions — see <a class="dp-link" href="#" @click.prevent="scrollTo('science-outreach')">Science &amp; Education Outreach</a>.
            </div>
          </div>
        </section>

        <section :id="'events-section'" class="dp-section">
          <h1 class="dp-h1">Events &amp; Outreach</h1>
          <p class="dp-p">The Cosmic Web view also works as a live events calendar. Selected galaxy clusters carry a <strong>CosmicEvent</strong> entry — a pulsing beacon ring at the cluster's sprite, colour-coded by event type. Clicking the cluster opens an event panel with description, countdown, capacity, and pon.ink action links.</p>

          <div :id="'event-types'" class="dp-sub">
            <h2 class="dp-h2">Event types &amp; beacons</h2>
            <table class="dp-table">
              <thead><tr><th>Type</th><th>Beacon colour</th><th>Used for</th></tr></thead>
              <tbody>
                <tr><td>LIVE EVENT</td><td><code class="dp-code">#ff6644</code></td><td>Hybrid physical + virtual streamed event</td></tr>
                <tr><td>WORKSHOP</td><td><code class="dp-code">#44ccaa</code></td><td>Educational / vocational session</td></tr>
                <tr><td>GALLERY</td><td><code class="dp-code">#cc88ff</code></td><td>Permanent visual-art exhibition node</td></tr>
                <tr><td>SOUND SESSION</td><td><code class="dp-code">#ffcc44</code></td><td>DJ / production session via pon.ink</td></tr>
                <tr><td>SETTLEMENT</td><td><code class="dp-code">#ffd480</code></td><td>Permanent virtual property marker</td></tr>
                <tr><td>SCIENCE OUTREACH</td><td><code class="dp-code">#5599ff</code></td><td>International education / research collaboration session</td></tr>
              </tbody>
            </table>
            <p class="dp-p">Each entry in the registry (<code class="dp-code">src/data/events.ts</code>) is keyed to an X-ray cluster name — e.g. <code class="dp-code">J004156.8+253151</code> — so it renders at exactly the right point on the cosmic map. Timed events show a live countdown; <code class="dp-code">settlement</code> and <code class="dp-code">gallery</code> entries with <code class="dp-code">eventTimeUtc: null</code> are permanent and always lit.</p>
          </div>

          <div :id="'science-outreach'" class="dp-sub">
            <h2 class="dp-h2">Science &amp; education outreach</h2>
            <p class="dp-p">The <code class="dp-code">science-outreach</code> event type connects the cosmic map to international classrooms, astronomy clubs, and citizen-science volunteers — using the same generated-plus-real-catalog data the platform runs on as shared teaching and verification material.</p>
            <ul class="dp-ul">
              <li><strong>Open Cosmic Web Session — Galaxy Cluster Tour</strong> · International Astronomy Education Network · a guided live tour of the great voids, Laniakea flow lines, and a galaxy-cluster zoom-in showing the LOD reveal from cluster sprite down to individual member galaxies and their generated star systems. Recorded for asynchronous use across time zones.</li>
              <li><strong>Citizen Data Verification Sprint — Cluster Member Catalog Review</strong> · Citizen Science Network · volunteers use the Cluster Interior zoom-in reveal to compare procedurally generated galaxy members against real RC3 / VCC / FCC catalog entries. Galaxies flagged via the in-app <code class="dp-code">[LOD] DATA REQUEST</code> console note are queued for the next data-pipeline enrichment pass. Open to students, amateur astronomers, and research partners — a participation badge is issued via pon.ink.</li>
            </ul>
            <div class="dp-callout dp-callout--info">
              This is the first event category built around <em>data interfacing</em> rather than performance or property — every console-logged data gap is a worked example for the next enrichment pass, and every classroom session is a chance to crowdsource verification of the underlying catalogs.
            </div>
          </div>

          <div :id="'edu-lessons'" class="dp-sub">
            <h2 class="dp-h2">Educational lessons — sky generation</h2>
            <p class="dp-p">Two structured lessons covering how Exotopia computes a unique, physically accurate sky for every settlement — from the coordinate math and parallax pipeline to black hole safe orbital radii and collaborative constellation naming.</p>
            <table class="dp-table">
              <thead><tr><th>Lesson</th><th>Audience</th><th>Topics</th></tr></thead>
              <tbody>
                <tr>
                  <td><strong>Reading the Sky from Another World</strong></td>
                  <td>Grades 8–11</td>
                  <td>Parallax concept, star addresses (RA/Dec/distance), why constellations change, Kepler-442b and K2-90b examples, classroom activity</td>
                </tr>
                <tr>
                  <td><strong>Mathematics of Synthetic Skies</strong></td>
                  <td>Grade 12 – Graduate</td>
                  <td>raDecToVec3 derivation, parallax vector pipeline, starColorFromTeff / Planck SED, angular size formulas, Hill sphere, Roche limit, Schwarzschild / ISCO for M87*, runnable JS code examples</td>
                </tr>
              </tbody>
            </table>
            <router-link to="/sky-lessons" class="dp-link dp-link--btn">Open sky lessons →</router-link>
            <router-link to="/void-math" class="dp-link dp-link--btn" style="margin-left:8px">Void &amp; conduit math →</router-link>
            <router-link to="/blog" class="dp-link dp-link--btn" style="margin-left:8px">Working notes &amp; blog →</router-link>
          </div>

          <div :id="'contract-workshop-lesson'" class="dp-sub">
            <h2 class="dp-h2">Educational workshop — creative contracts &amp; chemistry</h2>
            <p class="dp-p">A two-part teaching demo: a plain-language, hand-writable example of a creative-reference agreement (media &amp; rights literacy, referencing the File Cabinet's Creative Assets drawer), paired with an interactive chemistry-and-number-theory lesson on converting a mass of butane gas into a molecule count via moles and Avogadro's number.</p>
            <table class="dp-table">
              <thead><tr><th>Part</th><th>Audience</th><th>Topics</th></tr></thead>
              <tbody>
                <tr>
                  <td><strong>Writing a Plain-Language Creative Reference</strong></td>
                  <td>Media &amp; rights literacy</td>
                  <td>What a creative-reference note should cover, a worked example document, the File Cabinet's <code class="dp-code">creativeAssetsDrawer</code> connection, spot-the-gaps activity</td>
                </tr>
                <tr>
                  <td><strong>How Many Molecules Are in a Lighter?</strong></td>
                  <td>Grades 9–12</td>
                  <td>Molar mass, Avogadro's number, mass→moles→molecule count, scientific notation, the short-scale naming ladder, a live interactive calculator</td>
                </tr>
              </tbody>
            </table>
            <div class="dp-callout dp-callout--info">
              This is a low-risk, purely illustrative teaching demo — no real contract is formed, no real item changes hands, and it is independent of the platform's real points/certificate reward system (<code class="dp-code">SPEC.md</code> §21).
            </div>
            <router-link to="/contract-workshop" class="dp-link dp-link--btn">Open the workshop →</router-link>
          </div>
        </section>

        <section :id="'protocol'" class="dp-section">
          <h1 class="dp-h1">Protocol &amp; Token Economy</h1>

          <div :id="'exolocation'" class="dp-sub">
            <h2 class="dp-h2">Exolocation address system</h2>
            <p class="dp-p">Every settlement has a permanent, local-first address — a device-resident record with no wallet, blockchain, or account required (optional IPFS pinning for durability):</p>
            <div class="dp-code-block">exotopia:surface:kepler-442/kepler-442b/aurora-basin</div>
            <p class="dp-p">Three components: <strong>scope</strong> (e.g. <code class="dp-code">surface</code>, matching the coordinate system below) · <strong>reference body</strong> (host star / body) · <strong>region</strong> (a named zone; lat/lon for surface, L4/L5 for Lagrange, altitude band for orbital — see <code class="dp-code">SPEC_EXOLOC_ADDRESS.md</code>). Owners who want a tradeable on-chain deed can optionally mint one through pon.ink; it is not required to create or use a settlement.</p>
            <table class="dp-table">
              <thead><tr><th>Trophic level</th><th>Name</th><th>Coordinate system</th></tr></thead>
              <tbody>
                <tr><td>L1</td><td>STELLAR</td><td>exo-stellar-orbital-v1</td></tr>
                <tr><td>L2</td><td>PLANETARY</td><td>exo-surface-v1 · exo-orbital-v1</td></tr>
                <tr><td>L3</td><td>LUNAR</td><td>exo-lunar-orbital-v1</td></tr>
                <tr><td>L4</td><td>SUBLUNARY</td><td>exo-moon-surface-v1</td></tr>
                <tr><td>L5</td><td>SYZYGY</td><td>exo-moon-lagrange-v1</td></tr>
                <tr><td>L6</td><td>LIMINAL</td><td>exo-moon-interface-v1</td></tr>
              </tbody>
            </table>
          </div>

          <div :id="'sunlight-nft'" class="dp-sub">
            <h2 class="dp-h2">$SUNLIGHT NFT</h2>
            <p class="dp-p">An optional pon.ink / Worldbridger One layer, not part of the core Exotopia settlement system — the sound and creative recording NFT standard on Polygon. $SUNLIGHT NFTs represent ownership of a recorded sound, track, or creative work — with on-chain licensing terms (personal use, commercial, sync, exclusive). Royalty enforcement is on-chain. Nothing here is required to create, own, or use a settlement; it's available for creators who choose to monetize field recordings or compositions through pon.ink.</p>
            <p class="dp-p">Metadata fields: title, artist, duration_sec, BPM, key, genre, IPFS audio CID, license, co-artists, sample credits.</p>
          </div>

          <div :id="'art-tokens'" class="dp-sub">
            <h2 class="dp-h2">Eco-ops Rewards (Points Ledger)</h2>
            <p class="dp-p">Eco-ops field activities feed a Supabase-backed points-and-certificate ledger (<code class="dp-code">SPEC.md</code> §21/§24) — not a blockchain token. Verified submissions post into the <code class="dp-code">volunteering</code> and <code class="dp-code">educating_others</code> reward tracks:</p>
            <ul class="dp-ul">
              <li>💧 Eco-ops check-in — water quality, farm map, or any of the eight field-survey types, synced from an offline record → <strong>+10 pts</strong> (<code class="dp-code">eco_submission</code>)</li>
              <li>🌱 Self-reported volunteer entry (e.g. a plastics-collection log) → <strong>+8 pts</strong> (<code class="dp-code">volunteer_self_report</code>)</li>
              <li>◈ PFAS/PFOA decontamination-project progress log entry → <strong>+6 pts</strong> (<code class="dp-code">decon_progress_log</code>)</li>
            </ul>
            <p class="dp-p">Points are a non-tradable record of contribution — Exotopia does not operate a secondary market or exchange for them, and they carry no cash value or expectation of return. Sustained volunteering points unlock a Field Volunteer settlement object. A separate token, <strong>ART</strong>, exists specifically for the Security Bulletin's verification chain — see <a class="dp-link" href="#" @click.prevent="scrollTo('cve-bulletin')">Security Bulletin</a>.</p>
          </div>

          <div :id="'robot-mule'" class="dp-sub">
            <h2 class="dp-h2">mule-bot</h2>
            <p class="dp-p">The Mule is a local-network AI knowledge assistant attached to each settlement. It is <strong>not connected to any LLM or cloud service</strong> — it runs on the settlement owner's hardware and its corpus stays sovereign.</p>
            <p class="dp-p">Five specialist domains: educational advocacy materials · business planning metrics · community water system health · youth career development in environmental engineering · Hub Approvideo library maintenance.</p>
          </div>
        </section>

        <section :id="'glossary-section'" class="dp-section">
          <h1 class="dp-h1">Glossary</h1>
          <p class="dp-p">47 canonical terms. In body text, superscript numbers link to these entries: <code class="dp-code">sublunary¹⁰</code> → entry [10].</p>
          <router-link to="/glossary" class="dp-link dp-link--btn">Open full glossary →</router-link>

          <div class="dp-gloss-grid q-mt-md">
            <div v-for="t in KEY_TERMS" :key="t.id" class="dp-gloss-item">
              <div class="dp-gloss-num">[{{ t.id }}]</div>
              <div class="dp-gloss-term">{{ t.term }}</div>
              <div class="dp-gloss-short">{{ t.short }}</div>
            </div>
          </div>
        </section>

        <section :id="'data-section'" class="dp-section">
          <h1 class="dp-h1">Data Sources</h1>
          <router-link to="/data-coverage" class="dp-link dp-link--btn">Full data coverage page →</router-link>

          <div :id="'catalogs'" class="dp-sub">
            <h2 class="dp-h2">Input catalog sources</h2>
            <table class="dp-table">
              <thead><tr><th>Source</th><th>Records</th><th>Used for</th></tr></thead>
              <tbody>
                <tr v-for="c in CATALOG_ROWS" :key="c.name">
                  <td>{{ c.name }}</td><td>{{ c.count }}</td><td>{{ c.use }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div :id="'generated-inventory'" class="dp-sub">
            <h2 class="dp-h2">Generated data inventory</h2>
            <p class="dp-p">The pipeline converts real catalog data into fully navigable content. Every galaxy cluster has a complete set of playable star systems — including clusters where real member positions are not in the literature.</p>
            <table class="dp-table">
              <thead><tr><th>Dataset</th><th>Volume</th><th>Location</th><th>Used for</th></tr></thead>
              <tbody>
                <tr v-for="r in GENERATED_ROWS" :key="r.name">
                  <td>{{ r.name }}</td><td>{{ r.vol }}</td><td><code class="dp-code">{{ r.path }}</code></td><td>{{ r.use }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div :id="'data-gaps'" class="dp-sub">
            <h2 class="dp-h2">Known gaps &amp; mitigations</h2>
            <ul class="dp-ul">
              <li><strong>2.1% of confirmed planets have no measured distance</strong> — deterministic estimated positions used (consistent but may be misplaced by hundreds of parsecs)</li>
              <li><strong>Southern hemisphere cluster coverage thinner</strong> — galactic dust obscures the Norma/Great Attractor region; X-ray data fills some gaps</li>
              <li><strong>Member positions only real for Virgo (VCC) and Fornax (FCC)</strong> — other clusters use procedural King-profile layouts seeded from real richness + X-ray temperature; visual spread is artistic not astrometric</li>
              <li><strong>Moon data is sparse</strong> — individual moon properties approximated from system-level moon count and host planet mass; orbits are Titius-Bode derived</li>
              <li><strong>In-app data-gap signal</strong> — Cluster Interior's granular zoom (LOD) prints <code class="dp-code">[LOD] DATA REQUEST</code> to the browser console, naming any galaxy that lacks a real star-system catalog entry. These are the same targets reviewed in Citizen Data Verification science-outreach sessions — see <a class="dp-link" href="#" @click.prevent="scrollTo('science-outreach')">Events &amp; Outreach</a></li>
            </ul>
          </div>
        </section>

        <section :id="'api-section'" class="dp-section">
          <h1 class="dp-h1">API &amp; Data Surface</h1>
          <p class="dp-p">Everything above this section documents individual pieces of the data surface
            (catalogs, glossary, protocol). This page is a full, explorable map of the whole thing as one
            system — every Supabase table grouped by domain with an honest RLS note, the static JSON data
            files, the exolocation address grammar, and the pure-function settlement SDK — with anything
            not yet built clearly labelled as such rather than presented as live.</p>
          <router-link to="/api-surface" class="dp-link dp-link--btn">Open the API &amp; Data Surface map →</router-link>
          <p class="dp-p" style="margin-top:10px">See also <code class="dp-code">SPEC_API_PRODUCT.md</code> for the
            refined data-model and distribution/federation plan built on top of this inventory.</p>
        </section>

        <section :id="'pipeline-section'" class="dp-section">
          <h1 class="dp-h1">Data Pipeline &amp; Generation Tools</h1>
          <p class="dp-p">All navigable content in Exotopia is produced by a deterministic Python pipeline in <code class="dp-code">datagathering/</code>. Outputs live under <code class="dp-code">public/</code> and are served as static JSON — no server-side computation at runtime.</p>

          <div :id="'pipeline-overview'" class="dp-sub">
            <h2 class="dp-h2">Three-stage pipeline</h2>
            <div class="dp-code-block">Stage 1 — INGEST &amp; ENRICH
  fetch_cluster_catalogs.py    VizieR / NED API → *-members.json
  generate_named_cluster_members.py  King-profile synthesis for named clusters
  generate_cluster_catalog.py  Literature-parameterised catalogs (σ_v, T_x, M200)
  enrich_with_rc3.py           RC3 → axis_ratio, pa_deg, lod3_params per galaxy

Stage 2 — ARCHITECTURE ASSIGNMENT
  enrich_with_architecture.py  Adds system_architecture block to every galaxy:
                                 metallicity [Fe/H], planet_bias, icm_stress,
                                 estimated_planets, gas_giant_prob, exomoon_factor
                               → generation_inventory.json (2,617 render queue)

Stage 3 — STAR SYSTEM &amp; PLANET GENERATION
  generate_cluster_starsystems.py  Titius-Bode orbits, spectral table lookup,
                                    mass–luminosity, planet type from planet_bias
  generate_galaxy_oracle.py        Cluster-level morphology seed (universe-221x)
                                    → galaxy-oracle/{cluster}-region.json</div>
            <p class="dp-p">The pipeline is fully re-runnable — every output is deterministic from its seed, so re-generating a cluster produces identical results. To add a new cluster: add its entry to <code class="dp-code">cosmic-structures.ts</code>, run stages 1–3, and the cluster becomes navigable immediately.</p>
          </div>

          <div :id="'pipeline-scripts'" class="dp-sub">
            <h2 class="dp-h2">Script reference</h2>
            <table class="dp-table">
              <thead><tr><th>Script</th><th>Input</th><th>Output</th><th>Notes</th></tr></thead>
              <tbody>
                <tr v-for="s in SCRIPT_ROWS" :key="s.name">
                  <td><code class="dp-code">{{ s.name }}</code></td>
                  <td>{{ s.input }}</td>
                  <td>{{ s.output }}</td>
                  <td>{{ s.notes }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div :id="'pipeline-nav-chain'" class="dp-sub">
            <h2 class="dp-h2">Navigation chain — data to screen</h2>
            <p class="dp-p">Each user navigation step loads exactly one JSON file:</p>
            <div class="dp-code-block">/#/cosmic
  renders CosmicPage using cosmic-structures.ts cluster positions
  on LOD approach → fetch /clusters/{slug}-members.json
  click galaxy member → navigate to:

/#/cluster-galaxy/{slug}/{galaxyId}
  fetch /star-systems/{slug}/{galaxyId}.json   ← generated pipeline output
  fallback: fetch /clusters/{slug}-members.json → procedural generation
  click a star → navigate to:

/#/cluster-surface/{slug}/{galaxyId}/{systemIdx}
  renders planet system from the loaded JSON's star_systems[idx]
  click a planet → surface view (SurfaceViewPage)
  click Claim → /#/mint?mode=cluster-world&amp;cluster=…&amp;galaxy=…&amp;system=…</div>
            <div class="dp-callout dp-callout--info">
              All 160 files under <code class="dp-code">public/star-systems/hydra/</code> are individually routable. A URL like <code class="dp-code">/#/cluster-galaxy/hydra/NGC3309</code> loads exactly <code class="dp-code">NGC3309.json</code>; <code class="dp-code">/#/cluster-galaxy/hydra/proc-0042</code> loads <code class="dp-code">proc-0042.json</code>. Procedural IDs are stable across sessions.
            </div>
          </div>

          <div :id="'planet-bias'" class="dp-sub">
            <h2 class="dp-h2">Planet bias profiles</h2>
            <p class="dp-p">Each galaxy is assigned one of five <strong>planet_bias</strong> profiles by <code class="dp-code">enrich_with_architecture.py</code> based on local stellar density, ICM stress, and metallicity. These govern what kinds of worlds the generator produces:</p>
            <table class="dp-table">
              <thead><tr><th>Bias profile</th><th>Typical worlds</th><th>Cluster environment</th></tr></thead>
              <tbody>
                <tr v-for="p in PLANET_BIAS_ROWS" :key="p.name">
                  <td><code class="dp-code">{{ p.name }}</code></td><td>{{ p.worlds }}</td><td>{{ p.env }}</td>
                </tr>
              </tbody>
            </table>
            <p class="dp-p">Surface temperature is computed from stellar luminosity, orbit radius, and albedo. Each planet's equilibrium temperature range (min/max °C) is stored in the JSON and displayed in the star system panel — giving every settlement a real climate context.</p>
          </div>

          <div :id="'observatory-context'" class="dp-sub">
            <h2 class="dp-h2">Observatory context &amp; provenance</h2>
            <p class="dp-p">Every generated star system carries an <code class="dp-code">observatory_context</code> block linking it to its real-universe data provenance:</p>
            <div class="dp-code-block">"observatory_context": {
  "anchor_telescope": "JWST|HST/ATLAS|Chandra",
  "cluster_id":       "Hydra Cluster — Abell 1060",
  "cluster_dist_mpc": 59.0,
  "estimated_metallicity_fe_h": 0.12,
  "local_stellar_density": "dense",
  "icm_stress": 0.34,
  "tx_kev": 3.2
}</div>
            <p class="dp-p">This block is stored with the NFT metadata when a world is claimed, anchoring the deed to the observational record that gave rise to it. <code class="dp-code">tx_kev</code> is the X-ray plasma temperature of the cluster gas — the same value that colours the cluster sprite in the cosmic view.</p>
          </div>
        </section>

        <section :id="'specs-section'" class="dp-section">
          <h1 class="dp-h1">Technical Specifications</h1>

          <div :id="'game-theory'" class="dp-sub">
            <h2 class="dp-h2">Game Theory — DRK-E &amp; QNT-P</h2>
            <p class="dp-p">Two optional engagement economies layer on top of settlement NFTs:</p>
            <ul class="dp-ul">
              <li><strong>Timular Blobs (DRK-E)</strong> — dark energy density fluctuations in cosmic voids. Dwell near them to accumulate dark energy score. At 10 DRK-E: L6 LIMINAL zones become mintable. At 100: hidden E8 lattice nodes revealed in DK.MAT mode.</li>
              <li><strong>Charged Positrons (QNT-P)</strong> — orbital particles at cluster boundaries. Click to capture. At 30 QNT-P: Frontier exoplanet claims unlocked. At 120: Wormhole branching density increased in portal animation.</li>
            </ul>
            <p class="dp-p">Neither DRK-E nor QNT-P are purchasable or deducted from creator payouts. They are exploration and engagement signals only.</p>
          </div>

          <div :id="'settlement-hashmark'" class="dp-sub">
            <h2 class="dp-h2">Settlement Hashmark</h2>
            <p class="dp-p">Each settlement produces a SHA-256 hashmark encoding all design parameters: dome type/radius/segments, stone circle heights and azimuths, ecosystem biome, item placement coordinates, and Mule corpus seed. The hash is displayed as an 8×8 ASCII quilt (64 nibbles → coloured block glyphs). Four XOR-parity rows extend it to 12×8 for error-correction verification.</p>
            <p class="dp-p">The hashmark JSON (stored with the NFT) is sufficient to reconstruct the complete settlement geometry from scratch — making it a verifiable design fingerprint.</p>
          </div>

          <div :id="'field-recording'" class="dp-sub">
            <h2 class="dp-h2">Field audio recording</h2>
            <p class="dp-p">The red record button (top-right, always visible) captures audio from the microphone using <code class="dp-code">MediaRecorder</code> + Web Audio API level analysis. Recordings are saved to IndexedDB <code class="dp-code">'exo_audio'</code> as WebM/Opus blobs — never uploaded to any server. Intended for: field voice notes, oral histories, community science observations, $SUNLIGHT NFT source material.</p>
          </div>

          <div :id="'coordinate-math'" class="dp-sub">
            <h2 class="dp-h2">Coordinate mathematics</h2>
            <p class="dp-p">Star system positions in all 3D scenes use equatorial Cartesian coordinates:</p>
            <div class="dp-code-block">x = dist_Mpc × cos(dec_rad) × cos(ra_rad)
y = dist_Mpc × sin(dec_rad)
z = −dist_Mpc × cos(dec_rad) × sin(ra_rad)

Scene units: 1 Mpc = 1/15 scene units (MPC_SCALE)</div>
            <p class="dp-p">Orbital animation uses auToViz(au) — a log-scale mapping of AU to scene-unit orbit radii. Planet focus uses L4-companion camera mathematics: trailing 55% along orbital tangent, elevated 40% along orbit normal, 12% outward radial.</p>
          </div>
        </section>

        <section :id="'security-section'" class="dp-section">
          <h1 class="dp-h1">Security</h1>
          <p class="dp-p">Exotopia tracks security vulnerabilities relevant to NFT creators and settlement operators — translating technical CVE disclosures into plain-language action items for the communities we serve — and is building that tracking out into a standalone tooling portal (below).</p>

          <div :id="'cve-bulletin'" class="dp-sub">
            <h2 class="dp-h2">Exotopia Security Bulletin</h2>
            <p class="dp-p">A community-curated feed of CVEs and smart contract disclosures filtered for relevance to NFT minting, settlement operation, and wallet security. Not a raw CVE mirror — each entry is reviewed, rated for NFT impact, and accompanied by plain-language action steps.</p>
            <p class="dp-p"><strong>Four-role verification chain — each role earns ART tokens:</strong></p>
            <ul class="dp-ul">
              <li><strong>Submitter</strong> — finds a relevant CVE, writes the initial draft — <em>5 ART</em></li>
              <li><strong>Verifier</strong> — second person confirms accuracy and affected versions — <em>3 ART</em></li>
              <li><strong>Curator</strong> — adds plain-language summary, action steps, Approvideo refs — <em>8 ART</em></li>
              <li><strong>Action-taker</strong> — settlement owner reads bulletin and marks it acted upon — <em>2 ART</em></li>
            </ul>
            <p class="dp-p">This chain is a live test of the ART disbursement mechanism — structurally identical to the eco-ops verification flow. Every disbursement is a batch transaction on Polygon, verifiable on-chain with all contributor addresses.</p>
            <div class="dp-callout dp-callout--info">
              Critical or High NFT-Impact bulletins may be minted as $SUNLIGHT NFTs by the Curator — recording them as permanent community knowledge artefacts. These are attribution records, not tradable assets; Exotopia does not operate a resale market for them.
            </div>
            <p class="dp-p"><strong>CVE sources we monitor:</strong> NVD, OpenZeppelin advisories, ethers.js releases, Ethereum Foundation blog, Trail of Bits, Immunefi (post-patch), Rekt News. Full source list and contribution process: <code class="dp-code">SPEC_SECURITY_BULLETIN.md</code></p>
          </div>

          <div :id="'cve-tooling'" class="dp-sub">
            <h2 class="dp-h2">CVE tracking prototype</h2>
            <p class="dp-p">A prototype library is already live and in motion at <router-link to="/cve_alerts" class="dp-link">/cve_alerts</router-link> ("CVEs · ALERTS RELAY") — the seed of Exotopia's own programming, desec &amp; opsec educational/professional web-tooling portal:</p>
            <ul class="dp-ul">
              <li>Pulls CISA's Known Exploited Vulnerabilities (KEV) feed directly — the same catalog federal agencies are required to remediate against</li>
              <li>Caches the catalog locally in IndexedDB so the table works offline between syncs and doesn't re-fetch the full feed on every visit</li>
              <li>Sorted and searchable by <strong>vendor/product</strong> — in effect, by device (e.g. "Cisco / IOS XE," "Microsoft / Windows") — alongside CVE ID and remediation due date, with a ransomware-campaign badge surfaced per entry</li>
            </ul>
            <div class="dp-callout dp-callout--info">
              This is an in-motion prototype, not a finished feature — the device/vendor grouping and the catalog sync both work today, but the surrounding portal (desec/opsec learning material tied to each entry) is still being built out.
            </div>
          </div>

          <div :id="'api-security'" class="dp-sub">
            <h2 class="dp-h2">API &amp; mule-bot Security</h2>
            <p class="dp-p">The mule-bot API runs locally (localhost:8888). Its auth scheme is account-based rather than wallet-signature-based — the exact mechanism is being finalized alongside the wider move off wallet-based identity (the previous wallet-signature scheme is preserved as a reference pattern in <code class="dp-code">archive/lib/SECURITY_MODEL_NOTES.md</code>). What's unchanged:</p>
            <ul class="dp-ul">
              <li><strong>Local-network native</strong> — the node never contacts an external cloud service; corpus data stays sovereign on the settlement owner's hardware</li>
              <li><strong>CORS</strong> — the node emits <code class="dp-code">Access-Control-Allow-Origin</code> for the app origin only; not wildcard in production → [49]</li>
              <li><strong>Rate limiting</strong> — eco-ops submissions capped at 10/hour per account to prevent corpus spam and queue flooding; HTTP 429 with <code class="dp-code">Retry-After</code> → [50]</li>
              <li><strong>Path encoding</strong> — exolocation addresses use percent-encoding (commas → %2C) to prevent path traversal; segments are validated against known coordinate-system prefixes → [48]</li>
            </ul>
            <p class="dp-p">Federation (Phase 3) will add per-node pubkey pinning and cross-settlement corpus queries with privacy-preserving aggregation — no raw corpus data crosses node boundaries.</p>
          </div>
        </section>

        <section :id="'contributing'" class="dp-section">
          <h1 class="dp-h1">Community &amp; Contributing</h1>
          <p class="dp-p">Exotopia is built for citizen scientists, community artists, education workers, field researchers, and eco-ops volunteers worldwide. The codebase is GPL v3.</p>
          <ul class="dp-ul">
            <li>Active communities: OT Kulcha, Fana Ka, Uni-Kibaoni-Peace-Youth-SHG</li>
            <li>Issues &amp; PRs: hosted with the SCD Hub ecosystem</li>
            <li>Field recordings, water quality data, and eco-ops check-ins all feed into the on-chain record and are valued equally to code contributions</li>
          </ul>
          <div class="dp-callout">
            Resilient Infrastructure · Exotopia · GPL v3 · SCD Hub non-profit
          </div>
        </section>

      </main>
    </div></q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter }     from 'vue-router'
import {
  STANDARD_SPLIT, SETTLEMENT_SPLIT, PRIMARY_MINT_IS_FREE, formatSplit,
} from 'src/lib/resonance-split'

const route  = useRoute()
const router = useRouter()

// Pulled live from resonance-split.ts, never inlined — see that file's own
// header rule ("do not inline percentages anywhere, including in copy").
const standardSplitDisplay   = formatSplit(STANDARD_SPLIT)
const settlementSplitDisplay = formatSplit(SETTLEMENT_SPLIT)
const primaryMintIsFree      = PRIMARY_MINT_IS_FREE

// ── Navigation structure ──────────────────────────────────────────────────────

const NAV = [
  { id: 'getting-started', icon: '🚀', label: 'Getting Started', items: [
    { id: 'getting-started', label: 'Overview'              },
    { id: 'what-is',         label: 'What is Exotopia?'     },
    { id: 'new-user',        label: 'Run Your Own Instance' },
    { id: 'refinements',     label: 'Refinements'           },
    { id: 'free-platform',   label: 'Platform Model'             },
  ]},
  { id: 'visualization', icon: '🌌', label: 'Visualization', items: [
    { id: 'visualization',       label: 'Overview'               },
    { id: 'cosmic-view',         label: 'Cosmic Web & Voids'     },
    { id: 'galaxy-clusters',     label: 'Galaxy Clusters & LOD'  },
    { id: 'system-view',         label: 'Star Systems'           },
    { id: 'settlement-surfaces', label: 'Settlement Surfaces'    },
    { id: 'nav-wayfinding',      label: 'Navigation & Wayfinding'},
    { id: 'lod-reveal',          label: 'Granular Zoom (LOD)'    },
  ]},
  { id: 'events-section', icon: '📡', label: 'Events & Outreach', items: [
    { id: 'events-section',   label: 'Overview'                       },
    { id: 'event-types',      label: 'Event Types & Beacons'          },
    { id: 'science-outreach', label: 'Science & Education Outreach'   },
    { id: 'edu-lessons',      label: 'Educational Lessons →'          },
    { id: 'contract-workshop-lesson', label: 'Contracts & Chemistry Workshop →' },
  ]},
  { id: 'protocol', icon: '⬡', label: 'Protocol & Economy', items: [
    { id: 'protocol',     label: 'Overview'              },
    { id: 'exolocation',  label: 'Exolocation Addresses' },
    { id: 'sunlight-nft', label: '$SUNLIGHT NFT'         },
    { id: 'art-tokens',   label: 'Eco-ops Rewards'       },
    { id: 'robot-mule',   label: 'mule-bot'         },
  ]},
  { id: 'glossary-section', icon: '📖', label: 'Glossary', items: [
    { id: 'glossary-section', label: 'Key Terms (47)' },
  ]},
  { id: 'data-section', icon: '📊', label: 'Data & Coverage', items: [
    { id: 'data-section',        label: 'Overview'              },
    { id: 'catalogs',            label: 'Input Catalog Sources' },
    { id: 'generated-inventory', label: 'Generated Inventory'   },
    { id: 'data-gaps',           label: 'Known Gaps'            },
  ]},
  { id: 'api-section', icon: '🗂', label: 'API & Data Surface', items: [
    { id: 'api-section', label: 'Full explorable map →' },
  ]},
  { id: 'pipeline-section', icon: '⚗', label: 'Data Pipeline', items: [
    { id: 'pipeline-section',   label: 'Overview'              },
    { id: 'pipeline-overview',  label: 'Three-Stage Pipeline'  },
    { id: 'pipeline-scripts',   label: 'Script Reference'      },
    { id: 'pipeline-nav-chain', label: 'Navigation Chain'      },
    { id: 'planet-bias',        label: 'Planet Bias Profiles'  },
    { id: 'observatory-context',label: 'Observatory Provenance'},
  ]},
  { id: 'specs-section', icon: '⚙', label: 'Technical Specs', items: [
    { id: 'specs-section',      label: 'Overview'              },
    { id: 'game-theory',        label: 'Game Theory (DRK-E/QNT-P)' },
    { id: 'settlement-hashmark',label: 'Settlement Hashmark'   },
    { id: 'field-recording',    label: 'Field Recording'       },
    { id: 'coordinate-math',    label: 'Coordinate Maths'      },
  ]},
  { id: 'security-section', icon: '🔐', label: 'Security', items: [
    { id: 'security-section',      label: 'Overview'              },
    { id: 'cve-bulletin',          label: 'Security Bulletin'     },
    { id: 'cve-tooling',           label: 'CVE Tracking Prototype'},
    { id: 'api-security',          label: 'API Security'          },
  ]},
  { id: 'contributing', icon: '🌍', label: 'Community', items: [
    { id: 'contributing', label: 'Contributing & Community' },
  ]},
]

// All nav sections open by default
const openNav = ref<Set<string>>(new Set(NAV.map(s => s.id)))

function toggleNav(id: string) {
  if (openNav.value.has(id)) openNav.value.delete(id)
  else openNav.value.add(id)
  openNav.value = new Set(openNav.value)
}

// ── Scroll tracking ───────────────────────────────────────────────────────────

const activeSection = ref('getting-started')
const contentEl     = ref<HTMLElement | null>(null)

function onWindowScroll() {
  const sectionIds = NAV.flatMap(s => s.items.map(i => i.id))
  for (const id of [...sectionIds].reverse()) {
    const el = document.getElementById(id)
    // Adjusted trigger line to account for the fixed header height
    if (el && el.getBoundingClientRect().top < 160) {
      activeSection.value = id
      break
    }
  }
}

function scrollTo(id: string) {
  if (id === 'edu-lessons') { router.push('/sky-lessons'); return }
  const el = document.getElementById(id)
  if (el) {
    // Offset standard scroll positioning so section headers do not hide beneath the fixed top bar
    const yOffset = -70
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

// ── Search & autohint ─────────────────────────────────────────────────────────

interface DocHint { id: string; section: string; title: string; text: string }

// Flat searchable index
const DOC_INDEX: DocHint[] = [
  { id: 'what-is',         section: 'Getting Started', title: 'What is Exotopia?',     text: 'exoplanet virtual land nft community eco-ops field work nasa catalog' },
  { id: 'new-user',        section: 'Getting Started', title: 'Run Your Own Instance', text: 'self host supabase git gitlab gitea github vercel deploy no blockchain three steps' },
  { id: 'refinements',     section: 'Getting Started', title: 'Refinements',           text: 'cloudflare redis appwrite standalone autonomous home network public stand up federation' },
  { id: 'free-platform',   section: 'Getting Started', title: 'Platform Model',             text: 'fee model resonance split creator platform free zero percent guiding principles qa faq' },
  { id: 'cosmic-view',     section: 'Visualization',   title: 'Cosmic Web & Voids',     text: 'laniakea void bootes local sculptor supercluster filament dark energy blob timular' },
  { id: 'galaxy-clusters', section: 'Visualization',   title: 'Galaxy Clusters & LOD', text: 'lod level detail cluster virgo coma norma xray morphology elliptical spiral' },
  { id: 'system-view',     section: 'Visualization',   title: 'Star Systems',           text: 'planet orbit multiplanet multimoon lagrange l4 l5 camera co-orbit' },
  { id: 'settlement-surfaces', section: 'Visualization', title: 'Settlement Surfaces', text: 'dome surface stone circle xray dkmat dark matter pyramid exoplanet ground' },
  { id: 'nav-wayfinding',  section: 'Visualization',   title: 'Navigation & Wayfinding', text: 'auto-hide breadcrumb strip quick transit recent settlements icons bar header navigation' },
  { id: 'lod-reveal',      section: 'Visualization',   title: 'Granular Zoom (LOD)',   text: 'lod zoom reveal cluster interior overview galaxy systems view system cloud data request console' },
  { id: 'events-section',  section: 'Events',          title: 'Events Overview',       text: 'cosmic event beacon ring panel countdown community pon.ink' },
  { id: 'event-types',     section: 'Events',          title: 'Event Types & Beacons', text: 'live event workshop gallery sound session settlement science outreach beacon colour' },
  { id: 'science-outreach',section: 'Events',          title: 'Science & Education Outreach', text: 'international education research citizen science data verification sprint cluster tour data request' },
  { id: 'edu-lessons',     section: 'Events',          title: 'Educational Lessons — Sky Generation', text: 'parallax sky lessons kepler k2-90 pleiades constellation math exomoon black hole isco hill sphere roche raDecToVec3 grade school classroom' },
  { id: 'contract-workshop-lesson', section: 'Events', title: 'Contracts & Chemistry Workshop', text: 'creative reference agreement rights literacy media file cabinet avogadro butane moles molecules scientific notation sextillion chemistry number theory teaching demo' },
  { id: 'exolocation',     section: 'Protocol',        title: 'Exolocation Addresses', text: 'coordinate system trophic level sublunary syzygy liminal exo-surface-v1 lagrange' },
  { id: 'sunlight-nft',    section: 'Protocol',        title: '$SUNLIGHT NFT',         text: 'sound music creative recording polygon license royalty bars' },
  { id: 'art-tokens',      section: 'Protocol',        title: 'Eco-ops Rewards',       text: 'activity reward eco-ops points ledger sponsor water farm field work contribution record supabase' },
  { id: 'robot-mule',      section: 'Protocol',        title: 'mule-bot',         text: 'mule ai local corpus sovereign knowledge assistant settlement specialist domain' },
  { id: 'glossary-section',section: 'Glossary',        title: 'Key Terms',             text: 'glossary definitions terms protocol trophic astronomy settlement nft' },
  { id: 'catalogs',            section: 'Data',     title: 'Input Catalog Sources',    text: 'nasa exoplanet archive xmm newton takey hyg virgo vcc fcc rc3 laniakea' },
  { id: 'generated-inventory',section: 'Data',     title: 'Generated Data Inventory', text: 'star systems cluster members galaxy oracle generated json pipeline public' },
  { id: 'data-gaps',           section: 'Data',     title: 'Known Gaps',               text: 'missing distance sy_dist null coverage gap southern hemisphere moon data' },
  { id: 'api-section',         section: 'API',      title: 'API & Data Surface',       text: 'api surface supabase schema tables rls migrations settlements sdk exoloc address grammar eco_ops rewards ledger community nodes' },
  { id: 'pipeline-section',    section: 'Pipeline', title: 'Data Pipeline Overview',   text: 'pipeline python datagathering generation deterministic json static ingest enrich' },
  { id: 'pipeline-overview',   section: 'Pipeline', title: 'Three-Stage Pipeline',     text: 'fetch enrich architecture starsystem generate king profile schechter titius bode' },
  { id: 'pipeline-scripts',    section: 'Pipeline', title: 'Script Reference',         text: 'python script datagathering fetch_cluster generate_cluster enrich_with rc3 architecture oracle' },
  { id: 'pipeline-nav-chain',  section: 'Pipeline', title: 'Navigation Chain',         text: 'cluster-galaxy cluster-surface mint route json fetch star-systems url navigation' },
  { id: 'planet-bias',         section: 'Pipeline', title: 'Planet Bias Profiles',     text: 'planet bias jovian rocky short-period ancient cold chaotic infall metallicity icm' },
  { id: 'observatory-context', section: 'Pipeline', title: 'Observatory Provenance',   text: 'observatory context jwst hst chandra anchor telescope cluster dist metallicity tx kev nft metadata provenance' },
  { id: 'game-theory',     section: 'Specs',           title: 'Game Theory',           text: 'drk-e qnt-p dark energy positron timular blob quantum void cluster' },
  { id: 'settlement-hashmark', section: 'Specs',       title: 'Settlement Hashmark',   text: 'sha256 hash quilt design signature dome stone circle reconstruction' },
  { id: 'field-recording', section: 'Specs',           title: 'Field Recording',       text: 'audio microphone record mediarecorder indexeddb local storage voice' },
  { id: 'coordinate-math', section: 'Specs',           title: 'Coordinate Maths',      text: 'ra dec parsec mpc scene units l4 companion orbit tangent normal' },
  { id: 'security-section',     section: 'Security', title: 'Security Overview',          text: 'security nft cve vulnerability bulletin disclosure tooling portal' },
  { id: 'cve-bulletin',         section: 'Security', title: 'Security Bulletin',          text: 'cve bulletin community art token disbursement contributors verifier curator submitter' },
  { id: 'cve-tooling',          section: 'Security', title: 'CVE Tracking Prototype',     text: 'cve alerts relay cisa kev known exploited vulnerabilities device vendor product indexeddb desec opsec tooling portal' },
  { id: 'api-security',         section: 'Security', title: 'API & mule-bot Security',    text: 'cors rate limiting account auth mule-bot local node' },
  { id: 'contributing',    section: 'Community',       title: 'Community',             text: 'citizen science arts education international community ot kulcha fana ka gpl' },
]

const query        = ref('')
const searchFocused = ref(false)
const hintIdx      = ref(0)

const hints = computed((): DocHint[] => {
  const q = query.value.trim().toLowerCase()
  if (!q || q.length < 2) return []
  return DOC_INDEX
    .filter(d => d.title.toLowerCase().includes(q) || d.text.toLowerCase().includes(q) || d.section.toLowerCase().includes(q))
    .slice(0, 6)
})

function onQuery() { hintIdx.value = 0 }

function selectHint(h: DocHint | undefined) {
  if (!h) return
  closeSearch()
  scrollTo(h.id)
  activeSection.value = h.id
}

function closeSearch() { searchFocused.value = false; hintIdx.value = 0 }
function clearSearch()  { query.value = ''; closeSearch() }
function onBlur()       { setTimeout(closeSearch, 150) }

// ── Key glossary terms ────────────────────────────────────────────────────────

const KEY_TERMS = [
  { id:  1,  term: 'STN',           short: 'Station Number — prefix for Orbital Station announcement IDs (STN-001…).' },
  { id:  3,  term: 'EXOLOC',        short: 'The exo- namespace for all virtual property addresses.' },
  { id:  6,  term: 'Trophic Level', short: 'A settlement\'s position in the gravitational hierarchy of a star system (L1–L6).' },
  { id: 10,  term: 'L4 SUBLUNARY',  short: 'Trophic level 4 — on the surface of a moon. Coordinate system: exo-moon-surface-v1.' },
  { id: 11,  term: 'L5 SYZYGY',     short: 'Trophic level 5 — at a moon–planet Lagrange equilibrium point.' },
  { id: 24,  term: 'Exolocation',   short: 'Permanent, local-first address anchoring a settlement to a specific location on an exoplanet — no wallet or blockchain required.' },
  { id: 29,  term: 'Stone Circle',  short: 'Cultural landmark at the centre of each settlement. Marks cardinal directions and carries the intention statement.' },
  { id: 31,  term: 'Resonance Split', short: '99 / 0.75 / 0.25 on fee-carrying mints; 100 / 0 / 0 on settlement deeds. Primary minting is free — gas only.' },
  { id: 40,  term: 'PON INK',       short: 'Optional creative-economy portal (sound tools, payments, NFT minting) — not required to create or use a settlement.' },
  { id: 41,  term: 'SCD Hub',       short: 'Sustainable Community Development Hub — US non-profit building digital infrastructure for community resilience.' },
  { id: 42,  term: 'E8 Coxeter Lattice', short: 'Mathematical basis for the wormhole conduit network transit routing geometry.' },
  { id: 45,  term: 'Hub Approvideo', short: 'SCD Hub curated video resource library — maintained by mule-bot.' },
  { id: 46,  term: 'Science Outreach Event', short: 'A cosmic-map session run with international education or research partners — focused on data, not performance.' },
  { id: 47,  term: 'LOD Data Reveal', short: 'Progressive zoom-in disclosure of generated vs. catalog star-system data for a galaxy cluster member.' },
]

const CATALOG_ROWS = [
  { name: 'NASA Exoplanet Archive (viz set)',  count: '6,158 planets',   use: 'Galaxy star-system sprites, surface views, addressing' },
  { name: 'XMM-Newton Takey2013 X-ray',       count: '345 clusters',    use: 'Cosmic view cluster sprites, LOD galaxy fields' },
  { name: 'HYG Star Database v4.1',            count: '119,626 stars',   use: 'Cluster foreground star fields, stellar physics' },
  { name: 'Virgo Cluster Catalog (VCC)',        count: '2,096 galaxies',  use: 'Virgo LOD 2/3 galaxy morphology field' },
  { name: 'Fornax Cluster Catalog (FCC)',       count: '340 galaxies',    use: 'Fornax LOD 2/3 galaxy field' },
  { name: 'Third Reference Catalogue (RC3)',    count: '23,022 galaxies', use: 'LOD 3 galaxy structure parameters (axis ratio, PA, Hubble type)' },
]

const GENERATED_ROWS = [
  { name: 'Cluster member catalogs', vol: '13 clusters · ~2,600 galaxies', path: 'public/clusters/*-members.json',         use: 'LOD galaxy sprites, click navigation, morphology distribution' },
  { name: 'Star system JSONs',        vol: '~2,800 files · 40–80 systems each', path: 'public/star-systems/{cluster}/{id}.json', use: 'ClusterGalaxyPage — star field + planet data' },
  { name: 'Galaxy oracle seeds',      vol: '11 clusters',                    path: 'public/galaxy-oracle/*-region.json',    use: 'CosmicPage procedural member rendering (universe-221x model)' },
  { name: 'XMM X-ray cluster data',   vol: '345 JSON files',                 path: 'public/stars/j*.json',                  use: 'CosmicPage xray LOD layer — temperature, richness, ICM mass' },
  { name: 'HYG star field (compact)', vol: '119,626 stars',                  path: 'public/galaxy-oracle/hyg-compact.json', use: 'Cluster approach foreground star layer' },
  { name: 'Generation inventory',     vol: '2,617 entries',                  path: 'datagathering/generation_inventory.json', use: 'Pipeline render-queue tracking; observatory_context per system' },
]

const SCRIPT_ROWS = [
  { name: 'fetch_cluster_catalogs.py',        input: 'VizieR / NED API',              output: '*-members.json',            notes: 'Downloads real galaxy member positions and morphology' },
  { name: 'generate_named_cluster_members.py',input: 'cosmic-structures.ts bright galaxies', output: '*-members.json',     notes: 'King-profile + Schechter LF synthesis for named groups' },
  { name: 'generate_cluster_catalog.py',      input: 'Cluster profile definitions',   output: '*-members.json',            notes: 'σ_v, T_x, M200, r_vir literature parameters + zone morphology' },
  { name: 'enrich_with_rc3.py',               input: 'RC3 VizieR table VII/155/rc3',  output: '*-members.json (updated)',  notes: 'Adds axis_ratio, pa_deg, angular size for LOD 3 rendering' },
  { name: 'enrich_with_architecture.py',      input: 'Enriched members + XMM params', output: '*-members.json + inventory',notes: 'Assigns planet_bias, metallicity, icm_stress; writes generation_inventory.json' },
  { name: 'generate_cluster_starsystems.py',  input: 'Members with system_architecture', output: 'star-systems/{cluster}/{id}.json', notes: 'Titius-Bode orbits, spectral table, planet types from bias profile' },
  { name: 'generate_galaxy_oracle.py',        input: 'Cluster params + morphology weights', output: 'galaxy-oracle/*-region.json', notes: 'Pre-baked galaxy sprite positions (universe-221x seed)' },
  { name: 'generate_v0_starsystems.py',       input: 'CSV definitions + cosmic-structures', output: 'star-systems/{cluster}/{named}.json', notes: 'Hand-designed anchor galaxies (M31, NGC4486, NGC3311…)' },
]

const PLANET_BIAS_ROWS = [
  { name: 'jovian_wide',           worlds: 'Gas giants with wide orbits, large moon systems',     env: 'Low ICM stress, high metallicity, outer cluster' },
  { name: 'ancient_cold_rocky',    worlds: 'Old rocky planets, minimal atmospheres, frozen moons', env: 'Low stellar density, aged stellar population' },
  { name: 'rocky_short_period',    worlds: 'Hot rocky worlds close to the star, strong tidal forces',env: 'Dense cluster core, high ICM stress, stripping' },
  { name: 'mixed',                 worlds: 'Balanced terrestrial + gas giant distribution',        env: 'Field galaxies, moderate ICM, moderate metallicity' },
  { name: 'chaotic_infall',        worlds: 'Eccentric orbits, rogue moons, stripped atmospheres',  env: 'Infalling galaxy, high icm_stress, ram pressure' },
]

// ── Lifecycle Hooks ───────────────────────────────────────────────────────────

onMounted(() => {
  window.addEventListener('scroll', onWindowScroll)
  const hash = route.hash?.slice(1)
  if (hash) setTimeout(() => scrollTo(hash), 300)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
})
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */
.dp-page { 
  background: #020408; 
  min-height: 100vh; 
  font-family: 'Courier New', monospace; 
  display: flex; 
  flex-direction: column; 
}

/* ── Top bar ──────────────────────────────────────────────────────────────── */
.dp-topbar {
  display: flex; 
  align-items: center; 
  gap: 16px;
  padding: 0 20px; 
  height: 48px; 
  flex-shrink: 0;
  background: rgba(0, 4, 14, 0.95);
  border-bottom: 1px solid rgba(0, 80, 130, 0.22);
  /* REPAIR: Absolute structural layout pin ensuring search panel never leaves frame */
  position: fixed; 
  top: 0; 
  left: 0;
  right: 0;
  z-index: 100;
}

.dp-home-link {
  display: flex; align-items: baseline; gap: 2px; text-decoration: none;
  font-size: 12px; font-weight: 300; letter-spacing: 0.16em; flex-shrink: 0;
  transition: opacity 0.12s;
}
.dp-home-link:hover { opacity: 0.75; }
.dp-home-exo   { color: #4dd0e1; }
.dp-home-topia { color: #90a4ae; }
.dp-home-arrow { color: rgba(80,160,200,0.50); font-size: 10px; margin-left: 3px; }

.dp-topbar-title { font-size: 9px; letter-spacing: 0.18em; color: rgba(80,140,180,0.50); flex: 1; }

.dp-search-wrap { position: relative; }
.dp-search-field { min-width: 220px; }
.dp-hints {
  position: absolute; top: calc(100% + 4px); right: 0; left: 0;
  background: rgba(1,6,22,0.99); border: 1px solid rgba(0,140,200,0.28);
  border-radius: 5px; z-index: 200; overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.70);
}
.dp-hint {
  display: flex; align-items: baseline; gap: 10px;
  padding: 7px 12px; cursor: pointer; font-size: 9.5px;
  border-bottom: 1px solid rgba(0,60,100,0.18);
  transition: background 0.10s;
}
.dp-hint:last-child { border-bottom: none; }
.dp-hint:hover, .dp-hint--active { background: rgba(0,40,80,0.55); }
.dp-hint__cat   { font-size: 7.5px; letter-spacing: 0.10em; color: rgba(0,180,220,0.55); min-width: 80px; }
.dp-hint__title { color: rgba(180,220,245,0.85); }

/* ── Layout ───────────────────────────────────────────────────────────────── */
.dp-layout { 
  display: flex; 
  flex: 1; 
  /* REPAIR: Let page flow and unroll context organically down screen height */
  margin-top: 48px;
  min-height: calc(100vh - 48px);
}

/* ── Left nav ─────────────────────────────────────────────────────────────── */
.dp-nav {
  width: 220px; 
  flex-shrink: 0;
  background: rgba(0, 4, 14, 0.90); 
  border-right: 1px solid rgba(0, 70, 120, 0.20);
  padding: 12px 0 40px;
  /* REPAIR: Lock nav column dynamically in layout frame as reading scrolls down */
  position: sticky; 
  top: 48px; 
  max-height: calc(100vh - 48px);
  overflow-y: auto; 
  scrollbar-width: thin; 
  scrollbar-color: rgba(0,100,160,0.20) transparent;
}

.dp-nav-section-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 14px; cursor: pointer; font-size: 9px; letter-spacing: 0.12em;
  color: rgba(0,200,240,0.60); font-weight: 600;
  transition: color 0.12s;
  user-select: none;
}
.dp-nav-section-head:hover { color: rgba(0,220,255,0.82); }

.dp-nav-items { display: flex; flex-direction: column; padding-bottom: 6px; }
.dp-nav-item {
  padding: 5px 14px 5px 22px; font-size: 9px; color: rgba(120,175,215,0.65);
  cursor: pointer; text-decoration: none; display: block;
  transition: background 0.10s, color 0.10s; border-radius: 0;
  letter-spacing: 0.03em;
}
.dp-nav-item:hover { background: rgba(0,30,70,0.55); color: rgba(0,220,255,0.85); }
.dp-nav-item--active { color: rgba(0,220,255,0.90); background: rgba(0,40,90,0.45); border-left: 2px solid rgba(0,200,255,0.50); padding-left: 20px; }

/* ── Content ──────────────────────────────────────────────────────────────── */
.dp-content {
  flex: 1; 
  padding: 32px 48px 80px;
  /* REPAIR: Clean flow execution without double scroll boxes */
}

.dp-section { max-width: 720px; margin-bottom: 48px; }
.dp-sub     { margin: 24px 0; }

.dp-h1 {
  font-size: 22px; font-weight: 300; color: rgba(210, 240, 255, 0.92);
  letter-spacing: 0.05em; margin: 0 0 14px;
  border-bottom: 1px solid rgba(0, 80, 130, 0.22); padding-bottom: 10px;
}
.dp-h2 {
  font-size: 14px; font-weight: 600; color: rgba(180, 220, 245, 0.88);
  letter-spacing: 0.05em; margin: 0 0 8px;
}
.dp-h3 {
  font-size: 11px; font-weight: 600; color: rgba(170, 210, 235, 0.82);
  letter-spacing: 0.06em; margin: 16px 0 6px;
}
.dp-p  { font-size: 10.5px; color: rgba(120, 175, 215, 0.72); line-height: 1.75; margin: 0 0 10px; }
.dp-p strong { color: rgba(200, 230, 255, 0.85); }

.dp-ul, .dp-ol { padding-left: 18px; margin: 6px 0 10px; display: flex; flex-direction: column; gap: 5px; }
.dp-ul li, .dp-ol li { font-size: 10px; color: rgba(120, 175, 215, 0.70); line-height: 1.65; }
.dp-ul li strong, .dp-ol li strong { color: rgba(200, 230, 255, 0.85); }

.dp-link { color: rgba(0, 200, 240, 0.80); text-decoration: underline; text-underline-offset: 2px; font-size: 10.5px; }
.dp-link:hover { color: #00e5ff; }
.dp-link--btn {
  display: inline-block; padding: 5px 12px; border: 1px solid rgba(0, 160, 220, 0.32);
  border-radius: 4px; text-decoration: none; font-size: 9.5px; letter-spacing: 0.08em;
  color: rgba(0, 200, 240, 0.80); background: rgba(0, 30, 60, 0.35);
  transition: border-color 0.12s, background 0.12s; margin-bottom: 12px;
}
.dp-link--btn:hover { border-color: rgba(0, 220, 255, 0.55); background: rgba(0, 50, 100, 0.50); }

.dp-code { background: rgba(0, 25, 55, 0.55); border: 1px solid rgba(0, 100, 160, 0.22); border-radius: 3px; padding: 1px 6px; font-size: 9.5px; color: rgba(0, 210, 255, 0.80); }

.dp-code-block {
  background: rgba(0, 6, 18, 0.90); border: 1px solid rgba(0, 80, 130, 0.22); border-radius: 5px;
  padding: 12px 14px; font-size: 9.5px; color: rgba(0, 220, 150, 0.80);
  white-space: pre; overflow-x: auto; margin: 8px 0; line-height: 1.7;
}

.dp-callout {
  background: rgba(0, 30, 60, 0.40); border-left: 3px solid rgba(0, 160, 220, 0.50);
  border-radius: 0 4px 4px 0; padding: 10px 14px;
  font-size: 9.5px; color: rgba(140, 200, 235, 0.75); line-height: 1.60; margin: 10px 0;
}
.dp-callout--warn {
  background: rgba(40, 20, 0, 0.40); border-left-color: rgba(220, 150, 30, 0.55);
  color: rgba(210, 180, 100, 0.78);
}
.dp-callout--info {
  background: rgba(0, 50, 40, 0.35); border-left-color: rgba(0, 200, 150, 0.50);
  color: rgba(130, 215, 190, 0.78);
}

.dp-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5px; }
.dp-table th { text-align: left; padding: 6px 10px; font-size: 8px; letter-spacing: 0.12em; color: rgba(0, 180, 220, 0.55); border-bottom: 1px solid rgba(0, 80, 130, 0.22); background: rgba(0, 12, 30, 0.60); }
.dp-table td { padding: 6px 10px; color: rgba(140, 195, 230, 0.75); border-bottom: 1px solid rgba(0, 50, 90, 0.18); }
.dp-table tr:last-child td { border-bottom: none; }
.dp-table td:first-child { color: rgba(180, 220, 245, 0.85); }

/* Inline help Q&A */
.dp-qa { display: flex; flex-direction: column; gap: 8px; margin: 10px 0 6px; }
.dp-qa-item {
  background: rgba(0, 8, 22, 0.55); border: 1px solid rgba(0, 70, 120, 0.20);
  border-radius: 5px; padding: 9px 12px;
}
.dp-qa-q {
  font-size: 10px; font-weight: 600; color: rgba(0, 210, 255, 0.85);
  line-height: 1.5; margin: 0 0 4px;
}
.dp-qa-q::before { content: 'Q · '; color: rgba(0, 160, 210, 0.55); }
.dp-qa-a { font-size: 10px; color: rgba(120, 175, 215, 0.72); line-height: 1.65; margin: 0; }
.dp-qa-a::before { content: 'A · '; color: rgba(0, 200, 150, 0.50); }

/* Guiding-principles validation grid */
.dp-principles {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px; margin: 6px 0 10px;
}
.dp-principle {
  background: rgba(0, 50, 40, 0.22); border: 1px solid rgba(0, 150, 110, 0.22);
  border-radius: 5px; padding: 9px 12px;
}
.dp-principle-name {
  font-size: 8.5px; font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase;
  color: rgba(0, 200, 150, 0.75); margin: 0 0 4px;
}
.dp-principle-body { font-size: 10px; color: rgba(130, 215, 190, 0.78); line-height: 1.6; margin: 0; }

/* Glossary mini-grid */
.dp-gloss-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 8px; }
.dp-gloss-item { background: rgba(0, 8, 22, 0.70); border: 1px solid rgba(0, 70, 120, 0.18); border-radius: 4px; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
.dp-gloss-num  { font-size: 7px; letter-spacing: 0.14em; color: rgba(0, 180, 220, 0.45); }
.dp-gloss-term { font-size: 10.5px; font-weight: 600; color: rgba(190, 225, 250, 0.88); }
.dp-gloss-short { font-size: 8.5px; color: rgba(110, 165, 205, 0.62); line-height: 1.55; }

/* ── Mobile — the desktop layout is a fixed 220px sidebar + 720px content
   column + 48px side padding (~1036px minimum), which forced horizontal
   scroll on any phone-width viewport. Stack the sidebar above the content
   and shrink padding/grids instead of changing any of the nav/search/table
   behavior. ────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .dp-topbar-title { display: none; }
  .dp-search-wrap  { flex: 1; min-width: 0; }
  .dp-search-field { min-width: 0; width: 100%; }

  .dp-layout { flex-direction: column; }

  .dp-nav {
    width: 100%;
    position: static;
    /* All accordion sections start expanded (see openNav init) — on the
       desktop sidebar that's fine since it scrolls independently of the
       content column, but stacked full-width here it would push the
       actual page content down by several screens. Cap it and let it
       scroll on its own, same idea as the desktop sidebar just capped
       by viewport height instead of full height. */
    max-height: 38vh;
    overflow-y: auto;
    border-right: none;
    border-bottom: 1px solid rgba(0, 70, 120, 0.20);
    padding: 8px 0 12px;
  }

  .dp-content { padding: 20px 16px 60px; }
  .dp-section { max-width: 100%; }

  .dp-table { display: block; overflow-x: auto; }

  .dp-gloss-grid { grid-template-columns: 1fr; }

  /* Added with the Platform Model section — same overflow-prone patterns
     as .dp-gloss-grid and .dp-table above, same fix. */
  .dp-qa-item, .dp-principle { padding: 9px 10px; }
  .dp-principles { grid-template-columns: 1fr; }
}
</style>