/**
 * spatial-scopes.ts — Named camera positions for every navigable location.
 *
 * URL convention
 * ──────────────
 *   ?at=<scope>             — fly to a named preset on load / when linking
 *   ?cam=x,y,z,tx,ty,tz,fov — exact camera override (overrides ?at preset)
 *
 * Scope naming: level:context:sub-context
 *   cosmos                          — L1 cosmic web entry
 *   surface                         — L5 planet surface (default approach)
 *   surface:zenith / :horizon       — alternate look-modes on the surface
 *   settlement:dome[:interior]      — L6 settlement dome views
 *   settlement:library / :water …   — named zone close-ups
 *   settlement:stones               — standing stone circle
 *   settlement:pyramid[:chamber]    — E8 wormhole pyramid
 *   settlement:orb:<slug>           — individual community orb viewpoint
 *
 * Coordinate notes
 * ────────────────
 *   All coords are scene/world space.
 *   SurfaceViewPage: terrainBaseY ≈ -20. The settlement THREE.Group sits at y=-20.
 *   Dome hemisphere: local (0,0,0) → world (0,-20,0), radius 70.
 *   Library:  world (0,-9,-10)   Stone circle: world (0,-20,-90)
 *   Water:    world (38,-19,-30) Pyramid:      world (0,-12,-125)
 *   Orb heights (world y ≈ -18) match ORB_ZONES in SurfaceViewPage.
 */

// ── Camera snapshot ──────────────────────────────────────────────────────────

export interface SpatialCam {
  x:   number   // camera world position
  y:   number
  z:   number
  tx:  number   // OrbitControls target
  ty:  number
  tz:  number
  fov: number   // vertical field-of-view in degrees
}

// ── Named scope presets ──────────────────────────────────────────────────────

export const SCOPE_PRESETS: Record<string, SpatialCam> = {

  // ── L1 Cosmos ──────────────────────────────────────────────────────────────
  'cosmos':                     { x: 5,   y: 3.5,  z: 20,   tx: 0,   ty: 0,    tz: 0,    fov: 65 },

  // ── L5 Surface — planetary approach ───────────────────────────────────────
  // camera at (0,4,130) is ~50 units in front of dome equator (r=70) at ground level
  'surface':                    { x: 0,   y: 4,    z: 130,  tx: 0,   ty: 2,    tz: 0,    fov: 80 },
  // Orbit: high above to see full surface curvature
  'surface:orbit':              { x: 0,   y: 320,  z: 20,   tx: 0,   ty: 0,    tz: 0,    fov: 50 },
  // Horizon: eye-level, looking outward past the dome edge
  'surface:horizon':            { x: 0,   y: -18,  z: 90,   tx: 0,   ty: -18,  tz: -200, fov: 70 },
  // Zenith: flat on back, looking straight up through the dome canopy
  'surface:zenith':             { x: 0,   y: -18,  z: 0,    tx: 0,   ty: 80,   tz: 0,    fov: 80 },

  // ── L6 Settlement — dome exterior ─────────────────────────────────────────
  // Overview of dome + pyramid + terrain from above-and-behind
  'settlement:dome':            { x: 0,   y: 60,   z: 180,  tx: 0,   ty: -10,  tz: 0,    fov: 60 },
  // Side angle to appreciate dome hemisphere geometry
  'settlement:dome:exterior':   { x: 80,  y: 25,   z: 80,   tx: 0,   ty: -5,   tz: 0,    fov: 58 },

  // ── L6 Settlement — dome interior ─────────────────────────────────────────
  // Enter through the front; camera just past the dome equator ring, looking inward
  'settlement:dome:interior':   { x: 0,   y: -14,  z: 42,   tx: 0,   ty: -10,  tz: -10,  fov: 72 },
  // Community gathering point — central floor, wide angle upward
  'settlement:dome:centre':     { x: 0,   y: -17,  z: 0,    tx: 0,   ty: 20,   tz: 0,    fov: 80 },

  // ── L6 Settlement — named zones ───────────────────────────────────────────
  // Library: body at world (0,-9,-10) — approach from the front
  'settlement:library':         { x: 0,   y: -8,   z: 18,   tx: 0,   ty: -9,   tz: -10,  fov: 58 },
  // Library courtyard interior — inside, looking up at the octagonal roof lantern
  'settlement:courtyard':       { x: 0,   y: -13,  z: -4,   tx: 0,   ty: -5,   tz: -10,  fov: 65 },

  // Water feature: world (38,-19,-30) — looking across the water plane
  'settlement:water':           { x: 55,  y: -16,  z: -10,  tx: 38,  ty: -19,  tz: -30,  fov: 62 },
  // Water surface close-up — ripple detail level
  'settlement:water:surface':   { x: 38,  y: -17,  z: -10,  tx: 38,  ty: -19,  tz: -35,  fov: 45 },

  // Garden / eco-ops vegetation belt — (0,-17,-5 to -80), looking back toward dome
  'settlement:garden':          { x: 15,  y: -16,  z: -40,  tx: 0,   ty: -17,  tz: -20,  fov: 65 },
  // Ground-level among vegetation — near-human scale
  'settlement:garden:ground':   { x: 8,   y: -18,  z: -50,  tx: 0,   ty: -18,  tz: -30,  fov: 60 },

  // Gateway / dome entrance — looking back inward through the threshold
  'settlement:gateway':         { x: 0,   y: -17,  z: 78,   tx: 0,   ty: -16,  tz: 68,   fov: 68 },

  // ── L6 Settlement — stone circle ──────────────────────────────────────────
  // Circle approach: world (0,-20,-90), stone ring radius 15
  'settlement:stones':          { x: 0,   y: -14,  z: -65,  tx: 0,   ty: -19,  tz: -90,  fov: 58 },
  // Inside the circle — altar eye-level, looking at triskelion spiral on ground
  'settlement:stones:altar':    { x: 3,   y: -18,  z: -84,  tx: 0,   ty: -19,  tz: -90,  fov: 50 },

  // ── L6 Settlement — pyramid ───────────────────────────────────────────────
  // Pyramid exterior: world (0,-12,-125), height 16, base r=9 — approach angle
  'settlement:pyramid':         { x: 18,  y: -8,   z: -98,  tx: 0,   ty: -12,  tz: -125, fov: 52 },
  // Chamber approach: inside the pyramid base, looking up at the apex (E8 transit gate)
  'settlement:pyramid:chamber': { x: 0,   y: -17,  z: -120, tx: 0,   ty: -5,   tz: -125, fov: 38 },

  // ── L6 Settlement — community orb viewpoints ──────────────────────────────
  // Each camera is ~10 units from the orb, angled slightly above to frame the orb
  // against the dome or sky. Targets are the orb world positions.
  //   Fana Ka     → water zone  (38, -18, -30)
  //   OT Kulcha   → library     (-10, -17.5, -12)
  //   Uni-Kibaoni → garden      (15, -18.2, -52)
  //   Glipish DJ  → gateway     (24, -17.8, 12)
  //   _am_lunchmeat → courtyard (8, -17.4, -8)
  'settlement:orb:fana-ka':         { x: 44,  y: -15, z: -22,  tx: 38,  ty: -18,  tz: -30,  fov: 48 },
  'settlement:orb:ot-kulcha':       { x: -18, y: -15, z: -4,   tx: -10, ty: -17,  tz: -12,  fov: 48 },
  'settlement:orb:uni-kibaoni-shg': { x: 22,  y: -15, z: -44,  tx: 15,  ty: -18,  tz: -52,  fov: 48 },
  'settlement:orb:glipish-dj':      { x: 32,  y: -15, z: 20,   tx: 24,  ty: -18,  tz: 12,   fov: 48 },
  'settlement:orb:am-lunchmeat':    { x: 15,  y: -15, z: 0,    tx: 8,   ty: -17,  tz: -8,   fov: 48 },
}

// ── ORB slug ↔ array-index map ───────────────────────────────────────────────
// Matches ORB_DEFS order in SurfaceViewPage.vue

export const ORB_SLUGS: Record<string, number> = {
  'fana-ka':          0,
  'ot-kulcha':        1,
  'uni-kibaoni-shg':  2,
  'glipish-dj':       3,
  'am-lunchmeat':     4,
}

// ── Encoding / decoding ──────────────────────────────────────────────────────
// cam param format: x,y,z,tx,ty,tz,fov  (comma-separated, 1 decimal place)

export function encodeCam(cam: SpatialCam): string {
  const r = (n: number) => Math.round(n * 10) / 10
  return [cam.x, cam.y, cam.z, cam.tx, cam.ty, cam.tz, cam.fov].map(r).join(',')
}

export function parseCam(encoded: string): SpatialCam | null {
  const parts = encoded.split(',').map(Number)
  if (parts.length !== 7 || parts.some(isNaN)) return null
  const [x, y, z, tx, ty, tz, fov] = parts as [number,number,number,number,number,number,number]
  return { x, y, z, tx, ty, tz, fov }
}

// ── Terrain re-anchoring ──────────────────────────────────────────────────────
//
// Settlement-anchored presets above were authored against terrainBaseY ≈ -20
// (see file header). SurfaceViewPage actually computes terrainBaseY per planet
// from its equilibrium temperature — roughness ∈ {0.8, 1.2, 1.8} gives
// terrainBaseY = -(roughness*33) - 4, i.e. roughly -30 to -63, never -20.
// The settlement THREE.Group sits at world y = terrainBaseY, so a preset's
// vertical coordinates must be shifted by the gap between the real offset and
// the assumed one, or the camera lands above empty space instead of the dome.

const ASSUMED_TERRAIN_BASE_Y = -20

const TERRAIN_ANCHORED_EXTRA = new Set(['surface:horizon', 'surface:zenith'])

/** True for scopes whose vertical coordinates are relative to the settlement/terrain group. */
export function isTerrainAnchored(scope: string): boolean {
  return scope.startsWith('settlement:') || TERRAIN_ANCHORED_EXTRA.has(scope)
}

/**
 * Shift a terrain-anchored preset's y/ty by the difference between the planet's
 * real terrainBaseY and the value the preset was authored against. Non-anchored
 * scopes (cosmos, surface, surface:orbit) and exact ?cam= overrides pass through.
 */
export function adjustForTerrain(cam: SpatialCam, scope: string, terrainBaseY: number | null): SpatialCam {
  if (terrainBaseY == null || !isTerrainAnchored(scope)) return cam
  const dy = terrainBaseY - ASSUMED_TERRAIN_BASE_Y
  return { ...cam, y: cam.y + dy, ty: cam.ty + dy }
}

// ── Scope inference helpers ───────────────────────────────────────────────────

/** Return the scope string for a named community orb. */
export function orbScope(slug: string): string {
  return `settlement:orb:${slug}`
}

/** Return the display label for a scope (for UI breadcrumbs). */
export function scopeLabel(scope: string): string {
  const MAP: Record<string, string> = {
    'cosmos':                       'Cosmic Web',
    'surface':                      'Surface',
    'surface:orbit':                'Orbit',
    'surface:horizon':              'Horizon',
    'surface:zenith':               'Zenith',
    'settlement:dome':              'Dome',
    'settlement:dome:exterior':     'Dome Exterior',
    'settlement:dome:interior':     'Dome Interior',
    'settlement:dome:centre':       'Community Centre',
    'settlement:library':           'Library',
    'settlement:courtyard':         'Library Courtyard',
    'settlement:water':             'Water Feature',
    'settlement:water:surface':     'Water Surface',
    'settlement:garden':            'Garden',
    'settlement:garden:ground':     'Garden Floor',
    'settlement:gateway':           'Gateway',
    'settlement:stones':            'Stone Circle',
    'settlement:stones:altar':      'Altar',
    'settlement:pyramid':           'Pyramid',
    'settlement:pyramid:chamber':   'Pyramid Chamber',
    'settlement:orb:fana-ka':       'Fana Ka',
    'settlement:orb:ot-kulcha':     'OT Kulcha',
    'settlement:orb:uni-kibaoni-shg': 'Uni-Kibaoni SHG',
    'settlement:orb:glipish-dj':    'Glipish DJ',
    'settlement:orb:am-lunchmeat':  '_am_lunchmeat',
  }
  return MAP[scope] ?? scope
}
