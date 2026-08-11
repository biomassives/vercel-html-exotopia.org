/**
 * bright-stars.ts
 *
 * A hand-curated catalog of ~45 of the brightest naked-eye stars, real J2000
 * coordinates/distances/magnitudes/temperatures from standard references
 * (Hipparcos-derived where available). This is a deliberately small slice of
 * SPEC.md §14's full design (a 118k-star Hipparcos pipeline generating one
 * sky JSON per exoplanet) — that pipeline needs an external catalog download
 * and a Python/astropy build step neither available nor warranted for a first
 * pass. This file instead gives SurfaceViewPage.vue's existing parallax math
 * (already proven on exoplanet host stars, see addStarField()'s "Layer 2")
 * a set of genuinely recognisable, named stars to work with, so a settlement's
 * sky reads as rich rather than only ever showing dim, unnamed exoplanet hosts.
 *
 * Fields mirror SPEC.md §14.4's schema subset relevant to a hand-curated list
 * (no HIP id, no constellation membership — those need the full catalog):
 *   name      — common/proper name
 *   ra, dec   — J2000 coordinates, degrees
 *   dist_pc   — distance from Earth, parsecs (some, e.g. Deneb/Betelgeuse,
 *               carry real observational uncertainty — using commonly-cited
 *               values, not claiming survey-grade precision)
 *   mag       — apparent visual magnitude as seen from Earth
 *   teff      — effective temperature, Kelvin (feeds starColorFromTeff())
 *   spectral  — spectral classification, for display only
 */

export interface BrightStar {
  name:     string
  ra:       number
  dec:      number
  dist_pc:  number
  mag:      number
  teff:     number
  spectral: string
}

export const BRIGHT_STARS: BrightStar[] = [
  { name: 'Sirius',        ra: 101.287, dec: -16.716, dist_pc: 2.64,  mag: -1.46, teff: 9940,  spectral: 'A1V' },
  { name: 'Canopus',       ra:  95.988, dec: -52.696, dist_pc: 95,    mag: -0.74, teff: 7350,  spectral: 'A9II' },
  { name: 'Alpha Centauri',ra: 219.902, dec: -60.834, dist_pc: 1.34,  mag: -0.27, teff: 5790,  spectral: 'G2V' },
  { name: 'Arcturus',      ra: 213.915, dec:  19.182, dist_pc: 11.26, mag: -0.05, teff: 4290,  spectral: 'K1.5III' },
  { name: 'Vega',          ra: 279.234, dec:  38.784, dist_pc: 7.68,  mag:  0.03, teff: 9600,  spectral: 'A0V' },
  { name: 'Capella',       ra:  79.172, dec:  45.998, dist_pc: 12.9,  mag:  0.08, teff: 5000,  spectral: 'G3III' },
  { name: 'Rigel',         ra:  78.634, dec:  -8.202, dist_pc: 264,   mag:  0.13, teff: 12100, spectral: 'B8Ia' },
  { name: 'Procyon',       ra: 114.825, dec:   5.225, dist_pc: 3.51,  mag:  0.34, teff: 6530,  spectral: 'F5IV-V' },
  { name: 'Betelgeuse',    ra:  88.793, dec:   7.407, dist_pc: 168,   mag:  0.50, teff: 3600,  spectral: 'M1-2Ia' },
  { name: 'Achernar',      ra:  24.429, dec: -57.237, dist_pc: 44,    mag:  0.46, teff: 15000, spectral: 'B6Vep' },
  { name: 'Hadar',         ra: 210.956, dec: -60.373, dist_pc: 120,   mag:  0.61, teff: 25000, spectral: 'B1III' },
  { name: 'Altair',        ra: 297.696, dec:   8.868, dist_pc: 5.13,  mag:  0.76, teff: 7550,  spectral: 'A7V' },
  { name: 'Acrux',         ra: 186.650, dec: -63.099, dist_pc: 99,    mag:  0.77, teff: 28000, spectral: 'B0.5IV' },
  { name: 'Aldebaran',     ra:  68.980, dec:  16.509, dist_pc: 20,    mag:  0.85, teff: 3900,  spectral: 'K5III' },
  { name: 'Antares',       ra: 247.352, dec: -26.432, dist_pc: 170,   mag:  0.96, teff: 3660,  spectral: 'M1.5Iab' },
  { name: 'Spica',         ra: 201.298, dec: -11.161, dist_pc: 77,    mag:  0.97, teff: 22300, spectral: 'B1III-IV' },
  { name: 'Pollux',        ra: 116.329, dec:  28.026, dist_pc: 10.3,  mag:  1.14, teff: 4670,  spectral: 'K0III' },
  { name: 'Fomalhaut',     ra: 344.413, dec: -29.622, dist_pc: 7.7,   mag:  1.16, teff: 8590,  spectral: 'A3V' },
  { name: 'Deneb',         ra: 310.358, dec:  45.280, dist_pc: 800,   mag:  1.25, teff: 8500,  spectral: 'A2Ia' },
  { name: 'Mimosa',        ra: 191.930, dec: -59.689, dist_pc: 108,   mag:  1.25, teff: 27000, spectral: 'B0.5III' },
  { name: 'Regulus',       ra: 152.093, dec:  11.967, dist_pc: 24,    mag:  1.36, teff: 12000, spectral: 'B8IVn' },
  { name: 'Adhara',        ra: 104.656, dec: -28.972, dist_pc: 132,   mag:  1.50, teff: 22000, spectral: 'B2II' },
  { name: 'Castor',        ra: 113.649, dec:  31.888, dist_pc: 15.6,  mag:  1.58, teff: 10300, spectral: 'A1V' },
  { name: 'Gacrux',        ra: 187.791, dec: -57.113, dist_pc: 27,    mag:  1.63, teff: 3600,  spectral: 'M3.5III' },
  { name: 'Shaula',        ra: 263.402, dec: -37.104, dist_pc: 170,   mag:  1.62, teff: 22000, spectral: 'B1.5IV' },
  { name: 'Bellatrix',     ra:  81.283, dec:   6.350, dist_pc: 74.9,  mag:  1.64, teff: 22000, spectral: 'B2III' },
  { name: 'Elnath',        ra:  81.573, dec:  28.608, dist_pc: 40.6,  mag:  1.65, teff: 13600, spectral: 'B7III' },
  { name: 'Miaplacidus',   ra: 138.300, dec: -69.717, dist_pc: 34.4,  mag:  1.67, teff: 8900,  spectral: 'A2IV' },
  { name: 'Alnilam',       ra:  84.053, dec:  -1.202, dist_pc: 412,   mag:  1.69, teff: 27000, spectral: 'B0Ia' },
  { name: 'Alnair',        ra: 332.058, dec: -46.961, dist_pc: 31,    mag:  1.73, teff: 13920, spectral: 'B6V' },
  { name: 'Alnitak',       ra:  85.190, dec:  -1.943, dist_pc: 387,   mag:  1.77, teff: 29500, spectral: 'O9.5Ib' },
  { name: 'Regor',         ra: 122.383, dec: -47.337, dist_pc: 342,   mag:  1.75, teff: 35000, spectral: 'WC8+O7.5' },
  { name: 'Alioth',        ra: 193.507, dec:  55.960, dist_pc: 25.3,  mag:  1.76, teff: 9020,  spectral: 'A1III-IVp' },
  { name: 'Kaus Australis',ra: 276.043, dec: -34.385, dist_pc: 44.6,  mag:  1.85, teff: 9960,  spectral: 'B9.5III' },
  { name: 'Mirfak',        ra:  51.081, dec:  49.861, dist_pc: 172,   mag:  1.79, teff: 6350,  spectral: 'F5Ib' },
  { name: 'Dubhe',         ra: 165.932, dec:  61.751, dist_pc: 37.7,  mag:  1.79, teff: 4660,  spectral: 'K0III' },
  { name: 'Wezen',         ra: 107.098, dec: -26.393, dist_pc: 540,   mag:  1.83, teff: 6100,  spectral: 'F8Ia' },
  { name: 'Alkaid',        ra: 206.885, dec:  49.313, dist_pc: 31,    mag:  1.86, teff: 15540, spectral: 'B3V' },
  { name: 'Sargas',        ra: 264.330, dec: -42.998, dist_pc: 89,    mag:  1.86, teff: 6294,  spectral: 'F1II' },
  { name: 'Avior',         ra: 125.629, dec: -59.510, dist_pc: 190,   mag:  1.86, teff: 3523,  spectral: 'K3III' },
  { name: 'Menkalinan',    ra:  89.882, dec:  44.947, dist_pc: 25.5,  mag:  1.90, teff: 9350,  spectral: 'A1IV' },
  { name: 'Atria',         ra: 252.166, dec: -69.028, dist_pc: 120,   mag:  1.91, teff: 4150,  spectral: 'K2IIb-IIIa' },
  { name: 'Alhena',        ra:  99.428, dec:  16.399, dist_pc: 33.8,  mag:  1.93, teff: 9260,  spectral: 'A1IV' },
  { name: 'Peacock',       ra: 306.412, dec: -56.735, dist_pc: 56,    mag:  1.94, teff: 17700, spectral: 'B2IV' },
  { name: 'Polaris',       ra:  37.955, dec:  89.264, dist_pc: 133,   mag:  1.98, teff: 6015,  spectral: 'F7Ib' },
]
