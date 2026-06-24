/**
 * planet-climate.ts
 * Physics-based climate estimates for exoplanet settlement data.
 * All values are estimates — actual rotation periods are rarely measured.
 */

import type { Planet, StarSystem } from 'src/stores/galaxy'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DayEstimate {
  /** 'locked' = confirmed synchronous, 'resonance' = e.g. 3:2 like Mercury,
   *  'slow' = tidal braking likely, 'unknown' = no constraint */
  mode:        'locked' | 'resonance' | 'slow' | 'unknown'
  /** Solar day in Earth days (null = unconstrained) */
  dayDays:     number | null
  /** Same in Earth hours */
  dayHours:    number | null
  confidence:  'high' | 'medium' | 'low'
  label:       string
  note:        string
}

export interface DiurnalRange {
  /** Temperature on the sun-facing side/hemisphere (K) */
  dayK:    number | null
  /** Temperature on the night-facing side/hemisphere (K) */
  nightK:  number | null
  /** Swing in K across one rotation */
  swingK:  number | null
  label:   string
}

export interface SeasonalRange {
  /** At perihelion (K) */
  perihelionK: number | null
  /** At aphelion (K) */
  aphelionK:   number | null
  /** ΔT over one orbit (K) */
  deltaK:      number | null
  /** Source eccentricity (0 = assumed circular) */
  eccentricity: number
  label:        string
}

export interface ClimateProfile {
  day:       DayEstimate
  diurnal:   DiurnalRange
  seasonal:  SeasonalRange
  isBinary:  boolean
  binaryNote: string | null
}

// ── Unit helpers ──────────────────────────────────────────────────────────────

/** Returns true when the browser locale prefers °F (effectively: en-US). */
export function usesFahrenheit(): boolean {
  try {
    return /^en-US\b/.test(navigator.language ?? '')
  } catch {
    return false
  }
}

export function kToC(k: number): number { return k - 273.15 }
export function kToF(k: number): number { return (k - 273.15) * 9 / 5 + 32 }

/** Format a Kelvin value in the user's preferred unit. */
export function formatTempK(k: number, fahrenheit = usesFahrenheit()): string {
  if (fahrenheit) return `${Math.round(kToF(k))} °F`
  return `${Math.round(kToC(k))} °C`
}

/** Format a range min–max. Returns null if both null. */
export function formatRangeK(
  minK: number | null,
  maxK: number | null,
  fahrenheit = usesFahrenheit(),
): string | null {
  if (minK == null || maxK == null) return null
  const unit = fahrenheit ? '°F' : '°C'
  const lo   = fahrenheit ? Math.round(kToF(minK)) : Math.round(kToC(minK))
  const hi   = fahrenheit ? Math.round(kToF(maxK)) : Math.round(kToC(maxK))
  if (Math.abs(hi - lo) < 2) return `${lo} ${unit}`
  return `${lo} → ${hi} ${unit}`
}

/** Format days with hours fallback for sub-day values. */
export function formatDays(days: number): string {
  if (days >= 1.0) return `${days.toFixed(1)} Earth day${days.toFixed(1) === '1.0' ? '' : 's'}`
  const h = days * 24
  return `${h.toFixed(1)} Earth hours`
}

// ── Tidal locking detection ────────────────────────────────────────────────────

/**
 * Rough tidal locking probability based on orbital period.
 * Empirically: period < 10 d → almost certainly locked;
 *              10–20 d → likely slow/locked;
 *              20–50 d → possibly slow;
 *              > 50 d → unknown.
 */
function tidalStatus(orbPer: number): 'locked' | 'slow' | 'unknown' {
  if (orbPer <= 10)  return 'locked'
  if (orbPer <= 25)  return 'slow'
  return 'unknown'
}

// ── Day length ────────────────────────────────────────────────────────────────

export function estimateDayLength(pl: Planet, sys?: StarSystem): DayEstimate {
  const per = pl.pl_orbper   // orbital period in days
  const au  = pl.pl_orbsmax  // semi-major axis AU

  if (!per && !au) {
    return {
      mode: 'unknown', dayDays: null, dayHours: null, confidence: 'low',
      label: 'Unknown',
      note:  'No orbital period data available',
    }
  }

  // Estimate period from AU if missing (Kepler III, M_star ≈ 1 M_sun)
  const estPer = per ?? Math.pow(au ?? 1, 1.5) * 365.25
  const status = tidalStatus(estPer)

  if (status === 'locked') {
    return {
      mode: 'locked', dayDays: estPer, dayHours: estPer * 24, confidence: 'high',
      label: `${formatDays(estPer)} (tidally locked)`,
      note:  `Orbital period = solar day · permanent day/night hemispheres · terminator zone most habitable`,
    }
  }

  if (status === 'slow') {
    const estDay = estPer * 0.60   // near-synchronous braking
    return {
      mode: 'slow', dayDays: estDay, dayHours: estDay * 24, confidence: 'medium',
      label: `~${formatDays(estDay)} (estimated slow rotation)`,
      note:  `Tidal braking likely · rotation well below Earth rate · long twilight periods`,
    }
  }

  // Outer planets — Earth-like rotation is statistically common
  if ((au ?? 0) >= 1.0) {
    return {
      mode: 'unknown', dayDays: null, dayHours: null, confidence: 'low',
      label: '< 2 Earth days (estimated)',
      note:  `Rotation period not measured · Earth-like rate plausible at this distance`,
    }
  }

  // Inner but not quite locked (~0.3–1 AU)
  const estDay2 = 5 + (au ?? 0.5) * 15   // rough 5–20 day range
  return {
    mode: 'slow', dayDays: estDay2, dayHours: estDay2 * 24, confidence: 'low',
    label: `~${formatDays(estDay2)} (estimated)`,
    note:  `Tidal braking probable · actual rotation unconstrained`,
  }
}

/**
 * Estimate day length for a moon of an exoplanet.
 * Moons in close orbits are almost universally tidally locked to their planet.
 * The "day" for a settler is the time between two transits of the parent planet overhead.
 */
export function estimateMoonDayLength(parentOrbPer: number | null | undefined): DayEstimate {
  // Moon's orbital period around its planet is unknown from catalog data.
  // Use Earth–Moon analog (27.3 days) as a rough typical value.
  const typicalMoonPer = 27.3
  return {
    mode: 'locked', dayDays: typicalMoonPer, dayHours: typicalMoonPer * 24, confidence: 'low',
    label: `~${formatDays(typicalMoonPer)} (typical moon orbit, tidally locked)`,
    note:  `Moon rotation period = orbital period · parent planet fixed in sky · "parent-rise" not applicable`,
  }
}

// ── Diurnal temperature range ─────────────────────────────────────────────────

/**
 * Estimate dayside vs nightside temperature for a given planet.
 * Physics:
 *   Tidally locked dayside: T_day ≈ T_eq × (4/τ)^0.25  where τ is atmosphere factor
 *   Bare rock (no atm): T_day ≈ 1.26 × T_eq, T_night ≈ 0 K
 *   Thick atm: T_day ≈ T_eq × 1.05, T_night ≈ T_eq × 0.90
 */
export function estimateDiurnalRange(pl: Planet, day: DayEstimate): DiurnalRange {
  const eqt  = pl.pl_eqt
  const rade = pl.pl_rade

  if (!eqt) {
    return { dayK: null, nightK: null, swingK: null, label: 'Eq. temperature unknown' }
  }

  // Atmosphere proxy: larger radius ≈ thicker atmosphere
  // R > 3 R⊕: sub-Neptune/gas → effective heat redistribution
  // 1.6–3: super-Earth with likely atmosphere
  // 1.0–1.6: uncertain
  // < 1.0: likely rocky/thin
  const atmFactor = rade == null ? 0.5
    : rade > 3.0  ? 0.95   // near-uniform heat distribution
    : rade > 1.6  ? 0.80
    : rade > 1.0  ? 0.55
    : 0.30

  if (day.mode === 'locked') {
    // Dayside receives all stellar flux concentrated on hemisphere
    const dayK   = Math.round(eqt * (2 ** 0.25))        // ≈ T_eq × 1.189
    const nightK = Math.round(dayK * atmFactor * 0.55)   // rough night redistribution
    const swing  = dayK - nightK
    return {
      dayK, nightK, swingK: swing,
      label: `Day ~${dayK} K · Night ~${nightK} K (ΔT ${swing} K)`,
    }
  }

  // For rotating planet: smaller swing, proportional to atmFactor
  // Swing ≈ 40% of T_eq for thin atm, 10% for thick atm
  const swingFraction = 0.12 + (1 - atmFactor) * 0.32
  const swing  = Math.round(eqt * swingFraction)
  const dayK   = Math.round(eqt + swing / 2)
  const nightK = Math.round(eqt - swing / 2)
  return {
    dayK, nightK, swingK: swing,
    label: `Day ~${dayK} K · Night ~${nightK} K (ΔT ~${swing} K)`,
  }
}

// ── Seasonal temperature range ────────────────────────────────────────────────

/**
 * Estimate perihelion vs aphelion temperature from orbital eccentricity.
 * T(r) ∝ r^(-0.5)  (Stefan-Boltzmann + inverse-square stellar flux)
 * T_peri = T_eq / sqrt(1 - e)
 * T_aph  = T_eq / sqrt(1 + e)
 */
export function estimateSeasonalRange(pl: Planet): SeasonalRange {
  const eqt = pl.pl_eqt
  // Eccentricity not stored in our current Planet schema → assume near-circular
  // This is statistically appropriate: most close-in exoplanets have e ≈ 0
  const e   = 0   // pl.pl_orbeccen would go here if added to schema

  if (!eqt) {
    return { perihelionK: null, aphelionK: null, deltaK: null, eccentricity: e, label: 'Unknown' }
  }

  if (e < 0.01) {
    return {
      perihelionK: eqt, aphelionK: eqt, deltaK: 0, eccentricity: 0,
      label: 'Near-circular orbit · minimal seasonal variation',
    }
  }

  const periK  = Math.round(eqt / Math.sqrt(1 - e))
  const aphK   = Math.round(eqt / Math.sqrt(1 + e))
  const deltaK = periK - aphK
  return {
    perihelionK: periK, aphelionK: aphK, deltaK, eccentricity: e,
    label: `Perihelion ~${periK} K · Aphelion ~${aphK} K (ΔT ${deltaK} K)`,
  }
}

// ── Full profile ──────────────────────────────────────────────────────────────

export function buildClimateProfile(pl: Planet, sys: StarSystem): ClimateProfile {
  const day      = estimateDayLength(pl, sys)
  const diurnal  = estimateDiurnalRange(pl, day)
  const seasonal = estimateSeasonalRange(pl)
  const isBinary = (sys.sy_snum ?? 1) > 1

  let binaryNote: string | null = null
  if (isBinary) {
    binaryNote = sys.sy_snum === 2
      ? `Binary system — companion star creates irregular secondary illumination events (secondary "dawn") · complex tidal heating potential`
      : `${sys.sy_snum}-star system — multiple stellar light sources · complex seasonal and diurnal pattern`
  }

  return { day, diurnal, seasonal, isBinary, binaryNote }
}

// ── Moon thermal supplement ───────────────────────────────────────────────────

/**
 * Rough estimate of tidal heating supplement for a moon.
 * Based on orbital period analogy to Io/Europa.
 * Returns extra thermal flux as fraction of stellar contribution.
 */
export function moonTidalHeatFraction(parentOrbPer: number | null | undefined): number {
  // Io (orbital period 1.77 d) has tidal heat ~2× its stellar input
  // Europa (3.55 d): ~0.25× · Ganymede (7.15 d): ~0.02×
  // Scale roughly as per^(-2.5)
  const per = parentOrbPer ?? 30
  return Math.min(2.0, 0.25 * Math.pow(3.55 / Math.max(per, 0.5), 2.5))
}
