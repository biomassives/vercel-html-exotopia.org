/**
 * star-physics.ts
 * Deterministic stellar physics estimates used by the StarDetailLens viewer.
 * All values are estimates from T_eff and spectral class — no measured rotation
 * periods or cycle lengths are available for most catalog stars.
 *
 * Sources: Noyes+ 1984 (rotation-activity), Baliunas+ 1995 (cycles),
 *           Gray 2005 (limb darkening), Saar+Brandenburg 1999 (cycle lengths).
 */

import type { StarSystem } from 'src/stores/galaxy'

// ── Spectral class parsing ────────────────────────────────────────────────────

export type LumClass = 'Ia' | 'Ib' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'unknown'

export interface ParsedSpectype {
  cls:    string        // 'O','B','A','F','G','K','M','L','T','W' etc.
  sub:    number        // subclass 0–9 (or NaN)
  lum:    LumClass      // luminosity class
  raw:    string
}

export function parseSpectype(s: string | null | undefined): ParsedSpectype {
  const raw = (s ?? '').trim()
  const match = raw.match(/^([OBAFGKMLTWC])(\d(?:\.\d)?)?(?:\s*(Ia|Ib|I|II|III|IV|VI|V))?/)
  if (!match) return { cls: '?', sub: NaN, lum: 'unknown', raw }
  const lumStr = match[3] ?? ''
  const lumMap: Record<string, LumClass> = {
    'Ia': 'Ia', 'Ib': 'Ib', 'I': 'Ia', 'II': 'II',
    'III': 'III', 'IV': 'IV', 'V': 'V', 'VI': 'VI',
  }
  return {
    cls: match[1] ?? '?',
    sub: parseFloat(match[2] ?? 'NaN'),
    lum: lumMap[lumStr] ?? 'V',
    raw,
  }
}

// ── RGB colours per spectral class ────────────────────────────────────────────

export function spectralRGB(teff: number): [number, number, number] {
  if (teff >= 30000) return [155, 176, 255]   // O — blue-violet
  if (teff >= 10000) return [170, 191, 255]   // B — blue-white
  if (teff >=  7500) return [202, 215, 255]   // A — white
  if (teff >=  6000) return [255, 244, 200]   // F — pale yellow
  if (teff >=  5200) return [255, 228, 160]   // G — solar yellow
  if (teff >=  3700) return [255, 178,  90]   // K — orange
  if (teff >=  2400) return [255, 110,  55]   // M — deep red-orange
  return [220, 80, 60]                         // L/T brown dwarf
}

export function spectralHex(teff: number): string {
  const [r, g, b] = spectralRGB(teff)
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

// ── Rotation period (days) ────────────────────────────────────────────────────
// Gyrochronology + empirical calibration. Returns a deterministic estimate
// seeded from the hostname hash so the same star always shows the same period.

export function rotationPeriodDays(teff: number, seed: number): number {
  const rng = seededFloat(seed)
  if (teff > 30000) return 0.5 + rng * 2.0    // O: 0.5–2.5 d (radiation-driven winds)
  if (teff > 10000) return 1.0 + rng * 3.0    // B: 1–4 d
  if (teff >  7500) return 1.5 + rng * 5.0    // A: 1.5–6.5 d
  if (teff >  6000) return 6.0 + rng * 14.0   // F: 6–20 d
  if (teff >  5200) return 18.0 + rng * 14.0  // G: 18–32 d (Sun = 25.4 d sidereal)
  if (teff >  3700) return 30.0 + rng * 50.0  // K: 30–80 d
  return 8.0 + rng * 100.0                     // M: 8–108 d (huge scatter)
}

// ── Activity cycle period (years, or null if no cycle) ────────────────────────

export function activityCyclePeriod(teff: number, seed: number): number | null {
  const rng = seededFloat(seed + 1)
  if (teff > 10000) return null              // hot stars: no magnetic activity cycle
  if (teff >  7500) return 5  + rng * 4     // F: short cycles 5–9 yr
  if (teff >  5200) return 8  + rng * 6     // G: 8–14 yr (Sun 11 yr)
  if (teff >  3700) return 5  + rng * 7     // K: 5–12 yr
  return 3 + rng * 8                         // M: 3–11 yr, frequent flares
}

// ── Maximum sunspot count at solar maximum ────────────────────────────────────

export function maxSunspotCount(teff: number): number {
  if (teff > 10000) return 0
  if (teff >  7500) return 6
  if (teff >  5200) return 12   // G stars: up to ~12 spot groups visible
  if (teff >  3700) return 10
  return 18                      // M dwarfs: very spotted
}

// ── Limb darkening coefficient u (linear law) ─────────────────────────────────
// I(μ)/I(1) = 1 - u(1 - μ)   where μ = cos(θ), θ = angle from disc centre

export function limbDarkeningU(teff: number): number {
  if (teff > 20000) return 0.28
  if (teff > 10000) return 0.38
  if (teff >  7000) return 0.48
  if (teff >  5500) return 0.60   // Sun: 0.56–0.64 depending on band
  if (teff >  4000) return 0.70
  return 0.78
}

// ── Granulation parameters ────────────────────────────────────────────────────

export interface GranulationParams {
  contrast:  number   // brightness contrast between granule centre and edge (0–1)
  cellScale: number   // granule size as fraction of stellar radius
  lifetime:  number   // granule lifetime in seconds of "star time"
  nCells:    number   // number of visible granule cells across disc
}

export function granulationParams(teff: number): GranulationParams {
  if (teff > 10000) {
    // Hot stars: no convective envelope → no granulation visible
    return { contrast: 0, cellScale: 0, lifetime: Infinity, nCells: 0 }
  }
  const contrast   = Math.min(0.22, Math.max(0.03, 0.06 + (5778 - teff) / 25000))
  const cellScale  = teff > 6000 ? 0.038 : teff > 4500 ? 0.055 : 0.075
  const lifetime   = 600  // ~10 minutes in seconds of "star time"
  const nCells     = Math.round(Math.PI / (cellScale * cellScale) * 0.6)
  return { contrast, cellScale, lifetime, nCells }
}

// ── Prominence parameters ─────────────────────────────────────────────────────

export function prominenceParams(teff: number, actLevel: number) {
  return {
    count:      Math.round(actLevel * (teff < 5000 ? 6 : 3)),
    maxHeight:  0.08 + actLevel * 0.18,   // as fraction of R
    maxWidth:   0.04 + actLevel * 0.08,
    color:      teff < 4000 ? 'rgba(255,80,20,0.65)' : 'rgba(255,120,50,0.55)',
  }
}

// ── Flare frequency (flares per hour, at current activity level) ──────────────

export function flareFrequency(teff: number, actLevel: number): number {
  if (teff > 7500) return 0
  if (teff > 5000) return actLevel * 0.02   // occasional on G stars
  if (teff > 3700) return actLevel * 0.12   // K stars: moderate
  return actLevel * 0.5                      // M dwarfs: frequent flares
}

// ── Time scale labels and speed multipliers ───────────────────────────────────

export const TIME_SCALES = [
  { shortLabel: '10min/s', label: 'Granulation scale — 10 star-minutes per real second',  speedSec: 600        },
  { shortLabel: '1d/s',    label: 'Rotation scale — 1 star-day per real second',          speedSec: 86_400     },
  { shortLabel: '1wk/s',   label: 'Weekly scale — 7 star-days per real second',           speedSec: 604_800    },
  { shortLabel: '1yr/s',   label: 'Cycle scale — 1 star-year per real second',            speedSec: 31_536_000 },
  { shortLabel: '1kyr/s',  label: 'Stellar evolution — 1,000 star-years per real second', speedSec: 3.154e10   },
] as const

export type TimeScaleIdx = 0 | 1 | 2 | 3 | 4

// ── Activity level from cycle phase ──────────────────────────────────────────
// Returns 0 (cycle minimum) → 1 (cycle maximum)

export function activityFromPhase(phase: number): number {
  // Double-peaked cycle (like real solar cycles): two maxima per period
  return Math.max(0, Math.sin(phase * Math.PI) ** 2 * 0.85 + Math.sin(phase * Math.PI * 2) ** 2 * 0.15)
}

// ── Spörer's law — sunspot latitude range at given cycle phase ────────────────
// Spots appear at high latitudes early in cycle, migrate to equator by end

export function sunspotLatRange(phase: number): [number, number] {
  const mid = (1 - phase) * 30 * Math.PI / 180   // 30° early → 0° late
  const half = (8 + (1 - phase) * 8) * Math.PI / 180
  return [mid - half, mid + half]
}

// ── Deterministic seeded float [0,1) ─────────────────────────────────────────

export function seededFloat(seed: number): number {
  let s = seed | 0
  s = (s ^ 61) ^ (s >>> 16)
  s = (s + (s << 3)) | 0
  s = s ^ (s >>> 4)
  s = (Math.imul(s, 0x27d4eb2d)) | 0
  s = s ^ (s >>> 15)
  return ((s >>> 0) / 0xffffffff)
}

// ── Hostname → seed ───────────────────────────────────────────────────────────

export function hostnameSeed(hostname: string): number {
  return hostname.split('').reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7)
}

// ── Full stellar profile for a system ────────────────────────────────────────

export interface StellarProfile {
  teff:          number
  rgb:           [number, number, number]
  hex:           string
  specClass:     string
  lumClass:      LumClass
  rotPeriodDays: number
  cyclePeriodYr: number | null
  maxSpots:      number
  limbU:         number
  granulation:   GranulationParams
  seed:          number
}

export function buildStellarProfile(sys: StarSystem): StellarProfile {
  const teff   = sys.st_teff ?? 5778
  const parsed = parseSpectype(sys.st_spectype)
  const seed   = hostnameSeed(sys.hostname)
  return {
    teff,
    rgb:           spectralRGB(teff),
    hex:           spectralHex(teff),
    specClass:     parsed.cls,
    lumClass:      parsed.lum,
    rotPeriodDays: rotationPeriodDays(teff, seed),
    cyclePeriodYr: activityCyclePeriod(teff, seed),
    maxSpots:      maxSunspotCount(teff),
    limbU:         limbDarkeningU(teff),
    granulation:   granulationParams(teff),
    seed,
  }
}
