# Milky Way Visualization — What Shipped, What's Next

**SCD Hub · Exotopia.org · Draft — v0.1 · GPL v3**
*Documents the August 2026 rebuild of the two Milky Way backdrops — the face-on spiral disk in
`GalaxyPage.vue` and the new sky-band in `SurfaceViewPage.vue` — against the real astrophysics
literature that now drives them, and scopes a "what we can do next" pass. Both are hand-authored
procedural `CanvasTexture`s: no external image/data assets, real astrophysical parameters driving
generated geometry and color.*

---

## 0. Why this needed a rebuild

Before this pass, both backdrops were pure decoration: four spiral arms placed at exactly 90°
apart, one shared 12° pitch angle for all of them, a bar tilted 44° with no citation behind that
number, and — on the planet-surface view — no Milky Way band at all, just a uniform scatter of
generic background stars. None of it matched the real galaxy, and the surface view was missing
the single most recognizable feature of a real night sky from inside the disk.

## 1. What shipped — `GalaxyPage.vue`'s face-on disk

**Real per-arm data** (`MILKY_WAY_ARMS`, `GalaxyPage.vue:873-882`), sourced from Reid et al. 2019
(ApJ 885:131 — VLBI trigonometric parallaxes of ~200 masers, the field's standard modern
reference) — replacing the old 4-arms-at-90° model with 7 real arms including the two that were
simply missing before (the 3-kpc arm and the Local Arm/Orion Spur, where the Sun actually sits):

| Arm | Pitch angle(s) | Ref. radius | Azimuth range |
|---|---|---|---|
| 3-kpc (near) | −4.2° | 3.52 kpc | 15°→18° |
| Norma–Outer | −1.0° / 19.5° | 4.46 kpc | 5°→54° |
| Scutum–Centaurus | 14.1° / 12.1° | 4.91 kpc | 0°→104° |
| Sagittarius–Carina | 17.1° / 1.0° | 6.04 kpc | 2°→97° |
| Local (Orion Spur) | 11.4° | 8.26 kpc | −8°→34° |
| Perseus | 10.3° / 8.7° | 8.87 kpc | −23°→115° |
| Outer | 3.0° / 9.4° | 12.24 kpc | −16°→71° |

Several arms have a measurable "kink" — pitch angle changes partway along their length — kept as
a two-segment piecewise logarithmic spiral (`armRadiusAtAz()`, `:891-899`) rather than flattened
to one pitch, since matching the real kinked shape was the actual point of using real data.

**Bar angle** corrected 44° → 27° (`BAR_ANGLE_DEG`, `:860`), from Wegg & Gerhard 2013 (MNRAS
450:4050, VVV red-clump 3D density mapping) — the field's standard modern bar-geometry reference.

**Structural fix — the disk is no longer centred on the Sun.** Before this pass, the disk mesh had
no position offset at all: it defaulted to scene origin, the same point every real star and the
existing Sgr A* marker (`buildGalacticCenterMarker()`) are anchored to via `raDecToVec3()`. That
meant the decorative bulge/nucleus was drawn sitting on top of the observer's own position instead
of ~8.15 kpc away. `buildGalacticBackground()` (`:1019-`) now computes the real direction to Sgr A*
(`raDecToVec3(266.4168, -29.0078, 1)` — the same RA/Dec the existing marker already uses),
un-rotates it into the disk's local pre-rotation frame to find the true "azimuth 0" direction (Reid
et al.'s convention: 0° is the Sun's direction from the Galactic Centre), and offsets the whole
disk so the Sun lands exactly at scene origin while the bulge sits in the real direction of Sgr A*.

**Color model corrected from per-arm identity to population physics.** The old model gave each of
the 4 arms its own invented hue (blue/amber/pink/teal — "which arm is this," not astrophysics).
Real arms are distinguished by young blue O/B stars and pink HII emission knots on *every* arm's
ridgeline, not by arm identity (`YOUNG_ARM_RGB`/`HII_RGB`, `:882-885`). Dust lanes moved from
floating interarm positions to each arm's real inner (Galactic-Centre-facing) edge — implemented
as a same-azimuth, slightly-smaller-radius offset, which is sign-independent and therefore correct
regardless of a given arm segment's pitch sign.

**Added**: a small "Sun" marker glyph on the texture (there wasn't one before) at the real Sun
position — 8.15 kpc, azimuth 0 in this convention.

## 2. What shipped — `SurfaceViewPage.vue`'s sky band

Standing on a planet inside the disk, the Milky Way isn't scattered stars — it's a glowing band
running the *entire* way around the sky along the galactic plane's great circle, brightest toward
the Galactic Centre, split by a dark dust lane. `addStarField()`'s existing two layers (uniform
background + real parallax-placed catalog stars) had none of this.

`addGalacticBand()` (`:1675-`) adds a third layer: an equirectangular `CanvasTexture`
(`makeGalacticBandTexture()`, `:1619-1672`) wrapped on a large `BackSide` sphere (radius 880, just
inside the existing star field's radius-900 shell), oriented with the same real IAU North Galactic
Pole RA/Dec used in `GalaxyPage.vue`'s disk. `THREE.SphereGeometry`'s default equirectangular UVs
use local +Y as the pole, so the alignment quaternion rotates local +Y to the true galactic normal
— the texture's equator (the bright band) then lands exactly on the real galactic plane's great
circle regardless of which system's surface the observer is standing on.

Brightness is not uniform around the ring: a sharp peak toward the real Sgr A* direction (found the
same way as `GalaxyPage.vue`'s Sun-offset — un-rotating the real RA/Dec into the sphere's local
frame), a gentler bulge the rest of the way round, and a narrower dark "Great Rift"-style dust lane
riding down the centre of the bright band, strongest near the Galactic Centre where the line of
sight crosses the most disk. Verified visually on two different systems (TRAPPIST-1 e, GJ 411 b) —
the band wraps continuously as a real great circle and each system shows a different real sky
orientation, as expected.

## 3. Known simplifications, stated plainly

- **Observer position is treated as fixed at the Sun's real galactic coordinates for every
  system.** The band/disk geometry doesn't shift for a settlement orbiting a star tens or hundreds
  of parsecs from the Sun — astronomically, the galactic plane's *orientation* barely changes over
  those distances relative to the ~8 kpc scale of the galaxy, so this is a defensible
  simplification, not an error, but it's worth stating rather than leaving implicit.
- **The dust rift and arm-edge dust lanes are hand-tuned Gaussians/offsets, not driven by a real
  extinction map.** They're shaped to match the real *qualitative* appearance (Great Rift near the
  Galactic Centre, dust on each arm's concave edge) but aren't sampled from actual measured
  extinction data. See §4.
- **Kink azimuths for the two-segment arms are approximated as each arm's azimuth-range
  midpoint** — the research summary this was built from gave pitch angles and radii precisely but
  not the exact kink azimuth for each arm; a closer read of Reid et al. 2019's full per-source
  table could tighten this.
- **HII knots and star-dust are seeded procedurally (PRNG), not placed at real catalogued
  star-forming region positions.**

## 4. What we can do next

*(Research findings — datasets and rendering techniques evaluated for fit with this codebase's
existing Quasar + Three.js stack, which today uses only `CanvasTexture`-based procedural textures,
`THREE.Points` for star fields, and `MeshBasicMaterial` + `AdditiveBlending` — no custom GLSL
shaders anywhere yet.)*

### 4.1 Real datasets

**3D dust extinction — Green et al. "Bayestar" map.** Built on Gaia + Pan-STARRS1 + 2MASS
photometry of ~800M stars, HEALPix-indexed, queryable via the `dustmaps` Python package or a live
web API (`argonaut.skymaps.info/api/v2/bayestar2015`). Could replace the sky-band's hand-tuned
Gaussian rift with a real line-of-sight extinction profile, and drive real dust-lane density in the
face-on disk instead of the current fixed inner-edge offset. Fit: a build-time fetch-and-bake step
(sample the grid, paint the result into the existing `CanvasTexture` pipeline) — not a live
per-request API call, which isn't warranted for a static decorative layer.
([docs](https://dustmaps.readthedocs.io/en/latest/maps.html))

**All-sky photographic panorama — ESO GigaGalaxy Zoom (Serge Brunier / S. Guisard).** Real
photographic data of the actual sky, available up to 18MP publication TIFF (the full 800MP original
requires requesting directly from Brunier — not casually usable). ESO's general image library is
**CC BY 4.0**, attribution-only. A downsampled version is a legitimate option as a real-photo layer
blended with or under the procedural band, rather than a full replacement — resolution/file-size
still needs vetting before committing. ([panorama](https://www.eso.org/public/images/eso0932a/) ·
[ESO copyright](https://www.eso.org/public/copyright/))

**HII regions — Anderson et al. 2014 WISE catalog.** ~8,000 real Galactic HII regions (mid-IR
detections, ~1,500 spectroscopically confirmed) that could replace the disk's procedurally-scattered
pink knots with real, named, correctly-positioned star-forming regions.
([arXiv:1312.6202](https://arxiv.org/abs/1312.6202))

**Post-2019 arm refinement — Shen, Hou, Liu & Gao 2025.** Reconciles young- vs. evolved-star spiral
tracers using 572 HII regions with Gaia DR3 parallaxes. Notably: gives the Local Arm a pitch angle of
**25.2° ± 2.0°**, versus the 11.4° currently coded from Reid et al. 2019 — a concrete, citable
candidate for a future accuracy pass on §1's arm table, not just "newer data exists."
([arXiv:2503.01551](https://arxiv.org/abs/2503.01551))

### 4.2 Rendering technique fit

**Large star fields — stay on `THREE.Points`, don't switch to `InstancedMesh`.** A real case study
rendering 24,026 star systems (EVE Frontier's map) confirms `Points` is correct for screen-facing
dots with no real geometry to instance; `InstancedMesh` targets repeated *geometry* with individual
transforms and can be slower in practice for this use case. Their actual bottleneck was
fill-rate/overdraw from redundant glow layers (0.7–1.9ms/frame on an RTX 4070S), not draw calls —
validates this codebase's existing approach rather than suggesting a rewrite. A contained next step,
if per-star visual quality becomes worth the cost: `PointsMaterial.onBeforeCompile` to draw analytic
star discs in the fragment shader — a small shader hook, not a full custom `ShaderMaterial` rewrite,
appropriate for a codebase with zero existing shaders today.
([writeup](https://ef-map.com/blog/threejs-rendering-3d-starfield))

**Procedural nebula/dust, if the hand-tuned Gaussians are ever worth upgrading in place (rather than
replaced by real extinction data per §4.1).** Established pattern: Worley/Perlin noise driving either
camera-facing billboard sprites (`SpriteMaterial`, cheap, no raymarching) or full volumetric
raymarching in a fragment shader. For a normal Vue SPA rather than a dedicated WebGL project,
billboard sprites are the realistic middle ground — raymarched volumetrics are a real technique but a
much bigger complexity jump than this codebase's current all-`CanvasTexture` approach.
([Codrops writeup](https://tympanus.net/codrops/2020/01/28/how-to-create-procedural-clouds-using-three-js-sprites/))

**If a real photo panorama (§4.1) is adopted: KTX2/Basis Universal compression.** Standard practice
for shipping a large equirectangular texture without a huge download, via three.js's `KTX2Loader`
(WASM transcoder). Only relevant if the ESO panorama option is pursued at a resolution beyond a plain
JPEG. ([docs](https://threejs.org/docs/pages/KTX2Loader.html))

**Data-grid-to-canvas**: no dominant named pattern beyond what this codebase already does
(`CanvasTexture` painted from computed values) — sampling a downloaded extinction grid into per-pixel
canvas brightness at build/fetch time is a straightforward extension of the existing technique, not a
new architecture to learn.

### 4.3 Suggested next pass, if picked up

In priority order, cheapest/most-aligned-with-current-code first: (1) Shen et al. 2025's Local Arm
pitch angle, a one-line data change; (2) real HII region positions from the WISE catalog, replacing
the PRNG knot scatter; (3) Bayestar-derived dust density, replacing the hand-tuned rift/edge
Gaussians; (4) the ESO panorama as an optional real-photo layer, gated on resolving its licensing and
file-size questions first.

## 5. Related documents

- `SPEC_GAIA_DR3_ADOPTION.md` — a parallel, independent upgrade path for the *nearby-star*
  parallax-sky pipeline (≤500 pc precision), not the galaxy-scale structure this spec covers. The
  two don't overlap: that spec is about individual star positions close to the observer; this one
  is about the galaxy's large-scale shape.
- `blog-milky-way-rebuild.md` — the public write-up of this same work.
