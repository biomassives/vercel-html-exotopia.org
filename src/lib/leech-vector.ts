/**
 * src/lib/leech-vector.ts
 *
 * First real implementation of the `leech_vector` field described in
 * `blog-settlements-as-possible-worlds.md` and referenced by
 * `exo-branch-v1` (`SPEC_EXOLOC_ADDRESS.md` §3.7) — a 24-dimensional
 * vector made of three stacked 8-vectors (current / aspirational /
 * relational state), used for plain structured comparison between
 * branch settlements.
 *
 * Deliberate scope note: this is NOT Leech-lattice (Λ₂₄) sphere-packing
 * or lattice-point decoding — that's a coding-theory research project
 * or the blog post's own proposal, which only ever calls for Euclidean
 * distance / nearest-neighbor search over structured 24-dim vectors.
 * `Root8` is reused from src/lib/e8-lattice.ts purely as a matching
 * 8-tuple type for the three blocks — no root-system math from that
 * file is used here.
 */
import type { Root8 } from './e8-lattice'

export type LeechVector = number[]   // length 24 — validated by buildLeechVector

// ── Current state (coords 0-7) — computed from real project log data ──────

export interface ProjectLogSummary {
  logCount:        number
  firstLoggedAt:   string | null   // ISO
  lastLoggedAt:    string | null   // ISO
  avgNotesLength:  number
  metricsFraction: number          // 0-1, fraction of entries with ≥1 numeric metric
  concentrationReductionFrac: number | null   // 0-1 if computable from metrics trend, else null
  streakWeeks:     number
  status:          'planning' | 'active' | 'monitoring' | 'complete'
}

const STATUS_PROGRESS: Record<ProjectLogSummary['status'], number> = {
  planning: 0, active: 0.33, monitoring: 0.66, complete: 1,
}

export function buildCurrentState(s: ProjectLogSummary): Root8 {
  const daysSinceStart = s.firstLoggedAt
    ? (Date.now() - new Date(s.firstLoggedAt).getTime()) / 86_400_000
    : 0
  const daysSinceLastLog = s.lastLoggedAt
    ? (Date.now() - new Date(s.lastLoggedAt).getTime()) / 86_400_000
    : Infinity

  return [
    s.concentrationReductionFrac ?? 0,        // x1 — measured contamination reduction, if computable
    Math.min(1, s.logCount / 20),             // x2 — data density
    Math.min(1, daysSinceStart / 180),        // x3 — time active
    Math.min(1, s.streakWeeks / 8),           // x4 — logging consistency
    STATUS_PROGRESS[s.status],                // x5 — project status progress
    s.metricsFraction,                        // x6 — structured-data quality
    Math.min(1, s.avgNotesLength / 300),      // x7 — documentation richness
    Math.max(0, 1 - daysSinceLastLog / 60),   // x8 — recency (decays to 0 over ~60 days of silence)
  ]
}

// ── Aspirational state (coords 8-15) — set once by the project creator ────

export interface AspirationalInput {
  targetReductionFrac?:  number   // 0-1, target contamination reduction
  targetTimelineMonths?: number   // planned duration
  plannedMethodCount?:   number   // how many methods from the library they intend to combine
  confidenceLevel?:      number   // 0-1, self-rated confidence in the plan
}

export function buildAspirationalState(input: AspirationalInput): Root8 {
  return [
    input.targetReductionFrac ?? 0.5,
    input.targetTimelineMonths ? Math.min(1, 12 / input.targetTimelineMonths) : 0.5,  // shorter planned timeline → higher value
    input.plannedMethodCount ? Math.min(1, input.plannedMethodCount / 3) : 0.5,
    input.confidenceLevel ?? 0.5,
    0.5, 0.5, 0.5, 0.5,   // reserved — unset until the platform has more aspirational-planning fields to draw from
  ]
}

// ── Relational state (coords 16-23) — computed from connections ───────────

export interface RelationalInput {
  citationCount:        number   // times this project's method proposal is cited by others
  endorsementCount:     number   // endorsements the linked method proposal has received
  siblingBranchCount:   number   // other branch settlements sharing the same base_address
  connectedContributors: number  // distinct authors who have logged on this project
}

export function buildRelationalState(input: RelationalInput): Root8 {
  return [
    Math.min(1, input.citationCount / 5),
    Math.min(1, input.endorsementCount / 10),
    Math.min(1, input.siblingBranchCount / 5),
    Math.min(1, input.connectedContributors / 5),
    0.5, 0.5, 0.5, 0.5,   // reserved — unset until the platform tracks more relational signals
  ]
}

// ── Assembly + comparison ──────────────────────────────────────────────────

export function buildLeechVector(current: Root8, aspirational: Root8, relational: Root8): LeechVector {
  const v = [...current, ...aspirational, ...relational]
  if (v.length !== 24) throw new Error(`buildLeechVector: expected 24 dimensions, got ${v.length}`)
  return v
}

export function euclideanDistance(a: LeechVector, b: LeechVector): number {
  if (a.length !== b.length) throw new Error('euclideanDistance: vector length mismatch')
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i]! - b[i]!) ** 2
  return Math.sqrt(sum)
}

/**
 * Plain nearest-neighbor search by Euclidean distance — not lattice decoding.
 * Used for "find branch settlements with a similar profile" comparisons.
 */
export function nearestBranches<T extends { leech_vector: LeechVector }>(
  target: LeechVector, candidates: T[], k: number,
): T[] {
  return candidates
    .map(c => ({ c, d: euclideanDistance(target, c.leech_vector) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map(({ c }) => c)
}
