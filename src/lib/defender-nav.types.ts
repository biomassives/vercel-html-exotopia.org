/**
 * src/lib/defender-nav.types.ts
 *
 * Shared TypeScript interfaces for DefenderNav component and its parent pages.
 * DefenderNav receives pre-resolved data each frame — it never reads stores directly.
 */

// ── Gallery types ─────────────────────────────────────────────────────────────

export type GalleryType          = 'art' | 'community' | 'research' | 'stage' | 'info'
export type GalleryMeetingState  = 'idle' | 'open' | 'live' | 'locked' | 'exclusive'
export type GalleryAccessLevel   = 'owner' | 'member' | 'ticket' | 'public' | 'none'
export type GalleryOwnershipModel = 'solo' | 'cooperative' | 'dao' | 'public'

export type GalleryOrbitAnchor =
  | { type: 'free';         radiusAU: number; initialAngleDeg: number }
  | { type: 'lagrange';     planetName: string; point: 'L4' | 'L5' }
  | { type: 'circumbinary'; radiusAU: number }

export interface OrbitalGalleryEntry {
  id:              string
  name:            string
  galleryType:     GalleryType
  ownershipModel:  GalleryOwnershipModel
  orbitAnchor:     GalleryOrbitAnchor
  currentAngleDeg: number         // updated by parent each frame
  radiusAU:        number         // effective radius
  meetingState:    GalleryMeetingState
  accessLevel:     GalleryAccessLevel
  presenceCount:   number
  ponInkUrl?:      string
  description?:      string
  mediaLinks?:        string[]
  exolocAddress?:     string   // settlement address this node is attached to, if any
  scheduledEvent?: {
    title:        string
    startUtc:     string
    durationMin:  number
    msUntilStart: number          // re-computed each redraw
  }
  // Surface mode — set when included in surfaceData.skyObjects
  skyAzimuth?:  number
  skyAltitude?: number
}

// ── Stellar configuration ─────────────────────────────────────────────────────

export type StellarConfigType =
  | 'single'
  | 'circumstellar'
  | 'circumbinary'
  | 'hierarchical_triple'
  | 'contact'

export interface StellarConfig {
  type: StellarConfigType

  innerBinary?: {
    primaryTeff:          number
    companionTeff:        number | null
    separation:           number    // AU
    periodDays:           number
    angle:                number    // degrees, updated each frame
    massRatio:            number    // m_companion / m_primary
    forbiddenZoneRadius:  number    // AU
  }

  companion?: {
    teff:           number | null
    orbitalRadius:  number    // AU
    orbitalAngle:   number    // degrees, updated each frame
    massRatio:      number
  }

  outerCompanion?: {
    teff:           number | null
    orbitalRadius:  number
    orbitalAngle:   number
  }
}

// ── Per-planet strip entry ────────────────────────────────────────────────────

export interface PlanetStripEntry {
  name:          string
  angle:         number              // degrees 0–360
  radius:        number              // AU from barycentre
  eqt:           number | null
  hasMoon:       boolean
  hasSettlement: boolean
  l4angle:       number              // angle + 60
  l5angle:       number              // angle – 60
  orbitType:     'circumstellar' | 'circumbinary'
  isCurrent?:    boolean
}

// ── Sky object (surface mode) ─────────────────────────────────────────────────

export type SkyObjectType =
  | 'star' | 'companion_tight' | 'companion_wide' | 'outer_companion'
  | 'moon' | 'planet' | 'settlement' | 'pyramid' | 'gallery' | 'blackhole_station'

export interface SkyObjectEntry {
  name:     string
  type:     SkyObjectType
  azimuth:  number    // 0–360
  altitude: number    // –90 to +90
  color:    string    // hex
  angularSeparation?: number   // degrees — companion_tight only
  separationAngle?:   number   // current pair axis rotation — companion_tight only
  galleryId?:         string   // gallery type only
}

// ── Cosmic strip entries ──────────────────────────────────────────────────────

export interface CosmicStripEntry {
  name:      string
  x:         number    // scene X
  z:         number    // scene Z
  richness:  number    // 0–10
  color:     string
  hasEvent:  boolean
}

export interface ConduitStripEntry {
  name:      string
  x:         number
  z:         number
  isPulsing: boolean
}

// ── Main data payload (passed to redraw() each frame) ────────────────────────

export interface DefenderNavData {
  systemData?: {
    starTeff:      number
    starPos:       { x: number; z: number }
    planets:       PlanetStripEntry[]
    galleries:     OrbitalGalleryEntry[]
    cameraAngle:   number    // degrees 0–360 around barycentre
    cameraRadius:  number    // AU from barycentre
    stellarConfig: StellarConfig
  }
  surfaceData?: {
    cameraAzimuth:   number
    cameraFov:       number
    skyObjects:      SkyObjectEntry[]
    galleries:       OrbitalGalleryEntry[]
    localTimeDeg:    number
    terrainProfile?: number[]    // 64 altitude samples
  }
  cosmicData?: {
    cameraX:   number
    cameraZ:   number
    clusters:  CosmicStripEntry[]
    conduits:  ConduitStripEntry[]
  }
  /**
   * Current system reference — enables the Earth↔System context inset.
   * Set in system and surface modes; omit in cosmic mode.
   * Sol is always at the galaxy-view origin (0,0,0).
   */
  currentSystemRef?: {
    hostname: string
    distPc:   number    // distance from Sol in parsecs
    ra:       number    // RA in degrees (J2000)
    dec:      number    // Dec in degrees (J2000)
  }
}

// ── Emitted events ────────────────────────────────────────────────────────────

export interface DefenderTarget {
  // context_zoom — emitted when the user clicks the Earth↔System inset
  // returnToPrev — emitted when the user clicks the ◄ PREV button
  // (both handled in parent; DefenderNav does not navigate itself)
  type:         'planet' | 'lagrange' | 'moon' | 'star' | 'azimuth' | 'cluster' | 'gallery' | 'companion' | 'blackhole_station'
  id:           string
  angle?:       number
  radius?:      number
  azimuth?:     number
  galleryId?:   string
  hostname?:    string
  accessLevel?: GalleryAccessLevel
  meetingState?: GalleryMeetingState
}
