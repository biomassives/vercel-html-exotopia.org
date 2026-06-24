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
The `exo-` namespace used in all virtual property addresses (e.g. `exo-surface-v1:Kepler-442b:14.5,-23.1`). Six coordinate systems are currently defined: `exo-surface-v1`, `exo-orbital-v1`, `exo-lunar-orbital-v1`, `exo-stellar-orbital-v1`, `exo-moon-surface-v1`, `exo-moon-lagrange-v1`, `exo-moon-interface-v1`.
→ See [24] Exolocation, [6] Trophic Level

**[4] ARC-3 / ARC-69** — *Algorand Request for Comment*
Two complementary NFT metadata standards on the Algorand blockchain. ARC-3 stores rich JSON metadata off-chain (typically on IPFS), referenced by the ASA URL field. ARC-69 stores compact identifying metadata directly in the on-chain note field (≤ 1 KB). Exolocation NFTs use both: ARC-3 for full property data, ARC-69 for the tamper-evident on-chain fingerprint.

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
A permanent, on-chain address anchoring a virtual settlement to a specific location in the NASA Exoplanet Archive. Format: `[coordinate-system]:[reference-body]:[location-descriptor]`. Six coordinate systems support six trophic levels. The Exolocation NFT (ARC-3 / ARC-69 on Algorand) is the virtual land deed.

**[25] Settlement Dome**
The primary physical structure of a Level 4/5 settlement in Exotopia. A geodesic hemisphere containing the library building, water feature, food production, vegetation, and the stone circle. The dome is the visible landmark of a community's presence on an exoplanet surface.

**[26] mule-bot**
An AI-powered knowledge assistant living in the settlement gallery. In V1, corpus-driven — speaks in the owner's words, assembled from items added to the knowledge base. In V2, a land-connected, replicable, programmable electronic mule — Natural & Regenerative Land Care Specialist. Tracks your $SUNLIGHT earnings, plans eco-ops participation for maximum rewards, curates your Hub Approvideo feed, helps build the settlement, and bridges virtual activity to real-world earth care recognition. Local-network only — no cloud, no LLM, corpus stays sovereign..
→ See STN-015, STN-019, blog-mule-v2-specialist.md

**[27] Eco-ops**
Short for *ecological operations*. The check-in protocol connecting real-world community field work to on-chain records and virtual rewards. Eight activity types: `wqMap` (water quality), `garbageMap`, `farmMap`, `productMap`, `transportMap`, `storageMap`, `sourceMap`, `cleaningMap`.

**[28] 40 Acres**
*"40 acres and a mule"* — a reference to the unfulfilled 1865 promise of land redistribution to freed enslaved people in the United States. In Exotopia, 40 virtual acres is the standard land claim unit attached to an Exolocation NFT. The mule is the mule-bot — the knowledge assistant that comes with the settlement.

**[29] Stone Circle**
The cultural landmark placed at the centre of each settlement in Exotopia. Marks the settlement's cardinal directions, functions as a time capsule, and carries the community's intention statement. The spiral pattern and standing stone heights are seeded from the settlement's hostname. The E8 Pyramid (wormhole access point) is hidden inside the stone circle, visible only in DK.MAT (dark matter) view mode.

**[30] Ecommunity DAO**
The self-evolving governance layer for settlement collectives in Exotopia. Principles: privacy by design, anti-harassment enforcement with community-controlled moderation, collective direction of technology resources toward local Earth-based projects. Governance tokens earned through participation, facilitation, and mentorship.

**[31] Resonance Split**
The standard fee allocation applied to all transactions through the PON INK / Exotopia / Ecocity / Worldbridger network. Always displayed before confirmation; never combined in a single expression with community payout amounts (fee isolation rule). Three paths, computed independently:
- **99%** → Artist / participant wallet (direct creator compensation)
- **0.75%** → Community Hardware Fund (WATSAN / mapping / field infrastructure)
- **0.25%** → Platform Maintenance (network ops, security, hosting)

Special mintings and airdrop events may use different parameters via additional contracts. Any custom split requires Group Manager + Admin co-sign and is logged in the `payment_splits_ledger`. The standard 99/0.75/0.25 is the network-wide default and applies unless a custom contract is explicitly in place.

---

### NFT & CHAIN

**[32] $SUNLIGHT**
Sound / music NFT standard in the PON INK protocol. Represents ownership and licensing rights to a recorded track or soundbank. Minted on Polygon or Solana. Includes: title, duration, BPM, key, genre, sample credits, license terms, collaboration credits, and IPFS audio CID. Royalty enforcement is on-chain.

**[33] Water Quality Certificate**
On-chain proof of a water quality field measurement. Fields: pH, turbidity (NTU), conductivity (µS/cm), nitrate (mg/L), coliform (CFU/100mL), GPS coordinates, timestamp, potability assessment. Stored on Polygon; backup on Arweave. Tamper-evident by design. Feeds the mule-bot's community water system health domain.

**[34] Health Card ID**
Decentralised health credential on Polygon. Encrypted. Portable to employers and health systems independent of the SCD Hub platform.

**[35] POAP**
*Proof of Attendance Protocol.* Event participation proof used for voting weight in the Ecommunity DAO and for event coordination. Multi-chain.

**[36] EcocitySolution NFT**
A collectible virtual object (displayable in the settlement dome) that also certifies learning, construction, or support of a real-world sustainable design. Categories: WATSAN, ENERGY, SHELTER, HEALTHCARE, FOOD. Each object has a 3D GLTF model reference (< 5,000 triangles), impact metrics, and an origin path (earned / airdropped / purchased). Minted on Solana via Metaplex Bubblegum.

**[37] Station Core**
The root NFT of a settlement station — a named, on-chain record anchoring the station to a specific exoplanet location. Contains the Exolocation reference and a map of installed module mint addresses. Minted on Solana. Identifier prefix: `STA`.

**[38] Station Module**
A functional zone within a Station Core — gallery, watsan, energy, shelter, healthcare, food, or command. Each module is a separate Solana cNFT minted independently. Modules can be added over time.

**[39] Exolocation NFT**
The virtual land deed. An Algorand ARC-3 / ARC-69 NFT encoding the full exolocation address, coordinate system, reference body, boundary descriptor, and owner attribution. Free to mint (network gas only). Secondary sales apply the Resonance Split.

---

### PROTOCOL & PLATFORM

**[40] PON INK**
*"Put it on ink."* The primary operations portal for the SCD Hub ecosystem — the daily-use tool for artists, field workers, and community builders. Every action taken in the network (check-in, performance, water quality reading, sale) is permanently recorded on-chain. Hosts: sound tools, cultural events, M-Pesa / Stripe payments, NFT minting, airdrop campaigns, and user dashboards.

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
