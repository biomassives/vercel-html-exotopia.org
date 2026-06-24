# Exotopia Star System Algorithm — Data Provenance Specification

**Version:** 1.0  
**Date:** 2026-05-26  
**Status:** Active

---

## Overview

Exotopia planet systems are not invented — they are derived from real astronomical observations
of galaxy clusters through a three-stage deterministic pipeline. Each star system's planets,
host star properties, and orbital architecture trace back to specific multi-wavelength data:
Chandra X-ray temperature measurements, JWST infrared observations, Hubble morphology catalogs,
and redshift surveys. This document describes every stage of that derivation.

---

## Pipeline At a Glance

```
Stage 1: generate_cluster_populations.py
  Source: published catalogs (Takey2013 XMM, NED, HyperLeda, RC3)
  Output: public/clusters/*-members.json
  What:   Member galaxies with positions, Hubble types, optical magnitudes

         ↓

Stage 2: datagathering/enrich_with_architecture.py
  Source: Stage 1 output + cluster ICM parameters (tx_kev, rvir_mpc)
  Output: system_architecture block added to each member
  What:   Zone classification, ICM stress, metallicity gradient,
          planetary architecture bias, telescope anchor assignment

         ↓

Stage 3: datagathering/generate_cluster_starsystems.py
  Source: Stage 2 output + algorithm_version 1.0
  Output: public/star-systems/{cluster_slug}/{galaxy_id}.json
          public/star-systems/index.json
  What:   Full star_systems arrays with host stars + planets,
          provenance block, observatory report text
```

Each generated file carries a `provenance` block recording the exact inputs
at Stage 3 so any system can be independently re-derived or audited.

---

## Stage 1 — Cluster Populations

**Script:** `datagathering/generate_cluster_populations.py` (and `generate_named_cluster_members.py`)

**Data sources:**
| Catalog | Role |
|---------|------|
| Takey2013 XMM-Newton | X-ray cluster detections; ICM temperature (`tx_kev`) |
| NED / HyperLeda | Galaxy positions (RA/Dec), Hubble types, distances |
| RC3 (de Vaucouleurs+) | Morphological types; axis ratios; B_T magnitudes |
| Published cluster virial radii | `rvir_mpc` used for zone classification |

**Schema fields produced per member:**
```json
{
  "id":          "NGC4889",
  "name":        "NGC 4889",
  "hubble":      "cD",
  "ra":          195.034,
  "dec":         27.977,
  "bt_mag":      12.16,
  "offset":      [0.078, -0.0003, 0.0],
  "is_named":    true,
  "lod3_params": { "axis_ratio": 0.8, "pa_deg": 80, "scene_su": 0.012, ... }
}
```

`offset` is in scene units (1 scene unit = 15 Mpc). Physical offset in Mpc:
`offset_mpc = sqrt(ox² + oy² + oz²) × 105`
where 105 = VSPREAD(7.0) × MPC_SCALE_INVERSE(15).

---

## Stage 2 — Architecture Enrichment

**Script:** `datagathering/enrich_with_architecture.py`

### Zone Classification

Each member is placed in one of four cluster environment zones based on its
radial fraction `frac = dist_mpc / rvir_mpc`:

| Zone | Condition | ICM character |
|------|-----------|---------------|
| `core` | frac < 0.25 | Strong ram pressure; X-ray bright; tidal stripping |
| `inner` | 0.25–0.55 | Moderate ICM; infalling spirals; gas depletion |
| `outskirts` | 0.55–1.0 | Weak ICM; ram pressure onset; intermediate metallicity |
| `infall` | frac > 1.0 | ICM-free; field-like; pre-processing only |

BCG galaxies (Hubble type `cD`) are always classified `core` regardless of offset.

### ICM Stress

```
stress = min(1.0, tx_kev / 14.0) × ZONE_WEIGHT[zone]
```

Zone weights: core=1.0, inner=0.65, outskirts=0.35, infall=0.10.  
`tx_kev = 14.5` is the maximum observed (Bullet Cluster) → stress=1.0 at core.

ICM stress drives:
- How many planets survive (high stress → fewer planets, disrupted orbits)
- Whether `requires_surface_render` is true (high-stress systems unlikely to be habitable)
- Maximum orbital radius (`max_orbit_au` shrinks with stress)
- Planet bias (chaotic_infall at stress > 0.7)

### Metallicity

```
dist_mpc = sqrt(ox² + oy² + oz²) × 105
fe_h_base = max(-0.55, 0.20 - 0.002 × dist_mpc)     # lookback time proxy
fe_h_zone = fe_h_base + ZONE_BOOST[zone]
fe_h = fe_h_zone + OLD_POP_BONUS[hubble]
```

Zone boosts: core=+0.08, inner=+0.04, outskirts=0.0, infall=-0.02.  
Old-population bonus (E/S0/cD): +0.05; cD BCG: +0.12.  
Floor: -0.55 (corresponds to lookback depth ≈ 1140 Mpc, Bullet Cluster).

### Planet Bias

Five categorical biases are assigned by combining zone, Hubble type, and stress:

| Bias | Conditions | Meaning |
|------|-----------|---------|
| `ancient_cold_rocky` | core/inner zone, E/S0/cD, stress > 0.15 | Old metal-rich stars, rocky worlds, no gas retention |
| `rocky_short_period` | core/inner, stress 0.1–0.4, non-E | Inner-packed rocky orbits from ICM compression |
| `mixed` | outskirts/inner, moderate stress | Inner rocky + outer mini-Neptune or gas giant |
| `jovian_wide` | infall/outskirts, low stress, Fe/H adequate | Wide-orbit gas giants; moon settlement potential |
| `chaotic_infall` | stress > 0.7 | Disrupted; barren; ongoing instability |

### Telescope Anchor Assignment

The `anchor_telescope` documents which observational program best constrains the system:

| Anchor | Condition |
|--------|-----------|
| Chandra | core/inner zone; tx_kev > 3 |
| JWST | infall zone; spiral/irregular hosts |
| HST/ATLAS | outskirts; low tx_kev |
| Hubble | inner zone; moderate tx_kev |
| Chandra/Hubble | core/inner; tx_kev > 5 |

### Schema fields added at Stage 2

```json
"system_architecture": {
  "cluster_zone":       "core",
  "anchor_telescope":   "Chandra",
  "metallicity_fe_h":   0.174,
  "icm_stress":         0.429,
  "star_teff_k":        4162,
  "max_orbit_au":       5.3,
  "gas_giant_prob":     0.10,
  "exomoon_factor":     0.12,
  "planet_bias":        "ancient_cold_rocky",
  "estimated_planets":  3,
  "requires_surface_render": true
}
```

---

## Stage 3 — Star System Generation

**Script:** `datagathering/generate_cluster_starsystems.py`

### Deterministic RNG

All randomness uses **Mulberry32** seeded by the galaxy's catalog ID string:
```python
seed = hash(galaxy_id + cluster_slug)   # djb2-style string hash
rng  = mulberry32(seed)                  # deterministic sequence
```

Re-running the script produces bit-identical output — the same galaxy always
generates the same star systems and planets.

### Host Star Properties

Effective temperature is drawn from `star_teff_k` (Stage 2) with per-system
variation ±200 K via RNG, then looked up in a spectral classification table
(M8V–A7V). Mass is scaled by Fe/H: `mass = base_mass × (1 + Fe/H × 0.04)`.

Luminosity via the Salaris (2005) mass-luminosity approximation:
```
L = 0.23 × M^2.3   if M < 0.43 M☉
L = M^4.0           if 0.43 ≤ M < 2.0 M☉
L = 1.4 × M^3.5    if M ≥ 2.0 M☉
```

### Number of Star Systems Per Galaxy

Hubble type sets a base range; ICM stress reduces the upper bound:

| Type | Base range | Notes |
|------|-----------|-------|
| cD | 3–5 | Large stellar halo; multiple populations |
| E/S0 | 2–3 | Old stellar populations |
| Sa/Sb | 3–5 | Spiral arms; varied stellar ages |
| Sc/Sd | 2–4 | Younger spirals |
| Irr/Im | 1–2 | Irregular; disrupted |

`hi = max(lo, hi - int(stress × 2.5))` — high stress collapses to minimum count.

### Orbital Architecture (Modified Titius-Bode)

Innermost orbit:
```
inner_au = (0.04 + 0.06 × sqrt(L)) × bias_factor
```
where `bias_factor` = 0.55 (rocky_short_period) → 1.60 (jovian_wide).

Geometric spacing:
```
a_{n+1} = a_n × spacing_factor × jitter
spacing_factor = bias_base × max(0.65, 1 - stress × 0.30)
```
Bias-base values: ancient_cold_rocky=1.70, mixed=1.85, jovian_wide=2.20, chaotic_infall=1.30.

All orbits capped at `max_orbit_au` from Stage 2.

### Planet Type Assignment

Equilibrium temperature:
```
T_eq = 278.5 × L^0.25 × (1 - albedo)^0.25 / sqrt(a)   [K]
```
(albedo = 0.30 throughout)

Planet type selected by temperature zone + bias weighting:

| T_eq range | Default type | Bias modifies |
|-----------|-------------|---------------|
| > 1800 K | lava_world | — |
| 800–1800 K | rocky_barren | — |
| 500–800 K | hot_rocky / rocky_barren | — |
| 200–500 K | super_earth | mixed → terran/ocean; jovian → gas_giant possible |
| 130–200 K | cold_rocky / mini_neptune | — |
| < 130 K | ice_world / frozen_world | — |

Gas giants are placed preferentially at outer orbits, probability weighted by
`gas_giant_prob` from Stage 2.

### Settlement Tier Logic

| Tier | Criteria |
|------|---------|
| `candidate` | terran planet, n2_o2 atmosphere, 180–320 K, stress < 0.7 |
| `frontier` | ocean_world or super_earth, 120–380 K, stress < 0.7 |
| `theoretical` | everything else |

---

## Provenance Block

Every generated JSON file contains:

```json
"provenance": {
  "script":               "generate_cluster_starsystems.py",
  "algorithm_version":    "1.0",
  "architecture_version": "1.0",
  "seed_source":          "NGC4569",
  "generated_at":         "2026-05-26T01:40:00+00:00",
  "inputs": {
    "cluster_zone":     "infall",
    "icm_stress":       0.018,
    "metallicity_fe_h": 0.127,
    "planet_bias":      "jovian_wide",
    "star_teff_k":      4738,
    "max_orbit_au":     88.2,
    "gas_giant_prob":   0.65,
    "anchor_telescope": "JWST",
    "estimated_planets": 9
  },
  "observatory_report": "NGC4569 (Sa) situated in the infall region..."
}
```

The `observatory_report` field is a human-readable English string suitable for
direct display in the app — ClusterDetailPanel, SurfaceViewPage, NFT metadata, etc.

---

## Display Integration

The `observatory_report` string and `provenance.inputs` block are designed
for direct use in the Exotopia frontend:

**ClusterDetailPanel** (`src/components/ClusterDetailPanel.vue`):
Load `public/star-systems/{cluster_slug}/{galaxy_id}.json`; render
`provenance.observatory_report` as the "Observational Origin" description.

**SurfaceViewPage** (`src/pages/SurfaceViewPage.vue`):
Show `provenance.inputs.anchor_telescope` as the telescope badge;
`provenance.inputs.cluster_zone` for environment classification;
`provenance.inputs.icm_stress` as a normalised 0–1 bar.

**NFT metadata** (via `src/lib/evm/erc721-metadata.ts`):
Map `provenance.inputs` fields to on-chain attributes:
- `cluster_zone` → trait_type "Cluster Zone"
- `planet_bias` → trait_type "Planetary Architecture"
- `anchor_telescope` → trait_type "Observatory"
- `metallicity_fe_h` → trait_type "Stellar Metallicity"
- `icm_stress` → trait_type "ICM Stress Index"

---

## Re-generating and Versioning

Run order:
```bash
# Re-enrich architecture (if cluster data changes)
python3 datagathering/enrich_with_architecture.py --overwrite

# Re-generate star systems (algorithm update)
python3 datagathering/generate_cluster_starsystems.py --overwrite

# Single cluster
python3 datagathering/generate_cluster_starsystems.py --cluster virgo --overwrite

# Named galaxies only (fast dev cycle)
python3 datagathering/generate_cluster_starsystems.py --named-only --overwrite

# Hand-designed v0 systems are preserved by default — pass --overwrite-v0 to replace them
```

`algorithm_version` in each `provenance` block increments when the physical
model changes. The `architecture_version` increments when Stage 2 changes.
Downstream systems can detect stale data by comparing these version strings.

---

## Data Coverage (v1.0, 2026-05-26)

| Cluster | Galaxies | Star systems | Planets |
|---------|----------|-------------|---------|
| Andromeda Group | 83 | 253 | 402 |
| Bullet Cluster | 200 | 442 | 632 |
| Centaurus Cluster | 190 | 522 | 770 |
| Coma Cluster | 460 | 1028 | 1646 |
| Eridanus Supergroup | 110 | 335 | 496 |
| Fornax Cluster | 110 | 311 | 489 |
| Hydra Cluster | 160 | 450 | 665 |
| Hydra-A Cluster | 160 | 433 | 656 |
| Norma Cluster | 200 | 503 | 774 |
| Ophiuchus Cluster | 280 | 623 | 1003 |
| Perseus Cluster | 310 | 787 | 1167 |
| Shapley Concentration | 310 | 709 | 1148 |
| Virgo Cluster | 250 | 700 | 1052 |
| **Total** | **2823** | **7096** | **10900** |

Settlement breakdown: 11 candidate worlds · 312 frontier worlds · 10577 theoretical

---

## Hand-Designed v0 Systems

Nine galaxies have hand-designed `v0-hand` star systems created by
`datagathering/generate_v0_starsystems.py`. These represent the highest
detail tier with individually authored planet descriptions and open questions.
They are excluded from procedural regeneration unless `--overwrite-v0` is passed.

| Galaxy | Cluster | Note |
|--------|---------|------|
| NGC0224 (M31) | Andromeda Group | 4 systems, 12 planets |
| NGC0598 (M33) | Andromeda Group | 3 systems, 8 planets |
| NGC0221 (M32) | Andromeda Group | 2 systems, 4 planets |
| NGC4486 (M87) | Virgo | 3 systems, 7 planets; AGN irradiance |
| NGC4406 (M86) | Virgo | 2 systems, 4 planets |
| NGC4472 (M49) | Virgo | 2 systems, 5 planets |
| NGC1275 (Perseus A) | Perseus | 3 systems, 7 planets; cooling flow |
| NGC1272 | Perseus | 2 systems, 5 planets |
| NGC1265 | Perseus | 2 systems, 3 planets; head-tail radio galaxy |

---

*See also: `SPEC_EXOTOPIA_ECOSYSTEM.md`, `GLOSSARY.md`, `SPEC_NFT_FRONTIER.md`*
