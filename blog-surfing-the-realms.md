# Surfing the Realms: Building a Seamless Zoom from Cosmic Web to Colony Door

**SCD Hub · Exotopia.org · Working draft · GPL v3**
*Internal document — intended for release; review data claims before publishing*

---

## The problem we are actually trying to solve

Exotopia is a navigable universe. The premise is simple: you should be able to start at the cosmic scale — the great voids and filaments of the observable universe — zoom into a galaxy cluster, descend into individual galaxies within that cluster, find a planet system, land on a settlement surface, and look up at the night sky knowing the star positions you see are calibrated to that actual location.

That journey, uninterrupted, is what we mean by *surfability*.

It is not working yet. Not end to end. The individual layers exist — the CosmicPage renders the large-scale structure, GalaxyPage handles star fields and system browsing, SurfacePage loads terrain and settlement geometry — but the connective tissue between them is missing or thin. The data pipeline that would make each zoom level authoritative is incomplete. And the sky-accuracy problem — making sure the constellations visible from a settlement on Kepler-442b match what would actually be visible from 1,200 light-years away in a slightly different position within the galaxy — has not been addressed at all.

This post is a working map of what needs to happen.

---

## What the full journey looks like

The intended navigation path follows the five trophic levels of the PON INK addressing system:

| Level | View | Data source |
|---|---|---|
| L1 | Cosmic Web — voids, filaments, supercluster boundaries | XMM-Newton X-ray cluster catalog; Laniakea reconstruction |
| L2 | Galaxy Cluster — member galaxies, cluster mass distribution | HyperLeda, NED, Takey2013 XMM catalog (345 clusters) |
| L3 | Galaxy / Star Field — individual stars with classification | HYG database (119,614 stars); Gaia DR3 for nearby stars |
| L4 | Planet System — orbits, stellar type, habitability zone | NASA Exoplanet Archive (5,000+ confirmed planets) |
| L5/L6 | Settlement Surface — terrain, dome, sky calibration | PON INK exolocation schema; generated terrain + real star positions |

Each of these levels is partially built. The path between them is the gap.

---

## Where the data is thin

### L1 → L2: The cluster zoom-in problem

Our current Cosmic Web view renders the XMM-Newton X-ray cluster catalog — 345 clusters positioned in three-dimensional space using spectroscopic redshifts converted to comoving distances. The clusters are real. The positions are accurate. What is missing is the ability to *enter* one.

When a user clicks on a cluster node — say, Abell 2029, or the Perseus Cluster — they should descend into a rendered representation of that cluster's member galaxies. We do not yet have member galaxy catalogs linked to each cluster entry. The NED and HyperLeda databases contain this data; it needs to be fetched, cleaned, and joined to our cluster index.

This is the first generation task. It is tractable with Python scripts and HTTP queries to the NED API. We estimate 20–40 hours of processing and cleaning to build a usable L2 → L3 bridge for the top 100 clusters by X-ray luminosity.

### L2 → L3: Galaxy interiors are mostly invented

For galaxies beyond our local group, we have no star-by-star catalog. What we can generate:
- A statistically plausible stellar population based on galaxy type (spiral, elliptical, lenticular), mass, and metallicity
- Cluster structure (core, disc, halo, spiral arms for spirals) using standard parametric models
- Star count proportional to total stellar mass estimates from luminosity data

This is generated data, clearly labelled. NFT holders whose settlements are located in a given galaxy cluster have an interest in calibrating it — correcting arm positions, improving population models as real data becomes available, flagging when a Gaia data release extends coverage that previously required generation.

The ownership-with-calibration model turns what would be a data quality problem into a participation mechanic. A settlement holder on a world in the Virgo Cluster is a stakeholder in the accuracy of the Virgo Cluster rendering. That is coherent.

### L3 → L4: Strong for the Milky Way; absent everywhere else

The NASA Exoplanet Archive gives us 5,000+ confirmed planet systems, all of which are within our galaxy. For these, the L3 → L4 zoom is functional: click a star in the HYG catalog, navigate to its planets, drop to a settlement surface.

For planets located in galaxies beyond the Milky Way, confirmed detections drop to essentially zero — this is the same detection-limit problem described in our earlier post on frontier NFTs. The Frontier tier exists precisely to occupy this space: modelled, hypothesised worlds that will be upgraded as science advances.

### L4 → L5: Sky accuracy is unsolved

This is the most technically interesting problem. A settlement on Kepler-442b sits 1,206 light-years from Earth, in the direction of the constellation Lyra (from our reference frame). From *that* vantage point:

- Our Sun is a magnitude 6.5 star, barely visible to the naked eye
- The constellations we recognise are completely unrecognisable — all nearby stars have shifted laterally
- The galactic core is in a slightly different direction
- Some of the stars in our HYG catalog are close enough that their parallax shift from Kepler-442b's position is measurable

For L5 sky rendering to be honest, the star positions and magnitudes in the surface view need to be recalculated from the settlement's actual galactic coordinates. This is not a trivial transform, but it is a well-defined one — parallax shifts for nearby stars, distance-adjusted apparent magnitudes, galactic rotation accounted for.

We intend to run this as a local Python process: given a settlement's galactic coordinates (derived from the host star's RA/Dec and distance), output a recalculated sky catalog. That catalog becomes the authoritative sky for that settlement's surface view.

---

## The lighting layer

Settlement colonies need to look inhabited, atmospheric, and real — but not photographically real. What we are calling a *post-modern lighting solution* means:

- **Ambient**: driven by the host star's spectral type (an M-dwarf settlement is dim red-orange; an A-type host is brilliant blue-white)
- **Atmospheric scattering**: tunable per atmosphere composition flag in the exolocation schema — thick CO₂ reads differently from thin nitrogen
- **Night sky contribution**: bright nearby stars cast faint shadows; the galactic core contributes a directional ambient glow for settlements in certain galactic positions
- **Dome and settlement materials**: the glass-composite dome geometry refracts and tints the stellar light; pylon surfaces pick up the dominant sky colour

The goal is a lighting environment that is *scientifically grounded* — you can look at a settlement's illumination and learn something real about its host star — while being aesthetically considered. Colony life is not neutral. It has colour and atmosphere and a particular quality of light.

This is Three.js work. The parameters that feed it are data pipeline work. Both are needed.

---

## The participation model for data quality

We are not going to solve the full data problem ourselves. The catalogs are too large, the calibration too specific, and the rate of new discoveries too high for a single team to maintain.

The model that makes sense:

1. **Python-generated base layer** — statistically plausible data for all levels, locally generated, version-controlled, openly licensed
2. **NFT holder calibration** — settlement owners propose corrections; corrections are reviewed and merged; contributors earn ART token rewards through the bulletin disbursement pipeline
3. **Science update tracking** — when NED, Gaia, or the NASA Archive publishes updates that affect a settlement's sky or system, the affected NFT holders are notified and invited to verify or flag discrepancies
4. **Frontier upgrade path** — generated planets that get confirmed by future observatories trigger an automatic upgrade workflow; the holder receives a certificate of confirmation and a new authoritative metadata record

This is not a new idea — citizen science has a long track record of meaningful contributions to astronomical catalogs. What is new is tying participation directly to on-chain settlement ownership. Your land has a stake in the accuracy of the map.

---

## What needs to happen next

In approximate priority order:

- [ ] Build NED API query scripts for member galaxy catalogs; join to Takey2013 cluster entries
- [ ] Write parametric galaxy interior generator for top 100 clusters (spiral arm model, stellar population sampling)
- [ ] Implement galactic coordinate transform for sky-accuracy catalog generation (Python, per settlement)
- [ ] Integrate sky catalog output into SurfaceViewPage star rendering
- [ ] Design lighting parameter schema tied to `star_class` and `atmosphere_type` in the exolocation spec
- [ ] Wire L1 → L2 → L3 zoom routing through the existing portal/wormhole transit system
- [ ] Document calibration workflow for NFT holders

The CosmicPage → GalaxyPage → SurfaceViewPage path is structurally in place. These tasks are about filling it in with data that is real, generated where necessary, and improvable over time.

The realms are there. We are building the roads.

---

*Working draft — SCD Hub / Exotopia.org · GPL v3*
