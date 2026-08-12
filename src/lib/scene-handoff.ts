import * as THREE from 'three'

/**
 * scene-handoff — shared math for the 'dissolve' transition mode.
 *
 * The departing page computes where its key object (the thing the user just
 * selected) sits on screen right before the camera cut. The arriving page
 * uses that same descriptor to place its own camera so the object it's
 * revealing (the same thing, now viewed from inside) lands in the same
 * screen-space spot at a comparable scale — so the crossfade in
 * SceneTransition.vue's 'dissolve' mode reads as one composition resolving
 * into another, not a hard cut to an unrelated establishing shot.
 *
 * Both pages already run on the shared renderer (useVizRenderer) but build
 * their own scene content in a fresh, page-local coordinate space — there is
 * no shared world position to carry across a route change, only the
 * screen-space/angle descriptor below.
 */

export interface HandoffOrigin {
  /** % of viewport width where the key object sat when the camera departed */
  ox: number
  /** % of viewport height */
  oy: number
  /** radians — angle of ox/oy from viewport center, reused as the arrival approach angle */
  bearing: number
}

/** Compute the departure handoff descriptor from a camera and a world-space point. */
export function computeHandoffOrigin(
  camera: THREE.PerspectiveCamera,
  worldPos: THREE.Vector3,
): HandoffOrigin {
  const sc = worldPos.clone().project(camera)
  const ox = (sc.x + 1) / 2 * 100
  const oy = (1 - sc.y) / 2 * 100
  const bearing = Math.atan2(oy / 100 - 0.5, ox / 100 - 0.5)
  return { ox, oy, bearing }
}

/**
 * Position `camera` (and `controls.target`, if given) so `targetWorldPos` —
 * the arriving scene's key object, e.g. a system's host star at its local
 * origin — reproduces the departing frame's composition: approached from
 * `origin.bearing`, at `distance` scene units away. Call this synchronously
 * during the arriving page's scene build, before the first frame renders —
 * the 'dissolve' overlay is still fully opaque at that point (see
 * SceneTransition.vue), so there is no visible pop between the placement
 * below and the crossfade that reveals it.
 *
 * The elevation factor (0.3) is a fixed "arrive from slightly above" bias,
 * matching the approach angle every other entry point in this chain already
 * uses (e.g. ClusterGalaxyPage's bearing-only entry) — bearing alone only
 * encodes an azimuth, not a full 3D direction, so this keeps arrivals from
 * ever coming in dead level with the target.
 */
export function placeCameraForHandoff(
  camera: THREE.PerspectiveCamera,
  controls: { target: THREE.Vector3; update: () => void } | null,
  targetWorldPos: THREE.Vector3,
  origin: HandoffOrigin,
  distance: number,
): void {
  const b = origin.bearing
  camera.position.set(
    targetWorldPos.x + Math.sin(b) * distance,
    targetWorldPos.y + distance * 0.3,
    targetWorldPos.z + Math.cos(b) * distance,
  )
  camera.lookAt(targetWorldPos)
  camera.updateProjectionMatrix()
  if (controls) {
    controls.target.copy(targetWorldPos)
    controls.update()
  }
}
