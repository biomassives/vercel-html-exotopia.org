# Exotopia Provenance Block — Specification

**Version:** 1.0  
**Date:** 2026-05-26  
**Status:** Active

---

## Purpose

The provenance block is Exotopia's chain of scientific custody. It records where
a star system's properties came from, which algorithm version produced them, and
what inputs would need to change before the system should be regenerated.

It serves three audiences simultaneously:
- **Users / collectors**: plain-English `observatory_report` explaining why this
  world has the character it does — readable in the UI, embeddable in NFT metadata
- **Developers**: version strings and input snapshot enabling staleness detection
  and targeted regeneration when data or algorithm changes
- **Governance / DAO**: auditable basis for tier upgrades, settlement priority
  decisions, and scientific dispute resolution

---

## Full Schema

```json
"provenance": {
  "script":               "generate_cluster_starsystems.py",
  "algorithm_version":    "1.0",
  "architecture_version": "1.0",
  "seed_source":          "NGC4569",
  "generated_at":         "2026-05-26T17:51:34+00:00",

  "inputs": {
    "cluster_zone":       "infall",
    "icm_stress":         0.018,
    "metallicity_fe_h":   0.127,
    "planet_bias":        "jovian_wide",
    "star_teff_k":        4738,
    "max_orbit_au":       88.2,
    "gas_giant_prob":     0.65,
    "anchor_telescope":   "JWST",
    "estimated_planets":  9
  },

  "observatory_report": "NGC4569 (Sa) situated in the infall region at the
    cluster periphery, largely ICM-free. ICM stress 0.02; host population
    Teff ≈ 4738 K, Fe/H +0.13. Architecture favours wide-orbit gas giants
    with potential moon settlement zones. 4 star system(s), 9 planet(s)
    generated. Observational anchor: JWST."
}
```

---

## Assembly — How the Block Is Built

The provenance block is assembled incrementally across three pipeline stages.
Each stage contributes a layer; the final block is written by Stage 3.

### Stage 1 contribution (implicit)
`generate_cluster_populations.py` doesn't write a provenance block directly,
but establishes the immutable identifiers that all later stages key on:
- `galaxy_id` (e.g. `NGC4569`) — the seed source and file name
- `cluster_slug` (e.g. `virgo`) — namespace
- `hubble` type and `offset` coordinates

These never change once written. They are the anchor, not the claim.

### Stage 2 contribution
`enrich_with_architecture.py` stamps two version fields at the cluster level:
```json
"architecture_version": "1.0",
"enriched_at": "2026-05-26T01:35:35+00:00"
```
And writes the `system_architecture` block whose fields become `provenance.inputs`
at Stage 3. Every input in the final provenance block comes directly from
`system_architecture` — no transformation, no rounding.

### Stage 3 assembly
`generate_cluster_starsystems.py` reads `system_architecture`, generates the
star systems, then assembles the final provenance block:

```
provenance.script               ← hardcoded to script filename
provenance.algorithm_version    ← ALGORITHM_VERSION constant in script
provenance.architecture_version ← copied from member's architecture_version
provenance.seed_source          ← galaxy_id (documents which ID seeded RNG)
provenance.generated_at         ← datetime.now(UTC) at write time
provenance.inputs               ← verbatim copy of system_architecture fields
provenance.observatory_report   ← generated from inputs via template function
```

The `inputs` block is a **snapshot**, not a reference. The star system file is
self-contained — it does not need to load the cluster member file to be
understood or verified.

---

## Version Strings

Two version numbers track independent change axes:

| Field | Increments when | Scope |
|-------|----------------|-------|
| `architecture_version` | `enrich_with_architecture.py` model changes (zone thresholds, stress formula, metallicity gradient, bias logic) | All members in affected clusters |
| `algorithm_version` | `generate_cluster_starsystems.py` model changes (orbital spacing, planet type rules, star spectral table, settlement tier criteria) | All generated star-system files |

These increment independently. A new JWST tx_kev measurement may change
`architecture_version` for one cluster without touching `algorithm_version`.
A refinement to the Titius-Bode spacing logic changes `algorithm_version`
across all clusters without re-running Stage 2.

### Current versions
```
architecture_version: 1.0
algorithm_version:    1.0
```

---

## Staleness Detection

A star-system file is **stale** when any of the following is true:

1. `provenance.algorithm_version` < current `ALGORITHM_VERSION` constant
2. `provenance.architecture_version` < `architecture_version` in the parent
   cluster's `*-members.json`
3. `provenance.inputs` values differ from current `system_architecture` fields
   in the cluster member (data was re-enriched but star systems not regenerated)

### Staleness check script (planned: `check_provenance_staleness.py`)
```bash
python3 datagathering/check_provenance_staleness.py
# Output: list of galaxy IDs where re-generation is recommended
# Flags: --cluster virgo   --show-diff   --update-inventory
```

The check compares `provenance.inputs` against the live `system_architecture`
fields field-by-field. Any numeric drift beyond a tolerance threshold (e.g.
`icm_stress` change > 0.05) marks the system stale.

---

## Adapting to New Astronomical Data

### New cluster ICM temperature (tx_kev update)

When a new Chandra observation refines `tx_kev` for a cluster:

1. Update cluster metadata in the members file or re-run Stage 2 targeted at
   that cluster:
   ```bash
   python3 datagathering/enrich_with_architecture.py --cluster norma --overwrite
   ```
   This bumps `architecture_version` and `enriched_at` at the cluster level,
   and rewrites `system_architecture` for all affected members.

2. Run staleness check to identify which star-system files are now stale.

3. Regenerate affected cluster:
   ```bash
   python3 datagathering/generate_cluster_starsystems.py --cluster norma --overwrite
   ```
   Each regenerated file gets a new `generated_at` timestamp and updated
   `provenance.inputs` snapshot. If an NFT was minted from the old data, the
   minted `inputs` snapshot on-chain remains — it is a historical record of
   what was known when minting occurred. The updated file reflects current
   best knowledge; the NFT reflects minting-time knowledge. Both are valid.

### Algorithm refinement (planet type logic, orbital spacing)

When the physical model in Stage 3 improves:

1. Increment `ALGORITHM_VERSION` in `generate_cluster_starsystems.py`
2. Re-run all clusters:
   ```bash
   python3 datagathering/generate_cluster_starsystems.py --overwrite
   ```
3. All files get new `algorithm_version`. Pre-mint files update silently.
   Post-mint NFTs retain the old version on-chain — their provenance is
   truthful to the algorithm that generated them.

### New catalog member added to a cluster

1. Add member to members file (or re-run population script for that cluster)
2. Run Stage 2: `enrich_with_architecture.py --cluster <slug>`
3. Run Stage 3: `generate_cluster_starsystems.py --cluster <slug>`
   New galaxy file appears; existing files untouched (no `--overwrite`).

---

## Threading to the Frontend

### observatory_report — user-facing text

The `provenance.observatory_report` string is the primary display surface.
It is pre-rendered natural language and requires no further processing.

**ClusterDetailPanel** (`src/components/ClusterDetailPanel.vue`):
```
Load: public/star-systems/{cluster_slug}/{galaxy_id}.json
Display: doc.provenance.observatory_report
Label: "Observational Origin"
```

**SurfaceViewPage** (`src/pages/SurfaceViewPage.vue`):
```
Telescope badge:       provenance.inputs.anchor_telescope
Zone classification:   provenance.inputs.cluster_zone
Stress bar (0–1):      provenance.inputs.icm_stress
Architecture label:    provenance.inputs.planet_bias
```

### NFT on-chain traits (pon.ink / erc721-metadata.ts)

Map `provenance.inputs` fields to ERC-721 attributes at mint time:

```ts
attributes: [
  { trait_type: 'Cluster Zone',            value: provenance.inputs.cluster_zone },
  { trait_type: 'Planetary Architecture',  value: provenance.inputs.planet_bias },
  { trait_type: 'Observatory',             value: provenance.inputs.anchor_telescope },
  { trait_type: 'Stellar Metallicity',     value: provenance.inputs.metallicity_fe_h },
  { trait_type: 'ICM Stress Index',        value: provenance.inputs.icm_stress },
  { trait_type: 'Algorithm Version',       value: provenance.algorithm_version },
  { trait_type: 'Architecture Version',    value: provenance.architecture_version },
]
```

`algorithm_version` and `architecture_version` as on-chain traits let
secondary marketplaces and collectors see whether an NFT was minted from
early or refined data — creating a natural archaeological layer of rarity.

### Governance / DAO upgrade triggers

The Ecommunity DAO can use provenance fields as objective upgrade criteria:

| DAO action | Provenance basis |
|-----------|-----------------|
| Promote Theoretical → Frontier | `icm_stress` drops below 0.35 in updated data |
| Promote Frontier → Candidate | `planet_bias` shifts to `mixed` or `jovian_wide` |
| Flag for surface render priority | `requires_surface_render: true` + `anchor_telescope` = JWST |
| Dispute a world's tier | Compare minted `inputs` snapshot to current cluster data |

---

## What the Block Does Not Track

The provenance block records **generation-time inputs only**. It does not track:

- Post-mint settlement activity (handled by pon.ink contract state)
- Player-assigned names, lore, or community metadata
- Mule creature assignments or governance votes
- Wormhole or transit history

Those are sovereign to the DAO/player layer and live in separate contract state
or the `.crm/` community record system, not in the physical generation record.

---

## Integrity Guarantee

The combination of:
- Immutable `seed_source` (galaxy catalog ID, never changes)
- Deterministic Mulberry32 RNG
- Frozen `inputs` snapshot

means: **given the same inputs block and algorithm_version, the script will
always produce the same star systems and planets**. The block is a complete
re-derivation recipe, not just a label.

Any party — user, collector, researcher, DAO member — can run:
```bash
python3 datagathering/generate_cluster_starsystems.py --galaxy NGC4569 --overwrite
```
and verify the output matches what was published. This is the operational
meaning of "independently re-derived or audited."

---

*See also: `SPEC_STARSYSTEM_ALGORITHM.md` (full physical model), `SPEC_NFT_FRONTIER.md` (upgrade chain), `GLOSSARY.md`*
