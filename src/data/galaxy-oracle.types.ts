/**
 * Galaxy Oracle — system-wide pre-generated galaxy data for XMM cluster interiors.
 *
 * Generated offline by datagathering/generate_galaxy_oracle.py.
 * Each cluster loads its own file on demand: public/galaxy-oracle/{safe_id}.json
 *
 * Universe version string ("universe-221x") encodes the seed integer + revision letter.
 * Increment the seed to produce a distinct universe; append a letter for minor
 * parameter adjustments within the same seed.
 */

export type GalMorph = 'cD' | 'E' | 'S0' | 'Sa' | 'Sb' | 'Irr'

/** One pre-generated galaxy inside a cluster */
export interface OracleGalaxy {
  /** Stable ID — "{cluster_safe_id}_{index:04d}" */
  gid:        string
  morph:      GalMorph
  /** Hex colour string "#rrggbb" — includes morphology + redshift reddening */
  col_hex:    string
  /** Scale in Three.js scene units (0.010 – 0.048) */
  size_su:    number
  /** [x, y, z] offset from cluster centre in scene units */
  pos_su:     [number, number, number]
  /** Position angle in radians (SpriteMaterial.rotation) */
  rot_rad:    number
  /** Final opacity (luminosity + redshift dimming pre-applied) */
  opacity:    number
  /** Y scale factor (axis ratio — foreshortening for disk galaxies) */
  axis_ratio: number
  is_bcg:     boolean
  in_sub:     boolean
}

/** Per-cluster oracle file — loaded from public/galaxy-oracle/{safe_id}.json */
export interface OracleCluster {
  /** Matches XMM catalog name field */
  cluster_id:  string
  /** e.g. "universe-221x" */
  universe_ver: string
  galaxies:    OracleGalaxy[]
}

/** Index file — public/galaxy-oracle/index.json */
export interface OracleIndex {
  universe_ver:  string    // e.g. "universe-221x"
  seed:          number
  generated_utc: string
  cluster_count: number
  /** Maps XMM cluster name → safe filename (without .json) */
  id_map:        Record<string, string>
}
