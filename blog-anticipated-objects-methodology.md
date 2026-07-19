# What Else Is Out There

## An honest methodology for populating the black hole observatory with statistically anticipated objects — and why "anticipated" has to mean something specific

*SCD Hub / Exotopia.org — July 2026*

---

The [black hole observatory expansion](/blog/black-hole-observatory-expansion) added 9 real black holes to the site, each rendered with the actual objects we have evidence for: a companion star with a measured mass and orbit, a jet with a measured inclination, 7 hypervelocity tracer stars with a measured velocity dispersion. Nothing invented, everything citable.

But a real black hole doesn't sit in a vacuum. Cygnus X-1 has a stellar companion we've measured — and it also has ordinary field stars scattered around it, because that patch of the Milky Way isn't empty. Omega Centauri's black hole sits inside a cluster of ten million stars, of which we've only individually resolved the 7 that are moving fast enough to prove something is pulling on them. M87* sits at the center of a giant elliptical galaxy with a dense nuclear star cluster around it, not floating alone in intergalactic space. Right now, every one of our scenes renders as if the confirmed objects are the *only* objects — which is honest about what we've measured, but wrong about what's actually there.

This post is the planning pass for fixing that: adding a second, clearly-labeled category — **ANTICIPATED** — for objects we haven't individually observed but that established astrophysics says, with real confidence, must be present. And it's the methodology writeup for a data-generation pipeline we've now built and run, producing the actual object sets, ahead of wiring them into the 3D scenes.

## This category already exists on the site — we're extending it, not inventing it

This isn't a new idea for Exotopia. The galaxy view already distinguishes **confirmed** exoplanet systems from **candidate** systems (unconfirmed detections) and **frontier** systems (statistically predicted, not yet surveyed) — three different visual treatments, three different levels of evidentiary confidence, all clearly labeled. The cosmic web view does the same thing with "CATALOGUED GALAXY" versus "GENERATED GALAXY" cluster members. Sagittarius A*'s own nuclear star cluster has always been a procedurally generated stellar field standing in for the crowded region no catalog fully resolves.

"ANTICIPATED" for the black hole catalog is the same idea, applied consistently: a third bucket, alongside confirmed and (where relevant) candidate, for objects generated from a real density model rather than measured directly. The rule that makes this honest rather than decorative is the same rule the rest of the site already follows — every anticipated object has to carry the model that produced it, visibly, so nobody mistakes a statistical estimate for a discovery.

## Three environments, three density models

Lumping all 9 black holes into one generic "scatter some stars around it" function would have been faster and would also have been wrong — a stellar-mass black hole floating in the Milky Way disk, a black hole at the core of a globular cluster, and a supermassive black hole at the center of another galaxy are three genuinely different stellar environments. Each gets the density model that actually describes it.

**1. Galactic field-star density** — for the 7 Milky Way x-ray binaries (Gaia BH1, BH2, BH3, Cygnus X-1, V404 Cygni, GRO J1655-40, A0620-00)

These systems aren't in a special environment — they're just sitting in the ordinary Milky Way disk, at whatever galactic position their RA/Dec/distance puts them. What "should" be nearby is the ordinary background field star population at that specific position, no more and no less. We use the exponential thin-disk model from Jurić et al. 2008 (ApJ 673, 864):

```
n(R, z) = n0 · exp(−(R − R0)/L) · exp(−|z|/H)
```

with R0 = 8,300 pc (our galactocentric radius), L = 2,600 pc (radial scale length), H = 300 pc (thin-disk scale height), and n0 = 0.14 stars/pc³ (local total main-sequence density, consistent with RECONS local-census figures). Each system's real RA/Dec/distance gets converted to galactic (R, z) via the standard J2000 pole transform, the local density gets evaluated there, and we sample that many stars in a 3-pc sphere — small enough to stay "immediate neighborhood," large enough not to be empty. Spectral types are drawn from realistic local-population fractions (M dwarfs are ~76% of all real stars by number; O and B stars are vanishingly rare), not a flat random distribution.

**2. King-profile cluster density** — for Omega Centauri's IMBH

Globular clusters have a well-studied radial density law. We use the King (1962) profile with Omega Centauri's actual published core radius (2.4 pc), truncated well inside the real ~55 pc tidal radius so the sample stays a "core region" rather than the whole cluster. The central density we use (5,000 stars/pc³) is a round, visually-plausible figure — we're explicit in the output that it is *not* a specific paper's number-density fit, because we don't have one at that precision. The 7 real hypervelocity tracer stars (Häberle et al. 2024) — the actual dynamical evidence for the IMBH — stay separate from this generated field; they're confirmed data, this is texture around them.

**3. Nuclear stellar cusp** — for M87* and NGC 4258

Supermassive black holes at the centers of relaxed galaxies are expected to sit inside a stellar density cusp — a population that piles up toward the center because two-body relaxation drives lighter stars inward over cosmic time. Bahcall & Wolf (1976, ApJ 209, 214) derived the classic result for this: n(r) ∝ r^−7/4 for a fully relaxed single-mass cusp. We use that exponent. For the normalization, we were honest that we don't have a reliable per-galaxy photometric fit at the individual-star level — M87 and NGC 4258 are far too distant for that kind of resolution from Earth. So instead of inventing a number, we cross-calibrated against this site's own existing Sgr A* nuclear cluster field (whose star count was already tuned for visual plausibility, not fit to a paper either) and scaled by mass^(1/3), a deliberately conservative proxy for how a black hole's sphere of influence grows with mass. That scaling is disclosed in the output data, not hidden in the number.

## What the pipeline actually produces

A new stdlib-only Python generator — `datagathering/generate_bh_anticipated_objects.py` — follows the same architecture already established by this project's other population generators (`generate_cluster_subobjects.py`, `generate_cluster_populations.py`): a seeded Mulberry32 RNG (the same PRNG already used throughout the TypeScript frontend, so results are reproducible and match the codebase's existing conventions), one density model per environment type, JSON output to `public/black-holes/anticipated/<bh-id>.json`.

Every output file carries the object list plus:

- `"category": "anticipated"` — impossible to confuse with confirmed data downstream
- `"methodology"` — which of the three models produced it
- `"methodology_note"` — the plain-language caveat, including exactly which numbers are literature values and which are illustrative cross-calibrations
- `"methodology_params"` — the actual constants used, so the estimate is auditable

We ran it for all 9 objects. The counts it produced are exactly what the models predict: the Milky Way field-star neighborhoods come out sparse (8–32 stars per system, varying with each system's actual galactic height and radius — GRO J1655-40, sitting closer to the galactic plane and inner disk, gets noticeably more than the others), while Omega Centauri and the two extragalactic nuclei — genuinely dense environments — come out in the thousands, capped for file size rather than for realism.

## What this is not, yet

This post is the planning and methodology pass, and the data now exists. It is not yet wired into the 3D scenes — none of the 9 black hole pages render these objects today. That's deliberate: rendering thousands of nuclear-cusp stars or a few dozen field stars well (LOD, performance, avoiding visual clutter around the confirmed objects that actually matter) is its own piece of work, and we'd rather get the estimate right first and the rendering integration right second than rush both at once.

## Sources

- Jurić, M. et al. 2008, "The Milky Way Tomography with SDSS," ApJ 673, 864 — thin-disk exponential density parameters
- King, I. R. 1962, AJ 67, 471 — globular cluster density profile
- Häberle, S. et al. 2024, Nature 631, 285 — Omega Centauri hypervelocity tracer stars (the confirmed data this generated field sits alongside)
- Bahcall, J. N. & Wolf, R. A. 1976, ApJ 209, 214 — relaxed stellar-cusp power law around a massive central object
- Companion posts: ["Ten Black Holes, Four Shapes"](/blog/black-hole-observatory-expansion), ["The Swarm Around the Center"](/blog/sgr-a-black-hole-swarm)
