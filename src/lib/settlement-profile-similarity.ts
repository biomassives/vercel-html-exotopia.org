/**
 * src/lib/settlement-profile-similarity.ts
 *
 * Duplicate/spam-candidate detection for settlement_profiles moderation
 * (AdminSettlementProfilesPage.vue) — "does this new profile look like one
 * that already exists," surfaced as a hint for the admin, not an automatic
 * takedown.
 *
 * This is a sibling to src/lib/leech-vector.ts, not a reuse of it.
 * leech-vector.ts's 24 dimensions are specific to PFAS/ecology project logs
 * (concentrationReductionFrac, citationCount, etc.) — none of that maps onto
 * a settlement_profiles row (display_name, focus, description,
 * technology_keys, exolocation). Forcing this domain's fields through that
 * vector would produce numbers, not signal. What's actually reused from the
 * "lattice tools" is the pattern and the primitive: Root8 (src/lib/
 * e8-lattice.ts) as the fixed-width numeric type, and Euclidean k-NN as the
 * comparison method — applied to a fingerprint built from this table's own
 * fields.
 *
 * Fingerprinting alone isn't enough, though: cramming set-valued
 * (technology_keys) and free-text (display_name, exolocation) fields into a
 * single Euclidean coordinate each would blur exactly the signal duplicate
 * detection needs — two profiles with wildly different tech-stacks can land
 * at the same "tech key count" coordinate. So the composite score below
 * combines the Root8 structural fingerprint (cheap, numeric-only feature
 * distance) with direct field-level similarity metrics (Jaccard for the
 * key set, normalized edit distance for the two text fields). Same
 * disclosure leech-vector.ts makes about its own scope: this is plain
 * structured comparison, not lattice-point decoding.
 */
import type { Root8 } from './e8-lattice'
import { euclideanDistance } from './leech-vector'

export interface ProfileFingerprintInput {
  owner_id:        string
  display_name:    string
  focus:           string
  description:     string | null
  technology_keys: string[]
  exolocation:     string
  created_at:       string
}

// Order matches the CHECK constraint in supabase/migrations/012_settlement_profiles.sql —
// 8 values, so it fits Root8 with no padding.
const FOCUS_ORDER = ['eco', 'learning', 'library', 'watsan', 'food', 'health', 'leadership', 'command'] as const

function focusIndex(focus: string): number {
  const i = FOCUS_ORDER.indexOf(focus as typeof FOCUS_ORDER[number])
  return i === -1 ? 0 : i
}

/** Structural fingerprint — numeric-only features, cheap to compare at scale. */
export function buildProfileFingerprint(p: ProfileFingerprintInput): Root8 {
  const hoursSinceCreated = (Date.now() - new Date(p.created_at).getTime()) / 3_600_000
  return [
    focusIndex(p.focus) / (FOCUS_ORDER.length - 1),                    // x1 — category
    Math.min(1, p.technology_keys.length / 12),                        // x2 — key count (schema max 12)
    Math.min(1, (p.description?.length ?? 0) / 2000),                  // x3 — description length (schema max)
    Math.min(1, p.display_name.length / 200),                          // x4 — name length (schema max)
    Math.min(1, p.exolocation.length / 300),                           // x5 — exoloc length (schema max)
    Math.max(0, 1 - hoursSinceCreated / 720),                          // x6 — recency, decays over 30 days
    p.technology_keys.length > 0 ? 1 : 0,                              // x7 — has any tech attached
    p.description ? 1 : 0,                                             // x8 — has a description
  ]
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1
  const sa = new Set(a), sb = new Set(b)
  let intersection = 0
  for (const x of sa) if (sb.has(x)) intersection++
  const union = sa.size + sb.size - intersection
  return union === 0 ? 1 : intersection / union
}

/** Normalized edit-distance similarity, 0 (nothing alike) to 1 (identical). */
function textSimilarity(a: string, b: string): number {
  const sa = a.trim().toLowerCase(), sb = b.trim().toLowerCase()
  if (sa === sb) return 1
  const maxLen = Math.max(sa.length, sb.length)
  if (maxLen === 0) return 1
  const dp: number[] = Array.from({ length: sb.length + 1 }, (_, j) => j)
  for (let i = 1; i <= sa.length; i++) {
    let prevDiag = dp[0]!
    dp[0] = i
    for (let j = 1; j <= sb.length; j++) {
      const tmp = dp[j]!
      dp[j] = sa[i - 1] === sb[j - 1]
        ? prevDiag
        : 1 + Math.min(prevDiag, dp[j]!, dp[j - 1]!)
      prevDiag = tmp
    }
  }
  const distance = dp[sb.length]!
  return 1 - distance / maxLen
}

export interface SimilarityResult<T> {
  candidate:      T
  score:          number   // 0-1, higher = more likely duplicate/spam pairing
  sameOwner:      boolean  // surfaced separately — same owner isn't itself suspicious, just worth showing
}

const WEIGHTS = { tech: 0.30, name: 0.25, structural: 0.20, exoloc: 0.15, focus: 0.10 }

function pairScore(target: ProfileFingerprintInput, candidate: ProfileFingerprintInput): number {
  const structuralDist = euclideanDistance(buildProfileFingerprint(target), buildProfileFingerprint(candidate))
  const structuralSim  = Math.max(0, 1 - structuralDist / Math.sqrt(8))   // normalize by max possible distance
  return (
    WEIGHTS.tech       * jaccard(target.technology_keys, candidate.technology_keys) +
    WEIGHTS.name       * textSimilarity(target.display_name, candidate.display_name) +
    WEIGHTS.structural * structuralSim +
    WEIGHTS.exoloc     * textSimilarity(target.exolocation, candidate.exolocation) +
    WEIGHTS.focus      * (target.focus === candidate.focus ? 1 : 0)
  )
}

/**
 * Top-k most similar existing profiles to `target`, for the admin page's
 * "possible duplicate" hint. Excludes `target` itself if present in
 * `candidates` (matched by reference-independent id field, if supplied).
 */
export function nearestProfiles<T extends ProfileFingerprintInput & { id?: string }>(
  target: T & { id?: string }, candidates: T[], k = 3,
): SimilarityResult<T>[] {
  return candidates
    .filter(c => !target.id || c.id !== target.id)
    .map(c => ({ candidate: c, score: pairScore(target, c), sameOwner: c.owner_id === target.owner_id }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}
