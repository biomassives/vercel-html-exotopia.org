# The Cartography Problem: Data Sources for a Navigable Universe

## What we have, what we're missing, and which catalogs would close the gaps from the cosmic web to an exomoon colony door

**SCD Hub · Exotopia.org · Working draft · GPL v3**
*Internal document — intended for release; review data claims before publishing*

---

## The goal we are building toward

The branch we are calling the unified visualisation entry point has one stated ambition: a single entry point from which a user can navigate — without dead ends, without jumping out to a different UI, without the journey breaking — from the observable universe's large-scale structure all the way down to a settlement surface on an exomoon, an exoplanet, an object in orbit around a black hole, or a habitat planted at an intersectional node deep inside a great cosmic void.

That ambition is navigational, but it rests entirely on data. The rendering layer can be beautiful. The routing can be wired. But the thing that makes a journey *meaningful* — the thing that distinguishes this from a screensaver — is whether the numbers at each level of descent correspond to something real. Whether the X-ray temperature on the cluster card is from a published catalog. Whether the equilibrium temperature on the planet card is from a measured transmission spectrum. Whether the coordinates of a void interior settlement are in a space that has actually been mapped and named.

This post catalogs what we have, what we are missing at each level of the descent, and which external data sources would most directly close the gaps. It is also a proposal for what to incorporate next.

---

## Level 1 — The cosmic web

### What we have

**Takey2013 / XMM-Newton catalog** (`public/clusters-xray.json`) — 345 galaxy clusters, each with right ascension, declination, spectroscopic redshift, comoving distance in Mpc, and X-ray plasma temperature in keV. This is the backbone of the CosmicPage. Clusters are positioned in three-dimensional space using the redshift-to-comoving-distance conversion. X-ray temperature drives the colour rendering: hotter clusters (above 6 keV) appear in blue-white; cooler clusters are amber. Source credit is embedded: `NASA/HEASARC/Takey2013`.

**Named cosmic structures** (`src/data/cosmic-structures.ts`) — a curated handcrafted layer for the 14 most prominent clusters in the local universe, each with dark matter halo radius, virial mass, filament connections, brightest member galaxies, and black hole masses where known. Virgo, Coma, Perseus, Fornax, Centaurus, Hydra, Norma, Shapley, the Andromeda Group, and the Bullet Cluster among others. These are authoritative — positions from well-constrained distance moduli, BH masses from Event Horizon Telescope imaging or stellar dynamics studies, DM halo radii from X-ray hydrostatic mass estimates.

**Cosmic void shells** — Boötes, Sculptor, KBC, Eridanus, Caelum, and others, hardcoded with approximate radii and centre distances from published void surveys. The KBC Void (`r ≈ 300 Mpc`) is correctly treated as surrounding the Milky Way.

**Supercluster boundaries** — Laniakea, Perseus-Pisces, Coma-Great Wall, and Shapley, defined by member cluster lists, drawn as coloured label markers.

### What is thin

The 14 named clusters are well described. The remaining 331 X-ray clusters have only position, redshift, and temperature. No member galaxy data. No filament connections. No virial masses. No sub-structure. They are navigable but nearly empty.

The void shells are spherical approximations. Real voids are not spherical. They are irregular, multiply-connected, and bounded by sheets and filaments. The Boötes Void alone has a complex non-convex shape, and the boundary between adjacent voids — where two empty regions share a common wall — is physically interesting: the void-wall intersection is a sheet of galaxies, thinner than any cluster filament, and it is exactly the kind of structure where isolated settlements in unusual environments make sense.

### Potential new sources

**SDSS DR17 Void Catalog** (Mao et al. / Pan-STARRS VIDE outputs) — computational void-finding on the SDSS photometric survey. Provides void centre coordinates, effective radii, and ellipticity parameters. Would let us replace spherical void shells with properly shaped void bodies and populate void walls with real galaxy positions.

**Cosmic Web filament catalog — NEXUS+ or SpineWeb** — the 3D filament skeleton of the local universe, computed from density field reconstructions (Wiener filter on galaxy surveys). These are published as sets of filament segment endpoints in Mpc. Loading these would let us render actual filament spines — not just lines between clusters — and surface the true void-wall intersections. The intersection nodes (where two or more filament segments converge) are natural waypoint objects in their own right: denser than void interiors, less crowded than clusters, with unusually high fractions of edge-on disc galaxies.

**HyperLeda / NED member galaxy catalogs** — the NASA/IPAC Extragalactic Database and HyperLeda both provide queryable lists of member galaxies for named clusters, with morphological types, apparent magnitudes, and radial velocities. A Python query pipeline against the NED API for the top 100 clusters by X-ray luminosity would replace oracle-generated membership with catalog-derived membership for those clusters. The remaining 245 clusters would continue to use oracle generation, which is appropriate and honest.

**KiDS-1000 weak lensing convergence maps** — the Kilo Degree Survey's weak gravitational lensing maps provide dark matter density estimates across large sky areas. Integrating these as an optional overlay in CosmicPage would let users switch between the galaxy cluster view and a dark matter density view, making visible the halos and filaments that the baryonic tracers only partially reveal.

---

## Level 2 — Galaxy cluster interiors

### What we have
:q
**Galaxy Oracle** (`public/galaxy-oracle/`) — 345 JSON files, one per X-ray cluster, each contalining a procedurally generated population of member galaxies. The generator uses cluster X-ray luminosity and temperature to set member count, morphological mix (elliptical-dominated in hot rich clusters; more spiral-rich in cooler poor clusters), BCG position and mass, and substructure presence. Total: 26,225 generated galaxies. Generated 2026-05-24. The generation is seeded on cluster ID, making the output stable and referenceable.

**Named cluster bright galaxy lists** — M87, M86, M84, M49 in Virgo; NGC 4889, NGC 4874 in Coma; NGC 1275 in Perseus; NGC 1399 in Fornax; IC 4296 in Centaurus; etc. These are hardcoded in `cosmic-structures.ts` with accurate BH masses and black hole types (`ULSMBH`, `SMBH`, `AGN`).

### What is thin

Beyond the named clusters, the oracle galaxies are plausible but not real. No individual generated galaxy corresponds to an actual observed object. For clusters at high redshift, this is unavoidable — we do not have star-by-star or even galaxy-by-galaxy catalogs for clusters at `z > 0.1`. But for the well-observed nearby clusters, there are published member catalogs that could replace or supplement the oracle layer.

Black holes are listed as metadata fields (`bhMass`, `bhType`) on bright galaxy entries, but they are not yet first-class navigation destinations. There is no route to "enter" a black hole system — no  lets ma. The black holes exist in the data. They do not exist as places.

### Potential new sources

**SDSS photometric galaxy survey (SpecObj / PhotoObj tables)** — the SDSS spectroscopic galaxy catalog contains morphological classifications, photometric redshifts, and coordinate data for hundreds of thousands of galaxies in and around the clusters that fall within the SDSS footprint (roughly the northern sky). For clusters like Coma, Perseus, and Abell 2029, this would provide actual member galaxy populations — each with a real object ID, a real morphology code, and a real redshift.

**VCC — Virgo Cluster Catalog** — 2,096 member and candidate member galaxies in Virgo, with morphological types. Long established, freely available. Directly applicable to the Virgo cluster interior view as a replacement for oracle-generated membership.

**Event Horizon Telescope BH catalog** — the EHT has now resolved emission around M87*, Sgr A*, and has a growing list of targets. Separately, the Black Hole Accretion/Jet Source Catalog (BLJet, or equivalent AGN catalogs) provides sky positions, redshifts, and estimated masses for several thousand confirmed AGN. Representing even 50 of these as enterable objects — with scenes showing the Schwarzschild radius, the innermost stable circular orbit, and the photon sphere — would be scientifically unique in any public visualisation tool.

**Gravitational wave sky maps (GWTC-3)** — the LIGO/Virgo/KAGRA gravitational wave event catalog provides sky-area probability maps for each detected merger event. Neutron star mergers produce kilonovae: r-process element factories. These sky maps are publishable data products (HEALPix format). Rendering even the five most precisely localised events as glowing annular overlays in CosmicPage — marking where two neutron stars collided — would add a layer of time-domain astrophysics that no other visualisation currently includes.

---

## Level 3 — The Milky Way and star fields

### What we have

**HYG Database v3** — 119,614 stars, used in GalaxyPage for the Milky Way star field. Fields include Hipparcos/Gliese/Henry Draper identifiers, RA, Dec, distance in parsecs, spectral type, apparent magnitude, absolute magnitude, and colour index. This is the backbone of the galaxy view. All confirmed exoplanet hosts in our current dataset are cross-referenced against HYG positions.

**NASA Exoplanet Archive** (`public/exoapril2_2024.json`) — 35,896 confirmed and candidate exoplanet records. Fields: planet name, planetary radius in Earth radii, equilibrium temperature, host star RA/Dec, system distance. Most `sy_dist` values read `"N/A"` in this export — the distance field was not populated in this particular archive pull. The HYG cross-reference provides distances for confirmed hosts via stellar name matching.

**Frontier exoplanets** (`public/frontier-exoplanets.json`, `frontier-exoplanets-detail.json`) — file stubs, currently empty. These will hold the modelled/hypothesised Frontier tier world data.

**Candidate exoplanets** (`public/candidate-exoplanets.json`) — file stub, currently empty.

**Interstellar object tracking** (`events/cosmic/plotOumuamua_3i_atlas.py`) — a Python script tracking 1I/'Oumuamua, 2I/Borisov, and 3I/ATLAS trajectories. Currently offline; not connected to the in-app visualisation.

### What is thin

The `sy_dist` field being `"N/A"` for most records means planet distance from Earth is computed via the HYG cross-reference, which works only for named host stars already in HYG. Planets hosted by stars not in HYG lack confirmed 3D placement. The archive now routinely ships `sy_dist` in parsecs in its default column set — re-pulling the archive with the `sy_dist` column populated would resolve this for several thousand systems.

Exomoon candidates are not represented at all. There are currently two strong published candidates — Kepler-1625b-i and Kepler-1708b-i, both large sub-Neptune or Neptune-class objects in wide orbits around gas giants. These are scientifically contested but navigable: they have RA/Dec positions, host star distances, and estimated orbital parameters. A settlement on an exomoon is physically distinct from a planetary surface — tidal locking to the host planet, a sky dominated by the planet's disc, gravitational cycles driving geological activity. The settlement tier infrastructure exists for it. The data and the scene do not.

The interstellar objects are on known trajectories and represent an entirely different category of settlement: transient, non-repeating, requiring transit from a fixed point to an object in motion. They are the closest thing in current astrophysics to a body with no home star.

### Potential new sources

**NASA Exoplanet Archive — refreshed pull with full columns** — a re-query of the Exoplanet Archive composite planetary systems table (`pscomppars`) with the full default column set includes `sy_dist` (parsecs), `st_teff` (host star effective temperature), `st_rad` (stellar radius), `st_mass`, `pl_orbper` (orbital period), `pl_bmasse` (planet mass), and discovery method. This single pull would substantially enrich every planet card in the app without adding any new catalog.

**Habitable Exoplanet Catalog (HEC)** — maintained by the Planetary Habitability Laboratory at the University of Puerto Rico at Arecibo. Provides Earth Similarity Index (ESI), biological complexity index, and surface habitability estimates for confirmed exoplanets meeting basic HZ criteria. The HEC list is short (under 70 objects as of 2026) and curated. Integrating it as a tagging layer on top of the existing NASA Archive data would let the settlement guide surface the best candidates for the first wave of confirmed-planet settlements without adding any new positional data.

**ATNF Pulsar Catalog** — the Australia Telescope National Facility pulsar catalog contains approximately 3,400 pulsars with precise positions, periods, period derivatives, dispersion measures, and distance estimates. Pulsars are natural navigation beacons: they are stable, uniquely identifiable, and galactically distributed. Rendering the nearest few hundred as distinct objects in the GalaxyPage star field — with period information in their info panels — would add a layer that connects Exotopia to the deep space navigation tradition of using pulsar timing as a position reference. They are also the most extreme physical environments in which a theoretical settlement could be placed: millisecond pulsars spin at 700 revolutions per second and are surrounded by relativistic particle winds.

**Gaia DR3** — the 2022 Gaia Data Release 3 contains astrometric solutions, photometry, spectral classifications, and radial velocities for 1.5 billion sources. For Exotopia's immediate purposes, the most useful products are the RVS spectroscopic catalog (refined distances and stellar parameters for bright nearby stars) and the non-single-star catalog (binary and multiple systems). Replacing the HYG base layer with Gaia DR3 data for stars within 500 parsecs would substantially improve the sky-accuracy calculation for nearby settlement surfaces, where proper motion parallax shifts from the settlement's vantage point are largest.

**Exomoon candidate data** (Teachey & Kipping 2018; Kipping et al. 2022) — published in peer-reviewed form; orbital parameters available in the supplementary material of the discovery papers. Two objects: enough to add the exomoon tier to the navigation hierarchy, even if the tier initially contains only two entries. The tier is worth adding because the scene is qualitatively different — a surface view from an exomoon has the host planet filling a large fraction of the sky, and the planetary disc itself cycles through phases.

---

## Level 4 — Planet systems and surface views

### What we have

**PON INK exolocation schema** (`public/exolocation-nft-metadata-template.json`) — the coordinate system for settlement deed metadata. Four `coordinate_system` types: `surface_polygon` (equatorial lat/lon on a planetary body), `orbital_zone` (a band at a given altitude around a star or planet), `void_point` (three-space coordinates inside a cosmic void or open space), and `filament_node` (position on a cosmic web filament). This schema is the authoritative settlement location format.

**Deterministic planet pipeline** — three-stage procedural generator (stellar population sampling → orbital architecture → planet composition), seeded per galaxy cluster ID, producing consistent star systems and planet surfaces across sessions. 2,823 galaxies, 7,096 star systems, 10,900 generated planets as of the last run.

**Settlement browser** (`src/lib/settlements.ts`) — localStorage-based settlement registry with `surfaceKey`, `clusterKey`, and `moonKey` helpers.

**SurfaceViewPage** — existing surface scene: terrain mesh, settlement dome geometry, day/night cycle, and a star field rendered from HYG data.

### What is thin

The sky in the current surface view is not calibrated to the settlement's actual position. The star field is the Earth-viewpoint HYG catalog. For settlements within a few hundred light-years of Earth this is approximately correct; for settlements on confirmed exoplanets at 1,200 light-years (Kepler-442b) or 2,500 light-years (Kepler-62f), the constellations as seen from Earth are unrecognisable from the settlement surface. The galactic core is in a different direction. Our Sun is a faint star.

The surface lighting uses a placeholder ambient; the host star's spectral type is available in the data but not yet driving the scene illumination. An M-dwarf settlement and an A-type settlement should look fundamentally different before you even see the sky.

Orbital-zone settlements — the `orbital_zone` coordinate type in the exolocation schema — have no scene at all. Habitats in orbit around stars, in the circumstellar habitable zone but not on a planet surface, are valid deed types. They need a scene: the star filling the near field, the station geometry against the star disc, a star-free background.

### Potential new sources

**FITS sky catalog output pipeline** — this is internal rather than a third-party source, but it is the most important capability gap at this level. A Python script that takes a settlement's galactic coordinates (derived from the host star's RA/Dec/distance via the coordinate transforms already specced), queries the HYG and Gaia catalogs, applies parallax offsets for nearby stars, and outputs a JSON sky catalog for that specific settlement. The output is a list of stars with apparent magnitude and angular position as seen from the surface. This is the per-settlement sky. Nothing external needs to be fetched at runtime; the catalog is precomputed and bundled.

**Photometric stellar atmosphere models (PHOENIX/BT-Settl)** — the PHOENIX library of synthetic stellar spectra provides wavelength-resolved luminosity for stars across the H-R diagram. The spectral type in the HYG catalog maps directly to a PHOENIX grid point; sampling the PHOENIX SED at three wavelengths gives a physically derived RGB colour for the host star's disc. This is the correct input to the surface scene's ambient light. The library is publicly available; the relevant lookup table for M0–A5 stars fit in a small JSON file.

---

## Level 5 — Void interiors and intersectional points

### What we have

**VoidInteriorPage** — renders the inside of a cosmic void as a near-empty Three.js scene: 120 void-wall galaxies on a distant shell, 18 isolated field galaxies inside, a slow camera drift. Query-parameter driven; no data fetch required. Works today.

**WormholeConduit markers** — points at the periphery of mapped voids where E8 lattice transit routes are anchored, per the SPEC. These are hardcoded positions.

### What is thin

Void interiors are described above as "almost nothing to see." That is physically correct for the large-scale density field. But it is not the whole picture. Great voids contain:

- **Void galaxies** — unusually blue, star-forming, disc-dominated galaxies that have evolved in low-density environments. Their isolation has kept them from the merger-driven quenching that transforms cluster galaxies into red ellipticals. They are scientifically distinct and visually distinct: bluer, more actively star-forming, with higher gas fractions.
- **Void-wall intersections** — where two adjacent voids share a boundary, the sheet between them is a film of galaxies thinner than most filaments. These sheets are physically unique: they are flat, they have measurable thickness, and they curve around the void surface. Settlements here would look out on a two-dimensional galaxy structure — a sky full of galaxies in a band, rather than a cluster.
- **Void minima** — the points of lowest density inside a void, often called the void centre, where matter density drops to roughly 10% of the cosmic mean. These are the emptiest places in the mapped universe. No cluster, no filament, no void wall for tens of Mpc in every direction.
- **Void multiplet tunnels** — adjacent voids that share a narrow passage between them. These are natural wormhole analogues within the large-scale structure — not physically wormholes, but structurally and narratively similar.

None of these sub-structures are currently represented in the data or the scene.

### Potential new sources

**SDSS void galaxy catalogs** — specifically the Void Galaxy Survey (Pan-STARRS / SDSS-based) and the catalog from Kreckel et al. (2012) covering 60 isolated void galaxies with spectroscopy. These would give the VoidInteriorPage real interior objects to render — each with a proper morphological type, star formation rate, and position inside a specific named void.

**Cosmic Void Database (CosmicVoids.net)** — public repository of void catalogs from multiple algorithms (VIDE, Voronoi, ZOBOV) run on SDSS, 2dF, and other galaxy surveys. Provides void centre coordinates, effective radii, ellipticities, and void member galaxy lists. This would replace the current hardcoded approximate void shells with properly shaped bodies and link each void to its actual galaxy population.

**DESI Year-1 large-scale structure catalogs** (released 2024) — the Dark Energy Spectroscopic Instrument has produced galaxy survey data covering significantly more volume than SDSS, including void catalogs run on the DESI BGS (bright galaxy survey) and LRG (luminous red galaxy) samples. These are the current state-of-the-art for void mapping at `z < 0.4`.

---

## Summary table

| Level | Object type | Current data source | Status | Priority gaps |
|---|---|---|---|---|
| L1 | X-ray clusters | Takey2013 / XMM-Newton | 345 clusters, complete | NED member catalogs for top 100 |
| L1 | Named clusters | `cosmic-structures.ts` | 14 clusters, rich metadata | Filament skeleton (NEXUS+) |
| L1 | Cosmic voids | Hardcoded spheres | 7 voids, approximate | SDSS void shapes + galaxy members |
| L1 | Supercluster boundaries | Hardcoded lists | Laniakea, PP, Coma, Shapley | KiDS DM density overlay |
| L1 | GW events | None | — | GWTC-3 sky maps (high impact, low friction) |
| L2 | Cluster galaxies | Galaxy Oracle (generated) | 26,225 generated | VCC (Virgo); SDSS for SDSS-footprint clusters |
| L2 | Black holes | Metadata only | Not enterable | EHT / AGN catalog as nav destinations |
| L3 | Milky Way stars | HYG v3 | 119,614 stars | Gaia DR3 for `d < 500 pc` |
| L3 | Confirmed planets | NASA Exoplanet Archive | 35,896 records; `sy_dist` empty | Re-pull with full columns |
| L3 | Exomoon candidates | None | — | Teachey/Kipping 2018, Kipping 2022 |
| L3 | Candidate planets | Stub file | Empty | Archive candidate table pull |
| L3 | Pulsars | None | — | ATNF catalog (unique scene tier) |
| L3 | Interstellar objects | Python script (offline) | Not in app | Connect trajectory to CosmicPage |
| L4 | Planet surfaces | Generated pipeline | Functional | Sky-accurate catalog per settlement |
| L4 | Orbital zones | Schema only | No scene | Station scene (OZ coordinate type) |
| L4 | Host star lighting | Not wired | Placeholder | PHOENIX SED RGB lookup |
| L5 | Void interiors | Generated sparse scene | Functional | SDSS void galaxies; void minima |
| L5 | Void-wall intersections | Not represented | — | NEXUS+ filament nodes + sheet positions |
| L5 | Wormhole conduits | Hardcoded points | In schema | No immediate gap |

---

## What to incorporate first

If we order by the ratio of (data impact × uniqueness) to (integration friction), three candidates emerge clearly:

**1. NASA Exoplanet Archive re-pull with `sy_dist`, `st_teff`, `st_rad`** — zero new infrastructure. Replace the existing `exoapril2_2024.json` with a fresh pull from the archive API or the bulk CSV download, adding three columns. Every planet card in the app gets richer. Every sky-accuracy pipeline step becomes easier because host star distances are in the dataset directly. One afternoon of work.

**2. GWTC-3 gravitational wave sky maps** — the LIGO/Virgo team publishes HEALPix probability maps for each event as FITS files with open data licences. Converting the five most precisely localised events to simplified sky annuli (centre RA/Dec, inner/outer radius at the 90% credible interval) and rendering them as translucent rings in CosmicPage would add a time-domain astrophysics layer that is genuinely unique in public space visualisation. The narrative resonance — marking the places where space-time rippled — aligns closely with the cosmological framing of the platform.

**3. ATNF Pulsar Catalog** — the catalog is freely available as a plain-text or FITS download. Filtering to the ~800 pulsars with well-constrained distances and plotting them as a distinct object class in the GalaxyPage star field adds a navigation landmark layer with clear in-world meaning (pulsars were used in the Voyager Golden Record as a galactic position reference). It also opens the pulsar tier as a settlement location type — not for the surface, but for the orbital-zone coordinate type, which needs a scene in any case.

The exomoon candidates, void galaxy catalogs, and filament skeleton are all compelling but require more infrastructure. They are right for the second wave.

---

## The one-entry-point architecture this data serves

The unified visualisation branch requires that every object at every level be enterable from a single starting point, with no UI jump or context break. That constraint is navigational. But it has a data implication: the data at each level must be self-consistent in coordinate space.

A settlement surface on Kepler-442b is at a specific point in galactic coordinates. The star field visible from that surface is a geometric consequence of being at that point. The cluster that is nearest that point in the cosmic web is a property of the large-scale structure database. The void that the Milky Way itself sits inside — the KBC Void — is the reason why the surface view's sky has fewer bright nearby galaxies than a settlement in the Virgo Cluster would see.

These are not independent facts. They are the same coordinate system at different scales. The data architecture for the unified visualisation is not a collection of separate catalogs bolted together — it is one coordinate system, from the comoving Mpc scale of the void network down to the surface-normal equatorial lat/lon of a dome settlement. The data sources listed here are the observational inputs to that single system.

That is the cartography problem. The map has one grid. The catalog sources are the survey teams. The unified entry point is the map reader.

---

## Progress update — June 2026

*The section above was drafted during early planning for the unified visualisation branch. This addendum records what has since shipped and recalibrates what comes next.*

### What is live

**The parallax sky is real.** The single most important item from the original "what is thin" list at Level 4 has been implemented. `SurfaceViewPage` now computes every exoplanet host star's actual 3D galactic position in parsec space using `ra`, `dec`, and `sy_dist` from the NASA Exoplanet Archive, then calculates the apparent sky direction of every other host star as seen from the settlement's position. The result is that every settlement sees a genuinely different sky. Land on a planet in the Cygnus arm and the Sun is a faint unremarkable star roughly in the direction of Sagittarius. Land on a planet in the Kepler field — a dense rectangular patch of confirmed hosts — and the 3,000 candidates that produce a visual "waffle" from Earth's perspective dissolve into a naturally scattered sky once the parallax transform removes the observer-frame distortion. This is the new constellations capability. It is running now.

The NASA Exoplanet Archive pull that was listed as priority #1 in the earlier draft — adding `sy_dist`, `st_teff`, and `st_rad` to every record — is also complete. The current `exoapril2_2024.json` carries all three fields for the full 35,896-record dataset. That data drives both the parallax sky computation and the host star colour system.

**Host star spectral colour is wired.** `starColorFromTeff()` converts the measured effective temperature of each host star into a physically derived RGB colour (O-type blue-violet through M-type deep red-orange), which is applied to the host star disc in the surface scene and colours catalog star points in the sky field. An M-dwarf settlement and an A-type settlement look different before you see the landscape.

**The exomoon settlement architecture is specced and coded.** `moon-settlement.ts` implements a six-level trophic hierarchy — Stellar Zone → Planetary Surface/Orbit → Moon Orbit → Moon Surface → Moon–Planet Lagrange → Moon–Planet Interface — each with a named coordinate system identifier, stability classification, access difficulty, and notes on the relevant physics. The Lagrange level distinguishes stable trojan points (L4/L5) from unstable gateway points (L1/L2). The Roche limit and Hill sphere radii are cited as first-class physical parameters defining the L6 liminal zone. The data model for "on the surface of an exomoon with the planet filling a large fraction of the sky" is ready. The Three.js scene for that viewpoint is the next thing to build.

**The Void Oracle loader is live.** `void-oracle.ts` implements fetch-on-demand loading for per-void galaxy population files at `public/void-galaxies/{id}-viz.json`, with in-memory cache and deduplicated concurrent request handling — the same pattern as the galaxy oracle. The Boötes Void file stubs are present. The NED TAP pipeline that will populate them with the 2,836 real NED-sourced galaxies is the active work item.

**Named spatial presets and URL-driven camera navigation are shipped.** `spatial-scopes.ts` defines camera positions for every level of the descent, from `cosmos` (L1 cosmic web) through `surface:zenith` and `surface:horizon` (L5 settlement surface look-modes) through `settlement:pyramid:chamber` (E8 wormhole interior). The `useSpatialLocation` composable wires these presets to URL query parameters with GSAP fly-to transitions, so every view in the descent chain is linkable and shareable.

### The new constellations: what we mean and why it matters

When we say "new constellations," we mean this specifically: a settlement on an exoplanet 1,200 light-years from Earth does not see Orion. It does not see the Big Dipper. The stars that make up those patterns are, from 1,200 light-years away, scattered across the sky in entirely different directions. The patterns that a settlement community would learn — the shapes they would name, the directions they would navigate by — are defined by the local stellar neighbourhood, which is different for every exoplanet.

This is not an aesthetic flourish. It is a necessary consequence of parallax. For stars within a few hundred light-years of a settlement, the angular offset from the Earth-viewpoint position is large enough to produce wholesale rearrangement of the sky. For distant stars (more than ~2,000 light-years away) the shift is sub-degree and the sky background looks similar to Earth's. The transition between "local sky" and "shared background" is the geometric boundary at which a community starts to develop its own astronomical culture — its own names for the bright nearby stars, its own navigation landmarks, its own mythology written in a sky no one on Earth has ever seen.

The parallax computation currently running in `SurfaceViewPage` produces this correctly. Each settlement already generates a unique sky. What does not yet exist is the *cultural* layer on top of it: a system that identifies the brightest stars visible from a given settlement, clusters them into candidate constellation patterns, and surfaces those patterns as named objects in the settlement's information architecture. That system — a settlement-local star chart with community-nameable patterns — is the next frontier in the new constellations work.

### What changes in the priority order

The original "incorporate first" list placed the NASA Archive re-pull, GWTC-3 gravitational wave maps, and ATNF pulsars as the top three. The archive re-pull is done. The order for the rest has shifted:

**1. Exomoon surface scene** — the settlement type that most dramatically demonstrates the new-constellations capability is the exomoon. A settlement on an exomoon has the parent planet — a gas giant, or a rocky super-Earth — visible as a large disc in the sky, cycling through phases. The horizon is physically different: lower surface gravity, different atmospheric depth. The star field has the parallax offset of the exoplanet system's position, not Earth's. And the two confirmed exomoon candidates (Kepler-1625b-i and Kepler-1708b-i) have published orbital parameters that can drive a physically grounded scene. This is the settlement type that does not exist anywhere else in public space visualisation.

**2. Settlement-local star chart and constellation naming** — a lightweight tool that takes the star field already being rendered in `SurfaceViewPage`, identifies the 20–30 brightest visible stars from the settlement's parallax-shifted catalog, and allows the settlement community to name groups of them. This does not require new data — the parallax sky is already computed. It requires a UI layer, a data persistence hook, and a rendering overlay for named constellation lines. The output would be community-owned: each settlement's constellations would live in the settlement's DAO record, not in a central catalog.

**3. Boötes Void galaxy population** — fill `public/void-galaxies/bootes-viz.json` with the 2,836 NED-sourced galaxies from the TAP pipeline. This upgrades the void interior from a generated sparse scene to a real observational dataset. Void galaxies are visually distinctive: unusually blue, disc-dominated, star-forming. The contrast with the cluster interior view (red ellipticals, dense hot X-ray gas) would be immediately visible and scientifically accurate.

**4. GWTC-3 gravitational wave sky maps** — still a high-impact, low-friction addition. The five most precisely localised LIGO events as translucent sky annuli in CosmicPage. The original rationale stands.

**5. ATNF Pulsar Catalog** — pulsars as galactic navigation beacons in GalaxyPage. Connects to the Voyager Golden Record positioning tradition; opens the pulsar orbital-zone settlement type.

### Updated summary table

| Level | Object type | Current status | Next action |
|---|---|---|---|
| L1 | X-ray clusters | 345 live, colour-coded by temperature | NED member catalogs for top 100 |
| L1 | Cosmic voids | Approximate spheres, Boötes oracle live but empty | Fill Boötes from NED TAP pipeline |
| L1 | GW events | Not yet rendered | GWTC-3 annuli in CosmicPage |
| L2 | Cluster galaxies | 26,225 oracle-generated; 14 named bright members exact | VCC for Virgo; SDSS for northern clusters |
| L2 | Black holes | Metadata only, not enterable | EHT scene for M87* and Sgr A* |
| L3 | Milky Way stars | HYG v3, 119,614 stars | Gaia DR3 for `d < 500 pc` |
| L3 | Confirmed planets | 35,896 records, `sy_dist`/`st_teff`/`st_rad` populated | Exomoon candidates (Teachey/Kipping) |
| L3 | Pulsars | Not yet | ATNF catalog (~800 distance-constrained) |
| L4 | Planet surfaces | Parallax sky live; host star colour wired | Constellation naming UI |
| L4 | Exomoon surface | Architecture specced; scene not yet built | Build scene with planet-in-sky |
| L4 | Orbital zones | Schema defined; no scene | Station scene for OZ coordinate type |
| L5 | Void interiors | Sparse generated scene; oracle loader live | Real void galaxy population |
| L5 | Void-wall sheets | Not represented | NEXUS+ filament data second wave |

---

## Real vs. generated — the running ledger (August 2026)

This is the question underneath every item on this page: for a given object on screen, is the number on its card *measured* or *modelled*? Both are legitimate — a modelled number derived from a published density law or scaling relation is not a lie — but they are different epistemic categories, and a user should always be able to tell which one they're looking at. This ledger is the current whole-app tally, counted directly against the files shipped in this repo (not aspirational figures), so it can be regenerated and checked at any time. A companion post, [Counting the Universe](/blog/counting-the-universe), walks through what these numbers mean and how realistic the overall approach is; this table is its source data.

| Category | Count | Real or generated | Source / method |
|---|---|---|---|
| X-ray galaxy clusters | 345 | **Real** — catalogued | Takey2013 / XMM-Newton (`public/clusters-xray.json`) |
| Hand-curated named clusters/groups | 15 | **Real** — literature-anchored | σ_v, T_x, M200, r_vir per cluster from published papers (`cosmic-structures.ts`, `generate_cluster_catalog.py`); includes the Shapley/A3558 calibration work above |
| Individually named bright galaxies (BCGs etc.) | ~56 | **Real** — catalogued | Real positions, Hubble types, and measured/imaged black hole masses (EHT, reverberation mapping, stellar dynamics) |
| Procedurally generated cluster-member galaxies | 26,225 | **Generated** — plausible, not observed | Galaxy Oracle, one file per X-ray cluster, seeded on cluster ID; count and morphology mix driven by that cluster's real T_x/L_X |
| Milky Way stars shipped in-app | 61,817 | **Real** — catalogued (trimmed) | HYG Stellar Database v3 compact export (`public/stars/hyg-compact.json`); the full HYG v3 catalog is 119,614 stars — the app ships a performance-trimmed subset, not the full table, and this page previously stated the untrimmed figure without that caveat |
| Confirmed + candidate exoplanet records | 35,896 | **Real** — catalogued | NASA Exoplanet Archive composite planetary systems table (`public/exoapril2_2024.json`) |
| TESS Objects of Interest (candidate tier) | 6,830 | **Real** — observational, unconfirmed | `public/candidate-exoplanets.json`, `source_catalog: "toi"` |
| "Frontier" predicted planets | 5,000 | **Generated** — statistically anchored | `public/frontier-exoplanets.json`; synthetic planets placed around *real* Hipparcos-catalog host stars, not detections |
| Generated star systems | 7,096 | **Generated** — physically modelled | Deterministic planet pipeline, seeded per real galaxy ID (e.g. `NGC4569`), architecture biased by that galaxy's real cluster-zone/ICM-stress/metallicity inputs |
| Generated planets | 10,900 | **Generated** — physically modelled | Same pipeline; per-planet type/orbit/atmosphere from Stage 2/3 rules in `SPEC_STARSYSTEM_ALGORITHM.md`, provenance-blocked per `SPEC_PROVENANCE.md` |
| Exomoons | 2 confirmed candidates; 0 generated at scale | **Real** (the 2) / **not yet generated** (everything else) | Kepler-1625b-i, Kepler-1708b-i (Teachey & Kipping 2018; Kipping et al. 2022); `moon-settlement.ts` defines a 6-level trophic hierarchy but no bulk moon-generation pass has been run — an open gap, not a hidden one |

Two things fall out of this table worth stating plainly. First, real and generated content sit at roughly comparable scale across the app (order 40,000–45,000 records each way) — this is not a thin real dataset wrapped in a much larger synthetic shell, nor the reverse. Second, every generated row above ties back to a real input at the *type* level (a real cluster's T_x sets its member count and morphology mix; a real galaxy's cluster-zone sets its planetary architecture bias) even where the individual object is not itself observed. That distinction — modelled from real physics vs. fabricated from nothing — is the whole design philosophy, and it's covered in more depth in the companion post.

---

*SCD Hub / Exotopia.org · GPL v3*
*Initial draft data sources: Takey2013 XMM-Newton catalog (NASA/HEASARC); NASA Exoplanet Archive composite planetary systems table; HYG Stellar Database v3; Gaia DR3 (ESA); ATNF Pulsar Catalog (Parkes); Habitable Exoplanet Catalog (UPR Arecibo); Event Horizon Telescope collaboration; GWTC-3 (LIGO/Virgo/KAGRA); SDSS DR17 void catalogs; NEXUS+ cosmic web filament reconstruction; VCC Virgo Cluster Catalog; Kreckel et al. 2012 void galaxy survey; PHOENIX/BT-Settl stellar atmosphere library; Kipping et al. exomoon candidates.*
*June 2026 update: NASA Exoplanet Archive composite planetary systems table (`sy_dist`, `st_teff`, `st_rad` columns populated); parallax sky pipeline implementation in `SurfaceViewPage`; `moon-settlement.ts` trophic hierarchy; `void-oracle.ts` loader.*
*August 2026 update: real-vs-generated ledger added and cross-checked directly against shipped data files; HYG star count corrected (61,817 shipped vs. 119,614 in the full v3 catalog); companion post "Counting the Universe" published covering scale and realism evaluation across the whole app.*
