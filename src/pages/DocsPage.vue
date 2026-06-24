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
          style="min-width:220px"
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

    <div class="dp-layout dp-layout-offset">

      <nav class="dp-nav" :style="{ transform: `translateY(${navPhysicsY}px)` }">
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

      <main class="dp-content" ref="contentEl" @scroll="onContentScroll">

        <section :id="'getting-started'" class="dp-section">
          <h1 class="dp-h1">Getting Started</h1>
          <p class="dp-p">Exotopia is an open, browser-based platform for virtual settlement on confirmed exoplanets, community-owned NFT minting, and real-world eco-ops field work. The standard Resonance Split is <strong>99 / 0.75 / 0.25</strong> — 99% to creator, 0.75% to the Community Hardware Fund, 0.25% platform maintenance.</p>

          <div :id="'what-is'" class="dp-sub">
            <h2 class="dp-h2">What is Exotopia?</h2>
            <p class="dp-p">Exotopia connects three things:</p>
            <ul class="dp-ul">
              <li><strong>NASA Exoplanet Archive data</strong> — 6,158 confirmed planets rendered in a navigable 3D cosmic web</li>
              <li><strong>Virtual land deeds</strong> — Exolocation NFTs that anchor a settlement to a specific coordinate on an exoplanet</li>
              <li><strong>SCD Hub eco-ops network</strong> — real-world water quality, farm mapping, and community field work recorded on-chain</li>
            </ul>
          </div>

          <div :id="'new-user'" class="dp-sub">
            <h2 class="dp-h2">New user quickstart</h2>
            <ol class="dp-ol">
              <li>Open <router-link to="/onboard" class="dp-link">Get Started</router-link> and follow the 5-step wizard</li>
              <li>Choose a blockchain: <strong>Polygon</strong> (most wallets) or <strong>Celo</strong> (mobile-first, East Africa)</li>
              <li>Create or connect a wallet — browser wallet option requires no extension</li>
              <li>Get free testnet tokens from the faucet (30 seconds)</li>
              <li>Browse the <router-link to="/galaxy" class="dp-link">galaxy view</router-link>, find a planet, click it, and claim 40 acres</li>
            </ol>
          </div>

          <div :id="'free-platform'" class="dp-sub">
            <h2 class="dp-h2">Platform model — 99 / 0.75 / 0.25</h2>
            <p class="dp-p">The standard Resonance Split applies to all transactions: <strong>99%</strong> to the creator/artist/worker wallet, <strong>0.75%</strong> to the Community Hardware Fund (WATSAN, mapping, field infrastructure), <strong>0.25%</strong> to platform maintenance. Primary minting is free (network gas only). Special mintings and airdrop events may use different parameters via additional contracts — any custom split requires co-sign approval and is logged on-chain.</p>
            <div class="dp-callout">
              <strong>Fee isolation rule:</strong> Gas costs are always displayed separately and never combined with creator payouts. The resonance split (99 / 0.75 / 0.25) is computed independently of gas.
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
        </section>

        <section :id="'protocol'" class="dp-section">
          <h1 class="dp-h1">Protocol &amp; Token Economy</h1>

          <div :id="'exolocation'" class="dp-sub">
            <h2 class="dp-h2">Exolocation address system</h2>
            <p class="dp-p">Every settlement has a permanent on-chain address:</p>
            <div class="dp-code-block">exo-surface-v1 : Kepler-442b : 15N,23W</div>
            <p class="dp-p">Three components: <strong>coordinate system</strong> · <strong>reference body</strong> · <strong>location descriptor</strong> (lat/lon for surface, L4/L5 for Lagrange, altitude band for orbital).</p>
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
            <p class="dp-p">The sound and creative recording NFT standard on Polygon. $SUNLIGHT NFTs represent ownership of a recorded sound, track, or creative work — with on-chain licensing terms (personal use, commercial, sync, exclusive). Royalty enforcement is on-chain. The name reflects the free-flowing, illuminating nature of creative energy in the network.</p>
            <p class="dp-p">Metadata fields: title, artist, duration_sec, BPM, key, genre, IPFS audio CID, license, co-artists, sample credits.</p>
          </div>

          <div :id="'art-tokens'" class="dp-sub">
            <h2 class="dp-h2">Activity Reward Tokens (ART)</h2>
            <p class="dp-p">Sponsors of eco-ops field activities receive ART tokens proportional to verified impact. Token rates:</p>
            <ul class="dp-ul">
              <li>💧 Water quality check-in → +12 ART</li>
              <li>🌱 Farm map submission → +8 ART</li>
              <li>◈ Eco-ops verified on-chain → +5 ART</li>
            </ul>
            <p class="dp-p">ARTs are transferable and listable on the secondary market. They have no fixed price — value is determined by community activity levels and network participation.</p>
          </div>

          <div :id="'robot-mule'" class="dp-sub">
            <h2 class="dp-h2">mule-bot</h2>
            <p class="dp-p">The Mule is a local-network AI knowledge assistant attached to each settlement. It is <strong>not connected to any LLM or cloud service</strong> — it runs on the settlement owner's hardware and its corpus stays sovereign.</p>
            <p class="dp-p">Five specialist domains: educational advocacy materials · business planning metrics · community water system health · youth career development in environmental engineering · Hub Approvideo library maintenance.</p>
          </div>
        </section>

        <section :id="'glossary-section'" class="dp-section">
          <h1 class="dp-h1">Glossary</h1>
          <p class="dp-p">45 canonical terms. In body text, superscript numbers link to these entries: <code class="dp-code">sublunary¹⁰</code> → entry [10].</p>
          <router-link to="/glossary" class="dp-link dp-link--btn">Open full glossary →</router-link>

          <div class="dp-gloss-grid q-mt-md">
            <div v-for="t in KEY_TERMS" :key="t.id" class="dp-gloss-item">
              <div class="dp-gloss-num">[{{ t.id }}]</div>
              <div class="dp-gloss-term">{{ t.term }}</div>
              <div class="dp-gloss-short">{{ t.short }}</div>
            </div>
          </div>
        </section>

        <section :id="'chains-section'" class="dp-section">
          <h1 class="dp-h1">Networks</h1>
          <p class="dp-p">Two EVM testnet chains are active. Mainnet addresses are TBD. Standard Resonance Split: <strong>99 / 0.75 / 0.25</strong> on all chains.</p>

          <div :id="'polygon'" class="dp-sub">
            <h2 class="dp-h2">Polygon Amoy Testnet</h2>
            <table class="dp-table">
              <tbody>
                <tr><td>Chain ID</td><td>80002 (0x13882)</td></tr>
                <tr><td>RPC</td><td>https://rpc-amoy.polygon.technology</td></tr>
                <tr><td>Explorer</td><td>https://amoy.polygonscan.com</td></tr>
                <tr><td>Faucet</td><td>https://faucet.polygon.technology</td></tr>
                <tr><td>NFT types</td><td>$SUNLIGHT · Water Quality Certs · Exolocation Deeds</td></tr>
              </tbody>
            </table>
          </div>

          <div :id="'celo'" class="dp-sub">
            <h2 class="dp-h2">Celo Alfajores Testnet</h2>
            <p class="dp-p">Mobile-first, EVM-compatible. Strong adoption in East Africa — cUSD stablecoin maps directly to M-Pesa payment flows. Recommended for community workers using Valora mobile wallet.</p>
            <table class="dp-table">
              <tbody>
                <tr><td>Chain ID</td><td>44787 (0xAEF3)</td></tr>
                <tr><td>RPC</td><td>https://alfajores-forno.celo-testnet.org</td></tr>
                <tr><td>Explorer</td><td>https://alfajores.celoscan.io</td></tr>
                <tr><td>Faucet</td><td>https://faucet.celo.org/alfajores</td></tr>
                <tr><td>NFT types</td><td>Community Badges · Eco-ops Tokens</td></tr>
              </tbody>
            </table>
          </div>

          <div :id="'algorand'" class="dp-sub">
            <h2 class="dp-h2">Algorand (planned)</h2>
            <p class="dp-p">ARC-3 / ARC-69 dual standard for Exolocation Deeds. ARC-3 stores full JSON metadata on IPFS; ARC-69 stores the tamper-evident fingerprint on-chain (≤1 KB). Integration pending.</p>
          </div>
        </section>

        <section :id="'data-section'" class="dp-section">
          <h1 class="dp-h1">Data Sources</h1>
          <router-link to="/data-coverage" class="dp-link dp-link--btn">Full data coverage page →</router-link>

          <div :id="'catalogs'" class="dp-sub">
            <h2 class="dp-h2">Catalog sources</h2>
            <table class="dp-table">
              <thead><tr><th>Source</th><th>Records</th><th>Used for</th></tr></thead>
              <tbody>
                <tr v-for="c in CATALOG_ROWS" :key="c.name">
                  <td>{{ c.name }}</td><td>{{ c.count }}</td><td>{{ c.use }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div :id="'data-gaps'" class="dp-sub">
            <h2 class="dp-h2">Known gaps</h2>
            <ul class="dp-ul">
              <li><strong>2.1% of planets have no measured distance</strong> — deterministic estimated positions used (consistent but may be misplaced by hundreds of parsecs)</li>
              <li><strong>Southern hemisphere cluster coverage thinner</strong> — galactic dust obscures the Norma/GA region</li>
              <li><strong>Most cluster members are procedural</strong> — only Virgo (VCC) and Fornax (FCC) use real catalog member positions</li>
              <li><strong>Moon data is sparse</strong> — only system-level moon counts are recorded; individual moon properties approximated</li>
            </ul>
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

          <div :id="'security-model'" class="dp-sub">
            <h2 class="dp-h2">Browser wallet security model</h2>
            <p class="dp-p">When using the built-in browser wallet (no extension required):</p>
            <ul class="dp-ul">
              <li>Key generation uses <code class="dp-code">crypto.getRandomValues()</code> — never Math.random()</li>
              <li>Encryption: ethers v6 <code class="dp-code">encryptKeystoreJson</code> with scrypt N=131072 (~128 MB RAM per brute-force attempt)</li>
              <li>Storage: IndexedDB <code class="dp-code">'exo_wallet'</code> — not localStorage, not cookies</li>
              <li>Session: 30-minute inactivity lock, private key nulled on lock</li>
              <li>Anti-phishing word: user-set word shown on every unlock screen</li>
              <li>Mnemonic: displayed once, quiz-verified, then cleared from JS memory</li>
            </ul>
            <div class="dp-callout dp-callout--warn">
              Browser wallets are suitable for testnet and small amounts. For real funds, use a hardware wallet. The platform never asks for your seed phrase.
            </div>
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
          <p class="dp-p">Exotopia tracks security vulnerabilities filtered for NFT creators, wallet holders, and settlement operators — translating technical CVE disclosures into plain-language action items for the communities we serve.</p>

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
              Critical or High NFT-Impact bulletins may be minted as $SUNLIGHT NFTs by the Curator — recording them as permanent community knowledge artefacts. Curator receives 100% of any secondary resale.
            </div>
            <p class="dp-p"><strong>CVE sources we monitor:</strong> NVD, OpenZeppelin advisories, ethers.js releases, Ethereum Foundation blog, Trail of Bits, Immunefi (post-patch), Rekt News. Full source list and contribution process: <code class="dp-code">SPEC_SECURITY_BULLETIN.md</code></p>
          </div>

          <div :id="'smart-contract-risks'" class="dp-sub">
            <h2 class="dp-h2">Smart Contract Risk Reference</h2>
            <p class="dp-p">Common vulnerability types affecting NFT contracts and wallets:</p>
            <ul class="dp-ul">
              <li><strong>Reentrancy</strong> — malicious contract calls back into victim before state updates. Prevention: checks-effects-interactions pattern; <code class="dp-code">nonReentrant</code> modifier on all value-transferring functions. Origin: 2016 TheDAO hack. → [55]</li>
              <li><strong>Front-running / MEV</strong> — bots reorder mempool transactions to extract value. NFT-specific: mint sniping, reveal reordering. Prevention: commitment-reveal for randomness; fixed-price minting. → [56]</li>
              <li><strong>Honeypot contracts</strong> — appear mintable/tradeable but trap funds via hidden transfer restrictions. Detection: verify contract source; check for asymmetric buy/sell history. → [57]</li>
              <li><strong>Rug pull</strong> — liquidity withdrawn or project abandoned by design. Prevention: time-locked liquidity, multisig treasury, DAO-governed contract ownership. → [58]</li>
              <li><strong>Phishing / address poisoning</strong> — fake sites harvesting seed phrases; fake addresses in transaction history. Prevention: bookmark URLs; anti-phishing word on wallet unlock; verify full address before every signing. → [59]</li>
            </ul>
            <div class="dp-callout dp-callout--warn">
              Exotopia contracts use <code class="dp-code">nonReentrant</code> on all value transfers, fixed-price minting (no MEV surface), and the Ecommunity DAO governs contract ownership. The platform never asks for your seed phrase.
            </div>
          </div>

          <div :id="'api-security'" class="dp-sub">
            <h2 class="dp-h2">API &amp; mule-bot Security</h2>
            <p class="dp-p">The mule-bot API runs locally (localhost:8888) and authenticates via wallet signature:</p>
            <div class="dp-code-block">Header: X-Settlement-Auth: {wallet_address}.{timestamp}.{signature}
Signature = sign(wallet, "{exoloc_address}:{timestamp}")</div>
            <ul class="dp-ul">
              <li><strong>Local-network native</strong> — the node never contacts an external cloud service; corpus data stays sovereign on the settlement owner's hardware</li>
              <li><strong>CORS</strong> — the node emits <code class="dp-code">Access-Control-Allow-Origin</code> for the app origin only; not wildcard in production → [49]</li>
              <li><strong>Rate limiting</strong> — eco-ops submissions capped at 10/hour per wallet to prevent corpus spam and on-chain queue flooding; HTTP 429 with <code class="dp-code">Retry-After</code> → [50]</li>
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
            PON INK v1.0 · Exotopia · GPL v3 · SCD Hub non-profit
          </div>
        </section>

      </main>
    </div></q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter }     from 'vue-router'

const route  = useRoute()
const router = useRouter()

// ── Navigation structure ──────────────────────────────────────────────────────

const NAV = [
  { id: 'getting-started', icon: '🚀', label: 'Getting Started', items: [
    { id: 'getting-started', label: 'Overview'              },
    { id: 'what-is',         label: 'What is Exotopia?'     },
    { id: 'new-user',        label: 'Quickstart'            },
    { id: 'free-platform',   label: '99/0.75/0.25 Model'         },
  ]},
  { id: 'visualization', icon: '🌌', label: 'Visualization', items: [
    { id: 'visualization',       label: 'Overview'               },
    { id: 'cosmic-view',         label: 'Cosmic Web & Voids'     },
    { id: 'galaxy-clusters',     label: 'Galaxy Clusters & LOD'  },
    { id: 'system-view',         label: 'Star Systems'           },
    { id: 'settlement-surfaces', label: 'Settlement Surfaces'    },
  ]},
  { id: 'protocol', icon: '⬡', label: 'Protocol & Economy', items: [
    { id: 'protocol',     label: 'Overview'              },
    { id: 'exolocation',  label: 'Exolocation Addresses' },
    { id: 'sunlight-nft', label: '$SUNLIGHT NFT'         },
    { id: 'art-tokens',   label: 'ART Tokens'            },
    { id: 'robot-mule',   label: 'mule-bot'         },
  ]},
  { id: 'glossary-section', icon: '📖', label: 'Glossary', items: [
    { id: 'glossary-section', label: 'Key Terms (45)' },
  ]},
  { id: 'chains-section', icon: '🔗', label: 'Networks', items: [
    { id: 'chains-section', label: 'Overview'             },
    { id: 'polygon',        label: 'Polygon Amoy'        },
    { id: 'celo',           label: 'Celo Alfajores'      },
    { id: 'algorand',       label: 'Algorand (planned)'  },
  ]},
  { id: 'data-section', icon: '📊', label: 'Data & Coverage', items: [
    { id: 'data-section', label: 'Overview'       },
    { id: 'catalogs',     label: 'Catalog Sources'},
    { id: 'data-gaps',    label: 'Known Gaps'     },
  ]},
  { id: 'specs-section', icon: '⚙', label: 'Technical Specs', items: [
    { id: 'specs-section',      label: 'Overview'              },
    { id: 'game-theory',        label: 'Game Theory (DRK-E/QNT-P)' },
    { id: 'security-model',     label: 'Wallet Security'       },
    { id: 'settlement-hashmark',label: 'Settlement Hashmark'   },
    { id: 'field-recording',    label: 'Field Recording'       },
    { id: 'coordinate-math',    label: 'Coordinate Maths'      },
  ]},
  { id: 'security-section', icon: '🔐', label: 'Security', items: [
    { id: 'security-section',      label: 'Overview'              },
    { id: 'cve-bulletin',          label: 'Security Bulletin'     },
    { id: 'smart-contract-risks',  label: 'Smart Contract Risks'  },
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

// ── Scroll tracking & Elastic Navigation Physics ──────────────────────────────

const activeSection = ref('getting-started')
const contentEl     = ref<HTMLElement | null>(null)

// Physics simulation hooks
const navPhysicsY = ref(0)
let currentY = 0
let targetY = 0
let velocity = 0
let lastScrollTop = 0
let rafId: number | null = null

// Physics coefficients (Spring stiffness & damping ratio coefficients)
const STIFFNESS = 0.12 
const DAMPING = 0.68

function updatePhysics() {
  // Hooke's Law tracking loop: Force = -k*x - c*v
  const displacement = targetY - currentY
  const springForce = displacement * STIFFNESS
  velocity += springForce
  velocity *= DAMPING
  currentY += velocity

  navPhysicsY.value = currentY

  // Stop requesting frames if the system reaches dynamic equilibrium
  if (Math.abs(displacement) > 0.05 || Math.abs(velocity) > 0.05) {
    rafId = requestAnimationFrame(updatePhysics)
  } else {
    rafId = null
  }
}

function onContentScroll() {
  if (!contentEl.value) return
  const currentScrollTop = contentEl.value.scrollTop
  
  // Compute momentum shift based on scroll step delta
  const delta = currentScrollTop - lastScrollTop
  lastScrollTop = currentScrollTop

  // Exaggerate displacement offset based on scroll energy
  targetY = Math.max(-40, Math.min(40, targetY - delta * 0.25))
  // Snap baseline target back smoothly towards 0 when idling
  setTimeout(() => { targetY = 0 }, 50)

  if (!rafId) {
    rafId = requestAnimationFrame(updatePhysics)
  }

  // Native highlight section intersection check
  const sectionIds = NAV.flatMap(s => s.items.map(i => i.id))
  for (const id of [...sectionIds].reverse()) {
    const el = document.getElementById(id)
    if (el && el.getBoundingClientRect().top < 220) { // Bumped up target tracking line for the 80px shift
      activeSection.value = id
      break
    }
  }
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    // Add an initial spring pop down before smoothly traveling
    targetY = -35
    if (!rafId) rafId = requestAnimationFrame(updatePhysics)
    
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ── Search & autohint ─────────────────────────────────────────────────────────

interface DocHint { id: string; section: string; title: string; text: string }

const DOC_INDEX: DocHint[] = [
  { id: 'what-is',         section: 'Getting Started', title: 'What is Exotopia?',     text: 'exoplanet virtual land nft community eco-ops field work nasa catalog' },
  { id: 'new-user',        section: 'Getting Started', title: 'Quickstart',             text: 'new user wallet onboard first mint testnet polygon celo' },
  { id: 'free-platform',   section: 'Getting Started', title: '99/0.75/0.25 Model',          text: 'fee model resonance split creator platform free zero percent aftermarket' },
  { id: 'cosmic-view',     section: 'Visualization',   title: 'Cosmic Web & Voids',     text: 'laniakea void bootes local sculptor supercluster filament dark energy blob timular' },
  { id: 'galaxy-clusters', section: 'Visualization',   title: 'Galaxy Clusters & LOD', text: 'lod level detail cluster virgo coma norma xray morphology elliptical spiral' },
  { id: 'system-view',     section: 'Visualization',   title: 'Star Systems',           text: 'planet orbit multiplanet multimoon lagrange l4 l5 camera co-orbit' },
  { id: 'settlement-surfaces', section: 'Visualization', title: 'Settlement Surfaces', text: 'dome surface stone circle xray dkmat dark matter pyramid exoplanet ground' },
  { id: 'exolocation',     section: 'Protocol',        title: 'Exolocation Addresses', text: 'coordinate system trophic level sublunary syzygy liminal exo-surface-v1 lagrange' },
  { id: 'sunlight-nft',    section: 'Protocol',        title: '$SUNLIGHT NFT',         text: 'sound music creative recording polygon license royalty bars' },
  { id: 'art-tokens',      section: 'Protocol',        title: 'ART Tokens',            text: 'activity reward eco-ops sponsor water farm field work token resellable' },
  { id: 'robot-mule',      section: 'Protocol',        title: 'mule-bot',         text: 'mule ai local corpus sovereign knowledge assistant settlement specialist domain' },
  { id: 'glossary-section',section: 'Glossary',        title: 'Key Terms',             text: 'glossary definitions terms protocol trophic astronomy settlement nft' },
  { id: 'polygon',         section: 'Networks',        title: 'Polygon Amoy',          text: 'polygon matic amoy testnet chainid 80002 metamask rpc faucet evm' },
  { id: 'celo',            section: 'Networks',        title: 'Celo Alfajores',        text: 'celo alfajores testnet chainid 44787 valora mpesa east africa mobile wallet' },
  { id: 'algorand',        section: 'Networks',        title: 'Algorand',              text: 'algorand arc3 arc69 arc nft metadata ipfs on-chain' },
  { id: 'catalogs',        section: 'Data',            title: 'Catalog Sources',       text: 'nasa exoplanet archive xmm newton takey hyg virgo vcc fcc rc3 laniakea' },
  { id: 'data-gaps',       section: 'Data',            title: 'Known Gaps',            text: 'missing distance sy_dist null coverage gap southern hemisphere moon data' },
  { id: 'game-theory',     section: 'Specs',           title: 'Game Theory',           text: 'drk-e qnt-p dark energy positron timular blob quantum void cluster' },
  { id: 'security-model',  section: 'Specs',           title: 'Wallet Security',       text: 'scrypt encryption indexeddb browser wallet mnemonic seed phrase anti-phishing' },
  { id: 'settlement-hashmark', section: 'Specs',       title: 'Settlement Hashmark',   text: 'sha256 hash quilt design signature dome stone circle reconstruction' },
  { id: 'field-recording', section: 'Specs',           title: 'Field Recording',       text: 'audio microphone record mediarecorder indexeddb local storage voice' },
  { id: 'coordinate-math', section: 'Specs',           title: 'Coordinate Maths',      text: 'ra dec parsec mpc scene units l4 companion orbit tangent normal' },
  { id: 'security-section',     section: 'Security', title: 'Security Overview',          text: 'security nft wallet smart contract vulnerability cve bulletin disclosure' },
  { id: 'cve-bulletin',         section: 'Security', title: 'Security Bulletin',          text: 'cve bulletin community art token disbursement contributors verifier curator submitter' },
  { id: 'smart-contract-risks', section: 'Security', title: 'Smart Contract Risks',       text: 'reentrancy front-running mev sandwich attack honeypot rug pull phishing address poisoning cwe' },
  { id: 'api-security',         section: 'Security', title: 'API & mule-bot Security',    text: 'cors rate limiting jwt signature settlement auth mule-bot local node' },
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

// ── Key glossary terms (abbreviated for docs index) ───────────────────────────

const KEY_TERMS = [
  { id:  1,  term: 'STN',           short: 'Station Number — prefix for Orbital Station announcement IDs (STN-001…).' },
  { id:  3,  term: 'EXOLOC',        short: 'The exo- namespace for all virtual property addresses.' },
  { id:  6,  term: 'Trophic Level', short: 'A settlement\'s position in the gravitational hierarchy of a star system (L1–L6).' },
  { id: 10,  term: 'L4 SUBLUNARY',  short: 'Trophic level 4 — on the surface of a moon. Coordinate system: exo-moon-surface-v1.' },
  { id: 11,  term: 'L5 SYZYGY',     short: 'Trophic level 5 — at a moon–planet Lagrange equilibrium point.' },
  { id: 24,  term: 'Exolocation',   short: 'Permanent on-chain address anchoring a settlement to a specific location on an exoplanet.' },
  { id: 29,  term: 'Stone Circle',  short: 'Cultural landmark at the centre of each settlement. Marks cardinal directions and carries the intention statement.' },
  { id: 31,  term: 'Resonance Split', short: '99 / 0.75 / 0.25 — 100% to creator. Platform is free and self-optimising.' },
  { id: 40,  term: 'PON INK',       short: 'Primary operations portal for the SCD Hub — records every action on-chain.' },
  { id: 41,  term: 'SCD Hub',       short: 'Sustainable Community Development Hub — US non-profit building digital infrastructure for community resilience.' },
  { id: 42,  term: 'E8 Coxeter Lattice', short: 'Mathematical basis for the wormhole conduit network transit routing geometry.' },
  { id: 45,  term: 'Hub Approvideo', short: 'SCD Hub curated video resource library — maintained by mule-bot.' },
]

const CATALOG_ROWS = [
  { name: 'NASA Exoplanet Archive (viz set)',  count: '6,158 planets',   use: 'Galaxy star-system sprites, surface views, addressing' },
  { name: 'XMM-Newton Takey2013 X-ray',       count: '345 clusters',    use: 'Cosmic view cluster sprites, LOD galaxy fields' },
  { name: 'HYG Star Database v4.1',            count: '119,626 stars',   use: 'Cluster foreground star fields, stellar physics' },
  { name: 'Virgo Cluster Catalog (VCC)',        count: '2,096 galaxies',  use: 'Virgo LOD 2/3 galaxy morphology field' },
  { name: 'Fornax Cluster Catalog (FCC)',       count: '340 galaxies',    use: 'Fornax LOD 2/3 galaxy field' },
  { name: 'Third Reference Catalogue (RC3)',    count: '23,022 galaxies', use: 'LOD 3 galaxy structure parameters' },
]

onMounted(() => {
  const hash = route.hash?.slice(1)
  if (hash) setTimeout(() => scrollTo(hash), 300)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
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
  position: fixed; /* Keep header pinned cleanly at the absolute top */
  top: 0; 
  left: 0; 
  right: 0; 
  z-index: 100;
}

.dp-home-link {
  display: flex; 
  align-items: baseline; 
  gap: 2px; 
  text-decoration: none;
  font-size: 12px; 
  font-weight: 300; 
  letter-spacing: 0.16em; 
  flex-shrink: 0;
  transition: opacity 0.12s;
}
.dp-home-link:hover { opacity: 0.75; }
.dp-home-exo   { color: #4dd0e1; }
.dp-home-topia { color: #90a4ae; }
.dp-home-arrow { color: rgba(80, 160, 200, 0.50); font-size: 10px; margin-left: 3px; }

.dp-topbar-title { font-size: 9px; letter-spacing: 0.18em; color: rgba(80, 140, 180, 0.50); flex: 1; }

.dp-search-wrap { position: relative; }
.dp-hints {
  position: absolute; 
  top: calc(100% + 4px); 
  right: 0; 
  left: 0;
  background: rgba(1, 6, 22, 0.99); 
  border: 1px solid rgba(0, 140, 200, 0.28);
  border-radius: 5px; 
  z-index: 200; 
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.70);
}
.dp-hint {
  display: flex; 
  align-items: baseline; 
  gap: 10px;
  padding: 7px 12px; 
  cursor: pointer; 
  font-size: 9.5px;
  border-bottom: 1px solid rgba(0, 60, 100, 0.18);
  transition: background 0.10s;
}
.dp-hint:last-child { border-bottom: none; }
.dp-hint:hover, .dp-hint--active { background: rgba(0, 40, 80, 0.55); }
.dp-hint__cat   { font-size: 7.5px; letter-spacing: 0.10em; color: rgba(0, 180, 220, 0.55); min-width: 80px; }
.dp-hint__title { color: rgba(180, 220, 245, 0.85); }

/* ── Layout & Responsive Mobile Properties ────────────────────────────────── */
.dp-layout { 
  display: flex; 
  flex: 1; 
  /* REMOVED: overflow: hidden; -> Let the entire layout frame stretch down naturally */
}

/* Clear exactly 80px beneath header and allow layout frame to extend naturally */
.dp-layout-offset {
  margin-top: 80px; 
  min-height: calc(100vh - 80px); /* Changed from fixed height to min-height */
}

@media (max-width: 768px) {
  .dp-layout-offset {
    flex-direction: column; 
  }
  .dp-nav {
    width: 100% !important;
    max-height: none !important;
    position: relative !important;
    top: 0 !important;
    border-right: none !important;
    border-bottom: 1px solid rgba(0, 70, 120, 0.20);
    padding: 10px 0 !important;
  }
  .dp-content {
    padding: 20px !important;
  }
}

/* ── Left nav ─────────────────────────────────────────────────────────────── */
.dp-nav {
  width: 220px; 
  flex-shrink: 0;
  background: rgba(0, 4, 14, 0.90); 
  border-right: 1px solid rgba(0, 70, 120, 0.20);
  padding: 12px 0 40px;
  
  /* REPAIR FIX: Sticky track within the viewport as the page scrolls down */
  position: sticky;
  top: 80px; /* Aligns with your 80px layout offset boundary */
  max-height: calc(100vh - 100px); /* Keeps internal navigation view constrained to screen space */
  overflow-y: auto; /* If nav contents overflow, they can scroll internally, but it tracks perfectly */
  
  scrollbar-width: thin; 
  scrollbar-color: rgba(0, 100, 160, 0.20) transparent;
  will-change: transform; 
}

.dp-nav-section-head {
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  padding: 7px 14px; 
  cursor: pointer; 
  font-size: 9px; 
  letter-spacing: 0.12em;
  color: rgba(0, 200, 240, 0.60); 
  font-weight: 600;
  transition: color 0.12s;
  user-select: none;
}
.dp-nav-section-head:hover { color: rgba(0, 220, 255, 0.82); }

.dp-nav-items { display: flex; flex-direction: column; padding-bottom: 6px; }
.dp-nav-item {
  padding: 5px 14px 5px 22px; 
  font-size: 9px; 
  color: rgba(120, 175, 215, 0.65);
  cursor: pointer; 
  text-decoration: none; 
  display: block;
  transition: background 0.10s, color 0.10s; 
  border-radius: 0;
  letter-spacing: 0.03em;
}
.dp-nav-item:hover { background: rgba(0, 30, 70, 0.55); color: rgba(0, 220, 255, 0.85); }
.dp-nav-item--active { 
  color: rgba(0, 220, 255, 0.90); 
  background: rgba(0, 40, 90, 0.45); 
  border-left: 2px solid rgba(0, 200, 255, 0.50); 
  padding-left: 20px; 
}

/* ── Content ──────────────────────────────────────────────────────────────── */
.dp-content {
  flex: 1; 
  padding: 32px 48px 80px;
  /* REPAIR FIX: Removed absolute overflow-y container tracking. Content now unrolls naturally. */
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

/* Glossary mini-grid */
.dp-gloss-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 8px; }
.dp-gloss-item { background: rgba(0, 8, 22, 0.70); border: 1px solid rgba(0, 70, 120, 0.18); border-radius: 4px; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
.dp-gloss-num  { font-size: 7px; letter-spacing: 0.14em; color: rgba(0, 180, 220, 0.45); }
.dp-gloss-term { font-size: 10.5px; font-weight: 600; color: rgba(190, 225, 250, 0.88); }
.dp-gloss-short { font-size: 8.5px; color: rgba(110, 165, 205, 0.62); line-height: 1.55; }
</style>



