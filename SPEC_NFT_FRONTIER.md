# SPEC_NFT_FRONTIER.md — Frontier Exolocation NFTs
### Predicted, Candidate & Undiscovered Exoplanets as Virtual Real Estate
*SCD Hub · exotopia.org · pon.ink · living document — May 2026*

---

## 0. Context & Motivation

The NASA Exoplanet Archive, as of April 2024, contains **6,158 confirmed planets across 4,590 star systems**. These are the confirmed locations that underpin Exotopia's current virtual real estate. But the distribution is radically uneven:

| Survey | Planets | % of total | Sky area covered |
|---|---|---|---|
| Kepler (RA 270–300°, Dec +36–52°) | 3,093 | **50.2%** | ~1% of the sky |
| TESS | 769 | 12.5% | ~85% of sky, shallow |
| K2 | 549 | 8.9% | Ecliptic strip only |
| Radial velocity (ground) | 1,180 | 19.2% | Patchy, solar-neighbourhood bias |
| Microlensing | 278 | 4.5% | Galactic centre only |
| All other methods | 289 | 4.7% | Scattered |

The practical result: **47 sky zones of 30°×30° have fewer than 50 confirmed systems each.** The entire southern sky below Dec −45° — nearly 30% of the full celestial sphere — holds only ~540 confirmed systems. At Dec −90° there are 19.

This is not because those regions lack planets. It is because no dedicated survey has pointed at them long enough to detect transits.

The Frontier NFT system fills these gaps by:
1. Identifying stellar targets in poorly-surveyed regions from all-sky catalogs
2. Assigning statistically predicted exoplanets using observed occurrence rates
3. Minting these locations as a distinct, rarer NFT tier
4. Building an upgrade path so predictions that are later confirmed by science convert to full Confirmed status — with the original holder credited

---

## 1. Sky Coverage Analysis

### 1.1 The Kepler distortion

Kepler stared at one patch for 4 years. That patch now dominates the catalog. Any NFT distribution that simply mirrors the NASA archive would grant 50% of all early locations to people who happen to prefer that one corner of the sky — a direct artefact of telescope pointing, not of any physical significance.

### 1.2 Survey blind spots

The following regions have confirmed system densities < 2 systems per square degree and represent the primary targets for Frontier NFT population:

| Region | RA range | Dec range | Confirmed systems | Dominant gap cause |
|---|---|---|---|---|
| Deep southern sky | 0–360° | −90° to −45° | ~540 | No Kepler; TESS pass rate low |
| North galactic cap | 120–240° | +60° to +90° | ~70 | High galactic latitude, few nearby stars surveyed |
| South galactic cap | 0–120°, 240–360° | −60° to −30° | ~230 | Same as above |
| Galactic centre | 240–285° | −35° to +5° | ~220 | Extinction, crowding; only microlensing works |
| Sculptor/Eridanus | 0–90° | −45° to −10° | ~200 | No major transit survey |
| Coma/Virgo gap | 180–270° | +25° to +60° | ~170 | Between Kepler and TESS deep fields |
| High-northern sky | 60–240° | +60° to +90° | ~130 | Telescope scheduling limits in RA |

### 1.3 Missing stellar populations

Beyond sky gaps, the current catalog under-represents:

- **M-dwarfs** — most common stars (75% of all stars), planet occurrence rate for Earth-sized planets is ~40–50% (Dressing & Charbonneau 2015), but they are intrinsically faint and poorly surveyed outside the solar neighbourhood.
- **Binary/triple systems** — `sy_snum >= 2` makes up 562 records (9%) in the catalog despite multi-star systems comprising ~50% of nearby stellar systems.
- **Old population stars** (thick disk, halo, globular cluster members) — underrepresented; confirmed exoplanet found in globular cluster M4 (PSR B1620-26b) is an extreme example of what exists but hasn't been found.
- **Very nearby stars < 5 pc** — many have no confirmed planets despite being the closest possible locations for colonisation. Proxima Centauri (1.3 pc) has candidates; others remain blank.

---

## 2. Supplementary Data Sources

Each data source corresponds to a NFT tier and a generation method.

### 2.1 Kepler/K2 and TESS Candidate Objects (Tier: CANDIDATE)

| Dataset | Source | Record count | Access |
|---|---|---|---|
| Kepler Objects of Interest (KOIs) | NASA ExoFOP / NExSci | ~8,000 total (~3,000 confirmed, ~5,000 unconfirmed) | Public download |
| TESS Objects of Interest (TOIs) | ExoFOP-TESS | ~7,000+ as of 2024 | Public download |
| K2 Candidates | NASA ExoFOP-K2 | ~500 unconfirmed | Public download |

These are real transit signals observed by space telescopes, with planet probability > 50% by statistical validation. They are **not yet confirmed** by independent radial-velocity measurement but are almost certainly real planetary systems.

The candidate ExoFOP data provides: RA, Dec, stellar parameters, transit depth, orbital period, planet radius estimate, and planet probability score (`FPP` — false positive probability). Records with `FPP < 0.1` (< 10% false positive) qualify for CANDIDATE NFTs.

### 2.2 Hipparcos Stellar Catalog (Tier: FRONTIER)

The **Hipparcos catalog (ESA 1997, revised 2007)** contains 118,218 stars within roughly 1,000 pc with precise parallaxes (distance errors < 10%), B–V colours, and absolute magnitudes. It is all-sky and uniformly sampled.

By cross-matching Hipparcos with the NASA archive, we identify stars that:
- Are in the solar neighbourhood (< 300 pc)
- Are main-sequence F, G, K, or M type (suitable for habitable-zone planets)
- Are **not** already in the confirmed or candidate archive

This yields approximately **80,000–100,000 stellar targets** unrepresented in the current catalog. Using occurrence rates from the Kepler and TESS missions, each star is assigned predicted planets:

```
Predicted planets per star by spectral type (Fressin et al. 2013 / Petigura et al. 2018):
  F/G (Sun-like):  ~1.0 planet per star (all sizes); ~22% have Earth-sized HZ planet
  K-type:          ~1.2 planets per star; ~28% have Earth-sized HZ planet  
  M-dwarf:         ~2.5 planets per star; ~40–50% have HZ rocky planet
```

Predicted planets are assigned a type distribution based on the observed Kepler radius gap (Fulton et al. 2017):
- 30% rocky (R < 1.7 R⊕)
- 40% super-Earth (1.7–4.0 R⊕)
- 20% sub-Neptune (4.0–10 R⊕)
- 10% gas giant (R > 10 R⊕)

Orbital periods are drawn from the observed log-uniform distribution (0.5–1000 days). Equilibrium temperatures are derived from stellar luminosity and orbital distance.

### 2.3 RECONS / Nearby Stars (Tier: FRONTIER — premium subclass)

The **Research Consortium on Nearby Stars (RECONS)** maintains a complete census of star systems within 25 pc (~490 systems as of 2024). This includes many M-dwarfs not well-represented in the main catalog.

Stars within 25 pc with no confirmed or candidate planets form a premium sub-tier of FRONTIER NFTs — they are the closest possible exoplanet addresses, physically meaningful as locations for near-term human reach.

### 2.4 Galactic Population Synthesis (Tier: THEORETICAL)

For sky regions with low Hipparcos density (high galactic latitude, galactic centre), stellar populations are estimated using the **Besançon Galaxy Model (Robin et al. 2003+)**, which predicts:
- Star counts as a function of RA/Dec/distance
- Spectral type distribution
- Stellar age distribution

From these counts, predicted planetary systems are generated using the same occurrence rates as §2.2, then placed at statistically appropriate distances and positions.

The galactic centre (RA 266°, Dec −29°) is a special case: planets there are accessible only via **microlensing** (OGLE, KMTNet, and eventually Nancy Grace Roman). We generate Theoretical NFTs for this region with a "Roman Discovery Zone" flag.

### 2.5 Planet Candidate Archives (TESS Follow-up)

ExoFOP's **Community Follow-up Observation Program (CFOP)** contains disposition notes and ground-based follow-up data for TOIs. Systems with `TFOPWG Disposition: PC` (Planet Candidate) and stellar parameters qualify for CANDIDATE tier.

---

## 3. The Four-Tier System

Every exolocation NFT in Exotopia belongs to one of four tiers. Tier determines rarity multiplier, visual treatment, exolocation address prefix, and upgrade eligibility.

| Tier | Name | Evidence basis | Source data | Rarity multiplier |
|---|---|---|---|---|
| 0 | **CONFIRMED** | Peer-reviewed, NASA archive confirmed | NASA Exoplanet Archive | 1× (baseline) |
| 1 | **CANDIDATE** | Space telescope transit signal, FPP < 10% | ExoFOP KOI/TOI | 2× |
| 2 | **FRONTIER** | Known star, statistically predicted planet | Hipparcos / RECONS | 5× |
| 3 | **THEORETICAL** | Galactic population prediction | Besançon / Gaia zones | 10× |

**Rarity multiplier** applies to all attribute rolls for that location: settlement object rarities, eco-ops reward rates, gallery slot count, and initial property valuation.

### 3.1 Tier descriptions

**CONFIRMED (Tier 0)**
The current standard. Exoplanet is in the NASA confirmed archive. Planet parameters (radius, temperature, orbital distance) are known from observations. Full property features available immediately. No upgrade path needed.

**CANDIDATE (Tier 1)**
Transit signal detected, multiple transits observed, passing statistical validation but not yet radial-velocity confirmed. The planet is almost certainly real — false positive rate < 10%. Parameters are estimated from transit depth and stellar radius, so may carry uncertainty ranges. Visual: warm amber colour in galaxy view, "⚠ CANDIDATE" badge. Full surface environment rendered from estimated parameters. Upgrades to CONFIRMED when archive entry appears.

**FRONTIER (Tier 2)**
No transit signal observed yet. Star is known, distance is precise (Hipparcos parallax), spectral type is known. Planet is **statistically predicted** based on occurrence rates — real with ~17–50% per-star probability depending on stellar type. Parameters are drawn from probability distributions and sealed at mint time (the predicted planet is fixed for that NFT). Visual: dim blue-white with "◌ FRONTIER" badge. Surface rendered with wider environmental uncertainty range. Upgrades to CANDIDATE when a transit is detected, or directly to CONFIRMED via RV discovery.

**THEORETICAL (Tier 3)**
No individual star targeted. Placed in a sky zone based on stellar population statistics. Could correspond to any one of thousands of real stars in that region — the specific star is not known. Highest rarity, lowest certainty. Visual: very dim desaturated violet (current `buildTheoreticalSystems()` style), "⊙ THEORETICAL" badge. Limited surface features. Upgrades to FRONTIER if a specific Hipparcos star within the zone is matched, or directly to CANDIDATE/CONFIRMED if the zone yields a planet discovery.

---
### 3.2 Generative Minting Style Configurations

To allow user-configured customization of properties, Frontier NFTs seal a "Generative Style Matrix" into the metadata alongside astronomical seeds. Users construct their custom style by linking and stacking up to five live ecosystem sources:

1. **Worldbridger Cultural Source (`style_worldbridger`)**: Links specific track hashes from Worldbridger One musicians/artists. Modulates the Three.js procedural displacement frequency on the planet's surface terrain mesh.
2. **Ecocity Structural Library Code (`style_ecocity`)**: Links exchangeable 3D asset code from ecocity.com settlement models. Dictates the procedural structural geometry framework of the early settlement dome boundaries.
3. **Robot Mule Knowledge Vector (`style_knowledge_delta`)**: Pulls regional field land knowledge data. Modulates the ambient ground-plane texturing, color gradients, and atmospheric haze parameters of the `SurfaceViewPage` canvas layer.
4. **Gallery Event Footprint (`style_event_metadata`)**: Binds specific show metadata footprints. Influences the celestial lighting conditions (e.g., dynamic nebula illumination or ambient lighting states) in both the Galaxy view and Surface sky layers.
5. **Settlement History Footprint (`style_settlement_footprint`)**: Integrates live timeline/occupancy logs. Drives secondary accent distributions, asset patterns, and particle system behaviors.

#### On-Chain Configuration Schema
At mint time, the user's saved preferences generate a `generative_style_vector` structural profile encoded into the token metadata payload:

"generative_style_vector": {
  "user_saved_preset_id": "alpha_pioneer_v1",
  "style_worldbridger": "ipfs://QmTrackArtistSignatureHash...",
  "style_ecocity": "solana:account:EcoSolution3DObjectCodeAddress...",
  "style_knowledge_delta": "delta:field:narok-water-004",
  "style_event_metadata": "event:id:fana-ka-june-2026",
  "style_settlement_footprint": "history:log:epoch-zero-init"
}

## 4. Exolocation Address Formats

All four tiers use the `exo-` prefix scheme already established in the system.

```
Tier 0 — CONFIRMED:
  exo-surface-v1:[hostname]:[planet_name]
  e.g. exo-surface-v1:Kepler-442:Kepler-442b
  (existing format — unchanged)

Tier 1 — CANDIDATE:
  exo-candidate-v1:[catalog]:[object_id]:[planet_letter]
  e.g. exo-candidate-v1:toi:4633:b
  e.g. exo-candidate-v1:koi:7016.01:b
  catalog: 'toi' | 'koi' | 'k2oi'
  object_id: integer TOI/KOI number
  planet_letter: b, c, d, …

Tier 2 — FRONTIER:
  exo-frontier-v1:[catalog]:[star_id]:[planet_letter]
  e.g. exo-frontier-v1:hip:12345:b
  e.g. exo-frontier-v1:recons:proxima-cen:d
  catalog: 'hip' (Hipparcos HIP number) | 'recons' (RECONS name) | 'gaia' (Gaia DR3 source_id)
  planet_letter: b, c, d, … (assigned at mint, sealed)
  
  Premium sub-tier (within 25 pc):
  exo-frontier-near-v1:[catalog]:[star_id]:[planet_letter]

Tier 3 — THEORETICAL:
  exo-theoretical-v1:[zone_id]:[index]
  e.g. exo-theoretical-v1:south-cap-3:0042
  e.g. exo-theoretical-v1:roman-zone:0108
  zone_id: canonical zone name from zone registry (see §8)
  index: sequential within zone, zero-padded to 4 digits
```

### 4.1 Address and Style Immutability During Upgrade

When an NFT advances through tiers (e.g., FRONTIER → CONFIRMED), the structural address mutation pipeline executes as follows:
- The original exolocation address is preserved under `predecessor_address`.
- The user's **Generative Minting Style Configuration is explicitly inherited** by the newly minted Tier 0 token. 
- **Provenance Evolution**: The astronomical metrics (terrain gradients, sky accurately mapped via `pl_eqt`) override the *purely statistical placeholders*, but the visual style vectors (`style_worldbridger`, `style_ecocity`) remain active. This ensures the artistic choice of the original holder is visibly retained on the verified planet page.


---

## 5. Visual Representation in Exotopia

### 5.1 Galaxy view (GalaxyPage) — star dot appearance

| Tier | Colour | Size | Opacity | Badge |
|---|---|---|---|---|
| CONFIRMED | Full spectral (star teff) | 2.8–8 scene units | 1.0 | None |
| CANDIDATE | Warm amber `#f0a030` | 2.0–5 scene units | 0.80 | Small amber ⚠ dot |
| FRONTIER | Pale blue-grey `#8899bb` | 1.5–3 scene units | 0.65 | Faint ◌ ring |
| THEORETICAL | Desaturated violet `#6655aa` | 1.2 scene units | 0.55 | None (current style) |

### 5.2 Surface view (SurfaceViewPage)

All four tiers can be entered and explored. The surface environment is rendered from the best available data:

| Tier | Terrain quality | Sky accuracy | Settlement feature limit |
|---|---|---|---|
| CONFIRMED | Full palette from `pl_eqt` | Host star at exact RA/Dec, true planets in sky | Full — all objects |
| CANDIDATE | From estimated `pl_eqt_est ± σ` | Estimated star position from TOI catalog | Most objects; gallery limited to 2 |
| FRONTIER | Predicted type → terrain | Host star from Hipparcos RA/Dec, no sibling planets unless predicted | Settlement dome + library only |
| THEORETICAL | Generic zone palette | Statistically typical star in sky (drawn from zone population) | Dome only |

### 5.3 DefenderNav strip appearance

In system mode, CANDIDATE/FRONTIER/THEORETICAL planets shown with:
- Orbit rings in their tier colour (amber / blue-grey / violet)
- Planet dots at their predicted orbital radius
- A subtle uncertainty band (dashed wider ring) for FRONTIER/THEORETICAL showing the ±1σ orbital uncertainty
- "?" label suffix at zoom ≥ 2×: `"Kepler-9005b (?)"` for CANDIDATE, `"HIP-12345 b (pred.)"` for FRONTIER

---

## 6. Scarcity Model and Distribution

### 6.1 Hard caps per tier

| Tier | Global cap | Rationale |
|---|---|---|
| CONFIRMED | None (grows with NASA archive) | Mirrors real science |
| CANDIDATE | ~13,000 (matches KOI + TOI unconfirmed count) | Hard cap at catalog size |
| FRONTIER | 30,000 | ~1/3 of eligible Hipparcos targets; rest held for future epochs |
| THEORETICAL | 50,000 | Chosen for scarcity; ~0.01% of predicted galactic planets |

Caps may be increased by DAO vote only (requires > 66% of governance token holders).

### 6.2 Distribution channels

**CONFIRMED:** Standard mint via pon.ink marketplace. Earned through eco-ops milestones or purchased.

**CANDIDATE:** 
- 40% reserved for eco-ops earned distribution (milestones, field work, module completion)
- 40% purchasable on pon.ink marketplace at graduated price tiers
- 20% reserved for SCD Hub community pool (event prizes, facilitator rewards)

**FRONTIER:**
- 60% earned-only for the first 12 months post-launch (eco-ops milestone rewards)
- 30% purchasable after month 12
- 10% held by SCD Hub community pool

**THEORETICAL:**
- 80% earned-only (never purchasable for first 24 months)
- 20% held by SCD Hub community pool as prize pool for community milestones
- No marketplace listing until after 24 months

This creates a system where the rarest locations — the ones that will be most valuable if science confirms them — flow primarily to active participants, not early speculators.

### 6.3 Pricing model (purchasable tiers)

Base prices are set in USDC via pon.ink, subject to DAO governance adjustment:

| Tier | Base price | Price multiplier for premium sub-tiers |
|---|---|---|
| CONFIRMED | 5 USDC | 2× for HZ planets, 3× for Earth analogs |
| CANDIDATE | 12 USDC | 1.5× for FPP < 1% |
| FRONTIER | 35 USDC | 3× for within-25pc premium; 1.5× for HZ predicted |
| THEORETICAL | 80 USDC | 2× for Roman/PLATO zone pre-allocation |

Revenue split: 80% SCD Hub mission / 15% SCD Hub operating fund / 5% pon.ink platform fee (existing 80/15/5 split).

---

## 7. The Upgrade Chain — Discovery Validation

When science advances and a predicted location gets confirmed, the NFT holder benefits. This is the core incentive for holding Frontier and Theoretical NFTs: the bet that the sky will be filled in.

### 7.1 Upgrade trigger conditions

| From tier | To tier | Trigger |
|---|---|---|
| THEORETICAL | FRONTIER | A Hipparcos/Gaia star is matched to the zone with < 0.5° angular offset |
| THEORETICAL | CANDIDATE | A TOI/KOI appears within 1° of zone centre |
| THEORETICAL | CONFIRMED | Any confirmed planet appears within 1° of zone centre |
| FRONTIER | CANDIDATE | A transit detection (TOI) matches the star's RA/Dec within 0.01° |
| FRONTIER | CONFIRMED | NASA archive entry for that Hipparcos star |
| CANDIDATE | CONFIRMED | NASA archive `pl_status = 'CONFIRMED'` for that KOI/TOI |

### 7.2 Validation process

1. **Automated scan**: The Exotopia data pipeline runs weekly. It cross-matches the NASA Exoplanet Archive, ExoFOP TOI list, and SIMBAD against the frontier/theoretical location registry.

2. **Match found**: If a match is found, a proposed upgrade is flagged on-chain (Solana, using existing pon.ink NFT infrastructure).

3. **DAO review window**: 14-day review period. Any DAO token holder can challenge the match (e.g., angular offset too large, wrong stellar identity). Challenge requires staking 10 governance tokens (returned if challenge upheld).

4. **Upgrade execution**: After 14 days with no valid challenge (or with challenge resolved), the upgrade is executed:
   - NFT metadata updated to new tier
   - `predecessor_address` field added
   - `upgrade_evidence` field added (arxiv DOI or NASA archive URL)
   - `upgrade_date` field added

5. **First Cartographer token**: Original holder receives a soulbound **First Cartographer** badge token for that system. This is non-transferable, permanent, and visible on their Exotopia profile. It carries no direct utility but permanent recognition.

6. **Bonus attributes**: Upgraded NFT gains the full confirmed-tier attribute set, plus a `discovery_generation: N` counter (N = 1 for theoretical→confirmed in one step, 2 for two-step, etc.). Lower generation = rarer provenance.

### 7.3 Reversal protection

If a candidate or frontier is later **retracted** (false positive confirmed, star parameters revised), the NFT is flagged `status: disputed` and displayed with a red ⚠ badge. No downgrade in tier occurs automatically — tier can only decrease via DAO vote with > 75% threshold. Disputed NFTs retain all utility but carry the badge permanently.

---

## 8. Upcoming Mission Pre-Allocation Zones

Certain sky regions are targets for upcoming missions that will likely yield large numbers of discoveries in 2026–2032. We pre-allocate named zones for Theoretical NFTs in these regions, giving them additional provenance value.

### 8.1 Roman Space Telescope — Galactic Bulge Survey

**Nancy Grace Roman Space Telescope** (launch 2026) will observe the galactic bulge via microlensing for 72 days per year, discovering an estimated **100,000 cold planets beyond the snow line**.

```
Zone ID: roman-zone
Centre: RA 266.5°, Dec −29.0° (Sgr A* direction)
Angular size: 2° × 2° (Roman microlensing fields 1–7)
Theoretical NFT allocation: 8,000
Visual flag: 🔭 "ROMAN ZONE" in strip strip
```

Holders of `exo-theoretical-v1:roman-zone:*` NFTs have the highest expected conversion rate to CONFIRMED of any Theoretical sub-tier — microlensing events are single observations but very high confidence.

### 8.2 PLATO Mission — Bright Star Fields

**PLATO (Planetary Transits and Oscillations of stars, ESA)** launches 2026, observes two long-duration fields (2 years each) targeting ~200,000 bright, nearby F/G/K/M stars for habitable-zone rocky planets.

```
Zone ID: plato-1
Centre: RA 253.5°, Dec +60.0° (PLATO-P1 field)
Angular size: ~10,000 deg² (large field)
Theoretical NFT allocation: 15,000

Zone ID: plato-2  
Centre: RA 93.5°, Dec −30.0° (PLATO-P2 field)
Angular size: ~10,000 deg²
Theoretical NFT allocation: 15,000

Visual flag: 🛰 "PLATO ZONE" in strip
```

PLATO specifically targets Earth-analogs in the HZ of Sun-like stars — the highest-value planet class for Exotopia. Pre-PLATO Frontier NFTs for Hipparcos stars within the PLATO fields are tagged `plato_field: P1` or `P2`.

### 8.3 Vera Rubin Observatory (LSST) — Southern Sky Deep Survey

**Rubin/LSST** (first light 2024, science operations 2025+) surveys the entire southern sky (Dec < +35°) to unprecedented depth every few nights for 10 years. It will detect ~10,000 planetary transits including in star clusters and at large distances.

```
Zone ID: lsst-south
Coverage: full southern sky, Dec −90° to +35°
Frontier NFT allocation: 10,000 (Hipparcos stars in southern sky)
Theoretical NFT allocation: 12,000 (galactic-population predictions)
Visual flag: 🌙 "LSST ZONE" in strip
```

### 8.4 Chinese Space Station Telescope (CSST / CSS-OS)

**CSST** (launch ~2026) has a 1.1m primary mirror and ~1 deg² FoV. Primarily a cosmology instrument but a 5-year wide-field survey will cover ~17,500 deg², including sky regions not targeted by TESS or Kepler.

```
Zone ID: csst-zone
Coverage: ecliptic latitude |β| < 40° outside Kepler/TESS deep fields
Theoretical NFT allocation: 5,000
```

---

## 9. Data Pipeline — Generating Frontier/Theoretical Datasets

### 9.1 Candidate dataset (Tier 1)

**Input:** ExoFOP KOI table, TESS TOI list
**Process:**
```
1. Download KOI table from NExSci (filtered: disposition = 'CANDIDATE', FPP < 0.1)
2. Cross-match against NASA confirmed archive (remove already-confirmed KOIs)
3. Download TESS TOI list (filtered: TFOPWG Disposition = 'PC' or 'APC')
4. Assign planet letters (b, c, d ...) by period order per system
5. Compute estimated pl_eqt from stellar parameters + orbital period
6. Output: candidate-exoplanets.json (same schema as exoplanets-viz.json + tier field)
```
**Expected output size:** ~10,000–13,000 records
**Update cadence:** monthly (ExoFOP updates frequently)

### 9.2 Frontier dataset (Tier 2)

**Input:** Hipparcos main catalog (hipparcos.dat), NASA confirmed + candidate archive
**Process:**
```
1. Parse Hipparcos: extract HIP id, RA, Dec, B-V colour, parallax, V magnitude
2. Convert B-V → approximate Teff using calibration (Sekiguchi & Fukugita 2000)
3. Classify as F/G/K/M based on Teff
4. Filter: main-sequence only (absolute magnitude within ±1.5 mag of MS fit), Teff 2700–7500 K
5. Cross-match against NASA archive: remove systems already confirmed or candidate
6. For each remaining star, generate predicted planets:
   a. Draw planet count from Poisson(λ) where λ = occurrence rate for that spectral type
   b. For each planet, draw log-uniform period (0.5–1000 days)
   c. Compute semi-major axis from period + stellar mass estimate
   d. Compute estimated pl_eqt from stellar luminosity + AU
   e. Draw radius from Kepler radius distribution
   f. Assign orbital_tier (surface/L5/orbital_zone) — most predicted planets → surface
7. Assign planet letters b, c, d ... by period order
8. Output: frontier-exoplanets.json
```
**Expected output size:** ~80,000 star targets → ~120,000 predicted planets (cap applied to 30,000 NFT-eligible)
**Update cadence:** annually (Hipparcos catalog is static; re-run when Gaia DR4 available)

### 9.3 Theoretical dataset (Tier 3)

**Input:** Zone registry (see §8), Besançon model predictions or Gaia DR3 statistics
**Process:**
```
1. For each canonical zone (see §8 + appendix for full zone list):
   a. Sample N stars from zone using Gaia density at that galactic lat/lon
   b. Assign distances from log-normal fit to Gaia parallax distribution
   c. Generate predicted planets per star (same method as §9.2)
   d. Place at RA/Dec computed from zone centre + random offset within zone
2. Generate zone_id + sequential index as address
3. Output: theoretical-exoplanets.json
```
**Current implementation:** `buildTheoreticalSystems()` in GalaxyPage.vue (5 hand-coded zones, 380 systems) is a proof-of-concept. The full pipeline replaces this with a proper generated dataset loaded from `public/frontier-exoplanets.json` and `public/theoretical-exoplanets.json`.

### 9.4 Output schema (common to all tiers)

All three supplementary datasets use the same field schema as `exoplanets-viz.json` with these additions:

```json
{
  "pl_name":    "HIP-12345 b",
  "hostname":   "HIP-12345",
  "tier":       "frontier",
  "tier_index": 2,
  "source_catalog": "hipparcos",
  "source_id":  "12345",
  "pl_eqt":     289,
  "pl_eqt_sigma": 45,
  "pl_rade":    1.3,
  "pl_rade_sigma": 0.4,
  "pl_orbsmax": 0.88,
  "prediction_method": "occurrence_rate_hip",
  "mission_zone": null,
  "upgrade_candidates": [],
  "cb_predicted": false,
  "nft_eligible": true,
  "nft_address": "exo-frontier-v1:hip:12345:b",
  "generative_style_enabled": true,
  "generative_style_vector": {
    "style_worldbridger": "ipfs://QmTrackArtistSignatureHash",
    "style_ecocity": "solana:account:EcoSolution3DObjectCodeAddress",
    "style_knowledge_delta": "delta:field:narok-water-004",
    "style_event_metadata": "event:id:fana-ka-june-2026",
    "style_settlement_footprint": "history:log:epoch-zero-init"
  }
}
```

---

## 10. Governance and Oracle Model

### 10.1 Upgrade oracle

The weekly cross-match scan (§7.2) is run by a designated oracle operated by SCD Hub. Oracle results are posted as on-chain Solana transactions that trigger the 14-day review window. The oracle code is open-source (MIT licence) and reproducible from public data.

Anyone can run the oracle script independently to verify results. Instructions published in the Exotopia GitHub wiki.

### 10.2 DAO governance scope

The DAO governs:
- Changes to hard caps (§6.1)
- Changes to upgrade match thresholds (§7.1)
- Addition of new mission zones (§8)
- Changes to pricing or distribution ratios (§6.2)
- Dispute resolution for upgrade challenges (§7.2)
- Decisions to retire zones (if a zone has been superseded by complete survey coverage)

The DAO does **not** govern the science itself. If NASA says a planet is confirmed, it is confirmed. The DAO only governs Exotopia's matching rules and economic parameters.

### 10.3 Transparency commitments

- Full cross-match database published publicly at a static URL, updated weekly
- All upgrade events are on-chain (Solana) and queryable
- First Cartographer token registry is public
- The prediction generation scripts (§9) are open source
- All zone boundary definitions are published in the zone registry (this document, Appendix A)

---

## Appendix A — Zone Registry

Full canonical zone list for Theoretical NFT placement. Each zone has a stable `zone_id`, bounding box, stellar population estimate, and NFT allocation.

| zone_id | RA range | Dec range | Pop. estimate | NFT allocation |
|---|---|---|---|---|
| `south-cap-1` | 0–360° | −90° to −75° | ~2,000 stars | 1,500 |
| `south-cap-2` | 0–90°, 270–360° | −75° to −60° | ~4,000 stars | 2,000 |
| `south-cap-3` | 90–270° | −75° to −60° | ~4,000 stars | 2,000 |
| `sculptor-eridanus` | 0–90° | −45° to −10° | ~12,000 stars | 3,000 |
| `south-mid-1` | 0–60° | −60° to −30° | ~6,000 stars | 1,500 |
| `south-mid-2` | 120–210° | −60° to −30° | ~5,000 stars | 1,500 |
| `galactic-cap-n` | 120–240° | +60° to +90° | ~1,500 stars | 1,000 |
| `galactic-cap-s` | various | −60° to −30° (high |b|) | ~3,000 stars | 1,500 |
| `coma-virgo-gap` | 180–270° | +30° to +60° | ~8,000 stars | 2,500 |
| `oph-sgr-gap` | 240–285° | +5° to +30° | ~5,000 stars | 1,500 |
| `roman-zone` | 260–273° | −32° to −26° | galactic bulge | 8,000 |
| `plato-1` | 243–264° | +54° to +66° | ~50,000 stars | 15,000 |
| `plato-2` | 83–104° | −36° to −24° | ~30,000 stars | 15,000 |
| `lsst-south` | 0–360° | −90° to +35° (excl. above) | ~200,000 stars | 12,000 |
| `csst-zone` | various (ecliptic mid-lat) | |β| < 40° excl. Kepler | ~15,000 stars | 5,000 |
| **TOTAL** | | | | **~72,000** |

*Caps applied: Theoretical tier hard cap of 50,000 means lower-priority zones are minted last.*
