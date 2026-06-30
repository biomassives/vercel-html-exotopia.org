# SPEC_ZK_E8_PLONK.md — Zero-Knowledge Lattice Proof System

### E8 / Λ₂₄ Membership Circuits · Art-Hash Visual Fingerprints · Worldbridger One Integration

*SCD Hub · exotopia.org · pon.ink · ecocity.com · GPL v3 · Living Document — June 2026*

---

## §0. Purpose & Design Philosophy

This specification defines the zero-knowledge proof layer that underlies SCD Hub's field telemetry verification, contributor identity, and ecological certificate system. It replaces the XOR-based commitment described in earlier drafts of `SPEC_WORLDBRIDGER_ONE.md §2.2` with a formally sound, cryptographically strong proof system built on **PLONK via halo2**.

Three capabilities unified by this spec:

1. **Lattice membership proofs** — prove that a contributor's identity vector is a valid member of the E8 root system (or the Leech lattice Λ₂₄ for large collaborative groups) without revealing the vector itself.
2. **Composite attribution proofs** — prove that a weighted sum of N contributor vectors reduces to a valid lattice point, anchoring Worldbridger One co-creation credits.
3. **Art-hash visual fingerprints** — deterministic Coxeter plane projections generated from proof outputs that can be verified by human eyes AND scanned by a lightweight library.

Governing relationships:
- `SPEC_WORLDBRIDGER_ONE.md` — defines the collaborative attribution model this spec makes cryptographically sound
- `SPEC_PRIVACY_TIMESCALES.md` — defines the multi-timescale data lifecycle this spec's proofs anchor
- `compliance/digital-credentials-law/TRUST-HIERARCHY.md` — the certificate trust chain whose root validity is proven by this system
- `src/lib/e8-lattice.ts` — the existing TypeScript Coxeter projection code reused by the art-hash renderer

---

## §1. Why PLONK / halo2 — Rejecting the Trusted Setup Requirement

### 1.1 Groth16's fatal weakness for decentralised communities

Groth16 is the most proof-size-efficient zk-SNARK and runs fast on mobile. It is the wrong choice here. Groth16 requires a **circuit-specific trusted setup ceremony** — a multi-party computation that generates a structured reference string (SRS) for each circuit. If even one participant in that ceremony is dishonest and retains their "toxic waste" (secret randomness), they can forge proofs indefinitely with no detection possible. For a platform that serves Mpeketoni table banking groups, Lamu coastal cleanup collectives, and indigenous land stewards across three continents — communities that have direct historical reasons to distrust centralised authority — a system that requires trusting a setup ceremony is unacceptable on principle.

### 1.2 PLONK's universal SRS

PLONK (Permutations over Lagrange-bases for Oecumenical Noninteractive arguments of Knowledge — Gabizon, Williamson, Ciobotaru, 2019) separates the trusted setup from the circuit. A single **universal SRS** (structured reference string) works for any circuit up to a given size. The SRS can be generated once by a large ceremony and reused indefinitely across all circuits. Critically, **halo2** — the Rust implementation developed by the Electric Coin Company (Zcash) — eliminates even the universal trusted setup by replacing the polynomial commitment scheme with an **Inner Product Argument (IPA)**, which requires only a random group generator (publicly verifiable, no ceremony needed).

Summary of why halo2:

| Property | Groth16 | PLONK (KZG) | halo2 (IPA) |
|---|---|---|---|
| Trusted setup | Per-circuit, toxic waste | Universal (one ceremony) | **None** |
| Proof size | ~200 bytes | ~500 bytes | ~1–5 KB |
| Verification time (WASM) | ~5ms | ~10ms | ~50ms |
| Recursion | No | With tricks | **Native** |
| Mobile-viable | Yes | Yes | Yes (with batching) |
| Rust crate | bellman | plonk | **halo2_proofs** |

The 50ms verification time in WASM is entirely acceptable for our use case — a field worker submitting a proof once per eco-ops check-in, not a high-frequency trading engine. The recursive proof capability means epoch commits (monthly aggregates across multiple hubs) can be built from individual proofs without a new circuit, which is essential for the Worldbridger One multi-hub aggregation path.

### 1.3 halo2 crate dependency

```toml
# zk-e8/rust/Cargo.toml
[dependencies]
halo2_proofs = { version = "0.3", features = ["dev-graph"] }
ff = "0.13"           # finite field arithmetic
group = "0.13"        # elliptic curve group operations
pasta_curves = "0.5"  # Pallas/Vesta curves used by halo2
rand_core = "0.6"

[lib]
crate-type = ["cdylib", "rlib"]  # cdylib for wasm-pack output
```

---

## §2. E8 Lattice Membership Circuit

### 2.1 Mathematical foundation

The E8 root system contains exactly **240 roots** satisfying:

```
Type 1 (112 roots):  v = ±eᵢ ± eⱼ  for  0 ≤ i < j ≤ 7
  → exactly two non-zero coordinates, each ±1
  → Euclidean norm ||v||² = 2

Type 2 (128 roots):  v = ½(±1, ±1, ±1, ±1, ±1, ±1, ±1, ±1)
  → all coordinates ±½, even number of negative signs
  → Euclidean norm ||v||² = 2
```

To avoid floating-point drift, we work in the **doubled integer representation**: multiply all coordinates by 2, so Type 2 coordinates become ±1 (integers) and Type 1 coordinates become ±2. In this representation both types satisfy `Σvᵢ² = 8`.

Lattice membership constraints in integer form:

```
For any valid E8 root v = [v₀, v₁, ..., v₇] in doubled representation:
  C1 (norm):       Σᵢ vᵢ² = 8
  C2 (parity):     all vᵢ ≡ 0 mod 2  (Type 1)  OR  all vᵢ ≡ 1 mod 2  (Type 2)
  C3 (Type 1):     exactly two i where vᵢ ≠ 0, each vᵢ ∈ {+2, -2}
  C4 (Type 2):     count of negative coordinates is even
```

All four constraints are arithmetic — they reduce to polynomial equalities and inequalities over finite fields, which is exactly what PLONK circuits express.

### 2.2 Circuit architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  E8MembershipCircuit                                                   │
│                                                                        │
│  Private inputs (witness):                                             │
│    coords[8]: i64   — the 8 coordinates of the lattice vector          │
│    vec_type: u8     — 0 = Type1 (integer), 1 = Type2 (spinor)          │
│                                                                        │
│  Public inputs:                                                        │
│    commitment: Fp   — Poseidon hash of (coords, blinding_factor)       │
│                                                                        │
│  Constraints (gates + lookups):                                        │
│    Gate 1 — Norm check:     Σ(coords[i]²) == 8                         │
│    Gate 2 — Type select:    vec_type ∈ {0, 1}                          │
│    Gate 3 — Type1 branch:   if type==0: count_nonzero(coords) == 2    │
│                              AND nonzero values ∈ {+2, -2}            │
│    Gate 4 — Type2 branch:   if type==1: all |coords[i]| == 1          │
│                              AND count_negative(coords) % 2 == 0      │
│    Gate 5 — Commitment:     Poseidon(coords ++ blinding) == commitment │
│                                                                        │
│  Lookup tables:                                                        │
│    TABLE_SQUARES: {v → v²} for v ∈ {-4, -3, -2, -1, 0, 1, 2, 3, 4} │
│    TABLE_ABS:     {v → |v|} for same range                            │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Rust circuit skeleton

```rust
// zk-e8/rust/src/circuits/e8_membership.rs
use halo2_proofs::{
    circuit::{Layouter, SimpleFloorPlanner, Value},
    plonk::{Advice, Circuit, Column, ConstraintSystem, Error, Expression, Selector},
    poly::Rotation,
};
use pasta_curves::Fp;

#[derive(Clone, Debug)]
pub struct E8MembershipConfig {
    coords: [Column<Advice>; 8],
    coords_sq: [Column<Advice>; 8],
    vec_type: Column<Advice>,
    norm_sum: Column<Advice>,
    s_norm: Selector,
    s_type1: Selector,
    s_type2: Selector,
}

pub struct E8MembershipCircuit {
    pub coords: [Value<i64>; 8],   // private: the actual lattice vector
    pub vec_type: Value<u8>,       // private: 0=Type1, 1=Type2
    pub blinding: Value<Fp>,       // private: blinding factor for commitment
}

impl Circuit<Fp> for E8MembershipCircuit {
    type Config = E8MembershipConfig;
    type FloorPlanner = SimpleFloorPlanner;

    fn configure(meta: &mut ConstraintSystem<Fp>) -> Self::Config {
        let coords: [Column<Advice>; 8] = std::array::from_fn(|_| meta.advice_column());
        let coords_sq: [Column<Advice>; 8] = std::array::from_fn(|_| meta.advice_column());
        let vec_type = meta.advice_column();
        let norm_sum = meta.advice_column();
        let s_norm = meta.selector();
        let s_type1 = meta.selector();
        let s_type2 = meta.selector();

        // Gate 1: norm constraint — Σ(coords[i]²) = 8
        meta.create_gate("e8_norm", |meta| {
            let s = meta.query_selector(s_norm);
            let sum: Expression<Fp> = coords_sq
                .iter()
                .map(|&col| meta.query_advice(col, Rotation::cur()))
                .fold(Expression::Constant(Fp::zero()), |acc, x| acc + x);
            let target = Expression::Constant(Fp::from(8u64));
            vec![s * (sum - target)]
        });

        // Gate 3/4: type-conditional constraints (abbreviated — full impl in crate)
        // Type1: exactly 2 nonzero, each ±2  → checked via product-of-pairs lookup
        // Type2: all |v|=1, even negatives   → checked via parity accumulator gate

        E8MembershipConfig { coords, coords_sq, vec_type, norm_sum, s_norm, s_type1, s_type2 }
    }

    fn synthesize(&self, config: Self::Config, mut layouter: impl Layouter<Fp>) -> Result<(), Error> {
        layouter.assign_region(|| "e8_membership", |mut region| {
            config.s_norm.enable(&mut region, 0)?;
            for (i, (&col, &sq_col)) in config.coords.iter().zip(config.coords_sq.iter()).enumerate() {
                let v = self.coords[i].map(|x| Fp::from(x.unsigned_abs()) * if x < 0 { -Fp::one() } else { Fp::one() });
                let v_sq = self.coords[i].map(|x| Fp::from((x * x) as u64));
                region.assign_advice(|| format!("coord_{i}"), col, 0, || v)?;
                region.assign_advice(|| format!("coord_sq_{i}"), sq_col, 0, || v_sq)?;
            }
            Ok(())
        })
    }
}
```

---

## §3. E8 → Λ₂₄ Bridge

### 3.1 When to upgrade: N > 8 threshold

E8 has 8 dimensions and 240 root vectors. Up to 8 contributors can each "own" one lattice dimension without geometric ambiguity. When N > 8 (e.g., six coastal cleanup hubs + three Mpeketoni table banking groups merging into a monthly epoch commit), the composite vector risks collisions in 8D space. The **Leech lattice Λ₂₄** — the densest known sphere packing in 24 dimensions — provides 24 independent dimensions and 196,560 minimal vectors (vs. E8's 240), eliminating collision risk for groups up to 24 contributors.

```
N ≤ 8   →  E8  (8D, 240 roots)           — single hub, small collaborative
N > 8   →  Λ₂₄ (24D, 196,560 min vectors) — multi-hub epoch commit

Proof struct carries: lattice_space: LatticeSpace { E8 | Leech24 }
```

### 3.2 Construction: E8 → Λ₂₄ via the tripling embedding

The Leech lattice contains three orthogonal copies of E8. The embedding is:

```
Given contributor vectors E_A, E_B, E_C ∈ E8 (three groups of ≤ 8 contributors each):

Λ₂₄ vector: v₂₄ = (E_A, E_B, E_C) ∈ ℝ²⁴

The composite satisfies Λ₂₄ membership if:
  (1) Each of E_A, E_B, E_C is a valid E8 vector
  (2) All three reduce to the same coset representative mod 2Λ_E8
      (this is the Niemeier gluing condition that makes the three copies
       cohere into a Leech lattice member rather than just a product)
```

The Niemeier gluing condition can be expressed as an additional constraint in the halo2 circuit: a modular arithmetic gate checking that the three E8 sub-vectors agree on their coset class.

### 3.3 24D → 2D visual projection

For the art-hash renderer (§5), we project the 24D composite back to 2D via the **E8 shadow map**: since E8 ⊂ Λ₂₄ as a canonical sublattice, we take the projection onto the first 8 coordinates and then apply the standard Coxeter plane projection. The result is a valid point in the four-ring mandala regardless of whether the proof is in E8 or Leech space — the visual renderer is the same for both.

---

## §4. Worldbridger One Composite Proof

### 4.1 Fixing `consolidation.c`: from XOR to lattice insertion

Replace the XOR-based merging (which destroys E8 structure) with a proper weighted sum + lattice reduction:

```c
/* zk-e8/c/consolidation.c — REPLACEMENT FOR spec's consolidation.c */
#include <stdint.h>
#include <string.h>
#include "e8_reduce.h"   /* lattice reduction to nearest E8 point */

#define MAX_CONTRIBUTORS 24  /* supports Leech path */
#define VECTOR_DIM       8
#define WEIGHT_CHANNEL   7   /* dimension 7 reserved for material metric */
#define GRAM_UNIT        500 /* 500g = 1 lattice unit in the material channel */
#define BASIS_POINTS     10000

typedef struct {
    int32_t  lattice_key[VECTOR_DIM]; /* valid E8 root in doubled-integer form */
    uint32_t weight_bps;              /* this contributor's share, 0–10000 */
    uint32_t material_grams;          /* physical metric (plastic, soil, etc.) */
} ContributorInput;

void build_composite_vector(
    const ContributorInput *contributors,
    int n,
    int32_t *out_composite   /* VECTOR_DIM elements, caller-allocated */
) {
    memset(out_composite, 0, VECTOR_DIM * sizeof(int32_t));

    for (int w = 0; w < n && w < MAX_CONTRIBUTORS; w++) {
        /* Dimensions 0–6: weighted identity sum */
        for (int i = 0; i < WEIGHT_CHANNEL; i++) {
            out_composite[i] +=
                (contributors[w].lattice_key[i] * (int32_t)contributors[w].weight_bps)
                / BASIS_POINTS;
        }
        /* Dimension 7: additive material metric */
        out_composite[WEIGHT_CHANNEL] +=
            (int32_t)(contributors[w].material_grams / GRAM_UNIT);
    }

    /* Snap composite back into the nearest E8 lattice point */
    e8_reduce(out_composite, VECTOR_DIM);
}
```

`e8_reduce()` implements the Micciancio-Voulgaris nearest-vector algorithm on E8 (exact for E8 — no approximation needed since E8 is a root lattice with a simple Voronoi cell).

### 4.2 The three-part ZK proof for a Worldbridger One asset

A complete Worldbridger One composite proof asserts:

```
PROVE (without revealing any private inputs):

  ∀ i ∈ [0, N): E_i ∈ E8              (each contributor holds a valid lattice identity)
  Σ(i) weight_bps[i] == 10000          (weights are a proper partition: total = 100%)
  E_composite = reduce(Σ(i) w_i × E_i) (the weighted sum reduces to a lattice point)
  material_total = Σ(i) material_grams  (aggregate material metric is correctly summed)
  E_composite[7] = material_total / GRAM_UNIT  (metric is embedded in dim 7)

PUBLIC OUTPUTS:
  commitment_composite: Fp    — Poseidon hash of E_composite
  material_total: u32         — claimed aggregate material (public, for payout calculation)
  coxeter_2d: CoxeterProof2D  — visual fingerprint (deterministic from E_composite)
  proof_hash: [u8; 32]        — Blake3 hash of the full proof for on-chain anchoring
```

---

## §5. Art-Hash Visual Fingerprint Pipeline

### 5.1 Concept: proof you can see

The Coxeter plane projection of the E8 root system maps 240 roots to 120 distinct 2D points arranged in **four concentric rings of 30 points** (Coxeter number h = 30). Each valid E8 root projects to exactly one point on one ring. A composite vector (the weighted sum of N contributors' root identities) projects to a unique position in this 2D plane.

This projection is:
- **Deterministic** — same contributors, same weights, same material metric → identical image
- **Unique** — different collaboration → different point → different visual pattern
- **Non-reversible** — the 2D position does not reveal the 8D lattice vector (pre-image resistance from the projection, supplemented by the ZK commitment)

The generated image — a "zen-ink mandala" — serves simultaneously as:
1. A human-verifiable proof of completion (the worker recognises their group's pattern)
2. A machine-scannable certificate (the scanner library extracts and verifies the lattice point)
3. A unique artwork embedded in SVG certificate files

### 5.2 CoxeterProof2D output type (Rust)

```rust
// zk-e8/rust/src/art_hash.rs
use crate::e8_lattice::{coxeter_project, ring_index};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CoxeterProof2D {
    /// Composite vector's 2D Coxeter projection
    pub composite_point: (f64, f64),
    /// Ring 0–3 (inner to outer) of the composite projection
    pub composite_ring: u8,
    /// Each contributor's individual projection (in contribution order)
    pub contributor_points: Vec<(f64, f64)>,
    pub contributor_rings: Vec<u8>,
    /// The 30-gon Petrie polygon of the composite's Coxeter element
    pub petrie_polygon: Vec<(f64, f64)>,
    /// Blake3 hash of (composite_vector || proof_bytes) — anchor for scanner
    pub proof_hash: [u8; 32],
    /// Whether this proof used E8 (dim=8) or Leech Λ₂₄ (dim=24)
    pub lattice_dim: u8,
}

pub fn generate_art_hash(
    composite: &[i32],      // 8 or 24 elements
    contributor_vecs: &[[i32; 8]],
    proof_bytes: &[u8],
) -> CoxeterProof2D {
    // Project composite (always via E8 shadow for the 24D case)
    let e8_shadow = if composite.len() == 24 { &composite[0..8] } else { composite };
    let (cx, cy) = coxeter_project(e8_shadow);

    let contributor_points: Vec<(f64, f64)> =
        contributor_vecs.iter().map(|v| coxeter_project(v)).collect();
    let contributor_rings: Vec<u8> =
        contributor_vecs.iter().map(|v| ring_index(&coxeter_project(v))).collect();

    // Petrie polygon: 30-gon inscribed at the composite's Coxeter radius
    let r = (cx * cx + cy * cy).sqrt();
    let petrie_polygon: Vec<(f64, f64)> = (0..30)
        .map(|k| {
            let theta = (2.0 * std::f64::consts::PI * k as f64) / 30.0;
            (r * theta.cos(), r * theta.sin())
        })
        .collect();

    let proof_hash = blake3::hash(&[composite.as_bytes_of(), proof_bytes].concat()).into();

    CoxeterProof2D {
        composite_point: (cx, cy),
        composite_ring: ring_index(&(cx, cy)),
        contributor_points,
        contributor_rings,
        petrie_polygon,
        proof_hash,
        lattice_dim: composite.len() as u8,
    }
}
```

### 5.3 SVG ink-wash renderer (TypeScript)

The TypeScript renderer reuses `e8-lattice.ts` for the ring geometry and renders the `CoxeterProof2D` JSON to SVG:

```typescript
// src/lib/art-hash-renderer.ts
import type { CoxeterProof2D } from './zk-e8-wasm'  // WASM bindings
import { RING_META } from './e8-lattice'

const CANVAS = 500
const CENTRE = CANVAS / 2
const SCALE  = CENTRE * 0.85

export function renderArtHash(proof: CoxeterProof2D): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width',   String(CANVAS))
  svg.setAttribute('height',  String(CANVAS))
  svg.setAttribute('viewBox', `0 0 ${CANVAS} ${CANVAS}`)

  // Background
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%')
  bg.setAttribute('fill', '#010810'); svg.appendChild(bg)

  // Petrie 30-gon (the lattice's heartbeat)
  const petrie = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  const petriePoints = proof.petrie_polygon
    .map(([x, y]) => `${CENTRE + x * SCALE},${CENTRE - y * SCALE}`).join(' ')
  petrie.setAttribute('points', petriePoints)
  petrie.setAttribute('fill', 'none')
  petrie.setAttribute('stroke', 'rgba(0,229,255,0.08)')
  petrie.setAttribute('stroke-width', '0.5')
  svg.appendChild(petrie)

  // Contributor spokes (line from centre to each contributor point)
  proof.contributor_points.forEach(([x, y], idx) => {
    const ring = proof.contributor_rings[idx]
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', String(CENTRE))
    line.setAttribute('y1', String(CENTRE))
    line.setAttribute('x2', String(CENTRE + x * SCALE))
    line.setAttribute('y2', String(CENTRE - y * SCALE))
    line.setAttribute('stroke', RING_META[ring].color)
    line.setAttribute('stroke-width', String(0.3 + ring * 0.2))
    line.setAttribute('stroke-opacity', '0.4')
    svg.appendChild(line)
  })

  // Contributor nodes
  proof.contributor_points.forEach(([x, y], idx) => {
    const ring = proof.contributor_rings[idx]
    const meta = RING_META[ring]
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', String(CENTRE + x * SCALE))
    circle.setAttribute('cy', String(CENTRE - y * SCALE))
    circle.setAttribute('r',  String(meta.size))
    circle.setAttribute('fill', meta.color)
    circle.setAttribute('opacity', '0.7')
    svg.appendChild(circle)
  })

  // Composite point — bright white, pulsing stroke
  const [cx, cy] = proof.composite_point
  const compMeta = RING_META[proof.composite_ring]
  const comp = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  comp.setAttribute('cx', String(CENTRE + cx * SCALE))
  comp.setAttribute('cy', String(CENTRE - cy * SCALE))
  comp.setAttribute('r', '6')
  comp.setAttribute('fill', '#ffffff')
  comp.setAttribute('stroke', compMeta.color)
  comp.setAttribute('stroke-width', '2')
  svg.appendChild(comp)

  // Embed proof_hash in SVG metadata (machine-readable)
  const meta = document.createElementNS('http://www.w3.org/2000/svg', 'metadata')
  meta.textContent = JSON.stringify({
    type: 'exotopia:art-hash:v1',
    proof_hash: Array.from(proof.proof_hash).map(b => b.toString(16).padStart(2,'0')).join(''),
    lattice_dim: proof.lattice_dim,
    composite_ring: proof.composite_ring,
  })
  svg.appendChild(meta)

  return svg
}
```

### 5.4 Scanner library — art-hash verification

The scanner recovers the lattice proof from a rendered SVG (or image URL) and verifies it against the on-chain record:

```typescript
// src/lib/art-hash-scanner.ts
// Purpose: given an SVG art-hash certificate, verify it is authentic.

export interface ScanResult {
  valid: boolean
  proof_hash: string       // hex
  lattice_dim: 8 | 24
  composite_ring: 0 | 1 | 2 | 3
  on_chain_match: boolean  // checked against Algorand indexer
  reason?: string          // if invalid, why
}

export async function scanArtHash(svgElement: SVGSVGElement | string): Promise<ScanResult> {
  const svg = typeof svgElement === 'string'
    ? await fetchAndParseSVG(svgElement)
    : svgElement

  // Step 1: extract embedded metadata
  const metaEl = svg.querySelector('metadata')
  if (!metaEl) return { valid: false, reason: 'no metadata block found', ... }
  const meta = JSON.parse(metaEl.textContent ?? '{}')
  if (meta.type !== 'exotopia:art-hash:v1') return { valid: false, reason: 'unknown type' }

  // Step 2: extract visual points and reconstruct candidate lattice position
  const circles = Array.from(svg.querySelectorAll('circle'))
    .filter(c => parseFloat(c.getAttribute('r') ?? '0') < 5.5) // contributor nodes only
  const points = circles.map(c => ({
    x: (parseFloat(c.getAttribute('cx')!) - 250) / 212.5,
    y: (250 - parseFloat(c.getAttribute('cy')!)) / 212.5,
  }))

  // Step 3: verify visual points match the claimed ring membership
  //   (ring boundaries are at radii: sin(π×e/30) for e = 1, 7, 11, 13)
  const ringRadii = [1, 7, 11, 13].map(e => Math.sin(Math.PI * e / 30) / Math.sin(Math.PI * 13 / 30))
  const ringTolerance = 0.05
  const visuallyValid = points.every(p => {
    const r = Math.sqrt(p.x * p.x + p.y * p.y)
    return ringRadii.some(rr => Math.abs(r - rr) < ringTolerance)
  })
  if (!visuallyValid) return { valid: false, reason: 'points do not lie on E8 Coxeter rings' }

  // Step 4: check proof_hash against Algorand indexer
  const onChainMatch = await verifyHashOnAlgorand(meta.proof_hash)

  return {
    valid: visuallyValid && onChainMatch,
    proof_hash: meta.proof_hash,
    lattice_dim: meta.lattice_dim,
    composite_ring: meta.composite_ring,
    on_chain_match: onChainMatch,
  }
}
```

Human verification: the scanner also returns a **verbal ring description** for low-literacy contexts:

```
Ring 0 (inner / cyan):   "core collective — tight group, high coherence"
Ring 1 (mid-inner / violet): "practitioner band — established contributors"
Ring 2 (mid-outer / magenta): "extended network — multi-hub collaboration"
Ring 3 (outer / white):  "epoch scale — full community aggregation"
```

A facilitator with no technical background can look at where the bright white composite dot sits and know instantly: is this an inner collaboration (small group, dim glow) or an outer epoch commit (full network, bright edge)?

---

## §6. Performance Targets — 3G Mobile Constraints

All proof operations must be viable on a mid-range Android (2019+, 2 GB RAM, 3G / 100 ms RTT).

| Operation | Target | Method |
|---|---|---|
| Root generation (240 vectors) | < 1ms | Pre-computed in WASM module init |
| E8 membership proof (single) | < 300ms | halo2 IPA, ~40 constraints |
| Composite proof (N=5) | < 800ms | Batched halo2 |
| Verification (WASM browser) | < 80ms | halo2 verifier |
| Epoch aggregate proof (N=24, Λ₂₄) | < 3s | Acceptable (once-monthly) |
| Art-hash SVG render | < 30ms | ~240 DOM operations |
| Scanner library (one SVG) | < 200ms | Including Algorand indexer call |
| IndexedDB cache (offline proof) | Immediate | Service worker intercept |

Offline-first rule: if the Algorand indexer is unreachable (3G dropout), proofs are generated locally, cached in IndexedDB with 48h TTL (per `SPEC_PRIVACY_TIMESCALES.md §1.2`), and submitted with the next successful network connection.

---

## §7. Integration Map

```
PROOF GENERATION (client-side WASM)
  zk-e8.wasm: E8MembershipCircuit + CompositeCircuit + generate_art_hash()
       │
       ├── generate proof → CoxeterProof2D + proof_bytes
       │
       ▼
IndexedDB (pending_proofs store)
  { proof_hash, proof_bytes, art_hash_svg, timestamp, synced: false }
  purge after 48h (SPEC_PRIVACY_TIMESCALES §1.2)
       │
       │ on network reconnect
       ▼
Cloudflare Worker — /api/v1/proof/submit
  • Verifies proof (halo2 verifier, WASM)
  • Posts proof_hash to Algorand (did:algo:SCDHUB_ROOT signs)
  • Stores art_hash_svg in R2 (certificate storage)
  • Writes occurrence record to Supabase (no personal data, only hash + rings)
       │
       ├── Supabase (pgvector)
       │   table: proof_records
       │   columns: proof_hash, composite_ring, lattice_dim, material_total,
       │            created_at, partner_org_did
       │   RLS: readable by anyone, writable only by CF Worker service key
       │
       ├── Algorand Indexer
       │   on-chain record: proof_hash + did:algo:SCDHUB_ROOT signature
       │   used by: scanner library, certificate verifier at exotopia.org/cert/:id
       │
       ├── Vercel Edge middleware
       │   /cert/:id — resolves hash → R2 SVG → browser
       │   validates proof_hash against Algorand before serving
       │
       └── Appwrite standalone nodes (Level 2 partner orgs)
           each node: receives proof_hash from Cloudflare Worker relay
           runs: appwrite function verify_e8_proof(hash) → sign local cert
           scope: partner's authorised certificate categories only
```

---

## §8. Rust Crate Structure

```
zk-e8/
├── Cargo.toml
├── rust/
│   ├── src/
│   │   ├── lib.rs                    — WASM exports via wasm-bindgen
│   │   ├── circuits/
│   │   │   ├── e8_membership.rs      — §2 circuit
│   │   │   ├── composite.rs          — §4 weighted sum + lattice reduction
│   │   │   └── leech_bridge.rs       — §3 Λ₂₄ circuit
│   │   ├── e8_lattice.rs             — root generation, norm check, e8_reduce()
│   │   ├── leech_lattice.rs          — tripling construction, gluing condition
│   │   ├── art_hash.rs               — §5.2 CoxeterProof2D generation
│   │   └── proof_anchor.rs           — Blake3 hash + Algorand submission helpers
│   └── tests/
│       ├── test_e8_membership.rs
│       ├── test_composite.rs
│       └── test_art_hash.rs
├── c/
│   ├── consolidation.c               — §4.1 replacement consolidation module
│   ├── e8_reduce.c                   — nearest-E8-vector algorithm
│   └── CMakeLists.txt
└── wasm/
    └── (wasm-pack build output: zk_e8_bg.wasm, zk_e8.js, zk_e8.d.ts)
```

Build commands:
```bash
# Compile Rust → WASM for browser + edge runtimes
wasm-pack build zk-e8/rust --target web --out-dir ../../public/wasm

# Compile C layer (for embedded field hardware)
cmake -B zk-e8/build zk-e8/c && make -C zk-e8/build
```

---

## §9. Open Questions (to resolve before Crate v0.1)

| # | Question | Decision needed |
|---|---|---|
| 9.1 | Poseidon hash parameters (width, rate, round constants) for the commitment gate — use the standard Zcash/ECC parameters from `halo2_gadgets::poseidon`? | Recommend yes — avoids custom parameter generation |
| 9.2 | E8 dimension 7 material channel unit: 500g = 1 unit means maximum representable without Leech upgrade is 7×(max int) kg. Is that sufficient for epoch aggregates? | Check max single-epoch plastic volumes from Lamu collective data |
| 9.3 | Algorand transaction format for proof anchoring: use a `note` field (max 1KB) or an ARC-3 metadata reference? | Note field fits proof_hash (32B) + CoxeterProof2D summary easily |
| 9.4 | Appwrite function runtime: Deno (Appwrite 1.4+) or the older Node/PHP runtime? | Deno preferred — WASM native, smaller cold-start |
| 9.5 | Scanner library image input: SVG DOM only, or also accept PNG/JPEG rendered exports? | Phase 1: SVG only. Phase 2: add Canvas-based pixel ring detection |

---

*Return to: [SPEC_WORLDBRIDGER_ONE.md](SPEC_WORLDBRIDGER_ONE.md) · [SPEC_PRIVACY_TIMESCALES.md](SPEC_PRIVACY_TIMESCALES.md) · [compliance/digital-credentials-law/TRUST-HIERARCHY.md](compliance/digital-credentials-law/TRUST-HIERARCHY.md)*  
*SCD Hub · Exotopia.org · GPL v3 · June 2026*
