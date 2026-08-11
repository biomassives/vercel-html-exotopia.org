/**
 * generated-sky.ts
 *
 * Deterministic client-side "local sky" generator for procedurally-generated
 * cluster/galaxy planets (src/pages/ClusterSurfacePage.vue) — the counterpart
 * to SurfaceViewPage.vue's real parallax-accurate sky (see SPEC.md §14) for
 * places with no real astronomical data to draw from. Same seed always
 * produces the same sky and the same constellations — stable across visits
 * and reloads, not randomized per render.
 *
 * Deliberately mirrors the *shape* of SPEC.md §14.4's stars[]/constellations[]
 * schema (position/color/brightness per star, named line-figures connecting
 * star indices) so a shared renderer could eventually draw both real and
 * generated skies — even though none of this data is real astronomy, it's
 * invented cultural content for a generated place, in the spirit of §14.7's
 * Exotopia-custom-constellation layer without needing its real-star
 * infrastructure.
 */

import * as THREE from 'three'
import { starColorFromTeff } from './three-utils'

export interface GeneratedStar {
  position: THREE.Vector3
  color:    THREE.Color
  size:     number   // relative brightness proxy — larger = brighter
}

export interface GeneratedConstellation {
  name:    string
  starIdx: number[]   // indices into GeneratedSky.stars, in line order
}

export interface GeneratedSky {
  stars:          GeneratedStar[]
  constellations: GeneratedConstellation[]
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NAME_PREFIXES = ['The Old', 'The Far', 'The Bright', 'The Silent', 'The Broken', 'The Long', 'The Lost', 'The High', 'The Deep', 'The First']
const NAME_NOUNS    = ['Wanderer', 'Loom', 'Gate', 'Anchor', 'Ember', 'Current', 'Spiral', 'Vessel', 'Signal', 'Tide', 'Bridge', 'Compass']

function generateConstellationName(rng: () => number): string {
  const prefix = NAME_PREFIXES[Math.floor(rng() * NAME_PREFIXES.length)]
  const noun   = NAME_NOUNS[Math.floor(rng() * NAME_NOUNS.length)]
  return `${prefix} ${noun}`
}

export function generateLocalSky(seed: number, opts?: { starCount?: number; radius?: number }): GeneratedSky {
  const rng       = mulberry32(seed)
  const starCount = opts?.starCount ?? 400
  const radius    = opts?.radius ?? 160

  const stars: GeneratedStar[] = []
  for (let i = 0; i < starCount; i++) {
    // Uniform distribution over the sphere (Archimedes hat-box theorem) —
    // same technique as SurfaceViewPage.vue's addStarField() Layer 1.
    const u = rng(), v = rng()
    const theta = 2 * Math.PI * u
    const phi   = Math.acos(2 * v - 1)
    const position = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
    )

    // Realistic-ish spectral occurrence, same weighting as StationInteriorPage.vue's buildExteriorView()
    const roll = rng()
    let teff: number
    if      (roll < 0.52) teff = 2700 + rng() * 1300
    else if (roll < 0.74) teff = 4000 + rng() * 1500
    else if (roll < 0.88) teff = 5400 + rng() * 1000
    else if (roll < 0.96) teff = 6200 + rng() * 1800
    else                   teff = 7500 + rng() * 22500

    stars.push({ position, color: starColorFromTeff(teff), size: 0.5 + rng() * 2.3 })
  }

  // Constellation figures connect the brightest (largest `size`) stars —
  // a nearest-neighbor chain per figure, seeded so it's stable per system.
  const byBrightness = stars
    .map((s, idx) => ({ idx, size: s.size }))
    .sort((a, b) => b.size - a.size)

  const constellations: GeneratedConstellation[] = []
  const used = new Set<number>()
  const nConstellations = 3 + Math.floor(rng() * 4)   // 3-6

  for (let c = 0; c < nConstellations; c++) {
    const seedEntry = byBrightness.find(e => !used.has(e.idx))
    if (!seedEntry) break

    const chain: number[] = [seedEntry.idx]
    used.add(seedEntry.idx)

    const chainLen = 3 + Math.floor(rng() * 4)   // 3-6 stars per figure
    for (let k = 1; k < chainLen; k++) {
      const from = stars[chain[chain.length - 1]!]!.position
      let bestIdx = -1, bestDist = Infinity
      for (let i = 0; i < stars.length; i++) {
        if (used.has(i)) continue
        const d = from.distanceToSquared(stars[i]!.position)
        if (d < bestDist) { bestDist = d; bestIdx = i }
      }
      if (bestIdx === -1) break
      chain.push(bestIdx)
      used.add(bestIdx)
    }

    if (chain.length >= 2) constellations.push({ name: generateConstellationName(rng), starIdx: chain })
  }

  return { stars, constellations }
}
