# MVP Launch Plan — Exotopia / SCD Hub
### Baseline Assessment & Prioritised Sprint
*April 20, 2026 — Greg Willson / SCD Hub*
*Status updated June 23, 2026*

---

## 0. One-Paragraph Honest Summary

The 3D visualization layer has become something genuinely exceptional: a five-level navigable descent from the cosmic web to a planet surface, grounded in published astronomical catalogs at every scale — 345 X-ray clusters, 2,836 real Boötes Void galaxies, 119,614 HYG stars, 35,896 confirmed exoplanets. The singleton renderer carries users seamlessly from Laniakea's supercluster filaments through a void interior to a generated planet surface, with wormhole conduit transit, settlement inventory, and dome interior all working. Phase 2 of the visualization sprint is complete. What surrounds that core is still mostly stubs. EcoOpsPage is still 23 lines. The gallery is 19 lines. There is still no user identity layer, no eco-ops check-in, no exotopia address assignment, and no settlement presence tied to real users. The demo loop ends at wormhole transit — and that has not changed since April. The visualization is now two phases ahead of the community layer, and every community member who arrives will feel that gap. This document defines the remaining minimum work required to close it.

---

## 1. Feature Inventory — Honest Status

### Working and Shippable

| Feature | Page / Component | Quality |
|---|---|---|
| Galaxy 3D view — star sprites, hover tooltips, HZ rings | `GalaxyPage.vue` | Good |
| Star system drill-down — orbiting planets, rarity badges, focus mode | `GalaxyPage.vue` | Good |
| Planet surface view — terrain, dome, settlement objects, sky | `SurfaceViewPage.vue` | Good |
| Earth clock / chronometer — UTC, EAT, planet phase, event list | `SurfaceViewPage.vue` | Good |
| Exomoon sky arcs — type-estimated orbits crossing horizon | `SurfaceViewPage.vue` | Good |
| Surface navigation — pan, zoom, polar clamp (no underground) | `SurfaceViewPage.vue` | Solid |
| Solid planet floor — opaque bedrock below terrain | `SurfaceViewPage.vue` | Done |
| Cosmic view — large-scale structure | `CosmicPage.vue` | Good |
| Welcome landing — 3D planet scene, transit dialog | `WelcomePage.vue` | Good |
| Wormhole portal animation | `WormholePortal.vue` | Working |
| Address / realm entry dialog | `MainLayout.vue` | Working |
| Navigator inset — orbital minimap | `NavigatorInset.vue` | Good |
| Exolocation NFT metadata builder (Algorand) | `src/lib/algorand/` | Built, untested |
| Station/Module/EcocitySolution metadata (Solana) | `src/lib/solana/` | Built, untested |

### Stub / Placeholder — Not Functional

| Feature | Page | Current state | Impact of gap |
|---|---|---|---|
| Eco-ops check-in form | `EcoOpsPage.vue` | 23 lines, "coming soon" | **Critical** — core SCD Hub activity |
| Exotopia address assignment | (none) | Not started | **Critical** — users have no settlement identity |
| Gallery page | `GalleryPage.vue` | 19 lines, empty | High — Artists need this |
| Mint NFT forms | `MintPage.vue` | 4 tab stubs | High — NFT economy requires this |
| Station builder | `StationPage.vue` | Module grid skeleton only | Medium |
| Wallet connection | `WalletStore` + `MainLayout` | Stub functions, no adapter | **Critical** — identity requires this |
| Settlement presence (named orbs) | `SurfaceViewPage.vue` | Soul orbs are static, no real users | **Critical** — events require this |
| User authentication | (none) | Not started | **Critical** |
| Python sky data pipeline | (none) | Specced in SPEC §14, not started | Medium — fallback stars work |

### ecocity.com — Platform Status

| Feature | Status | Priority |
|---|---|---|
| Design specification library (WATSAN/ENERGY/SHELTER/HEALTHCARE/FOOD) | Exists informally; not yet structured or browsable | P3 (v1.1) |
| hub.approvideo.org practitioner library integration | Planned — audience-tiered entry for technicians, DIYers, policy people, homeowners, students, designers | P3 (v1.1) |
| Module content (text + diagrams) | Partially written; not yet in digital delivery system | P1 (v1.1) |
| Assessment system (5–10 questions, ≥70% pass) | Not yet implemented | P1 (v1.1) |
| On-chain certificate minting (module completion → NFT) | Not yet connected | P1 (v1.1) |
| Workshop scheduling (pon.ink event system integration) | Not yet connected | P1 (v1.1) |
| EcocitySolution NFT catalogue (20 objects across 5 categories) | Metadata schema defined; 3D GLTF models not yet created | P2 (ongoing) |
| 3D settlement object integration (Exotopia dome view) | Specced in SPEC.md §5.2; not yet deployed | v1.1 |
| Community project case studies (Mpeketoni, OT Kulcha, Fana Ka) | Documentation exists; not yet published on-site | P4 (v1.1) |
| Impact dashboard (/impact — module completions, NFTs, eco-ops data) | Not yet built | P5 (v1.1) |
| Swahili localisation | Not yet started | P6 (ongoing) |
| ecocity.com homepage (new design — see design prompt) | Not yet built | v1.1 |

### pon.ink ↔ Exotopia.org Interoperability — API Status

Per `SPEC_EXOTOPIA_INTEROP.MD §12`:

**Exotopia.org must implement:**

| Endpoint / Feature | Status |
|---|---|
| Property registration webhook receiver (`POST /api/v1/properties/register`) | Not started |
| Corpus update handler (`POST /api/v1/properties/:id/corpus`) | Not started |
| Bundle registration receiver (`POST /api/v1/properties/:id/bundle`) | Not started |
| POAP registration receiver (`POST /api/v1/poaps/register`) | Not started |
| Ecocity validation receiver (`POST /api/v1/ecocity/validation`) | Not started |
| Art refresh handler (`POST /api/v1/properties/:id/art-refresh`) | Not started |
| Sphere assignment sender + sphere identity endpoint | Not started |
| Property summary public endpoint (`GET /api/v1/properties/:id/summary`) | Not started |
| Sphere properties public endpoint (`GET /api/v1/spheres/:id/properties`) | Not started |
| Narrative block rendered above fold (every property page) | Not started |
| Bundle component display (audio player, art gallery, eco data panel, doc viewer) | Not started |
| Visitor protocol flag enforcement (open / wallet-required / POAP-gated / invite-only) | Not started |
| Robot Mule visual tiers (Foal / Mule / Warhorse / Elder) | Not started |
| POAP governance weight computation | Not started |

**pon.ink must implement (for reference — tracked in pon.ink repo):**

| Endpoint / Feature | Status |
|---|---|
| Property mint → Exotopia.org registration call | Not started |
| Corpus update → Exotopia.org sync | Not started |
| Bundle manifest → Exotopia.org registration on campaign launch | Not started |
| POAP issuance → Exotopia.org notification | Not started |
| Development proposal → UserPanel notification | Not started |
| Mule greeting + interaction endpoints | Not started |
| Sphere art manifest endpoint | Not started |

---

## 2. The Core Demo Loop (What Must Work)

This is the sequence a Fana Ka participant or Uni-Kibaoni field worker needs to complete in order to feel that Exotopia is real and worth returning to.

```
1. Land on Welcome page
        │  → 3D planet greets them by name (random until auth)
        ▼
2. "Enter Settlement" → routes to /surface/:hostname/:planetName
        │  → surface renders: terrain, dome, settlement, moons in sky
        ▼
3. Chronometer is visible and correct
        │  → UTC, EAT (Nairobi), and planet sky phase showing live
        ▼
4. Other attendees are visible as named orbs
        │  → During a scheduled event, names appear; text chat works
        ▼
5. User submits an eco-ops check-in
        │  → Picks activity type, confirms location, submits
        ▼
6. Address is assigned or confirmed
        │  → "You are now at exo-surface-v1:Kepler-442:..." shown
        ▼
7. User opens wormhole transit
        │  → Selects another settlement, portal animation plays
        ▼
8. User arrives at destination settlement
        │  → New terrain/sky rendered for that planet
```

Steps 1–3 and 7–8 work today.
**Steps 4, 5, 6 are entirely missing.**

---

## 3. Prioritised Build Sprint

Ranked strictly by: (a) unblocks another feature, (b) community demo value, (c) SCD Hub mission alignment.

---

### Priority 1 — Authentication & Identity Stub
**Estimated effort: 1–2 days**

Everything else depends on knowing who the user is. We do not need a full wallet adapter for the MVP demo. We need a working demo-mode identity that:

- Assigns a display name, role, and colour
- Persists across sessions (localStorage minimum; Supabase preferred)
- Ties to a real wallet address when the adapter is ready

**Deliverables:**
- [ ] Auth flow: demo-mode login with display name + role selection (no wallet required)
- [ ] `user` object in Pinia store: `{ id, displayName, role, color, walletAddress? }`
- [ ] Login dialog accessible from header "Connect" button
- [ ] Demo-mode banner: "Running in demo mode — wallet connection coming soon"
- [ ] On first login: route to planet assignment (see Priority 3)

**Why first:** Every other feature (presence, check-in, address assignment) requires a user identity to write to.

---

### Priority 2 — Eco-Ops Check-In Form
**Estimated effort: 2–3 days**

This is the primary motor of the SCD Hub ecosystem. Uni-Kibaoni field workers, Fana Ka participants, and OT Kulcha contributors should be able to log activity from mobile. The form does not need IPFS or blockchain in the MVP — write to Supabase, display in the activity feed.

**Deliverables:**
- [ ] `EcoOpsPage.vue`: activity type selector (garbageMap, wqMap, farmMap, productMap, transportMap, storageMap, sourceMap, cleaningMap)
- [ ] Location field: GPS auto-fill (HTML5 Geolocation API) or manual text
- [ ] Notes field (optional, 280 characters max)
- [ ] Group tag selector (OT Kulcha / Fana Ka / Uni-Kibaoni / Other)
- [ ] Submit button → write to Supabase `eco_ops_checkins` table
- [ ] Activity feed: list of recent check-ins from all users (public, anonymised by default)
- [ ] First check-in triggers address assignment (Priority 3)

**Why second:** Uni-Kibaoni and Fana Ka can use this immediately. It is the proof that real work → virtual reward. Without it, the platform is a pretty visualizer, not a tool.

**Mobile requirements:** Form must work at 3G on Android. All inputs one-per-screen on mobile viewport. GPS permission request handled gracefully (denied → manual input fallback). Offline: queue the check-in, show "pending sync" badge, submit when connection restores.

---

### Priority 3 — Exotopia Address Assignment
**Estimated effort: 1 day (depends on Priority 2)**

After a user's first eco-ops check-in, they receive a permanent Exotopia address: a real exoplanet from the NASA archive tied to their user ID.

**Deliverables:**
- [ ] `assignAddress(userId)` function: deterministically pick a planet from `exoplanets-viz.json` using a hash of the user ID — same user always gets the same planet
- [ ] Write assignment to Supabase `user_addresses` table: `{ user_id, hostname, planet_name, address_string, assigned_at }`
- [ ] Address string format: `exo-surface-v1:{hostname}:{planet_name}`
- [ ] Show assigned address in the settlement badge (already rendered in `SurfaceViewPage.vue`)
- [ ] "Welcome to your settlement" modal on first visit to the user's assigned planet
- [ ] Settlement header personalized: "Your settlement at {planet_name}"

**Why third:** The address is what makes the virtual real estate feel real and personal. "This is YOUR planet" is the emotional hook that drives retention and community evangelism.

---

### Priority 4 — Settlement Presence: Named Orbs at Events
**Estimated effort: 2–3 days**

When an event is active at a settlement, participants who navigate there should see each other as named, role-coloured orbs. This is Section 17 Phase 1 from SPEC.md, stripped to minimum viable.

**Deliverables:**
- [ ] Supabase `settlement_presence` table (schema in SPEC §17.4.3)
- [ ] Write presence record on settlement page mount (user ID, hostname, planetName, display name, role)
- [ ] Refresh `last_seen` every 20 seconds; delete records older than 60 seconds server-side
- [ ] Supabase real-time subscription: render other users as named orbs (colour from role)
- [ ] Name tag above each orb: `Sprite` with canvas-rendered text
- [ ] Text chat: settlement-scoped Supabase real-time channel, floating panel bottom-left
- [ ] Event banner: if a scheduled event is active at this settlement, show event name + live participant count

**Why fourth:** This is what turns the first Fana Ka virtual event into a real community moment. Participants see each other by name in the settlement. It does not require movement or voice — just presence. The rap battle can happen with this alone.

**What this explicitly does NOT include:** Avatar movement (Phase 2), voice (Phase 2), gesture system (Phase 2). These are deferred to keep this phase achievable and 3G-safe.

---

### Priority 5 — Gallery Page: Community Artwork Display
**Estimated effort: 1–2 days**

The gallery is where visual artists and the "Pain in the Ghetto" collaboration will have a home. For MVP it needs to display artwork, not mint it.

**Deliverables:**
- [ ] `GalleryPage.vue`: grid of artwork cards — image, title, artist name, settlement address
- [ ] Source data: hardcoded JSON initially (`public/gallery-seed.json`), Supabase-backed when ready
- [ ] Each card links to the artist's settlement surface view
- [ ] Upload placeholder: "Submit your artwork — connect wallet to mint"
- [ ] OT Kulcha and Fana Ka community sections — curated highlights

**Why fifth:** OT Kulcha and Fana Ka participants need to see their creative work represented. The gallery is the fastest way to demonstrate that the platform values what they produce.

---

### Priority 6 — Navigation Polish and Known Bugs
**Estimated effort: 1 day, ongoing**

The visualization is good but the navigation experience has rough edges that will cause confusion at a live demo.

**Specific items:**
- [ ] **Back navigation from surface view**: "Back to star system" button must reliably return to the correct system in galaxy view with that system focused/highlighted. Currently may lose context.
- [ ] **Deep link to a specific planet**: `exotopia.org/surface/Kepler-442/Kepler-442+b` must work as a shareable URL — test that route params survive a fresh page load.
- [ ] **Mobile layout**: Confirm the bottom controls bar, legend, and navigator inset do not overlap on a 375px viewport (iPhone SE / low-end Android).
- [ ] **Loading state**: If `exoplanets-viz.json` is slow (3G), the galaxy view shows empty space. Add a meaningful loading message.
- [ ] **Error state**: If a planet name is not found in the store, surface view should show a graceful "planet not found" message rather than a blank or broken scene.
- [ ] **Walk mode joystick**: Section 17 calls for a mobile joystick — this is a Phase 2 item, but a placeholder "Walk mode (coming soon)" button in the controls bar should be visible now so the demo narrative can reference it.

---

### ecocity.com Sprint — v1.1 (Target: June 2026)

These priorities are directly from `SPEC_ECOCITY.md §4.2`. They are post-MVP but should begin during or immediately after the May 2 demo sprint so ecocity.com is functional for the first facilitated workshops.

---

#### ecocity P1 — Module Delivery Integration with pon.ink
**Estimated effort: 3 days**

Connect ecocity.com module completion to the pon.ink event system. Workshop facilitators schedule a module delivery from within pon.ink; completion automatically triggers certificate + EcocitySolution NFT dispatch.

**Deliverables:**
- [ ] Module catalogue API endpoint (`GET /api/modules` → list with ID, title, category, linked NFT object)
- [ ] Completion webhook (`POST /api/module/complete` ← called by pon.ink after assessment score confirmed)
- [ ] Assessment UI: 5–10 question form, ≥70% pass threshold, embedded in ecocity.com module page or pon.ink event flow
- [ ] Certificate NFT schema: `{ type: "ecocity_module_completion", module_id, category, participant_id, mentor_id, completed_at, score, chain: "Polygon", ipfs_cid }`
- [ ] EcocitySolution NFT dispatch on certificate issue (linked to completed module's object catalogue entry)
- [ ] Certificate displayed in participant's pon.ink portfolio + Exotopia file cabinet (Certifications drawer)

---

#### ecocity P2 — EcocitySolution 3D Model Creation
**Estimated effort: Ongoing — start with 5 WATSAN objects**

GLTF models for the settlement object catalogue. Models must be <5,000 triangles, UV-mapped for planetary colour schema overlay (SPEC.md §18.2).

**Toolchain:** Blender → GLTF export → Draco compression → Exotopia Three.js loader.

**Priority order (tied to active community projects — Mpeketoni Recycling Center):**
- [ ] Biosand filter (WATSAN) — cylindrical filter vessel, sand layers visible
- [ ] Rainwater harvester (WATSAN) — roof catchment + storage tank
- [ ] Composting unit (WATSAN) — three-bay system with aeration pipes
- [ ] Waste map node (WATSAN) — data beacon with map pin
- [ ] Aquaponics tank (FOOD) — fish + plant integrated system
- [ ] Solar array (ENERGY) — 4-panel rooftop system
- [ ] [Remaining 14 objects — see SPEC_ECOCITY.md §3.2 for full catalogue]

**Why WATSAN first:** Directly tied to the Mpeketoni Recycling Center proposal (Uni-Kibaoni-Peace-Youth-SHG, Lamu) — the most active real-world community project on the platform.

---

#### ecocity P3 — Design Specification Digital Library
**Estimated effort: 2 days**

Browsable library of all design specifications, connected to hub.approvideo.org for practitioner-grade support material.

**Deliverables:**
- [ ] Category filter UI (WATSAN / ENERGY / SHELTER / HEALTHCARE / FOOD)
- [ ] Each spec page: description, material list, construction notes, impact metrics, linked module, linked NFT
- [ ] Download link for PDF (IPFS-hosted, permanent URL)
- [ ] "Teach this module" button → routes to pon.ink event creation pre-filled with this module
- [ ] hub.approvideo.org entry panel: six audience-tiered tiles (Technicians & Installers / Designers & Architects / DIY Builders / Policy & Funding / Students & Educators / Homeowners), each filtered view linking into hub content for that audience type

---

#### ecocity P4 — Community Project Case Studies
**Estimated effort: 2 days**

Dedicated pages for each active SCD Hub community project — serves both community storytelling and grant application evidence.

**Deliverables:**
- [ ] **Mpeketoni Recycling Center** (Uni-Kibaoni-Peace-Youth-SHG, Lamu): project brief, target community (women + youth, Mkunumbi / Hongwe / Bahari ward), funding status, design specs applied, eco-ops data to date
- [ ] **OT Kulcha studio** (Pain in the Ghetto): project context, Kingston/Nairobi collab, cultural modules in development
- [ ] **Fana Ka** (Nairobi): event history, rap battle format, digital rights curriculum planned

---

#### ecocity P5 — Impact Dashboard
**Estimated effort: 2 days**

Public `/impact` page — educational lens on the same data pon.ink's impact dashboard shows:
- [ ] Module completions by category and region
- [ ] Certifications issued (count + on-chain links)
- [ ] EcocitySolution NFTs in circulation (count by type)
- [ ] Community project milestone progress (% complete for Mpeketoni, etc.)
- [ ] Aggregate eco-ops field data linked from Arweave

---

#### ecocity P6 — Swahili Localisation
**Estimated effort: Ongoing — establish pipeline before English content is finalised**

All module content must be available in Swahili for Lamu and Nairobi communities. Translation must be developed in parallel with English, not as a retrofit.

Priority language order: Swahili → Patois (OT Kulcha / Fana Ka Caribbean connections) → additional languages as community need arises.

---

### Platform Interoperability Sprint — v1.1 (Target: June/July 2026)

This sprint implements the API surface defined in `SPEC_EXOTOPIA_INTEROP.MD`. It connects Exotopia.org's virtual world to pon.ink's airdrop builder, Robot Mule, and POAP systems.

**Prerequisites:** MVP demo (Priority 1–4) must be complete. Supabase project must be live.

**Estimated effort: 5–7 days** (backend-heavy; requires both Exotopia.org and pon.ink work in parallel)

**Key deliverables (Exotopia.org side):**
- [ ] Property registration webhook receiver + sphere auto-assignment logic
- [ ] Corpus update handler → development tier evaluation (bare / settled / established / landmark)
- [ ] Bundle component display: audio player, art gallery, eco-ops data panel, document viewer
- [ ] Narrative block rendered above fold on every property page (not optional per spec)
- [ ] Visitor protocol flag enforcement (open / wallet-required / POAP-gated / invite-only)
- [ ] Robot Mule character rendering with 4 visual tiers (Foal / Mule / Warhorse / Elder)
- [ ] Public API endpoints for WordPress plugin + droid app consumption
- [ ] Ecocity validation badge display when `eco_validation_hash` is set

**Trigger condition for this sprint:** pon.ink has a live test bundle from a Group Manager training run (SPEC_AIRDROP.MD §8 training pathway). At that point the webhook test fixtures exist and integration testing is possible.

---

## 4. Demo Script for SCD Hub Communities

This is what a presenter should be able to walk through with Fana Ka, Uni-Kibaoni, or OT Kulcha participants. It should work entirely on a mid-range Android phone at the event.

```
"We are building a place in the universe for your work."

1. [Open exotopia.org on phone]
   "This is your planet — Kepler-442 b — 1200 light years from Earth.
    Your settlement is here."

2. [Show surface view — terrain, dome, moons in sky]
   "This is what the sky looks like from your planet right now —
    that's the time in Nairobi right now, mapped to this world."
    [Point to chronometer: 19:42 EAT]

3. [Show other named orbs if event is active]
   "Those orbs — each one is someone from the community who is here with you."

4. [Open eco-ops check-in form]
   "When you log your real-world work — collecting water quality data,
    running a recycling drive — it gets recorded here, permanently."
    [Submit a check-in]

5. [Show address assignment result]
   "That work just confirmed your address: exo-surface-v1:Kepler-442.
    This is your permanent location in the metaverse. No one else has it."

6. [Open wormhole transit — select another settlement]
   "You can visit anyone else's settlement. Watch."
    [Transit animation plays → arrive at second settlement]

7. [Show galaxy view]
   "Every dot is a real star system with confirmed exoplanets.
    Every one of those planets could be someone's home."
```

**The demo works if:** Steps 1–7 complete without errors on a mid-range Android on the venue WiFi. Each step should take no more than 15 seconds to reach.

---

## 5. What We Are Explicitly Deferring

These items are specced, important, and will be built — but not before the first community demo.

| Feature | Why deferred | Target |
|---|---|---|
| Real wallet adapter (Phantom, Pera) | Demo-mode identity is sufficient for first event | v1.1 |
| NFT minting forms (MintPage) | Backend (Algorand/Solana) not yet wired | v1.1 |
| Avatar movement / Walk mode | Phase 2 — requires WebSocket server | Q4 2026 |
| WebRTC voice | Phase 2 — requires TURN server | Q4 2026 |
| Python sky data pipeline | Fallback star field works; accurate positioning is enhancement | Q3 2026 |
| Planet interior cross-section | Specced in SPEC §16; floor fix is sufficient now | v2.0 |
| Ecommunity DAO governance | Requires token infrastructure | v2.0 |
| Proposed planet speculation protocol | Requires staking infrastructure | v2.0 |
| Multi-language UI (Swahili, Patois) | Important but translatable after English baseline | v1.2 |
| **ecocity.com module delivery + pon.ink integration** | Requires pon.ink event system hooks not yet built | v1.1 (June) |
| **EcocitySolution 3D GLTF models** | Requires 3D modeller (Blender → Three.js pipeline); art/design task | v1.1 ongoing |
| **ecocity.com design specification library + hub.approvideo.org** | Requires content structuring + library API integration | v1.1 (June) |
| **pon.ink ↔ Exotopia.org interoperability API** | Requires both platforms live + Supabase configured | v1.1 (June/July) |
| **Robot Mule character rendering (4 tiers)** | Requires pon.ink mule endpoint live + character art created | v1.1 |
| **Bundle component display (audio/art/docs/eco-ops)** | Requires interop API sprint | v1.1 |
| **Sphere system + property development tiers** | Requires interop API sprint | v1.1 |
| **Airdrop builder integration (pon.ink)** | pon.ink team ownership — tracked in pon.ink repo | v1.1 |
| **WordPress plugin + droid app (distributed display)** | pon.ink team ownership — tracked in pon.ink repo | v1.1 |
| **POAP governance weight system** | Requires POAP holdings on-chain + sphere governance contracts | v2.0 |
| **Swahili + Patois localisation (ecocity + Exotopia)** | Translation pipeline must be established before English finalised | v1.2 |

---

## 6. Infrastructure Required Before Launch

These are external services or configurations needed before the demo, not code features.

| Item | Status | Action needed |
|---|---|---|
| Supabase project | Not configured | Create project, configure RLS, get anon key |
| `eco_ops_checkins` table | Not created | Run schema migration (Priority 2) |
| `user_addresses` table | Not created | Run schema migration (Priority 3) |
| `settlement_presence` table | Not created | Run schema migration (Priority 4) |
| `exoplanets-viz.json` served statically | ✅ in `public/` | No action |
| Domain / hosting | Not confirmed | Deploy to Vercel or Netlify; confirm exotopia.org DNS |
| HTTPS certificate | Required for GPS geolocation API | Handled by Vercel/Netlify automatically |
| **For v1.1 interoperability sprint:** | | |
| `exo_properties` table (Supabase) | Not created | Per SPEC_EXOTOPIA_INTEROP.MD §3.1 — stores token_id, sphere_id, exotopia_property_id, development_tier |
| `sphere_assignments` table | Not created | Sphere membership + visual identity per SPEC_EXOTOPIA_INTEROP.MD §2 |
| `bundle_components` table | Not created | Per SPEC_EXOTOPIA_INTEROP.MD §5.1 — audio/art/eco-ops/doc components per property |
| `poap_issuances` table | Not created | Per SPEC_EXOTOPIA_INTEROP.MD §4.4 — POAP log for governance weight computation |
| `corpus_updates` table | Not created | Per SPEC_EXOTOPIA_INTEROP.MD §4.2 — mule corpus state per property |
| `settlement_presence` visitor resonances | Not created | Resonance messages storage + moderation (Exotopia.org owns this data) |
| pon.ink ↔ Exotopia.org service tokens | Not issued | Quarterly-rotated shared tokens per SPEC_EXOTOPIA_INTEROP.MD §4.1 |
| Ecocity validation signing key | Not configured | ecocity.com issues as independent validator (SPEC_EXOTOPIA_INTEROP.MD §11, §4.5) |
| hub.approvideo.org access / API | Not confirmed | Required for ecocity P3 practitioner library integration |

---

## 7. Success Criteria for MVP Launch

The MVP is considered ready when all of the following are true:

- [ ] A new user can complete the full demo script (Section 4) in under 4 minutes on a mid-range Android phone without assistance
- [ ] An eco-ops check-in can be submitted from a mobile browser at 3G data rates and appears in the activity feed within 10 seconds
- [ ] After submitting a check-in, the user's assigned planet is shown correctly and navigable
- [ ] During a scheduled test event with 10 simulated participants, named orbs are visible in the settlement and update within 5 seconds of a new participant joining
- [ ] The surface view for at least 10 different planets renders without errors or blank screens
- [ ] Deep link URLs (`/surface/:hostname/:planetName`) work on a fresh browser load
- [ ] No console errors on the demo device during the full script walkthrough
- [ ] The chronometer shows the correct EAT time (within 30 seconds of actual Nairobi time)

---

## 8. Sprint Assignments (Suggested)

**MVP Sprint (target: May 2, 2026):**

| Priority | Estimated days | Suggested owner | Blocks |
|---|---|---|---|
| P1 — Auth identity stub | 1–2 days | Frontend dev | P3, P4 |
| P2 — Eco-ops check-in form | 2–3 days | Frontend dev + Supabase setup | P3 |
| P3 — Address assignment | 1 day | Frontend dev | Demo script step 5 |
| P4 — Settlement presence | 2–3 days | Frontend dev + Supabase real-time | Demo script step 3 |
| P5 — Gallery page | 1–2 days | Frontend dev + content | Demo script step 7 adjacent |
| P6 — Nav polish / bugs | 1 day | Frontend dev | Demo reliability |
| Infrastructure setup | 0.5 day | DevOps / Greg | All |

**Total estimated (MVP):** 8–12 working days to full demo readiness.

**Target demo date: May 2, 2026** (Fana Ka event or equivalent community gathering).

**v1.1 Sprint (target: June/July 2026):**

| Priority | Estimated days | Suggested owner | Blocks |
|---|---|---|---|
| ecocity P1 — Module delivery + pon.ink integration | 3 days | ecocity backend + pon.ink team | ecocity P2 NFT dispatch |
| ecocity P3 — Design specification library + hub.approvideo.org | 2 days | Frontend dev + content | ecocity P4, P5 |
| ecocity P4 — Community project case studies | 2 days | Content + frontend dev | Grant applications |
| ecocity P5 — Impact dashboard | 2 days | Frontend dev + data | Funder reporting |
| Interop — Property registration + corpus webhooks | 2 days | Backend dev (Exotopia.org + pon.ink) | All interop features |
| Interop — Bundle display (audio/art/docs/eco-ops) | 2 days | Frontend dev | Bundle airdrop visibility |
| Interop — Robot Mule rendering (4 tiers) | 2 days | Frontend dev + pon.ink mule endpoint | Visitor experience |
| Interop — Sphere system + property development tiers | 2 days | Backend dev | Landmark properties |
| ecocity P2 — GLTF model creation (5 WATSAN objects) | Ongoing (design) | 3D modeller (Blender) | Settlement object placement |
| ecocity P6 — Swahili translation pipeline | Ongoing | Community + translators | Lamu/Nairobi localisation |

**Total estimated (v1.1):** 15–20 working days. Parallelisable across ecocity and Exotopia.org/pon.ink tracks.

---

## 9. Design Constraints — Non-Negotiable

These apply to everything built in this sprint. Violating them means the feature ships late, not in a degraded form.

1. **3G mobile first.** Every form, every presence update, every animation must be tested at 1 Mbps / 150ms latency before merge. Use Chrome DevTools network throttling.

2. **No wallet required to start.** The demo-mode login (Priority 1) must allow full access to the visualization, check-in form, and settlement without a crypto wallet. Wallet connection is an upgrade path, not a gate.

3. **Text before voice.** Do not attempt to integrate WebRTC voice in this sprint. Text chat (Priority 4) is the communication baseline. Voice is Phase 2.

4. **Real data, labelled honestly.** If a feature shows placeholder data (gallery seed JSON, estimated moon counts, demo-mode user ID), label it as such in the UI. Do not present generated data as if it came from the user's actual activity.

5. **Privacy by default.** Presence records must be opt-in per session. The first time a user visits a settlement during an event, a one-time banner asks: "Allow others to see you here? [Yes / Stay private]." Private users see orbs but are not shown as one.

---

*Document status: DRAFT — circulate to SCD Hub team for review before sprint begins*
*Next review: April 25, 2026*

---

## 10. Cross-Platform Spec Index

| Spec | Location | Key sections for this plan |
|---|---|---|
| `SPEC.md` | exotopia.org repo | Settlement objects §5.2, library zone §17.9, settlement presence §17.4.3 |
| `SPEC_ECOCITY.md` | exotopia.org repo | Module categories §2.1, object catalogue §3.2, priorities §4.2, settlement integration §5 |
| `SPEC_PON_INK.md` | exotopia.org repo | Airdrop campaigns, event system |
| `SPEC_EXOLOCATION.MD` | pon.ink repo | Coordinate protocol, NFT schema, mule visitor interface §4 |
| `SPEC_EXOTOPIA_INTEROP.MD` | pon.ink repo | Full API surface §12 (both platform checklists), sphere system §2, bundle display §5.2 |
| `SPEC_AIRDROP.MD` | pon.ink repo | Group types §3, trigger engine §5, generative art §6, Group Manager training §8 |
| `SPEC_ROBOT_MULE.MD` | pon.ink repo | Owner interface; visitor face per SPEC_EXOTOPIA_INTEROP.MD §8 |
| `SPEC_NFT_MINTING.MD` | pon.ink repo | Water quality cert use case §3; ecocity validation hash |
| `SPEC_PAYMENTS_AFRICA.MD` | pon.ink repo | 80/15/5 revenue split, M-Pesa integration |
| `STRATEGY.md` | pon.ink repo | Cultural + market metrics, policy intersections |
| hub.approvideo.org | External library | Practitioner support material for EcocitySolution NFT artifacts (ecocity P3) |
