/**
 * src/lib/security.ts
 *
 * Client-side security utilities:
 *   - 48-hour session cache clearance (Operational Horizon)
 *   - Bandwidth detection for progressive asset loading
 *   - Prefixed sessionStorage helpers (never touches unrelated keys)
 *
 * Design principles:
 *   - All operations are limited to the `exo_` key namespace.
 *   - No GPS or real-world coordinates are stored — only virtual exoplanet refs.
 *   - Dry functions: pure side-effect only on sessionStorage, never localStorage.
 */

// ── Operational horizon — 48-hour session cache clearance ────────────────────

const SESSION_NS    = 'exo_'          // namespace prefix for all our keys
const HORIZON_KEY   = 'exo_session_t' // timestamp of session start
const HORIZON_MS    = 48 * 60 * 60 * 1000   // 48 hours in ms

/**
 * Enforce the Operational Horizon:
 * On each page load, check if the session was started more than 48 hours ago.
 * If so, clear all Exotopia-namespaced keys from sessionStorage and log an audit record.
 *
 * Call once in onMounted() of any page that handles user identity or property data.
 */
export function enforceSessionHorizon(): void {
  try {
    const stored = sessionStorage.getItem(HORIZON_KEY)
    const now    = Date.now()

    if (stored) {
      const elapsed = now - parseInt(stored, 10)
      if (elapsed > HORIZON_MS) {
        purgeSessionCache('48h operational horizon elapsed')
        sessionStorage.setItem(HORIZON_KEY, String(now))
        return
      }
    } else {
      // First time — record session start
      sessionStorage.setItem(HORIZON_KEY, String(now))
    }
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — no-op
  }
}

/**
 * Immediately clear all Exotopia-namespaced sessionStorage keys.
 * Used by enforceSessionHorizon() and can be called on explicit logout.
 */
export function purgeSessionCache(reason = 'manual'): void {
  try {
    const toDelete: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith(SESSION_NS)) toDelete.push(k)
    }
    toDelete.forEach(k => sessionStorage.removeItem(k))
    console.info(`[SECURITY] Session cache purged (${toDelete.length} keys) — reason: ${reason}`)
  } catch {
    // sessionStorage unavailable — no-op
  }
}

/**
 * Set a namespaced sessionStorage value.
 * Always use this instead of sessionStorage.setItem() directly.
 */
export function setSessionValue(key: string, value: string): void {
  try {
    sessionStorage.setItem(SESSION_NS + key, value)
  } catch { /* quota exceeded or unavailable */ }
}

/**
 * Get a namespaced sessionStorage value.
 */
export function getSessionValue(key: string): string | null {
  try {
    return sessionStorage.getItem(SESSION_NS + key)
  } catch {
    return null
  }
}

// ── Bandwidth detection — progressive asset loading ──────────────────────────

export type BandwidthTier = 'fast' | 'medium' | 'slow' | 'unknown'

/**
 * Detect effective network bandwidth tier using the Network Information API
 * where available, falling back to 'unknown' (treated as 'fast') on browsers
 * that don't support it.
 *
 * Tiers:
 *   slow   → slow-2g / 2g   (≤ ~100 kbps) — skip heavy textures, use wireframe
 *   medium → 3g             (≤ ~1 Mbps)   — load reduced textures, defer animations
 *   fast   → 4g / wifi / unknown           — full quality
 */
export function detectBandwidthTier(): BandwidthTier {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection
    ?? (navigator as any).mozConnection
    ?? (navigator as any).webkitConnection

  if (!conn) return 'unknown'

  const type = conn.effectiveType as string
  if (type === 'slow-2g' || type === '2g') return 'slow'
  if (type === '3g')                        return 'medium'
  return 'fast'
}

/**
 * Returns true when the detected tier warrants skipping heavy Three.js assets.
 * Use this to gate texture loading, complex geometry, and animation loops.
 */
export function isLowBandwidth(): boolean {
  return detectBandwidthTier() === 'slow'
}

/**
 * Returns true when the device should receive reduced-quality assets
 * (low-poly geometry, no displacement maps, deferred LOD).
 */
export function isMediumBandwidth(): boolean {
  return detectBandwidthTier() === 'medium'
}

/**
 * Register a listener that fires when bandwidth tier changes mid-session
 * (e.g., user moves from WiFi to 4G to 3G). Fires immediately with current tier.
 * Returns an unsubscribe function.
 */
export function onBandwidthChange(cb: (tier: BandwidthTier) => void): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection
  cb(detectBandwidthTier())

  const handler = () => cb(detectBandwidthTier())
  conn?.addEventListener('change', handler)
  return () => conn?.removeEventListener('change', handler)
}
