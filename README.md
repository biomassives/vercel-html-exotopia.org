# Exotopia.org

**Cosmic navigation, virtual real estate, and community settlement — built on real astronomical data.**

SCD Hub · pon.ink · ecocity.com · GPL v3 · [SPEC.md](SPEC.md)

---

## What it is

Exotopia is a navigable universe for the SCD Hub ecosystem. Users descend from the cosmic web — galaxy clusters, great voids, supercluster filaments — all the way to a settlement surface on a confirmed exoplanet, exomoon, or orbital habitat. Each level of the descent corresponds to a real scale of astronomical structure. The numbers at each level are from published catalogs.

The platform is the cosmic layer of three interconnected tools:

| Platform | Function |
|---|---|
| **exotopia.org** | Cosmic visualization, virtual real estate, settlement environments |
| **pon.ink** | Sound tools, events, M-Pesa/Stripe payments, NFT minting, user dashboard |
| **ecocity.com** | Sustainable infrastructure design, vocational education, settlement objects |

Real-world eco-ops field work, community development activities, and cultural production earn virtual real estate — settlements at real exoplanets and other astronomical objects.

---

## Navigation hierarchy

```
COSMIC ENTRY  /
  CosmosPage — unified entry point
  Cinematic scene: Laniakea, iridescent voids, black holes, supernovae
  Data layer: 345 X-ray clusters (Takey2013/XMM-Newton), named clusters,
              cosmic voids, supercluster filaments, wormhole conduits
        │
        ├─ → CLUSTER INTERIOR  /cluster-interior/:slug
        │     Named clusters (Virgo, Coma, Perseus, etc.)
        │     Member galaxy sprites; bright galaxy detail panels
        │
        ├─ → X-RAY CLUSTER  /xcluster/:xid
        │     345 Takey2013 clusters; oracle-generated galaxy field
        │     → CLUSTER GALAXY  /cluster-galaxy/:slug/:memberId
        │       → CLUSTER SYSTEM  /cluster-system/:slug/:memberId/:idx
        │         → CLUSTER SURFACE  /cluster-surface/:slug/:memberId/:idx
        │
        ├─ → VOID INTERIOR  /void/:voidId
        │     Great voids (Boötes, Sculptor, KBC, Eridanus, Caelum, others)
        │     Void-wall galaxies; isolated field galaxies; wormhole conduit nodes
        │
        └─ → GALAXY VIEW  /galaxy
              119,614 HYG stars; confirmed/candidate exoplanet hosts
              → SURFACE VIEW  /surface/:hostname/:planetName
                Planet terrain; settlement dome; star field
```

---

## Data sources

| Source | What we use | Status |
|---|---|---|
| NASA Exoplanet Archive | 35,896 confirmed/candidate planets (RA, Dec, Teq, radius) | Active — needs `sy_dist` re-pull |
| Takey2013/XMM-Newton | 345 X-ray clusters (position, redshift, kT) | Active |
| HYG Stellar Database v3 | 119,614 stars for GalaxyPage star field | Active |
| Galaxy Oracle (generated) | 26,225 member galaxies across 345 clusters | Active — seeded, deterministic |
| `cosmic-structures.ts` | 14 named clusters, voids, filaments, BH masses (hardcoded) | Active |
| COSMIC_EVENTS registry | Community events tied to clusters | Active |
| Habitable Exoplanet Catalog | HZ scoring for settlement guide | Planned |
| ATNF Pulsar Catalog | Pulsar nav beacons in GalaxyPage | Planned |
| GWTC-3 GW sky maps | Gravitational wave event rings in CosmosPage | Planned |
| VCC / NED member catalogs | Real member galaxies for named clusters | Planned |
| Gaia DR3 | Better distances + sky-accuracy for near settlements | Planned |

See [blog-data-sources-unified-viz.md](blog-data-sources-unified-viz.md) for the full data source survey and integration priority analysis.

---

## Architecture

### Renderer

A singleton `WebGLRenderer` lives at module scope in `src/composables/useVizRenderer.ts`. It is initialised once by `MainLayout.vue` and shared across all visualization pages. Each page:
1. On mount — creates a `pageGroup`, adds scene objects to it, calls `viz.addTick(fn)` to register a per-frame callback
2. On unmount — disposes geometries/materials, removes `pageGroup` from scene, unregisters tick

This means navigation between visualization pages does not tear down and recreate the WebGL context. Camera position is preserved across route transitions. There is no visual flash or reload.

### Settlement pipeline

Three-stage deterministic pipeline seeded by galaxy cluster ID:
1. **Stellar populations** — star count, spectral mix, binary fraction from cluster mass estimate
2. **Orbital architecture** — planet count, period distribution, stability filter
3. **Planet composition** — radius/mass/temperature → bulk composition → surface type

Output: 2,823 galaxies → 7,096 star systems → 10,900 generated planets. All stable across sessions (same seed = same output). When real catalog data exists for an object, it replaces the generated layer. The route and page component are identical; the data source is what changes.

### Coordinate system

One coordinate frame from the cosmic web to a settlement surface:
- **Comoving Mpc** — cosmic level (1 scene unit = 15 Mpc in CosmosPage/CosmicPage)
- **Parsecs / light-years** — GalaxyPage star positions (HYG RA/Dec/distance)
- **Equilibrium temperature + orbital parameters** — SurfaceViewPage terrain and sky
- **Surface lat/lon** — PON INK `surface_polygon` exolocation coordinate type

---

## Key pages and components

| File | Route | Description |
|---|---|---|
| `CosmosPage.vue` (was `WelcomePage.vue`) | `/` | Cinematic cosmic entry point; shared renderer |
| `CosmicPage.vue` | `/cosmic` | Data-rich cosmic view; X-ray clusters, voids, filaments |
| `GalaxyPage.vue` | `/galaxy` | Milky Way — HYG star field, exoplanet hosts |
| `SurfaceViewPage.vue` | `/surface/:host/:planet` | Planet surface + settlement dome |
| `XClusterPage.vue` | `/xcluster/:xid` | Oracle galaxy field for X-ray clusters |
| `ClusterInteriorPage.vue` | `/cluster-interior/:slug` | Named cluster member galaxies |
| `ClusterGalaxyPage.vue` | `/cluster-galaxy/:slug/:memberId` | Galaxy interior + star system browse |
| `ClusterSystemPage.vue` | `/cluster-system/:slug/:memberId/:idx` | Star system orrery |
| `ClusterSurfacePage.vue` | `/cluster-surface/:slug/:memberId/:idx` | Generated planet surface |
| `VoidInteriorPage.vue` | `/void/:voidId` | Void interior — sparse field galaxies, wormhole node |
| `WelcomeOverlay.vue` (planned) | component | Role-aware welcome panel over CosmosPage |
| `DefenderNav.vue` | component | Arcade-style 360° horizontal strip navigator |
| `src/composables/useVizRenderer.ts` | — | Singleton WebGL renderer shared by all pages |
| `src/data/cosmic-structures.ts` | — | Named clusters, voids, filaments, BH catalog |
| `src/data/events.ts` | — | Community events + settlement registry |
| `src/lib/settlements.ts` | — | localStorage settlement browser store |

---

## Working assumptions (updated June 2026)

### Changed from earlier assumptions

**Single renderer, not per-page canvases.** The original design created a new WebGL context on every page mount. The phase2 branch replaced this with a singleton renderer in `useVizRenderer`. All visualization pages share one context. This was necessary to eliminate the context-limit exhaustion on modern browsers and to enable seamless camera continuity across route transitions.

**WelcomePage is the cosmic entry point.** What was a landing page with navigation buttons to separate cosmic and galaxy views is now the first level of the navigable universe. The rename to `CosmosPage` reflects this. A `WelcomeOverlay` component handles role-specific messaging without blocking the 3D scene.

**Orbital zone and exomoon settlements are in schema, not in scene.** The PON INK exolocation schema already supports `orbital_zone` and surface coordinates for moons (`parent` param). The Three.js scenes for these settlement types do not yet exist. `StationPage.vue` exists at `/station` but its scene is a placeholder. This is a known gap — see SPEC_COSMOS_ENTRY.md.

**Black holes are metadata, not destinations.** Black hole masses and types are stored on named cluster `brightGalaxies` entries. There is no route or scene for approaching a black hole. The decorative BH geometry in CosmosPage is illustrative. An enterable BH scene (Schwarzschild radius, photon sphere, accretion disk geometry) is planned.

**Sky accuracy is unresolved.** The surface view star field uses the Earth-viewpoint HYG catalog. For settlements within 200 ly this is approximately correct. Beyond that, the constellations visible from a settlement differ from Earth's. A per-settlement sky catalog generator (Python, offline, using galactic coordinate transforms) is specced but not built.

**Oracle-generated galaxies are clearly labelled.** The 26,225 member galaxies generated by the oracle pipeline are statistically representative of their cluster type. They are not catalog data. Every oracle galaxy is labelled as generated in its detail panel. When real member data is added for a cluster (NED API query), it replaces the oracle layer without changing the route.

### Stable assumptions

- GPL v3. Community owns its data. On-chain records are public.
- Real data always takes precedence over generated data. Generated data is clearly labelled.
- Accessibility first: every feature reachable on mid-range Android at 3G.
- Culture is the vehicle: music, visual art, and spatial storytelling are not decoration.
- Mint-time contribution allocation only (the "resonance split"): the large majority to the
  creator, a slice to the Community Fund, a small platform-maintenance share. Paths are
  computed independently and never combined in one figure (fee isolation).
- No secondary market, no resale royalty, no yield to passive holders. Exotopia does not host
  or facilitate resale; `seller_fee_basis_points` is 0. A settlement record confers no claim on
  future platform revenue. The earlier "80/15/5 settlement revenue" line described a secondary-
  sale aftermarket that was removed in the risk-reduction pass — see blog-risk-reduction-pass.md.
- E8 lattice wormhole transit as the narrative mechanic for long-distance navigation.

---

## Developer setup

```bash
npm install
npx quasar dev          # dev server at http://localhost:9000
npx quasar build        # production build to dist/spa/
npx vue-tsc --noEmit    # TypeScript check (one pre-existing deprecation warning is expected)
```

Node 18+ required. Quasar v2 / Vite v2 / Vue 3 / TypeScript.

### Environment

No environment variables required for local development. The app runs entirely client-side (SPA). Galaxy data loads from `public/exoapril2_2024.json` (~17 MB). X-ray cluster data loads from `public/clusters-xray.json` (~250 KB).

---

## Status (July 2026)

| Component | Status |
|---|---|
| CosmosPage (cinematic cosmic entry) | Complete — now on shared renderer |
| CosmicPage (data-rich cosmic view) | Complete — X-ray clusters, voids, filaments, conduits |
| GalaxyPage (Milky Way star field) | Complete — HYG + exoplanet hosts, confirmed/candidate systems |
| SurfaceViewPage (planet surface) | Complete — terrain, dome, star field |
| XClusterPage → ClusterSurfacePage chain | Complete — full 5-level descent from X-ray cluster |
| VoidInteriorPage | Complete — void wall + interior field galaxies |
| OnboardPage — path-based redesign | Complete — 5 commitment paths, SCD Hub mission framing, PFAS/eco field emphasis; see blog-onboarding-path-redesign.md |
| Letters Patent deed format (PON INK v1.0) | Complete — ERC-721 + ARC3 dual standard, exoloc_address hierarchy, trophic levels, pathway attributes, SVG deed image; first deed minted June 2026; see blog-letters-patent-deed-format.md |
| WelcomeOverlay component | Planned — SPEC_COSMOS_ENTRY.md |
| CosmosPage → CosmicPage merge | Planned — after DefenderNav data integration |
| Sky-accurate surface star field | Planned — galactic coordinate transform + per-settlement catalog |
| Orbital zone / black hole vicinity scene (StationPage) | Planned — next major scene tier; `orbital_zone` coord type exists, no 3D scene yet; BH Schwarzschild radius + accretion disk geometry specced |
| Exomoon surface scene | Planned — `?parent=` param exists; distinct scene not built |
| NASA ExA re-pull with `sy_dist` | Planned — one-afternoon data task, high impact |
| ATNF Pulsar Catalog integration | Planned |
| GWTC-3 gravitational wave rings | Planned |
| VCC / NED member galaxy catalogs | Planned |
| MAST / Chandra image manifest | Specced — SPEC_CELESTIAL_REVEAL.md |
| DefenderNav strip navigator | Specced — SPEC_DEFENDERNAV.md |
| Frontier NFT system | Specced — SPEC_NFT_FRONTIER.md |
| Rewards & incentive ledger (finance-literacy / volunteering / educating-others points, certificates, mentor sessions) | Complete — see SPEC.md §21 |
| PFAS/PFOA citizen science tooling (methods library, project log, method proposals + endorsements) | Complete — see SPEC.md §24 |
| VoidDefenderNav + void-scale camera framing fix | Complete — see SPEC.md §22 |
| Zoom-descent camera continuity (iris/lightning wipe + bearing handoff) | Complete — 7 pages; see SPEC.md §25 |
| Local Step Portal (physical portal object + light-inversion crossing for landing at a settlement) | Built, not wired in — `src/lib/local-step-portal.ts` is a complete unused module; see SPEC.md §25 and SPEC_ZOOM_DESCENT.md |
| Live guest presence / "parking" at settlements | Not built — still 5 static mockup orbs; see SPEC.md §17.3/§25.4 |
| NFT value/rarity framing risk mitigation | Partial — MintPage.vue hero + pre-mint disclaimer shipped; collector-cards.ts/CollectorCard.vue/GalleryPage.vue schema still proposed — see SPEC_NFT_VALUE_FRAMING.md |

---

## Related documents

**[DOCS.md](DOCS.md) — Complete document index (37 files across all categories)**

### Ownership and access philosophy

| Document | Contents |
|---|---|
| [FOCUS_LOCATION_OWNERSHIP.md](FOCUS_LOCATION_OWNERSHIP.md) | Why we are shifting from NFT jargon to ownership language — the "cosmic land title" framing, onboarding redesign, and what "permanent" technically means |
| [compliance/INDEX.md](compliance/INDEX.md) | Jurisdiction strategy index — classification risk and operating strategy for US, EU, Kenya, Indonesia, Brazil, India, UAE, and 12 more country groups |
| [compliance/RESEARCH_PROMPT.md](compliance/RESEARCH_PROMPT.md) | Legal research brief — structured prompt for jurisdiction-by-jurisdiction legal research (in progress) |
| [compliance/POLYNOMICS-CONTRIBUTION.md](compliance/POLYNOMICS-CONTRIBUTION.md) | Contributor economy legal framework — bounty structures, volunteer classification, polynomics models (RPGF, quadratic funding, platform cooperativism, mutual credit) and operational playbook |
| [SPEC_DOMAIN_COMPETENCY.md](SPEC_DOMAIN_COMPETENCY.md) | Domain competency framework — 12 domains (water, energy, food, circular, shelter, health, biodiversity, soil, climate, restoration, IEK, arts) with four competency levels, evidence requirements, ApproVideo content alignment, and certificate mapping |
| [SPEC_LEARNING_CURRICULUM.md](SPEC_LEARNING_CURRICULUM.md) | Online learning curriculum — WATSAN, Solar, and Citizen Science tracks; flashcard decks, time-sequence module maps, quiz system, and peer art method |
| [compliance/digital-credentials-law/](compliance/digital-credentials-law/INDEX.md) | Digital credentials law — SVG certificate trust hierarchy, regional implementation plan for local ecologist/educator/artist user groups across East Africa, Central America, South America, Southeast Asia, EU, and Pacific |

### Cryptographic proof layer

| Document | Contents |
|---|---|
| [SPEC_ZK_E8_PLONK.md](SPEC_ZK_E8_PLONK.md) | Zero-knowledge lattice proof system — PLONK/halo2 circuits for E8 membership, E8→Λ₂₄ (Leech lattice) bridge for N>8 collaborators, Worldbridger One composite proof, art-hash visual fingerprint pipeline, scanner library, and full Rust crate structure |
| [blog-e8-art-hash-zkp.md](blog-e8-art-hash-zkp.md) | Press release / blog — the art-hash concept explained for general audiences; E8 and Leech lattice primer; real-world application to Lamu coastal cleanup and Mpeketoni table banking |
| [SPEC_WORLDBRIDGER_ONE.md](SPEC_WORLDBRIDGER_ONE.md) | Collaborative attribution protocol — multi-author asset fracturing, DAO resource return loops, KES yield splits |
| [SPEC_PRIVACY_TIMESCALES.md](SPEC_PRIVACY_TIMESCALES.md) | Multi-timescale privacy — real-time E8 projection, 48h operational cache, archival ZK roots, CVE lifecycle |

### Technical specs

| Document | Contents |
|---|---|
| [SPEC.md](SPEC.md) | Full platform specification |
| [SPEC_ZOOM_DESCENT.md](SPEC_ZOOM_DESCENT.md) | Smooth zoom descent chain from home → cluster → system → planet → Local Step Portal → surface; water portal physics; light inversion |
| [SPEC_COSMOS_ENTRY.md](SPEC_COSMOS_ENTRY.md) | CosmosPage rename + WelcomeOverlay design |
| [SPEC_CELESTIAL_REVEAL.md](SPEC_CELESTIAL_REVEAL.md) | LOD image reveal + telescope archive integration |
| [SPEC_DEFENDERNAV.md](SPEC_DEFENDERNAV.md) | Defender arcade-style navigator |
| [SPEC_NFT_FRONTIER.md](SPEC_NFT_FRONTIER.md) | Frontier / predicted exoplanet NFT tier |
| [SPEC_NFT_VALUE_FRAMING.md](SPEC_NFT_VALUE_FRAMING.md) | Integrated fix for NFT/investment-framing legal risk — rarity tiers, scores, and on-chain "Rarity" traits across the collector-card/editions subsystem |
| [SPEC_STARSYSTEM_ALGORITHM.md](SPEC_STARSYSTEM_ALGORITHM.md) | 3-stage deterministic planet pipeline |
| [blog-every-object-a-door.md](blog-every-object-a-door.md) | Navigation chain architecture — wiring done |
| [blog-surfing-the-realms.md](blog-surfing-the-realms.md) | Data pipeline gaps — sky accuracy, L2→L3 |
| [blog-data-sources-unified-viz.md](blog-data-sources-unified-viz.md) | Data source survey + integration priorities |
| [blog-first-flag-remote-worlds.md](blog-first-flag-remote-worlds.md) | The case for extragalactic frontier settlements |
| [GLOSSARY.md](GLOSSARY.md) | Key terms |
