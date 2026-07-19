# SPEC_EXOLOC_ADDRESS — Exotopia Exolocation Address System

**Version:** 2.0-draft  
**Status:** Active design — v1 scopes (`surface`, `orbital`, `lunar-orbital`, `stellar-orbital`) are in production; v2 scopes (`bh-orbital`, `trajectory`, `branch`, `collab`) are specified here for implementation.  
**Public API:** `GET /api/v1/exoloc?address={address}`

---

## 1. Purpose

An exolocation address is the canonical identifier for any location, path, or planning space in the Exotopia universe. It must be:

- **Human-readable** — legible without a decoder to any person familiar with the platform
- **URL-safe** — usable as a path segment in `exotopia.org/{scope}/{path}` without encoding
- **API-passable** — work as a single string parameter in any query string or JSON field
- **NFT-embeddable** — suitable for the `exoloc_address` field in PON INK deed metadata
- **Universally scoped** — cover every addressable location type: surfaces, orbits, black hole vicinity, trajectories, parallel branches, and collaborative planning spaces

---

## 2. Canonical Format

```
exotopia:{scope}:{path}
```

| Segment | Rules |
|---|---|
| `exotopia` | Fixed namespace prefix. Always lowercase. |
| `{scope}` | One of the eight registered scope identifiers below. Lowercase, hyphenated. |
| `{path}` | Scope-specific path. Slashes separate hierarchy levels. Hyphens replace spaces. No URL encoding needed for ASCII. |

The address is also a browser URL when scope and path are appended to the domain:
```
https://exotopia.org/{scope}/{path}
```

---

## 3. Scope Registry

### 3.1 `surface` — Exoplanet or Moon Surface

**Coord system alias:** `exo-surface-v1`

```
exotopia:surface:{host-star}/{body}/{region}
```

| Segment | Example | Notes |
|---|---|---|
| `{host-star}` | `kepler-442` | Host star name, lowercase, hyphens for spaces |
| `{body}` | `kepler-442b` | Planet or moon name |
| `{region}` | `aurora-basin` | Named zone or settlement region |

Example: `exotopia:surface:kepler-442/kepler-442b/aurora-basin`  
URL: `exotopia.org/surface/kepler-442/kepler-442b/aurora-basin`

Boundary is defined in the deed as a lat/lon polygon in surface degrees. Region names are assigned by the first settler and must be unique within the body.

---

### 3.2 `orbital` — Orbit Around an Exoplanet

**Coord system alias:** `exo-orbital-v1`

```
exotopia:orbital:{host-star}/{body}/{altitude-band}
```

| Segment | Example | Notes |
|---|---|---|
| `{altitude-band}` | `200-500km-i30` | Min altitude, max altitude, inclination in degrees |

Example: `exotopia:orbital:proxima-cen/proxima-cen-b/200-500km-i30`

---

### 3.3 `lunar-orbital` — Orbit Around a Moon

**Coord system alias:** `exo-lunar-orbital-v1`

```
exotopia:lunar-orbital:{host-star}/{planet}/{moon}/{altitude-band}
```

Example: `exotopia:lunar-orbital:j133909/planet-b/moon-1/50-150km-i45`

---

### 3.4 `stellar-orbital` — Orbit Around a Host Star

**Coord system alias:** `exo-stellar-orbital-v1`

```
exotopia:stellar-orbital:{system}/{orbital-radius-au}
```

| Segment | Example | Notes |
|---|---|---|
| `{orbital-radius-au}` | `1.1-1.3au` | Orbital radius band in AU |

Example: `exotopia:stellar-orbital:alpha-centauri/1.1-1.3au`

---

### 3.5 `bh-orbital` — Black Hole Vicinity Station *(v2)*

**Coord system alias:** `exo-bh-orbital-v1`

```
exotopia:bh-orbital:{bh-id}/{zone}
```

Black holes have a set of well-defined physical zones derived from general relativity. Each zone is a valid settlement tier. The zone name in the address must be one of the registered zone identifiers below.

#### Black Hole Zone Registry

| Zone ID | Physical location | Schwarzschild radius (r/Rs) | Notes |
|---|---|---|---|
| `event-horizon` | The boundary of no return | r = 1 Rs | Theoretical — no stable settlement. Valid as a waypoint reference only. |
| `photon-sphere` | Unstable circular photon orbit | r = 1.5 Rs (Schwarzschild); varies for Kerr | Light itself orbits here. Extreme time dilation. |
| `isco` | Innermost Stable Circular Orbit | r = 3 Rs (Schwarzschild); r = 0.5–9 Rs (Kerr, spin-dependent) | Closest orbit a physical object can sustain indefinitely. Inner edge of the accretion disk. |
| `ergosphere` | Frame-dragging zone (Kerr BH only) | r_inner = Rs, r_outer depends on spin and latitude | Spacetime itself is dragged in the direction of BH rotation. Penrose process energy extraction possible. |
| `accretion-disk-inner` | Hot, high-energy inner disk | ISCO to ~3× ISCO | X-ray bright. High radiation. Research/observation tier. |
| `accretion-disk-mid` | Mid accretion disk | ~3× to ~10× ISCO | Moderate radiation. First viable habitation tier. |
| `accretion-disk-outer` | Outer, cooler disk | > 10× ISCO | Reduced radiation. Standard orbital physics apply. |
| `jet-cone-north` | Northern relativistic jet | Polar axis above BH | High-energy particle streams. Observation post for jet morphology. |
| `jet-cone-south` | Southern relativistic jet | Polar axis below BH | Symmetric with north. |
| `stable-orbital:{n}rs` | Stable orbit at n × Schwarzschild radii | r = n × Rs (n > 3 for Schwarzschild) | `n` is an integer or one decimal. e.g. `stable-orbital:10rs`. Standard station placement. |

**Black hole type** is carried in the deed metadata, not the address:
- `Schwarzschild` — non-rotating; spherically symmetric
- `Kerr` — rotating; ISCO and ergosphere depend on spin parameter `a` (0 ≤ a ≤ 1)
- `Kerr-Newman` — rotating + charged (theoretical; included for completeness)

**Examples:**

```
exotopia:bh-orbital:M87*/photon-sphere
exotopia:bh-orbital:NGC-1277/accretion-disk-outer
exotopia:bh-orbital:Sgr-A*/stable-orbital:50rs
exotopia:bh-orbital:Perseus-BCG/ergosphere
```

**Deed metadata fields** (added to `pon_ink` block):

```json
"bh_orbital": {
  "bh_id":         "M87*",
  "bh_type":       "Kerr",
  "spin_parameter": 0.90,
  "bh_mass_msun":  "6.5e9",
  "zone":          "photon-sphere",
  "orbital_radius_rs": 1.5,
  "time_dilation_factor": 3.4,
  "radiation_class": "extreme"
}
```

---

### 3.6 `trajectory` — Orbital Path and Slingshot Vector *(v2)*

**Coord system alias:** `exo-trajectory-v1`

```
exotopia:trajectory:{origin-slug}→{destination-slug}/{trajectory-type}/{leg}
```

A trajectory address identifies a path, not a fixed location. It resolves to a state vector (position + velocity) at a given epoch rather than a static coordinate.

#### Trajectory Types

| Type ID | Description |
|---|---|
| `hohmann` | Minimum-energy elliptical transfer between two circular orbits |
| `slingshot` | Gravity assist trajectory — uses a body's gravity to change speed/direction without fuel |
| `hyperbolic-escape` | Escape trajectory beyond a body's gravitational sphere of influence |
| `brachistochrone` | Constant-thrust path minimising travel time (requires sustained acceleration) |
| `relativistic-boost` | Near-c trajectory where relativistic time dilation is non-negligible |
| `spiral-descent` | Low-thrust spiral inward from a high orbit (ion drive model) |
| `free-fall` | Unpowered ballistic trajectory |
| `lagrange-transfer` | Transfer to or between Lagrange points L1–L5 of a body pair |

#### Multi-leg slingshot example

A trajectory using Jupiter and Saturn as gravity assists en route from Earth to Kepler-442b would have three legs:

```
exotopia:trajectory:earth→kepler-442b/slingshot/leg-1   (Earth → Jupiter assist)
exotopia:trajectory:earth→kepler-442b/slingshot/leg-2   (Jupiter → Saturn assist)
exotopia:trajectory:earth→kepler-442b/slingshot/leg-3   (Saturn → cruise → Kepler-442b)
```

The parent trajectory address (no `/leg-n`) refers to the full mission arc:
```
exotopia:trajectory:earth→kepler-442b/slingshot
```

#### Velocity/Acceleration Vector fields in deed metadata

```json
"trajectory": {
  "type":           "slingshot",
  "origin":         "exotopia:surface:sol/earth/launch-site",
  "destination":    "exotopia:surface:kepler-442/kepler-442b/aurora-basin",
  "waypoints": [
    { "body": "Jupiter", "assist_type": "prograde", "delta_v_kms": 5.2 },
    { "body": "Saturn",  "assist_type": "prograde", "delta_v_kms": 3.1 }
  ],
  "state_vector": {
    "epoch":       "2026-06-28T00:00:00Z",
    "position_au": [4.2, -1.1, 0.3],
    "velocity_kms": [12.4, 3.2, -0.8]
  },
  "acceleration_g":        0.001,
  "cruise_velocity_kms":   42.0,
  "relativistic":          false,
  "estimated_arrival":     "2034-03-15"
}
```

---

### 3.7 `branch` — Parallel / Private / Branded Universe Instance *(v2)*

**Coord system alias:** `exo-branch-v1`

```
exotopia:branch:{branch-id}/{base-address}
```

A branch is a divergent instance of any settlement or region. It holds an alternative or aspirational state — a different configuration of features, a branded overlay, a private planning space, or a research simulation.

#### Branch Types

| Type | Access | Use case |
|---|---|---|
| `public` | Open — anyone can view | Aspirational settlement state; community showcase of a proposed future |
| `private` | Owner-only | Personal planning space; draft before committing to main settlement |
| `branded` | Token-gated or invite | A community, organization, or partner's named instance of the universe |
| `research` | Read-only for participants | A simulation fork for academic or scientific study |
| `educational` | Coordinator-controlled | A classroom or workshop instance with curated content |

#### Branch ID conventions

```
{owner-slug}-{purpose}-{version}

e.g.
uni-kibaoni-aspire-2030
fana-ka-private-v2
scd-hub-branded-main
MIT-research-2026
```

#### Address examples

```
exotopia:branch:uni-kibaoni-aspire-2030/surface:kepler-442/kepler-442b/aurora-basin
exotopia:branch:fana-ka-branded/bh-orbital:M87*/accretion-disk-outer
exotopia:branch:scd-hub-edu-cohort-7/surface:trappist-1/trappist-1e/watsan-station
```

The branch address always includes the full base address. This means any address type (surface, bh-orbital, trajectory, etc.) can have a branched version.

#### Branch deed metadata

```json
"branch": {
  "branch_id":       "uni-kibaoni-aspire-2030",
  "branch_type":     "public",
  "owner":           "uni-kibaoni-shg",
  "base_address":    "exotopia:surface:kepler-442/kepler-442b/aurora-basin",
  "divergence_note": "Aspirational 2030 state — biosand network complete, rainwater grid active, solar array installed",
  "access":          "open",
  "created":         "2026-07-08",
  "leech_axis":      "aspirational"
}
```

The `leech_axis` field connects to the Λ₂₄ Leech lattice settlement designation system (see `blog-settlements-as-possible-worlds.md`): `current`, `aspirational`, `relational`, or a named research axis.

---

### 3.8 `collab` — Collaborative Settlement Planning Space *(v2)*

**Coord system alias:** `exo-collab-v1`

```
exotopia:collab:{settlement-address}/{collab-id}
```

A collaborative planning address identifies a shared workspace attached to a settlement or region where multiple participants jointly design features, request ecocity objects, propose orbital parameters, or plan station modules.

#### Collab phases

| Phase | Description |
|---|---|
| `proposal` | Open idea gathering — any participant can add feature requests |
| `design` | Active design work — feature set locked, layout under construction |
| `review` | Community review period before committing to main settlement |
| `building` | Features are being earned/minted; collab tracks progress |
| `active` | Collab is the live coordination record for an operating settlement |
| `archived` | Completed or superseded — read-only reference |

#### Address example

```
exotopia:collab:surface:kepler-442/kepler-442b/aurora-basin/uni-kibaoni-build-2026
```

#### Feature planning in deed metadata

```json
"collab": {
  "collab_id":     "uni-kibaoni-build-2026",
  "settlement":    "exotopia:surface:kepler-442/kepler-442b/aurora-basin",
  "phase":         "design",
  "participants": [
    { "id": "muirithi-jariffe",  "role": "lead"        },
    { "id": "uni-kibaoni-shg",   "role": "community"   },
    { "id": "scd-hub",           "role": "coordinator" }
  ],
  "feature_proposals": [
    { "object": "biosand-filter",       "status": "approved", "earned_by": "watsan-certification" },
    { "object": "rainwater-harvester",  "status": "proposed", "earned_by": "pending-field-checkin" },
    { "object": "solar-array",          "status": "proposed", "earned_by": "energy-certification" }
  ],
  "version": "v2",
  "created": "2026-07-08"
}
```

---

## 4. Scope Summary Table

| Scope | Alias | Status | What it addresses |
|---|---|---|---|
| `surface` | `exo-surface-v1` | Production | Exoplanet or moon surface polygon |
| `orbital` | `exo-orbital-v1` | Production | Altitude band in orbit around a planet |
| `lunar-orbital` | `exo-lunar-orbital-v1` | Production | Orbit around a moon |
| `stellar-orbital` | `exo-stellar-orbital-v1` | Production | Orbital radius band around a star |
| `bh-orbital` | `exo-bh-orbital-v1` | Specified | Black hole vicinity zone (photon sphere, ISCO, accretion disk, ergosphere, stable orbit) |
| `trajectory` | `exo-trajectory-v1` | Specified | Orbital path, slingshot, transfer arc, velocity/acceleration vector |
| `branch` | `exo-branch-v1` | Specified | Parallel/private/branded/educational universe instance |
| `collab` | `exo-collab-v1` | Specified | Collaborative multi-party settlement planning space |

---

## 5. Public API

### Resolve an address

```
GET /api/v1/exoloc?address={address}
```

Returns:

```json
{
  "address":       "exotopia:surface:kepler-442/kepler-442b/aurora-basin",
  "scope":         "surface",
  "resolved":      true,
  "scene_url":     "https://exotopia.org/surface/kepler-442/kepler-442b/aurora-basin",
  "deed_status":   "minted",
  "deed_token_id": "EXO-KPL-442B-AB-001",
  "pathway":       "watsan",
  "trophic_level": "L2 PLANETARY",
  "owner":         "uni-kibaoni-shg",
  "branch_count":  2,
  "collab_active": true
}
```

For trajectory addresses, the response includes the current state vector at request time.  
For branch addresses, the response includes the branch metadata and a link to the base address.  
For collab addresses, the response includes the current phase and feature proposal list.

### List addresses for a body

```
GET /api/v1/exoloc/body/{body-slug}
```

Returns all registered surface, orbital, and collab addresses for a given body.

### List branches for an address

```
GET /api/v1/exoloc/branches?base={address}
```

### Address validation

```
POST /api/v1/exoloc/validate
{ "address": "exotopia:bh-orbital:M87*/photon-sphere" }
```

Returns `{ "valid": true, "scope": "bh-orbital", "zone": "photon-sphere", "warnings": [] }`.

---

## 6. Trophic Level Mapping

| Trophic Level | Scopes | Description |
|---|---|---|
| L1 STELLAR | `stellar-orbital` | Orbit of the host star or binary system |
| L2 PLANETARY | `surface`, `orbital` | Exoplanet surface or planetary orbit |
| L3 LUNAR | `lunar-orbital`, `surface` (moon) | Moon surface or orbit |
| L4 ORBITAL STATION | `orbital` (station), `bh-orbital` `stable-orbital:*` | Named station in stable orbit |
| L5 EXTREME | `bh-orbital` `photon-sphere`, `isco`, `ergosphere` | Relativistic-physics zone; high time dilation |
| L6 TRAJECTORY | `trajectory` | Path-based; trophic level resolves at origin and destination |
| L7 BRANCH | `branch` | Parallel instance; inherits trophic level of base address |
| L8 COLLAB | `collab` | Planning space; inherits trophic level of attached settlement |

---

## 7. Relationship to Existing Specs

| Spec | Relationship |
|---|---|
| `SPEC_PON_INK.md` | The `exoloc_address` field in all PON INK NFT metadata must use this format |
| `SPEC_NFT_FRONTIER.md` | Frontier (predicted) exoplanets use `surface` scope with `frontier:` prefix on body slug |
| `SPEC_ZK_E8_PLONK.md` | E8 identity proofs are anchored to `surface` and `bh-orbital` addresses |
| `SPEC_WORLDBRIDGER_ONE.md` | Multi-author attribution uses `collab` addresses for the shared contribution record |
| `blog-settlements-as-possible-worlds.md` | `branch` scope implements the Λ₂₄ Leech lattice parallel universe designation system described there |
| `SPEC.md` §4 | This document supersedes and extends the coordinate system table in SPEC.md §4 |
