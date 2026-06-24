# Every Object a Door: Wiring Exotopia's Celestial Navigation

**SCD Hub · Exotopia.org · Working draft · GPL v3**
*Internal document — intended for release; review data claims before publishing*

---

## The gap we have been living with

Exotopia's cosmic views have always been rendered faithfully. The large-scale structure of the observable universe — the void-filament web, the X-ray bright galaxy clusters, the great emptiness of the Boötes and Sculptor Voids — draws from real astronomical catalogs. The star field in the GalaxyPage pulls from the HYG database. The 345 X-ray cluster nodes in the CosmicPage come from the Takey2013 XMM-Newton catalog, positioned using spectroscopic redshifts converted to comoving distances.

The problem was that clicking on almost any of these objects produced nothing. The data was there. The rendering was there. The routes to deeper views existed in the router. What was missing was the connective tissue: the event handlers, the intermediate pages, and the data composables that would allow a user to move *through* the universe rather than merely looking at it.

We have been building that connective tissue. This post describes what got wired, why it was harder than it looks, and what the full celestial reveal system is intended to become.

---

## What "every object a door" means in practice

The intended navigation depth, from the outermost cosmic scale to a settlement surface, follows the five-tier PON INK addressing hierarchy:

| Level | Object | Route |
|---|---|---|
| L1 | Cosmic void — great emptiness | `/void/:voidId` |
| L1 | X-ray galaxy cluster | `/xcluster/:xid` |
| L2 | Member galaxy within a cluster | `/cluster-galaxy/:slug/:memberId` |
| L3 | Star system — individual orbit view | `/cluster-system/:slug/:memberId/:idx` |
| L4 | Settlement surface | `/cluster-surface/:slug/:memberId/:idx` |

Parallel to this, the Milky Way galaxy view has its own chain:

| Level | Object | Route |
|---|---|---|
| L3 | Confirmed exoplanet system | `/galaxy?focusHost={hostname}` |
| L4 | Settlement surface | `/surface/:hostname/:planetName` |

Until recently, the routes existed but most entry points did not. You could navigate to `/cluster-interior/virgo` if you knew the URL. You could not get there by clicking on the Virgo Cluster node in the CosmicPage. This is the distinction between having routes and having navigation.

---

## Sprint 1: Wiring the visible universe

### X-ray clusters as enterable spaces

The 345 Takey2013 clusters are rendered in CosmicPage as glow sprites, sized by X-ray luminosity. Each has a real `xid` identifier, a redshift, an angular size, and a temperature in keV — all from the published catalog.

The new route `/xcluster/:xid` loads `XClusterPage.vue`, which does two things:

1. Fetches `/galaxy-oracle/{xid}.json` — a file of procedurally generated member galaxies, each with a morphological type, angular size, and position within the cluster's coordinate frame. These galaxies are deterministically generated from the cluster seed, so they are stable across sessions and can be referenced by ID.

2. Renders those galaxies as a Three.js particle field, with canvas-generated sprite textures keyed to morphological type. Ellipticals get a warm amber glow. Spirals get a cooler blue-white. The BCG — the brightest cluster galaxy, typically located near the cluster's X-ray centroid — is marked with a nucleus ring.

Invisible proxy spheres sit behind each galaxy sprite and register raycasts. Clicking a galaxy opens a detail panel showing gid, morphology, BCG status, and angular size, with a navigation button that routes to `/cluster-galaxy/xc-{xid}/{gid}`. The `xc-` prefix triggers the stage-3 procedural fallback in `useClusterGalaxyData`, which means the full cluster → galaxy → planet system → surface chain works immediately, using deterministic generation seeded by the cluster and galaxy identifiers.

This is an important pattern: by accepting that generated data *is* the data for galaxy interiors beyond the local group — and by making that generation deterministic and stable — we get a navigable universe of depth without requiring catalogs that do not exist. The data is not fictional. It is statistically representative and permanently consistent. When real member galaxy data is added to a cluster, it replaces the generated layer. The route does not change.

### Void shells as places, not labels

The CosmicPage renders several of the great cosmic voids — Boötes, Sculptor, KBC, Eridanus, and others — as wireframe spheres. They were landmarks. You could see them. They had tooltips. You could not enter them.

The new route `/void/:voidId` loads `VoidInteriorPage.vue`. This page reads all its data from query parameters — name, radius in Mpc, distance from the Milky Way, and whether a wormhole conduit node is mapped at the void periphery. No additional fetch is required.

The Three.js scene renders what a void actually contains: 120 points placed on a distant shell, coloured in warm amber to simulate void-wall galaxies seen from inside the void, and 18 extremely sparse interior points representing the rare isolated field galaxies that inhabit great void interiors. The camera drifts on a slow sinusoidal path. There is almost nothing to see. This is correct — void interiors are among the most sparsely populated environments in the universe, with galaxy densities around 10–20% of the cosmic mean.

The data panel shows physical properties: radius in Mpc and Mly, distance from the Milky Way, ICM temperature (sub-keV — voids produce no X-ray emission), dark matter density (severely underdense), and settlement tier (Frontier — theoretical only). The KBC Void, which surrounds the Milky Way itself, correctly displays as "surrounding the Milky Way" with distance zero.

One technical complication: the KBC Void is excluded from click targets in CosmicPage because raycasting FrontSide geometry from inside a sphere does not register hits. The camera begins inside the KBC Void's radius. All other void hit spheres are wired normally, and the camera flies to the intersection point on the sphere surface — the edge of the void — before routing.

### Non-confirmed stars in the galaxy view

GalaxyPage renders the HYG catalog as a star field, with candidate, frontier, and theoretical systems marked by distinct visual types alongside confirmed exoplanet hosts. Previously, clicking a non-confirmed system produced nothing.

These systems now show a contextual info panel on click — morphologically distinct from the confirmed system panel, with an amber border for candidates, blue-grey for frontier and theoretical. The panel shows the star type label, status badge, spectral data, distance, and a discovery context note. A "Reserve for Settlement" button routes to `/mint` — the appropriate action for an object that does not yet have a confirmed planet but whose host star is in the catalog.

When a confirmed system is clicked and the user enters system view, the focused hostname is written to the URL as `?focusHost={hostname}`. Exiting the system view clears this parameter. This means the galaxy map state is linkable and bookmarkable — a user can share a URL that opens the galaxy map focused on a specific host star.

---

## The data architecture underneath

### Oracle-generated galaxy fields

The galaxy oracle files at `/galaxy-oracle/{xid}.json` are generated offline by Python scripts that apply a parametric model to each cluster: BCG mass, member count scaled to X-ray luminosity, morphological mix (elliptical-dominated in rich clusters, more spiral-rich in poorer groups), and positional scatter calibrated to the cluster's angular size on sky.

The model does not claim to represent the actual member galaxies of any given cluster. It claims to be statistically representative of the *type* of cluster — a distinction we consider important and which the UI makes explicit. Every oracle-generated galaxy is labelled as generated in its detail panel.

Where real member galaxy data exists and has been linked — as is the case for the named clusters (Virgo, Coma, Perseus, Fornax) through the existing cluster catalog pipeline — the oracle layer is bypassed in favour of catalog data. The route and the page component are identical. The data source is what changes.

### The `useClusterGalaxyData` composable

The composable that resolves galaxy data for the `/cluster-galaxy/:slug/:memberId` route uses a three-stage fallback:

1. **Generated JSON** — `/galaxy-oracle/{slug}.json` if the slug matches a known oracle file
2. **Member catalog** — cluster member catalog if the slug matches a named cluster
3. **Pure procedural** — deterministic generation seeded by `slug + memberId` for any other input

The `xc-{xid}` prefix on oracle-sourced routes means stage 1 is bypassed (no oracle file has that prefix) and stage 3 kicks in automatically. The galaxy seen in XClusterPage and the galaxy seen in ClusterGalaxyPage are generated from the same seed, producing consistent morphology, star count, and planet population all the way to the surface view.

This is the key architectural decision that makes the cluster chain work without per-cluster pipeline work for each of the 345 XMM clusters.

---

## Notable Worlds: connecting the galaxy archive to the settlement guide

The PlanetSystemsPage — which serves as the settlement guide — previously contained no live data. It was a static document explaining exolocation, portal transit, DAO governance, and community structure. Useful context, but disconnected from the navigable universe.

A new "Notable Worlds" section now pulls live data from the galaxy store — the same store used by the GalaxyPage — and surfaces the twelve closest confirmed exoplanet systems where at least one planet falls within the 200–400 K equilibrium temperature band. This is an approximate habitable zone filter, weighted toward cooler planets than the classical HZ definition to acknowledge that subsurface liquid water environments may exist well outside the traditional bounds.

Each card links directly to the system in the galaxy map, opening the orbital view where a user can descend through the planet system to a surface view. The section also includes four named cluster galaxy highlights — M87 in Virgo, NGC 4889 in Coma, NGC 1275 in Perseus, NGC 1399 in Fornax — each linking to the cluster interior view.

The intent is to make the settlement guide a starting point for navigation, not just a policy document. A user reading about the habitable zone criteria can click through to a system that meets them.

---

## What is being built next: the celestial reveal

The work described above wires navigation — objects become doors. The next phase is about making the approach itself informative: as the camera closes on an object, the detail it shows should increase.

This is what we are calling the **celestial reveal** system. The spec covers five phases:

**Phase 1 — Navigation completeness** (now substantially complete): every rendered object routes to a meaningful destination. No dead ends.

**Phase 2 — Image manifest**: a JSON file per major object type (named clusters, Milky Way hosts, local group galaxies) that lists known telescope images from Webb, Hubble, and Chandra archives. The manifest stores instrument, filter, image URL or asset path, and the angular coverage. This is curation work — querying MAST, the ESA Hubble archive, and the Chandra data archive, filtering for publicly available science-ready FITS or JPEG products, and cataloguing which objects have coverage.

**Phase 3 — Archive API integration**: for objects in the manifest, the pages that render them will query the relevant archive APIs on first approach to check for new image releases. MAST provides a programmatic search API that can be queried by sky coordinates and angular radius. Chandra's archive supports similar coordinate-based lookup. New images, if found, are added to the manifest for that session.

**Phase 4 — LOD reveal**: the Three.js scenes in CosmicPage and XClusterPage already use distance-based LOD for sprite detail. The next step is using the same distance threshold to trigger image plane overlays — billboard quads that fade in a real telescope image as the camera approaches within a defined distance of an object's position. For the Coma Cluster, this means the canonical Hubble ACS mosaic fades in as the camera crosses the approach threshold. For confirmed exoplanet hosts with JWST transmission spectroscopy data, the spectral plot can appear as a contextual overlay.

**Phase 5 — Observatory browser**: a dedicated page listing all objects in the image manifest with their available instrument coverage, linking to both the in-app view and the original archive record. This is as much a research tool as a navigation aid — it surfaces which parts of the Exotopia universe have real observational backing and which are generated.

---

## Why this architecture matters

The standard approach to space visualisation apps is to render a static scene and annotate it with labels. Clicking a label opens a Wikipedia article or a fact box. The scene is a backdrop.

What we are building is a scene you can enter. The difference is not aesthetic — it is epistemic. A user who descends from the CosmicPage into the Virgo Cluster, selects a member galaxy, navigates to a generated star system, and descends to a settlement surface has made a series of physically meaningful choices. Each level of the descent corresponds to a real scale of structure. The numbers at each level — redshift, Mpc radius, parsecs distance, equilibrium temperature — are correct. The generated content is clearly labelled as generated.

A user who arrives at a settlement surface on a confirmed exoplanet has navigated through real catalog data all the way. The planet is real. The host star's temperature and spectral type are real. The RA and Dec that position the host star in the settlement sky are real. The settlement itself is a claim on a coordinate that is both astronomically verifiable and on-chain immutable.

This is what distinguishes an exolocation deed from a decorative token. The coordinate has content. The content is navigable. The navigation is grounded in data that a user could independently verify against the same public archives we use.

---

## Current status

| Component | Status |
|---|---|
| CosmicPage → XClusterPage | Complete |
| XClusterPage → ClusterGalaxyPage | Complete |
| ClusterGalaxyPage → ClusterSystemPage → surface | Complete (via existing pipeline) |
| CosmicPage void shells → VoidInteriorPage | Complete |
| GalaxyPage non-confirmed stars → info panels | Complete |
| GalaxyPage confirmed systems → URL state | Complete |
| PlanetSystemsPage notable worlds section | Complete |
| Image manifest structure | Specced, not started |
| MAST / Chandra API integration | Specced, not started |
| LOD distance-triggered image reveal | Specced, not started |
| Observatory browser page | Specced, not started |
| Sky-accuracy galactic coordinate transform | Specced (see *Surfing the Realms*), not started |

The navigation chain from the cosmic web to a settlement surface is now complete for all major object types. The next sprints are about making the journey richer — real imagery appearing as you approach objects that have been observed, contextual data deepening as the camera closes.

---

## Open questions

**Manifest curation scope**: Hubble alone has observed on the order of 10,000 distinct targets over its operational life. JWST continues to add. Chandra has a sky coverage map but sparse public JPEG products for many targets. The practical question is what to curate first: the objects users are most likely to encounter (named clusters, bright nearby stars with confirmed planets), or the objects with the richest observational records (which may not overlap significantly). We are inclined toward the former.

**Generated vs. observed blending**: when a real telescope image is available for an object and a generated Three.js scene also exists, how do we blend them? The approach we favour is overlay rather than replacement — the generated scene provides three-dimensionality and navigability; the telescope image provides photometric accuracy and scientific ground truth. A GLSL shader that blends the two based on camera distance seems tractable.

**Community calibration**: the cluster interior views are generated, and generated data has errors relative to the real structure. Who corrects them? The settlement ownership model provides a natural candidate — cluster deed holders have an interest in the accuracy of the cluster they are nominally located in. The mechanism for community-submitted corrections to the oracle files is not yet designed. It is the right next question after the manifest work.

---

*Working draft — SCD Hub / Exotopia.org · GPL v3*
*Astronomical positions from Takey2013 XMM-Newton catalog; cluster distances via spectroscopic redshift. HYG database (v3) for star field. NASA Exoplanet Archive for confirmed and candidate planet systems. Oracle galaxy fields are procedurally generated — not catalog data.*
