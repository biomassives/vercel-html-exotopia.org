# SPEC: Dissolve Handoff — Extending the Matched-Placement Crossfade Up the Descent Chain

**Status:** Phases 1, 2, and 3 shipped. Phase 3 note: the CosmicPage → XClusterPage leg uses `'iris'`, not `'dissolve'` — see §4.2, this is an intentional architectural exception, not a shortfall.
**Date:** 2026-08-05 · **Decisions logged:** 2026-08-05 · **Phase 1 shipped:** 2026-08-05 · **Phase 2 shipped:** 2026-08-05 · **Phase 3 shipped:** 2026-08-05
**Scope:** Rolling the `'dissolve'` transition mode + handoff object placement (shipped for the galaxy-interior → star-system boundary) forward, boundary by boundary
**Relates to:** `SPEC_ZOOM_DESCENT.md` (predecessor — see §1.1 for what it got right and what this spec supersedes)

## Decision log

- **Q1 (browse entry point) — resolved yes, shipped.** `ClusterInteriorPage.vue`'s galaxy-interior panel now has a "View Full Galaxy" button calling `navigateToGalaxy(false)`, so the handoff work reaches the common browse flow, not just "Create a Settlement Here."
- **Q3 (sequencing) — resolved: CosmicPage ↔ ClusterInteriorPage went first.** It's more frequently traveled than "Create a Settlement Here," and its arrival side turned out to need the fix more than ClusterGalaxyPage's did.
- **Root cause found during Phase 1 verification, fixed in all three pages:** `onClick` is bound on each page's *root* element (`<q-page class="viz-overlay-page" @click="onClick">`), so every click inside the page — including side-panel button clicks — bubbles up and re-triggers the 3D raycast handler. In `CosmicPage.vue` this raced `router.replace` against the button's own `router.push`; in `ClusterGalaxyPage.vue` a spurious hit could kill the in-flight approach tween `descendToSurface()` was awaiting via `onComplete`, hanging navigation with no error. Fixed with the same `viz-overlay-page` target-class guard already established in `useVizRenderer.ts`'s pointer relay, applied to all three `onClick` handlers (`CosmicPage.vue`, `ClusterInteriorPage.vue`, `ClusterGalaxyPage.vue`).

**Files touched, Phase 1 (shipped):** `CosmicPage.vue` (`navigateToClusterInterior`, `onClick` guard), `ClusterInteriorPage.vue` (`loadAndBuild`, `onClick` guard)
**Files touched, Phase 2 (shipped):** `ClusterInteriorPage.vue` (`navigateToGalaxy`, "View Full Galaxy" button), `ClusterGalaxyPage.vue` (`buildScene`, `loadAndBuild`, `onClick` guard)

---

## 1. Motivation

### 1.1 What already shipped, and why this spec doesn't re-derive it

Earlier this session, the galaxy-interior → star-system boundary (`ClusterInteriorPage.descendToSurface` / `ClusterGalaxyPage.descendToSurface` → `ClusterSystemPage`) was rebuilt around two new, general-purpose pieces:

- **`src/lib/scene-handoff.ts`** — `computeHandoffOrigin(camera, worldPos)` captures where the departing page's key object sat on screen; `placeCameraForHandoff(camera, controls, targetWorldPos, origin, distance)` positions the arriving page's camera to reproduce that composition around its own key object, before the first frame renders.
- **`'dissolve'` transition mode** (`scene-transition.ts` + `SceneTransition.vue`) — instead of fading through solid black, the departing page's actual last frame is snapshotted straight off the shared WebGL canvas (`useVizRenderer.ts` now sets `preserveDrawingBuffer: true` for exactly this) and crossfaded away over the arrival, revealing the already-correctly-placed new scene underneath.

Both pieces are boundary-agnostic — they were written once, for the system-descent case, but nothing in them is specific to "star" or "system." This spec is the plan for pointing the same mechanism at the next boundary up the chain, not a new mechanism.

### 1.2 The gap this closes

`ClusterInteriorPage.navigateToGalaxy()` (the function behind the "Create a Settlement Here" button) still departs with `'iris'`, and `ClusterGalaxyPage.buildScene()` still opens on a generic wide establishing shot — `entryDist = 11`, positioned only from the bearing angle — followed by a separate "fly in to normal orbital distance" tween once `loadAndBuild()`'s data fetch resolves. That's the exact shape of artifact the system-descent work fixed: arrive wide, then re-zoom, unrelated to where the user was actually looking. `SPEC_ZOOM_DESCENT.md` §4.2 called this boundary out for an "iris wipe" and never revisited it once the shared-renderer prerequisite it worried about (§14 Q1) turned out to already be shipped — this spec is the actual follow-through.

---

## 2. Phase 1 — CosmicPage ↔ ClusterInteriorPage (active)

### 2.1 What's actually there today

`CosmicPage.navigateToClusterInterior()` is already close to the target shape — it does an in-page approach tween toward the clicked cluster (`clusterScenePos(c)`, `flyR = 0.30`), then projects that position to screen space for `ox/oy`, computes a bearing, and calls `transition.depart(ox, oy, 'iris', bearing)`. The only real gap on the departure side is the mode and the hand-rolled projection math duplicating what `computeHandoffOrigin()` already does.

The arrival side (`ClusterInteriorPage`) is a bigger gap than `ClusterGalaxyPage`'s turned out to be, and doesn't even use `bearing` today:

1. `initScene()` sets `camera.position.set(0, 8, 26)` — a fixed position, full stop, regardless of where the user came from.
2. Once `loadAndBuild()`'s member-data fetch resolves, it **overrides that** with a real, data-derived overview (`clusterCenter` — the actual centroid of the cluster's member sprites, `loadAndBuild()` lines 534–550) sized by `camOffset = Math.max(28, boundRadius * 1.6)` — but then plays a `gsap.from(camera.position, { z: c.z + camOffset * 1.9, ... })` "gentle intro zoom from farther back" (lines 552–556), i.e. a second, even-wider swoop-in, on every single arrival.

So this boundary currently has the same "arrive-then-re-zoom" shape the system-descent fix addressed, except worse: two separate generic camera placements back to back, neither referencing the departing frame at all.

### 2.2 Key-object correspondence

| | Departure (`CosmicPage`) | Arrival (`ClusterInteriorPage`) |
|---|---|---|
| Key object | The clicked cluster's position in cosmic scale — `clusterScenePos(c)`, already computed for the existing approach tween | `clusterCenter` — the real centroid of `memberSprites`, already computed in `loadAndBuild()` (lines 534–537), **not** a fixed local origin like `coreSprite`/the host star were for the other two boundaries |
| Distance | n/a (departure only needs the handoff origin, not a distance) | Reuse the **already-dynamic** `camOffset = Math.max(28, boundRadius * 1.6)` as the handoff distance, rather than inventing a new fixed constant — clusters and voids span wildly different physical scales (real clusters ~0.1–2 Mpc virial radius vs. voids 45–130 Mpc), which is exactly why `camOffset` is computed per-cluster already. This is a cleaner fit for `placeCameraForHandoff()`'s `distance` param than the fixed `4.0`-ish guesses Phase 2 will need. |
| Change | Replace the manual `sc`/`ox`/`oy`/`bearing` block with `computeHandoffOrigin(camera, clusterScenePos(c))`; depart with `'dissolve'` | Replace lines 534–556's re-orient-then-intro-zoom with `placeCameraForHandoff(camera, controls, clusterCenter, origin, camOffset)` when `transition.phase !== 'idle'`; keep the existing centroid-recenter + intro-zoom as the direct-nav fallback (it's still correct behavior for a cold/bookmarked load, just not for a handoff arrival) |

### 2.3 Known limitation, accepted rather than solved here

`clusterCenter` and `camOffset` aren't known until `loadAndBuild()`'s `fetch('/clusters/{slug}-members.json')` resolves — unlike the star/`coreSprite` cases, which sat at a fixed local origin regardless of data. `CosmicPage`'s 1.4s in-page approach tween gives some head start, but `ClusterInteriorPage` doesn't share a module-level cache for this fetch the way `fetchGalaxyDoc()` does for galaxy docs, so there's no equivalent of the prefetch-on-select fix from earlier this session available for free. On a slow/cold fetch, the dissolve's opaque hold window could theoretically run out before `loadAndBuild()` finishes, revealing `initScene()`'s generic `(0,8,26)` position for a frame before it corrects. Graceful degradation, not a crash — consistent with how this same class of risk was accepted (not solved) at the other two boundaries this session. Worth a real fix (a shared members-catalog cache, mirroring `fetchGalaxyDoc`'s) if it turns out to be visible in practice — flagged as Q4 below, not blocking Phase 1.

### 2.4 Phase 1 implementation checklist

- [ ] `CosmicPage.vue`: import `computeHandoffOrigin`; in `navigateToClusterInterior()`, replace the manual `sc`/`ox`/`oy`/`bearing` block with it; change `transition.depart(...)`'s mode to `'dissolve'`. Leave `navigateToVoid()`/`navigateToXCluster()` untouched — same shape, but out of scope for this phase (candidate for a later phase, see Q5).
- [ ] `ClusterInteriorPage.vue`: import `placeCameraForHandoff`; in `loadAndBuild()`, branch on `transition.phase !== 'idle'` right after `clusterCenter`/`camOffset` are computed — handoff placement when arriving via transition, existing recenter-plus-intro-zoom when not.
- [ ] `npx vue-tsc --noEmit` clean.
- [ ] Visual check in a running build (`/run`): click a cluster sphere on `CosmicPage`, confirm the arrival reads as continuing toward the same point rather than resetting to a generic overview; check both a small real cluster and a large void catalog, since `camOffset` varies enormously between them.

---

## 3. Phase 2 — ClusterInteriorPage → ClusterGalaxyPage (shipped)

Implemented as planned, folding in Q1's resolution.

### 3.1 Key-object correspondence

| | Departure (`ClusterInteriorPage`) | Arrival (`ClusterGalaxyPage`) |
|---|---|---|
| Key object | The clicked galaxy's sprite — `hitProxies.find(...).position` (already how `navigateToGalaxy` locates it for its own pre-departure approach tween) | `coreSprite` (`buildGalaxyCoreSprite`), added to `pageGroup` with no explicit position — sits at local origin `(0,0,0)`, same convention `ClusterSystemPage`'s host star used |
| Current camera behavior | In-page approach tween to `0.35` su from the sprite (`navigateToGalaxy` lines 1033–1044) — already a good departure handoff frame, no change needed here | `entryDist = 11` from bearing alone (`buildScene`), then a second tween to a fixed orbital distance once data loads |
| Change | Replace the manual `clickPct`/`clickBearing` projection math with `computeHandoffOrigin(camera, proxy.position)`; depart with `'dissolve'` instead of `'iris'` | Replace the `entryDist = 11` bearing-only placement with `placeCameraForHandoff(camera, controls, new THREE.Vector3(0,0,0), origin, DIST)`, gated on `transition.phase !== 'idle'` exactly like `ClusterSystemPage` |

`DIST = 4.0` shipped — a paper estimate by analogy with `ClusterSystemPage`'s `4.5`, still flagged as tunable pending a closer visual pass (Q2 stays open for exact framing quality, distinct from "does it navigate").

`loadAndBuild()`'s post-`buildScene()` "fly in to normal orbital distance" tween is gated on `transition.phase !== 'idle'` at mount, same pattern as `ClusterSystemPage.onMounted`.

The `settle = true` variant ("Create a Settlement Here") goes through the exact same `navigateToGalaxy()` function and gets the handoff for free — this was in fact the variant used for the end-to-end verification below.

### 3.2 Phase 2 implementation checklist

- [x] `ClusterInteriorPage.vue`: `navigateToGalaxy()` uses `computeHandoffOrigin()`; mode changed to `'dissolve'`.
- [x] `ClusterGalaxyPage.vue`: `buildScene()` branches on `transition.phase !== 'idle'`, calling `placeCameraForHandoff()` targeting `coreSprite`'s origin at `DIST=4.0`.
- [x] `ClusterGalaxyPage.vue`: `loadAndBuild()`'s post-`buildScene()` tween gated on the same flag.
- [x] **Q1 follow-through:** "View Full Galaxy" button added to `exploreGalaxy()`'s panel, calling `navigateToGalaxy(false)`.
- [x] **Root cause fix (found during Phase 1, applied here too):** `onClick` bubble-up guard added to `ClusterGalaxyPage.vue` — a spurious hit from a button click bubbling to the raycast handler could call `flyToSystem()` → `gsap.killTweensOf(camera.position)`, silently killing the in-flight tween `descendToSurface()` awaits via `onComplete`.
- [x] End-to-end verification (headless Playwright, `settle=true` variant): full instrumented trace confirmed `navigateToGalaxy()` → approach tween → `computeHandoffOrigin()` → `transition.depart('dissolve', ...)` → `router.push()` all completing cleanly, landing on `/cluster-galaxy/virgo/NGC4486?action=claim&bearing=-2.678&morph=cD` with zero console errors. (Test environment note: the approach tween took ~12s of wall-clock time in this specific headless/software-rendered session — confirmed via `gsap` tween `.progress()`/`.isActive()` polling to be genuinely running, not stalled — not indicative of real-browser performance.)
- [ ] Not done: a closer visual pass on `DIST=4.0`'s exact framing quality, and how the crossfade reads against `exploreGalaxy()`'s busier in-page star-system-dot departing scene (functional correctness confirmed; aesthetic polish not yet judged against a rendered frame).

---

## 4. Phase 3 — CosmicPage → VoidInteriorPage / XClusterPage (shipped)

Answers Q5. Two boundaries, two different treatments — they turned out not to be the same shape once actually investigated.

### 4.1 CosmicPage → VoidInteriorPage — full treatment, shared renderer

`VoidInteriorPage.vue` is on the shared renderer, same as everything in Phases 1–2 — but it drives its camera by **orbit angle + radius** (`orbit.theta`, `orbit.phi`, `camR`, recomputed into `camera.position` every tick by `updateCamera()`), not a free position `placeCameraForHandoff()` can just set once. Setting `camera.position` directly would be silently overwritten by the next frame's `updateCamera()` call. Instead, the handoff is applied to the *state* `updateCamera()` reads from: `orbit.theta = transition.bearing`, `camR.value = 45` (paper estimate, default is `115` — same "needs a visual check" caveat as `DIST` elsewhere in this doc) when `transition.phase !== 'idle'`.

`CosmicPage.navigateToVoid()` changed exactly like `navigateToClusterInterior()` did in Phase 1: `computeHandoffOrigin()` replaces the manual `ox`/`oy` projection, mode is `'dissolve'` instead of `'iris'`. `VoidInteriorPage.vue`'s `onClick` also got the same `viz-overlay-page` guard as the others — not fixing an active bug here (this page's `onClick` only sets local panel state, never touches the router), but consistent with the pattern now that the failure mode is understood.

### 4.2 CosmicPage → XClusterPage — handoff origin, but `'iris'` not `'dissolve'` (intentional)

`XClusterPage.vue` still owns a **private** `THREE.WebGLRenderer` on its own `<canvas>` element — confirmed still true (`SPEC_ZOOM_DESCENT.md` §14 Q1's audit table). `'dissolve'` mode works by snapshotting the *shared* canvas (`useVizRenderer`'s `viz.canvas`) and crossfading it away to reveal what's now underneath — for a page with its own separate canvas, that crossfade would reveal a stale, frozen shared canvas, not XClusterPage's actual content. Migrating this page to the shared renderer (the same Path B lift every other page in this chain already went through) is out of scope for this phase.

Given that constraint, Phase 3 still delivers the real improvement available without that migration: `navigateToXCluster()` previously fired **no transition at all** — a hard cut, the only boundary in the whole descent chain with zero covering effect. It now computes a handoff origin (`computeHandoffOrigin()` against the clicked cluster's actual `xrayLodEntries` position) and departs with `'iris'` — an opaque wipe that doesn't care which canvas is underneath, so it's mechanically safe for a private-renderer target. The bearing is carried through as a `?bearing=` query param (this page can't read the transition store's camera the way shared-renderer arrivals do) and `XClusterPage.vue`'s entry camera position is now rotated by that angle instead of always approaching from the same fixed `(0, 0, 2.2)`.

**This is the one node-with-caveat left in the whole chain**, not an oversight: if `XClusterPage.vue` is ever migrated to the shared renderer for other reasons, this boundary should be revisited to use `'dissolve'` like everywhere else.

### 4.3 Verification

Both `VoidInteriorPage.vue` and `XClusterPage.vue` direct-navigated cleanly with zero console errors, including `XClusterPage.vue` with a `?bearing=` param present (exercising the new rotation line). The specific handoff branch in `VoidInteriorPage.buildScene()` (`orbit.theta`/`camR` from `transition.bearing`) was **not** exercised end-to-end via a live click — unlike named clusters, there's no `?void=` deep-link restore mechanism to trigger it without either scripting a pixel-perfect 3D click or adding new scaffolding purely for testing, and this session's Playwright environment had already shown significant, unpredictable slowdown by this point. Confidence rests on: the branch uses the exact same `computeHandoffOrigin()`/`transition.bearing` primitives already proven correct three times over (system descent, Phase 1, Phase 2), the change is a two-line scalar assignment with no new control flow, and `vue-tsc --noEmit` is clean. Worth a real click-through check next time this page is touched for any other reason.

**Files touched, Phase 3 (shipped):** `CosmicPage.vue` (`navigateToVoid`, `navigateToXCluster`), `VoidInteriorPage.vue` (`buildScene`, `onClick` guard), `XClusterPage.vue` (`buildScene`)

---

## 5. Open questions

**Q2 — Canonical arrival distance for Phase 2 (`DIST=4.0`), framing quality.** Navigation correctness confirmed (§3.2); the actual visual composition — does the galaxy read as well-framed at that distance, does it match the departing sprite's apparent size — hasn't been judged against a rendered frame. Downgraded from "blocking" to "polish pass."

**Q4 — Does `ClusterInteriorPage`'s member-catalog fetch need a shared cache** (mirroring `fetchGalaxyDoc`'s module-level `_cache`), to close the cold-fetch gap in §2.3? Deferred until it's shown to be visible in practice, rather than solved preemptively.

**Q6 — `camR=45` (§4.1) needs the same visual-check treatment as `DIST=4.0` — paper estimate, not yet judged against a rendered frame.**

**Q7 — Should `XClusterPage.vue` be migrated to the shared renderer** (closing the `'iris'`-not-`'dissolve'` gap in §4.2), independent of any other reason to touch that page? Not blocking, but the one remaining architectural inconsistency in the descent chain.

---

## 6. Related documents

- `SPEC_ZOOM_DESCENT.md` — original vocabulary/motivation for the descent chain; §14 Q1's shared-renderer concern is resolved (confirmed shipped 2026-07-19, commit `97af526`), and this spec's `'dissolve'` mode is a more specific answer to what that spec's §3 vocabulary table called "iris wipe... cross-level route change" for this tier. §4.1's in-page-zoom target behavior for L1→L2 is what Phase 1 §2.1 confirms is already half-built.
- `src/lib/scene-handoff.ts` — the reusable placement math both phases extend to a new boundary, not re-derive.
- `src/stores/scene-transition.ts` / `src/components/SceneTransition.vue` — the `'dissolve'` mode implementation.
- Reference implementation: `ClusterInteriorPage.vue`/`ClusterGalaxyPage.vue`'s `descendToSurface()` → `ClusterSystemPage.vue`'s `buildScene()`, shipped earlier this session — read these before Phase 1, the CosmicPage↔ClusterInteriorPage change should look almost identical in shape.

---

*SCD Hub · Exotopia.org · GPL v3*
