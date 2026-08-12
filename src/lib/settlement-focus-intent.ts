/**
 * src/lib/settlement-focus-intent.ts
 *
 * Carries a "suggested focus" (see MintPage.vue's FOCUS_OPTIONS) from a
 * subsystem page's "Start a settlement" CTA across the multi-page journey to
 * actually claim one — browse (/galaxy) → pick a planet (SurfaceViewPage) →
 * PlanetClaimOverlay → /mint. A query param alone doesn't survive that many
 * hops without threading it through every intermediate router.push() call,
 * so this uses sessionStorage instead, consumed once so a stale suggestion
 * never leaks into an unrelated later claim.
 */

const KEY = 'exo_suggested_focus'

/** Call from a subsystem page's CTA before navigating toward the claim journey. */
export function setSuggestedFocus(id: string): void {
  try { sessionStorage.setItem(KEY, id) } catch { /* storage unavailable — ignore */ }
}

/** Call once, from MintPage.vue, as a fallback when no ?suggestedFocus= query param is present. */
export function consumeSuggestedFocus(): string | null {
  try {
    const v = sessionStorage.getItem(KEY)
    if (v) sessionStorage.removeItem(KEY)
    return v
  } catch {
    return null
  }
}
