# EXOTOPIA — GAME THEORY MECHANICS
**SCD Hub · SPEC v0.1 · GPL v3**  
*Living document — supersedes no existing spec; extends SPEC.md §§1–6*

---

## §1. Overview

Exotopia's virtual property layer is governed by two interacting physics-based token economies layered on top of the settlement NFT system:

| Economy | Visual form | Physics basis | Accumulation | Effect |
|---|---|---|---|---|
| **Dark Energy** | Timular blobs — morphing volumetric shapes in great voids | Cosmological constant Λ; void dark energy density fluctuations | Long-duration interactions (minutes) | Rare access, Liminal zone unlocks |
| **Quantum Effects** | Charged positrons — orbital particles at cluster boundaries | Pair production, annihilation, Planck energy quantisation | Short-duration captures (seconds) | Frequent micro-bonuses, NFT rarity boosts |

Neither economy uses a speculative token. Both are denominated in **activity scores** recorded on-chain with each eco-ops check-in and settlement interaction. They cannot be purchased — only earned through navigation and field activity.

---

## §2. Timular Blobs — Dark Energy Fields

### §2.1 Definition

A **timular blob** (*from: temporal + singular — a dark energy density singularity localised in a void region*) is an animated volumetric entity that inhabits the interiors of the great cosmic voids visible in Exotopia's L1 (Cosmic Web) view.

In physical cosmology, the universe's expansion is driven by dark energy (≈68% of the total energy content), distributed most visibly in the underdense regions between galaxy filaments — the cosmic voids. Timular blobs are Exotopia's interactive representation of this invisible energy field.

### §2.2 Visual Design

Each blob is a **metaball-like isosurface** computed from a superposition of Gaussian density kernels:

```
field(x,y,z,t) = Σᵢ  kᵢ(t) / (|r - rᵢ(t)|² + εᵢ)

where:
  rᵢ(t) = centre of i-th kernel, drifts slowly: rᵢ(t) = r₀ᵢ + Aᵢ sin(ωᵢt + φᵢ)
  kᵢ(t) = strength, breathes: kᵢ(t) = k₀ᵢ (1 + 0.2 sin(ωᵢt × 1.3 + φᵢ))
  εᵢ    = softening radius (prevents singularity)
  ε     = 0.01 (isosurface threshold)
```

The isosurface `field = ε` is extracted at runtime using a marching-tetrahedra approximation over the void's bounding box, animated each frame.

**Colour**: HSL with hue drifting at 0.01 rad/s, saturation 0.85, lightness 0.65 — warm amber to deep violet over a 120-second cycle. Blending: `AdditiveBlending`, opacity 0.08–0.18 based on energy density magnitude at the surface.

**Size**: Blobs occupy 15–40% of the void's interior volume (void radius 25–300 Mpc, scaled by `MPC_SCALE = 1/15`).

### §2.3 Placement Algorithm

Timular blobs are placed within each named void using a seeded spatial distribution:

```
For each void V with centre C_V and radius R_V:
  n_blobs = 2 + floor(R_V / 60 Mpc)   // 2–7 blobs per void

  seed = hash(V.name)
  For i in 0..n_blobs:
    r_local = seededRng() × R_V × 0.65     // stay well inside void
    θ = seededRng() × 2π
    φ = arccos(2 × seededRng() - 1)
    rᵢ = C_V + r_local × (sin(φ)cos(θ), sin(φ)sin(θ), cos(φ))
    kᵢ = 0.04 + seededRng() × 0.08
    εᵢ = 0.02 + seededRng() × 0.04
```

The **KBC Void** (which contains the Milky Way; dist=0, R=300 Mpc) gets special treatment — its blobs surround the Laniakea structure but avoid the Milky Way neighbourhood (exclusion sphere r < 20 Mpc from origin).

### §2.4 Interaction Mechanics

**Detection**: The user's "camera presence" inside a void region triggers blob activation. A blob is *activated* when the camera is within 1.5× the blob's effective radius.

**Interaction**: Dwelling near an activated blob for `T_dwell` seconds accumulates **DRK-E (dark energy) score**:

```
DRK-E += kᵢ(t) × T_dwell × (1 - clamp(|camera - rᵢ|/r_eff, 0, 1))
```

**Effects of DRK-E accumulation**:

| DRK-E threshold | Access unlocked |
|---|---|
| 10 | L6 LIMINAL zone becomes mintable (moon–planet interface) |
| 25 | Void Conduit wormhole transit speed +30% |
| 50 | Dark matter (DK.MAT) view reveals hidden E8 lattice nodes |
| 100 | Theoretical Frontier NFT upgrade eligibility (+1 tier) |
| 250 | Rare: access to ε Eridani Liminal zone pre-allocation |

DRK-E decays at 0.5 units/hour when the user is offline (dark energy dissipates in the absence of observation — a nod to the measurement problem).

---

## §3. Charged Positrons — Quantum Effects

### §3.1 Definition

A **charged positron** is a luminous orbital particle that appears at the boundaries between gravitational domains — specifically at:
- The edges of X-ray galaxy cluster virial radii
- The periphery of cosmic void boundaries (the void-filament interface)
- LOD transition zones in the approach sequence (LOD_MID to LOD_NEAR)

In physical terms, positrons (e⁺) are the antimatter partner of the electron. They are produced in pair-production events near strong electromagnetic fields, which in Exotopia's metaphor corresponds to the boundaries where dark energy voids meet baryonic matter filaments.

### §3.2 Visual Design

Each positron is rendered as a **small bright particle following a modified Keplerian orbit** around a density centre:

```
Position at time t for positron j around centre Cⱼ:

  a = semi-major axis (0.05–0.3 scene units)
  e = eccentricity = seededRng() × 0.6          // 0–0.6 (eccentric orbits)
  ω = argument of periapsis = seededRng() × 2π
  i = inclination = seededRng() × π / 2         // 0–90° from reference plane

  E(t): eccentric anomaly, solved by Kepler's equation iteratively
  r(t) = a(1 - e cos(E))
  true_anomaly ν(t) from E(t) and e

  orbital_pos = r(t) × (cos(ν+ω), sin(i)×sin(ν+ω), cos(i)×sin(ν+ω))
  world_pos   = Cⱼ + orbital_pos
```

**Period**: T = 2π / (n × cluster_richness_factor) where n = 0.1–0.4 rad/s  
**Colour**: Bright cyan-white (`#e0ffff`) with AdditiveBlending, opacity 0.65 at periapsis, 0.25 at apoapsis  
**Trail**: Short particle trail (8 ghost positions at T-0.05s intervals) giving motion vector

### §3.3 Spawn Conditions

Positrons are **continuously spawned and annihilated** based on cluster approach:

```
For each cluster C with virial radius R_vir:
  n_positrons(d) = floor(max(0, 6 × (1 - d/R_vir_outer)²))

  where d = camera.distanceTo(C.pos)
        R_vir_outer = R_vir × 2.5

At d < R_vir:   spawn rate doubles (strongest field)
At d > R_vir_outer: all positrons for this cluster annihilate (flash → fade)
```

**Annihilation event**: When a positron's orbit decays (energy below threshold), it flashes white (`opacity 1.0 → 0`) and emits a brief gamma-ray flash (a bright point sprite with 200ms lifetime). This is the signature of e⁺e⁻ pair annihilation → 2γ photons.

### §3.4 Capture Mechanics

**Capture**: Clicking a positron within 0.5 scene units adds it to the user's QNT-P score. The positron annihilates (flash effect) and a replacement spawns on a new orbital.

```
QNT-P += 1 × multiplier

multiplier = 1 + 0.1 × n_captures_in_60s      // combo multiplier, resets after 60s gap
           × proximity_bonus                    // 2.0 at periapsis, 1.0 at apoapsis
```

**Effects of QNT-P accumulation**:

| QNT-P | Effect |
|---|---|
| 5  | Star sprite LOD_REVEAL threshold reduced 10% (faster resolution on approach) |
| 15 | X-ray thermal vision contrast +20% in X-RAY mode |
| 30 | Access to Frontier NFT tier — predicted exoplanet claims |
| 60 | Wormhole branching density in portal animation +3 secondary branches |
| 120 | Hidden glossary entries unlocked (5 advanced quantum-physics terms) |
| 300 | Rare: access to Boötes Void interior settlement pre-allocation |

QNT-P does **not** decay — captures are permanent. This represents quantum-mechanical path integrals: once a measurement occurs, the state is fixed.

---

## §4. Cosmic → Galaxy Transition — Mathematical Basis

### §4.1 The Coordinate Mismatch Problem

The cosmic view (L1) and galaxy view (L2) use **incompatible coordinate frames and scales**:

| Property | Cosmic View | Galaxy View |
|---|---|---|
| Scale | 1 scene unit = 15 Mpc | Arbitrary LY-scale units |
| Origin | Milky Way centre | Milky Way centre |
| Star positions | Not shown (below resolution) | RA/Dec/parsec catalog |
| Camera FOV | 55° | 60° |
| Max camera dist | 250 scene units (3750 Mpc) | 2500 internal units |

The current transition (`enterMilkyWay`) flies the camera to `(0, 0, 0.05)` in cosmic units then immediately pushes `/galaxy`. This loses:
1. The **approach direction** (which quadrant of the galaxy sky were we looking at?)
2. The **void boundary context** (the coloured polygon shells should echo in the new view)
3. **Scale continuity** (the visual jump is discontinuous)

### §4.2 Approach Vector Preservation

When the user clicks the MW sphere to enter galaxy view, capture the **approach unit vector**:

```typescript
// In CosmicPage.enterMilkyWay():
const C = camera.position.clone()                 // cosmic camera position (scene units)
const d_approach = C.clone().negate().normalize() // unit vector pointing from C toward MW

// Convert to sky spherical coordinates
const r_mpc    = C.length() * 15                  // distance in Mpc
const dec_rad  = Math.asin(C.y / C.length())      // declination
const ra_rad   = Math.atan2(-C.z, C.x)            // right ascension

// Store for GalaxyPage to consume
cosmicApproachStore.set({
  ra_deg:   ra_rad  * 180 / Math.PI,
  dec_deg:  dec_rad * 180 / Math.PI,
  dist_mpc: r_mpc,
  dir_x: d_approach.x,
  dir_y: d_approach.y,
  dir_z: d_approach.z,
})
```

### §4.3 Galaxy View Initialisation from Approach Vector

In GalaxyPage, the stored approach vector is used to orient the initial camera:

```typescript
// In GalaxyPage.initScene():
const approach = cosmicApproachStore.get()
if (approach) {
  // The user arrived from direction (ra, dec) in cosmic space.
  // In the galaxy view, this corresponds to a direction on the sky.
  // Convert approach unit vector (cosmic RA/Dec) to a galaxy-view 3D direction:
  const approachDir = new THREE.Vector3(approach.dir_x, approach.dir_y, approach.dir_z)

  // Place camera at moderate zoom distance, slightly elevated, looking at MW centre
  // but offset so the approach direction is behind us (we just came from there)
  const initialDist = 600
  const elevation   = initialDist * 0.15   // ~8.5° elevation

  camera.position.set(
    -approachDir.x * initialDist,
    elevation,
    -approachDir.z * initialDist,
  )
  camera.lookAt(0, 0, 0)
} else {
  camera.position.set(0, elevation, 600)   // default
}
```

This ensures the galaxy view opens with the **same orientation** as the cosmic approach — the galaxy disk is seen from the angle we approached it.

### §4.4 Scale Bridge Visualisation

During the 2.4s fly-in in CosmicPage, add a **cross-scale echo layer**:
1. As camera approaches MW centre in cosmic view, fade in faint concentric rings at 1/15, 1/150, 1/1500 of the cluster radii — simulating zooming through orders of magnitude
2. The void polygon colours (iridescent cyan/amber) should persist as CSS background tints during the route transition (stored as CSS custom property)
3. GalaxyPage scene background starts at the void's dominant colour and fades to `#02040a` over 0.5s after load

### §4.5 Void Polygon Boundary Continuity

The coloured void polygons in the cosmic view carry semantic colour (cyan for Local Void, deep teal for KBC, dark for Boötes). In the galaxy view:
- Show a very faint ring at the edge of the screen (as a CSS border-radius overlay) in the Local Void's colour
- This "void boundary echo" reminds the user they are inside the KBC Void
- The echo fades as the user zooms in toward star systems

**Mathematical placement of the void echo ring**: The Local Void has a centre at `(RA 219°, Dec 26°, dist 23 Mpc)`. At the moment of galaxy view entry, this projects to a specific screen-space position. A CSS `radial-gradient` centred at this screen position provides the echo.

---

## §5. Integration with Settlement Economy

### §5.1 Score Composition

Each settlement's **total vitality score** combines:

```
V_total = (40 × eco_ops_count)
        + (20 × minting_events)
        + (drk_e_score × 15)              // dark energy multiplier
        + (qnt_p_score × 8)               // quantum multiplier
        + (mentor_events × 25)
        + (water_cert_count × 12)
```

DRK-E and QNT-P are additive bonuses that reward explorers who spend time in the cosmic view. This creates a clear incentive loop:
- Explore cosmic voids → accumulate DRK-E → unlock rare settlement zones
- Approach clusters → capture positrons → unlock advanced visualisations

### §5.2 Special Zone Unlocks

| Zone type | Mechanism | Required score |
|---|---|---|
| L6 LIMINAL (moon–planet interface) | DRK-E 10 + | Rare — void exploration |
| Boötes Void interior | DRK-E 250 | Once per account |
| Frontier exoplanet claim | QNT-P 30 | Opens tier-3 NFT |
| Hidden wormhole conduit | DRK-E 50 + QNT-P 60 | Combo gate |

### §5.3 Ecommunity DAO Governance Weight

Both scores contribute to **governance token weight** in proportion to their rarity:
- DRK-E is harder to accumulate (long dwell, rare voids) → higher DAO weight per unit
- QNT-P is more frequent → lower DAO weight per unit but strong combo scaling

```
governance_weight += drk_e_score × 0.8 + qnt_p_score × 0.3
```

---

## §6. Balance and Access Control

### Anti-gaming

- **DRK-E**: Requires sustained camera presence. A bot that parks the camera in a void accumulates at the base rate — no acceleration from rapid movement. This is mitigated by the `T_dwell × density` formula; dwelling outside the blob's core contributes minimally.

- **QNT-P**: The combo multiplier resets after 60s. Rapid clicking at spawn produces diminishing returns (spawn rate is capped by `n_positrons(d)` which depends on actual camera distance, not click rate).

- **On-chain verification**: Both scores are submitted with eco-ops check-ins. A score without a corresponding check-in chain is invalid. GPS coordinates must be plausible (movement at human speeds).

### Fee Isolation

Per the established rule: DRK-E and QNT-P scores are **never used in fee computations**. They are access and governance signals only. The Resonance Split (100/0/0) applies only to aftermarket transactions of NFTs unlocked by these scores, computed independently of the score values.

---

## §7. Implementation Notes

### Priority order

1. **Now (v1.0)**: Specification only — DRK-E and QNT-P scores are tracked in session storage as `exo_drk_e` and `exo_qnt_p` with no persistence or on-chain effect yet
2. **v1.1 (June–July 2026)**: Visual layer — timular blobs in `CosmicPage`, charged positrons in `CosmicPage` and `GalaxyPage`; scores accumulated in session
3. **v1.2**: On-chain submission of scores with eco-ops check-ins on Polygon
4. **v2.0**: Full governance weight integration with Ecommunity DAO contracts

### Files to modify

| File | Change |
|---|---|
| `src/pages/CosmicPage.vue` | Add timular blobs, positrons, improved transition |
| `src/pages/GalaxyPage.vue` | Read approach vector, init camera correctly |
| `src/stores/cosmic-approach.ts` | New store: approach vector, DRK-E, QNT-P |
| `src/data/cosmic-structures.ts` | Add void blob parameters |
| `src/lib/security.ts` | Add `exo_drk_e` and `exo_qnt_p` to session namespace |

### Dependency on math verification protocol

All positron orbital computations and timular blob placements should be verified using the math-audit agent protocol before deployment:
- Kepler's equation solver: verify E for e=0.0, 0.3, 0.6
- Void placement: verify no blob centre falls outside its parent void
- Approach vector: verify `ra/dec → 3D direction` round-trips correctly for at least 4 CLUSTERS positions
