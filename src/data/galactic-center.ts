/**
 * src/data/galactic-center.ts
 *
 * Hardcoded science data for the Galactic Center scene.
 * Sources:
 *   - Sgr A* mass/spin: GRAVITY Collaboration 2022 (A&A 657, L12)
 *   - S-star elements: Gillessen et al. 2017 (ApJ 837, 30); Peissker et al. 2020 (ApJ 902, L14)
 *   - IRS 13E: Schödel et al. 2023 (A&A 672, L5); Maillard et al. 2004 (A&A 423, 155)
 *   - JWST flares: Gravity+ MIRI 2025 (various circulars)
 *
 * Scene scale: 1 THREE.js unit = 100 AU
 *   S2 semi-major axis: 1023 AU = 10.23 units (diameter 20.5 units)
 *   IRS 13E offset: ~6300 AU = 63 units
 *   Sgr A* Rs: 0.082 AU = 0.00082 units (central glow only)
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** scene units per AU — keep in sync with GalacticCenterPage.vue */
export const SCENE_AU = 100

/** Galactic distance to Sgr A* (pc) — GRAVITY 2022 */
export const R0_PC = 8178

// ── Sgr A* ───────────────────────────────────────────────────────────────────

export interface SgrAStar {
  id: string
  label: string
  type: 'Kerr' | 'Schwarzschild'
  mass_msun: number
  spin_parameter: number
  rs_au: number
  rs_km: number
  isco_au_prograde: number
  photon_sphere_au: number
  flares_per_day: number
  accretion_disk: {
    inner_au: number
    outer_au: number
    inner_temp_K: number
    outer_temp_K: number
  }
  ra_deg: number
  dec_deg: number
  dist_pc: number
}

export const SGR_A_STAR: SgrAStar = {
  id: 'Sgr-A*',
  label: 'Sagittarius A*',
  type: 'Kerr',
  mass_msun:        4.154e6,
  spin_parameter:   0.5,           // estimated; direct measurement pending ngEHT
  rs_au:            0.0820,        // Schwarzschild radius — 12.26 million km
  rs_km:            12.26e6,
  isco_au_prograde: 0.369,         // ~4.5 Rs for Kerr a*≈0.5, prograde equatorial
  photon_sphere_au: 0.123,         // 1.5 Rs (Schwarzschild approximation)
  flares_per_day:   5.5,           // JWST MIRI 2025 — 5-6 major flares/day
  accretion_disk: {
    inner_au:     4.1,             // ~50 Rs hot inner edge
    outer_au:     29.5,            // ~360 Rs
    inner_temp_K: 1e7,             // 10 million K at ISCO
    outer_temp_K: 1e4,             // 10,000 K at outer disk
  },
  ra_deg:  266.4168,               // J2000
  dec_deg: -29.0078,
  dist_pc: 8178,
}

// ── S-stars ───────────────────────────────────────────────────────────────────

export interface SStar {
  name: string
  /** Semi-major axis in AU (angular × R₀) */
  semi_major_au: number
  eccentricity: number
  period_yr: number
  /** Orbital inclination relative to sky plane, degrees */
  inclination_deg: number
  /** Argument of periapsis, degrees */
  omega_deg: number
  /** Longitude of ascending node, degrees */
  Omega_deg: number
  /** Time of periapsis passage, decimal year */
  tp_year: number
  /** K-band apparent magnitude */
  mag_K: number
  spectral_type: string
  color_hex: string
  /** Periapsis distance in units of Schwarzschild radii */
  periapsis_rs: number
  source: string
}

export const S_STARS: SStar[] = [
  {
    name: 'S2',
    semi_major_au:  1023,
    eccentricity:   0.8843,
    period_yr:      16.0455,
    inclination_deg: 134.567,
    omega_deg:      66.109,
    Omega_deg:      228.174,
    tp_year:        2002.315,
    mag_K:          14.1,
    spectral_type:  'O8-B0V',
    color_hex:      '#a8c8ff',
    periapsis_rs:   1400,           // 120 AU / 0.082 AU ≈ 1400 Rs
    source:         'Gillessen+2017, GRAVITY Collaboration 2018-2022',
  },
  {
    name: 'S62',
    semi_major_au:  606,
    eccentricity:   0.976,
    period_yr:      9.9,
    inclination_deg: 72.8,
    omega_deg:      42.6,
    Omega_deg:      122.6,
    tp_year:        2003.3,
    mag_K:          16.5,
    spectral_type:  'OB',
    color_hex:      '#c8d8ff',
    periapsis_rs:   178,            // 14.6 AU periapsis / 0.082 AU = 178 Rs
    source:         'Peissker et al. 2020 ApJ 902 L14',
  },
  {
    name: 'S4714',
    semi_major_au:  888,
    eccentricity:   0.985,
    period_yr:      12.0,
    inclination_deg: 127.7,
    omega_deg:      357.6,
    Omega_deg:      129.0,
    tp_year:        2008.0,
    mag_K:          17.8,
    spectral_type:  'OB',
    color_hex:      '#d0e0ff',
    periapsis_rs:   161,            // 13.2 AU periapsis / 0.082 AU = 161 Rs
    source:         'Peissker et al. 2020 ApJ 902 L14',
  },
  {
    name: 'S8',
    semi_major_au:  1938,
    eccentricity:   0.8031,
    period_yr:      66.0,
    inclination_deg: 74.37,
    omega_deg:      346.70,
    Omega_deg:      315.43,
    tp_year:        1983.64,
    mag_K:          14.5,
    spectral_type:  'OB supergiant',
    color_hex:      '#ffe4c8',
    periapsis_rs:   4680,           // 383 AU periapsis
    source:         'Gillessen+2017',
  },
  {
    name: 'S55',
    semi_major_au:  847,
    eccentricity:   0.7210,
    period_yr:      11.5,
    inclination_deg: 150.0,
    omega_deg:      325.3,
    Omega_deg:      325.0,
    tp_year:        2009.0,
    mag_K:          17.4,
    spectral_type:  'OB',
    color_hex:      '#d8e8ff',
    periapsis_rs:   2862,           // 235 AU periapsis
    source:         'Meyer+2012, Gillessen+2017',
  },
  {
    name: 'S14',
    semi_major_au:  2241,
    eccentricity:   0.9630,
    period_yr:      55.0,
    inclination_deg: 100.0,
    omega_deg:      346.0,
    Omega_deg:      226.0,
    tp_year:        2000.0,
    mag_K:          15.7,
    spectral_type:  'OB',
    color_hex:      '#ffd8b0',
    periapsis_rs:   1006,           // 82.5 AU periapsis
    source:         'Gillessen+2017',
  },
]

// ── Compact clusters / secondary BH objects ───────────────────────────────────

export interface CompactObject {
  id: string
  label: string
  /** Position relative to Sgr A* in AU, [x, y, z] in galactic-center frame */
  offset_au: [number, number, number]
  dist_from_sgra_ly: number
  type: 'IMBH_candidate' | 'massive_star_cluster'
  mass_msun: number
  bh_mass_lower_msun?: number
  wr_stars_count?: number
  description: string
  source: string
  color_hex: string
}

export const COMPACT_OBJECTS: CompactObject[] = [
  {
    id: 'IRS-13E',
    label: 'IRS 13E',
    offset_au:            [5400, 2400, 0],   // ~0.1 ly projected west+south of Sgr A*
    dist_from_sgra_ly:    0.1,
    type:                 'IMBH_candidate',
    mass_msun:            5e4,                // total cluster mass estimate
    bh_mass_lower_msun:   1e4,               // lower-limit IMBH from dynamics (Schödel+2023)
    wr_stars_count:       6,
    description:          'Compact evaporating cluster containing an IMBH candidate. Multi-disk structure detected by VLT+ALMA. Spiraling inward via dynamical friction — will merge with Sgr A* in ~10 Myr. Primary intermediate-mass-ratio inspiral (IMRI) gravitational wave source for the LISA mission.',
    source:               'Schödel et al. 2023 A&A 672 L5; Maillard et al. 2004 A&A 423 155',
    color_hex:            '#ff9944',
  },
]

// ── Settlement zones ───────────────────────────────────────────────────────────

export interface SettlementZone {
  id: string
  label: string
  /** Distance from Sgr A* in Schwarzschild radii */
  orbital_radius_rs: number
  orbital_radius_au: number
  orbital_radius_km: number
  /**
   * Gravitational time dilation (Schwarzschild approximation τ/t).
   * 1.0 = no dilation. 0.8 = 1 yr here = 0.8 yr of far-away time.
   */
  time_dilation_factor: number
  radiation_class: 'standard' | 'elevated' | 'extreme'
  research_focus: string
  settlement_note: string
  exoloc_address: string
  panel_color: string
  ring_color_hex: string
}

export const SETTLEMENT_ZONES: SettlementZone[] = [
  {
    id: 'photon-sphere',
    label: 'Photon Sphere Station',
    orbital_radius_rs:    1.5,
    orbital_radius_au:    0.123,
    orbital_radius_km:    18.4e6,
    time_dilation_factor: 0.577,   // sqrt(1 - 1/1.5)
    radiation_class:      'extreme',
    research_focus:       'Extreme gravitational lensing, photon orbit physics, time dilation calibration',
    settlement_note:      'Theoretical reference station. Light circles the BH here — the entire sky collapses to a ring above and below. Every photon emitted at this radius eventually returns.',
    exoloc_address:       'exotopia:bh-orbital:Sgr-A*/photon-sphere',
    panel_color:          'amber-10',
    ring_color_hex:       '#ff6600',
  },
  {
    id: 'isco',
    label: 'ISCO Research Platform',
    orbital_radius_rs:    4.5,
    orbital_radius_au:    0.369,
    orbital_radius_km:    55.2e6,
    time_dilation_factor: 0.832,   // sqrt(1 - 1/4.5) approx
    radiation_class:      'extreme',
    research_focus:       'Innermost stable circular orbit dynamics, accretion plasma physics, orbital decay tracking',
    settlement_note:      'Innermost orbit where matter can persist without spiraling in. Prograde equatorial for Kerr a*≈0.5. Accretion disk plasma visible above at 10 million K.',
    exoloc_address:       'exotopia:bh-orbital:Sgr-A*/isco',
    panel_color:          'orange-9',
    ring_color_hex:       '#ff8800',
  },
  {
    id: 'flare-observatory',
    label: 'Flare Observatory',
    orbital_radius_rs:    6,
    orbital_radius_au:    0.492,
    orbital_radius_km:    73.6e6,
    time_dilation_factor: 0.913,   // sqrt(1 - 1/6)
    radiation_class:      'elevated',
    research_focus:       'Magnetic reconnection events, plasmoid tracking, near-infrared flare timing',
    settlement_note:      'Consistent with plasmoid positions detected by JWST MIRI 2025 (5–6 flares/day at ~6 Rs). Plasma hotspots orbit at near-relativistic speeds — visible as bright streaks.',
    exoloc_address:       'exotopia:bh-orbital:Sgr-A*/stable-orbital:6rs',
    panel_color:          'deep-orange-8',
    ring_color_hex:       '#ffaa00',
  },
  {
    id: 'disk-mid',
    label: 'Accretion Disk Mid',
    orbital_radius_rs:    50,
    orbital_radius_au:    4.1,
    orbital_radius_km:    614e6,
    time_dilation_factor: 0.990,   // sqrt(1 - 1/50)
    radiation_class:      'elevated',
    research_focus:       'Disk structure, dust chemistry, synchrotron radiation mapping',
    settlement_note:      'Hot inner accretion disk visible as a luminous plane spanning 160°. The BH shadow fills 30° of sky. Disk temperature ~10 million K at inner edge visible as extreme UV/X-ray flux.',
    exoloc_address:       'exotopia:bh-orbital:Sgr-A*/accretion-disk-mid',
    panel_color:          'amber-8',
    ring_color_hex:       '#ffcc44',
  },
  {
    id: 's-star-deck',
    label: 'S2 Transit Deck',
    orbital_radius_rs:    1400,
    orbital_radius_au:    114.8,
    orbital_radius_km:    17.2e9,
    time_dilation_factor: 0.9996,  // sqrt(1 - 1/1400)
    radiation_class:      'standard',
    research_focus:       'Relativistic orbital precession, S2 star speed measurement, gravitational redshift',
    settlement_note:      'Co-orbital with S2 periapsis approach (120 AU, 2.5% c). Watch the star streak past at 7,650 km/s. The Schwarzschild precession of 12 arcminutes per orbit is directly measurable.',
    exoloc_address:       'exotopia:bh-orbital:Sgr-A*/stable-orbital:1400rs',
    panel_color:          'blue-grey-7',
    ring_color_hex:       '#88aacc',
  },
  {
    id: 'irs13e-outpost',
    label: 'IRS 13E Outpost',
    orbital_radius_rs:    75610,   // 0.1 ly from Sgr A*
    orbital_radius_au:    6300,
    orbital_radius_km:    942e9,
    time_dilation_factor: 0.99999,
    radiation_class:      'standard',
    research_focus:       'IMBH growth dynamics, stellar tidal stripping, IMRI gravitational wave precursor observation',
    settlement_note:      'Base in the evaporating IRS 13E cluster. The resident IMBH (≥10,000 M☉) is spiraling toward Sgr A* — detectable by LISA. Six Wolf-Rayet stars are being tidally stripped around you.',
    exoloc_address:       'exotopia:bh-orbital:Sgr-A*/irs13e',
    panel_color:          'teal-8',
    ring_color_hex:       '#44ddaa',
  },
]

// ── Orbital mechanics helpers ──────────────────────────────────────────────────

const DEG = Math.PI / 180

/**
 * Solve Kepler's equation E - e sin(E) = M via Newton iteration.
 * M = mean anomaly (radians), e = eccentricity.
 * Returns eccentric anomaly E (radians).
 */
export function solveKepler(M: number, e: number): number {
  M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  let E = e > 0.8 ? Math.PI : M
  for (let i = 0; i < 80; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    E -= dE
    if (Math.abs(dE) < 1e-12) break
  }
  return E
}

/**
 * Convert orbital elements + true anomaly to 3D Cartesian position (AU).
 * Standard celestial mechanics rotation: ω, i, Ω all in radians.
 */
export function orbitalToXYZ(
  r: number, nu: number,
  i: number, omega: number, Omega: number
): [number, number, number] {
  const cosO = Math.cos(Omega), sinO = Math.sin(Omega)
  const cosi = Math.cos(i),     sini = Math.sin(i)
  const cosw = Math.cos(omega), sinw = Math.sin(omega)
  const cosv = Math.cos(nu),    sinv = Math.sin(nu)

  const xOrb = r * cosv
  const yOrb = r * sinv

  const x = (cosO * cosw - sinO * sinw * cosi) * xOrb + (-cosO * sinw - sinO * cosw * cosi) * yOrb
  const y = (sinO * cosw + cosO * sinw * cosi) * xOrb + (-sinO * sinw + cosO * cosw * cosi) * yOrb
  const z = (sinw * sini) * xOrb + (cosw * sini) * yOrb

  return [x, y, z]
}

/**
 * Compute the 3D position of an S-star at a given decimal year.
 * Returns [x, y, z] in AU.
 */
export function sStarPositionAU(star: SStar, epoch_year: number): [number, number, number] {
  const M    = (2 * Math.PI * (epoch_year - star.tp_year)) / star.period_yr
  const E    = solveKepler(M, star.eccentricity)
  const nu   = 2 * Math.atan2(
    Math.sqrt(1 + star.eccentricity) * Math.sin(E / 2),
    Math.sqrt(1 - star.eccentricity) * Math.cos(E / 2)
  )
  const r    = star.semi_major_au * (1 - star.eccentricity * Math.cos(E))
  return orbitalToXYZ(
    r, nu,
    star.inclination_deg * DEG,
    star.omega_deg       * DEG,
    star.Omega_deg       * DEG
  )
}

/**
 * Generate N equally-spaced points along the orbit path.
 * Returns array of [x, y, z] in AU.
 */
export function sStarOrbitPath(star: SStar, nPoints = 360): [number, number, number][] {
  const pts: [number, number, number][] = []
  const a = star.semi_major_au
  const e = star.eccentricity
  const i  = star.inclination_deg * DEG
  const om = star.omega_deg       * DEG
  const Om = star.Omega_deg       * DEG

  for (let k = 0; k <= nPoints; k++) {
    const M  = (2 * Math.PI * k) / nPoints
    const E  = solveKepler(M, e)
    const nu = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    )
    const r  = a * (1 - e * Math.cos(E))
    pts.push(orbitalToXYZ(r, nu, i, om, Om))
  }
  return pts
}
