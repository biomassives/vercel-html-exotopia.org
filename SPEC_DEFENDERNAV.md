# SPEC_DEFENDERNAV.md — Defender Navigator
### Exotopia · Cosmic Scene Navigation Strip
*SCD Hub · exotopia.org · living document — May 2026*

---

## 0. Reference & Philosophy

The **Defender Navigator** (DefenderNav) is a persistent horizontal minimap strip inspired
by the 1981 Williams Electronics arcade game *Defender*, in which a narrow strip across the
top of the screen showed the full 360° planet landscape — enemies, humanoids, terrain — at
all times, even when the player's viewport was zoomed in on one small region.

In Exotopia the strip serves the same spatial-clarity role: **you are always inside a scene
that is larger than your viewport.** Whether you're standing on an exoplanet surface
(surrounded by 360° of alien sky), orbiting inside a star system (surrounded by 3D orbital
space), or navigating the cosmic web — the DefenderNav shows you the whole world you are
inside, with your camera position marked, and lets you jump anywhere in it.

The additional innovation: **the strip is also a portal interface.** Clicking an object that
requires a scene change does not just pan the camera — it triggers the E8 wormhole transit
animation, so every navigation gesture that crosses a scene boundary feels like genuine
spacetime transit.

---

## 1. Visual Anatomy

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ◈ SYSTEM  ·  Kepler-442  ·⟡ AB  P=41d      [───────────────────────────]  2.4×  ⊟      │
│                                                                                           │
│  ★★  ░UNSTABLE░   ·b  ▲L4b  ▽L5b  ⬠art   ·c    ⬠meet[3]  ▽L5c  ⬡(surface)  ○(moon)  │
│       ─ ─ ─ ─ ─ ─ ─ ─ ─ ─────────────────────────────────────── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│   [binary pair]  [forbidden zone] [orbit 1] [gallery orbit] [orbit 2]  [orbit 3]        │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Strip dimensions

| Property | Value |
|---|---|
| Width | 100% of page width |
| Height | 80 px (desktop) · 64 px (mobile ≤ 480 px) |
| Position | Fixed, bottom of viewport, above bottom controls bar |
| Z-index | 8 (above Three.js canvas, below WormholePortal overlay 9900) |
| Background | `#010810` with subtle horizontal scan-line texture (CSS repeating-gradient, 2px period, opacity 0.07) |
| Border-top | 1 px solid `rgba(0, 180, 220, 0.18)` |

### 1.2 Header bar (12 px tall, above canvas area)

Left side — breadcrumb showing current scene level:

```
◈ COSMIC  ·  Coma Supercluster          ◈ GALAXY  ·  Stellar Neighborhood
◈ SYSTEM  ·  Kepler-442                 ◈ SURFACE ·  Kepler-442b
```

Right side — strip controls:

```
[─────────────] zoom slider    2.4×    ⊟  collapse/expand toggle
```

The collapse toggle shrinks the strip to a 20 px bar (header only). Clicking the header bar
when collapsed re-expands to full height. State persists per session in `localStorage`.

### 1.3 Canvas area (remaining height below header bar)

This is a `<canvas>` element drawn every frame by the parent page's Three.js tick loop via
`defenderNavRef.value?.redraw(data)`. It renders the spatial overview in one of three modes.

### 1.4 Scale indicator

Right side of canvas, vertical: a faint ruler with 2–4 labelled tick marks indicating the
spatial scale of the current strip viewport. Updates when the user zooms the strip.

### 1.5 Angle ruler

Top edge of canvas, horizontal: a faint ruler over the strip's angular X-axis (orbital
angle in `system` mode, azimuth in `surface` mode — both share the same 0°→360° wrapping
mapping, see §2.1). Major ticks land on multiples of 90° and are always labelled ("0°",
"90°", "180°", "270°"); as the user zooms in and the visible range narrows, unlabelled minor
ticks at 45°/30°/15° fill in between so the ruler keeps a roughly constant on-screen tick
density rather than the labelled ticks alone going sparse. Degrees only — no radian labels.

### 1.6 No individual user tracking

This is a deliberate constraint on the component, not an oversight: **DefenderNav never
renders another user's live position, trajectory, or session presence as an
individually-identifiable marker.** The only "self" marker on the strip is the local
camera cursor (§2.1, "YOU" — your own camera, never anyone else's). The only presence
signal for other users anywhere in the component is the gallery `presenceCount` badge
(§2.1) — an integer headcount, not a list of identities or positions.

Any future "traveller" feature that lets users find or coordinate with specific other
users must live outside DefenderNav's map surface, must be opt-in and mutual-consent
based (never passive or default-on), and should prefer routing to an external service the
user already trusts (Discord, Signal, etc.) over building location/presence infrastructure
in-house. See `RISK_REDUCTION_RECOMMENDATIONS.md` §4 and `legal-community-guidelines.md`
§3 for the platform-wide reasoning this follows.

### 1.7 Galactic-anchored compass (system mode only)

In `system` mode, the angle ruler's 0° is **not** an arbitrary orbital-plane origin — it's
re-anchored each time the strip loads to the current star system's real galactic longitude
(`galacticLongitudeDeg()` in `DefenderNav.vue`, a standard J2000 equatorial→galactic
conversion off the system's real RA/Dec, already available as `currentSystemRef`). The 0°
tick is labelled `0°GC` and reads as "toward the galactic center" from that system's real
sky position.

**What this is, and isn't, claiming.** The RA/Dec → galactic-longitude conversion is exact,
real astronomy. What it is *not* is a claim that a generated system's orbital plane is
physically tilted to point that way in 3D — that orientation isn't modeled anywhere in this
app (orbital planes are a 2D top-down abstraction, per §2.1 below). So `0°GC` means "this
strip's zero point is calibrated to this system's real sky position," not "planet X's orbit
is physically aligned toward Sagittarius." Don't let this get flattened into the stronger
claim in UI copy or marketing — the honest version is already useful (every system gets a
distinct, real, non-arbitrary zero point instead of always starting at a meaningless 0), and
doesn't need embellishing into something the underlying data can't support.

Implementation-wise, the offset is applied once, inside `angleToX()` — every planet, gallery,
and the camera cursor is positioned from its raw scene angle exactly as before; only the
final screen-X conversion shifts by the offset. The tick ruler itself does the reverse
conversion (compass angle → raw angle) so tick positions and labels stay fixed and correct
while the scene content shifts to align with them. `surface` mode is untouched — its azimuth
is already a real local compass and doesn't need re-anchoring; `cosmic` mode has no single
system to anchor to, so the offset is always 0 there.

---

## 2. The Three Scene Modes

### 2.1 `system` mode — GalaxyPage (system view)

**What the strip shows:** A 2D top-down projection of the orbital plane, stretched to fill
the full strip width.

**Coordinate mapping:**
- X-axis (strip width): orbital angle 0°→360°, wrapping. Strip width = 360° of the orbital
  plane. At zoom 1×, the full orbit circle is visible. At zoom 4×, only a 90° arc fills the
  strip, and the user scrolls left/right.
- Y-axis (strip height): radial distance from host star, log-scaled. Star sits at strip
  centre-bottom. Outer orbits sit near strip top.

**Objects rendered:**

| Object | Visual | Colour | Label |
|---|---|---|---|
| Host star (single) | Radial gradient glow, 8px radius | Spectral from `st_teff` | Hostname |
| Tight binary pair | Two overlapping glows co-rotating; combined 10px glow envelope | Each star's spectral colour | "[host] AB · _n_ d" (period) |
| Wide circumstellar companion | Smaller glow, 6px, at companion orbital radius | Companion spectral colour | "[host] B" |
| Trinary outer companion | Smallest glow, 4px, at very wide radius | Companion spectral | "[host] C" |
| Forbidden zone (circumbinary) | Hatched horizontal band from Y=bottom to Y=forbiddenR | `rgba(180, 60, 30, 0.12)` diagonal hatch | "UNSTABLE" at zoom ≥ 2× |
| Planet — circumstellar (S-type) | Filled circle 3–5px + glow ring | `planetHex(eqt, au)` | Planet name |
| Planet — circumbinary (P-type) | Filled circle 3–5px + outer ring + small AB marker | `planetHex(eqt, au)` with amber tint | "[name] ·⟡" at zoom ≥ 2× |
| L4 marker | Upward triangle ▲ 6px | `rgba(60, 220, 100, 0.75)` | "L4" at zoom ≥ 3× |
| L5 marker | Downward triangle ▽ 6px | `rgba(255, 180, 30, 0.75)` | "L5" at zoom ≥ 2× |
| Moon orbit arc | Dashed arc around planet dot | `rgba(160, 180, 200, 0.4)` | "Moon I/II…" at zoom ≥ 4× |
| Settlement dome | Hexagon outline ⬡ 7px | `rgba(0, 200, 220, 0.9)` | "Settlement" at zoom ≥ 2× |
| Gallery — art | Rotating diamond ⬠ 7px + slow outer ring spin | `rgba(200, 120, 255, 0.9)` violet | Gallery name at zoom ≥ 2× |
| Gallery — community hall | Rotating diamond ⬠ 7px + outer ring | `rgba(255, 200, 60, 0.9)` gold | Gallery name at zoom ≥ 2× |
| Gallery — research station | Rotating diamond ⬠ 7px + pulse | `rgba(60, 220, 180, 0.9)` teal | Gallery name at zoom ≥ 2× |
| Gallery — DJ stage | Rotating diamond ⬠ 7px + rhythm pulse | `rgba(255, 60, 180, 0.9)` hot-pink | Gallery name at zoom ≥ 2× |
| Gallery — info hub | Rotating diamond ⬠ 7px static | `rgba(140, 200, 255, 0.9)` sky-blue | Gallery name at zoom ≥ 2× |
| Gallery — LIVE meeting | As above + fast outer ring pulse + presence badge `[n]` | Type colour at 1.0 opacity | "[name] · LIVE" always |
| Gallery — locked | Diamond outline only (no core), ✖ badge | Type colour at 0.35 opacity | "[name] · LOCKED" |
| Gallery — NFT exclusive | Diamond outline + ⚿ key badge | Type colour at 0.55 opacity | "[name] · NFT" at zoom ≥ 2× |
| Camera position cursor | Blinking ▽ 9px white + cyan glow | `#00e5ff` | "YOU" in tiny text |

**Camera cursor position:**
The cursor X = the 3D camera's azimuthal angle around the **system barycentre** (computed
from `camera.position` projected onto the orbital XZ plane → `atan2(x - baryX, z - baryZ)`
→ mapped to strip X). For single-star systems barycentre = star position. For multi-star
systems barycentre is computed from `stellarConfig` mass ratios (see §2.4). The cursor Y =
3D camera radial distance from barycentre (log-scaled). Blinks at 1.4 Hz.

**Orbit rings:** Each planet gets a thin dashed horizontal line across the full strip width
at its Y-position (its orbital radius, measured from the system barycentre). The dashes are
`rgba(40, 80, 120, 0.35)`. The current selection's ring is solid `rgba(0, 180, 220, 0.55)`.
Circumbinary planet rings use `rgba(255, 160, 30, 0.45)` (amber) to distinguish P-type
orbits visually from S-type.

**Strip pan:** When zoom > 1×, the strip shows a sub-arc of the full 360°. The visible
window tracks the camera cursor by default (auto-follow), keeping the cursor in the centre
third of the strip. The user can grab and drag the strip horizontally to override auto-follow
for 3 seconds before it re-engages.

---

### 2.4 Multi-star system rendering

The strip handles four stellar configurations, classified by the `stellarConfig.type` field
passed in `systemData`. The classification is resolved in the parent page from NASA archive
fields and a known-circumbinary lookup table before `redraw()` is called.

#### Classification cascade

```
sy_snum === 1                     → 'single'
sy_snum === 2
  known circumbinary catalog hit  → 'circumbinary'
  innermost pl_orbsmax > threshold → 'circumbinary'  (heuristic)
  otherwise                       → 'circumstellar'
sy_snum === 3
  has circumbinary inner pair     → 'hierarchical_triple' (circumbinary inner)
  otherwise                       → 'hierarchical_triple' (circumstellar inner)
sy_snum >= 4                      → 'circumstellar' with annotation "N-star system"
```

**Circumbinary heuristic threshold:** If `sy_snum === 2` and the innermost planet's
`pl_orbsmax` exceeds `4 × estimatedBinarySeparation`, classify as circumbinary. When binary
separation is unknown, a default of 0.2 AU is assumed (typical short-period binary). This
catches e.g. Kepler-16 (innermost planet at 0.7 AU), Kepler-34 (1.09 AU), Kepler-47c (0.99 AU).

**Known circumbinary lookup:** A small compile-time `Set<string>` of confirmed circumbinary
hostnames from the NASA confirmed planets list (Kepler-16, Kepler-34, Kepler-35, Kepler-38,
Kepler-47, Kepler-64, Kepler-413, Kepler-453, Kepler-1647, TOI-1338, etc.). Takes precedence
over the heuristic.

---

#### Case A — `'circumstellar'` (S-type): wide companion, planets orbit primary

```
Y (distance from barycentre, log-scaled)
│
│  ···················  companion orbital radius (maybe off-strip at zoom 1×)
│
│  ─ ─ ─ ─ ─ ─ ─ ─ ─  planet c orbit ring
│  ─ ─ ─ ─ ─ ─ ─ ─ ─  planet b orbit ring
│
●  ★  primary star glow               ✦  companion glow (at companion angle)
└──────────────────────────────────────────────────────── X (orbital angle 0→360°)
```

- Primary star drawn at strip centre-bottom.
- Companion drawn at its current orbital angle X and its orbital radius Y.
- Companion orbits the barycentre slowly — period typically years to millennia, so drift
  is imperceptible within a single session unless the orbit period is < ~1 year.
- Planets orbit the primary; their orbit rings measured from primary, not barycentre (since
  companion is far). L4/L5 marked relative to primary as normal.
- Companion is a valid click target: fly-to brings the 3D camera toward the companion's
  position in the scene. No settlement possible at companion (no planets).

---

#### Case B — `'circumbinary'` (P-type): tight pair, planets orbit both

```
Y (distance from barycentre, log-scaled)
│
│  ─ ─ ─ ─ ─ ─ ─ ─ ─  planet b orbit ring (circumbinary, amber)
│  ░░░░░░░░░░░░░░░░░░  forbidden zone band (hatched, red-amber)
│
●  ★★ co-rotating pair                               ★★ (wrapped)
└──────────────────────────────────────────────────────── X (orbital angle 0→360°)
```

**Co-rotating pair rendering:**
Both stars drawn near the centre-bottom, offset from barycentre by `massRatio`:

```
primaryX   = barycentreX - sin(binaryAngle) * r_primary_from_bary * stripScale
companionX = barycentreX + sin(binaryAngle) * r_companion_from_bary * stripScale
```

where `r_primary_from_bary = separation × massRatio / (1 + massRatio)` and
`r_companion_from_bary = separation × 1 / (1 + massRatio)`.

The two star dots rotate around the central barycentre X at their binary orbital period.
At default zoom 1×, the separation may be sub-pixel — the two dots appear merged into one
double-core glow. At zoom ≥ 4×, they become visibly distinct and the rotation is clear.

**Period label:** The header bar appends `·⟡ AB  P = _n_ d` next to the system name when
a circumbinary system is active, e.g. `◈ SYSTEM  ·  Kepler-16  ·⟡ AB  P = 41 d`.

**Forbidden zone:** A hatched horizontal band (diagonal lines at 45°, 3px spacing,
`rgba(180, 60, 30, 0.12)`) fills from Y=0 (star layer) to Y = forbiddenZoneRadius on the
strip. No orbit rings exist inside this band. At zoom ≥ 2×, the top edge of the band carries
the label "UNSTABLE ZONE · < _n_ AU".

**Circumbinary planet orbit rings:** Drawn in amber `rgba(255, 160, 30, 0.45)` to distinguish
from circumstellar rings. Each planet dot carries a tiny ⟡ badge at zoom ≥ 2× indicating
it orbits both stars.

**L4/L5 for circumbinary planets:** L4/L5 Lagrange points exist relative to each
circumbinary planet and the **combined stellar mass** acting as the "primary body". The
triangle markers are drawn at ±60° from each circumbinary planet dot, same visual treatment
as circumstellar L4/L5. The tooltip notes "circumbinary L5 — orbital zone around Kepler-16b".

---

#### Case C — `'hierarchical_triple'`: inner tight pair + distant outer companion

The strip combines Cases A and B:
- Inner pair rendered exactly as Case B (co-rotating tight glow, forbidden zone).
- Outer companion rendered as Case A companion: single glow at very wide orbital radius.
- At zoom 1×, outer companion may be at the far edge of the strip or beyond it (label still
  appears at the strip edge as a clipped arrow `► [host] C  _n_ AU`).
- Planets may be:
  - Circumbinary around the inner pair (drawn as Case B planets).
  - Circumstellar around one inner star (rare and dynamically unstable; drawn in
    `rgba(220, 100, 50, 0.7)` red-orange to flag marginal stability).

**Trinary breadcrumb header:** `◈ SYSTEM  ·  [host]  ·⟡ AB+C  3-star`.

---

#### Case D — `'contact'` (touching/merging binary)

Contact binaries have an orbital period of < 1 day and stars that share their outer
envelope. Exoplanets in contact binary systems are rare but confirmed.

- The two stars are drawn as a single elongated glow (two overlapping radial gradients,
  no gap between centres) at the strip centre-bottom.
- The combined object pulses gently (opacity ±0.15 at ~0.5 Hz) reflecting the photometric
  variability typical of W UMa / EW-type contact binaries.
- Label: `"[host] (contact)"`.
- Planets orbit the combined mass as if a single body; orbit rings and L4/L5 drawn normally.
- Forbidden zone: not drawn (contact binaries have a very short separation — the entire
  system well fits inside a single pixel at zoom 1×).

---

#### Y-axis barycentre reference for all multi-star cases

The strip Y-axis always measures distance from the **system barycentre**, not from the
primary star. This keeps planet orbit rings in their physically correct position relative
to what both stars are orbiting.

For Cases A and C (wide companion), the barycentre is very close to the primary (since
the companion is far away and typically less massive). The barycentre offset = companion
separation × companionMass / (primaryMass + companionMass). For most systems this is
< 5 AU, which at the strip's log-scale is indistinguishable from the primary position —
no visible distortion.

For Case B (tight pair), the barycentre offset is significant and visually important —
this is what creates the apparent back-and-forth swaying of the two stars in the strip.

---

### 2.2 `surface` mode — SurfaceViewPage

**What the strip shows:** The full 360° sky horizon, compressed into the strip width.
This is exactly the Defender model — the planet surface extends in all directions, and the
strip shows the whole visible sky at once.

**Coordinate mapping:**
- X-axis: azimuth 0°→360°, wrapping. 0° = North (right-side-up geographic convention).
  At zoom 1×, the full 360° sky is visible compressed.
- Y-axis: altitude (–10° to +90°). Strip centre = horizon (0°). Strip top = zenith (90°).
  Objects below –10° are invisible (below terrain line).

**Terrain line:** A faint horizontal jagged line at altitude 0° using terrain
heightmap data, giving the strip a silhouette look — the signature Defender aesthetic.
Drawn as a small-amplitude noise wave in `rgba(60, 100, 60, 0.5)`.

**Objects rendered:**

| Object | Visual | Colour | Label |
|---|---|---|---|
| Host star (single or contact) | Radial gradient glow 10px | `starColorFromTeff(teff)` | Hostname + phase |
| Tight binary pair (circumbinary host) | Two overlapping glows 8px each, angular separation tracks binary phase; combined envelope 12px | Each star's spectral colour | "[host] A · [host] B" stacked |
| Wide circumstellar companion | Glow 5px, independent azimuth/alt arc | Companion spectral colour | "[host] B · comp." |
| Trinary outer companion | Glow 4px, very slow arc | Coolest spectral | "[host] C" |
| Exomoon I/II/III | Circle 4px + glow | Moon palette colour | "Moon I" etc. |
| Sibling planet | Circle 3px | `planetHex(eqt, au)` | Planet name |
| Settlement dome | Hexagon ⬡ 6px (at azimuth 0°, alt 0°) | `rgba(0, 200, 220, 0.9)` | "HOME" |
| Pyramid / L5 conduit | Small ▲ 5px amber | `rgba(255, 200, 40, 0.9)` | "TRANSIT" |
| Orbital gallery (any type) | Tiny spinning diamond ⬠ 5px at current sky azimuth + altitude | Type colour at 0.65 opacity | Gallery name at zoom ≥ 3× |
| Orbital gallery — LIVE | As above + outer ring pulse | Type colour at 0.9 opacity | "[name] · LIVE [n]" always |
| Camera look-direction | Vertical cursor line, full strip height | `rgba(255, 255, 255, 0.6)` | Blinking |

**Multi-star sky behaviour in surface mode:**

*Tight binary (circumbinary surface):*  
Both stars rise and set together — their combined barycentre traces a single arc across the
sky. The strip shows two dots displaced by a small angular offset (< 1° at typical
circumbinary planet distances) that slowly revolves at the binary orbital period. At zoom 1×
the two dots are likely merged; at zoom ≥ 4× the rotation of the pair becomes a visible
oscillation. The terrain silhouette may show a subtle double-shadow transition zone when
one star rises before the other.

*Wide binary (circumstellar surface):*  
The companion star traces its own independent arc at a different speed. Its azimuth/altitude
is computed from its full orbital position (period likely years → near-stationary in a single
session). It appears as a bright "star" that barely moves during play, analogous to a very
slow "super-sun" in the sky alongside the primary.

*Hierarchical triple:*  
Primary pair behaves as tight binary above. Outer companion behaves as wide binary companion
above. Three distinct arcs — or two merged + one independent — visible in the strip.

**Camera look-direction cursor:**
The camera's horizontal look angle (yaw) maps to strip X (azimuth). The cursor is a vertical
line spanning the full strip height, with a horizontal field-of-view bracket drawn at the
horizon altitude — showing the current camera FOV arc.

**Sky arc:** As time advances (or the slider moves), all sky objects glide smoothly left
across the strip, tracking their azimuth in real time.

**Auto-follow:** The strip X auto-scrolls to keep the camera look-direction cursor centred.
User drag overrides for 3 seconds.

---

### 2.3 `cosmic` mode — CosmicPage

**What the strip shows:** A 2D XZ-plane projection of the cosmic web (the same projection
used in the Three.js scene from above).

**Coordinate mapping:**
- X-axis: scene X position (Mpc scale), centred on Milky Way.
- Y-axis: scene Z position, centred on Milky Way. (Y-axis of Three.js scene = up, not shown.)

**Objects rendered:**

| Object | Visual | Colour | Label |
|---|---|---|---|
| Milky Way | Star glyph ✦ 8px | Amber `#ffd480` | "Milky Way" |
| Named galaxy cluster | Circle 3–5px (richness-scaled) | Cluster `color` | Name at zoom ≥ 3× |
| X-ray cluster | Dot 2px | `colorHex` from catalog | — |
| Wormhole conduit | Diamond ◆ 4px pulsing | Cyan `#00e5ff` | "Conduit" at zoom ≥ 2× |
| Active event cluster | Dot + beacon ring | Event type colour | Event title at zoom ≥ 2× |
| Cosmic void | Faint outline arc | `rgba(20, 40, 80, 0.5)` | Void name at zoom ≥ 2× |
| Camera position | `◇` 8px, blinking | White | "YOU" |

**Auto-follow:** Strip camera cursor follows the 3D camera XZ position, keeping it
centred in the visible window.

---

### 2.5 Orbital Gallery Stations

Gallery stations are permanent objects positioned in defined orbital zones around the host
star system — not on any planet surface, but floating in space at a specific orbital radius
and angle. They are a distinct level of the spatial hierarchy (between Level 3 star system
and Level 4 planet surface) and are the primary venue for virtual meetings, art exhibitions,
community events, and information sharing.

In the DefenderNav strip, galleries appear in all three modes:
- **System mode**: diamond markers ⬠ at their orbital radius and angle in the strip
- **Surface mode**: slow-drifting diamond dots in the sky strip at their current azimuth/altitude
- **Cosmic mode**: (future scope) cluster-level galleries not shown at this scale

---

#### Gallery types and ownership models

**Five gallery types**, each with a distinct purpose, visual colour, and default content policy:

| Type | Icon colour | Primary purpose | Default access |
|---|---|---|---|
| `art` | Violet `rgba(200, 120, 255, 0.9)` | Rotating $ART NFT exhibitions, visual portfolios, gallery events | Public browse, gated mint |
| `community` | Gold `rgba(255, 200, 60, 0.9)` | Group meetings, workshops, cultural ceremonies, assemblies | Member NFT |
| `research` | Teal `rgba(60, 220, 180, 0.9)` | Eco-ops field data dashboards, mentor networks, learning hubs | Open or team-gated |
| `stage` | Hot-pink `rgba(255, 60, 180, 0.9)` | Live DJ sets, $BARS music events, sound performances | Ticket NFT |
| `info` | Sky-blue `rgba(140, 200, 255, 0.9)` | Persistent knowledge base, project documentation, onboarding | Public |

**Three ownership/governance models:**

| Model | Who controls content & access | How earned/acquired |
|---|---|---|
| `solo` | One NFT deed holder — the gallery owner | Eco-ops milestone reward OR purchase on pon.ink marketplace |
| `cooperative` | 2–12 co-owners; majority vote via pon.ink DAO module | Multi-sig deed shared by a group (e.g. OT Kulcha collective) |
| `dao` | DAO governance token holders — threshold vote | Community-wide governance; funded by community pool or pon.ink revenue share |
| `public` | Curated by SCD Hub admin; no deed required | Permanent public infrastructure; anyone enters freely |

---

#### Orbital positioning

Galleries occupy one of three position types, encoded in `OrbitalGalleryEntry.orbitAnchor`:

**Free orbit** — gallery at a specified AU radius, independent of any planet.
```
orbitAnchor: { type: 'free', radiusAU: 1.8, initialAngleDeg: 45 }
```
Gallery orbits the star/barycentre at its radius. Orbital period derived from Kepler's third
law: `T_years = radiusAU^1.5`. In a session, angle advances:
`angleDeg += (360 / (T_years × 365)) × dtDays`

**Lagrange anchor** — gallery locked to a planet's L4 or L5 point.
```
orbitAnchor: { type: 'lagrange', planetName: 'Kepler-442b', point: 'L5' }
```
Gallery angle = `planet.orbAngle − 60°` (L5) or `planet.orbAngle + 60°` (L4). Gallery
inherits the planet's orbital radius. The gallery co-moves with the planet — in the strip
it sits at a fixed angular offset from the planet dot, making the Lagrange relationship
immediately visible. The ▽L5 triangle is drawn behind/below the gallery diamond.

**Binary orbit** — gallery orbiting the circumbinary barycentre in a system with a tight pair.
```
orbitAnchor: { type: 'circumbinary', radiusAU: 3.4 }
```
Only valid for `stellarConfig.type === 'circumbinary'`. Gallery orbit ring drawn in amber
(matching circumbinary planet rings). Particularly significant: a gallery at a circumbinary
L5 point orbits the *combined stellar mass*, making it genuinely exotic as a real estate type.

---

#### Meeting states and strip animation

| State | Strip visual | Tooltip |
|---|---|---|
| `idle` | Diamond at 0.4 opacity, no rotation | "Empty · [last active] ago" |
| `open` | Diamond at 0.75 opacity, slow rotation (1 rpm) | "Open · Enter freely / with access" |
| `live` | Diamond at 1.0 opacity, fast rotation (4 rpm), outer beacon ring pulse | "LIVE · [presenceCount] inside · [title]" |
| `locked` | Diamond outline only, ✖ badge, 0.35 opacity, no rotation | "Locked · Session in progress · [host]" |
| `exclusive` | Diamond outline + ⚿ badge, 0.55 opacity | "NFT Required · Acquire on pon.ink" |

**Presence count badge:** When `meetingState === 'live'` and `presenceCount > 0`, a small
number badge is drawn to the upper-right of the diamond: white circle 8px radius, count
in 7px monospace black. At zoom 1× the badge may overlap neighbouring objects — culled
if strip pixel width < 12 px per object.

**Scheduled event countdown:** When a gallery has a `scheduledEvent` with a future `startUtc`,
the strip shows a faint dashed orbit ring that slowly brightens as the event approaches —
reaching full opacity 15 minutes before start, then transitioning to `live` state on start.
The tooltip shows the countdown: `"Opens in 2h 14m · [event title]"`.

---

#### Access control and NFT gate

The current user's access level for each gallery is resolved by the parent page before
`redraw()` from the user's connected wallet NFT inventory (via pon.ink auth):

```
'owner'   → user holds the Gallery Deed NFT for this gallery
'member'  → user holds a Membership NFT for this gallery
'ticket'  → user holds a time-limited Event Ticket NFT
'public'  → gallery is open to all / user has no specific NFT but gallery is public
'none'    → user has no qualifying NFT; gallery is gated
```

**Gallery Deed NFT address format:**
```
exo-orbital-gallery-v1:[hostname]:[orbitAU_x100]:[slotIndex]
e.g. exo-orbital-gallery-v1:Kepler-16:180:0
```

**Click behaviour by access level:**

| User access | Gallery state | Strip click result |
|---|---|---|
| `owner` / `member` / `ticket` | any open state | Portal zoom-in → gallery interior `/gallery/:hostname/:galleryId` |
| `public` | `open` or `idle` | Portal zoom-in → gallery interior |
| `none` | `open` | Tooltip: "Access Required · Acquire on pon.ink" + [pon.ink link button] |
| any | `locked` | Tooltip: "Locked by [owner] · Session in progress" — no portal |
| `none` | `exclusive` | Tooltip: "NFT Required · [gallery name] · [pon.ink link]" |
| `owner` | `locked` | Tooltip: "[YOU locked this] · Click to unlock" → emits `unlockGallery` event |

The `unlockGallery` event is handled by the parent page which calls the pon.ink API to
update meeting state. No portal fires for a locked gallery.

---

#### Gallery breadcrumb and deep-link route

When the user enters a gallery via the DefenderNav, they navigate to:
```
/gallery/:hostname/:galleryId
```

The header breadcrumb updates to:
```
◈ GALLERY  ·  [gallery name]  ·  [hostname]
```

The DefenderNav strip in gallery mode shows a special `gallery` sub-mode: a 2D floor plan
of the gallery interior rendered in the strip. The Y-axis = depth into the gallery, X-axis
= lateral position. Camera cursor shows where the user is standing inside the gallery.
Artworks / information nodes appear as labeled dots. This is the **Level 3.5** view —
below the star system orbital strip (Level 3) and above the planet surface strip (Level 4).

The strip header breadcrumb stacks to:
```
◈ COSMIC › GALAXY › SYSTEM  ·  Kepler-16  › GALLERY  ·  [name]
```

Navigation back up the hierarchy via breadcrumb clicks (each fires a portal transit to the
parent level).

---

#### Gallery route in the DefenderNav emit system

```typescript
// gallery-specific flyTo target
interface DefenderTarget {
  type:   'planet' | 'lagrange' | 'moon' | 'star' | 'azimuth' | 'cluster' | 'gallery'
  id:     string
  // for gallery type:
  galleryId?:    string
  hostname?:     string
  accessLevel?:  'owner' | 'member' | 'ticket' | 'public' | 'none'
  meetingState?: GalleryMeetingState
}
```

Parent handles `gallery` targets in `onDefenderFlyTo`:
```typescript
if (target.type === 'gallery') {
  if (target.accessLevel === 'none') {
    // Show access-denied tooltip — no portal
    showAccessDenied(target)
    return
  }
  if (target.meetingState === 'locked' && target.accessLevel !== 'owner') {
    showLockedTooltip(target)
    return
  }
  // Valid access → portal
  portalStore.openPortal({
    label: target.id,
    route: `/gallery/${target.hostname}/${target.galleryId}`,
  })
}
```

### 3.1 Zoom

The strip has its own independent zoom factor, stored in component state.

| Control | Action |
|---|---|
| Mouse wheel over strip | Zoom in/out centred on cursor position |
| Pinch gesture (mobile) | Zoom in/out |
| Zoom slider (header) | Direct zoom control, range 0.5×–8× |
| Double-click on strip | Zoom in 2× centred on clicked point |
| Double-right-click | Zoom out 2× |

**Zoom range:** 0.5× (sees 2× the full world — duplicated wrap) to 8× (fine detail).

**Zoom animation:** Zoom level changes are smoothly animated over 0.25 s using a
linear interpolation each frame (not GSAP — it runs in the canvas redraw, no DOM).

**Label density adapts to zoom:**
- Zoom < 1.5×: only major objects labelled (star, planets); LIVE galleries always labelled regardless
- Zoom 1.5–3×: L5 markers, settlement domes, moons, open/idle galleries labelled
- Zoom > 3×: all objects labelled, including individual L4/L5 zones, gallery type tags, scheduled event titles

### 3.2 Pan

At zoom ≤ 1×, panning is disabled (full world visible). At zoom > 1×:

- **Mouse drag on strip:** Pans the strip viewport left/right (or up/down in surface mode).
- **Auto-follow:** When the 3D camera moves, the strip viewport gently shifts to keep the
  camera cursor in the centre third of the visible window. 3 seconds after the user's last
  manual drag, auto-follow re-engages with a 0.6 s ease-in.
- **Wrap-around:** In `system` and `surface` modes the world wraps at 0°/360°. The strip
  draws objects twice (at X and X + stripWidth) near the wrap boundary so the seam is
  invisible.

---

## 4. Hover Interaction

When the mouse hovers over an object dot in the strip, a small tooltip appears above the
strip (not below, to avoid being hidden by the bottom controls):

```
┌───────────────────────┐
│  Kepler-442b           │
│  Exoplanet · 289 K     │
│  ▲ Click → fly to      │
│  ▲ Shift+click → portal│
└───────────────────────┘
```

The tooltip shows:
- Object name and type
- One key stat (temp / distance / spectral type)
- Click action description (fly-to vs portal transit)

Hovering also highlights the corresponding object in the main 3D scene (if it has a
`THREE.Mesh` hit target) by briefly scaling it up 1.3× for 0.5 s.

---

## 5. Click Interaction — Fly-to vs Portal Transit

### 5.1 Same-level fly-to (no portal)

Clicking an object **within the current scene and level** triggers the same GSAP fly-to
animation already used in each page. The 3D camera glides toward the target. No portal.

**Same-level targets by mode:**

| Mode | Target | Action |
|---|---|---|
| `system` | Planet dot | `focusPlanet()` — GSAP camera to planet |
| `system` | L4/L5 triangle | GSAP camera to Lagrange zone |
| `system` | Star glow | Camera return to system overview |
| `system` | Moon arc | GSAP camera zoom to moon |
| `surface` | Host star | Camera yaw to face star azimuth (GSAP target orbit) |
| `surface` | Moon dot | Camera yaw to face moon azimuth |
| `surface` | Sibling planet dot | Camera yaw toward planet |
| `cosmic` | Galaxy cluster | `enterCluster()` or `zoomToXrayCluster()` |
| `cosmic` | Wormhole conduit | Open conduit panel |

### 5.2 Cross-level portal transit

Clicking an object that **requires a scene change** triggers the E8 wormhole portal sequence
(`portalStore.openPortal()`). These always cross a scene boundary and use the full 7-second
transit animation.

**Cross-level targets:**

| Mode | Target | Portal destination |
|---|---|---|
| `system` | Settlement ⬡ on planet | `/surface/:hostname/:planetName` |
| `system` | Settlement ⬡ on L5 zone | `/surface/:hostname/:planetName?zone=L5` |
| `system` | Galaxy label (breadcrumb) | `/galaxy` (exit to galaxy map) |
| `surface` | Sibling planet dot (Shift+click) | `/surface/:hostname/:siblingName` |
| `surface` | System breadcrumb | `/galaxy?focusHost=:hostname` |
| `surface` | Pyramid / transit marker | Opens transit dialog (not full portal) |
| `cosmic` | Milky Way glyph | `/galaxy` |
| `cosmic` | Conduit + destination | `/surface/:hostname/:planetName` via transit |

**The modifier key rule:** Plain click = fly-to (same level). Shift+click = portal transit
(cross level). For cross-level objects (settlement dots, breadcrumbs, galleries) there is
no same-level equivalent, so plain click triggers the appropriate action.

### 5.3 Orbital gallery access and transit

Galleries are always cross-level (they are Level 3.5, distinct from the system orbital view
at Level 3 and the surface at Level 4). Plain click on a gallery dot resolves access before
any animation fires.

| Condition | Action |
|---|---|
| Access ✓, state `open` / `idle` / `live` | Portal zoom-in → `portalStore.openPortal()` → `/gallery/:hostname/:id` |
| Access ✓, state `live` (presenceCount > 0) | Same as above — user joins live session |
| Access ✗, state `open` | Tooltip: "Access Required · [gallery name]" + pon.ink acquire button |
| State `locked`, user not owner | Tooltip: "Session Locked by [owner]" — no portal |
| State `locked`, user is owner | Tooltip: "YOU locked this · Click to unlock" — emits `unlockGallery` |
| State `exclusive`, access ✗ | Tooltip: "NFT Required · Mint on pon.ink" + link |

**GSAP fly-to in 3D scene before portal:** When a gallery is clicked in the DefenderNav
strip and access is valid, the parent first fires a GSAP fly-to that moves the 3D camera
from its current position toward the gallery's 3D position in the orbital scene (0.8 s,
`power2.inOut`). The 3D camera motion plays in parallel with the strip's 0.28 s zoom-in
animation. The portal fires at `t = 0.38 s` when both animations have landed.

---

## 6. Portal Zoom-In Effect (Strip → Wormhole)

When a cross-level portal transit is triggered from the DefenderNav strip, there is a
**brief zoom-into-the-dot animation** before the full E8 portal overlay takes over. This
grounds the transition spatially — you are diving through the map into that location.

### 6.1 Sequence

```
t = 0.00 s  User clicks settlement ⬡ on Kepler-442b in strip
t = 0.00 s  Dot gains highlight ring (cyan glow, scale 1.5×)
t = 0.00 s  Strip zoom begins: 0.28 s ease-in-out zoom to 8× centered on dot
t = 0.20 s  Dot fills ~60 px of strip, label enlarges  
t = 0.28 s  Strip dims to black (0.1 s fade)
t = 0.38 s  `portalStore.openPortal()` called — E8 mandala begins
t = 7.38 s  Portal completes — Vue Router navigates to destination
```

### 6.2 Strip fade-to-black transition

During the 0.10 s fade, the strip canvas draws a black rectangle at increasing opacity over
the zoomed dot, creating the illusion that the camera is tunnelling into the point.

### 6.3 Cancel window

If the user clicks a second time during the 0.28 s zoom, the animation cancels and resets.
The portal does not trigger until the zoom animation completes.

---

## 7. Component Architecture

### 7.1 File: `src/components/DefenderNav.vue`

**Template:** A container div with:
- `.defender-header` — breadcrumb + zoom slider + collapse toggle
- `<canvas ref="navCanvas">` — the strip canvas
- `.defender-tooltip` — absolutely positioned tooltip (v-if)

**Props:**

```typescript
interface DefenderNavProps {
  mode:       'system' | 'surface' | 'cosmic'
  // Breadcrumb text for header
  sceneLabel: string          // e.g. "Kepler-442" or "Coma Supercluster"
}
```

**Emitted events:**

```typescript
interface DefenderNavEmits {
  // Same-level fly-to: parent executes GSAP
  flyTo: (target: DefenderTarget) => void
  // Cross-level portal: parent calls portalStore.openPortal()
  portalTo: (dest: PortalDestination) => void
}

interface DefenderTarget {
  type:    'planet' | 'lagrange' | 'moon' | 'star' | 'azimuth' | 'cluster' | 'gallery'
  id:      string          // planet name, cluster name, gallery name, etc.
  angle?:  number          // orbital angle (system mode)
  radius?: number          // orbital radius (system mode)
  azimuth?: number         // azimuth degrees (surface mode)
  // Gallery-specific fields (set when type === 'gallery')
  galleryId?:    string
  hostname?:     string
  accessLevel?:  GalleryAccessLevel
  meetingState?: GalleryMeetingState
}
```

**Exposed method (called from parent tick loop):**

```typescript
// DefenderNav.vue — defineExpose
function redraw(data: DefenderNavData): void
```

```typescript
interface DefenderNavData {
  // System mode
  systemData?: {
    starTeff:       number
    starPos:        { x: number; z: number }   // world coords of primary (or barycentre)
    planets:        PlanetStripEntry[]
    galleries:      OrbitalGalleryEntry[]      // orbital gallery stations
    cameraAngle:    number    // degrees 0–360 around barycentre
    cameraRadius:   number    // AU from barycentre
    stellarConfig:  StellarConfig
  }
  // Surface mode
  surfaceData?: {
    cameraAzimuth:   number    // degrees 0–360 camera look direction
    cameraFov:       number    // degrees, for FOV bracket
    skyObjects:      SkyObjectEntry[]          // includes gallery entries (type: 'gallery')
    galleries:       OrbitalGalleryEntry[]     // resolved for tooltip/access data on click
    localTimeDeg:    number    // current planet rotation angle
    terrainProfile?: number[]  // 64 altitude samples for terrain line
  }
  // Cosmic mode
  cosmicData?: {
    cameraX:   number    // scene X
    cameraZ:   number    // scene Z
    clusters:  CosmicStripEntry[]
    conduits:  ConduitStripEntry[]
  }
}
```

```typescript
// ── Stellar configuration (resolved before redraw, passed in systemData) ────────

type StellarConfigType =
  | 'single'              // one star
  | 'circumstellar'       // S-type: wide companion, planets orbit primary
  | 'circumbinary'        // P-type: tight pair, planets orbit both
  | 'hierarchical_triple' // tight inner pair + distant outer companion
  | 'contact'             // touching/merging pair (W UMa type)

interface StellarConfig {
  type: StellarConfigType

  // Tight pair — present for 'circumbinary', 'hierarchical_triple', 'contact'
  innerBinary?: {
    primaryTeff:          number          // primary star teff (= system st_teff)
    companionTeff:        number | null   // companion teff (estimated if missing)
    separation:           number          // AU — binary semi-major axis
    periodDays:           number          // binary orbital period
    angle:                number          // current orbital angle of pair (degrees, updates each frame)
    massRatio:            number          // m_companion / m_primary (0.1–1.0, estimated from teff)
    forbiddenZoneRadius:  number          // AU — approx 3.5–4 × separation (dynamical stability limit)
  }

  // Wide companion — present for 'circumstellar' and outer star in 'hierarchical_triple'
  companion?: {
    teff:           number | null   // companion teff (estimated if missing)
    orbitalRadius:  number          // AU from barycentre
    orbitalAngle:   number          // degrees (updates each frame, but period is usually years)
    massRatio:      number          // m_companion / m_primary
  }

  // Third (outer) star — only for 'hierarchical_triple'
  outerCompanion?: {
    teff:           number | null
    orbitalRadius:  number          // AU (very large — 10s to 1000s AU)
    orbitalAngle:   number          // near-static for most sessions
  }
}

// ── Per-planet strip entry ───────────────────────────────────────────────────

interface PlanetStripEntry {
  name:         string
  angle:        number              // current orbital angle (degrees, 0–360)
  radius:       number              // AU from barycentre
  eqt:          number | null
  hasMoon:      boolean
  hasSettlement: boolean
  l4angle:      number              // = angle + 60
  l5angle:      number              // = angle – 60
  orbitType:    'circumstellar' | 'circumbinary'  // S-type or P-type orbit
  isCurrent?:   boolean
}

interface SkyObjectEntry {
  name:     string
  type:     'star' | 'companion_tight' | 'companion_wide' | 'outer_companion'
          | 'moon' | 'planet' | 'settlement' | 'pyramid' | 'gallery'
  azimuth:  number    // 0–360
  altitude: number    // –90 to +90
  color:    string    // hex
  // For tight binary pair: both stars share nearly the same azimuth/altitude.
  // Pass two SkyObjectEntry items (type 'star' + 'companion_tight') so the renderer
  // draws them as an overlapping pair with a small angular separation that rotates.
  angularSeparation?: number    // degrees — only set on 'companion_tight' entries
  separationAngle?:   number    // current rotation of the pair axis (degrees)
  // For gallery type: link back to the OrbitalGalleryEntry for tooltip / click handling
  galleryId?:         string
}

// ── Orbital gallery stations ─────────────────────────────────────────────────

type GalleryType = 'art' | 'community' | 'research' | 'stage' | 'info'

type GalleryMeetingState = 'idle' | 'open' | 'live' | 'locked' | 'exclusive'

type GalleryAccessLevel = 'owner' | 'member' | 'ticket' | 'public' | 'none'

type GalleryOwnershipModel = 'solo' | 'cooperative' | 'dao' | 'public'

type GalleryOrbitAnchor =
  | { type: 'free';          radiusAU: number; initialAngleDeg: number }
  | { type: 'lagrange';      planetName: string; point: 'L4' | 'L5' }
  | { type: 'circumbinary';  radiusAU: number }

interface OrbitalGalleryEntry {
  id:              string               // unique gallery id, matches pon.ink NFT address
  name:            string               // display name
  galleryType:     GalleryType
  ownershipModel:  GalleryOwnershipModel
  orbitAnchor:     GalleryOrbitAnchor
  // Resolved each frame by parent (angle tracks planet for lagrange, advances for free/circumbinary)
  currentAngleDeg: number              // degrees 0–360 in orbital plane
  radiusAU:        number              // current effective radius (same as anchor or planet radius)
  // Meeting / access state (resolved from pon.ink auth before redraw)
  meetingState:    GalleryMeetingState
  accessLevel:     GalleryAccessLevel  // current user's access to this gallery
  presenceCount:   number              // users currently inside (0 if idle)
  ponInkUrl?:      string              // pon.ink page for acquiring access
  scheduledEvent?: {
    title:       string
    startUtc:    string                // ISO timestamp
    durationMin: number
    msUntilStart: number               // computed fresh each redraw call
  }
  // Sky coordinates (surface mode — computed from orbital position + planet rotation)
  skyAzimuth?:     number              // degrees 0–360 (set when used in surfaceData.skyObjects)
  skyAltitude?:    number              // degrees –90 to +90
}

interface CosmicStripEntry {
  name:      string
  x:         number   // scene X
  z:         number   // scene Z
  richness:  number   // 0–10
  color:     string
  hasEvent:  boolean
}

interface ConduitStripEntry {
  name:   string
  x:      number
  z:      number
  isPulsing: boolean
}
```

### 7.2 Parent integration pattern

Each page that uses DefenderNav:

```typescript
// In the parent page script setup:
const defenderNav = ref<InstanceType<typeof DefenderNav> | null>(null)

// In the Three.js tick loop (already running at 60 fps):
function tick() {
  // ... existing three.js logic ...

  // DefenderNav redraw (same tick, no extra RAF)
  defenderNav.value?.redraw(buildDefenderData())
}

// Handler for fly-to events from the strip
function onDefenderFlyTo(target: DefenderTarget) {
  if (target.type === 'planet')  focusPlanet(findPlanetMesh(target.id))
  else if (target.type === 'lagrange') flyToLagrangePoint(target)
  else if (target.type === 'gallery')  handleGalleryTarget(target)
  // etc.
}

function handleGalleryTarget(target: DefenderTarget) {
  if (target.meetingState === 'locked' && target.accessLevel !== 'owner') return
  if (target.accessLevel === 'none') return   // tooltip shown by DefenderNav, no portal
  // GSAP fly-to gallery 3D position + portal (fires in parallel with strip zoom-in)
  const galPos = galleryWorldPos(target.galleryId!)
  gsap.to(camera.position, { duration: 0.8, ...galPos, ease: 'power2.inOut',
    onUpdate: () => controls.update() })
  portalStore.openPortal({ label: target.id,
    route: `/gallery/${target.hostname}/${target.galleryId}` })
}

// Handler for portal events from the strip
function onDefenderPortalTo(dest: PortalDestination) {
  portalStore.openPortal(dest)
}
```

```html
<!-- In the parent template -->
<DefenderNav
  ref="defenderNav"
  :mode="mode === 'system' ? 'system' : 'galaxy'"
  :sceneLabel="currentSystem?.hostname ?? 'Galaxy'"
  @flyTo="onDefenderFlyTo"
  @portalTo="onDefenderPortalTo"
/>
```

---

## 8. Internal Canvas Drawing Pipeline

Called by `redraw(data)` — no Vue reactivity, pure canvas API.

```
redraw(data)
  │
  ├─ clear canvas (fillRect black)
  ├─ drawScanLines()              thin horizontal stripes, 2px period
  ├─ drawScaleRuler()             right edge
  │
  ├─ [system mode]
  │   ├─ drawOrbitRings()         dashed lines at each planet radius; amber for P-type
  │   ├─ drawGalleryOrbitRings()  faint dotted lines at each gallery orbital radius
  │   ├─ drawForbiddenZone()      hatched band if circumbinary/hierarchical_triple
  │   ├─ drawStars()              dispatches to one of:
  │   │     drawSingleStar()        single glow at barycentre
  │   │     drawTightBinaryPair()   two co-rotating glows near barycentre
  │   │     drawWideCompanion()     companion glow at its orbital radius/angle
  │   │     drawOuterCompanion()    trinary outer star glow at very wide radius
  │   │     drawContactBinary()     merged elongated glow with pulse
  │   ├─ drawPlanets()            dot + glow + ⟡ badge on P-type planets
  │   ├─ drawLagrangeMarkers()    ▲L4, ▽L5 triangles tracking planet angles
  │   ├─ drawMoonArcs()           dashed arc around each planet dot
  │   ├─ drawSettlementMarkers()  ⬡ hexagon on planets with settlement
  │   ├─ drawGalleryStations()    ⬠ rotating diamonds; dispatches per meetingState:
  │   │     drawGalleryIdle()       dim static diamond
  │   │     drawGalleryOpen()       normal diamond, slow rotation
  │   │     drawGalleryLive()       bright diamond, fast rotation, outer ring pulse,
  │   │                             presence count badge [n]
  │   │     drawGalleryLocked()     outline only, ✖ badge, no rotation
  │   │     drawGalleryExclusive()  outline + ⚿ badge
  │   │     drawScheduledBeacon()   dashed orbit ring brightening toward event start
  │   └─ drawCameraCursor()       blinking ▽ at camera angle/radius (from barycentre)
  │
  ├─ [surface mode]
  │   ├─ drawTerrainLine()        jagged horizon silhouette
  │   ├─ drawSkyObjects()         dots at (azimuth→X, altitude→Y); handles all types
  │   │     — star/companion:       glow dots, binary pair overlap logic
  │   │     — gallery:             tiny ⬠ diamond at skyAzimuth/skyAltitude;
  │   │                            LIVE galleries carry outer pulse ring in sky strip
  │   ├─ drawCameraFovBracket()   vertical cursor + FOV bracket at camera azimuth
  │   └─ drawSettlementAnchor()   ⬡ at azimuth 0, altitude 0
  │
  └─ [cosmic mode]
      ├─ drawVoidArcs()           partial circles for void shells
      ├─ drawClusters()           dots sized by richness
      ├─ drawConduits()           ◆ pulsing diamonds
      ├─ drawEventBeacons()       glow rings
      └─ drawCameraCursor()       ◇ at camera XZ position
```

All drawing uses `ctx.save() / ctx.restore()` bracketing. No state leaks between draw calls.

**Scan-line effect:**
```javascript
for (let y = 0; y < H; y += 2) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.07)'
  ctx.fillRect(0, y, W, 1)
}
```

**Blinking cursor:** The cursor blinks at 1.4 Hz. Blink state = `Math.floor(t * 2.8) % 2`.
When blink state = 0, cursor opacity is 1.0. When blink state = 1, opacity is 0.35.

**Wrap-around drawing:** For world-wrapping modes (system orbital angle, surface azimuth),
objects near 0°/360° are drawn twice — once at their true X and once at X ± stripWidth —
so the seam is never visible. Only objects within `[viewOffset - padding, viewOffset + stripWidth + padding]`
are drawn.

---

## 9. Aesthetic Standards

The strip should feel like:
> *A 1980s vector-scan radar readout running inside a spacecraft that also happens to know
> about real NASA exoplanet data.*

Rules:
- **No filled rectangles except background** — all objects are glows, dots, arcs, or lines.
- **No colour fills on orbit rings** — dashed strokes only.
- **Monospace font only** — `'Courier New', monospace` — for all labels.
- **Font sizes:** 7 px (tick labels), 8 px (standard labels), 10 px (current-object label).
- **Letter-spacing:** 0.07em on all labels.
- **No drop shadows** — use `ctx.globalCompositeOperation = 'screen'` for glows instead.
- **Glow technique:** draw the same shape twice — once large at 15% opacity (soft glow),
  once small at 90% opacity (hard core). Never use CSS filters on canvas.
- **Colour palette:**
  - Background: `#010810`
  - Grid / rings: `rgba(30, 70, 110, 0.4)`
  - Camera cursor: `#00e5ff` (same as wormhole conduit colour)
  - L5 marker: `rgba(255, 180, 30, 0.8)` (matches pyramid amber)
  - L4 marker: `rgba(60, 220, 100, 0.75)` (eco-ops green)
  - Settlement dome: `rgba(0, 200, 220, 0.9)` (same as dome in SurfaceViewPage)
  - Gallery — art: `rgba(200, 120, 255, 0.9)` violet
  - Gallery — community: `rgba(255, 200, 60, 0.9)` gold
  - Gallery — research: `rgba(60, 220, 180, 0.9)` teal
  - Gallery — stage: `rgba(255, 60, 180, 0.9)` hot-pink
  - Gallery — info: `rgba(140, 200, 255, 0.9)` sky-blue
  - Gallery orbit ring: `rgba(80, 40, 120, 0.25)` faint violet dotted
  - Forbidden zone hatch: `rgba(180, 60, 30, 0.12)` red-amber diagonal
  - Terrain line: `rgba(40, 80, 50, 0.55)`
  - Scan lines: `rgba(0, 0, 0, 0.07)`
  - Text: `rgba(120, 190, 220, 0.85)`

---

## 10. Accessibility & Performance

### 10.1 Reduce-motion

If `prefers-reduced-motion: reduce` is detected:
- Cursor blink suppressed (stays at full opacity)
- Strip zoom animation instant (no easing)
- Portal zoom-in animation skipped (portal triggers immediately)

### 10.2 Mobile / touch

- Strip height reduced to 64 px.
- Touch drag pans the strip (one finger).
- Pinch zooms the strip.
- Tap opens tooltip. Second tap on same object triggers fly-to or portal.
- Strip collapses to 20 px on portrait screens < 400 px wide; expands on tap.

### 10.3 Performance budget

- `redraw()` must complete in < 3 ms per call (measured with `performance.now()`).
- Maximum 300 objects drawn per frame. If more exist (X-ray clusters in cosmic mode):
  use spatial hashing to cull objects outside the visible strip viewport before drawing.
- No new allocations inside `redraw()` — all arrays pre-allocated on mount; reuse buffers.
- `ctx.save() / ctx.restore()` calls capped at 20 per frame to avoid stack pressure.

---

## 11. Integration Points with Existing System

| Existing system | DefenderNav touch point |
|---|---|
| `portalStore.openPortal()` | Called by parent `onDefenderPortalTo` handler |
| `WormholePortal.vue` | Unchanged — portal triggers same 7-second E8 sequence |
| GSAP fly-to in GalaxyPage | Called by parent `onDefenderFlyTo` handler |
| OrbitControls | Not directly touched — GSAP drives camera, controls follow |
| `NavigatorInset` | Remains in place — different role (inset context diagram vs strip navigator) |
| `events.ts` / `COSMIC_EVENTS` | Event clusters shown in cosmic mode with beacon rings |
| `starColorFromTeff()` | Used for star dot colours in all modes |
| `planetColor()` | Used for planet dot colours in system + surface modes |
| `sy_snum` + known-circumbinary set | Resolved into `StellarConfig` by a `resolveStellarConfig(sys)` helper in GalaxyPage before `redraw()` — DefenderNav never reads `sy_snum` directly |
| Binary orbital angle | Animated in GalaxyPage tick loop: `binaryAngle += (2π / periodDays) × dtDays`; passed as `stellarConfig.innerBinary.angle` each frame |
| Companion teff estimation | If no companion teff in data: estimated as `primaryTeff × 0.72` (typical K/M companion heuristic); flagged as `estimated: true` for tooltip disclosure |
| pon.ink auth / wallet NFT inventory | Parent page resolves `GalleryAccessLevel` per gallery before each `redraw()` by checking the user's wallet holdings against gallery deed + membership NFT addresses — DefenderNav receives pre-resolved `accessLevel`, never calls pon.ink directly |
| `GalleryPage.vue` (`/gallery` route) | Existing page extended to accept `/:hostname/:galleryId` params; DefenderNav portal destination targets this route |
| Gallery meeting state | Polled or subscribed from pon.ink API by parent page on system entry; updated in `OrbitalGalleryEntry.meetingState` before each `redraw()` — not polled inside DefenderNav |
| `COSMIC_EVENTS` / scheduled events | `scheduledEvent` field on `OrbitalGalleryEntry` mirrors event data from `events.ts`; strip shows countdown beacon brightening to `live` state |
| `exolocation-types.json` / `orbital_zone` type | Gallery Deed NFT address uses `exo-orbital-gallery-v1:` prefix, consistent with exolocation coordinate system `orbital_zone` type already in the schema |

---

## 12. Future Scope (out of v1.1)

- **Multiplayer presence:** In surface mode, show other users' camera look-directions as
  coloured cursor lines in the strip — so you can see where community members are looking.
- **Event timeline strip:** Overlay a second horizontal strip for time (UTC hours) instead
  of space — switching the strip to a chronometer mode showing event dots across the day.
  Uses the same scan-line aesthetic but X = time rather than azimuth.
- **Wormhole conduit path tracing:** In cosmic mode, draw the path of a conduit transit
  as an animated dashed line moving from source cluster to destination cluster before the
  portal fires.
- **Terrain silhouette from real data:** Replace the noise-generated terrain line in surface
  mode with a procedural heightmap computed from the planet's orbital parameters (eqt, rade,
  insol) — giving each planet a visually distinctive ridge profile.
- **Gallery interior floor plan mode:** When inside GalleryPage (Level 3.5), the strip
  switches to a 2D top-down floor plan view — rooms = zones across the X-axis, depth =
  Y-axis, artworks / info nodes = labeled dots, viewer position = cursor. Clicking a room
  dot in the strip triggers a smooth pan to that room in the gallery 3D scene.
- **DAO vote indicator:** When a cooperative or DAO gallery has a pending governance vote
  (e.g. curating new content, updating access policy), show a small vote-beacon ⚖ badge
  on the gallery diamond in the strip, with tooltip showing vote deadline and current tally.
- **Cross-system gallery network map:** In a future `network` mode, the strip shows all
  galleries the current user has access to across every star system — sorted by scheduled
  event time, letting the user jump directly from the strip to any live session system-wide.
