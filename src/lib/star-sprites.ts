/**
 * src/lib/star-sprites.ts
 *
 * Scientifically-styled star sprite textures for Three.js.
 *
 * Design goals:
 *   – Spectral color is the DOMINANT visual feature — stars look their actual color
 *   – Smooth Gaussian-like falloff — no visible ring artefacts from sharp gradient stops
 *   – White hot-spot limited to the innermost 3–5% of the sprite radius
 *   – Hot stars (O/B/W) get a secondary nebula ring at ~45–60% radius
 *   – Cool stars (M/K) get an extended dim red halo for distinctiveness
 *   – Diffraction spikes only for genuinely bright stars (appMag ≤ 2), 6-point
 *
 * Spectral colours follow the Planckian locus approximated to the
 * UBVRI photometric system used in observational astronomy.
 */

import * as THREE from 'three'

// ── Spectral type palette ─────────────────────────────────────────────────────

export type SpectralClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'W'

export const SPECTRAL_RGB: Record<SpectralClass, [number, number, number]> = {
  O: [155, 176, 255],   // blue
  B: [170, 191, 255],   // blue-white
  A: [202, 215, 255],   // white-blue
  F: [248, 247, 255],   // warm white
  G: [255, 236, 170],   // solar yellow  ← slightly more saturated than before
  K: [255, 190, 110],   // orange
  M: [255, 130,  80],   // red-orange    ← more saturated than before
  W: [ 80, 230, 255],   // Wolf-Rayet cyan
}

// ── Texture cache ─────────────────────────────────────────────────────────────

const CACHE = new Map<string, THREE.CanvasTexture>()

// ── Core sprite builder ───────────────────────────────────────────────────────

/**
 * Build a cached star texture.
 *
 * magnitude tiers:
 *   1  = very bright (appMag < 1)   — diffraction spikes, max glow
 *   3  = medium      (appMag 1–4.5) — standard glow, no spikes
 *   7  = dim         (appMag > 4.5) — reduced corona
 */
export function makeStarSprite(
  spectral:  SpectralClass = 'G',
  magnitude: number        = 7,
  _res:      number        = 128,   // kept for API compat — internally we pick resolution
): THREE.CanvasTexture {
  const tier   = magnitude <= 1 ? 'V' : magnitude <= 3 ? 'M' : 'D'   // Vivid / Mid / Dim
  const cacheKey = `${spectral}_${tier}`
  if (CACHE.has(cacheKey)) return CACHE.get(cacheKey)!

  const res = tier === 'V' ? 256 : 128
  const cv  = document.createElement('canvas')
  cv.width  = cv.height = res
  const ctx = cv.getContext('2d')!
  const cx  = res / 2

  const [r, g, b] = SPECTRAL_RGB[spectral]
  const rgb        = `${r},${g},${b}`

  // ── Glow strengths per tier ────────────────────────────────────────────────
  //    The key fix: white core is tiny; spectral color alpha is HIGH and smooth.
  //    Multiple stops make a gentle Gaussian — no visible rings.
  const wa = tier === 'V' ? 1.00 : tier === 'M' ? 0.90 : 0.78   // white alpha
  const c1 = tier === 'V' ? 0.96 : tier === 'M' ? 0.82 : 0.68   // spectral near core
  const c2 = tier === 'V' ? 0.72 : tier === 'M' ? 0.55 : 0.36   // mid-inner
  const c3 = tier === 'V' ? 0.42 : tier === 'M' ? 0.26 : 0.14   // mid corona
  const c4 = tier === 'V' ? 0.18 : tier === 'M' ? 0.10 : 0.05   // outer corona
  const c5 = tier === 'V' ? 0.07 : tier === 'M' ? 0.03 : 0.01   // far halo

  // ── Main gradient: white hot-spot (3% radius) → spectral → transparent ────
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
  grad.addColorStop(0.000, `rgba(255,255,255,${wa})`)       // white point
  grad.addColorStop(0.030, `rgba(255,255,255,${wa * 0.90})`) // still white
  grad.addColorStop(0.060, `rgba(${rgb},${c1})`)            // spectral colour starts here
  grad.addColorStop(0.110, `rgba(${rgb},${c2})`)            // corona inner edge
  grad.addColorStop(0.220, `rgba(${rgb},${c3})`)            // smooth mid-corona
  grad.addColorStop(0.420, `rgba(${rgb},${c4})`)            // outer corona
  grad.addColorStop(0.680, `rgba(${rgb},${c5})`)            // far halo
  grad.addColorStop(1.000, `rgba(${rgb},0)`)                // transparent edge

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, res, res)

  // ── Secondary nebula ring — hot stars (O / B / W) ─────────────────────────
  //    Ring at 40–58% radius: spectral glow peaks in this band.
  if (spectral === 'O' || spectral === 'B' || spectral === 'W') {
    const rI = cx * 0.38, rO = cx * 0.58
    const ringA = tier === 'V' ? 0.30 : tier === 'M' ? 0.18 : 0.08
    const ring  = ctx.createRadialGradient(cx, cx, rI, cx, cx, rO)
    ring.addColorStop(0,   `rgba(${rgb},0)`)
    ring.addColorStop(0.45, `rgba(${rgb},${ringA})`)
    ring.addColorStop(0.70, `rgba(${rgb},${ringA * 0.60})`)
    ring.addColorStop(1,   `rgba(${rgb},0)`)
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = ring
    ctx.fillRect(0, 0, res, res)
    ctx.globalCompositeOperation = 'source-over'
  }

  // ── Extended dim halo — cool stars (M / K) ────────────────────────────────
  //    Wide faint halo that makes red/orange stars look distinctly warm.
  if (spectral === 'M' || spectral === 'K') {
    const rI = cx * 0.50, rO = cx * 0.95
    const hA = spectral === 'M'
      ? (tier === 'V' ? 0.22 : tier === 'M' ? 0.14 : 0.07)
      : (tier === 'V' ? 0.12 : tier === 'M' ? 0.07 : 0.03)
    const halo = ctx.createRadialGradient(cx, cx, rI, cx, cx, rO)
    halo.addColorStop(0,   `rgba(${rgb},0)`)
    halo.addColorStop(0.30, `rgba(${rgb},${hA})`)
    halo.addColorStop(0.70, `rgba(${rgb},${hA * 0.40})`)
    halo.addColorStop(1,   `rgba(${rgb},0)`)
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, res, res)
    ctx.globalCompositeOperation = 'source-over'
  }

  // ── Diffraction spikes — vivid tier only (appMag < 1), 6-point ────────────
  //    3 axes × 2 directions = 6-point star, like a real telescope image.
  //    Soft spikes (max 0.32 opacity) — informative, not distracting.
  if (tier === 'V') {
    ctx.globalCompositeOperation = 'screen'
    for (let a = 0; a < 3; a++) {
      const angle  = (a / 3) * Math.PI
      const spkLen = cx * 0.90
      const spkW   = res * 0.014

      const sg = ctx.createLinearGradient(
        cx + Math.cos(angle) * spkLen, cx + Math.sin(angle) * spkLen,
        cx - Math.cos(angle) * spkLen, cx - Math.sin(angle) * spkLen,
      )
      sg.addColorStop(0.00, `rgba(${rgb},0)`)
      sg.addColorStop(0.28, `rgba(${rgb},0)`)
      sg.addColorStop(0.44, `rgba(255,255,255,0.26)`)
      sg.addColorStop(0.50, `rgba(255,255,255,0.32)`)
      sg.addColorStop(0.56, `rgba(255,255,255,0.26)`)
      sg.addColorStop(0.72, `rgba(${rgb},0)`)
      sg.addColorStop(1.00, `rgba(${rgb},0)`)

      ctx.save()
      ctx.translate(cx, cx); ctx.rotate(angle); ctx.translate(-cx, -cx)
      ctx.fillStyle = sg
      ctx.fillRect(0, cx - spkW / 2, res, spkW)
      ctx.restore()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  const tex = new THREE.CanvasTexture(cv)
  tex.generateMipmaps = false
  tex.minFilter       = THREE.LinearFilter
  CACHE.set(cacheKey, tex)
  return tex
}

// ── Sprite mesh builder ───────────────────────────────────────────────────────

/**
 * Create a billboard Sprite for a star.
 * `sizeUnits` is the world-space diameter of the sprite.
 */
export function makeStarMesh(
  spectral:  SpectralClass = 'G',
  magnitude: number        = 7,
  sizeUnits: number        = 4,
): THREE.Sprite {
  const tex     = makeStarSprite(spectral, magnitude)
  const isVivid = magnitude <= 1
  const isMid   = magnitude <= 3

  const mat = new THREE.SpriteMaterial({
    map:         tex,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    // Vivid stars always at full opacity; dim stars slightly transparent
    opacity:     isVivid ? 1.0 : isMid ? 0.90 : 0.76,
  })

  const sprite = new THREE.Sprite(mat)
  // Vivid stars rendered slightly larger to emphasise their brightness
  sprite.scale.setScalar(sizeUnits * (isVivid ? 1.35 : isMid ? 1.08 : 1.0))
  return sprite
}

// ── Spectral helpers ──────────────────────────────────────────────────────────

/** Map effective temperature (K) → spectral class. */
export function teffToSpectral(teff: number | null | undefined): SpectralClass {
  if (!teff) return 'G'
  if (teff >= 30000) return 'O'
  if (teff >= 10000) return 'B'
  if (teff >= 7500)  return 'A'
  if (teff >= 6000)  return 'F'
  if (teff >= 5200)  return 'G'
  if (teff >= 3700)  return 'K'
  return 'M'
}

/** Derive spectral class from a Takey-catalog color_hex. */
export function spectralFromHex(hex: string): SpectralClass {
  if (hex === '#aaccff') return 'B'
  if (hex === '#ffeecc') return 'K'
  return 'G'
}

/**
 * Weighted random spectral class for a cluster member galaxy.
 * X-ray clusters are dominated by old ellipticals → mostly K/M/G.
 */
export function randomClusterSpectral(rng: () => number, isBcg = false): SpectralClass {
  if (isBcg) {
    const t = rng()
    return t < 0.5 ? 'K' : t < 0.8 ? 'F' : 'G'
  }
  const t = rng()
  if (t < 0.40) return 'M'
  if (t < 0.65) return 'K'
  if (t < 0.80) return 'G'
  if (t < 0.90) return 'F'
  if (t < 0.95) return 'A'
  if (t < 0.98) return 'B'
  return 'O'
}

// ── Named cluster overview sprites ────────────────────────────────────────────

export type ClusterType = 'group' | 'cluster' | 'richcluster' | 'superconc'

const _namedClusterCache = new Map<string, THREE.CanvasTexture>()

/**
 * Morphology-differentiated cluster overview sprite.
 *
 *  group      — loose spiral-rich poor group: offset blob trio, no bright core
 *  cluster    — concentrated regular cluster: filled elliptical core + one halo ring
 *  richcluster — massive cluster with substructure: bright core + two rings + arm wisps
 *  superconc  — multi-cluster superconcentration: 2-3 distinct cores sharing a halo
 *
 * `orientDeg` rotates the elongation axis (0 = vertical/N, clockwise).
 * `axisRatio` squashes the shape perpendicular to that axis (1.0 = circular).
 */
export function makeNamedClusterSprite(
  clusterType: ClusterType,
  col:         THREE.Color,
  richness:    number,
  sizeUnits:   number,
  orientDeg:   number = 0,
  axisRatio:   number = 1.0,
): THREE.Sprite {
  const hex = col.getHexString()
  const key = `ncs_${clusterType}_${hex}_${Math.round(richness)}`
  let tex = _namedClusterCache.get(key)

  if (!tex) {
    const S  = 256   // larger canvas for softer edges; more padding around gradient
    const cx = S / 2
    const cv = document.createElement('canvas')
    cv.width = cv.height = S
    const ctx = cv.getContext('2d')!
    const [r, g, b] = [Math.round(col.r * 255), Math.round(col.g * 255), Math.round(col.b * 255)]
    const rgb  = `${r},${g},${b}`
    const pk   = Math.min(0.52, 0.14 + richness * 0.038)   // peak opacity — keep nebula-like, not solid

    // Clip all drawing to a circle — guarantees transparent corners at any GPU filter level
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cx, cx * 0.88, 0, Math.PI * 2)
    ctx.clip()

    if (clusterType === 'group') {
      // ── Loose group: three offset knots (member galaxies visible as group), no dominant core
      const knots: [number, number, number][] = [
        [cx + S * 0.14, cx - S * 0.10, 0.28],   // dominant member (e.g. M31)
        [cx - S * 0.12, cx + S * 0.06, 0.18],   // secondary (e.g. M33)
        [cx + S * 0.02, cx + S * 0.15, 0.10],   // tertiary (e.g. M32)
      ]
      for (const [kx, ky, kpk] of knots) {
        const r2 = S * 0.18
        const g2 = ctx.createRadialGradient(kx, ky, 0, kx, ky, r2)
        g2.addColorStop(0.0,  `rgba(255,255,255,${kpk})`)
        g2.addColorStop(0.25, `rgba(${rgb},${(kpk * 0.55).toFixed(3)})`)
        g2.addColorStop(1.0,  `rgba(${rgb},0)`)
        ctx.fillStyle = g2
        ctx.beginPath(); ctx.arc(kx, ky, r2, 0, Math.PI * 2); ctx.fill()
      }
      // Faint shared envelope
      const env = ctx.createRadialGradient(cx, cx, S * 0.12, cx, cx, S * 0.46)
      env.addColorStop(0, `rgba(${rgb},${(pk * 0.08).toFixed(3)})`)
      env.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = env; ctx.fillRect(0, 0, S, S)

    } else if (clusterType === 'cluster') {
      // ── Regular cluster: filled elliptical core + one diffuse halo ring
      // Core glow — white kept dim so cluster color dominates
      const coreR = S * 0.22
      const core = ctx.createRadialGradient(cx, cx, 0, cx, cx, coreR)
      core.addColorStop(0.00, `rgba(255,255,255,${(pk * 0.45).toFixed(3)})`)
      core.addColorStop(0.12, `rgba(255,255,255,${(pk * 0.28).toFixed(3)})`)
      core.addColorStop(0.40, `rgba(${rgb},${(pk * 0.32).toFixed(3)})`)
      core.addColorStop(1.00, `rgba(${rgb},0)`)
      ctx.fillStyle = core; ctx.fillRect(0, 0, S, S)
      // Outer halo ring
      const hr = S * 0.38
      const halo = ctx.createRadialGradient(cx, cx, hr * 0.76, cx, cx, hr)
      halo.addColorStop(0, `rgba(${rgb},0)`)
      halo.addColorStop(0.5, `rgba(${rgb},${(pk * 0.12).toFixed(3)})`)
      halo.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = halo; ctx.fillRect(0, 0, S, S)

    } else if (clusterType === 'richcluster') {
      // ── Rich cluster: bright concentrated core + two halo rings + faint arm wisps
      // BCG nucleus — kept subtle so the nebula shape reads, not a star-like pinpoint
      const nuc = ctx.createRadialGradient(cx, cx, 0, cx, cx, S * 0.06)
      nuc.addColorStop(0, `rgba(255,255,255,0.38)`)
      nuc.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = nuc; ctx.fillRect(0, 0, S, S)
      // Main core glow
      const core2 = ctx.createRadialGradient(cx, cx, 0, cx, cx, S * 0.28)
      core2.addColorStop(0.00, `rgba(${rgb},${pk})`)
      core2.addColorStop(0.18, `rgba(${rgb},${(pk * 0.52).toFixed(3)})`)
      core2.addColorStop(0.55, `rgba(${rgb},${(pk * 0.14).toFixed(3)})`)
      core2.addColorStop(1.00, `rgba(${rgb},0)`)
      ctx.fillStyle = core2; ctx.fillRect(0, 0, S, S)
      // Inner halo ring
      for (const [rFrac, op] of [[0.34, 0.18], [0.46, 0.09]] as [number, number][]) {
        const rr = S * rFrac
        const ring = ctx.createRadialGradient(cx, cx, rr * 0.80, cx, cx, rr)
        ring.addColorStop(0, `rgba(${rgb},0)`)
        ring.addColorStop(0.5, `rgba(${rgb},${(pk * op).toFixed(3)})`)
        ring.addColorStop(1, `rgba(${rgb},0)`)
        ctx.fillStyle = ring; ctx.fillRect(0, 0, S, S)
      }
      // Faint subcluster arm wisps (2 radial streaks hinting at filaments)
      for (let i = 0; i < 2; i++) {
        const angle = (i * Math.PI) + 0.4
        const x2 = cx + Math.cos(angle) * S * 0.42
        const y2 = cx + Math.sin(angle) * S * 0.42
        const grad = ctx.createLinearGradient(cx, cx, x2, y2)
        grad.addColorStop(0, `rgba(${rgb},${(pk * 0.18).toFixed(3)})`)
        grad.addColorStop(1, `rgba(${rgb},0)`)
        ctx.strokeStyle = grad; ctx.lineWidth = 3.5
        ctx.beginPath(); ctx.moveTo(cx, cx); ctx.lineTo(x2, y2); ctx.stroke()
      }

    } else {
      // ── Superconcentration: three distinct cluster cores within shared large halo
      const corePositions: [number, number, number][] = [
        [cx + S * 0.10, cx - S * 0.04, pk],            // A3558 primary (richest)
        [cx - S * 0.14, cx + S * 0.06, pk * 0.70],     // A3562 (merging)
        [cx + S * 0.04, cx + S * 0.16, pk * 0.45],     // A3556 (infalling group)
      ]
      // Shared supercluster halo
      const bigHalo = ctx.createRadialGradient(cx, cx, S * 0.08, cx, cx, S * 0.48)
      bigHalo.addColorStop(0, `rgba(${rgb},${(pk * 0.22).toFixed(3)})`)
      bigHalo.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = bigHalo; ctx.fillRect(0, 0, S, S)
      // Individual cluster cores
      for (const [kx, ky, kpk] of corePositions) {
        const cR = S * 0.12
        const cg = ctx.createRadialGradient(kx, ky, 0, kx, ky, cR)
        cg.addColorStop(0.0,  `rgba(255,255,255,${kpk.toFixed(3)})`)
        cg.addColorStop(0.20, `rgba(${rgb},${(kpk * 0.60).toFixed(3)})`)
        cg.addColorStop(1.0,  `rgba(${rgb},0)`)
        ctx.fillStyle = cg
        ctx.beginPath(); ctx.arc(kx, ky, cR, 0, Math.PI * 2); ctx.fill()
        // Nucleus dot
        ctx.fillStyle = `rgba(255,255,255,0.9)`
        ctx.beginPath(); ctx.arc(kx, ky, 2.5, 0, Math.PI * 2); ctx.fill()
      }
      // X-ray bridge between A3558 and A3562
      const [ax, ay] = [corePositions[0][0], corePositions[0][1]]
      const [bx, by] = [corePositions[1][0], corePositions[1][1]]
      const bridge = ctx.createLinearGradient(ax, ay, bx, by)
      bridge.addColorStop(0, `rgba(${rgb},${(pk * 0.25).toFixed(3)})`)
      bridge.addColorStop(0.5, `rgba(${rgb},${(pk * 0.12).toFixed(3)})`)
      bridge.addColorStop(1, `rgba(${rgb},${(pk * 0.25).toFixed(3)})`)
      ctx.strokeStyle = bridge; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
    }

    ctx.restore()   // end circular clip

    // Radial alpha fade mask — multiplies existing alpha to zero before canvas edge.
    // This eliminates any square canvas boundary artifact from GPU texture filtering.
    ctx.save()
    ctx.globalCompositeOperation = 'destination-in'
    const alphaMask = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
    alphaMask.addColorStop(0.00, 'rgba(0,0,0,1)')
    alphaMask.addColorStop(0.70, 'rgba(0,0,0,1)')
    alphaMask.addColorStop(1.00, 'rgba(0,0,0,0)')
    ctx.fillStyle = alphaMask
    ctx.fillRect(0, 0, S, S)
    ctx.restore()

    tex = new THREE.CanvasTexture(cv)
    tex.generateMipmaps = false
    tex.minFilter       = THREE.LinearFilter
    _namedClusterCache.set(key, tex)
  }

  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.85,
  })
  const sprite = new THREE.Sprite(mat)
  // Apply orientation: rotate by orientDeg and squeeze by axisRatio
  const orientRad = (orientDeg * Math.PI) / 180
  const ux = Math.cos(orientRad) * sizeUnits
  const uy = Math.sin(orientRad) * sizeUnits
  // Scale the sprite: long axis = sizeUnits, short axis = sizeUnits / axisRatio
  sprite.scale.set(
    sizeUnits * (Math.abs(Math.cos(orientRad)) + Math.abs(Math.sin(orientRad)) / axisRatio),
    sizeUnits * (Math.abs(Math.sin(orientRad)) + Math.abs(Math.cos(orientRad)) / axisRatio),
    1,
  )
  mat.rotation = orientRad
  return sprite
}

// ── Galaxy / cluster sprite ───────────────────────────────────────────────────

/**
 * Billboard Sprite representing a distant galaxy or cluster.
 * Soft Gaussian blob tinted by `color`; `aspectRatio` creates elliptical shapes.
 */
/**
 * Build a galaxy/cluster sprite at the requested canvas resolution.
 * Higher `res` eliminates blurriness on close approach; use 128 for far-field,
 * 384 for mid-approach, and hide the sprite entirely at LOD_NEAR (star field takes over).
 */
export function makeGalaxySprite(
  color:       THREE.Color,
  richness:    number = 5,
  sizeUnits:   number = 0.30,
  aspectRatio: number = 1.5,
  res:         number = 128,   // canvas resolution — higher = sharper on approach
): THREE.Sprite {
  const texKey = `gal_${Math.round(richness)}_${res}`
  let tex: THREE.CanvasTexture

  if (CACHE.has(texKey)) {
    tex = CACHE.get(texKey)!
  } else {
    const cv  = document.createElement('canvas')
    cv.width  = cv.height = res
    const ctx = cv.getContext('2d')!
    const cx  = res / 2
    const pk  = Math.min(0.50, 0.20 + richness * 0.030)
    const gr  = cx * 0.80   // gradient radius — wider gives softer nebula edge

    // Clip to circle before drawing, then restore
    ctx.save()
    ctx.beginPath(); ctx.arc(cx, cx, gr, 0, Math.PI * 2); ctx.clip()

    // Main Gaussian glow — softer falloff, reduced white centre
    const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, gr)
    g.addColorStop(0.00, `rgba(255,255,255,${pk})`)
    g.addColorStop(0.08, `rgba(255,255,255,${(pk * 0.60).toFixed(3)})`)
    g.addColorStop(0.22, `rgba(255,255,255,${(pk * 0.24).toFixed(3)})`)
    g.addColorStop(0.50, `rgba(255,255,255,${(pk * 0.06).toFixed(3)})`)
    g.addColorStop(0.80, `rgba(255,255,255,${(pk * 0.01).toFixed(3)})`)
    g.addColorStop(1.00, `rgba(255,255,255,0)`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, res, res)

    // At higher resolutions, add ring structure for close approach
    if (res >= 256) {
      const ringOpacity = 0.055 + richness * 0.007
      for (const rFrac of [0.22, 0.42, 0.62]) {
        const rr = gr * rFrac
        const ring = ctx.createRadialGradient(cx, cx, rr * 0.92, cx, cx, rr * 1.08)
        ring.addColorStop(0,   `rgba(255,255,255,0)`)
        ring.addColorStop(0.5, `rgba(255,255,255,${ringOpacity.toFixed(3)})`)
        ring.addColorStop(1,   `rgba(255,255,255,0)`)
        ctx.fillStyle = ring
        ctx.fillRect(0, 0, res, res)
      }
    }

    ctx.restore()   // end circular clip

    // Radial alpha mask — guarantees zero alpha at canvas edge (no square boundary artifact)
    ctx.save()
    ctx.globalCompositeOperation = 'destination-in'
    const alphaMask = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
    alphaMask.addColorStop(0.00, 'rgba(0,0,0,1)')
    alphaMask.addColorStop(0.72, 'rgba(0,0,0,1)')
    alphaMask.addColorStop(1.00, 'rgba(0,0,0,0)')
    ctx.fillStyle = alphaMask
    ctx.fillRect(0, 0, res, res)
    ctx.restore()

    tex = new THREE.CanvasTexture(cv)
    tex.generateMipmaps = false
    tex.minFilter       = THREE.LinearFilter
    CACHE.set(texKey, tex)
  }

  const mat = new THREE.SpriteMaterial({
    map: tex, color, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0.80,
  })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(sizeUnits, sizeUnits / aspectRatio, 1)
  return sprite
}

/** Simple seeded RNG (mulberry32). */
export function seededRng(seed: number): () => number {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
