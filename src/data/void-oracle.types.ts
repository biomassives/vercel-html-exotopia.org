/**
 * Void Oracle — types for the per-void galaxy population dataset.
 *
 * Files are generated offline by scripts/fetch-bootes-void.mjs (and future
 * equivalents for other named voids).  The viz JSON is served from
 * public/void-galaxies/{void-id}-viz.json and loaded on demand when the
 * user enters a void interior.
 *
 * source field mirrors the _source convention in useClusterGalaxyData.ts:
 *   'catalog'   — real object from NASA/IPAC NED; has a stable ned_name
 *   'generated' — deterministically seeded filler; ned_name is null
 *
 * The distinction lets the UI badge catalog entries as "real place" waypoints
 * and use generated entries as ambient background population.
 */

export type VoidGalMorph = 'cD' | 'E' | 'S0' | 'Sa' | 'Sb' | 'Irr'
export type VoidGalSource = 'catalog' | 'generated'

/** One galaxy inside a void — slim rendering record (from *-viz.json) */
export interface VoidGalaxy {
  /** Stable ID — "bootes-void_cat_0000" or "bootes-void_gen_0000" */
  gid:         string
  source:      VoidGalSource
  morph:       VoidGalMorph
  /** Hex colour "#rrggbb" — morphology + blue bias for void environment */
  col_hex:     string
  /** [x, y, z] position relative to void centre in Three.js scene units (MPC_SCALE = 1/15) */
  pos_void:    [number, number, number]
  /** Sprite size in scene units */
  size_su:     number
  /** Pre-applied opacity */
  opacity:     number
  /** Sprite rotation in radians */
  rot_rad:     number
  /** Y scale factor (axis ratio — disc foreshortening) */
  axis_ratio:  number
  /** True when galaxy is in the void wall / meniscus band (r > 0.8 × r_v) */
  is_wall:     boolean
  /** True for ~7% of void galaxies — AGN-hosting, suppressed void rate */
  has_agn:     boolean
  /** Redshift — used for LOD dimming and distance display */
  z:           number
  /** Distance from void centre in Mpc */
  r_void_mpc:  number
}

/** Metadata block at the top of the viz JSON file */
export interface VoidGalaxyMeta {
  void_id:       string
  void_name:     string
  center:        { ra_deg: number; dec_deg: number; dist_mpc: number; z_center: number }
  radius_mpc:    number
  wall_band_frac: number
  mpc_scale:     number
  generated_at:  string
  catalog_count: number
  generated_count: number
  total_count:   number
  wall_count:    number
  agn_count:     number
}

/** Full void population file (from *-viz.json) */
export interface VoidOracleFile extends VoidGalaxyMeta {
  galaxies: VoidGalaxy[]
}
