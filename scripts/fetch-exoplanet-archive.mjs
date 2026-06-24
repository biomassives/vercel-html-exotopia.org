/**
 * fetch-exoplanet-archive.mjs
 *
 * Re-pulls the NASA Exoplanet Archive confirmed planet catalog and rebuilds
 * the two JSON files consumed by the app:
 *
 *   public/exoplanets-viz.json    — slim per-planet rows (app bundle target)
 *   public/exoplanets-detail.json — full column set for admin/debug
 *
 * Source: pscomppars (Planetary Systems Composite Parameters)
 *   One row per confirmed planet, using the best available parameter value
 *   across all published references.  This is the canonical "one truth" table.
 *
 * Key fix vs the April 2024 file (which used the `ps` table):
 *   - pl_bmasse  (composite best mass, Earth masses) — was pl_masse in ps
 *   - st_rad     (host star radius, Solar radii)     — was missing
 *   - st_teff    (host star temperature)             — was missing from the 35k set
 *
 * Usage:
 *   node scripts/fetch-exoplanet-archive.mjs
 *   npm run fetch-exoplanets
 *
 * Requires Node >= 18 (native fetch).
 * No dependencies outside the standard library.
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')

// ── Column sets ───────────────────────────────────────────────────────────────

// Full column set written to exoplanets-detail.json
const DETAIL_COLS = [
  'pl_name', 'hostname',
  'sy_snum', 'sy_pnum', 'sy_mnum', 'cb_flag',
  'discoverymethod', 'disc_year', 'disc_facility', 'pl_controv_flag',
  'pl_orbper', 'pl_orbsmax', 'pl_rade', 'pl_radj',
  'pl_bmasse', 'pl_massj',      // pl_bmasse = composite best-estimate (Earth masses)
  'pl_orbeccen',
  'pl_insol', 'pl_eqt',
  'st_spectype', 'st_teff', 'st_rad', 'st_mass', 'st_age',
  'ra', 'dec', 'glon', 'glat', 'sy_dist',
]

// Slim set for the app-facing exoplanets-viz.json
// Keep this minimal — it's served to every browser session
const VIZ_COLS = new Set([
  'pl_name', 'hostname', 'ra', 'dec', 'sy_dist', 'glon', 'glat',
  'pl_rade', 'pl_eqt', 'pl_bmasse', 'pl_insol',
  'pl_orbsmax', 'pl_orbper', 'pl_orbeccen',
  'discoverymethod', 'disc_facility', 'disc_year',
  'pl_controv_flag', 'cb_flag',
  'sy_snum', 'sy_pnum', 'sy_mnum',
  'st_spectype', 'st_teff', 'st_rad',
])

// ── Query ─────────────────────────────────────────────────────────────────────

const QUERY = `SELECT ${DETAIL_COLS.join(',')} FROM pscomppars ORDER BY pl_name`
const TAP   = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync'
const URL   = `${TAP}?query=${encodeURIComponent(QUERY)}&format=json`

// ── Fetch ─────────────────────────────────────────────────────────────────────

console.log('NASA Exoplanet Archive — pscomppars pull')
console.log('Columns:', DETAIL_COLS.join(', '))
console.log()

const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 120_000)   // 2-minute hard cap

console.time('fetch')
let res
try {
  res = await fetch(URL, {
    signal: controller.signal,
    headers: { Accept: 'application/json' },
  })
} finally {
  clearTimeout(timeout)
}

if (!res.ok) {
  const body = await res.text()
  throw new Error(`HTTP ${res.status} ${res.statusText}\n${body.slice(0, 400)}`)
}

const data = await res.json()
console.timeEnd('fetch')
console.log()

if (!Array.isArray(data) || data.length === 0) {
  throw new Error('Unexpected response shape — expected a non-empty array')
}

// ── Coverage report ───────────────────────────────────────────────────────────

const pct = (key) =>
  Math.round(data.filter(p => p[key] != null).length / data.length * 100)

console.log(`Planets received : ${data.length}`)
console.log(`sy_dist coverage : ${pct('sy_dist')}%`)
console.log(`st_teff coverage : ${pct('st_teff')}%`)
console.log(`st_rad  coverage : ${pct('st_rad')}%`)
console.log(`pl_bmasse coverage: ${pct('pl_bmasse')}%`)
console.log(`pl_eqt  coverage : ${pct('pl_eqt')}%`)
console.log()

// ── Write exoplanets-detail.json ──────────────────────────────────────────────

const detailPath = resolve(ROOT, 'public', 'exoplanets-detail.json')
writeFileSync(detailPath, JSON.stringify(data))
const detailKB = Math.round(JSON.stringify(data).length / 1024)
console.log(`✓ exoplanets-detail.json  ${detailKB} KB  (${data.length} planets, ${DETAIL_COLS.length} cols)`)

// ── Write exoplanets-viz.json (slim) ──────────────────────────────────────────

const viz = data.map(p => {
  const row = {}
  for (const k of VIZ_COLS) row[k] = p[k] ?? null
  return row
})
const vizPath = resolve(ROOT, 'public', 'exoplanets-viz.json')
writeFileSync(vizPath, JSON.stringify(viz))
const vizKB = Math.round(JSON.stringify(viz).length / 1024)
console.log(`✓ exoplanets-viz.json     ${vizKB} KB  (${viz.length} planets, ${VIZ_COLS.size} cols)`)

// ── Verify Planet interface alignment ────────────────────────────────────────

const INTERFACE_FIELDS = [
  'pl_name', 'hostname', 'ra', 'dec', 'sy_dist',
  'pl_orbsmax', 'pl_orbper', 'pl_eqt', 'pl_rade', 'pl_bmasse',
  'pl_insol', 'st_teff', 'st_spectype', 'sy_mnum', 'sy_pnum', 'sy_snum',
  'glon', 'glat', 'discoverymethod', 'st_rad',
]
const sampleKeys = new Set(Object.keys(viz[0]))
const missing = INTERFACE_FIELDS.filter(f => !sampleKeys.has(f))
if (missing.length) {
  console.warn(`\n⚠  Fields expected by Planet interface but missing from viz: ${missing.join(', ')}`)
} else {
  console.log('\n✓ All Planet interface fields present in viz output')
}

console.log('\nDone — rebuild the app to pick up the new data.')
