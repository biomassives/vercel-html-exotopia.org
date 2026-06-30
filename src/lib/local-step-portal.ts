/**
 * local-step-portal.ts
 *
 * Manages the Three.js geometry, shaders, and animation for the Local Step
 * Portal — a physics-parameterised "pool" portal in circum-polar orbit around
 * a settled planet or exomoon.
 *
 * The inner surface is a Gerstner-wave water simulation whose visual character
 * is driven by three planetary parameters:
 *   • equilibrium temperature  → colour palette (cryo-white → ocean blue → magma orange)
 *   • surface gravity          → wave dispersion speed (ω = √(g·k))
 *   • atmospheric pressure     → wave amplitude and surface roughness
 *
 * Usage in ClusterSystemPage tick():
 *   const portal = new LocalStepPortal(scene, camera, planet, orbitRadius, inclination, seed)
 *   // each frame:
 *   portal.update(elapsed, dt, planetWorldPos)
 *   // in raycaster handler:
 *   portal.checkHover(raycaster)
 *   // on click / approach:
 *   portal.setEntering(t)   // 0 → 1
 *   // cleanup:
 *   portal.dispose()
 */

import * as THREE from 'three'

// ── Planet physics input ──────────────────────────────────────────────────────

export interface PortalPlanetData {
  eqTempK:      number | null   // equilibrium temperature in Kelvin
  gravityMs2:   number | null   // surface gravity m/s² (null → use Earth default)
  atmPressure:  number | null   // atmospheric pressure in Earth atmospheres
  starHex:      string          // host star spectral colour as CSS hex, e.g. '#ffd2a1'
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PORTAL_SIZE   = 13.0    // inner water-plane width/height in scene units
const PORTAL_HALF   = PORTAL_SIZE * 0.5
const FRAME_SIZE    = 14.2    // outer frame extent (> PORTAL_SIZE by one tube radius each side)
const FRAME_TUBE_R  = 0.52    // tube radius for the square frame
const WATER_SEGS    = 96      // PlaneGeometry subdivisions — keep ≥64 for smooth waves
const PORTAL_PERIOD = 11.0    // seconds per orbit revolution (in-scene time)

// ── Colour helpers ────────────────────────────────────────────────────────────

function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t)
}

// Temperature → surface colour  (wide palette covering cryo to lava worlds)
function tempToSurfaceColor(eqt: number): THREE.Color {
  type Stop = [number, number, number, number]   // [K, r, g, b]
  const S: Stop[] = [
    [0,    0.88, 0.94, 1.00],   // absolute zero – cryo frost white
    [72,   0.72, 0.84, 0.98],   // liquid nitrogen lake
    [145,  0.58, 0.45, 0.88],   // methane / ethane (Titan, Pluto)
    [250,  0.14, 0.40, 0.90],   // water-ice boundary
    [285,  0.07, 0.50, 0.84],   // temperate ocean
    [350,  0.04, 0.66, 0.56],   // warm tropical shallows
    [520,  0.68, 0.62, 0.10],   // supercritical steam
    [950,  0.88, 0.28, 0.04],   // magma threshold
    [2000, 1.00, 0.55, 0.02],   // lava ocean
  ]
  for (let i = 0; i < S.length - 1; i++) {
    const [t0, r0, g0, b0] = S[i]!
    const [t1, r1, g1, b1] = S[i + 1]!
    if (eqt <= t1) {
      const f = (eqt - t0) / (t1 - t0)
      return new THREE.Color(r0 + (r1 - r0) * f, g0 + (g1 - g0) * f, b0 + (b1 - b0) * f)
    }
  }
  return new THREE.Color(1.0, 0.55, 0.02)
}

// ── Physics derivation ────────────────────────────────────────────────────────

interface PortalPhysics {
  gNorm:      number   // gravity / 9.8 (Earth = 1.0), clamped 0.1–4.5
  waveAmp:    number   // base Gerstner amplitude in scene units
  waveFreq:   number   // base wave-number k0 (rad / scene-unit)
  waveSpeed:  number   // phase-velocity multiplier = √(g/g_earth)
  baseColor:  THREE.Color
  depthColor: THREE.Color
  starColor:  THREE.Color
}

function derivePlanetPhysics(p: PortalPlanetData): PortalPhysics {
  const eqt  = p.eqTempK     ?? 288
  const gMs2 = p.gravityMs2  ?? 9.8
  const atm  = p.atmPressure ?? 1.0

  const gNorm     = Math.max(0.10, Math.min(4.5, gMs2 / 9.8))
  // Amplitude: thin atm → glassy (low amp), dense → heavy swells
  const waveAmp   = 0.006 + Math.log1p(Math.max(0, atm)) * 0.036
  // Frequency: higher gravity → shorter, more energetic waves
  const waveFreq  = 1.6 + gNorm * 1.4
  const waveSpeed = Math.sqrt(gNorm)

  const baseColor  = tempToSurfaceColor(eqt)
  // Depth colour is a darkened, saturated version of the surface colour
  const depthColor = new THREE.Color(
    baseColor.r * 0.09 + 0.008,
    baseColor.g * 0.14 + 0.015,
    baseColor.b * 0.22 + 0.030,
  )
  const starColor = hexToThreeColor(p.starHex || '#ffd2a1')

  return { gNorm, waveAmp, waveFreq, waveSpeed, baseColor, depthColor, starColor }
}

// ── GLSL shaders ──────────────────────────────────────────────────────────────
//
// These run as a Three.js ShaderMaterial, so Three.js automatically provides:
//   Vertex:   position (vec3), uv (vec2), normal (vec3),
//             projectionMatrix, modelViewMatrix, modelMatrix, cameraPosition
//   Fragment: (nothing extra beyond declared varyings)

const VERTEX_SHADER = /* glsl */ `
  // ── Per-wave Gerstner accumulator ──────────────────────────────────────────
  //
  // Deep-water Gerstner wave dispersion:  ω² = g · k   →  ω = √(g_norm · 9.8 · k)
  //
  // Inputs:
  //   p     – 2D position on the portal plane (scene units, centred at 0,0)
  //   d     – unit direction vector of the wave train
  //   A     – amplitude (scene units)
  //   steep – Q·k·A: controls horizontal displacement (0 = sine, 1 = sharp crest)
  //   k     – wave number (rad / scene-unit)
  //   phase – initial phase offset (radians)
  // Outputs (accumulated into inout args):
  //   disp  – position displacement (x/y = horizontal Gerstner tilt, z = vertical height)
  //   Nxyz  – normal accumulation (start as (0,0,1) and subtract per-wave contributions)

  uniform float uTime;
  uniform float uGNorm;      // g / 9.8
  uniform float uWaveAmp;    // base amplitude
  uniform float uWaveFreq;   // base wave number k0
  uniform float uWaveSpeed;  // √(g/g_earth)
  uniform float uEntering;   // 0 → 1 (portal approach)

  varying vec3  vNormal;
  varying vec3  vViewDir;
  varying float vHeight;
  varying vec2  vUv;
  varying float vEdge;

  void addWave(
    vec2 p, vec2 d, float A, float steep, float k, float phase,
    inout vec3 disp, inout vec3 N
  ) {
    // Phase velocity from gravity dispersion: c = ω/k = √(g·k)/k = √(g/k)
    float omega = sqrt(uGNorm * 9.8 * k) * uWaveSpeed;
    float f     = k * dot(d, p) - omega * uTime + phase;
    float c = cos(f), s = sin(f);
    float qa = steep;   // steep = Q·A; horizontal displacement per wave

    // Gerstner position delta
    disp.x += d.x * qa * c;
    disp.y += d.y * qa * c;
    disp.z += A * s;

    // Analytical normal contribution (from ∂P/∂x × ∂P/∂y partial derivatives)
    N.x -= k * A * d.x * c;
    N.y -= k * A * d.y * c;
    N.z -= steep * k * s;   // Q·k²·A·sin(f) compressed into steep·k·sin(f)
  }

  void main() {
    // Portal-local 2D coords centred at (0, 0)
    vec2 p = (uv - 0.5) * ${PORTAL_SIZE.toFixed(1)};

    // Radial edge mask — waves taper to zero at the frame
    float r        = length(p) / ${PORTAL_HALF.toFixed(1)};
    float edgeFade = 1.0 - smoothstep(0.70, 1.02, r);

    // Scale amplitude by edge fade + entry amplification
    float A  = uWaveAmp * edgeFade * (1.0 + uEntering * 2.0);
    float k0 = uWaveFreq;

    vec3 disp = vec3(0.0);
    vec3 N    = vec3(0.0, 0.0, 1.0);   // accumulate from flat normal up

    // ── Four primary ocean-swell trains ──────────────────────────────────────
    addWave(p, normalize(vec2( 1.000,  0.618)), A,        0.055, k0 * 1.00, 0.00, disp, N);
    addWave(p, normalize(vec2(-0.800,  0.900)), A * 0.82, 0.042, k0 * 1.31, 1.57, disp, N);
    addWave(p, normalize(vec2( 0.550, -0.850)), A * 0.70, 0.036, k0 * 1.68, 3.14, disp, N);
    addWave(p, normalize(vec2(-0.400, -0.650)), A * 0.58, 0.028, k0 * 2.10, 4.71, disp, N);

    // ── Four capillary / detail trains ───────────────────────────────────────
    addWave(p, normalize(vec2( 0.950,  0.312)), A * 0.28, 0.013, k0 * 3.22, 0.90, disp, N);
    addWave(p, normalize(vec2(-0.255,  1.000)), A * 0.22, 0.010, k0 * 4.05, 2.28, disp, N);
    addWave(p, normalize(vec2( 0.615,  0.788)), A * 0.17, 0.008, k0 * 5.48, 5.05, disp, N);
    addWave(p, normalize(vec2(-0.900,  0.436)), A * 0.14, 0.006, k0 * 6.82, 1.24, disp, N);

    // ── Standing wave component: interference pattern from opposite trains ───
    // sin(kx)·cos(ωt) — creates the "pool with walls" resonance pattern
    float sw = sin(p.x * k0 * 0.8) * cos(uTime * uWaveSpeed * 0.9)
             * sin(p.y * k0 * 0.7) * cos(uTime * uWaveSpeed * 0.75 + 0.4)
             * A * 0.30 * edgeFade;
    disp.z += sw;

    // ── Entry pulse: radial ripple expanding outward from centre ─────────────
    // Fires when uEntering > 0, creating the "membrane being disturbed" effect
    float entryPulse = uEntering * sin(r * 18.0 - uTime * 12.0) * max(0.0, 1.0 - r * 1.1) * 0.55;
    disp.z += entryPulse * uWaveAmp * 4.5;

    // Apply final edge fade to Z displacement only — horizontal tilt is fine at edges
    disp.z *= edgeFade;

    // Normalise height to [-1, 1] for use in fragment colour blending
    float maxZ = uWaveAmp * 9.0;
    vHeight = clamp(disp.z / max(0.001, maxZ), -1.0, 1.0);
    vNormal = normalize(N);
    vUv     = uv;
    vEdge   = edgeFade;

    // World-space view direction for Fresnel in fragment shader
    vec3 worldPos = (modelMatrix * vec4(position + disp, 1.0)).xyz;
    vViewDir = normalize(cameraPosition - worldPos);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + disp, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  // ── Caustic pattern ───────────────────────────────────────────────────────
  // Approximation of focused-refraction light patterns using layered trig products.
  // The product of three sine bands with different frequencies and temporal phases
  // creates crossing bright filaments similar to real caustics.

  uniform vec3  uBaseColor;    // surface colour from temperature
  uniform vec3  uDepthColor;   // deep / sub-surface colour
  uniform vec3  uStarColor;    // host-star spectral colour for specular / reflection
  uniform float uTime;
  uniform float uEntering;     // 0 → 1 portal approach progress
  uniform float uHovered;      // smoothly interpolated 0 | 1

  varying vec3  vNormal;
  varying vec3  vViewDir;
  varying float vHeight;
  varying vec2  vUv;
  varying float vEdge;

  // Three-layer trig caustic — cheap but convincing
  float caustic(vec2 p) {
    float t  = uTime * 0.55;
    vec2  p2 = p * 4.2;
    float c1 = sin(p2.x * 1.32 + t * 0.62) * cos(p2.y * 1.79 - t * 0.77);
    float c2 = sin(p2.x * 2.15 - t * 1.12) * cos(p2.y * 1.06 + t * 0.95);
    float c3 = sin((p2.x + p2.y) * 1.60 + t * 0.68) * cos((p2.x - p2.y) * 2.28 - t * 1.09);
    // Raise to fractional power to sharpen filaments without clipping
    return pow(max(0.0, c1 * c2 * c3), 0.55);
  }

  void main() {
    vec3  N   = normalize(vNormal);
    vec3  V   = normalize(vViewDir);
    float NdV = max(0.0, dot(N, V));

    // ── Fresnel (Schlick, water F0 ≈ 0.02) ───────────────────────────────────
    float frs = 0.02 + 0.98 * pow(1.0 - NdV, 5.0);

    // ── Depth-based colour ────────────────────────────────────────────────────
    // vHeight ∈ [-1, 1]: −1 = deep trough (see floor), +1 = sharp crest
    float depthT   = 0.5 - vHeight * 0.5;           // 0 = crest, 1 = trough
    vec3  waterCol = mix(uBaseColor, uDepthColor, depthT * 0.82);

    // ── Subsurface luminescence ───────────────────────────────────────────────
    // Light from inside the portal bleeds through near crests (thinner water above)
    float sss     = smoothstep(-0.30, 0.18, vHeight);
    vec3  sssGlow = uBaseColor * 1.65 + vec3(0.06, 0.12, 0.18);
    waterCol = mix(waterCol, sssGlow, sss * 0.26);

    // ── Caustics ──────────────────────────────────────────────────────────────
    // Caustics are strongest in the troughs where refracted light focuses
    float cst = caustic(vUv);
    waterCol += uBaseColor * cst * (depthT * 0.75 + 0.12) * 0.36;

    // Second caustic layer — slower, larger scale — creates large bright patches
    float t2    = uTime * 0.28;
    vec2  p2uv  = (vUv - 0.5) * 2.8;
    float c2big = sin(p2uv.x * 0.9 + t2) * cos(p2uv.y * 1.1 - t2 * 0.8)
                * sin((p2uv.x - p2uv.y) * 0.7 + t2 * 0.6);
    waterCol += uBaseColor * max(0.0, c2big) * 0.14;

    // ── Foam / whitecaps on wave crests ───────────────────────────────────────
    float foam = smoothstep(0.50, 0.82, vHeight);
    waterCol   = mix(waterCol, vec3(0.85, 0.93, 1.00), foam * 0.52);

    // ── Specular highlight from synthetic star light ───────────────────────────
    // Light direction: upper-right-front (fixed in view space gives consistent highlight)
    vec3  L    = normalize(vec3(0.55, 0.85, 0.30));
    vec3  H    = normalize(L + V);
    float spec = pow(max(0.0, dot(N, H)), 240.0) * max(0.0, dot(N, L));
    // Star tint: blend neutral white with the star's spectral colour
    vec3  specCol = mix(vec3(1.0), uStarColor * 1.4, 0.40) * spec * 3.0;

    // ── Fresnel reflection tint ───────────────────────────────────────────────
    // At grazing angles, surface reflects background: mix of deep space and star colour
    vec3 reflCol  = mix(vec3(0.03, 0.07, 0.14), uStarColor * 0.45, 0.38);
    vec3 finalCol = mix(waterCol, reflCol, frs * 0.70);
    finalCol += specCol;

    // ── Radial centre luminescence ────────────────────────────────────────────
    // The portal "soul" — a soft pulsing glow at the centre, brightest through
    // the trough regions (as if lit from below)
    float centreR    = length(vUv - 0.5);
    float centreGlow = smoothstep(0.50, 0.0, centreR)
                     * (0.30 + 0.12 * sin(uTime * 1.18));
    finalCol += uBaseColor * centreGlow * 0.38;

    // ── Portal-ring edge luminescence ─────────────────────────────────────────
    // Thin bright rim where the water meets the frame
    float rimGlow = smoothstep(0.38, 0.46, centreR) * smoothstep(0.50, 0.46, centreR);
    finalCol += mix(uBaseColor, uStarColor, 0.55) * rimGlow * 0.55;

    // ── Hover brightening ─────────────────────────────────────────────────────
    finalCol *= (1.0 + uHovered * 0.30);

    // ── Entry brightening: surface bleaches toward white as camera approaches ─
    // Parallels the light-inversion that fires when the plane is crossed
    float entBright = uEntering * uEntering * 0.65;
    finalCol = mix(finalCol, vec3(1.0), entBright);
    // Additional centre burst
    finalCol += vec3(uEntering * 0.55 * smoothstep(0.50, 0.0, centreR));

    // ── Alpha ─────────────────────────────────────────────────────────────────
    // Semi-transparent at grazing / edges; more opaque straight-on
    float alpha = vEdge * mix(0.72, 0.96, 1.0 - frs * 0.58);
    alpha = mix(alpha, 1.0, uEntering * 0.65);

    gl_FragColor = vec4(finalCol, alpha);
  }
`

// ── Seeded random ─────────────────────────────────────────────────────────────

function seededUnit(s: number): number {
  let x = (s | 0) ^ 0x45d9f3b
  x = ((x >>> 16) ^ x) * 0x45d9f3b
  x = ((x >>> 16) ^ x) * 0x45d9f3b
  x = (x >>> 16) ^ x
  return (x >>> 0) / 0xffffffff
}

// ── Glow texture (canvas → CanvasTexture) ────────────────────────────────────

function buildGlowTexture(col: THREE.Color): THREE.CanvasTexture {
  const size = 256
  const cv   = document.createElement('canvas')
  cv.width = cv.height = size
  const ctx  = cv.getContext('2d')!
  const r    = Math.round(col.r * 255)
  const g    = Math.round(col.g * 255)
  const b    = Math.round(col.b * 255)
  const grd  = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  grd.addColorStop(0,    `rgba(${r},${g},${b},0.55)`)
  grd.addColorStop(0.35, `rgba(${r},${g},${b},0.18)`)
  grd.addColorStop(0.70, `rgba(${r},${g},${b},0.04)`)
  grd.addColorStop(1,    'rgba(0,0,0,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(cv)
  tex.generateMipmaps = false
  tex.minFilter = THREE.LinearFilter
  return tex
}

// ── Square-frame tube geometry ────────────────────────────────────────────────
// Builds a closed TubeGeometry along a CurvePath of four LineCurve3 segments.
// Gives a physically solid square tube at the portal perimeter.

class SquarePath extends THREE.Curve<THREE.Vector3> {
  private readonly _half: number
  constructor(half: number) { super(); this._half = half }

  override getPoint(t: number, out = new THREE.Vector3()): THREE.Vector3 {
    const h = this._half
    // t ∈ [0,1) maps to the perimeter of the square, starting at bottom-left corner
    const perim = t * 4  // 0-4 spans the four sides
    const s     = perim % 1.0
    if (perim < 1)       out.set(-h + s * 2 * h, -h, 0)        // bottom: left → right
    else if (perim < 2)  out.set( h, -h + s * 2 * h, 0)        // right:  bottom → top
    else if (perim < 3)  out.set( h - s * 2 * h,  h, 0)        // top:    right → left
    else                 out.set(-h,  h - s * 2 * h, 0)        // left:   top → bottom
    return out
  }
}

// ── Main class ────────────────────────────────────────────────────────────────

export class LocalStepPortal {
  // Three.js objects (all in one Group added to the parent scene)
  private readonly _group    = new THREE.Group()
  private readonly _waterMat: THREE.ShaderMaterial
  private readonly _frameMat: THREE.MeshStandardMaterial
  private readonly _physics:  PortalPhysics

  // Interaction state
  private _hovered    = false
  private _hoveredT   = 0        // smoothed 0 → 1
  private _entering   = 0        // 0 → 1 approach progress
  private _orbitAngle: number    // initial orbit phase (deterministic from seed)

  // Callbacks
  private _onEnter:       (() => void) | null = null
  private _onHoverChange: ((v: boolean) => void) | null = null

  constructor(
    private readonly _scene:       THREE.Scene,
    private readonly _camera:      THREE.PerspectiveCamera,
    private readonly _planet:      PortalPlanetData,
    private readonly _orbitRadius: number,   // scene units
    private readonly _inclination: number,   // degrees, from equatorial plane
    seed = 0,
  ) {
    this._physics     = derivePlanetPhysics(_planet)
    this._orbitAngle  = seededUnit(seed) * Math.PI * 2

    // ── Water plane ──────────────────────────────────────────────────────────
    const { gNorm, waveAmp, waveFreq, waveSpeed, baseColor, depthColor, starColor } = this._physics

    const waterGeo = new THREE.PlaneGeometry(PORTAL_SIZE, PORTAL_SIZE, WATER_SEGS, WATER_SEGS)

    this._waterMat = new THREE.ShaderMaterial({
      vertexShader:   VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent:    true,
      side:           THREE.DoubleSide,
      depthWrite:     false,
      uniforms: {
        uTime:       { value: 0 },
        uGNorm:      { value: gNorm },
        uWaveAmp:    { value: waveAmp },
        uWaveFreq:   { value: waveFreq },
        uWaveSpeed:  { value: waveSpeed },
        uEntering:   { value: 0 },
        uHovered:    { value: 0 },
        uBaseColor:  { value: baseColor.clone() },
        uDepthColor: { value: depthColor.clone() },
        uStarColor:  { value: starColor.clone() },
      },
    })

    const waterMesh     = new THREE.Mesh(waterGeo, this._waterMat)
    waterMesh.renderOrder = 1
    this._group.add(waterMesh)

    // ── Square portal frame ───────────────────────────────────────────────────
    const framePath = new SquarePath(FRAME_SIZE * 0.5)
    const frameGeo  = new THREE.TubeGeometry(framePath, 128, FRAME_TUBE_R, 8, true)

    // Frame colour: neutral dark base with strong star-tinted emissive
    const frameBase = lerpColor(new THREE.Color(0x0a0f1a), starColor, 0.25)
    this._frameMat  = new THREE.MeshStandardMaterial({
      color:             frameBase,
      emissive:          starColor,
      emissiveIntensity: 0.85,
      metalness:         0.80,
      roughness:         0.18,
    })
    this._group.add(new THREE.Mesh(frameGeo, this._frameMat))

    // Corner accent spheres — subtle jewel points at each corner
    const cornerPositions = [
      [-FRAME_SIZE * 0.5, -FRAME_SIZE * 0.5, 0],
      [ FRAME_SIZE * 0.5, -FRAME_SIZE * 0.5, 0],
      [ FRAME_SIZE * 0.5,  FRAME_SIZE * 0.5, 0],
      [-FRAME_SIZE * 0.5,  FRAME_SIZE * 0.5, 0],
    ] as const

    const cornerGeo = new THREE.SphereGeometry(FRAME_TUBE_R * 1.35, 8, 8)
    for (const [cx, cy, cz] of cornerPositions) {
      const m = new THREE.Mesh(cornerGeo, this._frameMat)
      m.position.set(cx, cy, cz)
      this._group.add(m)
    }

    // ── Background glow sprite ────────────────────────────────────────────────
    // Additive sprite sitting behind the portal; gives it a warm ambient halo
    const glowTex = buildGlowTexture(lerpColor(starColor, baseColor, 0.4))
    const glowMat = new THREE.SpriteMaterial({
      map:         glowTex,
      color:       lerpColor(starColor, baseColor, 0.3),
      opacity:     0.22,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
      transparent: true,
    })
    const glow = new THREE.Sprite(glowMat)
    glow.scale.set(FRAME_SIZE * 1.85, FRAME_SIZE * 1.85, 1)
    glow.renderOrder = 0
    this._group.add(glow)

    _scene.add(this._group)
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Call once per frame from the parent's animation loop.
   * @param elapsed    Total elapsed seconds since scene start
   * @param dt         Delta-time seconds (for smooth hover interpolation)
   * @param planetPos  Current world-space position of the parent planet
   */
  update(elapsed: number, dt: number, planetPos: THREE.Vector3): void {
    // Orbit: circum-polar trajectory tilted by inclination from equatorial plane
    const angle = elapsed / PORTAL_PERIOD * Math.PI * 2 + this._orbitAngle
    const inc   = THREE.MathUtils.degToRad(this._inclination)
    const r     = this._orbitRadius

    this._group.position.set(
      planetPos.x + r * Math.cos(angle),
      planetPos.y + r * Math.sin(angle) * Math.sin(inc),
      planetPos.z + r * Math.sin(angle) * Math.cos(inc),
    )

    // Always face camera (full billboard — portal looks "open" from any angle)
    this._group.lookAt(this._camera.position)

    // ── Uniform updates ───────────────────────────────────────────────────────
    const u = this._waterMat.uniforms

    u['uTime']!.value     = elapsed
    u['uEntering']!.value = this._entering

    // Smooth hover transition (exponential lerp — ~8 frames to settle)
    this._hoveredT += ((this._hovered ? 1.0 : 0.0) - this._hoveredT) * Math.min(1, dt * 10)
    u['uHovered']!.value = this._hoveredT

    // Frame emissive glows brighter on hover and entering
    this._frameMat.emissiveIntensity = 0.85 + this._hoveredT * 1.35 + this._entering * 2.20

    // Glow sprite opacity breathes gently, stronger on hover
    const glowSprite = this._group.children.find(c => c instanceof THREE.Sprite) as THREE.Sprite | undefined
    if (glowSprite) {
      const mat = glowSprite.material as THREE.SpriteMaterial
      mat.opacity = (0.18 + 0.12 * Math.sin(elapsed * 1.1)) * (1 + this._hoveredT * 0.8)
    }
  }

  /**
   * Test the raycaster against the water surface.
   * Call this in the parent's mousemove handler.
   * Returns true if the portal is currently hovered.
   */
  checkHover(raycaster: THREE.Raycaster): boolean {
    // Intersect against the first child (the water mesh)
    const water = this._group.children[0] as THREE.Mesh | undefined
    if (!water) return false
    const hits      = raycaster.intersectObject(water, false)
    const nowHover  = hits.length > 0
    if (nowHover !== this._hovered) {
      this._hovered = nowHover
      this._onHoverChange?.(nowHover)
    }
    return nowHover
  }

  /**
   * Drive the approach animation from the parent.
   * t runs from 0 (far away) to 1 (crossing the plane).
   * At t ≥ 0.95 the 'enter' callback fires once.
   */
  setEntering(t: number): void {
    const prev       = this._entering
    this._entering   = Math.max(0, Math.min(1, t))
    if (prev < 0.95 && this._entering >= 0.95) {
      this._onEnter?.()
    }
  }

  /** World-space centre of the portal (for camera tween targeting). */
  getWorldPosition(): THREE.Vector3 {
    return this._group.position.clone()
  }

  /** The THREE.Group, in case the parent needs it for raycaster skip-lists, etc. */
  get group(): THREE.Group { return this._group }

  /** Register the callback fired once when entering completes (t ≥ 0.95). */
  onEnter(cb: () => void):                    void { this._onEnter       = cb }
  onHoverChange(cb: (v: boolean) => void):    void { this._onHoverChange = cb }

  /** Dispose all GPU resources and remove from scene. Must be called in teardown. */
  dispose(): void {
    this._scene.remove(this._group)

    this._group.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
        if (obj instanceof THREE.Mesh) obj.geometry?.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) {
          if (!m) continue
          if (m instanceof THREE.SpriteMaterial) m.map?.dispose()
          m.dispose()
        }
      }
    })
  }
}
