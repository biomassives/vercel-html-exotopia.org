#!/usr/bin/env node
/**
 * scripts/seed-settlement-states.mjs
 *
 * Generates a handful of populated settlement-dome states for UX testing —
 * DIFFERENT specializations (PFAS-tech-heavy, ecology/volunteering-heavy,
 * sparse/staff, minimal/liaison) so the dome-interior UI can be reviewed
 * without manually clicking through the real earn-a-certificate flow four
 * times over.
 *
 * Settlement dome contents (SettlementRecord / SettlementItem, see
 * src/lib/settlements.ts + src/lib/settlement-items.ts) are localStorage-only
 * by design — there is no server table for them. So "seeding" here means:
 * generate the exact encrypted payload the app itself would have written,
 * using a plain port of src/lib/storage-cipher.ts's cipher (deterministic,
 * the key material is a constant in the source — see that file's own
 * comment: "not a cryptographic primitive"). This script does NOT modify
 * anything in Supabase.
 *
 * Usage:
 *   node scripts/seed-settlement-states.mjs
 *
 * Then either:
 *   (a) open the printed URLs in devtools console on http://localhost:9001
 *       and paste the printed injection snippet before navigating, or
 *   (b) run `node scripts/seed-settlement-states.mjs --inject` to drive it
 *       via Playwright automatically and open each dome for you.
 *
 * The four settlements are tied to real cohort members / real earned
 * certificates already in the local Supabase seed data (see
 * supabase/seed_test_activity.sql, seed_test_ecology_activity.sql) — this
 * isn't arbitrary decoration, it's what those members' domes would
 * actually look like if they'd gone through the real "attach to my
 * settlement" flow for everything they'd earned.
 */

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Cipher port (matches src/lib/storage-cipher.ts + e8-lattice.ts's
// e8Roots() exactly — pure, deterministic, no browser APIs needed beyond
// TextEncoder, which Node has natively) ────────────────────────────────────

function e8Roots() {
  const roots = []
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      for (const si of [1, -1]) {
        for (const sj of [1, -1]) {
          const r = [0, 0, 0, 0, 0, 0, 0, 0]
          r[i] = si; r[j] = sj
          roots.push(r)
        }
      }
    }
  }
  for (let mask = 0; mask < 256; mask++) {
    let ones = 0
    for (let k = 0; k < 8; k++) if (mask & (1 << k)) ones++
    if (ones % 2 !== 0) continue
    const r = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
    for (let k = 0; k < 8; k++) if (mask & (1 << k)) r[k] = -0.5
    roots.push(r)
  }
  return roots
}

const SITE_SEED = 'xto:e8:ls:v1'
const E8_EXPONENTS = [1, 7, 11, 13, 17, 19, 23, 29]

let _roots = null, _seedVec = null
function roots() { return _roots ?? (_roots = e8Roots()) }
function seedVec() {
  if (_seedVec) return _seedVec
  const vec = new Uint8Array(8)
  for (let d = 0; d < 8; d++) {
    let h = 0x811c9dc5 >>> 0
    for (let c = 0; c < SITE_SEED.length; c++) {
      h ^= (SITE_SEED.charCodeAt(c) + d * 41 + E8_EXPONENTS[d]) & 0xFF
      h = Math.imul(h, 0x01000193) >>> 0
    }
    vec[d] = h & 0xFF
  }
  return (_seedVec = vec)
}
function keyByte(i) {
  const r = roots(), sv = seedVec()
  const ri = (i >>> 3) % r.length
  const dim = i & 7
  const scaled = Math.round((r[ri][dim] + 1) * 127.5)
  const sMix = (i & 0xFF) ^ ((i >>> 8) & 0xFF)
  return (scaled ^ sv[dim] ^ E8_EXPONENTS[dim] ^ sMix) & 0xFF
}
const ENC = new TextEncoder()
function encryptForStorage(plaintext) {
  const bytes = ENC.encode(plaintext)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] ^ keyByte(i))
  return Buffer.from(bin, 'binary').toString('base64')
}
function hashStorageKey(s) {
  let h = 0x811c9dc5 >>> 0
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(36)
}

// ── Four settlements, tied to real cohort members + real earned status ─────

const settlements = [
  {
    key: 'surface:Kepler-442 b', hostname: 'Kepler-442', planetName: 'Kepler-442 b',
    displayName: "Teacher_01's Settlement (Aurora Basin)",
    memberId: '11111111-1111-1111-1111-111111111116',
    starterColor: '#3fa6ff',
    items: [
      { meshPreset: 'comms-relay', color: '#00e5ff', zone: 'gateway', label: 'Comms Relay',
        description: 'Strengthens conduit range to neighbouring settlements.', type: 'reward',
        community: 'Mentorship — 4 confirmed sessions' },
      { meshPreset: 'archive-node', color: '#ff8844', zone: 'library', label: 'Archive Node',
        description: 'Extends the settlement knowledge base.', type: 'reward',
        community: 'Method Contributor — GAC proposal endorsed' },
      { meshPreset: 'decon-site-marker', color: '#ffaa33', zone: 'water-edge', label: 'Decontamination Site Marker',
        description: 'Marks a PFAS/PFOA decontamination project logged in your citizen-science work.', type: 'eco-ops',
        community: 'Aurora Basin Watershed' },
    ],
  },
  {
    key: 'surface:TRAPPIST-1 e', hostname: 'TRAPPIST-1', planetName: 'TRAPPIST-1 e',
    displayName: "Student_06's Settlement (Dock Runoff)",
    memberId: '11111111-1111-1111-1111-111111111109',
    starterColor: '#55e88a',
    items: [
      { meshPreset: 'monument', color: '#88aacc', zone: 'courtyard', label: 'Community Monument',
        description: 'Marks a community milestone or declaration.', type: 'reward',
        community: 'Field Volunteer — 50+ volunteering points' },
      { meshPreset: 'decon-site-marker', color: '#00e5ff', zone: 'water-edge', label: 'Decontamination Site Marker',
        description: 'Marks a PFAS/PFOA decontamination project logged in your citizen-science work.', type: 'eco-ops',
        community: 'Dock Runoff Site' },
      { meshPreset: 'planter', color: '#44bb44', zone: 'garden', label: 'Garden Planter',
        description: 'Cultivates alien flora adapted to local conditions.', type: 'constructed', buildCost: 20 },
    ],
  },
  {
    key: 'surface:K2-18 b', hostname: 'K2-18', planetName: 'K2-18 b',
    displayName: "Admin_01's Settlement (sparse/staff)",
    memberId: '11111111-1111-1111-1111-111111111120',
    starterColor: '#cc88ff',
    items: [
      { meshPreset: 'water-filter', color: '#0055aa', zone: 'water-edge', label: 'Water Filtration Unit',
        description: 'Improves water quality metrics for this settlement.', type: 'constructed', buildCost: 50 },
    ],
  },
  {
    key: 'surface:TOI-700 d', hostname: 'TOI-700', planetName: 'TOI-700 d',
    displayName: "Coder-AI Liaison's Settlement (minimal)",
    memberId: '11111111-1111-1111-1111-111111111122',
    starterColor: '#aa55ff',
    items: [
      { meshPreset: 'art-sphere', color: '#ff6688', zone: 'courtyard', label: 'Art Sphere',
        description: 'Displays community artwork or an NFT piece.', type: 'generated' },
    ],
  },
]

function starterLantern(s) {
  return {
    id: `starter-${hashStorageKey(s.key)}`, type: 'generated', meshPreset: 'starter-lantern', zone: 'gateway',
    label: 'Settlement Lantern',
    description: 'Baseline illumination granted automatically when a settlement is founded. Its colour is unique to this settlement.',
    color: s.starterColor, acquiredAt: Date.now(), settlementKey: s.key,
  }
}
function buildFullItems(s) {
  let idx = 0
  return [starterLantern(s), ...s.items.map(it => ({
    id: `seed-${hashStorageKey(s.key)}-${idx++}`,
    acquiredAt: Date.now() - (s.items.length - idx) * 86400000,
    settlementKey: s.key, ...it,
  }))]
}

const nowIso = new Date().toISOString()
const records = settlements.map(s => ({
  key: s.key, type: 'surface', planetName: s.planetName, hostname: s.hostname,
  exolocation: `exotopia:surface:${s.planetName}`, displayName: s.displayName,
  createdAt: nowIso, memberId: s.memberId, objects: [],
}))

const payload = { 'e8.1': encryptForStorage(JSON.stringify(records)) }
for (const s of settlements) {
  const items = buildFullItems(s)
  payload[`e8.2:${hashStorageKey(s.key)}`] = encryptForStorage(JSON.stringify(items))
  payload[`e8.2s:${hashStorageKey(s.key)}`] = encryptForStorage(JSON.stringify(true))
}

const outFile = path.join(__dirname, '..', '.scratch-settlement-payload.json')
writeFileSync(outFile, JSON.stringify({ payload, settlements }, null, 2))

const urls = settlements.map(s =>
  `http://localhost:9001/surface/${encodeURIComponent(s.hostname)}/${encodeURIComponent(s.planetName)}/interior`)

console.log(`Wrote ${outFile}\n`)
console.log('Settlements:')
for (let i = 0; i < settlements.length; i++) console.log(`  ${settlements[i].displayName}\n    ${urls[i]}`)

console.log(`
── Option A: automatic (opens a browser for you) ────────────────────────────
  node scripts/seed-settlement-states.mjs --inject

── Option B: manual — open http://localhost:9001, open devtools console,
   paste the following, then visit the URLs above ───────────────────────────
`)
console.log(`for (const [k, v] of Object.entries(${JSON.stringify(payload)})) localStorage.setItem(k, v);`)
console.log('')

if (process.argv.includes('--inject')) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } })
  await page.goto('http://localhost:9001/', { waitUntil: 'domcontentloaded' })
  await page.evaluate((p) => { for (const [k, v] of Object.entries(p)) localStorage.setItem(k, v) }, payload)
  console.log('Injected. Opening the first settlement — use the URLs above to visit the others.')
  await page.goto(urls[0], { waitUntil: 'networkidle' })
}
