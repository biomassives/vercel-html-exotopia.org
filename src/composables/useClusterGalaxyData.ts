/**
 * useClusterGalaxyData — authoritative data access for cluster-derived galaxies.
 *
 * Data hierarchy for each galaxy member:
 *   1. Generated JSON  — /star-systems/{slug}/{id}.json   (pipeline output, preferred)
 *   2. Members catalog — /clusters/{slug}-members.json    (hubble type + count for procedural gen)
 *   3. Pure procedural — seeded from cluster+galaxy id    (always succeeds, last resort)
 *
 * The composable is stateless and cache-friendly: every call for the same
 * (slug, id) pair returns the same fetch promise until the component unmounts.
 * Use it from any page that needs cluster galaxy data without duplicating the
 * 3-stage fallback logic.
 */

import { ref, shallowRef, type Ref } from 'vue'

// ── Public types ───────────────────────────────────────────────────────────────

export interface ClusterPlanet {
  id:               string
  label:            string
  type:             string
  radius_earth:     number
  mass_earth:       number
  period_days:      number
  semi_major_au:    number
  eq_temp_k:        number
  atmosphere:       string
  settlement_tier:  string
}

export interface ClusterStarSystem {
  id:            string
  label:         string
  spectral_type: string
  mass_sol:      number
  feh:           number
  age_gyr:       number
  luminosity_sol: number
  coord_system:  string
  settlement_tier: string
  environment_note?: string
  planets:       ClusterPlanet[]
}

export interface ClusterGalaxyDoc {
  galaxy_id:        string
  galaxy_name:      string
  galaxy_hubble:    string
  cluster:          string
  cluster_slug:     string
  cluster_dist_mpc: number
  generation:       string
  environment?: {
    description:       string
    radiation_factor:  number
    metallicity_feh:   number
    agn:               boolean
    cooling_flow:      boolean
    ram_pressure:      boolean
    merger:            boolean
  }
  provenance?: {
    observatory_report?: string
    generated_at?:       string
    algorithm_version?:  string
    nft_zones?:          string[]
  }
  /**
   * Compact population descriptor — written by add_population_blocks.py.
   * nav_count is the total display density; the frontend generates background
   * positions from the seed using mulberry32 (no extra network data needed).
   */
  population?: {
    nav_count: number
    seed:      number
  }
  star_systems: ClusterStarSystem[]
  /** Data source used when loading. Not in the JSON file — set by this composable. */
  _source?: 'generated' | 'procedural-catalog' | 'procedural-fallback'
}

// ── Background field types ─────────────────────────────────────────────────────

/**
 * Flat typed-array representation of a galaxy's background stellar population.
 * Generated entirely client-side from the population descriptor — zero extra
 * network requests.  Suitable for a single THREE.Points draw call.
 */
export interface BackgroundField {
  positions: Float32Array  // count × 3  (x, y, z in scene units)
  colors:    Float32Array  // count × 3  (r, g, b  0–1 linear)
  count:     number
}

// ── Seeded RNG (Mulberry32) ────────────────────────────────────────────────────

export function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function strSeed(s: string): number {
  return s.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0) & 0xFFFFFFFF
}

// ── Spectral distribution tables ───────────────────────────────────────────────

const SPECTRAL_BY_MORPH: Record<string, Array<[string, number]>> = {
  E:    [['K', 0.45], ['M', 0.30], ['G', 0.15], ['F', 0.07], ['A', 0.03]],
  cD:   [['K', 0.48], ['M', 0.32], ['G', 0.13], ['F', 0.05], ['A', 0.02]],
  S0:   [['K', 0.38], ['G', 0.28], ['M', 0.20], ['F', 0.10], ['A', 0.04]],
  Sa:   [['G', 0.32], ['K', 0.28], ['F', 0.22], ['M', 0.12], ['A', 0.06]],
  Sb:   [['G', 0.30], ['F', 0.25], ['K', 0.22], ['A', 0.12], ['M', 0.08], ['B', 0.03]],
  Irr:  [['M', 0.35], ['K', 0.25], ['G', 0.18], ['F', 0.12], ['A', 0.07], ['B', 0.03]],
  dE:   [['K', 0.50], ['M', 0.35], ['G', 0.10], ['F', 0.05]],
  dIrr: [['M', 0.40], ['K', 0.30], ['G', 0.18], ['A', 0.08], ['B', 0.04]],
}

const PROC_SYSTEM_COUNT: Record<string, number> = {
  cD: 80, E: 60, S0: 45, Sa: 55, Sb: 65, Irr: 35, dE: 20, dIrr: 15,
}

function pickSpectral(rng: () => number, morph: string): string {
  const dist = SPECTRAL_BY_MORPH[morph] ?? SPECTRAL_BY_MORPH['E']!
  let cum = 0; const x = rng()
  for (const [spec, wt] of dist) { cum += wt; if (x < cum) return spec }
  return dist[0]![0]
}

const BASE_EQT: Record<string, number> = { M: 180, K: 220, G: 270, F: 310, A: 360, B: 420 }

/** Build a full procedural ClusterGalaxyDoc from morph type and seed strings. */
function buildProceduralDoc(
  galaxyId:    string,
  morph:       string,
  clusterSlug: string,
  clusterName: string,
  distMpc:     number,
  count:       number,
): ClusterGalaxyDoc {
  const rng    = mulberry32(strSeed(`${clusterSlug}-${galaxyId}`))
  const systems: ClusterStarSystem[] = []

  for (let i = 0; i < count; i++) {
    const spec      = pickSpectral(rng, morph)
    const eqtBase   = BASE_EQT[spec] ?? 280
    const eqtK      = Math.round(eqtBase + (rng() - 0.5) * 120)
    const numPlanets = Math.max(1, Math.round(1.5 + rng() * 4))
    const planets: ClusterPlanet[] = []

    for (let p = 0; p < numPlanets; p++) {
      const sma = 0.04 + rng() * 2.5
      const pEqt = Math.round(eqtK * Math.pow(0.5 / Math.max(sma, 0.05), 0.5))
      planets.push({
        id:              `${galaxyId}-s${String(i+1).padStart(2,'0')}-p${String(p+1).padStart(2,'0')}`,
        label:           `Planet ${p + 1}`,
        type:            pEqt > 400 ? 'hot_rocky' : pEqt < 150 ? 'ice_world' : 'rocky_barren',
        radius_earth:    0.6 + rng() * 2.0,
        mass_earth:      0.3 + rng() * 5.0,
        period_days:     Math.round(sma * sma * 365),
        semi_major_au:   Math.round(sma * 100) / 100,
        eq_temp_k:       pEqt,
        atmosphere:      rng() > 0.6 ? 'thin' : 'none',
        settlement_tier: 'theoretical',
      })
    }

    systems.push({
      id:            `${galaxyId}-s${String(i+1).padStart(2,'0')}`,
      label:         `${galaxyId.toUpperCase()}-SYS-${String(i+1).padStart(2,'0')}`,
      spectral_type: `${spec}5V`,
      mass_sol:      spec === 'M' ? 0.15 + rng() * 0.35 : spec === 'K' ? 0.5 + rng() * 0.35 : 0.9 + rng() * 0.6,
      feh:           (rng() - 0.5) * 0.6,
      age_gyr:       3 + rng() * 9,
      luminosity_sol: spec === 'M' ? 0.001 + rng() * 0.05 : spec === 'K' ? 0.05 + rng() * 0.5 : 0.5 + rng() * 5,
      coord_system:  'cluster-relative-v1',
      settlement_tier: 'theoretical',
      planets,
    })
  }

  return {
    galaxy_id:        galaxyId,
    galaxy_name:      galaxyId,
    galaxy_hubble:    morph,
    cluster:          clusterName,
    cluster_slug:     clusterSlug,
    cluster_dist_mpc: distMpc,
    generation:       'v1-procedural',
    star_systems:     systems,
    _source:          'procedural-fallback',
  }
}

// ── Background stellar population ─────────────────────────────────────────────

/** sRGB triplets matching SPECTRAL_COLOR in ClusterGalaxyPage */
const SPECTRAL_RGB: Record<string, readonly [number, number, number]> = {
  O: [0.61, 0.69, 1.00], B: [0.67, 0.75, 1.00], A: [0.79, 0.85, 1.00],
  F: [0.98, 0.97, 1.00], G: [1.00, 0.89, 0.67], K: [1.00, 0.75, 0.43], M: [1.00, 0.51, 0.31],
}

/** Fallback nav counts when population block is absent (procedural-fallback path) */
const BG_NAV_COUNT: Record<string, number> = {
  cD: 5000, E: 1500, S0: 1100, Sa: 2000, Sb: 2500, Irr: 800, dE: 400, dIrr: 250,
}

/**
 * Build a background stellar population field from a galaxy doc.
 *
 * Positions are distributed appropriate to galaxy morphology:
 *   Ellipticals  — 3D oblate spheroid with Sersic-like r^0.6 density
 *   Spirals      — thin disk + logarithmic arms + central bulge
 *   Irregulars   — clumpy random scatter
 *
 * All stars in the background layer are non-raycasted — visual density only.
 * Anchor systems (doc.star_systems) remain the clickable, navigable subset.
 *
 * @param diskRadius  Scene-unit radius matching the anchor orbit range (default 2.5)
 */
export function buildBackgroundField(doc: ClusterGalaxyDoc, diskRadius = 2.5): BackgroundField {
  const morph    = doc.galaxy_hubble
  const navCount = doc.population?.nav_count ?? BG_NAV_COUNT[morph] ?? 1000
  const bgCount  = Math.max(0, navCount - doc.star_systems.length)

  // Use population.seed when available (written by Python script), else derive
  const seed     = doc.population?.seed ?? strSeed(`${doc.cluster_slug}-${doc.galaxy_id}-bg`)
  const rng      = mulberry32(seed)

  const positions = new Float32Array(bgCount * 3)
  const colors    = new Float32Array(bgCount * 3)

  const isSpiral  = morph === 'Sa' || morph === 'Sb'
  const isIrr     = morph === 'Irr' || morph === 'dIrr'
  const isDwarf   = morph === 'dE'  || morph === 'dIrr'
  const R         = isDwarf ? diskRadius * 0.6 : diskRadius
  // Elliptical axis ratio: cD nearly round, S0 flattened
  const axisQ     = morph === 'cD' ? 0.88 : morph === 'E' ? 0.72 : morph === 'S0' ? 0.42 : 0.78

  for (let i = 0; i < bgCount; i++) {
    let x: number, y: number, z: number

    if (isSpiral) {
      if (rng() < 0.22) {
        // Central bulge component (~22 % of stars)
        const br  = Math.pow(rng(), 1.4) * R * 0.35
        const bth = rng() * Math.PI * 2
        const bph = Math.acos(2 * rng() - 1)
        x = br * Math.sin(bph) * Math.cos(bth)
        y = br * Math.sin(bph) * Math.sin(bth) * 0.55
        z = br * Math.cos(bph) * 0.28
      } else {
        // Logarithmic spiral arms
        const arms   = morph === 'Sb' ? 3 : 2
        const arm    = Math.floor(rng() * arms)
        const t      = 0.3 + rng() * Math.PI * 1.7
        const r      = Math.min(R, R * 0.08 * Math.exp(t * 0.23))
        const offset = (rng() - 0.5) * R * 0.22
        const angle  = t + (arm / arms) * Math.PI * 2
        x = r * Math.cos(angle) + offset
        y = r * Math.sin(angle) + (rng() - 0.5) * R * 0.22
        z = (rng() - 0.5) * R * 0.04
      }
    } else if (isIrr) {
      // Clumpy irregular — a few random density peaks
      const clump = Math.floor(rng() * 4)
      const cx    = (clump % 2 === 0 ? 0.3 : -0.3) * R
      const cy    = (clump < 2       ? 0.2 : -0.2) * R
      x = cx + (rng() - 0.5) * R * 0.9
      y = cy + (rng() - 0.5) * R * 0.9
      z = (rng() - 0.5) * R * 0.55
    } else {
      // Elliptical/lenticular: oblate spheroid with concentrated core
      const r   = Math.pow(rng(), 0.6) * R
      const th  = rng() * Math.PI * 2
      const phi = Math.acos(2 * rng() - 1)
      x = r * Math.sin(phi) * Math.cos(th)
      y = r * Math.sin(phi) * Math.sin(th) * axisQ
      z = r * Math.cos(phi) * axisQ * 0.75
    }

    positions[i * 3]     = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    const spec   = pickSpectral(rng, morph)
    const rgb    = SPECTRAL_RGB[spec] ?? SPECTRAL_RGB['K']!
    const bright = 0.55 + rng() * 0.45
    colors[i * 3]     = rgb[0] * bright
    colors[i * 3 + 1] = rgb[1] * bright
    colors[i * 3 + 2] = rgb[2] * bright
  }

  return { positions, colors, count: bgCount }
}

// ── Module-level fetch cache (survives component re-mounts within a session) ──

const _cache = new Map<string, Promise<ClusterGalaxyDoc>>()

async function _fetchGalaxyDoc(clusterSlug: string, galaxyId: string): Promise<ClusterGalaxyDoc> {
  const normalId = galaxyId.replace(/\s+/g, '')

  // Stage 1: Generated star-system JSON
  try {
    const res = await fetch(`/star-systems/${clusterSlug}/${normalId}.json`)
    if (res.ok) {
      const doc = await res.json() as ClusterGalaxyDoc
      doc._source = 'generated'
      return doc
    }
  } catch { /* fall through */ }

  // Stage 2: Members catalog → hubble type → seeded procedural
  try {
    const res = await fetch(`/clusters/${clusterSlug}-members.json`)
    if (res.ok) {
      const data = await res.json() as {
        cluster: string; dist_mpc?: number
        members: Array<{ id: string; hubble: string; star_system_count?: number }>
      }
      const member = data.members.find(m => m.id === normalId || m.id === galaxyId)
      if (member) {
        const count = member.star_system_count ?? PROC_SYSTEM_COUNT[member.hubble] ?? 40
        const doc = buildProceduralDoc(
          normalId, member.hubble, clusterSlug,
          data.cluster, data.dist_mpc ?? 65, count,
        )
        doc._source = 'procedural-catalog'
        return doc
      }
    }
  } catch { /* fall through */ }

  // Stage 3: Pure procedural fallback (no network data at all)
  return buildProceduralDoc(normalId, 'E', clusterSlug, clusterSlug.replace(/-/g, ' '), 65, 40)
}

export function fetchGalaxyDoc(clusterSlug: string, galaxyId: string): Promise<ClusterGalaxyDoc> {
  const key = `${clusterSlug}/${galaxyId}`
  if (!_cache.has(key)) _cache.set(key, _fetchGalaxyDoc(clusterSlug, galaxyId))
  return _cache.get(key)!
}

// ── Composable ─────────────────────────────────────────────────────────────────

export interface UseClusterGalaxyDataReturn {
  loading:     Ref<boolean>
  error:       Ref<string>
  doc:         Ref<ClusterGalaxyDoc | null>
  /** Convenience: number of star systems in the doc */
  systemCount: Ref<number>
  load:        () => Promise<void>
}

/**
 * Reactive composable for loading a single cluster galaxy's data.
 *
 * Usage:
 *   const { loading, error, doc, load } = useClusterGalaxyData('shapley', 'A3558-BCG')
 *   onMounted(() => load())
 */
export function useClusterGalaxyData(
  clusterSlug: string | Ref<string>,
  galaxyId:    string | Ref<string>,
): UseClusterGalaxyDataReturn {
  const loading     = ref(false)
  const error       = ref('')
  const doc         = shallowRef<ClusterGalaxyDoc | null>(null)
  const systemCount = ref(0)

  const slug = typeof clusterSlug === 'string' ? clusterSlug : clusterSlug.value
  const id   = typeof galaxyId    === 'string' ? galaxyId    : galaxyId.value

  async function load() {
    loading.value = true; error.value = ''
    try {
      const result  = await fetchGalaxyDoc(slug, id)
      doc.value         = result
      systemCount.value = result.star_systems.length
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  return { loading, error, doc, systemCount, load }
}

/**
 * Prefetch galaxy data for a list of member IDs — call from ClusterInteriorPage
 * when sprites are first built to warm the cache before navigation.
 */
export function prefetchClusterGalaxies(clusterSlug: string, memberIds: string[]): void {
  for (const id of memberIds) fetchGalaxyDoc(clusterSlug, id)
}

/**
 * Light summary for hover previews — returns key fields without loading the full doc.
 * Resolves from cache if already loaded; otherwise triggers background fetch.
 */
export async function getGalaxySummary(clusterSlug: string, galaxyId: string) {
  const doc = await fetchGalaxyDoc(clusterSlug, galaxyId)
  return {
    galaxy_id:        doc.galaxy_id,
    galaxy_hubble:    doc.galaxy_hubble,
    cluster:          doc.cluster,
    cluster_dist_mpc: doc.cluster_dist_mpc,
    system_count:     doc.star_systems.length,
    source:           doc._source,
    observatory_report: doc.provenance?.observatory_report,
  }
}
