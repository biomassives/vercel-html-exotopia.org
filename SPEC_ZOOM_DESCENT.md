# SPEC: Smooth Zoom Descent — Cosmic Entry to Surface via Local Step Portal

**Status:** Proposed  
**Date:** 2026-06-29  
**Scope:** Camera continuity across the five-level hierarchy, local step portal object, surface-entry light inversion  
**Relates to:** SPEC_COSMOS_ENTRY.md, SPEC_CELESTIAL_REVEAL.md, SPEC_DEFENDERNAV.md, SPEC_STARSYSTEM_ALGORITHM.md  
**Files touched:** `CosmicPage.vue`, `ClusterGalaxyPage.vue`, `ClusterSystemPage.vue`, `ClusterSurfacePage.vue`, `SurfaceViewPage.vue`, `WormholePortal.vue`, `stores/portal.ts`, `stores/scene-transition.ts`, `lib/spatial-scopes.ts`

---

## 1. Motivation

The navigable hierarchy is functional but not smooth. Each level boundary is currently a hard route change: the user clicks a button, the WormholePortal fires its 7-second transit, the next page loads. There is no sense of continuous descent. The visual vocabulary of the portal (wormhole, branching mycelium, E8 mandala) is gorgeous for long-haul inter-cluster jumps but is overweight for the "zoom into this star system" action.

This spec defines:

1. **In-page camera zooms** for transitions within the same 3D scene scope that don't require a page change (cosmic → cluster sphere, cluster → galaxy node).
2. **Lightweight descent transitions** for level crossings that do change pages (galaxy → system → planet), using an existing but underused `'iris'` mode in `scene-transition.ts` — not the full WormholePortal.
3. **The Local Step Portal** — a physical 3D object in circum-polar orbit around any settled planet or exomoon settlement, which the user flies toward and passes through to enter the surface. This replaces the current "Descend to surface" button for settled worlds.
4. **Light inversion** — the visual event as the camera crosses the portal plane.
5. **Failover rules** at every step, so the descent never dead-ends.

---

## 2. The Five-Level Descent Chain

```
L1  CosmicPage (/)
     │  in-page zoom + click cluster sphere
     ▼
L2  ClusterInteriorPage (/cluster-interior/:slug)
     │  in-page zoom + click galaxy node
     ▼
L3  ClusterGalaxyPage (/cluster-galaxy/:slug/:memberId)
     │  iris wipe + click star system
     ▼
L4  ClusterSystemPage (/cluster-system/:slug/:memberId/:sysIdx)
     │  approach camera → Local Step Portal if settled; iris wipe if not
     ▼
L5  ClusterSurfacePage / SurfaceViewPage
```

For the Milky Way path (GalaxyPage → system → SurfaceViewPage) the same chain applies with `galaxy` substituted for `cluster-interior` / `cluster-galaxy`.

---

## 3. Transition Vocabulary

Three distinct visual modes are used. The vocabulary communicates _scale_ of the jump:

| Jump | Mode | Duration | When it fires |
|------|------|----------|---------------|
| Same scene, camera moves | **Continuous zoom** | 1.2–2.5 s | In-page camera fly-to (Three.js TWEEN) |
| Same scene scope, data changes | **Iris wipe** (`scene-transition.ts` `'iris'`) | 380 ms | Route change within same visual register |
| Cross-level route change | **Iris wipe** | 380 ms | Galaxy → system, system → surface (non-settled) |
| Portal step (settled planet) | **Light inversion** | 600 ms | User flies through the Local Step Portal object |
| Long-haul jump | **WormholePortal** | 7 s | Intentional inter-cluster or inter-galaxy transit |

**Rule:** never fire WormholePortal for a zoom-descent step. Portal is reserved for lateral jumps across distances, not the downward path.

---

## 4. In-Page Camera Zooms (L1 → L2, L2 → L3)

### 4.1 CosmicPage → Cluster Interior (L1 → L2)

Currently: clicking a cluster sphere fires `router.push('/cluster-interior/:slug')` with a short fade. This should become an in-page zoom-in _first_, then the route change fires once the camera has committed.

**Target behavior:**
1. User clicks cluster sphere.
2. CosmicPage camera TWEENs toward the clicked cluster center. Duration 1.4 s, easing `TWEEN.Easing.Quadratic.InOut`.
3. When camera reaches a "fill threshold" (cluster fills ~80% of viewport), fire `router.push('/cluster-interior/:slug')` under an iris wipe that matches the camera's current position on screen.
4. ClusterInteriorPage starts with camera offset to match where CosmicPage left off (see §4.3 on bearing handoff).

**Failover:** if the cluster slug has no member catalog, fall through to `/xcluster/:xid` for X-ray clusters, or show `"No member data — cluster catalog pending"` panel with coordinates visible.

### 4.2 ClusterInteriorPage → ClusterGalaxyPage (L2 → L3)

**Target behavior:**
1. User clicks galaxy node. Node pulses with a radial glow (0.18 s).
2. Camera TWEENs toward the node. Duration 0.9 s.
3. Iris wipe fires from the center of the galaxy node (viewport-fraction `ox/oy` = node's screen coords / W,H). Route changes under the black frame.
4. ClusterGalaxyPage mounts with camera pulled back at a `bearing` matching the inbound direction.

**Failover:** if the galaxy node has no `memberId` resolvable to a member catalog entry, push `/xcluster/:xid` seeded by the node's numeric id.

### 4.3 Bearing handoff

`useSceneTransitionStore` already has a `bearing` field. The departing page writes:
```typescript
await sceneTransitionStore.depart(ox, oy, 'iris', inboundBearing)
```
The arriving page reads `sceneTransitionStore.bearing` in `onMounted` to set its initial camera approach angle. This gives spatial coherence — you always arrive from the same direction you left.

---

## 5. Descent Transitions (L3 → L4, L4 → L5 without portal)

### 5.1 ClusterGalaxyPage → ClusterSystemPage (L3 → L4)

Already routed via the "Enter system" button in the selected-system panel. Make this use the iris wipe:

```typescript
async function descendToSurface(sys: GalaxySystem) {
  const rect   = canvasEl.value!.getBoundingClientRect()
  const screen = systemScreenPos(sys)   // project 3D → 2D on this frame
  const ox     = (screen.x / rect.width)  * 100
  const oy     = (screen.y / rect.height) * 100
  await sceneTransitionStore.depart(ox, oy, 'iris')
  router.push(`/cluster-system/${clusterSlug}/${memberId}/${sys.idx}`)
}
```

ClusterSystemPage on mount: if `sceneTransitionStore.phase === 'black'`, call `signalArriving()`.

**Failover:** if `systemIdx` has no star data, generate a deterministic system from `hostnameToSeed(memberId + systemIdx)` — same approach as ClusterSurfacePage already uses.

### 5.2 ClusterSystemPage → Surface (L4 → L5) — no settlement

For planets that are **not settled**, the existing "Descend to surface" button fires an iris wipe to `/cluster-surface/:slug/:memberId/:sysIdx` (or `/surface/:hostname/:planet` for NASA planets). No change from current behavior except ensuring the iris origin is centered on the selected planet's screen position.

---

## 6. The Local Step Portal

For planets with an active settlement, a new **Local Step Portal** object replaces the "Descend to surface" button as the primary entry mechanic.

### 6.1 What it is

A square portal frame — roughly 14×14 scene units — in a **circum-polar orbit** of the settled planet. "Circum-polar" means the orbital plane is tilted ~70–85° from the planet's equatorial plane, so the orbit passes close to both rotational poles on each pass. This keeps it visible from a wide range of approach angles (unlike an equatorial orbit which would be edge-on from many viewpoints) and is narratively resonant with polar-orbit communications and science satellites.

The portal is a persistent 3D mesh rendered in ClusterSystemPage (and in the analogous SurfaceViewPage orbit view) whenever `planet.settlement_tier !== null`.

### 6.2 Geometry

```
PortalFrame mesh
  ├─ outer ring: square toroid, side 14 su, tube r 0.55 su
  │    material: MeshStandardMaterial, emissive tinted by star spectral color
  ├─ inner plane: PlaneGeometry 13×13 su
  │    material: ShaderMaterial (portal-gate.glsl, see §6.5)
  └─ light halo: SpriteMaterial, additive blend, tinted same as inner plane
```

The frame is an `Object3D` group parented to the planet's orbit group. It rotates on its own orbit cycle (period = 0.18 × planet's orbital period, clamped to 2–18 s per in-scene revolution).

Pole tilt: `inclination = 72 + seededUnit(settlementSeed) * 13` degrees from equatorial.

### 6.3 Portal inner plane shader (portal-gate.glsl)

```glsl
// portal-gate.glsl — inner surface of the Local Step Portal
uniform float uTime;
uniform vec3  uStarColor;   // host star spectral color
uniform float uHovered;     // 0.0 | 1.0
uniform float uEntering;    // 0 → 1 during approach

varying vec2 vUv;

void main() {
  vec2 uv  = vUv - 0.5;                // centre at 0,0
  float r  = length(uv);
  float a  = atan(uv.y, uv.x);

  // Slow mandala-like ripple
  float ripple = sin(r * 12.0 - uTime * 1.4) * 0.5 + 0.5;
  float spiral = sin(a * 4.0 + r * 8.0 - uTime * 0.7) * 0.5 + 0.5;

  // Edge vignette so frame remains visible
  float edge = smoothstep(0.48, 0.38, r);

  vec3  col  = mix(vec3(0.02, 0.05, 0.12), uStarColor * 0.6, spiral * ripple);
  float glow = mix(0.07, 0.28, uHovered) * edge;

  // Entering flash: interior brightens to white just before inversion
  col  = mix(col,  vec3(1.0),   uEntering * uEntering * 0.85);
  glow = mix(glow, 1.0, uEntering * 0.8);

  gl_FragColor = vec4(col, glow);
}
```

`uEntering` is driven by a reactive ref in ClusterSystemPage that ramps 0→1 over 0.5 s when the camera crosses inside a 30-su radius of the portal center.

### 6.4 Circum-polar orbit motion

Each frame in the system orrery loop:

```typescript
const portalAngle = (elapsedMs / portalPeriodMs) * Math.PI * 2
const inc = THREE.MathUtils.degToRad(portal.inclination)

// Orbital circle in the tilted plane
portalGroup.position.set(
  planet.orbitRadius * Math.cos(portalAngle),
  planet.orbitRadius * 0.18 * Math.sin(portalAngle) * Math.sin(inc),
  planet.orbitRadius * 0.18 * Math.sin(portalAngle) * Math.cos(inc),
)

// Frame always faces the camera (billboard except yaw)
portalGroup.lookAt(camera.position)
```

The `0.18` factor keeps the portal close to the planet (not at the same distance as the planet's orbit). Approximately 18% of the semi-major axis above the planet — within the Hill sphere but far enough to see from the system view.

### 6.5 Hover interaction

In the system orrery raycaster:
- Hover over portal inner plane → `uHovered = 1.0`, frame emissive intensity ×3, label "STEP THROUGH" fades in below frame.
- Click → begin approach sequence (§6.6).

### 6.6 Approach and entry sequence

**Step 1 — Approach**  
Camera TWEENs toward the portal center, approaching along the normal to the frame face. Duration 1.8 s, easing `TWEEN.Easing.Sinusoidal.InOut`. `uEntering` ramps from 0 to 0.9 across this duration.

**Step 2 — Plane crossing**  
At the moment the camera's z-depth (in portal-local space) crosses zero (camera is at the portal plane), fire the light inversion (§7). Duration 0.55 s.

**Step 3 — Route change**  
Under the inversion cover, `router.push('/cluster-surface/...')` (or `/surface/...`). The arriving page mounts with the `'surface'` scope preset — camera at `{ x:0, y:4, z:130 }` looking at the settlement dome.

---

## 7. Light Inversion

The portal crossing is the _only_ place in the app where a full-screen inversion fires. It should feel like passing through a membrane — a moment of photographic negative before the new world arrives.

### 7.1 Implementation — canvas overlay with mix-blend-mode

`SceneTransition.vue` is already a 2D canvas (z-index 9998) teleported to `<body>` above the WebGL canvas. The inversion effect is drawn on that 2D canvas using `mix-blend-mode: difference`, not via a CSS filter on the WebGL canvas (which would force GPU texture readback and is much slower).

**How it works physically:** A `<canvas>` element with CSS `mix-blend-mode: difference` and `background: transparent` paints a white rect on top of everything. The browser compositor performs per-pixel `|dst − src|`, which for white src `(255,255,255)` produces the exact inverse of each destination pixel. The WebGL canvas, UI panels, and all DOM layers are inverted simultaneously without ever touching the WebGL context.

Add to `scene-transition.ts`:
```typescript
export type TransitionMode = 'lightning' | 'spirograph' | 'iris' | 'inversion'

// In depart():
const dur = m === 'inversion' ? 550 : m === 'spirograph' ? 1500 : m === 'lightning' ? 900 : 380
```

Add to `SceneTransition.vue`:

```typescript
// In the phase watcher, add the new branch:
if (st.mode === 'inversion') runLoop('depart-inversion')
```

```typescript
// drawInversionFrame — called each rAF tick during the 550 ms departure
function drawInversionFrame(ctx: CanvasRenderingContext2D, W: number, H: number, elapsed: number) {
  ctx.clearRect(0, 0, W, H)
  // 0–180ms: ramp up to full white (the inversion peak)
  // 180–380ms: hold at full white
  // 380–550ms: fade to black (covers the route change)
  let alpha: number
  if      (elapsed < 180)  alpha = elapsed / 180
  else if (elapsed < 380)  alpha = 1.0
  else                     alpha = Math.max(0, 1 - (elapsed - 380) / 170)

  ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
  ctx.fillRect(0, 0, W, H)
}
```

```css
/* in SceneTransition.vue <style scoped> — add blend mode when in inversion phase */
.st-canvas.st-inversion {
  mix-blend-mode: difference;
}
```

The `.st-inversion` class is toggled on `.st-canvas` when `st.mode === 'inversion'` and `st.phase === 'departing'`.

### 7.2 Trigger

Portal entry in ClusterSystemPage:
```typescript
async function stepThroughPortal() {
  // camera TWEEN to portal plane runs in parallel (1.8 s, handled by LocalStepPortal approach sequence)
  await sceneTransitionStore.depart(50, 50, 'inversion', Math.PI)
  router.push(surfaceRoute)
}
```

The `bearing = Math.PI` signals to SurfaceViewPage that the camera should start high (the `'surface:orbit'` preset) and descend to `'surface'` over 1.2 s — as if arriving from above through the portal.

---

## 8. Failover Map

Every step has an explicit fallback so the descent never dead-ends.

| Step | Happy path | Fallback A | Fallback B |
|------|-----------|-----------|-----------|
| CosmicPage → cluster | `/cluster-interior/:slug` | `/xcluster/:xid` | Show "cluster catalog pending" panel with RA/Dec |
| ClusterInteriorPage → galaxy | `/cluster-galaxy/:slug/:memberId` | Procedural galaxy seeded by node id | Dead-end blocked — X-ray cluster always has memberId |
| ClusterGalaxyPage → system | `/cluster-system/:slug/:memberId/:sysIdx` | Deterministic system from seed | Show "no stellar data" panel |
| ClusterSystemPage → surface (settled) | Portal step → `/cluster-surface/...` | Settlement lost → iris wipe to same surface | Surface data missing → generate from seed |
| ClusterSystemPage → surface (unsettled) | Iris wipe → `/cluster-surface/...` | Same | Generate from seed |
| SurfaceViewPage portal (moon) | Portal step → `/surface/:host/:planet?parent=...` | Show "sub-lunar not mapped" message per existing `canGoMoon` check | — |

### 8.1 Settlement detection failover

`ClusterSystemPage` determines "settled" by checking `planet.settlement_tier !== null`. If the NFT settlement data can't be fetched (wallet disconnected, API timeout), default to **unsettled** (iris wipe, no portal rendered). Portal is a privilege of confirmed settlement ownership. Never block descent for missing NFT data.

### 8.2 Data loading failover

Portal orbit radius and inclination derive from `planet.semi_major_au` and `hostnameToSeed(memberId + sysIdx)`. If the planet has no `semi_major_au`, use `fallbackAU(planetIndex, totalPlanets)` from `three-utils.ts` — same approach as the orrery already uses.

### 8.3 Three.js WebGL context loss

If the WebGL context is lost mid-approach (rare but possible on mobile), abort the portal approach, fall back to the iris wipe to the surface route.

```typescript
renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault()
  cancelApproach()
  sceneTransitionStore.depart(50, 50, 'iris')
  router.push(surfaceRoute)
})
```

---

## 9. The Exomoon Portal Variant

Settlements on exomoons (coordinate system `exo-moon-surface-v1`) get the same portal treatment, but the portal orbits the **moon** (at 18% of the moon's estimated Hill sphere radius), not the parent planet.

The moon itself must first be visible in the system view. Since moons are not currently rendered in ClusterSystemPage (only planets are), this requires a prerequisite:

- If `planet.settlement_tier` is `'moon'` or similar, render a small secondary body orbiting the planet dot.
- The portal then orbits this secondary body.
- Clicking the planet dot zooms to the moon dot; then the portal is there.

Moon orbit radius for display: `planet.orbitRadius * 0.08` — tight to the planet, sub-pixel at system scale unless selected.

**Failover:** if moon rendering is not yet implemented, fall back to planet-surface portal with `?parent=PlanetName` param as the existing `goMoon` button uses.

---

## 10. State Flow Diagram

```
CosmicPage
  onClick(cluster) ──► camera TWEEN → clusterFill ──► iris wipe
                                                          │
                                              ClusterInteriorPage
                                                onClick(galaxy) ──► camera TWEEN → iris wipe
                                                                                      │
                                                                          ClusterGalaxyPage
                                                                           onClick(system) ──► iris wipe
                                                                                                  │
                                                                                      ClusterSystemPage
                                                                                    ┌─── settled? ───┐
                                                                                    │                │
                                                                                 portal approach   iris wipe
                                                                                 uEntering 0→1      │
                                                                                 plane cross         │
                                                                                 inversion flash     │
                                                                                    └────────────────┘
                                                                                              │
                                                                                   SurfaceViewPage / ClusterSurfacePage
                                                                                   camera: 'surface:orbit' → 'surface'
```

---

## 11. LocalStepPortal — Implementation

**Implemented as a plain TypeScript class** (`src/lib/local-step-portal.ts`), not a Vue component. This matches the pattern used by other Three.js helpers (`three-utils.ts`) and avoids the complexity of passing scene/camera refs through Vue props. ClusterSystemPage instantiates it directly inside `buildScene()` and calls `portal.update()` each frame inside `tick()`.

```typescript
// Instantiation (inside buildScene())
import { LocalStepPortal } from 'src/lib/local-step-portal'

const portal = new LocalStepPortal(
  scene, camera,
  {
    eqTempK:     p.eq_temp_k,
    gravityMs2:  null,          // use Earth default until gravity data available
    atmPressure: null,
    starHex:     starColor,
  },
  orbitRadius,   // 18% of planet's orbit radius (auToSu(p.semi_major_au) * 0.18)
  72 + seededUnit(seed) * 13,   // inclination in degrees
  seed,
)

portal.onEnter(stepThroughPortal)
portal.onHoverChange(h => { canvasEl.value!.style.cursor = h ? 'crosshair' : 'default' })

// In tick():
portal.update(elapsed, dt, planetMesh.position)

// In onCanvasMove():
portal.checkHover(raycaster)

// In teardown():
portal.dispose()
```

**Water shader physics** (`portal-gate.glsl` replaced by the inline shaders in `local-step-portal.ts`):
- 4 primary Gerstner ocean swell trains + 4 capillary detail trains + 1 standing-wave interference term
- Gerstner dispersion relation: ω = √(g·k) with `uGNorm = g/9.8` and `uWaveSpeed = √(g/g_earth)`
- Wave amplitude: `0.006 + log₁₊(atm) × 0.036` — thin atm ≈ glassy (0.006 su), Venus-dense ≈ heavy swells (0.065 su)
- Fragment: Fresnel (Schlick F₀=0.02) + depth colour + subsurface luminescence + two-layer caustic trig overlay + foam at crests + specular highlight from synthetic star direction + centre radial pulse + rim glow where water meets frame

---

## 12. Scope Preset Changes

Add two new entries to `SCOPE_PRESETS` in `spatial-scopes.ts`:

```typescript
// Portal approach: high above, looking down — used as the arriving camera for portal entry
'surface:portal-approach': { x: 0, y: 320, z: 20, tx: 0, ty: 0, tz: 0, fov: 50 },

// The same as 'surface:orbit' but distinguished for animation sequencing
// (SurfaceViewPage checks for this scope to auto-tween to 'surface')
```

`SurfaceViewPage` and `ClusterSurfacePage` on mount:
```typescript
const at = route.query.at as string | undefined
if (at === 'surface:portal-approach') {
  // start at orbit, then auto-tween to surface in 1.6s
  setCameraImmediate(SCOPE_PRESETS['surface:orbit']!)
  setTimeout(() => flyToScope('surface'), 600)
}
```

---

## 13. Implementation Order

### Sprint 1 — Iris wipes on all descent steps
- [ ] Add `ox/oy` screen-position calculation to ClusterGalaxyPage `descendToSurface()`
- [ ] Add `signalArriving()` call in ClusterSystemPage `onMounted` (check if phase is `'black'`)
- [ ] Ensure iris wipe fires from planet screen position in ClusterSystemPage
- [ ] Test full chain: Cosmic → cluster → galaxy → system → surface (no portal yet)

### Sprint 2 — LocalStepPortal geometry and shader
- [ ] Write `portal-gate.glsl` (§6.5)
- [ ] Write `LocalStepPortal.vue` (§11) — geometry, orbit, shader uniforms
- [ ] Integrate into ClusterSystemPage: show portal when `planet.settlement_tier !== null`
- [ ] Hover label, raycaster interaction
- [ ] Test orbit motion and billboard facing

### Sprint 3 — Approach and inversion
- [ ] Camera TWEEN approach sequence (§6.6, Step 1)
- [ ] `uEntering` ramp logic (0→0.9 over approach, 0.9→1.0 at plane cross)
- [ ] Add `'inversion'` mode to `scene-transition.ts` and `SceneTransition.vue`
- [ ] Wire `stepThroughPortal()`: approach tween → inversion → route push
- [ ] `surface:portal-approach` scope + auto-tween on SurfaceViewPage mount

### Sprint 4 — Bearing handoff and in-page zooms
- [ ] CosmicPage: TWEEN to cluster sphere before iris wipe; pass bearing to `depart()`
- [ ] ClusterInteriorPage: TWEEN to galaxy node before iris wipe
- [ ] ClusterGalaxyPage: use bearing from `sceneTransitionStore.bearing` for initial camera angle
- [ ] ClusterSystemPage: same

### Sprint 5 — Exomoon portal variant
- [ ] Add moon secondary body rendering to ClusterSystemPage (small dot, parent-relative orbit)
- [ ] `LocalStepPortal` receives optional `moonData` prop; orbits moon when present
- [ ] `?parent=` param passthrough to SurfaceViewPage

### Sprint 6 — Polish and failover hardening
- [ ] WebGL context-loss guard (§8.3)
- [ ] Settlement detection failover (§8.1)
- [ ] Test on mobile (portal approach tween, inversion filter performance)
- [ ] Audit all dead-end paths per §8 failover map

---

## 14. Open Questions and Resolutions

---

### Q1 — In-page zoom vs route change: the shared-renderer architectural split  
**Status: expanded for team discussion**

**What `useVizRenderer` actually is.**  
`useVizRenderer` is a module-scope singleton (`src/composables/useVizRenderer.ts`). The `THREE.WebGLRenderer`, `THREE.Scene`, `THREE.PerspectiveCamera`, and `OrbitControls` are allocated once at module import time and survive all Vue component lifecycle transitions and route changes. Each page registers per-frame callbacks via `addTick(fn)` and disposes them on unmount. The camera is exposed directly as `viz.camera` and can be TWEEN'd by any page that calls `useVizRenderer()`.

**Which pages currently use the shared renderer and which don't.**

| Page | Renderer | Notes |
|------|----------|-------|
| `CosmicPage` | **Shared** (`useVizRenderer`) | Confirmed — uses `addTick`, `viz.camera`, `viz.scene` |
| `CosmosPage` | **Shared** | Same composable |
| `ClusterInteriorPage` | **Private** (own `<canvas>`) | Has its own `THREE.WebGLRenderer` |
| `ClusterGalaxyPage` | **Private** | Has `<canvas ref="canvasEl">` + own renderer |
| `ClusterSystemPage` | **Private** | Confirmed from source |
| `ClusterSurfacePage` | **Private** | Confirmed from source |
| `SurfaceViewPage` | **Private** | Confirmed from source |

**What this means for the in-page zoom proposal.**

L1 (CosmicPage) uses the shared camera. To TWEEN it, just:
```typescript
const viz = useVizRenderer()
gsap.to(viz.camera!.position, { x, y, z, duration: 1.4, onUpdate: () => viz.controls!.update() })
```
No API wrapping needed — the camera is directly accessible.

The hard split is at **L1 → L2** (CosmicPage → ClusterInteriorPage). ClusterInteriorPage starts a new private WebGL context. This is the first point where a visual gap exists regardless of how smooth the departure TWEEN is. The iris wipe covers it.

**Two architectural paths to discuss:**

**Path A — Accept the current split (recommended for now)**  
Keep every page below CosmicPage with its own renderer. The L1 camera TWEEN completes, iris wipe fires, ClusterInteriorPage loads with a new context. ClusterInteriorPage reads `sceneTransitionStore.bearing` on mount to set initial camera angle so the spatial handoff feels coherent. The user will notice one visual cut per level. This is the minimum-risk path.

**Path B — Migrate ClusterInteriorPage and ClusterGalaxyPage to the shared renderer**  
Both pages would remove their private `<canvas>` elements and instead add pageGroups to the shared scene, registering their content via `addTick`. The camera (and its controls) remain the singleton camera. Navigating L1→L2→L3 becomes pure in-scene TWEEN: the camera zooms in continuously without any visual break. The iris wipe only fires at L3→L4 (entering ClusterSystemPage, which must keep its own renderer because it has a completely different scene structure and far-plane setup).

Path B requires:
1. Auditing ClusterInteriorPage and ClusterGalaxyPage for all direct `renderer.` / `scene.` / `camera.` references (≈40–60 call sites each)
2. Converting `<canvas ref="canvasEl">` to `viz.canvas` for event listeners
3. Ensuring `disposeScene(pageGroup)` + `scene.remove(pageGroup)` on unmount (instead of `renderer.dispose()`)
4. Shared camera near/far clamp must cover both cosmic and galaxy-interior distances — currently `{ near: 0.01, far: 400 }` which may be too tight for cosmic view and too loose for galaxy-interior detail

The payoff: the descent from Cosmic → Cluster → Galaxy interior becomes one continuous zooming camera move with no cuts. This is the "grand vista approach" the spec calls for.

**Recommendation for team discussion:**  
Agree on whether v1 will attempt Path B for ClusterInteriorPage alone (leaving ClusterGalaxyPage as private for now), or defer both to a post-Sprint 1 milestone. Path A is shippable immediately. Path B for ClusterInteriorPage alone is a 1–2 day migration with clear scope.

---

### Q2 — Portal visibility: local zoom emergence from vanishing point  
**Status: resolved**

The portal is intentionally invisible at full-system-field-of-view. It only appears when the camera has zoomed close enough to the selected planet that the planet itself begins to fill a significant portion of the viewport. The portal then **emerges from the vanishing point** — first as a pixel-scale bright point (the frame emissive glow), then resolving into the square frame and water surface as the camera continues toward it.

This is the correct interaction design:
- The system view shows planets as tiny spheres in a wide orrery. No portal clutters this view.
- The user selects a settled planet (it highlights, panel expands with "Step Through Portal" CTA).
- The "Step Through Portal" button in the side panel initiates the camera approach tween.
- As the planet fills view, the portal emerges on its own — no LOD switch, no billboard, no mode change. The portal is simply rendered at correct scale and becomes naturally visible as the camera gets close.
- The zoom distance at which the portal becomes comfortably clickable (≥ 10 px radius) can be derived: portal half-width = 7 su, camera distance ≈ 2–4 su, so at the end of the tween it fills a large fraction of the viewport.

**Implementation:** no additional LOD code needed. `LocalStepPortal` renders at correct scene scale at all times. The approach tween is the "zoom the user to vanishing point emergence" mechanism. The panel CTA provides the UI entry point at system scale.

The background glow sprite (additive, `FRAME_SIZE * 1.85` in scale) ensures the portal is a visible ambient presence when the camera is still far, without making the portal frame itself clickable at that distance.

---

### Q3 — Inversion effect: implementation clarification  
**Status: redefined in light of SceneTransition.vue architecture**

The original framing (CSS `filter: invert()` on the WebGL canvas) was incorrect and would be slow. The actual architecture:

`SceneTransition.vue` already manages a **separate full-viewport 2D canvas** (`z-index: 9998`, pointer-events: none, teleported to `<body>`). This canvas overlays the WebGL canvas and all DOM elements. All existing transition effects (lightning, spirograph, iris) are painted on this 2D canvas using the `CanvasRenderingContext2D` API.

The inversion effect (`'inversion'` mode) uses this same canvas with **CSS `mix-blend-mode: difference`** applied to the canvas element. When the 2D canvas paints a white `fillRect` at opacity 1.0, the compositor performs `|dst − src|` = `|underlying_pixel − 255|`, which is the exact per-channel photographic inversion. The WebGL canvas continues to render normally underneath — there is no readback, no WebGL texture involved.

**Performance model:**  
The browser compositor blends the 2D canvas overlay with `mix-blend-mode: difference` on the GPU's compositing step, which is already happening every frame for the WebGL → UI layer stack. Adding one more blended layer is effectively free on any hardware that runs the WebGL scene at all.

**What the effect actually looks like:**  
- Elapsed 0–180 ms: white rect ramps from transparent to fully opaque → scene appears to invert (all colours negate, dark sky becomes bright white, planets invert to complementary colours)
- Elapsed 180–380 ms: fully inverted — the "membrane" moment
- Elapsed 380–550 ms: white rect fades to transparent while the canvas transitions from `mix-blend-mode: difference` back to normal and fills black — route push happens here
- This produces: `scene → inverted → black → new scene fades in`

**Revised performance question:**  
The only real mobile concern is whether the device's GPU compositor handles `mix-blend-mode: difference` on a layer that overlays a WebGL canvas. Testing is needed on low-end Android (Adreno 3xx era). Fallback: if `mix-blend-mode: difference` produces artifacts (some early Chrome Android versions had compositor bugs with blend modes on WebGL), substitute `mix-blend-mode: screen` with the white flash — this produces a bloom-to-white (not a true inversion, but still a distinctive portal-crossing feel). This decision can be made at runtime via a one-time compositor probe.

---

### Q4 — Portal for NASA exoplanet settlements (SurfaceViewPage path)  
No change from original spec. Option (b) — portal in `'surface:orbit'` view — is preferred for v1.

### Q5 — Portal orbit persistence  
Resolved: not needed. Seeded offset ensures stable position.

### Q6 — Multiple settled planets  
Resolved: each gets its own `LocalStepPortal` instance. Raycaster picks closest intersect.

---

## 15. Key Technical Constraints

- **No WormholePortal in the descent chain.** Portal is strictly for lateral/far jumps. Descent always uses iris wipe or the new inversion.
- **Bearing handoff must be set before `router.push`.** The arriving page reads `sceneTransitionStore.bearing` in `onMounted` — there's a race condition if the push happens before the store write. `depart()` is async and resolves when black; the bearing is written synchronously at the top of `depart()`, so the push that follows `await depart()` is safe.
- **`disposeScene()` must run before each route change.** `LocalStepPortal.vue`'s `onUnmounted` must dispose the portal geometry — it adds meshes directly to the parent scene, not to a Vue-managed sub-tree.
- **`uTime` uniform must be reset on remount.** If the user navigates away and back, the shader time must restart from 0 (or a deterministic offset) to avoid a "stale time" artifact.

---

*SCD Hub · Exotopia.org · GPL v3*
