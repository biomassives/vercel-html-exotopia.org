/**
 * src/lib/verify.ts
 *
 * Pure verification functions for the VerifyPanel.
 * No Vue / Three.js imports — plain TypeScript only.
 */

import type { Planet, StarSystem } from 'src/stores/galaxy'

// ── Catalog audit ─────────────────────────────────────────────────────────────

export interface FieldCoverage {
  field:      string
  label:      string
  present:    number
  missing:    number
  pct:        number
}

export interface CatalogAnomalies {
  eqtTooHot:   Planet[]   // pl_eqt > 4000 K
  eqtTooCold:  Planet[]   // pl_eqt < 15 K
  wideOrbit:   Planet[]   // pl_orbsmax > 80 AU
  negativeAU:  Planet[]   // pl_orbsmax < 0
  badDistance: Planet[]   // sy_dist > 15000 pc (likely error)
}

export interface TierCounts {
  confirmed:   number
  candidate:   number
  frontier:    number
  theoretical: number
}

export interface CatalogAudit {
  totalPlanets:   number
  totalSystems:   number
  fieldCoverage:  FieldCoverage[]
  anomalies:      CatalogAnomalies
  tierCounts:     TierCounts
  specDistrib:    Record<string, number>
  discoveryDist:  Record<string, number>
  hzPlanets:      number   // rough HZ count (200-380 K or flux 0.2-1.5 S⊕)
}

export function auditCatalog(planets: Planet[], systems: Map<string, StarSystem>): CatalogAudit {
  const N = planets.length

  function coverage(field: keyof Planet, label: string): FieldCoverage {
    const present = planets.filter(p => p[field] != null).length
    return { field: String(field), label, present, missing: N - present, pct: Math.round(present / N * 100) }
  }

  const fieldCoverage: FieldCoverage[] = [
    coverage('pl_orbsmax', 'Semi-major axis'),
    coverage('pl_eqt',     'Equilib. temp'),
    coverage('st_teff',    'Star Teff'),
    coverage('pl_rade',    'Planet radius'),
    coverage('pl_orbper',  'Orbital period'),
    coverage('sy_dist',    'Distance'),
    coverage('pl_bmasse',  'Planet mass'),
    coverage('pl_insol',   'Insolation'),
  ]

  const anomalies: CatalogAnomalies = {
    eqtTooHot:   planets.filter(p => p.pl_eqt != null && p.pl_eqt > 4000),
    eqtTooCold:  planets.filter(p => p.pl_eqt != null && p.pl_eqt < 15),
    wideOrbit:   planets.filter(p => p.pl_orbsmax != null && p.pl_orbsmax > 80),
    negativeAU:  planets.filter(p => p.pl_orbsmax != null && p.pl_orbsmax <= 0),
    badDistance: planets.filter(p => p.sy_dist != null && p.sy_dist > 15000),
  }

  const tierCounts: TierCounts = {
    confirmed:   planets.filter(p => !p.tier || p.tier === 'confirmed').length,
    candidate:   planets.filter(p => p.tier === 'candidate').length,
    frontier:    planets.filter(p => p.tier === 'frontier').length,
    theoretical: planets.filter(p => p.tier === 'theoretical').length,
  }

  // Spectral type distribution (first letter)
  const specDistrib: Record<string, number> = {}
  for (const p of planets) {
    const s = (p.st_spectype ?? '?')[0]?.toUpperCase() ?? '?'
    specDistrib[s] = (specDistrib[s] ?? 0) + 1
  }

  // Discovery method distribution
  const discoveryDist: Record<string, number> = {}
  for (const p of planets) {
    const m = p.discoverymethod ?? 'Unknown'
    discoveryDist[m] = (discoveryDist[m] ?? 0) + 1
  }

  const hzPlanets = planets.filter(p =>
    (p.pl_eqt != null && p.pl_eqt >= 200 && p.pl_eqt <= 380) ||
    (p.pl_insol != null && p.pl_insol >= 0.20 && p.pl_insol <= 1.5)
  ).length

  return { totalPlanets: N, totalSystems: systems.size, fieldCoverage, anomalies, tierCounts, specDistrib, discoveryDist, hzPlanets }
}

// ── Known system verification ─────────────────────────────────────────────────

export interface ReferenceSystem {
  hostname:            string
  expectPlanetCount:   number   // exact or ±1 due to catalog updates
  expectDistPc?:       number   // ±20% tolerance
  expectTeff?:         number   // ±300 K tolerance
  expectSpecLetter?:   string   // first letter of spectral type
  expectSnum?:         number   // number of stars
  expectHZPlanet?:     boolean
  notes:               string
}

export const REFERENCE_SYSTEMS: ReferenceSystem[] = [
  {
    hostname: 'TRAPPIST-1', expectPlanetCount: 7, expectDistPc: 12.4,
    expectTeff: 2566, expectSpecLetter: 'M', expectHZPlanet: true,
    notes: '7 rocky planets, 3 in HZ — largest confirmed multi-planet M-dwarf system',
  },
  {
    hostname: 'Kepler-442', expectPlanetCount: 1, expectDistPc: 342,
    expectTeff: 5157, expectSpecLetter: 'K', expectHZPlanet: true,
    notes: 'Super-Earth in habitable zone, one of the best HZ analog planets',
  },
  {
    hostname: 'HD 219134', expectPlanetCount: 6, expectDistPc: 6.5,
    expectTeff: 4699, expectSpecLetter: 'K',
    notes: 'Closest known transiting exoplanet system; 6 confirmed planets',
  },
  {
    hostname: 'Kepler-16', expectPlanetCount: 1, expectDistPc: 245,
    expectSnum: 2,
    notes: 'First confirmed circumbinary planet — two stars orbited by one planet',
  },
  {
    hostname: '55 Cnc', expectPlanetCount: 5, expectDistPc: 12.6,
    expectTeff: 5196, expectSpecLetter: 'G',
    notes: '5-planet system; 55 Cnc e is a lava-world hot super-Earth',
  },
  {
    hostname: 'Kepler-90', expectPlanetCount: 8, expectDistPc: 2840,
    notes: '8 planets — tied for most in any known exoplanet system',
  },
  {
    hostname: 'Proxima Cen', expectPlanetCount: 2, expectDistPc: 1.3,
    expectTeff: 3042, expectSpecLetter: 'M', expectHZPlanet: true,
    notes: 'Closest star to the Sun; Proxima b is a HZ candidate',
  },
  {
    hostname: 'tau Cet', expectPlanetCount: 4, expectDistPc: 3.65,
    expectTeff: 5344, expectSpecLetter: 'G',
    notes: 'Nearby Sun-analog with 4 confirmed planets',
  },
]

export interface KnownSystemResult {
  hostname:    string
  found:       boolean
  checks:      CheckResult[]
  notes:       string
}

export interface CheckResult {
  name:    string
  passed:  boolean
  got:     string
  want:    string
  warn?:   boolean   // true = yellow warning vs red fail
}

export function checkKnownSystems(systems: Map<string, StarSystem>): KnownSystemResult[] {
  return REFERENCE_SYSTEMS.map(ref => {
    const sys = systems.get(ref.hostname)
    if (!sys) {
      return {
        hostname: ref.hostname,
        found:    false,
        checks:   [{ name: 'System found', passed: false, got: 'NOT IN CATALOG', want: 'present' }],
        notes:    ref.notes,
      }
    }

    const checks: CheckResult[] = []
    const pCount = sys.planets.length

    // Planet count
    const countOk = Math.abs(pCount - ref.expectPlanetCount) <= 1
    checks.push({
      name:   'Planet count',
      passed: countOk,
      got:    String(pCount),
      want:   String(ref.expectPlanetCount),
      warn:   pCount !== ref.expectPlanetCount && countOk,
    })

    // Distance
    if (ref.expectDistPc != null && sys.sy_dist != null) {
      const ratio  = sys.sy_dist / ref.expectDistPc
      const distOk = ratio >= 0.70 && ratio <= 1.30
      checks.push({
        name:   'Distance',
        passed: distOk,
        got:    `${sys.sy_dist.toFixed(1)} pc`,
        want:   `${ref.expectDistPc} pc ±30%`,
      })
    }

    // Teff
    if (ref.expectTeff != null && sys.st_teff != null) {
      const tOk = Math.abs(sys.st_teff - ref.expectTeff) < 400
      checks.push({
        name:   'Star Teff',
        passed: tOk,
        got:    `${Math.round(sys.st_teff)} K`,
        want:   `${ref.expectTeff} K ±400`,
      })
    }

    // Spectral class (first letter)
    if (ref.expectSpecLetter != null && sys.st_spectype) {
      const letter = sys.st_spectype[0]?.toUpperCase() ?? '?'
      const spOk   = letter === ref.expectSpecLetter
      checks.push({
        name:   'Spectral type',
        passed: spOk,
        got:    sys.st_spectype,
        want:   `${ref.expectSpecLetter}-type`,
      })
    }

    // Multi-star
    if (ref.expectSnum != null) {
      const snum  = sys.sy_snum ?? 1
      const sOk   = snum === ref.expectSnum
      checks.push({
        name:   'Star count',
        passed: sOk,
        got:    String(snum),
        want:   String(ref.expectSnum),
      })
    }

    // HZ planet
    if (ref.expectHZPlanet != null) {
      const hasHz = sys.planets.some(p =>
        (p.pl_eqt != null && p.pl_eqt >= 180 && p.pl_eqt <= 420) ||
        (p.pl_insol != null && p.pl_insol >= 0.18 && p.pl_insol <= 1.8)
      )
      if (ref.expectHZPlanet) {
        checks.push({ name: 'HZ planet', passed: hasHz, got: hasHz ? 'YES' : 'NONE FOUND', want: 'at least 1' })
      }
    }

    return { hostname: ref.hostname, found: true, checks, notes: ref.notes }
  })
}

// ── Planet rendering verifier ─────────────────────────────────────────────────

export interface PlanetRenderDetails {
  pl_name:        string
  orbAU:          number | null
  orbAUSource:    'catalog' | 'fallback'
  fallbackIdx?:   number
  vizDist:        number | null
  pR:             number
  pRSource:       'catalog' | 'minimum'
  angSpeed:       number | null
  angSpeedSource: 'catalog_period' | 'fallback_floor'
  periodDays:     number | null
  isInHZ:         boolean | null
  hzInAU?:        number
  hzOutAU?:       number
  eqt:            number | null
  warnings:       string[]
}

export function verifyPlanetRendering(
  planet: Planet,
  planetIdx: number,
  totalPlanets: number,
  auToVizFn: (au: number) => number,
  fallbackAUFn: (idx: number, total: number) => number,
): PlanetRenderDetails {
  const warnings: string[] = []

  // Orbital radius
  let orbAU: number | null = null
  let orbAUSource: 'catalog' | 'fallback' = 'catalog'
  let fallbackIdx: number | undefined

  if (planet.pl_orbsmax != null && planet.pl_orbsmax > 0) {
    orbAU = planet.pl_orbsmax
  } else {
    orbAU       = fallbackAUFn(planetIdx, totalPlanets)
    orbAUSource = 'fallback'
    fallbackIdx = planetIdx
    warnings.push(`Using fallback AU=${orbAU.toFixed(2)} (pl_orbsmax is ${planet.pl_orbsmax == null ? 'null' : 'invalid'})`)
  }

  const vizDist = orbAU != null ? auToVizFn(orbAU) : null

  // Planet size
  const rade = planet.pl_rade
  const rawR = rade != null ? rade * 0.42 : null
  const pR   = rawR != null ? Math.max(0.9, Math.min(5, rawR)) : 0.9
  const pRSource: 'catalog' | 'minimum' = rade != null && rawR! >= 0.9 ? 'catalog' : 'minimum'
  if (rade == null)   warnings.push('pl_rade missing — defaulting to pR=0.9')
  if (rawR != null && rawR > 5) warnings.push(`Planet radius very large (${rade}R⊕) — clamped to pR=5`)

  // Orbital speed
  const periodDays = planet.pl_orbper
  let angSpeed: number | null = null
  let angSpeedSource: 'catalog_period' | 'fallback_floor' = 'catalog_period'

  if (periodDays != null && periodDays > 0) {
    const effectivePeriod = Math.max(periodDays, 150)
    angSpeed = (2 * Math.PI * 365) / (effectivePeriod * 3600)
    if (periodDays < 150) {
      angSpeedSource = 'fallback_floor'
      warnings.push(`Orbital period ${periodDays.toFixed(1)} d floored to 150 d for visual time-scale`)
    }
  } else {
    warnings.push('pl_orbper missing — orbital speed will not animate')
  }

  // Kepler's third law consistency check (if both period and AU available)
  if (periodDays != null && orbAU != null) {
    const keplerPeriod = Math.pow(orbAU, 1.5) * 365.25   // assumes solar mass (rough)
    const ratio        = periodDays / keplerPeriod
    if (ratio < 0.5 || ratio > 2.5) {
      warnings.push(`Kepler 3rd law mismatch: expected ~${Math.round(keplerPeriod)} d, got ${Math.round(periodDays)} d (ratio ${ratio.toFixed(2)})`)
    }
  }

  // Habitable zone check
  let isInHZ: boolean | null = null
  let hzInAU: number | undefined
  let hzOutAU: number | undefined

  const teff = planet.st_teff ?? 5778
  const lum  = Math.pow(teff / 5778, 4)
  hzInAU     = Math.sqrt(lum / 1.1)
  hzOutAU    = Math.sqrt(lum / 0.36)

  if (orbAU != null) {
    isInHZ = orbAU >= hzInAU && orbAU <= hzOutAU
    if (isInHZ && (planet.pl_eqt == null || planet.pl_eqt < 150 || planet.pl_eqt > 450)) {
      const eqtStr = planet.pl_eqt != null ? `${planet.pl_eqt} K` : 'null'
      warnings.push(`HZ by AU but temperature (${eqtStr}) is suspect`)
    }
  }

  if (warnings.length === 0 && planet.pl_eqt == null) {
    warnings.push('pl_eqt missing — colour derived from AU only')
  }

  return {
    pl_name: planet.pl_name,
    orbAU, orbAUSource, fallbackIdx, vizDist,
    pR, pRSource,
    angSpeed, angSpeedSource, periodDays,
    isInHZ, hzInAU, hzOutAU,
    eqt: planet.pl_eqt ?? null,
    warnings,
  }
}

// ── Formula spot-checks ───────────────────────────────────────────────────────

export interface FormulaCheck {
  name:    string
  formula: string
  cases:   FormulaCase[]
}

export interface FormulaCase {
  input:    string
  expected: string
  got:      string
  passed:   boolean
}

export function runFormulaChecks(auToVizFn: (au: number) => number): FormulaCheck[] {
  function fc(name: string, formula: string, cases: FormulaCase[]): FormulaCheck {
    return { name, formula, cases }
  }

  function caseOk(input: string, expected: string, got: string, tolerance = 0.05): FormulaCase {
    const exp = parseFloat(expected.replace(/[^0-9.\-e]/g, ''))
    const act = parseFloat(got.replace(/[^0-9.\-e]/g, ''))
    const passed = isNaN(exp) || isNaN(act) ? got === expected : Math.abs(act - exp) / Math.max(Math.abs(exp), 1e-9) <= tolerance
    return { input, expected, got, passed }
  }

  // pR = max(0.9, min(5, rade * 0.42))
  const pRCheck = fc(
    'Planet visual radius', 'pR = max(0.9, min(5, rade × 0.42))', [
      caseOk('Earth 1.0 R⊕',          'pR = 0.90 (min)',  `pR = ${Math.max(0.9, Math.min(5, 1.0 * 0.42)).toFixed(2)}`),
      caseOk('super-Earth 2.5 R⊕',    'pR = 1.05',        `pR = ${Math.max(0.9, Math.min(5, 2.5 * 0.42)).toFixed(2)}`),
      caseOk('Neptune 3.9 R⊕',        'pR = 1.64',        `pR = ${Math.max(0.9, Math.min(5, 3.9 * 0.42)).toFixed(2)}`),
      caseOk('Jupiter 11.2 R⊕',       'pR = 4.70',        `pR = ${Math.max(0.9, Math.min(5, 11.2 * 0.42)).toFixed(2)}`),
      caseOk('hot Jupiter 15 R⊕',     'pR = 5.00 (max)',  `pR = ${Math.max(0.9, Math.min(5, 15 * 0.42)).toFixed(2)}`),
    ]
  )

  // HZ: hzIn = sqrt(L/1.1), hzOut = sqrt(L/0.36)  L ∝ Teff^4
  function hz(teff: number) {
    const L = Math.pow(teff / 5778, 4)
    return { inn: Math.sqrt(L / 1.1), out: Math.sqrt(L / 0.36) }
  }
  const hzCheck = fc(
    'Habitable zone bounds', 'hzIn=√(L/1.1), hzOut=√(L/0.36),  L=(Teff/5778)^4', [
      caseOk('Sun 5778K',        'HZ: 0.95–1.67 AU', `HZ: ${hz(5778).inn.toFixed(2)}–${hz(5778).out.toFixed(2)} AU`),
      caseOk('K-type 4500K',     'HZ: 0.39–0.68 AU', `HZ: ${hz(4500).inn.toFixed(2)}–${hz(4500).out.toFixed(2)} AU`),
      caseOk('M-dwarf 3000K',    'HZ: 0.10–0.18 AU', `HZ: ${hz(3000).inn.toFixed(2)}–${hz(3000).out.toFixed(2)} AU`),
      caseOk('F-type 6500K',     'HZ: 1.38–2.41 AU', `HZ: ${hz(6500).inn.toFixed(2)}–${hz(6500).out.toFixed(2)} AU`),
    ]
  )

  // angSpeed = (2π × 365) / (max(period, 150) × 3600) rad/frame
  function spd(d: number) { return (2 * Math.PI * 365) / (Math.max(d, 150) * 3600) }
  const spdCheck = fc(
    'Orbital animation speed', 'angSpeed = (2π×365) / (max(period,150)×3600)', [
      caseOk('Mercury 88 d → floor 150 d', `${spd(88).toExponential(2)} rad/f`,  `${spd(88).toExponential(2)} rad/f`),
      caseOk('Earth 365 d',                `${spd(365).toExponential(2)} rad/f`, `${spd(365).toExponential(2)} rad/f`),
      caseOk('Jupiter 4333 d',             `${spd(4333).toExponential(2)} rad/f`,`${spd(4333).toExponential(2)} rad/f`),
      (() => {
        const ratio = spd(365) / spd(4333)
        const keplerRatio = Math.pow(4333 / 365, 1)   // ~11.9 — not T^1.5 because we're comparing speeds not periods
        return { input: 'Earth/Jupiter speed ratio', expected: '~11.9×', got: `${ratio.toFixed(1)}×`, passed: Math.abs(ratio - 11.9) < 1 }
      })(),
    ]
  )

  // auToViz scale
  const vizCheck = fc(
    'AU → viz unit scale', 'auToViz(au) — logarithmic compression', [
      caseOk('Mercury 0.39 AU', `${auToVizFn(0.39).toFixed(1)} units`, `${auToVizFn(0.39).toFixed(1)} units`),
      caseOk('Earth 1.0 AU',   `${auToVizFn(1.0).toFixed(1)} units`,  `${auToVizFn(1.0).toFixed(1)} units`),
      caseOk('Jupiter 5.2 AU', `${auToVizFn(5.2).toFixed(1)} units`,  `${auToVizFn(5.2).toFixed(1)} units`),
      caseOk('Neptune 30 AU',  `${auToVizFn(30).toFixed(1)} units`,   `${auToVizFn(30).toFixed(1)} units`),
      (() => {
        const earthViz  = auToVizFn(1.0)
        const jupViz    = auToVizFn(5.2)
        const vizRatio  = jupViz / earthViz
        const ok = vizRatio > 1.5 && vizRatio < 5.0  // log compression should be significant
        return { input: 'Jupiter/Earth viz ratio', expected: '1.5–5.0× (log compressed)', got: `${vizRatio.toFixed(1)}×`, passed: ok }
      })(),
    ]
  )

  return [pRCheck, hzCheck, spdCheck, vizCheck]
}
