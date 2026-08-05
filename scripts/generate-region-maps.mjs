#!/usr/bin/env node
/**
 * scripts/generate-region-maps.mjs
 *
 * Generates vividly-colored, readable static map images from real
 * OpenStreetMap tiles for a set of real-world regions — reusable assets for
 * blog posts / pages, not a one-off. Output: public/blog-assets/regional-maps/<slug>.png
 *
 * Each region gets its own CSS color-filter "theme" applied only to the
 * tile layer (scripts/region-map-template.html keeps overlays/attribution
 * outside the filter) so the wild coloring stays readable rather than
 * making labels/roads illegible.
 *
 * OSM tile usage note: this is a one-time batch generation of static images
 * (~5 regions, a few dozen tiles each) that get committed/served as our own
 * assets afterward — not a live map hitting tile.openstreetmap.org on every
 * page view. That's within OSM's tile usage policy for casual/light use;
 * don't wire this into a live in-app map without switching to a dedicated
 * tile provider first. Re-running this script to add a region is fine;
 * don't loop it.
 *
 * Usage: node scripts/generate-region-maps.mjs [region-slug ...]
 *   (no args regenerates all regions)
 */

import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'public', 'blog-assets', 'regional-maps')
mkdirSync(OUT_DIR, { recursive: true })

// Filter recipes are deliberately distinct per region so each has its own
// visual identity when used side by side in the blog post.
const REGIONS = [
  {
    slug: 'boulder-douglas-colorado',
    label: 'Boulder & Douglas Counties, Colorado',
    lat: 39.69, lon: -105.06, zoom: 9,
    filter: 'hue-rotate(-28deg) saturate(3.4) contrast(1.3) brightness(1.05) sepia(0.12)',
  },
  {
    slug: 'costa-rica',
    label: 'Costa Rica',
    lat: 9.85, lon: -84.35, zoom: 8,
    filter: 'hue-rotate(95deg) saturate(4.2) contrast(1.35) brightness(0.98)',
  },
  {
    slug: 'seoul-south-korea',
    label: 'Seoul, South Korea',
    lat: 37.5665, lon: 126.978, zoom: 11,
    filter: 'hue-rotate(195deg) saturate(3.6) contrast(1.3) brightness(0.98)',
  },
  {
    slug: 'lamu-mpeketoni-kenya',
    label: 'Lamu & Mpeketoni, Kenya',
    lat: -2.29, lon: 40.73, zoom: 10,
    filter: 'hue-rotate(150deg) saturate(3.3) contrast(1.2) brightness(1.1)',
  },
  {
    slug: 'nairobi-kenya',
    label: 'Nairobi, Kenya',
    lat: -1.2921, lon: 36.8219, zoom: 11,
    filter: 'hue-rotate(18deg) saturate(3.1) contrast(1.28) brightness(1.05) sepia(0.1)',
  },
]

const templateUrl = 'file://' + path.join(__dirname, 'region-map-template.html')

async function main() {
  const requested = process.argv.slice(2)
  const regions = requested.length ? REGIONS.filter(r => requested.includes(r.slug)) : REGIONS

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })

  for (const r of regions) {
    const url = `${templateUrl}?lat=${r.lat}&lon=${r.lon}&zoom=${r.zoom}` +
      `&filter=${encodeURIComponent(r.filter)}&label=${encodeURIComponent(r.label)}`
    console.log('rendering', r.slug, '...')
    await page.goto(url, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__mapReady === true, { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(500)   // let the last tile row finish painting
    const outPath = path.join(OUT_DIR, `${r.slug}.png`)
    await page.screenshot({ path: outPath })
    console.log('  wrote', outPath)
  }

  await browser.close()
}

main()
