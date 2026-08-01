import { ref, computed } from 'vue'
import { safeRead, safeWrite } from './storage-cipher'

const STORAGE_KEY = 'e8.1'   // opaque — was 'exotopia_settlements_v1'

export interface SettlementRecord {
  key: string           // unique ID — see makeSettlementKey()
  type: 'surface' | 'cluster' | 'moon' | 'orbital' | 'bh-orbital' | 'stellar-orbital' | 'lunar-orbital'
  planetName: string
  hostname: string
  exolocation: string   // full address string for the deed
  displayName: string   // human-readable label for lists/UI
  createdAt: string     // ISO 8601
  lat?: number
  lon?: number
  clusterSlug?: string
  memberId?: string
  objects?: string[]    // unlocked reward-catalog object keys attached to this settlement
}

// ── Helpers ─────────────────────────────────────────────────────────────────
//
// Every settlement key format below uses ':' as its field separator, and
// every field is ultimately sourced from a route param or query string (see
// SurfaceViewPage/StationInteriorPage/ClusterSurfacePage/MintPage etc.) — i.e.
// user-editable. A real designation/slug/label never contains ':', but
// another settlement's own key always does, so rejecting any ':' in these
// fields is a structural guard against building one settlement's address out
// of another settlement's address (e.g. a moon "orbiting" an orbital station,
// or a surface settlement keyed under a cluster world) — an unrealistic
// drill-down nesting the UI has no representation for. Same guard as
// moon-settlement.ts's assertBareName, kept local to each file per call-site
// count.

function assertBareField(fnName: string, field: string, value: string): void {
  if (value.includes(':')) {
    throw new Error(
      `${fnName}: ${field} must be a bare designation, not a settlement key (got "${value}"). ` +
      `Nesting one settlement's key inside another is not supported.`
    )
  }
}

/** Canonical key for a NASA exoplanet surface settlement. */
export function surfaceKey(planetName: string): string {
  assertBareField('surfaceKey', 'planetName', planetName)
  return `surface:${planetName}`
}

/** Canonical key for a cluster-world settlement. */
export function clusterKey(clusterSlug: string, memberId: string, systemName: string, planetLabel: string): string {
  assertBareField('clusterKey', 'clusterSlug', clusterSlug)
  assertBareField('clusterKey', 'memberId', memberId)
  assertBareField('clusterKey', 'systemName', systemName)
  assertBareField('clusterKey', 'planetLabel', planetLabel)
  return `cluster:${clusterSlug}:${memberId}:${systemName}:${planetLabel}`
}

/**
 * Canonical key for a moon settlement.
 *
 * planetName must be a bare NASA-archive planet designation (never contains
 * ':') — this is the structural guard against moon-of-moon nesting. Rejecting
 * any ':' here means a moon can never be built with another settlement —
 * moon included — as its parent, by construction, without needing a depth
 * counter or allowed-transition state machine.
 */
export function moonKey(planetName: string, moonIdx: number, coordVariant: string): string {
  assertBareField('moonKey', 'planetName', planetName)
  return `moon:${planetName}:${moonIdx}:${coordVariant}`
}

/** Canonical key for a bodyless orbital settlement (stellar/planetary/lunar orbit, or a black-hole zone). */
export function orbitalKey(coordSystem: string, hostname: string, refName?: string): string {
  assertBareField('orbitalKey', 'coordSystem', coordSystem)
  assertBareField('orbitalKey', 'hostname', hostname)
  if (refName !== undefined) assertBareField('orbitalKey', 'refName', refName)
  return refName ? `${coordSystem}:${hostname}:${refName}` : `${coordSystem}:${hostname}`
}

// ── Reverse routing (address → route path) ───────────────────────────────────
//
// Used by GalleryNodePage.vue's "visit this settlement" link. Only handles key
// shapes that carry enough information to reconstruct their route on their
// own, resolvable for ANY visitor — not just the settlement's own browser
// (settlements are localStorage-only per SETTLEMENT_ADDRESS_API.md, so a
// visitor never has the author's SettlementRecord to look up):
//   - surface:<planetName>   — hostname isn't in the key, but it's a lookup
//     against the public static exoplanet-archive data (galaxy store), not
//     anything user-specific, so any visitor's browser can resolve it.
//   - <coordSystem>:<hostname>[:<refName>] (orbital/station keys) — both
//     fields the station-interior route needs are already in the key.
// moon:/cluster: keys don't carry enough to reconstruct losslessly (a moon's
// parent hostname isn't stored in moonKey; a cluster key's systemName isn't
// the systemIdx its route needs) — return null rather than guess wrong.

export interface ExolocRoute { path: string }

export function resolveExolocRoute(
  address: string,
  getPlanetHostname: (planetName: string) => string | undefined,
): ExolocRoute | null {
  const parts  = address.split(':')
  const prefix = parts[0] ?? ''

  if (prefix === 'surface') {
    const planetName = parts.slice(1).join(':')
    const hostname    = planetName ? getPlanetHostname(planetName) : undefined
    if (!hostname) return null
    return { path: `/surface/${encodeURIComponent(hostname)}/${encodeURIComponent(planetName)}` }
  }

  if (prefix.startsWith('exo-') && prefix.endsWith('-v1')) {
    const [, hostname, refName] = parts
    if (!hostname) return null
    const query = `?coordSystem=${encodeURIComponent(prefix)}`
    return { path: refName
      ? `/station-interior/${encodeURIComponent(hostname)}/${encodeURIComponent(refName)}${query}`
      : `/station-interior/${encodeURIComponent(hostname)}${query}` }
  }

  return null
}

// ── Reactive store ───────────────────────────────────────────────────────────

function loadFromStorage(): SettlementRecord[] {
  return safeRead<SettlementRecord[]>(STORAGE_KEY, [])
}

function saveToStorage(records: SettlementRecord[]) {
  safeWrite(STORAGE_KEY, records)
}

// Single shared reactive state (module-level singleton)
const _records = ref<SettlementRecord[]>(loadFromStorage())

export function useSettlements() {
  const settlements = computed(() => _records.value)

  function hasSettlement(key: string): boolean {
    return _records.value.some(r => r.key === key)
  }

  function getSettlement(key: string): SettlementRecord | undefined {
    return _records.value.find(r => r.key === key)
  }

  function addSettlement(record: Omit<SettlementRecord, 'createdAt'>) {
    if (hasSettlement(record.key)) return  // idempotent
    const full: SettlementRecord = { ...record, createdAt: new Date().toISOString() }
    _records.value = [..._records.value, full]
    saveToStorage(_records.value)
  }

  function updateSettlement(key: string, patch: Partial<SettlementRecord>) {
    _records.value = _records.value.map(r => r.key === key ? { ...r, ...patch } : r)
    saveToStorage(_records.value)
  }

  function removeSettlement(key: string) {
    _records.value = _records.value.filter(r => r.key !== key)
    saveToStorage(_records.value)
  }

  return { settlements, hasSettlement, getSettlement, addSettlement, updateSettlement, removeSettlement }
}
