/**
 * src/lib/e8-lattice.ts
 *
 * E8 root system (240 roots in 8D) and Coxeter plane projection.
 * Used by WormholePortal.vue to render the transit mandala.
 *
 * E8 at a glance
 * ──────────────
 *   • 240 roots: 112 "integer" (±eᵢ±eⱼ) + 128 "spinor" (½(±1…±1), even # of −)
 *   • Coxeter number h = 30
 *   • Exponents: 1, 7, 11, 13, 17, 19, 23, 29
 *   • Coxeter plane: 240 roots project to 4 concentric rings of 60 points each
 *     (ring radii ∝ sin(πe/30) for exponents e = 1, 7, 11, 13)
 */

// ── Root type ─────────────────────────────────────────────────────────────────

export type Root8 = [number,number,number,number,number,number,number,number]

// ── Generate all 240 E8 roots ─────────────────────────────────────────────────

export function e8Roots(): Root8[] {
  const roots: Root8[] = []

  // Type 1 (112): ±eᵢ ± eⱼ  for  0 ≤ i < j ≤ 7
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      for (const si of [1, -1]) {
        for (const sj of [1, -1]) {
          const r: Root8 = [0, 0, 0, 0, 0, 0, 0, 0]
          r[i] = si
          r[j] = sj
          roots.push(r)
        }
      }
    }
  }

  // Type 2 (128): ½(±1, …, ±1) with an EVEN number of minus signs
  for (let mask = 0; mask < 256; mask++) {
    let ones = 0
    for (let k = 0; k < 8; k++) if (mask & (1 << k)) ones++
    if (ones % 2 !== 0) continue
    const r: Root8 = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
    for (let k = 0; k < 8; k++) if (mask & (1 << k)) r[k] = -0.5
    roots.push(r)
  }

  return roots // exactly 240
}

// ── Coxeter plane projection ──────────────────────────────────────────────────
//
// The Coxeter element of E8 has eigenvalue e^(2πi/30) on the Coxeter plane.
// We project each root r using the "angular momentum" basis derived from
// E8's exponents, assigning each 8D coordinate a phase angle:
//   phase[k] = 2π × exponents[k] / 30
//
// Roots that lie in the same eigenspace of the Coxeter element project to
// the same radius, producing the four-ring mandala pattern.

const EXPONENTS = [1, 7, 11, 13, 17, 19, 23, 29] as const
const PHASES = EXPONENTS.map(e => (2 * Math.PI * e) / 30)

export function coxeterProject(root: Root8): [number, number] {
  let px = 0, py = 0
  for (let k = 0; k < 8; k++) {
    px += root[k] * Math.cos(PHASES[k])
    py += root[k] * Math.sin(PHASES[k])
  }
  return [px, py]
}

// ── Coxeter plane point catalog ───────────────────────────────────────────────
//
// Rather than computing projections at runtime (which collapses pairs of
// opposite roots to the same 2D point), we generate the canonical 4-ring
// mandala directly.  Each ring has 30 equally-spaced points; adjacent rings
// are offset by half a step for the authentic E8 visual.

export interface CoxeterPoint {
  x:     number   // Coxeter-plane x, in range [-1, 1]
  y:     number   // Coxeter-plane y, in range [-1, 1]
  ring:  0 | 1 | 2 | 3   // 0 = innermost, 3 = outermost
  angle: number   // 0 – 2π
}

// Ring radii: sin(π × exponent / 30), normalised to the outermost ring
const RAW_RADII = [1, 7, 11, 13].map(e => Math.sin(Math.PI * e / 30))
const SCALE     = 1 / RAW_RADII[3]           // normalise outer ring to 1.0
const RADII     = RAW_RADII.map(r => r * SCALE)

// Angular offset per ring so that the rings interleave visually
const RING_OFFSETS = [0, Math.PI / 30, 0, Math.PI / 30]

export function e8CoxeterPoints(): CoxeterPoint[] {
  const pts: CoxeterPoint[] = []
  const h = 30

  for (let ring = 0; ring < 4; ring++) {
    const r   = RADII[ring]
    const off = RING_OFFSETS[ring]
    for (let k = 0; k < h; k++) {
      const angle = (2 * Math.PI * k) / h + off
      pts.push({
        x:     r * Math.cos(angle),
        y:     r * Math.sin(angle),
        ring:  ring as 0 | 1 | 2 | 3,
        angle,
      })
    }
  }

  return pts // 120 points
}

// ── Edge catalog (for line drawing) ──────────────────────────────────────────

export function e8CoxeterEdges(pts: CoxeterPoint[]): Array<[number, number]> {
  const edges: Array<[number, number]> = []
  const h = 30
  const byRing: number[][] = [[], [], [], []]
  pts.forEach((p, i) => byRing[p.ring].push(i))

  // Intra-ring polygon (every point connected to its two neighbours)
  for (let ring = 0; ring < 4; ring++) {
    const rp = byRing[ring]
    for (let k = 0; k < rp.length; k++) {
      edges.push([rp[k], rp[(k + 1) % rp.length]])
    }
  }

  // Inter-ring radial spokes: rings 1↔2 and 2↔3 (skip 0↔1 — too cramped)
  for (let ring = 1; ring < 3; ring++) {
    const a = byRing[ring]
    const b = byRing[ring + 1]
    for (let k = 0; k < h; k++) {
      edges.push([a[k], b[k]])
    }
  }

  return edges
}

// ── Ring metadata (colours, size) used by WormholePortal ─────────────────────

export const RING_META = [
  { color: '#00e5ff', size: 2.5, label: 'inner' },    // ring 0 — cyan
  { color: '#7c4dff', size: 3.0, label: 'mid-inner' },// ring 1 — violet
  { color: '#e040fb', size: 3.5, label: 'mid-outer' },// ring 2 — magenta
  { color: '#ffffff', size: 4.0, label: 'outer' },     // ring 3 — white
] as const
