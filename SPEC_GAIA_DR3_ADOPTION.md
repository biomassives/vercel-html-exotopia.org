# Gaia DR3 Adoption — Nearby Stars (≤500 pc)

**SCD Hub · Exotopia.org · Draft — v0.1 · GPL v3**
*Extends `SPEC.md` §14 and `SPEC_SKY_DATA_REGIMES.md`. Those specs describe the per-planet
"local sky" pipeline and its tiled regime/delta architecture, both built on the Hipparcos
Main Catalog. This spec proposes replacing Hipparcos with Gaia DR3 astrometry for the ≤500 pc
subset only — a precision upgrade to the tier where parallax shift is largest, not a
count upgrade, and not a change to the regime/delta file shape.*

---

## 0. Where this gap is flagged today

`blog-data-sources-unified-viz.md` names this exact gap three times, unprompted, across two
drafting passes:

- Level 3 body text (line 106): *"Replacing the HYG base layer with Gaia DR3 data for stars
  within 500 parsecs would substantially improve the sky-accuracy calculation for nearby
  settlement surfaces, where proper motion parallax shifts from the settlement's vantage point
  are largest."*
- Original summary table (line 180): `L3 | Milky Way stars | HYG v3 | 119,614 stars | Gaia DR3
  for d < 500 pc`
- June 2026 updated summary table (line 270): same row, restated after the parallax-sky ship —
  i.e. it was re-flagged as still open *after* the parallax pipeline went live, not before.

So the framing holds up against the source doc: this is specifically about precision for
nearby stars, not "more stars." Two clarifications worth making before the rest of this spec,
because the blog post's own framing is imprecise in one place:

1. The blog post says "replacing the HYG base layer." In the code that's live today, HYG
   (`public/stars/hyg-compact.json`, 7.3 MB, 61,817 stars per the August 2026 real-vs-generated
   ledger) is **not actually fetched by any page** — `grep -rn "hyg-compact" src/` matches only
   documentation/stat pages (`DataCoveragePage.vue`, `DocPage.vue`, `AboutExotopiaModal.vue`)
   that cite the count, never a runtime `fetch()`. The star catalog that actually drives the
   live parallax sky is Hipparcos, consumed by `datagathering/generate_sky_data.py` (see §1).
   HYG's only other real consumer is `src/pages/CosmicPage.vue`'s per-cluster
   `/stars/{slug}-region.json` files. This spec targets the Hipparcos-based pipeline, not HYG.
2. There are two parallel sky pipelines in this codebase today, and they are not merged. §1
   spells out the difference — it matters for scoping where Gaia data actually plugs in.

---

## 1. What's used today, and exactly where precision runs out

**Pipeline A — live, client-side, in `SurfaceViewPage.vue`.** `addStarField()`'s Layer 2
(`SurfaceViewPage.vue:1646-1714`) and `addBrightStars()` (`:1728-`) compute parallax directly in
the browser on every page load, using `raDecToVec3()` (`src/lib/three-utils.ts:105-113`):
- Layer 2 iterates `galaxyStore.planets` (from `public/exoplanets-viz.json`, NASA Exoplanet
  Archive `sy_dist`) and recomputes each host star's apparent direction from the settlement's
  position. No proper motion — `ra`/`dec`/`sy_dist` are treated as fixed.
- `addBrightStars()` does the same for the 45 stars in `src/data/bright-stars.ts`, whose own
  docstring is explicit about what it is: *"a deliberately small slice of SPEC.md §14's full
  design... using commonly-cited values, not claiming survey-grade precision"* and *"some, e.g.
  Deneb/Betelgeuse, carry real observational uncertainty."*

Neither code path reads Hipparcos, Gaia, or HYG data at all — they run entirely on NASA
Archive `sy_dist` and the 45 hand-typed rows. This is the pipeline the "new constellations"
capability (blog post's June 2026 addendum) currently ships with.

**Pipeline B — offline, precomputed, not yet wired to any page.**
`datagathering/generate_sky_data.py` (465 lines, built and referenced by
`SPEC_SKY_DATA_REGIMES.md`) is the actual implementation of `SPEC.md` §14: it loads
`datagathering/hipparcos.csv` (118,218-star Hipparcos Main Catalog, VizieR `I/239`) and
computes true per-planet apparent sky positions with proper motion and a real reliability
filter. This is where precision limits are explicit and load-bearing, at
`generate_sky_data.py:130-133`:

```python
# Reliable-parallax mask — see SPEC.md §14.2.2 "Stars without reliable parallax"
frac_err = np.abs(self.e_plx / self.plx)
self.reliable = (self.plx > 1.0) & np.isfinite(self.plx) & (frac_err <= 0.3)
```

Hipparcos median parallax precision is ~1 mas. At 500 pc (parallax ≈ 2 mas), a 1 mas error is a
50% fractional error — comfortably inside `generate_sky_data.py`'s own `frac_err <= 0.3` reject
threshold for a large fraction of 200–500 pc stars, which is exactly the distance band where
`nearby_alerts` (`NEARBY_ALERT_PC = 5.0`, i.e. stars within 5 pc of a *given settlement*, not of
Earth) and `pos_shift_deg` most need to be right. Stars that fail the mask aren't dropped; they're
kept at Earth-apparent position and flagged `"parallax_uncertain": true"` (`:296-297`) — i.e. the
current pipeline silently reverts to *no parallax correction at all* for a meaningful slice of
the nearby-star population it exists specifically to correct. Only 2 sample output files exist
today (`public/sky/proxima-cen.json`, `public/sky/trappist-1.json`, ~833 KB each) — `--all` has
not been run at scale, and `SPEC_SKY_DATA_REGIMES.md`'s regime/delta tiling (§2 below) has not
been implemented against real data yet either.

**Net scoping conclusion:** Gaia DR3 adoption is an upgrade to Pipeline B's input catalog for
the ≤500 pc tier. It does not, by itself, change `SurfaceViewPage.vue`'s live rendering (Pipeline
A) unless/until Pipeline B is wired in — that wiring is `SPEC_SKY_DATA_REGIMES.md`'s job, not
this spec's. See §5.

---

## 2. Data source

**Gaia Archive TAP** (`https://gea.esac.esa.int/tap-server/tap`), queried via `astroquery.gaia`
— same `astroquery` package already used by `generate_sky_data.py`'s documented Hipparcos fetch
command (`astroquery.vizier`), so no new Python dependency.

**ADQL query shape**, run as an async TAP job (see rate-limit note below):

```sql
SELECT source_id, ra, dec, parallax, parallax_error, ruwe,
       pmra, pmdec, pmra_error, pmdec_error,
       phot_g_mean_mag, bp_rp, teff_gspphot, radial_velocity
FROM gaiadr3.gaia_source
WHERE parallax > 2.0            -- crude 500 pc cut (1000/parallax_mas ≤ 500 pc)
  AND parallax_over_error > 5   -- baseline sanity filter before per-star RUWE triage
```

**Row count, honestly scoped.** A naive `parallax > 2.0` cut against `gaia_source` returns on
the order of 10⁶–10⁷ rows — Gaia is complete to G≈20–21, roughly 15 magnitudes fainter than
naked-eye, so a parallax-only cut mostly returns red dwarfs no settlement sky would ever need to
render. This is the concrete reason the tiled-loading requirement isn't optional scaffolding —
it's answering the same problem `SPEC_SKY_DATA_REGIMES.md` §1 already hit with the "one file per
planet" design (there: 5.1 GB naive vs. ~68 MB bucketed). Here the fix is a magnitude cut before
tiling, not just tiling: add `phot_g_mean_mag <= <cutoff>`, matching or close to
`generate_sky_data.py`'s existing `MAG_CUTOFF = 6.5` (empirically ~8,874 stars from Earth in
Hipparcos). Applied to Gaia, that cutoff should land in the same order of magnitude for the
≤500 pc slice, since Hipparcos is already close to complete at naked-eye brightness — this is
the numeric confirmation of the "precision upgrade, not count upgrade" framing, not just an
assertion of it. Confirming the exact post-cut row count against a real query is listed as an
open question (§7, Q1) rather than asserted here.

**Columns and why each is needed:**

| Column | Use |
|---|---|
| `ra`, `dec` | Sky position — direct replacement for Hipparcos `RAICRS`/`DEICRS` |
| `parallax`, `parallax_error` | Distance + the reliability mask `generate_sky_data.py:130-133` already implements — same shape, tighter numbers |
| `ruwe` | Real Gaia per-source astrometric-quality flag (renormalized unit weight error). Standard cut is `ruwe < 1.4`; not present in the Hipparcos-only pipeline today. Needed *in addition to* `parallax_over_error` because a subset of very bright stars have formally "precise" but astrometrically unreliable Gaia solutions — see §6 saturation note |
| `pmra`, `pmdec` | Proper motion — `generate_sky_data.py` does not currently apply proper motion at all (Hipparcos `pmRA`/`pmDE` are loaded into `hip-star-names.json`-adjacent fields but not consumed in the `Catalog` class shown above); Gaia's tighter values make this worth adding for the ≤500 pc tier specifically, where cumulative motion since J2000 is most visible |
| `phot_g_mean_mag`, `bp_rp` | Brightness + colour — replaces Hipparcos `Vmag`/`B-V` → `bv_to_teff()`. `teff_gspphot` (Gaia's own derived effective temperature, where available) is a more direct input to `starColorFromTeff()` than reconstructing it from a colour index a second time |
| `radial_velocity` | Not consumed by anything today; captured because it's a free column on the same query, for future 3D-motion work — no pipeline change proposed here |

---

## 3. Tiled loading architecture

This codebase already has two working tiled/lazy-load patterns; the Gaia tile loader should
copy the more general one rather than invent a third:

- `src/lib/galaxy-oracle.ts` — `index.json` with an `id_map`, per-tile files fetched on demand,
  `Map`-based cache, an `_inflight` `Map` deduplicating concurrent fetches for the same key
  (`loadOracleCluster()`, `:47-77`).
- `src/lib/void-oracle.ts` — the same fetch/cache/dedupe shape, simpler (no index indirection,
  filename derived directly from the void id).
- `CosmicPage.vue`'s `loadStarRegion()` (`:1392-1404`) — the closest precedent in *subject
  matter* (per-region star files at `/stars/{slug}-region.json`), but its tiling key is "named
  galaxy cluster," which doesn't exist for an all-sky nearby-star catalog.

**Why not `SPEC_SKY_DATA_REGIMES.md`'s k-d tree.** That spec's regime bucketing partitions
*exoplanet observer positions* (6,271 planets, heavily skewed by the Kepler field) into
population-balanced Cartesian cells, precisely because a fixed grid over that skewed
distribution was rejected (§2 of that spec — one bucket would hold 51% of planets). The Gaia
≤500 pc catalog is a different object: it's the *input star catalog itself*, queried once by
any observer's proximity, not a set of unevenly-clustered observer points. A population-balanced
k-d tree solves a problem this dataset doesn't have. A **uniform fixed-size 3D grid in Cartesian
parsec space** is proposed instead:

- Cell size: 100 pc cubes (tunable — §7 Q2), giving up to 5×5×5 = 125 cells to cover a
  500 pc-radius sphere around Earth (many fewer in practice, since a sphere doesn't fill a cube
  and the galactic-plane density gradient means most stars concentrate in relatively few
  low-|z| cells).
- Cell ID: `gx{i}_gy{j}_gz{k}` where `i,j,k = floor((x,y,z) / 100)`, `x,y,z` in parsecs, Earth at
  origin — same coordinate convention `raDecToVec3`/`generate_sky_data.py`'s `SkyCoord(...)
  .cartesian` already use, so no new transform is introduced.
- Manifest: `public/gaia-nearby/index.json`, shaped like `galaxy-oracle.ts`'s `OracleIndex`
  (`id_map` from cell ID → filename, plus per-cell star count and bounding box for a
  cheap client-side "which cells does this settlement need" check without fetching every file).
- Per-cell file: `public/gaia-nearby/{cellId}.json`, compact-array encoded (same convention as
  `SPEC_SKY_DATA_REGIMES.md` §4 / `generate_sky_data.py --compact`) — column order documented at
  the top of the file, not a JSON object per star.
- Loader: new `src/lib/gaia-nearby.ts`, copying `galaxy-oracle.ts`'s `loadIndex()` +
  `_clusterCache`/`_inflight` pattern verbatim (index-then-cell, in-memory `Map` cache,
  deduplicated concurrent fetch), renamed to the cell vocabulary. A settlement within 500 pc of
  Earth needs at most its own cell plus the 26 neighbours — lazy-load on settlement mount,
  keyed by the settlement's precomputed cell ID (derivable from `ra`/`dec`/`sy_dist` client-side,
  no fetch needed to know which cell to ask for).

This keeps per-file size small without needing an adaptive scheme: at the magnitude-cut row
count discussed in §2, even a dense galactic-plane cell should land in the tens-to-low-hundreds
of KB, well inside the range `galaxy-oracle.ts`'s existing per-cluster files already operate in.

---

## 4. Build-time pipeline

New script: `datagathering/fetch_gaia_dr3_500pc.py`, following the Hipparcos fetch convention
already documented in `generate_sky_data.py`'s own docstring (a cached local file, re-run only
to refresh, not a runtime dependency) rather than `scripts/`'s Node `.mjs` convention — this is
astropy/astroquery territory alongside `hipparcos.csv`, `western-constellations.json`, and the
rest of `datagathering/`'s existing Python catalog-fetch scripts, not the NASA-Archive/region-map
Node scripts in `scripts/`.

Two-stage, matching the existing split between `datagathering/`'s raw-catalog fetch and its
separate generation step:

1. **`fetch_gaia_dr3_500pc.py`** — runs the §2 ADQL query as an **async** TAP job (the Gaia
   Archive's synchronous query path caps around 2,000 rows; anything at the row counts discussed
   in §2 requires `Gaia.launch_job_async()`, which queues and can take minutes), writes the raw
   result to `datagathering/gaia_dr3_500pc.csv`, mirroring `hipparcos.csv`'s role. This is a
   rarely-rerun, checked-in cache, not a build-time network call — the Gaia Archive has fair-use
   throttling and no documented SLA for job turnaround, so it does not belong in any CI/deploy
   path.
2. **New generation step** (either a mode of `generate_sky_data.py` or a standalone
   `generate_gaia_tiles.py`) — reads `gaia_dr3_500pc.csv`, applies the RUWE/`parallax_over_error`
   quality mask (§2), buckets into the §3 grid, writes `public/gaia-nearby/{cellId}.json` +
   `index.json`. This step *also* becomes the thing that hands `generate_sky_data.py`'s `Catalog`
   class a merged near/far array (§5), so it's worth writing this as a shared loader function
   both scripts import rather than duplicating the CSV-parsing logic Hipparcos's `Catalog.
   __init__` (`:101-144`) already has.

---

## 5. Integration points

| File / function | Change |
|---|---|
| `datagathering/generate_sky_data.py`, `Catalog.__init__` (`:101-144`) | For stars with `dist_pc <= 500`, source rows from the new Gaia cache instead of `hipparcos.csv`; keep Hipparcos rows for `dist_pc > 500` unchanged. The `reliable` mask (`:130-133`) gains a Gaia branch using `ruwe < 1.4` in place of (not only alongside) the `frac_err <= 0.3` cut, since RUWE is the field actually designed for this |
| `datagathering/generate_sky_data.py`, magnitude/reliability constants (`:88-97`) | No change to `MAG_CUTOFF`/`NEARBY_ALERT_PC` — the swap is source-catalog, not threshold |
| `src/data/bright-stars.ts` | Per-star audit against Gaia DR3 by `source_id` cross-match (RA/Dec + magnitude), not a bulk replace — see §6 saturation caveat. Where Gaia has a clean (`ruwe < 1.4`) solution, update `dist_pc`; where not, keep the current Hipparcos-era value and note why in the existing per-field doc comment style |
| `src/lib/gaia-nearby.ts` (new) | Tile loader per §3, for any future direct consumer of the ≤500 pc catalog outside the `generate_sky_data.py` build step (e.g. a dedicated "nearby stars" exploration view) |
| `src/pages/SurfaceViewPage.vue` `addStarField()`/`addBrightStars()` | **No change from this spec alone.** These read `galaxyStore.planets` and `BRIGHT_STARS` directly (§1, Pipeline A) and don't consume `public/sky/` output at all yet. They only benefit once `SPEC_SKY_DATA_REGIMES.md`'s regime/delta fetch is wired into this page — tracked there, not here |
| `src/pages/DataCoveragePage.vue` (`:194-201`) | Add a row: `{ name: 'Gaia DR3 (≤500 pc subset)', count: '<TBD from §2 query>', coverage: 'd ≤ 500 pc', use: 'Nearby-star precision layer, generate_sky_data.py Catalog' }`, alongside the existing HYG/Hipparcos-adjacent rows — this is the app's existing catalog-attribution surface (same table already carries the `NASA/HEASARC/Takey2013` credit pattern the blog post describes) |

---

## 6. Migration / fallback

- **Split by distance, not a full replace.** `d > 500 pc` keeps using Hipparcos exactly as
  today — Gaia's full depth there is unnecessary and reintroduces the row-count problem §2
  exists to avoid. `d ≤ 500 pc` uses Gaia DR3 as primary.
- **Per-star Hipparcos fallback within 500 pc, not a blanket cutover, because of saturation.**
  Gaia's astrometry is known to degrade for very bright sources (roughly G ≲ 3, i.e. most of
  `bright-stars.ts`'s brightest entries — Sirius, Canopus, Vega, Rigel, Achernar are the kind of
  naked-eye star this affects) due to CCD saturation in the astrometric instrument; some bright
  DR3 sources carry poor `ruwe` or are missing a clean parallax solution entirely. The
  `ruwe < 1.4` gate in §5 is what encodes this — a star failing it falls back to its existing
  Hipparcos-derived value rather than silently gaining a worse Gaia number. This is a real,
  specific reason the merge is per-star and quality-gated rather than "prefer Gaia whenever
  present."
- **`SPEC_SKY_DATA_REGIMES.md`'s regime/delta file *shape* is unchanged.** This spec only
  changes what feeds `Catalog`, upstream of regime/delta generation — no schema change to
  `public/sky/regimes/{id}.json` or `public/sky/deltas/{slug}.json` is proposed.
- **Existing `public/sky/proxima-cen.json` / `trappist-1.json` samples go stale** the first time
  `generate_sky_data.py` is re-run with the Gaia-backed `Catalog` — regenerate them as part of
  landing this work, so the two sample files stay representative of the pipeline's actual output
  rather than a pre-Gaia snapshot.

---

## 7. Open questions

**Q1 — Real row count after the magnitude cut.** §2's row-count reasoning is order-of-magnitude,
not measured. Before committing to the §3 tiling scheme, run the actual ADQL query with a
`phot_g_mean_mag` cut matching `MAG_CUTOFF` and record the real number — if it's meaningfully
larger than the ~8,800-star Hipparcos baseline (e.g. because Gaia's better completeness picks up
real faint nearby stars Hipparcos missed entirely, not just better precision on stars both
catalogs have), the "not a count upgrade" framing needs a caveat, and cell sizing in §3 may need
revisiting.

**Q2 — Grid cell size (100 pc, proposed).** Untested against real stellar density. The galactic
plane concentrates stars in low-|z| cells much more than a uniform-cube assumption predicts;
worth checking whether a plane-aware anisotropic cell (e.g. thinner in z) beats a uniform cube
before committing, once Q1's real data exists to check against.

**Q3 — Build cadence.** Gaia DR3 is a static release (no new rows arriving); the
`fetch_gaia_dr3_500pc.py` cache should not need re-running on any schedule, unlike
`fetch-exoplanet-archive.mjs` which tracks a growing live archive. Should the checked-in
`gaia_dr3_500pc.csv` cache (and generated tiles) be committed to the repo, or built once and
published as a release artifact the way `topo-params.json` is generated locally and then
committed? Leaning toward "commit the generated tiles, not the raw CSV" (tiles are what
`public/` needs; the multi-GB-scale raw CSV before magnitude cut does not belong in git) — not
decided.

**Q4 — Should `src/lib/gaia-nearby.ts` exist as a standalone consumer at all in v1,** or is it
premature until something other than `generate_sky_data.py` actually wants direct tile access?
Building the loader but leaving it uncalled would repeat the current state of `public/sky/`
itself (built, not wired in — §1). Leaning toward deferring `gaia-nearby.ts` until a concrete
consumer exists, and treating §4's generation step as the only required deliverable for v1.

**Q5 — Attribution text, exact current wording.** ESA/Gaia DPAC require a credit line
substantially in this published form: *"This work has made use of data from the European Space
Agency (ESA) mission Gaia, processed by the Gaia Data Processing and Analysis Consortium (DPAC).
Funding for the DPAC has been provided by national institutions, in particular the institutions
participating in the Gaia Multilateral Agreement,"* plus a citation to the Gaia DR3 release
paper (Gaia Collaboration, Vallenari et al. 2023, A&A 674, A1). This spec states that from
memory of standard Gaia-product attribution practice, not a live fetch of the current Gaia
Archive credit-and-citation page — confirm exact current wording there before shipping any
public-facing credit text, the same way `clusters-xray.json`'s `NASA/HEASARC/Takey2013` line was
presumably checked against source. Placement: `DataCoveragePage.vue`'s existing table (§5) plus
wherever the app's general third-party-data credits page already lives, if one exists separately
from that table.
