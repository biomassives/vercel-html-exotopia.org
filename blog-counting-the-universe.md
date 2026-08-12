# Counting the Universe

## How many galaxies, stars, planets, and moons are real in Exotopia — and how many did we generate — and is any of this a realistic way to build a cosmic visualization?

*SCD Hub / Exotopia.org — August 2026*

---

Exotopia lets you fly from the large-scale structure of the observable universe down to a settlement door on an exoplanet surface, without a single jump cut. That's a navigational claim. Underneath it is a data claim that's easy to gloss over: some of what you're flying past is a measurement, and some of it is a model. This post counts both piles, states the actual numbers (checked against the files in this repo, not round estimates), and then does the harder thing — asks honestly whether generating the second pile the way we do is a defensible way to build a scientific visualization, or just a game dressed in citations.

The short version: real and generated content are roughly the same size across the app, every generated object traces back to a real physical input even when the object itself isn't observed, and the biggest risk to the whole approach is not the generation itself — it's letting the two piles blur together in a user's mind. The [data sources reference](/blog/data-sources-unified-viz) is the catalog-by-catalog ledger; this post is the scale and the argument.

---

## The count

**What's real** — measured, catalogued, published, and traceable to a specific survey or paper:

- **345 galaxy clusters**, each with a real right ascension, declination, redshift, and X-ray plasma temperature — the Takey2013 XMM-Newton catalog.
- **~56 individually named galaxies** — the brightest cluster galaxies (BCGs) and other prominent members of the 15 hand-curated named clusters (Virgo, Coma, Perseus, Shapley, Norma, and others) — each with a real measured or imaged black hole mass, from Event Horizon Telescope imaging, reverberation mapping, or stellar-dynamics constraints.
- **61,817 stars** — a performance-trimmed export of the HYG Stellar Database v3 (the full catalog has 119,614; the app ships the subset that keeps the Milky Way star field fast).
- **35,896 exoplanet records** — the NASA Exoplanet Archive's composite planetary systems table, confirmed and archive-listed candidates combined.
- **6,830 TESS Objects of Interest** — real transit-signal candidates from the TESS mission, not yet confirmed, carried as a distinct "candidate" tier rather than folded into the confirmed count.
- **2 exomoon candidates** — Kepler-1625b-i and Kepler-1708b-i, both scientifically contested, both published with real orbital parameters (Teachey & Kipping 2018; Kipping et al. 2022).
- **9 real black holes**, individually — with measured companion stars, jet inclinations, or (for Sagittarius A* and M87*) directly imaged event horizons.

**What's generated** — procedurally produced from a seeded algorithm, physically motivated but not the record of an actual detection:

- **26,225 cluster-member galaxies** — the Galaxy Oracle, one population file per X-ray cluster. Member count and morphology mix (elliptical-dominated vs. spiral-rich) are set by that specific cluster's real T_x and X-ray luminosity, not drawn from a flat distribution.
- **5,000 "frontier" planets** — statistically predicted worlds placed in orbit around *real* Hipparcos-catalog stars that don't have a confirmed detection. The host star is real; the planet is a placeholder for "something is statistically likely to be here," clearly tiered apart from confirmed and candidate planets.
- **7,096 star systems and 10,900 planets** — the deterministic per-galaxy planet pipeline. Every one of these is seeded on a real galaxy ID (say, `NGC4569`), and its architecture — orbit spacing, gas-giant probability, planet type mix — is biased by that galaxy's real cluster-zone, ICM stress, and metallicity, which are themselves derived from published cluster σ_v/T_x/M200 values (the Shapley/Abell 3558 research earlier in this thread is exactly this kind of input being derived and checked).
- **0 bulk-generated moons.** This is worth stating as plainly as the rest: there is no moon-generation pass. The settlement architecture for exomoons — a six-level trophic hierarchy from stellar orbit down through the moon's Hill sphere — is fully specced and coded, and it's ready to receive generated moons the way the planet pipeline receives generated planets. It hasn't been run. Two real candidates are all there is.

Put the two piles side by side and they land at roughly the same order of magnitude — somewhere around 40,000–45,000 records each. That balance isn't a coincidence we're claiming credit for; it's mostly a consequence of which pipelines happen to have been built out so far. But it does mean this isn't a thin shell of real data wrapped around a much larger synthetic universe, and it isn't a database viewer pretending to be a generator either.

---

## How that compares to the actual universe

None of the numbers above are trying to be a complete census of anything. The real universe has an estimated 200 billion to 2 trillion galaxies within the observable horizon; the Milky Way alone holds 100–400 billion stars. Exotopia's 345 cataloged clusters and 61,817 catalogued stars are a sample, not a survey — a deliberately chosen, citable slice, the same way a planetarium doesn't try to render every star, just the ones bright enough and well-measured enough to be worth the seat.

The exoplanet count is the place where the app's real data is closest to complete: as of 2026 there are roughly 5,900 *confirmed* exoplanets in the professional literature. The app's 35,896-record archive pull includes a much larger set of candidate and disputed entries alongside the confirmed ones, which is honest about what the archive itself contains but means "35,896" should never be read as "35,896 confirmed worlds." That's a labeling discipline the app already enforces in its tier system (confirmed / candidate / frontier / theoretical) — worth restating here because the aggregate number, quoted alone, invites exactly the confusion the tiers exist to prevent.

---

## What keeps this honest

Three mechanisms do the actual work, and they predate this post — they're why writing this post was possible at all rather than a guess:

**Tiering.** Every exoplanet-adjacent object carries a tier — confirmed, candidate, frontier, or (for black-hole environment stars) anticipated — and the tier is visible, not buried in a tooltip. A frontier planet around a real Hipparcos star is never rendered or described the way a confirmed transit detection is.

**Provenance blocks.** Every generated star system and planet carries a `provenance` record: which script produced it, which algorithm version, and a frozen snapshot of the real inputs (cluster zone, ICM stress, metallicity, host star T_eff) that drove the generation. `SPEC_PROVENANCE.md` calls this "a complete re-derivation recipe, not just a label" — anyone can re-run the generator against the recorded inputs and get the identical output back. That's a stronger honesty guarantee than a citation, because a citation can go stale silently; a provenance block fails loudly the moment the real input it was built from changes (that's the whole staleness-detection mechanism).

**Catalogued vs. generated badging.** The cosmic web view marks cluster members as "CATALOGUED GALAXY" or "GENERATED GALAXY" as a first-class visual distinction, not a footnote. It's the same discipline the black hole observatory now applies (CONFIRMED vs. ANTICIPATED objects, each anticipated object showing the density model that produced it — Jurić et al. 2008's thin-disk model for field stars, a King 1962 profile for the Omega Centauri core, and so on).

---

## Where the approach is honestly weak

Being fair to the count means naming the gaps as clearly as the successes:

- **331 of the 345 X-ray clusters have no individual member data at all** — position, redshift, and temperature only. They're navigable, not populated. (A routing bug surfaced during this exact work: clicking into one of those 331 clusters was sending users to a page that expects a hand-curated member file none of them have, producing a 404 instead of falling back to the correct thin X-ray view. Fixed in `CosmicPage.vue` — those clusters now correctly route to the X-ray cluster page instead of a dead fetch.)
- **Moons are architecture without content.** Zero generated moons against a fully-specced six-level settlement hierarchy is the single largest gap-to-readiness ratio in the whole system.
- **The sky is only accurate near Earth.** Parallax-correct constellations work well within a few hundred light-years; beyond roughly 2,000 light-years the background sky reverts to looking like Earth's because the shift becomes sub-degree, which is physically correct but means "your local sky" and "the shared cosmic background" aren't yet visually distinguished for distant settlements.
- **Void interiors are still mostly geometric placeholders.** Real void-galaxy catalogs (Kreckel et al. 2012, SDSS void surveys) exist and would replace the current sparse generated scene, but that swap hasn't happened yet outside a stub for the Boötes Void.

None of these are secrets — they're catalogued in the [data sources reference](/blog/data-sources-unified-viz)'s "what is thin" sections for each level of the descent, which is the point of keeping that document current.

---

## So — is it realistic?

Two different questions get asked when someone says "is this realistic," and they have different answers.

*Is any specific generated object real?* No, and the app should never let anyone conclude otherwise. A generated planet around `NGC4569`'s third star system is not a claim that astronomers have found a planet there. It's a claim that, given what's actually measured about that galaxy's cluster environment, a planet with roughly these properties is the kind of thing a physically reasonable model would produce. That's a categorically different claim, and the whole tiering/provenance/badging apparatus exists to keep users from collapsing the distinction.

*Is the overall structure and proportion realistic?* Substantially yes, and this is the more interesting claim. The generator isn't rolling dice against a flat distribution — hot, rich clusters get pushed toward early-type-dominated member populations because that's the real observed correlation; planetary architecture around a galaxy in a cluster's ICM-stressed core gets biased toward disrupted, tightly-bound systems because that's what ram pressure and tidal stripping actually do; metallicity gradients bias rocky-planet formation the direction the planet-formation literature says they should. This is the same epistemic category as a cosmological simulation seeded on real initial conditions — not a database of observations, but not arbitrary either. The Shapley Concentration calibration work that sits alongside this post is a worked example of exactly that pipeline: real σ_v, T_x, and M200 figures, checked against the published literature and explicitly flagged where the app's single-object model is a simplification of a genuinely multi-cluster structure, feeding forward into what the generator is allowed to produce.

The honest bottom line: this is a physically-anchored procedural generator wearing a real catalog as its skeleton, not a database viewer and not a screensaver. It earns the word "realistic" in the structural sense — the biases are real biases, the calibration constants are published numbers, the gaps are documented rather than hidden — and it does not, and should not, earn the word "real" for any individual generated object. Keeping those two words apart, consistently, at every level of the descent, is the actual engineering discipline this whole system depends on.

---

*SCD Hub / Exotopia.org · GPL v3*
*Companion to [The Cartography Problem](/blog/data-sources-unified-viz) (full data-source ledger). Counts verified against `public/clusters-xray.json`, `public/galaxy-oracle/*.json`, `public/stars/hyg-compact.json`, `public/exoapril2_2024.json`, `public/candidate-exoplanets.json`, `public/frontier-exoplanets.json`, and `public/star-systems/**/*.json` as shipped in this repo, August 2026.*
