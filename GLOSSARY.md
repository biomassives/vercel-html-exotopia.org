# EXOTOPIA / PON INK — GLOSSARY
**SCD Hub · Living document · GPL v3**

Numbered entries are the canonical reference for footnotes across all platform documents.
In body text use superscript notation: `sublunary⁶` links to entry [6] below.

---

## INDEX

**Protocol Identifiers**
[1] STN · [2] STA · [3] EXOLOC · [4] ARC-3 / ARC-69 · [5] cNFT

**Trophic Hierarchy**
[6] Trophic Level · [7] L1 STELLAR · [8] L2 PLANETARY · [9] L3 LUNAR · [10] L4 SUBLUNARY · [11] L5 SYZYGY · [12] L6 LIMINAL

**Astronomical Terms**
[13] Sublunary · [14] Syzygy · [15] Liminal · [16] Hill Sphere · [17] Roche Limit · [18] Tidal Lock · [19] Lagrange Points · [20] Barycentre · [21] Equilibrium Temperature · [22] Circumbinary (P-type / S-type) · [23] Forbidden Zone

**Settlement & Governance**
[24] Exolocation · [25] Settlement Dome · [26] mule-bot · [27] Eco-ops · [28] 40 Acres · [29] Stone Circle · [30] Ecommunity DAO · [31] Resonance Split

**NFT & Chain**
[32] $SUNLIGHT · [33] Water Quality Certificate · [34] Health Card ID · [35] POAP · [36] EcocitySolution NFT · [37] Station Core · [38] Station Module · [39] Exolocation NFT

**Protocol & Platform**
[40] PON INK · [41] SCD Hub · [42] E8 Coxeter Lattice · [43] DefenderNav · [44] Wormhole Conduit · [45] Hub Approvideo · [46] Resonance Split (see [31])

**API**
[47] REST Endpoint · [48] Exolocation Path Encoding · [49] CORS · [50] Rate Limiting · [51] OpenAPI / Swagger

**Security**
[52] CVE · [53] CWE · [54] CVSS · [55] Reentrancy Attack · [56] Front-running / MEV · [57] Honeypot Contract · [58] Rug Pull · [59] Phishing / Address Poisoning · [60] Exotopia Security Bulletin · [61] Responsible Disclosure

---

## DEFINITIONS

---

### PROTOCOL IDENTIFIERS

**[1] STN** — *Station Number*
The three-letter prefix used in Orbital Station announcement IDs (`STN-001` through `STN-019`). Each announcement is a message from a named station in the network. Mirrors the on-chain `StationRecord.stationId` field (prefixed `STA`), shortened to `STN` for compact display in the monospace UI.
→ See [2] STA, [37] Station Core

**[2] STA** — *Station*
The prefix used in on-chain Station Core NFT identifiers (e.g. `STA-0001`). Unique within the PON INK ecosystem. Once minted on Solana, the ID is permanent.
→ See [37] Station Core

**[3] EXOLOC** — *Exolocation address prefix*
The `exo-` namespace used as internal scope aliases within virtual property addresses. Canonical format is `exotopia:{scope}:{path}` (e.g. `exotopia:surface:kepler-442/kepler-442b/aurora-basin`) — see `SPEC_EXOLOC_ADDRESS.md`. Six coordinate systems are currently defined: `exo-surface-v1`, `exo-orbital-v1`, `exo-lunar-orbital-v1`, `exo-stellar-orbital-v1`, `exo-moon-surface-v1`, `exo-moon-lagrange-v1`, `exo-moon-interface-v1`.
→ See [24] Exolocation, [6] Trophic Level

**[4] ARC-3 / ARC-69** — *Algorand Request for Comment*
Two complementary NFT metadata standards on the Algorand blockchain. ARC-3 stores rich JSON metadata off-chain (typically on IPFS), referenced by the ASA URL field. ARC-69 stores compact identifying metadata directly in the on-chain note field (≤ 1 KB). Relevant only to pon.ink's optional Exolocation NFT wrapper (`SPEC_PON_INK.md`) — not used by the core Exotopia address system, which is local-first (see [24]).

**[5] cNFT** — *Compressed NFT (Solana Metaplex Bubblegum)*
A Solana NFT standard that stores token data in a Merkle tree rather than individual accounts. Reduces mint cost from ~0.01 SOL to ~0.000005 SOL, enabling large-scale community airdrops. Used for Station Core, Station Module, and EcocitySolution NFTs.

---

### TROPHIC HIERARCHY

**[6] Trophic Level**
From Greek *τροφή* (trophē, nourishment). In ecology, a trophic level describes an organism's position in the food chain — energy flows from producers through consumers. In Exotopia, the term is borrowed to describe a settlement's position in the gravitational and energetic hierarchy of a star system. Higher levels are further from the primary energy source (the star); lower numbers denote proximity. The metaphor captures both spatial position and the dependency relationships between levels.

**[7] L1 STELLAR**
The outermost trophic level — orbital zones around the host star itself. Coordinate system: `exo-stellar-orbital-v1`. High-energy environment; extreme engineering requirements. Primary energy source for all lower levels.

**[8] L2 PLANETARY**
Settlement on or in orbit around a confirmed exoplanet. The most common settlement tier. Coordinate systems: `exo-surface-v1` (surface polygon) and `exo-orbital-v1` (altitude band). The main tier addressed by the NASA Exoplanet Archive data.

**[9] L3 LUNAR**
In orbit around a moon of an exoplanet. Coordinate system: `exo-lunar-orbital-v1`. The reference body is the moon itself. Parent planet provides tidal heating and visual dominance of the sky.

**[10] L4 SUBLUNARY** ¹³
*On the surface of a moon.* Coordinate system: `exo-moon-surface-v1`. The parent planet dominates the sky. Tidal heating may provide subsurface liquid water (Europa-type). Tidally locked moons have a permanent planet-facing side and a permanent far side; the terminator zone is most habitable.
→ See [13] Sublunary, [18] Tidal Lock

**[11] L5 SYZYGY** ¹⁴
*At a Lagrange equilibrium point of the moon–planet system.* Coordinate system: `exo-moon-lagrange-v1`. Four points are available: L1 (inner gateway, unstable), L2 (outer observatory, unstable), L4 (leading trojan, stable), L5 (trailing trojan, stable). L4 and L5 accumulate material naturally and require no station-keeping thrust.
→ See [14] Syzygy, [19] Lagrange Points

**[12] L6 LIMINAL** ¹⁵
*In the transition zone between a moon's gravitational dominance and its parent planet's.* Coordinate system: `exo-moon-interface-v1`. Five zone types: Hill sphere boundary, Roche limit zone, tidal-lock transition, magnetosphere interface, and orbital resonance zone. The most exotic and engineering-intensive settlement tier.
→ See [15] Liminal, [16] Hill Sphere, [17] Roche Limit

---

### ASTRONOMICAL TERMS

**[13] Sublunary**
From Latin *sub* (below) + *luna* (moon). In Aristotelian cosmology, the sublunary realm was the region between Earth and the Moon — the zone of change, imperfection, and mortality, as opposed to the perfect eternal celestial spheres above. In Exotopia, the term is repurposed: SUBLUNARY (L4) describes the condition of being *on* a moon's surface — below the moon's sky, subject to its gravity and its parent planet's influence.

**[14] Syzygy**
From Greek *syzygía* (union, yoke). In astronomy, syzygy is the alignment of three or more celestial bodies — most commonly the Sun, Earth, and Moon at new or full moon. In Exotopia, SYZYGY (L5) refers to the gravitational balance points of the moon–planet system: the Lagrange points where the gravitational pulls of both bodies combine to create stable or semi-stable equilibrium positions.

**[15] Liminal**
From Latin *limen* (threshold, doorway). A liminal space is a transitional zone — between states, between territories, between conditions. In Exotopia, LIMINAL (L6) describes the boundary region between a moon's gravitational sphere of influence and its parent planet's — neither fully one nor the other, requiring careful navigation and specialist engineering.

**[16] Hill Sphere**
The region around a celestial body within which its gravitational pull dominates over the tidal forces of the primary body. Radius: `r_H = a × ∛(m / 3M)` where `a` is the orbital radius, `m` is the smaller body's mass, and `M` is the primary's mass. A moon can only retain natural satellites within its Hill sphere. The Hill sphere boundary is a key feature of the L6 LIMINAL zone.

**[17] Roche Limit**
The minimum distance from a primary body at which tidal forces exceed a satellite's self-gravity, preventing the formation of a coherent object. For a fluid body: `d = 2.44 × R_primary × ∛(ρ_primary / ρ_satellite)`. Named after Édouard Roche (1850). Within the Roche limit, moons cannot form; rings do. The Roche limit zone is one of the L6 LIMINAL interface types.

**[18] Tidal Lock**
Synchronous rotation in which a body's orbital period exactly equals its rotational period, causing one face to permanently point toward the primary. Most inner moons in the solar system are tidally locked (the Moon always shows one face to Earth). Tidally locked planets in habitable zones have permanent day and night hemispheres; the terminator — the line between them — is the most habitable region.

**[19] Lagrange Points**
Five points in a two-body orbital system where a small object can maintain a stable or semi-stable position relative to both bodies. Named after Joseph-Louis Lagrange (1772). L1, L2, L3 are unstable (require active station-keeping). L4 and L5 are stable (trojan points, 60° ahead and behind the smaller body). In the moon–planet system, L4 and L5 are the viable permanent settlement positions.

**[20] Barycentre**
The centre of mass of a two-body (or multi-body) system, around which both bodies orbit. In a binary star system, the barycentre may lie outside either star. In the DefenderNav, camera distance and angle are computed relative to the system barycentre rather than the primary star.

**[21] Equilibrium Temperature**
(`pl_eqt` in the NASA Exoplanet Archive.) The theoretical surface temperature of a planet if it were a perfect blackbody with no atmosphere, computed from stellar luminosity and orbital distance: `T_eq = T_star × √(R_star / 2a) × (1-A)^0.25` where A is albedo. Used in Exotopia to determine zone classification and surface palette.

**[22] Circumbinary / P-type / S-type**
*P-type* (planet-type, or circumbinary): a planet that orbits *both* stars of a binary system, outside both. *S-type* (star-type, or circumstellar): a planet that orbits *one* star of a binary system. Kepler-16b is a famous P-type; most binary-system planets are S-type. The DefenderNav's forbidden zone (red-amber hatching) marks the dynamically unstable region inside P-type circumbinary systems.

**[23] Forbidden Zone**
In a circumbinary system, the region around the stellar barycentre within approximately 2–4× the binary separation where planetary orbits are dynamically unstable due to gravitational perturbations. No stable planet can form or survive here. Rendered as a diagonal-hatched red-amber band in the DefenderNav system strip.

---

### SETTLEMENT & GOVERNANCE

**[24] Exolocation**
A permanent, local-first address anchoring a virtual settlement to a specific location in the NASA Exoplanet Archive — computed from real astronomical data and stored on the owner's own device, no wallet or blockchain required (optional IPFS pinning for durability). Canonical format: `exotopia:{scope}:{path}` (e.g. `exotopia:surface:kepler-442/kepler-442b/aurora-basin`) — see `SPEC_EXOLOC_ADDRESS.md`. Six coordinate systems support six trophic levels. Owners who want to mint a tradeable NFT deed of their exolocation can optionally do so through pon.ink — see [39] Exolocation NFT — but it is not required to own or use a settlement.

**[25] Settlement Dome**
The primary physical structure of a Level 4/5 settlement in Exotopia. A geodesic hemisphere containing the library building, water feature, food production, vegetation, and the stone circle. The dome is the visible landmark of a community's presence on an exoplanet surface.

**[26] mule-bot**
An AI-powered knowledge assistant living in the settlement gallery. In V1, corpus-driven — speaks in the owner's words, assembled from items added to the knowledge base. In V2, a land-connected, replicable, programmable electronic mule — Natural & Regenerative Land Care Specialist. Tracks your $SUNLIGHT earnings, plans eco-ops participation for maximum rewards, curates your Hub Approvideo feed, helps build the settlement, and bridges virtual activity to real-world earth care recognition. Local-network only — no cloud, no LLM, corpus stays sovereign..
→ See STN-015, STN-019, blog-mule-v2-specialist.md

**[27] Eco-ops**
Short for *ecological operations*. The check-in protocol connecting real-world community field work to tamper-evident records (Supabase + IPFS, see §6.3/§21.2 of `SPEC.md`) and virtual rewards. Eight activity types: `wqMap` (water quality), `garbageMap`, `farmMap`, `productMap`, `transportMap`, `storageMap`, `sourceMap`, `cleaningMap`.

**[28] 40 Acres**
*"40 acres and a mule"* — a reference to the unfulfilled 1865 promise of land redistribution to freed enslaved people in the United States. In Exotopia, 40 virtual acres is the standard land claim unit attached to a settlement's exolocation address (see [24]) — free, local-first, no NFT required. An optional NFT deed can be minted via pon.ink (see [39]). The mule is the mule-bot — the knowledge assistant that comes with the settlement.

**[29] Stone Circle**
The cultural landmark placed at the centre of each settlement in Exotopia. Marks the settlement's cardinal directions, functions as a time capsule, and carries the community's intention statement. The spiral pattern and standing stone heights are seeded from the settlement's hostname. The E8 Pyramid (wormhole access point) is hidden inside the stone circle, visible only in DK.MAT (dark matter) view mode.

**[30] Ecommunity DAO**
The self-evolving governance layer for settlement collectives in Exotopia. Principles: privacy by design, anti-harassment enforcement with community-controlled moderation, collective direction of technology resources toward local Earth-based projects. In the core distro this is community-controlled moderation, not token-based. A token-weighted voting variant (governance tokens earned through participation, facilitation, and mentorship) is a `SPEC_WORLDBRIDGER_ONE.md` integration, not core.

**[31] Resonance Split**
The standard fee allocation applied to transactions through the PON INK / Exotopia / Ecocity / Worldbridger network — implemented in `src/lib/resonance-split.ts`, the single source of truth. Always displayed before confirmation; never combined in a single expression with community payout amounts (fee isolation rule). Three paths, computed independently: Artist/participant wallet (direct creator compensation), Community Hardware Fund (WATSAN / mapping / field infrastructure), and Platform Maintenance (network ops, security, hosting). Current percentages are defined only in `resonance-split.ts` — its own header comment states the rule explicitly ("do not inline percentages anywhere, including in copy") after five inconsistent hardcoded copies of this split once existed across the app; this entry intentionally doesn't restate a number for the same reason.

In the core Exotopia distro the split is a general-purpose, non-chain contribution-allocation calculation (used by the IPFS-pinning/settlement-support model, not minting). Special mintings and airdrop events on pon.ink may use different parameters via additional contracts; any custom split there requires Group Manager + Admin co-sign and is logged in the `payment_splits_ledger`.

---

### NFT & CHAIN

*Every entry in this section describes pon.ink / Worldbridger One's optional monetization layer (see `SPEC.md` §26). None of these tokens are required to create, own, personalize, or use a settlement in the core Exotopia distro.*

**[32] $SUNLIGHT**
Sound / music NFT standard in the PON INK protocol. Represents ownership and licensing rights to a recorded track or soundbank. Minted on Polygon or Solana. Includes: title, duration, BPM, key, genre, sample credits, license terms, collaboration credits, and IPFS audio CID. Royalty enforcement is on-chain.

**[33] Water Quality Certificate**
The core distro's actual certification mechanism is the Supabase-backed ledger certificate described in `SPEC.md` §21.2/§24.1 (fields: pH, turbidity (NTU), conductivity (µS/cm), nitrate (mg/L), coliform (CFU/100mL), GPS coordinates, timestamp, potability assessment; tamper-evident via Supabase + IPFS). An on-chain NFT version (Polygon, Arweave-backed) is available as an optional pon.ink wrapper, not the certification itself. Feeds the mule-bot's community water system health domain.

**[34] Health Card ID**
Decentralised health credential on Polygon. Encrypted. Portable to employers and health systems independent of the SCD Hub platform.

**[35] POAP**
*Proof of Attendance Protocol.* Event participation proof used for voting weight in pon.ink/Worldbridger One governance and for event coordination. Multi-chain.

**[36] EcocitySolution NFT**
A collectible virtual object (displayable in the settlement dome) that also certifies learning, construction, or support of a real-world sustainable design. Categories: WATSAN, ENERGY, SHELTER, HEALTHCARE, FOOD. Each object has a 3D GLTF model reference (< 5,000 triangles), impact metrics, and an origin path (earned / airdropped / purchased). Minted on Solana via Metaplex Bubblegum.

**[37] Station Core**
pon.ink's optional on-chain infrastructure record: a named Solana NFT anchoring a station to a specific exoplanet location, containing the Exolocation reference and a map of installed module mint addresses. Not required to create, own, or run a working settlement — the core settlement needs no Station Core. Identifier prefix: `STA`.

**[38] Station Module**
A functional zone within an optional pon.ink Station Core — gallery, watsan, energy, shelter, healthcare, food, or command. Each module is a separate Solana cNFT minted independently. Modules can be added over time. Like the Station Core itself, this belongs to the optional monetization layer, not a requirement for a core settlement.

**[39] Exolocation NFT**
pon.ink's optional NFT wrapper around a settlement's exolocation address (see `SPEC_PON_INK.md`) — an Algorand ARC-3 / ARC-69 NFT encoding the full exolocation address, coordinate system, reference body, boundary descriptor, and owner attribution. Not required to own or use a settlement; the exolocation address itself (see [24]) is local-first and free. Free to mint if used (network gas only). Secondary sales apply the Resonance Split.

---

### PROTOCOL & PLATFORM

**[40] PON INK**
*"Put it on ink."* The primary operations portal for the optional pon.ink / Worldbridger One monetization layer (see `SPEC.md` §26) — the daily-use tool for artists, field workers, and community builders who choose to use it. Every action taken through it (check-in, performance, water quality reading, sale) is permanently recorded on-chain. Hosts: sound tools, cultural events, M-Pesa / Stripe payments, NFT minting, airdrop campaigns, and user dashboards. Not required to create, own, or use a core Exotopia settlement.

**[41] SCD Hub**
*Sustainable Community Development Hub.* US non-profit dedicated to improving lives through mentor networks in environmental engineering, community resilience, reliable income, and capacity development. The Exotopia, pon.ink, and ecocity.com platforms are the SCD Hub's digital infrastructure.

**[42] E8 Coxeter Lattice**
A root system in 8-dimensional space with 240 roots and exceptional symmetry properties. In Exotopia, the E8 lattice is the mathematical basis for the wormhole conduit network — the transit routing geometry that connects settlements across the cosmic web. The E8 mandala is displayed during the 7-second portal animation.

**[43] DefenderNav**
The persistent horizontal minimap strip at the bottom of every page in Exotopia, inspired by the 1981 Williams Electronics arcade game *Defender*. Shows the full spatial context of the current view — orbital plane, 360° sky horizon, or cosmic web XZ projection. Three modes: `system`, `surface`, `cosmic`. Controls: view mode pills (NAT / X-RAY / DK.MAT), event finder, collapse toggle.

**[44] Wormhole Conduit**
A transit node placed at the periphery of a great cosmic void in the large-scale structure of the universe — the E8 lattice routing point for long-distance settlement transit. Visible in the cosmic view as a pulsing cyan tetrahedron. In DK.MAT (dark matter) view mode, the E8 Pyramid in settlements becomes visible, revealing the local entry point to the conduit network.

**[45] Hub Approvideo**
The SCD Hub's curated video resource library. Maintained by the mule-bot as one of its land care specialist domains — new materials surfaced, outdated content flagged, existing catalogue kept organised and findable for field communities.

---

### API

**[47] REST Endpoint**
A URL that identifies a single resource and responds to standard HTTP verbs (GET, POST, PATCH, DELETE). In the mule-bot API, every endpoint is settlement-scoped: the exolocation address forms the URL path. `GET` is always read-only; `POST` creates or submits. Example: `GET /mulebot/v1/exo-surface-v1/Kepler-442b/15N%2C23W/earnings/` returns token earnings for that settlement without side effects.
→ See [48] Exolocation Path Encoding, [50] Rate Limiting

**[48] Exolocation Path Encoding**
The rule for converting an exolocation address string into a mule-bot API URL path. The address (e.g. `exo-surface-v1:Kepler-442b:15N,23W`) is split on `:` to produce three URL segments; the location segment is percent-encoded, with commas → `%2C`. Result: `/mulebot/v1/exo-surface-v1/Kepler-442b/15N%2C23W`. Colons become path separators; no segment is ever left raw.
→ See [3] EXOLOC, [47] REST Endpoint

**[49] CORS — Cross-Origin Resource Sharing**
A browser security policy that blocks a web page from making fetch requests to a different origin (host:port) than the one that served it. Relevant to Exotopia because the mule-bot node runs at `localhost:8888` while the app is served from a different origin. Solution: the mule-bot node must emit `Access-Control-Allow-Origin: *` (or the app origin) on all responses, or the app uses a same-origin proxy.
→ See [47] REST Endpoint

**[50] Rate Limiting**
A cap on how many requests a client can make within a time window. The mule-bot API enforces: eco-ops submissions max 10/hour per settlement (to prevent corpus spam and on-chain queue flooding). Exceeded limit returns HTTP 429 Too Many Requests with a `Retry-After` header. The limit is per wallet address, not per IP, because the node may serve multiple clients from the same NAT.
→ See [47] REST Endpoint, [27] Eco-ops

**[51] OpenAPI / Swagger**
A machine-readable YAML/JSON contract that describes an API's endpoints, parameters, and response shapes. Enables auto-generated documentation, client SDKs, and server stubs. The mule-bot API will publish an OpenAPI 3.1 spec at `/mulebot/.well-known/openapi.yaml` in Phase 2 — allowing any developer in the federation to generate a typed client for their language without reading the spec manually.
→ See [47] REST Endpoint, SPEC_MULEBOT_API.md

---

### SECURITY

**[52] CVE — Common Vulnerabilities and Exposures**
A globally unique identifier (format: `CVE-YEAR-NUMBER`) assigned by MITRE to a publicly disclosed software vulnerability. The CVE Program is the backbone of the global vulnerability management ecosystem — operating systems, library maintainers, and security tools all reference CVE IDs. The program went through significant governance disruption in 2025 (CISA funding uncertainty → CVE Foundation formed). Exotopia tracks CVEs filtered for NFT-stack relevance: EVM clients, smart contract libraries, wallet software, and IPFS.
→ See [53] CWE, [54] CVSS, [60] Exotopia Security Bulletin

**[53] CWE — Common Weakness Enumeration**
A taxonomy of software weakness *types* (as opposed to CVE's per-instance identifiers). Maintained by MITRE. Each CVE is linked to one or more CWEs. Key CWEs in the NFT/smart contract space: CWE-841 (improper enforcement of behavioral workflow — reentrancy), CWE-682 (incorrect calculation — integer overflow in Solidity pre-0.8), CWE-284 (improper access control — NFT transfer guards), CWE-20 (improper input validation — contract ABI boundary).
→ See [52] CVE, [55] Reentrancy Attack

**[54] CVSS — Common Vulnerability Scoring System**
A 0–10 numeric severity rating for a CVE: Critical (9–10), High (7–8.9), Medium (4–7), Low (0–3.9). Composed of a base score (exploitability, impact) plus optional temporal and environmental modifiers. In the Security Bulletin, the Exotopia team applies a second score — *NFT Impact Rating* — adjusting CVSS for smart-contract-specific context that the base score may not capture (e.g. a CVSS 5.3 ethers.js issue may be NFT-Critical if it affects signature verification).
→ See [52] CVE, [60] Exotopia Security Bulletin

**[55] Reentrancy Attack**
A class of smart contract exploit where a malicious contract calls back into the victim contract before the first call completes, allowing repeated withdrawal before balances are updated. Origin: the 2016 TheDAO hack (~$60M). Modern prevention: checks-effects-interactions pattern (update state before external calls), `ReentrancyGuard` from OpenZeppelin. Exotopia contracts use nonReentrant modifier on all value-transferring functions.
→ See [53] CWE, [56] Front-running

**[56] Front-running / MEV**
Miner/Maximal Extractable Value — value extracted by block producers (or bots watching the mempool) by inserting or reordering transactions. A sandwich attack wraps a victim's swap with a buy-before and sell-after, profiting from the price impact. NFT-specific MEV includes sniping mint transactions and reordering reveal transactions. Exotopia mints use commitment-reveal for anything random, and fixed-price minting eliminates most on-chain MEV surface.
→ See [55] Reentrancy Attack

**[57] Honeypot Contract**
A smart contract designed to appear exploitable (inviting attackers to deposit funds) while containing a hidden mechanism that traps the attacker's funds. Also used to describe contracts where buyers cannot resell (a hidden `require` blocks `transfer`). Detection: read contract source if verified; check token transfer history for asymmetry (many buys, no sells). The Security Bulletin flags unverified contract addresses affecting NFT collections.
→ See [58] Rug Pull

**[58] Rug Pull**
A project where the team withdraws liquidity or disappears with funds after building community and market cap. Distinct from an exploit: no vulnerability is used — the harm is by design. Two types: hard rug (instant total withdrawal) and soft rug (slow fund drain, abandoned roadmap). Risk mitigation: time-locked liquidity, multisig treasury, verified contract ownership renounced to community DAO. The Ecommunity DAO governance model is designed to make Exotopia soft-rug-resistant by design.
→ See [30] Ecommunity DAO, [57] Honeypot Contract

**[59] Phishing / Address Poisoning**
Phishing: social-engineering attack where a user is tricked into signing a transaction or entering their seed phrase on a fake site. Address poisoning: attacker sends a tiny transaction from an address that looks like a frequently-used address (matching first/last characters), hoping the victim copies it from transaction history. Prevention: bookmark trusted URLs, use anti-phishing word feature on browser wallet unlock, always verify full address before signing, never enter seed phrase in any web form.
→ See [25] Settlement Dome, [31] Resonance Split

**[60] Exotopia Security Bulletin**
A community-curated feed of CVEs and smart contract vulnerability disclosures filtered for NFT-creator and settlement-owner relevance. Published as a structured document series. Contributors earn ART tokens for submitting, verifying, and curating entries. The bulletin is a live test of the ART token disbursement mechanism: multi-role verification (Submitter → Verifier → Curator → Action-taker) mirrors the eco-ops check-in chain. Bulletins covering critical issues affecting Exotopia contracts are also minted as $SUNLIGHT NFTs — recording them as community knowledge artefacts.
→ See [32] $SUNLIGHT, [52] CVE, SPEC_SECURITY_BULLETIN.md

**[61] Responsible Disclosure**
The practice of reporting a security vulnerability privately to the affected project, allowing time to develop and deploy a fix before public disclosure. Standard embargo window: 90 days (Google Project Zero's policy, widely adopted). Exotopia accepts responsible disclosure reports via the SCD Hub contact address. Verified reporters receive ART token reward and attribution in the bulletin. CVEs affecting Exotopia contracts or dependencies are assessed within 48 hours of notification.
→ See [60] Exotopia Security Bulletin, [52] CVE

---

### ECOLOGY & EARTH SCIENCE

**[62] TEK — Traditional Ecological Knowledge**
The accumulated knowledge, practices, and beliefs about the relationships between living beings and their environment that has evolved through generations of observation, trial, and adaptation — and is passed on through cultural transmission rather than written records. TEK is not static or "folk" knowledge — it is dynamic, precise in its domains, and often validated by centuries of experimental practice. Examples: indigenous seasonal calendars that track rainfall, migration, and flowering to within days; soil classification systems that distinguish dozens of soil types with engineering accuracy; fish stock knowledge that precedes scientific monitoring by generations.
TEK is also called IEK (Indigenous Ecological Knowledge — see [63]) or LEK (Local Ecological Knowledge). In our certificate system, `eco:indigenous` is the certificate category; TEK is the knowledge domain being certified.
Protected under: UNDRIP Article 31 [148], CBD Nagoya Protocol, ILO C169 Article 15 [147].
→ See [63] IEK, [147] ILO C169, [148] UNDRIP, [149] FPIC

**[63] IEK — Indigenous Ecological Knowledge**
The term used in SCD Hub's certificate slugs (`eco:indigenous`) for what the academic literature calls TEK [62]. Preferred in some contexts because it foregrounds the *people* rather than the *tradition* — recognising that the knowledge is held and produced by specific communities with specific rights. The practical difference: TEK tends to be used in conservation biology and natural resource management literature; IEK is used in indigenous rights and cultural heritage contexts. Both refer to the same body of living knowledge.

**[64] Ecosystem Services**
The benefits that functioning ecosystems provide to people — often invisible until they are lost. Four categories defined by the Millennium Ecosystem Assessment (2005):
- *Provisioning services:* food, fresh water, timber, fibre, genetic resources
- *Regulating services:* climate regulation, flood control, water purification, pollination, disease regulation
- *Cultural services:* spiritual and religious values, recreation, aesthetic values, education
- *Supporting services:* soil formation, photosynthesis, nutrient cycling — the processes that underpin all others
Understanding ecosystem services is foundational for eco-ops field work: when a community documents a wetland, they are documenting provisioning + regulating services. When they map a sacred grove, they are documenting cultural services. These translate directly to the `eco:*` certificate domains.

**[65] Indicator Species**
A species whose presence, absence, abundance, or condition reflects the state of the ecosystem more broadly. Used in ecological monitoring because measuring one well-understood species is more practical than measuring everything.
Examples: mayfly larvae (clean fast-moving freshwater); lichen (clean air, low sulphur dioxide); mangrove coverage (coastal ecosystem health); vultures (functional large vertebrate community + no diclofenac poisoning of livestock). Our citizen science curriculum Module C6 uses freshwater macroinvertebrates [77] as water quality indicators — classic indicator species use.

**[66] Keystone Species**
A species with a disproportionately large ecological role relative to its abundance — remove it and the ecosystem structure changes significantly. Coined by ecologist Robert Paine (1969) from his starfish removal experiments. Classic examples: sea otters (control urchins that would otherwise strip kelp forests); wolves (trophic cascade effect on vegetation through fear of predation); figs (year-round fruit in tropical forests sustaining dozens of frugivore species). Relevant to eco:biodiversity field survey design — monitoring keystone species gives early warning of ecosystem-level change.

**[67] Trophic Cascade**
An indirect ecological effect propagated through a food web when a predator at the top affects the abundance of prey, which in turn affects the prey's food source, and so on down through the ecosystem. Wolf reintroduction in Yellowstone (1995) is the most-cited example: wolves → reduced elk grazing pressure → riverbank vegetation recovery → reduced erosion → changed river course. Understanding trophic cascades helps citizen scientists interpret unexpected changes in vegetation or water quality that seem disconnected from direct causes.

**[68] Phenology**
The study of cyclic and seasonal natural phenomena — when things happen in ecological time. The timing of first leaf emergence, first flowering, first breeding, first migration arrival and departure. These events are extraordinarily sensitive to temperature change and are among the most reliable early indicators of climate shift. Long-term phenological records are a major citizen science contribution: iNaturalist observations pinpointed to date and location build phenological datasets that no professional monitoring network could produce at scale. Our Climate domain Module C7 includes phenological observation as a core citizen science activity.

**[69] Biomass**
The total mass of living organisms in a given area or volume, usually expressed in grams per square metre (g/m²) or tonnes per hectare (t/ha). In ecology: total plant biomass reflects ecosystem productivity. In energy: organic material (crop residues, wood, animal waste) that can be burned or converted to biogas. In carbon accounting: aboveground + belowground plant biomass is the largest terrestrial carbon store and the primary target of reforestation carbon credits. Appears in Energy domain (biomass cookstoves, briquettes) and Restoration domain (vegetation recovery monitoring).

**[70] Carbon Sequestration**
The process by which carbon dioxide is removed from the atmosphere and stored in a carbon pool — soil organic matter, plant biomass, ocean water, rock. In the context of SCD Hub's eco-ops work: soil restoration and reforestation activities are forms of carbon sequestration. Measurement requires baseline and follow-up sampling. The `eco:soil` and `eco:restoration` certificate domains include carbon monitoring sub-domains. Key distinction: *sequestration* is the removal and storage; *sequestered carbon* can be released again if the soil is tilled or the tree is burned.

**[71] Watershed**
The land area that drains to a common point — a river, lake, or ocean outlet. Also called a catchment. Watershed boundaries are defined by topography (ridgelines), not political borders. Everything that happens on land within a watershed eventually affects the water quality at its outlet. Watershed thinking is fundamental to water monitoring: a polluted river is usually explained by activities upstream, often in a different administrative district. Our `eco:water` and `water:monitoring` sub-domains use watershed as the unit of analysis.

**[72] Aquifer**
An underground layer of water-bearing rock, sediment, or soil from which groundwater can be extracted. Two main types: *confined* (sealed between impermeable layers, often under pressure — artesian wells) and *unconfined* (recharged by rainfall percolating through above, the most common type for hand-dug wells). Aquifer depletion — when extraction exceeds recharge — is permanent on human timescales. Relevant to the `water:storage` and `water:monitoring` sub-domains: shallow well water quality is directly affected by what happens on the soil surface above the aquifer.

**[73] Turbidity**
A measure of the cloudiness or haziness of water caused by particles (silt, clay, algae, organic matter). Measured in Nephelometric Turbidity Units (NTU). WHO drinking water guideline: < 1 NTU for effective disinfection (chlorine and UV are much less effective in turbid water). Turbidity is the first field test run in WATSAN Module W7 because high turbidity signals that further treatment is needed before chemical disinfection will work. Measured with a turbidity tube (simple, field-portable, < $5) or electronic turbidimeter.

**[74] pH**
A logarithmic scale measuring the concentration of hydrogen ions in a solution — effectively, how acidic or alkaline it is. Scale: 0 (strongly acidic) to 14 (strongly alkaline), 7 is neutral. Safe drinking water range: 6.5–8.5 (WHO). Soil pH affects nutrient availability — most crops grow best between 6.0–7.0; highly acidic soils (< 5.5) limit phosphorus uptake and mobilise toxic aluminium. Field measurement: pH paper strips (low-cost, imprecise), or electronic pH meter (needs calibration). Appears in both water monitoring and soil assessment sub-domains.

**[75] Dissolved Oxygen (DO)**
The amount of oxygen dissolved in water, measured in mg/L or percentage saturation. Fish and most aquatic invertebrates require DO > 5 mg/L; below 3 mg/L is hypoxic (stressed ecosystem); below 1 mg/L is anoxic (dead zone). DO is reduced by: warm temperatures, excess nutrient loading (eutrophication), organic matter decomposition. A DO reading below 5 mg/L in a river or lake is a critical water quality signal. Measured with a DO meter or Winkler titration method in the field.

**[76] Coliform Bacteria**
A group of bacteria (including E. coli) used as indicators of faecal contamination in water. Their presence signals that pathogens (bacteria, viruses, protozoa) causing diarrhoeal disease may also be present. WHO standard: zero total coliforms in any 100 mL sample of treated drinking water. E. coli specifically indicates recent faecal contamination. Field detection: Petrifilm or DelAgua H₂S paper strips (incubate 24–48 hours at body temperature). One of the key tests in WATSAN curriculum Module W7.

**[77] Macroinvertebrates**
Invertebrate animals visible to the naked eye — insects (larvae and adults), worms, snails, crustaceans — living in freshwater ecosystems. Used as bioindicators of water quality because different species tolerate different levels of pollution. The BMWP score [78] is a standardised system for translating macroinvertebrate community composition into a water quality assessment. Sampling method: kick sampling (disturb stream substrate into a net downstream) or sweep sampling (sweep a net through vegetation). One of the most powerful and accessible citizen science water quality tools.

**[78] BMWP — Biological Monitoring Working Party Score**
A scoring system that assigns sensitivity values (1–10) to families of freshwater macroinvertebrates [77] based on their pollution tolerance. Low scores = pollution-tolerant (rat-tailed maggots score 1); high scores = pollution-sensitive (stonefly larvae score 10). The sum of all family scores present in a sample gives the BMWP score; higher total = cleaner water. Widely used in UK, East Africa, and Southeast Asia. Adapted versions exist for local taxa in most regions. A citizen scientist trained to identify macroinvertebrate families to order level can generate a BMWP score equivalent in quality to professional monitoring.

**[79] Albedo**
The fraction of solar radiation reflected by a surface — from 0 (perfect absorber, black body) to 1 (perfect reflector, mirror). Relevant in multiple domains:
- *Solar cooking:* black absorber plates have low albedo (absorb heat); polished reflectors have high albedo (focus light)
- *Climate science:* deforestation reduces surface albedo (dark forest → lighter soil/crop surface), affecting local temperature
- *Planetary science:* equilibrium temperature [21] formula includes albedo as a variable — a higher-albedo planet is cooler
Understanding albedo helps solar cooker builders choose materials and helps citizen scientists interpret land-use change data from satellite imagery.

**[80] Schmutzdecke**
German: "dirt layer." The thin biological layer that forms on the surface of a biosand filter [Module W5] after 3–4 weeks of operation — the key to the filter's effectiveness. Contains predatory protozoa, bacteria, and organic matter that biologically remove pathogens through predation and competition, supplementing the physical straining of the sand below. The schmutzdecke is why you must not scrub the top of a biosand filter, and why it needs daily water flow to remain alive. Understanding this layer is the difference between a filter that works and one that doesn't — it is the core concept in the WATSAN practitioner certificate.

**[81] Photovoltaic Effect**
The generation of voltage and electric current in a material upon exposure to light — the physical principle underlying all solar PV panels. Discovered by Alexandre-Edmond Becquerel (1839). In a crystalline silicon solar cell, photons from sunlight dislodge electrons from silicon atoms; the cell's p-n junction creates an electric field that drives those electrons in one direction, producing direct current (DC). The efficiency of converting light to electricity (10–22% for commercial panels) depends on: cell material quality, temperature (efficiency drops as temperature rises — an important consideration for hot climates), and light spectrum. Foundation concept for Solar curriculum Module S4.

**[82] Peak Sun Hours (PSH)**
The number of hours per day at which solar irradiance averages 1,000 W/m² — the standard test condition for rating solar panels. A location with 5 PSH means it receives the energy equivalent of 5 hours of full-intensity sunlight, even if the sun is shining for 12 hours (because it is less intense in the morning and evening). Example: Nairobi averages ~5.5 PSH; London averages ~2.5 PSH; the Atacama averages ~8 PSH. PSH is the key input for sizing a solar PV system — a 100 Wp panel in a 5 PSH location theoretically produces 500 Wh/day before losses. Data source: Global Solar Atlas (globalsolaratlas.info — free, open access).

**[83] Watershed / Catchment Area Calculation**
The calculation used in WATSAN Module W8 for sizing rainwater harvesting systems. Formula: `Volume = Roof area (m²) × Rainfall (mm) × Collection efficiency`. Collection efficiency accounts for first-flush losses, evaporation, and splash — typically 0.80–0.90 for metal roofs, 0.70–0.85 for tile. Example: a 50 m² roof in a region receiving 600 mm annual rainfall with 0.85 efficiency yields: 50 × 0.6 m × 0.85 = 25,500 litres per year. Knowing this before building a tank prevents the common mistake of installing a tank too small (always runs dry) or too large (capital wasted, water stagnates).

---

### WATER & SANITATION

**[84] SODIS — Solar Water Disinfection**
A method of disinfecting water using 1.5–2 litre clear PET plastic bottles filled with turbid-free water (< 30 NTU) and placed on a reflective surface in full sunlight for 6 hours (or 2 consecutive days if overcast). Inactivates bacteria, viruses, and Cryptosporidium through UV-A radiation and thermal effects. Requires clear bottles (PET, not green or opaque), clear water, and sustained sunlight. Free, locally reproducible, and highly effective in appropriate conditions. Validated by EAWAG (Swiss Federal Institute of Aquatic Science) and endorsed by WHO. Covered in WATSAN curriculum Module W3.

**[85] CLTS — Community-Led Total Sanitation**
A behaviour change approach that triggers communities to collectively decide to eliminate open defecation (OD) — without hardware subsidies or top-down instruction. Developed by Kamal Kar (Bangladesh, 2000). The process: community walks, mapping, and calculation of the "shit problem" trigger collective disgust and motivation; the community then self-organises to achieve Open Defecation Free (ODF) status. CLTS has reached 60+ countries and been adopted as the primary rural sanitation approach by many governments. Key principle: people stop OD not because of a subsidy but because of collective social action. Foundational concept in WATSAN Module W4.

**[86] ORS — Oral Rehydration Solution**
A simple mixture of water, sugar, and salt that replaces fluids and electrolytes lost during diarrhoea. WHO/UNICEF formula: 1 litre clean water + 6 level teaspoons sugar + ½ teaspoon salt. Estimated to have saved 50+ million lives since introduction in the 1970s. Can be made from household ingredients. Key knowledge in the Health & Wellbeing domain and WATSAN Module W4. A critical distinction: ORS treats dehydration but does not treat the underlying infection — safe water and sanitation prevent the diarrhoea in the first place.

**[87] First-Flush Diverter**
A device in a rainwater harvesting system that automatically discards the first portion of rainfall from a roof before it reaches the storage tank. The first flush carries accumulated dust, bird droppings, leaf debris, and atmospheric pollutants. A diverter typically discards 1–2.5 mm of rainfall equivalent (roughly 1–2.5 litres per 1 m² of roof) before routing water to the tank. Simple PVC designs can be built for < $5 in materials. Without a first-flush diverter, rainwater tanks accumulate debris and pathogens rapidly. Covered in WATSAN Module W8.

**[88] Biosand Filter**
A household water treatment technology that passes turbid and microbiologically contaminated water through layers of sand and gravel to produce safe drinking water. The key mechanism is the biological layer (schmutzdecke [80]) that forms on the sand surface after 3–4 weeks of operation. Effective against: bacteria (> 99.9% removal), protozoa (> 99%), viruses (> 60–70% in mature filter). Not effective against: dissolved chemicals, heavy metals, fluoride. Construction cost: $30–80 in materials, depending on whether the container is plastic or concrete. Technical reference: CAWST Biosand Filter Manual (open access). Covered in WATSAN curriculum Module W5.

**[89] WASH — Water, Sanitation, and Hygiene**
The standard UN/NGO acronym for the three interconnected public health domains. *Water* = safe water supply and treatment. *Sanitation* = hygienic management of human waste. *Hygiene* = behaviours that prevent transmission of disease, particularly handwashing. Used interchangeably with WATSAN in some contexts; WASH is more common in public health and development contexts; WATSAN tends to be used in engineering and infrastructure contexts. Our curriculum uses WATSAN as the track name and WASH for the behaviour-change content within it.

---

### CITIZEN SCIENCE & OBSERVATION

**[90] Citizen Science**
Scientific research conducted, in whole or in part, by non-professional scientists — members of the public who observe, collect data, or analyse results. Three models (Bonney et al.):
- *Contributory:* the public contributes data; scientists design and analyse (iNaturalist, CoCoRaHS)
- *Collaborative:* the public helps design or analyse as well as collect (Galaxy Zoo, Foldit)
- *Co-created:* scientists and public jointly design the question, collect data, and interpret results — most powerful for communities with local knowledge
Citizen science data has produced peer-reviewed findings in ecology, astronomy, epidemiology, and linguistics. iNaturalist observations contributed to 900+ peer-reviewed publications between 2017 and 2024.

**[91] iNaturalist**
A global citizen science platform (launched 2008, now operated jointly by California Academy of Sciences and National Geographic Society) for recording biodiversity observations. Users upload photographs with GPS coordinates and date; the community (and AI-assisted computer vision) provides identifications. Observations with two agreeing community identifications become "Research Grade" and flow automatically to GBIF [92]. Over 200 million observations from 8 million users as of 2024. The primary data collection tool in our Citizen Science curriculum. Free, available on iOS and Android.
→ Research Grade: an observation where the community has agreed on a species-level identification and the observation has a date and location. This is the threshold at which data is usable for scientific analysis.

**[92] GBIF — Global Biodiversity Information Facility**
An open-access international network and data infrastructure funded by the world's governments. Aggregates biodiversity occurrence data from 1,700+ institutions worldwide — museums, herbaria, field surveys, citizen science platforms (including iNaturalist). Contains 2.9 billion occurrence records as of 2024 (species, location, date). Free to access at gbif.org. Every Research Grade iNaturalist observation becomes a GBIF record. Used in species distribution modelling, conservation planning, and climate change impact assessment.

**[93] Research Grade (iNaturalist)**
An iNaturalist observation that meets three criteria: (1) has a photo; (2) has a date and location; (3) has a species-level identification agreed to by two-thirds of community identifiers. Research Grade observations are shared with GBIF [92] and are used in peer-reviewed research. Achieving Research Grade for your observations is a specific learning objective in Citizen Science curriculum Module C3 — it requires both photo quality and correct location recording.

**[94] Transect Survey**
A systematic sampling method in which an observer walks along a defined line (the transect) and records all organisms (or a specific target species or habitat type) within a defined distance on either side. Produces a repeatable, comparable record that can be used to track population changes over time. Two main types: *line transect* (distance from the transect line is recorded for each observation, enabling density estimation) and *belt transect* (all organisms within a fixed width strip are counted). The standard method for vegetation surveys, butterfly monitoring, reef surveys, and many bird surveys. Covered in Citizen Science curriculum Module C5.

**[95] Point Count**
A bird survey method in which an observer stands at a fixed location (a "point") for a defined time period (usually 5–10 minutes) and records all birds seen or heard within a defined radius or unlimited distance. The most widely used method for standardised bird monitoring. Points are typically arranged along a transect [94] at 200–300 m intervals to avoid double-counting. The North American Breeding Bird Survey (BBS) and eBird both use point count protocols. Data from point counts across years and locations shows population trends that drive conservation decisions.

**[96] eBird**
A real-time online checklist programme operated by the Cornell Lab of Ornithology. Users submit checklists of every bird species seen or heard during a defined observation period at a defined location. Over 1 billion bird observations submitted by 700,000+ users. Data used in over 1,000 peer-reviewed publications. The gold standard for citizen science bird monitoring. Free, available at ebird.org and as a mobile app. A key platform for the `eco:biodiversity` certificate domain (birds are the most accessible biodiversity indicator for most communities).

**[97] CoCoRaHS — Community Collaborative Rain, Hail and Snow Network**
A citizen science network for precipitation measurement, founded in Colorado (1998) and now operating across the Americas and parts of Europe. Participants measure daily precipitation using a standardised 4-inch rain gauge and report online. Data is freely available and used by national weather services and climate researchers. The most accessible form of climate data contribution — a rain gauge costs < $30 and reading it takes 2 minutes per day. Used in Citizen Science curriculum Module C7.

**[98] Occurrence Record**
The basic unit of biodiversity data: a single observation of a species at a specific place and time. A GBIF occurrence record contains: species name (or the most precise identification possible), latitude/longitude, date, observer name, observation method, and any associated media. The quality of an occurrence record depends on precision of location (GPS > estimate), certainty of identification (Research Grade > unidentified), and completeness of metadata. Poor-quality occurrence records (wrong location, imprecise date, uncertain ID) are filtered out of scientific analyses — which is why data quality is taught in Citizen Science Module C4.

**[99] Phenological Calendar**
A record of the timing of cyclical ecological events — first flowering, first fruiting, first insect emergence, first bird arrival, rainy season start, dry season end — tied to a specific location and maintained over multiple years. Phenological calendars have been kept by farmers and communities for millennia as practical tools for agricultural timing. They are now understood as highly sensitive climate change indicators: shifts of days or weeks in phenological timing are measurable signals of temperature change. Community-maintained phenological calendars that go back 10+ years are scientifically valuable datasets. Creating and maintaining one is a core activity in Climate domain Module C7.

**[100] Open Defecation Free (ODF)**
The status achieved by a community when all members use latrines or other sanitary facilities for defecation — no member defecates in the open. Verified by community self-certification and spot-checks. ODF status reduces diarrhoeal disease, child stunting, and school absenteeism. The target of CLTS [85] programmes. Many national governments track ODF status at village and district level as a public health metric. In our WATSAN curriculum, understanding ODF and what it requires is a Foundation-level objective.

---

### LEARNING & ASSESSMENT METHODS

**[101] Spaced Repetition**
A learning technique in which study material is reviewed at increasing intervals over time — reviewed when about to be forgotten. More effective than massed practice ("cramming") for long-term retention because it exploits the "spacing effect" (memory is stronger when material is studied multiple times spaced out over time rather than in one block). The SM-2 algorithm [102] is the most widely implemented version. Used in our flashcard deck system across all three curriculum tracks.

**[102] SM-2 Algorithm**
The *SuperMemo 2* spaced repetition algorithm developed by Piotr Woźniak (1987). After each flashcard review, the learner rates their recall (0–5 scale). The algorithm calculates: next review interval = previous interval × ease factor. Easy cards (consistently well-recalled) are reviewed less often; hard cards more often. A card reviewed today, recalled easily, reappears in 6 days; if recalled easily again, in 15 days; then 38 days. The result: you spend more time on what you don't know, less on what you do. Simple enough to implement in 20 lines of code; powerful enough to enable learning 10,000+ vocabulary items with manageable daily review time.

**[103] Formative Assessment**
Assessment that occurs *during* a learning process, intended to provide feedback and guide further learning — not to assign a grade or issue a certificate. In our curriculum: the short 3–5 question mid-module checks are formative assessments. Getting one wrong shows you what to revisit; it has no effect on progression. Formative assessment is the most effective tool in the learning science literature for improving final achievement — it forces retrieval practice (attempting to recall information strengthens memory) without the anxiety of a high-stakes test.

**[104] Summative Assessment**
Assessment that occurs at the *end* of a learning unit to evaluate whether objectives have been met — and in our case, to determine whether a certificate can be issued. Our 10–20 question module quizzes are summative assessments. They have a pass threshold (75–85% depending on level) and unlimited retakes. The certificate gate is a summative assessment; the mid-module checks are formative. Both types serve learners, but in different ways: formative guides the journey; summative marks the milestone.

**[105] Peer Review (Learning Context)**
In our curriculum, peer review refers specifically to the peer art method [106] — learners reviewing each other's artwork using a structured rubric that asks what the work communicates, not whether it is aesthetically accomplished. Peer review in the learning context serves multiple functions: the reviewer consolidates their own understanding by analysing another person's interpretation; the creator receives feedback from a peer perspective (often more accessible than expert feedback); and the community of learners builds a shared vocabulary for the domain.

**[106] Peer Art Method**
The SCD Hub learning approach in which learners create a visual representation of a concept from each module — drawing, painting, diagram, annotated photograph, collage — and submit it as part of their module completion evidence. Peers review the artwork using a guided rubric focused on what it communicates, not aesthetic quality. Assessment outcome: *demonstrates understanding* / *partially demonstrates* / *does not demonstrate*. The method works across literacy levels (understanding can be shown in a sketch), across cultures (local visual traditions are welcomed), and produces a portfolio of community-owned educational material that becomes a teaching resource for future cohorts. Distinctive because it recognises that understanding has many valid forms of expression.

**[107] RPL — Recognition of Prior Learning**
The formal process by which skills, knowledge, and competencies gained outside formal education — through work, community practice, field experience, self-directed learning — are assessed and credited within a national or regional qualifications framework. RPL is the mechanism by which our eco-ops field certificates connect to formal qualification systems: a community member who has spent years monitoring a watershed submits a portfolio of evidence; an RPL assessor (operating under KNQA [Kenya], TESDA [Philippines], or equivalent) credits this toward a formal qualification. RPL does not lower standards — it changes the evidence format from exam to portfolio.

**[108] Portfolio of Evidence**
A collection of documented examples showing that a learner has met specific competency criteria — field reports, photographs, test results, artworks, observation records, peer review feedback, facilitator sign-offs. In our system: the complete submission for a Practitioner certificate includes the summative quiz pass, the field activity documentation, and at least one peer-reviewed artwork. The portfolio is stored as IPFS-linked metadata on the certificate — meaning the evidence behind a certificate is inspectable by anyone who verifies it.

**[109] Learning Objective**
A specific, observable statement of what a learner will be able to do after completing a module. Written in active verbs: "can identify," "can build," "can describe," "can demonstrate." Good learning objectives are the backbone of a curriculum — they determine what gets taught (content), how learning is checked (assessment), and what gets certified. Each module in our curriculum has 4–6 learning objectives from which the quiz questions and peer art tasks are directly derived.

---

### CODE & PLATFORM

**[110] Git**
A distributed version control system — software that tracks changes to files over time, allows multiple people to work on the same codebase simultaneously, and enables reverting to any previous state. All SCD Hub platform code is managed in git. Key concepts: *commit* (a saved snapshot of changes with a message explaining why); *branch* (a parallel line of development that doesn't affect the main codebase until merged); *pull request / PR* (a proposal to merge a branch into the main codebase, subject to review). Free and open source; the most widely used version control system in the world.

**[111] DCO — Developer Certificate of Origin**
A one-line sign-off added to every git commit: `Signed-off-by: Name <email>`. By signing off, the contributor certifies that (a) they created the contribution, or have the right to submit it; and (b) they license it under the project's open-source licence (GPL v3 in our case). Much lighter than a Contributor Licence Agreement (CLA) — no separate document to sign, just a flag in the commit. Used by the Linux kernel, GNOME, and thousands of other GPL projects. Required for all code contributions to SCD Hub platform repositories.

**[112] JSON-LD — JavaScript Object Notation for Linked Data**
A method of encoding structured data in JSON format using a `@context` that maps terms to defined vocabularies (schema.org, W3C VC, Open Badges, etc.). The result is data that is both human-readable (plain JSON) and machine-interpretable in a way that allows different systems to agree on what a field means without prior coordination. Our SVG certificates embed W3C VC 2.0 JSON-LD in the SVG metadata block — this is what makes them importable into LinkedIn, Accredible, and any other Open Badges 3.0 compatible platform.

**[113] SVG — Scalable Vector Graphics**
An XML-based file format for two-dimensional graphics that scales without quality loss at any size (because shapes are defined mathematically, not as a grid of pixels). SVG files are natively rendered by all modern web browsers. They can contain: geometric shapes, text, images, animations, metadata, and embedded data (including JSON-LD for our certificates). A certificate stored as SVG is simultaneously a displayable graphic, a printable document, and a machine-readable data container — the ideal format for credentials that need to travel across digital and physical contexts.

**[114] IPFS — InterPlanetary File System**
A decentralised protocol for storing and sharing files on a peer-to-peer network. Files on IPFS are addressed by their content hash (CID — Content Identifier), not by their location. This means: a file's address changes if its content changes (making tampering detectable); the file is retrievable from any node that has it (no single point of failure); and the file can survive the disappearance of the server it was originally published from. Our certificate SVGs are stored on IPFS — the IPFS CID is embedded in the on-chain record. Arweave provides permanent paid archival storage as a backup.

**[115] Multi-sig Wallet**
A cryptocurrency wallet that requires multiple private keys (key-holders) to authorise any transaction — for example, 3 of 5 key-holders must sign before funds move. Multi-sig is the standard governance mechanism for shared treasuries because it eliminates single points of failure and single points of corruption: no one person can drain the wallet alone. SCD Hub's root DID and treasury wallet are multi-sig controlled. Used in the DAO treasury distribution model described in POLYNOMICS-CONTRIBUTION.md §3E.

**[116] DID — Decentralized Identifier**
A W3C standard for globally unique, cryptographically verifiable identifiers that are controlled by their subject — not by a central authority (like a domain registrar or certificate authority). A DID looks like: `did:algo:ABC123...`. The `did:algo` prefix indicates it is anchored on the Algorand blockchain. This is a pon.ink-side identity option (`SPEC_PON_INK.md`), not part of the core Exotopia distro, which does not require a wallet or blockchain identity. SCD Hub's root issuer identity is a DID (`did:algo:SCDHUB_ROOT`). Certificate recipients can also have DIDs (tied to their wallet address), making the credential relationship fully decentralised: issuer DID signs credential about subject DID.

**[117] Open Source**
Software whose source code is made available under a licence permitting anyone to study, modify, and distribute it. Our platform is licensed under GPL v3 (General Public License version 3) — the most prominent "copyleft" open source licence, which requires that any modified version distributed publicly must also be released under GPL v3. Open source is not just a legal condition — it is a governance stance: it means the community can always run, inspect, and fork the platform if SCD Hub as an organisation ceases to maintain it. The address coordinate specification is an open standard for the same reason.

**[118] API — Application Programming Interface**
A defined set of rules and protocols that allows software components to communicate with each other. In our context: the SCD Hub certificate API (`POST /api/v1/cert/issue`) is the interface through which Level 2 partner organisations issue certificates without needing to understand the underlying blockchain mechanics. An API is like a restaurant menu — you specify what you want (input parameters), the kitchen handles the preparation (implementation details), and you receive the result (response) without needing to know how it was made.

---

### PROCESSES & PROTOCOLS

**[119] FPIC — Free, Prior and Informed Consent**
The international standard for obtaining genuine agreement from indigenous and local communities before any project or activity that affects their territories, resources, or knowledge.
- *Free:* no coercion, pressure, financial incentive, or time pressure
- *Prior:* consent is sought *before* any activity begins — not after the fact or mid-project
- *Informed:* the community understands: what the activity is, who will benefit, what data will be collected, where it will go, what their rights are, and how to withdraw consent
FPIC is not a one-time event — it is an ongoing relationship. It must be renewed if the scope of activity changes. The `eco:indigenous` certificate process requires FPIC documentation embedded in every certificate's metadata. This is not optional compliance overhead — it is the foundation of legitimate knowledge documentation.

**[120] Observation vs. Inference**
A core scientific literacy distinction taught in Citizen Science Module C2. An *observation* is what you directly perceive with your senses or instruments: "The water is brown and has a strong smell." An *inference* is a conclusion drawn from observations: "The water is contaminated with sewage." Both are valuable — but mixing them corrupts data. Field records should keep observations and inferences separate: observations go in the data field; inferences go in the notes field. This distinction is why trained citizen scientists produce more scientifically useful data than untrained ones making the same observations.

**[121] GPS — Global Positioning System**
A satellite navigation system that provides location (latitude, longitude, elevation) and time information anywhere on Earth. A smartphone GPS typically achieves 3–5 metre accuracy in open terrain; ±10–15 m under tree cover. Key practices for field data collection: record coordinates at the observation point (not at the trailhead or car); allow the GPS receiver to settle for 30 seconds before recording; note the accuracy estimate if your device displays it; use WGS84 coordinate system (the global standard, used by iNaturalist, GBIF, and Google Maps).

**[122] Chain of Custody**
Documentation that tracks who collected data, at what time, using what method, and how it was handled between collection and submission. In water quality monitoring: chain of custody ensures that a water sample result can be trusted — it proves the sample wasn't contaminated, mislabelled, or swapped between collection and analysis. In eco-ops field work: the check-in protocol creates an automatic on-chain chain of custody for eco-ops data — GPS timestamp, observer wallet address, activity type, and submitted evidence are all recorded together and immutable.

**[123] Verification (Citizen Science)**
The process by which citizen science observations are checked for accuracy before being accepted into a database or used in analysis. In iNaturalist: verification is done by the community through the identification system — the "Research Grade" threshold (two agreeing identifications) is a form of crowd verification. In our eco-ops system: eco-ops activities are verified by a partner organisation representative or a certified facilitator before triggering certificate issuance. Verification does not mean doubting the contributor — it means adding a second check that protects data quality for everyone.

**[124] Revocation (Certificate)**
The process of marking a previously issued certificate as invalid. In our system, revocation is on-chain — the certificate status changes from `active` to `FRAUDULENT`, `WITHDRAWN`, or `SUPERSEDED`. The certificate record itself is not deleted (the blockchain is immutable) but its status is publicly visible, and third-party platforms that check status (LinkedIn, Accredible) will reflect the revoked status. Revocation can be initiated by: the issuer (if the achievement was not verified), the Level 2 sponsor (if the issuing group violated scope), SCD Hub root (for any certificate), or the recipient (right of withdrawal under GDPR and equivalents).

**[125] Data Minimisation**
A privacy principle (GDPR Article 5, and equivalents globally) requiring that only the personal data strictly necessary for a defined purpose is collected and retained. Applied to our certificate system: we collect wallet address (necessary to mint the on-chain record), achievement description (necessary for the certificate content), and evidence reference (IPFS CID — necessary for verification). We do not collect: physical address, phone number, government ID, or demographic data. The certificate is as useful with just a wallet address as with full personal data — and much safer for the recipient in contexts where their activities could attract attention.

---

### SELF-REPORTING & FIELD DOCUMENTATION

**[126] Field Notebook**
A systematic record of observations made during field work — the primary tool of naturalists, ecologists, soil scientists, and water quality monitors for centuries. A good field notebook entry contains: date, time, location (GPS coordinates and a written description), weather conditions, observer name, what was observed (using the observation vs. inference distinction [120]), measurements, and sketches. Field notebooks are legal documents in some contexts (nature conservation, water quality monitoring, land tenure documentation) and should be written in ink, not pencil. Our curriculum teaches a standardised field notebook format as a Foundation-level skill.

**[127] Photo Documentation Protocol**
The standard for photographing evidence in field activities. For species identification: photograph from multiple angles (top, side, underside of leaves, bark close-up); include a scale reference (finger, ruler, coin); note lighting conditions; capture any key identifying features specifically. For infrastructure (biosand filter, solar cooker, water tank): photograph before, during, and after construction; include a completed-works photo with a person for scale. For ecological conditions (turbid water, eroded slope, degraded habitat): photograph the widest possible context first, then zoom to detail. Poor documentation is one of the most common reasons field activity evidence is rejected.

**[128] GPS Waypoint**
A specific geographic location recorded and stored by a GPS device, identified by latitude, longitude, and optionally elevation. Waypoints allow you to return to exactly the same spot for repeat monitoring visits — essential for any longitudinal study where you are comparing data collected at the same location over time. Our Citizen Science Module C5 teaches waypoint recording as part of transect survey setup. A waypoint naming convention (e.g., `KAK-T1-001` for Kakamega Transect 1, Point 1) ensures different observers can find the same points.

**[129] Eco-ops Check-In**
The SCD Hub protocol for recording real-world community field work on-chain. Eight activity types: `wqMap` (water quality mapping), `garbageMap` (solid waste), `farmMap` (agricultural survey), `productMap` (product/supply chain), `transportMap`, `storageMap`, `sourceMap` (water source), `cleaningMap`. A check-in records: GPS coordinates, timestamp, activity type, observer wallet, and a photo or data attachment. Check-ins are verified by a partner organisation and contribute to earn-pathway settlement credits. The check-in data builds a community environmental record that persists on-chain regardless of platform changes.

**[130] Monitoring Register**
A structured log maintained by a community group to record repeated measurements at the same location over time — the practical tool for community-based monitoring programmes. A water quality monitoring register might record: date, collector name, source location (GPS waypoint), turbidity (NTU), pH, coliform result (positive/negative), and any observations. Registers should be kept in a durable, weather-resistant notebook AND backed up digitally. Monthly data entry into a shared spreadsheet or the eco-ops system is the minimum standard for data to be scientifically useful.

---

### LEGAL & COMPLIANCE (KEY TERMS)

**[131] ILO C169**
The International Labour Organization's *Indigenous and Tribal Peoples Convention* (No. 169, 1989). The primary binding international law instrument on indigenous rights — binding in the 23 countries that have ratified it (mostly Latin America, some Europe and Pacific). Key provisions: Article 1 (self-identification), Articles 6–7 (consultation obligation before any project affecting indigenous peoples), Article 15 (natural resource rights, including traditional knowledge), Article 23 (recognition of traditional economic activities). In ratifying countries, failure to follow C169 consultation requirements creates legal liability, not just ethical concern.
→ See [62] TEK, [63] IEK, [149] FPIC, [132] UNDRIP

**[132] UNDRIP**
The *United Nations Declaration on the Rights of Indigenous Peoples* (A/RES/61/295, 2007). Adopted by 148 countries. Non-binding (a declaration, not a treaty) but carries significant moral and political weight. Uses stronger language than ILO C169 — explicitly requires "free, prior and informed consent" (FPIC) rather than "consultation." Article 31 protects indigenous peoples' rights to their cultural heritage, traditional knowledge, and cultural expressions. SCD Hub applies the UNDRIP FPIC standard in all `eco:indigenous` certificate contexts, even where ILO C169 (which uses consultation language) is the applicable law.
→ See [131] ILO C169, [119] FPIC

**[133] VASP — Virtual Asset Service Provider**
A regulatory category in many jurisdictions covering businesses that exchange, transfer, safeguard, or administer virtual assets (cryptocurrencies, NFTs) on behalf of others. Whether SCD Hub constitutes a VASP in any given jurisdiction is a key compliance question. We argue: we are not a VASP because we do not hold user assets, operate an exchange, or transfer crypto between accounts — we issue certificates (on-chain records) and users interact directly with the blockchain via their own wallets. But the analysis differs by jurisdiction — this is why the research prompt asks for VASP analysis in each country.

**[134] Howey Test**
The US Supreme Court test (SEC v. W.J. Howey Co., 1946) for determining whether an instrument is a "security" under US law. An investment contract (security) exists when: (1) there is an investment of money, (2) in a common enterprise, (3) with an expectation of profits, (4) from the efforts of others. Our settlement address certificates: (1) may involve money — yes; (2) common enterprise — arguably not (each address is unique, not pooled); (3) expectation of profits — explicitly no; (4) from others' efforts — no. Points 3 and 4 are our strongest defences. Certificates issued for earned work (not purchased) are even further from securities.

**[135] Open Badges 3.0**
The current version of the IMS Global (1EdTech) standard for digital badges and credentials. Defines a JSON-LD data format for credential metadata that is portable between platforms — a badge issued by SCD Hub can be imported into LinkedIn, Accredible, Badgr, Canvas, and any other 1EdTech-compatible platform. Open Badges 3.0 aligns with W3C Verifiable Credentials 2.0 [136], meaning our certificates are simultaneously Open Badges 3.0 compatible and W3C VC compliant. The open standard is what makes credentials portable without SCD Hub needing to maintain relationships with every employer or education system.

**[136] W3C VC 2.0 — Verifiable Credentials Data Model Version 2.0**
The World Wide Web Consortium standard for machine-readable, cryptographically verifiable credentials. A VC has three parts: the credential (the claims being made — e.g., "this person completed biosand filter construction training"), the proof (a cryptographic signature from the issuer), and the status (whether the credential is still valid). The credential is stored as JSON-LD; the proof uses a DID-based key. The result: any system can verify a credential's authenticity without contacting the issuer — it checks the signature against the issuer's published public key. This is what makes SCD Hub certificates trustworthy even if the platform is offline.

**[137] eIDAS 2.0**
Regulation (EU) 2024/1183 on electronic identification and trust services. Creates the EU Digital Identity Wallet (EUDIW) — a national identity wallet that every EU citizen will hold. Introduces Qualified Electronic Attestations of Attributes (QEAAs) — a new credential type that can be stored in the EUDIW alongside government-issued documents. Our long-term EU interoperability target: QEAA compliance would allow our `learn:*` certificates to be stored in EU citizens' national digital identity wallets. Requires SCD Hub to become a Qualified Trust Service Provider (QTSP) in an EU member state.

**[138] LGPD — Lei Geral de Proteção de Dados (Brazil)**
Brazil's General Data Protection Law (2018, in force 2020). Closely modelled on GDPR. Applies to all processing of personal data of Brazilian residents, regardless of where the processing organisation is located. For our credential system: a Data Processing Agreement (DPA) with every Brazilian Level 2 partner is mandatory under LGPD. The DPA must specify: what personal data is processed, the legal basis, storage period, and data subject rights (access, correction, deletion). LGPD fines up to 2% of Brazil revenue, capped at R$ 50 million per violation.

---

### MODERN RESEARCH & OPEN SCIENCE

**[139] Open Access**
A publishing model that makes research freely available to anyone with internet access — without subscription or payment by the reader. Two main routes: *Gold open access* (published directly in an open-access journal, often with an article processing charge paid by the author or funder); *Green open access* (a preprint [140] or author's accepted manuscript posted to an open repository). Most major funders (NIH, Wellcome Trust, Gates Foundation, many national science agencies) now require open access publication. For citizen science: most iNaturalist-derived research is published open access, meaning our communities can read the science their data contributed to.

**[140] Preprint**
A version of a scientific paper that has not yet undergone peer review, posted publicly on a preprint server. Key preprint servers: *bioRxiv* (biology), *EarthArXiv* (earth sciences), *EcoEvoRxiv* (ecology and evolution), *SSRN* (social sciences), *arXiv* (physics, maths, computer science). Preprints allow findings to circulate quickly and receive community feedback before formal peer review. Used by SCD Hub's learning community: when a preprint reports findings from citizen science data collected by our partners, we can share it with the contributing communities immediately rather than waiting 12–18 months for journal publication.

**[141] Remote Sensing**
The acquisition of information about an object or area without direct physical contact — typically using satellite or aerial imagery. Key platforms for environmental monitoring accessible to citizen scientists:
- *Sentinel-2* (ESA): 10m resolution multispectral imagery, free, refreshed every 5 days — used for vegetation change, water body detection, deforestation monitoring
- *Landsat 8/9* (USGS): 30m resolution, free, 40+ year archive — gold standard for land-use change analysis
- *Google Earth Engine*: free for research, cloud-based platform for processing petabytes of satellite data
- *Planet Labs*: commercial, 3–5m resolution, near-daily revisit — used by conservation organisations
Citizen science field observations ground-truth (validate) remote sensing data — the satellite sees a green blob; a citizen scientist confirms it is a specific forest type, crop, or invasive species.

**[142] Ground-truthing**
The process of verifying remotely sensed data or modelled outputs using direct observation on the ground. A satellite image may show a colour signature indicating healthy vegetation — a ground-truth visit confirms whether this is actually forest, or farmland, or a plantation. Citizen scientists are the most cost-effective source of ground-truth data at scale — more observers, more locations, more time in the field than any professional monitoring programme could achieve. The `eco:biodiversity` and `eco:restoration` certificate domains explicitly include ground-truthing of satellite data as an Advanced-level skill.

**[143] Bioacoustics**
The scientific study of sound production and reception in animals, and the application of acoustic monitoring to ecological research. Passive acoustic monitoring (PAM) uses automated recorders in the field to capture soundscapes; machine learning algorithms then identify species from the recordings. Highly effective for birds, bats, frogs, cetaceans, and insects. Citizen science tools: Merlin Sound ID (Cornell Lab, free) identifies bird species from phone recordings in real time. Ecoacoustics — the study of ecosystem health through soundscape indices — is an emerging field producing metrics like Acoustic Complexity Index (ACI) and Bioacoustic Index (BI) that citizen scientists can contribute to by placing recorders and uploading recordings.

**[144] eDNA — Environmental DNA**
Genetic material shed by organisms into their environment (water, soil, air) and detectable through molecular methods without direct observation of the organism. A water sample from a lake can reveal every fish, amphibian, and invertebrate species present — without catching or seeing a single animal. eDNA sampling is becoming a standard tool in biodiversity monitoring and is increasingly within reach of community science. Protocol: collect water sample in a sterile container, filter it onto a membrane, freeze or dry the membrane, send to a lab. Cost has dropped from > $500 to < $50 per sample for standard panels. This is a frontier tool that our Advanced citizen science curriculum will incorporate as it becomes accessible.

**[145] Ecosystem Health Index**
A composite measure that integrates multiple indicators — biodiversity, water quality, soil condition, vegetation cover, pollination service, carbon stocks — into a single score reflecting the overall functional state of an ecosystem. Several frameworks exist: the Ecosystem Health Bulletin (WHO), the BioScience Ecosystem Assessment, the SEEA (System of Environmental Economic Accounting). Our eco-ops monitoring across multiple domains (water, soil, biodiversity, restoration) generates the raw data that feeds into local ecosystem health assessments. The `eco:biodiversity` Advanced level includes interpreting and communicating ecosystem health data to community decision-makers.

**[146] Open Data Licence**
A legal document specifying the terms under which data may be used, shared, and built upon. Key licences for scientific data:
- *CC0 (Creative Commons Zero):* no restrictions — public domain dedication; used by GBIF for all occurrence data
- *CC BY 4.0:* free to use with attribution; most common for open science data
- *CC BY-SA 4.0:* free to use with attribution; derivatives must use the same licence (copyleft equivalent for data and creative works)
- *ODbL (Open Database Licence):* database-specific copyleft; used by OpenStreetMap
All data submitted through SCD Hub eco-ops channels is licensed CC BY 4.0 unless the submitting community specifies otherwise. Indigenous ecological knowledge submitted through `eco:indigenous` channels is *not* open data by default — the default is community-controlled access.

---

*Index continues — entries [62]–[146] added June 2026*  
*Return to: [README.md](../README.md) · [SPEC_DOMAIN_COMPETENCY.md](SPEC_DOMAIN_COMPETENCY.md) · [SPEC_LEARNING_CURRICULUM.md](SPEC_LEARNING_CURRICULUM.md)*
