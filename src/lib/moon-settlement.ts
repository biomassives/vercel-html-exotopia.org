/**
 * src/lib/moon-settlement.ts
 *
 * Trophic hierarchy for moon-relative settlement locations.
 *
 * The term "trophic" (from Greek τροφή, nourishment) is borrowed from ecology
 * to describe a position's place in the gravitational/energetic food chain:
 *   L1 STELLAR  — exo-stellar-orbital-v1     (star orbit; energy source)
 *   L2 PLANETARY— exo-surface-v1 / orbital   (planet surface/orbit)
 *   L3 LUNAR    — exo-lunar-orbital-v1        (moon orbit)
 *   L4 SUBLUNARY— exo-moon-surface-v1         (ON the moon)  ← this file
 *   L5 SYZYGY   — exo-moon-lagrange-v1        (Lagrange points of moon-planet)
 *   L6 LIMINAL  — exo-moon-interface-v1       (Hill sphere / tidal lock / Roche)
 *
 * Physics notes:
 *   Lagrange L1  — between moon and planet (unstable, gateway use)
 *   Lagrange L2  — behind moon from planet (unstable, observatory use)
 *   Lagrange L4  — 60° ahead in moon orbit (STABLE — trojan settlements)
 *   Lagrange L5  — 60° behind in moon orbit (STABLE — trojan settlements)
 *   Hill sphere  — radius where moon's gravity dominates: a(m_moon/3m_planet)^1/3
 *   Roche limit  — d_fluid = 2.44 R_planet (m_planet/m_moon)^1/3
 *   Tidal lock   — applies to synchronously rotating moons (one face always toward planet)
 */

// ── Trophic level definitions ─────────────────────────────────────────────────

export interface TrophicLevel {
  level:       number         // 1–6
  code:        string         // e.g. 'L4_SUBLUNARY'
  name:        string
  coordSystem: string         // the exolocation coordinate system identifier
  description: string
  stability:   'stable' | 'unstable' | 'semi-stable' | 'surface'
  accessDiff:  'low' | 'medium' | 'high' | 'extreme'
  notes:       string
}

export const TROPHIC_HIERARCHY: TrophicLevel[] = [
  {
    level: 1, code: 'L1_STELLAR', name: 'Stellar Zone',
    coordSystem: 'exo-stellar-orbital-v1',
    description: 'Orbital zone around the host star — the highest-energy trophic level.',
    stability: 'stable', accessDiff: 'extreme',
    notes: 'Requires shielding against stellar radiation. Energy-rich but hostile.',
  },
  {
    level: 2, code: 'L2_PLANETARY', name: 'Planetary Surface/Orbit',
    coordSystem: 'exo-surface-v1',
    description: 'On or in orbit around a confirmed exoplanet.',
    stability: 'stable', accessDiff: 'medium',
    notes: 'Primary habitation tier. HZ planets most suitable for open-air biomes.',
  },
  {
    level: 3, code: 'L3_LUNAR', name: 'Moon Orbit',
    coordSystem: 'exo-lunar-orbital-v1',
    description: 'In orbit around an exomoon — above the moon\'s surface.',
    stability: 'stable', accessDiff: 'high',
    notes: 'Parent planet is highly visible from low moon orbit. Good for relay stations.',
  },
  {
    level: 4, code: 'L4_SUBLUNARY', name: 'Moon Surface',
    coordSystem: 'exo-moon-surface-v1',
    description: 'Directly on the surface of an exomoon.',
    stability: 'surface', accessDiff: 'high',
    notes: 'Parent planet may dominate the sky depending on orbital distance. Tidal heating may provide subsurface liquid water (e.g. Europa-type).',
  },
  {
    level: 5, code: 'L5_SYZYGY', name: 'Moon–Planet Lagrange',
    coordSystem: 'exo-moon-lagrange-v1',
    description: 'At one of the four Lagrange equilibrium points of the moon–planet system.',
    stability: 'semi-stable', accessDiff: 'high',
    notes: 'L4/L5 are gravitationally stable (trojan points). L1/L2 are unstable but strategically valuable as gateways and observatories.',
  },
  {
    level: 6, code: 'L6_LIMINAL', name: 'Moon–Planet Interface',
    coordSystem: 'exo-moon-interface-v1',
    description: 'In the transition zone between a moon\'s gravitational dominance and its parent planet\'s dominance.',
    stability: 'unstable', accessDiff: 'extreme',
    notes: 'Includes Hill sphere boundary, Roche limit zone, tidal lock transition region. Exotic physics; suited to specialist research stations.',
  },
]

// ── New coordinate system types ───────────────────────────────────────────────

export const MOON_COORD_SYSTEMS = [
  'exo-moon-surface-v1',
  'exo-moon-lagrange-v1',
  'exo-moon-interface-v1',
] as const

export type MoonCoordSystem = typeof MOON_COORD_SYSTEMS[number]

// ── Lagrange point designations ───────────────────────────────────────────────

export type LagrangePoint = 'L1' | 'L2' | 'L4' | 'L5'

export interface LagrangePointInfo {
  id:          LagrangePoint
  name:        string
  stability:   'stable' | 'unstable'
  description: string
  useCase:     string
  angularOffset: number  // degrees from moon in its orbit (approximate)
}

export const LAGRANGE_POINTS: LagrangePointInfo[] = [
  {
    id: 'L1', name: 'Inner Lagrange (L1)',
    stability: 'unstable', angularOffset: 0,
    description: 'Between the moon and its parent planet. Gravity from both bodies cancels.',
    useCase: 'Gateway station, transit hub, customs checkpoint between planet and moon systems.',
  },
  {
    id: 'L2', name: 'Outer Lagrange (L2)',
    stability: 'unstable', angularOffset: 180,
    description: 'Directly behind the moon as seen from the parent planet.',
    useCase: 'Deep-space observatory (shielded from planet radio noise), communication relay.',
  },
  {
    id: 'L4', name: 'Leading Trojan (L4)',
    stability: 'stable', angularOffset: 60,
    description: '60° ahead of the moon in its orbital path. Gravitationally stable — trojan position.',
    useCase: 'Permanent settlement, agricultural ring, energy collection station. Most viable for long-term habitation.',
  },
  {
    id: 'L5', name: 'Trailing Trojan (L5)',
    stability: 'stable', angularOffset: -60,
    description: '60° behind the moon in its orbital path. Gravitationally stable — trojan position.',
    useCase: 'Permanent settlement, material storage, manufacturing station. Complementary to L4.',
  },
]

// ── Interface zone types ──────────────────────────────────────────────────────

export type InterfaceZoneType =
  | 'hill-sphere'       // boundary of moon gravitational dominance
  | 'roche-limit'       // inner boundary before tidal disruption
  | 'tidal-lock-zone'   // synchronous rotation transition region
  | 'magnetosphere'     // moon magnetosphere boundary (if applicable)
  | 'resonance-zone'    // orbital resonance with other moons

export interface InterfaceZoneInfo {
  id:          InterfaceZoneType
  name:        string
  description: string
  physics:     string
  useCase:     string
}

export const INTERFACE_ZONES: InterfaceZoneInfo[] = [
  {
    id: 'hill-sphere',
    name: 'Hill Sphere Boundary',
    description: 'The outer boundary of the moon\'s gravitational sphere of influence.',
    physics: 'r_H = a × ∛(m_moon / 3m_planet)  — typically 1–10% of moon\'s orbital radius.',
    useCase: 'Strategic gateway station marking the transition between planet-controlled and moon-controlled space. Customs / transit checkpoint.',
  },
  {
    id: 'roche-limit',
    name: 'Roche Limit Zone',
    description: 'The closest approach before tidal forces exceed the moon\'s self-gravity.',
    physics: 'd = 2.44 R_planet × ∛(ρ_planet / ρ_moon)  — inside this, natural moons cannot form.',
    useCase: 'Extreme-engineering research outpost. Resource extraction from ring material if present. Not suitable for conventional habitation.',
  },
  {
    id: 'tidal-lock-zone',
    name: 'Tidal Lock Transition',
    description: 'The orbital altitude region where a moon transitions between tidally locked and free rotation.',
    physics: 'Applies to moons in synchronous rotation — one face permanently toward the parent planet.',
    useCase: 'Observation post at the boundary between the always-lit (planet-facing) and always-dark (far-side) hemispheres.',
  },
  {
    id: 'magnetosphere',
    name: 'Magnetosphere Interface',
    description: 'The boundary of a moon\'s own magnetic field where it interacts with the parent planet\'s magnetosphere.',
    physics: 'Requires the moon to have an intrinsic magnetic field (like Ganymede). Creates a mini-magnetosphere bubble.',
    useCase: 'Radiation-shielded research station leveraging the magnetic anomaly. Rare and scientifically valuable.',
  },
  {
    id: 'resonance-zone',
    name: 'Orbital Resonance Zone',
    description: 'A region where a settlement\'s orbital period is in simple ratio to the moon\'s period (e.g. 1:2, 2:3).',
    physics: 'Mean motion resonance — analogous to Jupiter\'s Trojan asteroids but tuned to the moon\'s orbit.',
    useCase: 'Relay network station that passes the moon at predictable intervals. Communication and supply chain infrastructure.',
  },
]

// ── Reference body builders ───────────────────────────────────────────────────

export interface MoonReferenceBody {
  type:         'exoplanet_moon'
  moon_name:    string             // e.g. "Kepler-442b Moon I"
  moon_index:   number             // 1-based index (I, II, III…)
  parent_planet: string            // host planet pl_name
  host_star:    string             // host star hostname
  ra_deg:       number
  dec_deg:      number
  sy_dist_pc:   number | null
  nasa_archive_id?: string | null
  // Physical estimates (derived when NASA data not available)
  est_radius_km?:  number | null   // estimated moon radius
  est_mass_kg?:    number | null   // estimated moon mass
  est_orbital_km?: number | null   // estimated moon orbital radius from planet
  tidal_locked?:   boolean | null
}

export function buildMoonRefBody(
  parentPlanetName: string,
  hostStar:         string,
  moonIndex:        number,
  ra:               number,
  dec:              number,
  distPc:           number | null,
): MoonReferenceBody {
  const romanIndex = ['I','II','III','IV','V'][moonIndex - 1] ?? String(moonIndex)
  return {
    type:         'exoplanet_moon',
    moon_name:    `${parentPlanetName} Moon ${romanIndex}`,
    moon_index:   moonIndex,
    parent_planet: parentPlanetName,
    host_star:    hostStar,
    ra_deg:       ra,
    dec_deg:      dec,
    sy_dist_pc:   distPc,
    tidal_locked: null,   // unknown unless specified
  }
}

// ── Address string builders ───────────────────────────────────────────────────
//
// Same structural guard as settlements.ts::moonKey — parentPlanet/moonName
// must be bare designations, never another settlement's colon-delimited key,
// so a moon can't be built with a moon (or any other settlement) as its
// parent. Checked here rather than as a shared cross-module helper since this
// file has three call sites and settlements.ts has its own single one.

function assertBareName(field: 'parentPlanet' | 'moonName', value: string, fn: string): void {
  if (value.includes(':')) {
    throw new Error(
      `${fn}: ${field} must be a bare designation, not a settlement key (got "${value}"). ` +
      `Moons can only orbit planets — nesting under another settlement is not supported.`
    )
  }
}

/** Build the exolocation address string for a moon surface settlement. */
export function moonSurfaceAddress(
  parentPlanet: string,
  moonName:     string,
  lat:          number,
  lng:          number,
): string {
  assertBareName('parentPlanet', parentPlanet, 'moonSurfaceAddress')
  assertBareName('moonName', moonName, 'moonSurfaceAddress')
  return `exo-moon-surface-v1:${parentPlanet}:${moonName}:${lat.toFixed(4)},${lng.toFixed(4)}`
}

/** Build the exolocation address string for a moon Lagrange settlement. */
export function moonLagrangeAddress(
  parentPlanet: string,
  moonName:     string,
  point:        LagrangePoint,
): string {
  assertBareName('parentPlanet', parentPlanet, 'moonLagrangeAddress')
  assertBareName('moonName', moonName, 'moonLagrangeAddress')
  return `exo-moon-lagrange-v1:${parentPlanet}:${moonName}:${point}`
}

/** Build the exolocation address string for a moon interface zone settlement. */
export function moonInterfaceAddress(
  parentPlanet: string,
  moonName:     string,
  zone:         InterfaceZoneType,
): string {
  assertBareName('parentPlanet', parentPlanet, 'moonInterfaceAddress')
  assertBareName('moonName', moonName, 'moonInterfaceAddress')
  return `exo-moon-interface-v1:${parentPlanet}:${moonName}:${zone}`
}

// ── Feasibility assessment ────────────────────────────────────────────────────

export interface MoonSettlementFeasibility {
  score:      number   // 0–100, higher = more suitable
  tier:       'optimal' | 'viable' | 'challenging' | 'extreme'
  notes:      string[]
  warnings:   string[]
}

/** Rough feasibility estimate for a moon surface settlement.
 *  Uses planet equilibrium temperature as proxy for moon habitability. */
export function assessMoonSurfaceFeasibility(
  parentEqt:     number | null | undefined,
  isTidallyLocked: boolean | null,
  moonIndex:     number,
): MoonSettlementFeasibility {
  const notes:    string[] = []
  const warnings: string[] = []
  let score = 50

  if (parentEqt != null) {
    if (parentEqt > 200 && parentEqt < 380) {
      score += 20
      notes.push('Parent planet in habitable zone — moon may receive indirect thermal benefit.')
    } else if (parentEqt > 1000) {
      score -= 25
      warnings.push('Parent planet is very hot — tidal heating may make moon surface hostile.')
    } else if (parentEqt < 100) {
      score -= 10
      warnings.push('Outer cold zone — moon will require significant energy infrastructure.')
    }
  }

  if (isTidallyLocked === true) {
    notes.push('Tidally locked — one hemisphere permanently faces the parent planet (constant light), one faces away (constant dark). Terminator zone most habitable.')
  } else if (isTidallyLocked === false) {
    score += 5
    notes.push('Not tidally locked — regular day/night cycle.')
  }

  if (moonIndex === 1) {
    score += 10
    notes.push('Innermost moon — closest to parent planet for transit. Higher tidal heating potential.')
  } else if (moonIndex >= 3) {
    score -= 5
    notes.push('Outer moon — less tidal heating, more radiation exposure from parent star.')
  }

  const tier: MoonSettlementFeasibility['tier'] =
    score >= 70 ? 'optimal' :
    score >= 50 ? 'viable' :
    score >= 30 ? 'challenging' : 'extreme'

  return { score, tier, notes, warnings }
}

/** Feasibility for a Lagrange point settlement. */
export function assessLagrangeFeasibility(
  point:     LagrangePoint,
  moonMass:  'large' | 'medium' | 'small' | 'unknown' = 'unknown',
): MoonSettlementFeasibility {
  const info  = LAGRANGE_POINTS.find(l => l.id === point)!
  const notes: string[] = [info.useCase]
  const warnings: string[] = []
  let score = info.stability === 'stable' ? 65 : 40

  if (info.stability === 'unstable') {
    warnings.push('Unstable point — requires active station-keeping thrust to maintain position.')
    score -= 10
  }
  if (point === 'L4' || point === 'L5') {
    score += 15
    notes.push('L4/L5 points accumulate dust and small bodies naturally (Trojan resonance) — potential in-situ resource utilisation.')
  }
  if (point === 'L1') {
    notes.push('Ideal for gateway station — line-of-sight to both parent planet and moon surface simultaneously.')
  }
  if (moonMass === 'large') {
    score += 10
    notes.push('Large moon mass → stronger Hill sphere → wider stable L4/L5 zone.')
  } else if (moonMass === 'small') {
    score -= 10
    warnings.push('Small moon mass → weak Hill sphere → L4/L5 stability region is narrow.')
  }

  const tier: MoonSettlementFeasibility['tier'] =
    score >= 70 ? 'optimal' :
    score >= 50 ? 'viable' :
    score >= 30 ? 'challenging' : 'extreme'

  return { score, tier, notes, warnings }
}
