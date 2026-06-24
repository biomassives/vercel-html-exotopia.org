/**
 * Void Oracle loader.
 *
 * Loads per-void galaxy population data from public/void-galaxies/{id}-viz.json.
 * Mirrors the galaxy-oracle.ts pattern: fetch-on-demand, in-memory cache,
 * deduplicated concurrent requests.
 *
 * Usage:
 *   const data = await loadVoidOracle('bootes-void')
 *   if (data) {
 *     // data.galaxies, data.catalog_count, data.radius_mpc, etc.
 *   }
 */

import type { VoidOracleFile } from 'src/data/void-oracle.types'

const VOID_BASE = '/void-galaxies'

const _cache:    Map<string, VoidOracleFile | null>           = new Map()
const _inflight: Map<string, Promise<VoidOracleFile | null>>  = new Map()

/**
 * Load void galaxy population for a named void.
 * voidId must match the void_id in the JSON file, e.g. 'bootes-void'.
 * Returns null if the file is absent or fails to load.
 */
export async function loadVoidOracle (voidId: string): Promise<VoidOracleFile | null> {
  if (_cache.has(voidId)) return _cache.get(voidId)!

  const existing = _inflight.get(voidId)
  if (existing) return existing

  const p = (async (): Promise<VoidOracleFile | null> => {
    try {
      const res = await fetch(`${VOID_BASE}/${voidId}-viz.json`)
      if (!res.ok) { _cache.set(voidId, null); return null }
      const data = await res.json() as VoidOracleFile
      _cache.set(voidId, data)
      return data
    } catch {
      _cache.set(voidId, null)
      return null
    }
  })()

  _inflight.set(voidId, p)
  const result = await p
  _inflight.delete(voidId)
  return result
}

/** Void ID → viz JSON filename stem — mirrors the fetch script convention */
export function voidIdFromName (voidName: string): string {
  return voidName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip diacritics (Boötes → Bootes)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')
}
