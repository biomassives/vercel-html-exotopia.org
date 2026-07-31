/**
 * Surface classification — decides whether a settlement destination has a
 * walkable solid surface at all. Two independent vocabularies:
 *   - NASA-catalogued planets (GalaxyPage.vue)  → public/topo-params.json (surface_type)
 *   - Cluster planets (ClusterSystemPage.vue)   → ClusterPlanet.type (already in memory)
 * Loader mirrors src/lib/void-oracle.ts::loadVoidOracle() — module-scope
 * cache + inflight dedup, fetch once per session.
 */

export type SurfaceType =
  | 'gas_giant' | 'hot_gas_giant' | 'magma_ocean' | 'lava'
  | 'basalt' | 'desert' | 'frozen_rocky' | 'hycean' | 'iron_rocky'
  | 'ocean' | 'rocky' | 'sub_neptune' | 'super_earth' | 'unknown'

type TopoParams = Record<string, { surface_type: SurfaceType } & Record<string, unknown>>

const TOPO_URL = '/topo-params.json'

let _cache:    TopoParams | null | undefined     = undefined
let _inflight: Promise<TopoParams | null> | null = null

async function loadTopoParams(): Promise<TopoParams | null> {
  if (_cache !== undefined) return _cache
  if (_inflight) return _inflight

  _inflight = (async (): Promise<TopoParams | null> => {
    try {
      const res = await fetch(TOPO_URL)
      if (!res.ok) { _cache = null; return null }
      const data = await res.json() as TopoParams
      _cache = data
      return data
    } catch {
      _cache = null
      return null
    }
  })()

  const result = await _inflight
  _inflight = null
  return result
}

export const NO_GROUND_SURFACE_TYPES: ReadonlySet<SurfaceType> = new Set([
  'gas_giant', 'hot_gas_giant', 'magma_ocean', 'lava',
  // hycean = deep H2O ocean under an H2-rich envelope (generate-topo-params.py) —
  // no solid crust to walk on, same category as the gas giants above.
  'hycean',
])

/** Looks up a NASA-catalogued planet's surface_type. Returns null if unresolved (bodyless/malformed address). */
export async function getSurfaceType(plName: string): Promise<SurfaceType | null> {
  const data = await loadTopoParams()
  return data?.[plName]?.surface_type ?? null
}

export async function hasNoSolidGround(plName: string): Promise<boolean> {
  const type = await getSurfaceType(plName)
  return type != null && NO_GROUND_SURFACE_TYPES.has(type)
}

// ── Cluster planets — type already in memory, no fetch needed ────────────────

export const NO_GROUND_CLUSTER_TYPES: ReadonlySet<string> = new Set([
  'gas_giant', 'hot_jupiter', 'lava_world',
])

export function clusterPlanetHasNoSolidGround(type: string): boolean {
  return NO_GROUND_CLUSTER_TYPES.has(type)
}

// ── Bodyless coordinate systems (no planet at all) ────────────────────────────

export const BODYLESS_COORD_SYSTEMS = [
  'exo-stellar-orbital-v1', 'exo-orbital-v1', 'exo-lunar-orbital-v1',
] as const

export function isBodylessCoordSystem(v: string): boolean {
  return (BODYLESS_COORD_SYSTEMS as readonly string[]).includes(v)
}
