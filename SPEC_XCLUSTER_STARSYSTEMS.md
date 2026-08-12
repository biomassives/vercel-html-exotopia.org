# X-Ray Cluster Star-System Generation — Spec

**Version:** 0.1 (draft)
**Date:** 2026-08-04
**Status:** Draft — calibration appendix in progress

---

## 1. Motivation

Exotopia's cluster-galaxy data has two tiers today, and they are not at the same level of
depth:

| Tier | Clusters | Galaxies | Depth |
|---|---|---|---|
| **Named clusters** | 15 (Andromeda Group, Virgo, Fornax, Eridanus Supergroup, Centaurus, Hydra, Norma, Perseus, Coma, Shapley, Bullet, Hydra-A, Ophiuchus, Bootes Void, Local Void) | 2,823 | Full pipeline: population → `system_architecture` enrichment → star systems → planets. Every member has a generated doc at `public/star-systems/{slug}/{galaxy_id}.json`. |
| **X-ray clusters (Takey2013/XMM-Newton)** | 345 | 26,225 | **Sprite only.** `public/galaxy-oracle/{xid}.json` gives each member a position, morphology, colour, and size for rendering — nothing else. No `system_architecture`, no star systems, no planets, no provenance. |

`src/composables/useClusterGalaxyData.ts` already anticipates this gap — it has a documented
3-stage fallback:

```
1. Generated JSON   — /star-systems/{slug}/{id}.json   (pipeline output, preferred)
2. Members catalog  — /clusters/{slug}-members.json     (hubble type + count, seeded procedural)
3. Pure procedural  — seeded from cluster+galaxy id      (always succeeds, last resort)
```

Every one of the 26,225 X-ray-cluster galaxies currently falls all the way to **Stage 3** —
generated fresh in the browser on each visit, from nothing but the galaxy's id and cluster
slug. It has no ICM stress, no real X-ray temperature input, no metallicity gradient, no
observatory provenance, and is not reproducible in the sense that matters (it's seeded and
deterministic, but not derived from anything astrophysical). This is the gap this spec closes:
extending the same generation pipeline the 15 named clusters already have to the 345 X-ray
clusters, so descending into *any* featured cluster's member galaxies lands on Stage 1 —
real, cluster-specific, provenance-carrying data — not a last-resort placeholder.

This directly serves the "known or anticipated" framing already established for this project
(README.md: *"When real member data is added for a cluster... it replaces the oracle layer
without changing the route"*, and the existing `"anticipated"` category used for black-hole
companion objects in `generate_bh_anticipated_objects.py`). X-ray-cluster galaxies are real
detections (Takey2013 XMM-Newton catalog), but their planetary systems are necessarily
anticipated, not observed — the schema must keep saying so.

---

## 2. What's already true and doesn't need to change

- **Output schema.** `generate_cluster_starsystems.py`'s `generate_galaxy_doc()` output
  (galaxy_id, galaxy_name, cluster, environment{}, placement_notes{}, provenance{},
  star_systems[]) is the target format. `useClusterGalaxyData.ts` Stage 1 doesn't care
  whether the source cluster is a named cluster or an X-ray cluster — it just fetches
  `/star-systems/{slug}/{id}.json`. **No frontend code changes are required** if the new
  generator writes to that same path convention using the X-ray cluster's slug (its `xid`,
  e.g. `j001817-2-161740` — see `azToX`-adjacent id mapping already in
  `public/galaxy-oracle/index.json`'s `id_map`).
- **The physics model.** `SPEC_STARSYSTEM_ALGORITHM.md`'s star-classification, orbital-spacing,
  planet-type, and settlement-tier logic is cluster-agnostic — it consumes a
  `system_architecture` block (cluster_zone, icm_stress, metallicity_fe_h, planet_bias,
  star_teff_k, max_orbit_au, gas_giant_prob, anchor_telescope, estimated_planets) and doesn't
  care how that block was derived. Reuse it as-is.
- **The RNG convention.** Mulberry32 seeded from `galaxy_id + cluster_slug` (or, for X-ray
  clusters, `galaxy_id + xid`) — deterministic, reproducible, matches every existing generator
  in `datagathering/`.

---

## 3. What's missing: the architecture-derivation step

`enrich_with_architecture.py` derives `system_architecture` per member from **rich** per-cluster
inputs: σ_v, T_x, M200, r_vir, richness, zone-aware sub-cluster structure — all hand-curated in
`CLUSTER_PROFILES` (see §5). X-ray clusters have none of that. `public/clusters-xray.json`
gives only:

```json
{ "name": "J001817.2+161740", "ra_deg": 4.5717, "dec_deg": 16.2944,
  "z": 0.5401, "dist_mpc": 2313.11, "tap_kev": 4.57,
  "color_hex": "#ffeecc", "source": "NASA/HEASARC/Takey2013" }
```

Four numbers: redshift, distance, X-ray temperature, and a display colour. `generate_galaxy_oracle.py`
already derives a **richness proxy** from `tap_kev` alone (`tap_kev_to_richness()`:
`min(10, max(1, tap_kev * 1.35))`) for sprite-count/radius purposes — that's the one piece of
precedent to build on.

**New script: `datagathering/enrich_xcluster_architecture.py`** — same job as
`enrich_with_architecture.py`, adapted for sparse input:

| Named-cluster input | X-ray-cluster equivalent |
|---|---|
| `sigma_v_kms` (hand-curated) | Derived from `tap_kev` via the T_x–σ_v scaling relation (σ_v ∝ T_x^0.5-0.6, standard cluster scaling — cite the relation, don't invent a constant) |
| `rvir_mpc`, `M200_1e14` (hand-curated) | Derived from `tap_kev` via a T_x–M scaling relation (same family as used for richness) |
| `richness` (hand-curated) | `tap_kev_to_richness()` — already exists, reuse directly |
| Zone-aware sub-cluster list (hand-curated per cluster) | Not available — no published substructure for anonymous XMM catalog entries. Use the existing `has_subcluster = richness >= 8` flag already present in `generate_galaxy_oracle.py`'s sprite placement, and mirror that boolean into the architecture block instead of inventing per-cluster substructure detail. |
| `metallicity_fe_h` gradient (hand-curated per cluster + zone) | Redshift-driven only: reuse the existing lookback-time proxy already implied by `dist_mpc`/`z` (older, more distant clusters skew lower metallicity) — same formula shape as `enrich_with_architecture.py`, without the per-cluster hand-tuning term. |
| `anchor_telescope` (hand-picked per cluster/zone in named-cluster data) | Deterministic pick from a small weighted table keyed on `z` (nearby → Hubble/JWST-plausible; distant/high-z → JWST/Chandra-plausible) — cosmetic/flavor field, doesn't need real per-object telescope allocation data. |

This is a **formulaic, not per-object-researched** derivation — appropriate for 345 anonymous
catalog entries with no individual literature, unlike the 15 named clusters (§5). The scaling
relations used must be cited in the script's docstring (standard T_x–σ_v and T_x–M
self-similar-cluster relations, e.g. from cluster cosmology literature) so the provenance block
in each output file can say what physics produced the number, not just "procedural."

---

## 4. Scale strategy — full detail for a bounded subset, not all 26,225

Extrapolating the named-cluster pipeline's output size (2,823 galaxies → 19 MB in
`public/star-systems/`) to all 26,225 X-ray-cluster galaxies at the same depth would add
roughly **100–180 MB** to `public/` — disproportionate for data describing catalog entries with
zero individual astrophysical distinction beyond a shared cluster T_x. Proposed tiering instead:

- **Anchor members (full detail):** the BCG (`is_bcg: true`, already flagged in the oracle
  sprite data) plus the next-brightest N members per cluster (proposed N = 5, i.e. ≈ 6 galaxies
  × 345 clusters ≈ **2,070 galaxies** — comparable order of magnitude to the existing
  named-cluster set). These get the full `generate_galaxy_doc()` treatment: architecture →
  star systems → planets, written to `/star-systems/{xid}/{galaxy_id}.json`.
- **Remaining members (lightweight doc):** a much smaller per-galaxy summary — architecture
  block only (environment description, radiation factor, metallicity, zone), no `star_systems`
  array — so Stage 1 still succeeds (real cluster physics backs the detail panel) without
  generating tens of thousands of individually-static planet lists that no one will ever
  distinguish from one another. `ClusterSystemPage.vue`'s existing Stage-2/3 procedural planet
  generation stays the *runtime* fallback for these, but now seeded from a real
  `system_architecture` block instead of a made-up one — a meaningfully better result for free,
  without full pre-generation cost.

This split (N=5 anchors, lightweight elsewhere) is a **starting proposal, not a final decision**
— flag it for confirmation before running the generator at full scale.

---

## 5. Calibration constants — the 15 named clusters

Unlike the 345 anonymous X-ray clusters, these 15 are real, individually-studied objects with
real literature. `datagathering/generate_cluster_catalog.py`'s `CLUSTER_PROFILES` already
carries literature-cited values for 10 of them; `bullet`, `hydra-a`, and `ophiuchus` currently
have numbers with **no citation trail** in the codebase at all. A dedicated research pass
(one research agent per cluster, current literature, real citations) was run to verify/refine
all 15 ahead of writing them into the generator. Status of that pass:

| Cluster | Research status | Headline finding |
|---|---|---|
| Andromeda Group | ✅ complete | Values accurate; M200=2×10¹² M☉ is an M31-halo figure, not full-Local-Group timing-argument mass (4.93×10¹²) — note the distinction, don't conflate. Real substructure: Ibata+2013 "Great Plane of Andromeda" satellite corotation; M31 has a real metallicity gradient (−0.018 dex/kpc, Escala+2020) directly usable for the rocky-planet metallicity bias. |
| Virgo | ✅ complete | **M200 correct 8.0 → ~1.4×10¹⁴ M☉** (was ~6x too high — eROSITA 2024/Suzaku 2017). σ_v nudge 760 → ~640 (Boselli+2020). T_x nudge 2.5 → 2.3 keV. r_vir fine as-is. **Structural fix: NGC4261 is not subcluster C's dominant galaxy** — it's a background "W cloud" object at ~2x Virgo's distance; subcluster C is actually anchored on M60/NGC4649. M87*'s mass, cool-core/AGN-feedback ring, and the classic ram-pressure-stripped members (NGC4438, NGC4522) are all real, citable anchors. |
| Fornax | ✅ complete | σ_v, M200, r_vir accurate (Drinkwater et al. 2001). **Distance should update 19.0 → ~20.0 Mpc** (Blakeslee et al. 2009 SBF). Richness (340) is a real but superseded floor — true population is larger (Maddox et al. 2019: 232 spectroscopic + Venhola et al. 2018: 564 dwarf candidates). NGC1399 core is a genuine measured cool-core (Su et al. 2017). |
| Eridanus Supergroup | ✅ complete | Not one bound cluster — real literature (Brough+2006) resolves it into **three separately-virialized groups** (NGC1407, NGC1332, Eridanus-proper) still in the process of merging (96.5% bound-orbit probability for NGC1407↔Eridanus). Current σ_v=250 is defensible only as a richness-weighted blend, not any single subgroup. M200=0.30×10¹⁴ sits at the low end of a real 0.22–0.6×10¹⁴ range tied to NGC1407's well-documented dark-matter-overmassive halo (Zhang+2007, Romanowsky+2009) — a genuinely interesting real anomaly worth keeping in the description text. |
| Hydra | ✅ complete | **σ_v correct 680 → 724 km/s** (own cited source, Christlein & Zabludoff 2003, was misquoted). **r_vir correct 0.90 → ~1.2–1.35 Mpc** (Hayakawa+2006). T_x, distance, M200 all confirmed accurate. Twin-BCG framing should soften: NGC3311 is the true dominant cD (M87-like extended halo), NGC3309 a secondary giant elliptical — bimodal in the ICM (two real X-ray peaks) but not truly co-dominant optically. |
| Norma | ✅ complete | σ_v, T_x, M200 confirmed accurate. **Distance nudge 65.0 → ~69-70 Mpc** (Said+2021, most recent Fundamental Plane study — peculiar velocity consistent with zero, confirming Norma sits in the Hubble flow rather than being pulled through the Great Attractor). **r_vir correct 1.20 → ~1.5-1.6 Mpc** (Carlberg+1997 scaling from measured σ_v). Real zone split for obscuration: core (A_V~0.5-1.7, reasonably complete) vs. low-latitude periphery (A_V~3-4, genuinely incomplete) — supports the known/anticipated split this spec already wants. BCG confirmed: WKK 6269/ESO 137-006, with real published peculiar velocity (561 km/s) and radio-filament structure. Original 1996 Great-Attractor mass estimate (~5×10¹⁵) was revised down an order of magnitude by later work — a clean "prefer most recent" case. |
| Perseus | ✅ complete | Distance, σ_v, T_x all confirmed accurate. **M200/r_vir pairing is internally inconsistent** — file's (12×10¹⁴, 1.30 Mpc) mixes a dynamical M200 with an r500-scale radius; the one measurement that actually reaches the virial radius (Simionescu et al. 2011, *Science*) gives R200≈1.79 Mpc, M200≈6.65×10¹⁴ — recommend adopting that pair together. **The "+5500 km/s" infalling-group offset isn't published** — real analogs are NGC1275's foreground High-Velocity System (~3000 km/s offset, Gillmon+2004) and NGC1265's infall (~2170 km/s, Pfrommer & Jones 2011). NGC1275's AGN "sound waves" (Fabian+2003) and NGC1265's head-tail ram-pressure signature are both real, well-cited. |
| Coma | ✅ complete | σ_v (1082) and T_x (8.25) are exact literature matches (Colless & Dunn 1996; Arnaud+2001) — keep. **M200 likely high**: newest (2026) Subaru/HSC weak-lensing two-halo fit gives 8.2×10¹⁴ vs. file's 15×10¹⁴ — flagged as a genuine literature disagreement, newest measurement noted rather than silently averaged. NGC4889's ~21 billion M☉ black hole (McConnell+2011, still the record holder) confirmed. The bimodal NGC4874/NGC4889 subcluster structure is real (Adami+2005 finds 17 total subgroups) but the specific "45%/45%" membership split on file has no cited source — treat as illustrative, not literature-backed. |
| Shapley | ✅ complete | **Shapley is not one cluster** — it's a supercluster of 20+ Abell clusters and dozens of groups. Recommend anchoring the app's single "cluster" object to **A3558 specifically** (richest, most central member) rather than an ill-defined supercluster average, and documenting that choice. On that basis: σ_v fine as-is (~940, lit. converges ~990). **T_x correct 8.0 → ~5.4-6.0 keV** (ASCA/XMM, file's value is too high). M200 defensible only if read as "core-complex total," not A3558 alone (A3558's own dynamical mass is 14.8×10¹⁴, vs. file's 20.0×10¹⁴). **Bridge attribution fix: the real documented X-ray gas bridge is A3556↔A3558, not A3558↔A3562** — A3562 connects via a separate filament + its own merger with infalling group SC1329−313. A3571/A3572 confirmed real outer members; A3569 could not be independently confirmed this pass. Shapley and Norma/A3627 are two distinct real overdensities along similar sightlines (not the same structure) — Shapley contributes an independent pull beyond the Great Attractor itself (Kocevski & Ebeling 2006). |
| Bullet Cluster | ✅ complete | T_x (14.5 keV) confirmed (Markevitch 2002/2004). **σ_v should correct 1400 → ~1160 km/s** (Barrena+2002) — but flag in schema that merger/shock velocity, not σ_v, is this system's defining number: bow-shock speed ~4700 km/s (Mach 3) is real and citable (Markevitch 2006). Newest (2025/26) JWST+DECam lensing analysis gives a **10.1:1 mass ratio** between main and bullet subclusters, superseding older 2–5:1 estimates. Dark-matter fraction (~76–82%) is unusually well-constrained for this system — worth flagging as an outlier calibration point rather than a typical-cluster default. No individually named member galaxies are published (distant, spectroscopic-catalog-only) — don't invent names. |
| Hydra-A | ✅ complete | Distance/z accurate. **σ_v should update 680 → ~800 km/s** (De Filippis et al. 2009). T_x close (3.8 vs. recent 3.6 keV). Abell richness class is formally "0/poor" in the literature scale — app's internal `richness: 7` is on a different (app-specific) scale, not a contradiction, but worth a note. Textbook cool-core with real AGN cavity energetics (Nulsen et al. 2005) and a measured cooling-flow deposition rate (34±5 M☉/yr, David et al. 2001) — both directly usable as calibration inputs. |
| Ophiuchus | ✅ complete | Distance and T_x (one of the hottest known, ~9-10 keV, confirmed cool-core) both accurate. σ_v nudge 1050 → ~950-1000 km/s (Durret+2015, most recent dynamical study; adds citable M200=1.11×10¹⁵, r200=2.125 Mpc as new fields). Real, severe Zone-of-Avoidance obscuration (b=9.3°): optical spectroscopic membership only 152 confirmed vs. 537 NIR candidates (Galdeano+2022) — strong support for a known/anticipated split. Hosts a real record-breaking AGN outburst (Giacintucci+2020, ~5× the prior record holder) — citable, dramatic real detail. BCG confirmed: NeVe 1. |
| Centaurus | ✅ complete | Distance, T_x, cooling-flow status confirmed. **M200 correct 4.0 → ~1.6×10¹⁴ M☉, r_vir correct 0.90 → ~1.13 Mpc** (Walker et al. 2013b hydrostatic analysis to r200). **Citation fix: "Sanders+2016 XMM" is wrong — that's a Chandra paper; the XMM merger study is Walker et al. 2013a.** **Cen45 offset correct +4500 → ~1500 km/s** (4500 was Cen45's absolute recession velocity, not its offset from Cen30 — real merger signature is the smaller number, still confirmed via a shock-heated X-ray bridge). BCGs confirmed: NGC4696 (Cen30) and NGC4709 (Cen45). |

All 15 named clusters/groups researched. **Not yet applied**: the corrections above have not
been written into `datagathering/generate_cluster_catalog.py`'s `CLUSTER_PROFILES` or the three
previously-uncited files (`bullet-members.json`, `hydra-a-members.json`,
`ophiuchus-members.json`) — that's implementation work, tracked separately from this spec.
Recurring pattern worth noting for that follow-up pass: five of the ten `CLUSTER_PROFILES`
entries had at least one value flagged for correction (Virgo's M200, Hydra's σ_v/r_vir,
Perseus's M200/r_vir pairing and infall-velocity figure, Coma's M200, Centaurus's M200/r_vir and
a wrong citation, Norma's distance/r_vir, Shapley's T_x and bridge attribution) — the values
weren't fabricated, they were mostly *stale* (superseded by more recent X-ray/lensing
measurements) or *mislabeled* (a dynamical figure captioned as an X-ray one, or vice versa).

---

## 6. Script deliverables

1. **`datagathering/enrich_xcluster_architecture.py`** — reads `public/clusters-xray.json` +
   `public/galaxy-oracle/*.json`, writes a `system_architecture` block per galaxy (in a
   sidecar file or back into the oracle file — TBD, see open questions). Mirrors
   `enrich_with_architecture.py`'s CLI conventions (`--dry-run`, `--list`, `--cluster`).
2. **`datagathering/generate_xcluster_starsystems.py`** — reads the enriched architecture data,
   applies the anchor/lightweight tiering from §4, writes to
   `public/star-systems/{xid}/{galaxy_id}.json` (anchors) using the *exact same*
   `generate_galaxy_doc()` logic as `generate_cluster_starsystems.py` (import and reuse, don't
   fork), and a new lighter doc shape for non-anchor members. Mirrors the existing script's
   `--dry-run`, `--list`, `--cluster`, `--overwrite` flags.
3. **`generation_inventory.json` extension** — add X-ray-cluster entries following the existing
   `{hostname, requestedAt, status, observatory_context, parameters}` shape, so status tracking
   (`pending`/`generated`) works the same way it already does for the named-cluster set.

Both scripts are additive — they do not modify `enrich_with_architecture.py` or
`generate_cluster_starsystems.py`, which stay exactly as they are for the named-cluster
pipeline.

---

## 7. Open questions

- Confirm N=5 anchor count per X-ray cluster (§4), or a different split.
- Where does the X-ray cluster's `system_architecture` block live — a sidecar file per cluster
  (`public/galaxy-oracle/{xid}-architecture.json`) or merged into the existing oracle file? A
  sidecar keeps the oracle file's role (sprite rendering) and the architecture file's role
  (astrophysics) cleanly separated, matching how named clusters keep `*-members.json` (Stage 1
  population/architecture) separate from `star-systems/*.json` (Stage 3 output) — leaning
  toward sidecar, confirm before implementing.
- Should lightweight (non-anchor) member docs be pre-generated at all, or should Stage 2 of
  `useClusterGalaxyData.ts` be extended to fetch the architecture sidecar directly and run the
  existing procedural-catalog fallback against *real* architecture instead of a members-catalog
  hubble type? The latter avoids generating ~24,000 extra small JSON files and may be the
  better trade — worth deciding before implementation, not after.

---

## 9. Forward compatibility: creative/business attachment points (not built now)

Longer-term, Exotopia wants to safely let outside creators and small businesses — arts, music,
dance, education — attach real activity to specific generated places, the same way galleries
already attach to systems today (`DefenderNav`'s `galleryType`: `research` / `stage` / `art` /
`community-hall` / `info-hub`, with an `ownershipModel` and `accessLevel`; see
`SPEC_DEFENDERNAV.md`). Nothing in this spec builds that — it's flagged here only so the new
per-galaxy JSON schema doesn't accidentally close the door on it:

- Keep the existing `galaxy_id` / `cluster_slug` / system `id` naming stable and public — those
  are the addressable "place" identifiers any future creative-node attachment would key off of,
  the same way `exo-orbital-gallery-v1:host:angle:idx` addresses already do (per
  `SPEC_DEFENDERNAV.md`).
- Don't add anything to this generator that resembles individual-user presence or location —
  that's an explicit, already-written constraint (`SPEC_DEFENDERNAV.md` §1.6,
  `legal-community-guidelines.md` §3). A future creative/business layer must stay
  opt-in-by-the-attaching-creator, not a way to find *people*.
- No spec exists yet for the attachment mechanism itself (discovery, moderation, revenue
  handling, abuse response). Don't design it inline here — write it as its own spec when it's
  actually being scoped, following this repo's existing pattern of one spec per concern.

## 10. Related documents

- `SPEC_STARSYSTEM_ALGORITHM.md` — the physics model this spec reuses unchanged.
- `SPEC_DEFENDERNAV.md` §1.6 — no-individual-user-tracking constraint; relevant if/when this
  data model grows gallery/creative-node attachments (see §10 below).
- `README.md` §Working assumptions — "Oracle-generated galaxies are clearly labelled" /
  "When real member data is added... it replaces the oracle layer without changing the route."
