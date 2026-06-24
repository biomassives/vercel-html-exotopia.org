/**
 * void-shader.ts
 *
 * Shared GLSL shaders for the cosmic-void membrane used in CosmicPage and
 * CosmosPage.  Both pages import these strings and build a THREE.ShaderMaterial.
 *
 * Physics basis — Hamaus et al. 2014 (arXiv:1403.5499):
 *   δ(r)/δ̄ − 1 = δ_c · [1 − (r/r_s)^α] / [1 + (r/r_v)^β]
 *
 *   On the shell sphere (r ≈ r_v), the viewing-angle determines the projected
 *   line-of-sight depth through the compensation wall:
 *     cosA → 0  (tangential view):  line cuts deep into the dense wall  → bright
 *     cosA → 1  (face-on view):     line cuts through the empty interior → dim
 *
 *   sinA = √(1 − cosA²) acts as a proxy for the integrated column density.
 *   A Gaussian peak at sinA ≈ 0.92 captures the HSW compensation-wall ring
 *   that peaks just outside r_v.
 *
 * Design intent:
 *   Voids should read as ghostly, almost-invisible empty bubbles.
 *   The surface emerges from the density gradient only — not from strong
 *   colour animation or mouse reactivity.  Max alpha ≈ 0.18 with additive
 *   blending keeps the membrane transparent at all viewing angles.
 *
 * Uniforms required per ShaderMaterial:
 *   uTime       float   — seconds, used for extremely slow drift
 *   uColor      vec3    — primary hue (THREE.Color)
 *   uColor2     vec3    — complementary hue
 *   uPointer    vec2    — NDC cursor pos (default 0,0)
 *   uPointerStr float   — interaction strength 0–1 (default 0)
 */

export const VOID_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vObjPos;
  varying vec2 vScreenPos;

  void main() {
    vNormal    = normalize(normalMatrix * normal);
    vObjPos    = position;
    vec4 mv    = modelViewMatrix * vec4(position, 1.0);
    vViewDir   = normalize(-mv.xyz);
    vec4 clip  = projectionMatrix * mv;
    vScreenPos = clip.xy / clip.w;   /* NDC [-1,1] for pointer distance */
    gl_Position = clip;
  }
`

export const VOID_FRAG = /* glsl */`
  uniform float uTime;
  uniform vec3  uColor;
  uniform vec3  uColor2;
  uniform vec2  uPointer;
  uniform float uPointerStr;

  varying vec3  vNormal;
  varying vec3  vViewDir;
  varying vec3  vObjPos;
  varying vec2  vScreenPos;

  void main() {

    /* Fresnel angle */
    float cosA = abs(dot(vNormal, vViewDir));
    float sinA = sqrt(max(0.0, 1.0 - cosA * cosA));

    /* Hamaus HSW wall density proxy
       wallRamp: empty interior -> dense wall gradient
       wallRing: sharp compensation-wall peak at r ~ r_v (sinA ~ 0.92) */
    float wallRamp = smoothstep(0.10, 0.85, sinA);
    float wallRing = exp(-10.0 * (sinA - 0.92) * (sinA - 0.92));
    float hsw      = wallRamp * 0.55 + wallRing * 0.45;

    /* Extremely slow single-frequency drift — barely perceptible colour shift */
    float drift = sin(vObjPos.x * 1.6 + uTime * 0.05) * 0.5 + 0.5;

    /* Minimal iridescence at grazing angles only */
    float iri = pow(max(0.0, 1.0 - cosA), 0.6) * 0.08;

    vec3 col = mix(uColor, uColor2, clamp(drift * 0.18 + iri, 0.0, 1.0));

    /* Faint wall-ring brightening — compensation wall has marginally more starlight */
    col = mix(col, col + vec3(0.04), wallRing * 0.16);

    /* Micro sparkle — very faint, wall zone only */
    float sp = sin(vObjPos.x * 22.0 + uTime * 2.2)
             * sin(vObjPos.z * 18.0 + uTime * 1.8) * 0.5 + 0.5;
    sp = pow(sp, 7.0) * 0.04 * wallRamp;

    /* Minimal pointer response */
    float pDist   = length(vScreenPos - uPointer);
    float ripple  = sin(pDist * 13.0 - uTime * 4.0)
                  * exp(-pDist * 3.5)
                  * uPointerStr * 0.20;
    float hotspot = exp(-pDist * pDist * 7.0) * uPointerStr * 0.10;

    col += uColor * max(0.0, ripple) * 0.15;
    col += vec3(hotspot * 0.08);
    col  = clamp(col, 0.0, 1.0);

    /* Final alpha: very low; surface emerges from density gradient only.
       Max ~0.18 with additive blending keeps voids ghostly at all angles. */
    float alpha = hsw      * 0.17
                + wallRing * 0.07
                + sp       * 0.03
                + abs(ripple) * 0.05
                + hotspot  * 0.03;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.18));
  }
`
