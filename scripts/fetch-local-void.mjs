/**
 * fetch-local-void.mjs
 *
 * Data-sourcing script for the Local Void galaxy population.
 * Adapted from fetch-bootes-void.mjs — same hybrid catalog+generated
 * pipeline, same output shape, same wall-banding logic. One real
 * geometric difference from Boötes: the Milky Way sits INSIDE the
 * Local Void (dist_mpc 23 < radius_mpc 45 — see VoidMathPage.vue's
 * "Q3 — are we actually inside?" section), so wall galaxies (e.g.
 * NGC 6503, the best-documented near-wall member) are scattered
 * across the whole sky, not clustered in one direction. A directional
 * cone search (as Boötes uses, viewed from well outside) would miss
 * most of them — this script queries the redshift slice with no
 * spatial cone at all, and relies on the 3-D distance-from-void-centre
 * cut to do the real filtering, same as Boötes' script already does
 * as a secondary check.
 *
 * NED TAP has a hard 60-second server-side cap on synchronous queries
 * (confirmed via its own VOTable error response). TOP is kept at a
 * value empirically confirmed to complete well inside that cap; if
 * NED becomes slower, lower NED_TOP rather than raising the client
 * timeout — the client can wait longer, but the server will still
 * kill the query at 60s regardless.
 *
 * Because the MW sits inside the void, the 3-D distance-from-centre
 * cut is geometrically permissive for anything within roughly
 * (radius_mpc*1.10 − dist_mpc) of Earth in ANY direction — a large
 * chunk of the nearby universe, including foreground groups that are
 * not physically void members. INTERIOR_CATALOG_CAP guards against
 * that: real literature-confirmed Local Void interior population is
 * "dozens, not hundreds" (Tully et al. 2008; Nasonova & Karachentsev
 * 2011 void-galaxy catalogs), so catalog rows classified as interior
 * (not wall) are capped, keeping the ones closest to the void centre
 * and dropping the rest rather than letting foreground contamination
 * pass as void population. No such cap applies to the wall band,
 * which is physically expected to be denser.
 *
 * Data classification:
 *   source: 'catalog'   — real object from NED, has a ned_name + coordinates
 *   source: 'generated' — deterministically generated filler, no NED object
 *
 * Output:
 *   public/void-galaxies/local-void-detail.json
 *   public/void-galaxies/local-void-viz.json
 *
 * Usage:
 *   node scripts/fetch-local-void.mjs
 *
 * Requires Node >= 18 (native fetch). No dependencies outside stdlib.
 *
 * Void parameters (cosmic-structures.ts):
 *   raDeg: 219  decDeg: 26  distMpc: 23  radiusMpc: 45
 *
 * Sources:
 *   Tully et al. 2008 — Local Void structure
 *   Hamaus HSW density profile — Phys.Rev.Lett. 112, 251302 (2014)
 */

import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname }         from 'path'
import { fileURLToPath }            from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')

// ── Void parameters — must match cosmic-structures.ts ────────────────────────

const VOID = {
  name:       'Local Void',
  id:         'local-void',
  ra_deg:     219.0,  // app canonical centre (cosmic-structures.ts) — nominal only; MW is inside the void
  dec_deg:     26.0,
  dist_mpc:    23.0,
  radius_mpc:  45.0,
  z_center:    0.00537,
}

// Hamaus HSW compensation-wall fraction: wall band begins at ~80% of radius
// (in the HSW profile the overdense wall peaks just outside r_v).
const WALL_BAND_FRAC = 0.80

const H0 = 70        // km/s/Mpc — matches app assumption
const C  = 299792    // km/s

function distToZ (mpc)  { return mpc * H0 / C }
function zToDist  (z)   { return z  * C  / H0 }

// Redshift range: from near-zero (MW is inside the void) out to centre+radius,
// with a 12% margin on the outer edge to catch far-wall members. Z_MIN is
// deliberately tiny (not the ~0.5 Mpc-equivalent floor this used to have) —
// that floor excluded real, literature-confirmed near-wall members like
// NGC 6503, whose observed velocity (~25 km/s) is peculiar-velocity-dominated
// rather than Hubble-flow, giving it a genuinely very low z despite sitting
// a real ~6 Mpc away. Only true foreground (z <= 0, blueshifted) is excluded,
// via the z <= 0 check already in processCatalogRows().
const Z_MIN = distToZ(0.3)
const Z_MAX = distToZ(VOID.dist_mpc + VOID.radius_mpc) * 1.12

// Real literature-confirmed Local Void interior population is small — Tully
// et al. 2008 and follow-up void-galaxy catalogs report dozens, not hundreds,
// of genuine interior members. Cap catalog rows classified as interior
// (r_void < radius_mpc * WALL_BAND_FRAC) at this count, keeping those closest
// to the void centre first, so foreground contamination that geometrically
// passes the 3-D cut (see file header) doesn't get counted as void interior
// population. The wall band has no such cap — it's physically expected denser.
const INTERIOR_CATALOG_CAP = 40

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

// ADQL: no spatial cone — see file header. Redshift slice + galaxy type only;
// the 3-D distance-from-void-centre cut in processCatalogRows() does the real
// spatial filtering, correctly handling the MW-inside-the-void geometry.
//
// TOP is deliberately well under NED TAP's 60s synchronous cap — empirically,
// TOP 4000 on this WHERE clause routinely exceeded 60s and aborted with zero
// rows returned (the original bug this cap fixes). TOP 2500 completed but at
// ~58s — too close to the cap to be reliable run to run (NED's own response
// time varies with server load). TOP 1600 gives real margin.
const NED_TOP = 1600
const NED_QUERY = [
  `SELECT TOP ${NED_TOP}`,
  '  prefname, ra, dec, z, prefphytype',
  'FROM NEDTAP.objdir',
  `WHERE z BETWEEN ${Z_MIN.toFixed(5)} AND ${Z_MAX.toFixed(5)}`,
  `AND prefphytype = 'G'`,
].join(' ')

async function fetchNedGalaxies () {
  const url = `${NED_TAP}?LANG=ADQL&REQUEST=doQuery&FORMAT=json&QUERY=${encodeURIComponent(NED_QUERY)}`

  console.log('NASA/IPAC NED TAP — Local Void all-sky redshift-slice search')
  console.log(`  z range : ${Z_MIN.toFixed(5)} – ${Z_MAX.toFixed(5)}  (no spatial cone — MW is inside the void)`)
  console.log(`  type    : G (galaxy)`)
  console.log()

  // Client timeout is intentionally longer than NED's 60s server-side cap —
  // this just gives the server room to send its own timeout error response
  // instead of the client aborting first and masking it.
  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), 75_000)

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
// Ellipticals are suppressed relative to clusters; irregulars elevated.
// Source: Tully et al. 2008.

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
  const candidates = []
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

    // 3-D distance cut — only accept objects within the void sphere. This is
    // the real spatial filter here (no cone search — see file header).
    if (rMpc > VOID.radius_mpc * 1.10) { skipped++; continue }

    const is_wall = rMpc > VOID.radius_mpc * WALL_BAND_FRAC
    candidates.push({ name, ra, dec, z, dist_mpc, rMpc, is_wall })
  }

  // Literature-informed contamination guard — see INTERIOR_CATALOG_CAP above.
  // Wall-band candidates pass through untouched; interior candidates are
  // capped, keeping those closest to the void centre first.
  const wallCandidates = candidates.filter(c => c.is_wall)
  const interiorCandidates = candidates
    .filter(c => !c.is_wall)
    .sort((a, b) => a.rMpc - b.rMpc)
    .slice(0, INTERIOR_CATALOG_CAP)
  const droppedInterior = candidates.filter(c => !c.is_wall).length - interiorCandidates.length

  const kept = [...wallCandidates, ...interiorCandidates]
  const galaxies = kept.map(({ name, ra, dec, z, dist_mpc, rMpc, is_wall }, idx) => {
    const pos_void = scale3(subtract3(mpcToCart(ra, dec, dist_mpc), VOID_CART), MPC_SCALE)

    // Per-galaxy appearance — seeded on the NED name for reproducibility
    const rng     = mulberry32(nameHash(name))
    const morph   = pickMorph(rng)
    const col_hex = morphToColor(morph, rng)

    return {
      gid:        `local-void_cat_${String(idx).padStart(4, '0')}`,
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
    }
  })

  if (skipped > 0) console.log(`  Skipped ${skipped} rows (bad coords or outside void volume)`)
  if (droppedInterior > 0) console.log(`  Capped ${droppedInterior} interior candidates as likely foreground contamination (INTERIOR_CATALOG_CAP=${INTERIOR_CATALOG_CAP})`)
  return galaxies
}

// ── Seeded generation — fills uncharted regions of the void ──────────────────
// ~20% of generated galaxies placed in the wall band (80–100% r_v),
// ~80% in the interior — matching the void galaxy distribution in surveys.
// The cube-root sampling ( rng()^(1/3) ) gives uniform radial density in 3-D.

function generateFiller (count, startIndex) {
  const rng       = mulberry32(nameHash('Local Void Filler Seed'))
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
      gid:        `local-void_gen_${String(startIndex + i).padStart(4, '0')}`,
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
  console.log('Local Void — data sourcing pipeline')
  console.log('======================================')
  console.log(`App centre : RA ${VOID.ra_deg}°  Dec ${VOID.dec_deg}°  ${VOID.dist_mpc} Mpc (nominal — MW is inside the void)`)
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
  const GEN_MIN = 40
  const GEN_MAX = catalogGalaxies.length === 0 ? 300 : GEN_MIN
  const genCount = Math.min(GEN_MAX, Math.max(GEN_MIN, 300 - catalogGalaxies.length))
  console.log(`Generating ${genCount} filler galaxies (catalog: ${catalogGalaxies.length})...`)
  const generatedGalaxies = generateFiller(genCount, catalogGalaxies.length)
  console.log()

  // ── Assemble output ────────────────────────────────────────────────────────
  const allGalaxies = [...catalogGalaxies, ...generatedGalaxies]

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
    catalog_source:    'NASA/IPAC NED TAP (NEDTAP.objdir) — all-sky redshift slice, no spatial cone (MW is inside this void)',
    catalog_refs: [
      'Tully et al. 2008 — Local Void structure',
      'NASA/IPAC NED TAP (NEDTAP.objdir) — live-queried at generation time',
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

  const detailPath = resolve(ROOT, 'public', 'void-galaxies', 'local-void-detail.json')
  writeFileSync(detailPath, JSON.stringify(output, null, 0))
  const detailKB = Math.round(Buffer.byteLength(JSON.stringify(output)) / 1024)

  const VIZ_FIELDS = new Set(['gid','source','morph','col_hex','pos_void','size_su','opacity','rot_rad','axis_ratio','is_wall','has_agn','z','r_void_mpc'])
  const vizOutput  = {
    ...output,
    galaxies: allGalaxies.map(g => {
      const slim = {}
      for (const k of VIZ_FIELDS) slim[k] = g[k]
      return slim
    }),
  }
  const vizPath = resolve(ROOT, 'public', 'void-galaxies', 'local-void-viz.json')
  writeFileSync(vizPath, JSON.stringify(vizOutput, null, 0))
  const vizKB = Math.round(Buffer.byteLength(JSON.stringify(vizOutput)) / 1024)

  console.log('Output')
  console.log('------')
  console.log(`  ✓ public/void-galaxies/local-void-detail.json  ${detailKB} KB  (full catalog data)`)
  console.log(`  ✓ public/void-galaxies/local-void-viz.json     ${vizKB} KB  (slim rendering data)`)
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
    console.log('      procedural.  Check the NED TAP endpoint and ADQL query.')
  }
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
