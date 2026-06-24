/**
 * Galaxy Oracle loader.
 *
 * Loads pre-generated cluster member data from public/galaxy-oracle/{safe_id}.json.
 * Falls back gracefully (returns null) when the oracle file is absent — CosmicPage
 * then uses its existing procedural spawnStarField path.
 *
 * All fetches are cached in memory; each cluster file is fetched at most once per
 * page session.
 */

import type { OracleCluster, OracleIndex } from 'src/data/galaxy-oracle.types'

const ORACLE_BASE = '/galaxy-oracle'

let _index: OracleIndex | null | 'pending' = null
const _clusterCache = new Map<string, OracleCluster | null>()
const _inflight      = new Map<string, Promise<OracleCluster | null>>()

async function loadIndex(): Promise<OracleIndex | null> {
  if (_index !== null && _index !== 'pending') return _index
  if (_index === 'pending') {
    // wait for the in-progress fetch
    await new Promise<void>(r => {
      const poll = setInterval(() => {
        if (_index !== 'pending') { clearInterval(poll); r() }
      }, 20)
    })
    return _index as OracleIndex | null
  }
  _index = 'pending'
  try {
    const res = await fetch(`${ORACLE_BASE}/index.json`)
    if (!res.ok) { _index = null; return null }
    _index = await res.json() as OracleIndex
    return _index
  } catch {
    _index = null
    return null
  }
}

/**
 * Load oracle data for a single XMM cluster by its catalog name.
 * Returns null if the oracle index is missing or the cluster has no oracle file.
 */
export async function loadOracleCluster(clusterName: string): Promise<OracleCluster | null> {
  if (_clusterCache.has(clusterName)) return _clusterCache.get(clusterName)!

  // deduplicate concurrent requests for the same cluster
  const existing = _inflight.get(clusterName)
  if (existing) return existing

  const p = (async (): Promise<OracleCluster | null> => {
    const index = await loadIndex()
    if (!index) { _clusterCache.set(clusterName, null); return null }

    const safeId = index.id_map[clusterName]
    if (!safeId) { _clusterCache.set(clusterName, null); return null }

    try {
      const res = await fetch(`${ORACLE_BASE}/${safeId}.json`)
      if (!res.ok) { _clusterCache.set(clusterName, null); return null }
      const data = await res.json() as OracleCluster
      _clusterCache.set(clusterName, data)
      return data
    } catch {
      _clusterCache.set(clusterName, null)
      return null
    }
  })()

  _inflight.set(clusterName, p)
  const result = await p
  _inflight.delete(clusterName)
  return result
}

/** Warm the oracle index in the background (call once at app start) */
export function prewarmOracleIndex(): void {
  void loadIndex()
}
