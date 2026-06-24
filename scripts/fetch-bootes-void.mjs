/**
 * fetch-bootes-void.mjs
 *
 * Data-sourcing script for the Boötes Void galaxy population.
 * Combines real catalog entries (from NASA/IPAC NED via TAP) with
 * seeded procedural generation to fill uncharted regions — mirroring
 * the XMM cluster + galaxy-oracle hybrid pattern used elsewhere.
 *
 * Data classification:
 *   source: 'catalog'   — real object from NED, has a ned_name + coordinates
 *   source: 'generated' — deterministically generated filler, no NED object
 *
 * The real catalog entries serve as signposted "this is a real place" destinations;
 * generated entries fill the volume so the interior feels inhabited.
 *
 * Output:
 *   public/void-galaxies/bootes.json
 *
 * Usage:
 *   node scripts/fetch-bootes-void.mjs
 *   npm run fetch-bootes-void
 *
 * Requires Node >= 18 (native fetch).  No dependencies outside stdlib.
 *
 * Coordinate note:
 *   The app uses raDeg: 230 for Boötes Void centre (cosmic-structures.ts).
 *   The literature canonical centre is ~RA 222–224°.  We query a 30° cone
 *   so both are covered; 3-D distance filtering uses the app centre.
 *
 * Void parameters (cosmic-structures.ts):
 *   raDeg: 230  decDeg: 46  distMpc: 250  radiusMpc: 130
 *
 * Sources:
 *   Kirshner et al. 1987 (original Boötes Void discovery)
 *   UV Deep Imaging Survey of Galaxies in the Boötes Void — arXiv:2107.01774
 *   Metal Abundances in and around Boötes Void — arXiv:1908.07539
 *   AGN activity in voids — arXiv:2512.14825, arXiv:2601.00594
 *   Hamaus HSW density profile — Phys.Rev.Lett. 112, 251302 (2014)
 */

import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname }         from 'path'
import { fileURLToPath }            from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')

// ── Void parameters — must match cosmic-structures.ts ────────────────────────

const VOID = {
  name:       'Boötes Void',
  id:         'bootes-void',
  ra_deg:     230.0,  // app canonical centre (cosmic-structures.ts)
  dec_deg:     46.0,
  dist_mpc:   250.0,
  radius_mpc: 130.0,
  z_center:   0.0584,
}

// Hamaus HSW compensation-wall fraction: wall band begins at ~80% of radius
// (in the HSW profile the overdense wall peaks just outside r_v).
const WALL_BAND_FRAC = 0.80

const H0 = 70        // km/s/Mpc — matches app assumption
const C  = 299792    // km/s

function distToZ (mpc)  { return mpc * H0 / C }
function zToDist  (z)   { return z  * C  / H0 }

// Redshift range: void centre ± radius with 12% margin
const Z_MIN = distToZ(Math.max(1, VOID.dist_mpc - VOID.radius_mpc)) * 0.88
const Z_MAX = distToZ(VOID.dist_mpc + VOID.radius_mpc) * 1.12

// Angular cone radius (degrees) for the NED sky query — generous enough to
// cover the full projected extent of the void at the catalogue depth.
const CONE_DEG = 30.0

// Coordinate transform matching cosmic-structures.ts mpcToVec3()
function mpcToCart (ra_deg, dec_deg, dist_mpc) {
  const ra  = ra_deg  * Math.PI / 180
  const dec = dec_deg * Math.PI / 180
  return [
     dist_mpc * Math.cos(dec) * Math.cos(ra),
     dist_mpc * Math.sin(dec),
    -dist_mpc * Math.cos(dec) * Math.sin(ra),  // negative Z, matches Three.js convention
  ]
}

const VOID_CART = mpcToCart(VOID.ra_deg, VOID.dec_deg, VOID.dist_mpc)

function subtract3 (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] }
function len3      (v)    { return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2) }
function scale3    (v, s) { return [v[0] * s, v[1] * s, v[2] * s] }

// 1 Mpc → 1/15 scene units  (matches MPC_SCALE in cosmic-structures.ts)
const MPC_SCALE = 1 / 15

// ── NED TAP — real galaxy catalog query ──────────────────────────────────────

const NED_TAP = 'https://ned.ipac.caltech.edu/tap/sync'

// ADQL: cone search around the Boötes region, galaxy types only, in the void's
// redshift slice.  We use the wider literature centre (RA 222.5) for the sky
// query so we don't miss known void galaxies found in the Kirshner/UV surveys
// that sit closer to the 222° centre, then do a 3-D distance cut afterwards.
// NED TAP column names confirmed via TAP_SCHEMA.columns:
//   prefname     — preferred object name
//   prefphytype  — preferred physical type ('G' = galaxy)
//   z            — redshift
const NED_QUERY = [
  'SELECT TOP 4000',
  '  prefname, ra, dec, z, prefphytype',
  'FROM NEDTAP.objdir',
  `WHERE CONTAINS(POINT('J2000', ra, dec), CIRCLE('J2000', 226.25, 46.0, ${CONE_DEG})) = 1`,
  `AND z BETWEEN ${Z_MIN.toFixed(4)} AND ${Z_MAX.toFixed(4)}`,
  `AND prefphytype = 'G'`,
].join(' ')

async function fetchNedGalaxies () {
  const url = `${NED_TAP}?LANG=ADQL&REQUEST=doQuery&FORMAT=json&QUERY=${encodeURIComponent(NED_QUERY)}`

  console.log('NASA/IPAC NED TAP — Boötes Void cone search')
  console.log(`  centre  : RA 226.25°  Dec 46.0°  r = ${CONE_DEG}°`)
  console.log(`  z range : ${Z_MIN.toFixed(4)} – ${Z_MAX.toFixed(4)}`)
  console.log(`  type    : G (galaxy)`)
  console.log()

  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), 60_000)

  let res
  try {
    res = await fetch(url, {
      signal:  controller.signal,
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    clearTimeout(timeout)
    console.warn(`  NED fetch error: ${err.message}`)
    console.warn('  Proceeding with full procedural generation.')
    return []
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.warn(`  NED HTTP ${res.status}: ${body.slice(0, 200)}`)
    console.warn('  Proceeding with full procedural generation.')
    return []
  }

  let json
  try {
    json = await res.json()
  } catch (err) {
    console.warn(`  NED JSON parse error: ${err.message} — falling back.`)
    return []
  }

  // NED TAP returns: { metadata: [{name:'prefname',...}, ...], data: [[v1,v2,...], ...] }
  if (Array.isArray(json)) return json  // fallback: plain row-object array

  const metaArr = json?.metadata ?? json?.fields
  if (json && Array.isArray(json.data) && Array.isArray(metaArr)) {
    const cols = metaArr.map(f => f.name ?? f.ID ?? '')
    return json.data.map(row => {
      const obj = {}
      cols.forEach((c, i) => { obj[c] = row[i] })
      return obj
    })
  }

  console.warn('  NED returned unexpected JSON shape — falling back.')
  console.warn('  (Received keys:', Object.keys(json ?? {}).join(', '), ')')
  return []
}

// ── Mulberry32 PRNG — identical to seededRng() in CosmicPage.vue ─────────────

function mulberry32 (seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function nameHash (str) {
  return str.split('').reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7) >>> 0
}

// ── Void galaxy morphology distribution ──────────────────────────────────────
// Voids select for late-type, star-forming, gas-rich disc galaxies.
// Ellipticals are suppressed (~8%) relative to clusters; irregulars elevated (~22%).
// Sources: Kreckel+2012, Beygu+2016, UV Deep Imaging Survey (arXiv:2107.01774).

const MORPH_TABLE = [
  ['Sb',  0.30],
  ['Irr', 0.22],
  ['Sa',  0.18],
  ['S0',  0.10],
  ['E',   0.08],
  ['Sb',  0.07],  // second Sb band (covers Sbc/Sc)
  ['Irr', 0.04],  // second Irr band (covers dIrr/dE)
  ['cD',  0.01],  // rare — only in very poor groups near the wall
]

function pickMorph (rng) {
  const r = rng()
  let cumul = 0
  for (const [m, w] of MORPH_TABLE) {
    cumul += w
    if (r < cumul) return m
  }
  return 'Irr'
}

// ── Void galaxy colour — bluer than cluster galaxies ─────────────────────────
// Void galaxies are more actively star-forming; bluer optical colours.
// The colour is used for Three.js sprite/point rendering (hex string).

function morphToColor (morph, rng) {
  const ji = (range) => Math.round((rng() - 0.5) * range)
  const cl = (v) => Math.max(0, Math.min(255, v))
  const hex2 = (v) => cl(v).toString(16).padStart(2, '0')
  const rgb = (r, g, b) => `#${hex2(r)}${hex2(g)}${hex2(b)}`

  if (morph === 'cD') return rgb(240 + ji(30), 200 + ji(30), 130 + ji(30))
  if (morph === 'E')  return rgb(210 + ji(30), 175 + ji(30), 120 + ji(30))
  if (morph === 'S0') return rgb(190 + ji(30), 180 + ji(30), 150 + ji(30))
  if (morph === 'Sa') return rgb(160 + ji(30), 175 + ji(30), 220 + ji(30))
  if (morph === 'Irr') return rgb(110 + ji(30), 145 + ji(30), 255 + ji(15))
  // Sb default — blue spiral
  return rgb(130 + ji(30), 155 + ji(30), 235 + ji(25))
}

// ── Axis ratio (disc foreshortening) ─────────────────────────────────────────

function morphAxisRatio (morph, rng) {
  if (morph === 'cD' || morph === 'E') return 1.0 - rng() * 0.15
  if (morph === 'S0') return 0.65 + rng() * 0.35
  return 0.35 + rng() * 0.65   // disc galaxies — random inclination
}

// ── Process NED rows into catalog galaxy entries ──────────────────────────────

function processCatalogRows (rows) {
  const galaxies = []
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const row  = rows[i]
    const ra   = parseFloat(row.ra)
    const dec  = parseFloat(row.dec)
    const z    = parseFloat(row.z)
    const name = String(row.prefname ?? row.objname ?? row.ned_main_name ?? `NED-${i}`)

    if (isNaN(ra) || isNaN(dec) || isNaN(z) || z <= 0) { skipped++; continue }

    const dist_mpc = zToDist(z)
    const cart     = mpcToCart(ra, dec, dist_mpc)
    const rel      = subtract3(cart, VOID_CART)   // offset from void centre (Mpc)
    const rMpc     = len3(rel)

    // 3-D distance cut — only accept objects within the void sphere
    if (rMpc > VOID.radius_mpc * 1.10) { skipped++; continue }

    const is_wall = rMpc > VOID.radius_mpc * WALL_BAND_FRAC
    const pos_void = scale3(rel, MPC_SCALE)

    // Per-galaxy appearance — seeded on the NED name for reproducibility
    const rng     = mulberry32(nameHash(name))
    const morph   = pickMorph(rng)
    const col_hex = morphToColor(morph, rng)

    galaxies.push({
      gid:        `bootes-void_cat_${String(galaxies.length).padStart(4, '0')}`,
      source:     'catalog',
      ned_name:   name,
      ra_deg:     parseFloat(ra.toFixed(5)),
      dec_deg:    parseFloat(dec.toFixed(5)),
      z:          parseFloat(z.toFixed(5)),
      dist_mpc:   parseFloat(dist_mpc.toFixed(2)),
      r_void_mpc: parseFloat(rMpc.toFixed(2)),
      morph,
      col_hex,
      pos_void:   pos_void.map(v => parseFloat(v.toFixed(5))),
      size_su:    parseFloat((0.018 + rng() * 0.020).toFixed(4)),
      opacity:    parseFloat((0.45  + rng() * 0.30).toFixed(3)),
      rot_rad:    parseFloat((rng() * Math.PI * 2).toFixed(4)),
      axis_ratio: parseFloat(morphAxisRatio(morph, rng).toFixed(3)),
      is_wall,
      has_agn:    rng() < 0.07,
    })
  }

  if (skipped > 0) console.log(`  Skipped ${skipped} rows (bad coords or outside void volume)`)
  return galaxies
}

// ── Seeded generation — fills uncharted regions of the void ──────────────────
// ~20% of generated galaxies placed in the wall band (80–100% r_v),
// ~80% in the interior — matching the void galaxy distribution in surveys.
// The cube-root sampling ( rng()^(1/3) ) gives uniform radial density in 3-D.

function generateFiller (count, startIndex) {
  const rng       = mulberry32(nameHash('Boötes Void Filler Seed'))
  const galaxies  = []
  const nWall     = Math.round(count * 0.20)

  for (let i = 0; i < count; i++) {
    const isWall = i < nWall
    const rFrac  = isWall
      ? WALL_BAND_FRAC + rng() * (1.0 - WALL_BAND_FRAC)  // wall band
      : rng() ** (1 / 3)                                   // uniform-in-sphere
    const r     = rFrac * VOID.radius_mpc

    const theta = rng() * Math.PI * 2
    const phi   = Math.acos(2 * rng() - 1)

    // Mpc offset from void centre (same coordinate frame)
    const relMpc = [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ]
    const pos_void = scale3(relMpc, MPC_SCALE)

    // Approximate sky position + distance for completeness of the JSON record
    const absCart  = [VOID_CART[0] + relMpc[0], VOID_CART[1] + relMpc[1], VOID_CART[2] + relMpc[2]]
    const dist_mpc = len3(absCart)
    const z        = distToZ(dist_mpc)

    const morph   = pickMorph(rng)
    const col_hex = morphToColor(morph, rng)

    galaxies.push({
      gid:        `bootes-void_gen_${String(startIndex + i).padStart(4, '0')}`,
      source:     'generated',
      ned_name:   null,
      ra_deg:     null,
      dec_deg:    null,
      z:          parseFloat(z.toFixed(5)),
      dist_mpc:   parseFloat(dist_mpc.toFixed(2)),
      r_void_mpc: parseFloat(r.toFixed(2)),
      morph,
      col_hex,
      pos_void:   pos_void.map(v => parseFloat(v.toFixed(5))),
      size_su:    parseFloat((0.012 + rng() * 0.016).toFixed(4)),
      opacity:    parseFloat((0.28  + rng() * 0.38).toFixed(3)),
      rot_rad:    parseFloat((rng() * Math.PI * 2).toFixed(4)),
      axis_ratio: parseFloat(morphAxisRatio(morph, rng).toFixed(3)),
      is_wall:    isWall,
      has_agn:    rng() < 0.07,
    })
  }

  return galaxies
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main () {
  console.log('Boötes Void — data sourcing pipeline')
  console.log('======================================')
  console.log(`App centre : RA ${VOID.ra_deg}°  Dec ${VOID.dec_deg}°  ${VOID.dist_mpc} Mpc`)
  console.log(`Radius     : ${VOID.radius_mpc} Mpc`)
  console.log(`z center   : ${VOID.z_center}`)
  console.log()

  // ── Phase 1: real catalog (NED) ───────────────────────────────────────────
  console.time('ned-fetch')
  const nedRows = await fetchNedGalaxies()
  console.timeEnd('ned-fetch')
  console.log(`  NED objects returned : ${nedRows.length}`)
  console.log()

  const catalogGalaxies = processCatalogRows(nedRows)
  console.log(`  Catalog entries (within void): ${catalogGalaxies.length}`)
  console.log()

  // ── Phase 2: seeded generation to fill deep interior gaps ────────────────
  // When NED returns good catalog coverage we still add a small filler set
  // to populate the deepest interior (r < 0.4 r_v) where surveys are sparse.
  // Cap at 60 generated entries when catalog is rich; 300 when catalog is thin.
  const GEN_MIN = 40
  const GEN_MAX = catalogGalaxies.length === 0 ? 300 : GEN_MIN
  const genCount = Math.min(GEN_MAX, Math.max(GEN_MIN, 300 - catalogGalaxies.length))
  console.log(`Generating ${genCount} filler galaxies (catalog: ${catalogGalaxies.length})...`)
  const generatedGalaxies = generateFiller(genCount, catalogGalaxies.length)
  console.log()

  // ── Assemble output ────────────────────────────────────────────────────────
  const allGalaxies = [...catalogGalaxies, ...generatedGalaxies]

  // Coverage report
  const nWall = allGalaxies.filter(g => g.is_wall).length
  const nAGN  = allGalaxies.filter(g => g.has_agn).length
  const morphCounts = {}
  for (const g of allGalaxies) morphCounts[g.morph] = (morphCounts[g.morph] ?? 0) + 1

  const output = {
    void_id:     VOID.id,
    void_name:   VOID.name,
    center: {
      ra_deg:   VOID.ra_deg,
      dec_deg:  VOID.dec_deg,
      dist_mpc: VOID.dist_mpc,
      z_center: VOID.z_center,
    },
    radius_mpc:        VOID.radius_mpc,
    wall_band_frac:    WALL_BAND_FRAC,
    mpc_scale:         MPC_SCALE,
    hamaus_profile: {
      note: 'Wall density peaks at r ≈ 1.0–1.2 × r_v per Hamaus et al. 2014 (arXiv:1403.5499). Use wall_band_frac to determine meniscus population zone.',
      ref:  'https://doi.org/10.1103/PhysRevLett.112.251302',
    },
    generated_at:      new Date().toISOString(),
    catalog_source:    'NASA/IPAC NED TAP (NEDTAP.objdir)',
    catalog_refs: [
      'Kirshner et al. 1987 — original Boötes Void discovery',
      'arXiv:2107.01774 — UV Deep Imaging Survey of Galaxies in the Boötes Void',
      'arXiv:1908.07539 — Metal Abundances and Star-Formation Rates in and around Boötes Void',
    ],
    agn_refs: [
      'arXiv:2512.14825 — Void Galaxies and AGN Activity in ZOBOV-identified TNG300 Voids',
      'arXiv:2601.00594 — The impact of cosmic voids on AGN activity',
    ],
    catalog_count:     catalogGalaxies.length,
    generated_count:   generatedGalaxies.length,
    total_count:       allGalaxies.length,
    wall_count:        nWall,
    agn_count:         nAGN,
    morph_distribution: morphCounts,
    galaxies:          allGalaxies,
  }

  // ── Write outputs ──────────────────────────────────────────────────────────
  mkdirSync(resolve(ROOT, 'public', 'void-galaxies'), { recursive: true })

  // Full-detail JSON — all fields including ned_name, ra/dec, z, dist
  const detailPath = resolve(ROOT, 'public', 'void-galaxies', 'bootes-detail.json')
  writeFileSync(detailPath, JSON.stringify(output, null, 0))
  const detailKB = Math.round(Buffer.byteLength(JSON.stringify(output)) / 1024)

  // Slim viz JSON — rendering-essential fields only; ~4× smaller
  // Strips ned_name, ra_deg, dec_deg, dist_mpc (not needed in Three.js renderer).
  // pos_void is the authoritative scene position; gid is stable across reruns.
  const VIZ_FIELDS = new Set(['gid','source','morph','col_hex','pos_void','size_su','opacity','rot_rad','axis_ratio','is_wall','has_agn','z','r_void_mpc'])
  const vizOutput  = {
    ...output,
    galaxies: allGalaxies.map(g => {
      const slim = {}
      for (const k of VIZ_FIELDS) slim[k] = g[k]
      return slim
    }),
  }
  const vizPath = resolve(ROOT, 'public', 'void-galaxies', 'bootes-viz.json')
  writeFileSync(vizPath, JSON.stringify(vizOutput, null, 0))
  const vizKB = Math.round(Buffer.byteLength(JSON.stringify(vizOutput)) / 1024)

  console.log('Output')
  console.log('------')
  console.log(`  ✓ public/void-galaxies/bootes-detail.json  ${detailKB} KB  (full catalog data)`)
  console.log(`  ✓ public/void-galaxies/bootes-viz.json     ${vizKB} KB  (slim rendering data)`)
  console.log()
  console.log('Population summary')
  console.log('------------------')
  console.log(`  total galaxies : ${allGalaxies.length}`)
  console.log(`  catalog (real) : ${catalogGalaxies.length}`)
  console.log(`  generated fill : ${generatedGalaxies.length}`)
  console.log(`  wall-band      : ${nWall}  (~${Math.round(nWall / allGalaxies.length * 100)}% — meniscus zone)`)
  console.log(`  with AGN       : ${nAGN}  (~${Math.round(nAGN / allGalaxies.length * 100)}% — void-suppressed rate)`)
  console.log()
  console.log('Morphology distribution')
  console.log('-----------------------')
  for (const [m, n] of Object.entries(morphCounts).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.round(n / allGalaxies.length * 40))
    console.log(`  ${m.padEnd(4)} ${String(n).padStart(4)}  ${bar}`)
  }
  console.log()
  console.log('Done.  Rebuild the app to pick up the new data.')
  if (catalogGalaxies.length === 0) {
    console.log()
    console.log('NOTE: NED returned 0 catalog entries.  The output is entirely')
    console.log('      procedural.  Check the NED TAP endpoint and ADQL query,')
    console.log('      or manually import entries from arXiv:2107.01774 Table 1.')
  }
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
