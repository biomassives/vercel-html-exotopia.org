/**
 * src/lib/three-utils.ts
 *
 * Shared Three.js helpers: color mappings, coordinate conversions, geometry builders.
 * Used by GalaxyPage, SurfaceViewPage, and StationPage.
 */

import * as THREE from 'three'

// ── Scene disposal ────────────────────────────────────────────────────────────

/**
 * Traverse a Three.js Object3D (scene or group) and dispose every GPU resource:
 * geometry buffers, materials, and any textures on those materials.
 *
 * Call this before renderer.dispose() in every onUnmounted / teardown handler.
 * Prevents WebGL memory accumulation across page transitions.
 *
 * Usage:
 *   disposeScene(scene)
 *   renderer.dispose()
 *   controls.dispose()
 */
export function disposeScene(root: THREE.Object3D): void {
  root.traverse(obj => {
    // Geometry
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) {
      mesh.geometry.dispose()
    }

    // Material(s)
    const mats: THREE.Material[] = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material ? [mesh.material] : []

    for (const mat of mats) {
      // Dispose every texture slot on the material
      for (const value of Object.values(mat as unknown as Record<string, unknown>)) {
        if (value instanceof THREE.Texture) value.dispose()
      }
      mat.dispose()
    }
  })
}

/**
 * Dispose a single material and all its texture slots.
 * Useful when you hold a reference to a material outside the scene graph.
 */
export function disposeMaterial(mat: THREE.Material): void {
  for (const value of Object.values(mat as unknown as Record<string, unknown>)) {
    if (value instanceof THREE.Texture) value.dispose()
  }
  mat.dispose()
}

// ── Star color from effective temperature (Kelvin) ────────────────────────────

export function starColorFromTeff(teff: number | null | undefined): THREE.Color {
  if (!teff) return new THREE.Color(0xfff4ea)   // default G-type yellow-white
  if (teff >= 30000) return new THREE.Color(0x9bb0ff)  // O — blue
  if (teff >= 10000) return new THREE.Color(0xaabfff)  // B — blue-white
  if (teff >= 7500)  return new THREE.Color(0xcad7ff)  // A — white
  if (teff >= 6000)  return new THREE.Color(0xf8f7ff)  // F — yellow-white
  if (teff >= 5200)  return new THREE.Color(0xfff4ea)  // G — yellow (Sun-like)
  if (teff >= 3700)  return new THREE.Color(0xffd2a1)  // K — orange
  return new THREE.Color(0xffcc6f)                      // M — red-orange
}

// ── Planet color from equilibrium temperature or orbital distance ─────────────

export function planetColor(
  eqt:    number | null | undefined,
  orbAU?: number | null | undefined
): THREE.Color {
  if (eqt != null) {
    if (eqt > 2000) return new THREE.Color(0xff4500)   // ultra-hot — lava orange
    if (eqt > 1200) return new THREE.Color(0xff8c42)   // hot
    if (eqt > 500)  return new THREE.Color(0xf0c040)   // warm
    if (eqt > 273)  return new THREE.Color(0x4ecdc4)   // temperate
    if (eqt > 100)  return new THREE.Color(0x82b4d0)   // cold
    return new THREE.Color(0xc8e8f8)                   // icy
  }
  if (orbAU != null) {
    if (orbAU < 0.08) return new THREE.Color(0xff4500)
    if (orbAU < 0.5)  return new THREE.Color(0xff8c42)
    if (orbAU < 1.5)  return new THREE.Color(0x4ecdc4)
    if (orbAU < 4.0)  return new THREE.Color(0x82b4d0)
    return new THREE.Color(0xc8e8f8)
  }
  return new THREE.Color(0x7fb3d3)   // unknown
}

// ── Celestial → Three.js 3D position ─────────────────────────────────────────

/**
 * Convert RA/Dec (degrees) to a point on a sphere of the given radius.
 * Uses standard astronomical convention: RA increases eastward, Dec northward.
 *
 * x = r·cos(δ)·cos(α)
 * y = r·sin(δ)
 * z = −r·cos(δ)·sin(α)   (negative z = into screen for RA increasing left→right)
 */
export function raDecToVec3(raDeg: number, decDeg: number, radius: number): THREE.Vector3 {
  const ra  = (raDeg  * Math.PI) / 180
  const dec = (decDeg * Math.PI) / 180
  return new THREE.Vector3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.sin(dec),
    -radius * Math.cos(dec) * Math.sin(ra)
  )
}

/**
 * Compute az/alt on the sky dome given a "local sidereal time" offset.
 * `hourAngle` (0–2π) controls where the object appears relative to the meridian.
 * Returns a unit vector in the scene's sky coordinate frame.
 */
export function skyPosition(
  decDeg:    number,
  hourAngle: number,    // radians, 0 = upper transit (highest point)
  latitudeDeg = 0       // observer's planetographic latitude
): THREE.Vector3 {
  const dec = (decDeg     * Math.PI) / 180
  const lat = (latitudeDeg * Math.PI) / 180
  // Standard horizontal coordinate transform
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(hourAngle)
  const alt    = Math.asin(Math.clamp ? Math.clamp(sinAlt, -1, 1) : Math.max(-1, Math.min(1, sinAlt)))
  const cosAz  = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat) + 1e-9)
  const az     = Math.acos(Math.max(-1, Math.min(1, cosAz))) * (Math.sin(hourAngle) > 0 ? 1 : -1)
  return new THREE.Vector3(
    Math.cos(alt) * Math.sin(az),
    Math.sin(alt),
    -Math.cos(alt) * Math.cos(az)
  )
}

// ── Procedural terrain ────────────────────────────────────────────────────────

/**
 * Build a displaced PlaneGeometry for the alien surface terrain.
 * `seed` and `roughness` control the character of the terrain.
 */
export function buildTerrainGeometry(
  size      = 2000,
  segments  = 80,
  roughness = 1.0,
  seed      = 1
): THREE.PlaneGeometry {
  const geo  = new THREE.PlaneGeometry(size, size, segments, segments)
  const pos  = geo.attributes.position
  const s    = seed * 7.31

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)   // Y spans the plane's depth axis (not Z, which is always 0)
    // Multi-octave noise — both X and Y (depth) used for true 2-D height variation
    const h =
      Math.sin(x * 0.012 + s) * 14 * roughness +
      Math.sin(y * 0.009 + s * 1.3) * 10 * roughness +
      Math.sin((x + y) * 0.021 + s * 2.1) * 6 * roughness +
      Math.cos(x * 0.035 + y * 0.028 + s) * 3 * roughness
    pos.setZ(i, h)   // height → Z; after rotation.x = -π/2 this becomes world Y
  }

  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

// ── Distance / scale conversions ─────────────────────────────────────────────

/** Deterministic seed → float [0,1) — avoids random placement jitter on reload */
function _seededUnit(seed: number): number {
  let s = seed | 0
  s = (s ^ 61) ^ (s >>> 16); s = (s + (s << 3)) | 0
  s = s ^ (s >>> 4); s = (Math.imul(s, 0x27d4eb2d)) | 0
  return ((s ^ (s >>> 15)) >>> 0) / 0xffffffff
}

/** Convert a hostname string to a stable integer seed */
export function hostnameToSeed(hostname: string): number {
  return hostname.split('').reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7) >>> 0
}

/**
 * Real distance (parsecs) → Three.js scene units (log scale, max ~700).
 * When pc is null/N/A, a deterministic position is assigned from the hostname
 * seed so the star always appears at the same location across page loads.
 * Most imaging-discovered systems with missing parallax are within 50–400 pc;
 * we place them in the 120–380 scene-unit band.
 */
export function distToViz(pc: number | null | undefined, seed = 0): number {
  if (pc == null) return 120 + _seededUnit(seed) * 260
  const d = parseFloat(String(pc))
  if (isNaN(d) || d <= 0) return 120 + _seededUnit(seed) * 260
  return 80 + 620 * Math.log10(1 + d) / Math.log10(1001)
}

/** Orbital semi-major axis (AU) → orbit ring radius in scene units */
export function auToViz(au: number): number {
  return 14 + 171 * Math.log10(1 + au * 6) / Math.log10(61)
}

/** Fallback orbital distance for planets without known AU */
export function fallbackAU(index: number, total: number): number {
  return 0.15 * Math.pow(80, index / Math.max(total - 1, 1))
}

// ── Surface type color palette ────────────────────────────────────────────────

export interface SurfacePalette {
  terrain:     THREE.Color
  rock:        THREE.Color
  atmosphere?: THREE.Color
  fog?:        THREE.Color
  fogDensity:  number
}

export function surfacePaletteFor(eqt: number | null | undefined): SurfacePalette {
  if (eqt != null && eqt > 1500) return {
    terrain:    new THREE.Color(0x7a3010),
    rock:       new THREE.Color(0xc85020),
    atmosphere: new THREE.Color(0xff6a1a),
    fog:        new THREE.Color(0x4d1800),
    fogDensity: 0.00035,
  }
  if (eqt != null && eqt > 600) return {
    terrain:    new THREE.Color(0x7a5e28),
    rock:       new THREE.Color(0xaa8840),
    atmosphere: new THREE.Color(0xe0b050),
    fog:        new THREE.Color(0x2e1a08),
    fogDensity: 0.00016,
  }
  if (eqt != null && eqt > 200) return {
    terrain:    new THREE.Color(0x3a6040),
    rock:       new THREE.Color(0x5a8060),
    atmosphere: new THREE.Color(0x70a0e0),
    fog:        new THREE.Color(0x0a1020),
    fogDensity: 0.00022,
  }
  // Cold / icy
  return {
    terrain:    new THREE.Color(0x384870),
    rock:       new THREE.Color(0x5a78b0),
    atmosphere: new THREE.Color(0x3060b0),
    fog:        new THREE.Color(0x101828),
    fogDensity: 0.00015,
  }
}
