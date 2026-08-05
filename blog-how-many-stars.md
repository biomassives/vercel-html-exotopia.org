# How Many Stars?

## An audit of Exotopia's 61,817-star field — where it sits among real catalogs, and whether the sky it draws has any gaps

*SCD Hub / Exotopia.org — August 2026*

---

Exotopia's Milky Way field ships 61,817 stars. That number has sat in the data-sources reference for a while as a line in a table; this post is what happens when you actually interrogate it — where does 61,817 sit against the real catalogs astronomy uses, and does the sky it draws have any gaps a viewer should know about? An interactive version of the analysis below, with the full log-scale comparison chart and the galactic-coordinate heatmap, is published as [**How Many Stars?**](https://claude.ai/code/artifact/00f3ed1e-d2ba-4c6a-8c65-04691180c76c) — this post is the write-up; that page is the instrument.

---

## A clean magnitude cut, not an arbitrary trim

The file Exotopia actually loads, `public/stars/hyg-compact.json`, contains 61,817 stars — every one brighter than apparent magnitude V ≈ 8.5, and none fainter. That's a real, deliberate cut of a real catalog: the HYG Stellar Database v3 (Nash, compiled from Hipparcos, the Yale Bright Star Catalogue, and the Gliese Catalogue of Nearby Stars) ships 119,614 stars in full; Exotopia's field is the brighter half of that table, trimmed for rendering performance, not a separately-curated or synthetic set. Every one of the 61,817 has a real position and a real distance.

Set against other published all-sky catalogs, the range is enormous — six orders of magnitude from what you can see standing outside to what the deepest space telescopes have resolved:

| Catalog | Stars | What it is |
|---|---|---|
| Naked eye (V ≤ 6.5) | ~9,100 | What you can see unaided |
| **Exotopia — shipped field** | **61,817** | V ≤ 8.5, real HYG v3 subset |
| HYG v3 — full catalog | 119,614 | Hipparcos + Yale BSC + Gliese, combined |
| Hipparcos Catalogue (1997) | 118,218 | ESA astrometric mission |
| Tycho-2 Catalogue (2000) | 2,539,913 | Complete to V ≈ 11.5 |
| 2MASS Point Source Catalog | ~470,000,000 | Near-infrared, all-sky |
| Gaia DR3 (2022) | ~1,800,000,000 | ~1.46 billion with full astrometry |

Exotopia's field sits at roughly the limit of good binoculars — about 300× fainter than naked-eye, and one clean step short of the full HYG table, six orders of magnitude short of Gaia. Closer to the shallow end than the deep end, and honestly labeled as such.

## Is the sky evenly covered, or are there gaps?

The more interesting question isn't depth, it's coverage — does a 61,817-star field actually fill the sky evenly, or are there scan-pattern holes, a thin hemisphere, some artifact of how the source catalogs were assembled?

Binning all 61,817 stars into a 15°×15° grid in galactic coordinates (288 cells, each normalized by its true solid angle so polar cells aren't penalized for covering less sky) turns up **no artificial gap** — no dead strip, no missing hemisphere. North/south celestial hemisphere ratio is 0.98, essentially even.

The one real, measurable pattern is galactic latitude: stars within 10° of the galactic plane account for 24.7% of the field despite that band covering only 17.4% of the sky, while high galactic latitudes (|b| > 30°) hold just 39.6% despite covering half the sky — roughly a 4× density contrast between the densest plane cell and the sparsest polar cell. That's not a catalog defect. It's the actual Milky Way: real bright, young stars concentrate in the thin disk, and the disk genuinely thins out toward the galactic poles. Going deeper into the catalog won't flatten that ratio, because it isn't a sampling artifact — it's physics.

## What would actually add more stars

Three ways to go deeper, in order of what they'd actually cost:

1. **Raise the magnitude cutoff on the existing catalog.** The full 119,614-star HYG v3 table is already in the pipeline — shipping to V ≈ 9.5–10 instead of V ≈ 8.5 roughly doubles the star count with the same file format and code path. No new data, no new engineering.
2. **Adopt Gaia DR3 for stars within 500 pc.** Already flagged as the top gap in the [data sources reference](/blog/data-sources-unified-viz). This is mainly a precision upgrade — Gaia's parallax accuracy is what a "new constellations"-style nearby-star feature actually needs — not primarily a bulk-count upgrade, and it's real engineering (tiled loading, not one JSON blob).
3. **Decide, explicitly, if the plane/pole contrast should ever be flattened.** It shouldn't be by accident. If a specific scene ever wants a more visually uniform sky (a void interior, say), that has to be a deliberate synthetic-filler decision, badged the same way generated cluster galaxies already are — not something that falls out of adding more real data, because it won't.

## Sources

1. Nash, D. — *HYG Stellar Database, v3*. [github.com/astronexus/HYG-Database](https://github.com/astronexus/HYG-Database)
2. Perryman, M. A. C., et al. 1997, "The Hipparcos Catalogue," *Astronomy & Astrophysics*, 323, L49; ESA, *The Hipparcos and Tycho Catalogues*, ESA SP-1200 (1997).
3. Hoffleit, D. & Warren, W. H. Jr. 1991, *The Bright Star Catalogue*, 5th Revised Edition, Yale University Observatory.
4. Gliese, W. & Jahreiß, H. 1991, *Preliminary Version of the Third Catalogue of Nearby Stars*, Astronomisches Rechen-Institut, Heidelberg.
5. Høg, E., et al. 2000, "The Tycho-2 Catalogue of the 2.5 Million Brightest Stars," *Astronomy & Astrophysics*, 355, L27.
6. Skrutskie, M. F., et al. 2006, "The Two Micron All Sky Survey (2MASS)," *The Astronomical Journal*, 131, 1163.
7. Gaia Collaboration, Vallenari, A., et al. 2023, "Gaia Data Release 3: Summary of the Content and Survey Properties," *Astronomy & Astrophysics*, 674, A1.

Galactic-coordinate binning and density-per-deg² figures are computed directly from `public/stars/hyg-compact.json` as shipped in this repo, not taken from any external source.
