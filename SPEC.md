# SPEC.md — Exotopia
### Metaverse Visualization, Cosmic Navigation & Virtual Real Estate
*SCD Hub · pon.ink · ecocity.com · exotopia.org*
*Living document — updated through collaborative Q&A, April 2026 · statuses and §21–22 added July 2026 · §23–25 added July 2026*

> **A note on how to read this document.** Sections 1–10 and 14–20 describe the full intended system, including large pieces (avatar/presence, gallery customisation, robot companions, pon.ink identity bridge) that remain design specification, not shipped code — their status tables say so plainly. Section 11's MVP Scope table was audited against the live codebase in July 2026 and corrected where it had drifted from reality in both directions (some things marked "to build" already existed; nothing was found to be over-stated in that table). Sections 21, 22, and 24 document three systems that did not exist when this document was first written and were built independently of the original MVP plan. Section 25 audits a fourth area — camera/navigation continuity — where the honest answer is split: part of it shipped, part of it is a fully-written module that nothing calls yet. Section 26 (August 2026) records a scope decision: the NFT/blockchain economy §5–7, §10.3, and §18.5 originally described has been edited to match what §21 already established as shipped reality, and relocated to `SPEC_PON_INK.md` / `SPEC_WORLDBRIDGER_ONE.md` — it is no longer part of the Exotopia public distro's core scope.

---

## 0. Guiding Principles

- **Real data, real stakes.** The cosmos rendered here is built from NASA exoplanet archive data. The eco-ops activities tracked here represent real field work by real people. Neither is decorative.
- **Reward the doers.** Virtual real estate and rare NFTs flow toward participants who perform eco-ops work, produce art, complete modules, and build community — not toward speculators who arrive first.
- **Accessible first.** Every feature must be reachable on a mid-range Android handset on 3G. Desktop polish follows mobile-first function.
- **Open by default.** GPL v3. Community owns its data. Records are stored openly (Supabase + IPFS content-hashing) and are tamper-evident without requiring a blockchain. No black boxes.
- **Culture is the vehicle.** Music, visual art, and spatial storytelling are not decoration — they are how the mission travels.

---

## 1. What Exotopia Is

Exotopia is a **metaverse visualization and cosmic object navigation system** built on real astronomical data, designed to:

1. Give SCD Hub participants a permanent, meaningful address in the universe — a virtual settlement at a confirmed exoplanet, exomoon, or orbital zone.
2. Reward real-world eco-ops field work and community development with virtual real estate and settlement features (see §21 for the reward ledger actually shipping this).
3. Provide a 3D navigable environment for virtual workshops, cultural events, gallery exhibitions, and educational activities rooted in ecocity.com's sustainable design library.
4. Interoperate with **ecocity.com** (sustainable infrastructure education) as the cosmic layer of the SCD Hub ecosystem, and optionally with **pon.ink** for anyone who wants to mint, sell, or monetize settlement work — that layer is not required to own or use a settlement (see §26).

### 1.1 The Three Platforms

| Platform | Primary function | Relationship to Exotopia |
|---|---|---|
| **pon.ink** | Sound tools, cultural events, M-Pesa/Stripe payments, optional NFT minting, user dashboard | Optional monetization/creator layer — see §26. Not required for a settlement to exist or function |
| **ecocity.com** | Sustainable infrastructure design models, educational modules, workshop curriculum | Supplies settlement objects and vocational learning content |
| **exotopia.org** | Cosmic visualization, virtual real estate, settlement environments, wormhole transit | The metaverse layer; local-first address + reward destination for all ecosystem activity |

### 1.2 Organizational Context

All three platforms serve **SCD Hub**, a US non-profit dedicated to improving lives through:
- Mentor networks in environmental engineering and vocational skill training
- Community resilience, reliable income, and capacity development — globally
- Intersection with arts as the primary vehicle for engagement and empowerment

Current active community groups:
- **OT Kulcha** — "Pain in the Ghetto" studio reggae collaboration
- **Fana Ka** — rap battle events, sound resonance & street media
- **Uni-Kibaoni-Peace-Youth-SHG** (Lamu, Kenya) — Mpeketoni recycling center proposal targeting women, youth, and vulnerable households in Mkunumbi, Hongwe, and Bahari ward

---

## 2. User Roles

Each role has a distinct pathway through the ecosystem, earns role-relevant settlement rewards (see §21's points/certificate ledger for what's actually shipped), and is represented in their settlement with attributes relevant to their community development and career path.

| Role | Core activity | Settlement rewards (§21) | Settlement character |
|---|---|---|---|
| **Participant** | Eco-ops check-ins, module completion | Points, activity badges, settlement objects | Home base; education + production hub |
| **Facilitator** | Runs sessions and workshops | Session credit, venue objects | Workshop amphitheatre dome |
| **Visual Artist** | Art production, gallery exhibition | Gallery module, featured display (pon.ink minting optional — §26) | Orbital gallery + exhibition space |
| **DJ / Sound Artist** | Sound production, pon.ink events | Stage objects (pon.ink $BARS optional — §26) | Stage dome, sound lab |
| **Eco / Health Educator** | Field data collection, module delivery | Water Quality Certs, credentials | Research station + field data node |
| **Mentor** | Guides participants (§21.5 `educating_others` track) | Mentorship Beacon at confirmed-session thresholds | Mentor hall in settlement |
| **Promoter** | Audience growth, campaign management | Channel attribution credit | Broadcast node |
| **Fund Raiser** | Resource mobilisation for community projects | Impact certificates | Treasury room |
| **Technical Support** | System maintenance, field node uptime | Uptime/reliability badges | Command module |
| **Administrator** | Financial transparency, compliance, governance | Admin allow-list access | Council chamber |

---

## 3. Cosmic Navigation Hierarchy

The 3D space operates across five nested levels. Users can navigate between all levels; the current zoom level is always visible in the UI.

```
Level 1 — COSMIC VIEW
  Galaxy clusters, great voids, cosmic web filaments
  Wormhole conduit entry points at the periphery of great voids
        │
        ▼
Level 2 — GALAXY VIEW  (current main_oct2.js implementation)
  Individual galaxies; Milky Way star systems as points
  One dot per star system; colour from spectral type; size from planet count
        │
        ▼
Level 3 — SYSTEM VIEW
  Host star + orbiting planets at correct relative distances (log scale)
  Moon sub-orbits; star light + planet temperature colouring
        │
        ▼
Level 4 — SURFACE / ORBITAL VIEW
  Sky rendered from the surface of a specific exoplanet or exomoon
  Host star arc, sibling planets, parent planet (moon view), star field from catalog
  Terrain: procedurally displaced, temperature-palette coloured
        │
        ▼
Level 5 — SETTLEMENT VIEW
  The user's virtual property: dome environment
  Soul orbs (participant avatars), flowing water, animals, food production
  Settlement library objects (EcocitySolution NFTs from ecocity.com)
  Wormhole pyramid landmark
  Gallery building (clickable entry to Level 6)
        │
        ▼  [click gallery building]
Level 6 — GALLERY INTERIOR VIEW
  Artwork panels displaying owned NFTs
  Soul orbs of current gallery visitors
  Robot companion — corpus-driven guide and greeter
  File cabinet — complete archive of NFTs, eco-ops records, certifications
  Planetary color schema: unique aesthetic derived from host star + planet data
```

> **Note on extragalactic objects:** Confirmed exoplanets are currently all within the Milky Way, but proposed and speculative objects may extend beyond it. Level 1 (Cosmic View) must support this — users should be able to zoom out past the Milky Way to see the broader large-scale structure.

---

## 4. Exotopia Address System

Every user receives a permanent **Exotopia Address** on their first eco-ops check-in. The address is a structured coded string of the form:

```
[coordinate_system]:[reference_body_key]:[location_descriptor]
```

Examples (canonical slash format — see `SPEC_EXOLOC_ADDRESS.md` for the full spec):
```
exotopia:surface:kepler-442/kepler-442b/aurora-basin       (surface region)
exotopia:orbital:proxima-cen/proxima-cen-b/200-500km-i30   (orbital altitude band)
exotopia:stellar-orbital:alpha-centauri/1.1-1.3au          (stellar habitable zone)
```

**Properties:**
- Tied to a confirmed or proposed exoplanet / exomoon / stellar system from the NASA Exoplanet Archive (or the proposed-objects registry)
- Unique per user-role-location combination
- Computed from real astronomical data and stored locally on the owner's own device — no account, wallet, or blockchain required (optionally pinned to IPFS for durability)
- Human-readable **settlement nickname** assigned by the user (e.g. `"Aurora Basin Workshop"`, `"Proxima Sound Lab"`)
- Displayed on the user's virtual settlement in Exotopia, and optionally on a linked pon.ink profile if that integration is used

**Coordinate systems supported** — see [SPEC_EXOLOC_ADDRESS.md](SPEC_EXOLOC_ADDRESS.md) for the full specification including black hole orbital zones, trajectory addresses, parallel branch instances, and collaborative planning spaces:

| System | Scope alias | Status | Description |
|---|---|---|---|
| `exo-surface-v1` | `surface` | Production | Polygon on exoplanet or moon surface (lat/long degrees) |
| `exo-orbital-v1` | `orbital` | Production | Altitude band in orbit around exoplanet |
| `exo-lunar-orbital-v1` | `lunar-orbital` | Production | Orbit around exoplanet moon |
| `exo-stellar-orbital-v1` | `stellar-orbital` | Production | Orbital radius band around host star / binary system |
| `exo-bh-orbital-v1` | `bh-orbital` | Specified | Black hole vicinity zone — photon sphere, ISCO, accretion disk, ergosphere, stable orbit |
| `exo-trajectory-v1` | `trajectory` | Specified | Orbital path, slingshot, transfer arc, velocity/acceleration vector |
| `exo-branch-v1` | `branch` | Specified | Parallel / private / branded / educational universe instance |
| `exo-collab-v1` | `collab` | Specified | Multi-party collaborative settlement planning space |

Canonical address format: `exotopia:{scope}:{path}` — also a valid URL path at `exotopia.org/{scope}/{path}`.

---

## 5. Settlement System

A **settlement** is a user's virtual property in Exotopia — a business, art, and education point of interest rendered in Level 5 (Settlement View).

### 5.1 Core Environment

Every settlement is rendered as a **dome environment** containing:
- Flowing water features
- Animals and biodiversity elements
- Food production (ecocity aquaponics, garden beds)
- **Soul orbs** — glowing ambient representations of visiting/resident participants
- A **settlement library** — the central collection of objects the user has earned, minted, or purchased

### 5.2 Settlement Objects

Objects are acquired through three paths:

| Path | Source | Examples |
|---|---|---|
| **Earned** (eco-ops activity) | Automatic reward on milestone | Water filter object, solar array, garden bed |
| **Airdropped** | SCD Hub events, planet confirmations | Rare artist collab objects, science event commemoratives |
| **Purchased / traded** (optional) | pon.ink aftermarket — see §26; not part of the core distro | Premium ecocity designs, artist editions |

Object types map to **EcocitySolution categories**: watsan, energy, shelter, healthcare, food. Each object has visual presence in the settlement dome and a record confirming its origin and attributes (see §21).

### 5.3 Personalisation (Non-NFT Features)

Users can personalise their settlement surfaces without requiring NFT transactions:
- Surface colour and pattern customisation (dome walls, ground, sky tint)
- Settlement nickname and description
- Featured artwork display (linked to owned NFTs)
- Layout arrangement of earned objects
- "Coming soon" placeholders for proposed future NFT additions and airdrop objects — users can pre-design their space for anticipated drops

### 5.4 Settlement Interconnection — Wormhole Transit

Each settlement has a **pyramid landmark** at a fixed prominent position on the surface (visible in Level 4 Surface View and Level 5 Settlement View). The pyramid is the transit terminal.

**Transit flow:**
1. User approaches or activates the pyramid
2. The **E8 lattice mandala** is displayed — a geometric visualisation of the E8 root system, rotated dynamically to align with the current star system's local coordinates
3. A **7-second portal animation** plays
4. User transits to a destination from their **whitelisted transit registry** (locations they have been invited to or have access permissions for)
5. User materialises at the destination settlement

**Wormhole conduit geography:** At the cosmic scale (Level 1), the **periphery of the great voids** in the large-scale structure of the universe serves as the primary routing system for long-distance transit between galaxy clusters.

### 5.5 Settlement Governance (Ecommunity DAO)

Settlements can form collectives — **Ecommunity** governance is the self-evolving moderation layer. Core principles:
- Privacy protection by design
- Anti-harassment and anti-misuse enforcement with community-controlled moderation
- Users collectively decide how technology resources are directed toward local Earth-based projects

A token-weighted DAO version of this governance layer — where participation, facilitation, and mentorship earn on-chain voting weight — is a `SPEC_WORLDBRIDGER_ONE.md` integration, not part of the core distro (see §26).

---

## 6. Eco-Ops Check-in Protocol

The eco-ops check-in protocol is the **primary motor** connecting real-world community work to virtual rewards.

### 6.1 Activity Types

| Type | Description |
|---|---|
| `garbageMap` | Waste resource mapping |
| `wqMap` | Water quality measurement |
| `farmMap` | Farm practice / climate credit goal |
| `productMap` | Circular resource production |
| `transportMap` | Resource movement (origin → destination) |
| `storageMap` | Resource storage location |
| `sourceMap` | Source of materials / items |
| `cleaningMap` | Human-service cleaning activities |

### 6.2 Check-in → Reward Flow

```
User performs real-world activity
        │
        ▼
Submits eco-ops check-in (pon.ink app, mobile-first, 3G compatible)
  · location (GPS or manual)
  · activity type
  · photo / video evidence (optional)
  · group / project tag
        │
        ▼
Check-in is logged to Supabase + IPFS (tamper-evident)
        │
        ▼
Milestone reached → automated reward dispatch
  · NFT objects minted to user's wallet (role-specific types)
  · Settlement features unlocked (non-NFT personalisation options)
  · Exotopia address assigned (first check-in only)
        │
        ▼
Activity data published as open data (anonymised)
  · Water quality → on-chain Water Quality Certification
  · Field notes → potential input to policy briefs
```

### 6.3 Tamper-Evident Proof

Environmental data with public interest value is stored durably, no blockchain required:
- **Supabase + IPFS** — the actual storage path for check-in data (see §21.2/§24.1); content-addressed, tamper-evident
- **Cryptographic timestamp** — each submission signed at time of entry
- **Water Quality Certifications** — issued as ledger certificates (§21.2), not minted tokens. A pon.ink-side NFT wrapper is available optionally (§26) but is not the certification mechanism itself

---

## 7. Settlement Rewards & Optional Monetization

*This section originally specced a fully NFT-backed token economy (Exolocation NFT, Station Core/Module NFTs, EcocitySolution cNFTs, $BARS, on-chain Water Quality Certs). That economy was never fully built for the core distro; §21 documents what actually shipped instead — a Supabase-backed points and certificate ledger. See §26 for the scope decision behind this rewrite.*

### 7.1 What the core distro rewards with

See §21.2 for the shipped mechanism: points by track (`finance_literacy`, `volunteering`, `educating_others`), certificates, mentor-session credit, and settlement-object unlocks. No wallet, chain, or token is involved.

### 7.2 Optional monetization layer

Anyone who wants to mint, sell, or license settlement-related creative work (art, sound, event assets) can do so through:
- **`SPEC_PON_INK.md`** — individual minting, wallet-based aftermarket, $BARS soundbank, and the **Resonance Split** revenue rule (also used internally by `src/lib/resonance-split.ts` for non-chain contribution splits — see §10.4; percentages live in that file, not restated here, per its own no-inline-percentages rule)
- **`SPEC_WORLDBRIDGER_ONE.md`** — multi-author/collaborative assets and DAO-style resource-return splits

Neither is required to create, own, personalize, or use a settlement.

### 7.3 Proposed Planet Speculation Protocol *(to develop)*

Participants who publicly stake a claim on a *proposed* exoplanet location (not yet in the NASA archive) are celebrated and rewarded when a real confirmation occurs in that region:
- Celebrated recognition tied to the confirmed planet's scientific data (settlement badge, visibility boost — §21-style reward, not a token drop)
- Increased visibility for the holder's eco-ops activities and settlement
- Science event tie-in (new findings, host star data, distance)

---

## 8. Onboarding Flow

### 8.1 First Session (New User)

```
1. ARRIVAL
   User hears about pon.ink at a community event (live or remote)
   Lands on pon.ink mobile web app

2. WALLET CREATION
   Guided multi-layer wallet setup designed for crypto newcomers:
   · Seed phrase explanation with plain-language warnings
   · Multiple backup confirmation steps
   · Optional custodial layer for first-time users (no asset loss risk)
   · Role selection (see Section 2)

3. FIRST ACTION
   Immediately shown pathways relevant to their role:
   · Artist/DJ → Sound Lab, upload a sample, connect to current collab ("Pain in the Ghetto")
   · Eco Advocate → first eco-ops check-in, location tagging
   · Facilitator → create a session, invite participants
   · All roles → view their (empty) Exotopia settlement address

4. FIRST ECO-OPS CHECK-IN
   Submits a check-in (even a simple location ping counts)
   → Exotopia address is generated and assigned
   → Settlement stub is created (empty dome, ready to build)
   → User is shown their location on the Exotopia galaxy view

5. FIRST REWARD
   Completing the onboarding sequence triggers a starter NFT pack
   (role-specific objects for their settlement)

6. DISCOVERY
   User can now explore the 3D visualization, visit other settlements
   (via wormhole transit whitelist), and attend or host events
```

### 8.2 Accessibility Requirements

- Mobile-first, tested on mid-range Android (3G connection)
- Offline-capable check-in (sync when connection restored)
- Multi-language support (Swahili, English, Patois prioritised)
- No crypto jargon in onboarding UI — plain language throughout

---

## 9. Workshop & Events

Events are **rooted in real physical locations** with **remote participation** welcomed.

### 9.1 Event Types

| Type | Description |
|---|---|
| **Live collaborative session** | Music production, art creation — in-person + streaming |
| **Virtual workshop** | Hosted at a user's virtual settlement; participants attend via Exotopia |
| **Eco-ops field day** | Group check-in event; collective data collection |
| **Educational airdrop** | ecocity.com module delivery tied to a settlement theme |
| **Rap battle / showcase** | Fana Ka–style competitive creative events |

### 9.2 What Participants Earn

- **POAP** — proof of attendance, usable for governance voting
- **NFT objects** — settlement additions if workshop is tied to an ecocity module
- **$BARS** — for sound production participants
- **Credentials** — module completion certificates (portable to formal employment contexts)

### 9.3 Hosting a Workshop at Your Settlement

1. Facilitator activates their settlement as a workshop venue
2. Invites participants via pon.ink (share link, SMS via Africa's Talking, or QR code at live event)
3. Remote participants transit via wormhole to the settlement
4. Workshop content delivered (live audio/video + 3D settlement environment)
5. Attendance minted as POAPs on session close

---

## 10. Technical Architecture

### 10.1 Frontend

| Layer | Technology |
|---|---|
| Framework | Quasar (Vue 3) + Vite |
| 3D engine | Three.js (OrbitControls, custom sky/terrain/settlement renderers) |
| State | Pinia stores: `galaxy`, `wallet`, `station` |
| Routing | Vue Router (hash mode) |
| Styling | Quasar dark theme + custom space-dark CSS variables |

### 10.2 Backend & Storage

| Layer | Technology |
|---|---|
| Database | Supabase / Postgres |
| Auth | Supabase Auth + wallet signature verification |
| Edge functions | Supabase Edge Functions (rate limiting, anti-fraud, receipt hashing) |
| Decentralised storage | Pinata, Arweave, nft.storage |
| Eco-ops field data | IPFS + Arweave (tamper-evident, open data pipeline) |

### 10.3 Blockchain

No blockchain dependency in the core distro. The settlement/address system runs on local device storage with optional IPFS pinning (`src/lib/ipfs-pinning.ts`, `SETTLEMENT_ADDRESS_API.md`) — no wallet, no gas fee, no chain. Algorand/Solana/Polygon minting code that previously lived in `src/lib/` has been archived to `archive/chains/` as reusable reference, not wired into this app. See `SPEC_PON_INK.md` / `SPEC_WORLDBRIDGER_ONE.md` for the optional chain-based monetization layer (§26).

### 10.4 Payments

| Provider | Use |
|---|---|
| Split (`src/lib/resonance-split.ts`) | Creator / community fund / platform allocation — general-purpose, not chain-specific; net shown pre-confirm wherever it's used. Current percentages are defined only in that file (not restated here — see its own no-inline-percentages rule) |
| Africa's Talking / M-Pesa, Stripe | pon.ink-side payment rails for the optional monetization layer (§26) — not part of the core distro's payment surface |

### 10.5 Data Sources

- **NASA Exoplanet Archive PS table** — 6,158 deduplicated planets (`default_flag=1`), processed by `parse_exoplanet_export.py` → `public/exoplanets-viz.json`
- **Proposed objects registry** — `public/proposed-objects.json` — user/community proposed locations, distinct visual style in galaxy view
- **ot6.json** — eco-ops activity records with exolocation fields

---

## 11. MVP Scope

The minimum viable product that can be demonstrated to Uni-Kibaoni-Peace-Youth-SHG, OT Kulcha, and Fana Ka collaborators today.

### Must ship (v1)

| Feature | Status |
|---|---|
| Galaxy view — 3D navigable star systems from NASA data | ✅ Implemented (main_oct2.js → GalaxyPage.vue) |
| System view — host star + orbiting planets on click | ✅ Implemented |
| Surface view — sky from planet surface, host star animation, terrain | ✅ Implemented (SurfaceViewPage.vue) |
| Quasar app shell — nav, dark theme, page routing | ✅ Implemented |
| ~~Exolocation NFT metadata builder (Algorand ARC-3/ARC-69)~~ | Out of core-distro scope (§26) — standalone code, never wired into the deployed app, archived to `archive/chains/algorand/`. Available for pon.ink to pick up if needed |
| ~~Station/Module/EcocitySolution NFT metadata builder (Solana)~~ | Out of core-distro scope (§26) — same story, archived to `archive/chains/solana/`, not part of `src/` |
| Eco-ops check-in page with activity type selection | 🟡 Partial — built, but with a different activity taxonomy than §6.1's list. `src/stores/eco-offline.ts` ships an offline-first (IndexedDB queue, syncs on reconnect) check-in flow for water quality, macroinvertebrate sampling, tick drag, phenology, PFAS sampling, and CSO events — real field-science categories, not `garbageMap`/`wqMap`/etc. The backing Supabase `eco_ops` schema tables the client writes to are not yet migrated anywhere in the repo, so sync currently fails safely rather than actually persisting server-side. |
| Wallet creation flow (pon.ink — new-user-safe) | ✅ Implemented — as a self-contained browser wallet, not a pon.ink dependency: `BrowserWalletCreate.vue`, `BrowserWalletUnlock.vue`, `WalletOnboardingGuide.vue` |
| First eco-ops check-in → Exotopia address assignment | 🔲 Still to build — settlement creation (via `MintPage.vue`) and eco-ops check-ins are separate, unlinked flows today |
| Settlement stub view (empty dome, soul orbs, water) | ✅ Implemented — soul orbs render in `SurfaceViewPage.vue`; settlement records persist via `src/lib/settlements.ts` (localStorage-backed, not yet Supabase-synced) |
| Settlement nickname assignment | 🟡 Partial — every settlement has a `displayName`, but it's auto-generated from the planet/system name, not yet a user-editable field |

### Ship after v1 (v1.1 — target June 15, 2026)

| Feature | Priority |
|---|---|
| Wormhole transit (E8 mandala + 7-second portal animation) | High |
| Cosmic / Level 1 view (galaxy clusters, great voids) | High |
| Settlement object library (ecocity objects rendered in dome) | High |
| Gallery interior (Level 6) — artwork panels, planetary color schema | High |
| Robot companion — 3D figure in gallery, corpus-driven greeting, artwork guide | High |
| File cabinet — certificates and eco-ops records tabs (read-only first pass) | High |
| pon.ink ↔ exotopia identity bridge (optional, for users who opt into monetization — §26) | Low |
| Settlement personalisation (surface colour/pattern) | Medium |
| Gallery customisation interface (layout, atmosphere, drag-and-drop hang) | Medium |
| Workshop hosting at settlement | Medium |
| Proposed planet speculation protocol | Low |
| Ecommunity DAO governance UI | Low |

---

## 12. User Stories

### 12.1 New Participant (Nairobi)
> *As a youth in Nairobi attending my first Fana Ka rap battle event, I want to create a wallet safely without risking my assets, submit my first eco-ops check-in, and see where in the galaxy my virtual settlement is located — so that I feel I have a stake in this world and a reason to return.*

### 12.2 Eco Advocate (Lamu, Kenya — Uni-Kibaoni-Peace-Youth-SHG)
> *As a field worker logging water quality data for the Mpeketoni recycling proposal, I want my check-ins to automatically generate on-chain certifications and contribute toward my settlement's water infrastructure objects — so that my real work visibly builds something in the metaverse and supports the funding case for the recycling center.*

### 12.3 Visual Artist
> *As a visual artist collaborating on "Pain in the Ghetto," I want to mint my artwork as NFTs, display them in my orbital gallery settlement module, and invite community members to attend a virtual opening through the wormhole transit system — so that my work has both cultural reach and an aftermarket revenue stream.*

### 12.4 Facilitator
> *As a workshop facilitator running an ecocity module on aquaponics, I want to host the session at my virtual settlement so that remote participants can transit in via wormhole, receive a POAP for attendance, and earn an IBC Aquaponics NFT object for their own settlement — so that learning has a visible, persistent result in their space.*

### 12.5 Settlement Builder
> *As a participant who has been active for three months, I want to customise the surface colours and layout of my dome, arrange my earned settlement objects, and prepare placeholder spaces for upcoming airdrop objects — so that my settlement feels personal, alive, and worth showing to others.*

### 12.6 Science Celebrant
> *As a token holder who proposed a location in the TRAPPIST-1 system before an exomoon confirmation was announced, I want to be celebrated with a special airdrop event — including rare NFTs tied to the scientific data — and have my eco-ops activity highlighted in the event coverage — so that proposing locations feels meaningful and my community work gets amplified.*

---

## 13. Open Questions / Future Development

- **Proposed planet protocol** — staking mechanism, confirmation trigger, airdrop automation
- **Soul orb design** — visual language for participant presence in the settlement dome
- **Ecommunity DAO** — governance token distribution, proposal mechanism, voting UI
- **ecocity ↔ exotopia object pipeline** — how new ecocity designs are approved, packaged as NFTs, and made available to settlements
- **Cross-platform identity** — unified address/profile readable by exotopia, pon.ink, and ecocity with appropriate privacy controls
- **Great void / cosmic view** — rendering approach for large-scale structure (particle systems, procedural filaments)
- **Wormhole whitelist management** — who controls transit permissions, how users earn/grant access to their settlement
- **Offline-first eco-ops** — field check-in without network, sync on reconnect
- **Multi-language UI** — Swahili and Patois localisation priority

---

---

## 14. Exoplanet Sky Data Spec — Star Positions & Constellations from Exo-Surface

### Purpose

Every settlement in Level 4 / Level 5 renders a night sky that is **accurate for that exoplanet's location in the galaxy**. This means:

- Stars appear at the directions they would *actually* appear from that vantage point, not from Earth.
- Apparent brightness is correct for the distance between that exoplanet and each catalog star.
- The host star system (single / binary / trinary / rogue) is correctly characterised as the primary light source.
- Constellation line patterns from Earth are shown "distorted" by parallax — nearby stars shift dramatically, distant ones barely move.
- An additional layer of *Exotopia custom constellations* provides cultural/narrative identity for each major settlement location.

This section specifies the data required, the coordinate transform algorithm, the output JSON schema, and the design of the Python pipeline that generates one sky file per exoplanet.

---

### 14.1 The Core Problem: Parallax Shift

When we move from Earth to a star system 500 parsecs away, every other star in the sky appears to shift its position. A star that is 2 pc from the exoplanet (but 502 pc from Earth) will appear to move almost 90° across the sky. A star that is 10,000 pc away from both Earth and the exoplanet will barely move at all.

The mathematical operation is:

```
# 1. Convert each catalog star to 3D Cartesian (ICRS, parsecs, origin = Sun/Earth)
x_star = d_star * cos(Dec_star) * cos(RA_star)
y_star = d_star * cos(Dec_star) * sin(RA_star)
z_star = d_star * sin(Dec_star)

# 2. Convert exoplanet host star to 3D (same frame)
x_planet = d_planet * cos(Dec_host) * cos(RA_host)
y_planet = d_planet * cos(Dec_host) * sin(RA_host)
z_planet = d_planet * sin(Dec_host)

# 3. Vector from exoplanet to catalog star
dx = x_star - x_planet
dy = y_star - y_planet
dz = z_star - z_planet
d_from_planet = sqrt(dx² + dy² + dz²)

# 4. Convert back to apparent RA/Dec as seen from exoplanet
Dec_apparent = degrees(asin(dz / d_from_planet))
RA_apparent  = degrees(atan2(dy, dx)) % 360

# 5. Apparent magnitude from exoplanet
#    (using known Earth apparent magnitude and Earth/planet distances)
m_from_planet = m_earth + 5 * log10(d_from_planet / d_earth)
#    If only absolute magnitude M is known:
m_from_planet = M + 5 * log10(d_from_planet) - 5
```

**Stars without known distance (no parallax):** Treat as infinitely distant — their RA/Dec is unchanged, magnitude unchanged. Flag these in the output.

**Planet orbital offset from host star:** The planet's orbit is a few AU from its host star. At parsec scale, this offset is negligible (1 AU ≈ 0.000005 pc). The host star position can be used directly as the observer origin.

---

### 14.2 Input Data Required

#### 14.2.1 Exoplanet Catalog (already available)

From `public/exoplanets-viz.json` (derived from NASA Exoplanet Archive):

| Field | Type | Notes |
|---|---|---|
| `pl_name` | string | Planet name, e.g. `"Kepler-452 b"` |
| `hostname` | string | Host star name, e.g. `"Kepler-452"` |
| `ra` | float | Host star RA (degrees, J2000) |
| `dec` | float | Host star Dec (degrees, J2000) |
| `sy_dist` | float \| null | Distance from Earth (parsecs) |
| `st_teff` | float \| null | Host star effective temperature (K) — for host system rendering |
| `st_rad` | float \| null | Host star radius (solar radii) — for angular diameter |
| `sy_snum` | int | Number of stars in system (1 = single, 2 = binary, 3 = trinary) |
| `pl_eqt` | float \| null | Planet equilibrium temperature (K) — affects atmosphere tint |

**Missing `sy_dist`:** If null, no sky JSON can be generated accurately. Skip and flag. (Approximately 8% of the archive lacks parallax/distance.)

**Binary / trinary systems:** If `sy_snum > 1`, additional component stars must be looked up in Hipparcos / WDS (Washington Double Star Catalog) by host star name or sky coordinate cross-match. Each component star appears as a "sun" in the exoplanet sky.

#### 14.2.2 Star Catalog — Hipparcos (HIP)

**Recommended source:** Hipparcos Main Catalog (ESA, VizieR catalogue I/239). 118,218 entries, all with parallax.

Download via: `astroquery.vizier` or direct FTP from `cds.unistra.fr`.

Required fields per star:

| HIP Field | Description | Unit |
|---|---|---|
| `HIP` | Hipparcos identifier | integer |
| `RArad` | Right ascension, ICRS, J1991.25 epoch | radians |
| `DErad` | Declination, ICRS, J1991.25 epoch | radians |
| `Plx` | Trigonometric parallax | mas |
| `e_Plx` | Parallax standard error | mas |
| `Vmag` | Johnson V magnitude | mag |
| `B-V` | B–V colour index | mag |
| `SpType` | Spectral type string | — |
| `pmRA` | Proper motion RA component | mas/yr |
| `pmDE` | Proper motion Dec component | mas/yr |

**Derived fields (computed by pipeline):**

| Field | Formula |
|---|---|
| `dist_pc` | `1000.0 / Plx` if `Plx > 1.0 mas`, else `null` |
| `abs_mag` | `Vmag - 5 * log10(dist_pc / 10)` if `dist_pc` known |
| `teff_approx` | From B–V via colour–temperature calibration table |
| `color_hex` | From `teff_approx` via spectral class mapping |

**Magnitude cutoff for output:**  
Stars with `Vmag > 8.0` as seen from Earth, AND adjusted magnitude from exoplanet `> 9.0`, can be omitted. This keeps file sizes manageable (~3,000–8,000 stars per planet) while preserving all naked-eye and binocular stars.

**Stars without reliable parallax (`Plx < 1.0 mas` or `e_Plx / Plx > 0.3`):**
Include in output but flag as `"parallax_uncertain": true`. Position treated as Earth-apparent (no shift applied).

#### 14.2.3 Constellation Line Data

**IAU constellation boundaries:** Used to assign each star to its Earth constellation. Download from `cds.unistra.fr/viz-bin/cat/VI/49`.

**Constellation stick figures (line patterns):** No official IAU source — use either:
- The H.A. Rey / IAU merged dataset (available via `stellarium` GitHub: `skycultures/western/constellationship.fab`)
- Custom simplified set built from HIP pairs for the 48 prominent constellations

Each line is a pair of HIP identifiers. These pairs are re-used with new apparent RA/Dec values per exoplanet — the topology stays the same, only the positions change.

**Exotopia custom constellations:** Stored in a separate community-maintained JSON (to be developed). Each entry has a `name`, `lore`, `community_author`, and `lines` (HIP pairs). These are settlement-specific cultural assets.

---

### 14.3 Host Star System Types

The pipeline must classify each exoplanet's star system and encode it in the output. This drives how the sky renderer places "suns" and computes daytime sky.

| `type` value | Description | Sky rendering |
|---|---|---|
| `"single"` | One host star | One arc across the sky; one sunrise/sunset colour |
| `"binary_close"` | Two stars within ~1 AU of each other | Appear as one bright object; handle as single for sky purposes |
| `"binary_wide"` | Two stars separated by 1–1000 AU | Two distinct "suns"; separate arcs, overlapping twilight bands |
| `"trinary"` | Three stars | Three suns; the third may appear as a very bright "night star" if its orbit is wide |
| `"rogue"` | No host star (free-floating planet) | No sun in sky; extremely dark, all-stars night; Sun appears as dim catalog star |
| `"unknown"` | `sy_snum` null, can't determine | Treat as `single`; flag for review |

**Rogue planet detection:** In the NASA archive, `sy_snum = 0` or host star distance/position unavailable and no identified host. The pipeline should flag these explicitly.

**For binary / trinary systems**, include each component star in `host_system.stars[]` with its own:
- Sky position expressed as approximate separation angle from primary (derived from WDS or Hipparcos cross-match)
- Apparent magnitude from planet surface
- Spectral type

---

### 14.4 Output JSON Schema

**File naming:** `public/sky/[hostname-slug].json`  
Example: `public/sky/kepler-452.json`, `public/sky/proxima-cen.json`

**Slug rule:** lowercase, spaces and special chars → `-`, strip `*` and `+` suffixes.

```jsonc
{
  "meta": {
    "hostname":          "Kepler-452",
    "pl_name":           "Kepler-452 b",
    "generated":         "2026-04-19T00:00:00Z",
    "generator_version": "1.0.0",
    "catalog":           "HIP",
    "coord_epoch":       "J2000.0",
    "star_count":        4821,
    "cutoff_app_mag":    9.0,
    "host_dist_pc":      430.0,
    "sky_complete":      true    // false if sy_dist was null (estimated or missing)
  },

  "host_system": {
    "type": "single",            // see 14.3
    "stars": [
      {
        "id":            "Kepler-452",
        "spectral_type": "G2V",
        "teff":          5757,
        "st_rad":        1.11,   // solar radii; null if unknown
        "app_mag_from_planet": -26.7,   // magnitude as seen from planet surface
        "color_hex":     "#fff4ea",
        "note":          "Primary host star — rendered as moving sun in sky"
      }
    ]
  },

  "stars": [
    {
      "hip":                 27989,
      "name":                "Sirius",          // null if unnamed
      "bayer":               "α CMa",           // null if no Bayer designation
      "app_ra":              101.287,   // apparent RA from exoplanet (degrees, 0–360)
      "app_dec":             -16.716,   // apparent Dec from exoplanet (degrees)
      "app_mag":             -1.46,     // apparent magnitude from exoplanet
      "abs_mag":              1.42,     // absolute magnitude (null if no parallax)
      "spectral":            "A1V",
      "teff":                9940,
      "color_hex":           "#cad7ff",
      "dist_from_planet_pc":  2.67,    // distance from exoplanet (null if no parallax)
      "dist_from_earth_pc":   2.64,    // original catalog distance
      "earth_ra":            101.287,  // original Earth RA — compare to app_ra to see shift
      "earth_dec":           -16.716,
      "pos_shift_deg":         0.04,   // total angular displacement from Earth's perspective
      "earth_constellation": "CMa",   // IAU 3-letter abbreviation
      "parallax_uncertain":  false     // true if Plx/e_Plx < 3 (unreliable distance)
    }
    // ... up to ~8000 entries sorted brightest-first by app_mag
  ],

  "constellations": {
    "earth": [
      {
        "id":    "Ori",
        "name":  "Orion",
        "lines": [
          [27989, 25930],   // HIP pairs — renderer looks up app_ra/app_dec from stars[]
          [25930, 26727]
        ]
      }
      // ... all 88 constellations, but only those with ≥2 stars in the output set
    ],
    "exotopia": [
      {
        "id":              "the-wormhole",
        "name":            "The Wormhole",
        "community":       "Fana Ka",
        "lore":            "The great spiral gate at the edge of the void, visible only from systems near the Boötes Void approach.",
        "lines": [
          [71683, 72511],
          [72511, 70890]
        ]
      }
      // ... community-defined; stored separately, merged at generation time
    ]
  },

  "nearby_alerts": [
    // Stars that are unusually close to this exoplanet (<5 pc) and thus
    // appear dramatically brighter/shifted vs. their Earth appearance.
    {
      "hip":                 71683,
      "name":                "Alpha Centauri A",
      "dist_from_planet_pc":  0.31,
      "app_mag":              -4.8,
      "pos_shift_deg":       12.4,
      "note":                "Extremely bright — appears as prominent night star"
    }
  ]
}
```

---

### 14.5 Python Pipeline Design

**Script:** `generate_sky_data.py`  
**Inputs:** `public/exoplanets-viz.json` + Hipparcos catalog (downloaded once, cached locally)  
**Output:** one JSON file per exoplanet in `public/sky/`

#### 14.5.1 Pipeline Steps

```
1. SETUP
   - Load Hipparcos catalog into a pandas DataFrame
   - Precompute 3D Cartesian coords for all HIP stars with Plx > 1.0 mas
   - Load constellation line table (HIP pairs) — one-time load
   - Load Exotopia custom constellation definitions (if available)
   - Load existing exoplanets-viz.json

2. FOR EACH EXOPLANET (or a specified subset):

   a. VALIDATE
      - Skip if sy_dist is null (flag in a skipped.log)
      - Skip if ra or dec is null

   b. COMPUTE HOST STAR 3D POSITION
      - (x_p, y_p, z_p) = spherical_to_cartesian(ra, dec, sy_dist)

   c. CLASSIFY HOST SYSTEM TYPE
      - Use sy_snum to determine single / binary / trinary / rogue
      - Look up secondary star data from WDS cross-match if sy_snum > 1

   d. FOR EACH CATALOG STAR:
      - Compute relative vector: (dx, dy, dz) = star_xyz - planet_xyz
      - Compute d_from_planet = magnitude of relative vector
      - Compute app_ra, app_dec from atan2 / asin
      - Compute adjusted app_mag = m_earth + 5 * log10(d_from_planet / d_earth)
      - Compute pos_shift_deg = angular_separation(earth_ra, earth_dec, app_ra, app_dec)
      - Skip if adjusted app_mag > CUTOFF (9.0)

   e. SORT output star list by app_mag ascending (brightest first)

   f. BUILD constellation entries
      - Earth: include all 88, but only lines where both HIP members are in output set
      - Exotopia: merge from community definitions file

   g. COLLECT nearby_alerts (dist_from_planet_pc < 5.0)

   h. WRITE JSON to public/sky/[slug].json

3. GENERATE INDEX
   - Write public/sky/index.json listing all available sky files:
     { "kepler-452": { "hostname": "Kepler-452", "pl_name": "Kepler-452 b", "star_count": 4821 }, ... }
```

#### 14.5.2 Key Library Dependencies

| Library | Use |
|---|---|
| `astropy` | Coordinate transforms (SkyCoord, ICRS), unit handling |
| `astroquery` | Download Hipparcos from VizieR (one-time cache) |
| `numpy` | Vectorised 3D math on all 118k stars at once |
| `pandas` | Catalog filtering, sorting, merging |
| `json` | Output serialisation |

#### 14.5.3 Performance Notes

- **Vectorise the inner loop.** With numpy, the 3D transform across all 118k stars for one exoplanet takes ~50ms. Do not use a Python for-loop per star.
- **Cache Hipparcos locally.** Download once to `data/hipparcos.csv` — the VizieR file is ~20MB.
- **Batch by distance.** For exoplanets > 2000 pc from Earth, few catalog stars will be within 10 pc of the planet. The nearby_alerts list will usually be empty. For exoplanets < 50 pc, use a tighter cutoff (mag 6.5) to reduce file size.
- **Expected file sizes:** ~80–350 KB per planet (uncompressed). Gzip on delivery reduces to ~20–90 KB.
- **Total output (all 6,158 planets):** ~1–2 GB uncompressed. A practical first run should target the ~800 planets with confirmed `sy_dist` and at least one community settlement.

#### 14.5.4 Handling Rogue Planets

For rogue planets (`sy_snum = 0` or no identified host):
- Set `host_system.type = "rogue"`
- `host_system.stars = []`
- The observer origin is the planet's galactic position. If RA/Dec/distance are available (even estimated), the same pipeline runs.
- From a rogue planet surface, our own Sun (HIP 0 / not in Hipparcos, but can be added as a synthetic entry at RA=0, Dec=0, d_pc = sy_dist) would appear as a dim catalog star.

---

### 14.6 Integration with the Visualization

#### 14.6.1 Loading Strategy

`SurfaceViewPage.vue` currently builds its star field from the galaxy store (all exoplanet host stars as catalog points). This is replaced / augmented when a sky JSON file is available:

```
1. On mount, attempt fetch: GET /sky/[hostname-slug].json
2. If 200 → use sky JSON star list (accurate positions + magnitudes from planet)
3. If 404 → fall back to current galaxy-store star field (Earth-apparent positions)
4. Show an indicator in the UI: "Sky: accurate from exo-surface" vs "Sky: Earth-apparent (no data)"
```

#### 14.6.2 Renderer Changes Required

- `addStarField()` needs a new code path: accept a `SkyData.stars[]` array and place each star at `raDecToVec3(app_ra, app_dec, 900)` with size proportional to `app_mag`.
- Constellation lines: a new `addConstellationLines()` function draws line segments connecting HIP pairs at their new `app_ra / app_dec` positions.
- Nearby alerts: stars with `dist_from_planet_pc < 2` rendered slightly larger with a faint glow (they are genuinely much brighter from this location).

#### 14.6.3 Host System Rendering

The existing `addHostStar()` already handles single-star arc animation. Extensions needed:

| System type | Extension |
|---|---|
| `binary_wide` | Two `hostStarMesh` instances animated on offset arcs; secondary star dimmer |
| `binary_close` | Single star mesh; slightly enlarged corona; label notes "binary" |
| `trinary` | Three meshes; the third may orbit slower and appear as a "night star" that moves independently |
| `rogue` | No `addHostStar()` call; uniform dark sky; no directional light source |

---

### 14.7 Constellation Culture System

Constellations are not merely scientific data — in the Exotopia context they are **cultural artefacts** belonging to each settlement community.

| Layer | Source | Visibility |
|---|---|---|
| **Earth (Western IAU)** | Generated by pipeline | All users — toggle on/off |
| **Earth (Indigenous / alternate)** | Community-submitted HIP-pair tables | Optional cultural layer |
| **Exotopia custom** | Community-maintained JSON, one per major system | Shown by default in settlement view |

**Exotopia constellation submission format** (for community builders):

```jsonc
// public/sky/exotopia-constellations/[system-slug].json
{
  "system": "kepler-452",
  "constellations": [
    {
      "id": "the-wormhole",
      "name": "The Wormhole",
      "community": "Fana Ka",
      "author": "street-poets-collective",
      "lore": "...",
      "lines": [
        [71683, 72511],
        [72511, 70890]
      ]
    }
  ]
}
```

These files are merged into the main sky JSON at generation time and updated whenever a community submits a new constellation.

---

### 14.8 Data Availability Summary

| Data | Source | Status |
|---|---|---|
| Exoplanet positions (RA, Dec, dist) | NASA archive → `exoplanets-viz.json` | ✅ Available |
| Hipparcos star catalog (118k stars) | ESA / VizieR I/239 | ⬇ To download |
| Constellation line table (HIP pairs) | Stellarium `constellationship.fab` | ⬇ To convert |
| WDS binary star components | VizieR B/wds | ⬇ To download (binary systems only) |
| Exotopia custom constellations | Community-maintained | 🔲 To create |
| Sky index (`public/sky/index.json`) | Generated by pipeline | 🔲 To generate |

**First-run priority:** Generate sky files for the ~50 exoplanet systems that have confirmed settlements assigned in `ot6.json`, plus the 10 nearest exoplanet systems by parsec distance (highest visual impact — most star positions shifted).

---

---

## 15. Exomoon Data Spec — Natural Satellites from Settlement View

### 15.1 Why Exomoons Matter to the Visualization

From a settlement on an exoplanet, any natural satellites (moons) are the most prominent objects in the night sky after the host star(s). They cross the horizon on timescales of hours to weeks, are bright enough to cast shadows, and in gas-giant systems produce dramatic multi-moon scenes. The settlement view must render these accurately.

### 15.2 Current Data Availability

| Source | What it provides | Limitation |
|---|---|---|
| NASA Exoplanet Archive (`sy_mnum`) | Total moon count for the *system* | Count only — no individual moon parameters |
| NASA Exoplanet Archive individual rows | No moon-specific fields | Archive does not yet track exomoon orbital data |
| Confirmed exomoon candidates (2026) | Kepler-1625b-i, Kepler-1708b-i (both disputed) | No confirmed orbital parameters suitable for rendering |
| Solar system moon analogs | Jupiter, Saturn, Uranus, Neptune moon systems | Used as templates for type-based generation |

**Current fallback strategy (implemented):** Generate moon count and orbital parameters procedurally from planet type, using `sy_mnum` if known and non-zero, otherwise estimating by planet class:

| Planet class | Moon count estimate | Basis |
|---|---|---|
| Hot Jupiter (eqt > 1200 K) | 0 | Tidal disruption zone within ~0.5 AU |
| Gas giant / cold | 2–4 | Jupiter/Saturn analogy |
| Super-Earth (1.6–3.5 R⊕) | 0–2 | Mixed evidence; speculative |
| Rocky Earth-analog | 0–1 | Earth/Mars analogy (~45% probability of 1 moon) |

### 15.3 Exomoon Orbital Parameters Required

When confirmed exomoon orbital data becomes available (via dedicated surveys, PLATO, or Roman Space Telescope), the sky JSON (Section 14.4) should be extended with an `"exomoons"` array:

```jsonc
"exomoons": [
  {
    "name":                  "Kepler-1625b-i",
    "confirmed":             false,           // true = confirmed; false = candidate
    "reference":             "Teachey & Kipping 2018",
    "radius_earth":          3.97,            // moon radius in Earth radii
    "mass_earth":            null,            // null if unknown
    "orbital_period_days":   21.3,            // period around host planet
    "orbital_sma_km":        1900000,         // semi-major axis (km)
    "orbital_incl_deg":      3.0,             // orbital inclination
    "eccentricity":          0.0,             // assumed circular if unknown
    "albedo":                0.3,             // geometric albedo; null if unknown
    "teff":                  null,            // surface temperature (K) if known
    "spectral_type":         null,            // null for most
    "color_hex":             "#c8b898",       // derived from albedo/temperature
    "app_mag_from_planet":   -10.2,           // apparent magnitude from planet surface (full phase)
    "angular_diam_arcmin":    2.1,            // apparent angular diameter from surface
    "note":                  "Neptune-sized; plausible but unconfirmed"
  }
]
```

**Derived rendering parameters** (computed from physical data):

| Rendering param | Derivation |
|---|---|
| `radiusViz` (scene units) | `angular_diam_arcmin * scale_factor`; nominal ~3 units per arcminute at sky radius 900 |
| `orbitalPeriodDays` | Direct from `orbital_period_days` |
| `inclDeg` | Direct from `orbital_incl_deg` |
| `brightness` | Derived from `app_mag_from_planet`; phase function applied each frame |

### 15.4 Moon Sky Rendering Design

Moons are placed at the **same depth layer as the star field** (distance 900 scene units from camera origin) and updated every frame. This makes them appear as sky objects, not settlement objects.

**Horizon crossing:** The `skyPosition(inclDeg, hourAngle, 0)` function computes the moon's direction vector. The moon is hidden when `dir.y < -0.087` (5° below horizon) to prevent pop-in artefacts.

**Orbital phase formula:**
```
moonPhase = (initialPhaseDeg + localTimeDeg / orbitalPeriodDays) % 360
hourAngle = (moonPhase / 360) × 2π − π
```
- `localTimeDeg` (0–360) = one full planet rotation
- Slower moons (`orbitalPeriodDays` >> 1) move slowly relative to the sky background
- Fast inner moons (`orbitalPeriodDays` ≈ 0.5) may cross the sky multiple times per day

**Future enhancements (not yet implemented):**
- Phase shadow (illuminated crescent based on host-star direction relative to moon angle)
- Moon glow / albedo-based brightness variation during orbit
- Eclipse event detection (moon passes through planet shadow)
- Tidal locking indicator (same face always toward planet)

### 15.5 Moon Data Source Priority (Python pipeline)

The sky JSON generator (`generate_sky_data.py`) should resolve moon data in this priority order:

```
1. Confirmed exomoon orbital parameters (future — watch NASA archive updates)
2. sy_mnum from NASA archive + type-based orbital parameter generation
3. Zero moons (safe default for hot Jupiters and data-absent cases)
```

---

## 16. Planet Interior & Subsurface Spec

### 16.1 Current Problem

The terrain in the settlement view is a `PlaneGeometry` — a thin surface with no depth. When the camera passes below the terrain surface (through a canyon, at an oblique angle, or in underground-adjacent views), the interior of the planet is visible as empty space. The current temporary fix is an opaque cylinder (`CylinderGeometry`, radius 1400, 80 units thick) positioned below `terrainBaseY` to block this view.

### 16.2 Planet Interior Layer Model

A scientifically grounded planet interior has distinct compositional layers. The rendering should eventually represent these — both for visual richness and for educational value in the ecocity context.

| Layer | Earth analog depth | Composition | Approximate temperature | Visual |
|---|---|---|---|---|
| **Crust** | 0–70 km | Silicate rock (granite, basalt) | 0–900 °C | Terrain surface — already rendered |
| **Lithospheric mantle** | 70–250 km | Peridotite (olivine + pyroxene) | 900–1400 °C | Dark olive-green rock |
| **Asthenosphere** | 250–700 km | Partially molten silicate | 1400–1600 °C | Deep brown-red, faint glow |
| **Lower mantle** | 700–2900 km | High-pressure silicates, oxides | 1600–3700 °C | Dark red, dim emission |
| **Outer core** | 2900–5100 km | Liquid iron-nickel | 3700–5000 °C | Bright orange-red, emissive |
| **Inner core** | 5100–6370 km | Solid iron-nickel | ~5000–6000 °C | Near-white metallic glow |

**For non-Earth-analog planets:**

| Type | Interior variation |
|---|---|
| Hot Jupiter / gas giant | No solid surface; layers are gas → liquid hydrogen → metallic hydrogen → rocky/iron core |
| Super-Earth | Deeper mantle; possibly "water layer" (high-pressure ice or steam ocean) between crust and mantle |
| Ultra-hot rocky (eqt > 1500 K) | Magma ocean at surface; no solid crust; lava ocean layer instead of lithospheric mantle |
| Ice world (eqt < 100 K) | Surface ice → liquid water ocean (subsurface) → rock/iron core |
| Carbon planet | Silicon carbide mantle; diamond layer between mantle and core |

### 16.3 Data Sources for Interior Models

| Model | Source | Notes |
|---|---|---|
| Earth-like interior | Standard PREM model (Dziewonski & Anderson 1981) | Free; well-established |
| Super-Earth interior | Seager et al. 2007 (ApJ 669, 1279) | Mass-radius relations for silicate/iron compositions |
| Water worlds | Grasset et al. 2010; Fu et al. 2010 | High-pressure ice phases |
| Hot Jupiter / gas giant | Fortney et al. 2007 | Density-radius relations |

The Python pipeline should assign an interior type per planet based on radius + mass + equilibrium temperature, following the Fortney/Seager mass-radius diagrams.

### 16.4 Planned Interior JSON Schema

To be generated by the Python pipeline alongside the sky JSON:

```jsonc
// public/interior/[hostname-slug].json
{
  "pl_name":        "Kepler-452 b",
  "interior_type":  "rocky_superearth",   // see 16.2 type list
  "radius_km":      8340,                 // derived from pl_rade * 6371
  "layers": [
    {
      "name":          "Crust",
      "depth_km_top":    0,
      "depth_km_base":  80,
      "composition":   "basaltic silicate",
      "temp_K_top":     300,
      "temp_K_base":   1100,
      "color_hex":     "#3a2818",
      "emissive_hex":  null,
      "opacity":       1.0
    },
    {
      "name":          "Mantle",
      "depth_km_top":   80,
      "depth_km_base": 3500,
      "composition":   "peridotite, high-pressure silicates",
      "temp_K_top":    1100,
      "temp_K_base":   4500,
      "color_hex":     "#5c2010",
      "emissive_hex":  "#200808",
      "opacity":       1.0
    },
    {
      "name":          "Outer Core",
      "depth_km_top":  3500,
      "depth_km_base": 7200,
      "composition":   "liquid iron-nickel",
      "temp_K_top":    4500,
      "temp_K_base":   5800,
      "color_hex":     "#c04010",
      "emissive_hex":  "#601808",
      "opacity":       1.0
    },
    {
      "name":          "Inner Core",
      "depth_km_top":  7200,
      "depth_km_base": 8340,
      "composition":   "solid iron-nickel",
      "temp_K_top":    5800,
      "temp_K_base":   6200,
      "color_hex":     "#e0a040",
      "emissive_hex":  "#806020",
      "opacity":       1.0
    }
  ]
}
```

### 16.5 Renderer Integration Plan (Future)

Three.js implementation approach for the full interior:

1. **Planet sphere**: Replace the temporary opaque cylinder with a full sphere sized to the terrain radius (currently 2000 scene units diameter), composed of concentric `SphereGeometry` shells — one per interior layer.

2. **Cross-section view** (new Level 3.5 feature): When user clicks "Descend" button, the camera transitions through a vertical tunnel cut through the planet, revealing each layer as it passes. This would be an animated camera path along the Y-axis, with each layer's geometry fading in as the camera enters it.

3. **Layer materials**:
   - Crust: `MeshPhongMaterial`, flat-shaded, palette-matched to surface terrain
   - Mantle: `MeshStandardMaterial`, roughness 0.9, faint emissive red-brown
   - Outer core: `MeshStandardMaterial` with animated emissive pulse (same technique as pyramid light)
   - Inner core: `MeshStandardMaterial`, metallic 0.8, emissive white-orange, strong inner glow

4. **Temporary fix (implemented now)**: `CylinderGeometry` bedrock disc at `terrainBaseY - 40`, radius 1400, opaque terrain-color material — blocks all underground views without the complexity of a full spherical interior.

### 16.6 Science Education Integration

The planet interior connects to ecocity.com's earth-systems educational content:

- Settlement view tooltip when hovering near terrain edge: brief interior composition note ("This planet likely has a magma ocean beneath your feet")
- Interior cross-section available as a dedicated **EcoOps Science Module** (workshop content)
- On-chain certification for completing the interior science module
- Gas giant planets show a "no solid surface" warning when user attempts to navigate to settlement view — offer an **orbital station view** instead

---

## 17. Surface Navigation & Live Avatar Communication

### 17.1 What We Are Building and Why

The settlement view today renders a scene: terrain, dome, buildings, water, moons in the sky. A user can look around and click on objects, but they are alone. The next leap is making settlements **inhabited** — places where real people appear as recognisable presences, can move, communicate, attend events, and learn together.

This matters to SCD Hub for a specific reason: the communities we serve — Fana Ka in Nairobi, Uni-Kibaoni in Lamu, OT Kulcha studio participants — are accustomed to showing up in a *place* and being *seen*. A rap battle is not just an audio file. A recycling centre proposal is not just a document. Physical and social presence is the substance of these activities. The settlement must eventually carry that weight — a place you go to be with others, not just a visualization you watch.

Live avatar communication is not a gaming feature. It is the spatial layer that makes eco-ops check-ins, workshop attendance, event participation, and community governance **feel real and worth returning to**.

---

### 17.2 Design Principles for This Feature Area

These principles are specific to navigation and presence, and operate within the broader project principles of Section 0.

**Presence before appearance.**
Being visibly present in a shared space is the primary value. A coloured orb with a name tag that updates in near-real-time is more useful than a high-fidelity avatar that requires a stable 4G connection. Always ship the lowest fidelity version of presence first.

**Events drive multiplayer, not the other way around.**
Do not build an always-on multiplayer world and expect people to show up. Build event-scheduled presence — when a Fana Ka battle or an ecocity workshop is happening, that event creates a context for people to be in the same virtual space. Presence outside events is a bonus, not a requirement in early phases.

**Every phase must work on a mid-range Android on 3G.**
This is not a performance preference — it is a community equity requirement. Participants in Lamu and Nairobi should not have a degraded experience because they lack a flagship phone or fibre connection. Every phase must be tested at 3G data rates (~1 Mbps, ~150ms latency) before release.

**Roles shape avatars, not cosmetics.**
Avatar appearance communicates function, not fashion. A Facilitator's avatar should be visually distinct from a Participant's not because of arbitrary style but because it tells other attendees who to approach for help. Avatar customisation layered on top of role identification, not instead of it.

**The settlement is a learning space first.**
Avatar interactions must create pathways into educational content, not distract from them. Standing near the library opens a module. Standing near the pyramid triggers transit. Approaching the water feature shows eco-ops data. Movement through the space is a curriculum.

**Build toward interoperability, not lock-in.**
Avatar identity must be portable. The underlying representation (position, role, owned objects) must eventually be readable by pon.ink and ecocity.com. Choose data structures that a future cross-platform identity layer can consume.

---

### 17.3 Current State: Phase 0 (Implemented)

The existing settlement renders five **soul orbs** — coloured glowing spheres that orbit the library building at low altitude. These represent the *concept* of participant presence but are not connected to any real user data. They serve as:

- A visual placeholder for the avatar system
- A proof of concept for the "settlement is inhabited" feeling
- An anchor point for the progressive rollout

**What Phase 0 does not have:**
- Any connection to real user identity or session data
- Real-time position updates
- Interactivity beyond the orb hover tooltip
- Any multiplayer or communication layer

Phase 0 is essentially a mockup of what Phase 1 will make real.

---

### 17.4 Avatar System Design

#### 17.4.1 The Orb-First Avatar Model

Rather than building a humanoid 3D avatar and stripping it down for low-bandwidth, we start with the soul orb as the *canonical avatar representation* and progressively add fidelity.

```
Phase 0  →  Static coloured sphere (no identity)
Phase 1  →  Coloured sphere + name tag (identity via pon.ink user)
Phase 2  →  Sphere + name tag + role ring + position sync (2 Hz)
Phase 3  →  Orb with directional indicator + gesture state + voice activity
Phase 4  →  Stylised low-poly humanoid mesh — opt-in, wifi+ users
Phase 5  →  Full avatar with NFT wearables — future, high-end devices only
```

At every phase, the orb is the **guaranteed fallback**. A Phase 4 user visiting a Phase 1 settlement sees orbs for all participants. Fidelity is additive, never required.

#### 17.4.2 Avatar Visual Language by Role

Each role from Section 2 is assigned a distinct orb signature:

| Role | Core colour | Ring / aura | Label colour |
|---|---|---|---|
| Participant | `#5588ff` blue | None | White |
| Facilitator | `#00ffcc` cyan-green | Pulsing outer ring | Bright cyan |
| Visual Artist | `#ff88ee` pink-magenta | Slow colour-shift | Magenta |
| DJ / Sound Artist | `#ffcc44` amber | Bounces to audio beat | Amber |
| Eco / Health Educator | `#55ffaa` green | Small orbiting data dot | Green |
| Mentor | `#ffffff` white | Double ring, faint gold | Gold |
| Promoter | `#ff6644` orange | Broadcast wave pulse | Orange |
| Administrator | `#aabbcc` grey-blue | Geometric ring | Grey-blue |

The orb colour and ring pattern are computed from the user's role in the pon.ink system. This means the avatar is always consistent across sessions — no setup required from the user.

#### 17.4.3 Avatar Data Schema (Supabase `presence` table)

```sql
CREATE TABLE settlement_presence (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users,
  hostname      text NOT NULL,
  planet_name   text NOT NULL,
  event_id      uuid REFERENCES events(id) NULLABLE,
  joined_at     timestamptz DEFAULT now(),
  last_seen     timestamptz DEFAULT now(),
  pos_x         float DEFAULT 0,    -- scene X coordinate
  pos_z         float DEFAULT 0,    -- scene Z coordinate (Y is terrain height)
  heading_deg   float DEFAULT 0,    -- facing direction
  role          text NOT NULL,
  display_name  text NOT NULL,
  gesture_state text DEFAULT 'idle' -- idle | wave | point | sit | raise_hand
);
CREATE INDEX ON settlement_presence(hostname, planet_name, last_seen);
```

Presence records older than 30 seconds without a `last_seen` update are considered stale and hidden from other participants. This creates natural "offline" behaviour without explicit disconnect handling.

---

### 17.5 Surface Navigation

#### 17.5.1 Camera and Movement Modes

Three movement modes are available. The mode toggles in the existing bottom control bar:

| Mode | Icon | Description | Best for |
|---|---|---|---|
| **Explore** (current) | `panorama_horizontal` | OrbitControls — look around from a fixed point, pan to reposition | Desktop discovery, casual viewing |
| **Walk** | `directions_walk` | First-person: WASD or touch joystick; camera at eye height | Active participation, events |
| **Observe** | `filter_center_focus` | Zenith look-up (current "zenith" mode) | Sky watching, orientation |

Walk mode is the new mode required for avatar-based navigation. In Walk mode:
- The user has a *local avatar* at a position on the terrain
- Camera follows 1.8m above and slightly behind the avatar (third-person) or switches to first-person on tap
- Movement is controlled by input (see 17.5.2)
- The user's position is broadcast to other participants

#### 17.5.2 Input Controls

**Desktop:**
- `WASD` — forward/back/strafe
- Mouse drag — look direction
- `E` — interact with nearest object
- `Space` — gesture (cycle through: wave → point → sit → idle)
- `V` — toggle voice (Phase 3+)

**Mobile:**
- Fixed left-side virtual joystick (thumb area) — movement
- Right-side drag — look direction
- Tap on distant point — navigate to (pathfinding along terrain, Phase 3)
- Bottom action row — interact / gesture / voice buttons

**Accessibility fallbacks:**
- Arrow keys equivalent to WASD
- On-screen directional pad alternative to joystick
- All actions available via UI buttons (no keyboard-only requirement)

#### 17.5.3 Terrain Surface Following

The avatar's Y position is constrained to the terrain surface. Implementation:

```ts
// Raycasting downward from avatar position to find terrain height
const ray = new THREE.Raycaster(
  new THREE.Vector3(avatar.x, 100, avatar.z),
  new THREE.Vector3(0, -1, 0)
)
const hits = ray.intersectObject(terrainMesh)
const groundY = hits[0]?.point.y ?? terrainBaseY
avatar.y = groundY + AVATAR_EYE_HEIGHT  // 1.8 scene units above terrain
```

The avatar cannot move outside the dome radius (70 scene units). The pyramid can be approached but not overlapped. Building interiors are not enterable in early phases — proximity triggers content panels instead.

#### 17.5.4 Navigation Boundaries and Interaction Zones

| Zone | Radius from centre | On approach |
|---|---|---|
| Library | 16 units | Opens educational content panel |
| Water feature | 12 units | Shows eco-ops water quality data |
| Pyramid | 18 units | Opens wormhole transit dialog |
| Settlement boundary (dome edge) | 68 units | Movement blocked; "dome wall" haptic pulse on mobile |
| Other avatar | 4 units | Enables direct text whisper / gesture exchange |

---

### 17.6 Communication Layers

Communication is layered by bandwidth cost, from cheapest to most expensive. Each layer is independently useful. Higher layers augment lower ones; they do not replace them.

#### Layer 0 — Passive Presence (3G safe, ~0 extra bandwidth)

Presence records are written to Supabase on settlement entry and refreshed every 30 seconds. Other participants see the user's orb at their last-known position. This works at 3G because:
- Position updates are 1 record per 30 seconds per user (minimal)
- No streaming; Supabase real-time subscription pushes a small delta JSON
- The orb moves smoothly client-side using dead-reckoning between updates

**Bandwidth estimate:** ~200 bytes per user per 30 seconds. A 20-person event = ~130 bytes/sec. Feasible on 3G.

#### Layer 1 — Smooth Position Sync (3G manageable, ~2–5 kbps per user)

A lightweight WebSocket channel (via Supabase real-time or a dedicated socket.io server) broadcasts position + heading at **2 Hz**. At this rate:

- Each packet: `{ uid, x, z, heading }` = ~60 bytes
- 20 users × 2 Hz × 60 bytes ≈ 2.4 kbps received
- Orbs move smoothly with client-side interpolation between received packets

**This is the target quality for all Phase 2 events.**

#### Layer 2 — Text Chat (3G safe)

Settlement-scoped text chat: messages are tied to `hostname:planetName` and delivered via Supabase real-time. Chat appears as a floating panel anchored to the bottom-left. Proximity-based "whisper" between avatars within 4 units is a separate channel.

#### Layer 3 — Voice (WiFi recommended; adaptive quality on 3G)

WebRTC peer-to-peer audio via a TURN server (Coturn self-hosted or Twilio TURN relay). Voice is:
- **Off by default** — user explicitly enables for each event
- **Push-to-talk** as the default mode on mobile to avoid ambient noise
- **Event-scoped rooms** — WebRTC room keyed to `event_id`; max 50 participants per room
- **Adaptive bitrate**: 24 kbps Opus on 3G, 48 kbps on WiFi
- **Visual indicator**: a sound-wave animation on the speaker's orb when active

**Spatial audio (Phase 4):** Volume attenuates with avatar distance using the Web Audio API's `PannerNode`. This creates natural conversation clustering — you can hear nearby avatars clearly and distant ones faintly.

#### Layer 4 — Gesture and Reaction System

Gestures are broadcast as state changes (not streamed animation), keeping bandwidth at Layer 0 levels:

```ts
type GestureState = 'idle' | 'wave' | 'point' | 'sit' | 'raise_hand' | 'applaud'
```

Each gesture maps to a distinct orb animation:
- `wave` → orb oscillates vertically
- `point` → a directional indicator arrow appears
- `sit` → orb sinks to ground level, no movement
- `raise_hand` → orb pulses upward once per second
- `applaud` → rapid ring expansion pulses (visible at event climaxes)

Gestures are also **emoji reactions** when triggered near the text chat: `wave` = 👋, `applaud` = 👏, `raise_hand` = ✋.

---

### 17.7 Event Integration

Events are the primary context for multiplayer presence. The architecture connects directly to pon.ink's event system.

#### 17.7.1 Event-Settlement Binding

A pon.ink event record is extended with exotopia fields:

```jsonc
{
  "event_id":       "evt-fana-ka-2026-07-04",
  "name":           "Fana Ka Street Poets Rap Battle",
  "starts_at":      "2026-07-04T16:00:00Z",   // 19:00 EAT
  "ends_at":        "2026-07-04T19:00:00Z",
  "exotopia_settlement": {
    "hostname":     "Kepler-442",
    "planet_name":  "Kepler-442 b",
    "address":      "exo-surface-v1:Kepler-442:Fana-Ka-Main-Stage"
  },
  "max_participants": 50,
  "requires_poap":  false,   // true = only prior-POAP holders can enter
  "live_stage_zone": { "x": 0, "z": -10, "radius": 25 }  // stage front area
}
```

When a pon.ink event is active:
1. The settlement page shows an **event banner** with the event name and participant count
2. Entering the settlement auto-joins the event presence room
3. A **stage zone** is highlighted (glowing ring on terrain, marked in navigator inset)
4. A live participant counter appears in the header

#### 17.7.2 Event Lifecycle

```
Pre-event (T-30 min to T-0)
  · Settlement opens for early arrivals
  · Countdown timer shows in settlement header
  · "Stage warm-up" area indicated; performers can position their avatar

Event active (T-0 to T+end)
  · Full presence room active
  · Voice room open (performers only at first; audience push-to-talk)
  · POAP minting available to confirmed attendees
  · Chronometer shows event time, EAT, planet sky phase

Post-event (T+end to T+1hr)
  · "Afterglow" window: presence room stays open for 1 hour
  · POAP minting closes 30 min after event ends
  · Event recording (text log + participant list) archived to Supabase + IPFS

Replay (any time after)
  · A "ghost replay" of avatar positions can be rendered as non-interactive soul orbs
  · This is the event's permanent record in the settlement — the event happened here
```

#### 17.7.3 The Stage Zone

At the settlement centre, a **stage zone** is defined per event. The stage zone:
- Visually marked by a glowing ring on the terrain (similar to the existing pyramid ring)
- Performers' orbs are larger and brighter within the stage zone
- Audience orbs outside the stage zone appear at normal size
- Voice is broadcast from stage to all, but audience voice is local (proximity-only)

The stage uses the same infrastructure as the existing settlement — no new Three.js objects required except the glowing ring marker. The distinction between performer and audience is social and audio-routing, not geometric.

---

### 17.8 Prioritised Rollout Phases

Phases are ordered by impact-to-effort ratio, not by feature completeness. **Each phase must be fully functional before the next begins.** Do not partially implement Phase 2 features while Phase 1 is unstable.

#### Phase 1 — Inhabited Settlements (Target: 2026 Q3)

**Goal:** Any user who navigates to a settlement where an active event is scheduled sees other attendees as named orbs. Text chat works. No movement control yet.

**Deliverables:**
- [ ] `settlement_presence` Supabase table + row-level security policy
- [ ] Presence write on settlement page mount (Supabase client, existing auth)
- [ ] Supabase real-time subscription: render other users' orbs at their last position
- [ ] Name tags on orbs (floating text rendered as Three.js `Sprite`)
- [ ] Text chat panel (settlement-scoped Supabase real-time channel)
- [ ] Event banner: display active event name + participant count
- [ ] Stale presence cleanup (server-side function: remove records older than 60s)

**What this enables:** Fana Ka can host a virtual rap battle. Attendees navigate to the settlement, see each other's named orbs in the dome, read the text chat, and feel presence even before voice or movement is added.

**What it does NOT include:** Movement control, voice, gesture, mobile joystick. These wait for Phase 2.

**3G test criteria:** 30 simultaneous users, Supabase real-time, on a 1 Mbps connection — orbs render and update within 3 seconds of position change.

#### Phase 2 — Movement and Voice (Target: 2026 Q4)

**Goal:** Users can walk their avatar around the settlement in Walk mode. Voice is available for events with < 20 participants. Gestures are visible.

**Deliverables:**
- [ ] Walk mode: WASD + mobile touch joystick (virtual joystick library or custom)
- [ ] Avatar terrain-following via downward raycast
- [ ] Position broadcast via WebSocket at 2 Hz (upgrade Supabase real-time or add socket.io)
- [ ] Client-side interpolation between received position packets
- [ ] WebRTC voice room (Coturn/Twilio; push-to-talk default on mobile)
- [ ] Gesture system: 5 states, broadcast as presence record field update
- [ ] Interaction zones: approach library → education panel; approach pyramid → transit dialog
- [ ] Mobile joystick UI component (bottom-left overlay)

**What this enables:** Workshop facilitators can guide participants through the settlement by walking them from building to building. Fana Ka performers can "take the stage" by walking to the stage zone. Voice discussions are possible in small groups.

**3G test criteria:** 15 moving users at 2 Hz position updates = ~1.8 kbps. Voice at 24 kbps Opus. Total ~25 kbps per user — acceptable on 3G.

#### Phase 3 — Interaction Depth (Target: 2027 Q1)

**Goal:** The settlement becomes a learning environment. Avatar proximity triggers content. Spatial audio makes conversation natural. Events can span multiple settlements via wormhole transit.

**Deliverables:**
- [ ] Interaction zone content panels: library (ecocity module launch), water (eco-ops data display), pyramid (transit + whitelist management)
- [ ] Tap-to-navigate on mobile (raycast to terrain point, avatar pathfinding)
- [ ] Spatial audio via Web Audio API `PannerNode` (volume by avatar distance)
- [ ] Multi-settlement events: wormhole transit preserves presence room membership — transit to another event settlement and remain in the same voice channel
- [ ] Event ghost replay: post-event orb replay at 4× speed as ambient presence
- [ ] Settlement visitor log: "Recent visitors" displayed in the settlement header

**What this enables:** An ecocity workshop can be delivered by walking participants from the library (module content) to the water feature (live data) to the pyramid (next-steps transit). The spatial environment IS the curriculum structure.

#### Phase 4 — Avatar Richness (Target: 2027 Q2+, WiFi-first)

**Goal:** Higher-fidelity avatars for users with good connectivity. NFT-linked wearables. The orb system remains for all fallback cases.

**Deliverables:**
- [ ] Low-poly humanoid mesh (~800 triangles) for Walk mode on WiFi
- [ ] Role-based base mesh variations (10 roles, each a distinct silhouette)
- [ ] NFT wearable system: owned EcocitySolution NFTs unlock corresponding visual object on avatar (e.g., water filter NFT → avatar carries a small water filter object)
- [ ] Avatar persistence: preferred name, selected role badge, wearables stored in Supabase profile
- [ ] LOD system: nearby avatars show mesh; mid-distance show orb; far distance hidden beyond fog

**What this enables:** The avatar becomes a personal portfolio — what you've built in eco-ops is visible in how you look. The visual identity of the community becomes legible from how people appear in a settlement.

---

### 17.9 Alignment with SCD Hub Goals

This section maps each phase's features to the SCD Hub mission. It exists to prevent scope creep — features should be kept if they serve one of these goals, and dropped or deferred if they do not.

#### Community Sustainable Development (the core mission)

| Feature | How it serves sustainable development |
|---|---|
| Event ghost replays | Make eco-ops field events and workshops permanently visible — the work was done here |
| Library interaction zone | Walking to the library and launching an ecocity module is a micro-curriculum delivery; no separate LMS needed |
| Water feature data panel | Puts live field data (water quality measurements from Lamu, Nairobi, etc.) in spatial context — the settlement IS the data dashboard |
| Settlement visitor log | Evidence of community activity, useful for grant reporting and programme evaluation |
| POAP minting at events | On-chain proof that this community gathered, worked, and participated — portable credential |

#### Educational Value

The settlement's spatial layout is a deliberate curriculum map:

```
Settlement entry  →  General orientation (what is this place, who built it)
     │
     ▼
Library building  →  ecocity.com module delivery; vocational training content
     │
     ▼
Water feature     →  Live eco-ops field data; water quality science content
     │
     ▼
Vegetation / food →  Aquaponics, permaculture, climate module content
     │
     ▼
Pyramid           →  Wormhole transit: connections to other settlements,
                     other communities, other learning contexts
```

Every navigation action is a learning opportunity if content is attached. The priority order for content attachment is: Library first (highest educational volume), Water second (most field data), Pyramid third (community connection).

#### Community Building Capacity

| Feature | Community building value |
|---|---|
| Named orbs at events | Participants see each other — the community is not abstract |
| Role-visible avatars | New participants can find a Facilitator or Mentor without asking |
| Text chat scoped to settlement | Persistent channel for that community location; record of conversations |
| Stage zone at events | Creates a shared focal point for cultural events — mirrors how live events actually work |
| Multi-settlement wormhole presence | Connects geographically dispersed communities: Nairobi, Lamu, diaspora |

#### Project Growth

The avatar/presence system drives growth in three ways:

1. **Events are shareable moments.** A named orb at a Fana Ka battle is an identity marker — "I was there." This is the basic mechanism by which early participants recruit others ("come to the next one, you'll see your name in the settlement").

2. **NFT wearables create a visible economy of participation.** When eco-ops work results in visible changes to your avatar, the system becomes self-explaining to new participants: "I want that too — what do I have to do?"

3. **The settlement is a permanent record.** Ghost replays, visitor logs, POAP archives — these accumulate into a visible history that shows the community is real and active. This is credibility for grant applications, partnership proposals, and new member onboarding.

---

### 17.10 Technical Architecture — Server Requirements

The avatar/presence system adds a server layer that does not currently exist. This is the primary new infrastructure cost.

#### Option A: Supabase Real-time Only (Phase 1, low cost)

- Presence records in Supabase with real-time broadcast
- No new server code required
- Suitable for < 50 simultaneous users per settlement
- Limitation: 2-second update latency minimum; no WebRTC signalling

**Cost:** Supabase free tier handles Phase 1. Pro tier ($25/month) needed at scale.

#### Option B: Dedicated Presence Server (Phase 2+)

A lightweight Node.js + socket.io server handles:
- Position updates at 2 Hz
- WebRTC signalling (STUN/TURN coordination)
- Room management (settlement × event → presence room)
- Rate limiting and anti-abuse

**Deployment:** A single Fly.io or Railway instance, ~$10/month. Scales horizontally if needed.

**TURN server:** Coturn self-hosted on a small VPS (~$5/month) or Twilio TURN (~$0.0012/minute of relayed bandwidth).

#### Option C: WebTransport / QUIC (Phase 4+, future)

For low-latency position sync at high participant counts, WebTransport provides sub-100ms update rates without WebSocket overhead. This is a future upgrade path, not a near-term requirement.

**Total additional cost estimate:**
- Phase 1: $0 (Supabase free tier)
- Phase 2: ~$35/month (Supabase Pro + TURN server + Fly.io socket server)
- Phase 3–4: ~$60–100/month depending on event frequency and participant counts

This is within a modest grant operating budget and well below any commercial metaverse platform cost.

---

### 17.11 Open Questions and Assumptions

**Assumptions we are making now:**

1. Users are authenticated via pon.ink wallet identity before entering Walk mode. Anonymous presence (Phase 1 passive) may allow orbs without auth — this is a UX decision to make in Phase 1 implementation.

2. Position data (X, Z coordinates inside a virtual settlement) is not sensitive personal data and does not require special privacy handling beyond standard row-level security. This should be reviewed if any real-world location is inferred from it.

3. Voice communication in events is consent-based: users must explicitly enable their microphone each session. No auto-enable. This is a non-negotiable safety requirement.

4. Settlement owners can mute or remove any participant from their settlement. The moderation tools (see Ecommunity DAO, Section 5.5) must exist before voice is enabled in Phase 2.

**Open questions requiring community input before implementation:**

- Should passive presence (Phase 1 orbs) be opt-in or opt-out? Some participants may not want their location in the metaverse visible to others by default.
- What is the appropriate maximum participant count per settlement? 50 is a technical estimate; the community may want a smaller number for intimacy or a larger number for major events.
- Should facilitators be able to record event voice? If yes, what consent notice is required? This is especially sensitive for communities in contexts with surveillance concerns.
- How does the ghost replay work for events where sensitive community discussions occurred? Should replays be restricted to position-only (no chat, no audio)?
- Who controls moderation in a settlement during an event — the settlement owner, the event host, or SCD Hub administrators? These roles may differ.

---

---

## 18. Gallery System — Inside the Dome

### 18.1 The Gallery as a Navigable Level 6 Space

The **gallery** is a dedicated interior space within every settlement dome — the cultural heart of the settlement. It sits conceptually between the dome exterior (Level 5 Settlement View) and the file cabinet (the user's private archive). Navigating into the gallery is the click-through destination after reaching a settlement: the complete path from the cosmic scale down to personal creative space is:

```
Level 1 — COSMIC VIEW (galaxy clusters, great voids)
        │
        ▼
Level 2 — GALAXY VIEW (star systems as points)
        │
        ▼
Level 3 — SYSTEM VIEW (host star + orbiting planets)
        │
        ▼
Level 4 — SURFACE / ORBITAL VIEW (sky from the planet surface)
        │
        ▼
Level 5 — SETTLEMENT VIEW (dome environment, soul orbs, water, pyramid)
        │
        ▼  [click the gallery building]
Level 6 — GALLERY INTERIOR VIEW
  The user's personal creative and archival space:
  displayed artwork, soul orbs of current visitors,
  file cabinet, robot companion, color schema unique to this planet
```

Entering the gallery from the settlement dome requires clicking or approaching the **gallery building** — a distinct structure rendered near the dome perimeter at Level 5. In Walk mode (Phase 2), the transition is a smooth animated dolly-in through the gallery doorway. In Explore mode, clicking the gallery building routes to a new `GalleryInteriorPage.vue` scene.

The gallery is **always accessible to visitors** who have transit whitelist access to the settlement. The gallery is a public-facing cultural space, not a private room, unless the owner explicitly locks it.

---

### 18.2 Planetary Color Schema

Each gallery has a **unique color schema** derived from the physical properties of its host exoplanet. This means no two galleries look identical — the color palette is a scientific fingerprint of where the settlement is located in the galaxy.

**Color schema derivation:**

| Data field | Drives |
|---|---|
| `st_teff` (host star temperature, K) | **Primary light tint** — the dominant ambient light color in the gallery ceiling and floor. O-type stars (>30,000 K): electric blue-violet. G-type (~5,800 K): warm white-cream. M-type (<3,500 K): deep amber-red. |
| `pl_eqt` (planet equilibrium temperature, K) | **Wall base color** — hot planets trend toward red-orange tones; cold planets toward indigo-blue; habitable-zone planets toward green-teal. |
| `pl_rade` (planet radius in Earth radii) | **Texture scale** — super-Earths have coarser, more layered wall textures; Earth-analogs are smoother. |
| `pl_orbper` (orbital period, days) | **Animation tempo** — slow orbiters have slower ambient orb drift and gentle atmospheric haze; fast orbiters have more dynamic movement. |
| `sy_dist` (distance from Earth, parsecs) | **Depth haze** — distant settlements feel more remote, with a subtle fog that increases with distance. |

**Schema computation pseudocode:**
```ts
function gallerySchema(planet: ExoplanetRecord): GalleryColorSchema {
  const starColor  = teffToHex(planet.st_teff)      // existing function from star-sprites.ts
  const wallColor  = eqtToWallHex(planet.pl_eqt)
  const textureRes = planet.pl_rade > 2 ? 'coarse' : 'fine'
  const tempo      = Math.min(1.0, 365 / (planet.pl_orbper ?? 365))  // 0 = slow, 1 = fast
  const depthHaze  = Math.min(0.6, planet.sy_dist / 5000)
  return { starColor, wallColor, textureRes, tempo, depthHaze }
}
```

The schema is computed once at settlement creation and stored in the user's Supabase profile. Users can **override individual parameters** within a themed range — they cannot make a red-dwarf settlement look like a blue-giant, but they can choose warmer or cooler variants within the scientifically valid band.

---

### 18.3 Soul Orbs Inside the Gallery

Soul orbs — the ambient glowing spheres that represent participant presence — exist inside the gallery as well as in the dome exterior. Inside the gallery, orb behavior is adapted for the enclosed, art-focused space:

**Gallery orb behaviors:**

| Context | Behavior |
|---|---|
| **Hovering near artwork** | Orb slows, dims slightly — "contemplation mode" |
| **Near the file cabinet** | Orb adopts a cooler blue-white tint — "archival focus" |
| **Near the robot companion** | Orb brightens briefly — "in conversation" |
| **Idle / drifting** | Orb drifts slowly in figure-eight paths between artworks, drawn toward lit display panels |
| **Event visitor surge** | Extra orbs materialize at the gallery entrance and spread organically |

The gallery can hold up to **30 visible orbs** before the renderer switches to a compact "crowd presence" mode — a soft aurora band near the ceiling instead of individual spheres. This keeps performance viable on mobile at events.

**Orb-to-artwork interaction (Phase 2+):**
When a soul orb dwells within 2 scene units of an artwork panel for more than 10 seconds, the artwork gains a **resonance counter** that increments in the NFT's on-chain metadata. This creates a passive, low-friction way for community members to express appreciation without requiring explicit voting or reactions. Artworks with high resonance counts float higher on the gallery walls.

---

### 18.4 Gallery Customization Interface

The gallery customization interface is the **primary user-facing creative tool** for settlement personalisation. It is accessed from within the gallery (a floating `Customise` panel) or from the user's pon.ink dashboard.

**Customisation layers (in order of accessibility):**

#### Layer 1 — Layout
Users can choose from three gallery floor plans:
- **Corridor** — works displayed along two long walls, file cabinet at the far end
- **Salon** — works displayed salon-style in a grid covering all four walls floor-to-ceiling
- **Spotlight** — one featured work per visit (rotates by resonance score), others stored; minimal space

Floor plan is a non-NFT setting, changeable any time.

#### Layer 2 — Color and Atmosphere
Within the scientifically derived schema band (Section 18.2), users can adjust:
- **Light warmth** slider (cooler ↔ warmer within star-type range)
- **Wall color variant** (three palette options derived from `pl_eqt`)
- **Ambient haze density** (0 = clear gallery, 3 = atmospheric gallery with light volumetric fog)
- **Orb drift speed** (slow / medium / fast — linked to `pl_orbper` but overridable)

#### Layer 3 — Artwork Display
- **Hang artwork**: drag-and-drop NFTs owned by the user onto available wall slots
- **Featured piece**: one artwork designated as the entry focal point (large panel, illuminated)
- **Provenance tags**: toggle showing artist name, mint date, eco-ops connection, and on-chain address beneath each work
- **Coming soon slots**: visual placeholders for artwork the user intends to acquire or mint — shows a "ghost frame" with an optional note

#### Layer 4 — Text and Identity
- **Gallery name** (defaults to settlement nickname + "Gallery")
- **Gallery statement** (280 characters, shown in the entry foyer as floating text)
- **Artist attribution wall** (optional panel listing collaborators and mentors whose work appears in the space)
- **Welcome message from the robot** (pre-writes the robot companion's greeting for visitors)

All Layer 1–4 customizations are **non-NFT** — they are Supabase-stored user preferences. No wallet transaction required.

---

### 18.5 The File Cabinet

The **file cabinet** is a persistent, in-world interface to the user's complete digital archive. It appears as a physical filing cabinet object in the gallery — rendered at a fixed position near the back of the space, interactable in both Explore and Walk modes.

**What the file cabinet contains:**

| Drawer | Contents |
|---|---|
| **Certificates & Credentials** | Module completion certificates, Water Quality Certs, method-proposal endorsements, mentorship credit — the §21/§24 reward-ledger artifacts. A pon.ink-minted NFT wrapper, if the owner chose to make one, links from here optionally (§26) |
| **Eco-Ops Records** | Complete log of all eco-ops check-ins: activity type, location, timestamp, photo, group tag, IPFS/content-hash reference |
| **Settlement Documents** | Settlement nickname history, address assignment record, wormhole whitelist |
| **Creative Assets** | Artworks, sound files, uploaded content (IPFS CID references) |
| **Event Records** | Events attended, events hosted, ghost replay links, participant lists |
| **Messages** | Whisper history from settlement text chat; Robot companion conversation log |

**File cabinet UX:**
- Opens as a full-screen 2D overlay when clicked (not a new 3D scene — performance priority)
- Drawer tabs across the top; search bar; sort by date / type
- Each item shows: title, type chip, date, IPFS/content-hash reference
- Items can be **pinned to the gallery walls** from within the file cabinet (drag item → "Display in gallery")
- Items can be **shared**: generates a shareable link that includes the item's metadata + settlement context (a pon.ink-compatible variant is available if that optional integration is used — §26)

**File cabinet access control:**
- Certificates & credentials: public read (anyone visiting the gallery can browse these — it is a portfolio)
- Eco-ops records: public by default; user can mark individual records private
- Messages: always private; never visible to other visitors
- Settlement documents: public
- Creative assets: owner-controlled per item

---

### 18.6 Gallery MVP Scope

**Must ship for gallery feature (v1.1):**

| Feature | Status |
|---|---|
| `GalleryInteriorPage.vue` — rendered 3D gallery scene with planetary color schema | 🔲 To build |
| Gallery building clickable from Level 5 Settlement View | 🔲 To build |
| Artwork panels on walls — display up to 8 images from user's creative assets | 🔲 To build |
| Soul orbs inside gallery — connected to settlement presence data | 🔲 To build |
| File cabinet overlay — certificates and eco-ops records tabs (read-only in v1.1) | 🔲 To build |
| Gallery color schema computed from planet data | 🔲 To build |
| Gallery name and statement (text customization) | 🔲 To build |

**Ship after v1.1:**

| Feature | Priority |
|---|---|
| Full customisation interface (layout, atmosphere, drag-and-drop hang) | High |
| Resonance counter on artworks (orb-dwell tracking) | Medium |
| File cabinet sharing (shareable item links) | Medium |
| Coming-soon placeholder frames | Medium |
| Crowd presence aurora (30+ orbs → aurora mode) | Low |

---

---

## 19. Robot Companion System

### 19.1 Every User Gets a Robot

Every registered user in the ecosystem receives a **robot companion** — a persistent AI-adjacent entity that lives in their gallery and across the pon.ink dashboard. The robot is not a generic chatbot; it is a **personalised representative of the user's work and identity** in the ecosystem, trained on a corpus of information the user provides.

The robot originates from pon.ink's **Robot Mule** system (already scaffolded in `ExoProperty.vue`). When a user binds their Exotopia settlement to a pon.ink ExoProperty record, their Robot Mule is imported into the gallery as its resident robot companion. The robot then exists in three contexts:

| Context | Robot form | Role |
|---|---|---|
| **pon.ink ExoProperty page** | Text-based Robot Mule panel | Corpus-driven greeting, visitor count, NFT corpus display |
| **Exotopia Gallery (Level 6)** | 3D animated robot figure in the gallery | Gallery guide, file cabinet assistant, visitor greeter |
| **Exotopia Settlement (Level 5)** | Small floating icon near the settlement entrance | Arrival greeter, transit information |

---

### 19.2 Robot Visual Design

The robot's 3D form is a **low-poly geometric figure** (~500 triangles) designed for 3G rendering. It is not humanoid — it is a stylised mechanical being that reflects the settlement's planetary color schema.

**Base form:** A spherical core (representing the soul orb the user once was) with four articulated arms, two locomotion appendages, and a display face panel. The display panel renders animated text and simple emoji reactions.

**Role-based robot variations:**

| User role | Robot skin | Distinguishing feature |
|---|---|---|
| Participant | Matte finish, blue-tinted | Simple face panel |
| Visual Artist | Iridescent shell, colour-shifting | Holds a small canvas |
| DJ / Sound Artist | Translucent shell with internal glow | Audio wave display on chest |
| Eco / Health Educator | Green accents, leaf motif | Carries a small sampling device |
| Facilitator | Cyan-gold finish | Larger display panel for session info |
| Mentor | White-gold bimantle | Double-ring orbiting its core |
| Promoter | Orange-warm finish | Broadcast antenna on shoulder |

The base mesh is shared across all roles; role-specific variations are material + accessory overlays.

---

### 19.3 Robot Corpus

The robot's intelligence is not AI-generated in the open-ended sense. It is **corpus-driven** — it knows what the user has told it, and it retrieves and presents that information in response to visitor interactions.

**Corpus categories:**

| Category | What it contains | How it's used |
|---|---|---|
| **Bio note** | User's self-description (280 chars max) | Opening greeting to visitors |
| **Settlement note** | Description of this specific settlement and gallery | "What is this place?" visitor question |
| **NFT corpus** | Titles, descriptions, and mint dates of owned NFTs | "Tell me about this piece" — robot describes the artwork when a visitor clicks it |
| **Eco-ops summary** | Aggregated activity data: total check-ins, activity types, locations | Robot answers "What work has this person done?" |
| **Event highlights** | Notable events attended or hosted, with POAP links | Robot lists the user's event history |
| **Favorite works** | User-selected artworks or $BARS they want highlighted | Robot draws attention to featured items |
| **Community links** | Group affiliations (OT Kulcha, Fana Ka, Uni-Kibaoni, etc.) | Robot contextualises the settlement in the broader community |

The robot answers visitor questions by retrieving the closest matching corpus item. Questions outside the corpus scope get a graceful fallback: *"I don't have that information yet. Ask [user_name] directly."*

**Corpus is managed** from within the gallery (a `Configure Robot` panel on the file cabinet) or from the pon.ink dashboard. Users add corpus items one at a time — there is no bulk upload in v1.

---

### 19.4 Robot Functions in the Gallery

**Visitor greeting (automatic):**
When a soul orb enters the gallery, the robot animates toward the entrance and displays its opening greeting on its face panel. The greeting is assembled from the bio note + a dynamic element (current visitor count, time of day, active event if any).

Example greeting:
> *"Welcome to Resonance Fields. I'm the mule for [user]. 47 people have passed through here. There's a Fana Ka replay running if you want to watch."*

**Artwork guide (on click):**
When a visitor clicks an artwork panel, the robot animates toward that panel and displays the NFT corpus entry for that piece. If no corpus entry exists for that piece, the robot shows the on-chain metadata (title, mint date, artist).

**File cabinet assistant (for owner only):**
When the gallery owner opens the file cabinet, the robot assists by:
- Highlighting items added since the last visit
- Suggesting which items to display on the gallery walls (based on resonance scores)
- Flagging eco-ops certifications due for on-chain upgrade

**Navigation guide (for visitors):**
The robot can direct visitors to other parts of the settlement: *"The pyramid is northeast of the dome — take you there?"* (triggers wormhole transit dialog). *"The workshop library is open — follow me."* (highlights the library approach zone).

**Event host mode:**
During an active event, the robot switches to host mode:
- Displays event name and countdown on its face panel
- Points toward the stage zone
- Announces new arrivals if participant count is under 10 (above 10 it goes quiet to avoid spam)

---

### 19.5 Robot ↔ Beneficial Earth Outcomes

The robot is not only a gallery assistant — it is the user's **representative in the broader ecosystem loop** connecting virtual activity to real-world benefit. This is the critical link between the metaverse layer and the SCD Hub mission.

**The loop:**
```
User performs real-world eco-ops activity (Lamu, Nairobi, etc.)
        │
        ▼
Check-in submitted → logged to Supabase + Arweave
        │
        ▼
Robot corpus updated: eco-ops summary increments
        │
        ▼
Visitors to the gallery see the robot's updated summary:
  "This settlement has contributed to 14 water quality readings
   in Lamu County. Follow this link to view the open data."
        │
        ▼
Resonance from visitors → NFT on-chain metadata updated
        │
        ▼
High-resonance settlements → featured in SCD Hub grant reports
  as evidence of community engagement and real-world impact
        │
        ▼
Grant funding → community projects → more eco-ops → robot updates again
```

The robot makes **invisible work visible**. A field worker in Mkunumbi who has submitted 30 water quality readings has a robot that tells every gallery visitor about that work — without the worker needing to self-promote. The metaverse is a public record of contribution, not just an entertainment space.

---

### 19.6 Robot MVP Scope

**Must ship for robot feature (v1.1):**

| Feature | Status |
|---|---|
| Robot figure rendered in gallery (simple 3D mesh, role-based material) | 🔲 To build |
| Visitor greeting from bio note corpus item | 🔲 To build |
| Robot face panel: animated text display | 🔲 To build |
| `Configure Robot` panel in gallery: bio note + settlement note fields | 🔲 To build |
| Artwork click → robot describes piece (NFT metadata fallback) | 🔲 To build |
| pon.ink Robot Mule corpus sync: pull corpus from shared Supabase table | 🔲 To build |

**Ship after v1.1:**

| Feature | Priority |
|---|---|
| Full corpus management UI (all 7 corpus categories) | High |
| Event host mode (face panel shows event info, stage direction) | High |
| Navigation guide ("follow me to the pyramid") | Medium |
| File cabinet assistant (new items flagged, display suggestions) | Medium |
| Eco-ops summary in corpus (auto-updated from check-in table) | High |
| Visitor count display on robot face panel | Medium |

---

---

## 20. Q&A Planning Session — Gallery, Robot & Click-Through Navigation

*This section records the key design questions and their current answers to ensure the gallery and robot features are built with clear intent. It is updated as decisions are made.*

---

**Q: How does a first-time visitor discover the gallery? Is there a call-to-action from the galaxy view?**

A: The click-through path is progressive. From the galaxy view, a star system that has an active settlement shows a **settlement indicator icon** (a small dome icon, not cluttering the star sprite). Clicking a star with this indicator surfaces a tooltip: *"[N] settlements — [settlement_nickname] by [user]"*. Clicking the tooltip routes to Level 3 (system view) with the relevant planet highlighted. From there, clicking the planet routes to Level 4 (surface view). The dome is visible in Level 4. Clicking the dome transitions to Level 5 (settlement exterior). The gallery building is clearly distinct from other settlement structures (lit interior glow visible through windows at night). Clicking routes to Level 6.

On mobile, each transition is a full-screen tap — no nested menus. The path is: **star → planet → dome → gallery**, with a breadcrumb visible at each stage so users can go back.

---

**Q: What makes each gallery feel genuinely different from others? Won't they all look similar if the color schema range is narrow?**

A: The color schema spans a wide physical range: M-dwarf settlements (deep red-amber, slow orb drift, cool dim light) feel fundamentally different from O-giant settlements (cold blue-violet, fast movement, high contrast). Habitable-zone planets with Earth-like temperatures produce the most gallery-like atmosphere — bright and welcoming. Hot Jupiters produce a dramatic dark-orange industrial feel. The combination of light tint + wall color + tempo + haze depth creates thousands of perceptually distinct environments without any user customization. User customization layers additional personality on top.

Beyond color: the artwork itself is the primary differentiator. A gallery curated by a reggae producer in Kingston looks nothing like one curated by a water quality researcher in Lamu.

---

**Q: What happens to a gallery when the user has no NFTs yet? Is it empty and discouraging?**

A: No. The gallery ships with a **Starter State** design principle: an empty gallery is not a blank room. It contains:
- The robot companion (present from day one)
- A welcome note the robot reads from the bio corpus (prompted during onboarding)
- Three "ghost frames" on the walls — placeholder panels inviting the user to hang their first pieces
- A "Your work goes here" atmospheric text rendered by the robot

**Q: How does a first-time visitor discover the gallery? Is there a call-to-action from the galaxy view?**

A: The click-through path is progressive. From the galaxy view, a star system that has an active settlement shows a **settlement indicator icon** (a small dome icon, not cluttering the star sprite). Clicking a star with this indicator surfaces a tooltip: *"[N] settlements — [settlement_nickname] by [user]"*. Clicking the tooltip routes to Level 3 (system view) with the relevant planet highlighted. From there, clicking the planet routes to Level 4 (surface view). The dome is visible in Level 4. Clicking the dome transitions to Level 5 (settlement exterior). The gallery building is clearly distinct from other settlement structures (lit interior glow visible through windows at night). Clicking routes to Level 6.

On mobile, each transition is a full-screen tap — no nested menus. The path is: **star → planet → dome → gallery**, with a breadcrumb visible at each stage so users can go back.
- The file cabinet (even if empty, shows eco-ops records from the first check-in)

The empty state is intentional negative space, not abandonment. It is designed to feel like a studio before opening night, not a dead page.

---

**Q: How does the file cabinet work for users who are not crypto-native? Will seeing "Algorand ARC-3" in a drawer confuse them?**

A: The file cabinet uses **plain-language labels throughout**. NFTs are labeled by what they *are*, not what chain they live on:
- "Your planet deed" (not "Exolocation NFT ARC-3")
- "Water check — Mpeketoni, March 14" (not "Water Quality Cert · Polygon")
- "Rap battle — Fana Ka, July 4" (not "POAP · event_attendance trigger")

On-chain details (chain name, address, CID) are visible in a collapsible "Technical details" section for users who want them. By default they are hidden.

---

**Q: The robot runs on corpus. What if a user never fills in their corpus? Does the robot just say nothing?**

A: The robot has **graduated fallback states**:
- 0 corpus items: Robot greets visitors with only the user's display name and role. *"Welcome to [name]'s settlement. They're a [role]. No messages yet."*
- 1–2 items (bio + settlement note): Robot gives a brief personal greeting.
- 3–5 items: Robot can answer "what is this place" and "who made these works."
- 6+ items: Robot feels genuinely knowledgeable about the user and their work.

The onboarding flow prompts the user to add their first corpus item (bio note) before leaving the gallery for the first time. This is not a blocking gate — they can skip — but the prompt explains: *"The more you tell your robot, the better it can represent you to visitors."*

---

**Q: Is the robot going to feel like a corporate AI assistant? That would undermine the community feel.**

A: The robot's **personality is role-derived**, not templated. A DJ's robot is percussive and brief in its responses. A Mentor's robot is measured and reflective. An Eco Educator's robot is data-forward. The robot does not use AI-generated language — all responses are assembled from the user's own corpus words. The only generated element is the stitching between items.

Additionally: the robot has a **quirk system** — each robot develops a small number of observable behaviours that feel specific to it. A robot with a large eco-ops corpus might emit small animated data particles. A robot serving a visual artist settlement might pause at artwork panels for longer than expected. These are cosmetic only — no logic behind them — but they make each robot feel individual rather than identical.

---

**Q: How do the Earth-beneficial outputs actually work? What is the pipeline from "visitor resonance" to "real-world impact"?**

A: The direct pipeline is through three mechanisms:

1. **Open data publication.** Every eco-ops check-in is published to Arweave as tamper-evident open data. The gallery file cabinet links to this data. Any visitor, researcher, or funder can follow the link to see the raw field data from Lamu or Nairobi. The data is public regardless of resonance.

2. **Grant evidence aggregation.** SCD Hub administrators can pull a report: "settlements with the highest resonance in the last 90 days and their associated eco-ops activity." This is the grant application evidence: community engagement in the metaverse + verified field data from the same community. The robot's eco-ops summary makes this visible at the settlement level.

3. **NFT aftermarket → Hardware Fund.** The 15% Community Hardware Fund split on all NFT transactions (see Section 7.2) flows directly to purchasing WATSAN and mapping hardware for field communities. When a visitor buys an artwork from the gallery aftermarket (pon.ink → OpenSea), 15% goes to hardware. High-resonance galleries drive more traffic → more sales → more hardware.

---

**Q: For the MVP demo on May 2: which gallery and robot features ship, and which are deferred?**

A: MVP demo (May 2) does **not include** the gallery or robot — these are v1.1 features (post-May sprint). The MVP demo covers Levels 1–5 (galaxy through settlement exterior), eco-ops check-in, address assignment, and named orbs at events.

The gallery and robot enter development in the **May/June sprint** after the May 2 demo validates the core navigation loop with the Fana Ka and Uni-Kibaoni communities.

**Target for gallery + robot v1.1:** June 15, 2026 (six weeks after MVP demo).

The Q&A in this section exists so that when the sprint begins, the design decisions are already made and the team is not relitigating the same questions during implementation.

---

---

---

## 21. Rewards & Incentive Ledger (Implemented — July 2026)

### 21.1 Relationship to the original vision

Sections 5–7 describe a fully NFT-backed reward economy (Exolocation deeds, Station/Module/EcocitySolution cNFTs, an 80/15/5 Resonance Split) reached through pon.ink's wallet identity. What actually shipped in July 2026 is a leaner, Supabase-backed points-and-certificate ledger — not NFTs, not on pon.ink, no payment automation — that fills the same functional role (real-world/real-effort activity → visible settlement reward) for three tracks the app had already been *promising* without any backing store: finance-literacy education, volunteering, and educating others. It is explicitly a foundation, not the full vision in Sections 5–7 or in `SPEC_ECOOPS_COMMUNITY_PLATFORM.md` (which specs the fuller Open Badges 3.0 / mentorship-tier design this pulls its point values from).

### 21.2 What exists

| Component | File(s) |
|---|---|
| Append-only points ledger, certificates, mentor sessions, minimal admin allow-list | `supabase/migrations/002_rewards.sql` |
| Points/settlement-object catalog, P-Fin quiz → reward mapping | `src/data/rewards-catalog.ts` |
| Original 8+28 question personal-finance-literacy quiz (P-Fin 8 / full P-Fin Index), aligned to but not copied from the TIAA Institute–GFLEC framework | `src/data/finance-literacy-quiz.ts`, appended into `src/data/quizzes.ts` |
| Rewards store — quiz completion, volunteer action logging, mentor session request/confirm, admin grant | `src/stores/rewards.ts` |
| `/rewards` page — points by track, finance-literacy status, volunteer self-report, mentor panel, Impact Profile with a picker to attach an unlocked object to an existing settlement (`SettlementRecord.objects[]`, added to `src/lib/settlements.ts`) | `src/pages/RewardsPage.vue` |

### 21.3 Trust model and the one place it's server-enforced

Everything here is client-trust MVP, matching how `connections`/`settlements.ts` already work — Row Level Security restricts *who* can write a row for themselves, not what value they claim. The one exception is mentor-session confirmation, the one path where a single client could otherwise fabricate a reward for two people: a `BEFORE UPDATE` trigger locks `mentor_id`/`mentee_id`/`topic`/`created_at` as immutable and lets each party only flip their own confirmation flag, and an `AFTER UPDATE` `SECURITY DEFINER` trigger — not client code — emits the point rows for both parties once both are true.

### 21.4 Explicitly not part of this

No M-Pesa or other payment integration, no zero-knowledge proof system, no Open Badges 3.0 credentials, no iNaturalist/GBIF sync. See §23.2 for why this matters — a July 2026 press release publicly described a working ZK-proof + M-Pesa payout system for exactly the kind of field-verified reward this section covers, and no such system exists in code.

### 21.5 What "mentoring, citizen science, library curation, model-building" actually map to

The reward ledger's `RewardTrack` type (`src/stores/rewards.ts`) has exactly three values: `finance_literacy`, `volunteering`, `educating_others`. When describing the incentive system in plain language it is easy to reach for a fourth or fifth category that sounds like it should exist — it doesn't yet, and this section exists so that doesn't get repeated as fact:

| Plain-language activity | What it actually is in code today |
|---|---|
| **Mentoring** | Real. The `educating_others` track, backed by `mentor_sessions` (server-enforced double-confirm, see §21.3) → Mentorship Beacon at 4 confirmed sessions (`MENTOR_CYCLE_THRESHOLD`). |
| **Citizen science** | Real, but it is §24's PFAS/PFOA tooling specifically — not a generic "citizen science" track. Progress there (`decon_progress_log`, `method_proposal_published/endorsed`) posts points into the existing `volunteering` and `educating_others` tracks; there is no separate `citizen_science` track value. |
| **Library curation and example finding** | Not implemented as its own track or flow. The only mechanism in `rewards-catalog.ts` that resembles it is `contribution_verified` (20 pts) — an **admin-granted**, generic catch-all ("e.g. docs/curriculum contribution") with no UI to submit a curation entry, no link to `/eco-library`, and no automatic trigger. Anyone referring to "library curation rewards" as a working feature is describing an aspiration, not a shipped path. |
| **Creation of models useful in eco-ops** | Not implemented at all — no schema, no store method, no catalog entry corresponds to submitting or rewarding a model/design contribution. This is vision-stage, same status as the fuller Open Badges 3.0 design in `SPEC_ECOOPS_COMMUNITY_PLATFORM.md` that §21.1 already notes this section is a leaner foundation for. |

If "library curation" or "model contribution" becomes a real priority, the shortest path is a fourth `RewardTrack` value plus a `library_contribution_verified` (or similar) action key and a lightweight submission form — not a new architecture; the ledger, certificate, and settlement-object-unlock plumbing in §21.2–21.3 already generalizes to a new track name.

---

## 22. Void Navigation (Implemented — July 2026)

### 22.1 What exists

Three void-related pages — `ClusterInteriorPage.vue` (`/cluster-interior/:slug`, shared with real galaxy-cluster interiors), `VoidInteriorPage.vue` (`/void/:voidId`), and `VoidGalaxyPage.vue` (`/void-galaxy/:voidId/:gid`) — previously had no bottom navigation strip, unlike the galaxy/surface/galactic-center/cosmic scenes, which use `DefenderNav.vue` (or, for black holes, the simpler bespoke `BlackHoleDefenderNav.vue`). A new bespoke `src/components/VoidDefenderNav.vue`, following the `BlackHoleDefenderNav.vue` precedent (plain DOM/CSS, Vue-reactive, no canvas or tick-loop coupling), now ships on all three:

- **Objects list** — the real, named catalog objects in the void (not the synthetic filler population used to bulk out the ambient render), grouped by near-wall / far-wall / deep-interior zone.
- **Edge ring** — a literal 360° view of wall-zone objects positioned by their real angular position around the void centre (`atan2` of their XZ offset), distinct from the sparse interior list.

The wall/interior distinction was not new data modeling — it already existed: `system_architecture.cluster_zone` on cluster-member JSON, `is_wall` on void-galaxy oracle JSON.

### 22.2 A real bug fixed along the way

`ClusterInteriorPage.vue`'s initial camera framing used a fixed offset sized for real clusters (~0.1–2 Mpc member spread). Applied to a void member catalog (45–130 Mpc radius — 35–90× larger), the camera started essentially in empty space. The fix computes the camera offset from the actual bounding radius of the loaded members instead of a constant, so real clusters keep today's framing (a floor keeps the old behavior) and voids now frame correctly.

### 22.3 Known gap

`scripts/fetch-local-void.mjs` (adapted from the existing `fetch-bootes-void.mjs`, with a real adaptation — not a parameter swap — the Milky Way sits *inside* the Local Void's 45 Mpc radius at 23 Mpc distance, so the NED query drops Boötes' directional cone search in favor of an all-sky redshift-slice query) generates `public/void-galaxies/local-void-{viz,detail}.json`. As of this writing it has only been run without NED network access available, so the Local Void's real catalog galaxies (NGC 6503, IC 342, the Fireworks Galaxy) are not yet in the output — only the 300-galaxy procedural fallback population. Re-running `node scripts/fetch-local-void.mjs` with internet access will backfill the real entries; the Objects list and Edge Ring will show them as soon as the file is regenerated.

---

---

## 23. A Note on Following Through (July 2026)

### 23.1 Why this section exists

Several sections of this document, and at least one public release, described capability ahead of what was actually built. That gap is worth naming directly rather than letting it sit quietly in status tables.

### 23.2 The specific gap

A press release (`press/kenya-june-2026.md`) publicly described a working zero-knowledge-proof system that verifies field work offline and triggers M-Pesa payouts, anchored to Algorand, for the Mpeketoni Eco Ops Group in Lamu County. **No such system exists in code** — there is no ZK proof implementation and no M-Pesa integration anywhere outside documentation and specs. Separately, the Platform page's public copy promised that completing a personal-finance quiz would unlock settlement rewards before any such quiz, ledger, or unlock mechanism existed. Section 21 makes the second promise real, on a considerably smaller and more honest footing (points ledger, not payments; self-serve trust model, not a cryptographic proof). The first promise — automated field-verified M-Pesa payout — remains unbuilt, and anyone communicating about the Mpeketoni pilot externally should not imply it is live.

### 23.3 The standing practice going forward

Public-facing claims about this platform — press releases, blog posts, in-app copy — should describe what is running in production, not what a spec describes as the target. Where a claim is aspirational, say so in the same sentence. This document's status markers (✅ Implemented / 🟡 Partial / 🔲 To build) exist to make that distinction checkable, not decorative — and are only useful if kept honest under audit, the way §11 and §21–22 were this pass.

---

## 24. PFAS/PFOA Citizen Science Tooling (Implemented — July 2026)

### 24.1 What exists

Built directly on top of §21's rewards ledger — a curated methods library, a public project-logging system, and a public method-proposal system with citations, all feeding the `volunteering`/`educating_others` tracks:

| Component | File(s) |
|---|---|
| `focus_areas`, `decon_projects`, `project_log_entries`, `method_proposals`, `proposal_endorsements`, `branch_settlements` tables — public SELECT, owner-scoped INSERT, server-side endorsement-reward trigger | `supabase/migrations/003_pfas_citizen_science.sql` |
| Curated remediation-methods reference (GAC/ion-exchange/RO-NF/foam fractionation as proven; electrochemical oxidation, supercritical water oxidation, phytoremediation flagged honestly as emerging/unproven-for-PFAS), sampling-cost tiers, legal/safe-sampling guidance | `src/data/pfas-methods-library.ts` |
| Store — focus areas/projects/log entries/method proposals/endorsements, plus the `exo-branch-v1` research-branch creation on a simulated project | `src/stores/pfas-citizen-science.ts` |
| `/pfas-citizen-science` — browse focus areas/projects (no sign-in to read), methods library, start-a-project flow, project detail with progress log, logging-streak progress bar, and a "attach a site marker to my settlement" action | `src/pages/PfasCitizenSciencePage.vue` |
| `/method-proposals` — public list with citations/arguments, submission form, endorse button | `src/pages/MethodProposalsPage.vue` |
| `decon-site-marker` settlement-item preset (color set at attach time from project status: amber planning/active, cyan monitoring, green complete) and its `buildItemMesh()` case | `src/lib/settlement-items.ts`, `src/pages/DomeInteriorPage.vue` |
| Simplified 24-dim Leech vector (three stacked 8-vectors — current/aspirational/relational — Euclidean k-NN) used for branch-settlement comparison | `src/lib/leech-vector.ts` |
| Shared consecutive-week streak calculation, used by both the UI progress bar and the store's certificate-threshold check | `src/composables/useLoggingStreak.ts` |

### 24.2 One correction from the original design note

`blog-settlements-as-possible-worlds.md` spells the field `leach_vector` (line 102) — a typo against its own Λ₂₄ framing elsewhere. The schema and code use `leech_vector` deliberately, the correct term. `leech-vector.ts` implements the blog's literal, explicitly-labeled-speculative proposal (structured 24-dim vectors + nearest-neighbor search) — **not** genuine Leech-lattice (Λ₂₄) sphere-packing or lattice-point decoding, which remains unbuilt and out of scope.

### 24.3 Explicitly not part of this

Genuine Λ₂₄ decoding math; a ZK proof/ownership-authenticity layer for branches (no `zk-e8/` directory exists, only a spec doc, and no crypto deps in `package.json` — see §23.2 for why claims here matter); new 3D rendering for stations (`StationPage.vue` is metadata-only, zero WebGL); a formal peer-reviewer role hierarchy for method proposals (ships with public visibility + `proposal_endorsements` only); automated lab-result ingestion.

---

## 25. Zoom-Descent Navigation & the Local Step Portal — Status Check (July 2026)

### 25.1 Why this section exists

`SPEC_ZOOM_DESCENT.md` (dated 2026-06-29, status still marked "Proposed") describes moving away from hard route-cut navigation — every level change a full page load — toward continuous camera motion: in-page zooms, lightweight wipes with directional bearing handoff, and, for settled worlds, a physical **Local Step Portal** object the user flies through with a full-screen light-inversion effect at the moment of crossing. This section checks that vision against what actually runs today, the same way §21–22 and §24 did for the reward ledger and void navigation. The honest answer here is split down the middle: the cheap, high-value half shipped; the spectacular half is a complete, unused module.

### 25.2 What shipped

The **bearing-handoff wipe** is real and in production. `src/stores/scene-transition.ts` implements exactly two transition modes — `'lightning'` and `'iris'` — each a short (380 ms iris / 900 ms lightning) full-screen cover with a `bearing` value carried across the route change so the arriving scene's camera can start facing the direction the user was already looking. This is called from `depart(ox, oy, mode, bearing)` in seven pages: `CosmicPage.vue`, `GalaxyPage.vue`, `ClusterInteriorPage.vue`, `ClusterGalaxyPage.vue`, `ClusterSystemPage.vue`, `VoidInteriorPage.vue`, and `VoidGalaxyPage.vue`. This is the "phase out hard bifurcations" half of the vision, and it works — it replaced what used to be a jarring page-swap with a sub-second directional wipe at every one of those level crossings.

What this is **not**: it is not a continuous in-page camera zoom (§4 of the zoom-descent spec — "TWEEN toward the cluster center, then cut"). No `TWEEN`-based fly-to exists in any of the pages above; the camera is static right up to the wipe. So the transitions are smoother than a raw route change, but they are still a cut, just a fast directional one instead of a blunt one.

### 25.3 What is built but not connected to anything

`src/lib/local-step-portal.ts` (607 lines) is a complete, working `LocalStepPortal` class: circum-polar orbit geometry, a Gerstner-wave `ShaderMaterial` for the portal's inner surface driven by the planet's real equilibrium temperature / surface gravity / atmospheric pressure, hover state, and an `uEntering` approach ramp — essentially the whole rendering side of §6 of `SPEC_ZOOM_DESCENT.md`. It is not imported by `ClusterSystemPage.vue`, `SurfaceViewPage.vue`, or anywhere else in `src/`. No page constructs a `LocalStepPortal` instance. It is dead code: fully written, never wired in.

Consistent with that, the third transition mode the spec calls for — `'inversion'`, the light-inversion membrane-crossing effect in §7 of `SPEC_ZOOM_DESCENT.md` — does not exist in `scene-transition.ts`'s `TransitionMode` union (`'lightning' | 'iris'` only). `ClusterSystemPage.vue`'s "Descend to surface" button still fires an ordinary `'lightning'` wipe, the same mechanic used for every other cross-level jump. There is currently no code path anywhere that produces a portal object a user flies toward, hovers over, or crosses through — "orbit down and land adjacent to your settlement via a portal" describes `local-step-portal.ts`'s intent, not anything reachable by clicking through the app today.

**Practical read:** if this becomes a priority, the remaining work is wiring, not invention — instantiate `LocalStepPortal` in `ClusterSystemPage.vue`'s tick loop for settled planets, add `'inversion'` to `TransitionMode` and the departure-duration table in `scene-transition.ts`, and swap the "Descend to surface" button's `depart(..., 'lightning', ...)` call for the approach-then-inversion sequence already described in §6.6–7.2 of the zoom-descent spec. The hard 3D/shader work is done; only the last-mile call sites are missing.

### 25.4 "Parking for other guests"

There is no live guest-parking or multiplayer presence system — this remains exactly Phase 0 as described in §17.3: five static, decorative soul orbs with no connection to real user or session data. What does exist and is easy to mistake for it: `src/lib/spatial-scopes.ts` defines five named camera viewpoints (`settlement:orb:fana-ka`, `:ot-kulcha`, `:uni-kibaoni-shg`, `:glipish-dj`, `:am-lunchmeat`) — one per active community group from `src/data/events.ts` — that frame the camera on a specific soul orb's fixed position. These are camera bookmarks for the same five mockup orbs, not parking spots that a real visiting guest occupies. Building actual guest parking requires the presence system specified in §17.4 (Phase 1 or later) — nothing in that phase has shipped.

### 25.5 Net status

| Piece | Status |
|---|---|
| Iris/lightning wipe + bearing handoff | ✅ Implemented — 7 pages |
| Continuous in-page camera zoom (TWEEN fly-to) | 🔲 Not built |
| Local Step Portal 3D object + shader | 🟡 Built, not wired into any page — dead code |
| `'inversion'` transition mode | 🔲 Not built |
| "Land adjacent to settlement via portal" user flow | 🔲 Not built — button still does a flat wipe |
| Named community-orb camera viewpoints | ✅ Implemented — 5 static bookmarks |
| Live guest parking / multiplayer presence | 🔲 Not built — see §17.3/17.8 Phase 1+ |

---

## 26. Blockchain/NFT Scope Correction (August 2026)

### 26.1 Why this section exists

§21.1 already stated, in July 2026, that the "fully NFT-backed reward economy" described in §5–7 was superseded by a leaner Supabase-backed points ledger — "not NFTs, not on pon.ink." That correction was never carried back into the sections it corrected: §5.2, §5.5, §6.3, §7, §10.3, and §18.5 continued to describe Exolocation NFTs, Algorand/Solana/Polygon minting, DAO governance tokens, and on-chain proof links as though they were the current or intended core system. This section records that those sections have now been edited to match.

### 26.2 What changed

- §5.2 (Settlement Objects), §5.5 (Settlement Governance), §6.3 (renamed from "On-Chain Proof" to "Tamper-Evident Proof"), §7 (renamed from "NFT Economy" to "Settlement Rewards & Optional Monetization"), §10.3 (Blockchain), and §18.5 (The File Cabinet) no longer describe blockchain/NFT mechanics as part of the core Exotopia distro.
- The Exotopia public distro's actual focus — and the thing this document should be read as specifying going forward — is the quality video/knowledge library, coordination tools (mentor sessions, event scheduling, group management), and citizen-science reporting/data-archive tooling documented in §21, §22, and §24, all running on Supabase + local-first/IPFS storage with no wallet, chain, or token required.

### 26.3 Where the blockchain vision went

It wasn't deleted — it moved to the two platforms already scoped for it:

- **`SPEC_PON_INK.md`** — the individual-creator economy: wallet-based identity, NFT minting (Exolocation NFT wrapper, Station Core/Module, EcocitySolution, $BARS), the aftermarket, and crypto/M-Pesa/Stripe payment rails. Optional integration for anyone who wants to monetize settlement work; not required to create, own, or use a settlement.
- **`SPEC_WORLDBRIDGER_ONE.md`** — multi-author/collaborative assets and DAO-style resource-return splits (the token-weighted governance layer referenced in §5.5).

### 26.4 What did not move

The **Resonance Split** survives in §7.2/§10.4 as a core-distro concept — `src/lib/resonance-split.ts` documents it as a general-purpose contribution-allocation calculation, no longer minting-specific since IPFS pinning replaced on-chain minting in this app. It's kept available for whatever the local-first/IPFS support model needs next, independent of whether pon.ink's chain-based version is ever used. (Note: `GLOSSARY.md` [31] currently states 99/0.75/0.25 as the split, against the code's own rule not to inline percentages in copy — worth reconciling in the next glossary pass rather than repeating the number here.)

---

*PON INK — "put it on ink" · GPL v3 · Community owns its data*
