# Ten Black Holes, Four Shapes

## Expanding the Galactic Center scene into a real observatory — the research, the architecture, and the honesty tradeoffs

*SCD Hub / Exotopia.org — July 2026*

---

The Galactic Center scene has had a single occupant since it was built: Sagittarius A*, rendered as a true event horizon (a black shadow, not a bright dot), a photon ring at 1.5 Schwarzschild radii, an ISCO marker, and a temperature-gradient accretion disk, surrounded by the actual Keplerian orbits of the S-stars. The `/bh/:bhId/:zone?` route existed for other black holes from early on, but nothing ever linked to it — it was scaffolding with no destination.

This post covers what it took to give that route somewhere to go: a research pass across every category of "how do we know this is a black hole," a data catalog, a shared rendering core extracted from the Sgr A* work, and four new scene types for the objects that don't fit the "galactic nucleus" template at all.

## The catalog

We picked ten objects spanning every distinct line of evidence in the field, not just "more black holes":

- **M87\*** — the *other* black hole humanity has photographed. EHT, 2019. 6.5 billion M☉, 53 million light-years away, with a jet about 5,000 light-years long.
- **NGC 4258 (M106)** — not imaged, but arguably more precisely *measured* than anything except Sgr A*: a literal water-maser disk in Keplerian rotation, mapped by VLBI down to a dynamical mass good to about 0.3%.
- **Omega Centauri's intermediate-mass black hole** — the newest result in the set (Häberle et al., *Nature*, 2024): seven stars in the cluster core moving too fast to be bound to anything but a ~40,000 M☉ dark object.
- **Gaia BH1, BH2, BH3** — black holes found by watching a *star* wobble, not by looking for X-rays at all. Full orbital solutions from Gaia astrometry, with zero accretion-disk modeling involved in the mass measurement.
- **Cygnus X-1, V404 Cygni, GRO J1655-40, A0620-00** — the X-ray binary lineage going back to the 1970s, including the original 1964 discovery that (eventually) won Stephen Hawking his bet with Kip Thorne.

Every mass, distance, and orbital parameter in the catalog traces to a specific paper — GRAVITY Collaboration, Miller-Jones et al. 2021's revised Cygnus X-1 parallax, El-Badry et al.'s Gaia binary papers, and so on. Where a paper didn't give us a number we needed — orbital separation, for most of the X-ray binaries — we derived it from Kepler's third law using the published mass and period, which is a straightforward calculation, not an independent claim, and we said so in the data file's comments.

## Where we chose not to fabricate precision

A few places we could have made up a number that *looked* rigorous and chose not to:

- **Unmeasured spins.** Most of these black holes don't have a measured spin parameter. Rather than inventing one, the data model has an explicit `spinRegime` (`schwarzschild` / `moderate` / `near-extremal`) with a documented, consistent rule for how each regime maps to photon-sphere and ISCO radii — the same approximation already used for Sgr A*, just made explicit instead of ad hoc.
- **Omega Centauri's seven hypervelocity stars.** Their motion is the actual dynamical evidence for the IMBH, but their individual orbits aren't published per-star. We render them drifting outward from the cluster core — evocative of "moving too fast to stay bound" — rather than inventing precise ephemerides that would look authoritative and be fiction.
- **Settlement zones.** The Sgr A* scene has a whole panel of research-settlement lore — Photon Sphere Station, ISCO Research Platform, and so on. None of the new nine objects get one. We have no narrative basis for "settling" Cygnus X-1, and bolting on fake lore to match the Sgr A* panel would have been worse than just not having it.

## Four shapes, one core

The actual design problem was that these ten objects aren't one kind of scene. A black hole in a galactic nucleus (nuclear star cluster, named stellar orbits) is a different *environment* than a black hole with one companion star in a tight binary, which is different again from a black hole with a 5,000-light-year jet, which is different again from one whose defining feature is an edge-on disk of water masers. Forcing all ten through the Sgr A* template would have meant, e.g., giving Cygnus X-1 a fake nuclear star cluster it doesn't have.

So the event horizon / photon ring / lensed sub-ring / ISCO / accretion-disk logic — the actual general-relativity core, previously hand-written once for Sgr A* — got extracted into a standalone builder (`black-hole-core.ts`) that takes physical radii and returns Three.js objects. Every scene type calls the same core. What differs is the *dressing*:

| Scene type | Dressing | Example |
|---|---|---|
| `x-ray-binary` | Companion star + accretion stream + real orbital motion | Cygnus X-1 |
| `globular-imbh` | Dense cluster field + drifting tracer stars | Omega Centauri |
| `agn-jet` | Relativistic jet + host galaxy context | M87* |
| `megamaser-disk` | Edge-on warped maser disk at its own compressed scale | NGC 4258 |

Sgr A* itself stayed exactly as it was — same file, same S-star data, same settlement panel — just gated behind an `isSgrA` check instead of being the only path through the component.

## The scale problem, twice

Two separate scale mismatches showed up, both solved the same way the Sgr A* disk already solves it: pick a documented exaggeration and say so.

The first was expected: M87*'s jet is roughly 5,000 light-years long, which is about two million times its own horizon radius. Rendering it to true scale would make the horizon a sub-pixel dot. It's drawn at a fixed stylized length instead, with the real figure in its hover tooltip.

The second wasn't expected until we actually looked at the screenshots: for the tightest X-ray binaries — A0620-00's black hole and its companion orbit each other at 0.018 AU, closer than Mercury is wide — a fixed-size "compact object bubble" tuned to look right for Cygnus X-1 (whose orbit is ten times wider) turned out to be *larger than the whole orbit*. The accretion disk geometry inverted itself into a distorted crescent instead of a ring. The fix was to stop using an absolute bubble size and instead draw the horizon/photon-ring/ISCO trio as a fixed *fraction* of each system's own orbital separation — which guarantees the physical ordering (horizon < photon ring < ISCO < disk < companion orbit) holds regardless of how tight or wide the real system is, the same principle already used for Sgr A*'s two-tier exaggeration, just generalized to a catalog instead of one object.

## What's next

The `/black-holes` index page is live, linked from the main Explore menu. Ten entries today; the catalog and the four scene-dressing functions are built to take more without another architectural pass.
