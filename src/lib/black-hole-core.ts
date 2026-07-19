/**
 * src/lib/black-hole-core.ts
 *
 * Shared Three.js builder for the "core" of any black hole scene: event
 * horizon (true shadow), photon ring, secondary lensed sub-ring, ISCO marker,
 * and a temperature-driven accretion disk. Extracted from GalacticCenterPage's
 * original Sgr A*-only buildEventHorizon()/buildAccretionDisk() so every
 * black hole in the catalog (src/data/black-holes.ts) renders the same
 * physically-grounded core, with only the surrounding "dressing" (nuclear
 * star cluster, companion star, jet, maser disk...) differing per scene type.
 *
 * All radii are passed in already-converted-to-scene-units — this module has
 * no opinion on AU-to-scene-unit scale or exaggeration factors, only on how
 * the GR structure looks once you hand it radii.
 */

import * as THREE from 'three'

export interface BlackHoleCoreParams {
  rsScene:         number
  photonScene:     number
  iscoScene:       number
  diskInnerScene:  number
  diskOuterScene:  number
  diskInnerTempK:  number
  diskOuterTempK:  number
  /** radians, slight tilt so the disk doesn't read as a flat line on-edge */
  diskTilt?:       number
  /**
   * Layered-sine turbulence added to the disk's brightness, evoking the
   * clumpy, non-axisymmetric flow seen in GRMHD accretion simulations
   * instead of a perfectly smooth gradient. Off by default (Sgr A*'s disk
   * keeps its original look); opt in per scene with a per-object seed so
   * different black holes don't share an identical turbulence pattern.
   */
  turbulence?:      boolean
  turbulenceSeed?:  number
  /**
   * Exponent on the Doppler brightening term. 1 = the original linear
   * approximation. Real relativistic beaming scales roughly with the cube
   * of the Doppler factor, producing a strongly one-sided bright arc rather
   * than a gently-shaded ring — set higher (2.5-3) for a more physically
   * accurate look. Off (1) by default so Sgr A*'s disk is unaffected.
   */
  dopplerPower?:    number
}

export interface BlackHoleCoreHandles {
  horizon:    THREE.Mesh
  photonRing: THREE.Mesh
  lensRing:   THREE.Mesh
  iscoRing:   THREE.Mesh
  disk:       THREE.Mesh
  diskMat:    THREE.MeshBasicMaterial
  diskGlow:   THREE.Mesh
}

/** Event horizon + photon ring + n=2 lensed sub-ring + ISCO marker. */
export function buildEventHorizonCore(group: THREE.Group, p: BlackHoleCoreParams): {
  horizon: THREE.Mesh; photonRing: THREE.Mesh; lensRing: THREE.Mesh; iscoRing: THREE.Mesh
} {
  // Event horizon — the true "shadow": pure black, absorbs everything, casts
  // no light. This is what the EHT actually images as a dark disk.
  const horizonGeo = new THREE.SphereGeometry(p.rsScene, 32, 32)
  const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
  const horizon    = new THREE.Mesh(horizonGeo, horizonMat)
  group.add(horizon)

  // Photon ring — ~1.2-1.5 Rs depending on spin, the bright ring of light
  // orbiting just outside the horizon, gravitationally lensed into a halo.
  const photonGeo = new THREE.TorusGeometry(p.photonScene, p.rsScene * 0.10, 16, 96)
  const photonMat = new THREE.MeshBasicMaterial({ color: 0xffe8c0, transparent: true, opacity: 0.85 })
  const photonRing = new THREE.Mesh(photonGeo, photonMat)
  group.add(photonRing)

  // Secondary lensed image — fainter, slightly larger ring, representing light
  // that orbited the black hole more than once (the n=2 photon sub-ring)
  const lensGeo = new THREE.TorusGeometry(p.photonScene * 1.35, p.rsScene * 0.05, 12, 96)
  const lensMat = new THREE.MeshBasicMaterial({ color: 0xffcc99, transparent: true, opacity: 0.22 })
  const lensRing = new THREE.Mesh(lensGeo, lensMat)
  group.add(lensRing)

  // ISCO — innermost stable circular orbit; matter inside this radius can no
  // longer orbit stably and plunges toward the horizon
  const iscoGeo = new THREE.TorusGeometry(p.iscoScene, Math.max(0.0005, p.rsScene * 0.05), 4, 96)
  const iscoMat = new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.30 })
  const iscoRing = new THREE.Mesh(iscoGeo, iscoMat)
  group.add(iscoRing)

  return { horizon, photonRing, lensRing, iscoRing }
}

/** Temperature-gradient accretion disk + outer glow ring. */
export function buildAccretionDiskCore(group: THREE.Group, p: BlackHoleCoreParams): {
  disk: THREE.Mesh; diskMat: THREE.MeshBasicMaterial; diskGlow: THREE.Mesh
} {
  const DISK_INNER = p.diskInnerScene
  const DISK_OUTER = p.diskOuterScene
  const RING_SEGS  = p.turbulence ? 128 : 64
  const RADIAL_SEGS = p.turbulence ? 20 : 8

  const geom = new THREE.RingGeometry(DISK_INNER, DISK_OUTER, RING_SEGS, RADIAL_SEGS)

  // Per-vertex colour from real inner/outer temperatures (log scale — RIAF
  // disks span 10⁴–10⁷ K) rather than a flat linear ramp.
  const logInner = Math.log10(p.diskInnerTempK)
  const logOuter = Math.log10(p.diskOuterTempK)
  const dopplerPower = p.dopplerPower ?? 1
  const seed = p.turbulenceSeed ?? 0

  const posArr = geom.attributes['position'] as THREE.BufferAttribute
  const count  = posArr.count
  const colArr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const x = posArr.getX(i), z = posArr.getZ(i)
    const r = Math.sqrt(x * x + z * z)
    const theta = Math.atan2(z, x)
    const rt   = (r - DISK_INNER) / (DISK_OUTER - DISK_INNER)     // 0=inner 1=outer
    const logT = logInner + (logOuter - logInner) * rt
    let heat = (logT - logOuter) / (logInner - logOuter)          // 0=coolest(outer) 1=hottest(inner)

    if (p.turbulence) {
      // Layered sine "turbulence" — clumpy density/brightness variation
      // standing in for the non-axisymmetric structure GRMHD sims show,
      // without simulating actual magnetorotational-instability physics.
      const n1 = Math.sin(theta * 7  + rt * 9  + seed) * 0.5 + 0.5
      const n2 = Math.sin(theta * 17 - rt * 5  + seed * 2.3) * 0.5 + 0.5
      const n3 = Math.sin(theta * 3  + rt * 23 + seed * 4.1) * 0.5 + 0.5
      const turb = n1 * 0.5 + n2 * 0.3 + n3 * 0.2
      heat = heat * (0.65 + turb * 0.7)
    }

    // Relativistic beaming: brightness on the approaching side (x > 0 here)
    // scales with a power of the Doppler factor rather than linearly.
    const dopplerFactor = 1 + 0.4 * (-x / Math.max(r, 0.01))
    const doppler = Math.pow(Math.max(0.05, dopplerFactor), dopplerPower)

    colArr[i * 3]     = Math.min(1, (0.55 + heat * 0.45) * doppler)
    colArr[i * 3 + 1] = Math.min(1, (0.12 + heat * 0.38) * doppler)
    colArr[i * 3 + 2] = Math.min(1, (0.02 + heat * 0.10) * doppler)
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colArr, 3))

  const diskMat = new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.55,
  })
  const disk = new THREE.Mesh(geom, diskMat)
  disk.rotation.x = Math.PI / 2
  disk.rotation.z = p.diskTilt ?? 0.18
  group.add(disk)

  const glowGeo = new THREE.TorusGeometry(DISK_OUTER, DISK_OUTER * 0.04, 8, 64)
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.25 })
  const diskGlow = new THREE.Mesh(glowGeo, glowMat)
  diskGlow.rotation.x = Math.PI / 2
  group.add(diskGlow)

  return { disk, diskMat, diskGlow }
}

/** Stylized flare brightening cycle — NOT real-time accurate. Compresses a
 *  source's real flare cadence into a short visual cycle so a viewer watching
 *  the scene actually sees one. */
export function flareEnvelope(t: number, periodSec = 9, spikeWidth = 14, spikeHeight = 0.7): number {
  const cyclePos = (t % periodSec) / periodSec
  const spike    = Math.exp(-Math.pow((cyclePos - 0.15) * spikeWidth, 2))
  return 1 + spike * spikeHeight
}
