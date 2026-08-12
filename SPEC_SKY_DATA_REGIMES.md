# Sky Data Regimes — Shared-Bucket Local Sky, Client-Cached

**SCD Hub · Exotopia.org · Draft — v0.1 · GPL v3**
*Extends `SPEC.md` §14 (the original per-planet Hipparcos sky-data design). That design is
correct but doesn't scale: even at compact-array encoding (§4 below), one file per planet
across the ~6,271 exoplanets with usable coordinates would be ~1.5–1.8 GB of static JSON.
This spec replaces "one full sky file per planet" with "one shared sky per group of
similarly-positioned planets, plus a tiny per-planet correction," and a client-side cache so
a returning (especially installed/PWA) visitor never re-downloads a regime they already have.*

---

## 1. The core problem, with real numbers

`datagathering/generate_sky_data.py` (built and validated this session — see its docstring
for exact provenance of each cached input) computes, for one observer position, the true
apparent RA/Dec/magnitude of every Hipparcos star bright enough to matter (naked-eye limit,
Vmag ≤ 6.5 — see that script for why `SPEC.md`'s literal "9.0" was wrong: 83k of the
catalog's 118k stars are already brighter than that from Earth alone, so it barely trims
anything). Validated output size, compact-array encoding:

| | Per file |
|---|---|
| Uncompressed | ~815 KB |
| Gzipped (actual network transfer) | ~330 KB |

`public/exoplanets-viz.json` has **6,271 planets with usable `ra`/`dec`/`sy_dist`** (of 6,298
total). One file each ≈ **5.1 GB uncompressed / ~2.1 GB gzipped** — not something to commit to
a static-site `public/` folder or serve fresh to every visitor.

**Why "one file per planet" is also mostly wasted precision.** Apparent position shift for a
background star scales with `observer_distance_from_Earth / star_distance`. Two planets that
are genuinely close to each other *in true 3D space* — whether that's because they're at
similar distances from Earth, in a similar sky direction, or both — see nearly the same shift
for the ~8,800 background stars that make up the bulk of each file. The part that's genuinely
unique per planet is small: which handful of real stars happen to sit *very* close to *that*
specific planet (the existing `nearby_alerts` concept — typically 5–15 stars), and the exact
position of the ~692 stars that make up the 88 IAU constellation line patterns (small because
it's a fixed set, not because it doesn't matter — see §3).

## 2. Bucketing: a 3D spatial partition, not a fixed grid

An earlier version of this idea proposed fixed distance-bands crossed with sky-direction
octants. Checked against the real data and rejected: **RA/Dec is heavily skewed** — bucketing
`(ra≥180 or <180) × (dec band)` puts **3,229 of 6,271 planets (51%) into one bucket**, because
of the well-known dense Kepler field (already special-cased elsewhere in this codebase —
`SurfaceViewPage.vue`'s `addStarField()` Layer 2 already subsamples/jitters it for a different
reason). A fixed grid would produce one enormous regime and several nearly-empty ones.

**Approach: recursive median-split (k-d tree) in Cartesian parsec-space**, not RA/Dec/distance
independently:

1. Convert every target planet's `(ra, dec, sy_dist)` to Cartesian `(x, y, z)` in parsecs
   (same transform as `raDecToVec3`/`generate_sky_data.py`'s `SkyCoord(...).cartesian`).
2. Recursively bisect the point set: at each node, find the bounding box of its members, split
   along the **longest axis at the median value** — this always produces two ~equal-population
   children, regardless of how dense or sparse that region of space is. Stop when a leaf has
   ≤ `TARGET_BUCKET_SIZE` planets (proposed: 75 — tunable, see §7 Q1) or a max-depth safety
   limit is hit.
3. Each leaf is one **regime**. A regime's observer position for sky generation is the
   **centroid** (mean Cartesian position) of its member planets — not the bounding-box center,
   which is more sensitive to outliers.

This directly solves the Kepler-field problem: a k-d tree keeps splitting a dense cluster
until each leaf is population-bounded, so the Kepler field becomes many small, tight, accurate
regimes instead of one giant approximate one — no special-casing needed, unlike a fixed grid.

At `TARGET_BUCKET_SIZE = 75`, 6,271 planets → **~84 regimes**. Total regime-file payload:
84 × ~815 KB ≈ **~68 MB uncompressed** (vs. 5.1 GB for one-per-planet) — a ~75x reduction
before the per-planet delta layer is even added.

## 3. Two-file architecture: regime sky + per-planet delta

**Regime file** — `public/sky/regimes/{regimeId}.json`. Identical shape to the existing
per-planet output (`SPEC.md` §14.4 schema, compact-array encoding), generated once from the
regime centroid: ~8,800 background stars, 88-constellation line topology + *approximate*
positions (accurate for the regime's centroid, not any individual member planet).

**Per-planet delta file** — `public/sky/deltas/{hostname-slug}.json`, small and specific to
one exact observer position:

```jsonc
{
  "meta": {
    "hostname": "TRAPPIST-1",
    "regime_id": "r042",              // which regime file this delta applies on top of
    "generated": "2026-08-10T...",
    "generator_version": "1.0.0"
  },
  "nearby_alerts": [ /* same shape as today — stars genuinely close to THIS planet */ ],
  "constellation_stars": [
    // Exact recomputed app_ra/app_dec/app_mag for all 692 HIP stars that appear in any
    // of the 88 IAU constellation line patterns — a fixed-size set regardless of regime,
    // so this is cheap (~692 rows) and always exact, never regime-approximated. Line
    // *topology* (which HIP connects to which) doesn't change and isn't repeated here —
    // it lives in the regime file; the renderer overlays these corrected positions onto
    // the same line pairs.
  ]
}
```

Why constellations get their own always-exact treatment (per the resolved Q&A below) rather
than staying at regime-level approximation like the background: they're the foundation for
the "localized zodiac" cultural feature this was ultimately building toward — a constellation
that's visibly wrong because it was drawn from a centroid 20pc away from the actual settlement
undermines the exact thing that feature is supposed to deliver. The bulk background stars
don't carry that requirement; nobody will notice a magnitude-6.3 background star a fraction of
a degree off from a neighboring regime's exact position.

**Rough size**: 692 stars × compact-array row ≈ 15–25 KB per delta, uncompressed, before
`nearby_alerts` (negligible — a handful of rows). **6,271 deltas ≈ ~95–155 MB total** — still
generated ahead of time and committed as static files, same as regimes.

**Combined total**: ~68 MB (regimes) + ~95–155 MB (deltas) ≈ **~165–225 MB**, vs. 5.1 GB for
the naive one-file-per-planet approach. ~25–30x smaller, while keeping full per-planet
precision for the layer that actually needs it.

## 4. Compact array encoding (already built and validated)

`generate_sky_data.py --compact` — same information as the object-per-star schema, but each
star is a plain array in a documented column order (`star_columns`/`alert_columns` at the top
of the file) rather than a JSON object with repeated key names. Validated this session on two
real systems (Proxima Centauri b, TRAPPIST-1):

| | Object encoding | Compact array encoding |
|---|---|---|
| Uncompressed | ~2.2 MB | ~815 KB (~2.7x smaller) |
| Gzipped | ~432 KB | ~330 KB (~1.3x smaller) |

**Honest caveat, worth remembering when deciding whether it's worth the readability cost**:
gzip was already eating most of the object-key redundancy — the *uncompressed* win is real and
matters for git/disk footprint, but the *wire-transfer* win (what a user's connection actually
feels) is much smaller than the uncompressed number suggests. Used here regardless, since the
uncompressed-size reduction compounds directly with the regime-bucketing reduction above (both
apply to what's committed to `public/`), and it's a small readability cost for machine-consumed
data that a person is never meant to hand-edit.

## 5. Client-side cache — extends the existing IndexedDB pattern

This codebase already hand-rolls IndexedDB for offline data — `src/stores/eco-offline.ts`
(promisified `idbAll`/`idbPut`/`idbDel` over raw `indexedDB.open()`, versioned object stores).
No new dependency; a `sky-cache` store follows the identical shape:

```ts
DB_NAME    = 'sky-cache'
DB_VERSION = 1
REGIME_STORE = 'regime-sky'    // keyPath: 'regimeId'
DELTA_STORE  = 'planet-delta'  // keyPath: 'hostnameSlug', index: 'regimeId' (bulk-invalidate by regime)
META_STORE   = 'meta'          // keyPath: 'key' — generator_version, last-cleaned timestamp
```

**Fetch/cache flow**, per settlement surface-view mount:
1. Fetch `/sky/deltas/{slug}.json` (small; per the Q&A below, always fetched fresh over the
   network rather than requiring a cache hit first — no special "not set up" degraded path).
   Its `meta.regime_id` says which regime to load.
2. Check `sky-cache.regime-sky[regimeId]`. If present and its stored `generator_version`
   matches the delta's, use it. Otherwise fetch `/sky/regimes/{regimeId}.json` and store it.
3. Merge client-side for rendering: regime's background stars + regime's constellation line
   *topology*, with the delta's `constellation_stars` positions overlaid (exact) and
   `nearby_alerts` added as their own highlighted layer.

**Why this materially helps "set up" users** (PWA-installed, per this repo's existing
`InstallPrompt.vue`/`quasar.config.js` `pwa` block): a regime is shared by ~75 planets, so a
user who's visited even a handful of nearby settlements has likely already cached the regime
their next one needs — subsequent visits skip the ~815 KB regime fetch entirely, only pulling
the small delta. Regular (non-installed) browser tabs get the same IndexedDB caching within a
session/until eviction; installed PWAs are meaningfully more likely to keep it, which is the
concrete reason to also call `navigator.storage.persist()` (not currently used anywhere in
this codebase — new, guarded by feature-detection, request it once on first sky-cache write
when `matchMedia('(display-mode: standalone)')` indicates an installed PWA) so the browser
doesn't evict the cache under storage pressure.

## 6. Q&A — decisions made this pass

| Question | Decision | Why |
|---|---|---|
| Fixed grid vs. population-balanced buckets? | **Population-balanced** (k-d tree, §2) | The Kepler-field skew (51% of planets in one fixed-grid bucket) makes a fixed grid produce wildly uneven regime sizes. |
| Local storage: raw IndexedDB, a wrapper lib, or in-browser SQL? | **Extend the existing raw IndexedDB pattern** (§5) | Zero new dependencies; `eco-offline.ts` already proves the pattern works for this app's offline needs. SQL-in-browser (sql.js/wa-sqlite) was considered and rejected as too heavy for what's fundamentally key-value blob caching, not relational querying. |
| First-time/uncached visitor: fetch fresh, or fall back to the lighter client-computed approximation? | **Fetch fresh** | The delta is small and the regime file (~815 KB) is a reasonable one-time cost even uncached — no need for the `bright-stars.ts` 45-star approximation built earlier this session to double as a network-avoidance fallback. (It stays in the codebase as-is; this doesn't remove it.) |
| Should a planet's delta also recompute constellation-line positions, or stay nearby-alerts-only? | **Recompute constellations per system** (§3) | The constellation layer is the foundation for the later localized-zodiac feature — it needs to be exact per planet, not regime-approximate, or that feature starts from a shaky base. |

## 7. Open questions for the next pass

**Q1 — `TARGET_BUCKET_SIZE` (75, proposed).** Bigger buckets → fewer regime files but each one
less locally-accurate for a member planet far from its centroid; smaller buckets → more files,
less sharing benefit. 75 was picked to land near "a few dozen to ~100 regimes" without real
tuning against how "wrong" a regime's background stars look from a planet at the edge of its
bucket. Worth a follow-up pass measuring actual worst-case `pos_shift_deg` error between a
regime's centroid and its farthest member planet, once the k-d tree implementation exists.

**Q2 — Regime regeneration cadence.** `public/exoplanets-viz.json` grows as
`fetch-exoplanet-archive.mjs` picks up newly confirmed planets. A new planet needs assignment
into an existing regime (nearest centroid) or triggers a regime split/rebalance — the former
is cheap and keeps old regime files stable (good for the client cache); the latter is more
"correct" but invalidates cached regimes for everyone. Leaning toward nearest-centroid
assignment between full k-d-tree rebuilds, with a full rebuild only on major catalog refreshes
— not decided, needs the actual regeneration script to exist first.

**Q3 — `navigator.storage.persist()` UX.** Should this be silent (best-effort, no user-facing
prompt — browsers may still prompt internally per their own heuristics) or should
`InstallPrompt.vue`/a settings page surface "keep sky data offline" as an explicit toggle?
Leaning silent-best-effort for v1 (matches how `eco-offline.ts` doesn't ask permission for its
own IndexedDB usage either), revisit if storage eviction turns out to be a real support issue.

## 8. Related documents

- `SPEC.md` §14 — the original per-planet sky-data design this spec revises (schema, Hipparcos
  fields, constellation-culture layer §14.7 — unchanged by this spec, still applies once data
  exists)
- `datagathering/generate_sky_data.py` — the generator this session built and validated
  (Hipparcos catalog fetch, magnitude-cutoff correction, compact-array encoding, host-star
  self-match exclusion — all fixed against real output, not just designed on paper)
- `src/stores/eco-offline.ts` — the existing IndexedDB pattern §5's cache extends
- `src/data/bright-stars.ts` / `SurfaceViewPage.vue`'s `addBrightStars()` — the client-computed
  45-star approximation built earlier this session; stays as-is, not replaced by this spec
