/**
 * src/data/cosmic-structures.ts
 *
 * Known cosmic structures used by CosmicPage.vue (Level 1 — cosmic view).
 * Positions are in Megaparsecs (Mpc) in a right-handed coordinate frame
 * centred on the Milky Way, derived from RA/Dec/distance.
 *
 * Wormhole conduit markers are placed at the periphery of major voids,
 * where the E8 lattice transit routes are accessible (per SPEC.md).
 */

import * as THREE from 'three'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BrightGalaxy {
  name:    string
  type:    string                     // morphology/class, e.g. "cD elliptical", "Seyfert 1.5"
  lum?:    string                     // luminosity descriptor
  offset:  [number, number, number]   // scene-unit offset from cluster centre
  /** Confirmed or well-constrained black hole mass */
  bhMass?: string
  /**
   * ULSMBH — ultra-massive (≥ 10⁹ M☉); directly imaged or stellar-dynamics constraint
   * SMBH   — supermassive (10⁷–10⁹ M☉); spectroscopic or reverberation mapping
   * AGN    — active nucleus with BH inferred from accretion emission
   */
  bhType?: 'ULSMBH' | 'SMBH' | 'AGN'
}

/**
 * Visual primitive type for the cluster overview sprite.
 *  group       — loose spiral-rich poor group (Andromeda, Eridanus)
 *  cluster     — regular moderate cluster (Fornax, Hydra, Centaurus)
 *  richcluster — massive rich cluster with substructure (Virgo, Perseus, Coma, Norma)
 *  superconc   — multi-cluster superconcentration (Shapley)
 */
export type ClusterType = 'group' | 'cluster' | 'richcluster' | 'superconc'

export interface CosmicCluster {
  name:            string
  raDeg:           number
  decDeg:          number
  distMpc:         number   // distance from Milky Way
  richness:        number   // visual size scale 1–10
  color:           number   // THREE hex colour
  supercluster?:   string   // parent supercluster name
  /** Filament connections to other clusters (names) */
  filaments?:      string[]
  /** Most luminous / prominent individual galaxies in this cluster */
  brightGalaxies?: BrightGalaxy[]
  /** Structural classification for overview sprite shape */
  clusterType?:    ClusterType
  /** Orientation angle on sky (degrees, 0 = N, clockwise) for sprite elongation axis */
  orientDeg?:      number
  /** Projected axis ratio for elongation (1.0 = circular, >1 = elongated) */
  axisRatio?:      number
  /**
   * NFW virial radius r₂₀₀ (Mpc) — radius within which mean density is 200× critical.
   * The dark matter halo extends well beyond the X-ray–visible gas.
   * Source: X-ray hydrostatic mass estimates (Ettori+ 2013, Vikhlinin+ 2006, etc.)
   */
  dmHaloRadiusMpc?:  number
  /** Total virial (dark-matter-dominated) mass within r₂₀₀ */
  virialMassMsun?:   string
  /** Dark matter mass fraction (typically 0.80–0.88 for clusters) */
  dmFraction?:       number
}

export interface CosmicSupercluster {
  name:    string
  color:   number   // label/indicator hex colour
  members: string[] // cluster names belonging to this supercluster
}

export const SUPERCLUSTERS: CosmicSupercluster[] = [
  {
    name:    'Laniakea',
    color:   0x4488ff,
    members: [
      'Milky Way', 'Andromeda Group', 'Virgo Cluster',
      'Fornax Cluster', 'Centaurus Cluster', 'Hydra Cluster',
      'Norma Cluster', 'Eridanus Supergroup',
    ],
  },
  {
    name:    'Perseus-Pisces',
    color:   0xff7744,
    members: ['Perseus Cluster'],
  },
  {
    name:    'Coma-Great Wall',
    color:   0x44ff99,
    members: ['Coma Cluster'],
  },
  {
    name:    'Shapley',
    color:   0xff44aa,
    members: ['Shapley Concentration'],
  },
]

/** Return the supercluster a cluster belongs to, if any. */
export function superclusters(clusterName: string): CosmicSupercluster | undefined {
  return SUPERCLUSTERS.find(sc => sc.members.includes(clusterName))
}

export interface CosmicVoid {
  name:       string
  raDeg:      number
  decDeg:     number
  distMpc:    number   // centre distance
  radiusMpc:  number
  color:      number
  /** wormhole conduit at near-periphery of this void */
  hasConduit: boolean
}

export interface WormholeConduit {
  name:    string
  voidName: string
  pos:     THREE.Vector3   // in Mpc, relative to Milky Way
}

// ── Coordinate helper ─────────────────────────────────────────────────────────

function mpcToVec3(raDeg: number, decDeg: number, distMpc: number): THREE.Vector3 {
  const ra  = (raDeg  * Math.PI) / 180
  const dec = (decDeg * Math.PI) / 180
  return new THREE.Vector3(
    distMpc * Math.cos(dec) * Math.cos(ra),
    distMpc * Math.sin(dec),
    -distMpc * Math.cos(dec) * Math.sin(ra)
  )
}

// ── Galaxy clusters ───────────────────────────────────────────────────────────

export const CLUSTERS: CosmicCluster[] = [
  {
    name: 'Milky Way',
    raDeg: 0, decDeg: 0, distMpc: 0,
    richness: 3,
    color: 0xffd480,
    supercluster: 'Laniakea',
    filaments: ['Virgo Cluster', 'Fornax Cluster'],
    // No brightGalaxies — clicking the MW sphere triggers direct fly-in to Galaxy view
  },
  {
    name: 'Andromeda Group',
    raDeg: 10.68, decDeg: 41.27, distMpc: 0.77,
    richness: 2,
    color: 0xccaaff,
    supercluster: 'Laniakea',
    filaments: ['Milky Way'],
    clusterType: 'group',
    orientDeg: 35,    // M31/M33 axis runs NE-SW
    axisRatio: 1.85,
    dmHaloRadiusMpc: 0.55,
    virialMassMsun:  '1.2 × 10¹³ M☉',
    dmFraction:      0.80,
    brightGalaxies: [
      { name: 'M31 — Andromeda Galaxy', type: 'Giant barred spiral',     lum: '~1 trillion L☉',  offset: [ 0.18,  0.09, -0.12],
        bhMass: '~1.1 × 10⁸ M☉', bhType: 'SMBH' },
      { name: 'M33 — Triangulum Galaxy', type: 'Spiral galaxy',          lum: '~3.6 billion L☉', offset: [-0.15,  0.04,  0.11] },
      { name: 'M32 — NGC 221',          type: 'Compact elliptical',      lum: '~850 million L☉', offset: [ 0.07, -0.08,  0.05] },
    ],
  },
  {
    name: 'Virgo Cluster',
    raDeg: 186.75, decDeg: 12.72, distMpc: 16.5,
    richness: 7,
    color: 0x88ccff,
    supercluster: 'Laniakea',
    filaments: ['Milky Way', 'Centaurus Cluster', 'Coma Cluster'],
    clusterType: 'richcluster',
    orientDeg: 108,   // elongated roughly E-W; A/B/C subclusters run SE-NW
    axisRatio: 1.45,
    dmHaloRadiusMpc: 1.1,        // corrected from 1.55 to match rvir_mpc in clusters/virgo-members.json
    virialMassMsun:  '1.4 × 10¹⁴ M☉',  // corrected from 6.3 × 10¹⁴ — was ~6x too high (eROSITA 2024/Suzaku 2017), see SPEC_XCLUSTER_STARSYSTEMS.md §5
    dmFraction:      0.84,
    brightGalaxies: [
      { name: 'M87 — NGC 4486',  type: 'cD elliptical / radio jet',       lum: '~2 trillion L☉',   offset: [-0.55,  0.22, -0.30],
        bhMass: '6.5 × 10⁹ M☉', bhType: 'ULSMBH' },  // Event Horizon Telescope 2019 — first BH imaged
      { name: 'M86 — NGC 4406',  type: 'Giant elliptical',                lum: '~1.5 trillion L☉', offset: [ 0.35, -0.10,  0.42] },
      { name: 'M84 — NGC 4374',  type: 'Radio galaxy (Virgo A)',           lum: '~1.1 trillion L☉', offset: [ 0.22,  0.50, -0.15],
        bhMass: '~1.5 × 10⁹ M☉', bhType: 'ULSMBH' },
      { name: 'M49 — NGC 4472',  type: 'Giant elliptical (BCG subgroup)', lum: '~1.4 trillion L☉', offset: [-0.40, -0.48,  0.25],
        bhMass: '~1 × 10⁹ M☉', bhType: 'ULSMBH' },
    ],
  },
  {
    name: 'Fornax Cluster',
    raDeg: 54.62, decDeg: -35.45, distMpc: 20.0,   // corrected from 19.0 — Blakeslee+2009 SBF
    richness: 5,
    color: 0x99ffcc,
    supercluster: 'Laniakea',
    filaments: ['Milky Way', 'Eridanus Supergroup'],
    clusterType: 'cluster',
    orientDeg: 20,
    axisRatio: 1.18,
    dmHaloRadiusMpc: 0.70,
    virialMassMsun:  '8 × 10¹³ M☉',
    dmFraction:      0.82,
    brightGalaxies: [
      { name: 'NGC 1399',           type: 'cD elliptical (BCG)',           lum: '~1.2 trillion L☉', offset: [ 0.05,  0.10, -0.08],
        bhMass: '5.1 × 10⁸ M☉', bhType: 'SMBH' },
      { name: 'NGC 1316 — Fornax A', type: 'Peculiar elliptical / radio',  lum: '~500 billion L☉',  offset: [-0.28,  0.18,  0.22],
        bhMass: '1.5 × 10⁸ M☉', bhType: 'SMBH' },
      { name: 'NGC 1365',           type: 'Barred spiral / Seyfert 1.8',   lum: '~350 billion L☉',  offset: [ 0.30, -0.20,  0.10],
        bhMass: '~2 × 10⁷ M☉', bhType: 'AGN' },
    ],
  },
  {
    name: 'Eridanus Supergroup',
    raDeg: 51.0, decDeg: -23.0, distMpc: 23.0,
    richness: 4,
    color: 0xaaffdd,
    supercluster: 'Laniakea',
    filaments: ['Fornax Cluster'],
    clusterType: 'group',
    orientDeg: 72,
    axisRatio: 1.65,
      dmHaloRadiusMpc: 0.52,
    virialMassMsun:  '8 × 10¹² M☉',
    dmFraction:      0.79,
    brightGalaxies: [
      { name: 'NGC 1407', type: 'Dominant elliptical (BGC)', lum: '~800 billion L☉', offset: [ 0.12,  0.05, -0.10],
        bhMass: '~4.5 × 10⁹ M☉', bhType: 'ULSMBH' },
      { name: 'NGC 1395', type: 'Elliptical galaxy',         lum: '~300 billion L☉', offset: [-0.18, -0.08,  0.14] },
    ],
  },
  {
    name: 'Centaurus Cluster',
    raDeg: 192.2, decDeg: -41.3, distMpc: 46.0,
    richness: 6,
    color: 0xffcc66,
    supercluster: 'Laniakea',
    filaments: ['Virgo Cluster', 'Hydra Cluster'],
    clusterType: 'cluster',
    orientDeg: 48,    // Cen30/Cen45 axis runs NE-SW
    axisRatio: 1.32,
    dmHaloRadiusMpc: 1.13,       // corrected from 1.10 — Walker+2013b hydrostatic analysis to r200
    virialMassMsun:  '1.6 × 10¹⁴ M☉',  // corrected from 3.2 × 10¹⁴ — Walker+2013b (also: "Sanders+2016" citation elsewhere was wrong, that's a Chandra paper — the XMM study is Walker+2013a)
    dmFraction:      0.84,
    brightGalaxies: [
      { name: 'NGC 4696', type: 'cD elliptical (BCG) — X-ray cavities', lum: '~1.1 trillion L☉', offset: [ 0.08,  0.12, -0.06],
        bhMass: '~1 × 10⁹ M☉', bhType: 'ULSMBH' },  // mass inferred from X-ray cavity power
      { name: 'NGC 4709', type: 'Elliptical galaxy',                     lum: '~400 billion L☉',  offset: [-0.22,  0.04,  0.18] },
    ],
  },
  {
    name: 'Hydra Cluster',
    raDeg: 159.18, decDeg: -27.53, distMpc: 59.0,   // Abell 1060 — NED: 59.6 Mpc
    richness: 5,
    color: 0x66ccff,
    supercluster: 'Laniakea',
    filaments: ['Centaurus Cluster', 'Perseus Cluster'],
    clusterType: 'cluster',
    orientDeg: 90,    // twin BCG NGC3309/NGC3311 separation runs roughly E-W
    axisRatio: 1.22,
    dmHaloRadiusMpc: 1.28,       // corrected from 0.97 — Hayakawa+2006 (~1.2-1.35 Mpc)
    virialMassMsun:  '3.0 × 10¹⁴ M☉',  // corrected from 1.9 × 10¹⁴ — aligned to the confirmed-accurate M200 in clusters/hydra-members.json (this dataset's own figure was the one that disagreed)
    dmFraction:      0.83,
    brightGalaxies: [
      { name: 'NGC 3309', type: 'Elliptical galaxy (BCG)',  lum: '~700 billion L☉', offset: [ 0.10,  0.06, -0.09] },
      { name: 'NGC 3311', type: 'cD elliptical',            lum: '~600 billion L☉', offset: [-0.12, -0.07,  0.13],
        bhMass: '~5 × 10⁸ M☉', bhType: 'SMBH' },
    ],
  },
  {
    name: 'Perseus Cluster',
    raDeg: 49.5, decDeg: 41.5, distMpc: 73.0,   // Abell 426 — widely cited at ~73 Mpc
    richness: 8,
    color: 0xaabbff,
    supercluster: 'Perseus-Pisces',
    filaments: ['Coma Cluster', 'Hydra Cluster'],
    clusterType: 'richcluster',
    orientDeg: 62,    // Perseus filament chain runs NE-SW
    axisRatio: 1.38,
    dmHaloRadiusMpc: 1.79,       // corrected from 1.80 — Simionescu+2011 Science, adopted as a pair with M200 below
    virialMassMsun:  '6.65 × 10¹⁴ M☉',  // corrected from 8.5 × 10¹⁴ — was mixing a dynamical M200 with an r500-scale radius
    dmFraction:      0.85,
    brightGalaxies: [
      { name: 'NGC 1275 — Perseus A', type: 'Seyfert galaxy (BCG)',       lum: '~1.5 trillion L☉', offset: [ 0.05,  0.15, -0.10],
        bhMass: '8 × 10⁸ M☉', bhType: 'SMBH' },  // AGN drives sound waves in ICM — Fabian+ 2003
      { name: 'NGC 1272',             type: 'Giant elliptical',           lum: '~900 billion L☉',  offset: [-0.30,  0.08,  0.22] },
      { name: 'NGC 1265',             type: 'Head-tail radio galaxy',     lum: '~600 billion L☉',  offset: [ 0.40, -0.20, -0.15],
        bhType: 'AGN' },
    ],
  },
  {
    name: 'Coma Cluster',
    raDeg: 194.95, decDeg: 27.98, distMpc: 99.0,
    richness: 9,
    color: 0xff88aa,
    supercluster: 'Coma-Great Wall',
    filaments: ['Virgo Cluster', 'Perseus Cluster', 'Shapley Concentration'],
    clusterType: 'richcluster',
    orientDeg: 15,    // NGC4889 (N) / NGC4874 (S) bimodal axis
    axisRatio: 1.28,
    dmHaloRadiusMpc: 2.10,       // corrected from 2.05 to match rvir_mpc in clusters/coma-members.json
    virialMassMsun:  '8.2 × 10¹⁴ M☉',  // corrected from 1.5 × 10¹⁵ — newest (2026) Subaru/HSC weak-lensing two-halo fit; flagged literature disagreement, newest measurement adopted rather than averaged
    dmFraction:      0.86,
    brightGalaxies: [
      { name: 'NGC 4889', type: 'cD elliptical (BCG-N) — ultra-massive BH', lum: '~3 trillion L☉', offset: [ 0.12,  0.18, -0.08],
        bhMass: '21 × 10⁹ M☉', bhType: 'ULSMBH' },  // McConnell & Ma 2011 — among most massive known
      { name: 'NGC 4874', type: 'cD elliptical (BCG-S)',                     lum: '~2 trillion L☉', offset: [-0.18,  0.05,  0.22],
        bhMass: '2.7 × 10⁹ M☉', bhType: 'ULSMBH' },
      { name: 'NGC 4921', type: 'Anemic spiral — "missing" star formation',  lum: '~800 billion L☉', offset: [ 0.35, -0.25,  0.10] },
    ],
  },
  {
    // Norma Cluster (Abell 3627) — the dominant cluster at the Great Attractor core.
    // The GA is a broad ~65 Mpc gravitational basin; Norma is its brightest member.
    // Sits at very high southern declination (Dec −60.9°), so it appears deep-south
    // in the equatorial scene frame — physically distinct from the GA direction label.
    name: 'Norma Cluster',
    raDeg: 243.3, decDeg: -60.9, distMpc: 69.5,    // corrected from 65.0 — Said+2021 Fundamental Plane; peculiar velocity ~0, confirms Hubble-flow distance
    richness: 9,
    color: 0xff9933,
    supercluster: 'Laniakea',
    filaments: ['Centaurus Cluster', 'Hydra Cluster'],
    clusterType: 'richcluster',
    orientDeg: 132,   // elongated along Great Attractor infall direction
    axisRatio: 1.42,
    dmHaloRadiusMpc: 1.55,       // corrected from 1.90 — Carlberg+1997 scaling from measured sigma_v (~1.5-1.6 Mpc)
    virialMassMsun:  '1.2 × 10¹⁵ M☉',  // tightened from 1.1 × 10¹⁵ to match M200 in clusters/norma-members.json (M200 itself confirmed accurate, not corrected)
    dmFraction:      0.87,
    brightGalaxies: [
      { name: 'ESO 137-001', type: 'Spiral — ram-pressure stripped tail', lum: '~400 billion L☉', offset: [0.06, 0.04, -0.10] },
      { name: 'ESO 137-006', type: 'Giant elliptical (BCG)',              lum: '~1.2 trillion L☉', offset: [-0.14, 0.10, 0.08],
        bhMass: '~1 × 10⁹ M☉', bhType: 'ULSMBH' },
    ],
  },
  {
    name: 'Shapley Concentration',
    raDeg: 202.3, decDeg: -31.5, distMpc: 200.0,   // consensus ~650 Mly = 200 Mpc
    richness: 10,
    dmHaloRadiusMpc: 5.5,       // effective radius of the multi-cluster complex
    virialMassMsun:  '~10¹⁶ M☉',
    dmFraction:      0.88,
    color: 0xff9944,
    supercluster: 'Shapley',
    filaments: ['Centaurus Cluster', 'Coma Cluster'],
    clusterType: 'superconc',
    orientDeg: 82,    // A3558/A3562/A3556 merger chain runs roughly E-W
    axisRatio: 2.10,
    brightGalaxies: [
      { name: 'A3558 (Shapley 8)',  type: 'Richest cluster in Shapley — BCG complex', lum: '~5 trillion L☉', offset: [ 0.10,  0.20, -0.12],
        bhMass: '~5 × 10⁹ M☉', bhType: 'ULSMBH' },
      { name: 'A3562',              type: 'Merging cluster / X-ray bright',            lum: '~3 trillion L☉', offset: [-0.25,  0.08,  0.30] },
      { name: 'A3556',              type: 'Infalling group',                           lum: '~2 trillion L☉', offset: [ 0.35, -0.18, -0.22] },
    ],
  },
]

// ── Great Attractor ───────────────────────────────────────────────────────────
// Broad gravitational convergence basin centred on the Norma Cluster region.
// Galaxies within ~200 Mpc of the Milky Way flow toward this point at ~600 km/s.
// Not a single object — a gravitational basin spanning ~200–250 km/s depth.

export const GREAT_ATTRACTOR = {
  name:     'Great Attractor Basin',
  raDeg:    243.3,
  decDeg:   -60.9,
  distMpc:  65.0,    // convergence core co-located with Norma Cluster
  note:     'Gravitational convergence point for ~10⁵ galaxies within 200 Mpc. Infall velocity ~600 km/s from Milky Way direction.',
  massEstimateMsun: '~10¹⁵–10¹⁶ M☉ (total basin)',
}

// ── Laniakea supercluster ─────────────────────────────────────────────────────
// Defined by Tully et al. (2014) as a watershed divide in the peculiar velocity field.
// We are inside Laniakea (MW at origin). The boundary at ~160 Mpc is approximate.

export const LANIAKEA_EXTENT_MPC = 160   // approximate basin radius from Milky Way

// ── Cosmic voids ──────────────────────────────────────────────────────────────

export const VOIDS: CosmicVoid[] = [
  {
    name: 'Local Void',
    raDeg: 219, decDeg: 26, distMpc: 23,
    radiusMpc: 45,
    color: 0x001133,
    hasConduit: true,
  },
  {
    name: 'Sculptor Void',
    raDeg: 5, decDeg: -30, distMpc: 23,
    radiusMpc: 25,
    color: 0x001122,
    hasConduit: true,
  },
  {
    name: 'Boötes Void',
    raDeg: 230, decDeg: 46, distMpc: 250,
    radiusMpc: 130,
    color: 0x000a1a,
    hasConduit: true,
  },
  {
    name: 'KBC Void',
    raDeg: 0, decDeg: 0, distMpc: 0,
    radiusMpc: 300,
    color: 0x00050e,
    hasConduit: false, // we're inside — conduits at periphery
  },
]

// ── Wormhole conduits ─────────────────────────────────────────────────────────
// Placed at 90% of each void's radius from the Milky Way toward the void centre

export function buildConduits(): WormholeConduit[] {
  const conduits: WormholeConduit[] = []

  for (const v of VOIDS) {
    if (!v.hasConduit) continue

    const centre = mpcToVec3(v.raDeg, v.decDeg, v.distMpc)
    const dir    = centre.length() > 0.01
      ? centre.clone().normalize()
      : new THREE.Vector3(0, 0.3, -1).normalize()  // KBC: place conduit in front

    // Conduit sits just inside the void shell from our side.
    // If we're outside the void:  conduitDist = voidCentre − voidRadius × 0.95
    // If we're inside (dist < R):  conduitDist = voidRadius × 0.9  (exit shell nearby)
    const conduitDist = v.distMpc >= v.radiusMpc
      ? v.distMpc - v.radiusMpc * 0.95          // near periphery from outside
      : v.radiusMpc * 0.9                        // we're inside: conduit is at the shell

    const pos = dir.clone().multiplyScalar(conduitDist)
    conduits.push({ name: `${v.name} Conduit`, voidName: v.name, pos })
  }

  return conduits
}

// ── Three.js scene positions (scale: 1 unit = 15 Mpc) ────────────────────────

export const MPC_SCALE = 1 / 15   // 1 Mpc → 0.0667 scene units

export function clusterScenePos(c: CosmicCluster): THREE.Vector3 {
  return mpcToVec3(c.raDeg, c.decDeg, c.distMpc).multiplyScalar(MPC_SCALE)
}

export function voidScenePos(v: CosmicVoid): THREE.Vector3 {
  return mpcToVec3(v.raDeg, v.decDeg, v.distMpc).multiplyScalar(MPC_SCALE)
}

export function voidSceneRadius(v: CosmicVoid): number {
  return v.radiusMpc * MPC_SCALE
}

// ── X-ray cluster catalog (NASA/HEASARC/Takey2013) ────────────────────────────
// Loaded at runtime from /clusters-xray.json (345 XMM-Newton selected clusters).
// Distances extend to ~2884 Mpc; rendered as a separate deep-field layer.

export interface XRayCluster {
  name:     string
  raDeg:    number
  decDeg:   number
  z:        number      // redshift
  distMpc:  number
  tapKev:   number      // X-ray temperature (keV) — proxy for mass/richness
  colorHex: string      // pre-assigned display colour
  source:   string
}

/** Map tap_kev (0.49–7.48) to richness scale 1–10 */
export function tapKevToRichness(kev: number): number {
  return Math.max(1, Math.min(10, Math.round((kev / 7.5) * 10)))
}

/** Scene position for an X-ray cluster (same coordinate frame, same scale) */
export function xrayClusterScenePos(c: XRayCluster): THREE.Vector3 {
  return mpcToVec3(c.raDeg, c.decDeg, c.distMpc).multiplyScalar(MPC_SCALE)
}

export async function loadXrayClusters(): Promise<XRayCluster[]> {
  const res  = await fetch('/clusters-xray.json')
  if (!res.ok) throw new Error(`clusters-xray.json: HTTP ${res.status}`)
  const raw  = await res.json() as Array<{
    name: string; ra_deg: number; dec_deg: number
    z: number; dist_mpc: number; tap_kev: number
    color_hex: string; source: string
  }>
  return raw.map(r => ({
    name:     r.name,
    raDeg:    r.ra_deg,
    decDeg:   r.dec_deg,
    z:        r.z,
    distMpc:  r.dist_mpc,
    tapKev:   r.tap_kev,
    colorHex: r.color_hex,
    source:   r.source,
  }))
}
