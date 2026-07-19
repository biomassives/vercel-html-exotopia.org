/**
 * src/data/black-holes.ts
 *
 * Catalog of black holes beyond Sagittarius A* with strong, citable observational
 * evidence — spanning every category of "how do we know this is a black hole":
 *   - Direct imaging (EHT):                 M87*
 *   - Megamaser disk dynamics (Keplerian):  NGC 4258
 *   - Astrometric binary orbit-fitting:     Gaia BH1, BH2, BH3
 *   - X-ray binary radial velocity + VLBI:  Cygnus X-1, V404 Cygni, GRO J1655-40, A0620-00
 *   - Hypervelocity tracer stars (HST):     Omega Centauri IMBH
 *
 * Sgr A* itself stays in galactic-center.ts (S-stars, IRS 13E, settlement zones
 * are specific to "we live in this galaxy's nucleus" and don't generalize).
 *
 * Sources (see per-entry comments for the specific figure each citation supports):
 *   - M87*:        EHT Collaboration 2019 (ApJL 875, L6); Event Horizon Telescope 2021
 *                  polarimetry (ApJL 910, L12) for spin orientation
 *   - NGC 4258:    Humphreys et al. 2013 (ApJ 775, 13); Herrnstein et al. 2005
 *   - Omega Cen:   Häberle et al. 2024 (Nature 631, 285) — 7 hypervelocity stars
 *   - Gaia BH1/2:  El-Badry et al. 2023 (MNRAS 518, 1057; MNRAS 521, 4323)
 *   - Gaia BH3:    Gaia Collaboration / Panuzzo et al. 2024 (A&A 686, L2)
 *   - Cygnus X-1:  Miller-Jones et al. 2021 (Science 371, 1046) — revised VLBI parallax
 *   - V404 Cygni:  Miller-Jones et al. 2009 (ApJL 706, L230) — first accurate BH parallax
 *   - GRO J1655-40: Greene, Bailyn & Orosz 2001 (ApJ 554, 1290)
 *   - A0620-00:    Cantrell et al. 2010 (ApJ 710, 1127)
 *
 * Photon-sphere / ISCO radii are approximations, not paper-specific Kerr-metric
 * solutions (matching the convention already used for Sgr A* in galactic-center.ts):
 *   - spin ~0 (unmeasured, treated as Schwarzschild): photon sphere 1.5 Rs, ISCO 6 Rs
 *   - spin ~0.5 (moderate, EHT-typical placeholder):  photon sphere 1.5 Rs, ISCO 4.5 Rs
 *   - spin > 0.9 (near-extremal Kerr, prograde):       photon sphere 1.2 Rs, ISCO 1.3 Rs
 *
 * Orbital separations for the X-ray binaries are Kepler's-third-law derivations
 * from each system's published mass sum and orbital period (a³ = P²·M, P in years,
 * M in M☉, a in AU) — a straightforward derived quantity, not an independent claim.
 */

import * as THREE from 'three'

// ── Constants ──────────────────────────────────────────────────────────────────

/** km per Schwarzschild radius per solar mass: Rs = 2GM/c² */
const RS_KM_PER_MSUN = 2.9533
const KM_PER_AU = 1.495978707e8

export function rsAuFromMass(mass_msun: number): number {
  return (mass_msun * RS_KM_PER_MSUN) / KM_PER_AU
}

export type SpinRegime = 'schwarzschild' | 'moderate' | 'near-extremal'

export function photonSphereFactor(regime: SpinRegime): number {
  return regime === 'near-extremal' ? 1.2 : 1.5
}
export function iscoFactor(regime: SpinRegime): number {
  return regime === 'near-extremal' ? 1.3 : regime === 'moderate' ? 4.5 : 6.0
}

// ── Scene type discriminant ───────────────────────────────────────────────────

export type BHSceneType = 'x-ray-binary' | 'globular-imbh' | 'agn-jet' | 'megamaser-disk'

interface BlackHoleBase {
  id:            string
  label:         string
  sceneType:     BHSceneType
  mass_msun:     number
  spinRegime:    SpinRegime
  /** true spin parameter a* if actually measured; null if unmeasured/uncertain */
  spin_measured: number | null
  dist_pc:       number
  ra_deg:        number
  dec_deg:       number
  discovery:     string
  evidence:      string
}

// ── X-ray binaries (stellar-mass BH + companion star, Roche-lobe accretion) ────

export interface CompanionStar {
  spectral_type: string
  mass_msun:     number
  radius_rsun:   number   // typical value for spectral type — see file header
  teff_K:        number
  color_hex:     string
}

/**
 * How the black hole is actually observed to behave right now — the single
 * biggest source of genuine visual variance between these 7 systems.
 *   - 'persistent':          wind-fed accretion keeps a bright disk essentially
 *                            always on (Cygnus X-1 only, among this catalog).
 *   - 'quiescent-transient': spends decades faint/dormant, then erupts into a
 *                            dramatic, well-documented outburst before fading
 *                            back to quiescence (V404 Cyg, GRO J1655-40, A0620-00).
 *   - 'detached':            no meaningful accretion at all — the companion's
 *                            orbit is wide enough (or circular enough) that it
 *                            never fills its Roche lobe, so there is no gas
 *                            flow and no disk. This is *why* Gaia BH1/2/3 were
 *                            invisible to every X-ray survey and were only
 *                            found via astrometric orbital wobble.
 */
export type AccretionState = 'persistent' | 'quiescent-transient' | 'detached'

export interface XRayBinaryTarget extends BlackHoleBase {
  sceneType:        'x-ray-binary'
  companion:        CompanionStar
  period_days:      number
  separation_au:    number   // Kepler-derived, see file header
  accretionState:   AccretionState
  /** Only meaningful for 'quiescent-transient' — the real, citable last eruption. */
  lastOutburst?:    string
}

// ── Globular cluster IMBH (dense stellar field, hypervelocity tracer stars) ────

export interface GlobularImbhTarget extends BlackHoleBase {
  sceneType:          'globular-imbh'
  hostCluster:        string
  clusterDistLy:      number
  coreVelDispKmS:     number   // central velocity dispersion
  tracerStarCount:    number   // hypervelocity stars used as dynamical evidence
}

// ── AGN with relativistic jet (M87*) ────────────────────────────────────────────

export interface AgnJetTarget extends BlackHoleBase {
  sceneType:       'agn-jet'
  hostGalaxy:      string
  hostGalaxyType:  string
  jetLengthLy:     number
  jetInclinationDeg: number
}

// ── Megamaser accretion disk (NGC 4258) ────────────────────────────────────────

export interface MegamaserDiskTarget extends BlackHoleBase {
  sceneType:        'megamaser-disk'
  hostGalaxy:       string
  diskInnerPc:      number
  diskOuterPc:      number
  diskInclinationDeg: number
}

export type BlackHoleTarget =
  | XRayBinaryTarget
  | GlobularImbhTarget
  | AgnJetTarget
  | MegamaserDiskTarget

// ── Catalog ────────────────────────────────────────────────────────────────────

export const BLACK_HOLE_CATALOG: BlackHoleTarget[] = [
  // ── EHT-imaged ────────────────────────────────────────────────────────────
  {
    id: 'M87-star', label: 'M87*', sceneType: 'agn-jet',
    mass_msun: 6.5e9,              // EHT Collaboration 2019, Paper VI
    spinRegime: 'moderate', spin_measured: null,   // nonzero, low-to-intermediate; magnitude not pinned down (EHT 2021 polarimetry)
    dist_pc: 16.8e6 / 3.2616,       // 16.8 Mpc → pc
    ra_deg: 187.705971, dec_deg: 12.391123,   // J2000, NED
    discovery: 'Event Horizon Telescope, first black hole image, 2019',
    evidence: 'Direct shadow imaging; shadow diameter → mass via GR (11% precision)',
    hostGalaxy: 'Messier 87 (Virgo A)', hostGalaxyType: 'Giant elliptical, cD-type',
    jetLengthLy: 5000,             // ~1.5 kpc projected, one of the best-studied AGN jets
    jetInclinationDeg: 17,         // close to line of sight — why it appears so bright/compact
  },

  // ── Megamaser dynamical mass (most precise extragalactic BH mass after Sgr A*) ─
  {
    id: 'NGC-4258', label: 'NGC 4258 (M106)', sceneType: 'megamaser-disk',
    mass_msun: 3.9e7,               // Humphreys et al. 2013, VLBI water-maser disk
    spinRegime: 'schwarzschild', spin_measured: null,
    dist_pc: 7.6e6 / 3.2616,        // 7.6 Mpc (megamaser geometric distance)
    ra_deg: 184.739789, dec_deg: 47.303719,   // J2000, NED
    discovery: 'VLBI water-maser disk mapping, Miyoshi et al. 1995; Humphreys et al. 2013',
    evidence: 'Keplerian rotation of masers in a literal accretion disk — model-independent dynamical mass',
    hostGalaxy: 'NGC 4258 (M106)',
    diskInnerPc: 0.13, diskOuterPc: 0.28, diskInclinationDeg: 83,  // near edge-on
  },

  // ── Intermediate-mass (2024 HST hypervelocity-star result) ─────────────────
  {
    id: 'Omega-Cen-IMBH', label: 'ω Centauri IMBH', sceneType: 'globular-imbh',
    mass_msun: 4.35e4,              // Häberle et al. 2024, midpoint of 39,000–47,000 M☉
    spinRegime: 'schwarzschild', spin_measured: null,
    dist_pc: 5240,                  // oMEGACat kinematic distance, Håberle+2025
    ra_deg: 201.696958, dec_deg: -47.479581,   // J2000
    discovery: 'Häberle et al. 2024 (Nature) — 20 years of HST astrometry',
    evidence: '7 hypervelocity stars in the cluster core moving too fast to be gravitationally bound to anything but a massive dark object',
    hostCluster: 'Omega Centauri (NGC 5139)', clusterDistLy: 17090,
    coreVelDispKmS: 21.9,           // innermost 1' — Häberle+2024 / earlier ground-based studies
    tracerStarCount: 7,
  },

  // ── Gaia astrometric binaries — mass from orbit-fitting alone ───────────────
  {
    id: 'Gaia-BH1', label: 'Gaia BH1', sceneType: 'x-ray-binary',
    mass_msun: 9.6,                 // El-Badry et al. 2023
    spinRegime: 'schwarzschild', spin_measured: null,
    dist_pc: 480,
    ra_deg: 262.17, dec_deg: -0.58,
    discovery: 'Gaia DR3 astrometric orbit, El-Badry et al. 2023',
    evidence: 'Full 3D orbital solution from astrometric wobble — mass with zero accretion-disk modeling',
    companion: { spectral_type: 'G-dwarf', mass_msun: 0.93, radius_rsun: 1.0, teff_K: 5850, color_hex: '#ffe4aa' },
    period_days: 185.6, separation_au: 1.4,
    accretionState: 'detached',   // Sun-like dwarf, no evidence of interaction — El-Badry et al. 2023
  },
  {
    id: 'Gaia-BH2', label: 'Gaia BH2', sceneType: 'x-ray-binary',
    mass_msun: 8.9,                 // El-Badry et al. 2023 (MNRAS 521, 4323)
    spinRegime: 'schwarzschild', spin_measured: null,
    dist_pc: 1160,
    ra_deg: 207.57, dec_deg: -59.24,
    discovery: 'Gaia DR3 astrometric orbit, El-Badry et al. 2023',
    evidence: 'Widest known BH binary — 4.96 AU separation, red-giant companion',
    companion: { spectral_type: 'Red giant (K/M)', mass_msun: 1.07, radius_rsun: 15.0, teff_K: 4300, color_hex: '#ffbe6e' },
    period_days: 1276.7, separation_au: 4.96,
    accretionState: 'detached',   // widest known BH binary — far too wide for Roche-lobe overflow
  },
  {
    id: 'Gaia-BH3', label: 'Gaia BH3', sceneType: 'x-ray-binary',
    mass_msun: 32.7,                // Gaia Collaboration / Panuzzo et al. 2024 — most massive known stellar BH in the Milky Way
    spinRegime: 'schwarzschild', spin_measured: null,
    dist_pc: 590,
    ra_deg: 294.8278502411, dec_deg: 14.9309190720,
    discovery: 'Gaia DR3 pre-release astrometry, Panuzzo et al. 2024',
    evidence: 'Metal-poor halo giant companion — likely a first-generation-star remnant',
    companion: { spectral_type: 'Metal-poor giant', mass_msun: 0.76, radius_rsun: 8.0, teff_K: 4600, color_hex: '#ffcc88' },
    period_days: 4236, separation_au: 16.5,   // 11.6 yr period
    accretionState: 'detached',   // widest-separation system in the catalog — no interaction
  },

  // ── X-ray binary microquasars — the original stellar-mass BH discoveries ────
  {
    id: 'Cygnus-X-1', label: 'Cygnus X-1', sceneType: 'x-ray-binary',
    mass_msun: 21.2,                // Miller-Jones et al. 2021, Science
    spinRegime: 'near-extremal', spin_measured: 0.998,   // continuum-fitting estimates cluster near-maximal; treat as approximate
    dist_pc: 2200,
    ra_deg: 299.590325, dec_deg: 35.201599,   // 19h58m22s +35°12'06"
    discovery: 'First X-ray source widely accepted as a black hole (Bolton 1972; Webster & Murdin 1972)',
    evidence: 'Revised VLBA parallax (2021) → higher mass; near-maximal spin from disk continuum + Fe K-alpha line fitting',
    companion: { spectral_type: 'O9.7 Iab supergiant (HDE 226868)', mass_msun: 40.6, radius_rsun: 17.0, teff_K: 28000, color_hex: '#9bb0ff' },
    period_days: 5.599829, separation_au: 0.2434,
    accretionState: 'persistent',   // wind-fed from the supergiant's strong stellar wind — bright in X-rays continuously since 1964
  },
  {
    id: 'V404-Cygni', label: 'V404 Cygni', sceneType: 'x-ray-binary',
    mass_msun: 9.0,                 // Khargharia et al. 2010; Miller-Jones et al. 2009 for distance
    spinRegime: 'schwarzschild', spin_measured: null,
    dist_pc: 2390,
    ra_deg: 306.016, dec_deg: 33.867,   // 20h24m03.8s +33°52'02"
    discovery: 'First black hole with an accurate VLBI parallax distance (Miller-Jones et al. 2009)',
    evidence: 'K3 III giant donor via radial-velocity spectroscopy; recurrent dramatic outbursts (1938, 1989, 2015)',
    companion: { spectral_type: 'K3 III giant', mass_msun: 0.9, radius_rsun: 6.0, teff_K: 4400, color_hex: '#ffbe6e' },
    period_days: 6.4714, separation_au: 0.1445,
    accretionState: 'quiescent-transient', lastOutburst: '2015 (also 1938, 1989)',
  },
  {
    id: 'GRO-J1655-40', label: 'GRO J1655-40', sceneType: 'x-ray-binary',
    mass_msun: 6.3,                 // Greene, Bailyn & Orosz 2001 — midpoint of 5.5-7.9 M☉ range
    spinRegime: 'moderate', spin_measured: 0.7,   // Shafee et al. 2006 continuum-fitting estimate
    dist_pc: 3200,
    ra_deg: 253.5, dec_deg: -39.845,   // 16h54m00s −39°50'45"
    discovery: 'Microquasar with resolved relativistic radio jets (Tingay et al. 1995; Hjellming & Rupen 1995)',
    evidence: 'F3-5 subgiant donor; apparent superluminal jet ejecta — the first Galactic "microquasar"',
    companion: { spectral_type: 'F3-5 IV subgiant', mass_msun: 2.3, radius_rsun: 2.0, teff_K: 6500, color_hex: '#f8f7ff' },
    period_days: 2.62168, separation_au: 0.0765,
    accretionState: 'quiescent-transient', lastOutburst: '1994 (superluminal radio jet), 2005',
  },
  {
    id: 'A0620-00', label: 'A0620-00 (V616 Mon)', sceneType: 'x-ray-binary',
    mass_msun: 6.6,                 // Cantrell et al. 2010
    spinRegime: 'schwarzschild', spin_measured: null,
    dist_pc: 1060,
    ra_deg: 95.686, dec_deg: -0.346,   // 06h22m44.5s −00°20'45"
    discovery: 'Closest known black hole to the Sun at time of discovery (1975 X-ray nova)',
    evidence: 'K2V dwarf donor, precisely characterized via decades of quiescent monitoring',
    companion: { spectral_type: 'K2 V dwarf', mass_msun: 0.40, radius_rsun: 0.7, teff_K: 4900, color_hex: '#ffbe6e' },
    period_days: 0.3230, separation_au: 0.01764,
    accretionState: 'quiescent-transient', lastOutburst: '1975 (discovery outburst)',
  },
]

export function findBlackHole(id: string): BlackHoleTarget | undefined {
  return BLACK_HOLE_CATALOG.find(bh => bh.id === id)
}

// ── Shared derived-radius helper ──────────────────────────────────────────────

export interface BlackHoleRadii {
  rs_au:           number
  photon_sphere_au: number
  isco_au:         number
}

export function radiiFor(bh: BlackHoleBase): BlackHoleRadii {
  const rs_au = rsAuFromMass(bh.mass_msun)
  return {
    rs_au,
    photon_sphere_au: rs_au * photonSphereFactor(bh.spinRegime),
    isco_au:          rs_au * iscoFactor(bh.spinRegime),
  }
}

export function bhColorHex(bh: BlackHoleTarget): THREE.ColorRepresentation {
  if (bh.sceneType === 'x-ray-binary') return bh.companion.color_hex
  return '#ffe8c0'
}
